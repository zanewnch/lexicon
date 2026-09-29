import time
from threading import Lock


class ServiceUnavailable(Exception):
    """Shioaji 連線失敗或 API 回傳異常時拋出。"""
    pass


class CacheManager:
    """Thread-safe TTL cache，所有 service 共用的基底。"""

    def __init__(self, ttl: int = 60):
        self._cache: dict[str, tuple[float, object]] = {}
        self._lock = Lock()
        self.ttl = ttl

    def get(self, key: str):
        with self._lock:
            entry = self._cache.get(key)
            if entry and time.time() - entry[0] < self.ttl:
                return entry[1]
        return None

    def set(self, key: str, data: object):
        with self._lock:
            self._cache[key] = (time.time(), data)

    def clear(self):
        with self._lock:
            self._cache.clear()
