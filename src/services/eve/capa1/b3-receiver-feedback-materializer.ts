import type {
  B3B7AlignmentDelta,
  B3IssueType,
  B3ReceiverFeedbackInput,
  B3ReceiverFeedbackMaterializerInput,
  B3ReceiverFeedbackMaterializerResult,
  OperationalExceptionEvidence,
  ReceiverFeedbackObject,
} from "./b3-feedback-types";

const CANONICAL_ROUTE = "B3/3.13a/receiver_feedback";

const NO_GO: B3ReceiverFeedbackMaterializerResult["no_go"] = {
  satisfaction_promoted_to_feedback: false,
  feedback_created_without_route: false,
  feedback_created_without_source_ref: false,
  feedback_created_without_derivation_ref: false,
  b7_promoted_to_oee: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  runtime_40_20_full_opened: false,
};

const MATERIALITY: B3ReceiverFeedbackMaterializerResult["materiality"] = {
  level: "L6 service_present",
  marker_candidate: "B3_FIRST_CLASS_MATERIALITY_MARKER",
  implementation_scope: "local_pure_service_only",
};

export function materializeB3ReceiverFeedback(
  input: B3ReceiverFeedbackMaterializerInput,
): B3ReceiverFeedbackMaterializerResult {
  const b3 = input.b3_input;
  const version = input.options?.version ?? "b3-first-class-materiality-l6-v1";
  const readinessDecisionRef = `LOCAL_READINESS_DECISION:${b3.case_id}:B3`;
  const governanceIssueRefs: string[] = [];
  let issueType: B3IssueType = "None";
  let blockedReason: string | undefined;

  const receiverFeedbackObject = buildReceiverFeedbackObject({
    b3,
    version,
    state: getReceiverFeedbackState(b3),
    governanceIssueRefs,
  });

  if (b3.receiver_feedback_route_status === "satisfaction_only") {
    blockedReason = "receiver_satisfaction_is_not_receiver_feedback";
    issueType = "None";
  } else if (b3.receiver_feedback_route_status === "route_missing") {
    governanceIssueRefs.push("B3_CANONICAL_ROUTE_EXCEPTION");
    receiverFeedbackObject.state = "blocked_by_missing_canonical_route";
    blockedReason = "canonical_route_missing";
    issueType = "CanonicalRouteException";
  } else if (b3.receiver_feedback_route_status === "gap_unknown") {
    governanceIssueRefs.push("B3_RECEIVER_FEEDBACK_GAP");
    receiverFeedbackObject.state = "gap_flagged";
    blockedReason = "receiver_feedback_gap_unknown";
    issueType = "GapObject";
  } else if (b3.receiver_feedback_route_status === "route_validated") {
    const missingTraceability = getMissingTraceability(b3);
    if (missingTraceability.length > 0) {
      governanceIssueRefs.push(...missingTraceability);
      receiverFeedbackObject.state = "rework_triggered";
      blockedReason = "receiver_feedback_missing_traceability";
      issueType = "CanonicalRouteException";
    } else {
      receiverFeedbackObject.state = "operationally_relevant";
      receiverFeedbackObject.governance_issue_refs = unique(governanceIssueRefs);
      const oee = buildOperationalExceptionEvidence({
        b3,
        receiverFeedbackObject,
        version,
      });
      const delta = buildAlignmentDelta({
        b3,
        receiverFeedbackObject,
        governanceIssueRefs,
        state: "ready_for_bundle",
      });

      return {
        ok: true,
        receiver_feedback_object: receiverFeedbackObject,
        operational_exception_evidence: oee,
        b3_b7_alignment_delta: delta,
        governance_issue_refs: unique(governanceIssueRefs),
        readiness_decision_ref: readinessDecisionRef,
        issue_type: "OperationalExceptionEvidence",
        no_go: NO_GO,
        materiality: MATERIALITY,
      };
    }
  } else if (b3.receiver_feedback_route_status === "absent") {
    receiverFeedbackObject.state = "captured";
    issueType = "None";
  }

  receiverFeedbackObject.governance_issue_refs = unique(governanceIssueRefs);

  return {
    ok: !blockedReason,
    receiver_feedback_object: receiverFeedbackObject,
    b3_b7_alignment_delta: buildAlignmentDelta({
      b3,
      receiverFeedbackObject,
      governanceIssueRefs,
      state: blockedReason ? "blocked" : "created",
    }),
    governance_issue_refs: unique(governanceIssueRefs),
    readiness_decision_ref: readinessDecisionRef,
    blocked_reason: blockedReason,
    issue_type: issueType,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function getReceiverFeedbackState(
  b3: B3ReceiverFeedbackInput,
): ReceiverFeedbackObject["state"] {
  if (b3.receiver_feedback_route_status === "satisfaction_only") {
    return "rejected_as_satisfaction_only";
  }
  if (b3.receiver_feedback_route_status === "route_missing") {
    return "blocked_by_missing_canonical_route";
  }
  if (b3.receiver_feedback_route_status === "gap_unknown") {
    return "gap_flagged";
  }
  if (b3.receiver_feedback_route_status === "route_validated") {
    return "route_validated";
  }
  return "captured";
}

function buildReceiverFeedbackObject(params: {
  b3: B3ReceiverFeedbackInput;
  version: string;
  state: ReceiverFeedbackObject["state"];
  governanceIssueRefs: string[];
}): ReceiverFeedbackObject {
  const b3 = params.b3;

  return {
    receiver_feedback_id: `B3_RECEIVER_FEEDBACK:${b3.case_id}:${b3.scene_id}`,
    case_id: b3.case_id,
    scene_id: b3.scene_id,
    output_handoff_ref: b3.output_handoff_ref,
    receiver_satisfaction_value: b3.receiver_satisfaction_value,
    receiver_feedback_exists: Boolean(b3.receiver_feedback_exists),
    receiver_feedback_literal: b3.receiver_feedback_literal,
    receiver_feedback_type: b3.receiver_feedback_type,
    receiver_feedback_route_status: b3.receiver_feedback_route_status,
    canonical_route_ref: b3.canonical_route_ref,
    operational_impact: b3.receiver_feedback_literal
      ? [b3.receiver_feedback_literal]
      : [],
    allowed_consumers: [
      "EvidenceBundle",
      "PF rework when route_validated",
      "OperationalExceptionEvidence",
    ],
    forbidden_consumers: [
      "receiver_satisfaction_as_feedback",
      "diagnosis",
      "export",
      "registry",
    ],
    governance_issue_refs: unique(params.governanceIssueRefs),
    state: params.state,
    version: params.version,
    audit_log: [
      {
        event: "b3_receiver_feedback_materialized",
        receiver_satisfaction_promoted_to_feedback: false,
        route_status: b3.receiver_feedback_route_status,
      },
    ],
  };
}

function buildOperationalExceptionEvidence(params: {
  b3: B3ReceiverFeedbackInput;
  receiverFeedbackObject: ReceiverFeedbackObject;
  version: string;
}): OperationalExceptionEvidence {
  return {
    exception_evidence_id: `B3_OEE:${params.b3.case_id}:${params.b3.scene_id}`,
    subtype: "receiver_feedback",
    case_id: params.b3.case_id,
    scene_id: params.b3.scene_id,
    block_id: "B3",
    route_code: "R9",
    canonical_value: CANONICAL_ROUTE,
    literal_evidence: params.b3.receiver_feedback_literal,
    source_ref: params.b3.source_ref,
    derivation_ref: params.b3.derivation_ref,
    issue_links: [params.receiverFeedbackObject.receiver_feedback_id],
    severity: "medium",
    state: "ready_for_bundle",
    version: params.version,
    audit_log: [
      {
        event: "b3_operational_exception_evidence_created",
        b7_promoted_to_oee: false,
      },
    ],
  };
}

function buildAlignmentDelta(params: {
  b3: B3ReceiverFeedbackInput;
  receiverFeedbackObject?: ReceiverFeedbackObject;
  governanceIssueRefs: string[];
  state: B3B7AlignmentDelta["state"];
}): B3B7AlignmentDelta {
  return {
    alignment_delta_id: `B3_B7_ALIGNMENT_DELTA:${params.b3.case_id}:${params.b3.scene_id}`,
    case_id: params.b3.case_id,
    scene_id: params.b3.scene_id,
    b3_receiver_feedback_ref:
      params.receiverFeedbackObject?.receiver_feedback_id,
    b3_route_status: params.b3.receiver_feedback_route_status,
    b7_boundary_untouched: true,
    b7_not_promoted_to_oee: true,
    governance_issue_refs: unique(params.governanceIssueRefs),
    state: params.state,
    audit_log: [
      {
        event: "b3_b7_alignment_delta_created",
        b7_service_implemented: false,
        b7_promoted_to_oee: false,
      },
    ],
  };
}

function getMissingTraceability(b3: B3ReceiverFeedbackInput): string[] {
  const missing: string[] = [];

  if (b3.canonical_route_ref !== CANONICAL_ROUTE) {
    missing.push("B3_CANONICAL_ROUTE_EXCEPTION");
  }
  if (!b3.source_ref) {
    missing.push("B3_MISSING_SOURCE_REF");
  }
  if (!b3.derivation_ref) {
    missing.push("B3_MISSING_DERIVATION_REF");
  }
  if (!b3.receiver_feedback_exists || !b3.receiver_feedback_literal) {
    missing.push("B3_RECEIVER_FEEDBACK_GAP");
  }

  return missing;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

