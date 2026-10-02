import type {
  MissionType,
  NormalizedActivity,
  RolePurpose,
  StructuralDimension,
} from "@/domain/activity";
import selectionRules from "@/rules/selection-rules.json";

const knownVerbs = [
  "analizar",
  "aprobar",
  "asignar",
  "autorizar",
  "capturar",
  "coordinar",
  "corregir",
  "crear",
  "dar seguimiento",
  "definir",
  "desarrollar",
  "disenar",
  "elaborar",
  "entregar",
  "enviar",
  "evaluar",
  "gestionar",
  "integrar",
  "liberar",
  "monitorear",
  "planificar",
  "procesar",
  "programar",
  "registrar",
  "reportar",
  "resolver",
  "revisar",
  "supervisar",
  "validar",
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const inferVerb = (normalizedText: string) => {
  const matchedVerb = knownVerbs.find((verb) => normalizedText.startsWith(verb));
  if (matchedVerb) return matchedVerb;

  const firstWord = normalizedText.split(" ")[0];
  if (/\b[a-z]{4,}(ar|er|ir)\b/.test(firstWord)) return firstWord;

  return null;
};

const inferBusinessObject = (normalizedText: string, verb: string | null) => {
  const words = normalizedText.split(" ").filter(Boolean);
  const startIndex = verb ? verb.split(" ").length : 1;
  const objectWords = words
    .slice(startIndex)
    .filter((word) => !["con", "para", "por", "a", "al", "de", "del"].includes(word))
    .slice(0, 5);

  return objectWords.length ? objectWords.join(" ") : null;
};

const inferMissionType = (normalizedText: string): MissionType => {
  if (/venta|cliente|comercial|pedido/.test(normalizedText)) return "sales";
  if (/produc|material|mantenimiento|operacion/.test(normalizedText)) return "produce";
  if (/entrega|enviar|despachar|liberar/.test(normalizedText)) return "deliver";
  if (/pago|factura|contable|credito|cobro/.test(normalizedText)) return "money";
  if (/operario|rh|equipo|persona|nomina/.test(normalizedText)) return "people";
  if (/compra|proveedor|orden/.test(normalizedText)) return "procure";
  if (/revisar|validar|control|aprobar|autorizar/.test(normalizedText)) return "control";
  if (/mejora|optimizar|corregir|resolver/.test(normalizedText)) return "improve";
  if (/direccion|definir|decidir|planificar|estrateg/.test(normalizedText)) return "direct";
  return "unknown";
};

const inferRolePurpose = (normalizedText: string): RolePurpose => {
  if (/coordinar|programar|dar seguimiento|integrar/.test(normalizedText)) {
    return "s2_coordinate";
  }
  if (/aprobar|autorizar|validar|firma/.test(normalizedText)) {
    return "s3_approve";
  }
  if (/monitorear|supervisar|controlar|auditar|revisar/.test(normalizedText)) {
    return "s3_monitor";
  }
  if (/disenar|mejorar|planificar|optimizar|desarrollar/.test(normalizedText)) {
    return "s4_design";
  }
  if (/direccion|decidir|definir|establecer/.test(normalizedText)) {
    return "s5_direct";
  }
  if (/registrar|procesar|elaborar|entregar|enviar|capturar/.test(normalizedText)) {
    return "s1_execute";
  }
  return "unknown";
};

const detectSignals = (normalizedText: string) => {
  const dimensions = selectionRules.dimensions as Record<
    StructuralDimension,
    { signals: string[] }
  >;

  return Object.fromEntries(
    Object.entries(dimensions).map(([dimension, config]) => [
      dimension,
      config.signals.filter((signal) => normalizedText.includes(normalize(signal))),
    ]),
  ) as Record<StructuralDimension, string[]>;
};

export function normalizeActivity(input: {
  id: string;
  rawText: string;
}): NormalizedActivity {
  const normalizedText = normalize(input.rawText);
  const operationVerb = inferVerb(normalizedText);

  return {
    id: input.id,
    rawText: input.rawText,
    operationVerb,
    businessObject: inferBusinessObject(normalizedText, operationVerb),
    missionType: inferMissionType(normalizedText),
    rolePurpose: inferRolePurpose(normalizedText),
    detectedSignals: detectSignals(normalizedText),
  };
}

export function normalizeActivities(
  activities: Array<{ id: string; rawText: string }>,
) {
  return activities.map(normalizeActivity);
}
