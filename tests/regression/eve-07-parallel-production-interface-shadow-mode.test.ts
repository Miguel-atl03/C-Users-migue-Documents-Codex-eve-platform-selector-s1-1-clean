import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateParallelProductionInterfaceShadow,
  PPI_BLOCKED_ACTIONS,
  PPI_DOCUMENTARY_SATISFACTION,
  PPI_PROTECTED_METADATA,
  PPI_SHADOW_CHIP_ID,
  PPI_SHADOW_FIXTURES,
  PPI_SHADOW_MODE,
  type ParallelProductionInterfaceEvaluationInput,
  type ParallelProductionInterfaceEvaluationResult,
} from "../../src/domain/eve-parallel-production-interface-shadow/index.ts";

const domainFiles = [
  "src/domain/eve-parallel-production-interface-shadow/types.ts",
  "src/domain/eve-parallel-production-interface-shadow/fixtures.ts",
  "src/domain/eve-parallel-production-interface-shadow/parallel-production-interface-shadow.ts",
  "src/domain/eve-parallel-production-interface-shadow/index.ts",
];

test("pure import exposes PPI shadow evaluator without app runtime", () => {
  assert.equal(typeof evaluateParallelProductionInterfaceShadow, "function");
  assert.equal(PPI_SHADOW_MODE, "parallel_production_interface_shadow");
  assert.equal(PPI_SHADOW_CHIP_ID, "EVE-07-PARALLEL-PRODUCTION-INTERFACE");
});

test("runs the 16 approved PPI shadow fixtures", () => {
  assert.equal(PPI_SHADOW_FIXTURES.length, 16);

  for (const fixture of PPI_SHADOW_FIXTURES) {
    const result = evaluateParallelProductionInterfaceShadow(fixture.input);

    assert.equal(result.mode, PPI_SHADOW_MODE, fixture.fixtureId);
    assert.equal(result.chipId, PPI_SHADOW_CHIP_ID, fixture.fixtureId);
    assert.equal(result.readinessState, fixture.expectedReadinessState, fixture.fixtureId);
    assert.equal(result.resolved, fixture.expectedResolved, fixture.fixtureId);
    assert.equal(result.resolvedEntity?.entityKind ?? fixture.expectedEntityKind, fixture.expectedEntityKind, fixture.fixtureId);
    assert.deepEqual(result.gapFlags, fixture.expectedGapFlags, fixture.fixtureId);
    assertSafetyFlags(result);
    assertBlockedActions(result);
    assertDocumentarySatisfaction(result);
    for (const blockedAction of fixture.expectedBlockedActions) {
      assert.equal(result.blockedActions.includes(blockedAction), true, `${fixture.fixtureId}:${blockedAction}`);
    }
  }
});

test("reports missing payload, source proof and evidence trace", () => {
  const missingPayload = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "resolve_scr_payload",
      payloadId: "missing-payload",
    }),
  );
  assert.equal(missingPayload.readinessState, "ppi_lookup_not_found");
  assert.equal(missingPayload.resolved, false);
  assert.deepEqual(missingPayload.missingReferences, ["missing-payload"]);
  assert.equal(missingPayload.gapFlags.includes("PPI_LOOKUP_NOT_FOUND"), true);

  const missingSourceProof = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "validate_source_proof",
      ruleId: "UNKNOWN-RULE",
      sourceTrace: [],
      evidenceRefs: [],
    }),
  );
  assert.equal(missingSourceProof.readinessState, "source_proof_missing");
  assert.equal(missingSourceProof.resolved, false);
  assert.equal(missingSourceProof.gapFlags.includes("SOURCE_PROOF_MISSING"), true);

  const missingEvidenceTrace = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "detect_parallel_production_interface_gap",
      payloadType: "scr_payload",
      context: { evidenceMissing: true },
    }),
  );
  assert.equal(missingEvidenceTrace.readinessState, "ppi_gap_detected");
  assert.equal(missingEvidenceTrace.resolved, false);
  assert.equal(missingEvidenceTrace.gapFlags.includes("EVIDENCE_TRACE_MISSING"), true);
});

test("protects documentary satisfaction counters", () => {
  const result = evaluateParallelProductionInterfaceShadow(baseInput({ queryType: "validate_documentary_satisfaction" }));

  assert.equal(result.readinessState, "documentary_satisfaction_confirmed");
  assertDocumentarySatisfaction(result);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.sourceProofMatrixRowsChecked, 154);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.sourceProofMatrixRowsExpected, 154);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsChecked, 26);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsExpected, 26);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.exbBlockersChecked, 34);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.exbBlockersExpected, 34);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.exb031Checked, true);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.exportBlockerVectorsChecked, 6);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.exportBlockerVectorsExpected, 6);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.certificationClaimsChecked, 16);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.certificationClaimsExpected, 16);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.qaRows, 258);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.accepted, 258);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.rejected, 0);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.pendingSourceProof, 0);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision, 0);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.certificationClaimUnverified, 0);
  assert.equal(PPI_DOCUMENTARY_SATISFACTION.materialDifference, false);
});

test("protects EXB-031 override behavior", () => {
  const noOverride = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "validate_exb_031",
      blockerCode: "EXB-031",
      context: { overrideRequested: false },
    }),
  );
  assert.equal(noOverride.readinessState, "exb_031_valid");
  assert.equal(noOverride.blockerEvaluation.blocked, false);

  const unauditedOverride = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "validate_exb_031",
      blockerCode: "EXB-031",
      context: { overrideRequested: true, overrideAudited: false },
    }),
  );
  assert.equal(unauditedOverride.readinessState, "exb_031_violation_detected");
  assert.equal(unauditedOverride.blockerEvaluation.blocked, true);

  const auditedOverride = evaluateParallelProductionInterfaceShadow(
    baseInput({
      queryType: "validate_exb_031",
      blockerCode: "EXB-031",
      context: { overrideRequested: true, overrideAudited: true },
    }),
  );
  assert.equal(auditedOverride.readinessState, "exb_031_valid");
  assert.equal(auditedOverride.blockerEvaluation.blocked, false);
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
    /canTriggerExport:\s*true/i,
    /canTriggerParallelProduction:\s*true/i,
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

  assert.equal(PPI_PROTECTED_METADATA.noCableado.runtimeAuthority, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.registryWrite, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.productWiring, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.eveBrainConnection, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.finalExportEnabled, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.parallelProductionEnabled, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.diagnosisEnabled, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.sqlEnabled, false);
  assert.equal(PPI_PROTECTED_METADATA.noCableado.supabaseWrite, false);
});

function baseInput(overrides: Partial<ParallelProductionInterfaceEvaluationInput>): ParallelProductionInterfaceEvaluationInput {
  return {
    mode: PPI_SHADOW_MODE,
    queryType: "resolve_scr_payload",
    ...overrides,
  };
}

function assertSafetyFlags(result: ParallelProductionInterfaceEvaluationResult) {
  assert.equal(result.safetyFlags.canBlockProductiveUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canTriggerExport, false);
  assert.equal(result.safetyFlags.canTriggerParallelProduction, false);
  assert.equal(result.safetyFlags.canTriggerRuntime, false);
  assert.equal(result.safetyFlags.canTriggerDiagnosis, false);
  assert.equal(result.safetyFlags.canExecuteSql, false);
  assert.equal(result.safetyFlags.canWriteSupabase, false);
  assert.equal(result.safetyFlags.canConnectEveBrain, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

function assertBlockedActions(result: ParallelProductionInterfaceEvaluationResult) {
  const expectedBlockedActions: Array<(typeof PPI_BLOCKED_ACTIONS)[number]> = [
    "block_productive_user_flow",
    "modify_payload",
    "write_registry",
    "trigger_export",
    "trigger_parallel_production",
    "trigger_runtime",
    "trigger_diagnosis",
    "execute_sql",
    "write_supabase",
    "connect_eve_brain",
    "mutate_workmap",
    "mutate_significado",
    "create_api",
  ];

  for (const blockedAction of expectedBlockedActions) {
    assert.equal(result.blockedActions.includes(blockedAction), true, blockedAction);
    assert.equal(PPI_BLOCKED_ACTIONS.includes(blockedAction), true, blockedAction);
  }
}

function assertDocumentarySatisfaction(result: ParallelProductionInterfaceEvaluationResult) {
  assert.equal(result.documentarySatisfaction.status, "satisfactory");
  assert.equal(result.documentarySatisfaction.sourceProofMatrixRowsChecked, 154);
  assert.equal(result.documentarySatisfaction.sourceProofMatrixRowsExpected, 154);
  assert.equal(result.documentarySatisfaction.sourceToTargetMappingsChecked, 26);
  assert.equal(result.documentarySatisfaction.sourceToTargetMappingsExpected, 26);
  assert.equal(result.documentarySatisfaction.exbBlockersChecked, 34);
  assert.equal(result.documentarySatisfaction.exbBlockersExpected, 34);
  assert.equal(result.documentarySatisfaction.exb031Checked, true);
  assert.equal(result.documentarySatisfaction.exportBlockerVectorsChecked, 6);
  assert.equal(result.documentarySatisfaction.exportBlockerVectorsExpected, 6);
  assert.equal(result.documentarySatisfaction.certificationClaimsChecked, 16);
  assert.equal(result.documentarySatisfaction.certificationClaimsExpected, 16);
  assert.equal(result.documentarySatisfaction.qaRows, 258);
  assert.equal(result.documentarySatisfaction.accepted, 258);
  assert.equal(result.documentarySatisfaction.rejected, 0);
  assert.equal(result.documentarySatisfaction.pendingSourceProof, 0);
  assert.equal(result.documentarySatisfaction.pendingLocatorPrecision, 0);
  assert.equal(result.documentarySatisfaction.certificationClaimUnverified, 0);
  assert.equal(result.documentarySatisfaction.materialDifference, false);
}
