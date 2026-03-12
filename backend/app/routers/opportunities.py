from fastapi import APIRouter, HTTPException

from app.schemas import OpportunityUpdate

router = APIRouter(tags=["opportunities"])

MOCK_OPPORTUNITIES = [
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
    """Returns prioritized list of opportunities."""
    return {
        "opportunities": sorted(MOCK_OPPORTUNITIES, key=lambda x: x["impact_score"], reverse=True),
        "total": len(MOCK_OPPORTUNITIES),
    }


@router.patch("/opportunities/{opportunity_id}")
def update_opportunity(opportunity_id: str, update: OpportunityUpdate):
    """Updates opportunity status using OpportunityUpdate schema."""
    for opp in MOCK_OPPORTUNITIES:
        if opp["id"] == opportunity_id:
            opp["status"] = update.status.value
            return {"opportunity": opp, "message": "Opportunity updated successfully"}
    raise HTTPException(status_code=404, detail=f"Opportunity {opportunity_id} not found")
