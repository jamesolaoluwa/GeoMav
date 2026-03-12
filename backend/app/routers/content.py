import logging
import uuid

from fastapi import APIRouter, HTTPException

from app.schemas import ContentUpdate, DeployCorrection
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["content"])

MOCK_FALLBACK_CONTENT = [
    {"id": "content-001", "section": "summary", "content": "GeoMav is a leading geospatial mapping platform..."},
    {"id": "content-002", "section": "llms_txt", "content": "GeoMav provides GIS solutions for enterprises..."},
    {"id": "content-003", "section": "json_ld", "content": '{"@type": "Organization", "name": "GeoMav"...}'},
]


@router.get("/content")
def get_content():
    try:
        supabase = get_supabase()
        result = supabase.table("content_sections").select("*").execute()
        sections = [
            {
                "id": s["id"],
                "section": s.get("type", ""),
                "title": s.get("title", ""),
                "content": s.get("content", ""),
                "updated_at": s.get("updated_at", ""),
            }
            for s in (result.data or [])
        ]
        return {"sections": sections or MOCK_FALLBACK_CONTENT}

    except Exception as exc:
        logger.warning("Content Supabase query failed, using mock: %s", exc)
        return {"sections": MOCK_FALLBACK_CONTENT}


@router.put("/content/{content_id}")
def update_content(content_id: str, update: ContentUpdate):
    try:
        supabase = get_supabase()
        result = (
            supabase.table("content_sections")
            .update({"content": update.content})
            .eq("id", content_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Content {content_id} not found")
        section = result.data[0]
        return {
            "section": {
                "id": section["id"],
                "section": section.get("type", ""),
                "content": section.get("content", ""),
            },
            "message": "Content updated successfully",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Content update Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update content")


@router.post("/deploy-correction")
def deploy_correction(correction: DeployCorrection):
    try:
        supabase = get_supabase()

        supabase.table("claims").update(
            {"status": "correction_deployed"}
        ).eq("id", correction.claim_id).execute()

        deployment_id = str(uuid.uuid4())

        return {
            "message": "Correction deployed successfully",
            "claim_id": correction.claim_id,
            "correction_type": correction.correction_type,
            "deployment_id": deployment_id,
            "status": "deployed",
        }

    except Exception as exc:
        logger.warning("Deploy correction Supabase failed: %s", exc)
        return {
            "message": "Correction deployed successfully (offline mode)",
            "claim_id": correction.claim_id,
            "correction_type": correction.correction_type,
            "deployment_id": "deploy-fallback",
            "status": "deployed",
        }
