import type {
  ActivityStructuralScore,
  NormalizedActivity,
  StructuralDimension,
} from "@/domain/activity";
import selectionRules from "@/rules/selection-rules.json";

const dimensions = selectionRules.dimensions as Record<
  StructuralDimension,
  { weight: number; signals: string[] }
>;

const maxScore = Object.values(dimensions).reduce(
  (total, dimension) => total + dimension.weight,
  0,
);

export function rankActivity(
  activity: NormalizedActivity,
): ActivityStructuralScore {
  const dimensionScores = Object.fromEntries(
    Object.entries(dimensions).map(([dimension, config]) => {
      const signalCount =
        activity.detectedSignals[dimension as StructuralDimension]?.length ?? 0;
      return [dimension, signalCount > 0 ? config.weight : 0];
    }),
  ) as Record<StructuralDimension, number>;

  const totalScore = Object.values(dimensionScores).reduce(
    (total, score) => total + score,
    0,
  );
  const coverageRatio = Number((totalScore / maxScore).toFixed(2));
  const recommendation =
    coverageRatio >= selectionRules.thresholds.primaryCandidateCoverageRatio
      ? "primary_candidate"
      : "support_pool";

  const rationale = Object.entries(activity.detectedSignals)
    .filter(([, signals]) => signals.length > 0)
    .map(([dimension, signals]) => `${dimension}: ${signals.join(", ")}`);

  return {
    activityId: activity.id,
    rawText: activity.rawText,
    totalScore,
    maxScore,
    coverageRatio,
    dimensionScores,
    detectedSignals: activity.detectedSignals,
    selectionRecommendation: recommendation,
    rationale,
  };
}

export function rankActivities(activities: NormalizedActivity[]) {
  return activities
    .map(rankActivity)
    .sort((a, b) => b.totalScore - a.totalScore);
}
