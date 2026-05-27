-- Enable RLS for scenarios and enforce per-user access.
alter table public.scenarios enable row level security;

create policy "scenarios_select_own"
on public.scenarios
for select
using (auth.uid() = owner_user_id);

create policy "scenarios_insert_own"
on public.scenarios
for insert
with check (auth.uid() = owner_user_id);

create policy "scenarios_update_own"
on public.scenarios
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "scenarios_delete_own"
on public.scenarios
for delete
using (auth.uid() = owner_user_id);
