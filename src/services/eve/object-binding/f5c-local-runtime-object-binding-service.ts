import type {
  F5CLocalAllowedConsumer,
  F5CLocalBindingInput,
  F5CLocalBindingResult,
  F5CLocalContaminationRisk,
  F5CLocalObjectDefinitionRef,
  F5CLocalObjectMaterializationEvent,
  F5CLocalRuntimeObjectBinding,
} from "./f5c-local-binding-types";

const NO_GO: F5CLocalBindingResult["no_go"] = {
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  runtime_40_20_full_opened: false,
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

const MATERIALITY: F5CLocalBindingResult["materiality"] = {
  level: "f5c_local_binding_readiness",
  local_only: true,
  production_integration: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  next_authorization_required: true,
};

export function runF5CLocalRuntimeObjectBinding(
  input: F5CLocalBindingInput,
): F5CLocalBindingResult {
  const bridge = input.runtime_bridge_result;
  const bindings: F5CLocalRuntimeObjectBinding[] = [];
  const governanceIssueRefs = unique(bridge.governance_issue_refs ?? []);

  bindings.push(...runtimeBridgeBindings(input.case_id, bridge.ok));
  bindings.push(...stageBindings(input.case_id, bridge));
  bindings.push(...contaminationBlocks(input.case_id, bridge));
  bindings.push(...deferredBindings(input.case_id));
  bindings.push(...reviewRequiredBindings(input.case_id, bridge));

  const materializationEvents = bindings
    .filter((binding) => binding.binding_status === "materialized")
    .map((binding): F5CLocalObjectMaterializationEvent => ({
      materialization_event_id: `F5C_LOCAL_EVENT:${binding.binding_id}`,
      binding_id: binding.binding_id,
      object_definition_ref: binding.object_definition_ref,
      event_type: "created_or_touched",
      source_stage: binding.source_stage,
      audit_log: [
        {
          event: "f5c_local_materialization_event_created",
          persisted: false,
          object_inventory_real_opened: false,
          f5c_real_opened: false,
        },
      ],
    }));

  const bindingBlocks = bindings.filter(
    (binding) => binding.binding_status === "blocked",
  );
  const deferred = bindings.filter(
    (binding) => binding.binding_status === "deferred",
  );
  const reviewRequired = bindings.filter(
    (binding) => binding.binding_status === "requires_review",
  );

  return {
    ok: bindingBlocks.length === 0 && reviewRequired.length === 0,
    case_id: input.case_id,
    bindings,
    materialization_events: materializationEvents,
    binding_blocks: bindingBlocks,
    deferred_bindings: deferred,
    review_required: reviewRequired,
    governance_issue_refs: unique([
      ...governanceIssueRefs,
      ...bindings.flatMap((binding) => binding.governance_issue_refs),
    ]),
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function runtimeBridgeBindings(
  caseId: string,
  bridgeOk: boolean,
): F5CLocalRuntimeObjectBinding[] {
  return [
    materialized({
      caseId,
      sourceStage: "RUNTIME_BRIDGE",
      sourceRef: `RUNTIME_BRIDGE:${caseId}`,
      objectDefinitionRef: "ReadinessDecision",
      objectState: bridgeOk ? "bridge_ready" : "bridge_blocked",
      allowedConsumers: ["runtime_only", "control_plane_summary"],
      reason: "runtime_like_bridge_readiness_checked_locally",
    }),
  ];
}

function stageBindings(
  caseId: string,
  bridge: F5CLocalBindingInput["runtime_bridge_result"],
): F5CLocalRuntimeObjectBinding[] {
  const bindings: F5CLocalRuntimeObjectBinding[] = [];
  const stages = bridge.l8_result?.stages ?? [];

  for (const stage of stages) {
    if (stage.stage === "B3" && stage.ok) {
      for (const ref of stage.produced_refs) {
        bindings.push(
          materialized({
            caseId,
            sourceStage: "B3",
            sourceRef: ref,
            objectDefinitionRef: "ReceiverFeedbackObject",
            objectState: "operationally_relevant",
            allowedConsumers: ["runtime_only", "evidence_bundle", "mdsb_candidate"],
            reason: "b3_receiver_feedback_bound_locally",
          }),
          materialized({
            caseId,
            sourceStage: "B3",
            sourceRef: `B3_OEE:${caseId}:${ref}`,
            objectDefinitionRef: "OperationalExceptionEvidence",
            objectState: "ready_for_bundle",
            allowedConsumers: ["runtime_only", "evidence_bundle", "mdsb_candidate"],
            reason: "b3_operational_exception_evidence_bound_locally",
          }),
        );
      }
    }

    if (stage.stage === "B7" && stage.ok) {
      for (const ref of stage.produced_refs) {
        bindings.push(
          materialized({
            caseId,
            sourceStage: "B7",
            sourceRef: ref,
            objectDefinitionRef: "PreclassificationRecord",
            objectState: "signal_only_accepted",
            allowedConsumers: ["runtime_only", "evidence_bundle"],
            reason: "b7_preclassification_signal_only_bound_locally",
          }),
          materialized({
            caseId,
            sourceStage: "B7",
            sourceRef: ref.replace("B7_PRECLASSIFICATION", "B7_NO_RENDER_ZONE"),
            objectDefinitionRef: "NoRenderZone",
            objectState: "active",
            allowedConsumers: ["runtime_only", "evidence_bundle"],
            reason: "b7_no_render_zone_bound_locally",
          }),
        );
      }
    }

    if (stage.stage === "PF_SUP_03" && stage.ok) {
      for (const ref of stage.produced_refs) {
        bindings.push(
          materialized({
            caseId,
            sourceStage: "PF_SUP_03",
            sourceRef: ref,
            objectDefinitionRef: "EscenaEvidencial",
            objectState: "validated",
            allowedConsumers: ["evidence_bundle", "mdsb_candidate"],
            reason: "validated_escena_evidencial_bound_locally",
          }),
          materialized({
            caseId,
            sourceStage: "PF_SUP_03",
            sourceRef: `ACTO_OBSERVABLE:${ref}`,
            objectDefinitionRef: "ActoObservable",
            objectState: "accepted",
            allowedConsumers: ["evidence_bundle", "mdsb_candidate"],
            reason: "accepted_acto_observable_bound_locally",
          }),
        );
      }
    }

    if (stage.stage === "PF_SUP_04" && stage.ok) {
      const movieRef = stage.produced_refs[0] ?? `PELICULA_CAUSAL_AGREGADA:${caseId}`;
      bindings.push(
        materialized({
          caseId,
          sourceStage: "PF_SUP_04",
          sourceRef: `SCENE_SET:${caseId}`,
          objectDefinitionRef: "SceneSet",
          objectState: "aggregation_eligible",
          allowedConsumers: ["mdsb_candidate", "control_plane_summary"],
          reason: "scene_set_bound_locally",
        }),
        materialized({
          caseId,
          sourceStage: "PF_SUP_04",
          sourceRef: `AGGREGATION_INDEX:SCENE_SET:${caseId}`,
          objectDefinitionRef: "AggregationIndex",
          objectState: "built",
          allowedConsumers: ["mdsb_candidate", "control_plane_summary"],
          reason: "aggregation_index_bound_locally",
        }),
        materialized({
          caseId,
          sourceStage: "PF_SUP_04",
          sourceRef: movieRef,
          objectDefinitionRef: "PeliculaCausalAgregada",
          objectState: "aggregated",
          allowedConsumers: ["mdsb_candidate", "control_plane_summary"],
          reason: "pelicula_causal_agregada_bound_locally",
        }),
      );
    }

    if (stage.stage === "PF_SUP_05" && stage.ok) {
      const synthesisRef = stage.produced_refs[0] ?? `SYNTHESIS_CASE:${caseId}`;
      bindings.push(
        materialized({
          caseId,
          sourceStage: "PF_SUP_05",
          sourceRef: synthesisRef,
          objectDefinitionRef: "SynthesisCase",
          objectState: "ready_for_expert_draft",
          allowedConsumers: ["control_plane_summary"],
          reason: "synthesis_case_bound_locally",
        }),
        materialized({
          caseId,
          sourceStage: "PF_SUP_05",
          sourceRef: `DELIVERY_BOUNDARY:${synthesisRef}`,
          objectDefinitionRef: "DeliveryBoundary",
          objectState: "delivery_blocked",
          allowedConsumers: ["control_plane_summary"],
          reason: "delivery_boundary_blocked_bound_locally",
        }),
      );
    }

    if (stage.stage === "MATERIALITY_EVALUATOR" && stage.ok) {
      bindings.push(
        materialized({
          caseId,
          sourceStage: "MATERIALITY_EVALUATOR",
          sourceRef: stage.produced_refs[0] ?? `MATERIALITY_EVALUATOR:${caseId}`,
          objectDefinitionRef: "MaterialityMarkerEvaluation",
          objectState: "l6_base_accepted_for_local_chain",
          allowedConsumers: ["control_plane_summary"],
          reason: "materiality_marker_evaluation_bound_locally",
        }),
      );
    }
  }

  return bindings;
}

function contaminationBlocks(
  caseId: string,
  bridge: F5CLocalBindingInput["runtime_bridge_result"],
): F5CLocalRuntimeObjectBinding[] {
  const issueText = [
    ...(bridge.governance_issue_refs ?? []),
    ...(bridge.l8_result?.stages.flatMap((stage) => [
      stage.blocked_reason ?? "",
      ...stage.governance_issue_refs,
    ]) ?? []),
  ].join("|");
  const blocks: F5CLocalRuntimeObjectBinding[] = [];

  if (/satisfaction/i.test(issueText)) {
    blocks.push(
      blocked({
        caseId,
        sourceStage: "B3",
        sourceRef: `B3_SATISFACTION_BLOCK:${caseId}`,
        objectDefinitionRef: "ReceiverFeedbackObject",
        contaminationRisk: "satisfaction_to_feedback",
        reason: "receiver_satisfaction_cannot_be_bound_as_receiver_feedback",
        governanceIssueRefs: ["F5C_LOCAL_SATISFACTION_TO_FEEDBACK_BLOCK"],
      }),
    );
  }

  if (/B7_BOUNDARY_CONTAMINATION|b7_boundary_no_go|diagnostic/i.test(issueText)) {
    blocks.push(
      blocked({
        caseId,
        sourceStage: "B7",
        sourceRef: `B7_DIAGNOSTIC_BLOCK:${caseId}`,
        objectDefinitionRef: "PreclassificationRecord",
        contaminationRisk: "b7_to_diagnostic",
        reason: "b7_signal_cannot_bind_to_diagnostic_or_downstream_projection",
        governanceIssueRefs: ["F5C_LOCAL_B7_TO_DIAGNOSTIC_BLOCK"],
      }),
    );
  }

  if (
    (bridge.no_go as Record<string, boolean>).delivery_authorized === true ||
    (bridge.l8_result?.no_go as Record<string, boolean> | undefined)
      ?.delivery_authorized === true
  ) {
    blocks.push(
      blocked({
        caseId,
        sourceStage: "PF_SUP_05",
        sourceRef: `DELIVERY_BOUNDARY_VIOLATION:${caseId}`,
        objectDefinitionRef: "DeliveryBoundary",
        contaminationRisk: "delivery_boundary_violation",
        reason: "delivery_authorized_is_forbidden_in_local_binding_tramo",
        governanceIssueRefs: ["F5C_LOCAL_DELIVERY_AUTHORIZED_BLOCK"],
      }),
    );
  }

  return blocks;
}

function deferredBindings(caseId: string): F5CLocalRuntimeObjectBinding[] {
  return [
    baseBinding({
      caseId,
      sourceStage: "RUNTIME_BRIDGE",
      sourceRef: `F5C_DEFERRED_GOVERNANCE:${caseId}`,
      objectDefinitionRef: "GovernanceIssue",
      objectState: "defined_not_materialized",
      bindingStatus: "deferred",
      bindingAuthority: "local_binding_service",
      bindingConfidence: "medium",
      blocksHandoff: false,
      allowedConsumers: ["control_plane_summary"],
      contaminationRisk: "none",
      reason: "governance_issue_real_object_deferred_until_authorized",
      governanceIssueRefs: [],
    }),
  ];
}

function reviewRequiredBindings(
  caseId: string,
  bridge: F5CLocalBindingInput["runtime_bridge_result"],
): F5CLocalRuntimeObjectBinding[] {
  if (
    bridge.handoffs.every(
      (handoff) =>
        handoff.allowed &&
        handoff.source_runtime_entity_ids.length > 0,
    )
  ) {
    return [];
  }

  return [
    baseBinding({
      caseId,
      sourceStage: "RUNTIME_BRIDGE",
      sourceRef: `F5C_REVIEW_REQUIRED:${caseId}`,
      objectDefinitionRef: "GapObject",
      objectState: "missing_source_ref_or_state",
      bindingStatus: "requires_review",
      bindingAuthority: "review_control",
      bindingConfidence: "low",
      blocksHandoff: true,
      allowedConsumers: ["none"],
      contaminationRisk: "no_traceability",
      reason: "handoff_missing_object_ref_or_state_requires_review",
      governanceIssueRefs: ["F5C_LOCAL_REVIEW_REQUIRED"],
    }),
  ];
}

function materialized(params: {
  caseId: string;
  sourceStage: F5CLocalRuntimeObjectBinding["source_stage"];
  sourceRef: string;
  objectDefinitionRef: F5CLocalObjectDefinitionRef;
  objectState: string;
  allowedConsumers: F5CLocalAllowedConsumer[];
  reason: string;
}): F5CLocalRuntimeObjectBinding {
  return baseBinding({
    caseId: params.caseId,
    sourceStage: params.sourceStage,
    sourceRef: params.sourceRef,
    objectDefinitionRef: params.objectDefinitionRef,
    objectState: params.objectState,
    bindingStatus: "materialized",
    bindingAuthority: "local_binding_service",
    bindingConfidence: "high",
    blocksHandoff: false,
    allowedConsumers: params.allowedConsumers,
    contaminationRisk: "none",
    reason: params.reason,
    governanceIssueRefs: [],
  });
}

function blocked(params: {
  caseId: string;
  sourceStage: F5CLocalRuntimeObjectBinding["source_stage"];
  sourceRef: string;
  objectDefinitionRef: F5CLocalObjectDefinitionRef;
  contaminationRisk: F5CLocalContaminationRisk;
  reason: string;
  governanceIssueRefs: string[];
}): F5CLocalRuntimeObjectBinding {
  return baseBinding({
    caseId: params.caseId,
    sourceStage: params.sourceStage,
    sourceRef: params.sourceRef,
    objectDefinitionRef: params.objectDefinitionRef,
    objectState: "blocked",
    bindingStatus: "blocked",
    bindingAuthority: "review_control",
    bindingConfidence: "high",
    blocksHandoff: true,
    allowedConsumers: ["none"],
    contaminationRisk: params.contaminationRisk,
    reason: params.reason,
    governanceIssueRefs: params.governanceIssueRefs,
  });
}

function baseBinding(params: {
  caseId: string;
  sourceStage: F5CLocalRuntimeObjectBinding["source_stage"];
  sourceRef: string;
  objectDefinitionRef: F5CLocalObjectDefinitionRef;
  objectState: string;
  bindingStatus: F5CLocalRuntimeObjectBinding["binding_status"];
  bindingAuthority: F5CLocalRuntimeObjectBinding["binding_authority"];
  bindingConfidence: F5CLocalRuntimeObjectBinding["binding_confidence"];
  blocksHandoff: boolean;
  allowedConsumers: F5CLocalAllowedConsumer[];
  contaminationRisk: F5CLocalContaminationRisk;
  reason: string;
  governanceIssueRefs: string[];
}): F5CLocalRuntimeObjectBinding {
  return {
    binding_id: `F5C_LOCAL_BINDING:${params.caseId}:${params.objectDefinitionRef}:${hashRef(params.sourceRef)}`,
    source_stage: params.sourceStage,
    source_ref: params.sourceRef,
    object_definition_ref: params.objectDefinitionRef,
    object_state: params.objectState,
    binding_status: params.bindingStatus,
    binding_authority: params.bindingAuthority,
    binding_confidence: params.bindingConfidence,
    blocks_handoff: params.blocksHandoff,
    allowed_consumers: params.allowedConsumers,
    contamination_risk: params.contaminationRisk,
    reason: params.reason,
    governance_issue_refs: params.governanceIssueRefs,
  };
}

function hashRef(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
