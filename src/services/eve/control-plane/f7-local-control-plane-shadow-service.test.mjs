import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates local event ledger from F6 membrane result", () => {
  const result = run();

  assert.equal(result.event_ledger.length, 6);
  assert.ok(result.event_ledger.every((entry) => entry.report_only));
  assert.ok(result.event_ledger.every((entry) => entry.state === "recorded"));
});

test("creates local timer ledger report-only", () => {
  const result = run();

  assert.equal(result.timer_ledger.length, 4);
  assert.ok(result.timer_ledger.every((entry) => entry.report_only));
  assert.ok(result.timer_ledger.every((entry) => entry.blocks_operation === false));
});

test("creates local transition findings report-only", () => {
  const result = run();

  assert.ok(result.transition_findings.length >= 3);
  assert.ok(result.transition_findings.every((finding) => finding.report_only));
  assert.ok(
    result.transition_findings.every(
      (finding) => finding.operation_blocking_allowed === false,
    ),
  );
});

test("creates compliance report local", () => {
  const result = run();

  assert.equal(result.compliance_report.report_only, true);
  assert.equal(result.compliance_report.event_ledger_count, 6);
  assert.equal(result.compliance_report.timer_ledger_count, 4);
});

test("creates SG shadow signals report-only", () => {
  const result = run();

  assert.ok(result.soft_governance_shadow_signals.length >= 1);
  assert.ok(
    result.soft_governance_shadow_signals.every((signal) => signal.report_only),
  );
  assert.ok(
    result.soft_governance_shadow_signals.every(
      (signal) => signal.creates_workflow === false,
    ),
  );
  assert.ok(
    result.soft_governance_shadow_signals.every(
      (signal) => signal.creates_task === false,
    ),
  );
});

test("creates No-Go dashboard local", () => {
  const result = run();

  assert.equal(result.no_go_dashboard.no_go_triggered, false);
  assert.equal(result.no_go_dashboard.blockers_count, 0);
  assert.equal(result.no_go_dashboard.report_only, true);
  assert.equal(result.no_go_dashboard.checks.mba_written, false);
});

test("keeps operation, readiness and core mutation disabled", () => {
  const result = run();

  assert.ok(
    result.transition_findings.every(
      (finding) => finding.operation_blocking_allowed === false,
    ),
  );
  assert.ok(
    result.transition_findings.every(
      (finding) => finding.readiness_mutation_allowed === false,
    ),
  );
  assert.ok(
    result.transition_findings.every(
      (finding) => finding.core_state_mutation_allowed === false,
    ),
  );
  assert.equal(result.no_go.operation_blocked, false);
  assert.equal(result.no_go.readiness_mutated, false);
  assert.equal(result.no_go.core_state_mutated, false);
});

test("keeps governance, enforcement, workflow, task and mba writes disabled", () => {
  const result = run();

  assert.equal(result.compliance_report.soft_governance_activated, false);
  assert.equal(result.compliance_report.enforcement_activated, false);
  assert.equal(result.compliance_report.workflow_created, false);
  assert.equal(result.no_go.soft_governance_activated, false);
  assert.equal(result.no_go.enforcement_activated, false);
  assert.equal(result.no_go.workflow_created, false);
  assert.equal(result.no_go.task_created, false);
  assert.equal(result.no_go.mba_written, false);
});

test("keeps Control Plane, SG Shadow, Runtime and Production real closed", () => {
  const result = run();

  assert.equal(result.no_go.control_plane_real_opened, false);
  assert.equal(result.no_go.sg_shadow_real_opened, false);
  assert.equal(result.no_go.runtime_40_20_full_opened, false);
  assert.equal(result.no_go.production_integration_opened, false);
});

test("keeps diagnosis, registry, IR, export and Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps Supabase, SQL and env false", () => {
  const result = run();

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
});

test("returns ok=false if F6 membrane input is not local-safe", () => {
  const f6 = f6Result();
  f6.ok = false;
  const result = run({ f6_membrane_result: f6 });

  assert.equal(result.ok, false);
  assert.ok(
    result.transition_findings.some(
      (finding) => finding.finding_type === "handoff_blocked",
    ),
  );
  assert.equal(result.no_go.control_plane_real_opened, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.report_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runF7LocalControlPlaneShadow({
    case_id: "case:f7",
    f6_membrane_result: f6Result(),
    ...overrides,
  });
}

function f6Result() {
  return {
    ok: true,
    case_id: "case:f7",
    outbox: {
      outbox_id: "F6_LOCAL_OUTBOX:case:f7",
      case_id: "case:f7",
      source_l8_ref: "L8_LOCAL_CHAIN:case:f7",
      source_f5c_ref: "F5C_LOCAL_BINDING:case:f7",
      target_consumer: "future_parallel_production_candidate",
      state: "handoff_ready_local",
      allowed_to_leave_membrane: true,
      restrictions: ["export_blocked"],
      governance_issue_refs: [],
      audit_log: [],
    },
    snapshot: {
      snapshot_id: "F6_LOCAL_SNAPSHOT:case:f7",
      case_id: "case:f7",
      source_l8_ref: "L8_LOCAL_CHAIN:case:f7",
      source_f5c_ref: "F5C_LOCAL_BINDING:case:f7",
      local_only: true,
      bindings_count: 3,
      materialization_events_count: 2,
      binding_blocks_count: 0,
      deferred_bindings_count: 0,
      review_required_count: 0,
      restrictions: ["export_blocked"],
      checksum_like_ref: "F6_LOCAL_CHECKSUM:1",
      state: "created",
      audit_log: [],
    },
    handoff_boundary_decision: {
      decision_id: "F6_LOCAL_HANDOFF_DECISION:case:f7",
      case_id: "case:f7",
      decision: "local_handoff_ready",
      allowed_consumers: [
        "future_parallel_production_candidate",
        "control_plane_summary",
      ],
      blocked_consumers: [
        "registry",
        "IR",
        "export",
        "diagnosis",
        "runtime_40_20_full",
        "production_integration",
      ],
      reason: "local_handoff_candidate_only_not_production_integration",
      governance_issue_refs: [],
    },
    export_boundary_check: {
      export_boundary_check_id: "F6_LOCAL_EXPORT_BOUNDARY:case:f7",
      case_id: "case:f7",
      export_allowed: false,
      export_code_package_created: false,
      reason: "export_not_authorized_in_local_membrane",
      blocked_targets: [
        "ExportCodePackage",
        "DiagrammingExportPackage",
        "IR",
        "registry",
        "diagnosis",
      ],
      governance_issue_refs: [],
    },
    review_control_record: {
      review_control_id: "F6_LOCAL_REVIEW_CONTROL:case:f7",
      case_id: "case:f7",
      review_required: false,
      reason: "local_membrane_review_not_required",
      linked_binding_blocks: [],
      linked_restrictions: ["export_blocked"],
      state: "not_required",
      audit_log: [],
    },
    membrane_projection_summary: {
      projection_summary_id: "F6_LOCAL_PROJECTION_SUMMARY:case:f7",
      case_id: "case:f7",
      summary_only: true,
      l8_local_materiality_confirmed: true,
      f5c_local_binding_confirmed: true,
      handoff_decision: "local_handoff_ready",
      export_allowed: false,
      diagnosis_allowed: false,
      production_integration_allowed: false,
      runtime_40_20_full_allowed: false,
    },
    governance_issue_refs: [],
    no_go: {
      runtime_40_20_full_opened: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      integration_membrane_real_opened: false,
      production_integration_opened: false,
      control_plane_real_opened: false,
      sg_shadow_real_opened: false,
      diagnosis_created: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      delivered_created: false,
      delivery_authorized: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    materiality: {
      level: "f6_local_membrane_readiness",
      local_only: true,
      production_integration: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./f7-local-control-plane-shadow-service.ts", import.meta.url),
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
      if (specifier === "./f7-local-control-plane-shadow-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "f7-local-control-plane-shadow-service.ts",
  });

  return context.exports;
}
