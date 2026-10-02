import { supabaseServer } from "@/lib/supabase-server";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";
import type { SceneDepthLevel, SceneStatus } from "@/domain/scene";
import { runtimePersistenceContract } from "@/runtime/capa1-runtime-manifest";

type LegacyActivityRow = {
  id: string;
  ancla_narrativa: string;
};

type ActivityStructuralScoreRow = {
  actividad_id: string;
  total_score: number;
  selection_recommendation: "primary_candidate" | "support_pool";
};

type SceneRegistryRow = {
  id: string;
  sesion_id: string;
  legacy_actividad_id: string | null;
  scene_name: string;
  scene_rank: number | null;
  depth_level: SceneDepthLevel;
  scene_status: SceneStatus;
  source: string;
  original_text: string | null;
  metadata_json: Record<string, unknown>;
};

export type SceneBootstrapResult = {
  scenes: SceneRegistryRow[];
  createdFromActivities: number;
};

export type SaveSceneAnswersInput = {
  sessionId: string;
  sceneId: string;
  answers: QuestionnaireAnswer[];
};

export type SaveSceneAnswersResult = {
  savedAnswers: number;
  savedProvenanceRows: number;
};

const rankByScore = (scores: ActivityStructuralScoreRow[]) =>
  new Map(
    [...scores]
      .sort((left, right) => right.total_score - left.total_score)
      .map((score, index) => [
        score.actividad_id,
        {
          rank: index + 1,
          depthLevel:
            score.selection_recommendation === "primary_candidate"
              ? ("A_core" as const)
              : ("C_support_reentry" as const),
          selectionRecommendation: score.selection_recommendation,
          totalScore: score.total_score,
        },
      ]),
  );

export async function bootstrapScenesFromLegacyActivities(
  sessionId: string,
): Promise<SceneBootstrapResult> {
  const { data: activities, error: activitiesError } = await supabaseServer
    .from("actividades")
    .select("id, ancla_narrativa")
    .eq("sesion_id", sessionId);

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  const legacyActivities = (activities ?? []) as LegacyActivityRow[];

  if (!legacyActivities.length) {
    return {
      scenes: [],
      createdFromActivities: 0,
    };
  }

  const { data: scores, error: scoresError } = await supabaseServer
    .from("activity_structural_scores")
    .select("actividad_id, total_score, selection_recommendation")
    .eq("sesion_id", sessionId);

  if (scoresError) {
    throw new Error(scoresError.message);
  }

  const ranked = rankByScore((scores ?? []) as ActivityStructuralScoreRow[]);
  const rows = legacyActivities.map((activity, index) => {
    const ranking = ranked.get(activity.id);

    return {
      sesion_id: sessionId,
      legacy_actividad_id: activity.id,
      scene_name: activity.ancla_narrativa.slice(0, 160),
      scene_rank: ranking?.rank ?? index + 1,
      depth_level: ranking?.depthLevel ?? ("B_abbreviated" as const),
      scene_status: "scene_intake" as const,
      source: "legacy_activity_bootstrap",
      original_text: activity.ancla_narrativa,
      metadata_json: {
        legacy_selection_recommendation:
          ranking?.selectionRecommendation ?? null,
        legacy_total_score: ranking?.totalScore ?? null,
      },
      updated_at: new Date().toISOString(),
    };
  });

  const { data: scenes, error: upsertError } = await supabaseServer
    .from("scene_registry")
    .upsert(rows, {
      onConflict: "sesion_id,legacy_actividad_id",
    })
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
      ].join(","),
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    scenes: (scenes ?? []) as unknown as SceneRegistryRow[],
    createdFromActivities: rows.length,
  };
}

const inferAnswerType = (answer: QuestionnaireAnswer) => {
  if (answer.answerJson !== undefined) return "json";
  if (answer.selectedValues?.length) return "multi_select";
  if (answer.selectedValue && answer.freeText) return "select_with_text";
  if (answer.selectedValue) return "select";
  if (answer.freeText) return "text";
  return "empty";
};

const provenanceChainFor = (answer: QuestionnaireAnswer) =>
  answer.provenanceChain ?? [
    {
      question_code: answer.questionCode,
      provenance_type: answer.provenanceType ?? answer.answerNature ?? "captured",
      source: "runtime_manifest",
    },
  ];

const bundlesFor = (answer: QuestionnaireAnswer) =>
  answer.bundles ??
  Object.fromEntries(
    runtimePersistenceContract.bundle_entities.map((bundle) => [bundle, null]),
  );

export async function saveSceneQuestionAnswers({
  sessionId,
  sceneId,
  answers,
}: SaveSceneAnswersInput): Promise<SaveSceneAnswersResult> {
  if (!answers.length) {
    return {
      savedAnswers: 0,
      savedProvenanceRows: 0,
    };
  }

  const now = new Date().toISOString();
  const answerRows = answers.map((answer) => ({
    sesion_id: sessionId,
    scene_id: sceneId,
    instrument_version: answer.instrumentVersion ?? "CAPA1_V2_1",
    block_id: answer.blockId,
    question_code: answer.questionCode,
    subquestion_code: "",
    answer_nature: answer.answerNature ?? "captured",
    answer_type: inferAnswerType(answer),
    selected_value: answer.selectedValue,
    selected_values: answer.selectedValues ?? null,
    free_text: answer.freeText,
    answer_json:
      answer.answerJson === undefined
        ? {
            original_answer: {
              selected_value: answer.selectedValue,
              selected_values: answer.selectedValues ?? null,
              free_text: answer.freeText,
            },
            clarification_answer: null,
            consolidated_value: answer.consolidatedValue ?? null,
            provenance_chain: provenanceChainFor(answer),
          }
        : answer.answerJson,
    original_answer_id: answer.originalAnswerId ?? null,
    clarification_answer_id: answer.clarificationAnswerId ?? null,
    consolidated_value:
      answer.consolidatedValue === undefined ? null : answer.consolidatedValue,
    provenance_chain: provenanceChainFor(answer),
    readiness_json: answer.readiness ?? {},
    confidence_json: answer.confidence ?? {},
    flags_json: answer.flags ?? [],
    bundles_json: bundlesFor(answer),
    is_user_visible:
      (answer.answerNature ?? "captured") !== "inferred" &&
      (answer.answerNature ?? "captured") !== "computed",
    updated_at: now,
  }));

  const { data: savedAnswers, error: answersError } = await supabaseServer
    .from("scene_question_answers")
    .insert(answerRows)
    .select("id, question_code, answer_nature, free_text, selected_value");

  if (answersError) {
    throw new Error(answersError.message);
  }

  const savedAnswerRows = (savedAnswers ?? []) as unknown as Array<{
    id: string;
    question_code: string;
    answer_nature: string;
    free_text: string | null;
    selected_value: string | null;
  }>;

  const provenanceRows = savedAnswerRows.map((answer) => ({
    sesion_id: sessionId,
    scene_id: sceneId,
    answer_id: answer.id,
    provenance_type:
      answer.answer_nature === "normalized"
        ? "normalized"
        : answer.answer_nature === "clarification"
          ? "clarification"
          : answer.answer_nature === "computed"
            ? "computed"
            : answer.answer_nature === "inferred"
              ? "inferred"
              : "captured",
    source_field: answer.question_code,
    source_text: answer.free_text ?? answer.selected_value,
    confidence: null,
    created_by: "user_or_system_submit",
  }));

  if (provenanceRows.length) {
    const { error: provenanceError } = await supabaseServer
      .from("scene_answer_provenance")
      .insert(provenanceRows);

    if (provenanceError) {
      throw new Error(provenanceError.message);
    }
  }

  return {
    savedAnswers: savedAnswerRows.length,
    savedProvenanceRows: provenanceRows.length,
  };
}


