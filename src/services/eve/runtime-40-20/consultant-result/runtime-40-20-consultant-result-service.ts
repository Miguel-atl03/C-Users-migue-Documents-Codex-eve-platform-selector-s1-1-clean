import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import type {
  EVEConsultantActionSummary,
  EVEConsultantReviewPacketDependencyBlockedResponse,
  EVEConsultantReviewPacketDTO,
  EVEConsultantReviewPacketLocalAdapterStatus,
  EVEConsultantReviewPacketRequest,
  EVEConsultantReviewPacketScope,
  EVEConsultantReviewPacketScopeValidationResult,
  EVEConsultantReviewState,
} from "./runtime-40-20-consultant-result-types";
import { EVE_CONSULTANT_REVIEW_PACKET_FORBIDDEN_FIELDS } from "./runtime-40-20-consultant-result-types";
import type { EVEConsultantLocalSnapshot } from "./runtime-40-20-consultant-result-local-adapter";

const RUNTIME_LOCAL_FLAG = "EVE_RUNTIME_40_20_LOCAL_ENABLED";
const GATES_LOCAL_FLAG = "EVE_GATES_READINESS_LOCAL_ENABLED";
const CLIENT_SAFE_RESULT_FLAG = "EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED";
const CONSULTANT_PACKET_FLAG = "EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED";

const CONSULTANT_DEPENDENCY_BLOCKED_MESSAGE =
  "El paquete de revisión consultor no está disponible hasta que se habiliten las dependencias locales.";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/i.test(url);
}

export function normalizeConsultantReviewPacketScope(
  raw: Partial<EVEConsultantReviewPacketScope> | undefined,
): EVEConsultantReviewPacketScope {
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

export function validateConsultantReviewPacketScope(
  raw: Partial<EVEConsultantReviewPacketScope> | undefined,
): EVEConsultantReviewPacketScopeValidationResult {
  const scope = normalizeConsultantReviewPacketScope(raw);
  const blocking_reasons: EVEConsultantReviewPacketScopeValidationResult["blocking_reasons"] =
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

export function mapReadinessStateToConsultantReviewState(
  readinessState: EVEProductionReadinessState,
): EVEConsultantReviewState {
  switch (readinessState) {
    case "ready":
      return "ready_for_consultant_review";
    case "ready_with_flags":
      return "consultant_review_required_with_flags";
    case "blocked":
      return "blocked_requires_review";
    case "reentry_required":
      return "reentry_required_before_consultant_close";
    case "manual_review_required":
      return "manual_review_required";
    default:
      return "manual_review_required";
  }
}

export function getConsultantReviewPacketLocalAdapterStatus(
  env: NodeJS.ProcessEnv = process.env,
): EVEConsultantReviewPacketLocalAdapterStatus {
  const runtimeEnabled = env[RUNTIME_LOCAL_FLAG] === "true";
  const gatesEnabled = env[GATES_LOCAL_FLAG] === "true";
  const clientSafeEnabled = env[CLIENT_SAFE_RESULT_FLAG] === "true";
  const consultantEnabled = env[CONSULTANT_PACKET_FLAG] === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const localTargetAvailable =
    runtimeEnabled &&
    gatesEnabled &&
    clientSafeEnabled &&
    consultantEnabled &&
    isLocalSupabaseUrl(supabaseUrl);

  let blocked_reason: string | null = null;
  if (!runtimeEnabled) blocked_reason = "runtime_local_flag_disabled";
  else if (!gatesEnabled) blocked_reason = "gates_readiness_local_flag_disabled";
  else if (!clientSafeEnabled) blocked_reason = "client_safe_result_local_flag_disabled";
  else if (!consultantEnabled) blocked_reason = "consultant_review_packet_local_flag_disabled";
  else if (!isLocalSupabaseUrl(supabaseUrl)) blocked_reason = "supabase_url_not_local";

  return {
    enabled: runtimeEnabled && gatesEnabled && clientSafeEnabled && consultantEnabled,
    dependency_blocked: !localTargetAvailable,
    local_runtime_flag_required: true,
    local_gates_readiness_flag_required: true,
    local_client_safe_result_flag_required: true,
    local_consultant_review_packet_flag_required: true,
    local_target_available: localTargetAvailable,
    blocked_reason: localTargetAvailable ? null : blocked_reason,
  };
}

export function isConsultantReviewPacketDependencyBlocked(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getConsultantReviewPacketLocalAdapterStatus(env).dependency_blocked;
}

export function buildConsultantReviewPacketDependencyBlockedResponse(
  scope: EVEConsultantReviewPacketScope,
): EVEConsultantReviewPacketDependencyBlockedResponse {
  return {
    status: "dependency_blocked",
    dependency_blocked: true,
    consultant_safe_message: CONSULTANT_DEPENDENCY_BLOCKED_MESSAGE,
    correlation_id: scope.correlation_id,
    scope_ref: {
      tenant_id: scope.tenant_id,
      case_id: scope.case_id,
      run_id: scope.run_id,
    },
    prepared_only: true,
  };
}

function buildConsultantActions(
  consultantReviewState: EVEConsultantReviewState,
): EVEConsultantActionSummary[] {
  const reviewEnabled =
    consultantReviewState !== "blocked_requires_review" &&
    consultantReviewState !== "reentry_required_before_consultant_close";

  return [
    {
      action_kind: "review_packet_assembled",
      label: "Paquete de revisión ensamblado",
      enabled: true,
    },
    {
      action_kind: "await_consultant_close",
      label: "Esperar cierre consultor",
      enabled: reviewEnabled,
    },
  ];
}

export function buildConsultantReviewPacketDTO(
  request: EVEConsultantReviewPacketRequest,
  snapshot: EVEConsultantLocalSnapshot,
): EVEConsultantReviewPacketDTO {
  const { scope } = request;
  const readinessState = snapshot.readiness_decision.readiness_state;
  const consultantReviewState = mapReadinessStateToConsultantReviewState(readinessState);

  return {
    packet_ref: `consultant-packet-${scope.run_id}-${scope.idempotency_key}`,
    session_summary: snapshot.session_summary,
    activity_summary: snapshot.activity_summary,
    answers_and_subfields: snapshot.answers_and_subfields,
    evidence_items: snapshot.evidence_items,
    canonical_variables: snapshot.canonical_variables,
    readiness_gaps: snapshot.readiness_gaps,
    gate_summaries: snapshot.gate_summaries,
    readiness_decision: {
      ...snapshot.readiness_decision,
      consultant_review_state: consultantReviewState,
    },
    manual_review: {
      manual_review_required: snapshot.readiness_decision.manual_review_required,
      ready_with_flags: readinessState === "ready_with_flags",
    },
    reentry: {
      reentry_required: snapshot.readiness_decision.reentry_required,
      reentry_target: snapshot.reentry_target,
    },
    client_safe_result: snapshot.client_safe_result ?? {},
    audit_trail: snapshot.audit_trail,
    consultant_actions: buildConsultantActions(consultantReviewState),
    packet_safe: true,
  };
}

export function validateConsultantReviewPacketNoForbiddenFields(
  payload: unknown,
): boolean {
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const field of EVE_CONSULTANT_REVIEW_PACKET_FORBIDDEN_FIELDS) {
    if (serialized.includes(`"${field.toLowerCase()}"`)) {
      return false;
    }
    if (serialized.includes(field.toLowerCase())) {
      const keyPattern = new RegExp(`"${field.replace(/_/g, "_")}"\\s*:`, "i");
      if (keyPattern.test(JSON.stringify(payload))) {
        return false;
      }
    }
  }
  return true;
}

export function validateConsultantReviewPacketStructure(
  packet: EVEConsultantReviewPacketDTO,
): boolean {
  return (
    packet.packet_safe === true &&
    Boolean(packet.session_summary?.tenant_id) &&
    Boolean(packet.activity_summary?.run_id) &&
    Array.isArray(packet.answers_and_subfields) &&
    Array.isArray(packet.evidence_items) &&
    Array.isArray(packet.canonical_variables) &&
    Array.isArray(packet.readiness_gaps) &&
    Array.isArray(packet.gate_summaries) &&
    Boolean(packet.readiness_decision?.readiness_decision_record_id) &&
    Array.isArray(packet.audit_trail) &&
    validateConsultantReviewPacketNoForbiddenFields(packet)
  );
}

export function buildP7ConsultantReviewPacketBoundaryFlags() {
  return {
    diagnosis_final_auto_created: false as const,
    diagnostic_label_created: false as const,
    pathology_classification_created: false as const,
    ahe_vsm_diagnostic_output_created: false as const,
    mmabp_final_assessment_auto_created: false as const,
    registry_final_created: false as const,
    ir_final_created: false as const,
    export_real_created: false as const,
    produccion_paralela_started: false as const,
    qa_green_real_created: false as const,
    activation_allowed: false as const,
    production_supabase_touched: false as const,
  };
}

export function parseConsultantScopeFromBody(body: unknown): Partial<EVEConsultantReviewPacketScope> {
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

export const Runtime40_20ConsultantResultService = {
  normalizeConsultantReviewPacketScope,
  validateConsultantReviewPacketScope,
  mapReadinessStateToConsultantReviewState,
  getConsultantReviewPacketLocalAdapterStatus,
  isConsultantReviewPacketDependencyBlocked,
  buildConsultantReviewPacketDependencyBlockedResponse,
  buildConsultantReviewPacketDTO,
  validateConsultantReviewPacketNoForbiddenFields,
  validateConsultantReviewPacketStructure,
  buildP7ConsultantReviewPacketBoundaryFlags,
  parseConsultantScopeFromBody,
};
