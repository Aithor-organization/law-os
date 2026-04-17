from __future__ import annotations

import httpx

_client: httpx.AsyncClient | None = None


def set_client(client: httpx.AsyncClient | None) -> None:
    global _client
    _client = client


def get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError(
            "HTTP client not initialized; ensure FastAPI lifespan started"
        )
    return _client


def build_client() -> httpx.AsyncClient:
    timeout = httpx.Timeout(connect=10.0, read=30.0, write=20.0, pool=10.0)
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
    return httpx.AsyncClient(timeout=timeout, limits=limits)
