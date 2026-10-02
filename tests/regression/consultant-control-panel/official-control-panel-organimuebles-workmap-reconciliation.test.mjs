import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");
const emptyModule = resolve(tmpdir(), "eve-empty-server-only.mjs");
const hookPath = resolve(tmpdir(), "eve-organimuebles-workmap-hook.mjs");
writeFileSync(emptyModule, "export {};\n");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
const empty = ${JSON.stringify(pathToFileURL(emptyModule).href)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { shortCircuit: true, url: empty };
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

function read(path) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

const { deriveNextStep, resolveWorkMapProjectionStatus } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
    ),
  ).href,
);

test("participante con puesto no se proyecta como perfil funcional", () => {
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  assert.match(service, /declaredPosition/);
  assert.match(service, /rol_declarado/);
  assert.match(service, /pending_materialization/);
  assert.doesNotMatch(service, /label:\s*declaredPosition/);
});

test("perfil sin sesion y sesion sin Runtime conservan not_started", () => {
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  assert.match(service, /linkedSessionId \? "active" : "not_started"/);
  assert.match(service, /runtimeRuns\.length > 0/);
  assert.match(service, /"prepared"/);
  assert.match(service, /"Sesion funcional aun no iniciada"/);
  assert.match(service, /"Runtime aun no iniciado"/);
});

test("WorkMap guardado y perfil confirmado piden elegibilidad antes de seleccion efectiva", () => {
  assert.equal(
    deriveNextStep({
      workmapSaved: true,
      activityCount: 15,
      hasEffectiveSelection: false,
      hasProfile: true,
      hasEligibility: false,
      hasRuntime: false,
      profileLabel: "Venta",
    }),
    "Preparar elegibilidad de actividades primarias del perfil Venta",
  );
});

test("elegibilidad calculada sin seleccion efectiva pide revision primaria", () => {
  assert.equal(
    deriveNextStep({
      workmapSaved: true,
      activityCount: 15,
      hasEffectiveSelection: false,
      hasProfile: true,
      hasEligibility: true,
      hasRuntime: false,
      profileLabel: "Venta",
    }),
    "Revisar y confirmar las actividades primarias del perfil Venta",
  );
});

test("seleccion efectiva sin perfil pide materializacion", () => {
  assert.equal(
    deriveNextStep({
      workmapSaved: true,
      activityCount: 15,
      hasEffectiveSelection: true,
      hasProfile: false,
      hasEligibility: false,
      hasRuntime: false,
      profileLabel: null,
    }),
    "Materializar el perfil funcional",
  );
});

test("caso activo sin WorkMap no inventa avance", () => {
  assert.equal(
    deriveNextStep({
      workmapSaved: false,
      activityCount: 0,
      hasEffectiveSelection: false,
      hasProfile: false,
      hasEligibility: false,
      hasRuntime: false,
      profileLabel: null,
    }),
    "Guardar el WorkMap del participante",
  );
});

test("proyeccion vencida se marca stale", () => {
  assert.equal(
    resolveWorkMapProjectionStatus({
      hasWorkMap: true,
      hasActivities: true,
      lastUpdatedAt: "2020-01-01T00:00:00.000Z",
      findings: [],
    }),
    "stale",
  );
});

test("scope ajeno y engagement cruzado se rechazan por filtros acumulativos", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/workmap-progress/route.ts",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  assert.match(route, /assertConsultantCaseParticipantAccess/);
  assert.match(route, /const userId = url\.searchParams\.get\("user_id"\)/);
  assert.match(route, /userId && !isOpaqueUuid\(userId\)/);
  assert.match(route, /userId,/);
  assert.match(service, /relationshipRow\.client_company_id === companyId/);
  assert.match(
    service,
    /resolveParticipant\(\s*participants,\s*requestedParticipantId,\s*caseId,\s*requestedUserId,\s*\)/,
  );
  assert.match(service, /userId:\s*matched\.userId \?\? requestedUserId/);
});

test("sponsor no se obtiene desde case_participants", () => {
  const repository = read(
    "src/services/eve/official-control-panel/official-control-panel-participants-repository.ts",
  );
  assert.doesNotMatch(repository, /case_sponsors/);
  assert.match(repository, /\.eq\("status", "active"\)/);
});

test("ultima pantalla ausente produce finding y no evento retroactivo", () => {
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  const page = read("src/app/page.tsx");
  assert.match(service, /last_screen_missing/);
  assert.match(service, /Instrumentaci/);
  assert.match(page, /eventType:\s*"screen_entered"/);
  assert.doesNotMatch(page, /occurredAt/);
});

test("instrumentacion WorkMap usa BFF autenticado e idempotencia estable", () => {
  const page = read("src/app/page.tsx");
  const route = read(
    "src/app/api/eve/runtime-40-20/client-bff/experience-event/route.ts",
  );
  assert.match(page, /eventType:\s*"workmap_saved"/);
  assert.match(page, /requestId:\s*idempotencyKey/);
  assert.match(route, /domainEventType:\s*requestedEventType/);
  assert.match(route, /eve_record_experience_event_as_user/);
});

test("URL preserva scope canonico y compatibilidad de lectura", () => {
  const context = read(
    "src/features/official-consultant-control-panel/state/client-context-navigation.ts",
  );
  const depth = read(
    "src/features/official-consultant-control-panel/state/monitoring-depth-navigation.ts",
  );
  assert.match(context, /company_id/);
  assert.match(context, /engagement_id/);
  assert.match(context, /case_id/);
  assert.match(depth, /participant_id/);
  assert.match(depth, /profile_id/);
});

test("WorkMap y Atencion comparten el mismo findingId", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /alertId:\s*item\.findingId/);
  assert.match(shell, /unifiedAttentionAlerts/);
});

test("H0 usa el caso real y H1-H6 no se promueven", () => {
  const repository = read(
    "src/services/eve/official-control-panel/official-control-panel-core-milestone-axis-repository.ts",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-core-milestone-axis-service.ts",
  );
  assert.match(repository, /\.from\("sesiones_llenado"\)/);
  assert.match(repository, /code === "H0"/);
  assert.match(service, /no iniciado/);
});

test("A2 no proyecta actividades completas en la vista macro WorkMap", () => {
  const panel = read(
    "src/features/official-consultant-control-panel/components/WorkMapProgressPanel.tsx",
  );
  assert.match(panel, /onViewActivities/);
  assert.match(panel, /Actividades capturadas/);
  assert.match(panel, /drilldown usuario, perfil y actividad/);
  assert.doesNotMatch(panel, /progress\.activities\.map/);
});

test("A2 muestra perfil WorkMap parcial sin materializarlo como seleccion efectiva", () => {
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  assert.match(service, /resolveWorkMapProfileLabel/);
  assert.match(service, /selectedAreas/);
  assert.match(service, /profile \? "materialized" : "pending_materialization"/);
  assert.match(service, /!input\.hasProfile\) return "Materializar el perfil funcional"/);
});

test("A3-F expone matriz horizontal y conserva drilldown usuario perfil actividad", () => {
  const participants = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  assert.match(participants, /data-testid="user-indicator-matrix"/);
  assert.match(participants, /function UserIndicatorMatrix/);
  assert.match(participants, /Total de participantes/);
  assert.match(participants, /WorkMaps guardados/);
  assert.match(participants, /Elegibles/);
  assert.match(participants, /Primarias/);
  assert.match(participants, /No primarias/);
  assert.match(participants, /Runtime en ejecución/);
  assert.match(participants, /Sesiones Runtime preparadas/);
  assert.match(participants, /Runs preparados/);
  assert.match(participants, /Participantes con atención/);
  assert.doesNotMatch(participants, /\u00c3|\u00c2|\u00e2\u20ac\u201d/);
  assert.match(participants, /data-testid="participants-monitoring-table"/);
  assert.match(participants, /Puesto declarado/);
  assert.match(participants, /Responsabilidades/);
  assert.match(participants, /Etapa actual/);
  assert.match(participants, /data-participant-id=\{participantId\}/);
  assert.doesNotMatch(participants, /participant-aggregate-summary/);
  assert.doesNotMatch(participants, /Perfiles confirmados|Elegibilidades pendientes|Selecciones pendientes|Sesiones iniciadas/);
  assert.doesNotMatch(participants, /ParticipantProfileDetail/);
  assert.match(participants, /data-testid="workmap-activity-drilldown"/);
  assert.match(participants, /Monitoreo recursivo: usuario - rol funcional - actividad/);
  assert.doesNotMatch(participants, /normalizeParticipantLabel/);
  assert.match(participants, /profile_binding/);
  assert.match(participants, /unverifiable/);
  assert.match(participants, /Ver detalle/);
  assert.match(participants, /progress\.activities\.map/);
  assert.match(participants, /onSelectActivity/);
});

test("A3-F elimina solo WorkMap del caso y Persona participante del render de monitoreo", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  const participants = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  assert.doesNotMatch(shell, /WorkMapProgressPanel/);
  assert.doesNotMatch(participants, /ParticipantProfileDetail/);
  assert.match(shell, /CoreMilestoneDetail/);
  assert.match(shell, /XyInteractionMatrix/);
  assert.match(shell, /CaseParticipantsPanel/);
  assert.match(shell, /ParallelProductionPanel/);
  assert.match(participants, /ActivityRuntimePanel/);
  assert.match(participants, /WorkMapActivityDrilldown/);
});

test("A3-F BFF produce matriz por case_participant_id sin consultas frontend a tablas", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/user-indicator-matrix/route.ts",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-user-indicator-matrix-service.ts",
  );
  const client = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  assert.match(route, /assertConsultantClientContextAccess/);
  assert.match(route, /buildCaseUserIndicatorMatrix/);
  assert.match(service, /\.from\("case_participants"\)/);
  assert.match(service, /participantId:\s*row\.participantId/);
  assert.match(service, /case_participant_workmap_snapshots/);
  assert.match(service, /activity_selection_results/);
  assert.match(service, /activity_runtime_run/);
  assert.match(service, /case_participant_positions/);
  assert.match(service, /case_participant_profiles/);
  assert.match(service, /sourceWorkmapId/);
  assert.match(service, /materializedValues\.length > 0/);
  assert.match(client, /getCaseUserIndicatorMatrix/);
  assert.doesNotMatch(client, /\.from\("case_participants"\)/);
});

test("A2 preserva scope URL hasta actividad y mantiene user_id", () => {
  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-participants.ts",
  );
  const workMapHook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-workmap-progress.ts",
  );
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  const api = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  const depth = read(
    "src/features/official-consultant-control-panel/state/monitoring-depth-navigation.ts",
  );
  const context = read(
    "src/features/official-consultant-control-panel/state/client-context-navigation.ts",
  );
  assert.match(hook, /userIdByParticipantId/);
  assert.match(hook, /\.\.\.monitoringUsers\.map\(\(item\) => item\.participantId\)/);
  assert.match(hook, /userId:\s*userIdByParticipantId\.get\(participantId\)/);
  assert.match(shell, /userId:\s*participantsView\.selectedParticipant\?\.userId \?\? null/);
  assert.match(workMapHook, /userId = null/);
  assert.match(workMapHook, /getCaseWorkMapProgress\(/);
  assert.match(api, /params\.set\("user_id", userId\)/);
  assert.match(hook, /get\("case_id"\)/);
  assert.match(depth, /user_id/);
  assert.match(depth, /activity_id/);
  assert.match(context, /if \(previousCaseId !== selection\.caseId\) \{\s*clearFutureDependencies/s);
});

test("A2 pagina y filtra actividades desde el BFF de WorkMap", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/workmap-progress/route.ts",
  );
  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-workmap-progress-service.ts",
  );
  const client = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  assert.match(route, /page_size/);
  assert.match(route, /selection_status/);
  assert.match(service, /function pageActivities/);
  assert.match(service, /Math\.min\(100/);
  assert.match(client, /pageSize \?\? 10/);
});

test("A2 Runtime pendiente se comunica como no iniciado y no como avance inventado", () => {
  const runtime = read(
    "src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx",
  );
  assert.match(runtime, /workMapPendingRuntime/);
  assert.match(runtime, /A.n no iniciado/);
  assert.match(runtime, /Elegibilidad y selecci.n efectiva pendientes/);
  assert.match(runtime, /No evaluable todav.a/);
  assert.match(runtime, /No iniciado/);
});

test("A4 reconcilia participante perfil cobertura runtime y degradación sin ejecución", () => {
  const participants = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  const matrixTypes = read(
    "src/services/eve/official-control-panel/official-control-panel-user-indicator-matrix.types.ts",
  );
  const matrixService = read(
    "src/services/eve/official-control-panel/official-control-panel-user-indicator-matrix-service.ts",
  );
  const coverage = read(
    "src/features/official-consultant-control-panel/components/ActivitySelectionCoveragePanel.tsx",
  );
  const parallel = read(
    "src/services/eve/official-control-panel/official-control-panel-parallel-production-service.ts",
  );
  const parallelPanel = read(
    "src/features/official-consultant-control-panel/components/ParallelProductionPanel.tsx",
  );

  assert.match(matrixTypes, /declaredPosition/);
  assert.match(matrixTypes, /functionalProfileId/);
  assert.match(matrixTypes, /responsibilityCount/);
  assert.match(matrixTypes, /activityCount/);
  assert.match(matrixTypes, /eligibleActivityCount/);
  assert.match(matrixTypes, /preparedRuntimeRunCount/);
  assert.match(matrixTypes, /functionalSessionLabel/);
  assert.match(matrixService, /participantId:\s*row\.participantId/);
  assert.match(matrixService, /positions\[String\(row\.id\)\]/);
  assert.match(matrixService, /profileFacts\.byParticipant/);
  assert.match(participants, /matrixUserById/);
  assert.match(participants, /workMapProgress\?\.participant\?\.id === participantId/);
  assert.match(participants, /resolveFunctionalProfileLabel/);
  assert.match(participants, /activitySpecificFinding/);
  assert.doesNotMatch(participants, /finding\?\.title \?\? "Sin finding"/);
  assert.match(coverage, /Siguiente productor requerido/);
  assert.match(coverage, /nextProducerRequired/);
  assert.match(parallel, /A.n no iniciada/);
  assert.match(parallelPanel, /A.n no iniciada/);
});


