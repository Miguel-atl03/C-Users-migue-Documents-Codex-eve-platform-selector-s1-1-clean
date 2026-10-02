/**
 * Bloque 4 (Cadena causal y normalización del flujo) presentation contract
 * for official canvas (UI-B4).
 *
 * Binding-ready structure. Runtime-bound slots may carry server-issued slot_ref;
 * visual/reference fixtures remain keyed by neutral field_key (= Madre source_code).
 * Assistance (help_text) ≠ Runtime authority. No local branching sequencer.
 *
 * Cross-block: Madre places B4 after B3 and before B5. Continuity/show-hide
 * across blocks is X4/Runtime — not this UI wave.
 */

export type B4ControlFamily =
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text";

export type B4ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice / multi / complementary / text stay separable. */
export type B4SlotAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  complementaryText?: string;
  text?: string;
};

export type B4BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B4SlotPresentation = {
  field_key: string;
  slot_ref?: string;
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B4ControlFamily;
  required: boolean;
  options?: readonly B4ChoiceOption[];
  free_text_when_option_id?: string | null;
  max_chars?: number | null;
  band: B4BandMeta;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  visibility_rule?: string | null;
  branching_rule?: string | null;
  depends_on?: string | null;
  matrix_interaction_hint?: string | null;
};

export type B4AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible spine (D4 production candidate).
 * *_visible — D5 reference fixtures only (never production preview authority).
 */
export type B4PresentationSurface =
  | "base"
  | "conditional_visible"
  | "clarification_visible"
  | "causal_visible";

export type B4PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B4PresentationSurface;
  block: "4";
  matrix_interaction_hint?: string;
  ui_component_hint?: string;
  slots: readonly B4SlotPresentation[];
  activity: B4AnchoredActivity;
  frame_line: string;
};