import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-primary-activity-selection-policy-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(mappedPath).href,
    };
  }
  return nextResolve(specifier, context);
}
`,
);

register(pathToFileURL(hookPath).href, import.meta.url);

const selectorModule = await import("@/services/primary-activity-selector");
const auditModule = await import("@/services/primary-activity-selection-audit");

type WorkMapData = import("@/domain/local-work-map").WorkMapData;

const { selectPrimaryActivitiesFromWorkMap } = selectorModule;
const {
  buildPrimaryActivitySelectionAuditEnvelope,
  buildPrimaryActivitySelectionPolicyManifest,
  loadMachineReadablePolicyArtifact,
  hashStableJson,
  replayPrimaryActivitySelection,
} = auditModule;

function buildWorkMap(activityTexts: string[], options: Partial<WorkMapData> = {}): WorkMapData {
  return {
    selectedAreas: ["Operaciones"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: "Coordino pedidos, entregas y validaciones con otras areas.",
        activities: activityTexts.map((text, index) => ({
          id: `act-${index + 1}`,
          text,
        })),
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
    ...options,
  };
}

function buildMultiResponsibilityWorkMap(): WorkMapData {
  return {
    selectedAreas: ["Operaciones"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: "Proceso pedidos operativos del dia.",
        activities: Array.from({ length: 8 }, (_, index) => ({
          id: `act-a-${index + 1}`,
          text: `Registro pedido operativo ${index + 1} y actualizo el sistema interno.`,
        })),
      },
      {
        id: "resp-2",
        text: "Coordino entregas y bloqueo errores entre areas.",
        activities: [
          {
            id: "act-b-1",
            text: "Coordino entrega con otra area cuando hay bloqueo de inventario.",
          },
          {
            id: "act-b-2",
            text: "Verifico devoluciones y corrijo errores reportados por clientes.",
          },
        ],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
  };
}

function buildDirectorCostosWorkMap(): {
  workMap: WorkMapData;
  expectedSelectedActivityIds: string[];
} {
  const fixture = JSON.parse(
    readFileSync("tests/fixtures/director-costos-calibration.v1.3.json", "utf8"),
  ) as {
    expectedSelectedActivityIds: string[];
    activities: Array<{ activityId: string; activityTitle: string }>;
  };

  return {
    expectedSelectedActivityIds: fixture.expectedSelectedActivityIds,
    workMap: {
      selectedAreas: ["Costos"],
      customAreas: [],
      responsibilities: [
        {
          id: "R1",
          text: "Normatividad, alta de proyectos y administracion base en sistemas.",
          activities: fixture.activities.slice(0, 4).map((activity) => ({
            id: activity.activityId,
            text: activity.activityTitle,
          })),
        },
        {
          id: "R2",
          text: "Presupuestacion, licitaciones, cotizaciones y matrices de costos.",
          activities: fixture.activities.slice(4, 11).map((activity) => ({
            id: activity.activityId,
            text: activity.activityTitle,
          })),
        },
        {
          id: "R3",
          text: "Control presupuestal, pagos, cierres, firmas y seguimiento financiero.",
          activities: fixture.activities.slice(11).map((activity) => ({
            id: activity.activityId,
            text: activity.activityTitle,
          })),
        },
      ],
      guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
      saveAttempts: 0,
      fieldValidationState: {},
      isSaved: true,
      isReviewMode: true,
      savedWithWarnings: false,
    },
  };
}

test("0 elegibles -> reentry_required", () => {
  const result = selectPrimaryActivitiesFromWorkMap(buildWorkMap(["", "  "]));

  assert.equal(result.mode, "reentry_required");
  assert.equal(result.selectedPrimaryActivities.length, 0);
  assert.ok(result.excludedActivities.length >= 1);
});

test("1 elegible -> non_competitive_inclusion", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap(["Registro facturas de proveedores en el sistema contable."]),
  );

  assert.equal(result.mode, "non_competitive_inclusion");
  assert.equal(result.version, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(result.selectedPrimaryActivities.length, 1);
  assert.equal(result.selectedPrimaryActivities[0]?.activityId, "act-1");
  assert.equal(
    result.selectedPrimaryActivities[0]?.selectionReasonCode,
    "included_all_eligible_under_8",
  );
});

test("8 elegibles -> non_competitive_inclusion with 8 and no artificial fill", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap(
      Array.from(
        { length: 8 },
        (_, index) => `Valido pedido ${index + 1} antes de enviarlo al cliente.`,
      ),
    ),
  );

  assert.equal(result.mode, "non_competitive_inclusion");
  assert.equal(result.selectedPrimaryActivities.length, 8);
});

test("does not fill empty slots when fewer than 8 activities are eligible", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap([
      "Preparo reporte semanal para entregarlo al area comercial.",
      "Reviso errores del pedido antes de enviarlo.",
      "",
    ]),
  );

  assert.equal(result.mode, "non_competitive_inclusion");
  assert.equal(result.selectedPrimaryActivities.length, 2);
  assert.ok(result.excludedActivities.some((activity) => activity.activityId === "act-3"));
});

test("9+ elegibles -> competitive_selection with maximum 8", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap(
      Array.from(
        { length: 10 },
        (_, index) => `Proceso solicitud ${index + 1} y entrego resultado validado.`,
      ),
    ),
  );

  assert.equal(result.mode, "competitive_selection");
  assert.equal(result.version, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(result.selectedPrimaryActivities.length, 8);
  assert.ok(result.nonPrimaryContextActivities.length >= 2);
  assert.ok(
    result.selectedPrimaryActivities.every(
      (activity) =>
        activity.selectionReasonCode &&
        activity.selectionReasonText &&
        activity.selectedSlot >= 1 &&
        activity.finalSelectionScore >= 0 &&
        activity.scoreBreakdown &&
        activity.penalties &&
        typeof activity.responsibilityBalanceAffectedResult === "boolean",
    ),
  );
});

test("governance flags are owned by EVE policy", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap(["Coordino entrega de pedidos con proveedores externos."]),
  );

  assert.equal(result.userSelectedActivities, false);
  assert.equal(result.primaryActivitySelectionResolvedByUser, false);
  assert.equal(result.selectionGovernance, "eve_policy");
  assert.equal(result.workMapContextPreserved, true);
  assert.equal(result.maxPrimaryActivities, 8);
  assert.equal(result.runtimeBudget.baseInteractionsPerPrimaryActivity, 40);
  assert.equal(result.runtimeBudget.maxCausalInteractionsPerPrimaryActivity, 20);
});

test("nonPrimaryContextActivities preserves unselected and excluded activities", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap([
      ...Array.from(
        { length: 9 },
        (_, index) => `Registro movimiento operativo ${index + 1} y actualizo control.`,
      ),
      "Registro movimiento operativo 1 y actualizo control.",
      "",
    ]),
  );

  assert.equal(result.selectedPrimaryActivities.length, 8);
  assert.ok(result.nonPrimaryContextActivities.length >= 3);
  assert.ok(result.excludedActivities.length >= 2);
  assert.ok(
    result.nonPrimaryContextActivities.every(
      (activity) =>
        activity.activityId &&
        activity.responsibilityId &&
        activity.activityTitle &&
        activity.responsibilityTitle &&
        activity.nonPrimaryContextStatus &&
        activity.contextReason &&
        activity.promotionCondition,
    ),
  );
});

test("duplicates or aliases do not duplicate primary selection", () => {
  const result = selectPrimaryActivitiesFromWorkMap(
    buildWorkMap([
      "Reviso pedidos antes de enviarlos a reparto.",
      "Reviso pedidos antes de enviarlos a reparto.",
    ]),
  );

  assert.equal(result.selectedPrimaryActivities.length, 1);
  assert.equal(result.excludedActivities[0]?.exclusionReason, "duplicate_or_alias");
});

test("competitive balance does not simply take the first 8 across responsibilities", () => {
  const result = selectPrimaryActivitiesFromWorkMap(buildMultiResponsibilityWorkMap());
  const selectedIds = result.selectedPrimaryActivities.map((activity) => activity.activityId);

  assert.equal(result.mode, "competitive_selection");
  assert.equal(result.selectedPrimaryActivities.length, 8);
  assert.ok(selectedIds.includes("act-b-1") || selectedIds.includes("act-b-2"));
  assert.notDeepEqual(
    selectedIds,
    Array.from({ length: 8 }, (_, index) => `act-a-${index + 1}`),
  );
});

test("competitive selection uses specific v1.3 reason codes and no generic R2.3 reason", () => {
  const result = selectPrimaryActivitiesFromWorkMap(buildMultiResponsibilityWorkMap());

  assert.equal(result.mode, "competitive_selection");
  for (const activity of result.selectedPrimaryActivities) {
    assert.notEqual(
      activity.selectionReason,
      "Selected by R2.3 structural score with responsibility balance.",
    );
    assert.match(activity.selectionReasonCode, /^selected_for_|^included_all_/);
    assert.ok(activity.selectionReasonText.length > 0);
    assert.ok(activity.selectedSlot >= 1 && activity.selectedSlot <= 8);
    assert.ok(activity.score.finalSelectionScore >= 0);
    assert.ok(activity.score.responsibilityBalanceAdjustment <= 0.05);
  }
});

test("Director de Costos fixture calibrates expected v1.3 primary activities", () => {
  const { workMap, expectedSelectedActivityIds } = buildDirectorCostosWorkMap();
  const result = selectPrimaryActivitiesFromWorkMap(workMap);
  const selectedIds = result.selectedPrimaryActivities.map(
    (activity) => activity.activityId,
  );

  assert.equal(result.mode, "competitive_selection");
  assert.equal(result.runLog.selectorVersion, "v1.3");
  assert.equal(result.selectedPrimaryActivities.length, 8);
  assert.deepEqual([...selectedIds].sort(), [...expectedSelectedActivityIds].sort());
  assert.equal(result.nonPrimaryContextActivities.length, 9);
  assert.ok(
    result.nonPrimaryContextActivities.some(
      (activity) => activity.activityId === "R3-A5",
    ),
  );
});

test("selector source avoids user preference and forbidden output concepts", () => {
  const source = readFileSync("src/services/primary-activity-selector.ts", "utf8")
    .replace(/\bexport\s+/g, "");

  for (const forbidden of [
    /prioridad/i,
    /claridad/i,
    /energ/i,
    /que parte quieres revisar primero/i,
    /diagnostico/i,
    /diagnóstico/i,
    /transduccion/i,
    /transducción/i,
    /\bexport\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

function readPolicyArtifactJson(): string {
  return readFileSync("src/rules/primary-activity-selection-policy.v1.3.json", "utf8");
}
test("C3.12 policy manifest persists real JSON artifact and executable projection hashes", () => {
  const artifactContent = readPolicyArtifactJson();
  const artifact = loadMachineReadablePolicyArtifact(artifactContent);
  const manifest = buildPrimaryActivitySelectionPolicyManifest({
    machineReadableArtifactContent: artifactContent,
  });

  assert.equal(manifest.runtimeReadsXlsx, false);
  assert.equal(manifest.machineReadableArtifactPath, "src/rules/primary-activity-selection-policy.v1.3.json");
  assert.equal(
    manifest.sourceNormativeDocument,
    "PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx",
  );
  assert.ok(manifest.baselineSheets.includes("Selector_Template_v1_3"));
  assert.ok(manifest.baselineSheets.includes("Platform_Impl_v1_3"));
  assert.equal(manifest.baselineSheetVersions.Selector_Template_v1_3, "v1_3");
  assert.equal(manifest.policyVersion, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(manifest.selectorCodeVersion, "PRIMARY_ACTIVITY_SELECTOR_TS_C3_12");
  assert.equal(manifest.canonicalRuleContent.policyVersion, manifest.policyVersion);
  assert.equal(manifest.canonicalRuleContentHash, hashStableJson(artifact));
  assert.equal(manifest.machineReadableArtifactChecksum, hashStableJson(artifact));
  assert.equal(manifest.executablePolicyProjectionHash, manifest.canonicalRuleContentHash);
});
test("C3.12.3 normalized artifact hash is deterministic and changes when JSON changes", () => {
  const artifactContent = readPolicyArtifactJson();
  const artifact = loadMachineReadablePolicyArtifact(artifactContent);
  const reordered = JSON.stringify({
    ...artifact,
    constants: {
      ...artifact.constants,
    },
  });
  const changed = JSON.stringify({
    ...artifact,
    status: "tampered",
  });

  assert.equal(
    hashStableJson(loadMachineReadablePolicyArtifact(artifactContent)),
    hashStableJson(loadMachineReadablePolicyArtifact(reordered)),
  );
  assert.notEqual(
    hashStableJson(loadMachineReadablePolicyArtifact(artifactContent)),
    hashStableJson(loadMachineReadablePolicyArtifact(changed)),
  );
});

test("C3.12.3 blocks activation when JSON artifact and TS projection diverge", () => {
  const artifactContent = readPolicyArtifactJson();
  const artifact = loadMachineReadablePolicyArtifact(artifactContent);

  assert.throws(
    () =>
      buildPrimaryActivitySelectionPolicyManifest({
        machineReadableArtifactContent: JSON.stringify({
          ...artifact,
          policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3_TAMPERED",
        }),
      }),
    /primary_activity_policy_artifact_mismatch/,
  );
});

test("C3.12 stable hash is deterministic regardless of object key order", () => {
  assert.equal(hashStableJson({ b: 2, a: 1 }), hashStableJson({ a: 1, b: 2 }));
  assert.notEqual(hashStableJson({ a: 1 }), hashStableJson({ a: 2 }));
});

test("C3.12 audit envelope stores complete per-activity selector trace", () => {
  const workMap = buildWorkMap(
    Array.from(
      { length: 10 },
      (_, index) => `Proceso pedido ${index + 1} y entrego resultado validado al cliente.`,
    ),
  );
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "case_participant_workmap_snapshots:test",
    executionTimestamp: "2026-07-30T00:00:00.000Z",
  });

  assert.equal(envelope.traceCompletenessStatus, "complete");
  assert.equal(envelope.traceItems.length, 10);
  assert.equal(envelope.traceItems.filter((item) => item.classification === "primary").length, 8);
  assert.equal(envelope.traceItems.filter((item) => item.classification === "non_primary").length, 2);
  assert.ok(envelope.policyManifestHash.length >= 32);
  assert.ok(envelope.resultHash.length >= 32);
  assert.ok(
    envelope.traceItems.every(
      (item) =>
        item.activityId &&
        item.activityTitle &&
        item.responsibilityId &&
        item.selectionStatus &&
        item.ruleRefs.length > 0 &&
        item.decisionTrace,
    ),
  );
  assert.ok(
    envelope.traceItems
      .filter((item) => item.classification === "non_primary")
      .every((item) => item.runtimeHandoffPriority === null),
  );
});

test("R2.2 selector trace keeps WorkMap title separate from absent description", () => {
  const workMap = buildWorkMap(["Registro pedidos de clientes y actualizo el seguimiento comercial."]);
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "case_participant_workmap_snapshots:test",
    executionTimestamp: "2026-08-01T19:00:00.000Z",
  });

  assert.equal(envelope.traceItems.length, 1);
  assert.equal(envelope.traceItems[0]?.activityTitle, workMap.responsibilities[0].activities[0].text);
  assert.equal(envelope.traceItems[0]?.activityDescription, null);
  assert.equal(envelope.traceItems[0]?.activityDescriptionSource, "absent");
});

test("R2.2 selector trace blocks fallback duplicated activity descriptions", () => {
  const workMap = buildWorkMap(["Registro pedidos de clientes y actualizo el seguimiento comercial."]);
  workMap.responsibilities[0].activities[0].description =
    workMap.responsibilities[0].activities[0].text;
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);

  assert.throws(
    () =>
      buildPrimaryActivitySelectionAuditEnvelope({
        selectionResult,
        sourceReference: "case_participant_workmap_snapshots:test",
        executionTimestamp: "2026-08-01T19:00:00.000Z",
      }),
    /duplicated_activity_description_input/,
  );
});

test("R2.2 selector trace accepts distinct explicit WorkMap descriptions and replays them", () => {
  const workMap = buildWorkMap(["Registro pedidos de clientes y actualizo el seguimiento comercial."]);
  workMap.responsibilities[0].activities[0].description =
    "Captura adicional escrita en WorkMap, distinta del titulo.";
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);

  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "case_participant_workmap_snapshots:test",
    executionTimestamp: "2026-08-01T19:00:00.000Z",
  });

  assert.equal(
    envelope.traceItems[0]?.activityDescription,
    workMap.responsibilities[0].activities[0].description,
  );
  assert.equal(envelope.traceItems[0]?.activityDescriptionSource, "workmap_explicit");

  const replay = replayPrimaryActivitySelection({
    workMapSnapshot: workMap,
    expectedPolicyManifestHash: envelope.policyManifestHash,
    expectedSelectorCodeVersion: envelope.selectorCodeVersion,
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: envelope.traceItems,
  });
  assert.equal(replay.status, "match");
});

test("C3.12 replay matches exact trace and detects policy, snapshot or trace mismatch", () => {
  const workMap = buildMultiResponsibilityWorkMap();
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "case_participant_workmap_snapshots:test",
    executionTimestamp: "2026-07-30T00:00:00.000Z",
  });

  const match = replayPrimaryActivitySelection({
    workMapSnapshot: workMap,
    expectedPolicyManifestHash: envelope.policyManifestHash,
    expectedSelectorCodeVersion: envelope.selectorCodeVersion,
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: envelope.traceItems,
  });
  assert.equal(match.status, "match");
  assert.equal(match.recomputedResultHash, envelope.resultHash);

  const policyMismatch = replayPrimaryActivitySelection({
    workMapSnapshot: workMap,
    expectedPolicyManifestHash: "wrong-policy",
    expectedSelectorCodeVersion: envelope.selectorCodeVersion,
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: envelope.traceItems,
  });
  assert.equal(policyMismatch.status, "mismatch");
  assert.ok(policyMismatch.mismatches.includes("policy_manifest_hash_mismatch"));

  const changedWorkMap = buildMultiResponsibilityWorkMap();
  changedWorkMap.responsibilities[0].activities[0].text = "Cambio una actividad para romper replay.";
  const snapshotMismatch = replayPrimaryActivitySelection({
    workMapSnapshot: changedWorkMap,
    expectedPolicyManifestHash: envelope.policyManifestHash,
    expectedSelectorCodeVersion: envelope.selectorCodeVersion,
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: envelope.traceItems,
  });
  assert.equal(snapshotMismatch.status, "mismatch");
  assert.ok(snapshotMismatch.mismatches.includes("selection_result_hash_mismatch"));

  const tamperedTrace = envelope.traceItems.map((item, index) =>
    index === 0 ? { ...item, selectionStatus: "selected_non_primary" } : item,
  );
  const traceMismatch = replayPrimaryActivitySelection({
    workMapSnapshot: workMap,
    expectedPolicyManifestHash: envelope.policyManifestHash,
    expectedSelectorCodeVersion: envelope.selectorCodeVersion,
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: tamperedTrace,
  });
  assert.equal(traceMismatch.status, "mismatch");
  assert.ok(traceMismatch.mismatches.includes("selector_template_trace_mismatch"));
});


test("C3.12 replay does not use current selector for unavailable historical versions", () => {
  const workMap = buildMultiResponsibilityWorkMap();
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "case_participant_workmap_snapshots:test",
    executionTimestamp: "2026-07-30T00:00:00.000Z",
  });

  const result = replayPrimaryActivitySelection({
    workMapSnapshot: workMap,
    expectedPolicyManifestHash: envelope.policyManifestHash,
    expectedSelectorCodeVersion: "PRIMARY_ACTIVITY_SELECTOR_TS_C3_11",
    expectedResultHash: envelope.resultHash,
    expectedTraceItems: envelope.traceItems,
  });

  assert.equal(result.status, "unverifiable");
  assert.equal(result.recomputedResultHash, null);
  assert.ok(result.mismatches.includes("selector_code_version_unavailable"));
});test("C3.12 replay marks legacy incomplete traces as unverifiable", () => {
  const result = replayPrimaryActivitySelection({
    workMapSnapshot: buildWorkMap(["Registro pedido y entrego resultado validado."]),
    expectedPolicyManifestHash: "legacy",
    expectedSelectorCodeVersion: "legacy",
    expectedResultHash: "legacy",
    expectedTraceItems: [],
  });

  assert.equal(result.status, "unverifiable");
  assert.ok(result.mismatches.includes("legacy_selection_trace_incomplete"));
});



