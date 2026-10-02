import type {
  BoundaryViolationScan,
  ClosureReadinessSummary,
  E2ENoGoMatrixEntry,
  LocalClosureStatus,
  LocalMaterialityChainClosureAudit,
  LocalMaterialityChainClosureAuditInput,
  LocalMaterialityChainClosureAuditResult,
  LocalMaterialityStage,
  LocalMaterialityStageLedgerEntry,
  NextAuthorizationBoundaryCheck,
  OverclaimDetectionReport,
} from "./local-materiality-chain-closure-audit-types";

const STAGES: LocalMaterialityStage[] = [
  "f5c_local_binding",
  "f6_local_membrane",
  "f7_local_control_shadow",
  "f8_local_parallel_rehearsal",
  "fase2_local_baseline",
  "registry_candidate_local_dry_run",
  "ir_candidate_local_dry_run",
  "diagramming_candidate_local_dry_run",
  "export_code_package_candidate_local_dry_run",
];

const NO_GO_DEFINITIONS: Array<{
  key: string;
  family: E2ENoGoMatrixEntry["boundary_family"];
}> = [
  { key: "runtime_40_20_full_opened", family: "runtime" },
  { key: "object_inventory_real_opened", family: "object_inventory" },
  { key: "f5c_real_opened", family: "object_inventory" },
  { key: "integration_membrane_real_opened", family: "parallel_production" },
  { key: "control_plane_real_opened", family: "control_plane" },
  { key: "sg_shadow_real_opened", family: "control_plane" },
  { key: "soft_governance_activated", family: "control_plane" },
  { key: "enforcement_activated", family: "control_plane" },
  { key: "production_parallel_real_opened", family: "parallel_production" },
  { key: "phase3_real_opened", family: "parallel_production" },
  { key: "registry_real_created", family: "registry" },
  { key: "ir_real_created", family: "ir" },
  {
    key: "diagramming_export_package_real_created",
    family: "diagramming",
  },
  { key: "export_code_package_real_created", family: "export" },
  { key: "export_created", family: "export" },
  { key: "export_file_created", family: "export" },
  { key: "zip_created", family: "export" },
  { key: "diagnosis_created", family: "diagnosis" },
  { key: "delivered_created", family: "delivery" },
  { key: "delivery_authorized", family: "delivery" },
  { key: "client_delivery_created", family: "delivery" },
  { key: "download_created", family: "delivery" },
  { key: "conformance_claimed", family: "model_claim" },
  { key: "consistency_claimed", family: "model_claim" },
  { key: "diagramming_claimed", family: "model_claim" },
  { key: "export_claimed", family: "model_claim" },
  { key: "delivery_claimed", family: "model_claim" },
  { key: "models_auto_corrected", family: "model_claim" },
  { key: "supabase_touched", family: "security" },
  { key: "sql_created", family: "security" },
  { key: "env_read", family: "security" },
];

const FORBIDDEN_CLAIMS: OverclaimDetectionReport["forbidden_claims_checked"] = [
  "conformance_claimed",
  "consistency_claimed",
  "diagramming_claimed",
  "export_claimed",
  "delivery_claimed",
  "diagnosis_created",
  "delivered_created",
  "models_auto_corrected",
];

const NO_GO: LocalMaterialityChainClosureAuditResult["no_go"] = {
  runtime_40_20_full_opened: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  integration_membrane_real_opened: false,
  control_plane_real_opened: false,
  sg_shadow_real_opened: false,
  soft_governance_activated: false,
  enforcement_activated: false,
  production_parallel_real_opened: false,
  phase3_real_opened: false,
  registry_real_created: false,
  pm_registry_real_created: false,
  pf_registry_real_created: false,
  moc_registry_real_created: false,
  olc_registry_real_created: false,
  ir_real_created: false,
  diagramming_export_package_real_created: false,
  export_code_package_real_created: false,
  export_created: false,
  export_file_created: false,
  zip_created: false,
  diagram_file_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  client_delivery_created: false,
  download_created: false,
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

export function runLocalMaterialityChainClosureAudit(
  input: LocalMaterialityChainClosureAuditInput,
): LocalMaterialityChainClosureAuditResult {
  const candidateAccepted = isExportCandidateAccepted(input);
  const restrictions = buildRestrictions(input);
  const e2eNoGoMatrix = buildNoGoMatrix(input);
  const boundaryViolationScan = buildBoundaryViolationScan(
    input.case_id,
    e2eNoGoMatrix,
  );
  const overclaimDetectionReport = buildOverclaimReport(input);
  const closureStatus = decideClosureStatus({
    candidateAccepted,
    boundaryViolationScan,
    overclaimDetectionReport,
  });
  const localChainClosed = closureStatus === "closed_local_only";
  const materialityStageLedger = buildStageLedger(
    candidateAccepted,
    restrictions,
  );
  const governanceIssueRefs = unique([
    ...input.export_code_package_candidate_result.governance_issue_refs,
    ...restrictions.map(
      (restriction) => `LOCAL_MATERIALITY_CLOSURE_RESTRICTION:${restriction}`,
    ),
  ]);

  return {
    ok: localChainClosed,
    case_id: input.case_id,
    closure_audit: buildClosureAudit({
      input,
      closureStatus,
      materialityStageLedger,
    }),
    e2e_no_go_matrix: e2eNoGoMatrix,
    materiality_stage_ledger: materialityStageLedger,
    boundary_violation_scan: boundaryViolationScan,
    overclaim_detection_report: overclaimDetectionReport,
    next_authorization_boundary_check: buildNextAuthorizationCheck(input.case_id),
    closure_readiness_summary: buildClosureReadinessSummary({
      input,
      closureStatus,
      localChainClosed,
      restrictions,
    }),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: localChainClosed ? undefined : closureStatus,
    no_go: NO_GO,
    materiality: {
      level: "local_materiality_chain_closure_audit",
      local_only: true,
      production_integration: false,
      chain_closed_local_only: localChainClosed,
      next_authorization_required: true,
    },
  };
}

function isExportCandidateAccepted(
  input: LocalMaterialityChainClosureAuditInput,
): boolean {
  const result = input.export_code_package_candidate_result;
  const noGo = result.no_go;

  return (
    result.ok === true &&
    result.materiality.local_only === true &&
    result.materiality.export_code_package_real_created === false &&
    noGo.export_code_package_real_created === false &&
    noGo.export_created === false &&
    noGo.export_file_created === false &&
    noGo.zip_created === false &&
    noGo.diagramming_export_package_real_created === false &&
    noGo.ir_real_created === false &&
    noGo.registry_real_created === false &&
    noGo.diagnosis_created === false &&
    noGo.delivered_created === false &&
    noGo.conformance_claimed === false &&
    noGo.consistency_claimed === false &&
    noGo.export_claimed === false &&
    noGo.delivery_claimed === false &&
    noGo.models_auto_corrected === false
  );
}

function buildRestrictions(input: LocalMaterialityChainClosureAuditInput): string[] {
  return unique([
    ...input.export_code_package_candidate_result.export_format_readiness_check
      .warnings,
    ...input.export_code_package_candidate_result.export_payload_shape_candidate
      .restrictions,
    ...input.export_code_package_candidate_result.export_file_set_candidate
      .restrictions,
    "automatic_promotion_blocked",
    "real_capabilities_require_next_authorization",
  ]);
}

function buildNoGoMatrix(
  input: LocalMaterialityChainClosureAuditInput,
): E2ENoGoMatrixEntry[] {
  return NO_GO_DEFINITIONS.map(({ key, family }) => {
    const observedValue = observedNoGoValue(input, key);
    return {
      no_go_key: key,
      expected_value: false,
      observed_value: observedValue,
      passed: observedValue === false,
      boundary_family: family,
    };
  });
}

function buildBoundaryViolationScan(
  caseId: string,
  matrix: E2ENoGoMatrixEntry[],
): BoundaryViolationScan {
  const violations = matrix
    .filter((entry) => !entry.passed)
    .map((entry) => entry.no_go_key);

  return {
    scan_id: `LOCAL_MATERIALITY_BOUNDARY_SCAN:${caseId}`,
    case_id: caseId,
    violations_found: violations.length > 0,
    violation_count: violations.length,
    scanned_boundaries: matrix.map((entry) => entry.no_go_key),
    boundary_violations: violations,
  };
}

function buildOverclaimReport(
  input: LocalMaterialityChainClosureAuditInput,
): OverclaimDetectionReport {
  const overclaims = FORBIDDEN_CLAIMS.filter((key) =>
    observedNoGoValue(input, key),
  );

  return {
    report_id: `LOCAL_MATERIALITY_OVERCLAIM_REPORT:${input.case_id}`,
    case_id: input.case_id,
    overclaim_detected: overclaims.length > 0,
    overclaim_count: overclaims.length,
    forbidden_claims_checked: FORBIDDEN_CLAIMS,
    overclaims,
    rule: "no_real_capability_claim_without_authorized_real_artifact",
  };
}

function decideClosureStatus(params: {
  candidateAccepted: boolean;
  boundaryViolationScan: BoundaryViolationScan;
  overclaimDetectionReport: OverclaimDetectionReport;
}): LocalClosureStatus {
  if (params.overclaimDetectionReport.overclaim_detected) {
    return "blocked_by_overclaim";
  }
  if (!params.candidateAccepted || params.boundaryViolationScan.violations_found) {
    return "blocked_by_boundary_violation";
  }
  return "closed_local_only";
}

function buildStageLedger(
  candidateAccepted: boolean,
  restrictions: string[],
): LocalMaterialityStageLedgerEntry[] {
  return STAGES.map((stage) => ({
    stage,
    local_artifact_present: candidateAccepted,
    real_artifact_created: false,
    production_integration: false,
    next_authorization_required: true,
    claims_allowed: allowedClaimsFor(stage),
    claims_forbidden: [
      "real",
      "productive",
      "conformance",
      "consistency",
      "export",
      "delivery",
      "diagnosis",
    ],
    restrictions,
  }));
}

function allowedClaimsFor(
  stage: LocalMaterialityStage,
): LocalMaterialityStageLedgerEntry["claims_allowed"] {
  if (stage === "f7_local_control_shadow") {
    return ["report_only", "precheck_only"];
  }
  if (
    stage === "registry_candidate_local_dry_run" ||
    stage === "ir_candidate_local_dry_run" ||
    stage === "diagramming_candidate_local_dry_run" ||
    stage === "export_code_package_candidate_local_dry_run"
  ) {
    return ["candidate", "local_readiness", "precheck_only"];
  }
  return ["candidate", "local_readiness"];
}

function buildClosureAudit(params: {
  input: LocalMaterialityChainClosureAuditInput;
  closureStatus: LocalClosureStatus;
  materialityStageLedger: LocalMaterialityStageLedgerEntry[];
}): LocalMaterialityChainClosureAudit {
  return {
    audit_id: `LOCAL_MATERIALITY_CHAIN_CLOSURE_AUDIT:${params.input.case_id}`,
    case_id: params.input.case_id,
    closure_status: params.closureStatus,
    local_only: true,
    production_integration: false,
    stage_ledger: params.materialityStageLedger,
    audit_log: [
      {
        event: "local_materiality_chain_closure_audit_created",
        automatic_promotion_allowed: false,
        real_capabilities_opened: false,
      },
    ],
  };
}

function buildNextAuthorizationCheck(caseId: string): NextAuthorizationBoundaryCheck {
  return {
    authorization_check_id: `LOCAL_MATERIALITY_NEXT_AUTHORIZATION:${caseId}`,
    case_id: caseId,
    next_authorization_required: true,
    allowed_next_authorization_topics: [
      "real_registry_authorization",
      "real_ir_authorization",
      "real_export_authorization",
      "phase3_authorization",
      "diagnosis_delivery_authorization",
      "production_integration_authorization",
    ],
    automatic_promotion_allowed: false,
    reason: "local_chain_closed_but_real_capabilities_remain_unauthorized",
  };
}

function buildClosureReadinessSummary(params: {
  input: LocalMaterialityChainClosureAuditInput;
  closureStatus: LocalClosureStatus;
  localChainClosed: boolean;
  restrictions: string[];
}): ClosureReadinessSummary {
  return {
    summary_id: `LOCAL_MATERIALITY_CLOSURE_SUMMARY:${params.input.case_id}`,
    case_id: params.input.case_id,
    closure_status: params.closureStatus,
    local_chain_closed: params.localChainClosed,
    real_capabilities_opened: false,
    production_integration_opened: false,
    export_ready_real: false,
    diagnosis_ready_real: false,
    delivery_ready_real: false,
    readiness_statement: params.localChainClosed
      ? "Local materiality chain is closed as local-only readiness; real capabilities remain unauthorized."
      : "Local materiality chain closure is blocked by boundary violation or overclaim.",
    restrictions: params.restrictions,
  };
}

function observedNoGoValue(
  input: LocalMaterialityChainClosureAuditInput,
  key: string,
): boolean {
  const noGo = input.export_code_package_candidate_result.no_go as Record<
    string,
    unknown
  >;
  return noGo[key] === true;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
