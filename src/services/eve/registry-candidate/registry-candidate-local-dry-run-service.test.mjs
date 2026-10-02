import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates registry candidate manifest from valid Fase 2 baseline result", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.registry_candidate_manifest.local_only, true);
  assert.equal(result.registry_candidate_manifest.registry_real_created, false);
  assertJsonEqual(
    result.registry_candidate_manifest.items.map((item) => item.model_kind),
    ["PM", "PF", "MoC", "OLC"],
  );
});

test("creates PM registry candidate local", () => {
  const result = run();

  assert.equal(
    result.pm_registry_candidate.candidate_status,
    "candidate_ready_with_restrictions",
  );
  assert.equal(result.pm_registry_candidate.trigger_candidate_present, true);
  assert.equal(result.pm_registry_candidate.target_state_candidate_present, true);
  assert.equal(
    result.pm_registry_candidate.support_process_boundary_preserved,
    true,
  );
  assert.equal(result.pm_registry_candidate.creates_pm_registry_real, false);
});

test("creates PF registry candidate local", () => {
  const result = run();

  assert.equal(
    result.pf_registry_candidate.candidate_status,
    "candidate_ready_with_restrictions",
  );
  assert.equal(result.pf_registry_candidate.sequence_candidate_present, true);
  assert.equal(result.pf_registry_candidate.process_state_candidate_present, true);
  assert.equal(result.pf_registry_candidate.timer_candidate_present, true);
  assert.equal(result.pf_registry_candidate.no_swimlane_contamination, true);
  assert.equal(result.pf_registry_candidate.creates_pf_registry_real, false);
});

test("creates MoC registry candidate local", () => {
  const result = run();

  assert.equal(
    result.moc_registry_candidate.candidate_status,
    "candidate_ready_with_restrictions",
  );
  assert.equal(result.moc_registry_candidate.object_class_candidate_present, true);
  assert.equal(result.moc_registry_candidate.relationship_candidate_present, true);
  assert.equal(result.moc_registry_candidate.isa_boundary_preserved, true);
  assert.equal(result.moc_registry_candidate.no_database_reduction, true);
  assert.equal(result.moc_registry_candidate.creates_moc_registry_real, false);
});

test("creates OLC registry candidate local", () => {
  const result = run();

  assert.equal(
    result.olc_registry_candidate.candidate_status,
    "candidate_ready_with_restrictions",
  );
  assert.equal(
    result.olc_registry_candidate.lifecycle_object_candidate_present,
    true,
  );
  assert.equal(result.olc_registry_candidate.state_candidate_present, true);
  assert.equal(result.olc_registry_candidate.transition_candidate_present, true);
  assert.equal(
    result.olc_registry_candidate.external_stimulus_or_time_required,
    true,
  );
  assert.equal(result.olc_registry_candidate.no_process_reduction, true);
  assert.equal(result.olc_registry_candidate.creates_olc_registry_real, false);
});

test("creates registry readiness check", () => {
  const result = run();

  assert.equal(result.registry_readiness_check.registry_candidate_ready_local, true);
  assert.equal(result.registry_readiness_check.registry_real_ready, false);
  assert.equal(result.registry_readiness_check.registry_creation_allowed, false);
});

test("creates cross-model consistency precheck with conformance_claimed=false", () => {
  const result = run();

  assert.equal(result.cross_model_consistency_precheck.conformance_claimed, false);
  assert.equal(result.cross_model_consistency_precheck.factual_precheck_possible, true);
});

test("creates cross-model consistency precheck with consistency_claimed=false", () => {
  const result = run();

  assert.equal(result.cross_model_consistency_precheck.consistency_claimed, false);
  assert.equal(
    result.cross_model_consistency_precheck.composite_precheck_possible,
    true,
  );
  assert.equal(
    result.cross_model_consistency_precheck.rule,
    "precheck_only_return_to_reality_for_actual_correction",
  );
});

test("creates registry No-Go boundary check with registry_creation_allowed=false", () => {
  const result = run();

  assert.equal(
    result.registry_no_go_boundary_check.registry_creation_allowed,
    false,
  );
  assert.equal(result.registry_no_go_boundary_check.ir_creation_allowed, false);
  assert.equal(result.registry_no_go_boundary_check.export_creation_allowed, false);
  assert.equal(
    result.registry_no_go_boundary_check.diagnosis_creation_allowed,
    false,
  );
  assert.equal(
    result.registry_no_go_boundary_check.phase3_real_opening_allowed,
    false,
  );
});

test("blocks if Fase 2 input is not local-safe", () => {
  const fase2 = fase2Result();
  fase2.ok = false;
  const result = run({ fase2_baseline_result: fase2 });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "fase2_baseline_not_local_safe");
  assert.equal(
    result.registry_readiness_check.registry_candidate_ready_local,
    false,
  );
  assert.equal(result.pm_registry_candidate.candidate_status, "candidate_blocked");
});

test("keeps PM PF MoC OLC registry real created=false", () => {
  const result = run();

  assert.equal(result.no_go.pm_registry_real_created, false);
  assert.equal(result.no_go.pf_registry_real_created, false);
  assert.equal(result.no_go.moc_registry_real_created, false);
  assert.equal(result.no_go.olc_registry_real_created, false);
  assert.equal(result.no_go.registry_real_created, false);
});

test("keeps IR export ExportCodePackage false", () => {
  const result = run();

  assert.equal(result.no_go.ir_created, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.export_code_package_created, false);
  assert.equal(result.no_go.diagramming_export_package_created, false);
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
  assert.equal(result.materiality.registry_real_created, false);
  assert.equal(result.materiality.next_authorization_required, true);
  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
});

function run(overrides = {}) {
  return service.runRegistryCandidateLocalDryRun({
    case_id: "case:registry-candidate",
    fase2_baseline_result: fase2Result(),
    ...overrides,
  });
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function fase2Result() {
  const sourceObjects = [
    ["MDSBHandoffCandidate", "F8_LOCAL_MDSB_CANDIDATE:case:registry-candidate", "candidate_only"],
    ["DesignReadinessAssessment", "F8_LOCAL_DESIGN_READINESS:case:registry-candidate", "ready_for_local_rehearsal"],
    ["NoGoParallelProductionCheck", "F8_LOCAL_NO_GO_PP:case:registry-candidate", "no_go_cleared_for_local_only"],
    ["ObjectCandidateLinkageCheck", "F8_LOCAL_OBJECT_LINKAGE:case:registry-candidate", "object_candidate_linkage_ok"],
    ["RuntimeEvidenceBundleReference", "F8_LOCAL_EVIDENCE_REF:case:registry-candidate", "reference_only"],
    ["SGShadowParallelAuditNote", "F8_LOCAL_SG_AUDIT_NOTE:case:registry-candidate", "report_only"],
  ];

  return {
    ok: true,
    case_id: "case:registry-candidate",
    baseline_record: {
      baseline_id: "FASE2_LOCAL_BASELINE:case:registry-candidate",
      case_id: "case:registry-candidate",
      state: "partial_baseline_with_blocks",
      source_object_manifest: sourceObjects.map(
        ([object_name, source_ref, source_state]) => ({
          object_name,
          source_ref,
          source_state,
          consumable_locally: true,
          consumable_productively: false,
          restrictions: ["registry_blocked"],
        }),
      ),
      approved_object_set: [
        "qa_audit",
        "control_plane_summary",
        "future_phase3_candidate",
      ],
      blocked_object_set: [
        "registry",
        "IR",
        "export",
        "diagnosis",
        "phase3_real",
        "production_parallel_real",
      ],
      issue_manifest: [
        "registry_blocked",
        "ir_blocked",
        "export_blocked",
        "diagnosis_blocked",
      ],
      version: "fase2-local-baseline-v1",
      local_only: true,
      audit_log: [],
    },
    handoff_decision: {
      handoff_decision_id: "FASE2_LOCAL_HANDOFF:case:registry-candidate",
      case_id: "case:registry-candidate",
      decision: "local_handoff_ready_with_restrictions",
      allowed_destinations: [
        "qa_audit",
        "control_plane_summary",
        "future_phase3_candidate",
      ],
      blocked_destinations: [
        "registry",
        "IR",
        "export",
        "diagnosis",
        "phase3_real",
        "production_parallel_real",
      ],
      restrictions: [
        "registry_blocked",
        "ir_blocked",
        "export_blocked",
        "diagnosis_blocked",
      ],
      governance_issue_refs: [],
    },
    handoff_matrix: sourceObjects.flatMap(([object_name]) =>
      [
        "qa_audit",
        "control_plane_summary",
        "future_phase3_candidate",
        "registry",
        "IR",
        "export",
        "diagnosis",
        "phase3_real",
        "production_parallel_real",
      ].map((destination) => ({
        source_object: object_name,
        destination,
        allowed: [
          "qa_audit",
          "control_plane_summary",
          "future_phase3_candidate",
        ].includes(destination),
        reason: `${destination}_local_boundary`,
      })),
    ),
    inventory_update_candidate: {
      inventory_update_candidate_id:
        "FASE2_LOCAL_INVENTORY_UPDATE_CANDIDATE:case:registry-candidate",
      case_id: "case:registry-candidate",
      candidate_only: true,
      updates_inventory_real: false,
      source_baseline_ref: "FASE2_LOCAL_BASELINE:case:registry-candidate",
      objects_to_register_later: sourceObjects.map(([object_name]) => object_name),
      restrictions: ["registry_blocked"],
    },
    phase3_opening_boundary_check: {
      phase3_boundary_check_id:
        "FASE2_LOCAL_PHASE3_BOUNDARY:case:registry-candidate",
      case_id: "case:registry-candidate",
      phase3_real_opening_allowed: false,
      vsm_ahe_diagnosis_allowed: false,
      reason: "phase3_not_authorized_from_local_baseline",
      blockers: ["phase3_real_blocked", "diagnosis_blocked"],
    },
    governance_issue_refs: [],
    no_go: {
      production_parallel_real_opened: false,
      phase3_real_opened: false,
      registry_created: false,
      ir_created: false,
      export_created: false,
      export_code_package_created: false,
      diagnosis_created: false,
      delivered_created: false,
      delivery_authorized: false,
      inventory_real_updated: false,
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
      level: "fase2_local_baseline_handoff_readiness",
      local_only: true,
      production_integration: false,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./registry-candidate-local-dry-run-service.ts", import.meta.url),
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
      if (specifier === "./registry-candidate-local-dry-run-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "registry-candidate-local-dry-run-service.ts",
  });

  return context.exports;
}
