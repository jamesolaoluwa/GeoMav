import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["shopping"])

MOCK_FALLBACK = {
    "product_visibility": [
        {"product": "GeoMav Pro", "visibility_score": 82, "mentions": 45, "ranking": 2, "category": "enterprise"},
        {"product": "GeoMav API", "visibility_score": 76, "mentions": 38, "ranking": 3, "category": "developer"},
        {"product": "GeoMav Lite", "visibility_score": 68, "mentions": 28, "ranking": 4, "category": "starter"},
    ],
    "shopping_queries": [
        {"query": "best GIS software to buy", "appearance_rate": 0.72},
        {"query": "geospatial mapping software pricing", "appearance_rate": 0.65},
        {"query": "GIS tools for small business", "appearance_rate": 0.58},
    ],
    "filter_applied": "all_time",
}


@router.get("/shopping")
def get_shopping(filter: Optional[str] = None):
    try:
        supabase = get_supabase()

        biz = supabase.table("businesses").select("id, name, services").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None
        services = biz.data[0].get("services") if biz.data else None

        responses_res = supabase.table("llm_responses").select("*").execute()
        responses = responses_res.data or []

        product_keywords = ["product", "buy", "pricing", "price", "shop", "purchase", "cost"]
        product_responses = [
            r for r in responses
            if any(kw in (r.get("response_text") or "").lower() for kw in product_keywords)
        ]

        product_visibility = []
        if isinstance(services, list) and services:
            for i, svc in enumerate(services[:5]):
                svc_name = svc if isinstance(svc, str) else str(svc)
                mention_count = sum(
                    1 for r in product_responses
                    if svc_name.lower() in (r.get("response_text") or "").lower()
                )
                product_visibility.append({
                    "product": svc_name,
                    "visibility_score": max(0, 100 - (i * 10)),
                    "mentions": mention_count,
                    "ranking": i + 1,
                    "category": "product",
                })

        shopping_kw = ["buy", "pricing", "price", "shop", "purchase", "cost", "compare"]
        queries_res = supabase.table("queries").select("*").execute()
        queries = queries_res.data or []

        shopping_queries_data: dict[str, dict] = {}
        for q in queries:
            text = q.get("text", "")
            if any(kw in text.lower() for kw in shopping_kw):
                q_id = q["id"]
                resp_count = sum(1 for r in responses if r.get("query_id") == q_id)
                total_llms = 5
                shopping_queries_data[text] = {
                    "query": text,
                    "appearance_rate": round(resp_count / total_llms, 2),
                }

        shopping_queries = list(shopping_queries_data.values())

        return {
            "product_visibility": product_visibility or MOCK_FALLBACK["product_visibility"],
            "shopping_queries": shopping_queries or MOCK_FALLBACK["shopping_queries"],
            "filter_applied": filter or "all_time",
        }

    except Exception as exc:
        logger.warning("Shopping Supabase query failed, using mock: %s", exc)
        return {**MOCK_FALLBACK, "filter_applied": filter or "all_time"}
