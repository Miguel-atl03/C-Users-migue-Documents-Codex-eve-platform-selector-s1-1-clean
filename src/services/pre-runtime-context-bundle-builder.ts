import {
  DECISION_PROXIMITY_OPTIONS,
  PARTICIPATION_PLACE_OPTIONS,
  type StartPositionContext,
} from "@/domain/start-position-context";
import {
  makeContextField,
  PRE_RUNTIME_CONTEXT_BUNDLE_VERSION,
  type PreRuntimeContextBundle,
} from "@/domain/pre-runtime-context-bundle.v1.0";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type { WorkMapData } from "@/domain/local-work-map";

export type BuildPreRuntimeContextBundleInput = {
  startPositionContext?: StartPositionContext | null;
  workMap: WorkMapData;
  primaryActivitySelectionResult?: PrimaryActivitySelectionResult | null;
  createdAt?: string;
};

const CONTEXT_ALLOWED_USES = [
  "contextualize_questions",
  "orient_user",
  "traceability",
];

const CONTEXT_FORBIDDEN_USES = [
  "confirmed_mmabp_evidence",
  "diagnose_from_context_only",
  "replace_runtime_answer",
];

function findLabel(
  options: readonly { id: string; label: string }[],
  id: string | undefined,
): string {
  return options.find((option) => option.id === id)?.label ?? "";
}

function resolveParticipationPlace(context?: StartPositionContext | null): string | null {
  if (!context?.participationPlace) {
    return null;
  }
  if (context.participationPlace === "other") {
    return context.participationPlaceOther.trim() || null;
  }
  return findLabel(PARTICIPATION_PLACE_OPTIONS, context.participationPlace) || null;
}

function resolveDecisionLevel(context?: StartPositionContext | null): string | null {
  if (!context?.decisionProximity) {
    return null;
  }
  return findLabel(DECISION_PROXIMITY_OPTIONS, context.decisionProximity) || null;
}

function countActivities(workMap: WorkMapData): number {
  return workMap.responsibilities.reduce(
    (count, responsibility) =>
      count +
      responsibility.activities.filter((activity) => activity.text.trim()).length,
    0,
  );
}

function buildBundleId(workMap: WorkMapData, createdAt: string): string {
  return `preruntime-${workMap.responsibilities.length}-${countActivities(workMap)}-${createdAt}`;
}

export function buildPreRuntimeContextBundle(
  input: BuildPreRuntimeContextBundleInput,
): PreRuntimeContextBundle {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const startPositionContext =
    input.startPositionContext ?? input.workMap.startPositionContext ?? null;
  const functionalRole = resolveParticipationPlace(startPositionContext);
  const decisionLevel = resolveDecisionLevel(startPositionContext);
  const responsibilities = input.workMap.responsibilities
    .filter((responsibility) => responsibility.text.trim())
    .map((responsibility) => ({
      responsibilityId: responsibility.id,
      responsibilityText: responsibility.text.trim(),
    }));
  const activities = input.workMap.responsibilities.flatMap((responsibility) =>
    responsibility.activities
      .filter((activity) => activity.text.trim())
      .map((activity) => ({
        activityId: activity.id,
        activityTitle: activity.text.trim(),
        responsibilityId: responsibility.id,
        responsibilityTitle: responsibility.text.trim(),
      })),
  );

  return {
    preRuntimeContextBundleId: buildBundleId(input.workMap, createdAt),
    policyVersion: PRE_RUNTIME_CONTEXT_BUNDLE_VERSION,
    createdAt,
    sourceState: {
      estadoAAvailable: Boolean(functionalRole || decisionLevel),
      workMapAvailable: input.workMap.isSaved || activities.length > 0,
      primarySelectionAvailable: Boolean(input.primaryActivitySelectionResult),
    },
    estadoAContext: {
      functional_role_context: makeContextField({
        value: functionalRole,
        epistemicStatus: functionalRole ? "captured_user_context" : "gap",
        source: functionalRole ? "estado_a" : "system",
        clientLabel: "Lugar desde donde participas",
        internalField: "functional_role_context",
        allowedUses: CONTEXT_ALLOWED_USES,
        mustNotBeUsedFor: [
          ...CONTEXT_FORBIDDEN_USES,
          "confirmed_actor_authority",
        ],
        requiresRuntimeConfirmation: true,
      }),
      decision_level_context: makeContextField({
        value: decisionLevel,
        epistemicStatus: decisionLevel ? "captured_user_context" : "gap",
        source: decisionLevel ? "estado_a" : "system",
        clientLabel: "Cercania a decisiones",
        internalField: "decision_level_context",
        allowedUses: [
          ...CONTEXT_ALLOWED_USES,
          "prepare_block5_confirmation",
        ],
        mustNotBeUsedFor: [
          ...CONTEXT_FORBIDDEN_USES,
          "confirmed_authority_without_runtime",
        ],
        requiresRuntimeConfirmation: true,
      }),
    },
    workMapContext: {
      areas: makeContextField({
        value: [...input.workMap.selectedAreas, ...input.workMap.customAreas].filter(
          Boolean,
        ),
        epistemicStatus:
          input.workMap.selectedAreas.length || input.workMap.customAreas.length
            ? "captured_user_context"
            : "gap",
        source: "workmap",
        clientLabel: "Areas o ubicacion de trabajo",
        internalField: "workmap_area_context",
        allowedUses: CONTEXT_ALLOWED_USES,
        mustNotBeUsedFor: [...CONTEXT_FORBIDDEN_USES, "confirmed_pf_swimlane"],
      }),
      responsibilities: makeContextField({
        value: responsibilities,
        epistemicStatus: responsibilities.length ? "captured_user_context" : "gap",
        source: responsibilities.length ? "workmap" : "system",
        clientLabel: "Responsabilidades redactadas",
        internalField: "responsibility_context",
        allowedUses: [...CONTEXT_ALLOWED_USES, "container_process_hint"],
        mustNotBeUsedFor: [...CONTEXT_FORBIDDEN_USES, "confirmed_pm"],
      }),
      activities: makeContextField({
        value: activities,
        epistemicStatus: activities.length ? "captured_user_context" : "gap",
        source: activities.length ? "workmap" : "system",
        clientLabel: "Actividades redactadas",
        internalField: "workmap_activity_context",
        allowedUses: CONTEXT_ALLOWED_USES,
        mustNotBeUsedFor: [...CONTEXT_FORBIDDEN_USES, "runtime40_20_complete"],
      }),
    },
    selectionContext: {
      selectedPrimaryActivities: makeContextField({
        value: input.primaryActivitySelectionResult?.selectedPrimaryActivities ?? [],
        epistemicStatus: input.primaryActivitySelectionResult
          ? "context_only"
          : "gap",
        source: input.primaryActivitySelectionResult
          ? "primary_selection"
          : "system",
        clientLabel: "Actividades primarias seleccionadas",
        internalField: "primary_activity_context",
        allowedUses: [
          ...CONTEXT_ALLOWED_USES,
          "significado_handoff",
          "runtime_candidate_context",
        ],
        mustNotBeUsedFor: [...CONTEXT_FORBIDDEN_USES, "select_activities"],
      }),
      nonPrimaryContextActivities: makeContextField({
        value: input.primaryActivitySelectionResult?.nonPrimaryContextActivities ?? [],
        epistemicStatus: input.primaryActivitySelectionResult
          ? "context_only"
          : "gap",
        source: input.primaryActivitySelectionResult
          ? "primary_selection"
          : "system",
        clientLabel: "Actividades no primarias como contexto",
        internalField: "non_primary_activity_context",
        allowedUses: [
          ...CONTEXT_ALLOWED_USES,
          "coverage_gap_analysis",
          "possible_later_promotion",
        ],
        mustNotBeUsedFor: [
          ...CONTEXT_FORBIDDEN_USES,
          "runtime40_20_immediate",
        ],
      }),
      selectionPolicyVersion: input.primaryActivitySelectionResult?.version,
      selectionMode: input.primaryActivitySelectionResult?.mode,
    },
    runtimeContext: {
      significadoHandoffAllowed: true,
      b0PrefillAllowed: true,
      contextMayBeDisplayedToUser: true,
      contextMustNotBeSavedAsConfirmedEvidence: true,
    },
  };
}
