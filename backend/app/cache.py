"""In-process TTL cache for dashboard read endpoints. No external dependencies."""

import time
import threading
from typing import Any

_store: dict[str, tuple[Any, float]] = {}
_lock = threading.Lock()

DEFAULT_TTL = 60.0


def get(key: str) -> Any | None:
    with _lock:
        entry = _store.get(key)
        if entry and time.monotonic() < entry[1]:
            return entry[0]
        _store.pop(key, None)
        return None


def set(key: str, value: Any, ttl: float = DEFAULT_TTL):
    with _lock:
        _store[key] = (value, time.monotonic() + ttl)


def invalidate_prefix(prefix: str):
    with _lock:
        for k in list(_store):
            if k.startswith(prefix):
                del _store[k]


def clear():
    with _lock:
        _store.clear()
