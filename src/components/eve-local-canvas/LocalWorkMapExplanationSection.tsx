"use client";

import { useMemo, useState } from "react";
import { SheetMotion } from "@/components/eve-worksheet/SheetMotion";
import styles from "./local-canvas.module.css";

export const WORKMAP_EXPLANATION_STEPS = [
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
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  /** When true (reentry with existing WorkMap), explanation starts completed. */
  initiallyComplete?: boolean;
  onComplete: () => void;
};

/**
 * WORKMAP_EXPLANATION — orientative only.
 * Does not persist WorkMap, select primary, or touch Runtime.
 */
export function LocalWorkMapExplanationSection({
  initiallyComplete = false,
  onComplete,
}: Props) {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [viewedSteps, setViewedSteps] = useState<string[]>(() =>
    initiallyComplete ? WORKMAP_EXPLANATION_STEPS.map((s) => s.number) : [],
  );

  const viewedStepCount = viewedSteps.length;
  const isComplete = viewedStepCount >= WORKMAP_EXPLANATION_STEPS.length;

  const handleStepChange = (step: string | null) => {
    setActiveStep(step);
    if (step) {
      setViewedSteps((current) =>
        current.includes(step) ? current : [...current, step],
      );
    }
  };

  const progressTicks = useMemo(
    () => Array.from({ length: WORKMAP_EXPLANATION_STEPS.length }, (_, i) => i),
    [],
  );

  return (
    <section
      aria-labelledby="workmap-explainer-title"
      className={styles.orientScreen}
      id="workmap-explainer"
    >
      <div className={styles.orientInner}>
        <SheetMotion stagger>
          <header className={styles.orientHeader}>
            <div>
              <p className={styles.orientKicker}>Orientación breve</p>
              <h2 className={styles.orientTitle} id="workmap-explainer-title">
                Antes del mapa
              </h2>
              <p className={styles.orientLead}>
                Cuatro pasos cortos para entender cómo se arma tu hoja de trabajo.
                Revísalos para que la hoja pueda seguir.
              </p>
            </div>
            <div aria-live="polite" className={styles.orientProgress}>
              <p className={styles.orientProgressLabel}>
                {isComplete ? "Listo para el mapa" : "Revisa los 4 pasos"}
              </p>
              <div aria-hidden="true" className={styles.orientProgressTrack}>
                {progressTicks.map((index) => (
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
                <span>/ {WORKMAP_EXPLANATION_STEPS.length}</span>
              </span>
            </div>
          </header>

          <div className={styles.orientList}>
            {WORKMAP_EXPLANATION_STEPS.map((step, index) => {
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
                      onClick={() => handleStepChange(isOpen ? null : step.number)}
                      type="button"
                    >
                      <span className={styles.orientRowNumber}>{step.number}</span>
                      <span className={styles.orientRowMain}>
                        <span className={styles.orientRowTitle}>{step.title}</span>
                        <span className={styles.orientRowCopy}>{step.copy}</span>
                      </span>
                      <span className={styles.orientRowHint}>
                        {isOpen ? "Cerrar" : "Ver"}
                      </span>
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
                onClick={onComplete}
                type="button"
              >
                Ir al mapa ↓
              </button>
            ) : (
              <p className={styles.sheetGateNote}>
                Faltan {WORKMAP_EXPLANATION_STEPS.length - viewedStepCount}
              </p>
            )}
          </footer>
        </SheetMotion>
      </div>
    </section>
  );
}
