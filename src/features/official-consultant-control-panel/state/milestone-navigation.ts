import {
  isCoreMilestoneCode,
  type CoreMilestoneCode,
} from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";

const MILESTONE_QUERY_KEY = "milestone";

/**
 * Rector §4.4 / §8: `milestone` carries H0–H6 (not operational UUID).
 * Invalid values are cleared by the core-milestone hook.
 */
export function parseMilestoneSelection(
  params: URLSearchParams,
): CoreMilestoneCode | null {
  const value = params.get(MILESTONE_QUERY_KEY)?.trim();
  if (!value) return null;
  return isCoreMilestoneCode(value) ? value : null;
}

export function milestoneNeedsClear(params: URLSearchParams): boolean {
  const value = params.get(MILESTONE_QUERY_KEY)?.trim();
  if (!value) return false;
  return !isCoreMilestoneCode(value);
}

export function buildMilestoneNavigation(
  current: URLSearchParams,
  milestoneCode: CoreMilestoneCode | null,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (milestoneCode) next.set(MILESTONE_QUERY_KEY, milestoneCode);
  else next.delete(MILESTONE_QUERY_KEY);
  return next;
}

export function clearMilestoneSelection(
  current: URLSearchParams,
): URLSearchParams {
  return buildMilestoneNavigation(current, null);
}

export { MILESTONE_QUERY_KEY };
