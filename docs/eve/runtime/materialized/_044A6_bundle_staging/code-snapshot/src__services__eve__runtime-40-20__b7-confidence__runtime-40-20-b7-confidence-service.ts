/**
 * B7 Confidence — epistemic stability of the observation only.
 * Rector: EVE_Runtime_B7_Confidence_Governance_Rule_v1_0
 *
 * Diagnostic Non-Contamination Boundary:
 * The Runtime shall not use observed organizational pathology,
 * MMABP structural inconsistency, VSM dysfunction or AHE signals
 * as negative evidence for confidence.
 *
 * Confidence measures the epistemic stability of the observation,
 * not the health of the observed organization.
 *
 * confidence_level is authoritative for C20.
 * confidence_score is nullable / non-authoritative.
 */
import {
  B7_CONFIDENCE_RECTOR_ID,
  FORBIDDEN_EVE_PATHOLOGY_NAMES,
  type B7ConfidenceInput,
  type B7ConfidenceResult,
  type ConfidenceLevel,
} from "./runtime-40-20-b7-confidence-types";

const FORBIDDEN_FEATURE_KEYS = new Set([
  "pathology",
  "pathology_name",
  "eve_pathology",
  "vsm_viability",
  "organizational_health",
  "suma_cero",
  "diagnostic_severity",
  "ahe_signal_as_penalty",
  "workaround_penalty",
  "sacrifice_penalty",
  "deadlock_penalty",
  "pm_pf_olc_mismatch_penalty",
]);

function collectRejectedPathologyFeatures(input: B7ConfidenceInput): string[] {
  const rejected: string[] = [];
  for (const name of input.injected_pathology_names ?? []) {
    rejected.push(String(name));
  }
  for (const name of FORBIDDEN_EVE_PATHOLOGY_NAMES) {
    if ((input.injected_pathology_names ?? []).includes(name)) {
      // already listed
      continue;
    }
  }
  const bag = input.forbidden_feature_bag ?? {};
  for (const key of Object.keys(bag)) {
    if (FORBIDDEN_FEATURE_KEYS.has(key)) {
      rejected.push(key);
    }
    const val = bag[key];
    if (typeof val === "string") {
      for (const pathology of FORBIDDEN_EVE_PATHOLOGY_NAMES) {
        if (val.includes(pathology) || val === pathology) {
          rejected.push(pathology);
        }
      }
    }
  }
  for (const ref of input.diagnostic_candidate_refs ?? []) {
    for (const pathology of FORBIDDEN_EVE_PATHOLOGY_NAMES) {
      if (String(ref).includes(pathology)) {
        rejected.push(pathology);
      }
    }
  }
  return [...new Set(rejected)];
}

/**
 * Deterministic epistemic classifier.
 * Does NOT invent weighted pathology scores.
 * Does NOT use business_structural_inconsistency_observed to lower level.
 */
export function evaluateB7Confidence(
  input: B7ConfidenceInput,
): B7ConfidenceResult {
  const rejected = collectRejectedPathologyFeatures(input);
  const audit: B7ConfidenceResult["audit_events"] = [];

  const businessObserved = input.business_structural_inconsistency_observed === true;
  const businessRefs = [...(input.business_structural_inconsistency_refs ?? [])];

  if (businessObserved || businessRefs.length > 0) {
    audit.push({
      event_type: "business_structural_inconsistency_observed",
      detail:
        "Preserved for downstream diagnosis; not used as confidence penalty.",
    });
  }

  const epistemicAmbiguity =
    input.epistemic_ambiguity_status === "resolvable" ||
    input.epistemic_ambiguity_status === "unresolved";
  if (epistemicAmbiguity) {
    audit.push({
      event_type: "epistemic_ambiguity_detected",
      detail: `status=${input.epistemic_ambiguity_status}`,
    });
  }

  const epistemicContradiction =
    input.epistemic_contradiction_status === "epistemic_pending";
  if (epistemicContradiction) {
    audit.push({
      event_type: "epistemic_contradiction_detected",
      detail: "incompatible evidences block canonical fact determination",
    });
  }

  // --- LOW: epistemic inability to know the fact ---
  const lowReasons: string[] = [];
  if (
    input.evidence_completeness_status === "incomplete" ||
    input.evidence_completeness_status === "missing"
  ) {
    lowReasons.push("evidence_insufficient");
  }
  if (
    input.provenance_status === "open" ||
    input.provenance_status === "missing"
  ) {
    lowReasons.push("provenance_insufficient");
  }
  if (input.canonical_route_status === "missing_critical") {
    lowReasons.push("canonical_route_critical_unclosed");
  }
  if (input.microconfirmation_state === "unresolved_after_attempt") {
    lowReasons.push("microconfirmation_unresolved_after_attempt");
  }
  if (
    input.epistemic_contradiction_status === "epistemic_pending" &&
    input.microconfirmation_state === "unresolved_after_attempt"
  ) {
    lowReasons.push("epistemic_contradiction_persists_after_microconfirmation");
  }
  if (input.required_signal_status === "missing_governed_signal") {
    lowReasons.push("missing_governed_signal_indispensable");
  }
  if (input.epistemic_ambiguity_status === "unresolved") {
    lowReasons.push("epistemic_ambiguity_unresolved");
  }

  let level: ConfidenceLevel;
  let reasoning: string;

  if (lowReasons.length > 0) {
    level = "low";
    reasoning = `Epistemic LOW: ${lowReasons.join("; ")}. Business inconsistency does not drive this level.`;
  } else if (
    input.epistemic_ambiguity_status === "resolvable" ||
    input.epistemic_contradiction_status === "epistemic_pending" ||
    input.microconfirmation_state === "pending"
  ) {
    level = "medium";
    const mediumBits: string[] = [];
    if (input.epistemic_ambiguity_status === "resolvable") {
      mediumBits.push("resolvable_epistemic_ambiguity");
    }
    if (input.epistemic_contradiction_status === "epistemic_pending") {
      mediumBits.push("epistemic_contradiction_pending_resolvable");
    }
    if (input.microconfirmation_state === "pending") {
      mediumBits.push("microconfirmation_pending");
    }
    reasoning = `Epistemic MEDIUM: ${mediumBits.join("; ")}. C20 may open to resolve epistemic uncertainty, not business pathology.`;
  } else {
    level = "high";
    reasoning = businessObserved
      ? "Epistemic HIGH: evidence/provenance/routes closed; business_structural_inconsistency_observed preserved for diagnosis (not a confidence penalty)."
      : "Epistemic HIGH: evidence complete, provenance closed, canonical routes closed, no epistemic ambiguity/contradiction, microconfirmation not pending.";
  }

  audit.push({
    event_type: "b7_confidence_evaluated",
    detail: `level=${level}; rejected_pathology_features=${rejected.length}`,
  });

  return {
    rector: B7_CONFIDENCE_RECTOR_ID,
    confidence_level: level,
    confidence_score: null,
    confidence_reasoning: reasoning,
    epistemic_flags: {
      epistemic_ambiguity_detected: epistemicAmbiguity,
      epistemic_contradiction_detected: epistemicContradiction,
      business_structural_inconsistency_observed: businessObserved,
    },
    rejected_pathology_features: rejected,
    ignored_business_inconsistency_refs: businessRefs,
    diagnostic_non_contamination_boundary: "enforced",
    EVE_pathology_inputs_to_confidence: 0,
    business_inconsistency_preservation: true,
    epistemic_vs_structural_contradiction_separated: true,
    audit_events: audit,
    writes_scene: false,
    writes_mba: false,
  };
}

/**
 * Build epistemic input from regulatory/canonical bag without inventing
 * pathology penalties. Business inconsistency refs are transport-only.
 */
export function buildB7ConfidenceInputFromEvidence(params: {
  evidence_completeness_status: B7ConfidenceInput["evidence_completeness_status"];
  provenance_status: B7ConfidenceInput["provenance_status"];
  canonical_route_status: B7ConfidenceInput["canonical_route_status"];
  epistemic_ambiguity_status?: B7ConfidenceInput["epistemic_ambiguity_status"];
  epistemic_contradiction_status?: B7ConfidenceInput["epistemic_contradiction_status"];
  microconfirmation_state?: B7ConfidenceInput["microconfirmation_state"];
  required_signal_status?: B7ConfidenceInput["required_signal_status"];
  capture_gap_refs?: string[];
  business_structural_inconsistency_observed?: boolean;
  business_structural_inconsistency_refs?: string[];
  diagnostic_candidate_refs?: string[];
  injected_pathology_names?: string[];
  forbidden_feature_bag?: Record<string, unknown>;
}): B7ConfidenceInput {
  return {
    evidence_completeness_status: params.evidence_completeness_status,
    provenance_status: params.provenance_status,
    canonical_route_status: params.canonical_route_status,
    epistemic_ambiguity_status: params.epistemic_ambiguity_status ?? "none",
    epistemic_contradiction_status:
      params.epistemic_contradiction_status ?? "none",
    microconfirmation_state: params.microconfirmation_state ?? "not_required",
    required_signal_status: params.required_signal_status ?? "present",
    capture_gap_refs: params.capture_gap_refs ?? [],
    business_structural_inconsistency_observed:
      params.business_structural_inconsistency_observed === true,
    business_structural_inconsistency_refs:
      params.business_structural_inconsistency_refs ?? [],
    diagnostic_candidate_refs: params.diagnostic_candidate_refs ?? [],
    injected_pathology_names: params.injected_pathology_names ?? [],
    forbidden_feature_bag: params.forbidden_feature_bag ?? {},
  };
}

export const Runtime40_20B7ConfidenceService = {
  evaluateB7Confidence,
  buildB7ConfidenceInputFromEvidence,
  B7_CONFIDENCE_RECTOR_ID,
  FORBIDDEN_EVE_PATHOLOGY_NAMES,
};
