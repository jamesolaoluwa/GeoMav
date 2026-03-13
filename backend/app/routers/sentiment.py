import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase

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


@router.get("/sentiment")
def get_sentiment(filter: Optional[str] = None):
    try:
        supabase = get_supabase()

        mentions_res = supabase.table("mentions").select("*").execute()
        mentions = mentions_res.data or []

        by_date: dict[str, list[str]] = defaultdict(list)
        all_sentiments: list[str] = []

        for m in mentions:
            s = m.get("sentiment", "neutral")
            all_sentiments.append(s)
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(s)

        sentiment_trends = sorted(
            [{"date": d, **_sentiment_ratios(sents)} for d, sents in by_date.items()],
            key=lambda x: x["date"],
        )

        resp_ids = list({m["response_id"] for m in mentions if m.get("response_id")})
        llm_sentiments: dict[str, list[str]] = defaultdict(list)

        if resp_ids:
            for rid in resp_ids:
                resp = (
                    supabase.table("llm_responses")
                    .select("id, llm_name")
                    .eq("id", rid)
                    .limit(1)
                    .execute()
                )
                if resp.data:
                    llm_name = resp.data[0]["llm_name"]
                    for m in mentions:
                        if m.get("response_id") == rid:
                            llm_sentiments[llm_name].append(m.get("sentiment", "neutral"))

        sentiment_by_llm = [
            {"llm": llm, **_sentiment_ratios(sents)}
            for llm, sents in llm_sentiments.items()
        ]

        overall = _sentiment_ratios(all_sentiments) if all_sentiments else MOCK_FALLBACK["overall_sentiment"]

        query_responses = []
        for m in mentions:
            rid = m.get("response_id")
            llm_name = "Unknown"
            if rid and rid in {r for r in resp_ids}:
                for llm, sents in llm_sentiments.items():
                    llm_name = llm
                    break
            query_responses.append({
                "id": m.get("id", ""),
                "query": m.get("query_text") or m.get("source", "Unknown query"),
                "llm_name": llm_name,
                "sentiment": m.get("sentiment", "neutral"),
            })

        return {
            "sentiment_trends": sentiment_trends or MOCK_FALLBACK["sentiment_trends"],
            "sentiment_by_llm": sentiment_by_llm or MOCK_FALLBACK["sentiment_by_llm"],
            "overall_sentiment": overall,
            "query_responses": query_responses,
            "filter_applied": filter or "all_time",
        }

    except Exception as exc:
        logger.warning("Sentiment Supabase query failed, using mock: %s", exc)
        return {**MOCK_FALLBACK, "filter_applied": filter or "all_time"}
