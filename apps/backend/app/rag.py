from __future__ import annotations

import asyncio
from dataclasses import dataclass

from .search import CaseSearchResult, StatuteSearchResult, search_cases, search_statutes


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
) -> tuple[list[str], list[CitationCandidate], dict[str, int]]:
    statute_task = search_statutes(query=question, limit=4)
    case_task = search_cases(query=question, limit=4)
    (statutes, _, _, _), (precedents, _, _) = await asyncio.gather(statute_task, case_task)
    context_blocks = _format_statute_context(statutes) + _format_precedent_context(precedents)
    citations = _statute_candidates(statutes) + _precedent_candidates(precedents)
    return context_blocks, citations, {
        "statutes": len(statutes),
        "precedents": len(precedents),
    }
