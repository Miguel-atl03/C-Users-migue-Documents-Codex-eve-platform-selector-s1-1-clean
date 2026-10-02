import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  MethodKernelEvaluationInput,
  MethodKernelSourceRef,
} from "../../src/domain/method-kernel-evaluation.ts";
import { evaluateMethodKernelShadow } from "../../src/services/method-kernel-shadow-evaluator.ts";

const servicePath = "src/services/method-kernel-shadow-evaluator.ts";
const forbiddenRuntimeState = "blocked_by_missing_canonical_route";

const sourceRef: MethodKernelSourceRef = {
  sourceId: "D1:FBA",
  locator: "fixture",
};

function baseInput(): MethodKernelEvaluationInput {
  return {
    mode: "shadow",
    evidenceItems: [
      {
        evidenceItemId: "ev-pm",
        value: "PM evidence",
        epistemicStatus: "captured_user_evidence",
        sourceRefs: [sourceRef],
      },
      {
        evidenceItemId: "ev-moc",
        value: "MoC evidence",
        epistemicStatus: "user_confirmed_suggestion",
        sourceRefs: [sourceRef],
      },
      {
        evidenceItemId: "ev-pf",
        value: "PF evidence",
        epistemicStatus: "user_corrected_evidence",
        sourceRefs: [sourceRef],
      },
      {
        evidenceItemId: "ev-olc",
        value: "OLC evidence",
        epistemicStatus: "canonical_derivation",
        sourceRefs: [sourceRef],
      },
    ],
    candidates: [
      {
        candidateId: "pm-1",
        model: "PM",
        label: "PM candidate",
        evidenceItemIds: ["ev-pm"],
        sourceRefs: [sourceRef],
      },
      {
        candidateId: "moc-1",
        model: "MoC",
        label: "MoC candidate",
        evidenceItemIds: ["ev-moc"],
        sourceRefs: [sourceRef],
      },
      {
        candidateId: "pf-1",
        model: "PF",
        label: "PF candidate",
        evidenceItemIds: ["ev-pf"],
        sourceRefs: [sourceRef],
      },
      {
        candidateId: "olc-1",
        model: "OLC",
        label: "OLC candidate",
        evidenceItemIds: ["ev-olc"],
        sourceRefs: [sourceRef],
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test("evaluateMethodKernelShadow returns shadow V1 metadata and safe flags", () => {
  const result = evaluateMethodKernelShadow(baseInput());

  assert.equal(result.version, "EVE_00_METHOD_KERNEL_SHADOW_V1");
  assert.equal(result.mode, "shadow");
  assert.equal(result.canBlockUserFlow, false);
  assert.equal(result.canModifyPayload, false);
  assert.equal(result.canWriteRegistry, false);
  assert.equal(result.canTriggerDiagnosis, false);
  assert.equal(result.runtimeAuthority, false);
});

test("no candidates produces blocked_by_missing_evidence", () => {
  const input = baseInput();
  input.candidates = [];

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.equal(result.findings[0].ruleId, "FND-002");
  assert.equal(result.auditEvents[0].eventType, "method_kernel_missing_evidence_detected");
});

test("candidate without sourceRefs produces blocked_by_missing_evidence", () => {
  const input = baseInput();
  input.candidates[0] = {
    ...input.candidates[0],
    sourceRefs: [],
  };

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.findings.some((finding) => finding.ruleId === "FND-007"));
});

test("evidence without sourceRefs produces manual_review_required", () => {
  const input = baseInput();
  input.evidenceItems[0] = {
    ...input.evidenceItems[0],
    sourceRefs: [],
  };

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "manual_review_required");
  assert.ok(result.findings.some((finding) => finding.ruleId === "FND-007"));
});

test("missing evidenceItemIds produces blocked_by_missing_evidence", () => {
  const input = baseInput();
  input.candidates[0] = {
    ...input.candidates[0],
    evidenceItemIds: ["missing-evidence"],
  };

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "blocked_by_missing_evidence");
  assert.ok(result.findings.some((finding) => finding.evidenceItemIds.includes("missing-evidence")));
});

test("PM/MoC/PF/OLC with evidence and sourceRefs produces ready", () => {
  const result = evaluateMethodKernelShadow(baseInput());

  assert.equal(result.readinessState, "ready");
  assert.deepEqual(result.findings, []);
  assert.equal(result.auditEvents[0].eventType, "method_kernel_shadow_evaluated");
});

test("partial valid candidates produce ready_with_flags", () => {
  const input = baseInput();
  input.candidates = input.candidates.slice(0, 2);

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "ready_with_flags");
  assert.ok(result.findings.some((finding) => finding.state === "ready_with_flags"));
});

test("non-shadow mode is rejected without throwing", () => {
  const input = {
    ...baseInput(),
    mode: "advisory",
  } as unknown as MethodKernelEvaluationInput;

  const result = evaluateMethodKernelShadow(input);

  assert.equal(result.readinessState, "manual_review_required");
  assert.equal(result.auditEvents[0].eventType, "method_kernel_input_rejected");
  assert.equal(result.canBlockUserFlow, false);
});

test("result never contains Runtime canonical route state", () => {
  const result = evaluateMethodKernelShadow(baseInput());
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes(forbiddenRuntimeState), false);
});

test("input is not mutated", () => {
  const input = baseInput();
  const before = clone(input);

  evaluateMethodKernelShadow(input);

  assert.deepEqual(input, before);
});

test("service stays isolated from product flows and docs chip package", () => {
  const serviceSource = readFileSync(servicePath, "utf8");

  for (const forbiddenPattern of [
    /WorkMap/i,
    /Significado/i,
    /runtime-engine/i,
    /runtime-block0/i,
    /Supabase/i,
    /page\.tsx/i,
    /docs\/chips/i,
    /localStorage/i,
    /window\./i,
    /fetch\(/i,
  ]) {
    assert.doesNotMatch(serviceSource, forbiddenPattern);
  }
});

