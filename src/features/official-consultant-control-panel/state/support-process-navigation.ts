import {
  isSupportProcessCode,
  type SupportProcessCode,
} from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";

export const PROCESS_QUERY_KEY = "process";

/**
 * Selection is optional. Absent / empty → null (no chip selected).
 * Invalid values (including legacy Todos) must be cleared from the URL.
 * Does not touch milestone (independent until §9).
 */
export function parseSupportProcessSelection(
  params: URLSearchParams,
): SupportProcessCode | null {
  const raw = params.get(PROCESS_QUERY_KEY);
  if (raw == null || raw.trim() === "") return null;
  const value = raw.trim();
  if (isSupportProcessCode(value)) return value;
  return null;
}

export function buildSupportProcessNavigation(
  current: URLSearchParams,
  processCode: SupportProcessCode,
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.set(PROCESS_QUERY_KEY, processCode);
  return next;
}

export function clearSupportProcessNavigation(
  current: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(current);
  next.delete(PROCESS_QUERY_KEY);
  return next;
}

/** True when `process` is present but not a valid P-SUP code (including legacy Todos). */
export function supportProcessNeedsClear(params: URLSearchParams): boolean {
  const raw = params.get(PROCESS_QUERY_KEY);
  if (raw == null) return false;
  if (raw.trim() === "") return true;
  return !isSupportProcessCode(raw.trim());
}
