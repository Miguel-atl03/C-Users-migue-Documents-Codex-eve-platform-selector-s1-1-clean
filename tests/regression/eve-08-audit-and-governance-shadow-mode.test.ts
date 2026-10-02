import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AUDIT_GOVERNANCE_BLOCKED_ACTIONS,
  AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION,
  AUDIT_GOVERNANCE_PROTECTED_METADATA,
  AUDIT_GOVERNANCE_SHADOW_CHIP_ID,
  AUDIT_GOVERNANCE_SHADOW_FIXTURES,
  AUDIT_GOVERNANCE_SHADOW_MODE,
  evaluateAuditAndGovernanceShadow,
  type AuditAndGovernanceEvaluationInput,
  type AuditAndGovernanceEvaluationResult,
} from "../../src/domain/eve-audit-and-governance-shadow/index.ts";

const domainFiles = [
  "src/domain/eve-audit-and-governance-shadow/types.ts",
  "src/domain/eve-audit-and-governance-shadow/fixtures.ts",
  "src/domain/eve-audit-and-governance-shadow/audit-and-governance-shadow.ts",
  "src/domain/eve-audit-and-governance-shadow/index.ts",
];

test("pure import exposes audit and governance shadow evaluator without app runtime", () => {
  assert.equal(typeof evaluateAuditAndGovernanceShadow, "function");
  assert.equal(AUDIT_GOVERNANCE_SHADOW_MODE, "audit_and_governance_shadow");
  assert.equal(AUDIT_GOVERNANCE_SHADOW_CHIP_ID, "EVE-08-AUDIT-AND-GOVERNANCE");
});

test("runs the 18 approved audit and governance shadow fixtures", () => {
  assert.equal(AUDIT_GOVERNANCE_SHADOW_FIXTURES.length, 18);

  for (const fixture of AUDIT_GOVERNANCE_SHADOW_FIXTURES) {
    const result = evaluateAuditAndGovernanceShadow(fixture.input);

    assert.equal(result.mode, AUDIT_GOVERNANCE_SHADOW_MODE, fixture.fixtureId);
    assert.equal(result.chipId, AUDIT_GOVERNANCE_SHADOW_CHIP_ID, fixture.fixtureId);
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

test("reports missing target, alias, system state, governance source and source proof", () => {
  const missingTarget = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "resolve_audit_trail_state", targetUnitId: "missing-target" }));
  assert.equal(missingTarget.readinessState, "audit_lookup_not_found");
  assert.equal(missingTarget.resolved, false);

  const missingAlias = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "resolve_source_alias", aliasId: "missing-alias" }));
  assert.equal(missingAlias.readinessState, "source_alias_missing");
  assert.equal(missingAlias.resolved, false);

  const missingSystemState = evaluateAuditAndGovernanceShadow(
    baseInput({ queryType: "resolve_system_state_evidence", systemStateEvidenceId: "missing-system-state" }),
  );
  assert.equal(missingSystemState.readinessState, "system_state_evidence_missing");
  assert.equal(missingSystemState.resolved, false);

  const missingGovernanceSource = evaluateAuditAndGovernanceShadow(
    baseInput({ queryType: "resolve_governance_rule_state", ruleId: "GOV-RULE-SAMPLE", context: { missingSource: true } }),
  );
  assert.equal(missingGovernanceSource.readinessState, "governance_rule_missing_source");
  assert.equal(missingGovernanceSource.resolved, false);

  const missingSourceProof = evaluateAuditAndGovernanceShadow(
    baseInput({ queryType: "validate_source_proof_satisfaction", context: { sourceProofMissing: true } }),
  );
  assert.equal(missingSourceProof.readinessState, "source_proof_missing");
  assert.equal(missingSourceProof.resolved, false);
});

test("protects documentary satisfaction counters", () => {
  const result = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "validate_record_rule_source_qa" }));

  assertDocumentarySatisfaction(result);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.targetUnitsChecked, 250);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.targetUnitsExpected, 250);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.modulesChecked, 6);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.modulesExpected, 6);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.atomicRulesChecked, 200);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.atomicRulesExpected, 200);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.sourceToTargetRowsChecked, 288);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.sourceToTargetRowsExpected, 288);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.sourceProofRowsChecked, 244);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.sourceProofRowsExpected, 244);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.systemStateEvidenceRowsChecked, 24);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.systemStateEvidenceRowsExpected, 24);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.packageDeclaredMappingsChecked, 20);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.packageDeclaredMappingsExpected, 20);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.materialComparisonRowsChecked, 250);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.materialComparisonRowsExpected, 250);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.accepted, 250);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.rejected, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.pendingSourceProof, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.internalClaimUnverified, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.certificationClaimUnverified, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.d8ContextualGap, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.aliasesResolved, 50);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.aliasesExpected, 50);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.noCableadoViolation, 0);
  assert.equal(AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION.materialDifference, false);
});

test("protects circular certification boundary", () => {
  const normal = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "validate_no_circular_certification" }));
  assert.equal(normal.readinessState, "circular_certification_prevented");
  assert.equal(normal.resolved, true);

  const circular = evaluateAuditAndGovernanceShadow(
    baseInput({
      queryType: "validate_no_circular_certification",
      context: { acceptCertificationReportAsFinalProof: true },
    }),
  );
  assert.equal(circular.readinessState, "circular_certification_detected");
  assert.equal(circular.resolved, false);
});

test("protects D8 contextual boundary", () => {
  const normal = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "validate_d8_contextual_resolution" }));
  assert.equal(normal.readinessState, "d8_contextual_resolved");
  assert.equal(normal.resolved, true);

  const overreach = evaluateAuditAndGovernanceShadow(
    baseInput({
      queryType: "validate_d8_contextual_resolution",
      context: { d8UsedAsDirectProof: true },
    }),
  );
  assert.equal(overreach.readinessState, "d8_contextual_unresolved");
  assert.equal(overreach.resolved, false);
});

test("protects brain connection preconditions", () => {
  const blocked = evaluateAuditAndGovernanceShadow(baseInput({ queryType: "validate_brain_connection_preconditions" }));
  assert.equal(blocked.readinessState, "brain_connection_preconditions_blocked");
  assert.equal(blocked.brainConnectionPreconditions.brainConnectionPreconditionsMet, false);

  const ready = evaluateAuditAndGovernanceShadow(
    baseInput({
      queryType: "validate_brain_connection_preconditions",
      context: {
        explicitBrainWiringAuthorization: true,
        registryWriteContractReady: true,
        rollbackPlanReady: true,
        noCableadoReleaseGateReady: true,
        humanApprovalReady: true,
      },
    }),
  );
  assert.equal(ready.readinessState, "brain_connection_preconditions_met");
  assert.equal(ready.brainConnectionPreconditions.brainConnectionPreconditionsMet, true);
  assert.equal(ready.safetyFlags.canConnectEveBrain, false);
  assert.equal(ready.blockedActions.includes("connect_eve_brain"), true);
});

test("implementation files remain pure-domain and not wired", () => {
  const source = domainFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    /createClient/i,
    /@supabase/i,
    /\bsupabase\./i,
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

  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.runtimeAuthority, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.registryWrite, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.productWiring, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.eveBrainConnection, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.finalExportEnabled, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.parallelProductionEnabled, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.diagnosisEnabled, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.sqlEnabled, false);
  assert.equal(AUDIT_GOVERNANCE_PROTECTED_METADATA.noCableado.supabaseWrite, false);
});

function baseInput(overrides: Partial<AuditAndGovernanceEvaluationInput>): AuditAndGovernanceEvaluationInput {
  return {
    mode: AUDIT_GOVERNANCE_SHADOW_MODE,
    queryType: "resolve_audit_trail_state",
    ...overrides,
  };
}

function assertSafetyFlags(result: AuditAndGovernanceEvaluationResult) {
  assert.equal(result.safetyFlags.canBlockProductiveUserFlow, false);
  assert.equal(result.safetyFlags.canModifyGovernanceState, false);
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

function assertBlockedActions(result: AuditAndGovernanceEvaluationResult) {
  for (const blockedAction of [
    "block_productive_user_flow",
    "modify_governance_state",
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
  ]) {
    assert.equal(result.blockedActions.includes(blockedAction), true, blockedAction);
    assert.equal(AUDIT_GOVERNANCE_BLOCKED_ACTIONS.includes(blockedAction), true, blockedAction);
  }
}

function assertDocumentarySatisfaction(result: AuditAndGovernanceEvaluationResult) {
  assert.equal(result.documentarySatisfaction.status, "satisfactory");
  assert.equal(result.documentarySatisfaction.targetUnitsChecked, 250);
  assert.equal(result.documentarySatisfaction.targetUnitsExpected, 250);
  assert.equal(result.documentarySatisfaction.modulesChecked, 6);
  assert.equal(result.documentarySatisfaction.modulesExpected, 6);
  assert.equal(result.documentarySatisfaction.atomicRulesChecked, 200);
  assert.equal(result.documentarySatisfaction.atomicRulesExpected, 200);
  assert.equal(result.documentarySatisfaction.sourceToTargetRowsChecked, 288);
  assert.equal(result.documentarySatisfaction.sourceToTargetRowsExpected, 288);
  assert.equal(result.documentarySatisfaction.sourceProofRowsChecked, 244);
  assert.equal(result.documentarySatisfaction.sourceProofRowsExpected, 244);
  assert.equal(result.documentarySatisfaction.systemStateEvidenceRowsChecked, 24);
  assert.equal(result.documentarySatisfaction.systemStateEvidenceRowsExpected, 24);
  assert.equal(result.documentarySatisfaction.packageDeclaredMappingsChecked, 20);
  assert.equal(result.documentarySatisfaction.packageDeclaredMappingsExpected, 20);
  assert.equal(result.documentarySatisfaction.materialComparisonRowsChecked, 250);
  assert.equal(result.documentarySatisfaction.materialComparisonRowsExpected, 250);
  assert.equal(result.documentarySatisfaction.accepted, 250);
  assert.equal(result.documentarySatisfaction.rejected, 0);
  assert.equal(result.documentarySatisfaction.pendingSourceProof, 0);
  assert.equal(result.documentarySatisfaction.pendingLocatorPrecision, 0);
  assert.equal(result.documentarySatisfaction.internalClaimUnverified, 0);
  assert.equal(result.documentarySatisfaction.certificationClaimUnverified, 0);
  assert.equal(result.documentarySatisfaction.d8ContextualGap, 0);
  assert.equal(result.documentarySatisfaction.aliasesResolved, 50);
  assert.equal(result.documentarySatisfaction.aliasesExpected, 50);
  assert.equal(result.documentarySatisfaction.noCableadoViolation, 0);
  assert.equal(result.documentarySatisfaction.materialDifference, false);
}
