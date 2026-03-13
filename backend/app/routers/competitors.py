import logging

from fastapi import APIRouter

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["competitors"])

MOCK_FALLBACK = {
    "competitors": [
        {
            "id": "comp-001",
            "name": "Competitor A",
            "visibility_score": 92,
            "ranking": 1,
            "sentiment": "positive",
            "sentiment_score": 0.85,
            "mentions": 156,
            "trend": "up",
        },
        {
            "id": "comp-002",
            "name": "Competitor B",
            "visibility_score": 84,
            "ranking": 2,
            "sentiment": "positive",
            "sentiment_score": 0.78,
            "mentions": 124,
            "trend": "stable",
        },
        {
            "id": "comp-003",
            "name": "GeoMav",
            "visibility_score": 78,
            "ranking": 3,
            "sentiment": "positive",
            "sentiment_score": 0.72,
            "mentions": 98,
            "trend": "up",
        },
    ],
    "market_leader": "Competitor A",
    "your_ranking": 3,
}


@router.get("/competitors")
def get_competitors():
    try:
        supabase = get_supabase()

        comp_res = (
            supabase.table("competitors")
            .select("*")
            .order("visibility_score", desc=True)
            .execute()
        )
        competitors_raw = comp_res.data or []

        biz = supabase.table("businesses").select("id").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None

        mentions_res = supabase.table("mentions").select("*").execute()
        mentions = mentions_res.data or []

        sentiment_map: dict[str, list[str]] = {}
        for m in mentions:
            bid = m.get("business_id")
            if bid:
                sentiment_map.setdefault(bid, []).append(m.get("sentiment", "neutral"))

        competitors = []
        your_ranking = None
        for i, c in enumerate(competitors_raw):
            sentiments = sentiment_map.get(c.get("business_id", ""), [])
            pos = sum(1 for s in sentiments if s == "positive")
            total_s = len(sentiments) if sentiments else 1
            sentiment_score = round(pos / total_s, 2) if total_s > 0 else 0.5
            sentiment_label = "positive" if sentiment_score >= 0.5 else "negative"

            change = c.get("change", 0)
            trend = "up" if change > 0 else ("down" if change < 0 else "stable")

            entry = {
                "id": c["id"],
                "name": c["name"],
                "visibility_score": c["visibility_score"],
                "ranking": i + 1,
                "sentiment": sentiment_label,
                "sentiment_score": sentiment_score,
                "mentions": len(sentiments),
                "trend": trend,
            }
            competitors.append(entry)

            if c.get("business_id") == business_id:
                your_ranking = i + 1

        market_leader = competitors[0]["name"] if competitors else "N/A"

        resp_res = supabase.table("llm_responses").select("id, llm_name, query_id").execute()
        responses = resp_res.data or []

        llm_stats: dict[str, dict] = {}
        for r in responses:
            llm = r.get("llm_name", "Unknown")
            if llm not in llm_stats:
                llm_stats[llm] = {"total_queries": 0, "mentioned": 0, "rank_sum": 0, "rank_count": 0}
            llm_stats[llm]["total_queries"] += 1

        for m in mentions:
            rid = m.get("response_id")
            for r in responses:
                if r["id"] == rid:
                    llm = r.get("llm_name", "Unknown")
                    if llm in llm_stats:
                        llm_stats[llm]["mentioned"] += 1
                        rank = m.get("rank")
                        if rank and isinstance(rank, (int, float)):
                            llm_stats[llm]["rank_sum"] += rank
                            llm_stats[llm]["rank_count"] += 1
                    break

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
            for r in responses:
                if r["id"] == rid:
                    llm = r.get("llm_name", "Unknown")
                    llm_sentiments.setdefault(llm, []).append(m.get("sentiment", "neutral"))
                    break

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

        return {
            "competitors": competitors,
            "market_leader": market_leader,
            "your_ranking": your_ranking or (len(competitors) + 1),
            "llm_breakdown": llm_breakdown,
            "sentiment_by_llm": sentiment_by_llm,
        }

    except Exception as exc:
        logger.warning("Competitors Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK
