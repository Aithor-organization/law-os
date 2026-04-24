-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 013: study_activities increment RPC
-- ───────────────────────────────────────────────────────────────────────────
-- Atomic upsert + increment helper for the per-day activity counters that
-- back the streak calculator and library dashboard. Called from the mobile
-- lib/studyActivity.ts helper on every question/note/review action.
--
-- The function authorizes against auth.uid() so a malicious client cannot
-- pass an arbitrary user_id. Fails closed when there is no session.
--
-- Fields supported: questions_asked, notes_saved, reviews_completed.
-- The mobile helper passes the field name as a text argument and this
-- function validates against the allowlist before building dynamic SQL.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.increment_study_activity(
  p_user_id uuid,
  p_activity_date date,
  p_field text,
  p_increment integer default 1
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null or v_caller <> p_user_id then
    raise exception 'unauthorized: caller % cannot increment for %', v_caller, p_user_id
      using errcode = '42501';
  end if;

  if p_field not in ('questions_asked', 'notes_saved', 'reviews_completed', 'minutes_spent') then
    raise exception 'invalid field: %', p_field using errcode = '22023';
  end if;

  if p_increment is null or p_increment < 0 then
    raise exception 'increment must be non-negative, got %', p_increment using errcode = '22023';
  end if;

  if p_field = 'questions_asked' then
    insert into public.study_activities (user_id, activity_date, questions_asked)
      values (p_user_id, p_activity_date, p_increment)
      on conflict (user_id, activity_date)
      do update set questions_asked = study_activities.questions_asked + p_increment;
  elsif p_field = 'notes_saved' then
    insert into public.study_activities (user_id, activity_date, notes_saved)
      values (p_user_id, p_activity_date, p_increment)
      on conflict (user_id, activity_date)
      do update set notes_saved = study_activities.notes_saved + p_increment;
  elsif p_field = 'reviews_completed' then
    insert into public.study_activities (user_id, activity_date, reviews_completed)
      values (p_user_id, p_activity_date, p_increment)
      on conflict (user_id, activity_date)
      do update set reviews_completed = study_activities.reviews_completed + p_increment;
  elsif p_field = 'minutes_spent' then
    insert into public.study_activities (user_id, activity_date, minutes_spent)
      values (p_user_id, p_activity_date, p_increment)
      on conflict (user_id, activity_date)
      do update set minutes_spent = study_activities.minutes_spent + p_increment;
  end if;
end;
$$;

grant execute on function public.increment_study_activity(uuid, date, text, integer) to authenticated;
