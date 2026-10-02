import type {
  F6LocalBoundaryDecision,
  F6LocalExportBoundaryCheck,
  F6LocalHandoffBoundaryDecision,
  F6LocalIntegrationMembraneInput,
  F6LocalIntegrationMembraneOutbox,
  F6LocalIntegrationMembraneResult,
  F6LocalIntegrationMembraneSnapshot,
  F6LocalMembraneProjectionSummary,
  F6LocalReviewControlRecord,
} from "./f6-local-integration-membrane-types";

const BLOCKED_CONSUMERS: F6LocalHandoffBoundaryDecision["blocked_consumers"] = [
  "registry",
  "IR",
  "export",
  "diagnosis",
  "runtime_40_20_full",
  "production_integration",
];

const NO_GO: F6LocalIntegrationMembraneResult["no_go"] = {
  runtime_40_20_full_opened: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  integration_membrane_real_opened: false,
  production_integration_opened: false,
  control_plane_real_opened: false,
  sg_shadow_real_opened: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  delivered_created: false,
  delivery_authorized: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: F6LocalIntegrationMembraneResult["materiality"] = {
  level: "f6_local_membrane_readiness",
  local_only: true,
  production_integration: false,
  next_authorization_required: true,
};

export function runF6LocalIntegrationMembrane(
  input: F6LocalIntegrationMembraneInput,
): F6LocalIntegrationMembraneResult {
  const l8Accepted = isL8Accepted(input);
  const f5cAccepted = isF5CAccepted(input);
  const restrictions = buildRestrictions(input, l8Accepted, f5cAccepted);
  const governanceIssueRefs = unique([
    ...input.l8_result.stages.flatMap((stage) => stage.governance_issue_refs),
    ...input.f5c_result.governance_issue_refs,
    ...restrictions.map((restriction) => `F6_LOCAL_RESTRICTION:${restriction}`),
  ]);
  const hasReviewSignals =
    input.f5c_result.binding_blocks.length > 0 ||
    input.f5c_result.deferred_bindings.length > 0 ||
    input.f5c_result.review_required.length > 0;
  const decision = decide(l8Accepted, f5cAccepted, hasReviewSignals);
  const outboxAllowed =
    decision === "local_handoff_ready" ||
    decision === "local_handoff_ready_with_restrictions";
  const sourceL8Ref = `L8_LOCAL_CHAIN:${input.case_id}`;
  const sourceF5CRef = `F5C_LOCAL_BINDING:${input.case_id}`;

  const outbox = buildOutbox({
    input,
    sourceL8Ref,
    sourceF5CRef,
    outboxAllowed,
    decision,
    restrictions,
    governanceIssueRefs,
  });
  const snapshot = buildSnapshot({
    input,
    sourceL8Ref,
    sourceF5CRef,
    outboxAllowed,
    restrictions,
  });
  const handoffBoundaryDecision = buildHandoffDecision({
    input,
    decision,
    restrictions,
    governanceIssueRefs,
  });
  const exportBoundaryCheck = buildExportBoundaryCheck(
    input.case_id,
    governanceIssueRefs,
  );
  const reviewControlRecord = buildReviewControlRecord({
    input,
    restrictions,
    hasReviewSignals,
  });
  const projectionSummary = buildProjectionSummary({
    input,
    l8Accepted,
    f5cAccepted,
    decision,
  });

  return {
    ok: outboxAllowed && l8Accepted && f5cAccepted,
    case_id: input.case_id,
    outbox,
    snapshot,
    handoff_boundary_decision: handoffBoundaryDecision,
    export_boundary_check: exportBoundaryCheck,
    review_control_record: reviewControlRecord,
    membrane_projection_summary: projectionSummary,
    blocked_reason: outboxAllowed ? undefined : firstRestriction(restrictions),
    governance_issue_refs: governanceIssueRefs,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function isL8Accepted(input: F6LocalIntegrationMembraneInput): boolean {
  const l8 = input.l8_result;
  return (
    l8.ok === true &&
    l8.materiality.after === "L8 executable_materiality" &&
    l8.materiality.local_only === true &&
    l8.materiality.production_integration === false &&
    l8.no_go.runtime_40_20_full_opened === false
  );
}

function isF5CAccepted(input: F6LocalIntegrationMembraneInput): boolean {
  const f5c = input.f5c_result;
  return (
    f5c.ok === true &&
    f5c.materiality.local_only === true &&
    f5c.materiality.object_inventory_real_opened === false &&
    f5c.materiality.f5c_real_opened === false
  );
}

function buildRestrictions(
  input: F6LocalIntegrationMembraneInput,
  l8Accepted: boolean,
  f5cAccepted: boolean,
): string[] {
  const restrictions = [
    "export_blocked",
    "diagnosis_blocked",
    "registry_blocked",
    "ir_blocked",
    "production_integration_blocked",
    "runtime_40_20_full_blocked",
  ];

  if (!l8Accepted) {
    restrictions.push("l8_result_not_accepted");
  }
  if (!f5cAccepted) {
    restrictions.push("f5c_result_not_accepted");
  }
  if (input.f5c_result.binding_blocks.length > 0) {
    restrictions.push("binding_blocks_present");
  }
  if (input.f5c_result.deferred_bindings.length > 0) {
    restrictions.push("deferred_bindings_present");
  }
  if (input.f5c_result.review_required.length > 0) {
    restrictions.push("review_required_present");
  }

  return unique(restrictions);
}

function decide(
  l8Accepted: boolean,
  f5cAccepted: boolean,
  hasReviewSignals: boolean,
): F6LocalBoundaryDecision {
  if (!l8Accepted || !f5cAccepted) {
    return "handoff_blocked";
  }
  if (hasReviewSignals) {
    return "local_handoff_ready_with_restrictions";
  }
  return "local_handoff_ready";
}

function buildOutbox(params: {
  input: F6LocalIntegrationMembraneInput;
  sourceL8Ref: string;
  sourceF5CRef: string;
  outboxAllowed: boolean;
  decision: F6LocalBoundaryDecision;
  restrictions: string[];
  governanceIssueRefs: string[];
}): F6LocalIntegrationMembraneOutbox {
  return {
    outbox_id: `F6_LOCAL_OUTBOX:${params.input.case_id}`,
    case_id: params.input.case_id,
    source_l8_ref: params.sourceL8Ref,
    source_f5c_ref: params.sourceF5CRef,
    target_consumer: params.outboxAllowed
      ? "future_parallel_production_candidate"
      : "none",
    state: params.outboxAllowed
      ? "handoff_ready_local"
      : "handoff_blocked",
    allowed_to_leave_membrane: params.outboxAllowed,
    restrictions: params.restrictions,
    governance_issue_refs: params.governanceIssueRefs,
    audit_log: [
      {
        event: "f6_local_outbox_created",
        persisted: false,
        production_integration_opened: false,
        decision: params.decision,
      },
    ],
  };
}

function buildSnapshot(params: {
  input: F6LocalIntegrationMembraneInput;
  sourceL8Ref: string;
  sourceF5CRef: string;
  outboxAllowed: boolean;
  restrictions: string[];
}): F6LocalIntegrationMembraneSnapshot {
  return {
    snapshot_id: `F6_LOCAL_SNAPSHOT:${params.input.case_id}`,
    case_id: params.input.case_id,
    source_l8_ref: params.sourceL8Ref,
    source_f5c_ref: params.sourceF5CRef,
    local_only: true,
    bindings_count: params.input.f5c_result.bindings.length,
    materialization_events_count:
      params.input.f5c_result.materialization_events.length,
    binding_blocks_count: params.input.f5c_result.binding_blocks.length,
    deferred_bindings_count: params.input.f5c_result.deferred_bindings.length,
    review_required_count: params.input.f5c_result.review_required.length,
    restrictions: params.restrictions,
    checksum_like_ref: checksumLike([
      params.sourceL8Ref,
      params.sourceF5CRef,
      String(params.input.f5c_result.bindings.length),
      String(params.input.f5c_result.materialization_events.length),
    ]),
    state: params.outboxAllowed ? "created" : "blocked",
    audit_log: [
      {
        event: "f6_local_snapshot_created",
        persisted: false,
        local_only: true,
      },
    ],
  };
}

function buildHandoffDecision(params: {
  input: F6LocalIntegrationMembraneInput;
  decision: F6LocalBoundaryDecision;
  restrictions: string[];
  governanceIssueRefs: string[];
}): F6LocalHandoffBoundaryDecision {
  const allowed =
    params.decision === "handoff_blocked"
      ? ["none" as const]
      : ([
          "future_parallel_production_candidate",
          "control_plane_summary",
        ] as const);

  return {
    decision_id: `F6_LOCAL_HANDOFF_DECISION:${params.input.case_id}`,
    case_id: params.input.case_id,
    decision: params.decision,
    allowed_consumers: [...allowed],
    blocked_consumers: BLOCKED_CONSUMERS,
    reason:
      params.decision === "handoff_blocked"
        ? "l8_or_f5c_local_inputs_not_accepted"
        : "local_handoff_candidate_only_not_production_integration",
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function buildExportBoundaryCheck(
  caseId: string,
  governanceIssueRefs: string[],
): F6LocalExportBoundaryCheck {
  return {
    export_boundary_check_id: `F6_LOCAL_EXPORT_BOUNDARY:${caseId}`,
    case_id: caseId,
    export_allowed: false,
    export_code_package_created: false,
    reason: "export_not_authorized_in_local_membrane",
    blocked_targets: [
      "ExportCodePackage",
      "DiagrammingExportPackage",
      "IR",
      "registry",
      "diagnosis",
    ],
    governance_issue_refs: governanceIssueRefs,
  };
}

function buildReviewControlRecord(params: {
  input: F6LocalIntegrationMembraneInput;
  restrictions: string[];
  hasReviewSignals: boolean;
}): F6LocalReviewControlRecord {
  const reviewRequired =
    params.hasReviewSignals ||
    params.restrictions.includes("l8_result_not_accepted") ||
    params.restrictions.includes("f5c_result_not_accepted");

  return {
    review_control_id: `F6_LOCAL_REVIEW_CONTROL:${params.input.case_id}`,
    case_id: params.input.case_id,
    review_required: reviewRequired,
    reason: reviewRequired
      ? "local_membrane_has_restrictions_or_binding_controls"
      : "local_membrane_review_not_required",
    linked_binding_blocks: params.input.f5c_result.binding_blocks.map(
      (binding) => binding.binding_id,
    ),
    linked_restrictions: params.restrictions,
    state: reviewRequired ? "required" : "not_required",
    audit_log: [
      {
        event: "f6_local_review_control_record_created",
        control_plane_real_opened: false,
      },
    ],
  };
}

function buildProjectionSummary(params: {
  input: F6LocalIntegrationMembraneInput;
  l8Accepted: boolean;
  f5cAccepted: boolean;
  decision: F6LocalBoundaryDecision;
}): F6LocalMembraneProjectionSummary {
  return {
    projection_summary_id: `F6_LOCAL_PROJECTION_SUMMARY:${params.input.case_id}`,
    case_id: params.input.case_id,
    summary_only: true,
    l8_local_materiality_confirmed: params.l8Accepted,
    f5c_local_binding_confirmed: params.f5cAccepted,
    handoff_decision: params.decision,
    export_allowed: false,
    diagnosis_allowed: false,
    production_integration_allowed: false,
    runtime_40_20_full_allowed: false,
  };
}

function firstRestriction(restrictions: string[]): string | undefined {
  return restrictions.find((restriction) =>
    ["l8_result_not_accepted", "f5c_result_not_accepted"].includes(
      restriction,
    ),
  );
}

function checksumLike(parts: string[]): string {
  const total = parts.join("|").split("").reduce((sum, char) => {
    return sum + char.charCodeAt(0);
  }, 0);
  return `F6_LOCAL_CHECKSUM:${total}`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
