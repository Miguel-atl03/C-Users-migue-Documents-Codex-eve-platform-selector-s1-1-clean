-- 045-R3A-R verify query for staging.
-- Read-only.

with active_catalog as (
  select catalog_version_id
  from public.runtime_catalog_version
  where status::text = 'active'
),
candidate_sessions as (
  select
    role_runtime_session_id,
    catalog_version_id,
    metadata_json->>'catalog_selection_rule' as catalog_selection_rule,
    metadata_json->>'catalog_selected_server_side' as catalog_selected_server_side,
    created_at
  from public.role_runtime_session
  where metadata_json->>'created_by_rpc' = 'create_role_runtime_session_for_profile'
  order by created_at desc
  limit 20
)
select
  (select count(*) from active_catalog) as active_catalog_count,
  s.role_runtime_session_id,
  s.catalog_version_id,
  s.catalog_version_id = (select catalog_version_id from active_catalog limit 1) as bound_to_active_catalog,
  s.catalog_selection_rule,
  s.catalog_selected_server_side,
  s.created_at
from candidate_sessions s;
