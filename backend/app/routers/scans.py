import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scans"])


async def _run_scan_task(business_id: str):
    """Background task that runs the analytics scan."""
    try:
        from app.agents.analytics import run_analytics_scan

        supabase = get_supabase()

        biz = supabase.table("businesses").select("name, user_id").eq("id", business_id).limit(1).execute()
        business_name = biz.data[0]["name"] if biz.data else "Your Brand"
        user_id = biz.data[0].get("user_id") if biz.data else None

        prompts_res = (
            supabase.table("queries")
            .select("text")
            .eq("business_id", business_id)
            .execute()
        )
        prompt_texts = [p["text"] for p in (prompts_res.data or [])]

        if not prompt_texts:
            prompt_texts = ["What are the best options for this type of business?"]

        scan_start = datetime.now(timezone.utc).isoformat()

        await run_analytics_scan(
            prompts=prompt_texts,
            business_name=business_name,
            supabase_client=supabase,
        )

        _post_scan_alerts(supabase, user_id, scan_start)
        _post_scan_snapshot(supabase, business_id)

    except Exception as exc:
        logger.error("Background scan failed: %s", exc)


def _post_scan_alerts(supabase, user_id: str | None, scan_start: str):
    """Check for new claims since scan_start and send hallucination alerts if enabled."""
    if not user_id:
        return
    try:
        new_claims_res = (
            supabase.table("claims")
            .select("*")
            .gte("created_at", scan_start)
            .execute()
        )
        new_claims = new_claims_res.data or []
        if not new_claims:
            return

        prefs = None
        try:
            prefs_res = (
                supabase.table("notification_preferences")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            prefs = prefs_res.data[0] if prefs_res.data else None
        except Exception as prefs_exc:
            if "PGRST205" not in str(prefs_exc):
                logger.warning("Could not read notification prefs: %s", prefs_exc)

        if prefs and not prefs.get("hallucination_alerts", True):
            return

        user_res = supabase.auth.admin.get_user_by_id(user_id)
        to_email = (prefs.get("email") if prefs and prefs.get("email") else None) or (
            user_res.user.email if user_res.user else None
        )
        if not to_email:
            return

        from app.services.email import send_hallucination_alert
        success = send_hallucination_alert(to_email, new_claims)

        try:
            supabase.table("notification_log").insert({
                "user_id": user_id,
                "type": "hallucination_alert",
                "subject": f"{len(new_claims)} new hallucination(s) detected",
                "status": "sent" if success else "failed",
            }).execute()
        except Exception as log_exc:
            if "PGRST205" not in str(log_exc):
                logger.warning("Could not write notification log: %s", log_exc)

    except Exception as exc:
        logger.warning("Post-scan alert failed: %s", exc)


def _post_scan_snapshot(supabase, business_id: str):
    """Create a visibility snapshot after a scan completes."""
    try:
        from app.routers.history import _build_snapshot
        snapshot = _build_snapshot(supabase, business_id)
        supabase.table("visibility_snapshots").insert(snapshot).execute()
        logger.info("Visibility snapshot created for business %s", business_id)
    except Exception as exc:
        logger.warning("Post-scan snapshot failed: %s", exc)


@router.post("/run-scan")
def run_scan(background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())

    try:
        supabase = get_supabase()
        biz = supabase.table("businesses").select("id").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None
    except Exception:
        business_id = None

    if business_id:
        background_tasks.add_task(_run_scan_task, business_id)
        status = "scanning"
    else:
        status = "queued"

    return {
        "job_id": job_id,
        "status": status,
        "message": "Scan has been queued for execution",
    }
