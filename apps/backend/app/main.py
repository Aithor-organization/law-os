from __future__ import annotations

import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from .auth import authenticate_bearer_token
from .chat_store import persist_assistant_message
from .config import get_settings, validate_settings
from .gemini import stream_chat
from .http_client import build_client, set_client
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
):
    user = await authenticate_bearer_token(authorization)
    request_id = getattr(http_request.state, "request_id", "unknown")
    context_blocks, citation_candidates, rag_meta = await retrieve_rag_context(request.message)
    logger.info(
        "/chat accepted user_id=%s tier=%s request_id=%s rag_statutes=%s rag_precedents=%s",
        user.user_id,
        request.tier,
        request_id,
        rag_meta.get("statutes", 0),
        rag_meta.get("precedents", 0),
    )

    async def event_stream():
        emitted_chars = 0
        assistant_chunks: list[str] = []
        started = time.perf_counter()
        try:
            async for chunk in stream_chat(
                request.message,
                request.tier,
                context_blocks=context_blocks,
            ):
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
                        model=settings.gemini_model_pro if request.tier == "pro" else settings.gemini_model_flash,
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
            logger.exception("/chat stream failed request_id=%s", request_id)
            error_payload = {"error": "stream_failed", "request_id": request_id}
            yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Request-Id": request_id,
        },
    )


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
