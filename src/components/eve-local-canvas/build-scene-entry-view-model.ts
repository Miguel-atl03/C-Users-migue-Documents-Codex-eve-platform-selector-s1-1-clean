import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type {
  SceneEntryJourneyMode,
  SceneEntryViewModel,
} from "./scene-entry-presentation-contract";

export function resolveSceneEntryJourneyMode(
  mode: PrimaryActivitySelectionResult["mode"],
): SceneEntryJourneyMode {
  return mode === "non_competitive_inclusion" ? "all_included" : "filtered";
}

export function buildSceneEntryViewModel(
  result: PrimaryActivitySelectionResult | null | undefined,
): SceneEntryViewModel | null {
  const first = result?.selectedPrimaryActivities?.[0];
  if (!first?.activityLiteral?.trim()) {
    return null;
  }

  return {
    memoryLiteral: first.activityLiteral.trim(),
    areaLabel: first.areaLabel?.trim() || undefined,
    memoryIndex: 1,
    memoriesInJourney: result?.selectedPrimaryActivities.length ?? 1,
    journeyMode: resolveSceneEntryJourneyMode(
      result?.mode ?? "competitive_selection",
    ),
  };
}
