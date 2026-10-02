import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(path, "utf8");
}

test("P1.4 exposes selector conformance only through governed consultant BFF", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/activity-selection/[selectionResultId]/items/[itemId]/conformance/route.ts",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-conformance-service.ts",
  );
  const client = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );

  assert.match(route, /authenticateOfficialControlPanelConsultant/);
  assert.match(route, /assertConsultantCaseParticipantAccess/);
  assert.match(route, /createOfficialControlPanelServiceRoleClient/);
  assert.match(route, /loadActivitySelectionConformanceScope/);
  assert.match(route, /activity_selection_conformance_access_denied/);
  assert.match(service, /\.from\("activity_selection_results"\)/);
  assert.match(service, /\.from\("activity_selection_result_items"\)/);
  assert.match(service, /buildLegacyTraceMessage/);
  assert.match(service, /eligible_count/);
  assert.match(service, /selected_count/);
  assert.match(service, /non_primary_context_count/);
  assert.match(client, /getActivitySelectionConformance/);
  assert.doesNotMatch(client, /\.from\("activity_selection_results"\)/);
  assert.doesNotMatch(client, /\.from\("activity_selection_result_items"\)/);
});

test("P1.4 panel renders persisted detail without participant-facing selector controls", () => {
  const panel = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-conformance-service.ts",
  );
  const progressTypes = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress.types.ts",
  );
  const progressService = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );

  assert.match(panel, /Conformidad C3\.12/);
  assert.match(panel, /ProfileConformanceSummary/);
  assert.match(panel, /Política aplicada/);
  assert.match(panel, /Selection mode/);
  assert.match(panel, /Trace completeness/);
  assert.match(panel, /Estado global/);
  assert.match(panel, /ActivitySelectionConformanceDetail/);
  assert.match(panel, /legacyTraceMessage/);
  assert.match(panel, /handleToggleActivity/);
  assert.match(panel, /activity-conformance-drawer/);
  assert.match(panel, /Cargando detalle/);
  assert.match(service, /Esta selección fue ejecutada antes de la trazabilidad exhaustiva C3\.12/);
  assert.match(service, /El resultado de \$\{evaluated\}\/\$\{primary\}\/\$\{contextual\} se conserva/);
  assert.match(service, /caseLabel/);
  assert.match(service, /profileLabel/);
  assert.match(service, /responsibilityLabel/);
  assert.match(service, /profileBinding/);
  assert.match(service, /activity_description_source/);
  assert.match(service, /activityLabel = textOrNull\(item\.display_label\)/);
  assert.doesNotMatch(service, /textOrNull\(item\.activity_description\) \?\?\s*textOrNull\(item\.display_label\)/);
  assert.match(panel, /Responsabilidad fuente/);
  assert.match(panel, /Procedencia técnica/);
  assert.match(panel, /activity_description_source/);
  assert.match(panel, /profile_binding/);
  assert.match(panel, /workmap_snapshot_hash/);
  assert.match(panel, /policy_manifest_hash/);
  assert.match(panel, /selection_result_hash/);
  assert.match(panel, /No aplica — no genera Runtime/);
  assert.match(panel, /Inconsistencia — run no localizado/);
  assert.match(panel, /Plantilla completa/);
  assert.match(panel, /Selector_Template_v1_3/);
  assert.match(panel, /Extensión C3\.12/);
  assert.match(panel, /promotionCondition/);
  assert.match(panel, /QA status/);
  [
    "activity_id",
    "responsibility_id",
    "responsibility_title",
    "activity_index",
    "activity_title",
    "activity_description",
    "eligibility_status",
    "exclusion_reason",
    "pmSignalPotential",
    "mocSignalPotential",
    "pfSignalPotential",
    "olcSignalPotential",
    "architecturalSignalPotential",
    "operationalCentrality",
    "transformationObjectSignal",
    "handoffDependencySignal",
    "timerWaitSignal",
    "synchronizationGovernanceSignal",
    "frictionExceptionSignal",
    "pfOlcRiskSignal",
    "coverageDiversityValue",
    "duplicatePenalty",
    "tooMacroPenalty",
    "tooMicroPenalty",
    "overlySpecificToolPenalty",
    "lateralContextPenalty",
    "responsibilityBalanceAdjustment",
    "finalSelectionScore",
    "preferredSlotCandidate",
    "selectedSlot",
    "selectionStatus",
    "selectionReasonCode",
    "selectionReasonText",
    "nonPrimaryContextStatus",
    "runtimeHandoffPriority",
    "traceFlags",
    "manualReviewRequired",
    "notes",
  ].forEach((field) => assert.match(panel, new RegExp(field)));
  assert.match(panel, /No persistido/);
  assert.match(panel, /No verificable/);
  assert.match(panel, /No aplicable/);
  assert.match(panel, /Revisión requerida/);
  assert.match(panel, /Dato desconocido/);
  assert.doesNotMatch(panel, /Selecciona una actividad primaria/);
  assert.doesNotMatch(panel, /Elegir actividad/);
  assert.match(progressTypes, /selectionResultId\?: string \| null/);
  assert.match(progressTypes, /selectionResultItemId\?: string \| null/);
  assert.match(progressTypes, /traceCompletenessStatus: string \| null/);
  assert.match(progressTypes, /replayStatus: string \| null/);
  assert.match(progressService, /id, result_id, activity_id/);
  assert.match(progressService, /selectionResultItemId/);
});

test("R2.2 finalize and Runtime RPC do not reuse archived Runtime sessions", () => {
  const finalizeRoute = read("src/app/api/participant/workmap/finalize/route.ts");
  const rpcMigration = read(
    "supabase/migrations/20260801191500_eve_runtime_session_rpc_ignores_archived.sql",
  );
  const monitoringRuntimeRepository = read(
    "src/services/eve/official-control-panel/official-control-panel-monitoring-runtime-repository.ts",
  );

  assert.match(finalizeRoute, /owner_auth_user_id, state/);
  assert.match(finalizeRoute, /runtime_session_archived/);
  assert.match(rpcMigration, /r\.state is distinct from 'archived'/);
  assert.match(rpcMigration, /Archived Runtime sessions are historical evidence/);
  assert.match(monitoringRuntimeRepository, /session\.state === "archived"/);
});

test("R2.3 activity_description_source is never inferred from text content", () => {
  const replay = read(
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-replay.ts",
  );
  const conformanceService = read(
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-conformance-service.ts",
  );
  const mutation = read(
    "src/services/eve/official-control-panel/official-control-panel-activity-selection-mutation.ts",
  );
  const finalizeRoute = read("src/app/api/participant/workmap/finalize/route.ts");
  const panel = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  const migration = read(
    "supabase/migrations/20260803100000_eve_activity_description_source_legacy_unknown.sql",
  );

  assert.match(replay, /activity_description_source_legacy_unknown/);
  assert.match(replay, /replayStatus: "unverifiable"/);
  assert.match(replay, /persistedActivityDescriptionSource/);
  assert.match(conformanceService, /return "legacy_unknown"/);
  assert.match(mutation, /activity_description_source_required/);
  assert.match(finalizeRoute, /activity_description_source_required/);
  assert.match(panel, /Capturada explícitamente en WorkMap/);
  assert.match(panel, /No capturada/);
  assert.match(panel, /Procedencia histórica no verificable/);
  assert.match(migration, /'workmap_explicit', 'absent', 'legacy_unknown'/);
  assert.match(migration, /coalesce\(result\.lifecycle_state, ''\) in \('superseded', 'archived'\)/);
  assert.doesNotMatch(
    replay,
    /row\.activity_description_source\s*\?\?\s*\(\s*row\.activity_description == null \? "absent" : "workmap_explicit"\s*\)/,
  );
  assert.doesNotMatch(
    conformanceService,
    /textOrNull\(item\.activity_description_source\)\s*\?\?\s*\(\s*textOrNull\(item\.activity_description\) == null \? "absent" : "workmap_explicit"\s*\)/,
  );
});
