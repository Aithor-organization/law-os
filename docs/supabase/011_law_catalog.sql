-- Phase 1: 사용자 선택형 법령 설치 (law_catalog + user_law_subscriptions)
-- 목적: 전체 ~1,600개 법률 메타데이터를 카탈로그에 보관하고, 사용자가 필요한 법령만
--       선택 구독. 구독된 법령 code로 hybrid_search를 필터링하여 RAG 품질 향상.

-- 1) law_catalog: 설치 가능한 모든 법령 메타데이터
create table if not exists public.law_catalog (
  code text primary key,
  korean_name text not null,
  api_title text not null,
  category text not null default 'general',
  description text,
  is_default boolean not null default false,
  loaded boolean not null default false,
  article_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_law_catalog_category on public.law_catalog(category);
create index if not exists idx_law_catalog_is_default on public.law_catalog(is_default) where is_default = true;
create index if not exists idx_law_catalog_loaded on public.law_catalog(loaded);

-- 2) user_law_subscriptions: 사용자별 구독 중인 법령
create table if not exists public.user_law_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null references public.law_catalog(code) on delete cascade,
  subscribed_at timestamptz not null default now(),
  primary key (user_id, code)
);

create index if not exists idx_user_law_subs_user on public.user_law_subscriptions(user_id);

-- 3) RLS: 사용자는 자기 구독만 조회/변경 가능
alter table public.user_law_subscriptions enable row level security;

create policy "users read own subscriptions"
  on public.user_law_subscriptions for select
  using (auth.uid() = user_id);

create policy "users insert own subscriptions"
  on public.user_law_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "users delete own subscriptions"
  on public.user_law_subscriptions for delete
  using (auth.uid() = user_id);

-- 4) 카탈로그는 모든 사용자가 읽기 가능 (공용 카탈로그)
alter table public.law_catalog enable row level security;

create policy "anyone reads catalog"
  on public.law_catalog for select
  using (true);

-- 5) 기존 27개 법령을 카탈로그에 백필 (is_default=true, loaded=true)
insert into public.law_catalog (code, korean_name, api_title, category, is_default, loaded, article_count) values
  -- 기본 4법
  ('civil', '민법', '민법', '기본', true, true, 1193),
  ('criminal', '형법', '형법', '기본', true, true, 401),
  ('constitutional', '헌법', '대한민국헌법', '기본', true, true, 130),
  ('commercial', '상법', '상법', '기본', true, true, 1186),
  -- 교통
  ('traffic', '도로교통법', '도로교통법', '교통', true, true, 214),
  ('traffic_special', '교통사고처리특례법', '교통사고처리 특례법', '교통', true, true, 6),
  ('special_aggravated', '특정범죄가중처벌법', '특정범죄 가중처벌 등에 관한 법률', '교통', true, true, 31),
  -- 소송·행정
  ('civil_proc', '민사소송법', '민사소송법', '소송', true, true, 523),
  ('criminal_proc', '형사소송법', '형사소송법', '소송', true, true, 608),
  ('admin_basic', '행정기본법', '행정기본법', '행정', true, true, 41),
  ('admin_proc', '행정소송법', '행정소송법', '행정', true, true, 46),
  -- 생활
  ('housing_rental', '주택임대차보호법', '주택임대차보호법', '부동산', true, true, 42),
  ('labor_standards', '근로기준법', '근로기준법', '노동', true, true, 132),
  ('privacy', '개인정보보호법', '개인정보 보호법', '개인정보', true, true, 126),
  ('commercial_rental', '상가건물임대차보호법', '상가건물 임대차보호법', '부동산', true, true, 32),
  ('family_proc', '가사소송법', '가사소송법', '가족', true, true, 90),
  ('info_network', '정보통신망법', '정보통신망 이용촉진 및 정보보호 등에 관한 법률', '정보통신', true, true, 142),
  ('medical', '의료법', '의료법', '의료', true, true, 148),
  -- 특례·특수
  ('domestic_violence', '가정폭력처벌특례법', '가정폭력범죄의 처벌 등에 관한 특례법', '특례', true, true, 80),
  ('sexual_violence', '성폭력처벌특례법', '성폭력범죄의 처벌 등에 관한 특례법', '특례', true, true, 76),
  ('youth_protection', '청소년보호법', '청소년 보호법', '특례', true, true, 67),
  ('capital_market', '자본시장법', '자본시장과 금융투자업에 관한 법률', '금융', true, true, 596),
  ('bankruptcy', '채무자회생법', '채무자 회생 및 파산에 관한 법률', '도산', true, true, 699),
  -- 생활 고빈도
  ('apartment_management', '공동주택관리법', '공동주택관리법', '부동산', true, true, 113),
  ('noise_control', '소음·진동관리법', '소음ㆍ진동관리법', '환경', true, true, 75),
  ('school_violence', '학교폭력예방법', '학교폭력예방 및 대책에 관한 법률', '교육', true, true, 43),
  ('juvenile', '소년법', '소년법', '특례', true, true, 79)
on conflict (code) do update set
  korean_name = excluded.korean_name,
  api_title = excluded.api_title,
  category = excluded.category,
  is_default = excluded.is_default,
  loaded = excluded.loaded,
  article_count = excluded.article_count,
  updated_at = now();

-- 6) 모든 기존 사용자에게 기본 법령 27개 자동 구독 (처음 1회 백필)
insert into public.user_law_subscriptions (user_id, code)
select u.id, c.code
  from auth.users u
  cross join public.law_catalog c
  where c.is_default = true
on conflict (user_id, code) do nothing;

-- 7) 신규 회원 가입 시 기본 법령 자동 구독 트리거
create or replace function public.auto_subscribe_default_laws()
returns trigger as $$
begin
  insert into public.user_law_subscriptions (user_id, code)
  select new.id, code from public.law_catalog where is_default = true
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_subscribe_default_laws on auth.users;
create trigger trg_auto_subscribe_default_laws
  after insert on auth.users
  for each row execute function public.auto_subscribe_default_laws();
