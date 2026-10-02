/**
 * B0.5 / B05 presentation contract for official canvas (UI-B05-R).
 *
 * Binding-ready structure. Runtime-bound slots carry server-issued slot_ref;
 * visual/reference fixtures may omit it and remain keyed by neutral field_key.
 * Assistance (help_text) ≠ Runtime authority.
 */

export type B05ControlFamily =
  | "single_choice"
  | "free_text"
  | "clarification"
  | "choice_plus_text";

export type B05ChoiceOption = {
  option_id: string;
  option_label: string;
};

/** Human capture only — choice and complementary text stay separable. */
export type B05SlotAnswer = {
  choiceId?: string;
  /** Complementary text for "Otro" / hybrid; never merges into choiceId. */
  complementaryText?: string;
  /** Free-text / clarification body. */
  text?: string;
};

export type B05BandMeta = {
  id: string;
  kicker: string;
  guide: string;
};

export type B05SlotPresentation = {
  /**
   * Neutral presentational field identity (Madre source_code).
   * Future binding maps this to server-issued slot_ref — not a Runtime id.
   */
  field_key: string;
  /** Opaque server-issued Runtime identity. UI returns this on answer when present. */
  slot_ref?: string;
  /** Madre source_code — presentation / QA grouping. */
  source_code: string;
  short_ui_label: string;
  question_text: string;
  help_text: string | null;
  control_family: B05ControlFamily;
  required: boolean;
  options?: readonly B05ChoiceOption[];
  answer_mode?: string;
  required_rule?: string | null;
  visibility_rule?: string | null;
  branching_rule?: string | null;
  provenance_type?: string | null;
  epistemic_role?: string | null;
  policy_class?: string | null;
  derivation_status?: string | null;
  /** When set, that option_id reveals complementary text (Madre "Otro"). */
  free_text_when_option_id?: string | null;
  band: B05BandMeta;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  /** Dyad role for 0.5.1 / 0.5.1a — independent fields, shared cognitive unit. */
  dyad_role?: "benefit" | "harm" | null;
};

export type B05AnchoredActivity = {
  area: string;
  activityLiteral: string;
  heading?: string;
};

/**
 * base — Madre always-visible capture shell (production visual candidate).
 * clarification_visible / causal_visible — reference/test presentation only.
 */
export type B05PresentationSurface =
  | "base"
  | "clarification_visible"
  | "causal_visible";

export type B05PresentationViewModel = {
  presentation_kind: "visual_candidate" | "reference_fixture" | "runtime_bound";
  presentation_surface: B05PresentationSurface;
  block: "0.5";
  /** Optional matrix interaction label for QA only — not Runtime authority. */
  matrix_interaction_hint?: string;
  visible_text?: string;
  ui_component_hint?: string;
  slots: readonly B05SlotPresentation[];
  activity: B05AnchoredActivity;
  frame_marquee: readonly string[];
  frame_line: string;
};
