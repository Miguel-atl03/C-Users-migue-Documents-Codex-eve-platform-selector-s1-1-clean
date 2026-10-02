import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  AgentConstitutionEvaluationInput,
  AgentConstitutionSourceTrace,
} from "../../src/domain/agent-constitution-evaluation.ts";
import { evaluateAgentConstitutionShadow } from "../../src/services/agent-constitution-shadow-evaluator.ts";

const servicePath = "src/services/agent-constitution-shadow-evaluator.ts";

const d1Trace: AgentConstitutionSourceTrace = {
  sourceId: "D1",
  ruleId: "SRC-001",
  locator: "fixture:D1",
  authorityDomain: "Metodo MMABP",
};

const d2Trace: AgentConstitutionSourceTrace = {
  sourceId: "D2",
  ruleId: "SRC-002",
  locator: "fixture:D2",
  authorityDomain: "Ontologia diagnostica",
};

function baseInput(): AgentConstitutionEvaluationInput {
  return {
    mode: "constitutional_shadow",
    requestedAction: "capture_evidence",
    inputClassification: "evidence_capture",
    targetBoundary: "Capa 1 evidence capture",
    requestedOutputType: "constitutionalDecisionCandidate",
    sourceTrace: [d1Trace],
    evidenceItems: [
      {
        evidenceItemId: "ev-1",
        value: "traceable user evidence",
        provenanceType: "captured_user_evidence",
        sourceRefs: [d1Trace],
        revision: 1,
        epistemicStatus: "captured_user_evidence",
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertSafetyFlagsAlwaysFalse(input: AgentConstitutionEvaluationInput) {
  const result = evaluateAgentConstitutionShadow(input);

  assert.equal(result.safetyFlags.canBlockUserFlow, false);
  assert.equal(result.safetyFlags.canModifyPayload, false);
  assert.equal(result.safetyFlags.canWriteRegistry, false);
  assert.equal(result.safetyFlags.canTriggerFinalDiagnosis, false);
  assert.equal(result.safetyFlags.canTriggerProduction, false);
  assert.equal(result.safetyFlags.runtimeAuthority, false);
}

test("returns shadow version and chip id", () => {
  const result = evaluateAgentConstitutionShadow(baseInput());

  assert.equal(result.version, "EVE_01_AGENT_CONSTITUTION_SHADOW_V1");
  assert.equal(result.chipId, "EVE-01-AGENT-CONSTITUTION");
  assert.equal(result.mode, "constitutional_shadow");
});

test("safety flags are always false", () => {
  assertSafetyFlagsAlwaysFalse(baseInput());
  assertSafetyFlagsAlwaysFalse({ ...baseInput(), sourceTrace: [] });
  assertSafetyFlagsAlwaysFalse({
    ...baseInput(),
    requestedAction: "emit_final_diagnosis_from_Capa1",
    requestedOutputType: "final_diagnosis",
  });
});

test("input is not mutated", () => {
  const input = baseInput();
  const before = clone(input);

  evaluateAgentConstitutionShadow(input);

  assert.deepEqual(input, before);
});

test("empty sourceTrace produces audit_required", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    sourceTrace: [],
  });

  assert.equal(result.readinessState, "audit_required");
  assert.ok(result.ruleIds.includes("SRC-008"));
  assert.equal(result.auditRequired, true);
  assert.ok(result.requiredInputs.includes("source_trace"));
  assert.equal(result.auditEvents[0].eventType, "agent_constitution_audit_required");
});

test("empty evidenceItems in evidence action produces blocked_by_missing_evidence", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "create_structural_candidate",
    evidenceItems: [],
    targetBoundary: "structural candidate boundary",
  });

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.ruleIds.includes("EPI-010"));
  assert.ok(result.requiredInputs.includes("evidenceItems"));
});

test("capture_evidence with traceable evidence produces capture_allowed", () => {
  const result = evaluateAgentConstitutionShadow(baseInput());

  assert.equal(result.readinessState, "capture_allowed");
  assert.ok(result.allowedActions.includes("capture_evidence"));
  assert.ok(result.ruleIds.includes("SCP-002"));
  assert.ok(result.ruleIds.includes("EPI-001"));
});

test("final diagnosis request is blocked by scope", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "emit_final_diagnosis_from_Capa1",
    requestedOutputType: "final_diagnosis",
    methodKernelResult: { readinessState: "ready" },
    sourceTrace: [d1Trace, d2Trace],
  });

  assert.equal(result.readinessState, "blocked_by_scope");
  assert.ok(result.ruleIds.includes("SCP-001"));
  assert.ok(result.blockedActions.includes("final_diagnosis"));
  assert.ok(result.allowedActions.includes("diagnosticPreclassificationCandidate"));
  assert.equal(result.auditEvents[0].eventType, "agent_constitution_scope_blocked");
});

test("diagnostic_preclassification with Method Kernel result and D2 trace is ready", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "diagnostic_preclassification",
    requestedOutputType: "diagnostic_preclassification",
    methodKernelResult: { readinessState: "ready_with_flags" },
    sourceTrace: [d1Trace, d2Trace],
  });

  assert.equal(result.readinessState, "ready_for_diagnostic_preclassification");
  assert.ok(result.allowedActions.includes("diagnosticPreclassificationCandidate"));
  assert.ok(result.ruleIds.includes("SRC-002"));
  assert.equal(
    result.auditEvents[0].eventType,
    "agent_constitution_diagnostic_preclassification_prepared",
  );
});

test("diagnostic_preclassification without Method Kernel result is blocked", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "diagnostic_preclassification",
    requestedOutputType: "diagnostic_preclassification",
    sourceTrace: [d1Trace, d2Trace],
  });

  assert.ok(
    ["blocked_by_missing_evidence", "manual_review_required"].includes(result.readinessState),
  );
  assert.ok(result.requiredInputs.includes("methodKernelResult"));
});

test("parallel preview or export without readiness is export_blocked", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "prepare_parallel_export_preview",
    requestedOutputType: "parallel_preview",
  });

  assert.equal(result.readinessState, "export_blocked");
  assert.ok(result.ruleIds.includes("PPI-001"));
  assert.ok(result.blockedActions.includes("production_payload_final"));
  assert.ok(result.blockedActions.includes("registry_export"));
  assert.equal(result.auditEvents[0].eventType, "agent_constitution_export_blocked");
});

test("invalid mode is rejected without throwing", () => {
  const input = {
    ...baseInput(),
    mode: "advisory",
  } as unknown as AgentConstitutionEvaluationInput;
  const result = evaluateAgentConstitutionShadow(input);

  assert.ok(["manual_review_required", "blocked_by_scope"].includes(result.readinessState));
  assert.equal(result.auditEvents[0].eventType, "agent_constitution_input_rejected");
  assert.ok(result.ruleIds.includes("SHADOW-INPUT-MODE"));
});

test("sensitive action without scope asks for clarification", () => {
  const result = evaluateAgentConstitutionShadow({
    ...baseInput(),
    requestedAction: "create_structural_candidate",
    inputClassification: "",
    targetBoundary: undefined,
  });

  assert.equal(result.readinessState, "clarification_required");
  assert.ok(result.requiredInputs.includes("scope"));
  assert.ok(result.requiredInputs.includes("targetBoundary"));
});

test("result never contains forbidden output fields or enabled authority", () => {
  const results = [
    evaluateAgentConstitutionShadow(baseInput()),
    evaluateAgentConstitutionShadow({
      ...baseInput(),
      requestedAction: "emit_final_diagnosis_from_Capa1",
      requestedOutputType: "final_diagnosis",
    }),
    evaluateAgentConstitutionShadow({
      ...baseInput(),
      requestedAction: "prepare_parallel_export_preview",
      requestedOutputType: "parallel_preview",
    }),
  ];

  for (const result of results) {
    const serialized = JSON.stringify(result);
    assert.doesNotMatch(serialized, /"finalDiagnosis"\s*:/);
    assert.doesNotMatch(serialized, /"raw_text_export"\s*:/);
    assert.doesNotMatch(serialized, /"untraceable_recommendation"\s*:/);
    assert.doesNotMatch(serialized, /"runtimeAuthority"\s*:\s*true/);
  }
});

test("service has no forbidden imports, storage access or registry write", () => {
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
    /produccion paralela real/i,
    /producción paralela real/i,
  ]) {
    assert.doesNotMatch(serviceSource, forbiddenPattern);
  }
});

test("ruleIds and sourceTrace appear in relevant decisions", () => {
  const results = [
    evaluateAgentConstitutionShadow(baseInput()),
    evaluateAgentConstitutionShadow({
      ...baseInput(),
      requestedAction: "diagnostic_preclassification",
      requestedOutputType: "diagnostic_preclassification",
      methodKernelResult: { readinessState: "ready" },
      sourceTrace: [d1Trace, d2Trace],
    }),
    evaluateAgentConstitutionShadow({
      ...baseInput(),
      requestedAction: "prepare_parallel_export_preview",
      requestedOutputType: "parallel_preview",
    }),
  ];

  for (const result of results) {
    assert.ok(result.ruleIds.length > 0);
    assert.ok(result.sourceTrace.length > 0);
    assert.ok(result.findings.every((finding) => finding.ruleId.length > 0));
  }
});
