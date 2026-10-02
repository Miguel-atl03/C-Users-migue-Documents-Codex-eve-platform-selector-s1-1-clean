import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates PreclassificationRecord as signal-only", () => {
  const result = materialize();
  assert.equal(result.ok, true);
  assert.equal(result.preclassification_record.state, "signal_only_accepted");
  assert.equal(result.issue.issue_type, "None");
});

test("enforces interpretation_limit = non_diagnostic_preclassification_only", () => {
  const defaulted = materialize({ interpretation_limit: undefined });
  assert.equal(
    defaulted.preclassification_record.interpretation_limit,
    "non_diagnostic_preclassification_only",
  );

  const blocked = materialize({
    interpretation_limit: "diagnostic",
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.preclassification_record.state, "contamination_blocked");
  assert.ok(
    blocked.governance_issue_refs.includes(
      "B7_BOUNDARY_INVALID_INTERPRETATION_LIMIT",
    ),
  );
});

test("emits NoRenderZone", () => {
  const result = materialize();
  assert.equal(result.no_render_zone.state, "active");
  assert.equal(result.no_render_zone.active, true);
  assert.ok(result.no_render_zone.blocked_targets.includes("B7_to_registry"));
  assert.ok(result.no_render_zone.blocked_targets.includes("B7_to_IR"));
  assert.ok(result.no_render_zone.blocked_targets.includes("B7_to_export"));
  assert.ok(result.no_render_zone.blocked_targets.includes("B7_to_diagnosis"));
});

test("blocks B7-only structural fact", () => {
  const result = materialize({ attempted_consumer: "structural_fact" });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "TransductionBlocker");
  assert.equal(result.issue.affected_gate, "transduction");
  assert.ok(
    result.governance_issue_refs.includes(
      "B7_BOUNDARY_CONTAMINATION_STRUCTURAL_FACT",
    ),
  );
});

test("blocks B7-to-registry projection", () => {
  const result = materialize({ attempted_consumer: "registry" });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "GovernanceIssue");
  assert.equal(result.issue.affected_gate, "registry");
  assert.ok(
    result.governance_issue_refs.includes("B7_BOUNDARY_CONTAMINATION_REGISTRY"),
  );
});

test("blocks B7-to-IR projection", () => {
  const result = materialize({ attempted_consumer: "IR" });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "GovernanceIssue");
  assert.equal(result.issue.affected_gate, "IR");
  assert.ok(result.governance_issue_refs.includes("B7_BOUNDARY_CONTAMINATION_IR"));
});

test("blocks B7-to-export render", () => {
  const result = materialize({ attempted_consumer: "export" });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "ExportBlocker");
  assert.equal(result.issue.affected_gate, "export");
  assert.ok(
    result.governance_issue_refs.includes("B7_BOUNDARY_CONTAMINATION_EXPORT"),
  );
});

test("blocks B7-to-diagnosis", () => {
  const result = materialize({ attempted_consumer: "diagnosis" });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "TransductionBlocker");
  assert.equal(result.issue.affected_gate, "diagnosis");
  assert.ok(
    result.governance_issue_refs.includes("B7_BOUNDARY_CONTAMINATION_DIAGNOSIS"),
  );
});

test("blocks B7-to-OperationalExceptionEvidence", () => {
  const result = materialize({
    attempted_consumer: "OperationalExceptionEvidence",
  });
  assert.equal(result.ok, false);
  assert.equal(result.issue.issue_type, "GovernanceIssue");
  assert.equal(result.issue.affected_gate, "operational_exception");
  assert.ok(result.governance_issue_refs.includes("B7_BOUNDARY_CONTAMINATION_OEE"));
});

test("allows EvidenceBundle summary / signal-only use", () => {
  const result = materialize();
  assert.ok(
    result.preclassification_record.allowed_consumers.includes(
      "EvidenceBundle summary",
    ),
  );
  assert.ok(
    result.preclassification_record.allowed_consumers.includes("signal-only use"),
  );
});

test("preserves source_b7_ref and derivation_ref", () => {
  const result = materialize();
  assert.equal(result.preclassification_record.source_b7_ref, "source:b7:1");
  assert.equal(result.preclassification_record.derivation_ref, "derivation:1");
});

test("creates GovernanceIssue / TransductionBlocker / ExportBlocker on contamination attempt", () => {
  assert.equal(
    materialize({ attempted_consumer: "registry" }).issue.issue_type,
    "GovernanceIssue",
  );
  assert.equal(
    materialize({ attempted_consumer: "diagnosis" }).issue.issue_type,
    "TransductionBlocker",
  );
  assert.equal(
    materialize({ attempted_consumer: "export" }).issue.issue_type,
    "ExportBlocker",
  );
});

test("does not modify B3", () => {
  const result = materialize();
  assert.equal(result.b3_b7_alignment_delta.b3_untouched, true);
  assert.equal(result.no_go.b3_modified, false);
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
  assert.equal(
    result.materiality.marker_candidate,
    "B7_FIRST_CLASS_MATERIALITY_MARKER",
  );
});

function materialize(overrides = {}) {
  return service.materializeB7PreclassificationBoundary({
    b7_input: {
      case_id: "case:1",
      scene_id: "scene:1",
      source_b7_ref: "source:b7:1",
      derivation_ref: "derivation:1",
      preclassification_ahe_level_dominant: "interpersonal",
      preclassification_interpersonal_signal: "handoff tension",
      preclassification_interpersonal_note: "senal preliminar no diagnostica",
      preclassification_interpersonal_confirmation: "pending",
      preclassification_ahe_bundle_refined: "bundle:b7:1",
      interpretation_limit: "non_diagnostic_preclassification_only",
      attempted_consumer: "none",
      ...overrides,
    },
  });
}

function loadService() {
  const source = readFileSync(
    new URL("./b7-preclassification-boundary-service.ts", import.meta.url),
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
      if (specifier === "./b7-preclassification-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "b7-preclassification-boundary-service.ts",
  });

  return context.exports;
}
