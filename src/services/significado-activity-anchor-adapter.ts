import {
  buildDeclaredAreaContext,
  getActivityText,
  type WorkMapData,
} from "@/domain/local-work-map";
import type {
  ActivityAnchorBundle,
  ActivityAnchorDraft,
  ActivityAnchorGap,
  ActivityAnchorProvenance,
  ActivityAnchorReadiness,
  ActivityAnchorUnitKey,
  SignificadoCaptureMode,
  SignificadoClarityValue,
  SignificadoEnergyValue,
  SignificadoPriorityTarget,
  SignificadoSubmitPayload,
  SignificadoWorkMapRef,
  TraceableWorkMapActivity,
} from "@/domain/significado-de-trabajo";
import {
  SIGNIFICADO_DATA_VERSION,
  SIGNIFICADO_PER_ACTIVITY_THRESHOLD,
} from "@/domain/significado-de-trabajo";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type { PreRuntimeContextBundle } from "@/domain/pre-runtime-context-bundle.v1.0";
import { selectPrimaryActivitiesFromWorkMap } from "@/services/primary-activity-selector";

export type TraceableActivitySelectionCriteria =
  | { kind: "explicit"; activityId: string }
  | { kind: "priority"; priority: SignificadoPriorityTarget }
  | { kind: "first" };

export type ActivityAnchorUnitResponses = {
  clarity: SignificadoClarityValue;
  energy: SignificadoEnergyValue;
  userConfirmed?: boolean;
};

export type BuildActivityAnchorBundleInput = {
  sessionId: string;
  workMap: WorkMapData;
  perActivity?: Record<string, ActivityAnchorUnitResponses>;
  perResponsibility?: Record<string, ActivityAnchorUnitResponses>;
  global: {
    priority?: SignificadoPriorityTarget;
    savedWithWarningsAcknowledged?: boolean;
  };
  /** @deprecated R2.2 keeps this only for compatibility fixtures, not user selection. */
  selectedPrimaryActivityId?: string;
  capturedAt?: string;
};

/**
 * Extracts non-empty WorkMap activities with stable `act-*` ids.
 * Does not call flattenWorkMapToActivities — avoids ephemeral `wm-*` ids (R0 audit).
 */
export function extractTraceableWorkMapActivities(
  workMap: WorkMapData,
): TraceableWorkMapActivity[] {
  const declaredAreaContext = buildDeclaredAreaContext(workMap);
  const traceable: TraceableWorkMapActivity[] = [];

  workMap.responsibilities.forEach((responsibility, responsibilityIndex) => {
    const declaredResponsibilityContext = responsibility.text.trim();

    responsibility.activities.forEach((activity, activityIndex) => {
      const title = getActivityText(activity).trim();
      if (!title) {
        return;
      }

      traceable.push({
        id: activity.id,
        title,
        narrativeAnchor: title,
        responsibilityId: responsibility.id,
        responsibilityText: declaredResponsibilityContext,
        responsibilityIndex,
        activityIndex,
        declaredContext: {
          declared_area_context: declaredAreaContext,
          declared_responsibility_context: declaredResponsibilityContext,
          responsibility_id: responsibility.id,
          area_status: "declared_unconfirmed",
          responsibility_status: "declared_unconfirmed",
        },
        provenance: {
          source: "work_map",
          workMapActivityId: activity.id,
          responsibilityId: responsibility.id,
          responsibilityIndex,
          activityIndex,
          declaredAreaContext,
          declaredResponsibilityContext,
        },
      });
    });
  });

  return traceable;
}

export function resolveSignificadoCaptureMode(
  traceableActivities: TraceableWorkMapActivity[],
): SignificadoCaptureMode {
  return traceableActivities.length <= SIGNIFICADO_PER_ACTIVITY_THRESHOLD
    ? "per_activity"
    : "per_responsibility";
}

export function selectTraceableActivity(
  traceableActivities: TraceableWorkMapActivity[],
  criteria: TraceableActivitySelectionCriteria = { kind: "first" },
): TraceableWorkMapActivity | null {
  if (traceableActivities.length === 0) {
    return null;
  }

  if (criteria.kind === "explicit") {
    return (
      traceableActivities.find((activity) => activity.id === criteria.activityId) ??
      null
    );
  }

  if (criteria.kind === "priority") {
    const priority = criteria.priority;
    if (priority.type === "responsibility") {
      return (
        traceableActivities.find(
          (activity) => activity.responsibilityId === priority.responsibilityId,
        ) ?? null
      );
    }
  }

  return traceableActivities[0] ?? null;
}

export function buildActivityAnchorDraft(
  unitKey: ActivityAnchorUnitKey,
  responses: ActivityAnchorUnitResponses,
  provenance: ActivityAnchorProvenance | ActivityAnchorProvenance[],
): ActivityAnchorDraft {
  return {
    unitKey,
    clarity: responses.clarity,
    energy: responses.energy,
    userConfirmed: responses.userConfirmed ?? false,
    provenance,
  };
}

function groupActivitiesByResponsibility(
  traceableActivities: TraceableWorkMapActivity[],
): Map<string, TraceableWorkMapActivity[]> {
  const grouped = new Map<string, TraceableWorkMapActivity[]>();

  for (const activity of traceableActivities) {
    const existing = grouped.get(activity.responsibilityId) ?? [];
    existing.push(activity);
    grouped.set(activity.responsibilityId, existing);
  }

  return grouped;
}

function buildWorkMapRef(workMap: WorkMapData, traceableCount: number): SignificadoWorkMapRef {
  return {
    isSaved: true,
    savedWithWarnings: workMap.savedWithWarnings,
    areaLabels: [...workMap.selectedAreas, ...workMap.customAreas]
      .map((area) => area.trim())
      .filter(Boolean),
    activityCount: traceableCount,
    responsibilityCount: workMap.responsibilities.filter((responsibility) =>
      responsibility.text.trim(),
    ).length,
  };
}

function buildPerActivityAnchors(
  traceableActivities: TraceableWorkMapActivity[],
  perActivity: Record<string, ActivityAnchorUnitResponses>,
): ActivityAnchorDraft[] {
  return traceableActivities.map((activity) => {
    const responses = perActivity[activity.id];
    return {
      unitKey: { scope: "activity", activityId: activity.id },
      clarity: responses?.clarity,
      energy: responses?.energy,
      userConfirmed: responses?.userConfirmed ?? false,
      provenance: activity.provenance,
    };
  });
}

function buildPerResponsibilityAnchors(
  traceableActivities: TraceableWorkMapActivity[],
  perResponsibility: Record<string, ActivityAnchorUnitResponses>,
): ActivityAnchorDraft[] {
  const grouped = groupActivitiesByResponsibility(traceableActivities);

  return [...grouped.entries()].map(([responsibilityId, activities]) => {
    const responses = perResponsibility[responsibilityId];
    return {
      unitKey: { scope: "responsibility", responsibilityId },
      clarity: responses?.clarity,
      energy: responses?.energy,
      userConfirmed: responses?.userConfirmed ?? false,
      provenance: activities.map((activity) => activity.provenance),
    };
  });
}

export function buildActivityAnchorBundle(
  input: BuildActivityAnchorBundleInput,
): ActivityAnchorBundle {
  const traceableActivities = extractTraceableWorkMapActivities(input.workMap);
  const captureMode = resolveSignificadoCaptureMode(traceableActivities);

  const anchors =
    captureMode === "per_activity"
      ? buildPerActivityAnchors(traceableActivities, input.perActivity ?? {})
      : buildPerResponsibilityAnchors(
          traceableActivities,
          input.perResponsibility ?? {},
        );

  return {
    version: SIGNIFICADO_DATA_VERSION,
    sessionId: input.sessionId,
    capturedAt: input.capturedAt ?? new Date(0).toISOString(),
    selectionGovernance: "eve_policy_required",
    primaryActivitySelectionPolicy: "not_implemented_in_r2_2",
    userPriorityDoesNotSelectRuntimeActivities: true,
    captureMode,
    workMapRef: buildWorkMapRef(input.workMap, traceableActivities.length),
    global: {
      savedWithWarningsAcknowledged: input.global.savedWithWarningsAcknowledged,
    },
    anchors,
    selectedPrimaryActivityId: input.selectedPrimaryActivityId ?? "",
  };
}

function unitKeyEquals(
  left: ActivityAnchorUnitKey | undefined,
  right: ActivityAnchorUnitKey,
): boolean {
  if (!left) {
    return false;
  }

  if (left.scope !== right.scope) {
    return false;
  }

  if (left.scope === "activity") {
    return right.scope === "activity" && left.activityId === right.activityId;
  }

  return (
    right.scope === "responsibility" &&
    left.responsibilityId === right.responsibilityId
  );
}

function expectedUnitKeys(
  captureMode: SignificadoCaptureMode,
  traceableActivities: TraceableWorkMapActivity[],
): ActivityAnchorUnitKey[] {
  if (captureMode === "per_activity") {
    return traceableActivities.map((activity) => ({
      scope: "activity",
      activityId: activity.id,
    }));
  }

  const responsibilityIds = new Set<string>();
  for (const activity of traceableActivities) {
    responsibilityIds.add(activity.responsibilityId);
  }

  return [...responsibilityIds].map((responsibilityId) => ({
    scope: "responsibility",
    responsibilityId,
  }));
}

export function evaluateActivityAnchorReadiness(
  bundle: ActivityAnchorBundle,
  workMap: WorkMapData,
): ActivityAnchorReadiness {
  const gaps: ActivityAnchorGap[] = [];
  const traceableActivities = extractTraceableWorkMapActivities(workMap);
  const expectedKeys = expectedUnitKeys(bundle.captureMode, traceableActivities);

  if (!workMap.isSaved) {
    gaps.push({
      code: "work_map_not_saved",
      severity: "blocking",
      message: "El mapa de trabajo debe guardarse antes de continuar.",
    });
  }

  if (traceableActivities.length === 0) {
    gaps.push({
      code: "no_traceable_activities",
      severity: "blocking",
      message: "No hay actividades con texto en el mapa de trabajo.",
    });
  }

  if (
    workMap.savedWithWarnings &&
    bundle.global.savedWithWarningsAcknowledged !== true
  ) {
    gaps.push({
      code: "saved_with_warnings_not_acknowledged",
      severity: "blocking",
      message: "Debes confirmar que viste el aviso sobre el mapa incompleto.",
    });
  }

  for (const expectedKey of expectedKeys) {
    const anchor = bundle.anchors.find((item) =>
      unitKeyEquals(item.unitKey, expectedKey),
    );

    if (!anchor) {
      gaps.push({
        code: "unknown_unit_key",
        severity: "blocking",
        message: "Falta captura para una unidad del mapa.",
        unitKey: expectedKey,
      });
      continue;
    }

  }

  if (
    bundle.selectedPrimaryActivityId &&
    !traceableActivities.some(
      (activity) => activity.id === bundle.selectedPrimaryActivityId,
    )
  ) {
    gaps.push({
      code: "selected_activity_not_found",
      severity: "blocking",
      message: "La actividad principal seleccionada no existe en el mapa.",
    });
  }

  const hasBlocking = gaps.some((gap) => gap.severity === "blocking");
  const status: ActivityAnchorReadiness["status"] = hasBlocking
    ? traceableActivities.length === 0 || !workMap.isSaved
      ? "blocked"
      : "incomplete"
    : "ready";

  return {
    status,
    gaps,
    captureMode: bundle.captureMode,
    canSubmit: !hasBlocking,
  };
}

export function buildSignificadoSubmitPayload(input: {
  workMap: WorkMapData;
  bundle: ActivityAnchorBundle;
  primaryActivitySelectionResult?: PrimaryActivitySelectionResult;
  preRuntimeContextBundle?: PreRuntimeContextBundle;
  submittedAt?: string;
}): SignificadoSubmitPayload | null {
  const traceableActivities = extractTraceableWorkMapActivities(input.workMap);
  const readiness = evaluateActivityAnchorReadiness(input.bundle, input.workMap);

  if (!readiness.canSubmit) {
    return null;
  }

  const primaryActivity = selectTraceableActivity(traceableActivities, {
    kind: "first",
  });

  if (!primaryActivity) {
    return null;
  }

  return {
    version: SIGNIFICADO_DATA_VERSION,
    sessionId: input.bundle.sessionId,
    submittedAt: input.submittedAt ?? new Date(0).toISOString(),
    selectionGovernance: "eve_policy",
    primaryActivitySelectionPolicy: "PRIMARY_ACTIVITY_SELECTION_V1_3",
    userPriorityDoesNotSelectRuntimeActivities: true,
    primaryActivitySelectionResolvedByUser: false,
    primaryActivitySelectionResult:
      input.primaryActivitySelectionResult ??
      selectPrimaryActivitiesFromWorkMap(input.workMap),
    captureMode: input.bundle.captureMode,
    workMapSnapshot: input.workMap,
    bundle: input.bundle,
    primaryActivity,
    traceableActivities,
    readiness,
    diagnosticsEnabled: false,
    exportEnabled: false,
    transductionEnabled: false,
    preRuntimeContextBundle: input.preRuntimeContextBundle,
  };
}

export type { ActivityAnchorProvenance };
