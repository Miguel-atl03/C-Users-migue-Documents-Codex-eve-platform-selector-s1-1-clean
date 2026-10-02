import {
  assertConsultantCaseParticipantAccess,
  buildCaseParticipantsResponse,
  buildParticipantProfilesResponse,
} from "./official-control-panel-participants-service";
import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import type {
  OfficialControlPanelParticipantsRepository,
  ProfileResolutionStatusUi,
} from "./official-control-panel-participants.types";
import type {
  FunctionalSessionOption,
  MonitoringActivitiesResponse,
  MonitoringActivityRow,
  MonitoringRoleRow,
  MonitoringRolesResponse,
  MonitoringSessionsResponse,
  MonitoringUserRow,
  MonitoringUsersResponse,
  OfficialControlPanelMonitoringRuntimeRepository,
} from "./official-control-panel-monitoring.types";
import {
  MONITORING_ACTIVITY_NAME_UNAVAILABLE,
  MONITORING_NO_RECORDS,
  MONITORING_NO_RUNTIME_LINK,
  MONITORING_PENDING_REVIEW,
  MONITORING_SELECT_SESSION,
  MONITORING_UNAVAILABLE,
} from "./official-control-panel-monitoring.types";

const PROFILE_STATE_LABELS: Record<ProfileResolutionStatusUi, string> = {
  resolved: "Resuelto",
  "mixed-unresolved": "Mixto sin resolver",
  "reentry-required": "Requiere reentrada",
  "manual-review-required": "Requiere revisión manual",
  unavailable: MONITORING_UNAVAILABLE,
};

export async function buildMonitoringUsersResponse(
  participantsRepository: OfficialControlPanelParticipantsRepository,
  runtimeRepository: OfficialControlPanelMonitoringRuntimeRepository,
  caseId: string,
): Promise<MonitoringUsersResponse> {
  const participants = await buildCaseParticipantsResponse(
    participantsRepository,
    caseId,
  );
  const records =
    await participantsRepository.listEnabledParticipantsByCase(caseId);

  const caseRoleSessionCount =
    await runtimeRepository.countRoleSessionsByCase(caseId);
  const caseActivityRunCount =
    await runtimeRepository.countActivityRunsByCase(caseId);

  const users: MonitoringUserRow[] = participants.map((summary) => {
    const record = records.find((row) => row.id === summary.id);
    return {
      participantId: summary.id,
      userId: record?.userId ?? "",
      label: summary.label,
      engagementLabel: MONITORING_UNAVAILABLE,
      rolesCount: summary.profileCount,
      rolesCountLabel: String(summary.profileCount),
      activitiesLabel: MONITORING_UNAVAILABLE,
      journeyStageLabel: MONITORING_UNAVAILABLE,
      readinessLabel: MONITORING_UNAVAILABLE,
      attentionLabel: MONITORING_UNAVAILABLE,
      participationStatusLabel: summary.participationStatusLabel,
      profileResolutionStatus: summary.profileResolutionStatus,
    };
  });

  return { users, caseRoleSessionCount, caseActivityRunCount };
}

export async function buildMonitoringRolesResponse(
  participantsRepository: OfficialControlPanelParticipantsRepository,
  runtimeRepository: OfficialControlPanelMonitoringRuntimeRepository,
  participantId: string,
): Promise<MonitoringRolesResponse> {
  const profiles = await buildParticipantProfilesResponse(
    participantsRepository,
    participantId,
  );

  const roles: MonitoringRoleRow[] = [];
  for (const profile of profiles) {
    let linked;
    try {
      linked = await runtimeRepository.findLinkedRoleSessionsByProfile(
        profile.id,
      );
    } catch {
      roles.push({
        profileId: profile.id,
        participantId,
        label: profile.label,
        responsibilitiesLabel: MONITORING_UNAVAILABLE,
        eligibleLabel: MONITORING_UNAVAILABLE,
        primaryLabel: MONITORING_UNAVAILABLE,
        nonPrimaryLabel: MONITORING_UNAVAILABLE,
        stateLabel:
          PROFILE_STATE_LABELS[profile.resolutionStatus] ??
          MONITORING_UNAVAILABLE,
        nextStepLabel: MONITORING_UNAVAILABLE,
        roleRuntimeSessionId: null,
        roleRuntimeSessionIds: [],
        roleRuntimeSessionCount: null,
        activitiesLinkStatus: "unavailable",
      });
      continue;
    }

    const confirmed = linked.filter((item) => item.linkStatus === "confirmed");
    const pending = linked.filter(
      (item) => item.linkStatus === "pending_review",
    );

    if (confirmed.length === 1) {
      roles.push({
        profileId: profile.id,
        participantId,
        label: profile.label,
        responsibilitiesLabel: MONITORING_UNAVAILABLE,
        eligibleLabel: MONITORING_UNAVAILABLE,
        primaryLabel: MONITORING_UNAVAILABLE,
        nonPrimaryLabel: MONITORING_UNAVAILABLE,
        stateLabel:
          PROFILE_STATE_LABELS[profile.resolutionStatus] ??
          MONITORING_UNAVAILABLE,
        nextStepLabel: MONITORING_UNAVAILABLE,
        roleRuntimeSessionId: confirmed[0].roleRuntimeSessionId,
        roleRuntimeSessionIds: [confirmed[0].roleRuntimeSessionId],
        roleRuntimeSessionCount: 1,
        activitiesLinkStatus: "linked",
      });
      continue;
    }

    if (confirmed.length > 1) {
      const ids = confirmed.map((item) => item.roleRuntimeSessionId);
      roles.push({
        profileId: profile.id,
        participantId,
        label: profile.label,
        responsibilitiesLabel: MONITORING_UNAVAILABLE,
        eligibleLabel: MONITORING_UNAVAILABLE,
        primaryLabel: MONITORING_UNAVAILABLE,
        nonPrimaryLabel: MONITORING_UNAVAILABLE,
        stateLabel:
          PROFILE_STATE_LABELS[profile.resolutionStatus] ??
          MONITORING_UNAVAILABLE,
        nextStepLabel: MONITORING_UNAVAILABLE,
        roleRuntimeSessionId: null,
        roleRuntimeSessionIds: ids,
        roleRuntimeSessionCount: ids.length,
        activitiesLinkStatus: "multiple_runtime_sessions",
      });
      continue;
    }

    if (pending.length > 0 && confirmed.length === 0) {
      roles.push({
        profileId: profile.id,
        participantId,
        label: profile.label,
        responsibilitiesLabel: MONITORING_UNAVAILABLE,
        eligibleLabel: MONITORING_UNAVAILABLE,
        primaryLabel: MONITORING_UNAVAILABLE,
        nonPrimaryLabel: MONITORING_UNAVAILABLE,
        stateLabel:
          PROFILE_STATE_LABELS[profile.resolutionStatus] ??
          MONITORING_UNAVAILABLE,
        nextStepLabel: MONITORING_UNAVAILABLE,
        roleRuntimeSessionId: null,
        roleRuntimeSessionIds: pending.map((item) => item.roleRuntimeSessionId),
        roleRuntimeSessionCount: pending.length,
        activitiesLinkStatus: "pending_review",
      });
      continue;
    }

    roles.push({
      profileId: profile.id,
      participantId,
      label: profile.label,
      responsibilitiesLabel: MONITORING_UNAVAILABLE,
      eligibleLabel: MONITORING_UNAVAILABLE,
      primaryLabel: MONITORING_UNAVAILABLE,
      nonPrimaryLabel: MONITORING_UNAVAILABLE,
      stateLabel:
        PROFILE_STATE_LABELS[profile.resolutionStatus] ??
        MONITORING_UNAVAILABLE,
      nextStepLabel: MONITORING_UNAVAILABLE,
      roleRuntimeSessionId: null,
      roleRuntimeSessionIds: [],
      roleRuntimeSessionCount: 0,
      activitiesLinkStatus: "no_runtime_session_link",
    });
  }

  return { roles };
}

export async function buildMonitoringSessionsResponse(
  participantsRepository: OfficialControlPanelParticipantsRepository,
  runtimeRepository: OfficialControlPanelMonitoringRuntimeRepository,
  profileId: string,
): Promise<MonitoringSessionsResponse> {
  const profile = await participantsRepository.findProfileById(profileId);
  if (!profile || !profile.enabled) {
    return { sessions: [] };
  }

  const linked =
    await runtimeRepository.findLinkedRoleSessionsByProfile(profileId);
  const sessions: FunctionalSessionOption[] = linked
    .filter((item) => item.linkStatus === "confirmed")
    .map((item, index) => ({
      id: item.roleRuntimeSessionId,
      label: `Sesión funcional ${index + 1}`,
      stateLabel: item.state || null,
      linkStatus: "confirmed" as const,
    }));

  return { sessions };
}

export async function buildMonitoringActivitiesResponse(
  participantsRepository: OfficialControlPanelParticipantsRepository,
  runtimeRepository: OfficialControlPanelMonitoringRuntimeRepository,
  profileId: string,
  selectedSessionId: string | null,
): Promise<MonitoringActivitiesResponse> {
  const profile = await participantsRepository.findProfileById(profileId);
  if (!profile || !profile.enabled) {
    return {
      activities: [],
      linkStatus: "empty",
      message: MONITORING_NO_RUNTIME_LINK,
      roleRuntimeSessionId: null,
    };
  }

  let linked;
  try {
    linked = await runtimeRepository.findLinkedRoleSessionsByProfile(profileId);
  } catch {
    return {
      activities: [],
      linkStatus: "unavailable",
      message: MONITORING_UNAVAILABLE,
      roleRuntimeSessionId: null,
    };
  }

  const confirmed = linked.filter((item) => item.linkStatus === "confirmed");
  const pending = linked.filter((item) => item.linkStatus === "pending_review");

  if (confirmed.length === 0 && pending.length > 0) {
    return {
      activities: [],
      linkStatus: "pending_review",
      message: MONITORING_PENDING_REVIEW,
      roleRuntimeSessionId: null,
    };
  }

  if (confirmed.length === 0) {
    return {
      activities: [],
      linkStatus: "no_runtime_session_link",
      message: MONITORING_NO_RUNTIME_LINK,
      roleRuntimeSessionId: null,
    };
  }

  if (confirmed.length > 1 && !selectedSessionId) {
    return {
      activities: [],
      linkStatus: "multiple_runtime_sessions",
      message: MONITORING_SELECT_SESSION,
      roleRuntimeSessionId: null,
    };
  }

  const sessionId =
    selectedSessionId ??
    (confirmed.length === 1 ? confirmed[0].roleRuntimeSessionId : null);

  if (!sessionId) {
    return {
      activities: [],
      linkStatus: "multiple_runtime_sessions",
      message: MONITORING_SELECT_SESSION,
      roleRuntimeSessionId: null,
    };
  }

  const match = confirmed.find(
    (item) => item.roleRuntimeSessionId === sessionId,
  );
  if (!match) {
    return {
      activities: [],
      linkStatus: "no_runtime_session_link",
      message: MONITORING_NO_RUNTIME_LINK,
      roleRuntimeSessionId: null,
    };
  }

  const participant = await participantsRepository.findParticipantById(
    profile.caseParticipantId,
  );
  if (!participant || participant.caseId !== match.caseId) {
    return {
      activities: [],
      linkStatus: "unavailable",
      message: MONITORING_UNAVAILABLE,
      roleRuntimeSessionId: null,
    };
  }

  const runs = await runtimeRepository.listActivityRunsBySession(sessionId);
  const activities: MonitoringActivityRow[] = runs.map((run) => ({
    activityId: run.activityId,
    runId: run.id,
    label: run.activityLabel ?? MONITORING_ACTIVITY_NAME_UNAVAILABLE,
    selectionReasonLabel: "Selección canónica primaria",
    baseLabel: b0BaseLabel(run),
    causalLabel: run.causalVisibleCount > 0 ? "Causal iniciada" : "Pendiente",
    currentBlockLabel: currentRuntimeBlockLabel(run),
    readinessLabel: runtimeReadinessLabel(run),
    criticalRouteLabel: MONITORING_UNAVAILABLE,
    roleRuntimeSessionId: sessionId,
    runStateLabel: runtimeRunStateLabel(run.state),
  }));

  return {
    activities,
    linkStatus: "linked",
    message: activities.length === 0 ? MONITORING_NO_RECORDS : null,
    roleRuntimeSessionId: sessionId,
  };
}

export async function assertMonitoringParticipantAccess(
  contextRepository: OfficialControlPanelContextRepository,
  participantsRepository: OfficialControlPanelParticipantsRepository,
  input: {
    consultantUserId: string;
    companyId: string;
    relationshipId: string;
    caseId: string;
    participantId?: string;
    profileId?: string;
  },
) {
  return assertConsultantCaseParticipantAccess(
    contextRepository,
    participantsRepository,
    input,
  );
}

type MonitoringRunProjection = Awaited<
  ReturnType<OfficialControlPanelMonitoringRuntimeRepository["listActivityRunsBySession"]>
>[number];

function runtimeRunStateLabel(state: string): string {
  switch (state) {
    case "initialized":
      return "Runtime preparado";
    case "active_base_capture":
    case "b0_confirmation_pending":
    case "semantic_preload_loaded":
      return "Runtime en ejecución";
    case "completed":
    case "base_complete":
    case "ready":
    case "ready_with_flags":
    case "exported_to_parallel_production":
    case "archived":
      return "Runtime completado";
    case "blocked":
      return "Runtime bloqueado";
    default:
      return state || MONITORING_UNAVAILABLE;
  }
}

function currentRuntimeBlockLabel(run: MonitoringRunProjection): string {
  if (run.state === "initialized") return "B0 pendiente";
  if (run.currentRuntimeInteractionId) {
    return `${run.currentRuntimeInteractionId} vigente`;
  }
  if (
    (run.confirmedInteractionInstanceCount ?? 0) >= 4 &&
    run.state === "active_base_capture"
  ) {
    return "B0 confirmado";
  }
  if ((run.interactionInstanceCount ?? 0) > 0) return "B0 en curso";
  return "B0 pendiente";
}

function runtimeReadinessLabel(run: MonitoringRunProjection): string {
  if (run.state === "initialized") return "Pendiente";
  if (run.state === "blocked") return "Bloqueado";
  if (run.readinessState && run.readinessState !== "not_started") {
    return run.readinessState;
  }
  if (run.state === "active_base_capture") return "Base activa";
  return MONITORING_UNAVAILABLE;
}

function b0BaseLabel(run: MonitoringRunProjection): string {
  const confirmed = run.confirmedInteractionInstanceCount;
  const subfields = run.subfieldResponseCount;
  const evidence = run.evidenceItemCount;
  const variables = run.canonicalVariableCount;
  if (confirmed == null || subfields == null || evidence == null || variables == null) {
    return "Error técnico en lectura B0";
  }
  if (confirmed > 0 || subfields > 0 || evidence > 0 || variables > 0) {
    return `B0 confirmado (${confirmed}/4, ${subfields} subcampos, ${evidence} evidencias, ${variables} variables)`;
  }
  return "B0 pendiente";
}
