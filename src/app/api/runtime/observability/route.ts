import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const REQUIRED_BUNDLES = [
  "ahe_observation_bundle",
  "compensation_bundle",
  "evidence_bundle_for_transduction",
] as const;
const MICROCONFIRMATION_CODES = ["7.0a", "7.1", "7.2", "7.3", "7.3a", "7.4"];

type SceneRow = {
  id: string;
  sesion_id: string;
  scene_status: string;
  created_at: string;
};

type InferenceRow = {
  scene_id: string;
  preclassification_readiness: string | null;
  confidence_score: number | null;
  confidence_level: string | null;
  flagged_for_manual_review: boolean | null;
};

type BundleRow = {
  scene_id: string;
  bundle_type: string;
  not_diagnostic: boolean | null;
};

type AnswerRow = {
  scene_id: string;
  question_code: string;
};

type CanonicalRecordRow = {
  scene_id: string;
  readiness_for_transduction: string;
};

type IntermediateOutputRow = {
  sesion_id: string;
  readiness_for_transduction: string;
};

const increment = (target: Record<string, number>, key: string | null | undefined) => {
  const normalized = key || "missing";
  target[normalized] = (target[normalized] ?? 0) + 1;
};

const countBy = <T,>(rows: T[], keyFor: (row: T) => string | null | undefined) =>
  rows.reduce<Record<string, number>>((accumulator, row) => {
    increment(accumulator, keyFor(row));
    return accumulator;
  }, {});

const average = (values: number[]) =>
  values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
    : null;

const confidenceBucket = (score: number | null) => {
  if (score === null || score === undefined) return "missing";
  if (score < 0 || score > 100) return "out_of_range";
  if (score >= 80) return "high_80_100";
  if (score >= 50) return "medium_50_79";
  return "low_0_49";
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 250);
  const since = url.searchParams.get("since");

  let scenesQuery = supabaseServer
    .from("scene_registry")
    .select("id, sesion_id, scene_status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    scenesQuery = scenesQuery.gte("created_at", since);
  }

  const scenesResult = await scenesQuery;

  if (scenesResult.error) {
    return NextResponse.json({ error: scenesResult.error.message }, { status: 500 });
  }

  const scenes = (scenesResult.data ?? []) as SceneRow[];
  const sceneIds = scenes.map((scene) => scene.id);
  const sessionIds = [...new Set(scenes.map((scene) => scene.sesion_id))];

  if (!sceneIds.length) {
    return NextResponse.json({
      status: "passed",
      checkedAt: new Date().toISOString(),
      scope: { recentSceneLimit: limit, since, sceneCount: 0, sessionCount: 0 },
      summary: {},
      anomalies: [],
    });
  }

  const [inferencesResult, bundlesResult, answersResult, canonicalResult, intermediateResult] =
    await Promise.all([
      supabaseServer
        .from("scene_light_inferences")
        .select("scene_id, preclassification_readiness, confidence_score, confidence_level, flagged_for_manual_review")
        .in("scene_id", sceneIds),
      supabaseServer
        .from("scene_answer_bundles")
        .select("scene_id, bundle_type, not_diagnostic")
        .in("scene_id", sceneIds),
      supabaseServer
        .from("scene_question_answers")
        .select("scene_id, question_code")
        .in("scene_id", sceneIds)
        .in("question_code", MICROCONFIRMATION_CODES),
      supabaseServer
        .from("scene_canonical_records")
        .select("scene_id, readiness_for_transduction")
        .in("scene_id", sceneIds),
      supabaseServer
        .from("session_intermediate_output")
        .select("sesion_id, readiness_for_transduction")
        .in("sesion_id", sessionIds),
    ]);

  for (const result of [
    inferencesResult,
    bundlesResult,
    answersResult,
    canonicalResult,
    intermediateResult,
  ]) {
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const inferences = (inferencesResult.data ?? []) as InferenceRow[];
  const bundles = (bundlesResult.data ?? []) as BundleRow[];
  const answers = (answersResult.data ?? []) as AnswerRow[];
  const canonicalRecords = (canonicalResult.data ?? []) as CanonicalRecordRow[];
  const intermediateOutputs = (intermediateResult.data ?? []) as IntermediateOutputRow[];

  const bundleTypesByScene = new Map<string, Set<string>>();
  const answerCodesByScene = new Map<string, Set<string>>();
  const inferenceByScene = new Map(inferences.map((row) => [row.scene_id, row]));
  const canonicalByScene = new Map(canonicalRecords.map((row) => [row.scene_id, row]));
  const intermediateSessionIds = new Set(intermediateOutputs.map((row) => row.sesion_id));

  for (const bundle of bundles) {
    bundleTypesByScene.set(bundle.scene_id, bundleTypesByScene.get(bundle.scene_id) ?? new Set());
    bundleTypesByScene.get(bundle.scene_id)?.add(bundle.bundle_type);
  }
  for (const answer of answers) {
    answerCodesByScene.set(answer.scene_id, answerCodesByScene.get(answer.scene_id) ?? new Set());
    answerCodesByScene.get(answer.scene_id)?.add(answer.question_code);
  }

  const anomalies: Array<{ severity: "critical" | "warning"; area: string; detail: string }> = [];
  const scenesWithAllBundles = scenes.filter((scene) => {
    const types = bundleTypesByScene.get(scene.id) ?? new Set<string>();
    return REQUIRED_BUNDLES.every((bundle) => types.has(bundle));
  });

  for (const scene of scenes) {
    const types = bundleTypesByScene.get(scene.id) ?? new Set<string>();
    const inference = inferenceByScene.get(scene.id);
    const canonical = canonicalByScene.get(scene.id);
    const missingBundles = REQUIRED_BUNDLES.filter((bundle) => !types.has(bundle));

    if (canonical && missingBundles.length) {
      anomalies.push({
        severity: "critical",
        area: "bundle_coverage",
        detail: `${scene.id} has canonical record but misses bundles: ${missingBundles.join(", ")}`,
      });
    }
    if (inference && !inference.preclassification_readiness) {
      anomalies.push({
        severity: "critical",
        area: "readiness",
        detail: `${scene.id} has inference without preclassification_readiness`,
      });
    }
    if (
      inference &&
      (typeof inference.confidence_score !== "number" ||
        inference.confidence_score < 0 ||
        inference.confidence_score > 100)
    ) {
      anomalies.push({
        severity: "critical",
        area: "confidence",
        detail: `${scene.id} has invalid confidence_score`,
      });
    }
  }

  for (const bundle of bundles) {
    if (!bundle.not_diagnostic) {
      anomalies.push({
        severity: "critical",
        area: "capa_2_boundary",
        detail: `${bundle.scene_id}/${bundle.bundle_type} is not marked not_diagnostic`,
      });
    }
  }

  for (const sessionId of sessionIds) {
    if (!intermediateSessionIds.has(sessionId)) {
      anomalies.push({
        severity: "warning",
        area: "intermediate_output",
        detail: `${sessionId} has recent scenes without session_intermediate_output`,
      });
    }
  }

  const confidenceScores = inferences
    .map((row) => row.confidence_score)
    .filter((score): score is number => typeof score === "number");
  const microconfirmationCountByCode = countBy(answers, (row) => row.question_code);
  const microconfirmationScenes = new Set(answers.map((row) => row.scene_id));

  const report = {
    status: anomalies.some((item) => item.severity === "critical") ? "failed" : "passed",
    checkedAt: new Date().toISOString(),
    scope: {
      recentSceneLimit: limit,
      since,
      sceneCount: scenes.length,
      sessionCount: sessionIds.length,
    },
    summary: {
      sceneStatusDistribution: countBy(scenes, (row) => row.scene_status),
      preclassificationReadinessDistribution: countBy(
        inferences,
        (row) => row.preclassification_readiness,
      ),
      confidenceLevelDistribution: countBy(inferences, (row) => row.confidence_level),
      confidenceScoreBuckets: countBy(inferences, (row) => confidenceBucket(row.confidence_score)),
      confidenceScoreAverage: average(confidenceScores),
      transductionReadinessDistribution: countBy(
        canonicalRecords,
        (row) => row.readiness_for_transduction,
      ),
      intermediateOutputReadinessDistribution: countBy(
        intermediateOutputs,
        (row) => row.readiness_for_transduction,
      ),
      microconfirmationCountByCode,
      scenesWithMicroconfirmations: microconfirmationScenes.size,
      bundleCoverage: {
        requiredBundles: REQUIRED_BUNDLES,
        scenesWithAllRequiredBundles: scenesWithAllBundles.length,
        scenesWithAnyBundle: bundleTypesByScene.size,
        totalBundleRows: bundles.length,
        notDiagnosticBundleRows: bundles.filter((row) => row.not_diagnostic).length,
      },
      intermediateOutputCoverage: {
        sessionsWithIntermediateOutput: intermediateSessionIds.size,
        recentSessions: sessionIds.length,
        ratio: sessionIds.length
          ? Number((intermediateSessionIds.size / sessionIds.length).toFixed(2))
          : null,
      },
    },
    anomalies,
  };

  return NextResponse.json(report, { status: report.status === "failed" ? 500 : 200 });
}


