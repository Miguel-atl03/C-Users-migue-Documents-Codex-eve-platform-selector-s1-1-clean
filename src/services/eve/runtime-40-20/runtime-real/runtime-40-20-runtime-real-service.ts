import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EVEProductionRuntimeAnswerIngestRequest,
  EVEProductionRuntimeAuditResult,
  EVEProductionRuntimeCanonicalVariableResult,
  EVEProductionRuntimeEvidenceResult,
  EVEProductionRuntimeGapResult,
  EVEProductionRuntimeInteractionRequest,
  EVEProductionRuntimeRunRequest,
  EVEProductionRuntimeScope,
  EVEProductionRuntimeScopeBlockingReason,
  EVEProductionRuntimeScopeValidationResult,
  EVEProductionRuntimeSessionRequest,
} from "./runtime-40-20-runtime-real-types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeProductionRuntimeScope(
  rawScope: Partial<EVEProductionRuntimeScope> | undefined,
): EVEProductionRuntimeScope {
  return {
    tenant_id: rawScope?.tenant_id?.trim() ?? "",
    case_id: rawScope?.case_id?.trim() ?? "",
    role_id: rawScope?.role_id?.trim() ?? "",
    activity_id: rawScope?.activity_id?.trim() ?? "",
    run_id: rawScope?.run_id?.trim() ?? "",
    client_session_id: rawScope?.client_session_id?.trim() ?? "",
    correlation_id: rawScope?.correlation_id?.trim() ?? "",
    idempotency_key: rawScope?.idempotency_key?.trim() ?? "",
  };
}

export function validateProductionRuntimeScope(
  rawScope: Partial<EVEProductionRuntimeScope> | undefined,
): EVEProductionRuntimeScopeValidationResult {
  const scope = normalizeProductionRuntimeScope(rawScope);
  const blocking_reasons: EVEProductionRuntimeScopeBlockingReason[] = [];

  if (!isNonEmptyString(scope.tenant_id)) blocking_reasons.push("missing_tenant_id");
  if (!isNonEmptyString(scope.case_id)) blocking_reasons.push("missing_case_id");
  if (!isNonEmptyString(scope.role_id)) blocking_reasons.push("missing_role_id");
  if (!isNonEmptyString(scope.activity_id)) blocking_reasons.push("missing_activity_id");
  if (!isNonEmptyString(scope.run_id)) blocking_reasons.push("missing_run_id");
  if (!isNonEmptyString(scope.client_session_id)) {
    blocking_reasons.push("missing_client_session_id");
  }
  if (!isNonEmptyString(scope.correlation_id)) {
    blocking_reasons.push("missing_correlation_id");
  }
  if (!isNonEmptyString(scope.idempotency_key)) {
    blocking_reasons.push("missing_idempotency_key");
  }

  return {
    valid: blocking_reasons.length === 0,
    scope,
    blocking_reasons,
  };
}

export function buildRoleRuntimeSessionInsert(request: EVEProductionRuntimeSessionRequest) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    created_by: request.created_by ?? null,
    role_id: request.scope.role_id,
    catalog_version_id: request.catalog_version_id,
    state: request.state ?? "active",
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p4_runtime_real_local",
        object: "role_runtime_session",
        correlation_id: request.scope.correlation_id,
      },
    ],
    metadata: {
      scope: {
        role_id: request.scope.role_id,
        client_session_id: request.scope.client_session_id,
      },
      local_only: true,
    },
  };
}

export function buildActivityRuntimeRunInsert(request: EVEProductionRuntimeRunRequest) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    created_by: request.created_by ?? null,
    role_id: request.scope.role_id,
    activity_id: request.scope.activity_id,
    role_runtime_session_id: request.role_runtime_session_id,
    catalog_version_id: request.catalog_version_id,
    state: request.state ?? "initialized",
    base_visible_count: 0,
    causal_visible_count: 0,
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p4_runtime_real_local",
        object: "activity_runtime_run",
        scope_run_id: request.scope.run_id,
      },
    ],
    metadata: {
      local_only: true,
      client_session_id: request.scope.client_session_id,
      runtime_scope_run_id: request.scope.run_id,
    },
  };
}

export function buildRuntimeInteractionInstanceInsert(
  request: EVEProductionRuntimeInteractionRequest,
) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    created_by: request.created_by ?? null,
    role_id: request.scope.role_id,
    activity_id: request.scope.activity_id,
    run_id: request.scope.run_id,
    runtime_interaction_id: request.runtime_interaction_id,
    state: request.state ?? "shown",
    shown_at: new Date().toISOString(),
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p4_runtime_real_local",
        object: "runtime_interaction_instance",
        runtime_interaction_id: request.runtime_interaction_id,
      },
    ],
    metadata: {
      local_only: true,
      client_session_id: request.scope.client_session_id,
    },
  };
}

export function buildRuntimeSubfieldResponseInsert(
  request: EVEProductionRuntimeAnswerIngestRequest,
  subfield: EVEProductionRuntimeAnswerIngestRequest["subfields"][number],
) {
  return {
    tenant_id: request.scope.tenant_id,
    case_id: request.scope.case_id,
    created_by: request.created_by ?? null,
    role_id: request.scope.role_id,
    activity_id: request.scope.activity_id,
    run_id: request.scope.run_id,
    interaction_id: request.interaction_instance_id,
    subfield_name: subfield.subfield_name,
    value: subfield.value,
    epistemic_status: subfield.epistemic_status,
    provenance_type: subfield.provenance_type,
    confidence: subfield.confidence ?? null,
    correlation_id: request.scope.correlation_id,
    idempotency_key: request.scope.idempotency_key,
    source_trace: [
      {
        stage: "p4_runtime_real_local",
        object: "runtime_subfield_response",
        subfield_name: subfield.subfield_name,
      },
    ],
    metadata: {
      local_only: true,
      client_session_id: request.scope.client_session_id,
    },
  };
}

export function buildEvidenceItemInsert(input: {
  scope: EVEProductionRuntimeScope;
  interaction_instance_id: string;
  subfield_response_id: string;
  literal_value: string;
}) {
  return {
    tenant_id: input.scope.tenant_id,
    case_id: input.scope.case_id,
    role_id: input.scope.role_id,
    activity_id: input.scope.activity_id,
    run_id: input.scope.run_id,
    interaction_id: input.interaction_instance_id,
    subfield_response_id: input.subfield_response_id,
    literal_value: input.literal_value,
    epistemic_status: "captured_user_evidence",
    provenance_type: "user_input",
    confidence: null,
    correlation_id: input.scope.correlation_id,
    idempotency_key: input.scope.idempotency_key,
    source_trace: [{ stage: "p4_runtime_real_local", object: "evidence_item" }],
    metadata: { local_only: true },
  };
}

export function buildCanonicalVariableRecordInsert(input: {
  scope: EVEProductionRuntimeScope;
  variable_name: string;
  variable_value: unknown;
}) {
  return {
    tenant_id: input.scope.tenant_id,
    case_id: input.scope.case_id,
    role_id: input.scope.role_id,
    activity_id: input.scope.activity_id,
    run_id: input.scope.run_id,
    variable_name: input.variable_name,
    variable_value: input.variable_value,
    route_id: "runtime_local_mapping",
    route_status: "closed",
    derived_from: [{ source: "runtime_subfield_response" }],
    gap_flag: false,
    correlation_id: input.scope.correlation_id,
    idempotency_key: input.scope.idempotency_key,
    source_trace: [{ stage: "p4_runtime_real_local", object: "canonical_variable_record" }],
    metadata: { local_only: true },
  };
}

export function buildReadinessGapRecordInsert(input: {
  scope: EVEProductionRuntimeScope;
  gap_type: string;
  severity: string;
}) {
  return {
    tenant_id: input.scope.tenant_id,
    case_id: input.scope.case_id,
    role_id: input.scope.role_id,
    activity_id: input.scope.activity_id,
    run_id: input.scope.run_id,
    gap_type: input.gap_type,
    affected_route: "runtime_local_mapping",
    affected_quadrant: "None",
    severity: input.severity,
    reentry_target: "runtime_interaction_instance",
    manual_review_flag: false,
    status: "open",
    correlation_id: input.scope.correlation_id,
    idempotency_key: input.scope.idempotency_key,
    source_trace: [{ stage: "p4_runtime_real_local", object: "readiness_gap_record" }],
    metadata: { local_only: true },
  };
}

export function buildRuntimeAuditTrailInsert(input: {
  scope: EVEProductionRuntimeScope;
  object_type: string;
  object_id: string;
  action: string;
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
    actor_id: input.scope.client_session_id,
    actor_type: "system_local_adapter",
    action: input.action,
    reason: "p4_runtime_real_local_capture",
    prior_value: null,
    new_value: input.new_value ?? null,
    correlation_id: input.scope.correlation_id,
    idempotency_key: input.scope.idempotency_key,
    source_trace: [{ stage: "p4_runtime_real_local", object: "runtime_audit_trail" }],
    metadata: { local_only: true },
  };
}

export async function createRoleRuntimeSession(
  supabase: SupabaseClient,
  request: EVEProductionRuntimeSessionRequest,
) {
  const insertPayload = buildRoleRuntimeSessionInsert(request);
  const { data, error } = await supabase
    .from("role_runtime_session")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createActivityRuntimeRun(
  supabase: SupabaseClient,
  request: EVEProductionRuntimeRunRequest,
) {
  const insertPayload = buildActivityRuntimeRunInsert(request);
  const { data, error } = await supabase
    .from("activity_runtime_run")
    .insert(insertPayload)
    .select("id,run_id")
    .single();
  if (error) throw error;
  return data as { id: string; run_id: string };
}

export async function createRuntimeInteractionInstance(
  supabase: SupabaseClient,
  request: EVEProductionRuntimeInteractionRequest,
) {
  const insertPayload = buildRuntimeInteractionInstanceInsert(request);
  const { data, error } = await supabase
    .from("runtime_interaction_instance")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function ingestRuntimeAnswerSubfields(
  supabase: SupabaseClient,
  request: EVEProductionRuntimeAnswerIngestRequest,
) {
  const createdIds: string[] = [];
  for (const subfield of request.subfields) {
    const insertPayload = buildRuntimeSubfieldResponseInsert(request, subfield);
    const { data, error } = await supabase
      .from("runtime_subfield_response")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) throw error;
    createdIds.push(data.id as string);
  }
  return createdIds;
}

export async function createEvidenceItem(
  supabase: SupabaseClient,
  input: Parameters<typeof buildEvidenceItemInsert>[0],
): Promise<EVEProductionRuntimeEvidenceResult> {
  const { data, error } = await supabase
    .from("evidence_item")
    .insert(buildEvidenceItemInsert(input))
    .select("id")
    .single();
  if (error) throw error;
  return {
    evidence_item_created: true,
    evidence_item_id: data.id as string,
  };
}

export async function createCanonicalVariableRecord(
  supabase: SupabaseClient,
  input: Parameters<typeof buildCanonicalVariableRecordInsert>[0],
): Promise<EVEProductionRuntimeCanonicalVariableResult> {
  const { data, error } = await supabase
    .from("canonical_variable_record")
    .insert(buildCanonicalVariableRecordInsert(input))
    .select("id")
    .single();
  if (error) throw error;
  return {
    canonical_variable_record_created: true,
    canonical_variable_record_id: data.id as string,
  };
}

export async function createReadinessGapRecord(
  supabase: SupabaseClient,
  input: Parameters<typeof buildReadinessGapRecordInsert>[0],
): Promise<EVEProductionRuntimeGapResult> {
  const { data, error } = await supabase
    .from("readiness_gap_record")
    .insert(buildReadinessGapRecordInsert(input))
    .select("id")
    .single();
  if (error) throw error;
  return {
    readiness_gap_record_created: true,
    readiness_gap_record_id: data.id as string,
  };
}

export async function createRuntimeAuditTrail(
  supabase: SupabaseClient,
  input: Parameters<typeof buildRuntimeAuditTrailInsert>[0],
): Promise<EVEProductionRuntimeAuditResult> {
  const { data, error } = await supabase
    .from("runtime_audit_trail")
    .insert(buildRuntimeAuditTrailInsert(input))
    .select("id")
    .single();
  if (error) throw error;
  return {
    runtime_audit_trail_created: true,
    runtime_audit_trail_id: data.id as string,
  };
}

export const Runtime40_20RuntimeRealService = {
  normalizeProductionRuntimeScope,
  validateProductionRuntimeScope,
  buildRoleRuntimeSessionInsert,
  buildActivityRuntimeRunInsert,
  buildRuntimeInteractionInstanceInsert,
  buildRuntimeSubfieldResponseInsert,
  buildEvidenceItemInsert,
  buildCanonicalVariableRecordInsert,
  buildReadinessGapRecordInsert,
  buildRuntimeAuditTrailInsert,
  createRoleRuntimeSession,
  createActivityRuntimeRun,
  createRuntimeInteractionInstance,
  ingestRuntimeAnswerSubfields,
  createEvidenceItem,
  createCanonicalVariableRecord,
  createReadinessGapRecord,
  createRuntimeAuditTrail,
};
