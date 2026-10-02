import type {
  ConsistencyAlert,
  ConsistencyAlertLevel,
  ConsistencyCheckResult,
} from "@/domain/diagnostics";
import type { MissionOptionId, QuestionnaireAnswer } from "@/domain/questionnaire";
import { missionOptions } from "@/services/mission-inference";

type ConsistencyInput = {
  activityText: string;
  answersByCode: Map<string, QuestionnaireAnswer>;
  missionFinal: MissionOptionId | null;
};

const roleLabels: Record<string, string> = {
  "1": "ejecucion directa",
  "2": "revision o aprobacion",
  "3": "coordinacion",
  "4": "monitoreo",
  "5": "diseno futuro",
};

const destinationLabels: Record<string, string> = {
  "1": "se archiva",
  "2": "se destruye",
  "3": "llega al cliente final",
  "4": "insumo para otro proceso",
};

const freeText = (answer?: QuestionnaireAnswer) =>
  `${answer?.freeText ?? ""}`.trim();

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const containsAny = (value: string, terms: string[]) => {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
};

const wordCount = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

const levelWeight: Record<ConsistencyAlertLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const maxLevel = (alerts: ConsistencyAlert[]): ConsistencyAlertLevel => {
  if (!alerts.length) return "low";

  return alerts.reduce<ConsistencyAlertLevel>((highest, alert) =>
    levelWeight[alert.level] > levelWeight[highest] ? alert.level : highest,
  "low");
};

const addAlert = (
  alerts: ConsistencyAlert[],
  alert: ConsistencyAlert,
) => {
  if (!alerts.some((item) => item.code === alert.code)) {
    alerts.push(alert);
  }
};

const buildClarificationPrompt = ({
  activityText,
  missionLabel,
  roleLabel,
  destinationLabel,
  objectText,
  dependencyText,
}: {
  activityText: string;
  missionLabel: string;
  roleLabel: string;
  destinationLabel: string;
  objectText: string;
  dependencyText: string;
}) => {
  const objectPhrase = objectText || "el resultado de esta actividad";
  const dependencyPhrase = dependencyText || "otra area o proceso";

  return [
    "Aqui hay una mezcla que no nos termina de cerrar.",
    `A lo que me refiero es: la actividad suena relacionada con "${missionLabel}", pero tambien aparece como ${roleLabel} y el resultado queda como "${destinationLabel}".`,
    `Por ejemplo: en "${activityText}", si tu generas "${objectPhrase}" pero todavia depende de ${dependencyPhrase} o sirve para que alguien mas siga el trabajo, entonces necesitamos saber si esto es el cierre real o mas bien una preparacion para otro paso.`,
    "En la practica, que describe mejor esta actividad?",
  ].join("\n");
};

export const runConsistencyCheck = ({
  activityText,
  answersByCode,
  missionFinal,
}: ConsistencyInput): ConsistencyCheckResult => {
  const alerts: ConsistencyAlert[] = [];
  const missionLabel = missionFinal
    ? missionOptions[missionFinal]
    : "mision no determinada";
  const role = answersByCode.get("1.3")?.selectedValue ?? "";
  const roleLabel = roleLabels[role] ?? "rol no claro";
  const destination = answersByCode.get("2.6")?.selectedValue ?? "";
  const destinationLabel = destinationLabels[destination] ?? "destino no claro";
  const objectText = freeText(answersByCode.get("2.1"));
  const dependencyText =
    freeText(answersByCode.get("2.9")) || freeText(answersByCode.get("3.3"));
  const triggerText = freeText(answersByCode.get("3.1"));
  const receiverText = freeText(answersByCode.get("3.3"));
  const clarificationResponse = freeText(
    answersByCode.get("CONSISTENCY_CLARIFICATION"),
  );
  const activityAndObjectText = `${activityText} ${objectText}`;
  const hasExecutionVerb = containsAny(activityAndObjectText, [
    "elaborar",
    "realizar",
    "hacer",
    "generar",
    "crear",
    "producir",
    "convertir",
    "registrar",
    "solicitar",
    "enviar",
  ]);
  const hasSupportVerb = containsAny(activityAndObjectText, [
    "revisar",
    "validar",
    "aprobar",
    "autorizar",
    "coordinar",
    "seguimiento",
    "preparar",
    "habilitar",
    "solicitar",
  ]);
  const operationalMission = missionFinal === "2" || missionFinal === "3";

  if (missionFinal === "2" && destination === "4") {
    addAlert(alerts, {
      code: "creation_mission_but_intermediate_destination",
      level: "high",
      title: "La actividad parece de creacion, pero el resultado queda a medio camino",
      message:
        "La mision inferida apunta a crear o armar algo de valor, pero el resultado aparece como insumo para otro proceso.",
      evidence: [missionLabel, destinationLabel, objectText],
    });
  }

  if (missionFinal === "3" && (destination === "1" || destination === "2")) {
    addAlert(alerts, {
      code: "final_delivery_but_archived_result",
      level: "critical",
      title: "El resultado no parece llegar al cierre que marca la mision",
      message:
        "La mision inferida apunta a entrega final, pero el resultado se archiva o se destruye.",
      evidence: [missionLabel, destinationLabel, objectText],
    });
  }

  if (operationalMission && (role === "2" || role === "3")) {
    addAlert(alerts, {
      code: "operational_mission_but_coordination_or_review_role",
      level: "high",
      title: "La mision y el rol operativo se estan cruzando",
      message:
        "La mision inferida suena operativa, pero el rol declarado se parece mas a coordinacion, revision o aprobacion.",
      evidence: [missionLabel, roleLabel, activityText],
    });
  }

  if (hasExecutionVerb && hasSupportVerb && (role === "2" || role === "3")) {
    addAlert(alerts, {
      code: "execution_verb_but_support_structure",
      level: "medium",
      title: "La redaccion mezcla ejecucion con soporte",
      message:
        "El verbo suena a ejecucion, pero la estructura real de la actividad parece de soporte, validacion o habilitacion.",
      evidence: [activityText, roleLabel],
    });
  }

  if (
    operationalMission &&
    destination === "4" &&
    containsAny(`${triggerText} ${receiverText} ${dependencyText}`, [
      "area",
      "proceso",
      "direccion",
      "gerente",
      "supervisor",
      "mantenimiento",
      "contratista",
      "staff",
    ])
  ) {
    addAlert(alerts, {
      code: "intermediate_flow_but_final_function",
      level: "high",
      title: "El flujo parece intermedio, pero la clasificacion apunta a cierre",
      message:
        "Trigger, receptor o dependencia muestran que la actividad alimenta a alguien mas, aunque la funcion inferida suena a resultado final.",
      evidence: [triggerText, receiverText, dependencyText, destinationLabel],
    });
  }

  const highOrCriticalCount = alerts.filter(
    (alert) => alert.level === "high" || alert.level === "critical",
  ).length;

  if (highOrCriticalCount >= 2 && !alerts.some((alert) => alert.level === "critical")) {
    addAlert(alerts, {
      code: "multiple_strong_crossed_signals",
      level: "critical",
      title: "La actividad tiene varias senales cruzadas al mismo tiempo",
      message:
        "Hay mas de una contradiccion fuerte entre mision, rol, destino y cadena de trabajo.",
      evidence: [missionLabel, roleLabel, destinationLabel, dependencyText],
    });
  }

  const strongestLevel = maxLevel(alerts);
  const hasClarification = wordCount(clarificationResponse) >= 8;
  const clarificationPrompt = buildClarificationPrompt({
    activityText,
    missionLabel,
    roleLabel,
    destinationLabel,
    objectText,
    dependencyText,
  });

  if (!alerts.length) {
    return {
      consistency_check_status: "passed",
      consistency_alert_level: "low",
      consistency_alerts: [],
      closure_quality_status: "solid",
      activity_closure_state: "closed_solid",
      clarification_required: false,
      clarification_prompt: null,
      clarification_reason: null,
      clarification_response: clarificationResponse || null,
      consistency_recheck_status: clarificationResponse ? "passed" : "pending",
    };
  }

  if (strongestLevel === "critical" && !hasClarification) {
    return {
      consistency_check_status: "failed",
      consistency_alert_level: "critical",
      consistency_alerts: alerts,
      closure_quality_status: "blocked_by_critical_contradiction",
      activity_closure_state: "blocked_by_critical_contradiction",
      clarification_required: true,
      clarification_prompt: clarificationPrompt,
      clarification_reason:
        "Contradiccion critica entre mision inferida, rol, destino o posicion en cadena.",
      clarification_response: clarificationResponse || null,
      consistency_recheck_status: "pending",
    };
  }

  if (strongestLevel === "critical" && hasClarification) {
    return {
      consistency_check_status: "warning",
      consistency_alert_level: "medium",
      consistency_alerts: alerts,
      closure_quality_status: "sufficient_with_alerts",
      activity_closure_state: "closed_with_consistency_alerts",
      clarification_required: false,
      clarification_prompt: clarificationPrompt,
      clarification_reason:
        "La aclaracion del usuario contextualiza la contradiccion critica.",
      clarification_response: clarificationResponse,
      consistency_recheck_status: "passed",
    };
  }

  if (strongestLevel === "high") {
    return {
      consistency_check_status: "warning",
      consistency_alert_level: "high",
      consistency_alerts: alerts,
      closure_quality_status: "partial_requires_clarification",
      activity_closure_state: "partial_requires_clarification",
      clarification_required: false,
      clarification_prompt: clarificationPrompt,
      clarification_reason:
        "Contradiccion importante. No bloquea el flujo, pero no permite cierre total.",
      clarification_response: clarificationResponse || null,
      consistency_recheck_status: clarificationResponse ? "passed" : "pending",
    };
  }

  return {
    consistency_check_status: "warning",
    consistency_alert_level: strongestLevel,
    consistency_alerts: alerts,
    closure_quality_status: "sufficient_with_alerts",
    activity_closure_state: "closed_with_consistency_alerts",
    clarification_required: false,
    clarification_prompt: clarificationPrompt,
    clarification_reason:
      "Contradiccion leve o moderada; la actividad sigue siendo entendible.",
    clarification_response: clarificationResponse || null,
    consistency_recheck_status: clarificationResponse ? "passed" : "pending",
  };
};
