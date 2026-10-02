/**
 * Visual candidate / reference fixtures for B0.5 official canvas (UI-B05-R).
 *
 * Authority: Madre copy → ficha options/help assist → matrix control families.
 * Production candidate = base always-visible slots only.
 * Clarification / causal surfaces are reference fixtures — never production authority.
 */

import {
  getBlock05Ficha,
  type Block05QuestionCode,
} from "@/components/eve-worksheet/reference/block05-fichas";
import { B05_MADRE_QUESTION_TEXT } from "./b05-madre-copy";
import type {
  B05BandMeta,
  B05ControlFamily,
  B05PresentationViewModel,
  B05SlotPresentation,
} from "./b05-presentation-contract";

const FRAME_MARQUEE = [
  "para quién existe",
  "quién gana si sale bien",
  "quién sufre si falla",
  "a qué proceso pertenece",
  "qué habilita",
  "quién marca la prioridad",
] as const;

const BAND_BY_NORTH: Record<string, B05BandMeta> = {
  cliente_funcional: {
    id: "cliente_funcional",
    kicker: "PARA QUIÉN EXISTE ESTO",
    guide:
      "No el receptor inmediato: quién gana de verdad si sale bien y quién absorbe el daño si falla.",
  },
  proceso_contenedor: {
    id: "proceso_contenedor",
    kicker: "A QUÉ PROCESO PERTENECE",
    guide: "El proceso grande donde esta actividad tiene sentido, no la tarea suelta.",
  },
  hito_habilitador: {
    id: "hito_y_prioridad",
    kicker: "QUÉ HABILITA Y QUIÉN PRIORIZA",
    guide:
      "Qué avance desbloquea para otros, y quién marca la prioridad normal frente a la que desplaza.",
  },
  prioridad_regulatoria: {
    id: "hito_y_prioridad",
    kicker: "QUÉ HABILITA Y QUIÉN PRIORIZA",
    guide:
      "Qué avance desbloquea para otros, y quién marca la prioridad normal frente a la que desplaza.",
  },
  aclaracion: {
    id: "aclaracion",
    kicker: "UNA PRECISIÓN",
    guide: "Solo aparece cuando algo no nos termina de cuadrar.",
  },
};

/** Madre always-visible capture nodes (no flag-only; no local branch). */
export const B05_BASE_SOURCE_CODES: readonly Block05QuestionCode[] = [
  "0.5.1",
  "0.5.1a",
  "0.5.1_rel",
  "0.5.1c",
  "0.5.1d",
  "0.5.2",
  "0.5.3",
  "0.5.4",
  "0.5.4a",
] as const;

/** Reference-only clarification nodes (Madre por flag). */
export const B05_CLARIFICATION_FIXTURE_CODES: readonly Block05QuestionCode[] = [
  "0.5.B",
] as const;

/** Reference-only causal presentation nodes (matrix C02 / Madre 0.5.1b+A+C). */
export const B05_CAUSAL_FIXTURE_CODES: readonly Block05QuestionCode[] = [
  "0.5.1b",
  "0.5.A",
  "0.5.C",
] as const;

function presentHelpText(code: Block05QuestionCode, helpText: string): string | null {
  if (code === "0.5.1_rel" || code === "0.5.1d") return null;
  const raw = helpText.trim();
  if (!raw) return null;

  const exampleMatch = raw.match(/(?:Ejemplo|Ejemplos)\s*:\s*(.+)$/is);
  if (exampleMatch?.[1]) {
    return exampleMatch[1].trim();
  }

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim() ?? raw;
  if (firstSentence.length <= 140) return firstSentence;
  return `${firstSentence.slice(0, 137).trimEnd()}…`;
}

function freeTextWhenOptionId(
  ficha: NonNullable<ReturnType<typeof getBlock05Ficha>>,
): string | null {
  if (ficha.allows_free_text !== "conditional") return null;
  const otro = ficha.options.find((o) => o.id === "otro");
  return otro ? "otro" : null;
}

function resolveControlFamily(
  ficha: NonNullable<ReturnType<typeof getBlock05Ficha>>,
): B05ControlFamily {
  if (ficha.field_type === "clarification") return "clarification";
  if (ficha.field_type === "free_text") return "free_text";
  if (ficha.allows_free_text === "conditional") return "choice_plus_text";
  return "single_choice";
}

function toSlot(code: Block05QuestionCode): B05SlotPresentation | null {
  const ficha = getBlock05Ficha(code);
  if (!ficha) return null;

  const band = BAND_BY_NORTH[ficha.systemic_north] ?? BAND_BY_NORTH.cliente_funcional;
  const madreText = B05_MADRE_QUESTION_TEXT[code];
  const freeTextOption = freeTextWhenOptionId(ficha);

  return {
    field_key: code,
    source_code: code,
    short_ui_label: ficha.short_ui_label,
    question_text: madreText ?? ficha.canonical_question_text,
    help_text: presentHelpText(code, ficha.help_text),
    control_family: resolveControlFamily(ficha),
    required: ficha.visibility !== "flag_only",
    options: ficha.options.map((o) => ({
      option_id: o.id,
      option_label: o.label,
    })),
    free_text_when_option_id: freeTextOption,
    band,
    capture_slot_kind:
      ficha.field_type === "clarification"
        ? "conditional_clarification"
        : "visible_capture",
    dyad_role: code === "0.5.1" ? "benefit" : code === "0.5.1a" ? "harm" : null,
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Primera actividad seleccionada",
};

export type CreateB05VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
};

function buildViewModel(
  codes: readonly Block05QuestionCode[],
  surface: B05PresentationViewModel["presentation_surface"],
  kind: B05PresentationViewModel["presentation_kind"],
  activity?: CreateB05VisualCandidateOptions["activity"],
  hints?: { matrix_interaction_hint?: string; ui_component_hint?: string },
): B05PresentationViewModel {
  const slots = codes
    .map((code) => toSlot(code))
    .filter((slot): slot is B05SlotPresentation => Boolean(slot));

  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "0.5",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    slots,
    activity: {
      area: activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral: activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_marquee: FRAME_MARQUEE,
    frame_line:
      "Ahora ubicamos esta actividad en el sistema. Responde lo que ves abajo.",
  };
}

/**
 * Production visual candidate — Madre always-visible base only.
 * Does NOT include clarification/causal fixtures.
 */
export function createB05VisualStubViewModel(
  options: CreateB05VisualCandidateOptions = {},
): B05PresentationViewModel {
  return buildViewModel(B05_BASE_SOURCE_CODES, "base", "visual_candidate", options.activity, {
    matrix_interaction_hint: "B05-Q05|B05-Q06|B05-Q07 (shell visual; no binding)",
    ui_component_hint: "guided_textarea_or_choice_plus_text",
  });
}

/** @deprecated alias — use createB05VisualStubViewModel (base only). */
export const createB05VisualCandidateViewModel = createB05VisualStubViewModel;

/**
 * REFERENCE / TEST ONLY — clarification surface (e.g. 0.5.B).
 * Must not govern production preview or questionnaire mount.
 */
export function createB05ClarificationFixtureViewModel(
  options: CreateB05VisualCandidateOptions = {},
): B05PresentationViewModel {
  return buildViewModel(
    [...B05_BASE_SOURCE_CODES, ...B05_CLARIFICATION_FIXTURE_CODES],
    "clarification_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "B05-Q06 conditional 0.5.B (fixture)",
      ui_component_hint: "guided_textarea_or_choice_plus_text",
    },
  );
}

/**
 * REFERENCE / TEST ONLY — causal presentation capability (Madre 0.5.1b / A / C).
 * No Runtime branching — visual capability proof only.
 */
export function createB05CausalPreviewViewModel(
  options: CreateB05VisualCandidateOptions = {},
): B05PresentationViewModel {
  return buildViewModel(
    B05_CAUSAL_FIXTURE_CODES,
    "causal_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C02 causal_probe (fixture; no branching)",
      ui_component_hint: "conditional_probe_card",
    },
  );
}
