import type {
  RuntimeConfirmationCorrectionIntakeDecision,
  RuntimeB0Q01SubfieldPersistenceContract,
  RuntimeC09ReceiverFeedbackBoundary,
  RuntimeEpistemicStatusEnforcementDecision,
  RuntimeEvidenceBoundaryDecision,
  RuntimeEvidenceItemCandidate,
  RuntimeIngestAuditCandidate,
  RuntimePhase6PersistenceBoundary,
  RuntimePhase6Phase5InputBoundary,
  RuntimePhase6Phase7Boundary,
  RuntimeResponseEpistemicStatus,
  RuntimeResponseAuditTrailCandidate,
  RuntimeResponseIdempotencyDecision,
  RuntimeResponseValidationBlockingDecision,
  RuntimeResponseValidationBlockingReason,
  RuntimeResponseIngestDecision,
  RuntimeResponseIngestLocalInput,
  RuntimeResponseIngestLocalResult,
  RuntimeResponseIngestNoGoCheck,
  RuntimeResponseIngestStatus,
  RuntimeResponsePayload,
  RuntimeResponsePayloadContract,
  RuntimeResponseProvenanceContract,
  RuntimeResponseRevisionDecision,
  RuntimeResponseRevisionCandidate,
  RuntimeSubfieldAnswerPayload,
  RuntimeSubfieldResponseCandidate,
} from "./runtime-40-20-response-ingest-types";

const B0Q01_REQUIRED_SUBFIELDS = [
  "action_verb",
  "input_or_object",
  "procedure_or_standard",
  "output_or_result",
  "user_correction_note",
];

export function ingestRuntime4020ResponseLocal(
  input: RuntimeResponseIngestLocalInput,
): RuntimeResponseIngestLocalResult {
  const status = getBlockingStatus(input);
  const ok = status === "ingest_candidate_ready";
  const idempotencyDecision = createIdempotencyDecision(input);
  const replayDetected = idempotencyDecision.idempotency_replay_detected;
  const responsePayloadContract = createResponsePayloadContract(input);
  const confirmationCorrectionIntakeDecisions =
    createConfirmationCorrectionIntakeDecisions(input, responsePayloadContract);
  const epistemicEnforcementDecisions =
    createEpistemicEnforcementDecisions(input, responsePayloadContract);
  const provenanceContracts = createProvenanceContracts(input, responsePayloadContract);
  const evidenceBoundaryDecision = createEvidenceBoundaryDecision();
  const c09ReceiverFeedbackBoundary =
    createC09ReceiverFeedbackBoundary(input, responsePayloadContract);
  const phase5InputBoundary = createPhase5InputBoundary(input);
  const phase7Boundary = createPhase7Boundary(input, responsePayloadContract);
  const persistenceBoundary = createPersistenceBoundary();
  const subfieldResponseCandidates =
    ok && !replayDetected
      ? createSubfieldResponseCandidates(input, responsePayloadContract)
      : [];
  const evidenceItemCandidates =
    ok && !replayDetected
      ? createEvidenceItemCandidates(input, responsePayloadContract)
      : [];
  const responseRevisionCandidate = createResponseRevisionCandidate(
    input.response_payload,
    ok,
    status,
  );
  const revisionDecision = createRevisionDecision(input.response_payload);
  const ingestAuditCandidate = createIngestAuditCandidate(input, ok, status);
  const validationBlockingDecision = createValidationBlockingDecision(status);
  const responseAuditTrailCandidates = createResponseAuditTrailCandidates(
    input,
    status,
    subfieldResponseCandidates.length,
    evidenceItemCandidates.length,
    replayDetected,
  );
  const ingestDecision = createIngestDecision(
    input,
    status,
    subfieldResponseCandidates.length,
    evidenceItemCandidates.length,
  );
  const noGoCheck = createNoGoCheck(ok ? [] : [status]);

  return {
    ok,
    case_id: input.case_id,
    ingest_status: status,
    subfield_response_candidates: subfieldResponseCandidates,
    evidence_item_candidates: evidenceItemCandidates,
    response_revision_candidate: responseRevisionCandidate,
    ingest_audit_candidate: ingestAuditCandidate,
    ingest_decision: ingestDecision,
    response_payload_contract: responsePayloadContract,
    idempotency_decision: idempotencyDecision,
    revision_decision: revisionDecision,
    b0q01_subfield_persistence_contract:
      createB0Q01SubfieldPersistenceContract(input, subfieldResponseCandidates),
    confirmation_correction_intake_decisions: confirmationCorrectionIntakeDecisions,
    epistemic_enforcement_decisions: epistemicEnforcementDecisions,
    provenance_contracts: provenanceContracts,
    evidence_boundary_decision: evidenceBoundaryDecision,
    c09_receiver_feedback_boundary: c09ReceiverFeedbackBoundary,
    validation_blocking_decision: validationBlockingDecision,
    response_audit_trail_candidates: responseAuditTrailCandidates,
    phase5_input_boundary: phase5InputBoundary,
    phase7_boundary: phase7Boundary,
    persistence_boundary: persistenceBoundary,
    no_go_check: noGoCheck,
    blocked_reason: ok ? undefined : status,
    materiality: {
      level: "runtime_40_20_response_ingest_local_contract",
      local_only: true,
      real_response_persisted: false,
      real_evidence_created: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function getBlockingStatus(
  input: RuntimeResponseIngestLocalInput,
): RuntimeResponseIngestStatus {
  const viewModel = input.interaction_view_model;
  const payload = input.response_payload;

  if (!payload) return "blocked_missing_response_payload_source";
  if (viewModel.renderer_status !== "render_model_ready") {
    return "blocked_renderer_not_ready";
  }
  if (viewModel.ui_rendered_real !== false) {
    return "blocked_renderer_not_ready";
  }
  if (!viewModel.source_trace) return "blocked_missing_source_traceability";
  if (!viewModel.epistemic_policy?.explicit_policy_present) {
    return "blocked_missing_epistemic_policy";
  }
  if (
    payload.runtime_interaction_id !== viewModel.runtime_interaction_id ||
    payload.interaction_instance_id_preview !==
      viewModel.interaction_instance_id_preview
  ) {
    return "blocked_missing_response_source";
  }
  if (payload.case_id !== input.case_id) return "blocked_missing_response_source";
  if (!payload.source_trace) return "blocked_missing_source_traceability";
  if (!sourceTraceMatchesViewModel(
    payload.source_trace as unknown as Record<string, unknown>,
    viewModel.source_trace as unknown as Record<string, unknown>,
  )) {
    return "blocked_missing_source_traceability";
  }
  if (!payload.idempotency_key) return "blocked_missing_idempotency_key";
  if (
    typeof payload.response_revision_number !== "number" ||
    payload.response_revision_number < 1
  ) {
    return "blocked_missing_revision_number";
  }
  if (payload.response_revision_number > 1 && !payload.supersedes_response_ref) {
    return "blocked_missing_supersedes_reference";
  }
  if (!Array.isArray(payload.answers) || !Array.isArray(payload.subfield_answers)) {
    return "blocked_missing_response_payload_source";
  }
  if (
    payload.answers.length !== payload.subfield_answers.length ||
    payload.answers.some((answer, index) => answer !== payload.subfield_answers[index])
  ) {
    return "blocked_missing_response_payload_source";
  }
  if (hasCrossPhaseExecutionAttempt(payload)) {
    return "blocked_cross_phase_dependency_detected";
  }
  if (hasPersistenceBoundaryViolation(payload)) {
    return "blocked_persistence_boundary_violation";
  }
  if (hasServiceRoleBoundaryViolation(payload)) {
    return "blocked_service_role_boundary_violation";
  }
  if (hasSubfieldCollapse(input)) {
    return "blocked_subfield_collapse_detected";
  }
  if (viewModel.runtime_interaction_id === "B0-Q01" && hasMissingB0Q01Subfield(input)) {
    return "blocked_missing_b0q01_required_subfield";
  }
  if (hasMissingRequiredSubfield(input)) {
    return "blocked_missing_subfield_structure";
  }
  if (hasC09RouteMissing(input)) return "blocked_c09_route_missing";
  if (hasReceiverFeedbackInferenceAttempt(input)) {
    return "blocked_receiver_feedback_inference";
  }

  const knownSubfields = new Set(viewModel.subfields.map((subfield) => subfield.name));
  for (const answer of payload.answers) {
    if (!knownSubfields.has(answer.subfield_name)) return "blocked_unknown_subfield";
    if (!hasSubfieldStructure(answer.subfield_name, viewModel.subfields)) {
      return "blocked_missing_subfield_structure";
    }
    if (!answer.provenance_type) return "blocked_missing_provenance";
    if (!isKnownProvenanceType(answer.provenance_type)) {
      return "blocked_epistemic_violation";
    }
    if (!hasAnswerSourceTrace(answer, viewModel.source_trace as unknown as Record<string, unknown>)) {
      return "blocked_missing_provenance";
    }
    if (!isKnownEpistemicStatus(answer.epistemic_status)) {
      return "blocked_epistemic_violation";
    }
    if (!viewModel.epistemic_policy.allowed_epistemic_statuses.includes(answer.epistemic_status)) {
      return "blocked_epistemic_violation";
    }
    if (!isValueCompatibleWithExpectedType(answer, viewModel.subfields)) {
      return "blocked_value_type_mismatch";
    }
    if (isEvidenceFromAbsenceAttempt(answer)) {
      return "blocked_evidence_from_absence";
    }
    if (isAiInferenceAsHardEvidenceAttempt(answer)) {
      return "blocked_ai_inference_as_hard_evidence";
    }
    if (isMissingConfirmationOrCorrectionReference(answer, payload)) {
      return "blocked_missing_confirmation_or_correction_reference";
    }
    if (!isEpistemicallyAllowed(answer, payload)) {
      return "blocked_epistemic_violation";
    }
  }

  return "ingest_candidate_ready";
}

function isKnownProvenanceType(value: unknown): boolean {
  return [
    "user_answer",
    "user_confirmation",
    "user_correction",
    "ai_suggestion",
    "canonical_derivation",
    "internal_calculation",
  ].includes(value as string);
}

function isKnownEpistemicStatus(value: unknown): boolean {
  return [
    "captured_user_evidence",
    "ai_inferred_unconfirmed",
    "user_confirmed_suggestion",
    "user_corrected_evidence",
    "canonical_derivation",
    "internal_calculated",
  ].includes(value as string);
}

function isValueCompatibleWithExpectedType(
  answer: RuntimeSubfieldAnswerPayload,
  subfields: RuntimeResponseIngestLocalInput["interaction_view_model"]["subfields"],
): boolean {
  const subfield = subfields.find((candidate) => candidate.name === answer.subfield_name);
  const expectedType = (answer.expected_type ?? subfield?.type) as string | undefined;
  if (!expectedType || expectedType === "unknown") return true;
  if (!isNonEmptyValue(answer.value)) return true;

  if (expectedType === "string" || expectedType === "text") {
    return typeof answer.value === "string";
  }
  if (expectedType === "number") return typeof answer.value === "number";
  if (expectedType === "boolean") return typeof answer.value === "boolean";
  if (expectedType === "array") return Array.isArray(answer.value);
  if (expectedType === "object") {
    return (
      typeof answer.value === "object" &&
      answer.value !== null &&
      !Array.isArray(answer.value) &&
      !(answer.value instanceof Date)
    );
  }
  if (expectedType === "date") return answer.value instanceof Date;
  if (expectedType === "enum") {
    const options = (subfield as { options?: unknown[] } | undefined)?.options;
    if (!Array.isArray(options) || options.length === 0) return true;
    return options.includes(answer.value);
  }

  return false;
}

function hasC09RouteMissing(input: RuntimeResponseIngestLocalInput): boolean {
  const boundary = input.response_payload.c09_receiver_feedback_boundary;
  if (input.response_payload.runtime_interaction_id !== "C09" || !boundary) return false;

  return boundary.route_missing === true && boundary.has_canonical_route !== true;
}

function hasReceiverFeedbackInferenceAttempt(
  input: RuntimeResponseIngestLocalInput,
): boolean {
  const boundary = input.response_payload.c09_receiver_feedback_boundary;
  if (!boundary) return false;

  return (
    boundary.receiver_feedback_inferred_from_satisfaction === true ||
    boundary.receiver_feedback_inferred_from_ambiguous_comment === true
  );
}

function hasAnswerSourceTrace(
  answer: RuntimeSubfieldAnswerPayload,
  fallbackSourceTrace: Record<string, unknown>,
): boolean {
  const sourceTrace = answer.source_trace ?? fallbackSourceTrace;

  return (
    typeof sourceTrace.source_document === "string" &&
    typeof sourceTrace.source_sheet === "string" &&
    typeof sourceTrace.source_row_number === "number"
  );
}

function hasSubfieldCollapse(input: RuntimeResponseIngestLocalInput): boolean {
  if (input.response_payload.answers.some((answer) => answer.subfield_name === "single_textbox")) {
    return true;
  }
  return false;
}

function hasMissingB0Q01Subfield(input: RuntimeResponseIngestLocalInput): boolean {
  const present = new Set(input.response_payload.answers.map((answer) => answer.subfield_name));
  return B0Q01_REQUIRED_SUBFIELDS.some((subfieldName) => !present.has(subfieldName));
}

function hasMissingRequiredSubfield(input: RuntimeResponseIngestLocalInput): boolean {
  const present = new Set(input.response_payload.answers.map((answer) => answer.subfield_name));
  return input.interaction_view_model.subfields.some(
    (subfield) => subfield.required && !present.has(subfield.name),
  );
}

function hasSubfieldStructure(
  subfieldName: string,
  subfields: RuntimeResponseIngestLocalInput["interaction_view_model"]["subfields"],
): boolean {
  const subfield = subfields.find((candidate) => candidate.name === subfieldName);
  return Boolean(subfield && typeof subfield.required === "boolean");
}

function sourceTraceMatchesViewModel(
  payloadSourceTrace: Record<string, unknown>,
  viewModelSourceTrace: Record<string, unknown>,
): boolean {
  return (
    payloadSourceTrace.source_document === viewModelSourceTrace.source_document &&
    payloadSourceTrace.source_sheet === viewModelSourceTrace.source_sheet &&
    payloadSourceTrace.source_row_number === viewModelSourceTrace.source_row_number
  );
}

function hasCrossPhaseExecutionAttempt(payload: RuntimeResponsePayload): boolean {
  const flags = payload.source_trace as Record<string, unknown>;
  return (
    flags.canonical_variable_service_executed === true ||
    flags.branching_engine_executed === true ||
    flags.critical_route_gate_executed === true ||
    flags.readiness_engine_executed === true ||
    flags.exporter_executed === true ||
    flags.canonical_variable_record_real_created === true ||
    flags.branching_real_created === true ||
    flags.readiness_real_created === true
  );
}

function hasPersistenceBoundaryViolation(payload: RuntimeResponsePayload): boolean {
  const flags = payload.source_trace as Record<string, unknown>;
  return (
    flags.db_write_authorized === true ||
    flags.response_persisted_real === true ||
    flags.real_response_record_created === true ||
    flags.runtime_subfield_response_real_created === true ||
    flags.evidence_item_real_created === true ||
    flags.supabase_touched === true ||
    flags.sql_executed === true ||
    flags.endpoint_created === true
  );
}

function hasServiceRoleBoundaryViolation(payload: RuntimeResponsePayload): boolean {
  const flags = payload.source_trace as Record<string, unknown>;
  return flags.service_role_used === true || flags.service_role_used_in_client === true;
}

function isEpistemicallyAllowed(
  answer: RuntimeSubfieldAnswerPayload,
  payload: RuntimeResponsePayload,
): boolean {
  if (
    answer.epistemic_status === "captured_user_evidence" &&
    answer.provenance_type !== "user_answer"
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "ai_inferred_unconfirmed" &&
    answer.provenance_type !== "ai_suggestion"
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "user_confirmed_suggestion" &&
    answer.provenance_type !== "user_confirmation"
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "user_corrected_evidence" &&
    answer.provenance_type !== "user_correction"
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "canonical_derivation" &&
    answer.provenance_type !== "canonical_derivation"
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "canonical_derivation" &&
    (!answer.derived_from_refs || answer.derived_from_refs.length === 0)
  ) {
    return false;
  }
  if (
    answer.epistemic_status === "internal_calculated" &&
    answer.provenance_type !== "internal_calculation"
  ) {
    return false;
  }

  return true;
}

function isMissingConfirmationOrCorrectionReference(
  answer: RuntimeSubfieldAnswerPayload,
  payload: RuntimeResponsePayload,
): boolean {
  if (
    answer.epistemic_status === "user_confirmed_suggestion" &&
    !answer.confirmation_reference
  ) {
    return true;
  }
  if (
    answer.epistemic_status === "user_corrected_evidence" &&
    !answer.correction_reference &&
    !payload.supersedes_response_ref
  ) {
    return true;
  }
  if (
    answer.epistemic_status === "canonical_derivation" &&
    (!answer.derived_from_refs || answer.derived_from_refs.length === 0)
  ) {
    return false;
  }
  return false;
}

function isEvidenceFromAbsenceAttempt(answer: RuntimeSubfieldAnswerPayload): boolean {
  return answer.evidence_candidate_requested === true && !isNonEmptyValue(answer.value);
}

function isAiInferenceAsHardEvidenceAttempt(answer: RuntimeSubfieldAnswerPayload): boolean {
  return (
    answer.epistemic_status === "ai_inferred_unconfirmed" &&
    answer.hard_evidence_requested === true
  );
}

function createSubfieldResponseCandidates(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeSubfieldResponseCandidate[] {
  return payloadContract.answers.map((answer, index) => ({
    subfield_response_ref: createCandidateRef(input, answer.subfield_name, index, "subfield"),
    runtime_interaction_id: payloadContract.runtime_interaction_id,
    interaction_instance_id_preview:
      payloadContract.interaction_instance_id_preview,
    subfield_name: answer.subfield_name,
    value: answer.value,
    expected_type: answer.expected_type,
    required: answer.required,
    epistemic_status: answer.epistemic_status,
    provenance_type: answer.provenance_type,
    response_revision_number: payloadContract.response_revision_number,
    idempotency_key: payloadContract.idempotency_key,
      source_trace: answer.source_trace as unknown as RuntimeSubfieldResponseCandidate["source_trace"],
    real_subfield_response_created: false,
    canonical_variable_record_real_created: false,
    evidence_item_real_created: false,
  }));
}

function createEvidenceItemCandidates(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeEvidenceItemCandidate[] {
  return payloadContract.answers
    .filter((answer) => isNonEmptyValue(answer.value))
    .filter((answer) => evidenceCandidateAllowed(answer))
    .map((answer, index) => ({
      evidence_item_ref: createCandidateRef(input, answer.subfield_name, index, "evidence"),
      runtime_interaction_id: input.response_payload.runtime_interaction_id,
      interaction_instance_id_preview:
        input.response_payload.interaction_instance_id_preview,
      subfield_name: answer.subfield_name,
      literal_answer: answer.value,
      literal_value: answer.value,
      normalized_value: answer.normalized_value,
      epistemic_status: answer.epistemic_status,
      provenance_type: answer.provenance_type,
      confidence: answer.confidence,
      source_ref: answer.source_ref ?? getFirstSourceRef(input),
      timestamp: "local_candidate_timestamp_not_persisted",
      evidence_candidate_allowed: true,
      hard_evidence: createsHardEvidence(answer.epistemic_status),
      source_trace: answer.source_trace as unknown as RuntimeEvidenceItemCandidate["source_trace"],
      real_evidence_item_created: false,
    }));
}

function createResponsePayloadContract(
  input: RuntimeResponseIngestLocalInput,
): RuntimeResponsePayloadContract {
  const answers = input.response_payload.answers.map((answer) => {
    const subfield = input.interaction_view_model.subfields.find(
      (candidate) => candidate.name === answer.subfield_name,
    );

    return {
      ...answer,
      expected_type: answer.expected_type ?? subfield?.type,
      required: answer.required ?? subfield?.required,
      source_trace: answer.source_trace ?? subfield?.source_trace,
    };
  });

  return {
    ...input.response_payload,
    answers,
    subfield_answers: answers,
  };
}

function createB0Q01SubfieldPersistenceContract(
  input: RuntimeResponseIngestLocalInput,
  subfieldResponseCandidates: RuntimeSubfieldResponseCandidate[],
): RuntimeB0Q01SubfieldPersistenceContract | undefined {
  if (input.interaction_view_model.runtime_interaction_id !== "B0-Q01") return undefined;

  const present = new Set(input.response_payload.answers.map((answer) => answer.subfield_name));

  return {
    action_verb_present: present.has("action_verb"),
    input_or_object_present: present.has("input_or_object"),
    procedure_or_standard_present: present.has("procedure_or_standard"),
    output_or_result_present: present.has("output_or_result"),
    user_correction_note_present: present.has("user_correction_note"),
    subfields_persisted_separately_as_candidates:
      B0Q01_REQUIRED_SUBFIELDS.every((subfieldName) =>
        subfieldResponseCandidates.some(
          (candidate) => candidate.subfield_name === subfieldName,
        ),
      ),
    single_textbox_used: false,
    missing_subfield_inferred: false,
    captured_user_evidence_created_without_confirmation: false,
  };
}

function evidenceCandidateAllowed(answer: RuntimeSubfieldAnswerPayload): boolean {
  if (!isNonEmptyValue(answer.value)) return false;
  if (answer.pending_microconfirmation === true) return false;
  if (answer.review_gap === true) return false;
  if (answer.epistemic_status === "ai_inferred_unconfirmed") return false;
  if (answer.epistemic_status === "internal_calculated") return false;
  if (answer.epistemic_status === "canonical_derivation") {
    return Boolean(answer.derived_from_refs?.length);
  }

  return [
    "captured_user_evidence",
    "user_confirmed_suggestion",
    "user_corrected_evidence",
  ].includes(answer.epistemic_status);
}

function createEvidenceBoundaryDecision(): RuntimeEvidenceBoundaryDecision {
  return {
    response_absent_is_not_evidence: true,
    ai_inference_unconfirmed_is_not_hard_evidence: true,
    missing_subfield_is_not_inferable_value: true,
    pending_microconfirmation_is_not_evidence: true,
    review_gap_is_not_evidence: true,
    b7_c20_no_diagnosis: true,
    b7_c20_no_ir: true,
    b7_c20_no_registry: true,
    b7_c20_signal_non_diagnostic_only: true,
  };
}

function createC09ReceiverFeedbackBoundary(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeC09ReceiverFeedbackBoundary {
  const boundary = payloadContract.c09_receiver_feedback_boundary;
  const routeMissing = boundary?.route_missing === true;

  return {
    receiver_feedback_exists: boundary?.receiver_feedback_exists === true,
    receiver_feedback: boundary?.receiver_feedback,
    gap_flag: boundary?.gap_flag === true,
    route_missing: routeMissing,
    feedback_source_trace: boundary?.feedback_source_trace,
    receiver_feedback_inferred_from_satisfaction: false,
    receiver_feedback_inferred_from_ambiguous_comment: false,
    route_missing_preserved_when_no_canonical_route:
      routeMissing && boundary?.has_canonical_route !== true,
    readiness_gap_record_real_created: false,
    critical_route_gate_executed: false,
    readiness_engine_executed: false,
  };
}

function createPhase5InputBoundary(
  input: RuntimeResponseIngestLocalInput,
): RuntimePhase6Phase5InputBoundary {
  return {
    interaction_view_model_consumed: Boolean(input.interaction_view_model),
    phase6_payload_preview_consumed:
      input.interaction_view_model.phase6_payload_preview?.payload_preview_created === true,
    interaction_instance_id_preview_used_as_preview_only: true,
    interaction_instance_id_real_created: false,
    preview_converted_to_authorized_payload: Boolean(input.response_payload),
    renderer_modified: false,
    ui_modified: false,
    visible_text_reinterpreted_as_answer: false,
    user_visible_copy_reinterpreted_as_answer: false,
    response_invented_from_copy: false,
  };
}

function createPhase7Boundary(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimePhase6Phase7Boundary {
  const hasSubfieldCandidates = payloadContract.answers.length > 0;
  const hasSourceRefs = Array.isArray(input.interaction_view_model.source_trace?.source_refs);

  return {
    canonical_variable_record_real_created: false,
    canonical_variable_service_executed: false,
    branching_engine_executed: false,
    critical_route_gate_executed: false,
    readiness_engine_executed: false,
    evidence_subfield_ready_for_future_phase: hasSubfieldCandidates,
    mapping_refs_preserved_when_present: hasSourceRefs,
    canonical_variable_outside_phase6_closeout: true,
  };
}

function createPersistenceBoundary(): RuntimePhase6PersistenceBoundary {
  return {
    local_candidate_mode: true,
    db_write_authorized: false,
    real_response_record_created: false,
    runtime_subfield_response_real_created: false,
    evidence_item_real_created: false,
    supabase_touch_authorized: false,
    sql_execution_authorized: false,
    endpoint_creation_authorized: false,
    service_role_used: false,
    service_role_used_in_client: false,
  };
}

function getFirstSourceRef(input: RuntimeResponseIngestLocalInput): string | undefined {
  const sourceRefs = input.interaction_view_model.source_trace?.source_refs;
  return Array.isArray(sourceRefs) ? sourceRefs[0] : undefined;
}

function createConfirmationCorrectionIntakeDecisions(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeConfirmationCorrectionIntakeDecision[] {
  return payloadContract.answers.map((answer) => {
    const confirmationRequired = answer.epistemic_status === "user_confirmed_suggestion";
    const correctionRequired = answer.epistemic_status === "user_corrected_evidence";
    const correctionReferencePresent =
      Boolean(answer.correction_reference) ||
      Boolean(payloadContract.supersedes_response_ref);

    return {
      confirmation_reference_required: confirmationRequired,
      confirmation_reference_present: Boolean(answer.confirmation_reference),
      correction_reference_required: correctionRequired,
      correction_reference_present: correctionReferencePresent,
      supersedes_response_ref_present: Boolean(payloadContract.supersedes_response_ref),
      user_confirmation_accepted:
        answer.epistemic_status === "user_confirmed_suggestion" &&
        answer.provenance_type === "user_confirmation" &&
        Boolean(answer.confirmation_reference),
      user_correction_accepted:
        answer.epistemic_status === "user_corrected_evidence" &&
        answer.provenance_type === "user_correction" &&
        correctionReferencePresent,
      ai_inferred_unconfirmed_remains_unconfirmed:
        answer.epistemic_status !== "ai_inferred_unconfirmed" ||
        answer.provenance_type === "ai_suggestion",
      correction_overrides_previous_inference_locally:
        answer.epistemic_status === "user_corrected_evidence" &&
        answer.provenance_type === "user_correction" &&
        correctionReferencePresent,
      previous_reference_preserved:
        !correctionRequired ||
        Boolean(answer.correction_reference) ||
        Boolean(input.response_payload.supersedes_response_ref),
      evidence_item_real_created: false,
    };
  });
}

function createEpistemicEnforcementDecisions(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeEpistemicStatusEnforcementDecision[] {
  return payloadContract.answers.map((answer) => {
    const statusAllowed = input.interaction_view_model.epistemic_policy.allowed_epistemic_statuses.includes(
      answer.epistemic_status,
    );
    const provenanceMatches = isEpistemicallyAllowed(answer, payloadContract);
    const hasDerivedRefs = Boolean(answer.derived_from_refs?.length);

    return {
      epistemic_status: answer.epistemic_status,
      provenance_type: answer.provenance_type,
      epistemic_status_allowed: statusAllowed,
      provenance_matches_epistemic_status: provenanceMatches,
      ai_inference_elevated_to_hard_evidence: false,
      captured_user_evidence_created_without_user_answer: false,
      canonical_derivation_has_derived_from_refs:
        answer.epistemic_status !== "canonical_derivation" || hasDerivedRefs,
      internal_calculated_used_as_user_answer: false,
      enforcement_status:
        statusAllowed && provenanceMatches
          ? "epistemic_enforcement_passed"
          : "blocked_epistemic_violation",
    };
  });
}

function createProvenanceContracts(
  input: RuntimeResponseIngestLocalInput,
  payloadContract: RuntimeResponsePayloadContract,
): RuntimeResponseProvenanceContract[] {
  if (!input.interaction_view_model.source_trace) return [];

  return payloadContract.answers
    .filter((answer) => Boolean(answer.provenance_type))
    .filter((answer) =>
      hasAnswerSourceTrace(answer, input.interaction_view_model.source_trace as unknown as Record<string, unknown>),
    )
    .map((answer) => {
      const sourceTrace = (answer.source_trace ??
        input.interaction_view_model.source_trace) as Record<string, unknown>;
      const sourceRefs = input.interaction_view_model.source_trace?.source_refs;

      return {
        provenance_type: answer.provenance_type,
        source_ref: Array.isArray(sourceRefs) ? sourceRefs[0] : undefined,
        source_document: sourceTrace.source_document as string,
        source_sheet: sourceTrace.source_sheet as string,
        source_row_number: sourceTrace.source_row_number as number,
        raw_row: input.interaction_view_model.source_trace.raw_row,
        raw_row_preserved_internally: true,
        provenance_fabricated: false,
        source_trace_fabricated: false,
      };
    });
}

function createsHardEvidence(status: RuntimeResponseEpistemicStatus): boolean {
  return status !== "ai_inferred_unconfirmed" && status !== "internal_calculated";
}

function createResponseRevisionCandidate(
  payload: RuntimeResponsePayload,
  ok: boolean,
  status: RuntimeResponseIngestStatus,
): RuntimeResponseRevisionCandidate {
  return {
    response_revision_ref: `${payload.runtime_interaction_id}:revision:${payload.response_revision_number ?? "missing"}`,
    response_revision_number: payload.response_revision_number,
    supersedes_response_ref: payload.supersedes_response_ref,
    revision_valid: ok,
    reason: ok ? "revision_candidate_ready" : status,
  };
}

function createIdempotencyDecision(
  input: RuntimeResponseIngestLocalInput,
): RuntimeResponseIdempotencyDecision {
  const key = input.response_payload.idempotency_key ?? "";

  return {
    idempotency_key: key,
    idempotency_key_present: key.length > 0,
    idempotency_replay_detected:
      input.options?.prior_idempotency_keys?.includes(key) === true,
    duplicate_response_created: false,
    real_idempotency_record_created: false,
  };
}

function createRevisionDecision(
  payload: RuntimeResponsePayload,
): RuntimeResponseRevisionDecision {
  const revisionNumber = payload.response_revision_number;
  const supersedesRequired = revisionNumber > 1;

  return {
    response_revision_number: revisionNumber,
    revision_number_present:
      typeof revisionNumber === "number" && revisionNumber >= 1,
    supersedes_response_ref_required: supersedesRequired,
    supersedes_response_ref_present: Boolean(payload.supersedes_response_ref),
    correction_reference_preserved:
      payload.answers.every((answer) => answer.epistemic_status !== "user_corrected_evidence") ||
      payload.answers.some((answer) => Boolean(answer.correction_reference)) ||
      Boolean(payload.supersedes_response_ref),
    previous_evidence_deleted_without_trace: false,
    advanced_recomputation_deferred: true,
  };
}

function createIngestAuditCandidate(
  input: RuntimeResponseIngestLocalInput,
  ok: boolean,
  status: RuntimeResponseIngestStatus,
): RuntimeIngestAuditCandidate {
  return {
    ingest_audit_ref: `${input.case_id}:${input.response_payload.idempotency_key || "missing"}:ingest_audit`,
    action: ok ? "response_ingest_candidate_created" : "response_ingest_blocked",
    idempotency_key: input.response_payload.idempotency_key,
    response_revision_number: input.response_payload.response_revision_number,
    runtime_interaction_id: input.response_payload.runtime_interaction_id,
    real_audit_record_created: false,
    metadata: {
      ingest_status: status,
      source_document: input.interaction_view_model.source_trace?.source_document,
      local_only: true,
    },
  };
}

function createValidationBlockingDecision(
  status: RuntimeResponseIngestStatus,
): RuntimeResponseValidationBlockingDecision {
  const blockingReasons = mapBlockingReasons(status);
  const validationPassed = status === "ingest_candidate_ready";

  return {
    validation_passed: validationPassed,
    blocking_reasons: blockingReasons,
    blocked_before_candidate_creation: !validationPassed,
    blocked_before_evidence_candidate_creation: !validationPassed,
    real_response_persisted: false,
    real_subfield_response_created: false,
    real_evidence_item_created: false,
  };
}

function createResponseAuditTrailCandidates(
  input: RuntimeResponseIngestLocalInput,
  status: RuntimeResponseIngestStatus,
  subfieldCandidatesCreated: number,
  evidenceCandidatesCreated: number,
  replayDetected: boolean,
): RuntimeResponseAuditTrailCandidate[] {
  const candidates: RuntimeResponseAuditTrailCandidate[] = [];
  const blockingReasons = mapBlockingReasons(status);

  candidates.push(
    createResponseAuditTrailCandidate(
      input,
      status === "ingest_candidate_ready"
        ? "response_ingest_candidate_created"
        : "response_ingest_blocked",
      blockingReasons,
    ),
  );

  if (status !== "ingest_candidate_ready") {
    candidates.push(
      createResponseAuditTrailCandidate(input, "validation_blocked", blockingReasons),
    );
  }
  if (status === "blocked_value_type_mismatch") {
    candidates.push(
      createResponseAuditTrailCandidate(input, "value_type_mismatch_blocked", blockingReasons),
    );
  }
  if (
    status === "blocked_missing_source_traceability" ||
    status === "blocked_missing_provenance"
  ) {
    candidates.push(
      createResponseAuditTrailCandidate(input, "missing_source_trace_blocked", blockingReasons),
    );
  }
  if (status === "blocked_epistemic_violation") {
    candidates.push(
      createResponseAuditTrailCandidate(input, "epistemic_violation_blocked", blockingReasons),
    );
  }
  if (subfieldCandidatesCreated > 0) {
    candidates.push(
      createResponseAuditTrailCandidate(input, "subfield_response_candidate_created", []),
    );
  }
  if (evidenceCandidatesCreated > 0) {
    candidates.push(
      createResponseAuditTrailCandidate(input, "evidence_item_candidate_created", []),
    );
  }
  if (typeof input.response_payload.response_revision_number === "number") {
    candidates.push(
      createResponseAuditTrailCandidate(input, "response_revision_registered", []),
    );
  }
  if (
    input.response_payload.response_revision_number > 1 &&
    Boolean(input.response_payload.supersedes_response_ref)
  ) {
    candidates.push(
      createResponseAuditTrailCandidate(input, "correction_supersedes_previous", []),
    );
  }
  if (replayDetected) {
    candidates.push(
      createResponseAuditTrailCandidate(input, "idempotency_replay_detected", []),
    );
  }

  return candidates;
}

function createResponseAuditTrailCandidate(
  input: RuntimeResponseIngestLocalInput,
  action: RuntimeResponseAuditTrailCandidate["audit_action"],
  blockingReasons: RuntimeResponseValidationBlockingReason[],
): RuntimeResponseAuditTrailCandidate {
  return {
    audit_candidate_ref: [
      input.case_id,
      input.response_payload.runtime_interaction_id ?? "missing_interaction",
      action,
      input.response_payload.idempotency_key || "missing_idempotency",
    ].join(":"),
    audit_action: action,
    case_id: input.case_id,
    runtime_interaction_id: input.response_payload.runtime_interaction_id,
    interaction_instance_id_preview:
      input.response_payload.interaction_instance_id_preview,
    idempotency_key: input.response_payload.idempotency_key,
    response_revision_number: input.response_payload.response_revision_number,
    blocking_reasons: blockingReasons,
    source_trace: input.response_payload.source_trace,
    real_audit_trail_created: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
  };
}

function mapBlockingReasons(
  status: RuntimeResponseIngestStatus,
): RuntimeResponseValidationBlockingReason[] {
  if (status === "ingest_candidate_ready") return [];
  if (status === "blocked_missing_idempotency_key") return ["missing_idempotency_key"];
  if (status === "blocked_missing_revision_number") {
    return ["missing_response_revision_number"];
  }
  if (status === "blocked_unknown_subfield") return ["unknown_subfield"];
  if (status === "blocked_missing_source_traceability") return ["missing_source_trace"];
  if (status === "blocked_missing_provenance") {
    return ["missing_source_trace", "invalid_provenance_type"];
  }
  if (status === "blocked_missing_confirmation_or_correction_reference") {
    return [
      "confirmation_missing_confirmation_reference",
      "correction_missing_supersedes_or_correction_reference",
    ];
  }
  if (status === "blocked_missing_supersedes_reference") {
    return ["correction_missing_supersedes_or_correction_reference"];
  }
  if (status === "blocked_epistemic_violation") {
    return ["invalid_epistemic_status", "invalid_provenance_type"];
  }
  if (status === "blocked_value_type_mismatch") {
    return ["value_incompatible_with_expected_type"];
  }
  if (status === "blocked_missing_subfield_structure") return ["missing_source_trace"];

  return [];
}

function createIngestDecision(
  input: RuntimeResponseIngestLocalInput,
  status: RuntimeResponseIngestStatus,
  subfieldCandidatesCreated: number,
  evidenceCandidatesCreated: number,
): RuntimeResponseIngestDecision {
  return {
    decision_id: `${input.case_id}:${input.response_payload.runtime_interaction_id}:response_ingest_decision`,
    runtime_interaction_id: input.response_payload.runtime_interaction_id,
    ingest_status: status,
    subfield_candidates_created: subfieldCandidatesCreated,
    evidence_candidates_created: evidenceCandidatesCreated,
    free_inference_used: false,
    unauthorized_expansion_used: false,
    real_response_persisted: false,
  };
}

function createNoGoCheck(blockers: string[]): RuntimeResponseIngestNoGoCheck {
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
    real_audit_record_created: false,
    real_canonical_variable_record_created: false,
    canonical_variable_service_executed: false,
    branching_engine_executed: false,
    readiness_engine_executed: false,
    real_runtime_records_created: false,
    business_evidence_created: false,
    registry_live_db_created: false,
    ir_real_created: false,
    critical_route_gate_executed: false,
    readiness_gap_record_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
  };
}

function createCandidateRef(
  input: RuntimeResponseIngestLocalInput,
  subfieldName: string,
  index: number,
  kind: "subfield" | "evidence",
): string {
  return [
    input.response_payload.idempotency_key,
    input.response_payload.response_revision_number,
    input.response_payload.runtime_interaction_id,
    subfieldName,
    kind,
    index + 1,
  ].join(":");
}

function isNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;

  return true;
}
