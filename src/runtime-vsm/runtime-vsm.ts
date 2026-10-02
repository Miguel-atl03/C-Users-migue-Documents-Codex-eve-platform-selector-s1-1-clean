import fs from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase-server";
import {
  PLATFORM_RUNTIME_VERSION,
  platformConsumptionContract,
  runtimeManifest,
} from "@/runtime/capa1-runtime-manifest";
import thresholds from "./runtime-vsm-thresholds.json";

export type VsmSystemId = "S1" | "S2" | "S3" | "S3*" | "S4" | "S5";
export type VsmSeverity = "green" | "amber" | "red";
export type AlgedonicSeverity = "critical" | "major" | "minor";
export type ResponsibleSystem = VsmSystemId | "algedonic";
export type PeriodCadence = "weekly" | "monthly" | "daily";

export const REQUIRED_BUNDLES = [
  "ahe_observation_bundle",
  "compensation_bundle",
  "evidence_bundle_for_transduction",
] as const;
export const REQUIRED_BLOCK_7_CODES = ["7.0", "7.0a", "7.1", "7.2", "7.3", "7.3a", "7.4"];
export const MICROCONFIRMATION_CODES = ["7.1", "7.2", "7.3"];

export type VsmMetric = { label: string; value: string | number; detail?: string; status?: VsmSeverity };
export type AlgedonicEvent = {
  id: string;
  generatedAt: string;
  severity: AlgedonicSeverity;
  signal: string;
  condition: string;
  actionRequired: string;
  responsibleSystem: ResponsibleSystem;
  evidence: Record<string, string | number | boolean | null>;
};
export type RecentRuntimeCase = {
  sceneId: string;
  sessionId: string;
  timestamp: string;
  manifestVersion: string;
  contentHash: string;
  readiness: string;
  confidenceScore: number | null;
  bundlesComplete: boolean;
  block7Complete: boolean;
  microconfirmations: number;
  has70a: boolean;
  has73a: boolean;
  provenancePresent: boolean;
  consolidatedValuePresent: boolean;
  intermediateOutputPresent: boolean;
  notDiagnosticMaintained: boolean;
  criticalAnomalyCount: number;
  majorAnomalyCount: number;
  minorAnomalyCount: number;
  anomalyCount: number;
};
export type TimeSeriesPoint = {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  cadence: PeriodCadence;
  sessionsCount: number;
  scenesCount: number;
  bundleCompletenessRatio: number | null;
  block7CompletenessRatio: number | null;
  provenancePresenceRatio: number | null;
  intermediateOutputRatio: number | null;
  confidenceScoreAverage: number | null;
  confidenceScoreMedian: number | null;
  readinessDistribution: Record<string, number>;
  microconfirmationsAverage: number | null;
  microconfirmationsMax: number;
  criticalAnomalies: number;
  majorAnomalies: number;
  minorAnomalies: number;
  manifestVersionDistribution: Record<string, number>;
  predominantManifestVersion: string | null;
  contentHashDistribution: Record<string, number>;
  predominantContentHash: string | null;
};
export type DriftSignal = {
  id: string;
  cadence: "weekly" | "monthly";
  severity: AlgedonicSeverity;
  metric: string;
  direction: "stable" | "improving" | "deteriorating" | "critical";
  detail: string;
  actionRequired: string;
};
export type VsmPanel = {
  id: VsmSystemId;
  title: string;
  purpose: string;
  status: VsmSeverity;
  metrics: VsmMetric[];
  signals: string[];
  actions: string[];
};
export type VsmTransducer = { name: string; usedBy: VsmSystemId[]; varietyRole: string; detectsOrPrevents: string };
export type RuntimeVsmSnapshot = {
  status: VsmSeverity;
  generatedAt: string;
  baselineSince: string;
  scope: { recentSceneLimit: number; sceneCount: number; sessionCount: number };
  manifest: {
    version: string;
    contentHash: string;
    sourceCommit: string;
    workspaceState: string;
    expectedPlatformRuntimeVersion: string;
    activePlatformRuntimeVersion: string;
  };
  coordination: {
    conformanceStatus: string;
    observabilityAuditStatus: string;
    promotedManifestAligned: boolean;
    loaderStrict: boolean;
    schemaValidation: string;
    baselineActive: string;
    localCatalogActiveReferences: number;
    legacyCatalogFilesPresent: number;
    retiredLegacyCatalogPresent: boolean;
  };
  s1: VsmPanel;
  s2: VsmPanel;
  s3: VsmPanel;
  s3star: VsmPanel;
  s4: VsmPanel;
  s5: VsmPanel;
  algedonic: { status: VsmSeverity; events: AlgedonicEvent[] };
  transducers: VsmTransducer[];
  structuralFailureMap: Array<{ failure: string; primaryView: VsmSystemId; indicator: string; alert: string; suggestedAction: string; severityRule: string }>;
  recentCases: RecentRuntimeCase[];
  trends: {
    byDay: TimeSeriesPoint[];
    weekly: TimeSeriesPoint[];
    monthly: TimeSeriesPoint[];
    driftSignals: DriftSignal[];
  };
};

type SceneRow = { id: string; sesion_id: string; scene_status: string; created_at: string };
type InferenceRow = { scene_id: string; preclassification_readiness: string | null; confidence_score: number | string | null; confidence_level: string | null; flagged_for_manual_review: boolean | null };
type BundleRow = { scene_id: string; bundle_type: string; not_diagnostic: boolean | null };
type AnswerRow = { scene_id: string; question_code: string; consolidated_value: unknown; provenance_chain: unknown };
type CanonicalRecordRow = { scene_id: string; readiness_for_transduction: string | null };
type IntermediateOutputRow = { sesion_id: string; readiness_for_transduction: string | null };
type ObservabilityAuditReport = { status?: string; checkedAt?: string; scope?: { sceneCount?: number; sessionCount?: number }; anomalies?: Array<{ severity?: string; area?: string; detail?: string }> };
type ManifestConformanceReport = { status?: string; checked_at?: string; manifest?: { version?: string; hash?: string; question_count?: number }; failures?: Array<{ area?: string; detail?: string }>; warnings?: Array<{ area?: string; detail?: string }> };

const root = process.cwd();
const asNumber = (value: number | string | null | undefined) => typeof value === "number" ? value : value === null || value === undefined ? null : Number(value);
const ratio = (count: number, total: number) => (total > 0 ? count / total : null);
export const formatPct = (value: number | null) => value === null ? "n/a" : Math.round(value * 100) + "%";
const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : Number(((sorted[midpoint - 1] + sorted[midpoint]) / 2).toFixed(2));
};
const statusFromEvents = (events: AlgedonicEvent[]): VsmSeverity => events.some((event) => event.severity === "critical") ? "red" : events.length ? "amber" : "green";
export const vsmStatusLabel = (status: VsmSeverity) => status === "green" ? "verde" : status === "amber" ? "ambar" : "rojo";

function safeReadJson<T>(relativePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(/* turbopackIgnore: true */ root, relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}
function fileExists(relativePath: string) {
  return fs.existsSync(path.join(/* turbopackIgnore: true */ root, relativePath));
}
function hasJsonValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}
function countActiveLocalCatalogReferences() {
  const sourcePaths = [
    "src/app/page.tsx",
    "src/app/api/questionnaire/catalog/route.ts",
    "src/components/SceneQuestionnaireRunner.tsx",
    "src/services/scene-derivation-engine.ts",
    "src/services/scene-repository.ts",
    "src/services/scene-light-preclassification-engine.ts",
    "src/services/scene-canonical-record-builder.ts",
  ];
  return sourcePaths.reduce((count, relativePath) => {
    try {
      const source = fs.readFileSync(path.join(/* turbopackIgnore: true */ root, relativePath), "utf8");
      return source.includes("question-catalog-v2-1.json") || source.includes("@/rules/question-catalog-v2-1") ? count + 1 : count;
    } catch {
      return count;
    }
  }, 0);
}
function makeEvent(generatedAt: string, severity: AlgedonicSeverity, signal: string, condition: string, actionRequired: string, responsibleSystem: ResponsibleSystem, evidence: Record<string, string | number | boolean | null>): AlgedonicEvent {
  const slug = signal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id: generatedAt + ":" + slug, generatedAt, severity, signal, condition, actionRequired, responsibleSystem, evidence };
}
function panel(id: VsmSystemId, title: string, purpose: string, allEvents: AlgedonicEvent[], metrics: VsmMetric[], signals: string[], actions: string[]): VsmPanel {
  return { id, title, purpose, status: statusFromEvents(allEvents.filter((event) => event.responsibleSystem === id)), metrics, signals, actions };
}
function distribution<T>(rows: T[], keyFor: (row: T) => string | null | undefined) {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const key = keyFor(row) ?? "missing";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}
function distributionText(values: Record<string, number>) {
  const entries = Object.entries(values);
  return entries.length ? entries.map(([key, value]) => key + "=" + value).join(", ") : "sin datos";
}
function predominant(distributionMap: Record<string, number>) {
  const [winner] = Object.entries(distributionMap).sort((left, right) => right[1] - left[1]);
  return winner?.[0] ?? null;
}
function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}
function periodBounds(dateText: string, cadence: PeriodCadence) {
  const date = new Date(dateText);
  if (cadence === "monthly") {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    return { start, end, label: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}` };
  }
  if (cadence === "weekly") {
    const day = startOfDay(date);
    const weekday = day.getUTCDay() || 7;
    const start = addDays(day, 1 - weekday);
    const end = addDays(start, 7);
    return { start, end, label: `${start.toISOString().slice(0, 10)} semana` };
  }
  const start = startOfDay(date);
  const end = addDays(start, 1);
  return { start, end, label: start.toISOString().slice(0, 10) };
}
function seriesRows(cases: RecentRuntimeCase[], cadence: PeriodCadence): TimeSeriesPoint[] {
  const grouped = new Map<string, RecentRuntimeCase[]>();
  for (const runtimeCase of cases) {
    const bounds = periodBounds(runtimeCase.timestamp, cadence);
    const key = bounds.start.toISOString();
    grouped.set(key, [...(grouped.get(key) ?? []), runtimeCase]);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, periodCases]) => {
    const bounds = periodBounds(key, cadence);
    const scores = periodCases.map((item) => item.confidenceScore).filter((item): item is number => typeof item === "number");
    const sessionIds = new Set(periodCases.map((item) => item.sessionId));
    const manifestVersionDistribution = distribution(periodCases, (item) => item.manifestVersion);
    const contentHashDistribution = distribution(periodCases, (item) => item.contentHash);
    return {
      periodStart: bounds.start.toISOString(),
      periodEnd: bounds.end.toISOString(),
      periodLabel: bounds.label,
      cadence,
      sessionsCount: sessionIds.size,
      scenesCount: periodCases.length,
      bundleCompletenessRatio: ratio(periodCases.filter((item) => item.bundlesComplete).length, periodCases.length),
      block7CompletenessRatio: ratio(periodCases.filter((item) => item.block7Complete).length, periodCases.length),
      provenancePresenceRatio: ratio(periodCases.filter((item) => item.provenancePresent).length, periodCases.length),
      intermediateOutputRatio: ratio(periodCases.filter((item) => item.intermediateOutputPresent).length, periodCases.length),
      confidenceScoreAverage: average(scores),
      confidenceScoreMedian: median(scores),
      readinessDistribution: distribution(periodCases, (item) => item.readiness),
      microconfirmationsAverage: average(periodCases.map((item) => item.microconfirmations)),
      microconfirmationsMax: Math.max(0, ...periodCases.map((item) => item.microconfirmations)),
      criticalAnomalies: periodCases.reduce((sum, item) => sum + item.criticalAnomalyCount, 0),
      majorAnomalies: periodCases.reduce((sum, item) => sum + item.majorAnomalyCount, 0),
      minorAnomalies: periodCases.reduce((sum, item) => sum + item.minorAnomalyCount, 0),
      manifestVersionDistribution,
      predominantManifestVersion: predominant(manifestVersionDistribution),
      contentHashDistribution,
      predominantContentHash: predominant(contentHashDistribution),
    };
  });
}
function twoDrops(series: TimeSeriesPoint[], metric: keyof TimeSeriesPoint) {
  if (series.length < 3) return false;
  const last = series.slice(-3).map((point) => point[metric]).filter((value): value is number => typeof value === "number");
  return last.length === 3 && last[0] > last[1] && last[1] > last[2];
}
function twoRises(series: TimeSeriesPoint[], metric: keyof TimeSeriesPoint) {
  if (series.length < 3) return false;
  const last = series.slice(-3).map((point) => point[metric]).filter((value): value is number => typeof value === "number");
  return last.length === 3 && last[0] < last[1] && last[1] < last[2];
}
function readinessRatio(point: TimeSeriesPoint, readiness: string) {
  if (!point.scenesCount) return 0;
  return (point.readinessDistribution[readiness] ?? 0) / point.scenesCount;
}
function detectTemporalDrift(series: TimeSeriesPoint[], cadence: "weekly" | "monthly"): DriftSignal[] {
  const signals: DriftSignal[] = [];
  const latest = series.at(-1);
  const previous = series.at(-2);
  const add = (severity: AlgedonicSeverity, metric: string, direction: DriftSignal["direction"], detail: string, actionRequired: string) => {
    signals.push({ id: `${cadence}:${metric}:${direction}`, cadence, severity, metric, direction, detail, actionRequired });
  };

  if (twoDrops(series, "bundleCompletenessRatio")) add("major", "bundleCompletenessRatio", "deteriorating", "Bundles completos caen durante 2 periodos consecutivos.", "Investigar persistencia de bundles antes de que cruce umbral critico.");
  if (twoDrops(series, "block7CompletenessRatio")) add("major", "block7CompletenessRatio", "deteriorating", "Bloque 7 completo cae durante 2 periodos consecutivos.", "Revisar branching y guardado de 7.0a/7.3a.");
  if (twoDrops(series, "intermediateOutputRatio")) add("major", "intermediateOutputRatio", "deteriorating", "Salida intermedia cae durante 2 periodos consecutivos.", "Revisar cierre de sesiones y generacion de salida intermedia.");
  if (twoRises(series, "microconfirmationsAverage")) add("major", "microconfirmationsAverage", "deteriorating", "Microconfirmaciones promedio suben durante 2 periodos consecutivos.", "Revisar si Bloque 7 esta compensando perdida de evidencia upstream.");

  if (latest?.microconfirmationsMax && latest.microconfirmationsMax > thresholds.maxMicroconfirmationsPerScene) add("critical", "microconfirmationsMax", "critical", "Un periodo contiene escenas con mas de 3 microconfirmaciones.", "Corregir inmediatamente la regla de maximo de Bloque 7.");
  if (latest?.criticalAnomalies) add("critical", "criticalAnomalies", "critical", "El periodo actual contiene anomalias criticas.", "Abrir incidente algedonico y congelar promocion.");

  if (latest && previous && latest.confidenceScoreAverage !== null && previous.confidenceScoreAverage !== null) {
    const drop = previous.confidenceScoreAverage - latest.confidenceScoreAverage;
    if (drop >= thresholds.confidenceAverageDropMajor) add("major", "confidenceScoreAverage", "deteriorating", `Confidence promedio cayo ${drop} puntos contra el periodo anterior.`, "Revisar cambios de runtime o evidencia capturada.");
    else if (drop >= thresholds.confidenceAverageDropWarning) add("minor", "confidenceScoreAverage", "deteriorating", `Confidence promedio cayo ${drop} puntos contra el periodo anterior.`, "Monitorear siguiente periodo antes de escalar.");
  }

  if (series.length >= 3) {
    const lastThree = series.slice(-3).map((point) => readinessRatio(point, "ready_with_microconfirmations"));
    if (lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2] && lastThree[2] - lastThree[0] >= thresholds.readyWithMicroconfirmationsGrowthMinimum) {
      add("major", "ready_with_microconfirmations", "deteriorating", "ready_with_microconfirmations crece de forma sostenida.", "Revisar calidad de evidencia antes de Bloque 7.");
    }
  }

  if (latest && previous && latest.predominantManifestVersion !== previous.predominantManifestVersion) {
    const worsened = [
      (latest.bundleCompletenessRatio ?? 1) < (previous.bundleCompletenessRatio ?? 1),
      (latest.block7CompletenessRatio ?? 1) < (previous.block7CompletenessRatio ?? 1),
      (latest.intermediateOutputRatio ?? 1) < (previous.intermediateOutputRatio ?? 1),
      (latest.confidenceScoreAverage ?? 100) < (previous.confidenceScoreAverage ?? 100),
      (latest.microconfirmationsAverage ?? 0) > (previous.microconfirmationsAverage ?? 0),
    ].filter(Boolean).length;
    if (worsened >= thresholds.keyMetricReleaseDeteriorationCount) add("major", "manifestReleaseImpact", "deteriorating", "Despues de cambio de manifest empeoraron 2 o mas metricas clave.", "Revisar release ledger y considerar freeze/rollback.");
  }

  if (!signals.length && latest) add("minor", "temporalStability", "stable", "Sin deriva temporal sostenida en la ventana activa.", "Mantener monitoreo semanal y mensual.");
  return signals;
}

export async function buildRuntimeVsmSnapshot(options?: { since?: string; limit?: number }): Promise<RuntimeVsmSnapshot> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase environment variables are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before loading Runtime VSM.",
    );
  }

  const generatedAt = new Date().toISOString();
  const since = options?.since ?? process.env.EVE_OBSERVABILITY_SINCE ?? thresholds.baselineSince;
  const limit = Math.min(options?.limit ?? thresholds.recentSceneLimit, 1000);
  const manifestMetadata = runtimeManifest.metadata;

  let scenesQuery = supabaseServer
    .from("scene_registry")
    .select("id, sesion_id, scene_status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (since) scenesQuery = scenesQuery.gte("created_at", since);

  const scenesResult = await scenesQuery;
  if (scenesResult.error) throw new Error(scenesResult.error.message);

  const scenes = (scenesResult.data ?? []) as SceneRow[];
  const sceneIds = scenes.map((scene) => scene.id);
  const sessionIds = [...new Set(scenes.map((scene) => scene.sesion_id))];
  const emptyResult = { data: [], error: null };
  const [inferencesResult, bundlesResult, answersResult, canonicalResult, intermediateResult] = sceneIds.length
    ? await Promise.all([
        supabaseServer.from("scene_light_inferences").select("scene_id, preclassification_readiness, confidence_score, confidence_level, flagged_for_manual_review").in("scene_id", sceneIds),
        supabaseServer.from("scene_answer_bundles").select("scene_id, bundle_type, not_diagnostic").in("scene_id", sceneIds),
        supabaseServer.from("scene_question_answers").select("scene_id, question_code, consolidated_value, provenance_chain").in("scene_id", sceneIds),
        supabaseServer.from("scene_canonical_records").select("scene_id, readiness_for_transduction").in("scene_id", sceneIds),
        supabaseServer.from("session_intermediate_output").select("sesion_id, readiness_for_transduction").in("sesion_id", sessionIds),
      ])
    : [emptyResult, emptyResult, emptyResult, emptyResult, emptyResult];

  for (const result of [inferencesResult, bundlesResult, answersResult, canonicalResult, intermediateResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const inferences = (inferencesResult.data ?? []) as InferenceRow[];
  const bundles = (bundlesResult.data ?? []) as BundleRow[];
  const answers = (answersResult.data ?? []) as AnswerRow[];
  const canonicalRecords = (canonicalResult.data ?? []) as CanonicalRecordRow[];
  const intermediateOutputs = (intermediateResult.data ?? []) as IntermediateOutputRow[];

  const inferenceByScene = new Map(inferences.map((row) => [row.scene_id, row]));
  const canonicalByScene = new Map(canonicalRecords.map((row) => [row.scene_id, row]));
  const bundleTypesByScene = new Map<string, Set<string>>();
  const bundleRowsByScene = new Map<string, BundleRow[]>();
  const questionCodesByScene = new Map<string, Set<string>>();
  const answersByScene = new Map<string, AnswerRow[]>();
  const intermediateSessionIds = new Set(intermediateOutputs.map((row) => row.sesion_id));

  for (const bundle of bundles) {
    bundleTypesByScene.set(bundle.scene_id, bundleTypesByScene.get(bundle.scene_id) ?? new Set());
    bundleRowsByScene.set(bundle.scene_id, [...(bundleRowsByScene.get(bundle.scene_id) ?? []), bundle]);
    bundleTypesByScene.get(bundle.scene_id)?.add(bundle.bundle_type);
  }
  for (const answer of answers) {
    questionCodesByScene.set(answer.scene_id, questionCodesByScene.get(answer.scene_id) ?? new Set());
    answersByScene.set(answer.scene_id, [...(answersByScene.get(answer.scene_id) ?? []), answer]);
    questionCodesByScene.get(answer.scene_id)?.add(answer.question_code);
  }

  const recentCases = scenes.map<RecentRuntimeCase>((scene) => {
    const inference = inferenceByScene.get(scene.id);
    const canonical = canonicalByScene.get(scene.id);
    const bundleTypes = bundleTypesByScene.get(scene.id) ?? new Set<string>();
    const questionCodes = questionCodesByScene.get(scene.id) ?? new Set<string>();
    const sceneAnswers = answersByScene.get(scene.id) ?? [];
    const sceneBundles = bundleRowsByScene.get(scene.id) ?? [];
    const bundlesComplete = REQUIRED_BUNDLES.every((bundle) => bundleTypes.has(bundle));
    const block7Complete = REQUIRED_BLOCK_7_CODES.every((code) => questionCodes.has(code));
    const microconfirmations = MICROCONFIRMATION_CODES.filter((code) => questionCodes.has(code)).length;
    const score = asNumber(inference?.confidence_score);
    const intermediateOutputPresent = intermediateSessionIds.has(scene.sesion_id);
    const notDiagnosticMaintained = sceneBundles.length > 0 && sceneBundles.every((bundle) => bundle.not_diagnostic === true);
    const criticalAnomalyCount = [
      score === null || score < thresholds.confidenceScoreMin || score > thresholds.confidenceScoreMax,
      !notDiagnosticMaintained,
      microconfirmations > thresholds.maxMicroconfirmationsPerScene,
    ].filter(Boolean).length;
    const majorAnomalyCount = [
      !bundlesComplete,
      !block7Complete,
      !intermediateOutputPresent,
      !sceneAnswers.some((answer) => hasJsonValue(answer.provenance_chain)),
    ].filter(Boolean).length;
    return {
      sceneId: scene.id,
      sessionId: scene.sesion_id,
      timestamp: scene.created_at,
      manifestVersion: manifestMetadata.manifest_version,
      contentHash: manifestMetadata.content_hash,
      readiness: inference?.preclassification_readiness ?? canonical?.readiness_for_transduction ?? "missing",
      confidenceScore: score,
      bundlesComplete,
      block7Complete,
      microconfirmations,
      has70a: questionCodes.has("7.0a"),
      has73a: questionCodes.has("7.3a"),
      provenancePresent: sceneAnswers.some((answer) => hasJsonValue(answer.provenance_chain)),
      consolidatedValuePresent: sceneAnswers.some((answer) => hasJsonValue(answer.consolidated_value)),
      intermediateOutputPresent,
      notDiagnosticMaintained,
      criticalAnomalyCount,
      majorAnomalyCount,
      minorAnomalyCount: inference?.flagged_for_manual_review ? 1 : 0,
      anomalyCount: criticalAnomalyCount + majorAnomalyCount + (inference?.flagged_for_manual_review ? 1 : 0),
    };
  });

  const conformanceReport = safeReadJson<ManifestConformanceReport>("reports/platform-manifest-conformance-report.json");
  const observabilityReport = safeReadJson<ObservabilityAuditReport>("reports/runtime-observability-audit-report.json");
  const localCatalogActiveReferences = countActiveLocalCatalogReferences();
  const legacyCatalogFilesPresent = fileExists("src/rules/question-catalog-v2-1.json") ? 1 : 0;
  const retiredLegacyCatalogPresent = fileExists("archive/legacy-runtime/question-catalog-v2-1.NO_RUNTIME_SOURCE.json");
  const loaderStrict = PLATFORM_RUNTIME_VERSION === manifestMetadata.expected_platform_runtime_version;
  const promotedManifestAligned = conformanceReport?.manifest?.hash === manifestMetadata.content_hash && conformanceReport?.manifest?.version === manifestMetadata.manifest_version;

  const confidenceScores = recentCases.map((item) => item.confidenceScore).filter((item): item is number => typeof item === "number");
  const bundleRatio = ratio(recentCases.filter((item) => item.bundlesComplete).length, recentCases.length);
  const block7Ratio = ratio(recentCases.filter((item) => item.block7Complete).length, recentCases.length);
  const outputRatio = ratio(sessionIds.filter((sessionId) => intermediateSessionIds.has(sessionId)).length, sessionIds.length);
  const provenanceRatio = ratio(recentCases.filter((item) => item.provenancePresent).length, recentCases.length);
  const consolidatedRatio = ratio(recentCases.filter((item) => item.consolidatedValuePresent).length, recentCases.length);
  const notDiagnosticRatio = ratio(recentCases.filter((item) => item.notDiagnosticMaintained).length, recentCases.length);
  const block70aRatio = ratio(recentCases.filter((item) => item.has70a).length, recentCases.length);
  const block73aRatio = ratio(recentCases.filter((item) => item.has73a).length, recentCases.length);
  const invalidConfidenceCount = recentCases.filter((item) => item.confidenceScore === null || item.confidenceScore < thresholds.confidenceScoreMin || item.confidenceScore > thresholds.confidenceScoreMax).length;
  const overMicroconfirmationScenes = recentCases.filter((item) => item.microconfirmations > thresholds.maxMicroconfirmationsPerScene).length;
  const microconfirmationAverage = average(recentCases.map((item) => item.microconfirmations)) ?? 0;
  const structuralAnomalyCount = recentCases.reduce((sum, item) => sum + item.criticalAnomalyCount + item.majorAnomalyCount, 0);
  const readinessDistribution = distribution(inferences, (row) => row.preclassification_readiness);
  const confidenceDistribution = distribution(inferences, (row) => row.confidence_level);
  const dailySeries = seriesRows(recentCases, "daily");
  const weeklySeries = seriesRows(recentCases, "weekly");
  const monthlySeries = seriesRows(recentCases, "monthly");
  const driftSignals = [...detectTemporalDrift(weeklySeries, "weekly"), ...detectTemporalDrift(monthlySeries, "monthly")];

  const events: AlgedonicEvent[] = [];
  if (!promotedManifestAligned) events.push(makeEvent(generatedAt, "critical", "Manifest drift", "El manifest activo no coincide con el reporte de conformidad promovido.", "Congelar promocion y regenerar validacion cruzada.", "S2", { activeHash: manifestMetadata.content_hash, conformanceHash: conformanceReport?.manifest?.hash ?? null }));
  if (conformanceReport?.status === "failed") events.push(makeEvent(generatedAt, "critical", "Contract validation failed", "validate-platform-against-manifest reporto fallas contractuales.", "Corregir renderer, branching o persistencia segun reporte.", "S2", { failures: conformanceReport.failures?.length ?? 0 }));
  if (observabilityReport?.status === "failed") events.push(makeEvent(generatedAt, "critical", "Runtime observability audit failed", "El auditor runtime encontro drift critico post-baseline.", "Abrir incidente operativo y revisar escenas auditadas.", "S3*", { anomalies: observabilityReport.anomalies?.length ?? 0 }));
  if ((bundleRatio ?? 1) < thresholds.bundleCompletenessMinimum) events.push(makeEvent(generatedAt, "major", "Bundle completeness below threshold", "Menos del 95% de escenas recientes tiene los tres bundles.", "Investigar scene_answer_bundles y preclasificacion ligera.", "S3", { ratio: bundleRatio }));
  if ((block7Ratio ?? 1) < thresholds.block7CompletenessMinimum) events.push(makeEvent(generatedAt, "major", "Block 7 incomplete", "Menos del 95% de escenas recientes tiene Bloque 7 completo.", "Revisar runner, branching y guardado de 7.0a/7.3a.", "S3", { ratio: block7Ratio }));
  if ((outputRatio ?? 1) < thresholds.intermediateOutputMinimum) events.push(makeEvent(generatedAt, "major", "Intermediate output coverage low", "Menos del 95% de sesiones recientes tiene salida intermedia.", "Confirmar cierre y generacion de session_intermediate_output.", "S3", { ratio: outputRatio }));
  if ((provenanceRatio ?? 1) < thresholds.provenancePresenceMinimum) events.push(makeEvent(generatedAt, "major", "Provenance coverage low", "Menos del 95% de escenas conserva provenance_chain.", "Revisar scene-repository y evitar consolidacion sin traza.", "S3", { ratio: provenanceRatio }));
  if (invalidConfidenceCount > 0) events.push(makeEvent(generatedAt, "critical", "Invalid confidence score", "Hay escenas con confidence_score ausente o fuera de 0-100.", "Bloquear promocion y corregir confidence sin mezclar readiness.", "S3", { invalidConfidenceCount }));
  if (localCatalogActiveReferences >= thresholds.localCatalogActiveReferencesCritical || legacyCatalogFilesPresent > 0) events.push(makeEvent(generatedAt, "critical", "Local canon reference active", "Codigo fuente activo o archivo runtime legacy sigue presente en src/rules.", "Eliminar la referencia activa y restaurar consumo estricto del manifest.", "S2", { localCatalogActiveReferences, legacyCatalogFilesPresent }));
  if (overMicroconfirmationScenes > 0) events.push(makeEvent(generatedAt, "critical", "Microconfirmation cap breached", "Al menos una escena excede el maximo contractual de microconfirmaciones.", "Revisar gating de Bloque 7 y limitar variedad interactiva.", "S3", { overMicroconfirmationScenes }));
  if (microconfirmationAverage > thresholds.maxMicroconfirmationsAverage) events.push(makeEvent(generatedAt, "major", "Microconfirmation average high", "El promedio de microconfirmaciones supera el maximo.", "Revisar si Bloque 7 compensa falta de evidencia upstream.", "S4", { microconfirmationAverage }));
  if ((notDiagnosticRatio ?? 1) < thresholds.notDiagnosticBundleMinimum) events.push(makeEvent(generatedAt, "critical", "Diagnostic boundary breach", "No todos los bundles mantienen not_diagnostic.", "Detener salida a Capa 2 hasta confirmar frontera semantica.", "S5", { ratio: notDiagnosticRatio }));
  if (structuralAnomalyCount >= thresholds.criticalStructuralAnomalyCount) events.push(makeEvent(generatedAt, "major", "Structural anomalies present", "Casos recientes contienen anomalias estructurales.", "Priorizar escenas marcadas en S1 y auditar muestra en S3*.", "S3*", { structuralAnomalyCount }));
  for (const signal of driftSignals.filter((item) => item.direction !== "stable")) {
    events.push(makeEvent(generatedAt, signal.severity, `Temporal drift: ${signal.metric}`, signal.detail, signal.actionRequired, "S4", { cadence: signal.cadence, metric: signal.metric }));
  }

  const s1 = panel("S1", "Operacion primaria runtime", "Escenas y sesiones vivas que ejecutan Capa 1 v2.1 desde el manifest promovido.", events, [
    { label: "Sesiones post-baseline", value: sessionIds.length },
    { label: "Escenas post-baseline", value: recentCases.length },
    { label: "Salidas intermedias", value: formatPct(outputRatio), status: (outputRatio ?? 1) >= 0.95 ? "green" : "amber" },
    { label: "Bundles completos", value: formatPct(bundleRatio), status: (bundleRatio ?? 1) >= 0.95 ? "green" : "amber" },
    { label: "Bloque 7 completo", value: formatPct(block7Ratio), status: (block7Ratio ?? 1) >= 0.95 ? "green" : "amber" },
    { label: "7.0a presente", value: formatPct(block70aRatio) },
    { label: "7.3a presente", value: formatPct(block73aRatio) },
    { label: "Provenance presente", value: formatPct(provenanceRatio) },
    { label: "Consolidated value presente", value: formatPct(consolidatedRatio) },
    { label: "Microconfirmaciones promedio", value: microconfirmationAverage },
    { label: "Confidence promedio", value: average(confidenceScores) ?? "n/a" },
    { label: "Anomalias estructurales", value: structuralAnomalyCount, status: structuralAnomalyCount ? "amber" : "green" },
  ], ["Readiness: " + distributionText(readinessDistribution), "Confidence: " + distributionText(confidenceDistribution)], ["Corregir localmente escenas con bundles o Bloque 7 incompleto antes de escalar."]);

  const s2 = panel("S2", "Coordinacion", "Alinea unidades runtime contra el mismo manifest, contrato y baseline operativo.", events, [
    { label: "Manifest activo", value: manifestMetadata.manifest_version, detail: manifestMetadata.content_hash.slice(0, 12) },
    { label: "Runtime esperado", value: manifestMetadata.expected_platform_runtime_version },
    { label: "Runtime activo", value: PLATFORM_RUNTIME_VERSION, status: loaderStrict ? "green" : "red" },
    { label: "Conformidad contrato", value: conformanceReport?.status ?? "sin reporte", status: conformanceReport?.status === "failed" ? "red" : "green" },
    { label: "Auditoria observabilidad", value: observabilityReport?.status ?? "sin reporte", status: observabilityReport?.status === "failed" ? "red" : "green" },
    { label: "Manifest promovido alineado", value: promotedManifestAligned ? "si" : "no", status: promotedManifestAligned ? "green" : "red" },
    { label: "Loader estricto", value: loaderStrict ? "si" : "no", status: loaderStrict ? "green" : "red" },
    { label: "Schema validation", value: String(platformConsumptionContract.contract_id ?? "contract_loaded"), status: "green" },
    { label: "Referencias activas a catalogo local", value: localCatalogActiveReferences, status: localCatalogActiveReferences ? "red" : "green" },
    { label: "Catalogo legacy en src/rules", value: legacyCatalogFilesPresent, status: legacyCatalogFilesPresent ? "red" : "green" },
    { label: "Legacy archivado", value: retiredLegacyCatalogPresent ? "si" : "no", status: retiredLegacyCatalogPresent ? "green" : "amber" },
    { label: "Baseline activo", value: since },
  ], [retiredLegacyCatalogPresent ? "Catalogo v2.1 legacy retirado a archive/legacy-runtime; no es fuente runtime." : "Falta archivo archivado de retiro controlado."], ["Reejecutar validacion cruzada y guardia anti-legacy tras cambios de manifest, loader o renderer."]);

  const s3 = panel("S3", "Control interno", "Controla el presente: cumplimiento contractual, persistencia, invariantes y acciones tacticas.", events, [
    { label: "Persistencia contractual", value: formatPct(provenanceRatio), detail: "provenance_chain" },
    { label: "Separacion readiness/confidence", value: invalidConfidenceCount === 0 ? "preservada" : "riesgo", status: invalidConfidenceCount === 0 ? "green" : "red" },
    { label: "Bundles completos", value: formatPct(bundleRatio) },
    { label: "Salida intermedia correcta", value: formatPct(outputRatio) },
    { label: "not_diagnostic mantenido", value: formatPct(notDiagnosticRatio), status: (notDiagnosticRatio ?? 1) === 1 ? "green" : "red" },
    { label: "Question code completo", value: localCatalogActiveReferences === 0 ? "sin truncamiento activo detectado" : "revisar" },
    { label: "Escenas recuperables", value: recentCases.filter((item) => item.anomalyCount > 0).length },
  ], ["original_answer, clarification_answer, consolidated_value y provenance_chain se evalan como entidades separadas.", "evidence_bundle_for_transduction se trata como evidencia intermedia, no como Capa 2."], ["Investigar bundles incompletos si caen bajo 95%.", "Revisar persistencia si provenance cae bajo 95%.", "Freeze de promocion si aparece drift contractual.", "Abrir incidente si Bloque 7 incompleto supera umbral."]);

  const s3star = panel("S3*", "Auditoria independiente", "Muestreo e inspeccion directa para detectar drift que los promedios pueden ocultar.", events, [
    { label: "Ultima auditoria", value: observabilityReport?.checkedAt ?? "sin reporte" },
    { label: "Universo auditado", value: observabilityReport?.scope?.sceneCount ?? 0, detail: "escenas" },
    { label: "Anomalias criticas", value: observabilityReport?.anomalies?.filter((item) => item.severity === "critical").length ?? 0 },
    { label: "Anomalias mayores/menores", value: observabilityReport?.anomalies?.filter((item) => item.severity !== "critical").length ?? 0 },
    { label: "Escenas con microconfirmaciones", value: recentCases.filter((item) => item.microconfirmations > 0).length },
    { label: "Confidence inusual", value: invalidConfidenceCount },
  ], ["La auditoria CLI sigue separada del control cotidiano S3.", "El muestreo revisa bundles, confidence, readiness y frontera consolidated_output != Capa 2."], ["Auditar manualmente casos recientes marcados antes de promocionar cambios."]);

  const latestWeekly = weeklySeries.at(-1);
  const latestMonthly = monthlySeries.at(-1);
  const s4 = panel("S4", "Inteligencia y adaptacion", "Convierte comportamiento observado en anticipacion: tendencias, riesgos emergentes y revisiones.", events, [
    { label: "Semana actual bundles", value: latestWeekly ? formatPct(latestWeekly.bundleCompletenessRatio) : "n/a" },
    { label: "Semana actual Bloque 7", value: latestWeekly ? formatPct(latestWeekly.block7CompletenessRatio) : "n/a" },
    { label: "Mes actual bundles", value: latestMonthly ? formatPct(latestMonthly.bundleCompletenessRatio) : "n/a" },
    { label: "Mes actual confidence mediana", value: latestMonthly?.confidenceScoreMedian ?? "n/a" },
    { label: "Senales de deriva", value: driftSignals.filter((item) => item.direction !== "stable").length },
    { label: "Manifest releases comparables", value: new Set(recentCases.map((item) => item.manifestVersion)).size, detail: manifestMetadata.manifest_version },
  ], driftSignals.map((item) => `${item.cadence}: ${item.detail}`), ["Comparar comportamiento semanal y mensual antes de promocionar nuevos manifests.", "Revisar umbrales si el volumen real crece."]);

  const s5 = panel("S5", "Politica e identidad", "Mantiene invariantes no negociables y decide freeze, rollback o promocion.", events, [
    { label: "Politica promocion/rollback", value: fileExists("docs/runtime-manifest-promotion-policy.md") ? "presente" : "pendiente" },
    { label: "Release ledger", value: fileExists("docs/runtime-manifest-release-ledger.md") ? "presente" : "pendiente" },
    { label: "Manifest promovido", value: manifestMetadata.manifest_version },
    { label: "Baseline operativo", value: since },
    { label: "Compatibilidad exigida", value: manifestMetadata.expected_platform_runtime_version },
  ], ["bundle != readiness", "readiness != confidence", "confidence != clasificacion", "evidence_bundle_for_transduction != Capa 2", "consolidated_output != Capa 2"], ["Rollback si drift critico queda confirmado por S3*.", "Freeze si la conformidad contractual falla.", "Promocion solo con manifest, contrato, E2E y auditoria post-baseline en verde."]);

  const structuralFailureMap = [
    { failure: "La plataforma vuelve a inventar canon localmente.", primaryView: "S2" as VsmSystemId, indicator: "Guardia anti-legacy, referencias activas a catalogos locales y drift de manifest.", alert: "Local canon reference active", suggestedAction: "Eliminar referencia y restaurar loader estricto.", severityRule: "critico si referencias activas > 0 o si src/rules/question-catalog-v2-1.json reaparece" },
    { failure: "Una correccion canonica no llega al runtime.", primaryView: "S2" as VsmSystemId, indicator: "Manifest promovido alineado por version y content_hash.", alert: "Manifest drift", suggestedAction: "Regenerar snapshot y validacion cruzada.", severityRule: "critico ante mismatch de hash/version" },
    { failure: "readiness, confidence, bundles o Bloque 7 colapsan silenciosamente.", primaryView: "S3" as VsmSystemId, indicator: "Separacion readiness/confidence, bundles completos, Bloque 7 completo.", alert: "Block 7 incomplete / Invalid confidence score / Bundle completeness below threshold", suggestedAction: "Corregir persistencia o branching segun area afectada.", severityRule: "critico si confidence fuera de escala; mayor si cobertura <95%" },
    { failure: "La UI funciona pero produce expedientes semanticos incorrectos.", primaryView: "S3*" as VsmSystemId, indicator: "Auditoria independiente y muestreo de escenas recientes.", alert: "Runtime observability audit failed", suggestedAction: "Inspeccionar casos auditados y congelar promocion si se confirma drift.", severityRule: "critico si auditor falla" },
    { failure: "El equipo se entera tarde de sesiones contaminadas.", primaryView: "S4" as VsmSystemId, indicator: "Series semanales/mensuales y canal algedonico de deriva.", alert: "Temporal drift", suggestedAction: "Investigar deterioro sostenido antes de que cruce umbrales puntuales.", severityRule: "mayor si 2 periodos consecutivos deterioran metricas clave" },
  ];

  const transducers: VsmTransducer[] = [
    { name: "runtime manifest compilado", usedBy: ["S2", "S3", "S5"], varietyRole: "Transmite canon cerrado como artefacto runtime unico.", detectsOrPrevents: "Previene reconstruccion local y drift de version." },
    { name: "platform consumption contract", usedBy: ["S2", "S3", "S5"], varietyRole: "Reduce ambiguedad sobre renderer, branching y persistencia.", detectsOrPrevents: "Detecta colapso de readiness, confidence, bundles y provenance." },
    { name: "manifest loader estricto", usedBy: ["S2", "S3"], varietyRole: "Convierte manifest en runtime consumible sin interpretacion libre.", detectsOrPrevents: "Previene compatibilidad falsa entre manifest y plataforma." },
    { name: "guardia anti-catalogo legacy", usedBy: ["S2", "S5"], varietyRole: "Impide que el catalogo local v2.1 vuelva a la ruta runtime activa.", detectsOrPrevents: "Previene reactivacion accidental de interpretacion local del canon." },
    { name: "validate-platform-against-manifest", usedBy: ["S2", "S3*"], varietyRole: "Compara codigo/plataforma con contrato promovido.", detectsOrPrevents: "Detecta drift antes de operacion real." },
    { name: "runtime-observability-audit", usedBy: ["S3*", "S4"], varietyRole: "Muestrea comportamiento vivo post-baseline.", detectsOrPrevents: "Detecta autoengano operativo y drift semantico silencioso." },
    { name: "endpoint de observabilidad", usedBy: ["S1", "S3", "S4"], varietyRole: "Agrega sesiones reales sin mezclar historico pre-remediacion.", detectsOrPrevents: "Hace visible degradacion operacional temprana." },
    { name: "series temporales VSM", usedBy: ["S4", "S5"], varietyRole: "Retiene memoria semanal y mensual de comportamiento runtime.", detectsOrPrevents: "Detecta deriva lenta antes de fallas rojas puntuales." },
    { name: "release ledger", usedBy: ["S2", "S5"], varietyRole: "Registra que version fue promovida y con que evidencia.", detectsOrPrevents: "Previene promociones ambiguas o rollback sin referencia." },
    { name: "promotion policy", usedBy: ["S3", "S5"], varietyRole: "Define criterios de promocion, freeze y rollback.", detectsOrPrevents: "Evita sacrificar fidelidad por velocidad." },
    { name: "runtime session repository", usedBy: ["S1", "S3", "S3*"], varietyRole: "Persistencia estructurada de respuestas, provenance, states y bundles.", detectsOrPrevents: "Detecta expedientes semanticamente incompletos." },
    { name: "baseline temporal post-remediacion", usedBy: ["S1", "S3*", "S4", "S5"], varietyRole: "Separa operacion gobernada de historico anterior.", detectsOrPrevents: "Previene falsos fallos por datos pre-contrato." },
  ];

  const status = statusFromEvents(events);
  return {
    status,
    generatedAt,
    baselineSince: since,
    scope: { recentSceneLimit: limit, sceneCount: recentCases.length, sessionCount: sessionIds.length },
    manifest: {
      version: manifestMetadata.manifest_version,
      contentHash: manifestMetadata.content_hash,
      sourceCommit: manifestMetadata.source_commit,
      workspaceState: manifestMetadata.workspace_state,
      expectedPlatformRuntimeVersion: manifestMetadata.expected_platform_runtime_version,
      activePlatformRuntimeVersion: PLATFORM_RUNTIME_VERSION,
    },
    coordination: {
      conformanceStatus: conformanceReport?.status ?? "missing",
      observabilityAuditStatus: observabilityReport?.status ?? "missing",
      promotedManifestAligned,
      loaderStrict,
      schemaValidation: String(platformConsumptionContract.contract_id ?? "contract_loaded"),
      baselineActive: since,
      localCatalogActiveReferences,
      legacyCatalogFilesPresent,
      retiredLegacyCatalogPresent,
    },
    s1,
    s2,
    s3,
    s3star,
    s4,
    s5,
    algedonic: { status, events },
    transducers,
    structuralFailureMap,
    recentCases,
    trends: { byDay: dailySeries, weekly: weeklySeries, monthly: monthlySeries, driftSignals },
  };
}

export { thresholds };
