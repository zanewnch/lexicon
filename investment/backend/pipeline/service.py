"""
Pipeline service — 訊號比對 + 寫入 Candidate。

支援的訊號：
  - ma_cross : 均線黃金交叉（短期 MA 上穿長期 MA，且當前價在短期 MA 之上）
  - macd     : MACD 翻紅（MACD line > signal line，且 histogram 為正）
  - kd       : KD 低檔黃金交叉（K 上穿 D 且兩者在 50 以下）
  - breakout : 突破 N 日新高（最近收盤 >= 前 N 根的最高收盤）

所有訊號計算純函式化，不依賴 Shioaji 之外的服務。
"""
from __future__ import annotations

import logging
from typing import Iterable

from market.quote import QuoteService
from trading_core.models import Candidate

logger = logging.getLogger(__name__)


# ---------- Indicator helpers ----------

def _sma(data: list[float], period: int) -> list[float]:
    out: list[float] = []
    for i in range(len(data)):
        if i + 1 < period:
            out.append(0.0)
        else:
            window = data[i + 1 - period : i + 1]
            out.append(sum(window) / period)
    return out


def _ema(data: list[float], period: int) -> list[float]:
    if not data:
        return []
    k = 2 / (period + 1)
    out = [data[0]]
    for i in range(1, len(data)):
        out.append(data[i] * k + out[-1] * (1 - k))
    return out


def _macd(closes: list[float], fast: int, slow: int, signal: int) -> tuple[list[float], list[float], list[float]]:
    if len(closes) < slow + signal:
        zeros = [0.0] * len(closes)
        return zeros, zeros, zeros
    ema_fast = _ema(closes, fast)
    ema_slow = _ema(closes, slow)
    macd_line = [a - b for a, b in zip(ema_fast, ema_slow)]
    signal_line = _ema(macd_line, signal)
    hist = [m - s for m, s in zip(macd_line, signal_line)]
    return macd_line, signal_line, hist


def _kd(highs: list[float], lows: list[float], closes: list[float], period: int) -> tuple[list[float], list[float]]:
    n = len(closes)
    if n < period:
        return [50.0] * n, [50.0] * n
    k_vals: list[float] = []
    d_vals: list[float] = []
    prev_k = 50.0
    prev_d = 50.0
    for i in range(n):
        if i + 1 < period:
            k_vals.append(50.0)
            d_vals.append(50.0)
            continue
        h = max(highs[i + 1 - period : i + 1])
        l = min(lows[i + 1 - period : i + 1])
        rsv = ((closes[i] - l) / (h - l) * 100) if h != l else 50.0
        k = prev_k * 2 / 3 + rsv / 3
        d = prev_d * 2 / 3 + k / 3
        k_vals.append(k)
        d_vals.append(d)
        prev_k, prev_d = k, d
    return k_vals, d_vals


# ---------- Signal detectors ----------

def _check_ma_cross(closes: list[float], short: int, long_: int) -> bool:
    if len(closes) < long_ + 2:
        return False
    ma_s = _sma(closes, short)
    ma_l = _sma(closes, long_)
    return ma_s[-2] <= ma_l[-2] and ma_s[-1] > ma_l[-1] and closes[-1] > ma_s[-1]


def _check_macd(closes: list[float], fast: int, slow: int, signal: int) -> bool:
    if len(closes) < slow + signal + 1:
        return False
    macd_line, signal_line, hist = _macd(closes, fast, slow, signal)
    return macd_line[-1] > signal_line[-1] and hist[-1] > 0 and hist[-2] <= 0


def _check_kd(highs: list[float], lows: list[float], closes: list[float], period: int) -> bool:
    if len(closes) < period + 2:
        return False
    k, d = _kd(highs, lows, closes, period)
    return k[-2] <= d[-2] and k[-1] > d[-1] and k[-1] < 50 and d[-1] < 50


def _check_breakout(closes: list[float], lookback: int) -> bool:
    if len(closes) < lookback + 1:
        return False
    return closes[-1] >= max(closes[-lookback - 1 : -1])


# ---------- Service ----------

class PipelineService:

    SIGNAL_KEYS = ('ma_cross', 'macd', 'kd', 'breakout')

    def __init__(self):
        self._quote = QuoteService()

    def match(
        self,
        symbols: list[str],
        signals: list[str],
        params: dict,
        mode: str,
        lookback_days: int,
    ) -> dict:
        bars_limit = max(lookback_days, 60) + 5
        results = []
        matched_count = 0

        for symbol in symbols:
            try:
                bars = self._quote.get_kbars(symbol, period='Day', limit=bars_limit)
            except Exception as exc:  # pragma: no cover
                logger.warning('pipeline.match: %s kbars failed: %s', symbol, exc)
                bars = []

            if not bars:
                results.append({
                    'symbol': symbol,
                    'signalsHit': [],
                    'matched': False,
                    'lastPrice': None,
                })
                continue

            closes = [b['close'] for b in bars]
            highs = [b['high'] for b in bars]
            lows = [b['low'] for b in bars]

            hits: list[str] = []
            for sig in signals:
                if sig == 'ma_cross':
                    if _check_ma_cross(closes,
                                       int(params.get('ma_short', 20)),
                                       int(params.get('ma_long', 60))):
                        hits.append(sig)
                elif sig == 'macd':
                    if _check_macd(closes,
                                   int(params.get('macd_fast', 12)),
                                   int(params.get('macd_slow', 26)),
                                   int(params.get('macd_signal', 9))):
                        hits.append(sig)
                elif sig == 'kd':
                    if _check_kd(highs, lows, closes, int(params.get('kd_period', 9))):
                        hits.append(sig)
                elif sig == 'breakout':
                    if _check_breakout(closes, int(params.get('breakout_lookback', 20))):
                        hits.append(sig)

            if mode == 'all':
                matched = len(hits) == len(signals) and len(signals) > 0
            else:
                matched = len(hits) > 0

            if matched:
                matched_count += 1

            results.append({
                'symbol': symbol,
                'signalsHit': hits,
                'matched': matched,
                'lastPrice': closes[-1],
            })

        return {
            'results': results,
            'matchedCount': matched_count,
            'totalCount': len(symbols),
        }

    def commit(self, items: Iterable[dict], meta: dict) -> dict:
        ids: list[int] = []
        for item in items:
            symbol = str(item.get('symbol', '')).strip()
            if not symbol:
                continue
            cand_meta = {
                'source': 'pipeline',
                'shares': item.get('shares'),
                'estimatedPrice': item.get('estimatedPrice'),
                'stopLossPrice': item.get('stopLossPrice'),
                'takeProfitPrice': item.get('takeProfitPrice'),
                'pipeline': meta,
            }
            cand = Candidate.objects.create(
                symbol=symbol,
                score=None,
                meta=cand_meta,
                consumed=False,
            )
            ids.append(cand.id)
        return {'candidateIds': ids, 'count': len(ids)}

    def list_pending(self, limit: int = 50) -> dict:
        qs = Candidate.objects.filter(consumed=False).order_by('-created_at')[:limit]
        return {
            'candidates': [
                {'id': c.id, 'symbol': c.symbol, 'meta': c.meta}
                for c in qs
            ]
        }
