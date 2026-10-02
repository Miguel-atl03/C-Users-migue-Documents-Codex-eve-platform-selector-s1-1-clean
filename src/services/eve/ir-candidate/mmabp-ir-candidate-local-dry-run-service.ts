import type {
  IRCrossModelTraceabilityPrecheckLocal,
  IRNoGoBoundaryCheckLocal,
  IRShapeReadinessCheckLocal,
  MMABPIRCandidateLocalDryRunInput,
  MMABPIRCandidateLocalDryRunResult,
  MMABPIRCandidateManifest,
  MMABPIRCandidateManifestItem,
  MMABPIRCandidateModelKind,
  MMABPIRCandidateStatus,
  MoCIRProjectionCandidateLocal,
  OLCIRProjectionCandidateLocal,
  PFIRProjectionCandidateLocal,
  PMIRProjectionCandidateLocal,
} from "./mmabp-ir-candidate-local-dry-run-types";

const MODEL_KINDS: MMABPIRCandidateModelKind[] = ["PM", "PF", "MoC", "OLC"];

const BASE_RESTRICTIONS = [
  "ir_real_blocked",
  "registry_real_blocked",
  "export_blocked",
  "diagramming_export_package_blocked",
  "export_code_package_blocked",
  "diagnosis_blocked",
  "phase3_real_blocked",
  "production_parallel_real_blocked",
];

const NO_GO: MMABPIRCandidateLocalDryRunResult["no_go"] = {
  ir_real_created: false,
  registry_real_created: false,
  pm_registry_real_created: false,
  pf_registry_real_created: false,
  moc_registry_real_created: false,
  olc_registry_real_created: false,
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

const MATERIALITY: MMABPIRCandidateLocalDryRunResult["materiality"] = {
  level: "mmabp_ir_candidate_local_dry_run",
  local_only: true,
  production_integration: false,
  ir_real_created: false,
  next_authorization_required: true,
};

export function runMMABPIRCandidateLocalDryRun(
  input: MMABPIRCandidateLocalDryRunInput,
): MMABPIRCandidateLocalDryRunResult {
  const registryAccepted = isRegistryCandidateAccepted(input);
  const restrictions = buildRestrictions(input, registryAccepted);
  const governanceIssueRefs = unique([
    ...input.registry_candidate_result.governance_issue_refs,
    ...restrictions.map(
      (restriction) => `MMABP_IR_CANDIDATE_LOCAL_RESTRICTION:${restriction}`,
    ),
  ]);
  const status = irStatusFor(registryAccepted, restrictions);

  const pm = buildPMProjection(input, status, restrictions);
  const pf = buildPFProjection(input, status, restrictions);
  const moc = buildMoCProjection(input, status, restrictions);
  const olc = buildOLCProjection(input, status, restrictions);

  return {
    ok: registryAccepted,
    case_id: input.case_id,
    ir_candidate_manifest: buildManifest({
      input,
      status,
      restrictions,
      governanceIssueRefs,
    }),
    pm_ir_projection_candidate: pm,
    pf_ir_projection_candidate: pf,
    moc_ir_projection_candidate: moc,
    olc_ir_projection_candidate: olc,
    ir_shape_readiness_check: buildShapeReadinessCheck({
      input,
      registryAccepted,
      restrictions,
      pm,
      pf,
      moc,
      olc,
    }),
    ir_cross_model_traceability_precheck: buildTraceabilityPrecheck({
      input,
      registryAccepted,
      pm,
      pf,
      moc,
      olc,
    }),
    ir_no_go_boundary_check: buildBoundaryCheck(input),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: registryAccepted
      ? undefined
      : "registry_candidate_not_local_safe",
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isRegistryCandidateAccepted(
  input: MMABPIRCandidateLocalDryRunInput,
): boolean {
  const registry = input.registry_candidate_result;

  return (
    registry.ok === true &&
    registry.materiality.local_only === true &&
    registry.materiality.registry_real_created === false &&
    registry.no_go.registry_real_created === false &&
    registry.no_go.ir_created === false &&
    registry.no_go.export_created === false &&
    registry.no_go.conformance_claimed === false &&
    registry.no_go.consistency_claimed === false &&
    registry.no_go.models_auto_corrected === false
  );
}

function buildRestrictions(
  input: MMABPIRCandidateLocalDryRunInput,
  registryAccepted: boolean,
): string[] {
  const registryRestrictions = [
    ...input.registry_candidate_result.registry_readiness_check.warnings,
    ...input.registry_candidate_result.pm_registry_candidate.restrictions,
    ...input.registry_candidate_result.pf_registry_candidate.restrictions,
    ...input.registry_candidate_result.moc_registry_candidate.restrictions,
    ...input.registry_candidate_result.olc_registry_candidate.restrictions,
  ];
  const restrictions = [...BASE_RESTRICTIONS, ...registryRestrictions];

  if (!registryAccepted) {
    restrictions.push("registry_candidate_not_local_safe");
  }

  return unique(restrictions);
}

function irStatusFor(
  registryAccepted: boolean,
  restrictions: string[],
): MMABPIRCandidateStatus {
  if (!registryAccepted) {
    return "ir_candidate_blocked";
  }
  return restrictions.length > 0
    ? "ir_candidate_ready_with_restrictions"
    : "ir_candidate_ready_local";
}

function buildManifest(params: {
  input: MMABPIRCandidateLocalDryRunInput;
  status: MMABPIRCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): MMABPIRCandidateManifest {
  return {
    manifest_id: `MMABP_IR_CANDIDATE_LOCAL_MANIFEST:${params.input.case_id}`,
    case_id: params.input.case_id,
    items: MODEL_KINDS.map((modelKind) =>
      buildManifestItem({
        input: params.input,
        modelKind,
        status: params.status,
        restrictions: params.restrictions,
        governanceIssueRefs: params.governanceIssueRefs,
      }),
    ),
    local_only: true,
    ir_real_created: false,
    audit_log: [
      {
        event: "mmabp_ir_candidate_local_dry_run_created",
        ir_real_created: false,
        persisted: false,
      },
    ],
  };
}

function buildManifestItem(params: {
  input: MMABPIRCandidateLocalDryRunInput;
  modelKind: MMABPIRCandidateModelKind;
  status: MMABPIRCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): MMABPIRCandidateManifestItem {
  return {
    ir_candidate_id: `MMABP_IR_CANDIDATE_LOCAL_${params.modelKind}:${params.input.case_id}`,
    model_kind: params.modelKind,
    source_registry_candidate_ref: registryCandidateRefFor(
      params.input,
      params.modelKind,
    ),
    candidate_status: params.status,
    local_only: true,
    creates_ir_real: false,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildPMProjection(
  input: MMABPIRCandidateLocalDryRunInput,
  status: MMABPIRCandidateStatus,
  restrictions: string[],
): PMIRProjectionCandidateLocal {
  const source = input.registry_candidate_result.pm_registry_candidate;
  const shapeReady =
    registryCandidateReady(source.candidate_status) &&
    source.process_intention_candidate.length > 0 &&
    source.trigger_candidate_present &&
    source.target_state_candidate_present &&
    source.support_process_boundary_preserved;

  return {
    pm_ir_candidate_id: `PM_IR_PROJECTION_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_pm_registry_candidate_ref: source.pm_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_registry_candidate_evidence",
    process_map_shape_candidate_present: shapeReady,
    process_intention_present: source.process_intention_candidate.length > 0,
    trigger_present: source.trigger_candidate_present,
    target_state_present: source.target_state_candidate_present,
    support_boundary_preserved: source.support_process_boundary_preserved,
    creates_ir_real: false,
    restrictions,
  };
}

function buildPFProjection(
  input: MMABPIRCandidateLocalDryRunInput,
  status: MMABPIRCandidateStatus,
  restrictions: string[],
): PFIRProjectionCandidateLocal {
  const source = input.registry_candidate_result.pf_registry_candidate;
  const shapeReady =
    registryCandidateReady(source.candidate_status) &&
    source.sequence_candidate_present &&
    source.process_state_candidate_present &&
    source.timer_candidate_present &&
    source.no_swimlane_contamination;

  return {
    pf_ir_candidate_id: `PF_IR_PROJECTION_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_pf_registry_candidate_ref: source.pf_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_registry_candidate_evidence",
    process_flow_shape_candidate_present: shapeReady,
    sequence_present: source.sequence_candidate_present,
    process_state_present: source.process_state_candidate_present,
    timer_present: source.timer_candidate_present,
    no_swimlane_contamination: source.no_swimlane_contamination,
    creates_ir_real: false,
    restrictions,
  };
}

function buildMoCProjection(
  input: MMABPIRCandidateLocalDryRunInput,
  status: MMABPIRCandidateStatus,
  restrictions: string[],
): MoCIRProjectionCandidateLocal {
  const source = input.registry_candidate_result.moc_registry_candidate;
  const shapeReady =
    registryCandidateReady(source.candidate_status) &&
    source.object_class_candidate_present &&
    source.relationship_candidate_present &&
    source.isa_boundary_preserved &&
    source.no_database_reduction;

  return {
    moc_ir_candidate_id: `MOC_IR_PROJECTION_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_moc_registry_candidate_ref: source.moc_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_registry_candidate_evidence",
    model_of_concepts_shape_candidate_present: shapeReady,
    object_class_present: source.object_class_candidate_present,
    relationship_present: source.relationship_candidate_present,
    isa_boundary_preserved: source.isa_boundary_preserved,
    no_database_reduction: source.no_database_reduction,
    creates_ir_real: false,
    restrictions,
  };
}

function buildOLCProjection(
  input: MMABPIRCandidateLocalDryRunInput,
  status: MMABPIRCandidateStatus,
  restrictions: string[],
): OLCIRProjectionCandidateLocal {
  const source = input.registry_candidate_result.olc_registry_candidate;
  const shapeReady =
    registryCandidateReady(source.candidate_status) &&
    source.lifecycle_object_candidate_present &&
    source.state_candidate_present &&
    source.transition_candidate_present &&
    source.external_stimulus_or_time_required &&
    source.no_process_reduction;

  return {
    olc_ir_candidate_id: `OLC_IR_PROJECTION_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_olc_registry_candidate_ref: source.olc_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_registry_candidate_evidence",
    object_life_cycle_shape_candidate_present: shapeReady,
    lifecycle_object_present: source.lifecycle_object_candidate_present,
    state_present: source.state_candidate_present,
    transition_present: source.transition_candidate_present,
    external_stimulus_or_time_required: source.external_stimulus_or_time_required,
    no_process_reduction: source.no_process_reduction,
    creates_ir_real: false,
    restrictions,
  };
}

function buildShapeReadinessCheck(params: {
  input: MMABPIRCandidateLocalDryRunInput;
  registryAccepted: boolean;
  restrictions: string[];
  pm: PMIRProjectionCandidateLocal;
  pf: PFIRProjectionCandidateLocal;
  moc: MoCIRProjectionCandidateLocal;
  olc: OLCIRProjectionCandidateLocal;
}): IRShapeReadinessCheckLocal {
  const shapeChecks = {
    pm_shape_candidate_present:
      params.pm.process_map_shape_candidate_present,
    pf_shape_candidate_present:
      params.pf.process_flow_shape_candidate_present,
    moc_shape_candidate_present:
      params.moc.model_of_concepts_shape_candidate_present,
    olc_shape_candidate_present:
      params.olc.object_life_cycle_shape_candidate_present,
  };
  const allShapesPresent = Object.values(shapeChecks).every(Boolean);

  return {
    readiness_check_id: `MMABP_IR_CANDIDATE_LOCAL_READINESS:${params.input.case_id}`,
    case_id: params.input.case_id,
    ir_candidate_ready_local: params.registryAccepted && allShapesPresent,
    ir_real_ready: false,
    ir_creation_allowed: false,
    shape_checks: shapeChecks,
    blocked_reasons:
      params.registryAccepted && allShapesPresent
        ? []
        : ["registry_candidate_not_local_safe_or_shape_incomplete"],
    warnings: params.restrictions,
  };
}

function buildTraceabilityPrecheck(params: {
  input: MMABPIRCandidateLocalDryRunInput;
  registryAccepted: boolean;
  pm: PMIRProjectionCandidateLocal;
  pf: PFIRProjectionCandidateLocal;
  moc: MoCIRProjectionCandidateLocal;
  olc: OLCIRProjectionCandidateLocal;
}): IRCrossModelTraceabilityPrecheckLocal {
  const pmToPf = params.pm.trigger_present && params.pf.sequence_present;
  const pfToMoc = params.pf.process_state_present && params.moc.object_class_present;
  const pfToOlc = params.pf.timer_present && params.olc.transition_present;
  const mocToOlc =
    params.moc.relationship_present && params.olc.lifecycle_object_present;
  const unresolved = unresolvedLinks([
    ["pm_to_pf", pmToPf],
    ["pf_to_moc", pfToMoc],
    ["pf_to_olc", pfToOlc],
    ["moc_to_olc", mocToOlc],
  ]);

  return {
    precheck_id: `MMABP_IR_CANDIDATE_LOCAL_TRACEABILITY_PRECHECK:${params.input.case_id}`,
    case_id: params.input.case_id,
    conformance_claimed: false,
    consistency_claimed: false,
    traceability_precheck_possible:
      params.registryAccepted && unresolved.length === 0,
    pm_to_pf_link_candidate_present: pmToPf,
    pf_to_moc_link_candidate_present: pfToMoc,
    pf_to_olc_link_candidate_present: pfToOlc,
    moc_to_olc_link_candidate_present: mocToOlc,
    unresolved_traceability_links: unresolved,
    rule: "ir_precheck_only_no_conformance_no_consistency_claim",
  };
}

function buildBoundaryCheck(
  input: MMABPIRCandidateLocalDryRunInput,
): IRNoGoBoundaryCheckLocal {
  return {
    boundary_check_id: `MMABP_IR_CANDIDATE_LOCAL_NO_GO_BOUNDARY:${input.case_id}`,
    case_id: input.case_id,
    ir_creation_allowed: false,
    registry_creation_allowed: false,
    export_creation_allowed: false,
    diagramming_export_package_allowed: false,
    export_code_package_allowed: false,
    diagnosis_creation_allowed: false,
    phase3_real_opening_allowed: false,
    reason: "ir_candidate_dry_run_only",
  };
}

function registryCandidateReady(status: string): boolean {
  return (
    status === "candidate_ready_local" ||
    status === "candidate_ready_with_restrictions"
  );
}

function registryCandidateRefFor(
  input: MMABPIRCandidateLocalDryRunInput,
  modelKind: MMABPIRCandidateModelKind,
): string {
  switch (modelKind) {
    case "PM":
      return input.registry_candidate_result.pm_registry_candidate.pm_candidate_id;
    case "PF":
      return input.registry_candidate_result.pf_registry_candidate.pf_candidate_id;
    case "MoC":
      return input.registry_candidate_result.moc_registry_candidate
        .moc_candidate_id;
    case "OLC":
      return input.registry_candidate_result.olc_registry_candidate
        .olc_candidate_id;
  }
}

function unresolvedLinks(entries: Array<[string, boolean]>): string[] {
  return entries
    .filter(([, present]) => !present)
    .map(([linkName]) => linkName);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
