import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["history"])

MOCK_SNAPSHOT = {
    "visibility_score": 40.4,
    "mention_count": 24,
    "claim_count": 5,
    "pending_claims": 3,
    "avg_sentiment": 0.65,
}


def _aggregate_period(supabase, business_id: str, start: str, end: str) -> dict:
    """Aggregate visibility metrics for a date range."""
    mentions_res = (
        supabase.table("mentions")
        .select("*")
        .eq("business_id", business_id)
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )
    mentions = mentions_res.data or []

    claims_res = (
        supabase.table("claims")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end)
        .execute()
    )
    claims = claims_res.data or []

    mention_count = len(mentions)
    claim_count = len(claims)
    pending_claims = sum(1 for c in claims if c.get("status") == "pending")

    sentiment_map = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}
    sentiments = [sentiment_map.get(m.get("sentiment", "neutral"), 0.5) for m in mentions]
    avg_sentiment = round(sum(sentiments) / len(sentiments), 2) if sentiments else 0.0

    ranks = [m.get("rank") or 5 for m in mentions]
    avg_rank = sum(ranks) / len(ranks) if ranks else 5
    visibility_score = round(max(0, 100 - avg_rank * 10), 1)

    return {
        "visibility_score": visibility_score,
        "mention_count": mention_count,
        "claim_count": claim_count,
        "pending_claims": pending_claims,
        "avg_sentiment": avg_sentiment,
    }


@router.get("/history/compare")
def compare_periods(
    business_id: Optional[str] = None,
    period1_start: Optional[str] = None,
    period1_end: Optional[str] = None,
    period2_start: Optional[str] = None,
    period2_end: Optional[str] = None,
):
    if not all([period1_start, period1_end, period2_start, period2_end]):
        raise HTTPException(status_code=400, detail="All four date parameters are required")

    try:
        supabase = get_supabase()

        if not business_id:
            biz = supabase.table("businesses").select("id").limit(1).execute()
            business_id = biz.data[0]["id"] if biz.data else None

        if not business_id:
            return {
                "period1": MOCK_SNAPSHOT,
                "period2": MOCK_SNAPSHOT,
                "deltas": {k: 0 for k in MOCK_SNAPSHOT},
            }

        p1 = _aggregate_period(supabase, business_id, period1_start, period1_end)
        p2 = _aggregate_period(supabase, business_id, period2_start, period2_end)

        deltas = {}
        for key in p1:
            v1 = p1[key] or 0
            v2 = p2[key] or 0
            deltas[key] = round(v2 - v1, 2)

        return {"period1": p1, "period2": p2, "deltas": deltas}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("History compare failed: %s", exc)
        return {
            "period1": MOCK_SNAPSHOT,
            "period2": MOCK_SNAPSHOT,
            "deltas": {k: 0 for k in MOCK_SNAPSHOT},
        }


@router.get("/history/snapshots")
def get_snapshots(
    business_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    try:
        supabase = get_supabase()

        if not business_id:
            biz = supabase.table("businesses").select("id").limit(1).execute()
            business_id = biz.data[0]["id"] if biz.data else None

        if not business_id:
            return {"snapshots": []}

        q = (
            supabase.table("visibility_snapshots")
            .select("*")
            .eq("business_id", business_id)
            .order("snapshot_date")
        )
        if date_from:
            q = q.gte("snapshot_date", date_from)
        if date_to:
            q = q.lte("snapshot_date", date_to)

        res = q.execute()
        return {"snapshots": res.data or []}

    except Exception as exc:
        if "PGRST205" in str(exc) or "schema cache" in str(exc):
            logger.warning("visibility_snapshots table not yet migrated")
        else:
            logger.warning("Failed to fetch snapshots: %s", exc)
        return {"snapshots": []}


@router.post("/history/snapshot")
def create_snapshot(business_id: Optional[str] = None):
    """Manually trigger a visibility snapshot for the given business."""
    try:
        supabase = get_supabase()

        if not business_id:
            biz = supabase.table("businesses").select("id").limit(1).execute()
            business_id = biz.data[0]["id"] if biz.data else None

        if not business_id:
            raise HTTPException(status_code=404, detail="No business found")

        snapshot = _build_snapshot(supabase, business_id)
        supabase.table("visibility_snapshots").insert(snapshot).execute()
        return {"message": "Snapshot created", "snapshot": snapshot}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Snapshot creation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create snapshot")


def _build_snapshot(supabase, business_id: str) -> dict:
    """Build a visibility snapshot dict for insertion."""
    mentions_res = (
        supabase.table("mentions")
        .select("*")
        .eq("business_id", business_id)
        .execute()
    )
    mentions = mentions_res.data or []

    claims_res = supabase.table("claims").select("*").execute()
    claims = claims_res.data or []

    pending_claims = sum(1 for c in claims if c.get("status") == "pending")

    sentiment_map = {"positive": 1.0, "neutral": 0.5, "negative": 0.0}
    sentiments = [sentiment_map.get(m.get("sentiment", "neutral"), 0.5) for m in mentions]
    avg_sentiment = round(sum(sentiments) / len(sentiments), 2) if sentiments else 0.0

    ranks = [m.get("rank") or 5 for m in mentions]
    avg_rank = sum(ranks) / len(ranks) if ranks else 5
    visibility_score = round(max(0, 100 - avg_rank * 10), 1)

    competitors_res = (
        supabase.table("competitors")
        .select("name, visibility_score, change")
        .eq("business_id", business_id)
        .order("visibility_score", desc=True)
        .execute()
    )

    return {
        "business_id": business_id,
        "visibility_score": visibility_score,
        "mention_count": len(mentions),
        "claim_count": len(claims),
        "pending_claims": pending_claims,
        "avg_sentiment": avg_sentiment,
        "competitor_data": competitors_res.data or [],
    }
