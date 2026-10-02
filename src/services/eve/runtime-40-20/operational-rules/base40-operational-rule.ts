/**
 * BASE-40 operational rule — Runtime EVE 40/20.
 * 40 base interactions mandatory by resolution per activity_runtime_run.
 */

export const RUNTIME_40_20_OPERATIONAL_RULES_VERSION = "1.0.0";

export const BASE40_RULE_ID = "BASE-40" as const;

export const BASE40_BASE_IDS = [
  "B0-Q01",
  "B0-Q02",
  "B0-Q03",
  "B0-Q04",
  "B05-Q05",
  "B05-Q06",
  "B05-Q07",
  "B1-Q08",
  "B1-Q09",
  "B1-Q10",
  "B1-Q11",
  "B2-Q12",
  "B2-Q13",
  "B2-Q14",
  "B2-Q15",
  "B2-Q16",
  "B2-Q17",
  "B3-Q18",
  "B3-Q19",
  "B3-Q20",
  "B3-Q21",
  "B3-Q22",
  "B4-Q23",
  "B4-Q24",
  "B4-Q25",
  "B4-Q26",
  "B4-Q27",
  "B4-Q28",
  "B5-Q29",
  "B5-Q30",
  "B5-Q31",
  "B5-Q32",
  "B5-Q33",
  "B6-Q34",
  "B6-Q35",
  "B6-Q36",
  "B6-Q37",
  "B6-Q38",
  "B7-Q39",
  "B7-Q40",
] as const;

export type Base40Id = (typeof BASE40_BASE_IDS)[number];

export const BASE40_ALLOWED_STATES = [
  "captured_user_evidence",
  "user_confirmed_prefill",
  "canonical_derivation_closed",
  "internal_calculated_closed",
  "not_applicable_with_evidence",
  "ready_with_flag",
  "blocked_by_missing_evidence",
  "blocked_by_missing_canonical_route",
  "reentry_required",
  "manual_review_required",
  "inferred_unconfirmed",
  "skipped_silently",
] as const;

export type Base40ResolutionState = (typeof BASE40_ALLOWED_STATES)[number];

export const BASE40_FULL_RESOLUTION_STATES: ReadonlySet<Base40ResolutionState> = new Set([
  "captured_user_evidence",
  "user_confirmed_prefill",
  "canonical_derivation_closed",
  "internal_calculated_closed",
  "not_applicable_with_evidence",
]);

export const BASE40_BLOCK_READY_STATES: ReadonlySet<Base40ResolutionState> = new Set([
  "blocked_by_missing_evidence",
  "blocked_by_missing_canonical_route",
  "reentry_required",
  "skipped_silently",
]);

export const BASE40_BLOCK_READY_FULL_STATES: ReadonlySet<Base40ResolutionState> = new Set([
  "inferred_unconfirmed",
  "ready_with_flag",
  "manual_review_required",
]);

export type Base40OperationalRuleContract = {
  rule_id: typeof BASE40_RULE_ID;
  name: string;
  scope: "activity_runtime_run";
  applies_to: string;
  base_interactions_required: 40;
  mandatory_by_resolution: true;
  mandatory_as_visible_questions: false;
  silent_omission_allowed: false;
  ready_allowed_with_unresolved_base: false;
  ready_full_requires_all_base_resolved: true;
  parallel_production_requires_canonical_variables_provenance_readiness: true;
};

export const BASE40_OPERATIONAL_RULE: Base40OperationalRuleContract = {
  rule_id: BASE40_RULE_ID,
  name: "Regla Operativa de Suficiencia Sistémica — 40 Preguntas Base",
  scope: "activity_runtime_run",
  applies_to: "toda actividad primaria que entra a Runtime profundo",
  base_interactions_required: 40,
  mandatory_by_resolution: true,
  mandatory_as_visible_questions: false,
  silent_omission_allowed: false,
  ready_allowed_with_unresolved_base: false,
  ready_full_requires_all_base_resolved: true,
  parallel_production_requires_canonical_variables_provenance_readiness: true,
};

export type BaseResolutionRecord = {
  base_id: Base40Id | string;
  state: Base40ResolutionState | string;
  canonical_variable?: string | null;
  provenance?: string | null;
  mmabp_or_readiness_output?: string | null;
  free_text_without_canonical_route?: boolean;
};

export function isBase40Id(value: string): value is Base40Id {
  return (BASE40_BASE_IDS as readonly string[]).includes(value);
}

export function isBase40AllowedState(value: string): value is Base40ResolutionState {
  return (BASE40_ALLOWED_STATES as readonly string[]).includes(value);
}

export function createEmptyBaseResolutionRecords(): BaseResolutionRecord[] {
  return BASE40_BASE_IDS.map((base_id) => ({
    base_id,
    state: "skipped_silently",
    canonical_variable: null,
    provenance: null,
    mmabp_or_readiness_output: null,
  }));
}
