/**
 * Experience capability matrix for authorized consultant×case scope.
 * Canonical source for GET experience-state and POST experience-actions.
 * Service role executes RPC only — never substitutes for capability allow.
 */

import {
  buildCapabilityMatrix,
  resolveCapabilityAllowed,
} from "./official-control-panel-capability-catalog";
import type { CapabilityVM } from "./official-control-panel-contract.types";
import type { ExperienceActionType } from "./official-control-panel-experience.types";
import { capabilityForAction } from "./official-control-panel-experience.types";

/** Mutation + read caps granted when consultant already passed case scope checks. */
export const EXPERIENCE_SCOPE_ALLOWED_CAPABILITIES = [
  "view_company_state",
  "view_experience_state",
  "send_support_message",
  "request_reentry",
  "mark_manual_review",
] as const;

export function buildExperienceCapabilityMatrix(input?: {
  /** When false, all experience mutation caps are denied. */
  caseAccessAllowed?: boolean;
  /** Explicit overrides (e.g. grant revocation for negatives). */
  deniedKeys?: readonly string[];
}): CapabilityVM[] {
  const caseAccessAllowed = input?.caseAccessAllowed !== false;
  const denied = new Set(input?.deniedKeys ?? []);
  const allowed = caseAccessAllowed
    ? EXPERIENCE_SCOPE_ALLOWED_CAPABILITIES.filter((k) => !denied.has(k))
    : (["view_company_state", "view_experience_state"] as const);

  return buildCapabilityMatrix({
    allowed,
    reasonByKey: Object.fromEntries(
      [...denied].map((k) => [k, "capability_denied"]),
    ) as Parameters<typeof buildCapabilityMatrix>[0]["reasonByKey"],
  });
}

export function isExperienceActionCapabilityAllowed(
  matrix: CapabilityVM[],
  actionType: ExperienceActionType,
): boolean {
  return resolveCapabilityAllowed(matrix, capabilityForAction(actionType));
}

/** before-state values accepted for low/medium support actions from factual queue. */
export const EXPERIENCE_COMPATIBLE_BEFORE_STATES = new Set([
  "support_requested",
  "support_requested_event",
  "blocked",
  "error",
  "active",
  "support_action",
]);

export function isCompatibleExperienceBeforeState(beforeState: string): boolean {
  const normalized = beforeState.trim().toLowerCase();
  if (!normalized) return false;
  if (EXPERIENCE_COMPATIBLE_BEFORE_STATES.has(normalized)) return true;
  // Allow factual machine statuses already used in seed/UI.
  return (
    normalized.includes("support") ||
    normalized === "blocked" ||
    normalized === "error"
  );
}
