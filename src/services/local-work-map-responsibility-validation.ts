export const responsibilityVerbs = [
  "defino",
  "apruebo",
  "autorizo",
  "decido",
  "priorizo",
  "valido",
  "verifico",
  "regulo",
  "ajusto",
  "establezco",
  "asigno",
  "libero",
  "informo",
  "escalo",
  "evaluo",
  "audito",
  "sincronizo",
  "negocio",
  "coordino",
  "reviso",
];

/** Orientative examples only — not a validation whitelist. */
const exampleObjectSignals = [
  "candidato",
  "programa",
  "descuento",
  "presupuesto",
  "inventario",
  "proveedor",
  "material",
  "reporte",
  "equipo",
  "autorizacion",
  "solicitud",
  "cliente",
  "entrega",
  "proceso",
  "operacion",
  "riesgo",
  "calidad",
  "produccion",
  "venta",
  "pedido",
];

const purposeSignals = [
  "para asegurar",
  "para cerrar",
  "para verificar",
  "para generar",
  "para entregar",
  "para liberar",
  "para mantener",
  "para mejorar",
  "para vender",
  "para ",
  "con el fin de",
  "a fin de",
];

const scopeOrCriterionMarkers = [
  "segun",
  "de acuerdo con",
  "conforme a",
  "dentro de",
  "dentro del",
  "cuando",
  "bajo",
  "sin afectar",
  "si cumple",
  "cuando cubren",
  "margen permitido",
  "capacidad disponible",
  "condiciones del puesto",
  "criterio",
  "limite",
  "marco",
  "politica",
  "regla",
  "restriccion",
  "ambito",
  "contexto",
  "temporalidad",
];

const OBJECT_CLARITY_MESSAGE =
  "Falta indicar con mas claridad sobre que respondes.";

const VAGUE_OBJECT_TOKENS = new Set([
  "cosas",
  "algo",
  "todo",
  "temas",
  "asuntos",
  "resultados",
  "actividades",
  "tareas",
  "areas",
  "aspectos",
  "elementos",
  "puntos",
]);

const OBJECT_STOP_WORDS = new Set([
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "en",
  "y",
  "o",
  "a",
  "al",
  "con",
  "su",
  "sus",
  "mi",
  "mis",
  "que",
  "se",
  "lo",
]);

export type ResponsibilitySemanticCategory =
  | "insufficient"
  | "sufficient"
  | "perfectible";

export type ResponsibilityValidationResult = {
  valid: boolean;
  messages: string[];
};

const GENERIC_PURPOSE_PATTERNS = [
  /para\s+vender\s+mas\b/,
  /para\s+mejorar\s+resultados\b/,
  /para\s+que\s+todo\s+funcione\b/,
];

export type ResponsibilityStructureParts = {
  hasSubject: boolean;
  hasDecision: boolean;
  objectSection: string;
  purposeSection: string;
  scopeOrCriterionSection: string;
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findPurposeSectionStart(normalized: string) {
  let earliest = normalized.length;

  for (const signal of purposeSignals) {
    const index = normalized.indexOf(signal);
    if (index !== -1 && index < earliest) {
      earliest = index;
    }
  }

  return earliest;
}

function extractPostVerbSection(normalized: string) {
  const withoutYo = normalized.replace(/^yo\s+/, "");
  const sortedVerbs = [...responsibilityVerbs].sort(
    (left, right) => right.length - left.length,
  );

  for (const verb of sortedVerbs) {
    const match = new RegExp(`\\b${verb}\\b`).exec(withoutYo);
    if (!match) continue;

    let remainder = withoutYo.slice(match.index + match[0].length).trim();

    let changed = true;
    while (changed) {
      changed = false;
      for (const chainedVerb of sortedVerbs) {
        const chainedMatch = new RegExp(
          `^(?:y|o)\\s+${chainedVerb}\\b`,
        ).exec(remainder);
        if (chainedMatch) {
          remainder = remainder.slice(chainedMatch[0].length).trim();
          changed = true;
        }
      }
    }

    return remainder;
  }

  return "";
}

function getResponsibilityObjectSection(normalized: string) {
  const postVerb = extractPostVerbSection(normalized);
  if (!postVerb) return "";

  const purposeStartInPostVerb = findPurposeSectionStart(postVerb);
  return postVerb.slice(0, purposeStartInPostVerb).trim();
}

export function getResponsibilityStructureParts(
  text: string,
): ResponsibilityStructureParts {
  const normalized = normalizeText(text.trim());
  const postVerb = extractPostVerbSection(normalized);
  const purposeStartInPostVerb = postVerb
    ? findPurposeSectionStart(postVerb)
    : normalized.length;
  const objectSection = postVerb.slice(0, purposeStartInPostVerb).trim();
  const afterObject = postVerb.slice(purposeStartInPostVerb).trim();

  const purposeStartInAfterObject = findPurposeSectionStart(afterObject);
  const purposeSection =
    purposeStartInAfterObject < afterObject.length
      ? afterObject.slice(0, purposeStartInAfterObject).trim()
      : "";
  const scopeOrCriterionSection = afterObject.slice(purposeStartInAfterObject).trim();

  return {
    hasSubject: /\byo\b/.test(normalized),
    hasDecision: responsibilityVerbs.some((verb) =>
      new RegExp(`\\b${verb}\\b`).test(normalized),
    ),
    objectSection,
    purposeSection,
    scopeOrCriterionSection,
  };
}

export function detectResponsibilityParts(text: string) {
  const parts = getResponsibilityStructureParts(text);
  return {
    subject: parts.hasSubject,
    decision: parts.hasDecision,
    object: hasStructuralResponsibilityObject(normalizeText(text.trim())),
    purpose: hasPurposeSignal(normalizeText(text.trim())),
    scopeOrCriterion: hasResponsibilityScopeOrCriterion(
      normalizeText(text.trim()),
      parts,
    ),
  };
}

export function hasStructuralResponsibilityObject(normalized: string) {
  const objectSection = getResponsibilityObjectSection(normalized);
  if (!objectSection) return false;

  const tokens = objectSection.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  if (tokens[0] === "para" || tokens[0] === "sin") return false;

  const substantiveTokens = tokens.filter(
    (token) => token.length >= 3 && !OBJECT_STOP_WORDS.has(token),
  );

  if (!substantiveTokens.length) return false;

  if (substantiveTokens.every((token) => VAGUE_OBJECT_TOKENS.has(token))) {
    return false;
  }

  return true;
}

function hasPurposeSignal(normalized: string) {
  return purposeSignals.some((signal) => normalized.includes(signal));
}

function hasOperationalScopePattern(section: string) {
  if (!section) return false;

  if (/\ben (el|la|los|las) [a-z0-9]{2,}\b/.test(section)) {
    return true;
  }

  if (/\b(en|desde|hacia|sobre) (mi|nuestr[oa]s?|su|sus) \w+/i.test(section)) {
    return true;
  }

  return false;
}

export function hasResponsibilityScopeOrCriterion(
  normalized: string,
  parts?: ResponsibilityStructureParts,
) {
  const structure = parts ?? getResponsibilityStructureParts(normalized);
  const postVerb = extractPostVerbSection(normalized);
  if (!postVerb) return false;

  const searchableSections = [
    structure.objectSection,
    structure.purposeSection,
    structure.scopeOrCriterionSection,
    postVerb,
  ].filter(Boolean);

  for (const section of searchableSections) {
    if (scopeOrCriterionMarkers.some((marker) => section.includes(marker))) {
      return true;
    }

    if (hasOperationalScopePattern(section)) {
      return true;
    }
  }

  return false;
}

function summarizeObjectPhrase(objectSection: string) {
  const cleaned = objectSection
    .replace(/\ben (el|la|los|las) [a-z0-9]+\b.*$/i, "")
    .trim()
    .replace(/^(las?|los?)\s+/, "")
    .trim();

  return cleaned || objectSection.trim() || "tu objeto de responsabilidad";
}

const VERB_RECOGNITION_PHRASES: Record<string, string> = {
  defino: "defines",
  autorizo: "autorizas",
  apruebo: "apruebas",
  coordino: "coordinas",
  valido: "validas",
  reviso: "revisas",
  priorizo: "priorizas",
  verifico: "verificas",
  regulo: "regulas",
  decido: "decides",
};

function getPrimaryDecisionVerb(normalized: string) {
  const orderedVerbs = getOrderedDecisionVerbs(normalized);
  return orderedVerbs[0] ?? "";
}

function getOrderedDecisionVerbs(normalized: string) {
  const found: Array<{ verb: string; index: number }> = [];

  for (const verb of responsibilityVerbs) {
    const match = new RegExp(`\\b${verb}\\b`).exec(normalized);
    if (match) {
      found.push({ verb, index: match.index });
    }
  }

  return found
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.verb);
}

function getDecisionRecognitionPhrase(normalized: string) {
  const verbs = getOrderedDecisionVerbs(normalized);

  if (!verbs.length) {
    return "que decides";
  }

  const phrases = verbs.map(
    (verb) => VERB_RECOGNITION_PHRASES[verb] ?? `realizas ${verb}`,
  );

  if (phrases.length === 1) {
    return `que ${phrases[0]}`;
  }

  return `que ${phrases.slice(0, -1).join(", ")} y ${phrases[phrases.length - 1]}`;
}

function preserveResponsibilityObjectPhrase(
  originalText: string,
  objectSection: string,
) {
  const normalizedObject = objectSection.trim();
  if (!normalizedObject) {
    return summarizeObjectPhrase(objectSection);
  }

  const normalizedOriginal = normalizeText(originalText.trim());
  const objectStart = normalizedOriginal.indexOf(normalizedObject);
  if (objectStart === -1) {
    return summarizeObjectPhrase(objectSection);
  }

  const phrase = originalText
    .trim()
    .slice(objectStart)
    .replace(/\.$/, "")
    .trim();

  return phrase || summarizeObjectPhrase(objectSection);
}

function presentationObjectPhrase(objectSection: string) {
  return summarizeObjectPhrase(objectSection)
    .replace(/\.$/, "")
    .replace(/^(las?|los?)\s+/, "")
    .trim();
}

function buildDetectedResponsibilityPrefix(
  normalized: string,
  parts: ResponsibilityStructureParts,
  hasObject: boolean,
  hasPurpose: boolean,
) {
  if (parts.hasSubject && parts.hasDecision && hasObject) {
    return "Ya indicas qué decisión ejerces y sobre qué trabajas.";
  }

  if (parts.hasSubject && parts.hasDecision) {
    return "Ya indicas una intención general.";
  }

  if (parts.hasSubject) {
    return "";
  }

  if (parts.hasDecision) {
    return `Ya indicas ${getDecisionRecognitionPhrase(normalized)}.`;
  }

  return "";
}

function buildMissingResponsibilityGuidance(
  normalized: string,
  parts: ResponsibilityStructureParts,
  hasObject: boolean,
  hasPurpose: boolean,
) {
  if (!hasObject && !hasPurpose) {
    return "Falta aclarar sobre qué respondes y qué decisión, validación o criterio ejerces.";
  }

  if (!hasObject) {
    if (!hasPurpose || isGenericPurpose(normalized)) {
      return "Falta aclarar sobre qué respondes y qué decisión, validación o criterio ejerces.";
    }
    return "Falta aclarar sobre qué respondes.";
  }

  if (!hasPurpose) {
    if (hasObject) {
      return "Falta indicar para qué sirve esta responsabilidad y, si lo tienes claro, cuál es el límite de esta responsabilidad.";
    }
    return "Falta indicar para qué sirve esta responsabilidad.";
  }

  if (isResponsibilityTooOpen(normalized, parts)) {
    return "Falta indicar el límite o criterio con el que aplicas esa decisión.";
  }

  return "";
}

function buildStructuralResponsibilityAssistMessage(
  normalized: string,
  parts: ResponsibilityStructureParts,
) {
  const hasObject = hasStructuralResponsibilityObject(normalized);
  const hasPurpose = hasPurposeSignal(normalized);
  const detected = buildDetectedResponsibilityPrefix(
    normalized,
    parts,
    hasObject,
    hasPurpose,
  );
  const missing = buildMissingResponsibilityGuidance(
    normalized,
    parts,
    hasObject,
    hasPurpose,
  );
  return [detected, missing].filter(Boolean).join(" ").trim();
}

function buildPartialResponsibilityAssistMessage(
  normalized: string,
  parts: ResponsibilityStructureParts,
) {
  return buildStructuralResponsibilityAssistMessage(normalized, parts);
}

function buildOpenResponsibilityCriterionMessage(
  normalized: string,
  parts: ResponsibilityStructureParts,
) {
  return buildStructuralResponsibilityAssistMessage(normalized, parts);
}

function isGenericPurpose(normalized: string) {
  return GENERIC_PURPOSE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isOpenDiscretionaryResponsibility(
  normalized: string,
  parts: ResponsibilityStructureParts,
) {
  if (!/\bautorizo\b/.test(normalized)) {
    return false;
  }

  const hasScope = hasResponsibilityScopeOrCriterion(normalized, parts);
  if (hasScope) {
    return false;
  }

  if (/\b(descuento|descuentos|gasto|gastos)\b/.test(normalized)) {
    return true;
  }

  if (/\bautorizo\s+(gastos|descuentos)\b/.test(normalized)) {
    return true;
  }

  return isGenericPurpose(normalized);
}

export function isResponsibilityTooOpen(
  normalized: string,
  parts?: ResponsibilityStructureParts,
) {
  const structure = parts ?? getResponsibilityStructureParts(normalized);

  if (isGenericPurpose(normalized)) {
    return true;
  }

  if (/\bprioridades\b/.test(structure.objectSection) && /\bpara\s+mejorar\b/.test(normalized)) {
    return true;
  }

  return isOpenDiscretionaryResponsibility(normalized, structure);
}

export function classifyResponsibilitySemantics(
  text: string,
): ResponsibilitySemanticCategory {
  const status = classifyResponsibilitySufficiency(text);
  if (status === "empty" || status === "insufficient") {
    return "insufficient";
  }
  return "sufficient";
}

export function classifyResponsibilitySufficiency(
  text: string,
): import("@/domain/local-work-map").SufficiencyStatus {
  const trimmed = text.trim();
  if (!trimmed) {
    return "empty";
  }

  const normalized = normalizeText(trimmed);
  const parts = getResponsibilityStructureParts(trimmed);
  const hasObject = hasStructuralResponsibilityObject(normalized);
  const hasPurpose = hasPurposeSignal(normalized);

  if (
    !parts.hasSubject ||
    !parts.hasDecision ||
    !hasObject ||
    !hasPurpose
  ) {
    return "insufficient";
  }

  if (isResponsibilityTooOpen(normalized, parts)) {
    return "insufficient";
  }

  return "sufficient";
}

export function isResponsibilityPerfectible(text: string): boolean {
  const status = classifyResponsibilitySufficiency(text);
  if (status !== "sufficient") {
    return false;
  }

  const normalized = normalizeText(text.trim());
  const parts = getResponsibilityStructureParts(text.trim());
  return !hasResponsibilityScopeOrCriterion(normalized, parts);
}

export function validateResponsibility(
  text: string,
): ResponsibilityValidationResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      valid: false,
      messages: ["Escribe la responsabilidad principal de este bloque."],
    };
  }

  const normalized = normalizeText(trimmed);
  const parts = getResponsibilityStructureParts(trimmed);
  const messages: string[] = [];

  if (!parts.hasSubject) {
    messages.push(
      'Empieza o incluye "Yo" para dejar claro que respondes por esta responsabilidad.',
    );
  }

  if (!parts.hasDecision) {
    messages.push(
      "Falta usar un verbo de decision o autoridad (defino, apruebo, autorizo, valido, priorizo o regulo).",
    );
  }

  const hasObject = hasStructuralResponsibilityObject(normalized);
  if (!hasObject) {
    messages.push(OBJECT_CLARITY_MESSAGE);
  }

  const hasPurpose = hasPurposeSignal(normalized);

  if (!hasPurpose) {
    messages.push("Falta indicar para qué sirve esta responsabilidad.");
  } else if (
    hasObject &&
    parts.hasSubject &&
    parts.hasDecision &&
    isResponsibilityTooOpen(normalized, parts)
  ) {
    messages.push(
      "Falta indicar el límite o criterio con el que aplicas esa decisión.",
    );
  }

  if (messages.length) {
    return { valid: false, messages };
  }

  return { valid: true, messages: [] };
}

export function getResponsibilityAssistMessage(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    return "Escribe la responsabilidad principal de este bloque.";
  }

  const normalized = normalizeText(trimmed);
  const parts = getResponsibilityStructureParts(trimmed);

  if (!parts.hasSubject) {
    return 'Empieza o incluye "Yo" para dejar claro que respondes por esta responsabilidad.';
  }

  if (!parts.hasDecision) {
    return "Falta usar un verbo de decision o autoridad (defino, apruebo, autorizo, valido, priorizo o regulo).";
  }

  const hasObject = hasStructuralResponsibilityObject(normalized);
  if (!hasObject) {
    if (parts.hasSubject && parts.hasDecision) {
      return buildStructuralResponsibilityAssistMessage(normalized, parts);
    }
    return OBJECT_CLARITY_MESSAGE;
  }

  const hasPurpose = hasPurposeSignal(normalized);

  if (!hasPurpose) {
    return buildPartialResponsibilityAssistMessage(normalized, parts);
  }

  if (isResponsibilityTooOpen(normalized, parts)) {
    return buildOpenResponsibilityCriterionMessage(normalized, parts);
  }

  if (
    parts.hasSubject &&
    parts.hasDecision &&
    hasObject &&
    hasPurpose
  ) {
    return "";
  }

  return "";
}

/** Exported for regression tests — examples only, not validation criteria. */
export const responsibilityExampleObjectSignals = exampleObjectSignals;
