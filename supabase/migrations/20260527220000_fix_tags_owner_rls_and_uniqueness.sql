-- Make tags multi-tenant by owner_user_id while remaining safe for existing rows.
alter table public.tags
  add column if not exists owner_user_id uuid;

create index if not exists idx_tags_owner_user_id
  on public.tags(owner_user_id);

-- Remove legacy global uniqueness on tag name and enforce per-user uniqueness.
alter table public.tags
  drop constraint if exists tags_name_key;

drop index if exists public.tags_name_key;

create unique index if not exists idx_tags_owner_name_unique
  on public.tags(owner_user_id, name);

-- RLS for tags (drop+create: PostgreSQL has no CREATE POLICY IF NOT EXISTS)
alter table public.tags enable row level security;

drop policy if exists tags_select_own on public.tags;
create policy tags_select_own
on public.tags
for select
using (auth.uid() = owner_user_id);

drop policy if exists tags_insert_own on public.tags;
create policy tags_insert_own
on public.tags
for insert
with check (auth.uid() = owner_user_id);

drop policy if exists tags_update_own on public.tags;
create policy tags_update_own
on public.tags
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists tags_delete_own on public.tags;
create policy tags_delete_own
on public.tags
for delete
using (auth.uid() = owner_user_id);

-- scenario_tags keeps no owner column; enforce ownership transitively via scenarios + tags.
alter table public.scenario_tags enable row level security;

drop policy if exists scenario_tags_select_own on public.scenario_tags;
create policy scenario_tags_select_own
on public.scenario_tags
for select
using (
  exists (
    select 1
    from public.scenarios s
    where s.id = scenario_tags.scenario_id
      and s.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags t
    where t.id = scenario_tags.tag_id
      and t.owner_user_id = auth.uid()
  )
);

drop policy if exists scenario_tags_insert_own on public.scenario_tags;
create policy scenario_tags_insert_own
on public.scenario_tags
for insert
with check (
  exists (
    select 1
    from public.scenarios s
    where s.id = scenario_tags.scenario_id
      and s.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags t
    where t.id = scenario_tags.tag_id
      and t.owner_user_id = auth.uid()
  )
);

drop policy if exists scenario_tags_delete_own on public.scenario_tags;
create policy scenario_tags_delete_own
on public.scenario_tags
for delete
using (
  exists (
    select 1
    from public.scenarios s
    where s.id = scenario_tags.scenario_id
      and s.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags t
    where t.id = scenario_tags.tag_id
      and t.owner_user_id = auth.uid()
  )
);
