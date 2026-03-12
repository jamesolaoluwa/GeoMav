# GeoMav — Key Decisions

Last updated: 2026-03-12

## Architecture Decisions

### Supabase over Redis + PostgreSQL
- **Decision**: Use Supabase for everything (database, auth, realtime) instead of standalone PostgreSQL + Redis queue
- **Reason**: Supabase provides managed PostgreSQL, built-in Auth, Realtime subscriptions, and RLS policies out of the box. Eliminates need for Redis (pg_cron for scheduling), SQLAlchemy/Alembic (SQL migrations instead), and custom auth
- **Trade-off**: Vendor lock-in with Supabase, but simplifies the stack significantly

### FastAPI as API layer (not direct Supabase from frontend)
- **Decision**: Frontend calls FastAPI backend, backend calls Supabase with service role key
- **Reason**: Agents need server-side execution (calling LLM APIs, background tasks). Having a backend also allows complex aggregation queries and business logic without exposing the service role key to the client
- **Trade-off**: Extra hop, but auth-only operations (sign-in/sign-up) go directly from frontend to Supabase

### Mock data fallback everywhere
- **Decision**: Every backend router falls back to mock data if Supabase fails. Every frontend page falls back to mock data if the API fails
- **Reason**: The app should always render something useful, even during development without Supabase keys or when the backend is down
- **Trade-off**: Users might see stale/fake data without realizing the API is down (could add a banner)

### Keep existing landing page, rebrand later
- **Decision**: Initially kept the BloomFi landing page and only added the dashboard alongside it. Later fully rebranded to GeoMav
- **Reason**: User wanted to get the dashboard working first, then rebrand the landing page separately
- **Outcome**: Landing page is now fully rebranded for GeoMav

## UI/UX Decisions

### Dashboard under /dashboard/* with separate layout
- **Decision**: Dashboard lives under /dashboard/ with its own layout.tsx (sidebar + header), separate from the landing page's layout
- **Reason**: Landing page has its own navbar/footer style. Dashboard needs a completely different shell (sidebar navigation)

### Sidebar navigation grouping
- **Decision**: Grouped sidebar into Analytics (Overview, Visibility, Sentiment), Monitor (Hallucinations, Prompts, Shopping), Action (Opportunities, Content, Competitors), and Settings
- **Reason**: Matches the product's three core capabilities and makes navigation logical

### Auth pages with animated network visualization
- **Decision**: Added an animated SVG showing AI platform nodes connecting to a central "You" brand node with flowing data pulses
- **Reason**: Visually communicates what GeoMav does right on the sign-in page

### Pricing without billing toggle
- **Decision**: Show flat monthly prices ($99/$299/$999) without a monthly/annual toggle
- **Reason**: The actual pricing tiers are straightforward monthly subscriptions, no annual discount structure was specified

## Technical Decisions

### Next.js 16 (kept, not downgraded)
- **Decision**: Originally planned to downgrade to Next.js 14 per spec, but kept 16 since everything works
- **Reason**: No compatibility issues, and v16 has latest features

### Recharts for all charts
- **Decision**: Use Recharts for line charts, bar charts, area charts, etc.
- **Reason**: Specified in requirements, works well with React, supports responsive containers

### Pydantic Settings with extra="ignore"
- **Decision**: Added extra="ignore" to backend config after BACKEND_URL in .env caused validation errors
- **Reason**: The .env file has variables not mapped to Settings fields (like BACKEND_URL). Without extra="ignore", Pydantic v2 rejects them

### Background tasks over Redis queue
- **Decision**: Use FastAPI BackgroundTasks for the scan agent instead of a Redis job queue
- **Reason**: Simpler, no Redis dependency. For MVP volume this is sufficient. Can migrate to a proper queue (Celery, arq) if needed at scale

## Naming Conventions

- Database tables: snake_case plural (businesses, llm_responses, content_sections)
- API routes: /api/kebab-case (run-scan, deploy-correction)
- TypeScript types: PascalCase (DashboardMetrics, LLMBreakdown)
- React components: PascalCase files (AuthLayout.tsx, CTAButton.tsx)
- Python files: snake_case (supabase_client.py, analytics.py)
