import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyOperationalRulesToReadinessState,
  evaluateRuntime4020ReadinessGuard,
  MISSING_OPERATIONAL_RULES_RUN_REASON,
} from "../operational-rules/runtime-40-20-readiness-guard";
import type {
  BaseResolutionRecord,
} from "../operational-rules/base40-operational-rule";
import type {
  CausalClosureRecord,
} from "../operational-rules/causal20-operational-rule";
import type {
  EVEProductionCriticalRouteGateRequest,
  EVEProductionGateAuditResult,
  EVEProductionGateReadinessScope,
  EVEProductionGateReadinessScopeBlockingReason,
  EVEProductionGateReadinessScopeValidationResult,
  EVEProductionProcessStateTimerGateRequest,
  EVEProductionReadinessDecisionResult,
  EVEProductionReadinessEvaluationRequest,
  EVEProductionReadinessGapResult,
  EVEProductionReadinessState,
  EVEProductionSemanticGateRequest,
} from "./runtime-40-20-gates-readiness-types";
import { MISSING_RUNTIME_40_20_OPERATIONAL_RULES_RUN } from "./runtime-40-20-gates-readiness-types";

/** Local alias so local smoke tests that stub types still resolve the reason string. */
const MISSING_OPS_REASON =
  MISSING_RUNTIME_40_20_OPERATIONAL_RULES_RUN ||
  "missing_runtime_40_20_operational_rules_run";

export type EVEProductionReadinessResolutionDetail = {
  readiness_state: EVEProductionReadinessState;
  blocking_reason: string | null;
  readiness_gap: ReturnType<typeof buildReadinessGapRecordInsert> | null;
  operational_rules_enforced: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeGateReadinessScope(
  rawScope: Partial<EVEProductionGateReadinessScope> | undefined,
): EVEProductionGateReadinessScope {
  return {
    tenant_id: rawScope?.tenant_id?.trim() ?? "",
    case_id: rawScope?.case_id?.trim() ?? "",
    role_id: rawScope?.role_id?.trim() ?? "",
    activity_id: rawScope?.activity_id?.trim() ?? "",
    run_id: rawScope?.run_id?.trim() ?? "",
    correlation_id: rawScope?.correlation_id?.trim() ?? "",
    idempotency_key: rawScope?.idempotency_key?.trim() ?? "",
  };
}

export function validateGateReadinessScope(
  rawScope: Partial<EVEProductionGateReadinessScope> | undefined,
): EVEProductionGateReadinessScopeValidationResult {
  const scope = normalizeGateReadinessScope(rawScope);
  const blocking_reasons: EVEProductionGateReadinessScopeBlockingReason[] = [];
  if (!isNonEmptyString(scope.tenant_id)) blocking_reasons.push("missing_tenant_id");
  if (!isNonEmptyString(scope.case_id)) blocking_reasons.push("missing_case_id");
  if (!isNonEmptyString(scope.role_id)) blocking_reasons.push("missing_role_id");
  if (!isNonEmptyString(scope.activity_id)) blocking_reasons.push("missing_activity_id");
  if (!isNonEmptyString(scope.run_id)) blocking_reasons.push("missing_run_id");
  if (!isNonEmptyString(scope.correlation_id)) blocking_reasons.push("missing_correlation_id");
  if (!isNonEmptyString(scope.idempotency_key)) {
    blocking_reasons.push("missing_idempotency_key");
  }
  return { valid: blocking_reasons.length === 0, scope, blocking_reasons };
}

export function evaluateCriticalRouteGateLocally(
  request: EVEProductionCriticalRouteGateRequest,
): { gate_code: string; executed: true; passed: boolean; blocked_reason?: string } {
  if (request.gate_code === "B7_C20") {
    const blocked = request.local_block_signals?.b7_boundary_violation_attempted === true;
    return {
      gate_code: request.gate_code,
      executed: true,
      passed: !blocked,
      blocked_reason: blocked ? "b7_non_diagnostic_boundary_violation" : undefined,
    };
  }
  if (request.gate_code === "B3_C09") {
    const hasRoute = isNonEmptyString(request.route_ref);
    return {
      gate_code: request.gate_code,
      executed: true,
      passed: hasRoute,
      blocked_reason: hasRoute ? undefined : "missing_receiver_feedback_route_ref",
    };
  }
  if (request.gate_code === "B2") {
    const blocked = request.local_block_signals?.missing_transformation_exception_route === true;
    return {
      gate_code: request.gate_code,
      executed: true,
      passed: !blocked,
      blocked_reason: blocked ? "missing_transformation_exception_route" : undefined,
    };
  }
  const blocked = request.local_block_signals?.missing_semantic_entry === true;
  return {
    gate_code: request.gate_code,
    executed: true,
    passed: !blocked,
    blocked_reason: blocked ? "missing_semantic_entry" : undefined,
  };
}

export function buildSemanticResolutionEventInsert(
  request: EVEProductionSemanticGateRequest,
) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    role_id: request.scope.role_id,
    activity_id: request.scope.activity_id,
    run_id: request.scope.run_id,
    gate_id: request.gate_code,
    candidate_label: request.client_safe_summary,
    resolution_state: request.resolution_status,
    action_taken: request.resolution_summary_internal,
    manual_review_required:
      request.resolution_status === "ambiguous" || request.resolution_status === "contradictory",
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p5_gates_readiness_local",
        gate_code: request.gate_code,
        trace: request.source_trace ?? {},
      },
    ],
    metadata: {
      source_evidence_refs: request.source_evidence_refs ?? [],
      source_variable_refs: request.source_variable_refs ?? [],
      resolution_summary_internal: request.resolution_summary_internal,
      client_safe_summary: request.client_safe_summary,
      created_at: new Date().toISOString(),
      local_only: true,
    },
  };
}

export function buildProcessStateTimerEventInsert(
  request: EVEProductionProcessStateTimerGateRequest,
) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    role_id: request.scope.role_id,
    activity_id: request.scope.activity_id,
    run_id: request.scope.run_id,
    gate_id: request.gate_code,
    awaited_event: request.process_state_ref,
    release_condition: request.timer_status,
    timer_event_or_timeout_rule: request.timer_summary_internal,
    timeout_state: request.client_safe_summary,
    resolver_owner: "p5-local-gate-engine",
    exit_path: "local_readiness_review",
    deadlock_risk: request.timer_status === "deadlock_risk",
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p5_gates_readiness_local",
        gate_code: request.gate_code,
        trace: request.source_trace ?? {},
      },
    ],
    metadata: {
      process_state_ref: request.process_state_ref,
      timer_status: request.timer_status,
      timer_summary_internal: request.timer_summary_internal,
      client_safe_summary: request.client_safe_summary,
      created_at: new Date().toISOString(),
      local_only: true,
    },
  };
}

export function isRuntimeDeepCaptureRequired(
  request: Pick<EVEProductionReadinessEvaluationRequest, "runtime_deep_capture_required">,
): boolean {
  return request.runtime_deep_capture_required !== false;
}

export function buildMissingOperationalRulesReadinessGap(
  request: EVEProductionReadinessEvaluationRequest,
) {
  return buildReadinessGapRecordInsert({
    request,
    gap_type: MISSING_OPS_REASON,
    severity: "high",
    reentry_target: "BaseResolutionGate/CausalClosureGate",
  });
}

export function resolveReadinessState(
  request: EVEProductionReadinessEvaluationRequest,
): EVEProductionReadinessState {
  return resolveReadinessEvaluation(request).readiness_state;
}

export function resolveReadinessEvaluation(
  request: EVEProductionReadinessEvaluationRequest,
): EVEProductionReadinessResolutionDetail {
  let proposed: EVEProductionReadinessState;
  if (request.b7_boundary_blocked) {
    proposed = request.manual_review_required ? "manual_review_required" : "blocked";
  } else if (request.manual_review_required) {
    proposed = "manual_review_required";
  } else if (request.reentry_required) {
    proposed = "reentry_required";
  } else if (request.missing_critical_evidence || request.b3_incomplete) {
    proposed = "ready_with_flags";
  } else {
    proposed = "ready";
  }

  const ops = request.operational_rules_run;
  const deepCaptureRequired = isRuntimeDeepCaptureRequired(request);

  if (!ops && deepCaptureRequired) {
    return {
      readiness_state:
        proposed === "manual_review_required" ? "manual_review_required" : "blocked",
      blocking_reason: MISSING_OPS_REASON,
      readiness_gap: buildMissingOperationalRulesReadinessGap(request),
      operational_rules_enforced: true,
    };
  }

  if (!ops) {
    // Explicit non-deep bypass: runtime_deep_capture_required === false.
    return {
      readiness_state: proposed,
      blocking_reason: null,
      readiness_gap: null,
      operational_rules_enforced: false,
    };
  }

  const guard = evaluateRuntime4020ReadinessGuard({
    base_resolutions: (ops.base_resolutions ?? []) as BaseResolutionRecord[],
    causal_closures: (ops.causal_closures ?? []) as CausalClosureRecord[],
    explicit_flags: ops.explicit_flags,
    free_text_without_canonical_provenance_or_route:
      ops.free_text_without_canonical_provenance_or_route,
    runtime_deep_capture_required: request.runtime_deep_capture_required,
    operational_rules_run_present: true,
  });

  let readiness_state: EVEProductionReadinessState = proposed;
  if (proposed === "ready" && !guard.ready_full_allowed) {
    readiness_state = mapGuardStateToProductionReadiness(
      applyOperationalRulesToReadinessState({ proposed_state: proposed, guard }),
    );
  } else if (
    proposed === "ready_with_flags" &&
    !guard.ready_with_flags_allowed &&
    !guard.ready_full_allowed
  ) {
    readiness_state = mapGuardStateToProductionReadiness(
      applyOperationalRulesToReadinessState({ proposed_state: proposed, guard }),
    );
  }

  const missingOpsReason = guard.blocking_reasons.includes(
    MISSING_OPERATIONAL_RULES_RUN_REASON,
  )
    ? MISSING_OPS_REASON
    : null;

  return {
    readiness_state,
    blocking_reason: missingOpsReason,
    readiness_gap: missingOpsReason
      ? buildMissingOperationalRulesReadinessGap(request)
      : null,
    operational_rules_enforced: true,
  };
}

function mapGuardStateToProductionReadiness(
  state: string,
): EVEProductionReadinessState {
  if (
    state === "ready" ||
    state === "ready_with_flags" ||
    state === "blocked" ||
    state === "reentry_required" ||
    state === "manual_review_required"
  ) {
    return state;
  }
  if (state === "blocked_by_missing_canonical_route") return "blocked";
  if (state === "partial_evidence_only") return "ready_with_flags";
  return "blocked";
}

export function buildReadinessGapRecordInsert(input: {
  request: EVEProductionReadinessEvaluationRequest;
  gap_type: string;
  severity: "low" | "medium" | "high";
  reentry_target?: string;
}) {
  return {
    tenant_id: input.request.scope.tenant_id,
    case_id: input.request.scope.case_id,
    role_id: input.request.scope.role_id,
    activity_id: input.request.scope.activity_id,
    run_id: input.request.scope.run_id,
    gap_type: input.gap_type,
    affected_route: input.request.dominant_gate_code,
    affected_quadrant: "None",
    severity: input.severity,
    reentry_target: input.reentry_target ?? null,
    manual_review_flag: input.request.manual_review_required,
    status: "open",
    correlation_id: input.request.scope.correlation_id,
    idempotency_key: input.request.scope.idempotency_key,
    source_trace: [{ stage: "p5_gates_readiness_local", object: "readiness_gap_record" }],
    metadata: { local_only: true },
  };
}

export function buildReadinessDecisionRecordInsert(input: {
  request: EVEProductionReadinessEvaluationRequest;
  readiness_state: EVEProductionReadinessState;
  reason: string;
}) {
  return {
    tenant_id: input.request.scope.tenant_id,
    case_id: input.request.scope.case_id,
    role_id: input.request.scope.role_id,
    activity_id: input.request.scope.activity_id,
    run_id: input.request.scope.run_id,
    role_runtime_session_id: null,
    readiness_state: input.readiness_state,
    dominant_gate: input.request.dominant_gate_code,
    reason: input.reason,
    reentry_target: input.request.reentry_required ? "runtime_interaction_instance" : null,
    manual_review_required: input.request.manual_review_required || input.readiness_state === "blocked",
    correlation_id: input.request.scope.correlation_id,
    idempotency_key: input.request.scope.idempotency_key,
    source_trace: [{ stage: "p5_gates_readiness_local", object: "readiness_decision_record" }],
    metadata: { local_only: true },
  };
}

export function buildGateAuditTrailInsert(input: {
  scope: EVEProductionGateReadinessScope;
  object_type: string;
  object_id: string;
  action: string;
  reason: string;
  new_value?: unknown;
}) {
  return {
    tenant_id: input.scope.tenant_id,
    case_id: input.scope.case_id,
    role_id: input.scope.role_id,
    activity_id: input.scope.activity_id,
    run_id: input.scope.run_id,
    object_type: input.object_type,
    object_id: input.object_id,
    actor_id: "p5-local-gate-service",
    actor_type: "system_local_adapter",
    action: input.action,
    reason: input.reason,
    prior_value: null,
    new_value: input.new_value ?? null,
    correlation_id: input.scope.correlation_id,
    idempotency_key: input.scope.idempotency_key,
    source_trace: [{ stage: "p5_gates_readiness_local", object: "runtime_audit_trail" }],
    metadata: { local_only: true },
  };
}

export async function createSemanticResolutionEvent(
  supabase: SupabaseClient,
  request: EVEProductionSemanticGateRequest,
) {
  const { data, error } = await supabase
    .from("semantic_resolution_event")
    .insert(buildSemanticResolutionEventInsert(request))
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createProcessStateTimerEvent(
  supabase: SupabaseClient,
  request: EVEProductionProcessStateTimerGateRequest,
) {
  const { data, error } = await supabase
    .from("process_state_timer_event")
    .insert(buildProcessStateTimerEventInsert(request))
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createReadinessGapRecord(
  supabase: SupabaseClient,
  payload: ReturnType<typeof buildReadinessGapRecordInsert>,
): Promise<EVEProductionReadinessGapResult> {
  const { data, error } = await supabase
    .from("readiness_gap_record")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return {
    readiness_gap_record_created: true,
    readiness_gap_record_id: data.id as string,
    readiness_gap_record_not_required: false,
  };
}

export async function createReadinessDecisionRecord(
  supabase: SupabaseClient,
  payload: ReturnType<typeof buildReadinessDecisionRecordInsert>,
): Promise<EVEProductionReadinessDecisionResult> {
  const { data, error } = await supabase
    .from("readiness_decision_record")
    .insert(payload)
    .select("id,readiness_state")
    .single();
  if (error) throw error;
  return {
    readiness_decision_record_created: true,
    readiness_decision_record_id: data.id as string,
    readiness_state: data.readiness_state as EVEProductionReadinessState,
  };
}

export async function createGateAuditTrail(
  supabase: SupabaseClient,
  payload: ReturnType<typeof buildGateAuditTrailInsert>,
): Promise<EVEProductionGateAuditResult> {
  const { data, error } = await supabase
    .from("runtime_audit_trail")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return {
    runtime_audit_trail_created: true,
    runtime_audit_trail_id: data.id as string,
  };
}

export const Runtime40_20GatesReadinessService = {
  normalizeGateReadinessScope,
  validateGateReadinessScope,
  evaluateCriticalRouteGateLocally,
  buildSemanticResolutionEventInsert,
  buildProcessStateTimerEventInsert,
  isRuntimeDeepCaptureRequired,
  buildMissingOperationalRulesReadinessGap,
  resolveReadinessState,
  resolveReadinessEvaluation,
  buildReadinessGapRecordInsert,
  buildReadinessDecisionRecordInsert,
  buildGateAuditTrailInsert,
  createSemanticResolutionEvent,
  createProcessStateTimerEvent,
  createReadinessGapRecord,
  createReadinessDecisionRecord,
  createGateAuditTrail,
};
