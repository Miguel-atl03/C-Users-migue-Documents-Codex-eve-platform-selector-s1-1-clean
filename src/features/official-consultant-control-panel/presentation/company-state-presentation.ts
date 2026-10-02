import type {
  CompanyStateAggregationView,
  CompanyStateLabel,
  ExperienceDataStatus,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";

export const COMPANY_STATE_UNAVAILABLE = "No disponible" as const;

export type CompanyStateSurfaceProjection = {
  /** KPI Estado actual / Estado Empresa Cliente — single §17 surface label. */
  currentStatusLabel: string;
  /** KPI Próximo paso — only factual when derivable. */
  nextStepLabel: string;
  /** Whether §17 general state is factually evaluable for display. */
  evaluable: boolean;
  /** Raw §17 label when evaluable; null otherwise. */
  companyStateLabel: CompanyStateLabel | null;
};

const UPSTREAM_ALERT_TYPES = new Set([
  "timer_core_upcoming_or_overdue",
  "role_assignment_gap",
  "workmap_coverage_gap",
  "blocked_by_missing_canonical_route",
  "process_state_without_timer",
  "manual_handoff_overdue",
  "qa_with_findings",
]);

function hasUpstreamAggregationSignals(
  companyState: CompanyStateAggregationView,
): boolean {
  return companyState.alerts.some((alert) =>
    UPSTREAM_ALERT_TYPES.has(alert.alertType),
  );
}

function deriveNextStepLabel(
  companyStateLabel: CompanyStateLabel,
  companyStateReason: string,
  hasValidNextEvent: boolean,
): string {
  if (!hasValidNextEvent) {
    return COMPANY_STATE_UNAVAILABLE;
  }
  if (companyStateLabel === "En curso") {
    return companyStateReason || COMPANY_STATE_UNAVAILABLE;
  }
  if (companyStateLabel === "Atención" || companyStateLabel === "Bloqueado") {
    return companyStateReason || COMPANY_STATE_UNAVAILABLE;
  }
  return COMPANY_STATE_UNAVAILABLE;
}

export function presentCompanyStateSurface(input: {
  contextActive: boolean;
  experienceLoadStatus: "idle" | "loading" | "ready" | "error";
  companyState: CompanyStateAggregationView | null;
  experienceDataStatus?: ExperienceDataStatus | null;
  hasValidNextEvent?: boolean;
}): CompanyStateSurfaceProjection {
  if (!input.contextActive) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  if (input.experienceLoadStatus !== "ready" || !input.companyState) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  const { companyState, experienceDataStatus } = input;
  const hasValidNextEvent = input.hasValidNextEvent === true;
  const hasUpstream = hasUpstreamAggregationSignals(companyState);
  const experienceSliceOnly =
    experienceDataStatus === "empty" && !hasUpstream;

  if (experienceSliceOnly) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  const nextStepLabel = deriveNextStepLabel(
    companyState.companyState,
    companyState.companyStateReason,
    hasValidNextEvent,
  );

  if (
    companyState.companyState === "En curso" &&
    nextStepLabel === COMPANY_STATE_UNAVAILABLE
  ) {
    return {
      currentStatusLabel: COMPANY_STATE_UNAVAILABLE,
      nextStepLabel: COMPANY_STATE_UNAVAILABLE,
      evaluable: false,
      companyStateLabel: null,
    };
  }

  return {
    currentStatusLabel: companyState.companyState,
    nextStepLabel,
    evaluable: true,
    companyStateLabel: companyState.companyState,
  };
}
