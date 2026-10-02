import type {
  DiagramConsistencyWarningManifestLocal,
  DiagramExportBoundaryCheckLocal,
  DiagramShapeReadinessCheckLocal,
  DiagrammingCandidateModelKind,
  DiagrammingCandidateStatus,
  DiagrammingExportCandidateLocalDryRunInput,
  DiagrammingExportCandidateLocalDryRunResult,
  DiagrammingExportCandidateManifest,
  DiagrammingExportCandidateManifestItem,
  MoCDiagramCandidateLocal,
  OLCDiagramCandidateLocal,
  PFDiagramCandidateLocal,
  PMDiagramCandidateLocal,
} from "./diagramming-export-candidate-local-dry-run-types";

const MODEL_KINDS: DiagrammingCandidateModelKind[] = ["PM", "PF", "MoC", "OLC"];

const BASE_RESTRICTIONS = [
  "diagramming_export_package_real_blocked",
  "export_code_package_blocked",
  "export_blocked",
  "diagram_file_generation_blocked",
  "ir_real_blocked",
  "registry_real_blocked",
  "diagnosis_blocked",
  "phase3_real_blocked",
  "production_parallel_real_blocked",
];

const NO_GO: DiagrammingExportCandidateLocalDryRunResult["no_go"] = {
  diagramming_export_package_real_created: false,
  export_code_package_created: false,
  export_created: false,
  diagram_file_created: false,
  mermaid_created: false,
  svg_created: false,
  png_created: false,
  drawio_created: false,
  bpmn_created: false,
  archimate_created: false,
  uml_created: false,
  ir_real_created: false,
  registry_real_created: false,
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

const MATERIALITY: DiagrammingExportCandidateLocalDryRunResult["materiality"] = {
  level: "diagramming_export_candidate_local_dry_run",
  local_only: true,
  production_integration: false,
  diagramming_export_package_real_created: false,
  next_authorization_required: true,
};

export function runDiagrammingExportCandidateLocalDryRun(
  input: DiagrammingExportCandidateLocalDryRunInput,
): DiagrammingExportCandidateLocalDryRunResult {
  const irAccepted = isIRCandidateAccepted(input);
  const restrictions = buildRestrictions(input, irAccepted);
  const governanceIssueRefs = unique([
    ...input.ir_candidate_result.governance_issue_refs,
    ...restrictions.map(
      (restriction) => `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_RESTRICTION:${restriction}`,
    ),
  ]);
  const status = diagramStatusFor(irAccepted, restrictions);

  const pm = buildPMDiagramCandidate(input, status, restrictions);
  const pf = buildPFDiagramCandidate(input, status, restrictions);
  const moc = buildMoCDiagramCandidate(input, status, restrictions);
  const olc = buildOLCDiagramCandidate(input, status, restrictions);

  return {
    ok: irAccepted,
    case_id: input.case_id,
    diagramming_export_candidate_manifest: buildManifest({
      input,
      status,
      restrictions,
      governanceIssueRefs,
    }),
    pm_diagram_candidate: pm,
    pf_diagram_candidate: pf,
    moc_diagram_candidate: moc,
    olc_diagram_candidate: olc,
    diagram_shape_readiness_check: buildShapeReadinessCheck({
      input,
      irAccepted,
      restrictions,
      pm,
      pf,
      moc,
      olc,
    }),
    diagram_consistency_warning_manifest: buildWarningManifest(input),
    diagram_export_boundary_check: buildBoundaryCheck(input),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: irAccepted ? undefined : "ir_candidate_not_local_safe",
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isIRCandidateAccepted(
  input: DiagrammingExportCandidateLocalDryRunInput,
): boolean {
  const ir = input.ir_candidate_result;

  return (
    ir.ok === true &&
    ir.materiality.local_only === true &&
    ir.materiality.ir_real_created === false &&
    ir.no_go.ir_real_created === false &&
    ir.no_go.registry_real_created === false &&
    ir.no_go.export_created === false &&
    ir.no_go.diagramming_export_package_created === false &&
    ir.no_go.export_code_package_created === false &&
    ir.no_go.conformance_claimed === false &&
    ir.no_go.consistency_claimed === false &&
    ir.no_go.models_auto_corrected === false
  );
}

function buildRestrictions(
  input: DiagrammingExportCandidateLocalDryRunInput,
  irAccepted: boolean,
): string[] {
  const irRestrictions = [
    ...input.ir_candidate_result.ir_shape_readiness_check.warnings,
    ...input.ir_candidate_result.pm_ir_projection_candidate.restrictions,
    ...input.ir_candidate_result.pf_ir_projection_candidate.restrictions,
    ...input.ir_candidate_result.moc_ir_projection_candidate.restrictions,
    ...input.ir_candidate_result.olc_ir_projection_candidate.restrictions,
  ];
  const restrictions = [...BASE_RESTRICTIONS, ...irRestrictions];

  if (!irAccepted) {
    restrictions.push("ir_candidate_not_local_safe");
  }

  return unique(restrictions);
}

function diagramStatusFor(
  irAccepted: boolean,
  restrictions: string[],
): DiagrammingCandidateStatus {
  if (!irAccepted) {
    return "diagram_candidate_blocked";
  }
  return restrictions.length > 0
    ? "diagram_candidate_ready_with_restrictions"
    : "diagram_candidate_ready_local";
}

function buildManifest(params: {
  input: DiagrammingExportCandidateLocalDryRunInput;
  status: DiagrammingCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): DiagrammingExportCandidateManifest {
  return {
    manifest_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_MANIFEST:${params.input.case_id}`,
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
    diagramming_export_package_real_created: false,
    audit_log: [
      {
        event: "diagramming_export_candidate_local_dry_run_created",
        diagramming_export_package_real_created: false,
        export_created: false,
        persisted: false,
      },
    ],
  };
}

function buildManifestItem(params: {
  input: DiagrammingExportCandidateLocalDryRunInput;
  modelKind: DiagrammingCandidateModelKind;
  status: DiagrammingCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): DiagrammingExportCandidateManifestItem {
  return {
    diagram_candidate_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_${params.modelKind}:${params.input.case_id}`,
    model_kind: params.modelKind,
    source_ir_candidate_ref: irCandidateRefFor(params.input, params.modelKind),
    candidate_status: params.status,
    local_only: true,
    creates_diagramming_export_package_real: false,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildPMDiagramCandidate(
  input: DiagrammingExportCandidateLocalDryRunInput,
  status: DiagrammingCandidateStatus,
  restrictions: string[],
): PMDiagramCandidateLocal {
  const source = input.ir_candidate_result.pm_ir_projection_candidate;
  const shapeReady =
    irCandidateReady(source.candidate_status) &&
    source.process_intention_present &&
    source.trigger_present &&
    source.target_state_present &&
    source.support_boundary_preserved;

  return {
    pm_diagram_candidate_id: `PM_DIAGRAM_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_pm_ir_candidate_ref: source.pm_ir_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_ir_candidate_evidence",
    diagram_kind: "process_map_candidate",
    intention_visible: source.process_intention_present,
    trigger_visible: source.trigger_present,
    target_state_visible: source.target_state_present,
    support_boundary_visible: source.support_boundary_preserved,
    creates_diagram_real: false,
    restrictions,
  };
}

function buildPFDiagramCandidate(
  input: DiagrammingExportCandidateLocalDryRunInput,
  status: DiagrammingCandidateStatus,
  restrictions: string[],
): PFDiagramCandidateLocal {
  const source = input.ir_candidate_result.pf_ir_projection_candidate;
  const shapeReady =
    irCandidateReady(source.candidate_status) &&
    source.sequence_present &&
    source.process_state_present &&
    source.timer_present &&
    source.no_swimlane_contamination;

  return {
    pf_diagram_candidate_id: `PF_DIAGRAM_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_pf_ir_candidate_ref: source.pf_ir_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_ir_candidate_evidence",
    diagram_kind: "process_flow_candidate",
    sequence_visible: source.sequence_present,
    process_state_visible: source.process_state_present,
    timer_visible: source.timer_present,
    no_swimlanes: true,
    creates_diagram_real: false,
    restrictions,
  };
}

function buildMoCDiagramCandidate(
  input: DiagrammingExportCandidateLocalDryRunInput,
  status: DiagrammingCandidateStatus,
  restrictions: string[],
): MoCDiagramCandidateLocal {
  const source = input.ir_candidate_result.moc_ir_projection_candidate;
  const shapeReady =
    irCandidateReady(source.candidate_status) &&
    source.object_class_present &&
    source.relationship_present &&
    source.isa_boundary_preserved &&
    source.no_database_reduction;

  return {
    moc_diagram_candidate_id: `MOC_DIAGRAM_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_moc_ir_candidate_ref: source.moc_ir_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_ir_candidate_evidence",
    diagram_kind: "model_of_concepts_candidate",
    object_classes_visible: source.object_class_present,
    relationships_visible: source.relationship_present,
    isa_boundary_visible: source.isa_boundary_preserved,
    no_database_reduction: true,
    creates_diagram_real: false,
    restrictions,
  };
}

function buildOLCDiagramCandidate(
  input: DiagrammingExportCandidateLocalDryRunInput,
  status: DiagrammingCandidateStatus,
  restrictions: string[],
): OLCDiagramCandidateLocal {
  const source = input.ir_candidate_result.olc_ir_projection_candidate;
  const shapeReady =
    irCandidateReady(source.candidate_status) &&
    source.lifecycle_object_present &&
    source.state_present &&
    source.transition_present &&
    source.external_stimulus_or_time_required &&
    source.no_process_reduction;

  return {
    olc_diagram_candidate_id: `OLC_DIAGRAM_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    source_olc_ir_candidate_ref: source.olc_ir_candidate_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_ir_candidate_evidence",
    diagram_kind: "object_life_cycle_candidate",
    lifecycle_object_visible: source.lifecycle_object_present,
    states_visible: source.state_present,
    transitions_visible: source.transition_present,
    stimulus_or_time_visible: source.external_stimulus_or_time_required,
    no_process_reduction: true,
    creates_diagram_real: false,
    restrictions,
  };
}

function buildShapeReadinessCheck(params: {
  input: DiagrammingExportCandidateLocalDryRunInput;
  irAccepted: boolean;
  restrictions: string[];
  pm: PMDiagramCandidateLocal;
  pf: PFDiagramCandidateLocal;
  moc: MoCDiagramCandidateLocal;
  olc: OLCDiagramCandidateLocal;
}): DiagramShapeReadinessCheckLocal {
  const shapeChecks = {
    pm_diagram_candidate_present:
      params.pm.candidate_status !== "not_enough_ir_candidate_evidence",
    pf_diagram_candidate_present:
      params.pf.candidate_status !== "not_enough_ir_candidate_evidence",
    moc_diagram_candidate_present:
      params.moc.candidate_status !== "not_enough_ir_candidate_evidence",
    olc_diagram_candidate_present:
      params.olc.candidate_status !== "not_enough_ir_candidate_evidence",
  };
  const allShapesPresent = Object.values(shapeChecks).every(Boolean);

  return {
    readiness_check_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_READINESS:${params.input.case_id}`,
    case_id: params.input.case_id,
    diagram_candidate_ready_local: params.irAccepted && allShapesPresent,
    diagramming_export_package_real_ready: false,
    diagramming_export_package_creation_allowed: false,
    shape_checks: shapeChecks,
    blocked_reasons:
      params.irAccepted && allShapesPresent
        ? []
        : ["ir_candidate_not_local_safe_or_diagram_shape_incomplete"],
    warnings: params.restrictions,
  };
}

function buildWarningManifest(
  input: DiagrammingExportCandidateLocalDryRunInput,
): DiagramConsistencyWarningManifestLocal {
  return {
    warning_manifest_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_WARNINGS:${input.case_id}`,
    case_id: input.case_id,
    conformance_claimed: false,
    consistency_claimed: false,
    diagramming_claimed: false,
    warnings: [
      {
        warning_id: `DIAGRAM_WARNING:${input.case_id}:precheck_only`,
        model_kind: "CROSS_MODEL",
        warning_type: "precheck_only",
        severity: "info",
        message: "Diagramming output is candidate-only and remains a local dry-run.",
      },
      {
        warning_id: `DIAGRAM_WARNING:${input.case_id}:no_conformance_claim`,
        model_kind: "CROSS_MODEL",
        warning_type: "no_conformance_claim",
        severity: "info",
        message: "No conformance claim is made by this diagramming candidate.",
      },
      {
        warning_id: `DIAGRAM_WARNING:${input.case_id}:no_consistency_claim`,
        model_kind: "CROSS_MODEL",
        warning_type: "no_consistency_claim",
        severity: "info",
        message: "No final consistency claim is made by this diagramming candidate.",
      },
      {
        warning_id: `DIAGRAM_WARNING:${input.case_id}:no_model_autocorrection`,
        model_kind: "CROSS_MODEL",
        warning_type: "no_model_autocorrection",
        severity: "info",
        message: "No model auto-correction is performed.",
      },
      {
        warning_id: `DIAGRAM_WARNING:${input.case_id}:no_export_generation`,
        model_kind: "CROSS_MODEL",
        warning_type: "no_export_generation",
        severity: "info",
        message: "No exportable diagram, package, or file is generated.",
      },
    ],
    rule: "diagram_candidate_only_no_export_no_conformance_no_consistency_claim",
  };
}

function buildBoundaryCheck(
  input: DiagrammingExportCandidateLocalDryRunInput,
): DiagramExportBoundaryCheckLocal {
  return {
    boundary_check_id: `DIAGRAMMING_EXPORT_CANDIDATE_LOCAL_BOUNDARY:${input.case_id}`,
    case_id: input.case_id,
    diagramming_export_package_creation_allowed: false,
    export_code_package_allowed: false,
    export_creation_allowed: false,
    ir_creation_allowed: false,
    registry_creation_allowed: false,
    diagnosis_creation_allowed: false,
    phase3_real_opening_allowed: false,
    reason: "diagramming_export_candidate_dry_run_only",
  };
}

function irCandidateReady(status: string): boolean {
  return (
    status === "ir_candidate_ready_local" ||
    status === "ir_candidate_ready_with_restrictions"
  );
}

function irCandidateRefFor(
  input: DiagrammingExportCandidateLocalDryRunInput,
  modelKind: DiagrammingCandidateModelKind,
): string {
  switch (modelKind) {
    case "PM":
      return input.ir_candidate_result.pm_ir_projection_candidate
        .pm_ir_candidate_id;
    case "PF":
      return input.ir_candidate_result.pf_ir_projection_candidate
        .pf_ir_candidate_id;
    case "MoC":
      return input.ir_candidate_result.moc_ir_projection_candidate
        .moc_ir_candidate_id;
    case "OLC":
      return input.ir_candidate_result.olc_ir_projection_candidate
        .olc_ir_candidate_id;
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
