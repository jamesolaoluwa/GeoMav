import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ethics"])


class EthicsFlagUpdate(BaseModel):
    status: str


@router.get("/ethics")
def list_ethics_flags(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return {"flags": [], "total": 0, "summary": _empty_summary()}

        business_id = biz["id"]

        result = (
            supabase.table("ethics_flags")
            .select("*")
            .eq("business_id", business_id)
            .order("created_at", desc=True)
            .execute()
        )
        flags = result.data or []

        summary = {
            "total": len(flags),
            "open": sum(1 for f in flags if f.get("status") == "open"),
            "acknowledged": sum(1 for f in flags if f.get("status") == "acknowledged"),
            "resolved": sum(1 for f in flags if f.get("status") == "resolved"),
            "by_type": {},
            "by_severity": {},
        }
        for f in flags:
            ft = f.get("flag_type", "unknown")
            sv = f.get("severity", "medium")
            summary["by_type"][ft] = summary["by_type"].get(ft, 0) + 1
            summary["by_severity"][sv] = summary["by_severity"].get(sv, 0) + 1

        return {"flags": flags, "total": len(flags), "summary": summary}

    except Exception as exc:
        logger.warning("Ethics flags fetch failed: %s", exc)
        return {"flags": [], "total": 0, "summary": _empty_summary()}


@router.patch("/ethics/{flag_id}")
def update_ethics_flag(flag_id: str, update: EthicsFlagUpdate):
    try:
        supabase = get_supabase()
        result = (
            supabase.table("ethics_flags")
            .update({"status": update.status})
            .eq("id", flag_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Flag not found")
        return {"flag": result.data[0], "message": "Flag updated"}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Ethics flag update failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update flag")


def _empty_summary() -> dict:
    return {
        "total": 0,
        "open": 0,
        "acknowledged": 0,
        "resolved": 0,
        "by_type": {},
        "by_severity": {},
    }
