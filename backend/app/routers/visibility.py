import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["visibility"])

MOCK_FALLBACK = {
    "visibility_history": [
        {"date": "2025-03-01", "score": 65},
        {"date": "2025-03-02", "score": 67},
        {"date": "2025-03-03", "score": 69},
        {"date": "2025-03-04", "score": 71},
        {"date": "2025-03-05", "score": 73},
        {"date": "2025-03-06", "score": 75},
        {"date": "2025-03-07", "score": 76},
        {"date": "2025-03-08", "score": 77},
        {"date": "2025-03-09", "score": 78},
    ],
    "brand_rankings": [
        {"brand": "GeoMav", "rank": 3, "score": 78},
        {"brand": "Competitor A", "rank": 1, "score": 92},
        {"brand": "Competitor B", "rank": 2, "score": 84},
    ],
    "topic_rankings": [
        {"topic": "geospatial software", "rank": 2, "mentions": 45},
        {"topic": "mapping solutions", "rank": 4, "mentions": 32},
        {"topic": "GIS tools", "rank": 3, "mentions": 28},
    ],
    "query_responses": [
        {"query": "best geospatial mapping software", "response_rate": 0.85},
        {"query": "GIS solutions for businesses", "response_rate": 0.72},
        {"query": "mapping API providers", "response_rate": 0.68},
    ],
    "filter_applied": "all_time",
}


@router.get("/visibility")
def get_visibility(filter: Optional[str] = None):
    try:
        supabase = get_supabase()

        mentions_res = supabase.table("mentions").select("*").execute()
        mentions = mentions_res.data or []

        by_date: dict[str, list] = defaultdict(list)
        for m in mentions:
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(m)

        visibility_history = sorted(
            [
                {
                    "date": d,
                    "score": max(0, 100 - int(sum((me.get("rank") or 5) for me in ms) / len(ms) * 10)),
                }
                for d, ms in by_date.items()
            ],
            key=lambda x: x["date"],
        )

        competitors_res = (
            supabase.table("competitors")
            .select("*")
            .order("visibility_score", desc=True)
            .execute()
        )
        brand_rankings = [
            {"brand": c["name"], "rank": i + 1, "score": c["visibility_score"]}
            for i, c in enumerate(competitors_res.data or [])
        ]

        queries_res = supabase.table("queries").select("*").execute()
        queries_data = queries_res.data or []

        topic_counts: dict[str, int] = defaultdict(int)
        for q in queries_data:
            cat = q.get("category") or "general"
            topic_counts[cat] += 1
        topic_rankings = sorted(
            [{"topic": t, "rank": i + 1, "mentions": c} for i, (t, c) in enumerate(
                sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
            )],
            key=lambda x: x["rank"],
        )

        query_responses = []
        for q in queries_data[:10]:
            resp_count = (
                supabase.table("llm_responses")
                .select("id", count="exact")
                .eq("query_id", q["id"])
                .execute()
            )
            total_llms = 5
            rate = (resp_count.count or 0) / total_llms
            query_responses.append({
                "query": q.get("text", ""),
                "response_rate": round(rate, 2),
            })

        return {
            "visibility_history": visibility_history or MOCK_FALLBACK["visibility_history"],
            "brand_rankings": brand_rankings or MOCK_FALLBACK["brand_rankings"],
            "topic_rankings": topic_rankings or MOCK_FALLBACK["topic_rankings"],
            "query_responses": query_responses or MOCK_FALLBACK["query_responses"],
            "filter_applied": filter or "all_time",
        }

    except Exception as exc:
        logger.warning("Visibility Supabase query failed, using mock: %s", exc)
        return {**MOCK_FALLBACK, "filter_applied": filter or "all_time"}
