import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

const types = loadTypesModule();
const service = loadModule("runtime-40-20-parallel-production-service.ts", {
  "./runtime-40-20-parallel-production-types": types,
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

function buildConsultantPacket(readinessState = "ready") {
  return {
    packet_ref: "consultant-packet-run-1-idem-1",
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
        summary_internal: "evidencia",
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
        summary_internal: "gap",
      },
    ],
    gate_summaries: [
      {
        gate_code: "B3_C09",
        gate_kind: "critical_route",
        status: "dominant",
        summary_internal: "gate",
        event_id: null,
      },
      {
        gate_code: "SEM-001",
        gate_kind: "semantic",
        status: "resolved",
        summary_internal: "semantic",
        event_id: "sem-1",
      },
    ],
    readiness_decision: {
      readiness_decision_record_id: "dec-1",
      readiness_state: readinessState,
      consultant_review_state: "ready_for_consultant_review",
      dominant_gate: "B3_C09",
      manual_review_required: false,
      reentry_required: false,
      reason: "fixture",
    },
    manual_review: { manual_review_required: false, ready_with_flags: false },
    reentry: { reentry_required: false, reentry_target: null },
    client_safe_result: { client_safe: true },
    audit_trail: [
      {
        audit_trail_id: "audit-1",
        object_type: "readiness_decision_record",
        object_id: "dec-1",
        action: "created",
        actor_type: "system",
        created_at: "2026-07-08T00:00:00.000Z",
      },
    ],
    consultant_actions: [],
    packet_safe: true,
  };
}

function buildInput(readinessState = "ready") {
  return {
    scope: validScope,
    consultant_packet: buildConsultantPacket(readinessState),
    readiness_state: readinessState,
  };
}

test("1. Scope valid.", () => {
  const result = service.validateParallelProductionScope(validScope);
  assert.equal(result.valid, true);
});

test("2. tenant_id required.", () => {
  const { tenant_id: _t, ...rest } = validScope;
  const result = service.validateParallelProductionScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_tenant_id"));
});

test("3. case_id required.", () => {
  const { case_id: _c, ...rest } = validScope;
  const result = service.validateParallelProductionScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_case_id"));
});

test("4. run_id required.", () => {
  const { run_id: _r, ...rest } = validScope;
  const result = service.validateParallelProductionScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_run_id"));
});

test("5. consultant_user_id required.", () => {
  const { consultant_user_id: _u, ...rest } = validScope;
  const result = service.validateParallelProductionScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_consultant_user_id"));
});

test("6. idempotency_key required.", () => {
  const { idempotency_key: _i, ...rest } = validScope;
  const result = service.validateParallelProductionScope(rest);
  assert.equal(result.valid, false);
  assert.ok(result.blocking_reasons.includes("missing_idempotency_key"));
});

test("7. ready allows local export preparation.", () => {
  const eligibility = service.mapReadinessToExportEligibility("ready");
  assert.equal(eligibility, "export_preparation_allowed_local");
  assert.equal(service.isExportPreparationAllowed(eligibility), true);
});

test("8. ready_with_flags allows local export preparation with consultant review required.", () => {
  const eligibility = service.mapReadinessToExportEligibility("ready_with_flags");
  assert.equal(eligibility, "export_preparation_allowed_with_flags_local");
  assert.equal(service.isExportPreparationAllowed(eligibility), true);
  assert.equal(service.requiresConsultantReviewForEligibility(eligibility), true);
});

test("9. blocked blocks export preparation.", () => {
  const eligibility = service.mapReadinessToExportEligibility("blocked");
  assert.equal(eligibility, "export_preparation_blocked");
  assert.equal(service.isExportPreparationAllowed(eligibility), false);
});

test("10. reentry_required blocks export preparation.", () => {
  const eligibility = service.mapReadinessToExportEligibility("reentry_required");
  assert.equal(eligibility, "export_preparation_blocked_reentry_required");
  assert.equal(service.isExportPreparationAllowed(eligibility), false);
});

test("11. manual_review_required blocks export preparation.", () => {
  const eligibility = service.mapReadinessToExportEligibility("manual_review_required");
  assert.equal(eligibility, "export_preparation_blocked_manual_review_required");
  assert.equal(service.isExportPreparationAllowed(eligibility), false);
});

test("12. SceneCanonicalRecordPatch created.", () => {
  const patch = service.buildSceneCanonicalRecordPatch(buildInput());
  assert.equal(patch.created_local, true);
  assert.ok(patch.packet_ref);
  assert.ok(patch.source_evidence_refs.length > 0);
});

test("13. EvidenceBundlePatch created.", () => {
  const patch = service.buildEvidenceBundlePatch(buildInput());
  assert.equal(patch.created_local, true);
  assert.ok(patch.evidence_bundle_ref);
  assert.ok(patch.evidence_items.length > 0);
});

test("14. MMABPDesignSourceBundlePatch created.", () => {
  const patch = service.buildMMABPDesignSourceBundlePatch(buildInput());
  assert.equal(patch.created_local, true);
  assert.ok(patch.mdsb_patch_ref);
  assert.ok(patch.gates_summary_refs.length > 0);
});

test("15. parallel_export_payload local supported.", () => {
  const input = buildInput("ready");
  const scr = service.buildSceneCanonicalRecordPatch(input);
  const ev = service.buildEvidenceBundlePatch(input);
  const mdsb = service.buildMMABPDesignSourceBundlePatch(input);
  const payload = service.buildParallelExportPayloadLocal(
    input,
    scr,
    ev,
    mdsb,
    "export_preparation_allowed_local",
  );
  assert.ok(payload.payload_ref);
  assert.ok(payload.scr_patch);
  assert.ok(payload.evidence_bundle_patch);
  assert.ok(payload.mdsb_patch);
});

test("16. production_export_allowed remains false.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(rehearsal.production_export_allowed, false);
  if (rehearsal.parallel_export_payload) {
    assert.equal(rehearsal.parallel_export_payload.production_export_allowed, false);
  }
});

test("17. external_export_executed remains false.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(rehearsal.external_export_executed, false);
  if (rehearsal.parallel_export_payload) {
    assert.equal(rehearsal.parallel_export_payload.external_export_executed, false);
  }
});

test("18. Produccion Paralela started remains false.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(rehearsal.produccion_paralela_started, false);
});

test("19. diagnosis_final absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes('"diagnosis_final"'), false);
});

test("20. diagnostic_label absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes('"diagnostic_label"'), false);
});

test("21. pathology_classification absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes('"pathology_classification"'), false);
});

test("22. AHE/VSM diagnostic output absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  const serialized = JSON.stringify(rehearsal);
  assert.equal(serialized.includes("ahe_diagnostic_output"), false);
  assert.equal(serialized.includes("vsm_diagnostic_output"), false);
});

test("23. MMABP final assessment absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes("mmabp_final_assessment"), false);
});

test("24. registry final absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes('"registry_final"'), false);
});

test("25. IR final absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes('"ir_final"'), false);
});

test("26. diagram export absent.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(JSON.stringify(rehearsal).includes("diagram_export"), false);
});

test("27. QA green real remains false.", () => {
  const flags = service.buildP8ParallelProductionBoundaryFlags();
  assert.equal(flags.qa_green_real_created, false);
});

test("28. activation_allowed remains false.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput());
  assert.equal(rehearsal.activation_allowed, false);
  const flags = service.buildP8ParallelProductionBoundaryFlags();
  assert.equal(flags.activation_allowed, false);
});

test("29. packet requires consultant review when ready_with_flags.", () => {
  const rehearsal = service.buildParallelProductionRehearsalResult(buildInput("ready_with_flags"));
  assert.equal(rehearsal.requires_consultant_review, true);
  assert.ok(rehearsal.parallel_export_payload);
  assert.equal(rehearsal.parallel_export_payload.requires_consultant_review, true);
});

test("30. dependency-blocked default preserved.", () => {
  const blocked = service.isParallelProductionDependencyBlocked({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "false",
    EVE_GATES_READINESS_LOCAL_ENABLED: "false",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false",
    EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });
  assert.equal(blocked, true);
});

test("31. local feature flag required.", () => {
  const status = service.getParallelProductionLocalAdapterStatus({
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
    EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });
  assert.equal(status.dependency_blocked, true);
  assert.equal(status.blocked_reason, "parallel_production_local_flag_disabled");
});

function loadTypesModule() {
  const gatesTypesPath = join(
    __dirname,
    "../gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const consultantTypesPath = join(
    __dirname,
    "../consultant-result/runtime-40-20-consultant-result-types.ts",
  );
  const clientResultTypesPath = join(
    __dirname,
    "../client-result/runtime-40-20-client-result-types.ts",
  );
  const gatesTypes = loadFile(gatesTypesPath, {});
  const clientResultTypes = loadFile(clientResultTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });
  return loadModule("runtime-40-20-parallel-production-types.ts", {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "../consultant-result/runtime-40-20-consultant-result-types": loadFile(
      consultantTypesPath,
      {
        "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
        "../client-result/runtime-40-20-client-result-types": clientResultTypes,
      },
    ),
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
