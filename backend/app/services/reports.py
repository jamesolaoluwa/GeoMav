import logging
from datetime import datetime, timedelta, timezone

from app.supabase_client import get_supabase
from app.services.email import send_weekly_report

logger = logging.getLogger(__name__)


def generate_weekly_report(business_id: str) -> dict:
    """Build the weekly report payload for a single business."""
    supabase = get_supabase()
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    mentions_res = (
        supabase.table("mentions")
        .select("*")
        .eq("business_id", business_id)
        .gte("created_at", week_ago)
        .execute()
    )
    mentions = mentions_res.data or []

    claims_res = (
        supabase.table("claims")
        .select("*")
        .gte("created_at", week_ago)
        .execute()
    )
    claims = claims_res.data or []
    pending = sum(1 for c in claims if c.get("status") == "pending")

    ranks = [m.get("rank") or 5 for m in mentions]
    avg_rank = sum(ranks) / len(ranks) if ranks else 5
    visibility_score = round(max(0, 100 - avg_rank * 10), 1)

    opps_res = (
        supabase.table("opportunities")
        .select("title, impact")
        .eq("business_id", business_id)
        .eq("status", "open")
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    return {
        "visibility_score": visibility_score,
        "mention_count": len(mentions),
        "new_claims": len(claims),
        "pending_claims": pending,
        "top_opportunities": opps_res.data or [],
    }


def run_weekly_reports():
    """Scheduled job: send weekly reports to all opted-in users."""
    try:
        supabase = get_supabase()

        try:
            prefs_res = (
                supabase.table("notification_preferences")
                .select("*")
                .eq("weekly_report", True)
                .execute()
            )
            subscribers = prefs_res.data or []
        except Exception as exc:
            if "PGRST205" in str(exc) or "schema cache" in str(exc):
                logger.info("notification_preferences table not yet migrated, skipping weekly reports")
                return
            raise

        for sub in subscribers:
            user_id = sub.get("user_id")
            if not user_id:
                continue

            biz_res = (
                supabase.table("businesses")
                .select("id")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if not biz_res.data:
                continue
            business_id = biz_res.data[0]["id"]

            try:
                user_res = supabase.auth.admin.get_user_by_id(user_id)
                to_email = sub.get("email") or (user_res.user.email if user_res.user else None)
            except Exception:
                to_email = sub.get("email")

            if not to_email:
                continue

            report_data = generate_weekly_report(business_id)
            success = send_weekly_report(to_email, report_data)

            try:
                supabase.table("notification_log").insert({
                    "user_id": user_id,
                    "type": "weekly_report",
                    "subject": "Weekly Visibility Report",
                    "status": "sent" if success else "failed",
                }).execute()
            except Exception as log_exc:
                if "PGRST205" not in str(log_exc):
                    logger.warning("Could not write notification log: %s", log_exc)

        logger.info("Weekly reports sent to %d subscriber(s)", len(subscribers))

    except Exception as exc:
        logger.error("Weekly report job failed: %s", exc)
