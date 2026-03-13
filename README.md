# GeoMav

GeoMav is an AI visibility monitoring platform that tracks how AI assistants (ChatGPT, Gemini, Claude, Perplexity, Bing, DeepSeek) represent your business. Monitor mentions, detect hallucinations (incorrect claims), and optimize your brand’s presence in AI-powered discovery—all from one dashboard.

---

## Features

✅ **AI Visibility Monitoring** — Track how your brand appears across ChatGPT, Gemini, Claude, Perplexity, Bing, and DeepSeek

✅ **Hallucination Detection** — Automatically extract and flag incorrect claims AI makes about your business

✅ **Sentiment & Competitor Analysis** — View sentiment trends, competitor rankings, and visibility by topic

✅ **Query Response Explorer** — Inspect how each LLM responds to your queries, with brand mention, rank, and sentiment

✅ **Content Optimization** — Generate AI-optimized summaries, JSON-LD, and `/llms.txt` for better AI representation

✅ **User-Friendly Dashboard** — Navigate visibility, hallucinations, prompts, opportunities, and analytics in one place

---

## Technologies & Frameworks

### Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Recharts](https://img.shields.io/badge/Recharts-3.8-8884D8?style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055FF?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?style=for-the-badge&logo=supabase)

- Next.js 16 with App Router
- React 19, TypeScript, Tailwind CSS v4
- Recharts for analytics charts
- Framer Motion for animations
- Supabase Auth (email/password + Google OAuth)

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3-3670A0?style=for-the-badge&logo=python)
![Uvicorn](https://img.shields.io/badge/Uvicorn-0.30-0F172A?style=for-the-badge)

- FastAPI for RESTful APIs
- Python with uvicorn
- Supabase (PostgreSQL) for data
- LLM integrations: OpenAI, Anthropic, Google Gemini, Perplexity

---

## Dashboard

### Visibility Rankings By Topic

| TOPICS      | #1 | #2 | #3 | #4 | #5 | #6 | #7 | #8 | #9 | #10 |
|-------------|----|----|----|----|----|----|----|----|-----|-----|
| (per topic) |    |    |    |    |    |    |    |    |     |     |

Shows where your brand ranks across topics and queries.

### Query Response Explorer

| QUERY                         | LLM     | BRAND MENTION | RANK | SENTIMENT |
|-------------------------------|---------|---------------|------|-----------|
| best business near me         | ChatGPT | ✓             | —    | Neutral   |
| best business 2026            | ChatGPT | ✓             | —    | Neutral   |
| top business services         | ChatGPT | ✓             | —    | Neutral   |
| affordable business           | ChatGPT | ✓             | —    | Neutral   |
| ...                           | ...     | ...           | ...  | ...       |

Explores how each LLM responds to your queries, with brand mention status, rank, and sentiment (Positive / Neutral / Negative).

---

## Quick Start

### 1. Environment

Create `.env` at repo root:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# LLM API keys (optional; mock used if absent)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...

# Backend
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 2. Database

Apply migrations in Supabase SQL Editor:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_seed_data.sql`
- `supabase/migrations/003_notifications_and_snapshots.sql`

### 3. Run

```bash
./start-backend.sh   # http://localhost:8000
./start-frontend.sh  # http://localhost:3000
```

Open http://localhost:3000, sign in, and use the dashboard. Click **Run Scan** to populate real LLM responses (requires API keys).

---

## Deployment

*Add your deployment URL here when deployed (e.g. Vercel, Netlify).*

---

## Key Docs

- **AGENTS.md** — Repository guidelines, commands, coding style
- **claudecontext/01-product.md** — Product overview, pricing, features
- **claudecontext/02-architecture.md** — Tech stack, data flow, API
- **claudecontext/05-getting-actual-data.md** — How to run seed + scan for real data

---

## License

Proprietary.
