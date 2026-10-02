import type { OperationalCyberneticComponentId } from "@/features/significado/operational-description-cybernetic-components";
import {
  getCyberneticComponentById,
  OPERATIONAL_CYBERNETIC_COMPONENT_ORDER,
} from "@/features/significado/operational-description-cybernetic-components";
import type { OperationalDescriptionScan } from "./types.ts";

/** Verbos de recepción/disparador — no cuentan como transformación (T). */
const RECEPTION_ONLY_VERB_PATTERN =
  /^(recibo|recibir|llega|llegar|empiezo|empieza|inicio|iniciar|al recibir|cuando)\b/i;

/** Verbos de hacer técnico / transformación — incluye variantes como "cotejo". */
const TRANSFORMATION_VERB_PATTERN =
  /\b(cotejo|cotejar|comparo|comparar|analizo|analizar|filtro|filtrar|transformo|transformar|calculo|calcular|valido|validar|reviso|revisar|identifico|identificar|clasifico|clasificar|proceso|procesar|genero|generar|preparo|preparar|armo|armar|elaboro|elaborar|concilio|conciliar)\w*\b/i;

function normalizeDraft(draftText: string) {
  return draftText
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function draftExpressesTransformation(draftText: string) {
  const normalized = normalizeDraft(draftText);
  if (!normalized) {
    return false;
  }

  return TRANSFORMATION_VERB_PATTERN.test(normalized);
}

function draftIsReceptionOnly(draftText: string) {
  const normalized = normalizeDraft(draftText);
  if (!normalized) {
    return false;
  }

  if (draftExpressesTransformation(normalized)) {
    return false;
  }

  return (
    /\b(al recibir|cuando recibo|cuando llega|empiezo cuando)\b/.test(
      normalized,
    ) || RECEPTION_ONLY_VERB_PATTERN.test(normalized.split(/[,.]/)[0] ?? normalized)
  );
}

function isInputTransductionCovered(
  scan: OperationalDescriptionScan,
  draftText: string,
) {
  return (
    scan.dimensions.trigger_input.status !== "missing" ||
    draftIsReceptionOnly(draftText) ||
    /\b(al recibir|cuando|empiezo cuando)\b/i.test(draftText)
  );
}

function isTransformationAlgorithmCovered(
  scan: OperationalDescriptionScan,
  draftText: string,
) {
  if (draftIsReceptionOnly(draftText)) {
    return false;
  }

  if (scan.structuralParts.hasHow) {
    return true;
  }

  return draftExpressesTransformation(draftText);
}

function isVarietyAttenuationCovered(
  scan: OperationalDescriptionScan,
  draftText: string,
) {
  if (scan.dimensions.attenuation.status === "present") {
    return true;
  }

  return /\b(filtro|filtrar|priorizo|priorizar|dejo fuera|descarto|descartar|no atiendo|menor al|menores al|ruido)\b/i.test(
    normalizeDraft(draftText),
  );
}

function isImpactAmplificationCovered(
  _scan: OperationalDescriptionScan,
  draftText: string,
) {
  const normalized = normalizeDraft(draftText);

  return /\b(reporte|entregable|dejo listo|preparo|genero|transformo estos datos|causa raiz|documento|tablero|analisis de|estado final)\b/i.test(
    normalized,
  );
}

function isOutputTransductionCovered(
  _scan: OperationalDescriptionScan,
  draftText: string,
) {
  return isHandoffSufficient(draftText);
}

/** Menciona entrega pero sin receptor, canal o propósito suficiente. */
export function draftHasPartialHandoff(draftText: string) {
  const normalized = normalizeDraft(draftText);
  const mentionsHandoff =
    /\b(entrego|envio|envío|una vez finalizado|dejo disponible|queda listo para|pasa a)\b/.test(
      normalized,
    );

  return mentionsHandoff && !isHandoffSufficient(draftText);
}

export function isHandoffSufficient(draftText: string) {
  const normalized = normalizeDraft(draftText);
  const mentionsHandoff =
    /\b(entrego|envio|envío|una vez finalizado|dejo disponible|queda listo para|pasa a)\b/.test(
      normalized,
    );

  if (!mentionsHandoff) {
    return false;
  }

  const hasRecipient =
    /\b(entrego|envio|envío|paso|dejo).{0,80}\b(a|al|a la)\s+(?!el reporte|la informacion|los datos)\w+/i.test(
      draftText,
    ) ||
    /\b(a|al|a la)\s+(controller|direccion|gerencia|comite|equipo|area|departamento|cliente|usuario|siguiente)\b/.test(
      normalized,
    );

  const hasChannelOrPurpose =
    /\b(mediante|por el canal|via|vía|a traves de)\s+(el|la)?\s*\w+/i.test(
      draftText,
    ) ||
    /\b(para que|para el|en el|siguiente control|siguiente paso|comite|tablero|toma de decisiones|quien usa|proximo control)\b/.test(
      normalized,
    );

  return hasRecipient || hasChannelOrPurpose;
}

const PARTIAL_HANDOFF_TRINCHERA_PROMPT =
  "Ya mencionas la entrega; ahora precisa quién recibe ese resultado, por qué canal lo recibe y para qué lo usa en el siguiente control.";

function buildCoverageCheckers(draftText: string) {
  const COMPONENT_COVERAGE: Record<
    OperationalCyberneticComponentId,
    (scan: OperationalDescriptionScan) => boolean
  > = {
    input_transduction: (scan) => isInputTransductionCovered(scan, draftText),
    transformation_algorithm: (scan) =>
      isTransformationAlgorithmCovered(scan, draftText),
    variety_attenuation: (scan) => isVarietyAttenuationCovered(scan, draftText),
    impact_amplification: (scan) => isImpactAmplificationCovered(scan, draftText),
    output_transduction: (scan) => isOutputTransductionCovered(scan, draftText),
  };

  return COMPONENT_COVERAGE;
}

export function inferCyberneticComponentsFromScan(
  scan: OperationalDescriptionScan,
  draftText = "",
): {
  componentsCovered: OperationalCyberneticComponentId[];
  nextMissingComponent: OperationalCyberneticComponentId | null;
} {
  const coverage = buildCoverageCheckers(draftText);
  const componentsCovered = OPERATIONAL_CYBERNETIC_COMPONENT_ORDER.filter(
    (componentId) => coverage[componentId](scan),
  );

  const nextMissingComponent =
    OPERATIONAL_CYBERNETIC_COMPONENT_ORDER.find(
      (componentId) => !coverage[componentId](scan),
    ) ?? null;

  return { componentsCovered, nextMissingComponent };
}

export function buildCyberneticTrincheraFallbackMessage(
  scan: OperationalDescriptionScan,
  draftText = "",
): { message: string | null; nextMissingComponent: OperationalCyberneticComponentId | null } {
  const { nextMissingComponent } = inferCyberneticComponentsFromScan(
    scan,
    draftText,
  );

  if (!nextMissingComponent) {
    return { message: null, nextMissingComponent: null };
  }

  const component = getCyberneticComponentById(nextMissingComponent);
  if (!component) {
    return { message: null, nextMissingComponent };
  }

  if (
    nextMissingComponent === "output_transduction" &&
    draftHasPartialHandoff(draftText)
  ) {
    return {
      message: PARTIAL_HANDOFF_TRINCHERA_PROMPT,
      nextMissingComponent,
    };
  }

  return {
    message: component.trincheraPrompt,
    nextMissingComponent,
  };
}

export function isCyberneticPathComplete(
  scan: OperationalDescriptionScan,
  draftText = "",
) {
  return (
    inferCyberneticComponentsFromScan(scan, draftText).nextMissingComponent ===
    null
  );
}
