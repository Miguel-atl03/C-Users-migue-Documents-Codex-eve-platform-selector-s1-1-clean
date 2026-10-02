import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EVEClientSafeResultDTO } from "../client-result/runtime-40-20-client-result-types";
import {
  buildClientSafeResultFromLocalReadiness,
  type EVEActivationChainContextRef,
  isLocalServerSideServiceAccessUsed,
  readLocalReadinessByDecisionId,
} from "../client-result/runtime-40-20-client-result-service";
import type {
  EVEConsultantActivitySummary,
  EVEConsultantAnswerSubfieldSummary,
  EVEConsultantAuditTrailSummary,
  EVEConsultantCanonicalVariableSummary,
  EVEConsultantEvidenceSummary,
  EVEConsultantGateSummary,
  EVEConsultantReadinessDecisionSummary,
  EVEConsultantReadinessGapSummary,
  EVEConsultantReviewPacketRequest,
  EVEConsultantReviewPacketScope,
  EVEConsultantSessionSummary,
} from "./runtime-40-20-consultant-result-types";
import {
  buildConsultantReviewPacketDTO,
  getConsultantReviewPacketLocalAdapterStatus,
  validateConsultantReviewPacketScope,
} from "./runtime-40-20-consultant-result-service";

const SERVICE_ROLE_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export interface EVEConsultantLocalSnapshot {
  session_summary: EVEConsultantSessionSummary;
  activity_summary: EVEConsultantActivitySummary;
  answers_and_subfields: EVEConsultantAnswerSubfieldSummary[];
  evidence_items: EVEConsultantEvidenceSummary[];
  canonical_variables: EVEConsultantCanonicalVariableSummary[];
  readiness_gaps: EVEConsultantReadinessGapSummary[];
  gate_summaries: EVEConsultantGateSummary[];
  readiness_decision: EVEConsultantReadinessDecisionSummary;
  reentry_target: string | null;
  client_safe_result: EVEClientSafeResultDTO | null;
  audit_trail: EVEConsultantAuditTrailSummary[];
}

export type EVEConsultantChainReadFailure =
  | "missing_context"
  | "missing_session"
  | "missing_run"
  | "missing_readiness_decision"
  | "missing_audit_trail"
  | "missing_client_safe_result"
  | "missing_evidence_and_gaps"
  | "scope_mismatch"
  | "rls_blocked";

export interface EVEConsultantChainReadResult {
  snapshot: EVEConsultantLocalSnapshot | null;
  missing_components: EVEConsultantChainReadFailure[];
  local_server_side_service_access_used: boolean;
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/i.test(url);
}

function resolveServiceRole(env: NodeJS.ProcessEnv, _supabaseUrl = "") {
  for (const keyName of SERVICE_ROLE_KEYS) {
    if (env[keyName]) return env[keyName] as string;
  }
  // Never embed service-role material in source. Local runs must supply env.
  return null;
}

function createLocalSupabaseClient(env: NodeJS.ProcessEnv): SupabaseClient | null {
  const status = getConsultantReviewPacketLocalAdapterStatus(env);
  if (status.dependency_blocked) return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRole = resolveServiceRole(env, url);
  if (!serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapGateSummaries(
  semanticEvents: Array<Record<string, unknown>>,
  timerEvents: Array<Record<string, unknown>>,
  dominantGate: string | null,
): EVEConsultantGateSummary[] {
  const summaries: EVEConsultantGateSummary[] = [];
  const criticalGates = ["B0", "B2", "B3_C09", "B7_C20"];
  for (const gateCode of criticalGates) {
    summaries.push({
      gate_code: gateCode,
      gate_kind: "critical_route",
      status: dominantGate === gateCode ? "dominant" : "evaluated",
      summary_internal: `Gate ${gateCode} material de revisión consultor`,
      event_id: null,
    });
  }
  for (const event of semanticEvents) {
    const metadata =
      event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, unknown>)
        : {};
    summaries.push({
      gate_code: String(event.gate_id ?? "SEM-unknown"),
      gate_kind: "semantic",
      status: String(event.resolution_state ?? metadata.resolution_status ?? "unknown"),
      summary_internal:
        typeof metadata.resolution_summary_internal === "string"
          ? metadata.resolution_summary_internal
          : null,
      event_id: typeof event.id === "string" ? event.id : null,
    });
  }
  for (const event of timerEvents) {
    const metadata =
      event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, unknown>)
        : {};
    summaries.push({
      gate_code: String(event.gate_id ?? "PST-unknown"),
      gate_kind: "process_state_timer",
      status: String(metadata.timer_status ?? "unknown"),
      summary_internal:
        typeof metadata.timer_summary_internal === "string"
          ? metadata.timer_summary_internal
          : null,
      event_id: typeof event.id === "string" ? event.id : null,
    });
  }
  return summaries;
}

async function fetchRowsByIds(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
  select: string,
): Promise<Array<Record<string, unknown>>> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from(table).select(select).in("id", ids);
  if (error) return [];
  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

export async function readConsultantLocalSnapshotFromChainContext(
  chainContext: EVEActivationChainContextRef & {
    role_runtime_session_id?: string;
    runtime_interaction_instance_ids?: string[];
    runtime_subfield_response_ids?: string[];
    evidence_item_ids?: string[];
    canonical_variable_record_ids?: string[];
    readiness_gap_record_ids?: string[];
    semantic_resolution_event_ids?: string[];
    process_state_timer_event_ids?: string[];
    runtime_audit_trail_ids?: string[];
  },
  scope: EVEConsultantReviewPacketScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EVEConsultantChainReadResult> {
  const local_server_side_service_access_used = isLocalServerSideServiceAccessUsed(env);
  const missing_components: EVEConsultantChainReadFailure[] = [];

  if (!chainContext?.readiness_decision_record_id) {
    return {
      snapshot: null,
      missing_components: ["missing_context"],
      local_server_side_service_access_used,
    };
  }

  if (
    chainContext.tenant_id !== scope.tenant_id ||
    chainContext.case_id !== scope.case_id ||
    chainContext.run_id !== scope.run_id
  ) {
    return {
      snapshot: null,
      missing_components: ["scope_mismatch"],
      local_server_side_service_access_used,
    };
  }

  const supabase = createLocalSupabaseClient(env);
  if (!supabase) {
    return {
      snapshot: null,
      missing_components: ["rls_blocked"],
      local_server_side_service_access_used,
    };
  }

  const sessionId = chainContext.role_runtime_session_id;
  const sessionResult = sessionId
    ? await supabase
        .from("role_runtime_session")
        .select("id, state, correlation_id")
        .eq("id", sessionId)
        .eq("tenant_id", scope.tenant_id)
        .eq("case_id", scope.case_id)
        .maybeSingle()
    : { data: null, error: { message: "missing_session" } };

  if (sessionResult.error || !sessionResult.data) {
    missing_components.push("missing_session");
  }

  const runResult = await supabase
    .from("activity_runtime_run")
    .select("id, state")
    .eq("id", scope.run_id)
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("activity_id", scope.activity_id)
    .maybeSingle();

  if (runResult.error || !runResult.data) {
    missing_components.push("missing_run");
  }

  const decisionResult = await supabase
    .from("readiness_decision_record")
    .select(
      "id, tenant_id, case_id, run_id, readiness_state, dominant_gate, manual_review_required, reentry_target, reason",
    )
    .eq("id", chainContext.readiness_decision_record_id)
    .maybeSingle();

  if (decisionResult.error || !decisionResult.data) {
    missing_components.push("missing_readiness_decision");
  }

  const auditIds = chainContext.runtime_audit_trail_ids ?? [];
  const auditRows = await fetchRowsByIds(
    supabase,
    "runtime_audit_trail",
    auditIds,
    "id, object_type, object_id, action, actor_type, created_at",
  );
  if (!auditRows.length) {
    missing_components.push("missing_audit_trail");
  }

  const clientRead = await readLocalReadinessByDecisionId(chainContext, scope, env);
  const client_safe_result = clientRead.dto;
  if (!client_safe_result) {
    missing_components.push("missing_client_safe_result");
  }

  const subfieldIds = chainContext.runtime_subfield_response_ids ?? [];
  let subfieldRows: Array<Record<string, unknown>> = await fetchRowsByIds(
    supabase,
    "runtime_subfield_response",
    subfieldIds,
    "id, interaction_id, subfield_name, value, provenance_type",
  );
  if (!subfieldRows.length) {
    const fallback = await supabase
      .from("runtime_subfield_response")
      .select("id, interaction_id, subfield_name, value, provenance_type")
      .eq("tenant_id", scope.tenant_id)
      .eq("case_id", scope.case_id)
      .eq("run_id", scope.run_id);
    if (!fallback.error) subfieldRows = (fallback.data ?? []) as Array<Record<string, unknown>>;
  }

  const evidenceIds = chainContext.evidence_item_ids ?? [];
  let evidenceRows: Array<Record<string, unknown>> = await fetchRowsByIds(
    supabase,
    "evidence_item",
    evidenceIds,
    "id, literal_value, epistemic_status, provenance_type, metadata",
  );
  if (!evidenceRows.length) {
    const fallback = await supabase
      .from("evidence_item")
      .select("id, literal_value, epistemic_status, provenance_type, metadata")
      .eq("tenant_id", scope.tenant_id)
      .eq("case_id", scope.case_id)
      .eq("run_id", scope.run_id);
    if (!fallback.error) evidenceRows = (fallback.data ?? []) as Array<Record<string, unknown>>;
  }

  const canonicalIds = chainContext.canonical_variable_record_ids ?? [];
  let canonicalRows: Array<Record<string, unknown>> = await fetchRowsByIds(
    supabase,
    "canonical_variable_record",
    canonicalIds,
    "id, variable_name, variable_value, route_status, metadata",
  );
  if (!canonicalRows.length) {
    const fallback = await supabase
      .from("canonical_variable_record")
      .select("id, variable_name, variable_value, route_status, metadata")
      .eq("tenant_id", scope.tenant_id)
      .eq("case_id", scope.case_id)
      .eq("run_id", scope.run_id);
    if (!fallback.error) canonicalRows = (fallback.data ?? []) as Array<Record<string, unknown>>;
  }

  const gapIds = chainContext.readiness_gap_record_ids ?? [];
  let gapRows: Array<Record<string, unknown>> = await fetchRowsByIds(
    supabase,
    "readiness_gap_record",
    gapIds,
    "id, gap_type, status, severity, affected_route, metadata",
  );
  if (!gapRows.length) {
    const fallback = await supabase
      .from("readiness_gap_record")
      .select("id, gap_type, status, severity, affected_route, metadata")
      .eq("tenant_id", scope.tenant_id)
      .eq("case_id", scope.case_id)
      .eq("run_id", scope.run_id);
    if (!fallback.error) gapRows = (fallback.data ?? []) as Array<Record<string, unknown>>;
  }

  if (!evidenceRows.length && !gapRows.length) {
    missing_components.push("missing_evidence_and_gaps");
  }

  if (
    missing_components.some((c) =>
      [
        "missing_session",
        "missing_run",
        "missing_readiness_decision",
        "missing_audit_trail",
        "missing_client_safe_result",
        "missing_evidence_and_gaps",
        "scope_mismatch",
        "rls_blocked",
        "missing_context",
      ].includes(c),
    )
  ) {
    return { snapshot: null, missing_components, local_server_side_service_access_used };
  }

  const semanticRows = await fetchRowsByIds(
    supabase,
    "semantic_resolution_event",
    chainContext.semantic_resolution_event_ids ?? [],
    "id, gate_id, resolution_state, metadata",
  );
  const timerRows = await fetchRowsByIds(
    supabase,
    "process_state_timer_event",
    chainContext.process_state_timer_event_ids ?? [],
    "id, gate_id, metadata",
  );

  const decision = decisionResult.data!;
  const readiness_state = decision.readiness_state as EVEConsultantReadinessDecisionSummary["readiness_state"];
  const readiness_decision: EVEConsultantReadinessDecisionSummary = {
    readiness_decision_record_id: String(decision.id),
    readiness_state,
    consultant_review_state: "manual_review_required",
    dominant_gate: typeof decision.dominant_gate === "string" ? decision.dominant_gate : null,
    manual_review_required: Boolean(decision.manual_review_required),
    reentry_required:
      readiness_state === "reentry_required" || Boolean(decision.reentry_target),
    reason: typeof decision.reason === "string" ? decision.reason : null,
  };

  const snapshot: EVEConsultantLocalSnapshot = {
    session_summary: {
      tenant_id: scope.tenant_id,
      case_id: scope.case_id,
      role_id: scope.role_id,
      role_runtime_session_id: sessionResult.data ? String(sessionResult.data.id) : null,
      session_status: sessionResult.data?.state ? String(sessionResult.data.state) : null,
      correlation_id: scope.correlation_id,
    },
    activity_summary: {
      activity_id: scope.activity_id,
      run_id: scope.run_id,
      activity_runtime_run_id: runResult.data ? String(runResult.data.id) : null,
      run_status: runResult.data?.state ? String(runResult.data.state) : null,
      primary_activity: true,
    },
    answers_and_subfields: subfieldRows.map((row) => ({
      interaction_instance_id: String(row.interaction_id ?? ""),
      subfield_response_id: String(row.id ?? ""),
      question_ref: null,
      subfield_ref: typeof row.subfield_name === "string" ? row.subfield_name : null,
      captured_value: row.value ?? null,
      provenance: typeof row.provenance_type === "string" ? row.provenance_type : null,
    })),
    evidence_items: evidenceRows.map((row) => ({
      evidence_item_id: String(row.id ?? ""),
      evidence_type:
        row.metadata && typeof row.metadata === "object"
          ? String((row.metadata as Record<string, unknown>).evidence_type ?? "literal")
          : "literal",
      source_ref: typeof row.literal_value === "string" ? row.literal_value : null,
      summary_internal: typeof row.literal_value === "string" ? row.literal_value : null,
      linked_variable_refs: [],
    })),
    canonical_variables: canonicalRows.map((row) => ({
      canonical_variable_record_id: String(row.id ?? ""),
      variable_code: typeof row.variable_name === "string" ? row.variable_name : null,
      variable_value: row.variable_value ?? null,
      provenance:
        row.metadata && typeof row.metadata === "object"
          ? String((row.metadata as Record<string, unknown>).provenance ?? row.route_status ?? "")
          : typeof row.route_status === "string"
            ? row.route_status
            : null,
      confidence: null,
    })),
    readiness_gaps: gapRows.map((row) => ({
      readiness_gap_record_id: String(row.id ?? ""),
      gap_code: typeof row.gap_type === "string" ? row.gap_type : null,
      status: typeof row.status === "string" ? row.status : null,
      severity: typeof row.severity === "string" ? row.severity : null,
      summary_internal:
        typeof row.affected_route === "string" ? row.affected_route : null,
    })),
    gate_summaries: mapGateSummaries(
      semanticRows,
      timerRows,
      readiness_decision.dominant_gate,
    ),
    readiness_decision,
    reentry_target:
      typeof decision.reentry_target === "string" ? decision.reentry_target : null,
    client_safe_result,
    audit_trail: auditRows.map((row) => ({
      audit_trail_id: String(row.id ?? ""),
      object_type: typeof row.object_type === "string" ? row.object_type : null,
      object_id: typeof row.object_id === "string" ? row.object_id : null,
      action: typeof row.action === "string" ? row.action : null,
      actor_type: typeof row.actor_type === "string" ? row.actor_type : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    })),
  };

  return { snapshot, missing_components: [], local_server_side_service_access_used };
}

export async function readConsultantLocalSnapshotForScope(
  scope: EVEConsultantReviewPacketScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EVEConsultantLocalSnapshot | null> {
  const chainContext: EVEActivationChainContextRef & {
    role_runtime_session_id?: string;
    runtime_audit_trail_ids?: string[];
    readiness_gap_record_ids?: string[];
    semantic_resolution_event_ids?: string[];
    process_state_timer_event_ids?: string[];
    runtime_subfield_response_ids?: string[];
  } = {
    tenant_id: scope.tenant_id,
    case_id: scope.case_id,
    role_id: scope.role_id,
    activity_id: scope.activity_id,
    run_id: scope.run_id,
    readiness_decision_record_id: "",
  };

  const supabase = createLocalSupabaseClient(env);
  if (!supabase) return null;

  const decisionResult = await supabase
    .from("readiness_decision_record")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (decisionResult.error || !decisionResult.data) return null;
  chainContext.readiness_decision_record_id = String(decisionResult.data.id);

  const sessionResult = await supabase
    .from("role_runtime_session")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("role_id", scope.role_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionResult.data?.id) {
    chainContext.role_runtime_session_id = String(sessionResult.data.id);
  }

  const auditResult = await supabase
    .from("runtime_audit_trail")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id);
  chainContext.runtime_audit_trail_ids = (auditResult.data ?? []).map((r) => String(r.id));

  const gapResult = await supabase
    .from("readiness_gap_record")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id);
  chainContext.readiness_gap_record_ids = (gapResult.data ?? []).map((r) => String(r.id));

  const semResult = await supabase
    .from("semantic_resolution_event")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id);
  chainContext.semantic_resolution_event_ids = (semResult.data ?? []).map((r) => String(r.id));

  const timerResult = await supabase
    .from("process_state_timer_event")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id);
  chainContext.process_state_timer_event_ids = (timerResult.data ?? []).map((r) =>
    String(r.id),
  );

  const subfieldResult = await supabase
    .from("runtime_subfield_response")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id);
  chainContext.runtime_subfield_response_ids = (subfieldResult.data ?? []).map((r) =>
    String(r.id),
  );

  const read = await readConsultantLocalSnapshotFromChainContext(chainContext, scope, env);
  return read.snapshot;
}

export async function buildConsultantReviewPacketFromLocal(
  request: EVEConsultantReviewPacketRequest,
  env: NodeJS.ProcessEnv = process.env,
  chainContext?: EVEActivationChainContextRef & Record<string, unknown>,
) {
  const validation = validateConsultantReviewPacketScope(request.scope);
  if (!validation.valid) return null;

  const snapshot = chainContext
    ? (
        await readConsultantLocalSnapshotFromChainContext(
          chainContext as EVEActivationChainContextRef & Record<string, unknown>,
          validation.scope,
          env,
        )
      ).snapshot
    : await readConsultantLocalSnapshotForScope(validation.scope, env);

  if (!snapshot) return null;
  return buildConsultantReviewPacketDTO(request, snapshot);
}

export const Runtime40_20ConsultantResultLocalAdapter = {
  readConsultantLocalSnapshotFromChainContext,
  readConsultantLocalSnapshotForScope,
  buildConsultantReviewPacketFromLocal,
};
