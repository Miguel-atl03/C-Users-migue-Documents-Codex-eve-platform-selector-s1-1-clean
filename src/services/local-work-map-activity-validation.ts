export const activityVerbs = [
  "reviso",
  "registro",
  "actualizo",
  "capturo",
  "calculo",
  "concilio",
  "comparo",
  "mido",
  "clasifico",
  "tipifico",
  "envio",
  "entrego",
  "preparo",
  "documento",
  "cargo",
  "organizo",
  "notifico",
  "cierro",
  "empaco",
  "ensamblo",
  "analizo",
  "verifico",
  "valido",
  "presento",
  "comunico",
  "reporto",
  "elaboro",
  "genero",
  "redacto",
  "cotejo",
  "habilito",
  "solicito",
  "cuantifico",
  "estimo",
  "dimensiono",
  "metrifico",
  "determino",
  "integro",
  "gestiono",
  "protocolizo",
];

/** Phrases that must not appear in generated assistance examples. */
export const BANNED_AMBIGUOUS_PHRASES = [
  "procedimiento acordado",
  "siguiente paso",
  "informacion necesaria",
  "todo funcione",
  "area responsable",
  "proceso correspondiente",
  "sistema correspondiente",
  "documentos necesarios",
  "segun lo establecido",
  "de forma adecuada",
  "oportunamente",
];

/** Orientative examples only — not a validation whitelist. */
const exampleObjectSignals = [
  "factura",
  "dimension",
  "pieza",
  "reclamo",
  "cliente",
  "proveedor",
  "reporte",
  "solicitud",
  "sistema",
  "presupuesto",
  "material",
  "equipo",
  "incidencia",
  "autorizacion",
  "documento",
  "cuenta",
  "asiento",
  "catalogo",
  "protocolo",
  "tolerancia",
  "gasto",
  "erp",
  "crm",
];

const RESULT_CONNECTORS = [
  "con el fin de",
  "de modo que",
  "hasta dejar",
  "y dejo",
  "y deja",
  "y quedan",
  "y queda",
  "para entregar",
  "para actualizar",
  "para dejar",
  "para mantener",
  "para generar",
  "para verificar",
  "para iniciar",
  "para liberar",
  "para cerrar",
  "para mejorar",
  "dejando listo",
  "para dejar listo",
  "asegurando",
  "dejando",
  "dejo",
  "deja",
  "quedan",
  "queda",
  "para que",
  "para",
];

const HOW_CONNECTORS = [
  "a traves de",
  "basandome en",
  "a partir de",
  "conforme a",
  "de acuerdo con",
  "con base en",
  "siguiendo",
  "utilizando",
  "usando",
  "mediante",
  "por medio de",
  "en la plataforma",
  "plataforma crm",
  "con el calibrador",
  "segun",
  "con los",
  "con las",
  "con el",
  "con la",
];

const CON_HOW_PATTERN = /\bcon (los|las|el|la)\s+/;

const VAGUE_OBJECT_TOKENS = new Set([
  "cosas",
  "algo",
  "todo",
  "temas",
  "asuntos",
  "resultados",
  "seguimiento",
  "actividades",
  "tareas",
  "areas",
  "aspectos",
  "elementos",
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

const KNOWN_SHORT_VERBS = new Set(["doy"]);

const OBVIOUS_NON_VERBS = new Set([
  "yo",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "en",
  "con",
  "para",
  "de",
  "del",
  "mucho",
  "poco",
  "todo",
  "algo",
  "otro",
  "mismo",
  "segundo",
  "primero",
  "solo",
  "aqui",
  "alla",
  "siempre",
  "nunca",
  "tambien",
  "luego",
  "despues",
]);

/** Nouns that end in -o and are often mistaken for first-person verbs. */
const NOUN_LIKE_NON_VERBS = new Set([
  ...exampleObjectSignals.filter((signal) => signal.endsWith("o")),
  "inventario",
  "programa",
  "proceso",
  "pedido",
  "contrato",
  "empleado",
  "periodo",
  "formato",
  "archivo",
  "calendario",
  "modulo",
  "proyecto",
  "departamento",
  "resumen",
  "listado",
]);

const DEFAULT_MISSING_ACTION_MESSAGE =
  "Falta incluir un verbo de accion concreta al inicio de la descripcion.";

const MISSING_OBJECT_MESSAGE =
  "Para poder entender la actividad, precisa sobre qué trabajas indicando la información, solicitud, cliente, documento u otro elemento. Puede ser un documento, solicitud, sistema, cliente, proveedor, presupuesto, material o actividad concreta.";

const MISSING_HOW_OR_RESULT_MESSAGE =
  "Para poder entender la actividad necesito que agregues cómo lo realizas y qué queda listo al terminar.";

const IMPROVE_WITH_HOW_MESSAGE =
  "Para dejarla más completa, agrega también cómo la realizas, con qué criterio, estándar o procedimiento.";

const IMPROVE_WITH_RESULT_MESSAGE =
  "Para dejarla más completa, agrega también qué queda listo al terminar.";

export type ActivityValidationResult = {
  valid: boolean;
  messages: string[];
};

export type ActivitySemanticCategory = "insufficient" | "sufficient";

export type ActivityVerbCategory =
  | "analysis_validation"
  | "presentation"
  | "elaboration"
  | "request"
  | "quantification"
  | "other";

const ANALYSIS_VALIDATION_VERBS = new Set([
  "analizo",
  "valido",
  "verifico",
  "comparo",
  "concilio",
  "cotejo",
  "reviso",
]);

const PRESENTATION_VERBS = new Set([
  "presento",
  "entrego",
  "envio",
  "comunico",
  "reporto",
]);

const ELABORATION_VERBS = new Set([
  "elaboro",
  "preparo",
  "documento",
  "genero",
  "redacto",
]);

const REQUEST_VERBS = new Set(["solicito", "habilito"]);

const QUANTIFICATION_VERBS = new Set([
  "cuantifico",
  "calculo",
  "mido",
  "estimo",
  "dimensiono",
  "metrifico",
  "determino",
]);

const PRODUCTIVE_RESULT_ACTIONS = new Set([
  "dejar",
  "dejo",
  "entregar",
  "entrego",
  "emitir",
  "emito",
  "generar",
  "genero",
  "obtener",
  "obtengo",
  "producir",
  "produzco",
]);

export type ActivityStructureParts = {
  hasAction: boolean;
  objectSection: string;
  howSection: string;
  resultSection: string;
};

export type ActivityParts = {
  hasAction: boolean;
  hasObject: boolean;
  hasHow: boolean;
  hasResult: boolean;
  action?: string;
  object?: string;
  how?: string;
  result?: string;
  ambiguousParts?: string[];
  detectionBasis?: Record<string, string>;
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function verbToInfinitive(verb: string) {
  if (verb.endsWith("o")) return `${verb.slice(0, -1)}ar`;
  return verb;
}

function isOperationalVerbWord(word: string) {
  const normalizedWord = normalizeText(word);
  if (!normalizedWord || OBVIOUS_NON_VERBS.has(normalizedWord)) {
    return false;
  }

  if (KNOWN_SHORT_VERBS.has(normalizedWord)) {
    return true;
  }

  if (
    activityVerbs.some(
      (verb) =>
        normalizedWord === verb || normalizedWord === verbToInfinitive(verb),
    )
  ) {
    return true;
  }

  if (NOUN_LIKE_NON_VERBS.has(normalizedWord)) {
    return false;
  }

  if (/^[a-z]{4,}(ar|er|ir)$/.test(normalizedWord)) {
    return true;
  }

  return false;
}

type ConnectorMatch = {
  index: number;
  connector: string;
};

const GERUND_HOW_PATTERN = /\b[a-z]{4,}(ando|iendo|yendo)\b/;

/** Comparative procedure gerunds and validating-against phrases count as cómo. */
const COMPARATIVE_HOW_PATTERN =
  /\b(?:comparando|contrastando|cotejando|cruzando|reconciliando)\b/;
const VALIDATING_AGAINST_HOW_PATTERN = /\bvalidando\b[^.]*\bcontra\b/;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findConnectorIndex(text: string, connector: string) {
  if (!connector) {
    return -1;
  }

  const pattern = new RegExp(`\\b${escapeRegExp(connector)}\\b`);
  const match = text.match(pattern);
  return match?.index ?? -1;
}

function findEarliestConnector(text: string, connectors: string[]): ConnectorMatch {
  let earliest = text.length;
  let matchedConnector = "";

  for (const connector of connectors) {
    const index = findConnectorIndex(text, connector);
    if (index !== -1 && index < earliest) {
      earliest = index;
      matchedConnector = connector;
    }
  }

  return { index: earliest, connector: matchedConnector };
}

function findConHowIndex(text: string) {
  const match = text.match(CON_HOW_PATTERN);
  if (!match || match.index === undefined) {
    return text.length;
  }

  return match.index;
}

function findComparativeHowIndex(text: string) {
  const patterns = [COMPARATIVE_HOW_PATTERN, VALIDATING_AGAINST_HOW_PATTERN];
  let earliest = text.length;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.index !== undefined && match.index < earliest) {
      earliest = match.index;
    }
  }

  return earliest;
}

function findGerundHowIndex(text: string) {
  const match = text.match(GERUND_HOW_PATTERN);
  if (!match || match.index === undefined) {
    return text.length;
  }

  return match.index;
}

function isGerundWord(word: string) {
  return GERUND_HOW_PATTERN.test(normalizeText(word));
}

function findPrimaryAction(words: string[]) {
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (isOperationalVerbWord(word) && !isGerundWord(word)) {
      return { index, word };
    }
  }

  return null;
}

function findPrimaryActionSegmentInText(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const primaryAction = findPrimaryAction(words);
  if (!primaryAction) {
    return null;
  }

  let endIndex = primaryAction.index;
  while (endIndex + 2 < words.length) {
    const connector = words[endIndex + 1]?.replace(/[.,;:!?]+$/, "");
    const nextWord = words[endIndex + 2]?.replace(/[.,;:!?]+$/, "");
    if (
      connector !== "y" &&
      connector !== "e"
    ) {
      break;
    }
    if (!isOperationalVerbWord(nextWord) || isGerundWord(nextWord)) {
      break;
    }
    endIndex += 2;
  }

  return {
    primaryAction,
    actionSection: words.slice(primaryAction.index, endIndex + 1).join(" "),
    isCoordinated: endIndex > primaryAction.index,
  };
}

function findProductiveActionMatch(text: string) {
  let best: { index: number; word: string } | null = null;

  for (const action of PRODUCTIVE_RESULT_ACTIONS) {
    const pattern = new RegExp(`\\b${action}\\b`, "i");
    const match = text.match(pattern);
    if (match?.index === undefined) continue;
    if (!best || match.index < best.index) {
      best = { index: match.index, word: action };
    }
  }

  return best;
}

function findHowStartIndex(text: string) {
  const howMatch = findEarliestConnector(text, HOW_CONNECTORS);
  return Math.min(
    howMatch.index,
    findConHowIndex(text),
    findGerundHowIndex(text),
    findComparativeHowIndex(text),
  );
}

function getLeadingHowConnector(text: string) {
  const normalized = text.trim();
  return HOW_CONNECTORS.find((connector) =>
    normalized.startsWith(`${connector} `),
  );
}

function splitLeadingProceduralClause(normalized: string) {
  const leadingHowConnector = getLeadingHowConnector(normalized);
  if (!leadingHowConnector) {
    return {
      leadingHowSection: "",
      actionSearchText: normalized,
    };
  }

  const productiveAction = findProductiveActionMatch(normalized);
  if (!productiveAction || productiveAction.index <= leadingHowConnector.length) {
    return {
      leadingHowSection: normalized,
      actionSearchText: "",
    };
  }

  return {
    leadingHowSection: normalized.slice(0, productiveAction.index).trim(),
    actionSearchText: normalized.slice(productiveAction.index).trim(),
  };
}

function findHowSectionInText(
  normalized: string,
  actionWord?: string,
  leadingHowSection = "",
) {
  if (leadingHowSection) {
    return leadingHowSection;
  }

  const howStart = findHowStartIndex(normalized);
  if (howStart >= normalized.length) {
    return "";
  }

  const afterHowStart = normalized.slice(howStart);
  const resultMatch = findEarliestConnector(afterHowStart, RESULT_CONNECTORS);
  let howEnd =
    resultMatch.index < afterHowStart.length
      ? howStart + resultMatch.index
      : normalized.length;

  if (actionWord) {
    const actionIndex = normalized.indexOf(actionWord, howStart);
    if (actionIndex > howStart && actionIndex < howEnd) {
      howEnd = actionIndex;
    }
  }

  return normalized.slice(howStart, howEnd).trim();
}

function findResultSectionInText(normalized: string) {
  const resultMatch = findEarliestConnector(normalized, RESULT_CONNECTORS);
  if (resultMatch.index >= normalized.length) {
    return "";
  }

  return normalized.slice(resultMatch.index).trim();
}

function findPostProcedureProductiveResultSection(
  normalized: string,
  actionWord?: string,
) {
  const productiveAction = findProductiveActionMatch(normalized);
  if (!productiveAction) {
    return "";
  }

  if (actionWord && normalizeActionWord(actionWord) === productiveAction.word) {
    return normalized.slice(productiveAction.index + productiveAction.word.length).trim();
  }

  return normalized.slice(productiveAction.index + productiveAction.word.length).trim();
}

function normalizeActionWord(actionWord?: string) {
  return normalizeText(actionWord ?? "").replace(/[.,;:!?]+$/, "");
}

function isProductiveResultAction(actionWord?: string) {
  return PRODUCTIVE_RESULT_ACTIONS.has(normalizeActionWord(actionWord));
}

function removeNormalizedPhrase(text: string, phrase: string) {
  if (!phrase) {
    return text;
  }

  return text.replace(phrase, " ").replace(/\s+/g, " ").trim();
}

function extractObjectSectionFromLayers(
  normalized: string,
  actionWord?: string,
  howSection = "",
  resultSection = "",
) {
  let remaining = normalized;

  if (actionWord) {
    const actionIndex = remaining.indexOf(actionWord);
    if (actionIndex >= 0) {
      remaining = remaining.slice(actionIndex + actionWord.length).trim();
    }
  }

  remaining = removeNormalizedPhrase(remaining, howSection);
  remaining = removeNormalizedPhrase(remaining, resultSection);
  remaining = remaining.replace(/^[,;:\s]+|[,;:\s]+$/g, "").trim();

  return remaining;
}

function splitProductiveResultCandidate(
  actionWord: string | undefined,
  objectSection: string,
  resultSection: string,
) {
  if (
    !objectSection ||
    resultSection ||
    !isProductiveResultAction(actionWord)
  ) {
    return { objectSection, resultSection };
  }

  return {
    objectSection: "",
    resultSection: objectSection,
  };
}

function hasMeaningfulSection(section: string, minTokens = 2) {
  const tokens = section.split(/\s+/).filter(Boolean);
  return tokens.length >= minTokens;
}

function isAcronymLikeToken(token: string) {
  const cleaned = token.replace(/[.,;:!?()]+$/, "");
  return (
    /^[A-Z]{2,}$/.test(cleaned) ||
    /^[A-Z][a-z]?$/.test(cleaned) ||
    /^\([A-Za-z]{2,}\)$/.test(cleaned)
  );
}

function isSubstantiveObjectToken(token: string) {
  const cleaned = token.replace(/[.,;:!?()]+$/, "");
  if (!cleaned || OBJECT_STOP_WORDS.has(cleaned)) {
    return false;
  }

  return cleaned.length >= 3 || isAcronymLikeToken(cleaned);
}

function hasStructuralObjectFromSection(objectSection: string) {
  if (!objectSection) return false;

  const tokens = objectSection.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const uniqueTokens = new Set(tokens.map((token) => token.replace(/[.,;:!?()]+$/, "")));
  if (uniqueTokens.size === 1 && tokens.length > 1) return false;

  if (tokens[0] === "para" || tokens[0] === "sin") return false;

  const substantiveTokens = tokens
    .map((token) => token.replace(/[.,;:!?()]+$/, ""))
    .filter((token) => isSubstantiveObjectToken(token));

  if (!substantiveTokens.length) return false;

  if (substantiveTokens.every((token) => VAGUE_OBJECT_TOKENS.has(token))) {
    return false;
  }

  return true;
}

function reconcileObjectWithParaContinuation(
  objectSection: string,
  resultSection: string,
) {
  if (!resultSection.startsWith("para ")) {
    return { objectSection, resultSection };
  }

  const objectTokens = objectSection.split(/\s+/).filter(Boolean);
  const substantiveTokens = objectTokens
    .map((token) => token.replace(/[.,;:!?()]+$/, ""))
    .filter((token) => isSubstantiveObjectToken(token));

  if (substantiveTokens.length > 0) {
    return { objectSection, resultSection };
  }

  return {
    objectSection: `${objectSection} ${resultSection}`.trim(),
    resultSection: "",
  };
}

function extractOriginalWord(originalText: string, normalizedWord: string) {
  const pattern = new RegExp(
    `\\b${normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`,
    "i",
  );
  const match = originalText.match(pattern);
  return match?.[0] ?? normalizedWord;
}

function getFirstContentWord(text: string) {
  const words = normalizeText(text.trim()).split(/\s+/).filter(Boolean);
  if (words[0] === "yo" && words.length > 1) {
    return words[1];
  }
  return words[0] ?? "";
}

function getMissingActionVerbMessage(text: string) {
  const firstWord = getFirstContentWord(text).replace(/[.,;:!?]+$/, "");
  const leadingHowConnector = getLeadingHowConnector(normalizeText(text));
  if (leadingHowConnector) {
    return "Indica qué haces concretamente; la frase inicia con cómo o mediante qué lo haces, pero falta la acción principal.";
  }

  if (firstWord && NOUN_LIKE_NON_VERBS.has(firstWord)) {
    const originalWord = extractOriginalWord(text, firstWord);
    return `Empieza con un verbo de accion concreta; "${originalWord}" describe un objeto, no la accion que realizas.`;
  }

  const words = normalizeText(text.trim()).split(/\s+/).filter(Boolean);
  const primaryAction = findPrimaryAction(words);
  if (primaryAction && primaryAction.index > (words[0] === "yo" ? 1 : 0)) {
    return "Empieza con un verbo de accion concreta al inicio de la descripcion.";
  }

  return DEFAULT_MISSING_ACTION_MESSAGE;
}

function extractOriginalSegment(
  originalText: string,
  normalizedSegment: string,
  options: { preserveOriginal?: boolean } = {},
) {
  const segment = normalizedSegment.trim();
  if (!segment) {
    return "";
  }

  if (options.preserveOriginal) {
    const normalizedOriginal = normalizeText(originalText);
    const index = normalizedOriginal.indexOf(segment);
    if (index >= 0) {
      return originalText
        .slice(index, index + segment.length)
        .replace(/[.,;]+$/, "")
        .trim();
    }
  }

  const tokens = segment.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return "";
  }

  const pattern = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const match = normalizeText(originalText).match(new RegExp(pattern, "i"));
  return match?.[0]?.replace(/[.,;]+$/, "").trim() ?? segment;
}

export function detectActivityParts(text: string): ActivityParts {
  const trimmed = text.trim();
  const normalized = normalizeText(trimmed);
  const { leadingHowSection, actionSearchText } =
    splitLeadingProceduralClause(normalized);
  const primaryActionSegment = findPrimaryActionSegmentInText(actionSearchText);
  const primaryAction = primaryActionSegment?.primaryAction ?? null;
  const actionSection = primaryActionSegment?.actionSection ?? primaryAction?.word;
  const hasAction = primaryAction !== null;
  const action = primaryAction
    ? extractOriginalSegment(trimmed, actionSection ?? primaryAction.word, {
        preserveOriginal: true,
      }) ||
      extractOriginalWord(trimmed, primaryAction.word)
    : undefined;

  const howSection = findHowSectionInText(
    normalized,
    actionSection,
    leadingHowSection,
  );
  let resultSection =
    findResultSectionInText(normalized) ||
    findPostProcedureProductiveResultSection(normalized, primaryAction?.word);
  let objectSection = extractObjectSectionFromLayers(
    normalized,
    actionSection,
    howSection,
    resultSection,
  );
  ({ objectSection, resultSection } = splitProductiveResultCandidate(
    primaryAction?.word,
    objectSection,
    resultSection,
  ));
  ({ objectSection, resultSection } = reconcileObjectWithParaContinuation(
    objectSection,
    resultSection,
  ));

  const hasObject = hasStructuralObjectFromSection(objectSection);
  const hasHow = hasMeaningfulSection(howSection, 2);
  const hasResult = hasMeaningfulSection(resultSection, 2);
  const ambiguousParts: string[] = [];
  const detectionBasis: Record<string, string> = {};

  if (hasAction) {
    detectionBasis.action = primaryAction
      ? primaryActionSegment?.isCoordinated
        ? "coordinated_known_first_person_action"
        : primaryAction.word.endsWith("ar") ||
        primaryAction.word.endsWith("er") ||
        primaryAction.word.endsWith("ir")
        ? "explicit_infinitive_or_known_action"
        : "known_first_person_action"
      : "absent";
  }
  if (hasObject) detectionBasis.object = "residual_object_section";
  if (hasHow) detectionBasis.how = "procedure_connector_or_gerund";
  if (hasResult) {
    detectionBasis.result = isProductiveResultAction(primaryAction?.word)
      ? "productive_action_complement"
      : "result_connector";
  }

  if (
    primaryAction &&
    objectSection &&
    resultSection &&
    isProductiveResultAction(primaryAction.word)
  ) {
    ambiguousParts.push("object_result");
  }

  return {
    hasAction,
    hasObject,
    hasHow,
    hasResult,
    action,
    object: objectSection
      ? extractOriginalSegment(trimmed, objectSection) || objectSection
      : undefined,
    how: howSection
      ? extractOriginalSegment(trimmed, howSection) || howSection
      : undefined,
    result: resultSection
      ? extractOriginalSegment(trimmed, resultSection) || resultSection
      : undefined,
    ambiguousParts,
    detectionBasis,
  };
}

export function getActivityStructureParts(text: string): ActivityStructureParts {
  const parts = detectActivityParts(text);

  return {
    hasAction: parts.hasAction,
    objectSection: normalizeText(parts.object ?? ""),
    howSection: normalizeText(parts.how ?? ""),
    resultSection: normalizeText(parts.result ?? ""),
  };
}

export function hasStructuralActivityObject(normalized: string) {
  const parts = detectActivityParts(normalized);
  return parts.hasObject;
}

function summarizeActivityObject(objectSection: string) {
  const cleaned = objectSection
    .replace(/^(las?|los?|el|la)\s+/, "")
    .trim();

  return cleaned || objectSection.trim() || "tu objeto de trabajo";
}

function preserveActivityObjectPhrase(originalText: string, objectSection: string) {
  const normalizedObject = objectSection.trim();
  if (!normalizedObject) {
    return summarizeActivityObject(objectSection);
  }

  const normalizedOriginal = normalizeText(originalText.trim());
  const objectStart = normalizedOriginal.indexOf(normalizedObject);
  if (objectStart === -1) {
    return summarizeActivityObject(objectSection);
  }

  const phrase =
    originalText
      .trim()
      .slice(objectStart)
      .split(
        /\s+(?:con|siguiendo|utilizando|usando|mediante|basandome en|para)\b/i,
      )[0]
      .trim()
      .replace(/[.,;]+$/, "") || summarizeActivityObject(objectSection);

  return phrase.replace(/[.,;]+$/, "").trim();
}

export function classifyActivityVerbCategory(action?: string): ActivityVerbCategory {
  const normalized = normalizeText(action ?? "").replace(/[.,;:!?]+$/, "");
  if (ANALYSIS_VALIDATION_VERBS.has(normalized)) {
    return "analysis_validation";
  }
  if (PRESENTATION_VERBS.has(normalized)) {
    return "presentation";
  }
  if (ELABORATION_VERBS.has(normalized)) {
    return "elaboration";
  }
  if (REQUEST_VERBS.has(normalized)) {
    return "request";
  }
  if (QUANTIFICATION_VERBS.has(normalized)) {
    return "quantification";
  }
  return "other";
}

function getActivityObjectLabel(parts: ActivityParts, originalText: string) {
  return (
    parts.object?.replace(/[.,;]+$/, "").trim() ||
    preserveActivityObjectPhrase(originalText, parts.object ?? "") ||
    "tu actividad"
  );
}

const ACTION_TO_SECOND_PERSON: Record<string, string> = {
  verifico: "verificas",
  valido: "validas",
  analizo: "analizas",
  presento: "presentas",
  cuantifico: "cuantificas",
  elaboro: "elaboras",
  registro: "registras",
  calculo: "calculas",
  reviso: "revisas",
  comparo: "comparas",
  concilio: "concilias",
  notifico: "notificas",
  gestiono: "gestionas",
  hago: "haces",
  habilito: "habilitas",
  solicito: "solicitas",
  actualizo: "actualizas",
  capturo: "capturas",
  cargo: "cargas",
  cotejo: "cotejas",
  comunico: "comunicas",
  reporto: "reportas",
  entrego: "entregas",
  envio: "envías",
  preparo: "preparas",
  integro: "integras",
  protocolizo: "protocolizas",
  documento: "documentas",
  mido: "mides",
  estimo: "estimas",
  determino: "determinas",
};

const IT_SYSTEM_SIGNAL_PATTERN =
  /\b(oracle|erp|crm|excel|sap|sistema|plataforma|software|base de datos|portal|aplicativo)\b/;

const LICITACION_SIGNAL_PATTERN =
  /\b(licitacion|paquete|paquetes|propuesta tecnica|expediente|documentos|documentacion|presupuesto tecnico|cotizacion tecnica)\b/;

const SYSTEM_TOOL_ACTION_PATTERN =
  /\b(registro|registras|cargo|cargas|capturo|capturas|actualizo|actualizas|consulto|consultas|documento|documentas)\b/;

const SOURCE_SIGNAL_ACTION_PATTERN =
  /\b(analizo|analizas|verifico|verificas|valido|validas|comparo|comparas|concilio|concilias|reviso|revisas)\b/;

const SOURCE_SIGNAL_OBJECT_PATTERN =
  /\b(informacion|presupuesto|proyeccion|estimacion|reporte|cronograma|carga|documentos)\b/;

const CRITERION_SIGNAL_ACTION_PATTERN =
  /\b(apruebo|apruebas|valido|validas|verifico|verificas|regulo|regulas|analizo|analizas|reviso|revisas|autorizo|autorizas|priorizo|priorizas)\b/;

const CRITERION_SIGNAL_OBJECT_PATTERN =
  /\b(control|presupuesto|cronograma|licitacion|estimacion|adjudicacion)\b/;

const MEETING_CHANNEL_ACTION_PATTERN =
  /\b(presento|presentas|informo|informas|comunico|comunicas|reporto|reportas|notifico|notificas|coordino|coordinas)\b/;

const INVALID_REALIZAS_OBJECT_PATTERN =
  /^(los|las|el|la)\s+(paquetes?|cronograma|presupuesto)\b/;

const GENERIC_DOCUMENT_OBJECT_PATTERN =
  /\b(documento|matriz|matrices|manual|norma|normas|propuesta|paquete|paquetes|expediente|formato)\b/;

const STRONG_SYSTEM_OBJECT_PATTERN =
  /\b(facturas?|datos|pedidos?|registros?|movimientos?|reportes?)\b/;

const MIXED_LANGUAGE_OBJECT_PATTERN =
  /\b(?:site|development|proposal|budget|management|technical|commercial|module|project|package|schedule|workflow|status|review|report|planning)\b/i;

const COMPARATIVE_OBJECT_PATTERN =
  /\b(cuadros comparativos|cuadro comparativo|comparativos?)\b/;

const CONCILIO_RECONCILIATION_OBJECT_PATTERN =
  /\b(inventario|activos?|cuentas?|facturas?|saldos?|registros?)\b/;

const INTERPRETABLE_SYSTEM_ACRONYM_PATTERN = /\b(?:oracle|erp|crm|sap|api)\b/i;

type AssistanceConfidence = "high" | "medium" | "low";

function actionToSecondPerson(action: string) {
  const normalized = normalizeText(action).replace(/[.,;:!?]+$/, "");
  if (normalized === "doy seguimiento") {
    return "das seguimiento";
  }
  return ACTION_TO_SECOND_PERSON[normalized] ?? null;
}

function findConnectedActions(words: string[]) {
  const actions: { index: number; word: string }[] = [];
  let index = 0;

  while (index < words.length) {
    const word = words[index];
    if (isOperationalVerbWord(word) && !isGerundWord(word)) {
      actions.push({ index, word });
      const nextWord = words[index + 1];
      if (nextWord === "y") {
        index += 2;
        continue;
      }
      break;
    }
    index += 1;
  }

  return actions;
}

function hasEvidentSystem(text: string) {
  return IT_SYSTEM_SIGNAL_PATTERN.test(normalizeText(text));
}

function hasLicitacionContext(text: string) {
  return LICITACION_SIGNAL_PATTERN.test(normalizeText(text));
}

function hasUninterpretableAcronymInObject(objectLabel: string) {
  const parenthesizedAcronym = objectLabel.match(/\(([A-Za-z]{2,})\)/);
  if (parenthesizedAcronym) {
    const acronym = parenthesizedAcronym[1];
    if (/^[A-Z]{2,}$/.test(acronym) || acronym.length <= 4) {
      return true;
    }
  }

  if (/\b(?:Px|P\.x\.)\b/i.test(objectLabel)) {
    return true;
  }

  const uppercaseTokens = objectLabel.match(/\b[A-Z]{2,4}\b/g) ?? [];
  for (const token of uppercaseTokens) {
    if (!INTERPRETABLE_SYSTEM_ACRONYM_PATTERN.test(token)) {
      return true;
    }
  }

  return false;
}

function hasMixedLanguageObject(objectLabel: string) {
  if (MIXED_LANGUAGE_OBJECT_PATTERN.test(objectLabel)) {
    return true;
  }

  return /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(objectLabel);
}

function hasStrongNonDocumentDimensionSignal(
  normalizedActions: string,
  fullContext: string,
) {
  if (
    SYSTEM_TOOL_ACTION_PATTERN.test(normalizedActions) &&
    STRONG_SYSTEM_OBJECT_PATTERN.test(fullContext)
  ) {
    return true;
  }

  if (
    MEETING_CHANNEL_ACTION_PATTERN.test(normalizedActions) &&
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    return true;
  }

  if (
    SOURCE_SIGNAL_ACTION_PATTERN.test(normalizedActions) &&
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    return true;
  }

  return false;
}

function isAmbiguousGenericDocumentObject(
  normalizedObject: string,
  normalizedActions: string,
  fullContext: string,
) {
  if (!GENERIC_DOCUMENT_OBJECT_PATTERN.test(normalizedObject)) {
    return false;
  }

  return !hasStrongNonDocumentDimensionSignal(normalizedActions, fullContext);
}

function hasStrongSystemContextForAssistance(
  normalizedActions: string,
  fullContext: string,
  hasSystem: boolean,
) {
  if (hasSystem) {
    return false;
  }

  return (
    SYSTEM_TOOL_ACTION_PATTERN.test(normalizedActions) &&
    STRONG_SYSTEM_OBJECT_PATTERN.test(fullContext)
  );
}

function hasHighConfidenceExpandedDimensions(
  normalizedActions: string,
  fullContext: string,
  originalText: string,
) {
  if (hasStrongSystemContextForAssistance(normalizedActions, fullContext, false)) {
    return true;
  }

  if (
    MEETING_CHANNEL_ACTION_PATTERN.test(normalizedActions) &&
    SOURCE_SIGNAL_ACTION_PATTERN.test(normalizedActions) &&
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    return true;
  }

  if (
    SOURCE_SIGNAL_ACTION_PATTERN.test(normalizedActions) &&
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext) &&
    !hasLicitacionContext(originalText)
  ) {
    return true;
  }

  if (
    MEETING_CHANNEL_ACTION_PATTERN.test(normalizedActions) &&
    hasMeaningfulSection(fullContext.replace(normalizedActions, "").trim(), 2) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    return true;
  }

  return false;
}

function wouldOnlySuggestWeakFuenteOrCriterio(
  normalizedActions: string,
  fullContext: string,
  hasSystem: boolean,
  hasLicitacion: boolean,
) {
  if (hasSystem || hasStrongSystemContextForAssistance(normalizedActions, fullContext, hasSystem)) {
    return false;
  }

  if (MEETING_CHANNEL_ACTION_PATTERN.test(normalizedActions)) {
    return false;
  }

  const hasSourceSignal =
    SOURCE_SIGNAL_ACTION_PATTERN.test(normalizedActions) ||
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext);
  const hasCriterionSignal =
    CRITERION_SIGNAL_ACTION_PATTERN.test(normalizedActions) ||
    (!hasLicitacion && CRITERION_SIGNAL_OBJECT_PATTERN.test(fullContext));

  if (!hasSourceSignal && !hasCriterionSignal) {
    return false;
  }

  if (
    hasSourceSignal &&
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext) &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    return false;
  }

  return true;
}

function shouldUseSafeFallbackAssistance(
  objectLabel: string,
  originalText: string,
  normalizedActions: string,
  fullContext: string,
) {
  if (hasUninterpretableAcronymInObject(objectLabel)) {
    return true;
  }

  if (hasMixedLanguageObject(objectLabel)) {
    return true;
  }

  const normalizedObject = normalizeText(objectLabel);
  if (
    isAmbiguousGenericDocumentObject(
      normalizedObject,
      normalizedActions,
      fullContext,
    )
  ) {
    return true;
  }

  if (hasLicitacionContext(originalText)) {
    return true;
  }

  const hasSystem = hasEvidentSystem(originalText);
  if (
    wouldOnlySuggestWeakFuenteOrCriterio(
      normalizedActions,
      fullContext,
      hasSystem,
      hasLicitacionContext(originalText),
    )
  ) {
    return true;
  }

  return false;
}

function assessAssistanceConfidence(
  originalText: string,
  parts: ActivityParts,
  actions: { index: number; word: string }[],
): AssistanceConfidence {
  const objectLabel = getObjectLabelAfterActions(originalText, actions, parts);
  const normalizedText = normalizeText(originalText);
  const normalizedObject = normalizeText(objectLabel);
  const fullContext = `${normalizedText} ${normalizedObject}`.trim();
  const normalizedActions = actions
    .map(({ word }) => normalizeText(word).replace(/[.,;:!?]+$/, ""))
    .join(" ");
  const hasSystem = hasEvidentSystem(originalText);

  if (
    shouldUseSafeFallbackAssistance(
      objectLabel,
      originalText,
      normalizedActions,
      fullContext,
    )
  ) {
    return "low";
  }

  if (hasStrongSystemContextForAssistance(normalizedActions, fullContext, hasSystem)) {
    return "high";
  }

  if (hasSystem) {
    return "medium";
  }

  if (
    hasHighConfidenceExpandedDimensions(
      normalizedActions,
      fullContext,
      originalText,
    )
  ) {
    return "high";
  }

  return "medium";
}

function buildSimpleMannerPhrase(includeResult: boolean, withinSystem: boolean) {
  const core = withinSystem
    ? "menciona la manera en que lo revisas dentro del sistema"
    : "menciona la manera en que lo haces";

  if (!includeResult) {
    return core;
  }

  return joinDimensionSegments([core, "y qué queda listo al terminar"]);
}

function isComparativeObjectContext(
  normalizedObject: string,
  normalizedText: string,
) {
  return (
    COMPARATIVE_OBJECT_PATTERN.test(normalizedObject) ||
    COMPARATIVE_OBJECT_PATTERN.test(normalizedText)
  );
}

function isConcilioReconciliationContext(
  normalizedActions: string,
  normalizedObject: string,
  normalizedText: string,
) {
  if (!/\bconcili/.test(normalizedActions)) {
    return false;
  }

  return (
    CONCILIO_RECONCILIATION_OBJECT_PATTERN.test(normalizedObject) ||
    CONCILIO_RECONCILIATION_OBJECT_PATTERN.test(normalizedText)
  );
}

function buildH7RefinedMannerPhrase(
  originalText: string,
  parts: ActivityParts,
  actions: { index: number; word: string }[],
  includeResult: boolean,
): string | null {
  const normalizedText = normalizeText(originalText);
  const objectLabel = getObjectLabelAfterActions(originalText, actions, parts);
  const normalizedObject = normalizeText(objectLabel);
  const normalizedActions = actions
    .map(({ word }) => normalizeText(word).replace(/[.,;:!?]+$/, ""))
    .join(" ");

  if (isComparativeObjectContext(normalizedObject, normalizedText)) {
    const core = "menciona la manera en que elaboras la comparación";
    return includeResult
      ? joinDimensionSegments([core, "y qué queda listo al terminar"])
      : core;
  }

  if (
    isConcilioReconciliationContext(
      normalizedActions,
      normalizedObject,
      normalizedText,
    )
  ) {
    const core = "menciona la manera en que revisas o comparas los registros";
    return includeResult
      ? joinDimensionSegments([core, "y qué queda listo al terminar"])
      : core;
  }

  return null;
}

function isInvalidRealizasObjectPhrase(objectLabel: string) {
  return INVALID_REALIZAS_OBJECT_PATTERN.test(normalizeText(objectLabel));
}

function getObjectLabelAfterActions(
  originalText: string,
  actions: { index: number; word: string }[],
  parts: ActivityParts,
) {
  if (!actions.length) {
    return getActivityObjectLabel(parts, originalText);
  }

  const normalized = normalizeText(originalText);
  const words = normalized.split(/\s+/).filter(Boolean);
  const lastAction = actions[actions.length - 1];
  const objectSection = words.slice(lastAction.index + 1).join(" ").trim();

  if (!objectSection) {
    return getActivityObjectLabel(parts, originalText);
  }

  const lastActionOriginal = extractOriginalWord(
    originalText,
    words[lastAction.index],
  );
  const afterActionPattern = new RegExp(
    `${escapeRegExp(lastActionOriginal)}\\s+([\\s\\S]+)$`,
    "i",
  );
  const afterActionMatch = originalText.trim().match(afterActionPattern);
  if (afterActionMatch?.[1]) {
    return afterActionMatch[1].replace(/[.,;]+$/, "").trim();
  }

  return (
    extractOriginalSegment(originalText, objectSection) ||
    objectSection
  ).replace(/[.,;]+$/, "").trim();
}

function buildActionSecondPersonPhrase(
  originalText: string,
  actions: { index: number; word: string }[],
  objectLabel: string,
) {
  const secondPersonActions = actions
    .map(({ word }) => actionToSecondPerson(extractOriginalWord(originalText, word)))
    .filter((phrase): phrase is string => Boolean(phrase));

  if (!secondPersonActions.length) {
    if (objectLabel && !isInvalidRealizasObjectPhrase(objectLabel)) {
      return `cómo realizas la actividad sobre ${objectLabel}`;
    }
    return "cómo realizas esta actividad";
  }

  if (secondPersonActions.length === 1) {
    return `cómo ${secondPersonActions[0]} ${objectLabel}`;
  }

  const lastAction = secondPersonActions.pop();
  return `cómo ${secondPersonActions.join(" y ")} y ${lastAction} ${objectLabel}`;
}

function joinDimensionSegments(segments: string[]) {
  if (!segments.length) {
    return "";
  }
  if (segments.length === 1) {
    return segments[0];
  }
  const lastSegment = segments.pop() ?? "";
  return `${segments.join(", ")} ${lastSegment}`;
}

type HowDimensionCandidate = {
  id: string;
  phrase: string;
  priority: number;
  order: number;
};

function selectHowDimensionCandidates(
  normalizedActions: string,
  fullContext: string,
  hasSystem: boolean,
  hasLicitacion: boolean,
  confidence: AssistanceConfidence,
) {
  const candidates: HowDimensionCandidate[] = [];

  if (
    confidence === "high" &&
    hasStrongSystemContextForAssistance(normalizedActions, fullContext, hasSystem)
  ) {
    candidates.push({
      id: "system",
      phrase: "qué sistema usas cuando aplique",
      priority: 2,
      order: 2,
    });
    candidates.push({
      id: "criterion_capture",
      phrase: "qué criterio de captura sigues",
      priority: 6,
      order: 3,
    });
  }

  if (confidence === "high" && MEETING_CHANNEL_ACTION_PATTERN.test(normalizedActions)) {
    candidates.push({
      id: "meeting",
      phrase: "el canal o reunión donde la presentas cuando aplique",
      priority: 3,
      order: 4,
    });
  }

  const hasSourceSignal =
    SOURCE_SIGNAL_ACTION_PATTERN.test(normalizedActions) ||
    SOURCE_SIGNAL_OBJECT_PATTERN.test(fullContext);
  const hasCriterionSignal =
    CRITERION_SIGNAL_ACTION_PATTERN.test(normalizedActions) ||
    (!hasLicitacion && CRITERION_SIGNAL_OBJECT_PATTERN.test(fullContext));

  if (
    confidence === "high" &&
    hasSourceSignal &&
    !hasSystem &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    candidates.push({
      id: "manner",
      phrase: "la manera en que revisas la información",
      priority: 4,
      order: 3,
    });
  }

  if (confidence === "high" && hasSystem && hasCriterionSignal) {
    candidates.push({
      id: "criterion_in_system",
      phrase: "qué revisión o criterio usas dentro del sistema",
      priority: 5,
      order: 2,
    });
  } else if (
    confidence === "high" &&
    hasCriterionSignal &&
    !GENERIC_DOCUMENT_OBJECT_PATTERN.test(fullContext)
  ) {
    candidates.push({
      id: "criterion",
      phrase: "qué criterio usas cuando aplique",
      priority: 7,
      order: 5,
    });
  }

  const selected: HowDimensionCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of [...candidates].sort(
    (left, right) => left.priority - right.priority,
  )) {
    if (seen.has(candidate.id)) {
      continue;
    }
    seen.add(candidate.id);
    selected.push(candidate);
    if (selected.length === 2) {
      break;
    }
  }

  return selected.sort((left, right) => left.order - right.order);
}

function buildHowDimensionsPhrase(
  originalText: string,
  parts: ActivityParts,
  actions: { index: number; word: string }[],
  includeResult: boolean,
) {
  const normalizedText = normalizeText(originalText);
  const normalizedObject = normalizeText(parts.object ?? "");
  const fullContext = `${normalizedText} ${normalizedObject}`.trim();
  const normalizedActions = actions
    .map(({ word }) => normalizeText(word).replace(/[.,;:!?]+$/, ""))
    .join(" ");
  const hasSystem = hasEvidentSystem(originalText);
  const confidence = assessAssistanceConfidence(originalText, parts, actions);

  const h7Refined = buildH7RefinedMannerPhrase(
    originalText,
    parts,
    actions,
    includeResult,
  );
  if (h7Refined) {
    return h7Refined;
  }

  if (confidence === "low" || confidence === "medium") {
    return buildSimpleMannerPhrase(includeResult, confidence === "medium" && hasSystem);
  }

  const hasLicitacion = hasLicitacionContext(originalText);
  const selected = selectHowDimensionCandidates(
    normalizedActions,
    fullContext,
    hasSystem,
    hasLicitacion,
    confidence,
  );

  let core: string;
  if (!selected.length) {
    core = buildSimpleMannerPhrase(false, hasSystem);
  } else {
    const phrases = selected.map((candidate) => candidate.phrase);
    core =
      phrases.length === 1
        ? `menciona ${phrases[0]}`
        : `menciona ${phrases.slice(0, -1).join(", ")}, ${phrases[phrases.length - 1]}`;
  }

  if (!includeResult) {
    return core;
  }

  return joinDimensionSegments([core, "y qué queda listo al terminar"]);
}

function buildMissingObjectParagraph(parts: ActivityParts) {
  if (!parts.hasHow && !parts.hasResult) {
    return `${MISSING_OBJECT_MESSAGE} ${MISSING_HOW_OR_RESULT_MESSAGE}`;
  }

  if (!parts.hasHow) {
    return `${MISSING_OBJECT_MESSAGE} ${IMPROVE_WITH_HOW_MESSAGE}`;
  }

  if (!parts.hasResult) {
    return MISSING_OBJECT_MESSAGE;
  }

  return MISSING_OBJECT_MESSAGE;
}

function buildHowAndResultParagraph(originalText: string, parts: ActivityParts) {
  const normalized = normalizeText(originalText);
  const words = normalized.split(/\s+/).filter(Boolean);
  const actions = findConnectedActions(words);
  const objectLabel = getObjectLabelAfterActions(originalText, actions, parts);
  const actionPhrase = buildActionSecondPersonPhrase(originalText, actions, objectLabel);
  const dimensions = buildHowDimensionsPhrase(originalText, parts, actions, true);

  return `Para completar esta actividad, agrega ${actionPhrase}: ${dimensions}.`;
}

function buildPartialActivityAssistMessage(
  originalText: string,
  parts: ActivityParts,
) {
  return buildHowAndResultParagraph(originalText, parts);
}

function buildMissingHowAssistMessage() {
  return IMPROVE_WITH_HOW_MESSAGE;
}

function buildMissingResultAssistMessage() {
  return IMPROVE_WITH_RESULT_MESSAGE;
}

export function classifyActivitySufficiency(
  text: string,
): import("@/domain/local-work-map").SufficiencyStatus {
  const trimmed = text.trim();
  if (!trimmed) {
    return "empty";
  }

  const validation = validateActivity(trimmed);
  if (!validation.valid) {
    return "insufficient";
  }

  const parts = detectActivityParts(trimmed);
  return parts.hasHow && parts.hasResult ? "sufficient" : "perfectible";
}

export function classifyActivitySemantics(text: string): ActivitySemanticCategory {
  const status = classifyActivitySufficiency(text);
  return status === "sufficient" ? "sufficient" : "insufficient";
}

export function validateActivity(activity: string): ActivityValidationResult {
  const text = activity.trim();

  if (!text) {
    return {
      valid: true,
      messages: [],
    };
  }

  const parts = detectActivityParts(text);
  const messages: string[] = [];

  if (!parts.hasAction) {
    messages.push(getMissingActionVerbMessage(text));
  }

  const missingHow = !parts.hasHow;
  const missingResult = !parts.hasResult;

  if (!parts.hasObject) {
    messages.push(MISSING_OBJECT_MESSAGE);
  }

  if (missingHow && missingResult) {
    messages.push(MISSING_HOW_OR_RESULT_MESSAGE);
  }

  if (messages.length) {
    return {
      valid: false,
      messages,
    };
  }

  return {
    valid: true,
    messages: [],
  };
}

export function getActivityAssistMessage(activity: string): string {
  const text = activity.trim();

  if (!text) {
    return "Redacta una actividad concreta: accion + sobre que trabajas + como lo haces + que queda listo.";
  }

  const parts = detectActivityParts(text);

  if (!parts.hasAction) {
    return getMissingActionVerbMessage(text);
  }

  if (!parts.hasObject) {
    return buildMissingObjectParagraph(parts);
  }

  const missingHow = !parts.hasHow;
  const missingResult = !parts.hasResult;

  if (missingHow && missingResult) {
    return buildPartialActivityAssistMessage(text, parts);
  }

  if (missingHow) {
    return buildMissingHowAssistMessage();
  }

  if (missingResult) {
    return buildMissingResultAssistMessage();
  }

  return "";
}

/** Exported for regression tests — examples only, not validation criteria. */
export const activityExampleObjectSignals = exampleObjectSignals;
