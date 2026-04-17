-- ============================================================================
-- LAW.OS — 005_bookmarks.sql
-- Version: 1.0
-- Created: 2026-04-17
-- Description: Per-user bookmarks for statutes and cases.
--              Powers the ⭐ button on statute/[id] and case/[id] screens.
-- Apply: paste into Supabase SQL editor (after 001/002/003/004).
-- ============================================================================

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('statute', 'case')),
  source_id text not null,
  note text,
  created_at timestamptz default now() not null,
  unique (user_id, source_type, source_id)
);

create index if not exists idx_user_bookmarks_user_recent
  on public.user_bookmarks (user_id, created_at desc);

create index if not exists idx_user_bookmarks_source
  on public.user_bookmarks (source_type, source_id);

-- RLS — users can only touch their own bookmarks.
alter table public.user_bookmarks enable row level security;

drop policy if exists user_bookmarks_select_own on public.user_bookmarks;
create policy user_bookmarks_select_own on public.user_bookmarks
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_bookmarks_insert_own on public.user_bookmarks;
create policy user_bookmarks_insert_own on public.user_bookmarks
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_bookmarks_delete_own on public.user_bookmarks;
create policy user_bookmarks_delete_own on public.user_bookmarks
  for delete to authenticated
  using (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- toggle_bookmark
--   Inserts if missing, deletes if present. Returns new bookmarked state.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.toggle_bookmark(
  p_source_type text,
  p_source_id text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id into existing_id
    from public.user_bookmarks
    where user_id = uid
      and source_type = p_source_type
      and source_id = p_source_id
    limit 1;

  if existing_id is not null then
    delete from public.user_bookmarks where id = existing_id;
    return false;
  end if;

  insert into public.user_bookmarks (user_id, source_type, source_id)
    values (uid, p_source_type, p_source_id);
  return true;
end;
$$;

grant execute on function public.toggle_bookmark(text, text) to authenticated;
