import type { ClientContextPresentation } from "../types/client-context.types";

export function presentClientContext(input: {
  companyLabel?: string | null;
  relationshipLabel?: string | null;
  caseLabel?: string | null;
  currentStatusLabel?: string | null;
}): ClientContextPresentation {
  return {
    companyLabel: input.companyLabel ?? "Sin empresa seleccionada",
    relationshipLabel: input.relationshipLabel ?? "No disponible",
    caseLabel: input.caseLabel ?? "No disponible",
    currentStatusLabel: input.currentStatusLabel ?? "No disponible",
    nextStepLabel: "No disponible",
    participationLabel: "Sin datos",
    attentionLabel: "No disponible",
  };
}
