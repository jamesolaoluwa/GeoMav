# GeoMav — Architecture Context

Last updated: 2026-03-12

## Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, Tailwind CSS v4, Recharts, Framer Motion
- **Backend**: FastAPI (Python), uvicorn
- **Database**: Supabase (managed PostgreSQL + Auth + Realtime + RLS)
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Frontend Supabase**: @supabase/supabase-js + @supabase/ssr
- **Backend Supabase**: supabase-py (service role key)

## Project Structure

```
GeoMav/
├── frontend/                     # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout (fonts, metadata)
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── signin/page.tsx   # Supabase Auth sign-in
│   │   │   ├── signup/page.tsx   # Supabase Auth sign-up
│   │   │   └── dashboard/        # Authenticated dashboard section
│   │   │       ├── layout.tsx    # Sidebar + header shell
│   │   │       ├── page.tsx      # Overview (main dashboard)
│   │   │       ├── visibility/
│   │   │       ├── hallucinations/
│   │   │       ├── prompts/
│   │   │       ├── competitors/
│   │   │       ├── sentiment/
│   │   │       ├── shopping/
│   │   │       ├── opportunities/
│   │   │       ├── content/
│   │   │       └── settings/
│   │   ├── components/
│   │   │   ├── auth/             # AuthLayout
│   │   │   ├── layout/           # Navbar, Footer, MobileMenu
│   │   │   ├── sections/         # Landing page sections
│   │   │   └── ui/               # Shared UI components
│   │   ├── lib/
│   │   │   ├── api.ts            # API client for FastAPI
│   │   │   ├── supabase.ts       # Supabase browser client
│   │   │   ├── supabase-server.ts # Supabase server client
│   │   │   ├── types.ts          # TypeScript types
│   │   │   ├── fonts.ts          # Font config
│   │   │   └── motion.ts         # Framer Motion variants
│   │   ├── data/
│   │   │   └── mock.ts           # Mock data (fallback)
│   │   └── middleware.ts         # Auth middleware
│   └── .env.local                # Supabase keys (gitignored)
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry
│   │   ├── config.py             # Settings (env vars)
│   │   ├── supabase_client.py    # Supabase Python client
│   │   ├── schemas.py            # Pydantic models
│   │   ├── routers/              # 11 API routers
│   │   │   ├── dashboard.py
│   │   │   ├── visibility.py
│   │   │   ├── hallucinations.py
│   │   │   ├── prompts.py
│   │   │   ├── competitors.py
│   │   │   ├── sentiment.py
│   │   │   ├── shopping.py
│   │   │   ├── opportunities.py
│   │   │   ├── content.py
│   │   │   ├── business.py
│   │   │   └── scans.py
│   │   └── agents/               # 3 background agents
│   │       ├── analytics.py      # LLM query worker
│   │       ├── enrichment.py     # Content generation
│   │       └── reinforcement.py  # Hallucination detection
│   └── requirements.txt
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
│
├── .env                          # Root env (Supabase + LLM keys)
├── start-backend.sh
├── start-frontend.sh
├── stop-all.sh
└── start.sh                      # Instructions
```

## Database Schema (Supabase PostgreSQL)

8 tables with RLS policies:

| Table | Key Columns | Purpose |
|-------|------------|---------|
| businesses | id, name, website, category, description, hours, location, pricing, services, user_id | Business profiles |
| queries | id, text, category, business_id | Prompts/queries for AI scans |
| llm_responses | id, query_id, llm_name, response_text | Raw LLM responses |
| mentions | id, business_id, response_id, rank, sentiment | Brand mention tracking |
| claims | id, response_id, claim_type, claim_value, verified_value, status | Hallucination tracking |
| content_sections | id, business_id, type, title, content | AI-optimized content |
| opportunities | id, business_id, category, title, description, impact, status, suggested_fix | Action items |
| competitors | id, business_id, name, visibility_score, change | Competitor data |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | Aggregated visibility metrics |
| GET | /api/visibility | Visibility history + brand rankings |
| POST | /api/run-scan | Trigger AI scan across LLMs |
| GET | /api/hallucinations | List detected incorrect claims |
| PATCH | /api/hallucinations/{id} | Update hallucination status |
| GET | /api/prompts | List prompts |
| POST | /api/prompts | Add prompt |
| DELETE | /api/prompts/{id} | Delete prompt |
| GET | /api/competitors | Competitor analysis |
| GET | /api/sentiment | Sentiment trends |
| GET | /api/shopping | Shopping/product visibility |
| GET | /api/opportunities | Action recommendations |
| PATCH | /api/opportunities/{id} | Update opportunity status |
| GET | /api/content | Content sections |
| PUT | /api/content/{id} | Update content |
| POST | /api/deploy-correction | Deploy correction |
| GET | /api/business | Business profile |
| PUT | /api/business | Update business |

## Background Agents

1. **Analytics Agent**: Queries LLM APIs (or mock fallback), stores responses, extracts mentions, calculates visibility
2. **Enrichment Agent**: Generates AI-optimized content (summaries, FAQ, JSON-LD, /llms.txt)
3. **Reinforcement Agent**: Compares AI responses against verified business data, classifies claims, generates corrections

## Data Flow

Frontend pages fetch from FastAPI backend via api.ts client. Backend routers query Supabase using the service role key. On Supabase failure, routers fall back to mock data. Frontend pages also fall back to local mock data if the API is unreachable.
