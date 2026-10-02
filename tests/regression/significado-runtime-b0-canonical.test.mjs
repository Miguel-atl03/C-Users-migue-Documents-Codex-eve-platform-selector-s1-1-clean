import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/page.tsx", "utf8");
const screenSource = readFileSync(
  "src/components/significado/SignificadoDeTuTrabajo.tsx",
  "utf8",
);
const routeSource = readFileSync("src/app/api/significado/block0/route.ts", "utf8");
const runtimeRepositorySource = readFileSync(
  "src/services/significado-runtime-block0-repository.ts",
  "utf8",
);

test("commercial Significado B0 returns before the legacy questionnaire pipeline", () => {
  const commercialReturnIndex = pageSource.indexOf(
    'if (activeSessionMode === "commercial")',
    pageSource.indexOf('const block0Response = await fetch("/api/significado/block0"'),
  );
  const legacyPipelineIndex = pageSource.indexOf(
    "await runPostWorkMapQuestionnairePipeline",
    pageSource.indexOf("const submitSignificadoIntake"),
  );

  assert.ok(commercialReturnIndex > 0, "commercial B0 branch must exist");
  assert.ok(legacyPipelineIndex > 0, "legacy pipeline remains for demo/legacy");
  assert.ok(
    commercialReturnIndex < legacyPipelineIndex,
    "commercial branch must short-circuit before legacy questionnaire pipeline",
  );
  assert.match(
    pageSource.slice(commercialReturnIndex, legacyPipelineIndex),
    /return;/,
    "commercial branch must stop after canonical Runtime B0 persistence",
  );
});

test("Significado screen prioritizes participant Runtime progress over selectedPrimaryActivities[0]", () => {
  const currentActivityBlock = screenSource.slice(
    screenSource.indexOf("const currentActivity = useMemo"),
    screenSource.indexOf("const workMapBlock0Prefill = useMemo"),
  );

  assert.ok(
    currentActivityBlock.indexOf("participantActivityProgress?.activity") <
      currentActivityBlock.indexOf("selectedPrimaryActivities[0]"),
    "Runtime progress must be the execution cursor before selection-result context",
  );
  assert.match(
    screenSource,
    /Boolean\(effectivePrimaryActivitySelectionResult\) \|\| hasRuntimeProgressActivity/,
    "commercial Runtime progress must allow B0 continuation without in-memory selection",
  );
});

test("commercial block0 route uses canonical Runtime persistence", () => {
  assert.match(routeSource, /persistCanonicalSignificadoBlock0/);
  assert.match(routeSource, /if \(mode === "commercial"\)/);
  assert.ok(
    routeSource.indexOf('if (mode === "commercial")') <
      routeSource.indexOf("const sessionResult = await resolveSessionOwner"),
    "commercial mode should not require legacy session owner before canonical runtime resolution",
  );
});

test("canonical repository writes Runtime B0 tables and audit trail", () => {
  for (const table of [
    "runtime_interaction_instance",
    "response_record",
    "runtime_subfield_response",
    "evidence_item",
    "canonical_variable_record",
    "runtime_audit_trail",
  ]) {
    assert.match(runtimeRepositorySource, new RegExp(`from\\("${table}"\\)`));
  }

  assert.match(runtimeRepositorySource, /active_base_capture/);
  assert.match(runtimeRepositorySource, /significado_b0_confirmed/);
  assert.doesNotMatch(runtimeRepositorySource, /rank-activities|scenes\/bootstrap|intake\/triple/);
});
