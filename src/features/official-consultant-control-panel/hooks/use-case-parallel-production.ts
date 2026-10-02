"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ParallelProductionTrackingResponse } from "@/services/eve/official-control-panel/official-control-panel-parallel-production.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import {
  ContextAuthError,
  ContextRequestError,
  getCaseParallelProduction,
} from "../data/client-context-api";
import type { ClientContextViewModel } from "../types/client-context.types";
import { deriveScreenStateFromResourceSnapshot } from "../state/official-panel-screen-state";
import {
  buildRefreshFailure,
  isAuthOrAbsenceStatus,
  type ResourceSnapshotState,
} from "../state/resource-snapshot-state";

type UseCaseParallelProductionInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  view: string;
  enabled?: boolean;
};

export type ParallelProductionLoadState =
  ResourceSnapshotState<ParallelProductionTrackingResponse>;

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

export function useCaseParallelProduction({
  context,
  accessToken,
  enabled = true,
}: UseCaseParallelProductionInput) {
  const [state, setState] = useState<ParallelProductionLoadState>({
    status: "idle",
  });
  const requestSeqRef = useRef(0);
  const hasSnapshotRef = useRef(false);
  const retryLockRef = useRef(false);
  const loadInFlightRef = useRef(false);

  const caseId =
    context.status === "active" ? context.selection.caseId : null;
  const authenticated =
    context.authReadiness === "authenticated" && Boolean(accessToken);
  // R3: load independently of Monitoreo/Seguimiento/Gobernanza so attention
  // completeness is factual, not view-gated.
  const shouldLoad = enabled && authenticated && Boolean(caseId);

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!shouldLoad || !accessToken || !caseId) {
        setState({ status: "idle" });
        hasSnapshotRef.current = false;
        return;
      }
      if (loadInFlightRef.current && !opts?.soft) return;

      const soft = Boolean(opts?.soft && hasSnapshotRef.current);
      const req = ++requestSeqRef.current;
      loadInFlightRef.current = true;

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
        const data = await getCaseParallelProduction(accessToken, caseId);
        if (req !== requestSeqRef.current) return;
        hasSnapshotRef.current = true;
        setState({
          status: "ready",
          data,
          refreshing: false,
          refreshFailure: null,
        });
      } catch (error) {
        if (req !== requestSeqRef.current) return;
        const { httpStatus, requestId } = extractHttpMeta(error);

        if (soft && hasSnapshotRef.current) {
          if (isAuthOrAbsenceStatus(httpStatus)) {
            hasSnapshotRef.current = false;
            setState({
              status: "error",
              message: "No fue posible cargar Producción Paralela y QA.",
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
          message: "No fue posible cargar Producción Paralela y QA.",
          httpStatus,
          requestId,
        });
      } finally {
        if (req === requestSeqRef.current) {
          loadInFlightRef.current = false;
        }
      }
    },
    [accessToken, caseId, shouldLoad],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional fetch lifecycle */
    void load();
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      requestSeqRef.current += 1;
      loadInFlightRef.current = false;
    };
  }, [load]);

  const retry = useCallback(async () => {
    if (retryLockRef.current) return;
    retryLockRef.current = true;
    try {
      await load({ soft: hasSnapshotRef.current });
    } finally {
      retryLockRef.current = false;
    }
  }, [load]);

  const screenState: OfficialPanelScreenState =
    deriveScreenStateFromResourceSnapshot({
      state,
      wireDataStatus:
        state.status === "ready" ? state.data.dataStatus : undefined,
    });

  const refreshFailure =
    state.status === "ready" ? state.refreshFailure : null;

  return {
    state,
    screenState,
    requestId:
      state.status === "error"
        ? (state.requestId ?? null)
        : (refreshFailure?.requestId ?? null),
    refreshing: state.status === "ready" ? state.refreshing : false,
    refreshFailure,
    retry,
    alerts: state.status === "ready" ? state.data.alerts : [],
  };
}
