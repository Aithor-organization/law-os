-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 015: Push notification tokens
-- ───────────────────────────────────────────────────────────────────────────
-- Stores Expo Push Tokens per (user, device) so the backend can target
-- a specific user across all their devices. Tokens are regenerated on
-- app reinstall, so (user_id, device_id) is the upsert key — a single
-- user row is allowed multiple device rows.
--
-- Privacy: push tokens are not PII in themselves, but they link a user
-- to a device. RLS restricts reads to the owner so tokens can't be
-- enumerated even if the anon key is leaked.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  app_version text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_seen_at timestamptz default now() not null,
  unique (user_id, device_id)
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);
create index if not exists idx_push_tokens_last_seen on public.push_tokens(last_seen_at desc);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.push_tokens;
create policy "push_tokens_select_own" on public.push_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "push_tokens_insert_own" on public.push_tokens;
create policy "push_tokens_insert_own" on public.push_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "push_tokens_update_own" on public.push_tokens;
create policy "push_tokens_update_own" on public.push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push_tokens_delete_own" on public.push_tokens;
create policy "push_tokens_delete_own" on public.push_tokens
  for delete using (auth.uid() = user_id);

-- set_updated_at trigger (defined in 001_initial_schema.sql)
drop trigger if exists set_updated_at_push_tokens on public.push_tokens;
create trigger set_updated_at_push_tokens before update on public.push_tokens
  for each row execute function public.set_updated_at();
