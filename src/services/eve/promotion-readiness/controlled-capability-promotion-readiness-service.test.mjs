import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates controlled promotion readiness pack from valid local closure audit", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.readiness_pack.readiness_status, "ready_for_authorization_review");
  assert.equal(result.readiness_pack.local_chain_closed, true);
});

test("creates promotion scope matrix", () => {
  const result = run();

  assert.equal(result.promotion_scope_matrix.length, 9);
  assert.ok(
    result.promotion_scope_matrix.every(
      (entry) => entry.blocked_until_authorized === true,
    ),
  );
});

test("creates capability promotion sequence in correct order", () => {
  const result = run();

  assertJsonEqual(
    result.capability_promotion_sequence.map((step) => step.capability),
    [
      "registry_real_minimal",
      "ir_real_minimal",
      "object_inventory_real_minimal",
      "f5c_real_minimal",
      "integration_membrane_real_minimal",
      "runtime_40_20_real",
      "parallel_production_real",
      "export_real",
      "diagnosis_delivery_real",
    ],
  );
});

test("creates authorization gate manifest", () => {
  const result = run();

  assert.equal(result.authorization_gate_manifest.length, 63);
  assert.ok(
    result.authorization_gate_manifest.every(
      (gate) =>
        gate.gate_required === true &&
        gate.gate_passed_now === false &&
        gate.gate_execution_allowed_now === false,
    ),
  );
});

test("creates risk boundary manifest", () => {
  const result = run();

  assert.equal(result.risk_boundary_manifest.length, 9);
  assert.ok(
    result.risk_boundary_manifest.some(
      (risk) => risk.risk_type === "runtime_on_simulation",
    ),
  );
});

test("creates rollback guard manifest", () => {
  const result = run();

  assert.equal(result.rollback_guard_manifest.length, 9);
  assert.ok(
    result.rollback_guard_manifest.every(
      (guard) =>
        guard.rollback_required_before_promotion === true &&
        guard.rollback_executed_now === false,
    ),
  );
});

test("creates promotion No-Go check", () => {
  const result = run();

  assert.equal(result.promotion_no_go_check.promotion_executed, false);
  assert.equal(result.promotion_no_go_check.automatic_promotion_allowed, false);
});

test("recommends registry_real_minimal as first authorization target", () => {
  const result = run();

  assert.equal(
    result.readiness_pack.recommended_first_authorization,
    "registry_real_minimal",
  );
});

test("does not recommend runtime_40_20_real as first authorization target", () => {
  const result = run();

  assert.notEqual(
    result.readiness_pack.recommended_first_authorization,
    "runtime_40_20_real",
  );
});

test("keeps promotion_executed=false", () => {
  const result = run();

  assert.equal(result.readiness_pack.promotion_executed, false);
  assert.equal(result.no_go.promotion_executed, false);
});

test("keeps automatic_promotion_allowed=false", () => {
  const result = run();

  assert.equal(result.readiness_pack.automatic_promotion_allowed, false);
  assert.equal(result.no_go.automatic_promotion_allowed, false);
});

test("keeps all authorized_now=false", () => {
  const result = run();

  assert.ok(
    result.promotion_scope_matrix.every(
      (entry) => entry.authorized_now === false,
    ),
  );
});

test("keeps all executed_now=false", () => {
  const result = run();

  assert.ok(
    result.promotion_scope_matrix.every((entry) => entry.executed_now === false),
  );
});

test("blocks if local closure audit is not closed", () => {
  const audit = localClosureAuditResult();
  audit.materiality.chain_closed_local_only = false;
  const result = run({ local_closure_audit_result: audit });

  assert.equal(result.ok, false);
  assert.equal(result.readiness_pack.readiness_status, "blocked");
  assert.equal(result.blocked_reason, "local_chain_not_closed");
});

test("keeps Runtime 40/20 real not started", () => {
  const result = run();

  assert.equal(result.no_go.runtime_40_20_started, false);
});

test("keeps registry IR Object Inventory F5C real false", () => {
  const result = run();

  assert.equal(result.no_go.registry_real_created, false);
  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
});

test("keeps export diagnosis Delivered false", () => {
  const result = run();

  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
});

test("keeps conformance consistency claimed false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
  assert.equal(result.no_go.consistency_claimed, false);
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
  assert.equal(result.materiality.promotion_executed, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runControlledCapabilityPromotionReadiness({
    case_id: "case:controlled-promotion-readiness",
    local_closure_audit_result: localClosureAuditResult(),
    ...overrides,
  });
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function localClosureAuditResult() {
  return {
    ok: true,
    case_id: "case:controlled-promotion-readiness",
    closure_audit: {
      audit_id:
        "LOCAL_MATERIALITY_CHAIN_CLOSURE_AUDIT:case:controlled-promotion-readiness",
      case_id: "case:controlled-promotion-readiness",
      closure_status: "closed_local_only",
      local_only: true,
      production_integration: false,
      stage_ledger: [],
      audit_log: [],
    },
    e2e_no_go_matrix: [],
    materiality_stage_ledger: [],
    boundary_violation_scan: {
      scan_id: "LOCAL_MATERIALITY_BOUNDARY_SCAN:case:controlled-promotion-readiness",
      case_id: "case:controlled-promotion-readiness",
      violations_found: false,
      violation_count: 0,
      scanned_boundaries: [],
      boundary_violations: [],
    },
    overclaim_detection_report: {
      report_id:
        "LOCAL_MATERIALITY_OVERCLAIM_REPORT:case:controlled-promotion-readiness",
      case_id: "case:controlled-promotion-readiness",
      overclaim_detected: false,
      overclaim_count: 0,
      forbidden_claims_checked: [],
      overclaims: [],
      rule: "no_real_capability_claim_without_authorized_real_artifact",
    },
    next_authorization_boundary_check: {
      authorization_check_id:
        "LOCAL_MATERIALITY_NEXT_AUTHORIZATION:case:controlled-promotion-readiness",
      case_id: "case:controlled-promotion-readiness",
      next_authorization_required: true,
      allowed_next_authorization_topics: ["real_registry_authorization"],
      automatic_promotion_allowed: false,
      reason: "local_chain_closed_but_real_capabilities_remain_unauthorized",
    },
    closure_readiness_summary: {
      summary_id:
        "LOCAL_MATERIALITY_CLOSURE_SUMMARY:case:controlled-promotion-readiness",
      case_id: "case:controlled-promotion-readiness",
      closure_status: "closed_local_only",
      local_chain_closed: true,
      real_capabilities_opened: false,
      production_integration_opened: false,
      export_ready_real: false,
      diagnosis_ready_real: false,
      delivery_ready_real: false,
      readiness_statement:
        "Local materiality chain is closed as local-only readiness; real capabilities remain unauthorized.",
      restrictions: [
        "automatic_promotion_blocked",
        "real_capabilities_require_next_authorization",
      ],
    },
    governance_issue_refs: [],
    no_go: {
      runtime_40_20_full_opened: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      integration_membrane_real_opened: false,
      control_plane_real_opened: false,
      sg_shadow_real_opened: false,
      soft_governance_activated: false,
      enforcement_activated: false,
      production_parallel_real_opened: false,
      phase3_real_opened: false,
      registry_real_created: false,
      pm_registry_real_created: false,
      pf_registry_real_created: false,
      moc_registry_real_created: false,
      olc_registry_real_created: false,
      ir_real_created: false,
      diagramming_export_package_real_created: false,
      export_code_package_real_created: false,
      export_created: false,
      export_file_created: false,
      zip_created: false,
      diagram_file_created: false,
      diagnosis_created: false,
      delivered_created: false,
      delivery_authorized: false,
      client_delivery_created: false,
      download_created: false,
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
      level: "local_materiality_chain_closure_audit",
      local_only: true,
      production_integration: false,
      chain_closed_local_only: true,
      next_authorization_required: true,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./controlled-capability-promotion-readiness-service.ts", import.meta.url),
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
      if (specifier === "./controlled-capability-promotion-readiness-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "controlled-capability-promotion-readiness-service.ts",
  });

  return context.exports;
}
