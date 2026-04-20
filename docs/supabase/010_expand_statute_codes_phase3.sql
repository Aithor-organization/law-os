-- Phase 3: 층간소음 / 학교폭력 / 소년 관련 법령 코드 추가.
-- apartment_management (공동주택관리법), noise_control (소음ㆍ진동관리법),
-- school_violence (학교폭력예방 및 대책에 관한 법률), juvenile (소년법)

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
    'medical',
    'apartment_management',
    'noise_control',
    'school_violence',
    'juvenile'
  ));
