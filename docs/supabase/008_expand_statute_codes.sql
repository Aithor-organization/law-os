-- Expand statutes.code check constraint to include traffic-related laws.
-- Motivation: RAG retrieval for 교통사고/어린이보호구역/민식이법 queries returned
-- irrelevant citations because the relevant statutes (도로교통법, 교통사고처리특례법,
-- 특정범죄 가중처벌 등에 관한 법률) weren't ingested — ingestion was blocked by the
-- original CHECK constraint allowing only civil|criminal|constitutional|commercial.

alter table public.statutes
  drop constraint if exists statutes_code_check;

alter table public.statutes
  add constraint statutes_code_check
  check (code in (
    'civil',
    'criminal',
    'constitutional',
    'commercial',
    'traffic',
    'traffic_special',
    'special_aggravated'
  ));
