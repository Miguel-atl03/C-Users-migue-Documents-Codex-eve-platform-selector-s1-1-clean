"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { detectActivityParts } from "@/services/local-work-map-activity-validation";
import { normalizeWorkMapOutputPresentation } from "@/services/workmap-to-block0-prefill";
import styles from "./canvas-b0-memoria-operativa.module.css";

const BUILD = "4.3";
const STORAGE_KEY = "eve-b0-memoria-operativa-v4";

const STEP_LABELS = [
  "I · Qué haces",
  "II · Sobre qué trabajas",
  "III · Pasos del recorrido",
  "IV · Qué queda listo",
] as const;

export type B0MemoriaPart = {
  id: 1 | 2 | 3 | 4;
  label: string;
  value: string;
};

export type LocalB0MemoriaOperativaSectionProps = {
  /** Activity literal from WorkMap / primary selection (Umbral memory). */
  activityLiteral: string;
  /** Optional session key for local persistence. */
  sessionId?: string;
  onConfirm?: (parts: B0MemoriaPart[]) => void;
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sleep(ms: number, isAlive: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(isAlive()), ms);
  });
}

function buildStepValues(activityLiteral: string): [string, string, string, string] {
  const literal = activityLiteral.trim();
  const parts = detectActivityParts(literal);
  const objectText = parts.object?.trim() || literal;
  const stepsText = parts.how?.trim() || "";
  const resultRaw = parts.result?.trim() || "";
  const resultText = resultRaw
    ? normalizeWorkMapOutputPresentation(resultRaw)
    : "";

  return [
    literal,
    objectText,
    stepsText || "—",
    resultText || "—",
  ];
}

/**
 * B0 Memoria operativa — secuencia void monumental.
 * Freeze: deliverables/design/eve-b0-secuencia-void-v4.html (BUILD 4.3).
 * Inserted after Umbral on the local continuous sheet. Replaces old Significado builder there.
 */
export function LocalB0MemoriaOperativaSection({
  activityLiteral,
  sessionId = "local",
  onConfirm,
}: LocalB0MemoriaOperativaSectionProps) {
  const runIdRef = useRef(0);
  const valueRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);

  const stepValueTexts = useMemo(
    () => buildStepValues(activityLiteral),
    [activityLiteral],
  );

  const [introVisible, setIntroVisible] = useState(false);
  const [introMist, setIntroMist] = useState(false);
  const [activeSteps, setActiveSteps] = useState([false, false, false, false]);
  const [labels, setLabels] = useState(["", "", "", ""]);
  const [values, setValues] = useState(["", "", "", ""]);
  const [labelTyping, setLabelTyping] = useState([false, false, false, false]);
  const [valueTyping, setValueTyping] = useState([false, false, false, false]);
  const [memoryMist, setMemoryMist] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [choiceAsiText, setChoiceAsiText] = useState("");
  const [choiceEditarText, setChoiceEditarText] = useState("");
  const [choiceAsiReady, setChoiceAsiReady] = useState(false);
  const [choiceEditarReady, setChoiceEditarReady] = useState(false);
  const [choiceAsiSelected, setChoiceAsiSelected] = useState(false);
  const [choiceAsiMist, setChoiceAsiMist] = useState(false);
  const [choiceEditarMist, setChoiceEditarMist] = useState(false);
  const [sepVisible, setSepVisible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [opsNotify, setOpsNotify] = useState("");
  const [asiTyping, setAsiTyping] = useState(false);
  const [editarTyping, setEditarTyping] = useState(false);

  async function typeInto(
    text: string,
    speed: number,
    isAlive: () => boolean,
    onChar: (partial: string) => void,
    setTyping: (v: boolean) => void,
  ): Promise<boolean> {
    if (prefersReducedMotion()) {
      onChar(text);
      return isAlive();
    }
    setTyping(true);
    let acc = "";
    for (let i = 0; i < text.length; i += 1) {
      if (!isAlive()) {
        setTyping(false);
        return false;
      }
      acc += text.charAt(i);
      onChar(acc);
      const alive = await sleep(speed, isAlive);
      if (!alive) {
        setTyping(false);
        return false;
      }
    }
    setTyping(false);
    return isAlive();
  }

  useEffect(() => {
    runIdRef.current += 1;
    const token = runIdRef.current;
    const isAlive = () => token === runIdRef.current;

    // reset
    setIntroVisible(false);
    setIntroMist(false);
    setActiveSteps([false, false, false, false]);
    setLabels(["", "", "", ""]);
    setValues(["", "", "", ""]);
    setLabelTyping([false, false, false, false]);
    setValueTyping([false, false, false, false]);
    setMemoryMist(false);
    setQuestionVisible(false);
    setChoiceAsiText("");
    setChoiceEditarText("");
    setChoiceAsiReady(false);
    setChoiceEditarReady(false);
    setChoiceAsiSelected(false);
    setChoiceAsiMist(false);
    setChoiceEditarMist(false);
    setSepVisible(false);
    setHintVisible(false);
    setEditing(false);
    setConfirmed(false);
    setOpsNotify("");
    setAsiTyping(false);
    setEditarTyping(false);

    void (async () => {
      let alive = await sleep(120, isAlive);
      if (!alive) return;
      setIntroVisible(true);

      alive = await sleep(3000, isAlive);
      if (!alive) return;
      setIntroMist(true);

      alive = await sleep(400, isAlive);
      if (!alive) return;

      for (let i = 0; i < 4; i += 1) {
        if (i > 0) {
          alive = await sleep(2000, isAlive);
          if (!alive) return;
        }

        setActiveSteps((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });

        alive = await typeInto(
          STEP_LABELS[i],
          48,
          isAlive,
          (partial) => {
            setLabels((prev) => {
              const next = [...prev];
              next[i] = partial;
              return next;
            });
          },
          (typing) => {
            setLabelTyping((prev) => {
              const next = [...prev];
              next[i] = typing;
              return next;
            });
          },
        );
        if (!alive) return;

        alive = await sleep(2000, isAlive);
        if (!alive) return;

        alive = await typeInto(
          stepValueTexts[i],
          36,
          isAlive,
          (partial) => {
            setValues((prev) => {
              const next = [...prev];
              next[i] = partial;
              return next;
            });
          },
          (typing) => {
            setValueTyping((prev) => {
              const next = [...prev];
              next[i] = typing;
              return next;
            });
          },
        );
        if (!alive) return;
      }

      // Void 2s after IV before question
      alive = await sleep(2000, isAlive);
      if (!alive) return;

      setQuestionVisible(true);
      alive = await sleep(3000, isAlive);
      if (!alive) return;
      setQuestionVisible(false);

      alive = await sleep(300, isAlive);
      if (!alive) return;

      setChoiceAsiReady(true);
      alive = await typeInto(
        "Así es",
        48,
        isAlive,
        setChoiceAsiText,
        setAsiTyping,
      );
      if (!alive) return;

      alive = await sleep(280, isAlive);
      if (!alive) return;
      setSepVisible(true);

      alive = await sleep(280, isAlive);
      if (!alive) return;

      setChoiceEditarReady(true);
      alive = await typeInto(
        "Editar",
        48,
        isAlive,
        setChoiceEditarText,
        setEditarTyping,
      );
    })();

    return () => {
      runIdRef.current += 1;
    };
  }, [stepValueTexts]);

  function readParts(): B0MemoriaPart[] {
    return [0, 1, 2, 3].map((i) => ({
      id: (i + 1) as 1 | 2 | 3 | 4,
      label: STEP_LABELS[i],
      value: (
        valueRefs.current[i]?.textContent ??
        values[i] ??
        ""
      ).trim(),
    }));
  }

  function persist(parts: B0MemoriaPart[]) {
    const payload = {
      confirmedAt: new Date().toISOString(),
      build: BUILD,
      sessionId,
      parts,
    };
    try {
      localStorage.setItem(`${STORAGE_KEY}:${sessionId}`, JSON.stringify(payload));
    } catch {
      // best-effort
    }
    return payload;
  }

  function handleConfirm() {
    if (!choiceAsiReady) return;
    if (confirmed && !editing) return;

    const parts = readParts();
    setEditing(false);
    setConfirmed(true);
    setHintVisible(false);
    setMemoryMist(true);
    setIntroMist(true);
    setChoiceAsiSelected(true);
    setChoiceAsiMist(false);
    setChoiceEditarReady(true);
    setChoiceEditarMist(true);
    persist(parts);
    setOpsNotify(
      "Ops · confirmado · persistido · mist activo · siguiente sección lista (interna)",
    );
    onConfirm?.(parts);
  }

  function handleEdit() {
    if (!choiceEditarReady) return;
    setEditing(true);
    setHintVisible(true);
    setMemoryMist(false);
    setIntroMist(false);
    setChoiceEditarMist(false);
    setChoiceAsiMist(false);
    setChoiceAsiSelected(false);
    setChoiceAsiReady(true);
    setOpsNotify("Ops · reeditando · mist → ink · pendiente Así es");
    window.requestAnimationFrame(() => {
      for (let i = 0; i < 4; i += 1) {
        const el = valueRefs.current[i];
        if (el) el.textContent = values[i] ?? "";
      }
      valueRefs.current[0]?.focus();
    });
  }

  return (
    <>
      <section
        aria-label="B0 memoria operativa"
        className={styles.screen}
        data-section="b0-memoria-operativa"
        id="b0-memoria-operativa"
      >
        <p
          className={cx(
            styles.intro,
            introVisible && styles.introVisible,
            introMist && styles.introMist,
          )}
        >
          Miremos de cerca…
        </p>

        <div
          className={cx(styles.memoryBand, memoryMist && styles.memoryBandMist)}
        >
          <div aria-label="Flujo horizontal" className={styles.flow}>
            {[0, 1, 2, 3].map((i) => (
              <div
                className={cx(
                  styles.flowStep,
                  activeSteps[i] && styles.flowStepActive,
                )}
                key={STEP_LABELS[i]}
              >
                <p className={styles.stepLabel}>
                  {labels[i]}
                  {labelTyping[i] ? (
                    <span aria-hidden className={styles.cursor} />
                  ) : null}
                </p>
                <div
                  className={cx(
                    styles.stepValue,
                    editing && styles.stepValueEditing,
                  )}
                  contentEditable={editing}
                  onBlur={(event) => {
                    if (!editing) return;
                    const text = event.currentTarget.textContent ?? "";
                    setValues((prev) => {
                      const next = [...prev];
                      next[i] = text;
                      return next;
                    });
                  }}
                  ref={(el) => {
                    valueRefs.current[i] = el;
                  }}
                  suppressContentEditableWarning
                >
                  {editing ? null : (
                    <>
                      {values[i]}
                      {valueTyping[i] ? (
                        <span aria-hidden className={styles.cursor} />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-label="Confirmación memoria operativa"
          className={styles.confirmIsland}
        >
          <p
            className={cx(
              styles.confirmQuestion,
              questionVisible && styles.confirmQuestionVisible,
            )}
          >
            ¿Así es como se desarrolla tu memoria operativa?
          </p>
          <div className={styles.confirmActions}>
            <button
              className={cx(
                styles.confirmChoice,
                choiceAsiReady && styles.confirmChoiceReady,
                choiceAsiSelected && styles.confirmChoiceSelected,
                choiceAsiMist && styles.confirmChoiceMist,
              )}
              onClick={handleConfirm}
              type="button"
            >
              {choiceAsiText}
              {asiTyping ? (
                <span aria-hidden className={styles.cursor} />
              ) : null}
            </button>
            <span
              aria-hidden
              className={cx(
                styles.confirmSep,
                sepVisible && styles.confirmSepVisible,
              )}
            />
            <button
              className={cx(
                styles.confirmChoice,
                choiceEditarReady && styles.confirmChoiceReady,
                choiceEditarMist && styles.confirmChoiceMist,
              )}
              onClick={handleEdit}
              type="button"
            >
              {choiceEditarText}
              {editarTyping ? (
                <span aria-hidden className={styles.cursor} />
              ) : null}
            </button>
          </div>
          <p
            className={cx(
              styles.confirmHint,
              hintVisible && styles.confirmHintVisible,
            )}
          >
            Edita las piezas y confirma con Así es para continuar.
          </p>
        </div>
      </section>

      <p
        aria-live="polite"
        className={cx(styles.opsNotify, opsNotify && styles.opsNotifyVisible)}
        role="status"
      >
        {opsNotify}
      </p>
    </>
  );
}
