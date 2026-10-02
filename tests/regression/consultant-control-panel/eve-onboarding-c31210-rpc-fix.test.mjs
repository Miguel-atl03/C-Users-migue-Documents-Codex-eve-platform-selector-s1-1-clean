import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");
const migration = readFileSync(
  resolve(
    projectRoot,
    "supabase/migrations/20260731004500_fix_accept_participant_invitation_position_ambiguity.sql",
  ),
  "utf8",
);
const harness = readFileSync(
  resolve(projectRoot, "scripts/eve/staging/c312-smoke-conformance.mjs"),
  "utf8",
);
const finalizeRoute = readFileSync(
  resolve(projectRoot, "src/app/api/participant/workmap/finalize/route.ts"),
  "utf8",
);
const runtimeClaimsMigration = readFileSync(
  resolve(
    projectRoot,
    "supabase/migrations/20260731005000_fix_runtime_rpc_service_role_claims.sql",
  ),
  "utf8",
);
const replayMigration = readFileSync(
  resolve(
    projectRoot,
    "supabase/migrations/20260731010000_eve_c31211_replay_observability.sql",
  ),
  "utf8",
);
const replayService = readFileSync(
  resolve(
    projectRoot,
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-replay.ts",
  ),
  "utf8",
);
const replayRoute = readFileSync(
  resolve(
    projectRoot,
    "src/app/api/official-control-panel/activity-selection/replay/route.ts",
  ),
  "utf8",
);
const experienceService = readFileSync(
  resolve(
    projectRoot,
    "src/services/eve/official-control-panel/official-control-panel-experience-service.ts",
  ),
  "utf8",
);
const manualWorkService = readFileSync(
  resolve(
    projectRoot,
    "src/services/eve/official-control-panel/official-control-panel-manual-work-service.ts",
  ),
  "utf8",
);
const parallelProductionService = readFileSync(
  resolve(
    projectRoot,
    "src/services/eve/official-control-panel/official-control-panel-parallel-production-service.ts",
  ),
  "utf8",
);

test("C3.12.10 accept_participant_invitation removes PL/pgSQL ambiguity", () => {
  assert.match(migration, /#variable_conflict\s+error/);
  assert.match(migration, /v_case_participant_id\s+uuid/);
  assert.match(migration, /v_case_participant_position_id\s+uuid/);
  assert.doesNotMatch(
    migration,
    /on\s+conflict\s*\(\s*case_participant_id\s*\)\s*where\s+status\s*=\s*'active'/i,
  );
  assert.match(migration, /from public\.case_participant_positions as cpp/);
  assert.match(migration, /where cpp\.case_participant_id = v_case_participant_id/);
});

test("C3.12.10 acceptance creates position from declared_position but no profile or Runtime", () => {
  assert.match(migration, /v_invitation\.metadata->>'declared_position'/);
  assert.match(migration, /p_metadata->>'declared_position'/);
  assert.doesNotMatch(migration, /p_role_label\s*\)/);
  assert.match(migration, /'case_participant_profile_id', null/);
  assert.match(migration, /select\s+v_after\.id,\s*v_case_participant_id,\s*null::uuid,/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.case_participant_profiles/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.role_runtime_session/i);
});

test("C3.12.10 preserves rejection/audit contract", () => {
  for (const expected of [
    "rejected_invalid_token",
    "rejected_already_used",
    "rejected_wrong_email",
    "expired",
    "accepted",
    "eve_onboarding_insert_invitation_audit",
    "to_jsonb(v_invitation) - 'token_hash'",
    "to_jsonb(v_after) - 'token_hash'",
  ]) {
    assert.ok(migration.includes(expected), `missing ${expected}`);
  }
});

test("C3.12.10 harness follows governed onboarding and WorkMap paths", () => {
  assert.match(harness, /declared_position:\s*"Ejecutiva Comercial Smoke"/);
  assert.match(harness, /accept_participant_invitation/);
  assert.match(harness, /p_role_label:\s*null/);
  assert.match(harness, /p_role_code:\s*null/);
  assert.match(harness, /upsert_participant_workmap_snapshot/);
  assert.match(harness, /materialize_case_participant_profiles_from_workmap/);
  assert.doesNotMatch(harness, /insertSingle\(admin,\s*"case_participant_positions"/);
  assert.doesNotMatch(harness, /insertSingle\(admin,\s*"case_participant_workmap_snapshots"/);
  assert.doesNotMatch(harness, /\.from\("role_runtime_session"\)\.insert\(/);
});

test("C3.12.10 Runtime RPC accepts current service-role claim format without direct inserts", () => {
  assert.match(runtimeClaimsMigration, /request\.jwt\.claim\.role/);
  assert.match(runtimeClaimsMigration, /request\.jwt\.claims/);
  assert.match(runtimeClaimsMigration, /v_internal boolean := v_actor_role = 'service_role'/);
  assert.match(runtimeClaimsMigration, /runtime_creation_not_authorized/);
  assert.match(runtimeClaimsMigration, /insert into public\.role_runtime_session/);
  assert.doesNotMatch(harness, /insertSingle\(admin,\s*"role_runtime_session"/);
});

test("C3.12.10 finalize accepts PostgREST RETURNS TABLE array from Runtime RPC", () => {
  assert.match(finalizeRoute, /create_role_runtime_session_for_profile/);
  assert.match(finalizeRoute, /const runtimeRow = Array\.isArray\(rpcData\) \? rpcData\[0\] : rpcData/);
  assert.match(finalizeRoute, /runtime_session_not_returned/);
  assert.doesNotMatch(finalizeRoute, /\.from\("role_runtime_session"\)[\s\S]{0,700}\.insert\(/);
});

test("C3.12.11 harness requires governed persisted replay, not field-presence match", () => {
  assert.match(harness, /api\/official-control-panel\/activity-selection\/replay/);
  assert.match(harness, /postServiceJson/);
  assert.match(harness, /persistedReplayStatus === "match"/);
  assert.match(harness, /replayResultHashMatches/);
  assert.match(harness, /replayHashMatches/);
  assert.doesNotMatch(harness, /computedReplayStatus/);
  assert.doesNotMatch(harness, /trace_completeness_status === "complete"[\s\S]{0,300}return "match"/);
});

test("C3.12.11 replay service recomputes and persists match, mismatch and unverifiable states", () => {
  assert.match(replayService, /selectPrimaryActivitiesFromWorkMap/);
  assert.match(replayService, /buildPrimaryActivitySelectionAuditEnvelope/);
  assert.match(replayService, /snapshot_original_missing/);
  assert.match(replayService, /historical_selector_version_unavailable/);
  assert.match(replayService, /selection_result_hash_mismatch/);
  assert.match(replayService, /activity_trace_mismatch/);
  assert.match(replayService, /replay_status:\s*replay\.replayStatus/);
  assert.match(replayService, /replayed_at:\s*replay\.replayedAt/);
  assert.match(replayService, /replay_hash:\s*replayHash/);
  assert.match(replayService, /replay_mismatch_jsonb:\s*replay\.diffs/);
  assert.match(replayRoute, /service_authorization_required/);
});

test("C3.12.11 replay observability migration is additive", () => {
  assert.match(replayMigration, /add column if not exists replayed_at timestamptz/);
  assert.match(replayMigration, /add column if not exists replay_hash text/);
  assert.doesNotMatch(replayMigration, /update public\.activity_selection_results/i);
  assert.doesNotMatch(replayMigration, /delete from/i);
});

test("C3.12.11 panel services do not convert repository errors into empty state", () => {
  for (const service of [experienceService, manualWorkService, parallelProductionService]) {
    assert.match(service, /console\.error/);
    assert.match(service, /degraded/);
    assert.ok(
      service.includes('dataStatus: "error"') ||
        (service.includes('repositoryError') && service.includes('? "error"')),
      "service must expose error dataStatus on repository failure",
    );
  }
  assert.doesNotMatch(manualWorkService, /catch\s*\{[\s\S]{0,500}buildManualWorkTrackingResponse\(\{\s*caseId:[\s\S]{0,500}workItems:\s*\[\]/);
  assert.doesNotMatch(parallelProductionService, /catch\s*\{[\s\S]{0,500}dataStatus:\s*"empty"/);
});
