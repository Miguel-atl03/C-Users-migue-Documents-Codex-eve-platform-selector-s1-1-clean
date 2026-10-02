import type {
  SceneEntryJourneyMode,
  SceneEntryPresentationContract,
  SceneEntryViewModel,
} from "./scene-entry-presentation-contract";

const PREVIEW_MEMORY_LITERAL =
  "Comunico el avance al cliente mediante correo, WhatsApp o llamada, utilizando únicamente las fechas y condiciones confirmadas por las áreas responsables, para generar una Actualización Comercial trazable y evitar promesas no respaldadas.";

const PREVIEW_AREA_LABEL = "Comercial · Ventas";

export function createSceneEntryVisualStubViewModel(options?: {
  journeyMode?: SceneEntryJourneyMode;
  memoryLiteral?: string;
  areaLabel?: string;
  memoriesInJourney?: number;
}): SceneEntryViewModel {
  const journeyMode = options?.journeyMode ?? "filtered";

  return {
    memoryLiteral: options?.memoryLiteral ?? PREVIEW_MEMORY_LITERAL,
    areaLabel: options?.areaLabel ?? PREVIEW_AREA_LABEL,
    memoryIndex: 1,
    memoriesInJourney:
      options?.memoriesInJourney ?? (journeyMode === "filtered" ? 6 : 4),
    journeyMode,
  };
}

export function createSceneEntryVisualCandidateViewModel(
  options?: Parameters<typeof createSceneEntryVisualStubViewModel>[0],
): SceneEntryPresentationContract {
  return {
    viewModel: createSceneEntryVisualStubViewModel(options),
    presentationStatus: "preview_isolated",
  };
}
