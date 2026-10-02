import type {
  CausalConfidenceLevel,
  CausalEvidenceItem,
  CausalEvidenceNature,
  CausalEvidenceTier,
  CausalExpertReviewReasonCode,
  CausalNodeId,
  CausalPath,
  CausalReason,
  CausalReentryReasonCode,
  CausalRule,
  ConfidenceComponents,
  EvidenceBundle,
  ExpertReviewFlag,
  NarrativeAudience,
  NarrativeVariantSelection,
  NodeActivation,
  PreliminaryDiagnosticOutput,
  ReentryDecision,
  SceneNodeActivation,
} from "@/domain/causal";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";
import { supabaseServer } from "@/lib/supabase-server";
import {
  CAUSAL_DECISION_TREE_MVP,
  CAUSAL_MVP_NODE_SCOPE,
  CAUSAL_NARRATIVE_TEMPLATES_MVP,
  CAUSAL_NODE_DEFINITIONS,
  CAUSAL_RULES_MVP,
} from "@/domain/causal-rules-mvp";

type SceneCanonicalRecordRow = {
  id: string;
  scene_id: string;
  canonical_json: unknown;
  evidence_answer_ids: string[];
  consistency_flag_ids: string[];
  readiness_for_transduction: string;
  created_at: string;
  updated_at: string;
};

type SessionIntermediateOutputRow = {
  id: string;
  sesion_id: string;
  instrument_version: string;
  output_json: unknown;
  readiness_for_transduction: string;
  generated_from_scene_ids: string[];
  generated_at: string;
  updated_at: string;
};

type CanonicalVariableEntry = {
  value?: unknown;
  source?: string | null;
  sourceVariable?: string | null;
  sourceQuestionCode?: string | null;
  evidenceAnswerIds?: string[];
  confidence?: number | null;
  derivationId?: string | null;
  blockId?: string;
};

type ConsistencyFlag = {
  id?: string;
  flagType?: string;
  severity?: string;
  description?: string;
  evidenceAnswerIds?: string[];
  requiresClarification?: boolean;
  status?: string;
};

type LightInference = {
  id?: string;
  preclassificationSceneType?: string | null;
  preclassificationChainPosition?: string | null;
  preclassificationVsmRole?: string | null;
  preclassificationAheSignal?: string | null;
  preclassificationMissionSuggested?: string | null;
  confidenceLevel?: string | null;
  confidenceScore?: number | null;
  confidenceReasoning?: string | null;
  flaggedForManualReview?: boolean;
};

type CanonicalJson = {
  instrumentVersion?: string;
  sceneMetadata?: {
    sceneId?: string;
    sessionId?: string;
    sceneName?: string | null;
    sceneRank?: number | null;
    depthLevel?: string | null;
    sceneStatus?: string | null;
  };
  canonicalVariablesByBlock?: Record<string, Record<string, CanonicalVariableEntry>>;
  consistency?: {
    flags?: ConsistencyFlag[];
  };
  lightInference?: LightInference | null;
  readiness?: {
    readinessForTransduction?: string;
    requiresClarification?: boolean;
    requiresManualReview?: boolean;
    openFlagCount?: number;
    failedCriticalValidationCount?: number;
  };
  traceability?: {
    canonicalRecordId?: string;
    evidenceAnswerIds?: string[];
    derivationIds?: string[];
    consistencyFlagIds?: string[];
    clarificationIds?: string[];
    lightInferenceId?: string | null;
    bundleIds?: string[];
  };
};

type CausalSceneInput = {
  canonicalRecordId: string;
  sceneId: string;
  sceneName: string | null;
  canonical: CanonicalJson;
  variables: Record<string, CanonicalVariableEntry>;
  flags: ConsistencyFlag[];
  lightInference: LightInference | null;
};

type StructuralSignals = {
  object_nonconformity: boolean;
  improper_release_or_acceptance: boolean;
  material_coverup: boolean;
  validation_state_conflict: boolean;
  explicit_n04_breach: boolean;
  temporal_dependency_break: boolean;
  informal_operation: boolean;
  workaround_as_coordination_architecture: boolean;
  workaround_as_symptom: boolean;
  system_parallel_as_primary_truth: boolean;
  formal_system_insufficient_absorption: boolean;
};

type StructuralSignalFamily =
  | "strong_breach"
  | "temporal_olc_break"
  | "stable_informal_architecture"
  | "symptom_compensation";

type StructuralSignalCausalRole =
  | "root_candidate"
  | "root_candidate_when_compounded"
  | "contextual_support"
  | "symptom_or_consequence";

type StructuralSignalDefinition = {
  family: StructuralSignalFamily;
  causalRole: StructuralSignalCausalRole;
  rootCandidateStrength: "high" | "medium" | "low";
  canActAsSymptom: boolean;
  description: string;
};

const STRUCTURAL_SIGNAL_TAXONOMY: Record<keyof StructuralSignals, StructuralSignalDefinition> = {
  object_nonconformity: {
    family: "strong_breach",
    causalRole: "root_candidate_when_compounded",
    rootCandidateStrength: "medium",
    canActAsSymptom: false,
    description: "Objeto, servicio o estado real comprometido.",
  },
  improper_release_or_acceptance: {
    family: "strong_breach",
    causalRole: "root_candidate_when_compounded",
    rootCandidateStrength: "medium",
    canActAsSymptom: false,
    description: "Liberacion, aceptacion o paso de estado que no deberia ocurrir.",
  },
  material_coverup: {
    family: "strong_breach",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Encubrimiento material, falsificacion fuerte u ocultamiento critico.",
  },
  validation_state_conflict: {
    family: "strong_breach",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Conflicto entre validacion, estado declarado y estado real.",
  },
  explicit_n04_breach: {
    family: "strong_breach",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Bundle compuesto de breach causal fuerte para N04.",
  },
  temporal_dependency_break: {
    family: "temporal_olc_break",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Ruptura temporal u OLC puntual que fuerza secuencia anomala.",
  },
  informal_operation: {
    family: "symptom_compensation",
    causalRole: "contextual_support",
    rootCandidateStrength: "low",
    canActAsSymptom: true,
    description: "Informalidad operativa o compensacion que no prueba por si sola arquitectura informal raiz.",
  },
  workaround_as_coordination_architecture: {
    family: "stable_informal_architecture",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Workaround institucionalizado como arquitectura normal de coordinacion.",
  },
  system_parallel_as_primary_truth: {
    family: "stable_informal_architecture",
    causalRole: "root_candidate",
    rootCandidateStrength: "high",
    canActAsSymptom: false,
    description: "Sistema paralelo o multiple verdad operativa sustituye al sistema formal.",
  },
  formal_system_insufficient_absorption: {
    family: "stable_informal_architecture",
    causalRole: "contextual_support",
    rootCandidateStrength: "medium",
    canActAsSymptom: false,
    description: "El sistema formal no absorbe la variedad real del trabajo.",
  },
  workaround_as_symptom: {
    family: "symptom_compensation",
    causalRole: "symptom_or_consequence",
    rootCandidateStrength: "low",
    canActAsSymptom: true,
    description: "Workaround como reaccion, amortiguador o consecuencia de otra ruptura.",
  },
};

type RuleEvaluation = {
  primarySupportScore: number;
  secondarySupportScore: number;
  inferentialSupportScore: number;
  weakenScore: number;
  supports: CausalEvidenceItem[];
  weakens: CausalEvidenceItem[];
};

const EMPTY_COMPONENTS: ConfidenceComponents = {
  support_score: 0,
  weaken_score: 0,
  contradiction_penalty: 0,
  structural_gap_penalty: 0,
  scene_coverage_score: 0,
  light_inference_weight: 0,
  primary_evidence_ratio: 0,
  primary_evidence_count: 0,
  secondary_evidence_count: 0,
  inferential_evidence_count: 0,
  scenes_supporting_count: 0,
  scenes_weakening_count: 0,
  evaluated_scene_count: 0,
  heuristic_score: 0,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonIfNeeded = <T>(value: unknown, fallback: T): T => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return isRecord(value) ? (value as T) : fallback;
};

const flattenVariables = (
  byBlock: CanonicalJson["canonicalVariablesByBlock"],
) => {
  const variables: Record<string, CanonicalVariableEntry> = {};

  for (const [blockId, block] of Object.entries(byBlock ?? {})) {
    for (const [key, entry] of Object.entries(block ?? {})) {
      variables[key] = { ...entry, blockId };
    }
  }

  return variables;
};

const unique = <T>(values: T[]) => [...new Set(values.filter(Boolean))];

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const confidenceLevel = (score: number): CausalConfidenceLevel => {
  if (score >= 0.74) return "high";
  if (score >= 0.45) return "medium";
  return "low";
};

const valueText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(valueText).join(" ");
  if (isRecord(value)) return Object.values(value).map(valueText).join(" ");
  return "";
};

const hasMeaningfulValue = (entry: CanonicalVariableEntry | undefined) => {
  const value = entry?.value;
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
};

const normalizedText = (entry: CanonicalVariableEntry | undefined) =>
  valueText(entry?.value).toLowerCase();

const sceneEvidenceText = (scene: CausalSceneInput) =>
  Object.values(scene.variables)
    .map((entry) => valueText(entry.value))
    .join(" ")
    .toLowerCase();

const hasAnyText = (text: string, tokens: string[]) =>
  tokens.some((token) => text.includes(token));

const selectedText = (entry: CanonicalVariableEntry | undefined) =>
  normalizedText(entry).trim();

const hasSelectedValue = (
  entry: CanonicalVariableEntry | undefined,
  values: string[],
) => values.includes(selectedText(entry));

const isAffirmative = (entry: CanonicalVariableEntry | undefined) => {
  const value = entry?.value;
  if (typeof value === "boolean") return value;

  const text = normalizedText(entry);
  if (!text) return false;

  return [
    "yes",
    "si",
    "true",
    "often",
    "sometimes",
    "frecuente",
    "siempre",
    "casi siempre",
    "alto",
    "alta",
    "rebas",
    "falla",
    "oculto",
    "informal",
  ].some((token) => text.includes(token));
};

const isNegative = (entry: CanonicalVariableEntry | undefined) => {
  const value = entry?.value;
  if (typeof value === "boolean") return !value;

  const text = normalizedText(entry);
  if (!text) return false;

  return ["no", "false", "never", "nunca", "none", "ningun"].some((token) =>
    text.includes(token),
  );
};

const hasSubstantiveText = (entry: CanonicalVariableEntry | undefined) => {
  if (!hasMeaningfulValue(entry)) return false;
  if (isNegative(entry)) return false;
  if (hasSelectedValue(entry, ["not_sure", "unknown", "rare", "none", "stable"])) {
    return false;
  }

  return true;
};

const numericValue = (entry: CanonicalVariableEntry | undefined) => {
  const value = entry?.value;
  if (typeof value === "number") return value;
  if (isRecord(value)) {
    for (const candidate of Object.values(value)) {
      if (typeof candidate === "number") return candidate;
    }
  }

  const match = normalizedText(entry).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const natureOf = (entry: CanonicalVariableEntry | undefined): CausalEvidenceNature => {
  if (entry?.source === "computed") return "computed";
  if (entry?.source === "derived" || entry?.source === "derivation") return "derived";
  if (entry?.source === "inferred" || entry?.blockId === "block_7") return "light_inference";
  return "captured";
};

const tierOf = (nature: CausalEvidenceNature): CausalEvidenceTier => {
  if (nature === "light_inference") return "inferential";
  if (nature === "consistency_flag" || nature === "session_metadata") return "secondary";
  return "primary";
};

const evidenceItem = (
  scene: CausalSceneInput,
  canonicalVariable: string,
  reason: string,
  weight: number,
): CausalEvidenceItem => {
  const entry = scene.variables[canonicalVariable];
  const nature = natureOf(entry);

  return {
    sceneId: scene.sceneId,
    sceneName: scene.sceneName,
    canonicalVariable,
    value: entry?.value,
    reason,
    nature,
    evidenceTier: tierOf(nature),
    weight,
    evidenceAnswerIds: entry?.evidenceAnswerIds ?? [],
    derivationId: entry?.derivationId ?? null,
  };
};

const flagEvidenceItem = (
  scene: CausalSceneInput,
  flag: ConsistencyFlag,
  reason: string,
  weight: number,
): CausalEvidenceItem => ({
  sceneId: scene.sceneId,
  sceneName: scene.sceneName,
  reason,
  nature: "consistency_flag",
  evidenceTier: "secondary",
  weight,
  evidenceAnswerIds: flag.evidenceAnswerIds ?? [],
  consistencyFlagId: flag.id ?? null,
  value: {
    flagType: flag.flagType,
    severity: flag.severity,
    description: flag.description,
    status: flag.status,
  },
});

const lightInferenceEvidenceItem = (
  scene: CausalSceneInput,
  nodeId: CausalNodeId,
  reason: string,
  weight: number,
): CausalEvidenceItem => ({
  sceneId: scene.sceneId,
  sceneName: scene.sceneName,
  reason,
  nature: "light_inference",
  evidenceTier: "inferential",
  weight,
  evidenceAnswerIds: scene.canonical.traceability?.evidenceAnswerIds ?? [],
  derivationId: scene.canonical.traceability?.lightInferenceId ?? null,
  value: {
    nodeId,
    preclassificationVsmRole: scene.lightInference?.preclassificationVsmRole,
    preclassificationAheSignal: scene.lightInference?.preclassificationAheSignal,
    confidenceLevel: scene.lightInference?.confidenceLevel,
    confidenceScore: scene.lightInference?.confidenceScore,
  },
});

const structuralSignalEvidenceItem = (
  scene: CausalSceneInput,
  signal: keyof StructuralSignals,
  value: boolean,
  reason: string,
  weight: number,
): CausalEvidenceItem => ({
  sceneId: scene.sceneId,
  sceneName: scene.sceneName,
  canonicalVariable: `structural_signal.${signal}`,
  reason,
  nature: "computed",
  evidenceTier: "primary",
  weight,
  evidenceAnswerIds: scene.canonical.traceability?.evidenceAnswerIds ?? [],
  derivationId: scene.canonical.traceability?.canonicalRecordId ?? scene.canonicalRecordId,
  value: {
    signal,
    active: value,
    signal_family: STRUCTURAL_SIGNAL_TAXONOMY[signal].family,
    causal_role: STRUCTURAL_SIGNAL_TAXONOMY[signal].causalRole,
    root_candidate_strength: STRUCTURAL_SIGNAL_TAXONOMY[signal].rootCandidateStrength,
    can_act_as_symptom: STRUCTURAL_SIGNAL_TAXONOMY[signal].canActAsSymptom,
    description: STRUCTURAL_SIGNAL_TAXONOMY[signal].description,
  },
});

const emptyEvaluation = (): RuleEvaluation => ({
  primarySupportScore: 0,
  secondarySupportScore: 0,
  inferentialSupportScore: 0,
  weakenScore: 0,
  supports: [],
  weakens: [],
});

const addVariableSupport = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  variable: string,
  reason: string,
  weight: number,
) => {
  if (!hasMeaningfulValue(scene.variables[variable])) return;

  const item = evidenceItem(scene, variable, reason, weight);
  evaluation.supports.push(item);
  if (item.evidenceTier === "primary") evaluation.primarySupportScore += weight;
  if (item.evidenceTier === "secondary") evaluation.secondarySupportScore += weight;
  if (item.evidenceTier === "inferential") evaluation.inferentialSupportScore += weight;
};

const addVariableWeakener = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  variable: string,
  reason: string,
  weight: number,
) => {
  if (!hasMeaningfulValue(scene.variables[variable])) return;

  evaluation.weakenScore += weight;
  evaluation.weakens.push(evidenceItem(scene, variable, reason, weight));
};

const addFlagSupport = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  flag: ConsistencyFlag,
  reason: string,
  weight: number,
) => {
  evaluation.secondarySupportScore += weight;
  evaluation.supports.push(flagEvidenceItem(scene, flag, reason, weight));
};

const addLightInferenceSupport = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  nodeId: CausalNodeId,
  reason: string,
  weight = 0.4,
) => {
  if (!scene.lightInference) return;

  evaluation.inferentialSupportScore += weight;
  evaluation.supports.push(lightInferenceEvidenceItem(scene, nodeId, reason, weight));
};

const addStructuralSignalSupport = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  signal: keyof StructuralSignals,
  reason: string,
  weight: number,
) => {
  evaluation.primarySupportScore += weight;
  evaluation.supports.push(structuralSignalEvidenceItem(scene, signal, true, reason, weight));
};

const addStructuralSignalWeakener = (
  evaluation: RuleEvaluation,
  scene: CausalSceneInput,
  signal: keyof StructuralSignals,
  reason: string,
  weight: number,
) => {
  evaluation.weakenScore += weight;
  evaluation.weakens.push(structuralSignalEvidenceItem(scene, signal, false, reason, weight));
};

const flagMatches = (scene: CausalSceneInput, types: string[]) =>
  scene.flags.filter((flag) => types.includes(String(flag.flagType)));

const lightInferenceText = (scene: CausalSceneInput) =>
  [
    scene.lightInference?.preclassificationVsmRole,
    scene.lightInference?.preclassificationAheSignal,
    scene.lightInference?.preclassificationSceneType,
    scene.lightInference?.preclassificationChainPosition,
    scene.lightInference?.confidenceReasoning,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const deriveStructuralSignals = (scene: CausalSceneInput): StructuralSignals => {
  const text = sceneEvidenceText(scene);
  const objectNonconformity = hasAnyText(text, [
    "objeto no conforme",
    "producto defectuoso",
    "producto no conforme",
    "servicio defectuoso",
    "servicio no conforme",
    "20% defectuoso",
    "lote rechazado",
    "estado real incompatible",
    "calidad real incompatible",
  ]);
  const improperReleaseOrAcceptance = hasAnyText(text, [
    "liberacion indebida",
    "liberacion forzada",
    "liberacion de producto defectuoso",
    "liberar producto",
    "liberar el producto",
    "despacho indebido",
    "despachar producto defectuoso",
    "despachar el producto defectuoso",
    "paso a la siguiente etapa cuando no deberia",
    "pasa a la siguiente etapa cuando no deberia",
    "aceptacion forzada",
    "aceptacion indebida",
    "presiona a calidad",
    "presion para liberar",
    "presion directa para liberar",
  ]);
  const materialCoverup = hasAnyText(text, [
    "encubrimiento material",
    "ocultar defecto",
    "oculta defecto",
    "falsificacion operativa fuerte",
    "registro incompatible con la realidad fisica",
    "registro incompatible con la realidad",
    "ocultamiento critico",
  ]);
  const validationStateConflict = hasAnyText(text, [
    "validacion incompatible",
    "estado real y estado declarado",
    "calidad real y salida autorizada",
    "aceptacion de algo que no deberia pasar",
    "aceptar algo que no deberia pasar",
    "transicion prohibida",
  ]);
  const temporalDependencyBreakCandidate = hasAnyText(text, [
    "fecha imposible",
    "orden imposible",
    "manufactura comienza sin materiales",
    "sin materiales",
    "antes de que materiales",
    "replanificacion en reversa",
    "replanificación en reversa",
    "compras -> materiales",
    "compras â†’ materiales",
    "trabajo hacia atras",
    "solo tengo 2 dias",
    "6 dias minimo",
    "dependencia temporal",
  ]);
  const workaroundAsArchitecture = hasAnyText(text, [
    "arquitectura normal",
    "arquitectura normal permanente",
    "excel es la verdad",
    "sistema oficial no soporta",
    "sistema oficial es un decorado",
    "multiples verdades",
    "múltiples verdades",
    "permanente",
    "unico sistema que funciona",
    "único sistema que funciona",
  ]);
  const workaroundAsSymptom = hasAnyText(text, [
    "workaround como sintoma",
    "workaround como síntoma",
    "respuesta a una ruptura",
    "respuesta a presion",
    "respuesta a presión",
    "respuesta a una excepcion",
    "respuesta a una excepción",
    "no es la causa raiz",
    "no es la causa raíz",
    "consecuencia",
    "primero aparece",
    "luego aparecen",
  ]);
  const systemParallelAsPrimaryTruth = hasAnyText(text, [
    "excel es la verdad",
    "sistema paralelo",
    "sistema oficial es un decorado",
    "multiples verdades",
    "múltiples verdades",
    "unico sistema que funciona",
    "único sistema que funciona",
  ]);
  const formalSystemInsufficientAbsorption = hasAnyText(text, [
    "erp insuficiente",
    "erp no soporta",
    "sistema oficial no soporta",
    "sistema formal no absorbe",
    "no absorbe variedad",
    "no absorbente",
  ]);
  const stableInformalArchitecture =
    workaroundAsArchitecture ||
    systemParallelAsPrimaryTruth ||
    formalSystemInsufficientAbsorption;
  const informalOperation = hasAnyText(text, [
    "workaround",
    "arreglo alterno",
    "ruta alternativa",
    "desviacion",
    "desviación",
    "sacrificio humano",
    "absorcion",
    "absorción",
    "compensacion",
    "compensación",
    "informal",
  ]);

  return {
    object_nonconformity: objectNonconformity,
    improper_release_or_acceptance: improperReleaseOrAcceptance,
    material_coverup: materialCoverup,
    validation_state_conflict: validationStateConflict,
    explicit_n04_breach:
      (objectNonconformity && improperReleaseOrAcceptance) ||
      materialCoverup ||
      validationStateConflict,
    temporal_dependency_break:
      temporalDependencyBreakCandidate &&
      (!stableInformalArchitecture || workaroundAsSymptom),
    informal_operation: informalOperation && !stableInformalArchitecture,
    workaround_as_coordination_architecture: workaroundAsArchitecture,
    workaround_as_symptom: workaroundAsSymptom && !workaroundAsArchitecture,
    system_parallel_as_primary_truth: systemParallelAsPrimaryTruth,
    formal_system_insufficient_absorption: formalSystemInsufficientAbsorption,
  };
};

const evaluateN2 = (scene: CausalSceneInput): RuleEvaluation => {
  const evaluation = emptyEvaluation();
  const signals = deriveStructuralSignals(scene);
  const text = sceneEvidenceText(scene);

  for (const variable of ["dependency_previous", "dependency_next"]) {
    addVariableSupport(evaluation, scene, variable, "Dependencia explicita en la escena.", 1);
  }

  for (const variable of ["trigger_preconditions", "blocking_impact", "bottleneck_type"]) {
    addVariableSupport(
      evaluation,
      scene,
      variable,
      "Condicion de espera, bloqueo o cuello de botella.",
      variable === "blocking_impact" ? 2 : 1,
    );
  }

  if (
    hasMeaningfulValue(scene.variables.wait_time_typical) &&
    !hasSelectedValue(scene.variables.wait_time_typical, ["none", "less_than_1h"])
  ) {
    addVariableSupport(
      evaluation,
      scene,
      "wait_time_typical",
      "Tiempo de espera suficiente para indicar restriccion temporal.",
      1,
    );
  }

  for (const variable of ["deadlock_risk", "delivery_failure_exists", "transformation_exception_exists"]) {
    if (isAffirmative(scene.variables[variable])) {
      addVariableSupport(
        evaluation,
        scene,
        variable,
        "Riesgo, falla o excepcion activa.",
        variable === "deadlock_risk" ? 2 : 1,
      );
    }
  }

  for (const flag of flagMatches(scene, ["R3_dependency_without_synchronization"])) {
    addFlagSupport(
      evaluation,
      scene,
      flag,
      "Bandera estructural de dependencia sin sincronizacion.",
      1.2,
    );
  }

  if (/s3|control|bloque|depend|doble|coordin/.test(lightInferenceText(scene))) {
    addLightInferenceSupport(
      evaluation,
      scene,
      "N06",
      "Preclasificacion ligera compatible con bloqueo o dependencia; solo refuerzo secundario.",
    );
  }

  if (signals.temporal_dependency_break) {
    addStructuralSignalSupport(
      evaluation,
      scene,
      "temporal_dependency_break",
      "La escena deriva una ruptura temporal/OLC previa al workaround.",
      3,
    );
  }

  if (
    hasAnyText(text, [
      "manufactura comienza sin materiales",
      "sin materiales",
      "lead time",
      "antes de que materiales",
      "replanificacion en reversa",
      "replanificación en reversa",
      "compras -> materiales",
      "compras → materiales",
    ])
  ) {
    addVariableSupport(
      evaluation,
      scene,
      "real_vs_official_sequence",
      "La escena explicita una dependencia temporal/OLC no satisfecha antes del workaround.",
      1,
    );
  }

  for (const variable of ["deadlock_resolution", "alternative_paths", "receiver_feedback"]) {
    addVariableWeakener(
      evaluation,
      scene,
      variable,
      "Hay senal parcial de salida, alternativa o visibilidad.",
      0.7,
    );
  }

  return evaluation;
};

const evaluateN3 = (scene: CausalSceneInput): RuleEvaluation => {
  const evaluation = emptyEvaluation();
  const capacityGap = numericValue(scene.variables.brecha_capacidad_5_3);

  if (capacityGap !== null && capacityGap > 0) {
    addVariableSupport(
      evaluation,
      scene,
      "brecha_capacidad_5_3",
      "Brecha positiva entre capacidad nominal y real.",
      capacityGap >= 15 ? 3 : 2,
    );
  }

  const nominal = numericValue(scene.variables.capacidad_nominal_5_1);
  const real = numericValue(scene.variables.capacidad_real_5_2);
  if (nominal !== null && real !== null && real < nominal) {
    addVariableSupport(
      evaluation,
      scene,
      "capacidad_real_5_2",
      "La capacidad real queda por debajo de la nominal.",
      2,
    );
  }

  for (const variable of ["resource_bargain_5_14", "constre\u00f1imientos_5_10", "variedad_residual_5_12"]) {
    addVariableSupport(
      evaluation,
      scene,
      variable,
      "Senal de promesa, capacidad o discrecion tensionada.",
      variable === "resource_bargain_5_14" ? 2 : 1,
    );
  }

  if (hasSelectedValue(scene.variables.discrecionalidad_5_9, ["none", "low"])) {
    addVariableSupport(
      evaluation,
      scene,
      "discrecionalidad_5_9",
      "La discrecionalidad baja o nula tensiona la responsabilidad asignada.",
      1,
    );
  }

  if (/s3|agencia|capacidad|variedad|human_compensation/.test(lightInferenceText(scene))) {
    addLightInferenceSupport(
      evaluation,
      scene,
      "N10",
      "Preclasificacion ligera compatible con capacidad/discrecion tensionada; no activa regla por si sola.",
    );
  }

  if (capacityGap !== null && capacityGap <= 0) {
    addVariableWeakener(
      evaluation,
      scene,
      "brecha_capacidad_5_3",
      "No aparece brecha positiva de capacidad en esta escena.",
      2,
    );
  }

  return evaluation;
};

const evaluateN4 = (scene: CausalSceneInput): RuleEvaluation => {
  const evaluation = emptyEvaluation();
  const signals = deriveStructuralSignals(scene);
  const strongCausalBreach = signals.explicit_n04_breach;
  const genericOpacityWeight = strongCausalBreach ? 1 : 0.35;
  const genericRuleWeight = strongCausalBreach ? 1 : 0.3;
  const genericFailureWeight = strongCausalBreach ? 1 : 0.4;

  if (isAffirmative(scene.variables.informacion_faltante)) {
    addVariableSupport(
      evaluation,
      scene,
      "informacion_faltante",
      strongCausalBreach
        ? "La escena declara informacion faltante dentro de una violacion causal explicita."
        : "La escena declara informacion faltante; sin ruptura causal explicita solo cuenta como opacidad contextual.",
      2 * genericOpacityWeight,
    );
  }

  if (hasSubstantiveText(scene.variables.regla_informal)) {
    addVariableSupport(
      evaluation,
      scene,
      "regla_informal",
      strongCausalBreach
        ? "Aparece regla informal asociada a una violacion causal explicita."
        : "Aparece regla informal; sin ruptura causal explicita no basta para raiz N04.",
      1.5 * genericRuleWeight,
    );
  }

  if (isAffirmative(scene.variables.regla_informal_conocida)) {
    addVariableSupport(
      evaluation,
      scene,
      "regla_informal_conocida",
      strongCausalBreach
        ? "La escena declara regla informal conocida dentro de una violacion causal explicita."
        : "La escena declara regla informal conocida; se trata como informalidad estructural si no hay breach fuerte.",
      1.5 * genericRuleWeight,
    );
  }

  if (isAffirmative(scene.variables.hidden_subprocess)) {
    addVariableSupport(
      evaluation,
      scene,
      "hidden_subprocess",
      strongCausalBreach
        ? "La escena declara subproceso oculto asociado a ruptura causal fuerte."
        : "La escena declara subproceso oculto; sin breach fuerte no equivale a violacion causal.",
      1.5 * genericOpacityWeight,
    );
  }

  if (
    isAffirmative(scene.variables.informacion_faltante) &&
    hasSubstantiveText(scene.variables.informacion_faltante_accion)
  ) {
    addVariableSupport(
      evaluation,
      scene,
      "informacion_faltante_accion",
      strongCausalBreach
        ? "La escena compensa informacion faltante dentro de una ruptura causal explicita."
        : "La compensacion de informacion faltante queda como opacidad contextual, no como breach N04 suficiente.",
      1 * genericOpacityWeight,
    );
  }

  if (
    hasSelectedValue(scene.variables.real_vs_official_sequence, [
      "major_differences",
      "no_official_sequence",
    ])
  ) {
    addVariableSupport(
      evaluation,
      scene,
      "real_vs_official_sequence",
      strongCausalBreach
        ? "La secuencia real difiere de la oficial dentro de una violacion causal explicita."
        : "La secuencia real difiere de la oficial, pero sin evidencia dura de transicion prohibida.",
      1 * genericOpacityWeight,
    );
  }

  if (isAffirmative(scene.variables.delivery_failure_exists) && !hasMeaningfulValue(scene.variables.receiver_feedback)) {
    addVariableSupport(
      evaluation,
      scene,
      "delivery_failure_exists",
      strongCausalBreach
        ? "Hay falla sin feedback claro en una escena con breach causal explicito."
        : "Hay falla sin feedback claro; sin breach fuerte no debe colonizar como N04.",
      2 * genericFailureWeight,
    );
  }

  for (const flag of flagMatches(scene, ["R6_formal_coordination_with_informal_exception", "R9_failure_without_feedback_visibility"])) {
    addFlagSupport(
      evaluation,
      scene,
      flag,
      strongCausalBreach
        ? "Bandera estructural de opacidad que acompana una violacion causal explicita."
        : "Bandera de opacidad/informalidad; sin breach fuerte queda como apoyo secundario bajo.",
      strongCausalBreach ? 1.2 : 0.35,
    );
  }

  if (/s3_star|feedback|ocult|curiosity_blocked|empathy/.test(lightInferenceText(scene))) {
    addLightInferenceSupport(
      evaluation,
      scene,
      "N04",
      strongCausalBreach
        ? "Preclasificacion ligera compatible con N04; solo apoyo interpretativo ante breach explicito."
        : "Preclasificacion ligera de opacidad; no sustituye evidencia estructural de violacion causal.",
      strongCausalBreach ? 0.4 : 0.15,
    );
  }

  if (strongCausalBreach) {
    addStructuralSignalSupport(
      evaluation,
      scene,
      "explicit_n04_breach",
      "causal_breach_explicit: existe bundle estructural compuesto para N04.",
      5,
    );
    addVariableSupport(
      evaluation,
      scene,
      "real_vs_official_sequence",
      "La secuencia real difiere de la oficial como consecuencia de un breach estructural N04 ya derivado.",
      0.5,
    );
  } else if (
    isAffirmative(scene.variables.informacion_faltante) ||
    isAffirmative(scene.variables.hidden_subprocess) ||
    hasSubstantiveText(scene.variables.regla_informal)
  ) {
    addStructuralSignalWeakener(
      evaluation,
      scene,
      "explicit_n04_breach",
      "informality_without_strong_causal_breach: hay opacidad o informalidad, pero no evidencia dura de violacion causal.",
      2.5,
    );
  }

  for (const variable of ["validation_rule", "receiver_feedback"]) {
    addVariableWeakener(
      evaluation,
      scene,
      variable,
      "Existe alguna regla o feedback que reduce la opacidad.",
      variable === "receiver_feedback" ? 1 : 0.5,
    );
  }

  return evaluation;
};

const evaluateN5 = (scene: CausalSceneInput): RuleEvaluation => {
  const evaluation = emptyEvaluation();
  const signals = deriveStructuralSignals(scene);
  const text = sceneEvidenceText(scene);
  const workaroundArchitecture = hasAnyText(text, [
    "arquitectura normal",
    "arquitectura normal permanente",
    "excel es la verdad",
    "sistema oficial no soporta",
    "sistema oficial es un decorado",
    "multiples verdades",
    "múltiples verdades",
    "permanente",
    "unico sistema que funciona",
    "único sistema que funciona",
  ]);
  const stableInformalArchitecture =
    signals.workaround_as_coordination_architecture ||
    signals.system_parallel_as_primary_truth ||
    signals.formal_system_insufficient_absorption ||
    workaroundArchitecture;
  const n03RootWeight = (strong: number, weak: number) =>
    stableInformalArchitecture ? strong : weak;
  const workaroundConsequence = !workaroundArchitecture && hasAnyText(text, [
    "workaround como sintoma",
    "workaround como síntoma",
    "workaround detectado",
    "respuesta a una ruptura",
    "respuesta a presion",
    "respuesta a presión",
    "respuesta a una excepcion",
    "respuesta a una excepción",
    "no es la causa raiz",
    "no es la causa raíz",
    "no la causa",
    "consecuencia",
    "reaccion",
    "reacción",
    "temporal",
    "primero aparece",
    "luego aparecen",
  ]);

  if (isAffirmative(scene.variables.workaround_used)) {
    addVariableSupport(
      evaluation,
      scene,
      "workaround_used",
      stableInformalArchitecture
        ? "La escena declara workaround dentro de una arquitectura informal estable."
        : "La escena declara workaround, pero sin arquitectura informal estable se trata como informalidad operativa.",
      n03RootWeight(2.5, 1),
    );
  }

  const workaroundActive = isAffirmative(scene.variables.workaround_used);

  if (workaroundActive && hasMeaningfulValue(scene.variables.workaround_types)) {
    addVariableSupport(
      evaluation,
      scene,
      "workaround_types",
      stableInformalArchitecture
        ? "Tipo de workaround declarado dentro de una arquitectura informal estable."
        : "Tipo de workaround declarado sin prueba suficiente de arquitectura raiz.",
      n03RootWeight(1, 0.4),
    );
  }

  if (hasSelectedValue(scene.variables.flow_deviation_frequency, ["often", "almost_always"])) {
    addVariableSupport(
      evaluation,
      scene,
      "flow_deviation_frequency",
      stableInformalArchitecture
        ? "La escena se desvia frecuentemente del flujo normal dentro de una arquitectura informal estable."
        : "La desviacion frecuente se trata como operacion informal, no como raiz N03 suficiente.",
      n03RootWeight(1, 0.4),
    );
  }

  if (hasSelectedValue(scene.variables.alternative_paths, ["yes_informal", "both"])) {
    addVariableSupport(
      evaluation,
      scene,
      "alternative_paths",
      stableInformalArchitecture
        ? "La escena usa rutas alternativas como infraestructura informal de coordinacion."
        : "Las rutas alternativas se tratan como parche operativo si no hay arquitectura informal estable.",
      n03RootWeight(1, 0.4),
    );
  }

  if (hasSelectedValue(scene.variables.parallelism_pattern, ["parallel_dependent"])) {
    addVariableSupport(
      evaluation,
      scene,
      "parallelism_pattern",
      "La escena corre en paralelo dependiente con otras actividades.",
      n03RootWeight(0.8, 0.3),
    );
  }

  if (isAffirmative(scene.variables.sacrificio_humano)) {
    addVariableSupport(
      evaluation,
      scene,
      "sacrificio_humano",
      stableInformalArchitecture
        ? "La escena declara sacrificio humano dentro de una arquitectura informal que sostiene el flujo."
        : "El sacrificio humano se trata como compensacion sintomatica si no hay arquitectura informal estable.",
      n03RootWeight(2, 0.7),
    );
  }

  if (hasSubstantiveText(scene.variables.absorcion_variedad_residual)) {
    addVariableSupport(
      evaluation,
      scene,
      "absorcion_variedad_residual",
      stableInformalArchitecture
        ? "Aparece absorcion de variedad residual como parte de una arquitectura informal estable."
        : "La absorcion residual se trata como amortiguacion, no como raiz N03 suficiente.",
      n03RootWeight(2, 0.7),
    );
  }

  if (hasSelectedValue(scene.variables.desgaste_acumulado, ["medium", "high"])) {
    addVariableSupport(
      evaluation,
      scene,
      "desgaste_acumulado",
      "La escena acumula desgaste medio o alto.",
      n03RootWeight(1, 0.4),
    );
  }

  const channelText = normalizedText(scene.variables.delivery_channel);
  if (["whatsapp", "correo", "mail", "manual", "chat", "junta", "llamada"].some((token) => channelText.includes(token))) {
    addVariableSupport(
      evaluation,
      scene,
      "delivery_channel",
      stableInformalArchitecture
        ? "Canal manual/informal integrado a la arquitectura de coordinacion."
        : "Canal manual/informal como senal operativa debil sin arquitectura raiz.",
      n03RootWeight(1, 0.3),
    );
  }

  for (const flag of flagMatches(scene, ["R6_formal_coordination_with_informal_exception", "R8_residual_variety_not_absorbed", "R10_human_sacrifice_visible"])) {
    addFlagSupport(
      evaluation,
      scene,
      flag,
      "Bandera estructural de compensacion o coordinacion informal.",
      n03RootWeight(1, 0.4),
    );
  }

  if (/s2|support|workaround|creative_compensation|human_compensation/.test(lightInferenceText(scene))) {
    addLightInferenceSupport(
      evaluation,
      scene,
      "N03",
      "Preclasificacion ligera compatible con coordinacion informal o compensacion; no sustituye evidencia primaria.",
    );
  }

  if (signals.workaround_as_symptom || workaroundConsequence) {
    addStructuralSignalWeakener(
      evaluation,
      scene,
      "workaround_as_symptom",
      "El expediente presenta el workaround como consecuencia/sintoma de otra ruptura causal, no como arquitectura raiz.",
      4,
    );
  }

  if (signals.informal_operation && !stableInformalArchitecture) {
    addStructuralSignalWeakener(
      evaluation,
      scene,
      "informal_operation",
      "informal_operation_without_architecture: hay informalidad, compensacion o workaround, pero no evidencia suficiente de sustitucion estable del sistema formal.",
      2.5,
    );
  }

  if (signals.workaround_as_coordination_architecture || workaroundArchitecture) {
    addStructuralSignalSupport(
      evaluation,
      scene,
      "workaround_as_coordination_architecture",
      "El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.",
      2,
    );
  }

  if (signals.system_parallel_as_primary_truth) {
    addStructuralSignalSupport(
      evaluation,
      scene,
      "system_parallel_as_primary_truth",
      "La escena deriva sistema paralelo o multiple verdad operativa como fuente primaria de coordinacion.",
      2,
    );
  }

  if (signals.formal_system_insufficient_absorption) {
    addStructuralSignalSupport(
      evaluation,
      scene,
      "formal_system_insufficient_absorption",
      "El sistema formal aparece como insuficiente para absorber la variedad real del trabajo.",
      1.5,
    );
  }

  if (isNegative(scene.variables.workaround_used) && hasMeaningfulValue(scene.variables.validation_rule)) {
    addVariableWeakener(
      evaluation,
      scene,
      "workaround_used",
      "No se declara workaround y existe regla formal visible.",
      1,
    );
  }

  return evaluation;
};

const evaluateRule = (scene: CausalSceneInput, rule: CausalRule): RuleEvaluation => {
  if (rule.nodeId === "N06") return evaluateN2(scene);
  if (rule.nodeId === "N10") return evaluateN3(scene);
  if (rule.nodeId === "N04") return evaluateN4(scene);
  return evaluateN5(scene);
};

const confidenceComponents = (
  supportScore: number,
  weakenScore: number,
  supports: CausalEvidenceItem[],
  weakens: CausalEvidenceItem[],
  unresolvedContradictions: string[],
  structuralGaps: string[],
  evaluatedSceneCount: number,
): ConfidenceComponents => {
  const primaryEvidenceCount = supports.filter((item) => item.evidenceTier === "primary").length;
  const secondaryEvidenceCount = supports.filter((item) => item.evidenceTier === "secondary").length;
  const inferentialEvidenceCount = supports.filter((item) => item.evidenceTier === "inferential").length;
  const primaryEvidenceRatio = supports.length ? primaryEvidenceCount / supports.length : 0;
  const contradictionPenalty = Math.min(0.3, unresolvedContradictions.length * 0.12);
  const structuralGapPenalty = Math.min(0.25, structuralGaps.length * 0.025);
  const scenesSupporting = unique(supports.map((item) => item.sceneId));
  const scenesWeakening = unique(weakens.map((item) => item.sceneId));
  const sceneCoverageScore = evaluatedSceneCount
    ? scenesSupporting.length / evaluatedSceneCount
    : 0;
  const lightInferenceWeight = supports
    .filter((item) => item.evidenceTier === "inferential")
    .reduce((total, item) => total + item.weight, 0);
  const rawScore =
    supportScore / Math.max(1, supportScore + weakenScore) +
    sceneCoverageScore * 0.15 +
    primaryEvidenceRatio * 0.1 -
    contradictionPenalty -
    structuralGapPenalty;

  return {
    support_score: supportScore,
    weaken_score: weakenScore,
    contradiction_penalty: contradictionPenalty,
    structural_gap_penalty: structuralGapPenalty,
    scene_coverage_score: sceneCoverageScore,
    light_inference_weight: lightInferenceWeight,
    primary_evidence_ratio: primaryEvidenceRatio,
    primary_evidence_count: primaryEvidenceCount,
    secondary_evidence_count: secondaryEvidenceCount,
    inferential_evidence_count: inferentialEvidenceCount,
    scenes_supporting_count: scenesSupporting.length,
    scenes_weakening_count: scenesWeakening.length,
    evaluated_scene_count: evaluatedSceneCount,
    heuristic_score: clamp(rawScore),
  };
};

const componentReasoning = (
  level: CausalConfidenceLevel,
  components: ConfidenceComponents,
) =>
  `Confianza ${level}: evidencia a favor ${components.support_score.toFixed(1)}, debilitante ${components.weaken_score.toFixed(1)}, penalizacion por contradicciones ${components.contradiction_penalty.toFixed(2)}, penalizacion por gaps ${components.structural_gap_penalty.toFixed(2)}, cobertura de escenas ${components.scene_coverage_score.toFixed(2)}, peso inferencial ligero ${components.light_inference_weight.toFixed(1)}.`;

const buildEvidenceBundle = (
  scene: CausalSceneInput,
  rule: CausalRule,
): EvidenceBundle | null => {
  const evaluation = evaluateRule(scene, rule);
  const primaryAndSecondaryScore =
    evaluation.primarySupportScore + evaluation.secondarySupportScore;

  if (primaryAndSecondaryScore < rule.minimumSupportScore) return null;

  const supportScore =
    evaluation.primarySupportScore +
    evaluation.secondarySupportScore +
    Math.min(0.8, evaluation.inferentialSupportScore);
  const openFlags = scene.flags.filter(
    (flag) => flag.status === "open" && flag.severity === "critical",
  );
  const unresolvedContradictions = openFlags.map((flag) =>
    `${flag.flagType ?? "consistency_flag"}: ${flag.description ?? "Open critical consistency flag"}`,
  );
  const structuralGaps = rule.evidenceVariables.filter(
    (variable) => !hasMeaningfulValue(scene.variables[variable]),
  );
  const components = confidenceComponents(
    supportScore,
    evaluation.weakenScore,
    evaluation.supports,
    evaluation.weakens,
    unresolvedContradictions,
    structuralGaps,
    1,
  );
  const score = clamp(
    (supportScore - evaluation.weakenScore) / rule.strongSupportScore -
      components.contradiction_penalty -
      components.structural_gap_penalty * 0.4,
  );
  const level = confidenceLevel(score);

  return {
    id: `${scene.sceneId}:${rule.id}`,
    ruleId: rule.id,
    nodeId: rule.nodeId,
    node_code_canonical: rule.node_code_canonical,
    node_name_canonical: rule.node_name_canonical,
    node_name_commercial: rule.node_name_commercial,
    sceneId: scene.sceneId,
    sceneName: scene.sceneName,
    supportScore,
    weakenScore: evaluation.weakenScore,
    confidenceScore: score,
    confidenceLevel: level,
    confidenceReasoning: componentReasoning(level, components),
    confidenceComponents: { ...components, heuristic_score: score },
    supports: evaluation.supports,
    weakens: evaluation.weakens,
    unresolvedContradictions,
    structuralGaps,
  };
};

const mergeComponents = (
  bundles: EvidenceBundle[],
  evaluatedSceneCount: number,
): ConfidenceComponents => {
  if (!bundles.length) {
    return { ...EMPTY_COMPONENTS, evaluated_scene_count: evaluatedSceneCount };
  }

  return confidenceComponents(
    bundles.reduce((total, bundle) => total + bundle.supportScore, 0),
    bundles.reduce((total, bundle) => total + bundle.weakenScore, 0),
    bundles.flatMap((bundle) => bundle.supports),
    bundles.flatMap((bundle) => bundle.weakens),
    unique(bundles.flatMap((bundle) => bundle.unresolvedContradictions)),
    unique(bundles.flatMap((bundle) => bundle.structuralGaps)),
    evaluatedSceneCount,
  );
};

const structuralSupportWeight = (
  bundles: EvidenceBundle[],
  nodeId: CausalNodeId,
  signal: keyof StructuralSignals,
) =>
  bundles
    .filter((bundle) => bundle.nodeId === nodeId)
    .flatMap((bundle) => bundle.supports)
    .filter((item) => item.canonicalVariable === `structural_signal.${signal}`)
    .reduce((total, item) => total + item.weight, 0);

const precedenceAdjustedActivationScore = (
  nodeId: CausalNodeId,
  activationScore: number,
  allBundles: EvidenceBundle[],
) => {
  if (nodeId !== "N06") return activationScore;

  const explicitN04BreachWeight = structuralSupportWeight(
    allBundles,
    "N04",
    "explicit_n04_breach",
  );
  const temporalBreakWeight = structuralSupportWeight(
    allBundles,
    "N06",
    "temporal_dependency_break",
  );

  if (explicitN04BreachWeight > 0 && temporalBreakWeight === 0) {
    const precedencePenalty = Math.min(
      activationScore * 0.65,
      explicitN04BreachWeight * 7,
    );
    return Math.max(0, activationScore - precedencePenalty);
  }

  return activationScore;
};

const buildNodeActivations = (
  bundles: EvidenceBundle[],
  evaluatedSceneCount: number,
): NodeActivation[] =>
  CAUSAL_MVP_NODE_SCOPE.map((nodeId) => {
    const nodeBundles = bundles.filter((bundle) => bundle.nodeId === nodeId);
    const definition = CAUSAL_NODE_DEFINITIONS[nodeId];
    const activationScore = nodeBundles.reduce(
      (total, bundle) => total + bundle.supportScore - bundle.weakenScore,
      0,
    );
    const adjustedActivationScore = precedenceAdjustedActivationScore(
      nodeId,
      activationScore,
      bundles,
    );
    const components = mergeComponents(nodeBundles, evaluatedSceneCount);
    const confidenceScore = nodeBundles.length
      ? clamp(
          nodeBundles.reduce((total, bundle) => total + bundle.confidenceScore, 0) /
            nodeBundles.length,
        )
      : 0;
    const level = confidenceLevel(confidenceScore);

    return {
      nodeId,
      node_code_canonical: definition.node_code_canonical,
      node_name_canonical: definition.node_name_canonical,
      node_name_commercial: definition.node_name_commercial,
      motor_node_reference: definition.motor_node_reference,
      nodeLabel: definition.label,
      activated: nodeBundles.length > 0,
      activationScore: adjustedActivationScore,
      confidenceScore,
      confidenceLevel: level,
      confidenceReasoning: componentReasoning(level, {
        ...components,
        heuristic_score: confidenceScore,
      }),
      confidenceComponents: { ...components, heuristic_score: confidenceScore },
      evidenceBundleIds: nodeBundles.map((bundle) => bundle.id),
      rulesActivated: unique(nodeBundles.map((bundle) => bundle.ruleId)),
      scenesThatSupport: unique(nodeBundles.map((bundle) => bundle.sceneId)),
      scenesThatWeaken: unique(
        nodeBundles.flatMap((bundle) =>
          bundle.weakens.length > 0 ? [bundle.sceneId] : [],
        ),
      ),
    };
  })
    .filter((activation) => activation.activated)
    .sort((left, right) => right.activationScore - left.activationScore);

const buildCausalPath = (activations: NodeActivation[]): CausalPath | null => {
  if (!activations.length) return null;

  const activeNodeIds = new Set(activations.map((activation) => activation.nodeId));
  const root = activations[0].nodeId;
  const path: CausalNodeId[] = [root];
  let current = root;

  while (true) {
    const next = CAUSAL_DECISION_TREE_MVP[current].find((nodeId) =>
      activeNodeIds.has(nodeId),
    );

    if (!next || path.includes(next)) break;
    path.push(next);
    current = next;
  }

  const confidenceScore =
    path.reduce((total, nodeId) => {
      const activation = activations.find((item) => item.nodeId === nodeId);
      return total + (activation?.confidenceScore ?? 0);
    }, 0) / path.length;
  const level = confidenceLevel(confidenceScore);

  return {
    id: `PATH-${path.join("-")}`,
    nodeIds: path,
    label: path.map((nodeId) => CAUSAL_NODE_DEFINITIONS[nodeId].label).join(" -> "),
    confidenceScore,
    confidenceLevel: level,
    confidenceReasoning:
      `Camino con confianza ${level}, calculada como promedio heuristico de los nodos activos del camino.`,
    rationale:
      "Camino construido con el arbol causal MVP y los nodos activados por evidencia estructural consolidada.",
  };
};

const sceneReasonCodes = (
  scene: CausalSceneInput,
  bundles: EvidenceBundle[],
) => {
  const hasCritical = bundles.some((bundle) => bundle.unresolvedContradictions.length > 0);
  const gaps = unique(bundles.flatMap((bundle) => bundle.structuralGaps));
  const lowConfidence = bundles.some((bundle) => bundle.confidenceLevel === "low");

  const reentry: CausalReason<CausalReentryReasonCode>[] = [
    ...(hasCritical
      ? [{
          code: "strong_contradiction" as const,
          message: "La escena conserva contradicciones criticas abiertas.",
          sceneId: scene.sceneId,
        }]
      : []),
    ...(gaps.length >= 5
      ? [{
          code: "structural_gaps" as const,
          message: "La escena tiene gaps estructurales relevantes para transduccion.",
          sceneId: scene.sceneId,
        }]
      : []),
  ];

  const expert: CausalReason<CausalExpertReviewReasonCode>[] = [
    ...(lowConfidence
      ? [{
          code: "low_confidence_root" as const,
          message: "Alguna activacion local queda con confianza baja.",
          sceneId: scene.sceneId,
        }]
      : []),
    ...(scene.lightInference?.flaggedForManualReview
      ? [{
          code: "strong_contradiction" as const,
          message: "La preclasificacion ligera marco revision manual.",
          sceneId: scene.sceneId,
        }]
      : []),
  ];

  return { reentry, expert };
};

const buildSceneNodeActivations = (
  scenes: CausalSceneInput[],
  bundles: EvidenceBundle[],
): SceneNodeActivation[] =>
  scenes.map((scene) => {
    const sceneBundles = bundles.filter((bundle) => bundle.sceneId === scene.sceneId);
    const nodeActivations = buildNodeActivations(sceneBundles, 1);
    const confidenceScore = nodeActivations.length
      ? nodeActivations.reduce((total, activation) => total + activation.confidenceScore, 0) /
        nodeActivations.length
      : 0;
    const level = confidenceLevel(confidenceScore);
    const reasonCodes = sceneReasonCodes(scene, sceneBundles);

    return {
      sceneId: scene.sceneId,
      sceneName: scene.sceneName,
      canonicalRecordId: scene.canonicalRecordId,
      scene_confidence_level: level,
      scene_confidence_reasoning: nodeActivations.length
        ? `La escena activa ${nodeActivations.length} nodo(s) con confianza promedio ${confidenceScore.toFixed(2)}.`
        : "La escena no activa nodos dentro del alcance MVP.",
      scene_reentry_reason: reasonCodes.reentry,
      scene_expert_review_reason: reasonCodes.expert,
      node_activations: nodeActivations,
      evidence_bundle_ids: sceneBundles.map((bundle) => bundle.id),
      unresolved_contradictions: unique(sceneBundles.flatMap((bundle) => bundle.unresolvedContradictions)),
      structural_gaps: unique(sceneBundles.flatMap((bundle) => bundle.structuralGaps)),
      evidence_that_supports: sceneBundles.flatMap((bundle) => bundle.supports),
      evidence_that_weakens: sceneBundles.flatMap((bundle) => bundle.weakens),
    };
  });

const crossSceneConflict = (
  activations: NodeActivation[],
) =>
  activations.some(
    (activation) =>
      activation.scenesThatSupport.length > 0 &&
      activation.scenesThatWeaken.some(
        (sceneId) => !activation.scenesThatSupport.includes(sceneId),
      ),
  );

const buildReentryDecision = (
  bundles: EvidenceBundle[],
  outputRow: SessionIntermediateOutputRow | null,
  sceneActivations: SceneNodeActivation[],
): ReentryDecision => {
  const contradictions = bundles.flatMap((bundle) => bundle.unresolvedContradictions);
  const gaps = unique(bundles.flatMap((bundle) => bundle.structuralGaps)).slice(0, 12);
  const sessionOutput = parseJsonIfNeeded<Record<string, unknown>>(
    outputRow?.output_json,
    {},
  );
  const readiness = isRecord(sessionOutput.readiness) ? sessionOutput.readiness : {};
  const reasonCodes: CausalReason<CausalReentryReasonCode>[] = [
    ...(bundles.length === 0
      ? [{
          code: "insufficient_bundle" as const,
          message: "No hay bundle minimo suficiente para activar nodos en el alcance MVP.",
        }]
      : []),
    ...(contradictions.length > 0
      ? [{
          code: "strong_contradiction" as const,
          message: "Existen contradicciones criticas abiertas en bundles activados.",
        }]
      : []),
    ...(gaps.length >= 8
      ? [{
          code: "structural_gaps" as const,
          message: "Hay varios gaps estructurales relevantes para Capa 2.",
        }]
      : []),
    ...(readiness.requiresClarification
      ? [{
          code: "session_requires_clarification" as const,
          message: "La salida intermedia de sesion marca aclaracion requerida.",
        }]
      : []),
    ...(sceneActivations.some((scene) => scene.scene_reentry_reason.length > 0)
      ? [{
          code: "cross_scene_conflict" as const,
          message: "Al menos una escena requiere reentrada local antes de consolidar la lectura.",
        }]
      : []),
  ];

  return {
    needsReentry: reasonCodes.length > 0,
    reasonCodes,
    reasons: reasonCodes.map((reason) => reason.message),
    suggestedFocus: gaps,
  };
};

const buildExpertReviewFlag = (
  activations: NodeActivation[],
  reentry: ReentryDecision,
  path: CausalPath | null,
): ExpertReviewFlag => {
  const lowConfidenceRoot = activations[0]?.confidenceLevel === "low";
  const multipleNodes = activations.length >= 3;
  const ambiguousTopNodes =
    activations.length >= 2 &&
    Math.abs(activations[0].activationScore - activations[1].activationScore) <= 5;
  const hasConflict = crossSceneConflict(activations);
  const conflictingPath = activations.length > 1 && (!path || path.nodeIds.length === 1);

  const reasonCodes: CausalReason<CausalExpertReviewReasonCode>[] = [
    ...(lowConfidenceRoot
      ? [{
          code: "low_confidence_root" as const,
          message: "El nodo raiz probable dentro del MVP tiene confianza baja.",
          nodeId: activations[0]?.nodeId ?? null,
        }]
      : []),
    ...(ambiguousTopNodes
      ? [{
          code: "node_ambiguity" as const,
          message: "Los nodos principales tienen puntajes demasiado cercanos.",
        }]
      : []),
    ...(conflictingPath
      ? [{
          code: "conflicting_paths" as const,
          message: "Hay nodos activos que el arbol MVP no conecta en un camino claro.",
        }]
      : []),
    ...(multipleNodes
      ? [{
          code: "multi_node_pattern_needs_human_composition" as const,
          message: "Se activaron varios nodos y conviene composicion humana de jerarquia causal.",
        }]
      : []),
    ...(hasConflict
      ? [{
          code: "cross_scene_conflict" as const,
          message: "Hay escenas que sostienen y otras que tensionan la misma lectura.",
        }]
      : []),
    ...(reentry.reasonCodes.some((reason) => reason.code === "strong_contradiction")
      ? [{
          code: "strong_contradiction" as const,
          message: "La reentrada reporta contradiccion fuerte abierta.",
        }]
      : []),
  ];

  return {
    needsExpertReview: reasonCodes.length > 0,
    reasonCodes,
    reasons: reasonCodes.map((reason) => reason.message),
    severity:
      reentry.needsReentry || lowConfidenceRoot || hasConflict
        ? "high"
        : reasonCodes.length
          ? "moderate"
          : "none",
  };
};

const sessionConfidenceFromRootMargin = (
  root: NodeActivation | null,
  secondaryNodes: NodeActivation[],
) => {
  const baseLevel = root?.confidenceLevel ?? "low";
  const runnerUp = secondaryNodes[0] ?? null;

  if (!root || !runnerUp) {
    return {
      level: baseLevel,
      margin: null,
      note: "No hay segundo nodo activo suficiente para tensionar la confianza de sesion.",
    };
  }

  const margin = root.activationScore - runnerUp.activationScore;
  const marginRatio = root.activationScore > 0 ? margin / root.activationScore : 0;

  if (baseLevel === "high" && (margin <= 5 || marginRatio <= 0.12)) {
    return {
      level: "medium" as const,
      margin,
      note:
        "La confianza de sesion baja a medium porque la raiz probable compite estrechamente con otro nodo activo.",
    };
  }

  if (baseLevel === "medium" && margin <= 2) {
    return {
      level: "low" as const,
      margin,
      note:
        "La confianza de sesion baja a low porque dos hipotesis causales rivales quedan casi empatadas.",
    };
  }

  return {
    level: baseLevel,
    margin,
    note: "El margen entre raiz probable y segundo nodo no exige degradar la confianza de sesion.",
  };
};

const sceneListText = (
  scenes: Array<{ sceneId: string; sceneName: string | null }>,
) =>
  scenes.length
    ? scenes.map((scene) => scene.sceneName ?? scene.sceneId).join(", ")
    : "sin escenas suficientes";

const firstTrenchQuote = (scenes: CausalSceneInput[]) => {
  for (const scene of scenes) {
    const phrase = valueText(scene.variables.frase_trinchera?.value).trim();
    if (phrase) return phrase.length > 180 ? `${phrase.slice(0, 177)}...` : phrase;
  }

  return null;
};

const selectNarrativeVariant = (
  root: NodeActivation | null,
  path: CausalPath | null,
  activations: NodeActivation[],
  expertReview: ExpertReviewFlag,
  trenchQuote: string | null,
): NarrativeVariantSelection => {
  const audience: NarrativeAudience = "expert_internal";
  const severity =
    expertReview.severity === "high"
      ? "high"
      : root?.confidenceLevel === "high"
        ? "medium"
        : "low";
  const recursionDetected =
    activations.some((activation) => activation.scenesThatSupport.length > 1) ||
    Boolean(path && path.nodeIds.length >= 3);
  const causalConfidence = root?.confidenceLevel ?? "low";
  const templateId =
    audience === "expert_internal" && severity === "high"
      ? "expert_internal_high"
      : audience === "expert_internal"
        ? "expert_internal_medium"
        : audience;

  return {
    variantId: `${audience}_${severity}_${recursionDetected ? "recursive" : "local"}_${causalConfidence}`,
    templateId,
    selectedForNode: root?.nodeId ?? null,
    selectedForPath: path?.id ?? null,
    audience,
    severity,
    recursionDetected,
    causalConfidence,
    trenchQuote,
    boundary: "preliminary_auditable_narrative",
    reason:
      "Seleccion disciplinada por audiencia default interna, severidad, recursion detectada y confianza causal.",
  };
};

const buildNarrative = (
  selection: NarrativeVariantSelection,
  root: NodeActivation | null,
  path: CausalPath | null,
  supportScenes: Array<{ sceneId: string; sceneName: string | null }>,
  weakeningScenes: Array<{ sceneId: string; sceneName: string | null }>,
  reentry: ReentryDecision,
  expertReview: ExpertReviewFlag,
) => {
  const template =
    CAUSAL_NARRATIVE_TEMPLATES_MVP[
      selection.templateId as keyof typeof CAUSAL_NARRATIVE_TEMPLATES_MVP
    ] ?? CAUSAL_NARRATIVE_TEMPLATES_MVP.expert_internal_medium;
  const trenchQuote = selection.trenchQuote
    ? `Cita de trinchera disponible: "${selection.trenchQuote}". `
    : "";
  const base = template
    .replace("{rootNode}", root?.nodeLabel ?? "ningun nodo suficientemente activado")
    .replace("{path}", path?.label ?? "sin camino causal suficiente")
    .replace("{supportScenes}", sceneListText(supportScenes))
    .replace("{weakeningScenes}", sceneListText(weakeningScenes))
    .replace("{trenchQuote}", trenchQuote);
  const reentryText = reentry.needsReentry
    ? ` ${CAUSAL_NARRATIVE_TEMPLATES_MVP.needsReentry.replace(
        "{reasons}",
        reentry.reasonCodes.map((reason) => reason.code).join(", "),
      )}`
    : "";
  const reviewText = expertReview.needsExpertReview
    ? ` ${CAUSAL_NARRATIVE_TEMPLATES_MVP.needsExpertReview.replace(
        "{reasons}",
        expertReview.reasonCodes.map((reason) => reason.code).join(", "),
      )}`
    : "";

  return `${base}${reentryText}${reviewText}`;
};

export async function runCausalTransductionMvp(
  sessionId: string,
): Promise<PreliminaryDiagnosticOutput> {
  const { data: outputRows, error: outputError } = await supabaseServer
    .from("session_intermediate_output")
    .select(
      "id,sesion_id,instrument_version,output_json,readiness_for_transduction,generated_from_scene_ids,generated_at,updated_at",
    )
    .eq("sesion_id", sessionId)
    .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (outputError) throw new Error(outputError.message);

  const sessionOutput = (outputRows?.[0] ?? null) as SessionIntermediateOutputRow | null;

  const { data: records, error: recordsError } = await supabaseServer
    .from("scene_canonical_records")
    .select(
      "id,scene_id,canonical_json,evidence_answer_ids,consistency_flag_ids,readiness_for_transduction,created_at,updated_at",
    )
    .eq("sesion_id", sessionId)
    .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION)
    .order("created_at", { ascending: true });

  if (recordsError) throw new Error(recordsError.message);

  const rows = (records ?? []) as SceneCanonicalRecordRow[];
  const scenes: CausalSceneInput[] = rows.map((row) => {
    const canonical = parseJsonIfNeeded<CanonicalJson>(row.canonical_json, {});
    const sceneId = canonical.sceneMetadata?.sceneId ?? row.scene_id;

    return {
      canonicalRecordId: row.id,
      sceneId,
      sceneName: canonical.sceneMetadata?.sceneName ?? null,
      canonical,
      variables: flattenVariables(canonical.canonicalVariablesByBlock),
      flags: canonical.consistency?.flags ?? [],
      lightInference: canonical.lightInference ?? null,
    };
  });

  const evidenceBundles = scenes.flatMap((scene) =>
    CAUSAL_RULES_MVP.map((rule) => buildEvidenceBundle(scene, rule)).filter(
      (bundle): bundle is EvidenceBundle => Boolean(bundle),
    ),
  );
  const activations = buildNodeActivations(evidenceBundles, scenes.length);
  const root = activations[0] ?? null;
  const secondaryNodes = activations.slice(1);
  const path = buildCausalPath(activations);
  const sceneActivations = buildSceneNodeActivations(scenes, evidenceBundles);
  const supportEvidence = evidenceBundles.flatMap((bundle) => bundle.supports);
  const weakenEvidence = evidenceBundles.flatMap((bundle) => bundle.weakens);
  const scenesById = new Map(
    scenes.map((scene) => [scene.sceneId, { sceneId: scene.sceneId, sceneName: scene.sceneName }]),
  );
  const supportScenes = unique(
    evidenceBundles.flatMap((bundle) =>
      bundle.supports.length > 0 ? [bundle.sceneId] : [],
    ),
  ).map((sceneId) => scenesById.get(sceneId) ?? { sceneId, sceneName: null });
  const weakeningScenes = unique(
    evidenceBundles.flatMap((bundle) =>
      bundle.weakens.length > 0 ? [bundle.sceneId] : [],
    ),
  ).map((sceneId) => scenesById.get(sceneId) ?? { sceneId, sceneName: null });
  const reentry = buildReentryDecision(evidenceBundles, sessionOutput, sceneActivations);
  const expertReview = buildExpertReviewFlag(activations, reentry, path);
  const components = root?.confidenceComponents ?? mergeComponents(evidenceBundles, scenes.length);
  const sessionConfidence = sessionConfidenceFromRootMargin(root, secondaryNodes);
  const outputConfidence = sessionConfidence.level;
  const rulesActivatedIds = unique(evidenceBundles.map((bundle) => bundle.ruleId));
  const rulesActivated = CAUSAL_RULES_MVP.filter((rule) =>
    rulesActivatedIds.includes(rule.id),
  );
  const trenchQuote = firstTrenchQuote(scenes);
  const narrativeVariant = selectNarrativeVariant(
    root,
    path,
    activations,
    expertReview,
    trenchQuote,
  );

  return {
    schema_version: "capa2_preliminary_diagnostic_mvp_v3",
    session_id: sessionId,
    generated_at: new Date().toISOString(),
    source: {
      session_intermediate_output_id: sessionOutput?.id ?? null,
      canonical_record_ids: rows.map((row) => row.id),
      scene_ids: rows.map((row) => row.scene_id),
      instrument_version: sessionOutput?.instrument_version ?? CAPA1_V2_1_INSTRUMENT_VERSION,
    },
    selected_nodes_scope: CAUSAL_MVP_NODE_SCOPE,
    node_equivalence_map: CAUSAL_MVP_NODE_SCOPE.map((nodeId) => CAUSAL_NODE_DEFINITIONS[nodeId]),
    mvp_scope_note:
      "root_node_probable se conserva por compatibilidad, pero debe leerse como root_node_probable_within_mvp_scope porque esta version solo evalua N03, N04, N06 y N10. Los codigos legacy del MVP anterior quedan en legacy_mvp_code/motor_node_reference.legacyMvpCode.",
    root_node_probable: root,
    root_node_probable_within_mvp_scope: root,
    secondary_nodes_activated: secondaryNodes,
    scene_node_activations: sceneActivations,
    causal_path_probable: path,
    evidence_bundle_used: evidenceBundles,
    evidence_that_supports: supportEvidence,
    evidence_that_weakens: weakenEvidence,
    scenes_that_support: supportScenes,
    scenes_that_weaken: weakeningScenes,
    rules_activated: rulesActivated,
    unresolved_contradictions: unique(
      evidenceBundles.flatMap((bundle) => bundle.unresolvedContradictions),
    ),
    relevant_structural_gaps: unique(
      evidenceBundles.flatMap((bundle) => bundle.structuralGaps),
    ),
    confidence_level: outputConfidence,
    confidence_reasoning: `${componentReasoning(outputConfidence, components)} ${sessionConfidence.note}`,
    confidence_components: components,
    needs_reentry: reentry.needsReentry,
    reentry_reason: reentry.reasonCodes,
    reentry_decision: reentry,
    needs_expert_review: expertReview.needsExpertReview,
    expert_review_reason: expertReview.reasonCodes,
    expert_review_flag: expertReview,
    narrative_variant_selection: narrativeVariant,
    preliminary_narrative: buildNarrative(
      narrativeVariant,
      root,
      path,
      supportScenes,
      weakeningScenes,
      reentry,
      expertReview,
    ),
    persistence_contract: {
      prepared: true,
      tables: [
        "session_causal_outputs",
        "scene_causal_activations",
        "causal_rule_executions",
      ],
      sqlFile: "sql/capa2_causal_outputs.sql",
      routePersistsOutput: true,
      note: "Contrato SQL preparado y ruta MVP conectada a persistencia por defecto; requiere que las tablas existan en Supabase.",
    },
    boundary: {
      does_not_produce_final_truth: true,
      does_not_replace_expert_judgment: true,
      does_not_generate_final_inevitability_theorem: true,
      root_node_is_limited_to_mvp_scope: true,
    },
  };
}
