import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivitySelectionConformanceEntry,
  ActivitySelectionConformanceGate,
  ActivitySelectionConformanceValue,
  ActivitySelectionConformanceView,
} from "./official-control-panel-activity-selection.types";

type Row = Record<string, unknown>;

const SIGNAL_KEYS = [
  ["pmSignalPotential", "pmSignalPotential"],
  ["mocSignalPotential", "mocSignalPotential"],
  ["pfSignalPotential", "pfSignalPotential"],
  ["olcSignalPotential", "olcSignalPotential"],
  ["architecturalSignalPotential", "architecturalSignalPotential"],
  ["operationalCentrality", "operationalCentrality"],
  ["transformationObjectSignal", "transformationObjectSignal"],
  ["handoffDependencySignal", "handoffDependencySignal"],
  ["timerWaitSignal", "timerWaitSignal"],
  ["synchronizationGovernanceSignal", "synchronizationGovernanceSignal"],
  ["frictionExceptionSignal", "frictionExceptionSignal"],
  ["pfOlcRiskSignal", "pfOlcRiskSignal"],
  ["coverageDiversityValue", "coverageDiversityValue"],
] as const;

const PENALTY_KEYS = [
  ["duplicatePenalty", "duplicatePenalty"],
  ["tooMacroPenalty", "tooMacroPenalty"],
  ["tooMicroPenalty", "tooMicroPenalty"],
  ["overlySpecificToolPenalty", "overlySpecificToolPenalty"],
  ["lateralContextPenalty", "lateralContextPenalty"],
  ["responsibilityBalanceAdjustment", "responsibilityBalanceAdjustment"],
  ["boosts", "boosts"],
] as const;

const HEADER_COLUMNS = [
  "id",
  "case_id",
  "participant_id",
  "profile_id",
  "role_runtime_session_id",
  "policy_version",
  "selection_mode",
  "result_version",
  "eligible_count",
  "selected_count",
  "non_primary_context_count",
  "source_snapshot_reference",
  "source_snapshot_hash",
  "workmap_snapshot_hash",
  "policy_manifest_hash",
  "selector_code_version",
  "selection_result_hash",
  "trace_completeness_status",
  "replay_status",
  "replayed_at",
  "replay_hash",
  "replay_mismatch_jsonb",
].join(", ");

const ITEM_COLUMNS = [
  "id",
  "result_id",
  "activity_id",
  "display_label",
  "responsibility_id",
  "responsibility_title",
  "activity_index",
  "activity_description",
  "activity_description_source",
  "classification",
  "selected_slot",
  "preferred_slot_candidate",
  "selection_reason_code",
  "source_reference",
  "promotion_condition_code",
  "eligibility_status",
  "exclusion_reason",
  "selection_status",
  "selection_reason_text",
  "non_primary_context_status",
  "runtime_handoff_priority",
  "manual_review_required",
  "manual_review_state",
  "manual_review_justification",
  "reviewed_by",
  "reviewed_at",
  "score_jsonb",
  "penalties_jsonb",
  "trace_flags_jsonb",
  "rule_refs_jsonb",
  "notes_jsonb",
  "decision_trace_jsonb",
].join(", ");

export async function loadActivitySelectionConformance(input: {
  client: SupabaseClient;
  caseId: string;
  selectionResultId: string;
  itemId: string;
}): Promise<ActivitySelectionConformanceView | null> {
  const { data: header, error: headerError } = await input.client
    .from("activity_selection_results")
    .select(HEADER_COLUMNS)
    .eq("id", input.selectionResultId)
    .eq("case_id", input.caseId)
    .maybeSingle();
  if (headerError) throw headerError;
  if (!header) return null;

  const { data: item, error: itemError } = await input.client
    .from("activity_selection_result_items")
    .select(ITEM_COLUMNS)
    .eq("id", input.itemId)
    .eq("result_id", input.selectionResultId)
    .maybeSingle();
  if (itemError) throw itemError;
  if (!item) return null;
  const labels = await loadConformanceLabels(input.client, header as unknown as Row);
  const runtimeRunId = await loadActivityRuntimeRunId(
    input.client,
    header as unknown as Row,
    item as unknown as Row,
  );

  return buildConformanceView(
    header as unknown as Row,
    item as unknown as Row,
    labels,
    runtimeRunId,
  );
}

export async function loadActivitySelectionConformanceScope(input: {
  client: SupabaseClient;
  caseId: string;
  selectionResultId: string;
  itemId: string;
}): Promise<{
  caseId: string;
  participantId: string;
  profileId: string;
  roleRuntimeSessionId: string | null;
} | null> {
  const { data, error } = await input.client
    .from("activity_selection_results")
    .select("id, case_id, participant_id, profile_id, role_runtime_session_id")
    .eq("id", input.selectionResultId)
    .eq("case_id", input.caseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: item, error: itemError } = await input.client
    .from("activity_selection_result_items")
    .select("id")
    .eq("id", input.itemId)
    .eq("result_id", input.selectionResultId)
    .maybeSingle();
  if (itemError) throw itemError;
  if (!item) return null;

  const row = data as unknown as Row;
  return {
    caseId: String(row.case_id),
    participantId: String(row.participant_id),
    profileId: String(row.profile_id),
    roleRuntimeSessionId: textOrNull(row.role_runtime_session_id),
  };
}

function buildConformanceView(
  header: Row,
  item: Row,
  labels: { caseLabel: string | null; profileLabel: string | null },
  activityRuntimeRunId: string | null,
): ActivitySelectionConformanceView {
  const score = objectOrNull(item.score_jsonb);
  const penalties = objectOrNull(item.penalties_jsonb);
  const decisionTrace = objectOrNull(item.decision_trace_jsonb);
  const notes = objectOrNull(item.notes_jsonb);
  const traceCompletenessStatus = textOrNull(header.trace_completeness_status);
  const replayStatus = textOrNull(header.replay_status);
  const legacyTraceMessage =
    traceCompletenessStatus === "legacy_selection_trace_incomplete" ||
    replayStatus === "unverifiable"
      ? buildLegacyTraceMessage(header)
      : null;
  const sourceWorkmap = parseSourceSnapshotReference(
    textOrNull(header.source_snapshot_reference),
  );
  const activityLabel = textOrNull(item.display_label) ?? String(item.activity_id);

  return {
    resultId: String(header.id),
    itemId: String(item.id),
    activityId: String(item.activity_id),
    label: textOrNull(item.display_label) ?? String(item.activity_id),
    globalStatus: globalStatus({
      replayStatus,
      traceCompletenessStatus,
      manualReviewRequired: item.manual_review_required === true,
    }),
    legacyTraceMessage,
    summary: {
      evaluatedCount: numberOrNull(header.eligible_count),
      selectedPrimaryCount: numberOrNull(header.selected_count),
      nonPrimaryContextCount: numberOrNull(header.non_primary_context_count),
    },
    provenance: {
      caseId: String(header.case_id),
      caseLabel: labels.caseLabel,
      profileId: String(header.profile_id),
      profileLabel: labels.profileLabel,
      activityLabel,
      responsibilityLabel:
        textOrNull(item.responsibility_title) ??
        textOrNull(item.responsibility_id),
      sourceReference: textOrNull(item.source_reference),
      lineage:
        textOrNull(item.source_reference) ??
        textOrNull(item.responsibility_id) ??
        String(item.activity_id),
      sourceWorkmapId: sourceWorkmap.id,
      sourceWorkmapVersionId: sourceWorkmap.version,
      profileBinding: sourceWorkmap.profileBinding,
      workmapSnapshotHash:
        textOrNull(header.workmap_snapshot_hash) ??
        textOrNull(header.source_snapshot_hash),
    },
    identity: {
      caseId: String(header.case_id),
      participantId: String(header.participant_id),
      profileId: String(header.profile_id),
      roleRuntimeSessionId: textOrNull(header.role_runtime_session_id),
      sourceSnapshotReference: textOrNull(header.source_snapshot_reference),
      sourceSnapshotHash: textOrNull(header.source_snapshot_hash),
      policyVersion: textOrNull(header.policy_version),
      selectorCodeVersion: textOrNull(header.selector_code_version),
      policyManifestHash: textOrNull(header.policy_manifest_hash),
      selectionResultHash: textOrNull(header.selection_result_hash),
    },
    item: {
      itemId: String(item.id),
      activityId: String(item.activity_id),
      responsibilityId: textOrNull(item.responsibility_id),
      activityIndex: numberOrNull(item.activity_index),
      activityDescription: textOrNull(item.activity_description),
      activityDescriptionSource: persistedActivityDescriptionSource(
        item.activity_description_source,
      ),
      notes: jsonValue(item.notes_jsonb),
    },
    runtime: {
      roleRuntimeSessionId: textOrNull(header.role_runtime_session_id),
      activityRuntimeRunId,
    },
    eligibility: {
      status: textOrNull(item.eligibility_status),
      exclusionReason: textOrNull(item.exclusion_reason),
      evidence: pickValue("evidence", notes, decisionTrace),
      gates: extractGates(decisionTrace),
      ruleRefs: Array.isArray(item.rule_refs_jsonb) ? item.rule_refs_jsonb : [],
    },
    signals: SIGNAL_KEYS.map(([key, label]) =>
      conformanceEntry(key, label, pickValue(key, score, decisionTrace)),
    ),
    penalties: PENALTY_KEYS.map(([key, label]) =>
      conformanceEntry(key, label, pickValue(key, penalties, decisionTrace)),
    ),
    decision: {
      classification: normalizeClassification(textOrNull(item.classification)),
      selectionStatus: textOrNull(item.selection_status),
      selectedSlot: numberOrNull(item.selected_slot),
      finalSelectionScore: pickValue("finalSelectionScore", score, decisionTrace),
      preferredSlotCandidate: pickValue(
        "preferredSlotCandidate",
        { preferredSlotCandidate: textOrNull(item.preferred_slot_candidate) },
        decisionTrace,
      ),
      selectionReasonCode: textOrNull(item.selection_reason_code),
      selectionReasonText: textOrNull(item.selection_reason_text),
      runtimeHandoffPriority: numberOrNull(item.runtime_handoff_priority),
    },
    nonPrimaryContext: {
      status: textOrNull(item.non_primary_context_status),
      promotionConditionCode: textOrNull(item.promotion_condition_code),
      promotionCondition: pickValue("promotionCondition", notes, decisionTrace),
      reviewCondition: pickValue("reviewCondition", notes, decisionTrace),
    },
    governance: {
      traceCompletenessStatus,
      replayStatus,
      replayedAt: textOrNull(header.replayed_at),
      replayHash: textOrNull(header.replay_hash),
      replayDiffs: jsonValue(header.replay_mismatch_jsonb),
      manualReviewRequired: item.manual_review_required === true,
      manualReviewState: textOrNull(item.manual_review_state),
      manualReviewJustification: textOrNull(item.manual_review_justification),
      manualReviewActor: textOrNull(item.reviewed_by),
      manualReviewReviewedAt: textOrNull(item.reviewed_at),
      traceFlags: Array.isArray(item.trace_flags_jsonb) ? item.trace_flags_jsonb : [],
      qa: pickValue("qa", notes, decisionTrace),
    },
  };
}

function persistedActivityDescriptionSource(value: unknown): string {
  const source = textOrNull(value);
  if (
    source === "workmap_explicit" ||
    source === "absent" ||
    source === "legacy_unknown"
  ) {
    return source;
  }
  return "legacy_unknown";
}

async function loadConformanceLabels(
  client: SupabaseClient,
  header: Row,
): Promise<{ caseLabel: string | null; profileLabel: string | null }> {
  const [caseLabel, profileLabel] = await Promise.all([
    loadCaseLabel(client, String(header.case_id)),
    loadProfileLabel(client, String(header.profile_id)),
  ]);
  return { caseLabel, profileLabel };
}

async function loadActivityRuntimeRunId(
  client: SupabaseClient,
  header: Row,
  item: Row,
): Promise<string | null> {
  const roleRuntimeSessionId = textOrNull(header.role_runtime_session_id);
  const activityId = textOrNull(item.activity_id);
  if (!roleRuntimeSessionId || !activityId) return null;
  try {
    const { data, error } = await client
      .from("activity_runtime_run")
      .select("activity_runtime_run_id")
      .eq("role_runtime_session_id", roleRuntimeSessionId)
      .eq("activity_id", activityId)
      .maybeSingle();
    if (error) return null;
    return textOrNull((data as Row | null)?.activity_runtime_run_id);
  } catch {
    return null;
  }
}

async function loadCaseLabel(
  client: SupabaseClient,
  caseId: string,
): Promise<string | null> {
  try {
    const { data, error } = await client
      .from("sesiones_llenado")
      .select("display_name")
      .eq("id", caseId)
      .maybeSingle();
    if (error) return null;
    return textOrNull((data as Row | null)?.display_name);
  } catch {
    return null;
  }
}

async function loadProfileLabel(
  client: SupabaseClient,
  profileId: string,
): Promise<string | null> {
  try {
    const { data, error } = await client
      .from("case_participant_profiles")
      .select("role_label")
      .eq("id", profileId)
      .maybeSingle();
    if (error) return null;
    return textOrNull((data as Row | null)?.role_label);
  } catch {
    return null;
  }
}

function buildLegacyTraceMessage(header: Row) {
  const evaluated = numberOrNull(header.eligible_count);
  const primary = numberOrNull(header.selected_count);
  const contextual = numberOrNull(header.non_primary_context_count);
  const preserved =
    evaluated != null && primary != null && contextual != null
      ? `El resultado de ${evaluated}/${primary}/${contextual} se conserva, `
      : "El resultado persistido se conserva, ";
  return `Esta selección fue ejecutada antes de la trazabilidad exhaustiva C3.12. ${preserved}pero los componentes no persistidos no pueden reconstruirse.`;
}

function parseSourceSnapshotReference(value: string | null): {
  id: string | null;
  version: string | number | null;
  profileBinding: string | null;
} {
  if (!value) return { id: null, version: null, profileBinding: null };
  const parts = value.split(":").map((part) => part.trim()).filter(Boolean);
  const profileIndex = parts.indexOf("profile");
  const versionCandidate = parts[2] ?? null;
  return {
    id: parts[1] ?? value,
    version:
      versionCandidate && versionCandidate !== "profile"
        ? versionCandidate
        : null,
    profileBinding: profileIndex >= 0 ? "profile" : null,
  };
}

function globalStatus(input: {
  replayStatus: string | null;
  traceCompletenessStatus: string | null;
  manualReviewRequired: boolean;
}): ActivitySelectionConformanceView["globalStatus"] {
  if (input.replayStatus === "mismatch") return "mismatch";
  if (input.replayStatus === "unverifiable") return "unverifiable";
  if (input.manualReviewRequired) return "manual_review_required";
  if (input.traceCompletenessStatus === "legacy_selection_trace_incomplete") {
    return "conformant_with_traceability_gaps";
  }
  return "conformant";
}

function extractGates(trace: Row | null): ActivitySelectionConformanceGate[] {
  const raw = trace?.gates ?? trace?.gateResults ?? trace?.eligibilityGates;
  if (!Array.isArray(raw)) {
    return [
      {
        key: "gate_trace",
        label: "Gate trace",
        status: "No verificable",
        detail: "No hay trazabilidad de gates persistida para esta actividad.",
      },
    ];
  }
  return raw.flatMap((value, index): ActivitySelectionConformanceGate[] => {
    const gate = objectOrNull(value);
    if (!gate) return [];
    return [
      {
        key: textOrNull(gate.key) ?? textOrNull(gate.id) ?? `gate_${index + 1}`,
        label:
          textOrNull(gate.label) ??
          textOrNull(gate.name) ??
          `Gate ${index + 1}`,
        status:
          textOrNull(gate.status) ??
          textOrNull(gate.result) ??
          (gate.passed === true ? "passed" : gate.passed === false ? "failed" : "unknown"),
        detail: textOrNull(gate.detail) ?? textOrNull(gate.reason),
      },
    ];
  });
}

function conformanceEntry(
  key: string,
  label: string,
  value: ActivitySelectionConformanceValue,
): ActivitySelectionConformanceEntry {
  return {
    key,
    label,
    value,
    status: value == null ? "not_persisted" : "persisted",
  };
}

function pickValue(
  key: string,
  primary: Row | null,
  secondary: Row | null,
): ActivitySelectionConformanceValue {
  return jsonValue(primary?.[key] ?? secondary?.[key] ?? snakeFallback(key, primary, secondary));
}

function snakeFallback(key: string, primary: Row | null, secondary: Row | null) {
  const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return primary?.[snake] ?? secondary?.[snake];
}

function normalizeClassification(
  value: string | null,
): ActivitySelectionConformanceView["decision"]["classification"] {
  if (value === "primary") return "primary";
  if (value === "non_primary" || value === "non-primary") return "non-primary";
  if (value === "pending") return "pending";
  return "unavailable";
}

function jsonValue(value: unknown): ActivitySelectionConformanceValue {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    Array.isArray(value) ||
    (typeof value === "object" && value)
  ) {
    return value as ActivitySelectionConformanceValue;
  }
  return null;
}

function objectOrNull(value: unknown): Row | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
