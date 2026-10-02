/**
 * Bloque 5 (Capacidad y discrecionalidad) presentation contract
 * for official canvas (UI-B5).
 *
 * Binding-ready structure. Runtime-bound slots may carry server-issued slot_ref;
 * visual/reference fixtures remain keyed by neutral field_key (= Madre source_code).
 * Assistance (help_text) ≠ Runtime authority. No local branching sequencer.
 *
 * Cross-block: Madre places B5 after B4 and before B6; inherits dimension_dominante
 * from B2. Continuity/show-hide across blocks is X4/Runtime — not this UI wave.
 */

export type B5ControlFamily =
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text"
  | "derived_display";

export type B5ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice / multi / complementary / text stay separable. */
export type B5SlotAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  complementaryText?: string;
  text?: string;
  /** Optional unit for dynamic number_with_unit (X4 may supply). */
  unit?: string;
};

export type B5BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B5SlotPresentation = {
  field_key: string;
  slot_ref?: string;
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B5ControlFamily;
  required: boolean;
  options?: readonly B5ChoiceOption[];
  free_text_when_option_id?: string | null;
  max_chars?: number | null;
  band: B5BandMeta;
  capture_slot_kind:
    | "visible_capture"
    | "conditional_clarification"
    | "internal_derived";
  visibility_rule?: string | null;
  branching_rule?: string | null;
  depends_on?: string | null;
  matrix_interaction_hint?: string | null;
  /** Metric path stub for 5.1/5.2 dynamic presentation. */
  metric_kind_hint?: string | null;
};

export type B5AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible spine (D4 production candidate).
 * *_visible — D5 reference fixtures only (never production preview authority).
 */
export type B5PresentationSurface =
  | "base"
  | "metric_time_visible"
  | "conditional_visible"
  | "clarification_visible"
  | "derived_visible"
  | "causal_visible";

export type B5PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B5PresentationSurface;
  block: "5";
  matrix_interaction_hint?: string;
  ui_component_hint?: string;
  /** Stub inheritance from B2 (Runtime will supply). */
  inherited_dimension_dominante?: "objeto" | "sujeto" | "accion" | null;
  capacity_metric_kind_hint?: string | null;
  slots: readonly B5SlotPresentation[];
  activity: B5AnchoredActivity;
  frame_line: string;
};
