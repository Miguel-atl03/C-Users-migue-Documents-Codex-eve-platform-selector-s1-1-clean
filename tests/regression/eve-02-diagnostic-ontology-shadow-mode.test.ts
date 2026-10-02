import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  DiagnosticOntologyEvaluationInput,
  DiagnosticOntologyEvidenceRef,
  DiagnosticOntologyModel,
  DiagnosticOntologySourceTrace,
} from "../../src/domain/diagnostic-ontology-evaluation.ts";
import { evaluateDiagnosticOntologyShadow } from "../../src/services/diagnostic-ontology-shadow-evaluator.ts";

const servicePath = "src/services/diagnostic-ontology-shadow-evaluator.ts";

const d2Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D2",
  ruleId: "EVE02-R001",
  locator: "fixture:D2",
  authorityDomain: "D2_primary_pathology_source",
};

const d1Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D1",
  ruleId: "EVE02-R002",
  locator: "fixture:D1",
  authorityDomain: "D1_methodological_guard",
};

function evidenceRef(id = "ev-PM-MoC-1"): DiagnosticOntologyEvidenceRef {
  return {
    evidenceRefId: id,
    kind: "structural_candidate",
    sourceTrace: [d2Trace],
  };
}

function baseInput(
  overrides: Partial<DiagnosticOntologyEvaluationInput> = {},
): DiagnosticOntologyEvaluationInput {
  return {
    mode: "diagnostic_ontology_shadow",
    inconsistency_compartment: "EVE02-CMP-001",
    involved_models: ["PM", "MoC"],
    conformance_status: "validated_by_EVE_00",
    consistency_status: "validated_by_EVE_00",
    evidence_refs: [evidenceRef()],
    source_trace: [d1Trace, d2Trace],
    semanticGateStatus: "closed",
    processStateTimerGateStatus: "not_applicable",
    requestedOutputType: "diagnostic_preclassification_candidate",
    confidenceContext: {
      confidence: "high",
      evidenceStrength: "strong",
    },
    ...overrides,
  };
}

function validInputFor(
  compartment: DiagnosticOntologyEvaluationInput["inconsistency_compartment"],
  models: DiagnosticOntologyModel[],
  evidenceIds = ["ev-1"],
): DiagnosticOntologyEvaluationInput {
  return baseInput({
    inconsistency_compartment: compartment,
    involved_models: models,
    evidence_refs: evidenceIds.map((id) => evidenceRef(id)),
    processStateTimerGateStatus: "closed",
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertSafetyFlagsAlwaysFalse(input: DiagnosticOntologyEvaluationInput) {
  const result = evaluateDiagnosticOntologyShadow(input);

  assert.equal(result.safetyFlags.canBlockUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canTriggerFinalDiagnosis, false);
  assert.equal(result.safetyFlags.canTriggerIR, false);
  assert.equal(result.safetyFlags.canTriggerExport, false);
  assert.equal(result.safetyFlags.canTriggerProduction, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

test("returns shadow version and chip id", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput());

  assert.equal(result.version, "EVE_02_DIAGNOSTIC_ONTOLOGY_SHADOW_V1");
  assert.equal(result.chipId, "EVE-02-DIAGNOSTIC-ONTOLOGY");
  assert.equal(result.mode, "diagnostic_ontology_shadow");
});

test("safety flags are always false", () => {
  assertSafetyFlagsAlwaysFalse(baseInput());
  assertSafetyFlagsAlwaysFalse(baseInput({ evidence_refs: [] }));
  assertSafetyFlagsAlwaysFalse(baseInput({ requestedOutputType: "final_diagnosis" }));
});

test("input is not mutated", () => {
  const input = baseInput();
  const before = clone(input);

  evaluateDiagnosticOntologyShadow(input);

  assert.deepEqual(input, before);
});

test("invalid mode produces manual review and input rejected event", () => {
  const input = {
    ...baseInput(),
    mode: "diagnostic_live",
  } as unknown as DiagnosticOntologyEvaluationInput;
  const result = evaluateDiagnosticOntologyShadow(input);

  assert.equal(result.readinessState, "manual_review_required");
  assert.ok(result.blockedActions.includes("invalid_mode"));
  assert.equal(result.auditEvents[0].eventType, "diagnostic_ontology_input_rejected");
});

test("invalid compartment blocks or routes to review", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({ inconsistency_compartment: "EVE02-CMP-999" }),
  );

  assert.equal(result.readinessState, "manual_review_required");
  assert.ok(result.requiredInputs.includes("valid_inconsistency_compartment"));
  assert.ok(result.findings[0].ruleId === "EVE02-R001");
});

test("involved models mismatch produces blocked_by_missing_evidence", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput({ involved_models: ["PM", "PF"] }));

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.requiredInputs.includes("involved_models_matching_compartment"));
  assert.ok(result.findings[0].ruleId === "EVE02-R019");
});

test("conformance unchecked produces blocked_by_conformance_unchecked", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({ conformance_status: "unchecked" }),
  );

  assert.equal(result.readinessState, "blocked_by_conformance_unchecked");
  assert.ok(result.requiredInputs.includes("conformance_status_validated_by_EVE_00"));
  assert.ok(result.findings[0].ruleId === "EVE02-R022");
});

test("consistency unchecked produces blocked_by_consistency_unchecked", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({ consistency_status: "unchecked" }),
  );

  assert.equal(result.readinessState, "blocked_by_consistency_unchecked");
  assert.ok(result.requiredInputs.includes("consistency_status_validated_by_EVE_00"));
  assert.ok(result.findings[0].ruleId === "EVE02-R023");
});

test("empty evidence_refs produces blocked_by_missing_evidence", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput({ evidence_refs: [] }));

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.requiredInputs.includes("evidence_refs"));
  assert.ok(result.findings[0].ruleId === "EVE02-R021");
});

test("source_trace without D2 produces blocked_by_missing_evidence", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({
      source_trace: [d1Trace],
      evidence_refs: [{ ...evidenceRef(), sourceTrace: [d1Trace] }],
    }),
  );

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.requiredInputs.includes("source_trace_with_D2"));
  assert.ok(result.findings[0].ruleId === "EVE02-R033");
});

test("semanticGateStatus open produces blocked_by_semantic_ambiguity", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput({ semanticGateStatus: "open" }));

  assert.equal(result.readinessState, "blocked_by_semantic_ambiguity");
  assert.ok(result.blockedActions.includes("pathology_mapping_until_sem_gate_closed"));
  assert.ok(result.findings[0].ruleId === "EVE02-R037");
});

test("process state/timer gate open for PF/OLC temporal compartment blocks or reenters", () => {
  const result = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-006", ["PF", "OLC"], ["ev-PF-1", "ev-OLC-1"]),
  );
  const blocked = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-006", ["PF", "OLC"], ["ev-PF-1", "ev-OLC-1"]),
  );

  assert.equal(result.readinessState, "diagnostic_preclassification_candidate");
  assert.equal(
    evaluateDiagnosticOntologyShadow(
      validInputFor("EVE02-CMP-006", ["PF", "OLC"], ["ev-PF-1", "ev-OLC-1"]),
    ).readinessState,
    "diagnostic_preclassification_candidate",
  );
  const openGate = evaluateDiagnosticOntologyShadow({
    ...blocked.methodTrace,
    ...validInputFor("EVE02-CMP-006", ["PF", "OLC"], ["ev-PF-1", "ev-OLC-1"]),
    processStateTimerGateStatus: "open",
  });
  assert.ok(["blocked_by_semantic_ambiguity", "reentry_required"].includes(openGate.readinessState));
  assert.ok(openGate.findings[0].ruleId === "EVE02-R038");
});

test("final diagnosis request never returns final diagnosis", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({ requestedOutputType: "final_diagnosis" }),
  );

  assert.ok(["manual_review_required", "reentry_required"].includes(result.readinessState));
  assert.ok(result.blockedActions.includes("final_diagnosis"));
  assert.equal(JSON.stringify(result).includes("finalDiagnosis"), false);
});

test("valid PM/MoC maps to Esquizofrenia Ontológica", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput());

  assert.equal(result.readinessState, "diagnostic_preclassification_candidate");
  assert.equal(result.compartmentId, "EVE02-CMP-001");
  assert.equal(result.pathologyCandidate, "Esquizofrenia Ontológica");
  assert.equal(result.canonicalPathology, "Esquizofrenia Ontológica");
});

test("valid PM/PF maps to Brecha Intencional", () => {
  const result = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-002", ["PM", "PF"]),
  );

  assert.equal(result.readinessState, "diagnostic_preclassification_candidate");
  assert.equal(result.pathologyCandidate, "Brecha Intencional");
});

test("valid PF/OLC temporal maps to Tortura Causal", () => {
  const result = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-006", ["PF", "OLC"], ["ev-PF-1", "ev-OLC-1"]),
  );

  assert.equal(result.readinessState, "diagnostic_preclassification_candidate");
  assert.equal(result.pathologyCandidate, "Tortura Causal");
});

test("systemic total without four views is blocked by missing evidence", () => {
  const result = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-013", ["PM", "MoC", "PF", "OLC"], ["ev-PM-1", "ev-MoC-1"]),
  );

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.requiredInputs.includes("OLC_evidence"));
  assert.ok(result.findings[0].ruleId === "EVE02-R026");
});

test("systemic total with four views maps to Incoherencia Sistémica Total", () => {
  const result = evaluateDiagnosticOntologyShadow(
    validInputFor("EVE02-CMP-013", ["PM", "MoC", "PF", "OLC"], [
      "ev-PM-1",
      "ev-MoC-1",
      "ev-PF-1",
      "ev-OLC-1",
    ]),
  );

  assert.equal(result.readinessState, "diagnostic_preclassification_candidate");
  assert.equal(result.pathologyCandidate, "Incoherencia Sistémica Total");
  assert.ok(result.aliases.includes("Esquizofrenia Organizacional"));
});

test("multiple compartments low confidence routes to manual review", () => {
  const result = evaluateDiagnosticOntologyShadow(
    baseInput({
      confidenceContext: {
        confidence: "low",
        multipleCompartments: true,
        evidenceStrength: "weak",
      },
    }),
  );

  assert.equal(result.readinessState, "manual_review_required");
  assert.ok(result.blockedActions.includes("force_primary_candidate"));
  assert.ok(result.findings[0].ruleId === "EVE02-R025");
});

test("never returns finalDiagnosis field", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput({ requestedOutputType: "final_diagnosis" }));

  assert.doesNotMatch(JSON.stringify(result), /"finalDiagnosis"\s*:/);
});

test("never returns registry_write as enabled action", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput());

  assert.equal(result.allowedActions.includes("registry_write"), false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
});

test("never returns production_real as enabled action", () => {
  const result = evaluateDiagnosticOntologyShadow(baseInput());

  assert.equal(result.allowedActions.includes("production_real"), false);
  assert.equal(result.safetyFlags.canTriggerProduction, false);
});

test("service has no forbidden imports or side-effect access", () => {
  const serviceSource = readFileSync(servicePath, "utf8");

  for (const forbiddenPattern of [
    /WorkMap/i,
    /Significado/i,
    /runtime-block0/i,
    /runtime-engine/i,
    /Supabase/i,
    /from\s+["'].*components/i,
    /from\s+["'].*src\/app/i,
    /page\.tsx/i,
    /docs\/chips/i,
    /localStorage/i,
    /window\./i,
    /fetch\(/i,
    /registry\s*\.\s*(write|set|push|register)/i,
  ]) {
    assert.doesNotMatch(serviceSource, forbiddenPattern);
  }
});

test("ruleIds and sourceTrace appear in relevant decisions", () => {
  const results = [
    evaluateDiagnosticOntologyShadow(baseInput()),
    evaluateDiagnosticOntologyShadow(baseInput({ conformance_status: "unchecked" })),
    evaluateDiagnosticOntologyShadow(baseInput({ evidence_refs: [] })),
    evaluateDiagnosticOntologyShadow(baseInput({ requestedOutputType: "final_diagnosis" })),
  ];

  for (const result of results) {
    assert.ok(result.findings.every((finding) => finding.ruleId.length > 0));
    assert.ok(result.findings.some((finding) => finding.sourceTrace.length > 0));
    assert.ok(result.auditEvents.every((event) => event.sourceTrace.length > 0));
  }
});
