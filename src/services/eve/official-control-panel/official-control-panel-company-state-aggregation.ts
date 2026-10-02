import type {
  CompanyAlertType,
  CompanyAttentionAlertView,
  CompanyStateAggregationView,
  CompanyStateLabel,
  ExperienceCapability,
  ExperienceScreenKey,
  ExperienceStateView,
} from "./official-control-panel-experience.types";

/** Factual proxy for §17 "próximo evento válido" from experience instrumentation only. */
export function deriveExperienceHasValidNextEvent(
  experience: ExperienceStateView,
): boolean {
  if (
    experience.dataStatus !== "available" &&
    experience.dataStatus !== "partial"
  ) {
    return false;
  }
  return experience.users.some(
    (journey) =>
      journey.currentStatus === "active" ||
      journey.currentStatus === "support_requested",
  );
}

export type CompanyStateAggregationInput = {
  /** Canonical case final = closed. */
  caseIsClosed?: boolean;
  /** Engagement never opened a case. */
  caseNotStarted?: boolean;
  hasCriticalMilestoneBlocker?: boolean;
  hasOverdueTimerWithoutExit?: boolean;
  hasMissingMandatoryManualInput?: boolean;
  hasFlags?: boolean;
  hasSupportRequested?: boolean;
  hasManualDueSoon?: boolean;
  hasRoleGap?: boolean;
  hasRecoverableFindings?: boolean;
  hasValidNextEvent?: boolean;
  /** Experience aggregation evaluated completely. */
  experienceAlertsComplete: boolean;
  experienceState?: ExperienceStateView | null;
  /** Precomputed alerts from §§12–14 sources. */
  upstreamAlerts?: CompanyAttentionAlertView[];
};

function experienceAlertsFromState(
  state: ExperienceStateView | null | undefined,
): CompanyAttentionAlertView[] {
  if (!state || state.dataStatus === "empty") return [];
  const alerts: CompanyAttentionAlertView[] = [];

  for (const item of state.supportQueue) {
    if (item.source !== "support_requested_event" && !item.actionType) continue;
    alerts.push({
      alertId: `exp-support:${item.id}`,
      alertType: "experience_support_requested",
      severity: "warning",
      title: "Soporte de experiencia solicitado",
      detail: `Pantalla ${item.screenLabel}`,
      scopeLabel: `Usuario ${item.userId.slice(0, 8)}`,
      responseHint: "Abrir soporte / Ver trayectoria",
      userId: item.userId,
      screenKey: item.screenKey,
      capabilities: ["view_trajectory", "governed_action", "open_detail"],
    });
  }

  for (const screen of state.screensHealth) {
    if (screen.errorCount < 2) continue;
    alerts.push({
      alertId: `exp-error:${state.caseId}:${screen.screenKey}`,
      alertType: "screen_error_recurrent",
      severity: "critical",
      title: "Error recurrente de pantalla",
      detail: `${screen.screenLabel}: ${screen.errorCount} errores`,
      scopeLabel: screen.screenLabel,
      responseHint: "Revisar salud de pantallas",
      screenKey: screen.screenKey as ExperienceScreenKey,
      capabilities: ["view_trajectory", "open_detail"],
    });
  }

  return alerts;
}

export function aggregateCompanyState(
  input: CompanyStateAggregationInput,
): CompanyStateAggregationView {
  const experienceAlerts = experienceAlertsFromState(input.experienceState);
  const upstream = input.upstreamAlerts ?? [];
  const alerts = dedupeAlerts([...upstream, ...experienceAlerts]);

  const hasSupport =
    input.hasSupportRequested === true ||
    experienceAlerts.some((a) => a.alertType === "experience_support_requested");

  let companyState: CompanyStateLabel;
  let companyStateReason: string;

  if (input.caseIsClosed) {
    companyState = "Cerrado";
    companyStateReason = "Caso en final canónico.";
  } else if (input.caseNotStarted) {
    companyState = "No iniciado";
    companyStateReason = "La relación no ha abierto caso.";
  } else if (
    input.hasCriticalMilestoneBlocker ||
    input.hasOverdueTimerWithoutExit ||
    input.hasMissingMandatoryManualInput
  ) {
    companyState = "Bloqueado";
    companyStateReason =
      "Existe blocker crítico, timer vencido sin salida o input manual obligatorio faltante.";
  } else if (
    input.hasFlags ||
    hasSupport ||
    input.hasManualDueSoon ||
    input.hasRoleGap ||
    input.hasRecoverableFindings
  ) {
    companyState = "Atención";
    companyStateReason =
      "Existen flags, soporte, entrega manual próxima, role gap o findings recuperables.";
  } else if (input.hasValidNextEvent) {
    companyState = "En curso";
    companyStateReason = "Sin bloqueo crítico y con próximo evento válido.";
  } else {
    companyState = "No iniciado";
    companyStateReason = "Evidencia insuficiente para clasificar avance.";
  }

  const experienceOnly = alerts.filter((a) =>
    (
      [
        "experience_support_requested",
        "screen_error_recurrent",
      ] as CompanyAlertType[]
    ).includes(a.alertType),
  );

  return {
    companyState,
    companyStateReason,
    alerts,
    experienceAlertCount: input.experienceAlertsComplete
      ? experienceOnly.length
      : null,
    experienceAlertsComplete: input.experienceAlertsComplete,
  };
}

function dedupeAlerts(
  alerts: CompanyAttentionAlertView[],
): CompanyAttentionAlertView[] {
  const seen = new Set<string>();
  const out: CompanyAttentionAlertView[] = [];
  for (const a of alerts) {
    if (seen.has(a.alertId)) continue;
    seen.add(a.alertId);
    out.push(a);
  }
  return out;
}

export function defaultExperienceCapabilities(): ExperienceCapability[] {
  return [
    "view_experience_state",
    "send_support_message",
    "request_reentry",
    "mark_manual_review",
    "open_detail",
    "view_trajectory",
    "governed_action",
  ];
}
