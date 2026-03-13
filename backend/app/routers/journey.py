import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["journey"])

PHASES = {
    1: "Onboarding",
    2: "Baseline Audit",
    3: "Recommended Actions",
    4: "Agent Operation",
    5: "Correction Timeline",
    6: "Growth & ROI",
}


def _default_journey(business_id: str) -> dict:
    return {
        "business_id": business_id,
        "current_phase": 1,
        "phases": [
            {"phase": i, "name": name, "completed": False, "completed_at": None}
            for i, name in PHASES.items()
        ],
    }


@router.get("/journey")
def get_journey(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return _default_journey("")

        business_id = biz["id"]

        result = (
            supabase.table("business_journey")
            .select("*")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return _default_journey(business_id)

        row = result.data[0]
        phases = []
        for i, name in PHASES.items():
            key = f"phase{i}_completed_at"
            completed_at = row.get(key)
            phases.append({
                "phase": i,
                "name": name,
                "completed": completed_at is not None,
                "completed_at": completed_at,
            })

        return {
            "business_id": business_id,
            "current_phase": row.get("current_phase", 1),
            "phases": phases,
        }

    except Exception as exc:
        logger.warning("Journey fetch failed: %s", exc)
        return _default_journey("")


@router.post("/journey/advance")
def advance_journey(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            raise HTTPException(status_code=404, detail="No business found")

        business_id = biz["id"]
        now = datetime.now(timezone.utc).isoformat()

        existing = (
            supabase.table("business_journey")
            .select("*")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            supabase.table("business_journey").insert({
                "business_id": business_id,
                "current_phase": 2,
                "phase1_completed_at": now,
            }).execute()
            return {"current_phase": 2, "message": "Advanced to phase 2"}

        row = existing.data[0]
        current = row.get("current_phase", 1)
        if current >= 6:
            return {"current_phase": 6, "message": "Already at final phase"}

        next_phase = current + 1
        update = {
            "current_phase": next_phase,
            f"phase{current}_completed_at": now,
            "updated_at": now,
        }
        supabase.table("business_journey").update(update).eq("id", row["id"]).execute()
        return {"current_phase": next_phase, "message": f"Advanced to phase {next_phase}"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Journey advance failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to advance journey")
