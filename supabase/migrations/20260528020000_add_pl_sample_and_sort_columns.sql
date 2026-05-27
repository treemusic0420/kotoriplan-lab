alter table public.analysis_dimensions
  add column if not exists is_sample boolean not null default false;

alter table public.analysis_dimension_values
  add column if not exists is_sample boolean not null default false;

alter table public.pl_facts
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_sample boolean not null default false;

alter table public.pl_fact_dimension_values
  add column if not exists is_sample boolean not null default false;
