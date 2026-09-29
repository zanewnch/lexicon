"""
Shared JSON file-backed repository with thread-safe read/write.

Note: threading.Lock protects within a single process only.
For multi-worker deployments, file-level locking would be needed.
"""

import json
import threading
from pathlib import Path


class JSONFileRepository:
    """Thread-safe JSON file storage for list-of-dict data."""

    def __init__(self, path: Path):
        self._path = path
        self._lock = threading.Lock()

    def read(self) -> list[dict]:
        with self._lock:
            with open(self._path, 'r', encoding='utf-8') as f:
                return json.load(f)

    def write(self, data: list[dict]):
        with self._lock:
            with open(self._path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
