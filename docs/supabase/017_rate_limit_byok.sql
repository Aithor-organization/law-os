-- ============================================================================
-- Migration 017: rate limit + BYOK flag + atomic counter RPCs
-- ============================================================================
-- Why:
--  - Backend /chat needs a server-authoritative way to enforce "5 messages
--    per day" for users who have NOT registered their own LLM API key (BYOK).
--  - Daily reset is automatic via comparing free_chat_used_date to today's
--    KST date inside the RPC; no cron job needed.
--  - Ad bonus (+2 per ad view, max 5 ads/day) is tracked separately so the
--    "how many ads did I watch today" counter doesn't get reset by message
--    consumption.
--  - has_byok is a flag the mobile app maintains so other parts of the UI
--    can know whether the user is on BYOK mode without reading SecureStore.
--    Actual API keys are never stored server-side.
-- ============================================================================

alter table public.profiles
  add column if not exists free_chat_used_today int not null default 0;

alter table public.profiles
  add column if not exists free_chat_used_date date not null default current_date;

alter table public.profiles
  add column if not exists ad_bonus_today int not null default 0;

alter table public.profiles
  add column if not exists ad_views_today int not null default 0;

alter table public.profiles
  add column if not exists has_byok boolean not null default false;

-- ────────────────────────────────────────────────────────────────────────────
-- consume_free_chat
-- ────────────────────────────────────────────────────────────────────────────
-- Called from backend /chat ONLY when the request does not carry a BYOK header.
-- - Resets the daily counters if free_chat_used_date != today (KST).
-- - Atomically increments free_chat_used_today.
-- - Returns the new state so the backend can decide whether to allow the call.
--
-- Limit math:
--   allowed_today = 5 (free baseline) + ad_bonus_today (+2 per ad view, max 10)
--   blocked iff free_chat_used_today >= allowed_today
--
-- Returns json so callers can read multiple fields without a second roundtrip.
-- SECURITY DEFINER so any authenticated user can call it for their own row;
-- the WHERE clause locks it to auth.uid().
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.consume_free_chat()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_used int;
  v_bonus int;
  v_allowed int;
  v_blocked boolean;
begin
  if v_user is null then
    raise exception 'no_auth';
  end if;

  -- Reset counters if a new day has started.
  update public.profiles
     set free_chat_used_today = 0,
         ad_bonus_today = 0,
         ad_views_today = 0,
         free_chat_used_date = v_today
   where id = v_user
     and free_chat_used_date <> v_today;

  -- Read current state.
  select free_chat_used_today, ad_bonus_today
    into v_used, v_bonus
    from public.profiles
   where id = v_user;

  v_allowed := 5 + coalesce(v_bonus, 0);
  v_blocked := coalesce(v_used, 0) >= v_allowed;

  if v_blocked then
    return json_build_object(
      'allowed', false,
      'used', v_used,
      'bonus', v_bonus,
      'limit', v_allowed
    );
  end if;

  -- Atomic increment.
  update public.profiles
     set free_chat_used_today = free_chat_used_today + 1
   where id = v_user;

  return json_build_object(
    'allowed', true,
    'used', v_used + 1,
    'bonus', v_bonus,
    'limit', v_allowed
  );
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- grant_ad_bonus
-- ────────────────────────────────────────────────────────────────────────────
-- Called from mobile after a successful AdMob rewarded ad. Adds +2 to today's
-- chat allowance, up to 5 ad views per day (=> +10 max bonus).
-- Returns the new ad_views_today and ad_bonus_today.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.grant_ad_bonus()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_views int;
  v_bonus int;
begin
  if v_user is null then
    raise exception 'no_auth';
  end if;

  -- Reset counters on day change.
  update public.profiles
     set free_chat_used_today = 0,
         ad_bonus_today = 0,
         ad_views_today = 0,
         free_chat_used_date = v_today
   where id = v_user
     and free_chat_used_date <> v_today;

  select ad_views_today into v_views from public.profiles where id = v_user;

  if coalesce(v_views, 0) >= 5 then
    return json_build_object(
      'granted', false,
      'reason', 'daily_ad_limit',
      'ad_views', v_views
    );
  end if;

  update public.profiles
     set ad_views_today = ad_views_today + 1,
         ad_bonus_today = ad_bonus_today + 2
   where id = v_user
   returning ad_views_today, ad_bonus_today
   into v_views, v_bonus;

  return json_build_object(
    'granted', true,
    'ad_views', v_views,
    'bonus', v_bonus
  );
end;
$$;

grant execute on function public.consume_free_chat() to authenticated;
grant execute on function public.grant_ad_bonus() to authenticated;
