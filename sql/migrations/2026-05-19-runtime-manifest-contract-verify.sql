-- Verification for runtime manifest contract migration.
-- Run this after 2026-05-19-runtime-manifest-contract.sql.

with expected_columns(table_name, column_name) as (
  values
    ('scene_question_answers', 'original_answer_id'),
    ('scene_question_answers', 'clarification_answer_id'),
    ('scene_question_answers', 'consolidated_value'),
    ('scene_question_answers', 'provenance_chain'),
    ('scene_question_answers', 'readiness_json'),
    ('scene_question_answers', 'confidence_json'),
    ('scene_question_answers', 'flags_json'),
    ('scene_question_answers', 'bundles_json'),
    ('scene_light_inferences', 'preclassification_readiness')
),
column_checks as (
  select
    'column' as check_type,
    expected_columns.table_name || '.' || expected_columns.column_name as object_name,
    exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = expected_columns.table_name
        and c.column_name = expected_columns.column_name
    ) as passed
  from expected_columns
),
table_checks as (
  select
    'table' as check_type,
    'scene_answer_bundles' as object_name,
    exists (
      select 1
      from information_schema.tables t
      where t.table_schema = 'public'
        and t.table_name = 'scene_answer_bundles'
    ) as passed
),
constraint_checks as (
  select
    'constraint' as check_type,
    name as object_name,
    exists (
      select 1
      from pg_constraint
      where conname = name
    ) as passed
  from (
    values
      ('scene_light_inferences_preclassification_readiness_check'),
      ('scene_light_inferences_confidence_score_0_100_check')
  ) as expected(name)
),
index_checks as (
  select
    'index' as check_type,
    name as object_name,
    exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = name
    ) as passed
  from (
    values
      ('idx_scene_answer_bundles_sesion'),
      ('idx_scene_question_answers_contract_trace')
  ) as expected(name)
),
rls_checks as (
  select
    'rls' as check_type,
    'scene_answer_bundles row level security enabled' as object_name,
    coalesce(c.relrowsecurity, false) as passed
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'scene_answer_bundles'
)
select * from column_checks
union all select * from table_checks
union all select * from constraint_checks
union all select * from index_checks
union all select * from rls_checks
order by check_type, object_name;
