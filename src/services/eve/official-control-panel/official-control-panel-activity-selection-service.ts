import type { OfficialControlPanelActivitySelectionRepository } from "./official-control-panel-activity-selection-repository";
import type {
  ActivitySelectionCoverageView,
  ActivitySelectionItemView,
  ActivitySelectionResultItemRecord,
  ActivitySelectionResultRecord,
} from "./official-control-panel-activity-selection.types";
import {
  ACTIVITY_SELECTION_EMPTY_MESSAGE,
  ACTIVITY_SELECTION_ERROR_MESSAGE,
  ACTIVITY_SELECTION_PARTIAL_MESSAGE,
  SELECTION_MODE_LABELS,
  toUiSelectionMode,
} from "./official-control-panel-activity-selection.types";

export async function buildActivitySelectionCoverageView(
  repository: OfficialControlPanelActivitySelectionRepository,
  input: {
    caseId: string;
    participantId: string;
    profileId: string;
    roleRuntimeSessionId: string;
  },
): Promise<ActivitySelectionCoverageView> {
  try {
    const effectiveCount = await repository.countEffectiveBySession(
      input.roleRuntimeSessionId,
    );
    if (effectiveCount > 1) {
      return partialView(
        "Inconsistencia: más de un resultado efectivo para la sesión.",
      );
    }

    const header = await repository.findEffectiveBySession(
      input.roleRuntimeSessionId,
    );
    if (!header) {
      return unavailableView(ACTIVITY_SELECTION_EMPTY_MESSAGE);
    }

    if (
      header.caseId !== input.caseId ||
      header.participantId !== input.participantId ||
      header.profileId !== input.profileId
    ) {
      return unavailableView(ACTIVITY_SELECTION_ERROR_MESSAGE);
    }

    const items = await repository.listItemsByResultId(header.id);
    return assembleCoverage(header, items);
  } catch {
    return unavailableView(ACTIVITY_SELECTION_ERROR_MESSAGE);
  }
}

function assembleCoverage(
  header: ActivitySelectionResultRecord,
  items: ActivitySelectionResultItemRecord[],
): ActivitySelectionCoverageView {
  const primaryActivities: ActivitySelectionItemView[] = [];
  const nonPrimaryActivities: ActivitySelectionItemView[] = [];
  const pendingActivities: ActivitySelectionItemView[] = [];

  for (const item of items) {
    const view = toItemView(item);
    if (item.classification === "primary") primaryActivities.push(view);
    else if (item.classification === "non_primary") {
      nonPrimaryActivities.push(view);
    } else if (item.classification === "pending") {
      pendingActivities.push(view);
    }
  }

  primaryActivities.sort(
    (a, b) => (a.selectedSlot ?? 99) - (b.selectedSlot ?? 99),
  );

  let partial = false;
  if (primaryActivities.length !== header.selectedCount) partial = true;
  if (nonPrimaryActivities.length !== header.nonPrimaryContextCount) {
    partial = true;
  }
  if (!header.policyVersion) partial = true;
  if (!header.sourceSnapshotHash || !header.sourceSnapshotReference) {
    partial = true;
  }
  if (header.traceCompletenessStatus !== "complete") partial = true;

  const gapLabel =
    header.workmapCoverageGap == null
      ? "No disponible"
      : header.workmapCoverageGap
        ? "Sí"
        : "No";
  if (header.workmapCoverageGap == null) partial = true;

  const uiMode = toUiSelectionMode(header.selectionMode);

  return {
    resultId: header.id,
    resultVersion: header.resultVersion,
    policyVersion: header.policyVersion,
    selectionMode: uiMode,
    selectionModeLabel:
      uiMode === "unavailable" ? null : SELECTION_MODE_LABELS[uiMode],
    eligibleCount: header.eligibleCount,
    selectedCount: header.selectedCount,
    nonPrimaryContextCount: header.nonPrimaryContextCount,
    workmapCoverageGap: header.workmapCoverageGap,
    workmapCoverageGapLabel: gapLabel,
    promotionConditionLabel: header.promotionConditionCode,
    primaryActivities,
    nonPrimaryActivities,
    pendingActivities,
    dataStatus: partial ? "partial" : "available",
    message: partial ? ACTIVITY_SELECTION_PARTIAL_MESSAGE : null,
    conformance: conformanceFromHeader(header),
  };
}

function toItemView(
  item: ActivitySelectionResultItemRecord,
): ActivitySelectionItemView {
  return {
    activityId: item.activityId,
    label: item.displayLabel,
    classification:
      item.classification === "primary"
        ? "primary"
        : item.classification === "non_primary"
          ? "non-primary"
          : item.classification === "pending"
            ? "pending"
            : "unavailable",
    selectedSlot: item.selectedSlot,
    selectionReasonLabel: item.selectionReasonText
      ? item.selectionReasonText
      : item.selectionReasonCode
        ? humanizeReason(item.selectionReasonCode)
        : null,
    promotionConditionLabel: item.promotionConditionCode,
    eligibilityStatus: item.eligibilityStatus,
    selectionStatus: item.selectionStatus,
    selectionReasonText: item.selectionReasonText,
    nonPrimaryContextStatus: item.nonPrimaryContextStatus,
    runtimeHandoffPriority: item.runtimeHandoffPriority,
    manualReviewRequired: item.manualReviewRequired,
    score: item.score,
    traceFlags: item.traceFlags,
    ruleRefs: item.ruleRefs,
  };
}

function humanizeReason(code: string): string {
  return code.replace(/_/g, " ");
}

function unavailableView(message: string): ActivitySelectionCoverageView {
  return {
    resultId: null,
    resultVersion: null,
    policyVersion: null,
    selectionMode: "unavailable",
    selectionModeLabel: null,
    eligibleCount: null,
    selectedCount: null,
    nonPrimaryContextCount: null,
    workmapCoverageGap: null,
    workmapCoverageGapLabel: null,
    promotionConditionLabel: null,
    primaryActivities: [],
    nonPrimaryActivities: [],
    pendingActivities: [],
    dataStatus: "unavailable",
    message,
    conformance: emptyConformance(),
  };
}

function partialView(detail: string): ActivitySelectionCoverageView {
  return {
    ...unavailableView(`${ACTIVITY_SELECTION_PARTIAL_MESSAGE} ${detail}`.trim()),
    dataStatus: "partial",
  };
}

function conformanceFromHeader(header: ActivitySelectionResultRecord) {
  return {
    policyManifestHash: header.policyManifestHash,
    selectorCodeVersion: header.selectorCodeVersion,
    selectionResultHash: header.selectionResultHash,
    traceCompletenessStatus: header.traceCompletenessStatus,
    replayStatus: header.replayStatus,
  };
}

function emptyConformance() {
  return {
    policyManifestHash: null,
    selectorCodeVersion: null,
    selectionResultHash: null,
    traceCompletenessStatus: null,
    replayStatus: null,
  };
}
