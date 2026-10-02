/**
 * Causal Closure Gate — enforces CAUSAL-20 evaluation and triggered closure.
 */

import {
  CAUSAL20_CLOSED_STATES,
  CAUSAL20_IDS,
  CAUSAL20_OPEN_STATES,
  CAUSAL20_P0_IDS,
  type Causal20ClosureState,
  type Causal20Id,
  type CausalClosureRecord,
  isCausal20AllowedState,
  isCausal20Id,
  isC20NonDiagnosticBoundaryRespected,
} from "./causal20-operational-rule";

export type CausalClosureGateNextState =
  | "ready"
  | "ready_with_flags"
  | "blocked"
  | "reentry_required"
  | "manual_review_required"
  | "blocked_by_missing_canonical_route";

export type CausalClosureGateResult = {
  gate: "CausalClosureGate";
  passed_for_ready_full: boolean;
  total_required_evaluations: 20;
  evaluated_count: number;
  triggered_count: number;
  answered_closed_count: number;
  not_triggered_with_evidence_count: number;
  activation_unknown_count: number;
  route_missing_count: number;
  reentry_count: number;
  manual_review_count: number;
  triggered_unanswered_count: number;
  unresolved_causal_ids: string[];
  p0_blockers: string[];
  blocking_reasons: string[];
  allowed_next_state: CausalClosureGateNextState;
  c20_non_diagnostic_boundary_respected: boolean;
  ahe_prep_sufficient: boolean;
  handoff_to_evidence_bundle_mdsb_allowed: boolean;
};

export type ActivityRuntimeRunCausalInput = {
  activity_runtime_run_id?: string;
  causal_closures?: CausalClosureRecord[];
  /** Alias accepted for fixture/panel payloads. */
  causalClosureRecords?: CausalClosureRecord[];
};

function asRecords(input: ActivityRuntimeRunCausalInput): CausalClosureRecord[] {
  return input.causal_closures ?? input.causalClosureRecords ?? [];
}

function indexById(records: CausalClosureRecord[]): Map<string, CausalClosureRecord> {
  const map = new Map<string, CausalClosureRecord>();
  for (const record of records) {
    if (record?.causal_id) map.set(String(record.causal_id), record);
  }
  return map;
}

function isTriggeredOpen(state: Causal20ClosureState): boolean {
  return (
    state === "triggered_required" ||
    state === "triggered_unanswered" ||
    state === "route_missing" ||
    state === "contradiction_flag" ||
    state === "activation_unknown" ||
    state === "manual_review_required" ||
    state === "reentry_required"
  );
}

export function evaluateCausalClosureGate(
  activityRuntimeRun: ActivityRuntimeRunCausalInput,
): CausalClosureGateResult {
  const records = asRecords(activityRuntimeRun);
  const byId = indexById(records);
  const blocking_reasons: string[] = [];
  const unresolved_causal_ids: string[] = [];
  const p0_blockers: string[] = [];

  let evaluated_count = 0;
  let triggered_count = 0;
  let answered_closed_count = 0;
  let not_triggered_with_evidence_count = 0;
  let activation_unknown_count = 0;
  let route_missing_count = 0;
  let reentry_count = 0;
  let manual_review_count = 0;
  let triggered_unanswered_count = 0;
  let open_p1_without_explicit_gap = false;
  let open_p2 = false;
  let has_free_text_without_route = false;
  let c20_boundary_ok = true;

  for (const requiredId of CAUSAL20_IDS) {
    const record = byId.get(requiredId);
    if (!record) {
      unresolved_causal_ids.push(requiredId);
      blocking_reasons.push(`missing_activation_state:${requiredId}`);
      if (CAUSAL20_P0_IDS.has(requiredId)) p0_blockers.push(requiredId);
      continue;
    }

    const stateRaw = String(record.activation_state ?? "");
    if (!stateRaw || !isCausal20AllowedState(stateRaw)) {
      unresolved_causal_ids.push(requiredId);
      blocking_reasons.push(`invalid_or_missing_activation_state:${requiredId}`);
      if (CAUSAL20_P0_IDS.has(requiredId)) p0_blockers.push(requiredId);
      continue;
    }

    evaluated_count += 1;
    const state = stateRaw as Causal20ClosureState;

    if (requiredId === "C20") {
      c20_boundary_ok = isC20NonDiagnosticBoundaryRespected(record);
      if (!c20_boundary_ok) {
        blocking_reasons.push("c20_diagnosis_or_export_attempted");
        p0_blockers.push("C20");
      }
    }

    if (record.free_text_without_canonical_route === true) {
      has_free_text_without_route = true;
      blocking_reasons.push(`free_text_without_canonical_route:${requiredId}`);
    }

    if (state === "not_triggered_with_evidence") {
      if (!record.condition_evidence) {
        unresolved_causal_ids.push(requiredId);
        blocking_reasons.push(`condition_not_met_without_evidence:${requiredId}`);
      } else {
        not_triggered_with_evidence_count += 1;
      }
      continue;
    }

    if (CAUSAL20_CLOSED_STATES.has(state)) {
      if (state === "answered_closed" || state === "closed_by_confirmed_negative") {
        answered_closed_count += 1;
        triggered_count += 1;
      }
      continue;
    }

    if (CAUSAL20_OPEN_STATES.has(state)) {
      triggered_count += 1;
      unresolved_causal_ids.push(requiredId);
      blocking_reasons.push(`${state}:${requiredId}`);

      if (state === "activation_unknown") activation_unknown_count += 1;
      if (state === "route_missing") route_missing_count += 1;
      if (state === "reentry_required") reentry_count += 1;
      if (state === "manual_review_required") manual_review_count += 1;
      if (state === "triggered_unanswered") {
        triggered_unanswered_count += 1;
      }

      if (CAUSAL20_P0_IDS.has(requiredId) && isTriggeredOpen(state)) {
        p0_blockers.push(requiredId);
      }

      if (
        (requiredId === "C02" ||
          requiredId === "C03" ||
          requiredId === "C04" ||
          requiredId === "C08" ||
          requiredId === "C13" ||
          requiredId === "C14" ||
          requiredId === "C15") &&
        isTriggeredOpen(state) &&
        !record.condition_evidence
      ) {
        open_p1_without_explicit_gap = true;
      }

      if (
        (requiredId === "C16" ||
          requiredId === "C17" ||
          requiredId === "C18" ||
          requiredId === "C19") &&
        isTriggeredOpen(state)
      ) {
        open_p2 = true;
      }
    }
  }

  for (const record of records) {
    if (record.causal_id && !isCausal20Id(String(record.causal_id))) {
      blocking_reasons.push(`unknown_causal_id:${record.causal_id}`);
    }
  }

  const uniqueP0 = [...new Set(p0_blockers)];
  const uniqueReasons = [...new Set(blocking_reasons)];
  const uniqueUnresolved = [...new Set(unresolved_causal_ids)];

  const passed_for_ready_full =
    evaluated_count === 20 &&
    uniqueUnresolved.length === 0 &&
    uniqueP0.length === 0 &&
    activation_unknown_count === 0 &&
    triggered_unanswered_count === 0 &&
    route_missing_count === 0 &&
    reentry_count === 0 &&
    manual_review_count === 0 &&
    c20_boundary_ok &&
    !has_free_text_without_route;

  let allowed_next_state: CausalClosureGateNextState;
  if (passed_for_ready_full) {
    allowed_next_state = "ready";
  } else if (reentry_count > 0) {
    allowed_next_state = "reentry_required";
  } else if (manual_review_count > 0 || uniqueP0.includes("C20")) {
    allowed_next_state = "manual_review_required";
  } else if (route_missing_count > 0 || has_free_text_without_route) {
    allowed_next_state = "blocked_by_missing_canonical_route";
  } else if (uniqueP0.length > 0) {
    allowed_next_state = "blocked";
  } else if (!open_p1_without_explicit_gap && uniqueUnresolved.length > 0) {
    allowed_next_state = "ready_with_flags";
  } else if (uniqueUnresolved.length > 0) {
    allowed_next_state = "blocked";
  } else {
    allowed_next_state = "blocked";
  }

  return {
    gate: "CausalClosureGate",
    passed_for_ready_full,
    total_required_evaluations: 20,
    evaluated_count,
    triggered_count,
    answered_closed_count,
    not_triggered_with_evidence_count,
    activation_unknown_count,
    route_missing_count,
    reentry_count,
    manual_review_count,
    triggered_unanswered_count,
    unresolved_causal_ids: uniqueUnresolved,
    p0_blockers: uniqueP0,
    blocking_reasons: uniqueReasons,
    allowed_next_state,
    c20_non_diagnostic_boundary_respected: c20_boundary_ok,
    ahe_prep_sufficient: !open_p2,
    handoff_to_evidence_bundle_mdsb_allowed:
      passed_for_ready_full && c20_boundary_ok && !has_free_text_without_route,
  };
}

export function summarizeCausalPriority(causalId: Causal20Id): "P0" | "P1" | "P2" | "P3" {
  if (CAUSAL20_P0_IDS.has(causalId)) return "P0";
  if (
    causalId === "C02" ||
    causalId === "C03" ||
    causalId === "C04" ||
    causalId === "C08" ||
    causalId === "C13" ||
    causalId === "C14" ||
    causalId === "C15"
  ) {
    return "P1";
  }
  if (
    causalId === "C16" ||
    causalId === "C17" ||
    causalId === "C18" ||
    causalId === "C19"
  ) {
    return "P2";
  }
  return "P3";
}
