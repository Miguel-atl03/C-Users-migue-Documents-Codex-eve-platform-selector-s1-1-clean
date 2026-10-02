import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateGateEngineShadow,
  GATE_ENGINE_BLOCKED_ACTIONS,
  GATE_ENGINE_DOCUMENTARY_SATISFACTION,
  GATE_ENGINE_NO_OVERREACH_GUARDS,
  GATE_ENGINE_PROTECTED_METADATA,
  GATE_ENGINE_SHADOW_CHIP_ID,
  GATE_ENGINE_SHADOW_FIXTURES,
  GATE_ENGINE_SHADOW_MODE,
  type GateEngineEvaluationInput,
  type GateEngineEvaluationResult,
} from "../../src/domain/eve-gate-engine-shadow/index.ts";

const domainFiles = [
  "src/domain/eve-gate-engine-shadow/types.ts",
  "src/domain/eve-gate-engine-shadow/fixtures.ts",
  "src/domain/eve-gate-engine-shadow/gate-engine-shadow.ts",
  "src/domain/eve-gate-engine-shadow/index.ts",
];

test("pure import exposes gate engine shadow evaluator without app runtime", () => {
  assert.equal(typeof evaluateGateEngineShadow, "function");
  assert.equal(GATE_ENGINE_SHADOW_MODE, "gate_engine_shadow");
  assert.equal(GATE_ENGINE_SHADOW_CHIP_ID, "EVE-05-GATE-ENGINE");
});

test("runs the 12 approved gate engine shadow fixtures", () => {
  assert.equal(GATE_ENGINE_SHADOW_FIXTURES.length, 12);

  for (const fixture of GATE_ENGINE_SHADOW_FIXTURES) {
    const result = evaluateGateEngineShadow(fixture.input);

    assert.equal(result.mode, GATE_ENGINE_SHADOW_MODE, fixture.fixtureId);
    assert.equal(result.chipId, GATE_ENGINE_SHADOW_CHIP_ID, fixture.fixtureId);
    assert.equal(result.readinessState, fixture.expectedReadinessState, fixture.fixtureId);
    assert.equal(result.resolved, fixture.expectedResolved, fixture.fixtureId);
    assert.equal(result.resolvedEntity?.entityKind ?? fixture.expectedEntityKind, fixture.expectedEntityKind);
    assert.deepEqual(result.gapFlags, fixture.expectedGapFlags, fixture.fixtureId);
    assertSafetyFlags(result);
    assertBlockedActions(result);
    assertDocumentarySatisfaction(result);
    assert.equal(GATE_ENGINE_PROTECTED_METADATA.noCableado.runtimeAuthority, false);
    assert.equal(GATE_ENGINE_PROTECTED_METADATA.noCableado.registryWrite, false);
    assert.equal(GATE_ENGINE_PROTECTED_METADATA.noCableado.productWiring, false);
    assert.equal(GATE_ENGINE_PROTECTED_METADATA.noCableado.eveBrainConnection, false);
  }
});

test("reports missing gate, missing rule and missing source proof", () => {
  const missingGate = evaluateGateEngineShadow(baseInput({ queryType: "resolve_gate", gateId: "SEM-999" }));
  assert.equal(missingGate.readinessState, "gate_engine_lookup_not_found");
  assert.equal(missingGate.resolved, false);
  assert.deepEqual(missingGate.missingReferences, ["SEM-999"]);
  assert.equal(missingGate.gapFlags.includes("gate_not_found"), true);

  const missingRule = evaluateGateEngineShadow(baseInput({ queryType: "resolve_rule", ruleId: "NO-RULE" }));
  assert.equal(missingRule.readinessState, "gate_engine_lookup_not_found");
  assert.equal(missingRule.resolved, false);
  assert.deepEqual(missingRule.missingReferences, ["NO-RULE"]);
  assert.equal(missingRule.gapFlags.includes("rule_not_found"), true);

  const missingProof = evaluateGateEngineShadow(
    baseInput({
      queryType: "validate_semantic_resolution_gate",
      gateId: "SEM-001",
      condition: "semantic condition",
      context: { sourceProofMissing: true },
    }),
  );
  assert.equal(missingProof.readinessState, "gate_condition_missing_source");
  assert.equal(missingProof.resolved, false);
  assert.equal(missingProof.gapFlags.includes("source_proof_missing"), true);
});

test("protects documentary satisfaction counters", () => {
  const result = evaluateGateEngineShadow(baseInput({ queryType: "validate_documentary_satisfaction" }));

  assert.equal(result.readinessState, "documentary_satisfaction_confirmed");
  assertDocumentarySatisfaction(result);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsAccepted, 157);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsExpected, 157);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesAccepted, 130);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesExpected, 130);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.previousRejectedUniqueRulesRepaired, "16/16");
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.previousRejectedRecordsRepaired, "31/31");
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.mismatches, 0);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInChip, 0);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInSource, 0);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof, 0);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.overreachDetected, false);
  assert.equal(GATE_ENGINE_DOCUMENTARY_SATISFACTION.status, "satisfactory");
});

test("protects no-overreach D1, VSM1, AHE1, D3 and D4 boundaries", () => {
  const result = evaluateGateEngineShadow(baseInput({ queryType: "validate_no_overreach", sourceDocumentId: "D1,VSM1,AHE1" }));

  assert.equal(result.readinessState, "no_overreach_confirmed");
  assert.equal(result.resolved, true);
  assert.equal(GATE_ENGINE_NO_OVERREACH_GUARDS.d1NotSubstitutedByVsmOrAhe, true);
  assert.equal(GATE_ENGINE_NO_OVERREACH_GUARDS.vsm1NoClosedDiagnosis, true);
  assert.equal(GATE_ENGINE_NO_OVERREACH_GUARDS.ahe1NoClosedDiagnosis, true);
  assert.equal(GATE_ENGINE_NO_OVERREACH_GUARDS.d3NotPrimaryMethodologicalSource, true);
  assert.equal(GATE_ENGINE_NO_OVERREACH_GUARDS.d4NotPrimaryMethodologicalSource, true);
});

test("implementation files remain pure-domain and not wired", () => {
  const source = domainFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    /createClient/i,
    /supabase/i,
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

function baseInput(overrides: Partial<GateEngineEvaluationInput>): GateEngineEvaluationInput {
  return {
    mode: GATE_ENGINE_SHADOW_MODE,
    queryType: "resolve_gate",
    ...overrides,
  };
}

function assertSafetyFlags(result: GateEngineEvaluationResult) {
  assert.equal(result.safetyFlags.canBlockUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canModifyCatalog, false);
  assert.equal(result.safetyFlags.canTriggerRuntime, false);
  assert.equal(result.safetyFlags.canTriggerDiagnosis, false);
  assert.equal(result.safetyFlags.canTriggerExport, false);
  assert.equal(result.safetyFlags.canConnectEveBrain, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

function assertBlockedActions(result: GateEngineEvaluationResult) {
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
    assert.equal(GATE_ENGINE_BLOCKED_ACTIONS.includes(blockedAction), true, blockedAction);
  }
}

function assertDocumentarySatisfaction(result: GateEngineEvaluationResult) {
  assert.equal(result.documentarySatisfaction.status, "satisfactory");
  assert.equal(result.documentarySatisfaction.companionProofsAccepted, 157);
  assert.equal(result.documentarySatisfaction.companionProofsExpected, 157);
  assert.equal(result.documentarySatisfaction.atomicRulesAccepted, 130);
  assert.equal(result.documentarySatisfaction.atomicRulesExpected, 130);
  assert.equal(result.documentarySatisfaction.previousRejectedUniqueRulesRepaired, "16/16");
  assert.equal(result.documentarySatisfaction.previousRejectedRecordsRepaired, "31/31");
  assert.equal(result.documentarySatisfaction.mismatches, 0);
  assert.equal(result.documentarySatisfaction.missingInChip, 0);
  assert.equal(result.documentarySatisfaction.missingInSource, 0);
  assert.equal(result.documentarySatisfaction.pendingSourceProof, 0);
  assert.equal(result.documentarySatisfaction.overreachDetected, false);
}
