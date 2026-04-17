-- ============================================================================
-- LAW.OS — 007_hybrid_cases_fix.sql
-- Created: 2026-04-17
-- Description: Fix for hybrid_search_cases: the "sum() over (select 1)" pattern
--              referenced correlated columns from outer scope, causing
--              "column c.id must appear in GROUP BY". Replaced with simple
--              conditional arithmetic (there was only one row to "sum" anyway).
-- Apply: Supabase SQL Editor → paste and execute.
-- ============================================================================

drop function if exists public.hybrid_search_cases(text, text[], vector, text, integer, integer);

create or replace function public.hybrid_search_cases(
  p_query_text text,
  p_tokens text[] default array[]::text[],
  p_query_embedding vector(3072) default null,
  p_category text default null,
  p_match_count integer default 10,
  p_candidate_count integer default 60
)
returns table (
  id text,
  case_no text,
  court text,
  decided_at date,
  category text,
  summary text,
  judgment_points text,
  lexical_rank integer,
  vector_rank integer,
  rrf_score double precision
)
language plpgsql
stable
parallel safe
set search_path = public
as $$
declare
  normalized text := lower(coalesce(p_query_text, ''));
begin
  return query
  with
    lexical_candidates as (
      select
        c.id, c.case_no, c.court, c.decided_at, c.category, c.summary, c.judgment_points,
        (
          case when p_category is not null and c.category = p_category then 0.18 else 0 end
          + case when normalized <> '' then
              (case when position(normalized in lower(coalesce(c.case_no, '')))         > 0 then 0.20 else 0 end)
            + (case when position(normalized in lower(coalesce(c.summary, '')))         > 0 then 0.20 else 0 end)
            + (case when position(normalized in lower(coalesce(c.judgment_points, ''))) > 0 then 0.20 else 0 end)
            else 0 end
          + coalesce((
              select sum(
                case when position(t in lower(coalesce(c.case_no, ''))) > 0 then 0.06 else 0 end
                + case when position(t in lower(coalesce(c.summary, ''))) > 0 then 0.06 else 0 end
                + case when position(t in lower(coalesce(c.judgment_points, ''))) > 0 then 0.06 else 0 end
              )
              from unnest(p_tokens[1:6]) as t
            ), 0)
        ) as lex_score
      from public.cases c
      where
        (p_category is null or c.category = p_category)
        and (
          coalesce(array_length(p_tokens, 1), 0) = 0
          or exists (
            select 1 from unnest(p_tokens) as t
            where
              c.case_no ilike '%' || t || '%'
              or c.summary ilike '%' || t || '%'
              or c.judgment_points ilike '%' || t || '%'
          )
        )
    ),
    lexical_ranked as (
      select c.*, row_number() over (order by c.lex_score desc, c.decided_at desc) as lex_rank
      from lexical_candidates c
      where c.lex_score > 0
      limit p_candidate_count
    ),
    vector_ranked as (
      select
        c.id, c.case_no, c.court, c.decided_at, c.category, c.summary, c.judgment_points,
        row_number() over (order by c.embedding <=> p_query_embedding) as vec_rank
      from public.cases c
      where
        p_query_embedding is not null
        and c.embedding is not null
        and (p_category is null or c.category = p_category)
      order by c.embedding <=> p_query_embedding
      limit p_candidate_count
    ),
    merged as (
      select
        coalesce(l.id, v.id) as id,
        coalesce(l.case_no, v.case_no) as case_no,
        coalesce(l.court, v.court) as court,
        coalesce(l.decided_at, v.decided_at) as decided_at,
        coalesce(l.category, v.category) as category,
        coalesce(l.summary, v.summary) as summary,
        coalesce(l.judgment_points, v.judgment_points) as judgment_points,
        l.lex_rank::integer as lexical_rank,
        v.vec_rank::integer as vector_rank,
        public._rrf_score(l.lex_rank::int) + public._rrf_score(v.vec_rank::int) as rrf_score
      from lexical_ranked l
      full outer join vector_ranked v on v.id = l.id
    )
  select
    m.id, m.case_no, m.court, m.decided_at, m.category, m.summary, m.judgment_points,
    m.lexical_rank, m.vector_rank, m.rrf_score
  from merged m
  where m.id is not null
  order by m.rrf_score desc, m.decided_at desc nulls last
  limit p_match_count;
end;
$$;

grant execute on function public.hybrid_search_cases(text, text[], vector, text, integer, integer) to authenticated, service_role;
