import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

const types = loadTypesModule();
const service = loadModule("runtime-40-20-consultant-result-service.ts", {
  "./runtime-40-20-consultant-result-types": types,
  "./runtime-40-20-consultant-result-local-adapter": {
    EVEConsultantLocalSnapshot: {},
  },
  "../gates-readiness/runtime-40-20-gates-readiness-types": {},
});

const validScope = {
  tenant_id: "tenant-1",
  case_id: "case-1",
  role_id: "role-1",
  activity_id: "activity-1",
  run_id: "run-1",
  consultant_user_id: "consultant-1",
  correlation_id: "corr-1",
  idempotency_key: "idem-1",
};

function buildSnapshot(readinessState = "ready_with_flags") {
  return {
    session_summary: {
      tenant_id: validScope.tenant_id,
      case_id: validScope.case_id,
      role_id: validScope.role_id,
      role_runtime_session_id: "session-1",
      session_status: "active",
      correlation_id: validScope.correlation_id,
    },
    activity_summary: {
      activity_id: validScope.activity_id,
      run_id: validScope.run_id,
      activity_runtime_run_id: "arr-1",
      run_status: "in_progress",
      primary_activity: true,
    },
    answers_and_subfields: [
      {
        interaction_instance_id: "int-1",
        subfield_response_id: "sub-1",
        question_ref: "1.1",
        subfield_ref: "verb",
        captured_value: "elaborar",
        provenance: "user",
      },
    ],
    evidence_items: [
      {
        evidence_item_id: "ev-1",
        evidence_type: "answer",
        source_ref: "sub-1",
        summary_internal: "evidencia de respuesta",
        linked_variable_refs: [],
      },
    ],
    canonical_variables: [
      {
        canonical_variable_record_id: "cv-1",
        variable_code: "1.1",
        variable_value: "elaborar",
        provenance: "user",
        confidence: "high",
      },
    ],
    readiness_gaps: [
      {
        readiness_gap_record_id: "gap-1",
        gap_code: "B3_C09",
        status: "open",
        severity: "medium",
        summary_internal: "gap interno",
      },
    ],
    gate_summaries: [
      {
        gate_code: "B3_C09",
        gate_kind: "critical_route",
        status: "dominant",
        summary_internal: "gate review",
        event_id: null,
      },
    ],
    readiness_decision: {
      readiness_decision_record_id: "dec-1",
      readiness_state: readinessState,
      consultant_review_state: "manual_review_required",
      dominant_gate: "B3_C09",
      manual_review_required: false,
      reentry_required: false,
      reason: "p5_fixture",
    },
    reentry_target: null,
    client_safe_result: {
      visible_state: "resultado_en_revision",
      visible_title: "Resultado en revisión",
      visible_message: "Tu información está en revisión.",
      visible_next_action: { kind: "esperar_revision", label: "Esperar", enabled: true },
      review_pending: true,
      can_correct: true,
      can_reenter: false,
      client_safe: true,
    },
    audit_trail: [
      {
        audit_trail_id: "audit-1",
        object_type: "readiness_decision_record",
        object_id: "dec-1",
        action: "created",
        actor_type: "system_local_adapter",
        created_at: "2026-07-08T00:00:00.000Z",
      },
    ],
  };
}

test("1. Scope valid.", () => {
  const result = service.validateConsultantReviewPacketScope(validScope);
  assert.equal(result.valid, true);
});

test("2. tenant_id required.", () => {
  const { tenant_id: _t, ...rest } = validScope;
  const result = service.validateConsultantReviewPacketScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});

test("3. case_id required.", () => {
  const { case_id: _c, ...rest } = validScope;
  const result = service.validateConsultantReviewPacketScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});

test("4. run_id required.", () => {
  const { run_id: _r, ...rest } = validScope;
  const result = service.validateConsultantReviewPacketScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_run_id"));
});

test("5. consultant_user_id required.", () => {
  const { consultant_user_id: _u, ...rest } = validScope;
  const result = service.validateConsultantReviewPacketScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_consultant_user_id"));
});

test("6. idempotency_key required.", () => {
  const { idempotency_key: _i, ...rest } = validScope;
  const result = service.validateConsultantReviewPacketScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_idempotency_key"));
});

test("7. Packet includes session summary.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.session_summary.tenant_id);
});

test("8. Packet includes activity summary.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.activity_summary.run_id);
});

test("9. Packet includes answers/subfields.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.answers_and_subfields.length > 0);
});

test("10. Packet includes evidence summaries.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.evidence_items.length > 0);
});

test("11. Packet includes canonical variables.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.canonical_variables.length > 0);
});

test("12. Packet includes readiness gaps.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.readiness_gaps.length > 0);
});

test("13. Packet includes gate summaries.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.gate_summaries.length > 0);
});

test("14. Packet includes readiness decision.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.readiness_decision.readiness_decision_record_id);
});

test("15. Packet includes audit trail.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.ok(packet.audit_trail.length > 0);
});

test("16. Packet includes client safe result.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(packet.client_safe_result.client_safe, true);
});

test("17. ready maps to ready_for_consultant_review.", () => {
  const state = service.mapReadinessStateToConsultantReviewState("ready");
  assert.equal(state, "ready_for_consultant_review");
});

test("18. ready_with_flags maps to consultant_review_required_with_flags.", () => {
  const state = service.mapReadinessStateToConsultantReviewState("ready_with_flags");
  assert.equal(state, "consultant_review_required_with_flags");
});

test("19. blocked maps to blocked_requires_review.", () => {
  const state = service.mapReadinessStateToConsultantReviewState("blocked");
  assert.equal(state, "blocked_requires_review");
});

test("20. reentry_required maps to reentry_required_before_consultant_close.", () => {
  const state = service.mapReadinessStateToConsultantReviewState("reentry_required");
  assert.equal(state, "reentry_required_before_consultant_close");
});

test("21. manual_review_required maps to manual_review_required.", () => {
  const state = service.mapReadinessStateToConsultantReviewState("manual_review_required");
  assert.equal(state, "manual_review_required");
});

test("22. diagnosis_final absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("diagnosis_final"), false);
});

test("23. diagnostic_label absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("diagnostic_label"), false);
});

test("24. pathology_classification absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("pathology_classification"), false);
});

test("25. AHE diagnostic output absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("ahe_diagnostic_output"), false);
});

test("26. VSM diagnostic output absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("vsm_diagnostic_output"), false);
});

test("27. MMABP final assessment absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("mmabp_final_assessment"), false);
});

test("28. registry final absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("registry_final"), false);
});

test("29. IR final absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("ir_final"), false);
});

test("30. export payload real absent.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(JSON.stringify(packet).includes("export_payload_real"), false);
});

test("31. Producción Paralela not started.", () => {
  const flags = service.buildP7ConsultantReviewPacketBoundaryFlags();
  assert.equal(flags.produccion_paralela_started, false);
});

test("32. QA green real remains false.", () => {
  const flags = service.buildP7ConsultantReviewPacketBoundaryFlags();
  assert.equal(flags.qa_green_real_created, false);
});

test("33. activation_allowed remains false.", () => {
  const flags = service.buildP7ConsultantReviewPacketBoundaryFlags();
  assert.equal(flags.activation_allowed, false);
});

test("34. packet_safe true.", () => {
  const packet = service.buildConsultantReviewPacketDTO(
    { scope: validScope },
    buildSnapshot(),
  );
  assert.equal(packet.packet_safe, true);
});

test("35. dependency-blocked default preserved.", () => {
  const blocked = service.isConsultantReviewPacketDependencyBlocked({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
    EVE_GATES_READINESS_LOCAL_ENABLED: "false",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });
  assert.equal(blocked, true);
});

test("36. local feature flag required.", () => {
  const status = service.getConsultantReviewPacketLocalAdapterStatus({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });
  assert.equal(status.dependency_blocked, true);
  assert.equal(status.blocked_reason, "consultant_review_packet_local_flag_disabled");
});

function loadTypesModule() {
  const gatesTypesPath = join(
    __dirname,
    "../gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const clientResultTypesPath = join(
    __dirname,
    "../client-result/runtime-40-20-client-result-types.ts",
  );
  return loadModule("runtime-40-20-consultant-result-types.ts", {
    "../gates-readiness/runtime-40-20-gates-readiness-types": loadFile(gatesTypesPath, {}),
    "../client-result/runtime-40-20-client-result-types": loadFile(clientResultTypesPath, {
      "../gates-readiness/runtime-40-20-gates-readiness-types": loadFile(gatesTypesPath, {}),
    }),
  });
}

function loadModule(fileName, requireMap) {
  return loadFile(new URL(fileName, import.meta.url), requireMap);
}

function loadFile(filePath, requireMap) {
  const source = readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: (id) => {
        if (id in requireMap) return requireMap[id];
        throw new Error(`Unexpected require: ${id} from ${filePath}`);
      },
      process,
    },
    { filename: String(filePath) },
  );
  return module.exports;
}
