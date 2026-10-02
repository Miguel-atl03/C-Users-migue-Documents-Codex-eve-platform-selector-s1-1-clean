"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./canvas-b0-como-ocurre.module.css";
import {
  B0_Q06,
  B0_Q07,
  B0_QB,
  type B0BoundariesConfirmPayload,
} from "./b0-madre-copy";
import {
  ACTOR_OPTIONS,
  CONTEXT_OPTIONS,
  FREQUENCY_OPTIONS,
  type B0ActorOption,
  type B0ContextOption,
  type B0FrequencyOption,
  type B0FrecuenciaConfirmPayload,
} from "./LocalB0FrecuenciaSection";

const BUILD = "3.15";
const STORAGE_KEY = "eve-b0-como-ocurre-void-v3";
const FREQ_STORAGE_KEY = "eve-b0-frecuencia-continuation-v1";
const BOUNDARIES_STORAGE_KEY = "eve-b0-boundaries-q04-v1";
const INTRO_ASK = "Observa la memoria operativa, dinos como se desarrolla…";
const NARRATIVE_TYPE_MS = 64;
const SCENE_FADE_MS = 820;

const QUESTION_DEFS = [
  {
    label:
      "¿Qué evento, condición, solicitud, información o estado dispara esta actividad?",
    fieldExample:
      "Ej. Pedido disponible, pago final confirmado y opciones reales de cuadrilla y fecha.",
    voidExamples: [
      "Cuando se recibe una solicitud del cliente.",
      "El pedido cuenta con la condición de toda la información requerida.",
      "Un usuario solicita la actualización de sus datos.",
      "Se recibe información de la orden de compra aprobada.",
    ],
  },
  {
    label: "¿Qué criterio utilizas y qué información dejas fuera?",
    fieldExample:
      "Ej. No se confirma fecha tentativa; fecha y condiciones deben estar confirmadas por las partes.",
    voidExamples: [
      "Prioridad de atención: Considero el impacto en la continuidad, los compromisos vigentes y la capacidad disponible; excluyo solicitudes sin efecto operativo inmediato o que requieren otra autoridad.",
      "Validación de propuestas: Considero los requerimientos confirmados, las restricciones técnicas y los recursos disponibles; excluyo supuestos, preferencias no acordadas y alternativas inviables.",
      "Autorización de compras: Considero la necesidad operativa, el presupuesto y las condiciones de suministro; excluyo opciones que incumplen especificaciones, carecen de justificación o implican riesgos no aceptados.",
    ],
  },
  {
    label: "¿A quién, a qué área o a qué sistema pasa el resultado?",
    fieldExample:
      "Ej. Compras o ruta de entrega, según anticipo o finiquito.",
    voidExamples: [
      "El resultado pasa al rol que valida la propuesta y decide si puede avanzar a la siguiente etapa.",
      "El resultado pasa al área que lo utiliza para programar sus recursos y coordinar la ejecución.",
      "El resultado pasa al sistema de información donde se registra, actualiza el estado y habilita las actividades posteriores.",
      "El resultado pasa al rol que integra la información de distintas fuentes para tomar una decisión de coordinación.",
    ],
  },
] as const;

const LABEL_SEEDS = [0xa11ce, 0xb0c01, 0xc0ffe] as const;
const EXAMPLE_SEEDS = [0xe101, 0xe202, 0xe303] as const;

export type B0ComoOcurreDimensionValues = {
  trigger: string;
  criterion: string;
  handoff: string;
};

export type B0ComoOcurreConfirmPayload = {
  narrative: string;
  dimensions: {
    D1_trigger: string;
    D2_how: string;
    D3_criterion: string;
    D4_output: string;
    D5_handoff: string;
  };
  confirmationStep: "go_to_scene_1" | "confirm_scene" | "save_edit";
};

export type LocalB0ComoOcurreSectionProps = {
  /** Inherited from Memoria / B0-Q01 */
  how?: string;
  output?: string;
  action?: string;
  object?: string;
  sessionId?: string;
  onConfirm?: (payload: B0ComoOcurreConfirmPayload) => void;
  /** Fired when frecuencia closes on the same triangular structure. */
  onFrecuenciaConfirm?: (payload: B0FrecuenciaConfirmPayload) => void;
  /** Fired when B0-Q04 (0.6 / 0.7 / 0.B) closes. */
  onBoundariesConfirm?: (payload: B0BoundariesConfirmPayload) => void;
  /** Shell activates after Guardar on the auto-drafted memoria operativa. */
  onShellActivate?: () => void;
  /** Madre help_text for the shell void — never replaces the memoria void. */
  onShellHelpChange?: (helpText: string | null) => void;
};

export type { B0BoundariesConfirmPayload };

type SceneMode = "idle" | "confirm" | "edit" | "saved";
type SignalMode = "void" | "examples" | "narrative";
/** Same room: scene → frecuencia (B0-Q03) → inicio/cierre (B0-Q04). */
type SheetPhase = "scene" | "frequency" | "boundaries";

const SCENE_CONFIRM_PROMPT =
  "¿Esta es tu memoria operativa 1, es así como la observas normalmente?";

type MemoryPlan = {
  startDelay: number;
  phases: Array<{
    parts: string[];
    holdMin: number;
    holdMax: number;
    pauseAfter: number;
  }>;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function sleep(ms: number, isAlive: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(isAlive()), ms);
  });
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rng: () => number, min: number, max: number) {
  return Math.round(min + (max - min) * rng());
}

function planMemoryPhases(text: string, seed: number): MemoryPlan {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  const rng = mulberry32(seed);
  const soloWordCount = Math.min(tokens.length, 2 + Math.floor(rng() * 4));
  const bursts: string[] = [];
  let index = soloWordCount;

  while (index < tokens.length) {
    const remaining = tokens.length - index;
    const take =
      remaining === 1 ? 1 : Math.min(remaining, 2 + Math.floor(rng() * 2));
    bursts.push(tokens.slice(index, index + take).join(""));
    index += take;
  }

  return {
    startDelay: randBetween(rng, 0, 520),
    phases: [
      {
        parts: tokens.slice(0, soloWordCount),
        holdMin: 380,
        holdMax: 620,
        pauseAfter: randBetween(rng, 640, 1100),
      },
      {
        parts: bursts,
        holdMin: 480,
        holdMax: 780,
        pauseAfter: 0,
      },
    ],
  };
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripBoundaryPunctuation(value: string) {
  return cleanText(value).replace(/[.,;:\s]+$/g, "");
}

function isNotApplicable(value: string) {
  return /^(?:no aplica|n\/a|na|no pasa|no se entrega|no lo entrego|no pasa a otro actor|no pasa a otra persona|no pasa a otro sistema)$/i.test(
    cleanText(value),
  );
}

function firstToken(value: string) {
  return cleanText(value).match(/^[\p{L}\p{N}.&_-]+/u)?.[0] ?? "";
}

function uppercaseInitial(value: string) {
  const text = stripBoundaryPunctuation(value);
  const token = firstToken(text);
  if (!token) return text;
  return (
    token.charAt(0).toLocaleUpperCase("es-MX") +
    token.slice(1) +
    text.slice(token.length)
  );
}

function lowercaseInitial(value: string) {
  const text = stripBoundaryPunctuation(value);
  const token = firstToken(text);
  if (!token) return text;
  return token.toLocaleLowerCase("es-MX") + text.slice(token.length);
}

function composeHandoffConnector(rawHandoff: string) {
  const handoff = stripBoundaryPunctuation(rawHandoff)
    .replace(/^Al\b/u, "al")
    .replace(/^A\b/u, "a");
  if (!handoff || isNotApplicable(handoff)) return "";
  if (/^al\s+área\b/i.test(handoff) || /^a\s+/i.test(handoff)) {
    return `El resultado pasa ${handoff}`;
  }
  return `El resultado pasa a ${lowercaseInitial(handoff)}`;
}

function normalizeBoundary(value: string) {
  return cleanText(value)
    .toLocaleLowerCase("es-MX")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Madre 0.B: start/end mezclados o indistinguibles. */
function boundariesNeedClarification(start: string, end: string) {
  const a = normalizeBoundary(start);
  const b = normalizeBoundary(end);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const tokensA = new Set(a.split(" ").filter((token) => token.length > 2));
  const tokensB = b.split(" ").filter((token) => token.length > 2);
  if (tokensA.size === 0 || tokensB.length === 0) return false;
  const overlap = tokensB.filter((token) => tokensA.has(token)).length;
  return overlap / Math.max(tokensA.size, tokensB.length) >= 0.7;
}

function composeNarrative(
  values: B0ComoOcurreDimensionValues,
  inherited: { how: string; output: string; action: string; object: string },
) {
  const trigger = stripBoundaryPunctuation(values.trigger);
  const criterion = stripBoundaryPunctuation(values.criterion);
  const handoff = stripBoundaryPunctuation(values.handoff);
  const how = stripBoundaryPunctuation(inherited.how);
  const output = stripBoundaryPunctuation(inherited.output);
  const action = stripBoundaryPunctuation(inherited.action);
  const object = stripBoundaryPunctuation(inherited.object);
  const sentences: string[] = [];

  const triggerClause = trigger
    ? /^(?:cuando|al recibir|al tener|al contar con|una vez que|después de que|despues de que|cada vez que)\b/i.test(
        trigger,
      )
      ? trigger
      : `Cuando ${trigger}`
    : "";
  const actionClause = how || [action, object].filter(Boolean).join(" ");

  if (actionClause) {
    const normalizedAction = triggerClause
      ? lowercaseInitial(actionClause)
      : uppercaseInitial(actionClause);
    sentences.push(
      triggerClause
        ? `${triggerClause}, ${normalizedAction}.`
        : `${normalizedAction}.`,
    );
  }
  if (criterion && !isNotApplicable(criterion)) {
    sentences.push(`${uppercaseInitial(criterion)}.`);
  }
  if (output) {
    sentences.push(`Al terminar, queda ${lowercaseInitial(output)}.`);
  }
  if (handoff && !isNotApplicable(handoff)) {
    const sentence = composeHandoffConnector(handoff);
    if (sentence) sentences.push(/[.!?]$/.test(sentence) ? sentence : `${sentence}.`);
  }

  const narrative = sentences
    .join(" ")
    .replace(/,\s*;/g, ";")
    .replace(/\s+([,;.])/g, "$1")
    .replace(/([,;])\s*([,;.])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
  return narrative && !/[.!?]$/.test(narrative)
    ? `${stripBoundaryPunctuation(narrative)}.`
    : narrative;
}

/**
 * B0 · Sección 2 · Cómo ocurre (+ frecuencia + inicio/cierre in-place).
 * React port of the approved void freeze (BUILD 3.13 → 3.15).
 * Tras guardar redacción: B0-Q03 frecuencia; tras Guardar frecuencia: B0-Q04 (0.6/0.7/0.B).
 */
export function LocalB0ComoOcurreSection({
  how,
  output,
  action,
  object,
  sessionId = "local",
  onConfirm,
  onFrecuenciaConfirm,
  onBoundariesConfirm,
  onShellActivate,
  onShellHelpChange,
}: LocalB0ComoOcurreSectionProps) {
  const inherited = useMemo(
    () => ({
      how: how?.trim() || "comparando el gasto real contra Oracle",
      output:
        output?.trim() ||
        "reportes de desviaciones con análisis de causa raíz",
      action: action?.trim() || "comparo",
      object: object?.trim() || "el gasto",
    }),
    [action, how, object, output],
  );
  const runIdRef = useRef(0);
  const narrativeRunIdRef = useRef(0);
  const valueRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);
  const narrativeRef = useRef<HTMLParagraphElement | null>(null);
  const startRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const clarifyRef = useRef<HTMLDivElement | null>(null);

  const [sequenceNonce, setSequenceNonce] = useState(0);
  const [introVisible, setIntroVisible] = useState(false);
  const [introAsk, setIntroAsk] = useState("");
  const [introTyping, setIntroTyping] = useState(false);
  const [fieldVisible, setFieldVisible] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [labelUnits, setLabelUnits] = useState<string[][]>([[], [], []]);
  const [exampleUnits, setExampleUnits] = useState<string[][]>([[], [], []]);
  const [values, setValues] = useState<string[]>(["", "", ""]);
  const [captureReady, setCaptureReady] = useState(false);
  const [openExamplesFor, setOpenExamplesFor] = useState<number | null>(null);
  const [signalMode, setSignalMode] = useState<SignalMode>("void");
  const [sceneMode, setSceneMode] = useState<SceneMode>("idle");
  const [sheetPhase, setSheetPhase] = useState<SheetPhase>("scene");
  const [frequencyReady, setFrequencyReady] = useState(false);
  const [frequencySaved, setFrequencySaved] = useState(false);
  const [frequencyChoice, setFrequencyChoice] =
    useState<B0FrequencyOption | null>(null);
  const [contextChoice, setContextChoice] = useState<B0ContextOption | null>(
    null,
  );
  const [actorChoice, setActorChoice] = useState<B0ActorOption | null>(null);
  const [contextOther, setContextOther] = useState("");
  const [actorOther, setActorOther] = useState("");
  const [boundariesReady, setBoundariesReady] = useState(false);
  const [boundariesSaved, setBoundariesSaved] = useState(false);
  const [startCondition, setStartCondition] = useState("");
  const [endResult, setEndResult] = useState("");
  const [showBoundaryClarify, setShowBoundaryClarify] = useState(false);
  const [boundaryClarifyText, setBoundaryClarifyText] = useState("");
  const [openBoundaryHelp, setOpenBoundaryHelp] = useState<
    "start" | "end" | null
  >(null);
  const [narrative, setNarrative] = useState("");
  const [narrativeTyping, setNarrativeTyping] = useState(false);
  const [replayVisible, setReplayVisible] = useState(false);

  useEffect(() => {
    runIdRef.current += 1;
    narrativeRunIdRef.current += 1;
    const token = runIdRef.current;
    const isAlive = () => token === runIdRef.current;

    async function typeIntro() {
      if (prefersReducedMotion()) {
        setIntroAsk(INTRO_ASK);
        return isAlive();
      }
      setIntroTyping(true);
      let partial = "";
      for (const character of INTRO_ASK) {
        if (!isAlive()) return false;
        partial += character;
        setIntroAsk(partial);
        if (!(await sleep(72, isAlive))) return false;
      }
      setIntroTyping(false);
      return isAlive();
    }

    async function materialize(
      text: string,
      seed: number,
      questionIndex: number,
      setter: React.Dispatch<React.SetStateAction<string[][]>>,
    ) {
      if (prefersReducedMotion()) {
        setter((previous) => {
          const next = [...previous];
          next[questionIndex] = [text];
          return next;
        });
        return isAlive();
      }

      const plan = planMemoryPhases(text, seed);
      const rng = mulberry32(seed ^ 0x9e3779b9);
      if (plan.startDelay && !(await sleep(plan.startDelay, isAlive))) return false;

      for (const phase of plan.phases) {
        for (const part of phase.parts) {
          if (!isAlive()) return false;
          setter((previous) => {
            const next = previous.map((units) => [...units]);
            next[questionIndex].push(part);
            return next;
          });
          if (
            !(await sleep(
              randBetween(rng, phase.holdMin, phase.holdMax),
              isAlive,
            ))
          ) {
            return false;
          }
        }
        if (phase.pauseAfter && !(await sleep(phase.pauseAfter, isAlive))) {
          return false;
        }
      }
      return isAlive();
    }

    void (async () => {
      if (!(await sleep(160, isAlive))) return;
      setIntroVisible(true);
      if (!(await sleep(2000, isAlive))) return;
      if (!(await typeIntro())) return;
      if (!(await sleep(1200, isAlive))) return;

      setFieldVisible(true);
      setMaterializing(true);
      const labelsComplete = await Promise.all(
        QUESTION_DEFS.map((question, index) =>
          materialize(question.label, LABEL_SEEDS[index], index, setLabelUnits),
        ),
      );
      if (!labelsComplete.every(Boolean) || !isAlive()) return;

      const examplesComplete = await Promise.all(
        QUESTION_DEFS.map((question, index) =>
          materialize(
            question.fieldExample,
            EXAMPLE_SEEDS[index],
            index,
            setExampleUnits,
          ),
        ),
      );
      if (!examplesComplete.every(Boolean) || !isAlive()) return;
      if (!(await sleep(280, isAlive))) return;

      setMaterializing(false);
      setCaptureReady(true);
      setIntroVisible(false);
      setSignalMode("void");
      setReplayVisible(true);
    })();

    return () => {
      runIdRef.current += 1;
      narrativeRunIdRef.current += 1;
    };
  }, [sequenceNonce]);

  function readDimensionValues(): B0ComoOcurreDimensionValues {
    return {
      trigger: cleanText(valueRefs.current[0]?.textContent ?? values[0] ?? ""),
      criterion: cleanText(valueRefs.current[1]?.textContent ?? values[1] ?? ""),
      handoff: cleanText(valueRefs.current[2]?.textContent ?? values[2] ?? ""),
    };
  }

  function persist(
    text: string,
    confirmationStep: B0ComoOcurreConfirmPayload["confirmationStep"],
  ) {
    const captured = readDimensionValues();
    const payload: B0ComoOcurreConfirmPayload = {
      narrative: text,
      dimensions: {
        D1_trigger: captured.trigger,
        D2_how: inherited.how,
        D3_criterion: captured.criterion,
        D4_output: inherited.output,
        D5_handoff: captured.handoff,
      },
      confirmationStep,
    };
    try {
      localStorage.setItem(
        `${STORAGE_KEY}:${sessionId}`,
        JSON.stringify({
          ...payload,
          build: BUILD,
          confirmedAt: new Date().toISOString(),
          inherited,
        }),
      );
    } catch {
      // Local persistence is best-effort.
    }
    onConfirm?.(payload);
  }

  function toggleExamples(index: number) {
    if (!captureReady || sceneMode !== "idle") return;
    if (signalMode === "examples" && openExamplesFor === index) {
      setOpenExamplesFor(null);
      setSignalMode("void");
      return;
    }
    setOpenExamplesFor(index);
    setSignalMode("examples");
  }

  async function typeNarrative(text: string) {
    const token = ++narrativeRunIdRef.current;
    const isAlive = () =>
      token === narrativeRunIdRef.current && runIdRef.current > 0;
    if (prefersReducedMotion()) {
      setNarrative(text);
      return;
    }
    setNarrative("");
    setNarrativeTyping(true);
    let partial = "";
    for (const character of text) {
      if (!isAlive()) return;
      partial += character;
      setNarrative(partial);
      if (!(await sleep(NARRATIVE_TYPE_MS, isAlive))) return;
    }
    setNarrativeTyping(false);
  }

  async function activateScene() {
    const composed = composeNarrative(readDimensionValues(), inherited);
    if (!composed) {
      return;
    }
    setSceneMode("confirm");
    setOpenExamplesFor(null);
    setSignalMode("void");
    setNarrative("");

    const runToken = runIdRef.current;
    await new Promise((resolve) => window.setTimeout(resolve, SCENE_FADE_MS));
    if (runToken !== runIdRef.current) return;
    setSignalMode("narrative");
    await typeNarrative(composed);
    if (runToken !== runIdRef.current) return;
  }

  function enterNarrativeEdit() {
    narrativeRunIdRef.current += 1;
    setNarrativeTyping(false);
    setSceneMode("edit");
    setSignalMode("narrative");
    window.requestAnimationFrame(() => {
      narrativeRef.current?.focus();
    });
  }

  function enterFrequencyPhase() {
    setSheetPhase("frequency");
    setFrequencyReady(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setFrequencyReady(true));
    });
  }

  function returnToSceneQuestions() {
    setSheetPhase("scene");
    setFrequencyReady(false);
    setBoundariesReady(false);
    setSignalMode("narrative");
  }

  function goForwardToFrequency() {
    if (!cleanText(narrative) || sceneMode === "idle") return;
    enterFrequencyPhase();
  }

  function enterBoundariesPhase() {
    setShowBoundaryClarify(false);
    setOpenBoundaryHelp(null);
    onShellHelpChange?.(null);
    setSheetPhase("boundaries");
    setBoundariesReady(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (startRef.current) startRef.current.textContent = startCondition;
        if (endRef.current) endRef.current.textContent = endResult;
        if (clarifyRef.current) {
          clarifyRef.current.textContent = boundaryClarifyText;
        }
        setBoundariesReady(true);
      });
    });
  }

  function returnToFrequencyPhase() {
    setOpenBoundaryHelp(null);
    onShellHelpChange?.(null);
    setSheetPhase("frequency");
    setBoundariesReady(false);
    setFrequencyReady(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setFrequencyReady(true));
    });
  }

  function goForwardToBoundaries() {
    if (!frequencySaved) return;
    enterBoundariesPhase();
  }

  function setBoundaryHelp(target: "start" | "end" | null) {
    setOpenBoundaryHelp(target);
    if (target === "start") {
      onShellHelpChange?.(B0_Q06.help);
      return;
    }
    if (target === "end") {
      onShellHelpChange?.(B0_Q07.help);
      return;
    }
    onShellHelpChange?.(null);
  }

  function confirmSceneAsObserved() {
    const text = cleanText(narrativeRef.current?.textContent ?? narrative);
    if (!text) {
      return;
    }
    setNarrative(text);
    setSceneMode("saved");
    persist(text, "confirm_scene");
    onShellActivate?.();
    enterFrequencyPhase();
  }

  function saveNarrativeEdit() {
    const text = cleanText(narrativeRef.current?.textContent ?? narrative);
    if (!text) {
      return;
    }
    setNarrative(text);
    setSceneMode("saved");
    persist(text, "save_edit");
    onShellActivate?.();
    enterFrequencyPhase();
  }

  function handleSceneToggle() {
    if (sceneMode === "idle") {
      void activateScene();
      return;
    }
    if (sceneMode === "edit") {
      saveNarrativeEdit();
      return;
    }
    if (sceneMode === "saved") {
      enterNarrativeEdit();
    }
  }

  const resolvedContext =
    contextChoice === "Otro"
      ? cleanText(contextOther)
      : contextChoice ?? "";
  const resolvedActor =
    actorChoice === "Otro" ? cleanText(actorOther) : actorChoice ?? "";
  const canSaveFrequency =
    Boolean(frequencyChoice) &&
    Boolean(contextChoice) &&
    (contextChoice !== "Otro" || Boolean(resolvedContext)) &&
    Boolean(actorChoice) &&
    (actorChoice !== "Otro" || Boolean(resolvedActor));
  const frequencyClosureHint = !frequencyChoice
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

  function saveFrequency() {
    if (
      !canSaveFrequency ||
      frequencySaved ||
      !frequencyChoice ||
      !contextChoice ||
      !actorChoice
    ) {
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
        `${FREQ_STORAGE_KEY}:${sessionId}`,
        JSON.stringify({
          ...payload,
          build: BUILD,
          confirmedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // best-effort
    }
    setFrequencySaved(true);
    onFrecuenciaConfirm?.(payload);
    enterBoundariesPhase();
  }

  function saveBoundaries() {
    const start = cleanText(startCondition);
    const end = cleanText(endResult);
    if (!start || !end || boundariesSaved) return;

    const needsClarify = boundariesNeedClarification(start, end);
    if (needsClarify && !showBoundaryClarify) {
      setShowBoundaryClarify(true);
      return;
    }
    if (showBoundaryClarify && !cleanText(boundaryClarifyText)) {
      return;
    }

    const payload: B0BoundariesConfirmPayload = {
      start_condition: start,
      end_result: end,
      clarification_0b: showBoundaryClarify
        ? cleanText(boundaryClarifyText)
        : null,
      clarification_required: showBoundaryClarify,
    };
    try {
      localStorage.setItem(
        `${BOUNDARIES_STORAGE_KEY}:${sessionId}`,
        JSON.stringify({
          ...payload,
          codes: ["0.6", "0.7", showBoundaryClarify ? "0.B" : null].filter(
            Boolean,
          ),
          runtime_id: "B0-Q04",
          build: BUILD,
          confirmedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // best-effort
    }
    setBoundariesSaved(true);
    onShellHelpChange?.(null);
    setOpenBoundaryHelp(null);
    onBoundariesConfirm?.(payload);
  }

  function replaySequence() {
    runIdRef.current += 1;
    narrativeRunIdRef.current += 1;
    setIntroVisible(false);
    setIntroAsk("");
    setIntroTyping(false);
    setFieldVisible(false);
    setMaterializing(false);
    setLabelUnits([[], [], []]);
    setExampleUnits([[], [], []]);
    setValues(["", "", ""]);
    setCaptureReady(false);
    setOpenExamplesFor(null);
    setSignalMode("void");
    setSceneMode("idle");
    setSheetPhase("scene");
    setFrequencyReady(false);
    setFrequencySaved(false);
    setFrequencyChoice(null);
    setContextChoice(null);
    setActorChoice(null);
    setContextOther("");
    setActorOther("");
    setBoundariesReady(false);
    setBoundariesSaved(false);
    setStartCondition("");
    setEndResult("");
    setShowBoundaryClarify(false);
    setBoundaryClarifyText("");
    setOpenBoundaryHelp(null);
    onShellHelpChange?.(null);
    setNarrative("");
    setNarrativeTyping(false);
    setReplayVisible(false);
    valueRefs.current.forEach((element) => {
      if (element) element.textContent = "";
    });
    setSequenceNonce((value) => value + 1);
  }

  const sceneToggleText =
    sceneMode === "idle"
      ? "Ir a memoria operativa 1"
      : sceneMode === "edit"
        ? "guardar"
        : "editar";
  const currentDimensionValues: B0ComoOcurreDimensionValues = {
    trigger: values[0] ?? "",
    criterion: values[1] ?? "",
    handoff: values[2] ?? "",
  };
  const sceneToggleDisabled =
    !captureReady ||
    narrativeTyping ||
    sheetPhase === "frequency" ||
    sheetPhase === "boundaries" ||
    (sceneMode === "idle" &&
      !composeNarrative(currentDimensionValues, inherited));
  const showSceneConfirm =
    sheetPhase === "scene" &&
    sceneMode === "confirm" &&
    signalMode === "narrative" &&
    !narrativeTyping &&
    Boolean(cleanText(narrative));
  /**
   * After save, default is frequency. If user pressed ←, sheetPhase=scene + saved
   * → show the 3 questions again with narrative still present.
   */
  const reviewingSceneWithNarrative =
    sheetPhase === "scene" && sceneMode === "saved";
  const hideSceneColumns =
    sheetPhase === "frequency" ||
    sheetPhase === "boundaries" ||
    (sceneMode !== "idle" && !reviewingSceneWithNarrative);

  const canSaveBoundaries =
    Boolean(cleanText(startCondition)) &&
    Boolean(cleanText(endResult)) &&
    (!showBoundaryClarify || Boolean(cleanText(boundaryClarifyText)));
  const boundariesClosureHint = !cleanText(startCondition)
    ? "Describe qué necesitas para empezar"
    : !cleanText(endResult)
      ? "Describe qué queda listo al terminar"
      : showBoundaryClarify && !cleanText(boundaryClarifyText)
        ? "Completa: empieza cuando… y termina cuando…"
        : "Completa inicio y cierre";

  const phaseBuildSuffix =
    sheetPhase === "frequency"
      ? " + FRECUENCIA"
      : sheetPhase === "boundaries"
        ? " + INICIO / CIERRE"
        : "";

  const phaseArrowLabel =
    sheetPhase === "boundaries"
      ? "Volver a frecuencia"
      : sheetPhase === "frequency"
        ? frequencySaved
          ? "Ir a inicio y cierre"
          : "Volver a las tres preguntas iniciales"
        : "Ir a frecuencia";

  const phaseArrowVisible =
    (sheetPhase === "boundaries" && boundariesReady) ||
    (sheetPhase === "frequency" && frequencyReady) ||
    reviewingSceneWithNarrative;

  return (
    <>
      <section
        aria-label="B0 sección 2 · cómo ocurre"
        className={cx(
          styles.screen,
          sceneMode !== "idle" && styles.screenSceneVoid,
        )}
        data-section="b0-como-ocurre"
        data-sheet-phase={sheetPhase}
        id="b0-como-ocurre"
      >
        <p className={styles.build}>
          BUILD {BUILD} · MEMORIA OPERATIVA
          {phaseBuildSuffix}
        </p>

        <button
          aria-label={phaseArrowLabel}
          className={cx(
            styles.phaseArrow,
            phaseArrowVisible && styles.phaseArrowVisible,
          )}
          onClick={() => {
            if (sheetPhase === "boundaries") {
              returnToFrequencyPhase();
              return;
            }
            if (sheetPhase === "frequency") {
              if (frequencySaved) {
                goForwardToBoundaries();
                return;
              }
              returnToSceneQuestions();
              return;
            }
            goForwardToFrequency();
          }}
          type="button"
        >
          {sheetPhase === "boundaries" ||
          (sheetPhase === "frequency" && !frequencySaved)
            ? "←"
            : "→"}
        </button>

        <header
          aria-live="polite"
          className={cx(
            styles.introCorner,
            introVisible && styles.introCornerActive,
          )}
        >
          <p className={styles.stageIntroLead}>
            Tu memoria operativa está creada en base a la reaccion emocional
            causada por tu actividad.
          </p>
          <p className={styles.stageIntroAsk}>
            {introAsk}
            {introTyping ? <span aria-hidden className={styles.cursor} /> : null}
          </p>
        </header>

        <div
          aria-live="polite"
          className={cx(
            styles.signal,
            signalMode === "examples" && styles.signalInteractive,
            signalMode === "narrative" && styles.signalNarrative,
            sceneMode === "edit" && styles.signalEditingNarrative,
          )}
        >
          {signalMode === "examples" && openExamplesFor !== null ? (
            <div className={cx(styles.stagePanel, styles.stagePanelActive)}>
              <p className={styles.stageExamplesTitle}>Ejemplos</p>
              <ul className={styles.stageExamplesList}>
                {QUESTION_DEFS[openExamplesFor].voidExamples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {signalMode === "narrative" ? (
            <div className={cx(styles.stagePanel, styles.stagePanelActive)}>
              <p
                className={cx(
                  styles.stageNarrativeText,
                  sceneMode === "edit" && styles.stageNarrativeTextEditing,
                )}
                contentEditable={sceneMode === "edit"}
                onInput={(event) =>
                  setNarrative(event.currentTarget.textContent ?? "")
                }
                ref={narrativeRef}
                suppressContentEditableWarning
              >
                {narrative}
                {narrativeTyping ? (
                  <span aria-hidden className={styles.cursor} />
                ) : null}
              </p>
            </div>
          ) : null}
        </div>

        <div
          className={cx(
            styles.field,
            fieldVisible && styles.fieldVisible,
            materializing && styles.fieldMaterializingMemory,
            hideSceneColumns && styles.fieldSceneVoid,
          )}
        >
          <div
            aria-hidden={hideSceneColumns}
            aria-label="Preguntas 1 y 2"
            className={cx(styles.column, styles.columnLeft)}
          >
            {[0, 1].map((index) => (
              <Question
                captureReady={captureReady}
                exampleUnits={exampleUnits[index]}
                index={index}
                key={QUESTION_DEFS[index].label}
                labelUnits={labelUnits[index]}
                onInput={(text) =>
                  setValues((previous) => {
                    const next = [...previous];
                    next[index] = text;
                    return next;
                  })
                }
                onToggleExamples={() => toggleExamples(index)}
                open={openExamplesFor === index}
                sceneMode={sceneMode}
                value={values[index]}
                valueRef={(element) => {
                  valueRefs.current[index] = element;
                }}
              />
            ))}
          </div>

          <div
            aria-hidden={hideSceneColumns}
            aria-label="Pregunta 3"
            className={cx(styles.column, styles.columnRight)}
          >
            <Question
              captureReady={captureReady}
              exampleUnits={exampleUnits[2]}
              index={2}
              labelUnits={labelUnits[2]}
              onInput={(text) =>
                setValues((previous) => {
                  const next = [...previous];
                  next[2] = text;
                  return next;
                })
              }
              onToggleExamples={() => toggleExamples(2)}
              open={openExamplesFor === 2}
              sceneMode={sceneMode}
              value={values[2]}
              valueRef={(element) => {
                valueRefs.current[2] = element;
              }}
            />
            {showSceneConfirm ? (
              <div
                aria-label="Confirmación de memoria operativa 1"
                className={styles.sceneConfirm}
                role="group"
              >
                <p className={styles.sceneConfirmPrompt}>
                  {SCENE_CONFIRM_PROMPT}
                </p>
                <div className={styles.sceneConfirmActions}>
                  <button
                    className={cx(
                      styles.sceneConfirmButton,
                      styles.sceneConfirmYes,
                    )}
                    onClick={confirmSceneAsObserved}
                    type="button"
                  >
                    Sí, guardar
                  </button>
                  <button
                    className={cx(
                      styles.sceneConfirmButton,
                      styles.sceneConfirmNo,
                    )}
                    onClick={enterNarrativeEdit}
                    type="button"
                  >
                    No, Editar
                  </button>
                </div>
              </div>
            ) : sheetPhase === "scene" && sceneMode !== "confirm" ? (
              <button
                aria-label={
                  sceneMode === "idle"
                    ? "Ir a memoria operativa 1 y mostrar redacción con suficiencia"
                    : sceneMode === "edit"
                      ? "Guardar redacción con suficiencia de la memoria operativa 1"
                      : "Editar redacción con suficiencia de la memoria operativa 1"
                }
                aria-pressed={sceneMode === "edit" || sceneMode === "saved"}
                className={cx(
                  styles.sceneToggle,
                  captureReady && styles.sceneToggleReady,
                  sceneMode === "saved" && styles.sceneToggleActive,
                  sceneMode === "edit" && styles.sceneToggleSave,
                )}
                disabled={sceneToggleDisabled}
                onClick={handleSceneToggle}
                type="button"
              >
                {sceneToggleText}
              </button>
            ) : null}
          </div>

          <div
            aria-hidden={sheetPhase !== "frequency"}
            aria-label="Frecuencia, situación y actor"
            className={cx(
              styles.frequencyOverlay,
              sheetPhase === "frequency" &&
                frequencyReady &&
                styles.frequencyOverlayActive,
            )}
          >
            <div
              aria-label="Frecuencia y situación"
              className={cx(styles.column, styles.columnLeft)}
            >
              <article className={styles.freqBlock}>
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
                      disabled={frequencySaved}
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

              <article className={styles.freqBlock}>
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
                      disabled={frequencySaved}
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
                  <div className={styles.openAnswerField}>
                    {!frequencySaved &&
                    contextChoice === "Otro" &&
                    !cleanText(contextOther) ? (
                      <span aria-hidden className={styles.openAnswerPrompt} />
                    ) : null}
                    <div
                      aria-label="Situación — otro"
                      className={styles.openAnswerValue}
                      contentEditable={
                        !frequencySaved && contextChoice === "Otro"
                      }
                      key={`context-other-${contextChoice === "Otro"}`}
                      onInput={(event) =>
                        setContextOther(event.currentTarget.textContent ?? "")
                      }
                      role="textbox"
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              </article>
            </div>

            <div
              aria-label="Actor y cierre"
              className={cx(styles.column, styles.columnRight)}
            >
              <article className={styles.freqBlock}>
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
                      disabled={frequencySaved}
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
                  <div className={styles.openAnswerField}>
                    {!frequencySaved &&
                    actorChoice === "Otro" &&
                    !cleanText(actorOther) ? (
                      <span aria-hidden className={styles.openAnswerPrompt} />
                    ) : null}
                    <div
                      aria-label="Actor — otro"
                      className={styles.openAnswerValue}
                      contentEditable={!frequencySaved && actorChoice === "Otro"}
                      key={`actor-other-${actorChoice === "Otro"}`}
                      onInput={(event) =>
                        setActorOther(event.currentTarget.textContent ?? "")
                      }
                      role="textbox"
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              </article>

              <button
                aria-label="Confirmar anclaje de frecuencia"
                className={cx(
                  styles.sceneToggle,
                  canSaveFrequency && styles.sceneToggleReady,
                  frequencySaved && styles.sceneToggleActive,
                )}
                disabled={!canSaveFrequency || frequencySaved}
                onClick={saveFrequency}
                type="button"
              >
                Así es · Guardar
              </button>
              {!frequencySaved && !canSaveFrequency ? (
                <p
                  className={cx(
                    styles.freqClosureHint,
                    styles.freqClosureHintVisible,
                  )}
                >
                  {frequencyClosureHint}
                </p>
              ) : null}
            </div>
          </div>

          <div
            aria-hidden={sheetPhase !== "boundaries"}
            aria-label="Inicio y cierre de la actividad"
            className={cx(
              styles.boundariesOverlay,
              sheetPhase === "boundaries" &&
                boundariesReady &&
                styles.boundariesOverlayActive,
            )}
          >
            <div
              aria-label="Para empezar"
              className={cx(styles.column, styles.columnLeft)}
            >
              <article className={styles.freqBlock}>
                <div className={styles.qHead}>
                  <p className={styles.qLabel}>{B0_Q06.question}</p>
                  <button
                    aria-expanded={openBoundaryHelp === "start"}
                    aria-label={
                      openBoundaryHelp === "start"
                        ? "Cerrar ayuda de inicio"
                        : "Ver ayuda de inicio"
                    }
                    className={cx(
                      styles.qPlus,
                      styles.qPlusReady,
                      openBoundaryHelp === "start" && styles.qPlusOpen,
                    )}
                    disabled={boundariesSaved}
                    onClick={() =>
                      setBoundaryHelp(
                        openBoundaryHelp === "start" ? null : "start",
                      )
                    }
                    type="button"
                  >
                    {openBoundaryHelp === "start" ? "−" : "+"}
                  </button>
                </div>
                <div className={styles.openAnswerField}>
                  {!boundariesSaved && !cleanText(startCondition) ? (
                    <span aria-hidden className={styles.openAnswerPrompt} />
                  ) : null}
                  <div
                    aria-label={B0_Q06.question}
                    className={styles.openAnswerValue}
                    contentEditable={!boundariesSaved}
                    onInput={(event) => {
                      setStartCondition(event.currentTarget.textContent ?? "");
                      setShowBoundaryClarify(false);
                    }}
                    ref={startRef}
                    role="textbox"
                    suppressContentEditableWarning
                  />
                </div>
              </article>
            </div>

            <div
              aria-label="Para terminar y cierre"
              className={cx(styles.column, styles.columnRight)}
            >
              <article className={styles.freqBlock}>
                <div className={styles.qHead}>
                  <p className={styles.qLabel}>{B0_Q07.question}</p>
                  <button
                    aria-expanded={openBoundaryHelp === "end"}
                    aria-label={
                      openBoundaryHelp === "end"
                        ? "Cerrar ayuda de cierre"
                        : "Ver ayuda de cierre"
                    }
                    className={cx(
                      styles.qPlus,
                      styles.qPlusReady,
                      openBoundaryHelp === "end" && styles.qPlusOpen,
                    )}
                    disabled={boundariesSaved}
                    onClick={() =>
                      setBoundaryHelp(openBoundaryHelp === "end" ? null : "end")
                    }
                    type="button"
                  >
                    {openBoundaryHelp === "end" ? "−" : "+"}
                  </button>
                </div>
                <div className={styles.openAnswerField}>
                  {!boundariesSaved && !cleanText(endResult) ? (
                    <span aria-hidden className={styles.openAnswerPrompt} />
                  ) : null}
                  <div
                    aria-label={B0_Q07.question}
                    className={styles.openAnswerValue}
                    contentEditable={!boundariesSaved}
                    onInput={(event) => {
                      setEndResult(event.currentTarget.textContent ?? "");
                      setShowBoundaryClarify(false);
                    }}
                    ref={endRef}
                    role="textbox"
                    suppressContentEditableWarning
                  />
                </div>
              </article>

              {showBoundaryClarify ? (
                <div
                  aria-label={B0_QB.shortLabel}
                  className={styles.boundaryClarify}
                  role="group"
                >
                  <p className={styles.boundaryClarifyLead}>
                    {B0_QB.trenchLead}
                  </p>
                  <p className={styles.boundaryClarifyLanding}>
                    {B0_QB.landing}
                  </p>
                  <p className={styles.boundaryClarifyExample}>
                    Por ejemplo: si dices casi lo mismo al empezar y al
                    terminar, no se distingue el borde. “Empieza cuando recibo
                    la factura; termina cuando queda marcada para pago”.
                  </p>
                  <p className={styles.boundaryClarifyPrompt}>
                    {B0_QB.question}
                  </p>
                  <div className={styles.openAnswerField}>
                    {!boundariesSaved && !cleanText(boundaryClarifyText) ? (
                      <span aria-hidden className={styles.openAnswerPrompt} />
                    ) : null}
                    <div
                      aria-label={B0_QB.question}
                      className={styles.openAnswerValue}
                      contentEditable={!boundariesSaved}
                      onInput={(event) =>
                        setBoundaryClarifyText(
                          event.currentTarget.textContent ?? "",
                        )
                      }
                      ref={clarifyRef}
                      role="textbox"
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              ) : null}

              <button
                aria-label="Confirmar inicio y cierre de la actividad"
                className={cx(
                  styles.sceneToggle,
                  canSaveBoundaries && styles.sceneToggleReady,
                  boundariesSaved && styles.sceneToggleActive,
                )}
                disabled={!canSaveBoundaries || boundariesSaved}
                onClick={saveBoundaries}
                type="button"
              >
                Así es · Guardar
              </button>
              {!boundariesSaved && !canSaveBoundaries ? (
                <p
                  className={cx(
                    styles.freqClosureHint,
                    styles.freqClosureHintVisible,
                  )}
                >
                  {boundariesClosureHint}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <button
        className={cx(styles.replay, replayVisible && styles.replayVisible)}
        onClick={replaySequence}
        type="button"
      >
        Repetir secuencia
      </button>
    </>
  );
}

type QuestionProps = {
  captureReady: boolean;
  exampleUnits: string[];
  index: number;
  labelUnits: string[];
  onInput: (text: string) => void;
  onToggleExamples: () => void;
  open: boolean;
  sceneMode: SceneMode;
  value: string;
  valueRef: (element: HTMLDivElement | null) => void;
};

function Question({
  captureReady,
  exampleUnits,
  index,
  labelUnits,
  onInput,
  onToggleExamples,
  open,
  sceneMode,
  value,
  valueRef,
}: QuestionProps) {
  const editable = captureReady && sceneMode === "idle";
  return (
    <article className={styles.qBlock}>
      <div className={styles.qHead}>
        <p className={styles.qLabel}>
          {labelUnits.map((unit, unitIndex) => (
            <span className={cx(styles.memUnit, styles.memUnitIn)} key={`${unitIndex}-${unit}`}>
              {unit}
            </span>
          ))}
        </p>
        <button
          aria-expanded={open}
          aria-label={open ? "Cerrar ejemplos del void" : "Ver ejemplos del void"}
          className={cx(
            styles.qPlus,
            captureReady && styles.qPlusReady,
            open && styles.qPlusOpen,
          )}
          onClick={onToggleExamples}
          type="button"
        >
          {open ? "−" : "+"}
        </button>
      </div>
      <div className={styles.qField}>
        <p
          aria-hidden="true"
          className={cx(styles.qFieldExample, value.trim() && styles.qFieldExampleHidden)}
        >
          {exampleUnits.map((unit, unitIndex) => (
            <span className={cx(styles.memUnit, styles.memUnitIn)} key={`${unitIndex}-${unit}`}>
              {unit}
            </span>
          ))}
        </p>
        {editable && !value.trim() ? (
          <span aria-hidden className={styles.qFieldPromptCursor} />
        ) : null}
        <div
          className={cx(styles.qValue, editable && styles.qValueEditing)}
          contentEditable={editable}
          onBlur={(event) => onInput(event.currentTarget.textContent ?? "")}
          onInput={(event) => onInput(event.currentTarget.textContent ?? "")}
          ref={valueRef}
          role="textbox"
          suppressContentEditableWarning
        >
          {value}
        </div>
      </div>
    </article>
  );
}
