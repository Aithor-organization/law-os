# LAW.OS Backend — Railway Deployment Guide

FastAPI backend deployment to Railway. Reads from Supabase, calls Gemini.

## Prerequisites

1. Railway account — https://railway.app (GitHub login OK)
2. Supabase project with migrations 001–007 applied and embeddings backfilled
3. API keys ready: Gemini, 법령정보센터 OC

## One-time Setup

### 1. Create Railway project

```bash
# Option A: CLI
npm i -g @railway/cli
railway login
railway init            # Choose "Empty Project"
railway link            # Link this directory to the new project

# Option B: Web dashboard
# → New Project → Deploy from GitHub repo → select this repo
# → Set root directory to `apps/backend`
```

### 2. Configure environment variables

Copy values from your local `apps/backend/.env` to Railway **Variables** tab.

Minimum required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `LAW_API_OC`
- `LAW_SYNC_SECRET`
- `ENVIRONMENT=production`
- `BACKEND_CORS_ORIGINS=https://lawos.kr` (or whatever your domain is)

Do **not** set `PORT` — Railway injects it automatically.

### 3. Set Root Directory

In Railway Settings → **Source**:
- Root directory: `apps/backend`
- Railway will find `Dockerfile` and `railway.toml` automatically.

### 4. Deploy

```bash
railway up              # CLI, from apps/backend/
# or push to GitHub — Railway auto-deploys on push to main
```

### 5. Attach a custom domain (optional)

Railway Settings → **Networking** → **Custom Domain**:
- Add `api.lawos.kr`
- Set DNS CNAME at your registrar to the Railway-provided target
- TLS is auto-provisioned (Let's Encrypt)

## Verify deployment

```bash
# Replace with your Railway-provided URL or custom domain
curl https://<your-app>.up.railway.app/health
# Expected: {"ok":true,"service":"law-os-backend",...}
```

## Update the mobile app

Point `mobile/.env.production` (or EAS secrets) to the deployed URL:

```
EXPO_PUBLIC_API_BASE_URL=https://api.lawos.kr
```

## Rolling back

Railway keeps deploy history. Settings → **Deployments** → pick previous → Redeploy.

## Cost expectations (Railway Hobby plan)

- $5/month includes $5 usage credit.
- This backend is lightweight (async FastAPI, stateless, Supabase-backed).
- Expected usage with moderate traffic: $5–15/month.
- Auto-sleep is **not enabled by default** — app runs 24/7. To enable, use Railway's sleep configuration.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Build fails at `pip install` | `requirements.txt` has platform-specific wheel — add build-essential to Dockerfile |
| Health check times out | Supabase/Gemini env vars missing → app fails at startup. Check Railway logs. |
| 500 on `/chat` with `stream_failed` | Gemini API key invalid or quota exceeded. |
| 403 on `/admin/rag/sync` | Sending wrong `X-Law-Sync-Secret` header — must match `LAW_SYNC_SECRET` env. |
| CORS error from mobile app | Mobile fetch bypasses browser CORS. Only applies to web clients. |
