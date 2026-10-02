/**
 * Visual candidate / reference fixtures for Bloque 5 official canvas (UI-B5).
 *
 * Authority: Madre copy → matrix control families (QA).
 *
 * D4 — Production candidate = Madre always-visible user capture only
 *      (5.0, 5.1, 5.2, 5.4–5.12, 5.14). Excludes 5.0_auto (internal),
 *      5.3 (derived), 5.13 / 5.14b (conditionals), 5.A–C (clarifications).
 * D5 — Conditional / clarification / derived / metric_time / causal =
 *      reference fixtures (never production preview authority; no local sequencer).
 *
 * Runtime (X4-5) decides when conditional slots appear. This shell must already
 * render any slot present in the ViewModel with Instrumento chrome + controls.
 */
import {
  B5_BLOCK_META,
  B5_MADRE_HELP_TEXT,
  B5_MADRE_OPTIONS,
  B5_MADRE_QUESTION_TEXT,
  B5_MADRE_SHORT_LABEL,
  B5_MADRE_VISIBILITY_RULE,
  B5_TIME_SCALE_OPTIONS,
  type B5SourceCode,
} from "./b5-madre-copy";
import type {
  B5BandMeta,
  B5ControlFamily,
  B5PresentationViewModel,
  B5SlotPresentation,
} from "./b5-presentation-contract";

export type B5InheritedDimension = "objeto" | "sujeto" | "accion";

const BAND_BY_CODE: Record<B5SourceCode, B5BandMeta> = {
  "5.0": {
    id: "naturaleza",
    kicker: "NATURALEZA",
    guide: "Cómo se vive la actividad: volumen repetitivo, atención individual, o mezcla.",
  },
  "5.0_auto": {
    id: "naturaleza",
    kicker: "MÉTRICA INTERNA",
    guide: "Nodo interno — Runtime infiere la métrica comparativa.",
  },
  "5.1": {
    id: "capacidad",
    kicker: "CAPACIDAD",
    guide: "Capacidad esperada (nominal) y capacidad real en la misma métrica.",
  },
  "5.2": {
    id: "capacidad",
    kicker: "CAPACIDAD",
    guide: "Capacidad esperada (nominal) y capacidad real en la misma métrica.",
  },
  "5.3": {
    id: "capacidad",
    kicker: "BRECHA",
    guide: "Resultado derivado: brecha entre nominal y real (Runtime calcula).",
  },
  "5.4": {
    id: "recursos_disponibles",
    kicker: "RECURSOS DISPONIBLES",
    guide: "Personas, sistemas y tiempo oficial con los que realmente cuentas.",
  },
  "5.5": {
    id: "recursos_disponibles",
    kicker: "RECURSOS DISPONIBLES",
    guide: "Personas, sistemas y tiempo oficial con los que realmente cuentas.",
  },
  "5.6": {
    id: "recursos_disponibles",
    kicker: "RECURSOS DISPONIBLES",
    guide: "Personas, sistemas y tiempo oficial con los que realmente cuentas.",
  },
  "5.7": {
    id: "recursos_requeridos",
    kicker: "RECURSOS REQUERIDOS",
    guide: "Qué personas o tiempo harían falta para hacerlo bien sin sacrificios.",
  },
  "5.8": {
    id: "recursos_requeridos",
    kicker: "RECURSOS REQUERIDOS",
    guide: "Qué personas o tiempo harían falta para hacerlo bien sin sacrificios.",
  },
  "5.9": {
    id: "discrecionalidad",
    kicker: "DISCRECIONALIDAD",
    guide: "Dónde tienes margen de decisión y qué límites no puedes cruzar.",
  },
  "5.10": {
    id: "discrecionalidad",
    kicker: "DISCRECIONALIDAD",
    guide: "Dónde tienes margen de decisión y qué límites no puedes cruzar.",
  },
  "5.11": {
    id: "sacrificio_residual",
    kicker: "SACRIFICIO Y RESIDUAL",
    guide: "Qué sacrificas, qué se escapa y qué pasa con lo que no absorbes.",
  },
  "5.12": {
    id: "sacrificio_residual",
    kicker: "SACRIFICIO Y RESIDUAL",
    guide: "Qué sacrificas, qué se escapa y qué pasa con lo que no absorbes.",
  },
  "5.13": {
    id: "sacrificio_residual",
    kicker: "SACRIFICIO Y RESIDUAL",
    guide: "Qué pasa cuando algo se escapa de tu capacidad.",
  },
  "5.14": {
    id: "sostenibilidad",
    kicker: "SOSTENIBILIDAD",
    guide: "Qué tan sostenible es el pacto de recursos y qué tendría que cambiar.",
  },
  "5.14b": {
    id: "sostenibilidad",
    kicker: "SOSTENIBILIDAD",
    guide: "Qué tendría que cambiar para que fuera justo o sostenible.",
  },
  "5.A": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "5.B": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
  "5.C": {
    id: "aclaracion",
    kicker: "ACLARACIÓN",
    guide: "Solo aparece cuando Runtime abre una aclaración por flag.",
  },
};

const MATRIX_HINT_BY_CODE: Partial<Record<B5SourceCode, string>> = {
  "5.0": "B5-Q29",
  "5.0_auto": "B5-Q29",
  "5.1": "B5-Q29",
  "5.2": "B5-Q29",
  "5.3": "B5-Q29",
  "5.4": "B5-Q30",
  "5.5": "B5-Q30",
  "5.6": "B5-Q30",
  "5.7": "B5-Q31",
  "5.8": "B5-Q31",
  "5.9": "B5-Q32",
  "5.10": "B5-Q32",
  "5.11": "B5-Q33",
  "5.12": "B5-Q33",
  "5.14": "B5-Q33",
  "5.13": "C15",
  "5.14b": "C15",
  "5.A": "C15",
  "5.B": "C15",
  "5.C": "C15",
};

/** Stored from Madre; not executed as local show/hide. */

const VISIBILITY_BY_CODE: Record<B5SourceCode, string> = {
  ...B5_MADRE_VISIBILITY_RULE,
};

/**
 * D4 — Madre always-visible user-capture spine (production visual candidate).
 * Does NOT include 5.0_auto, 5.3, 5.13, 5.14b, or clarifications.
 */

export const B5_BASE_SOURCE_CODES: readonly B5SourceCode[] = [
  "5.0",
  "5.1",
  "5.2",
  "5.4",
  "5.5",
  "5.6",
  "5.7",
  "5.8",
  "5.9",
  "5.10",
  "5.11",
  "5.12",
  "5.14",
] as const;

/** D5 — conditional probes (matrix C15 triggers). */

export const B5_CONDITIONAL_FIXTURE_CODES: readonly B5SourceCode[] = [
  "5.13",
  "5.14b",
] as const;

/** D5 — clarifications (flag-gated). */

export const B5_CLARIFICATION_FIXTURE_CODES: readonly B5SourceCode[] = [
  "5.A",
  "5.B",
  "5.C",
] as const;

/** D5 — derived display (5.3). */

export const B5_DERIVED_FIXTURE_CODES: readonly B5SourceCode[] = ["5.3"] as const;

/**
 * D5 — causal-style reference surface:
 * conditionals + clarifications + derived 5.3.
 * Not a local sequencer — fixed fixture pack for shell QA.
 */

export const B5_CAUSAL_FIXTURE_CODES: readonly B5SourceCode[] = [
  "5.13",
  "5.14b",
  "5.A",
  "5.B",
  "5.C",
  "5.3",
] as const;

function resolveDimensionToken(dimension: B5InheritedDimension): string {
  switch (dimension) {
    case "sujeto":
      return "sujetos/entidades";
    case "accion":
      return "ejecuciones";
    case "objeto":
    default:
      return "objetos";
  }
}

function resolveQuestionText(
  code: B5SourceCode,
  dimension: B5InheritedDimension,
): string {
  const raw = B5_MADRE_QUESTION_TEXT[code];
  if (code !== "5.0") return raw;
  const token = resolveDimensionToken(dimension);
  return raw.replaceAll("{X}", token);
}

/** Full Madre help — do not truncate (assistance_loss honesty). */
function presentHelpText(code: B5SourceCode): string | null {
  const raw = B5_MADRE_HELP_TEXT[code]?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

function resolveControlFamily(code: B5SourceCode): B5ControlFamily {
  if (
    code === "5.5" ||
    code === "5.9" ||
    code === "5.10" ||
    code === "5.11" ||
    code === "5.12" ||
    code === "5.14b"
  ) {
    return "multi_choice";
  }
  if (code === "5.A" || code === "5.B" || code === "5.C") return "clarification";
  if (code === "5.3") return "derived_display";
  return "single_choice";
}

function freeTextWhen(code: B5SourceCode): string | null {
  const options = B5_MADRE_OPTIONS[code];
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

type SlotBuildOptions = {
  dimension: B5InheritedDimension;
  useTimeScaleForCapacity?: boolean;
};

function toSlot(
  code: B5SourceCode,
  build: SlotBuildOptions,
): B5SlotPresentation {
  const control = resolveControlFamily(code);
  const isClarification = code === "5.A" || code === "5.B" || code === "5.C";
  const isDerived = code === "5.3";
  const ft = freeTextWhen(code);
  const alwaysVisible = (B5_BASE_SOURCE_CODES as readonly string[]).includes(code);

  let options = B5_MADRE_OPTIONS[code];
  if (
    build.useTimeScaleForCapacity &&
    (code === "5.1" || code === "5.2")
  ) {
    options = B5_TIME_SCALE_OPTIONS;
  }

  return {
    field_key: code,
    source_code: code,
    short_ui_label: B5_MADRE_SHORT_LABEL[code],
    question_text: resolveQuestionText(code, build.dimension),
    help_text: presentHelpText(code),
    control_family: control,
    required: alwaysVisible && !isDerived,
    options,
    free_text_when_option_id: ft,
    max_chars: isClarification ? 280 : null,
    band: BAND_BY_CODE[code],
    capture_slot_kind: isClarification
      ? "conditional_clarification"
      : isDerived
        ? "internal_derived"
        : "visible_capture",
    visibility_rule: VISIBILITY_BY_CODE[code],
    matrix_interaction_hint: MATRIX_HINT_BY_CODE[code] ?? null,
    metric_kind_hint:
      code === "5.1" || code === "5.2"
        ? build.useTimeScaleForCapacity
          ? "time_per_object"
          : "volume_stub"
        : null,
  };
}

const DEFAULT_ACTIVITY = {
  area: "Operaciones / Producción",
  activityLiteral:
    "Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas",
  heading: "Actividad seleccionada",
};

export type CreateB5VisualCandidateOptions = {
  activity?: Partial<{
    area: string;
    activityLiteral: string;
    heading: string;
  }>;
  inherited_dimension_dominante?: B5InheritedDimension | null;
};

function uniqueCodes(codes: readonly B5SourceCode[]): B5SourceCode[] {
  return Array.from(new Set(codes));
}

function buildViewModel(
  codes: readonly B5SourceCode[],
  surface: B5PresentationViewModel["presentation_surface"],
  kind: B5PresentationViewModel["presentation_kind"],
  options: CreateB5VisualCandidateOptions = {},
  hints?: {
    matrix_interaction_hint?: string;
    ui_component_hint?: string;
    capacity_metric_kind_hint?: string | null;
    useTimeScaleForCapacity?: boolean;
  },
): B5PresentationViewModel {
  const dimension: B5InheritedDimension =
    options.inherited_dimension_dominante ?? "objeto";
  return {
    presentation_kind: kind,
    presentation_surface: surface,
    block: "5",
    matrix_interaction_hint: hints?.matrix_interaction_hint,
    ui_component_hint: hints?.ui_component_hint,
    inherited_dimension_dominante: dimension,
    capacity_metric_kind_hint: hints?.capacity_metric_kind_hint ?? null,
    slots: uniqueCodes(codes).map((code) =>
      toSlot(code, {
        dimension,
        useTimeScaleForCapacity: hints?.useTimeScaleForCapacity,
      }),
    ),
    activity: {
      area: options.activity?.area ?? DEFAULT_ACTIVITY.area,
      activityLiteral:
        options.activity?.activityLiteral ?? DEFAULT_ACTIVITY.activityLiteral,
      heading: options.activity?.heading ?? DEFAULT_ACTIVITY.heading,
    },
    frame_line: B5_BLOCK_META.frame_line,
  };
}

/** D4 — production visual candidate (always-visible user capture only). */

export function createB5VisualStubViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(
    B5_BASE_SOURCE_CODES,
    "base",
    "visual_candidate",
    options,
    {
      matrix_interaction_hint:
        "B5-Q29|B5-Q30|B5-Q31|B5-Q32|B5-Q33 always-visible spine (shell visual; no binding)",
      ui_component_hint: "official_canvas_b5_instrument",
      capacity_metric_kind_hint: "volume_stub",
    },
  );
}

export const createB5VisualCandidateViewModel = createB5VisualStubViewModel;

/** D5 — REFERENCE: conditional probes (+ base for context). */

export function createB5ConditionalFixtureViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(
    [...B5_BASE_SOURCE_CODES, ...B5_CONDITIONAL_FIXTURE_CODES],
    "conditional_visible",
    "reference_fixture",
    options,
    {
      matrix_interaction_hint: "C15 conditionals 5.13/5.14b (fixture; no branching)",
      ui_component_hint: "official_canvas_b5_instrument",
      capacity_metric_kind_hint: "volume_stub",
    },
  );
}

/** D5 — REFERENCE: clarifications (+ base for context). */

export function createB5ClarificationFixtureViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(
    [...B5_BASE_SOURCE_CODES, ...B5_CLARIFICATION_FIXTURE_CODES],
    "clarification_visible",
    "reference_fixture",
    options,
    {
      matrix_interaction_hint: "5.A/B/C clarifications (fixture; no branching)",
      ui_component_hint: "official_canvas_b5_instrument",
      capacity_metric_kind_hint: "volume_stub",
    },
  );
}

/** D5 — REFERENCE: derived 5.3 display (+ base for context). */

export function createB5DerivedFixtureViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(
    [...B5_BASE_SOURCE_CODES, ...B5_DERIVED_FIXTURE_CODES],
    "derived_visible",
    "reference_fixture",
    options,
    {
      matrix_interaction_hint: "5.3 derived_display (fixture; Runtime calculates)",
      ui_component_hint: "official_canvas_b5_instrument",
      capacity_metric_kind_hint: "volume_stub",
    },
  );
}

/** D5 — REFERENCE: time-scale metric path for 5.1/5.2. */

export function createB5MetricTimeFixtureViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(B5_BASE_SOURCE_CODES, "metric_time_visible", "reference_fixture", options, {
    matrix_interaction_hint:
      "B5-Q29 time_scale path for 5.1/5.2 (fixture; capacity_metric_kind_hint=time_per_object)",
    ui_component_hint: "official_canvas_b5_instrument",
    capacity_metric_kind_hint: "time_per_object",
    useTimeScaleForCapacity: true,
  });
}

/** D5 — REFERENCE: causal pack (conditionals + clarifications + derived). */

export function createB5CausalFixtureViewModel(
  options: CreateB5VisualCandidateOptions = {},
): B5PresentationViewModel {
  return buildViewModel(
    [...B5_BASE_SOURCE_CODES, ...B5_CAUSAL_FIXTURE_CODES],
    "causal_visible",
    "reference_fixture",
    options,
    {
      matrix_interaction_hint:
        "C15 causal pack + 5.3 derived (fixture; no branching)",
      ui_component_hint: "official_canvas_b5_instrument",
      capacity_metric_kind_hint: "volume_stub",
    },
  );
}
