"""Integration tests for the scan flow — uses mock LLM responses, real analytics+reinforcement logic."""

import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch

from app.agents.analytics import run_analytics_scan
from app.agents.reinforcement import run_reinforcement


class FakeSupabaseTable:
    """Collects inserted rows for assertions."""

    def __init__(self):
        self.rows: list[dict | list] = []

    def insert(self, data):
        self.rows.append(data)
        return self

    def execute(self):
        return MagicMock(data=self.rows[-1] if self.rows else [])


class FakeSupabase:
    def __init__(self):
        self.tables: dict[str, FakeSupabaseTable] = {}

    def table(self, name: str):
        if name not in self.tables:
            self.tables[name] = FakeSupabaseTable()
        return self.tables[name]


@pytest.fixture
def fake_supabase():
    return FakeSupabase()


class TestScanWritesQueryId:
    @pytest.mark.asyncio
    async def test_llm_responses_have_query_id(self, fake_supabase):
        prompts = ["What is the best tool?", "Compare website builders"]
        query_ids = ["q-001", "q-002"]

        with patch("app.agents.analytics.query_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = "Your Brand is the best tool for web design."

            result = await run_analytics_scan(
                prompts=prompts,
                business_name="Your Brand",
                supabase_client=fake_supabase,
                query_ids=query_ids,
            )

        llm_table = fake_supabase.tables.get("llm_responses")
        assert llm_table is not None

        inserted_rows = llm_table.rows[0] if llm_table.rows else []
        assert len(inserted_rows) > 0

        for row in inserted_rows:
            assert row["query_id"] is not None
            assert row["query_id"] in query_ids

    @pytest.mark.asyncio
    async def test_mentions_have_response_id(self, fake_supabase):
        with patch("app.agents.analytics.query_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = "Your Brand is excellent."

            result = await run_analytics_scan(
                prompts=["Test prompt"],
                business_name="Your Brand",
                supabase_client=fake_supabase,
                query_ids=["q-100"],
            )

        mention_table = fake_supabase.tables.get("mentions")
        assert mention_table is not None

        inserted_rows = mention_table.rows[0] if mention_table.rows else []
        for row in inserted_rows:
            assert row["response_id"] is not None

    @pytest.mark.asyncio
    async def test_visibility_score_computed(self, fake_supabase):
        with patch("app.agents.analytics.query_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = "Your Brand is great for design."

            result = await run_analytics_scan(
                prompts=["prompt1"],
                business_name="Your Brand",
                supabase_client=fake_supabase,
                query_ids=["q-200"],
            )

        assert result["visibility_score"] > 0
        assert result["total_queries"] > 0
        assert result["mentions"] > 0


class TestReinforcementAfterScan:
    @pytest.mark.asyncio
    async def test_claims_have_response_id(self, fake_supabase):
        llm_responses = [
            {
                "id": "resp-001",
                "llm_name": "ChatGPT",
                "response_text": "The monthly plan costs $99. They are located in Mars.",
                "query_text": "test query",
            },
        ]
        business_profile = {
            "pricing": "$29/month",
            "location": "San Francisco",
            "hours": "Mon-Fri 9-5",
            "services": "web design hosting",
        }

        result = await run_reinforcement(
            llm_responses=llm_responses,
            business_profile=business_profile,
            supabase_client=fake_supabase,
        )

        assert result["corrections_needed"] > 0

        claims_table = fake_supabase.tables.get("claims")
        assert claims_table is not None
        inserted_rows = claims_table.rows[0] if claims_table.rows else []
        for row in inserted_rows:
            assert row["response_id"] == "resp-001"

    @pytest.mark.asyncio
    async def test_batch_insert_used(self, fake_supabase):
        llm_responses = [
            {
                "id": f"resp-{i}",
                "llm_name": "ChatGPT",
                "response_text": f"The plan costs ${i * 10}.",
                "query_text": "test",
            }
            for i in range(5)
        ]

        await run_reinforcement(
            llm_responses=llm_responses,
            business_profile={"pricing": "$29/month"},
            supabase_client=fake_supabase,
        )

        claims_table = fake_supabase.tables.get("claims")
        assert claims_table is not None
        assert len(claims_table.rows) == 1


class TestDashboardMetricsAccuracy:
    @pytest.mark.asyncio
    async def test_60_percent_visibility(self, fake_supabase):
        """3 of 5 prompts mention brand => 3*6 / 5*6 = 60% for mock where all LLMs return same."""
        with patch("app.agents.analytics.query_llm", new_callable=AsyncMock) as mock_llm:
            call_count = 0

            async def side_effect(llm_name, prompt, api_key=None):
                nonlocal call_count
                call_count += 1
                prompt_idx = (call_count - 1) // 6
                if prompt_idx < 3:
                    return "Your Brand is the leading website builder."
                return "WordPress and Wix are popular builders."

            mock_llm.side_effect = side_effect

            result = await run_analytics_scan(
                prompts=["p1", "p2", "p3", "p4", "p5"],
                business_name="Your Brand",
                supabase_client=fake_supabase,
                query_ids=["q1", "q2", "q3", "q4", "q5"],
            )

        assert result["visibility_score"] == 60.0
