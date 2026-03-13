import logging
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["corrections"])


@router.get("/corrections/timeline/{claim_id}")
def get_claim_timeline(claim_id: str):
    try:
        supabase = get_supabase()

        claim_res = supabase.table("claims").select("*").eq("id", claim_id).limit(1).execute()
        claim = claim_res.data[0] if claim_res.data else None
        if not claim:
            return {"claim": None, "events": [], "message": "Claim not found"}

        events_res = (
            supabase.table("claim_events")
            .select("*")
            .eq("claim_id", claim_id)
            .order("created_at", desc=False)
            .execute()
        )
        events = events_res.data or []

        if not events:
            events = [
                {
                    "id": "auto-detected",
                    "claim_id": claim_id,
                    "event_type": "detected",
                    "description": f"Claim detected: {claim.get('claim_value', 'Unknown')}",
                    "created_at": claim.get("created_at"),
                }
            ]
            if claim.get("status") == "correction_deployed":
                events.append({
                    "id": "auto-deployed",
                    "claim_id": claim_id,
                    "event_type": "correction_deployed",
                    "description": "Correction content deployed",
                    "created_at": claim.get("created_at"),
                })
            if claim.get("status") == "resolved":
                events.append({
                    "id": "auto-deployed",
                    "claim_id": claim_id,
                    "event_type": "correction_deployed",
                    "description": "Correction content deployed",
                    "created_at": claim.get("created_at"),
                })
                events.append({
                    "id": "auto-resolved",
                    "claim_id": claim_id,
                    "event_type": "resolved",
                    "description": "Claim resolved after re-query verification",
                    "created_at": claim.get("created_at"),
                })

        return {
            "claim": {
                "id": claim["id"],
                "claim_value": claim.get("claim_value", ""),
                "verified_value": claim.get("verified_value", ""),
                "status": claim.get("status", "pending"),
                "claim_type": claim.get("claim_type", ""),
                "created_at": claim.get("created_at"),
            },
            "events": events,
        }

    except Exception as exc:
        logger.warning("Claim timeline fetch failed: %s", exc)
        return {"claim": None, "events": []}


@router.get("/corrections/overview")
def get_corrections_overview(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)

        q = supabase.table("claims").select("id, status, claim_type, created_at")
        if biz:
            q = q.eq("business_id", biz["id"])
        claims_res = q.execute()
        claims = claims_res.data or []

        total = len(claims)
        pending = sum(1 for c in claims if c.get("status") == "pending")
        deployed = sum(1 for c in claims if c.get("status") == "correction_deployed")
        resolved = sum(1 for c in claims if c.get("status") == "resolved")

        events_res = supabase.table("claim_events").select("event_type", count="exact").execute()

        return {
            "total_claims": total,
            "pending": pending,
            "correction_deployed": deployed,
            "resolved": resolved,
            "resolution_rate": round(resolved / max(1, total) * 100, 1),
            "pipeline": {
                "detected": total,
                "content_deployed": deployed + resolved,
                "requery_complete": resolved,
                "resolved": resolved,
            },
        }

    except Exception as exc:
        logger.warning("Corrections overview fetch failed: %s", exc)
        return {
            "total_claims": 0,
            "pending": 0,
            "correction_deployed": 0,
            "resolved": 0,
            "resolution_rate": 0,
            "pipeline": {"detected": 0, "content_deployed": 0, "requery_complete": 0, "resolved": 0},
        }
