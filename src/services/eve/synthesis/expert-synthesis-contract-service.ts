import type {
  DeliveryBoundary,
  ExpertSynthesisContractInput,
  ExpertSynthesisContractResult,
  SynthesisCase,
} from "./expert-synthesis-types";

import type { PeliculaCausalAgregada } from "../aggregation/causal-movie-types";

const NO_GO: ExpertSynthesisContractResult["no_go"] = {
  diagnostico_experto_final_delivered_created: false,
  client_narrative_created: false,
  consultive_recommendation_created: false,
  teorema_inevitabilidad_created: false,
  export_code_package_created: false,
  registry_created: false,
  ir_created: false,
  runtime_40_20_full_opened: false,
};

const MATERIALITY: ExpertSynthesisContractResult["materiality"] = {
  level: "L6 service_present",
  marker_candidate: "PF_SUP_05_MATERIALITY_MARKER",
  implementation_scope: "local_pure_service_only",
};

const FORBIDDEN_OUTPUTS: DeliveryBoundary["forbidden_outputs"] = [
  "diagnostico_experto_final_delivered",
  "client_narrative",
  "consultive_recommendation",
  "teorema_inevitabilidad",
  "export_code_package_generated",
];

export function runExpertSynthesisContract(
  input: ExpertSynthesisContractInput,
): ExpertSynthesisContractResult {
  const version = input.options?.version ?? "pf-sup-05-local-contract-service-v1";
  const pelicula = input.pelicula_causal_agregada;
  const readinessDecisionRef =
    pelicula.readiness_decision_ref ??
    `LOCAL_READINESS_DECISION:${input.case_id}:PF_SUP_05`;
  const governanceIssueRefs = unique(pelicula.governance_issue_refs ?? []);
  const weakTraceabilityFlags = getWeakTraceabilityFlags(pelicula);

  let blockedReason: string | undefined;

  if (pelicula.state !== "aggregated") {
    governanceIssueRefs.push("PF_SUP_05_NON_AGGREGATED_MOVIE");
    blockedReason = "non_aggregated_movie";
  }

  if (weakTraceabilityFlags.length > 0) {
    governanceIssueRefs.push("PF_SUP_05_WEAK_TRACEABILITY");
    blockedReason = blockedReason ?? "weak_traceability";
  }

  const synthesisCase = buildSynthesisCase({
    caseId: input.case_id,
    pelicula,
    governanceIssueRefs,
    readinessDecisionRef,
    weakTraceabilityFlags,
    version,
    state: blockedReason
      ? "blocked_by_weak_traceability"
      : "ready_for_expert_draft",
  });
  const deliveryBoundary = buildDeliveryBoundary({
    caseId: input.case_id,
    synthesisCase,
    governanceIssueRefs,
    readinessDecisionRef,
  });

  return {
    ok: !blockedReason,
    synthesis_case: synthesisCase,
    delivery_boundary: deliveryBoundary,
    blocked_reason: blockedReason,
    governance_issue_refs: unique(governanceIssueRefs),
    readiness_decision_ref: readinessDecisionRef,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function getWeakTraceabilityFlags(
  pelicula: PeliculaCausalAgregada,
): string[] {
  const flags: string[] = [];

  if (!pelicula.scene_set_ref) {
    flags.push("missing_scene_set_ref");
  }
  if (!pelicula.aggregation_index_ref) {
    flags.push("missing_aggregation_index_ref");
  }
  if (!pelicula.readiness_decision_ref) {
    flags.push("missing_readiness_decision_ref");
  }

  return flags;
}

function buildSynthesisCase(params: {
  caseId: string;
  pelicula: PeliculaCausalAgregada;
  governanceIssueRefs: string[];
  readinessDecisionRef: string;
  weakTraceabilityFlags: string[];
  version: string;
  state: SynthesisCase["state"];
}): SynthesisCase {
  return {
    synthesis_case_id: `SYNTHESIS_CASE:${params.pelicula.pelicula_id}`,
    case_id: params.caseId,
    pelicula_causal_ref: params.pelicula.pelicula_id,
    traceability_manifest: {
      pelicula_state: params.pelicula.state,
      scene_set_ref: params.pelicula.scene_set_ref,
      aggregation_index_ref: params.pelicula.aggregation_index_ref,
      source_refs_count: countSourceRefs(params.pelicula),
      governance_issue_refs_count: params.governanceIssueRefs.length,
    },
    expert_review_required: true,
    weak_traceability_flags: params.weakTraceabilityFlags,
    authorization_boundary_ref: `DELIVERY_BOUNDARY:${params.pelicula.pelicula_id}`,
    governance_issue_refs: unique(params.governanceIssueRefs),
    readiness_decision_ref: params.readinessDecisionRef,
    state: params.state,
    version: params.version,
    audit_log: [
      {
        event: "pf_sup_05_synthesis_case_materialized",
        delivery_status: "delivery_blocked",
        delivered_created: false,
      },
    ],
  };
}

function buildDeliveryBoundary(params: {
  caseId: string;
  synthesisCase: SynthesisCase;
  governanceIssueRefs: string[];
  readinessDecisionRef: string;
}): DeliveryBoundary {
  return {
    delivery_boundary_id: params.synthesisCase.authorization_boundary_ref,
    case_id: params.caseId,
    synthesis_case_ref: params.synthesisCase.synthesis_case_id,
    state: "delivery_blocked",
    authorization_checked: true,
    delivery_authorized: false,
    delivery_block_reason: "delivery_not_authorized_in_this_tramo",
    forbidden_outputs: FORBIDDEN_OUTPUTS,
    governance_issue_refs: unique([
      ...params.governanceIssueRefs,
      "PF_SUP_05_DELIVERY_BLOCKED_IN_THIS_TRAMO",
    ]),
    readiness_decision_ref: params.readinessDecisionRef,
    audit_log: [
      {
        event: "pf_sup_05_delivery_boundary_created",
        delivery_authorized: false,
        delivered_created: false,
      },
    ],
  };
}

function countSourceRefs(pelicula: PeliculaCausalAgregada): number {
  return [
    pelicula.scene_set_ref,
    pelicula.aggregation_index_ref,
    ...pelicula.pattern_refs,
    ...pelicula.monetizable_signal_refs,
    ...pelicula.loss_estimate_refs,
    ...pelicula.ahe_blockage_refs,
  ].filter(Boolean).length;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

