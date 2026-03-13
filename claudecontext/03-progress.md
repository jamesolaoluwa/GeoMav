# GeoMav — Progress Tracker

Last updated: 2026-03-13 (session 4)

## Completed

### Infrastructure
- [x] Project structure (frontend + backend + supabase migrations)
- [x] Supabase client setup (frontend browser + server, backend service role)
- [x] Environment config (.env at root, .env.local in frontend)
- [x] Start/stop scripts (start-backend.sh, start-frontend.sh, stop-all.sh)
- [x] Nodemon + concurrently for dev workflow (single `./start.sh` runs both services)
- [x] Backend config fixed (extra="ignore" for Pydantic settings)
- [x] .gitignore updated (__pycache__, .venv*)

### Landing Page
- [x] Full rebrand from BloomFi to GeoMav
- [x] Hero section with animated network visualization SVG
- [x] "What is GeoMav?" explainer section
- [x] Feature cards: Monitor, Validate, Optimize
- [x] AI platforms section (ChatGPT, Gemini, Claude, Perplexity, Bing AI, Google SGE)
- [x] Use cases: Small Business, E-commerce, Agencies
- [x] Pricing: Starter $99, Growth $299, Agency $999 (Enterprise $3k note)
- [x] FAQ with GeoMav-specific questions
- [x] CTA: "Take control of your AI presence"
- [x] Logo updated (location-pin/radar icon + "GeoMav" text)
- [x] Footer rebranded
- [x] Navigation links updated

### Authentication
- [x] Sign-in page wired to Supabase Auth (email/password + Google OAuth)
- [x] Sign-up page wired to Supabase Auth
- [x] Auth middleware protecting /dashboard/* routes
- [x] Redirect unauthenticated users to /signin
- [x] Redirect authenticated users from /signin to /dashboard
- [x] AuthLayout with animated network visualization
- [x] GeoMav branding on auth pages
- [x] Logo links back to landing page from auth pages

### Dashboard Layout
- [x] Sidebar with grouped navigation (Analytics, Monitor, Action, Settings)
- [x] Top header with page title and notifications
- [x] Sign Out button (sidebar bottom + header)
- [x] User avatar (initials) and email displayed in sidebar and header
- [x] GeoMav logo links back to landing page
- [x] Mobile-responsive sidebar (hamburger menu)
- [x] Active route highlighting

### Dashboard Pages (10 pages)
- [x] Overview: metric cards, visibility trend chart, LLM breakdown, competitors table, hallucinations table, Run Scan button
- [x] Visibility: score history, brand rankings, Rankings By Topic table, query explorer
- [x] Hallucinations: claims table with inline status dropdown (pending/deployed/resolved)
- [x] Prompts: prompt list with add/delete, category badges
- [x] Competitors: visibility ranking bar chart, mention frequency, sentiment comparison
- [x] Sentiment: stacked area trend chart, by-LLM breakdown, by-query table
- [x] Shopping: product mention matrix, shopping query results
- [x] Opportunities: priority-ranked action items with category filters and status management
- [x] Content: AI Summary / llms.txt / JSON-LD tabs with editor and deploy buttons
- [x] Settings: business profile form, API keys, notification toggles, account management

### Backend API (16 routers)
- [x] All routers created with mock data
- [x] All routers updated to query Supabase with graceful mock fallback
- [x] Dashboard aggregation from multiple tables
- [x] CRUD operations for hallucinations, prompts, opportunities, content, business
- [x] Run Scan endpoint triggering Analytics Agent as background task
- [x] User router: GET /api/user/profile (with mock fallback), DELETE /api/user/account
- [x] Notifications router: GET/PUT /api/notifications/preferences, GET /api/notifications/log
- [x] Export router: GET /api/export (CSV/JSON for mentions, claims, competitors, visibility, full)
- [x] History router: GET /api/history/compare, GET /api/history/snapshots, POST /api/history/snapshot

### Frontend-Backend Wiring
- [x] All 10 dashboard pages fetch from API via useEffect/useState
- [x] Loading skeletons on all pages
- [x] Mock data fallback on API error
- [x] Write operations wired: hallucination status, prompt CRUD, opportunity status, content save/deploy, business profile save, account profile save, password change, account deletion
- [x] Run Scan button on dashboard overview
- [x] Notification preferences toggle persisted to backend (fetch on mount, persist on change)
- [x] Export buttons on dashboard, hallucinations, and visibility pages (CSV/JSON download)
- [x] Compare Periods section on visibility page with date pickers, side-by-side metrics, and dual-line chart

### Database
- [x] Supabase SQL migration (001_initial_schema.sql): 8 tables, indexes, RLS policies
- [x] Seed data (002_seed_data.sql): sample business, queries, responses, mentions, claims, content, opportunities, competitors
- [x] Migration 003_notifications_and_snapshots.sql: notification_preferences, notification_log, visibility_snapshots tables
- [x] Migrations run in Supabase

### Backend Agents
- [x] Analytics Agent: LLM querying with mock fallback, mention extraction, visibility calculation
- [x] Enrichment Agent: business summary, llms.txt, JSON-LD, FAQ generation
- [x] Reinforcement Agent: claim extraction, classification, correction generation

### Email & Notification System
- [x] Resend email service with dev fallback (logs to console when no API key)
- [x] Hallucination alert emails triggered automatically after scans (when new claims found)
- [x] Weekly report email generation (visibility score, mentions, claims, top opportunities)
- [x] APScheduler cron job for weekly reports (Monday 09:00 UTC)
- [x] Notification preferences table (per-user toggles + custom email)
- [x] Notification log table for email send audit trail

### Data Export
- [x] Export router: CSV and JSON formats
- [x] Exportable data types: mentions, claims, competitors, visibility, full (all)
- [x] Date range filtering on all export types
- [x] ExportButton shared component with dropdown (CSV/JSON)
- [x] Export buttons on dashboard, hallucinations, and visibility pages

### Historical Data Comparison
- [x] Visibility snapshots table for periodic data capture
- [x] Automatic snapshot creation after each scan
- [x] Manual snapshot trigger endpoint
- [x] Period comparison API (two date ranges with deltas)
- [x] Compare Periods collapsible section on visibility page
- [x] Side-by-side metrics (visibility, mentions, claims, sentiment) with delta indicators
- [x] Dual-line comparison chart (Recharts)

## Pending / Not Yet Built

### Onboarding Flow
- [x] Post-signup onboarding page at /onboarding
- [x] Website URL input -> fetch /llms.txt or meta tags
- [x] Auto-populate Business Profile from website data
- [x] Run initial AI scan across all LLMs
- [x] Show initial results summary before redirecting to dashboard
- [x] Middleware redirect: authenticated users on /signin go to /onboarding
- [x] Signup redirects to /onboarding after account creation
- [x] Backend: POST /api/onboard (analyze website), POST /api/onboard/save (save profile + generate queries), POST /api/onboard/scan (run initial scan)
- [x] DeepSeek added as 6th tracked AI platform across all files

### Real LLM Integration
- [ ] Actually call OpenAI, Anthropic, Gemini, Perplexity APIs when keys are provided (agent code exists but untested with real keys)
- [ ] Handle rate limiting and API errors gracefully

### User Profile / Account Management
- [x] useUser hook with Supabase auth.getUser() and dummy fallback
- [x] Account section on Settings: avatar, display name edit, read-only email
- [x] Change Password section with validation (min 8 chars, confirm match)
- [x] Danger Zone: delete account with confirmation modal (type "DELETE")
- [x] Backend DELETE /api/user/account via Supabase Admin API (cascades to businesses)
- [x] UserProfile type added to frontend types
- [x] Header avatar links to Settings; sidebar shows user identity

### Missing Features
- [x] Email notification system for hallucination alerts
- [x] Weekly report generation and delivery
- [ ] Stripe/payment integration for subscription tiers
- [ ] Multi-business support (multiple profiles per user)
- [ ] Agency white-label features
- [x] Data export functionality
- [x] Historical data comparison / trend analysis with real data

### Polish
- [ ] Error boundary components
- [ ] Toast notifications (replace alerts)
- [ ] Form validation on all forms
- [ ] Responsive design testing on all pages
- [ ] SEO meta tags on landing page
- [ ] Performance optimization (lazy loading charts)

### Phase Alignment (Multi-Phase Diagram)
- [x] Phase-based journey tracking: `business_journey` table, `/api/journey` endpoint, PhaseStepper component in dashboard header
- [x] Onboarding aligned to Phase 1: Enter URL → Select Industry → Build Truth Store → Baseline Scan
- [x] Truth Store concept: Settings/Business Profile rebranded as "Truth Store" with explanation copy
- [x] Truth Score metric: computed in `/api/dashboard` (% of resolved claims), shown on Overview as 5th metric card
- [x] Action Queue: Opportunities page rebranded with "Start Action", "Deploy Correction", and "Configure Agents" buttons
- [x] Agent Operations dashboard: `/dashboard/agents` page with per-agent metrics and Configure Agents (LLM toggles, scan frequency, auto-deploy)
- [x] Agent settings: `agent_settings` table, `/api/agents/settings` GET/PUT endpoints
- [x] Agent run tracking: `agent_runs` table, `/api/agents/metrics` endpoint
- [x] Ethics Monitor: `/dashboard/ethics` page with flags list, severity badges, and status management
- [x] Ethics flags: `ethics_flags` table, `/api/ethics` GET/PATCH endpoints
- [x] Correction Timeline: `/dashboard/corrections` page with pipeline overview and per-claim vertical timeline
- [x] Claim events: `claim_events` table, `/api/corrections/timeline/{id}` and `/api/corrections/overview` endpoints
- [x] Growth & ROI dashboard: `/dashboard/roi` page with truth score, projected growth, trust trend chart, resolution rate
- [x] Agent Performance Report: `/api/roi/agent-report` endpoint, per-agent attribution table in ROI page
- [x] Agent performance reports: `agent_performance_reports` table
- [x] Database migration: `004_phase_alignment.sql` with all new tables, indexes, and RLS policies
- [x] 5 new backend routers: journey, agents, ethics, corrections, roi (registered in main.py)
- [x] 4 new dashboard pages: agents, ethics, corrections, roi
- [x] Sidebar updated: "Operations" group with Agent Operations, Ethics Monitor, Corrections, Growth & ROI
- [x] Opportunities renamed to "Action Queue" in sidebar and page titles

## Known Issues
- Recharts shows width/height warnings during static pre-rendering (harmless, charts render fine in browser)
- Next.js middleware deprecation warning (middleware -> proxy convention)
- Shopping page falls back to mock data because backend response shape doesn't match frontend expected format
