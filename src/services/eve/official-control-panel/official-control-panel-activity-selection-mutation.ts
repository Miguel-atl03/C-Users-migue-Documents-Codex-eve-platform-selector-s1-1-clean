import type { WorkMapData } from "../../../domain/local-work-map.ts";
import { PRIMARY_ACTIVITY_SELECTION_VERSION } from "../../../domain/primary-activity-selection-policy.ts";
import {
  buildPrimaryActivitySelectionAuditEnvelope,
  hashStableJson,
  type ActivityDescriptionSource,
  type PrimaryActivitySelectionAuditEnvelope,
} from "../../primary-activity-selection-audit.ts";
import { selectPrimaryActivitiesFromWorkMap } from "../../primary-activity-selector.ts";

export const ACTIVITY_SELECTION_POLICY_CODE = "PRIMARY_ACTIVITY_SELECTION";

/** Canonical reject code from §11 validate counts / selected_le_eight integrity. */
export const SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY =
  "selection_result_more_than_eight_primary" as const;

export const MAX_PRIMARY_SELECTED_ACTIVITIES = 8;

export type ActivitySelectionStageItemPayload = {
  activity_id: string;
  display_label: string;
  classification: "primary" | "non_primary" | "pending";
  selected_slot: number | null;
  selection_reason_code: string | null;
  source_reference: string | null;
  promotion_condition_code: string | null;
  responsibility_id: string | null;
  responsibility_title: string | null;
  activity_index: number | null;
  activity_description: string | null;
  activity_description_source: ActivityDescriptionSource;
  eligibility_status: string | null;
  exclusion_reason: string | null;
  preferred_slot_candidate: string | null;
  selection_status: string | null;
  selection_reason_text: string | null;
  non_primary_context_status: string | null;
  runtime_handoff_priority: number | null;
  manual_review_required: boolean;
  score_jsonb: Record<string, unknown> | null;
  penalties_jsonb: Record<string, unknown> | null;
  trace_flags_jsonb: string[];
  rule_refs_jsonb: string[];
  notes_jsonb: string[];
  decision_trace_jsonb: Record<string, unknown>;
};

export type ActivitySelectionStageResultPayload = {
  policy_code: string;
  policy_version: string;
  source_snapshot_reference: string;
  source_snapshot_hash: string;
  selection_mode: string;
  eligible_count: number;
  selected_count: number;
  non_primary_context_count: number;
  workmap_coverage_gap: boolean | null;
  promotion_condition_code: string | null;
  input_snapshot_jsonb: Record<string, unknown>;
  workmap_snapshot_jsonb: WorkMapData;
  workmap_snapshot_hash: string;
  policy_manifest_jsonb: Record<string, unknown>;
  policy_manifest_hash: string;
  selector_code_version: string;
  selector_git_commit: string | null;
  execution_timestamp: string;
  selection_result_hash: string;
  trace_completeness_status: "complete";
  replay_status: "not_replayed";
};

export type ActivitySelectionPublishPreparation = {
  result: ActivitySelectionStageResultPayload;
  items: ActivitySelectionStageItemPayload[];
  selectedActivityIds: string[];
  mode: string;
  auditEnvelope: PrimaryActivitySelectionAuditEnvelope;
};

/**
 * Hard reject before any DB write when the client (or derived set) exceeds 8.
 * Surfaces the same canonical code as eve_validate_activity_selection_result_counts.
 */
export function assertSelectedActivityCountAllowed(
  selectedActivityIds: readonly string[],
):
  | { ok: true }
  | { ok: false; code: typeof SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY } {
  if (selectedActivityIds.length > MAX_PRIMARY_SELECTED_ACTIVITIES) {
    return { ok: false, code: SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY };
  }
  return { ok: true };
}

export function buildActivitySelectionStageFromWorkMap(
  workMap: WorkMapData,
  snapshotReference: string,
): ActivitySelectionPublishPreparation {
  const selectionResult = selectPrimaryActivitiesFromWorkMap(workMap);
  const auditEnvelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: snapshotReference,
  });

  const items: ActivitySelectionStageItemPayload[] = auditEnvelope.traceItems.map(
    (item) => ({
      activity_id: item.activityId,
      display_label: item.activityTitle || item.activityId,
      classification: item.classification,
      selected_slot: item.selectedSlot,
      selection_reason_code: item.selectionReasonCode,
      source_reference: item.sourceReference,
      promotion_condition_code: item.promotionCondition,
      responsibility_id: item.responsibilityId,
      responsibility_title: item.responsibilityTitle,
      activity_index: item.activityIndex,
      activity_description: item.activityDescription,
      activity_description_source: item.activityDescriptionSource,
      eligibility_status: item.eligibilityStatus,
      exclusion_reason: item.exclusionReason,
      preferred_slot_candidate: item.preferredSlotCandidate,
      selection_status: item.selectionStatus,
      selection_reason_text: item.selectionReasonText,
      non_primary_context_status: item.nonPrimaryContextStatus,
      runtime_handoff_priority: item.runtimeHandoffPriority,
      manual_review_required: item.manualReviewRequired,
      score_jsonb: item.score as Record<string, unknown> | null,
      penalties_jsonb: item.score?.penalties ?? null,
      trace_flags_jsonb: item.traceFlags,
      rule_refs_jsonb: item.ruleRefs,
      notes_jsonb: item.notes,
      decision_trace_jsonb: item.decisionTrace,
    }),
  );
  assertActivityDescriptionSources(items);

  const promotion =
    items.find((item) => item.promotion_condition_code)?.promotion_condition_code ??
    null;

  return {
    result: {
      policy_code: ACTIVITY_SELECTION_POLICY_CODE,
      policy_version: PRIMARY_ACTIVITY_SELECTION_VERSION,
      source_snapshot_reference: snapshotReference,
      source_snapshot_hash: auditEnvelope.workMapSnapshotHash,
      selection_mode: selectionResult.mode,
      eligible_count: selectionResult.runLog.eligibleActivityCount,
      selected_count: selectionResult.runLog.selectedActivityCount,
      non_primary_context_count: selectionResult.nonPrimaryContextActivities.length,
      workmap_coverage_gap: selectionResult.mode === "reentry_required",
      promotion_condition_code: promotion,
      input_snapshot_jsonb: auditEnvelope.inputSnapshot,
      workmap_snapshot_jsonb: auditEnvelope.workMapSnapshot,
      workmap_snapshot_hash: auditEnvelope.workMapSnapshotHash,
      policy_manifest_jsonb: auditEnvelope.policyManifest as Record<string, unknown>,
      policy_manifest_hash: auditEnvelope.policyManifestHash,
      selector_code_version: auditEnvelope.selectorCodeVersion,
      selector_git_commit: auditEnvelope.selectorGitCommit,
      execution_timestamp: auditEnvelope.executionTimestamp,
      selection_result_hash: auditEnvelope.resultHash,
      trace_completeness_status: auditEnvelope.traceCompletenessStatus,
      replay_status: "not_replayed",
    },
    items,
    selectedActivityIds: selectionResult.selectedPrimaryActivities.map(
      (item) => item.activityId,
    ),
    mode: selectionResult.mode,
    auditEnvelope,
  };
}

export function buildLegacySelectionHash(value: unknown): string {
  return hashStableJson(value);
}

function assertActivityDescriptionSources(items: ActivitySelectionStageItemPayload[]) {
  for (const item of items) {
    if (!item.activity_description_source) {
      throw new Error("activity_description_source_required");
    }
  }
}
