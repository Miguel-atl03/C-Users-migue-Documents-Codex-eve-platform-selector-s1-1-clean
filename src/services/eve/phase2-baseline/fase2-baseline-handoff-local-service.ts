import type {
  Fase2BaselineHandoffLocalInput,
  Fase2BaselineHandoffLocalResult,
  Fase2LocalAllowedDestination,
  Fase2LocalBaselineRecord,
  Fase2LocalBlockedDestination,
  Fase2LocalHandoffDecision,
  Fase2LocalHandoffDecisionRecord,
  Fase2LocalHandoffMatrixEntry,
  Fase2LocalInventoryUpdateCandidate,
  Fase2LocalPhase3OpeningBoundaryCheck,
  Fase2LocalSourceObjectManifestItem,
  Fase2LocalSourceObjectName,
} from "./fase2-baseline-handoff-local-types";

const ALLOWED_DESTINATIONS: Fase2LocalAllowedDestination[] = [
  "qa_audit",
  "control_plane_summary",
  "future_phase3_candidate",
];

const BLOCKED_DESTINATIONS: Fase2LocalBlockedDestination[] = [
  "registry",
  "IR",
  "export",
  "diagnosis",
  "phase3_real",
  "production_parallel_real",
];

const SOURCE_OBJECTS: Fase2LocalSourceObjectName[] = [
  "MDSBHandoffCandidate",
  "DesignReadinessAssessment",
  "NoGoParallelProductionCheck",
  "ObjectCandidateLinkageCheck",
  "RuntimeEvidenceBundleReference",
  "SGShadowParallelAuditNote",
];

const BASE_RESTRICTIONS = [
  "production_parallel_real_blocked",
  "phase3_real_blocked",
  "registry_blocked",
  "ir_blocked",
  "export_blocked",
  "diagnosis_blocked",
  "inventory_real_update_blocked",
];

const NO_GO: Fase2BaselineHandoffLocalResult["no_go"] = {
  production_parallel_real_opened: false,
  phase3_real_opened: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  export_code_package_created: false,
  diagnosis_created: false,
  delivered_created: false,
  delivery_authorized: false,
  inventory_real_updated: false,
  readiness_mutated: false,
  core_state_mutated: false,
  workflow_created: false,
  task_created: false,
  operation_blocked: false,
  mba_written: false,
  parallel_production_artifacts_written: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: Fase2BaselineHandoffLocalResult["materiality"] = {
  level: "fase2_local_baseline_handoff_readiness",
  local_only: true,
  production_integration: false,
  next_authorization_required: true,
};

export function runFase2BaselineHandoffLocalControl(
  input: Fase2BaselineHandoffLocalInput,
): Fase2BaselineHandoffLocalResult {
  const f8Accepted = isF8Accepted(input);
  const restrictions = buildRestrictions(input, f8Accepted);
  const governanceIssueRefs = unique([
    ...input.f8_rehearsal_result.governance_issue_refs,
    ...restrictions.map((restriction) => `FASE2_LOCAL_RESTRICTION:${restriction}`),
  ]);
  const issueManifest = unique([
    ...input.f8_rehearsal_result.governance_issue_refs,
    ...restrictions,
  ]);
  const baselineId = `FASE2_LOCAL_BASELINE:${input.case_id}`;

  return {
    ok: f8Accepted,
    case_id: input.case_id,
    baseline_record: buildBaselineRecord({
      input,
      f8Accepted,
      restrictions,
      issueManifest,
      baselineId,
    }),
    handoff_decision: buildHandoffDecision({
      input,
      f8Accepted,
      restrictions,
      governanceIssueRefs,
    }),
    handoff_matrix: buildHandoffMatrix(input, f8Accepted),
    inventory_update_candidate: buildInventoryUpdateCandidate({
      input,
      baselineId,
      restrictions,
    }),
    phase3_opening_boundary_check: buildPhase3BoundaryCheck(
      input,
      restrictions,
    ),
    governance_issue_refs: governanceIssueRefs,
    blocked_reason: f8Accepted ? undefined : "f8_rehearsal_not_local_safe",
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isF8Accepted(input: Fase2BaselineHandoffLocalInput): boolean {
  const f8 = input.f8_rehearsal_result;

  return (
    f8.ok === true &&
    f8.materiality.local_only === true &&
    f8.materiality.production_integration === false &&
    f8.no_go.production_parallel_real_opened === false &&
    f8.no_go.registry_created === false &&
    f8.no_go.ir_created === false &&
    f8.no_go.export_created === false
  );
}

function buildRestrictions(
  input: Fase2BaselineHandoffLocalInput,
  f8Accepted: boolean,
): string[] {
  const restrictions = [...BASE_RESTRICTIONS];

  if (!f8Accepted) {
    restrictions.push("f8_rehearsal_not_local_safe");
  }

  const f8Restrictions = [
    ...input.f8_rehearsal_result.design_readiness_assessment.restrictions,
    ...input.f8_rehearsal_result.no_go_parallel_production_check.warnings,
    ...input.f8_rehearsal_result.mdsb_handoff_candidate.forbidden_consumers.map(
      (consumer) => `${consumer}_blocked`,
    ),
  ];

  return unique([...restrictions, ...f8Restrictions]);
}

function buildBaselineRecord(params: {
  input: Fase2BaselineHandoffLocalInput;
  f8Accepted: boolean;
  restrictions: string[];
  issueManifest: string[];
  baselineId: string;
}): Fase2LocalBaselineRecord {
  const approvedObjectSet = params.f8Accepted ? [...ALLOWED_DESTINATIONS] : [];

  return {
    baseline_id: params.baselineId,
    case_id: params.input.case_id,
    state: params.f8Accepted
      ? "partial_baseline_with_blocks"
      : "blocked_by_phase_gap",
    source_object_manifest: buildSourceObjectManifest(
      params.input,
      params.f8Accepted,
      params.restrictions,
    ),
    approved_object_set: approvedObjectSet,
    blocked_object_set: [...BLOCKED_DESTINATIONS],
    issue_manifest: params.issueManifest,
    version: params.input.options?.version ?? "fase2-local-baseline-v1",
    local_only: true,
    audit_log: [
      {
        event: "fase2_local_baseline_created",
        persisted: false,
        inventory_real_updated: false,
        phase3_real_opened: false,
      },
    ],
  };
}

function buildSourceObjectManifest(
  input: Fase2BaselineHandoffLocalInput,
  f8Accepted: boolean,
  restrictions: string[],
): Fase2LocalSourceObjectManifestItem[] {
  return SOURCE_OBJECTS.map((objectName) => ({
    object_name: objectName,
    source_ref: sourceRefFor(input, objectName),
    source_state: sourceStateFor(input, objectName),
    consumable_locally: f8Accepted,
    consumable_productively: false,
    restrictions,
  }));
}

function sourceRefFor(
  input: Fase2BaselineHandoffLocalInput,
  objectName: Fase2LocalSourceObjectName,
): string {
  const f8 = input.f8_rehearsal_result;

  switch (objectName) {
    case "MDSBHandoffCandidate":
      return f8.mdsb_handoff_candidate.mdsb_handoff_candidate_id;
    case "DesignReadinessAssessment":
      return f8.design_readiness_assessment.assessment_id;
    case "NoGoParallelProductionCheck":
      return f8.no_go_parallel_production_check.no_go_check_id;
    case "ObjectCandidateLinkageCheck":
      return f8.object_candidate_linkage_check.linkage_check_id;
    case "RuntimeEvidenceBundleReference":
      return f8.runtime_evidence_bundle_reference
        .runtime_evidence_bundle_reference_id;
    case "SGShadowParallelAuditNote":
      return f8.sg_shadow_parallel_audit_note.audit_note_id;
  }
}

function sourceStateFor(
  input: Fase2BaselineHandoffLocalInput,
  objectName: Fase2LocalSourceObjectName,
): string {
  const f8 = input.f8_rehearsal_result;

  switch (objectName) {
    case "MDSBHandoffCandidate":
      return f8.mdsb_handoff_candidate.candidate_only
        ? "candidate_only"
        : "invalid_candidate";
    case "DesignReadinessAssessment":
      return f8.design_readiness_assessment.outcome;
    case "NoGoParallelProductionCheck":
      return f8.no_go_parallel_production_check.no_go_triggered
        ? "no_go_triggered"
        : "no_go_cleared_for_local_only";
    case "ObjectCandidateLinkageCheck":
      return f8.object_candidate_linkage_check.object_candidate_linkage_ok
        ? "object_candidate_linkage_ok"
        : "object_candidate_linkage_review_required";
    case "RuntimeEvidenceBundleReference":
      return "reference_only";
    case "SGShadowParallelAuditNote":
      return f8.sg_shadow_parallel_audit_note.report_only
        ? "report_only"
        : "invalid_audit_mode";
  }
}

function buildHandoffDecision(params: {
  input: Fase2BaselineHandoffLocalInput;
  f8Accepted: boolean;
  restrictions: string[];
  governanceIssueRefs: string[];
}): Fase2LocalHandoffDecisionRecord {
  return {
    handoff_decision_id: `FASE2_LOCAL_HANDOFF:${params.input.case_id}`,
    case_id: params.input.case_id,
    decision: decisionFor(params.f8Accepted),
    allowed_destinations: params.f8Accepted ? [...ALLOWED_DESTINATIONS] : [],
    blocked_destinations: [...BLOCKED_DESTINATIONS],
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function decisionFor(f8Accepted: boolean): Fase2LocalHandoffDecision {
  return f8Accepted ? "local_handoff_ready_with_restrictions" : "handoff_blocked";
}

function buildHandoffMatrix(
  input: Fase2BaselineHandoffLocalInput,
  f8Accepted: boolean,
): Fase2LocalHandoffMatrixEntry[] {
  const allowedEntries = SOURCE_OBJECTS.flatMap((sourceObject) =>
    ALLOWED_DESTINATIONS.map((destination) => ({
      source_object: sourceObject,
      destination,
      allowed: f8Accepted,
      reason: f8Accepted
        ? "local_candidate_destination_allowed"
        : "f8_rehearsal_not_local_safe",
    })),
  );
  const blockedEntries = SOURCE_OBJECTS.flatMap((sourceObject) =>
    BLOCKED_DESTINATIONS.map((destination) => ({
      source_object: sourceObject,
      destination,
      allowed: false,
      reason: `${destination}_blocked_by_local_phase2_boundary`,
    })),
  );

  return [...allowedEntries, ...blockedEntries];
}

function buildInventoryUpdateCandidate(params: {
  input: Fase2BaselineHandoffLocalInput;
  baselineId: string;
  restrictions: string[];
}): Fase2LocalInventoryUpdateCandidate {
  return {
    inventory_update_candidate_id: `FASE2_LOCAL_INVENTORY_UPDATE_CANDIDATE:${params.input.case_id}`,
    case_id: params.input.case_id,
    candidate_only: true,
    updates_inventory_real: false,
    source_baseline_ref: params.baselineId,
    objects_to_register_later: [...SOURCE_OBJECTS],
    restrictions: params.restrictions,
  };
}

function buildPhase3BoundaryCheck(
  input: Fase2BaselineHandoffLocalInput,
  restrictions: string[],
): Fase2LocalPhase3OpeningBoundaryCheck {
  return {
    phase3_boundary_check_id: `FASE2_LOCAL_PHASE3_BOUNDARY:${input.case_id}`,
    case_id: input.case_id,
    phase3_real_opening_allowed: false,
    vsm_ahe_diagnosis_allowed: false,
    reason: "phase3_not_authorized_from_local_baseline",
    blockers: unique(["phase3_real_blocked", "diagnosis_blocked", ...restrictions]),
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
