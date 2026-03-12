import logging
import uuid

from fastapi import APIRouter, BackgroundTasks

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scans"])


async def _run_scan_task(business_id: str):
    """Background task that runs the analytics scan."""
    try:
        from app.agents.analytics import run_analytics_scan

        supabase = get_supabase()

        biz = supabase.table("businesses").select("name").eq("id", business_id).limit(1).execute()
        business_name = biz.data[0]["name"] if biz.data else "Your Brand"

        prompts_res = (
            supabase.table("queries")
            .select("text")
            .eq("business_id", business_id)
            .execute()
        )
        prompt_texts = [p["text"] for p in (prompts_res.data or [])]

        if not prompt_texts:
            prompt_texts = ["What are the best options for this type of business?"]

        await run_analytics_scan(
            prompts=prompt_texts,
            business_name=business_name,
            supabase_client=supabase,
        )
    except Exception as exc:
        logger.error("Background scan failed: %s", exc)


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
