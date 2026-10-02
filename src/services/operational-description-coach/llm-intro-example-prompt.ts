import {
  buildOperationalDescriptionLlmSystemPrompt,
  OPERATIONAL_DESCRIPTION_PATH_STEPS,
  OPERATIONAL_DESCRIPTION_UI,
} from "@/features/significado/operational-description-canon";
import type { OperationalDescriptionContext } from "./types.ts";

export function buildLlmIntroExampleSystemPrompt() {
  return [
    buildOperationalDescriptionLlmSystemPrompt().replace(
      "coach de redacción",
      "generador de ejemplo pedagógico",
    ),
    "Tu tarea NO es coachar un borrador. Debes generar UN ejemplo de descripción operativa que enseñe el recorrido correcto.",
    "El ejemplo es guía pedagógica: NO es la respuesta que el usuario debe copiar.",
    "Debe recorrer en prosa los cinco campos pedagógicos en orden natural.",
    "Usa solo elementos del contexto de actividad confirmada; no inventes sistemas ni personas nuevas.",
    "Responde SOLO JSON válido:",
    '{"example_narrative":"string","confidence":"high|medium"}',
    "example_narrative: un párrafo corto (máximo 380 caracteres), lenguaje de trinchera.",
  ].join(" ");
}

export function buildLlmIntroExampleUserPrompt(
  context: OperationalDescriptionContext,
  deterministicFallback: string,
) {
  return JSON.stringify(
    {
      task:
        "Genera un ejemplo pedagógico de descripción operativa para B0-Q02 usando la actividad ya confirmada.",
      pedagogical_path_steps: OPERATIONAL_DESCRIPTION_PATH_STEPS.map((step) => ({
        id: step.id,
        label: step.label,
        hint: step.hint,
      })),
      activity_context: {
        activity_title: context.activityTitle ?? null,
        action_verb: context.actionVerb ?? null,
        input_or_object: context.inputOrObject ?? null,
        procedure_or_standard: context.procedureOrStandard ?? null,
        deliverable_hint: context.outputOrResult ?? null,
      },
      do_not_echo_verbatim: context.activityTitle ?? null,
      deterministic_fallback: deterministicFallback,
      example_lead: OPERATIONAL_DESCRIPTION_UI.exampleLead,
      writing_rules: [
        "No repitas la actividad de B0-Q01 palabra por palabra.",
        "Muestra el recorrido: cuándo empiezas → qué haces → qué filtras → qué dejas listo → quién lo usa.",
        "Usa el deterministic_fallback solo como referencia de estructura, mejora naturalidad si puedes.",
      ],
    },
    null,
    2,
  );
}
