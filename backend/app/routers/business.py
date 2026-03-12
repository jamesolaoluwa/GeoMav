import logging

from fastapi import APIRouter, HTTPException

from app.schemas import BusinessUpdate
from app.supabase_client import get_supabase

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
def get_business():
    try:
        supabase = get_supabase()
        result = supabase.table("businesses").select("*").limit(1).execute()
        if not result.data:
            return MOCK_FALLBACK
        return result.data[0]

    except Exception as exc:
        logger.warning("Business Supabase query failed, using mock: %s", exc)
        return MOCK_FALLBACK


@router.put("/business")
def update_business(update: BusinessUpdate):
    try:
        supabase = get_supabase()
        biz = supabase.table("businesses").select("id").limit(1).execute()
        if not biz.data:
            raise HTTPException(status_code=404, detail="No business found")

        business_id = biz.data[0]["id"]
        fields = update.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = (
            supabase.table("businesses")
            .update(fields)
            .eq("id", business_id)
            .execute()
        )
        return {"business": result.data[0] if result.data else fields, "message": "Business updated successfully"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Business update Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update business")
