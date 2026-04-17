# LAW.OS 진행 요약

> 작성일: 2026-04-17
> 범위: 이번 세션까지 실제 구현/검증된 내용 요약

## 한 줄 요약

LAW.OS는 기존 Supabase Edge Function 중심 chat 경로에서 벗어나,
**모바일(Expo) + FastAPI 백엔드 + Supabase Cloud** 구조로 전환되었고,
현재는 **채팅, 검색, 조문/판례 상세, RAG seed, citation 저장, 인증 E2E 검증**까지 연결된 상태다.

---

## 이번까지 완료된 핵심 작업

### 1. 아키텍처 전환
- Supabase Edge Functions 기반 chat 디버깅에서 벗어나 **FastAPI 백엔드**를 도입
- Supabase는 계속 **Auth / DB / Storage 인프라**로 유지
- 모바일은 `EXPO_PUBLIC_API_BASE_URL`을 통해 FastAPI를 기본 경로로 사용
- 로컬 백엔드는 `http://127.0.0.1:8010` 기준으로 운영

### 2. FastAPI 백엔드 구축
- 주요 파일:
  - `apps/backend/app/main.py`
  - `apps/backend/app/auth.py`
  - `apps/backend/app/gemini.py`
  - `apps/backend/app/config.py`
- 활성 엔드포인트:
  - `GET /health`
  - `POST /chat`
  - `POST /search`
  - `POST /admin/rag/sync`
- 추가 기능:
  - request logging middleware
  - `X-Request-Id` 헤더 부여
  - `/chat accepted`, `/chat completed`, `/chat stream failed` 로깅

### 3. 공식 법령 API + RAG seed 파이프라인
- 국가법령정보센터 Open API 클라이언트 구현
  - `apps/backend/app/law_api.py`
- Supabase REST 공용 클라이언트 분리
  - `apps/backend/app/supabase_rest.py`
- core law / 판례 시드 적재 구현
  - `apps/backend/app/rag_data.py`
  - `apps/backend/scripts/sync_law_data.py`
- 실제 적재 결과:
  - `statutes`: 2782건
  - `cases`: 8건

### 4. LAW.OS 법령 MCP 서버 구현
- 파일:
  - `apps/backend/app/law_mcp_server.py`
- 제공 도구:
  - `search_current_laws`
  - `get_current_law_article`
  - `search_precedents`
  - `get_precedent_detail`
  - `seed_law_rag_data`

### 5. 채팅 경로 실연결
- 모바일 chat 흐름을 FastAPI 기준으로 연결
  - `mobile/lib/chat.ts`
  - `mobile/lib/conversations.ts`
  - `mobile/app/chat/new.tsx`
  - `mobile/app/chat/[id].tsx`
- 동작 방식:
  - user message 저장
  - `/chat` SSE 스트리밍
  - assistant message 저장
  - citations 저장
  - 대화 재조회 시 citations 카드 렌더링

### 6. RAG + citation 저장
- 파일:
  - `apps/backend/app/rag.py`
  - `apps/backend/app/chat_store.py`
- 구현 내용:
  - 질문 기반 조문/판례 retrieval
  - Gemini 시스템 프롬프트에 context 주입
  - assistant 응답 완료 후 `messages` 저장
  - citation 후보를 `citations` 테이블에 저장
- 모바일 표시:
  - `mobile/app/chat/[id].tsx`에서 citation 카드 렌더링
  - citation 클릭 시 조문/판례 상세로 이동

### 7. 검색 기능 확장
- 파일:
  - `apps/backend/app/search.py`
  - `mobile/lib/search.ts`
  - `mobile/app/(tabs)/search.tsx`
- 현재 지원:
  - `target: statute | case | all`
  - 조문 검색
  - 판례 검색
  - 혼합 검색
- write-back:
  - `search_history`
  - `search_analytics`

### 8. 조문/판례 상세 실데이터 연결
- 조문 상세:
  - `mobile/lib/statutes.ts`
  - `mobile/app/statute/[id].tsx`
- 판례 상세:
  - `mobile/lib/cases.ts`
  - `mobile/app/case/[id].tsx`
- 연결된 흐름:
  - 검색 결과 → 조문/판례 상세
  - 상세 화면 → `chat/new?seed=...`

---

## 실제 검증된 내용

### 정적 검증
- `python3 -m py_compile apps/backend/app/*.py apps/backend/scripts/*.py`
- `cd mobile && npm run typecheck`
- `GET http://127.0.0.1:8010/health`

### 데이터/검색 검증
- `run_search(query='민법 750조 불법행위', target='statute')` → `civil-750`
- `run_search(..., target='case')` → 판례 결과 반환
- `run_search(..., target='all')` → 조문 + 판례 혼합 결과 반환

### 인증된 E2E 검증
- 파일:
  - `apps/backend/scripts/verify_e2e.py`
- 검증 방식:
  - temp user 생성
  - 비밀번호 로그인
  - conversation 생성
  - `/search` 호출
  - `search_history` write-back 확인
  - `/chat` 호출
  - assistant message 저장 확인
  - citation 저장 확인
  - temp user 삭제
- 실제 검증 결과:
  - `/search` 성공
  - `search_history` 저장 확인
  - `/chat` 성공
  - assistant message 저장 확인
  - citation 5건 저장 확인

---

## 현재 상태 요약

### 완료
- FastAPI 백엔드 전환
- `/chat` SSE 스트리밍
- `/search` hybrid lexical 검색
- 공식 법령 API seed 파이프라인
- LAW.OS 법령 MCP 서버
- 조문/판례 상세 실데이터 연결
- assistant/citation 저장
- 인증된 E2E smoke 검증

### 진행 중
- citation UX 고도화
- vector/embedding hybrid 검색 도입
- rerank 개선

### 아직 미완료
- 대규모 전체 법령/판례 ingest
- citation modal / 고급 탐색 UX
- RevenueCat / OAuth / 출시 준비

---

## 다음 우선순위

1. citation modal / 상세 탐색 UX 고도화
2. embedding backfill 및 vector hybrid 검색 도입
3. rerank / retrieval 품질 개선
4. 전체 콘텐츠 시드 확대
5. OAuth / 페이월 / 출시 작업

---

## 참고 파일
- 현재 전체 상태: `docs/session-handoff.md`
- API 계약: `docs/api-spec.md`
- 기술 스택: `docs/tech-stack.md`
- RAG 설계: `docs/rag-pipeline.md`
- 백엔드 사용법: `apps/backend/README.md`

---

## 메모
이번 세션 기준으로 LAW.OS는 더 이상 “채팅 경로만 있는 스캐폴드”가 아니라,
**검색 → 상세 → 채팅 → citation 저장**까지 이어지는 학습 플로우를 실제로 가진 상태다.
다음 핵심 과제는 **검색 품질 고도화(vector/hybrid)** 와 **citation UX 개선**이다.
