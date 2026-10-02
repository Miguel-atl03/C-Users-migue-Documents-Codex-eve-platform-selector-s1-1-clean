import {
  PARALLEL_ARTIFACT_TYPES,
  PARALLEL_SOURCE_STEPS,
  asArray,
  buildRunMetadata,
  compactGaps,
  compactRuntimePayload,
  compactWarnings,
  ensureShadowMode,
  safeHash,
  unique,
} from "./shared.mjs";

const allQuadrantsCovered = (models = {}) =>
  ["PM", "PF", "MoC", "OLC"].every(
    (quadrant) => Number(models?.[quadrant]?.candidate_count ?? 0) > 0,
  );

export function runParallelAssessment({
  session_id,
  sessionId,
  case_id,
  caseId,
  correlation_id,
  run_id,
  mode,
  mmabpIr,
}) {
  const metadata = buildRunMetadata(
    { session_id, sessionId, case_id, caseId, correlation_id, run_id },
    PARALLEL_SOURCE_STEPS.ASSESSMENT_RUN,
  );
  const operatingMode = ensureShadowMode(mode);
  if (!mmabpIr) {
    throw new Error("Missing MMABP-IR artifact for assessment.");
  }

  const models = mmabpIr.registry_candidates ?? mmabpIr.payload?.models ?? {};
  const inheritedWarnings = compactWarnings(mmabpIr.ir_warnings ?? mmabpIr.warnings);
  const inheritedGaps = compactGaps(mmabpIr.gaps);

  const conformanceWarnings = unique(
    inheritedWarnings.concat(
      allQuadrantsCovered(models) ? [] : ["ASSESSMENT_WARN_QUADRANT_COVERAGE_INCOMPLETE"],
    ),
  );
  const consistencyWarnings = unique(
    inheritedGaps.length > 0
      ? ["ASSESSMENT_WARN_OPEN_GAPS_PRESENT"]
      : [],
  );

  const hasFindings = conformanceWarnings.length > 0 || consistencyWarnings.length > 0;
  const hasBlocking = inheritedGaps.some((gap) => {
    const normalized = String(gap).toLowerCase();
    if (normalized.includes("non_blocking")) return false;
    return (
      normalized.startsWith("blocking_") ||
      normalized.startsWith("blocked_") ||
      normalized.endsWith("_blocking") ||
      normalized === "blocking"
    );
  });
  const assessmentStatus = hasBlocking
    ? "Blocked"
    : hasFindings
      ? "WithFindings"
      : "Satisfied";
  const findings = hasFindings
    ? [
        {
          rule_id: "MBA-PARALLEL-ASSESSMENT-WITH-FINDINGS",
          severity: hasBlocking ? "critical" : "warning",
          description:
            "Parallel production assessment detected findings that require rework before export promotion.",
          action: "Return to P-SUP-06 for inventory/IR/diagram review.",
          detail: `route_to=P-SUP-06; conformance_warnings=${conformanceWarnings.length}; consistency_warnings=${consistencyWarnings.length}`,
          route_to: "P-SUP-06",
        },
      ]
    : [];

  const assessmentId = `ACA_${mmabpIr.mmabp_ir_id ?? mmabpIr.artifact_id ?? metadata.session_id}_${metadata.run_id}`;
  const payload = compactRuntimePayload({
    refs: {
      mmabp_ir_id: mmabpIr.mmabp_ir_id ?? mmabpIr.artifact_id ?? null,
    },
    counts: {
      model_count: Object.keys(models).length,
      conformance_warning_count: conformanceWarnings.length,
      consistency_warning_count: consistencyWarnings.length,
      finding_count: findings.length,
    },
    statuses: {
      assessment_status: assessmentStatus,
      mba_object_state: assessmentStatus,
      explicit_satisfied_evidence: assessmentStatus === "Satisfied",
    },
    hashes: {
      mmabp_ir_hash: safeHash(mmabpIr),
      findings_hash: safeHash(findings),
    },
    boundaries: {
      rework_target: hasFindings ? "P-SUP-06" : null,
      does_not_modify_evidencebundle_readiness: true,
      does_not_modify_capa2_readiness: true,
      shadow_mode_only: operatingMode === "shadow",
    },
  });

  const artifact = {
    artifact_id: assessmentId,
    artifact_type: PARALLEL_ARTIFACT_TYPES.ASSESSMENT,
    artifact_status: assessmentStatus,
    source_artifact_id: mmabpIr.mmabp_ir_id ?? mmabpIr.artifact_id ?? null,
    ...metadata,
    warnings: unique(conformanceWarnings.concat(consistencyWarnings)),
    gaps: inheritedGaps,
    payload: {
      ...payload,
      findings,
      conformance_warnings: conformanceWarnings,
      consistency_warnings: consistencyWarnings,
      assessment_status: assessmentStatus,
    },
  };

  return {
    mode: operatingMode,
    assessment_id: assessmentId,
    assessment_status: assessmentStatus,
    findings,
    conformance_warnings: conformanceWarnings,
    consistency_warnings: consistencyWarnings,
    rework_target: hasFindings ? "P-SUP-06" : null,
    boundaries: payload.boundaries,
    artifact,
  };
}
