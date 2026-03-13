import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business

logger = logging.getLogger(__name__)

router = APIRouter(tags=["scans"])

ACTIVE_LLM_COUNT = 6


async def _run_scan_task(business_id: str):
    """Background task that runs the analytics scan then reinforcement."""
    try:
        from app.agents.analytics import run_analytics_scan
        from app.agents.reinforcement import run_reinforcement

        supabase = get_supabase()

        biz = supabase.table("businesses").select("*").eq("id", business_id).limit(1).execute()
        if not biz.data:
            logger.warning("Scan task: business %s not found", business_id)
            return
        business = biz.data[0]
        business_name = business.get("name", "Your Brand")
        user_id = business.get("user_id")

        prompts_res = (
            supabase.table("queries")
            .select("id, text")
            .eq("business_id", business_id)
            .execute()
        )
        queries = prompts_res.data or []
        prompt_texts = [q["text"] for q in queries]
        query_ids = [q["id"] for q in queries]

        if not prompt_texts:
            try:
                from app.routers.onboard import generate_smart_queries, FALLBACK_TEMPLATES
                profile = {
                    "name": business_name,
                    "category": business.get("category", "Business"),
                    "description": business.get("description", ""),
                    "services": business.get("services", ""),
                    "location": business.get("location", ""),
                    "pricing": business.get("pricing", ""),
                }
                smart_queries = await generate_smart_queries(profile)
                if not smart_queries:
                    loc = business.get("location", "")
                    smart_queries = [
                        t.format(category=profile["category"].lower(), name=business_name, location=loc)
                        for t in FALLBACK_TEMPLATES
                        if "{location}" not in t or loc
                    ]

                query_rows = [
                    {"text": q, "category": business.get("category", "Business"), "business_id": business_id}
                    for q in smart_queries
                ]
                if query_rows:
                    insert_res = supabase.table("queries").insert(query_rows).execute()
                    inserted = insert_res.data or []
                    prompt_texts = [q["text"] for q in inserted]
                    query_ids = [q["id"] for q in inserted]
            except Exception as gen_exc:
                logger.warning("Auto-query generation failed: %s", gen_exc)

            if not prompt_texts:
                prompt_texts = [f"best {business.get('category', 'business').lower()} near me"]
                query_ids = []

        scan_start = datetime.now(timezone.utc).isoformat()

        scan_result = await run_analytics_scan(
            prompts=prompt_texts,
            business_name=business_name,
            business_id=business_id,
            query_ids=query_id_list,
            supabase_client=supabase,
            query_ids=query_ids,
            business_id=business_id,
        )

        llm_response_dicts = [
            {
                "id": r["id"],
                "llm_name": r["llm_name"],
                "response_text": r["response_text"],
                "query_text": r["query_text"],
                "query_id": r.get("query_id"),
            }
            for r in scan_result.get("results", [])
        ]

        await run_reinforcement(
            llm_responses=llm_response_dicts,
            business_profile=business,
            supabase_client=supabase,
        )

        _update_competitor_visibility(supabase, business_id, business_name, scan_result)

        _generate_opportunities(supabase, business_id, scan_result)

        loop = asyncio.get_event_loop()
        await asyncio.gather(
            loop.run_in_executor(None, _post_scan_alerts, supabase, user_id, scan_start),
            loop.run_in_executor(None, _post_scan_snapshot, supabase, business_id),
        )

        try:
            from app import cache
            cache.invalidate_prefix(f"dashboard:{business_id}")
            cache.invalidate_prefix(f"visibility:{business_id}")
            cache.invalidate_prefix(f"sentiment:{business_id}")
            cache.invalidate_prefix(f"competitors:{business_id}")
            cache.invalidate_prefix("dashboard:")
            cache.invalidate_prefix("visibility:")
            cache.invalidate_prefix("sentiment:")
            cache.invalidate_prefix("competitors:")
        except Exception:
            pass

    except Exception as exc:
        logger.error("Background scan failed: %s", exc)


def _update_competitor_visibility(supabase, business_id: str, business_name: str, scan_result: dict):
    """Re-compute competitor visibility scores from fresh scan data."""
    try:
        results = scan_result.get("results", [])
        if not results:
            return

        mentioned_count = sum(1 for r in results if r.get("mentioned"))
        own_visibility = round((mentioned_count / len(results)) * 100, 1) if results else 0

        comp_res = (
            supabase.table("competitors")
            .select("id, name, visibility_score")
            .eq("business_id", business_id)
            .execute()
        )
        existing = comp_res.data or []
        existing_names = {c["name"] for c in existing}

        found_own = False
        for comp in existing:
            if comp["name"] == business_name:
                found_own = True
                old_score = comp.get("visibility_score") or 0
                change = round(own_visibility - old_score, 1)
                supabase.table("competitors").update({
                    "visibility_score": own_visibility,
                    "change": change,
                }).eq("id", comp["id"]).execute()
                break

        if not found_own:
            supabase.table("competitors").insert({
                "business_id": business_id,
                "name": business_name,
                "visibility_score": own_visibility,
                "change": 0,
            }).execute()

        if len(existing) <= 1:
            _seed_competitors(supabase, business_id, business_name, existing_names)

    except Exception as exc:
        logger.warning("Competitor visibility update failed: %s", exc)


def _seed_competitors(supabase, business_id: str, business_name: str, existing_names: set):
    """Seed real industry competitor rows using the estimator's category map."""
    try:
        biz = supabase.table("businesses").select("category").eq("id", business_id).limit(1).execute()
        category = (biz.data[0].get("category") or "Business") if biz.data else "Business"

        from app.agents.estimator import CATEGORY_COMPETITORS
        comp_templates = CATEGORY_COMPETITORS.get(category)
        if not comp_templates:
            for key in CATEGORY_COMPETITORS:
                if key.lower() in category.lower() or category.lower() in key.lower():
                    comp_templates = CATEGORY_COMPETITORS[key]
                    break
        if not comp_templates:
            comp_templates = [
                {"name": f"Top {category} Brand A", "visibility_score": 68, "change": 1.2},
                {"name": f"Top {category} Brand B", "visibility_score": 55, "change": -0.8},
                {"name": f"Top {category} Brand C", "visibility_score": 44, "change": 2.1},
                {"name": f"Top {category} Brand D", "visibility_score": 36, "change": 0.4},
            ]

        rows = []
        for comp in comp_templates:
            name = comp["name"]
            if name in existing_names or name == business_name:
                continue
            rows.append({
                "business_id": business_id,
                "name": name,
                "visibility_score": comp["visibility_score"],
                "change": comp.get("change", 0),
            })
        if rows:
            supabase.table("competitors").insert(rows).execute()
    except Exception as exc:
        logger.warning("Competitor seeding failed: %s", exc)


def _generate_opportunities(supabase, business_id: str, scan_result: dict):
    """Generate opportunity rows from scan analytics."""
    try:
        results = scan_result.get("results", [])
        if not results:
            return

        llm_mention_counts: dict[str, dict] = {}
        for r in results:
            llm = r.get("llm_name", "Unknown")
            if llm not in llm_mention_counts:
                llm_mention_counts[llm] = {"total": 0, "mentioned": 0, "neg": 0}
            llm_mention_counts[llm]["total"] += 1
            if r.get("mentioned"):
                llm_mention_counts[llm]["mentioned"] += 1
            if r.get("sentiment") == "negative":
                llm_mention_counts[llm]["neg"] += 1

        new_opps = []

        for llm, counts in llm_mention_counts.items():
            rate = counts["mentioned"] / counts["total"] if counts["total"] else 0
            if rate < 0.5:
                new_opps.append({
                    "id": str(uuid.uuid4()),
                    "business_id": business_id,
                    "category": "missing_mention",
                    "title": f"Improve {llm} brand visibility",
                    "description": f"{llm} only mentions your brand in {round(rate * 100)}% of queries. Target: >50%.",
                    "impact": "high" if rate < 0.25 else "medium",
                    "status": "open",
                    "suggested_fix": f"Create optimized content targeting {llm}'s training data patterns.",
                })

            if counts["neg"] > 0 and counts["mentioned"] > 0:
                neg_rate = counts["neg"] / counts["mentioned"]
                if neg_rate > 0.2:
                    new_opps.append({
                        "id": str(uuid.uuid4()),
                        "business_id": business_id,
                        "category": "low_sentiment",
                        "title": f"Address negative sentiment on {llm}",
                        "description": f"{round(neg_rate * 100)}% of {llm} mentions are negative.",
                        "impact": "high" if neg_rate > 0.5 else "medium",
                        "status": "open",
                        "suggested_fix": "Review and improve content that addresses common complaints.",
                    })

        claims_res = supabase.table("claims").select("claim_type, status").eq("status", "pending").execute()
        pending_claims = claims_res.data or []
        claim_type_counts: dict[str, int] = {}
        for c in pending_claims:
            ct = c.get("claim_type", "unknown")
            claim_type_counts[ct] = claim_type_counts.get(ct, 0) + 1

        for ct, count in claim_type_counts.items():
            if count >= 2:
                new_opps.append({
                    "id": str(uuid.uuid4()),
                    "business_id": business_id,
                    "category": "hallucination",
                    "title": f"Fix recurring {ct} hallucinations",
                    "description": f"{count} pending {ct} claims detected across LLMs.",
                    "impact": "high",
                    "status": "open",
                    "suggested_fix": f"Update your {ct} information on your website and deploy corrections.",
                })

        if new_opps:
            try:
                supabase.table("opportunities").insert(new_opps).execute()
            except Exception as ins_exc:
                logger.warning("Opportunity insert failed: %s", ins_exc)

    except Exception as exc:
        logger.warning("Opportunity generation failed: %s", exc)


def _post_scan_alerts(supabase, user_id: Optional[str], scan_start: str):
    """Check for new claims since scan_start and send hallucination alerts if enabled."""
    if not user_id:
        return
    try:
        new_claims_res = (
            supabase.table("claims")
            .select("*")
            .gte("created_at", scan_start)
            .execute()
        )
        new_claims = new_claims_res.data or []
        if not new_claims:
            return

        prefs = None
        try:
            prefs_res = (
                supabase.table("notification_preferences")
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            prefs = prefs_res.data[0] if prefs_res.data else None
        except Exception as prefs_exc:
            if "PGRST205" not in str(prefs_exc):
                logger.warning("Could not read notification prefs: %s", prefs_exc)

        if prefs and not prefs.get("hallucination_alerts", True):
            return

        user_res = supabase.auth.admin.get_user_by_id(user_id)
        to_email = (prefs.get("email") if prefs and prefs.get("email") else None) or (
            user_res.user.email if user_res.user else None
        )
        if not to_email:
            return

        from app.services.email import send_hallucination_alert
        success = send_hallucination_alert(to_email, new_claims)

        try:
            supabase.table("notification_log").insert({
                "user_id": user_id,
                "type": "hallucination_alert",
                "subject": f"{len(new_claims)} new hallucination(s) detected",
                "status": "sent" if success else "failed",
            }).execute()
        except Exception as log_exc:
            if "PGRST205" not in str(log_exc):
                logger.warning("Could not write notification log: %s", log_exc)

    except Exception as exc:
        logger.warning("Post-scan alert failed: %s", exc)


def _post_scan_snapshot(supabase, business_id: str):
    """Create a visibility snapshot after a scan completes."""
    try:
        from app.routers.history import _build_snapshot
        snapshot = _build_snapshot(supabase, business_id)
        supabase.table("visibility_snapshots").insert(snapshot).execute()
        logger.info("Visibility snapshot created for business %s", business_id)
    except Exception as exc:
        logger.warning("Post-scan snapshot failed: %s", exc)


@router.post("/run-scan")
def run_scan(background_tasks: BackgroundTasks, user_id: Optional[str] = None):
    job_id = str(uuid.uuid4())

    try:
        supabase = get_supabase()
        biz = resolve_business(supabase, user_id)
        business_id = biz["id"] if biz else None
    except Exception:
        business_id = None

    if business_id:
        background_tasks.add_task(_run_scan_task, business_id)
        status = "scanning"
    else:
        status = "queued"

    return {
        "job_id": job_id,
        "status": status,
        "message": "Scan has been queued for execution",
    }
