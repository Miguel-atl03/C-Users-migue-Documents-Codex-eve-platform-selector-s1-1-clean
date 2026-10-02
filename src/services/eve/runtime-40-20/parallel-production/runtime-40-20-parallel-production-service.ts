import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import type {
  EVEEvidenceBundlePatch,
  EVEMMABPDesignSourceBundlePatch,
  EVEParallelExportPayloadLocal,
  EVEParallelProductionBoundaryFlags,
  EVEParallelProductionBuildInput,
  EVEParallelProductionDependencyBlockedResponse,
  EVEParallelProductionLocalAdapterStatus,
  EVEParallelProductionReadinessEligibility,
  EVEParallelProductionRehearsalResult,
  EVEParallelProductionScope,
  EVEParallelProductionScopeValidationResult,
  EVESceneCanonicalRecordPatch,
} from "./runtime-40-20-parallel-production-types";
import { EVE_PARALLEL_PRODUCTION_FORBIDDEN_FIELDS } from "./runtime-40-20-parallel-production-types";

const RUNTIME_LOCAL_FLAG = "EVE_RUNTIME_40_20_LOCAL_ENABLED";
const GATES_LOCAL_FLAG = "EVE_GATES_READINESS_LOCAL_ENABLED";
const CLIENT_SAFE_RESULT_FLAG = "EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED";
const CONSULTANT_PACKET_FLAG = "EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED";
const PARALLEL_PRODUCTION_FLAG = "EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED";

const PARALLEL_DEPENDENCY_BLOCKED_MESSAGE =
  "La preparación de producción paralela controlada no está disponible hasta que se habiliten las dependencias locales.";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/i.test(url);
}

export function normalizeParallelProductionScope(
  raw: Partial<EVEParallelProductionScope> | undefined,
): EVEParallelProductionScope {
  return {
    tenant_id: raw?.tenant_id?.trim() ?? "",
    case_id: raw?.case_id?.trim() ?? "",
    role_id: raw?.role_id?.trim() ?? "",
    activity_id: raw?.activity_id?.trim() ?? "",
    run_id: raw?.run_id?.trim() ?? "",
    consultant_user_id: raw?.consultant_user_id?.trim() ?? "",
    correlation_id: raw?.correlation_id?.trim() ?? "",
    idempotency_key: raw?.idempotency_key?.trim() ?? "",
  };
}

export function validateParallelProductionScope(
  raw: Partial<EVEParallelProductionScope> | undefined,
): EVEParallelProductionScopeValidationResult {
  const scope = normalizeParallelProductionScope(raw);
  const blocking_reasons: EVEParallelProductionScopeValidationResult["blocking_reasons"] =
    [];

  if (!isNonEmptyString(scope.tenant_id)) blocking_reasons.push("missing_tenant_id");
  if (!isNonEmptyString(scope.case_id)) blocking_reasons.push("missing_case_id");
  if (!isNonEmptyString(scope.role_id)) blocking_reasons.push("missing_role_id");
  if (!isNonEmptyString(scope.activity_id)) blocking_reasons.push("missing_activity_id");
  if (!isNonEmptyString(scope.run_id)) blocking_reasons.push("missing_run_id");
  if (!isNonEmptyString(scope.consultant_user_id)) {
    blocking_reasons.push("missing_consultant_user_id");
  }
  if (!isNonEmptyString(scope.correlation_id)) blocking_reasons.push("missing_correlation_id");
  if (!isNonEmptyString(scope.idempotency_key)) blocking_reasons.push("missing_idempotency_key");

  return { valid: blocking_reasons.length === 0, scope, blocking_reasons };
}

export function mapReadinessToExportEligibility(
  readinessState: EVEProductionReadinessState,
): EVEParallelProductionReadinessEligibility {
  switch (readinessState) {
    case "ready":
      return "export_preparation_allowed_local";
    case "ready_with_flags":
      return "export_preparation_allowed_with_flags_local";
    case "blocked":
      return "export_preparation_blocked";
    case "reentry_required":
      return "export_preparation_blocked_reentry_required";
    case "manual_review_required":
      return "export_preparation_blocked_manual_review_required";
    default:
      return "export_preparation_blocked";
  }
}

export function isExportPreparationAllowed(
  eligibility: EVEParallelProductionReadinessEligibility,
): boolean {
  return (
    eligibility === "export_preparation_allowed_local" ||
    eligibility === "export_preparation_allowed_with_flags_local"
  );
}

export function requiresConsultantReviewForEligibility(
  eligibility: EVEParallelProductionReadinessEligibility,
): boolean {
  return eligibility === "export_preparation_allowed_with_flags_local";
}

export function getParallelProductionLocalAdapterStatus(
  env: NodeJS.ProcessEnv = process.env,
): EVEParallelProductionLocalAdapterStatus {
  const runtimeEnabled = env[RUNTIME_LOCAL_FLAG] === "true";
  const gatesEnabled = env[GATES_LOCAL_FLAG] === "true";
  const clientSafeEnabled = env[CLIENT_SAFE_RESULT_FLAG] === "true";
  const consultantEnabled = env[CONSULTANT_PACKET_FLAG] === "true";
  const parallelEnabled = env[PARALLEL_PRODUCTION_FLAG] === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const localTargetAvailable =
    runtimeEnabled &&
    gatesEnabled &&
    clientSafeEnabled &&
    consultantEnabled &&
    parallelEnabled &&
    isLocalSupabaseUrl(supabaseUrl);

  let blocked_reason: string | null = null;
  if (!runtimeEnabled) blocked_reason = "runtime_local_flag_disabled";
  else if (!gatesEnabled) blocked_reason = "gates_readiness_local_flag_disabled";
  else if (!clientSafeEnabled) blocked_reason = "client_safe_result_local_flag_disabled";
  else if (!consultantEnabled) blocked_reason = "consultant_review_packet_local_flag_disabled";
  else if (!parallelEnabled) blocked_reason = "parallel_production_local_flag_disabled";
  else if (!isLocalSupabaseUrl(supabaseUrl)) blocked_reason = "supabase_url_not_local";

  return {
    enabled:
      runtimeEnabled &&
      gatesEnabled &&
      clientSafeEnabled &&
      consultantEnabled &&
      parallelEnabled,
    dependency_blocked: !localTargetAvailable,
    local_runtime_flag_required: true,
    local_gates_readiness_flag_required: true,
    local_client_safe_result_flag_required: true,
    local_consultant_review_packet_flag_required: true,
    local_parallel_production_flag_required: true,
    local_target_available: localTargetAvailable,
    blocked_reason: localTargetAvailable ? null : blocked_reason,
  };
}

export function isParallelProductionDependencyBlocked(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getParallelProductionLocalAdapterStatus(env).dependency_blocked;
}

export function buildParallelProductionDependencyBlockedResponse(
  scope: EVEParallelProductionScope,
): EVEParallelProductionDependencyBlockedResponse {
  return {
    status: "dependency_blocked",
    dependency_blocked: true,
    consultant_safe_message: PARALLEL_DEPENDENCY_BLOCKED_MESSAGE,
    correlation_id: scope.correlation_id,
    scope_ref: {
      tenant_id: scope.tenant_id,
      case_id: scope.case_id,
      run_id: scope.run_id,
    },
    prepared_only: true,
  };
}

export function buildSceneCanonicalRecordPatch(
  input: EVEParallelProductionBuildInput,
): EVESceneCanonicalRecordPatch {
  const { scope, consultant_packet, readiness_state } = input;
  return {
    packet_ref: consultant_packet.packet_ref,
    tenant_id: scope.tenant_id,
    case_id: scope.case_id,
    run_id: scope.run_id,
    activity_ref: scope.activity_id,
    source_evidence_refs: consultant_packet.evidence_items.map((e) => e.evidence_item_id),
    canonical_variable_refs: consultant_packet.canonical_variables.map(
      (v) => v.canonical_variable_record_id,
    ),
    readiness_state_snapshot: readiness_state,
    source_trace: {
      correlation_id: scope.correlation_id,
      idempotency_key: scope.idempotency_key,
      consultant_user_id: scope.consultant_user_id,
      readiness_decision_record_id:
        consultant_packet.readiness_decision.readiness_decision_record_id,
    },
    created_local: true,
  };
}

export function buildEvidenceBundlePatch(
  input: EVEParallelProductionBuildInput,
): EVEEvidenceBundlePatch {
  const { scope, consultant_packet } = input;
  return {
    evidence_bundle_ref: `evidence-bundle-${scope.run_id}-${scope.idempotency_key}`,
    evidence_items: consultant_packet.evidence_items.map((e) => ({
      evidence_item_id: e.evidence_item_id,
      evidence_type: e.evidence_type,
      source_ref: e.source_ref,
      summary_internal: e.summary_internal,
    })),
    answer_subfield_summaries: consultant_packet.answers_and_subfields.map((a) => ({
      subfield_response_id: a.subfield_response_id,
      question_ref: a.question_ref,
      subfield_ref: a.subfield_ref,
    })),
    canonical_variable_summaries: consultant_packet.canonical_variables.map((v) => ({
      canonical_variable_record_id: v.canonical_variable_record_id,
      variable_code: v.variable_code,
    })),
    readiness_gap_summaries: consultant_packet.readiness_gaps.map((g) => ({
      readiness_gap_record_id: g.readiness_gap_record_id,
      gap_code: g.gap_code,
      severity: g.severity,
    })),
    audit_refs: consultant_packet.audit_trail.map((a) => a.audit_trail_id),
    source_trace: {
      correlation_id: scope.correlation_id,
      packet_ref: consultant_packet.packet_ref,
    },
    created_local: true,
  };
}

export function buildMMABPDesignSourceBundlePatch(
  input: EVEParallelProductionBuildInput,
): EVEMMABPDesignSourceBundlePatch {
  const { scope, consultant_packet, readiness_state } = input;
  const semanticGates = consultant_packet.gate_summaries.filter(
    (g) => g.gate_kind === "semantic",
  );
  const timerGates = consultant_packet.gate_summaries.filter(
    (g) => g.gate_kind === "process_state_timer",
  );

  return {
    mdsb_patch_ref: `mdsb-patch-${scope.run_id}-${scope.idempotency_key}`,
    source_objects_candidate_refs: consultant_packet.evidence_items
      .filter((e) => e.evidence_type === "object" || e.evidence_type === "answer")
      .map((e) => e.evidence_item_id),
    process_state_candidate_refs: timerGates
      .map((g) => g.event_id)
      .filter((id): id is string => Boolean(id)),
    conformance_check_inputs: {
      critical_route_gates: consultant_packet.gate_summaries
        .filter((g) => g.gate_kind === "critical_route")
        .map((g) => ({ gate_code: g.gate_code, status: g.status })),
      semantic_gates_count: semanticGates.length,
    },
    consistency_check_inputs: {
      canonical_variables_count: consultant_packet.canonical_variables.length,
      readiness_gaps_count: consultant_packet.readiness_gaps.length,
      dominant_gate: consultant_packet.readiness_decision.dominant_gate,
    },
    gates_summary_refs: consultant_packet.gate_summaries
      .map((g) => g.event_id ?? g.gate_code)
      .filter(Boolean),
    readiness_summary: {
      readiness_state,
      dominant_gate: consultant_packet.readiness_decision.dominant_gate,
      manual_review_required: consultant_packet.readiness_decision.manual_review_required,
      reentry_required: consultant_packet.readiness_decision.reentry_required,
    },
    source_trace: {
      correlation_id: scope.correlation_id,
      readiness_decision_record_id:
        consultant_packet.readiness_decision.readiness_decision_record_id,
    },
    created_local: true,
  };
}

export function buildParallelExportPayloadLocal(
  input: EVEParallelProductionBuildInput,
  scr_patch: EVESceneCanonicalRecordPatch,
  evidence_bundle_patch: EVEEvidenceBundlePatch,
  mdsb_patch: EVEMMABPDesignSourceBundlePatch,
  eligibility: EVEParallelProductionReadinessEligibility,
): EVEParallelExportPayloadLocal {
  const { scope, readiness_state } = input;
  return {
    payload_ref: `parallel-export-${scope.run_id}-${scope.idempotency_key}`,
    tenant_id: scope.tenant_id,
    case_id: scope.case_id,
    run_id: scope.run_id,
    scr_patch,
    evidence_bundle_patch,
    mdsb_patch,
    readiness_state,
    requires_consultant_review: requiresConsultantReviewForEligibility(eligibility),
    production_export_allowed: false,
    external_export_executed: false,
    source_trace: {
      correlation_id: scope.correlation_id,
      idempotency_key: scope.idempotency_key,
      eligibility,
    },
  };
}

export function buildParallelProductionRehearsalResult(
  input: EVEParallelProductionBuildInput,
): EVEParallelProductionRehearsalResult {
  const { scope, readiness_state } = input;
  const eligibility = mapReadinessToExportEligibility(readiness_state);
  const exportAllowed = isExportPreparationAllowed(eligibility);

  const scr_patch = buildSceneCanonicalRecordPatch(input);
  const evidence_bundle_patch = buildEvidenceBundlePatch(input);
  const mdsb_patch = buildMMABPDesignSourceBundlePatch(input);

  const parallel_export_payload = exportAllowed
    ? buildParallelExportPayloadLocal(
        input,
        scr_patch,
        evidence_bundle_patch,
        mdsb_patch,
        eligibility,
      )
    : null;

  const blockedReasons: Record<EVEParallelProductionReadinessEligibility, string> = {
    export_preparation_allowed_local: "",
    export_preparation_allowed_with_flags_local: "",
    export_preparation_blocked: "Readiness blocked — export preparation not allowed.",
    export_preparation_blocked_reentry_required:
      "Reentry required — export preparation blocked until reentry completes.",
    export_preparation_blocked_manual_review_required:
      "Manual review required — export preparation blocked.",
  };

  return {
    rehearsal_ref: `rehearsal-${scope.run_id}-${scope.idempotency_key}`,
    eligibility,
    export_preparation_allowed: exportAllowed,
    scr_patch,
    evidence_bundle_patch,
    mdsb_patch,
    parallel_export_payload,
    rehearsal_blocked_result: exportAllowed
      ? null
      : {
          blocked: true,
          reason: blockedReasons[eligibility],
          readiness_state,
        },
    requires_consultant_review: requiresConsultantReviewForEligibility(eligibility),
    production_export_allowed: false,
    external_export_executed: false,
    produccion_paralela_started: false,
    activation_allowed: false,
    rehearsal_safe: true,
  };
}

export function validateParallelProductionNoForbiddenFields(payload: unknown): boolean {
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const field of EVE_PARALLEL_PRODUCTION_FORBIDDEN_FIELDS) {
    const keyPattern = new RegExp(`"${field}"\\s*:`, "i");
    if (keyPattern.test(serialized)) {
      return false;
    }
  }
  return true;
}

export function validateParallelProductionRehearsalStructure(
  result: EVEParallelProductionRehearsalResult,
): boolean {
  return (
    result.rehearsal_safe === true &&
    Boolean(result.scr_patch?.created_local) &&
    Boolean(result.evidence_bundle_patch?.created_local) &&
    Boolean(result.mdsb_patch?.created_local) &&
    result.production_export_allowed === false &&
    result.external_export_executed === false &&
    result.produccion_paralela_started === false &&
    result.activation_allowed === false &&
    validateParallelProductionNoForbiddenFields(result)
  );
}

export function buildP8ParallelProductionBoundaryFlags(): EVEParallelProductionBoundaryFlags {
  return {
    diagnosis_final_created: false,
    diagnostic_label_created: false,
    pathology_classification_created: false,
    ahe_vsm_diagnostic_output_created: false,
    mmabp_final_assessment_auto_created: false,
    registry_final_created: false,
    ir_final_created: false,
    diagram_export_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };
}

export function parseParallelProductionScopeFromBody(
  body: unknown,
): Partial<EVEParallelProductionScope> {
  if (!body || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  const nested =
    record.scope && typeof record.scope === "object"
      ? (record.scope as Record<string, unknown>)
      : record;

  return {
    tenant_id: typeof nested.tenant_id === "string" ? nested.tenant_id : undefined,
    case_id: typeof nested.case_id === "string" ? nested.case_id : undefined,
    role_id: typeof nested.role_id === "string" ? nested.role_id : undefined,
    activity_id: typeof nested.activity_id === "string" ? nested.activity_id : undefined,
    run_id: typeof nested.run_id === "string" ? nested.run_id : undefined,
    consultant_user_id:
      typeof nested.consultant_user_id === "string" ? nested.consultant_user_id : undefined,
    correlation_id:
      typeof nested.correlation_id === "string" ? nested.correlation_id : undefined,
    idempotency_key:
      typeof nested.idempotency_key === "string" ? nested.idempotency_key : undefined,
  };
}

export const Runtime40_20ParallelProductionService = {
  normalizeParallelProductionScope,
  validateParallelProductionScope,
  mapReadinessToExportEligibility,
  isExportPreparationAllowed,
  requiresConsultantReviewForEligibility,
  getParallelProductionLocalAdapterStatus,
  isParallelProductionDependencyBlocked,
  buildParallelProductionDependencyBlockedResponse,
  buildSceneCanonicalRecordPatch,
  buildEvidenceBundlePatch,
  buildMMABPDesignSourceBundlePatch,
  buildParallelExportPayloadLocal,
  buildParallelProductionRehearsalResult,
  validateParallelProductionNoForbiddenFields,
  validateParallelProductionRehearsalStructure,
  buildP8ParallelProductionBoundaryFlags,
  parseParallelProductionScopeFromBody,
};
