/**
 * R1/R3 — Single screen-state derivation for UI hooks (no visual redesign).
 * Hooks should call this instead of inventing parallel state machines.
 */

import {
  deriveOfficialPanelScreenState,
  mapWireToPanelDataAvailability,
} from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { PanelDataAvailability } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { ResourceSnapshotState } from "./resource-snapshot-state";
import {
  resourceHasValidSnapshot,
  resourceRefreshFailedWithSnapshot,
  resourceRequestInFlight,
} from "./resource-snapshot-state";

export type LoadHookSnapshot = {
  status: "idle" | "loading" | "ready" | "error" | "refreshing";
  wireDataStatus?: string | null;
  httpStatus?: number | null;
  secondaryFailure?: boolean;
  secondaryDataStatuses?: PanelDataAvailability[];
  versionStale?: boolean;
  refreshFailedWithSnapshot?: boolean;
};

/**
 * Map common hook load statuses onto OfficialPanelScreenState.
 */
export function deriveScreenStateFromLoadHook(
  snap: LoadHookSnapshot,
): OfficialPanelScreenState {
  const hasValidSnapshot =
    snap.status === "ready" || snap.status === "refreshing";
  const requestInFlight =
    snap.status === "loading" || snap.status === "refreshing";

  let primaryDataStatus: PanelDataAvailability = "unavailable";
  if (snap.status === "error") {
    primaryDataStatus = "error";
  } else if (hasValidSnapshot) {
    primaryDataStatus = mapWireToPanelDataAvailability(
      snap.wireDataStatus ?? "available",
    );
  }

  return deriveOfficialPanelScreenState({
    hasValidSnapshot,
    requestInFlight,
    refreshFailedWithSnapshot: snap.refreshFailedWithSnapshot,
    httpStatus: snap.httpStatus,
    primaryDataStatus,
    secondaryFailure: snap.secondaryFailure,
    secondaryDataStatuses: snap.secondaryDataStatuses,
    versionStale: snap.versionStale,
  });
}

/**
 * Derive screen state from the shared ResourceSnapshotState model.
 */
export function deriveScreenStateFromResourceSnapshot<T>(input: {
  state: ResourceSnapshotState<T>;
  wireDataStatus?: string | null;
  secondaryFailure?: boolean;
  secondaryDataStatuses?: PanelDataAvailability[];
  versionStale?: boolean;
}): OfficialPanelScreenState {
  const { state } = input;
  const hasValidSnapshot = resourceHasValidSnapshot(state);
  const requestInFlight = resourceRequestInFlight(state);
  const refreshFailedWithSnapshot = resourceRefreshFailedWithSnapshot(state);

  let primaryDataStatus: PanelDataAvailability = "unavailable";
  let httpStatus: number | null | undefined;

  if (state.status === "error") {
    primaryDataStatus = "error";
    httpStatus = state.httpStatus;
  } else if (state.status === "ready") {
    primaryDataStatus = mapWireToPanelDataAvailability(
      input.wireDataStatus ?? "available",
    );
    // Auth/absence during refresh already cleared snapshot in hooks.
    // Transport/conflict failures keep snapshot; do not pass 5xx/409 as
    // top-level httpStatus (that would risk fatal). Use refreshFailedWithSnapshot.
  }

  return deriveOfficialPanelScreenState({
    hasValidSnapshot,
    requestInFlight,
    refreshFailedWithSnapshot,
    httpStatus,
    primaryDataStatus,
    secondaryFailure: input.secondaryFailure,
    secondaryDataStatuses: input.secondaryDataStatuses,
    versionStale: input.versionStale,
  });
}

export { deriveOfficialPanelScreenState, mapWireToPanelDataAvailability };
