# GeoMav

GeoMav is an AI visibility monitoring platform that tracks how AI assistants (ChatGPT, Gemini, Claude, Perplexity, Bing, DeepSeek) represent your business. Monitor mentions, detect hallucinations (incorrect claims), and optimize your brand’s presence in AI-powered discovery—all from one dashboard.

---

## Features

1. **AI Visibility Monitoring** — Track how your brand appears across ChatGPT, Gemini, Claude, Perplexity, Bing, and DeepSeek
<img width="1917" height="993" alt="image" src="https://github.com/user-attachments/assets/f62f1b58-80f9-428d-a70f-817ac08cffcc" />


2. **Hallucination Detection** — Automatically extract and flag incorrect claims AI makes about your business
<img width="1929" height="991" alt="image" src="https://github.com/user-attachments/assets/9b1733e3-b87c-4500-8e13-3d4399380b80" />


4. **Sentiment & Competitor Analysis** — View sentiment trends, competitor rankings, and visibility by topic
<img width="1928" height="991" alt="image" src="https://github.com/user-attachments/assets/5e8d2625-1190-4f58-8e38-3e50167c4bec" />


5. **Query Response Explorer** — Inspect how each LLM responds to your queries, with brand mention, rank, and sentiment
<img width="1923" height="989" alt="image" src="https://github.com/user-attachments/assets/486c99b4-e2c3-4189-8a07-79bed58a8d09" />


6. **Content Optimization** — Generate AI-optimized summaries, JSON-LD, and `/llms.txt` for better AI representation
<img width="1925" height="992" alt="image" src="https://github.com/user-attachments/assets/448bc495-deeb-480e-8bf7-466b55207e16" />


**User-Friendly Dashboard** — Navigate visibility, hallucinations, prompts, opportunities, and analytics in one place
<img width="1921" height="992" alt="image" src="https://github.com/user-attachments/assets/57937997-40dc-4816-be65-828e554a8a6b" />

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

### Visibility Rankings By Topic & Query Response Explorer
<img width="1927" height="990" alt="image" src="https://github.com/user-attachments/assets/ec44c3c3-04ce-4f80-9a8a-b161221b7d1d" />


Shows where your brand ranks across topics and queries and Explores how each LLM responds to your queries, with brand mention status, rank, and sentiment (Positive / Neutral / Negative).


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

**Frontend:** Vercel | **Backend:** Railway or Render

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions. After deploying, add your live URL here.

---

## Meet the Team

- Otito Udedibor
- Olaoluwa James-Owolabi
- Dijon Miller
- Mikea Fernander
- Reanna Knowles

---

## License

Proprietary.
