/* eslint-disable max-lines */
/**
 * Primary Activity Selection Policy EVE/MMABP v1.3
 *
 * Fuente normativa: PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx.
 * Este archivo es la política canónica machine-readable para ejecución.
 * No leer XLSX en runtime.
 */

export const PRIMARY_ACTIVITY_SELECTION_VERSION = "PRIMARY_ACTIVITY_SELECTION_V1_3" as const;

export type SelectionMode =
  | "reentry_required"
  | "non_competitive_inclusion"
  | "competitive_selection";

export type SelectionReasonCode =
  | "included_all_eligible_under_8"
  | "selected_for_high_architectural_signal"
  | "selected_for_transformation_object_signal"
  | "selected_for_handoff_timer_signal"
  | "selected_for_governance_synchronization_signal"
  | "selected_for_pf_olc_risk_signal"
  | "selected_for_friction_exception_signal"
  | "selected_for_high_final_score"
  | "selected_for_coverage_diversity_tiebreaker"
  | "selected_for_exploratory_signal";

export type ActivitySelectionSignals = {
  pmSignalPotential: number;
  mocSignalPotential: number;
  pfSignalPotential: number;
  olcSignalPotential: number;
  architecturalSignalPotential: number;
  operationalCentrality: number;
  transformationObjectSignal: number;
  handoffDependencySignal: number;
  timerWaitSignal: number;
  synchronizationGovernanceSignal: number;
  frictionExceptionSignal: number;
  pfOlcRiskSignal: number;
  coverageDiversityValue: number;
  responsibilityBalanceAdjustment: number;
  duplicatePenalty: number;
  tooMacroPenalty: number;
  tooMicroPenalty: number;
  overlySpecificToolPenalty: number;
  lateralContextPenalty: number;
  finalSelectionScore: number;
};

export const PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3 = {
  "$schema": "https://eve.local/schemas/primary-activity-selection-policy.v1.3.schema.json",
  "policyVersion": "PRIMARY_ACTIVITY_SELECTION_V1_3",
  "policyName": "Primary Activity Selection Policy EVE/MMABP v1.3",
  "language": "es",
  "status": "operational_machine_readable",
  "authority": {
    "sourceNormativeDocument": "PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx",
    "machineReadableSource": "primary-activity-selection-policy.v1.3.json",
    "runtimeImplementationTarget": "src/services/primary-activity-selector.ts",
    "domainVersionTarget": "src/domain/primary-activity-selection-policy.ts",
    "rule": "El XLSX es rector normativo. El JSON/TS es la política canónica ejecutable. La plataforma no debe leer XLSX en runtime."
  },
  "constants": {
    "maxPrimaryActivities": 8,
    "minEligibleForCompetitiveSelection": 9,
    "maxResponsibilityBalanceAdjustment": 0.05,
    "genericSelectionReasonAllowed": false,
    "preserveNonPrimaryContext": true,
    "workMapInferenceIsNotCapturedEvidence": true
  },
  "selectionModes": [
    {
      "mode": "reentry_required",
      "condition": "eligibleCount == 0",
      "action": "No ejecutar Runtime 40/20. Reentrada breve a WorkMap.",
      "reasonCode": "reentry_required_no_eligible_activities"
    },
    {
      "mode": "non_competitive_inclusion",
      "condition": "eligibleCount >= 1 && eligibleCount <= maxPrimaryActivities",
      "action": "Seleccionar todas las actividades elegibles tras gates de calidad. No aplicar ranking competitivo.",
      "reasonCode": "included_all_eligible_under_8"
    },
    {
      "mode": "competitive_selection",
      "condition": "eligibleCount > maxPrimaryActivities",
      "action": "Aplicar señal arquitectónica bajo incertidumbre, slots especiales, penalizaciones y balance solo como corrección/desempate.",
      "reasonCode": "competitive_selection_required"
    }
  ],
  "eligibilityGates": [
    {
      "gateId": "G1_NON_EMPTY_ACTIVITY",
      "field": "activityTitle",
      "hardGate": true,
      "condition": "activityTitle.trim().length > 0",
      "failureStatus": "excluded_empty_activity",
      "failureReason": "La actividad está vacía o no contiene acción evaluable."
    },
    {
      "gateId": "G2_BELONGS_TO_ROLE_WORKMAP",
      "field": "responsibilityId",
      "hardGate": true,
      "condition": "responsibilityId exists && activity belongs to saved WorkMap snapshot",
      "failureStatus": "excluded_outside_workmap",
      "failureReason": "La actividad no tiene trazabilidad hacia responsabilidad/rol del WorkMap."
    },
    {
      "gateId": "G3_DUPLICATE_OR_ALIAS",
      "hardGate": false,
      "condition": "not duplicateOrAliasOfBetterCandidate",
      "failureStatus": "context_only_duplicate_or_alias",
      "failureReason": "La actividad parece duplicada o alias de otra actividad mejor formulada."
    },
    {
      "gateId": "G4_NOT_GENERIC_RESPONSIBILITY",
      "hardGate": false,
      "condition": "activity is not only a generic responsibility without observable operation",
      "failureStatus": "needs_reentry_generic_responsibility",
      "failureReason": "La redacción parece responsabilidad/macrofunción, no actividad operativa."
    },
    {
      "gateId": "G5_NOT_TOO_MICRO",
      "hardGate": false,
      "condition": "activity can sustain Runtime 40/20 without becoming a trivial task",
      "failureStatus": "context_only_too_micro",
      "failureReason": "La actividad es demasiado micro y debe absorberse como tarea dentro de otra actividad."
    },
    {
      "gateId": "G6_NOT_TOO_MACRO",
      "hardGate": false,
      "condition": "activity is not a whole process requiring decomposition",
      "failureStatus": "needs_reentry_too_macro",
      "failureReason": "La actividad es demasiado amplia y debe desglosarse antes de Runtime."
    }
  ],
  "signalScales": {
    "defaultScale": {
      "min": 0,
      "max": 3,
      "unknownPolicy": "unknown is not equivalent to zero"
    },
    "scoreNormalization": "sum raw signal components then normalize to 0..1 where needed",
    "interpretation": {
      "0": "sin señal observable",
      "1": "señal débil",
      "2": "señal moderada",
      "3": "señal fuerte",
      "unknown": "no inferible desde WorkMap; no penalizar salvo que impida preguntar"
    }
  },
  "signals": [
    {
      "key": "pmSignalPotential",
      "weightWithinArchitecturalSignal": 0.25,
      "description": "Potencial de revelar cliente, necesidad, trigger, estado objetivo, soporte o proceso contenedor.",
      "positivePatterns": [
        "para asegurar",
        "para garantizar",
        "para permitir",
        "para obtener",
        "para entregar",
        "para informar",
        "para habilitar",
        "para cerrar",
        "visibilidad",
        "rentabilidad",
        "cumplimiento",
        "compromiso"
      ],
      "negativePatterns": []
    },
    {
      "key": "mocSignalPotential",
      "weightWithinArchitecturalSignal": 0.25,
      "description": "Potencial de revelar objetos de negocio, clases, atributos, relaciones, roles, fases o ends.",
      "positivePatterns": [
        "proyecto",
        "presupuesto",
        "cotización",
        "cotizaciones",
        "proveedor",
        "proveedores",
        "contrato",
        "factura",
        "facturas",
        "estimación",
        "estimaciones",
        "orden de compra",
        "órdenes de compra",
        "APU",
        "matrices",
        "activos",
        "inventario",
        "Unidad de Negocio",
        "ERP",
        "Oracle",
        "materiales",
        "insumos"
      ],
      "negativePatterns": []
    },
    {
      "key": "pfSignalPotential",
      "weightWithinArchitecturalSignal": 0.25,
      "description": "Potencial de revelar flujo, tareas, handoffs, esperas, loops, rutas alternativas, Process State o feedback operativo.",
      "positivePatterns": [
        "solicito",
        "envío",
        "enviar",
        "notificando",
        "recabando",
        "presento",
        "valido",
        "verifico",
        "autorizo",
        "apruebo",
        "gestiono",
        "recibo",
        "obtengo",
        "carga",
        "cargar",
        "sistema",
        "firmas",
        "Dirección General",
        "Contraloría",
        "Operaciones",
        "Finanzas",
        "compras",
        "residentes"
      ],
      "negativePatterns": []
    },
    {
      "key": "olcSignalPotential",
      "weightWithinArchitecturalSignal": 0.25,
      "description": "Potencial de revelar objetos que nacen, cambian de estado, se autorizan, rechazan, cierran, protocolizan o se destruyen/cancelan.",
      "positivePatterns": [
        "dar de alta",
        "alta",
        "actualizar",
        "actualizo",
        "habilito",
        "liberar",
        "autorizar",
        "autorizo",
        "cerrar",
        "protocolizo",
        "validar",
        "valido",
        "verifico",
        "firmado",
        "aprobación",
        "recepción",
        "pago",
        "compromiso",
        "generar",
        "estructurar",
        "formalizar"
      ],
      "negativePatterns": []
    },
    {
      "key": "transformationObjectSignal",
      "description": "Señal de transformación material o conceptual de un objeto de negocio.",
      "positivePatterns": [
        "cuantifico",
        "integro",
        "proceso",
        "procesando",
        "elaboro",
        "analizo",
        "valido",
        "verifico",
        "concilio",
        "actualizo",
        "generar",
        "estructurar",
        "habilitar",
        "dar de alta",
        "autorizar",
        "protocolizo"
      ],
      "boostIfObjectsPresent": [
        "proyecto",
        "presupuesto",
        "APU",
        "cotización",
        "factura",
        "estimación",
        "contrato",
        "materiales",
        "insumos",
        "orden de compra"
      ]
    },
    {
      "key": "handoffDependencySignal",
      "description": "Señal de dependencia, receptor, entrega, envío, firma, coordinación externa o handoff.",
      "positivePatterns": [
        "enviar",
        "entregar",
        "equipo",
        "proveedor",
        "proveedores",
        "contratistas",
        "compras",
        "Dirección General",
        "Contraloría",
        "Operaciones",
        "Finanzas",
        "residentes",
        "recabando",
        "solicitudes de cotización",
        "propuestas recibidas",
        "compromiso de entrega"
      ]
    },
    {
      "key": "timerWaitSignal",
      "description": "Señal de espera, fecha compromiso, calendario, fechas críticas, periodicidad, vencimiento o evento temporal.",
      "positivePatterns": [
        "calendario",
        "trimestral",
        "mensual",
        "fecha compromiso",
        "fechas críticas",
        "programa de obra",
        "antes de",
        "compromiso",
        "recibidas",
        "aprobación del proyecto"
      ]
    },
    {
      "key": "synchronizationGovernanceSignal",
      "description": "Señal de sincronización transversal, gobernanza, aprobación, firma, autoridad cruzada o control institucional.",
      "positivePatterns": [
        "firmas",
        "Contraloría",
        "Operaciones",
        "Finanzas",
        "Dirección General",
        "aprobación",
        "apruebo",
        "autorizo",
        "regulo",
        "normas",
        "control",
        "visibilidad financiera",
        "alineación transversal",
        "validez legal",
        "carga final"
      ]
    },
    {
      "key": "frictionExceptionSignal",
      "description": "Señal de posible excepción, desviación, comparación real/sistema, causa raíz, rechazo, incumplimiento o retrabajo.",
      "positivePatterns": [
        "desviaciones",
        "causa raíz",
        "comparando",
        "contra",
        "revisando",
        "validando",
        "fechas críticas",
        "compromiso",
        "contrato",
        "sistema contra documento",
        "avance físico",
        "pago",
        "recepción"
      ]
    },
    {
      "key": "pfOlcRiskSignal",
      "description": "Señal de posible inconsistencia PF↔OLC: tarea que fuerza estado, autorización, recepción, pago, carga, alta, liberación, cierre o protocolo.",
      "positivePatterns": [
        "autorizar",
        "recepción",
        "pago",
        "dar de alta",
        "habilitar",
        "carga",
        "firmado",
        "cerrar",
        "protocolizo",
        "liberar",
        "validar",
        "verifico"
      ]
    },
    {
      "key": "operationalCentrality",
      "description": "Señal de centralidad del rol y de la cadena principal del negocio.",
      "positivePatterns": [
        "presupuesto maestro",
        "presupuesto final",
        "estimaciones de obra",
        "erogaciones",
        "adjudicación",
        "APU",
        "cotizaciones",
        "orden de compra",
        "control presupuestal",
        "rentabilidad",
        "pago de facturas"
      ]
    }
  ],
  "scoring": {
    "architecturalSignalPotential": {
      "formula": "0.25*pmSignalPotential + 0.25*mocSignalPotential + 0.25*pfSignalPotential + 0.25*olcSignalPotential",
      "normalizeTo": "0..1"
    },
    "finalSelectionScore": {
      "formula": "0.30*architecturalSignalPotential + 0.15*operationalCentrality + 0.15*transformationObjectSignal + 0.15*handoffDependencySignal + 0.05*timerWaitSignal + 0.10*synchronizationGovernanceSignal + 0.10*frictionExceptionSignal + 0.05*pfOlcRiskSignal + 0.05*coverageDiversityValue + responsibilityBalanceAdjustment - duplicatePenalty - tooMacroPenalty - tooMicroPenalty - overlySpecificToolPenalty - lateralContextPenalty",
      "normalizeTo": "0..1",
      "notes": [
        "responsibilityBalanceAdjustment no puede exceder 0.05",
        "responsibilityBalanceAdjustment no puede ser criterio primario",
        "balance puede desempatar o corregir miopía, no desplazar señal crítica"
      ]
    }
  },
  "penalties": [
    {
      "key": "duplicatePenalty",
      "max": 0.3,
      "description": "Penaliza duplicados o alias de actividades mejor formuladas."
    },
    {
      "key": "tooMacroPenalty",
      "max": 0.25,
      "description": "Penaliza actividades demasiado amplias que son procesos o responsabilidades enteras."
    },
    {
      "key": "tooMicroPenalty",
      "max": 0.2,
      "description": "Penaliza tareas demasiado pequeñas que no sostienen Runtime 40/20."
    },
    {
      "key": "overlySpecificToolPenalty",
      "max": 0.15,
      "description": "Penaliza actividades muy específicas de herramienta si desplazan actividades más estructurales."
    },
    {
      "key": "lateralContextPenalty",
      "max": 0.2,
      "description": "Penaliza actividades laterales/contextuales cuando compiten contra cadena principal más rica."
    }
  ],
  "responsibilityBalance": {
    "allowed": true,
    "role": "tiebreaker_or_diversity_correction",
    "notAllowedAsPrimaryDriver": true,
    "maxAdjustment": 0.05,
    "warningIfDisplacesCriticalSignal": true,
    "forbiddenGenericReason": "Selected by R2.3 structural score with responsibility balance."
  },
  "specialSlotPolicy": [
    {
      "slot": 1,
      "slotKey": "highest_architectural_signal",
      "selectionRule": "highest architecturalSignalPotential among eligible candidates",
      "reasonCode": "selected_for_high_architectural_signal"
    },
    {
      "slot": 2,
      "slotKey": "highest_transformation_object_signal",
      "selectionRule": "highest transformationObjectSignal not already selected",
      "reasonCode": "selected_for_transformation_object_signal"
    },
    {
      "slot": 3,
      "slotKey": "highest_handoff_timer_signal",
      "selectionRule": "highest max(handoffDependencySignal, timerWaitSignal) not already selected",
      "reasonCode": "selected_for_handoff_timer_signal"
    },
    {
      "slot": 4,
      "slotKey": "highest_governance_synchronization_signal",
      "selectionRule": "highest synchronizationGovernanceSignal not already selected",
      "reasonCode": "selected_for_governance_synchronization_signal"
    },
    {
      "slot": 5,
      "slotKey": "highest_pf_olc_risk_signal",
      "selectionRule": "highest pfOlcRiskSignal not already selected",
      "reasonCode": "selected_for_pf_olc_risk_signal"
    },
    {
      "slot": 6,
      "slotKey": "highest_remaining_score",
      "selectionRule": "highest finalSelectionScore not already selected",
      "reasonCode": "selected_for_high_final_score"
    },
    {
      "slot": 7,
      "slotKey": "coverage_diversity_tiebreaker",
      "selectionRule": "select for responsibility/area diversity only if no critical high-signal candidate is displaced",
      "reasonCode": "selected_for_coverage_diversity_tiebreaker"
    },
    {
      "slot": 8,
      "slotKey": "exploratory_or_useful_ambiguity",
      "selectionRule": "select exploratory candidate with useful ambiguity/friction not covered; otherwise highest remaining score",
      "reasonCode": "selected_for_exploratory_signal"
    }
  ],
  "reasonCodes": {
    "allowed": [
      "included_all_eligible_under_8",
      "selected_for_high_architectural_signal",
      "selected_for_transformation_object_signal",
      "selected_for_handoff_timer_signal",
      "selected_for_governance_synchronization_signal",
      "selected_for_pf_olc_risk_signal",
      "selected_for_friction_exception_signal",
      "selected_for_high_final_score",
      "selected_for_coverage_diversity_tiebreaker",
      "selected_for_exploratory_signal"
    ],
    "forbiddenAsOnlyReason": [
      "Selected by R2.3 structural score with responsibility balance."
    ],
    "requireSpecificReasonText": true
  },
  "traceRequirements": {
    "devTraceMustInclude": [
      "pmSignalPotential",
      "mocSignalPotential",
      "pfSignalPotential",
      "olcSignalPotential",
      "architecturalSignalPotential",
      "operationalCentrality",
      "transformationObjectSignal",
      "handoffDependencySignal",
      "timerWaitSignal",
      "synchronizationGovernanceSignal",
      "frictionExceptionSignal",
      "pfOlcRiskSignal",
      "coverageDiversityValue",
      "responsibilityBalanceAdjustment",
      "penalties",
      "finalSelectionScore",
      "preferredSlotCandidate",
      "selectedSlot",
      "selectionReasonCode",
      "selectionReasonText",
      "responsibilityBalanceAffectedResult"
    ],
    "genericReasonFailsQA": true
  },
  "nonPrimaryContextPolicy": {
    "preserve": true,
    "requiredFields": [
      "activityId",
      "responsibilityId",
      "activityTitle",
      "responsibilityTitle",
      "scores",
      "nonPrimaryContextStatus",
      "contextReason",
      "promotionCondition"
    ],
    "statuses": [
      "not_selected_competitive",
      "context_only_duplicate_or_alias",
      "context_only_too_micro",
      "needs_reentry_too_macro",
      "needs_reentry_generic_responsibility",
      "backlog",
      "context_only"
    ]
  },
  "significadoHandoff": {
    "screen": "Significado de tu Trabajo",
    "rule": "Significado no selecciona. Recibe selectedPrimaryActivities y ejecuta Runtime 40/20 por actividad primaria.",
    "requiredPayloadFields": [
      "policyVersion",
      "selectionMode",
      "selectedPrimaryActivities",
      "nonPrimaryContextActivities",
      "workMapSnapshot",
      "workMapContextPreserved",
      "maxPrimaryActivities",
      "eligibleCount",
      "selectedCount"
    ]
  },
  "b0PrefillGuardrails": {
    "workMapPrefillAllowed": true,
    "workMapInferenceIsNotEvidence": true,
    "b0OperationalDescriptionMustBeConfirmedOrEdited": true,
    "doNotAutoCompleteB0FromWorkMap": true,
    "outputFromWorkMapIsNotConfirmedTargetState": true,
    "inputFromWorkMapIsNotConfirmedTriggerEvent": true,
    "activityIsNotPFTaskUntilRuntime": true,
    "objectIsCandidateNotClass": true
  },
  "qaAssertions": [
    {
      "id": "QA_SELECTION_MODE_UNDER_8",
      "assertion": "Si eligibleCount <= 8, mode debe ser non_competitive_inclusion y no debe aplicarse ranking competitivo."
    },
    {
      "id": "QA_SELECTION_MODE_OVER_8",
      "assertion": "Si eligibleCount > 8, mode debe ser competitive_selection y selectedCount <= 8."
    },
    {
      "id": "QA_NO_GENERIC_SELECTION_REASON",
      "assertion": "Ninguna actividad seleccionada en modo competitivo puede tener como única razón 'Selected by R2.3 structural score with responsibility balance.'"
    },
    {
      "id": "QA_BALANCE_NOT_PRIMARY_DRIVER",
      "assertion": "responsibilityBalanceAdjustment <= 0.05 y no desplaza candidatos con señal crítica alta."
    },
    {
      "id": "QA_SPECIAL_SLOTS_APPLIED",
      "assertion": "La selección competitiva debe registrar selectedSlot y selectionReasonCode por actividad."
    },
    {
      "id": "QA_NON_PRIMARY_CONTEXT_PRESERVED",
      "assertion": "Todas las actividades no seleccionadas deben persistir como nonPrimaryContextActivities."
    },
    {
      "id": "QA_SIGNIFICADO_RUNTIME_HANDOFF",
      "assertion": "Significado debe recibir selectedPrimaryActivities y ejecutar Runtime 40/20; no debe reseleccionar actividades salvo fallback controlado."
    }
  ]
} as const;

export default PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3;
