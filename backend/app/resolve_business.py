"""Shared helper to resolve a business row from user_id or fall back to limit(1)."""

from typing import Optional


def resolve_business(supabase, user_id: Optional[str] = None, columns: str = "id, name") -> Optional[dict]:
    """Return a single business dict scoped to user_id when provided, else first row."""
    if user_id:
        res = (
            supabase.table("businesses")
            .select(columns)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return res.data[0]
    res = supabase.table("businesses").select(columns).limit(1).execute()
    return res.data[0] if res.data else None
