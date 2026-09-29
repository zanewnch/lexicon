"""
Management command: run WatchdogService.check() in a loop.

Usage:
    python manage.py watchdog_loop [--interval 10] [--stop-loss -5] [--take-profit 10]

Polls open positions at a fixed interval, pulls live prices via
QuoteService, and emits ExitSignals when stop-loss / take-profit triggers.
Stops cleanly on Ctrl+C.
"""
import logging
import signal
import time
from datetime import datetime, timezone

from django.core.management.base import BaseCommand

from watchdog.service import WatchdogService
from trading_core.enums import ExecutionVenue

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Continuously monitor open positions and emit ExitSignals.'

    def add_arguments(self, parser):
        parser.add_argument('--interval', type=float, default=10.0,
                            help='Seconds between checks (default: 10)')
        parser.add_argument('--stop-loss', type=float, default=None,
                            help='Stop-loss percent (e.g. -5)')
        parser.add_argument('--take-profit', type=float, default=None,
                            help='Take-profit percent (e.g. 10)')
        parser.add_argument('--max-iter', type=int, default=0,
                            help='Stop after N iterations (0 = run forever)')
        parser.add_argument('--venue', choices=ExecutionVenue.values,
                            default=ExecutionVenue.PAPER,
                            help='Position venue to monitor (default: paper)')

    def handle(self, *args, interval, stop_loss, take_profit, max_iter, venue, **options):
        svc = WatchdogService()
        stop = {'requested': False}

        def on_sigint(_signum, _frame):
            stop['requested'] = True
            self.stdout.write(self.style.WARNING('\n[watchdog] stop requested, finishing current tick…'))

        signal.signal(signal.SIGINT, on_sigint)
        signal.signal(signal.SIGTERM, on_sigint)

        self.stdout.write(self.style.SUCCESS(
            f'[watchdog] starting loop venue={venue} interval={interval}s sl={stop_loss} tp={take_profit}'
        ))

        it = 0
        while not stop['requested']:
            it += 1
            ts = datetime.now(timezone.utc).isoformat(timespec='seconds')
            try:
                signals = svc.check(
                    prices=None,
                    stop_loss_pct=stop_loss,
                    take_profit_pct=take_profit,
                    venue=venue,
                )
                self.stdout.write(f'[watchdog] {ts} tick #{it} produced {len(signals)} signals')
            except Exception:
                logger.exception('[watchdog] tick failed')

            if max_iter and it >= max_iter:
                self.stdout.write(self.style.SUCCESS(f'[watchdog] reached max-iter={max_iter}, exiting'))
                break

            # Sleep in small chunks so Ctrl+C is responsive
            remaining = interval
            while remaining > 0 and not stop['requested']:
                chunk = min(0.5, remaining)
                time.sleep(chunk)
                remaining -= chunk

        self.stdout.write(self.style.SUCCESS('[watchdog] loop ended'))
