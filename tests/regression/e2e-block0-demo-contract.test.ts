import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { tmpdir } from "node:os";

import { dirname, join, resolve } from "node:path";

import { register } from "node:module";

import { pathToFileURL } from "node:url";

import { fileURLToPath } from "node:url";

import assert from "node:assert/strict";

import { test } from "node:test";



const testDir = dirname(fileURLToPath(import.meta.url));

const projectRoot = resolve(testDir, "../..");

const hookPath = join(tmpdir(), "eve-e2e-block0-demo-contract-path-hook.mjs");



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



const PAGE_PATH = "src/app/dev/e2e-block0/page.tsx";

const PRODUCTION_PAGE_PATH = "src/app/page.tsx";

const FIXTURE_PATH = "src/features/dev/e2e-block0-demo-fixture.ts";

const STATE_PATH = "src/features/dev/e2e-block0-demo-state.ts";



const FORBIDDEN_VISIBLE_PATTERNS = [

  /inferred_from_workmap/i,

  /context_from_workmap/i,

  /captured_user_evidence/i,

  /user_confirmed_suggestion/i,

  /\bcanonical\b/i,

  /fallback_no_canonico/i,

  /CANONICAL_HELP_MISSING/i,

  /\bruntime\b/i,

  /Bloque 0/i,

  /\bpayload\b/i,

  /\bbundle\b/i,

  /\bscore\b/i,

  /\bgates\b/i,

  /transducci[oó]n/i,

  /diagn[oó]stico/i,

  /\bMMABP\b/i,

  /\bVSM\b/,

  /\bAHE\b/,

];



function readText(path: string) {

  assert.equal(existsSync(path), true, `Missing file: ${path}`);

  return readFileSync(path, "utf8");

}



function visibleCopySource(source: string): string {

  return source

    .split("\n")

    .filter((line) => !line.trim().startsWith("import "))

    .join("\n");

}



test("e2e block0 demo route exists", () => {

  assert.equal(existsSync(PAGE_PATH), true);

  assert.match(readText(PAGE_PATH), /E2EBlock0DemoPage/);

});



test("demo uses real WorkMapIntake and SignificadoDeTuTrabajo", () => {

  const page = readText(PAGE_PATH);

  assert.match(page, /from "@\/components\/WorkMapIntake"/);

  assert.match(page, /<WorkMapIntake/);

  assert.match(page, /from "@\/components\/significado\/SignificadoDeTuTrabajo"/);

  assert.match(page, /<SignificadoDeTuTrabajo/);

});



test("demo uses real primary selection policy and block0 prefill builder", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /selectPrimaryActivitiesFromWorkMap/);

  assert.match(state, /buildInitialBlock0VisualDraftFromWorkMap/);

});



test("demo does not use manual DEV_VISUAL_DRAFT or initialVisualDraft override", () => {

  const page = readText(PAGE_PATH);

  assert.doesNotMatch(page, /DEV_VISUAL_DRAFT/);

  assert.doesNotMatch(page, /initialVisualDraft/);

});



test("demo avoids Supabase, APIs, runtime engine and B0.5", () => {

  const page = readText(PAGE_PATH);

  const fixture = readText(FIXTURE_PATH);



  for (const source of [page, fixture]) {

    assert.doesNotMatch(source, /@\/lib\/supabase/);

    assert.doesNotMatch(source, /\/api\//);

    assert.doesNotMatch(source, /runtime-engine/);

    assert.doesNotMatch(source, /B0\.5|B0-5|block0\.5/i);

  }

});



test("financial example fixture has valid structure", async () => {

  const {

    createE2eFinancialExampleWorkMap,

    countFilledWorkMapActivities,

    countWorkMapResponsibilities,

    E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT,

    E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT,

  } = await import("@/features/dev/e2e-block0-demo-fixture");

  const { selectPrimaryActivitiesFromWorkMap } = await import(

    "@/services/primary-activity-selector"

  );

  const { buildInitialBlock0VisualDraftFromWorkMap } = await import(

    "@/services/workmap-to-block0-prefill"

  );

  const { assertE2eDemoSelectionContract } = await import(

    "@/features/dev/e2e-block0-demo-state"

  );



  const workMap = createE2eFinancialExampleWorkMap();

  assert.equal(countWorkMapResponsibilities(workMap), 3);

  assert.equal(countFilledWorkMapActivities(workMap), E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT);

  assert.equal(workMap.isSaved, false);



  const saved = { ...workMap, isSaved: true, isReviewMode: true };

  const selection = selectPrimaryActivitiesFromWorkMap(saved);

  assert.notEqual(selection.mode, "reentry_required");

  assert.doesNotThrow(() => assertE2eDemoSelectionContract(saved, selection));

  assert.equal(

    selection.selectedPrimaryActivities.length,

    E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT,

  );



  const prefill = buildInitialBlock0VisualDraftFromWorkMap({

    workMap: saved,

    primaryActivity: selection.selectedPrimaryActivities[0] ?? null,

  });

  assert.ok(prefill.visualDraft["B0-Q01.action_verb"]?.trim());

});



test("demo starts from login and estado_a before work map", () => {

  const page = readText(PAGE_PATH);

  assert.match(page, /useState<E2eBlock0DemoPhase>\("login"\)/);

  assert.match(page, /phase === "login"/);

  assert.match(page, /phase === "estado_a"/);

  assert.match(page, /E2eBlock0DemoLoginPanel/);

  assert.match(page, /EmptyAssessmentState/);

  assert.match(page, /advanceE2eDemoToEstadoA/);

  assert.match(page, /onEnterDemo=\{enterDemo\}/);

});



test("demo login button is enabled and advances to estado_a without auth", async () => {

  const page = readText(PAGE_PATH);

  const { advanceE2eDemoToEstadoA } = await import("@/features/dev/e2e-block0-demo-state");



  assert.match(page, /Demo controlada/);

  assert.match(page, /data-e2e-demo-login-button="true"/);

  assert.match(page, /type="button"/);

  assert.doesNotMatch(page, /ClientAuthScreen/);

  assert.doesNotMatch(page, /@\/lib\/supabase/);

  assert.doesNotMatch(page, /\/api\//);



  const next = advanceE2eDemoToEstadoA("");

  assert.equal(next.phase, "estado_a");

  assert.equal(next.authDisplayName, "Usuario Demo");

  assert.ok(next.startPositionContext.participationPlace);

});



test("demo exposes dev trace panel and trace builder", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /Ver traza demo/);

  assert.match(page, /buildE2eBlock0DemoTrace/);

  assert.match(state, /flattenFilledWorkMapActivities/);

  assert.match(state, /validateE2eBlock0TraceInvariants/);

});



test("trace includes flattenedActivitiesCount and flattened activity table", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /flattenedActivitiesCount/);

  assert.match(page, /flattenedActivities\.map/);

  assert.match(state, /flattenedActivitiesCount/);

});



test("trace includes selectedPrimaryActivities count and entries", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /selectionTrace\.selectedCount/);

  assert.match(page, /selectedPrimaryActivities\.map/);

  assert.match(state, /selectedPrimaryActivities:/);

});

test("trace exposes PreRuntimeContextBundle without turning context into evidence", () => {
  const page = readText(PAGE_PATH);
  const state = readText(STATE_PATH);

  assert.match(page, /PreRuntimeContextBundle/);
  assert.match(page, /functional_role_context/);
  assert.match(page, /decision_level_context/);
  assert.match(page, /allowedUses/);
  assert.match(page, /forbiddenUses/);
  assert.match(state, /preRuntimeContextBundle/);
  assert.match(state, /buildPreRuntimeContextBundle/);
});



test("trace includes currentActivity source indexes and exactMatchInFlattenedWorkMap", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /sourceFlattenedIndex/);

  assert.match(page, /exactMatchInFlattenedWorkMap/);

  assert.match(state, /exactMatchInFlattenedWorkMap/);

  assert.match(state, /sourceFlattenedIndex/);

});



test("trace validates currentActivity belongs to selectedPrimaryActivities", () => {

  const state = readText(STATE_PATH);



  assert.match(state, /inSelectedPrimaryActivities/);

  assert.match(state, /currentNotSelected/);

  assert.match(state, /PrimaryActivitySelectionPolicy/);

});



test("trace validates prefill source matches current activity", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /prefillBuiltFromCurrentActivity/);

  assert.match(page, /prefillSourceActivityTitle/);

  assert.match(state, /prefillBuiltFromCurrentActivity/);

  assert.match(state, /prefillSourceMismatch/);

});



test("trace classifies sourceMode manual vs loaded_financial_example", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /workMapSourceMode/);

  assert.match(page, /loaded_financial_example/);

  assert.match(page, /"manual"/);

  assert.match(state, /E2eBlock0WorkMapSourceMode/);

  assert.match(state, /sourceMode/);

});



test("manual flow rejects financial fixture leakage", async () => {

  const { createE2eFinancialExampleWorkMap } = await import(

    "@/features/dev/e2e-block0-demo-fixture"

  );

  const { selectPrimaryActivitiesFromWorkMap } = await import(

    "@/services/primary-activity-selector"

  );

  const {

    buildE2eBlock0DemoTrace,

    E2E_BLOCK0_TRACEABILITY_ERRORS,

  } = await import("@/features/dev/e2e-block0-demo-state");



  const saved = {

    ...createE2eFinancialExampleWorkMap(),

    isSaved: true,

    isReviewMode: true,

  };

  const selection = selectPrimaryActivitiesFromWorkMap(saved);

  const trace = buildE2eBlock0DemoTrace({

    phase: "significado",

    workMap: saved,

    savedWorkMapSnapshot: saved,

    visibleDraftWorkMap: saved,

    sourceMode: "manual",

    workMapSavedAt: new Date().toISOString(),

    primaryActivitySelectionResult: selection,

    block0Progress: null,

  });



  assert.ok(

    trace.traceabilityErrors.includes(

      E2E_BLOCK0_TRACEABILITY_ERRORS.fixtureLeakageManual,

    ),

  );

});



test("financial example trace passes invariants when sourceMode matches", async () => {

  const { createE2eFinancialExampleWorkMap } = await import(

    "@/features/dev/e2e-block0-demo-fixture"

  );

  const { selectPrimaryActivitiesFromWorkMap } = await import(

    "@/services/primary-activity-selector"

  );

  const { buildE2eBlock0DemoTrace } = await import("@/features/dev/e2e-block0-demo-state");



  const saved = {

    ...createE2eFinancialExampleWorkMap(),

    isSaved: true,

    isReviewMode: true,

  };

  const selection = selectPrimaryActivitiesFromWorkMap(saved);

  const trace = buildE2eBlock0DemoTrace({

    phase: "significado",

    workMap: saved,

    savedWorkMapSnapshot: saved,

    visibleDraftWorkMap: saved,

    sourceMode: "loaded_financial_example",

    wasExampleLoaded: true,

    workMapSavedAt: new Date().toISOString(),

    primaryActivitySelectionResult: selection,

    block0Progress: null,

  });



  assert.equal(trace.sourceMode, "loaded_financial_example");

  assert.equal(trace.flattenedActivitiesCount, 17);

  assert.equal(trace.selectedPrimaryCount, 8);

  assert.equal(trace.selectionTrace.selectionMode, "competitive_selection");

  assert.equal(trace.currentActivity.exactMatchInFlattenedWorkMap, true);

  assert.equal(trace.currentActivity.inSelectedPrimaryActivities, true);

  assert.equal(trace.block0Prefill.prefillBuiltFromCurrentActivity, true);

  assert.equal(trace.traceabilityErrors.length, 0);

});



test("production page does not expose dev trace panel", () => {

  const productionPage = readText(PRODUCTION_PAGE_PATH);

  assert.doesNotMatch(productionPage, /Ver traza demo/);

  assert.doesNotMatch(productionPage, /buildE2eBlock0DemoTrace/);

  assert.doesNotMatch(productionPage, /TRACEABILITY_ERROR/);

});



test("demo exposes primary selection trace without ranking leakage to main surface", () => {

  const page = readText(PAGE_PATH);

  const state = readText(STATE_PATH);



  assert.match(page, /selectionTrace\.selectedCount/);

  assert.match(page, /selectionTrace\.policy/);

  assert.match(state, /PRIMARY_ACTIVITY_SELECTION_VERSION/);

  const mainSurface = visibleCopySource(page)
    .split("DevTracePanel")[0]
    .concat(visibleCopySource(page).split("function DevTracePanel")[0] ?? "");

  assert.doesNotMatch(mainSurface, /\bscore\b/i);

});



test("main demo surface avoids forbidden internal terms", () => {

  const page = readText(PAGE_PATH);

  const visible = visibleCopySource(page);



  for (const pattern of FORBIDDEN_VISIBLE_PATTERNS) {

    assert.doesNotMatch(visible, pattern, `Forbidden visible copy: ${pattern}`);

  }

});



test("trace includes sourceTrace draft vs saved area comparison", () => {
  const page = readText(PAGE_PATH);
  const state = readText(STATE_PATH);

  assert.match(page, /sourceTrace\.selectedAreasFromDraft/);
  assert.match(page, /sourceTrace\.selectedAreasFromSavedSnapshot/);
  assert.match(page, /sourceTrace\.areasMatch/);
  assert.match(state, /selectedAreasFromDraft/);
  assert.match(state, /areasDraftSavedMismatch/);
});

test("trace includes countTrace visible vs saved counts", () => {
  const page = readText(PAGE_PATH);
  const state = readText(STATE_PATH);

  assert.match(page, /countTrace\.countsMatch/);
  assert.match(page, /flattenedActivitiesCountVisible/);
  assert.match(state, /flattenedActivitiesCountVisible/);
});

test("reset demo clears persisted work map draft in page wiring", () => {
  const page = readText(PAGE_PATH);
  assert.match(page, /clearDemoWorkMapDraft/);
  assert.match(page, /clearWorkMapDraft/);
  assert.match(page, /savedWorkMapSnapshot/);
  assert.match(page, /workMapSeed/);
  assert.match(page, /readWorkMapDraft/);
});

test("save path resolves source mode from visible draft snapshot", () => {
  const page = readText(PAGE_PATH);
  const state = readText(STATE_PATH);

  assert.match(page, /resolveE2eSourceModeAfterSave/);
  assert.match(page, /applySavedWorkMapSnapshot/);
  assert.match(state, /manual_modified_from_example/);
});

test("manual minimal work map uses non_competitive_inclusion", async () => {
  const {
    createE2eManualMinimalWorkMap,
    countFilledWorkMapActivities,
    E2E_MANUAL_MINIMAL_EXPECTED_ACTIVITY_COUNT,
  } = await import("@/features/dev/e2e-block0-demo-fixture");
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    "@/services/primary-activity-selector"
  );
  const { buildE2eBlock0DemoTrace } = await import("@/features/dev/e2e-block0-demo-state");

  const saved = {
    ...createE2eManualMinimalWorkMap(),
    isSaved: true,
    isReviewMode: true,
  };
  const selection = selectPrimaryActivitiesFromWorkMap(saved);

  assert.equal(
    countFilledWorkMapActivities(saved),
    E2E_MANUAL_MINIMAL_EXPECTED_ACTIVITY_COUNT,
  );
  assert.equal(selection.mode, "non_competitive_inclusion");
  assert.equal(selection.selectedPrimaryActivities.length, 4);
  assert.equal(selection.runLog.eligibleActivityCount, 4);

  const trace = buildE2eBlock0DemoTrace({
    phase: "significado",
    workMap: saved,
    savedWorkMapSnapshot: saved,
    visibleDraftWorkMap: saved,
    sourceMode: "manual",
    primaryActivitySelectionResult: selection,
    block0Progress: null,
  });

  assert.equal(trace.selectionTrace.selectionMode, "non_competitive_inclusion");
  assert.equal(trace.traceabilityErrors.length, 0);
});

test("financial example uses competitive_selection when eligible > 8", async () => {
  const { createE2eFinancialExampleWorkMap } = await import(
    "@/features/dev/e2e-block0-demo-fixture"
  );
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    "@/services/primary-activity-selector"
  );

  const saved = {
    ...createE2eFinancialExampleWorkMap(),
    isSaved: true,
    isReviewMode: true,
  };
  const selection = selectPrimaryActivitiesFromWorkMap(saved);

  assert.equal(selection.mode, "competitive_selection");
  assert.equal(selection.selectedPrimaryActivities.length, 8);
  assert.ok(selection.runLog.eligibleActivityCount > 8);
  assert.equal(
    selection.nonPrimaryContextActivities.length,
    selection.runLog.eligibleActivityCount - 8,
  );
});

test("resolve source mode marks edited example as manual_modified_from_example", async () => {
  const { resolveE2eSourceModeAfterSave } = await import(
    "@/features/dev/e2e-block0-demo-state"
  );
  const {
    createE2eFinancialExampleWorkMap,
    createE2eManualMinimalWorkMap,
  } = await import("@/features/dev/e2e-block0-demo-fixture");

  const untouched = {
    ...createE2eFinancialExampleWorkMap(),
    isSaved: true,
    isReviewMode: true,
  };
  assert.equal(
    resolveE2eSourceModeAfterSave({
      declaredSourceMode: "loaded_financial_example",
      wasExampleLoaded: true,
      savedWorkMap: untouched,
    }),
    "loaded_financial_example",
  );

  const edited = {
    ...createE2eManualMinimalWorkMap(),
    isSaved: true,
    isReviewMode: true,
  };
  assert.equal(
    resolveE2eSourceModeAfterSave({
      declaredSourceMode: "loaded_financial_example",
      wasExampleLoaded: true,
      savedWorkMap: edited,
    }),
    "manual_modified_from_example",
  );
});

test("selected count never exceeds max allowed primary", async () => {
  const { createE2eFinancialExampleWorkMap } = await import(
    "@/features/dev/e2e-block0-demo-fixture"
  );
  const { selectPrimaryActivitiesFromWorkMap } = await import(
    "@/services/primary-activity-selector"
  );

  const selection = selectPrimaryActivitiesFromWorkMap({
    ...createE2eFinancialExampleWorkMap(),
    isSaved: true,
    isReviewMode: true,
  });

  assert.ok(selection.selectedPrimaryActivities.length <= 8);
});

test("demo exposes dev trace without contaminating Significado", () => {

  const page = readText(PAGE_PATH);

  assert.match(page, /Ver traza demo/);

  assert.doesNotMatch(page, /inferred_from_workmap/);

});


