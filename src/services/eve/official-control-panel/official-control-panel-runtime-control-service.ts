/**
 * §12 Entrega C — lectura agregada de control Runtime (Panel read-only).
 * Readiness solo desde snapshot effective. Gaps/timers/reentry/review desde P3 por run_id.
 */

import type { OfficialControlPanelRuntimeMatrixRepository } from "./official-control-panel-runtime-matrix.types";
import type {
  RuntimeControlSnapshotRecord,
  RuntimeControlStateView,
  RuntimeGapSummary,
  RuntimeManualReviewSummary,
  RuntimeReentrySummary,
  RuntimeTimerSummary,
} from "./official-control-panel-runtime-control.types";
import {
  RUNTIME_CONTROL_NO_RUN_MESSAGE,
  RUNTIME_CONTROL_NO_SNAPSHOT_MESSAGE,
  RUNTIME_CONTROL_PARTIAL_MESSAGE,
  mapSnapshotReadinessToView,
} from "./official-control-panel-runtime-control.types";
import { attachMissingCanonicalRouteProjection } from "./official-control-panel-missing-canonical-route";

export type OfficialControlPanelRuntimeControlRepository = {
  findEffectiveControlSnapshot(
    runId: string,
  ): Promise<RuntimeControlSnapshotRecord | null>;
  listReadinessGapsByRun(runId: string): Promise<RuntimeGapSummary[]>;
  listProcessStateTimersByRun(runId: string): Promise<RuntimeTimerSummary[]>;
  listReentriesByRun(runId: string): Promise<RuntimeReentrySummary[]>;
  listManualReviewsByRun(runId: string): Promise<RuntimeManualReviewSummary[]>;
};

export type RuntimeControlScopeRepository =
  OfficialControlPanelRuntimeMatrixRepository &
    Partial<OfficialControlPanelRuntimeControlRepository>;

function withEmptyCanonicalProjection(
  view: Omit<
    RuntimeControlStateView,
    "canonicalBlockCodes" | "missingCanonicalRouteBlocks"
  >,
): RuntimeControlStateView {
  return {
    ...view,
    canonicalBlockCodes: [],
    missingCanonicalRouteBlocks: [],
  };
}

export function buildUnavailableRuntimeControlState(
  message: string = RUNTIME_CONTROL_NO_RUN_MESSAGE,
): RuntimeControlStateView {
  return withEmptyCanonicalProjection({
    readiness: {
      state: "not-evaluable",
      restrictedScopes: [],
      sourceVersion: null,
      message,
    },
    gaps: [],
    timers: [],
    reentries: [],
    manualReviews: [],
    blockingBaseIds: [],
    blockingCausalIds: [],
    dataStatus: "unavailable",
  });
}

export async function buildRuntimeControlStateView(
  repository: RuntimeControlScopeRepository,
  input: { runId: string | null; activityId?: string | null },
): Promise<RuntimeControlStateView> {
  if (!input.runId) {
    return buildUnavailableRuntimeControlState(RUNTIME_CONTROL_NO_RUN_MESSAGE);
  }

  const run = await repository.findRunById(input.runId);
  if (!run) {
    return buildUnavailableRuntimeControlState(RUNTIME_CONTROL_NO_RUN_MESSAGE);
  }

  if (
    !repository.findEffectiveControlSnapshot ||
    !repository.listReadinessGapsByRun ||
    !repository.listProcessStateTimersByRun ||
    !repository.listReentriesByRun ||
    !repository.listManualReviewsByRun
  ) {
    return withEmptyCanonicalProjection({
      ...buildUnavailableRuntimeControlState(RUNTIME_CONTROL_NO_SNAPSHOT_MESSAGE),
      dataStatus: "not_evaluated",
    });
  }

  const [snapshot, gaps, timers, reentries, manualReviews] = await Promise.all([
    repository.findEffectiveControlSnapshot(input.runId),
    repository.listReadinessGapsByRun(input.runId),
    repository.listProcessStateTimersByRun(input.runId),
    repository.listReentriesByRun(input.runId),
    repository.listManualReviewsByRun(input.runId),
  ]);

  if (!snapshot) {
    const hasAnyControlRow =
      gaps.length > 0 ||
      timers.length > 0 ||
      reentries.length > 0 ||
      manualReviews.length > 0;
    const base = withEmptyCanonicalProjection({
      readiness: {
        state: "not-evaluable",
        restrictedScopes: [],
        sourceVersion: null,
        message: RUNTIME_CONTROL_NO_SNAPSHOT_MESSAGE,
      },
      gaps,
      timers,
      reentries,
      manualReviews,
      blockingBaseIds: [],
      blockingCausalIds: [],
      dataStatus: hasAnyControlRow ? "partial" : "not_evaluated",
    });
    return attachMissingCanonicalRouteProjection(base, {
      runId: input.runId,
      activityId: input.activityId ?? run.activityId ?? null,
    });
  }

  const readinessState = mapSnapshotReadinessToView(snapshot.readinessState);
  const partial =
    snapshot.sourceStateHash == null ||
    snapshot.sourceStateHash.trim() === "";

  const base = withEmptyCanonicalProjection({
    readiness: {
      state: readinessState,
      restrictedScopes: snapshot.restrictedScopes ?? [],
      sourceVersion: snapshot.snapshotVersion,
      message: partial ? RUNTIME_CONTROL_PARTIAL_MESSAGE : null,
    },
    gaps,
    timers,
    reentries,
    manualReviews,
    blockingBaseIds: snapshot.blockingBaseIds ?? [],
    blockingCausalIds: snapshot.blockingCausalIds ?? [],
    dataStatus: partial ? "partial" : "available",
  });

  return attachMissingCanonicalRouteProjection(base, {
    runId: input.runId,
    activityId: input.activityId ?? run.activityId ?? null,
  });
}

export function mapGapRow(row: Record<string, unknown>): RuntimeGapSummary {
  const status = typeof row.status === "string" ? row.status : null;
  const resolved =
    status === "resolved" ||
    status === "closed" ||
    status === "completed";
  const active =
    status === "open" ||
    status === "active" ||
    status === "opened" ||
    status === "pending";

  let operationalStatus: RuntimeGapSummary["operationalStatus"] = "unavailable";
  if (resolved) operationalStatus = "resolved";
  else if (active) operationalStatus = "active";
  else if (status) operationalStatus = "active";

  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    gapId: String(row.id),
    gapCode: typeof row.gap_type === "string" ? row.gap_type : null,
    sourceInteractionId:
      typeof row.affected_route === "string"
        ? row.affected_route
        : typeof metadata.source_interaction_id === "string"
          ? metadata.source_interaction_id
          : null,
    status,
    operationalStatus,
    severity: typeof row.severity === "string" ? row.severity : null,
    openedAt: typeof row.created_at === "string" ? row.created_at : null,
    resolvedAt:
      typeof metadata.resolved_at === "string"
        ? metadata.resolved_at
        : resolved && typeof row.updated_at === "string"
          ? row.updated_at
          : null,
    resolutionReference:
      typeof metadata.resolution_reference === "string"
        ? metadata.resolution_reference
        : null,
  };
}

export function mapTimerRow(
  row: Record<string, unknown>,
  nowMs: number = Date.now(),
): RuntimeTimerSummary {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  const dueAt =
    typeof metadata.due_at === "string"
      ? metadata.due_at
      : typeof row.due_at === "string"
        ? row.due_at
        : null;
  const releasedAt =
    typeof metadata.released_at === "string"
      ? metadata.released_at
      : typeof row.released_at === "string"
        ? row.released_at
        : null;
  const timeoutState =
    typeof row.timeout_state === "string" ? row.timeout_state : null;

  let operationalStatus: RuntimeTimerSummary["operationalStatus"] = "unavailable";
  if (releasedAt || timeoutState === "released" || timeoutState === "cleared") {
    operationalStatus = "released";
  } else if (dueAt) {
    const dueMs = Date.parse(dueAt);
    if (Number.isFinite(dueMs)) {
      operationalStatus = dueMs < nowMs ? "overdue" : "upcoming";
    } else {
      operationalStatus = "unavailable";
    }
  } else if (
    timeoutState === "active" ||
    timeoutState === "waiting" ||
    timeoutState === "armed"
  ) {
    operationalStatus = "active";
  } else if (timeoutState === "overdue" || timeoutState === "expired") {
    // Only accept overdue from persisted timeout_state when due_at is absent —
    // do not invent due_at; operational overdue requires comparable clock when due_at exists.
    operationalStatus = "unavailable";
  }

  return {
    timerEventId: String(row.id),
    sourceInteractionId:
      typeof metadata.source_interaction_id === "string"
        ? metadata.source_interaction_id
        : typeof row.gate_id === "string"
          ? row.gate_id
          : null,
    expectedEvent:
      typeof row.awaited_event === "string" ? row.awaited_event : null,
    dueAt,
    status: timeoutState,
    operationalStatus,
    releasedAt,
    releaseCondition:
      typeof row.release_condition === "string" ? row.release_condition : null,
  };
}

export function mapDecisionToReentry(
  row: Record<string, unknown>,
): RuntimeReentrySummary | null {
  const target =
    typeof row.reentry_target === "string" ? row.reentry_target.trim() : "";
  if (!target) return null;
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  return {
    id: String(row.id),
    sourceInteractionId:
      typeof metadata.source_interaction_id === "string"
        ? metadata.source_interaction_id
        : typeof row.dominant_gate === "string"
          ? row.dominant_gate
          : null,
    targetBlock: target,
    reason: typeof row.reason === "string" ? row.reason : null,
    status: typeof row.readiness_state === "string" ? row.readiness_state : null,
    openedAt: typeof row.created_at === "string" ? row.created_at : null,
    resolvedAt:
      typeof metadata.resolved_at === "string" ? metadata.resolved_at : null,
  };
}

export function mapDecisionToManualReview(
  row: Record<string, unknown>,
): RuntimeManualReviewSummary | null {
  if (row.manual_review_required !== true && row.manual_review_flag !== true) {
    return null;
  }
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  return {
    id: String(row.id),
    sourceInteractionId:
      typeof metadata.source_interaction_id === "string"
        ? metadata.source_interaction_id
        : null,
    reviewReason: typeof row.reason === "string" ? row.reason : null,
    reviewStatus:
      typeof row.readiness_state === "string"
        ? row.readiness_state
        : typeof row.status === "string"
          ? row.status
          : null,
    assignedTo:
      typeof metadata.assigned_to === "string" ? metadata.assigned_to : null,
    openedAt: typeof row.created_at === "string" ? row.created_at : null,
    resolvedAt:
      typeof metadata.resolved_at === "string" ? metadata.resolved_at : null,
  };
}
