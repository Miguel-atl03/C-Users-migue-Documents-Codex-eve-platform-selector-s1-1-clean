/**
 * Base Resolution Gate — enforces BASE-40 sufficiency by resolution.
 */

import {
  BASE40_BASE_IDS,
  BASE40_BLOCK_READY_FULL_STATES,
  BASE40_BLOCK_READY_STATES,
  BASE40_FULL_RESOLUTION_STATES,
  type Base40ResolutionState,
  type BaseResolutionRecord,
  isBase40AllowedState,
  isBase40Id,
} from "./base40-operational-rule";

export type BaseResolutionGateNextState =
  | "ready"
  | "ready_with_flags"
  | "blocked"
  | "reentry_required"
  | "manual_review_required"
  | "partial_evidence_only";

export type BaseResolutionGateResult = {
  gate: "BaseResolutionGate";
  passed_for_ready_full: boolean;
  total_required: 40;
  resolved_count: number;
  blocked_count: number;
  reentry_count: number;
  manual_review_count: number;
  inferred_unconfirmed_count: number;
  skipped_silently_count: number;
  ready_with_flag_count: number;
  missing_status_count: number;
  unresolved_base_ids: string[];
  blocking_reasons: string[];
  allowed_next_state: BaseResolutionGateNextState;
  handoff_to_evidence_bundle_mdsb_allowed: boolean;
};

export type ActivityRuntimeRunBaseInput = {
  activity_runtime_run_id?: string;
  base_resolutions?: BaseResolutionRecord[];
  /** Alias accepted for fixture/panel payloads. */
  baseResolutionRecords?: BaseResolutionRecord[];
};

function asRecords(input: ActivityRuntimeRunBaseInput): BaseResolutionRecord[] {
  return input.base_resolutions ?? input.baseResolutionRecords ?? [];
}

function indexById(records: BaseResolutionRecord[]): Map<string, BaseResolutionRecord> {
  const map = new Map<string, BaseResolutionRecord>();
  for (const record of records) {
    if (record?.base_id) map.set(String(record.base_id), record);
  }
  return map;
}

function isFullyResolved(state: Base40ResolutionState): boolean {
  return BASE40_FULL_RESOLUTION_STATES.has(state);
}

export function evaluateBaseResolutionGate(
  activityRuntimeRun: ActivityRuntimeRunBaseInput,
): BaseResolutionGateResult {
  const records = asRecords(activityRuntimeRun);
  const byId = indexById(records);
  const blocking_reasons: string[] = [];
  const unresolved_base_ids: string[] = [];

  let resolved_count = 0;
  let blocked_count = 0;
  let reentry_count = 0;
  let manual_review_count = 0;
  let inferred_unconfirmed_count = 0;
  let skipped_silently_count = 0;
  let ready_with_flag_count = 0;
  let missing_status_count = 0;
  let has_missing_canonical = false;
  let has_missing_provenance = false;
  let has_missing_mmabp_output = false;
  let has_free_text_without_route = false;

  for (const requiredId of BASE40_BASE_IDS) {
    const record = byId.get(requiredId);
    if (!record) {
      missing_status_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`missing_status:${requiredId}`);
      continue;
    }

    const stateRaw = String(record.state ?? "");
    if (!stateRaw || !isBase40AllowedState(stateRaw)) {
      missing_status_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`invalid_or_missing_state:${requiredId}`);
      continue;
    }

    const state = stateRaw as Base40ResolutionState;

    if (state === "skipped_silently") {
      skipped_silently_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`skipped_silently:${requiredId}`);
      continue;
    }

    if (state === "inferred_unconfirmed") {
      inferred_unconfirmed_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`inferred_unconfirmed:${requiredId}`);
    } else if (state === "ready_with_flag") {
      ready_with_flag_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`ready_with_flag:${requiredId}`);
    } else if (state === "reentry_required") {
      reentry_count += 1;
      blocked_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`reentry_required:${requiredId}`);
    } else if (state === "manual_review_required") {
      manual_review_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`manual_review_required:${requiredId}`);
    } else if (state === "blocked_by_missing_evidence") {
      blocked_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`blocked_by_missing_evidence:${requiredId}`);
    } else if (state === "blocked_by_missing_canonical_route") {
      blocked_count += 1;
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`blocked_by_missing_canonical_route:${requiredId}`);
    } else if (isFullyResolved(state)) {
      resolved_count += 1;
    } else if (BASE40_BLOCK_READY_STATES.has(state) || BASE40_BLOCK_READY_FULL_STATES.has(state)) {
      unresolved_base_ids.push(requiredId);
      blocking_reasons.push(`${state}:${requiredId}`);
    }

    // Provenance / canonical / MMABP outputs apply when the base claims resolution.
    if (isFullyResolved(state) || state === "ready_with_flag" || state === "inferred_unconfirmed") {
      if (!record.canonical_variable) {
        has_missing_canonical = true;
        blocking_reasons.push(`missing_canonical_variable:${requiredId}`);
      }
      if (!record.provenance) {
        has_missing_provenance = true;
        blocking_reasons.push(`missing_provenance:${requiredId}`);
      }
      if (!record.mmabp_or_readiness_output) {
        has_missing_mmabp_output = true;
        blocking_reasons.push(`missing_mmabp_or_readiness_output:${requiredId}`);
      }
    }
    if (record.free_text_without_canonical_route === true) {
      has_free_text_without_route = true;
      blocking_reasons.push(`free_text_without_canonical_route:${requiredId}`);
    }
  }

  for (const record of records) {
    if (record.base_id && !isBase40Id(String(record.base_id))) {
      blocking_reasons.push(`unknown_base_id:${record.base_id}`);
    }
  }

  const uniqueReasons = [...new Set(blocking_reasons)];
  const hardBlock =
    skipped_silently_count > 0 ||
    missing_status_count > 0 ||
    blocked_count > 0 ||
    reentry_count > 0 ||
    has_free_text_without_route;

  const softBlockReadyFull =
    inferred_unconfirmed_count > 0 ||
    ready_with_flag_count > 0 ||
    manual_review_count > 0 ||
    has_missing_canonical ||
    has_missing_provenance ||
    has_missing_mmabp_output;

  const passed_for_ready_full =
    resolved_count === 40 &&
    skipped_silently_count === 0 &&
    missing_status_count === 0 &&
    inferred_unconfirmed_count === 0 &&
    ready_with_flag_count === 0 &&
    blocked_count === 0 &&
    reentry_count === 0 &&
    manual_review_count === 0 &&
    !has_missing_canonical &&
    !has_missing_provenance &&
    !has_missing_mmabp_output &&
    !has_free_text_without_route;

  let allowed_next_state: BaseResolutionGateNextState;
  if (passed_for_ready_full) {
    allowed_next_state = "ready";
  } else if (reentry_count > 0) {
    allowed_next_state = "reentry_required";
  } else if (manual_review_count > 0) {
    allowed_next_state = "manual_review_required";
  } else if (hardBlock) {
    allowed_next_state = "blocked";
  } else if (ready_with_flag_count > 0 || softBlockReadyFull) {
    allowed_next_state = "ready_with_flags";
  } else {
    allowed_next_state = "partial_evidence_only";
  }

  return {
    gate: "BaseResolutionGate",
    passed_for_ready_full,
    total_required: 40,
    resolved_count,
    blocked_count,
    reentry_count,
    manual_review_count,
    inferred_unconfirmed_count,
    skipped_silently_count,
    ready_with_flag_count,
    missing_status_count,
    unresolved_base_ids: [...new Set(unresolved_base_ids)],
    blocking_reasons: uniqueReasons,
    allowed_next_state,
    // EvidenceBundle/MDSB require all 40 bases fully resolved — not ready_with_flag / inferred.
    handoff_to_evidence_bundle_mdsb_allowed: passed_for_ready_full,
  };
}
