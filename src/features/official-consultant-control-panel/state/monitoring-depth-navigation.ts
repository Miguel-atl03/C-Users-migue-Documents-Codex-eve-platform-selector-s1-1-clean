/**
 * Navegación §10 — dual-read canónico + aliases R2B.
 *
 * Canónicos: participant_id, user_id, profile_id,
 * role_runtime_session_id, activity_id, run.
 * Aliases de lectura: participant, profile.
 */

export const MONITORING_QUERY_KEYS = {
  userId: "user_id",
  roleRuntimeSessionId: "role_runtime_session_id",
  activityId: "activity_id",
  run: "run",
  participant: "participant_id",
  profile: "profile_id",
} as const;

const LEGACY_MONITORING_QUERY_KEYS = {
  participant: "participant",
  profile: "profile",
} as const;

export type MonitoringDepthSelection = {
  /** Preferencia de URL: participant id R2 (navegación UI) */
  participantId: string | null;
  /** usuarios.id opaco si viene en URL */
  userId: string | null;
  /** profile id R2 (rol UI) o null */
  profileId: string | null;
  roleRuntimeSessionId: string | null;
  activityId: string | null;
  runId: string | null;
};

export function parseMonitoringDepthSelection(
  params: URLSearchParams,
): MonitoringDepthSelection {
  return {
    participantId: normalized(
      params.get(MONITORING_QUERY_KEYS.participant) ??
        params.get(LEGACY_MONITORING_QUERY_KEYS.participant),
    ),
    userId: normalized(params.get(MONITORING_QUERY_KEYS.userId)),
    profileId: normalized(
      params.get(MONITORING_QUERY_KEYS.profile) ??
        params.get(LEGACY_MONITORING_QUERY_KEYS.profile),
    ),
    roleRuntimeSessionId: normalized(
      params.get(MONITORING_QUERY_KEYS.roleRuntimeSessionId),
    ),
    activityId: normalized(params.get(MONITORING_QUERY_KEYS.activityId)),
    runId: normalized(params.get(MONITORING_QUERY_KEYS.run)),
  };
}

export function buildMonitoringDepthNavigation(
  current: URLSearchParams,
  selection: MonitoringDepthSelection,
): URLSearchParams {
  const next = new URLSearchParams(current);

  setOrDelete(next, MONITORING_QUERY_KEYS.participant, selection.participantId);
  setOrDelete(next, MONITORING_QUERY_KEYS.userId, selection.userId);

  if (selection.participantId && selection.profileId) {
    next.set(MONITORING_QUERY_KEYS.profile, selection.profileId);
  } else {
    next.delete(MONITORING_QUERY_KEYS.profile);
  }

  setOrDelete(
    next,
    MONITORING_QUERY_KEYS.roleRuntimeSessionId,
    selection.roleRuntimeSessionId,
  );
  setOrDelete(next, MONITORING_QUERY_KEYS.activityId, selection.activityId);
  setOrDelete(next, MONITORING_QUERY_KEYS.run, selection.runId);
  setOrDelete(
    next,
    LEGACY_MONITORING_QUERY_KEYS.participant,
    selection.participantId,
  );
  setOrDelete(
    next,
    LEGACY_MONITORING_QUERY_KEYS.profile,
    selection.participantId ? selection.profileId : null,
  );

  return next;
}

/** Cambiar usuario: limpia rol, sesión, actividad y run. */
export function changeMonitoringUser(
  current: URLSearchParams,
  input: { participantId: string | null; userId: string | null },
): URLSearchParams {
  return buildMonitoringDepthNavigation(current, {
    participantId: input.participantId,
    userId: input.userId,
    profileId: null,
    roleRuntimeSessionId: null,
    activityId: null,
    runId: null,
  });
}

/** Cambiar rol (profile UI): limpia sesión, actividad y run. */
export function changeMonitoringRole(
  current: URLSearchParams,
  input: {
    participantId: string;
    userId: string | null;
    profileId: string | null;
    roleRuntimeSessionId?: string | null;
  },
): URLSearchParams {
  return buildMonitoringDepthNavigation(current, {
    participantId: input.participantId,
    userId: input.userId,
    profileId: input.profileId,
    roleRuntimeSessionId: input.roleRuntimeSessionId ?? null,
    activityId: null,
    runId: null,
  });
}

/** Cambiar actividad: limpia run. */
export function changeMonitoringActivity(
  current: URLSearchParams,
  input: {
    participantId: string;
    userId: string | null;
    profileId: string | null;
    roleRuntimeSessionId: string | null;
    activityId: string | null;
  },
): URLSearchParams {
  return buildMonitoringDepthNavigation(current, {
    participantId: input.participantId,
    userId: input.userId,
    profileId: input.profileId,
    roleRuntimeSessionId: input.roleRuntimeSessionId,
    activityId: input.activityId,
    runId: null,
  });
}

/** Cambiar sesión funcional: limpia actividad y run. */
export function changeMonitoringSession(
  current: URLSearchParams,
  input: {
    participantId: string;
    userId: string | null;
    profileId: string;
    roleRuntimeSessionId: string | null;
  },
): URLSearchParams {
  return buildMonitoringDepthNavigation(current, {
    participantId: input.participantId,
    userId: input.userId,
    profileId: input.profileId,
    roleRuntimeSessionId: input.roleRuntimeSessionId,
    activityId: null,
    runId: null,
  });
}

export function clearMonitoringDepth(
  current: URLSearchParams,
): URLSearchParams {
  return buildMonitoringDepthNavigation(current, {
    participantId: null,
    userId: null,
    profileId: null,
    roleRuntimeSessionId: null,
    activityId: null,
    runId: null,
  });
}

function normalized(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value) params.set(key, value);
  else params.delete(key);
}
