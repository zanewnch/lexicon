"""
Nightly batch: compute trend-style tags (多頭排列 / 空頭排列 / 盤整 /
爆量突破) for a subset of the universe and persist them as StockTrendTag
rows. Run after market close.

Usage:
    python manage.py rebuild_tags                 # top 500 by turnover
    python manage.py rebuild_tags --top 200       # cap to top 200
    python manage.py rebuild_tags --symbols 2330 2317
"""
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.core.management.base import BaseCommand

from market.quote import QuoteService
from market.technicals import (
    compute_technicals,
    detect_ma_alignment,
    detect_volume_breakout,
)
from market.twse import TWSEService
from screener.models import StockTrendTag

logger = logging.getLogger(__name__)

TREND_BULL = '多頭排列'
TREND_BEAR = '空頭排列'
TREND_RANGE = '盤整'

FLAG_VOLUME_BREAKOUT = '爆量突破'


class Command(BaseCommand):
    help = 'Recompute trend/flag tags for top-turnover stocks and persist to DB.'

    def add_arguments(self, parser):
        parser.add_argument('--top', type=int, default=500,
                            help='How many top-turnover stocks to process (default 500).')
        parser.add_argument('--symbols', nargs='+',
                            help='Explicit symbol list (overrides --top).')
        parser.add_argument('--workers', type=int, default=6,
                            help='Parallel fetch workers (default 6).')

    def handle(self, *args, **opts):
        symbols = opts.get('symbols')
        if symbols:
            codes = [s.strip() for s in symbols if s.strip()]
        else:
            stocks = TWSEService().get_all_stocks()
            stocks.sort(key=lambda s: s.get('turnover', 0), reverse=True)
            codes = [s['code'] for s in stocks[:opts['top']]]

        if not codes:
            self.stdout.write(self.style.WARNING('No symbols to process.'))
            return

        self.stdout.write(f'Rebuilding trend tags for {len(codes)} symbols…')

        quote = QuoteService()
        ok = 0
        skipped = 0

        def _process(code: str) -> dict | None:
            try:
                bars = quote.get_kbars(code, period='Day', limit=70)
                if not bars or len(bars) < 20:
                    return None
                closes = [b['close'] for b in bars]
                volumes = [b['volume'] for b in bars]
                tech = compute_technicals(closes)
                last_close = closes[-1]
                bull = detect_ma_alignment(last_close, tech['ma5'], tech['ma10'], tech['ma20'])
                bear = (
                    last_close < tech['ma5'] < tech['ma10'] < tech['ma20']
                    if all([tech['ma5'], tech['ma10'], tech['ma20']]) else False
                )
                trend = TREND_BULL if bull else TREND_BEAR if bear else TREND_RANGE

                flags: list[str] = []
                if detect_volume_breakout(closes, volumes):
                    flags.append(FLAG_VOLUME_BREAKOUT)

                recent_vols = [v for v in volumes[-5:] if v and v > 0]
                avg_vol_5d = sum(recent_vols) / len(recent_vols) if recent_vols else None

                return {
                    'symbol': code,
                    'trend': trend,
                    'ma5': tech['ma5'],
                    'ma20': tech['ma20'],
                    'ma60': tech['ma60'],
                    'rsi14': tech['rsi14'],
                    'flags': flags,
                    'avg_volume_5d': avg_vol_5d,
                }
            except Exception:
                logger.exception('rebuild_tags failed for %s', code)
                return None

        with ThreadPoolExecutor(max_workers=opts['workers']) as pool:
            futures = {pool.submit(_process, c): c for c in codes}
            for fut in as_completed(futures):
                row = fut.result()
                if row is None:
                    skipped += 1
                    continue
                StockTrendTag.objects.update_or_create(
                    symbol=row['symbol'],
                    defaults={k: v for k, v in row.items() if k != 'symbol'},
                )
                ok += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. updated={ok}, skipped={skipped}'
        ))
