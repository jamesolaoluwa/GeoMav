import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["agents"])

DEFAULT_LLMS = ["ChatGPT", "Gemini", "Claude", "Perplexity", "Bing", "DeepSeek"]


class AgentSettingsUpdate(BaseModel):
    monitored_llms: Optional[list[str]] = None
    scan_frequency: Optional[str] = None
    scan_hour: Optional[int] = None
    auto_deploy_corrections: Optional[bool] = None


@router.get("/agents/settings")
def get_agent_settings(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return {
                "monitored_llms": DEFAULT_LLMS,
                "scan_frequency": "weekly",
                "scan_hour": 9,
                "auto_deploy_corrections": False,
            }

        business_id = biz["id"]
        result = (
            supabase.table("agent_settings")
            .select("*")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            return {
                "business_id": business_id,
                "monitored_llms": DEFAULT_LLMS,
                "scan_frequency": "weekly",
                "scan_hour": 9,
                "auto_deploy_corrections": False,
            }

        row = result.data[0]
        return {
            "business_id": business_id,
            "monitored_llms": row.get("monitored_llms", DEFAULT_LLMS),
            "scan_frequency": row.get("scan_frequency", "weekly"),
            "scan_hour": row.get("scan_hour", 9),
            "auto_deploy_corrections": row.get("auto_deploy_corrections", False),
        }

    except Exception as exc:
        logger.warning("Agent settings fetch failed: %s", exc)
        return {
            "monitored_llms": DEFAULT_LLMS,
            "scan_frequency": "weekly",
            "scan_hour": 9,
            "auto_deploy_corrections": False,
        }


@router.put("/agents/settings")
def update_agent_settings(update: AgentSettingsUpdate, user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            raise HTTPException(status_code=404, detail="No business found")

        business_id = biz["id"]
        fields = update.model_dump(exclude_none=True)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        existing = (
            supabase.table("agent_settings")
            .select("id")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
        )

        if existing.data:
            supabase.table("agent_settings").update(fields).eq("id", existing.data[0]["id"]).execute()
        else:
            fields["business_id"] = business_id
            supabase.table("agent_settings").insert(fields).execute()

        return {"message": "Agent settings updated", **fields}

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Agent settings update failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update agent settings")


@router.get("/agents/metrics")
def get_agent_metrics(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return {"agents": []}

        business_id = biz["id"]

        runs_res = (
            supabase.table("agent_runs")
            .select("*")
            .eq("business_id", business_id)
            .order("started_at", desc=True)
            .limit(50)
            .execute()
        )
        runs = runs_res.data or []

        agents_map: dict[str, dict] = {}
        for agent_type in ["analytics", "enrichment", "reinforcement"]:
            agent_runs = [r for r in runs if r.get("agent_type") == agent_type]
            total = len(agent_runs)
            completed = sum(1 for r in agent_runs if r.get("status") == "completed")
            failed = sum(1 for r in agent_runs if r.get("status") == "failed")
            last_run = agent_runs[0] if agent_runs else None
            total_items = sum(r.get("items_processed", 0) for r in agent_runs)
            total_llm_calls = sum(r.get("llm_calls", 0) for r in agent_runs)
            total_errors = sum(r.get("errors", 0) for r in agent_runs)
            avg_duration = (
                round(sum(r.get("duration_ms", 0) for r in agent_runs if r.get("duration_ms")) / max(1, completed))
                if completed > 0
                else 0
            )

            agents_map[agent_type] = {
                "agent_type": agent_type,
                "total_runs": total,
                "completed": completed,
                "failed": failed,
                "success_rate": round(completed / max(1, total) * 100, 1),
                "total_items_processed": total_items,
                "total_llm_calls": total_llm_calls,
                "total_errors": total_errors,
                "avg_duration_ms": avg_duration,
                "last_run": {
                    "status": last_run.get("status"),
                    "started_at": last_run.get("started_at"),
                    "completed_at": last_run.get("completed_at"),
                    "duration_ms": last_run.get("duration_ms"),
                    "items_processed": last_run.get("items_processed"),
                } if last_run else None,
            }

        return {"agents": list(agents_map.values())}

    except Exception as exc:
        logger.warning("Agent metrics fetch failed: %s", exc)
        return {"agents": []}
