import {
  PARALLEL_ARTIFACT_TYPES,
  PARALLEL_SOURCE_STEPS,
  buildRunMetadata,
  compactGaps,
  compactRuntimePayload,
  compactWarnings,
  ensureShadowMode,
  safeHash,
  unique,
} from "./shared.mjs";

const resolveCandidateStatus = ({ assessmentStatus, warnings, gaps }) => {
  if (assessmentStatus === "Blocked") return "blocked";
  if (assessmentStatus === "WithFindings") return "ready_with_warnings";
  if (warnings.length || gaps.length) return "ready_with_warnings";
  return "candidate_ready";
};

export function generateParallelCandidateExport({
  session_id,
  sessionId,
  case_id,
  caseId,
  correlation_id,
  run_id,
  mode,
  assessment,
  allow_export_promotion,
  syntax_validation_passed,
}) {
  const metadata = buildRunMetadata(
    { session_id, sessionId, case_id, caseId, correlation_id, run_id },
    PARALLEL_SOURCE_STEPS.CANDIDATE_EXPORT_GENERATE,
  );
  const operatingMode = ensureShadowMode(mode);
  if (!assessment) {
    throw new Error("Missing assessment artifact for candidate export generation.");
  }

  const assessmentStatus =
    assessment.assessment_status ??
    assessment.payload?.assessment_status ??
    assessment.artifact_status ??
    "WithFindings";
  const warnings = compactWarnings(
    assessment.warnings ??
      assessment.payload?.conformance_warnings ??
      assessment.payload?.consistency_warnings,
  );
  const gaps = compactGaps(assessment.gaps);
  const candidateStatus = resolveCandidateStatus({ assessmentStatus, warnings, gaps });
  const promotionEnabled = allow_export_promotion === true;
  const syntaxPassed = syntax_validation_passed === true;

  const packageId = `CEXP_${assessment.assessment_id ?? assessment.artifact_id ?? metadata.session_id}_${metadata.run_id}`;
  const packageJson = {
    candidate_export_package_id: packageId,
    package_type: "candidate_export_package",
    source_assessment_id: assessment.assessment_id ?? assessment.artifact_id ?? null,
    generation_mode: "candidate",
    export_readiness: candidateStatus,
    warnings,
    gaps,
    boundaries: {
      candidate_only: true,
      does_not_modify_capa2_readiness: true,
      does_not_modify_evidencebundle_readiness: true,
      not_export_code_package_generated: true,
    },
  };

  const blockedPromotionReasons = [];
  if (!promotionEnabled) blockedPromotionReasons.push("allow_export_promotion=false");
  if (assessmentStatus !== "Satisfied")
    blockedPromotionReasons.push("ArchitectureConsistencyAssessment not satisfied");
  if (!syntaxPassed) blockedPromotionReasons.push("syntax_validation_passed=false");

  const payload = compactRuntimePayload({
    refs: {
      assessment_id: assessment.assessment_id ?? assessment.artifact_id ?? null,
    },
    counts: {
      warnings: warnings.length,
      gaps: gaps.length,
    },
    statuses: {
      candidate_export_status: candidateStatus,
      allow_export_promotion: promotionEnabled,
      syntax_validation_passed: syntaxPassed,
    },
    hashes: {
      assessment_hash: safeHash(assessment),
      candidate_hash: safeHash(packageJson),
    },
    boundaries: {
      export_code_package_generated: false,
      promotion_blocked_reasons: blockedPromotionReasons,
      shadow_mode_only: operatingMode === "shadow",
    },
  });

  const artifact = {
    artifact_id: packageId,
    artifact_type: PARALLEL_ARTIFACT_TYPES.CANDIDATE_EXPORT,
    artifact_status: candidateStatus,
    source_artifact_id: assessment.assessment_id ?? assessment.artifact_id ?? null,
    ...metadata,
    warnings: unique(
      warnings.concat(
        blockedPromotionReasons.length ? ["CANDIDATE_EXPORT_NOT_PROMOTED"] : [],
      ),
    ),
    gaps,
    payload: {
      ...payload,
      package_json: packageJson,
      blocked_promotion_reasons: blockedPromotionReasons,
    },
  };

  return {
    mode: operatingMode,
    candidate_export_package: packageJson,
    candidate_export_status: candidateStatus,
    allow_export_promotion: promotionEnabled,
    syntax_validation_passed: syntaxPassed,
    export_code_package_generated: false,
    blocked_promotion_reasons: blockedPromotionReasons,
    boundaries: payload.boundaries,
    artifact,
  };
}
