create extension if not exists pgcrypto;

alter table public.scenario_line_items
  alter column id set default gen_random_uuid();

-- Ensure upsert conflict target exists in all environments
create unique index if not exists scenario_line_items_scenario_account_org_version_month_key
  on public.scenario_line_items (scenario_id, account_id, organization_id, version_id, target_year_month);
