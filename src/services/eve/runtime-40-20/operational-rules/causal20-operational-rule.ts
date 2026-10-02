/**
 * CAUSAL-20 operational rule — Runtime EVE 40/20.
 * C01–C20 evaluated always; triggered causals mandatory to close.
 */

export const CAUSAL20_RULE_ID = "CAUSAL-20" as const;

export const CAUSAL20_IDS = [
  "C01",
  "C02",
  "C03",
  "C04",
  "C05",
  "C06",
  "C07",
  "C08",
  "C09",
  "C10",
  "C11",
  "C12",
  "C13",
  "C14",
  "C15",
  "C16",
  "C17",
  "C18",
  "C19",
  "C20",
] as const;

export type Causal20Id = (typeof CAUSAL20_IDS)[number];

export const CAUSAL20_ALLOWED_STATES = [
  "not_triggered_with_evidence",
  "triggered_required",
  "answered_closed",
  "closed_by_confirmed_negative",
  "closed_not_applicable",
  "activation_unknown",
  "triggered_unanswered",
  "route_missing",
  "contradiction_flag",
  "manual_review_required",
  "reentry_required",
] as const;

export type Causal20ClosureState = (typeof CAUSAL20_ALLOWED_STATES)[number];

export const CAUSAL20_CLOSED_STATES: ReadonlySet<Causal20ClosureState> = new Set([
  "not_triggered_with_evidence",
  "answered_closed",
  "closed_by_confirmed_negative",
  "closed_not_applicable",
]);

export const CAUSAL20_OPEN_STATES: ReadonlySet<Causal20ClosureState> = new Set([
  "triggered_required",
  "activation_unknown",
  "triggered_unanswered",
  "route_missing",
  "contradiction_flag",
  "manual_review_required",
  "reentry_required",
]);

export const CAUSAL20_P0_IDS: ReadonlySet<Causal20Id> = new Set([
  "C05",
  "C09",
  "C11",
  "C20",
]);

export const CAUSAL20_P1_IDS: ReadonlySet<Causal20Id> = new Set([
  "C02",
  "C03",
  "C04",
  "C08",
  "C13",
  "C14",
  "C15",
]);

export const CAUSAL20_P2_IDS: ReadonlySet<Causal20Id> = new Set([
  "C16",
  "C17",
  "C18",
  "C19",
]);

export const CAUSAL20_P3_IDS: ReadonlySet<Causal20Id> = new Set([
  "C01",
  "C06",
  "C07",
  "C10",
  "C12",
]);

export type Causal20OperationalRuleContract = {
  rule_id: typeof CAUSAL20_RULE_ID;
  name: string;
  scope: "activity_runtime_run";
  applies_to: string;
  causals_evaluated_always: true;
  causals_displayed_always: false;
  triggered_causal_required_to_close: true;
  activation_unknown_cannot_be_assumed_false: true;
  ready_full_blocked_by_open_triggered_causal: true;
};

export const CAUSAL20_OPERATIONAL_RULE: Causal20OperationalRuleContract = {
  rule_id: CAUSAL20_RULE_ID,
  name: "Regla Operativa de Suficiencia Sistémica — 20 Preguntas Causales",
  scope: "activity_runtime_run",
  applies_to: "toda actividad primaria después de procesar bases fuente",
  causals_evaluated_always: true,
  causals_displayed_always: false,
  triggered_causal_required_to_close: true,
  activation_unknown_cannot_be_assumed_false: true,
  ready_full_blocked_by_open_triggered_causal: true,
};

export type CausalClosureRecord = {
  causal_id: Causal20Id | string;
  activation_state: Causal20ClosureState | string;
  condition_evidence?: string | null;
  free_text_without_canonical_route?: boolean;
  produces_diagnosis_or_export?: boolean;
};

export function isCausal20Id(value: string): value is Causal20Id {
  return (CAUSAL20_IDS as readonly string[]).includes(value);
}

export function isCausal20AllowedState(value: string): value is Causal20ClosureState {
  return (CAUSAL20_ALLOWED_STATES as readonly string[]).includes(value);
}

export function createEmptyCausalClosureRecords(): CausalClosureRecord[] {
  return CAUSAL20_IDS.map((causal_id) => ({
    causal_id,
    activation_state: "activation_unknown",
    condition_evidence: null,
  }));
}

export function isC20NonDiagnosticBoundaryRespected(
  record: CausalClosureRecord | undefined,
): boolean {
  if (!record || record.causal_id !== "C20") return true;
  return record.produces_diagnosis_or_export !== true;
}
