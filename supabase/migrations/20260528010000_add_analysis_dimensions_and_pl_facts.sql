create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.analysis_dimensions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  key text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, key)
);

create table if not exists public.analysis_dimension_values (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  analysis_dimension_id uuid not null references public.analysis_dimensions(id) on delete cascade,
  code text,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(analysis_dimension_id, name),
  unique(analysis_dimension_id, code)
);

create table if not exists public.pl_facts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  account_key text not null,
  account_name text not null,
  account_type text not null,
  organization_key text not null default 'all',
  organization_name text not null default 'All',
  version text not null,
  target_month date not null,
  amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pl_fact_dimension_values (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  pl_fact_id uuid not null references public.pl_facts(id) on delete cascade,
  analysis_dimension_id uuid not null references public.analysis_dimensions(id) on delete cascade,
  analysis_dimension_value_id uuid not null references public.analysis_dimension_values(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_dimensions_owner_user_id on public.analysis_dimensions(owner_user_id);
create index if not exists idx_analysis_dimensions_owner_user_id_key on public.analysis_dimensions(owner_user_id, key);
create index if not exists idx_analysis_dimension_values_owner_user_id on public.analysis_dimension_values(owner_user_id);
create index if not exists idx_analysis_dimension_values_dimension_id on public.analysis_dimension_values(analysis_dimension_id);
create index if not exists idx_pl_facts_owner_user_id on public.pl_facts(owner_user_id);
create index if not exists idx_pl_facts_owner_user_id_version on public.pl_facts(owner_user_id, version);
create index if not exists idx_pl_facts_owner_user_id_target_month on public.pl_facts(owner_user_id, target_month);
create index if not exists idx_pl_facts_owner_user_id_account_key on public.pl_facts(owner_user_id, account_key);
create index if not exists idx_pl_fact_dimension_values_owner_user_id on public.pl_fact_dimension_values(owner_user_id);
create index if not exists idx_pl_fact_dimension_values_pl_fact_id on public.pl_fact_dimension_values(pl_fact_id);
create index if not exists idx_pl_fact_dimension_values_dimension_id on public.pl_fact_dimension_values(analysis_dimension_id);
create index if not exists idx_pl_fact_dimension_values_dimension_value_id on public.pl_fact_dimension_values(analysis_dimension_value_id);

create trigger trg_analysis_dimensions_set_updated_at before update on public.analysis_dimensions for each row execute function public.set_updated_at();
create trigger trg_analysis_dimension_values_set_updated_at before update on public.analysis_dimension_values for each row execute function public.set_updated_at();
create trigger trg_pl_facts_set_updated_at before update on public.pl_facts for each row execute function public.set_updated_at();

alter table public.analysis_dimensions enable row level security;
alter table public.analysis_dimension_values enable row level security;
alter table public.pl_facts enable row level security;
alter table public.pl_fact_dimension_values enable row level security;

drop policy if exists analysis_dimensions_select_own on public.analysis_dimensions;
create policy analysis_dimensions_select_own on public.analysis_dimensions for select using (auth.uid() = owner_user_id);
drop policy if exists analysis_dimensions_insert_own on public.analysis_dimensions;
create policy analysis_dimensions_insert_own on public.analysis_dimensions for insert with check (auth.uid() = owner_user_id);
drop policy if exists analysis_dimensions_update_own on public.analysis_dimensions;
create policy analysis_dimensions_update_own on public.analysis_dimensions for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists analysis_dimensions_delete_own on public.analysis_dimensions;
create policy analysis_dimensions_delete_own on public.analysis_dimensions for delete using (auth.uid() = owner_user_id);

drop policy if exists analysis_dimension_values_select_own on public.analysis_dimension_values;
create policy analysis_dimension_values_select_own on public.analysis_dimension_values for select using (auth.uid() = owner_user_id);
drop policy if exists analysis_dimension_values_insert_own on public.analysis_dimension_values;
create policy analysis_dimension_values_insert_own on public.analysis_dimension_values for insert with check (auth.uid() = owner_user_id);
drop policy if exists analysis_dimension_values_update_own on public.analysis_dimension_values;
create policy analysis_dimension_values_update_own on public.analysis_dimension_values for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists analysis_dimension_values_delete_own on public.analysis_dimension_values;
create policy analysis_dimension_values_delete_own on public.analysis_dimension_values for delete using (auth.uid() = owner_user_id);

drop policy if exists pl_facts_select_own on public.pl_facts;
create policy pl_facts_select_own on public.pl_facts for select using (auth.uid() = owner_user_id);
drop policy if exists pl_facts_insert_own on public.pl_facts;
create policy pl_facts_insert_own on public.pl_facts for insert with check (auth.uid() = owner_user_id);
drop policy if exists pl_facts_update_own on public.pl_facts;
create policy pl_facts_update_own on public.pl_facts for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists pl_facts_delete_own on public.pl_facts;
create policy pl_facts_delete_own on public.pl_facts for delete using (auth.uid() = owner_user_id);

drop policy if exists pl_fact_dimension_values_select_own on public.pl_fact_dimension_values;
create policy pl_fact_dimension_values_select_own on public.pl_fact_dimension_values for select using (auth.uid() = owner_user_id);
drop policy if exists pl_fact_dimension_values_insert_own on public.pl_fact_dimension_values;
create policy pl_fact_dimension_values_insert_own on public.pl_fact_dimension_values for insert with check (auth.uid() = owner_user_id);
drop policy if exists pl_fact_dimension_values_update_own on public.pl_fact_dimension_values;
create policy pl_fact_dimension_values_update_own on public.pl_fact_dimension_values for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists pl_fact_dimension_values_delete_own on public.pl_fact_dimension_values;
create policy pl_fact_dimension_values_delete_own on public.pl_fact_dimension_values for delete using (auth.uid() = owner_user_id);
