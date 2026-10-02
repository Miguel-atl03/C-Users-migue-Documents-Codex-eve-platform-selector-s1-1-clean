/**
 * Componentes cibernéticos Beer-Espejo / ASRO v2 para evaluación semántica del coach.
 * Orden narrativo obligatorio para detectar el siguiente tramo faltante.
 */

export type OperationalCyberneticComponentId =
  | "input_transduction"
  | "transformation_algorithm"
  | "variety_attenuation"
  | "impact_amplification"
  | "output_transduction";

export type OperationalCyberneticComponent = {
  id: OperationalCyberneticComponentId;
  canonName: string;
  asroSection: string;
  trincheraPrompt: string;
};

export const OPERATIONAL_CYBERNETIC_COMPONENT_ORDER: OperationalCyberneticComponentId[] =
  [
    "input_transduction",
    "transformation_algorithm",
    "variety_attenuation",
    "impact_amplification",
    "output_transduction",
  ];

export const OPERATIONAL_CYBERNETIC_COMPONENTS: OperationalCyberneticComponent[] =
  [
    {
      id: "input_transduction",
      canonName: "Transducción de Entrada",
      asroSection: "§2.1 Disparador y transducción de entrada",
      trincheraPrompt:
        "Cuenta qué situación o insumo te dispara a empezar y qué condición debe cumplir para arrancar.",
    },
    {
      id: "transformation_algorithm",
      canonName: "Algoritmo de Transformación",
      asroSection: "§2.2 Caja negra / hacer técnico",
      trincheraPrompt:
        "Ya se entiende el arranque; ahora explica qué haces técnicamente con esa información para cambiar su estado.",
    },
    {
      id: "variety_attenuation",
      canonName: "Atenuación de Variedad",
      asroSection: "§2.3 Atenuación explícita",
      trincheraPrompt:
        "Siguiente tramo: menciona qué priorizas, qué dejas fuera o qué no atiendes para no saturarte.",
    },
    {
      id: "impact_amplification",
      canonName: "Amplificación de Impacto",
      asroSection: "§2.4 Estado final del objeto",
      trincheraPrompt:
        "Falta dejar claro qué entregable o estado final produces y qué valor aporta ese resultado.",
    },
    {
      id: "output_transduction",
      canonName: "Transducción de Salida (Handoff)",
      asroSection: "§2.4 Protocolo de handoff",
      trincheraPrompt:
        "Para cerrar el relato, indica quién recibe el resultado, por qué canal y para qué lo usa el siguiente eslabón.",
    },
  ];

export function getCyberneticComponentById(
  id: OperationalCyberneticComponentId,
) {
  return OPERATIONAL_CYBERNETIC_COMPONENTS.find((component) => component.id === id);
}

export function isOperationalCyberneticComponentId(
  value: string,
): value is OperationalCyberneticComponentId {
  return OPERATIONAL_CYBERNETIC_COMPONENT_ORDER.includes(
    value as OperationalCyberneticComponentId,
  );
}
