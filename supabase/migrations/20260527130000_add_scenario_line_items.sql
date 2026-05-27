create table if not exists public.scenario_line_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  version_id uuid not null references public.versions(id) on delete restrict,
  target_year_month date not null,
  amount numeric(14,2) not null default 0,
  quantity numeric(14,2),
  unit_price numeric(14,2),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_id, account_id, organization_id, version_id, target_year_month)
);

create index if not exists idx_scenario_line_items_scenario_id on public.scenario_line_items(scenario_id);

alter table public.scenario_line_items enable row level security;

create policy "scenario_line_items_select_own" on public.scenario_line_items
  for select using (auth.uid() = owner_user_id);

create policy "scenario_line_items_insert_own" on public.scenario_line_items
  for insert with check (auth.uid() = owner_user_id);

create policy "scenario_line_items_update_own" on public.scenario_line_items
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "scenario_line_items_delete_own" on public.scenario_line_items
  for delete using (auth.uid() = owner_user_id);
