import logging

from fastapi import APIRouter, HTTPException

from app.schemas import DeleteAccountRequest
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["user"])

MOCK_PROFILE = {
    "id": "demo-user-001",
    "email": "demo@geomav.com",
    "display_name": "Demo User",
    "avatar_url": None,
    "created_at": "2024-01-01T00:00:00Z",
}


@router.get("/user/profile")
def get_user_profile(user_id: str | None = None):
    """Returns user metadata from Supabase Auth. Falls back to dummy data on error."""
    if not user_id:
        return MOCK_PROFILE

    try:
        supabase = get_supabase()
        response = supabase.auth.admin.get_user_by_id(user_id)
        user = response.user
        if not user:
            return MOCK_PROFILE

        metadata = getattr(user, "user_metadata", None) or {}
        display_name = (
            metadata.get("display_name")
            or metadata.get("full_name")
            or user.email
            or "User"
        )
        created_at = getattr(user, "created_at", None)
        created_str = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at or "")

        return {
            "id": user.id,
            "email": user.email or "",
            "display_name": display_name,
            "avatar_url": metadata.get("avatar_url"),
            "created_at": created_str,
        }
    except Exception as exc:
        logger.warning("User profile Supabase query failed, using mock: %s", exc)
        return MOCK_PROFILE


@router.delete("/user/account")
def delete_account(req: DeleteAccountRequest):
    """Deletes the user via Supabase Admin API. Cascades to businesses and linked data."""
    try:
        supabase = get_supabase()
        supabase.auth.admin.delete_user(req.user_id)
        return {"message": "Account deleted successfully"}
    except Exception as exc:
        logger.warning("Account deletion failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to delete account")
