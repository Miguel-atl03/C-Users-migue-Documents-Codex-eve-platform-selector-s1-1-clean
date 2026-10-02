/**
 * Local non-productive fixture: Cervecería Ámbar Ancestral.
 * Derived from Perfiles_Roles_Funcionales_Cerveceria_Ambar_Ancestral_EVE.docx (simulated).
 * Never activates in production. No Supabase. No real PII.
 */

import type {
  ConsultantControlPanelRole,
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ManualActionKind,
  ManualControlAvailability,
  OperationalTraceEvent,
  QuestionBlockStatus,
  RuntimeBlockCoverageBlockInRun,
  RuntimeBlockCoverageByRun,
  RuntimeBudget4020Summary,
  RuntimeBudgetByRunItem,
  SceneCandidateByRun,
} from "../consultant-control-panel-types";
import {
  buildDownloadsWithSupMapping,
  buildSupFinalObjectsBackbone,
  SUP_EVENT_TO_OBJECT_LINKS,
} from "../sup-final-objects-backbone";
import {
  aggregateAmbarBaseResolutionGate,
  aggregateAmbarCausalClosureGate,
  buildAmbarBaseResolutionByRun,
  buildAmbarCausalClosureByRun,
  OPERATIONAL_SUFFICIENCY_NOTE,
} from "./ambar-runtime-4020-operational-ledgers";
import { RUNTIME_40_20_OPERATIONAL_RULES_VERSION } from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";

export const AMBAR_FIXTURE_ENV_VALUE = "cerveceria_ambar_ancestral";
export const AMBAR_FIXTURE_QUERY_VALUE = "ambar";

export const AMBAR_CLIENT_COMPANY_ID = "client-ambar-ancestral-001";
export const AMBAR_CASE_ID = "case-ambar-ancestral-diagnostico-001";

const FIXTURE_NOW = "2026-07-10T18:00:00.000Z";
const TS_RECENT = "2026-07-10T16:42:00.000Z";
const TS_MEDIUM = "2026-07-09T14:15:00.000Z";
const TS_OLD = "2026-07-05T11:20:00.000Z";

const AUDITED_ENDPOINT_REASON = "Requiere endpoint auditado";

const EMPTY_FILTERS: ControlPanelFilterScope = {
  client_company_id: null,
  case_id: null,
  user_id: null,
  role_id: null,
  role_runtime_session_id: null,
  activity_id: null,
  run_id: null,
  event_type: null,
  gate_code: null,
  status: null,
  view: null,
  runtime_view_scope: null,
};

type FixtureBlock = {
  blockId: string;
  title: string;
  status: QuestionBlockStatus;
  currentQuestion: string | null;
  pendingQuestions: string[];
  incompleteAnswers: string[];
  errorsOrBlockers: string[];
  lastInteractionAt: string;
};

type FixtureActivity = {
  id: string;
  label: string;
};

type FixtureUser = {
  id: string;
  name: string;
  roleId: string;
  role: string;
  rolePurpose: string;
  progressPct: number;
  activities: FixtureActivity[];
  blocks: FixtureBlock[];
  currentActivityId: string;
  currentBlockId: string;
  blockers: string[];
  lastActivityAt: string;
};

function buildManualControls(): ManualControlAvailability[] {
  const actions: ManualActionKind[] = [
    "continue_block",
    "restart_block",
    "reopen_block",
    "set_questions_manually",
    "select_activity_manually",
    "mark_for_review",
    "request_reentry",
  ];
  return actions.map((action) => ({
    action,
    enabled: false,
    reason_if_disabled: AUDITED_ENDPOINT_REASON,
    requires_justification: true,
    requires_audit_trail: true,
  }));
}

const VENDEDOR_ACTIVITIES: FixtureActivity[] = [
  {
    id: "act-a1",
    label: "A1 Captura requerimientos del cliente en ERP para generar Pedido [Solicitado]",
  },
  {
    id: "act-a2",
    label: "A2 Consulta disponibilidad aplicando FIFO para producir Confirmación de Existencias",
  },
  {
    id: "act-a3",
    label: "A3 Prepara cotización comercial para emitir Cotización [Presentada]",
  },
  {
    id: "act-a4",
    label:
      "A4 Revisa estado de cuenta y límite disponible para generar Dictamen Comercial [Elegible] o Solicitud de Excepción Crediticia",
  },
  {
    id: "act-a5",
    label: "A5 Documenta términos aceptados para producir Acuerdo Comercial [Firmado]",
  },
  {
    id: "act-a6",
    label: "A6 Registra preferencias y restricciones en CRM para generar Perfil de Cliente [Actualizado]",
  },
  {
    id: "act-a7",
    label: "A7 Comunica excepciones a Producción para producir Solicitud de Ajuste de Producción",
  },
  {
    id: "act-a8",
    label: "A8 Consolida retroalimentación comercial para entregar Reporte de Tendencias",
  },
];

/** Máximo de actividades primarias asignadas por rol funcional. */
const PRIMARY_ACTIVITIES_MAX = 8;

const PRODUCCION_ACTIVITIES: FixtureActivity[] = [
  {
    id: "act-b1",
    label:
      "B1 Consolida pedidos confirmados, inventario y capacidad para emitir Programa Semanal de Producción",
  },
  {
    id: "act-b2",
    label: "B2 Reserva insumos aplicando FIFO/FEFO para generar Kit de Materiales [Asignado]",
  },
  {
    id: "act-b3",
    label: "B3 Sanitiza equipos por CIP para producir Equipo [Liberado]",
  },
  {
    id: "act-b4",
    label: "B4 Muele y dosifica materias primas para preparar Carga [Dosificada]",
  },
  {
    id: "act-b5",
    label:
      "B5 Ejecuta maceración, filtración, cocción y lupulado para producir Mosto [Cocido]",
  },
  {
    id: "act-b6",
    label: "B6 Enfría y transfiere mosto para generar Fermentador [Cargado]",
  },
  {
    id: "act-b7",
    label: "B7 Inocula levadura y registra parámetros para producir Lote [Fermentando]",
  },
  {
    id: "act-b8",
    label: "B8 Registra temperatura/densidad diaria para generar Bitácora de Fermentación",
  },
  {
    id: "act-b9",
    label: "B9 Trasiega, madura y acondiciona para producir Cerveza [Madura]",
  },
  {
    id: "act-b10",
    label:
      "B10 Envasa, etiqueta y documenta pruebas finales para registrar Lote [Liberado] o [Retenido]",
  },
];

const LOGISTICA_ACTIVITIES: FixtureActivity[] = [
  {
    id: "act-c1",
    label:
      "C1 Consolida expedientes liberados, lotes y ventanas para emitir Plan Diario de Despacho",
  },
  {
    id: "act-c2",
    label:
      "C2 Asigna lotes y cantidades aplicando FIFO y reservas para generar Lista de Surtido [Emitida]",
  },
  {
    id: "act-c3",
    label:
      "C3 Mide temperatura de cava/producto/transporte para producir Registro de Condición [Conforme] o [Desviación]",
  },
  {
    id: "act-c4",
    label: "C4 Coteja unidades contra Lista de Surtido para generar Pedido [Preparado]",
  },
  {
    id: "act-c5",
    label:
      "C5 Revisa acuerdo, dictamen, lote y temperatura para producir Expediente de Despacho [Validado]",
  },
  {
    id: "act-c6",
    label: "C6 Empaca y etiqueta pedido para generar Unidad de Envío [Sellada]",
  },
  {
    id: "act-c7",
    label: "C7 Asigna ruta, transportista y horario para emitir Orden de Entrega [Asignada]",
  },
  {
    id: "act-c8",
    label: "C8 Registra salida, temperatura y custodia para cambiar Pedido a [Despachado]",
  },
  {
    id: "act-c9",
    label:
      "C9 Monitorea ruta y documenta desviaciones para generar Incidencia Logística o ETA actualizada",
  },
  {
    id: "act-c10",
    label:
      "C10 Recopila prueba de entrega para registrar Pedido [Entregado] o [Excepción de Entrega]",
  },
];

const FIXTURE_USERS: FixtureUser[] = [
  {
    id: "user-ambar-vendedor-001",
    name: "Usuario Simulado Ventas",
    roleId: "role-vendedor",
    role: "Vendedor",
    rolePurpose:
      "Convertir necesidades verificadas del mercado en pedidos comercialmente válidos y operativamente realizables, sin comprometer capacidad, inventario, cadena de frío ni rentabilidad.",
    progressPct: 78,
    activities: VENDEDOR_ACTIVITIES.slice(0, PRIMARY_ACTIVITIES_MAX),
    currentActivityId: "act-a4",
    currentBlockId: "BV-03",
    blockers: ["Solicitud de excepción crediticia requiere escalamiento"],
    lastActivityAt: TS_RECENT,
    blocks: [
      {
        blockId: "BV-01",
        title: "BV-01 Captación de demanda",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-08T10:00:00.000Z",
      },
      {
        blockId: "BV-02",
        title: "BV-02 Validación de inventario/capacidad",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-09T09:30:00.000Z",
      },
      {
        blockId: "BV-03",
        title: "BV-03 Condición comercial y crédito",
        status: "pending_review",
        currentQuestion: "¿La excepción crediticia quedó escalada y documentada?",
        pendingQuestions: [
          "¿Quién autoriza la excepción crediticia?",
          "¿Qué evidencia de límite disponible se adjuntó?",
        ],
        incompleteAnswers: ["Dictamen comercial sin ruta de excepción cerrada"],
        errorsOrBlockers: ["Solicitud de excepción crediticia requiere escalamiento"],
        lastInteractionAt: TS_RECENT,
      },
      {
        blockId: "BV-04",
        title: "BV-04 Cierre y liberación a operaciones",
        status: "in_progress",
        currentQuestion: "¿El expediente comercial está listo para liberar a operaciones?",
        pendingQuestions: ["¿Acuerdo comercial firmado está adjunto?"],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-10T12:00:00.000Z",
      },
      {
        blockId: "BV-05",
        title: "BV-05 Excepciones y retroalimentación de mercado",
        status: "pending_review",
        currentQuestion: null,
        pendingQuestions: ["¿Qué tendencia de demanda premium se reportó?"],
        incompleteAnswers: ["Reporte de tendencias incompleto"],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-07T16:00:00.000Z",
      },
    ],
  },
  {
    id: "user-ambar-produccion-001",
    name: "Usuario Simulado Producción",
    roleId: "role-produccion",
    role: "Responsable de Producción Cervecera",
    rolePurpose:
      "Transformar demanda confirmada e insumos liberados en cerveza terminada conforme a receta, capacidad instalada y estándar sensorial.",
    progressPct: 62,
    activities: PRODUCCION_ACTIVITIES.slice(0, PRIMARY_ACTIVITIES_MAX),
    currentActivityId: "act-b1",
    currentBlockId: "BP-04",
    blockers: ["Capacidad de fermentación no confirmada contra pedidos ajustados"],
    lastActivityAt: TS_MEDIUM,
    blocks: [
      {
        blockId: "BP-01",
        title: "BP-01 Programa semanal y capacidad",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-07T08:00:00.000Z",
      },
      {
        blockId: "BP-02",
        title: "BP-02 Insumos y kit de materiales",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-08T11:00:00.000Z",
      },
      {
        blockId: "BP-03",
        title: "BP-03 Preparación sanitaria",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-08T15:00:00.000Z",
      },
      {
        blockId: "BP-04",
        title: "BP-04 Cocción y fermentación",
        status: "in_progress",
        currentQuestion: "¿La capacidad de fermentación cubre los pedidos ajustados?",
        pendingQuestions: [
          "¿Qué fermentadores quedan libres esta semana?",
          "¿Se registró la inoculación del lote en curso?",
        ],
        incompleteAnswers: ["Confirmación de capacidad vs pedidos ajustados"],
        errorsOrBlockers: ["Capacidad de fermentación no confirmada contra pedidos ajustados"],
        lastInteractionAt: TS_MEDIUM,
      },
      {
        blockId: "BP-05",
        title: "BP-05 Maduración, envasado y liberación de lote",
        status: "pending_review",
        currentQuestion: null,
        pendingQuestions: ["¿Pruebas finales del lote están documentadas?"],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-06T17:00:00.000Z",
      },
    ],
  },
  {
    id: "user-ambar-logistica-001",
    name: "Usuario Simulado Operaciones",
    roleId: "role-logistica",
    role: "Coordinador de Operaciones y Logística",
    rolePurpose:
      "Convertir pedidos comercialmente liberados y lotes aptos en entregas verificables, preservando inventario, trazabilidad y condiciones de conservación.",
    progressPct: 41,
    activities: LOGISTICA_ACTIVITIES.slice(0, PRIMARY_ACTIVITIES_MAX),
    currentActivityId: "act-c3",
    currentBlockId: "BL-02",
    blockers: ["Registro de cadena de frío con desviación"],
    lastActivityAt: TS_OLD,
    blocks: [
      {
        blockId: "BL-01",
        title: "BL-01 Plan diario de despacho",
        status: "completed",
        currentQuestion: null,
        pendingQuestions: [],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-04T09:00:00.000Z",
      },
      {
        blockId: "BL-02",
        title: "BL-02 Surtido y cadena de frío",
        status: "blocked",
        currentQuestion: "¿La desviación de temperatura quedó contenida y documentada?",
        pendingQuestions: [
          "¿Qué lote presentó desviación de cadena de frío?",
          "¿Se midió temperatura de cava, producto y transporte?",
        ],
        incompleteAnswers: ["Registro de condición con desviación sin cierre"],
        errorsOrBlockers: ["Registro de cadena de frío con desviación"],
        lastInteractionAt: TS_OLD,
      },
      {
        blockId: "BL-03",
        title: "BL-03 Validación de despacho",
        status: "pending_review",
        currentQuestion: null,
        pendingQuestions: ["¿Expediente de despacho validado?"],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-03T13:00:00.000Z",
      },
      {
        blockId: "BL-04",
        title: "BL-04 Ruta y entrega",
        status: "pending_review",
        currentQuestion: null,
        pendingQuestions: ["¿Orden de entrega asignada?"],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-02T10:00:00.000Z",
      },
      {
        blockId: "BL-05",
        title: "BL-05 Incidencias y cierre operativo",
        status: "pending_review",
        currentQuestion: null,
        pendingQuestions: ["¿Prueba de entrega recopilada?"],
        incompleteAnswers: [],
        errorsOrBlockers: [],
        lastInteractionAt: "2026-07-01T18:00:00.000Z",
      },
    ],
  },
];

function buildTraceEvents(): OperationalTraceEvent[] {
  const ventas: OperationalTraceEvent[] = [
    {
      event_id: "evt-v-01",
      occurred_at: "2026-07-10T15:00:00.000Z",
      event_type: "user_answer_received",
      causal_step: "user_input",
      summary:
        "Usuario Ventas responde sobre promesas comerciales y pedidos solicitados en ERP.",
      actor_ref: "actor-vendedor",
      scene_ref: null,
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "received",
    },
    {
      event_id: "evt-v-02",
      occurred_at: "2026-07-10T15:05:00.000Z",
      event_type: "actor_candidate_created",
      causal_step: "actor_scene",
      summary: "Actor candidato creado: Vendedor.",
      actor_ref: "actor-vendedor",
      scene_ref: null,
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-03",
      occurred_at: "2026-07-10T15:08:00.000Z",
      event_type: "scene_candidate_created",
      causal_step: "actor_scene",
      summary: "Escena: negociación comercial con cliente premium.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-04",
      occurred_at: "2026-07-10T15:12:00.000Z",
      event_type: "client_company_transduction_created",
      causal_step: "transduction",
      summary:
        "Transducción hacia empresa: demanda captada puede exceder capacidad productiva.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-05",
      occurred_at: "2026-07-10T15:15:00.000Z",
      event_type: "subfield_response_created",
      causal_step: "client_company",
      summary: "Subcampo: inventario / capacidad / cadena de frío.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-06",
      occurred_at: "2026-07-10T15:18:00.000Z",
      event_type: "evidence_item_created",
      causal_step: "evidence",
      summary: "Evidencia: pedido solicitado + confirmación de existencias incompleta.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-07",
      occurred_at: "2026-07-10T15:22:00.000Z",
      event_type: "canonical_variable_created",
      causal_step: "variable_or_gap",
      summary: "Variable canónica: capacidad comprometible.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-v-08",
      occurred_at: "2026-07-10T15:25:00.000Z",
      event_type: "readiness_gap_created",
      causal_step: "variable_or_gap",
      summary: "Gap: promesa comercial sin evidencia plena de capacidad.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "open",
    },
    {
      event_id: "evt-v-09",
      occurred_at: "2026-07-10T15:30:00.000Z",
      event_type: "gate_b3_c09_checked",
      causal_step: "gate_or_readiness",
      summary: "Gate B3/C09: evidencia/ruta no completa para excepción crediticia.",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: "B3/C09",
      status: "warning",
    },
    {
      event_id: "evt-v-10",
      occurred_at: "2026-07-10T15:35:00.000Z",
      event_type: "readiness_decision_updated",
      causal_step: "gate_or_readiness",
      summary: "Readiness actualizado a ready_with_flags (excepción crediticia pendiente).",
      actor_ref: "actor-vendedor",
      scene_ref: "scene-negociacion-premium",
      run_id: "run-ambar-ventas-001",
      gate_code: null,
      status: "ready_with_flags",
    },
  ];

  const produccion: OperationalTraceEvent[] = [
    {
      event_id: "evt-p-01",
      occurred_at: "2026-07-09T12:00:00.000Z",
      event_type: "user_answer_received",
      causal_step: "user_input",
      summary:
        "Usuario Producción responde sobre programa semanal y carga de fermentadores.",
      actor_ref: "actor-produccion",
      scene_ref: null,
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "received",
    },
    {
      event_id: "evt-p-02",
      occurred_at: "2026-07-09T12:05:00.000Z",
      event_type: "actor_candidate_created",
      causal_step: "actor_scene",
      summary: "Actor candidato creado: Responsable de Producción Cervecera.",
      actor_ref: "actor-produccion",
      scene_ref: null,
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-03",
      occurred_at: "2026-07-09T12:08:00.000Z",
      event_type: "scene_candidate_created",
      causal_step: "actor_scene",
      summary: "Escena: cocción y fermentación bajo pedidos ajustados.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-04",
      occurred_at: "2026-07-09T12:12:00.000Z",
      event_type: "client_company_transduction_created",
      causal_step: "transduction",
      summary:
        "Transducción hacia empresa: capacidad de fermentación no confirmada contra demanda comercial.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-05",
      occurred_at: "2026-07-09T12:15:00.000Z",
      event_type: "subfield_response_created",
      causal_step: "client_company",
      summary: "Subcampo: capacidad instalada / kit de materiales / bitácora de fermentación.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-06",
      occurred_at: "2026-07-09T12:18:00.000Z",
      event_type: "evidence_item_created",
      causal_step: "evidence",
      summary: "Evidencia: programa semanal + fermentadores sin confirmación cruzada.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-07",
      occurred_at: "2026-07-09T12:22:00.000Z",
      event_type: "canonical_variable_created",
      causal_step: "variable_or_gap",
      summary: "Variable canónica: capacidad de fermentación disponible.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-p-08",
      occurred_at: "2026-07-09T12:25:00.000Z",
      event_type: "readiness_gap_created",
      causal_step: "variable_or_gap",
      summary: "Gap: capacidad de fermentación no confirmada contra pedidos ajustados.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "open",
    },
    {
      event_id: "evt-p-09",
      occurred_at: "2026-07-09T12:30:00.000Z",
      event_type: "gate_b3_c09_checked",
      causal_step: "gate_or_readiness",
      summary: "Gate B3/C09: evidencia incompleta en cocción/fermentación.",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: "B3/C09",
      status: "warning",
    },
    {
      event_id: "evt-p-10",
      occurred_at: "2026-07-09T12:35:00.000Z",
      event_type: "readiness_decision_updated",
      causal_step: "gate_or_readiness",
      summary: "Readiness mantiene ready_with_flags (capacidad no confirmada).",
      actor_ref: "actor-produccion",
      scene_ref: "scene-fermentacion",
      run_id: "run-ambar-produccion-001",
      gate_code: null,
      status: "ready_with_flags",
    },
  ];

  const logistica: OperationalTraceEvent[] = [
    {
      event_id: "evt-l-01",
      occurred_at: "2026-07-05T10:00:00.000Z",
      event_type: "user_answer_received",
      causal_step: "user_input",
      summary: "Usuario Operaciones responde sobre surtido y medición de cadena de frío.",
      actor_ref: "actor-logistica",
      scene_ref: null,
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "received",
    },
    {
      event_id: "evt-l-02",
      occurred_at: "2026-07-05T10:05:00.000Z",
      event_type: "actor_candidate_created",
      causal_step: "actor_scene",
      summary: "Actor candidato creado: Coordinador de Operaciones y Logística.",
      actor_ref: "actor-logistica",
      scene_ref: null,
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-03",
      occurred_at: "2026-07-05T10:08:00.000Z",
      event_type: "scene_candidate_created",
      causal_step: "actor_scene",
      summary: "Escena: despacho con desviación de temperatura en cava/transporte.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-04",
      occurred_at: "2026-07-05T10:12:00.000Z",
      event_type: "client_company_transduction_created",
      causal_step: "transduction",
      summary:
        "Transducción hacia empresa: desviación de cadena de frío bloquea liberación de entrega.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-05",
      occurred_at: "2026-07-05T10:15:00.000Z",
      event_type: "subfield_response_created",
      causal_step: "client_company",
      summary: "Subcampo: lista de surtido / registro de condición / custodia.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-06",
      occurred_at: "2026-07-05T10:18:00.000Z",
      event_type: "evidence_item_created",
      causal_step: "evidence",
      summary: "Evidencia: Registro de Condición [Desviación] sin cierre operativo.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-07",
      occurred_at: "2026-07-05T10:22:00.000Z",
      event_type: "canonical_variable_created",
      causal_step: "variable_or_gap",
      summary: "Variable canónica: integridad de cadena de frío.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "created",
    },
    {
      event_id: "evt-l-08",
      occurred_at: "2026-07-05T10:25:00.000Z",
      event_type: "readiness_gap_created",
      causal_step: "variable_or_gap",
      summary: "Gap: desviación en cadena de frío sin reentry/timer cerrado.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "open",
    },
    {
      event_id: "evt-l-09",
      occurred_at: "2026-07-05T10:30:00.000Z",
      event_type: "gate_pst_checked",
      causal_step: "gate_or_readiness",
      summary: "Gate PST: bloqueo funcional requiere timer/reentry antes de avanzar.",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: "PST",
      status: "warning",
    },
    {
      event_id: "evt-l-10",
      occurred_at: "2026-07-05T10:35:00.000Z",
      event_type: "readiness_decision_updated",
      causal_step: "gate_or_readiness",
      summary: "Readiness mantiene ready_with_flags (desviación cadena de frío).",
      actor_ref: "actor-logistica",
      scene_ref: "scene-cadena-frio",
      run_id: "run-ambar-logistica-001",
      gate_code: null,
      status: "ready_with_flags",
    },
  ];

  return [
    ...ventas.map((event) => ({
      ...event,
      run_id: "arr-ambar-vendedor-a4-001",
      user_id: "user-ambar-vendedor-001",
      user_label: "Usuario Simulado Ventas",
    })),
    ...produccion.map((event) => ({
      ...event,
      run_id: "arr-ambar-produccion-b1-001",
      user_id: "user-ambar-produccion-001",
      user_label: "Usuario Simulado Producción",
    })),
    ...logistica.map((event) => ({
      ...event,
      run_id: "arr-ambar-logistica-c3-001",
      user_id: "user-ambar-logistica-001",
      user_label: "Usuario Simulado Operaciones",
    })),
  ];
}

export function isAmbarFixtureRequested(
  env: NodeJS.ProcessEnv = process.env,
  fixtureQuery: string | null = null,
): boolean {
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    return false;
  }
  const envFixture = (env.EVE_CONSULTANT_CONTROL_PANEL_FIXTURE ?? "").trim();
  if (envFixture === AMBAR_FIXTURE_ENV_VALUE) return true;
  const query = (fixtureQuery ?? "").trim().toLowerCase();
  return query === AMBAR_FIXTURE_QUERY_VALUE || query === AMBAR_FIXTURE_ENV_VALUE;
}

const RUNTIME_BLOCK_ORDER = [
  { blockId: "0" as const, blockCode: "BLOQUE_0" as const, blockLabel: "Bloque 0" },
  { blockId: "0.5" as const, blockCode: "BLOQUE_0_5" as const, blockLabel: "Bloque 0.5" },
  { blockId: "1" as const, blockCode: "BLOQUE_1" as const, blockLabel: "Bloque 1" },
  { blockId: "2" as const, blockCode: "BLOQUE_2" as const, blockLabel: "Bloque 2" },
  { blockId: "3" as const, blockCode: "BLOQUE_3" as const, blockLabel: "Bloque 3" },
  { blockId: "4" as const, blockCode: "BLOQUE_4" as const, blockLabel: "Bloque 4" },
  { blockId: "5" as const, blockCode: "BLOQUE_5" as const, blockLabel: "Bloque 5" },
  { blockId: "6" as const, blockCode: "BLOQUE_6" as const, blockLabel: "Bloque 6" },
  { blockId: "7" as const, blockCode: "BLOQUE_7" as const, blockLabel: "Bloque 7" },
];

type BlockSeed = Omit<
  RuntimeBlockCoverageBlockInRun,
  "blockCode" | "blockLabel" | "blockId" | "questionIds"
> & {
  blockId: RuntimeBlockCoverageBlockInRun["blockId"];
  questionIds?: string[];
};

function defaultQuestionIds(
  blockId: RuntimeBlockCoverageBlockInRun["blockId"],
  count: number,
): string[] {
  const prefix = blockId === "0.5" ? "0.5" : blockId;
  return Array.from({ length: count }, (_, index) => `${prefix}.${index + 1}`);
}

function materializeBlocks(seeds: BlockSeed[]): RuntimeBlockCoverageBlockInRun[] {
  return RUNTIME_BLOCK_ORDER.map((meta) => {
    const seed = seeds.find((item) => item.blockId === meta.blockId);
    if (!seed) {
      throw new Error(`Missing block seed for ${meta.blockLabel}`);
    }
    const questionIds =
      seed.questionIds ?? defaultQuestionIds(meta.blockId, seed.questionsAssigned);
    return {
      blockCode: meta.blockCode,
      blockLabel: meta.blockLabel,
      blockId: meta.blockId,
      status: seed.status,
      baseUsed: seed.baseUsed,
      causalUsed: seed.causalUsed,
      questionsAssigned: seed.questionsAssigned,
      questionsAnswered: seed.questionsAnswered,
      questionIds,
      evidence: seed.evidence,
      variablesOrGaps: seed.variablesOrGaps,
      relatedGate: seed.relatedGate,
    };
  });
}

/**
 * Cobertura de bloques Runtime / Capa 1 por activity_runtime_run.
 * Cada actividad primaria seleccionada abre un run que recorre Bloque 0, 0.5 y 1–7.
 */
function buildAmbarRuntimeBlockCoverageByRun(): RuntimeBlockCoverageByRun[] {
  const a4Blocks = materializeBlocks([
    {
      blockId: "0",
      status: "completed",
      baseUsed: 4,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 4,
      evidence: ["caso identificado", "empresa cliente Ámbar"],
      variablesOrGaps: ["case_scope", "client_company_id"],
      relatedGate: "B0",
    },
    {
      blockId: "0.5",
      status: "completed",
      baseUsed: 5,
      causalUsed: 0,
      questionsAssigned: 5,
      questionsAnswered: 5,
      evidence: ["contexto de escena comercial"],
      variablesOrGaps: ["scene_context", "actor_binding"],
      relatedGate: null,
    },
    {
      blockId: "1",
      status: "completed",
      baseUsed: 4,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 4,
      evidence: ["verbo de actividad", "misión comercial"],
      variablesOrGaps: ["activity_verb", "mission_inferred"],
      relatedGate: null,
    },
    {
      blockId: "2",
      status: "active",
      baseUsed: 3,
      causalUsed: 1,
      questionsAssigned: 5,
      questionsAnswered: 3,
      evidence: ["objeto Pedido", "límite crediticio"],
      variablesOrGaps: ["work_object", "credit_limit"],
      relatedGate: "B2",
    },
    {
      blockId: "3",
      status: "review_required",
      baseUsed: 2,
      causalUsed: 1,
      questionsAssigned: 4,
      questionsAnswered: 2,
      evidence: ["excepción crediticia abierta"],
      variablesOrGaps: ["exception_path", "gap_credit_escalation"],
      relatedGate: "B3/C09",
    },
    {
      blockId: "4",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: [],
      relatedGate: null,
    },
    {
      blockId: "5",
      status: "blocked",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["gap_sem_transduction"],
      relatedGate: "SEM",
    },
    {
      blockId: "6",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: [],
      relatedGate: "PST",
    },
    {
      blockId: "7",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["gap_closure_pending"],
      relatedGate: "B7/C20",
    },
  ]);

  const b1Blocks = materializeBlocks([
    {
      blockId: "0",
      status: "completed",
      baseUsed: 3,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 4,
      evidence: ["caso producción Ámbar", "programa semanal en alcance"],
      variablesOrGaps: ["case_scope", "production_week"],
      relatedGate: "B0",
    },
    {
      blockId: "0.5",
      status: "completed",
      baseUsed: 2,
      causalUsed: 0,
      questionsAssigned: 5,
      questionsAnswered: 5,
      evidence: ["contexto de fermentación"],
      variablesOrGaps: ["scene_context", "actor_binding"],
      relatedGate: null,
    },
    {
      blockId: "1",
      status: "completed",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 4,
      evidence: ["consolidación de pedidos"],
      variablesOrGaps: ["activity_verb"],
      relatedGate: null,
    },
    {
      blockId: "2",
      status: "active",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 5,
      questionsAnswered: 2,
      evidence: ["inventario vs capacidad"],
      variablesOrGaps: ["capacity_gap"],
      relatedGate: "B2",
    },
    {
      blockId: "3",
      status: "review_required",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 4,
      questionsAnswered: 1,
      evidence: ["capacidad de fermentación no confirmada"],
      variablesOrGaps: ["fermentation_capacity", "gap_support_route"],
      relatedGate: "B3/C09",
    },
    {
      blockId: "4",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["sync_point"],
      relatedGate: null,
    },
    {
      blockId: "5",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: [],
      relatedGate: "SEM",
    },
    {
      blockId: "6",
      status: "pending",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["capacity_wait"],
      relatedGate: "PST",
    },
    {
      blockId: "7",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["gap_closure_pending"],
      relatedGate: "B7/C20",
    },
  ]);

  const c3Blocks = materializeBlocks([
    {
      blockId: "0",
      status: "completed",
      baseUsed: 2,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 4,
      evidence: ["caso logística Ámbar", "despacho en alcance"],
      variablesOrGaps: ["case_scope", "dispatch_scope"],
      relatedGate: "B0",
    },
    {
      blockId: "0.5",
      status: "completed",
      baseUsed: 1,
      causalUsed: 0,
      questionsAssigned: 5,
      questionsAnswered: 5,
      evidence: ["contexto cadena de frío"],
      variablesOrGaps: ["scene_context", "actor_binding"],
      relatedGate: null,
    },
    {
      blockId: "1",
      status: "completed",
      baseUsed: 1,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 3,
      evidence: ["medición de temperatura"],
      variablesOrGaps: ["activity_verb"],
      relatedGate: null,
    },
    {
      blockId: "2",
      status: "active",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 5,
      questionsAnswered: 2,
      evidence: ["registro de condición"],
      variablesOrGaps: ["condition_record"],
      relatedGate: "B2",
    },
    {
      blockId: "3",
      status: "review_required",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 4,
      questionsAnswered: 1,
      evidence: ["desviación cadena de frío"],
      variablesOrGaps: ["cold_chain_deviation", "gap_support_route"],
      relatedGate: "B3/C09",
    },
    {
      blockId: "4",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: [],
      relatedGate: null,
    },
    {
      blockId: "5",
      status: "blocked",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["logistics_incident"],
      relatedGate: "SEM",
    },
    {
      blockId: "6",
      status: "pending",
      baseUsed: 0,
      causalUsed: 1,
      questionsAssigned: 4,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["reentry_timer"],
      relatedGate: "PST",
    },
    {
      blockId: "7",
      status: "pending",
      baseUsed: 0,
      causalUsed: 0,
      questionsAssigned: 3,
      questionsAnswered: 0,
      evidence: [],
      variablesOrGaps: ["gap_closure_pending"],
      relatedGate: "B7/C20",
    },
  ]);

  return [
    {
      roleRuntimeSessionId: "rrs-ambar-vendedor-001",
      activityRuntimeRunId: "arr-ambar-vendedor-a4-001",
      userId: "user-ambar-vendedor-001",
      role: "Vendedor",
      activityCode: "A4",
      activityName:
        "Revisa estado de cuenta y límite disponible para generar Dictamen Comercial [Elegible] o Solicitud de Excepción Crediticia",
      blocks: a4Blocks,
    },
    {
      roleRuntimeSessionId: "rrs-ambar-produccion-001",
      activityRuntimeRunId: "arr-ambar-produccion-b1-001",
      userId: "user-ambar-produccion-001",
      role: "Responsable de Producción Cervecera",
      activityCode: "B1",
      activityName:
        "Consolida pedidos confirmados, inventario y capacidad para emitir Programa Semanal de Producción",
      blocks: b1Blocks,
    },
    {
      roleRuntimeSessionId: "rrs-ambar-logistica-001",
      activityRuntimeRunId: "arr-ambar-logistica-c3-001",
      userId: "user-ambar-logistica-001",
      role: "Coordinador de Operaciones y Logística",
      activityCode: "C3",
      activityName:
        "Mide temperatura de cava, producto y transporte para producir Registro de Condición [Conforme] o [Desviación]",
      blocks: c3Blocks,
    },
  ];
}

function buildAmbarSceneCandidatesByRun(): SceneCandidateByRun[] {
  return [
    {
      activityCode: "A4",
      role: "Vendedor",
      activityRuntimeRunId: "arr-ambar-vendedor-a4-001",
      sceneCandidateTitle:
        "Excepción crediticia en negociación comercial con cliente premium",
      originSummary: "rol Vendedor + actividad A4 + run arr-ambar-vendedor-a4-001",
      feedsSupObject: "SceneCanonicalRecord [Consolidated]",
      status: "candidate_ready_with_flags",
    },
    {
      activityCode: "B1",
      role: "Responsable de Producción Cervecera",
      activityRuntimeRunId: "arr-ambar-produccion-b1-001",
      sceneCandidateTitle:
        "Capacidad de fermentación no confirmada frente a pedidos ajustados",
      originSummary: "rol Producción + actividad B1 + run arr-ambar-produccion-b1-001",
      feedsSupObject: "SceneCanonicalRecord [Consolidated]",
      status: "candidate_ready_with_flags",
    },
    {
      activityCode: "C3",
      role: "Coordinador de Operaciones y Logística",
      activityRuntimeRunId: "arr-ambar-logistica-c3-001",
      sceneCandidateTitle: "Desviación de cadena de frío en condición de despacho",
      originSummary: "rol Logística + actividad C3 + run arr-ambar-logistica-c3-001",
      feedsSupObject: "SceneCanonicalRecord [Consolidated]",
      status: "candidate_blocked_pending_review",
    },
  ];
}

const AMBAR_RUNTIME_BUDGET_NOTE =
  "El presupuesto 40/20 se calcula por activity_runtime_run de una actividad primaria dentro de una role_runtime_session. No es un presupuesto agregado de la empresa cliente ni del caso completo.";

const AMBAR_RUNTIME_BUDGET_BY_RUN: RuntimeBudgetByRunItem[] = [
  {
    roleRuntimeSessionId: "rrs-ambar-vendedor-001",
    activityRuntimeRunId: "arr-ambar-vendedor-a4-001",
    userId: "user-ambar-vendedor-001",
    roleId: "role-vendedor",
    activityId: "act-a4",
    role: "Vendedor",
    userLabel: "Usuario Simulado Ventas",
    activityCode: "A4",
    activityName:
      "Revisa estado de cuenta y límite disponible para generar Dictamen Comercial [Elegible] o Solicitud de Excepción Crediticia",
    baseUsed: 18,
    baseLimit: 40,
    causalUsed: 3,
    causalLimit: 20,
    baseRemaining: 22,
    causalRemaining: 17,
    currentBlock: "BV-03",
    runState: "manual_review_required",
  },
  {
    roleRuntimeSessionId: "rrs-ambar-produccion-001",
    activityRuntimeRunId: "arr-ambar-produccion-b1-001",
    userId: "user-ambar-produccion-001",
    roleId: "role-produccion",
    activityId: "act-b1",
    role: "Responsable de Producción Cervecera",
    userLabel: "Usuario Simulado Producción",
    activityCode: "B1",
    activityName:
      "Consolida pedidos confirmados, inventario y capacidad para emitir Programa Semanal de Producción",
    baseUsed: 5,
    baseLimit: 40,
    causalUsed: 3,
    causalLimit: 20,
    baseRemaining: 35,
    causalRemaining: 17,
    currentBlock: "BP-04",
    runState: "active_causal_capture",
  },
  {
    roleRuntimeSessionId: "rrs-ambar-logistica-001",
    activityRuntimeRunId: "arr-ambar-logistica-c3-001",
    userId: "user-ambar-logistica-001",
    roleId: "role-logistica",
    activityId: "act-c3",
    role: "Coordinador de Operaciones y Logística",
    userLabel: "Usuario Simulado Operaciones",
    activityCode: "C3",
    activityName:
      "Mide temperatura de cava, producto y transporte para producir Registro de Condición [Conforme] o [Desviación]",
    baseUsed: 4,
    baseLimit: 40,
    causalUsed: 3,
    causalLimit: 20,
    baseRemaining: 36,
    causalRemaining: 17,
    currentBlock: "BL-02",
    runState: "blocked",
  },
];

/**
 * Presupuesto 40/20 por activity_runtime_run (no ledger global de empresa/caso).
 * Cada run primario tiene su propio límite 40 base / 20 causal.
 * Consumo por bloque se deriva de la cobertura del mismo run (no global).
 */
function buildAmbarRuntimeBudget4020(
  coverageByRun: RuntimeBlockCoverageByRun[],
): RuntimeBudget4020Summary {
  const coverageIds = new Set(coverageByRun.map((run) => run.activityRuntimeRunId));
  const runtimeBudgetByRun = AMBAR_RUNTIME_BUDGET_BY_RUN.filter((run) =>
    coverageIds.has(run.activityRuntimeRunId),
  );
  const totalBase = runtimeBudgetByRun.reduce((sum, run) => sum + run.baseUsed, 0);
  const totalCausal = runtimeBudgetByRun.reduce((sum, run) => sum + run.causalUsed, 0);

  const coverageByRunId = new Map(
    coverageByRun.map((run) => [run.activityRuntimeRunId, run]),
  );

  const consumptionByBlockByRun = runtimeBudgetByRun.map((run) => {
    const coverage = coverageByRunId.get(run.activityRuntimeRunId);
    return {
      activityRuntimeRunId: run.activityRuntimeRunId,
      roleLabel: run.role,
      activityCode: run.activityCode,
      blocks: (coverage?.blocks ?? []).map((block) => ({
        blockId: block.blockId,
        blockName: block.blockLabel,
        baseUsed: block.baseUsed,
        causalUsed: block.causalUsed,
      })),
    };
  });

  return {
    scopeTitle: "Presupuesto Runtime 40/20 por usuario / rol / actividad primaria",
    note: AMBAR_RUNTIME_BUDGET_NOTE,
    operationalSufficiencyNote: OPERATIONAL_SUFFICIENCY_NOTE,
    caseAggregate: {
      usersInScope: new Set(runtimeBudgetByRun.map((run) => run.userId)).size,
      rolesInScope: new Set(runtimeBudgetByRun.map((run) => run.roleId)).size,
      primaryActivitiesSelected: runtimeBudgetByRun.length,
      activeRuns: runtimeBudgetByRun.length,
      totalBaseInteractionsObserved: totalBase,
      totalCausalInteractionsObserved: totalCausal,
      informationalLabel: "Agregado informativo — no límite de presupuesto",
    },
    budgetByUserRole: runtimeBudgetByRun.map((run) => ({
      userId: run.userId,
      userLabel: run.userLabel,
      roleId: run.roleId,
      roleLabel: run.role,
      primaryActivitiesWithRun: [
        {
          activityId: run.activityId,
          activityCode: run.activityCode,
          activityName: run.activityName,
          activityRuntimeRunId: run.activityRuntimeRunId,
          baseUsed: run.baseUsed,
          baseLimit: 40,
          causalUsed: run.causalUsed,
          causalLimit: 20,
          runState: run.runState,
        },
      ],
    })),
    runtimeBudgetByRun,
    consumptionByBlockByRun,
  };
}

export function getAmbarFixtureMeta() {
  const allActivities = FIXTURE_USERS.flatMap((user) => user.activities);
  const allBlocks = FIXTURE_USERS.flatMap((user) => user.blocks);
  const timeline = buildTraceEvents();
  const backbone = buildSupFinalObjectsBackbone("ambar_fixture");
  const runtimeBlockCoverageByRun = buildAmbarRuntimeBlockCoverageByRun();
  return {
    clientCompanyCreated: true,
    caseCreated: true,
    usersCreated: FIXTURE_USERS.length,
    functionalRolesCreated: FIXTURE_USERS.length,
    activitiesCreated: allActivities.length,
    questionBlocksCreated: allBlocks.length,
    runtimeBlocksCovered: runtimeBlockCoverageByRun.reduce(
      (sum, run) => sum + run.blocks.length,
      0,
    ),
    runtimeRunsCovered: runtimeBlockCoverageByRun.length,
    traceEventsCreated: timeline.length,
    gateSummariesCreated: 6,
    readinessState: "ready_with_flags" as const,
    downloadsVisible: 8,
    downloadsDisabled: true,
    manualControlsDisabled: true,
    productionTouched: false,
    supFinalObjectsCount: backbone.supFinalObjects.length,
    productiveExportBlocked: true,
    finalDiagnosisAutomaticBlocked: true,
  };
}

function mergeFixtureFilters(
  overrides?: Partial<ControlPanelFilterScope>,
): ControlPanelFilterScope {
  const base: ControlPanelFilterScope = {
    ...EMPTY_FILTERS,
    client_company_id: AMBAR_CLIENT_COMPANY_ID,
    case_id: AMBAR_CASE_ID,
  };
  if (!overrides) return base;
  const next: ControlPanelFilterScope = { ...base };
  for (const key of Object.keys(EMPTY_FILTERS) as Array<keyof ControlPanelFilterScope>) {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) continue;
    const value = overrides[key];
    if (key === "view") {
      next.view =
        value === "cases" ||
        value === "functional-help" ||
        value === "monitoring" ||
        value === "runtime" ||
        value === "trace" ||
        value === "gates" ||
        value === "downloads" ||
        value === "audit"
          ? value
          : null;
      continue;
    }
    if (key === "runtime_view_scope") {
      next.runtime_view_scope =
        value === "selected_activity" ||
        value === "role_activities" ||
        value === "user_all_roles" ||
        value === "case_all"
          ? value
          : null;
      continue;
    }
    next[key] = value && String(value).trim() !== "" ? String(value).trim() : null;
  }
  return next;
}

function activityCodeFromLabel(label: string): string | null {
  const match = label.match(/^([A-Z]\d+)\b/);
  return match?.[1] ?? null;
}

function buildUserProgressRows(
  users: FixtureUser[],
  coverageByRun: RuntimeBlockCoverageByRun[],
): Array<{
  user_id: string;
  user_label: string;
  role_id: string;
  role_label: string;
  activities_count: number;
  primary_activities_completed: number;
  progress_pct: number;
  blocks_completed: number;
  blocks_pending: number;
  blockers: string[];
  last_activity_at: string;
  active: boolean;
  question_blocks: FixtureBlock[];
  activities: FixtureActivity[];
}> {
  return users.map((user) => {
    const primaryAssigned = user.activities.slice(0, PRIMARY_ACTIVITIES_MAX);
    const assignedCodes = new Set(
      primaryAssigned
        .map((activity) => activityCodeFromLabel(activity.label))
        .filter((code): code is string => Boolean(code)),
    );
    const userRuns = coverageByRun.filter(
      (run) => run.userId === user.id && assignedCodes.has(run.activityCode),
    );
    const primaryCompleted = userRuns.filter((run) =>
      run.blocks.every((block) => block.status === "completed"),
    ).length;
    const blocksCompleted = userRuns.reduce(
      (sum, run) => sum + run.blocks.filter((block) => block.status === "completed").length,
      0,
    );
    const blocksTotal = userRuns.reduce((sum, run) => sum + run.blocks.length, 0);
    const blocksPending = Math.max(blocksTotal - blocksCompleted, 0);
    const progressPct =
      blocksTotal === 0 ? 0 : Math.round((blocksCompleted / blocksTotal) * 100);

    return {
      user_id: user.id,
      user_label: user.name,
      role_id: user.roleId,
      role_label: user.role,
      activities_count: primaryAssigned.length,
      primary_activities_completed: primaryCompleted,
      progress_pct: progressPct,
      blocks_completed: blocksCompleted,
      blocks_pending: blocksPending,
      blockers: user.blockers,
      last_activity_at: user.lastActivityAt,
      active: true,
      question_blocks: user.blocks,
      activities: primaryAssigned,
    };
  });
}

function filterUsersByScope(
  users: FixtureUser[],
  filters: ControlPanelFilterScope,
): FixtureUser[] {
  return users.filter((user) => {
    if (filters.user_id && user.id !== filters.user_id) return false;
    if (filters.role_id && user.roleId !== filters.role_id) return false;
    if (
      filters.activity_id &&
      !user.activities.some((activity) => activity.id === filters.activity_id)
    ) {
      return false;
    }
    return true;
  });
}

export function buildCerveceriaAmbarAncestralFixtureState(input: {
  filters?: Partial<ControlPanelFilterScope>;
  role?: ConsultantControlPanelRole | null;
}): ConsultantControlPanelState {
  const defaultUser = FIXTURE_USERS[0];
  const filters = mergeFixtureFilters(input.filters);

  const scopedUsers = filterUsersByScope(FIXTURE_USERS, filters);
  const selectedUser =
    scopedUsers.find((user) => user.id === filters.user_id) ??
    scopedUsers[0] ??
    defaultUser;
  const selectedBlock =
    selectedUser.blocks.find((block) => block.blockId === selectedUser.currentBlockId) ??
    selectedUser.blocks[0];
  const selectedActivity =
    selectedUser.activities.find((activity) => activity.id === filters.activity_id) ??
    selectedUser.activities.find((activity) => activity.id === selectedUser.currentActivityId) ??
    selectedUser.activities[0];

  const allCoverage = buildAmbarRuntimeBlockCoverageByRun();
  const allScenes = buildAmbarSceneCandidatesByRun();
  const allTimeline = buildTraceEvents();

  const scopedUserIds = new Set(scopedUsers.map((user) => user.id));
  const aggregateScope =
    filters.runtime_view_scope === "role_activities" ||
    filters.runtime_view_scope === "user_all_roles" ||
    filters.runtime_view_scope === "case_all";
  const runtimeBlockCoverageByRun = allCoverage.filter((run) => {
    if (!scopedUserIds.has(run.userId)) return false;
    // Aggregate views keep sibling runs visible; run_id only anchors selected_context.
    if (!aggregateScope && filters.run_id && run.activityRuntimeRunId !== filters.run_id) {
      return false;
    }
    if (filters.activity_id && !aggregateScope) {
      const activity = FIXTURE_USERS.flatMap((user) => user.activities).find(
        (item) => item.id === filters.activity_id,
      );
      const code = activity ? activityCodeFromLabel(activity.label) : null;
      if (code && run.activityCode !== code) return false;
    }
    if (filters.role_id && !aggregateScope) {
      const roleUser = FIXTURE_USERS.find((user) => user.roleId === filters.role_id);
      if (roleUser && run.userId !== roleUser.id) return false;
    }
    if (aggregateScope && filters.runtime_view_scope === "user_all_roles" && filters.user_id) {
      if (run.userId !== filters.user_id) return false;
    }
    if (
      aggregateScope &&
      filters.runtime_view_scope === "role_activities" &&
      filters.role_runtime_session_id
    ) {
      // Coverage rows carry role via user; session filter applied after budget build.
      const roleUser = FIXTURE_USERS.find((user) => user.id === run.userId);
      if (filters.user_id && run.userId !== filters.user_id) return false;
      if (filters.role_id && roleUser && roleUser.roleId !== filters.role_id) return false;
    }
    return true;
  });
  const sceneCandidatesByRun = allScenes.filter((scene) =>
    runtimeBlockCoverageByRun.some(
      (run) => run.activityRuntimeRunId === scene.activityRuntimeRunId,
    ),
  );
  const timeline = allTimeline.filter((event) => {
    if (event.user_id && !scopedUserIds.has(event.user_id)) return false;
    if (filters.run_id && event.run_id !== filters.run_id) return false;
    return true;
  });
  const runtimeBudget4020 = buildAmbarRuntimeBudget4020(runtimeBlockCoverageByRun);
  const allBaseResolution = buildAmbarBaseResolutionByRun();
  const allCausalClosure = buildAmbarCausalClosureByRun();
  const baseResolutionByRun = allBaseResolution.filter((entry) =>
    runtimeBlockCoverageByRun.some(
      (run) => run.activityRuntimeRunId === entry.activityRuntimeRunId,
    ),
  );
  const causalClosureByRun = allCausalClosure.filter((entry) =>
    runtimeBlockCoverageByRun.some(
      (run) => run.activityRuntimeRunId === entry.activityRuntimeRunId,
    ),
  );
  const base_resolution_gate = aggregateAmbarBaseResolutionGate(baseResolutionByRun);
  const causal_closure_gate = aggregateAmbarCausalClosureGate(causalClosureByRun);
  const userRows = buildUserProgressRows(scopedUsers, allCoverage);
  const overallProgress =
    userRows.length === 0
      ? 0
      : Math.round(
          userRows.reduce((sum, user) => sum + user.progress_pct, 0) / userRows.length,
        );

  const activityOptionsUsers =
    filters.user_id || filters.role_id
      ? FIXTURE_USERS.filter((user) => {
          if (filters.user_id && user.id !== filters.user_id) return false;
          if (filters.role_id && user.roleId !== filters.role_id) return false;
          return true;
        })
      : FIXTURE_USERS;

  const runOptions = [
    { id: "arr-ambar-vendedor-a4-001", label: "A4 · Vendedor · arr-ambar-vendedor-a4-001", userId: "user-ambar-vendedor-001", activityId: "act-a4" },
    {
      id: "arr-ambar-produccion-b1-001",
      label: "B1 · Producción · arr-ambar-produccion-b1-001",
      userId: "user-ambar-produccion-001",
      activityId: "act-b1",
    },
    {
      id: "arr-ambar-logistica-c3-001",
      label: "C3 · Logística · arr-ambar-logistica-c3-001",
      userId: "user-ambar-logistica-001",
      activityId: "act-c3",
    },
  ].filter((run) => {
    if (filters.user_id && run.userId !== filters.user_id) return false;
    if (filters.activity_id && run.activityId !== filters.activity_id) return false;
    if (filters.role_id) {
      const roleUser = FIXTURE_USERS.find((user) => user.roleId === filters.role_id);
      if (roleUser && run.userId !== roleUser.id) return false;
    }
    return true;
  });

  return {
    panel_id: "consultant_expert_control_panel",
    request_id: "REQ-AMBAR-PENDING-ENRICH",
    contract_version: "1.0",
    generated_at: FIXTURE_NOW,
    access: {
      surface: "consultant_internal",
      client_access_blocked: true,
      consultant_role: input.role ?? null,
    },
    capabilities: {
      read: true,
      manual_actions: {
        enabled: false,
        reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
        allowed_actions: [],
      },
      downloads: {
        enabled: false,
        reason_code: "AUTHORIZED_GENERATOR_NOT_AVAILABLE",
      },
    },
    critical_alerts: [],
    filters,
    filter_options: {
      client_companies: [
        { id: AMBAR_CLIENT_COMPANY_ID, label: "Cervecería Ámbar Ancestral" },
      ],
      cases: [
        {
          id: AMBAR_CASE_ID,
          label: "Diagnóstico de coordinación comercial-productiva-logística",
        },
      ],
      users: FIXTURE_USERS.map((user) => ({ id: user.id, label: user.name })),
      roles: FIXTURE_USERS.map((user) => ({ id: user.roleId, label: user.role })),
      role_runtime_sessions: runtimeBudget4020.runtimeBudgetByRun.map((run) => ({
        id: run.roleRuntimeSessionId,
        label: `${run.userLabel} · ${run.role} · ${run.activityCode}`,
      })),
      activities: activityOptionsUsers.flatMap((user) =>
        user.activities.map((activity) => ({ id: activity.id, label: activity.label })),
      ),
      runs: runOptions.map((run) => ({ id: run.id, label: run.label })),
    },
    // Populated authoritatively by enrichConsultantControlPanelState (BFF read model).
    case_header: {
      company_name: "Cervecería Ámbar Ancestral",
      case_id: AMBAR_CASE_ID,
      case_label: "Diagnóstico de coordinación comercial-productiva-logística",
      case_status: "in_progress",
      catalog_version: "1.1.1",
      runtime_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
    },
    selected_context: {
      companyName: "Cervecería Ámbar Ancestral",
      caseId: AMBAR_CASE_ID,
      caseLabel: "Diagnóstico de coordinación comercial-productiva-logística",
      physicalUserId: selectedUser.id,
      physicalUserLabel: selectedUser.name,
      roleRuntimeSessionId: null,
      roleLabel: selectedUser.role,
      roleId: selectedUser.roleId,
      activityId: selectedActivity.id,
      activityTitle: selectedActivity.label,
      activityCode: activityCodeFromLabel(selectedActivity.label),
      runId: filters.run_id,
      pmProcessCode: "P-SUP-01",
      catalogVersion: "1.1.1",
      runtimeVersion: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
      runState: null,
      runStateLabel: null,
      effectiveScope: filters.runtime_view_scope ?? "selected_activity",
      isAggregateView: (filters.runtime_view_scope ?? "selected_activity") !== "selected_activity",
    },
    runs: [],
    base_items: null,
    causal_items: null,
    gates: [],
    meta: {
      effective_scope: {
        client_company_id: AMBAR_CLIENT_COMPANY_ID,
        case_id: AMBAR_CASE_ID,
        user_id: filters.user_id,
        role_id: filters.role_id,
        role_runtime_session_id: filters.role_runtime_session_id,
        activity_id: filters.activity_id,
        run_id: filters.run_id,
        runtime_view_scope: filters.runtime_view_scope ?? "selected_activity",
        include: "run-detail",
        pm_process_code: "P-SUP-01",
      },
      capabilities: {
        read: true,
        manual_actions: {
          enabled: false,
          reason_code: "AUDITED_ENDPOINT_NOT_AVAILABLE",
          allowed_actions: [],
        },
        downloads: {
          enabled: false,
          reason_code: "AUTHORIZED_GENERATOR_NOT_AVAILABLE",
        },
      },
      freshness: {
        as_of: FIXTURE_NOW,
        stale: false,
        source: "fixture",
      },
    },
    area_1_functional_help: {
      client_company_name: "Cervecería Ámbar Ancestral",
      case_id: AMBAR_CASE_ID,
      case_label: "Diagnóstico de coordinación comercial-productiva-logística",
      user_id: selectedUser.id,
      user_label: selectedUser.name,
      role_id: selectedUser.roleId,
      role_label: selectedUser.role,
      role_purpose: selectedUser.rolePurpose,
      current_activity_id: selectedActivity.id,
      current_activity_label: selectedActivity.label,
      current_question_block: selectedBlock.title,
      block_status: selectedBlock.status,
      pending_questions: selectedBlock.pendingQuestions,
      incomplete_answers: selectedBlock.incompleteAnswers,
      errors_or_blocks: selectedBlock.errorsOrBlockers,
      last_interaction_at: selectedBlock.lastInteractionAt,
      question_blocks: selectedUser.blocks,
      intervention_history: [
        {
          intervention_id: "int-ambar-sim-001",
          consultant_id: "consultant-simulado-local",
          timestamp: "2026-07-10T14:00:00.000Z",
          action: "mark_for_review",
          justification:
            "Simulación local: excepción crediticia marcada para revisión consultor (sin endpoint auditado).",
          previous_state: "in_progress",
          new_state: "pending_review",
        },
      ],
      manual_controls: buildManualControls(),
      causal_purpose:
        "Permitir al consultor intervenir cuando un usuario cliente se bloquea, se desvía, necesita reentrada o requiere selección manual de actividad/preguntas.",
    },
    area_2_client_progress: {
      client_company_id: AMBAR_CLIENT_COMPANY_ID,
      client_company_name: "Cervecería Ámbar Ancestral",
      client_company_type: "simulated_client_company",
      industry: "cervecería artesanal premium",
      service_context:
        "diagnóstico EVE de sincronización entre ventas, producción cervecera y logística",
      contract_unit: "empresa_cliente",
      case_id: AMBAR_CASE_ID,
      case_label: "Diagnóstico de coordinación comercial-productiva-logística",
      case_status: "in_progress",
      case_mode: "lectura / intervención auditada pendiente",
      critical_blockers_count: userRows.reduce((sum, user) => sum + user.blockers.length, 0),
      overall_progress_pct: overallProgress,
      users: userRows,
      associated_roles: scopedUsers.map((user) => ({
        role_id: user.roleId,
        role_label: user.role,
      })),
      causal_purpose:
        "El usuario no es cliente aislado; pertenece a una empresa cliente. El consultor debe ver avance por empresa, caso, rol y usuario.",
    },
    area_3_operational_trace: {
      timeline,
      runtime_events_count: timeline.length,
      interactions_count: timeline.filter((event) => event.causal_step === "user_input").length,
      answers_processed_count: timeline.filter((event) => event.event_type.includes("answer"))
        .length,
      subfields_count: 3,
      evidence_items_count: timeline.filter((event) => event.causal_step === "evidence").length,
      canonical_variables_count: timeline.filter(
        (event) => event.causal_step === "variable_or_gap",
      ).length,
      readiness_gaps_count: 3,
      runtimeBlockCoverageByRun,
      sceneCandidatesByRun,
      runtimeBudget4020,
      baseResolutionByRun,
      causalClosureByRun,
      base_resolution_gate,
      causal_closure_gate,
      runtime_40_20_operational_rules_version: RUNTIME_40_20_OPERATIONAL_RULES_VERSION,
      gate_summaries: [
        {
          gate_code: "B0",
          status: "pass",
          reason: "caso, empresa y usuarios identificados.",
        },
        {
          gate_code: "B2",
          status: "pass",
          reason: "roles funcionales y actividades reconocidas.",
        },
        {
          gate_code: "B3/C09",
          status: "warning",
          reason:
            "algunas actividades tienen evidencia incompleta o requieren ruta de soporte.",
        },
        {
          gate_code: "B7/C20",
          status: "blocked",
          reason:
            "no se permite diagnóstico final ni exportación productiva; solo packet consultor simulado.",
        },
        {
          gate_code: "SEM",
          status: "warning",
          reason:
            "transducción actor → escena → empresa cliente requiere revisión consultor.",
        },
        {
          gate_code: "PST",
          status: "warning",
          reason: "bloqueos funcionales requieren timer/reentry antes de avanzar.",
        },
      ],
      transduction_status: "ready_with_flags · revisión consultor requerida",
      actor_scene_company_relation:
        "usuario → actor (Vendedor / Producción / Logística) → escena (negociación / fermentación / cadena de frío) → empresa cliente Cervecería Ámbar Ancestral",
      readiness: {
        state: "ready_with_flags",
        flags: [
          "excepción crediticia pendiente",
          "capacidad de fermentación no confirmada",
          "desviación en cadena de frío",
        ],
        consultantReviewRequired: true,
        publicSelfServiceAllowed: false,
        finalDiagnosisAutomaticAllowed: false,
        productiveExportAllowed: false,
      },
      causal_purpose:
        "Materializar la operación interna de EVE: información del usuario → actor/escena → transducción → empresa cliente → evidencia → variables/gaps → gates/readiness.",
      event_to_sup_links: SUP_EVENT_TO_OBJECT_LINKS,
    },
    sup_final_objects_backbone: buildSupFinalObjectsBackbone("ambar_fixture"),
    area_4_downloads: {
      downloads: buildDownloadsWithSupMapping(),
      causal_purpose:
        "Permitir al consultor descargar información útil para análisis, revisión y traslado controlado, sin exportaciones productivas no autorizadas.",
    },
    boundary: {
      production_touched: false,
      service_role_in_frontend: false,
      diagnosis_final_automatic: false,
      productive_export_executed: false,
      activation_reopened: false,
      ring_5_recreated: false,
    },
    consultant_safe_message:
      "Fixture local Cervecería Ámbar Ancestral (no productivo). Controles manuales y descargas deshabilitados. Sin diagnóstico final automático ni exportación productiva.",
    fixture: {
      id: AMBAR_FIXTURE_ENV_VALUE,
      source: "Perfiles_Roles_Funcionales_Cerveceria_Ambar_Ancestral_EVE.docx",
      simulated: true,
      production_data_used: false,
    },
  };
}
