create extension if not exists pgcrypto;

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null,
  name text not null,
  target_year_month date not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity numeric(14,2) not null check (quantity >= 0),
  variable_cost_per_unit numeric(14,2) not null check (variable_cost_per_unit >= 0),
  fixed_cost numeric(14,2) not null check (fixed_cost >= 0),
  note text,
  status text not null check (status in ('draft', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenario_tags (
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (scenario_id, tag_id)
);

create index if not exists idx_scenarios_target_year_month on public.scenarios(target_year_month);
create index if not exists idx_scenarios_status on public.scenarios(status);
create index if not exists idx_scenario_tags_tag_id on public.scenario_tags(tag_id);
