"use client";

import { useEffect, useState } from "react";
import { EveLogo } from "@/components/EveLogo";
import {
  applyFieldTextChangeToValidationState,
  evaluateFieldValidationEntry,
  evaluateInlineFieldValidationEntry,
  type FieldValidationEntry,
  type FieldValidationState,
  shouldEmitRedactionAssistance,
  shouldShowFieldAssist,
  shouldShowInlineFieldHint,
} from "@/domain/work-map";
import {
  classifyActivitySufficiency,
  detectActivityParts,
  getActivityAssistMessage,
} from "@/services/work-map-activity-validation";
import {
  classifyResponsibilitySufficiency,
  getResponsibilityAssistMessage,
} from "@/services/work-map-responsibility-validation";
import { COVERAGE_MESSAGES } from "@/services/work-map-save-validation";
import { normalizeWorkMapOutputPresentation } from "@/services/workmap-to-block0-prefill";
import { buildOperationalDescriptionIntroGuide } from "@/services/operational-description-coach/build-operational-description-intro-guide";
import { ComoOcurreSection, type CanvasAnchoredActivity } from "./ComoOcurreSection";
import {
  detectAnchorClarification,
  type AnchorClarificationKind,
} from "./detect-anchor-clarification";
import { SheetMotion } from "./SheetMotion";
import styles from "./eve-canvas.module.css";

type CanvasFieldHintTone = "soft" | "review" | "warning" | "coverage";

type CanvasFieldHint = {
  message: string;
  tone: CanvasFieldHintTone;
};

function resolveCanvasFieldHint(
  entry: FieldValidationEntry | undefined,
  advanceAttempted: boolean,
): CanvasFieldHint | null {
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

function getCanvasActivityCoverageMessage(
  responsibility: CanvasWorkmapResponsibility,
): string | undefined {
  if (!responsibility.text.trim()) {
    return undefined;
  }

  const written = responsibility.activities.filter((activity) => activity.trim().length > 0)
    .length;

  if (written === 0) {
    return COVERAGE_MESSAGES.needTwoActivities;
  }

  if (written === 1) {
    return COVERAGE_MESSAGES.needOneMoreActivity;
  }

  return undefined;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const workmapStepCards = [
  {
    number: "01 /",
    title: "UBICACIÓN",
    copy: "Dónde participa tu trabajo dentro de la empresa.",
    detailTitle: "Primero ubicamos dónde participa tu trabajo.",
    detailCopy:
      "No buscamos tu departamento formal. Buscamos en qué parte de la operación tu trabajo realmente interviene.",
  },
  {
    number: "02 /",
    title: "RESPONSABILIDAD",
    copy: "De qué eres responsable en la práctica.",
    detailTitle: "Después aclaramos de qué eres responsable.",
    detailCopy:
      "La idea es separar el cargo formal de la responsabilidad real que sostienes en la operación.",
  },
  {
    number: "03 /",
    title: "ACTIVIDADES",
    copy: "Qué acciones sostienen cada responsabilidad.",
    detailTitle: "Luego bajamos esa responsabilidad a actividades reales.",
    detailCopy:
      "Aquí convertimos responsabilidades generales en acciones observables que haces, recibes, entregas o coordinas.",
  },
  {
    number: "04 /",
    title: "GUARDAR MAPA",
    copy: "Validar estructura mínima para continuar.",
    detailTitle: "Finalmente guardamos una estructura mínima del mapa.",
    detailCopy:
      "Antes de seguir, verificamos que exista suficiente estructura para abrir la hoja de trabajo sin perder contexto.",
  },
];

const workmapAreas = [
  "Operaciones / Producción",
  "Ventas / Comercial",
  "Logística / Entrega",
  "I+D / Innovación",
  "Gestión de Talento (RRHH)",
  "Finanzas y Tesorería",
  "Tecnología e Infraestructura",
  "Administración / Legal",
  "Marketing Estratégico",
  "Planeación y Estrategia",
];

type CanvasWorkmapResponsibility = {
  id: string;
  area: string;
  text: string;
  activities: string[];
};

type CanvasActivityAnchorCandidate = {
  area: string;
  responsibility: string;
  activityLiteral: string;
};

type AnchorStance = "pending" | "confirmed" | "correcting" | "reconstructing";

const FALLBACK_ANCHOR_CANDIDATES: CanvasActivityAnchorCandidate[] = [
  {
    area: "Operaciones / Producción",
    responsibility: "Mantener el flujo operativo del área con información usable para dirección",
    activityLiteral:
      "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  },
  {
    area: "Operaciones / Producción",
    responsibility: "Mantener el flujo operativo del área con información usable para dirección",
    activityLiteral:
      "Preparo el resumen de variaciones para que dirección revise los cambios más relevantes",
  },
];

function buildDevActivityFromCandidate(
  candidate: CanvasActivityAnchorCandidate,
): CanvasAnchoredActivity {
  const prefill = prefillDetailFieldsFromActivityLiteral(candidate.activityLiteral);
  return {
    area: candidate.area,
    activityLiteral: candidate.activityLiteral,
    actionVerb: prefill.actionVerb || "Analizo",
    objectText: prefill.objectText || "la información de esta actividad",
    criterion: prefill.criterion || "según el criterio habitual del área",
    outputText: prefill.outputText || "el resultado listo para quien sigue",
    summary: [
      prefill.actionVerb || "Trabajo",
      prefill.objectText || "esta actividad",
      "y dejo",
      prefill.outputText || "el resultado listo",
    ].join(" "),
    startHint: "llega lo necesario para empezar",
    endHint: "el resultado queda listo para quien sigue",
    frequency: "En el ritmo habitual del área",
    primaryActor: "Yo",
  };
}

const FALLBACK_ANCHORED_ACTIVITIES: CanvasAnchoredActivity[] =
  FALLBACK_ANCHOR_CANDIDATES.map(buildDevActivityFromCandidate);

const MAX_PRIMARY_ACTIVITIES = 8;

function pickPrimaryActivitiesFromWorkmap(
  selectedAreas: string[],
  responsibilities: CanvasWorkmapResponsibility[],
): CanvasActivityAnchorCandidate[] {
  const selected: CanvasActivityAnchorCandidate[] = [];

  for (const responsibility of responsibilities) {
    if (!selectedAreas.includes(responsibility.area)) {
      continue;
    }

    for (const activity of responsibility.activities) {
      const activityLiteral = activity.trim();

      if (!activityLiteral) {
        continue;
      }

      selected.push({
        area: responsibility.area,
        responsibility: responsibility.text.trim(),
        activityLiteral,
      });

      if (selected.length >= MAX_PRIMARY_ACTIVITIES) {
        return selected;
      }
    }
  }

  return selected;
}

function getSelectedActivityHeading(index: number) {
  const ordinals = [
    "Primera",
    "Segunda",
    "Tercera",
    "Cuarta",
    "Quinta",
    "Sexta",
    "Séptima",
    "Octava",
  ];

  return `${ordinals[index] ?? `${index + 1}.ª`} actividad seleccionada`;
}

/** Tres claves de orientación previa al ancla de actividades — sin jerga interna. */
const ACTIVITY_STUDY_ORIENT_POINTS = [
  {
    number: "01",
    title: "El objeto es la actividad",
    copy: "No estudiamos el mapa entero de un golpe. Cada actividad seleccionada se vuelve el foco: la miramos de cerca, como una pieza concreta de tu trabajo.",
  },
  {
    number: "02",
    title: "Pocas, a fondo",
    copy: "Como máximo se eligen ocho para estudiarlas con detalle; las demás del mapa se quedan como contexto de fondo, sin pedirte el mismo recorrido.",
  },
  {
    number: "03",
    title: "Una detrás de otra",
    copy: "Lo que sigue abre la primera actividad seleccionada y la recorre en bloques de estudio enfocado: primero confirmar que así ocurre; luego el detalle de qué haces y qué queda listo; después cómo entra en tu día a día (frecuencia, contexto, inicio y cierre); y, si hace falta, una precisión corta. Cuando ese estudio termina, pasamos a la siguiente actividad seleccionada.",
  },
] as const;

/** Same WorkMap → B0-Q01 decomposition used by official Significado prefill. */
function prefillDetailFieldsFromActivityLiteral(activityLiteral: string) {
  const parts = detectActivityParts(activityLiteral);

  return {
    actionVerb: parts.action?.trim() ?? "",
    objectText: parts.object?.trim() ?? "",
    criterion: parts.how?.trim() ?? "",
    outputText: parts.result
      ? normalizeWorkMapOutputPresentation(parts.result)
      : "",
  };
}

let workmapResponsibilitySeq = 0;

function createWorkmapResponsibility(area: string, index: number): CanvasWorkmapResponsibility {
  workmapResponsibilitySeq += 1;

  return {
    id: `${area}-${index}-${workmapResponsibilitySeq}`,
    area,
    text: "",
    activities: ["", ""],
  };
}

function WorkmapUnlockCounter({ viewedStepCount }: { viewedStepCount: number }) {
  const total = workmapStepCards.length;
  const isComplete = viewedStepCount >= total;

  return (
    <div className={styles.orientProgress} aria-live="polite">
      <p className={styles.orientProgressLabel}>
        {isComplete ? "Listo para el mapa" : "Revisa los 4 pasos"}
      </p>
      <div aria-hidden="true" className={styles.orientProgressTrack}>
        {Array.from({ length: total }, (_, index) => (
          <span
            className={cx(
              styles.orientProgressTick,
              index < viewedStepCount && styles.orientProgressTickDone,
            )}
            key={`unlock-tick-${index}`}
          />
        ))}
      </div>
      <span className={styles.orientProgressCount}>
        {viewedStepCount}
        <span>/ {total}</span>
      </span>
    </div>
  );
}

function getResponsibilityOrdinalWord(index: number) {
  return ["primer", "segunda", "tercera", "cuarta", "quinta", "sexta"][index] ?? `${index + 1}`;
}

function scrollToId(id: string) {
  const alignToSection = (behavior: ScrollBehavior) => {
    const element = document.getElementById(id);

    if (!element) {
      return false;
    }

    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top), behavior });
    return true;
  };

  const tryScroll = (attemptsLeft: number) => {
    if (alignToSection("smooth")) {
      // sheetReveal usa translateY; re-alineamos al terminar la animación
      window.setTimeout(() => {
        alignToSection("auto");
      }, 520);
      return;
    }

    if (attemptsLeft > 0) {
      requestAnimationFrame(() => tryScroll(attemptsLeft - 1));
    }
  };

  requestAnimationFrame(() => tryScroll(24));
}

function isWorkmapStructureReady(
  selectedAreas: string[],
  responsibilities: CanvasWorkmapResponsibility[],
) {
  if (selectedAreas.length === 0) {
    return false;
  }

  const areaResponsibilities = responsibilities.filter((responsibility) =>
    selectedAreas.includes(responsibility.area),
  );

  if (areaResponsibilities.length === 0) {
    return false;
  }

  return areaResponsibilities.every(
    (responsibility) =>
      responsibility.text.trim().length > 0 &&
      responsibility.activities.filter((activity) => activity.trim().length > 0).length >= 2,
  );
}

const estadoAPlaceOptions = [
  "Soy dueño/a, socio/a o parte de la dirección general.",
  "Estoy a cargo o dirijo un área.",
  "Superviso o coordino el trabajo de otras personas.",
  "Analizo información, datos o procesos de la empresa.",
  "Apoyo en administración, ventas, producción, atención o soporte.",
  "Participo como externo, asesor o proveedor.",
  "Otro.",
];

const estadoADecisionOptions = [
  "Las tomo directamente.",
  "Participo en decidirlas.",
  "Las propongo o las preparo.",
  "Las ejecuto cuando ya fueron decididas.",
  "Las vivo como impacto, pero no participo mucho en decidirlas.",
];

/** Temporal: desbloquea todas las secciones del lienzo para navegación libre. */
const CANVAS_DEV_UNLOCK = true;

export function EveCanvasPrototype() {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(CANVAS_DEV_UNLOCK);
  const [isEstadoAComplete, setIsEstadoAComplete] = useState(CANVAS_DEV_UNLOCK);
  const [viewedWorkmapSteps, setViewedWorkmapSteps] = useState<string[]>(
    CANVAS_DEV_UNLOCK ? workmapStepCards.map((step) => step.number) : [],
  );
  const [isWorkmapReady, setIsWorkmapReady] = useState(CANVAS_DEV_UNLOCK);
  const [isSignificadoOrientComplete, setIsSignificadoOrientComplete] =
    useState(CANVAS_DEV_UNLOCK);
  const [anchorCandidates, setAnchorCandidates] = useState<CanvasActivityAnchorCandidate[]>(
    CANVAS_DEV_UNLOCK ? FALLBACK_ANCHOR_CANDIDATES : [],
  );
  const [isSignificadoComplete, setIsSignificadoComplete] = useState(CANVAS_DEV_UNLOCK);
  const [anchoredActivities, setAnchoredActivities] = useState<CanvasAnchoredActivity[]>(
    CANVAS_DEV_UNLOCK ? FALLBACK_ANCHORED_ACTIVITIES : [],
  );
  const hasOpenedAllWorkmapSteps =
    CANVAS_DEV_UNLOCK || viewedWorkmapSteps.length === workmapStepCards.length;

  const resolvedAnchorCandidates =
    anchorCandidates.length > 0 ? anchorCandidates : FALLBACK_ANCHOR_CANDIDATES;
  const resolvedAnchoredActivities =
    anchoredActivities.length > 0
      ? anchoredActivities
      : resolvedAnchorCandidates.map(buildDevActivityFromCandidate);

  function handleWorkmapStepChange(step: string | null) {
    setActiveStep(step);

    if (step) {
      setViewedWorkmapSteps((current) =>
        current.includes(step) ? current : [...current, step],
      );
    }
  }

  function handleContinueFromEstadoA() {
    setIsEstadoAComplete(true);
    scrollToId("workmap-explainer");
  }

  useEffect(() => {
    if (CANVAS_DEV_UNLOCK) {
      return;
    }

    if (hasOpenedAllWorkmapSteps) {
      scrollToId("workmap");
    }
  }, [hasOpenedAllWorkmapSteps]);

  const showExplainer = CANVAS_DEV_UNLOCK || isEstadoAComplete;
  const showWorkmap = CANVAS_DEV_UNLOCK || hasOpenedAllWorkmapSteps;
  const showSignificadoOrient = CANVAS_DEV_UNLOCK || isWorkmapReady;
  const showSignificado =
    CANVAS_DEV_UNLOCK || (isWorkmapReady && isSignificadoOrientComplete);
  const showProfundizar =
    CANVAS_DEV_UNLOCK ||
    (isWorkmapReady && isSignificadoOrientComplete && isSignificadoComplete);

  return (
    <main className={styles.canvas}>
      {!isAuthenticated ? (
        <LoginCanvas
          onLogin={() => {
            setIsAuthenticated(true);
            scrollToId("estado-a");
          }}
        />
      ) : (
        <>
          <EstadoASection onContinue={handleContinueFromEstadoA} />
          {showExplainer ? (
            <div className={styles.sheetReveal}>
              <WorkmapExplainerSection
                activeStep={activeStep}
                onStepChange={handleWorkmapStepChange}
                viewedSteps={viewedWorkmapSteps}
              />
            </div>
          ) : null}
          {showWorkmap ? (
            <div className={styles.sheetReveal}>
              <WorkmapBuilderSection
                devUnlock={CANVAS_DEV_UNLOCK}
                onPrimaryActivitiesChange={setAnchorCandidates}
                onStructureReadyChange={setIsWorkmapReady}
              />
            </div>
          ) : null}
          {showSignificadoOrient ? (
            <div className={styles.sheetReveal}>
              <SignificadoOrientSection
                onContinue={() => {
                  setIsSignificadoOrientComplete(true);
                  window.setTimeout(() => scrollToId("significado-c"), 80);
                }}
              />
            </div>
          ) : null}
          {showSignificado ? (
            <div className={styles.sheetReveal}>
              <SignificadoCSection
                candidates={resolvedAnchorCandidates}
                key={resolvedAnchorCandidates
                  .map((candidate) => `${candidate.area}::${candidate.activityLiteral}`)
                  .join("|")}
                onComplete={(activities) => {
                  setAnchoredActivities(activities);
                  setIsSignificadoComplete(true);
                  window.setTimeout(() => scrollToId("como-ocurre"), 80);
                }}
              />
            </div>
          ) : null}
          {showProfundizar ? (
            <div className={styles.sheetReveal}>
              <ComoOcurreSection
                activities={resolvedAnchoredActivities}
                key={`como-${resolvedAnchoredActivities
                  .map((activity) => `${activity.area}::${activity.activityLiteral}`)
                  .join("|")}`}
              />
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

function LoginCanvas({ onLogin }: { onLogin: () => void }) {
  return (
    <section className={styles.darkIntro} aria-labelledby="eve-canvas-login-title">
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <EveLogo className={styles.loginLogo} size="md" variant="on-dark" />
        </div>
        <div className={styles.strapline}>
          Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
        </div>
      </div>
      <div className={styles.heroGhost}>EVE PLATFORM</div>
      <h1 className={styles.heroTitle} id="eve-canvas-login-title">
        <span className={styles.heroLine}>START YOUR DIAGNOSTIC</span>
        <span className={styles.heroLine}>WORKSPACE</span>
      </h1>
      <div className={styles.loginLower}>
        <p className={styles.loginCopy}>
          Entra a tu hoja de trabajo.
        </p>
        <div className={styles.loginPanel}>
            <form className={styles.loginForm}>
              <label>
                <span className={styles.fieldLabel}>EMAIL</span>
                <input className={styles.darkInput} defaultValue="usuario@empresa.com" />
              </label>
              <label>
                <span className={styles.fieldLabel}>PASSWORD</span>
                <input className={styles.darkInput} defaultValue="diagnostico" type="password" />
              </label>
              <button className={styles.lightButton} onClick={onLogin} type="button">
                Ingresar →
              </button>
            </form>
            <div className={styles.createAccount}>
              ¿Primera vez? <strong>Crear cuenta</strong>
            </div>
        </div>
        <div className={styles.accessNote}>[ Acceso seguro para participantes y consultores ]</div>
      </div>
    </section>
  );
}

function EstadoASection({ onContinue }: { onContinue: () => void }) {
  const [placeIndex, setPlaceIndex] = useState<number | null>(null);
  const [decisionIndex, setDecisionIndex] = useState<number | null>(null);
  const canContinue = placeIndex !== null && decisionIndex !== null;

  return (
    <section className={styles.estadoAScreen} aria-labelledby="estado-a-title" id="estado-a">
      <header className={styles.estadoATopbar}>
        <EveLogo className={styles.estadoALogo} size="sm" />
        <div className={styles.estadoASlogan}>
          Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine
        </div>
      </header>
      <SheetMotion stagger>
        <div className={styles.estadoAIntro}>
          <h2 className={styles.estadoATitle} id="estado-a-title">
            Comienza tu levantamiento
            <br />
            sin perder el hilo
          </h2>
          <p className={styles.estadoASubtitle}>
            Antes de construir tu mapa de trabajo, ubicamos tu punto de partida dentro de la empresa y
            tu cercanía real con las decisiones.
          </p>
        </div>

        <div className={styles.estadoAQuestions}>
          <EstadoAQuestion
            help="Desde dónde participas normalmente."
            number="01 / LUGAR DE PARTICIPACIÓN"
            title="¿Desde qué lugar participas normalmente en la empresa?"
          >
            <div className={styles.estadoAOptionGrid} role="radiogroup" aria-label="Lugar de participación">
              {estadoAPlaceOptions.map((option, index) => (
                <EstadoAOption
                  key={option}
                  onSelect={() => setPlaceIndex(index)}
                  selected={placeIndex === index}
                >
                  {option}
                </EstadoAOption>
              ))}
            </div>
          </EstadoAQuestion>

          <EstadoAQuestion
            help="Cómo participas en las decisiones."
            number="02 / CERCANÍA A DECISIONES"
            title="¿Qué tan cerca estás de las decisiones?"
          >
            <div
              className={cx(styles.estadoAOptionGrid, styles.estadoAOptionGridFive)}
              role="radiogroup"
              aria-label="Cercanía a decisiones"
            >
              {estadoADecisionOptions.map((option, index) => (
                <EstadoAOption
                  key={option}
                  onSelect={() => setDecisionIndex(index)}
                  selected={decisionIndex === index}
                >
                  {option}
                </EstadoAOption>
              ))}
            </div>
          </EstadoAQuestion>
        </div>

        <footer className={styles.estadoAFooter}>
          <div className={styles.estadoAQuestionMeta}>
            <div className={styles.estadoANumber}>03 / SIGUIENTE FRANJA</div>
            <p>
              {canContinue
                ? "Con ambas respuestas, la hoja puede seguir abajo."
                : "Elige una opción en cada pregunta para continuar."}
            </p>
          </div>
          <p>Estas respuestas no te encasillan. Solo ayudan a entender tu perspectiva antes de construir el mapa.</p>
          <button
            className={styles.sheetAdvance}
            disabled={!canContinue}
            onClick={onContinue}
            type="button"
          >
            {canContinue ? "La hoja sigue ↓" : "Selecciona ambas respuestas"}
          </button>
        </footer>
      </SheetMotion>
    </section>
  );
}

function EstadoAQuestion({
  children,
  help,
  number,
  title,
}: {
  children: React.ReactNode;
  help: string;
  number: string;
  title: string;
}) {
  return (
    <section className={styles.estadoAQuestion}>
      <div className={styles.estadoAQuestionMeta}>
        <div className={styles.estadoANumber}>{number}</div>
        <p>{help}</p>
      </div>
      <div className={styles.estadoAQuestionBody}>
        <h3>{title}</h3>
        {children}
      </div>
    </section>
  );
}

function EstadoAOption({
  children,
  onSelect,
  selected = false,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  selected?: boolean;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cx(styles.estadoAOption, selected && styles.estadoAOptionSelected)}
      onClick={onSelect}
      type="button"
    >
      <span>{children}</span>
    </button>
  );
}

function WorkmapExplainerSection({
  activeStep,
  onStepChange,
  viewedSteps,
}: {
  activeStep: string | null;
  onStepChange: (step: string | null) => void;
  viewedSteps: string[];
}) {
  const viewedStepCount = viewedSteps.length;
  const isComplete = viewedStepCount >= workmapStepCards.length;

  return (
    <section
      className={styles.orientScreen}
      aria-labelledby="workmap-explainer-title"
      id="workmap-explainer"
    >
      <div className={styles.orientInner}>
        <SheetMotion stagger>
          <header className={styles.orientHeader}>
            <div className={styles.orientHeaderCopy}>
              <p className={styles.orientKicker}>Orientación breve</p>
              <h2 className={styles.orientTitle} id="workmap-explainer-title">
                Antes del mapa
              </h2>
              <p className={styles.orientLead}>
                Cuatro pasos cortos para entender cómo se arma tu hoja de trabajo.
                Revísalos para que la hoja pueda seguir.
              </p>
            </div>
            <WorkmapUnlockCounter viewedStepCount={viewedStepCount} />
          </header>

          <div className={styles.orientList}>
            {workmapStepCards.map((step, index) => {
              const isOpen = activeStep === step.number;
              const isViewed = viewedSteps.includes(step.number);

              return (
                <SheetMotion delayMs={index * 50} key={step.number} variant="band">
                  <div
                    className={cx(
                      styles.orientRow,
                      isOpen && styles.orientRowOpen,
                      isViewed && styles.orientRowViewed,
                    )}
                  >
                    <button
                      aria-expanded={isOpen}
                      className={styles.orientRowButton}
                      onClick={() => onStepChange(isOpen ? null : step.number)}
                      type="button"
                    >
                      <span className={styles.orientRowNumber}>{step.number}</span>
                      <span className={styles.orientRowMain}>
                        <span className={styles.orientRowTitle}>{step.title}</span>
                        <span className={styles.orientRowCopy}>{step.copy}</span>
                      </span>
                      <span className={styles.orientRowHint}>{isOpen ? "Cerrar" : "Ver"}</span>
                    </button>
                    {isOpen ? (
                      <div className={styles.orientRowDetail}>
                        <p className={styles.orientRowDetailTitle}>{step.detailTitle}</p>
                        <p>{step.detailCopy}</p>
                      </div>
                    ) : null}
                  </div>
                </SheetMotion>
              );
            })}
          </div>

          <footer className={styles.orientFooter}>
            <p className={styles.orientFooterNote}>
              {isComplete
                ? "Los 4 pasos ya están revisados. El mapa aparece abajo en la hoja."
                : "Abre cada paso una vez. Al completarlos, el mapa se revela debajo."}
            </p>
            {isComplete ? (
              <button
                className={styles.sheetAdvanceQuiet}
                onClick={() => scrollToId("workmap")}
                type="button"
              >
                Ir al mapa ↓
              </button>
            ) : (
              <p className={styles.sheetGateNote}>Faltan {workmapStepCards.length - viewedStepCount}</p>
            )}
          </footer>
        </SheetMotion>
      </div>
    </section>
  );
}

function WorkmapBuilderSection({
  devUnlock = false,
  onPrimaryActivitiesChange,
  onStructureReadyChange,
}: {
  devUnlock?: boolean;
  onPrimaryActivitiesChange: (candidates: CanvasActivityAnchorCandidate[]) => void;
  onStructureReadyChange: (ready: boolean) => void;
}) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Operaciones / Producción"]);
  const [responsibilities, setResponsibilities] = useState<CanvasWorkmapResponsibility[]>([
    createWorkmapResponsibility("Operaciones / Producción", 0),
  ]);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [isCustomAreaOpen, setIsCustomAreaOpen] = useState(false);
  const [fieldValidation, setFieldValidation] = useState<FieldValidationState>({});
  const [advanceAttempted, setAdvanceAttempted] = useState(false);
  const [sheetUnlocked, setSheetUnlocked] = useState(devUnlock);
  const [showCoverageNotes, setShowCoverageNotes] = useState(false);
  const [advanceStatusNote, setAdvanceStatusNote] = useState<string | null>(null);
  const coverageReady = isWorkmapStructureReady(selectedAreas, responsibilities);
  const sheetOpen = devUnlock || (sheetUnlocked && coverageReady);

  useEffect(() => {
    onStructureReadyChange(sheetOpen);
  }, [onStructureReadyChange, sheetOpen]);

  useEffect(() => {
    if (devUnlock) {
      return;
    }

    if (!sheetOpen) {
      onPrimaryActivitiesChange([]);
    }
  }, [devUnlock, onPrimaryActivitiesChange, sheetOpen]);

  function evaluateFieldBlur(
    fieldKey: string,
    text: string,
    kind: "responsibility" | "activity",
  ) {
    const trimmed = text.trim();
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

    setFieldValidation((current) => ({
      ...current,
      [fieldKey]: evaluateInlineFieldValidationEntry(
        trimmed,
        isValid,
        current[fieldKey],
        assistMessage,
      ),
    }));
  }

  function handleAdvanceSheet() {
    setAdvanceAttempted(true);
    setShowCoverageNotes(true);

    if (!coverageReady) {
      setAdvanceStatusNote("Completa el mínimo de contenido antes de seguir en la hoja.");
      setSheetUnlocked(false);
      onPrimaryActivitiesChange([]);
      return;
    }

    const nextValidation: FieldValidationState = { ...fieldValidation };
    let blockedByReview = false;
    let acceptedWithWarning = false;

    for (const responsibility of responsibilities) {
      if (!selectedAreas.includes(responsibility.area)) {
        continue;
      }

      const responsibilityKey = `responsibility:${responsibility.id}`;
      const responsibilityText = responsibility.text.trim();
      const responsibilityStatus = classifyResponsibilitySufficiency(responsibilityText);
      const responsibilityValid =
        responsibilityStatus === "sufficient" || responsibilityStatus === "perfectible";
      const responsibilityMessage = shouldEmitRedactionAssistance(responsibilityStatus)
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

      responsibility.activities.forEach((activity, activityIndex) => {
        const activityText = activity.trim();

        if (!activityText) {
          return;
        }

        const activityKey = `activity:${responsibility.id}:${activityIndex}`;
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
      });
    }

    setFieldValidation(nextValidation);

    if (blockedByReview) {
      setSheetUnlocked(false);
      onPrimaryActivitiesChange([]);
      setAdvanceStatusNote(
        "Revisa las notas bajo los campos antes de seguir. La hoja aún no baja.",
      );
      return;
    }

    const primaryActivities = pickPrimaryActivitiesFromWorkmap(
      selectedAreas,
      responsibilities,
    );
    onPrimaryActivitiesChange(primaryActivities);
    setSheetUnlocked(true);
    setAdvanceStatusNote(
      acceptedWithWarning
        ? "Puedes seguir. Algunas redacciones siguen cortas, pero la hoja continúa con esa advertencia."
        : "El mapa ya puede seguir. La siguiente franja aparece abajo.",
    );
    scrollToId("significado-c");
  }

  function addResponsibilityForArea(area: string) {
    setResponsibilities((current) => [
      ...current,
      createWorkmapResponsibility(
        area,
        current.filter((responsibility) => responsibility.area === area).length,
      ),
    ]);
  }

  function toggleWorkmapArea(area: string) {
    setSelectedAreas((current) => {
      if (current.includes(area)) {
        return current.filter((item) => item !== area);
      }

      return [...current, area];
    });

    setResponsibilities((current) => {
      const hasArea = current.some((responsibility) => responsibility.area === area);

      if (hasArea) {
        return current.filter((responsibility) => responsibility.area !== area);
      }

      return [...current, createWorkmapResponsibility(area, 0)];
    });
  }

  function addCustomArea() {
    const nextArea = customAreaInput.trim();

    if (!nextArea) {
      return;
    }

    setSelectedAreas((current) => (current.includes(nextArea) ? current : [...current, nextArea]));
    setResponsibilities((current) => {
      if (current.some((responsibility) => responsibility.area === nextArea)) {
        return current;
      }

      return [...current, createWorkmapResponsibility(nextArea, 0)];
    });
    setCustomAreaInput("");
    setIsCustomAreaOpen(false);
  }

  function updateResponsibilityText(id: string, text: string) {
    const fieldKey = `responsibility:${id}`;
    setFieldValidation((current) =>
      applyFieldTextChangeToValidationState(current, fieldKey, text),
    );
    setResponsibilities((current) =>
      current.map((responsibility) =>
        responsibility.id === id ? { ...responsibility, text } : responsibility,
      ),
    );
  }

  function removeResponsibility(id: string) {
    setResponsibilities((current) =>
      current.filter((responsibility) => responsibility.id !== id),
    );
    setFieldValidation((current) => {
      const next: FieldValidationState = {};

      for (const [key, value] of Object.entries(current)) {
        if (
          key !== `responsibility:${id}` &&
          !key.startsWith(`activity:${id}:`)
        ) {
          next[key] = value;
        }
      }

      return next;
    });
  }

  function updateActivity(id: string, activityIndex: number, text: string) {
    const fieldKey = `activity:${id}:${activityIndex}`;
    setFieldValidation((current) =>
      applyFieldTextChangeToValidationState(current, fieldKey, text),
    );
    setResponsibilities((current) =>
      current.map((responsibility) =>
        responsibility.id === id
          ? {
              ...responsibility,
              activities: responsibility.activities.map((activity, index) =>
                index === activityIndex ? text : activity,
              ),
            }
          : responsibility,
      ),
    );
  }

  function addActivity(id: string) {
    setResponsibilities((current) =>
      current.map((responsibility) =>
        responsibility.id === id
          ? { ...responsibility, activities: [...responsibility.activities, ""] }
          : responsibility,
      ),
    );
  }

  function removeActivity(id: string, activityIndex: number) {
    setResponsibilities((current) =>
      current.map((responsibility) => {
        if (responsibility.id !== id || responsibility.activities.length <= 2) {
          return responsibility;
        }

        return {
          ...responsibility,
          activities: responsibility.activities.filter((_, index) => index !== activityIndex),
        };
      }),
    );

    setFieldValidation((current) => {
      const next: FieldValidationState = {};

      for (const [key, value] of Object.entries(current)) {
        if (!key.startsWith(`activity:${id}:`)) {
          next[key] = value;
        }
      }

      return next;
    });
  }

  return (
    <section className={styles.workmapScreen} aria-labelledby="workmap-title" id="workmap">
      <header className={styles.workmapTopbar}>
        <EveLogo className={styles.estadoALogo} size="sm" />
        <div>Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine</div>
      </header>

      <SheetMotion variant="title">
        <div className={styles.workmapIntro}>
          <h2 id="workmap-title">
            Construye el mapa de tu
            <br />
            trabajo real
          </h2>
          <p>Cada rol se abre en la hoja: dónde participas, de qué respondes y qué haces.</p>
        </div>
      </SheetMotion>

      <SheetMotion delayMs={80} variant="band">
      <div className={styles.workmapLocationRow}>
        <aside className={styles.workmapSideMeta}>
          <div className={styles.workmapKicker}>01 / UBICACIÓN</div>
          <p>Cada área proclamada abre una responsabilidad mínima y dos actividades.</p>
        </aside>
        <div className={styles.workmapLocationBody}>
          <h3>Dónde participa tu trabajo</h3>
          <div className={styles.workmapAreaTabs}>
            {workmapAreas.map((area) => {
              const selected = selectedAreas.includes(area);

              return (
                <button
                  aria-pressed={selected}
                  className={selected ? styles.workmapAreaTabActive : undefined}
                  key={area}
                  onClick={() => toggleWorkmapArea(area)}
                  type="button"
                >
                  {area}
                </button>
              );
            })}
            <button
              aria-expanded={isCustomAreaOpen}
              onClick={() => setIsCustomAreaOpen((open) => !open)}
              type="button"
            >
              Otra área
            </button>
          </div>
          {isCustomAreaOpen ? (
            <div className={styles.workmapCustomAreaRow}>
              <input
                onChange={(event) => setCustomAreaInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomArea();
                  }
                }}
                placeholder="Escribe el nombre del área"
                value={customAreaInput}
              />
              <button onClick={addCustomArea} type="button">
                Agregar
              </button>
            </div>
          ) : null}
        </div>
      </div>
      </SheetMotion>

      {selectedAreas.map((area) => {
        const areaResponsibilities = responsibilities.filter(
          (responsibility) => responsibility.area === area,
        );

        return (
          <div key={`area-block-${area}`}>
            {areaResponsibilities.map((responsibility, areaResponsibilityIndex) => (
              <WorkmapRoleRow
                activityCoverageHint={
                  showCoverageNotes
                    ? getCanvasActivityCoverageMessage(responsibility) ?? null
                    : null
                }
                activityHints={responsibility.activities.map((_, activityIndex) =>
                  resolveCanvasFieldHint(
                    fieldValidation[`activity:${responsibility.id}:${activityIndex}`],
                    advanceAttempted,
                  ),
                )}
                activityValues={responsibility.activities}
                area={responsibility.area}
                areaResponsibilityIndex={areaResponsibilityIndex}
                isLastAreaResponsibility={areaResponsibilityIndex === areaResponsibilities.length - 1}
                key={responsibility.id}
                onActivityAdd={() => addActivity(responsibility.id)}
                onActivityBlur={(activityIndex, text) =>
                  evaluateFieldBlur(
                    `activity:${responsibility.id}:${activityIndex}`,
                    text,
                    "activity",
                  )
                }
                onActivityChange={(activityIndex, text) =>
                  updateActivity(responsibility.id, activityIndex, text)
                }
                onActivityRemove={(activityIndex) =>
                  removeActivity(responsibility.id, activityIndex)
                }
                onResponsibilityAdd={() => addResponsibilityForArea(area)}
                onResponsibilityBlur={(text) =>
                  evaluateFieldBlur(
                    `responsibility:${responsibility.id}`,
                    text,
                    "responsibility",
                  )
                }
                onResponsibilityChange={(text) =>
                  updateResponsibilityText(responsibility.id, text)
                }
                onResponsibilityRemove={() => removeResponsibility(responsibility.id)}
                responsibilityHint={resolveCanvasFieldHint(
                  fieldValidation[`responsibility:${responsibility.id}`],
                  advanceAttempted,
                )}
                responsibilityValue={responsibility.text}
              />
            ))}
          </div>
        );
      })}

      <footer className={styles.workmapFooter}>
        <aside className={styles.workmapSideMeta}>
          <div className={styles.workmapKicker}>04 / CIERRE DEL MAPA</div>
          <p>
            {sheetOpen
              ? "La siguiente franja ya está abierta abajo."
              : coverageReady
                ? "Cuando quieras seguir, la hoja revisa cobertura y redacción."
                : "Escribe al menos una responsabilidad y dos actividades por cada área elegida."}
          </p>
        </aside>
        <p>
          {advanceStatusNote ??
            "Cada área queda como una franja propia del lienzo. Si aparecen más roles o más actividades, la hoja crece hacia abajo sin cambiar de superficie."}
        </p>
        {sheetOpen ? (
          <button
            className={styles.sheetAdvanceQuiet}
            onClick={() => scrollToId("significado-c")}
            type="button"
          >
            Ir a la siguiente franja ↓
          </button>
        ) : (
          <button
            className={styles.sheetAdvanceQuiet}
            onClick={handleAdvanceSheet}
            type="button"
          >
            Seguir en la hoja ↓
          </button>
        )}
      </footer>
    </section>
  );
}

/*
function LegacyWorkmapBuilderSection() {
  return (
    <section className={styles.whiteSection} aria-labelledby="legacy-workmap-title">
      <div className={styles.sheet}>
        <div className={styles.ghostLetter}>B</div>
        <header className={cx(styles.sectionHeader, styles.workmapHeader)}>
          <div>
            <div className={styles.kicker}>MAPA DE TRABAJO</div>
            <p className={styles.sideCopy}>
              Mapea al menos dos actividades reales por cada responsabilidad operativa.
            </p>
          </div>
          <h2 className={styles.headline} id="legacy-workmap-title">
            Construye el mapa de tu trabajo real
          </h2>
          <p className={styles.headerNote}>
            Cada rol se despliega como una franja de responsabilidad, actividad y asistencia.
          </p>
        </header>

        <RoleBlock
          activities={[
            "Reviso contratos, identifico variaciones y preparo alertas para decisiones de precio.",
            "Analizo pedidos y ventas semanales, reviso volumen, margen y necesidad de ajuste.",
            "Levanto la necesidad del cliente interno y documento puntos que afectan la operación.",
          ]}
          assistance="Actividad 1 todavía está corta: falta decir qué revisas exactamente y qué decisión tomas después."
          index="01"
          role="Ventas"
          responsibility="Preparar oportunidades comerciales bajo un criterio que conecta negociación con costo visible."
        />

        <RoleBlock
          activities={[
            "Reviso pedidos pendientes.",
            "",
          ]}
          assistance="Este rol necesita una segunda actividad clara antes de poder guardar el mapa."
          index="02"
          role="Logistica"
          responsibility="Coordino entregas para que lleguen a tiempo."
        />

        <div className={styles.continueRow}>
          <div>
            <div className={styles.rowNumber}>03 / GUARDAR MAPA</div>
            <p className={styles.rowHelp}>Cuando cada parte del mapa queda clara, se guarda para continuar.</p>
          </div>
          <p className={styles.continuityCopy}>
            Cada texto escrito crea una ficha simple del trabajo. Si aparece una alerta, la hoja crece
            hacia abajo con la actividad adicional que haga falta.
          </p>
          <button className={styles.darkButton} type="button">
            CONTINUAR →
          </button>
        </div>
      </div>
    </section>
  );
}

*/

function SignificadoOrientSection({ onContinue }: { onContinue: () => void }) {
  return (
    <section
      className={styles.orientScreen}
      aria-labelledby="activity-study-orient-title"
      id="significado-orient"
    >
      <div className={styles.orientInner}>
        <SheetMotion stagger>
          <header className={cx(styles.orientHeader, styles.orientHeaderSolo)}>
            <div className={styles.orientHeaderCopy}>
              <p className={styles.orientKicker}>Orientación breve</p>
              <h2 className={styles.orientTitle} id="activity-study-orient-title">
                Antes de estudiar tus actividades
              </h2>
              <p className={styles.orientLead}>
                En el mapa ya quedó lo que haces. Ahora el foco pasa a actividades concretas:
                cada una seleccionada será el objeto que vamos a entender en la práctica.
              </p>
            </div>
          </header>

          <div className={styles.orientStaticList}>
            {ACTIVITY_STUDY_ORIENT_POINTS.map((point, index) => (
              <SheetMotion delayMs={60 + index * 70} key={point.number} variant="band">
                <div className={styles.orientStaticRow}>
                  <span className={styles.orientRowNumber}>{point.number}</span>
                  <div className={styles.orientRowMain}>
                    <span className={styles.orientRowTitle}>{point.title}</span>
                    <span className={styles.orientRowCopy}>{point.copy}</span>
                  </div>
                </div>
              </SheetMotion>
            ))}
          </div>

          <footer className={styles.orientFooter}>
            <p className={styles.orientFooterNote}>
              Todo tu mapa sigue ahí. Solo algunas actividades entran al estudio cercano; el resto
              sostiene el panorama sin pedir el mismo detalle.
            </p>
            <button
              className={styles.sheetAdvanceQuiet}
              onClick={onContinue}
              type="button"
            >
              Seguir en la hoja ↓
            </button>
          </footer>
        </SheetMotion>
      </div>
    </section>
  );
}

function SignificadoCSection({
  candidates,
  onComplete,
}: {
  candidates: CanvasActivityAnchorCandidate[];
  onComplete?: (activities: CanvasAnchoredActivity[]) => void;
}) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [stance, setStance] = useState<AnchorStance>("pending");
  const [actionVerb, setActionVerb] = useState("");
  const [objectText, setObjectText] = useState("");
  const [criterion, setCriterion] = useState("");
  const [outputText, setOutputText] = useState("");
  const [summary, setSummary] = useState("");
  const [frequency, setFrequency] = useState("");
  const [typicalContext, setTypicalContext] = useState("");
  const [primaryActor, setPrimaryActor] = useState("");
  const [startHint, setStartHint] = useState("");
  const [endHint, setEndHint] = useState("");
  const [variationChoice, setVariationChoice] = useState<"yes" | "no" | null>(null);
  const [variationNote, setVariationNote] = useState("");
  const [clarificationResponse, setClarificationResponse] = useState("");
  const [clarificationResolved, setClarificationResolved] = useState(false);
  const [advanceNote, setAdvanceNote] = useState<string | null>(null);
  const [advanceAttempted, setAdvanceAttempted] = useState(false);
  const [allActivitiesComplete, setAllActivitiesComplete] = useState(false);
  const [capturedActivities, setCapturedActivities] = useState<CanvasAnchoredActivity[]>([]);

  const safeIndex = Math.min(activityIndex, Math.max(candidates.length - 1, 0));
  const candidate = candidates[safeIndex] ?? FALLBACK_ANCHOR_CANDIDATES[0];
  const hasNextActivity = safeIndex < candidates.length - 1;
  const activityHeading = getSelectedActivityHeading(safeIndex);

  function snapshotCurrentActivity(): CanvasAnchoredActivity {
    return {
      area: candidate.area,
      activityLiteral: candidate.activityLiteral,
      actionVerb,
      objectText,
      criterion,
      outputText,
      summary,
      frequency,
      typicalContext,
      primaryActor,
      startHint,
      endHint,
    };
  }

  const structureStarted = stance !== "pending";
  const structureFilled =
    actionVerb.trim().length > 0 &&
    objectText.trim().length > 0 &&
    criterion.trim().length > 0 &&
    outputText.trim().length > 0;
  const variationAnswered =
    variationChoice === "no" ||
    (variationChoice === "yes" && variationNote.trim().length > 0);
  const borderFilled =
    summary.trim().length > 0 &&
    frequency.trim().length > 0 &&
    typicalContext.trim().length > 0 &&
    primaryActor.trim().length > 0 &&
    startHint.trim().length > 0 &&
    endHint.trim().length > 0 &&
    variationAnswered;
  // Punto 04: solo después de 02+03 (detalle y día a día), no durante la redacción.
  const activeClarification =
    structureFilled && borderFilled
      ? detectAnchorClarification({
          actionVerb,
          objectText,
          criterion,
          outputText,
          summary,
          startHint,
          endHint,
        })
      : null;
  const clarificationBlocking =
    Boolean(activeClarification) && !clarificationResolved;
  const canMarkReady =
    structureStarted && structureFilled && borderFilled && !clarificationBlocking;

  const operationalIntroGuide = buildOperationalDescriptionIntroGuide({
    activityTitle: candidate.activityLiteral,
    actionVerb,
    inputOrObject: objectText,
    procedureOrStandard: criterion,
    outputOrResult: outputText,
  });

  const operationalDraftHints = [
    "Cuándo arranca y en qué condiciones está la información u objeto",
    "Qué haces con la información o el insumo",
    "Qué queda listo al terminar",
  ];

  function resetFieldsForActivity(next: CanvasActivityAnchorCandidate) {
    setStance("pending");
    setActionVerb("");
    setObjectText("");
    setCriterion("");
    setOutputText("");
    setSummary("");
    setFrequency("");
    setTypicalContext("");
    setPrimaryActor("");
    setStartHint("");
    setEndHint("");
    setVariationChoice(null);
    setVariationNote("");
    setClarificationResponse("");
    setClarificationResolved(false);
    setAdvanceNote(null);
    setAdvanceAttempted(false);
  }

  function handleStance(next: Exclude<AnchorStance, "pending">) {
    setStance(next);
    setClarificationResolved(false);
    setAdvanceNote(null);
    setAdvanceAttempted(false);

    if (next === "reconstructing") {
      setActionVerb("");
      setObjectText("");
      setCriterion("");
      setOutputText("");
      setSummary("");
      scrollToId("significado-structure");
      return;
    }

    const prefill = prefillDetailFieldsFromActivityLiteral(candidate.activityLiteral);
    setActionVerb(prefill.actionVerb);
    setObjectText(prefill.objectText);
    setCriterion(prefill.criterion);
    setOutputText(prefill.outputText);

    scrollToId("significado-structure");
  }

  function handleTryAdvance() {
    setAdvanceAttempted(true);

    if (!structureStarted) {
      setAdvanceNote("Primero confirma si así ocurre la actividad, o corrígela.");
      scrollToId("significado-anchor");
      return;
    }

    if (!actionVerb.trim() || !objectText.trim() || !criterion.trim() || !outputText.trim()) {
      if (!criterion.trim()) {
        setAdvanceNote(
          "Falta el criterio: el sistema no pudo tomarlo del mapa. Escríbelo tú para poder seguir.",
        );
      } else {
        setAdvanceNote("Completa qué haces, sobre qué, el criterio y qué queda listo.");
      }
      scrollToId("significado-structure");
      return;
    }

    if (!summary.trim()) {
      setAdvanceNote("Redacta cómo ocurre esta actividad normalmente, de inicio a fin.");
      scrollToId("significado-border");
      return;
    }

    if (
      !frequency.trim() ||
      !typicalContext.trim() ||
      !primaryActor.trim() ||
      !startHint.trim() ||
      !endHint.trim()
    ) {
      setAdvanceNote(
        "Completa la zona de tiempo y contexto: frecuencia, situación, quién la hace, cuándo empieza y cuándo termina.",
      );
      scrollToId("significado-border");
      return;
    }

    if (variationChoice === null) {
      setAdvanceNote("Indica si esta actividad a veces cambia o si casi siempre es igual.");
      scrollToId("significado-border");
      return;
    }

    if (variationChoice === "yes" && !variationNote.trim()) {
      setAdvanceNote("Cuéntanos qué suele cambiar cuando no es el caso normal.");
      scrollToId("significado-border");
      return;
    }

    if (clarificationBlocking) {
      setAdvanceNote("Responde la precisión corta antes de seguir.");
      scrollToId("significado-clarify");
      return;
    }

    setAdvanceAttempted(false);

    // Cerrar ancla de esta actividad y conservar la escena formada.
    if (hasNextActivity) {
      const nextIndex = safeIndex + 1;
      const nextCandidate = candidates[nextIndex];
      setCapturedActivities((current) => [...current, snapshotCurrentActivity()]);
      setActivityIndex(nextIndex);
      resetFieldsForActivity(nextCandidate);
      setAdvanceNote(
        `Seguimos con la ${getSelectedActivityHeading(nextIndex).toLowerCase()}.`,
      );
      scrollToId("significado-anchor");
      return;
    }

    const activities = [...capturedActivities, snapshotCurrentActivity()];
    setCapturedActivities(activities);
    setAllActivitiesComplete(true);
    setAdvanceNote(
      "Listo el ancla. Abajo seguimos con esta actividad en la hoja.",
    );
    onComplete?.(activities);
  }

  return (
    <div id="significado-c">
      <section
        className={styles.significadoScreen}
        aria-labelledby="significado-c-title"
        id="significado-anchor"
      >
        <header className={styles.workmapTopbar}>
          <EveLogo className={styles.estadoALogo} size="sm" />
          <div>Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability Engine</div>
        </header>
        <SheetMotion variant="title">
          <div className={styles.significadoIntro}>
            <h2 id="significado-c-title">{activityHeading}</h2>
            <p>
              Confirma si así ocurre. Si no cuadra, corrígela o vuelve a escribirla. Después
              profundizamos con más preguntas sobre ella
              {candidates.length > 1
                ? ` (${safeIndex + 1} de ${candidates.length}).`
                : "."}
            </p>
          </div>
        </SheetMotion>

        <SheetMotion delayMs={60} variant="band">
        <div className={styles.significadoBand}>
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>01 / ACTIVIDAD</div>
            <p>Di si así es, si hay que corregirla o si prefieres volver a escribirla.</p>
          </aside>
          <div className={styles.significadoBandBody}>
            <h3>¿Confirma si así ocurre esta actividad?</h3>
            {candidate.area ? (
              <div className={styles.significadoContextLine}>
                <span>{candidate.area}</span>
              </div>
            ) : null}
            <p className={styles.significadoLiteral}>{candidate.activityLiteral}</p>
            <div className={styles.significadoStanceRow} role="group" aria-label="Revisión de la actividad">
              <button
                aria-pressed={stance === "confirmed"}
                className={cx(
                  styles.significadoStanceButton,
                  stance === "confirmed" && styles.significadoStanceButtonActive,
                )}
                onClick={() => handleStance("confirmed")}
                type="button"
              >
                Así es
              </button>
              <button
                aria-pressed={stance === "correcting"}
                className={cx(
                  styles.significadoStanceButton,
                  stance === "correcting" && styles.significadoStanceButtonActive,
                )}
                onClick={() => handleStance("correcting")}
                type="button"
              >
                Corregir
              </button>
              <button
                aria-pressed={stance === "reconstructing"}
                className={cx(
                  styles.significadoStanceButton,
                  stance === "reconstructing" && styles.significadoStanceButtonActive,
                )}
                onClick={() => handleStance("reconstructing")}
                type="button"
              >
                Volver a escribirla
              </button>
            </div>
          </div>
        </div>
        </SheetMotion>

        <SheetMotion delayMs={90} variant="band">
        <div className={styles.significadoBand} id="significado-structure">
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>02 / DETALLE</div>
            <p>
              Se rellena solo desde lo que escribiste en el mapa. Revísalo y corrige lo que no
              cuadre.
            </p>
          </aside>
          <div className={styles.significadoBandBody}>
            <h3>
              {!structureStarted
                ? "Qué hace esta actividad, pieza por pieza"
                : stance === "confirmed"
                  ? "¿Queda así de clara?"
                  : stance === "correcting"
                    ? "Ajusta lo que no cuadra"
                    : "Escríbela otra vez, pieza por pieza"}
            </h3>
            {(actionVerb || objectText || criterion || outputText) &&
            stance !== "reconstructing" ? (
              <p className={styles.significadoPrefillNote}>
                Tomado de tu actividad del mapa. Puedes editar cada parte.
              </p>
            ) : null}
              <div className={styles.significadoFieldGrid}>
                <SignificadoField
                  incomplete={advanceAttempted && !actionVerb.trim()}
                  label="Qué haces"
                  onChange={(value) => {
                    setActionVerb(value);
                    setClarificationResolved(false);
                  }}
                  placeholder="Por ejemplo: reviso, preparo, cruzo…"
                  value={actionVerb}
                />
                <SignificadoField
                  incomplete={advanceAttempted && !objectText.trim()}
                  label="Sobre qué trabajas"
                  onChange={setObjectText}
                  placeholder="Sobre qué o con qué trabajas"
                  value={objectText}
                />
                <SignificadoField
                  incomplete={advanceAttempted && !criterion.trim()}
                  label="Con qué criterio lo haces"
                  onChange={setCriterion}
                  placeholder="Regla, checklist o forma habitual"
                  value={criterion}
                />
                <SignificadoField
                  incomplete={advanceAttempted && !outputText.trim()}
                  label="Qué queda listo"
                  onChange={setOutputText}
                  placeholder="Qué queda listo al terminar"
                  value={outputText}
                />
              </div>
          </div>
        </div>
        </SheetMotion>

        <SheetMotion delayMs={120} variant="band">
        <div className={styles.significadoBand} id="significado-border">
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>03 / DÍA A DÍA</div>
            <p>Cuéntanos cómo suele ocurrir, de punta a punta.</p>
          </aside>
          <div className={styles.significadoBandBody}>
            <h3>Cómo ocurre normalmente</h3>
            <p className={styles.significadoOpContrast}>
              {operationalIntroGuide.contrastLead}
            </p>
              <div className={styles.significadoOpGuide}>
                <p className={styles.significadoOpGuideLabel}>Ejemplo con tu actividad</p>
                <p className={styles.significadoOpGuideExample}>
                  {operationalIntroGuide.exampleNarrative}
                </p>
                <p className={styles.significadoOpStructureLabel}>
                  Estructura que buscamos en tu redacción
                </p>
                <ul className={styles.significadoOpHints} aria-label="Estructura semántica">
                  {operationalDraftHints.map((hint) => (
                    <li key={hint}>
                      <span aria-hidden="true" className={styles.significadoOpCheck}>
                        ✓
                      </span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.significadoFieldStack}>
                <SignificadoField
                  incomplete={advanceAttempted && !summary.trim()}
                  label="Redacta como ocurre esta actividad normalmente"
                  labelTone="strong"
                  onChange={setSummary}
                  placeholder="Cómo pasa normalmente en tu trabajo, de inicio a fin"
                  rows={4}
                  value={summary}
                />
                <div className={styles.significadoFieldGrid}>
                  <SignificadoField
                    incomplete={advanceAttempted && !frequency.trim()}
                    label="Con qué frecuencia"
                    onChange={setFrequency}
                    placeholder="Ej. Todos los días, cada semana, en cada cierre de mes…"
                    value={frequency}
                  />
                  <SignificadoField
                    incomplete={advanceAttempted && !typicalContext.trim()}
                    label="En qué situación suele pasar"
                    onChange={setTypicalContext}
                    placeholder="Ej. Cuando cierra el reporte, al recibir una solicitud, en la reunión del área…"
                    value={typicalContext}
                  />
                  <SignificadoField
                    incomplete={advanceAttempted && !primaryActor.trim()}
                    label="Quién hace esta actividad"
                    onChange={setPrimaryActor}
                    placeholder="Ej. Yo, yo con mi equipo, otra área me lo pide y yo lo hago…"
                    value={primaryActor}
                  />
                </div>
                <div className={styles.significadoFieldGrid}>
                  <SignificadoField
                    incomplete={advanceAttempted && !startHint.trim()}
                    label="Empieza cuando…"
                    onChange={(value) => {
                      setStartHint(value);
                      setClarificationResolved(false);
                    }}
                    placeholder="Ej. Cuando ya tengo la información lista, cuando me llega la solicitud…"
                    value={startHint}
                  />
                  <SignificadoField
                    incomplete={advanceAttempted && !endHint.trim()}
                    label="Termina cuando…"
                    onChange={(value) => {
                      setEndHint(value);
                      setClarificationResolved(false);
                    }}
                    placeholder="Ej. Cuando el resultado queda listo, cuando ya lo envié o lo registré…"
                    value={endHint}
                  />
                </div>
              <div className={styles.significadoVariationBlock}>
                <p className={styles.significadoVariationQuestion}>
                  ¿A veces cambia según el caso o la urgencia?
                </p>
                <div
                  className={styles.significadoStanceRow}
                  role="group"
                  aria-label="Si la actividad a veces cambia"
                >
                  <button
                    aria-pressed={variationChoice === "yes"}
                    className={cx(
                      styles.significadoStanceButton,
                      variationChoice === "yes" && styles.significadoStanceButtonActive,
                    )}
                    onClick={() => setVariationChoice("yes")}
                    type="button"
                  >
                    Sí, a veces cambia
                  </button>
                  <button
                    aria-pressed={variationChoice === "no"}
                    className={cx(
                      styles.significadoStanceButton,
                      variationChoice === "no" && styles.significadoStanceButtonActive,
                    )}
                    onClick={() => {
                      setVariationChoice("no");
                      setVariationNote("");
                    }}
                    type="button"
                  >
                    No, casi siempre es igual
                  </button>
                </div>
                {variationChoice === "yes" ? (
                  <SignificadoField
                    label="Qué suele cambiar"
                    onChange={setVariationNote}
                    placeholder="Ej. Si hay urgencia, salto pasos o lo hago con menos revisión"
                    rows={2}
                    value={variationNote}
                  />
                ) : null}
                {variationChoice === null ? (
                  <p className={styles.significadoPrefillNote}>Elige una opción para continuar.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        </SheetMotion>

        {activeClarification ? (
          <SheetMotion>
          <div className={styles.significadoBand} id="significado-clarify">
            <aside className={styles.workmapSideMeta}>
              <div className={styles.workmapKicker}>04 / UNA PRECISIÓN</div>
              <p>
                Solo aparece cuando, al cerrar detalle y día a día, algo no nos termina de
                cuadrar.
              </p>
            </aside>
            <div className={styles.significadoBandBody}>
              <h3>Nos falta una precisión</h3>
              <div className={styles.significadoClarifyBox}>
                <p>{getClarificationCopy(activeClarification, actionVerb, objectText).trench}</p>
                <p>
                  <strong>A lo que me refiero es…</strong>{" "}
                  {getClarificationCopy(activeClarification, actionVerb, objectText).landing}
                </p>
                <p>
                  <strong>Por ejemplo…</strong>{" "}
                  {getClarificationCopy(activeClarification, actionVerb, objectText).example}
                </p>
                <p className={styles.significadoClarifyQuestion}>
                  {getClarificationCopy(activeClarification, actionVerb, objectText).question}
                </p>
              </div>
              <SignificadoField
                label="Tu precisión"
                onChange={(value) => {
                  setClarificationResponse(value);
                  setClarificationResolved(value.trim().length > 0);
                }}
                placeholder="Respuesta corta"
                rows={2}
                value={clarificationResponse}
              />
            </div>
          </div>
          </SheetMotion>
        ) : null}

        <footer className={styles.significadoFooter}>
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>
              {activeClarification ? "05 / SIGUIENTE" : "04 / SIGUIENTE"}
            </div>
            <p>
              {allActivitiesComplete
                ? "Ancla lista. Abajo seguimos con esta actividad."
                : canMarkReady
                  ? hasNextActivity
                    ? "Al terminar esta, seguimos con la siguiente actividad."
                    : "Con esto el ancla queda lista y seguimos."
                  : "Revisa la actividad y completa lo pedido antes de bajar."}
            </p>
          </aside>
          <p>
            {advanceNote ??
              (hasNextActivity
                ? "Cuando esta actividad quede clara, pasamos a la siguiente seleccionada."
                : "Cuando esto quede claro, seguimos en la hoja.")}
          </p>
          <button
            className={styles.sheetAdvanceQuiet}
            onClick={() => {
              if (allActivitiesComplete) {
                onComplete?.(
                  capturedActivities.length > 0
                    ? capturedActivities
                    : [snapshotCurrentActivity()],
                );
                scrollToId("como-ocurre");
                return;
              }
              handleTryAdvance();
            }}
            type="button"
          >
            {allActivitiesComplete
              ? "Seguir en la hoja ↓"
              : hasNextActivity && canMarkReady
                ? "Seguir a la siguiente actividad ↓"
                : "Seguir en la hoja ↓"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function getClarificationCopy(
  kind: Exclude<AnchorClarificationKind, null>,
  actionVerb: string,
  objectText: string,
) {
  const action = actionVerb.trim() || "gestionar";
  const object = objectText.trim() || "eso que trabajas";

  if (kind === "genericidad") {
    return {
      trench: "Nos está saliendo amplia esta actividad.",
      landing:
        "el verbo suena general y todavía no se entiende qué la distingue de otras parecidas.",
      example: `si dices “${action}” sobre “${object}” sin un borde concreto, podría confundirse con varias tareas del área.`,
      question: "¿Qué la hace distinta en la práctica?",
    };
  }

  if (kind === "frontera") {
    return {
      trench: "Aquí el inicio y el cierre no terminan de cerrar.",
      landing: "hace falta saber cuándo arranca y cuándo ya quedó lista.",
      example:
        "si empieza y termina con la misma frase, o si ambos suenan iguales, todavía no queda claro el tramo real.",
      question: "¿Cómo marcarías el arranque y el cierre en el trabajo real?",
    };
  }

  if (kind === "escala") {
    return {
      trench: "Aquí se mezclan demasiadas cosas a la vez.",
      landing: "parece demasiado grande o demasiado chica para contarla de punta a punta.",
      example: `si “${object}” cubre muchas cosas a la vez —o se queda en un clic—, conviene tomar la parte concreta que sí cierras tú.`,
      question: "¿Qué parte concreta revisarías de inicio a fin?",
    };
  }

  return {
    trench: "Nos falta una pieza para entender bien esta actividad.",
    landing: "aún no quedan claros el objeto, el criterio o lo que queda listo.",
    example: `con “${action}” y “${object}”, si el criterio o el resultado salen vagos, todavía no alcanza para seguir con claridad.`,
    question: "¿Qué pieza falta para que quede entendible?",
  };
}

function SignificadoField({
  incomplete = false,
  label,
  labelTone = "quiet",
  onChange,
  placeholder,
  rows = 2,
  value,
}: {
  incomplete?: boolean;
  label: string;
  labelTone?: "quiet" | "strong";
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  value: string;
}) {
  return (
    <label
      className={cx(
        styles.significadoField,
        labelTone === "strong" && styles.significadoFieldStrong,
        incomplete && styles.significadoFieldIncomplete,
      )}
    >
      <span>{label}</span>
      <textarea
        aria-invalid={incomplete || undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function WorkmapFieldHint({ hint }: { hint: CanvasFieldHint | null }) {
  if (!hint) {
    return null;
  }

  return (
    <p
      className={cx(
        styles.workmapFieldHint,
        hint.tone === "review" && styles.workmapFieldHintReview,
        hint.tone === "warning" && styles.workmapFieldHintWarning,
        hint.tone === "coverage" && styles.workmapFieldHintCoverage,
      )}
      role="status"
    >
      {hint.message}
    </p>
  );
}

function WorkmapRoleRow({
  activityCoverageHint,
  activityHints,
  activityValues,
  area,
  areaResponsibilityIndex,
  isLastAreaResponsibility,
  onActivityAdd,
  onActivityBlur,
  onActivityChange,
  onActivityRemove,
  onResponsibilityAdd,
  onResponsibilityBlur,
  onResponsibilityChange,
  onResponsibilityRemove,
  responsibilityHint,
  responsibilityValue,
}: {
  activityCoverageHint: string | null;
  activityHints: Array<CanvasFieldHint | null>;
  activityValues: string[];
  area: string;
  areaResponsibilityIndex: number;
  isLastAreaResponsibility: boolean;
  onActivityAdd: () => void;
  onActivityBlur: (activityIndex: number, text: string) => void;
  onActivityChange: (activityIndex: number, text: string) => void;
  onActivityRemove: (activityIndex: number) => void;
  onResponsibilityAdd: () => void;
  onResponsibilityBlur: (text: string) => void;
  onResponsibilityChange: (text: string) => void;
  onResponsibilityRemove: () => void;
  responsibilityHint: CanvasFieldHint | null;
  responsibilityValue: string;
}) {
  return (
    <>
      <section className={styles.workmapRoleRow}>
        {areaResponsibilityIndex === 0 ? (
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>02 / RESPONSABILIDAD</div>
            <p>Escribe de qué respondes en esta área, en lenguaje de trabajo real.</p>
          </aside>
        ) : (
          <aside aria-hidden="true" className={styles.workmapSideMeta} />
        )}
        <div className={styles.workmapRoleBody}>
          <h3>{`Escribe tu ${getResponsibilityOrdinalWord(areaResponsibilityIndex)} responsabilidad para el área de ${area}`}</h3>
          <textarea
            aria-label={`Responsabilidad ${areaResponsibilityIndex + 1} para ${area}`}
            className={cx(
              styles.workmapTextField,
              responsibilityHint?.tone === "review" && styles.workmapFieldNeedsReview,
            )}
            onBlur={(event) => onResponsibilityBlur(event.target.value)}
            onChange={(event) => onResponsibilityChange(event.target.value)}
            placeholder="Describe la responsabilidad principal"
            rows={2}
            value={responsibilityValue}
          />
          <WorkmapFieldHint hint={responsibilityHint} />
          {areaResponsibilityIndex > 0 ? (
            <button
              className={styles.workmapRemoveButton}
              onClick={onResponsibilityRemove}
              type="button"
            >
              Eliminar responsabilidad
            </button>
          ) : null}
        </div>
      </section>

      <section className={styles.workmapRoleRow}>
        {areaResponsibilityIndex === 0 ? (
          <aside className={styles.workmapSideMeta}>
            <div className={styles.workmapKicker}>03 / ACTIVIDADES</div>
            <p>Agrega al menos dos actividades concretas que sostengan esa responsabilidad.</p>
          </aside>
        ) : (
          <aside aria-hidden="true" className={styles.workmapSideMeta} />
        )}
        <div className={styles.workmapRoleBody}>
          <h3>Qué haces para cumplirla</h3>
          <div className={styles.workmapActivities}>
            {activityValues.map((activity, activityIndex) => (
              <div className={styles.workmapActivityLine} key={`${area}-${activityIndex}`}>
                <textarea
                  aria-label={`Actividad ${activityIndex + 1} de responsabilidad ${areaResponsibilityIndex + 1} para ${area}`}
                  className={cx(
                    styles.workmapActivityField,
                    activityHints[activityIndex]?.tone === "review" &&
                      styles.workmapFieldNeedsReview,
                  )}
                  onBlur={(event) => onActivityBlur(activityIndex, event.target.value)}
                  onChange={(event) => onActivityChange(activityIndex, event.target.value)}
                  placeholder={`${activityIndex + 1}. Redacta una actividad concreta de tu trabajo`}
                  rows={2}
                  value={activity}
                />
                <WorkmapFieldHint hint={activityHints[activityIndex] ?? null} />
                {activityIndex >= 2 && activityValues.length > 2 ? (
                  <button
                    className={styles.workmapRemoveButton}
                    onClick={() => onActivityRemove(activityIndex)}
                    type="button"
                  >
                    Eliminar actividad
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <WorkmapFieldHint
            hint={
              activityCoverageHint
                ? { message: activityCoverageHint, tone: "coverage" }
                : null
            }
          />
          <div className={styles.workmapInlineActionRow}>
            <button className={styles.workmapInlineButton} onClick={onActivityAdd} type="button">
              + Agregar otra actividad
            </button>
            {isLastAreaResponsibility ? (
              <button
                className={styles.workmapInlineButton}
                onClick={onResponsibilityAdd}
                type="button"
              >
                + Agregar responsabilidad para {area}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
