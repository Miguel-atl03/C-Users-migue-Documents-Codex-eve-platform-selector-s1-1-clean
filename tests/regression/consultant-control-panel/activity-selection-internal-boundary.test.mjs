import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260731150000_eve_activity_selection_internal_data_boundary.sql",
  "utf8",
);
const continuityMigration = readFileSync(
  "supabase/migrations/20260731153000_eve_participant_progress_profile_continuity.sql",
  "utf8",
);
const scopedCompletionMigration = readFileSync(
  "supabase/migrations/20260731154500_eve_participant_progress_completion_and_case_scope.sql",
  "utf8",
);
const legacyPolicyDropMigration = readFileSync(
  "supabase/migrations/20260731160000_eve_activity_selection_drop_case_select_policies.sql",
  "utf8",
);

test("P1.3 revokes direct browser-role access to C3.12 internal selection tables", () => {
  for (const table of [
    "activity_selection_workmap_snapshot",
    "activity_selection_results",
    "activity_selection_result_items",
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i"),
    );
    assert.doesNotMatch(
      migration,
      new RegExp(`grant select on table public\\.${table} to authenticated`, "i"),
    );
    assert.match(
      migration,
      new RegExp(`grant all on table public\\.${table} to service_role`, "i"),
    );
  }
});

test("P1.3 removes participant and direct consultant RLS policies from internal tables", () => {
  for (const policy of [
    "activity_selection_workmap_snapshot_consultant_select",
    "activity_selection_workmap_snapshot_participant_select",
    "activity_selection_results_consultant_select_effective",
    "activity_selection_results_participant_select_effective",
    "activity_selection_result_items_consultant_select_effective",
    "activity_selection_result_items_participant_select_effective",
  ]) {
    assert.match(migration, new RegExp(`drop policy if exists ${policy}`, "i"));
  }

  assert.doesNotMatch(migration, /create policy .*activity_selection_.*participant/i);
  assert.doesNotMatch(migration, /create policy .*activity_selection_.*consultant/i);
});

test("P1.3 participant progress RPC derives identity and has no client-supplied scope", () => {
  assert.match(migration, /create or replace function public\.get_participant_activity_progress\(\)/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = public/i);
  assert.match(migration, /v_auth_user_id uuid := auth\.uid\(\)/i);
  assert.doesNotMatch(migration, /p_case_id|p_profile_id|p_participant_id|p_owner|p_auth_user_id/i);
  assert.match(migration, /grant execute on function public\.get_participant_activity_progress\(\) to authenticated/i);
  assert.match(migration, /revoke all on function public\.get_participant_activity_progress\(\) from anon/i);
});

test("P1.3 participant progress projection does not expose selection internals", () => {
  const returnedKeys = [
    ...continuityMigration.matchAll(/'([^']+)'\s*,/g),
  ].map((match) => match[1]);

  for (const forbidden of [
    "policy_projection",
    "policy_manifest",
    "hash",
    "score",
    "gate",
    "penalties",
    "selected_slot",
    "selection_reason",
    "decision_trace",
    "rule_refs",
    "replay",
    "classification",
    "primary",
    "non_primary",
  ]) {
    assert.equal(
      returnedKeys.some((key) => new RegExp(forbidden, "i").test(key)),
      false,
    );
  }

  for (const allowed of [
    "profile",
    "label",
    "position",
    "totalProfiles",
    "activity",
    "id",
    "ordinal",
    "total",
    "status",
    "isCurrent",
    "journeyStatus",
  ]) {
    assert.equal(returnedKeys.includes(allowed), true);
  }
});

test("P1.3.1 participant progress evaluates every active profile deterministically", () => {
  assert.match(continuityMigration, /row_number\(\) over \(order by p\.is_primary desc, p\.created_at, p\.id\) as profile_position/i);
  assert.match(continuityMigration, /partition by ap\.profile_id/i);
  assert.match(continuityMigration, /profile_rollup as/i);
  assert.match(continuityMigration, /selected_profile as/i);
  assert.match(continuityMigration, /where has_active or has_pending or has_blocked/i);
  assert.doesNotMatch(continuityMigration, /p_profile_id|p_case_id|p_participant_id|select_profile|profile_selection_required/i);
});

test("P1.3.1 participant progress advances when earlier profiles are completed", () => {
  assert.match(continuityMigration, /when has_active then 1/i);
  assert.match(continuityMigration, /when has_pending then 2/i);
  assert.match(continuityMigration, /when has_blocked then 3/i);
  assert.match(continuityMigration, /profile_position/i);
  assert.match(continuityMigration, /'journeyStatus', 'completed'/i);
  assert.match(continuityMigration, /'profile', null,\s*'activity', null,\s*'journeyStatus', 'completed'/is);
});

test("P1.3.1 participant progress maps runtime states to public states", () => {
  for (const state of [
    "active_base_capture",
    "active_causal_capture",
    "b0_confirmation_pending",
    "semantic_preload_loaded",
  ]) {
    assert.match(continuityMigration, new RegExp(`${state}'[\\s\\S]*?then 'active'`, "i"));
  }

  for (const state of [
    "initialized",
    "causal_evaluation_pending",
    "readiness_evaluation",
    "reentry_required",
    "manual_review_required",
  ]) {
    assert.match(continuityMigration, new RegExp(`${state}'[\\s\\S]*?then 'pending'`, "i"));
  }

  for (const state of [
    "ready",
    "ready_with_flags",
    "base_complete",
    "exported_to_parallel_production",
    "archived",
  ]) {
    assert.match(continuityMigration, new RegExp(`${state}'[\\s\\S]*?then 'completed'`, "i"));
  }

  assert.match(continuityMigration, /runtime_state = 'blocked' then 'blocked'/i);
});

test("P1.3.1 participant progress preserves the internal-data boundary", () => {
  assert.match(continuityMigration, /create or replace function public\.get_participant_activity_progress\(\)/i);
  assert.match(continuityMigration, /security definer/i);
  assert.match(continuityMigration, /set search_path = public/i);
  assert.match(continuityMigration, /v_auth_user_id uuid := auth\.uid\(\)/i);
  assert.match(continuityMigration, /grant execute on function public\.get_participant_activity_progress\(\) to authenticated/i);
  assert.match(continuityMigration, /revoke all on function public\.get_participant_activity_progress\(\) from anon/i);
  assert.doesNotMatch(continuityMigration, /policy_projection|policy_manifest|score_jsonb|penalties_jsonb|decision_trace_jsonb|rule_refs_jsonb|replay_mismatch_jsonb/i);
});

test("P1.3.2 participant progress distinguishes preparing from completed", () => {
  assert.match(scopedCompletionMigration, /count\(rr\.runtime_run_id\) as run_count/i);
  assert.match(scopedCompletionMigration, /when run_count = 0 then 'preparing'/i);
  assert.match(scopedCompletionMigration, /run_count > 0 and all_runs_completed then 'completed'/i);
  assert.match(scopedCompletionMigration, /profile_journey_status in \('preparing', 'blocked'\)/i);
  assert.match(scopedCompletionMigration, /'journeyStatus', v_profile\.profile_journey_status/i);
});

test("P1.3.2 participant progress scopes execution to exactly one active case", () => {
  assert.match(scopedCompletionMigration, /with active_cases as/i);
  assert.match(scopedCompletionMigration, /select count\(\*\), \(array_agg\(case_id order by case_id::text\)\)\[1\]/i);
  assert.match(scopedCompletionMigration, /if v_case_count > 1 then/i);
  assert.match(scopedCompletionMigration, /'journeyStatus', 'case_selection_required'/i);
  assert.match(scopedCompletionMigration, /and cp\.case_id = v_case_id/i);
  assert.doesNotMatch(scopedCompletionMigration, /p_case_id|p_profile_id|p_participant_id|p_owner|p_auth_user_id/i);
});

test("P1.3.2 completion requires every active profile to have completed runs", () => {
  assert.match(scopedCompletionMigration, /left join ranked_runs rr on rr\.profile_id = ap\.profile_id/i);
  assert.match(scopedCompletionMigration, /coalesce\(bool_and\(rr\.public_status = 'completed'\), false\) as all_runs_completed/i);
  assert.match(scopedCompletionMigration, /where\s+run_count = 0\s+or has_active\s+or has_pending\s+or has_blocked\s+or not all_runs_completed/is);
  assert.match(scopedCompletionMigration, /'profile', null,\s*'activity', null,\s*'journeyStatus', 'completed'/is);
});

test("P1.3.2 preserves public state mapping and hides methodology", () => {
  for (const status of ["active", "pending", "completed", "blocked", "preparing"]) {
    assert.match(scopedCompletionMigration, new RegExp(`'${status}'`, "i"));
  }

  assert.match(scopedCompletionMigration, /grant execute on function public\.get_participant_activity_progress\(\) to authenticated/i);
  assert.match(scopedCompletionMigration, /revoke all on function public\.get_participant_activity_progress\(\) from anon/i);
  assert.doesNotMatch(scopedCompletionMigration, /policy_projection|policy_manifest|score_jsonb|penalties_jsonb|decision_trace_jsonb|rule_refs_jsonb|replay_mismatch_jsonb/i);
});

test("P1.3.3 removes legacy case-select policies from selection internals", () => {
  for (const policy of [
    "activity_selection_workmap_snapshot_case_select",
    "activity_selection_results_case_select",
    "activity_selection_result_items_case_select",
  ]) {
    assert.match(legacyPolicyDropMigration, new RegExp(`drop policy if exists ${policy}`, "i"));
  }

  for (const table of [
    "activity_selection_workmap_snapshot",
    "activity_selection_results",
    "activity_selection_result_items",
  ]) {
    assert.match(
      legacyPolicyDropMigration,
      new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i"),
    );
    assert.doesNotMatch(
      legacyPolicyDropMigration,
      new RegExp(`create policy .* on public\\.${table}`, "i"),
    );
  }
});
