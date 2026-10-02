import type {
  MissionEvidence,
  MissionInferenceResult,
  MissionOptionId,
  QuestionnaireAnswer,
} from "@/domain/questionnaire";

type WeightedSource = {
  questionCode: string;
  weight: number;
};

type ClassifiedSource = {
  option: MissionOptionId;
  reason: string;
};

export const missionOptions: Record<MissionOptionId, string> = {
  "1": "Conseguir clientes o vender",
  "2": "Crear, fabricar o armar lo que vendemos",
  "3": "Entregar al cliente o hacer que funcione",
  "4": "Cobrar, pagar o cuidar el dinero",
  "5": "Contratar, capacitar o cuidar al personal",
  "6": "Comprar insumos o mantener las herramientas",
  "7": "Revisar que las cosas se hagan bien o sin riesgos",
  "8": "Investigar, inventar o mejorar para el futuro",
  "9": "Dirigir, poner metas o dar la cara por la empresa",
};

const sourceWeights: WeightedSource[] = [
  { questionCode: "1.1", weight: 0.2 },
  { questionCode: "1.3", weight: 0.15 },
  { questionCode: "2.1", weight: 0.15 },
  { questionCode: "2.6", weight: 0.1 },
  { questionCode: "2.9", weight: 0.1 },
  { questionCode: "3.1", weight: 0.1 },
  { questionCode: "3.3", weight: 0.1 },
  { questionCode: "3.4", weight: 0.1 },
];

const emptyScores = (): Record<MissionOptionId, number> => ({
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
  "6": 0,
  "7": 0,
  "8": 0,
  "9": 0,
});

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const containsAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const classifyText = (text: string): ClassifiedSource | null => {
  const normalized = normalize(text);

  const rules: Array<{
    option: MissionOptionId;
    keywords: string[];
    reason: string;
  }> = [
    {
      option: "1",
      keywords: ["cliente", "venta", "vender", "cotizacion", "prospecto"],
      reason: "La evidencia menciona cliente, venta o prospeccion comercial.",
    },
    {
      option: "2",
      keywords: [
        "fabricar",
        "armar",
        "elaborar",
        "producir",
        "crear",
        "desarrollar",
        "planos",
        "propuesta",
        "formato",
        "entregable",
      ],
      reason: "La evidencia describe creacion o transformacion de entregables.",
    },
    {
      option: "3",
      keywords: ["entregar", "instalar", "servicio", "funcione", "operar"],
      reason: "La evidencia apunta a entrega, puesta en marcha o servicio.",
    },
    {
      option: "4",
      keywords: ["cobrar", "pagar", "factura", "presupuesto", "dinero"],
      reason: "La evidencia se relaciona con dinero, cobro o pagos.",
    },
    {
      option: "5",
      keywords: ["personal", "contratar", "capacitar", "nomina", "rh"],
      reason: "La evidencia se relaciona con personal o recursos humanos.",
    },
    {
      option: "6",
      keywords: ["comprar", "proveedor", "insumo", "material", "herramienta"],
      reason: "La evidencia apunta a compras, proveedores o insumos.",
    },
    {
      option: "7",
      keywords: [
        "revisar",
        "validar",
        "autorizar",
        "aprobar",
        "auditar",
        "inspeccionar",
        "riesgo",
        "calidad",
      ],
      reason: "La evidencia describe revision, control, aprobacion o riesgo.",
    },
    {
      option: "8",
      keywords: ["investigar", "inventar", "mejorar", "futuro", "innovar"],
      reason: "La evidencia apunta a mejora, investigacion o diseno futuro.",
    },
    {
      option: "9",
      keywords: ["dirigir", "meta", "direccion", "director", "dg", "estrategia"],
      reason: "La evidencia menciona direccion, metas o representacion.",
    },
  ];

  return (
    rules.find((rule) => containsAny(normalized, rule.keywords)) ?? null
  );
};

const classifyAnswer = (answer: QuestionnaireAnswer): ClassifiedSource | null => {
  const value = `${answer.selectedValue ?? ""} ${answer.freeText ?? ""}`.trim();

  if (!value) return null;

  if (answer.questionCode === "1.3") {
    const roleMap: Record<string, ClassifiedSource> = {
      "1": {
        option: "2",
        reason: "El rol declarado es ejecutar trabajo final.",
      },
      "2": {
        option: "7",
        reason: "El rol declarado es revisar o aprobar trabajo de otros.",
      },
      "3": {
        option: "7",
        reason: "El rol declarado es coordinar para evitar choques.",
      },
      "4": {
        option: "7",
        reason: "El rol declarado es monitorear o medir funcionamiento.",
      },
      "5": {
        option: "8",
        reason: "El rol declarado es disenar como se hara en el futuro.",
      },
    };

    return answer.selectedValue ? roleMap[answer.selectedValue] ?? null : null;
  }

  if (answer.questionCode === "2.6") {
    const destinationMap: Record<string, ClassifiedSource> = {
      "1": {
        option: "7",
        reason: "El destino del objeto es archivo y control documental.",
      },
      "2": {
        option: "7",
        reason: "El destino del objeto es descarte o destruccion controlada.",
      },
      "3": {
        option: "3",
        reason: "El objeto llega al cliente final.",
      },
      "4": {
        option: "2",
        reason: "El objeto se vuelve insumo para otro proceso.",
      },
    };

    return answer.selectedValue
      ? destinationMap[answer.selectedValue] ?? null
      : null;
  }

  return classifyText(value);
};

const detectConflicts = (
  answersByCode: Map<string, QuestionnaireAnswer>,
  dominant: MissionOptionId | null,
) => {
  const conflicts: string[] = [];
  const text = (code: string) => {
    const answer = answersByCode.get(code);
    return normalize(`${answer?.selectedValue ?? ""} ${answer?.freeText ?? ""}`);
  };

  const q11 = text("1.1");
  const q13 = answersByCode.get("1.3")?.selectedValue;
  const q21 = text("2.1");
  const q26 = answersByCode.get("2.6")?.selectedValue;
  const q29 = text("2.9");
  const q33 = text("3.3");
  const q34 = text("3.4");

  const operationalEvidence =
    containsAny(`${q11} ${q21} ${q33}`, [
      "elaborar",
      "fabricar",
      "armar",
      "producir",
      "planos",
      "propuesta",
      "entregable",
    ]) && dominant !== "2";

  if ((q13 === "5" || q13 === "4") && operationalEvidence) {
    conflicts.push(
      "1.3 sugiere diseno futuro o monitoreo, pero 1.1, 2.1 y 3.3 describen transformacion operativa directa.",
    );
  }

  if ((q26 === "1" || q26 === "2") && dominant === "3") {
    conflicts.push(
      "2.6 indica archivo o destruccion, pero la mision inferida apunta a entrega final al cliente.",
    );
  }

  if (containsAny(q29, ["insumo", "intermedio"]) && containsAny(q34, ["cliente"])) {
    conflicts.push(
      "2.9 indica insumo intermedio, pero 3.4 sugiere que el cliente final notaria la ausencia.",
    );
  }

  if (
    containsAny(q34, ["nadie", "ninguno", "no se daria cuenta"]) &&
    (dominant === "1" || dominant === "3")
  ) {
    conflicts.push(
      "3.4 indica que nadie se daria cuenta, pero la mision inferida es central de venta, entrega o servicio.",
    );
  }

  if (
    containsAny(q11, ["revisar", "validar", "auditar", "aprobar"]) &&
    (dominant === "2" || dominant === "3")
  ) {
    conflicts.push(
      "1.1 describe revision, auditoria o aprobacion, pero la mision inferida es fabricacion o entrega final.",
    );
  }

  return conflicts;
};

export const inferMissionForActivity = ({
  activityId,
  answers,
  missionUserOverride = null,
  missionUserConfirmationStatus,
}: {
  activityId: string;
  answers: QuestionnaireAnswer[];
  missionUserOverride?: MissionOptionId | null;
  missionUserConfirmationStatus?: "not_requested" | "confirmed" | "corrected";
}): MissionInferenceResult => {
  const activityAnswers = answers.filter(
    (answer) => answer.activityId === activityId,
  );
  const answersByCode = new Map(
    activityAnswers.map((answer) => [answer.questionCode, answer]),
  );
  const mission_score_by_option = emptyScores();
  const mission_evidence: MissionEvidence[] = [];

  sourceWeights.forEach((source) => {
    const answer = answersByCode.get(source.questionCode);
    if (!answer) return;

    const classification = classifyAnswer(answer);
    if (!classification) return;

    mission_score_by_option[classification.option] += source.weight;
    mission_evidence.push({
      questionCode: source.questionCode,
      fragment: answer.freeText ?? answer.selectedValue ?? "",
      inferredOption: classification.option,
      weight: source.weight,
      reason: classification.reason,
    });
  });

  const rankedOptions = Object.entries(mission_score_by_option).sort(
    ([, left], [, right]) => right - left,
  ) as Array<[MissionOptionId, number]>;
  const [dominantOption, dominantScore] = rankedOptions[0];
  const secondScore = rankedOptions[1]?.[1] ?? 0;
  const usefulTotal = mission_evidence.reduce(
    (total, evidence) => total + evidence.weight,
    0,
  );
  const dominanceRatio = usefulTotal ? dominantScore / usefulTotal : 0;
  const mission_inferred_by_ai = dominantScore > 0 ? dominantOption : null;
  const mission_conflict_flags = detectConflicts(
    answersByCode,
    mission_inferred_by_ai,
  );
  const hasStrongConflict = mission_conflict_flags.length > 0;
  const hasCloseSecond = dominantScore - secondScore <= 0.1 && secondScore > 0;
  const missingKeySources = ["2.1", "2.9", "3.3"].filter(
    (code) => !answersByCode.get(code),
  ).length;

  let mission_confidence: MissionInferenceResult["mission_confidence"] = "low";

  if (
    dominanceRatio >= 0.7 &&
    !hasStrongConflict &&
    !hasCloseSecond &&
    missingKeySources < 2
  ) {
    mission_confidence = "high";
  } else if (
    dominanceRatio >= 0.45 &&
    !hasStrongConflict &&
    missingKeySources < 3
  ) {
    mission_confidence = "medium";
  }

  const mission_user_confirmation_status =
    missionUserConfirmationStatus ??
    (mission_confidence === "high" ? "not_requested" : "not_requested");
  const mission_user_override =
    mission_user_confirmation_status === "corrected"
      ? missionUserOverride
      : null;
  const mission_final =
    mission_user_override ?? mission_inferred_by_ai ?? missionUserOverride;

  return {
    mission_inferred_by_ai,
    mission_score_by_option,
    mission_conflict_flags,
    mission_confidence,
    mission_confidence_reason:
      mission_confidence === "high"
        ? "La evidencia disponible apunta consistentemente a una sola mision y no hay contradicciones fuertes."
        : mission_confidence === "medium"
          ? "La evidencia sugiere una mision dominante, pero requiere confirmacion ligera por cercania, ambiguedad o evidencia incompleta."
          : "La evidencia es insuficiente, ambigua o presenta conflictos; se requiere seleccion asistida.",
    mission_evidence,
    mission_user_confirmation_status,
    mission_user_override,
    mission_final,
  };
};
