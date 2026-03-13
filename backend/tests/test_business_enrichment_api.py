"""API tests for PUT /api/business and POST /api/enrich-business endpoints.
Uses a fake Supabase client — no real database, no real network."""

from unittest.mock import MagicMock, AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


# ---------------------------------------------------------------------------
# Fake Supabase helpers
# ---------------------------------------------------------------------------

class FakeExecuteResult:
    """Mimics the .execute() return from supabase-py."""
    def __init__(self, data=None, count=None):
        self.data = data or []
        self.count = count


class FakeQueryBuilder:
    """Chainable fake for supabase table queries."""
    def __init__(self, rows: list[dict]):
        self._rows = rows
        self._filters: dict = {}

    def select(self, *args, **kwargs):
        return self

    def eq(self, col, val):
        self._filters[col] = val
        return self

    def limit(self, n):
        return self

    def order(self, *args, **kwargs):
        return self

    def update(self, fields):
        for row in self._rows:
            row.update(fields)
        self._update_fields = fields
        return self

    def execute(self):
        filtered = self._rows
        for col, val in self._filters.items():
            filtered = [r for r in filtered if r.get(col) == val]
        return FakeExecuteResult(data=filtered)


class FakeSupabase:
    """Minimal fake supabase client that stores tables in memory."""
    def __init__(self, tables: dict[str, list[dict]]):
        self._tables = tables

    def table(self, name: str):
        rows = self._tables.get(name, [])
        return FakeQueryBuilder(rows)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

BIZ_ROW = {
    "id": "biz-1",
    "name": "Test Business",
    "website": "https://old.com",
    "category": "SaaS",
    "description": "",
    "user_id": "user-1",
}


def _make_fake_supabase(biz_rows=None):
    rows = biz_rows if biz_rows is not None else [dict(BIZ_ROW)]
    return FakeSupabase({"businesses": rows})


@pytest.fixture()
def client_with_biz():
    """TestClient with a fake Supabase containing one business row."""
    fake = _make_fake_supabase()
    with patch("app.routers.business.get_supabase", return_value=fake):
        with TestClient(app) as c:
            yield c, fake


@pytest.fixture()
def client_no_biz():
    """TestClient with a fake Supabase containing no businesses."""
    fake = _make_fake_supabase(biz_rows=[])
    with patch("app.routers.business.get_supabase", return_value=fake):
        with TestClient(app) as c:
            yield c, fake


# ---------------------------------------------------------------------------
# PUT /api/business
# ---------------------------------------------------------------------------

class TestUpdateBusiness:
    def test_update_category_no_enrichment(self, client_with_biz):
        client, fake = client_with_biz
        enrichment_calls = []

        with patch(
            "app.routers.business._run_enrichment_task",
            new_callable=AsyncMock,
            side_effect=lambda bid: enrichment_calls.append(bid),
        ):
            resp = client.put("/api/business", json={"category": "NewCat"})

        assert resp.status_code == 200
        body = resp.json()
        assert body["message"] == "Business updated successfully"
        assert len(enrichment_calls) == 0

    def test_update_website_triggers_enrichment(self, client_with_biz):
        client, fake = client_with_biz
        enrichment_calls = []

        with patch(
            "app.routers.business._run_enrichment_task",
            new_callable=AsyncMock,
            side_effect=lambda bid: enrichment_calls.append(bid),
        ):
            resp = client.put("/api/business", json={"website": "https://new.com"})

        assert resp.status_code == 200
        assert len(enrichment_calls) == 1
        assert enrichment_calls[0] == "biz-1"

    def test_same_website_no_enrichment(self, client_with_biz):
        client, _ = client_with_biz
        enrichment_calls = []

        with patch(
            "app.routers.business._run_enrichment_task",
            new_callable=AsyncMock,
            side_effect=lambda bid: enrichment_calls.append(bid),
        ):
            resp = client.put("/api/business", json={"website": "https://old.com"})

        assert resp.status_code == 200
        assert len(enrichment_calls) == 0

    def test_no_business_returns_404(self, client_no_biz):
        client, _ = client_no_biz
        resp = client.put("/api/business", json={"name": "X"})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/enrich-business
# ---------------------------------------------------------------------------

class TestEnrichBusiness:
    def test_success(self, client_with_biz):
        client, _ = client_with_biz
        enrichment_calls = []

        with patch(
            "app.routers.business._run_enrichment_task",
            new_callable=AsyncMock,
            side_effect=lambda bid: enrichment_calls.append(bid),
        ):
            resp = client.post("/api/enrich-business")

        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "enriching"
        assert "job_id" in body
        assert len(enrichment_calls) == 1

    def test_no_business_returns_404(self, client_no_biz):
        client, _ = client_no_biz
        resp = client.post("/api/enrich-business")
        assert resp.status_code == 404

    def test_no_website_returns_400(self):
        biz_no_website = [{"id": "biz-1", "website": "", "name": "Test"}]
        fake = _make_fake_supabase(biz_rows=biz_no_website)
        with patch("app.routers.business.get_supabase", return_value=fake):
            with TestClient(app) as client:
                resp = client.post("/api/enrich-business")
        assert resp.status_code == 400
        assert "website" in resp.json()["detail"].lower()
