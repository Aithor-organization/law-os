# LAW.OS — Data Model

> **Version**: 1.0
> **ORM**: Drizzle
> **DB**: Supabase Postgres 15 + pgvector 0.7
> **Source of Truth**: `apps/api/src/db/schema.ts`

---

## ERD (개요)

```
User ─┬─< Conversation ─< Message ─< Citation ─> Statute
      │                                        └─> Case
      ├─< Note ────────── (references Message)
      ├── Subscription (1:1)
      └── Device ──< Session
```

---

## 엔티티 상세

### 1. User

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),

  // 온보딩
  userType: text("user_type", { enum: ["law_school", "bar_exam", "undergrad", "other"] }).notNull(),
  examTargetDate: date("exam_target_date"),
  studyGoal: text("study_goal"),

  // Locale
  locale: text("locale").default("ko"),
  timezone: text("timezone").default("Asia/Seoul"),

  // Consent (법적 필수)
  tosAcceptedAt: timestamp("tos_accepted_at").notNull(),
  privacyAcceptedAt: timestamp("privacy_accepted_at").notNull(),
  legalDisclaimerAcceptedAt: timestamp("legal_disclaimer_accepted_at").notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Indexes**: `email`, `deletedAt`

---

### 2. Conversation

```ts
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),              // 자동 생성 (첫 메시지 기반)
  mode: text("mode", { enum: ["normal", "debate"] }).default("normal").notNull(),
  archivedAt: timestamp("archived_at"),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Indexes**: `(userId, lastMessageAt DESC)` — 대화 목록 최근순 조회

---

### 3. Message

```ts
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  role: text("role", { enum: ["user", "assistant", "system", "debate_agent"] }).notNull(),

  // Debate 전용
  debateAgentId: text("debate_agent_id", { enum: ["plaintiff", "defendant", "judge", "narrator"] }),
  debateRound: integer("debate_round"),

  content: text("content").notNull(),
  contentTokens: integer("content_tokens"),

  // 피드백
  feedback: text("feedback", { enum: ["up", "down"] }),
  feedbackReason: text("feedback_reason"),

  // LLM 메타
  model: text("model"),                         // "claude-sonnet-4-5" 등
  latencyMs: integer("latency_ms"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }),

  // Error
  errorCode: text("error_code"),
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Indexes**: `(conversationId, createdAt ASC)` — 메시지 시간순 조회

---

### 4. Citation (Junction)

```ts
export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }).notNull(),
  sourceType: text("source_type", { enum: ["statute", "case"] }).notNull(),
  sourceId: text("source_id").notNull(),         // statute.id or case.id
  snippet: text("snippet").notNull(),           // 인용된 부분 텍스트
  startOffset: integer("start_offset"),         // 메시지 내 하이라이트 위치
  endOffset: integer("end_offset"),
  score: decimal("score", { precision: 4, scale: 3 }),  // 검색 점수
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Indexes**: `messageId`, `(sourceType, sourceId)`

---

### 5. Statute (법령 조문)

```ts
export const statutes = pgTable("statutes", {
  id: text("id").primaryKey(),                  // e.g., "civil-750"
  code: text("code", { enum: ["civil", "criminal", "constitutional", "commercial"] }).notNull(),
  codeKr: text("code_kr").notNull(),            // "민법"
  articleNo: text("article_no").notNull(),      // "제750조"
  articleNoInt: integer("article_no_int"),      // 750 (정렬용)
  title: text("title"),                         // "불법행위의 내용"
  text: text("text").notNull(),                 // 전문
  textHash: text("text_hash").notNull(),        // SHA-256 (변경 감지)

  // 계층
  part: text("part"),                           // "제3편 채권"
  chapter: text("chapter"),                     // "제5장 불법행위"

  // 벡터
  embedding: vector("embedding", { dimensions: 3072 }),

  // 메타
  effectiveFrom: date("effective_from"),
  effectiveUntil: date("effective_until"),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Indexes**:
- `(code, articleNoInt)` — 조 번호 정확 검색
- `embedding` (ivfflat, cosine) — 벡터 검색

---

### 6. Case (판례)

```ts
export const cases = pgTable("cases", {
  id: text("id").primaryKey(),                  // e.g., "2018da12345"
  caseNo: text("case_no").unique().notNull(),   // "2018다12345"
  court: text("court", { enum: ["supreme", "constitutional", "high", "district"] }).notNull(),
  decidedAt: date("decided_at").notNull(),

  // 분류
  category: text("category", { enum: ["civil", "criminal", "constitutional", "admin", "tax"] }).notNull(),

  // 내용
  summary: text("summary"),                     // 핵심 요지
  judgmentPoints: text("judgment_points"),      // 판시사항
  fullText: text("full_text"),                  // 전문

  // 관련 조문
  relatedStatuteIds: text("related_statute_ids").array(),

  // 벡터
  embedding: vector("embedding", { dimensions: 3072 }),

  // 메타
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Indexes**:
- `caseNo` (unique)
- `(category, decidedAt DESC)`
- `embedding` (ivfflat, cosine)

---

### 7. Note (자동 서재)

```ts
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),

  // 내용 스냅샷 (메시지 삭제돼도 유지)
  question: text("question").notNull(),
  answer: text("answer").notNull(),

  // 분류
  subject: text("subject", { enum: ["civil", "criminal", "constitutional", "commercial", "other"] }).notNull(),
  topic: text("topic"),                         // "채권총론", "물권" 등
  tags: text("tags").array().default([]),

  // 학습 메타
  reviewCount: integer("review_count").default(0),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at"),    // SRS 알고리즘

  // 별표
  starred: boolean("starred").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Indexes**: `(userId, subject, createdAt DESC)`, `(userId, starred)`

---

### 8. Subscription

```ts
export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro_monthly", "pro_annual", "student"] }).notNull(),
  status: text("status", { enum: ["active", "expired", "canceled", "grace", "paused"] }).notNull(),

  provider: text("provider", { enum: ["apple", "google", "stripe"] }),
  providerSubscriptionId: text("provider_subscription_id"),
  revenueCatUserId: text("revenue_cat_user_id"),

  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at"),
  canceledAt: timestamp("canceled_at"),

  // 학생 인증
  studentVerifiedAt: timestamp("student_verified_at"),
  studentVerificationExpiresAt: timestamp("student_verification_expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

### 9. UsageQuota (일일 사용량)

```ts
export const usageQuotas = pgTable("usage_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),                 // UTC 날짜
  questionsUsed: integer("questions_used").default(0).notNull(),
  debateUsed: integer("debate_used").default(0).notNull(),
  tokensIn: integer("tokens_in").default(0).notNull(),
  tokensOut: integer("tokens_out").default(0).notNull(),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).default("0").notNull(),
});
```

**Indexes**: `(userId, date)` unique

---

### 10. Device & Session

```ts
export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform", { enum: ["ios", "android"] }).notNull(),
  deviceName: text("device_name"),
  appVersion: text("app_version"),
  osVersion: text("os_version"),
  pushToken: text("push_token"),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  deviceId: uuid("device_id").references(() => devices.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Row Level Security (Supabase RLS)

모든 user-scoped 테이블에 RLS 활성화:

```sql
-- 예: conversations
alter table conversations enable row level security;

create policy "users_see_own_conversations"
  on conversations for select
  using (auth.uid() = user_id);

create policy "users_insert_own_conversations"
  on conversations for insert
  with check (auth.uid() = user_id);
```

동일 패턴을 `messages`, `notes`, `usage_quotas`, `devices`, `sessions`에 적용.

`statutes`, `cases`는 public read (RLS: `using (true)`).

---

## 마이그레이션 전략

- `drizzle-kit generate` → `apps/api/drizzle/migrations/`
- PR 머지 시 `drizzle-kit migrate` 자동 실행 (CI)
- Production 마이그레이션은 **Supabase migrations** 탭으로 수동 확인 후 적용
- **파괴적 변경 금지**: 컬럼 삭제는 2단계 (deprecate → drop 다음 릴리즈)

---

## Seed 데이터

`apps/api/src/db/seed.ts`:
- 민법/형법/헌법 조문 전체 (국가법령정보센터 API)
- 대법원 주요 판례 Top 2,341개
- 테스트 유저 3명 (준호/지영/서연 페르소나)
