import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-base-matrix-a-hook.mjs");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
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

const { RUNTIME_BASE_MATRIX_CATALOG } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/catalogs/runtime-base-matrix.catalog.ts",
    ),
  ).href
);
const { RUNTIME_CAUSAL_MATRIX_CATALOG } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/catalogs/runtime-causal-matrix.catalog.ts",
    ),
  ).href
);
const { BASE40_BASE_IDS } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/runtime-40-20/operational-rules/base40-operational-rule.ts",
    ),
  ).href
);
const { CAUSAL20_IDS } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/runtime-40-20/operational-rules/causal20-operational-rule.ts",
    ),
  ).href
);
const {
  buildBaseMatrixRows,
  buildCausalMatrixRows,
  buildCatalogOnlyUnavailableBaseMatrixView,
  buildCatalogOnlyUnavailableCausalMatrixView,
  buildRuntimeBaseMatrixView,
  buildRuntimeCausalMatrixView,
  presentFactualActivationLabel,
  presentFactualBlockingLabel,
  presentFactualResolutionLabel,
  presentCausalClosureLabel,
  presentReadinessImpactLabel,
  resolveBaseMatrixDataStatus,
  resolveCausalMatrixDataStatus,
  resolveSelectedQuestionNode,
  validateCausalClosureVariables,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-runtime-matrix-service.ts",
    ),
  ).href
);
const {
  presentCausalTechnicalCode,
  presentCausalBlockingRuleLabel,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/causal-matrix-presentation.ts",
    ),
  ).href
);

function emptyRepo(overrides = {}) {
  return {
    async findRunById() {
      return {
        id: "run-1",
        caseId: "case-1",
        activityId: "act-1",
        roleRuntimeSessionId: "rrs-1",
        state: "initialized",
        catalogVersionId: "cat-1",
      };
    },
    async listBranchingDecisionsByRun() {
      return [];
    },
    async listInteractionInstancesByRun() {
      return [];
    },
    async listInteractionMappingsByCatalogVersion() {
      return [];
    },
    async listSourceNodeRefsByCatalogVersion() {
      return [];
    },
    async listSubfieldResponsesByRun() {
      return [];
    },
    ...overrides,
  };
}

test("40 IDs canónicos y orden exacto", () => {
  assert.equal(RUNTIME_BASE_MATRIX_CATALOG.length, 40);
  assert.deepEqual(
    RUNTIME_BASE_MATRIX_CATALOG.map((r) => r.id),
    [...BASE40_BASE_IDS],
  );
  assert.equal(RUNTIME_BASE_MATRIX_CATALOG[4].displayId, "B0.5-Q05");
});

test("UI Entrega B: tabs Base/Causal; columnas congeladas; sin footer", () => {
  const ui = readFileSync(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/components/RuntimeActivityMatrixPanel.tsx",
    ),
    "utf8",
  );
  for (const col of [
    "ID",
    "Nodo fuente",
    "Pregunta base seleccionada",
    "Razón de selección",
    "Cierre satisfactorio",
    "Bloqueo",
    "Revisión",
    "Función",
  ]) {
    assert.match(ui, new RegExp(col));
  }
  for (const col of [
    "Prioridad/clase",
    "Activación documental",
    "Bloqueo si falla",
    "Bloquea ready pleno",
  ]) {
    assert.match(ui, new RegExp(col));
  }
  assert.match(ui, /getRuntimeBaseMatrix/);
  assert.match(ui, /getRuntimeCausalMatrix/);
  assert.match(ui, /buildCatalogOnlyUnavailableBaseMatrixView/);
  assert.match(ui, /buildCatalogOnlyUnavailableCausalMatrixView/);
  assert.match(ui, /Matriz Base 40/);
  assert.match(ui, /Matriz Causal 20/);
  assert.match(ui, /runtime-matrix-tab-base/);
  assert.match(ui, /runtime-matrix-tab-causal/);
  assert.match(ui, /causal-closure-matrix/);
  assert.match(ui, /presentFactualActivationLabel/);
  assert.match(ui, /presentCausalClosureLabel/);
  assert.match(ui, /presentReadinessImpactLabel/);
  assert.doesNotMatch(ui, /runtime-gate-footer/);
  assert.doesNotMatch(ui, /RuntimeGateFooter/);

  const runtime = readFileSync(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx",
    ),
    "utf8",
  );
  assert.match(runtime, /runtime-structural-blocks/);
  assert.match(runtime, /RuntimeActivityMatrixPanel/);
  assert.match(runtime, /fixtureCausal/);
  assert.doesNotMatch(runtime, /base-matrix-no-run-banner/);
  assert.doesNotMatch(runtime, /showMatrices \?/);
  assert.doesNotMatch(runtime, /0\/40|0\/20/);
});

test("mapping real → source_question_code; sin mapping → null", () => {
  const code = resolveSelectedQuestionNode({
    baseId: "B0-Q01",
    mappings: [
      {
        runtimeInteractionId: "B0-Q01",
        sourceNodeRef: "SRC-0.1a",
        mappingRole: "primary",
        catalogVersionId: "cat-1",
      },
    ],
    sourceNodes: [
      {
        sourceNodeRef: "SRC-0.1a",
        sourceQuestionCode: "0.1a",
        catalogVersionId: "cat-1",
      },
    ],
  });
  assert.equal(code, "0.1a");

  const absent = resolveSelectedQuestionNode({
    baseId: "B0-Q02",
    mappings: [],
    sourceNodes: [],
  });
  assert.equal(absent, null);

  const noSubstitute = resolveSelectedQuestionNode({
    baseId: "B0-Q01",
    mappings: [
      {
        runtimeInteractionId: "B0-Q01",
        sourceNodeRef: "SRC-bad",
        mappingRole: "primary",
        catalogVersionId: "cat-1",
      },
    ],
    sourceNodes: [
      {
        sourceNodeRef: "SRC-bad",
        sourceQuestionCode: "B0-Q01",
        catalogVersionId: "cat-1",
      },
    ],
  });
  assert.equal(noSubstitute, null);
});

test("sin run: catálogo 40 con dataStatus unavailable (No disponible, no No evaluada)", () => {
  const view = buildCatalogOnlyUnavailableBaseMatrixView({ preRunChain: true });
  assert.equal(view.rows.length, 40);
  assert.equal(view.dataStatus, "unavailable");
  assert.equal(
    view.rows.every((r) => r.dataStatus === "unavailable"),
    true,
  );
  assert.equal(
    view.rows.every((r) => r.factualBlockingState === "unavailable"),
    true,
  );
  assert.equal(
    presentFactualResolutionLabel(null, "unavailable"),
    "No disponible",
  );
  assert.doesNotMatch(
    presentFactualResolutionLabel(null, "unavailable"),
    /No evaluada/,
  );
  assert.match(view.message ?? "", /ejecución Runtime/);
});

test("sin overlay con fuentes disponibles: not_evaluated; sin inventar Sin bloqueo factual", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [],
  });
  assert.equal(rows.length, 40);
  assert.equal(
    rows.every((r) => r.factualResolutionState == null),
    true,
  );
  assert.equal(
    rows.every((r) => r.factualBlockingState === "not_evaluated"),
    true,
  );
  assert.equal(
    rows.every((r) => r.selectionReasonSource === "unavailable"),
    true,
  );
  assert.equal(
    rows.every((r) => r.reviewActionLabel == null),
    true,
  );
  assert.equal(resolveBaseMatrixDataStatus(rows, true), "not_evaluated");
  assert.equal(
    presentFactualBlockingLabel("not_evaluated"),
    "No evaluada",
  );
  assert.doesNotMatch(
    presentFactualBlockingLabel("not_evaluated"),
    /Sin bloqueo/,
  );
});

test("branching_decision.reason es única razón; trigger_signal sin reason → No disponible", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [
      {
        id: "bd-1",
        runId: "run-1",
        caseId: "case-1",
        activityId: "act-1",
        openedInteractionId: "B0-Q01",
        closedInteractionId: null,
        triggerSignal: "signal-support-only",
        reason: "Apertura obligatoria al iniciar el run",
        decisionType: "open",
      },
      {
        id: "bd-2",
        runId: "run-1",
        caseId: "case-1",
        activityId: "act-1",
        openedInteractionId: "B0-Q02",
        closedInteractionId: null,
        triggerSignal: "solo-soporte",
        reason: "   ",
        decisionType: "open",
      },
    ],
    instances: [],
  });
  const withReason = rows.find((r) => r.id === "B0-Q01");
  assert.equal(withReason?.selectionReasonSource, "branching-decision");
  assert.match(withReason?.selectionReasonLabel ?? "", /Apertura obligatoria/);
  const noReason = rows.find((r) => r.id === "B0-Q02");
  assert.equal(noReason?.selectionReasonSource, "unavailable");
  assert.equal(noReason?.selectionReasonLabel, null);
});

test("answered sin evidencia suficiente no produce Cerrada", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [
      {
        id: "inst-1",
        runId: "run-1",
        runtimeInteractionId: "B0-Q01",
        activityId: "act-1",
        state: "answered",
        skippedReason: null,
      },
    ],
    subfields: [],
  });
  const row = rows.find((r) => r.id === "B0-Q01");
  assert.equal(row?.factualResolutionState, null);
  assert.equal(row?.dataStatus, "not_evaluated");
  assert.equal(
    presentFactualResolutionLabel(row?.factualResolutionState ?? null, "not_evaluated"),
    "No evaluada",
  );
  assert.doesNotMatch(
    presentFactualResolutionLabel(row?.factualResolutionState ?? null, "not_evaluated"),
    /Cerrada/,
  );
});

test("ausencia de blocker no produce Sin bloqueo", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [
      {
        id: "inst-1",
        runId: "run-1",
        runtimeInteractionId: "B0-Q01",
        activityId: "act-1",
        state: "answered",
        skippedReason: null,
      },
    ],
  });
  const row = rows.find((r) => r.id === "B0-Q01");
  assert.equal(row?.factualBlockingState, "not_evaluated");
  assert.equal(presentFactualBlockingLabel(row.factualBlockingState), "No evaluada");
});

test("estado Base autorizado con evidencia episteme", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [
      {
        id: "inst-1",
        runId: "run-1",
        runtimeInteractionId: "B0-Q01",
        activityId: "act-1",
        state: "answered",
        skippedReason: null,
      },
    ],
    mappings: [
      {
        runtimeInteractionId: "B0-Q01",
        sourceNodeRef: "SRC-0.1a",
        mappingRole: "primary",
        catalogVersionId: "cat-1",
      },
    ],
    sourceNodes: [
      {
        sourceNodeRef: "SRC-0.1a",
        sourceQuestionCode: "0.1a",
        catalogVersionId: "cat-1",
      },
    ],
    subfields: [
      {
        id: "sf-1",
        runId: "run-1",
        interactionInstanceId: "inst-1",
        epistemicStatus: "captured_user_evidence",
      },
    ],
  });
  const row = rows.find((r) => r.id === "B0-Q01");
  assert.equal(row?.selectedQuestionNode, "0.1a");
  assert.equal(row?.factualResolutionState, "captured_user_evidence");
  assert.equal(row?.factualBlockingState, "none");
  assert.equal(row?.dataStatus, "available");
  assert.equal(resolveBaseMatrixDataStatus(rows, true), "partial");
});

test("skipped_silently se presenta como violación", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [],
    explicitResolutionByBaseId: { "B0-Q03": "skipped_silently" },
  });
  const row = rows.find((r) => r.id === "B0-Q03");
  assert.equal(row?.factualResolutionState, "skipped_silently");
  assert.equal(row?.resolutionViolation, true);
  assert.equal(row?.factualBlockingState, "blocked");
  assert.match(
    presentFactualResolutionLabel("skipped_silently", "available"),
    /violación/,
  );
});

test("cuarenta overlays incompletos no producen available", () => {
  const explicit = Object.fromEntries(
    BASE40_BASE_IDS.map((id) => [id, "captured_user_evidence"]),
  );
  // Sin evidencePresent (sin instance/subfield) explícito solo cuenta si explicit
  // explicitResolution marca evidencePresent true → would be available.
  // Probar 40 instances answered SIN subfields: not_evaluated matrix.
  const instances = BASE40_BASE_IDS.map((id, i) => ({
    id: `inst-${i}`,
    runId: "run-1",
    runtimeInteractionId: id,
    activityId: "act-1",
    state: "answered",
    skippedReason: null,
  }));
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances,
    subfields: [],
  });
  assert.equal(rows.every((r) => r.factualResolutionState == null), true);
  assert.equal(resolveBaseMatrixDataStatus(rows, true), "not_evaluated");

  // Una sola fila evaluada → partial, nunca available por conteo de overlays
  const partial = buildBaseMatrixRows({
    decisions: [],
    instances: [instances[0]],
    subfields: [
      {
        id: "sf",
        runId: "run-1",
        interactionInstanceId: "inst-0",
        epistemicStatus: "captured_user_evidence",
      },
    ],
  });
  assert.equal(resolveBaseMatrixDataStatus(partial.rows, true), "partial");
  void explicit;
});

test("sources unavailable → dataStatus unavailable", () => {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [],
    sourcesAvailable: false,
  });
  assert.equal(resolveBaseMatrixDataStatus(rows, false), "unavailable");
  assert.equal(
    rows.every((r) => r.factualBlockingState === "unavailable"),
    true,
  );
});

test("scope incorrecto de run/actividad es rechazado", async () => {
  const repo = emptyRepo({
    async findRunById() {
      return {
        id: "run-1",
        caseId: "case-1",
        activityId: "other-act",
        roleRuntimeSessionId: "rrs-1",
        state: "initialized",
        catalogVersionId: null,
      };
    },
  });
  await assert.rejects(
    () =>
      buildRuntimeBaseMatrixView(repo, {
        caseId: "case-1",
        runId: "run-1",
        activityId: "act-1",
      }),
    /runtime_matrix_run_scope_mismatch/,
  );
});

test("cero evaluaciones → not_evaluated en vista", async () => {
  const view = await buildRuntimeBaseMatrixView(emptyRepo(), {
    caseId: "case-1",
    runId: "run-1",
    activityId: "act-1",
  });
  assert.equal(view.dataStatus, "not_evaluated");
  assert.equal(view.rows.length, 40);
});

test("BFF base-matrix y causal-matrix existen; panel expone fixtureCausal", () => {
  const base = resolve(
    projectRoot,
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activities/[activityId]/runs/[runId]/runtime/base-matrix/route.ts",
  );
  const causal = resolve(
    projectRoot,
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activities/[activityId]/runs/[runId]/runtime/causal-matrix/route.ts",
  );
  assert.ok(existsSync(base));
  assert.ok(existsSync(causal));
  assert.match(readFileSync(base, "utf8"), /buildRuntimeBaseMatrixView/);
  assert.match(readFileSync(causal, "utf8"), /buildRuntimeCausalMatrixView/);
  const panel = readFileSync(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx",
    ),
    "utf8",
  );
  assert.match(panel, /fixtureCausal/);
});

test("Causal: 20 IDs C01–C20, prioridad y llave priorityClassKey", () => {
  assert.equal(RUNTIME_CAUSAL_MATRIX_CATALOG.length, 20);
  assert.deepEqual(
    RUNTIME_CAUSAL_MATRIX_CATALOG.map((r) => r.id),
    [...CAUSAL20_IDS],
  );
  assert.equal(RUNTIME_CAUSAL_MATRIX_CATALOG[4].priorityClassKey, "P0-C05");
  assert.equal(RUNTIME_CAUSAL_MATRIX_CATALOG[0].priorityClassKey, "P3-C01");
  assert.equal(RUNTIME_CAUSAL_MATRIX_CATALOG[19].priorityClassKey, "P0-C20");
  const p0 = RUNTIME_CAUSAL_MATRIX_CATALOG.filter((r) => r.priority === "P0").map(
    (r) => r.id,
  );
  assert.deepEqual(p0, ["C05", "C09", "C11", "C20"]);
});

test("Causal: ausencia de instancia no produce No activada", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [{ id: "i1", runId: "r", runtimeInteractionId: "C05", activityId: "a", state: "answered", skippedReason: null }],
    subfields: [],
  });
  const row = rows.find((r) => r.id === "C05");
  assert.equal(row?.factualActivationState, "not_evaluated");
  assert.equal(presentFactualActivationLabel("not_evaluated"), "No evaluada");
  assert.doesNotMatch(presentFactualActivationLabel("not_evaluated"), /No activada/);
});

test("Causal: not_triggered_with_evidence sí produce no activación factual", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [],
    explicitClosureByCausalId: { C02: "not_triggered_with_evidence" },
  });
  const row = rows.find((r) => r.id === "C02");
  assert.equal(row?.factualClosureState, "not_triggered_with_evidence");
  assert.equal(row?.factualActivationState, "not-triggered-with-evidence");
  assert.equal(
    presentFactualActivationLabel(row.factualActivationState),
    "No activada con evidencia",
  );
});

test("Causal: branching reason única; señal sin reason → unavailable", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [
      {
        id: "bd1",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C05",
        closedInteractionId: null,
        triggerSignal: "signal",
        reason: "Apertura causal factual",
        decisionType: "open",
      },
      {
        id: "bd2",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C09",
        closedInteractionId: null,
        triggerSignal: "solo-señal",
        reason: "  ",
        decisionType: "open",
      },
    ],
    instances: [],
  });
  assert.equal(rows.find((r) => r.id === "C05")?.selectionReasonSource, "branching-decision");
  assert.equal(rows.find((r) => r.id === "C09")?.selectionReasonSource, "unavailable");
  assert.equal(rows.find((r) => r.id === "C09")?.selectionReasonLabel, null);
});

test("Causal: P0 abierta factual puede bloquear readiness; sin evidencia No evaluable", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [],
    explicitClosureByCausalId: { C09: "triggered_unanswered" },
  });
  const row = rows.find((r) => r.id === "C09");
  assert.equal(row?.blocksFullReadinessRule, true);
  assert.equal(row?.blocksFullReadinessFactually, true);
  assert.equal(
    presentReadinessImpactLabel({
      rule: true,
      factually: true,
      noRun: false,
    }),
    "Bloquea",
  );
  assert.equal(
    presentReadinessImpactLabel({
      rule: true,
      factually: null,
      noRun: false,
    }),
    "No evaluable",
  );
});

test("Causal: sin run → unavailable; run sin evaluaciones → not_evaluated", () => {
  const noRun = buildCatalogOnlyUnavailableCausalMatrixView({ preRunChain: true });
  assert.equal(noRun.rows.length, 20);
  assert.equal(noRun.dataStatus, "unavailable");
  assert.equal(
    noRun.rows.every((r) => r.factualActivationState === "unavailable"),
    true,
  );

  const { rows } = buildCausalMatrixRows({ decisions: [], instances: [] });
  assert.equal(resolveCausalMatrixDataStatus(rows, true), "not_evaluated");
});

test("Causal: captured_user_evidence aislado no cierra la causal", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [
      {
        id: "i1",
        runId: "r",
        runtimeInteractionId: "C05",
        activityId: "a",
        state: "answered",
        skippedReason: null,
      },
    ],
    subfields: [
      {
        id: "s1",
        runId: "r",
        interactionInstanceId: "i1",
        epistemicStatus: "captured_user_evidence",
      },
    ],
  });
  const row = rows.find((r) => r.id === "C05");
  assert.equal(row?.factualClosureState, null);
  assert.equal(row?.dataStatus, "partial");
  assert.equal(presentCausalClosureLabel(null, "partial"), "No evaluada");
});

test("Causal: canonical_derivation e internal_calculated no cierran", () => {
  for (const epistemic of ["canonical_derivation", "internal_calculated"]) {
    const { rows } = buildCausalMatrixRows({
      decisions: [],
      instances: [
        {
          id: "i1",
          runId: "r",
          runtimeInteractionId: "C05",
          activityId: "a",
          state: "answered",
          skippedReason: null,
        },
      ],
      subfields: [
        {
          id: "s1",
          runId: "r",
          interactionInstanceId: "i1",
          epistemicStatus: epistemic,
        },
      ],
    });
    const row = rows.find((r) => r.id === "C05");
    assert.equal(row?.factualClosureState, null, epistemic);
    assert.notEqual(row?.factualClosureState, "answered_closed");
    assert.notEqual(row?.factualClosureState, "closed_not_applicable");
  }
});

test("Causal: cierre por variables obligatorias completas", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [],
    closureValidationByCausalId: {
      C05: validateCausalClosureVariables({
        requiredVariableCodes: ["transformation_exception_type", "description"],
        resolvedVariableCodes: ["transformation_exception_type", "description"],
        canonicalRouteClosed: true,
      }),
    },
  });
  const row = rows.find((r) => r.id === "C05");
  assert.equal(row?.factualClosureState, "answered_closed");
  assert.equal(row?.closureValidation.complete, true);
  assert.equal(row?.closureValidation.requiredCount, 2);
  assert.equal(row?.closureValidation.resolvedCount, 2);
});

test("Causal: variable obligatoria faltante → partial", () => {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [],
    closureValidationByCausalId: {
      C05: validateCausalClosureVariables({
        requiredVariableCodes: ["a", "b"],
        resolvedVariableCodes: ["a"],
        canonicalRouteClosed: true,
      }),
    },
  });
  const row = rows.find((r) => r.id === "C05");
  assert.equal(row?.factualClosureState, null);
  assert.equal(row?.dataStatus, "partial");
  assert.equal(row?.closureValidation.complete, false);
});

test("Causal: varias branching sin regla → conflict; revocada/otro run ignoradas", () => {
  const conflict = buildCausalMatrixRows({
    decisions: [
      {
        id: "d1",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C09",
        closedInteractionId: null,
        triggerSignal: "x",
        reason: "A",
        decisionType: "open",
      },
      {
        id: "d2",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C09",
        closedInteractionId: null,
        triggerSignal: "y",
        reason: "B",
        decisionType: "open",
      },
    ],
    instances: [],
    runId: "r",
    activityId: "a",
  });
  const c09 = conflict.rows.find((r) => r.id === "C09");
  assert.equal(c09?.selectionReasonStatus, "conflict");
  assert.equal(c09?.selectionReasonLabel, null);
  assert.equal(c09?.branchingDecisionId, null);

  const filtered = buildCausalMatrixRows({
    decisions: [
      {
        id: "revoked",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C05",
        closedInteractionId: null,
        triggerSignal: "x",
        reason: "Revocada",
        decisionType: "open",
        revokedAt: "2026-01-01",
      },
      {
        id: "other-run",
        runId: "other",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C05",
        closedInteractionId: null,
        triggerSignal: "x",
        reason: "Otro run",
        decisionType: "open",
      },
      {
        id: "ok",
        runId: "r",
        caseId: "c",
        activityId: "a",
        openedInteractionId: "C05",
        closedInteractionId: null,
        triggerSignal: "x",
        reason: "Única vigente",
        decisionType: "open",
        effective: true,
      },
    ],
    instances: [],
    runId: "r",
    activityId: "a",
  });
  const c05 = filtered.rows.find((r) => r.id === "C05");
  assert.equal(c05?.selectionReasonLabel, "Única vigente");
  assert.equal(c05?.branchingDecisionId, "ok");
});

test("Causal: códigos técnicos se traducen; desconocido → No disponible", () => {
  assert.equal(
    presentCausalTechnicalCode("receiver_feedback_route_missing"),
    "Falta cerrar la ruta de retroalimentación del receptor",
  );
  assert.equal(presentCausalTechnicalCode("codigo_inventado_xyz"), "No disponible");
  const { rows } = buildCausalMatrixRows({ decisions: [], instances: [] });
  const c09 = rows.find((r) => r.id === "C09");
  assert.match(c09?.blockingRule ?? "", /retroalimentación|ruta de evidencia/i);
  assert.doesNotMatch(c09?.blockingRule ?? "", /^receiver_feedback_route_missing$/);
  assert.equal(
    presentCausalBlockingRuleLabel("codigo_sin_mapa_autorizado"),
    "No disponible",
  );
});

test("Matriz Base: frases de catálogo sin snake_case técnico dominante", async () => {
  const {
    presentBaseCatalogPhrase,
    containsDominantTechnicalIdentifier,
  } = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/services/eve/official-control-panel/base-matrix-presentation.ts",
      ),
    ).href,
  );
  const { rows } = buildBaseMatrixRows({ decisions: [], instances: [] });
  const b0 = rows.find((r) => r.id === "B0-Q01");
  assert.ok(b0);
  assert.doesNotMatch(b0.mandatoryClosureRule, /activity_name_user_confirmed/);
  assert.match(b0.mandatoryClosureRule, /Nombre de la actividad confirmado/);
  assert.doesNotMatch(b0.blockingRule, /blocked_by_missing_evidence/);
  assert.equal(
    containsDominantTechnicalIdentifier(b0.mandatoryClosureRule),
    false,
  );
  assert.equal(
    presentBaseCatalogPhrase("activity_name_user_confirmed"),
    "Nombre de la actividad confirmado",
  );
});

test("Causal BFF path: sin fuentes persistidas → closureSource none; no inventa cierre", async () => {
  const view = await buildRuntimeCausalMatrixView(emptyRepo(), {
    caseId: "case-1",
    runId: "run-1",
    activityId: "act-1",
  });
  assert.equal(view.rows.length, 20);
  assert.equal(
    view.rows.every((r) => r.closureSource === "none"),
    true,
  );
  assert.equal(
    view.rows.every((r) => r.factualClosureState == null),
    true,
  );
  assert.match(
    view.message ?? "",
    /Sin evaluaciones causales effective|evaluación factual|not_evaluated|No evaluad/i,
  );
});
