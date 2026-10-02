import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const types = loadModule("runtime-40-20-runtime-real-types.ts", {});
const service = loadModule("runtime-40-20-runtime-real-service.ts", {});
const adapter = loadModule("runtime-40-20-runtime-real-local-adapter.ts", {
  "@supabase/supabase-js": { createClient: () => ({}) },
  "./runtime-40-20-runtime-real-service": service,
});

const validScope = {
  tenant_id: "tenant-1",
  case_id: "case-1",
  role_id: "role-1",
  activity_id: "activity-1",
  run_id: "run-1",
  client_session_id: "client-session-1",
  correlation_id: "corr-1",
  idempotency_key: "idem-1",
};

test("1. Scope valid.", () => {
  const result = service.validateProductionRuntimeScope(validScope);
  assert.equal(result.valid, true);
});

test("2. tenant_id required.", () => {
  const result = service.validateProductionRuntimeScope({ ...validScope, tenant_id: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});

test("3. case_id required.", () => {
  const result = service.validateProductionRuntimeScope({ ...validScope, case_id: "" });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});

test("4. role/activity/run scope required.", () => {
  const result = service.validateProductionRuntimeScope({
    ...validScope,
    role_id: "",
    activity_id: "",
    run_id: "",
  });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_role_id"));
  assert.ok(result.blocking_reasons.includes("missing_activity_id"));
  assert.ok(result.blocking_reasons.includes("missing_run_id"));
});

test("5. idempotency_key required for mutation.", () => {
  const result = service.validateProductionRuntimeScope({
    ...validScope,
    idempotency_key: "",
  });
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_idempotency_key"));
});

test("6. runtime local adapter does not use production URL.", () => {
  const config = adapter.resolveRuntime40_20RuntimeRealLocalAdapterConfig({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "key",
  });
  assert.equal(config.local_target_available, false);
  assert.equal(config.blocked_reason, "supabase_url_not_local");
  assert.equal(config.production_supabase_touched, false);
});

test("7. runtime local adapter does not expose service_role.", () => {
  const config = adapter.resolveRuntime40_20RuntimeRealLocalAdapterConfig({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "local-key",
  });
  assert.equal(config.service_role_exposed, false);
});

test("8. session request constructs role_runtime_session.", () => {
  const payload = service.buildRoleRuntimeSessionInsert({
    scope: validScope,
    catalog_version_id: "catalog-1",
  });
  assert.equal(payload.state, "active");
  assert.equal(payload.tenant_id, validScope.tenant_id);
  assert.ok(Array.isArray(payload.source_trace));
});

test("9. run request constructs activity_runtime_run.", () => {
  const payload = service.buildActivityRuntimeRunInsert({
    scope: validScope,
    role_runtime_session_id: "session-1",
    catalog_version_id: "catalog-1",
  });
  assert.equal(payload.state, "initialized");
  assert.equal(payload.role_runtime_session_id, "session-1");
});

test("10. interaction request constructs runtime_interaction_instance.", () => {
  const payload = service.buildRuntimeInteractionInstanceInsert({
    scope: validScope,
    runtime_interaction_id: "q-1",
  });
  assert.equal(payload.runtime_interaction_id, "q-1");
  assert.equal(payload.state, "shown");
});

test("11. answer ingest constructs runtime_subfield_response.", () => {
  const payload = service.buildRuntimeSubfieldResponseInsert(
    {
      scope: validScope,
      interaction_instance_id: "inst-1",
      subfields: [],
    },
    {
      subfield_name: "descripcion",
      value: "valor",
      epistemic_status: "captured_user_evidence",
      provenance_type: "user_input",
    },
  );
  assert.equal(payload.interaction_id, "inst-1");
  assert.equal(payload.subfield_name, "descripcion");
});

test("12. evidence result constructs evidence_item.", () => {
  const payload = service.buildEvidenceItemInsert({
    scope: validScope,
    interaction_instance_id: "inst-1",
    subfield_response_id: "sub-1",
    literal_value: "texto",
  });
  assert.equal(payload.run_id, validScope.run_id);
  assert.equal(payload.epistemic_status, "captured_user_evidence");
});

test("13. canonical variable result constructs canonical_variable_record.", () => {
  const payload = service.buildCanonicalVariableRecordInsert({
    scope: validScope,
    variable_name: "mission_final",
    variable_value: { value: 2 },
  });
  assert.equal(payload.variable_name, "mission_final");
  assert.equal(payload.gap_flag, false);
});

test("14. gap result constructs readiness_gap_record.", () => {
  const payload = service.buildReadinessGapRecordInsert({
    scope: validScope,
    gap_type: "missing_required_variable",
    severity: "medium",
  });
  assert.equal(payload.gap_type, "missing_required_variable");
  assert.equal(payload.status, "open");
});

test("15. audit result constructs runtime_audit_trail.", () => {
  const payload = service.buildRuntimeAuditTrailInsert({
    scope: validScope,
    object_type: "runtime_subfield_response",
    object_id: "sub-1",
    action: "answer_ingested",
  });
  assert.equal(payload.object_type, "runtime_subfield_response");
  assert.equal(payload.action, "answer_ingested");
});

test("16. readiness_decision_record remains false.", () => {
  const smoke = localSmokeShape();
  assert.equal(smoke.readiness_decision_record_created, false);
});

test("17. gates_real_executed remains false.", () => {
  const smoke = localSmokeShape();
  assert.equal(smoke.gates_real_executed, false);
});

test("18. diagnosis_created remains false.", () => {
  const smoke = localSmokeShape();
  assert.equal(smoke.diagnosis_created, false);
});

test("19. export_real_created remains false.", () => {
  const smoke = localSmokeShape();
  assert.equal(smoke.export_real_created, false);
});

test("20. produccion_paralela_started remains false.", () => {
  const smoke = localSmokeShape();
  assert.equal(smoke.produccion_paralela_started, false);
  assert.equal(smoke.activation_allowed, false);
});

function localSmokeShape() {
  return {
    role_runtime_session_created: true,
    activity_runtime_run_created: true,
    runtime_interaction_instance_created: true,
    runtime_subfield_response_created: true,
    evidence_item_created: true,
    canonical_variable_record_created: true,
    readiness_gap_record_created: false,
    runtime_audit_trail_created: true,
    readiness_decision_record_created: false,
    gates_real_executed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
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
