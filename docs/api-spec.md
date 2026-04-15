# LAW.OS — API Specification

> **Version**: 1.0
> **Framework**: Hono (Cloudflare Workers)
> **Base URL**: `https://api.lawos.kr/v1`
> **Auth**: Bearer JWT (Supabase Auth)
> **Content-Type**: `application/json`
> **Source of Truth**: `apps/api/src/routes/`

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

**SSE Event Types**:
```
event: start
data: {"messageId":"msg_abc","model":"claude-sonnet-4-5"}

event: token
data: {"delta":"민법 제750조는"}

event: citation
data: {"id":"cit_1","sourceType":"statute","sourceId":"civil-750","snippet":"...","score":0.92}

event: debate_round
data: {"round":1,"agentId":"plaintiff","agentName":"원고측 변호인"}

event: done
data: {"messageId":"msg_abc","usage":{"promptTokens":1234,"completionTokens":567,"costUsd":0.012}}

event: error
data: {"code":"LLM_UNAVAILABLE","message":"..."}
```

**에러 처리**: 스트림 중 에러 발생 시 `event: error` 전송 후 연결 종료. 클라이언트는 재시도 가능.

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
