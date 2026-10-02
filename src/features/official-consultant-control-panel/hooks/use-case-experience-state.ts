"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { ExperienceStateResponse } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import type {
  CapabilityVM,
  FreshnessVM,
  OfficialPanelEnvelope,
  OfficialPanelErrorVM,
  OfficialPanelScreenState,
  PanelDataAvailability,
  EffectiveControlPanelScope,
} from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import {
  getCaseExperienceState,
  postCaseExperienceAction,
} from "../data/client-context-api";
import type { ClientContextViewModel } from "../types/client-context.types";
import type { ExperienceActionType } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import type { ExperienceScreenKey } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import {
  ContextAuthError,
  ContextRequestError,
} from "../data/client-context-api";
import { resolveMutationSafety } from "../state/official-panel-mutation-safety";
import { deriveScreenStateFromResourceSnapshot } from "../state/official-panel-screen-state";
import {
  buildRefreshFailure,
  isAuthOrAbsenceStatus,
  type ResourceSnapshotState,
} from "../state/resource-snapshot-state";

type UseCaseExperienceStateInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  enabled?: boolean;
};

export type ExperienceLoadState = ResourceSnapshotState<
  OfficialPanelEnvelope<ExperienceStateResponse>
>;

function extractHttpMeta(error: unknown): {
  httpStatus?: number;
  requestId: string | null;
} {
  if (
    error instanceof ContextAuthError ||
    error instanceof ContextRequestError
  ) {
    return { httpStatus: error.status, requestId: error.requestId };
  }
  return { requestId: null };
}

export function useCaseExperienceState({
  context,
  accessToken,
  enabled = true,
}: UseCaseExperienceStateInput) {
  const searchParams = useSearchParams();
  const childUserId =
    searchParams.get("userId")?.trim() ||
    searchParams.get("user")?.trim() ||
    null;
  const childActivityId =
    searchParams.get("activityId")?.trim() ||
    searchParams.get("activity")?.trim() ||
    null;

  const [state, setState] = useState<ExperienceLoadState>({ status: "idle" });
  const requestIdRef = useRef(0);
  const hasSnapshotRef = useRef(false);
  const actionInFlightRef = useRef(false);
  const loadInFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const caseId =
    context.status === "active" ? context.selection.caseId : null;
  const companyId =
    context.status === "active" ? context.selection.companyId : null;
  const relationshipId =
    context.status === "active" ? context.selection.relationshipId : null;
  const authenticated =
    context.authReadiness === "authenticated" && Boolean(accessToken);
  const shouldLoad =
    enabled &&
    authenticated &&
    Boolean(caseId) &&
    Boolean(companyId) &&
    Boolean(relationshipId);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (
        !shouldLoad ||
        !accessToken ||
        !caseId ||
        !companyId ||
        !relationshipId
      ) {
        setState({ status: "idle" });
        hasSnapshotRef.current = false;
        return;
      }
      if (loadInFlightRef.current && !opts?.soft) return;

      const soft = Boolean(opts?.soft && hasSnapshotRef.current);
      const req = ++requestIdRef.current;
      loadInFlightRef.current = true;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!soft) {
        setState({ status: "loading" });
      } else {
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, refreshing: true, refreshFailure: null }
            : prev,
        );
      }

      try {
        const envelope = await getCaseExperienceState(
          accessToken,
          caseId,
          {
            companyId,
            relationshipId,
          },
          {
            userId: childUserId,
            activityId: childActivityId,
          },
          controller.signal,
        );
        if (req !== requestIdRef.current) return;
        hasSnapshotRef.current = true;
        setState({
          status: "ready",
          data: envelope,
          refreshing: false,
          refreshFailure: null,
        });
      } catch (error) {
        if (controller.signal.aborted && req !== requestIdRef.current) {
          return;
        }
        if (req !== requestIdRef.current) return;
        const { httpStatus, requestId } = extractHttpMeta(error);

        if (soft && hasSnapshotRef.current) {
          if (isAuthOrAbsenceStatus(httpStatus)) {
            hasSnapshotRef.current = false;
            setState({
              status: "error",
              message: "No fue posible cargar el estado de experiencia.",
              httpStatus,
              requestId,
            });
            return;
          }
          setState((prev) =>
            prev.status === "ready"
              ? {
                  ...prev,
                  refreshing: false,
                  refreshFailure: buildRefreshFailure({
                    httpStatus,
                    requestId,
                    retryable: true,
                  }),
                }
              : prev,
          );
          return;
        }

        hasSnapshotRef.current = false;
        setState({
          status: "error",
          message: "No fue posible cargar el estado de experiencia.",
          httpStatus,
          requestId,
        });
      } finally {
        if (req === requestIdRef.current) {
          loadInFlightRef.current = false;
        }
      }
    },
    [
      accessToken,
      caseId,
      childActivityId,
      childUserId,
      companyId,
      relationshipId,
      shouldLoad,
    ],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional fetch lifecycle */
    void load();
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      requestIdRef.current += 1;
      loadInFlightRef.current = false;
    };
  }, [load]);

  const envelope = state.status === "ready" ? state.data : null;

  const dataStatus: PanelDataAvailability | null = envelope?.dataStatus ?? null;
  const freshness: FreshnessVM | null = envelope?.freshness ?? null;
  const capabilities: CapabilityVM[] = envelope?.capabilities ?? [];
  const errors: OfficialPanelErrorVM[] = envelope?.errors ?? [];
  const effectiveScope: EffectiveControlPanelScope | null =
    envelope?.effectiveScope ?? null;
  const data: ExperienceStateResponse | null = envelope?.data ?? null;

  const screenState: OfficialPanelScreenState =
    deriveScreenStateFromResourceSnapshot({
      state,
      wireDataStatus: dataStatus,
      versionStale: freshness?.status === "stale",
    });

  const mutationSafety = resolveMutationSafety(screenState);

  const retry = useCallback(async () => {
    await load({ soft: hasSnapshotRef.current });
  }, [load]);

  const submitAction = useCallback(
    async (input: {
      actionType: ExperienceActionType;
      reasonCode: string;
      beforeState: string;
      expectedEffect: string;
      screenKey: ExperienceScreenKey;
      userId: string;
      roleRuntimeSessionId: string | null;
      activityId: string | null;
      idempotencyKey: string;
    }) => {
      if (!accessToken || !caseId) {
        throw new Error("experience_action_unavailable");
      }
      if (actionInFlightRef.current) {
        throw new Error("experience_action_in_flight");
      }
      if (mutationSafety.mutationsBlocked) {
        throw new Error("experience_action_stale");
      }
      actionInFlightRef.current = true;
      try {
        await postCaseExperienceAction(accessToken, caseId, {
          ...input,
          auditRef: `panel:${Date.now()}`,
        });
        void load({ soft: true });
      } finally {
        actionInFlightRef.current = false;
      }
    },
    [accessToken, caseId, load, mutationSafety.mutationsBlocked],
  );

  const refreshFailure =
    state.status === "ready" ? state.refreshFailure : null;

  return {
    state,
    envelope,
    screenState,
    dataStatus,
    freshness,
    capabilities,
    errors,
    effectiveScope,
    data,
    refreshing: state.status === "ready" ? state.refreshing : false,
    refreshFailure,
    requestId:
      state.status === "error"
        ? (state.requestId ?? null)
        : refreshFailure?.requestId ?? envelope?.requestId ?? null,
    mutationSafety,
    retry,
    submitAction,
    experienceAlertCount:
      data?.companyState.experienceAlertCount ?? null,
    attentionAlerts: data?.companyState.alerts ?? [],
  };
}
