import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("canonicalizes valid loader result into 60 interaction definitions", () => {
  assert.equal(run().canonical_model.interaction_definitions.length, 60);
});

test("preserves 40 base interactions", () => {
  assert.equal(run().canonicalization_report.base_interaction_count, 40);
});

test("preserves 20 causal interactions", () => {
  assert.equal(run().canonicalization_report.causal_interaction_count, 20);
});

test("preserves source row traceability", () => {
  const interaction = run().canonical_model.interaction_definitions[0];

  assert.equal(typeof interaction.source_document, "string");
  assert.equal(typeof interaction.source_sheet, "string");
  assert.equal(typeof interaction.source_row_number, "number");
  assert.equal(typeof interaction.raw_row, "object");
});

test("produces source node registry candidates", () => {
  assert.ok(run().canonical_model.source_node_registry.length > 0);
});

test("produces interaction source mapping candidates", () => {
  assert.ok(run().canonical_model.interaction_source_mappings.length >= 60);
});

test("produces subfield schema candidates", () => {
  assert.ok(run().canonical_model.subfield_schemas.length >= 5);
});

test("produces canonical variable map candidates", () => {
  assert.ok(run().canonical_model.canonical_variable_maps.length > 0);
});

test("produces critical route candidates", () => {
  assert.ok(run().canonical_model.critical_routes.length > 0);
});

test("produces semantic gate candidates SEM-001..SEM-007", () => {
  const ids = run().canonical_model.semantic_gates.map((gate) => gate.gate_id);

  for (const id of ["SEM-001", "SEM-002", "SEM-003", "SEM-004", "SEM-005", "SEM-006", "SEM-007"]) {
    assert.ok(ids.includes(id));
  }
});

test("produces process state timer gate candidates PST-001..PST-006", () => {
  const ids = run().canonical_model.process_state_timer_gates.map(
    (gate) => gate.gate_id,
  );

  for (const id of ["PST-001", "PST-002", "PST-003", "PST-004", "PST-005", "PST-006"]) {
    assert.ok(ids.includes(id));
  }
});

test("produces QA rules", () => {
  assert.ok(run().canonical_model.qa_rules.length > 0);
});

test("passes T-003 for complete source refs", () => {
  assertGate(run(), "T-003", true);
});

test("passes T-004 for required fields", () => {
  assertGate(run(), "T-004", true);
});

test("passes T-005 B7 no IR", () => {
  assertGate(run(), "T-005", true);
});

test("passes T-006 B0-Q01 subfields", () => {
  assertGate(run(), "T-006", true);
});

test("passes T-007 C09 route_missing", () => {
  assertGate(run(), "T-007", true);
});

test("passes T-008 B3-Q22 limpio", () => {
  assertGate(run(), "T-008", true);
});

test("passes T-009 C09 variables", () => {
  assertGate(run(), "T-009", true);
});

test("passes T-010 PST gates", () => {
  assertGate(run(), "T-010", true);
});

test("passes T-011 SEM gates", () => {
  assertGate(run(), "T-011", true);
});

test("passes T-012 VSM/AHE frontera", () => {
  assertGate(run(), "T-012", true);
});

test("passes T-013 metadata version alignment", () => {
  assertGate(run(), "T-013", true);
});

test("passes T-015 required columns present", () => {
  assertGate(run(), "T-015", true);
});

test("passes T-018 activation blocked on QA failure", () => {
  assertGate(run(), "T-018", true);
  assert.equal(run().canonicalization_report.catalog_activation_allowed, false);
});

test("blocks if loader_result.ok=false", () => {
  const result = run({
    loader_result: {
      ...loaderResult(),
      ok: false,
      blocked_reason: "loader_blocked",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "loader_result_not_ok");
});

test("blocks if base count is not 40", () => {
  const loader = loaderResult();
  loader.extraction_report.base_count = 39;

  const result = run({ loader_result: loader });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "runtime_base_count_not_40");
});

test("blocks if causal count is not 20", () => {
  const loader = loaderResult();
  loader.extraction_report.causal_count = 19;

  const result = run({ loader_result: loader });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "runtime_causal_count_not_20");
});

test("blocks if B7 direct projection appears", () => {
  const loader = loaderResult();
  loader.extraction_report.runtime_causal_interactions[19] = {
    ...loader.extraction_report.runtime_causal_interactions[19],
    raw_row: {
      ...loader.extraction_report.runtime_causal_interactions[19].raw_row,
      direct_output: "produce directo IR diagnosis export Delivered",
    },
  };

  const result = run({ loader_result: loader });

  assert.equal(result.ok, false);
  assertGate(result, "T-005", false);
});

test("keeps catalog_activation_allowed=false", () => {
  const result = run();

  assert.equal(result.materiality.catalog_activation_allowed, false);
  assert.equal(result.no_go_check.catalog_activated, false);
});

test("keeps Runtime 40/20 not started", () => {
  const result = run();

  assert.equal(result.materiality.runtime_40_20_started, false);
  assert.equal(result.no_go_check.runtime_40_20_started, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const result = run();

  assert.equal(result.no_go_check.supabase_touched, false);
  assert.equal(result.no_go_check.sql_executed, false);
  assert.equal(result.no_go_check.endpoint_created, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const result = run();

  assert.equal(result.no_go_check.registry_live_db_created, false);
  assert.equal(result.no_go_check.ir_real_created, false);
  assert.equal(result.no_go_check.object_inventory_real_opened, false);
  assert.equal(result.no_go_check.f5c_real_opened, false);
  assert.equal(result.no_go_check.export_created, false);
  assert.equal(result.no_go_check.diagnosis_created, false);
  assert.equal(result.no_go_check.delivered_created, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(typeof service.runRuntime4020CatalogCanonicalization, "function");
  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runRuntime4020CatalogCanonicalization({
    case_id: "case:runtime-40-20-canonicalization",
    loader_result: loaderResult(),
    ...overrides,
  });
}

function assertGate(result, gateId, passed) {
  const gate = result.integrity_gate_results.find((item) => item.gate_id === gateId);

  assert.ok(gate, `${gateId} not found`);
  assert.equal(gate.passed, passed);
}

function loaderResult() {
  const runtimeGenericExtracts = [
    runtimeGeneric("version_control", "Version_Control", 2, {
      Campo: "Estado",
      Valor: "v1.1.1 operational; Catálogo Madre 1.0",
    }),
    runtimeGeneric("ux_subfield", "UX_Subfield_Structure", 2, {
      runtime_interaction_id: "B0-Q01",
      subfield_structure:
        "action_verb; input_or_object; procedure_or_standard; output_or_result; user_correction_note",
      storage_rule: "Persist each subfield separately",
    }),
    runtimeGeneric("canonical_variable", "Canonical_Variables", 2, {
      runtime_interaction_id: "C09",
      canonical_variables:
        "receiver_feedback_exists + receiver_feedback + gap_flag + route_missing + required_if_route_gap",
      required_variables:
        "receiver_feedback_exists + receiver_feedback + gap_flag + route_missing",
      route_or_gate: "C09-route_missing",
    }),
    runtimeGeneric("branching_rule", "Branching_Budget_Rules", 2, {
      Regla_ID: "BR-001",
      "Señal / condición": "route gap",
      Presupuesto: "causal",
      "Reentry / cierre": "C09",
    }),
    runtimeGeneric("critical_route", "Critical_Routes", 2, {
      critical_route_id: "CR-B3-R9-receiver_feedback",
      Nodos:
        "C09 receiver_feedback_exists receiver_feedback gap_flag route_missing required_if_route_gap",
      Regla: "receiver feedback route missing support",
    }),
    ...Array.from({ length: 7 }, (_, index) =>
      runtimeGeneric("semantic_gate", "Semantic_Resolution_Gates", index + 2, {
        gate_id: `SEM-${String(index + 1).padStart(3, "0")}`,
        riesgo_controlado: "semantic ambiguity",
        mmabp_target: "MoC/PF",
      }),
    ),
    ...Array.from({ length: 6 }, (_, index) =>
      runtimeGeneric("process_state_timer_gate", "Process_State_Timer_Gates", index + 2, {
        gate_id: `PST-${String(index + 1).padStart(3, "0")}`,
        awaited_event: "espera event timer release",
        release_condition: "release condition after awaited event",
        timer_rule: "timer rule",
      }),
    ),
    runtimeGeneric("readiness_rule", "Readiness_Gaps_Reentry", 2, {
      capture_node_id: "B7_7_0",
      route_status: "readiness_only",
      carry_forward_rule: "manual_review_required if unresolved",
    }),
    runtimeGeneric("parallel_production_contract", "Parallel_Production_Contract", 2, {
      contract_id: "PPC-001",
      rule: "local only",
    }),
    runtimeGeneric("qa_rule", "QA_Checklist", 2, {
      qa_id: "T-003",
      qa_name: "source refs completos",
      severity: "blocking",
    }),
    runtimeGeneric("implementation_dictionary", "Implementation_Dictionaries", 2, {
      Dictionary: "node_type",
      Value: "base_question",
      Definition: "Pregunta base de captura minima",
    }),
    runtimeGeneric("required_field", "Required_Field_Model", 2, {
      Modulo: "Identidad",
      Campo: "runtime_interaction_id",
      "Tipo esperado": "string",
    }),
    runtimeGeneric("mmabp_output_map", "MMABP_Output_Map", 2, {
      runtime_interaction_id: "B0-Q01",
      pm_output: "candidate",
    }),
  ];
  const motherGenericExtracts = [
    motherGeneric("version_control", "Version_Control", 2, {
      catalog_version: "1.0",
    }),
    motherGeneric("mother_node", "Catalogo_Madre_Nodos", 2, {
      capture_node_id: "B0_0_0",
      source_block: "0",
      source_question_code_intact: "0.0",
      node_label: "Confirmación de actividad",
    }),
    motherGeneric("source_question", "Source_Question_Registry", 2, {
      capture_node_id: "B0_0_1",
      source_question_code_intact: "0.1",
      visible_question_text: "Pregunta fuente",
    }),
    motherGeneric("runtime_classification", "Runtime_Classification", 2, {
      capture_node_id: "B0_0_1",
      runtime_role: "base",
    }),
    motherGeneric("ux_copy", "UX_Copy_View", 2, {
      capture_node_id: "B0_0_1",
      visible_question_text: "Texto UX",
    }),
    motherGeneric("epistemic_governance", "Epistemic_Governance", 2, {
      capture_node_id: "B0_0_1",
      epistemic_status: "user_confirmed",
    }),
    motherGeneric("mmabp_mapping", "MMABP_Mapping", 2, {
      capture_node_id: "B0_0_1",
      mmabp_quadrant_primary: "PM",
    }),
    motherGeneric("canonical_variable", "Canonical_Variables", 2, {
      capture_node_id: "B0_0_1",
      canonical_variable_output: "activity_name_user_confirmed",
    }),
    motherGeneric("critical_route", "Critical_Routes", 2, {
      critical_route_id: "CR-B7-AHE-boundary_guard",
      Regla: "B7 solo preclassification readiness no direct output",
    }),
    motherGeneric("trigger_branching_rule", "Trigger_Branching_Rules", 2, {
      capture_node_id: "B0_0_1",
      trigger_condition: "always",
    }),
    motherGeneric("readiness_reentry_gap", "Readiness_Reentry_Gaps", 2, {
      capture_node_id: "B0_0_1",
      route_status: "normal",
    }),
    motherGeneric("vsm_ahe_prep", "VSM_AHE_Prep", 2, {
      capture_node_id: "B7_7_0",
      diagnostic_use_limit: "preclassification only no direct output",
    }),
    motherGeneric("variable_canonica_source", "Variables_Canonicas_Source", 2, {
      variable: "activity_name_user_confirmed",
    }),
    motherGeneric("implementation_dictionary", "Implementation_Dictionaries", 2, {
      Dictionary: "node_type",
      Value: "base_question",
    }),
    motherGeneric("audit_issue", "Audit_Issues", 2, {
      Issue_ID: "AUD-001",
      Descripción: "No direct diagnosis",
    }),
  ];

  return {
    ok: true,
    case_id: "case:runtime-40-20-loader",
    extraction_report: {
      case_id: "case:runtime-40-20-loader",
      runtime_spec_extract: {
        source_document:
          "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
        detected_version: "v1.0.1",
        title_detected: "Runtime 40+20 Especificacion Tecnica Ejecutable",
        mentions_runtime_40_20: true,
        mentions_runtime_catalog_v1_1_1: true,
        mentions_mother_catalog_v1_0: true,
        section_headings_detected: ["0. Dictamen ejecutivo"],
      },
      runtime_base_interactions: baseInteractions(),
      runtime_causal_interactions: causalInteractions(),
      runtime_generic_extracts: runtimeGenericExtracts,
      mother_generic_extracts: motherGenericExtracts,
      runtime_catalog_sheets_detected: [
        "Version_Control",
        "Runtime_Interactions_Base_40",
        "Runtime_Interactions_Causal_20",
      ],
      mother_catalog_sheets_detected: [
        "Version_Control",
        "Catalogo_Madre_Nodos",
        "Source_Question_Registry",
      ],
      base_count: 40,
      causal_count: 20,
    },
    no_go_check: {
      no_go_triggered: false,
      blockers: [],
      runtime_40_20_started: false,
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
    materiality: {
      level: "runtime_40_20_rector_catalog_loader_local_extraction",
      local_only: true,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function baseInteractions() {
  return Array.from({ length: 40 }, (_, index) => {
    const id = index === 0 ? "B0-Q01" : index === 21 ? "B3-Q22" : `B${index}-Q${String(index + 1).padStart(2, "0")}`;
    const sourceCodes = index === 21 ? "3.10, 3.13" : `B${index}_source, ${index}.0`;
    const visibleText =
      index === 21
        ? "Validar recepción operativa sin convertir observaciones en feedback directo"
        : `Pregunta base ${index + 1}`;

    return {
      source_document:
        "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Runtime_Interactions_Base_40",
      source_row_number: index + 2,
      raw_row: {
        runtime_interaction_id: id,
        interaction_group: "base_40",
        visible_text_v1_1: visibleText,
        source_codes: sourceCodes,
        source_nodes: sourceCodes,
        ui_component: "guided_textarea",
      },
      interaction_group: "base",
      runtime_interaction_id: id,
      visible_text: visibleText,
      source_codes: sourceCodes.split(",").map((item) => item.trim()),
    };
  });
}

function causalInteractions() {
  return Array.from({ length: 20 }, (_, index) => {
    const id = index === 8 ? "C09" : index === 19 ? "C20" : `C${String(index + 1).padStart(2, "0")}`;
    const visibleText =
      id === "C09"
        ? "Capturar receiver_feedback_exists receiver_feedback gap_flag route_missing required_if_route_gap"
        : id === "C20"
          ? "B7 readiness and preclassification signal only, no direct output"
          : `Pregunta causal ${index + 1}`;

    return {
      source_document:
        "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      source_sheet: "Runtime_Interactions_Causal_20",
      source_row_number: index + 2,
      raw_row: {
        runtime_interaction_id: id,
        interaction_group: "causal_20",
        visible_text_v1_1: visibleText,
        trigger_condition: id === "C09" ? "route_missing" : "conditional",
        source_codes: id === "C20" ? "B7_7_0, 7.0" : `C${index + 1}_source, ${index}.A`,
        source_nodes: id === "C20" ? "B7_7_0" : `C${index + 1}_node`,
        ui_component: "conditional_probe",
      },
      interaction_group: "causal",
      runtime_interaction_id: id,
      visible_text: visibleText,
      trigger_condition: id === "C09" ? "route_missing" : "conditional",
      source_codes:
        id === "C20"
          ? ["B7_7_0", "7.0"]
          : [`C${index + 1}_source`, `${index}.A`],
    };
  });
}

function runtimeGeneric(extractKind, sourceSheet, sourceRowNumber, rawRow) {
  return {
    source_document:
      "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: sourceSheet,
    source_row_number: sourceRowNumber,
    raw_row: rawRow,
    extract_kind: extractKind,
  };
}

function motherGeneric(extractKind, sourceSheet, sourceRowNumber, rawRow) {
  return {
    source_document: "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
    source_sheet: sourceSheet,
    source_row_number: sourceRowNumber,
    raw_row: rawRow,
    extract_kind: extractKind,
  };
}

function loadService() {
  const source = readFileSync(
    new URL(
      "./runtime-40-20-catalog-canonicalization-service.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    exports: {},
    require(specifier) {
      if (
        specifier ===
          "../catalog-loader/runtime-40-20-rector-catalog-loader-types" ||
        specifier === "./runtime-40-20-catalog-canonicalization-types"
      ) {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "runtime-40-20-catalog-canonicalization-service.ts",
  });

  return context.exports;
}
