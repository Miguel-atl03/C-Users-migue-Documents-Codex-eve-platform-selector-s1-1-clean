-- POINT12 production rollback (safe default = policy-only)
-- Source migrations:
--   20260717190300_eve_point12_consultant_runtime_p3_rls.sql
--   20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql
--
-- Safe path:
--   1) DROP consultant SELECT policies introduced in 190300
--   2) Do NOT replace publish_runtime_causal_evaluation here
--      (reapply 190300 + 190400 restores policies + lint-safe publish)
--   3) Do NOT DROP Point12 tables by default (destructive; see runbook)
--
-- Destructive path (optional):
--   set_config('eve.point12_allow_destructive_rollback', 'on', true)
--   and empty-check gates must pass.
--
-- Preserve Amber case 19fc9eff. No identity trick. Do not start Point 13.
-- Full procedure: docs/eve/panel-control/POINT12_PRODUCTION_ROLLBACK_RUNBOOK.md

begin;

-- ---------------------------------------------------------------------------
-- A) Safe: remove consultant SELECT policies from 190300
-- ---------------------------------------------------------------------------
drop policy if exists activity_runtime_run_consultant_select
  on public.activity_runtime_run;

drop policy if exists role_runtime_session_consultant_select
  on public.role_runtime_session;

drop policy if exists readiness_gap_record_consultant_select
  on public.readiness_gap_record;

drop policy if exists process_state_timer_event_consultant_select
  on public.process_state_timer_event;

drop policy if exists readiness_decision_record_consultant_select
  on public.readiness_decision_record;

-- NOTE: publish_runtime_causal_evaluation (190300/190400 branching_decision.run_id)
-- is intentionally left in place on the safe path. Restoring prior publish
-- semantics belongs in the runbook / reapply of migration SQL, not a silent
-- partial function body here. Reapply:
--   supabase/migrations/20260717190300_eve_point12_consultant_runtime_p3_rls.sql
--   supabase/migrations/20260717190400_eve_point12_publish_branching_decision_run_id_fix.sql

-- ---------------------------------------------------------------------------
-- B) Optional destructive rollback (tables / catalog rows) — gated
--    Full Point12 table rollback is destructive and documented in
--    POINT12_PRODUCTION_ROLLBACK_RUNBOOK.md. Default: skipped.
-- ---------------------------------------------------------------------------
do $$
declare
  v_allow text;
  v_eval_count bigint;
  v_res_count bigint;
  v_ev_count bigint;
  v_snap_count bigint;
  v_def_count bigint;
  v_ver_count bigint;
  v_rule_count bigint;
begin
  v_allow := current_setting('eve.point12_allow_destructive_rollback', true);

  if coalesce(v_allow, '') is distinct from 'on' then
    raise notice 'point12_destructive_rollback_skipped: set eve.point12_allow_destructive_rollback=on to enable';
    return;
  end if;

  -- Empty checks (conservative): refuse if any ledger / snapshot / resolution / evidence rows exist
  select count(*) into v_eval_count from public.runtime_causal_evaluations;
  select count(*) into v_res_count from public.runtime_causal_variable_resolutions;
  select count(*) into v_ev_count
    from public.runtime_causal_evaluation_evidence_links;
  select count(*) into v_snap_count from public.runtime_run_control_snapshots;

  if v_eval_count > 0 or v_res_count > 0 or v_ev_count > 0 or v_snap_count > 0 then
    raise exception using
      errcode = '55000',
      message = 'point12_destructive_rollback_requires_empty_ledger_and_snapshots',
      detail = format(
        'evaluations=%s resolutions=%s evidence=%s snapshots=%s',
        v_eval_count, v_res_count, v_ev_count, v_snap_count
      );
  end if;

  -- Catalog scoped to point12-catalog-v1 only when present
  if to_regclass('public.runtime_causal_catalog_causal_defs') is not null then
    select count(*) into v_def_count
    from public.runtime_causal_catalog_causal_defs
    where catalog_version_code = 'point12-catalog-v1';
  else
    v_def_count := 0;
  end if;

  if to_regclass('public.runtime_causal_rule_catalog_versions') is not null then
    select count(*) into v_ver_count
    from public.runtime_causal_rule_catalog_versions
    where catalog_version_code = 'point12-catalog-v1';
  else
    v_ver_count := 0;
  end if;

  if to_regclass('public.runtime_causal_required_variable_rules') is not null then
    select count(*) into v_rule_count
    from public.runtime_causal_required_variable_rules
    where catalog_version_id = 'point12-catalog-v1';
  else
    v_rule_count := 0;
  end if;

  raise notice 'point12_destructive_rollback_catalog_counts defs=%s versions=%s rules=%s',
    v_def_count, v_ver_count, v_rule_count;

  -- Drop evidence links table only if empty (already checked) and exists
  if to_regclass('public.runtime_causal_evaluation_evidence_links') is not null then
    drop table if exists public.runtime_causal_evaluation_evidence_links;
  end if;

  -- Catalog defs / versions for point12-catalog-v1 (row delete; keep table if other versions)
  if to_regclass('public.runtime_causal_catalog_causal_defs') is not null then
    delete from public.runtime_causal_catalog_causal_defs
    where catalog_version_code = 'point12-catalog-v1';
  end if;

  if to_regclass('public.runtime_causal_rule_catalog_versions') is not null then
    delete from public.runtime_causal_rule_catalog_versions
    where catalog_version_code = 'point12-catalog-v1';
  end if;

  -- Resolutions / evaluations / snapshots: drop tables only when empty checks passed
  if to_regclass('public.runtime_causal_variable_resolutions') is not null then
    drop table if exists public.runtime_causal_variable_resolutions;
  end if;

  if to_regclass('public.runtime_causal_evaluations') is not null then
    drop table if exists public.runtime_causal_evaluations;
  end if;

  if to_regclass('public.runtime_run_control_snapshots') is not null then
    drop table if exists public.runtime_run_control_snapshots;
  end if;

  -- Rules for point12-catalog-v1
  if to_regclass('public.runtime_causal_required_variable_rules') is not null then
    delete from public.runtime_causal_required_variable_rules
    where catalog_version_id = 'point12-catalog-v1';

    -- Drop rules table only if fully empty after delete
    select count(*) into v_rule_count from public.runtime_causal_required_variable_rules;
    if v_rule_count = 0 then
      drop table if exists public.runtime_causal_required_variable_rules;
    end if;
  end if;

  -- Drop empty catalog tables if no remaining rows
  if to_regclass('public.runtime_causal_catalog_causal_defs') is not null then
    select count(*) into v_def_count from public.runtime_causal_catalog_causal_defs;
    if v_def_count = 0 then
      drop table if exists public.runtime_causal_catalog_causal_defs;
    end if;
  end if;

  if to_regclass('public.runtime_causal_rule_catalog_versions') is not null then
    select count(*) into v_ver_count from public.runtime_causal_rule_catalog_versions;
    if v_ver_count = 0 then
      drop table if exists public.runtime_causal_rule_catalog_versions;
    end if;
  end if;

  raise notice 'point12_destructive_rollback_completed_for_empty_ledger';
end;
$$;

commit;
