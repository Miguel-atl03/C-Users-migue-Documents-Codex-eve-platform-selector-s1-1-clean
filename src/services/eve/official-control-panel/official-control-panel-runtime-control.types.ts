/**
 * §12 Entrega C — Estado de control Runtime (solo lectura del Panel).
 * Readiness y agregados provienen del snapshot effective; gaps/timers/reentry/review
 * de tablas P3 vinculadas por run_id. El Panel no calcula ni publica.
 */

import type { RuntimeMatrixDataStatus } from "./official-control-panel-runtime-matrix.types";

export type RuntimeReadinessState =
  | "ready"
  | "ready-with-restrictions"
  | "blocked"
  | "not-evaluable";

export type RuntimeGapOperationalStatus =
  | "active"
  | "resolved"
  | "unavailable";

export type RuntimeTimerOperationalStatus =
  | "active"
  | "upcoming"
  | "overdue"
  | "released"
  | "unavailable";

export type RuntimeGapSummary = {
  gapId: string;
  gapCode: string | null;
  sourceInteractionId: string | null;
  status: string | null;
  operationalStatus: RuntimeGapOperationalStatus;
  severity: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
  resolutionReference: string | null;
};

export type RuntimeTimerSummary = {
  timerEventId: string;
  sourceInteractionId: string | null;
  expectedEvent: string | null;
  dueAt: string | null;
  status: string | null;
  operationalStatus: RuntimeTimerOperationalStatus;
  releasedAt: string | null;
  releaseCondition: string | null;
};

export type RuntimeReentrySummary = {
  id: string;
  sourceInteractionId: string | null;
  targetBlock: string | null;
  reason: string | null;
  status: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
};

export type RuntimeManualReviewSummary = {
  id: string;
  sourceInteractionId: string | null;
  reviewReason: string | null;
  reviewStatus: string | null;
  assignedTo: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
};

export type RuntimeControlSnapshotRecord = {
  id: string;
  runId: string;
  snapshotVersion: number;
  lifecycleState: string;
  readinessState: string;
  activeGapCount: number;
  blockingGapCount: number;
  activeTimerCount: number;
  overdueTimerCount: number;
  reentryRequired: boolean;
  manualReviewRequired: boolean;
  blockingBaseIds: string[];
  blockingCausalIds: string[];
  restrictedScopes: string[];
  sourceStateHash: string | null;
  effectiveAt: string | null;
};

export type MissingCanonicalRouteBlockView = {
  causalCode: string | null;
  activityId: string | null;
  runId: string | null;
  blockCode: "blocked_by_missing_canonical_route";
  relatedFlags: string[];
  factualReason: string;
  readinessState: RuntimeReadinessState;
  readinessBlocked: boolean;
  reentryTarget: string | null;
  reviewDestination: string | null;
  gapId: string | null;
  failureBlockRule: string | null;
};

export type RuntimeControlStateView = {
  readiness: {
    state: RuntimeReadinessState;
    restrictedScopes: string[];
    sourceVersion: number | null;
    message: string | null;
  };
  gaps: RuntimeGapSummary[];
  timers: RuntimeTimerSummary[];
  reentries: RuntimeReentrySummary[];
  manualReviews: RuntimeManualReviewSummary[];
  blockingBaseIds: string[];
  blockingCausalIds: string[];
  /**
   * Literal canonical block codes projected from catalog + gap/decision facts
   * (e.g. blocked_by_missing_canonical_route). Not a new readiness_state.
   */
  canonicalBlockCodes: string[];
  missingCanonicalRouteBlocks: MissingCanonicalRouteBlockView[];
  dataStatus: RuntimeMatrixDataStatus;
};

export const RUNTIME_CONTROL_NO_RUN_MESSAGE =
  "No existe una ejecución Runtime para esta actividad.";

export const RUNTIME_CONTROL_NO_SNAPSHOT_MESSAGE =
  "No existe una evaluación de control publicada para esta ejecución.";

export const RUNTIME_CONTROL_PARTIAL_MESSAGE =
  "La evaluación de control está incompleta.";

export function presentRuntimeAdvanceLabel(
  state: RuntimeReadinessState,
): string {
  switch (state) {
    case "ready":
      return "Puede avanzar";
    case "ready-with-restrictions":
      return "Puede avanzar con restricciones";
    case "blocked":
      return "Bloqueado";
    case "not-evaluable":
    default:
      return "No evaluable";
  }
}

export function mapSnapshotReadinessToView(
  raw: string | null | undefined,
): RuntimeReadinessState {
  switch (raw) {
    case "ready":
      return "ready";
    case "ready_with_restrictions":
      return "ready-with-restrictions";
    case "blocked":
      return "blocked";
    case "not_evaluable":
    default:
      return "not-evaluable";
  }
}
