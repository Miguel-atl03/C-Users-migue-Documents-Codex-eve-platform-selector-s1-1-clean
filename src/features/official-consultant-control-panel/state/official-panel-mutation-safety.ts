/**
 * R3 — mutation safety vs capability.
 * Capability allowed ≠ mutation safe when the section snapshot is stale
 * or the screen cannot accept mutations.
 */

import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";

export const STALE_MUTATION_BLOCK_MESSAGE =
  "La información cambió desde la última actualización. Actualice antes de realizar esta acción.";

export const PARTIAL_MUTATION_BLOCK_MESSAGE =
  "Parte de la información no pudo actualizarse. Actualice antes de realizar esta acción.";

export type MutationSafety = {
  mutationsBlocked: boolean;
  blockReason: string | null;
};

/**
 * @param screenState — canonical section screen state
 * @param opts.partialBlocksMutations — when true, partial also blocks
 *   (use when the action's precondition source was not evaluated)
 */
export function resolveMutationSafety(
  screenState: OfficialPanelScreenState,
  opts?: { partialBlocksMutations?: boolean },
): MutationSafety {
  if (screenState === "stale") {
    return {
      mutationsBlocked: true,
      blockReason: STALE_MUTATION_BLOCK_MESSAGE,
    };
  }
  if (
    screenState === "loading" ||
    screenState === "fatal" ||
    screenState === "forbidden" ||
    screenState === "not_found"
  ) {
    return {
      mutationsBlocked: true,
      blockReason: null,
    };
  }
  if (opts?.partialBlocksMutations && screenState === "partial") {
    return {
      mutationsBlocked: true,
      blockReason: PARTIAL_MUTATION_BLOCK_MESSAGE,
    };
  }
  return { mutationsBlocked: false, blockReason: null };
}
