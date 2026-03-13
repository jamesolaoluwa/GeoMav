import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.schemas import ClaimUpdate
from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hallucinations"])

@router.get("/hallucinations")
def list_hallucinations(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        q = supabase.table("claims").select("*")
        if biz:
            q = q.eq("business_id", biz["id"])
        claims_res = q.execute()
        claims = claims_res.data or []

        enriched = []
        for c in claims:
            item = {
                "id": c["id"],
                "claim_value": c.get("claim_value", ""),
                "verified_value": c.get("verified_value", ""),
                "status": c.get("status", "pending"),
                "created_at": c.get("created_at", ""),
                "claim_type": c.get("claim_type", ""),
                "llm_name": "Unknown",
                "query_text": "",
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
                    item["llm_name"] = resp.data[0].get("llm_name", "Unknown")
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
                            item["query_text"] = q.data[0].get("text", "")
            enriched.append(item)

        return {"claims": enriched, "total": len(enriched)}

    except Exception as exc:
        logger.warning("Hallucinations Supabase query failed, using mock: %s", exc)
        return {"claims": [], "total": 0}


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
