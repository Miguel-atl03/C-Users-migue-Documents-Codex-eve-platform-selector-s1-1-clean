import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

function read(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

const contextLib = read("src/lib/participant-context.ts");
const contextRoute = read("src/app/api/participant/context/route.ts");
const bootstrapRoute = read("src/app/api/session/bootstrap/route.ts");
const restoreRoute = read("src/app/api/session/restore/route.ts");
const finalizeRoute = read("src/app/api/participant/workmap/finalize/route.ts");
const canonicalSelectionService = read(
  "src/services/participant-canonical-activity-selection.ts",
);
const significadoScreen = read(
  "src/components/significado/SignificadoDeTuTrabajo.tsx",
);
const significadoDraftState = read(
  "src/features/significado/significado-draft-state.ts",
);
const intakeRoute = read("src/app/api/intake/triple/route.ts");
const sessionBoundary = read("src/lib/session-boundary.ts");
const emptyState = read("src/components/client/EmptyAssessmentState.tsx");
const appPage = read("src/app/page.tsx");
const epistemicMigration = read(
  "supabase/migrations/20260727123000_epistemic_positions_and_workmap_profile_materialization.sql",
);

test("participant context BFF resolves the active case from authenticated identity only", () => {
  assert.match(contextRoute, /export async function GET\(request: Request\)/);
  assert.match(contextRoute, /resolveAuthenticatedParticipantContext\(request\)/);
  assert.doesNotMatch(contextRoute, /request\.json\(/);
  assert.doesNotMatch(contextRoute, /searchParams|get\("case|get\("user|get\("participant/i);

  for (const table of [
    'from("usuarios")',
    'from("case_participants")',
    'from("case_participant_positions")',
    'from("case_participant_profiles")',
    'from("sesiones_llenado")',
    'from("empresas")',
    'from("client_relationships")',
  ]) {
    assert.ok(contextLib.includes(table), `Missing context dependency: ${table}`);
  }

  assert.match(contextLib, /\.eq\("auth_user_id", auth\.user\.authUserId\)/);
  assert.match(contextLib, /\.eq\("status", "active"\)/);
  assert.match(contextLib, /\.eq\("profile_status", "active"\)/);
  assert.match(contextLib, /case_selection_required/);
  assert.match(contextLib, /functionalProfiles/);
  assert.match(contextLib, /position:/);
  assert.doesNotMatch(contextLib, /token_hash|participant_invitations/i);
});

test("bootstrap reuses the participant case without requiring functional profiles", () => {
  assert.match(bootstrapRoute, /resolveAuthenticatedParticipantContext\(request\)/);
  assert.match(bootstrapRoute, /participantContext\.status === "ready"/);
  assert.match(bootstrapRoute, /bootstrap: "participant_case_reused"/);
  assert.match(bootstrapRoute, /id: participantContext\.case\.id/);
  assert.match(bootstrapRoute, /case_participant_id: participantContext\.participant\.id/);
  assert.match(bootstrapRoute, /case_participant_profile_ids/);
  assert.match(bootstrapRoute, /participantContext\.functionalProfiles\.map/);
  assert.match(bootstrapRoute, /legacy_generic_session_created/);
});

test("intake save binds WorkMap to the authenticated participant context server-side", () => {
  assert.match(appPage, /fetch\("\/api\/participant\/context"/);
  assert.match(appPage, /participantContext\.company\.name/);
  assert.match(appPage, /participantContext\.case\.name/);
  assert.match(appPage, /participantContext\.position\?\.title/);
  assert.match(appPage, /phase: "save"/);
  assert.match(appPage, /phase: "continue"/);

  assert.match(intakeRoute, /resolveAuthenticatedParticipantContext\(request\)/);
  assert.match(intakeRoute, /participant_context_session_mismatch/);
  assert.match(intakeRoute, /payload\.sessionId !== participantContext\.case\.id/);
  assert.match(intakeRoute, /case_participant_id: participantContext\.participant\.id/);
  assert.match(intakeRoute, /upsert_participant_workmap_snapshot/);
  assert.match(intakeRoute, /materialize_case_participant_profiles_from_workmap/);
  assert.match(intakeRoute, /case_participant_profile_ids/);
  assert.doesNotMatch(intakeRoute, /payload\.case_id|payload\.caseId|payload\.participant_id|payload\.profile_id/);
});

test("participant resume restores active WorkMap snapshots to Significado instead of restarting", () => {
  assert.match(restoreRoute, /case_participant_workmap_snapshots/);
  assert.match(restoreRoute, /workmap_json/);
  assert.match(restoreRoute, /participant_workmap_snapshot/);
  assert.match(restoreRoute, /flow_state: resumeFlowState/);
  assert.match(restoreRoute, /"intake_significado"/);

  assert.match(appPage, /hydrateRestoredWorkMapProgress/);
  assert.match(appPage, /restoreResume\?\.flow_state === "intake_significado"/);
  assert.doesNotMatch(appPage, /selectPrimaryActivitiesFromWorkMap\(restoredWorkMap\)/);
  assert.match(appPage, /payload\.bootstrap === "participant_case_reused"/);
  assert.match(appPage, /await restoreSavedSession\(\{ sessionId, mode \}\)/);
  assert.match(appPage, /const persisted = await saveWorkMapDraft\(draft\)/);
  assert.match(appPage, /if \(!persisted\) return/);
});

test("UI header exposes the existing user, company, case and declared position without edit controls", () => {
  assert.match(emptyState, /participantContext\?:/);
  assert.match(emptyState, /Contexto de levantamiento/);
  for (const label of ["Usuario", "Puesto", "Empresa", "Caso"]) {
    assert.ok(emptyState.includes(label), `Missing header label: ${label}`);
  }
  assert.doesNotMatch(emptyState, /<span[^>]*>Rol<\/span>/);
  assert.doesNotMatch(emptyState, /onChange=.*participant|input.*participant|select.*participant/i);
});

test("participant session authorization does not create Runtime before WorkMap finalization", () => {
  assert.match(sessionBoundary, /from\("case_participants"\)/);
  assert.match(sessionBoundary, /\.eq\("case_id", sessionId\)/);
  assert.match(sessionBoundary, /\.eq\("usuario_id", eveUser\.user\.eveUserId\)/);
  assert.match(sessionBoundary, /\.eq\("status", "active"\)/);

  const connectedFiles = [
    contextLib,
    contextRoute,
    bootstrapRoute,
    intakeRoute,
    sessionBoundary,
    emptyState,
  ].join("\n");

  assert.doesNotMatch(connectedFiles, /create_role_runtime_session_for_profile/);
  assert.doesNotMatch(connectedFiles, /token_hash/);
});

test("participant WorkMap finalization persists canonical selection without client-side profile or activity choice", () => {
  assert.match(finalizeRoute, /export async function POST\(request: Request\)/);
  assert.match(finalizeRoute, /resolveAuthenticatedParticipantContext\(request\)/);
  assert.match(finalizeRoute, /materialize_case_participant_profiles_from_workmap/);
  assert.match(finalizeRoute, /case_participant_workmap_snapshots/);
  assert.match(finalizeRoute, /case_participant_profiles/);
  assert.match(finalizeRoute, /create_role_runtime_session_for_profile/);
  assert.match(finalizeRoute, /activity_selection_results/);
  assert.match(finalizeRoute, /activity_selection_result_items/);
  assert.match(finalizeRoute, /activity_runtime_run/);
  assert.match(finalizeRoute, /role_runtime_session_id/);
  assert.match(finalizeRoute, /primaryActivitySelectionResult/);
  assert.match(finalizeRoute, /replayAndPersistActivitySelection/);
  assert.match(finalizeRoute, /canonical_selection_replay_/);
  assert.doesNotMatch(finalizeRoute, /request\.json\(/);
  assert.doesNotMatch(
    finalizeRoute,
    /payload\.case_id|payload\.caseId|payload\.participant_id|payload\.profile_id|payload\.activity_id/,
  );

  assert.match(appPage, /fetch\("\/api\/participant\/workmap\/finalize"/);
  assert.match(appPage, /payload\.primaryActivitySelectionResult/);
  assert.match(appPage, /payload\.scopedWorkMap/);
  assert.match(appPage, /finalizeSavedParticipantWorkMap/);
  assert.match(appPage, /Estamos preparando las actividades principales de tu experiencia/);
  assert.match(appPage, /restoreResume\?\.source === "participant_workmap_snapshot"/);
  assert.match(appPage, /onSave=\{async \(draft\) => \{/);
  assert.match(appPage, /await finalizeSavedParticipantWorkMap\(draft\)/);
  assert.match(appPage, /setFlowState\(payload\.next\?\.flowState \?\? "intake_significado"\)/);
});

test("multiple profiles are processed deterministically and never surfaced as participant selection UI", () => {
  assert.match(canonicalSelectionService, /orderParticipantProfilesForAutomaticProcessing/);
  assert.match(canonicalSelectionService, /isPrimary/);
  assert.match(canonicalSelectionService, /roleLabel/);
  assert.match(canonicalSelectionService, /createdAt/);
  assert.match(canonicalSelectionService, /profileOrder: index \+ 1/);
  assert.match(canonicalSelectionService, /scopeWorkMapToParticipantProfile/);
  assert.doesNotMatch(appPage, /profile_selection_required/);
  assert.doesNotMatch(appPage, /Selecciona.*perfil|Selecciona.*actividad/i);
});

test("Significado consumes canonical selection and no longer recalculates from WorkMap", () => {
  assert.doesNotMatch(
    significadoScreen,
    /selectPrimaryActivitiesFromWorkMap\(workMap\)/,
  );
  assert.doesNotMatch(
    significadoDraftState,
    /selectPrimaryActivitiesFromWorkMap\(workMap\)/,
  );
  assert.match(significadoScreen, /primaryActivitySelectionResult \?\? null/);
  assert.match(significadoScreen, /Necesitamos preparar internamente tus actividades/);
  assert.match(significadoDraftState, /if \(!primaryActivitySelectionResult\)/);
});

test("C3.6 migration separates declared position from WorkMap functional profiles", () => {
  for (const expected of [
    "create table if not exists public.case_participant_positions",
    "create table if not exists public.case_participant_workmap_snapshots",
    "create table if not exists public.case_participant_profile_materialization_audit",
    "public.upsert_participant_workmap_snapshot",
    "public.materialize_case_participant_profiles_from_workmap",
    "v_invitation.metadata->>'declared_position'",
    "'case_participant_profile_id', null",
    "profile_id uuid",
    "participant_id uuid",
    "snapshot_status text",
  ]) {
    assert.ok(epistemicMigration.includes(expected), `Missing C3.6 contract: ${expected}`);
  }

  assert.doesNotMatch(epistemicMigration, /insert into public\.role_runtime_session/i);
  assert.doesNotMatch(epistemicMigration, /create_role_runtime_session_for_profile/i);
  assert.doesNotMatch(epistemicMigration, /requested_profiles?/i);
});
