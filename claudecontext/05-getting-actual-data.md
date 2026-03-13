# GeoMav — Getting Actual Data

Last updated: 2026-03-12

## What We're Trying to Accomplish

We want the GeoMav dashboard to show **actual data** instead of mock/seed data. Specifically:

1. **Run a flow once** (seed + scan) to populate the database with real or realistic data.
2. **Dashboard pages** (Overview, Visibility, Sentiment, Competitors, Hallucinations, etc.) should display this real data from the API.
3. **LLM responses** should come from real API calls (OpenAI, Anthropic, Gemini, Perplexity, etc.) when API keys are present, not from the mock fallback.

## Context for Claude

### Project Overview
- **GeoMav** is an AI visibility monitoring platform. It tracks how AI assistants (ChatGPT, Gemini, Claude, Perplexity, Bing, DeepSeek) mention businesses.
- **Tech stack**: Next.js 16 frontend, FastAPI backend, Supabase (PostgreSQL + Auth).
- **Key docs**: `AGENTS.md` (repo guidelines), `claudecontext/01-product.md`, `02-architecture.md`, `03-progress.md`, `04-decisions.md`.

### Data Sources
- **Supabase** holds: `businesses`, `queries`, `llm_responses`, `mentions`, `claims`, `opportunities`, `competitors`, `content_sections`, `visibility_snapshots`, `notification_preferences`, `notification_log`.
- **Seed migration** (`supabase/migrations/002_seed_data.sql`): inserts a sample business ("Your Brand"), 8 queries, LLM responses, mentions, claims, opportunities, competitors, content sections. Uses fixed UUID `a1b2c3d4-e5f6-7890-abcd-ef1234567890` for the business.
- **Analytics scan** (`POST /api/run-scan` or `POST /api/onboard/scan`): calls `run_analytics_scan` in `backend/app/agents/analytics.py`, which queries real LLM APIs (if keys are in `.env`) or falls back to mock responses, then stores `llm_responses` and `mentions`.

### Run Scan Flow
- **`POST /api/run-scan`** (`backend/app/routers/scans.py`): gets the first business from DB, runs `_run_scan_task` in background. Uses that business’s `queries` as prompts. After scan: sends hallucination alerts, creates a visibility snapshot.
- **`POST /api/onboard/scan`** (`backend/app/routers/onboard.py`): takes `business_id` in the body, runs initial scan for that business (up to 10 prompts). Same analytics agent.
- **Analytics agent** (`backend/app/agents/analytics.py`): `run_analytics_scan(prompts, business_name, supabase_client)` loops over prompts × LLMs, calls `query_llm`, extracts mentions, inserts into `llm_responses` and `mentions`. Uses `get_settings()` for API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.).

### Environment
- `.env` at repo root: Supabase URL/keys, LLM API keys (OpenAI, Anthropic, Google Gemini, Perplexity), `BACKEND_URL=http://localhost:8000`.
- Frontend uses `NEXT_PUBLIC_BACKEND_URL` or falls back to `http://localhost:8000` (see `frontend/src/lib/api.ts`).

### Recent Fixes (from prior sessions)
- Sentiment page: `queryResponses` now uses API data instead of mock.
- Competitors page: `llmBreakdown` and `sentimentChartData` now use API data.
- Visibility page: `getHistoryComparison` passes correct `businessId`.
- `dashboard.py`: `brand_ranking` own_rank logic corrected.
- `NEXT_PUBLIC_BACKEND_URL` ensured in `.env` for frontend–backend communication.

## How to Continue

### 1. Ensure Migrations and Seed Are Applied
Run in Supabase SQL Editor (or via Supabase CLI):
- `001_initial_schema.sql`
- `002_seed_data.sql`
- `003_notifications_and_snapshots.sql`

This populates the sample business, queries, and seed responses. The seed business ID is `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

### 2. Ensure API Keys Are Set
In `.env`:
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `PERPLEXITY_API_KEY` (and Bing/DeepSeek if using those).
Without keys, the analytics agent falls back to mock responses.

### 3. Run a Scan
Two options:

**Option A — Run Scan (dashboard button)**  
- Start backend: `./start-backend.sh`
- Start frontend: `./start-frontend.sh`
- Sign in, go to dashboard Overview, click "Run Scan".
- This calls `POST /api/run-scan`, which uses the first business in the DB (likely the seed business).

**Option B — Onboard scan (for new business)**  
- Use onboarding flow: `POST /api/onboard/save` then `POST /api/onboard/scan` with `business_id`.
- Or call `POST /api/run-scan` directly via curl/Postman (no auth required for that endpoint as currently implemented).

### 4. Verify Data Flow
- After scan: check Supabase tables `llm_responses`, `mentions`, `visibility_snapshots`.
- Dashboard pages should fetch from `/api/dashboard`, `/api/visibility`, `/api/sentiment`, `/api/competitors`, etc., and display real data.

### 5. Potential Gaps to Address
- **Analytics agent storage**: `run_analytics_scan` inserts `llm_responses` with `query_id: None` and `mentions` without `business_id`. The `mentions` table requires `business_id`. This may cause insert failures or orphaned data. The scan task has `business_id` but does not pass it to `run_analytics_scan` — the agent would need to receive `business_id` and use it when inserting.
- **Enrichment + reinforcement agents**: Not wired into any router. They exist in `backend/app/agents/` but are not invoked by `/api/run-scan` or onboarding. To get full claim/hallucination and content enrichment data, these need to be called (e.g., after analytics scan).
- **Shopping page**: `03-progress.md` notes it falls back to mock because backend response shape doesn’t match frontend.

### 6. One-Time “Get All Data” Flow (Recommended)
1. Apply all Supabase migrations (including seed).
2. Optionally link seed business to a real user: update `businesses.user_id` after sign-up.
3. Start backend and frontend.
4. Trigger one scan via "Run Scan" on dashboard or `POST /api/run-scan`.
5. Wait for background task to finish (scan can take a minute or two).
6. Refresh dashboard — Visibility, Sentiment, Competitors, Hallucinations should reflect the new data.

## Summary

**Goal**: Run seed + scan once to get majority of actual data.  
**Steps**: Apply migrations → set API keys → run scan → verify dashboard shows real data.  
**Next work**: Fix analytics agent to pass `business_id` and `query_id` when storing; optionally wire enrichment and reinforcement agents; fix shopping page backend response shape.
