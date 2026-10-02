import type {
  MotherGenericSheetExtract,
  RuntimeBaseInteractionExtract,
  RuntimeCausalInteractionExtract,
  RuntimeGenericSheetExtract,
  SourceRowTrace,
} from "../catalog-loader/runtime-40-20-rector-catalog-loader-types";
import type {
  RuntimeBranchingRuleCandidate,
  RuntimeCanonicalTrace,
  RuntimeCanonicalVariableMapCandidate,
  RuntimeCanonicalizationStatus,
  RuntimeCatalogCanonicalModel,
  RuntimeCatalogCanonicalizationInput,
  RuntimeCatalogCanonicalizationReport,
  RuntimeCatalogCanonicalizationResult,
  RuntimeCatalogIntegrityGateResult,
  RuntimeCriticalRouteCandidate,
  RuntimeImplementationDictionaryCandidate,
  RuntimeInteractionDefinitionCandidate,
  RuntimeInteractionSourceMappingCandidate,
  RuntimeProcessStateTimerGateCandidate,
  RuntimeQARuleCandidate,
  RuntimeReadinessRuleCandidate,
  RuntimeSemanticGateCandidate,
  RuntimeSourceNodeRegistryCandidate,
  RuntimeSubfieldSchemaCandidate,
} from "./runtime-40-20-catalog-canonicalization-types";

const MATERIALITY: RuntimeCatalogCanonicalizationResult["materiality"] = {
  level: "runtime_40_20_catalog_canonicalization_and_integrity_qa",
  local_only: true,
  catalog_activation_allowed: false,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

const REQUIRED_B0_Q01_SUBFIELDS = [
  "action_verb",
  "input_or_object",
  "procedure_or_standard",
  "output_or_result",
  "user_correction_note",
];

const C09_VARIABLES = [
  "receiver_feedback_exists",
  "receiver_feedback",
  "gap_flag",
  "route_missing",
];

const PST_GATES = ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"];
const SEM_GATES = ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"];
const DIRECT_PROJECTION_TERMS = ["IR", "registry", "export", "diagnosis", "Delivered"];
const B3_Q22_FORBIDDEN_FEEDBACK_TERMS = [
  "pide ajustes",
  "solicita correcciones",
  "rechaza",
  "devuelve",
  "observaciones operativas",
];
const CRITICAL_COLUMNS_BY_SHEET: Record<string, string[]> = {
  Runtime_Interactions_Base_40: [
    "runtime_interaction_id",
    "interaction_group",
    "visible_text_v1_1",
    "source_codes",
  ],
  Runtime_Interactions_Causal_20: [
    "runtime_interaction_id",
    "interaction_group",
    "visible_text_v1_1",
    "source_codes",
  ],
  UX_Subfield_Structure: [
    "runtime_interaction_id",
    "subfield_structure",
  ],
  Canonical_Variables: ["runtime_interaction_id", "canonical_variables"],
  Critical_Routes: ["critical_route_id"],
  Semantic_Resolution_Gates: ["gate_id"],
  Process_State_Timer_Gates: ["gate_id"],
  QA_Checklist: ["qa_id"],
  Catalogo_Madre_Nodos: ["capture_node_id"],
  Source_Question_Registry: ["capture_node_id"],
  MMABP_Mapping: ["capture_node_id"],
};

export function runRuntime4020CatalogCanonicalization(
  input: RuntimeCatalogCanonicalizationInput,
): RuntimeCatalogCanonicalizationResult {
  const preflightBlockers = preflightBlockersFor(input);
  const model = preflightBlockers.length > 0 ? emptyModel() : buildCanonicalModel(input);
  const gates = preflightBlockers.length > 0 ? [] : runIntegrityGates(input, model);
  const gateBlockers = gates
    .filter((gateResult) => !gateResult.passed && gateResult.severity === "blocking")
    .map((gateResult) => `${gateResult.gate_id}:${gateResult.gate_name}`);
  const blockers = unique([...preflightBlockers, ...gateBlockers]);
  const report = buildReport(model, gates);
  const ok = blockers.length === 0;

  return {
    ok,
    case_id: input.case_id,
    canonical_model: model,
    integrity_gate_results: gates,
    canonicalization_report: report,
    no_go_check: {
      no_go_triggered: !ok,
      blockers,
      runtime_40_20_started: false,
      catalog_activated: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    blocked_reason: ok ? undefined : blockers[0],
    materiality: MATERIALITY,
  };
}

function preflightBlockersFor(
  input: RuntimeCatalogCanonicalizationInput,
): string[] {
  const blockers: string[] = [];

  if (input.loader_result.ok !== true) {
    blockers.push("loader_result_not_ok");
  }

  if (input.loader_result.extraction_report.base_count !== 40) {
    blockers.push("runtime_base_count_not_40");
  }

  if (input.loader_result.extraction_report.causal_count !== 20) {
    blockers.push("runtime_causal_count_not_20");
  }

  return blockers;
}

function buildCanonicalModel(
  input: RuntimeCatalogCanonicalizationInput,
): RuntimeCatalogCanonicalModel {
  const report = input.loader_result.extraction_report;
  const interactions = [
    ...report.runtime_base_interactions.map((extract) =>
      interactionDefinition(extract, "base"),
    ),
    ...report.runtime_causal_interactions.map((extract) =>
      interactionDefinition(extract, "causal"),
    ),
  ];

  return {
    interaction_definitions: interactions,
    source_node_registry: sourceNodeRegistry(report.mother_generic_extracts),
    interaction_source_mappings: interactionSourceMappings(interactions),
    subfield_schemas: subfieldSchemas(report.runtime_generic_extracts),
    canonical_variable_maps: canonicalVariableMaps(report.runtime_generic_extracts),
    branching_rules: branchingRules(report.runtime_generic_extracts),
    critical_routes: criticalRoutes(report.runtime_generic_extracts),
    semantic_gates: semanticGates(report.runtime_generic_extracts),
    process_state_timer_gates: processStateTimerGates(report.runtime_generic_extracts),
    readiness_rules: readinessRules(report.runtime_generic_extracts),
    qa_rules: qaRules(report.runtime_generic_extracts),
    implementation_dictionaries: implementationDictionaries(
      report.runtime_generic_extracts,
    ),
  };
}

function interactionDefinition(
  extract: RuntimeBaseInteractionExtract | RuntimeCausalInteractionExtract,
  group: "base" | "causal",
): RuntimeInteractionDefinitionCandidate {
  const id = stringFromAny(
    extract.runtime_interaction_id,
    extract.raw_row.runtime_interaction_id,
  );
  const visibleText = stringFromAny(
    extract.visible_text,
    extract.raw_row.visible_text_v1_1,
    extract.raw_row.visible_text,
  );
  const sourceRefs = sourceRefsFrom(extract);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!id) {
    blockers.push("runtime_interaction_id_missing");
  }
  if (!visibleText) {
    blockers.push("visible_text_missing");
  }
  if (sourceRefs.length === 0) {
    blockers.push("source_refs_missing");
  }

  return {
    ...canonicalTrace(extract, statusFor(blockers, warnings), warnings, blockers),
    runtime_interaction_id: id ?? "",
    interaction_group: group,
    visible_text: visibleText ?? "",
    source_refs: sourceRefs,
    ui_component: stringFromAny(extract.raw_row.ui_component),
    trigger_condition: stringFromAny(
      "trigger_condition" in extract ? extract.trigger_condition : undefined,
      extract.raw_row.trigger_condition,
    ),
    canonical_variables: splitLoose(extract.raw_row.canonical_variables),
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
  };
}

function sourceNodeRegistry(
  extracts: MotherGenericSheetExtract[],
): RuntimeSourceNodeRegistryCandidate[] {
  return extracts
    .filter((extract) =>
      ["mother_node", "source_question"].includes(extract.extract_kind),
    )
    .map((extract) => {
      const sourceNodeRef = stringFromAny(
        extract.raw_row.capture_node_id,
        extract.raw_row.source_node_ref,
        extract.raw_row.node_id,
      );
      const blockers = sourceNodeRef ? [] : ["source_node_ref_missing"];

      return {
        ...canonicalTrace(extract, statusFor(blockers, []), [], blockers),
        source_node_ref: sourceNodeRef ?? "",
        source_code: stringFromAny(extract.raw_row.source_question_code_intact),
        source_block: stringFromAny(extract.raw_row.source_block),
        source_question_code: stringFromAny(
          extract.raw_row.source_question_code_intact,
          extract.raw_row.source_question_code,
        ),
        node_label: stringFromAny(
          extract.raw_row.node_label,
          extract.raw_row.visible_question_text,
          extract.raw_row.function,
        ),
        source_document_version: stringFromAny(
          extract.raw_row.source_document_version,
        ),
      };
    });
}

function interactionSourceMappings(
  interactions: RuntimeInteractionDefinitionCandidate[],
): RuntimeInteractionSourceMappingCandidate[] {
  return interactions.flatMap((interaction) =>
    interaction.source_refs.map((sourceRef, index) => ({
      ...canonicalTrace(interaction, "normalized", [], []),
      runtime_interaction_id: interaction.runtime_interaction_id,
      source_node_ref: sourceRef,
      mapping_role: index === 0 ? "primary" : "secondary",
    })),
  );
}

function subfieldSchemas(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeSubfieldSchemaCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "ux_subfield")
    .flatMap((extract) => {
      const runtimeInteractionId = stringFromAny(
        extract.raw_row.runtime_interaction_id,
      );
      const subfields = splitSemicolon(extract.raw_row.subfield_structure);

      return subfields.map((subfield) => ({
        ...canonicalTrace(extract, "normalized", [], []),
        runtime_interaction_id: runtimeInteractionId ?? "",
        subfield_name: subfield,
        required: true,
        epistemic_policy: stringFromAny(extract.raw_row.storage_rule),
      }));
    });
}

function canonicalVariableMaps(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeCanonicalVariableMapCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "canonical_variable")
    .flatMap((extract) => {
      const variables = splitVariables(
        extract.raw_row.canonical_variables,
        extract.raw_row.required_variables,
        extract.raw_row.variable_name,
      );
      const runtimeInteractionId = stringFromAny(
        extract.raw_row.runtime_interaction_id,
      );

      return variables.map((variable) => ({
        ...canonicalTrace(extract, "normalized", [], []),
        runtime_interaction_id: runtimeInteractionId,
        variable_name: variable,
        route_id: stringFromAny(
          extract.raw_row.route_or_gate,
          extract.raw_row.canonical_route_id,
        ),
        required: textIncludes(extract.raw_row.required_variables, variable),
        derived: textIncludes(extract.raw_row.derived_variables, variable),
      }));
    });
}

function branchingRules(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeBranchingRuleCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "branching_rule")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      rule_id: stringFromAny(extract.raw_row.Regla_ID, extract.raw_row.rule_id),
      runtime_interaction_id: stringFromAny(extract.raw_row.runtime_interaction_id),
      trigger_signal: stringFromAny(
        extract.raw_row["Señal / condición"],
        extract.raw_row.trigger_condition,
      ),
      reentry_target: stringFromAny(
        extract.raw_row["Reentry / cierre"],
        extract.raw_row.reentry_target,
      ),
      budget_effect: stringFromAny(extract.raw_row.Presupuesto, extract.raw_row.budget),
    }));
}

function criticalRoutes(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeCriticalRouteCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "critical_route")
    .map((extract) => {
      const routeId =
        stringFromAny(extract.raw_row.critical_route_id, extract.raw_row.route_id) ??
        "";

      return {
        ...canonicalTrace(extract, routeId ? "normalized" : "blocked_missing_required_field", [], routeId ? [] : ["route_id_missing"]),
        route_id: routeId,
        route_family: routeFamily(routeId),
        required_variables: splitVariables(
          extract.raw_row.nodos,
          extract.raw_row.Nodos,
          extract.raw_row.required_variables,
        ),
      };
    });
}

function semanticGates(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeSemanticGateCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "semantic_gate")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      gate_id: stringFromAny(extract.raw_row.gate_id) ?? "",
      gate_family: "SEM",
      target_term: stringFromAny(
        extract.raw_row.mmabp_target,
        extract.raw_row.riesgo_controlado,
      ),
    }));
}

function processStateTimerGates(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeProcessStateTimerGateCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "process_state_timer_gate")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      gate_id: stringFromAny(extract.raw_row.gate_id) ?? "",
      gate_family: "PST",
      awaited_event: stringFromAny(extract.raw_row.awaited_event),
      release_condition: stringFromAny(
        extract.raw_row.release_condition,
        extract.raw_row.trigger_condition,
      ),
      timer_rule: stringFromAny(extract.raw_row.timer_rule, extract.raw_row.rule),
    }));
}

function readinessRules(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeReadinessRuleCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "readiness_rule")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      readiness_rule_id: stringFromAny(
        extract.raw_row.capture_node_id,
        extract.raw_row.readiness_rule_id,
      ),
      readiness_state: stringFromAny(
        extract.raw_row.route_status,
        extract.raw_row.readiness_state,
      ),
      reentry_target: stringFromAny(
        extract.raw_row.carry_forward_rule,
        extract.raw_row.reentry_target,
      ),
      manual_review_required: rowText(extract.raw_row).includes("manual_review"),
    }));
}

function qaRules(extracts: RuntimeGenericSheetExtract[]): RuntimeQARuleCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "qa_rule")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      qa_id: stringFromAny(extract.raw_row.qa_id, extract.raw_row.test_id),
      qa_name: stringFromAny(extract.raw_row.qa_name, extract.raw_row.test_name),
      blocking: /blocking|bloqueante|alta/i.test(rowText(extract.raw_row)),
    }));
}

function implementationDictionaries(
  extracts: RuntimeGenericSheetExtract[],
): RuntimeImplementationDictionaryCandidate[] {
  return extracts
    .filter((extract) => extract.extract_kind === "implementation_dictionary")
    .map((extract) => ({
      ...canonicalTrace(extract, "normalized", [], []),
      dictionary_name: stringFromAny(extract.raw_row.Dictionary),
      key: stringFromAny(extract.raw_row.Value, extract.raw_row.key),
      value: stringFromAny(extract.raw_row.Definition, extract.raw_row.value),
    }));
}

function runIntegrityGates(
  input: RuntimeCatalogCanonicalizationInput,
  model: RuntimeCatalogCanonicalModel,
): RuntimeCatalogIntegrityGateResult[] {
  const interactions = model.interaction_definitions;
  const sourceRefMissing = interactions
    .filter((interaction) => interaction.source_refs.length === 0)
    .map((interaction) => interaction.runtime_interaction_id);
  const requiredFieldMissing = interactions
    .filter(
      (interaction) =>
        interaction.canonicalization_status === "blocked_missing_required_field",
    )
    .map((interaction) => interaction.runtime_interaction_id || "unknown");
  const b7DirectProjectionRefs = b7DirectProjectionAffectedRefs(input, model);
  const b0Q01Missing = missingB0Q01Subfields(model);
  const c09Missing = missingTerms(input, C09_VARIABLES);
  const b3Q22Forbidden = b3Q22ForbiddenTerms(input);
  const pstMissing = missingGateIds(
    model.process_state_timer_gates.map((gateCandidate) => gateCandidate.gate_id),
    PST_GATES,
  );
  const pstNoLink = model.process_state_timer_gates
    .filter((gateCandidate) => {
      const text = rowText(gateCandidate.raw_row);
      return !/(espera|wait|event|evento|timer|release|liberaci[oó]n)/i.test(text);
    })
    .map((gateCandidate) => gateCandidate.gate_id);
  const semMissing = missingGateIds(
    model.semantic_gates.map((gateCandidate) => gateCandidate.gate_id),
    SEM_GATES,
  );
  const versionOk =
    input.loader_result.extraction_report.runtime_spec_extract.detected_version ===
      "v1.0.1" &&
    hasText(input, "v1.1.1") &&
    hasText(input, "1.0");
  const missingColumns = missingRequiredColumns(input);

  const gates: RuntimeCatalogIntegrityGateResult[] = [
    gate(
      "T-003",
      "source_refs_completos",
      sourceRefMissing.length === 0,
      sourceRefMissing,
      sourceRefMissing.length === 0
        ? "All interactions have source references."
        : "Some interactions lack source references.",
    ),
    gate(
      "T-004",
      "required_fields",
      requiredFieldMissing.length === 0,
      requiredFieldMissing,
      requiredFieldMissing.length === 0
        ? "All interactions have minimum required fields."
        : "Some interactions lack minimum required fields.",
    ),
    gate(
      "T-005",
      "b7_no_ir",
      b7DirectProjectionRefs.length === 0,
      b7DirectProjectionRefs,
      b7DirectProjectionRefs.length === 0
        ? "B7/C20 direct projection is blocked."
        : "B7/C20 direct projection appeared in source rows.",
    ),
    gate(
      "T-006",
      "b0_q01_subfields",
      b0Q01Missing.length === 0,
      b0Q01Missing,
      b0Q01Missing.length === 0
        ? "B0-Q01 semantic subfields are present."
        : "B0-Q01 semantic subfields are missing.",
    ),
    gate(
      "T-007",
      "c09_route_missing",
      c09Missing.length === 0,
      c09Missing,
      c09Missing.length === 0
        ? "C09 route_missing support is present."
        : "C09 route_missing support is incomplete.",
    ),
    gate(
      "T-008",
      "b3_q22_limpio",
      b3Q22Forbidden.length === 0,
      b3Q22Forbidden,
      b3Q22Forbidden.length === 0
        ? "B3-Q22 does not materialize receiver feedback directly."
        : "B3-Q22 contains direct receiver feedback terms.",
    ),
    gate(
      "T-009",
      "c09_variables",
      c09Missing.length === 0,
      c09Missing,
      c09Missing.length === 0
        ? "C09 variables are present."
        : "C09 variables are incomplete.",
    ),
    gate(
      "T-010",
      "process_state_timer",
      pstMissing.length === 0 && pstNoLink.length === 0,
      [...pstMissing, ...pstNoLink],
      pstMissing.length === 0 && pstNoLink.length === 0
        ? "PST gates and timer/event/release links are present."
        : "PST gate coverage is incomplete.",
    ),
    gate(
      "T-011",
      "semantic_gates",
      semMissing.length === 0,
      semMissing,
      semMissing.length === 0
        ? "SEM gates are present."
        : "SEM gate coverage is incomplete.",
    ),
    gate(
      "T-012",
      "vsm_ahe_frontera",
      b7DirectProjectionRefs.length === 0,
      b7DirectProjectionRefs,
      b7DirectProjectionRefs.length === 0
        ? "B7/C20 remains non-diagnostic."
        : "B7/C20 violates VSM/AHE boundary.",
    ),
    gate(
      "T-013",
      "metadata_version_alignment",
      versionOk,
      versionOk ? [] : ["version_alignment"],
      versionOk
        ? "Version metadata aligns with rector documents."
        : "Version metadata does not align.",
    ),
    gate(
      "T-015",
      "required_columns_present",
      missingColumns.length === 0,
      missingColumns,
      missingColumns.length === 0
        ? "Critical sheets expose required normalization columns."
        : "Critical sheets are missing required normalization columns.",
    ),
  ];

  const blockingFailures = gates.filter(
    (gateResult) => !gateResult.passed && gateResult.severity === "blocking",
  );
  gates.push(
    gate(
      "T-018",
      "catalog_activation_blocked_on_qa_failure",
      true,
      blockingFailures.map((gateResult) => gateResult.gate_id),
      "Catalog activation remains blocked in this tramo.",
    ),
  );

  return gates;
}

function gate(
  gateId: RuntimeCatalogIntegrityGateResult["gate_id"],
  gateName: string,
  passed: boolean,
  affectedRefs: string[],
  reason: string,
): RuntimeCatalogIntegrityGateResult {
  return {
    gate_id: gateId,
    gate_name: gateName,
    passed,
    severity: "blocking",
    reason,
    affected_refs: affectedRefs,
  };
}

function buildReport(
  model: RuntimeCatalogCanonicalModel,
  gates: RuntimeCatalogIntegrityGateResult[],
): RuntimeCatalogCanonicalizationReport {
  return {
    base_interaction_count: model.interaction_definitions.filter(
      (interaction) => interaction.counts_as_base,
    ).length,
    causal_interaction_count: model.interaction_definitions.filter(
      (interaction) => interaction.counts_as_causal,
    ).length,
    source_node_count: model.source_node_registry.length,
    mapping_count: model.interaction_source_mappings.length,
    subfield_schema_count: model.subfield_schemas.length,
    canonical_variable_count: model.canonical_variable_maps.length,
    critical_route_count: model.critical_routes.length,
    semantic_gate_count: model.semantic_gates.length,
    process_state_timer_gate_count: model.process_state_timer_gates.length,
    qa_rule_count: model.qa_rules.length,
    blocking_gate_failure_count: gates.filter(
      (gateResult) => !gateResult.passed && gateResult.severity === "blocking",
    ).length,
    warning_count: allWarnings(model).length,
    catalog_activation_allowed: false,
  };
}

function canonicalTrace(
  source: SourceRowTrace,
  canonicalizationStatus: RuntimeCanonicalizationStatus,
  warnings: string[],
  blockers: string[],
): RuntimeCanonicalTrace {
  return {
    source_document: source.source_document,
    source_sheet: source.source_sheet,
    source_row_number: source.source_row_number,
    raw_row: source.raw_row,
    canonicalization_status: canonicalizationStatus,
    warnings,
    blockers,
  };
}

function statusFor(
  blockers: string[],
  warnings: string[],
): RuntimeCanonicalizationStatus {
  if (blockers.includes("source_refs_missing")) {
    return "blocked_invalid_reference";
  }
  if (blockers.length > 0) {
    return "blocked_missing_required_field";
  }
  if (warnings.length > 0) {
    return "normalized_with_warnings";
  }
  return "normalized";
}

function sourceRefsFrom(source: SourceRowTrace): string[] {
  return unique([
    ...splitLoose(source.raw_row.source_codes),
    ...splitLoose(source.raw_row.source_nodes),
    ...splitLoose(source.raw_row.source_node_ref),
    ...splitLoose(source.raw_row.source_question_code),
    ...splitLoose(source.raw_row.source_question_code_intact),
  ]);
}

function b7DirectProjectionAffectedRefs(
  input: RuntimeCatalogCanonicalizationInput,
  model: RuntimeCatalogCanonicalModel,
): string[] {
  const b7Rows = [
    ...input.loader_result.extraction_report.runtime_base_interactions,
    ...input.loader_result.extraction_report.runtime_causal_interactions,
    ...input.loader_result.extraction_report.runtime_generic_extracts,
    ...input.loader_result.extraction_report.mother_generic_extracts,
  ].filter((extract) => isB7OrC20Row(extract));
  const rowRefs = b7Rows
    .filter((extract) => hasDirectProjection(rowText(extract.raw_row)))
    .map((extract) => `${extract.source_sheet}:${extract.source_row_number}`);
  const modelRefs = model.interaction_definitions
    .filter(
      (interaction) =>
        isB7OrC20Row(interaction) && hasDirectProjection(rowText(interaction.raw_row)),
    )
    .map((interaction) => interaction.runtime_interaction_id);

  return unique([...rowRefs, ...modelRefs]);
}

function isB7OrC20Row(source: SourceRowTrace): boolean {
  const text = rowText(source.raw_row);
  return /\bB7\b|B7_|CR-B7|C20|7\./i.test(text);
}

function hasDirectProjection(text: string): boolean {
  return DIRECT_PROJECTION_TERMS.some((term) => {
    const directPattern = new RegExp(
      `(direct|directo|produce|crear|genera|materializa|writes?)[^.;]*\\b${term}\\b`,
      "i",
    );
    return directPattern.test(text);
  });
}

function missingB0Q01Subfields(model: RuntimeCatalogCanonicalModel): string[] {
  const actual = model.subfield_schemas
    .filter((schema) => schema.runtime_interaction_id === "B0-Q01")
    .map((schema) => schema.subfield_name);

  return REQUIRED_B0_Q01_SUBFIELDS.filter(
    (required) => !actual.includes(required),
  );
}

function missingTerms(
  input: RuntimeCatalogCanonicalizationInput,
  terms: string[],
): string[] {
  const text = [
    ...input.loader_result.extraction_report.runtime_generic_extracts,
    ...input.loader_result.extraction_report.runtime_base_interactions,
    ...input.loader_result.extraction_report.runtime_causal_interactions,
  ]
    .filter((extract) => /C09|receiver_feedback|route_missing/i.test(rowText(extract.raw_row)))
    .map((extract) => rowText(extract.raw_row))
    .join(" ");

  return terms.filter((term) => !text.includes(term));
}

function b3Q22ForbiddenTerms(
  input: RuntimeCatalogCanonicalizationInput,
): string[] {
  const b3Q22Rows = input.loader_result.extraction_report.runtime_base_interactions.filter(
    (extract) =>
      stringFromAny(extract.runtime_interaction_id, extract.raw_row.runtime_interaction_id) ===
      "B3-Q22",
  );
  const text = b3Q22Rows.map((extract) => rowText(extract.raw_row)).join(" ");

  return B3_Q22_FORBIDDEN_FEEDBACK_TERMS.filter((term) =>
    text.toLowerCase().includes(term),
  );
}

function missingGateIds(actual: string[], expected: string[]): string[] {
  return expected.filter((gateId) => !actual.includes(gateId));
}

function hasText(input: RuntimeCatalogCanonicalizationInput, value: string): boolean {
  return [
    ...input.loader_result.extraction_report.runtime_generic_extracts,
    ...input.loader_result.extraction_report.mother_generic_extracts,
  ].some((extract) => rowText(extract.raw_row).includes(value));
}

function missingRequiredColumns(
  input: RuntimeCatalogCanonicalizationInput,
): string[] {
  const samples = [
    ...input.loader_result.extraction_report.runtime_base_interactions,
    ...input.loader_result.extraction_report.runtime_causal_interactions,
    ...input.loader_result.extraction_report.runtime_generic_extracts,
    ...input.loader_result.extraction_report.mother_generic_extracts,
  ];
  const missing: string[] = [];

  for (const [sheetName, requiredColumns] of Object.entries(CRITICAL_COLUMNS_BY_SHEET)) {
    const sample = samples.find((extract) => extract.source_sheet === sheetName);
    if (!sample) {
      missing.push(`${sheetName}:sheet_or_rows_missing`);
      continue;
    }
    const columns = new Set(Object.keys(sample.raw_row));
    for (const column of requiredColumns) {
      if (!columns.has(column)) {
        missing.push(`${sheetName}:${column}`);
      }
    }
  }

  return missing;
}

function routeFamily(
  routeId: string,
): RuntimeCriticalRouteCandidate["route_family"] {
  if (routeId.includes("B0")) return "B0";
  if (routeId.includes("B2")) return "B2";
  if (routeId.includes("B3")) return "B3";
  if (routeId.includes("B7")) return "B7";
  if (routeId.includes("Cross")) return "CrossRoute";
  return "unknown";
}

function emptyModel(): RuntimeCatalogCanonicalModel {
  return {
    interaction_definitions: [],
    source_node_registry: [],
    interaction_source_mappings: [],
    subfield_schemas: [],
    canonical_variable_maps: [],
    branching_rules: [],
    critical_routes: [],
    semantic_gates: [],
    process_state_timer_gates: [],
    readiness_rules: [],
    qa_rules: [],
    implementation_dictionaries: [],
  };
}

function allWarnings(model: RuntimeCatalogCanonicalModel): string[] {
  return [
    ...model.interaction_definitions,
    ...model.source_node_registry,
    ...model.interaction_source_mappings,
    ...model.subfield_schemas,
    ...model.canonical_variable_maps,
    ...model.branching_rules,
    ...model.critical_routes,
    ...model.semantic_gates,
    ...model.process_state_timer_gates,
    ...model.readiness_rules,
    ...model.qa_rules,
    ...model.implementation_dictionaries,
  ].flatMap((item) => item.warnings);
}

function splitSemicolon(value: unknown): string[] {
  return String(value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitVariables(...values: unknown[]): string[] {
  return unique(
    values.flatMap((value) =>
      String(value ?? "")
        .split(/[+;,]/)
        .map((item) => item.trim())
        .filter((item) => /^[A-Za-z0-9_:-]+$/.test(item)),
    ),
  );
}

function splitLoose(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function textIncludes(value: unknown, term: string): boolean {
  return String(value ?? "").includes(term);
}

function rowText(row: Record<string, unknown>): string {
  return Object.values(row).map(String).join(" ");
}

function stringFromAny(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
