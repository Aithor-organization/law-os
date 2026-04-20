from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from .search import CaseSearchResult, StatuteSearchResult, search_cases, search_statutes

logger = logging.getLogger("law-os-backend.rag")


@dataclass(frozen=True)
class CitationCandidate:
    source_type: str
    source_id: str
    label: str
    subtitle: str | None
    snippet: str
    score: float


def _format_statute_context(items: list[StatuteSearchResult]) -> list[str]:
    return [
        f"[조문] {item.code_kr} {item.article_no} {f'({item.title})' if item.title else ''}\n{item.text_preview}"
        for item in items
    ]


def _format_precedent_context(items: list[CaseSearchResult]) -> list[str]:
    return [
        f"[판례] {item.case_no} ({item.decided_at}, {item.court})\n{item.text_preview or '요약 없음'}"
        for item in items
    ]


def _statute_candidates(items: list[StatuteSearchResult]) -> list[CitationCandidate]:
    return [
        CitationCandidate(
            source_type="statute",
            source_id=item.id,
            label=f"{item.code_kr} {item.article_no}",
            subtitle=item.title,
            snippet=item.text_preview,
            score=item.score,
        )
        for item in items
    ]


def _precedent_candidates(items: list[CaseSearchResult]) -> list[CitationCandidate]:
    return [
        CitationCandidate(
            source_type="case",
            source_id=item.id,
            label=item.case_no,
            subtitle=f"{item.court} · {item.decided_at}",
            snippet=item.text_preview or "요약 없음",
            score=item.score,
        )
        for item in items
    ]


async def retrieve_rag_context(
    question: str,
    user_id: str | None = None,
) -> tuple[list[str], list[CitationCandidate], dict[str, int]]:
    """RAG 컨텍스트 조회. user_id가 주어지면 해당 사용자의 구독 법령만 검색 대상."""
    user_codes: list[str] | None = None
    if user_id:
        try:
            # circular import 회피를 위해 local import
            from .law_subscriptions import get_user_subscription_codes
            user_codes = await get_user_subscription_codes(user_id)
            # 구독이 0건이면 필터 해제 (전체 검색) — 신규 가입 직후 트리거 실패 대비
            if not user_codes:
                user_codes = None
        except Exception as exc:  # noqa: BLE001
            logger.warning("failed to fetch user subscriptions user_id=%s: %s", user_id, exc)
            user_codes = None

    statute_task = search_statutes(query=question, limit=4, codes=user_codes)
    case_task = search_cases(query=question, limit=4)
    (statutes, _, _, _), (precedents, _, _) = await asyncio.gather(statute_task, case_task)
    context_blocks = _format_statute_context(statutes) + _format_precedent_context(precedents)
    citations = _statute_candidates(statutes) + _precedent_candidates(precedents)
    return context_blocks, citations, {
        "statutes": len(statutes),
        "precedents": len(precedents),
    }
