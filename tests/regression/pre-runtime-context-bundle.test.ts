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
const hookPath = join(tmpdir(), "eve-pre-runtime-context-bundle-hook.mjs");

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

const builderModule = await import("@/services/pre-runtime-context-bundle-builder");
const selectorModule = await import("@/services/primary-activity-selector");

const { buildPreRuntimeContextBundle } = builderModule;
const { selectPrimaryActivitiesFromWorkMap } = selectorModule;

type WorkMapData = import("@/domain/local-work-map").WorkMapData;

function buildDirectorCostosWorkMap(): WorkMapData {
  const fixture = JSON.parse(
    readFileSync("tests/fixtures/pre-runtime-context-director-costos.fixture.v1.0.json", "utf8"),
  ) as {
    workMap: { areas: string[] };
  };
  const selectionFixture = JSON.parse(
    readFileSync("tests/fixtures/director-costos-calibration.v1.3.json", "utf8"),
  ) as {
    activities: Array<{ activityId: string; activityTitle: string }>;
  };

  return {
    selectedAreas: fixture.workMap.areas,
    customAreas: [],
    responsibilities: [
      {
        id: "R1",
        text: "Normatividad, alta de proyectos y administracion base en sistemas.",
        activities: selectionFixture.activities.slice(0, 4).map((activity) => ({
          id: activity.activityId,
          text: activity.activityTitle,
        })),
      },
      {
        id: "R2",
        text: "Presupuestacion, licitaciones, cotizaciones y matrices de costos.",
        activities: selectionFixture.activities.slice(4, 11).map((activity) => ({
          id: activity.activityId,
          text: activity.activityTitle,
        })),
      },
      {
        id: "R3",
        text: "Control presupuestal, pagos, cierres, firmas y seguimiento financiero.",
        activities: selectionFixture.activities.slice(11).map((activity) => ({
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
    startPositionContext: {
      participationPlace: "other",
      participationPlaceOther: "Director de Costos",
      decisionProximity: "take_directly",
    },
  };
}

test("builds governed Estado A, WorkMap and selection context bundle", () => {
  const workMap = buildDirectorCostosWorkMap();
  const selection = selectPrimaryActivitiesFromWorkMap(workMap);
  const bundle = buildPreRuntimeContextBundle({
    workMap,
    startPositionContext: workMap.startPositionContext,
    primaryActivitySelectionResult: selection,
    createdAt: "2026-06-17T00:00:00.000Z",
  });

  assert.equal(bundle.policyVersion, "PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0");
  assert.equal(
    bundle.estadoAContext.functional_role_context.value,
    "Director de Costos",
  );
  assert.equal(
    bundle.estadoAContext.functional_role_context.epistemicStatus,
    "captured_user_context",
  );
  assert.ok(bundle.estadoAContext.decision_level_context.value);
  assert.equal(bundle.workMapContext.areas.value?.length, 5);
  assert.equal(bundle.workMapContext.responsibilities.value?.length, 3);
  assert.equal(bundle.selectionContext?.selectedPrimaryActivities.value?.length, 8);
  assert.equal(bundle.selectionContext?.selectedPrimaryActivities.epistemicStatus, "context_only");
  assert.equal(bundle.selectionContext?.nonPrimaryContextActivities.value?.length, 9);
  assert.equal(
    bundle.selectionContext?.nonPrimaryContextActivities.epistemicStatus,
    "context_only",
  );
  assert.equal(bundle.runtimeContext.contextMustNotBeSavedAsConfirmedEvidence, true);
  assert.ok(
    bundle.estadoAContext.functional_role_context.mustNotBeUsedFor.includes(
      "confirmed_mmabp_evidence",
    ),
  );
});

test("marks Estado A gaps without converting context into evidence", () => {
  const workMap = buildDirectorCostosWorkMap();
  const bundle = buildPreRuntimeContextBundle({
    workMap: { ...workMap, startPositionContext: undefined },
    startPositionContext: null,
    primaryActivitySelectionResult: selectPrimaryActivitiesFromWorkMap(workMap),
    createdAt: "2026-06-17T00:00:00.000Z",
  });

  assert.equal(bundle.sourceState.estadoAAvailable, false);
  assert.equal(bundle.estadoAContext.functional_role_context.epistemicStatus, "gap");
  assert.equal(bundle.estadoAContext.decision_level_context.epistemicStatus, "gap");
  assert.equal(
    bundle.runtimeContext.contextMustNotBeSavedAsConfirmedEvidence,
    true,
  );
});
