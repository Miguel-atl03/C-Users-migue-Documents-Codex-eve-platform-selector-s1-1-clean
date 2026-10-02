import type { RuntimeInteractionViewModel } from "@/domain/runtime-interaction-view-model";

const BASE_COLUMNS = [
  "runtime_interaction_id",
  "interaction_group",
  "block",
  "runtime_order",
  "function",
  "visible_text_v1_1",
  "source_nodes",
  "source_codes",
  "ui_component",
  "subfield_structure",
  "canonical_variables",
  "required_variables",
  "optional_variables",
  "derived_variables",
  "readiness_effect",
] as const;

const UX_COLUMNS = [
  "runtime_interaction_id",
  "ui_component",
  "subfield_structure",
  "display_rule",
  "storage_rule",
  "risk_if_single_textbox",
] as const;

const CANONICAL_COLUMNS = [
  "runtime_interaction_id",
  "block",
  "source_codes",
  "canonical_variables",
  "required_variables",
  "optional_variables",
  "derived_variables",
  "route_or_gate",
] as const;

export const RUNTIME_BLOCK0_CATALOG_SNAPSHOT = [
  {
    runtimeInteractionId: "B0-Q01",
    sourceRuntimeInteractionId: "B0-Q01",
    interactionGroup: "base",
    block: "0",
    runtimeOrder: 1,
    questionText:
      "Esto es lo que entendimos de esta actividad. ¿Está correcto? Si no, corrígelo para que diga qué haces, sobre qué trabajas y qué queda listo.",
    helpText:
      "Revisa cada parte por separado: qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo. Si algo no encaja, usa \"Corrección libre\".",
    helpTextKind: "canonical",
    helpTextSource:
      "UX_Subfield_Structure.display_rule, cláusula orientadora derivada de subcampos separados",
    canonicalHelpStatus: "present",
    technicalLabel: "Confirmación o corrección de actividad",
    uiComponent: "confirmation_card_with_correction",
    responseKind: "compound",
    subfields: [
      {
        id: "action_verb",
        label: "Qué haces",
        responseKind: "text",
        sourceCode: "0.1",
        canonicalVariable: "activity_semantic_action_verb",
      },
      {
        id: "input_or_object",
        label: "Sobre qué trabajas",
        responseKind: "text",
        sourceCode: "0.1",
        canonicalVariable: "activity_semantic_input_object",
      },
      {
        id: "procedure_or_standard",
        label: "Cómo o bajo qué regla",
        responseKind: "text",
        sourceCode: "0.1a",
        canonicalVariable: "activity_semantic_procedure_standard",
      },
      {
        id: "output_or_result",
        label: "Qué queda listo",
        responseKind: "text",
        sourceCode: "0.D",
        canonicalVariable: "activity_semantic_output_product",
      },
      {
        id: "user_correction_note",
        label: "Corrección libre",
        responseKind: "text",
        sourceCode: "0.D",
      },
    ],
    canonicalVariables: [
      "semantic_preload_used + activity_semantic_* + semantic_review_attempt_count + block0_entry_mode",
      "activity_name_user_confirmed + semantic_confirmation_status + block0_entry_mode",
      "activity_name_user_confirmed + activity_semantic_structure_corrected + reconstructed_activity_minimum",
      "activity_semantic_completion / semantic_gap_unresolved",
    ],
    requiredVariables: [
      "semantic_preload_used",
      "activity_semantic_*",
      "semantic_review_attempt_count",
    ],
    optionalVariables: [
      "Variables secundarias derivables solo si provenance y confirmation_policy lo permiten.",
    ],
    derivedVariables: [
      "Derivar únicamente con trazabilidad",
      "no derivar captured_user_evidence",
    ],
    sourceCodes: ["0.0", "0.1", "0.1a", "0.D", "block0_entry_control"],
    sourceNodes: [
      "B0_0_0",
      "B0_0_1",
      "B0_0_1a",
      "B0_0_D",
      "B0_block0_entry_control",
    ],
    sourceSheetRefs: [
      {
        sourceSheet: "Runtime_Interactions_Base_40",
        sourceRow: 2,
        sourceRuntimeInteractionId: "B0-Q01",
        sourceColumns: [...BASE_COLUMNS],
      },
      {
        sourceSheet: "UX_Subfield_Structure",
        sourceRow: 2,
        sourceRuntimeInteractionId: "B0-Q01",
        sourceColumns: [...UX_COLUMNS],
      },
      {
        sourceSheet: "Canonical_Variables",
        sourceRow: 2,
        sourceRuntimeInteractionId: "B0-Q01",
        sourceColumns: [...CANONICAL_COLUMNS],
      },
      {
        sourceSheet: "Critical_Routes",
        sourceRow: 2,
        sourceColumns: [
          "critical_route_id",
          "ruta",
          "nodos",
          "regla",
          "bloqueo_si_falla",
          "downstream",
          "v1_1_enforcement",
        ],
      },
    ],
    routeOrGate: "CR-B0-WorkMapIntake-semantic-entry",
    displayRule:
      "Mostrar como tarjeta de confirmación editable con subcampos separados para qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo y corrección libre.",
    storageRule:
      "Persistir cada subcampo como variable separable con su provenance y timestamp; no guardar la corrección solo como texto plano.",
    riskIfSingleTextbox:
      "Se puede perder la estructura semántica de la actividad y contaminar el anclaje de Bloque 0; la IA podría inferir componentes no confirmados.",
    readinessEffect:
      "Bloquea o genera ready_with_flags si ruta crítica no cierra.",
  },
  {
    runtimeInteractionId: "B0-Q02",
    sourceRuntimeInteractionId: "B0-Q02",
    interactionGroup: "base",
    block: "0",
    runtimeOrder: 2,
    questionText: "En tus palabras, ¿qué ocurre cuando haces esta actividad?",
    helpText:
      "Cuéntanos con tus palabras qué haces en esta actividad: qué parte del trabajo tocas y qué resultado concreto dejas al terminar.",
    helpTextKind: "fallback_no_canonico",
    helpTextSource:
      "Fallback documentado: no existe ayuda canónica en XLSX; function queda como technicalLabel.",
    canonicalHelpStatus: "CANONICAL_HELP_MISSING",
    technicalLabel: "Descripción operativa mínima",
    uiComponent: "guided_textarea_or_choice_plus_text",
    responseKind: "textarea",
    subfields: [],
    canonicalVariables: [
      "activity_summary_literal / scene_summary_literal",
      "activity_name_disambiguation",
      "activity_scale_adjustment",
    ],
    requiredVariables: [
      "activity_summary_literal / scene_summary_literal",
      "activity_name_disambiguation",
      "activity_scale_adjustment",
    ],
    optionalVariables: [
      "Variables secundarias derivables solo si provenance y confirmation_policy lo permiten.",
    ],
    derivedVariables: [
      "Derivar únicamente con trazabilidad",
      "no derivar captured_user_evidence",
    ],
    sourceCodes: ["0.2", "0.A", "0.C"],
    sourceNodes: ["B0_0_2", "B0_0_A", "B0_0_C"],
    sourceSheetRefs: [
      {
        sourceSheet: "Runtime_Interactions_Base_40",
        sourceRow: 3,
        sourceRuntimeInteractionId: "B0-Q02",
        sourceColumns: [...BASE_COLUMNS],
      },
      {
        sourceSheet: "Canonical_Variables",
        sourceRow: 3,
        sourceRuntimeInteractionId: "B0-Q02",
        sourceColumns: [...CANONICAL_COLUMNS],
      },
    ],
    routeOrGate: "missing_required_variable_or_low_confidence",
    readinessEffect:
      "Contribuye a readiness; genera gap si variable requerida queda unresolved.",
  },
  {
    runtimeInteractionId: "B0-Q03",
    sourceRuntimeInteractionId: "B0-Q03",
    interactionGroup: "base",
    block: "0",
    runtimeOrder: 3,
    questionText:
      "¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente?",
    helpText:
      "Completa cada subcampo por separado: con qué frecuencia ocurre, en qué situación suele darse y quién la ejecuta directamente.",
    helpTextKind: "fallback_no_canonico",
    helpTextSource:
      "Fallback documentado: UX_Subfield_Structure.display_rule es regla de implementación, no ayuda de usuario.",
    canonicalHelpStatus: "CANONICAL_HELP_MISSING",
    technicalLabel: "Frecuencia, contexto y actor inmediato",
    uiComponent: "compound_card_with_separable_subfields",
    responseKind: "compound",
    subfields: [
      {
        id: "frequency_base",
        label: "Con qué frecuencia ocurre",
        responseKind: "text",
        sourceCode: "0.3",
        canonicalVariable: "activity_frequency_base / scene_frequency_base",
      },
      {
        id: "typical_context",
        label: "En qué situación suele darse",
        responseKind: "text",
        sourceCode: "0.4",
        canonicalVariable: "activity_typical_context / scene_typical_context",
      },
      {
        id: "primary_actor_scope",
        label: "Sobre quién recae directamente",
        responseKind: "text",
        sourceCode: "0.5_actor_scope",
        canonicalVariable: "activity_primary_actor_scope / scene_primary_actor_scope",
      },
    ],
    canonicalVariables: [
      "activity_frequency_base / scene_frequency_base",
      "activity_typical_context / scene_typical_context",
      "activity_primary_actor_scope / scene_primary_actor_scope",
    ],
    requiredVariables: [
      "activity_frequency_base / scene_frequency_base",
      "activity_typical_context / scene_typical_context",
      "activity_primary_actor_scope / scene_primary_actor_scope",
    ],
    optionalVariables: [
      "Variables secundarias derivables solo si provenance y confirmation_policy lo permiten.",
    ],
    derivedVariables: [
      "Derivar únicamente con trazabilidad",
      "no derivar captured_user_evidence",
    ],
    sourceCodes: ["0.3", "0.4", "0.5_actor_scope"],
    sourceNodes: ["B0_0_3", "B0_0_4", "B0_0_5_actor_scope"],
    sourceSheetRefs: [
      {
        sourceSheet: "Runtime_Interactions_Base_40",
        sourceRow: 4,
        sourceRuntimeInteractionId: "B0-Q03",
        sourceColumns: [...BASE_COLUMNS],
      },
      {
        sourceSheet: "UX_Subfield_Structure",
        sourceRow: 3,
        sourceRuntimeInteractionId: "B0-Q03",
        sourceColumns: [...UX_COLUMNS],
      },
      {
        sourceSheet: "Canonical_Variables",
        sourceRow: 4,
        sourceRuntimeInteractionId: "B0-Q03",
        sourceColumns: [...CANONICAL_COLUMNS],
      },
    ],
    routeOrGate: "missing_required_variable_or_low_confidence",
    displayRule:
      "Mostrar como una tarjeta única con subcampos editables/chips; no como caja de texto indiferenciada.",
    storageRule:
      "Persistir cada subcampo como variable separable con su provenance y confidence.",
    riskIfSingleTextbox:
      "La carga visible parece menor, pero se oculta ambigüedad y se pierde trazabilidad.",
    readinessEffect:
      "Contribuye a readiness; genera gap si variable requerida queda unresolved.",
  },
  {
    runtimeInteractionId: "B0-Q04",
    sourceRuntimeInteractionId: "B0-Q04",
    interactionGroup: "base",
    block: "0",
    runtimeOrder: 4,
    questionText:
      "¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada?",
    helpText:
      "Describe qué necesitas para empezar, como insumos, avisos o condiciones, y qué resultado concreto indica que la actividad quedó terminada.",
    helpTextKind: "fallback_no_canonico",
    helpTextSource:
      "Fallback documentado: no existe ayuda canónica en XLSX; function queda como technicalLabel.",
    canonicalHelpStatus: "CANONICAL_HELP_MISSING",
    technicalLabel: "Inicio y cierre de la actividad",
    uiComponent: "guided_textarea_or_choice_plus_text",
    responseKind: "textarea",
    subfields: [],
    canonicalVariables: [
      "activity_start_condition_hint / scene_boundary_start_hint",
      "activity_end_result_hint / scene_boundary_end_hint",
      "activity_boundary_clarification",
    ],
    requiredVariables: [
      "activity_start_condition_hint / scene_boundary_start_hint",
      "activity_end_result_hint / scene_boundary_end_hint",
      "activity_boundary_clarification",
    ],
    optionalVariables: [
      "Variables secundarias derivables solo si provenance y confirmation_policy lo permiten.",
    ],
    derivedVariables: [
      "Derivar únicamente con trazabilidad",
      "no derivar captured_user_evidence",
    ],
    sourceCodes: ["0.6", "0.7", "0.B"],
    sourceNodes: ["B0_0_6", "B0_0_7", "B0_0_B"],
    sourceSheetRefs: [
      {
        sourceSheet: "Runtime_Interactions_Base_40",
        sourceRow: 5,
        sourceRuntimeInteractionId: "B0-Q04",
        sourceColumns: [...BASE_COLUMNS],
      },
      {
        sourceSheet: "Canonical_Variables",
        sourceRow: 5,
        sourceRuntimeInteractionId: "B0-Q04",
        sourceColumns: [...CANONICAL_COLUMNS],
      },
    ],
    routeOrGate: "missing_required_variable_or_low_confidence",
    readinessEffect:
      "Contribuye a readiness; genera gap si variable requerida queda unresolved.",
  },
] as const satisfies readonly RuntimeInteractionViewModel[];
