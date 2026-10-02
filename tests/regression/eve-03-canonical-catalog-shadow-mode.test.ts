import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CANONICAL_CATALOG_SHADOW_CHIP_ID,
  CANONICAL_CATALOG_SHADOW_MODE,
  evaluateCanonicalCatalogShadow,
  type CanonicalCatalogEvaluationInput,
  type CanonicalCatalogEvaluationResult,
  type CanonicalCatalogReadinessState,
} from "../../src/domain/eve-03-canonical-catalog-shadow.ts";
import {
  evaluateCanonicalCatalogShadowFromRepo,
  loadCanonicalCatalogShadowSnapshot,
} from "../../src/services/eve-03-canonical-catalog-shadow-service.ts";

const domainPath = "src/domain/eve-03-canonical-catalog-shadow.ts";
const servicePath = "src/services/eve-03-canonical-catalog-shadow-service.ts";

function baseInput(overrides: Partial<CanonicalCatalogEvaluationInput>): CanonicalCatalogEvaluationInput {
  return {
    mode: CANONICAL_CATALOG_SHADOW_MODE,
    queryType: "resolve_node",
    ...overrides,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertAllSafetyFlagsFalse(result: CanonicalCatalogEvaluationResult) {
  assert.equal(result.safetyFlags.canBlockUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canModifyCatalog, false);
  assert.equal(result.safetyFlags.canTriggerRuntime, false);
  assert.equal(result.safetyFlags.canTriggerDiagnosis, false);
  assert.equal(result.safetyFlags.canTriggerExport, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

function assertCommonResult(
  result: CanonicalCatalogEvaluationResult,
  expectedReadinessState: CanonicalCatalogReadinessState,
  expectedResolved: boolean,
) {
  assert.equal(result.mode, "canonical_catalog_shadow");
  assert.equal(result.chipId, "EVE-03-CANONICAL-CATALOG");
  assert.equal(result.readinessState, expectedReadinessState);
  assert.equal(result.resolved, expectedResolved);
  assertAllSafetyFlagsFalse(result);
  assert.ok(Array.isArray(result.auditEvents));
  assert.ok(result.auditEvents.length > 0);
  assert.ok(Array.isArray(result.findings));
  assert.ok(result.findings.length > 0);
  assert.ok(result.sourceTrace);
  assert.equal(result.sourceTrace.chipId, CANONICAL_CATALOG_SHADOW_CHIP_ID);
  assert.equal(result.allowedActions.includes("read_catalog"), true);
  assert.equal(result.allowedActions.includes("return_shadow_trace"), true);
  assert.equal(result.blockedActions.includes("write_registry"), true);
  assert.equal(result.blockedActions.includes("modify_catalog"), true);
}

test("loads real canonical catalog snapshot from repo", () => {
  const snapshot = loadCanonicalCatalogShadowSnapshot();

  assert.equal(Object.keys(snapshot.sourceNodes).length >= 164, true);
  assert.equal(Object.keys(snapshot.sourceCodes).length >= 164, true);
  assert.equal(Object.keys(snapshot.canonicalVariables).length >= 257, true);
  assert.equal(snapshot.nodeVariableMap.length, 213);
  assert.equal(Object.keys(snapshot.criticalRoutes).length, 4);
  assert.equal(snapshot.referencedCanonicalVariablesNotDefined.length, 33);
});

test("runs the 11 approved shadow fixtures against real catalog ids", () => {
  const snapshot = loadCanonicalCatalogShadowSnapshot();
  const node = Object.values(snapshot.sourceNodes)[0];
  const sourceCode = Object.values(snapshot.sourceCodes)[0];
  const variable = Object.values(snapshot.canonicalVariables)[0];
  const validMap = snapshot.nodeVariableMap.find(
    (mapping) =>
      snapshot.sourceNodes[String(mapping.capture_node_id)] != null &&
      snapshot.canonicalVariables[String(mapping.canonical_variable_id)] != null,
  );
  const criticalRoute = Object.values(snapshot.criticalRoutes)[0];
  const sourceDocument = Object.values(snapshot.sourceDocuments)[0];
  const sourceTarget = Object.values(snapshot.sourceTargetMap)[0];
  const vsmGuard = Object.values(snapshot.vsmPrepGuard)[0];

  assert.ok(node);
  assert.ok(sourceCode);
  assert.ok(variable);
  assert.ok(validMap);
  assert.ok(criticalRoute);
  assert.ok(sourceDocument);
  assert.ok(sourceTarget);
  assert.ok(vsmGuard);

  const fixtures: Array<{
    fixtureId: string;
    input: CanonicalCatalogEvaluationInput;
    expectedReadinessState: CanonicalCatalogReadinessState;
    expectedResolved: boolean;
    expectedGapFlag?: string;
  }> = [
    {
      fixtureId: "resolve_existing_node",
      input: baseInput({ queryType: "resolve_node", nodeId: String(node.source_node_ref_id) }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "resolve_missing_node",
      input: baseInput({ queryType: "resolve_node", nodeId: "B9_missing_node" }),
      expectedReadinessState: "catalog_lookup_not_found",
      expectedResolved: false,
    },
    {
      fixtureId: "resolve_existing_canonical_variable",
      input: baseInput({
        queryType: "resolve_canonical_variable",
        variableId: String(variable.canonical_variable_id),
      }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "referenced_canonical_variable_not_defined",
      input: baseInput({
        queryType: "resolve_canonical_variable",
        variableId: snapshot.referencedCanonicalVariablesNotDefined[0],
      }),
      expectedReadinessState: "catalog_gap_detected",
      expectedResolved: false,
      expectedGapFlag: "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED",
    },
    {
      fixtureId: "validate_node_variable_map_valid",
      input: baseInput({
        queryType: "validate_node_variable_map",
        nodeId: String(validMap.capture_node_id),
        variableId: String(validMap.canonical_variable_id),
      }),
      expectedReadinessState: "catalog_reference_valid",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_node_variable_map_missing_variable",
      input: baseInput({
        queryType: "validate_node_variable_map",
        nodeId: String(validMap.capture_node_id),
        variableId: "CV::missing_variable",
      }),
      expectedReadinessState: "catalog_reference_missing",
      expectedResolved: false,
    },
    {
      fixtureId: "validate_existing_critical_route",
      input: baseInput({
        queryType: "validate_critical_route",
        routeId: String(criticalRoute.critical_route_id),
      }),
      expectedReadinessState: "critical_route_found",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_missing_critical_route",
      input: baseInput({ queryType: "validate_critical_route", routeId: "CR-MISSING" }),
      expectedReadinessState: "critical_route_missing",
      expectedResolved: false,
    },
    {
      fixtureId: "epistemic_policy_allows_confirmed_evidence",
      input: baseInput({
        queryType: "validate_epistemic_policy",
        policyId: "confirmed_evidence_allowed",
        evidenceRefs: ["D8"],
        context: { evidenceStatus: "confirmed" },
      }),
      expectedReadinessState: "epistemic_policy_allows",
      expectedResolved: true,
    },
    {
      fixtureId: "epistemic_policy_blocks_unconfirmed_ai_as_hard_evidence",
      input: baseInput({
        queryType: "validate_epistemic_policy",
        policyId: "unconfirmed_ai_hard_evidence",
        context: { evidenceStatus: "unconfirmed_ai", hardEvidenceRequested: true },
      }),
      expectedReadinessState: "epistemic_policy_blocks",
      expectedResolved: false,
      expectedGapFlag: "INFERENCE_FORBIDDEN_BY_EPISTEMIC_POLICY",
    },
    {
      fixtureId: "vsm_guard_lookup",
      input: baseInput({
        queryType: "validate_vsm_guard",
        guardId: String(vsmGuard.vsm_rule_id ?? vsmGuard.code),
      }),
      expectedReadinessState: "catalog_lookup_ready",
      expectedResolved: true,
    },
  ];

  for (const fixture of fixtures) {
    const before = clone(snapshot);
    const result = evaluateCanonicalCatalogShadow(fixture.input, snapshot);

    assertCommonResult(result, fixture.expectedReadinessState, fixture.expectedResolved);
    if (fixture.expectedGapFlag) {
      assert.equal(result.gapFlags.includes(fixture.expectedGapFlag as never), true, fixture.fixtureId);
    }
    assert.deepEqual(snapshot, before, `${fixture.fixtureId} must not mutate the snapshot`);
  }
});

test("service evaluates from repo without import-time side effects", () => {
  const snapshot = loadCanonicalCatalogShadowSnapshot();
  const node = Object.values(snapshot.sourceNodes)[0];
  const result = evaluateCanonicalCatalogShadowFromRepo(
    baseInput({ queryType: "resolve_node", nodeId: String(node.source_node_ref_id) }),
  );

  assertCommonResult(result, "catalog_lookup_ready", true);
});

test("detect_catalog_gap reports the accepted 33 variable gap", () => {
  const result = evaluateCanonicalCatalogShadowFromRepo(baseInput({ queryType: "detect_catalog_gap" }));

  assertCommonResult(result, "catalog_gap_detected", false);
  assert.equal(result.gapFlags.includes("CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED"), true);
  assert.equal((result.resolvedEntity as { count: number }).count, 33);
});

test("implementation is not wired to UI, Runtime, WorkMap, Significado or registry writing", () => {
  const combinedSource = [readFileSync(domainPath, "utf8"), readFileSync(servicePath, "utf8")].join("\n");

  for (const forbiddenPattern of [
    /from\s+["']next/i,
    /from\s+["']react/i,
    /supabase/i,
    /runtime-block0|runtime-engine/i,
    /from\s+["'].*WorkMap|WorkMapIntake/i,
    /from\s+["'].*Significado|significado/i,
    /fetch\s*\(/i,
    /page\.tsx/i,
    /src\/app/i,
    /runtimeAuthority\s*:\s*true/i,
    /registry\s*\.\s*(write|set|push|register)/i,
  ]) {
    assert.doesNotMatch(combinedSource, forbiddenPattern);
  }
});
