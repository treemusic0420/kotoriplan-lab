-- Set Forecast as default version for each user while preserving Actual/Budget records.
update public.versions v
set is_default = case when v.version_type = 'forecast' then true else false end
where exists (
  select 1
  from public.versions vf
  where vf.owner_user_id = v.owner_user_id
    and vf.version_type = 'forecast'
);

-- Move scenario-created line items from Actual to Forecast within the same owner/org/account/scenario/month.
update public.scenario_line_items sli
set version_id = forecast_versions.id,
    updated_at = now()
from public.versions actual_versions
join public.versions forecast_versions
  on forecast_versions.owner_user_id = actual_versions.owner_user_id
 and forecast_versions.version_type = 'forecast'
where sli.version_id = actual_versions.id
  and actual_versions.version_type = 'actual'
  and not exists (
    select 1
    from public.scenario_line_items sli2
    where sli2.owner_user_id = sli.owner_user_id
      and sli2.scenario_id = sli.scenario_id
      and sli2.account_id = sli.account_id
      and sli2.organization_id = sli.organization_id
      and sli2.target_year_month = sli.target_year_month
      and sli2.version_id = forecast_versions.id
  );
