import type {
  ExportAuditWarningManifestLocal,
  ExportCandidateFormat,
  ExportCodePackageCandidateLocalDryRunInput,
  ExportCodePackageCandidateLocalDryRunResult,
  ExportCodePackageCandidateManifest,
  ExportCodePackageCandidateManifestItem,
  ExportCodePackageCandidateStatus,
  ExportFileSetCandidateLocal,
  ExportFormatReadinessCheckLocal,
  ExportNoGoBoundaryCheckLocal,
  ExportPayloadShapeCandidateLocal,
  ExportTargetBoundaryCheckLocal,
} from "./export-code-package-candidate-local-dry-run-types";

const CANDIDATE_FORMATS: ExportCandidateFormat[] = [
  "json_manifest_candidate",
  "markdown_manifest_candidate",
  "diagram_payload_candidate",
  "traceability_payload_candidate",
];

const ALLOWED_TARGETS: ExportTargetBoundaryCheckLocal["allowed_targets"] = [
  "qa_audit",
  "control_plane_summary",
  "future_export_candidate",
];

const BLOCKED_TARGETS: ExportTargetBoundaryCheckLocal["blocked_targets"] = [
  "download",
  "client_delivery",
  "production_export",
  "registry_real",
  "ir_real",
  "diagnosis",
  "delivered",
];

const BASE_RESTRICTIONS = [
  "export_code_package_real_blocked",
  "export_blocked",
  "export_file_generation_blocked",
  "zip_generation_blocked",
  "diagramming_export_package_real_blocked",
  "diagram_file_generation_blocked",
  "ir_real_blocked",
  "registry_real_blocked",
  "diagnosis_blocked",
  "delivery_blocked",
  "phase3_real_blocked",
  "production_parallel_real_blocked",
];

const NO_GO: ExportCodePackageCandidateLocalDryRunResult["no_go"] = {
  export_code_package_real_created: false,
  export_created: false,
  export_file_created: false,
  zip_created: false,
  diagramming_export_package_real_created: false,
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
  client_delivery_created: false,
  download_created: false,
  phase3_real_opened: false,
  production_parallel_real_opened: false,
  conformance_claimed: false,
  consistency_claimed: false,
  diagramming_claimed: false,
  export_claimed: false,
  delivery_claimed: false,
  models_auto_corrected: false,
  readiness_mutated: false,
  core_state_mutated: false,
  mba_written: false,
  parallel_production_artifacts_written: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: ExportCodePackageCandidateLocalDryRunResult["materiality"] = {
  level: "export_code_package_candidate_local_dry_run",
  local_only: true,
  production_integration: false,
  export_code_package_real_created: false,
  next_authorization_required: true,
};

export function runExportCodePackageCandidateLocalDryRun(
  input: ExportCodePackageCandidateLocalDryRunInput,
): ExportCodePackageCandidateLocalDryRunResult {
  const diagrammingAccepted = isDiagrammingCandidateAccepted(input);
  const restrictions = buildRestrictions(input, diagrammingAccepted);
  const governanceIssueRefs = unique([
    ...input.diagramming_candidate_result.governance_issue_refs,
    ...restrictions.map(
      (restriction) => `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_RESTRICTION:${restriction}`,
    ),
  ]);
  const status = exportStatusFor(diagrammingAccepted, restrictions);
  const manifest = buildManifest({
    input,
    status,
    restrictions,
    governanceIssueRefs,
  });
  const payload = buildPayloadShapeCandidate(input, status, restrictions);
  const fileSet = buildFileSetCandidate(input, status, restrictions);

  return {
    ok: diagrammingAccepted,
    case_id: input.case_id,
    export_code_package_candidate_manifest: manifest,
    export_payload_shape_candidate: payload,
    export_file_set_candidate: fileSet,
    export_target_boundary_check: buildTargetBoundaryCheck(input),
    export_format_readiness_check: buildFormatReadinessCheck({
      input,
      diagrammingAccepted,
      restrictions,
      manifest,
      payload,
    }),
    export_no_go_boundary_check: buildNoGoBoundaryCheck(input),
    export_audit_warning_manifest: buildAuditWarningManifest(input),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: diagrammingAccepted
      ? undefined
      : "diagramming_candidate_not_local_safe",
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isDiagrammingCandidateAccepted(
  input: ExportCodePackageCandidateLocalDryRunInput,
): boolean {
  const diagramming = input.diagramming_candidate_result;
  const noGo = diagramming.no_go as typeof diagramming.no_go & {
    diagramming_claimed?: boolean;
  };

  return (
    diagramming.ok === true &&
    diagramming.materiality.local_only === true &&
    diagramming.materiality.diagramming_export_package_real_created === false &&
    diagramming.no_go.diagramming_export_package_real_created === false &&
    diagramming.no_go.export_code_package_created === false &&
    diagramming.no_go.export_created === false &&
    diagramming.no_go.diagram_file_created === false &&
    diagramming.no_go.ir_real_created === false &&
    diagramming.no_go.registry_real_created === false &&
    diagramming.no_go.conformance_claimed === false &&
    diagramming.no_go.consistency_claimed === false &&
    noGo.diagramming_claimed !== true &&
    diagramming.no_go.models_auto_corrected === false
  );
}

function buildRestrictions(
  input: ExportCodePackageCandidateLocalDryRunInput,
  diagrammingAccepted: boolean,
): string[] {
  const diagrammingRestrictions = [
    ...input.diagramming_candidate_result.diagram_shape_readiness_check.warnings,
    ...input.diagramming_candidate_result.pm_diagram_candidate.restrictions,
    ...input.diagramming_candidate_result.pf_diagram_candidate.restrictions,
    ...input.diagramming_candidate_result.moc_diagram_candidate.restrictions,
    ...input.diagramming_candidate_result.olc_diagram_candidate.restrictions,
  ];
  const restrictions = [...BASE_RESTRICTIONS, ...diagrammingRestrictions];

  if (!diagrammingAccepted) {
    restrictions.push("diagramming_candidate_not_local_safe");
  }

  return unique(restrictions);
}

function exportStatusFor(
  diagrammingAccepted: boolean,
  restrictions: string[],
): ExportCodePackageCandidateStatus {
  if (!diagrammingAccepted) {
    return "export_package_candidate_blocked";
  }
  return restrictions.length > 0
    ? "export_package_candidate_ready_with_restrictions"
    : "export_package_candidate_ready_local";
}

function buildManifest(params: {
  input: ExportCodePackageCandidateLocalDryRunInput;
  status: ExportCodePackageCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): ExportCodePackageCandidateManifest {
  return {
    manifest_id: `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_MANIFEST:${params.input.case_id}`,
    case_id: params.input.case_id,
    items: CANDIDATE_FORMATS.map((format) =>
      buildManifestItem({
        input: params.input,
        format,
        status: params.status,
        restrictions: params.restrictions,
        governanceIssueRefs: params.governanceIssueRefs,
      }),
    ),
    local_only: true,
    export_code_package_real_created: false,
    export_real_created: false,
    audit_log: [
      {
        event: "export_code_package_candidate_local_dry_run_created",
        export_code_package_real_created: false,
        export_created: false,
        files_created: false,
        zip_created: false,
      },
    ],
  };
}

function buildManifestItem(params: {
  input: ExportCodePackageCandidateLocalDryRunInput;
  format: ExportCandidateFormat;
  status: ExportCodePackageCandidateStatus;
  restrictions: string[];
  governanceIssueRefs: string[];
}): ExportCodePackageCandidateManifestItem {
  return {
    export_candidate_id: `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_${params.format}:${params.input.case_id}`,
    source_diagram_candidate_ref: sourceDiagramCandidateRefFor(
      params.input,
      params.format,
    ),
    candidate_status: params.status,
    candidate_format: params.format,
    local_only: true,
    creates_export_code_package_real: false,
    creates_file_real: false,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildPayloadShapeCandidate(
  input: ExportCodePackageCandidateLocalDryRunInput,
  status: ExportCodePackageCandidateStatus,
  restrictions: string[],
): ExportPayloadShapeCandidateLocal {
  const manifestShapePresent =
    input.diagramming_candidate_result.diagramming_export_candidate_manifest.items
      .length >= 4;
  const traceabilityShapePresent =
    input.diagramming_candidate_result.diagram_consistency_warning_manifest
      .warnings.length > 0;
  const diagramPayloadShapePresent =
    input.diagramming_candidate_result.diagram_shape_readiness_check
      .diagram_candidate_ready_local === true;
  const shapeReady =
    manifestShapePresent &&
    traceabilityShapePresent &&
    diagramPayloadShapePresent;

  return {
    payload_shape_candidate_id: `EXPORT_PAYLOAD_SHAPE_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status: shapeReady
      ? status
      : "not_enough_diagramming_candidate_evidence",
    manifest_shape_present: manifestShapePresent,
    traceability_shape_present: traceabilityShapePresent,
    diagram_payload_shape_present: diagramPayloadShapePresent,
    no_real_file_payload: true,
    creates_export_payload_real: false,
    restrictions,
  };
}

function buildFileSetCandidate(
  input: ExportCodePackageCandidateLocalDryRunInput,
  status: ExportCodePackageCandidateStatus,
  restrictions: string[],
): ExportFileSetCandidateLocal {
  return {
    file_set_candidate_id: `EXPORT_FILE_SET_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    candidate_status: status,
    candidate_files_declared: CANDIDATE_FORMATS.map((format) => ({
      virtual_filename: virtualFilenameFor(input.case_id, format),
      format,
      would_be_generated_later: true,
      generated_now: false,
    })),
    zip_created: false,
    files_created: false,
    creates_export_code_package_real: false,
    restrictions,
  };
}

function buildTargetBoundaryCheck(
  input: ExportCodePackageCandidateLocalDryRunInput,
): ExportTargetBoundaryCheckLocal {
  return {
    target_boundary_check_id: `EXPORT_TARGET_BOUNDARY_CANDIDATE_LOCAL:${input.case_id}`,
    case_id: input.case_id,
    allowed_targets: ALLOWED_TARGETS,
    blocked_targets: BLOCKED_TARGETS,
    production_export_allowed: false,
    client_delivery_allowed: false,
    download_allowed: false,
    reason: "export_target_candidate_only",
  };
}

function buildFormatReadinessCheck(params: {
  input: ExportCodePackageCandidateLocalDryRunInput;
  diagrammingAccepted: boolean;
  restrictions: string[];
  manifest: ExportCodePackageCandidateManifest;
  payload: ExportPayloadShapeCandidateLocal;
}): ExportFormatReadinessCheckLocal {
  const formats = params.manifest.items.map((item) => item.candidate_format);
  const formatChecks = {
    json_manifest_candidate_present: formats.includes("json_manifest_candidate"),
    markdown_manifest_candidate_present: formats.includes(
      "markdown_manifest_candidate",
    ),
    diagram_payload_candidate_present:
      formats.includes("diagram_payload_candidate") &&
      params.payload.diagram_payload_shape_present,
    traceability_payload_candidate_present:
      formats.includes("traceability_payload_candidate") &&
      params.payload.traceability_shape_present,
  };
  const allFormatsPresent = Object.values(formatChecks).every(Boolean);

  return {
    readiness_check_id: `EXPORT_FORMAT_READINESS_CANDIDATE_LOCAL:${params.input.case_id}`,
    case_id: params.input.case_id,
    export_package_candidate_ready_local:
      params.diagrammingAccepted && allFormatsPresent,
    export_code_package_real_ready: false,
    export_code_package_creation_allowed: false,
    format_checks: formatChecks,
    blocked_reasons:
      params.diagrammingAccepted && allFormatsPresent
        ? []
        : ["diagramming_candidate_not_local_safe_or_format_incomplete"],
    warnings: params.restrictions,
  };
}

function buildNoGoBoundaryCheck(
  input: ExportCodePackageCandidateLocalDryRunInput,
): ExportNoGoBoundaryCheckLocal {
  return {
    boundary_check_id: `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_NO_GO_BOUNDARY:${input.case_id}`,
    case_id: input.case_id,
    export_code_package_creation_allowed: false,
    export_creation_allowed: false,
    diagramming_export_package_creation_allowed: false,
    ir_creation_allowed: false,
    registry_creation_allowed: false,
    diagnosis_creation_allowed: false,
    delivery_allowed: false,
    phase3_real_opening_allowed: false,
    reason: "export_code_package_candidate_dry_run_only",
  };
}

function buildAuditWarningManifest(
  input: ExportCodePackageCandidateLocalDryRunInput,
): ExportAuditWarningManifestLocal {
  return {
    warning_manifest_id: `EXPORT_CODE_PACKAGE_CANDIDATE_LOCAL_WARNINGS:${input.case_id}`,
    case_id: input.case_id,
    conformance_claimed: false,
    consistency_claimed: false,
    diagramming_claimed: false,
    export_claimed: false,
    delivery_claimed: false,
    warnings: [
      warning(input.case_id, "precheck_only", "Export package is candidate-only."),
      warning(
        input.case_id,
        "no_conformance_claim",
        "No conformance claim is made by this export candidate.",
      ),
      warning(
        input.case_id,
        "no_consistency_claim",
        "No final consistency claim is made by this export candidate.",
      ),
      warning(
        input.case_id,
        "no_diagramming_claim",
        "No final diagramming claim is made by this export candidate.",
      ),
      warning(
        input.case_id,
        "no_export_generation",
        "No export is generated by this local dry-run.",
      ),
      warning(
        input.case_id,
        "no_file_generation",
        "No exportable file or ZIP is generated.",
      ),
      warning(input.case_id, "no_delivery", "No delivery or download is created."),
    ],
    rule: "export_code_package_candidate_only_no_file_no_export_no_delivery",
  };
}

function warning(
  caseId: string,
  warningType: ExportAuditWarningManifestLocal["warnings"][number]["warning_type"],
  message: string,
): ExportAuditWarningManifestLocal["warnings"][number] {
  return {
    warning_id: `EXPORT_WARNING:${caseId}:${warningType}`,
    warning_type: warningType,
    severity: "info",
    message,
  };
}

function sourceDiagramCandidateRefFor(
  input: ExportCodePackageCandidateLocalDryRunInput,
  format: ExportCandidateFormat,
): string {
  switch (format) {
    case "json_manifest_candidate":
      return input.diagramming_candidate_result.diagramming_export_candidate_manifest
        .manifest_id;
    case "markdown_manifest_candidate":
      return input.diagramming_candidate_result.diagram_consistency_warning_manifest
        .warning_manifest_id;
    case "diagram_payload_candidate":
      return input.diagramming_candidate_result.diagram_shape_readiness_check
        .readiness_check_id;
    case "traceability_payload_candidate":
      return input.diagramming_candidate_result.diagram_export_boundary_check
        .boundary_check_id;
  }
}

function virtualFilenameFor(
  caseId: string,
  format: ExportCandidateFormat,
): string {
  return `${caseId.replace(/[^a-zA-Z0-9_-]/g, "_")}.${format}.virtual`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
