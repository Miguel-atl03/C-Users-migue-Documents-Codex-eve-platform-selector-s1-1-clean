import { supabaseServer } from "@/lib/supabase-server";
import type { SceneReadinessForTransduction } from "@/domain/scene";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";

type SceneRegistryRow = {
  id: string;
  sesion_id: string;
  legacy_actividad_id: string | null;
  scene_name: string;
  scene_rank: number | null;
  depth_level: string;
  scene_status: string;
  source: string;
  original_text: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SceneQuestionAnswerRow = {
  id: string;
  block_id: string;
  question_code: string;
  subquestion_code: string;
  answer_nature: string;
  answer_type: string;
  selected_value: string | null;
  selected_values: string[] | null;
  free_text: string | null;
  answer_json: unknown;
  is_user_visible: boolean;
  created_at: string;
  updated_at: string;
};

type SceneAnswerProvenanceRow = {
  id: string;
  answer_id: string | null;
  provenance_type: string;
  source_field: string | null;
  source_text: string | null;
  normalization_reason: string | null;
  confidence: number | null;
  created_by: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

type SceneBlockDerivationRow = {
  id: string;
  block_id: string;
  derivation_key: string;
  derivation_value: unknown;
  evidence_answer_ids: string[];
  confidence: number | null;
  derivation_version: string;
  created_at: string;
  updated_at: string;
};

type SceneConsistencyFlagRow = {
  id: string;
  flag_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence_answer_ids: string[];
  requires_clarification: boolean;
  status: string;
  resolved_by_clarification_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SceneClarificationRow = {
  id: string;
  flag_id: string | null;
  question_code: string | null;
  prompt: string;
  response_text: string | null;
  clarification_type: string;
  effect_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SceneLightInferenceRow = {
  id: string;
  preclassification_scene_type: string | null;
  preclassification_chain_position: string | null;
  preclassification_vsm_role: string | null;
  preclassification_ahe_signal: string | null;
  preclassification_ahe_note: string | null;
  preclassification_ahe_level_dominant: string | null;
  preclassification_interpersonal_signal: string | null;
  preclassification_interpersonal_note: string | null;
  preclassification_ahe_bundle_refined: Record<string, unknown>;
  preclassification_mission_suggested: string | null;
  preclassification_readiness: string | null;
  confidence_level: string | null;
  confidence_score: number | null;
  confidence_reasoning: string | null;
  questions_triggered: string[] | null;
  preclassification_gap_flag: boolean;
  user_confirmation: string | null;
  user_correction: string | null;
  user_clarification: string | null;
  flagged_for_manual_review: boolean;
  inference_json: Record<string, unknown>;
  inference_version: string;
  created_at: string;
  updated_at: string;
};

type CoverageState = "complete" | "partial" | "missing";

type CoverageEntry = {
  coverage: CoverageState;
  variables: string[];
  present: string[];
  gaps: string[];
};

type CanonicalVariableEntry = {
  value: unknown;
  source: string | null;
  sourceVariable: string | null;
  sourceQuestionCode: string | null;
  evidenceAnswerIds: string[];
  confidence: number | null;
  derivationId: string;
};

type CanonicalVariablesByBlock = Record<
  string,
  Record<string, CanonicalVariableEntry>
>;

type CrossValidationStatus = "pass" | "warning" | "fail" | "not_evaluable";

type CrossValidation = {
  id: string;
  label: string;
  status: CrossValidationStatus;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  evidenceVariables: string[];
};

type SignalEntry = {
  signal: string;
  evidenceVariables: string[];
  evidenceAnswerIds: string[];
  confidence: number | null;
};

type SignalBucket = {
  signals: SignalEntry[];
  evidence: string[];
  confidence: number | null;
};

type BuildSceneCanonicalRecordInput = {
  sessionId: string;
  sceneId: string;
};

type SceneAnswerBundleRow = {
  id: string;
  bundle_type: string;
  source_question_codes: string[];
  source_answer_ids: string[];
  canonical_variables: string[];
  payload: Record<string, unknown>;
  not_diagnostic: boolean;
  created_at: string;
  updated_at: string;
};

export type BuildSceneCanonicalRecordResult = {
  canonicalRecordId: string;
  readinessForTransduction: SceneReadinessForTransduction;
  evidenceAnswerIds: string[];
  consistencyFlagIds: string[];
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

const derivationPayload = (value: unknown): Record<string, unknown> => {
  const parsed = parseJsonIfNeeded(value);
  return isRecord(parsed) ? parsed : { value: parsed };
};

const unwrapValue = (value: unknown) => {
  const payload = derivationPayload(value);
  return "value" in payload ? payload.value : payload;
};

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const buildCanonicalVariablesByBlock = (
  derivations: SceneBlockDerivationRow[],
) => {
  const byBlock: CanonicalVariablesByBlock = {};
  const flatValues: Record<string, unknown> = {};
  const evidenceByVariable: Record<string, string[]> = {};

  for (const derivation of derivations) {
    const payload = derivationPayload(derivation.derivation_value);
    const entry: CanonicalVariableEntry = {
      value: unwrapValue(derivation.derivation_value),
      source:
        typeof payload.source === "string" ? payload.source : "derivation",
      sourceVariable:
        typeof payload.sourceVariable === "string"
          ? payload.sourceVariable
          : null,
      sourceQuestionCode:
        typeof payload.sourceQuestionCode === "string"
          ? payload.sourceQuestionCode
          : null,
      evidenceAnswerIds: derivation.evidence_answer_ids ?? [],
      confidence: derivation.confidence,
      derivationId: derivation.id,
    };

    byBlock[derivation.block_id] = byBlock[derivation.block_id] ?? {};
    byBlock[derivation.block_id][derivation.derivation_key] = entry;
    flatValues[derivation.derivation_key] = entry.value;
    evidenceByVariable[derivation.derivation_key] = entry.evidenceAnswerIds;
  }

  return { byBlock, flatValues, evidenceByVariable };
};

const coverage = (
  variables: Record<string, unknown>,
  expectedVariables: string[],
): CoverageEntry => {
  const present = expectedVariables.filter((key) =>
    hasMeaningfulValue(variables[key]),
  );
  const gaps = expectedVariables.filter((key) => !present.includes(key));

  return {
    coverage:
      gaps.length === 0 ? "complete" : present.length > 0 ? "partial" : "missing",
    variables: expectedVariables,
    present,
    gaps,
  };
};

const buildMmabpMap = (variables: Record<string, unknown>) => ({
  PM: coverage(variables, [
    "scene_macro_process",
    "scene_enabled_milestone",
    "trigger_source",
    "receiver_immediate",
  ]),
  PF: coverage(variables, [
    "trigger_source",
    "dependency_previous",
    "dependency_next",
    "delivery_channel",
    "flow_deviation_frequency",
  ]),
  MoC: coverage(variables, [
    "objeto_tipo",
    "sujeto_tipo",
    "accion_tipo",
    "atributos_objeto_cambian",
    "atributos_sujeto_cambian",
    "atributos_accion_cambian",
  ]),
  OLC: coverage(variables, [
    "transformation_state_initial",
    "transformation_state_final",
    "transformation_iterations",
    "transformation_exception_exists",
  ]),
  PM_PF: coverage(variables, [
    "trigger_source",
    "dependency_previous",
    "dependency_next",
    "receiver_immediate",
  ]),
  MoC_OLC: coverage(variables, [
    "objeto_tipo",
    "transformation_state_initial",
    "transformation_state_final",
    "transformation_hidden_changes",
  ]),
  PM_MoC: coverage(variables, [
    "scene_macro_process",
    "objeto_tipo",
    "sujeto_tipo",
    "accion_tipo",
  ]),
  PF_OLC: coverage(variables, [
    "dependency_previous",
    "dependency_next",
    "transformation_state_initial",
    "transformation_state_final",
    "retrabajo_presente",
  ]),
  PM_PF_MoC: coverage(variables, [
    "scene_macro_process",
    "trigger_source",
    "receiver_immediate",
    "objeto_tipo",
  ]),
  MoC_OLC_PM: coverage(variables, [
    "scene_macro_process",
    "objeto_tipo",
    "transformation_state_initial",
    "transformation_state_final",
  ]),
  PM_PF_OLC: coverage(variables, [
    "trigger_source",
    "dependency_next",
    "transformation_state_initial",
    "transformation_state_final",
  ]),
  MoC_OLC_PF: coverage(variables, [
    "objeto_tipo",
    "delivery_channel",
    "transformation_state_initial",
    "transformation_state_final",
  ]),
  PM_PF_MoC_OLC: coverage(variables, [
    "scene_macro_process",
    "trigger_source",
    "objeto_tipo",
    "transformation_state_initial",
    "transformation_state_final",
    "receiver_immediate",
  ]),
});

const emptySignalBucket = (): SignalBucket => ({
  signals: [],
  evidence: [],
  confidence: null,
});

const addSignal = (
  bucket: SignalBucket,
  signal: string,
  evidenceVariables: string[],
  evidenceByVariable: Record<string, string[]>,
  confidence = 0.7,
) => {
  const evidenceAnswerIds = unique(
    evidenceVariables.flatMap((variable) => evidenceByVariable[variable] ?? []),
  );

  bucket.signals.push({
    signal,
    evidenceVariables,
    evidenceAnswerIds,
    confidence,
  });
  bucket.evidence = unique([...bucket.evidence, ...evidenceAnswerIds]);
  bucket.confidence =
    bucket.confidence === null ? confidence : Math.max(bucket.confidence, confidence);
};

const buildVsmMap = (
  variables: Record<string, unknown>,
  evidenceByVariable: Record<string, string[]>,
  flags: SceneConsistencyFlagRow[],
) => {
  const map = {
    S1: emptySignalBucket(),
    S2: emptySignalBucket(),
    S3: emptySignalBucket(),
    S3_star: emptySignalBucket(),
    S4: emptySignalBucket(),
    S5: emptySignalBucket(),
    algedonic_channel: emptySignalBucket(),
  };

  if (hasMeaningfulValue(variables.objeto_tipo)) {
    addSignal(map.S1, "operational_object_declared", ["objeto_tipo"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.delivery_channel)) {
    addSignal(map.S2, "coordination_channel_declared", ["delivery_channel"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.flow_deviation_frequency)) {
    addSignal(
      map.S2,
      "residual_coordination_variance_visible",
      ["flow_deviation_frequency"],
      evidenceByVariable,
    );
  }
  if (hasMeaningfulValue(variables.discrecionalidad_5_9)) {
    addSignal(map.S3, "discretion_signal_available", ["discrecionalidad_5_9"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.resource_bargain_5_14)) {
    addSignal(map.S3, "resource_bargain_signal_available", ["resource_bargain_5_14"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.receiver_feedback)) {
    addSignal(map.S3_star, "feedback_or_error_visibility_available", ["receiver_feedback"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.preclassification_mission_suggested)) {
    addSignal(
      map.S4,
      "light_adaptive_mission_signal_available",
      ["preclassification_mission_suggested"],
      evidenceByVariable,
    );
  }
  if (hasMeaningfulValue(variables.beneficio_vs_dano_distribucion_0_5_1b)) {
    addSignal(
      map.S5,
      "value_damage_boundary_visible",
      ["beneficio_vs_dano_distribucion_0_5_1b"],
      evidenceByVariable,
    );
  }
  if (
    hasMeaningfulValue(variables.sacrificio_humano) ||
    hasMeaningfulValue(variables.desgaste_acumulado)
  ) {
    addSignal(
      map.algedonic_channel,
      "human_pain_or_wear_signal_available",
      ["sacrificio_humano", "desgaste_acumulado"],
      evidenceByVariable,
    );
  }

  for (const flag of flags.filter((item) => item.status === "open")) {
    if (flag.severity === "high" || flag.severity === "critical") {
      map.algedonic_channel.signals.push({
        signal: `open_${flag.severity}_consistency_flag`,
        evidenceVariables: [],
        evidenceAnswerIds: flag.evidence_answer_ids,
        confidence: 0.8,
      });
      map.algedonic_channel.evidence = unique([
        ...map.algedonic_channel.evidence,
        ...flag.evidence_answer_ids,
      ]);
      map.algedonic_channel.confidence = Math.max(
        map.algedonic_channel.confidence ?? 0,
        0.8,
      );
    }
  }

  return map;
};

const buildAheMap = (
  variables: Record<string, unknown>,
  evidenceByVariable: Record<string, string[]>,
) => {
  const map = {
    intrapersonal: emptySignalBucket(),
    interpersonal: emptySignalBucket(),
    organizational: emptySignalBucket(),
  };

  if (hasMeaningfulValue(variables.desgaste_acumulado)) {
    addSignal(map.intrapersonal, "accumulated_wear", ["desgaste_acumulado"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.costo_percibido)) {
    addSignal(map.intrapersonal, "perceived_effort_cost", ["costo_percibido"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.receiver_immediate)) {
    addSignal(map.interpersonal, "handoff_actor_visible", ["receiver_immediate"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.informacion_faltante)) {
    addSignal(map.interpersonal, "missing_information_friction", ["informacion_faltante"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.regla_informal_conocida)) {
    addSignal(map.organizational, "informal_rule_visible", ["regla_informal_conocida"], evidenceByVariable);
  }
  if (hasMeaningfulValue(variables.resource_bargain_5_14)) {
    addSignal(map.organizational, "resource_bargain_visible", ["resource_bargain_5_14"], evidenceByVariable);
  }

  return map;
};

const validation = (
  id: string,
  label: string,
  status: CrossValidationStatus,
  severity: CrossValidation["severity"],
  message: string,
  evidenceVariables: string[],
): CrossValidation => ({
  id,
  label,
  status,
  severity,
  message,
  evidenceVariables,
});

const buildCrossValidations = (
  variables: Record<string, unknown>,
  mmabpMap: ReturnType<typeof buildMmabpMap>,
  flags: SceneConsistencyFlagRow[],
) => {
  const validations: CrossValidation[] = [];
  const hasObject =
    hasMeaningfulValue(variables.objeto_tipo) ||
    hasMeaningfulValue(variables.sujeto_tipo) ||
    hasMeaningfulValue(variables.accion_tipo);

  validations.push(
    validation(
      "R1",
      "Actividad sin objeto no avanza",
      hasObject ? "pass" : "fail",
      "critical",
      hasObject
        ? "La escena tiene al menos una dimension transformada declarada."
        : "La escena no tiene objeto, sujeto ni accion transformada suficiente.",
      ["objeto_tipo", "sujeto_tipo", "accion_tipo"],
    ),
  );

  const hasInitial = hasMeaningfulValue(variables.transformation_state_initial);
  const hasFinal = hasMeaningfulValue(variables.transformation_state_final);
  validations.push(
    validation(
      "R2",
      "Objeto sin estados no cierra causalidad",
      hasInitial && hasFinal ? "pass" : "fail",
      "critical",
      hasInitial && hasFinal
        ? "La escena tiene estado inicial y estado final."
        : "Falta estado inicial o final para cerrar la lectura OLC.",
      ["transformation_state_initial", "transformation_state_final"],
    ),
  );

  const hasDependency =
    hasMeaningfulValue(variables.dependency_previous) ||
    hasMeaningfulValue(variables.dependency_next) ||
    hasMeaningfulValue(variables.trigger_preconditions);
  const hasSynchronization =
    hasMeaningfulValue(variables.trigger_source) &&
    hasMeaningfulValue(variables.receiver_immediate);
  validations.push(
    validation(
      "R3",
      "Dependencia declarada obliga sincronizacion explicita",
      hasDependency && !hasSynchronization ? "warning" : "pass",
      "high",
      hasDependency && !hasSynchronization
        ? "Hay dependencia, pero trigger o receptor inmediato no estan completos."
        : "No hay ruptura evidente entre dependencia, trigger y receptor.",
      [
        "dependency_previous",
        "dependency_next",
        "trigger_preconditions",
        "trigger_source",
        "receiver_immediate",
      ],
    ),
  );

  validations.push(
    validation(
      "R7",
      "Nunca falla es hipotesis sospechosa",
      hasMeaningfulValue(variables.transformation_exception_exists) ||
        hasMeaningfulValue(variables.retrabajo_presente)
        ? "pass"
        : "not_evaluable",
      "medium",
      "La evaluacion depende de excepciones, retrabajo o flags de consistencia capturados.",
      ["transformation_exception_exists", "retrabajo_presente"],
    ),
  );

  validations.push(
    validation(
      "R9",
      "S3* se prueba por visibilidad del error",
      hasMeaningfulValue(variables.receiver_feedback) ? "pass" : "warning",
      "medium",
      hasMeaningfulValue(variables.receiver_feedback)
        ? "Hay una senal de respuesta o feedback ante falla."
        : "No hay suficiente evidencia de visibilidad del error o feedback.",
      ["receiver_feedback"],
    ),
  );

  validations.push(
    validation(
      "V3",
      "Objeto obligatorio",
      mmabpMap.MoC.coverage === "missing" || mmabpMap.OLC.coverage === "missing"
        ? "fail"
        : mmabpMap.MoC.coverage === "partial" || mmabpMap.OLC.coverage === "partial"
          ? "warning"
          : "pass",
      "critical",
      "Valida que objeto, atributos y estados tengan cobertura suficiente.",
      [...mmabpMap.MoC.variables, ...mmabpMap.OLC.variables],
    ),
  );

  const openHighFlags = flags.filter(
    (flag) =>
      flag.status === "open" &&
      (flag.severity === "high" || flag.severity === "critical"),
  );
  validations.push(
    validation(
      "V8",
      "Canal algedonico bloqueado",
      openHighFlags.length > 0 ? "warning" : "not_evaluable",
      "high",
      openHighFlags.length > 0
        ? "Existen flags abiertos de severidad alta o critica."
        : "No hay flags altos abiertos para evaluar canal algedonico.",
      [],
    ),
  );

  return validations;
};

const buildPathwayHints = (
  variables: Record<string, unknown>,
  mmabpMap: ReturnType<typeof buildMmabpMap>,
  flags: SceneConsistencyFlagRow[],
) => {
  const openFlags = flags.filter((flag) => flag.status === "open");
  const completeCore =
    mmabpMap.PM.coverage !== "missing" &&
    mmabpMap.PF.coverage !== "missing" &&
    mmabpMap.MoC.coverage !== "missing" &&
    mmabpMap.OLC.coverage !== "missing";

  return {
    viable_regulated: completeCore && openFlags.length === 0,
    weak_s2:
      hasMeaningfulValue(variables.flow_deviation_frequency) ||
      hasMeaningfulValue(variables.workaround_used),
    hypertrophic_s3:
      hasMeaningfulValue(variables.discrecionalidad_5_9) ||
      hasMeaningfulValue(variables.resource_bargain_5_14),
    broken_ontology:
      mmabpMap.MoC.coverage === "missing" || mmabpMap.MoC.coverage === "partial",
    broken_causality:
      mmabpMap.OLC.coverage === "missing" || mmabpMap.OLC.coverage === "partial",
    zombie_or_uncertain_value:
      !hasMeaningfulValue(variables.beneficiario_final_0_5_1) &&
      !hasMeaningfulValue(variables.receiver_immediate),
    adaptively_dead:
      !hasMeaningfulValue(variables.preclassification_mission_suggested) &&
      hasMeaningfulValue(variables.patron_repetitivo),
    zero_sum:
      hasMeaningfulValue(variables.sacrificio_humano) ||
      hasMeaningfulValue(variables.desgaste_acumulado),
  };
};

const calculateReadiness = (
  answers: SceneQuestionAnswerRow[],
  derivations: SceneBlockDerivationRow[],
  validations: CrossValidation[],
  flags: SceneConsistencyFlagRow[],
  lightInference: SceneLightInferenceRow | null,
  bundles: SceneAnswerBundleRow[],
): SceneReadinessForTransduction => {
  if (!answers.length || !derivations.length) return "not_ready";
  if (!lightInference) return "not_ready";

  const hasEvidenceBundle = bundles.some(
    (bundle) =>
      bundle.bundle_type === "evidence_bundle_for_transduction" &&
      bundle.not_diagnostic,
  );
  if (!hasEvidenceBundle) return "not_ready";

  if (
    lightInference.preclassification_readiness === "insufficient_evidence" ||
    lightInference.preclassification_readiness === "needs_support_reentry"
  ) {
    return "not_ready";
  }

  const openFlags = flags.filter((flag) => flag.status === "open");
  const criticalFlags = openFlags.filter((flag) => flag.severity === "critical");
  const failedCriticalValidations = validations.filter(
    (item) => item.status === "fail" && item.severity === "critical",
  );
  const clarificationRequired = openFlags.some(
    (flag) => flag.requires_clarification,
  );

  if (criticalFlags.length || failedCriticalValidations.length) {
    return clarificationRequired ? "not_ready" : "partial";
  }

  if (
    lightInference.preclassification_readiness === "needs_manual_review" ||
    lightInference.flagged_for_manual_review
  ) {
    return "partial";
  }

  if (
    lightInference.preclassification_readiness === "needs_micro_confirmation" ||
    lightInference.preclassification_gap_flag
  ) {
    return "ready_with_flags";
  }

  if (openFlags.length || validations.some((item) => item.status === "warning")) {
    return "ready_with_flags";
  }

  return "ready";
};

const buildStructuralRelations = (
  scene: SceneRegistryRow,
  variables: Record<string, unknown>,
) => ({
  activity: {
    sceneName: scene.scene_name,
    originalText: scene.original_text,
    macroProcess: variables.scene_macro_process ?? null,
    enabledMilestone: variables.scene_enabled_milestone ?? null,
    beneficiary: variables.beneficiario_final_0_5_1 ?? null,
    affectedActor: variables.afectado_final_0_5_1a ?? null,
  },
  object: {
    objectType: variables.objeto_tipo ?? null,
    subjectType: variables.sujeto_tipo ?? null,
    actionType: variables.accion_tipo ?? null,
    dominantDimension: variables.dimension_dominante ?? null,
    attributes: {
      object: variables.atributos_objeto_cambian ?? null,
      subject: variables.atributos_sujeto_cambian ?? null,
      action: variables.atributos_accion_cambian ?? null,
    },
  },
  objectLifecycle: {
    initialState: variables.transformation_state_initial ?? null,
    finalState: variables.transformation_state_final ?? null,
    iterations: variables.transformation_iterations ?? null,
    exceptionExists: variables.transformation_exception_exists ?? null,
    exceptionType: variables.transformation_exception_type ?? null,
  },
  dependencies: {
    trigger: variables.trigger_source ?? null,
    preconditions: variables.trigger_preconditions ?? null,
    previousDependency: variables.dependency_previous ?? null,
    nextDependency: variables.dependency_next ?? null,
    receiver: variables.receiver_immediate ?? null,
  },
  coordination: {
    deliveryChannel: variables.delivery_channel ?? null,
    deliveryFailureExists: variables.delivery_failure_exists ?? null,
    flowDeviationFrequency: variables.flow_deviation_frequency ?? null,
    bottleneckType: variables.bottleneck_type ?? null,
  },
  capacityAndCompensation: {
    nominalCapacity: variables.capacidad_nominal_5_1 ?? null,
    realCapacity: variables.capacidad_real_5_2 ?? null,
    capacityGap: variables.brecha_capacidad_5_3 ?? null,
    resourceBargain: variables.resource_bargain_5_14 ?? null,
    humanSacrifice: variables.sacrificio_humano ?? null,
    residualVarietyAbsorption: variables.absorcion_variedad_residual ?? null,
  },
});

export async function buildSceneCanonicalRecord({
  sessionId,
  sceneId,
}: BuildSceneCanonicalRecordInput): Promise<BuildSceneCanonicalRecordResult> {
  const [
    sceneResult,
    answersResult,
    provenanceResult,
    derivationsResult,
    flagsResult,
    clarificationsResult,
    inferenceResult,
    bundlesResult,
  ] = await Promise.all([
    supabaseServer
      .from("scene_registry")
      .select(
        [
          "id",
          "sesion_id",
          "legacy_actividad_id",
          "scene_name",
          "scene_rank",
          "depth_level",
          "scene_status",
          "source",
          "original_text",
          "metadata_json",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("sesion_id", sessionId)
      .eq("id", sceneId)
      .maybeSingle(),
    supabaseServer
      .from("scene_question_answers")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
    supabaseServer
      .from("scene_answer_provenance")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId),
    supabaseServer
      .from("scene_block_derivations")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
    supabaseServer
      .from("scene_consistency_flags")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId),
    supabaseServer
      .from("scene_clarifications")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId),
    supabaseServer
      .from("scene_light_inferences")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .maybeSingle(),
    supabaseServer
      .from("scene_answer_bundles")
      .select("*")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
  ]);

  if (sceneResult.error) throw new Error(sceneResult.error.message);
  if (answersResult.error) throw new Error(answersResult.error.message);
  if (provenanceResult.error) throw new Error(provenanceResult.error.message);
  if (derivationsResult.error) throw new Error(derivationsResult.error.message);
  if (flagsResult.error) throw new Error(flagsResult.error.message);
  if (clarificationsResult.error) {
    throw new Error(clarificationsResult.error.message);
  }
  if (inferenceResult.error) throw new Error(inferenceResult.error.message);
  if (bundlesResult.error) throw new Error(bundlesResult.error.message);
  if (!sceneResult.data) {
    throw new Error("No existe la escena solicitada para la sesion indicada.");
  }

  const scene = sceneResult.data as unknown as SceneRegistryRow;
  const answers = (answersResult.data ?? []) as unknown as SceneQuestionAnswerRow[];
  const provenance =
    (provenanceResult.data ?? []) as unknown as SceneAnswerProvenanceRow[];
  const derivations =
    (derivationsResult.data ?? []) as unknown as SceneBlockDerivationRow[];
  const flags = (flagsResult.data ?? []) as unknown as SceneConsistencyFlagRow[];
  const clarifications =
    (clarificationsResult.data ?? []) as unknown as SceneClarificationRow[];
  const lightInference =
    (inferenceResult.data ?? null) as unknown as SceneLightInferenceRow | null;
  const bundles = (bundlesResult.data ?? []) as unknown as SceneAnswerBundleRow[];

  const { byBlock, flatValues, evidenceByVariable } =
    buildCanonicalVariablesByBlock(derivations);
  const mmabpMap = buildMmabpMap(flatValues);
  const vsmMap = buildVsmMap(flatValues, evidenceByVariable, flags);
  const aheMap = buildAheMap(flatValues, evidenceByVariable);
  const crossValidations = buildCrossValidations(flatValues, mmabpMap, flags);
  const pathwayHints = buildPathwayHints(flatValues, mmabpMap, flags);
  const readinessForTransduction = calculateReadiness(
    answers,
    derivations,
    crossValidations,
    flags,
    lightInference,
    bundles,
  );
  const transductionBundle = bundles.find(
    (bundle) => bundle.bundle_type === "evidence_bundle_for_transduction",
  );
  const transductionBundlePayload = transductionBundle?.payload ?? null;
  const inferredGaps = [
    ...crossValidations
      .filter((item) => item.status === "fail" || item.status === "warning")
      .map((item) => ({
        source: "cross_validation",
        code: item.id,
        severity: item.severity,
        message: item.message,
        evidenceVariables: item.evidenceVariables,
      })),
    ...(lightInference?.preclassification_gap_flag
      ? [
          {
            source: "block_7",
            code: "preclassification_gap_flag",
            severity: "high",
            message:
              "Bloque 7 detecto un gap de soporte para cerrar la preclasificacion ligera.",
            evidenceVariables: [],
          },
        ]
      : []),
    ...(!transductionBundle
      ? [
          {
            source: "bundle",
            code: "missing_evidence_bundle_for_transduction",
            severity: "critical",
            message: "No existe evidence_bundle_for_transduction persistido.",
            evidenceVariables: [],
          },
        ]
      : []),
  ];
  const recommendedStatus =
    readinessForTransduction === "ready"
      ? "ready_for_transduction"
      : lightInference?.preclassification_readiness === "needs_micro_confirmation"
        ? "needs_micro_confirmation"
        : lightInference?.preclassification_readiness === "needs_support_reentry"
          ? "needs_support_reentry"
          : lightInference?.preclassification_readiness === "needs_manual_review"
            ? "needs_manual_review"
            : readinessForTransduction === "ready_with_flags"
              ? "ready_for_transduction"
              : "insufficient_evidence";
  const evidenceAnswerIds = unique([
    ...answers.map((answer) => answer.id),
    ...derivations.flatMap((derivation) => derivation.evidence_answer_ids ?? []),
    ...flags.flatMap((flag) => flag.evidence_answer_ids ?? []),
  ]);
  const consistencyFlagIds = flags.map((flag) => flag.id);

  const canonicalJson = {
    schemaVersion: "scene_canonical_record_v1",
    instrumentVersion: CAPA1_V2_1_INSTRUMENT_VERSION,
    generatedAt: new Date().toISOString(),
    sceneMetadata: {
      sceneId: scene.id,
      sessionId: scene.sesion_id,
      legacyActivityId: scene.legacy_actividad_id,
      sceneName: scene.scene_name,
      sceneRank: scene.scene_rank,
      depthLevel: scene.depth_level,
      sceneStatus: scene.scene_status,
      source: scene.source,
      originalText: scene.original_text,
      metadata: scene.metadata_json,
      createdAt: scene.created_at,
      updatedAt: scene.updated_at,
    },
    evidence: {
      answers: answers.map((answer) => ({
        id: answer.id,
        blockId: answer.block_id,
        questionCode: answer.question_code,
        subquestionCode: answer.subquestion_code,
        answerNature: answer.answer_nature,
        answerType: answer.answer_type,
        selectedValue: answer.selected_value,
        selectedValues: answer.selected_values,
        freeText: answer.free_text,
        answerJson: parseJsonIfNeeded(answer.answer_json),
        isUserVisible: answer.is_user_visible,
        createdAt: answer.created_at,
        updatedAt: answer.updated_at,
      })),
    },
    provenance: provenance.map((item) => ({
      id: item.id,
      answerId: item.answer_id,
      provenanceType: item.provenance_type,
      sourceField: item.source_field,
      sourceText: item.source_text,
      normalizationReason: item.normalization_reason,
      confidence: item.confidence,
      createdBy: item.created_by,
      metadata: item.metadata_json,
      createdAt: item.created_at,
    })),
    canonicalVariablesByBlock: byBlock,
    structuralRelations: buildStructuralRelations(scene, flatValues),
    mmabpMap,
    vsmMap,
    aheMap,
    crossValidations,
    consistency: {
      flags: flags.map((flag) => ({
        id: flag.id,
        flagType: flag.flag_type,
        severity: flag.severity,
        description: flag.description,
        evidenceAnswerIds: flag.evidence_answer_ids,
        requiresClarification: flag.requires_clarification,
        status: flag.status,
        resolvedByClarificationId: flag.resolved_by_clarification_id,
        metadata: flag.metadata_json,
        createdAt: flag.created_at,
        updatedAt: flag.updated_at,
      })),
    },
    clarifications: clarifications.map((clarification) => ({
      id: clarification.id,
      flagId: clarification.flag_id,
      questionCode: clarification.question_code,
      prompt: clarification.prompt,
      responseText: clarification.response_text,
      clarificationType: clarification.clarification_type,
      effect: clarification.effect_json,
      createdAt: clarification.created_at,
      updatedAt: clarification.updated_at,
    })),
    lightInference: lightInference
      ? {
          id: lightInference.id,
          preclassificationSceneType:
            lightInference.preclassification_scene_type,
          preclassificationChainPosition:
            lightInference.preclassification_chain_position,
          preclassificationVsmRole: lightInference.preclassification_vsm_role,
          preclassificationAheSignal:
            lightInference.preclassification_ahe_signal,
          preclassificationAheNote:
            lightInference.preclassification_ahe_note,
          preclassificationAheLevelDominant:
            lightInference.preclassification_ahe_level_dominant,
          preclassificationInterpersonalSignal:
            lightInference.preclassification_interpersonal_signal,
          preclassificationInterpersonalNote:
            lightInference.preclassification_interpersonal_note,
          preclassificationAheBundleRefined:
            lightInference.preclassification_ahe_bundle_refined,
          preclassificationMissionSuggested:
            lightInference.preclassification_mission_suggested,
          preclassificationReadiness:
            lightInference.preclassification_readiness,
          confidenceLevel: lightInference.confidence_level,
          confidenceScore: lightInference.confidence_score,
          confidenceReasoning: lightInference.confidence_reasoning,
          questionsTriggered: lightInference.questions_triggered,
          preclassificationGapFlag: lightInference.preclassification_gap_flag,
          userConfirmation: lightInference.user_confirmation,
          userCorrection: lightInference.user_correction,
          userClarification: lightInference.user_clarification,
          flaggedForManualReview: lightInference.flagged_for_manual_review,
          inferenceJson: lightInference.inference_json,
          inferenceVersion: lightInference.inference_version,
        }
      : null,
    bundles: bundles.map((bundle) => ({
      id: bundle.id,
      bundleType: bundle.bundle_type,
      sourceQuestionCodes: bundle.source_question_codes,
      sourceAnswerIds: bundle.source_answer_ids,
      canonicalVariables: bundle.canonical_variables,
      payload: bundle.payload,
      notDiagnostic: bundle.not_diagnostic,
      createdAt: bundle.created_at,
        updatedAt: bundle.updated_at,
      })),
    evidence_bundle_for_transduction: transductionBundlePayload,
    gaps: inferredGaps,
    recommendedStatus,
    scene_canonical_record: {
      evidenceOriginal: answers.map((answer) => answer.id),
      canonicalDerivations: derivations.map((derivation) => derivation.id),
      lightInference: lightInference?.id ?? null,
      clarifications: clarifications.map((clarification) => clarification.id),
      consistencyFlags: flags.map((flag) => flag.id),
      readinessForTransduction,
      recommendedStatus,
    },
    pathwayHints,
    readiness: {
      readinessForTransduction,
      recommendedStatus,
      openFlagCount: flags.filter((flag) => flag.status === "open").length,
      gapCount: inferredGaps.length,
      failedCriticalValidationCount: crossValidations.filter(
        (item) => item.status === "fail" && item.severity === "critical",
      ).length,
      requiresClarification: flags.some(
        (flag) => flag.status === "open" && flag.requires_clarification,
      ),
      requiresManualReview: Boolean(
        lightInference?.flagged_for_manual_review ||
          flags.some((flag) => flag.severity === "critical"),
      ),
    },
    traceability: {
      evidenceAnswerIds,
      derivationIds: derivations.map((derivation) => derivation.id),
      consistencyFlagIds,
      clarificationIds: clarifications.map((clarification) => clarification.id),
      lightInferenceId: lightInference?.id ?? null,
      bundleIds: bundles.map((bundle) => bundle.id),
    },
    boundary: {
      consolidated_output_not_capa_2: true,
      evidence_bundle_for_transduction_not_capa_2: true,
      forbiddenRuntimePromotions: [
        "diagnostic_finding",
        "root_cause",
        "closed_ahe_reading",
        "closed_vsm_classification",
        "capa_2_node_assignment",
      ],
    },
  };

  const { data: savedRecord, error: upsertError } = await supabaseServer
    .from("scene_canonical_records")
    .upsert(
      {
        sesion_id: sessionId,
        scene_id: sceneId,
        instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
        canonical_json: canonicalJson,
        evidence_answer_ids: evidenceAnswerIds,
        consistency_flag_ids: consistencyFlagIds,
        readiness_for_transduction: readinessForTransduction,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "scene_id,instrument_version",
      },
    )
    .select("id")
    .single();

  if (upsertError) throw new Error(upsertError.message);

  await supabaseServer
    .from("scene_registry")
    .update({
      scene_status:
        readinessForTransduction === "ready" ||
        readinessForTransduction === "ready_with_flags"
          ? "scene_ready_for_transduction"
          : "scene_canonical_consolidation",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sceneId)
    .eq("sesion_id", sessionId);

  return {
    canonicalRecordId: String(savedRecord.id),
    readinessForTransduction,
    evidenceAnswerIds,
    consistencyFlagIds,
  };
}
