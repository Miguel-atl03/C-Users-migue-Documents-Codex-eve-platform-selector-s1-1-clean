import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates local Fase2BaselineRecord from valid F8 result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.baseline_record.case_id, "case:fase2");
  assert.equal(result.baseline_record.local_only, true);
  assert.equal(result.baseline_record.state, "partial_baseline_with_blocks");
});

test("creates local Fase2HandoffDecision", () => {
  const result = run();

  assert.equal(
    result.handoff_decision.decision,
    "local_handoff_ready_with_restrictions",
  );
  assertJsonEqual(result.handoff_decision.allowed_destinations, [
    "qa_audit",
    "control_plane_summary",
    "future_phase3_candidate",
  ]);
});

test("creates source object manifest with six local source objects", () => {
  const result = run();

  assert.equal(result.baseline_record.source_object_manifest.length, 6);
  assertJsonEqual(
    result.baseline_record.source_object_manifest.map((item) => item.object_name),
    [
      "MDSBHandoffCandidate",
      "DesignReadinessAssessment",
      "NoGoParallelProductionCheck",
      "ObjectCandidateLinkageCheck",
      "RuntimeEvidenceBundleReference",
      "SGShadowParallelAuditNote",
    ],
  );
  assert.ok(
    result.baseline_record.source_object_manifest.every(
      (item) =>
        item.consumable_locally === true &&
        item.consumable_productively === false,
    ),
  );
});

test("creates approved object set only for local summary and future candidate destinations", () => {
  const result = run();

  assertJsonEqual(result.baseline_record.approved_object_set, [
    "qa_audit",
    "control_plane_summary",
    "future_phase3_candidate",
  ]);
  assert.equal(result.baseline_record.approved_object_set.includes("registry"), false);
  assert.equal(result.baseline_record.approved_object_set.includes("IR"), false);
  assert.equal(result.baseline_record.approved_object_set.includes("export"), false);
  assert.equal(
    result.baseline_record.approved_object_set.includes("diagnosis"),
    false,
  );
});

test("blocks registry destination", () => {
  const result = run();

  assertDestinationBlocked(result, "registry");
});

test("blocks IR destination", () => {
  const result = run();

  assertDestinationBlocked(result, "IR");
});

test("blocks export destination", () => {
  const result = run();

  assertDestinationBlocked(result, "export");
});

test("blocks diagnosis destination", () => {
  const result = run();

  assertDestinationBlocked(result, "diagnosis");
});

test("blocks phase3_real destination", () => {
  const result = run();

  assertDestinationBlocked(result, "phase3_real");
});

test("blocks production_parallel_real destination", () => {
  const result = run();

  assertDestinationBlocked(result, "production_parallel_real");
});

test("creates handoff matrix", () => {
  const result = run();

  assert.equal(result.handoff_matrix.length, 54);
  assertDestinationAllowed(result, "qa_audit");
  assertDestinationAllowed(result, "control_plane_summary");
  assertDestinationAllowed(result, "future_phase3_candidate");
});

test("creates inventory update candidate with updates_inventory_real=false", () => {
  const result = run();

  assert.equal(result.inventory_update_candidate.candidate_only, true);
  assert.equal(result.inventory_update_candidate.updates_inventory_real, false);
  assert.equal(
    result.inventory_update_candidate.source_baseline_ref,
    result.baseline_record.baseline_id,
  );
});

test("creates Phase3 boundary check with phase3_real_opening_allowed=false", () => {
  const result = run();

  assert.equal(
    result.phase3_opening_boundary_check.phase3_real_opening_allowed,
    false,
  );
  assert.equal(
    result.phase3_opening_boundary_check.vsm_ahe_diagnosis_allowed,
    false,
  );
});

test("blocks if F8 input is not local-safe", () => {
  const f8 = f8Result();
  f8.ok = false;
  const result = run({ f8_rehearsal_result: f8 });

  assert.equal(result.ok, false);
  assert.equal(result.baseline_record.state, "blocked_by_phase_gap");
  assert.equal(result.handoff_decision.decision, "handoff_blocked");
  assert.equal(result.blocked_reason, "f8_rehearsal_not_local_safe");
});

test("keeps registry IR export diagnosis and Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.export_code_package_created, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps inventory_real_updated=false", () => {
  const result = run();

  assert.equal(result.no_go.inventory_real_updated, false);
});

test("keeps readiness and core mutations false", () => {
  const result = run();

  assert.equal(result.no_go.readiness_mutated, false);
  assert.equal(result.no_go.core_state_mutated, false);
});

test("keeps workflow task and operation blocking false", () => {
  const result = run();

  assert.equal(result.no_go.workflow_created, false);
  assert.equal(result.no_go.task_created, false);
  assert.equal(result.no_go.operation_blocked, false);
});

test("keeps mba_written=false", () => {
  const result = run();

  assert.equal(result.no_go.mba_written, false);
});

test("keeps parallel_production_artifacts_written=false", () => {
  const result = run();

  assert.equal(result.no_go.parallel_production_artifacts_written, false);
});

test("keeps Supabase SQL and env false", () => {
  const result = run();

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.next_authorization_required, true);
  assert.equal(result.no_go.production_parallel_real_opened, false);
  assert.equal(result.no_go.phase3_real_opened, false);
});

function run(overrides = {}) {
  return service.runFase2BaselineHandoffLocalControl({
    case_id: "case:fase2",
    f8_rehearsal_result: f8Result(),
    ...overrides,
  });
}

function assertDestinationBlocked(result, destination) {
  assert.ok(result.baseline_record.blocked_object_set.includes(destination));
  assert.ok(result.handoff_decision.blocked_destinations.includes(destination));
  assert.ok(
    result.handoff_matrix.some(
      (entry) => entry.destination === destination && entry.allowed === false,
    ),
  );
}

function assertDestinationAllowed(result, destination) {
  assert.ok(
    result.handoff_matrix.some(
      (entry) => entry.destination === destination && entry.allowed === true,
    ),
  );
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function f8Result() {
  return {
    ok: true,
    case_id: "case:fase2",
    rehearsal_run: {
      rehearsal_run_id: "F8_LOCAL_REHEARSAL:case:fase2",
      case_id: "case:fase2",
      state: "rehearsal_ready_local",
      source_f6_ref: "F6_LOCAL_OUTBOX:case:fase2",
      source_f7_ref: "F7_LOCAL_COMPLIANCE_REPORT:case:fase2",
      local_only: true,
      production_integration: false,
      audit_log: [],
    },
    mdsb_handoff_candidate: {
      mdsb_handoff_candidate_id: "F8_LOCAL_MDSB_CANDIDATE:case:fase2",
      case_id: "case:fase2",
      source_outbox_ref: "F6_LOCAL_OUTBOX:case:fase2",
      source_snapshot_ref: "F6_LOCAL_SNAPSHOT:case:fase2",
      source_summary_projection_ref: "F6_LOCAL_PROJECTION_SUMMARY:case:fase2",
      candidate_only: true,
      allowed_consumers: [
        "future_mdsb_candidate",
        "qa_audit",
        "control_plane_summary",
      ],
      forbidden_consumers: [
        "registry",
        "IR",
        "export",
        "diagnosis",
        "production_parallel_real",
      ],
      governance_issue_refs: [],
    },
    design_readiness_assessment: {
      assessment_id: "F8_LOCAL_DESIGN_READINESS:case:fase2",
      case_id: "case:fase2",
      outcome: "ready_for_local_rehearsal",
      dominant_gate: "no_go",
      ready_for_real_parallel_production: false,
      ready_for_registry: false,
      ready_for_ir: false,
      ready_for_export: false,
      restrictions: [
        "production_parallel_real_blocked",
        "registry_blocked",
        "ir_blocked",
        "export_blocked",
        "diagnosis_blocked",
      ],
      governance_issue_refs: [],
    },
    no_go_parallel_production_check: {
      no_go_check_id: "F8_LOCAL_NO_GO_PP:case:fase2",
      case_id: "case:fase2",
      no_go_triggered: false,
      production_parallel_real_allowed: false,
      registry_allowed: false,
      ir_allowed: false,
      export_allowed: false,
      diagnosis_allowed: false,
      export_code_package_created: false,
      blockers_count: 0,
      warnings: [
        "production_parallel_real_blocked",
        "registry_blocked",
        "ir_blocked",
        "export_blocked",
        "diagnosis_blocked",
      ],
    },
    object_candidate_linkage_check: {
      linkage_check_id: "F8_LOCAL_OBJECT_LINKAGE:case:fase2",
      case_id: "case:fase2",
      source_bindings_seen: 3,
      materialization_events_seen: 2,
      object_candidate_linkage_ok: true,
      unresolved_object_refs: [],
      review_required_refs: [],
      local_only: true,
    },
    runtime_evidence_bundle_reference: {
      runtime_evidence_bundle_reference_id: "F8_LOCAL_EVIDENCE_REF:case:fase2",
      case_id: "case:fase2",
      source_membrane_snapshot_ref: "F6_LOCAL_SNAPSHOT:case:fase2",
      evidence_reference_only: true,
      mutates_evidence_bundle: false,
      mutates_readiness: false,
    },
    sg_shadow_parallel_audit_note: {
      audit_note_id: "F8_LOCAL_SG_AUDIT_NOTE:case:fase2",
      case_id: "case:fase2",
      source_compliance_report_ref: "F7_LOCAL_COMPLIANCE_REPORT:case:fase2",
      report_only: true,
      creates_workflow: false,
      creates_task: false,
      blocks_operation: false,
      note: "SG Shadow remains report-only for local parallel production rehearsal.",
    },
    governance_issue_refs: [],
    no_go: {
      runtime_40_20_full_opened: false,
      production_parallel_real_opened: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      export_code_package_created: false,
      diagnosis_created: false,
      delivered_created: false,
      delivery_authorized: false,
      evidence_bundle_mutated: false,
      readiness_mutated: false,
      core_state_mutated: false,
      workflow_created: false,
      task_created: false,
      operation_blocked: false,
      mba_written: false,
      parallel_production_artifacts_written: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    materiality: {
      level: "f8_local_parallel_production_rehearsal_readiness",
      local_only: true,
      report_only: true,
      production_integration: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./fase2-baseline-handoff-local-service.ts", import.meta.url),
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
      if (specifier === "./fase2-baseline-handoff-local-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "fase2-baseline-handoff-local-service.ts",
  });

  return context.exports;
}
