import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EVE_GATE2_EVIDENCE_FIELD_REGISTRY,
  EVE_GATE2_NO_GO_RULES,
  EVE_GATE2_RUNTIME_SIGNAL_CONTRACT_CONFIG,
  EVE_GATE2_TO_GATE3_PROMOTION_CHECKLIST,
  evaluateGate2NoGo,
  evaluateGate2ToGate3Promotion,
  evaluateGate2ToGate3Checklist,
  getGate2EvidenceFieldRequirements,
  getGate2EvidenceFieldRegistry,
  getGate2GuardrailAuthority,
  getGate2PromotionChecklistResult,
  getGate2RuntimeContractConfig,
  getGate2RuntimeSignalContract,
  runGate2NoGoEngine,
  runGate2SignalNoGoEngine,
  validateGate2SignalInput,
  validateGate2Signal,
} from "../../src/services/eve-organism-gate2-signal-guardrails.ts";
import type { EveGate2SignalCandidate } from "../../src/types/eve-organism-gate2-signal-guardrails.ts";

type Scenario = {
  id: string;
  run: () => void;
};

const scenarios: Scenario[] = [
  scenario("G2-001", () => assert.deepEqual(getGate2RuntimeContractConfig().allowedObservationModes, ["replay_only", "offline_fixture", "future_real_observable_candidate"])),
  scenario("G2-002", () => assert.deepEqual(getGate2RuntimeContractConfig().forbiddenObservationModes, ["production_observer_active", "mutating_observer", "diagnostic_observer", "autonomous_observer"])),
  scenario("G2-003", () => assert.equal(EVE_GATE2_RUNTIME_SIGNAL_CONTRACT_CONFIG.forbiddenAdmissibilityStatuses.includes("OBSERVER_READY"), true)),
  scenario("G2-004", () => assert.equal(EVE_GATE2_NO_GO_RULES.length, 25)),
  scenario("G2-005", () => assert.equal(EVE_GATE2_NO_GO_RULES.every((rule) => rule.canBeOverridden === false), true)),
  scenario("G2-006", () => assert.equal(EVE_GATE2_EVIDENCE_FIELD_REGISTRY.length, 41)),
  scenario("G2-007", () => assert.deepEqual([...new Set(EVE_GATE2_EVIDENCE_FIELD_REGISTRY.map((field) => field.priority))], ["P0", "P1", "P2", "P3", "P4", "P5"])),
  scenario("G2-008", () => assert.equal(EVE_GATE2_EVIDENCE_FIELD_REGISTRY.every((field) => field.currentStatus === "required_not_collected"), true)),
  scenario("G2-009", () => assert.equal(EVE_GATE2_TO_GATE3_PROMOTION_CHECKLIST.length, 15)),
  scenario("G2-010", () => assert.equal(EVE_GATE2_TO_GATE3_PROMOTION_CHECKLIST.every((item) => item.canPassNow === false), true)),
  scenario("G2-011", () => expectNoGo({ identity: { ...baseSignal().identity, tenantId: "" } }, "NG-001", "BLOCKED_MISSING_CONTEXT")),
  scenario("G2-012", () => expectNoGo({ identity: { ...baseSignal().identity, organizationId: "" } }, "NG-002", "BLOCKED_MISSING_CONTEXT")),
  scenario("G2-013", () => expectNoGo({ traceability: { ...baseSignal().traceability, provenance: "" } }, "NG-003", "BLOCKED_MISSING_TRACEABILITY")),
  scenario("G2-014", () => expectNoGo({ traceability: { ...baseSignal().traceability, sourceTrace: "" } }, "NG-004", "BLOCKED_MISSING_TRACEABILITY")),
  scenario("G2-015", () => expectNoGo({ mba_anchor: { ...baseSignal().mba_anchor, objectState: "" } }, "NG-005", "BLOCKED_MISSING_MBA_ANCHOR")),
  scenario("G2-016", () => expectNoGo({ mba_anchor: { ...baseSignal().mba_anchor, objectStateInOLC: false } }, "NG-006", "BLOCKED_MISSING_MBA_ANCHOR")),
  scenario("G2-017", () => expectNoGo({ mba_anchor: { ...baseSignal().mba_anchor, pfEvent: "" } }, "NG-007", "BLOCKED_MISSING_MBA_ANCHOR")),
  scenario("G2-018", () => expectNoGo({ traceability: { ...baseSignal().traceability, idempotencyKey: "" } }, "NG-008", "BLOCKED_MISSING_TRACEABILITY")),
  scenario("G2-019", () => expectNoGo({ traceability: { ...baseSignal().traceability, correlationId: "" } }, "NG-009", "BLOCKED_MISSING_TRACEABILITY")),
  scenario("G2-020", () => expectNoGo({ traceability: { ...baseSignal().traceability, officialFlowRef: "" } }, "NG-010", "BLOCKED_MISSING_TRACEABILITY")),
  scenario("G2-021", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, uiTouchAllowed: true } }, "NG-011", "BLOCKED_MUTATION_RISK")),
  scenario("G2-022", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, workMapMutationAllowed: true } }, "NG-012", "BLOCKED_MUTATION_RISK")),
  scenario("G2-023", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, significadoMutationAllowed: true } }, "NG-013", "BLOCKED_MUTATION_RISK")),
  scenario("G2-024", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, dbWriteAllowed: true } }, "NG-014", "BLOCKED_MUTATION_RISK")),
  scenario("G2-025", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, supabaseWriteAllowed: true } }, "NG-015", "BLOCKED_SECURITY_BOUNDARY")),
  scenario("G2-026", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, runtimeMutationAllowed: true } }, "NG-016", "BLOCKED_MUTATION_RISK")),
  scenario("G2-027", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, registryWriteAllowed: true } }, "NG-017", "BLOCKED_MUTATION_RISK")),
  scenario("G2-028", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, exportAllowed: true } }, "NG-017", "BLOCKED_MUTATION_RISK")),
  scenario("G2-029", () => expectNoGo({ no_mutation_boundary: { ...baseSignal().no_mutation_boundary, diagnosisAllowed: true } }, "NG-017", "BLOCKED_MUTATION_RISK")),
  scenario("G2-030", () => expectNoGo({ b3_b7_boundary: { ...baseSignal().b3_b7_boundary, receiverSatisfactionAllowedAsFeedback: true } }, "NG-018", "BLOCKED_B3_B7_VIOLATION")),
  scenario("G2-031", () => expectNoGo({ b3_b7_boundary: { ...baseSignal().b3_b7_boundary, receiverFeedbackPresent: true }, traceability: { ...baseSignal().traceability, routeRef: "" } }, "NG-019", "BLOCKED_B3_B7_VIOLATION")),
  scenario("G2-032", () => expectNoGo({ b3_b7_boundary: { ...baseSignal().b3_b7_boundary, b7DiagnosticUseAllowed: true } }, "NG-020", "BLOCKED_B3_B7_VIOLATION")),
  scenario("G2-033", () => expectNoGo({ b3_b7_boundary: { ...baseSignal().b3_b7_boundary, b7StructuralFactAllowed: true } }, "NG-021", "BLOCKED_B3_B7_VIOLATION")),
  scenario("G2-034", () => expectNoGo({ evidence: [{ proofType: "fixture", claimedAsRealEvidence: true }] }, "NG-022", "BLOCKED_FIXTURE_AS_REAL")),
  scenario("G2-035", () => expectNoGo({ evidence: [{ proofType: "synthetic_field", claimedAsRealEvidence: true }] }, "NG-023", "BLOCKED_FIXTURE_AS_REAL")),
  scenario("G2-036", () => expectNoGo({ evidence: [{ proofType: "replay_only_output", claimedAsRealEvidence: true }] }, "NG-024", "BLOCKED_FIXTURE_AS_REAL")),
  scenario("G2-037", () => expectNoGo({ observationMode: "production_observer_active" }, "NG-025", "BLOCKED_MUTATION_RISK")),
  scenario("G2-038", () => assert.deepEqual(runGate2NoGoEngine(baseSignal()), [])),
  scenario("G2-039", () => assert.deepEqual(validateGate2Signal(baseSignal()).statuses, ["PASS_REPLAY_ONLY"])),
  scenario("G2-040", () => assert.equal(validateGate2Signal(baseSignal()).accepted, true)),
  scenario("G2-041", () => assert.equal(validateGate2Signal({ ...baseSignal(), productOwnerEvidenceComplete: false }).statuses.includes("REQUIRES_PRODUCT_OWNER_EVIDENCE"), true)),
  scenario("G2-042", () => assert.equal(validateGate2Signal({ ...baseSignal(), observationMode: "future_real_observable_candidate", futureReadOnlyInventoryComplete: false }).statuses.includes("REQUIRES_FUTURE_READ_ONLY_INVENTORY"), true)),
  scenario("G2-043", () => assert.equal(validateGate2Signal(baseSignal()).gate3Ready, false)),
  scenario("G2-044", () => assert.equal(validateGate2Signal(baseSignal()).observerAuthorized, false)),
  scenario("G2-045", () => assert.equal(validateGate2Signal(baseSignal()).realObservationAuthorized, false)),
  scenario("G2-046", () => assert.equal(validateGate2Signal(baseSignal()).readOnlyObserverDesignAuthorized, false)),
  scenario("G2-047", () => assert.equal(validateGate2Signal(baseSignal()).registryExportAllowed, false)),
  scenario("G2-048", () => assert.equal(validateGate2Signal(baseSignal()).diagnosisEnabled, false)),
  scenario("G2-049", () => assert.equal(evaluateGate2ToGate3Promotion().gate3Ready, false)),
  scenario("G2-050", () => assert.equal(evaluateGate2ToGate3Promotion().gate3Result, "NOT_READY_FOR_GATE3")),
  scenario("G2-051", () => assert.equal(evaluateGate2ToGate3Promotion().blockersClosed, 0)),
  scenario("G2-052", () => assert.equal(evaluateGate2ToGate3Promotion().exitConditionsClosed, 0)),
  scenario("G2-053", () => assert.equal(getGate2EvidenceFieldRegistry().filter((field) => field.rejectedProofTypes.includes("fixture")).length, 41)),
  scenario("G2-054", () => assert.equal(getGate2EvidenceFieldRegistry().filter((field) => field.whyNotFixtureRequired).length, 41)),
  scenario("G2-055", () => assert.equal(validateGate2Signal({ ...baseSignal(), observationMode: "offline_fixture" }).accepted, true)),
  scenario("G2-056", () => assert.equal(validateGate2Signal({ ...baseSignal(), observationMode: "replay_only" }).replayOnlyContinues, true)),
  scenario("G2-057", () => assert.deepEqual(getGate2RuntimeSignalContract(), getGate2RuntimeContractConfig())),
  scenario("G2-058", () => assert.deepEqual(validateGate2SignalInput(baseSignal()), validateGate2Signal(baseSignal()))),
  scenario("G2-059", () => assert.deepEqual(runGate2SignalNoGoEngine(baseSignal()), runGate2NoGoEngine(baseSignal()))),
  scenario("G2-060", () => assert.deepEqual(getGate2EvidenceFieldRequirements(), getGate2EvidenceFieldRegistry())),
  scenario("G2-061", () => assert.deepEqual(getGate2PromotionChecklistResult(), evaluateGate2ToGate3Promotion())),
  scenario("G2-062", () => assert.deepEqual(getGate2GuardrailAuthority(), {
    replayOnlyContinues: true,
    observerAuthorized: false,
    realObservationAuthorized: false,
    readOnlyObserverDesignAuthorized: false,
    registryExportAllowed: false,
    diagnosisEnabled: false,
    gate3Ready: false,
  })),
  scenario("G2-063", () => assert.equal(ruleById("NG-025")?.checkedContractField, "identity.observationMode")),
  scenario("G2-064", () => assert.equal(ruleById("NG-025")?.severity, "critical")),
  scenario("G2-065", () => assert.equal(ruleById("NG-025")?.canBeOverridden, false)),
  scenario("G2-066", () => assert.equal(ruleById("NG-025")?.affectedBlocker, "ROB-001")),
  scenario("G2-067", () => {
    assert.equal(ruleById("NG-025")?.name, "forbidden_observation_mode");
    assert.equal(ruleById("NG-025")?.resultCode, "BLOCKED_MUTATION_RISK");
    assert.equal(ruleById("NG-015")?.name === "forbidden_observation_mode", false);
    assert.equal(EVE_GATE2_NO_GO_RULES.some((rule) => rule.noGoId === "NG-000" as never), false);
  }),
  scenario("G2-068", () => assert.deepEqual(evaluateGate2NoGo(baseSignal()), runGate2NoGoEngine(baseSignal()))),
  scenario("G2-069", () => assert.deepEqual(evaluateGate2ToGate3Checklist(), evaluateGate2ToGate3Promotion())),
];

test("EVE Gate 2 signal guardrails execute 69 offline controlled scenarios", () => {
  assert.equal(scenarios.length, 69);
});

for (const item of scenarios) {
  test(`${item.id}: offline guardrail invariant`, item.run);
}

test("offline implementation has no forbidden productive dependencies", () => {
  const source = [
    "src/types/eve-organism-gate2-signal-guardrails.ts",
    "src/services/eve-organism-gate2-signal-guardrails.ts",
    "tests/regression/eve-organism-gate2-signal-guardrails.test.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    new RegExp("@supa" + "base", "i"),
    new RegExp("\\bcreate" + "Client\\b", "i"),
    /\bfetch\(/i,
    /\bprocess\.env\b/i,
    /\bDate\.now\b/i,
    /\bMath\.random\b/i,
    new RegExp("from\\s+['\"][^'\"]*src/" + "app", "i"),
    new RegExp("from\\s+['\"][^'\"]*ap" + "p/", "i"),
    new RegExp("from\\s+['\"][^'\"]*compo" + "nents/", "i"),
    new RegExp("from\\s+['\"][^'\"]*pag" + "es/", "i"),
    /observerAuthorized:\s*true/i,
    /realObservationAuthorized:\s*true/i,
    /readOnlyObserverDesignAuthorized:\s*true/i,
    /registryExportAllowed:\s*true/i,
    /diagnosisEnabled:\s*true/i,
    /gate3Ready:\s*true/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

function scenario(id: string, run: () => void): Scenario {
  return { id, run };
}

function expectNoGo(
  overrides: Partial<EveGate2SignalCandidate>,
  noGoId: string,
  status: string,
) {
  const result = validateGate2Signal({ ...baseSignal(), ...overrides });
  assert.equal(result.triggeredNoGos.some((noGo) => noGo.noGoId === noGoId), true);
  assert.equal(result.statuses.includes(status as never), true);
  assert.equal(result.accepted, false);
  assert.equal(result.gate3Ready, false);
}

function ruleById(noGoId: string) {
  return EVE_GATE2_NO_GO_RULES.find((rule) => rule.noGoId === noGoId);
}

function baseSignal(): EveGate2SignalCandidate {
  return {
    signalId: "gate2-signal-001",
    observationMode: "replay_only",
    identity: {
      tenantId: "tenant-001",
      organizationId: "org-001",
      sessionId: "session-001",
      activityId: "activity-001",
      actorId_or_userId: "actor-001",
    },
    mba_anchor: {
      pmProcessId: "pm-001",
      pfEvent: "SolicitudDiagnosticaAceptada",
      objectState: "CasoDiagnosticoEVE[InDiagnosticProduction]",
      objectStateInOLC: true,
      mocClass: "operational_control",
      mocOperation: "validate_transition",
      olcTransitionEvent: "InDiagnosticProduction",
      pfTimerIfWaiting: "none",
    },
    traceability: {
      provenance: "audit:evidence-001",
      sourceTrace: "trace:source-001",
      sourceRef: "source:001",
      evidenceRef: "evidence:001",
      routeRef: "route:b3-feedback-001",
      idempotencyKey: "idem-001",
      correlationId: "corr-001",
      officialFlowRef: "official:flow-001",
      auditRef: "audit:001",
    },
    no_mutation_boundary: {
      uiTouchAllowed: false,
      workMapMutationAllowed: false,
      significadoMutationAllowed: false,
      dbWriteAllowed: false,
      supabaseWriteAllowed: false,
      runtimeMutationAllowed: false,
      registryWriteAllowed: false,
      exportAllowed: false,
      diagnosisAllowed: false,
    },
    security_boundary: {
      authBoundaryRequired: true,
      tenantIsolationRequired: true,
      rlsReadBoundaryRequiredIfDB: true,
      serviceRoleAllowed: false,
      secretsAllowed: false,
      tokenExposureAllowed: false,
    },
    b3_b7_boundary: {
      receiverSatisfactionAllowedAsFeedback: false,
      receiverFeedbackRequiresRouteRef: true,
      receiverFeedbackPresent: false,
      b7DiagnosticUseAllowed: false,
      b7StructuralFactAllowed: false,
      b3b7AlignmentDeltaRequiredWhenApplicable: true,
    },
    evidence: [
      {
        field: "traceability.provenance",
        proofType: "manual_review_record_with_owner",
        claimedAsRealEvidence: false,
      },
    ],
    futureReadOnlyInventoryComplete: true,
    productOwnerEvidenceComplete: true,
  };
}
