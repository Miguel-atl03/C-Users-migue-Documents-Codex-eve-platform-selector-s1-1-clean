"use client";

import { SheetMotion } from "@/components/eve-worksheet/SheetMotion";
import {
  isCanvasWorkMapArea,
  normalizeCanvasWorkMapAreaLabel,
} from "@/config/canvas-work-map-areas";
import {
  getWorkMapCatalogInscriptionLayout,
  listWorkMapCatalogPrimaryAreas,
  listWorkMapCatalogSecondaryAreas,
  WORKMAP_CATALOG_TOGGLE_INSCRIPTION,
  WORKMAP_CATALOG_UNLISTED_INSCRIPTION,
  WORKMAP_CATALOG_UNLISTED_WHISPER,
  WORKMAP_MAX_DECLARED_AREAS,
  WORKMAP_UBICACION_QUESTION,
  WORKMAP_UBICACION_WHISPER,
  type WorkMapCatalogView,
} from "@/config/workmap-catalog-layout";
import { OTHER_AREA_CHIP_LABEL, UNLISTED_ROLE_CHIP_LABEL } from "@/config/work-map-areas";
import {
  getWorkMapRoleRedactionPlaceholders,
  isWorkMapRoleRedactionExampleVisible,
} from "@/config/workmap-role-redaction-examples";
import {
  EMPTY_START_POSITION_CONTEXT,
  type StartPositionContext,
} from "@/domain/start-position-context";
import {
  activityFieldKey,
  applyFieldTextChangeToValidationState,
  createEmptyActivity,
  createResponsibilityId,
  evaluateFieldValidationEntry,
  evaluateInlineFieldValidationEntry,
  getActivityText,
  responsibilityFieldKey,
  shouldEmitRedactionAssistance,
  shouldShowFieldAssist,
  shouldShowInlineFieldHint,
  type FieldValidationEntry,
  type WorkMapActivity,
  type WorkMapData,
  type WorkMapResponsibility,
} from "@/domain/local-work-map";
import {
  classifyActivitySufficiency,
  getActivityAssistMessage,
} from "@/services/local-work-map-activity-validation";
import {
  clearWorkMapDraft,
  readWorkMapDraftOrEmpty,
  writeWorkMapDraft,
} from "@/services/work-map-draft";
import {
  classifyResponsibilitySufficiency,
  getResponsibilityAssistMessage,
} from "@/services/local-work-map-responsibility-validation";
import { COVERAGE_MESSAGES } from "@/services/local-work-map-save-validation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type TextareaHTMLAttributes,
} from "react";
import {
  WORKMAP_ROLE_HELP_CANVAS_VARIANT,
} from "@/config/workmap-role-help-copy";
import type { WorkMapEditorProps } from "@/components/work-map/WorkMapEditor";
import styles from "./local-canvas-workmap.module.css";
import { WorkMapRoleHelpPortal } from "./WorkMapRoleHelpPortal";
import { buildWorkMapRoleHelpMaterialityShards } from "./workmap-role-help-materiality";

export type LocalCanvasWorkMapBuilderProps = WorkMapEditorProps & {
  /** Tighter top band when WorkMap follows Estado A on the continuous sheet. */
  continuousSheet?: boolean;
};

type FieldHintTone = "soft" | "review" | "warning" | "coverage";

type FieldHint = {
  message: string;
  tone: FieldHintTone;
};

const CATALOG_LAYOUT_CLASS: Record<
  ReturnType<typeof getWorkMapCatalogInscriptionLayout>,
  string
> = {
  catM1: styles.catM1,
  catM2: styles.catM2,
  catM3: styles.catM3,
  catM4: styles.catM4,
  catM5: styles.catM5,
  catM6: styles.catM6,
  catM7: styles.catM7,
  catM8: styles.catM8,
  catM9: styles.catM9,
  catM10: styles.catM10,
  catM11: styles.catM11,
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function areasMatch(left: string, right: string) {
  return normalizeCanvasWorkMapAreaLabel(left) === normalizeCanvasWorkMapAreaLabel(right);
}

function getDeclaredWorkAreas(workMap: WorkMapData) {
  return [
    ...workMap.selectedAreas.map(normalizeCanvasWorkMapAreaLabel),
    ...workMap.customAreas,
  ]
    .map((area) => area.trim())
    .filter(Boolean);
}

function ensureTwoActivities(activities: WorkMapActivity[]): WorkMapActivity[] {
  const next = [...activities];
  while (next.length < 2) {
    next.push(createEmptyActivity(next.length));
  }
  return next;
}

function createResponsibilityForArea(
  area: string,
  index: number,
): WorkMapResponsibility {
  return {
    id: createResponsibilityId(index),
    text: "",
    primaryArea: area,
    areaAssignmentMode: "user_selected_from_declared_areas",
    activities: ensureTwoActivities([createEmptyActivity(0), createEmptyActivity(1)]),
  };
}

/**
 * UX rule (canvas freeze): each proclaimed area opens exactly one responsibility
 * with two activity slots. User may add more responsibilities later.
 */
function responsibilitiesForNewArea(
  current: WorkMapData,
  area: string,
): WorkMapResponsibility[] {
  const declared = getDeclaredWorkAreas(current);
  const kept = current.responsibilities.filter(
    (responsibility) =>
      responsibility.primaryArea &&
      declared.includes(responsibility.primaryArea),
  );
  const unassigned = current.responsibilities.filter(
    (responsibility) =>
      !responsibility.primaryArea ||
      !declared.includes(responsibility.primaryArea),
  );

  if (declared.length === 0 && unassigned.length > 0) {
    const seed = unassigned[0];
    return [
      {
        ...seed,
        primaryArea: area,
        areaAssignmentMode: "user_selected_from_declared_areas" as const,
        activities: ensureTwoActivities(seed.activities),
      },
    ];
  }

  return [...kept, createResponsibilityForArea(area, kept.length)];
}

function resolveFieldHint(
  entry: FieldValidationEntry | undefined,
  advanceAttempted: boolean,
): FieldHint | null {
  const formalVisible = shouldShowFieldAssist(
    entry,
    advanceAttempted,
    Boolean(entry?.lastTextReviewed?.trim() || entry?.message),
  );

  if (formalVisible && entry?.message?.trim()) {
    return {
      message: entry.message,
      tone: entry.status === "allowed_with_warning" ? "warning" : "review",
    };
  }

  if (shouldShowInlineFieldHint(entry, formalVisible) && entry?.message?.trim()) {
    return {
      message: entry.message,
      tone: "soft",
    };
  }

  return null;
}

function getActivityCoverageMessage(
  responsibility: WorkMapResponsibility,
): string | undefined {
  if (!responsibility.text.trim()) return undefined;
  const written = responsibility.activities.filter((activity) =>
    getActivityText(activity).trim(),
  ).length;
  if (written === 0) return COVERAGE_MESSAGES.needTwoActivities;
  if (written === 1) return COVERAGE_MESSAGES.needOneMoreActivity;
  return undefined;
}

function getResponsibilityOrdinalWord(index: number) {
  return (
    ["primer", "segunda", "tercera", "cuarta", "quinta", "sexta"][index] ??
    `${index + 1}`
  );
}

const WORKMAP_REDACTION_MAX_HEIGHT_PX = 160;

function syncWorkmapRedactionHeight(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  const nextHeight = Math.min(element.scrollHeight, WORKMAP_REDACTION_MAX_HEIGHT_PX);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY =
    element.scrollHeight > WORKMAP_REDACTION_MAX_HEIGHT_PX ? "auto" : "hidden";
}

function chunkResponsibilityRows<T>(items: readonly T[], rowSize: number): T[][] {
  if (rowSize <= 0 || items.length === 0) return [];
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += rowSize) {
    rows.push(items.slice(index, index + rowSize));
  }
  return rows;
}

function WorkmapRedactionTextarea({
  className,
  onChange,
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    syncWorkmapRedactionHeight(textareaRef.current);
  }, [value]);

  return (
    <textarea
      {...props}
      className={cx(styles.workmapRedactionField, className)}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        syncWorkmapRedactionHeight(event.currentTarget);
        onChange?.(event);
      }}
      ref={textareaRef}
      rows={2}
      value={value}
    />
  );
}

/** Min 1 complete responsibility (text + 2 activities) per proclaimed area. */
function isResponsibilityMaterial(responsibility: WorkMapResponsibility) {
  if (responsibility.text.trim()) return true;
  return responsibility.activities.some((activity) =>
    getActivityText(activity).trim(),
  );
}

function isResponsibilityComplete(responsibility: WorkMapResponsibility) {
  return (
    responsibility.text.trim().length > 0 &&
    responsibility.activities.filter((activity) => getActivityText(activity).trim())
      .length >= 2
  );
}

function isStructureReady(workMap: WorkMapData) {
  const areas = getDeclaredWorkAreas(workMap);
  if (areas.length === 0) return false;

  return areas.every((area) => {
    const areaResponsibilities = workMap.responsibilities.filter(
      (responsibility) =>
        responsibility.primaryArea &&
        areasMatch(responsibility.primaryArea, area),
    );
    const material = areaResponsibilities.filter(isResponsibilityMaterial);
    if (material.length === 0) return false;

    // Empty shells or in-progress rows must not block when one row is complete.
    return material.some(isResponsibilityComplete);
  });
}

function padWorkMapActivitySlots(workMap: WorkMapData): WorkMapData {
  let changed = false;
  const responsibilities = workMap.responsibilities.map((responsibility) => {
    if (responsibility.activities.length >= 2) return responsibility;
    changed = true;
    return {
      ...responsibility,
      activities: ensureTwoActivities(responsibility.activities),
    };
  });
  return changed ? { ...workMap, responsibilities } : workMap;
}

/** Drop proclaimed areas that have no responsibility row (stale draft hygiene). */
function pruneUnlinkedDeclaredAreas(workMap: WorkMapData): WorkMapData {
  const hasResponsibilityFor = (area: string) =>
    workMap.responsibilities.some(
      (responsibility) =>
        responsibility.primaryArea && areasMatch(responsibility.primaryArea, area),
    );

  return {
    ...workMap,
    selectedAreas: workMap.selectedAreas.filter((area) =>
      hasResponsibilityFor(area),
    ),
    customAreas: workMap.customAreas.filter((area) => hasResponsibilityFor(area)),
  };
}

/** Canvas path: drop legacy dual empty seeds until an area is proclaimed. */
function normalizeCanvasWorkMapSeed(workMap: WorkMapData): WorkMapData {
  const declared = getDeclaredWorkAreas(workMap);
  if (declared.length > 0) {
    return padWorkMapActivitySlots(pruneUnlinkedDeclaredAreas(workMap));
  }

  const hasMaterial = workMap.responsibilities.some(
    (responsibility) =>
      responsibility.text.trim() ||
      responsibility.activities.some((activity) =>
        getActivityText(activity).trim(),
      ),
  );

  if (hasMaterial) return padWorkMapActivitySlots(workMap);

  return padWorkMapActivitySlots({
    ...workMap,
    responsibilities: [],
  });
}

function isPredefinedArea(area: string) {
  return isCanvasWorkMapArea(area);
}

/** Writing-assistance whispers sit directly under the active field, not between sections. */
function WorkmapFieldAssistWhisper({ hint }: { hint: FieldHint | null }) {
  if (!hint || hint.tone === "coverage") return null;
  return (
    <p
      className={cx(
        styles.workmapFieldAssist,
        hint.tone === "review" && styles.workmapFieldAssistReview,
        hint.tone === "warning" && styles.workmapFieldAssistWarning,
        hint.tone === "soft" && styles.workmapFieldAssistSoft,
      )}
      role="status"
    >
      {hint.message}
    </p>
  );
}

function WorkmapCoverageWhisper({ hint }: { hint: FieldHint | null }) {
  if (!hint || hint.tone !== "coverage") return null;
  return (
    <p className={styles.workmapFieldHintCoverage} role="status">
      {hint.message}
    </p>
  );
}

function WorkmapRoleFields({
  activityCoverageHint,
  activityHints,
  activities,
  area,
  areaResponsibilityIndex,
  disabled,
  isLastAreaResponsibility,
  onActivityAdd,
  onActivityBlur,
  onActivityChange,
  onActivityRemove,
  onResponsibilityAdd,
  onResponsibilityBlur,
  onResponsibilityChange,
  onResponsibilityRemove,
  onRoleFieldFocus,
  responsibilityHint,
  responsibilityValue,
}: {
  activityCoverageHint: string | null;
  activityHints: Array<FieldHint | null>;
  activities: WorkMapActivity[];
  area: string;
  areaResponsibilityIndex: number;
  disabled?: boolean;
  isLastAreaResponsibility: boolean;
  onActivityAdd: () => void;
  onActivityBlur: (activityId: string, text: string) => void;
  onActivityChange: (activityId: string, text: string) => void;
  onActivityRemove: (activityId: string) => void;
  onResponsibilityAdd: () => void;
  onResponsibilityBlur: (text: string) => void;
  onResponsibilityChange: (text: string) => void;
  onResponsibilityRemove: () => void;
  onRoleFieldFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  responsibilityHint: FieldHint | null;
  responsibilityValue: string;
}) {
  const responsibilityHeading = `Tu ${getResponsibilityOrdinalWord(areaResponsibilityIndex)} responsabilidad en ${area}`;
  const redactionPlaceholders = getWorkMapRoleRedactionPlaceholders(
    area,
    areaResponsibilityIndex,
  );
  const showRoleRedactionExample = isWorkMapRoleRedactionExampleVisible(
    area,
    areaResponsibilityIndex,
  );

  return (
    <div className={styles.workmapRoleFields}>
      <h3 className={styles.workmapRoleQuestion}>{responsibilityHeading}</h3>
      <div className={styles.workmapRedactionFieldBlock}>
        <WorkmapRedactionTextarea
          aria-label={`Responsabilidad ${areaResponsibilityIndex + 1} para ${area}`}
          className={cx(
            styles.workmapRoleResponse,
            !responsibilityValue.trim() && styles.workmapRoleResponseEmpty,
            !responsibilityValue.trim() &&
              showRoleRedactionExample &&
              styles.workmapRoleRedactionExample,
            responsibilityHint?.tone === "review" && styles.workmapFieldNeedsReview,
          )}
          disabled={disabled}
          onBlur={(event) => onResponsibilityBlur(event.target.value)}
          onChange={(event) => onResponsibilityChange(event.target.value)}
          onFocus={onRoleFieldFocus}
          placeholder={redactionPlaceholders.responsibility}
          value={responsibilityValue}
        />
        <WorkmapFieldAssistWhisper hint={responsibilityHint} />
      </div>
      {areaResponsibilityIndex > 0 ? (
        <button
          className={styles.workmapRemoveAction}
          disabled={disabled}
          onClick={onResponsibilityRemove}
          type="button"
        >
          Eliminar responsabilidad
        </button>
      ) : null}

      <p className={styles.workmapRoleActsQuestion}>Qué haces para cumplirlo</p>
      <div className={styles.workmapActivityStack}>
        {activities.map((activity, activityIndex) => (
          <div className={styles.workmapActivityItem} key={activity.id}>
            <div className={styles.workmapRedactionFieldBlock}>
              <WorkmapRedactionTextarea
                aria-label={`Actividad ${activityIndex + 1} de responsabilidad ${areaResponsibilityIndex + 1} para ${area}`}
                className={cx(
                  styles.workmapRoleActivity,
                  !getActivityText(activity).trim() && styles.workmapRoleActivityEmpty,
                  !getActivityText(activity).trim() &&
                    showRoleRedactionExample &&
                    styles.workmapRoleRedactionExample,
                  activityHints[activityIndex]?.tone === "review" &&
                    styles.workmapFieldNeedsReview,
                )}
                disabled={disabled}
                onBlur={(event) => onActivityBlur(activity.id, event.target.value)}
                onChange={(event) => onActivityChange(activity.id, event.target.value)}
                onFocus={onRoleFieldFocus}
                placeholder={
                  redactionPlaceholders.activities[activityIndex] ??
                  `${activityIndex + 1}. Redacta una actividad concreta de tu trabajo`
                }
                value={getActivityText(activity)}
              />
              <WorkmapFieldAssistWhisper hint={activityHints[activityIndex] ?? null} />
            </div>
            {activityIndex >= 2 && activities.length > 2 ? (
              <button
                className={styles.workmapRemoveAction}
                disabled={disabled}
                onClick={() => onActivityRemove(activity.id)}
                type="button"
              >
                Eliminar actividad
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <WorkmapCoverageWhisper
        hint={
          activityCoverageHint
            ? { message: activityCoverageHint, tone: "coverage" }
            : null
        }
      />
      <div className={styles.workmapInlineActions}>
        <button
          className={styles.workmapRoleMore}
          disabled={disabled}
          onClick={onActivityAdd}
          type="button"
        >
          + Agregar otra actividad
        </button>
        {isLastAreaResponsibility ? (
          <button
            className={styles.workmapRoleMore}
            disabled={disabled}
            onClick={onResponsibilityAdd}
            type="button"
          >
            + Agregar otra responsabilidad para {area}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Freeze WorkmapBuilderSection presentation wired to WorkMapData authority.
 * No sidebar chrome — continuous sheet bands only.
 */
export function LocalCanvasWorkMapBuilder({
  disabled = false,
  sessionId = null,
  initialWorkMap,
  onSave,
  onContinue,
  startPositionContext = EMPTY_START_POSITION_CONTEXT,
  continuousSheet = false,
}: LocalCanvasWorkMapBuilderProps) {
  const [workMap, setWorkMap] = useState<WorkMapData>(() => {
    if (initialWorkMap) return normalizeCanvasWorkMapSeed(initialWorkMap);
    return normalizeCanvasWorkMapSeed(readWorkMapDraftOrEmpty(sessionId));
  });
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [customAreaPending, setCustomAreaPending] = useState(false);
  const [catalogView, setCatalogView] = useState<WorkMapCatalogView>("primary");
  const [advanceAttempted, setAdvanceAttempted] = useState(false);
  const [showCoverageNotes, setShowCoverageNotes] = useState(false);
  const [advanceStatusNote, setAdvanceStatusNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roleHelpOpen, setRoleHelpOpen] = useState(false);
  const isSavingRef = useRef(false);
  const latestWorkMapRef = useRef(workMap);
  latestWorkMapRef.current = workMap;

  useEffect(() => {
    latestWorkMapRef.current = workMap;
  }, [workMap]);

  const declaredAreas = getDeclaredWorkAreas(workMap);
  const catalogAreas =
    catalogView === "primary"
      ? listWorkMapCatalogPrimaryAreas(declaredAreas)
      : listWorkMapCatalogSecondaryAreas(declaredAreas);
  const atMaxAreas = declaredAreas.length >= WORKMAP_MAX_DECLARED_AREAS;

  useEffect(() => {
    if (!initialWorkMap) return;
    const next = initialWorkMap;
    queueMicrotask(() => {
      setWorkMap((current) => {
        if (
          current.isSaved &&
          current.isReviewMode &&
          (!next.isSaved || !next.isReviewMode)
        ) {
          return current;
        }
        return normalizeCanvasWorkMapSeed(next);
      });
    });
  }, [initialWorkMap]);

  useEffect(() => {
    writeWorkMapDraft(workMap, sessionId);
  }, [sessionId, workMap]);

  useEffect(() => {
    const persistLatestDraft = () => {
      writeWorkMapDraft(latestWorkMapRef.current, sessionId);
    };
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        persistLatestDraft();
      }
    };

    window.addEventListener("pagehide", persistLatestDraft);
    window.addEventListener("beforeunload", persistLatestDraft);
    document.addEventListener("visibilitychange", persistWhenHidden);
    return () => {
      window.removeEventListener("pagehide", persistLatestDraft);
      window.removeEventListener("beforeunload", persistLatestDraft);
      document.removeEventListener("visibilitychange", persistWhenHidden);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!startPositionContext) return;
    const nextContext = startPositionContext;
    queueMicrotask(() => {
      setWorkMap((current) => {
        const existing = current.startPositionContext;
        if (
          existing &&
          existing.participationPlace === nextContext.participationPlace &&
          existing.participationPlaceOther === nextContext.participationPlaceOther &&
          existing.decisionProximity === nextContext.decisionProximity
        ) {
          return current;
        }
        return { ...current, startPositionContext: { ...nextContext } };
      });
    });
  }, [startPositionContext]);

  function markGuideSeen(
    key: keyof WorkMapData["guideSeen"],
  ) {
    setWorkMap((current) =>
      current.guideSeen[key]
        ? current
        : {
            ...current,
            guideSeen: { ...current.guideSeen, [key]: true },
          },
    );
  }

  function openRoleHelp() {
    setRoleHelpOpen(true);
  }

  function dismissRoleHelp() {
    markGuideSeen("roleHelp");
    setRoleHelpOpen(false);
  }

  function requireRoleHelpAcknowledgment(): boolean {
    if (latestWorkMapRef.current.guideSeen.roleHelp) {
      return true;
    }
    openRoleHelp();
    return false;
  }

  function handleRoleHelpToggle() {
    if (roleHelpOpen) {
      dismissRoleHelp();
      return;
    }
    openRoleHelp();
  }

  function handleRoleFieldFocus(event: FocusEvent<HTMLTextAreaElement>) {
    if (!latestWorkMapRef.current.guideSeen.roleHelp) {
      event.currentTarget.blur();
      openRoleHelp();
      return;
    }
    if (roleHelpOpen) {
      setRoleHelpOpen(false);
    }
  }

  const roleHelpAcknowledged = workMap.guideSeen.roleHelp;

  const roleHelpMaterialityShards = buildWorkMapRoleHelpMaterialityShards({
    catalogAreas,
    declaredAreas,
    activeArea: declaredAreas[0] ?? null,
    footerWhisper:
      advanceStatusNote ??
      "Escribe al menos una responsabilidad y dos actividades por cada área elegida.",
  });

  function evaluateFieldBlur(
    fieldKey: string,
    text: string,
    kind: "responsibility" | "activity",
  ) {
    if (isSavingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const sufficiency =
      kind === "responsibility"
        ? classifyResponsibilitySufficiency(trimmed)
        : classifyActivitySufficiency(trimmed);
    const isValid =
      sufficiency === "sufficient" || sufficiency === "perfectible";
    const assistMessage = shouldEmitRedactionAssistance(sufficiency)
      ? kind === "responsibility"
        ? getResponsibilityAssistMessage(trimmed)
        : getActivityAssistMessage(trimmed)
      : undefined;

    setWorkMap((current) => ({
      ...current,
      fieldValidationState: {
        ...current.fieldValidationState,
        [fieldKey]: evaluateInlineFieldValidationEntry(
          trimmed,
          isValid,
          current.fieldValidationState[fieldKey],
          assistMessage,
        ),
      },
    }));
  }

  function toggleArea(area: string) {
    const current = latestWorkMapRef.current;
    const inSelected = current.selectedAreas.some((item) => areasMatch(item, area));
    const inCustom = current.customAreas.some((item) => areasMatch(item, area));
    const isSelected = inSelected || inCustom;

    if (!isSelected && !requireRoleHelpAcknowledgment()) {
      return;
    }

    markGuideSeen("area");
    setAdvanceStatusNote(null);
    setWorkMap((current) => {
      const inSelected = current.selectedAreas.some((item) => areasMatch(item, area));
      const inCustom = current.customAreas.some((item) => areasMatch(item, area));
      const isSelected = inSelected || inCustom;

      if (isSelected) {
        return {
          ...current,
          isSaved: false,
          isReviewMode: false,
          savedWithWarnings: false,
          selectedAreas: current.selectedAreas.filter(
            (item) => !areasMatch(item, area),
          ),
          customAreas: current.customAreas.filter((item) => !areasMatch(item, area)),
          responsibilities: current.responsibilities.filter(
            (responsibility) =>
              !responsibility.primaryArea || !areasMatch(responsibility.primaryArea, area),
          ),
        };
      }

      if (getDeclaredWorkAreas(current).length >= WORKMAP_MAX_DECLARED_AREAS) {
        return current;
      }

      if (isPredefinedArea(area)) {
        const normalizedArea = normalizeCanvasWorkMapAreaLabel(area);
        return {
          ...current,
          isSaved: false,
          isReviewMode: false,
          savedWithWarnings: false,
          selectedAreas: [...current.selectedAreas, normalizedArea],
          responsibilities: responsibilitiesForNewArea(current, normalizedArea),
        };
      }

      return {
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        customAreas: [...current.customAreas, area],
        responsibilities: responsibilitiesForNewArea(current, area),
      };
    });
  }

  function addCustomArea() {
    const nextArea = normalizeCanvasWorkMapAreaLabel(customAreaInput.trim());
    if (!nextArea || atMaxAreas) return;
    if (!requireRoleHelpAcknowledgment()) return;

    markGuideSeen("area");
    setWorkMap((current) => {
      if (
        current.customAreas.some((item) => areasMatch(item, nextArea)) ||
        current.selectedAreas.some((item) => areasMatch(item, nextArea))
      ) {
        return current;
      }

      if (isCanvasWorkMapArea(nextArea)) {
        return {
          ...current,
          isSaved: false,
          isReviewMode: false,
          savedWithWarnings: false,
          selectedAreas: [...current.selectedAreas, nextArea],
          responsibilities: responsibilitiesForNewArea(current, nextArea),
        };
      }

      return {
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        customAreas: [...current.customAreas, nextArea],
        responsibilities: responsibilitiesForNewArea(current, nextArea),
      };
    });
    setCustomAreaInput("");
    setCustomAreaPending(false);
  }

  function toggleCatalogView() {
    if (disabled) return;
    setCustomAreaPending(false);
    setCustomAreaInput("");
    setCatalogView((current) => (current === "primary" ? "secondary" : "primary"));
  }

  function startCustomAreaPending() {
    if (atMaxAreas || disabled || catalogView !== "secondary") return;
    setCustomAreaPending(true);
    setCustomAreaInput("");
  }

  function cancelCustomAreaPending() {
    setCustomAreaPending(false);
    setCustomAreaInput("");
  }

  function updateResponsibilityText(id: string, text: string) {
    if (!requireRoleHelpAcknowledgment()) return;

    markGuideSeen("responsibility");
    const fieldKey = responsibilityFieldKey(id);
    setWorkMap((current) => ({
      ...current,
      isSaved: false,
      isReviewMode: false,
      savedWithWarnings: false,
      fieldValidationState: applyFieldTextChangeToValidationState(
        current.fieldValidationState,
        fieldKey,
        text,
      ),
      responsibilities: current.responsibilities.map((responsibility) =>
        responsibility.id === id ? { ...responsibility, text } : responsibility,
      ),
    }));
  }

  function removeResponsibility(id: string) {
    setWorkMap((current) => {
      const target = current.responsibilities.find((row) => row.id === id);
      if (!target?.primaryArea) return current;
      const areaCount = current.responsibilities.filter(
        (row) => row.primaryArea === target.primaryArea,
      ).length;
      if (areaCount <= 1) return current;

      const nextValidation = { ...current.fieldValidationState };
      delete nextValidation[responsibilityFieldKey(id)];
      for (const activity of target.activities) {
        delete nextValidation[activityFieldKey(activity.id)];
      }

      return {
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        fieldValidationState: nextValidation,
        responsibilities: current.responsibilities.filter((row) => row.id !== id),
      };
    });
  }

  function addResponsibilityForArea(area: string) {
    markGuideSeen("responsibility");
    setWorkMap((current) => ({
      ...current,
      isSaved: false,
      isReviewMode: false,
      savedWithWarnings: false,
      responsibilities: [
        ...current.responsibilities,
        createResponsibilityForArea(area, current.responsibilities.length),
      ],
    }));
  }

  function updateActivity(responsibilityId: string, activityId: string, text: string) {
    if (!requireRoleHelpAcknowledgment()) return;

    markGuideSeen("activity");
    const fieldKey = activityFieldKey(activityId);
    setWorkMap((current) => ({
      ...current,
      isSaved: false,
      isReviewMode: false,
      savedWithWarnings: false,
      fieldValidationState: applyFieldTextChangeToValidationState(
        current.fieldValidationState,
        fieldKey,
        text,
      ),
      responsibilities: current.responsibilities.map((responsibility) =>
        responsibility.id === responsibilityId
          ? {
              ...responsibility,
              activities: responsibility.activities.map((activity) =>
                activity.id === activityId ? { ...activity, text } : activity,
              ),
            }
          : responsibility,
      ),
    }));
  }

  function addActivity(responsibilityId: string) {
    markGuideSeen("activity");
    setWorkMap((current) => ({
      ...current,
      isSaved: false,
      isReviewMode: false,
      savedWithWarnings: false,
      responsibilities: current.responsibilities.map((responsibility) =>
        responsibility.id === responsibilityId
          ? {
              ...responsibility,
              activities: [
                ...responsibility.activities,
                createEmptyActivity(responsibility.activities.length),
              ],
            }
          : responsibility,
      ),
    }));
  }

  function removeActivity(responsibilityId: string, activityId: string) {
    setWorkMap((current) => ({
      ...current,
      isSaved: false,
      isReviewMode: false,
      savedWithWarnings: false,
      fieldValidationState: (() => {
        const next = { ...current.fieldValidationState };
        delete next[activityFieldKey(activityId)];
        return next;
      })(),
      responsibilities: current.responsibilities.map((responsibility) => {
        if (responsibility.id !== responsibilityId) return responsibility;
        if (responsibility.activities.length <= 2) return responsibility;
        return {
          ...responsibility,
          activities: responsibility.activities.filter(
            (activity) => activity.id !== activityId,
          ),
        };
      }),
    }));
  }

  async function prepareValidatedSavePayload(): Promise<{
    savedPayload: WorkMapData;
    acceptedWithWarning: boolean;
  } | null> {
    if (disabled || submitting) return null;
    if (!requireRoleHelpAcknowledgment()) return null;

    setAdvanceAttempted(true);
    setShowCoverageNotes(true);
    setAdvanceStatusNote(null);

    const snapshot = latestWorkMapRef.current;

    if (!isStructureReady(snapshot)) {
      setAdvanceStatusNote(
        "Escribe al menos una responsabilidad y dos actividades por cada área elegida.",
      );
      return null;
    }

    const nextValidation = { ...snapshot.fieldValidationState };
    let blockedByReview = false;
    let acceptedWithWarning = false;

    for (const responsibility of snapshot.responsibilities) {
      if (
        !responsibility.primaryArea ||
        !getDeclaredWorkAreas(snapshot).some((area) =>
          areasMatch(responsibility.primaryArea!, area),
        )
      ) {
        continue;
      }

      const responsibilityKey = responsibilityFieldKey(responsibility.id);
      const responsibilityText = responsibility.text.trim();
      if (!responsibilityText) continue;

      const responsibilityStatus =
        classifyResponsibilitySufficiency(responsibilityText);
      const responsibilityValid =
        responsibilityStatus === "sufficient" ||
        responsibilityStatus === "perfectible";
      const responsibilityMessage = shouldEmitRedactionAssistance(
        responsibilityStatus,
      )
        ? getResponsibilityAssistMessage(responsibilityText)
        : undefined;

      nextValidation[responsibilityKey] = evaluateFieldValidationEntry(
        responsibilityText,
        responsibilityValid,
        nextValidation[responsibilityKey],
        responsibilityMessage,
      );

      if (nextValidation[responsibilityKey]?.status === "needs_help") {
        blockedByReview = true;
      }
      if (nextValidation[responsibilityKey]?.status === "allowed_with_warning") {
        acceptedWithWarning = true;
      }

      for (const activity of responsibility.activities) {
        const activityText = getActivityText(activity).trim();
        if (!activityText) continue;

        const activityKey = activityFieldKey(activity.id);
        const activityStatus = classifyActivitySufficiency(activityText);
        const activityValid =
          activityStatus === "sufficient" || activityStatus === "perfectible";
        const activityMessage = shouldEmitRedactionAssistance(activityStatus)
          ? getActivityAssistMessage(activityText)
          : undefined;

        nextValidation[activityKey] = evaluateFieldValidationEntry(
          activityText,
          activityValid,
          nextValidation[activityKey],
          activityMessage,
        );

        if (nextValidation[activityKey]?.status === "needs_help") {
          blockedByReview = true;
        }
        if (nextValidation[activityKey]?.status === "allowed_with_warning") {
          acceptedWithWarning = true;
        }
      }
    }

    const validatedMap: WorkMapData = {
      ...snapshot,
      fieldValidationState: nextValidation,
      guideSeen: { ...snapshot.guideSeen, save: true },
    };
    setWorkMap(validatedMap);

    if (blockedByReview) {
      setAdvanceStatusNote(
        "Revisa las notas bajo los campos antes de seguir. La hoja aún no baja.",
      );
      return null;
    }

    const savedPayload: WorkMapData = {
      ...validatedMap,
      isSaved: true,
      isReviewMode: true,
      saveAttempts: 0,
      savedWithWarnings: acceptedWithWarning,
      startPositionContext:
        validatedMap.startPositionContext ??
        ({ ...startPositionContext } satisfies StartPositionContext),
    };

    return { savedPayload, acceptedWithWarning };
  }

  async function handleAdvanceSheet() {
    const prepared = await prepareValidatedSavePayload();
    if (!prepared) return;

    const { savedPayload, acceptedWithWarning } = prepared;

    setSubmitting(true);
    isSavingRef.current = true;
    try {
      await onSave(savedPayload);
      setWorkMap(savedPayload);
      await onContinue(savedPayload);
      clearWorkMapDraft(sessionId);
      setAdvanceStatusNote(
        acceptedWithWarning
          ? "Puedes seguir. Algunas redacciones siguen cortas, pero la hoja continúa con esa advertencia."
          : "El mapa ya puede seguir. La siguiente franja aparece abajo.",
      );
    } catch {
      setAdvanceStatusNote("No pudimos guardar el mapa. Inténtalo de nuevo.");
    } finally {
      isSavingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="workmap-title"
      className={styles.workmapScreen}
      data-workmap-builder="local-canvas"
      id="workmap"
    >
      <SheetMotion stagger>
        <div
          className={cx(
            styles.workmapWorkspace,
            continuousSheet && styles.workmapWorkspaceContinuous,
          )}
        >
          <p className={styles.workmapRoomMark}>[ Mapa de tu trabajo ]</p>

          <section aria-labelledby="workmap-title" className={styles.workmapUbicacionBand}>
            <div className={styles.workmapUbicacionLeft}>
              <h2 className={styles.workmapUbicacionQuestion} id="workmap-title">
                {WORKMAP_UBICACION_QUESTION}
                <button
                  aria-expanded={roleHelpOpen}
                  aria-label={
                    roleHelpOpen
                      ? "Cerrar ayuda sobre tu rol funcional"
                      : "Abrir ayuda sobre tu rol funcional"
                  }
                  className={styles.workmapRoleHelpTrigger}
                  disabled={disabled}
                  onClick={handleRoleHelpToggle}
                  type="button"
                >
                  {roleHelpOpen ? "[ − ]" : "[ + ]"}
                </button>
              </h2>

              <div className={styles.workmapUbicacionStack}>
                {declaredAreas.map((area, index) => (
                  <button
                    aria-pressed
                    className={cx(
                      styles.workmapUbicacionSelected,
                      styles.workmapUbicacionSelectedOn,
                      index === 0 && styles.workmapUbicacionSelectedFocus,
                    )}
                    disabled={disabled}
                    key={`selected-${area}`}
                    onClick={() => toggleArea(area)}
                    type="button"
                  >
                    {area}
                  </button>
                ))}
                <p
                  className={cx(
                    styles.workmapUbicacionWhisper,
                    declaredAreas.length > 0 && styles.workmapUbicacionWhisperSettled,
                  )}
                >
                  {WORKMAP_UBICACION_WHISPER}
                </p>
              </div>
            </div>

            <div
              aria-label="Catálogo de áreas"
              className={cx(
                styles.workmapCatalogVoid,
                customAreaPending && styles.workmapCatalogVoidUnlistedOpen,
              )}
              role="group"
            >
              {catalogAreas.map((area) => (
                <button
                  aria-pressed={false}
                  className={cx(
                    styles.workmapCatalogItem,
                    CATALOG_LAYOUT_CLASS[getWorkMapCatalogInscriptionLayout(area)],
                  )}
                  disabled={disabled || atMaxAreas}
                  key={`catalog-${catalogView}-${area}`}
                  onClick={() => toggleArea(area)}
                  type="button"
                >
                  {area}
                </button>
              ))}
              <button
                aria-expanded={catalogView === "secondary"}
                aria-label="Alternar entre catálogo principal y otras áreas"
                aria-pressed={catalogView === "secondary"}
                className={cx(
                  styles.workmapCatalogItem,
                  styles.workmapCatalogToggle,
                  CATALOG_LAYOUT_CLASS[WORKMAP_CATALOG_TOGGLE_INSCRIPTION],
                  catalogView === "secondary" && styles.workmapCatalogToggleActive,
                )}
                disabled={disabled || atMaxAreas}
                onClick={toggleCatalogView}
                type="button"
              >
                {OTHER_AREA_CHIP_LABEL}
              </button>
              {catalogView === "secondary" ? (
                customAreaPending ? (
                  <div
                    className={cx(
                      styles.workmapCatalogUnlistedInput,
                      CATALOG_LAYOUT_CLASS[WORKMAP_CATALOG_UNLISTED_INSCRIPTION],
                    )}
                  >
                    <input
                      autoFocus
                      aria-label="Escribe tu rol funcional"
                      className={styles.workmapCustomAreaInput}
                      disabled={disabled || atMaxAreas}
                      onBlur={() => {
                        if (!customAreaInput.trim()) {
                          cancelCustomAreaPending();
                          return;
                        }
                        addCustomArea();
                      }}
                      onChange={(event) => setCustomAreaInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomArea();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelCustomAreaPending();
                        }
                      }}
                      placeholder="Escribe tu rol funcional"
                      value={customAreaInput}
                    />
                  </div>
                ) : (
                  <button
                    className={cx(
                      styles.workmapCatalogItem,
                      styles.workmapCatalogUnlisted,
                      CATALOG_LAYOUT_CLASS[WORKMAP_CATALOG_UNLISTED_INSCRIPTION],
                    )}
                    disabled={disabled || atMaxAreas}
                    onClick={startCustomAreaPending}
                    type="button"
                  >
                    {UNLISTED_ROLE_CHIP_LABEL}
                  </button>
                )
              ) : null}
              {catalogView === "secondary" && customAreaPending ? (
                <p className={styles.workmapCatalogVoidWhisper}>
                  {WORKMAP_CATALOG_UNLISTED_WHISPER}
                </p>
              ) : null}
            </div>
          </section>

          {declaredAreas.length > 0 ? (() => {
            const singleAreaHorizontal = declaredAreas.length === 1;
            const soleArea = singleAreaHorizontal ? declaredAreas[0] : null;
            const soleAreaResponsibilities = soleArea
              ? workMap.responsibilities.filter(
                  (responsibility) => responsibility.primaryArea === soleArea,
                )
              : [];

            function renderRoleFields(
              area: string,
              responsibility: WorkMapResponsibility,
              areaResponsibilityIndex: number,
              isLastAreaResponsibility: boolean,
            ) {
              return (
                <WorkmapRoleFields
                  activityCoverageHint={
                    showCoverageNotes
                      ? getActivityCoverageMessage(responsibility) ?? null
                      : null
                  }
                  activityHints={responsibility.activities.map((activity) =>
                    resolveFieldHint(
                      workMap.fieldValidationState[activityFieldKey(activity.id)],
                      advanceAttempted,
                    ),
                  )}
                  activities={responsibility.activities}
                  area={area}
                  areaResponsibilityIndex={areaResponsibilityIndex}
                  disabled={disabled || submitting}
                  isLastAreaResponsibility={isLastAreaResponsibility}
                  key={responsibility.id}
                  onActivityAdd={() => addActivity(responsibility.id)}
                  onActivityBlur={(activityId, text) =>
                    evaluateFieldBlur(activityFieldKey(activityId), text, "activity")
                  }
                  onActivityChange={(activityId, text) =>
                    updateActivity(responsibility.id, activityId, text)
                  }
                  onActivityRemove={(activityId) =>
                    removeActivity(responsibility.id, activityId)
                  }
                  onResponsibilityAdd={() => addResponsibilityForArea(area)}
                  onResponsibilityBlur={(text) =>
                    evaluateFieldBlur(
                      responsibilityFieldKey(responsibility.id),
                      text,
                      "responsibility",
                    )
                  }
                  onResponsibilityChange={(text) =>
                    updateResponsibilityText(responsibility.id, text)
                  }
                  onResponsibilityRemove={() => removeResponsibility(responsibility.id)}
                  onRoleFieldFocus={handleRoleFieldFocus}
                  responsibilityHint={resolveFieldHint(
                    workMap.fieldValidationState[responsibilityFieldKey(responsibility.id)],
                    advanceAttempted,
                  )}
                  responsibilityValue={responsibility.text}
                />
              );
            }

            if (singleAreaHorizontal && soleArea) {
              const responsibilityRows = chunkResponsibilityRows(
                soleAreaResponsibilities,
                WORKMAP_MAX_DECLARED_AREAS,
              );

              return (
                <div
                  aria-label="Roles funcionales confirmados"
                  className={styles.workmapSingleAreaSpread}
                >
                  {responsibilityRows.map((row, rowIndex) => (
                    <section
                      className={cx(
                        styles.workmapRolesColumns,
                        row.length >= WORKMAP_MAX_DECLARED_AREAS &&
                          styles.workmapRolesColumnsTriple,
                      )}
                      key={`single-area-row-${rowIndex}`}
                    >
                      {row.map((responsibility, columnIndex) => {
                        const globalIndex =
                          rowIndex * WORKMAP_MAX_DECLARED_AREAS + columnIndex;

                        return (
                          <article
                            aria-label={`${soleArea} — responsabilidad ${globalIndex + 1}`}
                            className={styles.workmapRoleCol}
                            key={`role-col-${responsibility.id}`}
                          >
                            <p
                              aria-hidden={globalIndex > 0 ? true : undefined}
                              className={cx(
                                styles.workmapRoleName,
                                globalIndex > 0 && styles.workmapRoleNameReserved,
                              )}
                            >
                              {soleArea}
                            </p>
                            {renderRoleFields(
                              soleArea,
                              responsibility,
                              globalIndex,
                              globalIndex === soleAreaResponsibilities.length - 1,
                            )}
                          </article>
                        );
                      })}
                    </section>
                  ))}
                </div>
              );
            }

            return (
              <section
                aria-label="Roles funcionales confirmados"
                className={cx(
                  styles.workmapRolesColumns,
                  declaredAreas.length >= 3 && styles.workmapRolesColumnsTriple,
                )}
              >
                {declaredAreas.map((area) => {
                      const areaResponsibilities = workMap.responsibilities.filter(
                        (responsibility) => responsibility.primaryArea === area,
                      );

                      return (
                        <article
                          aria-label={area}
                          className={styles.workmapRoleCol}
                          key={`role-col-${area}`}
                        >
                          {areaResponsibilities.map(
                            (responsibility, areaResponsibilityIndex) => (
                              <div key={`role-fields-${responsibility.id}`}>
                                <p
                                  aria-hidden={
                                    areaResponsibilityIndex > 0 ? true : undefined
                                  }
                                  className={cx(
                                    styles.workmapRoleName,
                                    areaResponsibilityIndex > 0 &&
                                      styles.workmapRoleNameReserved,
                                  )}
                                >
                                  {area}
                                </p>
                                {renderRoleFields(
                                  area,
                                  responsibility,
                                  areaResponsibilityIndex,
                                  areaResponsibilityIndex ===
                                    areaResponsibilities.length - 1,
                                )}
                              </div>
                            ),
                          )}
                        </article>
                      );
                    })}
              </section>
            );
          })() : null}

          <footer className={styles.workmapMonumentFooter}>
            <p className={styles.workmapNeedWhisper}>
              {advanceStatusNote ??
                "Escribe al menos una responsabilidad y dos actividades por cada área elegida."}
            </p>
            <button
              className={styles.workmapTrace}
              disabled={disabled || submitting}
              onClick={() => void handleAdvanceSheet()}
              type="button"
            >
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </footer>
        </div>
      </SheetMotion>

      <WorkMapRoleHelpPortal
        closeLabel={roleHelpAcknowledged ? "Cerrar" : "Continuar"}
        onClose={dismissRoleHelp}
        open={roleHelpOpen}
        shards={roleHelpMaterialityShards}
        variant={WORKMAP_ROLE_HELP_CANVAS_VARIANT}
      />
    </section>
  );
}
