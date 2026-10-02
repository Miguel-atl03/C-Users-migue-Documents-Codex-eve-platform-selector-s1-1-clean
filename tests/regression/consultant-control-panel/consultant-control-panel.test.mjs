import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

function readText(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(existsSync(resolve(projectRoot, relativePath)), true, `Missing ${relativePath}`);
}

const hookPath = join(tmpdir(), "eve-consultant-control-panel-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const projectRoot = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return { shortCircuit: true, url: pathToFileURL(mappedPath).href };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\\.(tsx?|jsx?|mjs|cjs|json)$/.test(specifier) &&
    context.parentURL
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const withTs = resolvePath(parentDir, specifier + ".ts");
    const withTsx = resolvePath(parentDir, specifier + ".tsx");
    if (existsSync(withTs)) {
      return { shortCircuit: true, url: pathToFileURL(withTs).href };
    }
    if (existsSync(withTsx)) {
      return { shortCircuit: true, url: pathToFileURL(withTsx).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href, import.meta.url);

const ACTIVE_SHELL_FILES = [
  "src/app/admin/consultant-control-panel/page.tsx",
  "src/app/admin/consultant-control-panel/loading.tsx",
  "src/app/admin/consultant-control-panel/error.tsx",
  "src/app/consultant/control-panel/page.tsx",
  "src/components/consultant/control-panel/ConsultantControlPanelPMShell.tsx",
  "src/components/consultant/control-panel/PMCaseHeader.tsx",
  "src/components/consultant/control-panel/PMProcessMap.tsx",
  "src/components/consultant/control-panel/PMProcessCard.tsx",
  "src/components/consultant/control-panel/PMTransitionConnector.tsx",
  "src/components/consultant/control-panel/PMViewSwitcher.tsx",
  "src/components/consultant/control-panel/CollapsedStatusLegend.tsx",
  "src/components/consultant/control-panel/PMSelectedTransitionDetail.tsx",
  "src/components/consultant/control-panel/PMOperationalWorkspace.tsx",
  "src/components/consultant/control-panel/OperationalPlaceholderPanel.tsx",
  "src/components/consultant/control-panel/pm-process-catalog.ts",
  "src/components/consultant/control-panel/pm-transitions.ts",
  "src/components/consultant/control-panel/pm-card-footer.ts",
  "src/components/consultant/control-panel/ConsultantControlPanel.tsx",
  "src/components/consultant/control-panel/CaseHeader.tsx",
  "src/components/consultant/control-panel/SidebarNavigation.tsx",
  "src/components/consultant/control-panel/StatusLegend.tsx",
  "src/components/consultant/control-panel/StatusBar.tsx",
  "src/components/consultant/control-panel/ControlPanelWorkspace.tsx",
  "src/components/consultant/control-panel/CaseReadinessSummary.tsx",
  "src/components/consultant/control-panel/CompanyUserRoleMatrix.tsx",
  "src/components/consultant/control-panel/CriticalAlertsStrip.tsx",
  "src/components/consultant/control-panel/FunctionalHelpPanel.tsx",
  "src/components/consultant/control-panel/RuntimeRunTable.tsx",
  "src/components/consultant/control-panel/RuntimeOperationalView.tsx",
  "src/components/consultant/control-panel/RuntimeHierarchyFilterPanel.tsx",
  "src/components/consultant/control-panel/RuntimeActivityRunList.tsx",
  "src/components/consultant/control-panel/RuntimeSelectedRunPanel.tsx",
  "src/components/consultant/control-panel/Runtime40BaseGrid.tsx",
  "src/components/consultant/control-panel/Runtime20CausalGrid.tsx",
  "src/components/consultant/control-panel/RunContextHeader.tsx",
  "src/components/consultant/control-panel/RuntimeScopeSelector.tsx",
  "src/components/consultant/control-panel/RuntimeAggregateSummary.tsx",
  "src/components/consultant/control-panel/GateReadinessPanel.tsx",
  "src/components/consultant/control-panel/OperationalTraceTimeline.tsx",
  "src/components/consultant/control-panel/DownloadsPanel.tsx",
  "src/components/consultant/control-panel/AuditTrailPanel.tsx",
  "src/components/consultant/control-panel/EvidenceDetailDrawer.tsx",
  "src/components/consultant/control-panel/ManualActionDrawer.tsx",
  "src/components/consultant/control-panel/ccp.module.css",
  "src/components/consultant/control-panel/ccp-pm.module.css",
  "src/services/eve/consultant-control-panel/consultant-control-panel-access.ts",
  "src/services/eve/consultant-control-panel/consultant-control-panel-service.ts",
  "src/services/eve/consultant-control-panel/consultant-control-panel-types.ts",
  "src/services/eve/consultant-control-panel/consultant-control-panel-enrichment.ts",
  "src/services/eve/consultant-control-panel/sup-final-objects-backbone.ts",
  "src/services/eve/consultant-control-panel/fixtures/cerveceria-ambar-ancestral-fixture.ts",
  "src/app/api/eve/consultant/control-panel/state/route.ts",
  "src/app/api/eve/consultant/control-panel/manual-action/route.ts",
  "src/app/api/eve/consultant/control-panel/download-request/route.ts",
];

const LEGACY_KEPT_FOR_STABILITY = [
  "src/components/consultant/control-panel/CaseCenterPanel.tsx",
  "src/components/consultant/control-panel/FunctionalUserHelpPanel.tsx",
  "src/components/consultant/control-panel/ClientCompanyProgressPanel.tsx",
  "src/components/consultant/control-panel/EveOperationalTracePanel.tsx",
  "src/components/consultant/control-panel/SupFinalObjectsBackbonePanel.tsx",
  "src/components/consultant/control-panel/ConsultantDownloadsPanel.tsx",
  "src/components/consultant/control-panel/ControlPanelFilters.tsx",
  "src/components/consultant/control-panel/AuditJustificationModal.tsx",
  "src/components/consultant/control-panel/PanelChrome.tsx",
];

test("active shell routes and components exist; legacy kept offline", () => {
  for (const path of ACTIVE_SHELL_FILES) assertExists(path);
  for (const path of LEGACY_KEPT_FOR_STABILITY) assertExists(path);
  assertExists(
    "docs/consultant-control-panel/architecture/Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx",
  );
  assertExists(
    "docs/consultant-control-panel/architecture/Especificacion_UI_FrontEnd_Panel_Control_Consultor_EVE_v1_1_Ajustada.docx",
  );
  assertExists(
    "docs/consultant-control-panel/consultant_control_panel_replacement_plan_v3_validated.md",
  );
});

test("UI-001/MIG: single official route, alias redirect, no v2 parallel", () => {
  const page = readText("src/app/admin/consultant-control-panel/page.tsx");
  assert.match(page, /ConsultantControlPanelPMShell/);
  assert.doesNotMatch(page, /CaseCenterPanel|EveOperationalTracePanel|ConsultantDownloadsPanel/);
  assert.doesNotMatch(page, /consultant-control-panel-v2|\/v2/);

  const alias = readText("src/app/consultant/control-panel/page.tsx");
  assert.match(alias, /\/admin\/consultant-control-panel/);
  assert.match(alias, /redirect\(/);
  assert.doesNotMatch(alias, /CaseCenterPanel|from "\.\/|from "@\/components/);
});

test("PM shell mother screen wraps operational panel below map", () => {
  const page = readText("src/app/admin/consultant-control-panel/page.tsx");
  assert.match(page, /ConsultantControlPanelPMShell/);
  assert.doesNotMatch(page, /return <ConsultantControlPanel /);

  const pmShell = readText(
    "src/components/consultant/control-panel/ConsultantControlPanelPMShell.tsx",
  );
  assert.match(pmShell, /ccp-pm-shell|data-shell=\"pm-mother\"/);
  assert.match(pmShell, /PMCaseHeader/);
  assert.match(pmShell, /PMProcessMap/);
  assert.doesNotMatch(pmShell, /CollapsedStatusLegend/);
  assert.match(pmShell, /PMSelectedTransitionDetail/);
  assert.match(
    readText("src/components/consultant/control-panel/PMSelectedTransitionDetail.tsx"),
    /transitionCollapseToggle|data-collapsed/,
  );
  assert.match(pmShell, /PMOperationalWorkspace/);
  assert.match(pmShell, /ConsultantControlPanel/);
  assert.match(pmShell, /mode=\"embedded\"/);
  assert.match(pmShell, /MAPA DE PROCESOS|PMProcessMap/);
  assert.doesNotMatch(pmShell, /Milestones completos/);
  assert.doesNotMatch(pmShell, /consultant-control-panel-v2|href=[\"'].*\/v2/);
  assert.doesNotMatch(pmShell, /footerCompact|Shell PM madre/);

  const pmHeader = readText(
    "src/components/consultant/control-panel/PMCaseHeader.tsx",
  );
  assert.match(pmHeader, /Empresa cliente/);
  assert.match(pmHeader, /Estado general del caso/);
  assert.match(pmHeader, /Progreso general/);
  assert.match(pmHeader, /Pendientes críticos/);
  assert.match(pmHeader, /Bloqueos/);
  assert.doesNotMatch(pmHeader, /manual_actions=false/);
  assert.doesNotMatch(pmHeader, /downloads=false/);
  assert.doesNotMatch(pmHeader, /Milestones completos/);

  const card = readText(
    "src/components/consultant/control-panel/PMProcessCard.tsx",
  );
  assert.match(card, /Objeto \/ Estado/);
  assert.match(card, /Evento que habilita/);
  assert.match(card, /Estado producido/);
  assert.match(card, /cardFooter/);
  assert.match(card, /ccp-pm-card-clock|ccp-pm-card-worker/);
  assert.match(card, /resolveCardStatusClock|footerWorkerRole/);
  assert.match(card, /statusPill/);

  const map = readText(
    "src/components/consultant/control-panel/PMProcessMap.tsx",
  );
  const connector = readText(
    "src/components/consultant/control-panel/PMTransitionConnector.tsx",
  );
  assert.match(map, /MAPA DE PROCESOS EVE \(PM\)/);
  assert.match(map, /PMViewSwitcher/);
  assert.match(map, /Gobernante/);
  assert.match(map, /isGoverning/);
  assert.match(map, /ccp-pm\.module\.css/);
  assert.match(map, /data-layout=\"horizontal-cards\"/);
  assert.match(connector, /syncBridge|ccp-pm-sync-bridge/);
  assert.match(map, /findTransitionBetween|evePmTransitions|PMTransitionConnector/);
  assert.doesNotMatch(map, /CollapsedStatusLegend/);
  assert.doesNotMatch(map, /process\.syncAfter/);
  assert.match(map, /ID relación|Object\[State\] origen|Estado runtime/);
  assert.match(map, /Cadena diagnóstica|Producción Paralela|Rework|Cliente/);

  const pmCss = readText(
    "src/components/consultant/control-panel/ccp-pm.module.css",
  );
  assert.match(pmCss, /\.processFlow\s*\{[\s\S]*flex-direction:\s*row\s*!important/);
  assert.match(pmCss, /\.topBar\s*\{/);
  assert.match(pmCss, /\.caseStrip\s*\{/);
  assert.match(pmCss, /\.governingBar/);
  assert.match(pmCss, /\.syncBridge/);
  assert.doesNotMatch(pmCss, /Milestones completos/);

  const catalogCodes = readText(
    "src/components/consultant/control-panel/pm-process-catalog.ts",
  );
  assert.match(catalogCodes, /P-CORE-01/);
  assert.match(catalogCodes, /P-SUP-01/);
  assert.match(catalogCodes, /P-SUP-07\/08/);
  assert.match(catalogCodes, /P-CLIENT-01/);
  assert.doesNotMatch(catalogCodes, /PF-CLIENT-01/);
  assert.match(catalogCodes, /Consolidar escena operativa regulada/);
  assert.match(catalogCodes, /DiagnosticoExpertoFinal.*Delivered|targetState:\s*"Delivered"/);
  assert.match(catalogCodes, /ClosedWithDeliveredCase/);
  assert.match(card, /enablingEventDisplay|Manual fuera de plataforma|manualScopeBadge/);
  assert.match(map, /ID relación|Tipo de conector|Patrón PM/);

  const workspaceOps = readText(
    "src/components/consultant/control-panel/PMOperationalWorkspace.tsx",
  );
  assert.match(workspaceOps, /Navegación operativa secundaria|ccp-pm-secondary-nav/);
  assert.match(workspaceOps, /debajo del mapa|secundaria al PM/);
});

test("PM process→operational view mapping and placeholders", () => {
  const catalog = readText(
    "src/components/consultant/control-panel/pm-process-catalog.ts",
  );
  assert.match(catalog, /PROCESS_OPERATIONAL_VIEWS/);
  assert.match(catalog, /"P-SUP-01":\s*\[["']cases["']/);
  assert.match(catalog, /"P-SUP-02":\s*\[["']evidence-bundle["']/);
  assert.match(catalog, /"P-SUP-05".*manual-actions/s);
  assert.match(catalog, /"P-SUP-06".*parallel-production/s);
  assert.match(catalog, /"P-CORE-01"/);
  assert.match(catalog, /"P-CLIENT-01".*experience.*pre-runtime/s);

  const placeholder = readText(
    "src/components/consultant/control-panel/OperationalPlaceholderPanel.tsx",
  );
  assert.match(placeholder, /sin diagnóstico automático/);
  assert.match(placeholder, /manual_actions\.enabled=false|descargas=false/);
  assert.doesNotMatch(placeholder, /Ejecutar Capa 2\.0|Generar diagnóstico Capa 3\.0/);
});

test("official Process Map card architecture (nine flow cards)", async () => {
  const {
    getEveProcessMapFlowCards,
    FORBIDDEN_PM_TRIGGERS,
    FORBIDDEN_PM_TARGET_STATES,
    buildPMProcessCards,
  } = await import(
    "../../../src/components/consultant/control-panel/pm-process-catalog.ts"
  );
  const { buildConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const cards = getEveProcessMapFlowCards();
  assert.equal(cards.length, 9);
  assert.equal(cards[4].targetState, "Delivered");
  assert.equal(cards[8].processId, "P-CLIENT-01");
  assert.equal(cards[8].targetState, "ClosedWithDeliveredCase");
  assert.equal(cards[6].triggerLabel, "Solicitud de validación estructural");
  assert.equal(cards[2].executionMode, "manual");
  assert.equal(cards[3].executionMode, "manual");
  assert.equal(cards[4].executionMode, "manual");

  for (const card of cards) {
    assert.equal(
      FORBIDDEN_PM_TRIGGERS.includes(card.triggerLabel),
      false,
      `forbidden PM trigger: ${card.triggerLabel}`,
    );
    assert.equal(
      FORBIDDEN_PM_TARGET_STATES.includes(card.targetState),
      false,
      `forbidden PM target state: ${card.targetState}`,
    );
  }

  assert.equal(cards[0].processName, "Consolidar escena operativa regulada");
  assert.equal(cards[0].triggerLabel, "Solicitud de consolidación de escena");
  assert.equal(cards[4].processName, "Componer síntesis experta");
  assert.equal(cards[4].targetObject, "DiagnosticoExpertoFinal");
  assert.equal(cards[8].processName, "Gestionar relación con cliente");

  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
  });
  const models = buildPMProcessCards(state).filter((item) => !item.isGoverning);
  assert.equal(models.length, 9);
  assert.equal(models[4].objectState, "DiagnosticoExpertoFinal [Delivered]");
  assert.equal(models[4].producedState, "Delivered");
  assert.equal(models[8].code, "P-CLIENT-01");
  assert.equal(models[8].objectState, "ClientEngagement [ClosedWithDeliveredCase]");
  assert.equal(models[2].executionMode, "manual");
  assert.equal(models[2].visualStatus, "no_iniciado");
  assert.equal(models[2].footerWorkerRole, "Consultor");
  assert.equal(models[0].footerWorkerRole, "Sistema");
  assert.equal(models[1].footerWorkerRole, "Consultor");
  assert.ok(models[0].completedAt);
  assert.ok(models[1].statusSinceAt);
});

test("PM card footer clock and worker resolve from status, not decoration", async () => {
  const {
    resolveCardWorker,
    resolveCardStatusClock,
    formatElapsedDuration,
  } = await import(
    "../../../src/components/consultant/control-panel/pm-card-footer.ts"
  );

  assert.equal(
    resolveCardWorker({
      processCode: "P-SUP-03",
      executionMode: "manual",
      visualStatus: "no_iniciado",
    }).role,
    "Consultor",
  );
  assert.equal(
    resolveCardWorker({
      processCode: "P-SUP-01",
      executionMode: "platform",
      visualStatus: "completado",
    }).role,
    "Sistema",
  );
  assert.equal(
    resolveCardWorker({
      processCode: "P-SUP-02",
      executionMode: "platform",
      visualStatus: "en_progreso",
      operationalStatus: "ready_with_flags",
    }).role,
    "Consultor",
  );

  const completed = resolveCardStatusClock({
    visualStatus: "completado",
    completedAt: "2026-07-10T15:20:00.000Z",
    statusSinceAt: "2026-07-10T15:20:00.000Z",
    nowMs: Date.parse("2026-07-13T12:00:00.000Z"),
  });
  assert.equal(completed.kind, "completed");
  assert.match(completed.text, /^\d{2}:\d{2}$/);

  const elapsed = resolveCardStatusClock({
    visualStatus: "en_progreso",
    completedAt: null,
    statusSinceAt: "2026-07-13T10:00:00.000Z",
    nowMs: Date.parse("2026-07-13T12:30:00.000Z"),
  });
  assert.equal(elapsed.kind, "elapsed");
  assert.equal(elapsed.text, "2h 30m");
  assert.equal(
    formatElapsedDuration("2026-07-13T12:00:00.000Z", Date.parse("2026-07-13T12:45:00.000Z")),
    "45m",
  );
});

test("PM transitions T01–T08: patterns, boundaries, no invented edges", async () => {
  const {
    getTransition,
    hasDirectDependency,
  } = await import(
    "../../../src/components/consultant/control-panel/pm-transitions.ts"
  );

  assert.equal(getTransition("T01").syncPattern, "fire_and_forget");
  assert.equal(getTransition("T02").syncPattern, "fire_and_forget");
  assert.equal(getTransition("T03").syncPattern, "fire_and_forget");
  assert.equal(getTransition("T04").syncPattern, "fire_and_forget");
  assert.equal(getTransition("T05").connectorKind, "branch_boundary");
  assert.equal(getTransition("T05").directDependency, false);
  assert.equal(getTransition("T05").syncPattern, null);
  assert.equal(getTransition("T06").syncPattern, "trigger_and_wait");
  assert.equal(getTransition("T06").rework?.targetProcessId, "P-SUP-06");
  assert.equal(getTransition("T07").syncPattern, "fire_and_forget");
  assert.equal(getTransition("T08").connectorKind, "client_boundary");
  assert.equal(getTransition("T08").directDependency, false);
  assert.equal(getTransition("T08").actualRelatedProcessId, "P-CORE-01");

  assert.equal(hasDirectDependency("P-SUP-05", "P-SUP-06"), false);
  assert.equal(hasDirectDependency("P-SUP-09", "P-CLIENT-01"), false);
});

test("INIT-001 and operational panel zones retained under PM shell", () => {
  const shell = readText(
    "src/components/consultant/control-panel/ConsultantControlPanel.tsx",
  );
  assert.match(shell, /CaseHeader/);
  assert.match(shell, /SidebarNavigation/);
  assert.match(shell, /StatusBar/);
  assert.match(shell, /ControlPanelWorkspace/);
  assert.match(shell, /EvidenceDetailDrawer/);
  assert.match(shell, /ManualActionDrawer/);
  assert.match(shell, /mode === \"embedded\"|mode=\"embedded\"|embedded/);
  assert.doesNotMatch(shell, /CaseCenterPanel|EveOperationalTracePanel|SupFinalObjectsBackbonePanel/);

  const header = readText(
    "src/components/consultant/control-panel/CaseHeader.tsx",
  );
  assert.match(header, /Modo solo lectura|READ-ONLY|Acceso cliente bloqueado|manual_actions=false/);

  const workspace = readText(
    "src/components/consultant/control-panel/ControlPanelWorkspace.tsx",
  );
  assert.match(workspace, /StatusLegend/);
  assert.match(workspace, /ccp-init-001/);
  assert.match(workspace, /CaseReadinessSummary/);
  assert.match(workspace, /CompanyUserRoleMatrix/);
  assert.match(workspace, /CriticalAlertsStrip/);
  assert.match(workspace, /Centro de casos/);

  const statusBar = readText(
    "src/components/consultant/control-panel/StatusBar.tsx",
  );
  assert.match(statusBar, /READ-ONLY/);
  assert.match(statusBar, /request_id/);
  assert.match(statusBar, /AUDITED_ENDPOINT_NOT_AVAILABLE|AUTHORIZED_GENERATOR_NOT_AVAILABLE/);
});

test("ROLE-001/002 and gates: distinct user vs role_runtime_session + ROLE_ASSIGNMENT_GAP", () => {
  const matrix = readText(
    "src/components/consultant/control-panel/CompanyUserRoleMatrix.tsx",
  );
  assert.match(matrix, /user_id|Usuario físico/);
  assert.match(matrix, /role_runtime_session|Rol funcional/);
  assert.match(matrix, /ROLE_ASSIGNMENT_GAP/);
  assert.match(matrix, /user_id ≠ role_runtime_session|No se fusionan runs entre roles/);

  const gates = readText(
    "src/components/consultant/control-panel/GateReadinessPanel.tsx",
  );
  assert.match(gates, /B0/);
  assert.match(gates, /B2/);
  assert.match(gates, /B3/);
  assert.match(gates, /B7/);
  assert.match(gates, /SEM/);
  assert.match(gates, /PST/);
  assert.match(gates, /ROLE_ASSIGNMENT_GAP/);
});

test("DATA/runtime: 40 and 20 grids keyed by activity_runtime_run", () => {
  const runs = readText(
    "src/components/consultant/control-panel/RuntimeRunTable.tsx",
  );
  assert.match(runs, /activity_runtime_run/);
  assert.match(runs, /role_runtime_session/);
  assert.match(runs, /presupuesto agregado/i);
  assert.match(runs, /selected_activity|runtime_view_scope/);
  assert.match(runs, /activity_id: run\.activityId/);
  assert.match(runs, /role_runtime_session_id: run\.roleRuntimeSessionId/);

  const operational = readText(
    "src/components/consultant/control-panel/RuntimeOperationalView.tsx",
  );
  assert.match(operational, /Runtime 40\+20/);
  assert.match(operational, /RuntimeHierarchyFilterPanel/);
  assert.match(operational, /RuntimeSelectedRunPanel/);
  assert.doesNotMatch(operational, /RuntimeScopeSelector/);
  assert.doesNotMatch(operational, /RuntimeAggregateSummary/);
  assert.doesNotMatch(operational, /RuntimeActivityRunList/);
  assert.doesNotMatch(operational, /Ver datos por/);
  assert.doesNotMatch(operational, /Runtime40BaseGrid/);
  assert.match(operational, /usuario epistémico|función epistémica/);

  const hierarchy = readText(
    "src/components/consultant/control-panel/RuntimeHierarchyFilterPanel.tsx",
  );
  assert.match(hierarchy, /Usuario epistémico/);
  assert.match(hierarchy, /Función epistémica de trabajo/);
  assert.match(hierarchy, /Actividad primaria/);
  assert.match(hierarchy, /runtimeHierarchyPanelHorizontal|Alcance operativo/);
  assert.match(hierarchy, /ccp-runtime-primary-activity-select/);
  assert.match(hierarchy, /run_id: match\?\.runId/);
  assert.match(hierarchy, /ROLE_ASSIGNMENT_GAP/);
  assert.match(hierarchy, /mixed_unresolved/);
  assert.match(hierarchy, /meta\.effective_scope|effective_scope/);
  assert.doesNotMatch(hierarchy, /Usuario físico/);
  assert.doesNotMatch(hierarchy, /runtimeFilterLabel\}>Función de trabajo</);

  const selectedPanel = readText(
    "src/components/consultant/control-panel/RuntimeSelectedRunPanel.tsx",
  );
  assert.match(selectedPanel, /RunContextHeader/);
  assert.match(selectedPanel, /Runtime40BaseGrid/);
  assert.match(selectedPanel, /Runtime20CausalGrid/);
  assert.match(selectedPanel, /OperationalTraceTimeline/);
  assert.match(selectedPanel, /EvidenceDetailDrawer/);
  assert.match(selectedPanel, /Resumen del run/);

  const base = readText(
    "src/components/consultant/control-panel/Runtime40BaseGrid.tsx",
  );
  assert.match(base, /Runtime 40 Base Grid/);
  assert.match(base, /Runtime 20 Causal Grid/);
  assert.match(base, /se esperaban 40/);
  assert.match(base, /se esperaban 20/);
  assert.match(base, /Estado objetivo/);
  assert.match(base, /Estado actual/);
  assert.match(base, /Gate \/ Regla de avance/);
  assert.match(base, /Detalle/);
  assert.match(base, /Clasificación/);
  assert.match(base, /Prioridad/);
  assert.match(base, /<th>Estado<\/th>/);
  assert.match(base, /<th>Estado objetivo<\/th>/);
  assert.match(base, /RunContextHeader|selectedRunContext/);
  assert.match(base, /base_items/);
  assert.match(base, /causal_items/);
  assert.doesNotMatch(base, /baseResolutionByRun\.find/);
  // Causal grid must keep original columns; not the reduced replacement table.
  assert.doesNotMatch(
    base,
    /<th>Causal ID<\/th>\s*<th>Bloque<\/th>\s*<th>Estado actual<\/th>\s*<th>Estado objetivo<\/th>/,
  );

  const header = readText(
    "src/components/consultant/control-panel/RunContextHeader.tsx",
  );
  assert.match(header, /Contexto del run seleccionado/);
  assert.match(header, /Empresa/);
  assert.match(header, /Usuario epistémico/);
  assert.match(header, /Función epistémica de trabajo/);
  assert.match(header, /Proceso PM asociado/);
  assert.match(header, /Catálogo Runtime/);
  assert.doesNotMatch(header, /Usuario físico/);
  assert.doesNotMatch(header, /label=\"Función de trabajo\"/);

  const workspace = readText(
    "src/components/consultant/control-panel/ControlPanelWorkspace.tsx",
  );
  assert.match(workspace, /RuntimeOperationalView/);
  assert.match(workspace, /selected_context|effective_scope/);
  assert.doesNotMatch(workspace, /Runtime40BaseGrid/);
});

test("DATA/runtime master-detail: default selected_activity, aggregate hides grids, integrity", async () => {
  const { buildConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const selected = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
    include: "run-detail",
    filters: {
      run_id: "arr-ambar-vendedor-a4-001",
      runtime_view_scope: "selected_activity",
      view: "runtime",
    },
  });
  assert.equal(selected.meta.effective_scope.runtime_view_scope, "selected_activity");
  assert.equal(selected.selected_context.effectiveScope, "selected_activity");
  assert.equal(selected.selected_context.isAggregateView, false);
  assert.equal(selected.base_items?.length, 40);
  assert.equal(selected.causal_items?.length, 20);
  assert.ok(selected.selected_context.roleRuntimeSessionId);
  assert.ok(selected.selected_context.physicalUserId);
  assert.notEqual(
    selected.selected_context.physicalUserId,
    selected.selected_context.roleRuntimeSessionId,
  );

  const aggregate = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
    include: "run-detail",
    filters: {
      run_id: "arr-ambar-vendedor-a4-001",
      runtime_view_scope: "case_all",
      view: "runtime",
    },
  });
  assert.equal(aggregate.selected_context.isAggregateView, true);
  assert.equal(aggregate.base_items, null);
  assert.equal(aggregate.causal_items, null);
  assert.ok(aggregate.runs.length >= 1);

  const roleSessions = new Set(aggregate.runs.map((run) => run.roleRuntimeSessionId));
  const users = new Set(aggregate.runs.map((run) => run.userId));
  assert.ok(roleSessions.size >= 1);
  assert.ok(users.size >= 1);
  for (const run of aggregate.runs) {
    assert.ok(run.roleRuntimeSessionId);
    assert.ok(run.userId);
    assert.notEqual(run.userId, run.roleRuntimeSessionId);
  }

  const baseSrc = readText(
    "src/components/consultant/control-panel/Runtime40BaseGrid.tsx",
  );
  assert.match(baseSrc, /baseItems\.length !== 40|se esperaban 40/);
  assert.match(baseSrc, /causalItems\.length !== 20|se esperaban 20/);
  assert.match(baseSrc, /ccp-base-integrity-error/);
  assert.match(baseSrc, /ccp-causal-integrity-error/);
  assert.match(baseSrc, /Estado objetivo/);

  const operationalSrc = readText(
    "src/components/consultant/control-panel/RuntimeOperationalView.tsx",
  );
  assert.doesNotMatch(operationalSrc, /Actividades primarias \/ runs/);
  assert.doesNotMatch(operationalSrc, /RuntimeActivityRunList/);
});

test("DATA-001: BFF selected_context and meta.effective_scope for ambar run", async () => {
  const { buildConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
    include: "run-detail",
    filters: {
      run_id: "arr-ambar-vendedor-a4-001",
      runtime_view_scope: "selected_activity",
      view: "runtime",
    },
  });

  assert.equal(state.selected_context.runId, "arr-ambar-vendedor-a4-001");
  assert.equal(state.selected_context.physicalUserId, "user-ambar-vendedor-001");
  assert.equal(state.selected_context.roleRuntimeSessionId, "rrs-ambar-vendedor-001");
  assert.equal(state.selected_context.roleLabel, "Vendedor");
  assert.equal(state.selected_context.activityId, "act-a4");
  assert.match(state.selected_context.activityTitle ?? "", /A4/);
  assert.equal(state.selected_context.pmProcessCode, "P-SUP-01");
  assert.equal(state.selected_context.catalogVersion, "1.1.1");
  assert.equal(state.selected_context.effectiveScope, "selected_activity");
  assert.equal(state.selected_context.isAggregateView, false);
  assert.equal(state.case_header.company_name, "Cervecería Ámbar Ancestral");
  assert.equal(state.meta.effective_scope.run_id, "arr-ambar-vendedor-a4-001");
  assert.equal(state.meta.effective_scope.runtime_view_scope, "selected_activity");
  assert.equal(state.meta.effective_scope.include, "run-detail");
  assert.equal(state.base_items?.length, 40);
  assert.equal(state.causal_items?.length, 20);

  const aggregate = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
    include: "run-detail",
    filters: {
      run_id: "arr-ambar-vendedor-a4-001",
      runtime_view_scope: "case_all",
      view: "runtime",
    },
  });
  assert.equal(aggregate.selected_context.isAggregateView, true);
  assert.equal(aggregate.base_items, null);
  assert.equal(aggregate.causal_items, null);
  assert.ok(aggregate.runs.length >= 1);
});

test("DL/SCOPE: capa 2/2.5/3 manual disabled; PP states visible; no auto execution", () => {
  const downloads = readText(
    "src/components/consultant/control-panel/DownloadsPanel.tsx",
  );
  assert.match(downloads, /Capa 2\.0 \/ 2\.5 \/ 3\.0 solo como/);
  assert.match(downloads, /descargas manuales deshabilitadas/);
  assert.match(downloads, /non_automatic_execution_flag/);
  assert.match(downloads, /Producción Paralela/);
  assert.match(downloads, /capabilities\.downloads\.enabled/);
  assert.doesNotMatch(downloads, /Ejecutar Capa 2\.0|Generar diagnóstico Capa 3\.0/);
});

test("ACTION-001: ManualActionDrawer preview contractual disabled", () => {
  const drawer = readText(
    "src/components/consultant/control-panel/ManualActionDrawer.tsx",
  );
  assert.match(drawer, /Preview contractual/);
  assert.match(drawer, /reason_code|AUDITED_ENDPOINT_NOT_AVAILABLE/);
  assert.match(drawer, /ACTION-001/);
  assert.match(drawer, /disabled/);
  assert.doesNotMatch(drawer, /handleManualActionRequest|fetch\(/);
});

test("capabilities and downloads contract from service", async () => {
  const {
    buildConsultantControlPanelState,
    handleManualActionRequest,
    handleDownloadRequest,
  } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const state = buildConsultantControlPanelState({ role: "consultant" });
  assert.equal(state.capabilities.read, true);
  assert.equal(state.capabilities.manual_actions.enabled, false);
  assert.equal(
    state.capabilities.manual_actions.reason_code,
    "AUDITED_ENDPOINT_NOT_AVAILABLE",
  );
  assert.equal(state.capabilities.downloads.enabled, false);
  assert.equal(
    state.capabilities.downloads.reason_code,
    "AUTHORIZED_GENERATOR_NOT_AVAILABLE",
  );
  assert.equal(state.contract_version, "1.0");
  assert.ok(state.request_id);

  for (const control of state.area_1_functional_help.manual_controls) {
    assert.equal(control.enabled, false);
  }

  const capa = state.area_4_downloads.downloads.filter((item) =>
    ["capa_2_0_manual_workbook", "capa_2_5_manual_workbook", "capa_3_0_manual_workbook"].includes(
      item.kind,
    ),
  );
  assert.equal(capa.length, 3);
  assert.ok(capa.every((item) => item.enabled === false));
  assert.ok(capa.every((item) => item.non_automatic_execution_flag === true));
  assert.ok(
    state.area_4_downloads.downloads.every((item) => item.enabled === false),
  );

  const rejected = handleManualActionRequest({
    action: "continue_block",
    justification: "",
    scope: state.filters,
    previous_state: null,
    new_state: null,
    consultant_user_id: "c1",
  });
  assert.equal(rejected.status, "rejected");

  const disabled = handleManualActionRequest({
    action: "continue_block",
    justification: "Usuario bloqueado",
    scope: state.filters,
    previous_state: "shown",
    new_state: "next_pending",
    consultant_user_id: "c1",
  });
  assert.equal(disabled.status, "disabled_requires_audited_endpoint");

  const pending = handleDownloadRequest({
    kind: "consultant_packet",
    justification: "Revisión experta",
    scope: state.filters,
    consultant_user_id: "c1",
  });
  assert.equal(pending.status, "authorized_pending_generator");
});

test("ROLE_ASSIGNMENT_GAP enrichment when mixed_unresolved", async () => {
  const { enrichConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-enrichment.ts"
  );
  const { buildConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const base = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
  });
  base.area_2_client_progress.users[0].functional_separation_state = "mixed_unresolved";
  const enriched = enrichConsultantControlPanelState(base);
  assert.ok(
    enriched.critical_alerts.some((alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP"),
  );
  assert.ok(
    enriched.area_2_client_progress.users.every((user) =>
      Array.isArray(user.role_runtime_sessions),
    ),
  );
  assert.ok(
    enriched.area_2_client_progress.users.every(
      (user) => user.user_id && (user.role_runtime_sessions?.length ?? 0) >= 0,
    ),
  );
});

test("client access blocked; no service_role / supabase in active shell", async () => {
  const { assertConsultantControlPanelAccess } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-access.ts"
  );

  const clientDenied = assertConsultantControlPanelAccess(
    new Request("https://eve.local/api/eve/consultant/control-panel/state", {
      headers: { "x-eve-surface": "client" },
    }),
    { NODE_ENV: "development" },
  );
  assert.equal(clientDenied.ok, false);
  assert.equal(clientDenied.status, 403);

  for (const path of ACTIVE_SHELL_FILES) {
    const source = readText(path);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE/);
    assert.doesNotMatch(source, /process\.env\.[A-Z0-9_]*SERVICE_ROLE/);
    assert.doesNotMatch(source, /createBrowserClient/);
    assert.doesNotMatch(source, /from "@supabase/);
  }
});

test("ambar fixture still validates 40/20 per activity_runtime_run", async () => {
  const {
    buildConsultantControlPanelState,
    validateAmbarFixtureState,
  } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );

  const state = buildConsultantControlPanelState({
    role: "consultant",
    fixtureQuery: "ambar",
    env: { NODE_ENV: "development" },
  });

  const validation = validateAmbarFixtureState({
    fixtureQuery: "ambar",
    state,
    env: { NODE_ENV: "development" },
  });
  assert.equal(validation.ok, true, validation.failures.join("; "));

  assert.equal(state.capabilities.manual_actions.enabled, false);
  assert.equal(state.capabilities.downloads.enabled, false);
  assert.equal(state.area_3_operational_trace.baseResolutionByRun.length, 3);
  assert.ok(
    state.area_3_operational_trace.baseResolutionByRun.every(
      (run) => run.records.length === 40 && run.skipped_silently_count === 0,
    ),
  );
  assert.ok(
    state.area_3_operational_trace.causalClosureByRun.every(
      (run) => run.records.length === 20,
    ),
  );
  assert.ok(
    state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.every(
      (run) =>
        run.baseLimit === 40 &&
        run.causalLimit === 20 &&
        Boolean(run.roleRuntimeSessionId) &&
        Boolean(run.userId) &&
        run.userId !== run.roleRuntimeSessionId,
    ),
  );
  assert.ok(state.critical_alerts.length >= 1);
  assert.ok(
    state.area_4_downloads.downloads.some((item) => item.kind === "capa_2_0_manual_workbook"),
  );
  assert.equal(state.boundary.diagnosis_final_automatic, false);
  assert.equal(state.boundary.productive_export_executed, false);
  assert.ok(state.selected_context.companyName);
  assert.ok(state.selected_context.runId);
  assert.ok(state.selected_context.roleRuntimeSessionId);
  assert.equal(state.selected_context.pmProcessCode, "P-SUP-01");
  assert.equal(state.selected_context.catalogVersion, "1.1.1");
  assert.equal(state.base_items?.length, 40);
  assert.equal(state.causal_items?.length, 20);
  assert.equal(state.meta.effective_scope.runtime_view_scope, "selected_activity");
});

test("SUP backbone data retained in state even if UI panel is offline", async () => {
  const { buildConsultantControlPanelState } = await import(
    "../../../src/services/eve/consultant-control-panel/consultant-control-panel-service.ts"
  );
  const empty = buildConsultantControlPanelState({});
  assert.equal(empty.sup_final_objects_backbone.objects.length, 5);
  assert.equal(empty.sup_final_objects_backbone.productive_export_blocked, true);

  const shell = readText(
    "src/components/consultant/control-panel/ConsultantControlPanel.tsx",
  );
  assert.doesNotMatch(shell, /SupFinalObjectsBackbonePanel/);
  const downloads = readText(
    "src/components/consultant/control-panel/DownloadsPanel.tsx",
  );
  assert.match(downloads, /causal_chain|Producción Paralela/);
});
