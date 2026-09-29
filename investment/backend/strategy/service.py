"""
Strategy service — JSON file-backed CRUD for trading strategies.
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from core.json_repo import JSONFileRepository

logger = logging.getLogger(__name__)

_repo = JSONFileRepository(
    Path(os.environ['LEXICON_INVESTMENT_DATA_DIR']) / 'strategies.json'
    if os.environ.get('LEXICON_INVESTMENT_DATA_DIR')
    else Path(__file__).resolve().parent / 'data' / 'strategies.json'
)


class StrategyService:
    """JSON 檔案儲存的交易策略 CRUD 服務。"""

    def list(self) -> list[dict]:
        """Return all strategies."""
        return _repo.read()

    def get(self, strategy_id: str) -> dict | None:
        """Return a single strategy by ID, or None if not found."""
        for s in _repo.read():
            if s['id'] == strategy_id:
                return s
        return None

    def create(self, payload: dict) -> dict:
        """Create and persist a new strategy with generated ID and timestamps."""
        strategies = _repo.read()
        now = datetime.now(timezone.utc).isoformat()
        s = {
            'id': uuid.uuid4().hex[:12],
            'name': payload.get('name', '未命名策略'),
            'description': payload.get('description', ''),
            'enabled': payload.get('enabled', True),
            'targets': payload.get('targets', []),
            'period': payload.get('period'),
            'conditions': payload.get('conditions', []),
            'logic': payload.get('logic', 'AND'),
            'action': payload.get('action', 'notify'),
            'created_at': now,
            'updated_at': now,
            'last_triggered_at': None,
            'trigger_count': 0,
        }
        strategies.append(s)
        _repo.write(strategies)
        return s

    def update(self, strategy_id: str, payload: dict) -> dict | None:
        """Apply editable fields to an existing strategy and save."""
        strategies = _repo.read()
        for i, s in enumerate(strategies):
            if s['id'] == strategy_id:
                editable = {'name', 'description', 'enabled', 'targets', 'period', 'conditions', 'logic', 'action'}
                for key in editable:
                    if key in payload:
                        s[key] = payload[key]
                s['updated_at'] = datetime.now(timezone.utc).isoformat()
                strategies[i] = s
                _repo.write(strategies)
                return s
        return None

    def delete(self, strategy_id: str) -> bool:
        """Delete a strategy. Returns False if ID not found."""
        strategies = _repo.read()
        filtered = [s for s in strategies if s['id'] != strategy_id]
        if len(filtered) == len(strategies):
            return False
        _repo.write(filtered)
        return True

    def toggle(self, strategy_id: str) -> dict | None:
        """Flip the ``enabled`` field of a strategy. Returns updated strategy or None."""
        strategies = _repo.read()
        for i, s in enumerate(strategies):
            if s['id'] == strategy_id:
                s['enabled'] = not s['enabled']
                s['updated_at'] = datetime.now(timezone.utc).isoformat()
                strategies[i] = s
                _repo.write(strategies)
                return s
        return None
