# LAW.OS FastAPI Backend

Supabase Edge Functions 대체용 FastAPI 백엔드입니다.
현재는 **chat 경로**를 우선 마이그레이션하여 프론트엔드가 FastAPI를 통해
Gemini + Supabase Auth를 사용하도록 구성합니다.

## Quick start

```bash
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Environment

Required:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `LAW_API_OC`

Optional:
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKEND_CORS_ORIGINS`
- `GEMINI_MODEL_FLASH`
- `GEMINI_MODEL_PRO`
- `GEMINI_EMBEDDING_MODEL`

## Current migration scope

- ✅ `/chat` SSE endpoint
- ✅ `/search` hybrid lexical search endpoint (statutes + cases + all)
- ✅ official law API seed sync (`scripts/sync_law_data.py`)
- ✅ LAW.OS Law MCP server (`app/law_mcp_server.py`)
- ✅ Supabase JWT validation via GoTrue `/auth/v1/user`
- ✅ Gemini streaming proxy
- ✅ search history / analytics write-back scaffold
- ✅ basic local RAG context injection (statutes + seeded precedents)
- ✅ assistant message persistence + citation writes to Supabase
- ✅ mobile chat citation rendering from `citations` table
- ⏳ conversations / notes API consolidation
- ⏳ webhook / export / advanced hybrid RAG endpoints

## Frontend integration

Set in `mobile/.env.local`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

`mobile/lib/chat.ts` now requires `EXPO_PUBLIC_API_BASE_URL` and sends all chat
traffic to FastAPI instead of the legacy Supabase Edge Function path.

## Sync official law data

```bash
cd apps/backend
source .venv/bin/activate
python scripts/sync_law_data.py --with-precedents --precedent-limit 3
```

## Run law MCP server

```bash
cd apps/backend
source .venv/bin/activate
python -m app.law_mcp_server
```

## Verify authenticated E2E

```bash
cd apps/backend
source .venv/bin/activate
python scripts/verify_e2e.py
```
