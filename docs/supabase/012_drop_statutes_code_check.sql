-- Phase 2: statutes.code CHECK 제약 제거.
-- Reason: 사용자 구독 시 lazy ingest로 새 code가 들어오는데, CHECK가 차단함.
-- 대신 law_catalog가 "허용된 code" 소스가 되어 데이터 무결성을 보장
-- (subscribe() 시 catalog 존재 확인).

alter table public.statutes
  drop constraint if exists statutes_code_check;
