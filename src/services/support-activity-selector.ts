import type { ActivityStructuralScore, StructuralDimension } from "@/domain/activity";
import type {
  ActivityDiagnostic,
  RecursiveClosureGap,
  SupportActivityCandidateEvaluation,
  SupportActivitySelection,
} from "@/domain/diagnostics";

type SelectorInput = {
  primaryDiagnostics: ActivityDiagnostic[];
  supportCandidates: ActivityStructuralScore[];
  answeredSupportActivityIds?: string[];
};

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const tokenize = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const hasTextSignal = (activity: ActivityStructuralScore, words: string[]) => {
  const text = normalize(
    `${activity.rawText} ${Object.values(activity.detectedSignals)
      .flat()
      .join(" ")}`,
  );
  return words.some((word) => text.includes(normalize(word)));
};

const dimensionPresent = (
  activity: ActivityStructuralScore,
  dimension: StructuralDimension,
) => activity.dimensionScores[dimension] > 0;

const inferOpenGaps = (primary: ActivityDiagnostic): RecursiveClosureGap[] => {
  const capabilityGaps = primary.closure.missingCapabilities as RecursiveClosureGap[];
  const findingGaps = primary.findings.flatMap((finding): RecursiveClosureGap[] => {
    if (finding.code === "formal_vs_real_gap") return ["s3_star", "vsm"];
    if (finding.code === "delivery_destination_conflict") {
      return ["moc", "olc", "recursive_chain"];
    }
    if (finding.code === "review_vs_transformation_conflict") {
      return ["s3", "moc"];
    }
    if (finding.code === "future_design_vs_daily_execution") {
      return ["s4", "recursive_chain"];
    }
    if (finding.code === "intermediate_object_customer_absence") {
      return ["pf", "olc", "recursive_chain"];
    }
    if (finding.code === "mission_conflict") return ["recursive_chain"];
    return [];
  });

  const closureGap =
    primary.closure.status === "closed" ? [] : (["recursive_chain"] as const);

  return unique([...capabilityGaps, ...findingGaps, ...closureGap]);
};

const expectedGapsForCandidate = (
  candidate: ActivityStructuralScore,
  openGaps: RecursiveClosureGap[],
) =>
  openGaps.filter((gap) => {
    if (gap === "pm") return dimensionPresent(candidate, "object");
    if (gap === "moc") return dimensionPresent(candidate, "object");
    if (gap === "pf") {
      return (
        dimensionPresent(candidate, "causality") ||
        dimensionPresent(candidate, "dependency")
      );
    }
    if (gap === "olc") {
      return (
        dimensionPresent(candidate, "object") ||
        hasTextSignal(candidate, ["estado", "entrega", "archivo", "insumo"])
      );
    }
    if (gap === "vsm") return dimensionPresent(candidate, "vsm_regulation");
    if (gap === "ahe") return dimensionPresent(candidate, "ahe_tension");
    if (gap === "recursive_chain") {
      return (
        dimensionPresent(candidate, "recursion") ||
        dimensionPresent(candidate, "dependency") ||
        dimensionPresent(candidate, "coordination")
      );
    }
    if (gap === "s3") {
      return hasTextSignal(candidate, [
        "revisar",
        "validar",
        "aprobar",
        "autorizar",
        "firma",
        "control",
      ]);
    }
    if (gap === "s3_star") {
      return hasTextSignal(candidate, [
        "error",
        "correccion",
        "observacion",
        "auditoria",
        "revision",
      ]);
    }
    if (gap === "s4") {
      return hasTextSignal(candidate, [
        "mejora",
        "redisen",
        "adaptar",
        "cambio",
        "futuro",
      ]);
    }
    if (gap === "s5") {
      return hasTextSignal(candidate, [
        "sacrificio",
        "prioridad",
        "decision",
        "limite",
        "presion",
      ]);
    }
    if (gap === "algedonic_channel") {
      return hasTextSignal(candidate, [
        "falla",
        "escala",
        "urgencia",
        "dolor",
        "critico",
      ]);
    }
    if (gap === "ahe_interpersonal") {
      return hasTextSignal(candidate, [
        "area",
        "equipo",
        "proveedor",
        "seguimiento",
        "coordinar",
      ]);
    }
    if (gap === "ahe_organizational") {
      return hasTextSignal(candidate, [
        "kpi",
        "indicador",
        "direccion",
        "poder",
        "sistema",
      ]);
    }
    return false;
  });

const scoreForDimensionGroup = (
  expectedGaps: RecursiveClosureGap[],
  group: RecursiveClosureGap[],
) => {
  if (!group.length) return 0;
  return clamp(expectedGaps.filter((gap) => group.includes(gap)).length / group.length);
};

const textSimilarity = (left: string, right: string) => {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (!leftTokens.size || !rightTokens.size) return 0;

  const intersection = Array.from(leftTokens).filter((token) =>
    rightTokens.has(token),
  ).length;
  return intersection / Math.min(leftTokens.size, rightTokens.size);
};

const computeRedundancyScore = (
  candidate: ActivityStructuralScore,
  modeledPrimary: ActivityDiagnostic,
) => {
  const similarity = textSimilarity(candidate.rawText, modeledPrimary.activityText);
  const alreadyCoveredDimensions = modeledPrimary.closure.missingCapabilities;
  const repeatedCoveredSignals = Object.entries(candidate.dimensionScores).filter(
    ([dimension, score]) =>
      score > 0 &&
      !alreadyCoveredDimensions.includes(
        dimension === "object"
          ? "moc"
          : dimension === "dependency"
            ? "pf"
            : dimension === "coordination"
              ? "vsm"
              : dimension === "ahe_tension"
                ? "ahe"
                : dimension,
      ),
  ).length;
  const repeatedRatio = repeatedCoveredSignals / Object.keys(candidate.dimensionScores).length;

  return clamp(similarity * 0.6 + repeatedRatio * 0.4);
};

const evaluateCandidate = (
  primary: ActivityDiagnostic,
  candidate: ActivityStructuralScore,
): SupportActivityCandidateEvaluation => {
  const openGaps = inferOpenGaps(primary);
  const expectedGaps = expectedGapsForCandidate(candidate, openGaps);
  const mmabp_gap_coverage_score = scoreForDimensionGroup(expectedGaps, [
    "pm",
    "moc",
    "pf",
    "olc",
  ]);
  const vsm_gap_coverage_score = scoreForDimensionGroup(expectedGaps, [
    "vsm",
    "s3",
    "s3_star",
    "s4",
    "s5",
    "algedonic_channel",
  ]);
  const ahe_gap_coverage_score = scoreForDimensionGroup(expectedGaps, [
    "ahe",
    "ahe_interpersonal",
    "ahe_organizational",
  ]);
  const recursive_connectivity_score = expectedGaps.includes("recursive_chain")
    ? 1
    : clamp(
        (Number(dimensionPresent(candidate, "dependency")) +
          Number(dimensionPresent(candidate, "coordination")) +
          Number(dimensionPresent(candidate, "recursion"))) /
          3,
      );
  const support_activity_redundancy_score = computeRedundancyScore(
    candidate,
    primary,
  );
  const anti_redundancy_score = 1 - support_activity_redundancy_score;
  const support_activity_marginal_closure_score = Number(
    (
      mmabp_gap_coverage_score * 0.3 +
      vsm_gap_coverage_score * 0.25 +
      ahe_gap_coverage_score * 0.15 +
      recursive_connectivity_score * 0.2 +
      anti_redundancy_score * 0.1
    ).toFixed(2),
  );
  const discarded_reason =
    support_activity_marginal_closure_score < 0.25
      ? "Bajo aporte marginal esperado al cierre arquitectonico."
      : support_activity_redundancy_score > 0.7
        ? "Alta redundancia con la actividad principal ya modelada."
        : null;

  return {
    support_activity: candidate,
    support_activity_expected_gap_closure: expectedGaps,
    support_activity_redundancy_score: Number(
      support_activity_redundancy_score.toFixed(2),
    ),
    support_activity_marginal_closure_score,
    support_activity_selection_reason: expectedGaps.length
      ? `Aporta senales para cerrar: ${expectedGaps.join(", ")}.`
      : "No se detecto una brecha especifica que esta actividad ayude a cerrar.",
    score_breakdown: {
      mmabp_gap_coverage_score: Number(mmabp_gap_coverage_score.toFixed(2)),
      vsm_gap_coverage_score: Number(vsm_gap_coverage_score.toFixed(2)),
      ahe_gap_coverage_score: Number(ahe_gap_coverage_score.toFixed(2)),
      recursive_connectivity_score: Number(recursive_connectivity_score.toFixed(2)),
      anti_redundancy_score: Number(anti_redundancy_score.toFixed(2)),
    },
    discarded_reason,
  };
};

const sortCandidates = (
  left: SupportActivityCandidateEvaluation,
  right: SupportActivityCandidateEvaluation,
) => {
  if (
    right.support_activity_marginal_closure_score !==
    left.support_activity_marginal_closure_score
  ) {
    return (
      right.support_activity_marginal_closure_score -
      left.support_activity_marginal_closure_score
    );
  }

  if (
    left.support_activity_redundancy_score !==
    right.support_activity_redundancy_score
  ) {
    return (
      left.support_activity_redundancy_score -
      right.support_activity_redundancy_score
    );
  }

  return (
    right.score_breakdown.recursive_connectivity_score -
    left.score_breakdown.recursive_connectivity_score
  );
};

export const selectSupportActivitiesForRecursiveClosure = ({
  primaryDiagnostics,
  supportCandidates,
  answeredSupportActivityIds = [],
}: SelectorInput): SupportActivitySelection[] => {
  const answeredSet = new Set(answeredSupportActivityIds);
  const iterationNumber = answeredSet.size + 1;
  const availableSupport = supportCandidates.filter(
    (candidate) => !answeredSet.has(candidate.activityId),
  );

  return primaryDiagnostics
    .filter((primary) => primary.closure.status !== "closed")
    .map((primary) => {
      const openGaps = inferOpenGaps(primary);
      const candidates = availableSupport
        .map((candidate) => evaluateCandidate(primary, candidate))
        .sort(sortCandidates);
      const selected =
        candidates.find((candidate) => !candidate.discarded_reason) ??
        candidates[0] ??
        null;

      return {
        primary_activity_id: primary.activityId,
        primary_activity_text: primary.activityText,
        open_gaps: openGaps,
        support_activity_selected: selected?.support_activity ?? null,
        support_activity_selection_reason:
          selected?.support_activity_selection_reason ??
          "No hay actividades soporte disponibles para intentar cerrar esta brecha.",
        support_activity_expected_gap_closure:
          selected?.support_activity_expected_gap_closure ?? [],
        support_activity_redundancy_score:
          selected?.support_activity_redundancy_score ?? null,
        support_activity_marginal_closure_score:
          selected?.support_activity_marginal_closure_score ?? null,
        support_activity_status: selected ? "selected" : "discarded",
        support_activity_iteration_number: iterationNumber,
        candidates,
      };
    });
};
