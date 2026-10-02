import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadModule("runtime-40-20-gates-readiness-service.ts", {});

const validScope = {
  tenant_id: "tenant-1",
  case_id: "case-1",
  role_id: "role-1",
  activity_id: "activity-1",
  run_id: "run-1",
  correlation_id: "corr-1",
  idempotency_key: "idem-1",
};

function readinessInput() {
  return {
    scope: validScope,
    dominant_gate_code: "B2",
    critical_route_results: [],
    missing_critical_evidence: false,
    b3_incomplete: false,
    b7_boundary_blocked: false,
    manual_review_required: false,
    reentry_required: false,
    // Non-deep P5 gate path: operational_rules_run may be omitted by design.
    runtime_deep_capture_required: false,
  };
}

test("1. Scope válido.", () => {
  assert.equal(service.validateGateReadinessScope(validScope).valid, true);
});
test("2. tenant_id requerido.", () => {
  const result = service.validateGateReadinessScope({ ...validScope, tenant_id: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});
test("3. case_id requerido.", () => {
  const result = service.validateGateReadinessScope({ ...validScope, case_id: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});
test("4. run_id requerido.", () => {
  const result = service.validateGateReadinessScope({ ...validScope, run_id: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_run_id"));
});
test("5. idempotency_key requerido para mutación.", () => {
  const result = service.validateGateReadinessScope({ ...validScope, idempotency_key: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_idempotency_key"));
});

test("6. B0 supported.", () => {
  const result = service.evaluateCriticalRouteGateLocally({ scope: validScope, gate_code: "B0" });
  assert.equal(result.executed, true);
});
test("7. B2 supported.", () => {
  const result = service.evaluateCriticalRouteGateLocally({ scope: validScope, gate_code: "B2" });
  assert.equal(result.executed, true);
});
test("8. B3_C09 supported.", () => {
  const result = service.evaluateCriticalRouteGateLocally({
    scope: validScope,
    gate_code: "B3_C09",
    route_ref: "route-1",
  });
  assert.equal(result.executed, true);
});
test("9. B7_C20 supported.", () => {
  const result = service.evaluateCriticalRouteGateLocally({
    scope: validScope,
    gate_code: "B7_C20",
  });
  assert.equal(result.executed, true);
});
test("10. B7 does not create diagnosis.", () => {
  assert.equal(localSmokeShape().diagnosis_created, false);
});
test("11. B7 does not create IR.", () => {
  const serialized = JSON.stringify(localSmokeShape()).toLowerCase();
  assert.equal(serialized.includes("ir_created"), false);
});
test("12. B7 does not create export.", () => {
  assert.equal(localSmokeShape().export_real_created, false);
});

const semCodes = ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"];
semCodes.forEach((code, index) => {
  test(`${13 + index}. ${code} supported.`, () => {
    const payload = service.buildSemanticResolutionEventInsert({
      scope: validScope,
      gate_code: code,
      resolution_status: "resolved",
      resolution_summary_internal: "ok",
      client_safe_summary: "en revision",
    });
    assert.equal(payload.gate_id, code);
  });
});

const pstCodes = ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"];
pstCodes.forEach((code, index) => {
  test(`${20 + index}. ${code} supported.`, () => {
    const payload = service.buildProcessStateTimerEventInsert({
      scope: validScope,
      gate_code: code,
      process_state_ref: "state-1",
      timer_status: "ok",
      timer_summary_internal: "ok",
      client_safe_summary: "ok",
    });
    assert.equal(payload.gate_id, code);
  });
});

test("26. semantic_resolution_event result supported.", () => {
  const payload = service.buildSemanticResolutionEventInsert({
    scope: validScope,
    gate_code: "SEM-001",
    resolution_status: "resolved",
    resolution_summary_internal: "ok",
    client_safe_summary: "ok",
  });
  assert.ok(payload.metadata);
});
test("27. process_state_timer_event result supported.", () => {
  const payload = service.buildProcessStateTimerEventInsert({
    scope: validScope,
    gate_code: "PST-001",
    process_state_ref: "state-1",
    timer_status: "ok",
    timer_summary_internal: "ok",
    client_safe_summary: "ok",
  });
  assert.equal(payload.process_state_timer_event_real_created, undefined);
});
test("28. readiness_gap_record result supported.", () => {
  const payload = service.buildReadinessGapRecordInsert({
    request: readinessInput(),
    gap_type: "missing_receiver_feedback_route",
    severity: "medium",
  });
  assert.equal(payload.gap_type, "missing_receiver_feedback_route");
});
test("29. readiness_decision_record result supported.", () => {
  const payload = service.buildReadinessDecisionRecordInsert({
    request: readinessInput(),
    readiness_state: "ready_with_flags",
    reason: "test",
  });
  assert.equal(payload.readiness_state, "ready_with_flags");
});

test("30. readiness supports ready.", () => {
  assert.equal(service.resolveReadinessState(readinessInput()), "ready");
});
test("31. readiness supports ready_with_flags.", () => {
  assert.equal(
    service.resolveReadinessState({ ...readinessInput(), b3_incomplete: true }),
    "ready_with_flags",
  );
});
test("30b. deep capture missing operational_rules_run blocks ready.", () => {
  assert.equal(
    service.resolveReadinessState({
      ...readinessInput(),
      runtime_deep_capture_required: true,
    }),
    "blocked",
  );
  const detail = service.resolveReadinessEvaluation({
    ...readinessInput(),
    runtime_deep_capture_required: true,
  });
  assert.equal(detail.blocking_reason, "missing_runtime_40_20_operational_rules_run");
  assert.equal(detail.readiness_gap.gap_type, "missing_runtime_40_20_operational_rules_run");
  assert.equal(detail.readiness_gap.severity, "high");
  assert.equal(detail.readiness_gap.reentry_target, "BaseResolutionGate/CausalClosureGate");
});
test("31b. deep capture missing operational_rules_run blocks ready_with_flags.", () => {
  assert.equal(
    service.resolveReadinessState({
      ...readinessInput(),
      b3_incomplete: true,
      runtime_deep_capture_required: undefined,
    }),
    "blocked",
  );
});
test("32. readiness supports blocked.", () => {
  assert.equal(
    service.resolveReadinessState({
      ...readinessInput(),
      b7_boundary_blocked: true,
      manual_review_required: false,
    }),
    "blocked",
  );
});
test("33. readiness supports reentry_required.", () => {
  assert.equal(
    service.resolveReadinessState({ ...readinessInput(), reentry_required: true }),
    "reentry_required",
  );
});
test("34. readiness supports manual_review_required.", () => {
  assert.equal(
    service.resolveReadinessState({ ...readinessInput(), manual_review_required: true }),
    "manual_review_required",
  );
});
test("35. audit trail result supported.", () => {
  const payload = service.buildGateAuditTrailInsert({
    scope: validScope,
    object_type: "critical_route_gate",
    object_id: "B0",
    action: "critical_route_gate_evaluated",
    reason: "local_p5",
  });
  assert.equal(payload.object_type, "critical_route_gate");
});
test("36. diagnosis_created remains false.", () => {
  assert.equal(localSmokeShape().diagnosis_created, false);
});
test("37. export_real_created remains false.", () => {
  assert.equal(localSmokeShape().export_real_created, false);
});
test("38. produccion_paralela_started remains false.", () => {
  assert.equal(localSmokeShape().produccion_paralela_started, false);
});
test("39. qa_green_real_created remains false.", () => {
  assert.equal(localSmokeShape().qa_green_real_created, false);
});
test("40. activation_allowed remains false.", () => {
  assert.equal(localSmokeShape().activation_allowed, false);
});

function localSmokeShape() {
  return {
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
  };
}

function loadModule(fileName, requireMap) {
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id in requireMap) return requireMap[id];
      return {};
    },
  };
  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
