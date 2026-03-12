import logging

from fastapi import APIRouter, HTTPException

from app.schemas import ClaimUpdate
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hallucinations"])

MOCK_FALLBACK_CLAIMS = [
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
    try:
        supabase = get_supabase()
        claims_res = supabase.table("claims").select("*").execute()
        claims = claims_res.data or []

        enriched = []
        for c in claims:
            item = {
                "id": c["id"],
                "claim": c.get("claim_value", ""),
                "actual": c.get("verified_value", ""),
                "status": c.get("status", "pending"),
                "created_at": c.get("created_at", ""),
                "claim_type": c.get("claim_type", ""),
            }
            resp_id = c.get("response_id")
            if resp_id:
                resp = (
                    supabase.table("llm_responses")
                    .select("llm_name, query_id")
                    .eq("id", resp_id)
                    .limit(1)
                    .execute()
                )
                if resp.data:
                    item["llm"] = resp.data[0].get("llm_name", "Unknown")
                    query_id = resp.data[0].get("query_id")
                    if query_id:
                        q = (
                            supabase.table("queries")
                            .select("text")
                            .eq("id", query_id)
                            .limit(1)
                            .execute()
                        )
                        if q.data:
                            item["query"] = q.data[0].get("text", "")
                else:
                    item["llm"] = "Unknown"
            else:
                item["llm"] = "Unknown"
            enriched.append(item)

        return {"claims": enriched, "total": len(enriched)}

    except Exception as exc:
        logger.warning("Hallucinations Supabase query failed, using mock: %s", exc)
        return {"claims": MOCK_FALLBACK_CLAIMS, "total": len(MOCK_FALLBACK_CLAIMS)}


@router.patch("/hallucinations/{claim_id}")
def update_claim(claim_id: str, update: ClaimUpdate):
    try:
        supabase = get_supabase()
        result = (
            supabase.table("claims")
            .update({"status": update.status.value})
            .eq("id", claim_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
        return {"claim": result.data[0], "message": "Claim updated successfully"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Claim update Supabase failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update claim")
