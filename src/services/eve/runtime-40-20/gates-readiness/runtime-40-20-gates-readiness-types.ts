export interface EVEProductionGateReadinessScope {
  tenant_id: string;
  case_id: string;
  role_id: string;
  activity_id: string;
  run_id: string;
  correlation_id: string;
  idempotency_key: string;
}

export type EVEProductionCriticalRouteGateCode = "B0" | "B2" | "B3_C09" | "B7_C20";
export type EVEProductionSemanticGateCode =
  | "SEM-001"
  | "SEM-002"
  | "SEM-003"
  | "SEM-004"
  | "SEM-005"
  | "SEM-006"
  | "SEM-007";
export type EVEProductionProcessStateTimerGateCode =
  | "PST-001"
  | "PST-002"
  | "PST-003"
  | "PST-004"
  | "PST-005"
  | "PST-006";

export interface EVEProductionCriticalRouteGateRequest {
  scope: EVEProductionGateReadinessScope;
  gate_code: EVEProductionCriticalRouteGateCode;
  route_ref?: string | null;
  source_evidence_refs?: string[];
  source_variable_refs?: string[];
  source_trace?: Record<string, unknown>;
  local_block_signals?: {
    missing_semantic_entry?: boolean;
    missing_transformation_exception_route?: boolean;
    missing_receiver_feedback_route?: boolean;
    b7_boundary_violation_attempted?: boolean;
  };
}

export interface EVEProductionSemanticGateRequest {
  scope: EVEProductionGateReadinessScope;
  gate_code: EVEProductionSemanticGateCode;
  resolution_status: "resolved" | "ambiguous" | "contradictory" | "not_safe" | "unsupported";
  resolution_summary_internal: string;
  client_safe_summary: string;
  source_evidence_refs?: string[];
  source_variable_refs?: string[];
  source_trace?: Record<string, unknown>;
}

export interface EVEProductionProcessStateTimerGateRequest {
  scope: EVEProductionGateReadinessScope;
  gate_code: EVEProductionProcessStateTimerGateCode;
  process_state_ref: string;
  timer_status: "ok" | "warning" | "missing_timer" | "deadlock_risk";
  timer_summary_internal: string;
  client_safe_summary: string;
  source_trace?: Record<string, unknown>;
}

export type EVEProductionReadinessState =
  | "ready"
  | "ready_with_flags"
  | "blocked"
  | "reentry_required"
  | "manual_review_required";

/** Blocking reason when deep primary capture lacks BASE-40 / CAUSAL-20 payload. */
export const MISSING_RUNTIME_40_20_OPERATIONAL_RULES_RUN =
  "missing_runtime_40_20_operational_rules_run" as const;

export type MissingRuntime4020OperationalRulesReason =
  typeof MISSING_RUNTIME_40_20_OPERATIONAL_RULES_RUN;

export interface EVEProductionOperationalRulesRunPayload {
  base_resolutions?: Array<Record<string, unknown>>;
  causal_closures?: Array<Record<string, unknown>>;
  explicit_flags?: string[];
  free_text_without_canonical_provenance_or_route?: boolean;
}

/**
 * Readiness evaluation request.
 *
 * Policy for primary deep capture (default):
 * - `runtime_deep_capture_required` defaults to required when not explicitly `false`.
 * - When deep capture is required, `operational_rules_run` is mandatory.
 * - If `operational_rules_run` is missing under deep capture, readiness cannot be
 *   `ready` or `ready_with_flags`; it must be `blocked` (or `manual_review_required`)
 *   with reason `missing_runtime_40_20_operational_rules_run`.
 *
 * Bypass is allowed only when `runtime_deep_capture_required: false` is set
 * explicitly to document a non-Runtime-deep path.
 */
export interface EVEProductionReadinessEvaluationRequest {
  scope: EVEProductionGateReadinessScope;
  dominant_gate_code: EVEProductionCriticalRouteGateCode;
  critical_route_results: Array<{
    gate_code: EVEProductionCriticalRouteGateCode;
    passed: boolean;
    blocked_reason?: string;
  }>;
  missing_critical_evidence: boolean;
  b3_incomplete: boolean;
  b7_boundary_blocked: boolean;
  manual_review_required: boolean;
  reentry_required: boolean;
  /**
   * Deep primary-activity Runtime capture flag.
   * - Omit / undefined / true → operational_rules_run is mandatory.
   * - Explicit false → non-deep path; operational_rules_run may be omitted.
   */
  runtime_deep_capture_required?: boolean;
  /**
   * Runtime 40/20 operational sufficiency payload (BASE-40 + CAUSAL-20).
   * Mandatory unless `runtime_deep_capture_required === false`.
   */
  operational_rules_run?: EVEProductionOperationalRulesRunPayload;
}

export interface EVEProductionReadinessGapResult {
  readiness_gap_record_created: boolean;
  readiness_gap_record_id: string | null;
  readiness_gap_record_not_required: boolean;
}

export interface EVEProductionReadinessDecisionResult {
  readiness_decision_record_created: boolean;
  readiness_decision_record_id: string | null;
  readiness_state: EVEProductionReadinessState;
}

export interface EVEProductionGateAuditResult {
  runtime_audit_trail_created: boolean;
  runtime_audit_trail_id: string | null;
}

export interface EVEProductionP5LocalSmokeResult {
  critical_route_gates_executed_local: boolean;
  b0_executed_local: boolean;
  b2_executed_local: boolean;
  b3_c09_executed_local: boolean;
  b7_c20_executed_local: boolean;
  semantic_resolution_events_created: boolean;
  process_state_timer_events_created: boolean;
  readiness_gap_record_created: boolean;
  readiness_gap_record_not_required: boolean;
  readiness_decision_record_created: boolean;
  readiness_state: EVEProductionReadinessState;
  runtime_audit_trail_created: boolean;
  diagnosis_created: false;
  export_real_created: false;
  produccion_paralela_started: false;
  qa_green_real_created: false;
  activation_allowed: false;
}

export type EVEProductionGateReadinessScopeBlockingReason =
  | "missing_tenant_id"
  | "missing_case_id"
  | "missing_role_id"
  | "missing_activity_id"
  | "missing_run_id"
  | "missing_correlation_id"
  | "missing_idempotency_key";

export interface EVEProductionGateReadinessScopeValidationResult {
  valid: boolean;
  scope: EVEProductionGateReadinessScope;
  blocking_reasons: EVEProductionGateReadinessScopeBlockingReason[];
}
