import logging
from collections import Counter, defaultdict
from typing import Optional

from fastapi import APIRouter

from app.supabase_client import get_supabase
from app.resolve_business import resolve_business
from app import cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["visibility"])

ACTIVE_LLM_COUNT = 6

MOCK_FALLBACK: dict = {
    "visibility_history": [],
    "brand_rankings": [],
    "topic_rankings": [],
    "query_responses": [],
    "filter_applied": "all_time",
}


@router.get("/visibility")
def get_visibility(filter: Optional[str] = None, user_id: Optional[str] = None):
    cache_key = f"visibility::{user_id or 'anon'}::{filter or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        supabase = get_supabase()

        biz = resolve_business(supabase, user_id)
        business_id = biz["id"] if biz else None
        business_name = biz["name"] if biz else "Your Brand"

        if not business_id:
            return {**MOCK_FALLBACK, "filter_applied": filter or "all_time", "status": "no_data"}

        mentions_res = (
            supabase.table("mentions")
            .select("*")
            .eq("business_id", business_id)
            .execute()
        )
        mentions = mentions_res.data or []

        by_date: dict[str, list] = defaultdict(list)
        for m in mentions:
            date_key = (m.get("created_at") or "")[:10]
            if date_key:
                by_date[date_key].append(m)

        visibility_history = sorted(
            [
                {
                    "date": d,
                    "score": max(0, 100 - int(sum((me.get("rank") or 5) for me in ms) / len(ms) * 10)),
                }
                for d, ms in by_date.items()
            ],
            key=lambda x: x["date"],
        )

        competitors_res = (
            supabase.table("competitors")
            .select("*")
            .eq("business_id", business_id)
            .order("visibility_score", desc=True)
            .execute()
        )
        brand_rankings = []
        for i, c in enumerate(competitors_res.data or []):
            is_own = c.get("name") == business_name
            brand_rankings.append({
                "name": c["name"],
                "visibility_score": c.get("visibility_score") or 0,
                "change": c.get("change", 0),
                "is_own": is_own,
            })

        queries_res = (
            supabase.table("queries")
            .select("*")
            .eq("business_id", business_id)
            .execute()
        )
        queries_data = queries_res.data or []
        query_ids = [q["id"] for q in queries_data]

        all_resp_data = []
        if query_ids:
            all_responses = (
                supabase.table("llm_responses")
                .select("query_id, llm_name, id")
                .in_("query_id", query_ids)
                .execute()
            )
            all_resp_data = all_responses.data or []

        resp_by_query: dict[str, list] = defaultdict(list)
        for r in all_resp_data:
            qid = r.get("query_id")
            if qid:
                resp_by_query[qid].append(r)

        mention_by_resp: dict[str, dict] = {}
        for m in mentions:
            rid = m.get("response_id")
            if rid:
                mention_by_resp[rid] = m

        queries_by_cat: dict[str, list] = defaultdict(list)
        for q in queries_data:
            cat = q.get("category") or "general"
            queries_by_cat[cat].append(q)

        topic_rankings = []
        competitor_names = [c["name"] for c in (competitors_res.data or []) if c.get("name") != business_name]
        for cat, cat_queries in queries_by_cat.items():
            brand_mention_count = 0
            total_responses_in_cat = 0
            rank_entries: list[dict] = []

            for q in cat_queries:
                resps = resp_by_query.get(q["id"], [])
                total_responses_in_cat += len(resps)
                for resp in resps:
                    m = mention_by_resp.get(resp["id"])
                    if m and m.get("rank"):
                        brand_mention_count += 1

            own_rank = None
            if total_responses_in_cat > 0 and brand_mention_count > 0:
                own_rank = max(1, int((1 - brand_mention_count / total_responses_in_cat) * 10) + 1)

            position = 1
            for cn in competitor_names[:9]:
                rank_entries.append({"rank": position, "brand": cn})
                position += 1

            if own_rank is not None:
                insert_pos = min(own_rank - 1, len(rank_entries))
                rank_entries.insert(insert_pos, {"rank": insert_pos + 1, "brand": business_name})
                for idx in range(len(rank_entries)):
                    rank_entries[idx]["rank"] = idx + 1

            status = "not_ranked"
            for re_item in rank_entries:
                if re_item["brand"] == business_name:
                    status = "strong" if re_item["rank"] <= 3 else "needs_work"
                    break

            topic_rankings.append({
                "topic": cat,
                "status": status,
                "rankings": rank_entries[:10],
            })

        query_responses = []
        valid_sentiments = {"positive", "neutral", "negative"}
        for q in queries_data[:15]:
            resps = resp_by_query.get(q["id"], [])
            for resp in resps:
                m = mention_by_resp.get(resp["id"])
                raw_sentiment = (m.get("sentiment") if m else None) or "neutral"
                if raw_sentiment not in valid_sentiments:
                    continue
                mentioned = m is not None and m.get("rank") is not None
                query_responses.append({
                    "id": f"{q['id']}-{resp['id']}",
                    "query": q.get("text", ""),
                    "llm_name": resp.get("llm_name", "Unknown"),
                    "brand_mentioned": mentioned,
                    "rank": m.get("rank") if m else None,
                    "sentiment": raw_sentiment,
                })

        has_real_data = bool(mentions or brand_rankings or query_responses)

        result = {
            "visibility_history": visibility_history,
            "brand_rankings": brand_rankings,
            "topic_rankings": topic_rankings,
            "query_responses": query_responses,
            "filter_applied": filter or "all_time",
            "status": "ok" if has_real_data else "no_data",
        }

        cache.set(cache_key, result)
        return result

    except Exception as exc:
        logger.warning("Visibility Supabase query failed, using mock: %s", exc)
        return {**MOCK_FALLBACK, "filter_applied": filter or "all_time", "status": "no_data"}
