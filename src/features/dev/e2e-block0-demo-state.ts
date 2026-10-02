import type {
  PrimaryActivitySelectionResult,
  SelectedPrimaryActivity,
} from "@/domain/primary-activity-selection-policy";
import type { PreRuntimeContextBundle } from "@/domain/pre-runtime-context-bundle.v1.0";
import { PRIMARY_ACTIVITY_SELECTION_VERSION } from "@/domain/primary-activity-selection-policy";
import type { WorkMapData } from "@/domain/local-work-map";
import type { StartPositionContext } from "@/domain/start-position-context";
import {
  countFilledWorkMapActivities,
  countWorkMapResponsibilities,
  createE2eDemoStartPositionContext,
  E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT,
  E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT,
  isE2eFinancialFixtureWorkMap,
  isWorkMapStructurallyEqualToFinancialFixture,
  listE2eFinancialFixtureActivityLiterals,
  listWorkMapSelectedAreas,
  workMapSelectedAreasMatch,
} from "@/features/dev/e2e-block0-demo-fixture";
import { buildBlock0AnswerKey } from "@/features/significado/runtime-block0-canonical";
import { buildInitialBlock0VisualDraftFromWorkMap } from "@/services/workmap-to-block0-prefill";
import { buildPreRuntimeContextBundle } from "@/services/pre-runtime-context-bundle-builder";

export type E2eBlock0DemoPhase = "login" | "estado_a" | "work_map" | "significado";

export type E2eBlock0WorkMapSourceMode =
  | "manual"
  | "loaded_financial_example"
  | "manual_modified_from_example";

export type E2eBlock0Block0Progress = {
  prepared: number;
  total: number;
  canContinue: boolean;
};

export type E2eFlattenedWorkMapActivity = {
  flattenedIndex: number;
  responsibilityIndex: number;
  activityIndexWithinResponsibility: number;
  activityId: string;
  activityTitle: string;
  responsibilityTitle: string;
  responsibilityId: string;
};

export type E2eSelectedPrimaryTraceEntry = {
  selectedIndex: number;
  selectedSlot: number;
  sourceFlattenedIndex: number | null;
  responsibilityIndex: number | null;
  activityIndexWithinResponsibility: number | null;
  activityId: string;
  activityTitle: string;
  selectionReason: string;
  selectionReasonCode: string;
  selectionReasonText: string;
  finalSelectionScore: number;
  responsibilityBalanceAffectedResult: boolean;
  /** Dev-only diagnostic; never show to end users outside trace panel. */
  selectorRankingDevOnly?: number;
};

export type E2eCurrentActivityTrace = {
  currentActivityIndex: number | null;
  currentActivityTotal: number | null;
  currentActivityTitle: string | null;
  sourceFlattenedIndex: number | null;
  sourceResponsibilityIndex: number | null;
  sourceActivityIndexWithinResponsibility: number | null;
  activityId: string | null;
  exactMatchInFlattenedWorkMap: boolean;
  inSelectedPrimaryActivities: boolean;
};

export type E2eBlock0SourceTrace = {
  sourceMode: E2eBlock0WorkMapSourceMode | null;
  wasExampleLoaded: boolean;
  wasManualEditedAfterExample: boolean;
  savedWorkMapExists: boolean;
  savedAt: string | null;
  selectedAreasFromDraft: string[];
  selectedAreasFromSavedSnapshot: string[];
  areasMatch: boolean;
};

export type E2eBlock0CountTrace = {
  responsibilitiesCountVisible: number;
  responsibilitiesCountSaved: number;
  flattenedActivitiesCountVisible: number;
  flattenedActivitiesCountSaved: number;
  countsMatch: boolean;
};

export type E2eBlock0SelectionTrace = {
  policy: string | null;
  selectionMode: string | null;
  selectedCount: number;
  maxAllowed: 8;
  nonPrimaryContextCount: number;
  eligibleCount: number | null;
  excludedCount: number | null;
};

export type E2eNonPrimaryContextTraceEntry = {
  activityId: string;
  activityTitle: string;
  contextStatus: string;
  contextReason: string;
};

export type E2eBlock0PrefillTrace = {
  prefillSourceActivityTitle: string | null;
  prefillBuiltFromCurrentActivity: boolean;
  action: string | null;
  object: string | null;
  procedureOrStandard: string | null;
  output: string | null;
  epistemicStatusesDevOnly: Array<{ field: string; status: string }>;
};

export type E2eBlock0DemoTrace = {
  phase: E2eBlock0DemoPhase;
  workMapSaved: boolean;
  responsibilityCount: number;
  activityCount: number;
  detectedActivityCount: number;
  selectedPrimaryCount: number;
  currentPrimaryIndex: number | null;
  primaryActivityTitle: string | null;
  block0PrefillBuilt: boolean;
  block0Prepared: number;
  block0Total: number;
  continueEnabled: boolean;
  selectionMode: string | null;
  selectionPolicyVersion: string | null;
  sourceMode: E2eBlock0WorkMapSourceMode | null;
  savedWorkMapExists: boolean;
  flattenedActivitiesCount: number;
  workMapSavedAt: string | null;
  flattenedActivities: E2eFlattenedWorkMapActivity[];
  selectedPrimaryActivities: E2eSelectedPrimaryTraceEntry[];
  maxAllowedPrimary: 8;
  currentActivity: E2eCurrentActivityTrace;
  block0Prefill: E2eBlock0PrefillTrace;
  sourceTrace: E2eBlock0SourceTrace;
  countTrace: E2eBlock0CountTrace;
  selectionTrace: E2eBlock0SelectionTrace;
  nonPrimaryContextActivities: E2eNonPrimaryContextTraceEntry[];
  preRuntimeContextBundle: PreRuntimeContextBundle | null;
  traceabilityErrors: string[];
};

export const E2E_BLOCK0_TRACEABILITY_ERRORS = {
  currentNotInFlattened:
    "TRACEABILITY_ERROR: current activity not found in saved WorkMap",
  currentNotSelected:
    "TRACEABILITY_ERROR: current activity not selected by PrimaryActivitySelectionPolicy",
  prefillSourceMismatch:
    "TRACEABILITY_ERROR: B0 prefill source does not match current activity",
  fixtureLeakageManual:
    "TRACEABILITY_ERROR: fixture leakage into manual flow",
  draftSavedMismatch:
    "TRACEABILITY_ERROR: visible draft does not match saved WorkMap snapshot",
  areasDraftSavedMismatch:
    "TRACEABILITY_ERROR: selected areas in draft differ from saved snapshot",
} as const;

export const E2E_BLOCK0_DEMO_PHASE_LABELS: Record<E2eBlock0DemoPhase, string> = {
  login: "Acceso demo",
  estado_a: "Comienza tu levantamiento",
  work_map: "Mapa de trabajo",
  significado: "Significado de tu trabajo",
};

export const E2E_BLOCK0_DEMO_LOGIN_COPY = {
  title: "Acceso a la plataforma",
  subtitle: "Inicia sesion para continuar. El modo demo se mantiene separado.",
  demoHint: "Usa la demo controlada para revisar el recorrido completo sin Supabase.",
  demoButtonLabel: "Demo controlada",
  demoFootnote: "La demo no guarda datos comerciales reales.",
} as const;

export type E2eDemoLoginAdvanceResult = {
  phase: "estado_a";
  authDisplayName: string;
  startPositionContext: StartPositionContext;
};

export function advanceE2eDemoToEstadoA(
  authDisplayName: string,
): E2eDemoLoginAdvanceResult {
  return {
    phase: "estado_a",
    authDisplayName: authDisplayName.trim() || "Usuario Demo",
    startPositionContext: createE2eDemoStartPositionContext(),
  };
}

export function isE2eDemoLoginPhase(phase: E2eBlock0DemoPhase): boolean {
  return phase === "login";
}

export function flattenFilledWorkMapActivities(
  workMap: WorkMapData,
): E2eFlattenedWorkMapActivity[] {
  const flattened: E2eFlattenedWorkMapActivity[] = [];

  workMap.responsibilities.forEach((responsibility, responsibilityIndex) => {
    responsibility.activities.forEach((activity, activityIndexWithinResponsibility) => {
      const activityTitle = activity.text.trim();
      if (!activityTitle) {
        return;
      }

      flattened.push({
        flattenedIndex: flattened.length,
        responsibilityIndex,
        activityIndexWithinResponsibility,
        activityId: activity.id,
        activityTitle,
        responsibilityTitle: responsibility.text.trim(),
        responsibilityId: responsibility.id,
      });
    });
  });

  return flattened;
}

function findFlattenedActivity({
  flattenedActivities,
  activityId,
  activityTitle,
}: {
  flattenedActivities: E2eFlattenedWorkMapActivity[];
  activityId?: string | null;
  activityTitle?: string | null;
}): E2eFlattenedWorkMapActivity | null {
  if (activityId) {
    const byId = flattenedActivities.find((item) => item.activityId === activityId);
    if (byId) {
      return byId;
    }
  }

  const normalizedTitle = activityTitle?.trim();
  if (!normalizedTitle) {
    return null;
  }

  return (
    flattenedActivities.find((item) => item.activityTitle === normalizedTitle) ?? null
  );
}

function mapSelectedPrimaryTraceEntry(
  selected: SelectedPrimaryActivity,
  flattenedActivities: E2eFlattenedWorkMapActivity[],
): E2eSelectedPrimaryTraceEntry {
  const flattened = findFlattenedActivity({
    flattenedActivities,
    activityId: selected.activityId,
    activityTitle: selected.activityLiteral,
  });

  return {
    selectedIndex: selected.runtimeOrder,
    selectedSlot: selected.selectedSlot,
    sourceFlattenedIndex: flattened?.flattenedIndex ?? null,
    responsibilityIndex: flattened?.responsibilityIndex ?? null,
    activityIndexWithinResponsibility:
      flattened?.activityIndexWithinResponsibility ?? null,
    activityId: selected.activityId,
    activityTitle: selected.activityLiteral.trim(),
    selectionReason: selected.selectionReason,
    selectionReasonCode: selected.selectionReasonCode,
    selectionReasonText: selected.selectionReasonText,
    finalSelectionScore: selected.finalSelectionScore,
    responsibilityBalanceAffectedResult: selected.responsibilityBalanceAffectedResult,
    selectorRankingDevOnly: selected.score.finalSelectionScore,
  };
}

function mapEpistemicStatusDevLabel(status: string): string {
  if (status === "inferred_from_workmap") {
    return "inferido-workmap";
  }
  if (status === "context_from_workmap") {
    return "contexto-workmap";
  }
  if (status === "declared_unconfirmed") {
    return "declarado-sin-confirmar";
  }
  return status;
}

function buildBlock0PrefillTrace(
  workMap: WorkMapData | null,
  primaryActivity: SelectedPrimaryActivity | null,
  currentActivityTitle: string | null,
): E2eBlock0PrefillTrace {
  if (!workMap || !primaryActivity) {
    return {
      prefillSourceActivityTitle: null,
      prefillBuiltFromCurrentActivity: false,
      action: null,
      object: null,
      procedureOrStandard: null,
      output: null,
      epistemicStatusesDevOnly: [],
    };
  }

  const prefill = buildInitialBlock0VisualDraftFromWorkMap({
    workMap,
    primaryActivity,
    currentActivityTitle: currentActivityTitle ?? undefined,
  });

  const prefillSourceActivityTitle = primaryActivity.activityLiteral.trim();
  const normalizedCurrentTitle = currentActivityTitle?.trim() ?? "";

  return {
    prefillSourceActivityTitle,
    prefillBuiltFromCurrentActivity:
      prefillSourceActivityTitle.length > 0 &&
      prefillSourceActivityTitle === normalizedCurrentTitle,
    action: prefill.visualDraft[buildBlock0AnswerKey("B0-Q01", "action_verb")] ?? null,
    object: prefill.visualDraft[buildBlock0AnswerKey("B0-Q01", "input_or_object")] ?? null,
    procedureOrStandard:
      prefill.visualDraft[buildBlock0AnswerKey("B0-Q01", "procedure_or_standard")] ?? null,
    output: prefill.visualDraft[buildBlock0AnswerKey("B0-Q01", "output_or_result")] ?? null,
    epistemicStatusesDevOnly: Object.entries(prefill.epistemicByAnswerKey).map(
      ([field, status]) => ({
        field,
        status: mapEpistemicStatusDevLabel(status),
      }),
    ),
  };
}

export function resolveE2eSourceModeAfterSave({
  declaredSourceMode,
  wasExampleLoaded,
  savedWorkMap,
}: {
  declaredSourceMode: E2eBlock0WorkMapSourceMode | null;
  wasExampleLoaded: boolean;
  savedWorkMap: WorkMapData;
}): E2eBlock0WorkMapSourceMode {
  if (!wasExampleLoaded) {
    return "manual";
  }

  if (
    declaredSourceMode === "loaded_financial_example" &&
    isWorkMapStructurallyEqualToFinancialFixture(savedWorkMap)
  ) {
    return "loaded_financial_example";
  }

  return "manual_modified_from_example";
}

export function validateE2eBlock0TraceInvariants({
  sourceMode,
  workMap,
  visibleDraftWorkMap,
  savedWorkMapSnapshot,
  flattenedActivities,
  primaryActivitySelectionResult,
  currentActivity,
  block0Prefill,
}: {
  sourceMode: E2eBlock0WorkMapSourceMode | null;
  workMap: WorkMapData | null;
  visibleDraftWorkMap?: WorkMapData | null;
  savedWorkMapSnapshot?: WorkMapData | null;
  flattenedActivities: E2eFlattenedWorkMapActivity[];
  primaryActivitySelectionResult: PrimaryActivitySelectionResult | null;
  currentActivity: E2eCurrentActivityTrace;
  block0Prefill: E2eBlock0PrefillTrace;
}): string[] {
  const errors: string[] = [];
  const saved = savedWorkMapSnapshot ?? workMap;
  const draft = visibleDraftWorkMap ?? saved;

  if (
    (sourceMode === "manual" || sourceMode === "manual_modified_from_example") &&
    saved &&
    isE2eFinancialFixtureWorkMap(saved) &&
    sourceMode === "manual"
  ) {
    errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.fixtureLeakageManual);
  }

  if (sourceMode === "manual" && saved) {
    const fixtureLiterals = new Set(listE2eFinancialFixtureActivityLiterals());
    const leaked = flattenedActivities.some((item) =>
      fixtureLiterals.has(item.activityTitle),
    );
    if (leaked) {
      errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.fixtureLeakageManual);
    }
  }

  if (saved && draft && saved.isSaved) {
    if (!workMapSelectedAreasMatch(draft, saved)) {
      errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.areasDraftSavedMismatch);
    }

    const draftCount = countFilledWorkMapActivities(draft);
    const savedCount = countFilledWorkMapActivities(saved);
    if (draftCount !== savedCount) {
      errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.draftSavedMismatch);
    }
  }

  if (!currentActivity.currentActivityTitle) {
    return errors;
  }

  if (!currentActivity.exactMatchInFlattenedWorkMap) {
    errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.currentNotInFlattened);
  }

  if (!currentActivity.inSelectedPrimaryActivities) {
    errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.currentNotSelected);
  }

  if (
    primaryActivitySelectionResult &&
    block0Prefill.prefillSourceActivityTitle &&
    !block0Prefill.prefillBuiltFromCurrentActivity
  ) {
    errors.push(E2E_BLOCK0_TRACEABILITY_ERRORS.prefillSourceMismatch);
  }

  return errors;
}

export function buildE2eBlock0DemoTrace({
  phase,
  workMap,
  visibleDraftWorkMap,
  savedWorkMapSnapshot,
  sourceMode,
  wasExampleLoaded = false,
  wasManualEditedAfterExample = false,
  workMapSavedAt,
  primaryActivitySelectionResult,
  block0Progress,
}: {
  phase: E2eBlock0DemoPhase;
  workMap: WorkMapData | null;
  visibleDraftWorkMap?: WorkMapData | null;
  savedWorkMapSnapshot?: WorkMapData | null;
  sourceMode?: E2eBlock0WorkMapSourceMode | null;
  wasExampleLoaded?: boolean;
  wasManualEditedAfterExample?: boolean;
  workMapSavedAt?: string | null;
  primaryActivitySelectionResult: PrimaryActivitySelectionResult | null;
  block0Progress: E2eBlock0Block0Progress | null;
}): E2eBlock0DemoTrace {
  const savedSnapshot = savedWorkMapSnapshot ?? (workMap?.isSaved ? workMap : null);
  const traceWorkMap = savedSnapshot ?? workMap;
  const draftWorkMap = visibleDraftWorkMap ?? traceWorkMap;

  const primaryActivity =
    primaryActivitySelectionResult?.selectedPrimaryActivities[0] ?? null;
  const detectedActivityCount = traceWorkMap ? countFilledWorkMapActivities(traceWorkMap) : 0;
  const selectedPrimaryCount =
    primaryActivitySelectionResult?.selectedPrimaryActivities.length ?? 0;
  const flattenedActivities = traceWorkMap
    ? flattenFilledWorkMapActivities(traceWorkMap)
    : [];
  const flattenedActivitiesVisible = draftWorkMap
    ? flattenFilledWorkMapActivities(draftWorkMap)
    : [];

  const currentFlattened = primaryActivity
    ? findFlattenedActivity({
        flattenedActivities,
        activityId: primaryActivity.activityId,
        activityTitle: primaryActivity.activityLiteral,
      })
    : null;

  const currentActivityTitle = primaryActivity?.activityLiteral?.trim() ?? null;
  const inSelectedPrimaryActivities = primaryActivity
    ? (primaryActivitySelectionResult?.selectedPrimaryActivities.some(
        (item) => item.activityId === primaryActivity.activityId,
      ) ?? false)
    : false;

  const currentActivity: E2eCurrentActivityTrace = {
    currentActivityIndex: primaryActivity?.runtimeOrder ?? null,
    currentActivityTotal: selectedPrimaryCount > 0 ? selectedPrimaryCount : null,
    currentActivityTitle,
    sourceFlattenedIndex: currentFlattened?.flattenedIndex ?? null,
    sourceResponsibilityIndex: currentFlattened?.responsibilityIndex ?? null,
    sourceActivityIndexWithinResponsibility:
      currentFlattened?.activityIndexWithinResponsibility ?? null,
    activityId: primaryActivity?.activityId ?? null,
    exactMatchInFlattenedWorkMap: currentFlattened !== null,
    inSelectedPrimaryActivities,
  };

  const block0Prefill = buildBlock0PrefillTrace(
    traceWorkMap,
    primaryActivity,
    currentActivityTitle,
  );

  const block0PrefillBuilt = Boolean(block0Prefill.action?.trim());

  const selectedAreasFromDraft = draftWorkMap ? listWorkMapSelectedAreas(draftWorkMap) : [];
  const selectedAreasFromSavedSnapshot = savedSnapshot
    ? listWorkMapSelectedAreas(savedSnapshot)
    : [];

  const responsibilitiesCountVisible = draftWorkMap
    ? countWorkMapResponsibilities(draftWorkMap)
    : 0;
  const responsibilitiesCountSaved = savedSnapshot
    ? countWorkMapResponsibilities(savedSnapshot)
    : 0;
  const flattenedActivitiesCountVisible = flattenedActivitiesVisible.length;
  const flattenedActivitiesCountSaved = flattenedActivities.length;

  const sourceTrace: E2eBlock0SourceTrace = {
    sourceMode: sourceMode ?? null,
    wasExampleLoaded,
    wasManualEditedAfterExample,
    savedWorkMapExists: savedSnapshot?.isSaved === true,
    savedAt: workMapSavedAt ?? null,
    selectedAreasFromDraft,
    selectedAreasFromSavedSnapshot,
    areasMatch:
      !savedSnapshot?.isSaved ||
      workMapSelectedAreasMatch(
        draftWorkMap ?? createEmptyWorkMapFallback(),
        savedSnapshot,
      ),
  };

  const countTrace: E2eBlock0CountTrace = {
    responsibilitiesCountVisible,
    responsibilitiesCountSaved,
    flattenedActivitiesCountVisible,
    flattenedActivitiesCountSaved,
    countsMatch:
      responsibilitiesCountVisible === responsibilitiesCountSaved &&
      flattenedActivitiesCountVisible === flattenedActivitiesCountSaved,
  };

  const selectionTrace: E2eBlock0SelectionTrace = {
    policy: primaryActivitySelectionResult ? PRIMARY_ACTIVITY_SELECTION_VERSION : null,
    selectionMode: primaryActivitySelectionResult?.mode ?? null,
    selectedCount: selectedPrimaryCount,
    maxAllowed: 8,
    nonPrimaryContextCount:
      primaryActivitySelectionResult?.nonPrimaryContextActivities.length ?? 0,
    eligibleCount: primaryActivitySelectionResult?.runLog.eligibleActivityCount ?? null,
    excludedCount: primaryActivitySelectionResult?.runLog.excludedActivityCount ?? null,
  };

  const nonPrimaryContextActivities: E2eNonPrimaryContextTraceEntry[] = (
    primaryActivitySelectionResult?.nonPrimaryContextActivities ?? []
  ).map((activity) => ({
    activityId: activity.activityId,
    activityTitle: activity.activityLiteral.trim(),
    contextStatus: activity.contextStatus,
    contextReason: activity.contextReason,
  }));

  const traceabilityErrors = validateE2eBlock0TraceInvariants({
    sourceMode: sourceMode ?? null,
    workMap: traceWorkMap,
    visibleDraftWorkMap: draftWorkMap,
    savedWorkMapSnapshot: savedSnapshot,
    flattenedActivities,
    primaryActivitySelectionResult,
    currentActivity,
    block0Prefill,
  });
  const preRuntimeContextBundle =
    traceWorkMap && primaryActivitySelectionResult
      ? buildPreRuntimeContextBundle({
          startPositionContext: traceWorkMap.startPositionContext,
          workMap: traceWorkMap,
          primaryActivitySelectionResult,
        })
      : null;

  return {
    phase,
    workMapSaved: savedSnapshot?.isSaved === true,
    responsibilityCount: responsibilitiesCountSaved,
    activityCount: detectedActivityCount,
    detectedActivityCount,
    selectedPrimaryCount,
    currentPrimaryIndex: primaryActivity?.runtimeOrder ?? null,
    primaryActivityTitle: currentActivityTitle,
    block0PrefillBuilt,
    block0Prepared: block0Progress?.prepared ?? 0,
    block0Total: block0Progress?.total ?? 4,
    continueEnabled: block0Progress?.canContinue === true,
    selectionMode: primaryActivitySelectionResult?.mode ?? null,
    selectionPolicyVersion: primaryActivitySelectionResult
      ? PRIMARY_ACTIVITY_SELECTION_VERSION
      : null,
    sourceMode: sourceMode ?? null,
    savedWorkMapExists: savedSnapshot?.isSaved === true,
    flattenedActivitiesCount: flattenedActivitiesCountSaved,
    workMapSavedAt: workMapSavedAt ?? null,
    flattenedActivities,
    selectedPrimaryActivities: (
      primaryActivitySelectionResult?.selectedPrimaryActivities ?? []
    ).map((selected) => mapSelectedPrimaryTraceEntry(selected, flattenedActivities)),
    maxAllowedPrimary: 8,
    currentActivity,
    block0Prefill,
    sourceTrace,
    countTrace,
    selectionTrace,
    nonPrimaryContextActivities,
    preRuntimeContextBundle,
    traceabilityErrors,
  };
}

function createEmptyWorkMapFallback(): WorkMapData {
  return {
    selectedAreas: [],
    customAreas: [],
    responsibilities: [],
    guideSeen: { roleHelp: false, area: false, responsibility: false, activity: false, save: false },
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
  };
}

export function assertE2eDemoSelectionContract(
  workMap: WorkMapData,
  selection: PrimaryActivitySelectionResult,
) {
  const detected = countFilledWorkMapActivities(workMap);
  if (detected !== E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT) {
    throw new Error(
      `Expected ${E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT} detected activities, got ${detected}`,
    );
  }

  if (selection.selectedPrimaryActivities.length !== E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT) {
    throw new Error(
      `Expected ${E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT} primary activities, got ${selection.selectedPrimaryActivities.length}`,
    );
  }
}
