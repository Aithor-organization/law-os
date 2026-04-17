# LAW.OS — Session Handoff

> **최종 업데이트**: 2026-04-15
> **용도**: 새 세션에서 이어서 작업할 수 있게 현재 진척도와 다음 단계를 정리한 문서.
> **읽는 순서**: 이 문서 한 편이면 전체 상태 파악 가능. 세부는 연결된 파일 참조.

---

## 🎯 프로젝트 한 줄 요약

**LAW.OS** — 한국 법학도를 위한 모바일 AI 법률 학습 튜터.
"법률 자문이 아닌 학습 도구"로 포지셔닝 (변호사법 109조 준수).

- 타겟: 로스쿨 재학생 · 변시 수험생 · 법학과 학부생
- 핵심 기능: 민법/형법/헌법/상법 조문·판례에 대한 Gemini 기반 AI 답변, 출처 포함
- 플랫폼: Expo SDK 52 (iOS + Android + Web)
- 디자인 시스템: Dark Academia Pro / Sovereign Terminal

---

## 📊 현재 진척도 (Phase별)

| Phase | 상태 | 설명 |
|-------|:----:|------|
| **Phase 0**: 기획/설계 | ✅ 완료 | PRD, feature-spec, data-model, api-spec, legal-ux, user-flow 등 docs 작성 |
| **Phase 0.5**: 디자인 (Stitch) | ✅ 완료 | 36개 P0 화면 Stitch에 생성, 참조 ID 매핑 완료 |
| **Phase 1a**: 모바일 UI 스캐폴딩 | ✅ 완료 | 33개 화면 실제 UI로 구현 (placeholder 전부 교체) |
| **Phase 1b**: Supabase DB | ✅ 완료 | `001_initial_schema.sql` 적용 완료 — 22개 테이블 + RLS 정책 + 트리거 |
| **Phase 1c**: 인증 연결 | ✅ 완료 | 가입/약관동의/온보딩/로그인/로그아웃 실제 Supabase Auth 연결 |
| **Phase 1d**: 샘플 조문 시드 | ⏳ **대기 중** | `002_sample_statutes.sql` 파일 생성됨, **적용 필요** |
| **Phase 2a**: 백엔드 스켈레톤 | ✅ 완료 | FastAPI `apps/backend/app/main.py` + `/chat` + Gemini 스트리밍 |
| **Phase 2b**: 모바일 채팅 실연결 | ✅ 완료 | `lib/conversations.ts`, `lib/chat.ts`, 채팅 3개 화면 실데이터 |
| **Phase 2c**: 백엔드 로컬 실행/검증 | ✅ 완료 | FastAPI healthcheck + chat 경로 로컬 검증 |
| **Phase 3**: RAG | ⏳ **진행 중** | 공식 법령 API seed 동기화 + seeded precedents + chat context 주입 + assistant/citation 저장 완료, 다음은 hybrid/vector 검색 |
| **Phase 4**: 나머지 화면 실데이터 | ⏳ 진행 중 | 검색 탭 hybrid 검색 + 조문 상세 + 판례 상세 실데이터 연결, 나머지 화면 후속 |
| **Phase 5**: 전체 콘텐츠 시드 | ❌ 미착수 | 12k 조문 + 2.3k 판례 (국가법령정보센터 API) |
| **Phase 6**: OAuth | ❌ 미착수 | Google → Apple → Kakao 순 |
| **Phase 7**: 페이월 / RevenueCat | ❌ 미착수 | |
| **Phase 8**: 출시 (EAS Build + 스토어) | ❌ 미착수 | |

---

## 🏗️ 아키텍처 (결정 완료)

### 모바일
- **Expo SDK 52** + expo-router + NativeWind v4 + TypeScript
- `law-os/mobile/` — 33개 화면, `lib/auth.ts`, `lib/supabase.ts`, `lib/conversations.ts`, `lib/chat.ts`, `lib/pendingSignup.ts`

### 백엔드
- **FastAPI (`apps/backend/`)** — chat-first migration 완료
- `law-os/apps/backend/app/` — `main.py`, `auth.py`, `gemini.py`, `config.py`, `law_api.py`, `rag.py`, `rag_data.py`, `law_mcp_server.py`, `chat_store.py`
- `law-os/apps/backend/scripts/verify_e2e.py` — temp user 기반 authenticated `/search` + `/chat` smoke verification
- 현재 활성 엔드포인트: `/health`, `/chat`, `/search`, `/admin/rag/sync`
- 예정 엔드포인트: `/note-export`, `/billing/webhook`, `/student-verify`, `/admin/moderate`
- **Supabase는 온라인 Auth/DB/Storage 인프라로 유지**
- `apps/api/` 의 Supabase Edge Functions는 **legacy migration target**

### 데이터
- **Supabase Postgres 15** + pgvector 0.7
- 프로젝트: `vufldymqdzzuhwplxexy.supabase.co` (Seoul region 가정)
- 22개 테이블: profiles, conversations, messages, citations, feedback, notes, subscriptions, usage_quotas, devices, student_verifications, statutes, cases, statute_case_links, user_favorites, search_history, search_analytics, study_activities, notification_preferences, notifications, note_exports, content_reports

### LLM (Gemini 전용)
| 용도 | 모델 | 환경변수 |
|------|------|---------|
| 일반 채팅 | `gemini-2.5-flash` | `GEMINI_MODEL_FLASH` |
| 복잡 추론 / Deep Debate | `gemini-2.5-pro` | `GEMINI_MODEL_PRO` |
| 임베딩 (RAG) | `gemini-embedding-001` (3072-dim) | `GEMINI_EMBEDDING_MODEL` |

> ⚠️ 모델 ID는 2025-05 기준. 2026-04-15 현재 Google AI Studio에서 최신 ID 확인 후 `.env.local`에서 교체.

### 랜딩페이지
- `law-os/landing-page/` — Next.js
- 대기자(waitlist) 섹션 **완전 제거** 완료 (Tally 링크, 버튼, JSON-LD)

---

## 📁 최근 생성/수정된 파일 인벤토리

### 이번 세션에서 **생성된** 파일

**백엔드 (`law-os/apps/api/`)**
```
apps/api/
├── .env.local.example           # 템플릿
├── .env.local                   # 키 대기 중 (gitignore)
├── .gitignore
├── deno.json
├── README.md
└── supabase/functions/
    ├── _shared/
    │   ├── cors.ts              # CORS 헤더
    │   ├── auth.ts              # Supabase JWT 검증
    │   └── gemini.ts            # Gemini REST 클라이언트 (chat + stream + embed)
    └── chat/
        └── index.ts             # POST /chat — SSE 스트리밍
```

**모바일 lib/ (신규)**
```
mobile/lib/
├── supabase.ts                  # Supabase client 초기화 (AsyncStorage + URL polyfill)
├── auth.ts                      # signUp/signIn/signOut/recordConsent/saveOnboarding
├── pendingSignup.ts             # 3화면 가입 플로우 상태 전달
├── conversations.ts             # Supabase 직통 CRUD (list/get/create/delete/touch)
└── chat.ts                      # Edge Function 호출 + SSE 파싱 + 메시지 저장
```

**모바일 env/config**
```
mobile/.env.local.example        # 템플릿
mobile/.env.local                # 키 채워짐 (EXPO_PUBLIC_SUPABASE_URL + ANON_KEY)
mobile/.gitignore                # .env* 패턴 추가
```

**docs/**
```
docs/supabase/001_initial_schema.sql    # 22 테이블 + RLS + 트리거 (Dashboard 적용 완료)
docs/supabase/002_sample_statutes.sql   # 민 6 + 형 3 + 헌 2 = 11 조문 (적용 대기)
docs/session-handoff.md                 # 이 문서
```

### 이번 세션에서 **수정된** 파일

**모바일 화면 (14개 placeholder → 실 UI)**
- `app/splash.tsx` — 1초 대기 + 세션 체크 분기
- `app/(auth)/login.tsx` — 실제 `signInWithPassword` + OAuth stub
- `app/(auth)/signup.tsx` — `pendingSignup` 저장 후 consent로 이동
- `app/(auth)/consent-disclaimer.tsx` — `signUp` + profiles consent 타임스탬프
- `app/(auth)/forgot-password.tsx` — 이메일 입력 + sent state
- `app/(auth)/onboarding.tsx` — 완료 시 profiles update + tabs 진입
- `app/modals/logout.tsx` — 실제 `signOut`
- `app/modals/blocked.tsx` — 변호사법 109조 안내 + 대한변협 연락처
- `app/modals/citation.tsx`, `export.tsx`, `purchase-success.tsx`, `purchase-fail.tsx`, `save-note.tsx` — 전부 실 UI
- `app/profile/legal.tsx`, `subscription.tsx`, `settings.tsx` — 전부 실 UI
- `app/chat/new.tsx` — 실 `createConversation` 후 `/chat/[id]`로 이동, `seed` query prefill 지원
- `app/chat/[id].tsx` — mock 제거 → 실 메시지 로드 + 스트리밍 버퍼 + 모드 토글 + citation 카드 렌더링
- `app/(tabs)/index.tsx` — 하드코딩 → `listConversations` + pull-to-refresh + focus 갱신
- `app/(tabs)/search.tsx` — mock 검색 화면 → FastAPI `/search` hybrid(statute/case/all) + recent/popular/trending 실데이터 연결
- `app/statute/[id].tsx` — mock 조문 상세 → Supabase public read 실데이터 연결

**docs**
- `docs/tech-stack.md` — Claude → Gemini, Cloudflare Workers → Supabase Edge Functions → FastAPI 방향으로 갱신
- `docs/api-spec.md` — FastAPI `/chat`, `/search` 기준으로 점진적 갱신

**랜딩페이지**
- `landing-page/app/page.tsx` — waitlist 섹션/버튼/링크 완전 제거
- `landing-page/app/layout.tsx` — JSON-LD `PreOrder` 유지

**프로젝트 설정**
- `mobile/package.json` — `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill` 추가
- `mobile/.npmrc` — `legacy-peer-deps=true`

---

## 🔐 환경 변수 / 크레덴셜 상태

### ✅ 채워진 것
`mobile/.env.local`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://vufldymqdzzuhwplxexy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XfSFOzx4jDsbqpRtZ6eFjw_Ai0FMT_X
```

### ✅ 채워진 것
`apps/backend/.env`:
```bash
SUPABASE_URL=...                  # mobile/.env.local과 동일 프로젝트
SUPABASE_ANON_KEY=...             # public anon key
SUPABASE_SERVICE_ROLE_KEY=...     # backend only
GEMINI_API_KEY=...                # 채워짐
GEMINI_MODEL_FLASH=...            # 최신 값 반영 가능
GEMINI_MODEL_PRO=...
GEMINI_EMBEDDING_MODEL=...
```

### ✅ 프론트 백엔드 연결
`mobile/.env.local`:
```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8010
```

### 🚫 건드리지 말 것
- `service_role` 키는 **절대** 모바일 앱/채팅/깃에 포함되면 안 됨 (RLS 우회 → 전체 DB 권한)
- 카카오/Apple/Google OAuth 키는 Phase 6에서 별도 설정

---

## 🗄️ Supabase Dashboard 상태

### ✅ 적용된 것
- 프로젝트 생성됨
- `001_initial_schema.sql` 적용됨 (22 테이블 + RLS + 트리거)

### ⏳ 대기 중인 것
- [ ] **Email Confirmation OFF** (Auth → Providers → Email → "Confirm email")
  - 개발 편의상 꺼야 함. 가입 즉시 onboarding 진입 가능.
  - 출시 전 반드시 다시 켜기.
- [ ] **URL Configuration** (Auth → URL Configuration)
  - Site URL: `http://localhost:8081` (개발)
  - Redirect URLs: `lawos://auth/callback` (OAuth 대비)
- [ ] **`002_sample_statutes.sql` 적용** — SQL Editor에서 복붙 후 Run
  - 11개 조문 row가 생겼는지 Table Editor → `statutes`에서 확인

---

## 🚀 다음 세션에서 이어서 할 일 (순서대로)

### ✅ Step 1 — 사용자 준비 (5-10분)

1. **Supabase Dashboard 설정**:
   - Email Confirmation OFF 확인
   - `docs/supabase/002_sample_statutes.sql` 복붙 → Run (11개 조문 확인)

2. **`apps/api/.env.local` 채우기**:
   - `LAWOS_SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Settings → API → Reveal)
   - `LAWOS_SUPABASE_ANON_KEY` (mobile/.env.local과 동일)
   - `LAWOS_SUPABASE_URL` (mobile/.env.local과 동일)
   - `GEMINI_API_KEY` (https://aistudio.google.com/apikey)

3. **Supabase CLI 설치** (없다면):
   ```bash
   brew install supabase/tap/supabase
   supabase --version
   ```

### ✅ Step 2 — Edge Function 로컬 실행 (Phase 2c 완료)

```bash
cd law-os/apps/api
supabase login                    # 브라우저 OAuth (처음 1회)
supabase link --project-ref vufldymqdzzuhwplxexy
supabase functions serve chat --env-file .env.local --no-verify-jwt
```

성공하면 `http://127.0.0.1:54321/functions/v1/chat`에 `/chat`이 떠 있음.

### ✅ Step 3 — 모바일 앱에서 edge base URL 오버라이드 (선택)

로컬 백엔드로 테스트하려면 `mobile/.env.local`에 추가:
```bash
EXPO_PUBLIC_EDGE_BASE_URL=http://127.0.0.1:54321/functions/v1
```

### ✅ Step 4 — 모바일 Expo 재시작 + 전체 플로우 테스트

```bash
cd law-os/mobile
# 기존 expo 프로세스 Ctrl+C
npm start
```

**테스트 시나리오**:
1. 로그인 (또는 신규 가입 → consent → onboarding → tabs)
2. 대화 탭 → `+` 버튼
3. "민법 제750조 불법행위의 성립 요건을 알려줘" 입력 → 질문 시작
4. `chat/[id]` 화면에서 Gemini 스트리밍 응답 관찰
5. 뒤로가기 → 대화 탭 상단에 방금 만든 대화 표시
6. 다시 들어가면 메시지가 DB에서 복원
7. Profile → Settings → 로그아웃 → 로그인 화면

**확인할 것**:
- Supabase Dashboard → Table Editor → `conversations`에 row 생김
- `messages`에 user + assistant 2개 row
- `profiles`의 consent timestamps 채워짐

### 🎯 Phase 3 시작 조건 (Step 2 ~ 4 모두 성공하면)

**Phase 3: RAG 본격**
1. `apps/api/`에 조문 임베딩 시드 스크립트 (`scripts/embed-statutes.ts`)
2. 11개 조문의 `embedding` 컬럼 채우기 (Gemini embed)
3. FastAPI `/search`를 lexical fallback → embedding hybrid 검색으로 업그레이드
4. FastAPI `/chat`에 RAG 주입 — 검색 결과를 시스템 프롬프트에 포함
5. citation 저장 결과를 기반으로 citation modal / 상세 탐색 UX 고도화
6. vector/embedding hybrid 검색 도입 및 rerank 개선

---

## 🐛 알려진 이슈 / 미확인 항목

| 이슈 | 심각도 | 대응 |
|------|:-----:|-----|
| Gemini `2.5-flash`/`2.5-pro` 모델 ID가 2026-04-15 기준 유효한지 [미확인] | 🟡 | 실행 시 404 나면 `.env.local`에서 최신 ID로 교체 |
| Gemini `embedding-001`이 3072-dim Matryoshka 지원 [추정] | 🟡 | Phase 3에서 `outputDimensionality: 3072` 실제 호출로 검증 |
| React Native 0.76에서 `ReadableStream.pipeThrough(TextDecoderStream)` 지원 [추정] | 🟡 | 스트리밍 안 되면 chat.ts 쪽에 폴리필 필요 |
| Edge Function Deno `esm.sh/@supabase/supabase-js` import [검증됨] | 🟢 | 표준 패턴 |
| npm audit 16건 vulnerability [미확인] | 🟢 | transitive 가능성 높음, Phase 7에서 정리 |
| Email confirmation on 상태에서 가입 시 consent 저장 skip되는 분기 [검증됨] | 🟢 | `consent-disclaimer.tsx`에 Alert로 안내하고 login으로 돌려보냄 |

---

## 🔑 중요 결정 기록

1. **A안 유지** — 학습 전용 앱. 개인 사건 자문 차단. B안(일반 법률정보+디스클레이머)은 변호사 검토 필요해서 보류.
2. **Gemini 단일 공급자** — OpenAI/Claude 사용 안 함. 모델 2개: Flash + Pro.
3. **Supabase Edge Functions** — Cloudflare Workers 대신. 계정 1개로 통합.
4. **Supabase 직통 아키텍처** — 30개 REST 엔드포인트 대부분은 Supabase client로 직접 해결. Edge Function은 6개만.
5. **Bundle ID / URL scheme 미확정** — `kr.lawos.mobile` / `lawos://` 제안됨, 사용자 확정 대기.
6. **Landing 대기자 폼 완전 삭제** — 출시 준비 중 정보 페이지로 전환.

---

## 📚 핵심 docs 레퍼런스

| 파일 | 용도 |
|------|------|
| `docs/prd.md` | 제품 요구사항 + 3개 페르소나 |
| `docs/feature-spec.md` | 기능 상세 스펙 |
| `docs/tech-stack.md` | 기술 스택 (Gemini + Supabase Edge Functions로 업데이트됨) |
| `docs/data-model.md` | Drizzle 스타일 스키마 정의 (SQL은 `docs/supabase/001...`) |
| `docs/api-spec.md` | API 계약 (v1.1 직통/Edge Functions 분리) |
| `docs/rag-pipeline.md` | RAG 설계 (Phase 3 시작 시 참고) |
| `docs/legal-ux.md` | 변호사법 109조 대응 UX + RegExp 차단 규칙 |
| `docs/user-flow.md` | 52개 화면 플로우 다이어그램 |
| `docs/supabase-setup.md` | Supabase 세팅 가이드 |
| `docs/session-handoff.md` | **이 문서** — 새 세션에서 먼저 읽기 |

---

## 💬 새 세션 시작할 때 첫 프롬프트 템플릿

```
law-os 프로젝트 작업을 이어서 하고 싶어.
@docs/session-handoff.md 를 먼저 읽고 현재 상태를 파악해줘.
그 다음 [다음 단계]부터 진행하면 돼.
```

여기서 `[다음 단계]`는 위 "다음 세션에서 이어서 할 일"의 Step 번호 중 해당되는 것.

예:
- "Step 4부터 — 이미 Gemini 키 넣고 edge function 실행했어"
- "Step 2부터 — 아직 env 키만 채웠어"
- "Phase 3 RAG 시작해줘 — 전체 플로우 테스트 완료했어"

---

## 📈 통계 (이번 세션 기준)

- 생성된 파일: 19개 (백엔드 8 + 모바일 lib 5 + 환경 3 + docs 3)
- 수정된 파일: 22개 (화면 17 + docs 3 + 설정 2)
- 설치된 npm 패키지: 3개 (@supabase/supabase-js, async-storage, url-polyfill)
- TypeScript 검증: 매 Phase마다 `tsc --noEmit` EXIT=0
- 아키텍처 변경: 2회 (Cloudflare→Edge Functions, Claude→Gemini)

---

**끝.** 이 문서는 살아있는 핸드오프 문서입니다. Phase 완료 시마다 업데이트하세요.
