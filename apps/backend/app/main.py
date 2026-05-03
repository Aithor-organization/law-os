from __future__ import annotations

import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from .auth import authenticate_bearer_token
from .byok import consume_free_chat, parse_byok_headers
from .chat_store import persist_assistant_message
from .config import get_settings, validate_settings
from .gemini import build_system_instruction, stream_chat
from .http_client import build_client, set_client
from .llm import stream_byok
from .llm.router import test_byok
from .law_subscriptions import (
    get_install_status,
    ingest_law_on_demand,
    list_catalog,
    list_user_subscriptions,
    subscribe,
    unsubscribe,
)
from .rag import retrieve_rag_context
from .rag_data import sync_core_statutes, sync_seed_precedents
from .search import log_search_activity, run_search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("law-os-backend")

settings = get_settings()
validate_settings(settings)

_IS_PRODUCTION = settings.environment == "production"


@asynccontextmanager
async def lifespan(_: FastAPI):
    client = build_client()
    set_client(client)
    try:
        yield
    finally:
        set_client(None)
        await client.aclose()


app = FastAPI(title="LAW.OS Backend", version="0.1.0", lifespan=lifespan)

_cors_origins = settings.cors_origins
if not _cors_origins:
    if _IS_PRODUCTION:
        raise RuntimeError("BACKEND_CORS_ORIGINS must be set in production")
    _cors_origins = ["http://localhost:8081", "http://127.0.0.1:8081"]
    logger.warning(
        "BACKEND_CORS_ORIGINS not set; using development defaults: %s", _cors_origins
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:  # noqa: BLE001
        logger.exception(
            "request failed request_id=%s path=%s", request_id, request.url.path
        )
        raise

    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    response.headers["X-Request-Id"] = request_id
    logger.info(
        "%s %s -> %s (%sms) request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )
    return response


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    tier: Literal["flash", "pro"] = "flash"
    conversationId: str | None = None


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    target: Literal["statute", "case", "all"] = "statute"
    code: Literal["civil", "criminal", "constitutional", "commercial"] | None = None
    article: int | None = Field(default=None, ge=1)
    limit: int = Field(default=10, ge=1, le=20)


class RagSyncRequest(BaseModel):
    includePrecedents: bool = True
    precedentLimit: int = Field(default=3, ge=1, le=10)
    embed: bool = False


@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "law-os-backend",
        "models": {
            "flash": settings.gemini_model_flash,
            "pro": settings.gemini_model_pro,
        },
    }


@app.post("/byok/test")
async def byok_test_endpoint(
    authorization: str | None = Header(default=None),
    x_byok_provider: str | None = Header(default=None),
    x_byok_model: str | None = Header(default=None),
    x_byok_key: str | None = Header(default=None),
):
    """Proxy BYOK key validation through the backend.

    Why: Gemini's REST API uses ?key=... in the URL, which leaks the key into
    client network logs, ISP traces, and corporate proxies. Routing the test
    ping through this endpoint keeps the user's key inside an HTTPS body that
    is also covered by the BYOKConfig __repr__ mask.
    """
    user = await authenticate_bearer_token(authorization)
    cfg = parse_byok_headers(x_byok_provider, x_byok_model, x_byok_key)
    if cfg is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="missing_byok_headers",
        )
    try:
        ok = await test_byok(cfg)
    except Exception:  # noqa: BLE001
        # Defensive: never echo the key back, never include exception text in
        # the response (could contain auth header repr).
        logger.exception("/byok/test failed user_id=%s provider=%s",
                         user.user_id, cfg.provider)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="provider_unreachable",
        )
    return {"ok": ok, "provider": cfg.provider}


@app.post("/search")
async def search_endpoint(
    request: SearchRequest,
    http_request: Request,
    authorization: str | None = Header(default=None),
):
    user = await authenticate_bearer_token(authorization)
    request_id = getattr(http_request.state, "request_id", "unknown")
    result = await run_search(
        query=request.query,
        target=request.target,
        code=request.code,
        article=request.article,
        limit=request.limit,
    )
    await log_search_activity(
        user_id=user.user_id,
        query=request.query,
        result_count=len(result.items),
        category=result.effective_code,
        result_type=request.target,
    )
    logger.info(
        "/search completed user_id=%s total=%s request_id=%s mode=%s target=%s",
        user.user_id,
        result.total,
        request_id,
        result.mode,
        result.target,
    )
    return {
        "items": [
            {
                "id": item.id,
                "type": item.type,
                "title": item.title,
                "textPreview": item.text_preview,
                "score": item.score,
                "code": item.code,
                "codeKr": item.code_kr,
                "articleNo": item.article_no,
                "part": item.part,
                "chapter": item.chapter,
                "caseNo": item.case_no,
                "court": item.court,
                "decidedAt": item.decided_at,
                "category": item.category,
            }
            for item in result.items
        ],
        "total": result.total,
        "query": request.query,
        "filters": {
            "code": result.effective_code,
            "article": result.effective_article,
        },
        "target": result.target,
        "mode": result.mode,
    }


@app.post("/admin/rag/sync")
async def sync_rag_data_endpoint(
    request: RagSyncRequest,
    authorization: str | None = Header(default=None),
    x_law_sync_secret: str | None = Header(default=None, alias="X-Law-Sync-Secret"),
):
    await authenticate_bearer_token(authorization)
    expected_secret = settings.law_sync_secret
    if not expected_secret or x_law_sync_secret != expected_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")

    result = await sync_core_statutes(embed=request.embed)
    if request.includePrecedents:
        result.update(
            await sync_seed_precedents(
                per_query_limit=request.precedentLimit,
                embed=request.embed,
            )
        )
    return result


@app.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    http_request: Request,
    authorization: str | None = Header(default=None),
    x_byok_provider: str | None = Header(default=None),
    x_byok_model: str | None = Header(default=None),
    x_byok_key: str | None = Header(default=None),
):
    user = await authenticate_bearer_token(authorization)
    request_id = getattr(http_request.state, "request_id", "unknown")

    # BYOK gate: if user provides their own LLM key, route to that provider
    # and skip the daily quota. Otherwise consume a free message via RPC and
    # 429 if exhausted.
    byok_cfg = parse_byok_headers(x_byok_provider, x_byok_model, x_byok_key)
    if byok_cfg is None:
        rate = await consume_free_chat(user.token)
        if not rate.allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "free_quota_exhausted",
                    "used": rate.used,
                    "limit": rate.limit,
                    "bonus": rate.bonus,
                },
            )
        logger.info(
            "/chat quota user_id=%s used=%s limit=%s",
            user.user_id, rate.used, rate.limit
        )

    context_blocks, citation_candidates, rag_meta, recommendations = await retrieve_rag_context(
        request.message, user_id=user.user_id
    )
    logger.info(
        "/chat accepted user_id=%s tier=%s byok=%s request_id=%s rag_statutes=%s rag_precedents=%s rec=%s",
        user.user_id,
        request.tier,
        byok_cfg.provider if byok_cfg else "none",
        request_id,
        rag_meta.get("statutes", 0),
        rag_meta.get("precedents", 0),
        len(recommendations),
    )

    async def event_stream():
        emitted_chars = 0
        assistant_chunks: list[str] = []
        started = time.perf_counter()
        try:
            # Emit recommendations as a special event (before assistant tokens)
            # so the UI can render the banner alongside the streaming response.
            if recommendations:
                rec_payload = {
                    "recommendations": [
                        {
                            "code": r.code,
                            "koreanName": r.korean_name,
                            "reason": r.reason,
                            "matchedArticle": r.matched_article,
                            "score": r.score,
                        }
                        for r in recommendations
                    ]
                }
                yield f"data: {json.dumps(rec_payload, ensure_ascii=False)}\n\n"

            if byok_cfg is not None:
                system = build_system_instruction(context_blocks)
                stream_iter = stream_byok(byok_cfg, request.message, system=system)
                model_label = f"{byok_cfg.provider}:{byok_cfg.model}"
            else:
                stream_iter = stream_chat(
                    request.message,
                    request.tier,
                    context_blocks=context_blocks,
                )
                model_label = (
                    settings.gemini_model_pro
                    if request.tier == "pro"
                    else settings.gemini_model_flash
                )

            async for chunk in stream_iter:
                emitted_chars += len(chunk)
                assistant_chunks.append(chunk)
                yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"

            assistant_content = "".join(assistant_chunks).strip()
            persisted = None
            if assistant_content:
                try:
                    persisted = await persist_assistant_message(
                        user_id=user.user_id,
                        conversation_id=request.conversationId,
                        content=assistant_content,
                        model=model_label,
                        citations=citation_candidates,
                    )
                except Exception:  # noqa: BLE001
                    logger.exception(
                        "assistant persistence failed request_id=%s", request_id
                    )

            logger.info(
                "/chat completed user_id=%s chars=%s citations=%s persisted=%s latency_ms=%s request_id=%s",
                user.user_id,
                emitted_chars,
                len(citation_candidates),
                bool(persisted),
                round((time.perf_counter() - started) * 1000, 1),
                request_id,
            )
            yield "data: [DONE]\n\n"
        except Exception:  # noqa: BLE001
            logger.exception(
                "/chat stream failed request_id=%s byok=%s",
                request_id,
                byok_cfg.provider if byok_cfg else "none",
            )
            error_payload = {
                "error": "stream_failed",
                "request_id": request_id,
                # Non-sensitive context to help client UI render a useful
                # message (e.g., "Anthropic 응답 실패"). API key never echoed.
                "provider": byok_cfg.provider if byok_cfg else "default",
            }
            yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
            # Always close the stream cleanly so the client's reader loop
            # doesn't hang waiting for [DONE] after a partial response.
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Request-Id": request_id,
        },
    )


class SubscribeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=80)


@app.get("/laws/catalog")
async def laws_catalog_endpoint(
    category: str | None = None,
    search: str | None = None,
    limit: int = 200,
    authorization: str | None = Header(default=None),
):
    """법령 카탈로그 조회 (설치 가능한 전체 목록)."""
    await authenticate_bearer_token(authorization)
    items = await list_catalog(category=category, search=search, limit=limit)
    return {"items": items, "total": len(items)}


@app.get("/laws/my")
async def laws_my_endpoint(authorization: str | None = Header(default=None)):
    """현재 사용자가 구독 중인 법령 목록."""
    user = await authenticate_bearer_token(authorization)
    items = await list_user_subscriptions(user.user_id)
    return {"items": items, "total": len(items)}


@app.post("/laws/subscribe")
async def laws_subscribe_endpoint(
    request: SubscribeRequest,
    background: BackgroundTasks,
    authorization: str | None = Header(default=None),
):
    """법령 구독. loaded=false면 백그라운드로 ingest 트리거."""
    user = await authenticate_bearer_token(authorization)
    try:
        result = await subscribe(user.user_id, request.code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    if result.get("needs_ingestion"):
        background.add_task(ingest_law_on_demand, request.code)
        return {"code": request.code, "status": "pending_ingestion", "ingesting": True}

    return {"code": request.code, "status": "ready", "ingesting": False}


@app.delete("/laws/subscribe/{code}")
async def laws_unsubscribe_endpoint(
    code: str,
    authorization: str | None = Header(default=None),
):
    """법령 구독 해제 (법령 자체는 DB에서 삭제 안 됨)."""
    user = await authenticate_bearer_token(authorization)
    await unsubscribe(user.user_id, code)
    return {"code": code, "status": "unsubscribed"}


@app.get("/laws/install-status/{code}")
async def laws_install_status_endpoint(
    code: str,
    authorization: str | None = Header(default=None),
):
    """ingest 진행 상태 조회. 앱에서 폴링용."""
    await authenticate_bearer_token(authorization)
    return await get_install_status(code)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):  # noqa: ANN001
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception(
        "Unhandled backend exception request_id=%s path=%s",
        request_id,
        request.url.path,
    )
    body: dict[str, str] = {
        "error": "internal_server_error",
        "request_id": request_id,
    }
    if not _IS_PRODUCTION:
        body["detail"] = str(exc)
    return JSONResponse(status_code=500, content=body)
