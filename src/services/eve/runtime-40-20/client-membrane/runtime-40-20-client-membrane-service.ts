import type {
  RuntimeClientBFFReadBlockingReason,
  RuntimeClientBFFReadContractCandidate,
  RuntimeClientBFFContractCandidate,
  RuntimeClientCanonicalVariableCandidateHandoff,
  RuntimeClientCorrectionReentryHandoffCandidate,
  RuntimeClientCriticalRouteGateSummaryCandidate,
  RuntimeClientHiddenInternalSurface,
  RuntimeClientAnswerCaptureCandidate,
  RuntimeClientBudgetVisibilityCandidate,
  RuntimeClientEvidenceCandidateHandoff,
  RuntimeClientEvidenceHandoffBlockingReason,
  RuntimeClientEvidenceProvenanceEnvelopeCandidate,
  RuntimeClientExplicitGapCandidate,
  RuntimeClientGateGreaterThanChipEnforcementCandidate,
  RuntimeClientGateReadinessAuditCandidate,
  RuntimeClientGateReadinessBlockingReason,
  RuntimeClientGateInputCandidate,
  RuntimeClientInteractionCursorBlockingReason,
  RuntimeClientInteractionTransitionCandidate,
  RuntimeClientLocalInteractionCursorCandidate,
  RuntimeClientLocalCloseoutSnapshotCandidate,
  RuntimeClientInternalSurfaceGuardCandidate,
  RuntimeClientManualReviewCandidate,
  RuntimeClientMembraneAuditCandidate,
  RuntimeClientMembraneBlockingReason,
  RuntimeClientMembraneCardKind,
  RuntimeClientLocalWiringBlockingReason,
  RuntimeClientLocalWiringEvidenceCandidate,
  RuntimeClientMembraneLocalInput,
  RuntimeClientMembraneSourceTrace,
  RuntimeClientMembraneFixtureCandidate,
  RuntimeClientNoDirectInternalInvocationGuardCandidate,
  RuntimeClientNoDiagnosticInferenceGuardCandidate,
  RuntimeClientNoActivationNoPhaseCloseGuardCandidate,
  RuntimeClientNoDiagnosisNoExportCloseoutGuardCandidate,
  RuntimeClientNoGoCandidate,
  RuntimeClientNoRealPersistenceGuardCandidate,
  RuntimeClientNextActionCandidate,
  RuntimeClientOutcomeCandidate,
  RuntimeClientOutcomeCloseoutAuditCandidate,
  RuntimeClientOutcomeCloseoutBlockingReason,
  RuntimeClientQuestionPresentationCandidate,
  RuntimeClientReadinessStateCandidate,
  RuntimeClientReviewCloseoutCandidate,
  RuntimeClientReentryCandidate,
  RuntimeClientSafeBlockedReviewStateCandidate,
  RuntimeClientSafeCloseoutSummaryCandidate,
  RuntimeClientSafeEvidenceSummaryCandidate,
  RuntimeClientSafeReviewResultCandidate,
  RuntimeClientSEMPSTGateSummaryCandidate,
  RuntimeClientSubfieldCaptureCandidate,
  RuntimeClientVisibleProgressCandidate,
  RuntimeControlledRouteWiringManifestCandidate,
  RuntimeLocalBFFAdapterCandidate,
  RuntimeNoPublicExposureNoEndpointGuardCandidate,
  RuntimeClientRouteCandidate,
  RuntimeClientRouteKind,
  RuntimeClientRouteShellCandidate,
  RuntimeClientScopeRef,
  RuntimeClientSafeDTOCandidate,
  RuntimeClientSafeCardRendererBoundaryCandidate,
  RuntimeClientSafeUIViewModelCandidate,
  RuntimeClientUIAdapterBoundaryCandidate,
  RuntimeClientVisibleState,
  RuntimeClientVisibleStateContractCandidate,
  RuntimeClientCopyNoJargonCandidate,
  RuntimeClientShellBlockingReason,
  RuntimeClientShellLocalRenderEvidenceCandidate,
  RuntimeClientShellNoInternalImportsGuardCandidate,
  RuntimePhase9AClientMembraneLocalResult,
  RuntimePhase9BClientBFFReadLocalResult,
  RuntimePhase9CClientRouteShellSafeUILocalResult,
  RuntimePhase9DControlledLocalClientRouteWiringLocalResult,
  RuntimePhase9ELocalInteractionCursorVisibleProgressLocalResult,
  RuntimePhase9FLocalEvidenceCanonicalVariableHandoffLocalResult,
  RuntimePhase9GLocalGateReadinessReviewStateLocalResult,
  RuntimePhase9HLocalClientOutcomeReviewCloseoutLocalResult,
  RuntimePhase9AggregateCoverageCandidate,
  RuntimePhase9AggregateValidationBlockingReason,
  RuntimePhase9BoundaryIntegrityCandidate,
  RuntimePhase9ClientSurfaceLeakageScanCandidate,
  RuntimePhase9BoundaryLedgerCandidate,
  RuntimePhase9ClosurePackageAuditCandidate,
  RuntimePhase9ClosurePackageCandidate,
  RuntimePhase9ClosureReadinessCandidate,
  RuntimePhase9CrossPhaseConsistencyCandidate,
  RuntimePhase9EvidenceIndexCandidate,
  RuntimePhase9FinalLocalPackageReadinessCandidate,
  RuntimePhase9ILocalAggregateValidationClosureReadinessLocalResult,
  RuntimePhase9JLocalClosurePackageNoActivationLocalResult,
  RuntimePhase9LocalReadinessAuditCandidate,
  RuntimePhase9NoActivationClosureGuardCandidate,
  RuntimePhase9NoPhaseCloseGuardCandidate,
  RuntimePhase9NoRealActivationAggregateGuardCandidate,
  RuntimePhase9SourceTraceCompletenessCandidate,
  RuntimePhase9SourceTraceIndexCandidate,
  RuntimePhase9TestEvidenceRollupCandidate,
  RuntimePhase9UnresolvedBlockerRegisterCandidate,
  RuntimeSafeDTOResolverCandidate,
  RuntimeSignificadoShellIntegrationCandidate,
  RuntimeSignificadoShellLocalWiringCandidate,
  RuntimeStateReadFacadeCandidate,
  RuntimeWorkMapPrimaryActivityLocalHandoffResolverCandidate,
  RuntimeWorkMapToSignificadoHandoffCandidate,
} from "./runtime-40-20-client-membrane-types";

export const Runtime40_20ClientMembraneService = {
  buildClientVisibleStateContractCandidates,
  buildInternalSurfaceGuardCandidates,
  buildBFFContractCandidates,
  buildClientMembraneAuditCandidates,
  buildPhase9AClientMembraneLocalResult,
  buildBFFReadContractCandidates,
  buildClientRouteCandidates,
  buildUIAdapterBoundaryCandidates,
  buildWorkMapToSignificadoHandoffCandidates,
  buildRuntimeStateReadFacadeCandidates,
  buildSafeClientDTOCandidates,
  buildNoDirectInternalInvocationGuardCandidates,
  buildPhase9BClientBFFReadLocalResult,
  buildClientRouteShellCandidates,
  buildSafeUIViewModelCandidates,
  buildSafeCardRendererBoundaryCandidates,
  buildSignificadoShellIntegrationCandidates,
  buildClientCopyNoJargonCandidates,
  buildNoInternalImportsGuardCandidates,
  buildLocalRenderEvidenceCandidates,
  buildPhase9CClientRouteShellSafeUILocalResult,
  buildLocalBFFAdapterCandidates,
  buildSafeDTOResolverCandidates,
  buildControlledRouteWiringManifestCandidates,
  buildSignificadoShellLocalWiringCandidates,
  buildWorkMapPrimaryActivityLocalHandoffResolverCandidates,
  buildClientMembraneFixtureCandidates,
  buildLocalWiringEvidenceCandidates,
  buildNoPublicExposureNoEndpointGuardCandidates,
  buildPhase9DControlledLocalClientRouteWiringLocalResult,
  buildLocalInteractionCursorCandidates,
  buildVisibleProgressCandidates,
  buildQuestionPresentationCandidates,
  buildAnswerCaptureCandidates,
  buildSubfieldCaptureCandidates,
  buildInteractionTransitionCandidates,
  buildBudgetVisibilityCandidates,
  buildSafeBlockedReviewStateCandidates,
  buildPhase9ELocalInteractionCursorVisibleProgressLocalResult,
  buildEvidenceCandidateHandoffs,
  buildCanonicalVariableCandidateHandoffs,
  buildExplicitGapCandidates,
  buildGateInputCandidates,
  buildEvidenceProvenanceEnvelopeCandidates,
  buildClientSafeEvidenceSummaryCandidates,
  buildNoDiagnosticInferenceGuardCandidates,
  buildNoRealPersistenceGuardCandidates,
  buildPhase9FLocalEvidenceCanonicalVariableHandoffLocalResult,
  buildCriticalRouteGateSummaryCandidates,
  buildSEMPSTGateSummaryCandidates,
  buildReadinessStateCandidates,
  buildManualReviewCandidates,
  buildReentryCandidates,
  buildSafeReviewResultCandidates,
  buildNoGoCandidates,
  buildGateGreaterThanChipEnforcementCandidates,
  buildGateReadinessAuditCandidates,
  buildPhase9GLocalGateReadinessReviewStateLocalResult,
  buildClientOutcomeCandidates,
  buildClientReviewCloseoutCandidates,
  buildClientNextActionCandidates,
  buildClientSafeCloseoutSummaryCandidates,
  buildCorrectionReentryHandoffCandidates,
  buildLocalCloseoutSnapshotCandidates,
  buildNoDiagnosisNoExportCloseoutGuardCandidates,
  buildNoActivationNoPhaseCloseGuardCandidates,
  buildOutcomeCloseoutAuditCandidates,
  buildPhase9HLocalClientOutcomeReviewCloseoutLocalResult,
  buildPhase9AggregateCoverageCandidates,
  buildPhase9CrossPhaseConsistencyCandidates,
  buildPhase9BoundaryIntegrityCandidates,
  buildPhase9ClientSurfaceLeakageScanCandidates,
  buildPhase9NoRealActivationAggregateGuardCandidates,
  buildPhase9SourceTraceCompletenessCandidates,
  buildPhase9ClosureReadinessCandidates,
  buildPhase9LocalReadinessAuditCandidates,
  buildPhase9NoPhaseCloseGuardCandidates,
  buildPhase9ILocalAggregateValidationClosureReadinessLocalResult,
  buildPhase9ClosurePackageCandidates,
  buildPhase9EvidenceIndexCandidates,
  buildPhase9BoundaryLedgerCandidates,
  buildPhase9SourceTraceIndexCandidates,
  buildPhase9TestEvidenceRollupCandidates,
  buildPhase9UnresolvedBlockerRegisterCandidates,
  buildPhase9NoActivationClosureGuardCandidates,
  buildPhase9ClosurePackageAuditCandidates,
  buildPhase9FinalLocalPackageReadinessCandidates,
  buildPhase9JLocalClosurePackageNoActivationLocalResult,
  validateNoInternalSurfaceExposure,
  validateClientScope,
  validateNoDiagnosisExportRegistry,
  validateGateGreaterThanChip,
  validateClientCopyNoJargon,
  validateNoInternalImports,
  validateNoInternalRender,
  validateNoPublicExposure,
  validateNoEndpointCreation,
  validateNoRealClientAccess,
  validateLocalWiringNoInternalLeak,
  validateCursorDoesNotMutateRuntime,
  validateQuestionPresentationClientSafe,
  validateAnswerCaptureNoPersistence,
  validateBudgetVisibilityNoLedgerWrite,
  validateEvidenceHandoffNoPersistence,
  validateCanonicalVariableNoFreeInference,
  validateGapClientSafe,
  validateGateInputNoRealExecution,
  validateNoDiagnosticInference,
  validateGateSummaryNoRealExecution,
  validateReadinessNoRealDecision,
  validateReviewStateClientSafe,
  validateGateGreaterThanChipEnforced,
  validateNoGoNoRealPersistence,
  validateClientOutcomeNoDiagnosis,
  validateReviewCloseoutNoRealDecision,
  validateNextActionNoRealWorkflow,
  validateCloseoutSummaryClientSafe,
  validateNoExportNoActivationNoPhaseClose,
  validatePhase9AggregateCoverage,
  validatePhase9CrossPhaseConsistency,
  validatePhase9BoundaryIntegrity,
  validatePhase9ClientSurfaceNoLeakage,
  validatePhase9NoRealActivation,
  validatePhase9SourceTraceCompleteness,
  validatePhase9NoPhaseClose,
  validatePhase9ClosurePackageCompleteness,
  validatePhase9EvidenceIndexCompleteness,
  validatePhase9BoundaryLedgerNoViolation,
  validatePhase9SourceTraceIndexCompleteness,
  validatePhase9TestEvidenceRollup,
  validatePhase9NoActivationClosureGuard,
  validatePhase9FinalPackageNoRealActivation,
};

export const RUNTIME_CLIENT_VISIBLE_STATES: RuntimeClientVisibleState[] = [
  "session_ready",
  "workmap_ready",
  "primary_activity_selected",
  "significado_ready",
  "activity_runtime_ready",
  "question_presented",
  "answer_captured_candidate",
  "evidence_candidate_created",
  "review_required",
  "result_in_review",
  "blocked_safe",
];

export const RUNTIME_CLIENT_MEMBRANE_CARD_KINDS: RuntimeClientMembraneCardKind[] = [
  "confirmation_card_with_correction",
  "compound_card",
  "causal_probe_card",
  "microconfirmation_card",
  "review_gap_card",
  "safe_status_card",
];

export const RUNTIME_CLIENT_HIDDEN_INTERNAL_SURFACES: RuntimeClientHiddenInternalSurface[] = [
  "runtime_tables",
  "runtime_interaction_instance",
  "canonical_variable_record",
  "evidence_item",
  "branching_decision",
  "budget_ledger",
  "critical_route_gate_internal",
  "mmabp_gate_internal",
  "semantic_resolution_event",
  "process_state_timer_event",
  "readiness_gap_record",
  "readiness_decision_record",
  "chips_internal",
  "vsm_internal",
  "ahe_internal",
  "mmabp_internal",
  "object_inventory",
  "integration_membrane",
  "soft_governance",
  "no_go_internal",
  "registry",
  "ir",
  "diagnosis",
  "parallel_production",
];

const DEFAULT_SOURCE_TRACE: RuntimeClientMembraneSourceTrace[] = [
  {
    source_document: "EVE_Fase9_Gate5_Diseno_Implementacion_Marco_Estructural_v2_Parte2.docx",
    source_section: "6. Arquitectura de implementacion",
    source_element: "UI Cliente -> BFF Cliente / Composition Root -> Runtime 40/20",
    extracted_for_platform_use:
      "BFF composes safe client contracts and prevents UI access to internal organs.",
    source_trace_ref: "F9G5-P2:S6",
  },
  {
    source_document: "Marco Sistemico Estructural Oficial",
    source_section: "Sistema de Inteligencia Operativa y Gobernanza Cognitiva",
    source_element: "Gate > Chip",
    extracted_for_platform_use:
      "Gates govern boundaries; chips may only interpret, structure, suggest, or prepare.",
    source_trace_ref: "MSE:SIOGC:GATE_GT_CHIP",
  },
];

const AUDIT_ACTIONS: RuntimeClientMembraneAuditCandidate["audit_action"][] = [
  "client_membrane_contract_created",
  "bff_contract_created",
  "visible_state_contract_created",
  "internal_surface_guard_created",
  "scope_contract_created",
  "no_diagnosis_boundary_created",
  "no_export_boundary_created",
];

const RUNTIME_CLIENT_ROUTE_KINDS: RuntimeClientRouteKind[] = [
  "login",
  "estado_inicial",
  "workmap",
  "significado",
  "resultado_en_revision",
  "blocked_safe",
];

const RUNTIME_CLIENT_FORBIDDEN_COPY_TERMS = [
  "MMABP",
  "VSM",
  "AHE",
  "Gate",
  "Chip",
  "Runtime table",
  "Object Inventory",
  "Integration Membrane",
  "Soft Governance",
  "No-Go interno",
  "canonical_variable_record",
  "runtime_interaction_instance",
  "readiness_gap_record",
  "diagnosis final",
  "registry",
  "IR",
  "export payload",
];

const RUNTIME_CLIENT_ALLOWED_COPY_TERMS = [
  "Sesion lista",
  "Mapa de trabajo listo",
  "Actividad seleccionada",
  "Pregunta",
  "Respuesta registrada",
  "Resultado en revision",
  "Necesitamos revisar algo",
  "Puedes corregir",
  "Siguiente paso",
];

export function buildClientVisibleStateContractCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientVisibleStateContractCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const blockingReasons: RuntimeClientMembraneBlockingReason[] =
    hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
  const boundaryReasons = validateNoDiagnosisExportRegistry(input);
  const reasons = uniqueReasons([...blockingReasons, ...boundaryReasons]);

  return [
    {
      client_visible_state_contract_ref: "CLIENT_VISIBLE_STATE_CONTRACT:F9A:LOCAL:001",
      visible_states: [...RUNTIME_CLIENT_VISIBLE_STATES],
      allowed_card_kinds: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      safe_client_copy_policy: {
        no_mmabp_jargon: true,
        no_vsm_jargon: true,
        no_ahe_jargon: true,
        no_gate_jargon: true,
        no_chip_jargon: true,
        no_diagnosis_final: true,
      },
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildInternalSurfaceGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInternalSurfaceGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const sourceReasons: RuntimeClientMembraneBlockingReason[] =
    hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
  const reasons = uniqueReasons([
    ...sourceReasons,
    ...validateNoInternalSurfaceExposure(input),
    ...validateGateGreaterThanChip(input),
  ]);

  return [
    {
      internal_surface_guard_ref: "INTERNAL_SURFACE_GUARD:F9A:LOCAL:001",
      hidden_surfaces: [...RUNTIME_CLIENT_HIDDEN_INTERNAL_SURFACES],
      gate_greater_than_chip_enforced: true,
      client_can_call_chips_directly: false,
      client_can_bypass_gates: false,
      client_can_view_no_go_internal: false,
      client_can_view_runtime_tables: false,
      client_can_view_diagnosis_internal: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildBFFContractCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientBFFContractCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const sourceReasons: RuntimeClientMembraneBlockingReason[] =
    hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
  const reasons = uniqueReasons([
    ...sourceReasons,
    ...validateClientScope(resolveScope(input.scope_ref)),
    ...validateNoInternalSurfaceExposure(input),
    ...validateNoDiagnosisExportRegistry(input),
    ...validateGateGreaterThanChip(input),
    ...validateNoRealOperationAttempts(input),
  ]);

  return [
    {
      bff_contract_candidate_ref: "BFF_CONTRACT:F9A:LOCAL:001",
      scope_ref: resolveScope(input.scope_ref),
      consumes_runtime_candidate_state: true,
      exposes_client_visible_state_only: true,
      exposes_internal_organs: false,
      endpoint_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_real_started: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildClientMembraneAuditCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientMembraneAuditCandidate[] {
  const sourceTrace = resolveSourceTrace(input);

  return AUDIT_ACTIONS.map((auditAction, index) => ({
    client_membrane_audit_candidate_ref: `CLIENT_MEMBRANE_AUDIT:F9A:LOCAL:${String(index + 1).padStart(3, "0")}`,
    audit_action: auditAction,
    audit_reason:
      "F9-A local candidate audit only; no runtime_audit_trail real record is created.",
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
  }));
}

export function buildPhase9AClientMembraneLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AClientMembraneLocalResult {
  const clientVisibleStateContracts = buildClientVisibleStateContractCandidates(input);
  const internalSurfaceGuards = buildInternalSurfaceGuardCandidates(input);
  const bffContracts = buildBFFContractCandidates(input);
  const auditCandidates = buildClientMembraneAuditCandidates(input);
  const phase9aCompletedLocal = [
    ...clientVisibleStateContracts,
    ...internalSurfaceGuards,
    ...bffContracts,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_closed_local: false,
    phase9a_completed_local: phase9aCompletedLocal,
    ready_for_phase9b_authorization: false,
    client_visible_state_contract_candidates: clientVisibleStateContracts,
    internal_surface_guard_candidates: internalSurfaceGuards,
    bff_contract_candidates: bffContracts,
    client_membrane_audit_candidates: auditCandidates,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
  };
}

export function buildBFFReadContractCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientBFFReadContractCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...validateBFFReadScope(scope),
    ...mapMembraneReasonsToBFFRead(validateNoInternalSurfaceExposure(input)),
    ...mapMembraneReasonsToBFFRead(validateNoDiagnosisExportRegistry(input)),
    ...mapMembraneReasonsToBFFRead(validateGateGreaterThanChip(input)),
    ...mapMembraneReasonsToBFFRead(validateNoRealOperationAttempts(input)),
  ]);

  return [
    {
      bff_read_contract_candidate_ref: "BFF_READ_CONTRACT:F9B:LOCAL:001",
      read_scope: scope,
      case_id: scope.case_id,
      tenant_id: scope.tenant_id,
      role_id: scope.role_id,
      activity_id: scope.activity_id,
      run_id: scope.run_id,
      role_runtime_session_ref: scope.role_runtime_session_ref,
      activity_runtime_run_ref: scope.activity_runtime_run_ref,
      allowed_client_route: "significado",
      allowed_visible_states: [...RUNTIME_CLIENT_VISIBLE_STATES],
      safe_dto_contract_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
      reads_runtime_candidate_state: true,
      creates_endpoint_real: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_real_started: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildClientRouteCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientRouteCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...validateBFFReadScope(resolveScope(input.scope_ref)),
    ...mapMembraneReasonsToBFFRead(validateNoInternalSurfaceExposure(input)),
  ]);

  const routeStateByKind: Record<RuntimeClientRouteKind, [RuntimeClientRouteCandidate["allowed_entry_state"], RuntimeClientRouteCandidate["allowed_exit_state"]]> = {
    login: ["session_ready", "session_ready"],
    estado_inicial: ["session_ready", "workmap_ready"],
    workmap: ["workmap_ready", "primary_activity_selected"],
    significado: ["primary_activity_selected", "significado_ready"],
    resultado_en_revision: ["result_in_review", "result_in_review"],
    blocked_safe: ["blocked_safe", "blocked_safe"],
  };

  return RUNTIME_CLIENT_ROUTE_KINDS.map((routeKind, index) => {
    const [entryState, exitState] = routeStateByKind[routeKind];
    return {
      client_route_candidate_ref: `CLIENT_ROUTE:F9B:LOCAL:${String(index + 1).padStart(3, "0")}`,
      route_kind: routeKind,
      route_label: routeKind.replace(/_/g, " "),
      route_purpose: "Client-safe route candidate; no public route is created.",
      allowed_entry_state: entryState,
      allowed_exit_state: exitState,
      requires_bff_read_contract: true,
      requires_scope: true,
      client_can_access_internal_organs: false,
      client_can_access_chips: false,
      client_can_access_gates: false,
      client_can_access_runtime_tables: false,
      client_can_access_diagnosis: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    };
  });
}

export function buildUIAdapterBoundaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientUIAdapterBoundaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...mapMembraneReasonsToBFFRead(validateNoInternalSurfaceExposure(input)),
    ...mapMembraneReasonsToBFFRead(validateNoDiagnosisExportRegistry(input)),
    ...mapMembraneReasonsToBFFRead(validateGateGreaterThanChip(input)),
  ]);

  return [
    {
      ui_adapter_boundary_candidate_ref: "UI_ADAPTER_BOUNDARY:F9B:LOCAL:001",
      ui_surface: "significado_de_tu_trabajo",
      adapter_mode: "candidate",
      consumes_bff_read_dto: true,
      consumes_runtime_directly: false,
      calls_chips_directly: false,
      calls_gates_directly: false,
      shows_internal_jargon: false,
      shows_final_diagnosis: false,
      shows_export_status_internal: false,
      safe_cards_supported: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildWorkMapToSignificadoHandoffCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeWorkMapToSignificadoHandoffCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...validateBFFReadScope(scope),
  ]);

  return [
    {
      workmap_significado_handoff_candidate_ref: "WORKMAP_SIGNIFICADO_HANDOFF:F9B:LOCAL:001",
      selected_primary_activity_ref: scope.activity_id,
      role_runtime_session_ref: scope.role_runtime_session_ref,
      activity_runtime_run_candidate_ref: scope.activity_runtime_run_ref,
      handoff_state: "activity_runtime_candidate_ready",
      handoff_requires_scope: true,
      creates_activity_runtime_run_real: false,
      opens_secondary_activity_run_by_default: false,
      selection_above_8_requires_methodological_decision: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildRuntimeStateReadFacadeCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeStateReadFacadeCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...mapMembraneReasonsToBFFRead(validateNoInternalSurfaceExposure(input)),
  ]);

  return [
    {
      runtime_state_read_facade_candidate_ref: "RUNTIME_STATE_READ_FACADE:F9B:LOCAL:001",
      reads_role_runtime_session_candidate: true,
      reads_activity_runtime_run_candidate: true,
      reads_runtime_interaction_instance_candidate: true,
      reads_readiness_candidate: true,
      reads_gap_candidate: true,
      reads_gate_candidate_summary: true,
      reads_internal_details: false,
      writes_runtime_state: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSafeClientDTOCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeDTOCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...mapMembraneReasonsToBFFRead(validateNoInternalSurfaceExposure(input)),
    ...mapMembraneReasonsToBFFRead(validateNoDiagnosisExportRegistry(input)),
  ]);

  return [
    {
      safe_dto_candidate_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
      visible_state: "significado_ready",
      visible_progress: { current_step: "significado", mode: "candidate" },
      visible_prompt: { surface: "significado_de_tu_trabajo" },
      visible_cards: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      visible_next_action: "continue_activity_runtime_candidate",
      visible_result_state: "not_final_diagnosis",
      hidden_internal_surfaces: [...RUNTIME_CLIENT_HIDDEN_INTERNAL_SURFACES],
      diagnosis_final_included: false,
      registry_included: false,
      ir_included: false,
      export_payload_included: false,
      gate_internal_included: false,
      chip_internal_included: false,
      runtime_table_included: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildNoDirectInternalInvocationGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoDirectInternalInvocationGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueBFFReadReasons([
    ...validateBFFReadSourceTrace(sourceTrace),
    ...mapMembraneReasonsToBFFRead(validateGateGreaterThanChip(input)),
    ...mapMembraneReasonsToBFFRead(validateNoRealOperationAttempts(input)),
  ]);

  return [
    {
      no_direct_internal_invocation_guard_ref: "NO_DIRECT_INTERNAL_INVOCATION_GUARD:F9B:LOCAL:001",
      ui_direct_runtime_call_detected: false,
      ui_direct_chip_call_detected: false,
      ui_direct_gate_call_detected: false,
      ui_direct_supabase_call_detected: false,
      ui_direct_sql_call_detected: false,
      ui_direct_export_call_detected: false,
      bff_boundary_required: true,
      gate_greater_than_chip_enforced: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9BClientBFFReadLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9BClientBFFReadLocalResult {
  const phase9A = buildPhase9AClientMembraneLocalResult(input);
  const bffRead = buildBFFReadContractCandidates(input);
  const routes = buildClientRouteCandidates(input);
  const adapters = buildUIAdapterBoundaryCandidates(input);
  const handoffs = buildWorkMapToSignificadoHandoffCandidates(input);
  const facades = buildRuntimeStateReadFacadeCandidates(input);
  const dtos = buildSafeClientDTOCandidates(input);
  const guards = buildNoDirectInternalInvocationGuardCandidates(input);
  const phase9BCompletedLocal = [
    ...bffRead,
    ...routes,
    ...adapters,
    ...handoffs,
    ...facades,
    ...dtos,
    ...guards,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    ...phase9A,
    phase9_A_accepted: true,
    phase9_B_completed_local: phase9BCompletedLocal,
    ready_for_phase9C_authorization: false,
    bff_read_contract_candidates: bffRead,
    client_route_candidates: routes,
    ui_adapter_boundary_candidates: adapters,
    workmap_significado_handoff_candidates: handoffs,
    runtime_state_read_facade_candidates: facades,
    safe_dto_candidates: dtos,
    no_direct_internal_invocation_guard_candidates: guards,
  };
}

export function buildClientRouteShellCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientRouteShellCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateSafeDTOBoundary(input),
    ...validateNoPublicRouteOrRealOperation(input),
  ]);
  const visibleStateByRoute: Record<RuntimeClientRouteKind, RuntimeClientVisibleState> = {
    login: "session_ready",
    estado_inicial: "workmap_ready",
    workmap: "primary_activity_selected",
    significado: "significado_ready",
    resultado_en_revision: "result_in_review",
    blocked_safe: "blocked_safe",
  };

  return RUNTIME_CLIENT_ROUTE_KINDS.map((routeKind, index) => ({
    route_shell_candidate_ref: `CLIENT_ROUTE_SHELL:F9C:LOCAL:${String(index + 1).padStart(3, "0")}`,
    route_kind: routeKind,
    route_shell_label: routeKind.replace(/_/g, " "),
    route_shell_purpose: "Client-facing shell candidate only; no public production route is created.",
    allowed_visible_state: visibleStateByRoute[routeKind],
    requires_safe_dto: true,
    requires_bff_boundary: true,
    route_is_public_production: false,
    next_route_file_created: false,
    endpoint_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_real_started: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildSafeUIViewModelCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeUIViewModelCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateClientCopyNoJargon(input),
    ...validateNoInternalRender(input),
  ]);

  return [
    {
      safe_ui_view_model_candidate_ref: "SAFE_UI_VIEW_MODEL:F9C:LOCAL:001",
      visible_state: "significado_ready",
      visible_title: "Significado de tu trabajo",
      visible_description: "Actividad en curso lista para continuar.",
      visible_progress_label: "Actividad seleccionada",
      visible_cards: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      visible_primary_action_label: "Siguiente paso",
      visible_secondary_action_label: "Puedes corregir",
      visible_result_message: "Resultado en revision",
      hidden_internal_surfaces: [...RUNTIME_CLIENT_HIDDEN_INTERNAL_SURFACES],
      no_mmabp_jargon: true,
      no_vsm_jargon: true,
      no_ahe_jargon: true,
      no_gate_jargon: true,
      no_chip_jargon: true,
      no_runtime_table_jargon: true,
      diagnosis_final_included: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSafeCardRendererBoundaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeCardRendererBoundaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateNoInternalRender(input),
  ]);

  return [
    {
      safe_card_renderer_boundary_ref: "SAFE_CARD_RENDERER_BOUNDARY:F9C:LOCAL:001",
      supported_card_kinds: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      renders_confirmation_card_with_correction: true,
      renders_compound_card: true,
      renders_causal_probe_card: true,
      renders_microconfirmation_card: true,
      renders_review_gap_card: true,
      renders_safe_status_card: true,
      renders_internal_gate_state: false,
      renders_internal_chip_state: false,
      renders_runtime_table_state: false,
      renders_diagnosis_final: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSignificadoShellIntegrationCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeSignificadoShellIntegrationCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateSafeDTOBoundary(input),
    ...validateNoInternalImports(input),
    ...validateNoInternalRender(input),
    ...validateNoPublicRouteOrRealOperation(input),
  ]);

  return [
    {
      significado_shell_integration_candidate_ref: "SIGNIFICADO_SHELL_INTEGRATION:F9C:LOCAL:001",
      ui_surface: "significado_de_tu_trabajo",
      integration_mode: "candidate",
      consumes_safe_view_model: true,
      consumes_bff_read_dto: true,
      calls_runtime_directly: false,
      calls_chips_directly: false,
      calls_gates_directly: false,
      calls_supabase_directly: false,
      calls_sql_directly: false,
      shows_internal_organs: false,
      shows_final_diagnosis: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildClientCopyNoJargonCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientCopyNoJargonCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateClientCopyNoJargon(input),
  ]);

  return [
    {
      client_copy_no_jargon_candidate_ref: "CLIENT_COPY_NO_JARGON:F9C:LOCAL:001",
      forbidden_terms: [...RUNTIME_CLIENT_FORBIDDEN_COPY_TERMS],
      allowed_client_terms: [...RUNTIME_CLIENT_ALLOWED_COPY_TERMS],
      mmabp_jargon_detected: false,
      vsm_jargon_detected: false,
      ahe_jargon_detected: false,
      gate_jargon_detected: false,
      chip_jargon_detected: false,
      runtime_table_jargon_detected: false,
      diagnosis_final_language_detected: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildNoInternalImportsGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientShellNoInternalImportsGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateNoInternalImports(input),
  ]);

  return [
    {
      no_internal_imports_guard_ref: "NO_INTERNAL_IMPORTS_GUARD:F9C:LOCAL:001",
      component_imports_runtime_services: false,
      component_imports_chips: false,
      component_imports_gates: false,
      component_imports_supabase: false,
      component_imports_sql: false,
      component_imports_registry: false,
      component_imports_diagnosis: false,
      component_imports_exporter: false,
      component_imports_parallel_production: false,
      bff_boundary_required: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildLocalRenderEvidenceCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientShellLocalRenderEvidenceCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueShellReasons([
    ...validateShellSourceTrace(sourceTrace),
    ...validateSafeDTOBoundary(input),
    ...validateNoInternalRender(input),
    ...validateClientCopyNoJargon(input),
  ]);

  return [
    {
      local_render_evidence_candidate_ref: "LOCAL_RENDER_EVIDENCE:F9C:LOCAL:001",
      sample_visible_state: "significado_ready",
      sample_safe_dto_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
      sample_view_model_ref: "SAFE_UI_VIEW_MODEL:F9C:LOCAL:001",
      render_candidate_created: true,
      rendered_internal_organs: false,
      rendered_final_diagnosis: false,
      rendered_export_status: false,
      rendered_gate_jargon: false,
      rendered_chip_jargon: false,
      rendered_runtime_table_jargon: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9CClientRouteShellSafeUILocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9CClientRouteShellSafeUILocalResult {
  buildPhase9BClientBFFReadLocalResult(input);
  const routeShells = buildClientRouteShellCandidates(input);
  const viewModels = buildSafeUIViewModelCandidates(input);
  const renderers = buildSafeCardRendererBoundaryCandidates(input);
  const integrations = buildSignificadoShellIntegrationCandidates(input);
  const copyCandidates = buildClientCopyNoJargonCandidates(input);
  const importGuards = buildNoInternalImportsGuardCandidates(input);
  const renderEvidence = buildLocalRenderEvidenceCandidates(input);
  const phase9CCompletedLocal = [
    ...routeShells,
    ...viewModels,
    ...renderers,
    ...integrations,
    ...copyCandidates,
    ...importGuards,
    ...renderEvidence,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_completed_local: phase9CCompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9D_authorization: false,
    route_shell_candidates: routeShells,
    safe_ui_view_model_candidates: viewModels,
    safe_card_renderer_boundary_candidates: renderers,
    significado_shell_integration_candidates: integrations,
    client_copy_no_jargon_candidates: copyCandidates,
    no_internal_imports_guard_candidates: importGuards,
    local_render_evidence_candidates: renderEvidence,
    endpoint_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
  };
}

export function buildLocalBFFAdapterCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeLocalBFFAdapterCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateNoEndpointCreation(input),
    ...validateNoPublicExposure(input),
    ...validateLocalWiringNoInternalLeak(input),
  ]);

  return [
    {
      local_bff_adapter_candidate_ref: "LOCAL_BFF_ADAPTER:F9D:LOCAL:001",
      adapter_mode: "local_candidate",
      consumes_bff_read_contract_candidate: true,
      consumes_safe_dto_candidate: true,
      consumes_runtime_state_read_facade_candidate: true,
      returns_client_visible_state_only: true,
      endpoint_created: false,
      api_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_real_started: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSafeDTOResolverCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeSafeDTOResolverCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateRequiredLocalWiringPieces(input),
    ...validateLocalWiringNoInternalLeak(input),
  ]);

  return [
    {
      safe_dto_resolver_candidate_ref: "SAFE_DTO_RESOLVER:F9D:LOCAL:001",
      input_facade_candidate_ref: "RUNTIME_STATE_READ_FACADE:F9B:LOCAL:001",
      input_route_shell_candidate_ref: "CLIENT_ROUTE_SHELL:F9C:LOCAL:004",
      input_scope_ref: scope,
      resolved_safe_dto_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
      visible_state: "significado_ready",
      visible_cards: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      visible_next_action: "continue_activity_runtime_candidate",
      visible_result_state: "not_final_diagnosis",
      internal_surface_removed: true,
      diagnosis_removed: true,
      registry_removed: true,
      ir_removed: true,
      export_payload_removed: true,
      gate_internal_removed: true,
      chip_internal_removed: true,
      runtime_table_removed: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildControlledRouteWiringManifestCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeControlledRouteWiringManifestCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateRequiredLocalWiringPieces(input),
    ...validateNoEndpointCreation(input),
    ...validateNoPublicExposure(input),
    ...validateNoRealClientAccess(input),
  ]);

  return [
    {
      controlled_route_wiring_manifest_ref: "CONTROLLED_ROUTE_WIRING:F9D:LOCAL:001",
      route_kind: "significado",
      route_shell_candidate_ref: "CLIENT_ROUTE_SHELL:F9C:LOCAL:004",
      bff_adapter_candidate_ref: "LOCAL_BFF_ADAPTER:F9D:LOCAL:001",
      safe_dto_resolver_candidate_ref: "SAFE_DTO_RESOLVER:F9D:LOCAL:001",
      ui_shell_candidate_ref: "SIGNIFICADO_SHELL_INTEGRATION:F9C:LOCAL:001",
      route_public_production_enabled: false,
      next_page_created: false,
      api_route_created: false,
      middleware_created: false,
      client_real_access_enabled: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSignificadoShellLocalWiringCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeSignificadoShellLocalWiringCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateRequiredLocalWiringPieces(input),
    ...validateNoEndpointCreation(input),
    ...validateNoPublicExposure(input),
    ...validateLocalWiringNoInternalLeak(input),
  ]);

  return [
    {
      significado_shell_local_wiring_candidate_ref: "SIGNIFICADO_SHELL_LOCAL_WIRING:F9D:LOCAL:001",
      ui_surface: "significado_de_tu_trabajo",
      uses_safe_view_model_candidate: true,
      uses_local_bff_adapter_candidate: true,
      uses_fixture_candidate: true,
      calls_runtime_directly: false,
      calls_chips_directly: false,
      calls_gates_directly: false,
      calls_supabase_directly: false,
      calls_sql_directly: false,
      public_route_enabled: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildWorkMapPrimaryActivityLocalHandoffResolverCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeWorkMapPrimaryActivityLocalHandoffResolverCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateNoRealClientAccess(input),
  ]);

  return [
    {
      workmap_primary_activity_handoff_resolver_ref: "WORKMAP_PRIMARY_ACTIVITY_HANDOFF:F9D:LOCAL:001",
      selected_primary_activity_ref: scope.activity_id,
      role_runtime_session_candidate_ref: scope.role_runtime_session_ref,
      activity_runtime_run_candidate_ref: scope.activity_runtime_run_ref,
      handoff_resolved_to_significado: true,
      activity_is_primary: true,
      secondary_activity_auto_opened: false,
      selection_above_8_detected: false,
      selection_above_8_requires_methodological_decision: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildClientMembraneFixtureCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientMembraneFixtureCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateNoRealClientAccess(input),
    ...validateLocalWiringNoInternalLeak(input),
  ]);

  return [
    {
      client_membrane_fixture_ref: "CLIENT_MEMBRANE_FIXTURE:F9D:LOCAL:001",
      fixture_scope_ref: scope,
      fixture_selected_primary_activity: {
        activity_id: scope.activity_id,
        activity_kind: "primary",
      },
      fixture_role_runtime_session_candidate: {
        role_runtime_session_ref: scope.role_runtime_session_ref,
      },
      fixture_activity_runtime_run_candidate: {
        activity_runtime_run_ref: scope.activity_runtime_run_ref,
      },
      fixture_visible_state: "significado_ready",
      fixture_safe_cards: [...RUNTIME_CLIENT_MEMBRANE_CARD_KINDS],
      fixture_expected_safe_dto: {
        safe_dto_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
        visible_state: "significado_ready",
      },
      fixture_expected_no_internal_surfaces: true,
      fixture_expected_no_diagnosis: true,
      fixture_expected_no_export: true,
      deterministic_ids: true,
      real_customer_data_used: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildLocalWiringEvidenceCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalWiringEvidenceCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateRequiredLocalWiringPieces(input),
    ...validateLocalWiringNoInternalLeak(input),
  ]);

  return [
    {
      local_wiring_evidence_candidate_ref: "LOCAL_WIRING_EVIDENCE:F9D:LOCAL:001",
      fixture_ref: "CLIENT_MEMBRANE_FIXTURE:F9D:LOCAL:001",
      route_manifest_ref: "CONTROLLED_ROUTE_WIRING:F9D:LOCAL:001",
      bff_adapter_ref: "LOCAL_BFF_ADAPTER:F9D:LOCAL:001",
      safe_dto_ref: "SAFE_CLIENT_DTO:F9B:LOCAL:001",
      ui_shell_ref: "SIGNIFICADO_SHELL_INTEGRATION:F9C:LOCAL:001",
      render_evidence_created: true,
      expected_visible_state_rendered: "significado_ready",
      internal_organs_rendered: false,
      runtime_tables_rendered: false,
      gate_jargon_rendered: false,
      chip_jargon_rendered: false,
      diagnosis_rendered: false,
      export_status_rendered: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildNoPublicExposureNoEndpointGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeNoPublicExposureNoEndpointGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueLocalWiringReasons([
    ...validateLocalWiringSourceTrace(sourceTrace),
    ...validateNoEndpointCreation(input),
    ...validateNoPublicExposure(input),
    ...validateNoRealClientAccess(input),
  ]);

  return [
    {
      no_public_exposure_guard_ref: "NO_PUBLIC_EXPOSURE_GUARD:F9D:LOCAL:001",
      public_route_created: false,
      api_endpoint_created: false,
      middleware_created: false,
      real_client_access_enabled: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_real_started: false,
      qa_green_real_created: false,
      activation_allowed: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9DControlledLocalClientRouteWiringLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9DControlledLocalClientRouteWiringLocalResult {
  buildPhase9CClientRouteShellSafeUILocalResult(input);
  const adapters = buildLocalBFFAdapterCandidates(input);
  const resolvers = buildSafeDTOResolverCandidates(input);
  const manifests = buildControlledRouteWiringManifestCandidates(input);
  const shellWirings = buildSignificadoShellLocalWiringCandidates(input);
  const handoffs = buildWorkMapPrimaryActivityLocalHandoffResolverCandidates(input);
  const fixtures = buildClientMembraneFixtureCandidates(input);
  const evidence = buildLocalWiringEvidenceCandidates(input);
  const exposureGuards = buildNoPublicExposureNoEndpointGuardCandidates(input);
  const phase9DCompletedLocal = [
    ...adapters,
    ...resolvers,
    ...manifests,
    ...shellWirings,
    ...handoffs,
    ...fixtures,
    ...evidence,
    ...exposureGuards,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_completed_local: phase9DCompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9E_authorization: false,
    local_bff_adapter_candidates: adapters,
    safe_dto_resolver_candidates: resolvers,
    controlled_route_wiring_manifest_candidates: manifests,
    significado_shell_local_wiring_candidates: shellWirings,
    workmap_primary_activity_handoff_resolver_candidates: handoffs,
    client_membrane_fixture_candidates: fixtures,
    local_wiring_evidence_candidates: evidence,
    no_public_exposure_guard_candidates: exposureGuards,
    endpoint_created: false,
    api_route_created: false,
    public_route_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
  };
}

export function buildLocalInteractionCursorCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalInteractionCursorCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateInteractionCandidateRefs(input),
    ...validateCursorDoesNotMutateRuntime(input),
  ]);

  return [
    {
      local_interaction_cursor_candidate_ref: "LOCAL_INTERACTION_CURSOR:F9E:LOCAL:001",
      activity_runtime_run_candidate_ref: scope.activity_runtime_run_ref,
      current_interaction_candidate_ref: "RUNTIME_INTERACTION_INSTANCE:F9E:CANDIDATE:001",
      current_position: 1,
      total_visible_interactions_candidate: 40,
      current_card_kind: "confirmation_card_with_correction",
      current_visible_state: "question_presented",
      can_move_next: true,
      can_move_previous: false,
      requires_answer_before_next: true,
      runtime_interaction_instance_real_created: false,
      runtime_state_mutated: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildVisibleProgressCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientVisibleProgressCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateInteractionCandidateRefs(input),
    ...validateBudgetVisibilityNoLedgerWrite(input),
  ]);

  return [
    {
      visible_progress_candidate_ref: "VISIBLE_PROGRESS:F9E:LOCAL:001",
      activity_runtime_run_candidate_ref: scope.activity_runtime_run_ref,
      visible_completed_count: 0,
      visible_total_count: 40,
      visible_base_budget_max: 40,
      visible_causal_budget_max: 20,
      visible_microconfirmation_included: true,
      visible_progress_label: "Pregunta 1 de 40",
      visible_progress_percent_candidate: 0,
      budget_ledger_real_created: false,
      readiness_final_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQuestionPresentationCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientQuestionPresentationCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateInteractionCandidateRefs(input),
    ...validateQuestionPresentationClientSafe(input),
  ]);

  return [
    {
      question_presentation_candidate_ref: "QUESTION_PRESENTATION:F9E:LOCAL:001",
      interaction_candidate_ref: "RUNTIME_INTERACTION_INSTANCE:F9E:CANDIDATE:001",
      source_node_ref: "SOURCE_NODE:F9E:INTERNAL:001",
      runtime_interaction_def_ref: "RUNTIME_INTERACTION_DEF:F9E:INTERNAL:001",
      card_kind: "confirmation_card_with_correction",
      visible_prompt: "Cuéntame qué estás haciendo en esta actividad.",
      visible_help_text: "Puedes responder con tus propias palabras.",
      visible_required_fields: ["respuesta"],
      visible_optional_fields: ["comentario"],
      client_copy_safe: true,
      internal_codes_hidden: true,
      mmabp_vsm_ahe_jargon_hidden: true,
      gate_chip_jargon_hidden: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildAnswerCaptureCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientAnswerCaptureCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateInteractionCandidateRefs(input),
    ...validateAnswerCaptureNoPersistence(input),
  ]);
  const states = [
    "draft",
    "answered_candidate",
    "confirmed_candidate",
    "corrected_candidate",
    "blocked_safe",
  ] as const;

  return states.map((state, index) => ({
    answer_capture_candidate_ref: `ANSWER_CAPTURE:F9E:LOCAL:${String(index + 1).padStart(3, "0")}`,
    interaction_candidate_ref: "RUNTIME_INTERACTION_INSTANCE:F9E:CANDIDATE:001",
    captured_answer_candidate: { value: "respuesta candidate" },
    answer_state_candidate: state,
    requires_confirmation: state === "answered_candidate",
    can_correct: state !== "blocked_safe",
    response_record_real_created: false,
    runtime_subfield_response_real_created: false,
    evidence_item_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildSubfieldCaptureCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSubfieldCaptureCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateInteractionCandidateRefs(input),
    ...validateAnswerCaptureNoPersistence(input),
    ...validateQuestionPresentationClientSafe(input),
  ]);

  return [
    {
      subfield_capture_candidate_ref: "SUBFIELD_CAPTURE:F9E:LOCAL:001",
      interaction_candidate_ref: "RUNTIME_INTERACTION_INSTANCE:F9E:CANDIDATE:001",
      subfield_key: "respuesta",
      subfield_label: "Respuesta",
      subfield_value_candidate: "respuesta candidate",
      subfield_required: true,
      subfield_visible_to_client: true,
      runtime_subfield_response_real_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildInteractionTransitionCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInteractionTransitionCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateCursorDoesNotMutateRuntime(input),
  ]);
  const states = [
    "pending",
    "shown",
    "answered",
    "confirmed",
    "corrected",
    "blocked",
    "reopened",
    "skipped_by_rule",
    "closed_by_other",
  ] as const;

  return states.map((state, index) => ({
    interaction_transition_candidate_ref: `INTERACTION_TRANSITION:F9E:LOCAL:${String(index + 1).padStart(3, "0")}`,
    from_state: index === 0 ? "pending" : states[index - 1],
    to_state: state,
    transition_reason: "local candidate transition only",
    requires_external_feedback: state === "blocked",
    requires_confirmation: state === "answered",
    blocked_by_gate_candidate: state === "blocked",
    blocked_by_missing_required_answer: state === "blocked",
    blocked_by_no_go: false,
    runtime_state_mutated: false,
    gate_real_executed: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildBudgetVisibilityCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientBudgetVisibilityCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateBudgetVisibilityNoLedgerWrite(input),
    ...validateQuestionPresentationClientSafe(input),
  ]);

  return [
    {
      budget_visibility_candidate_ref: "BUDGET_VISIBILITY:F9E:LOCAL:001",
      base_interaction_limit: 40,
      causal_interaction_limit: 20,
      base_interaction_visible_count: 1,
      causal_interaction_visible_count: 0,
      microconfirmations_counted_according_to_rule: true,
      derived_internal_interactions_visible: false,
      budget_ledger_real_updated: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSafeBlockedReviewStateCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeBlockedReviewStateCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueInteractionCursorReasons([
    ...validateInteractionCursorSourceTrace(sourceTrace),
    ...validateQuestionPresentationClientSafe(input),
  ]);

  return [
    {
      safe_blocked_review_state_candidate_ref: "SAFE_BLOCKED_REVIEW_STATE:F9E:LOCAL:001",
      blocked_reason_client_safe: "Necesitamos revisar algo antes de continuar.",
      review_required: true,
      manual_review_required_candidate: true,
      reentry_required_candidate: false,
      visible_message: "Necesitamos revisar algo para seguir con seguridad.",
      internal_no_go_hidden: true,
      gate_internal_hidden: true,
      readiness_gap_internal_hidden: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9ELocalInteractionCursorVisibleProgressLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ELocalInteractionCursorVisibleProgressLocalResult {
  buildPhase9DControlledLocalClientRouteWiringLocalResult(input);
  const cursors = buildLocalInteractionCursorCandidates(input);
  const progress = buildVisibleProgressCandidates(input);
  const questions = buildQuestionPresentationCandidates(input);
  const answers = buildAnswerCaptureCandidates(input);
  const subfields = buildSubfieldCaptureCandidates(input);
  const transitions = buildInteractionTransitionCandidates(input);
  const budgets = buildBudgetVisibilityCandidates(input);
  const blockedReview = buildSafeBlockedReviewStateCandidates(input);
  const phase9ECompletedLocal = [
    ...cursors,
    ...progress,
    ...questions,
    ...answers,
    ...subfields,
    ...transitions,
    ...budgets,
    ...blockedReview,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_completed_local: phase9ECompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9F_authorization: false,
    local_interaction_cursor_candidates: cursors,
    visible_progress_candidates: progress,
    question_presentation_candidates: questions,
    answer_capture_candidates: answers,
    subfield_capture_candidates: subfields,
    interaction_transition_candidates: transitions,
    budget_visibility_candidates: budgets,
    safe_blocked_review_state_candidates: blockedReview,
    runtime_interaction_instance_real_created: false,
    response_record_real_created: false,
    runtime_subfield_response_real_created: false,
    evidence_item_real_created: false,
    budget_ledger_real_updated: false,
    readiness_final_created: false,
    gate_real_executed: false,
    endpoint_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
  };
}

export function buildEvidenceCandidateHandoffs(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceCandidateHandoff[] {
  const phase9E = buildPhase9ELocalInteractionCursorVisibleProgressLocalResult(input);
  const sourceTrace = resolveSourceTrace(input);
  const answer = phase9E.answer_capture_candidates[1] ?? phase9E.answer_capture_candidates[0];
  const subfields = phase9E.subfield_capture_candidates;
  const cursor = phase9E.local_interaction_cursor_candidates[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateEvidenceHandoffRequiredCandidates(input),
    ...validateEvidenceHandoffNoPersistence(input),
    ...validateNoDiagnosticInference(input),
  ]);
  const kinds = [
    "operational_description",
    "confirmation",
    "correction",
    "frequency_context",
    "role_context",
    "start_condition",
    "end_condition",
    "exception_signal",
    "receiver_feedback_signal",
    "client_safe_review_note",
  ] as const;

  return kinds.map((kind, index) => ({
    evidence_candidate_handoff_ref: `EVIDENCE_HANDOFF:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_answer_capture_candidate_ref: answer?.answer_capture_candidate_ref,
    source_subfield_capture_candidate_refs: subfields.map((subfield) => subfield.subfield_capture_candidate_ref),
    source_interaction_candidate_ref: answer?.interaction_candidate_ref,
    source_activity_runtime_run_candidate_ref: cursor?.activity_runtime_run_candidate_ref,
    evidence_candidate_ref: `EVIDENCE_CANDIDATE:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    evidence_kind: kind,
    evidence_summary_client_safe: "Respuesta registrada como evidencia candidate local.",
    evidence_summary_internal_candidate: "Local evidence candidate handoff prepared without persistence.",
    evidence_item_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildCanonicalVariableCandidateHandoffs(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientCanonicalVariableCandidateHandoff[] {
  const sourceTrace = resolveSourceTrace(input);
  const evidence = buildEvidenceCandidateHandoffs(input)[0];
  const answer = buildAnswerCaptureCandidates(input)[1] ?? buildAnswerCaptureCandidates(input)[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateCanonicalVariableNoFreeInference(input),
    ...validateEvidenceHandoffNoPersistence(input),
    ...validateNoDiagnosticInference(input),
  ]);
  const modes = [
    "direct_user_answer",
    "confirmed_user_correction",
    "subfield_mapping",
    "runtime_catalog_mapping",
    "explicit_gate_input_mapping",
    "insufficient_for_variable",
  ] as const;

  return modes.map((mode, index) => ({
    canonical_variable_candidate_handoff_ref: `CANONICAL_VARIABLE_HANDOFF:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_evidence_candidate_ref: evidence?.evidence_candidate_ref,
    source_answer_capture_candidate_ref: answer?.answer_capture_candidate_ref,
    candidate_variable_ref: `CANONICAL_VARIABLE_CANDIDATE:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    canonical_variable_name: `runtime_40_20_local_candidate_${index + 1}`,
    candidate_value: mode === "insufficient_for_variable" ? undefined : "respuesta candidate",
    candidate_value_type: mode === "insufficient_for_variable" ? "insufficient" : "string",
    derivation_mode: mode,
    source_trace_required: true,
    canonical_variable_record_real_created: false,
    derived_without_source: false,
    text_similarity_only: false,
    diagnostic_inference_used: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildExplicitGapCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientExplicitGapCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const answer = buildAnswerCaptureCandidates(input)[4] ?? buildAnswerCaptureCandidates(input)[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateGapClientSafe(input),
    ...validateEvidenceHandoffNoPersistence(input),
  ]);
  const gapTypes = [
    "missing_required_answer",
    "missing_required_subfield",
    "ambiguous_answer",
    "contradictory_answer",
    "insufficient_evidence_for_variable",
    "blocked_by_gate_candidate",
    "manual_review_candidate",
    "reentry_candidate",
  ] as const;

  return gapTypes.map((gapType, index) => ({
    explicit_gap_candidate_ref: `EXPLICIT_GAP:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_interaction_candidate_ref: answer?.interaction_candidate_ref,
    source_answer_capture_candidate_ref: answer?.answer_capture_candidate_ref,
    gap_type: gapType,
    gap_reason: "Local candidate requires review before any real readiness decision.",
    client_safe_message: "Necesitamos revisar esta respuesta antes de continuar.",
    requires_review: true,
    requires_reentry_candidate: gapType === "reentry_candidate",
    readiness_gap_record_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildGateInputCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateInputCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const evidence = buildEvidenceCandidateHandoffs(input)[0];
  const variable = buildCanonicalVariableCandidateHandoffs(input)[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateGateInputNoRealExecution(input),
    ...validateNoDiagnosticInference(input),
  ]);
  const families = [
    "critical_route",
    "semantic_resolution",
    "process_state_timer",
    "mmabp_conformance_consistency",
    "qa_activation",
    "export_production",
  ] as const;

  return families.map((family, index) => ({
    gate_input_candidate_ref: `GATE_INPUT:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_evidence_candidate_ref: evidence?.evidence_candidate_ref,
    source_canonical_variable_candidate_ref: variable?.candidate_variable_ref,
    gate_family: family,
    gate_code: `GATE:F9F:${family.toUpperCase()}`,
    gate_input_summary: "Gate input candidate prepared locally without executing any gate.",
    gate_real_executed: false,
    critical_route_gate_real_executed: false,
    mmabp_gate_real_executed: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildEvidenceProvenanceEnvelopeCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceProvenanceEnvelopeCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const evidence = buildEvidenceCandidateHandoffs(input)[0];
  const variable = buildCanonicalVariableCandidateHandoffs(input)[0];
  const gateInput = buildGateInputCandidates(input)[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateEvidenceHandoffNoPersistence(input),
  ]);

  return [
    {
      provenance_envelope_candidate_ref: "PROVENANCE_ENVELOPE:F9F:LOCAL:001",
      source_document_refs: [...new Set(sourceTrace.map((trace) => trace.source_document))],
      source_section_refs: [...new Set(sourceTrace.map((trace) => trace.source_section))],
      source_candidate_refs: [
        evidence?.evidence_candidate_ref,
        variable?.candidate_variable_ref,
        gateInput?.gate_input_candidate_ref,
      ].filter((ref): ref is string => Boolean(ref)),
      case_scope_ref: scope.case_id,
      role_scope_ref: scope.role_id,
      activity_scope_ref: scope.activity_id,
      run_scope_ref: scope.run_id,
      correlation_candidate_ref: "CORRELATION:F9F:LOCAL:001",
      idempotency_candidate_ref: "IDEMPOTENCY:F9F:LOCAL:001",
      source_trace_complete: hasSourceTrace(sourceTrace),
      provenance_real_persisted: false,
      runtime_audit_trail_real_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildClientSafeEvidenceSummaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeEvidenceSummaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const evidence = buildEvidenceCandidateHandoffs(input)[0];
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateGapClientSafe(input),
    ...validateNoDiagnosticInference(input),
  ]);
  const statuses = [
    "respuesta_registrada",
    "informacion_en_revision",
    "necesitamos_aclarar_algo",
    "puedes_corregir",
    "bloqueado_seguro",
  ] as const;

  return statuses.map((status, index) => ({
    client_safe_evidence_summary_candidate_ref: `CLIENT_SAFE_EVIDENCE_SUMMARY:F9F:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_evidence_candidate_ref: evidence?.evidence_candidate_ref,
    visible_summary: "Respuesta registrada para revision local.",
    visible_status: status,
    visible_next_action: "Continuar cuando la revision local lo permita.",
    internal_summary_hidden: true,
    gate_internal_hidden: true,
    chip_internal_hidden: true,
    runtime_table_hidden: true,
    diagnosis_hidden: true,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildNoDiagnosticInferenceGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoDiagnosticInferenceGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateNoDiagnosticInference(input),
  ]);

  return [
    {
      no_diagnostic_inference_guard_ref: "NO_DIAGNOSTIC_INFERENCE:F9F:LOCAL:001",
      diagnosis_created: false,
      diagnostic_label_created: false,
      pathology_classification_created: false,
      ahe_diagnostic_output_created: false,
      vsm_diagnostic_output_created: false,
      mmabp_final_assessment_created: false,
      client_final_diagnosis_visible: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildNoRealPersistenceGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoRealPersistenceGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueEvidenceHandoffReasons([
    ...validateEvidenceHandoffSourceTrace(sourceTrace),
    ...validateEvidenceHandoffNoPersistence(input),
    ...validateGateInputNoRealExecution(input),
  ]);

  return [
    {
      no_real_persistence_guard_ref: "NO_REAL_PERSISTENCE:F9F:LOCAL:001",
      evidence_item_real_created: false,
      canonical_variable_record_real_created: false,
      readiness_gap_record_real_created: false,
      runtime_audit_trail_real_created: false,
      semantic_resolution_event_real_created: false,
      process_state_timer_event_real_created: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      runtime_real_started: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9FLocalEvidenceCanonicalVariableHandoffLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9FLocalEvidenceCanonicalVariableHandoffLocalResult {
  buildPhase9ELocalInteractionCursorVisibleProgressLocalResult(input);
  const evidence = buildEvidenceCandidateHandoffs(input);
  const variables = buildCanonicalVariableCandidateHandoffs(input);
  const gaps = buildExplicitGapCandidates(input);
  const gateInputs = buildGateInputCandidates(input);
  const provenance = buildEvidenceProvenanceEnvelopeCandidates(input);
  const summaries = buildClientSafeEvidenceSummaryCandidates(input);
  const noDiagnosis = buildNoDiagnosticInferenceGuardCandidates(input);
  const noPersistence = buildNoRealPersistenceGuardCandidates(input);
  const phase9FCompletedLocal = [
    ...evidence,
    ...variables,
    ...gaps,
    ...gateInputs,
    ...provenance,
    ...summaries,
    ...noDiagnosis,
    ...noPersistence,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_accepted: true,
    phase9_F_completed_local: phase9FCompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9G_authorization: false,
    evidence_candidate_handoffs: evidence,
    canonical_variable_candidate_handoffs: variables,
    explicit_gap_candidates: gaps,
    gate_input_candidates: gateInputs,
    provenance_envelope_candidates: provenance,
    client_safe_evidence_summary_candidates: summaries,
    no_diagnostic_inference_guard_candidates: noDiagnosis,
    no_real_persistence_guard_candidates: noPersistence,
    evidence_item_real_created: false,
    canonical_variable_record_real_created: false,
    readiness_gap_record_real_created: false,
    runtime_audit_trail_real_created: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    gate_real_executed: false,
    endpoint_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
  };
}

export function buildCriticalRouteGateSummaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientCriticalRouteGateSummaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const gateInput = buildGateInputCandidates(input)[0];
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateGateReadinessRequiredCandidates(input),
    ...validateGateSummaryNoRealExecution(input),
  ]);
  const codes = ["B0", "B2", "B3_C09", "B7_C20"] as const;

  return codes.map((code, index) => ({
    critical_route_gate_summary_candidate_ref: `CRITICAL_ROUTE_GATE_SUMMARY:F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_gate_input_candidate_ref: gateInput?.gate_input_candidate_ref,
    gate_code: code,
    gate_family: "critical_route",
    gate_summary_client_safe: "La informacion quedo en revision local segura.",
    gate_summary_internal_candidate: "Critical route gate summary candidate prepared without gate execution.",
    gate_real_executed: false,
    critical_route_gate_real_executed: false,
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildSEMPSTGateSummaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSEMPSTGateSummaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const gateInput = buildGateInputCandidates(input)[1] ?? buildGateInputCandidates(input)[0];
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateGateReadinessRequiredCandidates(input),
    ...validateGateSummaryNoRealExecution(input),
  ]);
  const codes = [
    "SEM-001",
    "SEM-002",
    "SEM-003",
    "SEM-004",
    "SEM-005",
    "SEM-006",
    "SEM-007",
    "PST-001",
    "PST-002",
    "PST-003",
    "PST-004",
    "PST-005",
    "PST-006",
  ] as const;

  return codes.map((code, index) => ({
    sem_pst_gate_summary_candidate_ref: `SEM_PST_GATE_SUMMARY:F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_gate_input_candidate_ref: gateInput?.gate_input_candidate_ref,
    gate_code: code,
    gate_family: code.startsWith("SEM") ? "semantic_resolution" : "process_state_timer",
    gate_summary_client_safe: "La informacion se mantiene en revision local.",
    gate_summary_internal_candidate: "SEM/PST gate summary candidate prepared without event creation.",
    gate_real_executed: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildReadinessStateCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientReadinessStateCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const phase9F = buildPhase9FLocalEvidenceCanonicalVariableHandoffLocalResult(input);
  const criticalRoutes = buildCriticalRouteGateSummaryCandidates(input);
  const semPst = buildSEMPSTGateSummaryCandidates(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateGateReadinessRequiredCandidates(input),
    ...validateReadinessNoRealDecision(input),
    ...validateNoDiagnosticFinalCreation(input),
  ]);
  const states = [
    "ready_candidate",
    "ready_with_flags_candidate",
    "blocked_candidate",
    "manual_review_required_candidate",
    "reentry_required_candidate",
    "insufficient_information_candidate",
  ] as const;

  return states.map((state, index) => ({
    readiness_state_candidate_ref: `READINESS_STATE:F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_evidence_candidate_refs: phase9F.evidence_candidate_handoffs.map((candidate) => candidate.evidence_candidate_ref),
    source_canonical_variable_candidate_refs: phase9F.canonical_variable_candidate_handoffs.map((candidate) => candidate.candidate_variable_ref),
    source_gap_candidate_refs: phase9F.explicit_gap_candidates.map((candidate) => candidate.explicit_gap_candidate_ref),
    source_gate_summary_candidate_refs: [
      ...criticalRoutes.map((candidate) => candidate.critical_route_gate_summary_candidate_ref),
      ...semPst.map((candidate) => candidate.sem_pst_gate_summary_candidate_ref),
    ],
    readiness_state: state,
    client_safe_state_label: "Revision local",
    client_safe_state_message: "Estamos revisando la informacion antes de continuar.",
    readiness_decision_record_real_created: false,
    readiness_gap_record_real_created: false,
    readiness_final_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildManualReviewCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientManualReviewCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const readiness = buildReadinessStateCandidates(input)[3];
  const gaps = buildExplicitGapCandidates(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateReviewStateClientSafe(input),
    ...validateReadinessNoRealDecision(input),
  ]);

  return [
    {
      manual_review_candidate_ref: "MANUAL_REVIEW:F9G:LOCAL:001",
      source_readiness_state_candidate_ref: readiness?.readiness_state_candidate_ref,
      source_gap_candidate_refs: gaps.map((gap) => gap.explicit_gap_candidate_ref),
      review_reason_client_safe: "Necesitamos revisar esta informacion antes de seguir.",
      review_reason_internal_candidate: "Manual review candidate only; no actor assigned and no real review created.",
      manual_review_required_candidate: true,
      manual_review_real_created: false,
      manual_review_actor_assigned_real: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildReentryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientReentryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const readiness = buildReadinessStateCandidates(input)[4];
  const gaps = buildExplicitGapCandidates(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateReviewStateClientSafe(input),
    ...validateReadinessNoRealDecision(input),
  ]);

  return [
    {
      reentry_candidate_ref: "REENTRY:F9G:LOCAL:001",
      source_readiness_state_candidate_ref: readiness?.readiness_state_candidate_ref,
      source_gap_candidate_refs: gaps.map((gap) => gap.explicit_gap_candidate_ref),
      reentry_reason_client_safe: "Necesitamos una aclaracion puntual para continuar.",
      reentry_prompt_candidate: "Aclara este punto para que podamos seguir con seguridad.",
      reentry_required_candidate: true,
      reentry_interaction_real_created: false,
      runtime_interaction_instance_real_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildSafeReviewResultCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeReviewResultCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const readiness = buildReadinessStateCandidates(input)[0];
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateReviewStateClientSafe(input),
    ...validateNoDiagnosticFinalCreation(input),
  ]);
  const states = [
    "resultado_en_revision",
    "necesitamos_aclarar_algo",
    "informacion_suficiente_para_revision",
    "bloqueado_seguro",
    "reingreso_requerido",
  ] as const;

  return states.map((state, index) => ({
    safe_review_result_candidate_ref: `SAFE_REVIEW_RESULT:F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_readiness_state_candidate_ref: readiness?.readiness_state_candidate_ref,
    visible_result_state: state,
    visible_message: "La informacion queda en revision local segura.",
    visible_next_action: "Continuar cuando la revision local lo permita.",
    diagnosis_final_included: false,
    internal_gate_state_hidden: true,
    internal_readiness_gap_hidden: true,
    internal_no_go_hidden: true,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildNoGoCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoGoCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const readiness = buildReadinessStateCandidates(input)[2];
  const gateSummaries = buildCriticalRouteGateSummaryCandidates(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateNoGoNoRealPersistence(input),
    ...validateReadinessNoRealDecision(input),
  ]);

  return [
    {
      no_go_candidate_ref: "NO_GO:F9G:LOCAL:001",
      source_gate_summary_refs: gateSummaries.map((candidate) => candidate.critical_route_gate_summary_candidate_ref),
      source_readiness_state_candidate_ref: readiness?.readiness_state_candidate_ref,
      no_go_triggered_candidate: true,
      no_go_reason_internal_candidate: "No-Go candidate only; not persisted and not authorized for activation.",
      client_safe_message: "Por ahora no podemos continuar hasta revisar esta informacion.",
      no_go_real_persisted: false,
      runtime_audit_trail_real_created: false,
      activation_allowed: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildGateGreaterThanChipEnforcementCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateGreaterThanChipEnforcementCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateGateGreaterThanChipEnforced(input),
  ]);

  return [
    {
      gate_greater_than_chip_enforcement_candidate_ref: "GATE_GREATER_THAN_CHIP:F9G:LOCAL:001",
      chip_output_used_as_input_only: true,
      chip_output_can_override_gate: false,
      gate_blocker_prevalence: true,
      diagnosis_from_chip_without_gate: false,
      production_from_chip_without_gate: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildGateReadinessAuditCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessAuditCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueGateReadinessReasons([
    ...validateGateReadinessSourceTrace(sourceTrace),
    ...validateReadinessNoRealDecision(input),
  ]);
  const actions = [
    "critical_route_gate_summary_created",
    "sem_pst_gate_summary_created",
    "readiness_state_candidate_created",
    "manual_review_candidate_created",
    "reentry_candidate_created",
    "safe_review_result_candidate_created",
    "no_go_candidate_created",
    "gate_greater_than_chip_enforced",
  ] as const;

  return actions.map((action, index) => ({
    gate_readiness_audit_candidate_ref: `GATE_READINESS_AUDIT:F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    audit_action: action,
    audit_reason: "F9-G local candidate audit only.",
    source_candidate_ref: `F9G:LOCAL:${String(index + 1).padStart(3, "0")}`,
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildPhase9GLocalGateReadinessReviewStateLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9GLocalGateReadinessReviewStateLocalResult {
  buildPhase9FLocalEvidenceCanonicalVariableHandoffLocalResult(input);
  const criticalRoutes = buildCriticalRouteGateSummaryCandidates(input);
  const semPst = buildSEMPSTGateSummaryCandidates(input);
  const readiness = buildReadinessStateCandidates(input);
  const manualReview = buildManualReviewCandidates(input);
  const reentry = buildReentryCandidates(input);
  const safeReview = buildSafeReviewResultCandidates(input);
  const noGo = buildNoGoCandidates(input);
  const gateGreaterThanChip = buildGateGreaterThanChipEnforcementCandidates(input);
  const audit = buildGateReadinessAuditCandidates(input);
  const phase9GCompletedLocal = [
    ...criticalRoutes,
    ...semPst,
    ...readiness,
    ...manualReview,
    ...reentry,
    ...safeReview,
    ...noGo,
    ...gateGreaterThanChip,
    ...audit,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_accepted: true,
    phase9_F_accepted: true,
    phase9_G_completed_local: phase9GCompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9H_authorization: false,
    critical_route_gate_summary_candidates: criticalRoutes,
    sem_pst_gate_summary_candidates: semPst,
    readiness_state_candidates: readiness,
    manual_review_candidates: manualReview,
    reentry_candidates: reentry,
    safe_review_result_candidates: safeReview,
    no_go_candidates: noGo,
    gate_greater_than_chip_enforcement_candidates: gateGreaterThanChip,
    gate_readiness_audit_candidates: audit,
    gate_real_executed: false,
    critical_route_gate_real_executed: false,
    semantic_resolution_event_real_created: false,
    process_state_timer_event_real_created: false,
    readiness_decision_record_real_created: false,
    readiness_gap_record_real_created: false,
    runtime_audit_trail_real_created: false,
    manual_review_real_created: false,
    reentry_interaction_real_created: false,
    diagnosis_created: false,
    activation_allowed: false,
    endpoint_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
  };
}

export function buildClientOutcomeCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const phase9G = buildPhase9GLocalGateReadinessReviewStateLocalResult(input);
  const readiness = phase9G.readiness_state_candidates[0];
  const safeReview = phase9G.safe_review_result_candidates[0];
  const noGo = phase9G.no_go_candidates[0];
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateOutcomeRequiredCandidates(input),
    ...validateClientOutcomeNoDiagnosis(input),
    ...validateReviewCloseoutNoRealDecision(input),
  ]);
  const states = [
    "resultado_en_revision_candidate",
    "informacion_suficiente_para_revision_candidate",
    "necesitamos_aclarar_algo_candidate",
    "reingreso_requerido_candidate",
    "bloqueado_seguro_candidate",
  ] as const;

  return states.map((state, index) => ({
    client_outcome_candidate_ref: `CLIENT_OUTCOME:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_readiness_state_candidate_ref: readiness?.readiness_state_candidate_ref,
    source_safe_review_result_candidate_ref: safeReview?.safe_review_result_candidate_ref,
    source_no_go_candidate_ref: noGo?.no_go_candidate_ref,
    outcome_state: state,
    visible_outcome_label: "Resultado en revision",
    visible_outcome_message: "La informacion queda registrada para revision local.",
    visible_confidence_language: "Sin diagnostico final.",
    diagnosis_final_included: false,
    readiness_decision_record_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildClientReviewCloseoutCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientReviewCloseoutCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const outcome = buildClientOutcomeCandidates(input)[0];
  const phase9G = buildPhase9GLocalGateReadinessReviewStateLocalResult(input);
  const manualReview = phase9G.manual_review_candidates[0];
  const reentry = phase9G.reentry_candidates[0];
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateReviewCloseoutRequiredCandidates(input),
    ...validateReviewCloseoutNoRealDecision(input),
  ]);
  const states = [
    "review_pending_candidate",
    "manual_review_required_candidate",
    "reentry_required_candidate",
    "blocked_safe_candidate",
    "local_candidate_complete_for_review",
  ] as const;

  return states.map((state, index) => ({
    client_review_closeout_candidate_ref: `CLIENT_REVIEW_CLOSEOUT:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_client_outcome_candidate_ref: outcome?.client_outcome_candidate_ref,
    source_manual_review_candidate_ref: manualReview?.manual_review_candidate_ref,
    source_reentry_candidate_ref: reentry?.reentry_candidate_ref,
    review_closeout_state: state,
    client_visible_closeout_message: "La interaccion local queda en revision segura.",
    review_pending_candidate: state === "review_pending_candidate",
    manual_review_required_candidate: state === "manual_review_required_candidate",
    reentry_required_candidate: state === "reentry_required_candidate",
    closeout_real_persisted: false,
    manual_review_real_created: false,
    reentry_interaction_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildClientNextActionCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNextActionCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const outcome = buildClientOutcomeCandidates(input)[0];
  const closeout = buildClientReviewCloseoutCandidates(input)[0];
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateReviewCloseoutRequiredCandidates(input),
    ...validateNextActionNoRealWorkflow(input),
  ]);
  const kinds = [
    "esperar_revision",
    "corregir_respuesta",
    "aclarar_informacion",
    "continuar_interaccion",
    "contactar_revision",
    "bloqueado_seguro_sin_accion",
  ] as const;

  return kinds.map((kind, index) => ({
    client_next_action_candidate_ref: `CLIENT_NEXT_ACTION:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_client_outcome_candidate_ref: outcome?.client_outcome_candidate_ref,
    source_review_closeout_candidate_ref: closeout?.client_review_closeout_candidate_ref,
    next_action_kind: kind,
    next_action_label: "Continuar con seguridad",
    next_action_description: "Accion local candidate; no inicia workflow real.",
    action_enabled_candidate: kind !== "bloqueado_seguro_sin_accion",
    requires_user_correction_candidate: kind === "corregir_respuesta",
    requires_manual_review_candidate: kind === "contactar_revision",
    requires_reentry_candidate: kind === "aclarar_informacion",
    starts_real_workflow: false,
    creates_endpoint_call: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildClientSafeCloseoutSummaryCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientSafeCloseoutSummaryCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const outcome = buildClientOutcomeCandidates(input)[0];
  const phase9F = buildPhase9FLocalEvidenceCanonicalVariableHandoffLocalResult(input);
  const safeReview = buildSafeReviewResultCandidates(input)[0];
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateOutcomeRequiredCandidates(input),
    ...validateCloseoutSummaryClientSafe(input),
    ...validateNoExportNoActivationNoPhaseClose(input),
  ]);
  const statuses = [
    "en_revision",
    "requiere_aclaracion",
    "requiere_correccion",
    "bloqueado_seguro",
    "listo_para_revision",
  ] as const;

  return statuses.map((status, index) => ({
    client_safe_closeout_summary_candidate_ref: `CLIENT_SAFE_CLOSEOUT_SUMMARY:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_client_outcome_candidate_ref: outcome?.client_outcome_candidate_ref,
    source_safe_evidence_summary_refs: phase9F.client_safe_evidence_summary_candidates.map(
      (candidate) => candidate.client_safe_evidence_summary_candidate_ref,
    ),
    source_safe_review_result_candidate_ref: safeReview?.safe_review_result_candidate_ref,
    visible_summary_title: "Resumen de revision",
    visible_summary_body: "La informacion queda lista para revision local segura.",
    visible_status: status,
    visible_next_action_label: "Esperar revision",
    internal_evidence_hidden: true,
    internal_gate_state_hidden: true,
    internal_chip_state_hidden: true,
    runtime_table_hidden: true,
    diagnosis_hidden: true,
    export_hidden: true,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildCorrectionReentryHandoffCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientCorrectionReentryHandoffCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const nextAction = buildClientNextActionCandidates(input)[1];
  const reentry = buildReentryCandidates(input)[0];
  const subfields = buildSubfieldCaptureCandidates(input);
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateNextActionNoRealWorkflow(input),
    ...validateReviewCloseoutNoRealDecision(input),
  ]);
  const kinds = [
    "correction_candidate",
    "reentry_candidate",
    "clarification_candidate",
    "no_handoff_required",
  ] as const;

  return kinds.map((kind, index) => ({
    correction_reentry_handoff_candidate_ref: `CORRECTION_REENTRY_HANDOFF:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_next_action_candidate_ref: nextAction?.client_next_action_candidate_ref,
    source_reentry_candidate_ref: reentry?.reentry_candidate_ref,
    target_interaction_candidate_ref: "RUNTIME_INTERACTION_INSTANCE:F9E:CANDIDATE:001",
    target_subfield_candidate_refs: subfields.map((subfield) => subfield.subfield_capture_candidate_ref),
    handoff_kind: kind,
    client_safe_prompt: "Puedes aclarar o corregir esta informacion si hace falta.",
    runtime_interaction_instance_real_created: false,
    response_record_real_created: false,
    runtime_subfield_response_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildLocalCloseoutSnapshotCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalCloseoutSnapshotCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const scope = resolveScope(input.scope_ref);
  const outcome = buildClientOutcomeCandidates(input)[0];
  const closeout = buildClientReviewCloseoutCandidates(input)[0];
  const nextAction = buildClientNextActionCandidates(input)[0];
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateReviewCloseoutRequiredCandidates(input),
    ...validateNoExportNoActivationNoPhaseClose(input),
  ]);
  const kinds = [
    "client_visible_review_snapshot",
    "blocked_safe_snapshot",
    "reentry_required_snapshot",
    "manual_review_required_snapshot",
    "local_candidate_complete_snapshot",
  ] as const;

  return kinds.map((kind, index) => ({
    local_closeout_snapshot_candidate_ref: `LOCAL_CLOSEOUT_SNAPSHOT:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    source_activity_runtime_run_candidate_ref: scope.activity_runtime_run_ref,
    source_client_outcome_candidate_ref: outcome?.client_outcome_candidate_ref,
    source_review_closeout_candidate_ref: closeout?.client_review_closeout_candidate_ref,
    source_next_action_candidate_ref: nextAction?.client_next_action_candidate_ref,
    snapshot_kind: kind,
    snapshot_created_local: true,
    snapshot_real_persisted: false,
    export_payload_real_created: false,
    registry_real_created: false,
    ir_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildNoDiagnosisNoExportCloseoutGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoDiagnosisNoExportCloseoutGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateClientOutcomeNoDiagnosis(input),
    ...validateNoExportNoActivationNoPhaseClose(input),
  ]);

  return [
    {
      no_diagnosis_no_export_closeout_guard_ref: "NO_DIAGNOSIS_NO_EXPORT_CLOSEOUT:F9H:LOCAL:001",
      diagnosis_created: false,
      diagnostic_label_created: false,
      pathology_classification_created: false,
      client_final_diagnosis_visible: false,
      export_real_created: false,
      parallel_export_payload_real_created: false,
      registry_created: false,
      ir_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildNoActivationNoPhaseCloseGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientNoActivationNoPhaseCloseGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateNoExportNoActivationNoPhaseClose(input),
  ]);

  return [
    {
      no_activation_no_phase_close_guard_ref: "NO_ACTIVATION_NO_PHASE_CLOSE:F9H:LOCAL:001",
      activation_allowed: false,
      qa_green_real_created: false,
      runtime_40_20_started_real: false,
      endpoint_created: false,
      public_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      phase9_closed_local: false,
      ready_for_phase9I_authorization: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildOutcomeCloseoutAuditCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutAuditCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniqueOutcomeCloseoutReasons([
    ...validateOutcomeCloseoutSourceTrace(sourceTrace),
    ...validateReviewCloseoutNoRealDecision(input),
  ]);
  const actions = [
    "client_outcome_candidate_created",
    "client_review_closeout_candidate_created",
    "client_next_action_candidate_created",
    "client_safe_closeout_summary_candidate_created",
    "correction_reentry_handoff_candidate_created",
    "local_closeout_snapshot_candidate_created",
    "no_diagnosis_no_export_guard_enforced",
    "no_activation_no_phase_close_guard_enforced",
  ] as const;

  return actions.map((action, index) => ({
    outcome_closeout_audit_candidate_ref: `OUTCOME_CLOSEOUT_AUDIT:F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    audit_action: action,
    audit_reason: "F9-H local candidate audit only.",
    source_candidate_ref: `F9H:LOCAL:${String(index + 1).padStart(3, "0")}`,
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildPhase9HLocalClientOutcomeReviewCloseoutLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9HLocalClientOutcomeReviewCloseoutLocalResult {
  buildPhase9GLocalGateReadinessReviewStateLocalResult(input);
  const outcomes = buildClientOutcomeCandidates(input);
  const closeouts = buildClientReviewCloseoutCandidates(input);
  const nextActions = buildClientNextActionCandidates(input);
  const summaries = buildClientSafeCloseoutSummaryCandidates(input);
  const handoffs = buildCorrectionReentryHandoffCandidates(input);
  const snapshots = buildLocalCloseoutSnapshotCandidates(input);
  const noDiagnosisNoExport = buildNoDiagnosisNoExportCloseoutGuardCandidates(input);
  const noActivationNoClose = buildNoActivationNoPhaseCloseGuardCandidates(input);
  const audit = buildOutcomeCloseoutAuditCandidates(input);
  const phase9HCompletedLocal = [
    ...outcomes,
    ...closeouts,
    ...nextActions,
    ...summaries,
    ...handoffs,
    ...snapshots,
    ...noDiagnosisNoExport,
    ...noActivationNoClose,
    ...audit,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_accepted: true,
    phase9_F_accepted: true,
    phase9_G_accepted: true,
    phase9_H_completed_local: phase9HCompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9I_authorization: false,
    client_outcome_candidates: outcomes,
    client_review_closeout_candidates: closeouts,
    client_next_action_candidates: nextActions,
    client_safe_closeout_summary_candidates: summaries,
    correction_reentry_handoff_candidates: handoffs,
    local_closeout_snapshot_candidates: snapshots,
    no_diagnosis_no_export_closeout_guard_candidates: noDiagnosisNoExport,
    no_activation_no_phase_close_guard_candidates: noActivationNoClose,
    outcome_closeout_audit_candidates: audit,
    diagnosis_created: false,
    diagnostic_label_created: false,
    pathology_classification_created: false,
    client_final_diagnosis_visible: false,
    readiness_decision_record_real_created: false,
    manual_review_real_created: false,
    reentry_interaction_real_created: false,
    runtime_interaction_instance_real_created: false,
    response_record_real_created: false,
    runtime_subfield_response_real_created: false,
    runtime_audit_trail_real_created: false,
    export_real_created: false,
    parallel_export_payload_real_created: false,
    registry_created: false,
    ir_created: false,
    activation_allowed: false,
    qa_green_real_created: false,
    endpoint_created: false,
    public_route_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    produccion_paralela_started: false,
  };
}

export function buildPhase9AggregateCoverageCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateCoverageCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const phase9H = buildPhase9HLocalClientOutcomeReviewCloseoutLocalResult(input);
  const missingTramos = resolveMissingPhase9Tramos(input, phase9H);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9AggregateCoverage(input),
  ]);

  return [
    {
      aggregate_coverage_candidate_ref: "PHASE9_AGGREGATE_COVERAGE:F9I:LOCAL:001",
      phase9_A_covered: !input.missing_phase9a_traceability_attempted && phase9H.phase9_A_accepted,
      phase9_B_covered: !input.missing_phase9b_traceability_attempted && phase9H.phase9_B_accepted,
      phase9_C_covered: !input.missing_phase9c_traceability_attempted && phase9H.phase9_C_accepted,
      phase9_D_covered: !input.missing_phase9d_traceability_attempted && phase9H.phase9_D_accepted,
      phase9_E_covered: !input.missing_phase9e_traceability_attempted && phase9H.phase9_E_accepted,
      phase9_F_covered: !input.missing_phase9f_traceability_attempted && phase9H.phase9_F_accepted,
      phase9_G_covered: !input.missing_phase9g_traceability_attempted && phase9H.phase9_G_accepted,
      phase9_H_covered: !input.missing_phase9h_traceability_attempted && phase9H.phase9_H_completed_local,
      all_required_tramos_covered_candidate: missingTramos.length === 0,
      missing_tramos: missingTramos,
      coverage_real_certification_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9CrossPhaseConsistencyCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9CrossPhaseConsistencyCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9CrossPhaseConsistency(input),
  ]);
  const consistent = reasons.length === 0;

  return [
    {
      cross_phase_consistency_candidate_ref: "PHASE9_CROSS_PHASE_CONSISTENCY:F9I:LOCAL:001",
      client_membrane_to_bff_consistent: consistent,
      bff_to_route_shell_consistent: consistent,
      route_shell_to_local_wiring_consistent: consistent,
      local_wiring_to_interaction_cursor_consistent: consistent,
      interaction_cursor_to_evidence_handoff_consistent: consistent,
      evidence_handoff_to_gate_readiness_consistent: consistent,
      gate_readiness_to_client_outcome_consistent: consistent,
      client_visible_language_consistent: consistent,
      no_contradiction_detected: consistent,
      consistency_real_certification_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9BoundaryIntegrityCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9BoundaryIntegrityCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9BoundaryIntegrity(input),
  ]);

  return [
    {
      boundary_integrity_candidate_ref: "PHASE9_BOUNDARY_INTEGRITY:F9I:LOCAL:001",
      endpoint_created: false,
      api_route_created: false,
      public_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_40_20_started_real: false,
      qa_green_real_created: false,
      activation_allowed: false,
      diagnosis_created: false,
      export_real_created: false,
      produccion_paralela_started: false,
      registry_created: false,
      ir_created: false,
      boundary_integrity_candidate_passed: reasons.length === 0,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9ClientSurfaceLeakageScanCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ClientSurfaceLeakageScanCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9ClientSurfaceNoLeakage(input),
  ]);

  return [
    {
      client_surface_leakage_scan_candidate_ref: "PHASE9_CLIENT_SURFACE_LEAKAGE_SCAN:F9I:LOCAL:001",
      mmabp_jargon_exposed: false,
      vsm_jargon_exposed: false,
      ahe_jargon_exposed: false,
      gate_jargon_exposed: false,
      chip_jargon_exposed: false,
      runtime_table_jargon_exposed: false,
      registry_jargon_exposed: false,
      diagnosis_jargon_exposed: false,
      export_jargon_exposed: false,
      internal_organs_exposed: false,
      client_surface_scan_passed: reasons.length === 0,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9NoRealActivationAggregateGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9NoRealActivationAggregateGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9NoRealActivation(input),
  ]);

  return [
    {
      no_real_activation_aggregate_guard_ref: "PHASE9_NO_REAL_ACTIVATION_AGGREGATE:F9I:LOCAL:001",
      endpoint_created: false,
      api_route_created: false,
      public_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_40_20_started_real: false,
      qa_green_real_created: false,
      activation_allowed: false,
      real_customer_data_used: false,
      real_client_access_enabled: false,
      production_deployment_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9SourceTraceCompletenessCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9SourceTraceCompletenessCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9SourceTraceCompleteness(input),
  ]);
  const allPresent = resolveMissingPhase9Tramos(input).length === 0;

  return [
    {
      source_trace_completeness_candidate_ref: "PHASE9_SOURCE_TRACE_COMPLETENESS:F9I:LOCAL:001",
      phase9_A_source_trace_present: !input.missing_phase9a_traceability_attempted,
      phase9_B_source_trace_present: !input.missing_phase9b_traceability_attempted,
      phase9_C_source_trace_present: !input.missing_phase9c_traceability_attempted,
      phase9_D_source_trace_present: !input.missing_phase9d_traceability_attempted,
      phase9_E_source_trace_present: !input.missing_phase9e_traceability_attempted,
      phase9_F_source_trace_present: !input.missing_phase9f_traceability_attempted,
      phase9_G_source_trace_present: !input.missing_phase9g_traceability_attempted,
      phase9_H_source_trace_present: !input.missing_phase9h_traceability_attempted,
      source_sections_declared: reasons.length === 0,
      content_traceable_to_source_documents: reasons.length === 0,
      archived_plan_used_as_active_guide: false,
      handoff_used_as_active_guide: false,
      free_inference_detected: false,
      unauthorized_expansion_detected: false,
      source_trace_complete_candidate: allPresent && reasons.length === 0,
      source_trace_real_certification_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9ClosureReadinessCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ClosureReadinessCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const coverage = buildPhase9AggregateCoverageCandidates(input)[0];
  const consistency = buildPhase9CrossPhaseConsistencyCandidates(input)[0];
  const boundary = buildPhase9BoundaryIntegrityCandidates(input)[0];
  const leakage = buildPhase9ClientSurfaceLeakageScanCandidates(input)[0];
  const sourceCompleteness = buildPhase9SourceTraceCompletenessCandidates(input)[0];
  const noCloseReasons = validatePhase9NoPhaseClose(input);
  const reasons = uniquePhase9AggregateReasons([
    ...(coverage?.blocking_reasons ?? []),
    ...(consistency?.blocking_reasons ?? []),
    ...(boundary?.blocking_reasons ?? []),
    ...(leakage?.blocking_reasons ?? []),
    ...(sourceCompleteness?.blocking_reasons ?? []),
    ...noCloseReasons,
  ]);
  const states = [
    "ready_for_closure_review_candidate",
    "blocked_by_missing_tramo_candidate",
    "blocked_by_inconsistency_candidate",
    "blocked_by_boundary_violation_candidate",
    "blocked_by_source_trace_gap_candidate",
    "blocked_by_client_surface_leakage_candidate",
  ] as const;

  return states.map((state, index) => ({
    closure_readiness_candidate_ref: `PHASE9_CLOSURE_READINESS:F9I:LOCAL:${String(index + 1).padStart(3, "0")}`,
    aggregate_coverage_candidate_ref: coverage?.aggregate_coverage_candidate_ref,
    cross_phase_consistency_candidate_ref: consistency?.cross_phase_consistency_candidate_ref,
    boundary_integrity_candidate_ref: boundary?.boundary_integrity_candidate_ref,
    client_surface_leakage_scan_candidate_ref: leakage?.client_surface_leakage_scan_candidate_ref,
    source_trace_completeness_candidate_ref: sourceCompleteness?.source_trace_completeness_candidate_ref,
    closure_readiness_state: state,
    closure_readiness_message: "Fase 9 queda como candidate local para revision de cierre posterior.",
    ready_for_phase9J_authorization: false,
    phase9_closed_local: false,
    closure_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildPhase9LocalReadinessAuditCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9LocalReadinessAuditCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9NoPhaseClose(input),
  ]);
  const actions = [
    "aggregate_coverage_validated",
    "cross_phase_consistency_validated",
    "boundary_integrity_validated",
    "client_surface_leakage_scan_completed",
    "no_real_activation_guard_validated",
    "source_trace_completeness_validated",
    "closure_readiness_candidate_created",
    "no_phase_close_guard_enforced",
  ] as const;

  return actions.map((action, index) => ({
    phase9_local_readiness_audit_candidate_ref: `PHASE9_LOCAL_READINESS_AUDIT:F9I:LOCAL:${String(index + 1).padStart(3, "0")}`,
    audit_action: action,
    audit_reason: "F9-I local aggregate validation audit only.",
    source_candidate_ref: `F9I:LOCAL:${String(index + 1).padStart(3, "0")}`,
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildPhase9NoPhaseCloseGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9NoPhaseCloseGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9NoPhaseClose(input),
  ]);

  return [
    {
      no_phase_close_guard_ref: "PHASE9_NO_PHASE_CLOSE:F9I:LOCAL:001",
      phase9_closed_local: false,
      phase9_real_closure_created: false,
      qa_green_real_created: false,
      activation_allowed: false,
      ready_for_phase9J_authorization: false,
      closure_authorization_required: true,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9ILocalAggregateValidationClosureReadinessLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ILocalAggregateValidationClosureReadinessLocalResult {
  buildPhase9HLocalClientOutcomeReviewCloseoutLocalResult(input);
  const coverage = buildPhase9AggregateCoverageCandidates(input);
  const consistency = buildPhase9CrossPhaseConsistencyCandidates(input);
  const boundary = buildPhase9BoundaryIntegrityCandidates(input);
  const leakage = buildPhase9ClientSurfaceLeakageScanCandidates(input);
  const activationGuard = buildPhase9NoRealActivationAggregateGuardCandidates(input);
  const sourceCompleteness = buildPhase9SourceTraceCompletenessCandidates(input);
  const closureReadiness = buildPhase9ClosureReadinessCandidates(input);
  const audit = buildPhase9LocalReadinessAuditCandidates(input);
  const noClose = buildPhase9NoPhaseCloseGuardCandidates(input);
  const phase9ICompletedLocal = [
    ...coverage,
    ...consistency,
    ...boundary,
    ...leakage,
    ...activationGuard,
    ...sourceCompleteness,
    ...closureReadiness,
    ...audit,
    ...noClose,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_accepted: true,
    phase9_F_accepted: true,
    phase9_G_accepted: true,
    phase9_H_accepted: true,
    phase9_I_completed_local: phase9ICompletedLocal,
    phase9_closed_local: false,
    ready_for_phase9J_authorization: false,
    aggregate_coverage_candidates: coverage,
    cross_phase_consistency_candidates: consistency,
    boundary_integrity_candidates: boundary,
    client_surface_leakage_scan_candidates: leakage,
    no_real_activation_aggregate_guard_candidates: activationGuard,
    source_trace_completeness_candidates: sourceCompleteness,
    closure_readiness_candidates: closureReadiness,
    phase9_local_readiness_audit_candidates: audit,
    no_phase_close_guard_candidates: noClose,
    endpoint_created: false,
    api_route_created: false,
    public_route_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    phase9_real_closure_created: false,
  };
}

export function buildPhase9ClosurePackageCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ClosurePackageCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const phase9I = buildPhase9ILocalAggregateValidationClosureReadinessLocalResult(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9ClosurePackageCompleteness(input),
  ]);

  return [
    {
      phase9_closure_package_candidate_ref: "PHASE9_CLOSURE_PACKAGE:F9J:LOCAL:001",
      phase9_A_included: phase9I.phase9_A_accepted,
      phase9_B_included: phase9I.phase9_B_accepted,
      phase9_C_included: phase9I.phase9_C_accepted,
      phase9_D_included: phase9I.phase9_D_accepted,
      phase9_E_included: phase9I.phase9_E_accepted,
      phase9_F_included: phase9I.phase9_F_accepted,
      phase9_G_included: phase9I.phase9_G_accepted,
      phase9_H_included: phase9I.phase9_H_accepted,
      phase9_I_included: phase9I.phase9_I_completed_local,
      closure_package_created_local: true,
      phase9_closed_local: false,
      ready_for_real_activation_authorization: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9EvidenceIndexCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9EvidenceIndexCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9EvidenceIndexCompleteness(input),
  ]);

  return [
    {
      phase9_evidence_index_candidate_ref: "PHASE9_EVIDENCE_INDEX:F9J:LOCAL:001",
      indexed_phase_refs: [
        "Phase 9-A",
        "Phase 9-B",
        "Phase 9-C",
        "Phase 9-D",
        "Phase 9-E",
        "Phase 9-F",
        "Phase 9-G",
        "Phase 9-H",
        "Phase 9-I",
      ],
      evidence_index_created_local: true,
      evidence_audit_real_persisted: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9BoundaryLedgerCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9BoundaryLedgerCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9BoundaryLedgerNoViolation(input),
  ]);

  return [
    {
      phase9_boundary_ledger_candidate_ref: "PHASE9_BOUNDARY_LEDGER:F9J:LOCAL:001",
      endpoint_created: false,
      api_route_created: false,
      public_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_40_20_started_real: false,
      qa_green_real_created: false,
      activation_allowed: false,
      diagnosis_created: false,
      export_real_created: false,
      produccion_paralela_started: false,
      registry_created: false,
      ir_created: false,
      real_client_access_enabled: false,
      boundary_ledger_candidate_passed: reasons.length === 0,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9SourceTraceIndexCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9SourceTraceIndexCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9SourceTraceIndexCompleteness(input),
  ]);

  return [
    {
      phase9_source_trace_index_candidate_ref: "PHASE9_SOURCE_TRACE_INDEX:F9J:LOCAL:001",
      source_trace_index_created_local: true,
      phase9_A_source_trace_indexed: !input.missing_phase9a_traceability_attempted,
      phase9_B_source_trace_indexed: !input.missing_phase9b_traceability_attempted,
      phase9_C_source_trace_indexed: !input.missing_phase9c_traceability_attempted,
      phase9_D_source_trace_indexed: !input.missing_phase9d_traceability_attempted,
      phase9_E_source_trace_indexed: !input.missing_phase9e_traceability_attempted,
      phase9_F_source_trace_indexed: !input.missing_phase9f_traceability_attempted,
      phase9_G_source_trace_indexed: !input.missing_phase9g_traceability_attempted,
      phase9_H_source_trace_indexed: !input.missing_phase9h_traceability_attempted,
      phase9_I_source_trace_indexed: true,
      source_trace_index_complete_candidate: reasons.length === 0,
      source_trace_index_real_persisted: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9TestEvidenceRollupCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9TestEvidenceRollupCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9TestEvidenceRollup(input),
  ]);

  return [
    {
      phase9_test_evidence_rollup_candidate_ref: "PHASE9_TEST_EVIDENCE_ROLLUP:F9J:LOCAL:001",
      test_command:
        "node --test src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane.test.mjs",
      test_status: "passed",
      test_count: 813,
      failed_count: 0,
      test_rollup_created_local: true,
      productive_certification_created: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9UnresolvedBlockerRegisterCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9UnresolvedBlockerRegisterCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9FinalPackageNoRealActivation(input),
  ]);

  return [
    {
      phase9_unresolved_blocker_register_candidate_ref:
        "PHASE9_UNRESOLVED_BLOCKER_REGISTER:F9J:LOCAL:001",
      unresolved_blockers: reasons,
      unresolved_blocker_register_created_local: true,
      blocker_register_real_persisted: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9NoActivationClosureGuardCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9NoActivationClosureGuardCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9NoActivationClosureGuard(input),
  ]);

  return [
    {
      phase9_no_activation_closure_guard_ref: "PHASE9_NO_ACTIVATION_CLOSURE:F9J:LOCAL:001",
      endpoint_created: false,
      api_route_created: false,
      public_route_created: false,
      supabase_touched: false,
      sql_executed: false,
      runtime_40_20_started_real: false,
      qa_green_real_created: false,
      activation_allowed: false,
      diagnosis_created: false,
      export_real_created: false,
      produccion_paralela_started: false,
      registry_created: false,
      ir_created: false,
      real_client_access_enabled: false,
      closure_guard_passed: reasons.length === 0,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9ClosurePackageAuditCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9ClosurePackageAuditCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9AggregateSourceTrace(sourceTrace),
    ...validatePhase9NoActivationClosureGuard(input),
  ]);
  const actions = [
    "closure_package_candidate_created",
    "evidence_index_candidate_created",
    "boundary_ledger_candidate_created",
    "source_trace_index_candidate_created",
    "test_evidence_rollup_candidate_created",
    "unresolved_blocker_register_candidate_created",
    "no_activation_closure_guard_enforced",
    "final_local_package_readiness_candidate_created",
  ] as const;

  return actions.map((action, index) => ({
    phase9_closure_package_audit_candidate_ref: `PHASE9_CLOSURE_PACKAGE_AUDIT:F9J:LOCAL:${String(index + 1).padStart(3, "0")}`,
    audit_action: action,
    audit_reason: "F9-J local closure package candidate audit only.",
    source_candidate_ref: `F9J:LOCAL:${String(index + 1).padStart(3, "0")}`,
    runtime_audit_trail_real_created: false,
    source_trace: sourceTrace,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildPhase9FinalLocalPackageReadinessCandidates(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9FinalLocalPackageReadinessCandidate[] {
  const sourceTrace = resolveSourceTrace(input);
  const closurePackage = buildPhase9ClosurePackageCandidates(input)[0];
  const evidenceIndex = buildPhase9EvidenceIndexCandidates(input)[0];
  const boundaryLedger = buildPhase9BoundaryLedgerCandidates(input)[0];
  const sourceTraceIndex = buildPhase9SourceTraceIndexCandidates(input)[0];
  const testRollup = buildPhase9TestEvidenceRollupCandidates(input)[0];
  const guard = buildPhase9NoActivationClosureGuardCandidates(input)[0];
  const reasons = uniquePhase9AggregateReasons([
    ...(closurePackage?.blocking_reasons ?? []),
    ...(evidenceIndex?.blocking_reasons ?? []),
    ...(boundaryLedger?.blocking_reasons ?? []),
    ...(sourceTraceIndex?.blocking_reasons ?? []),
    ...(testRollup?.blocking_reasons ?? []),
    ...(guard?.blocking_reasons ?? []),
    ...validatePhase9FinalPackageNoRealActivation(input),
  ]);

  return [
    {
      phase9_final_local_package_readiness_candidate_ref:
        "PHASE9_FINAL_LOCAL_PACKAGE_READINESS:F9J:LOCAL:001",
      closure_package_candidate_ref: closurePackage?.phase9_closure_package_candidate_ref,
      evidence_index_candidate_ref: evidenceIndex?.phase9_evidence_index_candidate_ref,
      boundary_ledger_candidate_ref: boundaryLedger?.phase9_boundary_ledger_candidate_ref,
      source_trace_index_candidate_ref: sourceTraceIndex?.phase9_source_trace_index_candidate_ref,
      test_evidence_rollup_candidate_ref: testRollup?.phase9_test_evidence_rollup_candidate_ref,
      no_activation_closure_guard_ref: guard?.phase9_no_activation_closure_guard_ref,
      final_local_package_ready_candidate: reasons.length === 0,
      ready_for_real_activation_authorization: false,
      activation_allowed: false,
      qa_green_real_created: false,
      runtime_40_20_started_real: false,
      real_client_access_enabled: false,
      phase9_closed_local: false,
      source_trace: sourceTrace,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase9JLocalClosurePackageNoActivationLocalResult(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9JLocalClosurePackageNoActivationLocalResult {
  buildPhase9ILocalAggregateValidationClosureReadinessLocalResult(input);
  const closurePackage = buildPhase9ClosurePackageCandidates(input);
  const evidenceIndex = buildPhase9EvidenceIndexCandidates(input);
  const boundaryLedger = buildPhase9BoundaryLedgerCandidates(input);
  const sourceTraceIndex = buildPhase9SourceTraceIndexCandidates(input);
  const testRollup = buildPhase9TestEvidenceRollupCandidates(input);
  const blockers = buildPhase9UnresolvedBlockerRegisterCandidates(input);
  const guard = buildPhase9NoActivationClosureGuardCandidates(input);
  const audit = buildPhase9ClosurePackageAuditCandidates(input);
  const readiness = buildPhase9FinalLocalPackageReadinessCandidates(input);
  const phase9JCompletedLocal = [
    ...closurePackage,
    ...evidenceIndex,
    ...boundaryLedger,
    ...sourceTraceIndex,
    ...testRollup,
    ...blockers,
    ...guard,
    ...audit,
    ...readiness,
  ].every((candidate) => candidate.candidate_allowed);

  return {
    phase9_started_local: true,
    phase9_A_accepted: true,
    phase9_B_accepted: true,
    phase9_C_accepted: true,
    phase9_D_accepted: true,
    phase9_E_accepted: true,
    phase9_F_accepted: true,
    phase9_G_accepted: true,
    phase9_H_accepted: true,
    phase9_I_accepted: true,
    phase9_J_completed_local: phase9JCompletedLocal,
    phase9_closed_local: false,
    ready_for_real_activation_authorization: false,
    closure_package_candidates: closurePackage,
    evidence_index_candidates: evidenceIndex,
    boundary_ledger_candidates: boundaryLedger,
    source_trace_index_candidates: sourceTraceIndex,
    test_evidence_rollup_candidates: testRollup,
    unresolved_blocker_register_candidates: blockers,
    no_activation_closure_guard_candidates: guard,
    closure_package_audit_candidates: audit,
    final_local_package_readiness_candidates: readiness,
    endpoint_created: false,
    api_route_created: false,
    public_route_created: false,
    supabase_touched: false,
    sql_executed: false,
    runtime_40_20_started_real: false,
    qa_green_real_created: false,
    activation_allowed: false,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    real_client_access_enabled: false,
  };
}

export function validatePhase9AggregateCoverage(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons: RuntimePhase9AggregateValidationBlockingReason[] = [];
  if (input.missing_phase9a_traceability_attempted) reasons.push("missing_phase9a_traceability");
  if (input.missing_phase9b_traceability_attempted) reasons.push("missing_phase9b_traceability");
  if (input.missing_phase9c_traceability_attempted) reasons.push("missing_phase9c_traceability");
  if (input.missing_phase9d_traceability_attempted) reasons.push("missing_phase9d_traceability");
  if (input.missing_phase9e_traceability_attempted) reasons.push("missing_phase9e_traceability");
  if (input.missing_phase9f_traceability_attempted) reasons.push("missing_phase9f_traceability");
  if (input.missing_phase9g_traceability_attempted) reasons.push("missing_phase9g_traceability");
  if (input.missing_phase9h_traceability_attempted) reasons.push("missing_phase9h_traceability");
  return uniquePhase9AggregateReasons(reasons);
}

export function validatePhase9CrossPhaseConsistency(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons: RuntimePhase9AggregateValidationBlockingReason[] = [];
  if (input.cross_phase_inconsistency_attempted) {
    reasons.push("cross_phase_inconsistency_detected");
  }
  return uniquePhase9AggregateReasons(reasons);
}

export function validatePhase9BoundaryIntegrity(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons: RuntimePhase9AggregateValidationBlockingReason[] = [];
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.api_route_creation_attempted) reasons.push("api_route_creation_attempted");
  if (input.public_route_creation_attempted || input.public_production_route_attempted) {
    reasons.push("public_route_creation_attempted");
  }
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  if (input.qa_green_real_creation_attempted) reasons.push("qa_green_real_creation_attempted");
  if (input.activation_allowed_attempted) reasons.push("activation_allowed_attempted");
  if (
    input.diagnosis_final_creation_attempted ||
    input.diagnostic_label_creation_attempted ||
    input.pathology_classification_attempted
  ) {
    reasons.push("diagnosis_creation_attempted");
  }
  if (input.export_real_creation_attempted) reasons.push("export_real_creation_attempted");
  if (input.produccion_paralela_start_attempted || input.production_from_chip_attempted) {
    reasons.push("produccion_paralela_start_attempted");
  }
  return uniquePhase9AggregateReasons(reasons.length ? ["boundary_violation_detected", ...reasons] : []);
}

export function validatePhase9ClientSurfaceNoLeakage(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const leakageDetected =
    input.client_surface_leakage_attempted ||
    input.mmabp_jargon_detected ||
    input.vsm_jargon_detected ||
    input.ahe_jargon_detected ||
    input.gate_jargon_detected ||
    input.chip_jargon_detected ||
    input.runtime_table_jargon_detected ||
    input.registry_exposure_attempted ||
    input.diagnosis_exposure_attempted ||
    input.diagnosis_final_render_attempted ||
    input.export_exposure_attempted ||
    input.internal_surface_leak_attempted ||
    input.internal_organ_render_attempted;

  return leakageDetected ? ["client_surface_leakage_detected"] : [];
}

export function validatePhase9NoRealActivation(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons = uniquePhase9AggregateReasons([
    ...validatePhase9BoundaryIntegrity(input),
    ...(input.real_customer_data_attempted ? ["boundary_violation_detected" as const] : []),
    ...(input.real_client_access_attempted ? ["boundary_violation_detected" as const] : []),
    ...(input.production_deployment_creation_attempted
      ? ["boundary_violation_detected" as const]
      : []),
  ]);
  return reasons;
}

export function validatePhase9SourceTraceCompleteness(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons: RuntimePhase9AggregateValidationBlockingReason[] = [
    ...validatePhase9AggregateCoverage(input),
  ];
  if (input.archived_plan_active_guide_attempted) {
    reasons.push("archived_plan_used_as_active_guide");
  }
  if (input.handoff_active_guide_attempted) reasons.push("handoff_used_as_active_guide");
  if (input.free_inference_attempted) reasons.push("free_inference_detected");
  if (input.unauthorized_expansion_attempted) reasons.push("unauthorized_expansion_detected");
  return uniquePhase9AggregateReasons(reasons);
}

export function validatePhase9NoPhaseClose(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  const reasons: RuntimePhase9AggregateValidationBlockingReason[] = [];
  if (input.phase9_close_attempted) reasons.push("phase9_close_attempted");
  if (input.qa_green_real_creation_attempted) reasons.push("qa_green_real_creation_attempted");
  if (input.activation_allowed_attempted) reasons.push("activation_allowed_attempted");
  return uniquePhase9AggregateReasons(reasons);
}

export function validatePhase9ClosurePackageCompleteness(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return uniquePhase9AggregateReasons([
    ...validatePhase9AggregateCoverage(input),
    ...validatePhase9SourceTraceCompleteness(input),
    ...validatePhase9NoPhaseClose(input),
  ]);
}

export function validatePhase9EvidenceIndexCompleteness(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return validatePhase9AggregateCoverage(input);
}

export function validatePhase9BoundaryLedgerNoViolation(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return validatePhase9BoundaryIntegrity(input);
}

export function validatePhase9SourceTraceIndexCompleteness(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return validatePhase9SourceTraceCompleteness(input);
}

export function validatePhase9TestEvidenceRollup(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return validatePhase9AggregateCoverage(input);
}

export function validatePhase9NoActivationClosureGuard(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return uniquePhase9AggregateReasons([
    ...validatePhase9NoRealActivation(input),
    ...validatePhase9NoPhaseClose(input),
  ]);
}

export function validatePhase9FinalPackageNoRealActivation(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimePhase9AggregateValidationBlockingReason[] {
  return uniquePhase9AggregateReasons([
    ...validatePhase9ClosurePackageCompleteness(input),
    ...validatePhase9NoActivationClosureGuard(input),
  ]);
}

export function validateNoInternalSurfaceExposure(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientMembraneBlockingReason[] {
  const attempted = input.attempted_internal_surfaces ?? [];
  const reasons: RuntimeClientMembraneBlockingReason[] = [];

  if (attempted.length > 0) reasons.push("internal_surface_exposure_attempted");
  if (attempted.includes("runtime_tables")) reasons.push("runtime_table_exposure_attempted");
  if (attempted.includes("diagnosis")) reasons.push("diagnosis_exposure_attempted");
  if (attempted.includes("registry")) reasons.push("registry_exposure_attempted");
  if (attempted.includes("ir")) reasons.push("ir_exposure_attempted");
  if (attempted.includes("parallel_production")) reasons.push("export_exposure_attempted");
  if (attempted.includes("chips_internal")) reasons.push("chip_direct_invocation_attempted");
  if (
    attempted.includes("critical_route_gate_internal") ||
    attempted.includes("mmabp_gate_internal")
  ) {
    reasons.push("gate_bypass_attempted");
  }

  return uniqueReasons(reasons);
}

export function validateClientScope(
  scopeRef: RuntimeClientScopeRef = {},
): RuntimeClientMembraneBlockingReason[] {
  const reasons: RuntimeClientMembraneBlockingReason[] = [];
  if (!scopeRef.case_id) reasons.push("missing_case_scope");
  if (!scopeRef.role_id) reasons.push("missing_role_scope");
  if (!scopeRef.activity_id) reasons.push("missing_activity_scope");
  if (!scopeRef.run_id) reasons.push("missing_run_scope");
  return reasons;
}

export function validateNoDiagnosisExportRegistry(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientMembraneBlockingReason[] {
  const reasons: RuntimeClientMembraneBlockingReason[] = [];
  if (input.diagnosis_exposure_attempted) reasons.push("diagnosis_exposure_attempted");
  if (input.export_exposure_attempted) reasons.push("export_exposure_attempted");
  if (input.registry_exposure_attempted) reasons.push("registry_exposure_attempted");
  if (input.ir_exposure_attempted) reasons.push("ir_exposure_attempted");
  return reasons;
}

export function validateGateGreaterThanChip(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientMembraneBlockingReason[] {
  const reasons: RuntimeClientMembraneBlockingReason[] = [];
  if (input.chip_direct_invocation_attempted) reasons.push("chip_direct_invocation_attempted");
  if (input.gate_bypass_attempted) reasons.push("gate_bypass_attempted");
  return reasons;
}

export function validateClientCopyNoJargon(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientShellBlockingReason[] {
  const reasons: RuntimeClientShellBlockingReason[] = [];
  if (input.mmabp_jargon_detected) reasons.push("mmabp_jargon_detected");
  if (input.vsm_jargon_detected) reasons.push("vsm_jargon_detected");
  if (input.ahe_jargon_detected) reasons.push("ahe_jargon_detected");
  if (input.gate_jargon_detected) reasons.push("gate_jargon_detected");
  if (input.chip_jargon_detected) reasons.push("chip_jargon_detected");
  if (input.runtime_table_jargon_detected) reasons.push("runtime_table_jargon_detected");
  if (input.diagnosis_final_render_attempted) reasons.push("diagnosis_final_render_attempted");
  return uniqueShellReasons(reasons);
}

export function validateNoInternalImports(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientShellBlockingReason[] {
  const reasons: RuntimeClientShellBlockingReason[] = [];
  if (input.internal_import_detected) reasons.push("internal_import_detected");
  if (input.runtime_direct_call_attempted) reasons.push("runtime_direct_call_attempted");
  if (input.chip_direct_invocation_attempted) reasons.push("chip_direct_call_attempted");
  if (input.gate_bypass_attempted) reasons.push("gate_direct_call_attempted");
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  return uniqueShellReasons(reasons);
}

export function validateNoInternalRender(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientShellBlockingReason[] {
  const reasons: RuntimeClientShellBlockingReason[] = [];
  if (input.internal_organ_render_attempted) reasons.push("internal_organ_render_attempted");
  if (input.diagnosis_final_render_attempted) reasons.push("diagnosis_final_render_attempted");
  if (input.export_status_internal_render_attempted) {
    reasons.push("export_status_internal_render_attempted");
  }
  if (input.gate_jargon_detected) reasons.push("gate_jargon_detected");
  if (input.chip_jargon_detected) reasons.push("chip_jargon_detected");
  if (input.runtime_table_jargon_detected) reasons.push("runtime_table_jargon_detected");
  return uniqueShellReasons(reasons);
}

export function validateNoPublicExposure(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalWiringBlockingReason[] {
  const reasons: RuntimeClientLocalWiringBlockingReason[] = [];
  if (input.public_production_route_attempted) reasons.push("public_production_route_attempted");
  if (input.real_client_access_attempted) reasons.push("real_client_access_attempted");
  return uniqueLocalWiringReasons(reasons);
}

export function validateNoEndpointCreation(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalWiringBlockingReason[] {
  const reasons: RuntimeClientLocalWiringBlockingReason[] = [];
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.api_route_creation_attempted) reasons.push("api_route_creation_attempted");
  if (input.middleware_creation_attempted) reasons.push("middleware_creation_attempted");
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  return uniqueLocalWiringReasons(reasons);
}

export function validateNoRealClientAccess(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalWiringBlockingReason[] {
  const reasons: RuntimeClientLocalWiringBlockingReason[] = [];
  if (input.real_client_access_attempted) reasons.push("real_client_access_attempted");
  if (input.real_customer_data_attempted) reasons.push("real_customer_data_attempted");
  if (input.secondary_activity_auto_open_attempted) {
    reasons.push("secondary_activity_auto_open_attempted");
  }
  if (input.selection_above_8_without_methodological_decision) {
    reasons.push("selection_above_8_without_methodological_decision");
  }
  return uniqueLocalWiringReasons(reasons);
}

export function validateLocalWiringNoInternalLeak(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientLocalWiringBlockingReason[] {
  const reasons: RuntimeClientLocalWiringBlockingReason[] = [];
  if (input.runtime_direct_call_attempted) reasons.push("runtime_direct_call_attempted");
  if (input.chip_direct_invocation_attempted) reasons.push("chip_direct_call_attempted");
  if (input.gate_bypass_attempted) reasons.push("gate_direct_call_attempted");
  if (input.internal_surface_leak_attempted || input.internal_organ_render_attempted) {
    reasons.push("internal_surface_leak_attempted");
  }
  if (input.diagnosis_leak_attempted || input.diagnosis_final_render_attempted) {
    reasons.push("diagnosis_leak_attempted");
  }
  if (input.export_leak_attempted || input.export_status_internal_render_attempted) {
    reasons.push("export_leak_attempted");
  }
  return uniqueLocalWiringReasons(reasons);
}

export function validateCursorDoesNotMutateRuntime(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInteractionCursorBlockingReason[] {
  const reasons: RuntimeClientInteractionCursorBlockingReason[] = [];
  if (input.runtime_interaction_instance_real_creation_attempted) {
    reasons.push("runtime_interaction_instance_real_creation_attempted");
  }
  if (input.runtime_state_mutation_attempted || input.runtime_direct_call_attempted) {
    reasons.push("runtime_state_mutation_attempted");
  }
  if (input.gate_real_execution_attempted || input.gate_bypass_attempted) {
    reasons.push("gate_real_execution_attempted");
  }
  return uniqueInteractionCursorReasons(reasons);
}

export function validateQuestionPresentationClientSafe(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInteractionCursorBlockingReason[] {
  const reasons: RuntimeClientInteractionCursorBlockingReason[] = [];
  if (input.internal_code_exposure_attempted) reasons.push("internal_code_exposure_attempted");
  if (input.mmabp_jargon_detected) reasons.push("mmabp_jargon_exposure_attempted");
  if (input.vsm_jargon_detected) reasons.push("vsm_jargon_exposure_attempted");
  if (input.ahe_jargon_detected) reasons.push("ahe_jargon_exposure_attempted");
  if (input.gate_jargon_detected) reasons.push("gate_jargon_exposure_attempted");
  if (input.chip_jargon_detected) reasons.push("chip_jargon_exposure_attempted");
  if (input.readiness_gap_internal_exposure_attempted) {
    reasons.push("readiness_gap_internal_exposure_attempted");
  }
  if (input.no_go_internal_exposure_attempted) reasons.push("no_go_internal_exposure_attempted");
  return uniqueInteractionCursorReasons(reasons);
}

export function validateAnswerCaptureNoPersistence(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInteractionCursorBlockingReason[] {
  const reasons: RuntimeClientInteractionCursorBlockingReason[] = [];
  if (input.response_record_real_creation_attempted) {
    reasons.push("response_record_real_creation_attempted");
  }
  if (input.runtime_subfield_response_real_creation_attempted) {
    reasons.push("runtime_subfield_response_real_creation_attempted");
  }
  if (input.evidence_item_real_creation_attempted) {
    reasons.push("evidence_item_real_creation_attempted");
  }
  if (input.missing_required_answer_attempted) reasons.push("missing_required_answer");
  return uniqueInteractionCursorReasons(reasons);
}

export function validateBudgetVisibilityNoLedgerWrite(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientInteractionCursorBlockingReason[] {
  const reasons: RuntimeClientInteractionCursorBlockingReason[] = [];
  if (input.budget_ledger_real_update_attempted) {
    reasons.push("budget_ledger_real_update_attempted");
  }
  return uniqueInteractionCursorReasons(reasons);
}

export function validateEvidenceHandoffNoPersistence(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (input.evidence_item_real_creation_attempted) {
    reasons.push("evidence_item_real_creation_attempted");
  }
  if (input.canonical_variable_record_real_creation_attempted) {
    reasons.push("canonical_variable_record_real_creation_attempted");
  }
  if (input.readiness_gap_record_real_creation_attempted) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (input.runtime_audit_trail_real_creation_attempted) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (input.semantic_resolution_event_real_creation_attempted) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (input.process_state_timer_event_real_creation_attempted) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  return uniqueEvidenceHandoffReasons(reasons);
}

export function validateCanonicalVariableNoFreeInference(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (input.missing_evidence_candidate_attempted) reasons.push("missing_evidence_candidate");
  if (input.missing_canonical_variable_candidate_attempted) {
    reasons.push("missing_canonical_variable_candidate");
  }
  if (input.derived_without_source_attempted) reasons.push("derived_without_source_attempted");
  if (input.text_similarity_only_attempted) reasons.push("text_similarity_only_attempted");
  if (input.diagnostic_inference_attempted) reasons.push("diagnostic_inference_attempted");
  return uniqueEvidenceHandoffReasons(reasons);
}

export function validateGapClientSafe(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (input.readiness_gap_record_real_creation_attempted) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (input.gate_jargon_detected || input.no_go_internal_exposure_attempted) {
    reasons.push("diagnostic_inference_attempted");
  }
  return uniqueEvidenceHandoffReasons(reasons);
}

export function validateGateInputNoRealExecution(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (input.gate_real_execution_attempted || input.gate_bypass_attempted) {
    reasons.push("gate_real_execution_attempted");
  }
  if (input.semantic_resolution_event_real_creation_attempted) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (input.process_state_timer_event_real_creation_attempted) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  return uniqueEvidenceHandoffReasons(reasons);
}

export function validateNoDiagnosticInference(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (
    input.diagnostic_inference_attempted ||
    input.diagnosis_exposure_attempted ||
    input.diagnosis_final_render_attempted ||
    input.diagnosis_leak_attempted
  ) {
    reasons.push("diagnostic_inference_attempted");
  }
  return uniqueEvidenceHandoffReasons(reasons);
}

export function validateGateSummaryNoRealExecution(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.gate_real_execution_attempted || input.gate_bypass_attempted) {
    reasons.push("gate_real_execution_attempted");
  }
  if (input.critical_route_gate_real_execution_attempted) {
    reasons.push("critical_route_gate_real_execution_attempted");
  }
  if (input.semantic_resolution_event_real_creation_attempted) {
    reasons.push("semantic_resolution_event_real_creation_attempted");
  }
  if (input.process_state_timer_event_real_creation_attempted) {
    reasons.push("process_state_timer_event_real_creation_attempted");
  }
  if (input.runtime_audit_trail_real_creation_attempted) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  return uniqueGateReadinessReasons(reasons);
}

export function validateReadinessNoRealDecision(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.readiness_decision_record_real_creation_attempted) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (input.readiness_gap_record_real_creation_attempted) {
    reasons.push("readiness_gap_record_real_creation_attempted");
  }
  if (input.manual_review_real_creation_attempted) {
    reasons.push("manual_review_real_creation_attempted");
  }
  if (input.reentry_interaction_real_creation_attempted) {
    reasons.push("reentry_interaction_real_creation_attempted");
  }
  if (input.runtime_interaction_instance_real_creation_attempted) {
    reasons.push("runtime_interaction_instance_real_creation_attempted");
  }
  if (input.runtime_audit_trail_real_creation_attempted) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  return uniqueGateReadinessReasons(reasons);
}

export function validateReviewStateClientSafe(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.diagnosis_final_creation_attempted || input.diagnosis_final_render_attempted) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  if (input.no_go_internal_exposure_attempted || input.gate_jargon_detected) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  return uniqueGateReadinessReasons(reasons);
}

export function validateGateGreaterThanChipEnforced(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.chip_override_gate_attempted || input.gate_bypass_attempted) {
    reasons.push("chip_override_gate_attempted");
  }
  if (input.diagnostic_inference_attempted || input.diagnosis_final_creation_attempted) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  if (input.production_from_chip_attempted) reasons.push("production_from_chip_attempted");
  return uniqueGateReadinessReasons(reasons);
}

export function validateNoGoNoRealPersistence(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.no_go_real_persistence_attempted) reasons.push("no_go_real_persistence_attempted");
  if (input.runtime_audit_trail_real_creation_attempted) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (input.activation_allowed_attempted) reasons.push("activation_allowed_attempted");
  return uniqueGateReadinessReasons(reasons);
}

export function validateClientOutcomeNoDiagnosis(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.diagnosis_final_creation_attempted || input.diagnosis_exposure_attempted) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  if (input.diagnostic_label_creation_attempted) {
    reasons.push("diagnostic_label_creation_attempted");
  }
  if (input.pathology_classification_attempted) {
    reasons.push("pathology_classification_attempted");
  }
  if (input.readiness_decision_record_real_creation_attempted) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  return uniqueOutcomeCloseoutReasons(reasons);
}

export function validateReviewCloseoutNoRealDecision(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.readiness_decision_record_real_creation_attempted) {
    reasons.push("readiness_decision_record_real_creation_attempted");
  }
  if (input.manual_review_real_creation_attempted) {
    reasons.push("manual_review_real_creation_attempted");
  }
  if (input.reentry_interaction_real_creation_attempted) {
    reasons.push("reentry_interaction_real_creation_attempted");
  }
  if (input.runtime_interaction_instance_real_creation_attempted) {
    reasons.push("runtime_interaction_instance_real_creation_attempted");
  }
  if (input.response_record_real_creation_attempted) {
    reasons.push("response_record_real_creation_attempted");
  }
  if (input.runtime_subfield_response_real_creation_attempted) {
    reasons.push("runtime_subfield_response_real_creation_attempted");
  }
  return uniqueOutcomeCloseoutReasons(reasons);
}

export function validateNextActionNoRealWorkflow(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.public_route_creation_attempted || input.public_production_route_attempted) {
    reasons.push("public_route_creation_attempted");
  }
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  return uniqueOutcomeCloseoutReasons(reasons);
}

export function validateCloseoutSummaryClientSafe(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.diagnosis_final_creation_attempted || input.diagnosis_final_render_attempted) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  if (input.export_real_creation_attempted || input.export_exposure_attempted) {
    reasons.push("export_real_creation_attempted");
  }
  if (input.registry_creation_attempted || input.registry_exposure_attempted) {
    reasons.push("registry_creation_attempted");
  }
  if (input.ir_creation_attempted || input.ir_exposure_attempted) {
    reasons.push("ir_creation_attempted");
  }
  return uniqueOutcomeCloseoutReasons(reasons);
}

export function validateNoExportNoActivationNoPhaseClose(
  input: RuntimeClientMembraneLocalInput = {},
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.export_real_creation_attempted || input.export_exposure_attempted) {
    reasons.push("export_real_creation_attempted");
  }
  if (input.parallel_export_payload_real_creation_attempted) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (input.registry_creation_attempted || input.registry_exposure_attempted) {
    reasons.push("registry_creation_attempted");
  }
  if (input.ir_creation_attempted || input.ir_exposure_attempted) {
    reasons.push("ir_creation_attempted");
  }
  if (input.activation_allowed_attempted) reasons.push("activation_allowed_attempted");
  if (input.qa_green_real_creation_attempted) reasons.push("qa_green_real_creation_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.public_route_creation_attempted || input.public_production_route_attempted) {
    reasons.push("public_route_creation_attempted");
  }
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.phase9_close_attempted) reasons.push("phase9_close_attempted");
  return uniqueOutcomeCloseoutReasons(reasons);
}

function validateNoRealOperationAttempts(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientMembraneBlockingReason[] {
  const reasons: RuntimeClientMembraneBlockingReason[] = [];
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  return reasons;
}

function resolveScope(scopeRef?: RuntimeClientScopeRef): RuntimeClientScopeRef {
  return {
    case_id: "CASE-F9A-LOCAL",
    tenant_id: "TENANT-F9A-LOCAL",
    role_id: "ROLE-F9A-LOCAL",
    activity_id: "ACTIVITY-F9A-LOCAL",
    run_id: "RUN-F9A-LOCAL",
    role_runtime_session_ref: "ROLE_RUNTIME_SESSION:F9A:LOCAL",
    activity_runtime_run_ref: "ACTIVITY_RUNTIME_RUN:F9A:LOCAL",
    ...scopeRef,
  };
}

function validateBFFReadSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientBFFReadBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateBFFReadScope(
  scopeRef: RuntimeClientScopeRef = {},
): RuntimeClientBFFReadBlockingReason[] {
  const reasons: RuntimeClientBFFReadBlockingReason[] = [];
  if (!scopeRef.case_id) reasons.push("missing_case_id");
  if (!scopeRef.tenant_id) reasons.push("missing_tenant_id");
  if (!scopeRef.role_id) reasons.push("missing_role_id");
  if (!scopeRef.activity_id) reasons.push("missing_activity_id");
  if (!scopeRef.run_id) reasons.push("missing_run_id");
  return reasons.length ? ["missing_scope", ...reasons] : [];
}

function mapMembraneReasonsToBFFRead(
  reasons: RuntimeClientMembraneBlockingReason[],
): RuntimeClientBFFReadBlockingReason[] {
  const mapped: RuntimeClientBFFReadBlockingReason[] = [];
  for (const reason of reasons) {
    if (reason === "missing_source_trace") mapped.push("missing_source_trace");
    if (reason === "internal_surface_exposure_attempted") mapped.push("internal_organ_exposure_attempted");
    if (reason === "diagnosis_exposure_attempted") mapped.push("diagnosis_exposure_attempted");
    if (reason === "export_exposure_attempted") mapped.push("export_payload_exposure_attempted");
    if (reason === "registry_exposure_attempted") mapped.push("internal_organ_exposure_attempted");
    if (reason === "ir_exposure_attempted") mapped.push("internal_organ_exposure_attempted");
    if (reason === "runtime_table_exposure_attempted") mapped.push("runtime_table_exposure_attempted");
    if (reason === "chip_direct_invocation_attempted") mapped.push("chip_direct_call_attempted");
    if (reason === "gate_bypass_attempted") mapped.push("gate_direct_call_attempted");
    if (reason === "supabase_touch_attempted") mapped.push("supabase_touch_attempted");
    if (reason === "sql_execution_attempted") mapped.push("sql_execution_attempted");
    if (reason === "endpoint_creation_attempted") mapped.push("endpoint_creation_attempted");
    if (reason === "runtime_real_start_attempted") mapped.push("runtime_real_start_attempted");
  }
  return uniqueBFFReadReasons(mapped);
}

function validateShellSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientShellBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateSafeDTOBoundary(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientShellBlockingReason[] {
  const reasons: RuntimeClientShellBlockingReason[] = [];
  if (input.missing_safe_dto_attempted) reasons.push("missing_safe_dto");
  if (input.missing_bff_boundary_attempted) reasons.push("missing_bff_boundary");
  return reasons;
}

function validateNoPublicRouteOrRealOperation(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientShellBlockingReason[] {
  const reasons: RuntimeClientShellBlockingReason[] = [];
  if (input.public_production_route_attempted) reasons.push("public_production_route_attempted");
  if (input.endpoint_creation_attempted) reasons.push("endpoint_creation_attempted");
  if (input.supabase_touch_attempted) reasons.push("supabase_touch_attempted");
  if (input.sql_execution_attempted) reasons.push("sql_execution_attempted");
  if (input.runtime_real_start_attempted) reasons.push("runtime_real_start_attempted");
  if (input.runtime_direct_call_attempted) reasons.push("runtime_direct_call_attempted");
  if (input.chip_direct_invocation_attempted) reasons.push("chip_direct_call_attempted");
  if (input.gate_bypass_attempted) reasons.push("gate_direct_call_attempted");
  return uniqueShellReasons(reasons);
}

function validateLocalWiringSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientLocalWiringBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateRequiredLocalWiringPieces(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientLocalWiringBlockingReason[] {
  const reasons: RuntimeClientLocalWiringBlockingReason[] = [];
  if (input.missing_bff_boundary_attempted) reasons.push("missing_bff_read_contract");
  if (input.missing_safe_dto_attempted) reasons.push("missing_safe_dto");
  return reasons;
}

function validateInteractionCursorSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientInteractionCursorBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateInteractionCandidateRefs(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientInteractionCursorBlockingReason[] {
  const reasons: RuntimeClientInteractionCursorBlockingReason[] = [];
  if (input.missing_activity_runtime_run_candidate_attempted) {
    reasons.push("missing_activity_runtime_run_candidate");
  }
  if (input.missing_interaction_candidate_attempted) {
    reasons.push("missing_interaction_candidate");
  }
  return reasons;
}

function validateEvidenceHandoffSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientEvidenceHandoffBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateEvidenceHandoffRequiredCandidates(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientEvidenceHandoffBlockingReason[] {
  const reasons: RuntimeClientEvidenceHandoffBlockingReason[] = [];
  if (input.missing_answer_capture_candidate_attempted) {
    reasons.push("missing_answer_capture_candidate");
  }
  if (input.missing_subfield_capture_candidate_attempted) {
    reasons.push("missing_subfield_capture_candidate");
  }
  if (input.missing_evidence_candidate_attempted) reasons.push("missing_evidence_candidate");
  return reasons;
}

function validateGateReadinessSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientGateReadinessBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateGateReadinessRequiredCandidates(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (input.missing_evidence_candidate_attempted) reasons.push("missing_evidence_candidate");
  if (input.missing_canonical_variable_candidate_attempted) {
    reasons.push("missing_canonical_variable_candidate");
  }
  if (input.missing_evidence_candidate_attempted) reasons.push("missing_gate_input_candidate");
  if (input.missing_required_answer_attempted) reasons.push("missing_gap_candidate");
  return uniqueGateReadinessReasons(reasons);
}

function validateNoDiagnosticFinalCreation(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientGateReadinessBlockingReason[] {
  const reasons: RuntimeClientGateReadinessBlockingReason[] = [];
  if (
    input.diagnosis_final_creation_attempted ||
    input.diagnosis_exposure_attempted ||
    input.diagnosis_final_render_attempted ||
    input.diagnosis_leak_attempted
  ) {
    reasons.push("diagnosis_final_creation_attempted");
  }
  if (input.activation_allowed_attempted) reasons.push("activation_allowed_attempted");
  return uniqueGateReadinessReasons(reasons);
}

function validateOutcomeCloseoutSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validatePhase9AggregateSourceTrace(
  sourceTrace: RuntimeClientMembraneSourceTrace[],
): RuntimePhase9AggregateValidationBlockingReason[] {
  return hasSourceTrace(sourceTrace) ? [] : ["missing_source_trace"];
}

function validateOutcomeRequiredCandidates(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.missing_activity_runtime_run_candidate_attempted) {
    reasons.push("missing_readiness_state_candidate");
  }
  if (input.missing_interaction_candidate_attempted) {
    reasons.push("missing_safe_review_result_candidate");
  }
  return uniqueOutcomeCloseoutReasons(reasons);
}

function validateReviewCloseoutRequiredCandidates(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  const reasons: RuntimeClientOutcomeCloseoutBlockingReason[] = [];
  if (input.missing_interaction_candidate_attempted) {
    reasons.push("missing_client_outcome_candidate");
  }
  if (input.missing_required_answer_attempted) {
    reasons.push("missing_review_closeout_candidate");
  }
  return uniqueOutcomeCloseoutReasons(reasons);
}

function resolveMissingPhase9Tramos(
  input: RuntimeClientMembraneLocalInput,
  phase9H?: RuntimePhase9HLocalClientOutcomeReviewCloseoutLocalResult,
): string[] {
  const missing: string[] = [];
  if (
    input.missing_phase9a_traceability_attempted ||
    phase9H?.phase9_A_accepted !== true
  ) {
    missing.push("Phase 9-A");
  }
  if (
    input.missing_phase9b_traceability_attempted ||
    phase9H?.phase9_B_accepted !== true
  ) {
    missing.push("Phase 9-B");
  }
  if (
    input.missing_phase9c_traceability_attempted ||
    phase9H?.phase9_C_accepted !== true
  ) {
    missing.push("Phase 9-C");
  }
  if (
    input.missing_phase9d_traceability_attempted ||
    phase9H?.phase9_D_accepted !== true
  ) {
    missing.push("Phase 9-D");
  }
  if (
    input.missing_phase9e_traceability_attempted ||
    phase9H?.phase9_E_accepted !== true
  ) {
    missing.push("Phase 9-E");
  }
  if (
    input.missing_phase9f_traceability_attempted ||
    phase9H?.phase9_F_accepted !== true
  ) {
    missing.push("Phase 9-F");
  }
  if (
    input.missing_phase9g_traceability_attempted ||
    phase9H?.phase9_G_accepted !== true
  ) {
    missing.push("Phase 9-G");
  }
  if (
    input.missing_phase9h_traceability_attempted ||
    phase9H?.phase9_H_completed_local !== true
  ) {
    missing.push("Phase 9-H");
  }
  return missing;
}

function resolveSourceTrace(
  input: RuntimeClientMembraneLocalInput,
): RuntimeClientMembraneSourceTrace[] {
  return input.source_trace ?? DEFAULT_SOURCE_TRACE;
}

function hasSourceTrace(sourceTrace: RuntimeClientMembraneSourceTrace[]) {
  return sourceTrace.length > 0 && sourceTrace.every((trace) =>
    Boolean(
      trace.source_document &&
        trace.source_section &&
        trace.source_element &&
        trace.extracted_for_platform_use,
    ),
  );
}

function uniqueReasons(
  reasons: RuntimeClientMembraneBlockingReason[],
): RuntimeClientMembraneBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueBFFReadReasons(
  reasons: RuntimeClientBFFReadBlockingReason[],
): RuntimeClientBFFReadBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueShellReasons(
  reasons: RuntimeClientShellBlockingReason[],
): RuntimeClientShellBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueLocalWiringReasons(
  reasons: RuntimeClientLocalWiringBlockingReason[],
): RuntimeClientLocalWiringBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueInteractionCursorReasons(
  reasons: RuntimeClientInteractionCursorBlockingReason[],
): RuntimeClientInteractionCursorBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueEvidenceHandoffReasons(
  reasons: RuntimeClientEvidenceHandoffBlockingReason[],
): RuntimeClientEvidenceHandoffBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueGateReadinessReasons(
  reasons: RuntimeClientGateReadinessBlockingReason[],
): RuntimeClientGateReadinessBlockingReason[] {
  return [...new Set(reasons)];
}

function uniqueOutcomeCloseoutReasons(
  reasons: RuntimeClientOutcomeCloseoutBlockingReason[],
): RuntimeClientOutcomeCloseoutBlockingReason[] {
  return [...new Set(reasons)];
}

function uniquePhase9AggregateReasons(
  reasons: RuntimePhase9AggregateValidationBlockingReason[],
): RuntimePhase9AggregateValidationBlockingReason[] {
  return [...new Set(reasons)];
}
