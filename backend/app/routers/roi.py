import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["roi"])


@router.get("/roi")
def get_roi_dashboard(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return _empty_roi()

        business_id = biz["id"]

        snapshots_res = (
            supabase.table("visibility_snapshots")
            .select("*")
            .eq("business_id", business_id)
            .order("snapshot_date", desc=True)
            .limit(90)
            .execute()
        )
        snapshots = list(reversed(snapshots_res.data or []))

        claims_res = supabase.table("claims").select("id, status, created_at").execute()
        claims = claims_res.data or []
        total_claims = len(claims)
        resolved_claims = sum(1 for c in claims if c.get("status") == "resolved")

        # Truth score: % of verified/resolved claims
        truth_score = round(resolved_claims / max(1, total_claims) * 100, 1)

        # Visibility trend
        vis_trend = [
            {"date": s.get("snapshot_date", ""), "visibility_score": s.get("visibility_score", 0)}
            for s in snapshots
        ]

        # Trust score trend (combines visibility + truth)
        trust_trend = []
        for s in snapshots:
            vis = s.get("visibility_score", 0) or 0
            claim_count = s.get("claim_count", 0) or 0
            pending = s.get("pending_claims", 0) or 0
            resolved_at_snap = max(0, claim_count - pending)
            snap_truth = round(resolved_at_snap / max(1, claim_count) * 100, 1) if claim_count > 0 else 100
            trust = round((vis * 0.6 + snap_truth * 0.4), 1)
            trust_trend.append({
                "date": s.get("snapshot_date", ""),
                "trust_score": trust,
                "visibility_score": vis,
                "truth_score": snap_truth,
            })

        # Projected growth (linear extrapolation over 90 days)
        projected_growth = None
        if len(snapshots) >= 2:
            first_vis = snapshots[0].get("visibility_score", 0) or 0
            last_vis = snapshots[-1].get("visibility_score", 0) or 0
            days = max(1, len(snapshots))
            daily_rate = (last_vis - first_vis) / days
            projected_90d = round(last_vis + daily_rate * 90, 1)
            projected_growth = {
                "current": last_vis,
                "projected_90d": max(0, min(100, projected_90d)),
                "daily_rate": round(daily_rate, 3),
                "trend": "improving" if daily_rate > 0 else "declining" if daily_rate < 0 else "stable",
            }

        # ROI proxy
        content_res = supabase.table("content_sections").select("id", count="exact").execute()
        content_deployed = content_res.count or 0

        return {
            "truth_score": truth_score,
            "visibility_trend": vis_trend,
            "trust_trend": trust_trend,
            "projected_growth": projected_growth,
            "claims_resolved": resolved_claims,
            "total_claims": total_claims,
            "content_deployed": content_deployed,
            "resolution_rate": round(resolved_claims / max(1, total_claims) * 100, 1),
        }

    except Exception as exc:
        logger.warning("ROI dashboard fetch failed: %s", exc)
        return _empty_roi()


@router.get("/roi/agent-report")
def get_agent_performance_report(user_id: Optional[str] = None):
    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        if not biz:
            return {"reports": []}

        business_id = biz["id"]

        reports_res = (
            supabase.table("agent_performance_reports")
            .select("*")
            .eq("business_id", business_id)
            .order("report_period_end", desc=True)
            .limit(10)
            .execute()
        )

        if not reports_res.data:
            return {
                "reports": [],
                "latest": _compute_live_report(supabase, business_id),
            }

        return {
            "reports": reports_res.data,
            "latest": _compute_live_report(supabase, business_id),
        }

    except Exception as exc:
        logger.warning("Agent performance report failed: %s", exc)
        return {"reports": [], "latest": None}


def _compute_live_report(supabase, business_id: str) -> dict:
    try:
        runs_res = (
            supabase.table("agent_runs")
            .select("agent_type, items_processed, llm_calls, errors, status")
            .eq("business_id", business_id)
            .execute()
        )
        runs = runs_res.data or []

        report = {}
        for agent_type in ["analytics", "enrichment", "reinforcement"]:
            agent_runs = [r for r in runs if r.get("agent_type") == agent_type]
            completed = sum(1 for r in agent_runs if r.get("status") == "completed")
            items = sum(r.get("items_processed", 0) for r in agent_runs)
            report[agent_type] = {
                "runs": len(agent_runs),
                "completed": completed,
                "items_processed": items,
            }

        claims_res = supabase.table("claims").select("status", count="exact").execute()
        claims = claims_res.data or []
        resolved = sum(1 for c in claims if c.get("status") == "resolved")

        content_res = supabase.table("content_sections").select("id", count="exact").execute()

        report["summary"] = {
            "claims_resolved": resolved,
            "content_sections": content_res.count or 0,
        }

        return report
    except Exception:
        return {}


def _empty_roi() -> dict:
    return {
        "truth_score": 0,
        "visibility_trend": [],
        "trust_trend": [],
        "projected_growth": None,
        "claims_resolved": 0,
        "total_claims": 0,
        "content_deployed": 0,
        "resolution_rate": 0,
    }
