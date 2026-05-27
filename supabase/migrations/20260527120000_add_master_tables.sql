create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('revenue', 'variable_cost', 'fixed_cost', 'metric')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, code)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  code text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organizations_owner_code_unique_not_null
  on public.organizations(owner_user_id, code)
  where code is not null;

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  version_type text not null check (version_type in ('actual', 'budget', 'forecast', 'scenario')),
  sort_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, name)
);

alter table public.accounts enable row level security;
alter table public.organizations enable row level security;
alter table public.versions enable row level security;

create policy "accounts_select_own" on public.accounts for select using (auth.uid() = owner_user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = owner_user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = owner_user_id);

create policy "organizations_select_own" on public.organizations for select using (auth.uid() = owner_user_id);
create policy "organizations_insert_own" on public.organizations for insert with check (auth.uid() = owner_user_id);
create policy "organizations_update_own" on public.organizations for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "organizations_delete_own" on public.organizations for delete using (auth.uid() = owner_user_id);

create policy "versions_select_own" on public.versions for select using (auth.uid() = owner_user_id);
create policy "versions_insert_own" on public.versions for insert with check (auth.uid() = owner_user_id);
create policy "versions_update_own" on public.versions for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "versions_delete_own" on public.versions for delete using (auth.uid() = owner_user_id);
