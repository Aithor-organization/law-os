-- ============================================================================
-- Migration 016: onboarding_completed + tutorial_completed flags
-- ============================================================================
-- Why:
--  - splash.tsx routed solely on `session ? tabs : login`, ignoring whether
--    onboarding had finished. Force-quitting during onboarding then re-opening
--    landed users in /(tabs) with an incomplete profile.
--  - Adding an explicit flag lets splash route correctly and prepares the
--    schema for Phase 2 (tutorial pages).
--
-- Backfill rationale:
--  - Existing rows where `user_type IS NOT NULL` already finished the legacy
--    onboarding flow under the old logic. Treat them as completed so they
--    don't get bounced back into onboarding on first launch after this ships.
--  - `tutorial_completed` defaults to false for everyone — the tutorial page
--    is new (Phase 2), so even existing users see it once.
-- ============================================================================

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  add column if not exists tutorial_completed boolean not null default false;

-- Backfill: existing users who already filled user_type are considered
-- onboarded under the legacy flow.
update public.profiles
   set onboarding_completed = true
 where user_type is not null
   and onboarding_completed = false;
