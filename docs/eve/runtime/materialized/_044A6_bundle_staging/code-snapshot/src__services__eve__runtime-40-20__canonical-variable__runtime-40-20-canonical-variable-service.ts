import type { RuntimeCanonicalVariableMapCandidate } from "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types";
import type {
  RuntimeEvidenceItemCandidate,
  RuntimeResponseEpistemicStatus,
  RuntimeResponseIngestLocalResult,
  RuntimeSubfieldResponseCandidate,
} from "../response-ingest/runtime-40-20-response-ingest-types";
import type {
  RuntimeCanonicalB7NonDiagnosticGuard,
  RuntimeCanonicalC09ReceiverFeedbackBoundary,
  RuntimeCanonicalCriticalRouteVariableFamily,
  RuntimeCanonicalGatePrepBoundary,
  RuntimeCanonicalObjectBindingReferenceBoundary,
  RuntimeCanonicalPersistenceBoundary,
  RuntimeCanonicalPhase7DBoundaryBlockingReason,
  RuntimeCanonicalPhase8Boundary,
  RuntimeCanonicalSupersessionRevisionDecision,
  RuntimeCanonicalVariableAuditActionCandidate,
  RuntimeCanonicalVariableAuditCandidateAction,
  RuntimeCanonicalVariableAuditCandidate,
  RuntimeCanonicalEpistemicEnforcementDecision,
  RuntimeCanonicalExpectedValueType,
  RuntimeCanonicalExplicitMappingDecision,
  RuntimeCanonicalEvidenceSubfieldDerivationDecision,
  RuntimeCanonicalGapFlagDecision,
  RuntimeCanonicalGapType,
  RuntimeCanonicalRouteStatus,
  RuntimeCanonicalRouteStatusDecision,
  RuntimeCanonicalRouteGapBlockingReason,
  RuntimeCanonicalVariableMappingDecision,
  RuntimeCanonicalVariableMappingStatus,
  RuntimeCanonicalVariableNoGoCheck,
  RuntimeCanonicalVariableRecordCandidate,
  RuntimeCanonicalVariableDerivationBlockingReason,
  RuntimeCanonicalVariableServiceLocalInput,
  RuntimeCanonicalVariableServiceLocalResult,
  RuntimeCanonicalVariableServiceStatus,
  RuntimeCanonicalVariableValueTypeBoundary,
  RuntimeCanonicalSourceTraceContract,
  RuntimeCanonicalVariableSourceContract,
  RuntimeCanonicalVariableStatus,
  RuntimePhase7InputRevalidationDecision,
} from "./runtime-40-20-canonical-variable-types";

export function createRuntime4020CanonicalVariableCandidatesLocal(
  input: RuntimeCanonicalVariableServiceLocalInput,
): RuntimeCanonicalVariableServiceLocalResult {
  const phase7InputRevalidation = revalidatePhase6InputForPhase7(input);
  if (!phase7InputRevalidation.phase6_closed_local) {
    return createResult(input, "blocked_phase6_not_closed", [], [], ["blocked_phase6_not_closed"]);
  }
  if (!phase7InputRevalidation.ready_for_phase7_authorization) {
    return createResult(input, "blocked_phase7_not_authorized", [], [], ["blocked_phase7_not_authorized"]);
  }

  const ingestBlocker = getIngestBlocker(input.ingest_result);
  if (ingestBlocker) {
    return createResult(input, ingestBlocker, [], [], [ingestBlocker]);
  }

  if (input.canonical_variable_mappings.length === 0) {
    return createResult(
      input,
      "blocked_missing_canonical_variable_mapping",
      [],
      [],
      ["blocked_missing_canonical_variable_mapping"],
    );
  }

  const mappingDecisions: RuntimeCanonicalVariableMappingDecision[] = [];
  const explicitMappingDecisions: RuntimeCanonicalExplicitMappingDecision[] = [];
  const sourceContracts: RuntimeCanonicalVariableSourceContract[] = [];
  const sourceTraceContracts: RuntimeCanonicalSourceTraceContract[] = [];
  const evidenceSubfieldDerivationDecisions: RuntimeCanonicalEvidenceSubfieldDerivationDecision[] = [];
  const canonicalEpistemicEnforcementDecisions: RuntimeCanonicalEpistemicEnforcementDecision[] = [];
  const variableValueTypeBoundaries: RuntimeCanonicalVariableValueTypeBoundary[] = [];
  const routeStatusDecisions: RuntimeCanonicalRouteStatusDecision[] = [];
  const gapFlagDecisions: RuntimeCanonicalGapFlagDecision[] = [];
  const c09ReceiverFeedbackBoundaries: RuntimeCanonicalC09ReceiverFeedbackBoundary[] = [];
  const candidates: RuntimeCanonicalVariableRecordCandidate[] = [];
  const blockers: RuntimeCanonicalVariableServiceStatus[] = [];

  for (const subfieldCandidate of input.ingest_result.subfield_response_candidates) {
    const allMappings = findAllExactMappings(
      input.canonical_variable_mappings,
      subfieldCandidate,
    );
    // Capture-only slots (answered but no authorized mapping) are not
    // fail-closed: never invent variables; skip without blocking peers.
    if (allMappings.length === 0) {
      continue;
    }

    for (const mapping of allMappings) {
    const evidenceCandidate = findEvidenceCandidate(
      input.ingest_result.evidence_item_candidates,
      subfieldCandidate,
    );
    const mappingStatus = getMappingStatus(mapping, subfieldCandidate, evidenceCandidate);
    const explicitMappingDecision = enforceExplicitMapping(
      mapping,
      subfieldCandidate,
      evidenceCandidate,
    );
    const derivationDecision = deriveCanonicalVariableFromEvidenceOrSubfieldCandidate(
      evidenceCandidate,
      subfieldCandidate,
      mapping,
    );
    const epistemicDecision = enforceCanonicalVariableEpistemicStatus(
      subfieldCandidate,
      evidenceCandidate,
      mapping,
    );
    const valueTypeBoundary = validateCanonicalVariableValueTypeBoundary(
      subfieldCandidate,
      evidenceCandidate,
      mapping,
    );
    const routeStatusDecision = buildCanonicalRouteStatusDecision(mapping, evidenceCandidate);
    const gapFlagDecision = buildCanonicalGapFlagDecision(mapping);
    const c09Boundary = enforceC09ReceiverFeedbackCanonicalBoundary(
      input.ingest_result.c09_receiver_feedback_boundary,
      mapping,
    );
    const phase7DBoundaryReasons = collectPhase7DBoundaryBlockingReasons(mapping);
    const mappingDecision = createMappingDecision(
      input,
      subfieldCandidate,
      mapping,
      mappingStatus,
    );
    mappingDecisions.push(mappingDecision);
    explicitMappingDecisions.push(explicitMappingDecision);
    evidenceSubfieldDerivationDecisions.push(derivationDecision);
    canonicalEpistemicEnforcementDecisions.push(epistemicDecision);
    variableValueTypeBoundaries.push(valueTypeBoundary);
    routeStatusDecisions.push(routeStatusDecision);
    gapFlagDecisions.push(gapFlagDecision);
    c09ReceiverFeedbackBoundaries.push(c09Boundary);

    if (mapping) {
      sourceContracts.push(
        validateCanonicalVariableSourceContract(mapping, subfieldCandidate),
      );
      sourceTraceContracts.push(
        validateCanonicalSourceTrace(mapping, subfieldCandidate, evidenceCandidate),
      );
    }

    if (
      mappingStatus !== "mapping_ready" ||
      !mapping ||
      !explicitMappingDecision.canonical_variable_candidate_allowed ||
      !derivationDecision.canonical_variable_candidate_allowed ||
      !epistemicDecision.canonical_variable_epistemic_allowed ||
      !valueTypeBoundary.type_boundary_passed ||
      !routeStatusDecision.route_status_candidate_allowed ||
      !gapFlagDecision.gap_candidate_allowed ||
      !c09Boundary.canonical_variable_candidate_allowed ||
      phase7DBoundaryReasons.length > 0
    ) {
      blockers.push(serviceStatusFromDecisions(
        mappingStatus,
        explicitMappingDecision.blocking_reasons,
        derivationDecision.blocking_reasons,
        epistemicDecision.blocking_reasons,
        valueTypeBoundary.blocking_reasons,
        [
          ...routeStatusDecision.blocking_reasons,
          ...gapFlagDecision.blocking_reasons,
          ...c09Boundary.blocking_reasons,
        ],
        phase7DBoundaryReasons,
      ));
      continue;
    }

    candidates.push(
      createCanonicalVariableRecordCandidate(
        input,
        subfieldCandidate,
        evidenceCandidate,
        mapping,
      ),
    );
    } // end mappingsToProcess
  }

  const uniqueBlockers = [...new Set(blockers)];
  const serviceStatus =
    uniqueBlockers.length > 0
      ? uniqueBlockers[0]
      : "canonical_variable_candidates_ready";

  return createResult(
    input,
    serviceStatus,
    mappingDecisions,
    candidates,
    uniqueBlockers,
    {
      phase7InputRevalidation,
      explicitMappingDecisions,
      sourceContracts,
      sourceTraceContracts,
      evidenceSubfieldDerivationDecisions,
      canonicalEpistemicEnforcementDecisions,
      variableValueTypeBoundaries,
      routeStatusDecisions,
      gapFlagDecisions,
      c09ReceiverFeedbackBoundaries,
      criticalRouteVariableFamilies: buildCriticalRouteVariableFamilies(),
      b7NonDiagnosticGuards: [enforceB7NonDiagnosticGuard()],
      gatePrepBoundary: buildGatePrepBoundary(),
      supersessionRevisionDecisions: buildSupersessionRevisionDecisions(input),
      objectBindingReferenceBoundaries: buildObjectBindingReferenceBoundaries(input.canonical_variable_mappings),
      persistenceBoundary: buildPersistenceBoundary(),
      canonicalVariableAuditCandidates: buildCanonicalVariableAuditCandidates(
        input,
        candidates,
        uniqueBlockers,
        routeStatusDecisions,
        gapFlagDecisions,
        c09ReceiverFeedbackBoundaries,
      ),
      phase8Boundary: buildPhase8Boundary(routeStatusDecisions, gapFlagDecisions, candidates),
    },
  );
}

export const Runtime40_20CanonicalVariableService = {
  revalidatePhase6InputForPhase7,
  validateCanonicalVariableSourceContract,
  enforceExplicitMapping,
  validateCanonicalSourceTrace,
  deriveCanonicalVariableFromEvidenceOrSubfieldCandidate,
  enforceCanonicalVariableEpistemicStatus,
  validateCanonicalVariableValueTypeBoundary,
  buildCanonicalRouteStatusDecision,
  buildCanonicalGapFlagDecision,
  enforceC09ReceiverFeedbackCanonicalBoundary,
  buildCriticalRouteVariableFamilies,
  enforceB7NonDiagnosticGuard,
  buildGatePrepBoundary,
  buildSupersessionRevisionDecisions,
  buildObjectBindingReferenceBoundaries,
  buildPersistenceBoundary,
  buildCanonicalVariableAuditCandidates,
  buildPhase8Boundary,
  buildCanonicalVariableRecordCandidate: createCanonicalVariableRecordCandidate,
  buildPhase7FoundationLocalResult: createRuntime4020CanonicalVariableCandidatesLocal,
  buildPhase7DerivationEpistemicValueBoundaryLocalResult: createRuntime4020CanonicalVariableCandidatesLocal,
  buildPhase7RouteGapC09CriticalFamiliesLocalResult: createRuntime4020CanonicalVariableCandidatesLocal,
  buildPhase7GatePrepSupersessionObjectPersistenceAuditPhase8BoundaryLocalResult: createRuntime4020CanonicalVariableCandidatesLocal,
};

export function revalidatePhase6InputForPhase7(
  input: RuntimeCanonicalVariableServiceLocalInput,
): RuntimePhase7InputRevalidationDecision {
  const closeout = input.phase6_closeout ?? {
    phase6_closed_local: true,
    ready_for_phase7_authorization: true,
  };

  return {
    phase6_closed_local: closeout.phase6_closed_local === true,
    ready_for_phase7_authorization:
      closeout.ready_for_phase7_authorization === true,
    phase7_started_local:
      closeout.phase6_closed_local === true &&
      closeout.ready_for_phase7_authorization === true,
    phase7_closed_local: false,
    response_ingest_candidates_available: Boolean(input.ingest_result),
    runtime_subfield_response_candidates_available:
      input.ingest_result.subfield_response_candidates.length > 0,
    evidence_item_candidates_available:
      input.ingest_result.evidence_item_candidates.length > 0,
    provenance_epistemic_status_available:
      input.ingest_result.subfield_response_candidates.some(
        (candidate) =>
          Boolean(candidate.epistemic_status) && Boolean(candidate.provenance_type),
      ),
    source_trace_available:
      input.ingest_result.subfield_response_candidates.some((candidate) =>
        hasSourceTrace(candidate.source_trace),
      ),
    idempotency_contract_verified:
      input.ingest_result.idempotency_decision?.idempotency_key_present === true ||
      input.ingest_result.subfield_response_candidates.some((candidate) =>
        Boolean(candidate.idempotency_key),
      ),
    response_revision_contract_verified:
      input.ingest_result.revision_decision?.revision_number_present === true ||
      input.ingest_result.subfield_response_candidates.some(
        (candidate) => typeof candidate.response_revision_number === "number",
      ),
    c09_phase6_boundary_verified: Boolean(input.ingest_result.c09_receiver_feedback_boundary),
    evidence_recalculated: false,
    new_response_created: false,
    evidence_item_real_created: false,
    phase8_started: false,
  };
}

function getIngestBlocker(
  ingestResult: RuntimeResponseIngestLocalResult,
): RuntimeCanonicalVariableServiceStatus | undefined {
  if (!ingestResult.ok) return "blocked_ingest_not_ready";
  if (ingestResult.no_go_check.runtime_40_20_started !== false) {
    return "blocked_ingest_not_ready";
  }
  if (ingestResult.no_go_check.supabase_touched !== false) {
    return "blocked_ingest_not_ready";
  }
  if (ingestResult.no_go_check.sql_executed !== false) {
    return "blocked_ingest_not_ready";
  }
  if (ingestResult.no_go_check.endpoint_created !== false) {
    return "blocked_ingest_not_ready";
  }
  if (ingestResult.no_go_check.real_response_persisted !== false) {
    return "blocked_ingest_not_ready";
  }

  return undefined;
}

function findAllExactMappings(
  mappings: RuntimeCanonicalVariableMapCandidate[],
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
): RuntimeCanonicalVariableMapCandidate[] {
  return mappings.filter((mapping) => {
    const runtimeInteractionId = getStringMappingValue(mapping, "runtime_interaction_id");
    const subfieldName = getStringMappingValue(mapping, "subfield_name");

    return (
      runtimeInteractionId === subfieldCandidate.runtime_interaction_id &&
      subfieldName === subfieldCandidate.subfield_name
    );
  });
}

function getMappingStatus(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
): RuntimeCanonicalVariableMappingStatus {
  if (!mapping) return "blocked_missing_canonical_variable_mapping";
  if (
    !getStringMappingValue(mapping, "canonical_variable_id") ||
    !getCanonicalVariableName(mapping)
  ) {
    return "blocked_missing_canonical_variable_mapping";
  }
  if (!isEpistemicallyAllowed(subfieldCandidate, evidenceCandidate, mapping)) {
    return "blocked_epistemic_violation";
  }

  return "mapping_ready";
}

function validateCanonicalVariableSourceContract(
  mapping: RuntimeCanonicalVariableMapCandidate,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
): RuntimeCanonicalVariableSourceContract {
  const sourceNodeRef = getStringMappingValue(mapping, "source_node_ref") as string;
  const canonicalVariableName = getCanonicalVariableName(mapping) as string;
  const variableType =
    getStringMappingValue(mapping, "variable_type") ||
    getStringMappingValue(mapping, "expected_type") ||
    "string";

  return {
    canonical_variable_source_ref: [
      subfieldCandidate.runtime_interaction_id,
      subfieldCandidate.subfield_name,
      canonicalVariableName,
      "canonical_variable_source",
    ].join(":"),
    runtime_variable_map_ref: getStringMappingValue(mapping, "runtime_variable_map_ref"),
    runtime_interaction_mapping_ref: getStringMappingValue(
      mapping,
      "runtime_interaction_mapping_ref",
    ),
    source_node_ref: sourceNodeRef,
    runtime_interaction_id: subfieldCandidate.runtime_interaction_id,
    subfield_name: subfieldCandidate.subfield_name,
    canonical_variable_name: canonicalVariableName,
    variable_type: variableType,
    mapping_role: getStringMappingValue(mapping, "mapping_role"),
    required_status: getRequiredStatus(mapping),
    route_id: mapping.route_id,
    critical_route_ref: getStringMappingValue(mapping, "critical_route_ref"),
    expected_source_evidence_refs: getStringArrayMappingValue(
      mapping,
      "expected_source_evidence_refs",
    ),
    expected_response_refs: getStringArrayMappingValue(mapping, "expected_response_refs"),
    explicit_mapping_present: hasExplicitMapping(mapping),
    free_text_mapping_used: false,
    similarity_mapping_used: false,
    name_similarity_mapping_used: false,
  };
}

function enforceExplicitMapping(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
): RuntimeCanonicalExplicitMappingDecision {
  const blockingReasons = [];
  const explicitMappingPresent = Boolean(mapping && hasExplicitMapping(mapping));
  const subfieldRequired = Boolean(subfieldCandidate.subfield_name);

  if (!explicitMappingPresent) blockingReasons.push("missing_explicit_mapping");
  if (!mapping || !getStringMappingValue(mapping, "source_node_ref")) {
    blockingReasons.push("missing_source_node_ref");
  }
  if (!mapping || !getStringMappingValue(mapping, "runtime_interaction_id")) {
    blockingReasons.push("missing_runtime_interaction_id");
  }
  if (subfieldRequired && (!mapping || !getStringMappingValue(mapping, "subfield_name"))) {
    blockingReasons.push("missing_subfield_name");
  }
  if (!mapping || !getCanonicalVariableName(mapping)) {
    blockingReasons.push("missing_canonical_variable_name");
  }
  if (mapping && requiresMappingRole(mapping) && !getStringMappingValue(mapping, "mapping_role")) {
    blockingReasons.push("missing_mapping_role");
  }
  if (!hasSourceTrace(subfieldCandidate.source_trace)) {
    blockingReasons.push("missing_source_trace");
  }
  if (!evidenceCandidate?.evidence_item_ref) {
    blockingReasons.push("missing_source_evidence");
  }
  if (getBooleanMappingValue(mapping, "similarity_mapping_used")) {
    blockingReasons.push("similarity_mapping_detected");
  }
  if (getBooleanMappingValue(mapping, "name_similarity_mapping_used")) {
    blockingReasons.push("name_similarity_mapping_detected");
  }
  if (getBooleanMappingValue(mapping, "free_text_mapping_used")) {
    blockingReasons.push("free_text_mapping_detected");
  }
  if (getBooleanMappingValue(mapping, "receiver_feedback_from_satisfaction")) {
    blockingReasons.push("receiver_feedback_from_satisfaction_detected");
  }

  return {
    explicit_mapping_required: true,
    explicit_mapping_present: explicitMappingPresent,
    source_node_ref_present: Boolean(mapping && getStringMappingValue(mapping, "source_node_ref")),
    runtime_interaction_id_present: Boolean(
      mapping && getStringMappingValue(mapping, "runtime_interaction_id"),
    ),
    subfield_name_required: subfieldRequired,
    subfield_name_present: Boolean(mapping && getStringMappingValue(mapping, "subfield_name")),
    canonical_variable_name_present: Boolean(mapping && getCanonicalVariableName(mapping)),
    mapping_role_present_when_required:
      !mapping || !requiresMappingRole(mapping) || Boolean(getStringMappingValue(mapping, "mapping_role")),
    source_trace_present: hasSourceTrace(subfieldCandidate.source_trace),
    source_evidence_present: Boolean(evidenceCandidate?.evidence_item_ref),
    similarity_mapping_blocked: true,
    name_similarity_mapping_blocked: true,
    free_text_mapping_blocked: true,
    receiver_feedback_from_satisfaction_blocked: true,
    mapping_violation_candidate_created: blockingReasons.length > 0,
    canonical_variable_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons as RuntimeCanonicalExplicitMappingDecision["blocking_reasons"],
  };
}

function validateCanonicalSourceTrace(
  mapping: RuntimeCanonicalVariableMapCandidate,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
): RuntimeCanonicalSourceTraceContract {
  const rawRow = mapping.raw_row ?? {};
  const sourceTrace = subfieldCandidate.source_trace as unknown as Record<string, unknown>;

  return {
    source_ref: getFirstString(sourceTrace.source_refs) ?? getStringMappingValue(mapping, "source_ref"),
    source_document: mapping.source_document ?? (sourceTrace.source_document as string),
    source_sheet: mapping.source_sheet ?? (sourceTrace.source_sheet as string),
    source_row_number: mapping.source_row_number ?? (sourceTrace.source_row_number as number),
    raw_row: rawRow,
    raw_row_preserved_internally: true,
    source_node_id:
      getStringMappingValue(mapping, "source_node_id") ||
      getStringMappingValue(mapping, "source_node_ref"),
    source_code:
      getStringMappingValue(mapping, "source_code") ||
      getFirstString(sourceTrace.source_codes),
    source_block: getStringMappingValue(mapping, "source_block"),
    runtime_interaction_id: subfieldCandidate.runtime_interaction_id,
    runtime_interaction_mapping_ref: getStringMappingValue(
      mapping,
      "runtime_interaction_mapping_ref",
    ),
    response_ref: getStringMappingValue(mapping, "response_ref"),
    subfield_response_ref: subfieldCandidate.subfield_response_ref,
    evidence_item_ref: evidenceCandidate?.evidence_item_ref,
    mapping_checksum: getStringMappingValue(mapping, "mapping_checksum"),
    source_trace_fabricated: false,
  };
}

function deriveCanonicalVariableFromEvidenceOrSubfieldCandidate(
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
  subfieldCandidate: RuntimeSubfieldResponseCandidate | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalEvidenceSubfieldDerivationDecision {
  const blockingReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [];
  const subfieldRecord = subfieldCandidate as unknown as Record<string, unknown> | undefined;
  const evidenceRecord = evidenceCandidate as unknown as Record<string, unknown> | undefined;

  if (!evidenceCandidate && !subfieldCandidate) {
    blockingReasons.push("missing_governed_evidence_or_subfield_candidate");
  }
  if (!isPresent(subfieldCandidate?.value)) {
    blockingReasons.push("absent_response_detected");
  }
  if (mapping?.required === true && !subfieldCandidate?.subfield_name) {
    blockingReasons.push("missing_required_subfield");
  }
  if (subfieldRecord?.pending_microconfirmation === true) {
    blockingReasons.push("pending_microconfirmation_detected");
  }
  if (subfieldRecord?.review_gap === true || evidenceRecord?.review_gap === true) {
    blockingReasons.push("review_gap_detected");
  }
  if (!hasSourceTrace(subfieldCandidate?.source_trace)) {
    blockingReasons.push("missing_source_trace");
  }

  return {
    evidence_item_candidate_used: Boolean(evidenceCandidate?.evidence_candidate_allowed),
    runtime_subfield_response_candidate_used: Boolean(subfieldCandidate),
    literal_answer_preserved:
      isPresent(evidenceCandidate?.literal_answer) || isPresent(evidenceCandidate?.literal_value),
    normalized_value_preserved_when_present:
      !("normalized_value" in (evidenceRecord ?? {})) || isPresent(evidenceRecord?.normalized_value),
    epistemic_status_preserved: Boolean(subfieldCandidate?.epistemic_status),
    provenance_type_preserved: Boolean(subfieldCandidate?.provenance_type),
    confidence_preserved_when_present:
      !("confidence" in (evidenceRecord ?? {})) || isPresent(evidenceRecord?.confidence),
    source_ref_preserved:
      !("source_ref" in (evidenceRecord ?? {})) || typeof evidenceRecord?.source_ref === "string",
    source_trace_preserved: hasSourceTrace(subfieldCandidate?.source_trace),
    derived_from_response_ids_preserved: Boolean(mapping),
    derived_from_subfield_response_ids_preserved: Boolean(subfieldCandidate?.subfield_response_ref),
    source_evidence_item_ids_preserved: Boolean(evidenceCandidate?.evidence_item_ref),
    absent_response_used_as_variable: false,
    missing_subfield_used_as_variable: false,
    pending_microconfirmation_used_as_variable: false,
    review_gap_used_as_variable: false,
    ai_inference_hardened: false,
    canonical_variable_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function enforceCanonicalVariableEpistemicStatus(
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalEpistemicEnforcementDecision {
  const blockingReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [];
  const subfieldRecord = subfieldCandidate as unknown as Record<string, unknown>;
  const evidenceRecord = evidenceCandidate as unknown as Record<string, unknown> | undefined;
  const epistemicBasis = getFirstStringValue(
    subfieldRecord.epistemic_basis,
    evidenceRecord?.epistemic_basis,
    getStringMappingValueOrUndefined(mapping, "epistemic_basis"),
  );
  const derivationRuleRef = getFirstStringValue(
    subfieldRecord.derivation_rule_ref,
    evidenceRecord?.derivation_rule_ref,
    getStringMappingValueOrUndefined(mapping, "derivation_rule_ref"),
  );
  const confirmationReferencePresent = Boolean(
    getFirstStringValue(
      subfieldRecord.confirmation_reference,
      evidenceRecord?.confirmation_reference,
      getStringMappingValueOrUndefined(mapping, "confirmation_reference"),
    ),
  );
  const correctionReferencePresent = Boolean(
    getFirstStringValue(
      subfieldRecord.correction_reference,
      subfieldRecord.supersedes_response_ref,
      evidenceRecord?.correction_reference,
      evidenceRecord?.supersedes_response_ref,
      getStringMappingValueOrUndefined(mapping, "correction_reference"),
      getStringMappingValueOrUndefined(mapping, "supersedes_response_ref"),
    ),
  );
  const derivedFromRefsPresent =
    hasNonEmptyArray(subfieldRecord.derived_from_refs) ||
    hasNonEmptyArray(subfieldCandidate.source_trace?.raw_row?.derived_from_refs) ||
    hasNonEmptyArray(mapping?.raw_row?.derived_from_refs) ||
    getStringArrayMappingValueOrEmpty(mapping, "derived_from_refs").length > 0;

  const capturedUserEvidenceAllowed =
    subfieldCandidate.epistemic_status !== "captured_user_evidence" ||
    subfieldCandidate.provenance_type === "user_answer";
  const userConfirmedSuggestionAllowed =
    subfieldCandidate.epistemic_status !== "user_confirmed_suggestion" ||
    (subfieldCandidate.provenance_type === "user_confirmation" && confirmationReferencePresent);
  const userCorrectedEvidenceAllowed =
    subfieldCandidate.epistemic_status !== "user_corrected_evidence" ||
    (subfieldCandidate.provenance_type === "user_correction" && correctionReferencePresent);
  const canonicalDerivationAllowed =
    subfieldCandidate.epistemic_status !== "canonical_derivation" ||
    (
      subfieldCandidate.provenance_type === "canonical_derivation" &&
      derivedFromRefsPresent &&
      Boolean(derivationRuleRef)
    );

  if (!capturedUserEvidenceAllowed) blockingReasons.push("provenance_type_mismatch");
  if (!userConfirmedSuggestionAllowed) blockingReasons.push("provenance_type_mismatch");
  if (!userCorrectedEvidenceAllowed) blockingReasons.push("provenance_type_mismatch");
  if (subfieldCandidate.epistemic_status === "canonical_derivation" && !derivedFromRefsPresent) {
    blockingReasons.push("missing_derived_from_refs");
  }
  if (subfieldCandidate.epistemic_status === "canonical_derivation" && !derivationRuleRef) {
    blockingReasons.push("missing_derivation_rule_ref");
  }
  if (
    subfieldCandidate.epistemic_status === "internal_calculated" &&
    subfieldCandidate.provenance_type === "user_answer"
  ) {
    blockingReasons.push("internal_calculated_used_as_user_answer");
  }
  if (
    subfieldCandidate.epistemic_status === "internal_calculated" &&
    subfieldCandidate.provenance_type !== "internal_calculation"
  ) {
    blockingReasons.push("provenance_type_mismatch");
  }
  if (
    subfieldCandidate.epistemic_status === "ai_inferred_unconfirmed" &&
    evidenceCandidate?.hard_evidence === true
  ) {
    blockingReasons.push("ai_inference_hardening_detected");
  }

  return {
    epistemic_status: subfieldCandidate.epistemic_status,
    provenance_type: subfieldCandidate.provenance_type,
    epistemic_basis: epistemicBasis,
    derivation_rule_ref: derivationRuleRef,
    confirmation_reference_present: confirmationReferencePresent,
    correction_reference_present: correctionReferencePresent,
    derived_from_refs_present: derivedFromRefsPresent,
    captured_user_evidence_allowed: capturedUserEvidenceAllowed,
    user_confirmed_suggestion_allowed: userConfirmedSuggestionAllowed,
    user_corrected_evidence_allowed: userCorrectedEvidenceAllowed,
    canonical_derivation_allowed: canonicalDerivationAllowed,
    internal_calculated_allowed_as_user_answer: false,
    ai_inferred_unconfirmed_hard_evidence: false,
    canonical_variable_epistemic_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function validateCanonicalVariableValueTypeBoundary(
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalVariableValueTypeBoundary {
  const blockingReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [];
  const value = subfieldCandidate.value;
  const evidenceRecord = evidenceCandidate as unknown as Record<string, unknown> | undefined;
  const expectedType = normalizeExpectedType(
    getStringMappingValueOrUndefined(mapping, "expected_type") ||
    getStringMappingValueOrUndefined(mapping, "variable_type") ||
    subfieldCandidate.expected_type,
  );
  const enumOptions = getStringArrayMappingValueOrEmpty(mapping, "enum_options");
  const valuePresent = isPresent(value);
  const valueCompatible = valuePresent && isValueCompatibleWithExpectedType(value, expectedType, enumOptions);

  if (!valuePresent) blockingReasons.push("missing_value_inferred");
  if (valuePresent && !valueCompatible) {
    blockingReasons.push(expectedType === "enum" ? "enum_value_not_allowed" : "variable_value_type_mismatch");
  }
  if (typeof value === "string" && (expectedType === "number" || expectedType === "date")) {
    blockingReasons.push(
      expectedType === "number"
        ? "unauthorized_type_conversion_detected"
        : "unauthorized_date_parse_detected",
    );
  }
  if (typeof value === "string" && getBooleanMappingValue(mapping, "object_collapsed_to_text")) {
    blockingReasons.push("object_or_array_collapsed_to_text");
  }

  return {
    variable_value_present: valuePresent,
    literal_value_preserved: isPresent(evidenceCandidate?.literal_value) || isPresent(value),
    normalized_value_used_when_authorized:
      !("normalized_value" in (evidenceRecord ?? {})) ||
      getBooleanMappingValue(mapping, "normalized_value_authorized") === true,
    variable_type: getStringMappingValueOrUndefined(mapping, "variable_type") ?? expectedType,
    expected_type: expectedType,
    enum_options_present: enumOptions.length > 0,
    value_type_compatible: valueCompatible,
    string_to_number_auto_conversion_used: false,
    date_auto_parse_used: false,
    object_collapsed_to_text: false,
    array_collapsed_to_text: false,
    missing_value_inferred: false,
    type_boundary_passed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function buildCanonicalRouteStatusDecision(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  evidenceCandidate?: RuntimeEvidenceItemCandidate,
): RuntimeCanonicalRouteStatusDecision {
  const blockingReasons: RuntimeCanonicalRouteGapBlockingReason[] = [];
  const routeStatus = normalizeRouteStatus(getStringMappingValueOrUndefined(mapping, "route_status"));
  const canonicalEvidencePresent = Boolean(evidenceCandidate?.evidence_candidate_allowed);
  const routeStatusReason = getStringMappingValueOrUndefined(mapping, "route_status_reason");
  const routeStatusSourceTrace =
    getRecordMappingValue(mapping, "route_status_source_trace") ??
    (mapping ? createMappingSourceTrace(mapping) : undefined);

  if ((routeStatus === "closed" || routeStatus === "closed_with_flags") && !canonicalEvidencePresent) {
    blockingReasons.push("route_closed_without_canonical_evidence");
  }
  if ((routeStatus === "closed" || routeStatus === "closed_with_flags") && !routeStatusSourceTrace) {
    blockingReasons.push("route_status_source_trace_missing");
  }
  if (getBooleanMappingValue(mapping, "gate_execution_attempted")) {
    blockingReasons.push("gate_execution_attempted");
  }

  return {
    route_id: mapping?.route_id,
    critical_route_ref: getStringMappingValueOrUndefined(mapping, "critical_route_ref"),
    route_status: routeStatus,
    route_status_reason: routeStatusReason,
    route_status_source_trace: routeStatusSourceTrace,
    canonical_evidence_present: canonicalEvidencePresent,
    route_closed_without_canonical_evidence: false,
    critical_route_gate_executed: false,
    mmabp_gate_engine_executed: false,
    readiness_engine_executed: false,
    route_status_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function buildCanonicalGapFlagDecision(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalGapFlagDecision {
  const blockingReasons: RuntimeCanonicalRouteGapBlockingReason[] = [];
  const gapFlag = getBooleanMappingValue(mapping, "gap_flag");
  const gapType = normalizeGapType(getStringMappingValueOrUndefined(mapping, "gap_type"));
  const gapSourceTrace =
    getRecordMappingValue(mapping, "gap_source_trace") ??
    (mapping ? createMappingSourceTrace(mapping) : undefined);

  if (gapFlag && gapType === "none") blockingReasons.push("gap_type_missing");
  if (getBooleanMappingValue(mapping, "gap_hidden_as_closed_variable")) {
    blockingReasons.push("gap_hidden_as_closed_variable");
  }
  if ((gapFlag || gapType !== "none") && !gapSourceTrace) {
    blockingReasons.push("gap_source_trace_missing");
  }

  return {
    gap_flag: gapFlag,
    gap_type: gapType,
    gap_reason: getStringMappingValueOrUndefined(mapping, "gap_reason"),
    gap_source_trace: gapSourceTrace,
    gap_carried_forward_allowed: getBooleanMappingValue(mapping, "gap_carried_forward_allowed"),
    gap_hidden_as_closed_variable: false,
    readiness_engine_executed: false,
    readiness_decision_record_created: false,
    gap_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function enforceC09ReceiverFeedbackCanonicalBoundary(
  c09Boundary: RuntimeResponseIngestLocalResult["c09_receiver_feedback_boundary"] | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalC09ReceiverFeedbackBoundary {
  const blockingReasons: RuntimeCanonicalRouteGapBlockingReason[] = [];
  const receiverFeedbackFromSatisfaction =
    getBooleanMappingValue(mapping, "receiver_feedback_from_satisfaction") ||
    Boolean(c09Boundary?.receiver_feedback_inferred_from_satisfaction);
  const receiverFeedbackFromAmbiguousComment =
    getBooleanMappingValue(mapping, "receiver_feedback_from_ambiguous_comment") ||
    Boolean(c09Boundary?.receiver_feedback_inferred_from_ambiguous_comment);
  const c09ClosedByWrongRoute = getBooleanMappingValue(mapping, "c09_closed_by_wrong_route");

  if (receiverFeedbackFromSatisfaction) {
    blockingReasons.push("receiver_feedback_from_satisfaction_detected");
  }
  if (receiverFeedbackFromAmbiguousComment) {
    blockingReasons.push("receiver_feedback_from_ambiguous_comment_detected");
  }
  if (c09ClosedByWrongRoute) blockingReasons.push("c09_closed_by_wrong_route");

  return {
    receiver_feedback_exists: c09Boundary?.receiver_feedback_exists ?? false,
    receiver_feedback: c09Boundary?.receiver_feedback,
    receiver_feedback_gap_flag: c09Boundary?.gap_flag ?? false,
    receiver_feedback_route_missing: c09Boundary?.route_missing ?? false,
    receiver_satisfaction_separated: true,
    delivery_failure_separated: true,
    cr_b3_r9_route_status: normalizeRouteStatus(
      getStringMappingValueOrUndefined(mapping, "cr_b3_r9_route_status"),
    ),
    required_if_condition: getStringMappingValueOrUndefined(mapping, "required_if_condition"),
    feedback_source_trace:
      c09Boundary?.feedback_source_trace ??
      getRecordMappingValue(mapping, "feedback_source_trace"),
    receiver_feedback_from_satisfaction: false,
    receiver_feedback_from_ambiguous_comment: false,
    c09_closed_by_wrong_route: false,
    route_missing_preserved_when_no_canonical_route:
      c09Boundary?.route_missing_preserved_when_no_canonical_route ??
      c09Boundary?.route_missing ??
      false,
    canonical_variable_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function buildCriticalRouteVariableFamilies(): RuntimeCanonicalCriticalRouteVariableFamily[] {
  return [
    createCriticalRouteVariableFamily("B0_semantic_entry", "B0 semantic entry", "CR-B0", [
      "activity_anchor",
      "action_verb",
      "input_or_object",
      "procedure_or_standard",
      "output_or_result",
    ]),
    createCriticalRouteVariableFamily("B2_transformation_exception", "B2 transformation exception", "CR-B2", [
      "transformation_exception_type",
      "transformation_exception_exists",
      "transformation_exception_description",
      "transformation_exception_route_unresolved",
    ]),
    createCriticalRouteVariableFamily("B3_receiver_feedback", "B3 receiver feedback", "CR-B3-R9", [
      "receiver_satisfaction",
      "receiver_feedback_exists",
      "receiver_feedback",
      "receiver_feedback_gap_flag",
      "receiver_feedback_route_missing",
    ]),
    createCriticalRouteVariableFamily("B7_preclassification_boundary", "B7 preclassification boundary", "CR-B7", [
      "preclassification_signal",
      "confidence",
      "uncertainty",
      "microconfirmation_refs",
      "non_diagnostic_boundary",
    ]),
  ];
}

function enforceB7NonDiagnosticGuard(options?: {
  elevation_attempted?: boolean;
}): RuntimeCanonicalB7NonDiagnosticGuard {
  const elevationAttempted = options?.elevation_attempted === true;
  return {
    b7_q39_non_diagnostic: true,
    b7_q40_non_diagnostic: true,
    c20_non_diagnostic: true,
    signal_status: "preclassification_only",
    diagnostic_status: "non_diagnostic",
    manual_review_required_if_elevation_attempted: elevationAttempted,
    transduction_blocker_active: elevationAttempted,
    vsm_ahe_final_created: false,
    moc_direct_created: false,
    ir_direct_created: false,
    registry_created: false,
    export_created: false,
    diagnosis_created: false,
    b7_diagnostic_transduction_blocked: true,
    blocking_reasons: elevationAttempted ? ["b7_diagnostic_transduction_attempted"] : [],
  };
}

function buildGatePrepBoundary(options?: {
  gate_execution_attempted?: boolean;
  semantic_resolution_event_creation_attempted?: boolean;
  process_state_timer_event_creation_attempted?: boolean;
  reentry_open_attempted?: boolean;
  readiness_decision_record_creation_attempted?: boolean;
}): RuntimeCanonicalGatePrepBoundary {
  const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
  if (options?.gate_execution_attempted) blockingReasons.push("gate_execution_attempted");
  if (options?.semantic_resolution_event_creation_attempted) {
    blockingReasons.push("semantic_resolution_event_creation_attempted");
  }
  if (options?.process_state_timer_event_creation_attempted) {
    blockingReasons.push("process_state_timer_event_creation_attempted");
  }
  if (options?.reentry_open_attempted) blockingReasons.push("reentry_open_attempted");
  if (options?.readiness_decision_record_creation_attempted) {
    blockingReasons.push("readiness_decision_record_creation_attempted");
  }

  return {
    variables_prepared_for_critical_route_gate_future: true,
    variables_prepared_for_mmabp_gate_engine_future: true,
    route_status_prepared_for_readiness_future: true,
    gap_flag_prepared_for_readiness_future: true,
    critical_route_gate_executed: false,
    mmabp_gate_engine_executed: false,
    readiness_engine_executed: false,
    readiness_decision_record_created: false,
    semantic_resolution_event_created: false,
    process_state_timer_event_created: false,
    reentry_opened: false,
    gate_prep_candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function buildSupersessionRevisionDecisions(
  input: RuntimeCanonicalVariableServiceLocalInput,
): RuntimeCanonicalSupersessionRevisionDecision[] {
  const revisionRecord = input.ingest_result.revision_decision as Record<string, unknown> | undefined;
  const responseRevisionNumber =
    typeof revisionRecord?.response_revision_number === "number"
      ? revisionRecord.response_revision_number
      : undefined;
  const supersedesResponseRef =
    getFirstStringValue(
      revisionRecord?.supersedes_response_ref,
      revisionRecord?.supersedes_response_ref_inherited,
    );

  return input.canonical_variable_mappings.map((mapping) => {
    const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
    const invalidatedAt = getStringMappingValue(mapping, "invalidated_at");
    const invalidationReason = getStringMappingValue(mapping, "invalidation_reason");
    const supersedesCanonicalVariableRef = getStringMappingValue(
      mapping,
      "supersedes_canonical_variable_ref",
    );
    const previousVariableRef = getStringMappingValue(mapping, "previous_variable_ref");
    const previousVariableDeletedWithoutTrace = getBooleanMappingValue(
      mapping,
      "previous_variable_deleted_without_trace",
    );

    if (invalidatedAt && !invalidationReason) {
      blockingReasons.push("invalidated_at_without_reason");
    }
    if (previousVariableDeletedWithoutTrace) {
      blockingReasons.push("untraced_variable_overwrite_attempted");
    }
    if (getBooleanMappingValue(mapping, "global_recomputation_attempted")) {
      blockingReasons.push("global_recomputation_attempted");
    }
    if (
      getBooleanMappingValue(mapping, "supersession_attempted") &&
      !supersedesCanonicalVariableRef &&
      !supersedesResponseRef
    ) {
      blockingReasons.push("missing_explicit_supersession_ref");
    }

    return {
      response_revision_number_inherited: responseRevisionNumber,
      supersedes_response_ref_inherited: supersedesResponseRef,
      supersedes_canonical_variable_ref: supersedesCanonicalVariableRef,
      previous_variable_ref_preserved: previousVariableRef,
      invalidated_at: invalidatedAt,
      invalidation_reason: invalidationReason,
      correction_dominates_prior_inference: true,
      previous_variable_deleted_without_trace: false,
      global_recomputation_executed: false,
      supersession_audit_candidate_created:
        Boolean(supersedesResponseRef || supersedesCanonicalVariableRef || invalidatedAt || previousVariableRef),
      revision_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

function buildObjectBindingReferenceBoundaries(
  mappings: RuntimeCanonicalVariableMapCandidate[],
): RuntimeCanonicalObjectBindingReferenceBoundary[] {
  return mappings.map((mapping) => {
    const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
    if (getBooleanMappingValue(mapping, "object_inventory_creation_attempted")) {
      blockingReasons.push("object_inventory_creation_attempted");
    }
    if (getBooleanMappingValue(mapping, "object_materialization_attempted")) {
      blockingReasons.push("object_materialization_attempted");
    }
    if (getBooleanMappingValue(mapping, "eve_object_definition_modification_attempted")) {
      blockingReasons.push("eve_object_definition_modification_attempted");
    }
    if (getBooleanMappingValue(mapping, "object_materialization_event_creation_attempted")) {
      blockingReasons.push("object_materialization_event_creation_attempted");
    }

    const objectBindingStatus = getStringMappingValue(mapping, "object_binding_status");
    const runtimeObjectBindingRef = getStringMappingValue(mapping, "runtime_object_binding_ref");
    const protectedObjectHint = getStringMappingValue(mapping, "protected_object_hint");
    const candidateObjectRef = getStringMappingValue(mapping, "candidate_object_ref");

    return {
      object_binding_status: objectBindingStatus,
      runtime_object_binding_ref: runtimeObjectBindingRef,
      protected_object_hint: protectedObjectHint,
      candidate_object_ref: candidateObjectRef,
      object_inventory_created: false,
      live_object_materialized: false,
      eve_object_definition_modified: false,
      object_materialization_event_created: false,
      object_refs_preserved_for_future_phase: Boolean(
        objectBindingStatus || runtimeObjectBindingRef || protectedObjectHint || candidateObjectRef,
      ),
      object_binding_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

function buildPersistenceBoundary(options?: {
  canonical_persistence_boundary_violation?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_attempted?: boolean;
  scene_write_attempted?: boolean;
  mba_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
}): RuntimeCanonicalPersistenceBoundary {
  const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
  if (options?.canonical_persistence_boundary_violation) {
    blockingReasons.push("canonical_persistence_boundary_violation");
  }
  if (options?.supabase_touch_attempted) blockingReasons.push("supabase_touch_attempted");
  if (options?.sql_execution_attempted) blockingReasons.push("sql_execution_attempted");
  if (options?.endpoint_creation_attempted) blockingReasons.push("endpoint_creation_attempted");
  if (options?.service_role_client_attempted) blockingReasons.push("service_role_client_attempted");
  if (options?.scene_write_attempted) blockingReasons.push("scene_write_attempted");
  if (options?.mba_write_attempted) blockingReasons.push("mba_write_attempted");
  if (options?.parallel_production_runtime_artifacts_write_attempted) {
    blockingReasons.push("parallel_production_runtime_artifacts_write_attempted");
  }

  return {
    local_canonical_variable_record_candidate_mode: true,
    db_write_authorized: false,
    canonical_variable_record_real_created: false,
    supabase_touch_authorized: false,
    sql_execution_authorized: false,
    endpoint_creation_authorized: false,
    service_role_used: false,
    service_role_used_in_client: false,
    scene_write_detected: false,
    mba_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    export_preview_created: false,
    persistence_boundary_passed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function buildCanonicalVariableAuditCandidates(
  input: RuntimeCanonicalVariableServiceLocalInput,
  candidates: RuntimeCanonicalVariableRecordCandidate[],
  blockers: RuntimeCanonicalVariableServiceStatus[],
  routeStatusDecisions: RuntimeCanonicalRouteStatusDecision[] = [],
  gapFlagDecisions: RuntimeCanonicalGapFlagDecision[] = [],
  c09Boundaries: RuntimeCanonicalC09ReceiverFeedbackBoundary[] = [],
): RuntimeCanonicalVariableAuditActionCandidate[] {
  const actions: RuntimeCanonicalVariableAuditCandidateAction[] = [
    "canonical_variable_candidate_created",
    "canonical_variable_candidate_blocked",
    "explicit_mapping_verified",
    "mapping_similarity_blocked",
    "source_trace_missing_blocked",
    "route_status_assigned",
    "gap_flag_assigned",
    "receiver_feedback_from_satisfaction_blocked",
    "variable_superseded",
    "variable_invalidated",
    "canonical_derivation_registered",
    "gate_execution_attempt_blocked",
    "persistence_boundary_violation_blocked",
    "phase8_execution_attempt_blocked",
  ];
  const firstCandidate = candidates[0];
  const firstMapping = input.canonical_variable_mappings[0];
  const sourceTrace = firstMapping ? createMappingSourceTrace(firstMapping) : undefined;
  const blocked = blockers.length > 0;

  return actions.map((action) => ({
    audit_candidate_ref: `${input.case_id}:${action}:audit_candidate`,
    audit_action: action,
    case_id: input.case_id,
    canonical_variable_candidate_ref: firstCandidate?.canonical_variable_candidate_ref,
    runtime_interaction_id: firstCandidate?.runtime_interaction_id ?? getStringMappingValueOrUndefined(firstMapping, "runtime_interaction_id"),
    source_trace: sourceTrace,
    blocking_reasons: getAuditActionBlockingReasons(
      action,
      blocked,
      routeStatusDecisions,
      gapFlagDecisions,
      c09Boundaries,
    ),
    created_at_preview: "local-preview",
    real_runtime_audit_trail_created: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
  }));
}

function getAuditActionBlockingReasons(
  action: RuntimeCanonicalVariableAuditCandidateAction,
  blocked: boolean,
  routeStatusDecisions: RuntimeCanonicalRouteStatusDecision[],
  gapFlagDecisions: RuntimeCanonicalGapFlagDecision[],
  c09Boundaries: RuntimeCanonicalC09ReceiverFeedbackBoundary[],
): RuntimeCanonicalPhase7DBoundaryBlockingReason[] {
  if (action === "canonical_variable_candidate_blocked" && blocked) {
    return ["canonical_persistence_boundary_violation"];
  }
  if (
    action === "gate_execution_attempt_blocked" &&
    routeStatusDecisions.some((decision) => decision.blocking_reasons.includes("gate_execution_attempted"))
  ) {
    return ["gate_execution_attempted"];
  }
  if (
    action === "receiver_feedback_from_satisfaction_blocked" &&
    c09Boundaries.some((boundary) =>
      boundary.blocking_reasons.includes("receiver_feedback_from_satisfaction_detected"),
    )
  ) {
    return ["canonical_persistence_boundary_violation"];
  }
  if (
    action === "persistence_boundary_violation_blocked" &&
    gapFlagDecisions.some((decision) => decision.blocking_reasons.includes("gap_hidden_as_closed_variable"))
  ) {
    return ["canonical_persistence_boundary_violation"];
  }
  if (action === "phase8_execution_attempt_blocked") {
    return [];
  }
  return [];
}

function buildPhase8Boundary(
  routeStatusDecisions: RuntimeCanonicalRouteStatusDecision[] = [],
  gapFlagDecisions: RuntimeCanonicalGapFlagDecision[] = [],
  candidates: RuntimeCanonicalVariableRecordCandidate[] = [],
  options?: {
    phase8_execution_attempted?: boolean;
    trigger_evaluation_attempted?: boolean;
    causal_score_calculation_attempted?: boolean;
    reentry_open_attempted?: boolean;
    branching_decision_creation_attempted?: boolean;
    budget_ledger_update_attempted?: boolean;
    causal_activity_open_attempted?: boolean;
  },
): RuntimeCanonicalPhase8Boundary {
  const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
  if (options?.phase8_execution_attempted) blockingReasons.push("phase8_execution_attempted");
  if (options?.trigger_evaluation_attempted) blockingReasons.push("trigger_evaluation_attempted");
  if (options?.causal_score_calculation_attempted) blockingReasons.push("causal_score_calculation_attempted");
  if (options?.reentry_open_attempted) blockingReasons.push("reentry_open_attempted");
  if (options?.branching_decision_creation_attempted) {
    blockingReasons.push("branching_decision_creation_attempted");
  }
  if (options?.budget_ledger_update_attempted) blockingReasons.push("budget_ledger_update_attempted");
  if (options?.causal_activity_open_attempted) blockingReasons.push("causal_activity_open_attempted");

  return {
    variables_ready_for_future_branching: candidates.length > 0,
    gaps_ready_for_future_branching: gapFlagDecisions.length > 0,
    route_status_ready_for_future_triggers: routeStatusDecisions.length > 0,
    triggers_evaluated: false,
    causal_score_calculated: false,
    reentry_opened: false,
    branching_decision_created: false,
    budget_ledger_updated: false,
    branching_engine_executed: false,
    causal_activities_opened: false,
    causal_budget_exceeded: false,
    phase8_started: false,
    phase8_boundary_passed: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
  };
}

function collectPhase7DBoundaryBlockingReasons(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
): RuntimeCanonicalPhase7DBoundaryBlockingReason[] {
  if (!mapping) return [];
  const blockingReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [];
  const flagMap: Array<[string, RuntimeCanonicalPhase7DBoundaryBlockingReason]> = [
    ["global_recomputation_attempted", "global_recomputation_attempted"],
    ["previous_variable_deleted_without_trace", "untraced_variable_overwrite_attempted"],
    ["object_inventory_creation_attempted", "object_inventory_creation_attempted"],
    ["object_materialization_attempted", "object_materialization_attempted"],
    ["eve_object_definition_modification_attempted", "eve_object_definition_modification_attempted"],
    ["object_materialization_event_creation_attempted", "object_materialization_event_creation_attempted"],
    ["canonical_persistence_boundary_violation", "canonical_persistence_boundary_violation"],
    ["supabase_touch_attempted", "supabase_touch_attempted"],
    ["sql_execution_attempted", "sql_execution_attempted"],
    ["endpoint_creation_attempted", "endpoint_creation_attempted"],
    ["service_role_client_attempted", "service_role_client_attempted"],
    ["scene_write_attempted", "scene_write_attempted"],
    ["mba_write_attempted", "mba_write_attempted"],
    [
      "parallel_production_runtime_artifacts_write_attempted",
      "parallel_production_runtime_artifacts_write_attempted",
    ],
    ["audit_trail_real_creation_attempted", "audit_trail_real_creation_attempted"],
    ["phase8_execution_attempted", "phase8_execution_attempted"],
    ["trigger_evaluation_attempted", "trigger_evaluation_attempted"],
    ["causal_score_calculation_attempted", "causal_score_calculation_attempted"],
    ["branching_decision_creation_attempted", "branching_decision_creation_attempted"],
    ["budget_ledger_update_attempted", "budget_ledger_update_attempted"],
    ["causal_activity_open_attempted", "causal_activity_open_attempted"],
  ];
  for (const [key, reason] of flagMap) {
    if (getBooleanMappingValue(mapping, key)) blockingReasons.push(reason);
  }
  if (getStringMappingValue(mapping, "invalidated_at") && !getStringMappingValue(mapping, "invalidation_reason")) {
    blockingReasons.push("invalidated_at_without_reason");
  }
  return blockingReasons;
}

function isEpistemicallyAllowed(
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate,
): boolean {
  if (subfieldCandidate.epistemic_status === "canonical_derivation") {
    return hasDerivationSupport(subfieldCandidate, mapping);
  }
  if (subfieldCandidate.epistemic_status === "internal_calculated") {
    return subfieldCandidate.provenance_type === "internal_calculation";
  }
  if (subfieldCandidate.epistemic_status === "user_confirmed_suggestion") {
    return Boolean(evidenceCandidate?.evidence_candidate_allowed);
  }
  if (subfieldCandidate.epistemic_status === "captured_user_evidence") {
    return subfieldCandidate.provenance_type === "user_answer";
  }
  if (subfieldCandidate.epistemic_status === "user_corrected_evidence") {
    return subfieldCandidate.provenance_type === "user_correction";
  }

  return true;
}

function createCanonicalVariableRecordCandidate(
  input: RuntimeCanonicalVariableServiceLocalInput,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
  mapping: RuntimeCanonicalVariableMapCandidate,
): RuntimeCanonicalVariableRecordCandidate {
  const canonicalVariableId = getStringMappingValue(
    mapping,
    "canonical_variable_id",
  ) as string;
  const canonicalVariableName = getCanonicalVariableName(mapping) as string;
  const canonicalVariablePath = getStringMappingValue(
    mapping,
    "canonical_variable_path",
  );
  const sourceTraceContract = validateCanonicalSourceTrace(
    mapping,
    subfieldCandidate,
    evidenceCandidate,
  );
  const variableType =
    getStringMappingValue(mapping, "variable_type") ||
    getStringMappingValue(mapping, "expected_type") ||
    "string";

  return {
    canonical_variable_candidate_ref: [
      input.case_id,
      subfieldCandidate.subfield_response_ref,
      canonicalVariableId,
      "canonical_variable_candidate",
    ].join(":"),
    canonical_variable_record_real_created: false,
    canonical_variable_record_ref: [
      input.case_id,
      subfieldCandidate.subfield_response_ref,
      canonicalVariableId,
      "canonical_variable_candidate",
    ].join(":"),
    canonical_variable_id: canonicalVariableId,
    canonical_variable_name: canonicalVariableName,
    canonical_variable_path: canonicalVariablePath,
    runtime_interaction_id: subfieldCandidate.runtime_interaction_id,
    interaction_instance_id_preview:
      subfieldCandidate.interaction_instance_id_preview,
    subfield_name: subfieldCandidate.subfield_name,
    value: subfieldCandidate.value,
    literal_value: evidenceCandidate?.literal_answer ?? evidenceCandidate?.literal_value ?? subfieldCandidate.value,
    normalized_value: evidenceCandidate?.normalized_value,
    epistemic_status: subfieldCandidate.epistemic_status,
    provenance_type: subfieldCandidate.provenance_type,
    source_subfield_response_ref: subfieldCandidate.subfield_response_ref,
    source_evidence_item_ref: evidenceCandidate?.evidence_item_ref,
    activity_runtime_run_id: input.options?.activity_runtime_run_id,
    role_runtime_session_id: input.options?.role_runtime_session_id,
    case_id: input.case_id,
    session_id: input.options?.session_id,
    scene_id: input.options?.scene_id,
    variable_name: canonicalVariableName,
    variable_value: subfieldCandidate.value,
    variable_type: variableType,
    route_id: mapping.route_id,
    route_status: getStringMappingValue(mapping, "route_status"),
    source_evidence_item_ids: evidenceCandidate?.evidence_item_ref
      ? [evidenceCandidate.evidence_item_ref]
      : [],
    derived_from_response_ids: getStringArrayMappingValue(mapping, "expected_response_refs"),
    derived_from_subfield_response_ids: [subfieldCandidate.subfield_response_ref],
    required_if_condition: getStringMappingValue(mapping, "required_if_condition"),
    gap_flag: getBooleanMappingValue(mapping, "gap_flag"),
    gap_type: getStringMappingValue(mapping, "gap_type"),
    confidence: getStringMappingValue(mapping, "confidence"),
    epistemic_basis: getFirstStringValue(
      (subfieldCandidate as unknown as Record<string, unknown>).epistemic_basis,
      getStringMappingValue(mapping, "epistemic_basis"),
    ),
    derivation_rule_ref: getStringMappingValue(mapping, "derivation_rule_ref"),
    diagnostic_status: "non_diagnostic",
    object_binding_status: getStringMappingValue(mapping, "object_binding_status"),
    invalidated_at: getStringMappingValue(mapping, "invalidated_at"),
    invalidation_reason: getStringMappingValue(mapping, "invalidation_reason"),
    evidence_backed: createsEvidenceBackedCandidate(
      subfieldCandidate.epistemic_status,
      evidenceCandidate,
    ),
    requires_user_confirmation:
      subfieldCandidate.epistemic_status === "ai_inferred_unconfirmed",
    internal_calculation:
      subfieldCandidate.epistemic_status === "internal_calculated",
    source_trace: sourceTraceContract as unknown as Record<string, unknown>,
    mapping_source_trace: createMappingSourceTrace(mapping),
    real_canonical_variable_record_created: false,
    real_evidence_item_created: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
  };
}

function createsEvidenceBackedCandidate(
  epistemicStatus: RuntimeResponseEpistemicStatus,
  evidenceCandidate: RuntimeEvidenceItemCandidate | undefined,
): boolean {
  if (
    epistemicStatus === "ai_inferred_unconfirmed" ||
    epistemicStatus === "internal_calculated"
  ) {
    return false;
  }

  return Boolean(evidenceCandidate?.evidence_candidate_allowed);
}

function findEvidenceCandidate(
  evidenceCandidates: RuntimeEvidenceItemCandidate[],
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
): RuntimeEvidenceItemCandidate | undefined {
  return evidenceCandidates.find(
    (candidate) =>
      candidate.runtime_interaction_id === subfieldCandidate.runtime_interaction_id &&
      candidate.subfield_name === subfieldCandidate.subfield_name &&
      candidate.evidence_candidate_allowed === true,
  );
}

function createMappingDecision(
  input: RuntimeCanonicalVariableServiceLocalInput,
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  mappingStatus: RuntimeCanonicalVariableMappingStatus,
): RuntimeCanonicalVariableMappingDecision {
  return {
    decision_id: `${input.case_id}:${subfieldCandidate.runtime_interaction_id}:${subfieldCandidate.subfield_name}:canonical_mapping_decision`,
    runtime_interaction_id: subfieldCandidate.runtime_interaction_id,
    subfield_name: subfieldCandidate.subfield_name,
    mapping_status: mappingStatus,
    canonical_variable_id: mapping
      ? getStringMappingValue(mapping, "canonical_variable_id")
      : undefined,
    canonical_variable_name: mapping ? getCanonicalVariableName(mapping) : undefined,
    canonical_variable_path: mapping
      ? getStringMappingValue(mapping, "canonical_variable_path")
      : undefined,
    mapping_source_trace: mapping ? createMappingSourceTrace(mapping) : undefined,
    exact_mapping_used: mappingStatus === "mapping_ready",
    fuzzy_mapping_used: false,
    semantic_fallback_used: false,
    free_inference_used: false,
    unauthorized_expansion_used: false,
  };
}

function createResult(
  input: RuntimeCanonicalVariableServiceLocalInput,
  serviceStatus: RuntimeCanonicalVariableServiceStatus,
  mappingDecisions: RuntimeCanonicalVariableMappingDecision[],
  candidates: RuntimeCanonicalVariableRecordCandidate[],
  blockers: string[],
  extras?: {
    phase7InputRevalidation?: RuntimePhase7InputRevalidationDecision;
    explicitMappingDecisions?: RuntimeCanonicalExplicitMappingDecision[];
    sourceContracts?: RuntimeCanonicalVariableSourceContract[];
    sourceTraceContracts?: RuntimeCanonicalSourceTraceContract[];
    evidenceSubfieldDerivationDecisions?: RuntimeCanonicalEvidenceSubfieldDerivationDecision[];
    canonicalEpistemicEnforcementDecisions?: RuntimeCanonicalEpistemicEnforcementDecision[];
    variableValueTypeBoundaries?: RuntimeCanonicalVariableValueTypeBoundary[];
    routeStatusDecisions?: RuntimeCanonicalRouteStatusDecision[];
    gapFlagDecisions?: RuntimeCanonicalGapFlagDecision[];
    c09ReceiverFeedbackBoundaries?: RuntimeCanonicalC09ReceiverFeedbackBoundary[];
    criticalRouteVariableFamilies?: RuntimeCanonicalCriticalRouteVariableFamily[];
    b7NonDiagnosticGuards?: RuntimeCanonicalB7NonDiagnosticGuard[];
    gatePrepBoundary?: RuntimeCanonicalGatePrepBoundary;
    supersessionRevisionDecisions?: RuntimeCanonicalSupersessionRevisionDecision[];
    objectBindingReferenceBoundaries?: RuntimeCanonicalObjectBindingReferenceBoundary[];
    persistenceBoundary?: RuntimeCanonicalPersistenceBoundary;
    canonicalVariableAuditCandidates?: RuntimeCanonicalVariableAuditActionCandidate[];
    phase8Boundary?: RuntimeCanonicalPhase8Boundary;
  },
): RuntimeCanonicalVariableServiceLocalResult {
  const ok =
    serviceStatus === "canonical_variable_candidates_ready" && blockers.length === 0;
  const phase7InputRevalidation =
    extras?.phase7InputRevalidation ?? revalidatePhase6InputForPhase7(input);

  return {
    ok,
    case_id: input.case_id,
    status: statusFromServiceStatus(serviceStatus),
    service_status: serviceStatus,
    phase7_input_revalidation: phase7InputRevalidation,
    source_contracts: extras?.sourceContracts ?? [],
    explicit_mapping_decisions: extras?.explicitMappingDecisions ?? [],
    source_trace_contracts: extras?.sourceTraceContracts ?? [],
    evidence_subfield_derivation_decisions:
      extras?.evidenceSubfieldDerivationDecisions ?? [],
    canonical_epistemic_enforcement_decisions:
      extras?.canonicalEpistemicEnforcementDecisions ?? [],
    variable_value_type_boundaries: extras?.variableValueTypeBoundaries ?? [],
    route_status_decisions: extras?.routeStatusDecisions ?? [],
    gap_flag_decisions: extras?.gapFlagDecisions ?? [],
    c09_receiver_feedback_boundaries: extras?.c09ReceiverFeedbackBoundaries ?? [],
    critical_route_variable_families: extras?.criticalRouteVariableFamilies ?? [],
    b7_non_diagnostic_guards: extras?.b7NonDiagnosticGuards ?? [],
    gate_prep_boundary: extras?.gatePrepBoundary ?? buildGatePrepBoundary(),
    supersession_revision_decisions: extras?.supersessionRevisionDecisions ?? [],
    object_binding_reference_boundaries: extras?.objectBindingReferenceBoundaries ?? [],
    persistence_boundary: extras?.persistenceBoundary ?? buildPersistenceBoundary(),
    canonical_variable_audit_candidates: extras?.canonicalVariableAuditCandidates ?? [],
    phase8_boundary: extras?.phase8Boundary ?? buildPhase8Boundary([], [], candidates),
    mapping_decisions: mappingDecisions,
    canonical_variable_record_candidates: candidates,
    audit_candidate: createAuditCandidate(input, candidates.length, blockers.length),
    no_go_check: createNoGoCheck(blockers),
    blocked_reason: ok ? undefined : serviceStatus,
    phase7_started_local: true,
    phase7_closed_local: false,
    ready_for_phase8_authorization: false,
    runtime_40_20_started: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    canonical_variable_record_real_created: false,
    branching_engine_executed: false,
    critical_route_gate_executed: false,
    mmabp_gate_engine_executed: false,
    readiness_engine_executed: false,
    readiness_decision_record_created: false,
    export_preview_created: false,
    semantic_resolution_event_created: false,
    process_state_timer_event_created: false,
    reentry_opened: false,
    branching_decision_created: false,
    budget_ledger_updated: false,
    causal_activities_opened: false,
    causal_budget_exceeded: false,
    phase8_started: false,
    materiality: {
      level: "runtime_40_20_canonical_variable_service_local_contract",
      local_only: true,
      real_canonical_variable_created: false,
      real_evidence_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function createAuditCandidate(
  input: RuntimeCanonicalVariableServiceLocalInput,
  candidatesCreated: number,
  mappingsBlocked: number,
): RuntimeCanonicalVariableAuditCandidate {
  return {
    canonical_variable_audit_ref: `${input.case_id}:canonical_variable_audit`,
    action:
      mappingsBlocked > 0
        ? "canonical_variable_mapping_blocked"
        : "canonical_variable_candidates_created",
    candidates_created: candidatesCreated,
    mappings_blocked: mappingsBlocked,
    real_audit_record_created: false,
    metadata: {
      source_ingest_status: input.ingest_result.ingest_status,
      exact_mapping_required: true,
      local_only: true,
    },
  };
}

function createNoGoCheck(blockers: string[]): RuntimeCanonicalVariableNoGoCheck {
  return {
    no_go_triggered: blockers.length > 0,
    blockers,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    real_response_persisted: false,
    real_subfield_response_created: false,
    real_evidence_item_created: false,
    real_canonical_variable_record_created: false,
    real_audit_record_created: false,
    real_runtime_records_created: false,
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

function serviceStatusFromMappingStatus(
  mappingStatus: RuntimeCanonicalVariableMappingStatus,
  blockingReasons: RuntimeCanonicalExplicitMappingDecision["blocking_reasons"] = [],
): RuntimeCanonicalVariableServiceStatus {
  if (blockingReasons.includes("receiver_feedback_from_satisfaction_detected")) {
    return "blocked_receiver_feedback_from_satisfaction";
  }
  if (
    blockingReasons.includes("similarity_mapping_detected") ||
    blockingReasons.includes("name_similarity_mapping_detected")
  ) {
    return "blocked_similarity_mapping";
  }
  if (blockingReasons.includes("free_text_mapping_detected")) {
    return "blocked_free_text_variable_mapping";
  }
  if (blockingReasons.includes("missing_source_trace")) {
    return "blocked_missing_source_trace";
  }
  if (blockingReasons.includes("missing_source_evidence")) {
    return "blocked_missing_source_evidence";
  }
  if (blockingReasons.includes("missing_source_node_ref")) {
    return "blocked_missing_source_node_ref";
  }
  if (blockingReasons.includes("missing_explicit_mapping")) {
    return "blocked_missing_explicit_mapping";
  }
  if (mappingStatus === "blocked_epistemic_violation") {
    return "blocked_epistemic_violation";
  }
  if (mappingStatus === "blocked_unauthorized_inference_required") {
    return "blocked_unauthorized_inference_required";
  }

  return "blocked_missing_canonical_variable_mapping";
}

function serviceStatusFromDecisions(
  mappingStatus: RuntimeCanonicalVariableMappingStatus,
  explicitReasons: RuntimeCanonicalExplicitMappingDecision["blocking_reasons"] = [],
  derivationReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [],
  epistemicReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [],
  typeReasons: RuntimeCanonicalVariableDerivationBlockingReason[] = [],
  routeGapReasons: RuntimeCanonicalRouteGapBlockingReason[] = [],
  phase7DReasons: RuntimeCanonicalPhase7DBoundaryBlockingReason[] = [],
): RuntimeCanonicalVariableServiceStatus {
  const allDerivationReasons = [
    ...derivationReasons,
    ...epistemicReasons,
    ...typeReasons,
  ];
  if (allDerivationReasons.includes("absent_response_detected")) {
    return "blocked_variable_from_absent_response";
  }
  if (allDerivationReasons.includes("missing_required_subfield")) {
    return "blocked_variable_from_missing_subfield";
  }
  if (allDerivationReasons.includes("pending_microconfirmation_detected")) {
    return "blocked_pending_microconfirmation_as_variable";
  }
  if (allDerivationReasons.includes("review_gap_detected")) {
    return "blocked_review_gap_as_variable";
  }
  if (allDerivationReasons.includes("ai_inference_hardening_detected")) {
    return "blocked_ai_inference_as_hard_canonical_variable";
  }
  if (
    allDerivationReasons.includes("variable_value_type_mismatch") ||
    allDerivationReasons.includes("enum_value_not_allowed") ||
    allDerivationReasons.includes("unauthorized_type_conversion_detected") ||
    allDerivationReasons.includes("unauthorized_date_parse_detected") ||
    allDerivationReasons.includes("object_or_array_collapsed_to_text") ||
    allDerivationReasons.includes("missing_value_inferred")
  ) {
    return "blocked_variable_value_type_mismatch";
  }
  if (
    allDerivationReasons.includes("epistemic_status_not_allowed_for_canonical_variable") ||
    allDerivationReasons.includes("provenance_type_mismatch") ||
    allDerivationReasons.includes("missing_derived_from_refs") ||
    allDerivationReasons.includes("missing_derivation_rule_ref") ||
    allDerivationReasons.includes("internal_calculated_used_as_user_answer")
  ) {
    return "blocked_canonical_epistemic_violation";
  }
  if (routeGapReasons.includes("gate_execution_attempted")) {
    return "blocked_gate_execution_attempt";
  }
  if (routeGapReasons.includes("route_closed_without_canonical_evidence")) {
    return "blocked_route_closed_without_canonical_evidence";
  }
  if (routeGapReasons.includes("gap_hidden_as_closed_variable")) {
    return "blocked_gap_hidden_as_closed_variable";
  }
  if (routeGapReasons.includes("receiver_feedback_from_satisfaction_detected")) {
    return "blocked_receiver_feedback_from_satisfaction";
  }
  if (routeGapReasons.includes("receiver_feedback_from_ambiguous_comment_detected")) {
    return "blocked_receiver_feedback_from_ambiguous_comment";
  }
  if (routeGapReasons.includes("c09_closed_by_wrong_route")) {
    return "blocked_route_closed_without_canonical_evidence";
  }
  if (routeGapReasons.includes("b7_diagnostic_transduction_attempted")) {
    return "blocked_b7_diagnostic_transduction";
  }
  if (phase7DReasons.includes("gate_execution_attempted")) {
    return "blocked_gate_execution_attempt";
  }
  if (phase7DReasons.includes("global_recomputation_attempted")) {
    return "blocked_global_recomputation_attempt";
  }
  if (
    phase7DReasons.includes("untraced_variable_overwrite_attempted") ||
    phase7DReasons.includes("invalidated_at_without_reason") ||
    phase7DReasons.includes("missing_explicit_supersession_ref")
  ) {
    return "blocked_untraced_variable_overwrite";
  }
  if (
    phase7DReasons.includes("object_inventory_creation_attempted") ||
    phase7DReasons.includes("object_materialization_attempted") ||
    phase7DReasons.includes("eve_object_definition_modification_attempted") ||
    phase7DReasons.includes("object_materialization_event_creation_attempted")
  ) {
    return "blocked_object_materialization_attempt";
  }
  if (
    phase7DReasons.includes("canonical_persistence_boundary_violation") ||
    phase7DReasons.includes("supabase_touch_attempted") ||
    phase7DReasons.includes("sql_execution_attempted") ||
    phase7DReasons.includes("endpoint_creation_attempted") ||
    phase7DReasons.includes("service_role_client_attempted") ||
    phase7DReasons.includes("scene_write_attempted") ||
    phase7DReasons.includes("mba_write_attempted") ||
    phase7DReasons.includes("parallel_production_runtime_artifacts_write_attempted") ||
    phase7DReasons.includes("audit_trail_real_creation_attempted")
  ) {
    return "blocked_canonical_persistence_boundary_violation";
  }
  if (
    phase7DReasons.includes("phase8_execution_attempted") ||
    phase7DReasons.includes("trigger_evaluation_attempted") ||
    phase7DReasons.includes("causal_score_calculation_attempted") ||
    phase7DReasons.includes("branching_decision_creation_attempted") ||
    phase7DReasons.includes("budget_ledger_update_attempted") ||
    phase7DReasons.includes("causal_activity_open_attempted")
  ) {
    return "blocked_phase8_execution_attempt";
  }

  return serviceStatusFromMappingStatus(mappingStatus, explicitReasons);
}

function statusFromServiceStatus(
  serviceStatus: RuntimeCanonicalVariableServiceStatus,
): RuntimeCanonicalVariableStatus {
  if (serviceStatus === "canonical_variable_candidates_ready") {
    return "canonical_variable_derivation_candidate_created";
  }
  if (serviceStatus === "blocked_phase6_not_closed") return "blocked_phase6_not_closed";
  if (serviceStatus === "blocked_phase7_not_authorized") {
    return "blocked_phase7_not_authorized";
  }
  if (serviceStatus === "blocked_missing_source_trace") {
    return "blocked_missing_source_trace";
  }
  if (serviceStatus === "blocked_similarity_mapping") {
    return "blocked_similarity_mapping";
  }
  if (serviceStatus === "blocked_free_text_variable_mapping") {
    return "blocked_free_text_variable_mapping";
  }
  if (serviceStatus === "blocked_receiver_feedback_from_satisfaction") {
    return "blocked_receiver_feedback_from_satisfaction";
  }
  if (serviceStatus === "blocked_missing_source_evidence") {
    return "blocked_missing_source_evidence";
  }
  if (serviceStatus === "blocked_missing_source_node_ref") {
    return "blocked_missing_source_node_ref";
  }
  if (serviceStatus === "blocked_variable_from_absent_response") {
    return "blocked_variable_from_absent_response";
  }
  if (serviceStatus === "blocked_variable_from_missing_subfield") {
    return "blocked_variable_from_missing_subfield";
  }
  if (serviceStatus === "blocked_pending_microconfirmation_as_variable") {
    return "blocked_pending_microconfirmation_as_variable";
  }
  if (serviceStatus === "blocked_review_gap_as_variable") {
    return "blocked_review_gap_as_variable";
  }
  if (serviceStatus === "blocked_ai_inference_as_hard_canonical_variable") {
    return "blocked_ai_inference_as_hard_canonical_variable";
  }
  if (serviceStatus === "blocked_canonical_epistemic_violation") {
    return "blocked_canonical_epistemic_violation";
  }
  if (serviceStatus === "blocked_variable_value_type_mismatch") {
    return "blocked_variable_value_type_mismatch";
  }
  if (serviceStatus === "blocked_route_closed_without_canonical_evidence") {
    return "blocked_route_closed_without_canonical_evidence";
  }
  if (serviceStatus === "blocked_gap_hidden_as_closed_variable") {
    return "blocked_gap_hidden_as_closed_variable";
  }
  if (serviceStatus === "blocked_receiver_feedback_from_ambiguous_comment") {
    return "blocked_receiver_feedback_from_ambiguous_comment";
  }
  if (serviceStatus === "blocked_b7_diagnostic_transduction") {
    return "blocked_b7_diagnostic_transduction";
  }
  if (serviceStatus === "blocked_gate_execution_attempt") {
    return "blocked_gate_execution_attempt";
  }
  if (serviceStatus === "blocked_global_recomputation_attempt") {
    return "blocked_global_recomputation_attempt";
  }
  if (serviceStatus === "blocked_untraced_variable_overwrite") {
    return "blocked_untraced_variable_overwrite";
  }
  if (serviceStatus === "blocked_object_materialization_attempt") {
    return "blocked_object_materialization_attempt";
  }
  if (serviceStatus === "blocked_canonical_persistence_boundary_violation") {
    return "blocked_canonical_persistence_boundary_violation";
  }
  if (serviceStatus === "blocked_phase8_execution_attempt") {
    return "blocked_phase8_execution_attempt";
  }

  return "blocked_missing_explicit_mapping";
}

function getStringMappingValue(
  mapping: RuntimeCanonicalVariableMapCandidate,
  key: string,
): string | undefined {
  const directValue = (mapping as unknown as Record<string, unknown>)[key];
  if (typeof directValue === "string" && directValue.length > 0) return directValue;

  const rawValue = mapping.raw_row?.[key];
  if (typeof rawValue === "string" && rawValue.length > 0) return rawValue;

  return undefined;
}

function getBooleanMappingValue(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  key: string,
): boolean {
  if (!mapping) return false;
  const directValue = (mapping as unknown as Record<string, unknown>)[key];
  if (typeof directValue === "boolean") return directValue;
  const rawValue = mapping.raw_row?.[key];
  return rawValue === true;
}

function getRecordMappingValue(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  key: string,
): Record<string, unknown> | undefined {
  if (!mapping) return undefined;
  const directValue = (mapping as unknown as Record<string, unknown>)[key];
  if (directValue && typeof directValue === "object" && !Array.isArray(directValue)) {
    return directValue as Record<string, unknown>;
  }
  const rawValue = mapping.raw_row?.[key];
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    return rawValue as Record<string, unknown>;
  }
  return undefined;
}

function getStringMappingValueOrUndefined(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  key: string,
): string | undefined {
  return mapping ? getStringMappingValue(mapping, key) : undefined;
}

function getStringArrayMappingValue(
  mapping: RuntimeCanonicalVariableMapCandidate,
  key: string,
): string[] {
  const directValue = (mapping as unknown as Record<string, unknown>)[key];
  if (Array.isArray(directValue)) return directValue.filter((value) => typeof value === "string");
  const rawValue = mapping.raw_row?.[key];
  if (Array.isArray(rawValue)) return rawValue.filter((value) => typeof value === "string");
  if (typeof directValue === "string" && directValue.length > 0) return [directValue];
  if (typeof rawValue === "string" && rawValue.length > 0) return [rawValue];
  return [];
}

function getStringArrayMappingValueOrEmpty(
  mapping: RuntimeCanonicalVariableMapCandidate | undefined,
  key: string,
): string[] {
  return mapping ? getStringArrayMappingValue(mapping, key) : [];
}

function getFirstString(value: unknown): string | undefined {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : undefined;
}

function getFirstStringValue(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}

function hasExplicitMapping(mapping: RuntimeCanonicalVariableMapCandidate): boolean {
  return (
    getBooleanMappingValue(mapping, "explicit_mapping_present") === true ||
    Boolean(
      getStringMappingValue(mapping, "runtime_interaction_id") &&
        getStringMappingValue(mapping, "subfield_name") &&
        getCanonicalVariableName(mapping) &&
        getStringMappingValue(mapping, "source_node_ref"),
    )
  );
}

function getRequiredStatus(
  mapping: RuntimeCanonicalVariableMapCandidate,
): "required" | "optional" | "derived" {
  if (mapping.derived) return "derived";
  return mapping.required ? "required" : "optional";
}

function requiresMappingRole(mapping: RuntimeCanonicalVariableMapCandidate): boolean {
  return getBooleanMappingValue(mapping, "mapping_role_required");
}

function getCanonicalVariableName(
  mapping: RuntimeCanonicalVariableMapCandidate,
): string | undefined {
  return (
    getStringMappingValue(mapping, "canonical_variable_name") ||
    mapping.variable_name
  );
}

function createMappingSourceTrace(
  mapping: RuntimeCanonicalVariableMapCandidate,
): Record<string, unknown> {
  return {
    source_document: mapping.source_document,
    source_sheet: mapping.source_sheet,
    source_row_number: mapping.source_row_number,
    raw_row: mapping.raw_row,
    source_refs: (mapping as unknown as Record<string, unknown>).source_refs,
    route_id: mapping.route_id,
  };
}

function hasDerivationSupport(
  subfieldCandidate: RuntimeSubfieldResponseCandidate,
  mapping: RuntimeCanonicalVariableMapCandidate,
): boolean {
  return (
    hasNonEmptyArray(subfieldCandidate.source_trace.raw_row.derived_from_refs) ||
    hasNonEmptyArray(mapping.raw_row?.derived_from_refs)
  );
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function normalizeExpectedType(value: string | undefined): RuntimeCanonicalExpectedValueType {
  if (
    value === "string" ||
    value === "number" ||
    value === "boolean" ||
    value === "date" ||
    value === "enum" ||
    value === "array" ||
    value === "object" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
}

function isValueCompatibleWithExpectedType(
  value: unknown,
  expectedType: RuntimeCanonicalExpectedValueType,
  enumOptions: string[],
): boolean {
  if (expectedType === "unknown") return true;
  if (expectedType === "string") return typeof value === "string";
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  if (expectedType === "boolean") return typeof value === "boolean";
  if (expectedType === "date") return value instanceof Date;
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "object") {
    return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }
  if (expectedType === "enum") {
    if (enumOptions.length === 0) return true;
    return typeof value === "string" && enumOptions.includes(value);
  }

  return false;
}

function normalizeRouteStatus(value: string | undefined): RuntimeCanonicalRouteStatus {
  if (
    value === "not_applicable" ||
    value === "open" ||
    value === "closed" ||
    value === "closed_with_flags" ||
    value === "unresolved" ||
    value === "blocked_by_missing_evidence" ||
    value === "blocked_by_missing_canonical_route" ||
    value === "route_missing" ||
    value === "requires_reentry" ||
    value === "manual_review_required" ||
    value === "superseded"
  ) {
    return value;
  }
  return "not_applicable";
}

function normalizeGapType(value: string | undefined): RuntimeCanonicalGapType {
  if (
    value === "none" ||
    value === "missing_evidence" ||
    value === "missing_canonical_route" ||
    value === "contradiction" ||
    value === "semantic_ambiguity" ||
    value === "route_gap" ||
    value === "manual_review" ||
    value === "budget_exhausted" ||
    value === "process_state_without_timer"
  ) {
    return value;
  }
  return "none";
}

function createCriticalRouteVariableFamily(
  familyId: RuntimeCanonicalCriticalRouteVariableFamily["family_id"],
  familyName: string,
  criticalRouteRef: string,
  supportedVariableNames: string[],
): RuntimeCanonicalCriticalRouteVariableFamily {
  return {
    family_id: familyId,
    family_name: familyName,
    critical_route_ref: criticalRouteRef,
    supported_variable_names: supportedVariableNames,
    source_trace_required: true,
    diagnostic_status: "non_diagnostic",
    gate_executed: false,
    canonical_variable_record_real_created: false,
    family_candidate_allowed: true,
    blocking_reasons: [],
  };
}
