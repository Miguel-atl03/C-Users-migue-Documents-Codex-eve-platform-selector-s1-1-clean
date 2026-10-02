-- READ ONLY ? STAGING ENUM CONTRACT ? DO NOT MUTATE
select
  n.nspname as enum_schema,
  t.typname as enum_name,
  e.enumsortorder,
  e.enumlabel
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
join pg_enum e on e.enumtypid = t.oid
where n.nspname = 'public'
  and t.typname in (
    'eve_runtime_catalog_status',
    'eve_runtime_group_source',
    'eve_runtime_group_normalized',
    'eve_runtime_epistemic_status'
  )
order by t.typname, e.enumsortorder;
