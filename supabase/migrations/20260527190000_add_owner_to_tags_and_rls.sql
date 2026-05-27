alter table public.tags add column if not exists owner_user_id uuid;

update public.tags t
set owner_user_id = s.owner_user_id
from public.scenario_tags st
join public.scenarios s on s.id = st.scenario_id
where st.tag_id = t.id
  and t.owner_user_id is null;

alter table public.tags alter column owner_user_id set not null;

alter table public.tags drop constraint if exists tags_name_key;
create unique index if not exists tags_owner_user_id_name_key on public.tags(owner_user_id, name);

alter table public.tags enable row level security;

create policy if not exists "tags_select_own" on public.tags for select using (auth.uid() = owner_user_id);
create policy if not exists "tags_insert_own" on public.tags for insert with check (auth.uid() = owner_user_id);
create policy if not exists "tags_update_own" on public.tags for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy if not exists "tags_delete_own" on public.tags for delete using (auth.uid() = owner_user_id);

alter table public.scenario_tags enable row level security;
create policy if not exists "scenario_tags_select_own" on public.scenario_tags for select using (exists (select 1 from public.scenarios s where s.id = scenario_id and s.owner_user_id = auth.uid()));
create policy if not exists "scenario_tags_insert_own" on public.scenario_tags for insert with check (exists (select 1 from public.scenarios s where s.id = scenario_id and s.owner_user_id = auth.uid()));
create policy if not exists "scenario_tags_delete_own" on public.scenario_tags for delete using (exists (select 1 from public.scenarios s where s.id = scenario_id and s.owner_user_id = auth.uid()));
