import {
  normalizeStartPositionContext,
  type StartPositionContext,
} from "./start-position-context.ts";

export type { StartPositionContext };

export type SufficiencyStatus =
  | "empty"
  | "insufficient"
  | "sufficient"
  | "perfectible"
  | "accepted_with_warning";

export type RedactionObjectKind = "responsibility" | "activity";

export type AssistanceState =
  | "none"
  | "inline_hint"
  | "improvement_suggestion"
  | "insufficient_after_attempts";

export const ACCEPTED_WITH_WARNING_MESSAGE =
  "La redacción sigue siendo insuficiente estructuralmente, pero trabajaremos con esto lo mejor posible.";

export type RedactionObject = {
  fieldKey: string;
  kind: RedactionObjectKind;
  rawText: string;
  normalizedText: string;
  textHash: string;
  sufficiencyStatus: SufficiencyStatus;
  assistanceState: AssistanceState;
  meaningfulAttemptCount: number;
  lastAssistanceMessage?: string;
  lastEvaluationAt?: string;
};

export type WorkMapGuideKey =
  | "area"
  | "responsibility"
  | "activity"
  | "save"
  | "roleHelp";

export type WorkMapGuideSeenState = Record<WorkMapGuideKey, boolean>;

export type WorkMapActivity = {
  id: string;
  text: string;
  /** Optional explicit WorkMap detail; never inferred from text or Runtime/B0. */
  description?: string | null;
};

export type WorkMapResponsibility = {
  id: string;
  text: string;
  primaryArea?: string | null;
  areaAssignmentMode?:
    | "single_area_inherited"
    | "user_selected_from_declared_areas"
    | null;
  activities: WorkMapActivity[];
};

export type FieldValidationStatus =
  | "unchecked"
  | "inline_assisted"
  | "needs_help"
  | "valid"
  | "allowed_with_warning";

export type FieldMessageType = "inline" | "syntax" | "coverage" | "none";

export type FieldValidationEntry = {
  /** Formal syntax review cycles only (non-empty + invalid on save). */
  attempts: number;
  /** Normalized text from the last evaluation. */
  lastTextReviewed: string;
  /** Normalized text fingerprint for substantial-change detection. */
  lastTextHash?: string;
  /** True when blur showed inline assist still relevant. */
  inlineAssistShown?: boolean;
  /** Separates inline coach, formal syntax, and coverage guidance. */
  lastMessageType?: FieldMessageType;
  status: FieldValidationStatus;
  message?: string;
  /** ISO timestamp of the last formal save evaluation that affected attempts. */
  updatedAt?: string;
};

export type FieldValidationState = Record<string, FieldValidationEntry>;

export type WorkMapData = {
  selectedAreas: string[];
  customAreas: string[];
  responsibilities: WorkMapResponsibility[];
  guideSeen: WorkMapGuideSeenState;
  /** @deprecated Use fieldValidationState per unit; kept for persisted drafts. */
  saveAttempts: number;
  fieldValidationState: FieldValidationState;
  isSaved: boolean;
  isReviewMode: boolean;
  savedWithWarnings: boolean;
  /** Captured in start lobby; stored silently, not rendered in WorkMapIntake. */
  startPositionContext?: StartPositionContext;
};

export const MAX_FIELD_ASSIST_ATTEMPTS = 2;

export function mapFieldEntryToSufficiencyStatus(
  entry: FieldValidationEntry | undefined,
  text: string,
  semanticStatus: SufficiencyStatus,
): SufficiencyStatus {
  if (!normalizeFieldText(text)) {
    return "empty";
  }

  if (entry?.status === "allowed_with_warning") {
    return "accepted_with_warning";
  }

  return semanticStatus;
}

export function mapSufficiencyToAssistanceState(
  sufficiencyStatus: SufficiencyStatus,
  entry?: FieldValidationEntry,
): AssistanceState {
  if (entry?.status === "inline_assisted" || entry?.lastMessageType === "inline") {
    return "inline_hint";
  }

  switch (sufficiencyStatus) {
    case "insufficient":
      return entry?.lastMessageType === "syntax" ? "inline_hint" : "inline_hint";
    case "perfectible":
      return "improvement_suggestion";
    case "accepted_with_warning":
      return "insufficient_after_attempts";
    default:
      return "none";
  }
}

export function shouldEmitRedactionAssistance(
  sufficiencyStatus: SufficiencyStatus,
): boolean {
  return sufficiencyStatus === "insufficient" || sufficiencyStatus === "perfectible";
}

export function shouldIncrementMeaningfulAttempt(
  sufficiencyStatus: SufficiencyStatus,
): boolean {
  return sufficiencyStatus === "insufficient";
}

export function buildRedactionObject(
  fieldKey: string,
  kind: RedactionObjectKind,
  text: string,
  semanticStatus: SufficiencyStatus,
  entry?: FieldValidationEntry,
): RedactionObject {
  const normalizedText = normalizeFieldText(text);
  const textHash = computeFieldTextHash(text);
  const sufficiencyStatus = mapFieldEntryToSufficiencyStatus(
    entry,
    text,
    semanticStatus,
  );

  return {
    fieldKey,
    kind,
    rawText: text,
    normalizedText,
    textHash,
    sufficiencyStatus,
    assistanceState: mapSufficiencyToAssistanceState(sufficiencyStatus, entry),
    meaningfulAttemptCount: entry?.attempts ?? 0,
    lastAssistanceMessage: entry?.message,
    lastEvaluationAt: entry?.updatedAt,
  };
}

export function responsibilityFieldKey(responsibilityId: string) {
  return `responsibility:${responsibilityId}`;
}

export function activityFieldKey(activityId: string) {
  return `activity:${activityId}`;
}

export function activityCoverageFieldKey(responsibilityId: string) {
  return `coverage:activities:${responsibilityId}`;
}

export function isCoverageValidationEntry(
  entry: FieldValidationEntry | undefined,
): boolean {
  return entry?.lastMessageType === "coverage";
}

export function isSyntaxValidationEntry(
  entry: FieldValidationEntry | undefined,
): boolean {
  if (!entry) return false;
  if (
    entry.lastMessageType === "coverage" ||
    entry.lastMessageType === "inline"
  ) {
    return false;
  }
  if (entry.status === "inline_assisted") return false;
  return (
    entry.lastMessageType === "syntax" ||
    entry.status === "needs_help" ||
    entry.status === "allowed_with_warning"
  );
}

export function getFieldReviewLabel(
  entry: FieldValidationEntry | undefined,
): string | null {
  if (!entry) return null;

  if (
    entry.lastMessageType === "coverage" ||
    entry.lastMessageType === "inline" ||
    entry.status === "inline_assisted"
  ) {
    return null;
  }

  if (entry.status === "allowed_with_warning") {
    return "Revisión completada con advertencia";
  }

  if (entry.status === "needs_help") {
    if (entry.attempts === 1) return "Revisión 1/2";
    if (entry.attempts === 2) return "Revisión 2/2";
  }

  return null;
}

export function normalizeFieldText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function computeFieldTextHash(text: string): string {
  return normalizeFieldText(text).toLowerCase();
}

function hadSyntaxEvaluation(entry: FieldValidationEntry): boolean {
  return (
    entry.attempts > 0 ||
    entry.status === "needs_help" ||
    entry.status === "allowed_with_warning" ||
    entry.lastMessageType === "syntax"
  );
}

export function evaluateInlineFieldValidationEntry(
  currentText: string,
  isValid: boolean,
  existing?: FieldValidationEntry,
  assistMessage?: string,
): FieldValidationEntry {
  const normalized = normalizeFieldText(currentText);
  const textHash = computeFieldTextHash(currentText);
  const entry: FieldValidationEntry = existing ?? {
    attempts: 0,
    lastTextReviewed: "",
    status: "unchecked",
  };

  if (!normalized) {
    return {
      attempts: entry.attempts,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
      lastMessageType: "none",
      inlineAssistShown: false,
      status:
        entry.status === "valid" ||
        entry.status === "needs_help" ||
        entry.status === "allowed_with_warning"
          ? entry.status
          : "unchecked",
      message:
        entry.lastMessageType === "coverage" ? entry.message : undefined,
    };
  }

  const message = assistMessage?.trim() || undefined;

  if (isValid && message) {
    return {
      attempts: entry.attempts,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
      lastMessageType: "inline",
      inlineAssistShown: true,
      status: "inline_assisted",
      message,
      updatedAt: entry.updatedAt,
    };
  }

  if (isValid) {
    if (entry.lastMessageType === "inline" || entry.inlineAssistShown) {
      return {
        attempts: entry.attempts,
        lastTextReviewed: normalized,
        lastTextHash: textHash,
        lastMessageType: "none",
        inlineAssistShown: false,
        status: hadSyntaxEvaluation(entry) ? entry.status : "valid",
        message: undefined,
        updatedAt: entry.updatedAt,
      };
    }

    return {
      ...entry,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
    };
  }

  return {
    attempts: entry.attempts,
    lastTextReviewed: normalized,
    lastTextHash: textHash,
    lastMessageType: "inline",
    inlineAssistShown: true,
    status: "inline_assisted",
    message,
    updatedAt: entry.updatedAt,
  };
}

export function applyFieldTextChangeToValidationState(
  state: FieldValidationState,
  fieldKey: string,
  newText: string,
): FieldValidationState {
  const existing = state[fieldKey];
  if (!existing) return state;

  const normalized = normalizeFieldText(newText);
  const textHash = computeFieldTextHash(newText);

  if (existing.lastTextHash === textHash) {
    return state;
  }

  if (!normalized) {
    return {
      ...state,
      [fieldKey]: {
        attempts: 0,
        lastTextReviewed: normalized,
        lastTextHash: textHash,
        lastMessageType: "none",
        inlineAssistShown: false,
        status: "unchecked",
      },
    };
  }

  let next: FieldValidationEntry = {
    ...existing,
    lastTextReviewed: normalized,
    lastTextHash: textHash,
  };

  if (existing.lastMessageType === "inline" || existing.inlineAssistShown) {
    next = {
      ...next,
      lastMessageType: hadSyntaxEvaluation(existing) ? "syntax" : "none",
      inlineAssistShown: false,
      message: hadSyntaxEvaluation(existing) ? existing.message : undefined,
      status: hadSyntaxEvaluation(existing) ? existing.status : "unchecked",
    };
  }

  return {
    ...state,
    [fieldKey]: next,
  };
}

export function evaluateCoverageFieldEntry(
  currentText: string,
  existing?: FieldValidationEntry,
  coverageMessage?: string,
): FieldValidationEntry {
  const normalized = normalizeFieldText(currentText);
  const textHash = computeFieldTextHash(currentText);
  const entry: FieldValidationEntry = existing ?? {
    attempts: 0,
    lastTextReviewed: "",
    status: "unchecked",
  };
  const message = coverageMessage?.trim() || undefined;

  return {
    attempts: entry.attempts,
    lastTextReviewed: normalized,
    lastTextHash: textHash,
    lastMessageType: "coverage",
    status: message ? "needs_help" : entry.status === "valid" ? "valid" : "unchecked",
    message,
  };
}

export function evaluateFieldValidationEntry(
  currentText: string,
  isValid: boolean,
  existing?: FieldValidationEntry,
  assistMessage?: string,
): FieldValidationEntry {
  const normalized = normalizeFieldText(currentText);
  const textHash = computeFieldTextHash(currentText);
  const entry: FieldValidationEntry = existing ?? {
    attempts: 0,
    lastTextReviewed: "",
    status: "unchecked",
  };

  const message = assistMessage?.trim() || undefined;

  if (isValid && message) {
    return {
      attempts: 0,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
      lastMessageType: "inline",
      inlineAssistShown: true,
      status: "inline_assisted",
      message,
    };
  }

  if (isValid) {
    return {
      attempts: 0,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
      lastMessageType: "none",
      inlineAssistShown: false,
      status: "valid",
    };
  }

  const updatedAt = new Date().toISOString();

  if (entry.attempts < MAX_FIELD_ASSIST_ATTEMPTS) {
    return {
      attempts: entry.attempts + 1,
      lastTextReviewed: normalized,
      lastTextHash: textHash,
      lastMessageType: "syntax",
      inlineAssistShown: false,
      status: "needs_help",
      message,
      updatedAt,
    };
  }

  return {
    attempts: entry.attempts + 1,
    lastTextReviewed: normalized,
    lastTextHash: textHash,
    lastMessageType: "syntax",
    inlineAssistShown: false,
    status: "allowed_with_warning",
    message: ACCEPTED_WITH_WARNING_MESSAGE,
    updatedAt,
  };
}

function normalizeFieldValidationState(value: unknown): FieldValidationState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const normalized: FieldValidationState = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const candidate = raw as Partial<FieldValidationEntry>;
    const status = candidate.status;
    if (
      status !== "unchecked" &&
      status !== "inline_assisted" &&
      status !== "needs_help" &&
      status !== "valid" &&
      status !== "allowed_with_warning"
    ) {
      continue;
    }

    const entry: FieldValidationEntry = {
      attempts:
        typeof candidate.attempts === "number" && candidate.attempts >= 0
          ? candidate.attempts
          : 0,
      lastTextReviewed:
        typeof candidate.lastTextReviewed === "string"
          ? candidate.lastTextReviewed
          : "",
      status,
    };
    if (typeof candidate.lastTextHash === "string" && candidate.lastTextHash) {
      entry.lastTextHash = candidate.lastTextHash;
    }
    if (typeof candidate.inlineAssistShown === "boolean") {
      entry.inlineAssistShown = candidate.inlineAssistShown;
    }
    if (
      candidate.lastMessageType === "inline" ||
      candidate.lastMessageType === "syntax" ||
      candidate.lastMessageType === "coverage" ||
      candidate.lastMessageType === "none"
    ) {
      entry.lastMessageType = candidate.lastMessageType;
    }
    if (typeof candidate.updatedAt === "string" && candidate.updatedAt) {
      entry.updatedAt = candidate.updatedAt;
    }
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      entry.message = candidate.message;
    }
    normalized[key] = entry;
  }

  return normalized;
}

export function resetFieldValidationEntry(
  state: FieldValidationState,
  fieldKey: string,
): FieldValidationState {
  if (!state[fieldKey]) return state;
  return {
    ...state,
    [fieldKey]: {
      attempts: 0,
      lastTextReviewed: "",
      lastTextHash: undefined,
      lastMessageType: "none",
      status: "unchecked",
    },
  };
}

export function shouldShowFieldAssist(
  entry: FieldValidationEntry | undefined,
  saveAttemptTriggered: boolean,
  hasContent = true,
): boolean {
  if (!saveAttemptTriggered || !entry || !hasContent) return false;
  if (
    entry.lastMessageType === "coverage" ||
    entry.lastMessageType === "inline"
  ) {
    return false;
  }
  if (entry.status === "inline_assisted") return false;
  return (
    entry.status === "needs_help" || entry.status === "allowed_with_warning"
  );
}

/**
 * Inline coach hint below the field after blur. Never shows Revisión labels.
 */
export function shouldShowInlineFieldHint(
  entry: FieldValidationEntry | undefined,
  formalAssistVisible: boolean,
): boolean {
  if (formalAssistVisible) return false;
  if (!entry?.inlineAssistShown) return false;
  return entry.lastMessageType === "inline" && Boolean(entry.message?.trim());
}

/**
 * @deprecated Prefer shouldShowInlineFieldHint with persisted inline state.
 */
export function shouldShowFieldSoftHint(options: {
  fieldTouched: boolean;
  hasContent: boolean;
  isLiveValid: boolean;
  assistVisible: boolean;
}): boolean {
  const { fieldTouched, hasContent, isLiveValid, assistVisible } = options;
  return fieldTouched && hasContent && !isLiveValid && !assistVisible;
}

export type ActivityDeclaredContext = {
  declared_area_context: string;
  declared_responsibility_context: string;
  responsibility_id: string;
  area_status: "declared_unconfirmed";
  responsibility_status: "declared_unconfirmed";
};

export function initialGuideSeenState(): WorkMapGuideSeenState {
  return {
    roleHelp: false,
    area: false,
    responsibility: false,
    activity: false,
    save: false,
  };
}

export function isIntroGuideComplete(guideSeen: WorkMapGuideSeenState) {
  return (
    guideSeen.area &&
    guideSeen.responsibility &&
    guideSeen.activity &&
    guideSeen.save
  );
}

export function createResponsibilityId(index: number) {
  return `resp-${Date.now()}-${index}`;
}

export function createActivityId(index: number) {
  return `act-${Date.now()}-${index}`;
}

export function createEmptyActivity(index = 0): WorkMapActivity {
  return { id: createActivityId(index), text: "" };
}

export function getActivityText(activity: WorkMapActivity | string): string {
  return typeof activity === "string" ? activity : activity.text;
}

function normalizeActivityEntry(
  activity: unknown,
  index: number,
): WorkMapActivity {
  if (typeof activity === "string") {
    return { id: createActivityId(index), text: activity };
  }

  if (activity && typeof activity === "object") {
    const candidate = activity as Partial<WorkMapActivity>;
    return {
      id:
        typeof candidate.id === "string"
          ? candidate.id
          : createActivityId(index),
      text: typeof candidate.text === "string" ? candidate.text : "",
    };
  }

  return createEmptyActivity(index);
}

function collapseConsecutiveEmptyActivities(
  activities: WorkMapActivity[],
): WorkMapActivity[] {
  const collapsed: WorkMapActivity[] = [];

  for (const activity of activities) {
    const isEmpty = !activity.text.trim();
    if (
      isEmpty &&
      collapsed.length > 0 &&
      !collapsed[collapsed.length - 1].text.trim()
    ) {
      continue;
    }
    collapsed.push(activity);
  }

  return collapsed.length > 0 ? collapsed : [createEmptyActivity(0)];
}

function normalizeGuideSeen(value: unknown): WorkMapGuideSeenState {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as Partial<WorkMapGuideSeenState>;
    return {
      roleHelp: Boolean(candidate.roleHelp),
      area: Boolean(candidate.area),
      responsibility: Boolean(candidate.responsibility),
      activity: Boolean(candidate.activity),
      save: Boolean(candidate.save),
    };
  }

  if (value === true) {
    return {
      roleHelp: true,
      area: true,
      responsibility: true,
      activity: true,
      save: true,
    };
  }

  return initialGuideSeenState();
}

export function normalizeWorkMapData(value: unknown): WorkMapData | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<WorkMapData>;
  if (
    !Array.isArray(candidate.selectedAreas) ||
    !Array.isArray(candidate.customAreas) ||
    !Array.isArray(candidate.responsibilities)
  ) {
    return null;
  }

  const responsibilities = candidate.responsibilities
    .map((responsibility, responsibilityIndex) => {
      if (!responsibility || typeof responsibility !== "object") return null;
      const row = responsibility as Partial<WorkMapResponsibility>;
      if (typeof row.id !== "string" || typeof row.text !== "string") {
        return null;
      }
      if (!Array.isArray(row.activities)) return null;

      return {
        id: row.id,
        text: row.text,
        primaryArea:
          typeof row.primaryArea === "string" && row.primaryArea.trim()
            ? row.primaryArea.trim()
            : null,
        areaAssignmentMode:
          row.areaAssignmentMode === "single_area_inherited" ||
          row.areaAssignmentMode === "user_selected_from_declared_areas"
            ? row.areaAssignmentMode
            : null,
        activities: collapseConsecutiveEmptyActivities(
          row.activities.map((activity, activityIndex) =>
            normalizeActivityEntry(activity, activityIndex),
          ),
        ),
      };
    })
    .filter(Boolean) as WorkMapResponsibility[];

  if (!responsibilities.length) return null;

  const startPositionContext = normalizeStartPositionContext(
    candidate.startPositionContext,
  );

  return {
    selectedAreas: candidate.selectedAreas.filter(
      (area): area is string => typeof area === "string",
    ),
    customAreas: candidate.customAreas.filter(
      (area): area is string => typeof area === "string",
    ),
    responsibilities,
    guideSeen: normalizeGuideSeen(candidate.guideSeen),
    saveAttempts:
      typeof candidate.saveAttempts === "number" ? candidate.saveAttempts : 0,
    fieldValidationState: normalizeFieldValidationState(
      candidate.fieldValidationState,
    ),
    isSaved: Boolean(candidate.isSaved),
    isReviewMode:
      typeof candidate.isReviewMode === "boolean"
        ? candidate.isReviewMode
        : Boolean(candidate.isSaved),
    savedWithWarnings: Boolean(candidate.savedWithWarnings),
    ...(startPositionContext ? { startPositionContext } : {}),
  };
}

export function createEmptyWorkMap(): WorkMapData {
  return {
    selectedAreas: [],
    customAreas: [],
    responsibilities: [
      {
        id: createResponsibilityId(0),
        text: "",
        primaryArea: null,
        areaAssignmentMode: null,
        activities: [createEmptyActivity(0)],
      },
      {
        id: createResponsibilityId(1),
        text: "",
        primaryArea: null,
        areaAssignmentMode: null,
        activities: [createEmptyActivity(1)],
      },
    ],
    guideSeen: initialGuideSeenState(),
    saveAttempts: 0,
    fieldValidationState: {},
    isSaved: false,
    isReviewMode: false,
    savedWithWarnings: false,
  };
}

export function buildDeclaredAreaContext(workMap: WorkMapData) {
  return [...workMap.selectedAreas, ...workMap.customAreas]
    .map((area) => area.trim())
    .filter(Boolean)
    .join(", ");
}
