/**
 * Bloque 1 (Disparador) presentation contract for official canvas (UI-B1).
 *
 * Binding-ready structure. Runtime-bound slots may carry server-issued slot_ref;
 * visual/reference fixtures remain keyed by neutral field_key (= Madre source_code).
 * Assistance (help_text) ≠ Runtime authority. No local branching sequencer.
 */

export type B1ControlFamily =
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text";

export type B1ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice / multi / complementary / text stay separable. */
export type B1SlotAnswer = {
  choiceId?: string;
  /** Multi-choice selections (Madre 1.5). */
  choiceIds?: string[];
  complementaryText?: string;
  text?: string;
};

export type B1BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B1SlotPresentation = {
  field_key: string;
  slot_ref?: string;
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B1ControlFamily;
  required: boolean;
  options?: readonly B1ChoiceOption[];
  free_text_when_option_id?: string | null;
  max_chars?: number | null;
  band: B1BandMeta;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  visibility_rule?: string | null;
  branching_rule?: string | null;
  provenance_type?: string | null;
  epistemic_role?: string | null;
  matrix_interaction_hint?: string | null;
};

export type B1AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible capture (1.1–1.7) = production visual candidate.
 * exception_visible / clarification_visible — reference fixtures only.
 */
export type B1PresentationSurface =
  | "base"
  | "exception_visible"
  | "clarification_visible";

export type B1PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B1PresentationSurface;
  block: "1";
  matrix_interaction_hint?: string;
  ui_component_hint?: string;
  slots: readonly B1SlotPresentation[];
  activity: B1AnchoredActivity;
  frame_marquee: readonly string[];
  frame_line: string;
};
