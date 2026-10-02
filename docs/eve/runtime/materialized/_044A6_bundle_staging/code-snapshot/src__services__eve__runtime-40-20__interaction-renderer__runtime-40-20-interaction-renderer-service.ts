import type {
  RuntimeInteractionBudgetViewContract,
  RuntimeCardComponentLocalContract,
  RuntimeCausalProbeViewContract,
  RuntimeChoiceOptionViewModel,
  RuntimeChoiceViewContract,
  RuntimeBudgetUXContract,
  RuntimeEpistemicUXContract,
  RuntimeHybridChoiceTextViewContract,
  RuntimeInteractionEpistemicViewContract,
  RuntimeInteractionRendererLocalInput,
  RuntimeInteractionRendererLocalResult,
  RuntimeInteractionSourceTraceViewContract,
  RuntimeInteractionViewModel,
  RuntimeMicroconfirmationViewContract,
  RuntimePayloadPreviewConfirmationStatus,
  RuntimePhase6PayloadPreview,
  RuntimeReviewGapViewContract,
  RuntimeForbiddenUserLanguageCheck,
  RuntimeRendererDecision,
  RuntimeRendererNoGoCheck,
  RuntimeRendererNoInferenceBoundary,
  RuntimeRendererStatus,
  RuntimeSourceTraceabilityUXContract,
  RuntimeSubfieldAnswerPreview,
  RuntimeSubfieldViewModel,
  RuntimeUIComponent,
  RuntimeUserVisibleCopyContract,
} from "./runtime-40-20-interaction-renderer-types";
import type {
  RuntimeInteractionDefinitionCandidate,
  RuntimeSubfieldSchemaCandidate,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type { NextInteractionDecision } from "../orchestrator/runtime-40-20-activity-runtime-orchestrator-types";

const ALLOWED_UI_COMPONENTS: RuntimeUIComponent[] = [
  "confirmation_card_with_correction",
  "compound_card",
  "compound_card_with_separable_subfields",
  "guided_textarea_or_choice_plus_text",
  "conditional_probe_card",
  "single_choice",
  "hybrid_choice_text",
  "causal_probe_card",
  "microconfirmation",
  "review_gap_card",
];

const ALLOWED_EPISTEMIC_STATUSES: RuntimeInteractionEpistemicViewContract["allowed_epistemic_statuses"] =
  [
    "captured_user_evidence",
    "ai_inferred_unconfirmed",
    "user_confirmed_suggestion",
    "user_corrected_evidence",
    "canonical_derivation",
    "internal_calculated",
  ];

const REQUIRED_SUBFIELDS: Record<string, string[]> = {
  "B0-Q01": [
    "action_verb",
    "input_or_object",
    "procedure_or_standard",
    "output_or_result",
    "user_correction_note",
  ],
  C09: [
    "feedback_signal_type",
    "feedback_content",
    "operational_effect",
    "route_gap_flag",
  ],
  C11: [
    "awaited_event",
    "release_condition",
    "timer_or_timeout",
    "resolver_owner",
    "exit_path",
  ],
  C20: [
    "preclassification_type",
    "chain_position",
    "crossed_signal",
    "correction_or_manual_review",
  ],
};

const FORBIDDEN_USER_LANGUAGE_TERMS = [
  "MMABP",
  "VSM",
  "AHE",
  "MoC",
  "PF",
  "PM",
  "OLC",
  "recursividad",
  "variedad",
  "diagnostico",
  "diagnóstico",
  "EVE diagnosis",
  "preclasificacion final",
  "preclasificación final",
  "truth final",
  "verdad final",
];

export function createRuntimeInteractionViewModels(
  input: RuntimeInteractionRendererLocalInput,
): RuntimeInteractionRendererLocalResult {
  const blockers = createInputBlockers(input);
  const viewModels: RuntimeInteractionViewModel[] = [];
  const rendererDecisions: RuntimeRendererDecision[] = [];

  if (blockers.length === 0) {
    for (const decision of input.orchestrator_result.next_interaction_decisions) {
      const interactionDefinition = resolveInteractionDefinition(
        decision,
        input.interaction_definitions,
      );

      if (!interactionDefinition) {
        blockers.push("missing_required_interaction_definition");
        rendererDecisions.push(createBlockedDecision(decision));
        continue;
      }

      const viewModel = createInteractionViewModel(
        input,
        decision,
        interactionDefinition,
      );
      viewModels.push(viewModel);
      rendererDecisions.push(createRendererDecision(decision, viewModel));

      if (viewModel.renderer_status.startsWith("blocked_")) {
        blockers.push(viewModel.renderer_status);
      }
    }
  }

  const noGoCheck = createNoGoCheck(blockers);
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    interaction_view_models: viewModels,
    renderer_decisions: rendererDecisions,
    no_go_check: noGoCheck,
    blocked_reason: ok ? undefined : blockers[0],
    materiality: {
      level: "runtime_40_20_interaction_renderer_view_model_local_contract",
      local_only: true,
      ui_rendered_real: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createInputBlockers(input: RuntimeInteractionRendererLocalInput): string[] {
  const blockers: string[] = [];

  if (!input.orchestrator_result.ok) blockers.push("orchestrator_result_not_ok");
  if (input.orchestrator_result.no_go_check.runtime_40_20_started !== false) {
    blockers.push("runtime_40_20_started_forbidden");
  }
  if (input.interaction_definitions.length !== 60) {
    blockers.push("interaction_definition_count_not_60");
  }

  return blockers;
}

function resolveInteractionDefinition(
  decision: NextInteractionDecision,
  interactionDefinitions: RuntimeInteractionDefinitionCandidate[],
): RuntimeInteractionDefinitionCandidate | undefined {
  if (decision.next_interaction_hint === "B0_confirmation") {
    return interactionDefinitions.find(
      (interaction) => interaction.runtime_interaction_id === "B0-Q01",
    );
  }

  if (decision.next_interaction_hint === "requires_semantic_preload") {
    return interactionDefinitions.find(
      (interaction) => interaction.runtime_interaction_id === "B0-Q01",
    );
  }

  return interactionDefinitions.find(
    (interaction) =>
      interaction.runtime_interaction_id === decision.next_interaction_hint,
  );
}

function createInteractionViewModel(
  input: RuntimeInteractionRendererLocalInput,
  decision: NextInteractionDecision,
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeInteractionViewModel {
  const subfieldSchemas = input.subfield_schemas.filter(
    (subfield) =>
      subfield.runtime_interaction_id ===
      interactionDefinition.runtime_interaction_id,
  );
  const subfields = subfieldSchemas.map(createSubfieldViewModel);
  const warnings = getSubfieldWarnings(
    interactionDefinition.runtime_interaction_id,
    subfields,
  );
  const rendererStatus = getRendererStatus(interactionDefinition, subfieldSchemas);
  const sourceTrace = createSourceTrace(interactionDefinition);
  const budget = createBudgetViewContract(interactionDefinition);
  const epistemicPolicy = createEpistemicViewContract(subfieldSchemas);
  const choiceView = createChoiceViewContract(interactionDefinition, subfieldSchemas);
  const userVisibleCopy = createUserVisibleCopyContract(interactionDefinition);
  const forbiddenUserLanguageCheck =
    createForbiddenUserLanguageCheck(interactionDefinition);
  const epistemicUx = createEpistemicUXContract(epistemicPolicy, subfieldSchemas);
  const budgetUx = createBudgetUXContract(interactionDefinition);
  const sourceTraceabilityUx = createSourceTraceabilityUXContract(sourceTrace);
  const noInferenceBoundary = createNoInferenceBoundary();
  const phase6PayloadPreview = createPhase6PayloadPreview(
    interactionDefinition,
    subfields,
    decision.run_plan_id,
  );

  return {
    runtime_interaction_id: interactionDefinition.runtime_interaction_id,
    interaction_instance_id_preview: `${decision.run_plan_id}:${interactionDefinition.runtime_interaction_id}:preview`,
    group: interactionDefinition.interaction_group,
    block: getStringRawValue(interactionDefinition.raw_row, "block"),
    visible_text: interactionDefinition.visible_text,
    ui_component: interactionDefinition.ui_component as RuntimeUIComponent,
    subfields,
    help_text: getStringRawValue(interactionDefinition.raw_row, "help_text"),
    help: {
      help_text: getStringRawValue(interactionDefinition.raw_row, "help_text"),
      help_source: getStringRawValue(interactionDefinition.raw_row, "help_text")
        ? "catalog"
        : "not_present",
    },
    budget,
    epistemic_policy: epistemicPolicy,
    source_codes: sourceTrace.source_codes,
    source_trace: sourceTrace,
    card_component_contract: createCardComponentLocalContract(
      interactionDefinition.ui_component as RuntimeUIComponent,
      subfields,
    ),
    choice_view: choiceView,
    hybrid_choice_text_view: createHybridChoiceTextViewContract(
      interactionDefinition.ui_component as RuntimeUIComponent,
      subfieldSchemas,
      choiceView,
    ),
    causal_probe_view: createCausalProbeViewContract(interactionDefinition),
    microconfirmation_view: createMicroconfirmationViewContract(interactionDefinition),
    review_gap_view: createReviewGapViewContract(interactionDefinition),
    user_visible_copy: userVisibleCopy,
    forbidden_user_language_check: forbiddenUserLanguageCheck,
    epistemic_ux: epistemicUx,
    budget_ux: budgetUx,
    source_traceability_ux: sourceTraceabilityUx,
    no_inference_boundary: noInferenceBoundary,
    phase6_payload_preview: phase6PayloadPreview,
    renderer_status: rendererStatus,
    warnings,
    ui_rendered_real: false,
  };
}

function getRendererStatus(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): RuntimeRendererStatus {
  if (hasInteractionSubstitutionAttempt(interactionDefinition)) {
    return "blocked_interaction_substitution_attempt";
  }
  if (hasUnauthorizedInferenceAttempt(interactionDefinition)) {
    return "blocked_unauthorized_inference_detected";
  }
  if (hasPayloadPreviewBoundaryViolation(interactionDefinition)) {
    return "blocked_payload_preview_boundary_violation";
  }
  if (hasPayloadPreviewUserResponse(interactionDefinition)) {
    return "blocked_payload_preview_contains_user_response";
  }
  if (hasPayloadPreviewEvidenceBoundaryViolation(interactionDefinition)) {
    return "blocked_payload_preview_evidence_boundary_violation";
  }
  if (!interactionDefinition.visible_text) return "blocked_missing_visible_text";
  if (!interactionDefinition.ui_component) return "blocked_missing_ui_component";
  if (!hasSourceTrace(interactionDefinition)) {
    return "blocked_missing_source_traceability";
  }
  if (!ALLOWED_UI_COMPONENTS.includes(interactionDefinition.ui_component as RuntimeUIComponent)) {
    return "manual_review_required_unknown_ui_component";
  }
  if (
    typeof interactionDefinition.counts_as_base !== "boolean" ||
    typeof interactionDefinition.counts_as_causal !== "boolean"
  ) {
    return "manual_review_required_missing_budget_metadata";
  }
  if (!hasExplicitEpistemicPolicy(subfieldSchemas)) {
    return "manual_review_required_missing_epistemic_policy";
  }
  if (!hasExplicitMustNotInferPolicy(subfieldSchemas)) {
    return "manual_review_required_missing_epistemic_policy";
  }
  if (isCausalBudgetExhausted(interactionDefinition)) {
    return "blocked_causal_budget_exhausted";
  }
  if (
    interactionDefinition.ui_component === "single_choice" &&
    getChoiceOptions(interactionDefinition, subfieldSchemas).length === 0
  ) {
    return "blocked_missing_choice_options";
  }
  if (
    interactionDefinition.ui_component === "hybrid_choice_text" &&
    !hasHybridChoiceTextStructure(subfieldSchemas)
  ) {
    return "blocked_missing_hybrid_choice_text_structure";
  }
  if (
    (interactionDefinition.ui_component === "single_choice" ||
      interactionDefinition.ui_component === "hybrid_choice_text") &&
    hasUnknownSelectedOption(interactionDefinition, subfieldSchemas)
  ) {
    return "blocked_unknown_choice_option";
  }
  if (
    interactionDefinition.ui_component === "causal_probe_card" &&
    !hasAuthorizedCausalTrigger(interactionDefinition)
  ) {
    return "blocked_causal_probe_missing_authorized_trigger";
  }
  if (
    interactionDefinition.ui_component === "microconfirmation" &&
    !hasMicroconfirmationSignal(interactionDefinition)
  ) {
    return "blocked_missing_microconfirmation_signal";
  }
  if (
    interactionDefinition.ui_component === "microconfirmation" &&
    !hasMicroconfirmationUserVisibleCopy(interactionDefinition)
  ) {
    return "blocked_missing_user_visible_copy";
  }
  if (
    interactionDefinition.ui_component === "review_gap_card" &&
    !hasReviewGapSource(interactionDefinition)
  ) {
    return "blocked_missing_review_gap_source";
  }
  if (
    interactionDefinition.ui_component === "review_gap_card" &&
    !hasReviewGapUserVisibleCopy(interactionDefinition)
  ) {
    return "blocked_missing_user_visible_copy";
  }
  if (createForbiddenUserLanguageCheck(interactionDefinition).forbidden_terms_detected.length > 0) {
    return "blocked_forbidden_user_language";
  }

  return "render_model_ready";
}

function createSubfieldViewModel(
  subfield: RuntimeSubfieldSchemaCandidate,
): RuntimeSubfieldViewModel {
  return {
    name: subfield.subfield_name,
    label: getStringRawValue(subfield.raw_row, "label"),
    type: getStringRawValue(subfield.raw_row, "type"),
    required: subfield.required,
    value: null,
    source_trace: hasSourceTrace(subfield)
      ? {
          source_document: subfield.source_document,
          source_sheet: subfield.source_sheet,
          source_row_number: subfield.source_row_number,
        }
      : undefined,
  };
}

function getSubfieldWarnings(
  runtimeInteractionId: string,
  subfields: RuntimeSubfieldViewModel[],
): string[] {
  const requiredSubfields = REQUIRED_SUBFIELDS[runtimeInteractionId] ?? [];
  const existingNames = new Set(subfields.map((subfield) => subfield.name));

  return requiredSubfields
    .filter((requiredName) => !existingNames.has(requiredName))
    .map((requiredName) => `missing_required_subfield:${requiredName}`);
}

function createBudgetViewContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeInteractionBudgetViewContract {
  if (interactionDefinition.ui_component === "microconfirmation") {
    return {
      counts_as_visible: true,
      counts_as_causal: false,
      budget_bucket: "microconfirmation_counted",
      base_limit: 40,
      causal_limit: 20,
      budget_consumed_real: false,
    };
  }

  if (interactionDefinition.raw_row.budget_bucket === "internal_no_count") {
    return {
      counts_as_visible: false,
      counts_as_causal: false,
      budget_bucket: "internal_no_count",
      base_limit: 40,
      causal_limit: 20,
      budget_consumed_real: false,
    };
  }

  if (interactionDefinition.interaction_group === "causal") {
    return {
      counts_as_visible: true,
      counts_as_causal: true,
      budget_bucket: "causal_20",
      base_limit: 40,
      causal_limit: 20,
      budget_consumed_real: false,
    };
  }

  return {
    counts_as_visible: true,
    counts_as_causal: false,
    budget_bucket: "base_40",
    base_limit: 40,
    causal_limit: 20,
    budget_consumed_real: false,
  };
}

function createBudgetUXContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeBudgetUXContract {
  const budget = createBudgetViewContract(interactionDefinition);

  return {
    ...budget,
    budget_ledger_real_created: false,
    causal_budget_exhausted: isCausalBudgetExhausted(interactionDefinition),
  };
}

function createEpistemicViewContract(
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): RuntimeInteractionEpistemicViewContract {
  const confirmationPolicy = subfieldSchemas.find(
    (subfield) => subfield.epistemic_policy,
  )?.epistemic_policy;
  const explicitPolicyPresent = Boolean(confirmationPolicy);
  const mustNotInfer = getExplicitMustNotInferPolicy(subfieldSchemas);

  return {
    allowed_epistemic_statuses: ALLOWED_EPISTEMIC_STATUSES,
    explicit_policy_present: explicitPolicyPresent,
    confirmation_policy: confirmationPolicy,
    must_not_infer: mustNotInfer,
  };
}

function createEpistemicUXContract(
  epistemicPolicy: RuntimeInteractionEpistemicViewContract,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): RuntimeEpistemicUXContract {
  return {
    explicit_policy_present: epistemicPolicy.explicit_policy_present,
    confirmation_policy: epistemicPolicy.confirmation_policy,
    must_not_infer: epistemicPolicy.must_not_infer,
    allowed_epistemic_statuses: epistemicPolicy.allowed_epistemic_statuses,
    must_not_infer_explicit: hasExplicitMustNotInferPolicy(subfieldSchemas),
    default_must_not_infer_fabricated: false,
    required_subfields_used_as_must_not_infer: false,
    allowed_epistemic_statuses_vocabulary_only: true,
    ai_inferred_unconfirmed_requires_confirmation: true,
    user_corrected_evidence_overrides_previous_inference: true,
    captured_user_evidence_created_from_ui: false,
    default_policy_fabricated: false,
  };
}

function hasExplicitEpistemicPolicy(
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): boolean {
  return subfieldSchemas.some((subfield) => Boolean(subfield.epistemic_policy));
}

function hasExplicitMustNotInferPolicy(
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): boolean {
  return getExplicitMustNotInferPolicy(subfieldSchemas).length > 0;
}

function getExplicitMustNotInferPolicy(
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): string[] {
  const values = subfieldSchemas.flatMap((subfield) =>
    subfield.epistemic_policy
      ? getStringListRawValue(subfield.raw_row, "must_not_infer")
      : [],
  );

  return Array.from(new Set(values));
}

function isCausalBudgetExhausted(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    (interactionDefinition.counts_as_causal === true ||
      interactionDefinition.ui_component === "causal_probe_card" ||
      interactionDefinition.interaction_group === "causal") &&
    interactionDefinition.raw_row.causal_budget_exhausted === true
  );
}

function createCausalProbeViewContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeCausalProbeViewContract | undefined {
  if (interactionDefinition.ui_component !== "causal_probe_card") return undefined;
  if (!hasAuthorizedCausalTrigger(interactionDefinition)) return undefined;

  return {
    authorized_trigger_ref: getStringRawValue(interactionDefinition.raw_row, "authorized_trigger_ref")!,
    trigger_source_trace: createRawTrace(interactionDefinition, "trigger"),
    target_causal_interaction_id:
      getStringRawValue(interactionDefinition.raw_row, "target_causal_interaction_id") ??
      interactionDefinition.runtime_interaction_id,
    explicit_trigger_authorized: true,
    counts_as_causal: true,
    budget_bucket: "causal_20",
    budget_consumed_real: false,
    branching_engine_consumed: false,
    fuzzy_match_used: false,
    semantic_fallback_used: false,
  };
}

function createMicroconfirmationViewContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeMicroconfirmationViewContract | undefined {
  if (interactionDefinition.ui_component !== "microconfirmation") return undefined;
  if (!hasMicroconfirmationSignal(interactionDefinition)) return undefined;
  if (!hasMicroconfirmationUserVisibleCopy(interactionDefinition)) return undefined;

  return {
    microconfirmation_signal_ref: getStringRawValue(interactionDefinition.raw_row, "microconfirmation_signal_ref")!,
    signal_type: getStringRawValue(interactionDefinition.raw_row, "signal_type")!,
    signal_source_trace: createRawTrace(interactionDefinition, "signal"),
    confidence_level: getConfidenceLevel(interactionDefinition.raw_row.confidence_level),
    confirmation_prompt_text: getStringRawValue(interactionDefinition.raw_row, "confirmation_prompt_text")!,
    correction_allowed: true,
    diagnosis_created: false,
    ir_created: false,
    registry_created: false,
    evidence_item_real_created: false,
    response_ingest_executed: false,
  };
}

function createReviewGapViewContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeReviewGapViewContract | undefined {
  if (interactionDefinition.ui_component !== "review_gap_card") return undefined;
  if (!hasReviewGapSource(interactionDefinition)) return undefined;
  if (!hasReviewGapUserVisibleCopy(interactionDefinition)) return undefined;

  return {
    gap_ref: getStringRawValue(interactionDefinition.raw_row, "gap_ref")!,
    gap_type: getStringRawValue(interactionDefinition.raw_row, "gap_type")!,
    gap_label: getStringRawValue(interactionDefinition.raw_row, "gap_label")!,
    gap_explanation: getStringRawValue(interactionDefinition.raw_row, "gap_explanation")!,
    required_user_action: getStringRawValue(interactionDefinition.raw_row, "required_user_action")!,
    gap_source_trace: createRawTrace(interactionDefinition, "gap"),
    manual_review_resolved: false,
    readiness_decision_real_created: false,
    export_preview_created: false,
  };
}

function hasAuthorizedCausalTrigger(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    interactionDefinition.raw_row.explicit_trigger_authorized === true &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "authorized_trigger_ref")) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "target_causal_interaction_id")) &&
    hasRawTrace(interactionDefinition, "trigger")
  );
}

function hasMicroconfirmationSignal(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    Boolean(getStringRawValue(interactionDefinition.raw_row, "microconfirmation_signal_ref")) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "signal_type")) &&
    hasRawTrace(interactionDefinition, "signal")
  );
}

function hasReviewGapSource(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    Boolean(getStringRawValue(interactionDefinition.raw_row, "gap_ref")) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "gap_type")) &&
    hasRawTrace(interactionDefinition, "gap")
  );
}

function hasMicroconfirmationUserVisibleCopy(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return Boolean(getStringRawValue(interactionDefinition.raw_row, "confirmation_prompt_text"));
}

function hasReviewGapUserVisibleCopy(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    Boolean(getStringRawValue(interactionDefinition.raw_row, "gap_label")) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "gap_explanation")) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, "required_user_action"))
  );
}

function createUserVisibleCopyContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeUserVisibleCopyContract {
  return {
    activity_label: getStringRawValue(interactionDefinition.raw_row, "activity_label"),
    object_or_input_label: getStringRawValue(interactionDefinition.raw_row, "object_or_input_label"),
    output_or_result_label: getStringRawValue(interactionDefinition.raw_row, "output_or_result_label"),
    procedure_or_rule_label: getStringRawValue(interactionDefinition.raw_row, "procedure_or_rule_label"),
    context_note: getStringRawValue(interactionDefinition.raw_row, "context_note"),
    confirmation_prompt_text: getStringRawValue(interactionDefinition.raw_row, "confirmation_prompt_text"),
    correction_prompt_text: getStringRawValue(interactionDefinition.raw_row, "correction_prompt_text"),
    help_text: getStringRawValue(interactionDefinition.raw_row, "help_text"),
    required_user_action: getStringRawValue(interactionDefinition.raw_row, "required_user_action"),
    methodology_terms_hidden: true,
    source_trace_hidden_from_user: true,
  };
}

function createForbiddenUserLanguageCheck(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeForbiddenUserLanguageCheck {
  const visibleValues = [
    interactionDefinition.visible_text,
    getStringRawValue(interactionDefinition.raw_row, "help_text"),
    getStringRawValue(interactionDefinition.raw_row, "activity_label"),
    getStringRawValue(interactionDefinition.raw_row, "object_or_input_label"),
    getStringRawValue(interactionDefinition.raw_row, "output_or_result_label"),
    getStringRawValue(interactionDefinition.raw_row, "procedure_or_rule_label"),
    getStringRawValue(interactionDefinition.raw_row, "context_note"),
    getStringRawValue(interactionDefinition.raw_row, "confirmation_prompt_text"),
    getStringRawValue(interactionDefinition.raw_row, "correction_prompt_text"),
    getStringRawValue(interactionDefinition.raw_row, "gap_label"),
    getStringRawValue(interactionDefinition.raw_row, "gap_explanation"),
    getStringRawValue(interactionDefinition.raw_row, "required_user_action"),
  ].filter((value): value is string => Boolean(value));
  const detected = FORBIDDEN_USER_LANGUAGE_TERMS.filter((term) =>
    visibleValues.some((value) => containsForbiddenTerm(value, term)),
  );

  return {
    forbidden_terms_checked: true,
    forbidden_terms_detected: Array.from(new Set(detected)),
    user_visible_copy_allowed: detected.length === 0,
  };
}

function containsForbiddenTerm(value: string, term: string): boolean {
  const normalizedValue = normalizeForForbiddenLanguage(value);
  const normalizedTerm = normalizeForForbiddenLanguage(term);
  if (!normalizedValue.includes(normalizedTerm)) return false;

  // Catalog-authorized non-diagnostic wording must not self-block
  // (e.g. C20: "sin emitir diagnóstico").
  const negationWindows = [
    `sin emitir ${normalizedTerm}`,
    `sin ${normalizedTerm}`,
    `no emitir ${normalizedTerm}`,
    `no produce ${normalizedTerm}`,
    `sin producir ${normalizedTerm}`,
    `non ${normalizedTerm}`,
    `no ${normalizedTerm}`,
  ];
  if (negationWindows.some((w) => normalizedValue.includes(w))) {
    return false;
  }
  return true;
}

function normalizeForForbiddenLanguage(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasRawTrace(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  prefix: "trigger" | "signal" | "gap",
): boolean {
  return (
    Boolean(getStringRawValue(interactionDefinition.raw_row, `${prefix}_source_document`)) &&
    Boolean(getStringRawValue(interactionDefinition.raw_row, `${prefix}_source_sheet`)) &&
    typeof interactionDefinition.raw_row[`${prefix}_source_row_number`] === "number"
  );
}

function createRawTrace(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  prefix: "trigger" | "signal" | "gap",
): { source_document: string; source_sheet: string; source_row_number: number } {
  return {
    source_document: getStringRawValue(interactionDefinition.raw_row, `${prefix}_source_document`)!,
    source_sheet: getStringRawValue(interactionDefinition.raw_row, `${prefix}_source_sheet`)!,
    source_row_number: interactionDefinition.raw_row[
      `${prefix}_source_row_number`
    ] as number,
  };
}

function getConfidenceLevel(input: unknown): "low" | "medium" | "high" {
  return input === "low" || input === "medium" || input === "high"
    ? input
    : "low";
}

function createSourceTrace(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimeInteractionSourceTraceViewContract {
  return {
    source_document: interactionDefinition.source_document,
    source_sheet: interactionDefinition.source_sheet,
    source_row_number: interactionDefinition.source_row_number,
    raw_row: interactionDefinition.raw_row,
    source_codes: [
      getStringRawValue(interactionDefinition.raw_row, "source_code"),
      getStringRawValue(interactionDefinition.raw_row, "source_question_code"),
    ].filter((value): value is string => Boolean(value)),
    source_refs: interactionDefinition.source_refs,
  };
}

function createSourceTraceabilityUXContract(
  sourceTrace: RuntimeInteractionSourceTraceViewContract,
): RuntimeSourceTraceabilityUXContract {
  return {
    source_document: sourceTrace.source_document,
    source_sheet: sourceTrace.source_sheet,
    source_row_number: sourceTrace.source_row_number,
    raw_row: sourceTrace.raw_row,
    source_codes: sourceTrace.source_codes,
    source_refs: sourceTrace.source_refs,
    source_node_ref: getStringRawValue(sourceTrace.raw_row, "source_node_ref"),
    source_trace_hidden_from_user: true,
    interaction_substitution_used: false,
    fuzzy_source_match_used: false,
    semantic_fallback_used: false,
  };
}

function createNoInferenceBoundary(): RuntimeRendererNoInferenceBoundary {
  return {
    b0q01_fallback_to_b0_used: false,
    b0q01_fallback_to_b1_used: false,
    interaction_substitution_used: false,
    visible_text_fabricated: false,
    ui_component_fabricated: false,
    subfields_fabricated: false,
    epistemic_policy_fabricated: false,
    must_not_infer_fabricated: false,
    confirmation_policy_fabricated: false,
    choice_options_fabricated: false,
    causal_trigger_fabricated: false,
    review_gap_fabricated: false,
    microconfirmation_signal_fabricated: false,
    free_inference_used: false,
    semantic_fallback_used: false,
    fuzzy_match_used: false,
  };
}

function createPhase6PayloadPreview(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  subfields: RuntimeSubfieldViewModel[],
  runPlanId: string,
): RuntimePhase6PayloadPreview {
  const answersPreview = subfields.map(createSubfieldAnswerPreview);

  return {
    interaction_id: interactionDefinition.runtime_interaction_id,
    interaction_instance_id_preview: `${runPlanId}:${interactionDefinition.runtime_interaction_id}:preview`,
    answers_preview: answersPreview,
    subfield_answers_preview: answersPreview.map((answer) => ({ ...answer })),
    confirmation_status_preview:
      getPayloadPreviewConfirmationStatus(interactionDefinition),
    idempotency_key_preview: `${runPlanId}:${interactionDefinition.runtime_interaction_id}:payload_preview`,
    payload_preview_created: true,
    response_ingest_executed: false,
    response_persisted_real: false,
    runtime_subfield_response_real_created: false,
    evidence_item_real_created: false,
    canonical_variable_record_real_created: false,
  };
}

function createSubfieldAnswerPreview(
  subfield: RuntimeSubfieldViewModel,
): RuntimeSubfieldAnswerPreview {
  return {
    subfield_name: subfield.name,
    expected_type: subfield.type,
    required: subfield.required,
    value: null,
    response_persisted_real: false,
  };
}

function getPayloadPreviewConfirmationStatus(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): RuntimePayloadPreviewConfirmationStatus {
  if (interactionDefinition.raw_row.requires_correction === true) {
    return "pending_correction";
  }
  if (
    interactionDefinition.ui_component === "confirmation_card_with_correction" ||
    interactionDefinition.ui_component === "microconfirmation"
  ) {
    return "pending_confirmation";
  }
  return "not_applicable";
}

function hasInteractionSubstitutionAttempt(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    interactionDefinition.raw_row.b0q01_fallback_to_b0_used === true ||
    interactionDefinition.raw_row.b0q01_fallback_to_b1_used === true ||
    interactionDefinition.raw_row.interaction_substitution_used === true
  );
}

function hasUnauthorizedInferenceAttempt(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return [
    "visible_text_fabricated",
    "ui_component_fabricated",
    "subfields_fabricated",
    "epistemic_policy_fabricated",
    "must_not_infer_fabricated",
    "confirmation_policy_fabricated",
    "choice_options_fabricated",
    "causal_trigger_fabricated",
    "review_gap_fabricated",
    "microconfirmation_signal_fabricated",
    "free_inference_used",
    "semantic_fallback_used",
    "fuzzy_match_used",
  ].some((key) => interactionDefinition.raw_row[key] === true);
}

function hasPayloadPreviewBoundaryViolation(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return interactionDefinition.raw_row.payload_preview_boundary_violation === true;
}

function hasPayloadPreviewUserResponse(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    interactionDefinition.raw_row.payload_preview_contains_user_response === true ||
    interactionDefinition.raw_row.payload_preview_user_value !== undefined
  );
}

function hasPayloadPreviewEvidenceBoundaryViolation(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
): boolean {
  return (
    interactionDefinition.raw_row.payload_preview_evidence_boundary_violation === true ||
    interactionDefinition.raw_row.evidence_item_real_created === true ||
    interactionDefinition.raw_row.canonical_variable_record_real_created === true
  );
}

function createRendererDecision(
  decision: NextInteractionDecision,
  viewModel: RuntimeInteractionViewModel,
): RuntimeRendererDecision {
  return {
    decision_id: `${decision.run_plan_id}:${viewModel.runtime_interaction_id}:renderer_decision`,
    run_plan_id: decision.run_plan_id,
    runtime_interaction_id: viewModel.runtime_interaction_id,
    renderer_status: viewModel.renderer_status,
    next_interaction_hint: decision.next_interaction_hint,
    source_traceability_preserved:
      viewModel.renderer_status !== "blocked_missing_source_traceability",
    free_inference_used: false,
    fallback_interaction_used: false,
    epistemic_policy_inferred: false,
    ui_rendered_real: false,
  };
}

function createBlockedDecision(decision: NextInteractionDecision): RuntimeRendererDecision {
  return {
    decision_id: `${decision.run_plan_id}:missing_renderer_source`,
    run_plan_id: decision.run_plan_id,
    runtime_interaction_id: "missing",
    renderer_status: "blocked_missing_renderer_source",
    next_interaction_hint: decision.next_interaction_hint,
    source_traceability_preserved: false,
    free_inference_used: false,
    fallback_interaction_used: false,
    epistemic_policy_inferred: false,
    ui_rendered_real: false,
  };
}

function createNoGoCheck(blockers: string[]): RuntimeRendererNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    ui_rendered_real: false,
    response_ingest_executed: false,
    runtime_subfield_response_real_created: false,
    captured_user_evidence_created: false,
    response_persisted_real: false,
    evidence_item_real_created: false,
    canonical_variable_record_real_created: false,
    branching_engine_consumed: false,
    readiness_engine_consumed: false,
    branching_real_created: false,
    readiness_real_created: false,
    export_real_created: false,
    real_runtime_records_created: false,
    real_interaction_instances_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
  };
}

function createCardComponentLocalContract(
  component: RuntimeUIComponent,
  subfields: RuntimeSubfieldViewModel[],
): RuntimeCardComponentLocalContract | undefined {
  const semanticSubfields = subfields.map((subfield) => subfield.name);

  if (component === "confirmation_card_with_correction") {
    return {
      component,
      local_actions: ["confirm", "correct"],
      semantic_subfields_preserved: semanticSubfields,
      multiple_subfields_preserved: subfields.length > 1,
      subfields_collapsed_to_free_text: false,
      captured_user_evidence_created: false,
      runtime_subfield_response_real_created: false,
      response_persisted_real: false,
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
    };
  }

  if (component === "compound_card") {
    return {
      component,
      local_actions: [],
      semantic_subfields_preserved: semanticSubfields,
      multiple_subfields_preserved: subfields.length > 1,
      subfields_collapsed_to_free_text: false,
      captured_user_evidence_created: false,
      runtime_subfield_response_real_created: false,
      response_persisted_real: false,
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
    };
  }

  // FULL catalog-native components (immutable catalog vocabulary).
  if (
    component === "compound_card_with_separable_subfields" ||
    component === "guided_textarea_or_choice_plus_text" ||
    component === "conditional_probe_card"
  ) {
    return {
      component,
      local_actions:
        component === "conditional_probe_card" ? ["probe", "defer"] : [],
      semantic_subfields_preserved: semanticSubfields,
      multiple_subfields_preserved: subfields.length > 1,
      subfields_collapsed_to_free_text: false,
      captured_user_evidence_created: false,
      runtime_subfield_response_real_created: false,
      response_persisted_real: false,
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
    };
  }

  return undefined;
}

function createChoiceViewContract(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): RuntimeChoiceViewContract | undefined {
  if (
    interactionDefinition.ui_component !== "single_choice" &&
    interactionDefinition.ui_component !== "hybrid_choice_text"
  ) {
    return undefined;
  }

  return {
    options: getChoiceOptions(interactionDefinition, subfieldSchemas),
    selected_value: null,
    unknown_option_allowed: false,
    option_inferred: false,
  };
}

function createHybridChoiceTextViewContract(
  component: RuntimeUIComponent,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
  choiceView: RuntimeChoiceViewContract | undefined,
): RuntimeHybridChoiceTextViewContract | undefined {
  if (component !== "hybrid_choice_text" || !choiceView) return undefined;

  const choiceSubfield = subfieldSchemas.find(
    (subfield) => subfield.raw_row?.hybrid_part === "choice",
  );
  const freeTextSubfield = subfieldSchemas.find(
    (subfield) => subfield.raw_row?.hybrid_part === "free_text",
  );

  if (!choiceSubfield || !freeTextSubfield) return undefined;

  return {
    choice_subfield_name: choiceSubfield.subfield_name,
    free_text_subfield_name: freeTextSubfield.subfield_name,
    choice: choiceView,
    free_text_value: null,
    choice_and_text_merged: false,
    canonical_variable_inferred_from_text: false,
    evidence_created_from_text: false,
  };
}

function getChoiceOptions(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): RuntimeChoiceOptionViewModel[] {
  const choiceSource =
    subfieldSchemas.find((subfield) => Array.isArray(subfield.raw_row?.choice_options))
      ?.raw_row?.choice_options ?? interactionDefinition.raw_row.choice_options;

  if (!Array.isArray(choiceSource)) return [];

  return choiceSource
    .map((option) => createChoiceOption(option))
    .filter((option): option is RuntimeChoiceOptionViewModel => Boolean(option));
}

function createChoiceOption(input: unknown): RuntimeChoiceOptionViewModel | undefined {
  if (!input || typeof input !== "object") return undefined;

  const option = input as Record<string, unknown>;
  if (
    typeof option.option_id !== "string" ||
    typeof option.option_label !== "string" ||
    typeof option.normalized_code !== "string" ||
    typeof option.source_document !== "string" ||
    typeof option.source_sheet !== "string" ||
    typeof option.source_row_number !== "number"
  ) {
    return undefined;
  }

  return {
    option_id: option.option_id,
    option_label: option.option_label,
    normalized_code: option.normalized_code,
    selected: false,
    disabled: option.disabled === true,
    source_trace: {
      source_document: option.source_document,
      source_sheet: option.source_sheet,
      source_row_number: option.source_row_number,
    },
  };
}

function hasHybridChoiceTextStructure(
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): boolean {
  return (
    subfieldSchemas.some((subfield) => subfield.raw_row?.hybrid_part === "choice") &&
    subfieldSchemas.some((subfield) => subfield.raw_row?.hybrid_part === "free_text")
  );
}

function hasUnknownSelectedOption(
  interactionDefinition: RuntimeInteractionDefinitionCandidate,
  subfieldSchemas: RuntimeSubfieldSchemaCandidate[],
): boolean {
  const selectedCandidate = getStringRawValue(interactionDefinition.raw_row, "selected_value");
  if (!selectedCandidate) return false;

  return !getChoiceOptions(interactionDefinition, subfieldSchemas).some(
    (option) => option.option_id === selectedCandidate,
  );
}

function hasSourceTrace(input: {
  source_document?: string;
  source_sheet?: string;
  source_row_number?: number;
  raw_row?: Record<string, unknown>;
}): input is {
  source_document: string;
  source_sheet: string;
  source_row_number: number;
  raw_row: Record<string, unknown>;
} {
  return Boolean(
    input.source_document &&
      input.source_sheet &&
      typeof input.source_row_number === "number" &&
      input.raw_row,
  );
}

function getStringRawValue(
  rawRow: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = rawRow?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getStringListRawValue(
  rawRow: Record<string, unknown> | undefined,
  key: string,
): string[] {
  const value = rawRow?.[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}
