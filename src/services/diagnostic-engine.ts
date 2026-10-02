import type {
  ActivityDiagnostic,
  ConsistencyCheckResult,
  DiagnosticFinding,
  DiagnosticSignal,
  SessionDiagnostic,
} from "@/domain/diagnostics";
import type { MissionOptionId, QuestionnaireAnswer } from "@/domain/questionnaire";
import { runConsistencyCheck } from "@/services/consistency-checker";
import { inferMissionForActivity, missionOptions } from "@/services/mission-inference";

type StoredActivity = {
  id: string;
  ancla_narrativa: string;
};

const answerText = (answer?: QuestionnaireAnswer) =>
  `${answer?.selectedValue ?? ""} ${answer?.freeText ?? ""}`.trim();

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const containsAny = (value: string, terms: string[]) => {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(term));
};

const buildAnswerMap = (answers: QuestionnaireAnswer[]) =>
  new Map(answers.map((answer) => [answer.questionCode, answer]));

const signal = ({
  code,
  label,
  value,
  evidence,
}: DiagnosticSignal): DiagnosticSignal => ({
  code,
  label,
  value,
  evidence: evidence.filter(Boolean),
});

const inferRoleSignal = (answersByCode: Map<string, QuestionnaireAnswer>) => {
  const role = answersByCode.get("1.3")?.selectedValue;
  const map: Record<string, string> = {
    "1": "Ejecucion directa",
    "2": "Revision o aprobacion",
    "3": "Coordinacion",
    "4": "Monitoreo",
    "5": "Diseno futuro",
  };

  return signal({
    code: "role_purpose",
    label: "Rol o proposito operativo",
    value: role ? map[role] ?? "No claro" : "No respondido",
    evidence: [answerText(answersByCode.get("1.3"))],
  });
};

const inferObjectSignal = (answersByCode: Map<string, QuestionnaireAnswer>) =>
  signal({
    code: "business_object",
    label: "Objeto o resultado del trabajo",
    value: answersByCode.get("2.1")?.freeText || "No identificado",
    evidence: [
      answerText(answersByCode.get("1.1")),
      answerText(answersByCode.get("2.1")),
    ],
  });

const inferDependencySignal = (answersByCode: Map<string, QuestionnaireAnswer>) =>
  signal({
    code: "dependency",
    label: "Dependencia o integracion",
    value:
      answersByCode.get("2.9")?.freeText ||
      answersByCode.get("3.3")?.freeText ||
      "No identificada",
    evidence: [
      answerText(answersByCode.get("2.9")),
      answerText(answersByCode.get("3.3")),
    ],
  });

const inferDestinationSignal = (answersByCode: Map<string, QuestionnaireAnswer>) => {
  const destination = answersByCode.get("2.6")?.selectedValue;
  const map: Record<string, string> = {
    "1": "Se archiva",
    "2": "Se destruye",
    "3": "Llega al cliente final",
    "4": "Insumo para otro proceso",
  };

  return signal({
    code: "object_destination",
    label: "Destino del resultado",
    value: destination ? map[destination] ?? "No claro" : "No respondido",
    evidence: [answerText(answersByCode.get("2.6"))],
  });
};

const detectFindings = ({
  answersByCode,
  missionFinal,
  missionLabel,
}: {
  answersByCode: Map<string, QuestionnaireAnswer>;
  missionFinal: MissionOptionId | null;
  missionLabel: string;
}) => {
  const findings: DiagnosticFinding[] = [];
  const q11 = answerText(answersByCode.get("1.1"));
  const q13 = answersByCode.get("1.3")?.selectedValue ?? "";
  const q21 = answerText(answersByCode.get("2.1"));
  const q26 = answersByCode.get("2.6")?.selectedValue ?? "";
  const q29 = answerText(answersByCode.get("2.9"));
  const q33 = answerText(answersByCode.get("3.3"));
  const q34 = answerText(answersByCode.get("3.4"));
  const q15 = answersByCode.get("1.5")?.selectedValue ?? "";
  const q16 = answersByCode.get("1.6")?.selectedValue ?? "";

  if (
    (q16 === "3" || q16 === "4") &&
    (q15 === "1" || q15 === "4")
  ) {
    findings.push({
      code: "formal_vs_real_gap",
      severity: "warning",
      title: "Brecha entre trabajo real y control formal",
      explanation:
        "La actividad parece depender de ajustes reales que no estan completamente reflejados en el procedimiento o canal formal.",
      evidence: [answerText(answersByCode.get("1.5")), answerText(answersByCode.get("1.6"))],
    });
  }

  if (
    missionFinal === "3" &&
    (q26 === "1" || q26 === "2")
  ) {
    findings.push({
      code: "delivery_destination_conflict",
      severity: "critical",
      title: "La mision de entrega contradice el destino del resultado",
      explanation:
        "La actividad fue clasificada como entrega al cliente, pero el resultado se archiva o destruye.",
      evidence: [missionLabel, answerText(answersByCode.get("2.6"))],
    });
  }

  if (
    containsAny(q11, ["revisar", "validar", "auditar", "aprobar"]) &&
    (missionFinal === "2" || missionFinal === "3")
  ) {
    findings.push({
      code: "review_vs_transformation_conflict",
      severity: "warning",
      title: "La actividad parece mas regulatoria que transformadora",
      explanation:
        "La descripcion habla de revision o aprobacion, pero la mision funcional apunta a crear o entregar.",
      evidence: [q11, missionLabel],
    });
  }

  if (
    q13 === "5" &&
    containsAny(`${q11} ${q21} ${q33}`, [
      "elaborar",
      "revisar",
      "validar",
      "capturar",
      "registrar",
      "enviar",
    ])
  ) {
    findings.push({
      code: "future_design_vs_daily_execution",
      severity: "warning",
      title: "Rol declarado de diseno futuro con evidencia operativa",
      explanation:
        "El rol declarado sugiere diseno futuro, pero la evidencia describe trabajo operativo o transaccional.",
      evidence: [answerText(answersByCode.get("1.3")), q11, q21, q33],
    });
  }

  if (
    containsAny(q29, ["insumo", "intermedio", "depende"]) &&
    containsAny(q34, ["cliente final", "cliente"])
  ) {
    findings.push({
      code: "intermediate_object_customer_absence",
      severity: "warning",
      title: "Tension entre insumo intermedio y visibilidad del cliente",
      explanation:
        "El resultado parece ser un insumo intermedio, pero la ausencia seria visible para el cliente.",
      evidence: [q29, q34],
    });
  }

  return findings;
};

const computeClosure = ({
  answersByCode,
  findings,
  consistency,
}: {
  answersByCode: Map<string, QuestionnaireAnswer>;
  findings: DiagnosticFinding[];
  consistency: ConsistencyCheckResult;
}) => {
  const dimensions = {
    pm: ["1.1", "3.1"],
    moc: ["2.1", "2.2"],
    pf: ["3.1", "3.3", "3.4"],
    olc: ["2.3", "2.5", "2.6"],
    vsm: ["1.3", "1.5", "1.6"],
    ahe: ["5.8", "5.9", "5.10"],
  };
  const missingCapabilities = Object.entries(dimensions)
    .filter(([, codes]) =>
      codes.some((code) => !answerText(answersByCode.get(code))),
    )
    .map(([dimension]) => dimension);
  const coverage =
    (Object.keys(dimensions).length - missingCapabilities.length) /
    Object.keys(dimensions).length;
  const hasCritical = findings.some((finding) => finding.severity === "critical");

  if (
    consistency.closure_quality_status ===
    "blocked_by_critical_contradiction"
  ) {
    return {
      status: "gap_requires_support" as const,
      confidence: Math.min(0.5, Math.round(coverage * 100) / 100),
      missingCapabilities,
      closure_quality_status: consistency.closure_quality_status,
      activity_closure_state: consistency.activity_closure_state,
    };
  }

  if (
    consistency.closure_quality_status === "partial_requires_clarification"
  ) {
    return {
      status: "partial" as const,
      confidence: Math.min(0.84, Math.round(coverage * 100) / 100),
      missingCapabilities,
      closure_quality_status: consistency.closure_quality_status,
      activity_closure_state: consistency.activity_closure_state,
    };
  }

  if (hasCritical || coverage < 0.55) {
    return {
      status: "gap_requires_support" as const,
      confidence: Math.round(coverage * 100) / 100,
      missingCapabilities,
      closure_quality_status: consistency.closure_quality_status,
      activity_closure_state: consistency.activity_closure_state,
    };
  }

  if (coverage < 0.85 || findings.length > 0) {
    return {
      status: "partial" as const,
      confidence: Math.round(coverage * 100) / 100,
      missingCapabilities,
      closure_quality_status: consistency.closure_quality_status,
      activity_closure_state:
        consistency.activity_closure_state === "closed_solid"
          ? "partial_requires_clarification"
          : consistency.activity_closure_state,
    };
  }

  return {
    status: "closed" as const,
    confidence: Math.round(coverage * 100) / 100,
    missingCapabilities,
    closure_quality_status: consistency.closure_quality_status,
    activity_closure_state: consistency.activity_closure_state,
  };
};

export const buildSessionDiagnostic = ({
  sessionId,
  activities,
  answers,
}: {
  sessionId: string;
  activities: StoredActivity[];
  answers: QuestionnaireAnswer[];
}): SessionDiagnostic => {
  const activityDiagnostics = activities.map((activity): ActivityDiagnostic => {
    const activityAnswers = answers.filter(
      (answer) => answer.activityId === activity.id,
    );
    const answersByCode = buildAnswerMap(activityAnswers);
    const mission = inferMissionForActivity({
      activityId: activity.id,
      answers: activityAnswers,
    });
    const missionLabel = mission.mission_final
      ? missionOptions[mission.mission_final]
      : "Mision no determinada";
    const findings = [
      ...mission.mission_conflict_flags.map(
        (flag): DiagnosticFinding => ({
          code: "mission_conflict",
          severity: "warning",
          title: "Conflicto en clasificacion funcional",
          explanation: flag,
          evidence: mission.mission_evidence.map(
            (evidence) => `${evidence.questionCode}: ${evidence.fragment}`,
          ),
        }),
      ),
      ...detectFindings({
        answersByCode,
        missionFinal: mission.mission_final,
        missionLabel,
      }),
    ];
    const consistency = runConsistencyCheck({
      activityText: activity.ancla_narrativa,
      answersByCode,
      missionFinal: mission.mission_final,
    });
    const closure = computeClosure({ answersByCode, findings, consistency });

    return {
      activityId: activity.id,
      activityText: activity.ancla_narrativa,
      mission,
      signals: [
        signal({
          code: "mission_final",
          label: "Mision funcional inferida",
          value: missionLabel,
          evidence: mission.mission_evidence.map(
            (evidence) => `${evidence.questionCode}: ${evidence.fragment}`,
          ),
        }),
        inferRoleSignal(answersByCode),
        inferObjectSignal(answersByCode),
        inferDestinationSignal(answersByCode),
        inferDependencySignal(answersByCode),
      ],
      findings,
      consistency,
      closure,
    };
  });

  return {
    sessionId,
    generatedAt: new Date().toISOString(),
    activityCount: activityDiagnostics.length,
    summary: {
      closed: activityDiagnostics.filter(
        (activity) => activity.closure.status === "closed",
      ).length,
      partial: activityDiagnostics.filter(
        (activity) => activity.closure.status === "partial",
      ).length,
      gapRequiresSupport: activityDiagnostics.filter(
        (activity) => activity.closure.status === "gap_requires_support",
      ).length,
      criticalFindings: activityDiagnostics.flatMap((activity) =>
        activity.findings.filter((finding) => finding.severity === "critical"),
      ).length,
      warningFindings: activityDiagnostics.flatMap((activity) =>
        activity.findings.filter((finding) => finding.severity === "warning"),
      ).length,
    },
    activities: activityDiagnostics,
  };
};
