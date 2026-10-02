import type { RuntimeInteractionViewModel } from "@/domain/runtime-interaction-view-model";
import { RUNTIME_BLOCK0_CATALOG_SNAPSHOT } from "@/features/runtime/block0-catalog-snapshot";

function cloneInteraction(
  interaction: RuntimeInteractionViewModel,
): RuntimeInteractionViewModel {
  return {
    ...interaction,
    subfields: interaction.subfields.map((subfield) => ({ ...subfield })),
    options: interaction.options?.map((option) => ({ ...option })),
    canonicalVariables: [...interaction.canonicalVariables],
    requiredVariables: [...interaction.requiredVariables],
    optionalVariables: [...interaction.optionalVariables],
    derivedVariables: [...interaction.derivedVariables],
    sourceCodes: [...interaction.sourceCodes],
    sourceNodes: [...interaction.sourceNodes],
    sourceSheetRefs: interaction.sourceSheetRefs.map((sourceSheetRef) => ({
      ...sourceSheetRef,
      sourceColumns: [...sourceSheetRef.sourceColumns],
    })),
  };
}

export function getRuntimeBlock0InteractionViewModels(): RuntimeInteractionViewModel[] {
  return [...RUNTIME_BLOCK0_CATALOG_SNAPSHOT]
    .sort((left, right) => left.runtimeOrder - right.runtimeOrder)
    .map(cloneInteraction);
}

export function getRuntimeBlock0InteractionById(
  id: string,
): RuntimeInteractionViewModel | undefined {
  const interaction = RUNTIME_BLOCK0_CATALOG_SNAPSHOT.find(
    (candidate) => candidate.runtimeInteractionId === id,
  );

  return interaction ? cloneInteraction(interaction) : undefined;
}
