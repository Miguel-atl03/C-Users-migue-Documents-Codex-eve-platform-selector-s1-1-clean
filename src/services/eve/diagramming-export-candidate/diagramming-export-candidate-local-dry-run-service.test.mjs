import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates diagramming export candidate manifest from valid IR candidate result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.diagramming_export_candidate_manifest.local_only, true);
  assert.equal(
    result.diagramming_export_candidate_manifest
      .diagramming_export_package_real_created,
    false,
  );
  assertJsonEqual(
    result.diagramming_export_candidate_manifest.items.map(
      (item) => item.model_kind,
    ),
    ["PM", "PF", "MoC", "OLC"],
  );
});

test("creates PM diagram candidate local", () => {
  const result = run();

  assert.equal(
    result.pm_diagram_candidate.candidate_status,
    "diagram_candidate_ready_with_restrictions",
  );
  assert.equal(result.pm_diagram_candidate.diagram_kind, "process_map_candidate");
  assert.equal(result.pm_diagram_candidate.intention_visible, true);
  assert.equal(result.pm_diagram_candidate.trigger_visible, true);
  assert.equal(result.pm_diagram_candidate.target_state_visible, true);
  assert.equal(result.pm_diagram_candidate.support_boundary_visible, true);
  assert.equal(result.pm_diagram_candidate.creates_diagram_real, false);
});

test("creates PF diagram candidate local", () => {
  const result = run();

  assert.equal(
    result.pf_diagram_candidate.candidate_status,
    "diagram_candidate_ready_with_restrictions",
  );
  assert.equal(result.pf_diagram_candidate.diagram_kind, "process_flow_candidate");
  assert.equal(result.pf_diagram_candidate.sequence_visible, true);
  assert.equal(result.pf_diagram_candidate.process_state_visible, true);
  assert.equal(result.pf_diagram_candidate.timer_visible, true);
  assert.equal(result.pf_diagram_candidate.no_swimlanes, true);
  assert.equal(result.pf_diagram_candidate.creates_diagram_real, false);
});

test("creates MoC diagram candidate local", () => {
  const result = run();

  assert.equal(
    result.moc_diagram_candidate.candidate_status,
    "diagram_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.moc_diagram_candidate.diagram_kind,
    "model_of_concepts_candidate",
  );
  assert.equal(result.moc_diagram_candidate.object_classes_visible, true);
  assert.equal(result.moc_diagram_candidate.relationships_visible, true);
  assert.equal(result.moc_diagram_candidate.isa_boundary_visible, true);
  assert.equal(result.moc_diagram_candidate.no_database_reduction, true);
  assert.equal(result.moc_diagram_candidate.creates_diagram_real, false);
});

test("creates OLC diagram candidate local", () => {
  const result = run();

  assert.equal(
    result.olc_diagram_candidate.candidate_status,
    "diagram_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.olc_diagram_candidate.diagram_kind,
    "object_life_cycle_candidate",
  );
  assert.equal(result.olc_diagram_candidate.lifecycle_object_visible, true);
  assert.equal(result.olc_diagram_candidate.states_visible, true);
  assert.equal(result.olc_diagram_candidate.transitions_visible, true);
  assert.equal(result.olc_diagram_candidate.stimulus_or_time_visible, true);
  assert.equal(result.olc_diagram_candidate.no_process_reduction, true);
  assert.equal(result.olc_diagram_candidate.creates_diagram_real, false);
});

test("creates diagram shape readiness check", () => {
  const result = run();

  assert.equal(
    result.diagram_shape_readiness_check.diagram_candidate_ready_local,
    true,
  );
  assert.equal(
    result.diagram_shape_readiness_check
      .diagramming_export_package_creation_allowed,
    false,
  );
  assert.equal(
    result.diagram_shape_readiness_check
      .diagramming_export_package_real_ready,
    false,
  );
  assert.equal(
    result.diagram_shape_readiness_check.shape_checks
      .pm_diagram_candidate_present,
    true,
  );
  assert.equal(
    result.diagram_shape_readiness_check.shape_checks
      .pf_diagram_candidate_present,
    true,
  );
  assert.equal(
    result.diagram_shape_readiness_check.shape_checks
      .moc_diagram_candidate_present,
    true,
  );
  assert.equal(
    result.diagram_shape_readiness_check.shape_checks
      .olc_diagram_candidate_present,
    true,
  );
});

test("creates diagram consistency warning manifest with conformance_claimed=false", () => {
  const result = run();

  assert.equal(
    result.diagram_consistency_warning_manifest.conformance_claimed,
    false,
  );
  assertWarning(result, "no_conformance_claim");
});

test("creates diagram consistency warning manifest with consistency_claimed=false", () => {
  const result = run();

  assert.equal(
    result.diagram_consistency_warning_manifest.consistency_claimed,
    false,
  );
  assertWarning(result, "no_consistency_claim");
});

test("creates diagram consistency warning manifest with diagramming_claimed=false", () => {
  const result = run();

  assert.equal(
    result.diagram_consistency_warning_manifest.diagramming_claimed,
    false,
  );
  assertWarning(result, "no_export_generation");
  assert.equal(
    result.diagram_consistency_warning_manifest.rule,
    "diagram_candidate_only_no_export_no_conformance_no_consistency_claim",
  );
});

test("creates diagram export boundary check with diagramming_export_package_creation_allowed=false", () => {
  const result = run();

  assert.equal(
    result.diagram_export_boundary_check
      .diagramming_export_package_creation_allowed,
    false,
  );
  assert.equal(
    result.diagram_export_boundary_check.export_code_package_allowed,
    false,
  );
  assert.equal(result.diagram_export_boundary_check.export_creation_allowed, false);
  assert.equal(result.diagram_export_boundary_check.ir_creation_allowed, false);
  assert.equal(
    result.diagram_export_boundary_check.registry_creation_allowed,
    false,
  );
  assert.equal(
    result.diagram_export_boundary_check.diagnosis_creation_allowed,
    false,
  );
  assert.equal(
    result.diagram_export_boundary_check.phase3_real_opening_allowed,
    false,
  );
});

test("blocks if IR Candidate input is not local-safe", () => {
  const ir = irCandidateResult();
  ir.ok = false;
  const result = run({ ir_candidate_result: ir });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "ir_candidate_not_local_safe");
  assert.equal(
    result.diagram_shape_readiness_check.diagram_candidate_ready_local,
    false,
  );
  assert.equal(
    result.pm_diagram_candidate.candidate_status,
    "diagram_candidate_blocked",
  );
});

test("keeps DiagrammingExportPackage real created=false", () => {
  const result = run();

  assert.equal(result.no_go.diagramming_export_package_real_created, false);
  assert.equal(
    result.materiality.diagramming_export_package_real_created,
    false,
  );
});

test("keeps ExportCodePackage created=false", () => {
  const result = run();

  assert.equal(result.no_go.export_code_package_created, false);
});

test("keeps export false", () => {
  const result = run();

  assert.equal(result.no_go.export_created, false);
});

test("keeps diagram_file_created=false", () => {
  const result = run();

  assert.equal(result.no_go.diagram_file_created, false);
});

test("keeps Mermaid SVG PNG Draw.io BPMN ArchiMate UML false", () => {
  const result = run();

  assert.equal(result.no_go.mermaid_created, false);
  assert.equal(result.no_go.svg_created, false);
  assert.equal(result.no_go.png_created, false);
  assert.equal(result.no_go.drawio_created, false);
  assert.equal(result.no_go.bpmn_created, false);
  assert.equal(result.no_go.archimate_created, false);
  assert.equal(result.no_go.uml_created, false);
});

test("keeps IR real and registry real false", () => {
  const result = run();

  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.registry_real_created, false);
});

test("keeps diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps Phase 3 real closed", () => {
  const result = run();

  assert.equal(result.no_go.phase3_real_opened, false);
});

test("keeps Produccion Paralela real closed", () => {
  const result = run();

  assert.equal(result.no_go.production_parallel_real_opened, false);
});

test("keeps conformance consistency claimed false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
});

test("keeps models_auto_corrected=false", () => {
  const result = run();

  assert.equal(result.no_go.models_auto_corrected, false);
});

test("keeps readiness and core mutations false", () => {
  const result = run();

  assert.equal(result.no_go.readiness_mutated, false);
  assert.equal(result.no_go.core_state_mutated, false);
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
  assert.equal(result.diagram_consistency_warning_manifest.diagramming_claimed, false);
});

function run(overrides = {}) {
  return service.runDiagrammingExportCandidateLocalDryRun({
    case_id: "case:diagram-candidate",
    ir_candidate_result: irCandidateResult(),
    ...overrides,
  });
}

function assertWarning(result, warningType) {
  assert.ok(
    result.diagram_consistency_warning_manifest.warnings.some(
      (warning) => warning.warning_type === warningType,
    ),
  );
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function irCandidateResult() {
  const restrictions = [
    "ir_real_blocked",
    "registry_real_blocked",
    "export_blocked",
    "diagramming_export_package_blocked",
    "export_code_package_blocked",
    "diagnosis_blocked",
  ];

  return {
    ok: true,
    case_id: "case:diagram-candidate",
    ir_candidate_manifest: {
      manifest_id: "MMABP_IR_CANDIDATE_LOCAL_MANIFEST:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      items: ["PM", "PF", "MoC", "OLC"].map((model_kind) => ({
        ir_candidate_id: `MMABP_IR_CANDIDATE_LOCAL_${model_kind}:case:diagram-candidate`,
        model_kind,
        source_registry_candidate_ref: `REGISTRY_CANDIDATE_LOCAL_${model_kind}:case:diagram-candidate`,
        candidate_status: "ir_candidate_ready_with_restrictions",
        local_only: true,
        creates_ir_real: false,
        restrictions,
        governance_issue_refs: [],
      })),
      local_only: true,
      ir_real_created: false,
      audit_log: [],
    },
    pm_ir_projection_candidate: {
      pm_ir_candidate_id: "PM_IR_PROJECTION_CANDIDATE_LOCAL:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      source_pm_registry_candidate_ref:
        "PM_REGISTRY_CANDIDATE_LOCAL:case:diagram-candidate",
      candidate_status: "ir_candidate_ready_with_restrictions",
      process_map_shape_candidate_present: true,
      process_intention_present: true,
      trigger_present: true,
      target_state_present: true,
      support_boundary_preserved: true,
      creates_ir_real: false,
      restrictions,
    },
    pf_ir_projection_candidate: {
      pf_ir_candidate_id: "PF_IR_PROJECTION_CANDIDATE_LOCAL:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      source_pf_registry_candidate_ref:
        "PF_REGISTRY_CANDIDATE_LOCAL:case:diagram-candidate",
      candidate_status: "ir_candidate_ready_with_restrictions",
      process_flow_shape_candidate_present: true,
      sequence_present: true,
      process_state_present: true,
      timer_present: true,
      no_swimlane_contamination: true,
      creates_ir_real: false,
      restrictions,
    },
    moc_ir_projection_candidate: {
      moc_ir_candidate_id:
        "MOC_IR_PROJECTION_CANDIDATE_LOCAL:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      source_moc_registry_candidate_ref:
        "MOC_REGISTRY_CANDIDATE_LOCAL:case:diagram-candidate",
      candidate_status: "ir_candidate_ready_with_restrictions",
      model_of_concepts_shape_candidate_present: true,
      object_class_present: true,
      relationship_present: true,
      isa_boundary_preserved: true,
      no_database_reduction: true,
      creates_ir_real: false,
      restrictions,
    },
    olc_ir_projection_candidate: {
      olc_ir_candidate_id:
        "OLC_IR_PROJECTION_CANDIDATE_LOCAL:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      source_olc_registry_candidate_ref:
        "OLC_REGISTRY_CANDIDATE_LOCAL:case:diagram-candidate",
      candidate_status: "ir_candidate_ready_with_restrictions",
      object_life_cycle_shape_candidate_present: true,
      lifecycle_object_present: true,
      state_present: true,
      transition_present: true,
      external_stimulus_or_time_required: true,
      no_process_reduction: true,
      creates_ir_real: false,
      restrictions,
    },
    ir_shape_readiness_check: {
      readiness_check_id: "MMABP_IR_CANDIDATE_LOCAL_READINESS:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      ir_candidate_ready_local: true,
      ir_real_ready: false,
      ir_creation_allowed: false,
      shape_checks: {
        pm_shape_candidate_present: true,
        pf_shape_candidate_present: true,
        moc_shape_candidate_present: true,
        olc_shape_candidate_present: true,
      },
      blocked_reasons: [],
      warnings: restrictions,
    },
    ir_cross_model_traceability_precheck: {
      precheck_id:
        "MMABP_IR_CANDIDATE_LOCAL_TRACEABILITY_PRECHECK:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      conformance_claimed: false,
      consistency_claimed: false,
      traceability_precheck_possible: true,
      pm_to_pf_link_candidate_present: true,
      pf_to_moc_link_candidate_present: true,
      pf_to_olc_link_candidate_present: true,
      moc_to_olc_link_candidate_present: true,
      unresolved_traceability_links: [],
      rule: "ir_precheck_only_no_conformance_no_consistency_claim",
    },
    ir_no_go_boundary_check: {
      boundary_check_id:
        "MMABP_IR_CANDIDATE_LOCAL_NO_GO_BOUNDARY:case:diagram-candidate",
      case_id: "case:diagram-candidate",
      ir_creation_allowed: false,
      registry_creation_allowed: false,
      export_creation_allowed: false,
      diagramming_export_package_allowed: false,
      export_code_package_allowed: false,
      diagnosis_creation_allowed: false,
      phase3_real_opening_allowed: false,
      reason: "ir_candidate_dry_run_only",
    },
    governance_issue_refs: [],
    no_go: {
      ir_real_created: false,
      registry_real_created: false,
      pm_registry_real_created: false,
      pf_registry_real_created: false,
      moc_registry_real_created: false,
      olc_registry_real_created: false,
      export_created: false,
      export_code_package_created: false,
      diagramming_export_package_created: false,
      diagnosis_created: false,
      delivered_created: false,
      delivery_authorized: false,
      phase3_real_opened: false,
      production_parallel_real_opened: false,
      conformance_claimed: false,
      consistency_claimed: false,
      models_auto_corrected: false,
      readiness_mutated: false,
      core_state_mutated: false,
      mba_written: false,
      parallel_production_artifacts_written: false,
      supabase_touched: false,
      sql_created: false,
      env_read: false,
    },
    materiality: {
      level: "mmabp_ir_candidate_local_dry_run",
      local_only: true,
      production_integration: false,
      ir_real_created: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL(
      "./diagramming-export-candidate-local-dry-run-service.ts",
      import.meta.url,
    ),
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
      if (specifier === "./diagramming-export-candidate-local-dry-run-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "diagramming-export-candidate-local-dry-run-service.ts",
  });

  return context.exports;
}
