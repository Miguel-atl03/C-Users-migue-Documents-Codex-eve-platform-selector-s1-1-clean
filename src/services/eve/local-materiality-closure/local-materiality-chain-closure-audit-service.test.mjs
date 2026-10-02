import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates local materiality chain closure audit from valid ExportCodePackage candidate result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.closure_audit.local_only, true);
  assert.equal(result.closure_audit.production_integration, false);
  assert.equal(result.closure_audit.closure_status, "closed_local_only");
});

test("creates stage ledger with all required stages", () => {
  const result = run();

  assert.equal(result.materiality_stage_ledger.length, 9);
  assertJsonEqual(
    result.materiality_stage_ledger.map((entry) => entry.stage),
    [
      "f5c_local_binding",
      "f6_local_membrane",
      "f7_local_control_shadow",
      "f8_local_parallel_rehearsal",
      "fase2_local_baseline",
      "registry_candidate_local_dry_run",
      "ir_candidate_local_dry_run",
      "diagramming_candidate_local_dry_run",
      "export_code_package_candidate_local_dry_run",
    ],
  );
  assert.ok(
    result.materiality_stage_ledger.every(
      (entry) =>
        entry.real_artifact_created === false &&
        entry.production_integration === false &&
        entry.next_authorization_required === true,
    ),
  );
});

test("creates E2E No-Go matrix", () => {
  const result = run();

  assert.ok(result.e2e_no_go_matrix.length >= 31);
  assert.ok(result.e2e_no_go_matrix.every((entry) => entry.passed === true));
  assertMatrixKey(result, "runtime_40_20_full_opened");
  assertMatrixKey(result, "export_created");
  assertMatrixKey(result, "delivery_claimed");
});

test("creates boundary violation scan", () => {
  const result = run();

  assert.equal(result.boundary_violation_scan.violations_found, false);
  assert.equal(result.boundary_violation_scan.violation_count, 0);
  assert.equal(result.boundary_violation_scan.boundary_violations.length, 0);
});

test("creates overclaim detection report", () => {
  const result = run();

  assert.equal(result.overclaim_detection_report.overclaim_detected, false);
  assert.equal(result.overclaim_detection_report.overclaim_count, 0);
  assert.ok(
    result.overclaim_detection_report.forbidden_claims_checked.includes(
      "conformance_claimed",
    ),
  );
});

test("creates next authorization boundary check", () => {
  const result = run();

  assert.equal(
    result.next_authorization_boundary_check.next_authorization_required,
    true,
  );
  assert.equal(
    result.next_authorization_boundary_check.automatic_promotion_allowed,
    false,
  );
});

test("creates closure readiness summary", () => {
  const result = run();

  assert.equal(result.closure_readiness_summary.closure_status, "closed_local_only");
  assert.equal(result.closure_readiness_summary.real_capabilities_opened, false);
  assert.equal(result.closure_readiness_summary.export_ready_real, false);
  assert.equal(result.closure_readiness_summary.diagnosis_ready_real, false);
  assert.equal(result.closure_readiness_summary.delivery_ready_real, false);
});

test("marks local_chain_closed=true when all No-Go are false", () => {
  const result = run();

  assert.equal(result.closure_readiness_summary.local_chain_closed, true);
  assert.equal(result.materiality.chain_closed_local_only, true);
});

test("keeps automatic_promotion_allowed=false", () => {
  const result = run();

  assert.equal(
    result.next_authorization_boundary_check.automatic_promotion_allowed,
    false,
  );
});

test("blocks if ExportCodePackage candidate input is not local-safe", () => {
  const candidate = exportCandidateResult();
  candidate.ok = false;
  const result = run({ export_code_package_candidate_result: candidate });

  assert.equal(result.ok, false);
  assert.equal(result.closure_audit.closure_status, "blocked_by_boundary_violation");
  assert.equal(result.blocked_reason, "blocked_by_boundary_violation");
});

test("detects boundary violation if export_created=true", () => {
  const candidate = exportCandidateResult();
  candidate.no_go.export_created = true;
  const result = run({ export_code_package_candidate_result: candidate });

  assert.equal(result.ok, false);
  assert.equal(result.boundary_violation_scan.violations_found, true);
  assert.ok(result.boundary_violation_scan.boundary_violations.includes("export_created"));
  assert.equal(result.closure_audit.closure_status, "blocked_by_boundary_violation");
});

test("detects overclaim if conformance_claimed=true", () => {
  const candidate = exportCandidateResult();
  candidate.no_go.conformance_claimed = true;
  const result = run({ export_code_package_candidate_result: candidate });

  assert.equal(result.ok, false);
  assert.equal(result.overclaim_detection_report.overclaim_detected, true);
  assert.ok(result.overclaim_detection_report.overclaims.includes("conformance_claimed"));
  assert.equal(result.closure_audit.closure_status, "blocked_by_overclaim");
});

test("keeps Runtime 40/20 full closed", () => {
  const result = run();

  assert.equal(result.no_go.runtime_40_20_full_opened, false);
});

test("keeps Object Inventory real closed", () => {
  const result = run();

  assert.equal(result.no_go.object_inventory_real_opened, false);
});

test("keeps F5C real closed", () => {
  const result = run();

  assert.equal(result.no_go.f5c_real_opened, false);
});

test("keeps Integration Membrane real closed", () => {
  const result = run();

  assert.equal(result.no_go.integration_membrane_real_opened, false);
});

test("keeps Control Plane real and SG Shadow real closed", () => {
  const result = run();

  assert.equal(result.no_go.control_plane_real_opened, false);
  assert.equal(result.no_go.sg_shadow_real_opened, false);
  assert.equal(result.no_go.soft_governance_activated, false);
  assert.equal(result.no_go.enforcement_activated, false);
});

test("keeps Produccion Paralela real closed", () => {
  const result = run();

  assert.equal(result.no_go.production_parallel_real_opened, false);
});

test("keeps Fase 3 real closed", () => {
  const result = run();

  assert.equal(result.no_go.phase3_real_opened, false);
});

test("keeps registry IR DiagrammingExportPackage ExportCodePackage export false", () => {
  const result = run();

  assert.equal(result.no_go.registry_real_created, false);
  assert.equal(result.no_go.pm_registry_real_created, false);
  assert.equal(result.no_go.pf_registry_real_created, false);
  assert.equal(result.no_go.moc_registry_real_created, false);
  assert.equal(result.no_go.olc_registry_real_created, false);
  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.diagramming_export_package_real_created, false);
  assert.equal(result.no_go.export_code_package_real_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.export_file_created, false);
  assert.equal(result.no_go.zip_created, false);
});

test("keeps diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
  assert.equal(result.no_go.delivery_authorized, false);
});

test("keeps client_delivery download false", () => {
  const result = run();

  assert.equal(result.no_go.client_delivery_created, false);
  assert.equal(result.no_go.download_created, false);
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

test("keeps Supabase SQL env false", () => {
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
});

function run(overrides = {}) {
  return service.runLocalMaterialityChainClosureAudit({
    case_id: "case:local-closure",
    export_code_package_candidate_result: exportCandidateResult(),
    ...overrides,
  });
}

function assertMatrixKey(result, key) {
  assert.ok(result.e2e_no_go_matrix.some((entry) => entry.no_go_key === key));
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function exportCandidateResult() {
  const restrictions = [
    "export_code_package_real_blocked",
    "export_blocked",
    "export_file_generation_blocked",
    "zip_generation_blocked",
    "diagramming_export_package_real_blocked",
    "ir_real_blocked",
    "registry_real_blocked",
  ];

  return {
    ok: true,
    case_id: "case:local-closure",
    export_code_package_candidate_manifest: {
      manifest_id:
        "EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_MANIFEST:case:local-closure",
      case_id: "case:local-closure",
      items: [
        "json_manifest_candidate",
        "markdown_manifest_candidate",
        "diagram_payload_candidate",
        "traceability_payload_candidate",
      ].map((candidate_format) => ({
        export_candidate_id: `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_${candidate_format}:case:local-closure`,
        source_diagram_candidate_ref: "DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_MANIFEST:case:local-closure",
        candidate_status: "export_package_candidate_ready_with_restrictions",
        candidate_format,
        local_only: true,
        creates_export_code_package_real: false,
        creates_file_real: false,
        restrictions,
        governance_issue_refs: [],
      })),
      local_only: true,
      export_code_package_real_created: false,
      export_real_created: false,
      audit_log: [],
    },
    export_payload_shape_candidate: {
      payload_shape_candidate_id:
        "EXPORT_PAYLOAD_SHAPE_CANDIDATE_LOCAL:case:local-closure",
      case_id: "case:local-closure",
      candidate_status: "export_package_candidate_ready_with_restrictions",
      manifest_shape_present: true,
      traceability_shape_present: true,
      diagram_payload_shape_present: true,
      no_real_file_payload: true,
      creates_export_payload_real: false,
      restrictions,
    },
    export_file_set_candidate: {
      file_set_candidate_id:
        "EXPORT_FILE_SET_CANDIDATE_LOCAL:case:local-closure",
      case_id: "case:local-closure",
      candidate_status: "export_package_candidate_ready_with_restrictions",
      candidate_files_declared: [
        "json_manifest_candidate",
        "markdown_manifest_candidate",
        "diagram_payload_candidate",
        "traceability_payload_candidate",
      ].map((format) => ({
        virtual_filename: `case_local_closure.${format}.virtual`,
        format,
        would_be_generated_later: true,
        generated_now: false,
      })),
      zip_created: false,
      files_created: false,
      creates_export_code_package_real: false,
      restrictions,
    },
    export_target_boundary_check: {
      target_boundary_check_id:
        "EXPORT_TARGET_BOUNDARY_CANDIDATE_LOCAL:case:local-closure",
      case_id: "case:local-closure",
      allowed_targets: [
        "qa_audit",
        "control_plane_summary",
        "future_export_candidate",
      ],
      blocked_targets: [
        "download",
        "client_delivery",
        "production_export",
        "registry_real",
        "ir_real",
        "diagnosis",
        "delivered",
      ],
      production_export_allowed: false,
      client_delivery_allowed: false,
      download_allowed: false,
      reason: "export_target_candidate_only",
    },
    export_format_readiness_check: {
      readiness_check_id:
        "EXPORT_FORMAT_READINESS_CANDIDATE_LOCAL:case:local-closure",
      case_id: "case:local-closure",
      export_package_candidate_ready_local: true,
      export_code_package_real_ready: false,
      export_code_package_creation_allowed: false,
      format_checks: {
        json_manifest_candidate_present: true,
        markdown_manifest_candidate_present: true,
        diagram_payload_candidate_present: true,
        traceability_payload_candidate_present: true,
      },
      blocked_reasons: [],
      warnings: restrictions,
    },
    export_no_go_boundary_check: {
      boundary_check_id:
        "EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_NO_GO_BOUNDARY:case:local-closure",
      case_id: "case:local-closure",
      export_code_package_creation_allowed: false,
      export_creation_allowed: false,
      diagramming_export_package_creation_allowed: false,
      ir_creation_allowed: false,
      registry_creation_allowed: false,
      diagnosis_creation_allowed: false,
      delivery_allowed: false,
      phase3_real_opening_allowed: false,
      reason: "export_code_package_candidate_dry_run_only",
    },
    export_audit_warning_manifest: {
      warning_manifest_id:
        "EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_WARNINGS:case:local-closure",
      case_id: "case:local-closure",
      conformance_claimed: false,
      consistency_claimed: false,
      diagramming_claimed: false,
      export_claimed: false,
      delivery_claimed: false,
      warnings: [],
      rule: "export_code_package_candidate_only_no_file_no_export_no_delivery",
    },
    governance_issue_refs: [],
    no_go: {
      export_code_package_real_created: false,
      export_created: false,
      export_file_created: false,
      zip_created: false,
      diagramming_export_package_real_created: false,
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
      client_delivery_created: false,
      download_created: false,
      phase3_real_opened: false,
      production_parallel_real_opened: false,
      conformance_claimed: false,
      consistency_claimed: false,
      diagramming_claimed: false,
      export_claimed: false,
      delivery_claimed: false,
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
      level: "export_code_package_candidate_local_dry_run",
      local_only: true,
      production_integration: false,
      export_code_package_real_created: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./local-materiality-chain-closure-audit-service.ts", import.meta.url),
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
      if (specifier === "./local-materiality-chain-closure-audit-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "local-materiality-chain-closure-audit-service.ts",
  });

  return context.exports;
}
