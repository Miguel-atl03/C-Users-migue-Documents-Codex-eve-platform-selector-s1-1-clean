import {
  activityFieldKey,
  getActivityText,
  responsibilityFieldKey,
  type FieldValidationEntry,
  type WorkMapData,
} from "@/domain/local-work-map";

export const MIN_RESPONSIBILITIES_FOR_COVERAGE = 2;
export const MIN_ACTIVITIES_PER_RESPONSIBILITY = 2;
const MINIMUM_INFORMATION_MESSAGE =
  "Para guardar, agrega un mínimo de información.";
const MINIMUM_INFORMATION_DETAIL =
  "Redacta, por lo menos, 2 responsabilidades y 2 actividades en cada una.";

export const OPERATIONAL_READINESS_MESSAGES = {
  areaMissing:
    "Selecciona al menos un área donde participa tu trabajo antes de guardar.",
  responsibilityMissing: "Para guardar tu mapa falta una responsabilidad más.",
  responsibilityMissingDetail:
    "Agrega otra responsabilidad y redacta al menos 2 actividades para ella.",
  activityMissing: "Para guardar tu mapa falta completar actividades.",
  activityMissingDetail: (responsibilityNumber: number) =>
    `La Responsabilidad ${responsibilityNumber} necesita al menos 2 actividades para guardar el mapa.`,
  saveFailed: "No pudimos guardar el mapa. Inténtalo de nuevo.",
} as const;

export type OperationalBlockingType = "coverage" | "area_missing";

export type OperationalBlockingScope =
  | "global"
  | "area"
  | "responsibility"
  | "activity";

export type OperationalBlockingReason = {
  type: OperationalBlockingType;
  scope: OperationalBlockingScope;
  message: string;
  targetKey?: string;
};

export type OperationalReadinessInput = {
  workMap: WorkMapData;
  hasAreas: boolean;
};

export type OperationalReadinessResult = {
  canEnterReviewMode: boolean;
  savedWithWarnings: boolean;
  blockingReasons: OperationalBlockingReason[];
  fieldBlocks: string[];
  coverageBlocks: string[];
  globalMessage: string;
  globalDetailMessage: string;
  firstBlockingTarget: string | null;
};

export function countWrittenResponsibilities(workMap: WorkMapData) {
  return workMap.responsibilities.filter(
    (responsibility) => responsibility.text.trim().length > 0,
  ).length;
}

export function countWrittenActivities(
  responsibility: WorkMapData["responsibilities"][number],
) {
  return responsibility.activities.filter((activity) =>
    getActivityText(activity).trim(),
  ).length;
}

function getDeclaredWorkAreas(workMap: WorkMapData) {
  return [...workMap.selectedAreas, ...workMap.customAreas]
    .map((area) => area.trim())
    .filter(Boolean);
}

function getAreaResponsibilities(workMap: WorkMapData, area: string) {
  return workMap.responsibilities.filter(
    (responsibility) => responsibility.primaryArea === area,
  );
}

function hasWarningStatus(entry: FieldValidationEntry | undefined): boolean {
  return entry?.status === "allowed_with_warning";
}

function collectSavedWithWarnings(workMap: WorkMapData): boolean {
  for (const responsibility of workMap.responsibilities) {
    const responsibilityKey = responsibilityFieldKey(responsibility.id);
    if (
      responsibility.text.trim() &&
      hasWarningStatus(workMap.fieldValidationState[responsibilityKey])
    ) {
      return true;
    }

    for (const activity of responsibility.activities) {
      const activityKey = activityFieldKey(activity.id);
      const activityText = getActivityText(activity).trim();
      if (
        activityText &&
        hasWarningStatus(workMap.fieldValidationState[activityKey])
      ) {
        return true;
      }
    }
  }

  return false;
}

function findFirstActivityCoverageGap(workMap: WorkMapData) {
  for (let index = 0; index < workMap.responsibilities.length; index += 1) {
    const responsibility = workMap.responsibilities[index];
    if (!responsibility.text.trim()) {
      continue;
    }

    if (countWrittenActivities(responsibility) < MIN_ACTIVITIES_PER_RESPONSIBILITY) {
      return {
        responsibilityNumber: index + 1,
        responsibilityId: responsibility.id,
      };
    }
  }

  return null;
}

function pickGlobalMessages(
  blockingReasons: OperationalBlockingReason[],
  workMap: WorkMapData,
): { message: string; detail: string } {
  if (!blockingReasons.length) {
    return { message: "", detail: "" };
  }

  const hasAreaMissing = blockingReasons.some(
    (reason) => reason.type === "area_missing",
  );
  if (hasAreaMissing) {
    return {
      message: OPERATIONAL_READINESS_MESSAGES.areaMissing,
      detail: "",
    };
  }

  const writtenResponsibilityCount = countWrittenResponsibilities(workMap);
  if (writtenResponsibilityCount < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
    return {
      message: MINIMUM_INFORMATION_MESSAGE,
      detail: MINIMUM_INFORMATION_DETAIL,
    };
  }

  const activityGap = findFirstActivityCoverageGap(workMap);
  if (activityGap) {
    return {
      message: MINIMUM_INFORMATION_MESSAGE,
      detail: MINIMUM_INFORMATION_DETAIL,
    };
  }

  const hasCoverageBlock = blockingReasons.some(
    (reason) => reason.type === "coverage",
  );
  if (hasCoverageBlock) {
    return {
      message: MINIMUM_INFORMATION_MESSAGE,
      detail: MINIMUM_INFORMATION_DETAIL,
    };
  }

  return { message: "", detail: "" };
}

export function evaluateWorkMapOperationalReadiness(
  input: OperationalReadinessInput,
): OperationalReadinessResult {
  const { workMap, hasAreas } = input;
  const blockingReasons: OperationalBlockingReason[] = [];
  const coverageBlocks: string[] = [];

  if (!hasAreas) {
    blockingReasons.push({
      type: "area_missing",
      scope: "area",
      message: OPERATIONAL_READINESS_MESSAGES.areaMissing,
      targetKey: "areas",
    });
    coverageBlocks.push("areas");
  }

  const writtenResponsibilityCount = countWrittenResponsibilities(workMap);
  if (writtenResponsibilityCount < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
    blockingReasons.push({
      type: "coverage",
      scope: "global",
      message: OPERATIONAL_READINESS_MESSAGES.responsibilityMissing,
    });

    workMap.responsibilities.forEach((responsibility) => {
      if (!responsibility.text.trim()) {
        coverageBlocks.push(`responsibility:${responsibility.id}`);
      }
    });
  }

  workMap.responsibilities.forEach((responsibility) => {
    if (!responsibility.text.trim()) {
      return;
    }

    const writtenActivityCount = countWrittenActivities(responsibility);
    if (writtenActivityCount < MIN_ACTIVITIES_PER_RESPONSIBILITY) {
      const targetKey = `coverage:activities:${responsibility.id}`;
      blockingReasons.push({
        type: "coverage",
        scope: "activity",
        message: OPERATIONAL_READINESS_MESSAGES.activityMissing,
        targetKey,
      });
      coverageBlocks.push(targetKey);
    }
  });

  const declaredAreas = getDeclaredWorkAreas(workMap);
  if (declaredAreas.length > 1) {
    declaredAreas.forEach((area) => {
      const areaResponsibilities = getAreaResponsibilities(workMap, area);
      const writtenAreaResponsibilities = areaResponsibilities.filter(
        (responsibility) => responsibility.text.trim(),
      );

      if (
        writtenAreaResponsibilities.length < MIN_RESPONSIBILITIES_FOR_COVERAGE
      ) {
        blockingReasons.push({
          type: "coverage",
          scope: "area",
          message: MINIMUM_INFORMATION_MESSAGE,
          targetKey: `coverage:area:${area}`,
        });

        areaResponsibilities.forEach((responsibility) => {
          if (!responsibility.text.trim()) {
            coverageBlocks.push(`responsibility:${responsibility.id}`);
          }
        });
      }

      writtenAreaResponsibilities.forEach((responsibility) => {
        if (
          countWrittenActivities(responsibility) <
          MIN_ACTIVITIES_PER_RESPONSIBILITY
        ) {
          const targetKey = `coverage:activities:${responsibility.id}`;
          blockingReasons.push({
            type: "coverage",
            scope: "activity",
            message: MINIMUM_INFORMATION_MESSAGE,
            targetKey,
          });
          coverageBlocks.push(targetKey);
        }
      });
    });
  }

  const canEnterReviewMode = blockingReasons.length === 0;
  const savedWithWarnings = canEnterReviewMode
    ? collectSavedWithWarnings(workMap)
    : false;
  const { message: globalMessage, detail: globalDetailMessage } =
    pickGlobalMessages(blockingReasons, workMap);
  const firstBlockingTarget =
    coverageBlocks[0] ?? blockingReasons[0]?.targetKey ?? null;

  return {
    canEnterReviewMode,
    savedWithWarnings,
    blockingReasons,
    fieldBlocks: [],
    coverageBlocks,
    globalMessage,
    globalDetailMessage,
    firstBlockingTarget,
  };
}
