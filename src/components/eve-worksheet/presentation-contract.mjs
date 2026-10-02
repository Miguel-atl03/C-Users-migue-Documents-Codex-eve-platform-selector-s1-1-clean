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

  /** @type {Array<{slot_ref:string,name:string,label?:string,required:boolean,type?:string,answer_mode?:string,options?:Array<{option_id:string,option_label:string}>,source_code?:string,help_text?:string,capture_slot_kind?:string,required_rule?:string|null,visibility_rule?:string|null,branching_rule?:string|null,provenance_type?:string|null,epistemic_role?:string|null,policy_class?:string|null,derivation_status?:string|null}>} */
  const slots = [];
  for (const sub of subfields) {
    const field = /** @type {Record<string, unknown>} */ (sub ?? {});
    if (typeof field.name !== "string" || !field.name.trim()) {
      return {
        status: "blocked_runtime_slot_ref_contract",
        reason: "subfield.name missing — cannot form server-issued slot_ref",
      };
    }
    const slotOptions = Array.isArray(field.options)
      ? field.options
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
    slots.push({
      slot_ref: field.name,
      name: field.name,
      label: typeof field.label === "string" ? field.label : undefined,
      required: field.required === true,
      type: typeof field.type === "string" ? field.type : undefined,
      answer_mode: typeof field.answer_mode === "string" ? field.answer_mode : undefined,
      options: slotOptions && slotOptions.length > 0 ? slotOptions : undefined,
      source_code: typeof field.source_code === "string" ? field.source_code : undefined,
      help_text: typeof field.help_text === "string" ? field.help_text : undefined,
      capture_slot_kind:
        typeof field.capture_slot_kind === "string" ? field.capture_slot_kind : undefined,
      required_rule: typeof field.required_rule === "string" ? field.required_rule : null,
      visibility_rule: typeof field.visibility_rule === "string" ? field.visibility_rule : null,
      branching_rule: typeof field.branching_rule === "string" ? field.branching_rule : null,
      provenance_type: typeof field.provenance_type === "string" ? field.provenance_type : null,
      epistemic_role: typeof field.epistemic_role === "string" ? field.epistemic_role : null,
      policy_class: typeof field.policy_class === "string" ? field.policy_class : null,
      derivation_status:
        typeof field.derivation_status === "string" ? field.derivation_status : null,
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
