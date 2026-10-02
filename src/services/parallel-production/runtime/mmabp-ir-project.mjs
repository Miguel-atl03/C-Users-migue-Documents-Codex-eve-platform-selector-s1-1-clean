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

const buildRegistryCandidate = (quadrant, facts) => ({
  quadrant,
  candidate_count: facts.length,
  fact_ids: facts.map((fact) => fact.fact_id),
});

export function projectParallelMmabpIr({
  session_id,
  sessionId,
  case_id,
  caseId,
  correlation_id,
  run_id,
  mode,
  inventory,
}) {
  const metadata = buildRunMetadata(
    { session_id, sessionId, case_id, caseId, correlation_id, run_id },
    PARALLEL_SOURCE_STEPS.MMABP_IR_PROJECT,
  );
  const operatingMode = ensureShadowMode(mode);
  if (!inventory) {
    throw new Error("Missing inventory artifact for MMABP-IR projection.");
  }

  const facts = asArray(inventory.structural_facts ?? inventory.payload?.structural_facts);
  const warnings = compactWarnings(inventory.semantic_warnings ?? inventory.warnings);
  const gaps = compactGaps(inventory.gaps);
  const grouped = {
    PM: facts.filter((fact) => asArray(fact.quadrant_targets).includes("PM")),
    PF: facts.filter((fact) => asArray(fact.quadrant_targets).includes("PF")),
    MoC: facts.filter((fact) => asArray(fact.quadrant_targets).includes("MoC")),
    OLC: facts.filter((fact) => asArray(fact.quadrant_targets).includes("OLC")),
  };

  const models = {
    PM: buildRegistryCandidate("PM", grouped.PM),
    PF: buildRegistryCandidate("PF", grouped.PF),
    MoC: buildRegistryCandidate("MoC", grouped.MoC),
    OLC: buildRegistryCandidate("OLC", grouped.OLC),
  };

  const irWarnings = unique(
    warnings.concat(
      Object.entries(models)
        .filter(([, value]) => value.candidate_count === 0)
        .map(([quadrant]) => `IR_WARN_MISSING_${quadrant}`),
    ),
  );

  const status = irWarnings.length || gaps.length ? "ProjectedWithWarnings" : "Projected";
  const irId = `IR_${inventory.inventory_id ?? metadata.session_id}_${metadata.run_id}`;

  const payload = compactRuntimePayload({
    refs: {
      inventory_id: inventory.inventory_id ?? inventory.artifact_id ?? null,
    },
    counts: {
      facts: facts.length,
      model_count: Object.keys(models).length,
      warnings: irWarnings.length,
      gaps: gaps.length,
    },
    statuses: {
      runtime_status: status,
      mba_object_state: "IRProjected",
    },
    hashes: {
      inventory_hash: safeHash(inventory),
      models_hash: safeHash(models),
    },
    boundaries: {
      does_not_modify_evidencebundle_readiness: true,
      does_not_modify_capa2_readiness: true,
      shadow_mode_only: operatingMode === "shadow",
    },
  });

  const artifact = {
    artifact_id: irId,
    artifact_type: PARALLEL_ARTIFACT_TYPES.MMABP_IR,
    artifact_status: status,
    source_artifact_id: inventory.inventory_id ?? inventory.artifact_id ?? null,
    ...metadata,
    warnings: irWarnings,
    gaps,
    payload: {
      ...payload,
      models,
      facts_reference_count: facts.length,
    },
  };

  return {
    mode: operatingMode,
    mmabp_ir_id: irId,
    ir_status: status,
    registry_candidates: models,
    ir_warnings: irWarnings,
    gaps,
    boundaries: payload.boundaries,
    artifact,
  };
}
