import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type RuntimeContractVerifyPayload = {
  sceneId: string;
};

const requiredBundles = [
  "ahe_observation_bundle",
  "compensation_bundle",
  "evidence_bundle_for_transduction",
];

export async function POST(request: Request) {
  const payload = (await request.json()) as RuntimeContractVerifyPayload;

  if (!payload.sceneId) {
    return NextResponse.json(
      { error: "Falta sceneId para verificar contrato runtime." },
      { status: 400 },
    );
  }

  const [bundlesResult, answersResult] = await Promise.all([
    supabaseServer
      .from("scene_answer_bundles")
      .select("bundle_type, not_diagnostic, payload")
      .eq("scene_id", payload.sceneId),
    supabaseServer
      .from("scene_question_answers")
      .select("question_code, provenance_chain, consolidated_value, bundles_json")
      .eq("scene_id", payload.sceneId)
      .in("question_code", ["7.3a", "7.4"]),
  ]);

  if (bundlesResult.error) {
    return NextResponse.json({ error: bundlesResult.error.message }, { status: 500 });
  }
  if (answersResult.error) {
    return NextResponse.json({ error: answersResult.error.message }, { status: 500 });
  }

  let inferenceResult: {
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  } = await supabaseServer
    .from("scene_light_inferences")
    .select("preclassification_readiness, confidence_score, confidence_level, preclassification_ahe_level_dominant, preclassification_interpersonal_signal, preclassification_interpersonal_note, questions_triggered, preclassification_gap_flag, flagged_for_manual_review, inference_json")
    .eq("scene_id", payload.sceneId) as {
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    };

  if (
    inferenceResult.error &&
    /Could not find the .* column|schema cache|does not exist/i.test(inferenceResult.error.message)
  ) {
    inferenceResult = await supabaseServer
      .from("scene_light_inferences")
      .select("preclassification_readiness, confidence_score, confidence_level, flagged_for_manual_review, inference_json")
      .eq("scene_id", payload.sceneId) as {
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      };
  }

  if (inferenceResult.error) {
    return NextResponse.json({ error: inferenceResult.error.message }, { status: 500 });
  }

  const bundleTypes = (bundlesResult.data ?? [])
    .map((row) => row.bundle_type)
    .sort();
  const block7AnswersPersisted = (answersResult.data ?? [])
    .map((row) => row.question_code)
    .sort();
  const rawInference = inferenceResult.data?.[0] ?? null;
  const inferenceJson =
    rawInference?.inference_json && typeof rawInference.inference_json === "object"
      ? rawInference.inference_json as {
          readiness?: { preclassification_readiness?: string; questions_triggered?: string[]; preclassification_gap_flag?: boolean; flagged_for_manual_review?: boolean };
          complementaryAhe?: {
            preclassification_ahe_level_dominant?: string;
            preclassification_interpersonal_signal?: string;
            preclassification_interpersonal_note?: string;
          };
        }
      : {};
  const inference: Record<string, unknown> | null = rawInference
    ? {
        ...rawInference,
        preclassification_readiness:
          inferenceJson.readiness?.preclassification_readiness ??
          rawInference.preclassification_readiness,
        questions_triggered:
          rawInference.questions_triggered ??
          inferenceJson.readiness?.questions_triggered,
        preclassification_gap_flag:
          rawInference.preclassification_gap_flag ??
          inferenceJson.readiness?.preclassification_gap_flag,
        flagged_for_manual_review:
          rawInference.flagged_for_manual_review ??
          inferenceJson.readiness?.flagged_for_manual_review,
        preclassification_ahe_level_dominant:
          rawInference.preclassification_ahe_level_dominant ??
          inferenceJson.complementaryAhe?.preclassification_ahe_level_dominant,
        preclassification_interpersonal_signal:
          rawInference.preclassification_interpersonal_signal ??
          inferenceJson.complementaryAhe?.preclassification_interpersonal_signal,
        preclassification_interpersonal_note:
          rawInference.preclassification_interpersonal_note ??
          inferenceJson.complementaryAhe?.preclassification_interpersonal_note,
      }
    : null;
  const confidenceScore =
    typeof inference?.confidence_score === "number"
      ? inference.confidence_score
      : Number(inference?.confidence_score);
  const failures = [
    ...requiredBundles
      .filter((bundle) => !bundleTypes.includes(bundle))
      .map((bundle) => `Missing bundle ${bundle}`),
    ...(bundlesResult.data?.every((row) => row.not_diagnostic)
      ? []
      : ["Some bundles are diagnostic"]),
    ...(!inference?.preclassification_readiness
      ? ["Missing preclassification_readiness"]
      : []),
    ...(!inference?.preclassification_ahe_level_dominant
      ? ["Missing preclassification_ahe_level_dominant"]
      : []),
    ...(!inference?.preclassification_interpersonal_signal
      ? ["Missing preclassification_interpersonal_signal"]
      : []),
    ...(Number.isFinite(confidenceScore) &&
    confidenceScore >= 0 &&
    confidenceScore <= 100
      ? []
      : ["confidence_score out of 0-100 range"]),
    ...["7.3a"]
      .filter((code) => !block7AnswersPersisted.includes(code))
      .map((code) => `Missing persisted ${code}`),
  ];

  return NextResponse.json({
    status: failures.length ? "failed" : "passed",
    sceneId: payload.sceneId,
    failures,
    bundleTypes,
    allBundlesNotDiagnostic: bundlesResult.data?.every((row) => row.not_diagnostic) ?? false,
    inference,
    block7AnswersPersisted,
  });
}
