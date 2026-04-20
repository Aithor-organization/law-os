from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import re
from typing import Any, Literal

from .supabase_rest import SupabaseRestClient

logger = logging.getLogger("law-os-backend.search")

# Used once per-process to skip repeated retries when the hybrid RPC or
# embedding generation is known to be unavailable (missing migration / quota).
_HYBRID_DISABLED: bool = False
_EMBEDDING_DISABLED: bool = False

_CODE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "civil": ("민법", "civil"),
    "criminal": ("형법", "criminal"),
    "constitutional": ("헌법", "constitutional"),
    "commercial": ("상법", "commercial"),
    # 교통
    "traffic": ("도로교통법",),
    "traffic_special": ("교통사고처리특례법", "교통사고처리 특례법", "교특법"),
    "special_aggravated": ("특정범죄가중처벌법", "특가법", "민식이법"),
    # Phase 1
    "civil_proc": ("민사소송법", "민소법"),
    "criminal_proc": ("형사소송법", "형소법"),
    "admin_basic": ("행정기본법",),
    "admin_proc": ("행정소송법",),
    "housing_rental": ("주택임대차보호법", "주임법"),
    "labor_standards": ("근로기준법", "근기법"),
    "privacy": ("개인정보보호법", "개인정보 보호법", "개인정보법"),
    # Phase 2
    "commercial_rental": ("상가건물임대차보호법", "상가건물 임대차보호법", "상임법"),
    "family_proc": ("가사소송법",),
    "info_network": ("정보통신망법", "정통망법"),
    "domestic_violence": ("가정폭력처벌특례법", "가정폭력범죄의 처벌", "가폭법"),
    "sexual_violence": ("성폭력처벌특례법", "성폭력범죄의 처벌", "성폭법"),
    "youth_protection": ("청소년보호법", "청소년 보호법"),
    "capital_market": ("자본시장법", "자본시장과 금융투자업"),
    "bankruptcy": ("채무자회생법", "채무자 회생", "도산법"),
    "medical": ("의료법",),
    # Phase 3
    "apartment_management": ("공동주택관리법", "층간소음"),
    "noise_control": ("소음진동관리법", "소음ㆍ진동관리법", "소음·진동관리법", "소음규제"),
    "school_violence": ("학교폭력예방법", "학교폭력예방 및 대책", "학폭법"),
    "juvenile": ("소년법", "촉법소년", "범죄소년"),
}

_CASE_CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "civil": ("민사", "civil", "민법"),
    "criminal": ("형사", "criminal", "형법"),
    "constitutional": ("헌법", "constitutional"),
    "admin": ("행정", "admin"),
    "tax": ("조세", "tax"),
}

_COURT_LABELS: dict[str, str] = {
    "supreme": "대법원",
    "constitutional": "헌법재판소",
    "high": "고등법원",
    "district": "지방법원",
}


@dataclass(frozen=True)
class StatuteSearchResult:
    id: str
    code: str
    code_kr: str
    article_no: str
    title: str | None
    text_preview: str
    score: float
    part: str | None
    chapter: str | None


@dataclass(frozen=True)
class CaseSearchResult:
    id: str
    case_no: str
    court: str
    decided_at: str
    category: str
    title: str | None
    text_preview: str
    score: float


@dataclass(frozen=True)
class SearchItem:
    id: str
    type: Literal["statute", "case"]
    title: str
    text_preview: str
    score: float
    code: str | None = None
    code_kr: str | None = None
    article_no: str | None = None
    part: str | None = None
    chapter: str | None = None
    case_no: str | None = None
    court: str | None = None
    decided_at: str | None = None
    category: str | None = None


@dataclass(frozen=True)
class SearchResponse:
    items: list[SearchItem]
    total: int
    effective_code: str | None
    effective_article: int | None
    target: Literal["statute", "case", "all"]
    mode: str


def _normalize_query(query: str) -> str:
    return " ".join(query.lower().strip().split())


def _extract_code(query: str) -> str | None:
    lowered = query.lower()
    for code, keywords in _CODE_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return code
    return None


def _extract_article(query: str) -> int | None:
    match = re.search(r"제\s*(\d+)\s*조", query)
    if match:
        return int(match.group(1))

    plain = re.findall(r"\d+", query)
    if len(plain) == 1:
        return int(plain[0])
    return None


def _extract_case_category(query: str) -> str | None:
    lowered = query.lower()
    for category, keywords in _CASE_CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return category
    return None


def _tokenize(query: str) -> list[str]:
    tokens = re.findall(r"[가-힣A-Za-z0-9]+", query.lower())
    seen: set[str] = set()
    ordered: list[str] = []
    for token in tokens:
        if token not in seen:
            seen.add(token)
            ordered.append(token)
    return ordered


def _text_preview(text: str, limit: int = 200) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact
    return f"{compact[:limit].rstrip()}…"


def _score_statute_row(
    row: dict[str, Any],
    *,
    normalized_query: str,
    tokens: list[str],
    code: str | None,
    article: int | None,
) -> float:
    title = (row.get("title") or "").lower()
    body = (row.get("body") or "").lower()
    article_no = (row.get("article_no") or "").lower()
    row_code = row.get("code")
    row_article = row.get("article_no_int")

    score = 0.05

    if code and row_code == code:
        score += 0.35
    if article is not None and row_article == article:
        score += 0.45

    if normalized_query and normalized_query in title:
        score += 0.22
    if normalized_query and normalized_query in body:
        score += 0.12

    for token in tokens:
        if token in title:
            score += 0.10
        if token in article_no:
            score += 0.12
        elif token in body:
            score += 0.04

    return round(min(score, 0.99), 3)


def _score_case_row(
    row: dict[str, Any],
    *,
    normalized_query: str,
    tokens: list[str],
    category: str | None,
) -> float:
    score = 0.05
    haystacks = [
        (row.get("case_no") or "").lower(),
        (row.get("summary") or "").lower(),
        (row.get("judgment_points") or "").lower(),
        (row.get("full_text") or "").lower(),
    ]

    if category and row.get("category") == category:
        score += 0.18

    for haystack in haystacks:
        if normalized_query and normalized_query in haystack:
            score += 0.2
        for token in tokens[:6]:
            if token in haystack:
                score += 0.06
    return round(min(score, 0.99), 3)


def _parse_total_from_content_range(content_range: str | None, fallback: int) -> int:
    if not content_range or "/" not in content_range:
        return fallback
    total = content_range.split("/")[-1]
    if total == "*":
        return fallback
    try:
        return int(total)
    except ValueError:
        return fallback


async def _embed_query_safe(text: str) -> list[float] | None:
    """Generate a Gemini embedding for the query. Returns None on any failure
    so the caller can fall back to lexical-only search without interrupting
    the user experience."""
    global _EMBEDDING_DISABLED
    if _EMBEDDING_DISABLED or not text.strip():
        return None

    # Lazy import to avoid a circular dependency (gemini -> http_client which
    # might be requested before app lifespan has initialized during tests).
    try:
        from .gemini import embed_text
    except Exception:  # noqa: BLE001
        _EMBEDDING_DISABLED = True
        return None

    try:
        return await embed_text(text)
    except Exception as exc:  # noqa: BLE001
        # Disable for the rest of the process — quota / auth / network errors
        # will otherwise keep firing on every query.
        logger.warning("query embedding disabled for this process: %s", exc)
        _EMBEDDING_DISABLED = True
        return None


async def _search_statutes_hybrid(
    *,
    normalized_query: str,
    tokens: list[str],
    code: str | None,
    article: int | None,
    limit: int,
) -> list[StatuteSearchResult] | None:
    """Attempt hybrid (lexical + vector) search via the
    hybrid_search_statutes RPC. Returns None to signal that the caller
    should fall back to pure lexical search."""
    global _HYBRID_DISABLED
    if _HYBRID_DISABLED:
        return None

    client = SupabaseRestClient()
    query_embedding = await _embed_query_safe(normalized_query)

    rpc_body: dict[str, Any] = {
        "p_query_text": normalized_query,
        "p_tokens": tokens,
        "p_query_embedding": query_embedding,
        "p_code": code,
        "p_article": article,
        "p_match_count": min(max(limit, 1), 20),
    }

    try:
        response = await client.rpc(
            "hybrid_search_statutes",
            json_body=rpc_body,
            service_role=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("hybrid_search_statutes RPC call failed: %s", exc)
        _HYBRID_DISABLED = True
        return None

    if response.status_code == 404 or (
        response.status_code == 400 and "hybrid_search_statutes" in response.text
    ):
        logger.warning(
            "hybrid_search_statutes RPC missing (apply 004_hybrid_search.sql); "
            "falling back to lexical-only search"
        )
        _HYBRID_DISABLED = True
        return None

    if response.status_code >= 400:
        logger.warning(
            "hybrid_search_statutes RPC error status=%s body=%s",
            response.status_code,
            response.text,
        )
        return None

    rows = response.json() or []
    max_score = max((row.get("rrf_score") or 0.0) for row in rows) if rows else 0.0
    normalizer = max_score if max_score > 0 else 1.0
    return [
        StatuteSearchResult(
            id=row["id"],
            code=row["code"],
            code_kr=row["code_kr"],
            article_no=row["article_no"],
            title=row.get("title"),
            text_preview=_text_preview(row.get("body") or ""),
            # Normalize RRF score to [0, 1] for UI parity with the lexical scorer.
            score=round(float(row.get("rrf_score") or 0.0) / normalizer, 3),
            part=row.get("part"),
            chapter=row.get("chapter"),
        )
        for row in rows
    ]


async def search_statutes(
    *,
    query: str,
    code: str | None = None,
    article: int | None = None,
    limit: int = 10,
) -> tuple[list[StatuteSearchResult], int, str | None, int | None]:
    normalized_query = _normalize_query(query)
    effective_code = code or _extract_code(normalized_query)
    effective_article = article if article is not None else _extract_article(normalized_query)
    tokens = _tokenize(normalized_query)

    hybrid_items = await _search_statutes_hybrid(
        normalized_query=normalized_query,
        tokens=tokens,
        code=effective_code,
        article=effective_article,
        limit=limit,
    )
    if hybrid_items is not None:
        return hybrid_items, len(hybrid_items), effective_code, effective_article

    client = SupabaseRestClient()
    params: dict[str, Any] = {
        "select": "id,code,code_kr,article_no,article_no_int,title,body,part,chapter",
        "limit": min(max(limit, 1), 20),
    }

    if effective_code:
        params["code"] = f"eq.{effective_code}"
    if effective_article is not None:
        params["article_no_int"] = f"eq.{effective_article}"

    if tokens and effective_article is None:
        or_conditions: list[str] = []
        for token in tokens[:5]:
            or_conditions.extend(
                [
                    f"title.ilike.*{token}*",
                    f"body.ilike.*{token}*",
                    f"article_no.ilike.*{token}*",
                ]
            )
        params["or"] = f"({','.join(or_conditions)})"

    response = await client.get("statutes", params=params, service_role=False)
    if response.status_code >= 400:
        raise RuntimeError(f"Supabase statutes search failed: {response.status_code} {response.text}")

    rows = response.json()
    scored_rows: list[tuple[float, dict[str, Any]]] = [
        (
            _score_statute_row(
                row,
                normalized_query=normalized_query,
                tokens=tokens,
                code=effective_code,
                article=effective_article,
            ),
            row,
        )
        for row in rows
    ]
    scored_rows.sort(
        key=lambda entry: (entry[0], -(entry[1].get("article_no_int") or 0)),
        reverse=True,
    )

    items = [
        StatuteSearchResult(
            id=row["id"],
            code=row["code"],
            code_kr=row["code_kr"],
            article_no=row["article_no"],
            title=row.get("title"),
            text_preview=_text_preview(row.get("body") or ""),
            score=score,
            part=row.get("part"),
            chapter=row.get("chapter"),
        )
        for score, row in scored_rows[:limit]
    ]

    total = _parse_total_from_content_range(response.headers.get("content-range"), len(items))
    return items, total, effective_code, effective_article


async def _search_cases_hybrid(
    *,
    normalized_query: str,
    tokens: list[str],
    category: str | None,
    limit: int,
) -> list[CaseSearchResult] | None:
    global _HYBRID_DISABLED
    if _HYBRID_DISABLED:
        return None

    client = SupabaseRestClient()
    query_embedding = await _embed_query_safe(normalized_query)

    rpc_body: dict[str, Any] = {
        "p_query_text": normalized_query,
        "p_tokens": tokens,
        "p_query_embedding": query_embedding,
        "p_category": category,
        "p_match_count": min(max(limit, 1), 20),
    }

    try:
        response = await client.rpc(
            "hybrid_search_cases",
            json_body=rpc_body,
            service_role=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("hybrid_search_cases RPC call failed: %s", exc)
        _HYBRID_DISABLED = True
        return None

    if response.status_code == 404 or (
        response.status_code == 400 and "hybrid_search_cases" in response.text
    ):
        logger.warning(
            "hybrid_search_cases RPC missing (apply 004_hybrid_search.sql); "
            "falling back to lexical-only search"
        )
        _HYBRID_DISABLED = True
        return None

    if response.status_code >= 400:
        logger.warning(
            "hybrid_search_cases RPC error status=%s body=%s",
            response.status_code,
            response.text,
        )
        return None

    rows = response.json() or []
    max_score = max((row.get("rrf_score") or 0.0) for row in rows) if rows else 0.0
    normalizer = max_score if max_score > 0 else 1.0
    return [
        CaseSearchResult(
            id=row["id"],
            case_no=row["case_no"],
            court=row["court"],
            decided_at=row["decided_at"],
            category=row["category"],
            title=row.get("judgment_points") or row.get("summary") or row["case_no"],
            text_preview=_text_preview(
                row.get("summary") or row.get("judgment_points") or ""
            ),
            score=round(float(row.get("rrf_score") or 0.0) / normalizer, 3),
        )
        for row in rows
    ]


async def search_cases(
    *,
    query: str,
    limit: int = 10,
) -> tuple[list[CaseSearchResult], int, str | None]:
    normalized_query = _normalize_query(query)
    tokens = _tokenize(normalized_query)
    effective_category = _extract_case_category(normalized_query)

    hybrid_items = await _search_cases_hybrid(
        normalized_query=normalized_query,
        tokens=tokens,
        category=effective_category,
        limit=limit,
    )
    if hybrid_items is not None:
        return hybrid_items, len(hybrid_items), effective_category

    client = SupabaseRestClient()
    params: dict[str, Any] = {
        "select": "id,case_no,court,decided_at,category,summary,judgment_points",
        "limit": min(max(limit * 3, 6), 60),
    }
    if effective_category:
        params["category"] = f"eq.{effective_category}"
    if tokens:
        or_conditions: list[str] = []
        for token in tokens[:5]:
            or_conditions.extend(
                [
                    f"case_no.ilike.*{token}*",
                    f"summary.ilike.*{token}*",
                    f"judgment_points.ilike.*{token}*",
                ]
            )
        params["or"] = f"({','.join(or_conditions)})"

    response = await client.get("cases", params=params, service_role=False)
    if response.status_code >= 400:
        raise RuntimeError(f"Supabase cases search failed: {response.status_code} {response.text}")

    rows = response.json()
    scored_rows: list[tuple[float, dict[str, Any]]] = [
        (
            _score_case_row(
                row,
                normalized_query=normalized_query,
                tokens=tokens,
                category=effective_category,
            ),
            row,
        )
        for row in rows
    ]
    scored_rows.sort(key=lambda entry: entry[0], reverse=True)

    items = [
        CaseSearchResult(
            id=row["id"],
            case_no=row["case_no"],
            court=row["court"],
            decided_at=row["decided_at"],
            category=row["category"],
            title=row.get("judgment_points") or row.get("summary") or row["case_no"],
            text_preview=_text_preview(
                row.get("summary") or row.get("judgment_points") or ""
            ),
            score=score,
        )
        for score, row in scored_rows[:limit]
    ]

    total = _parse_total_from_content_range(response.headers.get("content-range"), len(items))
    return items, total, effective_category


async def run_search(
    *,
    query: str,
    target: Literal["statute", "case", "all"] = "statute",
    code: str | None = None,
    article: int | None = None,
    limit: int = 10,
) -> SearchResponse:
    statutes: list[StatuteSearchResult] = []
    statute_total = 0
    effective_code = None
    effective_article = None
    cases: list[CaseSearchResult] = []
    case_total = 0

    per_target_limit = min(max(limit, 1), 20)
    if target in {"statute", "all"}:
        statutes, statute_total, effective_code, effective_article = await search_statutes(
            query=query,
            code=code,
            article=article,
            limit=per_target_limit,
        )
    if target in {"case", "all"}:
        cases, case_total, _ = await search_cases(query=query, limit=per_target_limit)

    items: list[SearchItem] = []
    if target == "statute":
        items = [
            SearchItem(
                id=item.id,
                type="statute",
                title=item.title or f"{item.code_kr} {item.article_no}",
                text_preview=item.text_preview,
                score=item.score,
                code=item.code,
                code_kr=item.code_kr,
                article_no=item.article_no,
                part=item.part,
                chapter=item.chapter,
            )
            for item in statutes
        ]
    elif target == "case":
        items = [
            SearchItem(
                id=item.id,
                type="case",
                title=item.case_no,
                text_preview=item.text_preview,
                score=item.score,
                case_no=item.case_no,
                court=item.court,
                decided_at=item.decided_at,
                category=item.category,
            )
            for item in cases
        ]
    else:
        statute_items = [
            SearchItem(
                id=item.id,
                type="statute",
                title=item.title or f"{item.code_kr} {item.article_no}",
                text_preview=item.text_preview,
                score=item.score,
                code=item.code,
                code_kr=item.code_kr,
                article_no=item.article_no,
                part=item.part,
                chapter=item.chapter,
            )
            for item in statutes
        ]
        case_items = [
            SearchItem(
                id=item.id,
                type="case",
                title=item.case_no,
                text_preview=item.text_preview,
                score=item.score,
                case_no=item.case_no,
                court=item.court,
                decided_at=item.decided_at,
                category=item.category,
            )
            for item in cases
        ]
        items = sorted(statute_items + case_items, key=lambda item: item.score, reverse=True)[:per_target_limit]

    return SearchResponse(
        items=items,
        total=statute_total + case_total if target == "all" else statute_total if target == "statute" else case_total,
        effective_code=effective_code,
        effective_article=effective_article,
        target=target,
        mode="hybrid-lexical",
    )


async def log_search_activity(
    *,
    user_id: str,
    query: str,
    result_count: int,
    category: str | None,
    result_type: Literal["statute", "case", "all"] = "statute",
) -> None:
    client = SupabaseRestClient()
    if not client.service_role_key:
        logger.warning("search activity skipped: SUPABASE_SERVICE_ROLE_KEY missing")
        return

    normalized_query = _normalize_query(query)
    category_value = category or result_type
    now = datetime.now(timezone.utc).isoformat()

    history_response = await client.post(
        "search_history",
        json_body={
            "user_id": user_id,
            "query": query,
            "result_type": result_type,
            "result_count": result_count,
            "searched_at": now,
        },
        service_role=True,
    )
    if history_response.status_code >= 400:
        logger.warning(
            "search_history insert failed status=%s body=%s",
            history_response.status_code,
            history_response.text,
        )

    rpc_response = await client.rpc(
        "upsert_search_analytics",
        json_body={
            "p_query": query,
            "p_normalized_query": normalized_query,
            "p_category": category_value,
            "p_now": now,
        },
        service_role=True,
    )
    if rpc_response.status_code >= 400:
        logger.warning(
            "search_analytics upsert RPC failed status=%s body=%s (apply 003_atomic_counters.sql)",
            rpc_response.status_code,
            rpc_response.text,
        )
