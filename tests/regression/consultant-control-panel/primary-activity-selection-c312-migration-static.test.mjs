import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260730143000_eve_c312_primary_activity_selection_trace_conformance.sql",
  "utf8",
);
const hardeningMigration = readFileSync(
  "supabase/migrations/20260730170000_eve_c3122_primary_selection_hardening.sql",
  "utf8",
);
const semanticMigration = readFileSync(
  "supabase/migrations/20260730173000_eve_c3123_policy_artifact_and_audit_semantics.sql",
  "utf8",
);

test("C3.12 migration is additive and marks legacy selections as replay-unverifiable", () => {
  assert.match(migration, /alter table public\.activity_selection_results\s+add column if not exists input_snapshot_jsonb/i);
  assert.match(migration, /add column if not exists selection_result_hash text/i);
  assert.match(migration, /legacy_selection_trace_incomplete/i);
  assert.match(migration, /replay_status = 'unverifiable'/i);
  assert.doesNotMatch(migration, /drop table/i);
  assert.doesNotMatch(migration, /truncate table/i);
});

test("C3.12 migration persists selector-template evidence per activity", () => {
  for (const column of [
    "eligibility_status",
    "preferred_slot_candidate",
    "selection_status",
    "selection_reason_text",
    "non_primary_context_status",
    "runtime_handoff_priority",
    "manual_review_required",
    "score_jsonb",
    "penalties_jsonb",
    "trace_flags_jsonb",
    "rule_refs_jsonb",
    "decision_trace_jsonb",
  ]) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`, "i"));
  }
});

test("C3.12 migration governs manual review through service-role only RPC", () => {
  assert.match(migration, /create or replace function public\.register_activity_selection_manual_review/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = public/i);
  assert.match(migration, /revoke all on function public\.register_activity_selection_manual_review/i);
  assert.match(migration, /grant execute on function public\.register_activity_selection_manual_review\([^)]*\) to service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.register_activity_selection_manual_review\([^)]*\) to authenticated/i);
});
test("C3.12.2 finalize creates Runtime only through governed RPC", () => {
  const finalize = readFileSync(
    "src/app/api/participant/workmap/finalize/route.ts",
    "utf8",
  );

  assert.match(finalize, /create_role_runtime_session_for_profile/);
  assert.match(finalize, /runtime_session_rpc_failed/);
  assert.doesNotMatch(finalize, /ensureRuntimeSessionFromServerAuthority/);
  assert.doesNotMatch(finalize, /\.from\("role_runtime_session"\)[\s\S]{0,700}\.insert\(/);
});

test("C3.12.2 manual review is governed by explicit actor and append-only audit", () => {
  assert.match(hardeningMigration, /drop function if exists public\.register_activity_selection_manual_review\(uuid, text, text, jsonb\)/i);
  assert.match(hardeningMigration, /p_actor_auth_user_id uuid/i);
  assert.match(hardeningMigration, /p_actor_role text/i);
  assert.match(hardeningMigration, /p_case_id uuid/i);
  assert.match(hardeningMigration, /from public\.consultant_company_assignments a/i);
  assert.match(hardeningMigration, /reviewed_by = p_actor_auth_user_id/i);
  assert.match(hardeningMigration, /insert into public\.official_control_panel_context_audit/i);
  assert.match(hardeningMigration, /'eventType', 'activity_selection_manual_review_registered'/i);
  assert.match(hardeningMigration, /'case_linked'/i);
  assert.doesNotMatch(hardeningMigration, /reviewed_by = auth\.uid\(\)/i);
  assert.doesNotMatch(hardeningMigration, /grant execute on function public\.register_activity_selection_manual_review\([^)]*\)\s+to authenticated/i);
});

test("C3.12.2 manual review BFF derives actor from authenticated request", () => {
  const route = readFileSync(
    "src/app/api/official-control-panel/activity-selection/manual-review/route.ts",
    "utf8",
  );

  assert.match(route, /authenticateCommercialRequest/);
  assert.match(route, /p_actor_auth_user_id:\s*auth\.user\.authUserId/);
  assert.match(route, /p_actor_role:\s*"consultant"/);
  assert.match(route, /p_case_id:\s*caseId/);
  assert.doesNotMatch(route, /service_role/i);
});
test("C3.12.3 audit semantics adds dedicated manual-review action", () => {
  assert.match(semanticMigration, /drop constraint if exists official_control_panel_context_audit_action_check/i);
  assert.match(semanticMigration, /activity_selection_manual_review_registered/i);
  assert.match(semanticMigration, /drop constraint if exists official_control_panel_context_audit_scope_check/i);
  assert.match(semanticMigration, /p_actor_auth_user_id uuid/i);
  assert.match(semanticMigration, /reviewed_by = p_actor_auth_user_id/i);
  assert.match(semanticMigration, /'activity_selection_manual_review_registered'/i);
  assert.doesNotMatch(semanticMigration, /p_actor_auth_user_id,\s*'case_linked'/i);
});

