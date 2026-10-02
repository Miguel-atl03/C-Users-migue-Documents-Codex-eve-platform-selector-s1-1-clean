import { runL8LocalPfChainHandoff } from "../materiality/l8-local-pf-chain-handoff-orchestrator";
import type { B3ReceiverFeedbackInput } from "../capa1/b3-feedback-types";
import type { B7PreclassificationInput } from "../capa1/b7-preclassification-types";
import type { EvidenceBundleInput } from "../transduction/evidential-scene-types";
import type {
  Runtime4020BridgeHandoff,
  Runtime4020ToL8BridgeInput,
  Runtime4020ToL8BridgeResult,
  RuntimeLikeEntity,
} from "./runtime-40-20-l8-bridge-types";

const B3_ROUTE = "B3/3.13a/receiver_feedback" as const;
const B7_INTERPRETATION_LIMIT = "non_diagnostic_preclassification_only" as const;

const NO_GO: Runtime4020ToL8BridgeResult["no_go"] = {
  runtime_40_20_full_opened: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
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

const MATERIALITY: Runtime4020ToL8BridgeResult["materiality"] = {
  level: "runtime_bridge_local_readiness",
  consumes_l8_local_chain: true,
  production_integration: false,
  runtime_40_20_full_opened: false,
  next_authorization_required: true,
};

export function runRuntime4020ToL8LocalBridge(
  input: Runtime4020ToL8BridgeInput,
): Runtime4020ToL8BridgeResult {
  const governanceIssueRefs: string[] = [];
  const handoffs: Runtime4020BridgeHandoff[] = [];
  const traceabilityInvalidEntityIds = input.runtime_entities
    .filter((entity) => !hasTraceability(entity))
    .map((entity) => entity.runtime_entity_id);

  if (traceabilityInvalidEntityIds.length > 0) {
    governanceIssueRefs.push("RUNTIME_ENTITY_TRACEABILITY_GAP");
  }

  const b3Mapping = mapB3Inputs(input.runtime_entities, governanceIssueRefs);
  handoffs.push(
    handoff(
      "B3",
      b3Mapping.sourceIds,
      b3Mapping.allowed,
      b3Mapping.blockedReason,
    ),
  );

  const b7Mapping = mapB7Inputs(input.runtime_entities, governanceIssueRefs);
  handoffs.push(
    handoff(
      "B7",
      b7Mapping.sourceIds,
      b7Mapping.allowed,
      b7Mapping.blockedReason,
    ),
  );

  const evidenceMapping = mapEvidenceBundles(input, b7Mapping.inputs);
  if (!evidenceMapping.allowed) {
    governanceIssueRefs.push("RUNTIME_EVIDENCE_INSUFFICIENT_FOR_L8_CHAIN");
  }
  handoffs.push(
    handoff(
      "EvidenceBundle",
      evidenceMapping.sourceIds,
      evidenceMapping.allowed,
      evidenceMapping.blockedReason,
    ),
  );

  const bridgeReady =
    b3Mapping.allowed && b7Mapping.allowed && evidenceMapping.allowed;

  if (!bridgeReady) {
    handoffs.push(
      handoff(
        "L8LocalPfChainHandoff",
        input.runtime_entities.map((entity) => entity.runtime_entity_id),
        false,
        "runtime_bridge_input_not_ready_for_l8_chain",
      ),
    );

    return result({
      caseId: input.case_id,
      handoffs,
      governanceIssueRefs,
      blockedReason: firstBlockedReason(handoffs),
    });
  }

  const l8Result = runL8LocalPfChainHandoff({
    case_id: input.case_id,
    b3_inputs: b3Mapping.inputs,
    b7_inputs: b7Mapping.inputs,
    evidence_bundles: evidenceMapping.bundles,
    materiality_traceability_records: input.materiality_traceability_records,
    materiality_marker_contracts: input.materiality_marker_contracts,
    options: {
      minimum_validated_scenes: input.options?.minimum_validated_scenes ?? 2,
      version: input.options?.version,
    },
  });

  handoffs.push(
    handoff(
      "L8LocalPfChainHandoff",
      input.runtime_entities.map((entity) => entity.runtime_entity_id),
      l8Result.ok,
      l8Result.ok ? undefined : l8Result.final_state,
    ),
  );

  return result({
    caseId: input.case_id,
    handoffs,
    governanceIssueRefs: unique([
      ...governanceIssueRefs,
      ...l8Result.stages.flatMap((stage) => stage.governance_issue_refs),
    ]),
    l8Result,
    blockedReason: l8Result.ok ? undefined : "l8_local_chain_blocked",
  });
}

function mapB3Inputs(
  entities: RuntimeLikeEntity[],
  governanceIssueRefs: string[],
): {
  inputs: B3ReceiverFeedbackInput[];
  sourceIds: string[];
  allowed: boolean;
  blockedReason?: string;
} {
  const candidates = entities.filter(
    (entity) =>
      entity.entity_type === "canonical_variable_record" &&
      (entity.variable_name === "receiver_feedback" ||
        entity.route_id === B3_ROUTE),
  );
  const invalid = candidates.filter(
    (entity) =>
      entity.route_id !== B3_ROUTE ||
      !hasTraceability(entity) ||
      !entity.literal_value,
  );
  if (invalid.length > 0) {
    governanceIssueRefs.push("RUNTIME_B3_ROUTE_OR_TRACEABILITY_GAP");
  }

  const inputs = candidates
    .filter(
      (entity) =>
        entity.route_id === B3_ROUTE &&
        hasTraceability(entity) &&
        Boolean(entity.literal_value),
    )
    .map((entity): B3ReceiverFeedbackInput => ({
      case_id: entity.case_id,
      scene_id: entity.scene_id ?? `scene:${entity.runtime_entity_id}`,
      output_handoff_ref: stringMeta(entity, "output_handoff_ref") ?? entity.runtime_entity_id,
      receiver_satisfaction_value: stringMeta(entity, "receiver_satisfaction_value"),
      receiver_feedback_exists: true,
      receiver_feedback_literal: entity.literal_value,
      receiver_feedback_type:
        stringMeta(entity, "receiver_feedback_type") ?? "operational_blocker",
      receiver_feedback_route_status: "route_validated",
      canonical_route_ref: B3_ROUTE,
      source_ref: entity.source_ref,
      derivation_ref: entity.derivation_ref,
      delivery_failure_known: true,
    }));

  return {
    inputs,
    sourceIds: candidates.map((entity) => entity.runtime_entity_id),
    allowed: inputs.length > 0,
    blockedReason: inputs.length > 0 ? undefined : "runtime_b3_input_missing",
  };
}

function mapB7Inputs(
  entities: RuntimeLikeEntity[],
  governanceIssueRefs: string[],
): {
  inputs: B7PreclassificationInput[];
  sourceIds: string[];
  allowed: boolean;
  blockedReason?: string;
} {
  const candidates = entities.filter(
    (entity) =>
      (entity.entity_type === "structural_candidate_record" ||
        entity.entity_type === "canonical_variable_record") &&
      (entity.variable_name?.includes("preclassification") ||
        entity.route_id?.includes("B7")),
  );
  const invalid = candidates.filter((entity) => !hasTraceability(entity));
  if (invalid.length > 0) {
    governanceIssueRefs.push("RUNTIME_B7_TRACEABILITY_GAP");
  }

  const inputs = candidates
    .filter(hasTraceability)
    .map((entity): B7PreclassificationInput => ({
      case_id: entity.case_id,
      scene_id: entity.scene_id ?? `scene:${entity.runtime_entity_id}`,
      source_b7_ref: entity.source_ref,
      derivation_ref: entity.derivation_ref,
      preclassification_ahe_level_dominant:
        stringMeta(entity, "preclassification_ahe_level_dominant") ?? entity.normalized_value,
      preclassification_interpersonal_signal:
        entity.literal_value ?? entity.normalized_value,
      preclassification_interpersonal_note: entity.literal_value,
      preclassification_interpersonal_confirmation:
        stringMeta(entity, "preclassification_interpersonal_confirmation") ??
        "pending",
      preclassification_ahe_bundle_refined:
        stringMeta(entity, "preclassification_ahe_bundle_refined") ??
        entity.runtime_entity_id,
      interpretation_limit: B7_INTERPRETATION_LIMIT,
      attempted_consumer: "none",
    }));

  return {
    inputs,
    sourceIds: candidates.map((entity) => entity.runtime_entity_id),
    allowed: inputs.length > 0,
    blockedReason: inputs.length > 0 ? undefined : "runtime_b7_input_missing",
  };
}

function mapEvidenceBundles(
  input: Runtime4020ToL8BridgeInput,
  b7Inputs: B7PreclassificationInput[],
): {
  bundles: EvidenceBundleInput[];
  sourceIds: string[];
  allowed: boolean;
  blockedReason?: string;
} {
  const evidenceEntities = input.runtime_entities.filter(
    (entity) =>
      entity.entity_type === "evidence_item" &&
      hasTraceability(entity) &&
      Boolean(entity.literal_value),
  );
  const b7Evidence = b7Inputs.map((b7) => ({
    source_ref: b7.source_b7_ref,
    derivation_ref: b7.derivation_ref,
    signal:
      b7.preclassification_interpersonal_signal ??
      b7.preclassification_ahe_level_dominant ??
      "runtime_b7_signal_only",
    interpretation_limit: B7_INTERPRETATION_LIMIT,
  }));
  const bundles = evidenceEntities.map(
    (entity, index): EvidenceBundleInput => ({
      bundle_id: `RUNTIME_BRIDGE_BUNDLE:${entity.runtime_entity_id}`,
      case_id: input.case_id,
      state: "ready_for_transduction",
      source_ref: entity.source_ref,
      derivation_ref: entity.derivation_ref,
      readiness_decision_ref:
        findReadinessDecision(input.runtime_entities)?.source_ref ??
        `LOCAL_READINESS_DECISION:${input.case_id}:RUNTIME_BRIDGE:${index + 1}`,
      evidence_items: [
        {
          evidence_item_id: entity.runtime_entity_id,
          source_ref: entity.source_ref,
          derivation_ref: entity.derivation_ref,
          literal_value: entity.literal_value ?? "",
          normalized_value: entity.normalized_value,
          actor_role_ref: stringMeta(entity, "actor_role_ref"),
          object_ref: stringMeta(entity, "object_ref"),
          event_ref: entity.scene_id,
          epistemic_status: stringMeta(entity, "epistemic_status") ?? "evidence_linked",
        },
      ],
      b7_preclassification_evidence: b7Evidence,
    }),
  );

  return {
    bundles,
    sourceIds: evidenceEntities.map((entity) => entity.runtime_entity_id),
    allowed: bundles.length >= (input.options?.minimum_validated_scenes ?? 2),
    blockedReason:
      bundles.length >= (input.options?.minimum_validated_scenes ?? 2)
        ? undefined
        : "runtime_evidence_insufficient_for_l8_chain",
  };
}

function result(params: {
  caseId: string;
  handoffs: Runtime4020BridgeHandoff[];
  governanceIssueRefs: string[];
  l8Result?: Runtime4020ToL8BridgeResult["l8_result"];
  blockedReason?: string;
}): Runtime4020ToL8BridgeResult {
  const ok =
    Boolean(params.l8Result?.ok) &&
    params.handoffs.every((handoffItem) => handoffItem.allowed);

  return {
    ok,
    case_id: params.caseId,
    handoffs: params.handoffs,
    l8_result: params.l8Result,
    blocked_reason: ok ? undefined : params.blockedReason,
    governance_issue_refs: unique(params.governanceIssueRefs),
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function handoff(
  to: Runtime4020BridgeHandoff["to"],
  sourceIds: string[],
  allowed: boolean,
  blockedReason?: string,
): Runtime4020BridgeHandoff {
  return {
    from: "RuntimeLikeEntity",
    to,
    source_runtime_entity_ids: unique(sourceIds),
    allowed,
    blocked_reason: allowed ? undefined : blockedReason,
  };
}

function firstBlockedReason(
  handoffs: Runtime4020BridgeHandoff[],
): string | undefined {
  return handoffs.find((handoffItem) => !handoffItem.allowed)?.blocked_reason;
}

function hasTraceability(entity: RuntimeLikeEntity): boolean {
  return Boolean(entity.source_ref) && Boolean(entity.derivation_ref);
}

function findReadinessDecision(
  entities: RuntimeLikeEntity[],
): RuntimeLikeEntity | undefined {
  return entities.find(
    (entity) =>
      entity.entity_type === "readiness_decision_record" &&
      hasTraceability(entity),
  );
}

function stringMeta(
  entity: RuntimeLikeEntity,
  key: string,
): string | undefined {
  const value = entity.metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
