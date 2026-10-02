import type {
  RuntimeCanonicalTrace,
} from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type {
  RuntimeCatalogGenericRecordCandidate,
  RuntimeCatalogImportAuditRecordCandidate,
  RuntimeCatalogImportNoGoCheck,
  RuntimeCatalogImportPayload,
  RuntimeCatalogImportPayloadBuilderInput,
  RuntimeCatalogImportPayloadBuilderResult,
  RuntimeCatalogImportReadinessCheck,
  RuntimeCatalogTableName,
  RuntimeCatalogVersionRecordCandidate,
  RuntimeInteractionDefRecordCandidate,
  RuntimeTraceableCanonicalCandidate,
} from "./runtime-40-20-catalog-import-payload-types";

const RECTOR_DOCUMENTS: RuntimeCatalogImportAuditRecordCandidate["source_documents_referenced"] = [
  "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
  "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
  "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
];

const MATERIALITY: RuntimeCatalogImportPayloadBuilderResult["materiality"] = {
  level: "runtime_40_20_catalog_import_payload_builder_local",
  local_only: true,
  migration_applied: false,
  catalog_activated: false,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

export function buildRuntime4020CatalogImportPayload(
  input: RuntimeCatalogImportPayloadBuilderInput,
): RuntimeCatalogImportPayloadBuilderResult {
  const blockers = preflightBlockers(input);
  const catalogVersionRef = `runtime-40-20:${input.case_id}:v1.0.1:v1.1.1:1.0`;
  const ok = blockers.length === 0;
  const payload = buildPayload(input, catalogVersionRef, ok ? "draft_import_payload" : "blocked", blockers);

  return {
    ok,
    case_id: input.case_id,
    import_payload: payload,
    no_go_check: noGoCheck(blockers),
    blocked_reason: ok ? undefined : blockers[0],
    materiality: MATERIALITY,
  };
}

function preflightBlockers(input: RuntimeCatalogImportPayloadBuilderInput): string[] {
  const blockers: string[] = [];
  const report = input.canonicalization_result.canonicalization_report;

  if (input.canonicalization_result.ok !== true) blockers.push("canonicalization_result_not_ok");
  if (input.persistence_schema_result.ok !== true) blockers.push("persistence_schema_result_not_ok");
  if (!notBlank(input.checksums.runtime_spec_checksum)) blockers.push("runtime_spec_checksum_missing");
  if (!notBlank(input.checksums.runtime_catalog_checksum)) blockers.push("runtime_catalog_checksum_missing");
  if (!notBlank(input.checksums.mother_catalog_checksum)) blockers.push("mother_catalog_checksum_missing");
  if (input.canonicalization_result.canonical_model.interaction_definitions.length !== 60) {
    blockers.push("interaction_definition_count_not_60");
  }
  if (report.base_interaction_count !== 40) blockers.push("base_interaction_count_not_40");
  if (report.causal_interaction_count !== 20) blockers.push("causal_interaction_count_not_20");
  if (report.catalog_activation_allowed !== false) blockers.push("catalog_activation_not_blocked");
  if (input.persistence_schema_result.schema_contract.checksum_contract.checksum_contract_aligned !== true) {
    blockers.push("checksum_contract_not_aligned");
  }
  if (input.persistence_schema_result.schema_contract.runtime_catalog_tables_supported !== 14) {
    blockers.push("runtime_catalog_table_count_not_14");
  }

  return [...blockers, ...traceabilityBlockers(input)];
}

function traceabilityBlockers(input: RuntimeCatalogImportPayloadBuilderInput): string[] {
  const missing = allTraceableCandidates(input).filter((candidate) => !hasTrace(candidate));

  return missing.length > 0 ? ["missing_source_traceability"] : [];
}

function buildPayload(
  input: RuntimeCatalogImportPayloadBuilderInput,
  catalogVersionRef: string,
  status: RuntimeCatalogImportPayload["status"],
  blockers: string[],
): RuntimeCatalogImportPayload {
  const model = input.canonicalization_result.canonical_model;

  return {
    payload_id: `runtime-40-20-import-payload:${input.case_id}`,
    case_id: input.case_id,
    status,
    catalog_version_record: catalogVersionRecord(input, catalogVersionRef),
    interaction_def_records: model.interaction_definitions.map((candidate, index) =>
      interactionDefRecord(asTraceableCandidate(candidate), catalogVersionRef, index),
    ),
    source_node_ref_records: genericRecords("eve_runtime_source_node_ref", asTraceableCandidates(model.source_node_registry), catalogVersionRef),
    interaction_mapping_records: genericRecords("eve_runtime_interaction_mapping", asTraceableCandidates(model.interaction_source_mappings), catalogVersionRef),
    subfield_schema_records: genericRecords("eve_runtime_subfield_schema", asTraceableCandidates(model.subfield_schemas), catalogVersionRef),
    canonical_variable_map_records: genericRecords("eve_runtime_canonical_variable_map", asTraceableCandidates(model.canonical_variable_maps), catalogVersionRef),
    branching_rule_records: genericRecords("eve_runtime_branching_rule", asTraceableCandidates(model.branching_rules), catalogVersionRef),
    critical_route_records: genericRecords("eve_runtime_critical_route", asTraceableCandidates(model.critical_routes), catalogVersionRef),
    semantic_gate_records: genericRecords("eve_runtime_semantic_gate", asTraceableCandidates(model.semantic_gates), catalogVersionRef),
    process_state_timer_gate_records: genericRecords("eve_runtime_process_state_timer_gate", asTraceableCandidates(model.process_state_timer_gates), catalogVersionRef),
    readiness_rule_records: genericRecords("eve_runtime_readiness_rule", asTraceableCandidates(model.readiness_rules), catalogVersionRef),
    qa_rule_records: genericRecords("eve_runtime_qa_rule", asTraceableCandidates(model.qa_rules), catalogVersionRef),
    implementation_dictionary_records: genericRecords("eve_runtime_implementation_dictionary", asTraceableCandidates(model.implementation_dictionaries), catalogVersionRef),
    import_audit_record: importAuditRecord(catalogVersionRef, input),
    readiness_check: readinessCheck(input, blockers),
  };
}

function catalogVersionRecord(
  input: RuntimeCatalogImportPayloadBuilderInput,
  catalogVersionRef: string,
): RuntimeCatalogVersionRecordCandidate {
  return {
    catalog_version_ref: catalogVersionRef,
    runtime_spec_version: "v1.0.1",
    runtime_catalog_version: "v1.1.1",
    mother_catalog_version: "1.0",
    runtime_spec_checksum: input.checksums.runtime_spec_checksum,
    runtime_catalog_checksum: input.checksums.runtime_catalog_checksum,
    mother_catalog_checksum: input.checksums.mother_catalog_checksum,
    qa_passed: true,
    catalog_activation_allowed: false,
    status: "draft_import_payload",
    metadata: {
      local_payload_only: true,
      catalog_activation_allowed: false,
    },
  };
}

function interactionDefRecord(
  candidate: RuntimeTraceableCanonicalCandidate,
  catalogVersionRef: string,
  index: number,
): RuntimeInteractionDefRecordCandidate {
  const group = candidate.interaction_group === "causal" ? "causal" : "base";

  return {
    ...traceFrom(candidate),
    target_table: "eve_runtime_interaction_def",
    record_ref: recordRef("eve_runtime_interaction_def", index),
    catalog_version_ref: catalogVersionRef,
    active: true,
    metadata: {
      source_refs: candidate.source_refs ?? [],
      trigger_condition: candidate.trigger_condition,
      ui_component: candidate.ui_component,
    },
    runtime_interaction_id: String(candidate.runtime_interaction_id ?? ""),
    interaction_group: group,
    visible_text: String(candidate.visible_text ?? ""),
    counts_as_base: group === "base",
    counts_as_causal: group === "causal",
    catalog_activation_allowed: false,
  };
}

function genericRecords(
  targetTable: RuntimeCatalogTableName,
  candidates: RuntimeTraceableCanonicalCandidate[],
  catalogVersionRef: string,
): RuntimeCatalogGenericRecordCandidate[] {
  return candidates.map((candidate, index) => ({
    ...traceFrom(candidate),
    target_table: targetTable,
    record_ref: recordRef(targetTable, index),
    catalog_version_ref: catalogVersionRef,
    active: true,
    metadata: metadataFrom(candidate),
  }));
}

function metadataFrom(candidate: RuntimeTraceableCanonicalCandidate): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (!["source_document", "source_sheet", "source_row_number", "raw_row"].includes(key)) {
      metadata[key] = value;
    }
  }
  return metadata;
}

function importAuditRecord(
  catalogVersionRef: string,
  input: RuntimeCatalogImportPayloadBuilderInput,
): RuntimeCatalogImportAuditRecordCandidate {
  return {
    audit_ref: `runtime-40-20-import-audit:${input.case_id}`,
    catalog_version_ref: catalogVersionRef,
    action: "catalog_import_payload_built",
    source_documents_referenced: RECTOR_DOCUMENTS,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    metadata: {
      local_payload_only: true,
      interaction_def_records: input.canonicalization_result.canonical_model.interaction_definitions.length,
    },
  };
}

function readinessCheck(
  input: RuntimeCatalogImportPayloadBuilderInput,
  blockers: string[],
): RuntimeCatalogImportReadinessCheck {
  return {
    canonical_model_consumed: input.canonicalization_result.ok === true,
    schema_contract_consumed: input.persistence_schema_result.ok === true,
    checksum_contract_aligned:
      input.persistence_schema_result.schema_contract.checksum_contract.checksum_contract_aligned === true,
    migration_applied: false,
    catalog_activated: false,
    ready_for_future_persistence: blockers.length === 0,
    ready_for_catalog_activation: false,
    ready_for_runtime_start: false,
    blockers,
  };
}

function noGoCheck(blockers: string[]): RuntimeCatalogImportNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    migration_applied: false,
    catalog_activated: false,
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
  };
}

function allTraceableCandidates(input: RuntimeCatalogImportPayloadBuilderInput): RuntimeTraceableCanonicalCandidate[] {
  const model = input.canonicalization_result.canonical_model;
  return [
    ...asTraceableCandidates(model.interaction_definitions),
    ...asTraceableCandidates(model.source_node_registry),
    ...asTraceableCandidates(model.interaction_source_mappings),
    ...asTraceableCandidates(model.subfield_schemas),
    ...asTraceableCandidates(model.canonical_variable_maps),
    ...asTraceableCandidates(model.branching_rules),
    ...asTraceableCandidates(model.critical_routes),
    ...asTraceableCandidates(model.semantic_gates),
    ...asTraceableCandidates(model.process_state_timer_gates),
    ...asTraceableCandidates(model.readiness_rules),
    ...asTraceableCandidates(model.qa_rules),
    ...asTraceableCandidates(model.implementation_dictionaries),
  ];
}

function asTraceableCandidate(candidate: RuntimeCanonicalTrace): RuntimeTraceableCanonicalCandidate {
  return candidate as unknown as RuntimeTraceableCanonicalCandidate;
}

function asTraceableCandidates(candidates: RuntimeCanonicalTrace[]): RuntimeTraceableCanonicalCandidate[] {
  return candidates.map(asTraceableCandidate);
}

function hasTrace(candidate: RuntimeTraceableCanonicalCandidate): boolean {
  return (
    typeof candidate.source_document === "string" &&
    candidate.source_document.length > 0 &&
    typeof candidate.source_sheet === "string" &&
    candidate.source_sheet.length > 0 &&
    typeof candidate.source_row_number === "number" &&
    candidate.raw_row !== null &&
    typeof candidate.raw_row === "object"
  );
}

function traceFrom(candidate: RuntimeTraceableCanonicalCandidate) {
  return {
    source_document: String(candidate.source_document ?? ""),
    source_sheet: String(candidate.source_sheet ?? ""),
    source_row_number: Number(candidate.source_row_number ?? 0),
    raw_row: (candidate.raw_row ?? {}) as Record<string, unknown>,
  };
}

function recordRef(targetTable: RuntimeCatalogTableName, index: number): string {
  return `${targetTable}:${String(index + 1).padStart(4, "0")}`;
}

function notBlank(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
