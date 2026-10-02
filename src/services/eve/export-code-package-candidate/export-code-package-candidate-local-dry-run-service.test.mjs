import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates ExportCodePackage candidate manifest from valid diagramming candidate result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.export_code_package_candidate_manifest.local_only, true);
  assert.equal(
    result.export_code_package_candidate_manifest
      .export_code_package_real_created,
    false,
  );
  assert.equal(
    result.export_code_package_candidate_manifest.export_real_created,
    false,
  );
  assertJsonEqual(
    result.export_code_package_candidate_manifest.items.map(
      (item) => item.candidate_format,
    ),
    [
      "json_manifest_candidate",
      "markdown_manifest_candidate",
      "diagram_payload_candidate",
      "traceability_payload_candidate",
    ],
  );
  assert.ok(
    result.export_code_package_candidate_manifest.items.every(
      (item) =>
        item.local_only === true &&
        item.creates_export_code_package_real === false &&
        item.creates_file_real === false,
    ),
  );
});

test("creates export payload shape candidate", () => {
  const result = run();

  assert.equal(
    result.export_payload_shape_candidate.candidate_status,
    "export_package_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.export_payload_shape_candidate.manifest_shape_present,
    true,
  );
  assert.equal(
    result.export_payload_shape_candidate.traceability_shape_present,
    true,
  );
  assert.equal(
    result.export_payload_shape_candidate.diagram_payload_shape_present,
    true,
  );
  assert.equal(result.export_payload_shape_candidate.no_real_file_payload, true);
  assert.equal(
    result.export_payload_shape_candidate.creates_export_payload_real,
    false,
  );
});

test("creates export file set candidate with generated_now=false", () => {
  const result = run();

  assert.equal(
    result.export_file_set_candidate.candidate_status,
    "export_package_candidate_ready_with_restrictions",
  );
  assert.equal(result.export_file_set_candidate.candidate_files_declared.length, 4);
  assert.ok(
    result.export_file_set_candidate.candidate_files_declared.every(
      (file) =>
        file.would_be_generated_later === true && file.generated_now === false,
    ),
  );
  assert.equal(result.export_file_set_candidate.zip_created, false);
  assert.equal(result.export_file_set_candidate.files_created, false);
  assert.equal(
    result.export_file_set_candidate.creates_export_code_package_real,
    false,
  );
});

test("creates export target boundary check", () => {
  const result = run();

  assertJsonEqual(result.export_target_boundary_check.allowed_targets, [
    "qa_audit",
    "control_plane_summary",
    "future_export_candidate",
  ]);
  assert.ok(
    result.export_target_boundary_check.blocked_targets.includes("download"),
  );
  assert.ok(
    result.export_target_boundary_check.blocked_targets.includes(
      "client_delivery",
    ),
  );
  assert.equal(
    result.export_target_boundary_check.production_export_allowed,
    false,
  );
  assert.equal(result.export_target_boundary_check.client_delivery_allowed, false);
  assert.equal(result.export_target_boundary_check.download_allowed, false);
});

test("creates export format readiness check", () => {
  const result = run();

  assert.equal(
    result.export_format_readiness_check.export_package_candidate_ready_local,
    true,
  );
  assert.equal(
    result.export_format_readiness_check.export_code_package_real_ready,
    false,
  );
  assert.equal(
    result.export_format_readiness_check
      .export_code_package_creation_allowed,
    false,
  );
  assert.equal(
    result.export_format_readiness_check.format_checks
      .json_manifest_candidate_present,
    true,
  );
  assert.equal(
    result.export_format_readiness_check.format_checks
      .markdown_manifest_candidate_present,
    true,
  );
  assert.equal(
    result.export_format_readiness_check.format_checks
      .diagram_payload_candidate_present,
    true,
  );
  assert.equal(
    result.export_format_readiness_check.format_checks
      .traceability_payload_candidate_present,
    true,
  );
});

test("creates export No-Go boundary check", () => {
  const result = run();

  assert.equal(
    result.export_no_go_boundary_check.export_code_package_creation_allowed,
    false,
  );
  assert.equal(result.export_no_go_boundary_check.export_creation_allowed, false);
  assert.equal(
    result.export_no_go_boundary_check
      .diagramming_export_package_creation_allowed,
    false,
  );
  assert.equal(result.export_no_go_boundary_check.ir_creation_allowed, false);
  assert.equal(result.export_no_go_boundary_check.registry_creation_allowed, false);
  assert.equal(result.export_no_go_boundary_check.diagnosis_creation_allowed, false);
  assert.equal(result.export_no_go_boundary_check.delivery_allowed, false);
  assert.equal(
    result.export_no_go_boundary_check.phase3_real_opening_allowed,
    false,
  );
});

test("creates export audit warning manifest", () => {
  const result = run();

  assert.equal(result.export_audit_warning_manifest.export_claimed, false);
  assert.equal(result.export_audit_warning_manifest.delivery_claimed, false);
  assertWarning(result, "no_conformance_claim");
  assertWarning(result, "no_consistency_claim");
  assertWarning(result, "no_diagramming_claim");
  assertWarning(result, "no_export_generation");
  assertWarning(result, "no_file_generation");
  assertWarning(result, "no_delivery");
});

test("blocks if Diagramming Candidate input is not local-safe", () => {
  const diagramming = diagrammingCandidateResult();
  diagramming.ok = false;
  const result = run({ diagramming_candidate_result: diagramming });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "diagramming_candidate_not_local_safe");
  assert.equal(
    result.export_format_readiness_check.export_package_candidate_ready_local,
    false,
  );
  assert.equal(
    result.export_payload_shape_candidate.candidate_status,
    "export_package_candidate_blocked",
  );
});

test("keeps ExportCodePackage real created=false", () => {
  const result = run();

  assert.equal(result.no_go.export_code_package_real_created, false);
  assert.equal(
    result.materiality.export_code_package_real_created,
    false,
  );
});

test("keeps export_created=false", () => {
  const result = run();

  assert.equal(result.no_go.export_created, false);
});

test("keeps export_file_created=false", () => {
  const result = run();

  assert.equal(result.no_go.export_file_created, false);
});

test("keeps zip_created=false", () => {
  const result = run();

  assert.equal(result.no_go.zip_created, false);
});

test("keeps DiagrammingExportPackage real created=false", () => {
  const result = run();

  assert.equal(result.no_go.diagramming_export_package_real_created, false);
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
});

test("keeps delivery_authorized=false", () => {
  const result = run();

  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps client_delivery_created=false", () => {
  const result = run();

  assert.equal(result.no_go.client_delivery_created, false);
});

test("keeps download_created=false", () => {
  const result = run();

  assert.equal(result.no_go.download_created, false);
});

test("keeps Phase 3 real closed", () => {
  const result = run();

  assert.equal(result.no_go.phase3_real_opened, false);
});

test("keeps Produccion Paralela real closed", () => {
  const result = run();

  assert.equal(result.no_go.production_parallel_real_opened, false);
});

test("keeps conformance consistency diagramming export delivery claimed false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
  assert.equal(result.no_go.diagramming_claimed, false);
  assert.equal(result.no_go.export_claimed, false);
  assert.equal(result.no_go.delivery_claimed, false);
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
  assert.equal(result.export_audit_warning_manifest.conformance_claimed, false);
  assert.equal(result.export_audit_warning_manifest.consistency_claimed, false);
});

function run(overrides = {}) {
  return service.runExportCodePackageCandidateLocalDryRun({
    case_id: "case:export-candidate",
    diagramming_candidate_result: diagrammingCandidateResult(),
    ...overrides,
  });
}

function assertWarning(result, warningType) {
  assert.ok(
    result.export_audit_warning_manifest.warnings.some(
      (warning) => warning.warning_type === warningType,
    ),
  );
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function diagrammingCandidateResult() {
  const restrictions = [
    "diagramming_export_package_real_blocked",
    "export_code_package_blocked",
    "export_blocked",
    "diagram_file_generation_blocked",
    "ir_real_blocked",
    "registry_real_blocked",
  ];

  return {
    ok: true,
    case_id: "case:export-candidate",
    diagramming_export_candidate_manifest: {
      manifest_id:
        "DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_MANIFEST:case:export-candidate",
      case_id: "case:export-candidate",
      items: ["PM", "PF", "MoC", "OLC"].map((model_kind) => ({
        diagram_candidate_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_${model_kind}:case:export-candidate`,
        model_kind,
        source_ir_candidate_ref: `MMABP_IR_CANDIDATE_LOCAL_${model_kind}:case:export-candidate`,
        candidate_status: "diagram_candidate_ready_with_restrictions",
        local_only: true,
        creates_diagramming_export_package_real: false,
        restrictions,
        governance_issue_refs: [],
      })),
      local_only: true,
      diagramming_export_package_real_created: false,
      audit_log: [],
    },
    pm_diagram_candidate: {
      pm_diagram_candidate_id: "PM_DIAGRAM_CANDIDATE_LOCAL:case:export-candidate",
      case_id: "case:export-candidate",
      source_pm_ir_candidate_ref:
        "PM_IR_PROJECTION_CANDIDATE_LOCAL:case:export-candidate",
      candidate_status: "diagram_candidate_ready_with_restrictions",
      diagram_kind: "process_map_candidate",
      intention_visible: true,
      trigger_visible: true,
      target_state_visible: true,
      support_boundary_visible: true,
      creates_diagram_real: false,
      restrictions,
    },
    pf_diagram_candidate: {
      pf_diagram_candidate_id: "PF_DIAGRAM_CANDIDATE_LOCAL:case:export-candidate",
      case_id: "case:export-candidate",
      source_pf_ir_candidate_ref:
        "PF_IR_PROJECTION_CANDIDATE_LOCAL:case:export-candidate",
      candidate_status: "diagram_candidate_ready_with_restrictions",
      diagram_kind: "process_flow_candidate",
      sequence_visible: true,
      process_state_visible: true,
      timer_visible: true,
      no_swimlanes: true,
      creates_diagram_real: false,
      restrictions,
    },
    moc_diagram_candidate: {
      moc_diagram_candidate_id:
        "MOC_DIAGRAM_CANDIDATE_LOCAL:case:export-candidate",
      case_id: "case:export-candidate",
      source_moc_ir_candidate_ref:
        "MOC_IR_PROJECTION_CANDIDATE_LOCAL:case:export-candidate",
      candidate_status: "diagram_candidate_ready_with_restrictions",
      diagram_kind: "model_of_concepts_candidate",
      object_classes_visible: true,
      relationships_visible: true,
      isa_boundary_visible: true,
      no_database_reduction: true,
      creates_diagram_real: false,
      restrictions,
    },
    olc_diagram_candidate: {
      olc_diagram_candidate_id:
        "OLC_DIAGRAM_CANDIDATE_LOCAL:case:export-candidate",
      case_id: "case:export-candidate",
      source_olc_ir_candidate_ref:
        "OLC_IR_PROJECTION_CANDIDATE_LOCAL:case:export-candidate",
      candidate_status: "diagram_candidate_ready_with_restrictions",
      diagram_kind: "object_life_cycle_candidate",
      lifecycle_object_visible: true,
      states_visible: true,
      transitions_visible: true,
      stimulus_or_time_visible: true,
      no_process_reduction: true,
      creates_diagram_real: false,
      restrictions,
    },
    diagram_shape_readiness_check: {
      readiness_check_id:
        "DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_READINESS:case:export-candidate",
      case_id: "case:export-candidate",
      diagram_candidate_ready_local: true,
      diagramming_export_package_real_ready: false,
      diagramming_export_package_creation_allowed: false,
      shape_checks: {
        pm_diagram_candidate_present: true,
        pf_diagram_candidate_present: true,
        moc_diagram_candidate_present: true,
        olc_diagram_candidate_present: true,
      },
      blocked_reasons: [],
      warnings: restrictions,
    },
    diagram_consistency_warning_manifest: {
      warning_manifest_id:
        "DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_WARNINGS:case:export-candidate",
      case_id: "case:export-candidate",
      conformance_claimed: false,
      consistency_claimed: false,
      diagramming_claimed: false,
      warnings: [
        {
          warning_id: "DIAGRAM_WARNING:case:export-candidate:no_export_generation",
          model_kind: "CROSS_MODEL",
          warning_type: "no_export_generation",
          severity: "info",
          message: "No exportable diagram, package, or file is generated.",
        },
      ],
      rule: "diagram_candidate_only_no_export_no_conformance_no_consistency_claim",
    },
    diagram_export_boundary_check: {
      boundary_check_id:
        "DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_BOUNDARY:case:export-candidate",
      case_id: "case:export-candidate",
      diagramming_export_package_creation_allowed: false,
      export_code_package_allowed: false,
      export_creation_allowed: false,
      ir_creation_allowed: false,
      registry_creation_allowed: false,
      diagnosis_creation_allowed: false,
      phase3_real_opening_allowed: false,
      reason: "diagramming_export_candidate_dry_run_only",
    },
    governance_issue_refs: [],
    no_go: {
      diagramming_export_package_real_created: false,
      export_code_package_created: false,
      export_created: false,
      diagram_file_created: false,
      mermaid_created: false,
      svg_created: false,
      png_created: false,
      drawio_created: false,
      bpmn_created: false,
      archimate_created: false,
      uml_created: false,
      ir_real_created: false,
      registry_real_created: false,
      diagnosis_created: false,
      delivered_created: false,
      delivery_authorized: false,
      phase3_real_opened: false,
      production_parallel_real_opened: false,
      conformance_claimed: false,
      consistency_claimed: false,
      diagramming_claimed: false,
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
      level: "diagramming_export_candidate_local_dry_run",
      local_only: true,
      production_integration: false,
      diagramming_export_package_real_created: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL(
      "./export-code-package-candidate-local-dry-run-service.ts",
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
      if (specifier === "./export-code-package-candidate-local-dry-run-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "export-code-package-candidate-local-dry-run-service.ts",
  });

  return context.exports;
}
