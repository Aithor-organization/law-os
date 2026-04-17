-- ============================================================================
-- LAW.OS — 001_initial_schema.sql
-- Version: 1.0
-- Created: 2026-04-15
-- Description: Initial schema for LAW.OS mobile app (law student study tool).
--              Covers profiles, conversations, notes, subscriptions, public
--              reference data (statutes/cases), and frontend-derived tables.
--              Follows A안 (study-only scope, not legal consultation).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";      -- pgvector for embeddings
create extension if not exists "pg_cron";     -- scheduled jobs (quota reset)

-- ───────────────────────────────────────────────────────────────────────────
-- Helper functions (used by triggers)
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- B. USER-SCOPED TABLES (RLS required)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- profiles — extended user info linked to auth.users
-- ───────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  email_verified_at timestamptz,
  name text not null default '',
  avatar_url text,

  -- onboarding
  user_type text check (user_type in ('law_school', 'bar_exam', 'undergrad', 'other')),
  exam_target_date date,
  study_goal text,
  school text,
  school_year integer,

  -- locale
  locale text default 'ko' not null,
  timezone text default 'Asia/Seoul' not null,

  -- consent (legally required)
  tos_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  legal_disclaimer_accepted_at timestamptz,

  -- soft delete
  deleted_at timestamptz,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_profiles_deleted on public.profiles(deleted_at) where deleted_at is not null;
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile row on auth.users signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- conversations
-- ───────────────────────────────────────────────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  mode text not null default 'normal' check (mode in ('normal', 'debate')),
  archived_at timestamptz,
  last_message_at timestamptz,
  message_count integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_conversations_user_recent on public.conversations(user_id, last_message_at desc nulls last);
create trigger set_updated_at_conversations before update on public.conversations
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- messages
-- ───────────────────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'debate_agent')),

  -- debate mode
  debate_agent_id text check (debate_agent_id in ('plaintiff', 'defendant', 'judge', 'narrator')),
  debate_round integer,

  content text not null,
  content_tokens integer,

  -- LLM metadata
  model text,
  latency_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  cost_usd decimal(10, 6),

  -- error info
  error_code text,
  error_message text,

  created_at timestamptz default now() not null
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- feedback — per-message thumbs up/down
-- ───────────────────────────────────────────────────────────────────────────
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  reason text,
  created_at timestamptz default now() not null,
  unique(user_id, message_id)
);

create index idx_feedback_message on public.feedback(message_id);

-- ───────────────────────────────────────────────────────────────────────────
-- notes — auto-built personal library
-- ───────────────────────────────────────────────────────────────────────────
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,

  -- content snapshot (retained even if message deleted)
  question text not null,
  answer text not null,

  -- classification
  subject text not null check (subject in ('civil', 'criminal', 'constitutional', 'commercial', 'other')),
  topic text,
  tags text[] default array[]::text[] not null,

  -- SRS
  review_count integer default 0 not null,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,

  starred boolean default false not null,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_notes_user_subject on public.notes(user_id, subject, created_at desc);
create index idx_notes_user_starred on public.notes(user_id, starred) where starred = true;
create trigger set_updated_at_notes before update on public.notes
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- subscriptions — RevenueCat-bridged billing state
-- ───────────────────────────────────────────────────────────────────────────
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro_monthly', 'pro_annual', 'student')),
  status text not null check (status in ('active', 'expired', 'canceled', 'grace', 'paused')),

  provider text check (provider in ('apple', 'google', 'stripe')),
  provider_subscription_id text,
  revenue_cat_user_id text,

  started_at timestamptz,
  expires_at timestamptz,
  canceled_at timestamptz,

  student_verified_at timestamptz,
  student_verification_expires_at timestamptz,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger set_updated_at_subscriptions before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- usage_quotas — daily limits
-- ───────────────────────────────────────────────────────────────────────────
create table public.usage_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quota_date date not null,
  questions_used integer default 0 not null,
  debate_used integer default 0 not null,
  tokens_in integer default 0 not null,
  tokens_out integer default 0 not null,
  cost_usd decimal(10, 6) default 0 not null,
  unique(user_id, quota_date)
);

create index idx_usage_quotas_user_date on public.usage_quotas(user_id, quota_date desc);

-- ───────────────────────────────────────────────────────────────────────────
-- devices — per-device push tokens + metadata
-- ───────────────────────────────────────────────────────────────────────────
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  device_name text,
  app_version text,
  os_version text,
  push_token text,
  last_seen_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create index idx_devices_user on public.devices(user_id, last_seen_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- student_verifications
-- ───────────────────────────────────────────────────────────────────────────
create table public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school text not null,
  student_id_url text not null,        -- supabase storage signed URL
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  submitted_at timestamptz default now() not null,
  reviewed_at timestamptz
);

create index idx_student_verifications_status on public.student_verifications(status, submitted_at);

-- ============================================================================
-- C. PUBLIC REFERENCE DATA (read-all, seed-managed)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- statutes — codified law articles
-- ───────────────────────────────────────────────────────────────────────────
create table public.statutes (
  id text primary key,                             -- e.g., 'civil-750'
  code text not null check (code in ('civil', 'criminal', 'constitutional', 'commercial')),
  code_kr text not null,                           -- '민법'
  article_no text not null,                        -- '제750조'
  article_no_int integer,                          -- 750 (for sort)
  title text,                                      -- '불법행위의 내용'
  body text not null,
  text_hash text not null,                         -- SHA-256 for change detection

  part text,                                       -- '제3편 채권'
  chapter text,                                    -- '제5장 불법행위'

  embedding vector(3072),

  effective_from date,
  effective_until date,
  last_synced_at timestamptz default now() not null,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_statutes_code_article on public.statutes(code, article_no_int);
-- ivfflat requires data before ANALYZE; index creation is intentionally
-- deferred to a post-seed migration (002_statute_vector_index.sql).

-- ───────────────────────────────────────────────────────────────────────────
-- cases — court decisions
-- ───────────────────────────────────────────────────────────────────────────
create table public.cases (
  id text primary key,                             -- e.g., '2018da12345'
  case_no text unique not null,                    -- '2018다12345'
  court text not null check (court in ('supreme', 'constitutional', 'high', 'district')),
  decided_at date not null,

  category text not null check (category in ('civil', 'criminal', 'constitutional', 'admin', 'tax')),

  summary text,
  judgment_points text,
  full_text text,

  related_statute_ids text[] default array[]::text[] not null,

  embedding vector(3072),

  last_synced_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_cases_category_recent on public.cases(category, decided_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- statute_case_links — many-to-many between statutes and cases
-- ───────────────────────────────────────────────────────────────────────────
create table public.statute_case_links (
  statute_id text not null references public.statutes(id) on delete cascade,
  case_id text not null references public.cases(id) on delete cascade,
  relevance_score decimal(4, 3),
  primary key (statute_id, case_id)
);

create index idx_statute_case_links_case on public.statute_case_links(case_id);

-- ───────────────────────────────────────────────────────────────────────────
-- citations — messages reference statutes/cases (junction)
-- ───────────────────────────────────────────────────────────────────────────
create table public.citations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  source_type text not null check (source_type in ('statute', 'case')),
  source_id text not null,                         -- statutes.id or cases.id
  snippet text not null,
  start_offset integer,
  end_offset integer,
  score decimal(4, 3),
  created_at timestamptz default now() not null
);

create index idx_citations_message on public.citations(message_id);
create index idx_citations_source on public.citations(source_type, source_id);

-- ============================================================================
-- E. FRONTEND-DERIVED TABLES
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- user_favorites — starred statutes/cases
-- ───────────────────────────────────────────────────────────────────────────
create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('statute', 'case')),
  content_id text not null,
  note text,
  created_at timestamptz default now() not null,
  unique(user_id, content_type, content_id)
);

create index idx_favorites_user on public.user_favorites(user_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- search_history — personal recent searches
-- ───────────────────────────────────────────────────────────────────────────
create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  result_type text not null check (result_type in ('statute', 'case', 'all')),
  result_count integer default 0 not null,
  searched_at timestamptz default now() not null
);

create index idx_search_history_user on public.search_history(user_id, searched_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- search_analytics — aggregated trending searches (service-role writes)
-- ───────────────────────────────────────────────────────────────────────────
create table public.search_analytics (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  normalized_query text not null,
  category text,
  search_count integer default 1 not null,
  last_searched_at timestamptz default now() not null,
  unique(normalized_query, category)
);

create index idx_search_analytics_rank on public.search_analytics(search_count desc, last_searched_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- study_activities — daily stats for streaks / library dashboard
-- ───────────────────────────────────────────────────────────────────────────
create table public.study_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  questions_asked integer default 0 not null,
  notes_saved integer default 0 not null,
  reviews_completed integer default 0 not null,
  minutes_spent integer default 0 not null,
  unique(user_id, activity_date)
);

create index idx_study_activities_user_date on public.study_activities(user_id, activity_date desc);

-- ───────────────────────────────────────────────────────────────────────────
-- notification_preferences
-- ───────────────────────────────────────────────────────────────────────────
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean default true not null,
  email_enabled boolean default true not null,
  study_reminder_enabled boolean default false not null,
  study_reminder_time time default '19:00' not null,
  study_reminder_days text[] default array['mon','tue','wed','thu','fri']::text[] not null,
  review_due_enabled boolean default true not null,
  marketing_enabled boolean default false not null,
  updated_at timestamptz default now() not null
);

create trigger set_updated_at_notif_prefs before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────────────────────────────────
-- notifications — in-app notification log
-- ───────────────────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('study_reminder', 'review_due', 'announcement', 'billing', 'system')),
  title text not null,
  body text,
  deeplink text,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_notifications_user_unread on public.notifications(user_id, created_at desc)
  where read_at is null;

-- ───────────────────────────────────────────────────────────────────────────
-- note_exports — Anki/PDF export history
-- ───────────────────────────────────────────────────────────────────────────
create table public.note_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('anki', 'pdf', 'json')),
  filter_subject text,
  note_count integer not null,
  file_url text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

create index idx_note_exports_user on public.note_exports(user_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
-- content_reports — user-flagged bad answers
-- ───────────────────────────────────────────────────────────────────────────
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  category text not null check (category in ('inaccurate', 'inappropriate', 'unsafe', 'missing_citation', 'other')),
  reason text,
  status text default 'pending' not null check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz default now() not null,
  resolved_at timestamptz
);

create index idx_content_reports_status on public.content_reports(status, created_at desc);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all user-scoped tables
alter table public.profiles                enable row level security;
alter table public.conversations           enable row level security;
alter table public.messages                enable row level security;
alter table public.feedback                enable row level security;
alter table public.notes                   enable row level security;
alter table public.subscriptions           enable row level security;
alter table public.usage_quotas            enable row level security;
alter table public.devices                 enable row level security;
alter table public.student_verifications   enable row level security;
alter table public.citations               enable row level security;
alter table public.user_favorites          enable row level security;
alter table public.search_history          enable row level security;
alter table public.study_activities        enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications           enable row level security;
alter table public.note_exports            enable row level security;
alter table public.content_reports         enable row level security;

-- Public-read tables
alter table public.statutes                enable row level security;
alter table public.cases                   enable row level security;
alter table public.statute_case_links      enable row level security;
alter table public.search_analytics        enable row level security;

-- ───────── profiles: users see/update their own ─────────
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ───────── conversations ─────────
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- ───────── messages: joined through conversation ownership ─────────
create policy "messages_select_via_conversation" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
create policy "messages_insert_via_conversation" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ───────── citations: inherit from message ─────────
create policy "citations_select_via_message" on public.citations
  for select using (
    exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = citations.message_id and c.user_id = auth.uid()
    )
  );

-- ───────── 4-policy template for the rest of user-scoped tables ─────────
do $$
declare
  t text;
  user_scoped_tables text[] := array[
    'feedback', 'notes', 'subscriptions', 'usage_quotas', 'devices',
    'student_verifications', 'user_favorites', 'search_history',
    'study_activities', 'notifications', 'note_exports', 'content_reports'
  ];
begin
  foreach t in array user_scoped_tables loop
    execute format('create policy "%I_select_own" on public.%I for select using (auth.uid() = user_id);', t, t);
    execute format('create policy "%I_insert_own" on public.%I for insert with check (auth.uid() = user_id);', t, t);
    execute format('create policy "%I_update_own" on public.%I for update using (auth.uid() = user_id);', t, t);
    execute format('create policy "%I_delete_own" on public.%I for delete using (auth.uid() = user_id);', t, t);
  end loop;
end $$;

-- ───────── notification_preferences uses user_id as primary key ─────────
create policy "notif_prefs_select_own" on public.notification_preferences
  for select using (auth.uid() = user_id);
create policy "notif_prefs_insert_own" on public.notification_preferences
  for insert with check (auth.uid() = user_id);
create policy "notif_prefs_update_own" on public.notification_preferences
  for update using (auth.uid() = user_id);

-- ───────── public read (statutes, cases, links, analytics) ─────────
create policy "statutes_public_read" on public.statutes
  for select using (true);
create policy "cases_public_read" on public.cases
  for select using (true);
create policy "statute_case_links_public_read" on public.statute_case_links
  for select using (true);
create policy "search_analytics_public_read" on public.search_analytics
  for select using (true);
-- INSERT/UPDATE on search_analytics is restricted to service_role (no policy = denied).

-- ============================================================================
-- DAILY QUOTA RESET (pg_cron)
-- ============================================================================
-- Scheduled at 00:00 KST = 15:00 UTC (previous day).
-- Cron runs in UTC; adjust or use timezone conversion at application layer.
select cron.schedule(
  'reset-daily-quota',
  '0 15 * * *',
  $$ insert into public.usage_quotas (user_id, quota_date)
     select id, current_date from auth.users
     on conflict (user_id, quota_date) do nothing; $$
);

-- ============================================================================
-- END OF 001_initial_schema.sql
-- ============================================================================
