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


@dataclass(frozen=True)
class LawRecommendation:
    """비구독 법령 설치 추천. RAG에서 구독 필터 없이 검색한 상위 결과 중
    사용자가 구독하지 않은 법령을 surfacing."""
    code: str
    korean_name: str
    reason: str  # 예: "사용자 질문과 94% 일치하는 조문이 이 법령에 있습니다"
    matched_article: str  # 예: "저작권법 제30조"
    score: float


# 추천 배너를 띄울 최소 점수 임계값 (RRF score, 실측 기반 조정 가능)
_RECOMMENDATION_MIN_SCORE = 0.015


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


async def _compute_recommendations(
    question: str,
    subscribed_codes: list[str] | None,
    top_subscribed_score: float,
) -> list[LawRecommendation]:
    """비구독 법령에서 더 관련성 높은 조문이 있으면 추천으로 surfacing.

    전략: 전체 DB 검색 → 구독하지 않은 code 중 점수가 임계값 이상이고
    구독 결과보다 명확히 높으면 추천. 기본 법령 외 domain이 매칭될 때만 의미가 있음.
    """
    # 구독 필터 없이 상위 5개 검색
    all_results, _, _, _ = await search_statutes(query=question, limit=5, codes=None)
    if not all_results:
        return []

    sub_set = set(subscribed_codes or [])
    recommendations: list[LawRecommendation] = []
    seen_codes: set[str] = set()

    for item in all_results:
        if item.code in sub_set or item.code in seen_codes:
            continue
        if item.score < _RECOMMENDATION_MIN_SCORE:
            continue
        # 구독 상위 결과보다 유의미하게 높을 때만 추천
        if top_subscribed_score > 0 and item.score <= top_subscribed_score * 1.1:
            continue
        seen_codes.add(item.code)
        recommendations.append(LawRecommendation(
            code=item.code,
            korean_name=item.code_kr or item.code,
            reason=f"이 질문과 관련된 조문이 {item.code_kr}에 있습니다",
            matched_article=f"{item.code_kr} {item.article_no}" if item.article_no else item.code_kr,
            score=item.score,
        ))
        if len(recommendations) >= 2:  # 최대 2개만 추천
            break

    return recommendations


async def retrieve_rag_context(
    question: str,
    user_id: str | None = None,
) -> tuple[list[str], list[CitationCandidate], dict[str, int], list[LawRecommendation]]:
    """RAG 컨텍스트 조회. user_id가 주어지면 해당 사용자의 구독 법령만 검색 대상.
    반환값 4번째: 비구독 법령 추천 (설치 배너용)."""
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

    # 추천 계산 (user_id가 있을 때만; 비로그인 사용자는 추천 불필요)
    recommendations: list[LawRecommendation] = []
    if user_id and user_codes:
        try:
            top_sub_score = statutes[0].score if statutes else 0.0
            recommendations = await _compute_recommendations(
                question, user_codes, top_sub_score
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("recommendation computation failed: %s", exc)

    return context_blocks, citations, {
        "statutes": len(statutes),
        "precedents": len(precedents),
        "recommendations": len(recommendations),
    }, recommendations
