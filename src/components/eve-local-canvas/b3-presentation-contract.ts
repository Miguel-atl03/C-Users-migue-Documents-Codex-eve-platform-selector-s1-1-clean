/**
 * Bloque 3 (Salida) presentation contract for official canvas (UI-B3).
 *
 * Binding-ready structure. Runtime-bound slots may carry server-issued slot_ref;
 * visual/reference fixtures remain keyed by neutral field_key (= Madre source_code).
 * Assistance (help_text) ≠ Runtime authority. No local branching sequencer.
 *
 * Cross-block: Madre couples B3 after B2. Upstream assembly includes B0.5, but
 * continuity/show-hide across blocks is X4/Runtime — not this UI wave.
 */

export type B3ControlFamily =
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text"
  | "ranking";

export type B3ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice / multi / complementary / text stay separable. */
export type B3SlotAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  /** Present for shell parity with Instrumento ranking control (unused in B3 Madre). */
  rankedIds?: string[];
  complementaryText?: string;
  text?: string;
};

export type B3BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B3SlotPresentation = {
  field_key: string;
  slot_ref?: string;
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B3ControlFamily;
  required: boolean;
  options?: readonly B3ChoiceOption[];
  free_text_when_option_id?: string | null;
  max_chars?: number | null;
  band: B3BandMeta;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  visibility_rule?: string | null;
  branching_rule?: string | null;
  depends_on?: string | null;
  matrix_interaction_hint?: string | null;
};

export type B3AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible spine (D4 production candidate).
 * *_visible — D5 reference fixtures only (never production preview authority).
 */
export type B3PresentationSurface =
  | "base"
  | "exception_visible"
  | "feedback_visible"
  | "clarification_visible"
  | "causal_visible";

export type B3PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B3PresentationSurface;
  block: "3";
  matrix_interaction_hint?: string;
  ui_component_hint?: string;
  slots: readonly B3SlotPresentation[];
  activity: B3AnchoredActivity;
  frame_line: string;
};
