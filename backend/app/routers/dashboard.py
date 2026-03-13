import asyncio
import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business
from app import cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dashboard"])

PLACEHOLDER_NAMES = {"Competitor A", "Competitor B", "Competitor C", "Competitor D"}


def _has_real_competitors(competitors: list[dict]) -> bool:
    names = {c.get("name", "") for c in competitors}
    return not names.intersection(PLACEHOLDER_NAMES) and len(competitors) > 1


def _build_fallback(business_name: str = "Your Business") -> dict:
    return {
        "visibility_score": 0,
        "visibility_change": 0,
        "brand_ranking": 1,
        "brand_ranking_total": 1,
        "claim_accuracy": 0,
        "claim_accuracy_change": 0,
        "active_hallucinations": 0,
        "truth_score": 100.0,
        "truth_score_change": 0,
        "visibility_trend": [],
        "llm_breakdown": [],
        "competitors": [],
        "hallucinations": [],
        "business_name": business_name,
        "status": "no_data",
    }


@router.get("/dashboard")
async def get_dashboard(filter: Optional[str] = None, user_id: Optional[str] = None):
    cache_key = f"dashboard::{user_id or 'anon'}::{filter or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        supabase = get_supabase()

        biz = resolve_business(supabase, user_id, "id, name, category, description, services, location")
        business_id = biz["id"] if biz else None
        business_name = biz["name"] if biz else "Your Brand"

        if not business_id:
            fb = _build_fallback(business_name)
            cache.set(cache_key, fb)
            return fb

        biz_query_ids = []
        biz_response_ids = []
        try:
            q_res = supabase.table("queries").select("id").eq("business_id", business_id).execute()
            biz_query_ids = [r["id"] for r in (q_res.data or [])]
            if biz_query_ids:
                r_res = supabase.table("llm_responses").select("id").in_("query_id", biz_query_ids).execute()
                biz_response_ids = [r["id"] for r in (r_res.data or [])]
        except Exception:
            pass

        def _fetch_pending_claims():
            return supabase.table("claims").select("id", count="exact").eq("status", "pending").in_("response_id", biz_response_ids).execute()

        def _fetch_total_claims():
            return supabase.table("claims").select("id", count="exact").in_("response_id", biz_response_ids).execute()

        def _fetch_resolved_claims():
            return supabase.table("claims").select("id", count="exact").eq("status", "resolved").in_("response_id", biz_response_ids).execute()

        def _fetch_snapshots():
            return supabase.table("visibility_snapshots").select("claim_count, pending_claims, visibility_score").eq("business_id", business_id).order("snapshot_date", desc=True).limit(2).execute()

        def _fetch_competitors():
            return supabase.table("competitors").select("*").eq("business_id", business_id).order("visibility_score", desc=True).execute()

        def _fetch_mentions():
            return supabase.table("mentions").select("*").eq("business_id", business_id).execute()

        if biz_response_ids:
            pending_claims, total_claims, resolved_claims, snaps, competitors_res, mentions_res = (
                await asyncio.gather(
                    asyncio.to_thread(_fetch_pending_claims),
                    asyncio.to_thread(_fetch_total_claims),
                    asyncio.to_thread(_fetch_resolved_claims),
                    asyncio.to_thread(_fetch_snapshots),
                    asyncio.to_thread(_fetch_competitors),
                    asyncio.to_thread(_fetch_mentions),
                )
            )
            active_hallucinations = pending_claims.count or 0
            total_c = total_claims.count or 0
            resolved_c = resolved_claims.count or 0
        else:
            snaps, competitors_res, mentions_res = await asyncio.gather(
                asyncio.to_thread(_fetch_snapshots),
                asyncio.to_thread(_fetch_competitors),
                asyncio.to_thread(_fetch_mentions),
            )
            active_hallucinations = 0
            total_c = 0
            resolved_c = 0

        claim_accuracy = round((resolved_c / max(total_c, 1)) * 100, 1)

        claim_accuracy_change = 0.0
        try:
            if snaps.data and len(snaps.data) >= 2:
                curr = snaps.data[0]
                prev = snaps.data[1]
                curr_total = (curr.get("claim_count") or 1)
                prev_total = (prev.get("claim_count") or 1)
                curr_resolved = max(0, curr_total - (curr.get("pending_claims") or 0))
                prev_resolved = max(0, prev_total - (prev.get("pending_claims") or 0))
                curr_acc = (curr_resolved / curr_total * 100) if curr_total > 0 else 0
                prev_acc = (prev_resolved / prev_total * 100) if prev_total > 0 else 0
                claim_accuracy_change = round(curr_acc - prev_acc, 1)
        except Exception:
            pass

        competitors_list = []
        for i, c in enumerate(competitors_res.data or []):
            is_own = c.get("name") == business_name
            competitors_list.append({
                "name": c["name"],
                "ranking": i + 1,
                "visibility_score": c.get("visibility_score") or 0,
                "change": c.get("change", 0),
                "is_own": is_own,
            })

        needs_estimation = (
            not _has_real_competitors(competitors_list)
            or (total_c > 0 and resolved_c == 0 and claim_accuracy == 0)
        )

        if needs_estimation:
            try:
                from app.agents.estimator import estimate_metrics
                est = await estimate_metrics(biz)

                if not _has_real_competitors(competitors_list):
                    competitors_list = []
                    for i, c in enumerate(est.get("competitors", [])):
                        competitors_list.append({
                            "name": c["name"],
                            "ranking": i + 1,
                            "visibility_score": c.get("visibility_score", 0),
                            "change": c.get("change", 0),
                            "is_own": c.get("is_own", False),
                        })

                if total_c > 0 and resolved_c > 0:
                    truth_score_val = round((resolved_c / total_c) * 100, 1)
                else:
                    truth_score_val = est.get("truth_score", 68.0)

                vis_score = est.get("visibility_score", 0)
                vis_change = est.get("visibility_change", 0)
                ts_change = est.get("truth_score_change", 0)
                ca_change = est.get("claim_accuracy_change", 0)

            except Exception as exc:
                logger.warning("Dashboard estimation failed: %s", exc)
                truth_score_val = 0 if total_c > 0 else 100.0
                vis_score = 0
                vis_change = 0.0
                ts_change = 0.0
                ca_change = 0.0
        else:
            truth_score_val = round((resolved_c / max(total_c, 1)) * 100, 1) if total_c > 0 else 100.0
            vis_score = None
            vis_change = None
            ts_change = None
            ca_change = None

        mentions = mentions_res.data or []

        resp_ids = list({m["response_id"] for m in mentions if m.get("response_id")})
        llm_by_id: dict[str, str] = {}
        if resp_ids:
            all_resps = await asyncio.to_thread(
                lambda: supabase.table("llm_responses").select("id, llm_name").in_("id", resp_ids).execute()
            )
            llm_by_id = {r["id"]: r["llm_name"] for r in (all_resps.data or [])}

        by_date: dict[str, list] = defaultdict(list)
        by_llm: dict[str, dict] = defaultdict(lambda: {"count": 0, "total_rank": 0})

        for m in mentions:
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(m)

            resp_id = m.get("response_id")
            llm_name = llm_by_id.get(resp_id)
            if llm_name:
                by_llm[llm_name]["count"] += 1
                by_llm[llm_name]["total_rank"] += m.get("rank") or 0

        visibility_trend = sorted(
            [
                {"date": d, "score": max(0, 100 - int(sum((me.get("rank") or 5) for me in ms) / len(ms) * 10))}
                for d, ms in by_date.items()
            ],
            key=lambda x: x["date"],
        )

        llm_breakdown = [
            {
                "llm_name": llm,
                "mention_rate": max(0, 100 - int(info["total_rank"] / info["count"] * 10)) if info["count"] else 0,
                "total_queries": info["count"],
                "avg_rank": round(info["total_rank"] / info["count"], 1) if info["count"] else 0,
            }
            for llm, info in by_llm.items()
        ]

        if vis_score is None:
            vis_score = visibility_trend[-1]["score"] if visibility_trend else 0
        if vis_change is None:
            try:
                if snaps and snaps.data and len(snaps.data) >= 2:
                    vis_change = round(
                        (snaps.data[0].get("visibility_score") or 0)
                        - (snaps.data[1].get("visibility_score") or 0),
                        1,
                    )
                elif len(visibility_trend) >= 2:
                    vis_change = round(visibility_trend[-1]["score"] - visibility_trend[-2]["score"], 1)
                else:
                    vis_change = 0.0
            except Exception:
                vis_change = 0.0

        own_rank = None
        for i, c in enumerate(competitors_list):
            if c.get("is_own"):
                own_rank = i + 1
                break
        brand_ranking = own_rank or (len(competitors_list) + 1)

        if ts_change is None:
            ts_change = 0.0
            try:
                if snaps and snaps.data and len(snaps.data) >= 2:
                    curr_s = snaps.data[0]
                    prev_s = snaps.data[1]
                    curr_tc = curr_s.get("claim_count") or 1
                    prev_tc = prev_s.get("claim_count") or 1
                    curr_res = max(0, curr_tc - (curr_s.get("pending_claims") or 0))
                    prev_res = max(0, prev_tc - (prev_s.get("pending_claims") or 0))
                    curr_ts = (curr_res / curr_tc * 100) if curr_tc > 0 else 100
                    prev_ts = (prev_res / prev_tc * 100) if prev_tc > 0 else 100
                    ts_change = round(curr_ts - prev_ts, 1)
            except Exception:
                pass

        if ca_change is None:
            ca_change = claim_accuracy_change

        hallucination_rows = []
        try:
            claims_query = (
                supabase.table("claims")
                .select("id, claim_value, verified_value, status, claim_type, response_id")
                .eq("status", "pending")
                .limit(10)
            )
            if biz_response_ids:
                claims_query = claims_query.in_("response_id", biz_response_ids)
            claims_res = await asyncio.to_thread(claims_query.execute)
            claims_data = claims_res.data or []

            claim_resp_ids = list({c["response_id"] for c in claims_data if c.get("response_id")})
            resp_map: dict[str, dict] = {}
            query_map: dict[str, str] = {}
            if claim_resp_ids:
                bulk_resps = await asyncio.to_thread(
                    lambda: supabase.table("llm_responses").select("id, llm_name, query_id").in_("id", claim_resp_ids).execute()
                )
                for r in (bulk_resps.data or []):
                    resp_map[r["id"]] = r

                bulk_query_ids = list({r["query_id"] for r in (bulk_resps.data or []) if r.get("query_id")})
                if bulk_query_ids:
                    bulk_queries = await asyncio.to_thread(
                        lambda: supabase.table("queries").select("id, text").in_("id", bulk_query_ids).execute()
                    )
                    query_map = {q["id"]: q.get("text", "") for q in (bulk_queries.data or [])}

            for c in claims_data:
                resp_row = resp_map.get(c.get("response_id", ""), {})
                hallucination_rows.append({
                    "id": c["id"],
                    "claim_value": c.get("claim_value", ""),
                    "verified_value": c.get("verified_value", ""),
                    "status": c.get("status", "pending"),
                    "llm_name": resp_row.get("llm_name", "Unknown"),
                    "query_text": query_map.get(resp_row.get("query_id", ""), ""),
                })
        except Exception:
            pass

        has_real_data = bool(mentions or total_c > 0 or competitors_list)

        result = {
            "visibility_score": vis_score,
            "visibility_change": vis_change,
            "brand_ranking": brand_ranking,
            "brand_ranking_total": max(len(competitors_list), 1),
            "claim_accuracy": claim_accuracy,
            "claim_accuracy_change": ca_change,
            "active_hallucinations": active_hallucinations,
            "truth_score": truth_score_val,
            "truth_score_change": ts_change,
            "visibility_trend": visibility_trend,
            "llm_breakdown": llm_breakdown,
            "competitors": competitors_list,
            "hallucinations": hallucination_rows,
            "status": "ok" if has_real_data else "no_data",
            "business_name": business_name,
        }

        cache.set(cache_key, result, ttl=120)
        return result

    except Exception as exc:
        logger.warning("Dashboard Supabase query failed: %s", exc)
        return _build_fallback()
