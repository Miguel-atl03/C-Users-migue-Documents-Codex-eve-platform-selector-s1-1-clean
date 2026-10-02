import {
  isManualProcessCode,
  type ManualProcessCode,
} from "@/services/eve/official-control-panel/official-control-panel-manual-work.types";

export const MANUAL_PROCESS_QUERY_KEY = "manual_process";
export const MANUAL_WORK_ITEM_QUERY_KEY = "manual_work_item";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseManualProcessSelection(
  params: URLSearchParams,
): ManualProcessCode | null {
  const raw = params.get(MANUAL_PROCESS_QUERY_KEY);
  if (raw == null || raw.trim() === "") return null;
  const value = raw.trim();
  return isManualProcessCode(value) ? value : null;
}

export function parseManualWorkItemSelection(
  params: URLSearchParams,
): string | null {
  const raw = params.get(MANUAL_WORK_ITEM_QUERY_KEY);
  if (raw == null || raw.trim() === "") return null;
  const value = raw.trim();
  return UUID_RE.test(value) ? value : null;
}

export function buildManualWorkNavigation(
  current: URLSearchParams,
  selection: {
    manualProcess: ManualProcessCode | null;
    manualWorkItemId: string | null;
  },
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (selection.manualProcess) {
    next.set(MANUAL_PROCESS_QUERY_KEY, selection.manualProcess);
  } else {
    next.delete(MANUAL_PROCESS_QUERY_KEY);
  }
  if (selection.manualWorkItemId) {
    next.set(MANUAL_WORK_ITEM_QUERY_KEY, selection.manualWorkItemId);
  } else {
    next.delete(MANUAL_WORK_ITEM_QUERY_KEY);
  }
  return next;
}

export function clearManualWorkItemOnProcessChange(
  current: URLSearchParams,
  manualProcess: ManualProcessCode | null,
): URLSearchParams {
  return buildManualWorkNavigation(current, {
    manualProcess,
    manualWorkItemId: null,
  });
}

/** True when manual_process is present but invalid. */
export function manualProcessNeedsClear(params: URLSearchParams): boolean {
  const raw = params.get(MANUAL_PROCESS_QUERY_KEY);
  if (raw == null) return false;
  if (raw.trim() === "") return true;
  return !isManualProcessCode(raw.trim());
}

/** True when manual_work_item is present but not a UUID. */
export function manualWorkItemNeedsClear(params: URLSearchParams): boolean {
  const raw = params.get(MANUAL_WORK_ITEM_QUERY_KEY);
  if (raw == null) return false;
  if (raw.trim() === "") return true;
  return !UUID_RE.test(raw.trim());
}
