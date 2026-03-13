import logging
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business
from app import cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["estimator"])


@router.get("/estimate")
async def get_estimate(user_id: Optional[str] = None):
    cache_key = f"estimate::{user_id or 'anon'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id, "*")
        if not biz:
            from app.agents.estimator import _mock_estimate
            result = _mock_estimate("Your Brand", "Business")
            cache.set(cache_key, result)
            return result

        from app.agents.estimator import estimate_metrics
        result = await estimate_metrics(biz)
        cache.set(cache_key, result, ttl=300)
        return result

    except Exception as exc:
        logger.warning("Estimation failed: %s", exc)
        from app.agents.estimator import _mock_estimate
        return _mock_estimate("Your Brand", "Business")
