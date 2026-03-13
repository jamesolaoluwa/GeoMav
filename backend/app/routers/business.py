import logging
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas import BusinessUpdate, ApiKeysUpdate
from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["business"])

MOCK_FALLBACK = {
    "id": "biz-001",
    "name": "GeoMav",
    "website": "https://geomav.com",
    "category": "Geospatial Software",
    "description": "Leading provider of GIS and mapping solutions",
}


@router.get("/business")
def get_business(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id, "*")
        if not biz:
            return MOCK_FALLBACK
        return biz

    except Exception as exc:
        logger.warning("Business Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK


async def _run_enrichment_task(business_id: str):
    """Background task that runs web enrichment for a business."""
    try:
        from app.agents.web_enrichment import run_web_enrichment

        supabase = get_supabase()
        biz = supabase.table("businesses").select("*").eq("id", business_id).limit(1).execute()
        if not biz.data:
            logger.warning("Enrichment task: business %s not found", business_id)
            return
        await run_web_enrichment(biz.data[0], supabase_client=supabase)
    except Exception as exc:
        logger.error("Background enrichment failed for %s: %s", business_id, exc)


@router.put("/business")
def update_business(update: BusinessUpdate, background_tasks: BackgroundTasks, user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id, "*")
        if not biz:
            raise HTTPException(status_code=404, detail="No business found")

        business_id = biz["id"]
        old_website = biz.get("website", "")
        fields = update.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = (
            supabase.table("businesses")
            .update(fields)
            .eq("id", business_id)
            .execute()
        )

        new_website = fields.get("website", "")
        if new_website and new_website != old_website:
            background_tasks.add_task(_run_enrichment_task, business_id)

        return {"business": result.data[0] if result.data else fields, "message": "Business updated successfully"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Business update Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update business")


@router.put("/api-keys")
def save_api_keys(update: ApiKeysUpdate):
    """Persist LLM API keys to the environment / settings reload."""
    import os
    from app.config import get_settings
    try:
        fields = update.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No keys provided")

        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", ".env")
        env_lines: list[str] = []
        existing_keys: set[str] = set()
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                env_lines = f.readlines()

        key_map = {
            "openai_api_key": "OPENAI_API_KEY",
            "anthropic_api_key": "ANTHROPIC_API_KEY",
            "google_gemini_api_key": "GOOGLE_GEMINI_API_KEY",
            "perplexity_api_key": "PERPLEXITY_API_KEY",
        }

        new_lines = []
        for line in env_lines:
            stripped = line.strip()
            replaced = False
            for field_name, env_name in key_map.items():
                if field_name in fields and stripped.startswith(f"{env_name}="):
                    new_lines.append(f"{env_name}={fields[field_name]}\n")
                    existing_keys.add(field_name)
                    replaced = True
                    break
            if not replaced:
                new_lines.append(line)

        for field_name, env_name in key_map.items():
            if field_name in fields and field_name not in existing_keys:
                new_lines.append(f"{env_name}={fields[field_name]}\n")

        with open(env_path, "w") as f:
            f.writelines(new_lines)

        for field_name, env_name in key_map.items():
            if field_name in fields:
                os.environ[env_name] = fields[field_name]

        get_settings.cache_clear()

        return {"message": "API keys saved successfully", "keys_updated": list(fields.keys())}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("API keys save failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to save API keys")


@router.post("/enrich-business")
def enrich_business(background_tasks: BackgroundTasks, user_id: Optional[str] = None):
    job_id = str(uuid.uuid4())
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id, "id, website")
        if not biz:
            raise HTTPException(status_code=404, detail="No business found")

        business_id = biz["id"]
        website = biz.get("website", "")
        if not website:
            raise HTTPException(status_code=400, detail="No website URL set on business profile")

        background_tasks.add_task(_run_enrichment_task, business_id)
        return {"job_id": job_id, "status": "enriching", "message": "Web enrichment started"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Enrich-business failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to start enrichment")
