import { supabaseServer } from "@/lib/supabase-server";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";

type SceneBlockDerivationRow = {
  id: string;
  derivation_key: string;
  derivation_value: unknown;
  evidence_answer_ids: string[];
};

type SceneConsistencyFlagRow = {
  id: string;
  flag_type: string;
  status: string;
  metadata_json: Record<string, unknown>;
};

type SceneClarificationRow = {
  id: string;
  flag_id: string | null;
  response_text: string | null;
};

type ComputedFlag = {
  flagType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidenceAnswerIds: string[];
  requiresClarification: boolean;
  prompt?: string;
  questionCode?: string;
  metadata: Record<string, unknown>;
};

export type RunSceneConsistencyInput = {
  sessionId: string;
  sceneId: string;
};

export type RunSceneConsistencyResult = {
  evaluatedFlags: number;
  openOrUpdatedFlags: number;
  dismissedFlags: number;
  clarificationPrompts: number;
  criticalFlags: number;
};

const ENGINE_ID = "scene_consistency_engine_v2_1";

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

const evidenceFor = (
  evidenceByVariable: Record<string, string[]>,
  variables: string[],
) => unique(variables.flatMap((variable) => evidenceByVariable[variable] ?? []));

const isAffirmative = (value: unknown) =>
  /^(yes|si|s[ií]|true|often|sometimes|high|constant|frequent|frecuente|siempre|alto)/.test(
    textOf(value),
  );

const isNegative = (value: unknown) =>
  /^(no|false|never|nunca|rare|rara|low|bajo)/.test(textOf(value));

const isHighFriction = (value: unknown) =>
  /(often|always|high|constant|frequent|frecuente|siempre|alto|critico|cr[ií]tico)/.test(
    textOf(value),
  );

const addFlag = (
  flags: ComputedFlag[],
  flag: Omit<ComputedFlag, "metadata"> & { ruleId: string; evidenceVariables: string[] },
) => {
  flags.push({
    ...flag,
    metadata: {
      generated_by: ENGINE_ID,
      rule_id: flag.ruleId,
      evidence_variables: flag.evidenceVariables,
    },
  });
};

const computeFlags = (
  values: Record<string, unknown>,
  evidenceByVariable: Record<string, string[]>,
) => {
  const flags: ComputedFlag[] = [];
  const hasTransformationDimension =
    hasValue(values.objeto_tipo) ||
    hasValue(values.sujeto_tipo) ||
    hasValue(values.accion_tipo);

  if (!hasTransformationDimension) {
    addFlag(flags, {
      flagType: "R1_missing_transformation_dimension",
      severity: "critical",
      description:
        "La escena no declara con suficiente claridad que objeto, sujeto o accion transforma.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "objeto_tipo",
        "sujeto_tipo",
        "accion_tipo",
      ]),
      requiresClarification: true,
      prompt:
        "Para poder cerrar la escena: que cosa, persona/area o accion cambia realmente cuando ocurre esta escena?",
      questionCode: "CONSISTENCY_R1",
      ruleId: "R1",
      evidenceVariables: ["objeto_tipo", "sujeto_tipo", "accion_tipo"],
    });
  }

  const hasInitialState = hasValue(values.transformation_state_initial);
  const hasFinalState = hasValue(values.transformation_state_final);
  if (!hasInitialState || !hasFinalState) {
    addFlag(flags, {
      flagType: "R2_missing_object_lifecycle_state",
      severity: "critical",
      description:
        "Falta estado inicial o estado final; sin ambos no se cierra la causalidad OLC de la escena.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "transformation_state_initial",
        "transformation_state_final",
      ]),
      requiresClarification: true,
      prompt:
        "Describe brevemente como esta la cosa/persona/accion antes de intervenir y como debe quedar despues.",
      questionCode: "CONSISTENCY_R2",
      ruleId: "R2",
      evidenceVariables: [
        "transformation_state_initial",
        "transformation_state_final",
      ],
    });
  }

  const hasDependency =
    hasValue(values.dependency_previous) ||
    hasValue(values.dependency_next) ||
    hasValue(values.trigger_preconditions);
  const hasTriggerAndReceiver =
    hasValue(values.trigger_source) && hasValue(values.receiver_immediate);
  if (hasDependency && !hasTriggerAndReceiver) {
    addFlag(flags, {
      flagType: "R3_dependency_without_synchronization",
      severity: "high",
      description:
        "Hay dependencias declaradas, pero falta amarrarlas con trigger y receptor inmediato.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "dependency_previous",
        "dependency_next",
        "trigger_preconditions",
        "trigger_source",
        "receiver_immediate",
      ]),
      requiresClarification: true,
      prompt:
        "Que evento dispara esta escena y quien queda esperando directamente su salida?",
      questionCode: "CONSISTENCY_R3",
      ruleId: "R3",
      evidenceVariables: [
        "dependency_previous",
        "dependency_next",
        "trigger_preconditions",
        "trigger_source",
        "receiver_immediate",
      ],
    });
  }

  const coordinationText = textOf(values.delivery_channel);
  const officialCoordination =
    /sistema|oficial|erp|crm|workflow|plataforma/.test(coordinationText);
  const shadowSignal =
    isAffirmative(values.workaround_used) ||
    isAffirmative(values.hidden_subprocess) ||
    hasValue(values.regla_informal_conocida);
  if (officialCoordination && shadowSignal) {
    addFlag(flags, {
      flagType: "R6_formal_coordination_with_shadow_operation",
      severity: "high",
      description:
        "La coordinacion formal aparece junto con workaround, subproceso oculto o regla informal.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "delivery_channel",
        "workaround_used",
        "hidden_subprocess",
        "regla_informal_conocida",
      ]),
      requiresClarification: true,
      prompt:
        "Cuando el sistema/proceso oficial no alcanza, que arreglo real se usa y quien lo sostiene?",
      questionCode: "6.B",
      ruleId: "R6",
      evidenceVariables: [
        "delivery_channel",
        "workaround_used",
        "hidden_subprocess",
        "regla_informal_conocida",
      ],
    });
  }

  const saysNoException =
    isNegative(values.transformation_exception_exists) ||
    isNegative(values.delivery_failure_exists);
  const frictionExists =
    isAffirmative(values.retrabajo_presente) ||
    isAffirmative(values.workaround_used) ||
    isHighFriction(values.flow_deviation_frequency) ||
    isHighFriction(values.deadlock_risk);
  if (saysNoException && frictionExists) {
    addFlag(flags, {
      flagType: "R7_hidden_friction_contradiction",
      severity: "critical",
      description:
        "La escena sugiere que no falla, pero aparecen retrabajo, workaround, desviacion o bloqueo.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "transformation_exception_exists",
        "delivery_failure_exists",
        "retrabajo_presente",
        "workaround_used",
        "flow_deviation_frequency",
        "deadlock_risk",
      ]),
      requiresClarification: true,
      prompt:
        "Dices que casi no falla, pero aparecen senales de friccion. Cual de las dos cosas describe mejor lo que pasa en la practica?",
      questionCode: "CONSISTENCY_R7",
      ruleId: "R7",
      evidenceVariables: [
        "transformation_exception_exists",
        "delivery_failure_exists",
        "retrabajo_presente",
        "workaround_used",
        "flow_deviation_frequency",
        "deadlock_risk",
      ],
    });
  }

  if (
    isHighFriction(values.flow_deviation_frequency) ||
    isAffirmative(values.workaround_used) ||
    hasValue(values.informacion_faltante)
  ) {
    addFlag(flags, {
      flagType: "R8_residual_coordination_variety",
      severity: "medium",
      description:
        "Hay senales de variedad residual que la coordinacion no esta absorbiendo del todo.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "flow_deviation_frequency",
        "workaround_used",
        "informacion_faltante",
      ]),
      requiresClarification: false,
      ruleId: "R8",
      evidenceVariables: [
        "flow_deviation_frequency",
        "workaround_used",
        "informacion_faltante",
      ],
    });
  }

  if (
    isAffirmative(values.delivery_failure_exists) &&
    !hasValue(values.receiver_feedback)
  ) {
    addFlag(flags, {
      flagType: "R9_failure_without_feedback_visibility",
      severity: "high",
      description:
        "Hay falla de entrega, pero no hay senal clara de feedback o visibilidad del error.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "delivery_failure_exists",
        "receiver_feedback",
      ]),
      requiresClarification: true,
      prompt:
        "Cuando la salida falla o llega mal, como se entera el sistema y que respuesta ocurre normalmente?",
      questionCode: "CONSISTENCY_R9",
      ruleId: "R9",
      evidenceVariables: ["delivery_failure_exists", "receiver_feedback"],
    });
  }

  if (
    isAffirmative(values.sacrificio_humano) ||
    isHighFriction(values.desgaste_acumulado) ||
    isHighFriction(values.costo_percibido)
  ) {
    addFlag(flags, {
      flagType: "V8_algedonic_risk_human_compensation",
      severity: "high",
      description:
        "Aparecen senales de sacrificio, desgaste o costo humano que deben quedar visibles como dato estructural.",
      evidenceAnswerIds: evidenceFor(evidenceByVariable, [
        "sacrificio_humano",
        "desgaste_acumulado",
        "costo_percibido",
      ]),
      requiresClarification: true,
      prompt:
        "Que sacrificio humano sostiene esta escena cuando la estructura no alcanza: tiempo, calidad, descanso, criterio, salud o relacion con otros?",
      questionCode: "6.A",
      ruleId: "V8",
      evidenceVariables: [
        "sacrificio_humano",
        "desgaste_acumulado",
        "costo_percibido",
      ],
    });
  }

  return flags;
};

const generatedByThisEngine = (flag: SceneConsistencyFlagRow) =>
  flag.metadata_json?.generated_by === ENGINE_ID;

const upsertFlag = async (
  sessionId: string,
  sceneId: string,
  flag: ComputedFlag,
  existingFlags: SceneConsistencyFlagRow[],
) => {
  const existing = existingFlags.find(
    (item) => item.flag_type === flag.flagType && generatedByThisEngine(item),
  );
  const payload = {
    sesion_id: sessionId,
    scene_id: sceneId,
    flag_type: flag.flagType,
    severity: flag.severity,
    description: flag.description,
    evidence_answer_ids: flag.evidenceAnswerIds,
    requires_clarification: flag.requiresClarification,
    status: flag.requiresClarification ? "clarification_requested" : "open",
    metadata_json: flag.metadata,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabaseServer
      .from("scene_consistency_flags")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return String(data.id);
  }

  const { data, error } = await supabaseServer
    .from("scene_consistency_flags")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return String(data.id);
};

const ensureClarificationPrompt = async (
  sessionId: string,
  sceneId: string,
  flagId: string,
  flag: ComputedFlag,
) => {
  if (!flag.requiresClarification || !flag.prompt) return false;

  const { data: existing, error: existingError } = await supabaseServer
    .from("scene_clarifications")
    .select("id, flag_id, response_text")
    .eq("sesion_id", sessionId)
    .eq("scene_id", sceneId)
    .eq("flag_id", flagId);

  if (existingError) throw new Error(existingError.message);

  const rows = (existing ?? []) as unknown as SceneClarificationRow[];
  const unresolved = rows.find((row) => !row.response_text);
  const payload = {
    prompt: flag.prompt,
    question_code: flag.questionCode ?? null,
    clarification_type: "micro_clarification_v2_1",
    effect_json: {
      generated_by: ENGINE_ID,
      flag_type: flag.flagType,
      intended_effect: "resolve_or_downgrade_structural_consistency_flag",
    },
    updated_at: new Date().toISOString(),
  };

  if (unresolved) {
    const { error } = await supabaseServer
      .from("scene_clarifications")
      .update(payload)
      .eq("id", unresolved.id);

    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await supabaseServer.from("scene_clarifications").insert({
    sesion_id: sessionId,
    scene_id: sceneId,
    flag_id: flagId,
    ...payload,
  });

  if (error) throw new Error(error.message);
  return true;
};

export async function runSceneConsistencyCheck({
  sessionId,
  sceneId,
}: RunSceneConsistencyInput): Promise<RunSceneConsistencyResult> {
  const [derivationsResult, flagsResult] = await Promise.all([
    supabaseServer
      .from("scene_block_derivations")
      .select("id, derivation_key, derivation_value, evidence_answer_ids")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
    supabaseServer
      .from("scene_consistency_flags")
      .select("id, flag_type, status, metadata_json")
      .eq("sesion_id", sessionId)
      .eq("scene_id", sceneId),
  ]);

  if (derivationsResult.error) throw new Error(derivationsResult.error.message);
  if (flagsResult.error) throw new Error(flagsResult.error.message);

  const derivations =
    (derivationsResult.data ?? []) as unknown as SceneBlockDerivationRow[];
  const existingFlags =
    (flagsResult.data ?? []) as unknown as SceneConsistencyFlagRow[];
  const { values, evidenceByVariable } = buildVariableMaps(derivations);
  const computedFlags = computeFlags(values, evidenceByVariable);
  const computedTypes = new Set(computedFlags.map((flag) => flag.flagType));
  let openOrUpdatedFlags = 0;
  let clarificationPrompts = 0;
  let dismissedFlags = 0;

  for (const flag of computedFlags) {
    const flagId = await upsertFlag(sessionId, sceneId, flag, existingFlags);
    openOrUpdatedFlags += 1;

    if (await ensureClarificationPrompt(sessionId, sceneId, flagId, flag)) {
      clarificationPrompts += 1;
    }
  }

  const staleGeneratedFlags = existingFlags.filter(
    (flag) =>
      generatedByThisEngine(flag) &&
      !computedTypes.has(flag.flag_type) &&
      (flag.status === "open" || flag.status === "clarification_requested"),
  );

  for (const staleFlag of staleGeneratedFlags) {
    const { error } = await supabaseServer
      .from("scene_consistency_flags")
      .update({
        status: "dismissed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", staleFlag.id);

    if (error) throw new Error(error.message);
    dismissedFlags += 1;
  }

  await supabaseServer
    .from("scene_registry")
    .update({
      scene_status: computedFlags.some((flag) => flag.requiresClarification)
        ? "scene_micro_confirmation"
        : "scene_consistency_check",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sceneId)
    .eq("sesion_id", sessionId);

  return {
    evaluatedFlags: computedFlags.length,
    openOrUpdatedFlags,
    dismissedFlags,
    clarificationPrompts,
    criticalFlags: computedFlags.filter((flag) => flag.severity === "critical")
      .length,
  };
}

