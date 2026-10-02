/**
 * Client presentation contract for Runtime FULL ViewModels.
 * Does not invent presentation_kind from question text.
 * slot_ref is the opaque server-issued identity (currently Renderer subfields[].name).
 *
 * Keep presentation-contract.mjs in sync (JS twin for node:test).
 */

export type RuntimePresentationSlot = {
  /** Opaque server-issued identity — must be returned as slot_ref on answer. */
  slot_ref: string;
  /** Technical name from server ViewModel (same identity material as slot_ref today). */
  name: string;
  /** Visible label only — never used as identity. */
  label?: string;
  required: boolean;
  /** Optional type metadata if Renderer provided it. */
  type?: string;
};

export type RuntimePresentationOption = {
  option_id: string;
  option_label: string;
};

export type RuntimePresentationViewModel = {
  runtime_interaction_id: string;
  visible_text: string;
  help_text?: string;
  block?: string;
  /** Authorized ui_component from Renderer when present — not inferred from text. */
  ui_component?: string;
  slots: RuntimePresentationSlot[];
  /** Authorized choice options from Renderer choice_view when present. */
  choice_options?: RuntimePresentationOption[];
  /**
   * How the adapter should render controls.
   * - authorized_choice: Renderer provided choice_view.options
   * - fallback_textarea: no richer authorized presentation metadata (dev/adapter fallback)
   */
  presentation_mode: "authorized_choice" | "fallback_textarea";
};

export type MapViewModelResult =
  | { status: "ok"; viewModel: RuntimePresentationViewModel }
  | { status: "blocked_runtime_slot_ref_contract"; reason: string };

type ServerSubfield = {
  name?: unknown;
  label?: unknown;
  required?: unknown;
  type?: unknown;
};

type ServerViewModel = {
  runtime_interaction_id?: unknown;
  visible_text?: unknown;
  help_text?: unknown;
  block?: unknown;
  ui_component?: unknown;
  subfields?: unknown;
  choice_view?: {
    options?: Array<{
      option_id?: unknown;
      option_label?: unknown;
    }>;
  };
};

/**
 * Map BFF/Renderer ViewModel → UI presentation contract.
 * Uses subfields[].name literally as slot_ref (server identity).
 * Does not invent slot_ref from label/index/text.
 */
export function mapServerViewModelToPresentation(
  raw: unknown,
): MapViewModelResult {
  if (!raw || typeof raw !== "object") {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "view_model missing",
    };
  }

  const vm = raw as ServerViewModel;
  if (typeof vm.runtime_interaction_id !== "string" || !vm.runtime_interaction_id.trim()) {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "runtime_interaction_id missing",
    };
  }

  const subfields = Array.isArray(vm.subfields) ? (vm.subfields as ServerSubfield[]) : [];
  if (subfields.length === 0) {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "subfields empty — no opaque slot identity available",
    };
  }

  const slots: RuntimePresentationSlot[] = [];
  for (const sub of subfields) {
    if (typeof sub.name !== "string" || !sub.name.trim()) {
      return {
        status: "blocked_runtime_slot_ref_contract",
        reason: "subfield.name missing — cannot form server-issued slot_ref",
      };
    }
    slots.push({
      slot_ref: sub.name,
      name: sub.name,
      label: typeof sub.label === "string" ? sub.label : undefined,
      required: sub.required === true,
      type: typeof sub.type === "string" ? sub.type : undefined,
    });
  }

  const choice_options =
    vm.choice_view && Array.isArray(vm.choice_view.options)
      ? vm.choice_view.options
          .filter(
            (o) =>
              typeof o?.option_id === "string" &&
              o.option_id.trim() &&
              typeof o?.option_label === "string",
          )
          .map((o) => ({
            option_id: String(o.option_id),
            option_label: String(o.option_label),
          }))
      : undefined;

  const hasAuthorizedChoices = Boolean(choice_options && choice_options.length > 0);

  return {
    status: "ok",
    viewModel: {
      runtime_interaction_id: vm.runtime_interaction_id,
      visible_text:
        typeof vm.visible_text === "string" ? vm.visible_text : "Preparando pregunta…",
      help_text: typeof vm.help_text === "string" ? vm.help_text : undefined,
      block: typeof vm.block === "string" ? vm.block : undefined,
      ui_component: typeof vm.ui_component === "string" ? vm.ui_component : undefined,
      slots,
      choice_options: hasAuthorizedChoices ? choice_options : undefined,
      presentation_mode: hasAuthorizedChoices ? "authorized_choice" : "fallback_textarea",
    },
  };
}
