"use client";

import { useEffect, useState } from "react";
import styles from "./canvas-b0-frecuencia.module.css";

const BUILD = "1.3";
const STORAGE_KEY = "eve-b0-frecuencia-continuation-v1";

export const FREQUENCY_OPTIONS = [
  "Varias veces al día",
  "Diaria",
  "Varias veces por semana",
  "Semanal",
  "Varias veces al mes",
  "Mensual",
  "Solo en cierre",
  "Solo ante contingencias",
  "Irregular",
  "Estacional",
] as const;

export const CONTEXT_OPTIONS = [
  "Al iniciar el turno",
  "Cuando entra una solicitud",
  "Al cierre de mes",
  "Después de una aprobación",
  "Cuando falta información",
  "Cuando alguien pide corrección",
  "Otro",
] as const;

export const ACTOR_OPTIONS = [
  "Yo mismo",
  "Mi equipo",
  "Otra persona del equipo",
  "Otro equipo",
  "Un sistema con intervención humana",
  "Es compartida",
  "Otro",
] as const;

export type B0FrequencyOption = (typeof FREQUENCY_OPTIONS)[number];
export type B0ContextOption = (typeof CONTEXT_OPTIONS)[number];
export type B0ActorOption = (typeof ACTOR_OPTIONS)[number];

export type B0FrecuenciaConfirmPayload = {
  frequency_base: B0FrequencyOption;
  typical_context: string;
  typical_context_option: B0ContextOption;
  primary_actor_scope: string;
  primary_actor_option: B0ActorOption;
  narrative_anchor: string;
};

export type LocalB0FrecuenciaSectionProps = {
  /** Redacción suficiente from Cómo ocurre (center anchor). */
  narrative: string;
  sessionId?: string;
  onConfirm?: (payload: B0FrecuenciaConfirmPayload) => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function cleanText(value: string) {
  return value.replace(/\u200b/g, "").trim();
}

/**
 * B0 Frecuencia — opciones / tipos del freeze aprobado (BUILD 1.3).
 * Freeze: deliverables/design/eve-b0-frecuencia-continuation-v1.html
 * UI in-place: montada dentro de `LocalB0ComoOcurreSection` (no banda separada).
 */
export function LocalB0FrecuenciaSection({
  narrative,
  sessionId = "local",
  onConfirm,
}: LocalB0FrecuenciaSectionProps) {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [frequencyChoice, setFrequencyChoice] =
    useState<B0FrequencyOption | null>(null);
  const [contextChoice, setContextChoice] = useState<B0ContextOption | null>(
    null,
  );
  const [actorChoice, setActorChoice] = useState<B0ActorOption | null>(null);
  const [contextOther, setContextOther] = useState("");
  const [actorOther, setActorOther] = useState("");

  useEffect(() => {
    setReady(false);
    setSaved(false);
    setFrequencyChoice(null);
    setContextChoice(null);
    setActorChoice(null);
    setContextOther("");
    setActorOther("");
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setReady(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [narrative, sessionId]);

  const resolvedContext =
    contextChoice === "Otro"
      ? cleanText(contextOther)
      : contextChoice ?? "";
  const resolvedActor =
    actorChoice === "Otro" ? cleanText(actorOther) : actorChoice ?? "";

  const canSave =
    Boolean(frequencyChoice) &&
    Boolean(contextChoice) &&
    (contextChoice !== "Otro" || Boolean(resolvedContext)) &&
    Boolean(actorChoice) &&
    (actorChoice !== "Otro" || Boolean(resolvedActor));

  const closureHint = !frequencyChoice
    ? "Elige con qué frecuencia ocurre"
    : !contextChoice
      ? "Elige en qué situación suele pasar"
      : contextChoice === "Otro" && !resolvedContext
        ? "Describe la situación (otro)"
        : !actorChoice
          ? "Elige sobre quién recae"
          : actorChoice === "Otro" && !resolvedActor
            ? "Describe sobre quién recae (otro)"
            : "Completa las tres piezas";

  function handleSave() {
    if (!canSave || saved || !frequencyChoice || !contextChoice || !actorChoice) {
      return;
    }
    const payload: B0FrecuenciaConfirmPayload = {
      frequency_base: frequencyChoice,
      typical_context: resolvedContext,
      typical_context_option: contextChoice,
      primary_actor_scope: resolvedActor,
      primary_actor_option: actorChoice,
      narrative_anchor: cleanText(narrative),
    };
    try {
      localStorage.setItem(
        `${STORAGE_KEY}:${sessionId}`,
        JSON.stringify({
          ...payload,
          build: BUILD,
          confirmedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Local persistence is best-effort.
    }
    setSaved(true);
    onConfirm?.(payload);
  }

  return (
    <>
      <section
        aria-label="B0 sección 3 · frecuencia"
        className={styles.screen}
        data-section="b0-frecuencia"
        id="b0-frecuencia"
      >
        <p className={styles.build}>BUILD {BUILD} · CONTINUACIÓN · FRECUENCIA</p>

        <div aria-live="polite" className={styles.signal}>
          <p className={styles.narrative}>{cleanText(narrative)}</p>
        </div>

        <div
          className={cx(
            styles.field,
            styles.fieldFrequency,
            ready && styles.fieldFrequencyReady,
          )}
        >
          <div
            aria-label="Frecuencia y situación"
            className={cx(styles.column, styles.columnLeft)}
          >
            <article className={styles.qBlock}>
              <p className={styles.qLabel}>
                Con qué frecuencia ocurre normalmente esta memoria operativa?
              </p>
              <div
                aria-label="Con qué frecuencia ocurre normalmente esta memoria operativa"
                className={styles.optList}
                role="radiogroup"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    aria-checked={frequencyChoice === option}
                    className={cx(
                      styles.opt,
                      frequencyChoice === option && styles.optActive,
                    )}
                    disabled={saved}
                    key={option}
                    onClick={() => setFrequencyChoice(option)}
                    role="radio"
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>

            <article className={styles.qBlock}>
              <p className={styles.qLabel}>En qué situación suele pasar</p>
              <div
                aria-label="En qué situación suele pasar"
                className={styles.optList}
                role="radiogroup"
              >
                {CONTEXT_OPTIONS.map((option) => (
                  <button
                    aria-checked={contextChoice === option}
                    className={cx(
                      styles.opt,
                      contextChoice === option && styles.optActive,
                    )}
                    disabled={saved}
                    key={option}
                    onClick={() => {
                      setContextChoice(option);
                      if (option !== "Otro") setContextOther("");
                    }}
                    role="radio"
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div
                className={cx(
                  styles.freeSlot,
                  contextChoice === "Otro" && styles.freeSlotOpen,
                )}
              >
                <div
                  aria-label="Situación — otro"
                  className={cx(
                    styles.qValue,
                    !cleanText(contextOther) && styles.qValueEmpty,
                  )}
                  contentEditable={!saved && contextChoice === "Otro"}
                  data-placeholder="Describe la situación…"
                  key={`context-other-${contextChoice === "Otro"}`}
                  onInput={(event) =>
                    setContextOther(event.currentTarget.textContent ?? "")
                  }
                  role="textbox"
                  suppressContentEditableWarning
                />
              </div>
            </article>
          </div>

          <div
            aria-label="Actor y cierre"
            className={cx(styles.column, styles.columnRight)}
          >
            <article className={styles.qBlock}>
              <p className={styles.qLabel}>
                ¿Quién la hace normalmente o sobre quién recae directamente?
              </p>
              <div
                aria-label="Quién la hace normalmente o sobre quién recae directamente"
                className={styles.optList}
                role="radiogroup"
              >
                {ACTOR_OPTIONS.map((option) => (
                  <button
                    aria-checked={actorChoice === option}
                    className={cx(
                      styles.opt,
                      actorChoice === option && styles.optActive,
                    )}
                    disabled={saved}
                    key={option}
                    onClick={() => {
                      setActorChoice(option);
                      if (option !== "Otro") setActorOther("");
                    }}
                    role="radio"
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div
                className={cx(
                  styles.freeSlot,
                  actorChoice === "Otro" && styles.freeSlotOpen,
                )}
              >
                <div
                  aria-label="Actor — otro"
                  className={cx(
                    styles.qValue,
                    !cleanText(actorOther) && styles.qValueEmpty,
                  )}
                  contentEditable={!saved && actorChoice === "Otro"}
                  data-placeholder="Describe sobre quién recae…"
                  key={`actor-other-${actorChoice === "Otro"}`}
                  onInput={(event) =>
                    setActorOther(event.currentTarget.textContent ?? "")
                  }
                  role="textbox"
                  suppressContentEditableWarning
                />
              </div>
            </article>

            <button
              aria-label="Confirmar anclaje de frecuencia"
              className={cx(
                styles.sceneToggle,
                canSave && styles.sceneToggleReady,
              )}
              disabled={!canSave || saved}
              onClick={handleSave}
              type="button"
            >
              Así es · Guardar
            </button>
            {!saved && !canSave ? (
              <p
                className={cx(
                  styles.closureHint,
                  styles.closureHintVisible,
                )}
              >
                {closureHint}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
