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
const hookPath = join(tmpdir(), "eve-significado-activity-anchor-path-hook.mjs");

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

const domainModule = await import("../../src/domain/significado-de-trabajo.ts");
const adapterModule = await import(
  "../../src/services/significado-activity-anchor-adapter.ts"
);
const adapterSource = readFileSync(
  resolve(projectRoot, "src/services/significado-activity-anchor-adapter.ts"),
  "utf8",
);
const adapterExecutableSource = adapterSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const { SIGNIFICADO_DATA_VERSION, SIGNIFICADO_PER_ACTIVITY_THRESHOLD } =
  domainModule;
type WorkMapData = import("../../src/domain/local-work-map.ts").WorkMapData;

const {
  buildActivityAnchorBundle,
  buildActivityAnchorDraft,
  buildSignificadoSubmitPayload,
  evaluateActivityAnchorReadiness,
  extractTraceableWorkMapActivities,
  resolveSignificadoCaptureMode,
  selectTraceableActivity,
} = adapterModule;

const VALID_RESPONSIBILITY_1 =
  "Yo defino el programa semanal de produccion segun los pedidos pendientes.";
const VALID_RESPONSIBILITY_2 =
  "Yo verifico que los candidatos cumplan el perfil requerido.";
const VALID_ACTIVITY_1 =
  "Registro las facturas de proveedores en el ERP para generar el asiento contable.";
const VALID_ACTIVITY_2 =
  "Mido las dimensiones de la pieza producida con el calibrador digital.";

function buildSavedWorkMap(overrides: Partial<WorkMapData> = {}): WorkMapData {
  return {
    selectedAreas: ["Produccion"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-1", text: VALID_ACTIVITY_1 },
          { id: "act-1b", text: VALID_ACTIVITY_2 },
        ],
      },
      {
        id: "resp-2",
        text: VALID_RESPONSIBILITY_2,
        activities: [
          { id: "act-2", text: VALID_ACTIVITY_1 },
          { id: "act-2b", text: VALID_ACTIVITY_2 },
        ],
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true, roleHelp: true },
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: true,
    savedWithWarnings: false,
    ...overrides,
  };
}

function completePerActivityResponses(workMap: WorkMapData) {
  const traceable = extractTraceableWorkMapActivities(workMap);
  return Object.fromEntries(
    traceable.map((activity) => [
      activity.id,
      {
        clarity: "clear" as const,
        energy: "balanced" as const,
        userConfirmed: true,
      },
    ]),
  );
}

test("extractTraceableWorkMapActivities preserves act-* ids from WorkMapData", () => {
  const workMap = buildSavedWorkMap();
  const traceable = extractTraceableWorkMapActivities(workMap);

  assert.equal(traceable.length, 4);
  assert.deepEqual(
    traceable.map((activity) => activity.id),
    ["act-1", "act-1b", "act-2", "act-2b"],
  );

  for (const activity of traceable) {
    assert.equal(activity.provenance.workMapActivityId, activity.id);
    assert.equal(activity.provenance.source, "work_map");
    assert.match(activity.id, /^act-/);
    assert.ok(activity.declaredContext.responsibility_id);
    assert.ok(activity.declaredContext.declared_responsibility_context);
  }
});

test("adapter does not import or call legacy work-map flattening", () => {
  assert.equal(adapterExecutableSource.includes("work-map-flatten"), false);
  assert.equal(
    adapterExecutableSource.includes("flattenWorkMapToActivities"),
    false,
  );
});

test("traceable extraction ignores empty activities and preserves original act-* ids", () => {
  const workMap = buildSavedWorkMap({
    responsibilities: [
      {
        id: "resp-1",
        text: VALID_RESPONSIBILITY_1,
        activities: [
          { id: "act-keep", text: VALID_ACTIVITY_1 },
          { id: "act-empty", text: "   " },
        ],
      },
    ],
  });

  const traceable = extractTraceableWorkMapActivities(workMap);

  assert.equal(traceable.length, 1);
  assert.equal(traceable[0]?.id, "act-keep");
  assert.equal(traceable[0]?.provenance.workMapActivityId, "act-keep");
  assert.ok(!traceable.some((activity) => activity.id.startsWith("wm-")));
  assert.ok(
    !traceable.some((activity) =>
      activity.provenance.workMapActivityId.startsWith("wm-"),
    ),
  );
});

test("traceable extraction is deterministic for the same WorkMapData input", () => {
  const workMap = buildSavedWorkMap();
  const firstRun = extractTraceableWorkMapActivities(workMap);
  const secondRun = extractTraceableWorkMapActivities(workMap);

  assert.deepEqual(secondRun, firstRun);
  assert.ok(!adapterSource.includes("Date.now"));
  assert.ok(!adapterSource.includes("Math.random"));
});

test("resolveSignificadoCaptureMode follows F9C.1 threshold", () => {
  const smallMap = buildSavedWorkMap();
  const smallTraceable = extractTraceableWorkMapActivities(smallMap);
  assert.equal(
    resolveSignificadoCaptureMode(smallTraceable),
    "per_activity",
  );
  assert.ok(smallTraceable.length <= SIGNIFICADO_PER_ACTIVITY_THRESHOLD);

  const manyActivities = Array.from({ length: 9 }, (_, index) => ({
    id: `act-big-${index}`,
    text: `Actividad ${index + 1} con texto suficiente para contar.`,
  }));

  const largeMap = buildSavedWorkMap({
    responsibilities: [
      {
        id: "resp-big",
        text: VALID_RESPONSIBILITY_1,
        activities: manyActivities,
      },
    ],
  });
  const largeTraceable = extractTraceableWorkMapActivities(largeMap);

  assert.equal(largeTraceable.length, 9);
  assert.equal(
    resolveSignificadoCaptureMode(largeTraceable),
    "per_responsibility",
  );
});

test("selectTraceableActivity honors explicit and priority criteria", () => {
  const workMap = buildSavedWorkMap();
  const traceable = extractTraceableWorkMapActivities(workMap);

  assert.equal(
    selectTraceableActivity(traceable, {
      kind: "explicit",
      activityId: "act-2b",
    })?.id,
    "act-2b",
  );

  assert.equal(
    selectTraceableActivity(traceable, {
      kind: "priority",
      priority: { type: "responsibility", responsibilityId: "resp-2" },
    })?.id,
    "act-2",
  );

  assert.equal(selectTraceableActivity(traceable, { kind: "first" })?.id, "act-1");
});

test("buildActivityAnchorBundle assembles per-activity anchors with traceability", () => {
  const workMap = buildSavedWorkMap();
  const perActivity = completePerActivityResponses(workMap);

  const bundle = buildActivityAnchorBundle({
    sessionId: "session-test-001",
    workMap,
    perActivity,
    global: {
      priority: { type: "responsibility", responsibilityId: "resp-2" },
    },
    capturedAt: "2026-06-12T12:00:00.000Z",
  });

  assert.equal(bundle.version, SIGNIFICADO_DATA_VERSION);
  assert.equal(bundle.captureMode, "per_activity");
  assert.equal(bundle.anchors.length, 4);
  assert.equal(bundle.selectionGovernance, "eve_policy_required");
  assert.equal(bundle.primaryActivitySelectionPolicy, "not_implemented_in_r2_2");
  assert.equal(bundle.userPriorityDoesNotSelectRuntimeActivities, true);
  assert.equal(bundle.selectedPrimaryActivityId, "");
  assert.equal(bundle.workMapRef.activityCount, 4);
  assert.equal(bundle.workMapRef.isSaved, true);

  const firstAnchor = bundle.anchors[0];
  assert.equal(firstAnchor?.unitKey.scope, "activity");
  if (firstAnchor?.unitKey.scope === "activity") {
    assert.equal(firstAnchor.unitKey.activityId, "act-1");
  }
  assert.equal(firstAnchor?.clarity, "clear");
  assert.equal(firstAnchor?.energy, "balanced");
  assert.equal(firstAnchor?.userConfirmed, true);
});

test("evaluateActivityAnchorReadiness does not block on subjective orientation fields", () => {
  const workMap = buildSavedWorkMap();
  const incompleteBundle = buildActivityAnchorBundle({
    sessionId: "session-test-002",
    workMap,
    global: {},
  });

  const readiness = evaluateActivityAnchorReadiness(incompleteBundle, workMap);

  assert.equal(readiness.canSubmit, true);
  assert.equal(readiness.status, "ready");
  assert.equal(
    readiness.gaps.some((gap) =>
      ["missing_clarity", "missing_energy", "missing_global_priority"].includes(
        gap.code,
      ),
    ),
    false,
  );
});

test("evaluateActivityAnchorReadiness requires savedWithWarnings acknowledgment", () => {
  const workMap = buildSavedWorkMap({ savedWithWarnings: true });
  const bundle = buildActivityAnchorBundle({
    sessionId: "session-test-003",
    workMap,
    perActivity: completePerActivityResponses(workMap),
    global: {
      priority: { type: "all_equally" },
    },
  });

  const blocked = evaluateActivityAnchorReadiness(bundle, workMap);
  assert.equal(blocked.canSubmit, false);
  assert.ok(
    blocked.gaps.some(
      (gap) => gap.code === "saved_with_warnings_not_acknowledged",
    ),
  );

  const acknowledgedBundle = buildActivityAnchorBundle({
    sessionId: "session-test-003",
    workMap,
    perActivity: completePerActivityResponses(workMap),
    global: {
      priority: { type: "all_equally" },
      savedWithWarningsAcknowledged: true,
    },
  });

  const ready = evaluateActivityAnchorReadiness(acknowledgedBundle, workMap);
  assert.equal(ready.canSubmit, true);
  assert.equal(ready.status, "ready");
});

test("buildSignificadoSubmitPayload returns operational payload without diagnosis fields", () => {
  const workMap = buildSavedWorkMap();
  const bundle = buildActivityAnchorBundle({
    sessionId: "session-test-004",
    workMap,
    perActivity: completePerActivityResponses(workMap),
    global: {
      priority: { type: "responsibility", responsibilityId: "resp-1" },
    },
    capturedAt: "2026-06-12T12:00:00.000Z",
  });

  const payload = buildSignificadoSubmitPayload({
    workMap,
    bundle,
    submittedAt: "2026-06-12T12:05:00.000Z",
  });

  assert.ok(payload);
  assert.equal(payload?.version, SIGNIFICADO_DATA_VERSION);
  assert.equal(payload?.sessionId, "session-test-004");
  assert.equal(payload?.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionPolicy, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(payload?.userPriorityDoesNotSelectRuntimeActivities, true);
  assert.equal(payload?.primaryActivitySelectionResolvedByUser, false);
  assert.equal(payload?.primaryActivitySelectionResult.version, "PRIMARY_ACTIVITY_SELECTION_V1_3");
  assert.equal(payload?.primaryActivitySelectionResult.selectionGovernance, "eve_policy");
  assert.equal(payload?.primaryActivitySelectionResult.userSelectedActivities, false);
  assert.equal(payload?.primaryActivity.id, "act-1");
  assert.equal(payload?.bundle.selectedPrimaryActivityId, "");
  assert.equal(payload?.traceableActivities.length, 4);
  assert.equal(payload?.readiness.canSubmit, true);
  assert.equal(payload?.workMapSnapshot.isSaved, true);
  assert.equal(payload?.diagnosticsEnabled, false);
  assert.equal(payload?.exportEnabled, false);
  assert.equal(payload?.transductionEnabled, false);

  const forbiddenKeys = [
    "diagnosis",
    "mmabpMap",
    "vsmMap",
    "preliminaryDiagnostic",
    "closureResult",
  ];

  for (const key of forbiddenKeys) {
    assert.equal(Object.hasOwn(payload ?? {}, key), false);
  }
});

test("buildSignificadoSubmitPayload returns null when readiness fails", () => {
  const workMap = buildSavedWorkMap({ isSaved: false });
  const bundle = buildActivityAnchorBundle({
    sessionId: "session-test-005",
    workMap,
    perActivity: completePerActivityResponses(workMap),
    global: {
      priority: { type: "all_equally" },
    },
  });

  assert.equal(
    buildSignificadoSubmitPayload({ workMap, bundle }),
    null,
  );
});

test("buildActivityAnchorDraft keeps provenance on manual draft construction", () => {
  const workMap = buildSavedWorkMap();
  const traceable = extractTraceableWorkMapActivities(workMap);
  const activity = traceable[0];
  assert.ok(activity);

  const draft = buildActivityAnchorDraft(
    { scope: "activity", activityId: activity.id },
    { clarity: "sometimes_confusing", energy: "heavy", userConfirmed: true },
    activity.provenance,
  );

  assert.ok(!Array.isArray(draft.provenance));
  if (!Array.isArray(draft.provenance)) {
    assert.equal(draft.provenance.workMapActivityId, "act-1");
  }
  assert.equal(draft.clarity, "sometimes_confusing");
  assert.equal(draft.userConfirmed, true);
});
