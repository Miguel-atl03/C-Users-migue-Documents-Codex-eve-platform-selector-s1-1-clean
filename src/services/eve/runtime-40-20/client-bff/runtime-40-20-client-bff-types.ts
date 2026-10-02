export type EVEClientBFFVisibleStatus =
  | "sesion_lista"
  | "mapa_de_trabajo_listo"
  | "actividad_seleccionada"
  | "pregunta"
  | "respuesta_registrada"
  | "informacion_en_revision"
  | "necesitamos_aclarar_algo"
  | "puedes_corregir"
  | "resultado_en_revision"
  | "bloqueado_seguro"
  | "servicio_en_preparacion";

export interface EVEClientBFFScope {
  tenant_id: string;
  case_id: string;
  role_id?: string;
  activity_id?: string;
  run_id?: string;
  client_session_id?: string;
  correlation_id: string;
  idempotency_key?: string;
}

export type EVEClientBFFScopeValidationMode =
  | "state"
  | "session"
  | "interaction"
  | "answer"
  | "review";

export type EVEClientBFFScopeBlockingReason =
  | "missing_tenant_id"
  | "missing_case_id"
  | "missing_correlation_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "missing_idempotency_key";

export interface EVEClientBFFScopeValidationResult {
  valid: boolean;
  scope?: EVEClientBFFScope;
  blocking_reasons: EVEClientBFFScopeBlockingReason[];
}

export interface EVEClientBFFStateRequest {
  scope: EVEClientBFFScope;
}

export interface EVEClientBFFSessionRequest {
  scope: EVEClientBFFScope;
}

export interface EVEClientBFFInteractionRequest {
  scope: EVEClientBFFScope;
}

export interface EVEClientBFFAnswerRequest {
  scope: EVEClientBFFScope;
  answer_payload?: Record<string, unknown>;
}

export interface EVEClientBFFReviewRequest {
  scope: EVEClientBFFScope;
}

export interface EVEClientBFFSafeResponse {
  status: EVEClientBFFVisibleStatus;
  client_safe_message: string;
  correlation_id: string;
  scope_ref: {
    tenant_id: string;
    case_id: string;
    role_id?: string;
    activity_id?: string;
    run_id?: string;
    client_session_id?: string;
  };
  visible_next_action?: string;
  prepared_only: true;
  bff_boundary: "client_safe_dto";
}

export interface EVEClientBFFSafeErrorResponse {
  error: "invalid_scope" | "invalid_request" | "method_not_allowed";
  client_safe_message: string;
  correlation_id?: string;
  blocking_reasons: EVEClientBFFScopeBlockingReason[];
}

export interface EVEClientBFFDependencyBlockedResponse {
  status: "servicio_en_preparacion";
  dependency_blocked: true;
  runtime_real_enabled: false;
  client_safe_message: string;
  correlation_id: string;
  scope_ref: {
    tenant_id: string;
    case_id: string;
    role_id?: string;
    activity_id?: string;
    run_id?: string;
  };
  prepared_only: true;
}

export interface EVEClientBFFNoGoResponse {
  status: "bloqueado_seguro";
  no_go_safe: true;
  client_safe_message: string;
  correlation_id: string;
  prepared_only: true;
}

export interface EVEClientBFFRuntimeLocalStatus {
  runtime_real_enabled: boolean;
  dependency_blocked: boolean;
  local_runtime_flag_required: true;
  local_gates_readiness_flag_required: true;
  local_client_safe_result_flag_required: true;
  local_target_available: boolean;
  client_safe_result_local_available: boolean;
  blocked_reason: string | null;
}

export type EVEClientBFFSafeNextActionKind =
  | "esperar_revision"
  | "corregir_respuesta"
  | "aclarar_informacion"
  | "continuar_interaccion"
  | "contactar_revision"
  | "sin_accion_segura";

export interface EVEClientBFFSafeNextAction {
  kind: EVEClientBFFSafeNextActionKind;
  label: string;
  enabled: boolean;
}

export interface EVEClientBFFSafeReviewResultDTO {
  visible_state: EVEClientBFFVisibleStatus;
  visible_title: string;
  visible_message: string;
  visible_next_action: EVEClientBFFSafeNextAction;
  review_pending: boolean;
  can_correct: boolean;
  can_reenter: boolean;
  client_safe: true;
}

export type EVEClientBFFRouteKind =
  | "state"
  | "session"
  | "interaction"
  | "answer"
  | "review";

export interface EVEClientBFFRouteInventoryEntry {
  route_kind: EVEClientBFFRouteKind;
  route_path: string;
  allowed_methods: string[];
  scope_mode: EVEClientBFFScopeValidationMode;
  requires_idempotency_key: boolean;
  created: true;
}

export interface EVEClientBFFAuditEnvelopeCandidate {
  audit_envelope_candidate_ref: string;
  audit_action: "bff_scope_validated" | "bff_dependency_blocked" | "bff_safe_response_built";
  correlation_id: string;
  route_kind: EVEClientBFFRouteKind;
  scope_tenant_id: string;
  scope_case_id: string;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  gates_real_executed: false;
  internal_fields_exposed: false;
  audit_trail_real_persisted: false;
}

export interface EVEP2BFFRealDesignSecurityContractResult {
  p2_bff_real_created: true;
  bff_security_contract_created: true;
  bff_safe_dto_contract_created: true;
  bff_routes_created: true;
  dependency_blocked_behavior_implemented: true;

  supabase_ready: false;
  runtime_real_ready: false;
  gates_real_ready: false;
  supabase_touched: false;
  sql_executed: false;
  runtime_real_started: false;
  gates_real_executed: false;

  endpoint_created: true;
  api_route_created: true;
  qa_green_real_created: false;
  activation_allowed: false;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  registry_created: false;
  ir_created: false;
  real_client_access_enabled: false;

  route_inventory: EVEClientBFFRouteInventoryEntry[];
  audit_envelope_candidates: EVEClientBFFAuditEnvelopeCandidate[];

  ready_for_p3_supabase_rls_schema_design: boolean;
}

export const EVE_CLIENT_BFF_FORBIDDEN_RESPONSE_TERMS = [
  "MMABP",
  "VSM",
  "AHE",
  "Gate",
  "Chip",
  "Runtime table",
  "Object Inventory",
  "Integration Membrane",
  "Soft Governance",
  "No-Go interno",
  "canonical_variable_record",
  "runtime_interaction_instance",
  "readiness_gap_record",
  "readiness_decision_record",
  "registry",
  "IR",
  "export payload",
  "diagnóstico final",
  "patología",
  "service_role",
  "supabase_url",
  "sql",
  "internal_gate_state",
  "internal_chip_state",
  "internal_runtime_state",
] as const;

export const EVE_CLIENT_BFF_ROUTE_INVENTORY: EVEClientBFFRouteInventoryEntry[] = [
  {
    route_kind: "state",
    route_path: "/api/eve/runtime-40-20/client-bff/state",
    allowed_methods: ["GET"],
    scope_mode: "state",
    requires_idempotency_key: false,
    created: true,
  },
  {
    route_kind: "session",
    route_path: "/api/eve/runtime-40-20/client-bff/session",
    allowed_methods: ["GET"],
    scope_mode: "session",
    requires_idempotency_key: false,
    created: true,
  },
  {
    route_kind: "interaction",
    route_path: "/api/eve/runtime-40-20/client-bff/interaction",
    allowed_methods: ["GET"],
    scope_mode: "interaction",
    requires_idempotency_key: false,
    created: true,
  },
  {
    route_kind: "answer",
    route_path: "/api/eve/runtime-40-20/client-bff/answer",
    allowed_methods: ["POST"],
    scope_mode: "answer",
    requires_idempotency_key: true,
    created: true,
  },
  {
    route_kind: "review",
    route_path: "/api/eve/runtime-40-20/client-bff/review",
    allowed_methods: ["GET"],
    scope_mode: "review",
    requires_idempotency_key: false,
    created: true,
  },
];

export const EVE_CLIENT_BFF_DEPENDENCY_BLOCKED_MESSAGE =
  "Estamos preparando el servicio para continuar de forma segura.";
