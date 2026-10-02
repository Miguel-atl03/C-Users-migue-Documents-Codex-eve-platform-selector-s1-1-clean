import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const hardeningMigration = readFileSync(
  resolve(
    "supabase/migrations/20260721160000_eve_r3_experience_capability_idempotency_hardening.sql",
  ),
  "utf8",
);
const migration = readFileSync(
  resolve(
    "supabase/migrations/20260721173000_eve_r3_permanent_wiring_closure.sql",
  ),
  "utf8",
);
const finalMigration = readFileSync(
  resolve(
    "supabase/migrations/20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql",
  ),
  "utf8",
);
const actionsRoute = readFileSync(
  resolve(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/experience-actions/route.ts",
  ),
  "utf8",
);
const stateRoute = readFileSync(
  resolve(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/experience-state/route.ts",
  ),
  "utf8",
);
const clientApi = readFileSync(
  resolve(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  ),
  "utf8",
);
const drawer = readFileSync(
  resolve(
    "src/features/official-consultant-control-panel/components/SupportActionDrawer.tsx",
  ),
  "utf8",
);
const concurrencyProbe = readFileSync(
  resolve("scripts/eve/official-control-panel/probe-point15-17-concurrency.mjs"),
  "utf8",
);
const actionVerifier = readFileSync(
  resolve("scripts/eve/official-control-panel/verify-point15-17-action-chain.mjs"),
  "utf8",
);
const seed = readFileSync(
  resolve("scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs"),
  "utf8",
);
const panelEventsRoute = readFileSync(
  resolve(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/experience-events/route.ts",
  ),
  "utf8",
);
const runtimeEventsRoute = readFileSync(
  resolve(
    "src/app/api/eve/runtime-40-20/client-bff/experience-event/route.ts",
  ),
  "utf8",
);
const runtimeSessionRoute = readFileSync(
  resolve("src/app/api/eve/runtime-40-20/client-bff/session/route.ts"),
  "utf8",
);
const runtimeInteractionRoute = readFileSync(
  resolve("src/app/api/eve/runtime-40-20/client-bff/interaction/route.ts"),
  "utf8",
);
const runtimeAnswerRoute = readFileSync(
  resolve("src/app/api/eve/runtime-40-20/client-bff/answer/route.ts"),
  "utf8",
);
const runtimeRealLocalAdapter = readFileSync(
  resolve(
    "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter.ts",
  ),
  "utf8",
);

test("R3 permanent migration never deletes grants by capability name", () => {
  assert.doesNotMatch(
    migration,
    /delete\s+from\s+public\.eve_consultant_panel_capability_grant[\s\S]{0,300}capability\s+in/i,
  );
  assert.match(migration, /eve_r3_is_explicit_capability_grant/);
  assert.match(migration, /Assignment vigente != mutation capability/);
});

test("runtime experience events use authenticated RPC, never product service_role writes", () => {
  assert.match(finalMigration, /eve_record_experience_event_as_user/);
  assert.match(finalMigration, /v_uid uuid := auth\.uid\(\)/);
  assert.match(finalMigration, /v_case\.usuario_id is distinct from v_user\.id/i);
  assert.match(finalMigration, /p_screen_key like 'panel\\_%'/i);
  assert.match(finalMigration, /eve_consultant_can_access_case\(p_case_id\)/);
  assert.match(finalMigration, /recordedBy', 'authenticated_user_rpc'/);
  assert.match(finalMigration, /from public, anon, service_role/);

  for (const source of [panelEventsRoute, runtimeEventsRoute]) {
    assert.match(source, /eve_record_experience_event_as_user/);
    assert.doesNotMatch(source, /createOfficialControlPanelServiceRoleClient/);
    assert.doesNotMatch(source, /p_user_id/);
  }
});

test("created_by null runtime rows require factual local adapter provenance", () => {
  assert.match(finalMigration, /s\.created_by is not distinct from v_uid/);
  assert.match(finalMigration, /a\.created_by is not distinct from v_uid/);
  assert.match(finalMigration, /s\.metadata ->> 'local_only' = 'true'/);
  assert.match(finalMigration, /a\.metadata ->> 'local_only' = 'true'/);
  assert.match(finalMigration, /trace\.entry ->> 'stage' = 'p4_runtime_real_local'/);
  assert.match(finalMigration, /trace\.entry ->> 'object' = 'role_runtime_session'/);
  assert.match(finalMigration, /trace\.entry ->> 'object' = 'activity_runtime_run'/);
  assert.doesNotMatch(finalMigration, /s\.created_by is null\s+or/i);
  assert.doesNotMatch(finalMigration, /a\.created_by is null\s+or/i);
});

test("runtime real local BFF uses canonical UUID catalog id", () => {
  assert.match(
    runtimeRealLocalAdapter,
    /EVE_RUNTIME_40_20_LOCAL_CATALOG_VERSION_ID\s*=\s*"00000000-0000-4000-8000-000000000040"/,
  );
  for (const source of [runtimeSessionRoute, runtimeAnswerRoute]) {
    assert.match(source, /EVE_RUNTIME_40_20_LOCAL_CATALOG_VERSION_ID/);
    assert.doesNotMatch(source, /catalog_version_id:\s*"runtime-local-catalog"/);
  }
});

test("runtime real client BFF routes require authenticated user scope", () => {
  for (const source of [runtimeSessionRoute, runtimeInteractionRoute, runtimeAnswerRoute]) {
    assert.match(source, /bearerTokenFromRequest/);
    assert.match(source, /authenticateCommercialRequest/);
    assert.match(source, /eve_can_access_case/);
    assert.match(source, /createAuthenticatedServerSupabaseClient/);
    assert.match(source, /actor_user_id:\s*auth\.user\.authUserId/);
    assert.doesNotMatch(source, /resolveCommercialSessionOwner/);
    assert.doesNotMatch(source, /createRuntimeSessionAndRunLocal\([\s\S]*createOfficialControlPanelServiceRoleClient/);
  }
});

test("grant audit has request id, exact grant id and append-only mutation guard", () => {
  for (const token of [
    "add column if not exists grant_id",
    "add column if not exists relationship_id",
    "add column if not exists case_id",
    "add column if not exists granted_by",
    "add column if not exists revoked_by",
    "alter column request_id set not null",
    "capability_grant_audit_request_id_required",
    "before update or delete",
    "before truncate",
  ]) {
    assert.match(`${hardeningMigration}\n${migration}\n${finalMigration}`, new RegExp(token, "i"));
  }
});

test("upgrade closure restores only factual explicit grants and exposes ambiguous review readout", () => {
  assert.match(finalMigration, /Restore only grants with factual official provenance/);
  assert.match(finalMigration, /capability_granted/);
  assert.match(finalMigration, /capability_revoked/);
  assert.match(finalMigration, /eve_r3_ambiguous_capability_grants_for_review/);
  assert.doesNotMatch(
    finalMigration,
    /delete\s+from\s+public\.eve_consultant_panel_capability_grant/i,
  );
});

test("cross-consultant capability helper is not exposed to authenticated clients", () => {
  assert.match(
    migration,
    /revoke all on function public\.eve_consultant_has_panel_capability_for\(uuid, uuid, text\)[\s\S]{0,120}from public, anon, authenticated, service_role/i,
  );
  assert.doesNotMatch(actionsRoute, /eve_consultant_has_panel_capability_for/);
  assert.doesNotMatch(stateRoute, /eve_consultant_has_panel_capability_for/);
  assert.match(actionsRoute, /eve_consultant_has_panel_capability/);
  assert.match(stateRoute, /eve_consultant_has_panel_capability/);
});

test("client policy authorization is not part of the HTTP action contract", () => {
  for (const source of [actionsRoute, clientApi, drawer, concurrencyProbe, actionVerifier]) {
    assert.doesNotMatch(source, /policyAuthorized/);
  }
  assert.doesNotMatch(seed, /p_policy_authorized:\s*true/);
  assert.match(migration, /eve_r3_experience_high_risk_policy_allows/);
  assert.match(migration, /return false;/);
});

test("transactional idempotency hash includes semantic payload and server context", () => {
  for (const token of [
    "'actorId'",
    "'companyId'",
    "'relationshipId'",
    "'caseId'",
    "'userId'",
    "'roleRuntimeSessionId'",
    "'activityId'",
    "'screenKey'",
    "'actionType'",
    "'reason'",
    "'beforeState'",
    "'sourceVersion'",
    "'effectPayload'",
    "'policyReference'",
  ]) {
    assert.match(migration, new RegExp(token));
  }
  assert.match(migration, /jsonb_object_agg\(key, value order by key\)/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /IDEMPOTENCY_CONFLICT/);
});
