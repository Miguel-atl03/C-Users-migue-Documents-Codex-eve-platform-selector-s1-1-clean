/**
 * Visual candidate / reference fixtures for Bloque 4 official canvas (UI-B4).
 *
 * Authority: Madre copy → matrix control families (QA).
 *
 * D4 — Production candidate = Madre always-visible spine only (4.1–4.13).
 * D5 — Conditional / clarification / causal = reference fixtures
 *      (never production preview authority; no local branching sequencer).
 *
 * Runtime (X4-4) decides when conditional slots appear. This shell must already
 * render any slot present in the ViewModel with Instrumento chrome + controls.
 */
import {
  B4_BLOCK_META,
  B4_MADRE_HELP_TEXT,
  B4_MADRE_OPTIONS,
  B4_MADRE_QUESTION_TEXT,
  B4_MADRE_SHORT_LABEL,
  B4_MADRE_VISIBILITY_RULE,
  type B4SourceCode,
} from "./b4-madre-copy";
import type {
  B4BandMeta,
  B4ControlFamily,
  B4PresentationViewModel,
  B4SlotPresentation,
} from "./b4-presentation-contract";

const BAND_BY_CODE: Record<B4SourceCode, B4BandMeta> = {
  "4.1": {
    id: "dependencias",
    kicker: "DEPENDENCIAS",
    guide: "Qué tiene que estar listo antes y quién queda detenido si no terminas.",
  },
  "4.2": {
    id: "dependencias",
    kicker: "DEPENDENCIAS",
    guide: "Qué tiene que estar listo antes y quién queda detenido si no terminas.",
  },
  "4.3": {
    id: "tiempo_bloqueo",
    kicker: "TIEMPO Y BLOQUEO",
    guide: "Esperas, gatillos de tiempo y si el flujo puede quedarse trabado.",
  },
  "4.4": {
    id: "tiempo_bloqueo",
    kicker: "TIEMPO Y BLOQUEO",
    guide: "Esperas, gatillos de tiempo y si el flujo puede quedarse trabado.",
  },
  "4.5": {
    id: "tiempo_bloqueo",
    kicker: "TIEMPO Y BLOQUEO",
    guide: "Esperas, gatillos de tiempo y si el flujo puede quedarse trabado.",
  },
  "4.5b": {
    id: "tiempo_bloqueo",
    kicker: "TIEMPO Y BLOQUEO",
    guide: "Quién destrababa el bloqueo cuando sí ocurre.",
  },
  "4.6": {
    id: "iteracion_rutas",
    kicker: "ITERACIÓN Y RUTAS",
    guide: "Si se repite, cómo se repite, y si el proceso toma caminos distintos.",
  },
  "4.6b": {
    id: "iteracion_rutas",
    kicker: "ITERACIÓN Y RUTAS",
    guide: "Patrón de repetición: lote, intercalado o variable.",
  },
  "4.7": {
    id: "iteracion_rutas",
    kicker: "ITERACIÓN Y RUTAS",
    guide: "Si se repite, cómo se repite, y si el proceso toma caminos distintos.",
  },
  "4.7b": {
    id: "iteracion_rutas",
    kicker: "ITERACIÓN Y RUTAS",
    guide: "Cuántos caminos distintos hay típicamente.",
  },
  "4.8": {
    id: "paralelo_desvio",
    kicker: "PARALELO Y DESVÍO",
    guide: "Qué corre en paralelo, pasos extra y orden real vs oficial.",
  },
  "4.9": {
    id: "paralelo_desvio",
    kicker: "PARALELO Y DESVÍO",
    guide: "Qué corre en paralelo, pasos extra y orden real vs oficial.",
  },
  "4.9b": {
    id: "paralelo_desvio",
    kicker: "PARALELO Y DESVÍO",
    guide: "Por qué aparecen esos pasos que no están en el manual.",
  },
  "4.10": {
    id: "paralelo_desvio",
    kicker: "PARALELO Y DESVÍO",
    guide: "Qué corre en paralelo, pasos extra y orden real vs oficial.",
  },
  "4.10b": {
    id: "paralelo_desvio",
    kicker: "PARALELO Y DESVÍO",
    guide: "Por qué cambias el orden respecto al proceso oficial.",
  },
  "4.11": {
    id: "impacto",
    kicker: "IMPACTO",
    guide: "Qué se rompe primero, dónde se atasca y con qué frecuencia se desvía.",
  },
  "4.12": {
    id: "impacto",
    kicker: "IMPACTO",
    guide: "Qué se rompe primero, dónde se atasca y con qué frecuencia se desvía.",
  },
  "4.13": {
    id: "impacto",
    kicker: "IMPACTO",
    guide: "Qué se rompe primero, dónde se atasca y con qué frecuencia se desvía.",
  },
  "4.A": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "4.B": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "4.C": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
};

const MATRIX_HINT_BY_CODE: Partial<Record<B4SourceCode, string>> = {
  "4.1": "B4-Q23",
  "4.2": "B4-Q23",
  "4.A": "B4-Q23",
  "4.3": "B4-Q24",
  "4.4": "B4-Q24",
  "4.5": "B4-Q24",
  "4.6": "B4-Q25",
  "4.7": "B4-Q26",
  "4.8": "B4-Q27",
  "4.9": "B4-Q27",
  "4.10": "B4-Q28",
  "4.11": "B4-Q28",
  "4.12": "B4-Q28",
  "4.13": "B4-Q28",
  "4.5b": "C11",
  "4.6b": "C12",
  "4.7b": "C13",
  "4.9b": "C14",
  "4.10b": "C14",
  "4.B": "C14",
  "4.C": "C14",
};

/** Stored from Madre; not executed as local show/hide. */

const VISIBILITY_BY_CODE: Record<B4SourceCode, string> = {
  ...B4_MADRE_VISIBILITY_RULE,
};

/**
 * D4 — Madre always-visible spine (production visual candidate).
 * Does NOT include 4.5b / 4.6b / 4.7b / 4.9b / 4.10b or clarifications.
 */

export const B4_BASE_SOURCE_CODES: readonly B4SourceCode[] = [
  "4.1",
  "4.2",
  "4.3",
  "4.4",
  "4.5",
  "4.6",
  "4.7",
  "4.8",
  "4.9",
  "4.10",
  "4.11",
  "4.12",
  "4.13",
] as const;

/** D5 — conditional probes (matrix C11–C14 triggers). */

export const B4_CONDITIONAL_FIXTURE_CODES: readonly B4SourceCode[] = [
  "4.5b",
  "4.6b",
  "4.7b",
  "4.9b",
  "4.10b",
] as const;

/** D5 — clarifications (flag-gated). */

export const B4_CLARIFICATION_FIXTURE_CODES: readonly B4SourceCode[] = [
  "4.A",
  "4.B",
  "4.C",
] as const;

/**
 * D5 — causal-style reference surface (B05 pattern H):
 * all C11–C14 codes (conditionals + clarifications B/C).
 * Not a local sequencer — fixed fixture pack for shell QA.
 */

export const B4_CAUSAL_FIXTURE_CODES: readonly B4SourceCode[] = [
  "4.5b",
  "4.6b",
  "4.7b",
  "4.9b",
  "4.10b",
  "4.B",
  "4.C",
] as const;

/** Full Madre help — do not truncate (assistance_loss honesty). */
function presentHelpText(code: B4SourceCode): string | null {
  const raw = B4_MADRE_HELP_TEXT[code]?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

function resolveControlFamily(code: B4SourceCode): B4ControlFamily {
  if (code === "4.1" || code === "4.2" || code === "4.7" || code === "4.11") {
    return "multi_choice";
  }
  if (code === "4.A" || code === "4.B" || code === "4.C") return "clarification";
  return "single_choice";
}

function freeTextWhen(code: B4SourceCode): string | null {
  const options = B4_MADRE_OPTIONS[code];
  if (!options) return null;
  const match = options.find((o) => {
    const label = o.option_label.toLowerCase().trim();
    return (
      o.option_id === "otro" ||
      o.option_id === "otra" ||
      label === "otro" ||
      label === "otra"
    );
  });
  return match?.option_id ?? null;
}

function toSlot(code: B4SourceCode): B4SlotPresentation {
  const options = B4_MADRE_OPTIONS[code];
  const control = resolveControlFamily(code);
  const isClarification = code === "4.A" || code === "4.B" || code === "4.C";
  const ft = freeTextWhen(code);
  const alwaysVisible = (B4_BASE_SOURCE_CODES as readonly string[]).includes(code);
  return {
    field_key: code,
    source_code: code,
    short_ui_label: B4_MADRE_SHORT_LABEL[code],
    question_text: B4_MADRE_QUESTION_TEXT[code],
    help_text: presentHelpText(code),
    control_family: control,
    required: alwaysVisible,
    options,
    free_text_when_option_id: ft,
    max_chars: isClarification ? 280 : null,
    band: BAND_BY_CODE[code],
    capture_slot_kind: isClarification
      ? "conditional_clarification"
      : "visible_capture",
    visibility_rule: VISIBILITY_BY_CODE[code],
    matrix_interaction_hint: MATRIX_HINT_BY_CODE[code] ?? null,
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Actividad seleccionada",
};

export type CreateB4VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
};

function uniqueCodes(codes: readonly B4SourceCode[]): B4SourceCode[] {
  return Array.from(new Set(codes));
}

function buildViewModel(
  codes: readonly B4SourceCode[],
  surface: B4PresentationViewModel["presentation_surface"],
  kind: B4PresentationViewModel["presentation_kind"],
  activity?: CreateB4VisualCandidateOptions["activity"],
  hints?: { matrix_interaction_hint?: string; ui_component_hint?: string },
): B4PresentationViewModel {
  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "4",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    slots: uniqueCodes(codes).map((code) => toSlot(code)),
    activity: {
      area: activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral: activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_line: B4_BLOCK_META.frame_line,
  };
}

/** D4 — production visual candidate (always-visible only). */

export function createB4VisualStubViewModel(
  options: CreateB4VisualCandidateOptions = {},
): B4PresentationViewModel {
  return buildViewModel(B4_BASE_SOURCE_CODES, "base", "visual_candidate", options.activity, {
    matrix_interaction_hint:
      "B4-Q23|B4-Q24|B4-Q25|B4-Q26|B4-Q27|B4-Q28 always-visible spine (shell visual; no binding)",
    ui_component_hint: "official_canvas_b4_instrument",
  });
}

export const createB4VisualCandidateViewModel = createB4VisualStubViewModel;

/** D5 — REFERENCE: conditional probes (+ base for context). */

export function createB4ConditionalFixtureViewModel(
  options: CreateB4VisualCandidateOptions = {},
): B4PresentationViewModel {
  return buildViewModel(
    [...B4_BASE_SOURCE_CODES, ...B4_CONDITIONAL_FIXTURE_CODES],
    "conditional_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C11–C14 conditionals (fixture; no branching)",
      ui_component_hint: "official_canvas_b4_instrument",
    },
  );
}

/** D5 — REFERENCE: clarifications (+ base for context). */

export function createB4ClarificationFixtureViewModel(
  options: CreateB4VisualCandidateOptions = {},
): B4PresentationViewModel {
  return buildViewModel(
    [...B4_BASE_SOURCE_CODES, ...B4_CLARIFICATION_FIXTURE_CODES],
    "clarification_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "4.A/B/C clarifications (fixture; no branching)",
      ui_component_hint: "official_canvas_b4_instrument",
    },
  );
}

/** D5 — REFERENCE: causal pack (C11–C14 codes), B05 H pattern. */

export function createB4CausalFixtureViewModel(
  options: CreateB4VisualCandidateOptions = {},
): B4PresentationViewModel {
  return buildViewModel(
    [...B4_BASE_SOURCE_CODES, ...B4_CAUSAL_FIXTURE_CODES],
    "causal_visible",
    "reference_fixture",
    options.activity,
    {
      matrix_interaction_hint: "C11–C14 causal pack (fixture; no branching)",
      ui_component_hint: "official_canvas_b4_instrument",
    },
  );
}

