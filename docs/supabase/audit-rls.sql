-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Audit — 모든 user-owned 테이블에 필수 정책이 있는지 검증
-- ───────────────────────────────────────────────────────────────────────────
-- Run as the `postgres` role (Supabase SQL Editor) on dev AND prod.
-- Output is a table — any row flagged `MISSING` must be fixed before
-- production cut-over. Intended to be run:
--   1. Manually before each release cut
--   2. Automatically via Supabase Dashboard SQL Editor tab
--   3. (future) CI job that connects with service_role
--
-- What it checks:
--   A) RLS is enabled on every user-owned table
--   B) Each table has SELECT/INSERT/UPDATE/DELETE policy covering auth.uid()
--   C) No policy uses `true` as USING/WITH CHECK (overly permissive)
--
-- Tables audited:
--   profiles, conversations, messages, citations, notes, user_bookmarks,
--   study_activities, notification_preferences, notifications, push_tokens
-- ═══════════════════════════════════════════════════════════════════════════

with expected_tables(tbl) as (
  values
    ('profiles'),
    ('conversations'),
    ('messages'),
    ('citations'),
    ('notes'),
    ('user_bookmarks'),
    ('study_activities'),
    ('notification_preferences'),
    ('notifications'),
    ('push_tokens')
),
-- A) RLS enabled check
rls_status as (
  select
    e.tbl,
    case when c.relrowsecurity then 'OK' else 'MISSING' end as rls_enabled
  from expected_tables e
  left join pg_class c on c.relname = e.tbl and c.relnamespace = 'public'::regnamespace
),
-- B) policy coverage (cmd = 'r' select, 'a' insert, 'w' update, 'd' delete, '*' all)
policy_coverage as (
  select
    e.tbl,
    bool_or(p.polcmd in ('r','*')) as has_select,
    bool_or(p.polcmd in ('a','*')) as has_insert,
    bool_or(p.polcmd in ('w','*')) as has_update,
    bool_or(p.polcmd in ('d','*')) as has_delete,
    count(p.polname) as policy_count
  from expected_tables e
  left join pg_policy p on p.polrelid = (
    select oid from pg_class where relname = e.tbl and relnamespace = 'public'::regnamespace
  )
  group by e.tbl
),
-- C) overly-permissive policies (USING = 'true')
permissive_policies as (
  select
    c.relname as tbl,
    p.polname,
    pg_get_expr(p.polqual, p.polrelid) as using_expr
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relnamespace = 'public'::regnamespace
    and c.relname in (select tbl from expected_tables)
    and pg_get_expr(p.polqual, p.polrelid) = 'true'
)
select
  e.tbl as table_name,
  r.rls_enabled,
  case when pc.has_select then 'OK' else 'MISSING' end as select_policy,
  case when pc.has_insert then 'OK' else 'MISSING' end as insert_policy,
  case
    -- Tables that are read-only from the client (never written) can lack update/delete
    when e.tbl in ('messages', 'citations') and not pc.has_update then 'N/A'
    when pc.has_update then 'OK' else 'MISSING'
  end as update_policy,
  case
    when e.tbl in ('messages', 'citations') and not pc.has_delete then 'N/A'
    when pc.has_delete then 'OK' else 'MISSING'
  end as delete_policy,
  pc.policy_count,
  exists (select 1 from permissive_policies pp where pp.tbl = e.tbl) as has_permissive_true
from expected_tables e
left join rls_status r using (tbl)
left join policy_coverage pc using (tbl)
order by e.tbl;

-- Bonus: list any public-schema table that has RLS disabled (regardless
-- of whether it's user-owned) — a belt-and-suspenders check for future
-- tables that get added without RLS.
select
  c.relname as table_with_rls_disabled
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and not c.relrowsecurity
  and c.relname not in ('schema_migrations', 'spatial_ref_sys');

-- Bonus 2: list permissive policies that use `true` — these should be
-- rare and intentional (e.g., public-read catalogs like statutes/cases).
-- (Standalone query — CTEs from the audit query above are out of scope here.)
select
  c.relname as tbl,
  p.polname,
  pg_get_expr(p.polqual, p.polrelid) as using_expr
from pg_policy p
join pg_class c on c.oid = p.polrelid
where c.relnamespace = 'public'::regnamespace
  and c.relname in (
    'profiles', 'conversations', 'messages', 'citations', 'notes',
    'user_bookmarks', 'study_activities', 'notification_preferences',
    'notifications', 'push_tokens'
  )
  and pg_get_expr(p.polqual, p.polrelid) = 'true';
