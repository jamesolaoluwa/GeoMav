from fastapi import APIRouter, HTTPException

from app.schemas import ClaimUpdate

router = APIRouter(tags=["hallucinations"])

MOCK_CLAIMS = [
    {
        "id": "claim-001",
        "llm": "GPT-4",
        "claim": "GeoMav was founded in 2018",
        "actual": "GeoMav was founded in 2020",
        "status": "pending",
        "created_at": "2025-03-10T14:30:00Z",
    },
    {
        "id": "claim-002",
        "llm": "Claude",
        "claim": "GeoMav has 500+ employees",
        "actual": "GeoMav has 50+ employees",
        "status": "correction_deployed",
        "created_at": "2025-03-09T09:15:00Z",
    },
    {
        "id": "claim-003",
        "llm": "Gemini",
        "claim": "GeoMav is headquartered in San Francisco",
        "actual": "GeoMav is headquartered in Austin, TX",
        "status": "resolved",
        "created_at": "2025-03-08T11:00:00Z",
    },
]


@router.get("/hallucinations")
def list_hallucinations():
    """Returns list of claims (hallucinations)."""
    return {"claims": MOCK_CLAIMS, "total": len(MOCK_CLAIMS)}


@router.patch("/hallucinations/{claim_id}")
def update_claim(claim_id: str, update: ClaimUpdate):
    """Updates claim status using ClaimUpdate schema."""
    for claim in MOCK_CLAIMS:
        if claim["id"] == claim_id:
            claim["status"] = update.status.value
            return {"claim": claim, "message": "Claim updated successfully"}
    raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
