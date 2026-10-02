/**
 * Runtime presentation mapper (JS source of truth for tests + TS re-export).
 * slot_ref = opaque server-issued identity from subfields[].name (literal).
 * Does not invent presentation kinds from question text.
 */

/**
 * @param {unknown} raw
 */
export function mapServerViewModelToPresentation(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "view_model missing",
    };
  }

  const vm = /** @type {Record<string, unknown>} */ (raw);
  if (typeof vm.runtime_interaction_id !== "string" || !vm.runtime_interaction_id.trim()) {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "runtime_interaction_id missing",
    };
  }

  const subfields = Array.isArray(vm.subfields) ? vm.subfields : [];
  if (subfields.length === 0) {
    return {
      status: "blocked_runtime_slot_ref_contract",
      reason: "subfields empty — no opaque slot identity available",
    };
  }

  /** @type {Array<{slot_ref:string,name:string,label?:string,required:boolean,type?:string}>} */
  const slots = [];
  for (const sub of subfields) {
    const field = /** @type {Record<string, unknown>} */ (sub ?? {});
    if (typeof field.name !== "string" || !field.name.trim()) {
      return {
        status: "blocked_runtime_slot_ref_contract",
        reason: "subfield.name missing — cannot form server-issued slot_ref",
      };
    }
    slots.push({
      slot_ref: field.name,
      name: field.name,
      label: typeof field.label === "string" ? field.label : undefined,
      required: field.required === true,
      type: typeof field.type === "string" ? field.type : undefined,
    });
  }

  const choiceView =
    vm.choice_view && typeof vm.choice_view === "object"
      ? /** @type {{ options?: unknown }} */ (vm.choice_view)
      : null;
  const choice_options = Array.isArray(choiceView?.options)
    ? choiceView.options
        .filter((o) => {
          const opt = /** @type {Record<string, unknown>} */ (o ?? {});
          return (
            typeof opt.option_id === "string" &&
            opt.option_id.trim() &&
            typeof opt.option_label === "string"
          );
        })
        .map((o) => {
          const opt = /** @type {Record<string, unknown>} */ (o);
          return {
            option_id: String(opt.option_id),
            option_label: String(opt.option_label),
          };
        })
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
