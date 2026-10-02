import type {
  CrossModelConsistencyPrecheckLocal,
  MoCRegistryCandidateLocal,
  OLCRegistryCandidateLocal,
  PFRegistryCandidateLocal,
  PMRegistryCandidateLocal,
  RegistryCandidateLocalDryRunInput,
  RegistryCandidateLocalDryRunResult,
  RegistryCandidateManifest,
  RegistryCandidateManifestItem,
  RegistryCandidateModelKind,
  RegistryCandidateStatus,
  RegistryNoGoBoundaryCheckLocal,
  RegistryReadinessCheckLocal,
} from "./registry-candidate-local-dry-run-types";

const MODEL_KINDS: RegistryCandidateModelKind[] = ["PM", "PF", "MoC", "OLC"];

const BASE_RESTRICTIONS = [
  "registry_real_blocked",
  "pm_registry_real_blocked",
  "pf_registry_real_blocked",
  "moc_registry_real_blocked",
  "olc_registry_real_blocked",
  "ir_blocked",
  "export_blocked",
  "diagnosis_blocked",
  "phase3_real_blocked",
  "production_parallel_real_blocked",
];

const NO_GO: RegistryCandidateLocalDryRunResult["no_go"] = {
  registry_real_created: false,
  pm_registry_real_created: false,
  pf_registry_real_created: false,
  moc_registry_real_created: false,
  olc_registry_real_created: false,
  ir_created: false,
  export_created: false,
  export_code_package_created: false,
  diagramming_export_package_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  phase3_real_opened: false,
  production_parallel_real_opened: false,
  conformance_claimed: false,
  consistency_claimed: false,
  models_auto_corrected: false,
  readiness_mutated: false,
  core_state_mutated: false,
  mba_written: false,
  parallel_production_artifacts_written: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: RegistryCandidateLocalDryRunResult["materiality"] = {
  level: "registry_candidate_local_dry_run",
  local_only: true,
  production_integration: false,
  registry_real_created: false,
  next_authorization_required: true,
};

export function runRegistryCandidateLocalDryRun(
  input: RegistryCandidateLocalDryRunInput,
): RegistryCandidateLocalDryRunResult {
  const fase2Accepted = isFase2Accepted(input);
  const restrictions = buildRestrictions(input, fase2Accepted);
  const governanceIssueRefs = unique([
    ...input.fase2_baseline_result.governance_issue_refs,
    ...restrictions.map(
      (restriction) => `REGISTRY_CANDIDATE_LOCAL_RESTRICTION:${restriction}`,
    ),
  ]);
  const sourceRefs = sourceObjectRefs(input);
  const status = candidateStatusFor(fase2Accepted, restrictions);

  return {
    ok: fase2Accepted,
    case_id: input.case_id,
    registry_candidate_manifest: buildManifest({
      input,
      sourceRefs,
      status,
      restrictions,
      governanceIssueRefs,
    }),
    pm_registry_candidate: buildPMCandidate(input, status, restrictions),
    pf_registry_candidate: buildPFCandidate(input, status, restrictions),
    moc_registry_candidate: buildMoCCandidate(input, status, restrictions),
    olc_registry_candidate: buildOLCCandidate(input, status, restrictions),
    registry_readiness_check: buildReadinessCheck(input, fase2Accepted, restrictions),
    cross_model_consistency_precheck: buildCrossModelPrecheck(
      input,
      fase2Accepted,
    ),
    registry_no_go_boundary_check: buildBoundaryCheck(input),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: fase2Accepted ? undefined : "fase2_baseline_not_local_safe",
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isFase2Accepted(input: RegistryCandidateLocalDryRunInput): boolean {
  const fase2 = input.fase2_baseline_result;

  return (
    fase2.ok === true &&
    fase2.materiality.local_only === true &&
    fase2.materiality.production_integration === false &&
    fase2.no_go.production_parallel_real_opened === false &&
    fase2.no_go.phase3_real_opened === false &&
    fase2.no_go.registry_created === false &&
    fase2.no_go.ir_created === false &&
    fase2.no_go.export_created === false
  );
}

function buildRestrictions(
  input: RegistryCandidateLocalDryRunInput,
  fase2Accepted: boolean,
): string[] {
  const phase2Restrictions = [
    ...input.fase2_baseline_result.handoff_decision.restrictions,
    ...input.fase2_baseline_result.baseline_record.issue_manifest,
    ...input.fase2_baseline_result.phase3_opening_boundary_check.blockers,
  ];
  const restrictions = [...BASE_RESTRICTIONS, ...phase2Restrictions];

  if (!fase2Accepted) {
    restrictions.push("fase2_baseline_not_local_safe");
  }

  return unique(restrictions);
}

function sourceObjectRefs(input: RegistryCandidateLocalDryRunInput): string[] {
  return input.fase2_baseline_result.baseline_record.source_object_manifest.map(
    (item) => item.source_ref,
  );
}

function candidateStatusFor(
  fase2Accepted: boolean,
  restrictions: string[],
): RegistryCandidateStatus {
  if (!fase2Accepted) {
    return "candidate_blocked";
  }
  return restrictions.length > 0
    ? "candidate_ready_with_restrictions"
    : "candidate_ready_local";
}

function buildManifest(params: {
  input: RegistryCandidateLocalDryRunInput;
  sourceRefs: string[];
  status: RegistryCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): RegistryCandidateManifest {
  return {
    manifest_id: `REGISTRY_CANDIDATE_LOCAL_MANIFEST:${params.input.case_id}`,
    case_id: params.input.case_id,
    items: MODEL_KINDS.map((modelKind) =>
      buildManifestItem({
        input: params.input,
        modelKind,
        sourceRefs: params.sourceRefs,
        status: params.status,
        restrictions: params.restrictions,
        governanceIssueRefs: params.governanceIssueRefs,
      }),
    ),
    local_only: true,
    registry_real_created: false,
    audit_log: [
      {
        event: "registry_candidate_local_dry_run_created",
        registry_real_created: false,
        persisted: false,
      },
    ],
  };
}

function buildManifestItem(params: {
  input: RegistryCandidateLocalDryRunInput;
  modelKind: RegistryCandidateModelKind;
  sourceRefs: string[];
  status: RegistryCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): RegistryCandidateManifestItem {
  return {
    candidate_id: `REGISTRY_CANDIDATE_LOCAL_${params.modelKind}:${params.input.case_id}`,
    model_kind: params.modelKind,
    source_object_refs: params.sourceRefs,
    candidate_status: params.status,
    local_only: true,
    creates_registry_real: false,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildPMCandidate(
  input: RegistryCandidateLocalDryRunInput,
  status: RegistryCandidateStatus,
  restrictions: string[],
): PMRegistryCandidateLocal {
  const triggerCandidatePresent = hasAllowedDestination(input, "qa_audit");
  const targetStateCandidatePresent = hasAllowedDestination(
    input,
    "future_phase3_candidate",
  );

  return {
    pm_candidate_id: `PM_REGISTRY_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status:
      triggerCandidatePresent && targetStateCandidatePresent
        ? status
        : "not_enough_evidence",
    process_intention_candidate:
      "local_registry_candidate_projection_from_fase2_baseline_handoff",
    trigger_candidate_present: triggerCandidatePresent,
    target_state_candidate_present: targetStateCandidatePresent,
    support_process_boundary_preserved: true,
    creates_pm_registry_real: false,
    restrictions,
  };
}

function buildPFCandidate(
  input: RegistryCandidateLocalDryRunInput,
  status: RegistryCandidateStatus,
  restrictions: string[],
): PFRegistryCandidateLocal {
  const sequenceCandidatePresent = input.fase2_baseline_result.handoff_matrix.length > 0;
  const processStateCandidatePresent =
    input.fase2_baseline_result.baseline_record.state !== "draft";
  const timerCandidatePresent = hasSourceObject(
    input,
    "RuntimeEvidenceBundleReference",
  );

  return {
    pf_candidate_id: `PF_REGISTRY_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status:
      sequenceCandidatePresent &&
      processStateCandidatePresent &&
      timerCandidatePresent
        ? status
        : "not_enough_evidence",
    sequence_candidate_present: sequenceCandidatePresent,
    process_state_candidate_present: processStateCandidatePresent,
    timer_candidate_present: timerCandidatePresent,
    no_swimlane_contamination: true,
    creates_pf_registry_real: false,
    restrictions,
  };
}

function buildMoCCandidate(
  input: RegistryCandidateLocalDryRunInput,
  status: RegistryCandidateStatus,
  restrictions: string[],
): MoCRegistryCandidateLocal {
  const objectClassCandidatePresent =
    input.fase2_baseline_result.baseline_record.source_object_manifest.length >= 6;
  const relationshipCandidatePresent =
    input.fase2_baseline_result.inventory_update_candidate.objects_to_register_later
      .length > 0;

  return {
    moc_candidate_id: `MOC_REGISTRY_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status:
      objectClassCandidatePresent && relationshipCandidatePresent
        ? status
        : "not_enough_evidence",
    object_class_candidate_present: objectClassCandidatePresent,
    relationship_candidate_present: relationshipCandidatePresent,
    isa_boundary_preserved: true,
    no_database_reduction: true,
    creates_moc_registry_real: false,
    restrictions,
  };
}

function buildOLCCandidate(
  input: RegistryCandidateLocalDryRunInput,
  status: RegistryCandidateStatus,
  restrictions: string[],
): OLCRegistryCandidateLocal {
  const lifecycleObjectCandidatePresent = hasSourceObject(
    input,
    "ObjectCandidateLinkageCheck",
  );
  const stateCandidatePresent =
    input.fase2_baseline_result.baseline_record.source_object_manifest.every(
      (item) => item.source_state.length > 0,
    );
  const transitionCandidatePresent =
    input.fase2_baseline_result.handoff_decision.decision !== "handoff_blocked";

  return {
    olc_candidate_id: `OLC_REGISTRY_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status:
      lifecycleObjectCandidatePresent &&
      stateCandidatePresent &&
      transitionCandidatePresent
        ? status
        : "not_enough_evidence",
    lifecycle_object_candidate_present: lifecycleObjectCandidatePresent,
    state_candidate_present: stateCandidatePresent,
    transition_candidate_present: transitionCandidatePresent,
    external_stimulus_or_time_required: true,
    no_process_reduction: true,
    creates_olc_registry_real: false,
    restrictions,
  };
}

function buildReadinessCheck(
  input: RegistryCandidateLocalDryRunInput,
  fase2Accepted: boolean,
  restrictions: string[],
): RegistryReadinessCheckLocal {
  return {
    readiness_check_id: `REGISTRY_CANDIDATE_LOCAL_READINESS:${input.case_id}`,
    case_id: input.case_id,
    registry_candidate_ready_local: fase2Accepted,
    registry_real_ready: false,
    registry_creation_allowed: false,
    blocked_reasons: fase2Accepted ? [] : ["fase2_baseline_not_local_safe"],
    warnings: restrictions,
  };
}

function buildCrossModelPrecheck(
  input: RegistryCandidateLocalDryRunInput,
  fase2Accepted: boolean,
): CrossModelConsistencyPrecheckLocal {
  const hasSources =
    input.fase2_baseline_result.baseline_record.source_object_manifest.length >= 6;

  return {
    precheck_id: `REGISTRY_CANDIDATE_LOCAL_CROSS_MODEL_PRECHECK:${input.case_id}`,
    case_id: input.case_id,
    conformance_claimed: false,
    consistency_claimed: false,
    factual_precheck_possible: fase2Accepted && hasSources,
    temporal_precheck_possible:
      fase2Accepted &&
      hasSourceObject(input, "RuntimeEvidenceBundleReference") &&
      input.fase2_baseline_result.handoff_matrix.length > 0,
    structural_precheck_possible:
      fase2Accepted && hasSourceObject(input, "ObjectCandidateLinkageCheck"),
    composite_precheck_possible:
      fase2Accepted &&
      hasSources &&
      input.fase2_baseline_result.handoff_decision.decision !==
        "handoff_blocked",
    unresolved_model_links: [],
    rule: "precheck_only_return_to_reality_for_actual_correction",
  };
}

function buildBoundaryCheck(
  input: RegistryCandidateLocalDryRunInput,
): RegistryNoGoBoundaryCheckLocal {
  return {
    boundary_check_id: `REGISTRY_CANDIDATE_LOCAL_NO_GO_BOUNDARY:${input.case_id}`,
    case_id: input.case_id,
    registry_creation_allowed: false,
    ir_creation_allowed: false,
    export_creation_allowed: false,
    diagnosis_creation_allowed: false,
    phase3_real_opening_allowed: false,
    reason: "registry_candidate_dry_run_only",
  };
}

function hasAllowedDestination(
  input: RegistryCandidateLocalDryRunInput,
  destination: string,
): boolean {
  return input.fase2_baseline_result.handoff_decision.allowed_destinations.includes(
    destination as never,
  );
}

function hasSourceObject(
  input: RegistryCandidateLocalDryRunInput,
  objectName: string,
): boolean {
  return input.fase2_baseline_result.baseline_record.source_object_manifest.some(
    (item) => item.object_name === objectName,
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
