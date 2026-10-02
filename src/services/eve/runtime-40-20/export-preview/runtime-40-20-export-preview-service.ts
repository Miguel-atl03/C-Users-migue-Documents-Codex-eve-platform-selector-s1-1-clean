import type {
  RuntimeChecksumIdempotencyCandidate,
  RuntimeChecksumIdempotencySourceInput,
  RuntimeEvidenceBundleBlockingReason,
  RuntimeEvidenceBundleCanonicalVariableRouteStatusCandidate,
  RuntimeEvidenceBundleCanonicalVariableRouteStatusSourceInput,
  RuntimeEvidenceBundleEpistemicHardeningBoundary,
  RuntimeEvidenceBundleEpistemicHardeningBoundarySourceInput,
  RuntimeEvidenceBundleEpistemicStatus,
  RuntimeEvidenceBundleEvidenceItemCandidate,
  RuntimeEvidenceBundleEvidenceItemSourceInput,
  RuntimeEvidenceBundlePreviewCandidate,
  RuntimeEvidenceBundlePreviewSourceInput,
  RuntimeEvidenceBundlePreviewStatus,
  RuntimeExportContractSourceCandidate,
  RuntimeExportContractSourceInput,
  RuntimeExportPayloadState,
  RuntimeExportPayloadType,
  RuntimeExportPreviewBlockingReason,
  RuntimeExportPreviewServiceCandidate,
  RuntimeExportPreviewServiceSourceInput,
  RuntimeExportPreviewStatus,
  RuntimeExportEligibilityGateCandidate,
  RuntimeExportEligibilityGateSourceInput,
  RuntimeCombinedPreviewCandidate,
  RuntimeCombinedPreviewSourceInput,
  RuntimeExportBlockingRuleCandidate,
  RuntimeExportBlockingRuleSourceInput,
  RuntimeExportBoundaryBlockingReason,
  RuntimeExportBoundaryStatus,
  RuntimeExportPreviewAuditAction,
  RuntimeExportPreviewAuditCandidate,
  RuntimeExportPreviewAuditCandidateSourceInput,
  RuntimeExportPreviewPersistenceBoundary,
  RuntimeExportPreviewPersistenceBoundarySourceInput,
  RuntimeExportPreviewSupersessionBoundary,
  RuntimeExportPreviewSupersessionBoundarySourceInput,
  RuntimeMDSBBlockingReason,
  RuntimeMDSBCheckpointCompartment,
  RuntimeMDSBCheckpointType,
  RuntimeMDSBConformanceConsistencyCheckpointCandidate,
  RuntimeMDSBConformanceConsistencyCheckpointSourceInput,
  RuntimeMDSBPreviewCandidate,
  RuntimeMDSBPreviewSourceInput,
  RuntimeMDSBPreviewStatus,
  RuntimeMDSBQuadrantHint,
  RuntimeMDSBStructuralCandidate,
  RuntimeMDSBStructuralCandidateSourceInput,
  RuntimeNoExportRealProduccionParalelaBoundary,
  RuntimeNoExportRealProduccionParalelaBoundarySourceInput,
  RuntimeParallelExportPayloadPreviewCandidate,
  RuntimeParallelExportPayloadPreviewSourceInput,
  RuntimePayloadLifecycleTransition,
  RuntimePayloadStateLifecycleCandidate,
  RuntimePayloadStateLifecycleSourceInput,
  RuntimePhase11ExportPreviewFoundationLocalInput,
  RuntimePhase11ExportPreviewFoundationLocalResult,
  RuntimePhase11InputRevalidationDecision,
  RuntimePhase12ExportPreviewQABoundary,
  RuntimePhase12ExportPreviewQABoundarySourceInput,
  RuntimeReadinessStateForExportPreview,
  RuntimeSCRActivityAnchorCandidate,
  RuntimeSCRActivityAnchorSourceInput,
  RuntimeSCRBlockOutputsCandidate,
  RuntimeSCRBlockOutputsSourceInput,
  RuntimeSCRGapReadinessRouteTransportCandidate,
  RuntimeSCRGapReadinessRouteTransportSourceInput,
  RuntimeSCRPreviewBlockingReason,
  RuntimeSCRPreviewCandidate,
  RuntimeSCRPreviewSourceInput,
  RuntimeSCRPreviewStatus,
  RuntimeSourceTraceEnvelopeCandidate,
  RuntimeSourceTraceEnvelopeSourceInput,
} from "./runtime-40-20-export-preview-types";

export const Runtime40_20ExportPreviewService = {
  revalidatePhase10InputForPhase11,
  buildExportPreviewServiceCandidates,
  buildExportEligibilityGateCandidates,
  buildRuntimeExportContractSourceCandidates,
  buildParallelExportPayloadPreviewCandidates,
  buildPayloadStateLifecycleCandidates,
  buildChecksumIdempotencyCandidates,
  buildSourceTraceEnvelopeCandidates,
  buildPhase11ExportPreviewFoundationLocalResult,
  buildSCRPreviewCandidates,
  buildSCRActivityAnchorCandidates,
  buildSCRBlockOutputsCandidates,
  buildSCRGapReadinessRouteTransportCandidates,
  buildPhase11SCRPreviewLocalResult,
  buildEvidenceBundlePreviewCandidates,
  buildEvidenceBundleEvidenceItemCandidates,
  buildEvidenceBundleCanonicalVariableRouteStatusCandidates,
  buildEvidenceBundleEpistemicHardeningBoundaries,
  buildPhase11EvidenceBundlePreviewLocalResult,
  buildMDSBPreviewCandidates,
  buildMDSBStructuralCandidates,
  buildMDSBConformanceConsistencyCheckpointCandidates,
  buildCombinedPreviewCandidates,
  buildExportBlockingRuleCandidates,
  buildPhase11MDSBCombinedPreviewBlockingRulesLocalResult,
  buildPreviewSupersessionBoundaries,
  buildExportPreviewAuditCandidates,
  buildPhase12ExportPreviewQABoundaries,
  buildNoExportRealProduccionParalelaBoundaries,
  buildExportPreviewPersistenceBoundaries,
  buildPhase11SupersessionAuditQaExportPersistenceBoundaryLocalResult,
};

const ALLOWED_READINESS_STATES: RuntimeReadinessStateForExportPreview[] = [
  "ready",
  "ready_with_flags",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "blocked_by_missing_canonical_route",
  "manual_review_required",
  "reentry_required",
];

const ALLOWED_PAYLOAD_TYPES: RuntimeExportPayloadType[] = [
  "scr_patch",
  "evidence_bundle_patch",
  "mdsb_patch",
  "combined_preview",
];

const ALLOWED_PAYLOAD_STATES: RuntimeExportPayloadState[] = [
  "draft",
  "ready",
  "blocked",
  "superseded",
];

const ALLOWED_TRANSITIONS: RuntimePayloadLifecycleTransition[] = [
  "draft_to_ready",
  "draft_to_blocked",
  "ready_to_superseded",
  "blocked_to_draft",
];

const ALLOWED_EVIDENCE_BUNDLE_EPISTEMIC_STATUSES: RuntimeEvidenceBundleEpistemicStatus[] = [
  "captured_user_evidence",
  "user_confirmed_suggestion",
  "user_corrected_evidence",
  "ai_inferred_unconfirmed",
  "canonical_derivation",
  "internal_calculated",
];

const ALLOWED_MDSB_QUADRANTS: RuntimeMDSBQuadrantHint[] = ["PM", "MoC", "PF", "OLC"];

const ALLOWED_MDSB_CHECKPOINT_TYPES: RuntimeMDSBCheckpointType[] = [
  "conformance_checkpoint",
  "consistency_checkpoint",
];

const ALLOWED_MDSB_CHECKPOINT_COMPARTMENTS: RuntimeMDSBCheckpointCompartment[] = [
  "PM_to_MoC",
  "PM_to_PF",
  "MoC_to_PF",
  "PF_to_OLC",
  "OLC_to_MoC",
  "temporal_consistency_PF_to_OLC",
  "structural_consistency_PF_to_OLC",
];

const ALLOWED_EXPORT_PREVIEW_AUDIT_ACTIONS: RuntimeExportPreviewAuditAction[] = [
  "export_preview_candidate_created",
  "export_preview_blocked",
  "scr_preview_candidate_created",
  "evidence_bundle_preview_candidate_created",
  "mdsb_preview_candidate_created",
  "combined_preview_candidate_created",
  "payload_checksum_created",
  "payload_superseded_candidate_created",
  "export_real_blocked",
  "produccion_paralela_blocked",
];

export function buildPhase11ExportPreviewFoundationLocalResult(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11ExportPreviewFoundationLocalResult {
  const revalidation = revalidatePhase10InputForPhase11(input);
  if (!revalidation.candidate_allowed) {
    return createResult(resolveStatus(revalidation.blocking_reasons), revalidation);
  }

  const serviceCandidates = buildExportPreviewServiceCandidates(
    input.case_id,
    input.export_preview_service_sources ?? [],
  );
  const eligibilityCandidates = buildExportEligibilityGateCandidates(
    input.case_id,
    input.export_eligibility_gate_sources ?? [],
  );
  const contractCandidates = buildRuntimeExportContractSourceCandidates(
    input.case_id,
    input.runtime_export_contract_sources ?? [],
  );
  const payloadCandidates = buildParallelExportPayloadPreviewCandidates(
    input.case_id,
    input.parallel_export_payload_preview_sources ?? [],
  );
  const lifecycleCandidates = buildPayloadStateLifecycleCandidates(
    input.case_id,
    input.payload_state_lifecycle_sources ?? [],
  );
  const checksumCandidates = buildChecksumIdempotencyCandidates(
    input.case_id,
    input.checksum_idempotency_sources ?? [],
  );
  const envelopeCandidates = buildSourceTraceEnvelopeCandidates(
    input.case_id,
    input.source_trace_envelope_sources ?? [],
  );
  const allReasons = [
    ...serviceCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...eligibilityCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...contractCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...payloadCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...lifecycleCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...checksumCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...envelopeCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...getBoundaryGuardBlockingReasons(input.boundary_guard ?? {}),
  ];

  return createResult(resolveStatus(allReasons, serviceCandidates), revalidation, {
    serviceCandidates,
    eligibilityCandidates,
    contractCandidates,
    payloadCandidates,
    lifecycleCandidates,
    checksumCandidates,
    envelopeCandidates,
  });
}

export function buildPhase11SCRPreviewLocalResult(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11ExportPreviewFoundationLocalResult {
  const base = buildPhase11ExportPreviewFoundationLocalResult(input);
  if (!base.phase11_input_revalidation.candidate_allowed) {
    return base;
  }

  const scrPreviewCandidates = buildSCRPreviewCandidates(
    input.case_id,
    input.scr_preview_sources ?? [],
  );
  const scrAnchorCandidates = buildSCRActivityAnchorCandidates(
    input.case_id,
    input.scr_activity_anchor_sources ?? [],
  );
  const scrBlockOutputsCandidates = buildSCRBlockOutputsCandidates(
    input.case_id,
    input.scr_block_outputs_sources ?? [],
  );
  const scrGapTransportCandidates = buildSCRGapReadinessRouteTransportCandidates(
    input.case_id,
    input.scr_gap_readiness_route_transport_sources ?? [],
  );
  const allReasons = [
    ...scrPreviewCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...scrAnchorCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...scrBlockOutputsCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...scrGapTransportCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...base,
    status: resolveSCRStatus(allReasons, {
      scrPreviewCandidates,
      scrAnchorCandidates,
      scrBlockOutputsCandidates,
      scrGapTransportCandidates,
    }),
    scr_preview_candidates: scrPreviewCandidates,
    scr_activity_anchor_candidates: scrAnchorCandidates,
    scr_block_outputs_candidates: scrBlockOutputsCandidates,
    scr_gap_readiness_route_transport_candidates: scrGapTransportCandidates,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    export_preview_real_created: false,
    parallel_export_payload_real_created: false,
    payload_state_sent: false,
    post_export_executed: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    scene_write_detected: false,
    phase12_started: false,
  };
}

export function buildPhase11EvidenceBundlePreviewLocalResult(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11ExportPreviewFoundationLocalResult {
  const base = buildPhase11SCRPreviewLocalResult(input);
  if (!base.phase11_input_revalidation.candidate_allowed) {
    return base;
  }

  const previewCandidates = buildEvidenceBundlePreviewCandidates(
    input.case_id,
    input.evidence_bundle_preview_sources ?? [],
  );
  const evidenceItemCandidates = buildEvidenceBundleEvidenceItemCandidates(
    input.case_id,
    input.evidence_bundle_evidence_item_sources ?? [],
  );
  const variableRouteStatusCandidates = buildEvidenceBundleCanonicalVariableRouteStatusCandidates(
    input.case_id,
    input.evidence_bundle_canonical_variable_route_status_sources ?? [],
  );
  const hardeningBoundaries = buildEvidenceBundleEpistemicHardeningBoundaries(
    input.case_id,
    input.evidence_bundle_epistemic_hardening_boundary_sources ?? [],
  );
  const allReasons = [
    ...previewCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...evidenceItemCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...variableRouteStatusCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...hardeningBoundaries.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...base,
    status: resolveEvidenceBundleStatus(allReasons, {
      previewCandidates,
      evidenceItemCandidates,
      variableRouteStatusCandidates,
      hardeningBoundaries,
    }),
    evidence_bundle_preview_candidates: previewCandidates,
    evidence_bundle_evidence_item_candidates: evidenceItemCandidates,
    evidence_bundle_canonical_variable_route_status_candidates: variableRouteStatusCandidates,
    evidence_bundle_epistemic_hardening_boundaries: hardeningBoundaries,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    export_preview_real_created: false,
    parallel_export_payload_real_created: false,
    payload_state_sent: false,
    post_export_executed: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    phase12_started: false,
  };
}

export function buildPhase11MDSBCombinedPreviewBlockingRulesLocalResult(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11ExportPreviewFoundationLocalResult {
  const base = buildPhase11EvidenceBundlePreviewLocalResult(input);
  if (!base.phase11_input_revalidation.candidate_allowed) {
    return base;
  }

  const structuralCandidates = buildMDSBStructuralCandidates(
    input.case_id,
    input.mdsb_structural_candidate_sources ?? [],
  );
  const checkpointCandidates = buildMDSBConformanceConsistencyCheckpointCandidates(
    input.case_id,
    input.mdsb_conformance_consistency_checkpoint_sources ?? [],
  );
  const mdsbPreviewCandidates = buildMDSBPreviewCandidates(
    input.case_id,
    input.mdsb_preview_sources ?? [],
  );
  const combinedPreviewCandidates = buildCombinedPreviewCandidates(
    input.case_id,
    input.combined_preview_sources ?? [],
  );
  const exportBlockingRuleCandidates = buildExportBlockingRuleCandidates(
    input.case_id,
    input.export_blocking_rule_sources ?? [],
  );
  const allReasons = [
    ...structuralCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...checkpointCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...mdsbPreviewCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...combinedPreviewCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...exportBlockingRuleCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...base,
    status: resolveMDSBStatus(allReasons, {
      structuralCandidates,
      checkpointCandidates,
      mdsbPreviewCandidates,
      combinedPreviewCandidates,
      exportBlockingRuleCandidates,
    }),
    mdsb_preview_candidates: mdsbPreviewCandidates,
    mdsb_structural_candidates: structuralCandidates,
    mdsb_conformance_consistency_checkpoint_candidates: checkpointCandidates,
    combined_preview_candidates: combinedPreviewCandidates,
    export_blocking_rule_candidates: exportBlockingRuleCandidates,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    export_preview_real_created: false,
    parallel_export_payload_real_created: false,
    payload_state_sent: false,
    post_export_executed: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    phase12_started: false,
  };
}

export function buildPhase11SupersessionAuditQaExportPersistenceBoundaryLocalResult(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11ExportPreviewFoundationLocalResult {
  const base = buildPhase11MDSBCombinedPreviewBlockingRulesLocalResult(input);
  if (!base.phase11_input_revalidation.candidate_allowed) {
    return base;
  }

  const supersessionBoundaries = buildPreviewSupersessionBoundaries(
    input.case_id,
    input.preview_supersession_boundary_sources ?? [],
  );
  const auditCandidates = buildExportPreviewAuditCandidates(
    input.case_id,
    input.export_preview_audit_candidate_sources ?? [],
  );
  const qaBoundaries = buildPhase12ExportPreviewQABoundaries(
    input.case_id,
    input.phase12_export_preview_qa_boundary_sources ?? [],
  );
  const noExportBoundaries = buildNoExportRealProduccionParalelaBoundaries(
    input.case_id,
    input.no_export_real_produccion_paralela_boundary_sources ?? [],
  );
  const persistenceBoundaries = buildExportPreviewPersistenceBoundaries(
    input.case_id,
    input.export_preview_persistence_boundary_sources ?? [],
  );
  const allReasons = [
    ...supersessionBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...auditCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...qaBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...noExportBoundaries.flatMap((candidate) => candidate.blocking_reasons),
    ...persistenceBoundaries.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...base,
    status: resolveExportBoundaryStatus(allReasons, {
      supersessionBoundaries,
      auditCandidates,
      qaBoundaries,
      noExportBoundaries,
      persistenceBoundaries,
    }),
    preview_supersession_boundaries: supersessionBoundaries,
    export_preview_audit_candidates: auditCandidates,
    phase12_export_preview_qa_boundaries: qaBoundaries,
    no_export_real_produccion_paralela_boundaries: noExportBoundaries,
    export_preview_persistence_boundaries: persistenceBoundaries,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    export_preview_real_created: false,
    parallel_export_payload_real_created: false,
    payload_state_sent: false,
    post_export_executed: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    qa_green_declared: false,
    shadow_pilot_started: false,
    full_runtime_authorized: false,
    phase12_started: false,
  };
}

export function revalidatePhase10InputForPhase11(
  input: RuntimePhase11ExportPreviewFoundationLocalInput,
): RuntimePhase11InputRevalidationDecision {
  const closeout = input.phase10_closeout;
  const candidates = input.phase10_candidates;
  const boundary = input.boundary_guard ?? {};
  const phase10Closed = closeout.phase10_closed_local === true;
  const phase11Authorized = closeout.ready_for_phase11_authorization === true;
  const phase11AlreadyStarted =
    closeout.phase11_started_local === true || closeout.phase11_started === true;
  const blockingReasons: RuntimeExportPreviewBlockingReason[] = [];

  if (!phase10Closed) blockingReasons.push("phase10_not_closed");
  if (!phase11Authorized) blockingReasons.push("phase11_not_authorized");
  if (phase11AlreadyStarted) blockingReasons.push("phase11_already_started");
  blockingReasons.push(...getBoundaryGuardBlockingReasons(boundary));

  return {
    phase10_closed_local: phase10Closed,
    ready_for_phase11_authorization: phase11Authorized,
    phase11_started_local: phase10Closed && phase11Authorized && !phase11AlreadyStarted,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    readiness_decision_record_candidates_available:
      (candidates.readiness_decision_record_candidates?.length ?? 0) > 0,
    readiness_state_candidate_available: (candidates.readiness_state_candidates?.length ?? 0) > 0,
    ready_candidates_available: (candidates.ready_candidates?.length ?? 0) > 0,
    ready_with_flags_candidates_available:
      (candidates.ready_with_flags_candidates?.length ?? 0) > 0,
    blocking_gap_refs_available: (candidates.blocking_gap_refs?.length ?? 0) > 0,
    non_blocking_gap_refs_available: (candidates.non_blocking_gap_refs?.length ?? 0) > 0,
    manual_review_refs_available: (candidates.manual_review_refs?.length ?? 0) > 0,
    reentry_refs_available: (candidates.reentry_refs?.length ?? 0) > 0,
    gate_result_refs_available: (candidates.gate_result_refs?.length ?? 0) > 0,
    semantic_event_refs_available: (candidates.semantic_event_refs?.length ?? 0) > 0,
    pst_event_refs_available: (candidates.pst_event_refs?.length ?? 0) > 0,
    carry_forward_gap_refs_available: (candidates.carry_forward_gap_refs?.length ?? 0) > 0,
    readiness_audit_candidates_available: (candidates.readiness_audit_candidates?.length ?? 0) > 0,
    phase11_export_preview_boundary_from_phase10e_available:
      (candidates.phase11_export_preview_boundaries?.length ?? 0) > 0,
    export_preview_previously_created: false,
    parallel_export_payload_real_previously_created: false,
    produccion_paralela_previously_started: false,
    registry_previously_created: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    readiness_recalculated: false,
    phase10_modified: false,
    phase12_started: false,
    candidate_allowed: blockingReasons.length === 0,
    blocking_reasons: [...new Set(blockingReasons)],
  };
}

export function buildExportPreviewServiceCandidates(
  caseId: string,
  sources: RuntimeExportPreviewServiceSourceInput[],
): RuntimeExportPreviewServiceCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getServiceBlockingReasons(source);
    const state = toReadinessState(source.source_readiness_state);
    return {
      export_preview_candidate_ref:
        source.export_preview_candidate_ref ?? `${caseId}:export_preview_service:${index + 1}`,
      run_id: source.run_id,
      activity_runtime_run_id: source.activity_runtime_run_id,
      role_runtime_session_id: source.role_runtime_session_id,
      source_readiness_decision_candidate_ref: source.source_readiness_decision_candidate_ref,
      source_readiness_state: state,
      source_gate_result_refs: source.source_gate_result_refs ?? [],
      source_evidence_refs: source.source_evidence_refs ?? [],
      source_canonical_variable_refs: source.source_canonical_variable_refs ?? [],
      source_gap_refs: source.source_gap_refs ?? [],
      source_trace: source.source_trace ?? {},
      export_preview_status: resolveServiceStatus(blockingReasons, source.export_preview_status, state),
      export_preview_real_created: false,
      post_export_executed: false,
      payload_state_sent: false,
      produccion_paralela_started: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildExportEligibilityGateCandidates(
  caseId: string,
  sources: RuntimeExportEligibilityGateSourceInput[],
): RuntimeExportEligibilityGateCandidate[] {
  return sources.map((source, index) => {
    const state = toReadinessState(source.readiness_state);
    const blockingReasons = getEligibilityBlockingReasons(source, state);
    const stateBlocks = state !== "ready" && state !== "ready_with_flags";
    return {
      export_eligibility_candidate_ref:
        source.export_eligibility_candidate_ref ?? `${caseId}:export_eligibility:${index + 1}`,
      readiness_state: state,
      ready_allows_preview_candidate: state === "ready",
      ready_with_flags_allows_preview_candidate_with_visible_flags: state === "ready_with_flags",
      blocked_by_missing_evidence_blocks_preview: state === "blocked_by_missing_evidence",
      blocked_by_contradiction_blocks_preview: state === "blocked_by_contradiction",
      blocked_by_missing_canonical_route_blocks_preview: state === "blocked_by_missing_canonical_route",
      manual_review_required_blocks_preview: state === "manual_review_required",
      reentry_required_blocks_preview: state === "reentry_required",
      blocking_gap_refs_empty: (source.blocking_gap_refs?.length ?? 0) === 0,
      non_blocking_gap_refs_can_travel_as_flags: true,
      export_block_reason: stateBlocks ? "readiness_state_blocks_preview" : undefined,
      source_trace: source.source_trace ?? {},
      blocked_degraded_to_ready_with_flags: false,
      blocking_gap_hidden_as_flag: false,
      readiness_trace_missing: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildRuntimeExportContractSourceCandidates(
  caseId: string,
  sources: RuntimeExportContractSourceInput[],
): RuntimeExportContractSourceCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getContractBlockingReasons(source);
    return {
      runtime_export_contract_ref:
        source.runtime_export_contract_ref ?? `${caseId}:runtime_export_contract:${index + 1}`,
      export_contract_version: source.export_contract_version,
      payload_type: toPayloadType(source.payload_type),
      required_payload_sections: source.required_payload_sections ?? [],
      required_provenance_fields: source.required_provenance_fields ?? [],
      required_readiness_fields: source.required_readiness_fields ?? [],
      required_checksum_policy: source.required_checksum_policy,
      source_node_ref: source.source_node_ref,
      source_trace: source.source_trace ?? {},
      payload_outside_contract: false,
      payload_below_minimum: false,
      placeholder_payload_detected: false,
      contract_candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildParallelExportPayloadPreviewCandidates(
  caseId: string,
  sources: RuntimeParallelExportPayloadPreviewSourceInput[],
): RuntimeParallelExportPayloadPreviewCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getPayloadBlockingReasons(source);
    return {
      parallel_export_payload_candidate_ref:
        source.parallel_export_payload_candidate_ref ??
        `${caseId}:parallel_export_payload_preview:${index + 1}`,
      parallel_export_payload_real_created: false,
      run_id: source.run_id,
      payload_type: toPayloadType(source.payload_type),
      payload_json: source.payload_json ?? {},
      payload_state: toPayloadState(source.payload_state),
      payload_state_sent: false,
      checksum: source.checksum,
      created_at_preview: source.created_at_preview,
      source_trace: source.source_trace ?? {},
      db_write_created: false,
      post_export_executed: false,
      produccion_paralela_started: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildPayloadStateLifecycleCandidates(
  caseId: string,
  sources: RuntimePayloadStateLifecycleSourceInput[],
): RuntimePayloadStateLifecycleCandidate[] {
  return sources.map((source, index) => {
    const transition = toTransition(source.requested_transition);
    const currentState = toPayloadState(source.current_state);
    const blockingReasons = getLifecycleBlockingReasons(source, transition);
    return {
      payload_lifecycle_candidate_ref:
        source.payload_lifecycle_candidate_ref ?? `${caseId}:payload_lifecycle:${index + 1}`,
      current_state: currentState,
      requested_transition: transition,
      draft_to_ready_supported_when_eligibility_passes:
        transition === "draft_to_ready" && source.eligibility_passes === true,
      draft_to_blocked_supported_when_readiness_blocks:
        transition === "draft_to_blocked" && source.readiness_blocks === true,
      ready_to_superseded_supported_when_source_revision_changes:
        transition === "ready_to_superseded" && source.source_revision_changed === true,
      blocked_to_draft_supported_with_explicit_local_revalidation:
        transition === "blocked_to_draft" && source.explicit_local_revalidation === true,
      sent_state_attempted: false,
      invented_state_detected: false,
      audit_candidate_required: true,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildChecksumIdempotencyCandidates(
  caseId: string,
  sources: RuntimeChecksumIdempotencySourceInput[],
): RuntimeChecksumIdempotencyCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getChecksumBlockingReasons(source);
    return {
      checksum_candidate_ref: source.checksum_candidate_ref ?? `${caseId}:checksum:${index + 1}`,
      checksum_source: source.checksum_source,
      checksum_algorithm: source.checksum_algorithm,
      source_payload_hash: source.source_payload_hash,
      source_readiness_hash: source.source_readiness_hash,
      source_evidence_hash: source.source_evidence_hash,
      source_variable_hash: source.source_variable_hash,
      idempotency_key: source.idempotency_key,
      duplicate_preview_detected: source.duplicate_preview_detected === true,
      supersedes_payload_candidate_ref: source.supersedes_payload_candidate_ref,
      previous_payload_candidate_ref: source.previous_payload_candidate_ref,
      duplicate_preview_blocked: source.duplicate_preview_detected === true,
      preview_replaced_without_trace: false,
      export_payload_real_created: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSourceTraceEnvelopeCandidates(
  caseId: string,
  sources: RuntimeSourceTraceEnvelopeSourceInput[],
): RuntimeSourceTraceEnvelopeCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getEnvelopeBlockingReasons(source);
    return {
      source_trace_envelope_ref:
        source.source_trace_envelope_ref ?? `${caseId}:source_trace_envelope:${index + 1}`,
      source_document: source.source_document,
      source_sheet: source.source_sheet,
      source_row_number: source.source_row_number,
      raw_row_internal: source.raw_row_internal,
      source_codes: source.source_codes ?? [],
      source_refs: source.source_refs ?? [],
      source_gate_refs: source.source_gate_refs ?? [],
      source_gap_refs: source.source_gap_refs ?? [],
      source_evidence_refs: source.source_evidence_refs ?? [],
      source_variable_refs: source.source_variable_refs ?? [],
      source_readiness_ref: source.source_readiness_ref,
      source_trace: source.source_trace ?? {},
      source_trace_missing: false,
      provenance_fabricated: false,
      payload_without_source: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSCRPreviewCandidates(
  caseId: string,
  sources: RuntimeSCRPreviewSourceInput[],
): RuntimeSCRPreviewCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSCRPreviewBlockingReasons(source);
    return {
      scr_preview_candidate_ref:
        source.scr_preview_candidate_ref ?? `${caseId}:scr_preview:${index + 1}`,
      payload_type: "scr_patch",
      scene_canonical_record_patch: source.scene_canonical_record_patch ?? {},
      activity_anchor: source.activity_anchor ?? {},
      block_outputs: source.block_outputs ?? {},
      gaps: source.gaps ?? [],
      route_status: source.route_status ?? {},
      readiness: source.readiness ?? {},
      checksum_source: source.checksum_source ?? "",
      source_trace: source.source_trace ?? {},
      scr_preview_real_created: false,
      scene_canonical_record_real_created: false,
      scene_write_detected: false,
      object_inventory_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSCRActivityAnchorCandidates(
  caseId: string,
  sources: RuntimeSCRActivityAnchorSourceInput[],
): RuntimeSCRActivityAnchorCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSCRActivityAnchorBlockingReasons(source);
    const b0Closed = source.b0_closed_or_confirmed === true;
    return {
      scr_activity_anchor_candidate_ref:
        source.scr_activity_anchor_candidate_ref ?? `${caseId}:scr_activity_anchor:${index + 1}`,
      activity_id: source.activity_id,
      catalog_version_id: source.catalog_version_id,
      activity_name_user_confirmed: source.activity_name_user_confirmed,
      activity_semantic_action_verb: source.activity_semantic_action_verb,
      activity_semantic_input_object: source.activity_semantic_input_object,
      activity_semantic_procedure_standard: source.activity_semantic_procedure_standard,
      activity_semantic_output_product: source.activity_semantic_output_product,
      block0_entry_mode: source.block0_entry_mode,
      semantic_confirmation_status: source.semantic_confirmation_status,
      b0_q01_subfields_preserved: source.b0_q01_subfields_preserved === true,
      activity_anchor_from_unconfirmed_free_text: false,
      missing_subfield_inferred: false,
      b0_closed_or_confirmed: b0Closed,
      scr_allowed: blockingReasons.length === 0,
      source_trace: source.source_trace ?? {},
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSCRBlockOutputsCandidates(
  caseId: string,
  sources: RuntimeSCRBlockOutputsSourceInput[],
): RuntimeSCRBlockOutputsCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSCRBlockOutputsBlockingReasons(source);
    return {
      scr_block_outputs_candidate_ref:
        source.scr_block_outputs_candidate_ref ?? `${caseId}:scr_block_outputs:${index + 1}`,
      b0_output_readiness: source.b0_output_readiness,
      b05_scene_context: source.b05_scene_context,
      b1_trigger_source_channel: source.b1_trigger_source_channel,
      b2_transformation_state_initial: source.b2_transformation_state_initial,
      b2_transformation_state_final: source.b2_transformation_state_final,
      b3_output_object_receiver: source.b3_output_object_receiver,
      b4_deadlock_risk: source.b4_deadlock_risk,
      b5_capacity_gap: source.b5_capacity_gap,
      b6_rework_workaround_residual_variety: source.b6_rework_workaround_residual_variety,
      b7_preclassification_readiness: source.b7_preclassification_readiness,
      block_outputs_source_refs: source.block_outputs_source_refs ?? [],
      block_outputs_source_trace: source.block_outputs_source_trace ?? {},
      block_output_invented: false,
      b7_diagnosis_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildSCRGapReadinessRouteTransportCandidates(
  caseId: string,
  sources: RuntimeSCRGapReadinessRouteTransportSourceInput[],
): RuntimeSCRGapReadinessRouteTransportCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getSCRGapTransportBlockingReasons(source);
    return {
      scr_gap_transport_candidate_ref:
        source.scr_gap_transport_candidate_ref ?? `${caseId}:scr_gap_transport:${index + 1}`,
      gaps: source.gaps ?? [],
      readiness_state: source.readiness_state,
      readiness_flags: source.readiness_flags ?? [],
      critical_route_status: source.critical_route_status ?? {},
      blocking_gap_hidden: false,
      gaps_closed_in_scr: false,
      scr_export_allowed: blockingReasons.length === 0,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildEvidenceBundlePreviewCandidates(
  caseId: string,
  sources: RuntimeEvidenceBundlePreviewSourceInput[],
): RuntimeEvidenceBundlePreviewCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getEvidenceBundlePreviewBlockingReasons(source);
    return {
      evidence_bundle_preview_candidate_ref:
        source.evidence_bundle_preview_candidate_ref ?? `${caseId}:evidence_bundle_preview:${index + 1}`,
      payload_type: "evidence_bundle_patch",
      evidence_items: source.evidence_items ?? [],
      canonical_variables: source.canonical_variables ?? [],
      route_status: source.route_status ?? {},
      readiness: source.readiness ?? {},
      source_trace: source.source_trace ?? {},
      evidence_bundle_preview_real_created: false,
      evidence_bundle_real_created: false,
      registry_created: false,
      hard_evidence_fabricated: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildEvidenceBundleEvidenceItemCandidates(
  caseId: string,
  sources: RuntimeEvidenceBundleEvidenceItemSourceInput[],
): RuntimeEvidenceBundleEvidenceItemCandidate[] {
  return sources.map((source, index) => {
    const epistemicStatus = toEvidenceBundleEpistemicStatus(source.epistemic_status);
    const blockingReasons = getEvidenceBundleEvidenceItemBlockingReasons(source, epistemicStatus);
    return {
      evidence_item_candidate_ref:
        source.evidence_item_candidate_ref ?? `${caseId}:evidence_item:${index + 1}`,
      literal_value: source.literal_value,
      normalized_value: source.normalized_value,
      epistemic_status: epistemicStatus,
      provenance_type: source.provenance_type,
      confidence: source.confidence,
      source_ref: source.source_ref,
      response_revision_number: source.response_revision_number,
      supersedes_evidence_ref: source.supersedes_evidence_ref,
      hard_evidence:
        source.hard_evidence_requested === true &&
        (epistemicStatus === "captured_user_evidence" ||
          epistemicStatus === "user_confirmed_suggestion" ||
          epistemicStatus === "user_corrected_evidence"),
      evidence_from_absence: false,
      pending_microconfirmation_evidence: false,
      confidence_inflated: false,
      supersession_without_trace: false,
      evidence_item_real_created: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildEvidenceBundleCanonicalVariableRouteStatusCandidates(
  caseId: string,
  sources: RuntimeEvidenceBundleCanonicalVariableRouteStatusSourceInput[],
): RuntimeEvidenceBundleCanonicalVariableRouteStatusCandidate[] {
  return sources.map((source, index) => {
    const epistemicStatus = toEvidenceBundleEpistemicStatus(source.variable_epistemic_status);
    const blockingReasons = getEvidenceBundleCanonicalVariableRouteStatusBlockingReasons(source, epistemicStatus);
    return {
      canonical_variable_route_status_candidate_ref:
        source.canonical_variable_route_status_candidate_ref ??
        `${caseId}:evidence_bundle_variable_route_status:${index + 1}`,
      canonical_variable_refs: source.canonical_variable_refs ?? [],
      variable_name: source.variable_name,
      variable_value: source.variable_value,
      variable_epistemic_status: epistemicStatus,
      variable_provenance_type: source.variable_provenance_type,
      cr_b0_route_status: source.cr_b0_route_status,
      cr_b2_route_status: source.cr_b2_route_status,
      cr_b3_c09_route_status: source.cr_b3_c09_route_status,
      cr_b7_route_status: source.cr_b7_route_status,
      route_status_from_satisfaction_general: false,
      variable_from_text_similarity: false,
      new_variable_created: false,
      canonical_variable_record_real_created: false,
      route_status_real_updated: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildEvidenceBundleEpistemicHardeningBoundaries(
  caseId: string,
  sources: RuntimeEvidenceBundleEpistemicHardeningBoundarySourceInput[],
): RuntimeEvidenceBundleEpistemicHardeningBoundary[] {
  return sources.map((source, index) => {
    const epistemicStatus = toEvidenceBundleEpistemicStatus(source.epistemic_status);
    const blockingReasons = getEvidenceBundleEpistemicHardeningBlockingReasons(source, epistemicStatus);
    return {
      epistemic_hardening_boundary_ref:
        source.epistemic_hardening_boundary_ref ?? `${caseId}:evidence_bundle_hardening:${index + 1}`,
      epistemic_status: epistemicStatus,
      captured_user_evidence_preserved: epistemicStatus === "captured_user_evidence",
      user_confirmed_suggestion_preserved: epistemicStatus === "user_confirmed_suggestion",
      user_corrected_evidence_preserved: epistemicStatus === "user_corrected_evidence",
      ai_inferred_unconfirmed_hard_evidence: false,
      canonical_derivation_requires_derived_from_refs:
        epistemicStatus !== "canonical_derivation" || (source.derived_from_refs?.length ?? 0) > 0,
      internal_calculated_not_user_answer:
        epistemicStatus !== "internal_calculated" || !hasText(source.user_answer_ref),
      ai_inference_elevated: false,
      low_confidence_converted_to_hard_evidence: false,
      prior_evidence_deleted_without_supersession_trace: false,
      evidence_corrected_in_export_preview: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildMDSBStructuralCandidates(
  caseId: string,
  sources: RuntimeMDSBStructuralCandidateSourceInput[],
): RuntimeMDSBStructuralCandidate[] {
  return sources.map((source, index) => {
    const quadrant = toMDSBQuadrant(source.quadrant_hint);
    const blockingReasons = getMDSBStructuralBlockingReasons(source, quadrant);
    return {
      structural_candidate_ref:
        source.structural_candidate_ref ?? `${caseId}:mdsb_structural_candidate:${index + 1}`,
      quadrant_hint: quadrant,
      candidate_type: source.candidate_type,
      candidate_label: source.candidate_label,
      source_variable: source.source_variable,
      source_evidence_item_ref: source.source_evidence_item_ref,
      source_gate_ref: source.source_gate_ref,
      source_trace: source.source_trace ?? {},
      candidate_state: "candidate",
      accepted_structural_candidate_created: false,
      gate_blocking_respected:
        !(source.gate_blocks_candidate === true && source.accepted_structural_candidate_attempted === true),
      state_as_class: false,
      attribute_as_class: false,
      process_as_object: false,
      false_isa: false,
      fused_olc: false,
      structural_real_write_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildMDSBConformanceConsistencyCheckpointCandidates(
  caseId: string,
  sources: RuntimeMDSBConformanceConsistencyCheckpointSourceInput[],
): RuntimeMDSBConformanceConsistencyCheckpointCandidate[] {
  return sources.map((source, index) => {
    const checkpointType = toMDSBCheckpointType(source.checkpoint_type);
    const compartment = toMDSBCheckpointCompartment(source.compartment);
    const blockingReasons = getMDSBCheckpointBlockingReasons(source, checkpointType, compartment);
    return {
      checkpoint_candidate_ref:
        source.checkpoint_candidate_ref ?? `${caseId}:mdsb_checkpoint:${index + 1}`,
      checkpoint_type: checkpointType,
      compartment,
      checkpoint_label: source.checkpoint_label,
      checkpoint_reason: source.checkpoint_reason,
      source_trace: source.source_trace ?? {},
      checkpoint_invented: false,
      gate_passed_without_sources: false,
      future_mmabp_review_replaced: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildMDSBPreviewCandidates(
  caseId: string,
  sources: RuntimeMDSBPreviewSourceInput[],
): RuntimeMDSBPreviewCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getMDSBPreviewBlockingReasons(source);
    return {
      mdsb_preview_candidate_ref:
        source.mdsb_preview_candidate_ref ?? `${caseId}:mdsb_preview:${index + 1}`,
      payload_type: "mdsb_patch",
      mmabp_design_source_bundle_patch: source.mmabp_design_source_bundle_patch ?? {},
      structural_candidates: source.structural_candidates ?? [],
      conformance_checkpoints: source.conformance_checkpoints ?? [],
      consistency_checkpoints: source.consistency_checkpoints ?? [],
      source_trace: source.source_trace ?? {},
      mdsb_preview_real_created: false,
      moc_real_created: false,
      pf_real_created: false,
      olc_real_created: false,
      pm_real_created: false,
      diagram_real_created: false,
      diagnosis_created: false,
      ir_created: false,
      registry_created: false,
      core_semantics_corrected_by_mdsb: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildCombinedPreviewCandidates(
  caseId: string,
  sources: RuntimeCombinedPreviewSourceInput[],
): RuntimeCombinedPreviewCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getCombinedPreviewBlockingReasons(source);
    const missingComponent =
      !hasText(source.scr_preview_ref) ||
      !hasText(source.evidence_bundle_preview_ref) ||
      !hasText(source.mdsb_preview_ref);
    return {
      combined_preview_candidate_ref:
        source.combined_preview_candidate_ref ?? `${caseId}:combined_preview:${index + 1}`,
      payload_type: "combined_preview",
      scr_preview_ref: source.scr_preview_ref,
      evidence_bundle_preview_ref: source.evidence_bundle_preview_ref,
      mdsb_preview_ref: source.mdsb_preview_ref,
      combined_readiness_state: source.combined_readiness_state,
      combined_gap_summary: source.combined_gap_summary ?? {},
      combined_checksum: source.combined_checksum,
      source_trace: source.source_trace ?? {},
      blocked_if_any_critical_component_blocks: source.critical_component_blocked === true,
      missing_required_component_blocked: missingComponent,
      placeholder_payload_detected: false,
      combined_preview_real_sent: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildExportBlockingRuleCandidates(
  caseId: string,
  sources: RuntimeExportBlockingRuleSourceInput[],
): RuntimeExportBlockingRuleCandidate[] {
  return sources.map((source, index) => {
    const blockingReasons = getExportBlockingRuleBlockingReasons(source);
    return {
      export_blocking_rule_candidate_ref:
        source.export_blocking_rule_candidate_ref ?? `${caseId}:export_blocking_rule:${index + 1}`,
      blocked_by_readiness_state: source.blocked_by_readiness_state === true,
      blocked_by_missing_scr: source.blocked_by_missing_scr === true,
      blocked_by_missing_evidence_bundle: source.blocked_by_missing_evidence_bundle === true,
      blocked_by_missing_mdsb: source.blocked_by_missing_mdsb === true,
      blocked_by_missing_source_trace: source.blocked_by_missing_source_trace === true,
      blocked_by_unresolved_b0: source.blocked_by_unresolved_b0 === true,
      blocked_by_unresolved_b2: source.blocked_by_unresolved_b2 === true,
      blocked_by_unresolved_b3_c09: source.blocked_by_unresolved_b3_c09 === true,
      blocked_by_b7_diagnostic_attempt: source.blocked_by_b7_diagnostic_attempt === true,
      blocked_by_sem_gate: source.blocked_by_sem_gate === true,
      blocked_by_pst_gate: source.blocked_by_pst_gate === true,
      blocked_by_manual_review_required: source.blocked_by_manual_review_required === true,
      blocked_by_reentry_required: source.blocked_by_reentry_required === true,
      blocked_by_hard_evidence_violation: source.blocked_by_hard_evidence_violation === true,
      blocked_by_placeholder_payload: source.blocked_by_placeholder_payload === true,
      automatic_override_created: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildPreviewSupersessionBoundaries(
  caseId: string,
  sources: RuntimeExportPreviewSupersessionBoundarySourceInput[],
): RuntimeExportPreviewSupersessionBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getPreviewSupersessionBoundaryBlockingReasons(source);
    return {
      preview_supersession_candidate_ref:
        source.preview_supersession_candidate_ref ?? `${caseId}:preview_supersession:${index + 1}`,
      source_readiness_revision: source.source_readiness_revision,
      source_evidence_revision: source.source_evidence_revision,
      source_variable_revision: source.source_variable_revision,
      source_gate_revision: source.source_gate_revision,
      previous_preview_ref: source.previous_preview_ref,
      supersedes_preview_ref: source.supersedes_preview_ref,
      stale_reason: source.stale_reason,
      payload_state_superseded_candidate: "superseded",
      prior_preview_deleted_without_trace: false,
      supersession_real_emitted: false,
      export_payload_real_created: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildExportPreviewAuditCandidates(
  caseId: string,
  sources: RuntimeExportPreviewAuditCandidateSourceInput[],
): RuntimeExportPreviewAuditCandidate[] {
  return sources.map((source, index) => {
    const auditAction = toExportPreviewAuditAction(source.audit_action);
    const blockingReasons = getExportPreviewAuditCandidateBlockingReasons(source, auditAction);
    return {
      export_preview_audit_candidate_ref:
        source.export_preview_audit_candidate_ref ?? `${caseId}:export_preview_audit:${index + 1}`,
      audit_action: auditAction,
      audit_reason: source.audit_reason,
      source_preview_candidate_ref: source.source_preview_candidate_ref,
      source_payload_candidate_ref: source.source_payload_candidate_ref,
      source_component_ref: source.source_component_ref,
      source_trace: source.source_trace ?? {},
      runtime_audit_trail_real_created: false,
      candidate_allowed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildPhase12ExportPreviewQABoundaries(
  caseId: string,
  sources: RuntimePhase12ExportPreviewQABoundarySourceInput[],
): RuntimePhase12ExportPreviewQABoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getPhase12ExportPreviewQABoundaryBlockingReasons(source);
    return {
      phase12_export_preview_qa_boundary_ref:
        source.phase12_export_preview_qa_boundary_ref ?? `${caseId}:phase12_qa_boundary:${index + 1}`,
      export_preview_candidates_can_feed_future_qa: true,
      scr_preview_can_feed_future_qa: true,
      evidence_bundle_preview_can_feed_future_qa: true,
      mdsb_preview_can_feed_future_qa: true,
      combined_preview_can_feed_future_qa: true,
      blocked_previews_can_feed_future_qa: true,
      qa_green_declared: false,
      shadow_pilot_started: false,
      full_runtime_authorized: false,
      produccion_paralela_started: false,
      phase12_definition_of_done_modified: false,
      ready_for_phase12_authorization: false,
      phase12_started: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildNoExportRealProduccionParalelaBoundaries(
  caseId: string,
  sources: RuntimeNoExportRealProduccionParalelaBoundarySourceInput[],
): RuntimeNoExportRealProduccionParalelaBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getNoExportRealProduccionParalelaBoundaryBlockingReasons(source);
    return {
      no_export_real_boundary_ref:
        source.no_export_real_boundary_ref ?? `${caseId}:no_export_real_boundary:${index + 1}`,
      post_export_executed: false,
      payload_state_sent: false,
      external_delivery_created: false,
      produccion_paralela_real_started: false,
      parallel_production_runtime_artifacts_write_detected: false,
      registry_real_created: false,
      ir_real_created: false,
      diagnosis_real_created: false,
      control_plane_real_created: false,
      mba_write_detected: false,
      scene_write_detected: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      source_trace: source.source_trace ?? {},
      boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

export function buildExportPreviewPersistenceBoundaries(
  caseId: string,
  sources: RuntimeExportPreviewPersistenceBoundarySourceInput[],
): RuntimeExportPreviewPersistenceBoundary[] {
  return sources.map((source, index) => {
    const blockingReasons = getExportPreviewPersistenceBoundaryBlockingReasons(source);
    return {
      export_preview_persistence_boundary_ref:
        source.export_preview_persistence_boundary_ref ?? `${caseId}:export_preview_persistence:${index + 1}`,
      local_scr_preview_candidate_mode: true,
      local_evidence_bundle_preview_candidate_mode: true,
      local_mdsb_preview_candidate_mode: true,
      local_combined_preview_candidate_mode: true,
      local_parallel_export_payload_candidate_mode: true,
      local_export_audit_candidate_mode: true,
      parallel_export_payload_real_creation_authorized: false,
      db_write_authorized: false,
      supabase_touch_authorized: false,
      sql_execution_authorized: false,
      endpoint_creation_authorized: false,
      service_role_used: false,
      service_role_used_in_client: false,
      scene_write_detected: false,
      mba_write_detected: false,
      parallel_production_runtime_artifacts_write_detected: false,
      runtime_40_20_started: false,
      source_trace: source.source_trace ?? {},
      persistence_boundary_passed: blockingReasons.length === 0,
      blocking_reasons: blockingReasons,
    };
  });
}

function createResult(
  status: RuntimeExportPreviewStatus,
  revalidation: RuntimePhase11InputRevalidationDecision,
  candidates: {
    serviceCandidates?: RuntimeExportPreviewServiceCandidate[];
    eligibilityCandidates?: RuntimeExportEligibilityGateCandidate[];
    contractCandidates?: RuntimeExportContractSourceCandidate[];
    payloadCandidates?: RuntimeParallelExportPayloadPreviewCandidate[];
    lifecycleCandidates?: RuntimePayloadStateLifecycleCandidate[];
    checksumCandidates?: RuntimeChecksumIdempotencyCandidate[];
    envelopeCandidates?: RuntimeSourceTraceEnvelopeCandidate[];
  } = {},
): RuntimePhase11ExportPreviewFoundationLocalResult {
  return {
    status,
    phase11_input_revalidation: revalidation,
    export_preview_service_candidates: candidates.serviceCandidates ?? [],
    export_eligibility_gate_candidates: candidates.eligibilityCandidates ?? [],
    runtime_export_contract_source_candidates: candidates.contractCandidates ?? [],
    parallel_export_payload_preview_candidates: candidates.payloadCandidates ?? [],
    payload_state_lifecycle_candidates: candidates.lifecycleCandidates ?? [],
    checksum_idempotency_candidates: candidates.checksumCandidates ?? [],
    source_trace_envelope_candidates: candidates.envelopeCandidates ?? [],
    phase11_started_local: revalidation.phase11_started_local,
    phase11_closed_local: false,
    ready_for_phase12_authorization: false,
    readiness_recalculated: false,
    phase10_modified: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    service_role_used: false,
    service_role_used_in_client: false,
    export_preview_real_created: false,
    parallel_export_payload_real_created: false,
    payload_state_sent: false,
    post_export_executed: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    qa_green_declared: false,
    shadow_pilot_started: false,
    full_runtime_authorized: false,
    phase12_started: false,
  };
}

function resolveStatus(
  reasons: RuntimeExportPreviewBlockingReason[],
  serviceCandidates: RuntimeExportPreviewServiceCandidate[] = [],
): RuntimeExportPreviewStatus {
  if (reasons.includes("payload_state_sent_attempted")) return "blocked_payload_state_sent_attempt";
  if (
    reasons.includes("export_preview_real_creation_attempted") ||
    reasons.includes("parallel_export_payload_real_creation_attempted") ||
    reasons.includes("post_export_execution_attempted")
  ) {
    return "blocked_export_real_attempt";
  }
  if (reasons.includes("placeholder_payload_attempted")) return "blocked_placeholder_payload";
  if (reasons.includes("invalid_payload_type")) return "blocked_invalid_payload_type";
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("readiness_state_blocks_preview")) return "blocked_by_readiness_state";
  if (reasons.length > 0) return "blocked_candidate";
  if (serviceCandidates.some((candidate) => candidate.export_preview_status === "superseded_candidate")) {
    return "superseded_candidate";
  }
  if (serviceCandidates.some((candidate) => candidate.export_preview_status === "ready_candidate")) {
    return "ready_candidate";
  }
  return "draft_candidate";
}

function resolveSCRStatus(
  reasons: RuntimeSCRPreviewBlockingReason[],
  candidates: {
    scrPreviewCandidates: RuntimeSCRPreviewCandidate[];
    scrAnchorCandidates: RuntimeSCRActivityAnchorCandidate[];
    scrBlockOutputsCandidates: RuntimeSCRBlockOutputsCandidate[];
    scrGapTransportCandidates: RuntimeSCRGapReadinessRouteTransportCandidate[];
  },
): RuntimeSCRPreviewStatus {
  if (reasons.includes("scene_canonical_record_real_creation_attempted")) {
    return "blocked_scene_canonical_record_real_creation_attempt";
  }
  if (reasons.includes("scene_write_attempted")) return "blocked_scene_write_attempt";
  if (reasons.includes("b7_diagnosis_attempted")) return "blocked_b7_diagnostic_attempt";
  if (
    reasons.includes("blocked_readiness_state") ||
    reasons.includes("manual_review_required") ||
    reasons.includes("reentry_required")
  ) {
    return "blocked_by_readiness_state";
  }
  if (reasons.includes("b0_not_closed_or_confirmed")) return "blocked_unconfirmed_b0_anchor";
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (candidates.scrGapTransportCandidates.length > 0) {
    return "scr_gap_readiness_route_transport_candidate_created";
  }
  if (candidates.scrBlockOutputsCandidates.length > 0) return "scr_block_outputs_candidate_created";
  if (candidates.scrAnchorCandidates.length > 0) return "scr_activity_anchor_candidate_created";
  return "scr_preview_candidate_created";
}

function resolveEvidenceBundleStatus(
  reasons: RuntimeEvidenceBundleBlockingReason[],
  candidates: {
    previewCandidates: RuntimeEvidenceBundlePreviewCandidate[];
    evidenceItemCandidates: RuntimeEvidenceBundleEvidenceItemCandidate[];
    variableRouteStatusCandidates: RuntimeEvidenceBundleCanonicalVariableRouteStatusCandidate[];
    hardeningBoundaries: RuntimeEvidenceBundleEpistemicHardeningBoundary[];
  },
): RuntimeEvidenceBundlePreviewStatus {
  if (reasons.includes("registry_creation_attempted")) return "blocked_registry_creation_attempt";
  if (reasons.includes("new_variable_creation_attempted")) {
    return "blocked_new_variable_creation_attempt";
  }
  if (reasons.includes("route_status_from_satisfaction_general_attempted")) {
    return "blocked_route_status_from_satisfaction_general";
  }
  if (reasons.includes("pending_microconfirmation_evidence_attempted")) {
    return "blocked_pending_microconfirmation_evidence";
  }
  if (reasons.includes("evidence_from_absence_attempted")) return "blocked_evidence_from_absence";
  if (
    reasons.includes("hard_evidence_from_unconfirmed_inference_attempted") ||
    reasons.includes("ai_inference_elevation_attempted") ||
    reasons.includes("low_confidence_to_hard_evidence_attempted")
  ) {
    return "blocked_hard_evidence_from_unconfirmed_inference";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (candidates.hardeningBoundaries.length > 0) {
    return "evidence_bundle_epistemic_hardening_boundary_created";
  }
  if (candidates.variableRouteStatusCandidates.length > 0) {
    return "evidence_bundle_canonical_variable_route_status_candidate_created";
  }
  if (candidates.evidenceItemCandidates.length > 0) {
    return "evidence_bundle_evidence_item_candidate_created";
  }
  return "evidence_bundle_preview_candidate_created";
}

function resolveMDSBStatus(
  reasons: RuntimeMDSBBlockingReason[],
  candidates: {
    structuralCandidates: RuntimeMDSBStructuralCandidate[];
    checkpointCandidates: RuntimeMDSBConformanceConsistencyCheckpointCandidate[];
    mdsbPreviewCandidates: RuntimeMDSBPreviewCandidate[];
    combinedPreviewCandidates: RuntimeCombinedPreviewCandidate[];
    exportBlockingRuleCandidates: RuntimeExportBlockingRuleCandidate[];
  },
): RuntimeMDSBPreviewStatus {
  if (reasons.includes("placeholder_payload_detected")) return "blocked_placeholder_payload";
  if (
    reasons.includes("missing_scr_preview") ||
    reasons.includes("missing_evidence_bundle_preview") ||
    reasons.includes("missing_mdsb_preview")
  ) {
    return "blocked_missing_required_preview_component";
  }
  if (reasons.includes("structural_candidate_accepted_despite_gate")) {
    return "blocked_structural_candidate_accepted_despite_gate";
  }
  if (
    reasons.includes("state_as_class_attempted") ||
    reasons.includes("attribute_as_class_attempted") ||
    reasons.includes("process_as_object_attempted") ||
    reasons.includes("false_isa_attempted") ||
    reasons.includes("fused_olc_attempted") ||
    reasons.includes("core_semantics_correction_attempted")
  ) {
    return "blocked_semantic_contamination";
  }
  if (
    reasons.includes("structural_real_write_attempted") ||
    reasons.includes("moc_real_creation_attempted") ||
    reasons.includes("pf_real_creation_attempted") ||
    reasons.includes("olc_real_creation_attempted") ||
    reasons.includes("pm_real_creation_attempted") ||
    reasons.includes("diagram_real_creation_attempted")
  ) {
    return "blocked_structural_real_write_attempt";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (candidates.exportBlockingRuleCandidates.length > 0) return "export_blocking_rule_candidate_created";
  if (candidates.combinedPreviewCandidates.length > 0) return "combined_preview_candidate_created";
  if (candidates.checkpointCandidates.length > 0) {
    return "mdsb_conformance_consistency_checkpoint_candidate_created";
  }
  if (candidates.structuralCandidates.length > 0) return "mdsb_structural_candidate_created";
  return "mdsb_preview_candidate_created";
}

function resolveExportBoundaryStatus(
  reasons: RuntimeExportBoundaryBlockingReason[],
  candidates: {
    supersessionBoundaries: RuntimeExportPreviewSupersessionBoundary[];
    auditCandidates: RuntimeExportPreviewAuditCandidate[];
    qaBoundaries: RuntimePhase12ExportPreviewQABoundary[];
    noExportBoundaries: RuntimeNoExportRealProduccionParalelaBoundary[];
    persistenceBoundaries: RuntimeExportPreviewPersistenceBoundary[];
  },
): RuntimeExportBoundaryStatus {
  if (
    reasons.includes("qa_green_declaration_attempted") ||
    reasons.includes("shadow_pilot_start_attempted") ||
    reasons.includes("full_runtime_authorization_attempted") ||
    reasons.includes("phase12_definition_of_done_modification_attempted") ||
    reasons.includes("phase12_started_attempted")
  ) {
    return "blocked_qa_real_start_attempt";
  }
  if (
    reasons.includes("db_write_attempted") ||
    reasons.includes("supabase_touch_attempted") ||
    reasons.includes("sql_execution_attempted") ||
    reasons.includes("endpoint_creation_attempted") ||
    reasons.includes("service_role_client_violation") ||
    reasons.includes("runtime_real_start_attempted")
  ) {
    return "blocked_export_persistence_attempt";
  }
  if (reasons.includes("produccion_paralela_real_start_attempted")) {
    return "blocked_produccion_paralela_attempt";
  }
  if (reasons.includes("payload_state_sent_attempted")) {
    return "blocked_payload_state_sent_attempt";
  }
  if (
    reasons.includes("post_export_attempted") ||
    reasons.includes("export_payload_real_creation_attempted") ||
    reasons.includes("external_delivery_attempted")
  ) {
    return "blocked_export_real_attempt";
  }
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (candidates.persistenceBoundaries.length > 0) return "export_preview_persistence_boundary_created";
  if (candidates.noExportBoundaries.length > 0) {
    return "no_export_real_produccion_paralela_boundary_created";
  }
  if (candidates.qaBoundaries.length > 0) return "phase12_export_preview_qa_boundary_created";
  if (candidates.auditCandidates.length > 0) return "export_preview_audit_candidate_created";
  return "preview_supersession_boundary_created";
}

function resolveServiceStatus(
  reasons: RuntimeExportPreviewBlockingReason[],
  requestedStatus: unknown,
  state?: RuntimeReadinessStateForExportPreview,
): RuntimeExportPreviewStatus {
  const blocked = resolveStatus(reasons);
  if (blocked.startsWith("blocked")) return blocked;
  if (
    requestedStatus === "superseded_candidate" ||
    requestedStatus === "ready_candidate" ||
    requestedStatus === "blocked_candidate" ||
    requestedStatus === "draft_candidate"
  ) {
    return requestedStatus;
  }
  if (state === "ready" || state === "ready_with_flags") return "ready_candidate";
  return "draft_candidate";
}

function getServiceBlockingReasons(
  source: RuntimeExportPreviewServiceSourceInput,
): RuntimeExportPreviewBlockingReason[] {
  const reasons = getBoundaryGuardBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!isReadinessState(source.source_readiness_state)) reasons.push("invalid_readiness_state");
  return [...new Set(reasons)];
}

function getEligibilityBlockingReasons(
  source: RuntimeExportEligibilityGateSourceInput,
  state?: RuntimeReadinessStateForExportPreview,
): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!state) reasons.push("invalid_readiness_state");
  if (state && state !== "ready" && state !== "ready_with_flags") {
    reasons.push("readiness_state_blocks_preview");
  }
  if ((source.blocking_gap_refs?.length ?? 0) > 0) reasons.push("blocking_gap_refs_present");
  if (source.blocked_degraded_to_ready_with_flags_attempted === true) {
    reasons.push("blocked_degraded_to_ready_with_flags_attempted");
  }
  if (source.blocking_gap_hidden_as_flag_attempted === true) {
    reasons.push("blocking_gap_hidden_as_flag_attempted");
  }
  return [...new Set(reasons)];
}

function getContractBlockingReasons(
  source: RuntimeExportContractSourceInput,
): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  if (!isPayloadType(source.payload_type)) reasons.push("invalid_payload_type");
  if ((source.required_payload_sections?.length ?? 0) === 0) {
    reasons.push("missing_required_payload_sections");
  }
  if ((source.required_provenance_fields?.length ?? 0) === 0) {
    reasons.push("missing_required_provenance_fields");
  }
  if ((source.required_readiness_fields?.length ?? 0) === 0) {
    reasons.push("missing_required_readiness_fields");
  }
  if (!hasText(source.required_checksum_policy)) reasons.push("missing_required_checksum_policy");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.payload_outside_contract_attempted === true) {
    reasons.push("payload_outside_contract_attempted");
  }
  if (source.payload_below_minimum_attempted === true) {
    reasons.push("payload_below_minimum_attempted");
  }
  if (source.placeholder_payload_attempted === true) {
    reasons.push("placeholder_payload_attempted");
  }
  return [...new Set(reasons)];
}

function getPayloadBlockingReasons(
  source: RuntimeParallelExportPayloadPreviewSourceInput,
): RuntimeExportPreviewBlockingReason[] {
  const reasons = getBoundaryGuardBlockingReasons(source);
  if (!isPayloadType(source.payload_type)) reasons.push("invalid_payload_type");
  if (source.payload_state === "sent") reasons.push("payload_state_sent_attempted");
  if (!isPayloadState(source.payload_state)) reasons.push("invalid_payload_state");
  if (!hasText(source.checksum)) reasons.push("missing_checksum");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getLifecycleBlockingReasons(
  source: RuntimePayloadStateLifecycleSourceInput,
  transition?: RuntimePayloadLifecycleTransition,
): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  if (source.current_state === "sent") reasons.push("payload_state_sent_attempted");
  if (!isPayloadState(source.current_state)) reasons.push("invalid_payload_state");
  if (!transition) reasons.push("invalid_payload_state");
  if (!hasText(source.audit_candidate_ref)) reasons.push("missing_audit_candidate");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getChecksumBlockingReasons(
  source: RuntimeChecksumIdempotencySourceInput,
): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  if (!hasText(source.checksum_source)) reasons.push("missing_checksum_source");
  if (!hasText(source.checksum_algorithm)) reasons.push("missing_checksum_algorithm");
  if (!hasText(source.source_payload_hash)) reasons.push("missing_source_payload_hash");
  if (source.duplicate_preview_detected === true) {
    reasons.push("duplicate_preview_for_same_run_source_hash");
  }
  if (source.preview_replaced_without_trace_attempted === true) {
    reasons.push("preview_replaced_without_trace_attempted");
  }
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  return [...new Set(reasons)];
}

function getEnvelopeBlockingReasons(
  source: RuntimeSourceTraceEnvelopeSourceInput,
): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  const hasEnvelopeSource =
    hasText(source.source_document) &&
    hasText(source.source_sheet) &&
    typeof source.source_row_number === "number";
  if (!hasEnvelopeSource || !hasSourceTrace(source.source_trace)) {
    reasons.push("missing_source_trace");
  }
  if (source.provenance_fabricated_attempted === true) {
    reasons.push("fabricated_provenance_attempted");
  }
  if (source.payload_without_source_attempted === true) {
    reasons.push("payload_without_source_attempted");
  }
  return [...new Set(reasons)];
}

function getSCRPreviewBlockingReasons(
  source: RuntimeSCRPreviewSourceInput,
): RuntimeSCRPreviewBlockingReason[] {
  const reasons = getSCRBoundaryBlockingReasons(source);
  if (source.payload_type !== "scr_patch") reasons.push("invalid_payload_type");
  if (!hasText(source.checksum_source)) reasons.push("missing_checksum_source");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.scene_canonical_record_real_creation_attempted === true) {
    reasons.push("scene_canonical_record_real_creation_attempted");
  }
  if (source.object_inventory_creation_attempted === true) {
    reasons.push("object_inventory_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getSCRActivityAnchorBlockingReasons(
  source: RuntimeSCRActivityAnchorSourceInput,
): RuntimeSCRPreviewBlockingReason[] {
  const reasons: RuntimeSCRPreviewBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.activity_id)) reasons.push("missing_activity_id");
  if (!hasText(source.catalog_version_id)) reasons.push("missing_catalog_version_id");
  if (source.activity_anchor_from_unconfirmed_free_text_attempted === true) {
    reasons.push("activity_anchor_from_unconfirmed_free_text");
  }
  if (source.missing_subfield_inferred_attempted === true) {
    reasons.push("missing_subfield_inferred_attempted");
  }
  if (source.b0_closed_or_confirmed !== true) reasons.push("b0_not_closed_or_confirmed");
  return [...new Set(reasons)];
}

function getSCRBlockOutputsBlockingReasons(
  source: RuntimeSCRBlockOutputsSourceInput,
): RuntimeSCRPreviewBlockingReason[] {
  const reasons: RuntimeSCRPreviewBlockingReason[] = [];
  if ((source.block_outputs_source_refs?.length ?? 0) === 0) {
    reasons.push("missing_source_trace");
  }
  if (!hasSourceTrace(source.block_outputs_source_trace)) reasons.push("missing_source_trace");
  if (source.block_output_invented_attempted === true) {
    reasons.push("block_output_invented_attempted");
  }
  if (source.b7_diagnosis_attempted === true) reasons.push("b7_diagnosis_attempted");
  return [...new Set(reasons)];
}

function getSCRGapTransportBlockingReasons(
  source: RuntimeSCRGapReadinessRouteTransportSourceInput,
): RuntimeSCRPreviewBlockingReason[] {
  const reasons: RuntimeSCRPreviewBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  for (const gap of source.gaps ?? []) {
    if (!hasText(gap.gap_id) || !hasSourceTrace(gap.source_trace)) {
      reasons.push("missing_source_trace");
    }
  }
  if (source.blocking_gap_hidden_attempted === true) reasons.push("blocking_gap_hidden_attempted");
  if (source.gaps_closed_in_scr_attempted === true) reasons.push("gaps_closed_in_scr_attempted");
  if (
    source.readiness_state === "blocked_by_missing_evidence" ||
    source.readiness_state === "blocked_by_contradiction" ||
    source.readiness_state === "blocked_by_missing_canonical_route"
  ) {
    reasons.push("blocked_readiness_state");
  }
  if (source.readiness_state === "manual_review_required") reasons.push("manual_review_required");
  if (source.readiness_state === "reentry_required") reasons.push("reentry_required");
  return [...new Set(reasons)];
}

function getEvidenceBundlePreviewBlockingReasons(
  source: RuntimeEvidenceBundlePreviewSourceInput,
): RuntimeEvidenceBundleBlockingReason[] {
  const reasons = getEvidenceBundleBoundaryBlockingReasons(source);
  if (source.payload_type !== "evidence_bundle_patch") reasons.push("invalid_payload_type");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.evidence_bundle_real_creation_attempted === true) {
    reasons.push("evidence_bundle_real_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getEvidenceBundleEvidenceItemBlockingReasons(
  source: RuntimeEvidenceBundleEvidenceItemSourceInput,
  epistemicStatus?: RuntimeEvidenceBundleEpistemicStatus,
): RuntimeEvidenceBundleBlockingReason[] {
  const reasons = getEvidenceBundleBoundaryBlockingReasons(source);
  if (!hasText(source.evidence_item_candidate_ref)) reasons.push("missing_evidence_item_ref");
  if (!epistemicStatus) reasons.push("missing_epistemic_status");
  if (!hasText(source.provenance_type)) reasons.push("missing_provenance_type");
  if (!hasText(source.source_ref)) reasons.push("missing_source_ref");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.hard_evidence_requested === true && epistemicStatus === "ai_inferred_unconfirmed") {
    reasons.push("hard_evidence_from_unconfirmed_inference_attempted");
  }
  if (source.evidence_from_absence_attempted === true) reasons.push("evidence_from_absence_attempted");
  if (source.pending_microconfirmation_evidence_attempted === true) {
    reasons.push("pending_microconfirmation_evidence_attempted");
  }
  if (source.confidence_inflation_attempted === true) reasons.push("confidence_inflation_attempted");
  if (source.supersession_without_trace_attempted === true) {
    reasons.push("supersession_without_trace_attempted");
  }
  if (
    hasText(source.supersedes_evidence_ref) &&
    !hasSourceTrace(source.supersession_source_trace)
  ) {
    reasons.push("supersession_without_trace_attempted");
  }
  if (source.evidence_item_real_creation_attempted === true) {
    reasons.push("evidence_item_real_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getEvidenceBundleCanonicalVariableRouteStatusBlockingReasons(
  source: RuntimeEvidenceBundleCanonicalVariableRouteStatusSourceInput,
  epistemicStatus?: RuntimeEvidenceBundleEpistemicStatus,
): RuntimeEvidenceBundleBlockingReason[] {
  const reasons = getEvidenceBundleBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!epistemicStatus) reasons.push("missing_epistemic_status");
  if (!hasText(source.variable_provenance_type)) reasons.push("missing_provenance_type");
  if ((source.canonical_variable_refs?.length ?? 0) === 0) reasons.push("missing_source_ref");
  if (source.route_status_source === "satisfaction_general") {
    reasons.push("route_status_from_satisfaction_general_attempted");
  }
  if (source.variable_from_text_similarity_attempted === true) {
    reasons.push("variable_from_text_similarity_attempted");
  }
  if (source.new_variable_creation_attempted === true) reasons.push("new_variable_creation_attempted");
  if (source.canonical_variable_record_real_creation_attempted === true) {
    reasons.push("canonical_variable_record_real_creation_attempted");
  }
  if (source.route_status_real_update_attempted === true) {
    reasons.push("route_status_real_update_attempted");
  }
  return [...new Set(reasons)];
}

function getEvidenceBundleEpistemicHardeningBlockingReasons(
  source: RuntimeEvidenceBundleEpistemicHardeningBoundarySourceInput,
  epistemicStatus?: RuntimeEvidenceBundleEpistemicStatus,
): RuntimeEvidenceBundleBlockingReason[] {
  const reasons = getEvidenceBundleBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!epistemicStatus) reasons.push("missing_epistemic_status");
  if (
    source.hard_evidence_requested === true &&
    (epistemicStatus === "ai_inferred_unconfirmed" || source.ai_inference_elevation_attempted === true)
  ) {
    reasons.push("ai_inference_elevation_attempted");
  }
  if (source.ai_inference_elevation_attempted === true) {
    reasons.push("ai_inference_elevation_attempted");
  }
  if (source.low_confidence_to_hard_evidence_attempted === true) {
    reasons.push("low_confidence_to_hard_evidence_attempted");
  }
  if (source.prior_evidence_deleted_without_supersession_trace_attempted === true) {
    reasons.push("prior_evidence_deleted_without_supersession_trace_attempted");
  }
  if (source.evidence_corrected_in_export_preview_attempted === true) {
    reasons.push("evidence_corrected_in_export_preview_attempted");
  }
  if (epistemicStatus === "canonical_derivation" && (source.derived_from_refs?.length ?? 0) === 0) {
    reasons.push("missing_source_ref");
  }
  return [...new Set(reasons)];
}

function getMDSBStructuralBlockingReasons(
  source: RuntimeMDSBStructuralCandidateSourceInput,
  quadrant?: RuntimeMDSBQuadrantHint,
): RuntimeMDSBBlockingReason[] {
  const reasons = getMDSBBoundaryBlockingReasons(source);
  if (!hasText(source.structural_candidate_ref)) reasons.push("missing_structural_candidate_ref");
  if (!quadrant) reasons.push("missing_quadrant_hint");
  if (!hasText(source.candidate_type)) reasons.push("missing_candidate_type");
  if (!hasText(source.candidate_label)) reasons.push("missing_candidate_label");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.gate_blocks_candidate === true && source.accepted_structural_candidate_attempted === true) {
    reasons.push("structural_candidate_accepted_despite_gate");
  }
  if (source.state_as_class_attempted === true) reasons.push("state_as_class_attempted");
  if (source.attribute_as_class_attempted === true) reasons.push("attribute_as_class_attempted");
  if (source.process_as_object_attempted === true) reasons.push("process_as_object_attempted");
  if (source.false_isa_attempted === true) reasons.push("false_isa_attempted");
  if (source.fused_olc_attempted === true) reasons.push("fused_olc_attempted");
  if (source.structural_real_write_attempted === true) {
    reasons.push("structural_real_write_attempted");
  }
  return [...new Set(reasons)];
}

function getMDSBCheckpointBlockingReasons(
  source: RuntimeMDSBConformanceConsistencyCheckpointSourceInput,
  checkpointType?: RuntimeMDSBCheckpointType,
  compartment?: RuntimeMDSBCheckpointCompartment,
): RuntimeMDSBBlockingReason[] {
  const reasons = getMDSBBoundaryBlockingReasons(source);
  if (!checkpointType || !compartment || !hasSourceTrace(source.source_trace)) {
    reasons.push("missing_source_trace");
  }
  if (source.checkpoint_invented_attempted === true) {
    reasons.push("checkpoint_invented_attempted");
  }
  if (source.gate_passed_without_sources_attempted === true) {
    reasons.push("gate_passed_without_sources_attempted");
  }
  if (source.future_mmabp_review_replaced_attempted === true) {
    reasons.push("future_mmabp_review_replaced_attempted");
  }
  return [...new Set(reasons)];
}

function getMDSBPreviewBlockingReasons(
  source: RuntimeMDSBPreviewSourceInput,
): RuntimeMDSBBlockingReason[] {
  const reasons = getMDSBBoundaryBlockingReasons(source);
  if (source.payload_type !== "mdsb_patch") reasons.push("invalid_payload_type");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.mdsb_preview_real_creation_attempted === true) {
    reasons.push("structural_real_write_attempted");
  }
  if (source.moc_real_creation_attempted === true) reasons.push("moc_real_creation_attempted");
  if (source.pf_real_creation_attempted === true) reasons.push("pf_real_creation_attempted");
  if (source.olc_real_creation_attempted === true) reasons.push("olc_real_creation_attempted");
  if (source.pm_real_creation_attempted === true) reasons.push("pm_real_creation_attempted");
  if (source.diagram_real_creation_attempted === true) reasons.push("diagram_real_creation_attempted");
  if (source.core_semantics_correction_attempted === true) {
    reasons.push("core_semantics_correction_attempted");
  }
  return [...new Set(reasons)];
}

function getCombinedPreviewBlockingReasons(
  source: RuntimeCombinedPreviewSourceInput,
): RuntimeMDSBBlockingReason[] {
  const reasons = getMDSBBoundaryBlockingReasons(source);
  if (source.payload_type !== "combined_preview") reasons.push("invalid_payload_type");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.scr_preview_ref)) reasons.push("missing_scr_preview");
  if (!hasText(source.evidence_bundle_preview_ref)) {
    reasons.push("missing_evidence_bundle_preview");
  }
  if (!hasText(source.mdsb_preview_ref)) reasons.push("missing_mdsb_preview");
  if (source.critical_component_blocked === true) reasons.push("critical_component_blocked");
  if (source.placeholder_payload_attempted === true) reasons.push("placeholder_payload_detected");
  if (source.combined_preview_real_send_attempted === true) reasons.push("export_real_attempted");
  return [...new Set(reasons)];
}

function getExportBlockingRuleBlockingReasons(
  source: RuntimeExportBlockingRuleSourceInput,
): RuntimeMDSBBlockingReason[] {
  const reasons = getMDSBBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace) || source.blocked_by_missing_source_trace === true) {
    reasons.push("missing_source_trace");
  }
  if (source.blocked_by_placeholder_payload === true) reasons.push("placeholder_payload_detected");
  if (source.automatic_override_creation_attempted === true) {
    reasons.push("automatic_override_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getPreviewSupersessionBoundaryBlockingReasons(
  source: RuntimeExportPreviewSupersessionBoundarySourceInput,
): RuntimeExportBoundaryBlockingReason[] {
  const reasons = getExportBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (!hasText(source.stale_reason)) reasons.push("missing_stale_reason");
  if (source.prior_preview_deleted_without_trace_attempted === true) {
    reasons.push("previous_preview_deleted_without_trace_attempted");
  }
  if (source.supersession_real_emission_attempted === true) {
    reasons.push("supersession_real_emission_attempted");
  }
  if (source.export_payload_real_creation_attempted === true) {
    reasons.push("export_payload_real_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getExportPreviewAuditCandidateBlockingReasons(
  source: RuntimeExportPreviewAuditCandidateSourceInput,
  auditAction?: RuntimeExportPreviewAuditAction,
): RuntimeExportBoundaryBlockingReason[] {
  const reasons = getExportBoundaryBlockingReasons(source);
  if (!auditAction) reasons.push("invalid_audit_action");
  if (!hasText(source.audit_reason)) reasons.push("missing_audit_reason");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.db_write_attempted === true) reasons.push("db_write_attempted");
  return [...new Set(reasons)];
}

function getPhase12ExportPreviewQABoundaryBlockingReasons(
  source: RuntimePhase12ExportPreviewQABoundarySourceInput,
): RuntimeExportBoundaryBlockingReason[] {
  const reasons = getExportBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.qa_green_declaration_attempted === true) reasons.push("qa_green_declaration_attempted");
  if (source.shadow_pilot_start_attempted === true) reasons.push("shadow_pilot_start_attempted");
  if (source.full_runtime_authorization_attempted === true) {
    reasons.push("full_runtime_authorization_attempted");
  }
  if (source.phase12_definition_of_done_modification_attempted === true) {
    reasons.push("phase12_definition_of_done_modification_attempted");
  }
  if (source.phase12_started_attempted === true) reasons.push("phase12_started_attempted");
  if (source.produccion_paralela_real_start_attempted === true) {
    reasons.push("produccion_paralela_real_start_attempted");
  }
  return [...new Set(reasons)];
}

function getNoExportRealProduccionParalelaBoundaryBlockingReasons(
  source: RuntimeNoExportRealProduccionParalelaBoundarySourceInput,
): RuntimeExportBoundaryBlockingReason[] {
  const reasons = getExportBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.post_export_attempted === true) reasons.push("post_export_attempted");
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (source.external_delivery_attempted === true) reasons.push("external_delivery_attempted");
  if (source.produccion_paralela_real_start_attempted === true) {
    reasons.push("produccion_paralela_real_start_attempted");
  }
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.registry_real_creation_attempted === true) reasons.push("registry_real_creation_attempted");
  if (source.ir_real_creation_attempted === true) reasons.push("ir_real_creation_attempted");
  if (source.diagnosis_real_creation_attempted === true) reasons.push("diagnosis_real_creation_attempted");
  if (source.control_plane_real_creation_attempted === true) {
    reasons.push("control_plane_real_creation_attempted");
  }
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  return [...new Set(reasons)];
}

function getExportPreviewPersistenceBoundaryBlockingReasons(
  source: RuntimeExportPreviewPersistenceBoundarySourceInput,
): RuntimeExportBoundaryBlockingReason[] {
  const reasons = getExportBoundaryBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.parallel_export_payload_real_creation_attempted === true) {
    reasons.push("export_payload_real_creation_attempted");
  }
  if (source.db_write_attempted === true) reasons.push("db_write_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_client_use_attempted === true) reasons.push("service_role_client_violation");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.runtime_real_start_attempted === true) reasons.push("runtime_real_start_attempted");
  return [...new Set(reasons)];
}

function getSCRBoundaryBlockingReasons(source: {
  export_preview_real_creation_attempted?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  post_export_execution_attempted?: boolean;
  produccion_paralela_start_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  scene_write_attempted?: boolean;
}): RuntimeSCRPreviewBlockingReason[] {
  const reasons: RuntimeSCRPreviewBlockingReason[] = [];
  if (source.export_preview_real_creation_attempted === true) reasons.push("export_real_attempted");
  if (source.parallel_export_payload_real_creation_attempted === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (source.post_export_execution_attempted === true) reasons.push("post_export_attempted");
  if (source.produccion_paralela_start_attempted === true) reasons.push("export_real_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  return [...new Set(reasons)];
}

function getExportBoundaryBlockingReasons(source: {
  post_export_execution_attempted?: boolean;
  post_export_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  produccion_paralela_start_attempted?: boolean;
  produccion_paralela_real_start_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  registry_creation_attempted?: boolean;
  ir_creation_attempted?: boolean;
  diagnosis_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  phase12_started_attempted?: boolean;
}): RuntimeExportBoundaryBlockingReason[] {
  const reasons: RuntimeExportBoundaryBlockingReason[] = [];
  if (source.post_export_execution_attempted === true || source.post_export_attempted === true) {
    reasons.push("post_export_attempted");
  }
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (
    source.produccion_paralela_start_attempted === true ||
    source.produccion_paralela_real_start_attempted === true
  ) {
    reasons.push("produccion_paralela_real_start_attempted");
  }
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.registry_creation_attempted === true) reasons.push("registry_real_creation_attempted");
  if (source.ir_creation_attempted === true) reasons.push("ir_real_creation_attempted");
  if (source.diagnosis_creation_attempted === true) reasons.push("diagnosis_real_creation_attempted");
  if (source.control_plane_real_creation_attempted === true) {
    reasons.push("control_plane_real_creation_attempted");
  }
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_client_use_attempted === true) reasons.push("service_role_client_violation");
  if (source.phase12_started_attempted === true) reasons.push("phase12_started_attempted");
  return [...new Set(reasons)];
}

function getMDSBBoundaryBlockingReasons(source: {
  export_preview_real_creation_attempted?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  post_export_execution_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
  diagnosis_creation_attempted?: boolean;
  ir_creation_attempted?: boolean;
  registry_creation_attempted?: boolean;
}): RuntimeMDSBBlockingReason[] {
  const reasons: RuntimeMDSBBlockingReason[] = [];
  if (source.export_preview_real_creation_attempted === true) reasons.push("export_real_attempted");
  if (source.parallel_export_payload_real_creation_attempted === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (source.post_export_execution_attempted === true) reasons.push("post_export_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.diagnosis_creation_attempted === true) reasons.push("diagnosis_creation_attempted");
  if (source.ir_creation_attempted === true) reasons.push("ir_creation_attempted");
  if (source.registry_creation_attempted === true) reasons.push("registry_creation_attempted");
  return [...new Set(reasons)];
}

function getEvidenceBundleBoundaryBlockingReasons(source: {
  export_preview_real_creation_attempted?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  post_export_execution_attempted?: boolean;
  registry_creation_attempted?: boolean;
  supabase_touch_attempted?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_creation_attempted?: boolean;
}): RuntimeEvidenceBundleBlockingReason[] {
  const reasons: RuntimeEvidenceBundleBlockingReason[] = [];
  if (source.export_preview_real_creation_attempted === true) reasons.push("export_real_attempted");
  if (source.parallel_export_payload_real_creation_attempted === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (source.post_export_execution_attempted === true) reasons.push("post_export_attempted");
  if (source.registry_creation_attempted === true) reasons.push("registry_creation_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  return [...new Set(reasons)];
}

function getBoundaryGuardBlockingReasons(source: {
  readiness_recalculation_attempted?: boolean;
  phase10_modification_attempted?: boolean;
  export_preview_previously_created?: boolean;
  export_preview_real_creation_attempted?: boolean;
  parallel_export_payload_real_previously_created?: boolean;
  parallel_export_payload_real_creation_attempted?: boolean;
  post_export_execution_attempted?: boolean;
  payload_state_sent_attempted?: boolean;
  produccion_paralela_previously_started?: boolean;
  produccion_paralela_start_attempted?: boolean;
  registry_previously_created?: boolean;
  registry_creation_attempted?: boolean;
  ir_creation_attempted?: boolean;
  diagnosis_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  supabase_previously_touched?: boolean;
  supabase_touch_attempted?: boolean;
  sql_previously_executed?: boolean;
  sql_execution_attempted?: boolean;
  endpoint_previously_created?: boolean;
  endpoint_creation_attempted?: boolean;
  service_role_client_use_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
  phase12_started_attempted?: boolean;
}): RuntimeExportPreviewBlockingReason[] {
  const reasons: RuntimeExportPreviewBlockingReason[] = [];
  if (source.readiness_recalculation_attempted === true) {
    reasons.push("readiness_recalculation_attempted");
  }
  if (source.phase10_modification_attempted === true) {
    reasons.push("phase10_modification_attempted");
  }
  if (source.export_preview_previously_created === true) {
    reasons.push("export_preview_real_creation_attempted");
  }
  if (source.export_preview_real_creation_attempted === true) {
    reasons.push("export_preview_real_creation_attempted");
  }
  if (source.parallel_export_payload_real_previously_created === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.parallel_export_payload_real_creation_attempted === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.post_export_execution_attempted === true) {
    reasons.push("post_export_execution_attempted");
  }
  if (source.payload_state_sent_attempted === true) reasons.push("payload_state_sent_attempted");
  if (source.produccion_paralela_previously_started === true) {
    reasons.push("produccion_paralela_start_attempted");
  }
  if (source.produccion_paralela_start_attempted === true) {
    reasons.push("produccion_paralela_start_attempted");
  }
  if (source.registry_previously_created === true) reasons.push("registry_creation_attempted");
  if (source.registry_creation_attempted === true) reasons.push("registry_creation_attempted");
  if (source.ir_creation_attempted === true) reasons.push("ir_creation_attempted");
  if (source.diagnosis_creation_attempted === true) reasons.push("diagnosis_creation_attempted");
  if (source.control_plane_real_creation_attempted === true) {
    reasons.push("control_plane_real_creation_attempted");
  }
  if (source.supabase_previously_touched === true) reasons.push("supabase_touch_attempted");
  if (source.supabase_touch_attempted === true) reasons.push("supabase_touch_attempted");
  if (source.sql_previously_executed === true) reasons.push("sql_execution_attempted");
  if (source.sql_execution_attempted === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_previously_created === true) reasons.push("endpoint_creation_attempted");
  if (source.endpoint_creation_attempted === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_client_use_attempted === true) {
    reasons.push("service_role_client_violation");
  }
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.phase12_started_attempted === true) reasons.push("phase12_started_attempted");
  return [...new Set(reasons)];
}

function toReadinessState(value: unknown): RuntimeReadinessStateForExportPreview | undefined {
  return isReadinessState(value) ? value : undefined;
}

function toPayloadType(value: unknown): RuntimeExportPayloadType | undefined {
  return isPayloadType(value) ? value : undefined;
}

function toPayloadState(value: unknown): RuntimeExportPayloadState {
  return isPayloadState(value) ? value : "blocked";
}

function toTransition(value: unknown): RuntimePayloadLifecycleTransition | undefined {
  return isTransition(value) ? value : undefined;
}

function toEvidenceBundleEpistemicStatus(value: unknown): RuntimeEvidenceBundleEpistemicStatus | undefined {
  return isEvidenceBundleEpistemicStatus(value) ? value : undefined;
}

function toMDSBQuadrant(value: unknown): RuntimeMDSBQuadrantHint | undefined {
  return isMDSBQuadrant(value) ? value : undefined;
}

function toMDSBCheckpointType(value: unknown): RuntimeMDSBCheckpointType | undefined {
  return isMDSBCheckpointType(value) ? value : undefined;
}

function toMDSBCheckpointCompartment(value: unknown): RuntimeMDSBCheckpointCompartment | undefined {
  return isMDSBCheckpointCompartment(value) ? value : undefined;
}

function toExportPreviewAuditAction(value: unknown): RuntimeExportPreviewAuditAction | undefined {
  return isExportPreviewAuditAction(value) ? value : undefined;
}

function isReadinessState(value: unknown): value is RuntimeReadinessStateForExportPreview {
  return (
    typeof value === "string" &&
    ALLOWED_READINESS_STATES.includes(value as RuntimeReadinessStateForExportPreview)
  );
}

function isPayloadType(value: unknown): value is RuntimeExportPayloadType {
  return typeof value === "string" && ALLOWED_PAYLOAD_TYPES.includes(value as RuntimeExportPayloadType);
}

function isPayloadState(value: unknown): value is RuntimeExportPayloadState {
  return typeof value === "string" && ALLOWED_PAYLOAD_STATES.includes(value as RuntimeExportPayloadState);
}

function isTransition(value: unknown): value is RuntimePayloadLifecycleTransition {
  return (
    typeof value === "string" &&
    ALLOWED_TRANSITIONS.includes(value as RuntimePayloadLifecycleTransition)
  );
}

function isEvidenceBundleEpistemicStatus(value: unknown): value is RuntimeEvidenceBundleEpistemicStatus {
  return (
    typeof value === "string" &&
    ALLOWED_EVIDENCE_BUNDLE_EPISTEMIC_STATUSES.includes(
      value as RuntimeEvidenceBundleEpistemicStatus,
    )
  );
}

function isMDSBQuadrant(value: unknown): value is RuntimeMDSBQuadrantHint {
  return typeof value === "string" && ALLOWED_MDSB_QUADRANTS.includes(value as RuntimeMDSBQuadrantHint);
}

function isMDSBCheckpointType(value: unknown): value is RuntimeMDSBCheckpointType {
  return (
    typeof value === "string" &&
    ALLOWED_MDSB_CHECKPOINT_TYPES.includes(value as RuntimeMDSBCheckpointType)
  );
}

function isMDSBCheckpointCompartment(value: unknown): value is RuntimeMDSBCheckpointCompartment {
  return (
    typeof value === "string" &&
    ALLOWED_MDSB_CHECKPOINT_COMPARTMENTS.includes(value as RuntimeMDSBCheckpointCompartment)
  );
}

function isExportPreviewAuditAction(value: unknown): value is RuntimeExportPreviewAuditAction {
  return (
    typeof value === "string" &&
    ALLOWED_EXPORT_PREVIEW_AUDIT_ACTIONS.includes(value as RuntimeExportPreviewAuditAction)
  );
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
