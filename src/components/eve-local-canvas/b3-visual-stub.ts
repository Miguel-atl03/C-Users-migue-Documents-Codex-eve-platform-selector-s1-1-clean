/**
 * Visual candidate / reference fixtures for Bloque 3 official canvas (UI-B3).
 *
 * D4 production candidate = Madre always-visible spine only.
 * D5 exception / feedback / clarification / causal = reference fixtures
 * (never production preview authority; no local branching sequencer).
 *
 * Cross-block continuity (B2 handoff vs 2.6; upstream B0.5 in assembly chain)
 * is documented for X4 — not executed here.
 */

import {
  B3_BLOCK_META,
  B3_MADRE_HELP_TEXT,
  B3_MADRE_OPTIONS,
  B3_MADRE_QUESTION_TEXT,
  B3_MADRE_SHORT_LABEL,
  B3_MADRE_VISIBILITY_RULE,
  type B3SourceCode,
} from "./b3-madre-copy";
import type {
  B3BandMeta,
  B3ControlFamily,
  B3PresentationViewModel,
  B3SlotPresentation,
} from "./b3-presentation-contract";

const BAND_BY_CODE: Record<B3SourceCode, B3BandMeta> = {
  "3.1": {
    id: "entregable",
    kicker: "ENTREGABLE",
    guide: "Qué sale de la memoria operativa como handoff — no el estado final interno del objeto.",
  },
  "3.2": {
    id: "receptor",
    kicker: "RECEPTOR",
    guide: "Quién recibe primero y de qué tipo es ese receptor.",
  },
  "3.3": {
    id: "receptor",
    kicker: "RECEPTOR",
    guide: "Quién recibe primero y de qué tipo es ese receptor.",
  },
  "3.4": {
    id: "dependencia",
    kicker: "DEPENDENCIA Y USO",
    guide: "Qué pasa si no llega, y qué hace el receptor con la entrega.",
  },
  "3.5": {
    id: "dependencia",
    kicker: "DEPENDENCIA Y USO",
    guide: "Qué pasa si no llega, y qué hace el receptor con la entrega.",
  },
  "3.6": {
    id: "secundarios",
    kicker: "OTROS RECEPTORES",
    guide: "Quiénes más necesitan acceso, sin confundirlos con el receptor inmediato.",
  },
  "3.7": {
    id: "calidad_medio",
    kicker: "CALIDAD Y MEDIO",
    guide: "Con qué criterios se acepta y por qué canal se entrega.",
  },
  "3.8": {
    id: "calidad_medio",
    kicker: "CALIDAD Y MEDIO",
    guide: "Con qué criterios se acepta y por qué canal se entrega.",
  },
  "3.9": {
    id: "ritmo",
    kicker: "RITMO DE ENTREGA",
    guide: "Cadencia real de la entrega, no la semana excepcional.",
  },
  "3.10": {
    id: "falla_aceptacion",
    kicker: "FALLA Y ACEPTACIÓN",
    guide: "Si la entrega falla y cómo la acepta habitualmente el receptor.",
  },
  "3.11": {
    id: "falla_detalle",
    kicker: "CUANDO FALLA",
    guide: "Solo si hay falla: tipo de problema e impacto/compensación.",
  },
  "3.12": {
    id: "falla_detalle",
    kicker: "CUANDO FALLA",
    guide: "Solo si hay falla: tipo de problema e impacto/compensación.",
  },
  "3.13": {
    id: "falla_aceptacion",
    kicker: "FALLA Y ACEPTACIÓN",
    guide: "Si la entrega falla y cómo la acepta habitualmente el receptor.",
  },
  "3.13a": {
    id: "feedback",
    kicker: "AVISO OPERATIVO",
    guide: "Señal operativa del receptor (avisa/rechaza/corrige) — no solo satisfacción.",
  },
  "3.14": {
    id: "cambios",
    kicker: "CAMBIOS RECIENTES",
    guide: "Si cambió a quién, cómo, criterios o frecuencia de entrega.",
  },
  "3.A": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "3.B": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "3.C": {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "3.D": {
    id: "feedback_gap",
    kicker: "ACLARAR AVISO",
    guide: "Si falta evidencia de feedback operativo tras una falla de entrega.",
  },
};

/** Madre always-visible capture nodes (D4). */
export const B3_BASE_SOURCE_CODES: readonly B3SourceCode[] = [
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
  "3.7",
  "3.8",
  "3.9",
  "3.10",
  "3.13",
  "3.14",
] as const;

/** Reference: failure detail (Madre conditional on 3.10 = sí*). */
export const B3_EXCEPTION_FIXTURE_CODES: readonly B3SourceCode[] = [
  "3.11",
  "3.12",
] as const;

/** Reference: receiver operational feedback (Madre 3.13a). */
export const B3_FEEDBACK_FIXTURE_CODES: readonly B3SourceCode[] = ["3.13a"] as const;

/** Reference: clarifications (Madre flag-gated). */
export const B3_CLARIFICATION_FIXTURE_CODES: readonly B3SourceCode[] = [
  "3.A",
  "3.B",
  "3.C",
] as const;

/** Reference: feedback gap clarification (Madre 3.D). */
export const B3_FEEDBACK_GAP_FIXTURE_CODES: readonly B3SourceCode[] = ["3.D"] as const;

/**
 * D5 causal-style pack: failure probes + feedback + clarifications.
 * Fixed fixture pack for shell QA — not a local sequencer.
 */
export const B3_CAUSAL_FIXTURE_CODES: readonly B3SourceCode[] = [
  ...B3_EXCEPTION_FIXTURE_CODES,
  ...B3_FEEDBACK_FIXTURE_CODES,
  ...B3_FEEDBACK_GAP_FIXTURE_CODES,
  ...B3_CLARIFICATION_FIXTURE_CODES,
] as const;

function resolveControlFamily(code: B3SourceCode): B3ControlFamily {
  if (code === "3.6" || code === "3.7") return "multi_choice";
  if (
    code === "3.1" ||
    code === "3.5" ||
    code === "3.12" ||
    code === "3.13a" ||
    code === "3.D"
  ) {
    return "free_text";
  }
  if (code === "3.A" || code === "3.B" || code === "3.C") return "clarification";
  return "single_choice";
}

function freeTextWhen(code: B3SourceCode): string | null {
  const options = B3_MADRE_OPTIONS[code];
  if (!options) return null;
  const otro = options.find((o) => o.option_id === "otro" || o.option_label.toLowerCase() === "otro");
  return otro?.option_id ?? null;
}

function toSlot(code: B3SourceCode): B3SlotPresentation {
  const options = B3_MADRE_OPTIONS[code];
  const control = resolveControlFamily(code);
  const isClarification =
    code === "3.A" || code === "3.B" || code === "3.C" || code === "3.D";
  const ft = freeTextWhen(code);

  return {
    field_key: code,
    source_code: code,
    short_ui_label: B3_MADRE_SHORT_LABEL[code],
    question_text: B3_MADRE_QUESTION_TEXT[code],
    help_text: B3_MADRE_HELP_TEXT[code],
    control_family: control,
    required: !isClarification && code !== "3.11" && code !== "3.12" && code !== "3.13a",
    options,
    free_text_when_option_id: ft,
    max_chars:
      code === "3.1" || code === "3.5" || code === "3.12" || code === "3.13a" || code === "3.D"
        ? 280
        : null,
    band: BAND_BY_CODE[code],
    capture_slot_kind: isClarification
      ? "conditional_clarification"
      : "visible_capture",
    visibility_rule: B3_MADRE_VISIBILITY_RULE[code],
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Actividad seleccionada",
};

export type CreateB3VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
};

function buildViewModel(
  codes: readonly B3SourceCode[],
  surface: B3PresentationViewModel["presentation_surface"],
  kind: B3PresentationViewModel["presentation_kind"],
  activity?: CreateB3VisualCandidateOptions["activity"],
  hints?: { matrix_interaction_hint?: string; ui_component_hint?: string },
): B3PresentationViewModel {
  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "3",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    slots: codes.map((code) => toSlot(code)),
    activity: {
      area: activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral:
        activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_line: B3_BLOCK_META.frame_line,
  };
}

/** Production visual candidate — Madre always-visible base only. */
export function createB3VisualStubViewModel(
  options: CreateB3VisualCandidateOptions = {},
): B3PresentationViewModel {
  return buildViewModel(B3_BASE_SOURCE_CODES, "base", "visual_candidate", options.activity, {
    matrix_interaction_hint: "B3 Salida spine (shell visual; no binding)",
    ui_component_hint: "official_canvas_b3_instrument",
  });
}

export const createB3VisualCandidateViewModel = createB3VisualStubViewModel;

/** REFERENCE — failure detail 3.11/3.12. */
export function createB3ExceptionFixtureViewModel(
  options: CreateB3VisualCandidateOptions = {},
): B3PresentationViewModel {
  return buildViewModel(
    [...B3_BASE_SOURCE_CODES, ...B3_EXCEPTION_FIXTURE_CODES],
    "exception_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "3.11|3.12 (fixture; no branching)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}

/** REFERENCE — 3.13a receiver operational feedback. */
export function createB3FeedbackFixtureViewModel(
  options: CreateB3VisualCandidateOptions = {},
): B3PresentationViewModel {
  return buildViewModel(
    [
      ...B3_BASE_SOURCE_CODES,
      ...B3_EXCEPTION_FIXTURE_CODES,
      ...B3_FEEDBACK_FIXTURE_CODES,
    ],
    "feedback_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "3.13a receiver_feedback (fixture)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}

/** REFERENCE — clarifications 3.A/B/C. */
export function createB3ClarificationFixtureViewModel(
  options: CreateB3VisualCandidateOptions = {},
): B3PresentationViewModel {
  return buildViewModel(
    [...B3_BASE_SOURCE_CODES, ...B3_CLARIFICATION_FIXTURE_CODES],
    "clarification_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "3.A|3.B|3.C (fixture)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}

/** REFERENCE — causal pack: exceptions + feedback + 3.D + clarifications. */
export function createB3CausalFixtureViewModel(
  options: CreateB3VisualCandidateOptions = {},
): B3PresentationViewModel {
  return buildViewModel(
    [...B3_BASE_SOURCE_CODES, ...B3_CAUSAL_FIXTURE_CODES],
    "causal_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "B3 causal pack (fixture; no local sequencer)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}
