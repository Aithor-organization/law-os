# LAW.OS Backend API

Supabase Edge Functions (Deno) — handles chat, RAG, and other server-side operations.

## Setup

1. **Install Supabase CLI** (if not already):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Fill environment variables**: edit `.env.local` with real values from
   - Supabase Dashboard → Settings → API
   - https://aistudio.google.com/apikey (GEMINI_API_KEY)

   > For local `supabase functions serve`, use `LAWOS_SUPABASE_URL` /
   > `LAWOS_SUPABASE_ANON_KEY` / `LAWOS_SUPABASE_SERVICE_ROLE_KEY` in
   > `.env.local`. Names beginning with `SUPABASE_` may be skipped by the
   > local CLI/runtime.

3. **Link the project** (once):
   ```bash
   cd apps/api
   supabase link --project-ref <YOUR_PROJECT_REF>
   ```

## Develop locally

```bash
cd apps/api
supabase functions serve chat --env-file .env.local --no-verify-jwt
```

The function will be available at `http://127.0.0.1:54321/functions/v1/chat`.

> `--no-verify-jwt` is recommended for local hybrid development where the app
> uses a cloud Supabase project/session while the function itself runs locally.
> The function then validates the token via `_shared/auth.ts` using the
> `LAWOS_SUPABASE_*` env vars.

### Test with curl

```bash
# Get a valid JWT from the mobile app first (dev tools → local storage,
# or sign in via a short test script). Then:
curl -N -X POST http://127.0.0.1:54321/functions/v1/chat \
  -H "Authorization: Bearer $SUPABASE_USER_JWT" \
  -H "content-type: application/json" \
  -d '{"message":"민법 제750조가 뭐야?","tier":"flash"}'
```

You should see SSE chunks streaming.

## Deploy

```bash
cd apps/api

# Push secrets (one-time, and whenever they change)
supabase secrets set --env-file .env.local

# Deploy the function
supabase functions deploy chat
```

After deploy, the function runs at `https://<project-ref>.supabase.co/functions/v1/chat`.

## Structure

```
apps/api/
├── .env.local.example     # template (committed)
├── .env.local             # your keys (gitignored)
├── deno.json              # Deno config + import map
├── README.md              # this file
└── supabase/
    └── functions/
        ├── _shared/       # shared helpers (not deployed as their own function)
        │   ├── auth.ts    # Supabase JWT validation
        │   ├── cors.ts    # CORS headers
        │   └── gemini.ts  # Gemini REST client (chat + embeddings)
        └── chat/
            └── index.ts   # POST /chat — streaming endpoint
```

## Model configuration

Models are selected via environment variables (see `.env.local.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_MODEL_FLASH` | `gemini-2.5-flash` | Default chat — fast & cheap |
| `GEMINI_MODEL_PRO` | `gemini-2.5-pro` | High-quality / Deep Debate |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | RAG embeddings (3072-dim) |

Override in `.env.local` if Google releases newer models. Check
https://ai.google.dev/gemini-api/docs/models for the current list.
