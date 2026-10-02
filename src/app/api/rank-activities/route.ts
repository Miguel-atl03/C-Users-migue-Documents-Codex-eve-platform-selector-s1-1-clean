import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { normalizeActivities } from "@/services/activity-normalizer";
import { rankActivities } from "@/services/activity-ranker";

type RankRequest = {
  sessionId: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as RankRequest;

  if (!payload.sessionId) {
    return NextResponse.json(
      { error: "Falta sessionId para rankear actividades." },
      { status: 400 },
    );
  }

  const { data: activities, error } = await supabaseServer
    .from("actividades")
    .select("id, ancla_narrativa")
    .eq("sesion_id", payload.sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!activities?.length) {
    return NextResponse.json(
      { error: "No hay actividades capturadas para esta sesion." },
      { status: 404 },
    );
  }

  const normalized = normalizeActivities(
    activities.map((activity) => ({
      id: activity.id,
      rawText: activity.ancla_narrativa,
    })),
  );
  const ranked = rankActivities(normalized);

  const rows = ranked.map((score) => ({
    sesion_id: payload.sessionId,
    actividad_id: score.activityId,
    total_score: score.totalScore,
    max_score: score.maxScore,
    coverage_ratio: score.coverageRatio,
    dimension_scores_json: score.dimensionScores,
    detected_signals_json: score.detectedSignals,
    selection_recommendation: score.selectionRecommendation,
    rationale_json: score.rationale,
  }));

  const { error: upsertError } = await supabaseServer
    .from("activity_structural_scores")
    .upsert(rows, {
      onConflict: "actividad_id",
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const primary = ranked.filter(
    (score) => score.selectionRecommendation === "primary_candidate",
  );
  const supportPool = ranked.filter(
    (score) => score.selectionRecommendation === "support_pool",
  );

  return NextResponse.json({
    ranked,
    primary,
    supportPool,
  });
}
