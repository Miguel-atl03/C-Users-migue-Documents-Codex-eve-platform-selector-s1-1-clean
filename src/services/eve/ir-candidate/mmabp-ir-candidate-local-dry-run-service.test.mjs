import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates MMABP IR candidate manifest from valid registry candidate result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.ir_candidate_manifest.local_only, true);
  assert.equal(result.ir_candidate_manifest.ir_real_created, false);
  assertJsonEqual(
    result.ir_candidate_manifest.items.map((item) => item.model_kind),
    ["PM", "PF", "MoC", "OLC"],
  );
});

test("creates PM IR projection candidate local", () => {
  const result = run();

  assert.equal(
    result.pm_ir_projection_candidate.candidate_status,
    "ir_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.pm_ir_projection_candidate.process_map_shape_candidate_present,
    true,
  );
  assert.equal(result.pm_ir_projection_candidate.process_intention_present, true);
  assert.equal(result.pm_ir_projection_candidate.trigger_present, true);
  assert.equal(result.pm_ir_projection_candidate.target_state_present, true);
  assert.equal(result.pm_ir_projection_candidate.support_boundary_preserved, true);
  assert.equal(result.pm_ir_projection_candidate.creates_ir_real, false);
});

test("creates PF IR projection candidate local", () => {
  const result = run();

  assert.equal(
    result.pf_ir_projection_candidate.candidate_status,
    "ir_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.pf_ir_projection_candidate.process_flow_shape_candidate_present,
    true,
  );
  assert.equal(result.pf_ir_projection_candidate.sequence_present, true);
  assert.equal(result.pf_ir_projection_candidate.process_state_present, true);
  assert.equal(result.pf_ir_projection_candidate.timer_present, true);
  assert.equal(result.pf_ir_projection_candidate.no_swimlane_contamination, true);
  assert.equal(result.pf_ir_projection_candidate.creates_ir_real, false);
});

test("creates MoC IR projection candidate local", () => {
  const result = run();

  assert.equal(
    result.moc_ir_projection_candidate.candidate_status,
    "ir_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.moc_ir_projection_candidate.model_of_concepts_shape_candidate_present,
    true,
  );
  assert.equal(result.moc_ir_projection_candidate.object_class_present, true);
  assert.equal(result.moc_ir_projection_candidate.relationship_present, true);
  assert.equal(result.moc_ir_projection_candidate.isa_boundary_preserved, true);
  assert.equal(result.moc_ir_projection_candidate.no_database_reduction, true);
  assert.equal(result.moc_ir_projection_candidate.creates_ir_real, false);
});

test("creates OLC IR projection candidate local", () => {
  const result = run();

  assert.equal(
    result.olc_ir_projection_candidate.candidate_status,
    "ir_candidate_ready_with_restrictions",
  );
  assert.equal(
    result.olc_ir_projection_candidate
      .object_life_cycle_shape_candidate_present,
    true,
  );
  assert.equal(result.olc_ir_projection_candidate.lifecycle_object_present, true);
  assert.equal(result.olc_ir_projection_candidate.state_present, true);
  assert.equal(result.olc_ir_projection_candidate.transition_present, true);
  assert.equal(
    result.olc_ir_projection_candidate.external_stimulus_or_time_required,
    true,
  );
  assert.equal(result.olc_ir_projection_candidate.no_process_reduction, true);
  assert.equal(result.olc_ir_projection_candidate.creates_ir_real, false);
});

test("creates IR shape readiness check", () => {
  const result = run();

  assert.equal(result.ir_shape_readiness_check.ir_candidate_ready_local, true);
  assert.equal(result.ir_shape_readiness_check.ir_real_ready, false);
  assert.equal(result.ir_shape_readiness_check.ir_creation_allowed, false);
  assert.equal(
    result.ir_shape_readiness_check.shape_checks.pm_shape_candidate_present,
    true,
  );
  assert.equal(
    result.ir_shape_readiness_check.shape_checks.pf_shape_candidate_present,
    true,
  );
  assert.equal(
    result.ir_shape_readiness_check.shape_checks.moc_shape_candidate_present,
    true,
  );
  assert.equal(
    result.ir_shape_readiness_check.shape_checks.olc_shape_candidate_present,
    true,
  );
});

test("creates IR cross-model traceability precheck with conformance_claimed=false", () => {
  const result = run();

  assert.equal(
    result.ir_cross_model_traceability_precheck.conformance_claimed,
    false,
  );
  assert.equal(
    result.ir_cross_model_traceability_precheck.traceability_precheck_possible,
    true,
  );
});

test("creates IR cross-model traceability precheck with consistency_claimed=false", () => {
  const result = run();

  assert.equal(
    result.ir_cross_model_traceability_precheck.consistency_claimed,
    false,
  );
  assert.equal(
    result.ir_cross_model_traceability_precheck.rule,
    "ir_precheck_only_no_conformance_no_consistency_claim",
  );
});

test("creates IR No-Go boundary check with ir_creation_allowed=false", () => {
  const result = run();

  assert.equal(result.ir_no_go_boundary_check.ir_creation_allowed, false);
  assert.equal(result.ir_no_go_boundary_check.registry_creation_allowed, false);
  assert.equal(result.ir_no_go_boundary_check.export_creation_allowed, false);
  assert.equal(
    result.ir_no_go_boundary_check.diagramming_export_package_allowed,
    false,
  );
  assert.equal(
    result.ir_no_go_boundary_check.export_code_package_allowed,
    false,
  );
  assert.equal(result.ir_no_go_boundary_check.diagnosis_creation_allowed, false);
  assert.equal(
    result.ir_no_go_boundary_check.phase3_real_opening_allowed,
    false,
  );
});

test("blocks if Registry Candidate input is not local-safe", () => {
  const registry = registryCandidateResult();
  registry.ok = false;
  const result = run({ registry_candidate_result: registry });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "registry_candidate_not_local_safe");
  assert.equal(result.ir_shape_readiness_check.ir_candidate_ready_local, false);
  assert.equal(
    result.pm_ir_projection_candidate.candidate_status,
    "ir_candidate_blocked",
  );
});

test("keeps IR real created=false", () => {
  const result = run();

  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.materiality.ir_real_created, false);
});

test("keeps registry real created=false", () => {
  const result = run();

  assert.equal(result.no_go.registry_real_created, false);
  assert.equal(result.no_go.pm_registry_real_created, false);
  assert.equal(result.no_go.pf_registry_real_created, false);
  assert.equal(result.no_go.moc_registry_real_created, false);
  assert.equal(result.no_go.olc_registry_real_created, false);
});

test("keeps DiagrammingExportPackage ExportCodePackage false", () => {
  const result = run();

  assert.equal(result.no_go.diagramming_export_package_created, false);
  assert.equal(result.no_go.export_code_package_created, false);
});

test("keeps export false", () => {
  const result = run();

  assert.equal(result.no_go.export_created, false);
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
  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
});

function run(overrides = {}) {
  return service.runMMABPIRCandidateLocalDryRun({
    case_id: "case:ir-candidate",
    registry_candidate_result: registryCandidateResult(),
    ...overrides,
  });
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function registryCandidateResult() {
  const restrictions = [
    "registry_real_blocked",
    "ir_blocked",
    "export_blocked",
    "diagnosis_blocked",
    "phase3_real_blocked",
  ];

  return {
    ok: true,
    case_id: "case:ir-candidate",
    registry_candidate_manifest: {
      manifest_id: "REGISTRY_CANDIDATE_LOCAL_MANIFEST:case:ir-candidate",
      case_id: "case:ir-candidate",
      items: ["PM", "PF", "MoC", "OLC"].map((model_kind) => ({
        candidate_id: `REGISTRY_CANDIDATE_LOCAL_${model_kind}:case:ir-candidate`,
        model_kind,
        source_object_refs: ["source:one", "source:two"],
        candidate_status: "candidate_ready_with_restrictions",
        local_only: true,
        creates_registry_real: false,
        restrictions,
        governance_issue_refs: [],
      })),
      local_only: true,
      registry_real_created: false,
      audit_log: [],
    },
    pm_registry_candidate: {
      pm_candidate_id: "PM_REGISTRY_CANDIDATE_LOCAL:case:ir-candidate",
      case_id: "case:ir-candidate",
      candidate_status: "candidate_ready_with_restrictions",
      process_intention_candidate:
        "local_registry_candidate_projection_from_fase2_baseline_handoff",
      trigger_candidate_present: true,
      target_state_candidate_present: true,
      support_process_boundary_preserved: true,
      creates_pm_registry_real: false,
      restrictions,
    },
    pf_registry_candidate: {
      pf_candidate_id: "PF_REGISTRY_CANDIDATE_LOCAL:case:ir-candidate",
      case_id: "case:ir-candidate",
      candidate_status: "candidate_ready_with_restrictions",
      sequence_candidate_present: true,
      process_state_candidate_present: true,
      timer_candidate_present: true,
      no_swimlane_contamination: true,
      creates_pf_registry_real: false,
      restrictions,
    },
    moc_registry_candidate: {
      moc_candidate_id: "MOC_REGISTRY_CANDIDATE_LOCAL:case:ir-candidate",
      case_id: "case:ir-candidate",
      candidate_status: "candidate_ready_with_restrictions",
      object_class_candidate_present: true,
      relationship_candidate_present: true,
      isa_boundary_preserved: true,
      no_database_reduction: true,
      creates_moc_registry_real: false,
      restrictions,
    },
    olc_registry_candidate: {
      olc_candidate_id: "OLC_REGISTRY_CANDIDATE_LOCAL:case:ir-candidate",
      case_id: "case:ir-candidate",
      candidate_status: "candidate_ready_with_restrictions",
      lifecycle_object_candidate_present: true,
      state_candidate_present: true,
      transition_candidate_present: true,
      external_stimulus_or_time_required: true,
      no_process_reduction: true,
      creates_olc_registry_real: false,
      restrictions,
    },
    registry_readiness_check: {
      readiness_check_id: "REGISTRY_CANDIDATE_LOCAL_READINESS:case:ir-candidate",
      case_id: "case:ir-candidate",
      registry_candidate_ready_local: true,
      registry_real_ready: false,
      registry_creation_allowed: false,
      blocked_reasons: [],
      warnings: restrictions,
    },
    cross_model_consistency_precheck: {
      precheck_id:
        "REGISTRY_CANDIDATE_LOCAL_CROSS_MODEL_PRECHECK:case:ir-candidate",
      case_id: "case:ir-candidate",
      conformance_claimed: false,
      consistency_claimed: false,
      factual_precheck_possible: true,
      temporal_precheck_possible: true,
      structural_precheck_possible: true,
      composite_precheck_possible: true,
      unresolved_model_links: [],
      rule: "precheck_only_return_to_reality_for_actual_correction",
    },
    registry_no_go_boundary_check: {
      boundary_check_id:
        "REGISTRY_CANDIDATE_LOCAL_NO_GO_BOUNDARY:case:ir-candidate",
      case_id: "case:ir-candidate",
      registry_creation_allowed: false,
      ir_creation_allowed: false,
      export_creation_allowed: false,
      diagnosis_creation_allowed: false,
      phase3_real_opening_allowed: false,
      reason: "registry_candidate_dry_run_only",
    },
    governance_issue_refs: [],
    no_go: {
      registry_real_created: false,
      pm_registry_real_created: false,
      pf_registry_real_created: false,
      moc_registry_real_created: false,
      olc_registry_real_created: false,
      ir_created: false,
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
      level: "registry_candidate_local_dry_run",
      local_only: true,
      production_integration: false,
      registry_real_created: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./mmabp-ir-candidate-local-dry-run-service.ts", import.meta.url),
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
      if (specifier === "./mmabp-ir-candidate-local-dry-run-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "mmabp-ir-candidate-local-dry-run-service.ts",
  });

  return context.exports;
}
