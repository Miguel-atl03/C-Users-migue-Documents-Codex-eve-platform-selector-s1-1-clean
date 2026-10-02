/**
 * Scene Entry (Memoria → Escena) — presentation contract for official canvas.
 * Orientative threshold room; no Runtime authority, no selection exposure.
 */

export type SceneEntryJourneyMode = "all_included" | "filtered";

export type SceneEntryViewModel = {
  memoryLiteral: string;
  areaLabel?: string;
  memoryIndex: 1;
  memoriesInJourney: number;
  journeyMode: SceneEntryJourneyMode;
};

export type SceneEntryPresentationContract = {
  viewModel: SceneEntryViewModel;
  presentationStatus: "preview_isolated" | "official_pending";
};
