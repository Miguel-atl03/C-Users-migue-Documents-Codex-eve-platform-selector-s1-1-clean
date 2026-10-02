import type {
  ActoObservable,
  EvidenceBundleInput,
  EvidenceItemInput,
  EscenaEvidencial,
  EvidentialSceneRunnerInput,
  EvidentialSceneRunnerResult,
} from "./evidential-scene-types";

const ACCEPTED_BUNDLE_STATES = new Set(["ready_for_transduction", "frozen"]);

const NO_GO: EvidentialSceneRunnerResult["no_go"] = {
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  b7_promoted_to_diagnosis: false,
};

const MATERIALITY: EvidentialSceneRunnerResult["materiality"] = {
  level: "L6 service_present",
  marker_candidate: "PF_SUP_03_MATERIALITY_MARKER",
  implementation_scope: "local_pure_service_only",
};

export function runEvidentialSceneTransduction(
  input: EvidentialSceneRunnerInput,
): EvidentialSceneRunnerResult {
  const bundle = input.evidence_bundle;
  const version = input.options?.version ?? "pf-sup-03-executable-slice-v1";
  const minimumObservableActs = input.options?.minimum_observable_acts ?? 1;
  const governanceIssueRefs = unique(bundle.governance_issue_refs ?? []);
  const readinessDecisionRef =
    bundle.readiness_decision_ref ??
    `LOCAL_READINESS_DECISION:${bundle.case_id}:${bundle.bundle_id}`;

  const bundleBlockReason = getBundleBlockReason(bundle);
  const actosObservables = bundle.evidence_items.map((item, index) =>
    toActoObservable(item, bundle, index),
  );
  const acceptedActs = actosObservables.filter((act) => act.state === "accepted");
  const rejectedActs = actosObservables.filter((act) => act.state !== "accepted");
  const b7Signals = bundle.b7_preclassification_evidence ?? [];
  const b7BoundaryValid = b7Signals.every(
    (signal) =>
      Boolean(signal.source_ref) &&
      Boolean(signal.derivation_ref) &&
      signal.interpretation_limit === "non_diagnostic_preclassification_only",
  );

  for (const act of rejectedActs) {
    governanceIssueRefs.push(...act.issue_refs);
  }

  if (bundleBlockReason) {
    governanceIssueRefs.push("PF_SUP_03_BUNDLE_NOT_READY_FOR_TRANSDUCTION");
    return blockedResult({
      bundle,
      version,
      actosObservables,
      governanceIssueRefs,
      readinessDecisionRef,
      reason: bundleBlockReason,
      b7SignalsCount: b7Signals.length,
    });
  }

  if (!b7BoundaryValid) {
    governanceIssueRefs.push("PF_SUP_03_B7_BOUNDARY_INVALID");
    return blockedResult({
      bundle,
      version,
      actosObservables,
      governanceIssueRefs,
      readinessDecisionRef,
      reason: "b7_boundary_invalid",
      b7SignalsCount: b7Signals.length,
    });
  }

  if (acceptedActs.length < minimumObservableActs) {
    governanceIssueRefs.push("PF_SUP_03_INSUFFICIENT_CAUSALITY");
    return blockedResult({
      bundle,
      version,
      actosObservables,
      governanceIssueRefs,
      readinessDecisionRef,
      reason: "insufficient_causality",
      b7SignalsCount: b7Signals.length,
    });
  }

  const escena = buildEscenaEvidencial({
    bundle,
    actosObservables: acceptedActs,
    governanceIssueRefs,
    readinessDecisionRef,
    state: "validated",
    version,
    b7SignalsCount: b7Signals.length,
  });

  return {
    ok: true,
    escena_evidencial: escena,
    actos_observables: actosObservables,
    governance_issue_refs: unique(governanceIssueRefs),
    readiness_decision_ref: readinessDecisionRef,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function getBundleBlockReason(bundle: EvidenceBundleInput): string | undefined {
  if (ACCEPTED_BUNDLE_STATES.has(bundle.state)) {
    return undefined;
  }

  if (
    bundle.state === "ready_with_flags" &&
    Boolean(bundle.readiness_decision_ref) &&
    (bundle.governance_issue_refs?.length ?? 0) > 0
  ) {
    return undefined;
  }

  return `evidence_bundle_state_${bundle.state}_not_accepted`;
}

function toActoObservable(
  item: EvidenceItemInput,
  bundle: EvidenceBundleInput,
  index: number,
): ActoObservable {
  const issueRefs: string[] = [];

  if (!item.source_ref) {
    issueRefs.push("PF_SUP_03_MISSING_SOURCE_REF");
  }
  if (!item.derivation_ref) {
    issueRefs.push("PF_SUP_03_MISSING_DERIVATION_REF");
  }
  if (!item.literal_value) {
    issueRefs.push("PF_SUP_03_MISSING_LITERAL_VALUE");
  }

  const accepted = issueRefs.length === 0;

  return {
    acto_observable_id: `ACTO_OBSERVABLE:${bundle.bundle_id}:${index + 1}`,
    source_evidence_ref: item.evidence_item_id,
    source_scene_ref: item.event_ref,
    actor_role_ref: item.actor_role_ref,
    observed_action: item.normalized_value ?? item.literal_value ?? "",
    observed_object: item.object_ref,
    material_trace: accepted ? `${item.source_ref}:${item.derivation_ref}` : "",
    epistemic_status: item.epistemic_status ?? "evidence_linked",
    state: accepted ? "accepted" : "rejected",
    issue_refs: issueRefs,
  };
}

function blockedResult(params: {
  bundle: EvidenceBundleInput;
  version: string;
  actosObservables: ActoObservable[];
  governanceIssueRefs: string[];
  readinessDecisionRef: string;
  reason: string;
  b7SignalsCount: number;
}): EvidentialSceneRunnerResult {
  const escena = buildEscenaEvidencial({
    bundle: params.bundle,
    actosObservables: params.actosObservables.filter(
      (act) => act.state === "accepted",
    ),
    governanceIssueRefs: params.governanceIssueRefs,
    readinessDecisionRef: params.readinessDecisionRef,
    state: "blocked_by_insufficient_causality",
    version: params.version,
    b7SignalsCount: params.b7SignalsCount,
    blockedReason: params.reason,
  });

  return {
    ok: false,
    escena_evidencial: escena,
    actos_observables: params.actosObservables,
    blocked_reason: params.reason,
    governance_issue_refs: unique(params.governanceIssueRefs),
    readiness_decision_ref: params.readinessDecisionRef,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function buildEscenaEvidencial(params: {
  bundle: EvidenceBundleInput;
  actosObservables: ActoObservable[];
  governanceIssueRefs: string[];
  readinessDecisionRef: string;
  state: EscenaEvidencial["state"];
  version: string;
  b7SignalsCount: number;
  blockedReason?: string;
}): EscenaEvidencial {
  return {
    escena_evidencial_id: `ESCENA_EVIDENCIAL:${params.bundle.bundle_id}`,
    case_id: params.bundle.case_id,
    evidence_bundle_id: params.bundle.bundle_id,
    source_scene_refs: unique(
      params.actosObservables
        .map((act) => act.source_scene_ref)
        .filter((ref): ref is string => Boolean(ref)),
    ),
    observable_act_refs: params.actosObservables.map(
      (act) => act.acto_observable_id,
    ),
    mmabp_element_refs: [],
    vsm_hypothesis_primary_refs: [],
    mmabp_inconsistency_refs: [],
    eve_local_node_refs: [],
    ahe_translation_refs: [],
    governance_issue_refs: unique(params.governanceIssueRefs),
    readiness_decision_ref: params.readinessDecisionRef,
    state: params.state,
    version: params.version,
    audit_log: [
      {
        event: "pf_sup_03_evidential_scene_transduction",
        bundle_state: params.bundle.state,
        accepted_observable_acts: params.actosObservables.length,
        blocked_reason: params.blockedReason ?? null,
      },
    ],
    b7_boundary: {
      preserved_as_non_diagnostic: true,
      signals_count: params.b7SignalsCount,
      forbidden_outputs_created: false,
    },
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

