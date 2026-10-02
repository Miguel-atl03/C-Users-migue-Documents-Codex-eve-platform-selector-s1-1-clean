/**
 * R3 — shared resource snapshot model for soft-refresh.
 * Snapshot may be kept; ready must not be restored silently after a failed refresh.
 */

export type ResourceRefreshFailure = {
  httpStatus?: number;
  requestId: string | null;
  retryable: boolean;
  occurredAt: string;
};

export type ResourceSnapshotState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      data: T;
      refreshing: boolean;
      refreshFailure: ResourceRefreshFailure | null;
    }
  | {
      status: "error";
      httpStatus?: number;
      requestId: string | null;
      message: string;
    };

export function isAuthOrAbsenceStatus(status: number | undefined): boolean {
  return status === 401 || status === 403 || status === 404;
}

export function buildRefreshFailure(input: {
  httpStatus?: number;
  requestId?: string | null;
  retryable?: boolean;
}): ResourceRefreshFailure {
  return {
    httpStatus: input.httpStatus,
    requestId: input.requestId ?? null,
    retryable: input.retryable ?? true,
    occurredAt: new Date().toISOString(),
  };
}

export function resourceHasValidSnapshot<T>(
  state: ResourceSnapshotState<T>,
): boolean {
  return state.status === "ready";
}

export function resourceRequestInFlight<T>(
  state: ResourceSnapshotState<T>,
): boolean {
  return (
    state.status === "loading" ||
    (state.status === "ready" && state.refreshing)
  );
}

export function resourceRefreshFailedWithSnapshot<T>(
  state: ResourceSnapshotState<T>,
): boolean {
  return state.status === "ready" && state.refreshFailure != null;
}
