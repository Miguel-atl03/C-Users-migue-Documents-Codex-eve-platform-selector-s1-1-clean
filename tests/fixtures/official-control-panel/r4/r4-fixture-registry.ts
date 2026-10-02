/**
 * R4 fixture registry — test infrastructure only (not methodological authority).
 * Literal scenarios: rector §22.
 */
export type R4FixtureId =
  | "FX-01"
  | "FX-02"
  | "FX-03"
  | "FX-04"
  | "FX-05"
  | "FX-06"
  | "FX-07"
  | "FX-08"
  | "FX-09"
  | "FX-10"
  | "FX-11"
  | "FX-12";

export type R4FixtureDefinition = {
  id: R4FixtureId;
  title: string;
  preconditions: string[];
  actors: string[];
  expectedFacts: string[];
  forbiddenOutcomes: string[];
  relatedCriteria: string[];
};

export const R4_FIXTURE_REGISTRY: readonly R4FixtureDefinition[] = [
  {
    id: "FX-01",
    title: "Empresa saludable",
    preconditions: [
      "1 caso test-only",
      "10 usuarios",
      "hitos H0-H2",
      "sin blockers",
    ],
    actors: ["consultor-a"],
    expectedFacts: [
      "contexto Empresa-Relación-Caso",
      "estado general derivado §17",
      "próximo evento factual",
      "ejes disponibles",
      "participantes visibles",
      "ausencia factual de alertas",
      "cero contradicciones KPI/workspace/drawer",
    ],
    forbiddenOutcomes: [
      "estado productivo healthy/saludable/normal/green",
      "porcentajes inventados",
      "contaminación Amber",
    ],
    relatedCriteria: ["CP-001", "CP-002", "CP-003", "CP-004", "A11Y-001"],
  },
  {
    id: "FX-02",
    title: "Usuario multirrol",
    preconditions: [
      "1 usuario físico",
      "2 o más role_runtime_session",
      "actividades separadas por sesión",
    ],
    actors: ["consultor-a", "participante-multirrol"],
    expectedFacts: [
      "una sola identidad física",
      "sesiones de rol separadas",
      "actividades asociadas a la sesión correcta",
      "runs no fusionados",
      "navegación Usuario → Rol → Actividad",
      "conteos factuales",
    ],
    forbiddenOutcomes: [
      "fusión de sesiones/actividades/runs bajo mismo userId",
    ],
    relatedCriteria: ["CP-007", "CP-008"],
  },
  {
    id: "FX-03",
    title: "Selección <=8",
    preconditions: [
      "actividades elegibles suficientes para non_competitive_inclusion",
      "todas elegibles dentro del límite",
    ],
    actors: ["consultor-a"],
    expectedFacts: [
      "non_competitive_inclusion",
      "todas elegibles",
      "selección versionada vía UI→BFF→RPC",
      "cobertura y lectura posterior",
    ],
    forbiddenOutcomes: ["inserción SQL de selección", "bypass BFF"],
    relatedCriteria: ["CP-009"],
  },
  {
    id: "FX-04",
    title: "Selección >8",
    preconditions: [
      "más de 8 actividades candidatas primarias",
      "política v1.3 vigente",
    ],
    actors: ["consultor-a"],
    expectedFacts: [
      "slots v1.3",
      "reasons",
      "non-primary context",
      "comportamiento factual del contrato vigente",
    ],
    forbiddenOutcomes: [
      "aceptar >8 silenciosamente",
      "truncar la lista",
      "seleccionar las primeras ocho",
      "fabricar manual review",
    ],
    relatedCriteria: ["CP-009"],
  },
  {
    id: "FX-05",
    title: "WorkMap coverage gap",
    preconditions: ["Usuario detenido antes de Significado"],
    actors: ["consultor-a", "usuario-operativo"],
    expectedFacts: [
      "gap factual",
      "actividad/rol afectado",
      "razón visible",
      "downstream readiness condicionado",
      "alerta correspondiente",
    ],
    forbiddenOutcomes: [
      "inventar actividad",
      "marcar cobertura completa",
    ],
    relatedCriteria: ["CP-011", "UX-004"],
  },
  {
    id: "FX-06",
    title: "Ruta B2 faltante",
    preconditions: [
      "evidencia textual de excepción de transformación sin cierre B2",
    ],
    actors: ["consultor-a"],
    expectedFacts: ["blocked_by_missing_canonical_route"],
    forbiddenOutcomes: [
      "clasificar automáticamente como contradicción MMABP",
      "derivar estructura desde texto libre",
      "estados no canónicos",
    ],
    relatedCriteria: ["CP-010"],
  },
  {
    id: "FX-07",
    title: "Feedback B3",
    preconditions: ["C09 abierta", "receiver_feedback separado"],
    actors: ["consultor-a"],
    expectedFacts: [
      "señal factual de aviso/devolución/rechazo/corrección/bloqueo",
      "separación satisfacción vs feedback operativo",
      "variables canónicas",
      "panel y Runtime consistentes",
    ],
    forbiddenOutcomes: [
      "inferir receiver_feedback desde satisfacción general",
    ],
    relatedCriteria: ["CP-010"],
  },
  {
    id: "FX-08",
    title: "P-SUP-03 manual",
    preconditions: ["ready_to_start → submitted → accepted vía flujo oficial"],
    actors: ["consultor-a", "consultor-b"],
    expectedFacts: [
      "ciclo completo auditado",
      "checksum",
      "idempotencia",
      "stale",
      "capability",
      "aislamiento A/B",
      "append-only",
    ],
    forbiddenOutcomes: ["segunda máquina de estados", "DML de transición"],
    relatedCriteria: ["CP-005", "CP-006", "SEC-001"],
  },
  {
    id: "FX-09",
    title: "P-SUP-06 rework",
    preconditions: [
      "ACA WithFindings",
      "finding factual",
      "paquete/versión",
      "rework P-SUP-06",
      "reevaluación iniciada y completada",
    ],
    actors: ["consultor-a"],
    expectedFacts: [
      "no resolución antes de reevaluación completada",
      "mismo caso/paquete/finding/versión",
      "historial continuo",
      "estado actual consistente",
    ],
    forbiddenOutcomes: [
      "nuevas reglas de Producción Paralela",
      "exportación durante finding bloqueante",
    ],
    relatedCriteria: ["CP-012"],
  },
  {
    id: "FX-10",
    title: "Export bloqueado",
    preconditions: ["ACA != Satisfied"],
    actors: ["consultor-a"],
    expectedFacts: [
      "exportación no disponible",
      "razón factual visible",
      "POST o RPC denegada",
    ],
    forbiddenOutcomes: [
      "confundir candidate_export_package con exportación final",
      "nuevos indicadores diagramáticos",
    ],
    relatedCriteria: ["CP-013", "CP-011"],
  },
  {
    id: "FX-11",
    title: "Experiencia soporte",
    preconditions: [
      "Usuario blocked",
      "mensaje + resume link",
      "capability explícita",
    ],
    actors: ["consultor-a", "consultor-b", "usuario-operativo"],
    expectedFacts: [
      "usuario y Consultor separados",
      "acción por RPC transaccional",
      "idempotencia",
      "readback",
      "aislamiento A/B",
      "soft-refresh",
    ],
    forbiddenOutcomes: [
      "eventos de producto mediante service_role",
      "route-fulfill mocks de auth/caps",
    ],
    relatedCriteria: ["UX-001", "UX-002", "UX-003", "UX-004", "SEC-001"],
  },
  {
    id: "FX-12",
    title: "Final alternativo",
    preconditions: [
      "ClosedWithoutSufficiency o Cancelled vía máquina existente",
    ],
    actors: ["consultor-a"],
    expectedFacts: [
      "transición válida",
      "causa factual",
      "estado final canónico",
      "KPI/workspace/drawer consistentes",
      "acciones posteriores bloqueadas cuando corresponda",
    ],
    forbiddenOutcomes: [
      "nuevo final inventado",
      "confundir con error técnico o abandono visual",
    ],
    relatedCriteria: ["CP-001"],
  },
] as const;

export function getR4Fixture(id: R4FixtureId): R4FixtureDefinition {
  const hit = R4_FIXTURE_REGISTRY.find((f) => f.id === id);
  if (!hit) throw new Error(`unknown_r4_fixture:${id}`);
  return hit;
}
