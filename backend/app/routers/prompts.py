import logging

from fastapi import APIRouter, HTTPException

from app.schemas import PromptCreate
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["prompts"])

MOCK_FALLBACK_PROMPTS = [
    {"id": "prompt-001", "text": "What are the best geospatial mapping solutions?", "category": "product"},
    {"id": "prompt-002", "text": "Compare GIS software for enterprise use", "category": "comparison"},
    {"id": "prompt-003", "text": "Who provides mapping APIs for developers?", "category": "technical"},
]


@router.get("/prompts")
def list_prompts():
    try:
        supabase = get_supabase()
        biz = supabase.table("businesses").select("id").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None

        query = supabase.table("queries").select("*").order("created_at", desc=True)
        if business_id:
            query = query.eq("business_id", business_id)
        result = query.execute()

        prompts = [
            {"id": p["id"], "text": p.get("text", ""), "category": p.get("category", "")}
            for p in (result.data or [])
        ]
        return {"prompts": prompts, "total": len(prompts)}

    except Exception as exc:
        logger.warning("Prompts Supabase query failed, using mock: %s", exc)
        return {"prompts": MOCK_FALLBACK_PROMPTS, "total": len(MOCK_FALLBACK_PROMPTS)}


@router.post("/prompts")
def create_prompt(prompt: PromptCreate):
    try:
        supabase = get_supabase()
        biz = supabase.table("businesses").select("id").limit(1).execute()
        business_id = biz.data[0]["id"] if biz.data else None

        row = {"text": prompt.text, "category": prompt.category}
        if business_id:
            row["business_id"] = business_id

        result = supabase.table("queries").insert(row).execute()
        new_prompt = result.data[0] if result.data else row
        return {"prompt": new_prompt, "message": "Prompt created successfully"}

    except Exception as exc:
        logger.warning("Prompt creation Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create prompt")


@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: str):
    try:
        supabase = get_supabase()
        result = supabase.table("queries").delete().eq("id", prompt_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
        return {"message": "Prompt deleted successfully", "deleted": result.data[0]}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Prompt deletion Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to delete prompt")
