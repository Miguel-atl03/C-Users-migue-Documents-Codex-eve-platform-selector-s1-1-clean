/**
 * Bloque 2 (Transformación) presentation contract for official canvas (UI-B2).
 *
 * Binding-ready structure. Runtime-bound slots may carry server-issued slot_ref;
 * visual/reference fixtures remain keyed by neutral field_key (= Madre source_code).
 * Assistance (help_text) ≠ Runtime authority. No local branching sequencer.
 */

export type B2ControlFamily =
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text"
  | "ranking";

export type B2ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice / multi / complementary / text / ranking stay separable. */
export type B2SlotAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  /** Ordered option_ids for ranking controls. */
  rankedIds?: string[];
  complementaryText?: string;
  text?: string;
};

export type B2BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B2SlotPresentation = {
  field_key: string;
  slot_ref?: string;
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B2ControlFamily;
  required: boolean;
  options?: readonly B2ChoiceOption[];
  free_text_when_option_id?: string | null;
  max_chars?: number | null;
  band: B2BandMeta;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  visibility_rule?: string | null;
  branching_rule?: string | null;
  provenance_type?: string | null;
  epistemic_role?: string | null;
  matrix_interaction_hint?: string | null;
  /** Optional visual cue for 2.5 / 2.6 (same chrome as B1; no alternate layout). */
  state_pole?: "antes" | "despues" | null;
};

export type B2AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible spine (D4 production candidate).
 * *_visible — D5 reference fixtures only (never production preview authority).
 */
export type B2PresentationSurface =
  | "base"
  | "objeto_path_visible"
  | "subject_path_visible"
  | "action_path_visible"
  | "relations_visible"
  | "exception_visible"
  | "clarification_visible"
  | "causal_visible";

export type B2PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B2PresentationSurface;
  block: "2";
  matrix_interaction_hint?: string;
  ui_component_hint?: string;
  slots: readonly B2SlotPresentation[];
  activity: B2AnchoredActivity;
  frame_line: string;
};
