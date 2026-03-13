# GeoMav Deployment Guide

Deploy the frontend (Next.js) and backend (FastAPI) separately. Supabase stays hosted—just configure env vars.

---

## 1. Deploy Backend (Railway or Render)

### Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub** → select your GeoMav repo.
3. Set the **Root Directory** to `backend`.
4. Railway will detect Python and use the `Procfile`. If not, set **Start Command** to:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add **Environment Variables** in the Railway dashboard:
   | Variable | Value |
   |----------|-------|
   | `SUPABASE_URL` | Your Supabase project URL (same as `NEXT_PUBLIC_SUPABASE_URL`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | From Supabase dashboard → Settings → API |
   | `ALLOWED_ORIGINS` | Your frontend URL, e.g. `https://geomav.vercel.app,https://your-custom-domain.com` |
   | `OPENAI_API_KEY` | (optional) |
   | `ANTHROPIC_API_KEY` | (optional) |
   | `GOOGLE_GEMINI_API_KEY` | (optional) |
   | `PERPLEXITY_API_KEY` | (optional) |
   | `RESEND_API_KEY` | (optional, for email alerts) |
6. Deploy. Copy the public URL (e.g. `https://geomav-api.up.railway.app`).

### Option B: Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New** → **Web Service** → connect your GeoMav repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the same environment variables as above under **Environment**.
5. Deploy. Copy the public URL (e.g. `https://geomav-api.onrender.com`).

---

## 2. Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import your GeoMav repo.
3. Set **Root Directory** to `frontend`.
4. Add **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `NEXT_PUBLIC_BACKEND_URL` | Your backend URL (e.g. `https://geomav-api.up.railway.app`) |
5. Deploy. Copy the frontend URL (e.g. `https://geomav.vercel.app`).

---

## 3. Wire CORS

Update the backend `ALLOWED_ORIGINS` env var to include your Vercel frontend URL:

```
https://geomav.vercel.app
```

Or comma-separated for multiple:

```
https://geomav.vercel.app,https://geomav.com
```

Redeploy the backend after changing env vars.

---

## 4. Supabase Auth Redirect URLs

In Supabase: **Authentication** → **URL Configuration**:

- **Site URL**: your frontend URL (e.g. `https://geomav.vercel.app`)
- **Redirect URLs**: add `https://geomav.vercel.app/**` (and any custom domains)

---

## 5. Verify

- Open your frontend URL → sign in → dashboard loads.
- API requests should go to the backend URL (check Network tab).
- Click **Run Scan** to confirm backend connectivity.

---

## Checklist

- [ ] Backend deployed (Railway or Render)
- [ ] Backend env vars set (Supabase, ALLOWED_ORIGINS)
- [ ] Frontend deployed (Vercel)
- [ ] Frontend env vars set (Supabase, NEXT_PUBLIC_BACKEND_URL)
- [ ] Supabase redirect URLs updated
- [ ] ALLOWED_ORIGINS includes frontend URL
