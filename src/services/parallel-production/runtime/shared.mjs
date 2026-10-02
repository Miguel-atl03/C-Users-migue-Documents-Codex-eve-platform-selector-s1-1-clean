import { randomUUID, createHash } from "node:crypto";

export const PARALLEL_RUNTIME_ADAPTER = "parallel_production_runtime";

export const PARALLEL_ARTIFACT_TYPES = Object.freeze({
  DESIGN_SOURCE_BUNDLE: "mmabp_design_source_bundle",
  INVENTORY: "InventarioMMABP",
  MMABP_IR: "MMABPIR",
  ASSESSMENT: "ArchitectureConsistencyAssessment",
  CANDIDATE_EXPORT: "candidate_export_package",
});

export const PARALLEL_SOURCE_STEPS = Object.freeze({
  DESIGN_SOURCE: "design_source_bundle",
  INVENTORY_RESOLVE: "inventory_resolve",
  MMABP_IR_PROJECT: "mmabp_ir_project",
  ASSESSMENT_RUN: "assessment_run",
  CANDIDATE_EXPORT_GENERATE: "candidate_export_generate",
});

export const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export const unique = (values) => [...new Set(asArray(values).filter(Boolean))];

export const toCaseAndSession = (input = {}) => {
  const sessionId = input.session_id ?? input.sessionId ?? null;
  const caseId = input.case_id ?? input.caseId ?? sessionId ?? null;
  return { sessionId, caseId };
};

export const toCorrelationId = (input = {}, { caseId, sessionId } = {}) =>
  input.correlation_id ?? input.correlationId ?? caseId ?? sessionId ?? null;

export const nowIso = () => new Date().toISOString();

export const safeHash = (value) =>
  createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value ?? {})).digest("hex");

export const compactWarnings = (warnings) =>
  unique(asArray(warnings).map((warning) => (typeof warning === "string" ? warning : warning?.code ?? warning?.message)));

export const compactGaps = (gaps) =>
  unique(asArray(gaps).map((gap) => (typeof gap === "string" ? gap : gap?.gap_id ?? gap?.code ?? gap?.id)));

export const buildRunMetadata = (input = {}, sourceStep) => {
  const { sessionId, caseId } = toCaseAndSession(input);
  const correlationId = toCorrelationId(input, { caseId, sessionId });
  const runId = input.run_id ?? input.runId ?? randomUUID();
  const createdAt = input.created_at ?? input.createdAt ?? nowIso();

  return {
    case_id: caseId,
    session_id: sessionId,
    correlation_id: correlationId,
    run_id: runId,
    created_at: createdAt,
    source_step: sourceStep,
    source_adapter: PARALLEL_RUNTIME_ADAPTER,
  };
};

export const ensureShadowMode = (mode) => (mode === "shadow" ? "shadow" : "shadow");

export const compactRuntimePayload = (payload = {}) => ({
  refs: payload.refs ?? {},
  counts: payload.counts ?? {},
  statuses: payload.statuses ?? {},
  hashes: payload.hashes ?? {},
  boundaries: payload.boundaries ?? {},
});
