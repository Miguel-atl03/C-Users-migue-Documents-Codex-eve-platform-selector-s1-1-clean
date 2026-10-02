/**
 * Helpers to build Ámbar fixture BASE-40 / CAUSAL-20 ledgers (local, non-productive).
 */

import {
  BASE40_BASE_IDS,
  type Base40ResolutionState,
  type BaseResolutionRecord,
} from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";
import {
  CAUSAL20_IDS,
  type Causal20ClosureState,
  type Causal20Id,
  type CausalClosureRecord,
} from "@/services/eve/runtime-40-20/operational-rules/causal20-operational-rule";
import { evaluateBaseResolutionGate } from "@/services/eve/runtime-40-20/operational-rules/base-resolution-gate";
import {
  evaluateCausalClosureGate,
  summarizeCausalPriority,
} from "@/services/eve/runtime-40-20/operational-rules/causal-closure-gate";
import type {
  BaseResolutionByRun,
  CausalClosureByRun,
  BaseResolutionGatePanelSummary,
  CausalClosureGatePanelSummary,
} from "../consultant-control-panel-types";

const RESOLUTION_CYCLE: Base40ResolutionState[] = [
  "captured_user_evidence",
  "canonical_derivation_closed",
  "internal_calculated_closed",
  "not_applicable_with_evidence",
  "ready_with_flag",
  "user_confirmed_prefill",
  "captured_user_evidence",
  "canonical_derivation_closed",
];

function withMeta(
  base_id: string,
  state: Base40ResolutionState,
): BaseResolutionRecord {
  return {
    base_id,
    state,
    canonical_variable: `var_${base_id.toLowerCase()}`,
    provenance: `provenance_${base_id}`,
    mmabp_or_readiness_output: `mmabp_${base_id}`,
    free_text_without_canonical_route: false,
  };
}

function buildBaseRecords(overrides: Partial<Record<string, Base40ResolutionState>> = {}) {
  return BASE40_BASE_IDS.map((base_id, index) => {
    const state = overrides[base_id] ?? RESOLUTION_CYCLE[index % RESOLUTION_CYCLE.length];
    return withMeta(base_id, state);
  });
}

function notTriggered(causal_id: Causal20Id): CausalClosureRecord {
  return {
    causal_id,
    activation_state: "not_triggered_with_evidence",
    condition_evidence: `base_evidence_rejects_${causal_id}`,
    free_text_without_canonical_route: false,
    produces_diagnosis_or_export: false,
  };
}

function triggered(
  causal_id: Causal20Id,
  activation_state: Causal20ClosureState,
  evidence: string,
): CausalClosureRecord {
  return {
    causal_id,
    activation_state,
    condition_evidence: evidence,
    free_text_without_canonical_route: false,
    produces_diagnosis_or_export: false,
  };
}

function buildCausalRecords(
  triggeredMap: Partial<Record<Causal20Id, { state: Causal20ClosureState; evidence: string }>>,
): CausalClosureRecord[] {
  return CAUSAL20_IDS.map((causal_id) => {
    const hit = triggeredMap[causal_id];
    if (!hit) return notTriggered(causal_id);
    return triggered(causal_id, hit.state, hit.evidence);
  });
}

type RunSpec = {
  activityRuntimeRunId: string;
  activityCode: string;
  role: string;
  baseOverrides?: Partial<Record<string, Base40ResolutionState>>;
  triggeredCausals: Partial<
    Record<Causal20Id, { state: Causal20ClosureState; evidence: string }>
  >;
};

const AMBAR_RUN_SPECS: RunSpec[] = [
  {
    activityRuntimeRunId: "arr-ambar-vendedor-a4-001",
    activityCode: "A4",
    role: "Vendedor",
    baseOverrides: {
      "B2-Q17": "ready_with_flag",
      "B3-Q21": "ready_with_flag",
      "B7-Q40": "manual_review_required",
    },
    triggeredCausals: {
      // P0 C09 closed; C05 not needed; C20 open as manual review (low confidence) — but P0 open blocks ready_with_flags in guard.
      // For overall ready_with_flags, P0 must be closed. Keep C20 answered_closed with non-diagnostic boundary.
      C09: {
        state: "answered_closed",
        evidence: "excepción crediticia con feedback receptor documentado",
      },
      C05: {
        state: "not_triggered_with_evidence",
        evidence: "sin transformation_exception_exists en A4",
      },
      C20: {
        state: "answered_closed",
        evidence: "verificación ligera de baja confianza sin diagnóstico",
      },
      C03: {
        state: "triggered_required",
        evidence: "gap_explicit: excepción de inicio crediticio pendiente",
      },
    },
  },
  {
    activityRuntimeRunId: "arr-ambar-produccion-b1-001",
    activityCode: "B1",
    role: "Responsable de Producción Cervecera",
    baseOverrides: {
      "B2-Q12": "ready_with_flag",
      "B4-Q24": "ready_with_flag",
      "B5-Q29": "ready_with_flag",
    },
    triggeredCausals: {
      C04: {
        state: "triggered_required",
        evidence: "gap_explicit: dimensión dominante de capacidad no confirmada",
      },
      C11: {
        state: "answered_closed",
        evidence: "espera de capacidad con evento de liberación documentado",
      },
      C15: {
        state: "triggered_required",
        evidence: "gap_explicit: variedad residual de fermentación",
      },
    },
  },
  {
    activityRuntimeRunId: "arr-ambar-logistica-c3-001",
    activityCode: "C3",
    role: "Coordinador de Operaciones y Logística",
    baseOverrides: {
      "B3-Q21": "ready_with_flag",
      "B4-Q24": "reentry_required",
      "B7-Q39": "ready_with_flag",
    },
    triggeredCausals: {
      C08: {
        state: "triggered_required",
        evidence: "gap_explicit: falla de entrega por desviación de frío",
      },
      C09: {
        state: "answered_closed",
        evidence: "feedback receptor de cadena de frío documentado",
      },
      C11: {
        state: "answered_closed",
        evidence: "deadlock_resolution de espera de transporte documentado",
      },
      C20: {
        state: "answered_closed",
        evidence: "frontera B7 respetada — sin diagnóstico ni export",
      },
    },
  },
];

export function buildAmbarBaseResolutionByRun(): BaseResolutionByRun[] {
  return AMBAR_RUN_SPECS.map((spec) => {
    const records = buildBaseRecords(spec.baseOverrides);
    const gate = evaluateBaseResolutionGate({
      activity_runtime_run_id: spec.activityRuntimeRunId,
      base_resolutions: records,
    });
    return {
      activityRuntimeRunId: spec.activityRuntimeRunId,
      activityCode: spec.activityCode,
      role: spec.role,
      total_required: 40,
      records: records.map((record) => ({
        base_id: String(record.base_id),
        state: String(record.state),
        canonical_variable: record.canonical_variable ?? null,
        provenance: record.provenance ?? null,
        mmabp_or_readiness_output: record.mmabp_or_readiness_output ?? null,
      })),
      skipped_silently_count: gate.skipped_silently_count,
      inferred_unconfirmed_count: gate.inferred_unconfirmed_count,
      reentry_count: gate.reentry_count,
      manual_review_count: gate.manual_review_count,
      resolved_count: gate.resolved_count,
      blocking_base_ids: gate.unresolved_base_ids,
      gate_summary: {
        passed_for_ready_full: gate.passed_for_ready_full,
        allowed_next_state: gate.allowed_next_state,
      },
    };
  });
}

export function buildAmbarCausalClosureByRun(): CausalClosureByRun[] {
  return AMBAR_RUN_SPECS.map((spec) => {
    // Ensure C05 not_triggered override is treated correctly when present in map with that state.
    const triggeredMap: Partial<
      Record<Causal20Id, { state: Causal20ClosureState; evidence: string }>
    > = { ...spec.triggeredCausals };
    const records = buildCausalRecords(triggeredMap).map((record) => {
      const override = triggeredMap[record.causal_id as Causal20Id];
      if (override?.state === "not_triggered_with_evidence") {
        return notTriggered(record.causal_id as Causal20Id);
      }
      return record;
    });
    const gate = evaluateCausalClosureGate({
      activity_runtime_run_id: spec.activityRuntimeRunId,
      causal_closures: records,
    });
    return {
      activityRuntimeRunId: spec.activityRuntimeRunId,
      activityCode: spec.activityCode,
      role: spec.role,
      total_required_evaluations: 20,
      records: records.map((record) => ({
        causal_id: String(record.causal_id),
        activation_state: String(record.activation_state),
        condition_evidence: record.condition_evidence ?? null,
        priority: isCausalId(record.causal_id)
          ? summarizeCausalPriority(record.causal_id)
          : undefined,
      })),
      triggered_required_count: records.filter(
        (record) =>
          record.activation_state === "triggered_required" ||
          record.activation_state === "triggered_unanswered",
      ).length,
      answered_closed_count: gate.answered_closed_count,
      not_triggered_with_evidence_count: gate.not_triggered_with_evidence_count,
      activation_unknown_count: gate.activation_unknown_count,
      route_missing_count: gate.route_missing_count,
      reentry_count: gate.reentry_count,
      manual_review_count: gate.manual_review_count,
      p0_blockers: gate.p0_blockers,
      gate_summary: {
        passed_for_ready_full: gate.passed_for_ready_full,
        allowed_next_state: gate.allowed_next_state,
      },
    };
  });
}

function isCausalId(value: string): value is Causal20Id {
  return (CAUSAL20_IDS as readonly string[]).includes(value);
}

export function aggregateAmbarBaseResolutionGate(
  byRun: BaseResolutionByRun[],
): BaseResolutionGatePanelSummary {
  const blocking = [...new Set(byRun.flatMap((run) => run.blocking_base_ids))];
  const perRunCounts = byRun.map((run) => run.records.length);
  const evaluated =
    perRunCounts.length === 0
      ? 0
      : perRunCounts.every((count) => count === 40)
        ? 40
        : Math.min(...perRunCounts);
  return {
    total_required: 40,
    evaluated_or_resolved_or_explicitly_blocked: evaluated,
    skipped_silently: byRun.reduce((sum, run) => sum + run.skipped_silently_count, 0),
    inferred_unconfirmed: byRun.reduce(
      (sum, run) => sum + run.inferred_unconfirmed_count,
      0,
    ),
    reentry: byRun.reduce((sum, run) => sum + run.reentry_count, 0),
    manual_review: byRun.reduce((sum, run) => sum + run.manual_review_count, 0),
    blocking_bases: blocking,
    passed_for_ready_full: byRun.every((run) => run.gate_summary.passed_for_ready_full),
  };
}

export function aggregateAmbarCausalClosureGate(
  byRun: CausalClosureByRun[],
): CausalClosureGatePanelSummary {
  const perRunCounts = byRun.map((run) => run.records.length);
  const evaluated =
    perRunCounts.length === 0
      ? 0
      : perRunCounts.every((count) => count === 20)
        ? 20
        : Math.min(...perRunCounts);
  return {
    total_required_evaluations: 20,
    evaluated,
    triggered_required: byRun.reduce((sum, run) => sum + run.triggered_required_count, 0),
    answered_closed: byRun.reduce((sum, run) => sum + run.answered_closed_count, 0),
    not_triggered_with_evidence: byRun.reduce(
      (sum, run) => sum + run.not_triggered_with_evidence_count,
      0,
    ),
    activation_unknown: byRun.reduce((sum, run) => sum + run.activation_unknown_count, 0),
    route_missing: byRun.reduce((sum, run) => sum + run.route_missing_count, 0),
    reentry: byRun.reduce((sum, run) => sum + run.reentry_count, 0),
    manual_review: byRun.reduce((sum, run) => sum + run.manual_review_count, 0),
    p0_blockers: [...new Set(byRun.flatMap((run) => run.p0_blockers))],
    passed_for_ready_full: byRun.every((run) => run.gate_summary.passed_for_ready_full),
  };
}

export const EMPTY_BASE_RESOLUTION_GATE: BaseResolutionGatePanelSummary = {
  total_required: 40,
  evaluated_or_resolved_or_explicitly_blocked: 0,
  skipped_silently: 0,
  inferred_unconfirmed: 0,
  reentry: 0,
  manual_review: 0,
  blocking_bases: [],
  passed_for_ready_full: false,
};

export const EMPTY_CAUSAL_CLOSURE_GATE: CausalClosureGatePanelSummary = {
  total_required_evaluations: 20,
  evaluated: 0,
  triggered_required: 0,
  answered_closed: 0,
  not_triggered_with_evidence: 0,
  activation_unknown: 0,
  route_missing: 0,
  reentry: 0,
  manual_review: 0,
  p0_blockers: [],
  passed_for_ready_full: false,
};

export const OPERATIONAL_SUFFICIENCY_NOTE =
  "40/20 no significa consumo opcional reducido. Significa 40 base obligatorias por resolución y 20 causales evaluadas por cada activity_runtime_run.";

export const INTERACTION_PERSISTENCE_NOTE =
  "Una interacción puede no mostrarse al usuario, pero no puede desaparecer: debe quedar capturada, confirmada, derivada, calculada, no aplicable con evidencia, flagged, reentry o manual review.";
