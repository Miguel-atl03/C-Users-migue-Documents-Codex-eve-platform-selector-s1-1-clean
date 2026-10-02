import type {
  B3B7AlignmentDeltaForB7,
  B7BoundaryIssue,
  B7ContaminationAttempt,
  B7PreclassificationBoundaryInput,
  B7PreclassificationBoundaryResult,
  B7PreclassificationInput,
  NoRenderZone,
  PreclassificationRecord,
} from "./b7-preclassification-types";

const INTERPRETATION_LIMIT = "non_diagnostic_preclassification_only" as const;

const ALLOWED_CONSUMERS = [
  "EvidenceBundle summary",
  "QA restriction",
  "NoRenderZone",
  "signal-only use",
];

const FORBIDDEN_CONSUMERS = [
  "structural_fact",
  "registry",
  "IR",
  "export",
  "diagnosis",
  "OperationalExceptionEvidence",
];

const BLOCKED_TARGETS: NoRenderZone["blocked_targets"] = [
  "B7_to_structural_fact",
  "B7_to_registry",
  "B7_to_IR",
  "B7_to_export",
  "B7_to_diagnosis",
  "B7_to_OperationalExceptionEvidence",
];

const NO_GO: B7PreclassificationBoundaryResult["no_go"] = {
  b7_promoted_to_structural_fact: false,
  b7_promoted_to_registry: false,
  b7_promoted_to_ir: false,
  b7_promoted_to_export: false,
  b7_promoted_to_diagnosis: false,
  b7_promoted_to_oee: false,
  b3_modified: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  runtime_40_20_full_opened: false,
};

const MATERIALITY: B7PreclassificationBoundaryResult["materiality"] = {
  level: "L6 service_present",
  marker_candidate: "B7_FIRST_CLASS_MATERIALITY_MARKER",
  implementation_scope: "local_pure_service_only",
};

export function materializeB7PreclassificationBoundary(
  input: B7PreclassificationBoundaryInput,
): B7PreclassificationBoundaryResult {
  const b7 = input.b7_input;
  const version = input.options?.version ?? "b7-first-class-materiality-l6-v1";
  const readinessDecisionRef = `LOCAL_READINESS_DECISION:${b7.case_id}:B7`;
  const attemptedConsumer = b7.attempted_consumer ?? "none";
  const invalidInterpretationLimit =
    b7.interpretation_limit !== undefined &&
    b7.interpretation_limit !== INTERPRETATION_LIMIT;
  const contamination = invalidInterpretationLimit
    ? getInvalidInterpretationLimitContamination()
    : getContamination(attemptedConsumer);
  const governanceIssueRefs = unique(contamination.governanceIssueRefs);
  const preclassificationId = `B7_PRECLASSIFICATION:${b7.case_id}:${b7.scene_id}`;
  const noRenderZoneId = `B7_NO_RENDER_ZONE:${b7.case_id}:${b7.scene_id}`;
  const blocked = contamination.issue.issue_type !== "None";

  const preclassificationRecord = buildPreclassificationRecord({
    b7,
    version,
    preclassificationId,
    noRenderZoneId,
    governanceIssueRefs,
    state: blocked ? "contamination_blocked" : "signal_only_accepted",
    attemptedConsumer,
  });
  const noRenderZone = buildNoRenderZone({
    b7,
    noRenderZoneId,
    governanceIssueRefs,
    attemptedConsumer,
  });
  const alignmentDelta = buildAlignmentDelta({
    b7,
    preclassificationId,
    governanceIssueRefs,
    state: blocked ? "blocked" : "ready_for_bundle",
    boundaryStatus: blocked ? "contamination_blocked" : "signal_only",
    attemptedConsumer,
  });

  return {
    ok: !blocked,
    preclassification_record: preclassificationRecord,
    no_render_zone: noRenderZone,
    b3_b7_alignment_delta: alignmentDelta,
    issue: contamination.issue,
    governance_issue_refs: governanceIssueRefs,
    readiness_decision_ref: readinessDecisionRef,
    blocked_reason: blocked ? contamination.issue.reason : undefined,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function buildPreclassificationRecord(params: {
  b7: B7PreclassificationInput;
  version: string;
  preclassificationId: string;
  noRenderZoneId: string;
  governanceIssueRefs: string[];
  state: PreclassificationRecord["state"];
  attemptedConsumer: B7ContaminationAttempt;
}): PreclassificationRecord {
  const b7 = params.b7;

  return {
    preclassification_id: params.preclassificationId,
    case_id: b7.case_id,
    scene_id: b7.scene_id,
    source_b7_ref: b7.source_b7_ref,
    derivation_ref: b7.derivation_ref,
    preclassification_ahe_level_dominant:
      b7.preclassification_ahe_level_dominant,
    preclassification_interpersonal_signal:
      b7.preclassification_interpersonal_signal,
    preclassification_interpersonal_note:
      b7.preclassification_interpersonal_note,
    preclassification_interpersonal_confirmation:
      b7.preclassification_interpersonal_confirmation,
    preclassification_ahe_bundle_refined:
      b7.preclassification_ahe_bundle_refined,
    interpretation_limit: INTERPRETATION_LIMIT,
    allowed_consumers: ALLOWED_CONSUMERS,
    forbidden_consumers: FORBIDDEN_CONSUMERS,
    no_render_zone: params.noRenderZoneId,
    governance_issue_refs: unique(params.governanceIssueRefs),
    state: params.state,
    version: params.version,
    audit_log: [
      {
        event: "b7_preclassification_boundary_materialized",
        attempted_consumer: params.attemptedConsumer,
        interpretation_limit: INTERPRETATION_LIMIT,
        signal_only: true,
      },
    ],
  };
}

function buildNoRenderZone(params: {
  b7: B7PreclassificationInput;
  noRenderZoneId: string;
  governanceIssueRefs: string[];
  attemptedConsumer: B7ContaminationAttempt;
}): NoRenderZone {
  return {
    no_render_zone_id: params.noRenderZoneId,
    case_id: params.b7.case_id,
    scene_id: params.b7.scene_id,
    source_b7_ref: params.b7.source_b7_ref,
    blocked_targets: BLOCKED_TARGETS,
    state: "active",
    active: true,
    governance_issue_refs: unique(params.governanceIssueRefs),
    audit_log: [
      {
        event: "b7_no_render_zone_active",
        attempted_consumer: params.attemptedConsumer,
        blocked_targets: BLOCKED_TARGETS,
      },
    ],
  };
}

function buildAlignmentDelta(params: {
  b7: B7PreclassificationInput;
  preclassificationId: string;
  governanceIssueRefs: string[];
  state: B3B7AlignmentDeltaForB7["state"];
  boundaryStatus: B3B7AlignmentDeltaForB7["b7_boundary_status"];
  attemptedConsumer: B7ContaminationAttempt;
}): B3B7AlignmentDeltaForB7 {
  return {
    alignment_delta_id: `B3_B7_ALIGNMENT_DELTA:${params.b7.case_id}:${params.b7.scene_id}:B7`,
    case_id: params.b7.case_id,
    scene_id: params.b7.scene_id,
    b7_preclassification_ref: params.preclassificationId,
    b7_boundary_status: params.boundaryStatus,
    b3_untouched: true,
    b7_not_promoted_to_oee: true,
    governance_issue_refs: unique(params.governanceIssueRefs),
    state: params.state,
    audit_log: [
      {
        event: "b3_b7_alignment_delta_created_for_b7_boundary",
        attempted_consumer: params.attemptedConsumer,
        b3_modified: false,
        b7_promoted_to_oee: false,
      },
    ],
  };
}

function getContamination(attempt: B7ContaminationAttempt): {
  issue: B7BoundaryIssue;
  governanceIssueRefs: string[];
} {
  if (attempt === "structural_fact") {
    return contamination(
      "TransductionBlocker",
      "critical",
      "transduction",
      "B7_BOUNDARY_CONTAMINATION_STRUCTURAL_FACT",
      "b7_signal_attempted_as_structural_fact",
    );
  }
  if (attempt === "registry") {
    return contamination(
      "GovernanceIssue",
      "high",
      "registry",
      "B7_BOUNDARY_CONTAMINATION_REGISTRY",
      "b7_signal_attempted_as_registry_record",
    );
  }
  if (attempt === "IR") {
    return contamination(
      "GovernanceIssue",
      "high",
      "IR",
      "B7_BOUNDARY_CONTAMINATION_IR",
      "b7_signal_attempted_as_ir_node",
    );
  }
  if (attempt === "export") {
    return contamination(
      "ExportBlocker",
      "critical",
      "export",
      "B7_BOUNDARY_CONTAMINATION_EXPORT",
      "b7_signal_attempted_as_export_element",
    );
  }
  if (attempt === "diagnosis") {
    return contamination(
      "TransductionBlocker",
      "critical",
      "diagnosis",
      "B7_BOUNDARY_CONTAMINATION_DIAGNOSIS",
      "b7_signal_attempted_as_diagnosis",
    );
  }
  if (attempt === "OperationalExceptionEvidence") {
    return contamination(
      "GovernanceIssue",
      "high",
      "operational_exception",
      "B7_BOUNDARY_CONTAMINATION_OEE",
      "b7_signal_attempted_as_operational_exception_evidence",
    );
  }

  return {
    issue: {
      issue_id: "B7_BOUNDARY_OK",
      issue_type: "None",
      severity: "low",
      affected_gate: "none",
      reason: "b7_signal_only_boundary_accepted",
    },
    governanceIssueRefs: [],
  };
}

function getInvalidInterpretationLimitContamination(): {
  issue: B7BoundaryIssue;
  governanceIssueRefs: string[];
} {
  return contamination(
    "GovernanceIssue",
    "critical",
    "diagnosis",
    "B7_BOUNDARY_INVALID_INTERPRETATION_LIMIT",
    "b7_interpretation_limit_must_remain_non_diagnostic_preclassification_only",
  );
}

function contamination(
  issueType: B7BoundaryIssue["issue_type"],
  severity: B7BoundaryIssue["severity"],
  affectedGate: B7BoundaryIssue["affected_gate"],
  governanceIssueRef: string,
  reason: string,
): {
  issue: B7BoundaryIssue;
  governanceIssueRefs: string[];
} {
  return {
    issue: {
      issue_id: governanceIssueRef,
      issue_type: issueType,
      severity,
      affected_gate: affectedGate,
      reason,
    },
    governanceIssueRefs: [governanceIssueRef],
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
