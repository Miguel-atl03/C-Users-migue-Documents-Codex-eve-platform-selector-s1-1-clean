"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  CaseParticipantSummary,
  FunctionalProfileSummary,
} from "@/services/eve/official-control-panel/official-control-panel-participants.types";
import type {
  MonitoringActivityRow,
  MonitoringActivitiesLinkStatus,
} from "@/services/eve/official-control-panel/official-control-panel-monitoring.types";
import {
  getActivitySelectionCoverage,
  getCaseParticipants,
  getMonitoringRoleActivities,
  getMonitoringRoleSessions,
  getMonitoringUsers,
  getParticipantProfiles,
} from "../data/client-context-api";
import { composeParticipantMonitoringList } from "@/services/eve/official-control-panel/official-control-panel-contract-compose";
import type { ParticipantMonitoringVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import { deriveOfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import type {
  FunctionalSessionOption,
  MonitoringUserRow,
} from "@/services/eve/official-control-panel/official-control-panel-monitoring.types";
import {
  PARTICIPANTS_ERROR_MESSAGE,
  classifyParticipantProfileViewStatus,
  presentParticipantProfileViewModel,
} from "../presentation/participant-profile-presentation";
import {
  changeMonitoringActivity,
  changeMonitoringRole,
  changeMonitoringSession,
  changeMonitoringUser,
  clearMonitoringDepth,
  parseMonitoringDepthSelection,
} from "../state/monitoring-depth-navigation";
import type { ClientContextViewModel } from "../types/client-context.types";
import type { ActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection.types";

type SessionOption = {
  id: string;
  label: string;
  stateLabel: string | null;
  linkStatus: "confirmed" | "pending_review";
};

type UseCaseParticipantsInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
};

export function useCaseParticipants({
  context,
  accessToken,
}: UseCaseParticipantsInput) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const caseId =
    context.status === "active" ? context.selection.caseId : null;

  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsError, setParticipantsError] = useState(false);
  const [participants, setParticipants] = useState<CaseParticipantSummary[]>(
    [],
  );
  const [monitoringUsers, setMonitoringUsers] = useState<MonitoringUserRow[]>(
    [],
  );
  const [sessionsByUserId, setSessionsByUserId] = useState<
    Map<string, FunctionalSessionOption[]>
  >(() => new Map());
  const [profilesByParticipantId, setProfilesByParticipantId] = useState<
    Record<string, FunctionalProfileSummary[]>
  >({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState(false);
  const [activities, setActivities] = useState<MonitoringActivityRow[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);
  const [activitiesMessage, setActivitiesMessage] = useState<string | null>(
    null,
  );
  const [activitiesLinkStatus, setActivitiesLinkStatus] =
    useState<MonitoringActivitiesLinkStatus | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [activitySelection, setActivitySelection] =
    useState<ActivitySelectionCoverageView | null>(null);
  const [activitySelectionLoading, setActivitySelectionLoading] =
    useState(false);
  const [activitySelectionError, setActivitySelectionError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const loadedCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    setProfilesByParticipantId({});
    setActivities([]);
    setActivitiesMessage(null);
    setActivitiesLinkStatus(null);
    setSessions([]);
    setSessionsByUserId(new Map());
    setMonitoringUsers([]);
    setActivitySelection(null);
    setActivitySelectionLoading(false);
    setActivitySelectionError(false);
    loadedCaseIdRef.current = null;
  }, [caseId]);

  useEffect(() => {
    if (!caseId || !accessToken) {
      setLoadingParticipants(false);
      setParticipantsError(false);
      setParticipants([]);
      loadedCaseIdRef.current = null;
      return;
    }

    const controller = new AbortController();
    setLoadingParticipants(true);
    setParticipantsError(false);
    loadedCaseIdRef.current = null;

    void (async () => {
      try {
        const [next, monitoring] = await Promise.all([
          getCaseParticipants(accessToken, caseId, controller.signal),
          getMonitoringUsers(accessToken, caseId, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setParticipants(next);
        setMonitoringUsers(monitoring.users);
        setLoadingParticipants(false);
        loadedCaseIdRef.current = caseId;
      } catch {
        if (controller.signal.aborted) return;
        setParticipants([]);
        setMonitoringUsers([]);
        setLoadingParticipants(false);
        setParticipantsError(true);
        loadedCaseIdRef.current = null;
      }
    })();

    return () => controller.abort();
  }, [accessToken, caseId, retryVersion]);

  const depth = parseMonitoringDepthSelection(
    new URLSearchParams(queryString),
  );
  const requestedParticipantId = depth.participantId;
  const requestedProfileId = depth.profileId;
  const urlCaseId =
    new URLSearchParams(queryString).get("case_id")?.trim() ||
    new URLSearchParams(queryString).get("case")?.trim() ||
    null;

  const participantIds = useMemo(
    () =>
      new Set([
        ...participants.map((item) => item.id),
        ...monitoringUsers.map((item) => item.participantId),
      ]),
    [monitoringUsers, participants],
  );
  const userIdByParticipantId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const participant of participants) {
      map.set(participant.id, participant.userId ?? null);
    }
    for (const user of monitoringUsers) {
      if (user.userId) map.set(user.participantId, user.userId);
    }
    return map;
  }, [monitoringUsers, participants]);

  useEffect(() => {
    if (!caseId) {
      if (
        (requestedParticipantId ||
          requestedProfileId ||
          depth.userId ||
          depth.activityId ||
          depth.runId) &&
        !urlCaseId
      ) {
        const next = clearMonitoringDepth(new URLSearchParams(queryString));
        router.replace(
          next.toString() ? `${pathname}?${next.toString()}` : pathname,
          { scroll: false },
        );
      }
      return;
    }

    if (loadingParticipants || participantsError) return;
    if (loadedCaseIdRef.current !== caseId) return;

    let nextParticipant = requestedParticipantId;
    let nextProfile = requestedProfileId;
    let dirty = false;

    if (nextParticipant && !participantIds.has(nextParticipant)) {
      nextParticipant = null;
      nextProfile = null;
      dirty = true;
    } else if (!nextParticipant && nextProfile) {
      nextProfile = null;
      dirty = true;
    }

    const profilesForParticipant =
      nextParticipant && profilesByParticipantId[nextParticipant]
        ? profilesByParticipantId[nextParticipant]
        : null;

    if (
      nextParticipant &&
      nextProfile &&
      profilesForParticipant &&
      !profilesForParticipant.some((p) => p.id === nextProfile)
    ) {
      nextProfile = null;
      dirty = true;
    }

    if (!dirty) return;

    const next = changeMonitoringRole(new URLSearchParams(queryString), {
      participantId: nextParticipant ?? "",
      userId: null,
      profileId: nextProfile,
    });
    if (!nextParticipant) {
      const cleared = changeMonitoringUser(new URLSearchParams(queryString), {
        participantId: null,
        userId: null,
      });
      router.replace(
        cleared.toString() ? `${pathname}?${cleared.toString()}` : pathname,
        { scroll: false },
      );
      return;
    }
    router.replace(
      next.toString() ? `${pathname}?${next.toString()}` : pathname,
      { scroll: false },
    );
  }, [
    caseId,
    depth.activityId,
    depth.runId,
    depth.userId,
    loadingParticipants,
    participantsError,
    participantIds,
    pathname,
    profilesByParticipantId,
    queryString,
    requestedParticipantId,
    requestedProfileId,
    router,
    urlCaseId,
  ]);

  const expandedParticipantId =
    requestedParticipantId && participantIds.has(requestedParticipantId)
      ? requestedParticipantId
      : null;

  useEffect(() => {
    if (!caseId || !accessToken || !expandedParticipantId) {
      setProfilesLoading(false);
      setProfilesError(false);
      return;
    }

    if (profilesByParticipantId[expandedParticipantId]) {
      setProfilesLoading(false);
      setProfilesError(false);
      return;
    }

    const controller = new AbortController();
    setProfilesLoading(true);
    setProfilesError(false);

    void (async () => {
      try {
        const profiles = await getParticipantProfiles(
          accessToken,
          caseId,
          expandedParticipantId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setProfilesByParticipantId((prev) => ({
          ...prev,
          [expandedParticipantId]: profiles,
        }));
        setProfilesLoading(false);
      } catch (errorValue) {
        if (
          errorValue instanceof DOMException &&
          errorValue.name === "AbortError"
        ) {
          return;
        }
        if (controller.signal.aborted) return;
        setProfilesLoading(false);
        setProfilesError(true);
      }
    })();

    return () => controller.abort();
  }, [
    accessToken,
    caseId,
    expandedParticipantId,
    profilesByParticipantId,
  ]);

  useEffect(() => {
    if (!expandedParticipantId || !requestedProfileId) return;
    const profiles = profilesByParticipantId[expandedParticipantId];
    if (!profiles) return;
    if (profiles.some((p) => p.id === requestedProfileId)) return;

    const next = changeMonitoringRole(new URLSearchParams(queryString), {
      participantId: expandedParticipantId,
      userId: depth.userId,
      profileId: null,
    });
    router.replace(
      next.toString() ? `${pathname}?${next.toString()}` : pathname,
      { scroll: false },
    );
  }, [
    depth.userId,
    expandedParticipantId,
    pathname,
    profilesByParticipantId,
    queryString,
    requestedProfileId,
    router,
  ]);

  const selectedProfileId =
    expandedParticipantId &&
    requestedProfileId &&
    (profilesByParticipantId[expandedParticipantId] ?? []).some(
      (p) => p.id === requestedProfileId,
    )
      ? requestedProfileId
      : null;

  const requestedSessionId = depth.roleRuntimeSessionId;

  useEffect(() => {
    if (!caseId || !accessToken || !selectedProfileId) {
      setSessions([]);
      return;
    }
    const controller = new AbortController();
    void (async () => {
      try {
        const next = await getMonitoringRoleSessions(
          accessToken,
          caseId,
          selectedProfileId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setSessions(next);
        const userIdForSessions =
          monitoringUsers.find((u) => u.participantId === expandedParticipantId)
            ?.userId ?? depth.userId;
        if (userIdForSessions) {
          setSessionsByUserId((prev) => {
            const copy = new Map(prev);
            // Preserve other users' sessions; never merge across userIds.
            copy.set(userIdForSessions, next);
            return copy;
          });
        }
        if (next.length === 1 && requestedSessionId !== next[0].id) {
          const current = new URLSearchParams(queryString);
          const replaced = changeMonitoringSession(current, {
            participantId: expandedParticipantId!,
            userId: depth.userId,
            profileId: selectedProfileId,
            roleRuntimeSessionId: next[0].id,
          });
          router.replace(
            replaced.toString()
              ? `${pathname}?${replaced.toString()}`
              : pathname,
            { scroll: false },
          );
        } else if (
          requestedSessionId &&
          next.length > 0 &&
          !next.some((item) => item.id === requestedSessionId)
        ) {
          const current = new URLSearchParams(queryString);
          const cleared = changeMonitoringSession(current, {
            participantId: expandedParticipantId!,
            userId: depth.userId,
            profileId: selectedProfileId,
            roleRuntimeSessionId: null,
          });
          router.replace(
            cleared.toString() ? `${pathname}?${cleared.toString()}` : pathname,
            { scroll: false },
          );
        } else if (next.length > 1 && !requestedSessionId) {
          // no autoselect
        }
      } catch {
        if (controller.signal.aborted) return;
        setSessions([]);
      }
    })();
    return () => controller.abort();
  }, [
    accessToken,
    caseId,
    depth.userId,
    expandedParticipantId,
    monitoringUsers,
    pathname,
    queryString,
    requestedSessionId,
    router,
    selectedProfileId,
  ]);

  useEffect(() => {
    if (!caseId || !accessToken || !selectedProfileId) {
      setActivities([]);
      setActivitiesLoading(false);
      setActivitiesError(false);
      setActivitiesMessage(null);
      setActivitiesLinkStatus(null);
      return;
    }

    const controller = new AbortController();
    setActivitiesLoading(true);
    setActivitiesError(false);

    void (async () => {
      try {
        const response = await getMonitoringRoleActivities(
          accessToken,
          caseId,
          selectedProfileId,
          controller.signal,
          requestedSessionId,
        );
        if (controller.signal.aborted) return;
        setActivities(response.activities);
        setActivitiesLinkStatus(
          response.linkStatus === "available"
            ? "linked"
            : response.linkStatus,
        );
        setActivitiesMessage(response.message);
        setActivitiesLoading(false);
      } catch (errorValue) {
        if (
          errorValue instanceof DOMException &&
          errorValue.name === "AbortError"
        ) {
          return;
        }
        if (controller.signal.aborted) return;
        setActivities([]);
        setActivitiesLoading(false);
        setActivitiesError(true);
        setActivitiesMessage(null);
        setActivitiesLinkStatus(null);
      }
    })();

    return () => controller.abort();
  }, [
    accessToken,
    caseId,
    requestedSessionId,
    selectedProfileId,
    retryVersion,
  ]);

  const status = classifyParticipantProfileViewStatus({
    caseActive: Boolean(caseId),
    loadingParticipants,
    participantsError,
    participants,
    loadingProfiles: Boolean(expandedParticipantId) && profilesLoading,
  });

  const screenState: OfficialPanelScreenState = deriveOfficialPanelScreenState({
    hasValidSnapshot: Boolean(caseId) && !loadingParticipants && !participantsError,
    requestInFlight: loadingParticipants,
    httpStatus: participantsError ? 500 : undefined,
    // List loaded → ready. Profile/activity gaps stay item-level, not panel partial.
    primaryDataStatus: participantsError
      ? "error"
      : loadingParticipants
        ? "unavailable"
        : "available",
    secondaryFailure: false,
  });

  const viewModel = presentParticipantProfileViewModel({
    status,
    participants,
    expandedParticipantId,
    profilesByParticipantId,
    profilesLoading: Boolean(expandedParticipantId) && profilesLoading,
    profilesError,
    selectedProfileId,
    errorMessage: participantsError ? PARTICIPANTS_ERROR_MESSAGE : null,
    activities,
    activitiesLoading: Boolean(selectedProfileId) && activitiesLoading,
    activitiesError,
    activitiesMessage,
    activitiesLinkStatus,
  });

  const readNavigationParams = useCallback(() => {
    if (typeof window !== "undefined" && window.location.search) {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(queryString);
  }, [queryString]);

  const toggleParticipant = useCallback(
    (participantId: string) => {
      const current = readNavigationParams();
      const nextId =
        expandedParticipantId === participantId ? null : participantId;
      const next = changeMonitoringUser(current, {
        participantId: nextId,
        userId: nextId ? (userIdByParticipantId.get(nextId) ?? null) : null,
      });
      const href = next.toString()
        ? `${pathname}?${next.toString()}`
        : pathname;
      router.push(href, { scroll: false });
    },
    [
      expandedParticipantId,
      pathname,
      readNavigationParams,
      router,
      userIdByParticipantId,
    ],
  );

  const selectProfile = useCallback(
    (participantId: string, profileId: string | null) => {
      const current = readNavigationParams();
      const next = changeMonitoringRole(current, {
        participantId,
        userId: userIdByParticipantId.get(participantId) ?? null,
        profileId,
        roleRuntimeSessionId: null,
      });
      const href = next.toString()
        ? `${pathname}?${next.toString()}`
        : pathname;
      router.push(href, { scroll: false });
    },
    [pathname, readNavigationParams, router, userIdByParticipantId],
  );

  const selectSession = useCallback(
    (sessionId: string | null) => {
      if (!expandedParticipantId || !selectedProfileId) return;
      const current = readNavigationParams();
      const next = changeMonitoringSession(current, {
        participantId: expandedParticipantId,
        userId: depth.userId,
        profileId: selectedProfileId,
        roleRuntimeSessionId: sessionId,
      });
      const href = next.toString()
        ? `${pathname}?${next.toString()}`
        : pathname;
      router.push(href, { scroll: false });
    },
    [
      depth.userId,
      expandedParticipantId,
      pathname,
      readNavigationParams,
      router,
      selectedProfileId,
    ],
  );

  const selectActivity = useCallback(
    (activityId: string | null) => {
      if (!expandedParticipantId || !selectedProfileId) return;
      const current = readNavigationParams();
      const next = changeMonitoringActivity(current, {
        participantId: expandedParticipantId,
        userId: depth.userId,
        profileId: selectedProfileId,
        roleRuntimeSessionId: requestedSessionId,
        activityId,
      });
      const href = next.toString()
        ? `${pathname}?${next.toString()}`
        : pathname;
      router.push(href, { scroll: false });
    },
    [
      depth.userId,
      expandedParticipantId,
      pathname,
      readNavigationParams,
      requestedSessionId,
      router,
      selectedProfileId,
    ],
  );

  useEffect(() => {
    if (
      !caseId ||
      !accessToken ||
      !expandedParticipantId ||
      !selectedProfileId ||
      !requestedSessionId
    ) {
      setActivitySelection(null);
      setActivitySelectionLoading(false);
      setActivitySelectionError(false);
      return;
    }
    const controller = new AbortController();
    setActivitySelectionLoading(true);
    setActivitySelectionError(false);
    void (async () => {
      try {
        const next = await getActivitySelectionCoverage(
          accessToken,
          caseId,
          expandedParticipantId,
          selectedProfileId,
          requestedSessionId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setActivitySelection(next);
        setActivitySelectionLoading(false);
      } catch {
        if (controller.signal.aborted) return;
        setActivitySelection(null);
        setActivitySelectionLoading(false);
        setActivitySelectionError(true);
      }
    })();
    return () => controller.abort();
  }, [
    accessToken,
    caseId,
    expandedParticipantId,
    requestedSessionId,
    selectedProfileId,
    retryVersion,
  ]);

  const retry = useCallback(() => {
    setRetryVersion((version) => version + 1);
  }, []);

  const participantMonitoringVMs: ParticipantMonitoringVM[] = useMemo(
    () => composeParticipantMonitoringList(monitoringUsers, sessionsByUserId),
    [monitoringUsers, sessionsByUserId],
  );

  return {
    participantsView: {
      ...viewModel,
      sessions,
      selectedSessionId: requestedSessionId,
      activitySelection,
      activitySelectionLoading,
      activitySelectionError,
      selectedActivityId: depth.activityId,
    },
    participantMonitoringVMs,
    screenState,
    toggleParticipant,
    selectProfile,
    selectSession,
    selectActivity,
    retry,
  };
}
