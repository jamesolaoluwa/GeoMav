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

        return {
            "competitors": competitors,
            "market_leader": market_leader,
            "your_ranking": your_ranking or (len(competitors) + 1),
        }

    except Exception as exc:
        logger.warning("Competitors Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK
