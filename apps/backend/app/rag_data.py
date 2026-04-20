from __future__ import annotations

import asyncio
import hashlib
import re
from datetime import datetime, timezone
from typing import Any

from .gemini import embed_text
from .law_api import LawApiClient, normalize_whitespace
from .supabase_rest import SupabaseRestClient

# Cap concurrent embedding calls so we don't exhaust Gemini's per-minute quota.
_EMBED_CONCURRENCY = 8

# Batch size for upserting rows with embeddings. A 3072-dim embedding serializes
# to ~50KB of JSON per row; 200 rows ≈ 10MB payload which Supabase and the 60s
# timeout handle comfortably. Without chunking, 2782 statutes × 50KB = ~140MB
# payload that times out during PostgREST ingestion.
_UPSERT_CHUNK_SIZE = 200

CORE_LAWS: dict[str, str] = {
    "civil": "민법",
    "criminal": "형법",
    "constitutional": "헌법",
    "commercial": "상법",
    "traffic": "도로교통법",
    "traffic_special": "교통사고처리특례법",
    "special_aggravated": "특정범죄가중처벌법",
}

# 일부 법령은 법령정보센터 API가 사용하는 공식 명칭이 CORE_LAWS의 단축 명과 다르다.
# 예: 헌법 → "대한민국헌법"으로 find_exact_current_law를 호출해야 매칭된다.
# 저장할 때는 원래 단축 명을 code_kr로 유지해서 UI 표시에 영향을 주지 않는다.
_LAW_API_TITLE_OVERRIDE: dict[str, str] = {
    "constitutional": "대한민국헌법",
    "traffic_special": "교통사고처리 특례법",
    "special_aggravated": "특정범죄 가중처벌 등에 관한 법률",
}

PRECEDENT_SEED_QUERIES: dict[str, list[str]] = {
    "civil": [
        "불법행위", "계약해제", "채무불이행", "손해배상", "매매", "임대차",
        "소유권", "전세권", "저당권", "보증", "변제", "상계",
        "소멸시효", "대리", "부당이득", "이혼", "상속", "유언",
    ],
    "criminal": [
        "정당방위", "과실범", "살인", "상해", "사기", "횡령",
        "배임", "문서위조", "공무집행방해", "뇌물", "위증", "명예훼손",
        "강간", "강제추행", "마약", "미수범", "공범",
    ],
    "constitutional": [
        "기본권 제한", "평등원칙", "비례원칙", "적법절차",
        "표현의 자유", "재산권", "행복추구권", "인간의 존엄",
        "국가배상", "위헌법률심판", "헌법소원",
    ],
    "commercial": [
        "주주총회", "이사의 책임", "회사 설립", "합병",
        "주식양도", "배당", "대표이사", "정관",
        "상법상 상행위", "보험", "어음", "수표", "영업양도",
    ],
    "traffic": [
        "신호위반", "음주운전", "무면허운전", "안전운전 의무", "과속",
        "보행자 보호", "어린이보호구역", "스쿨존", "주정차", "중앙선 침범",
        "안전거리", "운전자 준수사항", "사고 후 조치",
    ],
    "traffic_special": [
        "교통사고", "교특법", "중상해", "종합보험", "처벌특례",
        "보행자 보호의무", "12대 중과실", "어린이보호구역 치상",
    ],
    "special_aggravated": [
        "위험운전치사상", "도주차량", "뺑소니", "어린이 치사상",
        "어린이보호구역 치사", "민식이법", "특가법 제5조의13",
        "특가법 제5조의11", "음주운전 치사",
    ],
}

CASE_CATEGORY_MAP = {
    "민사": "civil",
    "형사": "criminal",
    "헌법": "constitutional",
    "행정": "admin",
    "조세": "tax",
}

COURT_MAP = {
    "대법원": "supreme",
    "헌법재판소": "constitutional",
}


def _ensure_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"[^0-9]", "", value)
    if len(cleaned) != 8:
        return None
    return f"{cleaned[:4]}-{cleaned[4:6]}-{cleaned[6:8]}"


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _article_label(article_no: int, article_sub_no: int) -> str:
    if article_sub_no > 0:
        return f"제{article_no}조의{article_sub_no}"
    return f"제{article_no}조"


def _article_id(code: str, article_no: int, article_sub_no: int) -> str:
    if article_sub_no > 0:
        return f"{code}-{article_no}-{article_sub_no}"
    return f"{code}-{article_no}"


def _normalize_article_body(body: str, label: str, title: str | None) -> str:
    prefix = label
    if title:
        prefix = f"{label}({title})"
    normalized = body.strip()
    if normalized.startswith(prefix):
        normalized = normalized[len(prefix) :].strip()
    return normalized or body.strip()


def normalize_statute_rows(detail: dict[str, Any], code: str, code_kr: str) -> list[dict[str, Any]]:
    base_info = detail.get("기본정보", {})
    effective_from = _parse_date(base_info.get("시행일자"))
    article_units = _ensure_list(detail.get("조문", {}).get("조문단위"))
    rows: list[dict[str, Any]] = []

    for unit in article_units:
        if unit.get("조문여부") != "조문":
            continue
        article_no = int(unit.get("조문번호") or 0)
        article_sub_no = int(unit.get("조문가지번호") or 0)
        if article_no <= 0:
            continue

        title = normalize_whitespace(unit.get("조문제목")) or None
        body = _normalize_article_body(
            normalize_whitespace(unit.get("조문내용")),
            _article_label(article_no, article_sub_no),
            title,
        )
        if not body:
            continue

        rows.append(
            {
                "id": _article_id(code, article_no, article_sub_no),
                "code": code,
                "code_kr": code_kr,
                "article_no": _article_label(article_no, article_sub_no),
                "article_no_int": article_no,
                "title": title,
                "body": body,
                "text_hash": _hash_text(body),
                "part": None,
                "chapter": None,
                "effective_from": effective_from,
            }
        )

    return rows


def normalize_precedent_row(detail: dict[str, Any]) -> dict[str, Any] | None:
    precedent_id = detail.get("판례정보일련번호")
    case_no = normalize_whitespace(detail.get("사건번호"))
    if not precedent_id or not case_no:
        return None

    court_name = normalize_whitespace(detail.get("법원명"))
    court = COURT_MAP.get(court_name, "high" if "고등" in court_name else "district")
    category = CASE_CATEGORY_MAP.get(normalize_whitespace(detail.get("사건종류명")), "civil")
    summary = normalize_whitespace(detail.get("판결요지"))
    judgment_points = normalize_whitespace(detail.get("판시사항"))
    full_text = normalize_whitespace(detail.get("판례내용"))

    # Extract related statutes from all available text fields. 참조조문 is the
    # authoritative source but many precedents leave it empty, so we fall back
    # to prose fields that cite statutes by name (e.g., "민법 제750조").
    combined_reference = "\n".join(
        filter(
            None,
            [
                normalize_whitespace(detail.get("참조조문")),
                summary,
                judgment_points,
            ],
        )
    )
    related_statute_ids = extract_related_statute_ids(combined_reference)

    return {
        "id": f"prec-{precedent_id}",
        "case_no": case_no,
        "court": court,
        "decided_at": _parse_date(detail.get("선고일자")) or datetime.now(timezone.utc).date().isoformat(),
        "category": category,
        "summary": summary or None,
        "judgment_points": judgment_points or None,
        "full_text": full_text or None,
        "related_statute_ids": related_statute_ids,
    }


def extract_related_statute_ids(reference_text: str | None) -> list[str]:
    normalized = normalize_whitespace(reference_text)
    related: list[str] = []
    for code, code_kr in CORE_LAWS.items():
        pattern = re.compile(rf"{re.escape(code_kr)}\s*제\s*(\d+)\s*조(?:의\s*(\d+))?")
        for match in pattern.finditer(normalized):
            article_no = int(match.group(1))
            article_sub_no = int(match.group(2) or 0)
            statute_id = _article_id(code, article_no, article_sub_no)
            if statute_id not in related:
                related.append(statute_id)
    return related


async def _attach_embeddings(rows: list[dict[str, Any]], text_key: str) -> None:
    """Attach Gemini embeddings to rows in place. Rows that fail to embed
    (quota exhausted, malformed response, etc.) are left without an
    `embedding` key so the caller can still upsert the text row."""
    import logging
    logger = logging.getLogger("law-os-backend.rag-data")
    semaphore = asyncio.Semaphore(_EMBED_CONCURRENCY)
    failures: list[str] = []

    async def _embed_row(row: dict[str, Any]) -> None:
        source = row.get(text_key) or ""
        if not source:
            return
        async with semaphore:
            try:
                row["embedding"] = await embed_text(source)
            except Exception as exc:  # noqa: BLE001
                failures.append(str(row.get("id") or "?"))
                logger.warning(
                    "embed failed for row id=%s: %s", row.get("id"), str(exc)[:200]
                )

    await asyncio.gather(*(_embed_row(row) for row in rows))
    if failures:
        logger.warning(
            "embed partial failure: %d/%d rows skipped embedding (first ids: %s)",
            len(failures), len(rows), failures[:5],
        )


async def _chunked_upsert(
    supabase: SupabaseRestClient,
    path: str,
    rows: list[dict[str, Any]],
    *,
    chunk_size: int = _UPSERT_CHUNK_SIZE,
    prefer: str = "resolution=merge-duplicates",
    on_conflict: str | None = None,
) -> None:
    """Upsert rows to Supabase in chunks. Each chunk is posted sequentially.
    ``on_conflict`` sets the PostgREST on_conflict query param when the target
    table has a non-primary unique constraint that should drive upsert
    resolution (e.g., ``cases.case_no``)."""
    import logging
    logger = logging.getLogger("law-os-backend.rag-data")
    suffix = f"?on_conflict={on_conflict}" if on_conflict else ""
    for offset in range(0, len(rows), chunk_size):
        chunk = rows[offset:offset + chunk_size]
        response = await supabase.post(
            f"{path}{suffix}",
            json_body=chunk,
            service_role=True,
            prefer=prefer,
        )
        # Success codes that require no action:
        #   200/201/204 — upsert succeeded
        #   409 — duplicate on a non-resolved unique constraint; surface so we
        #         can see how many rows were rejected
        if response.status_code == 409:
            logger.warning(
                "chunk upsert hit 409 on %s (offset=%d, size=%d): %s",
                path, offset, len(chunk), response.text[:200],
            )
            continue
        if response.status_code not in {200, 201, 204}:
            logger.error(
                "chunk upsert failed on %s (offset=%d, size=%d, status=%d): %s",
                path, offset, len(chunk), response.status_code, response.text[:500],
            )
            response.raise_for_status()


async def sync_core_statutes(*, embed: bool = False) -> dict[str, int]:
    async with LawApiClient() as law_client:
        supabase = SupabaseRestClient()
        total_rows = 0
        for code, title in CORE_LAWS.items():
            api_title = _LAW_API_TITLE_OVERRIDE.get(code, title)
            match = await law_client.find_exact_current_law(api_title)
            if not match:
                continue
            detail = await law_client.get_current_law(law_id=match.get("법령ID"))
            rows = normalize_statute_rows(detail, code, title)
            if embed:
                await _attach_embeddings(rows, text_key="body")
            await _chunked_upsert(supabase, "statutes", rows)
            total_rows += len(rows)
        return {"statutes": total_rows}


async def sync_seed_precedents(*, per_query_limit: int = 5, embed: bool = False) -> dict[str, int]:
    async with LawApiClient() as law_client:
        supabase = SupabaseRestClient()
        precedent_rows: dict[str, dict[str, Any]] = {}
        for queries in PRECEDENT_SEED_QUERIES.values():
            for query in queries:
                results = await law_client.search_precedents(query=query, display=per_query_limit)
                for item in results[:per_query_limit]:
                    detail = await law_client.get_precedent(item.get("판례일련번호"))
                    normalized = normalize_precedent_row(detail)
                    if not normalized:
                        continue
                    precedent_rows[normalized["id"]] = normalized

        rows = list(precedent_rows.values())
        if embed:
            for row in rows:
                row["_embed_source"] = (
                    row.get("summary")
                    or row.get("judgment_points")
                    or row.get("full_text")
                    or row["case_no"]
                )
            await _attach_embeddings(rows, text_key="_embed_source")
            for row in rows:
                row.pop("_embed_source", None)

        # Dedupe by case_no — some 판례일련번호들이 같은 사건번호(예: 원심과 상고심)를
        # 공유해서 DB의 UNIQUE(case_no) 제약에 걸리므로 client-side에서 먼저 제거한다.
        deduped_rows: list[dict[str, Any]] = []
        seen_case_nos: set[str] = set()
        for row in rows:
            case_no = row.get("case_no")
            if not case_no or case_no in seen_case_nos:
                continue
            seen_case_nos.add(case_no)
            deduped_rows.append(row)
        rows = deduped_rows

        if rows:
            # Resolve upsert conflicts on case_no (the business unique key),
            # not the primary key — different 판례일련번호 can map to the same
            # case_no and we want the newer row to win.
            await _chunked_upsert(supabase, "cases", rows, on_conflict="case_no")

            links: list[dict[str, Any]] = []
            for row in rows:
                for statute_id in row.get("related_statute_ids", []):
                    links.append(
                        {
                            "statute_id": statute_id,
                            "case_id": row["id"],
                            "relevance_score": 0.8,
                        }
                    )
            if links:
                await _chunked_upsert(supabase, "statute_case_links", links)

        return {"cases": len(rows)}
