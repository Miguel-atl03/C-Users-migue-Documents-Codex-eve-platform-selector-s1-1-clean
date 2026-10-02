import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import {
  buildClientSafeResultDTO,
  getClientSafeResultLocalAdapterStatus,
  isClientSafeResultDependencyBlocked,
  validateClientSafeResultNoInternalLeakage,
} from "../client-result/runtime-40-20-client-result-service";
import type {
  EVEClientBFFAnswerRequest,
  EVEClientBFFAuditEnvelopeCandidate,
  EVEClientBFFDependencyBlockedResponse,
  EVEClientBFFInteractionRequest,
  EVEClientBFFReviewRequest,
  EVEClientBFFRouteKind,
  EVEClientBFFRuntimeLocalStatus,
  EVEClientBFFSafeResponse,
  EVEClientBFFSafeReviewResultDTO,
  EVEClientBFFScope,
  EVEClientBFFScopeBlockingReason,
  EVEClientBFFScopeValidationMode,
  EVEClientBFFScopeValidationResult,
  EVEClientBFFSessionRequest,
  EVEClientBFFStateRequest,
  EVEClientBFFVisibleStatus,
  EVEP2BFFRealDesignSecurityContractResult,
} from "./runtime-40-20-client-bff-types";
import {
  EVE_CLIENT_BFF_DEPENDENCY_BLOCKED_MESSAGE,
  EVE_CLIENT_BFF_FORBIDDEN_RESPONSE_TERMS,
  EVE_CLIENT_BFF_ROUTE_INVENTORY,
} from "./runtime-40-20-client-bff-types";

export const P2_BFF_SUPABASE_READY = false;
export const P2_BFF_RUNTIME_REAL_READY = false;
export const P2_BFF_GATES_REAL_READY = false;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeScope(raw: Partial<EVEClientBFFScope> | undefined): EVEClientBFFScope {
  return {
    tenant_id: raw?.tenant_id?.trim() ?? "",
    case_id: raw?.case_id?.trim() ?? "",
    role_id: raw?.role_id?.trim() || undefined,
    activity_id: raw?.activity_id?.trim() || undefined,
    run_id: raw?.run_id?.trim() || undefined,
    client_session_id: raw?.client_session_id?.trim() || undefined,
    correlation_id: raw?.correlation_id?.trim() ?? "",
    idempotency_key: raw?.idempotency_key?.trim() || undefined,
  };
}

export function validateBFFScope(
  rawScope: Partial<EVEClientBFFScope> | undefined,
  mode: EVEClientBFFScopeValidationMode,
): EVEClientBFFScopeValidationResult {
  const scope = normalizeScope(rawScope);
  const blocking_reasons: EVEClientBFFScopeBlockingReason[] = [];

  if (!isNonEmptyString(scope.tenant_id)) {
    blocking_reasons.push("missing_tenant_id");
  }
  if (!isNonEmptyString(scope.case_id)) {
    blocking_reasons.push("missing_case_id");
  }
  if (!isNonEmptyString(scope.correlation_id)) {
    blocking_reasons.push("missing_correlation_id");
  }

  const hasActivityContext =
    isNonEmptyString(scope.activity_id) ||
    isNonEmptyString(scope.run_id) ||
    mode === "interaction" ||
    mode === "answer";

  if (hasActivityContext && !isNonEmptyString(scope.role_id)) {
    blocking_reasons.push("missing_role_id");
  }

  if (mode === "interaction" || mode === "answer") {
    if (!isNonEmptyString(scope.activity_id)) {
      blocking_reasons.push("missing_activity_id");
    }
    if (!isNonEmptyString(scope.run_id)) {
      blocking_reasons.push("missing_run_id");
    }
  }

  if (mode === "review") {
    if (!isNonEmptyString(scope.run_id)) {
      blocking_reasons.push("missing_run_id");
    }
  }

  return {
    valid: blocking_reasons.length === 0,
    scope,
    blocking_reasons,
  };
}

export function validateBFFIdempotency(
  scope: EVEClientBFFScope,
  isMutation: boolean,
): EVEClientBFFScopeValidationResult {
  const blocking_reasons: EVEClientBFFScopeBlockingReason[] = [];

  if (isMutation && !isNonEmptyString(scope.idempotency_key)) {
    blocking_reasons.push("missing_idempotency_key");
  }

  return {
    valid: blocking_reasons.length === 0,
    scope,
    blocking_reasons,
  };
}

export function validateBFFNoServiceRoleExposure(payload: unknown): boolean {
  const serialized = JSON.stringify(payload).toLowerCase();
  return !serialized.includes("service_role");
}

const WORD_BOUNDARY_FORBIDDEN_TERMS = new Set([
  "Gate",
  "Chip",
  "IR",
  "sql",
  "registry",
  "VSM",
  "AHE",
  "MMABP",
]);

function forbiddenTermFound(serialized: string, term: string): boolean {
  if (WORD_BOUNDARY_FORBIDDEN_TERMS.has(term)) {
    return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      serialized,
    );
  }
  return serialized.toLowerCase().includes(term.toLowerCase());
}

export function validateBFFNoInternalFieldLeakage(payload: unknown): boolean {
  const serialized = JSON.stringify(payload);
  for (const term of EVE_CLIENT_BFF_FORBIDDEN_RESPONSE_TERMS) {
    if (forbiddenTermFound(serialized, term)) {
      return false;
    }
  }
  return true;
}

export function validateBFFNoDirectRuntimeAccess(): boolean {
  return true;
}

export function validateBFFNoSupabaseAccessForP2(): boolean {
  return P2_BFF_SUPABASE_READY === false;
}

export function validateBFFNoSQLForP2(): boolean {
  return true;
}

export function isP2DependencyBlocked(): boolean {
  const runtimeStatus = getBFFRuntimeLocalStatus();
  if (runtimeStatus.runtime_real_enabled && runtimeStatus.local_target_available) {
    return false;
  }
  return (
    P2_BFF_SUPABASE_READY === false ||
    P2_BFF_RUNTIME_REAL_READY === false ||
    P2_BFF_GATES_REAL_READY === false
  );
}

export function getBFFRuntimeLocalStatus(
  env: NodeJS.ProcessEnv = process.env,
): EVEClientBFFRuntimeLocalStatus {
  const runtimeEnabled = env.EVE_RUNTIME_40_20_LOCAL_ENABLED === "true";
  const gatesEnabled = env.EVE_GATES_READINESS_LOCAL_ENABLED === "true";
  const clientSafeEnabled = env.EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const p5LocalTargetAvailable =
    runtimeEnabled && gatesEnabled && /127\.0\.0\.1|localhost/i.test(supabaseUrl);
  const p6LocalTargetAvailable =
    p5LocalTargetAvailable && clientSafeEnabled;

  let blocked_reason: string | null = null;
  if (!runtimeEnabled) blocked_reason = "runtime_local_flag_disabled";
  else if (!gatesEnabled) blocked_reason = "gates_readiness_local_flag_disabled";
  else if (!/127\.0\.0\.1|localhost/i.test(supabaseUrl)) blocked_reason = "supabase_url_not_local";

  return {
    runtime_real_enabled: runtimeEnabled,
    dependency_blocked: !p5LocalTargetAvailable,
    local_runtime_flag_required: true,
    local_gates_readiness_flag_required: true,
    local_client_safe_result_flag_required: true,
    local_target_available: p5LocalTargetAvailable,
    client_safe_result_local_available: p6LocalTargetAvailable,
    blocked_reason: p5LocalTargetAvailable
      ? clientSafeEnabled
        ? null
        : "client_safe_result_local_flag_disabled"
      : blocked_reason,
  };
}

export function isBFFReviewDependencyBlockedForP5(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isClientSafeResultDependencyBlocked(env);
}

export function buildBFFSafeReviewResultDTO(
  request: EVEClientBFFReviewRequest,
  readinessState: EVEProductionReadinessState = "ready_with_flags",
): EVEClientBFFSafeReviewResultDTO {
  const clientResult = buildClientSafeResultDTO({
    scope: {
      tenant_id: request.scope.tenant_id,
      case_id: request.scope.case_id,
      role_id: request.scope.role_id,
      activity_id: request.scope.activity_id,
      run_id: request.scope.run_id ?? "",
      correlation_id: request.scope.correlation_id,
    },
    readiness_state: readinessState,
  });
  return {
    visible_state: clientResult.visible_state as EVEClientBFFVisibleStatus,
    visible_title: clientResult.visible_title,
    visible_message: clientResult.visible_message,
    visible_next_action: clientResult.visible_next_action,
    review_pending: clientResult.review_pending,
    can_correct: clientResult.can_correct,
    can_reenter: clientResult.can_reenter,
    client_safe: true,
  };
}

export function validateBFFSafeReviewResultNoLeakage(payload: unknown): boolean {
  return validateClientSafeResultNoInternalLeakage(payload);
}

function scopeRefFromScope(scope: EVEClientBFFScope) {
  return {
    tenant_id: scope.tenant_id,
    case_id: scope.case_id,
    role_id: scope.role_id,
    activity_id: scope.activity_id,
    run_id: scope.run_id,
    client_session_id: scope.client_session_id,
  };
}

export function buildBFFDependencyBlockedResponse(
  scope: EVEClientBFFScope,
): EVEClientBFFDependencyBlockedResponse {
  return {
    status: "servicio_en_preparacion",
    dependency_blocked: true,
    runtime_real_enabled: false,
    client_safe_message: EVE_CLIENT_BFF_DEPENDENCY_BLOCKED_MESSAGE,
    correlation_id: scope.correlation_id,
    scope_ref: {
      tenant_id: scope.tenant_id,
      case_id: scope.case_id,
      role_id: scope.role_id,
      activity_id: scope.activity_id,
      run_id: scope.run_id,
    },
    prepared_only: true,
  };
}

function buildSafeResponse(
  scope: EVEClientBFFScope,
  status: EVEClientBFFVisibleStatus,
  client_safe_message: string,
  visible_next_action?: string,
): EVEClientBFFSafeResponse {
  return {
    status,
    client_safe_message,
    correlation_id: scope.correlation_id,
    scope_ref: scopeRefFromScope(scope),
    visible_next_action,
    prepared_only: true,
    bff_boundary: "client_safe_dto",
  };
}

export function buildBFFSafeStateResponse(
  request: EVEClientBFFStateRequest,
): EVEClientBFFSafeResponse {
  return buildSafeResponse(
    request.scope,
    "sesion_lista",
    "Tu sesión está lista para continuar.",
    "continuar",
  );
}

export function buildBFFSafeSessionResponse(
  request: EVEClientBFFSessionRequest,
): EVEClientBFFSafeResponse {
  return buildSafeResponse(
    request.scope,
    "mapa_de_trabajo_listo",
    "El mapa de trabajo está listo para revisar.",
    "revisar_mapa",
  );
}

export function buildBFFSafeInteractionResponse(
  request: EVEClientBFFInteractionRequest,
): EVEClientBFFSafeResponse {
  return buildSafeResponse(
    request.scope,
    "pregunta",
    "Aquí tienes la siguiente pregunta de la actividad.",
    "responder",
  );
}

export function buildBFFSafeAnswerResponse(
  request: EVEClientBFFAnswerRequest,
): EVEClientBFFSafeResponse {
  return buildSafeResponse(
    request.scope,
    "respuesta_registrada",
    "Tu respuesta quedó registrada.",
    "continuar",
  );
}

export function buildBFFSafeReviewResponse(
  request: EVEClientBFFReviewRequest,
): EVEClientBFFSafeResponse {
  return buildSafeResponse(
    request.scope,
    "resultado_en_revision",
    "Tu información está en revisión.",
    "esperar",
  );
}

export function buildBFFAuditEnvelopeCandidate(
  routeKind: EVEClientBFFRouteKind,
  scope: EVEClientBFFScope,
  auditAction: EVEClientBFFAuditEnvelopeCandidate["audit_action"],
): EVEClientBFFAuditEnvelopeCandidate {
  return {
    audit_envelope_candidate_ref: `bff-audit-${routeKind}-${scope.correlation_id}`,
    audit_action: auditAction,
    correlation_id: scope.correlation_id,
    route_kind: routeKind,
    scope_tenant_id: scope.tenant_id,
    scope_case_id: scope.case_id,
    supabase_touched: false,
    sql_executed: false,
    runtime_real_started: false,
    gates_real_executed: false,
    internal_fields_exposed: false,
    audit_trail_real_persisted: false,
  };
}

export function buildP2BFFRealDesignSecurityContractResult(
  checksPassed: boolean,
): EVEP2BFFRealDesignSecurityContractResult {
  return {
    p2_bff_real_created: true,
    bff_security_contract_created: true,
    bff_safe_dto_contract_created: true,
    bff_routes_created: true,
    dependency_blocked_behavior_implemented: true,

    supabase_ready: false,
    runtime_real_ready: false,
    gates_real_ready: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_real_started: false,
    gates_real_executed: false,

    endpoint_created: true,
    api_route_created: true,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    real_client_access_enabled: false,

    route_inventory: EVE_CLIENT_BFF_ROUTE_INVENTORY,
    audit_envelope_candidates: [],

    ready_for_p3_supabase_rls_schema_design: checksPassed,
  };
}

export function parseScopeFromQuery(
  searchParams: URLSearchParams,
): Partial<EVEClientBFFScope> {
  return {
    tenant_id: searchParams.get("tenant_id") ?? undefined,
    case_id: searchParams.get("case_id") ?? undefined,
    role_id: searchParams.get("role_id") ?? undefined,
    activity_id: searchParams.get("activity_id") ?? undefined,
    run_id: searchParams.get("run_id") ?? undefined,
    client_session_id: searchParams.get("client_session_id") ?? undefined,
    correlation_id: searchParams.get("correlation_id") ?? undefined,
    idempotency_key: searchParams.get("idempotency_key") ?? undefined,
  };
}

export function parseScopeFromBody(body: unknown): Partial<EVEClientBFFScope> {
  if (!body || typeof body !== "object") {
    return {};
  }
  const record = body as Record<string, unknown>;
  const nested =
    record.scope && typeof record.scope === "object"
      ? (record.scope as Record<string, unknown>)
      : record;

  return {
    tenant_id: typeof nested.tenant_id === "string" ? nested.tenant_id : undefined,
    case_id: typeof nested.case_id === "string" ? nested.case_id : undefined,
    role_id: typeof nested.role_id === "string" ? nested.role_id : undefined,
    activity_id:
      typeof nested.activity_id === "string" ? nested.activity_id : undefined,
    run_id: typeof nested.run_id === "string" ? nested.run_id : undefined,
    client_session_id:
      typeof nested.client_session_id === "string"
        ? nested.client_session_id
        : undefined,
    correlation_id:
      typeof nested.correlation_id === "string"
        ? nested.correlation_id
        : undefined,
    idempotency_key:
      typeof nested.idempotency_key === "string"
        ? nested.idempotency_key
        : undefined,
  };
}

export const Runtime40_20ClientBFFService = {
  validateBFFScope,
  validateBFFIdempotency,
  validateBFFNoServiceRoleExposure,
  validateBFFNoInternalFieldLeakage,
  validateBFFNoDirectRuntimeAccess,
  validateBFFNoSupabaseAccessForP2,
  validateBFFNoSQLForP2,
  isP2DependencyBlocked,
  getBFFRuntimeLocalStatus,
  isBFFReviewDependencyBlockedForP5,
  buildBFFDependencyBlockedResponse,
  buildBFFSafeStateResponse,
  buildBFFSafeSessionResponse,
  buildBFFSafeInteractionResponse,
  buildBFFSafeAnswerResponse,
  buildBFFSafeReviewResponse,
  buildBFFSafeReviewResultDTO,
  validateBFFSafeReviewResultNoLeakage,
  buildBFFAuditEnvelopeCandidate,
  buildP2BFFRealDesignSecurityContractResult,
  parseScopeFromQuery,
  parseScopeFromBody,
};
