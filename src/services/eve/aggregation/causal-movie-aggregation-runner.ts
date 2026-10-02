import type {
  AggregationIndex,
  CausalMovieAggregationRunnerInput,
  CausalMovieAggregationRunnerResult,
  PeliculaCausalAgregada,
  SceneSet,
} from "./causal-movie-types";

import type { EscenaEvidencial } from "../transduction/evidential-scene-types";

const NO_GO: CausalMovieAggregationRunnerResult["no_go"] = {
  diagnosis_created: false,
  client_narrative_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  b7_promoted_to_diagnosis: false,
  monetizable_signal_promoted_to_final: false,
};

const MATERIALITY: CausalMovieAggregationRunnerResult["materiality"] = {
  level: "L6 service_present",
  marker_candidate: "PF_SUP_04_MATERIALITY_MARKER",
  implementation_scope: "local_pure_service_only",
};

export function runCausalMovieAggregation(
  input: CausalMovieAggregationRunnerInput,
): CausalMovieAggregationRunnerResult {
  const version = input.options?.version ?? "pf-sup-04-executable-slice-v1";
  const minimumValidatedScenes = input.options?.minimum_validated_scenes ?? 2;
  const validatedScenes = input.escenas_evidenciales.filter(
    (scene) => scene.state === "validated",
  );
  const excludedScenes = input.escenas_evidenciales.filter(
    (scene) => scene.state !== "validated",
  );
  const governanceIssueRefs = unique(
    input.escenas_evidenciales.flatMap((scene) => scene.governance_issue_refs),
  );
  const readinessDecisionRef = `LOCAL_READINESS_DECISION:${input.case_id}:PF_SUP_04`;

  if (validatedScenes.length < minimumValidatedScenes) {
    governanceIssueRefs.push("PF_SUP_04_INSUFFICIENT_SCENES");
    governanceIssueRefs.push("PF_SUP_04_REWORK_TO_PF_SUP_03_REQUIRED");

    const sceneSet = buildSceneSet({
      caseId: input.case_id,
      validatedScenes,
      excludedScenes,
      minimumValidatedScenes,
      governanceIssueRefs,
      version,
      state: "blocked_by_insufficient_scenes",
    });

    return {
      ok: false,
      scene_set: sceneSet,
      blocked_reason: "insufficient_scenes_rework_to_pf_sup_03",
      governance_issue_refs: unique(governanceIssueRefs),
      readiness_decision_ref: readinessDecisionRef,
      no_go: NO_GO,
      materiality: MATERIALITY,
    };
  }

  const sceneSet = buildSceneSet({
    caseId: input.case_id,
    validatedScenes,
    excludedScenes,
    minimumValidatedScenes,
    governanceIssueRefs,
    version,
    state: "aggregation_eligible",
  });
  const aggregationIndex = buildAggregationIndex(sceneSet, validatedScenes);
  const peliculaCausalAgregada = buildPeliculaCausalAgregada({
    caseId: input.case_id,
    sceneSet,
    aggregationIndex,
    validatedScenes,
    governanceIssueRefs,
    readinessDecisionRef,
    version,
  });

  return {
    ok: true,
    scene_set: sceneSet,
    aggregation_index: aggregationIndex,
    pelicula_causal_agregada: peliculaCausalAgregada,
    governance_issue_refs: unique(governanceIssueRefs),
    readiness_decision_ref: readinessDecisionRef,
    no_go: NO_GO,
    materiality: MATERIALITY,
  };
}

function buildSceneSet(params: {
  caseId: string;
  validatedScenes: EscenaEvidencial[];
  excludedScenes: EscenaEvidencial[];
  minimumValidatedScenes: number;
  governanceIssueRefs: string[];
  version: string;
  state: SceneSet["state"];
}): SceneSet {
  return {
    scene_set_id: `SCENE_SET:${params.caseId}`,
    case_id: params.caseId,
    escena_evidencial_refs: params.validatedScenes.map(
      (scene) => scene.escena_evidencial_id,
    ),
    inclusion_rule: "state == validated",
    minimum_scene_rule: params.minimumValidatedScenes,
    excluded_scene_refs: params.excludedScenes.map(
      (scene) => scene.escena_evidencial_id,
    ),
    governance_issue_refs: unique(params.governanceIssueRefs),
    state: params.state,
    version: params.version,
    audit_log: [
      {
        event: "pf_sup_04_scene_set_materialized",
        validated_scene_count: params.validatedScenes.length,
        excluded_scene_count: params.excludedScenes.length,
      },
    ],
  };
}

function buildAggregationIndex(
  sceneSet: SceneSet,
  scenes: EscenaEvidencial[],
): AggregationIndex {
  return {
    aggregation_index_id: `AGGREGATION_INDEX:${sceneSet.scene_set_id}`,
    scene_set_id: sceneSet.scene_set_id,
    indexed_dimensions: [
      "actor_role_index",
      "object_index",
      "event_index",
      "state_index",
      "inconsistency_index",
      "feedback_index",
      "b7_boundary_index",
    ],
    actor_role_index: indexRefs(scenes, "observable_act_refs"),
    object_index: indexRefs(scenes, "mmabp_element_refs"),
    event_index: indexRefs(scenes, "source_scene_refs"),
    state_index: indexState(scenes),
    inconsistency_index: indexRefs(scenes, "mmabp_inconsistency_refs"),
    feedback_index: indexRefs(scenes, "governance_issue_refs"),
    b7_boundary_index: indexB7Boundary(scenes),
    state: "built",
    audit_log: [
      {
        event: "pf_sup_04_aggregation_index_built",
        source: "validated_escena_evidencial_structured_fields",
      },
    ],
  };
}

function buildPeliculaCausalAgregada(params: {
  caseId: string;
  sceneSet: SceneSet;
  aggregationIndex: AggregationIndex;
  validatedScenes: EscenaEvidencial[];
  governanceIssueRefs: string[];
  readinessDecisionRef: string;
  version: string;
}): PeliculaCausalAgregada {
  const hasB7Signals = params.validatedScenes.some(
    (scene) => scene.b7_boundary.signals_count > 0,
  );

  return {
    pelicula_id: `PELICULA_CAUSAL_AGREGADA:${params.caseId}`,
    case_id: params.caseId,
    scene_set_ref: params.sceneSet.scene_set_id,
    aggregation_index_ref: params.aggregationIndex.aggregation_index_id,
    pattern_refs: [`PATTERN_CANDIDATE:${params.sceneSet.scene_set_id}`],
    monetizable_signal_refs: [
      `MONETIZABLE_SIGNAL_CANDIDATE:${params.sceneSet.scene_set_id}`,
    ],
    loss_estimate_refs: [
      `LOSS_ESTIMATE_CANDIDATE:${params.sceneSet.scene_set_id}`,
    ],
    ahe_blockage_refs: [`AHE_BLOCKAGE_BOUNDARY:${params.sceneSet.scene_set_id}`],
    governance_issue_refs: unique(params.governanceIssueRefs),
    readiness_decision_ref: params.readinessDecisionRef,
    state: "aggregated",
    version: params.version,
    audit_log: [
      {
        event: "pf_sup_04_pelicula_causal_agregada_materialized",
        monetizable_signal_status: "candidate_only",
        ahe_blockage_status: "boundary_limited",
      },
    ],
    b7_boundary: {
      preserved_as_non_diagnostic: hasB7Signals,
      no_diagnostic_outputs_created: false,
    },
  };
}

function indexRefs(
  scenes: EscenaEvidencial[],
  key: keyof Pick<
    EscenaEvidencial,
    | "observable_act_refs"
    | "mmabp_element_refs"
    | "source_scene_refs"
    | "mmabp_inconsistency_refs"
    | "governance_issue_refs"
  >,
): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const scene of scenes) {
    for (const ref of scene[key]) {
      addIndexValue(index, ref, scene.escena_evidencial_id);
    }
  }
  return index;
}

function indexState(scenes: EscenaEvidencial[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const scene of scenes) {
    addIndexValue(index, scene.state, scene.escena_evidencial_id);
  }
  return index;
}

function indexB7Boundary(scenes: EscenaEvidencial[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const scene of scenes) {
    if (scene.b7_boundary.signals_count > 0) {
      addIndexValue(
        index,
        "non_diagnostic_preclassification_only",
        scene.escena_evidencial_id,
      );
    }
  }
  return index;
}

function addIndexValue(
  index: Record<string, string[]>,
  key: string,
  sceneId: string,
): void {
  if (!key) {
    return;
  }
  index[key] = unique([...(index[key] ?? []), sceneId]);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

