import {
  activityCoverageFieldKey,
  activityFieldKey,
  buildRedactionObject,
  computeFieldTextHash,
  evaluateCoverageFieldEntry,
  evaluateFieldValidationEntry,
  getActivityText,
  responsibilityFieldKey,
  shouldEmitRedactionAssistance,
  shouldIncrementMeaningfulAttempt,
  type FieldValidationEntry,
  type FieldValidationState,
  type RedactionObject,
  type SufficiencyStatus,
  type WorkMapData,
} from "@/domain/local-work-map";
import {
  classifyActivitySufficiency,
  getActivityAssistMessage,
  validateActivity,
} from "@/services/local-work-map-activity-validation";
import {
  classifyResponsibilitySufficiency,
  getResponsibilityAssistMessage,
  validateResponsibility,
} from "@/services/local-work-map-responsibility-validation";

export type FieldWarningKey =
  | "areas"
  | `responsibility:${string}`
  | `activity:${string}:${number}`
  | `coverage:activities:${string}`;

export const MIN_RESPONSIBILITIES_FOR_COVERAGE = 2;
export const MIN_ACTIVITIES_PER_RESPONSIBILITY = 2;

export type SaveValidationTransaction = {
  transactionId: string;
  evaluatedHashes: Set<string>;
};

export function createSaveValidationTransaction(): SaveValidationTransaction {
  return {
    transactionId: `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    evaluatedHashes: new Set<string>(),
  };
}

function clearInlineAssistState(
  existing: FieldValidationEntry | undefined,
): FieldValidationEntry | undefined {
  if (!existing) return undefined;
  if (existing.lastMessageType !== "inline" && !existing.inlineAssistShown) {
    return existing;
  }
  return {
    ...existing,
    inlineAssistShown: false,
    ...(existing.lastMessageType === "inline"
      ? { lastMessageType: "none" as const, message: undefined }
      : {}),
    ...(existing.status === "inline_assisted"
      ? { status: "unchecked" as const }
      : {}),
  };
}

function getRedactionSemanticStatus(
  fieldKey: string,
  text: string,
): SufficiencyStatus {
  if (fieldKey.startsWith("activity:")) {
    return classifyActivitySufficiency(text);
  }
  if (fieldKey.startsWith("responsibility:")) {
    return classifyResponsibilitySufficiency(text);
  }
  return "empty";
}

function evaluateSyntaxFieldOnSave(
  fieldKey: string,
  text: string,
  valid: boolean,
  existing: FieldValidationEntry | undefined,
  assistMessage: string | undefined,
  transaction: SaveValidationTransaction,
): FieldValidationEntry {
  const textHash = computeFieldTextHash(text);
  const dedupKey = `${fieldKey}:${textHash}`;
  const semanticStatus = getRedactionSemanticStatus(fieldKey, text);

  if (transaction.evaluatedHashes.has(dedupKey) && existing) {
    return clearInlineAssistState(existing) ?? existing;
  }

  transaction.evaluatedHashes.add(dedupKey);

  if (
    !shouldEmitRedactionAssistance(semanticStatus) &&
    !shouldIncrementMeaningfulAttempt(semanticStatus)
  ) {
    return evaluateFieldValidationEntry(text, true, clearInlineAssistState(existing));
  }

  return evaluateFieldValidationEntry(
    text,
    valid,
    clearInlineAssistState(existing),
    assistMessage,
  );
}

/** @internal Exported for regression tests — builds redaction object snapshot. */
export function buildResponsibilityRedactionObject(
  responsibilityId: string,
  text: string,
  entry?: FieldValidationEntry,
): RedactionObject {
  return buildRedactionObject(
    responsibilityFieldKey(responsibilityId),
    "responsibility",
    text,
    classifyResponsibilitySufficiency(text),
    entry,
  );
}

/** @internal Exported for regression tests — builds redaction object snapshot. */
export function buildActivityRedactionObject(
  activityId: string,
  text: string,
  entry?: FieldValidationEntry,
): RedactionObject {
  return buildRedactionObject(
    activityFieldKey(activityId),
    "activity",
    text,
    classifyActivitySufficiency(text),
    entry,
  );
}

export const COVERAGE_MESSAGES = {
  needSecondResponsibility:
    "Agrega al menos una responsabilidad más para completar la primera versión de tu mapa.",
  needTwoActivities:
    "Agrega al menos 2 actividades para esta responsabilidad.",
  needOneMoreActivity: "Agrega una actividad más para esta responsabilidad.",
  activitiesMissing:
    "Faltan actividades en esta responsabilidad. Agrega al menos 2 actividades antes de continuar.",
  emptyResponsibility:
    "Escribe la responsabilidad principal de este bloque.",
} as const;

export const GLOBAL_BANNER_MESSAGES = {
  coverageOnly:
    "Tu mapa aún necesita más contenido. Agrega al menos 2 responsabilidades y 2 actividades por responsabilidad para completar la primera versión.",
  syntaxOnly:
    "Algunas responsabilidades o actividades pueden quedar más claras. Revisa los campos marcados.",
  both:
    "Tu mapa aún necesita más contenido. También hay algunas redacciones que pueden quedar más claras.",
} as const;

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

export function getResponsibilityCoverageMessage(
  responsibility: WorkMapData["responsibilities"][number],
  workMap: WorkMapData,
): string | undefined {
  const text = responsibility.text.trim();
  const writtenResponsibilityCount = countWrittenResponsibilities(workMap);

  if (!text) {
    if (writtenResponsibilityCount < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
      return COVERAGE_MESSAGES.needSecondResponsibility;
    }
    return COVERAGE_MESSAGES.emptyResponsibility;
  }

  return undefined;
}

export function getResponsibilityActivitiesCoverageMessage(
  responsibility: WorkMapData["responsibilities"][number],
): string | undefined {
  const responsibilityText = responsibility.text.trim();
  if (!responsibilityText) return undefined;

  const writtenActivityCount = countWrittenActivities(responsibility);
  const activitySlotCount = responsibility.activities.length;

  if (writtenActivityCount === 0) {
    if (activitySlotCount > 1) {
      return COVERAGE_MESSAGES.activitiesMissing;
    }
    return COVERAGE_MESSAGES.needTwoActivities;
  }

  if (writtenActivityCount === 1) {
    return COVERAGE_MESSAGES.needOneMoreActivity;
  }

  return undefined;
}

/** @deprecated Per-slot coverage; prefer getResponsibilityActivitiesCoverageMessage. */
export function getActivityCoverageMessage(
  responsibility: WorkMapData["responsibilities"][number],
  activityIndex: number,
): string | undefined {
  const activity = responsibility.activities[activityIndex];
  if (!activity) return undefined;

  const activityText = getActivityText(activity).trim();
  if (activityText) return undefined;

  return getResponsibilityActivitiesCoverageMessage(responsibility);
}

export function hasResponsibilityCoverageGap(
  responsibility: WorkMapData["responsibilities"][number],
  workMap: WorkMapData,
) {
  const responsibilityText = responsibility.text.trim();
  if (!responsibilityText) {
    return true;
  }

  if (countWrittenResponsibilities(workMap) < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
    return true;
  }

  return (
    countWrittenActivities(responsibility) < MIN_ACTIVITIES_PER_RESPONSIBILITY
  );
}

export function hasCoverageGaps(workMap: WorkMapData) {
  if (countWrittenResponsibilities(workMap) < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
    return true;
  }

  return workMap.responsibilities.some((responsibility) => {
    const responsibilityText = responsibility.text.trim();
    if (!responsibilityText) return true;
    return (
      countWrittenActivities(responsibility) < MIN_ACTIVITIES_PER_RESPONSIBILITY
    );
  });
}

export function hasSyntaxGaps(workMap: WorkMapData) {
  for (const responsibility of workMap.responsibilities) {
    const responsibilityText = responsibility.text.trim();

    if (responsibilityText && !validateResponsibility(responsibilityText).valid) {
      return true;
    }

    for (const activity of responsibility.activities) {
      const activityText = getActivityText(activity).trim();
      if (!activityText) continue;

      if (!validateActivity(activityText).valid) {
        return true;
      }
    }
  }

  return false;
}

export function getSaveGlobalBannerMessage(
  workMap: WorkMapData,
  hasAreas: boolean,
): string | null {
  if (!hasAreas) {
    return null;
  }

  const coverageGaps = hasCoverageGaps(workMap);
  const syntaxGaps = hasSyntaxGaps(workMap);

  if (coverageGaps && syntaxGaps) {
    return GLOBAL_BANNER_MESSAGES.both;
  }
  if (coverageGaps) {
    return GLOBAL_BANNER_MESSAGES.coverageOnly;
  }
  if (syntaxGaps) {
    return GLOBAL_BANNER_MESSAGES.syntaxOnly;
  }

  return null;
}

function isCoverageFieldIssue(
  issue: FieldWarningKey,
  workMap: WorkMapData,
): boolean {
  if (issue === "areas") return false;

  if (issue.startsWith("responsibility:")) {
    const responsibilityId = issue.slice("responsibility:".length);
    const responsibility = workMap.responsibilities.find(
      (row) => row.id === responsibilityId,
    );
    if (!responsibility) return false;
    return Boolean(getResponsibilityCoverageMessage(responsibility, workMap));
  }

  const coverageMatch = /^coverage:activities:([^:]+)$/.exec(issue);
  if (coverageMatch) {
    const responsibility = workMap.responsibilities.find(
      (row) => row.id === coverageMatch[1],
    );
    if (!responsibility) return false;
    return Boolean(getResponsibilityActivitiesCoverageMessage(responsibility));
  }

  const match = /^activity:([^:]+):(\d+)$/.exec(issue);
  if (!match) return false;

  const responsibility = workMap.responsibilities.find(
    (row) => row.id === match[1],
  );
  if (!responsibility) return false;

  return Boolean(
    getActivityCoverageMessage(responsibility, Number(match[2])),
  );
}

export function buildFieldWarnings(
  workMap: WorkMapData,
  hasAreas: boolean,
): FieldWarningKey[] {
  const issues: FieldWarningKey[] = [];

  if (!hasAreas) {
    issues.push("areas");
  }

  if (countWrittenResponsibilities(workMap) < MIN_RESPONSIBILITIES_FOR_COVERAGE) {
    workMap.responsibilities.forEach((responsibility) => {
      if (!responsibility.text.trim()) {
        issues.push(`responsibility:${responsibility.id}`);
      }
    });
  }

  workMap.responsibilities.forEach((responsibility) => {
    const trimmed = responsibility.text.trim();

    if (trimmed && !validateResponsibility(trimmed).valid) {
      issues.push(`responsibility:${responsibility.id}`);
    }

    if (trimmed) {
      const writtenActivityCount = countWrittenActivities(responsibility);
      if (writtenActivityCount < MIN_ACTIVITIES_PER_RESPONSIBILITY) {
        issues.push(`coverage:activities:${responsibility.id}`);
      }
    }

    responsibility.activities.forEach((activity, activityIndex) => {
      const activityText = getActivityText(activity).trim();
      if (!activityText) {
        return;
      }

      if (!validateActivity(activityText).valid) {
        issues.push(`activity:${responsibility.id}:${activityIndex}`);
      }
    });
  });

  return issues;
}

function getValidationEntryForWarning(
  issue: FieldWarningKey,
  workMap: WorkMapData,
  fieldValidationState: FieldValidationState,
) {
  if (issue === "areas") return null;

  if (issue.startsWith("responsibility:")) {
    return fieldValidationState[issue] ?? null;
  }

  if (issue.startsWith("coverage:activities:")) {
    return fieldValidationState[issue] ?? null;
  }

  const match = /^activity:([^:]+):(\d+)$/.exec(issue);
  if (!match) return null;

  const responsibilityId = match[1];
  const activityIndex = Number(match[2]);
  const responsibility = workMap.responsibilities.find(
    (row) => row.id === responsibilityId,
  );
  const activity = responsibility?.activities[activityIndex];
  if (!activity) return null;

  return fieldValidationState[activityFieldKey(activity.id)] ?? null;
}

function filterBlockingWarningsForDisplay(
  validationIssues: FieldWarningKey[],
  workMap: WorkMapData,
  fieldValidationState: FieldValidationState,
  hasAreas: boolean,
): FieldWarningKey[] {
  return validationIssues.filter((issue) => {
    if (issue === "areas") return !hasAreas;

    const entry = getValidationEntryForWarning(
      issue,
      workMap,
      fieldValidationState,
    );
    return entry?.status === "needs_help";
  });
}

function collectActiveFieldKeys(workMap: WorkMapData) {
  const activeFieldKeys = new Set<string>();

  workMap.responsibilities.forEach((responsibility) => {
    activeFieldKeys.add(responsibilityFieldKey(responsibility.id));
    activeFieldKeys.add(activityCoverageFieldKey(responsibility.id));
    responsibility.activities.forEach((activity) => {
      activeFieldKeys.add(activityFieldKey(activity.id));
    });
  });

  return activeFieldKeys;
}

function clearStaleActivityCoverageEntry(
  key: string,
  nextState: FieldValidationState,
): void {
  const existing = nextState[key];
  if (existing?.lastMessageType !== "coverage") return;

  nextState[key] = {
    attempts: 0,
    lastTextReviewed: existing.lastTextReviewed,
    lastTextHash: existing.lastTextHash,
    lastMessageType: "none",
    status: "unchecked",
  };
}

function evaluateResponsibilityActivitiesCoverage(
  responsibility: WorkMapData["responsibilities"][number],
  nextState: FieldValidationState,
) {
  const key = activityCoverageFieldKey(responsibility.id);
  const coverageMessage = getResponsibilityActivitiesCoverageMessage(
    responsibility,
  );

  responsibility.activities.forEach((activity) => {
    clearStaleActivityCoverageEntry(
      activityFieldKey(activity.id),
      nextState,
    );
  });

  if (!coverageMessage) {
    delete nextState[key];
    return;
  }

  nextState[key] = evaluateCoverageFieldEntry("", nextState[key], coverageMessage);
}

function evaluateResponsibilityField(
  responsibility: WorkMapData["responsibilities"][number],
  workMap: WorkMapData,
  nextState: FieldValidationState,
  transaction: SaveValidationTransaction,
) {
  const key = responsibilityFieldKey(responsibility.id);
  const text = responsibility.text.trim();
  const coverageMessage = getResponsibilityCoverageMessage(
    responsibility,
    workMap,
  );

  if (!text) {
    nextState[key] = evaluateCoverageFieldEntry(
      text,
      nextState[key],
      coverageMessage,
    );
    return;
  }

  const valid = validateResponsibility(text).valid;
  const assistMessage = valid
    ? undefined
    : getResponsibilityAssistMessage(text);
  nextState[key] = evaluateSyntaxFieldOnSave(
    key,
    text,
    valid,
    nextState[key],
    assistMessage,
    transaction,
  );
}

function evaluateActivityField(
  activity: WorkMapData["responsibilities"][number]["activities"][number],
  nextState: FieldValidationState,
  transaction: SaveValidationTransaction,
) {
  const key = activityFieldKey(activity.id);
  const text = getActivityText(activity).trim();

  if (!text) {
    clearStaleActivityCoverageEntry(key, nextState);
    nextState[key] = evaluateCoverageFieldEntry(text, nextState[key]);
    return;
  }

  const valid = validateActivity(text).valid;
  const assistMessage = valid
    ? undefined
    : getActivityAssistMessage(text);
  nextState[key] = evaluateSyntaxFieldOnSave(
    key,
    text,
    valid,
    nextState[key],
    assistMessage,
    transaction,
  );
}

export function processWorkMapValidationOnSave(
  workMap: WorkMapData,
  hasAreas: boolean,
  transaction: SaveValidationTransaction = createSaveValidationTransaction(),
) {
  const validationIssues = buildFieldWarnings(workMap, hasAreas);
  const activeFieldKeys = collectActiveFieldKeys(workMap);
  const nextState: FieldValidationState = {};

  for (const key of activeFieldKeys) {
    const existing = workMap.fieldValidationState[key];
    if (existing) {
      nextState[key] = existing;
    }
  }

  workMap.responsibilities.forEach((responsibility) => {
    evaluateResponsibilityField(responsibility, workMap, nextState, transaction);
    evaluateResponsibilityActivitiesCoverage(responsibility, nextState);
  });

  workMap.responsibilities.forEach((responsibility) => {
    responsibility.activities.forEach((activity) => {
      evaluateActivityField(activity, nextState, transaction);
    });
  });

  const blockingIssues = [...activeFieldKeys].filter(
    (key) => nextState[key]?.status === "needs_help",
  );
  const warningIssues = [...activeFieldKeys].filter(
    (key) => nextState[key]?.status === "allowed_with_warning",
  );

  const fieldWarnings = filterBlockingWarningsForDisplay(
    validationIssues,
    workMap,
    nextState,
    hasAreas,
  );

  const canEnterReviewMode = hasAreas && blockingIssues.length === 0;

  const savedWithWarnings =
    canEnterReviewMode && warningIssues.length > 0;

  return {
    fieldValidationState: nextState,
    fieldWarnings,
    canEnterReviewMode,
    savedWithWarnings,
    validationIssues,
    globalBannerMessage: getSaveGlobalBannerMessage(workMap, hasAreas),
    hasCoverageGaps: hasCoverageGaps(workMap),
    hasSyntaxGaps: hasSyntaxGaps(workMap),
    saveTransactionId: transaction.transactionId,
  };
}

/** @internal Exported for regression tests — distinguishes coverage from syntax issues. */
export function isCoverageIssue(
  issue: FieldWarningKey,
  workMap: WorkMapData,
): boolean {
  return isCoverageFieldIssue(issue, workMap);
}
