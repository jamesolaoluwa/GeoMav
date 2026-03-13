"""Tests for the in-process TTL cache module."""

import time
import pytest

from app.cache import get, set, invalidate_prefix, clear


class TestCache:
    def setup_method(self):
        clear()

    def test_set_and_get(self):
        set("key1", {"data": 42})
        assert get("key1") == {"data": 42}

    def test_miss_returns_none(self):
        assert get("nonexistent") is None

    def test_expired_entry_returns_none(self):
        set("key2", "value", ttl=0.01)
        time.sleep(0.02)
        assert get("key2") is None

    def test_invalidate_prefix(self):
        set("dashboard:biz1:all", "d1")
        set("dashboard:biz1:daily", "d2")
        set("visibility:biz1:all", "v1")

        invalidate_prefix("dashboard:")
        assert get("dashboard:biz1:all") is None
        assert get("dashboard:biz1:daily") is None
        assert get("visibility:biz1:all") == "v1"

    def test_clear_removes_all(self):
        set("a", 1)
        set("b", 2)
        clear()
        assert get("a") is None
        assert get("b") is None

    def test_overwrite_key(self):
        set("key", "old")
        set("key", "new")
        assert get("key") == "new"
