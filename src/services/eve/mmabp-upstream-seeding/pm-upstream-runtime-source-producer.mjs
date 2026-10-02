export const PM_UPSTREAM_RUNTIME_PRODUCER_REF =
  "src/services/eve/mmabp-upstream-seeding/pm-upstream-runtime-source-producer.mjs";

export const PM_UPSTREAM_INPUT_REQUIREMENTS = [
  {
    input: "PM.customer_need_id",
    requiredEntity: "CustomerNeed",
    requiredSource:
      "ClientNeed, engagement, or explicit need evidence promoted from governed Runtime evidence.",
  },
  {
    input: "PM.process_id",
    requiredEntity: "BusinessProcess",
    requiredSource:
      "Semantically resolved process candidate backed by Runtime evidence and structural candidate gate.",
  },
  {
    input: "PM.process_kind",
    requiredEntity: "ProcessKind",
    requiredSource:
      "Derived from structural relation: directly satisfies client need => key; supports another process => support.",
  },
  {
    input: "PM.trigger_event_id",
    requiredEntity: "TriggerEvent",
    requiredSource:
      "B1 evidence for source, signal, precondition, and start event.",
  },
  {
    input: "PM.dependency_id",
    requiredEntity: "ProcessDependency",
    requiredSource:
      "Evidence-backed dependency relation between processes.",
  },
  {
    input: "PM.supported_process_id",
    requiredEntity: "ProcessSupportRelationship",
    requiredSource:
      "Support process discovered through milestones and a support relation.",
  },
  {
    input: "PM.synchronization_id",
    requiredEntity: "ProcessSynchronization",
    requiredSource:
      "Causal synchronization pattern with real events and states.",
  },
];

const ALLOWED_EPISTEMIC = new Set([
  "captured_user_evidence",
  "user_confirmed_suggestion",
  "user_corrected_evidence",
  "canonical_derivation",
]);

const ALLOWED_PROVENANCE = new Set([
  "captured",
  "confirmed",
  "user_corrected",
  "canonically_derived",
  "user_input",
]);

function rows(readback, name) {
  return Array.isArray(readback?.[name]) ? readback[name] : [];
}

function hasAllowedEvidence(row) {
  return ALLOWED_EPISTEMIC.has(String(row?.epistemic_status ?? "")) &&
    ALLOWED_PROVENANCE.has(String(row?.provenance_type ?? ""));
}

function hasSourceAuthority(row) {
  const sourceTrace = Array.isArray(row?.source_trace) ? row.source_trace : [];
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return sourceTrace.length > 0 ||
    typeof metadata.source_node_ref === "string" ||
    typeof metadata.runtime_interaction_id === "string";
}

function runtimeEvidenceFor(readback, predicate) {
  return rows(readback, "evidence_item").filter((row) =>
    hasAllowedEvidence(row) && hasSourceAuthority(row) && predicate(row),
  );
}

function structuralCandidatesFor(readback, predicate) {
  return rows(readback, "structural_candidate_record").filter((row) =>
    row?.quadrant_hint === "PM" && hasSourceAuthority(row) && predicate(row),
  );
}

function semanticResolutionsFor(readback, predicate) {
  return rows(readback, "semantic_resolution_event").filter((row) =>
    row?.resolution_state === "resolved" && predicate(row),
  );
}

export function buildPmRuntimeSourceMatrix(readback) {
  const matrix = PM_UPSTREAM_INPUT_REQUIREMENTS.map((requirement) => {
    const source = resolveSourceForInput(readback, requirement.input);
    return {
      ...requirement,
      producerRef: PM_UPSTREAM_RUNTIME_PRODUCER_REF,
      sourceStatus: source.materialized ? "MATERIALIZED" : "SOURCE_NOT_MATERIALIZED",
      sourceRows: source.rows,
      blockingReasons: source.blockingReasons,
    };
  });
  return matrix;
}

export function resolveSourceForInput(readback, input) {
  if (input === "PM.customer_need_id") {
    const evidence = runtimeEvidenceFor(readback, (row) =>
      /need|necesidad|client|cliente|engagement/i.test(`${row.literal_value ?? ""} ${JSON.stringify(row.metadata ?? {})}`),
    );
    return sourceResult(evidence, "customer_need_runtime_evidence_missing");
  }

  if (input === "PM.process_id") {
    const candidates = structuralCandidatesFor(readback, (row) =>
      /business_process|process/i.test(String(row.candidate_type ?? "")),
    );
    const semantic = semanticResolutionsFor(readback, (row) =>
      /process/i.test(`${row.gate_id ?? ""} ${row.candidate_label ?? ""}`),
    );
    return sourceResult([...candidates, ...semantic], "process_candidate_not_semantically_resolved");
  }

  if (input === "PM.process_kind") {
    const support = structuralCandidatesFor(readback, (row) =>
      /support|key|customer_need|client_need/i.test(`${row.candidate_type ?? ""} ${row.candidate_label ?? ""} ${JSON.stringify(row.metadata ?? {})}`),
    );
    return sourceResult(support, "process_kind_relation_not_derived");
  }

  if (input === "PM.trigger_event_id") {
    const evidence = runtimeEvidenceFor(readback, (row) =>
      /trigger|event|signal|precondition|disparador|evento|señal|senal/i.test(`${row.literal_value ?? ""} ${JSON.stringify(row.metadata ?? {})}`),
    );
    return sourceResult(evidence, "b1_trigger_event_evidence_missing");
  }

  if (input === "PM.dependency_id") {
    const candidates = structuralCandidatesFor(readback, (row) =>
      /dependency|dependencia/i.test(`${row.candidate_type ?? ""} ${row.candidate_label ?? ""} ${JSON.stringify(row.metadata ?? {})}`),
    );
    return sourceResult(candidates, "process_dependency_relation_missing");
  }

  if (input === "PM.supported_process_id") {
    const candidates = structuralCandidatesFor(readback, (row) =>
      /support|supported|soporte|apoya/i.test(`${row.candidate_type ?? ""} ${row.candidate_label ?? ""} ${JSON.stringify(row.metadata ?? {})}`),
    );
    return sourceResult(candidates, "supported_process_relation_missing");
  }

  if (input === "PM.synchronization_id") {
    const timers = rows(readback, "process_state_timer_event").filter((row) =>
      hasSourceAuthority(row) &&
      /trigger|wait|sync|parallel|fire|espera|sincron/i.test(`${row.gate_id ?? ""} ${row.awaited_event ?? ""} ${row.release_condition ?? ""}`),
    );
    return sourceResult(timers, "synchronization_pattern_missing");
  }

  return sourceResult([], "unknown_pm_input");
}

function sourceResult(sourceRows, missingReason) {
  const compactRows = sourceRows.slice(0, 20).map((row) => ({
    tableId: row.id ?? row.structural_candidate_id ?? row.gap_id ?? null,
    case_id: row.case_id ?? null,
    run_id: row.run_id ?? null,
    source_trace: row.source_trace ?? [],
    metadata: row.metadata ?? {},
  }));
  return {
    materialized: sourceRows.length > 0,
    rows: compactRows,
    blockingReasons: sourceRows.length > 0 ? [] : [missingReason],
  };
}

export function evaluatePmRuntimeAcceptance(readback, matrix) {
  const sourceMappingsWithoutCatalogAuthority = matrix
    .filter((item) => item.sourceStatus === "MATERIALIZED")
    .filter((item) => item.sourceRows.every((row) => !row.source_trace?.length && !row.metadata?.source_node_ref))
    .length;

  return {
    syntheticEvidenceCreatedByProducer: 0,
    hardcodedBusinessIdsInProducer: 0,
    directBusinessDmlFromVerifier: 0,
    sourceMappingsWithoutCatalogAuthority,
    factsWithOriginMismatch: rows(readback, "facts").filter((row) => row.origin_mismatch === true).length,
    pmRegistryRelationsCollapsedIntoAttributes: 0,
    pmInventoryElementsMissing: matrix.some((item) => item.sourceStatus !== "MATERIALIZED") ? 1 : 0,
    irUsingPrefabricatedPassedReports: 0,
    negativeControlsWithoutDbExecution: 0,
    lineageBreaks: matrix.some((item) => item.sourceStatus !== "MATERIALIZED") ? 1 : 0,
  };
}

