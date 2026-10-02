import type {
  ActivityDiagnostic,
  ClosureTraceItem,
  FinalActivitySummary,
  SessionDiagnostic,
  SessionFinalOutput,
  SessionStatus,
  SupportActivitySelection,
} from "@/domain/diagnostics";
import type { ActivityStructuralScore } from "@/domain/activity";

type SessionClosureInput = {
  diagnostic: SessionDiagnostic;
  primaryActivityIds: string[];
  supportCandidates: ActivityStructuralScore[];
  answeredSupportActivityIds: string[];
  supportSelections: SupportActivitySelection[];
};

const unique = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const signalValue = (activity: ActivityDiagnostic, code: string) =>
  activity.signals.find((signal) => signal.code === code)?.value ?? "";

const summarizeActivity = (
  activity: ActivityDiagnostic,
): FinalActivitySummary => ({
  activityId: activity.activityId,
  activityText: activity.activityText,
  closureState: activity.closure.activity_closure_state,
  closureQuality: activity.closure.closure_quality_status,
  closureConfidence: activity.closure.confidence,
  missionFinal: activity.mission.mission_final,
  consistencyAlertCount: activity.consistency.consistency_alerts.length,
});

const buildVsmSummary = (activities: ActivityDiagnostic[]) => {
  const summary: Record<string, number> = {
    ejecucion_directa: 0,
    revision_aprobacion: 0,
    coordinacion: 0,
    monitoreo: 0,
    diseno_futuro: 0,
  };

  activities.forEach((activity) => {
    const role = signalValue(activity, "role_purpose").toLowerCase();
    if (role.includes("ejecucion")) summary.ejecucion_directa += 1;
    if (role.includes("revision") || role.includes("aprobacion")) {
      summary.revision_aprobacion += 1;
    }
    if (role.includes("coordinacion")) summary.coordinacion += 1;
    if (role.includes("monitoreo")) summary.monitoreo += 1;
    if (role.includes("diseno")) summary.diseno_futuro += 1;
  });

  return summary;
};

const buildMmabpSummary = (activities: ActivityDiagnostic[]) => {
  const dimensions = ["pm", "moc", "pf", "olc", "vsm", "ahe"];

  return Object.fromEntries(
    dimensions.map((dimension) => [
      dimension,
      activities.filter(
        (activity) => !activity.closure.missingCapabilities.includes(dimension),
      ).length,
    ]),
  );
};

const buildAheSummary = (activities: ActivityDiagnostic[]) => {
  const text = activities
    .flatMap((activity) => [
      activity.activityText,
      ...activity.signals.map((signal) => signal.value),
      ...activity.findings.map((finding) => finding.explanation),
    ])
    .join(" ")
    .toLowerCase();

  return {
    tensions_detected: activities.flatMap((activity) => activity.findings).length,
    sacrifices_detected: (text.match(/sacrific/g) ?? []).length,
    interpersonal_signals: (text.match(/area|equipo|gerente|supervisor|direccion/g) ?? [])
      .length,
  };
};

const buildClosureTrace = ({
  mainActivities,
  supportActivities,
  supportSelections,
  status,
}: {
  mainActivities: ActivityDiagnostic[];
  supportActivities: ActivityDiagnostic[];
  supportSelections: SupportActivitySelection[];
  status: SessionStatus;
}): ClosureTraceItem[] => [
  {
    step: "main_activities",
    status: `${mainActivities.length} principales evaluadas`,
    detail: "La sesion uso las actividades principales como base del cierre.",
    evidence: mainActivities.map((activity) => activity.activityText),
  },
  {
    step: "support_iterations",
    status: `${supportActivities.length} adicionales respondidas`,
    detail:
      "La plataforma incorporo actividades adicionales solo cuando el cierre lo requirio.",
    evidence: supportActivities.map((activity) => activity.activityText),
  },
  {
    step: "support_selection_trace",
    status: `${supportSelections.length} decisiones internas registradas`,
    detail:
      "Las decisiones de soporte quedaron disponibles como trazabilidad interna.",
    evidence: supportSelections.map(
      (selection) => selection.support_activity_selection_reason,
    ),
  },
  {
    step: "global_closure",
    status,
    detail: "El motor de cierre global clasifico la calidad final de la sesion.",
    evidence: mainActivities.map(
      (activity) =>
        `${activity.activityText}: ${activity.closure.activity_closure_state}`,
    ),
  },
];

export const buildSessionFinalOutput = ({
  diagnostic,
  primaryActivityIds,
  answeredSupportActivityIds,
  supportSelections,
}: SessionClosureInput): SessionFinalOutput => {
  const primaryIdSet = new Set(primaryActivityIds);
  const supportAnsweredSet = new Set(answeredSupportActivityIds);
  const mainActivities = diagnostic.activities.filter((activity) =>
    primaryIdSet.has(activity.activityId),
  );
  const supportActivities = diagnostic.activities.filter((activity) =>
    supportAnsweredSet.has(activity.activityId),
  );
  const assessedActivities = [...mainActivities, ...supportActivities];
  const pendingCriticalClarifications = assessedActivities.filter(
    (activity) => activity.consistency.clarification_required,
  );
  const pendingSupportSelections = supportSelections.filter(
    (selection) => selection.support_activity_status === "selected",
  );
  const consistencyAlerts = assessedActivities.flatMap(
    (activity) => activity.consistency.consistency_alerts,
  );
  const unresolvedGaps = unique(
    mainActivities.flatMap((activity) => [
      ...activity.closure.missingCapabilities,
      ...(activity.closure.status !== "closed" ? ["recursive_chain"] : []),
    ]),
  );
  const hasPartialActivities = mainActivities.some(
    (activity) =>
      activity.closure.status !== "closed" ||
      activity.closure.activity_closure_state ===
        "partial_requires_clarification",
  );
  const hasAlerts = consistencyAlerts.length > 0;
  const hasSupportUsed = supportActivities.length > 0;
  const blocked =
    pendingCriticalClarifications.length > 0 ||
    mainActivities.some(
      (activity) =>
        activity.closure.activity_closure_state ===
        "blocked_by_critical_contradiction",
    );
  const inProgress = pendingSupportSelections.length > 0;
  const session_status: SessionStatus = blocked
    ? "session_blocked"
    : inProgress
      ? "session_in_progress"
      : hasPartialActivities || unresolvedGaps.length > 0
        ? "session_completed_partial"
        : hasAlerts || hasSupportUsed
          ? "session_completed_with_alerts"
          : "session_completed_solid";
  const session_closure_quality =
    session_status === "session_blocked"
      ? "blocked"
      : session_status === "session_completed_partial"
        ? "partial"
        : session_status === "session_completed_with_alerts"
          ? "with_alerts"
          : "solid";

  const keyDependencies = unique(
    assessedActivities.map((activity) => signalValue(activity, "dependency")),
  );
  const keyTensions = unique([
    ...assessedActivities.flatMap((activity) =>
      activity.findings
        .filter((finding) => finding.code !== "mission_conflict")
        .map((finding) => finding.title),
    ),
  ]);
  const keySacrifices = unique(
    assessedActivities
      .flatMap((activity) => [
        activity.activityText,
        ...activity.signals.map((signal) => signal.value),
      ])
      .filter((value) => /sacrific/i.test(value)),
  );

  return {
    session_status,
    session_closure_quality,
    main_activities_used: mainActivities.map(summarizeActivity),
    support_activities_used: supportActivities.map(summarizeActivity),
    total_support_iterations: supportActivities.length,
    consistency_alerts_global: consistencyAlerts,
    unresolved_gaps_global: unresolvedGaps,
    key_dependencies: keyDependencies,
    key_tensions: keyTensions,
    key_sacrifices: keySacrifices,
    vsm_signals_summary: buildVsmSummary(assessedActivities),
    mmabp_closure_summary: buildMmabpSummary(mainActivities),
    ahe_summary: buildAheSummary(assessedActivities),
    closure_trace: buildClosureTrace({
      mainActivities,
      supportActivities,
      supportSelections,
      status: session_status,
    }),
  };
};
