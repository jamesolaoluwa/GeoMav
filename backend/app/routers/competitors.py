import logging
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business
from app import cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["competitors"])

MOCK_FALLBACK: dict = {
    "competitors": [],
    "market_leader": "N/A",
    "your_ranking": 1,
    "llm_breakdown": [],
    "sentiment_by_llm": [],
}


@router.get("/competitors")
def get_competitors(user_id: Optional[str] = None):
    cache_key = f"competitors::{user_id or 'anon'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        supabase = get_supabase()

        biz = resolve_business(supabase, user_id)
        business_id = biz["id"] if biz else None
        business_name = biz["name"] if biz else "Your Brand"

        if not business_id:
            return MOCK_FALLBACK

        comp_res = (
            supabase.table("competitors")
            .select("*")
            .eq("business_id", business_id)
            .order("visibility_score", desc=True)
            .execute()
        )
        competitors_raw = comp_res.data or []

        mentions_res = (
            supabase.table("mentions")
            .select("*")
            .eq("business_id", business_id)
            .execute()
        )
        mentions = mentions_res.data or []

        resp_ids = list({m["response_id"] for m in mentions if m.get("response_id")})
        responses = []
        if resp_ids:
            resp_res = supabase.table("llm_responses").select("id, llm_name, query_id").in_("id", resp_ids).execute()
            responses = resp_res.data or []
        resp_by_id = {r["id"]: r for r in responses}

        valid_sentiments = {"positive", "neutral", "negative"}
        mention_sentiments: list[str] = [
            m.get("sentiment", "neutral") for m in mentions
            if m.get("sentiment") in valid_sentiments
        ]

        competitors = []
        your_ranking = None
        for i, c in enumerate(competitors_raw):
            is_own = c.get("name") == business_name
            sentiments = mention_sentiments if is_own else []
            pos = sum(1 for s in sentiments if s == "positive")
            total_s = len(sentiments) if sentiments else 1
            sentiment_score = round(pos / total_s, 2) if total_s > 0 else 0.5
            sentiment_label = "positive" if sentiment_score >= 0.5 else "negative"

            change = c.get("change", 0)
            trend = "up" if change > 0 else ("down" if change < 0 else "stable")

            entry = {
                "id": c["id"],
                "name": c["name"],
                "visibility_score": c.get("visibility_score") or 0,
                "ranking": i + 1,
                "sentiment": sentiment_label,
                "sentiment_score": sentiment_score,
                "mentions": len(sentiments) if is_own else 0,
                "trend": trend,
                "is_own": is_own,
            }
            competitors.append(entry)

            if is_own:
                your_ranking = i + 1

        market_leader = competitors[0]["name"] if competitors else "N/A"

        llm_stats: dict[str, dict] = {}
        for r in responses:
            llm = r.get("llm_name", "Unknown")
            if llm not in llm_stats:
                llm_stats[llm] = {"total_queries": 0, "mentioned": 0, "rank_sum": 0, "rank_count": 0}
            llm_stats[llm]["total_queries"] += 1

        for m in mentions:
            rid = m.get("response_id")
            r = resp_by_id.get(rid)
            if r:
                llm = r.get("llm_name", "Unknown")
                if llm in llm_stats:
                    llm_stats[llm]["mentioned"] += 1
                    rank = m.get("rank")
                    if rank and isinstance(rank, (int, float)):
                        llm_stats[llm]["rank_sum"] += rank
                        llm_stats[llm]["rank_count"] += 1

        llm_breakdown = []
        for llm, stats in llm_stats.items():
            tq = stats["total_queries"] or 1
            llm_breakdown.append({
                "llm_name": llm,
                "mention_rate": round(stats["mentioned"] / tq * 100),
                "total_queries": stats["total_queries"],
                "avg_rank": round(stats["rank_sum"] / stats["rank_count"], 1) if stats["rank_count"] else 0,
            })

        llm_sentiments: dict[str, list[str]] = {}
        for m in mentions:
            rid = m.get("response_id")
            r = resp_by_id.get(rid)
            if r and m.get("sentiment") in valid_sentiments:
                llm = r.get("llm_name", "Unknown")
                llm_sentiments.setdefault(llm, []).append(m["sentiment"])

        sentiment_by_llm = []
        for llm, sents in llm_sentiments.items():
            total = len(sents) or 1
            pos = sum(1 for s in sents if s == "positive")
            neg = sum(1 for s in sents if s == "negative")
            neu = total - pos - neg
            sentiment_by_llm.append({
                "llm_name": llm,
                "positive": round(pos / total * 100),
                "neutral": round(neu / total * 100),
                "negative": round(neg / total * 100),
            })

        result = {
            "competitors": competitors,
            "market_leader": market_leader,
            "your_ranking": your_ranking or (len(competitors) + 1),
            "llm_breakdown": llm_breakdown,
            "sentiment_by_llm": sentiment_by_llm,
        }

        cache.set(cache_key, result)
        return result

    except Exception as exc:
        logger.warning("Competitors Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK
