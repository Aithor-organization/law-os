"""법제처 open API에서 현행 법률 전체 목록을 긁어 law_catalog 테이블에 upsert.

실행:
  python scripts/seed_law_catalog.py             # 전체 크롤링 (수분 소요)
  python scripts/seed_law_catalog.py --limit 100 # 테스트용 제한

주의: 이미 loaded=true인 법령은 덮어쓰지 않음 (기존 27개 보호).
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.http_client import build_client, set_client
from app.law_api import LawApiClient
from app.supabase_rest import SupabaseRestClient


# 법령명에서 "시행령", "시행규칙" 등 하위법을 걸러내는 필터
_SUBORDINATE_PATTERNS = ["시행령", "시행규칙", "시행세칙", "시행준칙"]


def is_primary_law(title: str) -> bool:
    """법률 본문만 True. 시행령/시행규칙 제외."""
    if not title:
        return False
    return not any(p in title for p in _SUBORDINATE_PATTERNS)


def derive_category(title: str) -> str:
    """법령명 키워드로 카테고리 자동 분류."""
    t = title
    # 경직된 키워드 매칭 — 나중에 관리자가 보정 가능
    if any(k in t for k in ("민법", "상법", "헌법", "형법", "민사소송", "형사소송")):
        return "기본"
    if any(k in t for k in ("부동산", "주택", "임대차", "건축", "주거", "공동주택", "토지", "등기")):
        return "부동산"
    if any(k in t for k in ("근로", "노동조합", "산업안전", "고용", "퇴직급여", "임금")):
        return "노동"
    if any(k in t for k in ("가사", "가족관계", "혼인", "친양자", "양육", "상속", "유언")):
        return "가족"
    if any(k in t for k in ("도로교통", "교통안전", "자동차", "운수", "해사")):
        return "교통"
    if any(k in t for k in ("세", "국세", "지방세", "관세", "소득세", "법인세", "부가가치세")):
        return "세금"
    if any(k in t for k in ("저작권", "특허", "상표", "디자인", "부정경쟁", "영업비밀")):
        return "지재권"
    if any(k in t for k in ("정보통신", "개인정보", "전자서명", "전자상거래")):
        return "정보통신"
    if any(k in t for k in ("환경", "폐기물", "소음", "대기", "수질", "자연공원")):
        return "환경"
    if any(k in t for k in ("의료", "약사", "간호", "응급의료", "보건의료")):
        return "의료"
    if any(k in t for k in ("성폭력", "가정폭력", "아동학대", "스토킹", "아동복지", "장애인")):
        return "특례"
    if any(k in t for k in ("청소년", "학교폭력", "학교", "교육", "학원")):
        return "교육"
    if any(k in t for k in ("공정거래", "하도급", "표시광고", "소비자", "약관", "할부거래")):
        return "경제"
    if any(k in t for k in ("자본시장", "금융", "보험업", "상호저축", "여신전문")):
        return "금융"
    if any(k in t for k in ("파산", "회생", "개인회생", "도산")):
        return "도산"
    if any(k in t for k in ("행정", "국가공무원", "지방공무원", "경찰")):
        return "행정"
    if any(k in t for k in ("출입국", "국적", "재외", "병역")):
        return "국적병역"
    return "기타"


def derive_code(title: str) -> str:
    """법령명에서 안정적인 snake_case code 생성.

    예: "저작권법" → "copyright"
        "환경분쟁 조정법" → "envir_dispute_adjust"  (단순화)
    실제로는 korean_name 해시를 쓰지 않고, 매핑 테이블 또는 고정 규칙이 필요하지만,
    여기서는 MVP로 korean_name 원본을 code 컬럼에 그대로 두되 DB 저장 가능하도록
    공백 제거만 수행. 영문 code는 나중에 Phase 2에서 RPC 호환용으로 수동 매핑.
    """
    # 공백/특수문자 제거
    cleaned = re.sub(r"[^가-힣A-Za-z0-9]", "", title)
    return cleaned[:80]  # code column 길이 제한


async def seed_catalog(limit: int | None = None, dry_run: bool = False) -> dict:
    """법제처 API에서 법률 목록을 페이지네이션으로 수집 후 upsert."""
    client = build_client()
    set_client(client)
    supabase = SupabaseRestClient()

    seen_codes: set[str] = set()
    new_count = 0
    skip_count = 0
    page = 1

    try:
        async with LawApiClient() as law_client:
            while True:
                # 한 페이지당 100개씩 가져옴 (법제처 API max)
                results = await law_client.search_current_laws(
                    query="*", display=100, page=page
                )
                if not results:
                    break

                # 1차: 법률 본문만 필터 (시행령/규칙 제외)
                primary = [r for r in results if is_primary_law(r.get("법령명한글", ""))]

                batch_rows = []
                for law in primary:
                    api_title = law.get("법령명한글", "").strip()
                    if not api_title:
                        continue
                    code = derive_code(api_title)
                    if not code or code in seen_codes:
                        continue
                    seen_codes.add(code)

                    batch_rows.append({
                        "code": code,
                        "korean_name": api_title,
                        "api_title": api_title,
                        "category": derive_category(api_title),
                        "is_default": False,  # 신규 크롤링분은 opt-in
                        "loaded": False,       # 조문은 구독 시 lazy-load
                        # description은 나중에 수동 보정
                    })

                if batch_rows and not dry_run:
                    # loaded=true인 기존 레코드는 보호: on_conflict에서 loaded 컬럼 제외
                    response = await supabase.post(
                        "law_catalog?on_conflict=code",
                        json_body=batch_rows,
                        service_role=True,
                        prefer="resolution=ignore-duplicates",  # 기존 레코드 유지
                    )
                    if response.status_code in {200, 201, 204}:
                        new_count += len(batch_rows)
                    else:
                        print(f"  ⚠️  batch upsert status={response.status_code}: {response.text[:200]}")

                print(f"  page {page}: found {len(results)}, primary {len(primary)}, "
                      f"new candidates {len(batch_rows)} (seen: {len(seen_codes)})")

                if len(results) < 100:
                    break  # 마지막 페이지
                if limit and len(seen_codes) >= limit:
                    break

                page += 1

    finally:
        set_client(None)
        await client.aclose()

    return {
        "total_unique_laws": len(seen_codes),
        "inserted_or_updated": new_count,
        "skipped_duplicates": skip_count,
        "pages_scanned": page,
        "dry_run": dry_run,
    }


async def main():
    parser = argparse.ArgumentParser(description="법령 카탈로그 시드")
    parser.add_argument("--limit", type=int, help="총 법령 수 제한 (테스트용)")
    parser.add_argument("--dry-run", action="store_true", help="DB 변경 없이 미리보기")
    args = parser.parse_args()

    print(f"🌱 법령 카탈로그 시드 시작 (limit={args.limit}, dry_run={args.dry_run})")
    result = await seed_catalog(limit=args.limit, dry_run=args.dry_run)
    print("\n✅ 완료")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
