-- ============================================================================
-- LAW.OS — 004_hybrid_search.sql
-- Version: 1.0
-- Created: 2026-04-17
-- Description: Hybrid lexical + vector search via Reciprocal Rank Fusion (RRF).
--              Returns merged results from:
--                - Lexical scan (ilike over title/body/article/case fields)
--                - Vector cosine similarity on embeddings
--              RRF formula: score = sum(1.0 / (k + rank_i)) over each source.
--              Embeddings default to NULL — the function gracefully skips
--              the vector branch when no embedding is provided.
-- Apply: paste into Supabase SQL editor.
-- ============================================================================

-- RRF constant. 60 is the de facto standard (Cormack et al. 2009).
-- Lower k  -> top ranks dominate more.
-- Higher k -> more democratic merge.
create or replace function public._rrf_score(rank integer, k integer default 60)
returns double precision language sql immutable parallel safe as $$
  select case when rank is null then 0.0 else 1.0 / (k + rank) end;
$$;

-- Re-applying this file drops & recreates because the RETURNS TABLE signature
-- changed (row_number() returns bigint; must cast to integer in final SELECT).
-- CREATE OR REPLACE cannot change output column types, hence explicit DROP.
drop function if exists public.hybrid_search_statutes(text, text[], vector, text, integer, integer, integer);
drop function if exists public.hybrid_search_cases(text, text[], vector, text, integer, integer);

-- ───────────────────────────────────────────────────────────────────────────
-- hybrid_search_statutes
--   Returns statutes ranked by fused (lexical, vector) RRF score.
--   p_query_embedding may be NULL; in that case it behaves like pure lexical.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.hybrid_search_statutes(
  p_query_text text,
  p_tokens text[] default array[]::text[],
  p_query_embedding vector(3072) default null,
  p_code text default null,
  p_article integer default null,
  p_match_count integer default 10,
  p_candidate_count integer default 60
)
returns table (
  id text,
  code text,
  code_kr text,
  article_no text,
  article_no_int integer,
  title text,
  body text,
  part text,
  chapter text,
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
    -- Lexical candidate set — mirrors the existing ilike logic.
    lexical_candidates as (
      select
        s.id,
        s.code,
        s.code_kr,
        s.article_no,
        s.article_no_int,
        s.title,
        s.body,
        s.part,
        s.chapter,
        -- Heuristic score identical in spirit to _score_statute_row() in search.py.
        (
          case when p_code is not null and s.code = p_code then 0.35 else 0 end +
          case when p_article is not null and s.article_no_int = p_article then 0.45 else 0 end +
          case when normalized <> '' and position(normalized in lower(coalesce(s.title, ''))) > 0 then 0.22 else 0 end +
          case when normalized <> '' and position(normalized in lower(coalesce(s.body, ''))) > 0 then 0.12 else 0 end +
          coalesce((
            select sum(
              case when position(t in lower(coalesce(s.title, ''))) > 0 then 0.10 else 0 end +
              case when position(t in lower(coalesce(s.article_no, ''))) > 0 then 0.12 else 0 end +
              case when position(t in lower(coalesce(s.body, ''))) > 0 then 0.04 else 0 end
            )
            from unnest(p_tokens) as t
          ), 0)
        ) as lex_score
      from public.statutes s
      where
        (p_code is null or s.code = p_code)
        and (p_article is null or s.article_no_int = p_article)
        and (
          coalesce(array_length(p_tokens, 1), 0) = 0
          or exists (
            select 1 from unnest(p_tokens) as t
            where
              s.title ilike '%' || t || '%'
              or s.body ilike '%' || t || '%'
              or s.article_no ilike '%' || t || '%'
          )
        )
    ),
    lexical_ranked as (
      select
        c.*,
        row_number() over (order by c.lex_score desc, c.article_no_int desc) as lex_rank
      from lexical_candidates c
      where c.lex_score > 0
      limit p_candidate_count
    ),
    -- Vector candidate set — skipped when embedding is null.
    vector_ranked as (
      select
        s.id,
        s.code,
        s.code_kr,
        s.article_no,
        s.article_no_int,
        s.title,
        s.body,
        s.part,
        s.chapter,
        row_number() over (order by s.embedding <=> p_query_embedding) as vec_rank
      from public.statutes s
      where
        p_query_embedding is not null
        and s.embedding is not null
        and (p_code is null or s.code = p_code)
        and (p_article is null or s.article_no_int = p_article)
      order by s.embedding <=> p_query_embedding
      limit p_candidate_count
    ),
    merged as (
      select
        coalesce(l.id, v.id) as id,
        coalesce(l.code, v.code) as code,
        coalesce(l.code_kr, v.code_kr) as code_kr,
        coalesce(l.article_no, v.article_no) as article_no,
        coalesce(l.article_no_int, v.article_no_int) as article_no_int,
        coalesce(l.title, v.title) as title,
        coalesce(l.body, v.body) as body,
        coalesce(l.part, v.part) as part,
        coalesce(l.chapter, v.chapter) as chapter,
        -- row_number() returns bigint; cast down to integer for return-type match.
        l.lex_rank::integer as lexical_rank,
        v.vec_rank::integer as vector_rank,
        public._rrf_score(l.lex_rank::int) + public._rrf_score(v.vec_rank::int) as rrf_score
      from lexical_ranked l
      full outer join vector_ranked v on v.id = l.id
    )
  select
    m.id,
    m.code,
    m.code_kr,
    m.article_no,
    m.article_no_int,
    m.title,
    m.body,
    m.part,
    m.chapter,
    m.lexical_rank,
    m.vector_rank,
    m.rrf_score
  from merged m
  where m.id is not null
  order by m.rrf_score desc, m.article_no_int desc nulls last
  limit p_match_count;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- hybrid_search_cases
-- ───────────────────────────────────────────────────────────────────────────
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
        c.id,
        c.case_no,
        c.court,
        c.decided_at,
        c.category,
        c.summary,
        c.judgment_points,
        (
          case when p_category is not null and c.category = p_category then 0.18 else 0 end +
          coalesce((
            select sum(
              (case when position(normalized in lower(coalesce(c.case_no, ''))) > 0 then 0.20 else 0 end) +
              (case when position(normalized in lower(coalesce(c.summary, ''))) > 0 then 0.20 else 0 end) +
              (case when position(normalized in lower(coalesce(c.judgment_points, ''))) > 0 then 0.20 else 0 end)
            )
            from (select 1) _
            where normalized <> ''
          ), 0) +
          coalesce((
            select sum(
              case when position(t in lower(coalesce(c.case_no, ''))) > 0 then 0.06 else 0 end +
              case when position(t in lower(coalesce(c.summary, ''))) > 0 then 0.06 else 0 end +
              case when position(t in lower(coalesce(c.judgment_points, ''))) > 0 then 0.06 else 0 end
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
        c.id,
        c.case_no,
        c.court,
        c.decided_at,
        c.category,
        c.summary,
        c.judgment_points,
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
        -- row_number() returns bigint; cast down to integer for return-type match.
        l.lex_rank::integer as lexical_rank,
        v.vec_rank::integer as vector_rank,
        public._rrf_score(l.lex_rank::int) + public._rrf_score(v.vec_rank::int) as rrf_score
      from lexical_ranked l
      full outer join vector_ranked v on v.id = l.id
    )
  select
    m.id,
    m.case_no,
    m.court,
    m.decided_at,
    m.category,
    m.summary,
    m.judgment_points,
    m.lexical_rank,
    m.vector_rank,
    m.rrf_score
  from merged m
  where m.id is not null
  order by m.rrf_score desc, m.decided_at desc nulls last
  limit p_match_count;
end;
$$;

grant execute on function public.hybrid_search_statutes(text, text[], vector, text, integer, integer, integer) to authenticated, service_role;
grant execute on function public.hybrid_search_cases(text, text[], vector, text, integer, integer) to authenticated, service_role;

-- ============================================================================
-- Optional: vector indexes (apply AFTER embedding backfill)
-- ----------------------------------------------------------------------------
-- HNSW is preferred but pgvector versions before 0.7 cap dimensions at 2000.
-- Since statutes.embedding / cases.embedding use vector(3072) (matching Gemini
-- gemini-embedding-001 3072-dim output), use ivfflat which supports higher dims.
--
-- Run ONCE after `python3 scripts/sync_law_data.py --with-precedents --embed`
-- has finished producing embeddings.
--
--   create index if not exists idx_statutes_embedding_ivfflat
--     on public.statutes
--     using ivfflat (embedding vector_cosine_ops)
--     with (lists = 100);
--
--   create index if not exists idx_cases_embedding_ivfflat
--     on public.cases
--     using ivfflat (embedding vector_cosine_ops)
--     with (lists = 50);
--
-- Rule of thumb for `lists`: sqrt(row_count). 민법 1118조 + 타 3법 → ~10k 기준
-- 100이 적절. cases는 seed 기준 수백~수천 → 50.
-- ============================================================================
