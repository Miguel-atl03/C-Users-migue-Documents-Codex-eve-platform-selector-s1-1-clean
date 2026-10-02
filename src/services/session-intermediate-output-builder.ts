import { supabaseServer } from "@/lib/supabase-server";
import type { SceneReadinessForTransduction } from "@/domain/scene";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";

type SceneCanonicalRecordRow = {
  id: string;
  scene_id: string;
  canonical_json: unknown;
  evidence_answer_ids: string[];
  consistency_flag_ids: string[];
  readiness_for_transduction: SceneReadinessForTransduction;
  created_at: string;
  updated_at: string;
};

type SceneRegistryRow = {
  id: string;
  scene_name: string;
  scene_rank: number | null;
  depth_level: string;
  scene_status: string;
};

type SessionIntermediateOutputInput = {
  sessionId: string;
};

export type SessionIntermediateOutputResult = {
  outputId: string;
  readinessForTransduction: SceneReadinessForTransduction;
  sessionReadyForTransduction: boolean;
  generatedFromSceneIds: string[];
  sceneCount: number;
};

type CanonicalJson = {
  sceneMetadata?: {
    sceneId?: string;
    sceneName?: string;
    sceneRank?: number | null;
    depthLevel?: string;
    sceneStatus?: string;
  };
  mmabpMap?: Record<string, { coverage?: string; gaps?: string[] }>;
  vsmMap?: Record<string, { signals?: Array<{ signal?: string }> }>;
  aheMap?: Record<string, { signals?: Array<{ signal?: string }> }>;
  crossValidations?: Array<{
    id?: string;
    label?: string;
    status?: string;
    severity?: string;
    message?: string;
  }>;
  pathwayHints?: Record<string, boolean>;
  readiness?: {
    readinessForTransduction?: SceneReadinessForTransduction;
    recommendedStatus?: string;
    requiresClarification?: boolean;
    requiresManualReview?: boolean;
    openFlagCount?: number;
    gapCount?: number;
    failedCriticalValidationCount?: number;
  };
  evidence_bundle_for_transduction?: unknown;
  gaps?: Array<{
    source?: string;
    code?: string;
    severity?: string;
    message?: string;
  }>;
  traceability?: {
    evidenceAnswerIds?: string[];
    derivationIds?: string[];
    consistencyFlagIds?: string[];
    clarificationIds?: string[];
    lightInferenceId?: string | null;
  };
};

const parseJsonIfNeeded = (value: unknown): CanonicalJson => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as CanonicalJson;
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as CanonicalJson;
  }

  return {};
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const readinessRank: Record<SceneReadinessForTransduction, number> = {
  not_ready: 0,
  partial: 1,
  ready_with_flags: 2,
  ready: 3,
};

const aggregateReadiness = (
  records: SceneCanonicalRecordRow[],
): SceneReadinessForTransduction => {
  if (!records.length) return "not_ready";

  const readinessValues = records.map((record) => record.readiness_for_transduction);

  if (readinessValues.includes("not_ready")) return "not_ready";
  if (readinessValues.includes("partial")) return "partial";
  if (readinessValues.includes("ready_with_flags")) return "ready_with_flags";

  return "ready";
};

const summarizeCoverage = (records: CanonicalJson[]) => {
  const summary: Record<
    string,
    { complete: number; partial: number; missing: number; gaps: string[] }
  > = {};

  for (const record of records) {
    for (const [compartment, coverage] of Object.entries(record.mmabpMap ?? {})) {
      summary[compartment] = summary[compartment] ?? {
        complete: 0,
        partial: 0,
        missing: 0,
        gaps: [],
      };

      if (coverage.coverage === "complete") summary[compartment].complete += 1;
      if (coverage.coverage === "partial") summary[compartment].partial += 1;
      if (coverage.coverage === "missing") summary[compartment].missing += 1;
      summary[compartment].gaps = unique([
        ...summary[compartment].gaps,
        ...(coverage.gaps ?? []),
      ]);
    }
  }

  return summary;
};

const summarizeSignals = (
  records: CanonicalJson[],
  mapKey: "vsmMap" | "aheMap",
) => {
  const summary: Record<string, Record<string, number>> = {};

  for (const record of records) {
    const signalMap = record[mapKey] ?? {};

    for (const [bucket, value] of Object.entries(signalMap)) {
      summary[bucket] = summary[bucket] ?? {};

      for (const signal of value.signals ?? []) {
        if (!signal.signal) continue;
        summary[bucket][signal.signal] = (summary[bucket][signal.signal] ?? 0) + 1;
      }
    }
  }

  return summary;
};

const summarizePathways = (records: CanonicalJson[]) => {
  const summary: Record<string, number> = {};

  for (const record of records) {
    for (const [pathway, active] of Object.entries(record.pathwayHints ?? {})) {
      if (!active) continue;
      summary[pathway] = (summary[pathway] ?? 0) + 1;
    }
  }

  return summary;
};

const summarizeValidations = (records: CanonicalJson[]) => {
  const validations = records.flatMap((record) =>
    (record.crossValidations ?? []).map((validation) => ({
      ...validation,
      sceneId: record.sceneMetadata?.sceneId ?? null,
      sceneName: record.sceneMetadata?.sceneName ?? null,
    })),
  );

  return {
    total: validations.length,
    failedCritical: validations.filter(
      (validation) =>
        validation.status === "fail" && validation.severity === "critical",
    ),
    warnings: validations.filter((validation) => validation.status === "warning"),
  };
};

const countByReadiness = (records: SceneCanonicalRecordRow[]) =>
  records.reduce(
    (accumulator, record) => ({
      ...accumulator,
      [record.readiness_for_transduction]:
        accumulator[record.readiness_for_transduction] + 1,
    }),
    {
      not_ready: 0,
      partial: 0,
      ready_with_flags: 0,
      ready: 0,
    } satisfies Record<SceneReadinessForTransduction, number>,
  );

const sessionReadyForTransduction = (
  records: SceneCanonicalRecordRow[],
  parsedRecords: CanonicalJson[],
) => {
  const deepRecords = records.filter((record, index) => {
    const depth = parsedRecords[index].sceneMetadata?.depthLevel;
    return depth === "A_core";
  });
  const hasDeepScene = deepRecords.length > 0;
  const allDeepHaveBundle = deepRecords.every((record) => {
    const canonical = parsedRecords[records.indexOf(record)];
    return Boolean(canonical.evidence_bundle_for_transduction);
  });
  const allDeepCompatible = deepRecords.every((record) =>
    ["ready", "ready_with_flags"].includes(record.readiness_for_transduction),
  );
  const hasCriticalGaps = parsedRecords.some((record) =>
    (record.gaps ?? []).some((gap) => gap.severity === "critical"),
  );
  const hasUnresolvedReview = parsedRecords.some(
    (record) =>
      record.readiness?.requiresManualReview ||
      record.readiness?.recommendedStatus === "needs_manual_review" ||
      record.readiness?.recommendedStatus === "needs_support_reentry" ||
      record.readiness?.recommendedStatus === "insufficient_evidence",
  );
  const hasFailedCriticalValidation = parsedRecords.some(
    (record) => (record.readiness?.failedCriticalValidationCount ?? 0) > 0,
  );

  return (
    hasDeepScene &&
    allDeepHaveBundle &&
    allDeepCompatible &&
    !hasCriticalGaps &&
    !hasUnresolvedReview &&
    !hasFailedCriticalValidation
  );
};

export async function buildSessionIntermediateOutput({
  sessionId,
}: SessionIntermediateOutputInput): Promise<SessionIntermediateOutputResult> {
  const [canonicalResult, scenesResult] = await Promise.all([
    supabaseServer
      .from("scene_canonical_records")
      .select(
        [
          "id",
          "scene_id",
          "canonical_json",
          "evidence_answer_ids",
          "consistency_flag_ids",
          "readiness_for_transduction",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("sesion_id", sessionId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION),
    supabaseServer
      .from("scene_registry")
      .select("id, scene_name, scene_rank, depth_level, scene_status")
      .eq("sesion_id", sessionId),
  ]);

  if (canonicalResult.error) throw new Error(canonicalResult.error.message);
  if (scenesResult.error) throw new Error(scenesResult.error.message);

  const records =
    (canonicalResult.data ?? []) as unknown as SceneCanonicalRecordRow[];
  const scenes = (scenesResult.data ?? []) as unknown as SceneRegistryRow[];
  const recordsBySceneId = new Map(records.map((record) => [record.scene_id, record]));
  const parsedRecords = records.map((record) => parseJsonIfNeeded(record.canonical_json));
  const generatedFromSceneIds = records.map((record) => record.scene_id);
  const readinessForTransduction = aggregateReadiness(records);
  const sessionReady = sessionReadyForTransduction(records, parsedRecords);
  const validationSummary = summarizeValidations(parsedRecords);
  const sceneSummaries = scenes.map((scene) => {
    const record = recordsBySceneId.get(scene.id);
    const canonical = record
      ? parsedRecords[records.findIndex((item) => item.scene_id === scene.id)]
      : {};

    return {
      canonicalRecordId: record?.id ?? null,
      sceneId: scene.id,
      sceneName: scene.scene_name,
      sceneRank: scene.scene_rank,
      depthLevel: scene.depth_level,
      sceneStatus: scene.scene_status,
      readinessForTransduction: record?.readiness_for_transduction ?? "not_ready",
      recommendedStatus:
        canonical.readiness?.recommendedStatus ?? "insufficient_evidence",
      requiresClarification: canonical.readiness?.requiresClarification ?? false,
      requiresManualReview: canonical.readiness?.requiresManualReview ?? false,
      openFlagCount: canonical.readiness?.openFlagCount ?? 0,
      gapCount: canonical.readiness?.gapCount ?? canonical.gaps?.length ?? 0,
      failedCriticalValidationCount:
        canonical.readiness?.failedCriticalValidationCount ?? 0,
      pathwayHints: canonical.pathwayHints ?? {},
      gaps: canonical.gaps ?? [],
    };
  });
  const outputJson = {
    schemaVersion: "session_intermediate_output_v1",
    instrumentVersion: CAPA1_V2_1_INSTRUMENT_VERSION,
    sessionId,
    generatedAt: new Date().toISOString(),
    readiness: {
      readinessForTransduction,
      session_ready_for_transduction: sessionReady,
      sceneCount: records.length,
      registeredSceneCount: scenes.length,
      byReadiness: countByReadiness(records),
      requiresClarification: parsedRecords.some(
        (record) => record.readiness?.requiresClarification,
      ),
      requiresManualReview: parsedRecords.some(
        (record) => record.readiness?.requiresManualReview,
      ),
      weakestSceneReadiness:
        records
          .map((record) => record.readiness_for_transduction)
          .sort((left, right) => readinessRank[left] - readinessRank[right])[0] ??
        "not_ready",
    },
    scenes: sceneSummaries,
    scene_registry: {
      deep: sceneSummaries.filter((scene) => scene.depthLevel === "A_core"),
      abbreviated: sceneSummaries.filter(
        (scene) => scene.depthLevel === "B_abbreviated",
      ),
      support: sceneSummaries.filter(
        (scene) => scene.depthLevel === "C_support_reentry",
      ),
      pending: sceneSummaries.filter(
        (scene) => !recordsBySceneId.has(scene.sceneId),
      ),
    },
    evidence_bundle_summary: parsedRecords.map((record) => ({
      sceneId: record.sceneMetadata?.sceneId ?? null,
      hasEvidenceBundle: Boolean(record.evidence_bundle_for_transduction),
      gaps: record.gaps ?? [],
    })),
    gaps: parsedRecords.flatMap((record) =>
      (record.gaps ?? []).map((gap) => ({
        ...gap,
        sceneId: record.sceneMetadata?.sceneId ?? null,
        sceneName: record.sceneMetadata?.sceneName ?? null,
      })),
    ),
    manual_review_queue: sceneSummaries.filter(
      (scene) =>
        scene.requiresManualReview ||
        scene.recommendedStatus === "needs_manual_review",
    ),
    support_reentry_recommendations: sceneSummaries.filter(
      (scene) => scene.recommendedStatus === "needs_support_reentry",
    ),
    structuralCoverage: {
      mmabp: summarizeCoverage(parsedRecords),
    },
    signalSummary: {
      vsm: summarizeSignals(parsedRecords, "vsmMap"),
      ahe: summarizeSignals(parsedRecords, "aheMap"),
      pathwayHints: summarizePathways(parsedRecords),
    },
    validations: validationSummary,
    traceability: {
      generatedFromSceneIds,
      canonicalRecordIds: records.map((record) => record.id),
      evidenceAnswerIds: unique(
        records.flatMap((record) => record.evidence_answer_ids ?? []),
      ),
      consistencyFlagIds: unique(
        records.flatMap((record) => record.consistency_flag_ids ?? []),
      ),
      derivationIds: unique(
        parsedRecords.flatMap(
          (record) => record.traceability?.derivationIds ?? [],
        ),
      ),
      clarificationIds: unique(
        parsedRecords.flatMap(
          (record) => record.traceability?.clarificationIds ?? [],
        ),
      ),
      lightInferenceIds: unique(
        parsedRecords.flatMap((record) =>
          record.traceability?.lightInferenceId
            ? [record.traceability.lightInferenceId]
            : [],
        ),
      ),
    },
    boundary: {
      doesNotActivateCausalNodes: true,
      doesNotConfirmInevitabilityPaths: true,
      capa1ToCapa2RuntimeGuard: {
        gate: "session_ready_for_transduction",
        handoffAllowed: sessionReady,
        doesNotModifyCapa2Readiness: true,
        requiredBeforeCapa2Use: [
          "scene_canonical_record",
          "evidence_bundle_for_transduction",
          "session_ready_for_transduction",
        ],
        prohibitedUsesWhenBlocked: [
          "diagnostic_finding",
          "root_cause",
          "closed_ahe_reading",
          "closed_vsm_classification",
          "capa_2_node_assignment",
        ],
      },
      intendedConsumer:
        "causal_transduction_table_and_causal_decision_tree_after_capa1",
    },
  };

  const { data: savedOutput, error: upsertError } = await supabaseServer
    .from("session_intermediate_output")
    .upsert(
      {
        sesion_id: sessionId,
        instrument_version: CAPA1_V2_1_INSTRUMENT_VERSION,
        output_json: outputJson,
        readiness_for_transduction: sessionReady ? "ready" : readinessForTransduction,
        generated_from_scene_ids: generatedFromSceneIds,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "sesion_id,instrument_version" },
    )
    .select("id")
    .single();

  if (upsertError) throw new Error(upsertError.message);

  return {
    outputId: String(savedOutput.id),
    readinessForTransduction: sessionReady ? "ready" : readinessForTransduction,
    sessionReadyForTransduction: sessionReady,
    generatedFromSceneIds,
    sceneCount: scenes.length,
  };
}
