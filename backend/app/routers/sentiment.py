import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business
from app import cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sentiment"])

MOCK_FALLBACK = {
    "sentiment_trends": [
        {"date": "2025-03-06", "positive": 0.65, "neutral": 0.28, "negative": 0.07},
        {"date": "2025-03-07", "positive": 0.68, "neutral": 0.25, "negative": 0.07},
        {"date": "2025-03-08", "positive": 0.70, "neutral": 0.24, "negative": 0.06},
        {"date": "2025-03-09", "positive": 0.72, "neutral": 0.23, "negative": 0.05},
        {"date": "2025-03-10", "positive": 0.72, "neutral": 0.22, "negative": 0.06},
    ],
    "sentiment_by_llm": [
        {"llm": "ChatGPT", "positive": 0.78, "neutral": 0.18, "negative": 0.04},
        {"llm": "Claude", "positive": 0.75, "neutral": 0.20, "negative": 0.05},
        {"llm": "Gemini", "positive": 0.68, "neutral": 0.26, "negative": 0.06},
        {"llm": "Llama", "positive": 0.65, "neutral": 0.28, "negative": 0.07},
    ],
    "overall_sentiment": {"positive": 0.72, "neutral": 0.22, "negative": 0.06},
    "filter_applied": "all_time",
}


def _sentiment_ratios(sentiments: list[str]) -> dict:
    total = len(sentiments) or 1
    pos = sum(1 for s in sentiments if s == "positive")
    neg = sum(1 for s in sentiments if s == "negative")
    neu = total - pos - neg
    return {
        "positive": round(pos / total, 2),
        "neutral": round(neu / total, 2),
        "negative": round(neg / total, 2),
    }


VALID_SENTIMENTS = {"positive", "neutral", "negative"}


@router.get("/sentiment")
def get_sentiment(filter: Optional[str] = None, user_id: Optional[str] = None):
    cache_key = f"sentiment::{user_id or 'anon'}::{filter or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        supabase = get_supabase()

        biz = resolve_business(supabase, user_id)
        business_id = biz["id"] if biz else None

        if not business_id:
            return {**MOCK_FALLBACK, "filter_applied": filter or "all_time", "status": "no_data"}

        mentions_res = (
            supabase.table("mentions")
            .select("*")
            .eq("business_id", business_id)
            .execute()
        )
        raw_mentions = mentions_res.data or []

        mentions = [m for m in raw_mentions if m.get("sentiment") in VALID_SENTIMENTS]

        by_date: dict[str, list[str]] = defaultdict(list)
        all_sentiments: list[str] = []

        for m in mentions:
            s = m["sentiment"]
            all_sentiments.append(s)
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(s)

        sentiment_trends = sorted(
            [{"date": d, **_sentiment_ratios(sents)} for d, sents in by_date.items()],
            key=lambda x: x["date"],
        )

        resp_ids = list({m["response_id"] for m in mentions if m.get("response_id")})
        llm_by_id: dict[str, str] = {}
        query_by_resp: dict[str, str] = {}
        if resp_ids:
            all_resps = (
                supabase.table("llm_responses")
                .select("id, llm_name, query_id")
                .in_("id", resp_ids)
                .execute()
            )
            for r in (all_resps.data or []):
                llm_by_id[r["id"]] = r["llm_name"]
                if r.get("query_id"):
                    query_by_resp[r["id"]] = r["query_id"]

        query_ids = list(set(query_by_resp.values()))
        query_text_map: dict[str, str] = {}
        if query_ids:
            queries_res = (
                supabase.table("queries")
                .select("id, text")
                .in_("id", query_ids)
                .execute()
            )
            query_text_map = {q["id"]: q["text"] for q in (queries_res.data or [])}

        llm_sentiments: dict[str, list[str]] = defaultdict(list)
        for m in mentions:
            rid = m.get("response_id")
            llm_name = llm_by_id.get(rid)
            if llm_name:
                llm_sentiments[llm_name].append(m["sentiment"])

        sentiment_by_llm = [
            {"llm": llm, **_sentiment_ratios(sents)}
            for llm, sents in llm_sentiments.items()
        ]

        overall = _sentiment_ratios(all_sentiments) if all_sentiments else MOCK_FALLBACK["overall_sentiment"]

        query_responses = []
        for m in mentions:
            rid = m.get("response_id")
            llm_name = llm_by_id.get(rid, "Unknown")
            qid = query_by_resp.get(rid)
            query_text = query_text_map.get(qid, "") if qid else ""
            if not query_text:
                continue
            query_responses.append({
                "id": m.get("id", ""),
                "query": query_text,
                "llm_name": llm_name,
                "sentiment": m["sentiment"],
            })

        has_real_data = bool(mentions)

        result = {
            "sentiment_trends": sentiment_trends or MOCK_FALLBACK["sentiment_trends"],
            "sentiment_by_llm": sentiment_by_llm or MOCK_FALLBACK["sentiment_by_llm"],
            "overall_sentiment": overall,
            "query_responses": query_responses,
            "filter_applied": filter or "all_time",
            "status": "ok" if has_real_data else "no_data",
        }

        cache.set(cache_key, result)
        return result

    except Exception as exc:
        logger.warning("Sentiment Supabase query failed, using mock: %s", exc)
        return {**MOCK_FALLBACK, "filter_applied": filter or "all_time", "status": "no_data"}
