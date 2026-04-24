-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 014: Account deletion RPC
-- ───────────────────────────────────────────────────────────────────────────
-- PIPA §21 (개인정보 파기) requires that users can request immediate
-- erasure of their personal data. This RPC performs a transactional
-- cascade delete across all user-owned rows and finally the auth.users
-- row itself. The client follows up with supabase.auth.signOut() to
-- clear the local session.
--
-- Security: auth.uid() is used as the target and no parameter is taken,
-- so a malicious client cannot delete another user's data.
--
-- Cascade coverage (all FKs to auth.users are `on delete cascade` in
-- 001_initial_schema.sql, so deleting the auth row would work too — but
-- we explicitly delete child rows first to (a) make intent visible,
-- (b) avoid relying on cascade if schema drifts, and (c) let us return
-- a count of deleted rows for audit logging if needed later).
--
-- Important: this RPC runs as SECURITY DEFINER because it must delete
-- from auth.users. Make sure to review the search_path and grants.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'unauthorized: no active session' using errcode = '42501';
  end if;

  -- Child rows first — explicit even though FK cascades would handle it.
  delete from public.notes where user_id = v_user;
  delete from public.user_bookmarks where user_id = v_user;
  delete from public.study_activities where user_id = v_user;
  delete from public.notifications where user_id = v_user;
  delete from public.notification_preferences where user_id = v_user;
  -- push_tokens table is introduced in 015_push_tokens.sql. Guarded with
  -- IF EXISTS so this RPC still applies on databases that have not yet
  -- run migration 015.
  if to_regclass('public.push_tokens') is not null then
    delete from public.push_tokens where user_id = v_user;
  end if;

  -- Conversations cascade-delete their messages and citations via FK.
  delete from public.conversations where user_id = v_user;

  -- Profile (1:1 with auth.users).
  delete from public.profiles where id = v_user;

  -- Finally the auth row. This revokes all sessions / refresh tokens.
  delete from auth.users where id = v_user;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
