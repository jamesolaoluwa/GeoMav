# GeoMav — System Flows, Agent Audit & Metric Accuracy

*Last updated: 2026-03-13*

## 1. End-to-End Data Flow

```
User Browser
  └─ Supabase Auth (sign-in / sign-up)
  └─ Next.js Dashboard (frontend/src/app/dashboard/*)
       └─ api.ts (frontend/src/lib/api.ts)
            └─ FastAPI (backend/app/main.py, 16 routers)
                 ├─ Onboarding
                 │    POST /api/onboard       → llms.txt + GPT-4o-mini extraction
                 │    POST /api/onboard/save  → insert businesses + queries
                 │    POST /api/onboard/scan  → triggers analytics agent
                 │
                 ├─ Scan Flow (POST /api/run-scan)
                 │    1. Fetch queries from DB
                 │    2. run_analytics_scan() → query 6 LLMs × N prompts concurrently
                 │    3. Batch INSERT llm_responses (with query_id) + mentions
                 │    4. run_reinforcement()  → classify claims against businesses
                 │    5. Batch INSERT claims (with response_id)
                 │    6. _update_competitor_visibility() → update competitors table
                 │    7. _generate_opportunities() → insert opportunity rows
                 │    8. Parallel: _post_scan_alerts() + _post_scan_snapshot()
                 │    9. Invalidate TTL cache
                 │
                 ├─ Web Enrichment (POST /api/enrich-business or auto on website change)
                 │    fetch_page → extract_schema_org → fetch_google_knowledge
                 │    → llm_extract_profile → merge_profile → update businesses
                 │
                 ├─ Content Enrichment (run_enrichment)
                 │    generate_business_summary / llms_txt / json_ld / faq
                 │    → upsert content_sections (uses real businesses fields)
                 │
                 └─ Dashboard Read Endpoints (cached 60s, invalidated on scan)
                      GET /api/dashboard, /api/visibility, /api/sentiment,
                      /api/competitors, /api/hallucinations, /api/shopping,
                      /api/opportunities, /api/content
```

## 2. Correct FK Chain

```
queries (text, category, business_id)
  └─ llm_responses (query_id → queries.id, llm_name, response_text)
       ├─ mentions (response_id → llm_responses.id, rank, sentiment)
       └─ claims  (response_id → llm_responses.id, claim_type, status)
```

Both `query_id` and `response_id` are now properly wired during scan.

## 3. Agent Details

### Analytics Agent (`backend/app/agents/analytics.py`)

- **Trigger:** `POST /api/run-scan` or `POST /api/onboard/scan`
- **LLMs:** ChatGPT (OpenAI gpt-4o), Claude (Anthropic claude-sonnet-4-20250514), Gemini (google-generativeai gemini-1.5-flash), Perplexity (sonar), Bing (OpenAI gpt-4o), DeepSeek (api.deepseek.com deepseek-chat)
- **Writes:** `llm_responses` (batch, with `query_id`), `mentions` (batch)
- **Computes:** `mentioned` (bool), `rank` (sentence position), `sentiment` (weighted keyword set: 20 positive, 20 negative words)
- **Fallback:** Mock responses per LLM if no API key configured

### Reinforcement Agent (`backend/app/agents/reinforcement.py`)

- **Trigger:** Auto-called by `_run_scan_task` after analytics completes
- **Input:** `llm_responses` list with `id`, `llm_name`, `response_text`, `query_text`
- **Writes:** `claims` (batch, with `response_id`)
- **Classification:** `verified` / `outdated` / `fabricated` / `misleading` for types: pricing, hours, location, service, history
- **Ground truth:** `businesses` table (populated by web enrichment)

### Web Enrichment Agent (`backend/app/agents/web_enrichment.py`)

- **Trigger:** `POST /api/enrich-business` or auto when website changes via `PUT /api/business`
- **Sources:** Own site pages, Schema.org JSON-LD, Google knowledge panel
- **Writes:** `businesses` (updates empty fields with merge priority: manual > schema.org > LLM)
- **Downstream impact:** All reinforcement classification accuracy depends on this

### Content Enrichment Agent (`backend/app/agents/enrichment.py`)

- **Trigger:** Called programmatically (not yet auto-triggered post-scan)
- **Writes:** `content_sections` (summary, llms_txt, json_ld, faq)
- **Uses real fields:** pricing, hours, services, location, description from `businesses`

## 4. Metric Accuracy Reference

| Metric | Endpoint | Source Tables | How Computed |
|--------|----------|---------------|--------------|
| `visibility_score` | GET /api/dashboard | mentions | `100 - avg(rank) * 10` per date |
| `visibility_change` | GET /api/dashboard | visibility_snapshots | Delta between 2 most recent snapshots |
| `brand_ranking` | GET /api/dashboard | competitors | Position in competitors ordered by visibility_score |
| `claim_accuracy` | GET /api/dashboard | claims | `resolved_count / total_count * 100` |
| `claim_accuracy_change` | GET /api/dashboard | visibility_snapshots | Delta of accuracy between 2 most recent snapshots |
| `active_hallucinations` | GET /api/dashboard | claims | Count where status = "pending" |
| `sentiment_trends` | GET /api/sentiment | mentions | pos/neutral/neg ratios per date |
| `sentiment_by_llm` | GET /api/sentiment | mentions + llm_responses | Batch join via `.in_()`, group by llm_name |
| `query_responses` | GET /api/visibility | queries + llm_responses | Batch `.in_()` + Counter, rate = count / 6 LLMs |
| `topic_rankings` | GET /api/visibility | queries + llm_responses | Group by queries.category via query_id |
| `product_visibility` | GET /api/shopping | businesses.services + llm_responses | Keyword match in response_text per service |
| `shopping_queries` | GET /api/shopping | queries + llm_responses | Commerce-keyword queries, rate = resp_count / 5 |
| `opportunities` | GET /api/opportunities | opportunities | Auto-generated post-scan from analytics + claims data |

## 5. Performance

- **N+1 queries eliminated** in dashboard.py, sentiment.py, visibility.py, competitors.py — all use single `.in_()` batch fetches
- **Batch DB writes** in analytics.py: 2 INSERT calls instead of 120 per scan
- **TTL cache** (60s) on dashboard, visibility, sentiment, competitors endpoints — invalidated on scan completion
- **Parallel post-scan steps:** alerts + snapshot run via `asyncio.gather`

## 6. How to Verify Data Accuracy

1. **Check FK chain:** After a scan, query `llm_responses` — every row should have a non-null `query_id`. Query `claims` — every row should have a non-null `response_id`.
2. **Check mock vs real:** If `llm_responses.response_text` matches `MOCK_LLM_RESPONSES` strings exactly, API keys are missing.
3. **Check enrichment:** If `businesses.pricing` is null/empty, web enrichment hasn't run — reinforcement will mark all pricing claims as fabricated.
4. **Check cache:** If dashboard data seems stale after a manual DB edit, the 60s TTL cache may be serving old data. Wait 60s or restart the backend.

## 7. Keeping This Doc in Sync

When adding a new router or agent:
1. Append to the Agent Details section above
2. Add any new metrics to the Metric Accuracy Reference table
3. Update the FK chain if new tables are introduced
4. Run `cd backend && python3 -m pytest tests/ -v` to verify nothing breaks
