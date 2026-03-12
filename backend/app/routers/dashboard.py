import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dashboard"])

MOCK_FALLBACK = {
    "visibility_score": 78,
    "visibility_change": 2.5,
    "brand_ranking": 3,
    "brand_ranking_total": 10,
    "claim_accuracy": 92,
    "claim_accuracy_change": 1.2,
    "active_hallucinations": 2,
    "visibility_trend": [
        {"date": "2025-03-06", "score": 72},
        {"date": "2025-03-07", "score": 74},
        {"date": "2025-03-08", "score": 75},
        {"date": "2025-03-09", "score": 76},
        {"date": "2025-03-10", "score": 77},
        {"date": "2025-03-11", "score": 78},
    ],
    "llm_breakdown": [
        {"llm": "GPT-4", "visibility": 85, "mentions": 120},
        {"llm": "Claude", "visibility": 82, "mentions": 98},
        {"llm": "Gemini", "visibility": 71, "mentions": 65},
        {"llm": "Llama", "visibility": 68, "mentions": 45},
    ],
    "competitors": [
        {"name": "Competitor A", "ranking": 1, "visibility": 92},
        {"name": "Competitor B", "ranking": 2, "visibility": 84},
        {"name": "GeoMav", "ranking": 3, "visibility": 78},
    ],
}


@router.get("/dashboard")
def get_dashboard(filter: Optional[str] = None):
    try:
        supabase = get_supabase()

        biz = supabase.table("businesses").select("id").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None

        pending_claims = (
            supabase.table("claims")
            .select("id", count="exact")
            .eq("status", "pending")
            .execute()
        )
        active_hallucinations = pending_claims.count or 0

        total_claims = (
            supabase.table("claims")
            .select("id", count="exact")
            .execute()
        )
        resolved_claims = (
            supabase.table("claims")
            .select("id", count="exact")
            .eq("status", "resolved")
            .execute()
        )
        total_c = total_claims.count or 1
        resolved_c = resolved_claims.count or 0
        claim_accuracy = round((resolved_c / total_c) * 100, 1) if total_c > 0 else 0

        competitors_res = (
            supabase.table("competitors")
            .select("*")
            .order("visibility_score", desc=True)
            .execute()
        )
        competitors_list = [
            {"name": c["name"], "ranking": i + 1, "visibility": c["visibility_score"]}
            for i, c in enumerate(competitors_res.data or [])
        ]

        mentions_res = supabase.table("mentions").select("*").execute()
        mentions = mentions_res.data or []

        by_date: dict[str, list] = defaultdict(list)
        by_llm: dict[str, dict] = defaultdict(lambda: {"count": 0, "total_rank": 0})

        for m in mentions:
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(m)

            resp_id = m.get("response_id")
            if resp_id:
                llm_resp = (
                    supabase.table("llm_responses")
                    .select("llm_name")
                    .eq("id", resp_id)
                    .limit(1)
                    .execute()
                )
                if llm_resp.data:
                    llm_name = llm_resp.data[0]["llm_name"]
                    by_llm[llm_name]["count"] += 1
                    by_llm[llm_name]["total_rank"] += m.get("rank") or 0

        visibility_trend = sorted(
            [
                {"date": d, "score": max(0, 100 - int(sum((me.get("rank") or 5) for me in ms) / len(ms) * 10))}
                for d, ms in by_date.items()
            ],
            key=lambda x: x["date"],
        )

        llm_breakdown = [
            {
                "llm": llm,
                "visibility": max(0, 100 - int(info["total_rank"] / info["count"] * 10)) if info["count"] else 0,
                "mentions": info["count"],
            }
            for llm, info in by_llm.items()
        ]

        latest_score = visibility_trend[-1]["score"] if visibility_trend else 78
        prev_score = visibility_trend[-2]["score"] if len(visibility_trend) >= 2 else latest_score
        visibility_change = round(latest_score - prev_score, 1)

        own_rank = None
        for i, c in enumerate(competitors_list):
            if business_id and c.get("name"):
                own_rank = i + 1
        brand_ranking = own_rank or (len(competitors_list) + 1)

        return {
            "visibility_score": latest_score,
            "visibility_change": visibility_change,
            "brand_ranking": brand_ranking,
            "brand_ranking_total": len(competitors_list) + 1,
            "claim_accuracy": claim_accuracy,
            "claim_accuracy_change": 0,
            "active_hallucinations": active_hallucinations,
            "visibility_trend": visibility_trend or MOCK_FALLBACK["visibility_trend"],
            "llm_breakdown": llm_breakdown or MOCK_FALLBACK["llm_breakdown"],
            "competitors": competitors_list or MOCK_FALLBACK["competitors"],
        }

    except Exception as exc:
        logger.warning("Dashboard Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK
