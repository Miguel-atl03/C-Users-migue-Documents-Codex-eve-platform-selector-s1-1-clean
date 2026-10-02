import { useCallback, useEffect, useRef, useState } from "react";

import type { ManualWorkTrackingResponse } from "@/services/eve/official-control-panel/official-control-panel-manual-work.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import {
  ContextAuthError,
  ContextRequestError,
  getCaseManualWork,
  postCaseManualAction,
  postCaseManualArtifactDownload,
  type PostCaseManualActionInput,
  type PostCaseManualDownloadInput,
} from "../data/client-context-api";
import type { ClientContextViewModel } from "../types/client-context.types";
import { deriveScreenStateFromResourceSnapshot } from "../state/official-panel-screen-state";
import { resolveMutationSafety } from "../state/official-panel-mutation-safety";
import {
  buildRefreshFailure,
  isAuthOrAbsenceStatus,
  type ResourceSnapshotState,
} from "../state/resource-snapshot-state";

type UseCaseManualWorkInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  view: string;
  enabled?: boolean;
};

export type ManualWorkLoadState =
  ResourceSnapshotState<ManualWorkTrackingResponse>;

function extractHttpMeta(error: unknown): {
  httpStatus?: number;
  requestId: string | null;
  code: string | null;
} {
  if (
    error instanceof ContextAuthError ||
    error instanceof ContextRequestError
  ) {
    return {
      httpStatus: error.status,
      requestId: error.requestId,
      code: error instanceof ContextRequestError ? error.code : null,
    };
  }
  if (error && typeof error === "object") {
    const record = error as {
      status?: unknown;
      code?: unknown;
      requestId?: unknown;
    };
    const status =
      typeof record.status === "number" ? record.status : undefined;
    const code = typeof record.code === "string" ? record.code : null;
    const requestId =
      typeof record.requestId === "string" ? record.requestId : null;
    return { httpStatus: status, requestId, code };
  }
  return { requestId: null, code: null };
}

export function useCaseManualWork({
  context,
  accessToken,
  enabled = true,
}: UseCaseManualWorkInput) {
  const [state, setState] = useState<ManualWorkLoadState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
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


  const applySoftRefreshFailure = useCallback(
    (httpStatus: number | undefined, requestId: string | null) => {
      if (isAuthOrAbsenceStatus(httpStatus)) {
        hasSnapshotRef.current = false;
        setState({
          status: "error",
          message: "No fue posible cargar el seguimiento de procesos manuales.",
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
    },
    [],
  );

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!shouldLoad || !accessToken || !caseId) {
        setState({ status: "idle" });
        hasSnapshotRef.current = false;
        return;
      }
      if (loadInFlightRef.current && !opts?.soft) return;
      if (retryLockRef.current && !opts?.soft) return;

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
        const data = await getCaseManualWork(accessToken, caseId);
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
          applySoftRefreshFailure(httpStatus, requestId);
          return;
        }
        hasSnapshotRef.current = false;
        setState({
          status: "error",
          message: "No fue posible cargar el seguimiento de procesos manuales.",
          httpStatus,
          requestId,
        });
      } finally {
        if (req === requestSeqRef.current) {
          loadInFlightRef.current = false;
        }
      }
    },
    [accessToken, applySoftRefreshFailure, caseId, shouldLoad],
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
      secondaryFailure:
        state.status === "ready" && state.data.dataStatus === "partial",
    });

  const mutationSafety = resolveMutationSafety(screenState);

  const markStaleFromConflict = useCallback(
    (httpStatus: number | undefined, requestId: string | null) => {
      if (!hasSnapshotRef.current) return;
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              refreshing: false,
              refreshFailure: buildRefreshFailure({
                httpStatus: httpStatus ?? 409,
                requestId,
                retryable: true,
              }),
            }
          : prev,
      );
    },
    [],
  );

  const submitAction = useCallback(
    async (input: PostCaseManualActionInput) => {
      if (!accessToken || !caseId || submitting) {
        throw new Error("manual_action_not_ready");
      }
      if (mutationSafety.mutationsBlocked) {
        throw new Error("manual_action_stale");
      }
      setSubmitting(true);
      try {
        const result = await postCaseManualAction(accessToken, caseId, input);
        if (result.tracking) {
          hasSnapshotRef.current = true;
          setState({
            status: "ready",
            data: result.tracking,
            refreshing: false,
            refreshFailure: null,
          });
        } else {
          await load({ soft: true });
        }
        return result;
      } catch (error) {
        const { httpStatus, requestId, code } = extractHttpMeta(error);
        if (
          httpStatus === 409 ||
          code === "STALE_MANUAL_WORK_ITEM"
        ) {
          markStaleFromConflict(httpStatus, requestId);
        }
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      accessToken,
      caseId,
      load,
      markStaleFromConflict,
      mutationSafety.mutationsBlocked,
      submitting,
    ],
  );

  const downloadPackage = useCallback(
    async (input: PostCaseManualDownloadInput) => {
      if (!accessToken || !caseId || submitting) {
        throw new Error("manual_action_not_ready");
      }
      if (mutationSafety.mutationsBlocked) {
        throw new Error("manual_action_stale");
      }
      setSubmitting(true);
      try {
        await postCaseManualArtifactDownload(accessToken, caseId, input);
        await load({ soft: true });
      } catch (error) {
        const { httpStatus, requestId, code } = extractHttpMeta(error);
        if (
          httpStatus === 409 ||
          code === "STALE_MANUAL_WORK_ITEM"
        ) {
          markStaleFromConflict(httpStatus, requestId);
        }
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      accessToken,
      caseId,
      load,
      markStaleFromConflict,
      mutationSafety.mutationsBlocked,
      submitting,
    ],
  );

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
    mutationSafety,
    retry,
    submitAction,
    downloadPackage,
    submitting,
    overdueAlerts:
      state.status === "ready" ? state.data.overdueAlerts : [],
  };
}
