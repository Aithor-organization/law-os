# LAW.OS — API Specification

> **Version**: 1.2 (revised 2026-04-16)
> **Architecture**: Frontend + FastAPI backend + Supabase Cloud
> **Auth**: Bearer JWT (Supabase Auth)
> **Content-Type**: `application/json`
> **Source of Truth**: `apps/backend/app/`

---

## 🏛️ 아키텍처 결정 (v1.2)

**기존(v1.0)**: 30개 REST 엔드포인트를 Hono+Cloudflare Workers로 제공  
**변경(v1.1)**: Supabase 직통 + Edge Functions 2-범주 모델  
**현재(v1.2)**: FastAPI backend + Supabase Cloud 인프라 모델

### 범주 A — 프론트엔드 직통 (단계적 유지)
현재 전환 기간에는 일부 CRUD가 여전히 `supabase-js` 직통으로 남아 있다.
장기적으로는 핵심 비즈니스 경로를 FastAPI 경유로 이전한다.

| 도메인 | 테이블 | 호출 예시 |
|--------|--------|----------|
| 프로필 | `profiles` | `supabase.from('profiles').select().eq('id', userId)` |
| 대화 목록/생성/삭제 | `conversations` | `supabase.from('conversations').insert(...)` |
| 메시지 저장/조회 | `messages` | `supabase.from('messages').select()` |
| 인용 | `citations` | 읽기만 (백엔드가 삽입) |
| 노트 CRUD | `notes` | 클라이언트 직접 |
| 즐겨찾기 | `user_favorites` | 클라이언트 직접 |
| 피드백 | `feedback` | `insert({ message_id, rating })` |
| 조문/판례 조회 | `statutes`, `cases` | public read (RLS: `using(true)`) |
| 검색 기록/활동 통계 | `search_history`, `study_activities` | 클라이언트 직접 |
| 알림 | `notifications` | 읽기/읽음 처리 |

**원칙**: 데이터가 유저 소유이고 RLS로 격리 가능하면 직통. Gemini 키·`service_role`가 필요하거나 외부 서비스와 통신해야 하면 Edge Function.

### 범주 B — FastAPI Backend (`apps/backend/app/`)
Gemini API 키, 서버 검증, 스트리밍, 향후 RAG/웹훅/내보내기 작업은 FastAPI로 처리한다.

| # | 엔드포인트 | 메서드 | 용도 | 상태 |
|---|-----------|--------|------|------|
| 1 | `/chat` | POST | Gemini 스트리밍 답변 + RAG + assistant/citation persistence | 🟡 1차 마이그레이션 완료 |
| 2 | `/search` | POST | 조문/판례/전체 hybrid lexical 검색 + 향후 vector retrieval 진입점 | 🟡 초기 구현 완료 |
| 3 | `/admin/rag/sync` | POST | 공식 법령 API → Supabase RAG seed 데이터 동기화 | 🟡 내부용 구현 완료 |
| 4 | `/note-export` | POST | Anki/PDF 생성 → Storage 업로드 | ❌ 미구현 |
| 5 | `/billing/webhook` | POST | RevenueCat webhook 처리 | ❌ 미구현 |
| 6 | `/student-verify` | POST | 학생증 검수 (관리자) | ❌ 미구현 |
| 7 | `/admin/moderate` | POST | content_reports 처리 | ❌ 미구현 |

#### 현재 FastAPI `/search` 요청/응답 (초기 구현)
```ts
// Request
{
  query: string;
  target?: "statute" | "case" | "all";
  code?: "civil" | "criminal" | "constitutional" | "commercial";
  article?: number;
  limit?: number; // 1..20
}

// Response 200
{
  items: Array<{
    id: string;
    type: "statute" | "case";
    title: string;
    textPreview: string;
    score: number;
    code: string | null;
    codeKr: string | null;
    articleNo: string | null;
    part: string | null;
    chapter: string | null;
    caseNo: string | null;
    court: string | null;
    decidedAt: string | null;
    category: string | null;
  }>;
  total: number;
  query: string;
  filters: {
    code: string | null;
    article: number | null;
  };
  target: "statute" | "case" | "all";
  mode: "hybrid-lexical";
}
```

> 현재는 `statutes` + `cases`를 lexical 방식으로 결합하고, `/chat`에서는 로컬 statutes + seeded precedents를 함께 컨텍스트로 주입한다. 이후 Gemini embedding + pgvector hybrid 검색으로 확장한다.

### 삭제된 엔드포인트 (Supabase Auth로 대체)
`POST /auth/signup`, `/auth/login`, `/auth/oauth/:provider`, `/auth/refresh`, `/auth/logout`, `DELETE /auth/account` → **모두 Supabase Auth SDK로 처리**. 백엔드 구현 불필요.

### 아래 v1.0 REST 스펙은 **참고용 레거시**
현재 구현 대상 아님. 필드 계약(요청/응답 스키마)은 여전히 유효하므로 클라이언트 코드 작성 시 참고 가능.

---

## 공통 규칙

### 인증
```
Authorization: Bearer <access_token>
```

- Access token: 15분 TTL, Supabase JWT
- Refresh token: 30일 TTL, httpOnly + secure + rotating
- 만료 시 401 → 클라이언트는 자동 refresh → 실패 시 로그아웃

### 에러 포맷
```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "일일 질문 한도를 초과했습니다.",
    "details": { "limit": 10, "used": 10 },
    "requestId": "req_abc123"
  }
}
```

### 에러 코드
| HTTP | code | 의미 |
|------|------|------|
| 400 | `VALIDATION_ERROR` | 요청 스키마 오류 |
| 401 | `UNAUTHORIZED` | 토큰 없음/만료 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복/상태 충돌 |
| 429 | `QUOTA_EXCEEDED` | 무료 한도 초과 |
| 429 | `RATE_LIMITED` | IP/유저 레이트 리밋 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |
| 503 | `LLM_UNAVAILABLE` | LLM 업스트림 오류 |

### Rate Limiting
- 미인증: 10 req/min/IP
- 인증: 100 req/min/user
- 채팅 메시지: Free 10/day, Pro 무제한 (quota)

### 응답 헤더
```
X-Request-Id: req_abc123
X-RateLimit-Remaining: 87
```

---

## Auth Endpoints

### `POST /auth/signup`
```ts
// Request
{
  email: string;
  password: string;
  name: string;
  userType: "law_school" | "bar_exam" | "undergrad" | "other";
  tosAccepted: true;
  privacyAccepted: true;
  legalDisclaimerAccepted: true;
}

// Response 201
{
  user: { id: string; email: string; name: string; };
  session: { accessToken: string; refreshToken: string; expiresAt: string; };
}
```

### `POST /auth/login`
```ts
// Request
{ email: string; password: string; }

// Response 200
{
  user: User;
  session: { accessToken: string; refreshToken: string; expiresAt: string; };
}
```

### `POST /auth/oauth/:provider`
`provider`: `apple` | `google` | `kakao`
```ts
// Request
{ idToken: string; nonce?: string; }

// Response 200
{ user: User; session: Session; isNewUser: boolean; }
```

### `POST /auth/refresh`
```ts
// Request
{ refreshToken: string; }

// Response 200
{ session: Session; }
```

### `POST /auth/logout`
Revokes current session. Response 204.

### `DELETE /auth/account`
GDPR account deletion. Soft delete → 30일 후 hard delete. Response 204.

---

## User Endpoints

### `GET /me`
```ts
// Response 200
{
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  userType: string;
  subscription: {
    plan: "free" | "pro_monthly" | "pro_annual" | "student";
    status: "active" | "expired" | "canceled" | "grace";
    expiresAt: string | null;
  };
  quota: {
    questionsUsed: number;
    questionsLimit: number;  // -1 for unlimited
    debateUsed: number;
    debateLimit: number;
    resetsAt: string;
  };
}
```

### `PATCH /me`
```ts
// Request
{ name?: string; avatarUrl?: string; studyGoal?: string; examTargetDate?: string; }

// Response 200: updated User
```

---

## Chat Endpoints

### `POST /chat/conversations`
Create new conversation.
```ts
// Request
{ mode: "normal" | "debate"; title?: string; }

// Response 201
{ id: string; title: string; mode: string; createdAt: string; }
```

### `GET /chat/conversations`
```ts
// Query: ?limit=20&cursor=<conversationId>&archived=false

// Response 200
{
  items: Array<{
    id: string;
    title: string;
    mode: string;
    lastMessageAt: string;
    messageCount: number;
  }>;
  nextCursor: string | null;
}
```

### `GET /chat/conversations/:id`
```ts
// Response 200
{
  id: string;
  title: string;
  mode: string;
  messages: Array<Message>;   // 최근 50개
}
```

### `POST /chat/conversations/:id/messages`
**SSE streaming endpoint.**

```ts
// Request
{
  content: string;
  attachments?: Array<{ type: "image" | "file"; url: string; }>;
}

// Response: text/event-stream
// Content-Type: text/event-stream
```

**현재 구현 SSE payload**:
```text
data: {"text":"민법 제750조는 ..."}
...
data: [DONE]
```

- 스트림 완료 후 백엔드는 assistant 메시지를 `messages`에 저장한다.
- 같은 시점에 RAG 소스 후보를 `citations` 테이블에 저장한다.
- 클라이언트는 이후 `messages + citations`를 Supabase에서 다시 조회해 화면에 반영한다.

**에러 처리**: 스트림 중 에러 발생 시 `data: {"error":"..."}` 이벤트를 보낸 뒤 종료한다.

### `DELETE /chat/conversations/:id`
Soft delete. Response 204.

### `POST /chat/messages/:id/feedback`
```ts
// Request
{ feedback: "up" | "down"; reason?: string; }

// Response 204
```

---

## Search Endpoints

### `GET /search/statutes`
```ts
// Query: ?q=<text>&code=civil&article=750&limit=20&offset=0

// Response 200
{
  items: Array<{
    id: string;
    code: string;
    codeKr: string;
    articleNo: string;
    title: string | null;
    textPreview: string;     // 첫 200자
    score: number;           // 0..1
  }>;
  total: number;
}
```

**검색 방식**:
- `article` 파라미터 있으면 → exact match
- `q`만 있으면 → hybrid (BM25 + vector, RRF fusion)

### `GET /statutes/:id`
```ts
// Response 200
{
  id: string;
  code: string;
  codeKr: string;
  articleNo: string;
  title: string | null;
  text: string;
  part: string | null;
  chapter: string | null;
  relatedCases: Array<{ id: string; caseNo: string; summary: string; }>;  // Top 5
}
```

### `GET /search/cases`
```ts
// Query: ?q=<text>&caseNo=<case_no>&category=civil&limit=20

// Response 200
{
  items: Array<{
    id: string;
    caseNo: string;
    court: string;
    decidedAt: string;
    category: string;
    summaryPreview: string;
    score: number;
  }>;
  total: number;
}
```

### `GET /cases/:id`
```ts
// Response 200
{
  id: string;
  caseNo: string;
  court: string;
  decidedAt: string;
  category: string;
  summary: string;
  judgmentPoints: string;
  fullText: string;
  relatedStatutes: Array<{ id: string; articleNo: string; title: string; }>;
}
```

---

## Library (Notes) Endpoints

### `POST /notes`
```ts
// Request
{
  messageId: string;        // 자동 분류의 출처
  subject?: string;         // 미지정 시 자동 분류
  topic?: string;
  tags?: string[];
}

// Response 201: Note
```

### `GET /notes`
```ts
// Query: ?subject=civil&topic=&starred=true&limit=50&cursor=

// Response 200
{
  items: Array<Note>;
  nextCursor: string | null;
  folderTree: Array<{
    subject: string;
    topics: Array<{ name: string; count: number; }>;
    count: number;
  }>;
}
```

### `GET /notes/:id`, `PATCH /notes/:id`, `DELETE /notes/:id`
표준 CRUD.

### `GET /notes/export`
```ts
// Query: ?format=anki|pdf&subject=civil

// Response 200
// Content-Type: application/zip (anki) or application/pdf
// Body: binary
```

---

## Billing Endpoints

### `POST /billing/restore`
Restore purchases from RevenueCat.
```ts
// Request
{ revenueCatUserId: string; }

// Response 200
{ subscription: SubscriptionStatus; }
```

### `POST /billing/student-verify`
```ts
// Request (multipart/form-data)
studentIdImage: File
school: string
```

### `POST /billing/webhook`
RevenueCat webhook. Signature verified via `REVENUECAT_WEBHOOK_SECRET`.

---

## Content-Type 규칙

- 기본: `application/json`
- 파일 업로드: `multipart/form-data`
- 채팅 스트리밍: `text/event-stream`
- 내보내기: `application/zip`, `application/pdf`

---

## Versioning

- URL path versioning: `/v1`, `/v2`
- Breaking change → 새 버전
- Deprecated API는 최소 3개월 운영 후 제거
- 응답 헤더 `X-API-Deprecated: true` 로 힌트

---

## OpenAPI 생성

Hono Zod OpenAPI로 자동 생성:
```bash
pnpm --filter api openapi:generate
```
→ `apps/api/openapi.json` + Scalar UI at `/v1/docs`
