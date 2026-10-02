import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates local rehearsal run from valid F6 and F7 results", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.rehearsal_run.state, "rehearsal_ready_local");
  assert.equal(result.rehearsal_run.local_only, true);
  assert.equal(result.rehearsal_run.production_integration, false);
});

test("creates MDSB handoff candidate as candidate_only", () => {
  const result = run();

  assert.equal(result.mdsb_handoff_candidate.candidate_only, true);
  assert.ok(
    result.mdsb_handoff_candidate.forbidden_consumers.includes("registry"),
  );
  assert.ok(result.mdsb_handoff_candidate.forbidden_consumers.includes("IR"));
  assert.ok(result.mdsb_handoff_candidate.forbidden_consumers.includes("export"));
  assert.ok(
    result.mdsb_handoff_candidate.forbidden_consumers.includes("diagnosis"),
  );
  assert.ok(
    result.mdsb_handoff_candidate.forbidden_consumers.includes(
      "production_parallel_real",
    ),
  );
});

test("creates design readiness assessment with real targets false", () => {
  const result = run();

  assert.equal(
    result.design_readiness_assessment.outcome,
    "ready_for_local_rehearsal",
  );
  assert.equal(
    result.design_readiness_assessment.ready_for_real_parallel_production,
    false,
  );
  assert.equal(result.design_readiness_assessment.ready_for_registry, false);
  assert.equal(result.design_readiness_assessment.ready_for_ir, false);
  assert.equal(result.design_readiness_assessment.ready_for_export, false);
});

test("creates No-Go parallel production check", () => {
  const result = run();

  assert.equal(result.no_go_parallel_production_check.no_go_triggered, false);
  assert.equal(
    result.no_go_parallel_production_check.production_parallel_real_allowed,
    false,
  );
  assert.equal(result.no_go_parallel_production_check.registry_allowed, false);
  assert.equal(result.no_go_parallel_production_check.ir_allowed, false);
  assert.equal(result.no_go_parallel_production_check.export_allowed, false);
  assert.equal(result.no_go_parallel_production_check.diagnosis_allowed, false);
  assert.equal(
    result.no_go_parallel_production_check.export_code_package_created,
    false,
  );
});

test("creates object candidate linkage check", () => {
  const result = run();

  assert.equal(result.object_candidate_linkage_check.source_bindings_seen, 3);
  assert.equal(
    result.object_candidate_linkage_check.materialization_events_seen,
    2,
  );
  assert.equal(
    result.object_candidate_linkage_check.object_candidate_linkage_ok,
    true,
  );
  assert.equal(result.object_candidate_linkage_check.local_only, true);
});

test("creates runtime evidence bundle reference as reference-only", () => {
  const result = run();

  assert.equal(
    result.runtime_evidence_bundle_reference.evidence_reference_only,
    true,
  );
  assert.equal(
    result.runtime_evidence_bundle_reference.mutates_evidence_bundle,
    false,
  );
  assert.equal(result.runtime_evidence_bundle_reference.mutates_readiness, false);
});

test("creates SG Shadow parallel audit note report-only", () => {
  const result = run();

  assert.equal(result.sg_shadow_parallel_audit_note.report_only, true);
  assert.equal(result.sg_shadow_parallel_audit_note.creates_workflow, false);
  assert.equal(result.sg_shadow_parallel_audit_note.creates_task, false);
  assert.equal(result.sg_shadow_parallel_audit_note.blocks_operation, false);
});

test("blocks if F6 membrane is not local-safe", () => {
  const f6 = f6Result();
  f6.ok = false;
  const result = run({ f6_membrane_result: f6 });

  assert.equal(result.ok, false);
  assert.equal(result.rehearsal_run.state, "rehearsal_blocked");
  assert.equal(result.design_readiness_assessment.outcome, "blocked");
  assert.equal(result.blocked_reason, "f6_membrane_not_local_safe");
});

test("blocks if F7 shadow result is not report-only safe", () => {
  const f7 = f7Result();
  f7.ok = false;
  const result = run({ f7_shadow_result: f7 });

  assert.equal(result.ok, false);
  assert.equal(result.rehearsal_run.state, "rehearsal_blocked");
  assert.equal(result.design_readiness_assessment.outcome, "blocked");
  assert.equal(result.blocked_reason, "f7_shadow_not_report_only_safe");
});

test("keeps production, registry, IR, export and ExportCodePackage closed", () => {
  const result = run();

  assert.equal(result.no_go.production_parallel_real_opened, false);
  assert.equal(result.no_go.registry_created, false);
  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.export_code_package_created, false);
});

test("keeps diagnosis, Delivered and delivery authorization false", () => {
  const result = run();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps EvidenceBundle, readiness and core mutations false", () => {
  const result = run();

  assert.equal(result.no_go.evidence_bundle_mutated, false);
  assert.equal(result.no_go.readiness_mutated, false);
  assert.equal(result.no_go.core_state_mutated, false);
});

test("keeps workflow, task, operation blocking, mba and artifacts false", () => {
  const result = run();

  assert.equal(result.no_go.workflow_created, false);
  assert.equal(result.no_go.task_created, false);
  assert.equal(result.no_go.operation_blocked, false);
  assert.equal(result.no_go.mba_written, false);
  assert.equal(result.no_go.parallel_production_artifacts_written, false);
});

test("keeps Supabase, SQL, env and Runtime false", () => {
  const result = run();

  assert.equal(result.no_go.supabase_touched, false);
  assert.equal(result.no_go.sql_created, false);
  assert.equal(result.no_go.env_read, false);
  assert.equal(result.no_go.runtime_40_20_full_opened, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.report_only, true);
  assert.equal(result.materiality.production_integration, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runF8LocalParallelProductionRehearsal({
    case_id: "case:f8",
    f6_membrane_result: f6Result(),
    f7_shadow_result: f7Result(),
    ...overrides,
  });
}

function f6Result() {
  return {
    ok: true,
    case_id: "case:f8",
    outbox: {
      outbox_id: "F6_LOCAL_OUTBOX:case:f8",
      case_id: "case:f8",
      source_l8_ref: "L8_LOCAL_CHAIN:case:f8",
      source_f5c_ref: "F5C_LOCAL_BINDING:case:f8",
      target_consumer: "future_parallel_production_candidate",
      state: "handoff_ready_local",
      allowed_to_leave_membrane: true,
      restrictions: ["export_blocked"],
      governance_issue_refs: [],
      audit_log: [],
    },
    snapshot: {
      snapshot_id: "F6_LOCAL_SNAPSHOT:case:f8",
      case_id: "case:f8",
      source_l8_ref: "L8_LOCAL_CHAIN:case:f8",
      source_f5c_ref: "F5C_LOCAL_BINDING:case:f8",
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
      decision_id: "F6_LOCAL_HANDOFF_DECISION:case:f8",
      case_id: "case:f8",
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
      export_boundary_check_id: "F6_LOCAL_EXPORT_BOUNDARY:case:f8",
      case_id: "case:f8",
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
      review_control_id: "F6_LOCAL_REVIEW_CONTROL:case:f8",
      case_id: "case:f8",
      review_required: false,
      reason: "local_membrane_review_not_required",
      linked_binding_blocks: [],
      linked_restrictions: ["export_blocked"],
      state: "not_required",
      audit_log: [],
    },
    membrane_projection_summary: {
      projection_summary_id: "F6_LOCAL_PROJECTION_SUMMARY:case:f8",
      case_id: "case:f8",
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

function f7Result() {
  return {
    ok: true,
    case_id: "case:f8",
    event_ledger: [],
    timer_ledger: [],
    transition_findings: [
      {
        finding_id: "F7_LOCAL_FINDING:case:f8:export_blocked",
        case_id: "case:f8",
        source: "F6_LOCAL_MEMBRANE",
        finding_type: "export_blocked",
        severity: "info",
        route_to: "control_plane_summary",
        report_only: true,
        operation_blocking_allowed: false,
        readiness_mutation_allowed: false,
        core_state_mutation_allowed: false,
        governance_issue_refs: [],
      },
    ],
    compliance_report: {
      report_id: "F7_LOCAL_COMPLIANCE_REPORT:case:f8",
      case_id: "case:f8",
      mode: "report_only",
      report_only: true,
      event_ledger_count: 6,
      timer_ledger_count: 4,
      findings_count: 3,
      no_go_count: 3,
      soft_governance_activated: false,
      enforcement_activated: false,
      workflow_created: false,
      readiness_mutation_allowed: false,
      core_state_mutation_allowed: false,
      export_promotion_allowed: false,
    },
    soft_governance_shadow_signals: [],
    no_go_dashboard: {
      dashboard_id: "F7_LOCAL_NO_GO_DASHBOARD:case:f8",
      case_id: "case:f8",
      no_go_triggered: false,
      checks: {},
      blockers_count: 0,
      warnings_count: 3,
      report_only: true,
    },
    no_go: {
      control_plane_real_opened: false,
      sg_shadow_real_opened: false,
      soft_governance_activated: false,
      enforcement_activated: false,
      workflow_created: false,
      task_created: false,
      operation_blocked: false,
      readiness_mutated: false,
      core_state_mutated: false,
      runtime_40_20_full_opened: false,
      production_integration_opened: false,
      diagnosis_created: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      delivered_created: false,
      delivery_authorized: false,
      mba_written: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    materiality: {
      level: "f7_local_control_plane_shadow_readiness",
      local_only: true,
      report_only: true,
      production_integration: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./f8-local-parallel-production-rehearsal-service.ts", import.meta.url),
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
      if (specifier === "./f8-local-parallel-production-rehearsal-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "f8-local-parallel-production-rehearsal-service.ts",
  });

  return context.exports;
}
