from supabase import create_client, Client
from app.config import get_settings


def get_supabase() -> Client:
    settings = get_settings()
    url = settings.supabase_url or settings.next_public_supabase_url
    key = settings.supabase_service_role_key
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
        )
    return create_client(url, key)
