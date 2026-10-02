import { buildOperationalDescriptionLlmSystemPrompt } from "@/features/significado/operational-description-canon";
import { OPERATIONAL_CYBERNETIC_COMPONENTS } from "@/features/significado/operational-description-cybernetic-components";
import type { OperationalDescriptionContext } from "./types.ts";

export type LlmCoachPromptInput = {
  draftText: string;
  context: OperationalDescriptionContext;
};

export function buildLlmCoachSystemPrompt() {
  return buildOperationalDescriptionLlmSystemPrompt();
}

export function buildLlmCoachUserPrompt(input: LlmCoachPromptInput) {
  const { draftText, context } = input;

  return JSON.stringify(
    {
      task:
        "Evalúa semánticamente el borrador B0-Q02 e indica el siguiente componente cibernético faltante.",
      user_draft: draftText,
      activity_context_minimal: {
        action_verb: context.actionVerb ?? null,
        input_or_object: context.inputOrObject ?? null,
        deliverable_hint: context.outputOrResult ?? null,
      },
      cybernetic_components: OPERATIONAL_CYBERNETIC_COMPONENTS.map((component) => ({
        id: component.id,
        canon_name: component.canonName,
        evaluation_hint: component.trincheraPrompt,
      })),
      do_not_echo_verbatim: context.activityTitle ?? null,
      writing_rules: [
        "Evalúa por significado, no por palabras clave exactas.",
        "Devuelve components_covered según lo que el borrador ya expresa.",
        "next_missing_component debe ser el primero faltante en orden cibernético.",
        "Para output_transduction exige receptor, canal o propósito de uso; no basta con decir que entregas el reporte.",
        "lead_message solo orienta el siguiente tramo; sin ejemplos entrecomillados.",
      ],
    },
    null,
    2,
  );
}
