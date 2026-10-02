import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivitySelectionClassification,
  ActivitySelectionLifecycleState,
  ActivitySelectionModePersisted,
  ActivitySelectionResultItemRecord,
  ActivitySelectionResultRecord,
} from "./official-control-panel-activity-selection.types";

type DbClient = SupabaseClient;

export type OfficialControlPanelActivitySelectionRepository = {
  findEffectiveBySession: (
    roleRuntimeSessionId: string,
  ) => Promise<ActivitySelectionResultRecord | null>;
  countEffectiveBySession: (roleRuntimeSessionId: string) => Promise<number>;
  listEffectiveByCase: (
    caseId: string,
  ) => Promise<ActivitySelectionResultRecord[]>;
  listItemsByResultId: (
    resultId: string,
  ) => Promise<ActivitySelectionResultItemRecord[]>;
};

const HEADER_COLUMNS = [
  "id",
  "case_id",
  "participant_id",
  "profile_id",
  "role_runtime_session_id",
  "policy_code",
  "policy_version",
  "source_snapshot_reference",
  "source_snapshot_hash",
  "result_version",
  "lifecycle_state",
  "selection_mode",
  "eligible_count",
  "selected_count",
  "non_primary_context_count",
  "workmap_coverage_gap",
  "promotion_condition_code",
  "computed_at",
  "effective_from",
  "policy_manifest_hash",
  "selector_code_version",
  "selection_result_hash",
  "trace_completeness_status",
  "replay_status",
].join(", ");

const ITEM_COLUMNS = [
  "id",
  "result_id",
  "activity_id",
  "display_label",
  "classification",
  "selected_slot",
  "selection_reason_code",
  "source_reference",
  "promotion_condition_code",
  "eligibility_status",
  "selection_status",
  "selection_reason_text",
  "non_primary_context_status",
  "runtime_handoff_priority",
  "manual_review_required",
  "score_jsonb",
  "penalties_jsonb",
  "trace_flags_jsonb",
  "rule_refs_jsonb",
  "decision_trace_jsonb",
].join(", ");

export function createOfficialControlPanelActivitySelectionRepository(
  client: DbClient,
): OfficialControlPanelActivitySelectionRepository {
  return {
    async findEffectiveBySession(roleRuntimeSessionId) {
      const { data, error } = await client
        .from("activity_selection_results")
        .select(HEADER_COLUMNS)
        .eq("role_runtime_session_id", roleRuntimeSessionId)
        .eq("lifecycle_state", "effective")
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapHeader(data as unknown as Record<string, unknown>);
    },

    async countEffectiveBySession(roleRuntimeSessionId) {
      const { count, error } = await client
        .from("activity_selection_results")
        .select("id", { count: "exact", head: true })
        .eq("role_runtime_session_id", roleRuntimeSessionId)
        .eq("lifecycle_state", "effective");
      if (error) throw error;
      return count ?? 0;
    },

    async listEffectiveByCase(caseId) {
      const { data, error } = await client
        .from("activity_selection_results")
        .select(HEADER_COLUMNS)
        .eq("case_id", caseId)
        .eq("lifecycle_state", "effective")
        .order("effective_from", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) =>
        mapHeader(row as unknown as Record<string, unknown>),
      );
    },

    async listItemsByResultId(resultId) {
      const { data, error } = await client
        .from("activity_selection_result_items")
        .select(ITEM_COLUMNS)
        .eq("result_id", resultId)
        .order("selected_slot", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((row) =>
        mapItem(row as unknown as Record<string, unknown>),
      );
    },
  };
}

function mapHeader(row: Record<string, unknown>): ActivitySelectionResultRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    participantId: String(row.participant_id),
    profileId: String(row.profile_id),
    roleRuntimeSessionId: String(row.role_runtime_session_id),
    policyCode: String(row.policy_code),
    policyVersion: String(row.policy_version),
    sourceSnapshotReference: String(row.source_snapshot_reference),
    sourceSnapshotHash: String(row.source_snapshot_hash),
    resultVersion: Number(row.result_version),
    lifecycleState: row.lifecycle_state as ActivitySelectionLifecycleState,
    selectionMode: row.selection_mode as ActivitySelectionModePersisted,
    eligibleCount: Number(row.eligible_count),
    selectedCount: Number(row.selected_count),
    nonPrimaryContextCount: Number(row.non_primary_context_count),
    workmapCoverageGap:
      typeof row.workmap_coverage_gap === "boolean"
        ? row.workmap_coverage_gap
        : null,
    promotionConditionCode:
      typeof row.promotion_condition_code === "string"
        ? row.promotion_condition_code
        : null,
    computedAt: String(row.computed_at),
    effectiveFrom:
      typeof row.effective_from === "string" ? row.effective_from : null,
    policyManifestHash:
      typeof row.policy_manifest_hash === "string" ? row.policy_manifest_hash : null,
    selectorCodeVersion:
      typeof row.selector_code_version === "string" ? row.selector_code_version : null,
    selectionResultHash:
      typeof row.selection_result_hash === "string" ? row.selection_result_hash : null,
    traceCompletenessStatus:
      typeof row.trace_completeness_status === "string"
        ? row.trace_completeness_status
        : null,
    replayStatus: typeof row.replay_status === "string" ? row.replay_status : null,
  };
}

function mapItem(row: Record<string, unknown>): ActivitySelectionResultItemRecord {
  return {
    id: String(row.id),
    resultId: String(row.result_id),
    activityId: String(row.activity_id),
    displayLabel: String(row.display_label),
    classification: row.classification as ActivitySelectionClassification,
    selectedSlot:
      typeof row.selected_slot === "number" ? row.selected_slot : null,
    selectionReasonCode:
      typeof row.selection_reason_code === "string"
        ? row.selection_reason_code
        : null,
    sourceReference:
      typeof row.source_reference === "string" ? row.source_reference : null,
    promotionConditionCode:
      typeof row.promotion_condition_code === "string"
        ? row.promotion_condition_code
        : null,
    eligibilityStatus:
      typeof row.eligibility_status === "string" ? row.eligibility_status : null,
    selectionStatus:
      typeof row.selection_status === "string" ? row.selection_status : null,
    selectionReasonText:
      typeof row.selection_reason_text === "string"
        ? row.selection_reason_text
        : null,
    nonPrimaryContextStatus:
      typeof row.non_primary_context_status === "string"
        ? row.non_primary_context_status
        : null,
    runtimeHandoffPriority:
      typeof row.runtime_handoff_priority === "number"
        ? row.runtime_handoff_priority
        : null,
    manualReviewRequired: row.manual_review_required === true,
    score:
      row.score_jsonb && typeof row.score_jsonb === "object"
        ? (row.score_jsonb as Record<string, unknown>)
        : null,
    penalties:
      row.penalties_jsonb && typeof row.penalties_jsonb === "object"
        ? (row.penalties_jsonb as Record<string, unknown>)
        : null,
    traceFlags: Array.isArray(row.trace_flags_jsonb) ? row.trace_flags_jsonb : [],
    ruleRefs: Array.isArray(row.rule_refs_jsonb) ? row.rule_refs_jsonb : [],
    decisionTrace:
      row.decision_trace_jsonb && typeof row.decision_trace_jsonb === "object"
        ? (row.decision_trace_jsonb as Record<string, unknown>)
        : null,
  };
}
