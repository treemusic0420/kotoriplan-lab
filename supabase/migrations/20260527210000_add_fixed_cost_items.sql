create table if not exists public.fixed_cost_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  owner_user_id uuid not null,
  name text not null,
  amount numeric(14,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fixed_cost_items_owner_user_id on public.fixed_cost_items(owner_user_id);
create index if not exists idx_fixed_cost_items_scenario_id on public.fixed_cost_items(scenario_id);

alter table public.fixed_cost_items enable row level security;

create policy if not exists "fixed_cost_items_select_own" on public.fixed_cost_items for select using (auth.uid() = owner_user_id);
create policy if not exists "fixed_cost_items_insert_own" on public.fixed_cost_items for insert with check (auth.uid() = owner_user_id);
create policy if not exists "fixed_cost_items_update_own" on public.fixed_cost_items for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy if not exists "fixed_cost_items_delete_own" on public.fixed_cost_items for delete using (auth.uid() = owner_user_id);

create trigger set_fixed_cost_items_updated_at
before update on public.fixed_cost_items
for each row execute function public.set_updated_at();
