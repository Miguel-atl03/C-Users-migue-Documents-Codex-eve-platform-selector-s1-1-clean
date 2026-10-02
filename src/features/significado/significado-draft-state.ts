import type {
  ActivityAnchorReadiness,
  SignificadoPriorityTarget,
  SignificadoSubmitPayload,
} from "@/domain/significado-de-trabajo";
import type { WorkMapData } from "@/domain/local-work-map";
import type {
  SignificadoClarityValue,
  SignificadoEnergyValue,
} from "@/domain/significado-de-trabajo";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type { PreRuntimeContextBundle } from "@/domain/pre-runtime-context-bundle.v1.0";
import {
  type ActivityAnchorUnitResponses,
  buildActivityAnchorBundle,
  buildSignificadoSubmitPayload,
  evaluateActivityAnchorReadiness,
  extractTraceableWorkMapActivities,
  resolveSignificadoCaptureMode,
} from "@/services/significado-activity-anchor-adapter";

export type SignificadoUnitDraftResponses = {
  clarity?: SignificadoClarityValue;
  energy?: SignificadoEnergyValue;
  userConfirmed?: boolean;
};

export type SignificadoLocalDraft = {
  sessionId: string;
  perActivity: Record<string, SignificadoUnitDraftResponses>;
  perResponsibility: Record<string, SignificadoUnitDraftResponses>;
  global: {
    priority?: SignificadoPriorityTarget;
    savedWithWarningsAcknowledged?: boolean;
  };
  updatedAt: string;
};

export function createEmptySignificadoDraft(sessionId: string): SignificadoLocalDraft {
  return {
    sessionId,
    perActivity: {},
    perResponsibility: {},
    global: {},
    updatedAt: new Date(0).toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSignificadoClarityValue(value: unknown): value is SignificadoClarityValue {
  return (
    value === "clear" ||
    value === "sometimes_confusing" ||
    value === "hard_to_place"
  );
}

function isSignificadoEnergyValue(value: unknown): value is SignificadoEnergyValue {
  return (
    value === "light" ||
    value === "balanced" ||
    value === "heavy" ||
    value === "very_heavy_today"
  );
}

function isSignificadoPriorityTarget(
  value: unknown,
): value is SignificadoPriorityTarget {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "all_equally") {
    return true;
  }

  return value.type === "responsibility" && typeof value.responsibilityId === "string";
}

function normalizeUnitResponsesRecord(
  value: unknown,
): Record<string, SignificadoUnitDraftResponses> {
  if (!isRecord(value)) {
    return {};
  }

  const normalized: Record<string, SignificadoUnitDraftResponses> = {};
  for (const [unitId, rawResponse] of Object.entries(value)) {
    if (!isRecord(rawResponse)) {
      continue;
    }

    const response: SignificadoUnitDraftResponses = {};
    if (isSignificadoClarityValue(rawResponse.clarity)) {
      response.clarity = rawResponse.clarity;
    }
    if (isSignificadoEnergyValue(rawResponse.energy)) {
      response.energy = rawResponse.energy;
    }
    if (typeof rawResponse.userConfirmed === "boolean") {
      response.userConfirmed = rawResponse.userConfirmed;
    }

    normalized[unitId] = response;
  }

  return normalized;
}

export function normalizeSignificadoDraft(
  value: unknown,
  sessionId: string,
): SignificadoLocalDraft {
  if (!isRecord(value)) {
    return createEmptySignificadoDraft(sessionId);
  }

  const global = isRecord(value.global) ? value.global : {};

  return {
    sessionId,
    perActivity: normalizeUnitResponsesRecord(value.perActivity),
    perResponsibility: normalizeUnitResponsesRecord(value.perResponsibility),
    global: {
      priority: isSignificadoPriorityTarget(global.priority)
        ? global.priority
        : undefined,
      savedWithWarningsAcknowledged:
        typeof global.savedWithWarningsAcknowledged === "boolean"
          ? global.savedWithWarningsAcknowledged
          : undefined,
    },
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date(0).toISOString(),
  };
}

export function withDraftTimestamp(draft: SignificadoLocalDraft): SignificadoLocalDraft {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
}

export function setUnitClarity(
  draft: SignificadoLocalDraft,
  unitId: string,
  captureMode: "per_activity" | "per_responsibility",
  clarity: SignificadoClarityValue,
): SignificadoLocalDraft {
  const responsesKey = captureMode === "per_activity" ? "perActivity" : "perResponsibility";
  const current = draft[responsesKey][unitId] ?? {};

  return withDraftTimestamp({
    ...draft,
    [responsesKey]: {
      ...draft[responsesKey],
      [unitId]: {
        ...current,
        clarity,
      },
    },
  });
}

export function setUnitEnergy(
  draft: SignificadoLocalDraft,
  unitId: string,
  captureMode: "per_activity" | "per_responsibility",
  energy: SignificadoEnergyValue,
): SignificadoLocalDraft {
  const responsesKey = captureMode === "per_activity" ? "perActivity" : "perResponsibility";
  const current = draft[responsesKey][unitId] ?? {};

  return withDraftTimestamp({
    ...draft,
    [responsesKey]: {
      ...draft[responsesKey],
      [unitId]: {
        ...current,
        energy,
      },
    },
  });
}

export function setGlobalPriority(
  draft: SignificadoLocalDraft,
  priority: SignificadoPriorityTarget,
): SignificadoLocalDraft {
  return withDraftTimestamp({
    ...draft,
    global: {
      ...draft.global,
      priority,
    },
  });
}

export function acknowledgeSavedWithWarnings(
  draft: SignificadoLocalDraft,
): SignificadoLocalDraft {
  return withDraftTimestamp({
    ...draft,
    global: {
      ...draft.global,
      savedWithWarningsAcknowledged: true,
    },
  });
}

export function resolveInitialPriority(
  workMap: WorkMapData,
): SignificadoPriorityTarget | undefined {
  const nonEmptyResponsibilities = workMap.responsibilities.filter((responsibility) =>
    responsibility.text.trim(),
  );

  if (nonEmptyResponsibilities.length === 1) {
    return {
      type: "responsibility",
      responsibilityId: nonEmptyResponsibilities[0]!.id,
    };
  }

  return undefined;
}

export function hydrateDraftFromWorkMap(
  draft: SignificadoLocalDraft,
  workMap: WorkMapData,
): SignificadoLocalDraft {
  void workMap;

  // Block 0 visual prefill from WorkMap is handled separately via
  // buildInitialBlock0VisualDraftFromWorkMap in SignificadoDeTuTrabajo.

  return {
    ...draft,
    global: { ...draft.global },
  };
}

export {
  buildInitialBlock0VisualDraftFromWorkMap,
  mergeBlock0InitialVisualDraft,
  type WorkMapBlock0PrefillResult,
  type WorkMapToBlock0PrefillInput,
} from "@/services/workmap-to-block0-prefill";

function toCompleteUnitResponses(
  responses: Record<string, SignificadoUnitDraftResponses>,
): Record<string, ActivityAnchorUnitResponses> {
  const complete: Record<string, ActivityAnchorUnitResponses> = {};

  for (const [unitId, response] of Object.entries(responses)) {
    if (!response.clarity || !response.energy) {
      continue;
    }

    const completeResponse: ActivityAnchorUnitResponses = {
      clarity: response.clarity,
      energy: response.energy,
    };
    if (typeof response.userConfirmed === "boolean") {
      completeResponse.userConfirmed = response.userConfirmed;
    }
    complete[unitId] = completeResponse;
  }

  return complete;
}

export function buildDraftBundle(workMap: WorkMapData, draft: SignificadoLocalDraft) {
  return buildActivityAnchorBundle({
    sessionId: draft.sessionId,
    workMap,
    perActivity: toCompleteUnitResponses(draft.perActivity),
    perResponsibility: toCompleteUnitResponses(draft.perResponsibility),
    global: {
      priority: draft.global.priority,
      savedWithWarningsAcknowledged: draft.global.savedWithWarningsAcknowledged,
    },
  });
}

export function evaluateDraftReadiness(
  workMap: WorkMapData,
  draft: SignificadoLocalDraft,
): ActivityAnchorReadiness {
  const bundle = buildDraftBundle(workMap, draft);
  return evaluateActivityAnchorReadiness(bundle, workMap);
}

export function buildDraftSubmitPayload(
  workMap: WorkMapData,
  draft: SignificadoLocalDraft,
  primaryActivitySelectionResult?: PrimaryActivitySelectionResult,
  preRuntimeContextBundle?: PreRuntimeContextBundle,
): SignificadoSubmitPayload | null {
  const bundle = buildDraftBundle(workMap, draft);

  return buildSignificadoSubmitPayload({
    workMap,
    bundle,
    primaryActivitySelectionResult,
    preRuntimeContextBundle,
  });
}

export function getSignificadoCaptureUnits(workMap: WorkMapData) {
  const traceableActivities = extractTraceableWorkMapActivities(workMap);
  const captureMode = resolveSignificadoCaptureMode(traceableActivities);

  if (captureMode === "per_activity") {
    return {
      captureMode,
      traceableActivities,
      units: traceableActivities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        subtitle: activity.responsibilityText,
        sampleActivities: [],
      })),
    };
  }

  const grouped = new Map<string, typeof traceableActivities>();
  for (const activity of traceableActivities) {
    const existing = grouped.get(activity.responsibilityId) ?? [];
    existing.push(activity);
    grouped.set(activity.responsibilityId, existing);
  }

  return {
    captureMode,
    traceableActivities,
    units: [...grouped.entries()].map(([responsibilityId, activities]) => ({
      id: responsibilityId,
      title: activities[0]?.responsibilityText ?? "",
      subtitle: `${activities.length} actividades`,
      sampleActivities: activities.slice(0, 3).map((activity) => activity.title),
    })),
  };
}
