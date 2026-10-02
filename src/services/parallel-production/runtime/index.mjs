import { buildMmabpDesignSourceBundle } from "@/services/parallel-production-design-source-bundle";
import { resolveParallelInventory } from "./inventory-resolve.mjs";
import { projectParallelMmabpIr } from "./mmabp-ir-project.mjs";
import { runParallelAssessment } from "./assessment-run.mjs";
import { generateParallelCandidateExport } from "./candidate-export-generate.mjs";
import {
  PARALLEL_ARTIFACT_TYPES,
  PARALLEL_SOURCE_STEPS,
  PARALLEL_RUNTIME_ADAPTER,
  buildRunMetadata,
  toCaseAndSession,
} from "./shared.mjs";
import {
  persistParallelRuntimeArtifact,
  readLatestParallelRuntimeArtifact,
} from "./repository.mjs";

const storageToRuntime = (stored) => {
  if (!stored) return null;
  const payload = stored.payload ?? {};
  return {
    artifact_id: stored.artifact_id,
    artifact_type: stored.artifact_type,
    artifact_status: stored.artifact_status,
    warnings: stored.warnings ?? [],
    gaps: stored.gaps ?? [],
    ...payload,
    ...(payload.package_json ? { candidate_export_package: payload.package_json } : {}),
  };
};

async function loadBundleFromInput({ sessionId, designSourceBundle, designSourceBundleId }) {
  if (designSourceBundle) return designSourceBundle;
  if (designSourceBundleId) {
    const found = await readLatestParallelRuntimeArtifact({
      sessionId,
      artifactType: PARALLEL_ARTIFACT_TYPES.DESIGN_SOURCE_BUNDLE,
    });
    if (found.artifact?.artifact_id === designSourceBundleId) {
      return found.artifact.payload?.bundle ?? null;
    }
  }
  const generated = await buildMmabpDesignSourceBundle({ sessionId });
  return generated.bundle;
}

export async function runInventoryResolve(input) {
  const { sessionId, caseId } = toCaseAndSession(input);
  const bundle = await loadBundleFromInput({
    sessionId,
    designSourceBundle: input.design_source_bundle ?? input.designSourceBundle,
    designSourceBundleId: input.design_source_bundle_id ?? input.designSourceBundleId,
  });

  const result = resolveParallelInventory({
    ...input,
    session_id: sessionId,
    case_id: caseId,
    designSourceBundle: bundle,
  });
  const persistence = await persistParallelRuntimeArtifact(result.artifact);
  return { ...result, persistence };
}

export async function persistDesignSourceBundleRuntime(input = {}) {
  const {
    session_id,
    sessionId,
    case_id,
    caseId,
    correlation_id,
    run_id,
    bundle,
  } = input;
  const { sessionId: resolvedSessionId, caseId: resolvedCaseId } = toCaseAndSession({
    session_id,
    sessionId,
    case_id,
    caseId,
  });
  const metadata = buildRunMetadata(
    {
      session_id: resolvedSessionId,
      case_id: resolvedCaseId,
      correlation_id,
      run_id,
    },
    PARALLEL_SOURCE_STEPS.DESIGN_SOURCE,
  );
  const artifact = {
    artifact_id: bundle?.bundle_id ?? `DSB_${resolvedSessionId}_${metadata.run_id}`,
    artifact_type: PARALLEL_ARTIFACT_TYPES.DESIGN_SOURCE_BUNDLE,
    artifact_status: bundle?.design_source_readiness?.status ?? "partial_design_source",
    source_artifact_id: null,
    ...metadata,
    source_adapter: PARALLEL_RUNTIME_ADAPTER,
    warnings: [],
    gaps: bundle?.gaps ?? [],
    payload: {
      bundle,
      refs: { bundle_id: bundle?.bundle_id ?? null },
      statuses: {
        design_source_readiness: bundle?.design_source_readiness?.status ?? null,
      },
    },
  };
  const persistence = await persistParallelRuntimeArtifact(artifact);
  return { artifact, persistence };
}

export async function runMmabpIrProject(input) {
  const { sessionId, caseId } = toCaseAndSession(input);
  const incomingInventory = input.inventory ?? input.InventarioMMABP ?? null;
  const fallback = incomingInventory
    ? null
    : await readLatestParallelRuntimeArtifact({
        sessionId,
        artifactType: PARALLEL_ARTIFACT_TYPES.INVENTORY,
      });
  const inventory = incomingInventory ?? storageToRuntime(fallback?.artifact);
  if (!inventory) throw new Error("No inventory artifact was found for MMABP-IR projection.");

  const result = projectParallelMmabpIr({
    ...input,
    session_id: sessionId,
    case_id: caseId,
    inventory,
  });
  const persistence = await persistParallelRuntimeArtifact(result.artifact);
  return { ...result, persistence };
}

export async function runAssessment(input) {
  const { sessionId, caseId } = toCaseAndSession(input);
  const incomingIr = input.mmabp_ir ?? input.MMABPIR ?? null;
  const fallback = incomingIr
    ? null
    : await readLatestParallelRuntimeArtifact({
        sessionId,
        artifactType: PARALLEL_ARTIFACT_TYPES.MMABP_IR,
      });
  const mmabpIr = incomingIr ?? storageToRuntime(fallback?.artifact);
  if (!mmabpIr) throw new Error("No MMABP-IR artifact was found for assessment.");

  const result = runParallelAssessment({
    ...input,
    session_id: sessionId,
    case_id: caseId,
    mmabpIr,
  });
  const persistence = await persistParallelRuntimeArtifact(result.artifact);
  return { ...result, persistence };
}

export async function runCandidateExport(input) {
  const { sessionId, caseId } = toCaseAndSession(input);
  const incomingAssessment =
    input.architecture_consistency_assessment ??
    input.ArchitectureConsistencyAssessment ??
    null;
  const fallback = incomingAssessment
    ? null
    : await readLatestParallelRuntimeArtifact({
        sessionId,
        artifactType: PARALLEL_ARTIFACT_TYPES.ASSESSMENT,
      });
  const assessment = incomingAssessment ?? storageToRuntime(fallback?.artifact);
  if (!assessment) throw new Error("No assessment artifact was found for candidate export.");

  const result = generateParallelCandidateExport({
    ...input,
    session_id: sessionId,
    case_id: caseId,
    assessment,
    allow_export_promotion: false,
  });
  const persistence = await persistParallelRuntimeArtifact(result.artifact);
  return { ...result, persistence };
}

export const PARALLEL_RUNTIME_FLOW = Object.freeze({
  inventory: PARALLEL_SOURCE_STEPS.INVENTORY_RESOLVE,
  mmabp_ir: PARALLEL_SOURCE_STEPS.MMABP_IR_PROJECT,
  assessment: PARALLEL_SOURCE_STEPS.ASSESSMENT_RUN,
  candidate_export: PARALLEL_SOURCE_STEPS.CANDIDATE_EXPORT_GENERATE,
});
