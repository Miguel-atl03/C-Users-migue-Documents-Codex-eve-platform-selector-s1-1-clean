/**
 * Visual candidate / reference fixtures for Bloque 2 official canvas (UI-B2).
 *
 * Authority: Madre copy → matrix control families (QA).
 *
 * D4 — Production candidate = Madre always-visible spine only.
 * D5 — Dimension paths / relations / exceptions / clarifications = reference fixtures
 *      (never production preview authority; no local branching sequencer).
 *
 * Runtime (X4-2) decides when conditional slots appear. This shell must already
 * render any slot present in the ViewModel with Instrumento chrome + controls.
 */

import {
  B2_BLOCK_META,
  B2_MADRE_HELP_TEXT,
  B2_MADRE_OPTIONS,
  B2_MADRE_QUESTION_TEXT,
  B2_MADRE_SHORT_LABEL,
  type B2SourceCode,
} from "./b2-madre-copy";
import type {
  B2BandMeta,
  B2ControlFamily,
  B2PresentationViewModel,
  B2SlotPresentation,
} from "./b2-presentation-contract";

const BAND_BY_CODE: Record<B2SourceCode, B2BandMeta> = {
  "2.1": {
    id: "dimensiones",
    kicker: "DIMENSIÓN",
    guide: "Qué clase de cosa cambia: objeto, sujeto o acción — o una mezcla.",
  },
  "2.1a": {
    id: "dimensiones",
    kicker: "DIMENSIÓN",
    guide: "Identifica el objeto concreto que sale distinto al terminar.",
  },
  "2.1b": {
    id: "dimensiones",
    kicker: "DIMENSIÓN",
    guide: "Identifica el sujeto concreto que cambia o es afectado.",
  },
  "2.1c": {
    id: "dimensiones",
    kicker: "DIMENSIÓN",
    guide: "Identifica la acción/proceso que es el núcleo del cambio.",
  },
  "2.1_AB_Relacion": {
    id: "dominancia",
    kicker: "DOMINANCIA",
    guide: "Cuando hay dos dimensiones, cuál limita más la memoria operativa.",
  },
  "2.1_AC_Relacion": {
    id: "dominancia",
    kicker: "DOMINANCIA",
    guide: "Cuando hay dos dimensiones, cuál limita más la memoria operativa.",
  },
  "2.1_BC_Relacion": {
    id: "dominancia",
    kicker: "DOMINANCIA",
    guide: "Cuando hay dos dimensiones, cuál limita más la memoria operativa.",
  },
  "2.1_ABC_Relacion": {
    id: "dominancia",
    kicker: "DOMINANCIA",
    guide: "Cuando hay tres dimensiones, cuál es el obstáculo principal.",
  },
  "2.1_ABC_Prioridad": {
    id: "dominancia",
    kicker: "DOMINANCIA",
    guide: "Ordena las tres dimensiones por peso real en la memoria operativa.",
  },
  "2.2_obj": {
    id: "atributos",
    kicker: "ATRIBUTOS",
    guide: "Qué propiedades concretas del objeto se modifican.",
  },
  "2.2_suj": {
    id: "atributos",
    kicker: "ATRIBUTOS",
    guide: "Qué propiedades concretas del sujeto se modifican.",
  },
  "2.2_acc": {
    id: "atributos",
    kicker: "ATRIBUTOS",
    guide: "Qué características de la acción cambian realmente.",
  },
  "2.3": {
    id: "magnitud",
    kicker: "MAGNITUD",
    guide: "Qué tanto cambia lo principal respecto a como llegó.",
  },
  "2.4a": {
    id: "causalidad",
    kicker: "CAUSALIDAD",
    guide: "Tu acción directa sobre lo principal — no la del sistema completo.",
  },
  "2.4b": {
    id: "causalidad",
    kicker: "CAUSALIDAD",
    guide: "Qué provoca normalmente que hagas ese cambio.",
  },
  "2.5": {
    id: "estados",
    kicker: "ESTADOS",
    guide: "Condición de llegada, justo antes de tu intervención.",
  },
  "2.6": {
    id: "estados",
    kicker: "ESTADOS",
    guide: "Condición de salida, justo después de terminar.",
  },
  "2.7": {
    id: "ciclos",
    kicker: "CICLOS",
    guide: "Si el cambio ocurre una vez o se repite en rondas.",
  },
  "2.8": {
    id: "ciclos",
    kicker: "CICLOS",
    guide: "Cuántos ciclos típicamente ocurren cuando se repite.",
  },
  "2.9": {
    id: "fallas",
    kicker: "FALLAS",
    guide: "Si hay momentos en que debería cambiar y no cambia, o cambia mal.",
  },
  "2.10": {
    id: "fallas",
    kicker: "FALLAS",
    guide: "Cómo falla exactamente la transformación.",
  },
  "2.11": {
    id: "oculto",
    kicker: "CAMBIO OCULTO",
    guide: "Si ocurren cambios no oficiales o no esperados.",
  },
  "2.12": {
    id: "oculto",
    kicker: "CAMBIO OCULTO",
    guide: "Cuáles son esos cambios y quién los hace.",
  },
  "2.A": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando la dominancia quedó ambigua.",
  },
  "2.B": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando el fallo quedó genérico.",
  },
  "2.C": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando el cambio oculto quedó incompleto.",
  },
};

const MATRIX_HINT_BY_CODE: Partial<Record<B2SourceCode, string>> = {
  "2.1": "B2-Q12",
  "2.1a": "B2-Q12",
  "2.1b": "B2-Q12",
  "2.1c": "B2-Q12",
  "2.2_obj": "B2-Q13",
  "2.2_suj": "B2-Q13",
  "2.2_acc": "B2-Q13",
  "2.4a": "B2-Q14",
  "2.4b": "B2-Q14",
  "2.5": "B2-Q15",
  "2.6": "B2-Q15",
  "2.3": "B2-Q16",
  "2.7": "B2-Q16",
  "2.9": "B2-Q17",
  "2.11": "B2-Q17",
  "2.1_AB_Relacion": "C04",
  "2.1_AC_Relacion": "C04",
  "2.1_BC_Relacion": "C04",
  "2.1_ABC_Relacion": "C04",
  "2.1_ABC_Prioridad": "C04",
  "2.A": "C04",
  "2.10": "C05",
  "2.B": "C05",
  "2.12": "C06",
  "2.C": "C06",
  "2.8": "C07",
};

const VISIBILITY_BY_CODE: Record<B2SourceCode, string> = {
  "2.1": "Siempre visible al iniciar el bloque.",
  "2.1a": "Visible solo si 2.1 incluye Objeto.",
  "2.1b": "Visible solo si 2.1 incluye Sujeto.",
  "2.1c": "Visible solo si 2.1 incluye Acción.",
  "2.1_AB_Relacion": "Visible si 2.1 = Objeto + Sujeto.",
  "2.1_AC_Relacion": "Visible si 2.1 = Objeto + Acción.",
  "2.1_BC_Relacion": "Visible si 2.1 = Sujeto + Acción.",
  "2.1_ABC_Relacion": "Visible si 2.1 = Objeto + Sujeto + Acción.",
  "2.1_ABC_Prioridad":
    "Visible solo en combinación triple, después de 2.1_ABC_Relacion.",
  "2.2_obj": "Visible solo si la dimensión correspondiente está presente en 2.1.",
  "2.2_suj": "Visible solo si la dimensión correspondiente está presente en 2.1.",
  "2.2_acc": "Visible solo si la dimensión correspondiente está presente en 2.1.",
  "2.3":
    "Siempre visible una vez respondidas las preguntas de atributos relevantes.",
  "2.4a": "Siempre visible.",
  "2.4b": "Siempre visible.",
  "2.5": "Siempre visible.",
  "2.6": "Siempre visible.",
  "2.7": "Siempre visible.",
  "2.8": "Visible solo si 2.7 indica iteración discreta repetida.",
  "2.9": "Siempre visible.",
  "2.10": "Visible solo si transformation_exception_exists = true.",
  "2.11": "Siempre visible.",
  "2.12": "Visible solo si 2.11 = Sí, a veces / frecuentemente.",
  "2.A": "No aparece en flujo base; solo por flags.",
  "2.B": "No aparece en flujo base; solo por flags.",
  "2.C": "No aparece en flujo base; solo por flags.",
};

/**
 * D4 — Madre always-visible spine (production visual candidate).
 * Does NOT include dimension subquestions, relations, exceptions, or clarifications.
 */
export const B2_BASE_SOURCE_CODES: readonly B2SourceCode[] = [
  "2.1",
  "2.3",
  "2.4a",
  "2.4b",
  "2.5",
  "2.6",
  "2.7",
  "2.9",
  "2.11",
] as const;

/** D5 — objeto path (conditional on 2.1 ⊇ Objeto). */
export const B2_OBJETO_PATH_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.1a",
  "2.2_obj",
] as const;

/** D5 — sujeto path. */
export const B2_SUBJECT_PATH_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.1b",
  "2.2_suj",
] as const;

/** D5 — acción path. */
export const B2_ACTION_PATH_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.1c",
  "2.2_acc",
] as const;

/** D5 — relations + ranking (matrix C04). */
export const B2_RELATIONS_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.1_AB_Relacion",
  "2.1_AC_Relacion",
  "2.1_BC_Relacion",
  "2.1_ABC_Relacion",
  "2.1_ABC_Prioridad",
] as const;

/** D5 — exception / iteration probes (matrix C05–C07). */
export const B2_EXCEPTION_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.8",
  "2.10",
  "2.12",
] as const;

/** D5 — clarifications (flag-gated). */
export const B2_CLARIFICATION_FIXTURE_CODES: readonly B2SourceCode[] = [
  "2.A",
  "2.B",
  "2.C",
] as const;

/**
 * D5 — causal-style reference surface (B05 pattern H):
 * exception probes + clarifications that Runtime may open after base answers.
 * Not a local sequencer — fixed fixture pack for shell QA.
 */
export const B2_CAUSAL_FIXTURE_CODES: readonly B2SourceCode[] = [
  ...B2_EXCEPTION_FIXTURE_CODES,
  ...B2_CLARIFICATION_FIXTURE_CODES,
] as const;

function presentHelpText(code: B2SourceCode): string | null {
  const raw = B2_MADRE_HELP_TEXT[code]?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

function resolveControlFamily(code: B2SourceCode): B2ControlFamily {
  if (code === "2.1_ABC_Prioridad") return "ranking";
  if (code === "2.1" || code === "2.2_obj" || code === "2.2_suj" || code === "2.2_acc") {
    return "multi_choice";
  }
  if (code === "2.5" || code === "2.6" || code === "2.10" || code === "2.12") {
    return "free_text";
  }
  if (code === "2.A" || code === "2.B" || code === "2.C") return "clarification";
  return "single_choice";
}

function freeTextWhen(code: B2SourceCode): string | null {
  if (code === "2.1a" || code === "2.1b" || code === "2.1c") return "otro";
  if (code === "2.2_obj" || code === "2.2_suj" || code === "2.2_acc") return "otro";
  if (code === "2.4a") return "otra";
  if (code === "2.4b") return "otro";
  return null;
}

function toSlot(code: B2SourceCode): B2SlotPresentation {
  const options = B2_MADRE_OPTIONS[code];
  const control = resolveControlFamily(code);
  const isClarification = code === "2.A" || code === "2.B" || code === "2.C";
  const ft = freeTextWhen(code);
  const alwaysVisible = (B2_BASE_SOURCE_CODES as readonly string[]).includes(code);

  return {
    field_key: code,
    source_code: code,
    short_ui_label: B2_MADRE_SHORT_LABEL[code],
    question_text: B2_MADRE_QUESTION_TEXT[code],
    help_text: presentHelpText(code),
    control_family: control,
    required: alwaysVisible,
    options,
    free_text_when_option_id: ft,
    max_chars:
      code === "2.5" || code === "2.6"
        ? 220
        : code === "2.10" || code === "2.12"
          ? 240
          : isClarification
            ? 220
            : null,
    band: BAND_BY_CODE[code],
    capture_slot_kind: isClarification
      ? "conditional_clarification"
      : "visible_capture",
    visibility_rule: VISIBILITY_BY_CODE[code],
    matrix_interaction_hint: MATRIX_HINT_BY_CODE[code] ?? null,
    state_pole: code === "2.5" ? "antes" : code === "2.6" ? "despues" : null,
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Actividad seleccionada",
};

export type CreateB2VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
};

function uniqueCodes(codes: readonly B2SourceCode[]): B2SourceCode[] {
  return Array.from(new Set(codes));
}

function buildViewModel(
  codes: readonly B2SourceCode[],
  surface: B2PresentationViewModel["presentation_surface"],
  kind: B2PresentationViewModel["presentation_kind"],
  activity?: CreateB2VisualCandidateOptions["activity"],
  hints?: { matrix_interaction_hint?: string; ui_component_hint?: string },
): B2PresentationViewModel {
  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "2",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    slots: uniqueCodes(codes).map((code) => toSlot(code)),
    activity: {
      area: activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral: activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_line: B2_BLOCK_META.frame_line,
  };
}

/** D4 — production visual candidate (always-visible only). */
export function createB2VisualStubViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(B2_BASE_SOURCE_CODES, "base", "visual_candidate", options.activity, {
    matrix_interaction_hint:
      "B2-Q12|B2-Q14|B2-Q15|B2-Q16|B2-Q17 always-visible spine (shell visual; no binding)",
    ui_component_hint: "official_canvas_b2_instrument",
  });
}

export const createB2VisualCandidateViewModel = createB2VisualStubViewModel;

/** D5 — REFERENCE: objeto dimension path. */
export function createB2ObjetoPathFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_OBJETO_PATH_FIXTURE_CODES],
    "objeto_path_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "B2-Q12/Q13 objeto path (fixture; no branching)",
      ui_component_hint: "official_canvas_b2_instrument",
    },
  );
}

/** D5 — REFERENCE: sujeto dimension path. */
export function createB2SubjectPathFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_SUBJECT_PATH_FIXTURE_CODES],
    "subject_path_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "B2-Q12/Q13 sujeto path (fixture; no branching)",
    },
  );
}

/** D5 — REFERENCE: acción dimension path. */
export function createB2ActionPathFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_ACTION_PATH_FIXTURE_CODES],
    "action_path_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "B2-Q12/Q13 acción path (fixture; no branching)",
    },
  );
}

/** D5 — REFERENCE: relations + ranking. */
export function createB2RelationsFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [
      ...B2_BASE_SOURCE_CODES,
      ...B2_OBJETO_PATH_FIXTURE_CODES,
      ...B2_SUBJECT_PATH_FIXTURE_CODES,
      ...B2_ACTION_PATH_FIXTURE_CODES,
      ...B2_RELATIONS_FIXTURE_CODES,
    ],
    "relations_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C04 relations+ranking (fixture; no branching)",
    },
  );
}

/** D5 — REFERENCE: exception / iteration probes. */
export function createB2ExceptionFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_EXCEPTION_FIXTURE_CODES],
    "exception_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C05–C07 exception probes (fixture; no branching)",
    },
  );
}

/** D5 — REFERENCE: clarifications only (+ base for context). */
export function createB2ClarificationFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_CLARIFICATION_FIXTURE_CODES],
    "clarification_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "2.A/B/C clarifications (fixture; no branching)",
    },
  );
}

/** D5 — REFERENCE: causal pack (exceptions + clarifications), B05 H pattern. */
export function createB2CausalFixtureViewModel(
  options: CreateB2VisualCandidateOptions = {},
): B2PresentationViewModel {
  return buildViewModel(
    [...B2_BASE_SOURCE_CODES, ...B2_CAUSAL_FIXTURE_CODES],
    "causal_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C05–C07 + 2.A/B/C causal pack (fixture; no branching)",
    },
  );
}
