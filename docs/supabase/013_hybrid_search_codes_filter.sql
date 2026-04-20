-- Phase 3: hybrid_search_statutes에 p_codes text[] 추가.
-- 목적: 사용자가 구독한 법령 code 배열을 받아 statutes.code IN (...) 필터 적용.
-- 기존 p_code 파라미터는 하위호환 위해 유지 (nullable).

-- 1) 기존 시그니처 drop
drop function if exists public.hybrid_search_statutes(text, text[], vector, text, integer, integer, integer);

-- 2) 새 시그니처: p_codes text[] 추가
create or replace function public.hybrid_search_statutes(
  p_query_text text,
  p_tokens text[] default array[]::text[],
  p_query_embedding vector(3072) default null,
  p_code text default null,
  p_article integer default null,
  p_match_count integer default 10,
  p_candidate_count integer default 60,
  p_codes text[] default null
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
    lexical_candidates as (
      select
        s.id, s.code, s.code_kr, s.article_no, s.article_no_int, s.title,
        s.body, s.part, s.chapter,
        (
          case when p_code is not null and s.code = p_code then 0.35 else 0 end +
          case when p_article is not null and s.article_no_int = p_article then 0.45 else 0 end +
          case when normalized <> '' and position(normalized in lower(coalesce(s.title, ''))) > 0 then 0.22 else 0 end +
          case when normalized <> '' and position(normalized in lower(coalesce(s.body,  ''))) > 0 then 0.12 else 0 end +
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
        and (p_codes is null or s.code = any(p_codes))
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
      select c.*, row_number() over (order by c.lex_score desc, c.article_no_int desc) as lex_rank
      from lexical_candidates c
      where c.lex_score > 0
      limit p_candidate_count
    ),
    vector_ranked as (
      select
        s.id, s.code, s.code_kr, s.article_no, s.article_no_int, s.title,
        s.body, s.part, s.chapter,
        row_number() over (order by s.embedding <=> p_query_embedding) as vec_rank
      from public.statutes s
      where
        p_query_embedding is not null
        and s.embedding is not null
        and (p_code is null or s.code = p_code)
        and (p_codes is null or s.code = any(p_codes))
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
        l.lex_rank::integer as lexical_rank,
        v.vec_rank::integer as vector_rank,
        public._rrf_score(l.lex_rank::int) + public._rrf_score(v.vec_rank::int) as rrf_score
      from lexical_ranked l
      full outer join vector_ranked v on v.id = l.id
    )
  select
    m.id, m.code, m.code_kr, m.article_no, m.article_no_int, m.title,
    m.body, m.part, m.chapter, m.lexical_rank, m.vector_rank, m.rrf_score
  from merged m
  where m.id is not null
  order by m.rrf_score desc, m.article_no_int desc nulls last
  limit p_match_count;
end;
$$;

grant execute on function public.hybrid_search_statutes(text, text[], vector, text, integer, integer, integer, text[]) to authenticated, service_role;
