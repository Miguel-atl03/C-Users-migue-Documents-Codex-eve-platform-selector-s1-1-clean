// Estándar visual aprobado: docs/work-map-intake-ui-standard.md
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  OTHER_AREA_CHIP_LABEL,
  PREDEFINED_WORK_MAP_AREAS,
} from "@/config/work-map-areas";
import {
  activityFieldKey,
  applyFieldTextChangeToValidationState,
  createEmptyActivity,
  createEmptyWorkMap,
  createResponsibilityId,
  evaluateInlineFieldValidationEntry,
  getActivityText,
  getFieldReviewLabel,
  isIntroGuideComplete,
  responsibilityFieldKey,
  shouldEmitRedactionAssistance,
  shouldShowFieldAssist,
  shouldShowInlineFieldHint,
  type FieldValidationEntry,
  type WorkMapData,
  type WorkMapGuideKey,
  type WorkMapGuideSeenState,
} from "@/domain/work-map";
import {
  classifyActivitySufficiency,
  getActivityAssistMessage,
  validateActivity,
} from "@/services/work-map-activity-validation";
import {
  classifyResponsibilitySufficiency,
  getResponsibilityAssistMessage,
  validateResponsibility,
} from "@/services/work-map-responsibility-validation";
import { type FieldWarningKey } from "@/services/work-map-save-validation";
import { evaluateWorkMapOperationalReadiness } from "@/services/work-map-operational-readiness";
import {
  clearWorkMapDraft,
  readWorkMapDraftOrEmpty,
  writeWorkMapDraft,
} from "@/services/work-map-draft";
import {
  getFirstNameForGreeting,
  type GreetingAuthUser,
  type GreetingNameProfile,
} from "@/lib/get-first-name-for-greeting";
import {
  EMPTY_START_POSITION_CONTEXT,
  type StartPositionContext,
} from "@/domain/start-position-context";
import { ClientFlowHeader } from "./client/ClientFlowHeader";
import { ClientUserMenu } from "./client/ClientUserMenu";
import { StartPositionEditModal } from "./client/StartPositionEditModal";
import { EveLogo } from "./EveLogo";
import { GuideCardBody } from "./GuideCardBody";
import styles from "./work-map-intake.module.css";

type Props = {
  disabled?: boolean;
  sessionId?: string | null;
  initialWorkMap?: WorkMapData | null;
  runIntroTutorial?: boolean;
  userFirstName?: string;
  userFullName?: string;
  greetingProfile?: GreetingNameProfile | null;
  greetingAuthUser?: GreetingAuthUser | null;
  onSignOut?: () => void;
  startPositionContext?: StartPositionContext;
  onStartPositionContextChange?: (context: StartPositionContext) => void;
  onSave: (workMap: WorkMapData) => void | Promise<void>;
  onContinue: (workMap: WorkMapData) => void | Promise<void>;
};

type GuideStepIconProps = {
  className?: string;
};

const guideContent: Record<WorkMapGuideKey, { title: string; body: string }> = {
  area: {
    title: "Cómo elegir el área",
    body: `Selecciona las áreas donde tu trabajo participa realmente, aunque no sean el nombre exacto de tu puesto.

Usa esta idea:

Yo participo en [área] cuando mi trabajo ayuda a [resultado, proceso o entrega].

No elijas solo el departamento donde estás contratado. Elige también las áreas donde tu trabajo impacta, alimenta información, coordina, entrega algo o desbloquea trabajo para otros.

Si tu área no aparece, selecciona "Otra área" y escríbela con un nombre corto y claro.`,
  },
  responsibility: {
    title: "Responsabilidades",
    body: "",
  },
  activity: {
    title: "Actividades",
    body: "",
  },
  save: {
    title: "Guardar mapa",
    body: `Al guardar, EVE revisa si tus responsabilidades y actividades tienen estructura mínima para continuar.

Si algo queda muy general, te sugeriremos mejorarlo antes de cerrar el mapa. Cuando aún falte estructura, podrás guardar con advertencia y revisar el resultado final.`,
  },
};

const guideSteps: {
  key: WorkMapGuideKey;
  label: string;
  Icon: typeof GuideIconMapPin;
}[] = [
  {
    key: "area",
    label: "Ubicar trabajo",
    Icon: GuideIconMapPin,
  },
  {
    key: "responsibility",
    label: "Responsabilidad",
    Icon: GuideIconUserRound,
  },
  {
    key: "activity",
    label: "Actividades",
    Icon: GuideIconCheckSquare,
  },
  {
    key: "save",
    label: "Guardar mapa",
    Icon: GuideIconSave,
  },
];

const SAVE_WITH_WARNINGS_MESSAGE =
  "La estructura de algunas responsabilidades o actividades sigue siendo insuficiente. Puedes continuar, pero la precisión estructural puede verse limitada.";

function getReviewModeAreas(workMap: WorkMapData) {
  return [...workMap.selectedAreas, ...workMap.customAreas];
}

function getDeclaredWorkAreas(workMap: WorkMapData) {
  return [...workMap.selectedAreas, ...workMap.customAreas]
    .map((area) => area.trim())
    .filter(Boolean);
}

function applyResponsibilityAreaAssignments(workMap: WorkMapData): WorkMapData {
  const declaredAreas = getDeclaredWorkAreas(workMap);

  if (declaredAreas.length > 1) {
    const firstArea = declaredAreas[0];
    const usedUnassigned = new Set<string>();
    const assigned = declaredAreas.flatMap((area) => {
      const assignedToArea = workMap.responsibilities.filter(
        (responsibility) => responsibility.primaryArea === area,
      );
      const unassignedForFirstArea =
        area === firstArea
          ? workMap.responsibilities.filter((responsibility) => {
              const isUnassigned =
                !responsibility.primaryArea ||
                !declaredAreas.includes(responsibility.primaryArea);
              if (isUnassigned) usedUnassigned.add(responsibility.id);
              return isUnassigned;
            })
          : [];
      const areaResponsibilities = [...assignedToArea, ...unassignedForFirstArea].map(
        (responsibility) => ({
          ...responsibility,
          primaryArea: area,
          areaAssignmentMode: "user_selected_from_declared_areas" as const,
        }),
      );

      while (areaResponsibilities.length < 2) {
        areaResponsibilities.push({
          id: createResponsibilityId(
            workMap.responsibilities.length + areaResponsibilities.length,
          ),
          text: "",
          primaryArea: area,
          areaAssignmentMode: "user_selected_from_declared_areas",
          activities: [createEmptyActivity(0)],
        });
      }

      return areaResponsibilities;
    });

    const remaining = workMap.responsibilities.filter(
      (responsibility) =>
        responsibility.primaryArea &&
        !declaredAreas.includes(responsibility.primaryArea) &&
        !usedUnassigned.has(responsibility.id),
    );

    return {
      ...workMap,
      responsibilities: [...assigned, ...remaining],
    };
  }

  return {
    ...workMap,
    responsibilities: workMap.responsibilities.map((responsibility) => {
      if (declaredAreas.length === 1) {
        return {
          ...responsibility,
          primaryArea: declaredAreas[0],
          areaAssignmentMode: "single_area_inherited",
        };
      }

      if (declaredAreas.length > 1) {
        const selectedArea =
          responsibility.primaryArea &&
          declaredAreas.includes(responsibility.primaryArea)
            ? responsibility.primaryArea
            : null;

        return {
          ...responsibility,
          primaryArea: selectedArea,
          areaAssignmentMode: "user_selected_from_declared_areas",
        };
      }

      return {
        ...responsibility,
        primaryArea: null,
        areaAssignmentMode: null,
      };
    }),
  };
}

function getReviewModeResponsibilities(workMap: WorkMapData) {
  return workMap.responsibilities.filter(
    (responsibility) =>
      responsibility.text.trim() ||
      responsibility.activities.some((activity) =>
        getActivityText(activity).trim(),
      ),
  );
}

function getReviewModeActivities(
  responsibility: WorkMapData["responsibilities"][number],
) {
  return responsibility.activities
    .map((activity) => getActivityText(activity).trim())
    .filter(Boolean);
}

function canDeleteResponsibility(index: number) {
  return index >= 2;
}

function canDeleteActivity(parentResponsibilityIndex: number) {
  return parentResponsibilityIndex >= 2;
}

const RESPONSIBILITY_SIDE_GUIDE_VERBS = [
  "Defino",
  "Apruebo",
  "Autorizo",
  "Decido",
  "Priorizo",
  "Valido",
  "Verifico",
  "Regulo",
  "Ajusto",
  "Establezco",
  "Asigno",
  "Libero",
  "Informo",
  "Escalo",
  "Evalúo",
  "Audito",
  "Sincronizo",
  "Negocio",
] as const;

const ACTIVITY_SIDE_GUIDE_VERBS = [
  "Reviso",
  "Registro",
  "Actualizo",
  "Capturo",
  "Calculo",
  "Concilio",
  "Comparo",
  "Mido",
  "Clasifico",
  "Tipifico",
  "Envío",
  "Entrego",
  "Preparo",
  "Documento",
  "Cargo",
  "Organizo",
  "Notifico",
  "Cierro",
  "Empaco",
  "Ensamblo",
] as const;

function SideGuideVerbChips({
  variant,
  verbs,
  subtext,
}: {
  variant: "responsibility" | "activity";
  verbs: readonly string[];
  subtext: string;
}) {
  const chipVariantClass =
    variant === "responsibility"
      ? styles.sideGuideVerbChipResponsibility
      : styles.sideGuideVerbChipActivity;

  return (
    <div className={styles.sideGuideVerbBlock}>
      <p className={styles.sideGuideVerbIntro}>
        <strong>Verbos que te pueden ayudar</strong>
        <br />
        {subtext}
      </p>
      <div
        aria-label="Verbos sugeridos"
        className={styles.sideGuideVerbChips}
      >
        {verbs.map((verb) => (
          <span
            className={[styles.sideGuideVerbChip, chipVariantClass].join(" ")}
            key={verb}
          >
            {verb}
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkMapCognitiveSideGuide({
  guideKey,
}: {
  guideKey: "responsibility" | "activity";
}) {
  if (guideKey === "responsibility") {
    return (
      <div className={styles.guideCognitiveBody}>
        <p className={styles.guideCognitiveText}>
          Una responsabilidad es algo de tu rol donde respondes por una decisión,
          criterio, validación, autorización, prioridad o límite. No es una
          tarea suelta; es aquello sobre lo que tienes discreción y por lo que
          puedes rendir cuentas.
        </p>
        <p className={styles.guideCognitiveExampleLabel}>Ejemplo visual</p>
        <p className={styles.guideCognitiveExample}>
          Yo{" "}
          <span className={styles.guidePartDecision}>autorizo</span>{" "}
          <span className={styles.guidePartObject}>descuentos comerciales</span>{" "}
          <span className={styles.guidePartLimit}>
            dentro del margen permitido
          </span>{" "}
          <span className={styles.guidePartPurpose}>
            para cerrar ventas sin afectar la rentabilidad
          </span>
          .
        </p>
        <p className={styles.guideCognitiveLegend}>
          <span className={styles.guideLegendDecision}>Decisión</span>
          <span aria-hidden="true" className={styles.guideLegendSep}>
            ·
          </span>
          <span className={styles.guideLegendObject}>Objeto</span>
          <span aria-hidden="true" className={styles.guideLegendSep}>
            ·
          </span>
          <span className={styles.guideLegendLimit}>Límite</span>
          <span aria-hidden="true" className={styles.guideLegendSep}>
            ·
          </span>
          <span className={styles.guideLegendPurpose}>Propósito</span>
        </p>
        <SideGuideVerbChips
          subtext="Úsalos cuando tu rol implique decidir, validar, autorizar, regular o responder por un criterio."
          variant="responsibility"
          verbs={RESPONSIBILITY_SIDE_GUIDE_VERBS}
        />
        <p className={styles.guideCognitiveHint}>
          Cuando escribas, la ayuda debajo del campo te irá indicando qué parte
          falta.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.guideCognitiveBody}>
      <p className={styles.guideCognitiveText}>
        Una actividad es una acción concreta que realizas para transformar
        información, documentos, solicitudes, materiales o decisiones en algo
        útil para el siguiente paso. Ayuda a entender qué haces y qué queda hecho al
        terminar.
      </p>
      <p className={styles.guideCognitiveExampleLabel}>Ejemplo visual</p>
      <p className={styles.guideCognitiveExample}>
        <span className={styles.guidePartAction}>Registro</span>{" "}
        <span className={styles.guidePartObject}>facturas de proveedores</span>{" "}
        <span className={styles.guidePartHow}>
          en el ERP usando el catálogo de cuentas
        </span>{" "}
        <span className={styles.guidePartResult}>
          para generar el asiento contable
        </span>
        .
      </p>
      <p className={styles.guideCognitiveLegend}>
        <span className={styles.guideLegendAction}>Acción</span>
        <span aria-hidden="true" className={styles.guideLegendSep}>
          ·
        </span>
        <span className={styles.guideLegendObject}>Sobre qué trabajas</span>
        <span aria-hidden="true" className={styles.guideLegendSep}>
          ·
        </span>
        <span className={styles.guideLegendHow}>Cómo lo haces</span>
        <span aria-hidden="true" className={styles.guideLegendSep}>
          ·
        </span>
          <span className={styles.guideLegendResult}>Resultado</span>
        </p>
        <SideGuideVerbChips
          subtext="Úsalos cuando quieras describir una acción concreta que realizas y que deja algo hecho."
          variant="activity"
          verbs={ACTIVITY_SIDE_GUIDE_VERBS}
        />
        <p className={styles.guideCognitiveHint}>
          Cuando escribas, la ayuda debajo del campo te irá indicando qué parte
          falta.
        </p>
      </div>
    );
}

function FieldAssistCard({
  title,
  entry,
}: {
  title: string;
  entry: FieldValidationEntry;
}) {
  const reviewLabel = getFieldReviewLabel(entry);
  const message = entry.message?.trim();

  if (!reviewLabel && !message) {
    return null;
  }

  return (
    <div className={styles.activityErrorBox} role="status">
      <p className={styles.activityErrorTitle}>{title}</p>
      {reviewLabel ? (
        <p className={styles.fieldAssistReviewLabel}>{reviewLabel}</p>
      ) : null}
      {message ? (
        <p className={styles.fieldAssistMessage}>{message}</p>
      ) : null}
    </div>
  );
}

// La lógica operativa aprobada está documentada en docs/work-map-intake-operational-logic.md. No modificar reglas de guía, validación por unidad, review mode o metadata declarada sin revisar ese estándar.
export function WorkMapIntake({
  disabled = false,
  sessionId = null,
  initialWorkMap,
  runIntroTutorial = false,
  userFirstName = "usuario",
  userFullName,
  greetingProfile = null,
  greetingAuthUser = null,
  onSignOut,
  startPositionContext = EMPTY_START_POSITION_CONTEXT,
  onStartPositionContextChange,
  onSave,
  onContinue,
}: Props) {
  const resolvedFullName = userFullName ?? userFirstName;
  const avatarInitial = resolvedFullName.trim().charAt(0).toUpperCase() || "U";
  const greetingFirstName = getFirstNameForGreeting(
    greetingProfile,
    greetingAuthUser,
  );

  const [workMap, setWorkMap] = useState<WorkMapData>(() => {
    if (initialWorkMap) return initialWorkMap;
    return readWorkMapDraftOrEmpty(sessionId);
  });
  const [otherAreaInputOpen, setOtherAreaInputOpen] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [draftRestored, setDraftRestored] = useState(() => {
    if (initialWorkMap) return false;
    const draft = readWorkMapDraftOrEmpty(sessionId);
    return (
      draft.selectedAreas.length > 0 ||
      draft.customAreas.length > 0 ||
      draft.responsibilities.some(
        (responsibility) =>
          responsibility.text.trim() ||
          responsibility.activities.some(
            (activity) => getActivityText(activity).trim(),
          ),
      )
    );
  });
  const [saveAttemptTriggered, setSaveAttemptTriggered] = useState(false);
  const [operationalSaveAttempted, setOperationalSaveAttempted] =
    useState(false);
  const [saveBlockMessage, setSaveBlockMessage] = useState<string | null>(
    null,
  );
  const [saveDetailMessage, setSaveDetailMessage] = useState<string | null>(
    null,
  );
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [firstSaveBlockTarget, setFirstSaveBlockTarget] = useState<
    string | null
  >(null);
  const [saveFeedbackType, setSaveFeedbackType] = useState<
    "block" | "error" | null
  >(null);
  const [showUnsavedContinueNotice, setShowUnsavedContinueNotice] =
    useState(false);
  const [highlightSaveButton, setHighlightSaveButton] = useState(false);
  const [activeGuide, setActiveGuide] = useState<WorkMapGuideKey | null>(null);
  const [startPositionEditOpen, setStartPositionEditOpen] = useState(false);
  const [openGuide, setOpenGuide] = useState<WorkMapGuideKey | null>(null);
  const [fieldWarnings, setFieldWarnings] = useState<FieldWarningKey[]>([]);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );

  const guideSeen = workMap.guideSeen;
  const introCompleted = useMemo(
    () => isIntroGuideComplete(guideSeen),
    [guideSeen],
  );

  const areaSectionRef = useRef<HTMLDivElement>(null);
  const responsibilitySectionRef = useRef<HTMLDivElement>(null);
  const activitySectionRef = useRef<HTMLDivElement>(null);
  const saveSectionRef = useRef<HTMLDivElement>(null);
  const initialGuideOpenedRef = useRef(false);
  const isSavingRef = useRef(false);
  const latestWorkMapRef = useRef(workMap);
  latestWorkMapRef.current = workMap;

  useEffect(() => {
    if (!initialWorkMap) return;

    setWorkMap((current) => {
      // Preserve a successful local save transition until the parent snapshot
      // also reflects review mode (avoids stale initialWorkMap resetting the UI).
      if (
        current.isSaved &&
        current.isReviewMode &&
        (!initialWorkMap.isSaved || !initialWorkMap.isReviewMode)
      ) {
        return current;
      }

      return initialWorkMap;
    });
    setFieldWarnings([]);
  }, [initialWorkMap]);

  const activityValidations = useMemo(() => {
    const validations: Record<string, ReturnType<typeof validateActivity>> = {};

    workMap.responsibilities.forEach((responsibility) => {
      responsibility.activities.forEach((activity, activityIndex) => {
        const key = `${responsibility.id}:${activityIndex}`;
        validations[key] = validateActivity(getActivityText(activity));
      });
    });

    return validations;
  }, [workMap.responsibilities]);

  const responsibilityValidations = useMemo(() => {
    const validations: Record<
      string,
      ReturnType<typeof validateResponsibility>
    > = {};

    workMap.responsibilities.forEach((responsibility) => {
      validations[responsibility.id] = validateResponsibility(
        responsibility.text,
      );
    });

    return validations;
  }, [workMap.responsibilities]);

  const nonEmptyActivities = useMemo(
    () =>
      workMap.responsibilities.flatMap((responsibility) =>
        responsibility.activities
          .map((activity) => getActivityText(activity).trim())
          .filter(Boolean),
      ),
    [workMap.responsibilities],
  );

  const nonEmptyResponsibilities = useMemo(
    () =>
      workMap.responsibilities
        .map((responsibility) => responsibility.text.trim())
        .filter(Boolean),
    [workMap.responsibilities],
  );

  const hasAreas =
    workMap.selectedAreas.length > 0 || workMap.customAreas.length > 0;
  const declaredWorkAreas = useMemo(
    () => getDeclaredWorkAreas(workMap),
    [workMap],
  );
  const shouldAssignResponsibilityArea = declaredWorkAreas.length > 1;

  useEffect(() => {
    const next = applyResponsibilityAreaAssignments(workMap);
    const currentSignature = workMap.responsibilities
      .map((responsibility) =>
        [
          responsibility.id,
          responsibility.primaryArea ?? "",
          responsibility.areaAssignmentMode ?? "",
        ].join(":"),
      )
      .join("|");
    const nextSignature = next.responsibilities
      .map((responsibility) =>
        [
          responsibility.id,
          responsibility.primaryArea ?? "",
          responsibility.areaAssignmentMode ?? "",
        ].join(":"),
      )
      .join("|");

    if (currentSignature !== nextSignature) {
      setWorkMap(next);
    }
  }, [declaredWorkAreas.join("|"), workMap]);

  const allFilledEntriesValid = useMemo(
    () =>
      workMap.responsibilities.every((responsibility) => {
        const responsibilityValid =
          !responsibility.text.trim() ||
          (responsibilityValidations[responsibility.id]?.valid ?? false);

        const activitiesValid = responsibility.activities.every(
          (activity, activityIndex) => {
            const trimmed = getActivityText(activity).trim();
            if (!trimmed) return true;
            const key = `${responsibility.id}:${activityIndex}`;
            return activityValidations[key]?.valid ?? false;
          },
        );

        return responsibilityValid && activitiesValid;
      }),
    [activityValidations, responsibilityValidations, workMap.responsibilities],
  );

  const isReviewMode = workMap.isReviewMode;

  const canContinue =
    workMap.isSaved &&
    hasAreas &&
    nonEmptyResponsibilities.length > 0 &&
    nonEmptyActivities.length > 0 &&
    (allFilledEntriesValid || workMap.savedWithWarnings);

  const reviewModeAreas = useMemo(() => getReviewModeAreas(workMap), [workMap]);

  const reviewModeResponsibilities = useMemo(
    () => getReviewModeResponsibilities(workMap),
    [workMap],
  );

  const orderedPredefinedAreas = useMemo(() => {
    const selectedPredefined = PREDEFINED_WORK_MAP_AREAS.filter((area) =>
      workMap.selectedAreas.includes(area),
    );
    const unselectedPredefined = PREDEFINED_WORK_MAP_AREAS.filter(
      (area) => !workMap.selectedAreas.includes(area),
    );

    return { selectedPredefined, unselectedPredefined };
  }, [workMap.selectedAreas]);

  useEffect(() => {
    writeWorkMapDraft(workMap, sessionId);
    const savedAt = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
    // Diferido para no disparar renders en cascada dentro del efecto.
    const timer = window.setTimeout(() => setLastDraftSavedAt(savedAt), 0);
    return () => window.clearTimeout(timer);
  }, [sessionId, workMap]);

  const markFieldTouched = useCallback((fieldKey: string) => {
    setTouchedFields((current) =>
      current[fieldKey] ? current : { ...current, [fieldKey]: true },
    );
  }, []);

  const handleSyntaxFieldBlur = useCallback(
    (
      fieldKey: string,
      text: string,
      kind: "responsibility" | "activity",
    ) => {
      markFieldTouched(fieldKey);

      if (isSavingRef.current) {
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const sufficiencyStatus =
        kind === "responsibility"
          ? classifyResponsibilitySufficiency(trimmed)
          : classifyActivitySufficiency(trimmed);
      const isValid = sufficiencyStatus === "sufficient" || sufficiencyStatus === "perfectible";
      const assistMessage = shouldEmitRedactionAssistance(sufficiencyStatus)
        ? kind === "responsibility"
          ? getResponsibilityAssistMessage(trimmed)
          : getActivityAssistMessage(trimmed)
        : undefined;

      setWorkMap((current) => {
        const existing = current.fieldValidationState[fieldKey];
        const entry = evaluateInlineFieldValidationEntry(
          trimmed,
          isValid,
          existing,
          assistMessage,
        );

        return {
          ...current,
          fieldValidationState: {
            ...current.fieldValidationState,
            [fieldKey]: entry,
          },
        };
      });
    },
    [markFieldTouched],
  );

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      const hasContent =
        workMap.selectedAreas.length > 0 ||
        workMap.customAreas.length > 0 ||
        workMap.responsibilities.some(
          (responsibility) =>
            responsibility.text.trim() ||
            responsibility.activities.some((activity) =>
              getActivityText(activity).trim(),
            ),
        );

      if (!hasContent) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [workMap]);

  const markGuideSeen = useCallback((key: WorkMapGuideKey) => {
    setWorkMap((current) => {
      if (current.guideSeen[key]) return current;
      return {
        ...current,
        guideSeen: { ...current.guideSeen, [key]: true },
      };
    });
  }, []);

  const focusGuideSection = useCallback((key: WorkMapGuideKey) => {
    const refByKey: Record<WorkMapGuideKey, RefObject<HTMLDivElement | null>> = {
      area: areaSectionRef,
      responsibility: responsibilitySectionRef,
      activity: activitySectionRef,
      save: saveSectionRef,
    };
    const target = refByKey[key].current;
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }, []);

  const openGuideStep = useCallback(
    (key: WorkMapGuideKey) => {
      const alreadySeen = guideSeen[key];

      if (openGuide === key) {
        setOpenGuide(null);
        if (introCompleted) {
          setActiveGuide(null);
        }
        return;
      }

      if (!alreadySeen) {
        const nextGuideSeen: WorkMapGuideSeenState = {
          ...guideSeen,
          [key]: true,
        };
        const allSeenAfterOpen = isIntroGuideComplete(nextGuideSeen);

        setWorkMap((current) => ({
          ...current,
          guideSeen: nextGuideSeen,
        }));
        setOpenGuide(key);
        setActiveGuide(allSeenAfterOpen ? null : key);
        requestAnimationFrame(() => focusGuideSection(key));
        return;
      }

      setOpenGuide(key);
      setActiveGuide(null);
    },
    [focusGuideSection, guideSeen, introCompleted, openGuide],
  );

  useEffect(() => {
    if (!runIntroTutorial || initialGuideOpenedRef.current) return;
    if (isIntroGuideComplete(workMap.guideSeen)) return;
    initialGuideOpenedRef.current = true;
    openGuideStep("area");
  }, [openGuideStep, runIntroTutorial, workMap.guideSeen]);

  const dismissUnsavedContinueNotice = () => {
    setShowUnsavedContinueNotice(false);
    setHighlightSaveButton(false);
  };

  const markWorkMapUnsaved = () => {
    dismissUnsavedContinueNotice();
    setWorkMap((current) => {
      if (
        !current.isSaved &&
        !current.isReviewMode &&
        !current.savedWithWarnings
      ) {
        return current;
      }
      return {
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
      };
    });
  };

  const toggleArea = (area: string) => {
    markGuideSeen("area");
    markWorkMapUnsaved();
    setFieldWarnings((current) => current.filter((warning) => warning !== "areas"));
    setWorkMap((current) =>
      applyResponsibilityAreaAssignments({
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        selectedAreas: current.selectedAreas.includes(area)
          ? current.selectedAreas.filter((item) => item !== area)
          : [...current.selectedAreas, area],
      }),
    );
  };

  const confirmCustomArea = () => {
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;

    markWorkMapUnsaved();
    setFieldWarnings((current) => current.filter((warning) => warning !== "areas"));

    setWorkMap((current) => {
      const existsInPredefined = PREDEFINED_WORK_MAP_AREAS.includes(
        trimmed as (typeof PREDEFINED_WORK_MAP_AREAS)[number],
      );
      const exists =
        current.customAreas.includes(trimmed) ||
        current.selectedAreas.includes(trimmed);

      if (existsInPredefined || exists) {
        return current;
      }

      return applyResponsibilityAreaAssignments({
        ...current,
        customAreas: [...current.customAreas, trimmed],
      });
    });
    setCustomAreaInput("");
    setOtherAreaInputOpen(false);
    markGuideSeen("area");
  };

  const removeCustomArea = (area: string) => {
    markWorkMapUnsaved();
    setFieldWarnings((current) => current.filter((warning) => warning !== "areas"));
    setWorkMap((current) =>
      applyResponsibilityAreaAssignments({
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        customAreas: current.customAreas.filter((item) => item !== area),
      }),
    );
  };

  const updateResponsibilityText = (responsibilityId: string, text: string) => {
    dismissUnsavedContinueNotice();
    markGuideSeen("responsibility");
    setFieldWarnings((current) =>
      current.filter(
        (warning) => warning !== `responsibility:${responsibilityId}`,
      ),
    );
    const fieldKey = responsibilityFieldKey(responsibilityId);
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
          ? { ...responsibility, text }
          : responsibility,
      ),
    }));
  };

  const updateActivity = (
    responsibilityId: string,
    activityIndex: number,
    value: string,
  ) => {
    dismissUnsavedContinueNotice();
    markGuideSeen("activity");
    setFieldWarnings((current) =>
      current.filter(
        (warning) =>
          warning !== `activity:${responsibilityId}:${activityIndex}`,
      ),
    );
    setWorkMap((current) => {
      const responsibility = current.responsibilities.find(
        (row) => row.id === responsibilityId,
      );
      const activity = responsibility?.activities[activityIndex];
      const fieldKey = activity ? activityFieldKey(activity.id) : null;

      return {
        ...current,
        isSaved: false,
        isReviewMode: false,
        savedWithWarnings: false,
        fieldValidationState: fieldKey
          ? applyFieldTextChangeToValidationState(
              current.fieldValidationState,
              fieldKey,
              value,
            )
          : current.fieldValidationState,
        responsibilities: current.responsibilities.map((responsibility) =>
          responsibility.id === responsibilityId
            ? {
                ...responsibility,
                activities: responsibility.activities.map((activity, index) =>
                  index === activityIndex
                    ? { ...activity, text: value }
                    : activity,
                ),
              }
            : responsibility,
        ),
      };
    });
  };

  const addActivity = (responsibilityId: string) => {
    markGuideSeen("activity");
    markWorkMapUnsaved();
    setWorkMap((current) => ({
      ...current,
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
  };

  const removeActivity = (responsibilityId: string, activityIndex: number) => {
    markWorkMapUnsaved();
    setWorkMap((current) => ({
      ...current,
      responsibilities: current.responsibilities.map((responsibility) => {
        if (responsibility.id !== responsibilityId) return responsibility;

        const nextActivities = responsibility.activities.filter(
          (_, index) => index !== activityIndex,
        );

        return {
          ...responsibility,
          activities:
            nextActivities.length > 0
              ? nextActivities
              : [createEmptyActivity(0)],
        };
      }),
    }));
  };

  const addResponsibility = (primaryArea?: string | null) => {
    markGuideSeen("responsibility");
    markWorkMapUnsaved();
    setWorkMap((current) =>
      applyResponsibilityAreaAssignments({
        ...current,
        responsibilities: [
          ...current.responsibilities,
          {
            id: createResponsibilityId(current.responsibilities.length),
            text: "",
            primaryArea: primaryArea ?? null,
            areaAssignmentMode: primaryArea
              ? "user_selected_from_declared_areas"
              : null,
            activities: [createEmptyActivity(0)],
          },
        ],
      }),
    );
  };

  const removeResponsibility = (index: number) => {
    if (!canDeleteResponsibility(index)) return;

    markWorkMapUnsaved();
    setWorkMap((current) => ({
      ...current,
      responsibilities: current.responsibilities.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const resolvedStartPositionContext =
    workMap.startPositionContext ?? startPositionContext;

  const handleStartPositionSave = (context: StartPositionContext) => {
    onStartPositionContextChange?.(context);
    setWorkMap((current) => {
      const nextWorkMap = {
        ...current,
        startPositionContext: { ...context },
      };
      writeWorkMapDraft(nextWorkMap, sessionId);
      return nextWorkMap;
    });
    setStartPositionEditOpen(false);
  };

  const scrollToOperationalBlockTarget = useCallback((targetKey: string | null) => {
    if (!targetKey) return;

    if (targetKey === "areas") {
      areaSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const responsibilityMatch = /^responsibility:(.+)$/.exec(targetKey);
    if (responsibilityMatch) {
      const responsibilityIndex = workMap.responsibilities.findIndex(
        (row) => row.id === responsibilityMatch[1],
      );
      if (responsibilityIndex === 0) {
        responsibilitySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    const activityCoverageMatch = /^coverage:activities:(.+)$/.exec(targetKey);
    if (activityCoverageMatch) {
      const responsibilityIndex = workMap.responsibilities.findIndex(
        (row) => row.id === activityCoverageMatch[1],
      );
      if (responsibilityIndex === 0) {
        activitySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [workMap.responsibilities]);

  const handleSave = async () => {
    isSavingRef.current = true;
    setOperationalSaveAttempted(true);
    setSaveBlockMessage(null);
    setSaveDetailMessage(null);
    setSaveErrorMessage(null);
    setSaveFeedbackType(null);
    setFirstSaveBlockTarget(null);
    markGuideSeen("save");

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLTextAreaElement) {
      activeElement.blur();
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    }

    const snapshot = applyResponsibilityAreaAssignments(latestWorkMapRef.current);
    const currentHasAreas =
      snapshot.selectedAreas.length > 0 || snapshot.customAreas.length > 0;
    const readinessResult = evaluateWorkMapOperationalReadiness({
      workMap: snapshot,
      hasAreas: currentHasAreas,
    });

    if (!readinessResult.canEnterReviewMode) {
      setSaveBlockMessage(readinessResult.globalMessage);
      setSaveDetailMessage(readinessResult.globalDetailMessage || null);
      setSaveFeedbackType("block");
      setFirstSaveBlockTarget(readinessResult.firstBlockingTarget);
      scrollToOperationalBlockTarget(readinessResult.firstBlockingTarget);
      isSavingRef.current = false;
      return;
    }

    const savedPayload: WorkMapData = {
      ...snapshot,
      isSaved: true,
      isReviewMode: true,
      saveAttempts: 0,
      savedWithWarnings: readinessResult.savedWithWarnings,
    };

    try {
      await onSave(savedPayload);
      setWorkMap(savedPayload);
      dismissUnsavedContinueNotice();
      setSaveBlockMessage(null);
      setSaveErrorMessage(null);
      setSaveFeedbackType(null);
      setFirstSaveBlockTarget(null);
      setFieldWarnings([]);
      setOperationalSaveAttempted(false);
    } catch {
      setSaveErrorMessage("No pudimos guardar el mapa. Inténtalo de nuevo.");
      setSaveFeedbackType("error");
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleEdit = () => {
    setWorkMap((current) => ({
      ...current,
      isReviewMode: false,
      isSaved: false,
      savedWithWarnings: false,
    }));
    dismissUnsavedContinueNotice();
    setSaveAttemptTriggered(false);
    setOperationalSaveAttempted(false);
    setSaveBlockMessage(null);
    setSaveDetailMessage(null);
    setSaveErrorMessage(null);
    setSaveFeedbackType(null);
    setFirstSaveBlockTarget(null);
    setFieldWarnings([]);
  };

  const handleContinue = async () => {
    if (!workMap.isSaved) {
      setShowUnsavedContinueNotice(true);
      setHighlightSaveButton(true);
      return;
    }

    if (workMap.isReviewMode) {
      const payload: WorkMapData = {
        ...applyResponsibilityAreaAssignments(workMap),
        isSaved: true,
      };
      await onContinue(payload);
      clearWorkMapDraft(sessionId);
      setDraftRestored(false);
      return;
    }

    if (!canContinue) {
      setShowUnsavedContinueNotice(true);
      setHighlightSaveButton(true);
      return;
    }

    const payload: WorkMapData = {
      ...applyResponsibilityAreaAssignments(workMap),
      isSaved: true,
    };

    await onContinue(payload);
    clearWorkMapDraft(sessionId);
    setDraftRestored(false);
  };

  const showSaveWarning = workMap.isSaved && workMap.savedWithWarnings;

  // Avance real por paso (datos capturados), independiente de guideSeen.
  const stepCompleted: Record<WorkMapGuideKey, boolean> = {
    area: hasAreas,
    responsibility: nonEmptyResponsibilities.length > 0,
    activity: nonEmptyActivities.length > 0,
    save: workMap.isSaved,
  };

  const showAreaError = fieldWarnings.includes("areas");

  const openGuideContent = openGuide ? guideContent[openGuide] : null;
  const openGuideStepMeta = openGuide
    ? guideSteps.find((step) => step.key === openGuide)
    : null;
  const OpenGuideIcon = openGuideStepMeta?.Icon ?? GuideIconMapPin;

  return (
    <div className={styles.workMapOuter}>
      <div className={styles.appShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <EveLogo size="sm" variant="muted" />
          </div>

          <nav aria-label="Guía del mapa de trabajo" className={styles.guideNav}>
            {guideSteps.map((step) => {
              const StepIcon = step.Icon;
              const isOpen = openGuide === step.key;
              const isSeen = guideSeen[step.key];
              const isCompleted = stepCompleted[step.key];
              const isActive = introCompleted
                ? isOpen
                : activeGuide === step.key || (isOpen && isSeen);

              return (
                <div
                  aria-current={isActive ? "step" : undefined}
                  aria-expanded={isOpen}
                  aria-label={
                    isCompleted ? `${step.label} (completado)` : step.label
                  }
                  className={[
                    styles.guideStep,
                    isActive ? styles.guideStepActive : "",
                    isCompleted ? styles.guideStepCompleted : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={step.key}
                  onClick={() => openGuideStep(step.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openGuideStep(step.key);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span aria-hidden="true" className={styles.guideStepIcon}>
                    <StepIcon />
                  </span>
                  <span className={styles.guideStepLabel}>{step.label}</span>
                  {isCompleted && !isActive ? (
                    <span aria-hidden="true" className={styles.guideStepCheck}>
                      <GuideIconCheck />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </nav>

          {openGuideContent && openGuide && (
            <section
              aria-labelledby="work-map-guide-heading"
              className={styles.guideCard}
            >
              <div aria-hidden="true" className={styles.guideCardIcon}>
                <OpenGuideIcon />
              </div>
              <h2 className={styles.guideCardTitle} id="work-map-guide-heading">
                {openGuideContent.title}
              </h2>
              {openGuide === "responsibility" || openGuide === "activity" ? (
                <WorkMapCognitiveSideGuide guideKey={openGuide} />
              ) : (
                <GuideCardBody body={openGuideContent.body} />
              )}
            </section>
          )}

          <div className={styles.sidebarFooter}>
            <p className={styles.sidebarFooterText}>
              Strategic &amp; Operational Architecture
              <br />
              Enterprise Viability Engine
            </p>
          </div>
        </aside>

        <div className={styles.main}>
        <ClientFlowHeader
          className={styles.pageHeader}
          eyebrow={
            greetingFirstName
              ? `Bienvenido, ${greetingFirstName}`
              : "Bienvenido"
          }
          subtitle="Captura responsabilidades y actividades reales para construir la primera versión de tu mapa de trabajo."
          title="Construye el mapa de tu trabajo"
          userMenu={
            onSignOut ? (
              <ClientUserMenu
                displayName={resolvedFullName}
                initials={avatarInitial}
                onSignOut={onSignOut}
              />
            ) : undefined
          }
        />

        {startPositionEditOpen ? (
          <StartPositionEditModal
            initialContext={resolvedStartPositionContext}
            onCancel={() => setStartPositionEditOpen(false)}
            onSave={handleStartPositionSave}
          />
        ) : null}

        <section className={styles.workMapCard}>
          <div
            className={[
              styles.workMapCardHeader,
              activeGuide === "save" ? styles.saveButtonGuideFocus : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={saveSectionRef}
            tabIndex={-1}
          >
            <h3>Mapa del trabajo que realizas</h3>
            <div className={styles.cardHeaderActions}>
              {lastDraftSavedAt ? (
                <span className={styles.draftSavedIndicator} role="status">
                  Borrador guardado {lastDraftSavedAt}
                </span>
              ) : null}
              {isReviewMode ? (
                <button
                  className={styles.saveButton}
                  disabled={disabled}
                  onClick={handleEdit}
                  type="button"
                >
                  Editar
                </button>
              ) : (
                <button
                  className={[
                    styles.saveButton,
                    highlightSaveButton ? styles.saveButtonHighlight : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={disabled}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {disabled ? "Guardando..." : "Guardar mapa"}
                </button>
              )}
            </div>
          </div>

          {(saveBlockMessage || saveErrorMessage) && !isReviewMode ? (
            <div
              className={[
                styles.cardTopNotice,
                styles.cardTopNoticeBlocking,
              ]
                .filter(Boolean)
                .join(" ")}
              role="status"
            >
              <span aria-hidden="true" className={styles.cardTopNoticeIcon}>
                <InfoIcon />
              </span>
              <div className={styles.cardTopNoticeCopy}>
                <p className={styles.cardTopNoticeLead}>
                  {saveErrorMessage ?? saveBlockMessage}
                </p>
                {saveFeedbackType === "block" && saveDetailMessage ? (
                  <p className={styles.cardTopNoticeSub}>{saveDetailMessage}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {showUnsavedContinueNotice && !workMap.isSaved && !isReviewMode && (
            <div
              className={[
                styles.cardTopNotice,
                styles.cardTopNoticeBlocking,
              ]
                .filter(Boolean)
                .join(" ")}
              role="status"
            >
              <span aria-hidden="true" className={styles.cardTopNoticeIcon}>
                <InfoIcon />
              </span>
              <div className={styles.cardTopNoticeCopy}>
                <p className={styles.cardTopNoticeLead}>
                  Antes de continuar, guarda la hoja de trabajo.
                </p>
                <p className={styles.cardTopNoticeSub}>
                  EVE revisará la estructura de tus responsabilidades y
                  actividades.
                </p>
              </div>
            </div>
          )}

          {draftRestored && (
            <p className={styles.draftRecoveredHint} role="status">
              Recuperamos el borrador del mapa de trabajo guardado en este
              navegador.
            </p>
          )}

          {isReviewMode && (
            <div className={styles.reviewSavedBanner} role="status">
              <p className={styles.reviewSavedBannerTitle}>Mapa guardado</p>
              <p className={styles.reviewSavedBannerText}>
                Esta es la primera versión del mapa de tu trabajo. Capturaste{" "}
                {nonEmptyResponsibilities.length}{" "}
                {nonEmptyResponsibilities.length === 1
                  ? "responsabilidad"
                  : "responsabilidades"}{" "}
                y {nonEmptyActivities.length}{" "}
                {nonEmptyActivities.length === 1 ? "actividad" : "actividades"}.
              </p>
              {workMap.savedWithWarnings && (
                <p className={styles.reviewSavedBannerWarning}>
                  {SAVE_WITH_WARNINGS_MESSAGE}
                </p>
              )}
            </div>
          )}

          {showSaveWarning && !isReviewMode && (
            <div className={styles.validationPanel}>
              <div className={styles.validationWarning}>
                {SAVE_WITH_WARNINGS_MESSAGE}
              </div>
            </div>
          )}

          <div className={styles.workTable}>
            <div
              className={`work-map-table-header ${styles.workMapTableHeader}`}
            >
              <div>Sección</div>
              <div>Contenido de trabajo</div>
            </div>

            <div
              className={[
                "work-map-row",
                styles.workMapRow,
                styles.workMapRowArea,
                activeGuide === "area" ? styles.workRowGuideFocus : "",
              ]
                .filter(Boolean)
                .join(" ")}
              ref={areaSectionRef}
              tabIndex={-1}
            >
              <div className={styles.sectionCellArea}>
                <div className={styles.sectionCellHeading}>
                  <div className={styles.sectionCellTitles}>
                    <p className={styles.sectionTitle}>Ubicar trabajo</p>
                    <p className={styles.sectionSubtitle}>
                      Áreas donde participas
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.contentCellArea}>
                {isReviewMode ? (
                  <div className={styles.areaChipRow}>
                    {reviewModeAreas.map((area) => (
                      <span
                        className={[
                          styles.areaChip,
                          styles.areaChipSelected,
                          styles.reviewAreaChip,
                        ].join(" ")}
                        key={area}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className={styles.areaChipHint}>
                      Selecciona una o varias áreas
                    </p>
                    <div className={styles.areaChipRow}>
                      {orderedPredefinedAreas.selectedPredefined.map((area) => (
                        <button
                          aria-pressed={true}
                          className={[styles.areaChip, styles.areaChipSelected]
                            .filter(Boolean)
                            .join(" ")}
                          key={area}
                          onClick={() => toggleArea(area)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className={styles.areaChipIcon}
                          >
                            <ChipCheckIcon />
                          </span>
                          {area}
                        </button>
                      ))}
                      {workMap.customAreas.map((area) => (
                        <span
                          className={[
                            styles.areaChip,
                            styles.areaChipSelected,
                            styles.customAreaChip,
                          ].join(" ")}
                          key={area}
                        >
                          {area}
                          <button
                            aria-label={`Quitar area ${area}`}
                            className={styles.customAreaRemove}
                            onClick={() => removeCustomArea(area)}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {orderedPredefinedAreas.unselectedPredefined.map((area) => (
                        <button
                          aria-pressed={false}
                          className={styles.areaChip}
                          key={area}
                          onClick={() => toggleArea(area)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className={styles.areaChipIcon}
                          >
                            <ChipPlusIcon />
                          </span>
                          {area}
                        </button>
                      ))}
                      <button
                        aria-expanded={otherAreaInputOpen}
                        className={styles.areaChip}
                        onClick={() => {
                          markGuideSeen("area");
                          setOtherAreaInputOpen((open) => !open);
                        }}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className={styles.areaChipIcon}
                        >
                          <ChipPlusIcon />
                        </span>
                        {OTHER_AREA_CHIP_LABEL}
                      </button>
                    </div>
                    {otherAreaInputOpen && (
                      <div className={styles.otherAreaInputRow}>
                        <input
                          className={styles.otherAreaInput}
                          onChange={(event) =>
                            setCustomAreaInput(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              confirmCustomArea();
                            }
                          }}
                          placeholder="Escribe el nombre del area"
                          value={customAreaInput}
                        />
                        <button
                          className={styles.otherAreaConfirm}
                          onClick={confirmCustomArea}
                          type="button"
                        >
                          Agregar area
                        </button>
                      </div>
                    )}
                    {(showAreaError || fieldWarnings.includes("areas")) && (
                      <p className={styles.areaError}>
                        Selecciona al menos un area predefinida o agrega una area
                        personalizada.
                      </p>
                    )}
                    <button
                      className={styles.exampleLink}
                      onClick={() => openGuideStep("area")}
                      type="button"
                    >
                      Ver ejemplo
                    </button>
                  </>
                )}
              </div>
            </div>

            {(isReviewMode
              ? reviewModeResponsibilities
              : workMap.responsibilities
            ).map((responsibility, responsibilityIndex) => (
              <div key={responsibility.id}>
                <div
                  className={[
                    "work-map-row",
                    styles.workMapRow,
                    styles.workMapRowResponsibility,
                    activeGuide === "responsibility" && responsibilityIndex === 0
                      ? styles.workRowGuideFocus
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  ref={
                    responsibilityIndex === 0
                      ? responsibilitySectionRef
                      : undefined
                  }
                  tabIndex={responsibilityIndex === 0 ? -1 : undefined}
                >
                  <div className={styles.sectionCellResponsibility}>
                    <div className={styles.sectionCellHeading}>
                      <div className={styles.sectionCellTitles}>
                        <p className={styles.sectionTitle}>
                          {`Responsabilidad ${responsibilityIndex + 1}${
                            shouldAssignResponsibilityArea &&
                            responsibility.primaryArea
                              ? ` ${responsibility.primaryArea}`
                              : ""
                          }`}
                        </p>
                        <p className={styles.sectionSubtitle}>
                          Define de qué eres responsable.
                        </p>
                      </div>
                    </div>
                    {!isReviewMode &&
                      canDeleteResponsibility(responsibilityIndex) && (
                        <button
                          className={styles.removeResponsibilityLink}
                          onClick={() => removeResponsibility(responsibilityIndex)}
                          type="button"
                        >
                          Eliminar responsabilidad
                        </button>
                      )}
                  </div>
                  <div className={styles.contentCellResponsibility}>
                    {isReviewMode ? (
                      responsibility.text.trim() ? (
                        <p className={styles.reviewResponsibilityText}>
                          {responsibility.text.trim()}
                        </p>
                      ) : null
                    ) : (
                      (() => {
                        const responsibilityFieldStateKey =
                          responsibilityFieldKey(responsibility.id);
                        const validationEntry =
                          workMap.fieldValidationState[
                            responsibilityFieldStateKey
                          ];
                        const hasContent = Boolean(responsibility.text.trim());
                        const showAssist =
                          shouldShowFieldAssist(
                            validationEntry,
                            saveAttemptTriggered,
                            hasContent,
                          ) && validationEntry?.lastMessageType !== "coverage";
                        const highlightField =
                          showAssist && validationEntry?.status === "needs_help";
                        const showInlineHint = shouldShowInlineFieldHint(
                          validationEntry,
                          showAssist,
                        );
                        const responsibilityCoverageMessage =
                          saveAttemptTriggered &&
                          validationEntry?.lastMessageType === "coverage"
                            ? validationEntry.message?.trim()
                            : undefined;

                        return (
                          <div className={styles.fieldGroup}>
                            <textarea
                              aria-label={`Responsabilidad ${responsibilityIndex + 1}`}
                              className={[
                                styles.responsibilityInput,
                                highlightField
                                  ? styles.responsibilityInputWarning
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onBlur={() =>
                                handleSyntaxFieldBlur(
                                  responsibilityFieldStateKey,
                                  responsibility.text,
                                  "responsibility",
                                )
                              }
                              onChange={(event) =>
                                updateResponsibilityText(
                                  responsibility.id,
                                  event.target.value,
                                )
                              }
                              placeholder="Describe la responsabilidad principal"
                              rows={1}
                              value={responsibility.text}
                            />
                            {/*
                              <div
                                aria-label={`Área principal de responsabilidad ${responsibilityIndex + 1}`}
                                className={styles.areaChipRow}
                                role="group"
                              >
                                {declaredWorkAreas.map((area) => {
                                  const selected = responsibility.primaryArea === area;

                                  return (
                                    <button
                                      className={[
                                        styles.areaChip,
                                        selected ? styles.areaChipSelected : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      key={area}
                                      onClick={() =>
                                        updateResponsibilityPrimaryArea(
                                          responsibility.id,
                                          area,
                                        )
                                      }
                                      type="button"
                                    >
                                      <span aria-hidden="true">
                                        {selected ? "✓" : "+"}
                                      </span>
                                      {area}
                                    </button>
                                  );
                                })}
                              </div>
                            */}
                            {showInlineHint && validationEntry?.message ? (
                              <p className={styles.fieldSoftHint}>
                                {validationEntry.message}
                              </p>
                            ) : null}
                            {responsibilityCoverageMessage ? (
                              <p className={styles.fieldSoftHint} role="status">
                                {responsibilityCoverageMessage}
                              </p>
                            ) : null}
                            {showAssist && validationEntry ? (
                              <FieldAssistCard
                                entry={validationEntry}
                                title="Revisa esta responsabilidad antes de guardar"
                              />
                            ) : null}
                            {responsibilityIndex === 0 ? (
                              <button
                                className={styles.exampleLink}
                                onClick={() => openGuideStep("responsibility")}
                                type="button"
                              >
                                Ver ejemplo
                              </button>
                            ) : null}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                <div
                  className={[
                    "work-map-row",
                    styles.workMapRow,
                    styles.workMapRowActivity,
                    activeGuide === "activity" && responsibilityIndex === 0
                      ? styles.workRowGuideFocus
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  ref={
                    responsibilityIndex === 0 ? activitySectionRef : undefined
                  }
                  tabIndex={responsibilityIndex === 0 ? -1 : undefined}
                >
                  <div className={styles.sectionCellActivity}>
                    <div className={styles.sectionCellHeading}>
                      <div className={styles.sectionCellTitles}>
                        <p className={styles.sectionTitle}>Actividades concretas</p>
                        <p className={styles.sectionSubtitle}>
                          Qué haces para cumplirla.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.contentCellActivity}>
                    {isReviewMode ? (
                      <ol className={styles.reviewActivityList}>
                        {getReviewModeActivities(responsibility).map(
                          (activityText, activityIndex) => (
                            <li
                              className={styles.reviewActivityItem}
                              key={`${responsibility.id}-review-${activityIndex}`}
                            >
                              <span
                                aria-hidden="true"
                                className={styles.reviewActivityIndex}
                              >
                                {activityIndex + 1}.
                              </span>
                              <span className={styles.reviewActivityText}>
                                {activityText}
                              </span>
                            </li>
                          ),
                        )}
                      </ol>
                    ) : (
                      <>
                        <div className={styles.activityList}>
                          {responsibility.activities.map((activity, activityIndex) => {
                            const key = `${responsibility.id}:${activityIndex}`;
                            const activityText = getActivityText(activity);
                            const activityFieldStateKey = activityFieldKey(
                              activity.id,
                            );
                            const validationEntry =
                              workMap.fieldValidationState[
                                activityFieldStateKey
                              ];
                            const hasContent = Boolean(activityText.trim());
                            const showAssist =
                              shouldShowFieldAssist(
                                validationEntry,
                                saveAttemptTriggered,
                                hasContent,
                              ) &&
                              validationEntry?.lastMessageType !== "coverage";
                            const highlightField =
                              showAssist &&
                              validationEntry?.status === "needs_help";
                            const showActivityRemove =
                              canDeleteActivity(responsibilityIndex);
                            const showInlineHint = shouldShowInlineFieldHint(
                              validationEntry,
                              showAssist,
                            );

                            return (
                              <div className={styles.activityItem} key={key}>
                                {showActivityRemove && (
                                  <div className={styles.activityItemHeader}>
                                    <button
                                      className={styles.activityRemove}
                                      onClick={() =>
                                        removeActivity(
                                          responsibility.id,
                                          activityIndex,
                                        )
                                      }
                                      type="button"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                                <div
                                  className={[
                                    styles.activityInputWrap,
                                    highlightField
                                      ? styles.activityInputWrapError
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  {activityText.trim() ? (
                                    <span
                                      aria-hidden="true"
                                      className={styles.activityInputPrefix}
                                    >
                                      {activityIndex + 1}.
                                    </span>
                                  ) : null}
                                  <textarea
                                    aria-label={`Actividad ${activityIndex + 1} de responsabilidad ${responsibilityIndex + 1}`}
                                    className={styles.activityInput}
                                    onBlur={() =>
                                      handleSyntaxFieldBlur(
                                        activityFieldStateKey,
                                        activityText,
                                        "activity",
                                      )
                                    }
                                    onChange={(event) =>
                                      updateActivity(
                                        responsibility.id,
                                        activityIndex,
                                        event.target.value,
                                      )
                                    }
                                    placeholder={`${activityIndex + 1}. Redacta una actividad concreta de tu trabajo`}
                                    rows={1}
                                    value={activityText}
                                  />
                                </div>
                                {showInlineHint && validationEntry?.message ? (
                                  <p className={styles.fieldSoftHint}>
                                    {validationEntry.message}
                                  </p>
                                ) : null}
                                {showAssist && validationEntry ? (
                                  <FieldAssistCard
                                    entry={validationEntry}
                                    title="Revisa esta actividad antes de guardar"
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          className={styles.addActivityLink}
                          onClick={() => addActivity(responsibility.id)}
                          type="button"
                        >
                          + Agregar otra actividad
                        </button>
                        {responsibilityIndex === 0 ? (
                          <button
                            className={styles.exampleLink}
                            onClick={() => openGuideStep("activity")}
                            type="button"
                          >
                            Ver ejemplo
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                {!isReviewMode &&
                shouldAssignResponsibilityArea &&
                responsibility.primaryArea &&
                !workMap.responsibilities.some(
                  (item, index) =>
                    index > responsibilityIndex &&
                    item.primaryArea === responsibility.primaryArea,
                ) ? (
                  <div className={styles.addResponsibilityBlock}>
                    <button
                      className={styles.addResponsibilityButton}
                      onClick={() =>
                        addResponsibility(responsibility.primaryArea)
                      }
                      type="button"
                    >
                      {`+ Agregar responsabilidad para ${responsibility.primaryArea}`}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {!isReviewMode && !shouldAssignResponsibilityArea && (
            <div className={styles.addResponsibilityBlock}>
              <button
                className={styles.addResponsibilityButton}
                onClick={() => addResponsibility()}
                type="button"
              >
                + Agregar responsabilidad
              </button>
            </div>
          )}

          <div className={styles.workMapCardFooter}>
            <button
              className={styles.backButton}
              disabled={disabled}
              onClick={() => setStartPositionEditOpen(true)}
              type="button"
            >
              Regresar
            </button>
            <button
              className={styles.clearDraftLink}
              onClick={() => setWorkMap(createEmptyWorkMap())}
              type="button"
            >
              Limpiar borrador local
            </button>
            <div className={styles.footerRight}>
              {isReviewMode && (
                <p className={styles.reviewContinueHint}>
                  Revisa que este mapa represente tu trabajo real antes de
                  continuar.
                </p>
              )}
              <button
                className={styles.continueButton}
                disabled={
                  disabled ||
                  (isReviewMode
                    ? !workMap.isSaved
                    : workMap.isSaved && !canContinue)
                }
                onClick={() => void handleContinue()}
                title={
                  !workMap.isSaved
                    ? "Primero guarda el mapa de trabajo"
                    : undefined
                }
                type="button"
              >
                {disabled ? "Procesando..." : "Continuar"}
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 11v5M12 8h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ChipPlusIcon({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="11"
      viewBox="0 0 24 24"
      width="11"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChipCheckIcon({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="11"
      viewBox="0 0 24 24"
      width="11"
    >
      <path
        d="m5 12 4 4 10-10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GuideIconCheck({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="12"
      viewBox="0 0 24 24"
      width="12"
    >
      <path
        d="m5 12 4 4 10-10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GuideIconMapPin({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function GuideIconUserRound({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.5c1.2-3 3.7-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function GuideIconCheckSquare({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
        width="14"
        x="5"
        y="5"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function GuideIconSave({ className }: GuideStepIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M5 5h11l3 3v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <path
        d="M9 5V3h6v2M9 15h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}
