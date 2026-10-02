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
} from "./shared.mjs";

const mapCandidateToFact = (candidate, index) => ({
  fact_id: `FACT_${index + 1}_${candidate.candidate_id ?? "NA"}`,
  canonical_label: candidate.canonical_label ?? "candidate_without_label",
  candidate_type: candidate.candidate_type ?? "attribute",
  quadrant_targets: asArray(candidate.quadrant_targets),
  source_candidate_ids: asArray(candidate.candidate_id),
  source_evidence_ids: asArray(candidate.source_evidence_ids),
  source_scene_ids: asArray(candidate.source_scene_ids),
  confidence: Number(candidate.confidence ?? 0),
  projection_status: candidate.projection_status ?? "candidate",
});

export function resolveParallelInventory({
  session_id,
  sessionId,
  case_id,
  caseId,
  correlation_id,
  run_id,
  mode,
  designSourceBundle,
}) {
  const metadata = buildRunMetadata(
    { session_id, sessionId, case_id, caseId, correlation_id, run_id },
    PARALLEL_SOURCE_STEPS.INVENTORY_RESOLVE,
  );
  const operatingMode = ensureShadowMode(mode);
  const bundle = designSourceBundle ?? null;
  if (!bundle) {
    throw new Error("Missing design source bundle for inventory resolve.");
  }

  const structuralFacts = asArray(bundle.quadrant_candidates).map(mapCandidateToFact);
  const semanticWarnings = compactWarnings(bundle.flags);
  const gaps = compactGaps(bundle.gaps);
  const status = semanticWarnings.length || gaps.length ? "ResolvedWithWarnings" : "Resolved";
  const inventoryId = `INV_${bundle.bundle_id ?? metadata.session_id}_${metadata.run_id}`;

  const payload = compactRuntimePayload({
    refs: {
      design_source_bundle_id: bundle.bundle_id ?? null,
    },
    counts: {
      structural_facts: structuralFacts.length,
      warnings: semanticWarnings.length,
      gaps: gaps.length,
    },
    statuses: {
      runtime_status: status,
      mba_object_state: "FactsConsolidated",
    },
    hashes: {
      bundle_hash: safeHash(bundle),
      facts_hash: safeHash(structuralFacts),
    },
    boundaries: {
      does_not_modify_evidencebundle_readiness: true,
      does_not_modify_capa2_readiness: true,
      shadow_mode_only: operatingMode === "shadow",
    },
  });

  const artifact = {
    artifact_id: inventoryId,
    artifact_type: PARALLEL_ARTIFACT_TYPES.INVENTORY,
    artifact_status: status,
    source_artifact_id: bundle.bundle_id ?? null,
    ...metadata,
    warnings: semanticWarnings,
    gaps,
    payload: {
      ...payload,
      structural_facts: structuralFacts,
    },
  };

  return {
    mode: operatingMode,
    inventory_id: inventoryId,
    inventory_status: status,
    structural_facts: structuralFacts,
    structural_facts_count: structuralFacts.length,
    semantic_warnings: semanticWarnings,
    gaps,
    boundaries: payload.boundaries,
    artifact,
  };
}
