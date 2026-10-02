import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateExecutionEngineShadow,
  EXECUTION_ENGINE_BLOCKED_ACTIONS,
  EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION,
  EXECUTION_ENGINE_PROTECTED_METADATA,
  EXECUTION_ENGINE_SHADOW_CHIP_ID,
  EXECUTION_ENGINE_SHADOW_FIXTURES,
  EXECUTION_ENGINE_SHADOW_MODE,
  type ExecutionEngineEvaluationInput,
  type ExecutionEngineEvaluationResult,
} from "../../src/domain/eve-execution-engine-shadow/index.ts";

const domainFiles = [
  "src/domain/eve-execution-engine-shadow/types.ts",
  "src/domain/eve-execution-engine-shadow/fixtures.ts",
  "src/domain/eve-execution-engine-shadow/execution-engine-shadow.ts",
  "src/domain/eve-execution-engine-shadow/index.ts",
];

test("pure import exposes execution engine shadow evaluator without app runtime", () => {
  assert.equal(typeof evaluateExecutionEngineShadow, "function");
  assert.equal(EXECUTION_ENGINE_SHADOW_MODE, "execution_engine_shadow");
  assert.equal(EXECUTION_ENGINE_SHADOW_CHIP_ID, "EVE-06-EXECUTION-ENGINE");
});

test("runs the 16 approved execution engine shadow fixtures", () => {
  assert.equal(EXECUTION_ENGINE_SHADOW_FIXTURES.length, 16);

  for (const fixture of EXECUTION_ENGINE_SHADOW_FIXTURES) {
    const result = evaluateExecutionEngineShadow(fixture.input);

    assert.equal(result.mode, EXECUTION_ENGINE_SHADOW_MODE, fixture.fixtureId);
    assert.equal(result.chipId, EXECUTION_ENGINE_SHADOW_CHIP_ID, fixture.fixtureId);
    assert.equal(result.readinessState, fixture.expectedReadinessState, fixture.fixtureId);
    assert.equal(result.resolved, fixture.expectedResolved, fixture.fixtureId);
    assert.equal(result.resolvedEntity?.entityKind ?? fixture.expectedEntityKind, fixture.expectedEntityKind);
    assert.deepEqual(result.gapFlags, fixture.expectedGapFlags, fixture.fixtureId);
    assertSafetyFlags(result);
    assertBlockedActions(result);
    assertDocumentarySatisfaction(result);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.runtimeAuthority, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.registryWrite, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.productWiring, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.eveBrainConnection, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.diagnosisEnabled, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.exportEnabled, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.sqlEnabled, false);
    assert.equal(EXECUTION_ENGINE_PROTECTED_METADATA.noCableado.supabaseWrite, false);
  }
});

test("reports missing record, missing source trace and missing evidence trace", () => {
  const missingRecord = evaluateExecutionEngineShadow(
    baseInput({
      queryType: "resolve_activity_runtime_run",
      recordType: "activity_runtime_run",
      recordId: "missing-run",
    }),
  );
  assert.equal(missingRecord.readinessState, "execution_engine_lookup_not_found");
  assert.equal(missingRecord.resolved, false);
  assert.deepEqual(missingRecord.missingReferences, ["missing-run"]);
  assert.equal(missingRecord.gapFlags.includes("record_not_found"), true);

  const missingSourceTrace = evaluateExecutionEngineShadow(
    baseInput({
      queryType: "validate_evidence_trace",
      recordType: "evidence_item",
      context: { sourceTraceMissing: true },
    }),
  );
  assert.equal(missingSourceTrace.readinessState, "evidence_trace_missing");
  assert.equal(missingSourceTrace.resolved, false);
  assert.equal(missingSourceTrace.gapFlags.includes("source_trace_missing"), true);

  const missingEvidenceTrace = evaluateExecutionEngineShadow(
    baseInput({
      queryType: "validate_evidence_trace",
      recordType: "evidence_item",
      context: { evidenceMissing: true },
    }),
  );
  assert.equal(missingEvidenceTrace.readinessState, "evidence_trace_missing");
  assert.equal(missingEvidenceTrace.resolved, false);
});

test("protects documentary satisfaction counters", () => {
  const result = evaluateExecutionEngineShadow(baseInput({ queryType: "validate_documentary_satisfaction" }));

  assert.equal(result.readinessState, "documentary_satisfaction_confirmed");
  assertDocumentarySatisfaction(result);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.modulesChecked, 6);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.modulesExpected, 6);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesChecked, 135);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesExpected, 135);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.failureGuardsChecked, 18);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.failureGuardsExpected, 18);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.integrationRulesChecked, 14);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.integrationRulesExpected, 14);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsChecked, 20);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsExpected, 20);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.qaControlsChecked, 22);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.qaControlsExpected, 22);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.schemaFieldsChecked, 54);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.schemaFieldsExpected, 54);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.accepted, 310);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.rejected, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceRoleMismatch, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceMissing, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.wiringRiskDetected, 0);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.materialDifference, false);
});

test("protects D1/D8/SCR boundaries and STM6-016 coverage", () => {
  const result = evaluateExecutionEngineShadow(
    baseInput({
      queryType: "validate_source_role",
      recordType: "structural_candidate_record",
      sourceDocumentId: "D8,D1",
      sourceTrace: ["D8!MMABP_Mapping", "D1:contextual_guard_only"],
      evidenceRefs: ["SCR-002", "STM6-016"],
    }),
  );

  assert.equal(result.readinessState, "source_role_valid");
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.d1DirectProofScr, false);
  assert.equal(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.d8PresentForScr, true);
  assert.deepEqual(EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.stm6016Covers, [
    "evidence_item",
    "canonical_variable_record",
    "structural_candidate_record",
  ]);
});

test("implementation files remain pure-domain and not wired", () => {
  const source = domainFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    /createClient/i,
    /@supabase/i,
    /from\(/i,
    /insert\(/i,
    /update\(/i,
    /delete\(/i,
    /fetch\(/i,
    /localStorage/i,
    /sessionStorage/i,
    /runtimeAuthority:\s*true/i,
    /canConnectEveBrain:\s*true/i,
    /canWriteRegistry:\s*true/i,
    /canExecuteSql:\s*true/i,
    /canWriteSupabase:\s*true/i,
    /page\.tsx/i,
    /route\.ts/i,
    /api\//i,
    /WorkMap mutation/i,
    /Significado mutation/i,
    /src\/app/i,
    /src\/components/i,
    /src\/features/i,
    /src\/services/i,
    /process\.env/i,
    /Date\.now/i,
    /Math\.random/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

function baseInput(overrides: Partial<ExecutionEngineEvaluationInput>): ExecutionEngineEvaluationInput {
  return {
    mode: EXECUTION_ENGINE_SHADOW_MODE,
    queryType: "resolve_activity_runtime_run",
    ...overrides,
  };
}

function assertSafetyFlags(result: ExecutionEngineEvaluationResult) {
  assert.equal(result.safetyFlags.canBlockUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canModifyCatalog, false);
  assert.equal(result.safetyFlags.canTriggerRuntime, false);
  assert.equal(result.safetyFlags.canTriggerDiagnosis, false);
  assert.equal(result.safetyFlags.canTriggerExport, false);
  assert.equal(result.safetyFlags.canExecuteSql, false);
  assert.equal(result.safetyFlags.canWriteSupabase, false);
  assert.equal(result.safetyFlags.canConnectEveBrain, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

function assertBlockedActions(result: ExecutionEngineEvaluationResult) {
  for (const blockedAction of [
    "block_user_flow",
    "modify_payload",
    "write_registry",
    "mutate_catalog",
    "trigger_runtime",
    "trigger_diagnosis",
    "trigger_export",
    "connect_eve_brain",
    "mutate_workmap",
    "mutate_significado",
    "create_api",
    "write_supabase",
    "execute_sql",
  ]) {
    assert.equal(result.blockedActions.includes(blockedAction), true, blockedAction);
    assert.equal(EXECUTION_ENGINE_BLOCKED_ACTIONS.includes(blockedAction), true, blockedAction);
  }
}

function assertDocumentarySatisfaction(result: ExecutionEngineEvaluationResult) {
  assert.equal(result.documentarySatisfaction.status, "satisfactory");
  assert.equal(result.documentarySatisfaction.modulesChecked, 6);
  assert.equal(result.documentarySatisfaction.modulesExpected, 6);
  assert.equal(result.documentarySatisfaction.atomicRulesChecked, 135);
  assert.equal(result.documentarySatisfaction.atomicRulesExpected, 135);
  assert.equal(result.documentarySatisfaction.failureGuardsChecked, 18);
  assert.equal(result.documentarySatisfaction.failureGuardsExpected, 18);
  assert.equal(result.documentarySatisfaction.integrationRulesChecked, 14);
  assert.equal(result.documentarySatisfaction.integrationRulesExpected, 14);
  assert.equal(result.documentarySatisfaction.sourceToTargetMappingsChecked, 20);
  assert.equal(result.documentarySatisfaction.sourceToTargetMappingsExpected, 20);
  assert.equal(result.documentarySatisfaction.qaControlsChecked, 22);
  assert.equal(result.documentarySatisfaction.qaControlsExpected, 22);
  assert.equal(result.documentarySatisfaction.schemaFieldsChecked, 54);
  assert.equal(result.documentarySatisfaction.schemaFieldsExpected, 54);
  assert.equal(result.documentarySatisfaction.accepted, 310);
  assert.equal(result.documentarySatisfaction.rejected, 0);
  assert.equal(result.documentarySatisfaction.pendingSourceProof, 0);
  assert.equal(result.documentarySatisfaction.pendingLocatorPrecision, 0);
  assert.equal(result.documentarySatisfaction.sourceRoleMismatch, 0);
  assert.equal(result.documentarySatisfaction.sourceMissing, 0);
  assert.equal(result.documentarySatisfaction.wiringRiskDetected, 0);
  assert.equal(result.documentarySatisfaction.materialDifference, false);
}
