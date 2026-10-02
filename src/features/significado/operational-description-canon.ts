/**
 * Canon operativo B0-Q02 — fuente: Descripción_Operativa_cerebro AI.docx (ASRO v2).
 * UI: destilación pedagógica de §2.1–2.4. LLM: cerebro completo §2 + §4.
 */

import {
  OPERATIONAL_CYBERNETIC_COMPONENTS,
  OPERATIONAL_CYBERNETIC_COMPONENT_ORDER,
} from "@/features/significado/operational-description-cybernetic-components";

export {
  OPERATIONAL_CYBERNETIC_COMPONENTS,
  OPERATIONAL_CYBERNETIC_COMPONENT_ORDER,
} from "@/features/significado/operational-description-cybernetic-components";
export type { OperationalCyberneticComponentId } from "@/features/significado/operational-description-cybernetic-components";

export const OPERATIONAL_DESCRIPTION_CANON_SOURCE = {
  document: "Descripción_Operativa_cerebro AI.docx",
  path: "docs/significado/canon/Descripción_Operativa_cerebro AI.docx",
  version: "asro-v2",
} as const;

export type OperationalDescriptionPathStepId =
  | "trigger"
  | "transform"
  | "attenuation"
  | "output"
  | "handoff";

export type OperationalDescriptionPathStep = {
  id: OperationalDescriptionPathStepId;
  label: string;
  shortLabel: string;
  hint: string;
  asroSection: string;
};

export const OPERATIONAL_DESCRIPTION_PATH_STEPS: OperationalDescriptionPathStep[] =
  [
    {
      id: "trigger",
      label: "Cuándo empiezas esta actividad",
      shortLabel: "Inicio",
      hint: "qué tiene que estar listo o qué situación te dispara",
      asroSection: "2.1 Disparador (Trigger Logic)",
    },
    {
      id: "transform",
      label: "Qué haces con la información",
      shortLabel: "Proceso",
      hint: "cómo la revisas, comparas o transformas",
      asroSection: "2.2 Transformación (Caja negra)",
    },
    {
      id: "attenuation",
      label: "Qué priorizas o qué dejas fuera",
      shortLabel: "Filtro",
      hint: "si hay algo que no atiendes, filtras o descartas",
      asroSection: "2.3 Atenuación",
    },
    {
      id: "output",
      label: "Qué dejas listo",
      shortLabel: "Entregable",
      hint: "el entregable concreto cuando terminas este paso",
      asroSection: "2.4 Estado final del objeto",
    },
    {
      id: "handoff",
      label: "Quién lo usa después",
      shortLabel: "Handoff",
      hint: "si pasa a otra persona, área o sistema",
      asroSection: "2.4 Transducción de salida",
    },
  ];

export const OPERATIONAL_DESCRIPTION_UI = {
  promptLead:
    "Cuéntanos cómo se desarrolla la actividad en la práctica real. Intenta mostrarnos:",
  textareaPlaceholder: "Escribe aquí",
  pathCompleteMessage:
    "Relato operativo completo. Puedes seguir afinando la redacción o continuar.",
  introContrastLead:
    "Aquí cuentas cómo ocurre en la práctica — no qué haces, sino el recorrido paso a paso.",
  exampleAsideLabel: "Ejemplo",
  exampleLead: "Ejemplo con tu actividad (guía, no respuesta literal):",
} as const;

export const OPERATIONAL_DESCRIPTION_NARRATIVE_FIELD_LABELS: Record<
  OperationalDescriptionPathStepId,
  string
> = {
  trigger: "cuándo empiezas esta actividad",
  transform: "qué haces con la información",
  attenuation: "qué priorizas o qué dejas fuera",
  output: "qué dejas listo",
  handoff: "quién lo usa después",
};

export const OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH = 8;

/**
 * Cerebro LLM — §2 Agregaciones ASRO v2 + §4 Prueba de homeostasis.
 * No copiar literalmente a la UI; solo orienta al modelo.
 */

export const OPERATIONAL_DESCRIPTION_LLM_BRAIN = `
Marco Beer-Espejo: la descripción operativa es un relato de transformación cibernética (estado A → estado B), no repetir la actividad ni un manual de pasos.

Evalúa el borrador del usuario de forma SEMÁNTICA. No dependas de palabras exactas: "cotejo" = comparar, "erogaciones" = gastos, "presupuesto autorizado" = proyección, etc.

Componentes cibernéticos en orden narrativo (evalúa cuáles YA están cubiertos en el borrador):
${OPERATIONAL_CYBERNETIC_COMPONENTS.map(
  (component, index) =>
    `${index + 1}. ${component.id} (${component.canonName}): ${component.trincheraPrompt}`,
).join("\n")}

Reglas de evaluación:
- Un componente está cubierto si el borrador lo expresa con claridad suficiente, aunque use vocabulario distinto.
- input_transduction: evento disparador + insumo/condición de arranque.
- transformation_algorithm: hacer técnico que transforma el objeto (comparar, cotejar, validar, calcular, clasificar…).
- variety_attenuation: qué filtra, descarta, prioriza o no atiende.
- impact_amplification: entregable o estado final con valor (reporte, análisis, validación, archivo listo…).
- output_transduction: receptor explícito, canal de entrega y para qué usa el resultado el siguiente eslabón. NO marques cubierto si solo dice "entrego el reporte" sin decir quién lo recibe, por qué canal o para qué lo usa.

Reglas de coaching:
- El usuario ya confirmó la actividad en B0-Q01. NO repitas ni parafrasees la actividad completa.
- Ancla brevemente en lo que el usuario ya escribió, sin citar toda la frase.
- Indica SOLO el siguiente componente faltante según el orden anterior.
- Usa lenguaje de trinchera, cercano y concreto.
- NO uses jerga de consultoría (VSM, MMABP, homeostasis, transducción, Sistema 1/3) en el mensaje al usuario.
- NO incluyas ejemplos entrecomillados ni fragmentos listos para copiar.
- NO inventes sistemas, áreas ni personas que no estén en el borrador o contexto mínimo.
- Si los cinco componentes ya están cubiertos, devuelve lead_message vacío y next_missing_component null.
`.trim();

export function buildOperationalDescriptionLlmSystemPrompt() {
  return [
    "Eres el evaluador-coach de EVE para B0-Q02 (descripción operativa).",
    OPERATIONAL_DESCRIPTION_LLM_BRAIN,
    "Responde SOLO JSON válido con esta forma:",
    JSON.stringify({
      components_covered: OPERATIONAL_CYBERNETIC_COMPONENT_ORDER,
      next_missing_component: "input_transduction|null",
      lead_message: "string",
      confidence: "high|medium",
    }),
    "components_covered: lista de ids de componentes ya presentes en el borrador.",
    `next_missing_component: el primer componente faltante en orden (${OPERATIONAL_CYBERNETIC_COMPONENT_ORDER.join(" → ")}), o null si el relato cierra.`,
    "lead_message: una sola orientación en trinchera (máximo 220 caracteres), sin comillas ni 'Por ejemplo'.",
    "Si el relato ya cierra, lead_message vacío y next_missing_component null.",
  ].join(" ");
}
