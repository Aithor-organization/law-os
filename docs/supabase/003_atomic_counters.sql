-- ============================================================================
-- LAW.OS — 003_atomic_counters.sql
-- Version: 1.0
-- Created: 2026-04-17
-- Description: Atomic counter RPCs for search_analytics and conversations.
--              Removes read-modify-write race conditions from the API layer.
-- Apply: supabase db push OR paste into Supabase SQL editor.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- upsert_search_analytics
--   Atomic upsert on (normalized_query, category) with count increment.
--   Returns the updated row.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.upsert_search_analytics(
  p_query text,
  p_normalized_query text,
  p_category text,
  p_now timestamptz default now()
)
returns public.search_analytics
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.search_analytics;
begin
  insert into public.search_analytics (
    query,
    normalized_query,
    category,
    search_count,
    last_searched_at
  )
  values (
    p_query,
    p_normalized_query,
    p_category,
    1,
    p_now
  )
  on conflict (normalized_query, category)
  do update set
    search_count = public.search_analytics.search_count + 1,
    last_searched_at = excluded.last_searched_at
  returning * into result;

  return result;
end;
$$;

-- Make sure the unique constraint the upsert depends on exists.
-- If the table already has a different unique index, drop this statement.
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'search_analytics'
      and indexname = 'search_analytics_normalized_query_category_key'
  ) then
    alter table public.search_analytics
      add constraint search_analytics_normalized_query_category_key
      unique (normalized_query, category);
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- increment_conversation_message_count
--   Atomically increments message_count and updates last_message_at.
--   Returns the updated row.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.increment_conversation_message_count(
  p_conversation_id uuid,
  p_increment integer default 1,
  p_now timestamptz default now()
)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.conversations;
begin
  update public.conversations
  set
    message_count = message_count + p_increment,
    last_message_at = p_now,
    updated_at = p_now
  where id = p_conversation_id
  returning * into result;

  return result;
end;
$$;

-- Allow authenticated users to invoke the conversation RPC on their own rows.
-- search_analytics RPC is service_role only (called from backend).
grant execute on function public.increment_conversation_message_count(uuid, integer, timestamptz) to authenticated;
grant execute on function public.upsert_search_analytics(text, text, text, timestamptz) to service_role;
