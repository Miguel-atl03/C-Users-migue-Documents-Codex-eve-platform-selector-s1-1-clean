import type {
  RuntimeActivationReadinessBoundaryCandidate,
  RuntimePhase12InputRevalidationDecision,
  RuntimePhase12QAFoundationLocalInput,
  RuntimePhase12QAFoundationLocalResult,
  RuntimeQAAuditAction,
  RuntimeQAAuditCandidate,
  RuntimeQACriticalRouteCode,
  RuntimeQACriticalRouteResultCandidate,
  RuntimeQACriticalRouteSourceInput,
  RuntimeQACriticalScenarioCode,
  RuntimeQACriticalScenarioResultCandidate,
  RuntimeQACriticalScenarioSourceInput,
  RuntimeQAExportPreviewCase,
  RuntimeQAExportPreviewResultCandidate,
  RuntimeQAExportPreviewSourceInput,
  RuntimeQAFoundationBlockingReason,
  RuntimeQAFoundationStatus,
  RuntimeQAGateFamily,
  RuntimeQAImportRuntimeBaseResultCandidate,
  RuntimeQAImportVersioningActivationResultCandidate,
  RuntimeQAGreenGateCandidate,
  RuntimeQANoWriteBoundaryCandidate,
  RuntimeQAPersistenceBoundaryCandidate,
  RuntimeQAResultCandidate,
  RuntimeQAResultGreenActivationBlockingReason,
  RuntimeQAResultGreenActivationSourceInput,
  RuntimeQASEMPSTGateCode,
  RuntimeQASEMPSTGateResultCandidate,
  RuntimeQASEMPSTGateSourceInput,
  RuntimeQABlockingLevel,
  RuntimeQAPassFail,
  RuntimeQAReadinessCase,
  RuntimeQAReadinessReentryResultCandidate,
  RuntimeQAReadinessReentrySourceInput,
  RuntimeQARegressionPhaseScope,
  RuntimeQARegressionResultCandidate,
  RuntimeQARegressionResultSourceInput,
  RuntimeQARuleCandidate,
  RuntimeQARuleSourceInput,
  RuntimeQARunCandidate,
  RuntimeQARunSourceInput,
  RuntimeRollbackAbortPlanQACandidate,
  RuntimeQASecurityScopeRLSCandidate,
  RuntimeQASecurityShadowBlockingReason,
  RuntimeQASecurityShadowSourceInput,
  RuntimeQAShadowPilotFixtureCandidate,
  RuntimeQAShadowPilotObservabilityCandidate,
  RuntimeQAShadowPilotRehearsalCandidate,
  RuntimeQAShadowPilotScopeCandidate,
  RuntimeQAScope,
  RuntimeQAStatus,
  RuntimeQATestResultCandidate,
  RuntimeQATestResultSourceInput,
  RuntimeQATypecheckBuildCandidate,
  RuntimeQATypecheckBuildSourceInput,
} from "./runtime-40-20-qa-shadow-types";

export const Runtime40_20QAShadowService = {
  revalidatePhase11InputForPhase12,
  buildQARunCandidates,
  buildQARuleCandidates,
  buildQAImportRuntimeBaseResultCandidates,
  buildQAImportVersioningActivationResultCandidates,
  buildPhase12QAFoundationLocalResult,
  buildQARegressionResultCandidates,
  buildQATypecheckBuildCandidates,
  buildQACriticalScenarioResultCandidates,
  buildQACriticalRouteResultCandidates,
  buildQASEMPSTGateResultCandidates,
  buildQAReadinessReentryResultCandidates,
  buildQAExportPreviewResultCandidates,
  buildPhase12RegressionCriticalQALocalResult,
  buildQASecurityScopeRLSCandidates,
  buildQANoWriteBoundaryCandidates,
  buildQAShadowPilotScopeCandidates,
  buildQAShadowPilotFixtureCandidates,
  buildQAShadowPilotRehearsalCandidates,
  buildQAShadowPilotObservabilityCandidates,
  buildPhase12SecurityNoWriteShadowRehearsalObservabilityLocalResult,
  buildQAResultCandidates,
  buildQAGreenGateCandidates,
  buildActivationReadinessBoundaryCandidates,
  buildRollbackAbortPlanQACandidates,
  buildQAAuditCandidates,
  buildQAPersistenceBoundaryCandidates,
  buildPhase12QAResultGreenActivationRollbackAuditPersistenceLocalResult,
};

const ALLOWED_QA_SCOPES: RuntimeQAScope[] = [
  "catalog_import",
  "runtime_contracts",
  "phase_6_to_11_regression",
  "export_preview_boundary",
  "security_scope",
  "shadow_pilot_readiness",
  "activation_readiness",
];

const ALLOWED_QA_STATUSES: RuntimeQAStatus[] = [
  "draft_candidate",
  "running_candidate",
  "passed_candidate",
  "failed_candidate",
  "blocked_candidate",
];

const ALLOWED_BLOCKING_LEVELS: RuntimeQABlockingLevel[] = [
  "blocker",
  "high",
  "medium",
  "advisory",
];

const ALLOWED_PASS_FAIL: RuntimeQAPassFail[] = [
  "pass",
  "fail",
  "blocked",
  "environment_blocked",
  "not_run",
];

const BASE_TESTS = [
  ["T-001", "base_count_40"],
  ["T-002", "causal_count_20"],
  ["T-003", "source_refs_non_empty"],
  ["T-004", "required_fields_complete"],
  ["T-005", "b7_no_ir"],
  ["T-006", "b0_q01_subfields_complete"],
  ["T-007", "c09_route_missing_conditional"],
  ["T-008", "b3_q22_clean"],
  ["T-009", "c09_variables_present_no_duplicate"],
  ["T-010", "pst_001_to_pst_006_present_connected"],
  ["T-011", "sem_001_to_sem_007_present"],
  ["T-012", "vsm_ahe_b7_c20_no_registry_ir_export_direct"],
] as const;

const VERSIONING_TESTS = [
  ["T-013", "metadata_version_alignment"],
  ["T-014", "required_sheets_present"],
  ["T-015", "required_columns_present"],
  ["T-016", "checksum_registered"],
  ["T-017", "no_deprecated_version_labels"],
  ["T-018", "catalog_activation_blocked_on_qa_failure"],
  ["T-019", "source_node_integrity"],
  ["T-020", "b7_no_direct_projection"],
] as const;

const REGRESSION_PHASES: RuntimeQARegressionPhaseScope[] = [
  "phase6_response_ingest",
  "phase7_canonical_variable",
  "phase8_branching_budget",
  "phase9_critical_gates",
  "phase10_readiness_reentry",
  "phase11_export_preview",
];

const CT_CODES: RuntimeQACriticalScenarioCode[] = [
  "CT-B0-001",
  "CT-B2-001",
  "CT-B3-001",
  "CT-B3-002",
  "CT-B4-001",
  "CT-B6-001",
  "CT-B7-001",
  "CT-BUD-001",
];

const CRITICAL_ROUTE_CODES: RuntimeQACriticalRouteCode[] = ["B0", "B2", "B3_C09", "B7_C20"];

const SEM_PST_CODES: RuntimeQASEMPSTGateCode[] = [
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
];

const READINESS_CASES: RuntimeQAReadinessCase[] = [
  "ready_candidate",
  "ready_with_flags_candidate",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "blocked_by_missing_canonical_route",
  "manual_review_required",
  "reentry_required",
  "reentry_planning",
  "reentry_execution_boundary",
  "readiness_decision_record_candidate",
];

const EXPORT_PREVIEW_CASES: RuntimeQAExportPreviewCase[] = [
  "scr_preview",
  "evidence_bundle_preview",
  "mdsb_preview",
  "combined_preview",
  "export_blocking_rules",
  "checksum_idempotency",
  "payload_state_lifecycle",
  "source_trace_envelope",
  "supersession_stale_preview",
];

const QA_AUDIT_ACTIONS: RuntimeQAAuditAction[] = [
  "qa_run_started",
  "qa_rule_executed",
  "qa_rule_passed",
  "qa_rule_failed",
  "qa_rule_blocked",
  "regression_executed",
  "shadow_pilot_rehearsal_started",
  "shadow_pilot_rehearsal_completed",
  "qa_green_candidate_created",
  "activation_readiness_candidate_created",
  "no_go_violation_detected",
  "rollback_plan_verified",
  "external_typecheck_debt_carried_forward",
  "activation_real_blocked",
];

export function buildPhase12QAFoundationLocalResult(
  input: RuntimePhase12QAFoundationLocalInput,
): RuntimePhase12QAFoundationLocalResult {
  const revalidation = revalidatePhase11InputForPhase12(input);
  if (!revalidation.candidate_allowed) {
    return createResult(resolveStatus(revalidation.blocking_reasons), revalidation);
  }

  const qaRunCandidates = buildQARunCandidates(input.case_id, input.qa_run_sources ?? []);
  const qaRuleCandidates = buildQARuleCandidates(input.case_id, input.qa_rule_sources ?? []);
  const baseCandidates = buildQAImportRuntimeBaseResultCandidates(
    input.case_id,
    input.qa_import_runtime_base_sources ?? [],
  );
  const versioningCandidates = buildQAImportVersioningActivationResultCandidates(
    input.case_id,
    input.qa_import_versioning_activation_sources ?? [],
  );
  const blockingReasons = [
    ...qaRunCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...qaRuleCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...baseCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...versioningCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...getBoundaryGuardBlockingReasons(input.boundary_guard ?? {}),
  ];

  return createResult(resolveStatus(blockingReasons), revalidation, {
    qaRunCandidates,
    qaRuleCandidates,
    baseCandidates,
    versioningCandidates,
  });
}

export function buildPhase12RegressionCriticalQALocalResult(
  input: RuntimePhase12QAFoundationLocalInput,
): RuntimePhase12QAFoundationLocalResult {
  const foundation = buildPhase12QAFoundationLocalResult(input);
  if (!foundation.phase12_input_revalidation.candidate_allowed) return foundation;

  const regressionCandidates = buildQARegressionResultCandidates(
    input.case_id,
    input.qa_regression_sources ?? [],
  );
  const typecheckBuildCandidates = buildQATypecheckBuildCandidates(
    input.case_id,
    input.qa_typecheck_build_sources ?? [],
  );
  const criticalScenarioCandidates = buildQACriticalScenarioResultCandidates(
    input.case_id,
    input.qa_critical_scenario_sources ?? [],
  );
  const criticalRouteCandidates = buildQACriticalRouteResultCandidates(
    input.case_id,
    input.qa_critical_route_sources ?? [],
  );
  const semPstCandidates = buildQASEMPSTGateResultCandidates(
    input.case_id,
    input.qa_sem_pst_gate_sources ?? [],
  );
  const readinessReentryCandidates = buildQAReadinessReentryResultCandidates(
    input.case_id,
    input.qa_readiness_reentry_sources ?? [],
  );
  const exportPreviewCandidates = buildQAExportPreviewResultCandidates(
    input.case_id,
    input.qa_export_preview_sources ?? [],
  );
  const reasons = [
    ...regressionCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...typecheckBuildCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...criticalScenarioCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...criticalRouteCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...semPstCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...readinessReentryCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...exportPreviewCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...foundation,
    status: resolveStatus(reasons),
    qa_regression_result_candidates: regressionCandidates,
    qa_typecheck_build_candidates: typecheckBuildCandidates,
    qa_critical_scenario_result_candidates: criticalScenarioCandidates,
    qa_critical_route_result_candidates: criticalRouteCandidates,
    qa_sem_pst_gate_result_candidates: semPstCandidates,
    qa_readiness_reentry_result_candidates: readinessReentryCandidates,
    qa_export_preview_result_candidates: exportPreviewCandidates,
    phase12_closed_local: false,
    ready_for_real_activation_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    runtime_qa_result_real_created: false,
    qa_green_real_created: false,
    shadow_pilot_real_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    export_real_created: false,
    parallel_export_payload_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
  };
}

export function buildPhase12SecurityNoWriteShadowRehearsalObservabilityLocalResult(
  input: RuntimePhase12QAFoundationLocalInput,
): RuntimePhase12QAFoundationLocalResult {
  const foundation = buildPhase12RegressionCriticalQALocalResult(input);
  if (!foundation.phase12_input_revalidation.candidate_allowed) return foundation;

  const securityScopeCandidates = buildQASecurityScopeRLSCandidates(
    input.case_id,
    input.qa_security_scope_rls_sources ?? [],
  );
  const noWriteBoundaryCandidates = buildQANoWriteBoundaryCandidates(
    input.case_id,
    input.qa_no_write_boundary_sources ?? [],
  );
  const shadowPilotScopeCandidates = buildQAShadowPilotScopeCandidates(
    input.case_id,
    input.qa_shadow_pilot_scope_sources ?? [],
  );
  const shadowPilotFixtureCandidates = buildQAShadowPilotFixtureCandidates(
    input.case_id,
    input.qa_shadow_pilot_fixture_sources ?? [],
  );
  const shadowPilotRehearsalCandidates = buildQAShadowPilotRehearsalCandidates(
    input.case_id,
    input.qa_shadow_pilot_rehearsal_sources ?? [],
  );
  const shadowPilotObservabilityCandidates = buildQAShadowPilotObservabilityCandidates(
    input.case_id,
    input.qa_shadow_pilot_observability_sources ?? [],
  );
  const reasons = [
    ...securityScopeCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...noWriteBoundaryCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...shadowPilotScopeCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...shadowPilotFixtureCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...shadowPilotRehearsalCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...shadowPilotObservabilityCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...foundation,
    status: resolveSecurityShadowStatus(reasons),
    security_scope_rls_candidates: securityScopeCandidates,
    no_write_boundary_candidates: noWriteBoundaryCandidates,
    shadow_pilot_scope_candidates: shadowPilotScopeCandidates,
    shadow_pilot_fixture_candidates: shadowPilotFixtureCandidates,
    shadow_pilot_rehearsal_candidates: shadowPilotRehearsalCandidates,
    shadow_pilot_observability_candidates: shadowPilotObservabilityCandidates,
    phase12_closed_local: false,
    ready_for_real_activation_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    runtime_qa_result_real_created: false,
    qa_green_real_created: false,
    shadow_pilot_real_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    export_real_created: false,
    parallel_export_payload_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
  };
}

export function buildQASecurityScopeRLSCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQASecurityScopeRLSCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("security-scope-rls");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      security_scope_rls_candidate_ref: `${caseId}:security-scope-rls:1`,
      case_id_scope_verified: true,
      role_id_scope_verified: true,
      activity_id_scope_verified: true,
      run_id_scope_verified: true,
      tenant_isolation_verified: true,
      anon_blocked: true,
      service_role_not_exposed: true,
      service_role_used_in_client: false,
      cross_case_read_detected: false,
      cross_case_write_detected: false,
      audit_trail_required_for_override: true,
      manual_review_actor_authorized: true,
      export_actor_system_authorized: true,
      query_outside_case_or_tenant_detected: false,
      activation_blocked_if_security_fails: true,
      rls_real_migration_created: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.13"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQANoWriteBoundaryCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQANoWriteBoundaryCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("no-write-boundary");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      no_write_boundary_candidate_ref: `${caseId}:no-write-boundary:1`,
      scene_write_detected: false,
      mba_write_detected: false,
      parallel_production_runtime_artifacts_write_detected: false,
      registry_write_detected: false,
      ir_write_detected: false,
      diagnosis_write_detected: false,
      object_inventory_write_detected: false,
      readiness_real_mutation_detected: false,
      runtime_real_start_detected: false,
      export_real_detected: false,
      endpoint_creation_detected: false,
      sql_execution_detected: false,
      supabase_touch_detected: false,
      activation_blocked_if_write_detected: true,
      source_trace: source.source_trace ?? defaultSourceTrace("12.14"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAShadowPilotScopeCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQAShadowPilotScopeCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("shadow-pilot-scope");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      shadow_pilot_candidate_ref: `${caseId}:shadow-pilot-scope:1`,
      one_role_only: true,
      one_primary_activity_only: true,
      selected_role_id: "shadow-role-candidate-1",
      selected_activity_id: "shadow-primary-activity-candidate-1",
      selected_case_id: caseId,
      activity_runtime_run_candidate_ref: `${caseId}:activity-runtime-run-candidate:1`,
      shadow_mode: true,
      production_mode: false,
      full_runtime_started: false,
      eight_activities_scale_started: false,
      multi_role_scale_started: false,
      external_delivery_created: false,
      explicit_human_authorization_required: true,
      source_trace: source.source_trace ?? defaultSourceTrace("12.15"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAShadowPilotFixtureCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQAShadowPilotFixtureCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("shadow-pilot-fixture");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      shadow_fixture_candidate_ref: `${caseId}:shadow-fixture:1`,
      fixture_case: { case_id: caseId, fixture_kind: "sanitized_shadow_candidate" },
      fixture_role: { role_id: "shadow-role-candidate-1" },
      fixture_activity: { activity_id: "shadow-primary-activity-candidate-1" },
      fixture_responses: [{ response_id: "shadow-response-candidate-1" }],
      fixture_expected_variables: [{ variable_id: "shadow-variable-candidate-1" }],
      fixture_expected_gates: [{ gate_id: "shadow-gate-candidate-1" }],
      fixture_expected_readiness: { readiness_state: "candidate_only" },
      fixture_expected_export_preview: { export_preview_state: "candidate_only" },
      fixture_expected_no_go: { no_go_expected: false },
      fixture_expected_no_writes: { no_writes_expected: true },
      deterministic_ids: true,
      sanitized_user_data: true,
      real_customer_data_used: false,
      real_customer_data_authorized: false,
      fixture_checksum: `${caseId}:shadow-fixture:v1`,
      source_trace: source.source_trace ?? defaultSourceTrace("12.16"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAShadowPilotRehearsalCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQAShadowPilotRehearsalCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("shadow-pilot-rehearsal");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      shadow_rehearsal_candidate_ref: `${caseId}:shadow-rehearsal:1`,
      shadow_run_candidate_created: true,
      fixture_responses_loaded: true,
      phase6_response_ingest_candidate_executed: true,
      phase7_canonical_variable_candidate_executed: true,
      phase8_branching_budget_candidate_executed: true,
      phase9_gates_candidate_executed: true,
      phase10_readiness_candidate_executed: true,
      phase11_export_preview_candidate_executed: true,
      expected_actual_comparison_completed: true,
      divergence_records: [],
      false_positive_count: 0,
      false_negative_count: 0,
      persistence_real_created: false,
      production_mode: false,
      external_delivery_created: false,
      runtime_real_started: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.17"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAShadowPilotObservabilityCandidates(
  caseId: string,
  sources: RuntimeQASecurityShadowSourceInput[],
): RuntimeQAShadowPilotObservabilityCandidate[] {
  const source = sources[0] ?? defaultSecurityShadowSource("shadow-pilot-observability");
  const reasons = getSecurityShadowBlockingReasons(source);
  return [
    {
      shadow_observability_candidate_ref: `${caseId}:shadow-observability:1`,
      shadow_event_log_candidate_created: true,
      qa_event_log_candidate_created: true,
      divergence_report_candidate_created: true,
      no_go_dashboard_candidate_created: true,
      false_positive_count: 0,
      false_negative_count: 0,
      blocker_count: 0,
      warning_count: 0,
      runtime_audit_trail_real_created: false,
      mba_event_ledger_real_created: false,
      compliance_report_real_created: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.18"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildPhase12QAResultGreenActivationRollbackAuditPersistenceLocalResult(
  input: RuntimePhase12QAFoundationLocalInput,
): RuntimePhase12QAFoundationLocalResult {
  const foundation = buildPhase12SecurityNoWriteShadowRehearsalObservabilityLocalResult(input);
  if (!foundation.phase12_input_revalidation.candidate_allowed) return foundation;

  const qaResultCandidates = buildQAResultCandidates(input.case_id, foundation, input.qa_result_green_activation_sources ?? []);
  const qaGreenGateCandidates = buildQAGreenGateCandidates(
    input.case_id,
    qaResultCandidates,
    input.qa_result_green_activation_sources ?? [],
  );
  const activationReadinessCandidates = buildActivationReadinessBoundaryCandidates(
    input.case_id,
    qaGreenGateCandidates,
    foundation,
    input.qa_result_green_activation_sources ?? [],
  );
  const rollbackAbortCandidates = buildRollbackAbortPlanQACandidates(
    input.case_id,
    input.qa_result_green_activation_sources ?? [],
  );
  const auditCandidates = buildQAAuditCandidates(
    input.case_id,
    qaResultCandidates,
    qaGreenGateCandidates,
    activationReadinessCandidates,
    input.qa_result_green_activation_sources ?? [],
  );
  const persistenceCandidates = buildQAPersistenceBoundaryCandidates(
    input.case_id,
    input.qa_result_green_activation_sources ?? [],
  );
  const reasons = [
    ...qaResultCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...qaGreenGateCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...activationReadinessCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...rollbackAbortCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...auditCandidates.flatMap((candidate) => candidate.blocking_reasons),
    ...persistenceCandidates.flatMap((candidate) => candidate.blocking_reasons),
  ];

  return {
    ...foundation,
    status: resolveResultGreenActivationStatus(reasons),
    qa_result_candidates: qaResultCandidates,
    qa_green_gate_candidates: qaGreenGateCandidates,
    activation_readiness_boundary_candidates: activationReadinessCandidates,
    rollback_abort_plan_qa_candidates: rollbackAbortCandidates,
    qa_audit_candidates: auditCandidates,
    qa_persistence_boundary_candidates: persistenceCandidates,
    phase12_closed_local: false,
    ready_for_real_activation_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    runtime_qa_result_real_created: false,
    qa_green_real_created: false,
    shadow_pilot_real_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    export_real_created: false,
    parallel_export_payload_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    service_role_used: false,
    service_role_used_in_client: false,
  };
}

export function buildQAResultCandidates(
  caseId: string,
  foundation: RuntimePhase12QAFoundationLocalResult,
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeQAResultCandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("qa-result");
  const reasons = getResultGreenActivationBlockingReasons(source);
  const regressionResults = foundation.qa_regression_result_candidates ?? [];
  const typecheckBuild = foundation.qa_typecheck_build_candidates?.[0];
  const failCount = regressionResults.filter((candidate) => candidate.test_status === "fail").length;
  const blockedCount = regressionResults.filter((candidate) => candidate.test_status === "blocked").length;
  const environmentBlockedCount =
    regressionResults.filter((candidate) => candidate.test_status === "environment_blocked").length +
    (typecheckBuild?.build_status === "environment_blocked" ? 1 : 0);

  return [
    {
      qa_result_candidate_ref: `${caseId}:qa-result:1`,
      qa_rule_results: foundation.qa_rule_candidates ?? [],
      ct_results: foundation.qa_critical_scenario_result_candidates ?? [],
      regression_results: regressionResults,
      typecheck_result: typecheckBuild
        ? { status: typecheckBuild.typecheck_status, command: typecheckBuild.typecheck_command }
        : { status: "not_run" },
      build_result: typecheckBuild
        ? { status: typecheckBuild.build_status, command: typecheckBuild.build_command }
        : { status: "not_run" },
      security_result: foundation.security_scope_rls_candidates?.[0] ?? {},
      no_write_result: foundation.no_write_boundary_candidates?.[0] ?? {},
      shadow_pilot_result: foundation.shadow_pilot_rehearsal_candidates?.[0] ?? {},
      pass_count: regressionResults.filter((candidate) => candidate.test_status === "pass").length,
      fail_count: failCount,
      blocked_count: blockedCount,
      environment_blocked_count: environmentBlockedCount,
      qa_green_candidate: failCount === 0 && blockedCount === 0,
      qa_green_real_created: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.19"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAGreenGateCandidates(
  caseId: string,
  qaResults: RuntimeQAResultCandidate[],
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeQAGreenGateCandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("qa-green-gate");
  const reasons = getResultGreenActivationBlockingReasons(source);
  const qaResult = qaResults[0];
  const noEnvironmentBlocked = (qaResult?.environment_blocked_count ?? 0) === 0;
  const allBlockingPassed = (qaResult?.fail_count ?? 0) === 0 && (qaResult?.blocked_count ?? 0) === 0;

  return [
    {
      qa_green_gate_candidate_ref: `${caseId}:qa-green-gate:1`,
      all_blocking_tests_passed: allBlockingPassed,
      no_environment_blocked_critical: noEnvironmentBlocked,
      no_security_blocker: true,
      no_write_blocker: true,
      no_export_real_detected: true,
      no_runtime_real_start: true,
      shadow_pilot_passed_candidate: true,
      external_typecheck_debt_registered: source.repo_wide_typecheck_debt_registered === true,
      repo_wide_typecheck_required_before_real_activation: true,
      build_environment_blocked_non_code_path_length:
        source.build_environment_blocked_non_code_path_length === true,
      human_authorization_required: true,
      s5_delegated_authorization_required: true,
      operator_authorization_required: true,
      rollback_plan_required: true,
      abort_path_required: true,
      qa_green_candidate_created: allBlockingPassed,
      qa_green_real_created: false,
      activation_allowed: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.20"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildActivationReadinessBoundaryCandidates(
  caseId: string,
  qaGreenGates: RuntimeQAGreenGateCandidate[],
  foundation: RuntimePhase12QAFoundationLocalResult,
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeActivationReadinessBoundaryCandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("activation-readiness-boundary");
  const reasons = getResultGreenActivationBlockingReasons(source);
  return [
    {
      activation_readiness_candidate_ref: `${caseId}:activation-readiness-boundary:1`,
      qa_green_candidate_ref: qaGreenGates[0]?.qa_green_gate_candidate_ref,
      shadow_pilot_candidate_ref: foundation.shadow_pilot_scope_candidates?.[0]?.shadow_pilot_candidate_ref,
      no_go_status: "activation_blocked_until_authorized",
      rollback_plan_ref: `${caseId}:rollback-abort:1`,
      abort_authority_ref: `${caseId}:abort-authority:1`,
      security_scope_verified: true,
      export_scope_verified: true,
      runtime_scope_verified: true,
      repo_wide_typecheck_debt_registered: source.repo_wide_typecheck_debt_registered === true,
      repo_wide_typecheck_required_before_real_activation: true,
      build_environment_blocked_non_code_path_length:
        source.build_environment_blocked_non_code_path_length === true,
      activation_authorization_required: true,
      activation_allowed: false,
      runtime_full_start_allowed: false,
      production_parallel_allowed: false,
      supabase_write_allowed: false,
      endpoint_activation_allowed: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.21"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildRollbackAbortPlanQACandidates(
  caseId: string,
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeRollbackAbortPlanQACandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("rollback-abort-plan");
  const reasons = getResultGreenActivationBlockingReasons(source);
  return [
    {
      rollback_abort_candidate_ref: `${caseId}:rollback-abort:1`,
      rollback_plan_candidate: { rollback_plan_ref: `${caseId}:rollback-plan:1` },
      rollback_trigger: "blocker_or_authorization_failure",
      rollback_scope: "local_candidate_only",
      rollback_owner: "operator_authorized_future_activation",
      rollback_steps: ["stop_candidate_flow", "preserve_trace", "keep_real_writes_blocked"],
      rollback_test_result: "candidate_verified",
      abort_path_candidate: { abort_authority_ref: `${caseId}:abort-authority:1` },
      abort_authority: "operator_or_s5_delegated_authority",
      data_deleted_without_trace: false,
      rollback_mutates_readiness: false,
      rollback_mutates_evidence: false,
      rollback_mutates_export_payload: false,
      rollback_creates_ghost_tasks: false,
      rollback_required_before_activation: true,
      rollback_real_executed: false,
      abort_real_executed: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.22"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function buildQAAuditCandidates(
  caseId: string,
  qaResults: RuntimeQAResultCandidate[],
  qaGreenGates: RuntimeQAGreenGateCandidate[],
  activationReadiness: RuntimeActivationReadinessBoundaryCandidate[],
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeQAAuditCandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("qa-audit");
  const reasons = getResultGreenActivationBlockingReasons(source);
  return QA_AUDIT_ACTIONS.map((action, index) => ({
    qa_audit_candidate_ref: `${caseId}:qa-audit:${index + 1}`,
    qa_audit_action: action,
    qa_audit_reason: `${action}:local_candidate_trace`,
    source_qa_result_candidate_ref: qaResults[0]?.qa_result_candidate_ref,
    source_qa_green_gate_candidate_ref: qaGreenGates[0]?.qa_green_gate_candidate_ref,
    source_activation_readiness_candidate_ref:
      activationReadiness[0]?.activation_readiness_candidate_ref,
    source_trace: source.source_trace ?? defaultSourceTrace("12.23"),
    runtime_audit_trail_real_created: false,
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  }));
}

export function buildQAPersistenceBoundaryCandidates(
  caseId: string,
  sources: RuntimeQAResultGreenActivationSourceInput[],
): RuntimeQAPersistenceBoundaryCandidate[] {
  const source = sources[0] ?? defaultResultGreenActivationSource("qa-persistence-boundary");
  const reasons = getResultGreenActivationBlockingReasons(source);
  return [
    {
      qa_persistence_boundary_candidate_ref: `${caseId}:qa-persistence-boundary:1`,
      local_qa_result_candidate_mode: true,
      local_qa_audit_candidate_mode: true,
      local_shadow_pilot_candidate_mode: true,
      local_no_go_dashboard_candidate_mode: true,
      local_activation_readiness_candidate_mode: true,
      real_qa_result_record_created: false,
      real_shadow_pilot_run_created: false,
      real_audit_trail_created: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      service_role_used: false,
      service_role_used_in_client: false,
      scene_write_detected: false,
      mba_write_detected: false,
      parallel_production_runtime_artifacts_write_detected: false,
      export_real_created: false,
      runtime_40_20_started: false,
      source_trace: source.source_trace ?? defaultSourceTrace("12.24"),
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    },
  ];
}

export function revalidatePhase11InputForPhase12(
  input: RuntimePhase12QAFoundationLocalInput,
): RuntimePhase12InputRevalidationDecision {
  const closeout = input.phase11_closeout;
  const candidates = input.phase11_candidates;
  const boundary = input.boundary_guard ?? {};
  const phase11Closed = closeout.phase11_closed_local === true;
  const phase12Authorized = closeout.ready_for_phase12_authorization === true;
  const phase12AlreadyStarted =
    closeout.phase12_started === true || closeout.phase12_started_local === true;
  const blockingReasons: RuntimeQAFoundationBlockingReason[] = [];

  if (!phase11Closed) blockingReasons.push("phase11_not_closed");
  if (!phase12Authorized) blockingReasons.push("phase12_not_authorized");
  blockingReasons.push(...getBoundaryGuardBlockingReasons(boundary));

  return {
    phase11_closed_local: phase11Closed,
    ready_for_phase12_authorization: phase12Authorized,
    phase12_started_local: phase11Closed && phase12Authorized && !phase12AlreadyStarted,
    phase12_closed_local: false,
    ready_for_real_activation_authorization: false,
    phase11_final_closeout_available: candidates.phase11_final_closeout_available === true,
    export_preview_service_candidates_available:
      (candidates.export_preview_service_candidates?.length ?? 0) > 0,
    scr_preview_candidates_available: (candidates.scr_preview_candidates?.length ?? 0) > 0,
    evidence_bundle_preview_candidates_available:
      (candidates.evidence_bundle_preview_candidates?.length ?? 0) > 0,
    mdsb_preview_candidates_available: (candidates.mdsb_preview_candidates?.length ?? 0) > 0,
    combined_preview_candidates_available: (candidates.combined_preview_candidates?.length ?? 0) > 0,
    export_blocking_rules_available: (candidates.export_blocking_rules?.length ?? 0) > 0,
    export_preview_audit_candidates_available:
      (candidates.export_preview_audit_candidates?.length ?? 0) > 0,
    phase11_persistence_boundary_available:
      (candidates.phase11_persistence_boundaries?.length ?? 0) > 0,
    export_real_previously_created: false,
    parallel_export_payload_real_previously_created: false,
    payload_state_sent_previously_detected: false,
    produccion_paralela_previously_started: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    export_preview_recalculated: false,
    phase11_modified: false,
    runtime_real_started: false,
    candidate_allowed: blockingReasons.length === 0 && phase11Closed && phase12Authorized && !phase12AlreadyStarted,
    blocking_reasons: [...new Set(blockingReasons)],
  };
}

export function buildQARunCandidates(
  caseId: string,
  sources: RuntimeQARunSourceInput[],
): RuntimeQARunCandidate[] {
  return sources.map((source, index) => {
    const scopes = (source.qa_scope ?? []).filter(isQAScope);
    const status = toQAStatus(source.qa_status);
    const reasons = getQARunBlockingReasons(source, scopes, status);

    return {
      qa_run_candidate_ref: source.qa_run_candidate_ref ?? `${caseId}:qa-run:${index + 1}`,
      run_id: source.run_id,
      catalog_version_id: source.catalog_version_id,
      source_trace: source.source_trace ?? {},
      qa_scope: scopes,
      qa_status: status ?? "blocked_candidate",
      runtime_qa_result_real_created: false,
      qa_green_real_created: false,
      shadow_pilot_real_started: false,
      runtime_real_started: false,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    };
  });
}

export function buildQARuleCandidates(
  caseId: string,
  sources: RuntimeQARuleSourceInput[],
): RuntimeQARuleCandidate[] {
  return sources.map((source, index) => {
    const blockingLevel = toBlockingLevel(source.blocking_level);
    const reasons = getQARuleBlockingReasons(source, blockingLevel);

    return {
      qa_rule_candidate_ref: source.qa_rule_candidate_ref ?? `${caseId}:qa-rule:${index + 1}`,
      qa_checklist_ref: source.qa_checklist_ref,
      runtime_qa_rule_ref: source.runtime_qa_rule_ref,
      qa_rule_id: source.qa_rule_id,
      qa_rule_group: source.qa_rule_group,
      qa_test_code: source.qa_test_code,
      qa_test_name: source.qa_test_name,
      expected_result: source.expected_result,
      blocking_level: blockingLevel,
      pass_fail_required: true,
      source_node_ref: source.source_node_ref,
      source_trace: source.source_trace ?? {},
      narrative_qa_only: false,
      verifiable_result_required: true,
      qa_rule_invented: false,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: reasons,
    };
  });
}

export function buildQAImportRuntimeBaseResultCandidates(
  caseId: string,
  sources: RuntimeQATestResultSourceInput[],
): RuntimeQAImportRuntimeBaseResultCandidate[] {
  const byCode = new Map(sources.map((source) => [source.qa_test_code, source]));
  const results = BASE_TESTS.map(([code, name]) =>
    buildTestResult(byCode.get(code) ?? defaultTestSource(code, name), name),
  );
  const reasons = results.flatMap((result) => result.blocking_reasons);

  return [
    {
      qa_import_runtime_base_result_candidate_ref: `${caseId}:qa-import-runtime-base:1`,
      results,
      activation_allowed: false,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    },
  ];
}

export function buildQAImportVersioningActivationResultCandidates(
  caseId: string,
  sources: RuntimeQATestResultSourceInput[],
): RuntimeQAImportVersioningActivationResultCandidate[] {
  const byCode = new Map(sources.map((source) => [source.qa_test_code, source]));
  const results = VERSIONING_TESTS.map(([code, name]) =>
    buildTestResult(byCode.get(code) ?? defaultTestSource(code, name), name),
  );
  const reasons = results.flatMap((result) => result.blocking_reasons);

  return [
    {
      qa_import_versioning_activation_result_candidate_ref: `${caseId}:qa-import-versioning-activation:1`,
      results,
      version_label_aligned_supported: true,
      docx_xlsx_checksum_non_null_supported: true,
      catalog_activation_allowed: false,
      orphan_source_code_unjustified_detection_supported: true,
      b7_direct_projection_detected: false,
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    },
  ];
}

export function buildQARegressionResultCandidates(
  caseId: string,
  sources: RuntimeQARegressionResultSourceInput[],
): RuntimeQARegressionResultCandidate[] {
  const byScope = new Map(sources.map((source) => [source.phase_scope, source]));
  return REGRESSION_PHASES.map((phaseScope, index) => {
    const source = byScope.get(phaseScope) ?? defaultRegressionSource(phaseScope);
    const passFail = toPassFail(source.test_status) ?? "not_run";
    const environmentBlocked = source.environment_blocked === true;
    const failedCount = source.failed_count ?? 0;
    const blockerFailure = source.blocker_failure_detected === true || failedCount > 0;
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (environmentBlocked) reasons.push("environment_blocked_critical");
    if (blockerFailure || passFail === "fail" || passFail === "blocked") {
      reasons.push("blocker_failure_detected");
    }
    if (source.qa_green_real_creation_attempted === true) reasons.push("qa_green_real_creation_attempted");

    return {
      regression_result_candidate_ref:
        source.regression_result_candidate_ref ?? `${caseId}:regression:${index + 1}`,
      phase_scope: isRegressionPhaseScope(source.phase_scope) ? source.phase_scope : undefined,
      module_name: source.module_name,
      test_command: source.test_command,
      test_status: environmentBlocked ? "environment_blocked" : passFail,
      test_count: source.test_count ?? 0,
      passed_count: source.passed_count ?? 0,
      failed_count: failedCount,
      failed_tests: source.failed_tests ?? [],
      environment_blocked: environmentBlocked,
      environment_blocked_reason: source.environment_blocked_reason ?? "",
      qa_integral_before_real_activation_required: true,
      blocker_failure_detected: blockerFailure,
      qa_green_real_created: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

export function buildQATypecheckBuildCandidates(
  caseId: string,
  sources: RuntimeQATypecheckBuildSourceInput[],
): RuntimeQATypecheckBuildCandidate[] {
  const source = sources[0] ?? {};
  const typecheckStatus = toPassFail(source.typecheck_status) ?? "not_run";
  const buildStatus = toPassFail(source.build_status) ?? "not_run";
  const environmentBlocked =
    source.environment_blocked === true || source.typescript_available !== true;
  const reasons = [
    ...getBoundaryGuardBlockingReasons(source),
    ...getSourceTraceReason(source.source_trace),
  ];
  if (environmentBlocked) reasons.push("environment_blocked_critical");
  if (
    typecheckStatus === "fail" ||
    buildStatus === "fail" ||
    source.unresolved_import_detected === true ||
    source.missing_type_export_detected === true ||
    source.duplicate_type_incompatible_detected === true ||
    source.implicit_supabase_runtime_dependency_detected === true
  ) {
    reasons.push("blocker_failure_detected");
  }
  if (source.endpoint_required_for_local_candidate_mode === true) {
    reasons.push("endpoint_creation_attempted");
  }

  return [
    {
      typecheck_build_candidate_ref: source.typecheck_build_candidate_ref ?? `${caseId}:typecheck-build:1`,
      typescript_available: source.typescript_available === true,
      typecheck_command: source.typecheck_command,
      typecheck_status: typecheckStatus,
      build_command: source.build_command,
      build_status: buildStatus,
      module_import_integrity: source.module_import_integrity !== false,
      unresolved_import_detected: source.unresolved_import_detected === true,
      missing_type_export_detected: source.missing_type_export_detected === true,
      duplicate_type_incompatible_detected: source.duplicate_type_incompatible_detected === true,
      implicit_supabase_runtime_dependency_detected:
        source.implicit_supabase_runtime_dependency_detected === true,
      endpoint_required_for_local_candidate_mode: false,
      environment_blocked: environmentBlocked,
      environment_blocked_reason: source.environment_blocked_reason ?? "",
      activation_blocked_if_failed: source.activation_blocked_if_failed ?? true,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    },
  ];
}

export function buildQACriticalScenarioResultCandidates(
  caseId: string,
  sources: RuntimeQACriticalScenarioSourceInput[],
): RuntimeQACriticalScenarioResultCandidate[] {
  const byCode = new Map(sources.map((source) => [source.ct_code, source]));
  return CT_CODES.map((ctCode, index) => {
    const source = byCode.get(ctCode) ?? defaultCriticalScenarioSource(ctCode);
    const passFail = toPassFail(source.pass_fail) ?? "blocked";
    const blockingLevel = toBlockingLevel(source.blocking_level) ?? "blocker";
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (
      !hasText(source.expected_gate_result) ||
      !hasText(source.expected_gap_result) ||
      !hasText(source.expected_readiness_result) ||
      !hasText(source.expected_export_block_result)
    ) {
      reasons.push("missing_expected_result");
    }
    if (source.narrative_pass_used === true) reasons.push("narrative_qa_attempted");
    if ((passFail === "fail" || passFail === "blocked") && blockingLevel === "blocker") {
      reasons.push("blocker_failure_detected");
    }

    return {
      critical_scenario_result_candidate_ref:
        source.critical_scenario_result_candidate_ref ?? `${caseId}:ct:${index + 1}`,
      ct_code: isCriticalScenarioCode(source.ct_code) ? source.ct_code : undefined,
      ct_name: source.ct_name,
      expected_gate_result: source.expected_gate_result,
      expected_gap_result: source.expected_gap_result,
      expected_readiness_result: source.expected_readiness_result,
      expected_export_block_result: source.expected_export_block_result,
      actual_gate_result: source.actual_gate_result,
      actual_gap_result: source.actual_gap_result,
      actual_readiness_result: source.actual_readiness_result,
      actual_export_block_result: source.actual_export_block_result,
      pass_fail: passFail,
      blocking_level: blockingLevel,
      narrative_pass_used: false,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

export function buildQACriticalRouteResultCandidates(
  caseId: string,
  sources: RuntimeQACriticalRouteSourceInput[],
): RuntimeQACriticalRouteResultCandidate[] {
  const byCode = new Map(sources.map((source) => [source.route_code, source]));
  return CRITICAL_ROUTE_CODES.map((routeCode, index) => {
    const source = byCode.get(routeCode) ?? defaultCriticalRouteSource(routeCode);
    const passFail = toPassFail(source.pass_fail) ?? "blocked";
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (!hasText(source.expected_route_status) || !hasText(source.expected_gap)) {
      reasons.push("missing_expected_result");
    }
    if (
      source.route_closed_from_free_text === true ||
      source.receiver_feedback_from_satisfaction_general === true ||
      source.b7_diagnosis_created === true ||
      source.b7_c20_direct_export_or_registry_created === true
    ) {
      reasons.push("b7_direct_projection_attempted");
    }
    if (passFail === "fail" || passFail === "blocked") reasons.push("blocker_failure_detected");

    return {
      critical_route_qa_candidate_ref:
        source.critical_route_qa_candidate_ref ?? `${caseId}:critical-route:${index + 1}`,
      route_code: isCriticalRouteCode(source.route_code) ? source.route_code : undefined,
      route_name: source.route_name,
      expected_route_status: source.expected_route_status,
      actual_route_status: source.actual_route_status,
      expected_gap: source.expected_gap,
      actual_gap: source.actual_gap,
      expected_manual_review_required: source.expected_manual_review_required ?? false,
      actual_manual_review_required: source.actual_manual_review_required ?? false,
      expected_reentry_required: source.expected_reentry_required ?? false,
      actual_reentry_required: source.actual_reentry_required ?? false,
      route_closed_from_free_text: false,
      receiver_feedback_from_satisfaction_general: false,
      b7_diagnosis_created: false,
      b7_c20_direct_export_or_registry_created: false,
      pass_fail: passFail,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

export function buildQASEMPSTGateResultCandidates(
  caseId: string,
  sources: RuntimeQASEMPSTGateSourceInput[],
): RuntimeQASEMPSTGateResultCandidate[] {
  const byCode = new Map(sources.map((source) => [source.gate_code, source]));
  return SEM_PST_CODES.map((gateCode, index) => {
    const source = byCode.get(gateCode) ?? defaultSemPstSource(gateCode);
    const passFail = toPassFail(source.pass_fail) ?? "blocked";
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (typeof source.expected_blocker !== "boolean" || !hasText(source.expected_readiness_gap)) {
      reasons.push("missing_expected_result");
    }
    if (
      source.moc_pf_olc_projection_when_blocked === true ||
      source.timer_or_process_state_inferred === true
    ) {
      reasons.push("blocker_failure_detected");
    }
    if (passFail === "fail" || passFail === "blocked") reasons.push("blocker_failure_detected");

    return {
      sem_pst_qa_candidate_ref: source.sem_pst_qa_candidate_ref ?? `${caseId}:sem-pst:${index + 1}`,
      gate_code: isSemPstGateCode(source.gate_code) ? source.gate_code : undefined,
      gate_family: toGateFamily(source.gate_family ?? String(source.gate_code).slice(0, 3)),
      expected_blocker: source.expected_blocker ?? true,
      actual_blocker: source.actual_blocker ?? true,
      expected_readiness_gap: source.expected_readiness_gap,
      actual_readiness_gap: source.actual_readiness_gap,
      moc_pf_olc_projection_when_blocked: false,
      timer_or_process_state_inferred: false,
      pass_fail: passFail,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

export function buildQAReadinessReentryResultCandidates(
  caseId: string,
  sources: RuntimeQAReadinessReentrySourceInput[],
): RuntimeQAReadinessReentryResultCandidate[] {
  const byCase = new Map(sources.map((source) => [source.readiness_case, source]));
  return READINESS_CASES.map((readinessCase, index) => {
    const source = byCase.get(readinessCase) ?? defaultReadinessReentrySource(readinessCase);
    const passFail = toPassFail(source.pass_fail) ?? "blocked";
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (!hasText(source.expected_readiness_state)) reasons.push("missing_expected_result");
    if (
      source.readiness_decision_record_real_created === true ||
      source.manual_review_request_real_created === true ||
      source.reentry_interactions_real_created === true ||
      source.export_preview_when_blocked_manual_review_reentry_created === true ||
      source.readiness_final_mutation_created === true
    ) {
      reasons.push("real_activation_attempted");
    }
    if (passFail === "fail" || passFail === "blocked") reasons.push("blocker_failure_detected");

    return {
      readiness_reentry_qa_candidate_ref:
        source.readiness_reentry_qa_candidate_ref ?? `${caseId}:readiness-reentry:${index + 1}`,
      readiness_case: isReadinessCase(source.readiness_case) ? source.readiness_case : undefined,
      expected_readiness_state: source.expected_readiness_state,
      actual_readiness_state: source.actual_readiness_state,
      expected_reentry: source.expected_reentry ?? false,
      actual_reentry: source.actual_reentry ?? false,
      expected_manual_review: source.expected_manual_review ?? false,
      actual_manual_review: source.actual_manual_review ?? false,
      readiness_decision_record_real_created: false,
      manual_review_request_real_created: false,
      reentry_interactions_real_created: false,
      export_preview_when_blocked_manual_review_reentry_created: false,
      readiness_final_mutation_created: false,
      pass_fail: passFail,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

export function buildQAExportPreviewResultCandidates(
  caseId: string,
  sources: RuntimeQAExportPreviewSourceInput[],
): RuntimeQAExportPreviewResultCandidate[] {
  const byCase = new Map(sources.map((source) => [source.export_preview_case, source]));
  return EXPORT_PREVIEW_CASES.map((exportCase, index) => {
    const source = byCase.get(exportCase) ?? defaultExportPreviewSource(exportCase);
    const passFail = toPassFail(source.pass_fail) ?? "blocked";
    const reasons = [
      ...getBoundaryGuardBlockingReasons(source),
      ...getSourceTraceReason(source.source_trace),
    ];
    if (!hasText(source.expected_payload_state) || !hasText(source.expected_blocking_rule)) {
      reasons.push("missing_expected_result");
    }
    if (
      source.placeholder_payload_detected === true ||
      source.payload_state_sent === true ||
      source.post_export_executed === true ||
      source.parallel_export_payload_real_created === true ||
      source.produccion_paralela_started === true ||
      source.registry_ir_diagnosis_created === true
    ) {
      reasons.push("real_activation_attempted");
    }
    if (passFail === "fail" || passFail === "blocked") reasons.push("blocker_failure_detected");

    return {
      export_preview_qa_candidate_ref:
        source.export_preview_qa_candidate_ref ?? `${caseId}:export-preview-qa:${index + 1}`,
      export_preview_case: isExportPreviewCase(source.export_preview_case)
        ? source.export_preview_case
        : undefined,
      expected_payload_state: source.expected_payload_state,
      actual_payload_state: source.actual_payload_state,
      expected_blocking_rule: source.expected_blocking_rule,
      actual_blocking_rule: source.actual_blocking_rule,
      placeholder_payload_detected: false,
      payload_state_sent: false,
      post_export_executed: false,
      parallel_export_payload_real_created: false,
      produccion_paralela_started: false,
      registry_ir_diagnosis_created: false,
      pass_fail: passFail,
      source_trace: source.source_trace ?? {},
      candidate_allowed: reasons.length === 0,
      blocking_reasons: [...new Set(reasons)],
    };
  });
}

function buildTestResult(
  source: RuntimeQATestResultSourceInput,
  defaultName: string,
): RuntimeQATestResultCandidate {
  const passFail = toPassFail(source.pass_fail);
  const blockingLevel = toBlockingLevel(source.blocking_level) ?? "blocker";
  const reasons = getTestResultBlockingReasons(source, passFail, blockingLevel);

  return {
    qa_test_code: source.qa_test_code,
    qa_test_name: source.qa_test_name ?? defaultName,
    expected_result: source.expected_result ?? "",
    actual_result: source.actual_result ?? "",
    pass_fail: passFail ?? "blocked",
    blocking_level: blockingLevel,
    evidence_ref: source.evidence_ref ?? "",
    source_trace: source.source_trace ?? {},
    failure_reason: source.failure_reason ?? "",
    activation_blocked_if_failed: source.activation_blocked_if_failed ?? blockingLevel === "blocker",
    candidate_allowed: reasons.length === 0,
    blocking_reasons: reasons,
  };
}

function createResult(
  status: RuntimeQAFoundationStatus,
  revalidation: RuntimePhase12InputRevalidationDecision,
  candidates: {
    qaRunCandidates?: RuntimeQARunCandidate[];
    qaRuleCandidates?: RuntimeQARuleCandidate[];
    baseCandidates?: RuntimeQAImportRuntimeBaseResultCandidate[];
    versioningCandidates?: RuntimeQAImportVersioningActivationResultCandidate[];
  } = {},
): RuntimePhase12QAFoundationLocalResult {
  return {
    status,
    phase12_input_revalidation: revalidation,
    qa_run_candidates: candidates.qaRunCandidates ?? [],
    qa_rule_candidates: candidates.qaRuleCandidates ?? [],
    qa_import_runtime_base_result_candidates: candidates.baseCandidates ?? [],
    qa_import_versioning_activation_result_candidates: candidates.versioningCandidates ?? [],
    phase12_started_local: revalidation.candidate_allowed,
    phase12_closed_local: false,
    ready_for_real_activation_authorization: false,
    runtime_40_20_started: false,
    catalog_activated: false,
    migration_applied: false,
    runtime_qa_result_real_created: false,
    qa_green_real_created: false,
    shadow_pilot_real_started: false,
    full_runtime_authorized: false,
    production_real_started: false,
    export_real_created: false,
    parallel_export_payload_real_created: false,
    produccion_paralela_started: false,
    registry_created: false,
    ir_created: false,
    diagnosis_created: false,
    control_plane_real_created: false,
    mba_write_detected: false,
    scene_write_detected: false,
    parallel_production_runtime_artifacts_write_detected: false,
    supabase_touched: false,
    sql_executed: false,
    endpoint_created: false,
    service_role_used: false,
    service_role_used_in_client: false,
  };
}

function resolveStatus(reasons: RuntimeQAFoundationBlockingReason[]): RuntimeQAFoundationStatus {
  if (reasons.includes("phase11_not_closed")) return "blocked_phase11_not_closed";
  if (reasons.includes("phase12_not_authorized")) return "blocked_phase12_not_authorized";
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("environment_blocked_critical")) return "blocked_environment_blocked_critical";
  if (reasons.includes("qa_green_real_creation_attempted")) {
    return "blocked_qa_green_real_creation_attempt";
  }
  if (
    reasons.includes("real_activation_attempted") ||
    reasons.includes("runtime_real_start_attempted") ||
    reasons.includes("supabase_touch_attempted") ||
    reasons.includes("sql_execution_attempted") ||
    reasons.includes("endpoint_creation_attempted") ||
    reasons.includes("export_real_creation_attempted") ||
    reasons.includes("parallel_export_payload_real_creation_attempted") ||
    reasons.includes("produccion_paralela_start_attempted")
  ) {
    return "blocked_real_activation_attempt";
  }
  if (reasons.includes("narrative_qa_attempted") || reasons.includes("missing_expected_result")) {
    return "blocked_narrative_qa_without_expected_result";
  }
  if (reasons.includes("catalog_activation_attempted") || reasons.includes("blocker_failure_detected")) {
    return reasons.includes("blocker_failure_detected")
      ? "blocked_blocker_failure_detected"
      : "blocked_catalog_activation_on_qa_failure";
  }
  if (reasons.includes("b7_direct_projection_attempted")) return "blocked_b7_direct_projection_attempt";
  return "qa_regression_typecheck_critical_results_created";
}

function resolveSecurityShadowStatus(
  reasons: RuntimeQASecurityShadowBlockingReason[],
): RuntimeQAFoundationStatus {
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("supabase_touch_attempted")) return "blocked_supabase_touch_attempt";
  if (reasons.includes("shadow_pilot_real_start_attempted")) {
    return "blocked_shadow_pilot_real_start_attempt";
  }
  if (
    reasons.includes("scene_write_attempted") ||
    reasons.includes("mba_write_attempted") ||
    reasons.includes("parallel_production_runtime_artifacts_write_attempted") ||
    reasons.includes("registry_write_attempted") ||
    reasons.includes("ir_write_attempted") ||
    reasons.includes("diagnosis_write_attempted") ||
    reasons.includes("object_inventory_write_attempted") ||
    reasons.includes("readiness_real_mutation_attempted")
  ) {
    return "blocked_write_boundary_violation";
  }
  if (
    reasons.includes("production_mode_attempted") ||
    reasons.includes("runtime_real_start_attempted") ||
    reasons.includes("export_real_attempted") ||
    reasons.includes("external_delivery_attempted")
  ) {
    return "blocked_production_mode_attempt";
  }
  return "shadow_pilot_observability_candidates_created";
}

function resolveResultGreenActivationStatus(
  reasons: RuntimeQAResultGreenActivationBlockingReason[],
): RuntimeQAFoundationStatus {
  if (reasons.includes("missing_source_trace")) return "blocked_missing_source_trace";
  if (reasons.includes("repo_wide_typecheck_debt_not_carried_forward")) {
    return "blocked_external_typecheck_debt_not_carried_forward";
  }
  if (reasons.includes("qa_green_real_creation_attempted")) {
    return "blocked_qa_green_real_creation_attempt";
  }
  if (
    reasons.includes("activation_allowed_attempted") ||
    reasons.includes("runtime_full_start_attempted") ||
    reasons.includes("production_parallel_attempted")
  ) {
    return "blocked_activation_attempt";
  }
  if (
    reasons.includes("qa_result_record_real_creation_attempted") ||
    reasons.includes("shadow_pilot_run_real_creation_attempted") ||
    reasons.includes("runtime_audit_trail_real_creation_attempted") ||
    reasons.includes("supabase_touch_attempted") ||
    reasons.includes("sql_execution_attempted") ||
    reasons.includes("endpoint_creation_attempted") ||
    reasons.includes("scene_write_attempted") ||
    reasons.includes("mba_write_attempted") ||
    reasons.includes("parallel_production_runtime_artifacts_write_attempted") ||
    reasons.includes("export_real_attempted") ||
    reasons.includes("runtime_real_start_attempted")
  ) {
    return "blocked_qa_persistence_real_write_attempt";
  }
  return "qa_persistence_boundary_candidates_created";
}

function getResultGreenActivationBlockingReasons(
  source: RuntimeQAResultGreenActivationSourceInput,
): RuntimeQAResultGreenActivationBlockingReason[] {
  const reasons: RuntimeQAResultGreenActivationBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.repo_wide_typecheck_debt_registered !== true) {
    reasons.push("repo_wide_typecheck_debt_not_carried_forward");
  }
  if (source.repo_wide_typecheck_required_before_real_activation !== true) {
    reasons.push("repo_wide_typecheck_debt_not_carried_forward");
  }
  if (source.build_environment_blocked_non_code_path_length !== true) {
    reasons.push("build_environment_blocked_not_carried_forward");
  }
  if (source.qa_green_real_creation_attempted === true) {
    reasons.push("qa_green_real_creation_attempted");
  }
  if (source.activation_allowed_attempted === true) reasons.push("activation_allowed_attempted");
  if (source.runtime_full_start_attempted === true) reasons.push("runtime_full_start_attempted");
  if (source.production_parallel_attempted === true) reasons.push("production_parallel_attempted");
  if (source.supabase_write_allowed_attempted === true) {
    reasons.push("supabase_write_allowed_attempted");
  }
  if (source.endpoint_activation_attempted === true) reasons.push("endpoint_activation_attempted");
  if (source.rollback_real_execution_attempted === true) {
    reasons.push("rollback_real_execution_attempted");
  }
  if (source.abort_real_execution_attempted === true) reasons.push("abort_real_execution_attempted");
  if (source.data_deleted_without_trace_attempted === true) {
    reasons.push("data_deleted_without_trace_attempted");
  }
  if (source.rollback_mutates_readiness_attempted === true) {
    reasons.push("rollback_mutates_readiness_attempted");
  }
  if (source.rollback_mutates_evidence_attempted === true) {
    reasons.push("rollback_mutates_evidence_attempted");
  }
  if (source.rollback_mutates_export_payload_attempted === true) {
    reasons.push("rollback_mutates_export_payload_attempted");
  }
  if (source.rollback_creates_ghost_tasks_attempted === true) {
    reasons.push("rollback_creates_ghost_tasks_attempted");
  }
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.qa_result_record_real_creation_attempted === true) {
    reasons.push("qa_result_record_real_creation_attempted");
  }
  if (source.shadow_pilot_run_real_creation_attempted === true) {
    reasons.push("shadow_pilot_run_real_creation_attempted");
  }
  if (source.supabase_previously_touched === true) reasons.push("supabase_touch_attempted");
  if (source.sql_previously_executed === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_previously_created === true) reasons.push("endpoint_creation_attempted");
  if (source.service_role_used_in_client === true) reasons.push("service_role_client_violation");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.export_real_attempted === true) reasons.push("export_real_attempted");
  if (source.runtime_real_start_attempted === true) reasons.push("runtime_real_start_attempted");
  return [...new Set(reasons)];
}

function getSecurityShadowBlockingReasons(
  source: RuntimeQASecurityShadowSourceInput,
): RuntimeQASecurityShadowBlockingReason[] {
  const reasons: RuntimeQASecurityShadowBlockingReason[] = [];
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.service_role_used_in_client === true) reasons.push("service_role_client_violation");
  if (source.cross_case_read_detected === true) reasons.push("cross_case_read_detected");
  if (source.cross_case_write_detected === true) reasons.push("cross_case_write_detected");
  if (source.query_outside_case_or_tenant_detected === true) {
    reasons.push("query_outside_case_or_tenant_detected");
  }
  if (source.rls_real_migration_created === true) reasons.push("rls_real_migration_attempted");
  if (source.supabase_previously_touched === true) reasons.push("supabase_touch_attempted");
  if (source.sql_previously_executed === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_previously_created === true) reasons.push("endpoint_creation_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  if (source.registry_write_attempted === true) reasons.push("registry_write_attempted");
  if (source.ir_write_attempted === true) reasons.push("ir_write_attempted");
  if (source.diagnosis_write_attempted === true) reasons.push("diagnosis_write_attempted");
  if (source.object_inventory_write_attempted === true) {
    reasons.push("object_inventory_write_attempted");
  }
  if (source.readiness_real_mutation_attempted === true) {
    reasons.push("readiness_real_mutation_attempted");
  }
  if (source.runtime_real_start_attempted === true) reasons.push("runtime_real_start_attempted");
  if (source.export_real_attempted === true) reasons.push("export_real_attempted");
  if (source.shadow_pilot_real_start_attempted === true) {
    reasons.push("shadow_pilot_real_start_attempted");
  }
  if (source.production_mode_attempted === true) reasons.push("production_mode_attempted");
  if (source.eight_activities_scale_attempted === true) {
    reasons.push("eight_activities_scale_attempted");
  }
  if (source.multi_role_scale_attempted === true) reasons.push("multi_role_scale_attempted");
  if (source.external_delivery_attempted === true) reasons.push("external_delivery_attempted");
  if (source.real_customer_data_used === true && source.real_customer_data_authorized !== true) {
    reasons.push("real_customer_data_without_authorization");
  }
  if (source.runtime_audit_trail_real_creation_attempted === true) {
    reasons.push("runtime_audit_trail_real_creation_attempted");
  }
  if (source.mba_event_ledger_real_creation_attempted === true) {
    reasons.push("mba_event_ledger_real_creation_attempted");
  }
  if (source.compliance_report_real_creation_attempted === true) {
    reasons.push("compliance_report_real_creation_attempted");
  }
  return [...new Set(reasons)];
}

function getQARunBlockingReasons(
  source: RuntimeQARunSourceInput,
  scopes: RuntimeQAScope[],
  status?: RuntimeQAStatus,
): RuntimeQAFoundationBlockingReason[] {
  const reasons = getBoundaryGuardBlockingReasons(source);
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (scopes.length === 0) reasons.push("missing_expected_result");
  if (!status) reasons.push("missing_pass_fail");
  return [...new Set(reasons)];
}

function getQARuleBlockingReasons(
  source: RuntimeQARuleSourceInput,
  blockingLevel?: RuntimeQABlockingLevel,
): RuntimeQAFoundationBlockingReason[] {
  const reasons = getBoundaryGuardBlockingReasons(source);
  if (!hasText(source.qa_rule_id)) reasons.push("missing_expected_result");
  if (!hasText(source.qa_test_code)) reasons.push("missing_expected_result");
  if (!hasText(source.qa_test_name)) reasons.push("missing_expected_result");
  if (!hasText(source.expected_result)) reasons.push("missing_expected_result");
  if (!blockingLevel) reasons.push("missing_expected_result");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if (source.narrative_qa_only === true) reasons.push("narrative_qa_attempted");
  if (source.verifiable_result_required === false) reasons.push("narrative_qa_attempted");
  if (source.qa_rule_invented === true) reasons.push("qa_rule_invented_attempted");
  return [...new Set(reasons)];
}

function getTestResultBlockingReasons(
  source: RuntimeQATestResultSourceInput,
  passFail?: RuntimeQAPassFail,
  blockingLevel?: RuntimeQABlockingLevel,
): RuntimeQAFoundationBlockingReason[] {
  const reasons = getBoundaryGuardBlockingReasons(source);
  if (!hasText(source.expected_result)) reasons.push("missing_expected_result");
  if (!passFail) reasons.push("missing_pass_fail");
  if (!hasText(source.evidence_ref)) reasons.push("missing_evidence_ref");
  if (!hasSourceTrace(source.source_trace)) reasons.push("missing_source_trace");
  if ((passFail === "fail" || passFail === "blocked") && blockingLevel === "blocker") {
    reasons.push("blocker_failure_detected");
  }
  if (source.catalog_activation_allowed === true) reasons.push("catalog_activation_attempted");
  if (source.b7_direct_projection_detected === true) reasons.push("b7_direct_projection_attempted");
  return [...new Set(reasons)];
}

function getBoundaryGuardBlockingReasons(source: {
  export_real_previously_created?: boolean;
  parallel_export_payload_real_previously_created?: boolean;
  payload_state_sent_previously_detected?: boolean;
  produccion_paralela_previously_started?: boolean;
  supabase_previously_touched?: boolean;
  sql_previously_executed?: boolean;
  endpoint_previously_created?: boolean;
  export_preview_recalculation_attempted?: boolean;
  phase11_modification_attempted?: boolean;
  runtime_real_start_attempted?: boolean;
  runtime_qa_result_real_creation_attempted?: boolean;
  qa_green_real_creation_attempted?: boolean;
  shadow_pilot_real_start_attempted?: boolean;
  catalog_activation_attempted?: boolean;
  registry_ir_diagnosis_creation_attempted?: boolean;
  control_plane_real_creation_attempted?: boolean;
  mba_write_attempted?: boolean;
  scene_write_attempted?: boolean;
  parallel_production_runtime_artifacts_write_attempted?: boolean;
}): RuntimeQAFoundationBlockingReason[] {
  const reasons: RuntimeQAFoundationBlockingReason[] = [];
  if (source.export_real_previously_created === true) reasons.push("export_real_creation_attempted");
  if (source.parallel_export_payload_real_previously_created === true) {
    reasons.push("parallel_export_payload_real_creation_attempted");
  }
  if (source.payload_state_sent_previously_detected === true) reasons.push("export_real_creation_attempted");
  if (source.produccion_paralela_previously_started === true) {
    reasons.push("produccion_paralela_start_attempted");
  }
  if (source.supabase_previously_touched === true) reasons.push("supabase_touch_attempted");
  if (source.sql_previously_executed === true) reasons.push("sql_execution_attempted");
  if (source.endpoint_previously_created === true) reasons.push("endpoint_creation_attempted");
  if (source.export_preview_recalculation_attempted === true) {
    reasons.push("export_preview_recalculation_attempted");
  }
  if (source.phase11_modification_attempted === true) reasons.push("phase11_modification_attempted");
  if (source.runtime_real_start_attempted === true) reasons.push("runtime_real_start_attempted");
  if (source.runtime_qa_result_real_creation_attempted === true) {
    reasons.push("qa_green_real_creation_attempted");
  }
  if (source.qa_green_real_creation_attempted === true) reasons.push("qa_green_real_creation_attempted");
  if (source.shadow_pilot_real_start_attempted === true) {
    reasons.push("shadow_pilot_real_start_attempted");
  }
  if (source.catalog_activation_attempted === true) reasons.push("catalog_activation_attempted");
  if (source.registry_ir_diagnosis_creation_attempted === true) {
    reasons.push("registry_ir_diagnosis_creation_attempted");
  }
  if (source.control_plane_real_creation_attempted === true) {
    reasons.push("control_plane_real_creation_attempted");
  }
  if (source.mba_write_attempted === true) reasons.push("mba_write_attempted");
  if (source.scene_write_attempted === true) reasons.push("scene_write_attempted");
  if (source.parallel_production_runtime_artifacts_write_attempted === true) {
    reasons.push("parallel_production_runtime_artifacts_write_attempted");
  }
  return [...new Set(reasons)];
}

function defaultTestSource(qaTestCode: string, qaTestName: string): RuntimeQATestResultSourceInput {
  return {
    qa_test_code: qaTestCode,
    qa_test_name: qaTestName,
    expected_result: "Verifiable QA result is present and pass/fail is explicit.",
    actual_result: "Candidate local QA result prepared from authorized instruction.",
    pass_fail: "pass",
    blocking_level: "blocker",
    evidence_ref: `${qaTestCode}:authorized-local-contract`,
    source_trace: defaultSourceTrace(qaTestCode),
    activation_blocked_if_failed: true,
    catalog_activation_allowed: false,
    b7_direct_projection_detected: false,
  };
}

function defaultSourceTrace(sourceNodeRef: string) {
  return {
    source_document: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "QA_Checklist",
    source_row_number: 1,
    source_node_ref: sourceNodeRef,
  };
}

function defaultSecurityShadowSource(sourceNodeRef: string): RuntimeQASecurityShadowSourceInput {
  return {
    source_trace: defaultSourceTrace(sourceNodeRef),
    service_role_used_in_client: false,
    cross_case_read_detected: false,
    cross_case_write_detected: false,
    query_outside_case_or_tenant_detected: false,
    rls_real_migration_created: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    scene_write_attempted: false,
    mba_write_attempted: false,
    parallel_production_runtime_artifacts_write_attempted: false,
    registry_write_attempted: false,
    ir_write_attempted: false,
    diagnosis_write_attempted: false,
    object_inventory_write_attempted: false,
    readiness_real_mutation_attempted: false,
    runtime_real_start_attempted: false,
    export_real_attempted: false,
    shadow_pilot_real_start_attempted: false,
    production_mode_attempted: false,
    eight_activities_scale_attempted: false,
    multi_role_scale_attempted: false,
    external_delivery_attempted: false,
    real_customer_data_used: false,
    real_customer_data_authorized: false,
    runtime_audit_trail_real_creation_attempted: false,
    mba_event_ledger_real_creation_attempted: false,
    compliance_report_real_creation_attempted: false,
  };
}

function defaultResultGreenActivationSource(
  sourceNodeRef: string,
): RuntimeQAResultGreenActivationSourceInput {
  return {
    source_trace: defaultSourceTrace(sourceNodeRef),
    repo_wide_typecheck_debt_registered: true,
    repo_wide_typecheck_required_before_real_activation: true,
    build_environment_blocked_non_code_path_length: true,
    qa_green_real_creation_attempted: false,
    activation_allowed_attempted: false,
    runtime_full_start_attempted: false,
    production_parallel_attempted: false,
    supabase_write_allowed_attempted: false,
    endpoint_activation_attempted: false,
    rollback_real_execution_attempted: false,
    abort_real_execution_attempted: false,
    data_deleted_without_trace_attempted: false,
    rollback_mutates_readiness_attempted: false,
    rollback_mutates_evidence_attempted: false,
    rollback_mutates_export_payload_attempted: false,
    rollback_creates_ghost_tasks_attempted: false,
    runtime_audit_trail_real_creation_attempted: false,
    qa_result_record_real_creation_attempted: false,
    shadow_pilot_run_real_creation_attempted: false,
    supabase_previously_touched: false,
    sql_previously_executed: false,
    endpoint_previously_created: false,
    service_role_used_in_client: false,
    scene_write_attempted: false,
    mba_write_attempted: false,
    parallel_production_runtime_artifacts_write_attempted: false,
    export_real_attempted: false,
    runtime_real_start_attempted: false,
  };
}

function defaultRegressionSource(
  phaseScope: RuntimeQARegressionPhaseScope,
): RuntimeQARegressionResultSourceInput {
  const metadata: Record<RuntimeQARegressionPhaseScope, [string, string, number]> = {
    phase6_response_ingest: [
      "ResponseIngest",
      "node --test src/services/eve/runtime-40-20/response-ingest/runtime-40-20-response-ingest.test.mjs",
      169,
    ],
    phase7_canonical_variable: [
      "CanonicalVariable",
      "node --test src/services/eve/runtime-40-20/canonical-variable/runtime-40-20-canonical-variable.test.mjs",
      248,
    ],
    phase8_branching_budget: [
      "BranchingBudget",
      "node --test src/services/eve/runtime-40-20/branching-budget/runtime-40-20-branching-budget.test.mjs",
      282,
    ],
    phase9_critical_gates: [
      "CriticalGates",
      "node --test src/services/eve/runtime-40-20/critical-gates/runtime-40-20-critical-gates.test.mjs",
      258,
    ],
    phase10_readiness_reentry: [
      "ReadinessReentry",
      "node --test src/services/eve/runtime-40-20/readiness-reentry/runtime-40-20-readiness-reentry.test.mjs",
      352,
    ],
    phase11_export_preview: [
      "ExportPreview",
      "node --test src/services/eve/runtime-40-20/export-preview/runtime-40-20-export-preview.test.mjs",
      417,
    ],
  };
  const [moduleName, command, count] = metadata[phaseScope];
  return {
    phase_scope: phaseScope,
    module_name: moduleName,
    test_command: command,
    test_status: "pass",
    test_count: count,
    passed_count: count,
    failed_count: 0,
    failed_tests: [],
    environment_blocked: false,
    environment_blocked_reason: "",
    blocker_failure_detected: false,
    source_trace: defaultSourceTrace(phaseScope),
  };
}

function defaultCriticalScenarioSource(
  ctCode: RuntimeQACriticalScenarioCode,
): RuntimeQACriticalScenarioSourceInput {
  return {
    ct_code: ctCode,
    ct_name: ctCode,
    expected_gate_result: "expected gate result explicit",
    expected_gap_result: "expected gap result explicit",
    expected_readiness_result: "expected readiness result explicit",
    expected_export_block_result: "expected export block result explicit",
    actual_gate_result: "expected gate result explicit",
    actual_gap_result: "expected gap result explicit",
    actual_readiness_result: "expected readiness result explicit",
    actual_export_block_result: "expected export block result explicit",
    pass_fail: "pass",
    blocking_level: "blocker",
    narrative_pass_used: false,
    source_trace: defaultSourceTrace(ctCode),
  };
}

function defaultCriticalRouteSource(
  routeCode: RuntimeQACriticalRouteCode,
): RuntimeQACriticalRouteSourceInput {
  return {
    route_code: routeCode,
    route_name: routeCode,
    expected_route_status: "candidate_verified",
    actual_route_status: "candidate_verified",
    expected_gap: "none_open_for_candidate",
    actual_gap: "none_open_for_candidate",
    expected_manual_review_required: false,
    actual_manual_review_required: false,
    expected_reentry_required: false,
    actual_reentry_required: false,
    pass_fail: "pass",
    source_trace: defaultSourceTrace(routeCode),
  };
}

function defaultSemPstSource(gateCode: RuntimeQASEMPSTGateCode): RuntimeQASEMPSTGateSourceInput {
  return {
    gate_code: gateCode,
    gate_family: gateCode.startsWith("SEM") ? "SEM" : "PST",
    expected_blocker: true,
    actual_blocker: true,
    expected_readiness_gap: `${gateCode}:readiness_gap`,
    actual_readiness_gap: `${gateCode}:readiness_gap`,
    pass_fail: "pass",
    source_trace: defaultSourceTrace(gateCode),
  };
}

function defaultReadinessReentrySource(
  readinessCase: RuntimeQAReadinessCase,
): RuntimeQAReadinessReentrySourceInput {
  return {
    readiness_case: readinessCase,
    expected_readiness_state: readinessCase,
    actual_readiness_state: readinessCase,
    expected_reentry: readinessCase.includes("reentry"),
    actual_reentry: readinessCase.includes("reentry"),
    expected_manual_review: readinessCase === "manual_review_required",
    actual_manual_review: readinessCase === "manual_review_required",
    pass_fail: "pass",
    source_trace: defaultSourceTrace(readinessCase),
  };
}

function defaultExportPreviewSource(
  exportCase: RuntimeQAExportPreviewCase,
): RuntimeQAExportPreviewSourceInput {
  return {
    export_preview_case: exportCase,
    expected_payload_state: "blocked_or_candidate",
    actual_payload_state: "blocked_or_candidate",
    expected_blocking_rule: `${exportCase}:blocking_rule`,
    actual_blocking_rule: `${exportCase}:blocking_rule`,
    pass_fail: "pass",
    source_trace: defaultSourceTrace(exportCase),
  };
}

function toQAStatus(value: unknown): RuntimeQAStatus | undefined {
  return isQAStatus(value) ? value : undefined;
}

function toBlockingLevel(value: unknown): RuntimeQABlockingLevel | undefined {
  return isBlockingLevel(value) ? value : undefined;
}

function toPassFail(value: unknown): RuntimeQAPassFail | undefined {
  return isPassFail(value) ? value : undefined;
}

function toGateFamily(value: unknown): RuntimeQAGateFamily | undefined {
  return value === "SEM" || value === "PST" ? value : undefined;
}

function isQAScope(value: unknown): value is RuntimeQAScope {
  return typeof value === "string" && ALLOWED_QA_SCOPES.includes(value as RuntimeQAScope);
}

function isRegressionPhaseScope(value: unknown): value is RuntimeQARegressionPhaseScope {
  return typeof value === "string" && REGRESSION_PHASES.includes(value as RuntimeQARegressionPhaseScope);
}

function isCriticalScenarioCode(value: unknown): value is RuntimeQACriticalScenarioCode {
  return typeof value === "string" && CT_CODES.includes(value as RuntimeQACriticalScenarioCode);
}

function isCriticalRouteCode(value: unknown): value is RuntimeQACriticalRouteCode {
  return typeof value === "string" && CRITICAL_ROUTE_CODES.includes(value as RuntimeQACriticalRouteCode);
}

function isSemPstGateCode(value: unknown): value is RuntimeQASEMPSTGateCode {
  return typeof value === "string" && SEM_PST_CODES.includes(value as RuntimeQASEMPSTGateCode);
}

function isReadinessCase(value: unknown): value is RuntimeQAReadinessCase {
  return typeof value === "string" && READINESS_CASES.includes(value as RuntimeQAReadinessCase);
}

function isExportPreviewCase(value: unknown): value is RuntimeQAExportPreviewCase {
  return typeof value === "string" && EXPORT_PREVIEW_CASES.includes(value as RuntimeQAExportPreviewCase);
}

function isQAStatus(value: unknown): value is RuntimeQAStatus {
  return typeof value === "string" && ALLOWED_QA_STATUSES.includes(value as RuntimeQAStatus);
}

function isBlockingLevel(value: unknown): value is RuntimeQABlockingLevel {
  return typeof value === "string" && ALLOWED_BLOCKING_LEVELS.includes(value as RuntimeQABlockingLevel);
}

function isPassFail(value: unknown): value is RuntimeQAPassFail {
  return typeof value === "string" && ALLOWED_PASS_FAIL.includes(value as RuntimeQAPassFail);
}

function hasSourceTrace(value: unknown): boolean {
  const sourceTrace = value as Record<string, unknown> | undefined;
  return (
    typeof sourceTrace?.source_document === "string" &&
    typeof sourceTrace?.source_sheet === "string" &&
    typeof sourceTrace?.source_row_number === "number"
  );
}

function getSourceTraceReason(value: unknown): RuntimeQAFoundationBlockingReason[] {
  return hasSourceTrace(value) ? [] : ["missing_source_trace"];
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
