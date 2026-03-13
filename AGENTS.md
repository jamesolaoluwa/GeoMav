# Repository Guidelines

## Project Structure & Module Organization
`frontend/` contains the Next.js 16 App Router client. Put route files in `frontend/src/app`, shared UI in `frontend/src/components`, shared utilities and types in `frontend/src/lib`, and static assets in `frontend/public`. `backend/` contains the FastAPI service: `backend/app/main.py` wires the app, `backend/app/routers/` holds `/api/*` endpoints, `backend/app/agents/` contains analysis logic, and `backend/app/schemas.py` plus `backend/app/config.py` define shared models and settings. Database changes belong in `supabase/migrations/`. Product and architecture notes live in `claudecontext/`.

## Build, Test, and Development Commands
- `./start-backend.sh`: run the API locally on `http://localhost:8000`.
- `./start-frontend.sh`: run the web app locally on `http://localhost:3000`.
- `./start.sh`: reminder wrapper for starting both services in separate terminals.
- `./stop-all.sh`: stop local processes on ports `8000` and `3000`.
- `cd frontend && npm run lint`: run ESLint for the frontend.
- `cd frontend && npm run build`: verify the production Next.js build.
- `cd backend && python3 -m pip install -r requirements.txt`: install backend dependencies.

## Coding Style & Naming Conventions
Frontend code is TypeScript with `strict` mode and the `@/*` path alias. Use 2-space indentation, PascalCase for React components such as `PricingSection.tsx`, and lowercase route folders such as `src/app/dashboard/visibility`. Backend code follows standard Python style with 4-space indentation, snake_case module names, and focused routers grouped under `backend/app/routers/`. Reuse shared UI from `src/components/ui` before creating page-specific markup.

## Testing Guidelines
There is no automated test suite configured yet. Before opening a PR, run `cd frontend && npm run lint`, run `cd frontend && npm run build`, start both services, and verify the affected flows manually. At minimum, confirm `GET /health` returns OK and exercise the impacted dashboard or onboarding path. If you add tests, keep frontend names like `feature-name.test.tsx` and backend names like `test_visibility.py`.

## Commit & Pull Request Guidelines
Recent history uses short, imperative subjects such as `Updating functionality` and `dashboard done`, plus merge commits. Follow that pattern, but prefer clearer subjects under 72 characters and avoid vague messages like `w`. PRs should include a brief summary, linked issue or task, setup notes, and screenshots for UI changes. Call out any edits in `supabase/migrations/` explicitly so reviewers can apply schema changes safely.

## Security & Configuration Tips
Store secrets in a repo-root `.env`. Backend settings include Supabase and LLM API keys, while the frontend expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not commit credentials, local caches, or build output.
