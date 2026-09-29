"""
Scanner — selection stage of the trading pipeline.

Two modes:
  1. Explicit symbol list (skeleton mode, supplied by caller).
  2. Funnel mode — wraps the existing screener.FunnelService three-layer
     pipeline (Layer 2 quantitative filter + Layer 3 technical scoring),
     persists the survivors as ranked Candidates.
"""
import logging

from trading_core.models import Candidate

logger = logging.getLogger(__name__)


class ScannerService:
    """Produces Candidate rows from a screening pass."""

    def __init__(self):
        self._funnel = None

    @property
    def funnel(self):
        # Lazy import so that explicit-list mode does not require Shioaji.
        if self._funnel is None:
            from screener.service import FunnelService
            self._funnel = FunnelService()
        return self._funnel

    def run(self, symbols: list[str], meta: dict | None = None) -> list[Candidate]:
        """Persist a Candidate row for each symbol. Returns the created rows."""
        meta = meta or {}
        created: list[Candidate] = []
        for sym in symbols:
            sym = (sym or '').strip()
            if not sym:
                continue
            cand = Candidate.objects.create(symbol=sym, meta=meta)
            created.append(cand)
        logger.info('Scanner run produced %d candidates', len(created))
        return created

    def run_from_funnel(
        self,
        codes: list[str],
        filters: dict | None = None,
        top_n: int = 10,
        min_score: int = 0,
    ) -> list[Candidate]:
        """Run the existing 3-layer funnel and persist top-N as Candidates.

        codes:     starting universe (typically a theme/sector member list)
        filters:   optional Layer 2 quantitative filters
                   (pe_max / pb_max / mom_pct_min / yoy_pct_min / inst_net_min)
        top_n:     how many top-scoring symbols to keep
        min_score: discard any with score below this threshold (Layer 3 score is 0-3)
        """
        if not codes:
            return []

        narrowed = codes
        if filters:
            layer2 = self.funnel.screen_layer2(codes, filters)
            narrowed = [row['code'] for row in layer2]
            logger.info(
                'Scanner funnel: layer2 narrowed %d -> %d (filters=%s)',
                len(codes), len(narrowed), filters,
            )
            if not narrowed:
                return []

        layer3 = self.funnel.screen_layer3(narrowed)
        ranked = [r for r in layer3 if r['score'] >= min_score][:top_n]
        logger.info(
            'Scanner funnel: layer3 produced %d ranked, taking top %d',
            len(layer3), len(ranked),
        )

        created: list[Candidate] = []
        for row in ranked:
            meta = {k: v for k, v in row.items() if k not in ('code', 'score')}
            meta['source'] = 'funnel'
            cand = Candidate.objects.create(
                symbol=row['code'],
                score=float(row['score']),
                meta=meta,
            )
            created.append(cand)
        return created

    def list_candidates(self, only_unconsumed: bool = True) -> list[dict]:
        qs = Candidate.objects.all()
        if only_unconsumed:
            qs = qs.filter(consumed=False)
        return [
            {
                'id': c.id,
                'symbol': c.symbol,
                'score': c.score,
                'meta': c.meta,
                'createdAt': c.created_at.isoformat(),
                'consumed': c.consumed,
            }
            for c in qs
        ]

    def discard_cancelled_simulation_candidates(self, candidate_ids: list[int]) -> int:
        """Discard unused candidates whose only orders were cancelled simulation orders."""
        from django.db import transaction
        from trading_core.enums import ExecutionVenue, OrderStatus
        from trading_core.models import Order, Trade

        with transaction.atomic():
            candidates = list(Candidate.objects.select_for_update().filter(id__in=candidate_ids))
            if len(candidates) != len(candidate_ids) or any(c.consumed for c in candidates):
                raise ValueError('候選不存在或已使用')

            orders = list(Order.objects.select_for_update().filter(candidate_id__in=candidate_ids))
            linked_ids = {order.candidate_id for order in orders}
            if linked_ids != set(candidate_ids) or any(
                order.venue != ExecutionVenue.BROKER_SIMULATION
                or order.status != OrderStatus.CANCELLED
                or order.filled_qty != 0
                for order in orders
            ) or Trade.objects.filter(order__candidate_id__in=candidate_ids).exists():
                raise ValueError('只能移除零成交且委託已全部取消的模擬候選')

            Candidate.objects.filter(id__in=candidate_ids).delete()
            return len(candidates)
