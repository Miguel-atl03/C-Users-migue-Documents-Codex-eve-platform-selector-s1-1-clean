import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("rejects receiver_satisfaction as feedback", () => {
  const result = materialize({ receiver_feedback_route_status: "satisfaction_only" });
  assert.equal(result.ok, false);
  assert.equal(result.receiver_feedback_object.state, "rejected_as_satisfaction_only");
  assert.equal(result.issue_type, "None");
  assert.equal(result.operational_exception_evidence, undefined);
  assert.equal(result.no_go.satisfaction_promoted_to_feedback, false);
});

test("creates ReceiverFeedbackObject from B3/3.13a receiver_feedback", () => {
  const result = materialize();
  assert.equal(result.ok, true);
  assert.equal(result.receiver_feedback_object.canonical_route_ref, "B3/3.13a/receiver_feedback");
  assert.equal(result.receiver_feedback_object.state, "operationally_relevant");
});

test("creates OperationalExceptionEvidence when feedback is operationally material", () => {
  const result = materialize();
  assert.equal(result.operational_exception_evidence.subtype, "receiver_feedback");
  assert.equal(result.operational_exception_evidence.state, "ready_for_bundle");
  assert.equal(result.issue_type, "OperationalExceptionEvidence");
});

test("creates CanonicalRouteException if feedback text lacks canonical route", () => {
  const result = materialize({
    receiver_feedback_route_status: "route_missing",
    canonical_route_ref: undefined,
  });
  assert.equal(result.ok, false);
  assert.equal(result.issue_type, "CanonicalRouteException");
  assert.ok(result.governance_issue_refs.includes("B3_CANONICAL_ROUTE_EXCEPTION"));
});

test("creates GapObject if delivery failure exists but feedback is unknown", () => {
  const result = materialize({
    receiver_feedback_route_status: "gap_unknown",
    receiver_feedback_exists: false,
    receiver_feedback_literal: undefined,
    delivery_failure_known: true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.issue_type, "GapObject");
  assert.ok(result.governance_issue_refs.includes("B3_RECEIVER_FEEDBACK_GAP"));
});

test("blocks PF/OLC candidate when route_missing", () => {
  const result = materialize({ receiver_feedback_route_status: "route_missing" });
  assert.equal(result.receiver_feedback_object.state, "blocked_by_missing_canonical_route");
  assert.equal(result.operational_exception_evidence, undefined);
});

test("allows downstream candidate only with route_validated", () => {
  const result = materialize();
  assert.equal(result.ok, true);
  assert.equal(result.b3_b7_alignment_delta.state, "ready_for_bundle");
});

test("records allowed_consumers correctly", () => {
  const result = materialize();
  assert.ok(result.receiver_feedback_object.allowed_consumers.includes("EvidenceBundle"));
  assert.ok(result.receiver_feedback_object.allowed_consumers.includes("OperationalExceptionEvidence"));
});

test("preserves source_ref and derivation_ref", () => {
  const result = materialize();
  assert.equal(result.operational_exception_evidence.source_ref, "source:1");
  assert.equal(result.operational_exception_evidence.derivation_ref, "derivation:1");
});

test("does not create feedback without source_ref", () => {
  const result = materialize({ source_ref: undefined });
  assert.equal(result.ok, false);
  assert.ok(result.governance_issue_refs.includes("B3_MISSING_SOURCE_REF"));
  assert.equal(result.no_go.feedback_created_without_source_ref, false);
});

test("does not create feedback without derivation_ref", () => {
  const result = materialize({ derivation_ref: undefined });
  assert.equal(result.ok, false);
  assert.ok(result.governance_issue_refs.includes("B3_MISSING_DERIVATION_REF"));
  assert.equal(result.no_go.feedback_created_without_derivation_ref, false);
});

test("does not promote B7 to OEE", () => {
  const result = materialize();
  assert.equal(result.b3_b7_alignment_delta.b7_boundary_untouched, true);
  assert.equal(result.b3_b7_alignment_delta.b7_not_promoted_to_oee, true);
  assert.equal(result.no_go.b7_promoted_to_oee, false);
});

test("does not create diagnosis", () => {
  assert.equal(materialize().no_go.diagnosis_created, false);
});

test("does not create registry", () => {
  assert.equal(materialize().no_go.registry_created, false);
});

test("does not create IR", () => {
  assert.equal(materialize().no_go.ir_created, false);
});

test("does not create export", () => {
  assert.equal(materialize().no_go.export_created, false);
});

test("does not open Runtime 40/20 full", () => {
  assert.equal(materialize().no_go.runtime_40_20_full_opened, false);
});

test("returns materiality level L6 service_present", () => {
  const result = materialize();
  assert.equal(result.materiality.level, "L6 service_present");
  assert.equal(result.materiality.marker_candidate, "B3_FIRST_CLASS_MATERIALITY_MARKER");
});

function materialize(overrides = {}) {
  return service.materializeB3ReceiverFeedback({
    b3_input: {
      case_id: "case:1",
      scene_id: "scene:1",
      output_handoff_ref: "handoff:1",
      receiver_satisfaction_value: "satisfecho",
      receiver_feedback_exists: true,
      receiver_feedback_literal: "el receptor no puede usar el entregable",
      receiver_feedback_type: "operational_blocker",
      receiver_feedback_route_status: "route_validated",
      canonical_route_ref: "B3/3.13a/receiver_feedback",
      source_ref: "source:1",
      derivation_ref: "derivation:1",
      delivery_failure_known: true,
      ...overrides,
    },
  });
}

function loadService() {
  const source = readFileSync(
    new URL("./b3-receiver-feedback-materializer.ts", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    exports: {},
    require(specifier) {
      if (specifier === "./b3-feedback-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "b3-receiver-feedback-materializer.ts",
  });

  return context.exports;
}

