/**
 * Runtime 40/20 readiness guard.
 * ready requires BaseResolutionGate + CausalClosureGate pass.
 * Blocks EvidenceBundle/MDSB handoff when sufficiency rules fail.
 * Missing operational_rules_run on deep primary capture blocks ready / handoffs.
 */

import {
  evaluateBaseResolutionGate,
  type ActivityRuntimeRunBaseInput,
  type BaseResolutionGateResult,
} from "./base-resolution-gate";
import {
  evaluateCausalClosureGate,
  type ActivityRuntimeRunCausalInput,
  type CausalClosureGateResult,
} from "./causal-closure-gate";
import { RUNTIME_40_20_OPERATIONAL_RULES_VERSION } from "./base40-operational-rule";

/** When true, absence of operational_rules_run blocks ready / ready_with_flags / handoffs. */
export const OPERATIONAL_RULES_MISSING_BLOCKS_READY = true as const;

export const MISSING_OPERATIONAL_RULES_RUN_REASON =
  "missing_runtime_40_20_operational_rules_run" as const;

export type Runtime4020ReadinessState =
  | "ready"
  | "ready_with_flags"
  | "blocked"
  | "reentry_required"
  | "manual_review_required"
  | "blocked_by_missing_canonical_route"
  | "partial_evidence_only";

export type Runtime4020ReadinessGuardInput = ActivityRuntimeRunBaseInput &
  ActivityRuntimeRunCausalInput & {
    explicit_flags?: string[];
    free_text_without_canonical_provenance_or_route?: boolean;
    /**
     * When true (default for deep primary capture), payload must be present.
     * Set false only for documented non-Runtime-deep bypass.
     */
    runtime_deep_capture_required?: boolean;
    /**
     * Set to false when caller did not supply operational_rules_run.
     * Undefined/true means payload records are being evaluated directly.
     */
    operational_rules_run_present?: boolean;
  };

export type Runtime4020ReadinessGuardResult = {
  runtime_40_20_operational_rules_version: string;
  base_resolution_gate: BaseResolutionGateResult;
  causal_closure_gate: CausalClosureGateResult;
  readiness_state: Runtime4020ReadinessState;
  ready_full_allowed: boolean;
  ready_with_flags_allowed: boolean;
  handoff_to_evidence_bundle_allowed: boolean;
  handoff_to_mdsb_allowed: boolean;
  blocking_reasons: string[];
  explicit_flags: string[];
  /** Always true under current policy: missing ops payload blocks ready states. */
  operational_rules_missing_blocks_ready: typeof OPERATIONAL_RULES_MISSING_BLOCKS_READY;
};

function pickWorseState(
  a: Runtime4020ReadinessState,
  b: Runtime4020ReadinessState,
): Runtime4020ReadinessState {
  const rank: Record<Runtime4020ReadinessState, number> = {
    ready: 0,
    ready_with_flags: 1,
    partial_evidence_only: 2,
    reentry_required: 3,
    manual_review_required: 4,
    blocked_by_missing_canonical_route: 5,
    blocked: 6,
  };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Guard result when operational_rules_run is absent on deep primary capture.
 * Blocks ready, ready_with_flags, EvidenceBundle handoff, and MDSB handoff.
 */
export function evaluateMissingOperationalRulesRunGuard(): Runtime4020ReadinessGuardResult {
  const base_resolution_gate = evaluateBaseResolutionGate({ base_resolutions: [] });
  const causal_closure_gate = evaluateCausalClosureGate({ causal_closures: [] });
  return {
    runtime_40_20_operational_rules_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
    base_resolution_gate,
    causal_closure_gate,
    readiness_state: "blocked",
    ready_full_allowed: false,
    ready_with_flags_allowed: false,
    handoff_to_evidence_bundle_allowed: false,
    handoff_to_mdsb_allowed: false,
    blocking_reasons: [MISSING_OPERATIONAL_RULES_RUN_REASON],
    explicit_flags: [],
    operational_rules_missing_blocks_ready: OPERATIONAL_RULES_MISSING_BLOCKS_READY,
  };
}

/**
 * Returns a blocking guard when deep capture requires operational_rules_run and it is absent.
 * Returns null when presence check passes or non-deep bypass is explicit.
 */
export function evaluateDeepCaptureOperationalRulesPresence(input: {
  operational_rules_run_present: boolean;
  runtime_deep_capture_required?: boolean;
}): Runtime4020ReadinessGuardResult | null {
  if (input.runtime_deep_capture_required === false) return null;
  if (input.operational_rules_run_present) return null;
  if (!OPERATIONAL_RULES_MISSING_BLOCKS_READY) return null;
  return evaluateMissingOperationalRulesRunGuard();
}

export function evaluateRuntime4020ReadinessGuard(
  input: Runtime4020ReadinessGuardInput,
): Runtime4020ReadinessGuardResult {
  // Explicit absence of operational_rules_run on deep capture blocks immediately.
  if (input.operational_rules_run_present === false) {
    const blocked = evaluateDeepCaptureOperationalRulesPresence({
      operational_rules_run_present: false,
      runtime_deep_capture_required: input.runtime_deep_capture_required,
    });
    if (blocked) return blocked;
  }

  const base_resolution_gate = evaluateBaseResolutionGate(input);
  const causal_closure_gate = evaluateCausalClosureGate(input);
  const explicit_flags = (input.explicit_flags ?? []).filter(
    (flag) => typeof flag === "string" && flag.trim().length > 0,
  );

  const blocking_reasons = [
    ...base_resolution_gate.blocking_reasons,
    ...causal_closure_gate.blocking_reasons,
  ];

  if (input.free_text_without_canonical_provenance_or_route === true) {
    blocking_reasons.push("free_text_without_canonical_provenance_or_route");
  }

  if (base_resolution_gate.skipped_silently_count > 0) {
    blocking_reasons.push("base_skipped_silently_blocks_ready");
  }
  if (base_resolution_gate.missing_status_count > 0) {
    blocking_reasons.push("base_missing_status_blocks_handoff");
  }
  if (causal_closure_gate.triggered_unanswered_count > 0) {
    blocking_reasons.push("triggered_causal_unanswered_blocks_ready");
  }
  if (causal_closure_gate.p0_blockers.length > 0) {
    blocking_reasons.push(
      `p0_open_blockers:${causal_closure_gate.p0_blockers.join(",")}`,
    );
  }
  if (causal_closure_gate.activation_unknown_count > 0) {
    blocking_reasons.push("activation_unknown_blocks_ready_full");
  }

  const uniqueReasons = [...new Set(blocking_reasons)];

  const ready_full_allowed =
    base_resolution_gate.passed_for_ready_full &&
    causal_closure_gate.passed_for_ready_full &&
    input.free_text_without_canonical_provenance_or_route !== true;

  const criticalHandoffBlocked =
    base_resolution_gate.skipped_silently_count > 0 ||
    base_resolution_gate.missing_status_count > 0 ||
    !base_resolution_gate.handoff_to_evidence_bundle_mdsb_allowed ||
    causal_closure_gate.triggered_unanswered_count > 0 ||
    causal_closure_gate.p0_blockers.length > 0 ||
    causal_closure_gate.activation_unknown_count > 0 ||
    !causal_closure_gate.handoff_to_evidence_bundle_mdsb_allowed ||
    input.free_text_without_canonical_provenance_or_route === true ||
    !causal_closure_gate.c20_non_diagnostic_boundary_respected;

  const ready_with_flags_allowed =
    !ready_full_allowed &&
    explicit_flags.length > 0 &&
    base_resolution_gate.skipped_silently_count === 0 &&
    base_resolution_gate.missing_status_count === 0 &&
    causal_closure_gate.p0_blockers.length === 0 &&
    causal_closure_gate.activation_unknown_count === 0 &&
    causal_closure_gate.triggered_unanswered_count === 0 &&
    input.free_text_without_canonical_provenance_or_route !== true &&
    causal_closure_gate.c20_non_diagnostic_boundary_respected &&
    (base_resolution_gate.allowed_next_state === "ready_with_flags" ||
      causal_closure_gate.allowed_next_state === "ready_with_flags" ||
      base_resolution_gate.ready_with_flag_count > 0);

  let readiness_state: Runtime4020ReadinessState = pickWorseState(
    base_resolution_gate.allowed_next_state,
    causal_closure_gate.allowed_next_state === "blocked_by_missing_canonical_route"
      ? "blocked_by_missing_canonical_route"
      : causal_closure_gate.allowed_next_state,
  );

  if (ready_full_allowed) {
    readiness_state = "ready";
  } else if (ready_with_flags_allowed) {
    readiness_state = "ready_with_flags";
  } else if (readiness_state === "ready") {
    readiness_state = "blocked";
  }

  return {
    runtime_40_20_operational_rules_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
    base_resolution_gate,
    causal_closure_gate,
    readiness_state,
    ready_full_allowed,
    ready_with_flags_allowed,
    handoff_to_evidence_bundle_allowed: ready_full_allowed && !criticalHandoffBlocked,
    handoff_to_mdsb_allowed: ready_full_allowed && !criticalHandoffBlocked,
    blocking_reasons: uniqueReasons,
    explicit_flags,
    operational_rules_missing_blocks_ready: OPERATIONAL_RULES_MISSING_BLOCKS_READY,
  };
}

/**
 * Compatibility helper for existing gates-readiness resolveReadinessState path.
 */
export function applyOperationalRulesToReadinessState(input: {
  proposed_state: Runtime4020ReadinessState | "ready" | "ready_with_flags" | "blocked" | "reentry_required" | "manual_review_required";
  guard: Runtime4020ReadinessGuardResult;
}): Runtime4020ReadinessState {
  if (input.guard.ready_full_allowed && input.proposed_state === "ready") {
    return "ready";
  }
  if (input.proposed_state === "ready" && !input.guard.ready_full_allowed) {
    if (input.guard.ready_with_flags_allowed) return "ready_with_flags";
    return input.guard.readiness_state === "ready"
      ? "blocked"
      : input.guard.readiness_state;
  }
  if (
    input.proposed_state === "ready_with_flags" &&
    !input.guard.ready_with_flags_allowed &&
    !input.guard.ready_full_allowed
  ) {
    return input.guard.readiness_state === "ready" ||
      input.guard.readiness_state === "ready_with_flags"
      ? "blocked"
      : input.guard.readiness_state;
  }
  return pickWorseState(
    input.proposed_state as Runtime4020ReadinessState,
    input.guard.readiness_state,
  );
}
