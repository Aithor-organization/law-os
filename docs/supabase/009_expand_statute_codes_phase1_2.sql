-- Expand statutes.code check constraint to include Phase 1 + Phase 2 law codes.
-- Phase 1 (변시 필수 + 생활밀착): civil_proc, criminal_proc, admin_basic, admin_proc,
--   housing_rental, labor_standards, privacy
-- Phase 2 (도메인 특화): commercial_rental, family_proc, info_network,
--   domestic_violence, sexual_violence, youth_protection, capital_market,
--   bankruptcy, medical

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
    'special_aggravated',
    'civil_proc',
    'criminal_proc',
    'admin_basic',
    'admin_proc',
    'housing_rental',
    'labor_standards',
    'privacy',
    'commercial_rental',
    'family_proc',
    'info_network',
    'domestic_violence',
    'sexual_violence',
    'youth_protection',
    'capital_market',
    'bankruptcy',
    'medical'
  ));
