# LAW.OS — Supabase 설정 가이드

> **Version**: 1.0
> **Companion to**: [`data-model.md`](./data-model.md) (Drizzle 스키마 정의)
> **Last Updated**: 2026-04-15

이 문서는 Supabase 대시보드에서 프로젝트를 세팅할 때 **어떤 데이터를 어떤 테이블/버킷에 저장하는지** 명확히 정리합니다.

---

## 🏗️ 1. 프로젝트 생성

```
대시보드: https://supabase.com/dashboard
Region: Seoul (ap-northeast-2) — 한국 유저 레이턴시 우선
Name: law-os-dev / law-os-prod (환경별 2개)
Database password: 강력한 비밀번호 → 1Password 저장
```

---

## 📊 2. 테이블 구조 (저장될 데이터 목록)

크게 **3가지 카테고리**로 나뉩니다:

### 🟣 A. Supabase 관리 — 자동 생성 (건드리지 말 것)

| 테이블 | 용도 |
|--------|------|
| `auth.users` | 로그인 계정 — 이메일/OAuth 모두 Supabase Auth가 관리 |
| `auth.sessions` | 활성 세션 — JWT refresh token 포함 |
| `auth.identities` | OAuth provider 연결 (Apple/Google/Kakao) |
| `storage.buckets` | 파일 버킷 메타 |
| `storage.objects` | 업로드된 파일 |

→ **우리가 직접 insert/update 하지 않음.** Supabase Auth API를 통해서만 접근.

### 🔵 B. 유저 개인 데이터 — RLS 필수 (우리가 만듦)

유저별 격리가 필요한 데이터. `auth.uid()` 기반 RLS.

| 테이블 | 저장할 데이터 |
|--------|-------------|
| `profiles` | 확장 프로필 (이름, 학교, 학년, 목표 시험, 아바타 URL, 온보딩 상태, 약관 동의 타임스탬프) |
| `conversations` | 채팅 대화 세션 (제목, 모드 normal/debate, 생성일) |
| `messages` | 개별 메시지 (user/assistant, 내용, 토큰 수, 비용, 모델명, 라운드) |
| `citations` | 메시지에 인용된 조문/판례 연결 (message_id → statute_id / case_id) |
| `notes` | 자동 서재 (과목, 주제, 태그, 복습 일정) |
| `subscriptions` | 구독 상태 (plan, status, provider, revenue_cat_user_id, 만료일) |
| `usage_quotas` | 일일 사용량 (질문 수, 토큰, 비용) |
| `devices` | 로그인 디바이스 (iOS/Android, 앱 버전, push token) |
| `feedback` | 답변 피드백 (message_id, up/down, 이유) |
| `student_verifications` | 학생 인증 (학교, 학생증 URL, 검수 상태) |

### 🟢 C. 공개 참조 데이터 — 모든 유저 읽기 가능 (시드)

법령/판례는 전체 공유. RLS: `using (true)`

| 테이블 | 저장할 데이터 |
|--------|-------------|
| `statutes` | 조문 (민법/형법/헌법/상법, 약 12,847개) + pgvector embedding |
| `cases` | 판례 (대법원 주요, 약 2,341개) + embedding |
| `statute_case_links` | 조문 ↔ 판례 관계 테이블 |

### 🟡 D. 메타 — 관리자 전용

| 테이블 | 저장할 데이터 |
|--------|-------------|
| `admin_users` | 어드민 대시보드 계정 (별도 RLS) |
| `audit_log` | 중요 작업 감사 로그 (계정 삭제, 결제 이벤트 등) |
| `legal_data_sync_log` | 법령 동기화 이력 (마지막 sync 시간, 변경된 조문 수) |

### 🟠 E. 프론트엔드 요구사항 기반 추가 테이블

> 프론트엔드 코드를 스캔해서 찾은 추가 데이터 요구사항. 2026-04-15 추가.

| 테이블 | 저장할 데이터 | 어디서 쓰는지 |
|--------|-------------|---------------|
| `user_favorites` | 즐겨찾기한 조문/판례 (user_id, content_type, content_id) | Statute/Case Detail의 ⭐ 버튼, Citation 모달 |
| `search_history` | 개인 최근 검색 (query, result_type, searched_at) | Search 탭 "// 최근 검색" 칩 리스트 |
| `search_analytics` | 인기 검색어 집계 (query, category, count) | Search 탭 "// 인기 검색어" Top 5 |
| `study_activities` | 일별 학습 활동 (date, questions_asked, notes_saved, minutes_spent) | Library/Profile "연속 학습일 47", "이번달 질문 847" |
| `notification_preferences` | 알림 설정 (push_enabled, email_enabled, study_reminder_time, marketing_opt_in) | Settings 알림 섹션 |
| `notifications` | 사용자 알림 (type, title, body, read_at, created_at) | Notifications Log 화면 (Stitch에 이미 존재) |
| `waitlist` | 출시 전 대기자 (email, name, referral_source, signed_up_at) | 랜딩 페이지 "대기자 등록" 폼 |
| `note_exports` | 내보내기 이력 (format, note_count, file_url, expires_at) | Export Modal (Anki/PDF) |
| `content_reports` | 부적절한 답변 신고 (message_id, category, reason, status) | 👎 피드백 확장 + 관리자 모더레이션 |

---

## 🧱 2.1. 추가 테이블 스키마 (카테고리 E 상세)

### `user_favorites`
```sql
create table user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('statute', 'case')),
  content_id text not null,                    -- statutes.id or cases.id
  note text,                                    -- 개인 메모
  created_at timestamptz default now() not null,
  unique(user_id, content_type, content_id)
);
create index idx_favorites_user on user_favorites(user_id, created_at desc);
```

### `search_history`
```sql
create table search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  result_type text not null check (result_type in ('statute', 'case', 'all')),
  result_count integer default 0,
  searched_at timestamptz default now() not null
);
create index idx_search_history_user on search_history(user_id, searched_at desc);
-- 최근 10건만 유지 (trigger 또는 cron으로 오래된 것 삭제)
```

### `search_analytics` (집계 — 모든 유저 기준)
```sql
create table search_analytics (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  normalized_query text not null,               -- lowercase + trim
  category text,                                -- civil|criminal|constitutional
  search_count integer default 1,
  last_searched_at timestamptz default now() not null,
  unique(normalized_query, category)
);
create index idx_search_analytics_rank on search_analytics(search_count desc, last_searched_at desc);
-- 매일 search_history 집계 → upsert
```

### `study_activities`
```sql
create table study_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  questions_asked integer default 0,
  notes_saved integer default 0,
  reviews_completed integer default 0,
  minutes_spent integer default 0,
  unique(user_id, activity_date)
);
create index idx_study_activities_user_date on study_activities(user_id, activity_date desc);
-- 연속 학습일 streak는 이 테이블에서 계산 (View or function)
```

### `notification_preferences`
```sql
create table notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean default true,
  email_enabled boolean default true,
  study_reminder_enabled boolean default false,
  study_reminder_time time default '19:00',
  study_reminder_days text[] default array['mon','tue','wed','thu','fri'],
  review_due_enabled boolean default true,
  marketing_enabled boolean default false,
  updated_at timestamptz default now() not null
);
```

### `notifications`
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('study_reminder', 'review_due', 'announcement', 'billing', 'system')),
  title text not null,
  body text,
  deeplink text,                                -- e.g., "lawos://note/123"
  read_at timestamptz,
  created_at timestamptz default now() not null
);
create index idx_notifications_user_unread on notifications(user_id, created_at desc) where read_at is null;
```

### `waitlist` (출시 전용 — RLS 없음, service role만)
```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  user_type text check (user_type in ('law_school', 'bar_exam', 'undergrad', 'other')),
  referral_source text,                         -- where they heard about us
  early_access_invited boolean default false,
  signed_up_at timestamptz default now() not null
);
create index idx_waitlist_signed_up on waitlist(signed_up_at desc);
```

### `note_exports`
```sql
create table note_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('anki', 'pdf', 'json')),
  filter_subject text,                          -- e.g., 'civil' or null for all
  note_count integer not null,
  file_url text not null,                        -- supabase storage signed URL
  expires_at timestamptz not null,               -- 7일 TTL
  created_at timestamptz default now() not null
);
create index idx_note_exports_user on note_exports(user_id, created_at desc);
```

### `content_reports`
```sql
create table content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  category text not null check (category in ('inaccurate', 'inappropriate', 'unsafe', 'missing_citation', 'other')),
  reason text,
  status text default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz default now() not null,
  resolved_at timestamptz
);
create index idx_content_reports_status on content_reports(status, created_at desc);
```

---

## 🔐 3. Row Level Security (RLS) 정책

**모든 B 카테고리 테이블**은 RLS를 활성화하고 아래 4개 정책을 기본으로 적용:

```sql
-- 1. SELECT: 본인 데이터만
create policy "users_select_own"
  on {table} for select
  using (auth.uid() = user_id);

-- 2. INSERT: 본인으로만 생성
create policy "users_insert_own"
  on {table} for insert
  with check (auth.uid() = user_id);

-- 3. UPDATE: 본인 데이터만 수정
create policy "users_update_own"
  on {table} for update
  using (auth.uid() = user_id);

-- 4. DELETE: 본인 데이터만 삭제
create policy "users_delete_own"
  on {table} for delete
  using (auth.uid() = user_id);
```

**C 카테고리** (statutes/cases): `using (true)` — public read

**D 카테고리** (admin): 별도 claims 기반 정책

**E 카테고리 RLS 예외**:
- `user_favorites`, `search_history`, `notification_preferences`, `notifications`, `note_exports`, `content_reports`, `study_activities` → 4-policy 기본 템플릿 적용 (B와 동일)
- `search_analytics` → `using (true)` + `insert/update`는 service role만 (서버가 집계)
- `waitlist` → 클라이언트는 `insert` 만 허용, `select`는 service role만 (이메일 프라이버시 보호)

```sql
-- waitlist 특수 정책
create policy "anyone_can_join_waitlist"
  on waitlist for insert
  with check (true);
-- SELECT/UPDATE/DELETE는 정책 없음 (service role만 가능)
```

---

## 🪣 4. Storage 버킷

```
avatars/            (public, 1MB 제한)
  - {user_id}/{timestamp}.jpg
  - 프로필 아바타 이미지

student-id/         (private, 5MB 제한)
  - {user_id}/{timestamp}.jpg
  - 학생증 인증용 — 검수 후 삭제

exports/            (private, 10MB 제한, 7일 TTL)
  - {user_id}/{note_id}.apkg
  - {user_id}/{subject}.pdf
  - 서재 내보내기 임시 파일

legal-pdfs/         (public, read-only)
  - statutes/{code}-{article}.pdf
  - cases/{case_no}.pdf
  - 판례 원문 PDF (선택적)
```

각 버킷에 RLS 정책: "본인 폴더만 접근 가능" (경로 prefix = auth.uid())

---

## 🔌 5. Auth Providers

활성화할 OAuth 제공자:
- ✅ **Email + Password** (기본)
- ✅ **Apple** (iOS 앱 필수)
- ✅ **Google**
- ✅ **Kakao** (한국 시장 필수, OAuth2 커스텀)

각 Provider의 Client ID / Secret은 Supabase 대시보드 → Authentication → Providers에서 설정.

### 이메일 인증
- Template 커스터마이즈 (Dark Academia Pro 스타일)
- Redirect URL: `lawos://auth/callback` (딥링크)

---

## ⚙️ 6. Database Functions & Triggers

### Trigger 1: 프로필 자동 생성
```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Trigger 2: `updated_at` 자동 갱신
```sql
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 각 테이블에 적용
create trigger set_updated_at before update on profiles
  for each row execute function public.set_updated_at();
-- (conversations, messages, notes, subscriptions... 에도 동일 적용)
```

### Trigger 3: 일일 quota 초기화
cron 확장 (`pg_cron`) 사용:
```sql
select cron.schedule('reset-daily-quota', '0 0 * * *', $$
  update usage_quotas set questions_used = 0, debate_used = 0
  where date = current_date;
$$);
```

---

## 🔄 7. Realtime 구독

```
conversations.{user_id} → 새 대화 생성 알림
messages.{conversation_id} → SSE 대신 Realtime으로 스트리밍 가능
```

초기 MVP는 SSE 사용, 추후 Realtime으로 전환 고려.

---

## 📦 8. Extensions

필수 확장:
```sql
create extension if not exists "uuid-ossp";    -- UUID 생성
create extension if not exists "vector";        -- pgvector (임베딩)
create extension if not exists "pg_cron";       -- 스케줄 잡
create extension if not exists "pgcrypto";      -- 암호화
```

Supabase는 이들 대부분을 이미 활성화해둠. 확인만 필요.

---

## 🔑 9. 환경 변수

```bash
# 서버 (Hono / apps/api)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # RLS 우회, 절대 클라 노출 금지
SUPABASE_ANON_KEY=eyJ...                   # public, 클라와 공유 가능

# 모바일 (Expo)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # 이것만 공개
```

---

## 📝 10. 마이그레이션 관리 전략

- **Drizzle Kit** → `apps/api/drizzle/migrations/` 에 SQL 생성
- **Supabase CLI** → `supabase db push` 로 로컬 → 리모트 적용
- 또는 **Supabase 대시보드의 SQL Editor**에 직접 붙여넣기 (초기 셋업용)

### 권장 순서
1. 대시보드에서 프로젝트 생성
2. SQL Editor에 `docs/supabase/001_initial_schema.sql` 붙여넣기 (추후 생성)
3. `supabase db pull` 로 현재 상태 로컬 반영
4. 이후 변경은 Drizzle Kit → `supabase db push`

---

## ⚠️ 11. 데이터 저장 시 주의사항

### 저장하면 안 되는 것
- ❌ **주민등록번호** — 절대 수집 금지
- ❌ **전화번호** — 현재 스펙에는 필요 없음
- ❌ **주소** — 학생증 인증에만 일시 저장 후 삭제
- ❌ **신용카드 번호** — RevenueCat/Apple/Google이 처리
- ❌ **비밀번호 평문** — Supabase Auth가 bcrypt 해시 자동 처리

### 필수 저장
- ✅ 약관 동의 타임스탬프 3개 (`tos_accepted_at`, `privacy_accepted_at`, `legal_disclaimer_accepted_at`)
- ✅ LLM 사용량 (비용 추적 + 한도 관리)
- ✅ 학생 인증 이미지 (검수 후 30일 내 삭제)
- ✅ 탈퇴 요청 타임스탬프 (soft delete 30일 후 hard delete)

---

## 🎯 다음 단계

1. Supabase 프로젝트 생성 (Seoul region)
2. `docs/supabase/001_initial_schema.sql` 작성 (다음 turn)
3. SQL Editor에서 실행 → 테이블 생성 확인
4. RLS 정책 적용
5. Storage 버킷 생성
6. Auth Providers 활성화
7. `apps/api/` 생성 + Drizzle 연결

---

## 📚 관련 문서

- [`data-model.md`](./data-model.md) — Drizzle 스키마 (타입 정의)
- [`api-spec.md`](./api-spec.md) — API 엔드포인트
- [`legal-ux.md`](./legal-ux.md) — 저장 금지 데이터 (변호사법 대응)
- [`state-flows.md`](./state-flows.md) — 인증 상태머신
