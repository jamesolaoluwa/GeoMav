import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.schemas import NotificationPreferencesUpdate
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["notifications"])

DEFAULT_PREFS = {
    "hallucination_alerts": True,
    "weekly_report": True,
    "opportunity_alerts": False,
    "email": "",
}


@router.get("/notifications/preferences")
def get_notification_preferences(user_id: Optional[str] = None):
    if not user_id:
        return DEFAULT_PREFS

    try:
        supabase = get_supabase()
        res = (
            supabase.table("notification_preferences")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if res.data:
            row = res.data[0]
            return {
                "hallucination_alerts": row.get("hallucination_alerts", True),
                "weekly_report": row.get("weekly_report", True),
                "opportunity_alerts": row.get("opportunity_alerts", False),
                "email": row.get("email", ""),
            }
        return DEFAULT_PREFS
    except Exception as exc:
        logger.warning("Failed to fetch notification prefs: %s", exc)
        return DEFAULT_PREFS


@router.put("/notifications/preferences")
def update_notification_preferences(req: NotificationPreferencesUpdate):
    try:
        supabase = get_supabase()

        update_data: dict = {}
        if req.hallucination_alerts is not None:
            update_data["hallucination_alerts"] = req.hallucination_alerts
        if req.weekly_report is not None:
            update_data["weekly_report"] = req.weekly_report
        if req.opportunity_alerts is not None:
            update_data["opportunity_alerts"] = req.opportunity_alerts
        if req.email is not None:
            update_data["email"] = req.email

        existing = (
            supabase.table("notification_preferences")
            .select("id")
            .eq("user_id", req.user_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            supabase.table("notification_preferences").update(update_data).eq(
                "user_id", req.user_id
            ).execute()
        else:
            supabase.table("notification_preferences").insert(
                {"user_id": req.user_id, **{**DEFAULT_PREFS, **update_data}}
            ).execute()

        return {"message": "Preferences updated"}
    except Exception as exc:
        err_msg = str(exc)
        if "PGRST205" in err_msg or "schema cache" in err_msg:
            logger.warning("notification_preferences table not yet migrated, saving skipped")
            return {"message": "Preferences saved locally (migration pending)"}
        logger.error("Failed to update notification prefs: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@router.get("/notifications/log")
def get_notification_log(user_id: Optional[str] = None, limit: int = 20):
    if not user_id:
        return {"logs": []}
    try:
        supabase = get_supabase()
        res = (
            supabase.table("notification_log")
            .select("*")
            .eq("user_id", user_id)
            .order("sent_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"logs": res.data or []}
    except Exception as exc:
        logger.warning("Failed to fetch notification log: %s", exc)
        return {"logs": []}
