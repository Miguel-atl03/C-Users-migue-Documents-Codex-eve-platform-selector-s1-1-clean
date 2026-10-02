import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  evaluateRuntimeCatalogShadow,
  RUNTIME_CATALOG_SHADOW_CHIP_ID,
  RUNTIME_CATALOG_SHADOW_MODE,
  type RuntimeCatalogEvaluationInput,
  type RuntimeCatalogEvaluationResult,
  type RuntimeCatalogReadinessState,
  type RuntimeCatalogShadowSnapshot,
} from "../../src/domain/eve-04-runtime-catalog-shadow.ts";
import {
  evaluateRuntimeCatalogShadowFromRepo,
  loadRuntimeCatalogShadowSnapshot,
} from "../../src/services/eve-04-runtime-catalog-shadow-service.ts";

const projectRoot = process.cwd();
const domainPath = "src/domain/eve-04-runtime-catalog-shadow.ts";
const servicePath = "src/services/eve-04-runtime-catalog-shadow-service.ts";

type Fixture = {
  fixtureId: string;
  input: RuntimeCatalogEvaluationInput;
  expectedReadinessState: RuntimeCatalogReadinessState;
  expectedResolved: boolean;
};

test("loads real runtime catalog shadow snapshot from repo", () => {
  const snapshot = loadRuntimeCatalogShadowSnapshot({ repoRoot: projectRoot });

  assert.equal(snapshot.chipId, RUNTIME_CATALOG_SHADOW_CHIP_ID);
  assert.equal(snapshot.runtimeInteractionsBase40.length, 40);
  assert.equal(snapshot.runtimeInteractionsCausal20.length, 20);
  assert.equal(snapshot.uxSubfieldStructure.length, 17);
  assert.equal(snapshot.branchingRules.length, 10);
  assert.equal(snapshot.branchingScores.length, 11);
  assert.equal(snapshot.readinessGapsReentry.length, 7);
  assert.equal(snapshot.documentarySatisfaction.status, "satisfactory");
  assert.equal(snapshot.documentarySatisfaction.mismatches, 0);
  assert.equal(snapshot.documentarySatisfaction.missingInChip, 0);
  assert.equal(snapshot.documentarySatisfaction.missingInSource, 0);
  assert.equal(snapshot.documentarySatisfaction.pendingSourceProof, 0);
  assert.equal(snapshot.documentarySatisfaction.protectedByStaticTests, true);
});

test("runs the 12 approved shadow fixtures against real runtime catalog data", () => {
  const snapshot = loadRuntimeCatalogShadowSnapshot({ repoRoot: projectRoot });
  const before = JSON.stringify(snapshot);
  const baseId = idFrom(first(snapshot.runtimeInteractionsBase40), "runtime_interaction_id");
  const causalId = idFrom(first(snapshot.runtimeInteractionsCausal20), "runtime_interaction_id");
  const uxId = idFrom(first(snapshot.uxSubfieldStructure), "runtime_interaction_id");
  const branchingRule = first(snapshot.branchingRules);
  const branchRuleId = idFrom(branchingRule, "Regla_ID");
  const readinessState = idFrom(first(snapshot.readinessGapsReentry), "readiness_state");
  const cvarDefinition = first(snapshot.cvar001Definitions);
  const cvarVariableId = idFrom(cvarDefinition, "variable");

  const fixtures: Fixture[] = [
    {
      fixtureId: "resolve_existing_base_interaction",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "resolve_base_interaction",
        runtimeInteractionId: baseId,
      },
      expectedReadinessState: "runtime_catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "resolve_missing_runtime_interaction",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "resolve_runtime_interaction",
        runtimeInteractionId: "MISSING-RUNTIME-ID",
      },
      expectedReadinessState: "runtime_catalog_lookup_not_found",
      expectedResolved: false,
    },
    {
      fixtureId: "resolve_existing_causal_interaction",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "resolve_causal_interaction",
        runtimeInteractionId: causalId,
      },
      expectedReadinessState: "runtime_catalog_lookup_ready",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_ux_subfield_structure_valid",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_ux_subfield_structure",
        runtimeInteractionId: uxId,
      },
      expectedReadinessState: "runtime_catalog_reference_valid",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_b6_q38_trench_phrase_ccov",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_ccov_001",
        runtimeInteractionId: "B6-Q38",
        sourceNodeId: "B6_6_8",
        sourceCode: "6.8",
      },
      expectedReadinessState: "documentary_satisfaction_confirmed",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_cvar_001_33_definitions",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_cvar_001",
        variableId: cvarVariableId,
      },
      expectedReadinessState: "documentary_satisfaction_confirmed",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_branching_rule_structural_evidence",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_branching_rule",
        branchRuleId,
        context: { hasStructuralEvidence: true },
      },
      expectedReadinessState: "branching_rule_allows",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_branching_rule_curiosity_blocked",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_branching_rule",
        branchRuleId,
        context: { curiosityOnly: true },
      },
      expectedReadinessState: "branching_rule_blocks",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_causal_budget_available",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_branching_score",
        context: { causalQuestionsUsed: 19, maxCausalQuestions: 20 },
      },
      expectedReadinessState: "causal_budget_available",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_causal_budget_exhausted",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_branching_score",
        context: { causalQuestionsUsed: 20, maxCausalQuestions: 20 },
      },
      expectedReadinessState: "causal_budget_exhausted",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_readiness_reentry_state",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_readiness_reentry",
        readinessState,
      },
      expectedReadinessState: "readiness_state_valid",
      expectedResolved: true,
    },
    {
      fixtureId: "validate_no_runtime_authority",
      input: {
        mode: RUNTIME_CATALOG_SHADOW_MODE,
        queryType: "validate_no_runtime_authority",
        requestedOutputType: "shadow_trace_only",
      },
      expectedReadinessState: "documentary_satisfaction_confirmed",
      expectedResolved: true,
    },
  ];

  for (const fixture of fixtures) {
    const result = evaluateRuntimeCatalogShadow(fixture.input, snapshot);
    assertFixtureResult(fixture, result);
  }

  assert.equal(JSON.stringify(snapshot), before);
});

test("repo service evaluates a real shadow query without import-time side effects", () => {
  const snapshot = loadRuntimeCatalogShadowSnapshot({ repoRoot: projectRoot });
  const baseId = idFrom(first(snapshot.runtimeInteractionsBase40), "runtime_interaction_id");
  const result = evaluateRuntimeCatalogShadowFromRepo(
    {
      mode: RUNTIME_CATALOG_SHADOW_MODE,
      queryType: "resolve_runtime_interaction",
      runtimeInteractionId: baseId,
    },
    { repoRoot: projectRoot },
  );

  assert.equal(result.readinessState, "runtime_catalog_lookup_ready");
  assert.equal(result.resolved, true);
  assert.equal(result.documentarySatisfaction.status, "satisfactory");
});

test("documentary satisfaction break blocks ready promotion", () => {
  const snapshot = cloneSnapshot(loadRuntimeCatalogShadowSnapshot({ repoRoot: projectRoot }));
  snapshot.documentarySatisfaction = {
    ...snapshot.documentarySatisfaction,
    status: "unsatisfactory",
    mismatches: 1,
  };

  const result = evaluateRuntimeCatalogShadow(
    {
      mode: RUNTIME_CATALOG_SHADOW_MODE,
      queryType: "resolve_base_interaction",
      runtimeInteractionId: idFrom(first(snapshot.runtimeInteractionsBase40), "runtime_interaction_id"),
    },
    snapshot,
  );

  assert.equal(result.readinessState, "documentary_satisfaction_broken");
  assert.equal(result.resolved, false);
  assert.deepEqual(result.gapFlags, ["DOCUMENTARY_SATISFACTION_BROKEN"]);
});

test("implementation remains pure-domain and not wired to product systems", () => {
  const domainSource = readFileSync(domainPath, "utf8");
  const serviceSource = readFileSync(servicePath, "utf8");

  assert.doesNotMatch(domainSource, /node:fs|from "fs"|from 'fs'/);
  assert.doesNotMatch(domainSource, /next\/|from "next|from 'next/i);
  assert.doesNotMatch(domainSource, /react|from "react|from 'react/i);
  assert.doesNotMatch(domainSource, /supabase/i);
  assert.doesNotMatch(domainSource, /from .*runtime-block|from .*work-map|from .*significado/i);

  assert.doesNotMatch(serviceSource, /runtimeAuthority:\s*true/);
  assert.doesNotMatch(serviceSource, /registry\s+write/i);
  assert.doesNotMatch(serviceSource, /\bfetch\s*\(|\/api\//i);
  assert.doesNotMatch(serviceSource, /page\.tsx/i);
  assert.doesNotMatch(serviceSource, /eveBrainConnection:\s*true/);
});

function assertFixtureResult(fixture: Fixture, result: RuntimeCatalogEvaluationResult) {
  assert.equal(result.mode, RUNTIME_CATALOG_SHADOW_MODE, fixture.fixtureId);
  assert.equal(result.chipId, RUNTIME_CATALOG_SHADOW_CHIP_ID, fixture.fixtureId);
  assert.equal(result.readinessState, fixture.expectedReadinessState, fixture.fixtureId);
  assert.equal(result.resolved, fixture.expectedResolved, fixture.fixtureId);
  assertSafetyFlags(result, fixture.fixtureId);
  assert.ok(result.auditEvents.length > 0, fixture.fixtureId);
  assert.ok(result.findings.length > 0, fixture.fixtureId);
  assert.ok(result.sourceTrace, fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.status, "satisfactory", fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.mismatches, 0, fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.missingInChip, 0, fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.missingInSource, 0, fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.pendingSourceProof, 0, fixture.fixtureId);
  assert.equal(result.documentarySatisfaction.protectedByStaticTests, true, fixture.fixtureId);
}

function assertSafetyFlags(result: RuntimeCatalogEvaluationResult, message: string) {
  assert.equal(result.safetyFlags.canBlockUserFlow, false, message);
  assert.equal(result.safetyFlags.canModifyPayload, false, message);
  assert.equal(result.safetyFlags.canWriteRegistry, false, message);
  assert.equal(result.safetyFlags.canModifyCatalog, false, message);
  assert.equal(result.safetyFlags.canTriggerRuntime, false, message);
  assert.equal(result.safetyFlags.canTriggerDiagnosis, false, message);
  assert.equal(result.safetyFlags.canTriggerExport, false, message);
  assert.equal(result.safetyFlags.canConnectEveBrain, false, message);
  assert.equal(result.safetyFlags.runtimeAuthority, false, message);
}

function first(records: Record<string, unknown>[]) {
  assert.ok(records.length > 0);
  return records[0];
}

function idFrom(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  assert.equal(typeof value, "string");
  if (typeof value !== "string") {
    throw new TypeError(`Expected string value for ${key}`);
  }
  assert.ok(value.length > 0);
  return value;
}

function cloneSnapshot(snapshot: RuntimeCatalogShadowSnapshot): RuntimeCatalogShadowSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as RuntimeCatalogShadowSnapshot;
}
