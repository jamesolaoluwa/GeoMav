import logging

from fastapi import APIRouter, HTTPException

from app.schemas import OpportunityUpdate
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["opportunities"])

MOCK_FALLBACK_OPPORTUNITIES = [
    {
        "id": "opp-001",
        "title": "Improve GPT-4 visibility for product queries",
        "description": "GPT-4 mentions GeoMav in only 60% of product-related queries",
        "priority": "high",
        "impact_score": 85,
        "effort": "medium",
        "status": "open",
        "created_at": "2025-03-10T10:00:00Z",
    },
    {
        "id": "opp-002",
        "title": "Fix Gemini headquarters misinformation",
        "description": "Gemini incorrectly states San Francisco as HQ",
        "priority": "high",
        "impact_score": 90,
        "effort": "low",
        "status": "in_progress",
        "created_at": "2025-03-09T14:30:00Z",
    },
    {
        "id": "opp-003",
        "title": "Improve Llama presence in comparison queries",
        "description": "GeoMav rarely appears in Llama comparison responses",
        "priority": "medium",
        "impact_score": 65,
        "effort": "high",
        "status": "open",
        "created_at": "2025-03-08T09:15:00Z",
    },
]


@router.get("/opportunities")
def list_opportunities():
    try:
        supabase = get_supabase()
        result = (
            supabase.table("opportunities")
            .select("*")
            .order("impact", desc=True)
            .order("status")
            .execute()
        )
        opportunities = result.data or []

        formatted = [
            {
                "id": o["id"],
                "title": o.get("title", ""),
                "description": o.get("description", ""),
                "category": o.get("category", ""),
                "impact_score": o.get("impact", 0),
                "status": o.get("status", "open"),
                "suggested_fix": o.get("suggested_fix", ""),
                "created_at": o.get("created_at", ""),
            }
            for o in opportunities
        ]
        return {
            "opportunities": formatted,
            "total": len(formatted),
        }

    except Exception as exc:
        logger.warning("Opportunities Supabase query failed, using mock: %s", exc)
        return {
            "opportunities": sorted(MOCK_FALLBACK_OPPORTUNITIES, key=lambda x: x["impact_score"], reverse=True),
            "total": len(MOCK_FALLBACK_OPPORTUNITIES),
        }


@router.patch("/opportunities/{opportunity_id}")
def update_opportunity(opportunity_id: str, update: OpportunityUpdate):
    try:
        supabase = get_supabase()
        result = (
            supabase.table("opportunities")
            .update({"status": update.status.value})
            .eq("id", opportunity_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Opportunity {opportunity_id} not found")
        return {"opportunity": result.data[0], "message": "Opportunity updated successfully"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Opportunity update Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update opportunity")
