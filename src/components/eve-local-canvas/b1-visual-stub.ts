/**
 * Visual candidate / reference fixtures for Bloque 1 official canvas (UI-B1).
 *
 * Authority: Madre copy → matrix control families (QA).
 * Production candidate = always-visible Madre nodes 1.1–1.7 only.
 * 1.8 + 1.A/B/C are reference fixtures — never production preview authority.
 * No local branching / next-interaction sequencer.
 */

import {
  B1_BLOCK_META,
  B1_MADRE_HELP_TEXT,
  B1_MADRE_OPTIONS,
  B1_MADRE_QUESTION_TEXT,
  B1_MADRE_SHORT_LABEL,
  type B1SourceCode,
} from "./b1-madre-copy";
import type {
  B1BandMeta,
  B1ControlFamily,
  B1PresentationViewModel,
  B1SlotPresentation,
} from "./b1-presentation-contract";

const FRAME_MARQUEE = [
  "origen de la señal",
  "tipo de disparador",
  "claridad del inicio",
  "frecuencia y patrón",
  "canal de aviso",
  "precondiciones",
  "excepciones del arranque",
] as const;

const BAND_BY_CODE: Record<B1SourceCode, B1BandMeta> = {
  "1.1": {
    id: "origen_canal",
    kicker: "ORIGEN Y CANAL",
    guide: "De dónde viene la señal y por qué medio te llega — sin describir todavía qué haces después.",
  },
  "1.5": {
    id: "origen_canal",
    kicker: "ORIGEN Y CANAL",
    guide: "De dónde viene la señal y por qué medio te llega — sin describir todavía qué haces después.",
  },
  "1.2": {
    id: "tipo_claridad",
    kicker: "TIPO Y CLARIDAD",
    guide: "Si el inicio es esperado o sorpresivo, y qué tan claro está el momento de empezar.",
  },
  "1.3": {
    id: "tipo_claridad",
    kicker: "TIPO Y CLARIDAD",
    guide: "Si el inicio es esperado o sorpresivo, y qué tan claro está el momento de empezar.",
  },
  "1.4": {
    id: "ritmo",
    kicker: "RITMO DEL DISPARADOR",
    guide: "Con qué frecuencia ocurre y si hay un patrón que puedas predecir.",
  },
  "1.6": {
    id: "precondiciones_excepcion",
    kicker: "PRECONDICIONES Y EXCEPCIÓN",
    guide: "Qué debe haber pasado antes, y si hay momentos en que debería empezar pero no arranca.",
  },
  "1.7": {
    id: "precondiciones_excepcion",
    kicker: "PRECONDICIONES Y EXCEPCIÓN",
    guide: "Qué debe haber pasado antes, y si hay momentos en que debería empezar pero no arranca.",
  },
  "1.8": {
    id: "excepcion_detalle",
    kicker: "CUANDO NO ARRANCA",
    guide: "Solo cuando hay excepción: qué pasa y cómo te das cuenta.",
  },
  "1.A": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando algo del inicio no nos termina de cuadrar.",
  },
  "1.B": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando algo del inicio no nos termina de cuadrar.",
  },
  "1.C": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando algo del inicio no nos termina de cuadrar.",
  },
};

const MATRIX_HINT_BY_CODE: Partial<Record<B1SourceCode, string>> = {
  "1.1": "B1-Q08",
  "1.5": "B1-Q08",
  "1.2": "B1-Q09",
  "1.3": "B1-Q09",
  "1.4": "B1-Q10",
  "1.6": "B1-Q11",
  "1.7": "B1-Q11",
  "1.8": "C03",
  "1.A": "C03",
  "1.B": "C03",
  "1.C": "C03",
};

/** Madre always-visible capture nodes. */
export const B1_BASE_SOURCE_CODES: readonly B1SourceCode[] = [
  "1.1",
  "1.5",
  "1.2",
  "1.3",
  "1.4",
  "1.6",
  "1.7",
] as const;

/** Reference: exception description (Madre conditional on 1.7 = sí*). */
export const B1_EXCEPTION_FIXTURE_CODES: readonly B1SourceCode[] = ["1.8"] as const;

/** Reference: clarifications (Madre flag-gated). */
export const B1_CLARIFICATION_FIXTURE_CODES: readonly B1SourceCode[] = [
  "1.A",
  "1.B",
  "1.C",
] as const;

function presentHelpText(code: B1SourceCode): string | null {
  const raw = B1_MADRE_HELP_TEXT[code].trim();
  if (!raw) return null;
  const exampleMatch = raw.match(/(?:Ejemplo|Ejemplos)\s*:\s*(.+)$/is);
  if (exampleMatch?.[1]) return exampleMatch[1].trim();
  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim() ?? raw;
  if (firstSentence.length <= 160) return firstSentence;
  return `${firstSentence.slice(0, 157).trimEnd()}…`;
}

function resolveControlFamily(code: B1SourceCode): B1ControlFamily {
  if (code === "1.5") return "multi_choice";
  if (code === "1.6" || code === "1.8") return "free_text";
  if (code === "1.A" || code === "1.B" || code === "1.C") return "clarification";
  return "single_choice";
}

function toSlot(code: B1SourceCode): B1SlotPresentation {
  const options = B1_MADRE_OPTIONS[code];
  const control = resolveControlFamily(code);
  const isClarification = code === "1.A" || code === "1.B" || code === "1.C";

  return {
    field_key: code,
    source_code: code,
    short_ui_label: B1_MADRE_SHORT_LABEL[code],
    question_text: B1_MADRE_QUESTION_TEXT[code],
    help_text: presentHelpText(code),
    control_family: control,
    required: !isClarification && code !== "1.8",
    options,
    free_text_when_option_id: code === "1.5" ? "otro" : null,
    max_chars: code === "1.6" ? 150 : code === "1.8" ? 200 : null,
    band: BAND_BY_CODE[code],
    capture_slot_kind: isClarification
      ? "conditional_clarification"
      : "visible_capture",
    matrix_interaction_hint: MATRIX_HINT_BY_CODE[code] ?? null,
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Actividad seleccionada",
};

export type CreateB1VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
};

function buildViewModel(
  codes: readonly B1SourceCode[],
  surface: B1PresentationViewModel["presentation_surface"],
  kind: B1PresentationViewModel["presentation_kind"],
  activity?: CreateB1VisualCandidateOptions["activity"],
  hints?: { matrix_interaction_hint?: string; ui_component_hint?: string },
): B1PresentationViewModel {
  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "1",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    slots: codes.map((code) => toSlot(code)),
    activity: {
      area: activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral: activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_marquee: FRAME_MARQUEE,
    frame_line: B1_BLOCK_META.frame_line,
  };
}

/**
 * Production visual candidate — Madre always-visible base only (1.1–1.7).
 * Does NOT include 1.8 / clarifications.
 */
export function createB1VisualStubViewModel(
  options: CreateB1VisualCandidateOptions = {},
): B1PresentationViewModel {
  return buildViewModel(B1_BASE_SOURCE_CODES, "base", "visual_candidate", options.activity, {
    matrix_interaction_hint: "B1-Q08|B1-Q09|B1-Q10|B1-Q11 (shell visual; no binding)",
    ui_component_hint: "official_canvas_b1_instrumento",
  });
}

export const createB1VisualCandidateViewModel = createB1VisualStubViewModel;

/**
 * REFERENCE / TEST ONLY — exception surface (Madre 1.8).
 * Must not govern production preview.
 */
export function createB1ExceptionFixtureViewModel(
  options: CreateB1VisualCandidateOptions = {},
): B1PresentationViewModel {
  return buildViewModel(
    [...B1_BASE_SOURCE_CODES, ...B1_EXCEPTION_FIXTURE_CODES],
    "exception_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C03 / 1.8 (fixture; no branching)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}

/**
 * REFERENCE / TEST ONLY — clarification surface (Madre 1.A / 1.B / 1.C).
 */
export function createB1ClarificationFixtureViewModel(
  options: CreateB1VisualCandidateOptions = {},
): B1PresentationViewModel {
  return buildViewModel(
    [
      ...B1_BASE_SOURCE_CODES,
      ...B1_EXCEPTION_FIXTURE_CODES,
      ...B1_CLARIFICATION_FIXTURE_CODES,
    ],
    "clarification_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C03 clarifications 1.A|1.B|1.C (fixture)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}
