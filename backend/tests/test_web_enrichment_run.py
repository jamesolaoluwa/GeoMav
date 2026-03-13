"""Integration-style tests for run_web_enrichment with mocked sub-functions.
No real network calls, no real Supabase writes."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.web_enrichment import run_web_enrichment


def _html_with_schema(schema: dict) -> str:
    return (
        f'<html><head><script type="application/ld+json">'
        f"{json.dumps(schema)}</script></head>"
        f"<body><p>Page text about pricing $10/mo and hours Mon-Fri 9-5</p></body></html>"
    )


MOCK_SCHEMA = {
    "@type": "LocalBusiness",
    "name": "Test Biz",
    "priceRange": "$$",
    "openingHours": "Mo-Fr 09:00-17:00",
}

MOCK_HTML = _html_with_schema(MOCK_SCHEMA)
MOCK_TEXT = "Test Biz offers great services. Pricing starts at $10/mo. Open Mon-Fri 9-5."


class TestRunWebEnrichment:
    @pytest.mark.asyncio
    async def test_completed_with_all_sources(self):
        llm_result = {
            "name": "Test Biz",
            "pricing": "$10/mo",
            "services": "Web hosting, Email",
            "description": "A great SaaS business.",
        }

        with (
            patch(
                "app.agents.web_enrichment.fetch_key_pages",
                new_callable=AsyncMock,
                return_value=[(MOCK_HTML, MOCK_TEXT)],
            ),
            patch(
                "app.agents.web_enrichment.fetch_google_knowledge",
                new_callable=AsyncMock,
                return_value="Google snippet about Test Biz in Austin TX.",
            ),
            patch(
                "app.agents.web_enrichment.llm_extract_profile",
                new_callable=AsyncMock,
                return_value=llm_result,
            ),
        ):
            result = await run_web_enrichment(
                {"id": "biz-1", "name": "", "website": "https://testbiz.com"},
                supabase_client=None,
            )

        assert result["status"] == "completed"
        assert result["pages_fetched"] == 1
        assert "name" in result["schema_org_fields"]
        assert "services" in result["llm_extracted_fields"]
        assert len(result["fields_updated"]) > 0

    @pytest.mark.asyncio
    async def test_skipped_when_no_website(self):
        result = await run_web_enrichment(
            {"id": "biz-1", "name": "Test", "website": ""},
            supabase_client=None,
        )
        assert result["status"] == "skipped"
        assert result["reason"] == "no_website"

    @pytest.mark.asyncio
    async def test_prepends_https_for_bare_domain(self):
        fetch_calls = []

        async def mock_fetch_key_pages(website: str):
            fetch_calls.append(website)
            return [(MOCK_HTML, MOCK_TEXT)]

        with (
            patch(
                "app.agents.web_enrichment.fetch_key_pages",
                side_effect=mock_fetch_key_pages,
            ),
            patch(
                "app.agents.web_enrichment.fetch_google_knowledge",
                new_callable=AsyncMock,
                return_value="",
            ),
            patch(
                "app.agents.web_enrichment.llm_extract_profile",
                new_callable=AsyncMock,
                return_value={},
            ),
        ):
            await run_web_enrichment(
                {"id": "biz-1", "name": "Test", "website": "testbiz.com"},
                supabase_client=None,
            )

        assert fetch_calls[0].startswith("https://")

    @pytest.mark.asyncio
    async def test_supabase_update_called_when_updates_exist(self):
        mock_table = MagicMock()
        mock_table.update.return_value.eq.return_value.execute.return_value = None
        mock_supabase = MagicMock()
        mock_supabase.table.return_value = mock_table

        with (
            patch(
                "app.agents.web_enrichment.fetch_key_pages",
                new_callable=AsyncMock,
                return_value=[(MOCK_HTML, MOCK_TEXT)],
            ),
            patch(
                "app.agents.web_enrichment.fetch_google_knowledge",
                new_callable=AsyncMock,
                return_value="",
            ),
            patch(
                "app.agents.web_enrichment.llm_extract_profile",
                new_callable=AsyncMock,
                return_value={"description": "Extracted desc"},
            ),
        ):
            result = await run_web_enrichment(
                {"id": "biz-1", "name": "", "website": "https://testbiz.com"},
                supabase_client=mock_supabase,
            )

        mock_supabase.table.assert_called_with("businesses")
        mock_table.update.assert_called_once()
        update_arg = mock_table.update.call_args[0][0]
        assert "name" in update_arg or "description" in update_arg

    @pytest.mark.asyncio
    async def test_no_supabase_write_when_no_updates(self):
        mock_supabase = MagicMock()

        existing = {
            "id": "biz-1",
            "name": "Filled",
            "category": "Filled",
            "description": "Filled",
            "pricing": "Filled",
            "hours": "Filled",
            "location": "Filled",
            "services": "Filled",
            "website": "https://testbiz.com",
        }

        with (
            patch(
                "app.agents.web_enrichment.fetch_key_pages",
                new_callable=AsyncMock,
                return_value=[(MOCK_HTML, MOCK_TEXT)],
            ),
            patch(
                "app.agents.web_enrichment.fetch_google_knowledge",
                new_callable=AsyncMock,
                return_value="",
            ),
            patch(
                "app.agents.web_enrichment.llm_extract_profile",
                new_callable=AsyncMock,
                return_value={"name": "Different"},
            ),
        ):
            result = await run_web_enrichment(existing, supabase_client=mock_supabase)

        assert result["fields_updated"] == []
        mock_supabase.table.assert_not_called()

    @pytest.mark.asyncio
    async def test_no_pages_still_completes(self):
        with (
            patch(
                "app.agents.web_enrichment.fetch_key_pages",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "app.agents.web_enrichment.fetch_google_knowledge",
                new_callable=AsyncMock,
                return_value="",
            ),
        ):
            result = await run_web_enrichment(
                {"id": "biz-1", "name": "Test", "website": "https://down.com"},
                supabase_client=None,
            )

        assert result["status"] == "completed"
        assert result["pages_fetched"] == 0
        assert result["fields_updated"] == []
