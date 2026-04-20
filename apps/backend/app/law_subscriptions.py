"""법령 카탈로그·구독 API 로직.

엔드포인트는 main.py에서 얇게 래핑하고, 비즈니스 로직은 여기에 모음.
lazy ingestion(법제처 API 조회 + 임베딩 + DB 저장)은 BackgroundTasks로 실행.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from .http_client import build_client, set_client
from .law_api import LawApiClient
from .rag_data import (
    _attach_embeddings,
    _chunked_upsert,
    normalize_statute_rows,
)
from .supabase_rest import SupabaseRestClient

logger = logging.getLogger("law-os-backend.law-subscriptions")


@dataclass(frozen=True)
class CatalogItem:
    code: str
    korean_name: str
    api_title: str
    category: str
    description: str | None
    is_default: bool
    loaded: bool
    article_count: int | None


async def list_catalog(
    *, category: str | None = None, search: str | None = None, limit: int = 200
) -> list[dict[str, Any]]:
    """카탈로그 조회. category 필터 + search 키워드 + 기본 200개 제한."""
    supabase = SupabaseRestClient()
    params: list[tuple[str, str]] = [
        ("select", "code,korean_name,api_title,category,description,is_default,loaded,article_count"),
        ("order", "is_default.desc,category.asc,korean_name.asc"),
        ("limit", str(limit)),
    ]
    if category:
        params.append(("category", f"eq.{category}"))
    if search:
        params.append(("korean_name", f"ilike.*{search}*"))

    query = "&".join(f"{k}={v}" for k, v in params)
    response = await supabase.get(f"law_catalog?{query}")
    response.raise_for_status()
    return response.json()


async def list_user_subscriptions(user_id: str) -> list[dict[str, Any]]:
    """사용자가 구독한 법령 + 카탈로그 메타데이터 join."""
    supabase = SupabaseRestClient()
    # PostgREST join: user_law_subscriptions → law_catalog
    query = (
        "select=code,subscribed_at,law_catalog(korean_name,category,description,loaded,article_count)"
        f"&user_id=eq.{user_id}"
        "&order=subscribed_at.desc"
    )
    response = await supabase.get(
        f"user_law_subscriptions?{query}", service_role=True
    )
    response.raise_for_status()
    return response.json()


async def subscribe(user_id: str, code: str) -> dict[str, Any]:
    """사용자 구독 추가. 이미 구독 중이면 멱등 성공. loaded=false면 상태만 반환(ingest는 별도 호출)."""
    supabase = SupabaseRestClient()

    # 1) 카탈로그에 존재하는 code인지 확인
    catalog_resp = await supabase.get(
        f"law_catalog?code=eq.{code}&select=code,api_title,loaded"
    )
    catalog_resp.raise_for_status()
    catalog_rows = catalog_resp.json()
    if not catalog_rows:
        raise ValueError(f"unknown law code: {code}")

    catalog = catalog_rows[0]

    # 2) 구독 레코드 생성 (멱등)
    sub_resp = await supabase.post(
        "user_law_subscriptions",
        json_body={"user_id": user_id, "code": code},
        service_role=True,
        prefer="resolution=ignore-duplicates,return=minimal",
    )
    if sub_resp.status_code not in {200, 201, 204}:
        raise RuntimeError(
            f"subscribe failed status={sub_resp.status_code}: {sub_resp.text[:200]}"
        )

    return {
        "code": code,
        "loaded": catalog["loaded"],
        "needs_ingestion": not catalog["loaded"],
    }


async def unsubscribe(user_id: str, code: str) -> None:
    """사용자 구독 해제. 법령 자체는 삭제하지 않음 (다른 사용자가 쓸 수 있음)."""
    supabase = SupabaseRestClient()
    response = await supabase.delete(
        f"user_law_subscriptions?user_id=eq.{user_id}&code=eq.{code}",
        service_role=True,
    )
    if response.status_code not in {200, 204}:
        raise RuntimeError(
            f"unsubscribe failed status={response.status_code}: {response.text[:200]}"
        )


async def ingest_law_on_demand(code: str) -> dict[str, int]:
    """카탈로그의 특정 법령을 법제처 API에서 조회→임베딩→statutes에 저장.

    이미 loaded=true면 NO-OP.
    반환: {"articles": N} 또는 {"articles": 0, "status": "already_loaded" | "not_found"}
    """
    supabase = SupabaseRestClient()
    # 최신 상태 확인
    resp = await supabase.get(f"law_catalog?code=eq.{code}&select=code,api_title,korean_name,loaded")
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        return {"articles": 0, "status": "not_found"}

    row = rows[0]
    if row["loaded"]:
        return {"articles": 0, "status": "already_loaded"}

    api_title = row["api_title"]
    korean_name = row["korean_name"]

    async with LawApiClient() as law_client:
        law_meta = await law_client.find_exact_current_law(api_title)
        if not law_meta:
            logger.warning("ingest: law not found for api_title=%s", api_title)
            return {"articles": 0, "status": "law_not_found"}

        detail = await law_client.get_current_law(mst=law_meta.get("법령일련번호"))
        statute_rows = normalize_statute_rows(detail, code, korean_name)

    if not statute_rows:
        logger.warning("ingest: no articles parsed for code=%s", code)
        return {"articles": 0, "status": "no_articles"}

    # 임베딩 생성
    await _attach_embeddings(statute_rows, "text")

    # statutes 테이블에 upsert
    # 먼저 statutes_code_check constraint 확장 필요 여부 체크 — 이 step은 수동으로 해야 함
    # (이미 등록된 code는 통과, 새 code는 CHECK에 없을 수 있음 → 실패 시 하드코딩된 27개만 정상)
    try:
        await _chunked_upsert(supabase, "statutes", statute_rows)
    except Exception as exc:
        logger.error("ingest: upsert failed for code=%s: %s", code, str(exc)[:200])
        # CHECK constraint 문제 가능성 — 카탈로그의 loaded는 false 유지
        return {"articles": 0, "status": "upsert_failed", "error": str(exc)[:200]}

    # 카탈로그 업데이트: loaded=true, article_count=N
    await supabase.patch(
        f"law_catalog?code=eq.{code}",
        json_body={"loaded": True, "article_count": len(statute_rows)},
        service_role=True,
    )

    logger.info("ingest: %d articles loaded for code=%s", len(statute_rows), code)
    return {"articles": len(statute_rows), "status": "loaded"}


async def get_install_status(code: str) -> dict[str, Any]:
    """특정 법령의 설치 상태 조회. 모바일 앱이 폴링용으로 사용."""
    supabase = SupabaseRestClient()
    resp = await supabase.get(
        f"law_catalog?code=eq.{code}&select=code,loaded,article_count"
    )
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        return {"code": code, "loaded": False, "status": "not_in_catalog"}
    return {
        "code": code,
        "loaded": rows[0]["loaded"],
        "article_count": rows[0].get("article_count"),
        "status": "ready" if rows[0]["loaded"] else "pending",
    }


async def get_user_subscription_codes(user_id: str) -> list[str]:
    """RAG 검색 필터용으로 사용자 구독 code 배열만 반환."""
    supabase = SupabaseRestClient()
    resp = await supabase.get(
        f"user_law_subscriptions?user_id=eq.{user_id}&select=code",
        service_role=True,
    )
    resp.raise_for_status()
    return [r["code"] for r in resp.json()]
