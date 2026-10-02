import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkMapData } from "../../../domain/local-work-map";
import { selectPrimaryActivitiesFromWorkMap } from "../../primary-activity-selector";
import {
  PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
  buildPrimaryActivitySelectionAuditEnvelope,
  buildPrimaryActivitySelectionPolicyManifest,
  hashStableJson,
  stableStringify,
  type ActivityDescriptionSource,
  type PrimaryActivitySelectionTraceItem,
} from "../../primary-activity-selection-audit";

export type ActivitySelectionReplayStatus = "match" | "mismatch" | "unverifiable";

export type ActivitySelectionReplayDiff = {
  activityId: string | null;
  code: string;
  persisted?: unknown;
  replayed?: unknown;
};

export type ActivitySelectionReplayResult = {
  selectionResultId: string;
  replayStatus: ActivitySelectionReplayStatus;
  replayedAt: string;
  replayHash: string;
  recomputedResultHash: string | null;
  persistedResultHash: string | null;
  diffs: ActivitySelectionReplayDiff[];
};

type DbSelectionResult = {
  id: string;
  source_snapshot_reference: string | null;
  input_snapshot_jsonb: Record<string, unknown> | null;
  workmap_snapshot_jsonb: WorkMapData | null;
  workmap_snapshot_hash: string | null;
  policy_manifest_hash: string | null;
  selector_code_version: string | null;
  selection_result_hash: string | null;
  trace_completeness_status: string | null;
};

type DbSelectionItem = {
  activity_id: string;
  display_label: string | null;
  responsibility_id: string | null;
  responsibility_title: string | null;
  activity_index: number | null;
  activity_description: string | null;
  activity_description_source: ActivityDescriptionSource | null;
  classification: "primary" | "non_primary" | "pending";
  eligibility_status: string | null;
  exclusion_reason: string | null;
  selected_slot: number | null;
  preferred_slot_candidate: string | null;
  selection_status: string | null;
  selection_reason_code: string | null;
  selection_reason_text: string | null;
  non_primary_context_status: string | null;
  promotion_condition_code: string | null;
  runtime_handoff_priority: number | null;
  manual_review_required: boolean | null;
  score_jsonb: Record<string, unknown> | null;
  penalties_jsonb: Record<string, unknown> | null;
  trace_flags_jsonb: string[] | null;
  rule_refs_jsonb: string[] | null;
  notes_jsonb: string[] | null;
  decision_trace_jsonb: Record<string, unknown> | null;
};

export async function replayAndPersistActivitySelection(input: {
  client: SupabaseClient;
  selectionResultId: string;
}): Promise<ActivitySelectionReplayResult> {
  const result = await loadSelectionResult(input.client, input.selectionResultId);
  const items = await loadSelectionItems(input.client, input.selectionResultId);
  const replayedAt = new Date().toISOString();
  const diffs: ActivitySelectionReplayDiff[] = [];

  const snapshot =
    result.workmap_snapshot_jsonb ??
    ((result.input_snapshot_jsonb?.workMapSnapshot ?? null) as WorkMapData | null);

  if (!snapshot) {
    diffs.push({ activityId: null, code: "snapshot_original_missing" });
    return persistReplay(input.client, result, {
      replayStatus: "unverifiable",
      replayedAt,
      recomputedResultHash: null,
      diffs,
    });
  }

  if (result.selector_code_version !== PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION) {
    diffs.push({
      activityId: null,
      code: "historical_selector_version_unavailable",
      persisted: result.selector_code_version,
      replayed: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
    });
    return persistReplay(input.client, result, {
      replayStatus: "unverifiable",
      replayedAt,
      recomputedResultHash: null,
      diffs,
    });
  }

  const manifestHash = hashStableJson(buildPrimaryActivitySelectionPolicyManifest());
  if (result.policy_manifest_hash !== manifestHash) {
    diffs.push({
      activityId: null,
      code: "policy_manifest_hash_mismatch",
      persisted: result.policy_manifest_hash,
      replayed: manifestHash,
    });
  }

  const recomputed = selectPrimaryActivitiesFromWorkMap(snapshot);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult: recomputed,
    sourceReference: result.source_snapshot_reference ?? "replay",
  });
  const persistedTraceItems = items.map(mapItemToTrace);

  if (persistedTraceItems.some((item) => item.activityDescriptionSource === "legacy_unknown")) {
    diffs.push({
      activityId: null,
      code: "activity_description_source_legacy_unknown",
      persisted: "legacy_unknown",
      replayed: "unverifiable",
    });
    return persistReplay(input.client, result, {
      replayStatus: "unverifiable",
      replayedAt,
      recomputedResultHash: null,
      diffs,
    });
  }

  if (result.workmap_snapshot_hash !== envelope.workMapSnapshotHash) {
    diffs.push({
      activityId: null,
      code: "workmap_snapshot_hash_mismatch",
      persisted: result.workmap_snapshot_hash,
      replayed: envelope.workMapSnapshotHash,
    });
  }

  if (result.selection_result_hash !== envelope.resultHash) {
    diffs.push({
      activityId: null,
      code: "selection_result_hash_mismatch",
      persisted: result.selection_result_hash,
      replayed: envelope.resultHash,
    });
  }

  compareTraces(persistedTraceItems, envelope.traceItems).forEach((diff) =>
    diffs.push(diff),
  );

  return persistReplay(input.client, result, {
    replayStatus: diffs.length ? "mismatch" : "match",
    replayedAt,
    recomputedResultHash: envelope.resultHash,
    diffs,
  });
}

async function loadSelectionResult(
  client: SupabaseClient,
  selectionResultId: string,
): Promise<DbSelectionResult> {
  const { data, error } = await client
    .from("activity_selection_results")
    .select(
      [
        "id",
        "source_snapshot_reference",
        "input_snapshot_jsonb",
        "workmap_snapshot_jsonb",
        "workmap_snapshot_hash",
        "policy_manifest_hash",
        "selector_code_version",
        "selection_result_hash",
        "trace_completeness_status",
      ].join(", "),
    )
    .eq("id", selectionResultId)
    .maybeSingle<DbSelectionResult>();

  if (error) throw new Error("activity_selection_replay_result_lookup_failed");
  if (!data) throw new Error("activity_selection_result_not_found");
  if (data.trace_completeness_status !== "complete") {
    return { ...data, workmap_snapshot_jsonb: null };
  }
  return data;
}

async function loadSelectionItems(
  client: SupabaseClient,
  selectionResultId: string,
): Promise<DbSelectionItem[]> {
  const { data, error } = await client
    .from("activity_selection_result_items")
    .select(
      [
        "activity_id",
        "display_label",
        "responsibility_id",
        "responsibility_title",
        "activity_index",
        "activity_description",
        "activity_description_source",
        "classification",
        "eligibility_status",
        "exclusion_reason",
        "selected_slot",
        "preferred_slot_candidate",
        "selection_status",
        "selection_reason_code",
        "selection_reason_text",
        "non_primary_context_status",
        "promotion_condition_code",
        "runtime_handoff_priority",
        "manual_review_required",
        "score_jsonb",
        "penalties_jsonb",
        "trace_flags_jsonb",
        "rule_refs_jsonb",
        "notes_jsonb",
        "decision_trace_jsonb",
      ].join(", "),
    )
    .eq("result_id", selectionResultId)
    .order("activity_index", { ascending: true });

  if (error) throw new Error("activity_selection_replay_items_lookup_failed");
  return (data ?? []) as unknown as DbSelectionItem[];
}

function mapItemToTrace(row: DbSelectionItem): PrimaryActivitySelectionTraceItem {
  return {
    activityId: row.activity_id,
    responsibilityId: row.responsibility_id ?? "",
    responsibilityTitle: row.responsibility_title ?? "",
    activityIndex: row.activity_index ?? 0,
    activityTitle: row.display_label ?? row.activity_id,
    activityDescription: row.activity_description,
    activityDescriptionSource: persistedActivityDescriptionSource(
      row.activity_description_source,
    ),
    classification: row.classification,
    eligibilityStatus: (row.eligibility_status ??
      "manual_review_required") as PrimaryActivitySelectionTraceItem["eligibilityStatus"],
    exclusionReason: row.exclusion_reason,
    sourceReference: "",
    selectedSlot: row.selected_slot,
    preferredSlotCandidate: row.preferred_slot_candidate,
    selectionStatus: row.selection_status ?? "",
    selectionReasonCode: row.selection_reason_code,
    selectionReasonText: row.selection_reason_text,
    nonPrimaryContextStatus: row.non_primary_context_status,
    promotionCondition: row.promotion_condition_code,
    runtimeHandoffPriority: row.runtime_handoff_priority,
    manualReviewRequired: row.manual_review_required === true,
    score: row.score_jsonb as PrimaryActivitySelectionTraceItem["score"],
    traceFlags: row.trace_flags_jsonb ?? [],
    ruleRefs: row.rule_refs_jsonb ?? [],
    notes: row.notes_jsonb ?? [],
    decisionTrace: row.decision_trace_jsonb ?? {},
  };
}

function persistedActivityDescriptionSource(
  value: ActivityDescriptionSource | null,
): ActivityDescriptionSource {
  if (
    value === "workmap_explicit" ||
    value === "absent" ||
    value === "legacy_unknown"
  ) {
    return value;
  }
  return "legacy_unknown";
}

function compareTraces(
  persisted: PrimaryActivitySelectionTraceItem[],
  replayed: PrimaryActivitySelectionTraceItem[],
): ActivitySelectionReplayDiff[] {
  const diffs: ActivitySelectionReplayDiff[] = [];
  const replayedById = new Map(replayed.map((item) => [item.activityId, item]));
  const persistedById = new Map(persisted.map((item) => [item.activityId, item]));

  for (const item of persisted) {
    const actual = replayedById.get(item.activityId);
    if (!actual) {
      diffs.push({ activityId: item.activityId, code: "activity_missing_in_replay" });
      continue;
    }
    const left = replayComparable(item);
    const right = replayComparable(actual);
    if (stableStringify(left) !== stableStringify(right)) {
      diffs.push({
        activityId: item.activityId,
        code: "activity_trace_mismatch",
        persisted: left,
        replayed: right,
      });
    }
  }

  for (const item of replayed) {
    if (!persistedById.has(item.activityId)) {
      diffs.push({ activityId: item.activityId, code: "activity_missing_in_persisted_trace" });
    }
  }

  return diffs;
}

function replayComparable(item: PrimaryActivitySelectionTraceItem) {
  return {
    activityId: item.activityId,
    activityTitle: item.activityTitle,
    activityDescription: item.activityDescription,
    activityDescriptionSource: item.activityDescriptionSource,
    classification: item.classification,
    eligibilityStatus: item.eligibilityStatus,
    selectedSlot: item.selectedSlot,
    selectionStatus: item.selectionStatus,
    selectionReasonCode: item.selectionReasonCode,
    nonPrimaryContextStatus: item.nonPrimaryContextStatus,
    runtimeHandoffPriority: item.runtimeHandoffPriority,
    score: item.score,
    penalties: item.score?.penalties ?? null,
    traceFlags: item.traceFlags,
    gates: item.decisionTrace?.gates ?? null,
  };
}

async function persistReplay(
  client: SupabaseClient,
  result: DbSelectionResult,
  replay: {
    replayStatus: ActivitySelectionReplayStatus;
    replayedAt: string;
    recomputedResultHash: string | null;
    diffs: ActivitySelectionReplayDiff[];
  },
): Promise<ActivitySelectionReplayResult> {
  const replayHash = hashStableJson({
    selectionResultId: result.id,
    replayStatus: replay.replayStatus,
    recomputedResultHash: replay.recomputedResultHash,
    persistedResultHash: result.selection_result_hash,
    diffs: replay.diffs,
  });

  const { error } = await client
    .from("activity_selection_results")
    .update({
      replay_status: replay.replayStatus,
      replay_checked_at: replay.replayedAt,
      replayed_at: replay.replayedAt,
      replay_hash: replayHash,
      replay_mismatch_jsonb: replay.diffs,
    })
    .eq("id", result.id);

  if (error) throw new Error("activity_selection_replay_persist_failed");

  return {
    selectionResultId: result.id,
    replayStatus: replay.replayStatus,
    replayedAt: replay.replayedAt,
    replayHash,
    recomputedResultHash: replay.recomputedResultHash,
    persistedResultHash: result.selection_result_hash,
    diffs: replay.diffs,
  };
}
