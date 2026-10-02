import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";

export type EVEClientSafeResultScope = {
  tenant_id: string;
  case_id: string;
  role_id?: string;
  activity_id?: string;
  run_id: string;
  correlation_id: string;
};

export type EVEClientSafeVisibleState =
  | "sesion_lista"
  | "mapa_de_trabajo_listo"
  | "actividad_seleccionada"
  | "pregunta"
  | "respuesta_registrada"
  | "informacion_en_revision"
  | "necesitamos_aclarar_algo"
  | "puedes_corregir"
  | "resultado_en_revision"
  | "bloqueado_seguro";

export type EVEClientSafeNextActionKind =
  | "esperar_revision"
  | "corregir_respuesta"
  | "aclarar_informacion"
  | "continuar_interaccion"
  | "contactar_revision"
  | "sin_accion_segura";

export interface EVEClientSafeNextAction {
  kind: EVEClientSafeNextActionKind;
  label: string;
  enabled: boolean;
}

export interface EVEClientSafeResultRequest {
  scope: EVEClientSafeResultScope;
  readiness_state?: EVEProductionReadinessState;
  has_open_gaps?: boolean;
  manual_review_required?: boolean;
  reentry_required?: boolean;
}

export interface EVEClientSafeResultDTO {
  visible_state: EVEClientSafeVisibleState;
  visible_title: string;
  visible_message: string;
  visible_next_action: EVEClientSafeNextAction;
  review_pending: boolean;
  can_correct: boolean;
  can_reenter: boolean;
  client_safe: true;
}

export interface EVEClientSafeCorrectionReentryDTO {
  visible_state: "puedes_corregir" | "necesitamos_aclarar_algo";
  visible_title: string;
  visible_message: string;
  visible_next_action: EVEClientSafeNextAction;
  can_correct: boolean;
  can_reenter: boolean;
  client_safe: true;
}

export interface EVEClientSafeResultLocalAdapterStatus {
  enabled: boolean;
  dependency_blocked: boolean;
  local_runtime_flag_required: true;
  local_gates_readiness_flag_required: true;
  local_client_safe_result_flag_required: true;
  local_target_available: boolean;
  blocked_reason: string | null;
}

export interface EVEClientSafeResultSmokeResult {
  dictamen: "EVE_PRODUCTION_ACTIVATION_P6_CLIENT_SAFE_RESULT_LOCAL_V1";
  generated_at: string;
  scope: EVEClientSafeResultScope;
  readiness_state_mapped: EVEClientSafeVisibleState;
  client_safe_result_dto_valid: boolean;
  bff_review_safe_under_flags: boolean;
  bff_dependency_blocked_without_flags: boolean;
  client_visible_result_safe: boolean;
  client_final_diagnosis_visible: false;
  no_internal_leakage: boolean;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
  production_supabase_touched: false;
}

export const EVE_CLIENT_SAFE_RESULT_FORBIDDEN_EXPOSURE_TERMS = [
  "readiness_state",
  "readiness_decision_record",
  "readiness_gap_record",
  "Gate",
  "Chip",
  "SEM-",
  "PST-",
  "B0",
  "B2",
  "B3",
  "B7",
  "MMABP",
  "VSM",
  "AHE",
  "diagnóstico",
  "patología",
  "export payload",
  "registry",
  "dominant_gate",
  "runtime_audit_trail",
  "canonical_variable_record",
  "runtime_interaction_instance",
] as const;
