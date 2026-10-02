import { supabaseServer } from "@/lib/supabase-server";
import {
  CANONICAL_DERIVATION_VERSION,
  CAPA1_V2_1_INSTRUMENT_VERSION,
} from "@/domain/canonical-variables";
import type { PreclassificationReadiness } from "@/domain/scene";
import { block7RuntimeContract } from "@/runtime/capa1-runtime-manifest";

type SceneBlockDerivationRow = {
  id: string;
  block_id: string;
  derivation_key: string;
  derivation_value: unknown;
  evidence_answer_ids: string[];
  confidence: number | null;
};

type SceneQuestionAnswerRow = {
  id: string;
  question_code: string;
  selected_value: string | null;
  selected_values: string[] | null;
  free_text: string | null;
  answer_json: unknown;
};

type ScoreEntry = {
  score: number;
  evidenceVariables: string[];
  reasons: string[];
};

type ScoreBoard = Record<string, ScoreEntry>;

export type PreclassifySceneInput = {
  sessionId: string;
  sceneId: string;
};

export type PreclassifySceneResult = {
  inferenceId: string;
  preclassificationSceneType: string | null;
  preclassificationChainPosition: string | null;
  preclassificationVsmRole: string | null;
  preclassificationAheSignal: string | null;
  preclassificationAheLevelDominant: string;
  preclassificationInterpersonalSignal: string;
  preclassificationMissionSuggested: string | null;
  confidenceLevel: "high" | "medium" | "low";
  confidenceScore: number;
  questionsTriggered: string[];
  preclassificationGapFlag: boolean;
  flaggedForManualReview: boolean;
  preclassificationReadiness: PreclassificationReadiness;
  savedBlock7Derivations: number;
};

const parseJsonIfNeeded = (value: unknown) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapValue = (value: unknown) => {
  const parsed = parseJsonIfNeeded(value);
  if (isRecord(parsed) && "value" in parsed) return parsed.value;
  return parsed;
};

const answerValue = (answer: SceneQuestionAnswerRow) => {
  const parsedJson = parseJsonIfNeeded(answer.answer_json);

  if (parsedJson !== null && parsedJson !== undefined) return parsedJson;
  if (answer.selected_values?.length) return answer.selected_values;
  if (answer.selected_value && answer.free_text) {
    return {
      selectedValue: answer.selected_value,
      freeText: answer.free_text,
    };
  }
  if (answer.selected_value) return answer.selected_value;
  if (answer.free_text) return answer.free_text;

  return null;
};

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
};

const textOf = (value: unknown) => {
  if (!hasValue(value)) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  if (isRecord(value)) return Object.values(value).join(" ").toLowerCase();
  return String(value).toLowerCase();
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const increment = (
  board: ScoreBoard,
  label: string,
  amount: number,
  variable: string,
  reason: string,
) => {
  board[label] = board[label] ?? {
    score: 0,
    evidenceVariables: [],
    reasons: [],
  };
  board[label].score += amount;
  board[label].evidenceVariables = unique([
    ...board[label].evidenceVariables,
    variable,
  ]);
  board[label].reasons = unique([...board[label].reasons, reason]);
};

const winner = (board: ScoreBoard) => {
  const entries = Object.entries(board).sort(
    ([, left], [, right]) => right.score - left.score,
  );
  const [top, second] = entries;

  if (!top || top[1].score <= 0) {
    return {
      label: null,
      score: 0,
      evidenceVariables: [] as string[],
      reasons: [] as string[],
      ambiguity: false,
    };
  }

  return {
    label: top[0],
    score: top[1].score,
    evidenceVariables: top[1].evidenceVariables,
    reasons: top[1].reasons,
    ambiguity: Boolean(second && second[1].score >= top[1].score * 0.75),
  };
};

const missionFromText = (text: string) => {
  if (/(venta|cliente nuevo|comercial|prospect|cotiza)/.test(text)) return "1";
  if (/(fabric|produc|armar|crear|manufact|operaci[oó]n)/.test(text)) return "2";
  if (/(entreg|servicio|instal|funcion|cliente final)/.test(text)) return "3";
  if (/(cobrar|pagar|finanz|factur|dinero|presupuesto)/.test(text)) return "4";
  if (/(personal|capacit|contrat|talento|nomina|n[oó]mina)/.test(text)) return "5";
  if (/(compr|insumo|proveedor|herramient|mantenim)/.test(text)) return "6";
  if (/(calidad|cumpl|riesgo|auditor|control)/.test(text)) return "7";
  if (/(investig|invent|mejor|futuro|innov|redise)/.test(text)) return "8";
  if (/(dirig|meta|estrateg|represent|gobiern|direccion|direcci[oó]n)/.test(text)) return "9";
  return null;
};

const confidence = (winners: Array<ReturnType<typeof winner>>) => {
  const useful = winners.filter((item) => item.label);
  if (!useful.length) return 20;

  const base =
    (useful.reduce((sum, item) => sum + Math.min(item.score, 4), 0) /
      (useful.length * 4)) *
    100;
  const ambiguityPenalty = useful.some((item) => item.ambiguity) ? 12 : 0;
  const score = Math.max(20, Math.min(95, base - ambiguityPenalty));

  return Math.round(score);
};

const confidenceLevel = (score: number): "high" | "medium" | "low" => {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
};

const normalizeSceneType = (label: string | null) =>
  ({
    operational_transformation: "transformation",
    handoff_delivery: "coordination",
    coordination_dependency: "coordination",
    capacity_regulation: "adaptation",
    exception_compensation: "compensation",
    purpose_boundary: "policy",
  })[label ?? ""] ?? (label ?? "uncertain");

const normalizeChainPosition = (label: string | null) =>
  ({
    upstream: "opening",
    core: "intermediate",
    control: "intermediate",
    support_reentry: "intermediate",
    downstream: "closing",
  })[label ?? ""] ?? (label ?? "uncertain");

const normalizeVsmRole = (label: string | null) =>
  ({
    S3_star: "S3*",
    algedonic_channel: "algedonic",
  })[label ?? ""] ?? (label ?? "uncertain");

const isNegativeAnswer = (answer: SceneQuestionAnswerRow | undefined) => {
  if (!answer) return false;
  return /(no|not_main|uncertain|mixed|correct|reject|rechaz)/i.test(
    textOf(answerValue(answer)),
  );
};

const scoreAheDominant = (values: Record<string, unknown>) => {
  const intrapersonal = [
    values.desgaste_acumulado,
    values.costo_percibido,
    values.human_sacrifice,
    values.sacrificio_humano,
  ].filter(hasValue).length;
  const interpersonal = [
    values.missing_information_relational_effect,
    values.interpersonal_compensation_pattern,
    values.compensation_primary_mechanism,
    values.informacion_faltante,
  ].filter(hasValue).length;
  const organizational = [
    values.regla_informal_conocida,
    values.resource_bargain_5_14,
    values.structural_tradeoff_pressure,
    values.capacity_gap,
  ].filter(hasValue).length;
  const scores = { intrapersonal, interpersonal, organizational };
  const active = Object.entries(scores).filter(([, score]) => score > 0);

  if (!active.length) return "uncertain";
  const max = Math.max(...active.map(([, score]) => score));
  const winners = active.filter(([, score]) => score === max);
  return winners.length > 1 ? "mixed" : winners[0][0];
};

const inferInterpersonalSignal = (values: Record<string, unknown>) => {
  const text = [
    values.missing_information_relational_effect,
    values.interpersonal_compensation_pattern,
    values.compensation_primary_mechanism,
    values.informacion_faltante,
    values.ahe_observation_bundle,
  ]
    .map(textOf)
    .join(" ");

  if (!text.trim()) return "uncertain";
  if (/(perseguir|persigo|seguimiento|respuesta|respuestas|pursuit)/.test(text)) return "pursuit";
  if (/(insist|presion|recordar|remind)/.test(text)) return "insistence";
  if (/(apoyo|soporte|ayuda|informal_support)/.test(text)) return "informal_support";
  if (/(rebota|bounce|regresa|devuelve|pasa la carga)/.test(text)) return "load_bounce";
  if (/(relacion|relacional|sostener|absorber friccion|buffer)/.test(text)) return "relational_buffering";
  if (/(area|areas|equipo|friccion|conflicto|cross)/.test(text)) return "cross_area_friction";
  return "mixed";
};

const hasInterpersonalSupport = (values: Record<string, unknown>) =>
  [
    "missing_information_relational_effect",
    "interpersonal_compensation_pattern",
    "compensation_primary_mechanism",
    "informacion_faltante",
  ].some((variable) => hasValue(values[variable]));

const preclassificationReadiness = ({
  level,
  ambiguous,
  missingCoreEvidence,
  hasCriticalInterpersonalGap,
  questionsTriggered,
  userContradiction,
}: {
  level: "high" | "medium" | "low";
  ambiguous: boolean;
  missingCoreEvidence: boolean;
  hasCriticalInterpersonalGap: boolean;
  questionsTriggered: string[];
  userContradiction: boolean;
}): PreclassificationReadiness => {
  if (missingCoreEvidence || level === "low") return "insufficient_evidence";
  if (hasCriticalInterpersonalGap) return "needs_support_reentry";
  if (userContradiction) return "needs_manual_review";
  if (ambiguous || questionsTriggered.length) return "needs_micro_confirmation";
  return "ready_for_transduction";
};

const triggeredMicroconfirmations = ({
  sceneType,
  chainPosition,
  vsmRole,
  aheSignal,
  aheLevelDominant,
  interpersonalSignal,
  mission,
  level,
}: {
  sceneType: ReturnType<typeof winner>;
  chainPosition: ReturnType<typeof winner>;
  vsmRole: ReturnType<typeof winner>;
  aheSignal: ReturnType<typeof winner>;
  aheLevelDominant: string;
  interpersonalSignal: string;
  mission: string | null;
  level: "high" | "medium" | "low";
}) => {
  if (
    level === "high" &&
    !sceneType.ambiguity &&
    !chainPosition.ambiguity &&
    !vsmRole.ambiguity &&
    !aheSignal.ambiguity &&
    interpersonalSignal === "uncertain"
  ) {
    return [];
  }

  const triggered: string[] = [];
  if (sceneType.ambiguity || !sceneType.label) triggered.push("7.1");
  if (chainPosition.ambiguity || !chainPosition.label) triggered.push("7.2");

  const shouldAskInterpersonal =
    aheLevelDominant === "interpersonal" &&
    interpersonalSignal !== "uncertain" &&
    (level === "medium" || level === "low" || aheSignal.ambiguity || vsmRole.ambiguity);
  const shouldAskRegulatory = vsmRole.ambiguity || aheSignal.ambiguity || !vsmRole.label;

  if (shouldAskInterpersonal) triggered.push("7.3a");
  else if (shouldAskRegulatory) triggered.push("7.3");

  if (!mission) triggered.push("7.4");

  return unique(triggered).slice(
    0,
    block7RuntimeContract.max_microconfirmations_per_scene,
  );
};

const buildVariableMaps = (derivations: SceneBlockDerivationRow[]) => {
  const values: Record<string, unknown> = {};
  const evidenceByVariable: Record<string, string[]> = {};

  for (const derivation of derivations) {
    values[derivation.derivation_key] = unwrapValue(derivation.derivation_value);
    evidenceByVariable[derivation.derivation_key] =
      derivation.evidence_answer_ids ?? [];
  }

  return { values, evidenceByVariable };
};

const addIfPresent = (
  values: Record<string, unknown>,
  board: ScoreBoard,
  variable: string,
  target: string,
  amount: number,
  reason: string,
) => {
  if (hasValue(values[variable])) {
    increment(board, target, amount, variable, reason);
  }
};

const scoreSceneType = (values: Record<string, unknown>) => {
  const board: ScoreBoard = {};

  addIfPresent(values, board, "objeto_tipo", "operational_transformation", 1, "Object dimension is present.");
  addIfPresent(values, board, "transformation_state_final", "operational_transformation", 1, "Final state is present.");
  addIfPresent(values, board, "output_object", "handoff_delivery", 1, "Output is present.");
  addIfPresent(values, board, "receiver_immediate", "handoff_delivery", 1, "Immediate receiver is present.");
  addIfPresent(values, board, "dependency_previous", "coordination_dependency", 1, "Previous dependency is present.");
  addIfPresent(values, board, "dependency_next", "coordination_dependency", 1, "Next dependency is present.");
  addIfPresent(values, board, "delivery_channel", "coordination_dependency", 0.8, "Delivery channel is present.");
  addIfPresent(values, board, "capacidad_nominal_5_1", "capacity_regulation", 1, "Nominal capacity is present.");
  addIfPresent(values, board, "brecha_capacidad_5_3", "capacity_regulation", 1, "Capacity gap is present.");
  addIfPresent(values, board, "resource_bargain_5_14", "capacity_regulation", 1, "Resource bargain is present.");
  addIfPresent(values, board, "workaround_used", "exception_compensation", 1, "Workaround signal is present.");
  addIfPresent(values, board, "retrabajo_presente", "exception_compensation", 1, "Rework signal is present.");
  addIfPresent(values, board, "sacrificio_humano", "exception_compensation", 1, "Human sacrifice signal is present.");
  addIfPresent(values, board, "beneficiario_final_0_5_1", "purpose_boundary", 0.8, "Beneficiary is present.");
  addIfPresent(values, board, "beneficio_vs_dano_distribucion_0_5_1b", "purpose_boundary", 1, "Benefit/damage distribution is present.");

  return winner(board);
};

const scoreChainPosition = (values: Record<string, unknown>) => {
  const board: ScoreBoard = {};

  addIfPresent(values, board, "trigger_preconditions", "upstream", 1, "Preconditions suggest upstream position.");
  addIfPresent(values, board, "dependency_previous", "upstream", 1, "Previous dependency suggests upstream position.");
  addIfPresent(values, board, "objeto_tipo", "core", 0.8, "Object transformation suggests core work.");
  addIfPresent(values, board, "transformation_state_final", "core", 1, "Final state suggests core work.");
  addIfPresent(values, board, "receiver_immediate", "downstream", 1, "Immediate receiver suggests downstream handoff.");
  addIfPresent(values, board, "dependency_next", "downstream", 1, "Next dependency suggests downstream position.");
  addIfPresent(values, board, "delivery_channel", "downstream", 0.8, "Delivery channel suggests downstream handoff.");
  addIfPresent(values, board, "validation_rule", "control", 1, "Validation rule suggests control.");
  addIfPresent(values, board, "discrecionalidad_5_9", "control", 0.8, "Discretion signal suggests regulation/control.");
  addIfPresent(values, board, "workaround_used", "support_reentry", 1, "Workaround suggests support or reentry.");
  addIfPresent(values, board, "informacion_faltante", "support_reentry", 1, "Missing information suggests support or reentry.");

  return winner(board);
};

const scoreVsmRole = (values: Record<string, unknown>) => {
  const board: ScoreBoard = {};

  addIfPresent(values, board, "objeto_tipo", "S1", 1, "Object transformation suggests S1.");
  addIfPresent(values, board, "transformation_state_final", "S1", 1, "State change suggests S1.");
  addIfPresent(values, board, "delivery_channel", "S2", 1, "Coordination channel suggests S2.");
  addIfPresent(values, board, "flow_deviation_frequency", "S2", 1, "Flow deviation suggests S2 concern.");
  addIfPresent(values, board, "resource_bargain_5_14", "S3", 1, "Resource bargain suggests S3.");
  addIfPresent(values, board, "discrecionalidad_5_9", "S3", 1, "Discretion signal suggests S3.");
  addIfPresent(values, board, "receiver_feedback", "S3_star", 1, "Feedback signal suggests S3*.");
  addIfPresent(values, board, "delivery_failure_exists", "S3_star", 0.8, "Failure visibility suggests S3*.");
  addIfPresent(values, board, "alternative_paths", "S4", 0.8, "Alternative paths suggest adaptation.");
  addIfPresent(values, board, "scene_enabled_milestone", "S4", 0.5, "Milestone context may support adaptation.");
  addIfPresent(values, board, "beneficio_vs_dano_distribucion_0_5_1b", "S5", 1, "Benefit/damage boundary suggests S5.");
  addIfPresent(values, board, "scene_macro_process", "S5", 0.6, "Macro process gives identity/value context.");

  return winner(board);
};

const scoreAheSignal = (values: Record<string, unknown>) => {
  const board: ScoreBoard = {};

  addIfPresent(values, board, "informacion_faltante", "curiosity_blocked", 1, "Missing information blocks curiosity.");
  addIfPresent(values, board, "receiver_immediate", "empathy_handoff", 0.7, "Receiver signal enables handoff empathy.");
  addIfPresent(values, board, "receiver_feedback", "empathy_handoff", 0.8, "Feedback signal affects empathy.");
  addIfPresent(values, board, "workaround_used", "creative_compensation", 1, "Workaround indicates creative compensation.");
  addIfPresent(values, board, "discrecionalidad_5_9", "agency_constraint", 0.8, "Discretion signal affects agency.");
  addIfPresent(values, board, "sacrificio_humano", "human_compensation", 1, "Human sacrifice signal is present.");
  addIfPresent(values, board, "desgaste_acumulado", "human_compensation", 1, "Accumulated wear signal is present.");
  addIfPresent(values, board, "costo_percibido", "human_compensation", 0.8, "Perceived cost signal is present.");
  addIfPresent(values, board, "beneficio_vs_dano_distribucion_0_5_1b", "identity_boundary", 1, "Benefit/damage boundary affects identity.");

  return winner(board);
};

const inferMission = (values: Record<string, unknown>) => {
  const text = [
    values.scene_macro_process,
    values.scene_enabled_milestone,
    values.beneficiario_final_0_5_1,
    values.output_object,
    values.validation_rule,
  ]
    .map(textOf)
    .join(" ");

  return missionFromText(text);
};

const buildReasoning = (
  sceneType: ReturnType<typeof winner>,
  chainPosition: ReturnType<typeof winner>,
  vsmRole: ReturnType<typeof winner>,
  aheSignal: ReturnType<typeof winner>,
  mission: string | null,
) =>
  [
    sceneType.label
      ? `Scene type inferred as ${sceneType.label} from ${sceneType.evidenceVariables.join(", ")}.`
      : "Scene type could not be inferred with enough evidence.",
    chainPosition.label
      ? `Chain position inferred as ${chainPosition.label} from ${chainPosition.evidenceVariables.join(", ")}.`
      : "Chain position could not be inferred with enough evidence.",
    vsmRole.label
      ? `VSM role inferred as ${vsmRole.label} from ${vsmRole.evidenceVariables.join(", ")}.`
      : "VSM role could not be inferred with enough evidence.",
    aheSignal.label
      ? `AHE signal inferred as ${aheSignal.label} from ${aheSignal.evidenceVariables.join(", ")}.`
      : "AHE signal could not be inferred with enough evidence.",
    mission
      ? `Mission suggested as option ${mission} from textual macro-process signals.`
      : "Mission could not be suggested from available text.",
  ].join(" ");

const evidenceIdsFor = (
  variables: readonly string[],
  evidenceByVariable: Record<string, string[]>,
) => unique(variables.flatMap((variable) => evidenceByVariable[variable] ?? []));

export async function preclassifySceneLightly({
  sessionId,
  sceneId,
}: PreclassifySceneInput): Promise<PreclassifySceneResult> {
  const [derivationsResult, block7AnswersResult] = await Promise.all([
    supabaseServer
      .from("scene_block_derivations")
      .select("id, block_id, derivation_key, derivation_value, evidence_answer_ids, confidence")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
    supabaseServer
      .from("scene_question_answers")
      .select("id, question_code, selected_value, selected_values, free_text, answer_json")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION)
      .eq("block_id", "block_7"),
  ]);

  if (derivationsResult.error) {
    throw new Error(derivationsResult.error.message);
  }
  if (block7AnswersResult.error) {
    throw new Error(block7AnswersResult.error.message);
  }

  const derivations =
    (derivationsResult.data ?? []) as unknown as SceneBlockDerivationRow[];
  const block7Answers =
    (block7AnswersResult.data ?? []) as unknown as SceneQuestionAnswerRow[];
  const { values, evidenceByVariable } = buildVariableMaps(derivations);

  const sceneType = scoreSceneType(values);
  const chainPosition = scoreChainPosition(values);
  const vsmRole = scoreVsmRole(values);
  const aheSignal = scoreAheSignal(values);
  const normalizedSceneType = normalizeSceneType(sceneType.label);
  const normalizedChainPosition = normalizeChainPosition(chainPosition.label);
  const normalizedVsmRole = normalizeVsmRole(vsmRole.label);
  const aheLevelDominant = scoreAheDominant(values);
  const interpersonalSignal = inferInterpersonalSignal(values);
  const interpersonalSupported = hasInterpersonalSupport(values);
  const mission = inferMission(values);
  const score = confidence([sceneType, chainPosition, vsmRole, aheSignal]);
  const level = confidenceLevel(score);
  const ambiguous =
    sceneType.ambiguity ||
    chainPosition.ambiguity ||
    vsmRole.ambiguity ||
    aheSignal.ambiguity;
  const missingCoreEvidence =
    !sceneType.label || !chainPosition.label || !vsmRole.label || !mission;
  const reasoning = buildReasoning(
    sceneType,
    chainPosition,
    vsmRole,
    aheSignal,
    mission,
  );
  const allEvidenceVariables = unique([
    ...sceneType.evidenceVariables,
    ...chainPosition.evidenceVariables,
    ...vsmRole.evidenceVariables,
    ...aheSignal.evidenceVariables,
  ]);
  const allEvidenceAnswerIds = evidenceIdsFor(
    allEvidenceVariables,
    evidenceByVariable,
  );
  const userConfirmation = block7Answers.find(
    (answer) => answer.question_code === "7.1",
  );
  const userChainCorrection = block7Answers.find(
    (answer) => answer.question_code === "7.2",
  );
  const userVsmCorrection = block7Answers.find(
    (answer) => answer.question_code === "7.3",
  );
  const userInterpersonalCorrection = block7Answers.find(
    (answer) => answer.question_code === "7.3a",
  );
  const userMissionCorrection = block7Answers.find(
    (answer) => answer.question_code === "7.4",
  );
  const userContradiction = [
    userConfirmation,
    userVsmCorrection,
    userInterpersonalCorrection,
    userMissionCorrection,
  ].some(isNegativeAnswer);
  const hasCriticalInterpersonalGap =
    aheLevelDominant === "interpersonal" && !interpersonalSupported;
  const questionsTriggered = triggeredMicroconfirmations({
    sceneType,
    chainPosition,
    vsmRole,
    aheSignal,
    aheLevelDominant,
    interpersonalSignal,
    mission,
    level,
  });
  const readiness = preclassificationReadiness({
    level,
    ambiguous,
    missingCoreEvidence,
    hasCriticalInterpersonalGap,
    questionsTriggered,
    userContradiction,
  });
  const preclassificationGapFlag =
    missingCoreEvidence || hasCriticalInterpersonalGap || readiness === "insufficient_evidence";
  const flaggedForManualReview =
    readiness === "needs_manual_review" ||
    userContradiction ||
    (level === "low" && ambiguous);
  const aheNote = aheSignal.label
    ? `AHE signal ${aheSignal.label} with dominant level ${aheLevelDominant}.`
    : "AHE signal remains uncertain at Capa 1.";
  const interpersonalNote =
    interpersonalSignal === "uncertain"
      ? "No strong interpersonal support was derived from expanded Block 6."
      : `Interpersonal signal ${interpersonalSignal} derived from expanded Block 6 support.`;
  const refinedAheBundle = {
    dominantLevel: aheLevelDominant,
    interpersonalSignal,
    interpersonalSupported,
    sourceVariables: [
      "missing_information_relational_effect",
      "interpersonal_compensation_pattern",
      "compensation_primary_mechanism",
      "ahe_observation_bundle",
    ].filter((variable) => hasValue(values[variable])),
    notDiagnostic: true,
  };

  const inferenceJson = {
    schemaVersion: "scene_light_preclassification_v1",
    inputs: {
      evidenceVariables: allEvidenceVariables,
      evidenceAnswerIds: allEvidenceAnswerIds,
    },
    scores: {
      sceneType,
      chainPosition,
      vsmRole,
      aheSignal,
    },
    readiness: {
      preclassification_readiness: readiness,
      confidence_score_scale: block7RuntimeContract.confidence_score_scale,
      max_microconfirmations_per_scene:
        block7RuntimeContract.max_microconfirmations_per_scene,
      questions_triggered: questionsTriggered,
      preclassification_gap_flag: preclassificationGapFlag,
      flagged_for_manual_review: flaggedForManualReview,
    },
    complementaryAhe: {
      preclassification_ahe_level_dominant: aheLevelDominant,
      preclassification_interpersonal_signal: interpersonalSignal,
      preclassification_interpersonal_note: interpersonalNote,
      preclassification_ahe_bundle_refined: refinedAheBundle,
    },
    userClarifications: {
      sceneTypeConfirmation: userConfirmation
        ? answerValue(userConfirmation)
        : null,
      chainPositionCorrection: userChainCorrection
        ? answerValue(userChainCorrection)
        : null,
      vsmRoleCorrection: userVsmCorrection
        ? answerValue(userVsmCorrection)
        : null,
      interpersonalConfirmation: userInterpersonalCorrection
        ? answerValue(userInterpersonalCorrection)
        : null,
      missionCorrection: userMissionCorrection
        ? answerValue(userMissionCorrection)
        : null,
    },
  };

  const inferencePayload = {
        sesion_id: sessionId,
        scene_id: sceneId,
        preclassification_scene_type: normalizedSceneType,
        preclassification_chain_position: normalizedChainPosition,
        preclassification_vsm_role: normalizedVsmRole,
        preclassification_ahe_signal: aheSignal.label,
        preclassification_ahe_note: aheNote,
        preclassification_ahe_level_dominant: aheLevelDominant,
        preclassification_interpersonal_signal: interpersonalSignal,
        preclassification_interpersonal_note: interpersonalNote,
        preclassification_ahe_bundle_refined: refinedAheBundle,
        preclassification_mission_suggested: mission,
        preclassification_readiness: readiness,
        confidence_level: level,
        confidence_score: score,
        confidence_reasoning: reasoning,
        questions_triggered: questionsTriggered,
        preclassification_gap_flag: preclassificationGapFlag,
        user_confirmation: userConfirmation
          ? String(answerValue(userConfirmation))
          : null,
        user_correction: userMissionCorrection
          ? String(answerValue(userMissionCorrection))
          : null,
        user_clarification: userInterpersonalCorrection
          ? String(answerValue(userInterpersonalCorrection))
          : null,
        flagged_for_manual_review: flaggedForManualReview,
        inference_json: inferenceJson,
        inference_version: CANONICAL_DERIVATION_VERSION,
        updated_at: new Date().toISOString(),
  };
  const legacyReadiness =
    readiness === "ready_for_transduction"
      ? "ready_for_transduction"
      : readiness === "needs_micro_confirmation"
        ? "ready_with_microconfirmations"
        : "needs_review";
  const legacyInferencePayload = {
    sesion_id: sessionId,
    scene_id: sceneId,
    preclassification_scene_type: normalizedSceneType,
    preclassification_chain_position: normalizedChainPosition,
    preclassification_vsm_role: normalizedVsmRole,
    preclassification_ahe_signal: aheSignal.label,
    preclassification_mission_suggested: mission,
    preclassification_readiness: legacyReadiness,
    confidence_level: level,
    confidence_score: score,
    confidence_reasoning: reasoning,
    user_confirmation: userConfirmation
      ? String(answerValue(userConfirmation))
      : null,
    user_correction: userMissionCorrection
      ? String(answerValue(userMissionCorrection))
      : null,
    flagged_for_manual_review: flaggedForManualReview,
    inference_json: inferenceJson,
    inference_version: CANONICAL_DERIVATION_VERSION,
    updated_at: new Date().toISOString(),
  };
  const upsertInference = async (payload: typeof inferencePayload | typeof legacyInferencePayload) =>
    supabaseServer
      .from("scene_light_inferences")
      .upsert(payload, { onConflict: "scene_id,inference_version" })
      .select("id")
      .single();

  let { data: inference, error: inferenceError } = await upsertInference(inferencePayload);

  if (
    inferenceError &&
    /Could not find the .* column|schema cache/i.test(inferenceError.message)
  ) {
    const retry = await upsertInference(legacyInferencePayload);
    inference = retry.data;
    inferenceError = retry.error;
  }

  if (inferenceError) throw new Error(inferenceError.message);
  if (!inference) throw new Error("No se pudo persistir la inferencia ligera de Bloque 7.");

  const block7Rows = [
    ["preclassification_scene_type", normalizedSceneType, sceneType],
    ["preclassification_chain_position", normalizedChainPosition, chainPosition],
    ["preclassification_vsm_role", normalizedVsmRole, vsmRole],
    ["preclassification_ahe_signal", aheSignal.label, aheSignal],
    [
      "preclassification_ahe_note",
      aheNote,
      {
        evidenceVariables: aheSignal.evidenceVariables,
        reasons: ["AHE note is a light Capa 1 inference, not a closed reading."],
      },
    ],
    [
      "preclassification_ahe_level_dominant",
      aheLevelDominant,
      {
        evidenceVariables: refinedAheBundle.sourceVariables,
        reasons: ["Dominant AHE level inferred from expanded Block 6 signals."],
      },
    ],
    [
      "preclassification_interpersonal_signal",
      interpersonalSignal,
      {
        evidenceVariables: refinedAheBundle.sourceVariables,
        reasons: ["Interpersonal signal inferred from relational compensation support."],
      },
    ],
    [
      "preclassification_interpersonal_note",
      interpersonalNote,
      {
        evidenceVariables: refinedAheBundle.sourceVariables,
        reasons: ["Interpersonal note preserves support and uncertainty."],
      },
    ],
    [
      "preclassification_ahe_bundle_refined",
      refinedAheBundle,
      {
        evidenceVariables: refinedAheBundle.sourceVariables,
        reasons: ["Refined AHE bundle remains preparatory for transduction."],
      },
    ],
    [
      "preclassification_mission_suggested",
      mission,
      {
        evidenceVariables: ["scene_macro_process", "scene_enabled_milestone"],
        reasons: ["Mission inferred from macro-process text."],
      },
    ],
    [
      "preclassification_readiness",
      readiness,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Readiness is separate from confidence and classification."],
      },
    ],
    [
      "questions_triggered",
      questionsTriggered,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Microconfirmations are selected declaratively and capped by contract."],
      },
    ],
    [
      "preclassification_gap_flag",
      preclassificationGapFlag,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Gap flag indicates missing or unsupported evidence for Capa 1 closure."],
      },
    ],
    [
      "flagged_for_manual_review",
      flaggedForManualReview,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Manual review is preserved instead of manufacturing certainty."],
      },
    ],
    [
      "confidence_level",
      level,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Confidence level computed from light preclassification scores."],
      },
    ],
    [
      "confidence_score",
      score,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Confidence score computed from light preclassification scores."],
      },
    ],
    [
      "confidence_reasoning",
      reasoning,
      {
        evidenceVariables: allEvidenceVariables,
        reasons: ["Traceable explanation for light preclassification."],
      },
    ],
  ] as const;

  const derivationRows = block7Rows
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value, source]) => ({
      sesion_id: sessionId,
      scene_id: sceneId,
      instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
      block_id: "block_7",
      derivation_key: key,
      derivation_value: {
        value,
        source: "inferred",
        sourceVariables: source.evidenceVariables,
        notes: source.reasons,
        inferenceId: inference.id,
      },
      evidence_answer_ids: evidenceIdsFor(
        source.evidenceVariables,
        evidenceByVariable,
      ),
      confidence: score,
      derivation_version: CANONICAL_DERIVATION_VERSION,
      updated_at: new Date().toISOString(),
    }));

  let savedBlock7Derivations = 0;

  if (derivationRows.length) {
    const { data: savedRows, error: derivationError } = await supabaseServer
      .from("scene_block_derivations")
      .upsert(derivationRows, {
        onConflict: "scene_id,instrument_version,block_id,derivation_key",
      })
      .select("id");

    if (derivationError) throw new Error(derivationError.message);
    savedBlock7Derivations = savedRows?.length ?? 0;
  }

  const bundleRows = [
    {
      sesion_id: sessionId,
      scene_id: sceneId,
      instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
      bundle_type: "compensation_bundle",
      source_question_codes: block7Answers.map((answer) => answer.question_code),
      source_answer_ids: block7Answers.map((answer) => answer.id),
      canonical_variables: unique([
        "workaround_used",
        "retrabajo_presente",
        "sacrificio_humano",
        "desgaste_acumulado",
        "resource_bargain_5_14",
        "interpersonal_compensation_pattern",
        "compensation_primary_mechanism",
      ]),
      payload: {
        signals: ["workaround_used", "retrabajo_presente", "human_compensation"],
        evidenceVariables: allEvidenceVariables,
        supportingInterpersonalPatterns: refinedAheBundle.sourceVariables,
        readiness,
        boundary: "compensation_bundle != Capa 2",
      },
      not_diagnostic: true,
      updated_at: new Date().toISOString(),
    },
    {
      sesion_id: sessionId,
      scene_id: sceneId,
      instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
      bundle_type: "ahe_observation_bundle",
      source_question_codes: block7Answers.map((answer) => answer.question_code),
      source_answer_ids: block7Answers.map((answer) => answer.id),
      canonical_variables: unique([
        "preclassification_ahe_signal",
        "preclassification_ahe_level_dominant",
        "preclassification_interpersonal_signal",
        "beneficio_vs_dano_distribucion_0_5_1b",
        "informacion_faltante",
      ]),
      payload: {
        aheSignal: aheSignal.label,
        aheNote,
        aheLevelDominant,
        interpersonalSignal,
        interpersonalNote,
        refinedAheBundle,
        evidenceVariables: aheSignal.evidenceVariables,
        confidenceScore: score,
        boundary: "ahe_observation_bundle != closed_ahe_reading",
      },
      not_diagnostic: true,
      updated_at: new Date().toISOString(),
    },
    {
      sesion_id: sessionId,
      scene_id: sceneId,
      instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
      bundle_type: "evidence_bundle_for_transduction",
      source_question_codes: block7Answers.map((answer) => answer.question_code),
      source_answer_ids: allEvidenceAnswerIds,
      canonical_variables: allEvidenceVariables,
      payload: {
        scene_identity: {
          sessionId,
          sceneId,
        },
        systemic_framing: {
          variables: ["scene_macro_process", "scene_enabled_milestone"],
        },
        trigger_evidence: {
          variables: ["trigger_source", "trigger_preconditions"],
        },
        transformation_evidence: {
          variables: ["objeto_tipo", "sujeto_tipo", "accion_tipo", "transformation_state_final"],
        },
        handoff_evidence: {
          variables: ["output_object", "receiver_immediate", "delivery_channel"],
        },
        flow_evidence: {
          variables: ["dependency_previous", "dependency_next", "flow_deviation_frequency"],
        },
        capacity_evidence: {
          variables: ["capacidad_nominal_5_1", "brecha_capacidad_5_3", "resource_bargain_5_14"],
        },
        compensation_evidence: {
          variables: ["workaround_used", "retrabajo_presente", "sacrificio_humano", "desgaste_acumulado"],
        },
        ahe_evidence: {
          preclassification_ahe_signal: aheSignal.label,
          preclassification_ahe_note: aheNote,
          preclassification_ahe_level_dominant: aheLevelDominant,
        },
        supporting_interpersonal_patterns: refinedAheBundle.sourceVariables,
        preclassification: {
          preclassification_scene_type: normalizedSceneType,
          preclassification_chain_position: normalizedChainPosition,
          preclassification_vsm_role: normalizedVsmRole,
          preclassification_mission_suggested: mission,
          preclassification_interpersonal_signal: interpersonalSignal,
          questions_triggered: questionsTriggered,
          preclassification_gap_flag: preclassificationGapFlag,
          preclassification_readiness: readiness,
        },
        confidence: {
          confidence_score: score,
          confidence_level: level,
          confidence_reasoning: reasoning,
        },
        flags: {
          flagged_for_manual_review: flaggedForManualReview,
        },
        gaps: preclassificationGapFlag
          ? [
              missingCoreEvidence ? "missing_core_preclassification_evidence" : null,
              hasCriticalInterpersonalGap ? "interpersonal_reading_without_block_6_support" : null,
            ].filter(Boolean)
          : [],
        provenance_summary: {
          evidenceAnswerIds: allEvidenceAnswerIds,
          evidenceVariables: allEvidenceVariables,
        },
        boundary: "evidence_bundle_for_transduction != Capa 2",
        notDiagnostic: true,
      },
      not_diagnostic: true,
      updated_at: new Date().toISOString(),
    },
  ];

  const { error: bundleError } = await supabaseServer
    .from("scene_answer_bundles")
    .upsert(bundleRows, {
      onConflict: "scene_id,instrument_version,bundle_type",
    });

  if (bundleError) throw new Error(bundleError.message);

  await supabaseServer
    .from("scene_registry")
    .update({
      scene_status: "scene_light_preclassification",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sceneId)
    .eq("sesion_id", sessionId);

  return {
    inferenceId: String(inference.id),
    preclassificationSceneType: normalizedSceneType,
    preclassificationChainPosition: normalizedChainPosition,
    preclassificationVsmRole: normalizedVsmRole,
    preclassificationAheSignal: aheSignal.label,
    preclassificationAheLevelDominant: aheLevelDominant,
    preclassificationInterpersonalSignal: interpersonalSignal,
    preclassificationMissionSuggested: mission,
    confidenceLevel: level,
    confidenceScore: score,
    questionsTriggered,
    preclassificationGapFlag,
    flaggedForManualReview,
    preclassificationReadiness: readiness,
    savedBlock7Derivations,
  };
}
