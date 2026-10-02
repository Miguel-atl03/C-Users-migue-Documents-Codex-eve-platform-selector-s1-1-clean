import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO,
  buildShadowComparison,
  mapObservedSignalToShadowCommand,
  runShadowE2EReplay,
  runShadowE2EReplayBatch,
  validateNoCableadoForE2E,
} from "../../src/services/eve-organism-shadow-e2e-adapter.ts";
import type { EveOrganismShadowBlockerId } from "../../src/types/eve-organism-composition-root.ts";
import type {
  EveOrganismShadowE2EObservedSignal,
  EveOrganismShadowE2EResult,
  EveOrganismShadowE2ESideEffectPolicy,
} from "../../src/types/eve-organism-shadow-e2e.ts";

type AdapterScenario = {
  id: string;
  category: "replay" | "mapper" | "comparison" | "no_cableado" | "blockers" | "batch";
  description: string;
  run: () => void;
};

const noSideEffects: EveOrganismShadowE2ESideEffectPolicy = {
  noDbWrite: true,
  noRegistryWrite: true,
  noExport: true,
  noUiTouch: true,
  noDiagnosis: true,
  noRuntimeMutation: true,
  noSupabaseRequired: true,
};

const GATE3_HEADCOUNT_INPUT = {
  activityDescription:
    "Reviso las desviaciones de headcount contra el presupuesto aprobado por unidad de negocio, comparo variaciones relevantes, identifico causas probables y dejo una alerta temprana documentada para que Finanzas y People puedan decidir acciones correctivas.",
  startCondition: "Inicio cuando recibo el corte actualizado de headcount y presupuesto aprobado por unidad de negocio.",
  endCondition:
    "Cierre cuando queda documentada una alerta temprana con desviacion, causa probable y accion sugerida para revision.",
  ruleOrStandard: "contra el presupuesto aprobado por unidad de negocio",
  frequency: "Mensualmente, durante el cierre financiero y cuando se actualiza el forecast de headcount.",
  typicalContext:
    "Cuando Finanzas o People detectan variaciones relevantes entre el headcount real, el presupuesto aprobado y el forecast vigente.",
  primaryActorScope: "Analista financiero responsable de seguimiento de headcount por unidad de negocio.",
} as const;

const scenarios: AdapterScenario[] = [
  scenario("A-001", "replay", "fixture workmap_activity accepted", () => {
    expectAccepted(runShadowE2EReplay(baseSignal({ signalKind: "workmap_activity" })));
  }),
  scenario("A-002", "replay", "fixture significado_intent accepted", () => {
    expectAccepted(runShadowE2EReplay(baseSignal({ signalKind: "significado_intent" })));
  }),
  scenario("A-003", "replay", "fixture runtime_like_response accepted", () => {
    expectAccepted(runShadowE2EReplay(baseSignal({ signalKind: "runtime_like_response" })));
  }),
  scenario("A-004", "replay", "evidence_capture accepted with provenance", () => {
    expectAccepted(runShadowE2EReplay(baseSignal({ signalKind: "evidence_capture" })));
  }),
  scenario("A-005", "replay", "candidate_generation accepted with sourceTrace", () => {
    expectAccepted(runShadowE2EReplay(baseSignal({ signalKind: "candidate_generation" })));
  }),
  scenario("A-005B", "replay", "Gate 3 candidate_generation envelope carries supervised markers", () => {
    const result = runShadowE2EReplay(gate3HeadcountSignal());
    const envelope = (result as EveOrganismShadowE2EResult & { gate3ActivationEnvelope?: any }).gate3ActivationEnvelope;

    expectAccepted(result);
    assert.equal(envelope?.activationType, "restricted_internal_supervised");
    assert.equal(envelope?.operationalInput.activityDescription, GATE3_HEADCOUNT_INPUT.activityDescription);
    assert.equal(envelope?.candidateOutput.status, "draft");
    assert.equal(envelope?.candidateOutput.kind, "candidate_generation");
    assert.equal(envelope?.candidateOutput.promotionAllowed, false);
    assert.deepEqual(envelope?.candidateOutput.evidenceTrace, ["gate3-headcount-evidence-001"]);
    assert.deepEqual(envelope?.candidateOutput.sourceTrace, ["gate3-headcount-source-001"]);
    assert.equal(envelope?.candidateOutput.noGoStatus, "passed");
    assert.equal(envelope?.candidateOutput.humanReviewRequired, true);
    assert.equal(envelope?.candidateOutput.humanReviewType, "S3*");
    assert.deepEqual(envelope?.candidateOutput.carryForwardRisks, ["G2-RISK-001"]);
    assert.deepEqual(envelope?.candidateOutput.sideEffects, EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO);
  }),
  scenario("A-006", "replay", "official_flow_result accepted as governanceObserve", () => {
    const result = runShadowE2EReplay(baseSignal({ signalKind: "official_flow_result" }));
    expectAccepted(result);
    assert.equal(result.shadowCommand.requestedCapability, "governanceObserve");
  }),
  scenario("B-007", "mapper", "workmap_activity maps to runtimeCapture", () => {
    assert.equal(mapObservedSignalToShadowCommand(baseSignal({ signalKind: "workmap_activity" })).requestedCapability, "runtimeCapture");
  }),
  scenario("B-008", "mapper", "significado_intent maps to runtimeCapture", () => {
    assert.equal(mapObservedSignalToShadowCommand(baseSignal({ signalKind: "significado_intent" })).requestedCapability, "runtimeCapture");
  }),
  scenario("B-009", "mapper", "runtime_like_response maps to gateAdvisory", () => {
    assert.equal(mapObservedSignalToShadowCommand(baseSignal({ signalKind: "runtime_like_response" })).requestedCapability, "gateAdvisory");
  }),
  scenario("B-010", "mapper", "candidate_generation maps to candidateGeneration", () => {
    assert.equal(mapObservedSignalToShadowCommand(baseSignal({ signalKind: "candidate_generation" })).requestedCapability, "candidateGeneration");
  }),
  scenario("B-011", "mapper", "official_flow_result maps to governanceObserve", () => {
    assert.equal(mapObservedSignalToShadowCommand(baseSignal({ signalKind: "official_flow_result" })).requestedCapability, "governanceObserve");
  }),
  scenario("B-012", "mapper", "gateEnforcement explicit request does not produce productive enforcement", () => {
    const result = runShadowE2EReplay(baseSignal({ requestedCapability: "gateEnforcement" }));
    assert.equal(result.shadowCommand.requestedCapability, "gateAdvisory");
    assert.equal(result.shadowResult.capabilityStateDecision.productiveActivationGranted, false);
    expectAccepted(result);
  }),
  scenario("C-013", "comparison", "officialFlowRef absent yields unknown sameOutcome", () => {
    const result = runShadowE2EReplay(baseSignal({ officialFlowRef: undefined }));
    assert.equal(result.comparison.sameOutcome, "unknown");
    assert.equal(result.comparison.divergenceType, "unknown");
  }),
  scenario("C-014", "comparison", "officialFlowRef present and accepted yields no divergence", () => {
    const result = runShadowE2EReplay(baseSignal());
    assert.equal(result.comparison.sameOutcome, true);
    assert.equal(result.comparison.divergenceType, "none");
  }),
  scenario("C-015", "comparison", "blocked missing context yields missing_context", () => {
    const result = runShadowE2EReplay(baseSignal({ tenantId: "", sessionId: "", activityId: "" }));
    assert.equal(result.comparison.divergenceType, "missing_context");
  }),
  scenario("C-016", "comparison", "missing provenance yields provenance_gap", () => {
    const result = runShadowE2EReplay(signalMissingProvenance());
    assert.equal(result.comparison.divergenceType, "provenance_gap");
  }),
  scenario("C-017", "comparison", "registry/export attempt yields no_go_triggered", () => {
    const result = runShadowE2EReplay(baseSignal({ signalKind: "registry_export_attempt" }));
    assert.equal(result.comparison.divergenceType, "no_go_triggered");
  }),
  scenario("C-018", "comparison", "tenant leak signal yields tenant_boundary_risk", () => {
    const result = runShadowE2EReplay(baseSignal({ signalKind: "tenant_leak_signal" }));
    assert.equal(result.comparison.divergenceType, "tenant_boundary_risk");
  }),
  scenario("C-019", "comparison", "no_go_triggered requires human review", () => {
    const result = runShadowE2EReplay(baseSignal({ requestedCapability: "databaseWrite" }));
    assert.equal(result.comparison.divergenceType, "no_go_triggered");
    assert.equal(result.comparison.requiresHumanReview, true);
  }),
  scenario("C-020", "comparison", "divergence never modifies officialFlowRef", () => {
    const signal = baseSignal({ requestedCapability: "databaseWrite" });
    const before = JSON.stringify(signal.officialFlowRef);
    const result = runShadowE2EReplay(signal);
    assert.equal(JSON.stringify(signal.officialFlowRef), before);
    assert.equal(result.officialFlowUntouched, true);
  }),
  scenario("D-021", "no_cableado", "every replay has no DB write", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.db_write_allowed, false);
  }),
  scenario("D-022", "no_cableado", "every replay has no registry write", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.registry_write_allowed, false);
  }),
  scenario("D-023", "no_cableado", "every replay has no export", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.final_export_allowed, false);
  }),
  scenario("D-024", "no_cableado", "every replay has no diagnosis", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.diagnosis_allowed, false);
  }),
  scenario("D-025", "no_cableado", "every replay has no UI touch", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.ui_touch_allowed, false);
  }),
  scenario("D-026", "no_cableado", "every replay has no production authority", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.production_authority_allowed, false);
  }),
  scenario("D-027", "no_cableado", "every replay does not require external backend", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).noCableadoAttestation.supabase_required, false);
  }),
  scenario("D-028", "no_cableado", "officialFlowUntouched true", () => {
    assert.equal(runShadowE2EReplay(baseSignal()).officialFlowUntouched, true);
  }),
  scenario("E-029", "blockers", "missing tenant/session/activity triggers OCR-BLK-001", () => {
    expectBlocker(runShadowE2EReplay(baseSignal({ tenantId: "", sessionId: "", activityId: "" })), "OCR-BLK-001");
  }),
  scenario("E-030", "blockers", "missing provenance triggers OCR-BLK-013", () => {
    expectBlocker(runShadowE2EReplay(signalMissingProvenance()), "OCR-BLK-013");
  }),
  scenario("E-031", "blockers", "candidate without sourceTrace triggers OCR-BLK-014", () => {
    expectBlocker(runShadowE2EReplay(signalMissingSourceTrace()), "OCR-BLK-014");
  }),
  scenario("E-032", "blockers", "registryWrite triggers OCR-BLK-003", () => {
    expectBlocker(runShadowE2EReplay(baseSignal({ requestedCapability: "registryWrite" })), "OCR-BLK-003");
  }),
  scenario("E-033", "blockers", "finalExport explicit request triggers OCR-BLK-004", () => {
    expectBlocker(runShadowE2EReplay(baseSignal({ requestedCapability: "finalExport" })), "OCR-BLK-004");
  }),
  scenario("E-034", "blockers", "diagnosis explicit request triggers OCR-BLK-005", () => {
    expectBlocker(runShadowE2EReplay(baseSignal({ requestedCapability: "diagnosis" })), "OCR-BLK-005");
  }),
  scenario("E-035", "blockers", "unaudited override triggers OCR-BLK-009", () => {
    expectBlocker(runShadowE2EReplay(baseSignal({ overrideRequested: true, overrideAudited: false })), "OCR-BLK-009");
  }),
  scenario("F-036", "batch", "batch preserves order", () => {
    const signals = [baseSignal({ observedSignalId: "sig-1" }), baseSignal({ observedSignalId: "sig-2" })];
    assert.deepEqual(runShadowE2EReplayBatch(signals).map((result) => result.observedSignalId), ["sig-1", "sig-2"]);
  }),
  scenario("F-037", "batch", "batch preserves correlationId", () => {
    const signals = [baseSignal({ correlationId: "corr-a" }), baseSignal({ correlationId: "corr-b" })];
    assert.deepEqual(runShadowE2EReplayBatch(signals).map((result) => result.shadowCommand.correlationId), ["corr-a", "corr-b"]);
  }),
  scenario("F-038", "batch", "batch returns same number of results as signals", () => {
    const signals = [baseSignal({ observedSignalId: "sig-a" }), signalMissingSourceTrace(), signalMissingProvenance()];
    assert.equal(runShadowE2EReplayBatch(signals).length, signals.length);
  }),
  scenario("F-039", "batch", "batch with mixed accepted/blocked produces no side effects", () => {
    const results = runShadowE2EReplayBatch([
      baseSignal({ observedSignalId: "sig-ok" }),
      baseSignal({ observedSignalId: "sig-blocked", requestedCapability: "databaseWrite" }),
    ]);
    assert.deepEqual(results.map((result) => result.noCableadoAttestation), [
      EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO,
      EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO,
    ]);
  }),
  scenario("F-040", "batch", "batch cross-tenant fixture does not merge tenants", () => {
    const results = runShadowE2EReplayBatch([
      baseSignal({ observedSignalId: "sig-tenant-a", tenantId: "tenant-a" }),
      baseSignal({ observedSignalId: "sig-tenant-b", tenantId: "tenant-b" }),
    ]);
    assert.deepEqual(results.map((result) => result.shadowCommand.tenantId), ["tenant-a", "tenant-b"]);
  }),
];

test("EVE shadow E2E adapter executes 41 offline fixture scenarios", () => {
  assert.equal(scenarios.length, 41);
});

for (const item of scenarios) {
  test(`${item.id}: ${item.description}`, item.run);
}

test("comparison builder can be called directly without mutating official flow reference", () => {
  const signal = baseSignal({ requestedCapability: "finalExport" });
  const result = runShadowE2EReplay(signal);
  const comparison = buildShadowComparison(signal, result.shadowResult);

  assert.equal(comparison.divergenceType, "no_go_triggered");
  assert.deepEqual(comparison.officialFlowRef, signal.officialFlowRef);
});

test("no-cableado validator returns the immutable Gate 2 attestation", () => {
  const result = runShadowE2EReplay(baseSignal());
  assert.deepEqual(validateNoCableadoForE2E(baseSignal(), result.shadowResult), EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO);
});

test("adapter and E2E tests have no forbidden imports or productive side effects", () => {
  const source = [
    "src/types/eve-organism-shadow-e2e.ts",
    "src/services/eve-organism-shadow-e2e-adapter.ts",
    "tests/regression/eve-organism-shadow-e2e-adapter.test.ts",
  ].map((file) => readFileSync(file, "utf8")).join("\n");

  for (const forbidden of [
    new RegExp("@supa" + "base", "i"),
    /\bsupabase\./i,
    new RegExp("\\bcreate" + "Client\\b", "i"),
    /\bfetch\(/i,
    /\bfrom\(/i,
    /\binsert\(/i,
    /\bupdate\(/i,
    /\bdelete\(/i,
    /\bexecute\(/i,
    /\bquery\(/i,
    /process\.env/i,
    /Date\.now/i,
    /Math\.random/i,
    new RegExp("from\\s+['\"][^'\"]*src/" + "app", "i"),
    new RegExp("from\\s+['\"][^'\"]*ap" + "p/", "i"),
    new RegExp("from\\s+['\"][^'\"]*compo" + "nents/", "i"),
    new RegExp("from\\s+['\"][^'\"]*pag" + "es/", "i"),
    new RegExp("from\\s+['\"][^'\"]*docs/chi" + "ps", "i"),
    new RegExp("from\\s+['\"][^'\"]*docs/run" + "time", "i"),
    /registryWritten:\s*true/i,
    /exportProduced:\s*true/i,
    /diagnosisEnabled:\s*true/i,
    /dbWritten:\s*true/i,
    /uiTouched:\s*true/i,
    /productionAuthorityGranted:\s*true/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

function scenario(
  id: AdapterScenario["id"],
  category: AdapterScenario["category"],
  description: AdapterScenario["description"],
  run: AdapterScenario["run"],
): AdapterScenario {
  return { id, category, description, run };
}

function baseSignal(overrides: Partial<EveOrganismShadowE2EObservedSignal> = {}): EveOrganismShadowE2EObservedSignal {
  return {
    observedSignalId: "signal-001",
    observedAt: "2026-06-24T12:00:00.000Z",
    sourceSystem: "fixture-replay",
    sourcePath: "tests/fixtures/eve-organism-shadow-e2e/in-memory",
    tenantId: "tenant-001",
    organizationId: "org-001",
    sessionId: "session-001",
    activityId: "activity-001",
    actorId: "actor-001",
    signalKind: "workmap_activity",
    clientIntent: "Replay observed activity into offline shadow harness",
    rawObservedPayload: {
      fixtureOnly: true,
    },
    evidenceInputs: [
      {
        evidenceId: "evidence-001",
        kind: "fixture",
        summary: "Observed fixture evidence with provenance.",
        provenance: {
          sourceId: "fixture-source-001",
          sourcePath: "tests/fixtures/eve-organism-shadow-e2e/in-memory",
        },
      },
    ],
    candidateInputs: [
      {
        candidateId: "candidate-001",
        kind: "fixture-candidate",
        summary: "Observed candidate with source trace.",
        sourceTrace: ["fixture-source-001"],
      },
    ],
    provenance: {
      sourceId: "fixture-source-001",
      sourcePath: "tests/fixtures/eve-organism-shadow-e2e/in-memory",
      observedBy: "fixture",
    },
    idempotencyKey: "idem-001",
    correlationId: "corr-001",
    officialFlowRef: {
      flowId: "official-flow-001",
      tenantId: "tenant-001",
      sessionId: "session-001",
      activityId: "activity-001",
      outcomeRef: "official-outcome-001",
      mutatedByShadow: false,
    },
    observationMode: "fixture",
    sideEffectPolicy: noSideEffects,
    overrideRequested: false,
    overrideAudited: false,
    ...overrides,
  };
}

function signalMissingProvenance() {
  return baseSignal({
    provenance: undefined,
    evidenceInputs: [
      {
        evidenceId: "evidence-without-provenance",
        kind: "fixture",
        summary: "Evidence intentionally missing provenance.",
      },
    ],
  });
}

function signalMissingSourceTrace() {
  return baseSignal({
    candidateInputs: [
      {
        candidateId: "candidate-without-source",
        kind: "fixture-candidate",
        summary: "Candidate intentionally missing source trace.",
      },
    ],
  });
}

function gate3HeadcountSignal() {
  return baseSignal({
    observedSignalId: "gate3-headcount-signal-001",
    sourcePath: "docs/audits/evidence/gate3_restricted_start/gate3_restricted_internal_supervised_activation_plan.md",
    signalKind: "candidate_generation",
    clientIntent: "Run Gate 3 restricted internal supervised headcount candidate draft replay.",
    rawObservedPayload: {
      gate3RestrictedActivation: true,
      operationalInput: GATE3_HEADCOUNT_INPUT,
    },
    evidenceInputs: [
      {
        evidenceId: "gate3-headcount-evidence-001",
        kind: "gate3-restricted-operational-input",
        summary: "Headcount variance activity captured for Gate 3 restricted replay.",
        provenance: {
          sourceId: "gate3-headcount-source-001",
          sourcePath: "docs/audits/evidence/gate3_restricted_start/gate3_restricted_internal_supervised_activation_plan.md",
        },
      },
    ],
    candidateInputs: [
      {
        candidateId: "gate3-headcount-candidate-001",
        kind: "candidate_generation",
        summary: "Draft candidate for headcount variance early warning review.",
        sourceTrace: ["gate3-headcount-source-001"],
      },
    ],
    provenance: {
      sourceId: "gate3-headcount-source-001",
      sourcePath: "docs/audits/evidence/gate3_restricted_start/gate3_restricted_internal_supervised_activation_plan.md",
      observedBy: "fixture",
    },
    idempotencyKey: "gate3-headcount-idem-001",
    correlationId: "gate3-headcount-corr-001",
    officialFlowRef: {
      flowId: "gate3-headcount-official-flow-001",
      tenantId: "tenant-001",
      sessionId: "session-001",
      activityId: "activity-001",
      outcomeRef: "gate3-headcount-official-outcome-001",
      mutatedByShadow: false,
    },
  });
}

function expectAccepted(result: EveOrganismShadowE2EResult) {
  assert.equal(result.accepted, true);
  assert.equal(result.shadowResult.status, "SHADOW_ACCEPTED");
  assert.deepEqual(result.blockers, []);
  assert.equal(result.officialFlowUntouched, true);
  assert.deepEqual(result.noCableadoAttestation, EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO);
}

function expectBlocker(result: EveOrganismShadowE2EResult, blockerId: EveOrganismShadowBlockerId) {
  assert.equal(result.blockers.some((blocker) => blocker.id === blockerId), true);
  assert.equal(result.officialFlowUntouched, true);
  assert.deepEqual(result.noCableadoAttestation, EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO);
}
