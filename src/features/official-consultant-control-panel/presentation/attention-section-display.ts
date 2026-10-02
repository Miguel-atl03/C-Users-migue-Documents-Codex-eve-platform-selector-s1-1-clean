import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";

/**
 * Localized attention section display. Overall completeness comes only from
 * PanelAggregationCompleteness.attentionComplete — never recalculated here.
 */
export type AttentionSectionDisplay = "items" | "none" | "unavailable" | "dash";

function sourceEvaluated(
  state: OfficialPanelScreenState | "loading" | "ready",
): boolean {
  return (
    state === "ready" ||
    state === "refreshing" ||
    state === "stale" ||
    state === "partial"
  );
}

function sourceUnevaluable(
  state: OfficialPanelScreenState | "loading" | "ready",
): boolean {
  return (
    state === "fatal" ||
    state === "forbidden" ||
    state === "not_found" ||
    state === "loading"
  );
}

/**
 * Decide how to render one attention source section.
 * `attentionComplete` is the canonical gate from resolvePanelAggregationCompleteness.
 */
export function resolveAttentionSectionDisplay(input: {
  attentionComplete: boolean;
  sourceScreenState?: OfficialPanelScreenState | "loading" | "ready" | null;
  itemCount: number;
}): AttentionSectionDisplay {
  const state = input.sourceScreenState ?? null;
  if (state != null && sourceUnevaluable(state)) {
    return "unavailable";
  }
  if (state != null && !sourceEvaluated(state)) {
    return "unavailable";
  }
  if (input.itemCount > 0) {
    return "items";
  }
  // Empty evaluated source: "Ninguno"/"Sin alertas" only when attention is complete.
  if (!input.attentionComplete) {
    return "dash";
  }
  return "none";
}

export function shouldShowAttentionPartialNotice(
  attentionComplete: boolean,
): boolean {
  return !attentionComplete;
}

