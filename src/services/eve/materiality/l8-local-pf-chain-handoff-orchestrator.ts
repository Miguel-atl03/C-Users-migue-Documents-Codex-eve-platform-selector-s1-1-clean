import { materializeB3ReceiverFeedback } from "../capa1/b3-receiver-feedback-materializer";
import { materializeB7PreclassificationBoundary } from "../capa1/b7-preclassification-boundary-service";
import { runCausalMovieAggregation } from "../aggregation/causal-movie-aggregation-runner";
import { runExpertSynthesisContract } from "../synthesis/expert-synthesis-contract-service";
import { runEvidentialSceneTransduction } from "../transduction/evidential-scene-runner";
import { evaluateMaterialityMarkers } from "./materiality-marker-evaluator";
import type { PeliculaCausalAgregada } from "../aggregation/causal-movie-types";
import type {
  L8LocalPfChainHandoffInput,
  L8LocalPfChainHandoffResult,
  L8LocalStageResult,
} from "./l8-local-pf-chain-handoff-types";

const NO_GO: L8LocalPfChainHandoffResult["no_go"] = {
  runtime_40_20_full_opened: false,
  diagnosis_created: false,
  registry_created: false,
  ir_created: false,
  export_created: false,
  delivered_created: false,
  delivery_authorized: false,
  supabase_touched: false,
  sql_created: false,
  env_read: false,
};

const MATERIALITY: L8LocalPfChainHandoffResult["materiality"] = {
  before: "L7 tested_materiality",
  after: "L8 executable_materiality",
  local_only: true,
  runtime_40_20_full_opened: false,
  production_integration: false,
};

export function runL8LocalPfChainHandoff(
  input: L8LocalPfChainHandoffInput,
): L8LocalPfChainHandoffResult {
  const handoffChain: L8LocalPfChainHandoffResult["handoff_chain"] = [];
  const stages: L8LocalStageResult[] = [];
  const minimumValidatedScenes = input.options?.minimum_validated_scenes ?? 2;

  const b3Results = input.b3_inputs.map((b3Input) =>
    materializeB3ReceiverFeedback({ b3_input: b3Input }),
  );
  const b3Stage = stageResult({
    stage: "B3",
    ok: b3Results.some((result) => result.ok),
    handoffAllowed: b3Results.some((result) => result.ok),
    producedRefs: b3Results.flatMap((result) =>
      result.receiver_feedback_object
        ? [result.receiver_feedback_object.receiver_feedback_id]
        : [],
    ),
    blockedReason: b3Results.some((result) => result.ok)
      ? undefined
      : "b3_no_valid_receiver_feedback",
    governanceIssueRefs: b3Results.flatMap(
      (result) => result.governance_issue_refs,
    ),
  });
  stages.push(b3Stage);
  handoffChain.push(
    handoff("B3", "PF_SUP_03", b3Stage.produced_refs[0], b3Stage.handoff_allowed),
  );

  const b7Results = input.b7_inputs.map((b7Input) =>
    materializeB7PreclassificationBoundary({ b7_input: b7Input }),
  );
  const b7BoundarySafe = b7Results.every(
    (result) =>
      result.no_render_zone.active === true &&
      result.no_go.b7_promoted_to_structural_fact === false &&
      result.no_go.b7_promoted_to_registry === false &&
      result.no_go.b7_promoted_to_ir === false &&
      result.no_go.b7_promoted_to_export === false &&
      result.no_go.b7_promoted_to_diagnosis === false &&
      result.no_go.b7_promoted_to_oee === false,
  );
  const b7Stage = stageResult({
    stage: "B7",
    ok: b7BoundarySafe,
    handoffAllowed: b7BoundarySafe,
    producedRefs: b7Results.map(
      (result) => result.preclassification_record.preclassification_id,
    ),
    blockedReason: b7BoundarySafe ? undefined : "b7_boundary_no_go",
    governanceIssueRefs: b7Results.flatMap(
      (result) => result.governance_issue_refs,
    ),
  });
  stages.push(b7Stage);
  handoffChain.push(
    handoff("B7", "PF_SUP_03", b7Stage.produced_refs[0], b7Stage.handoff_allowed),
  );

  const pfSup03Results = input.evidence_bundles.map((bundle) =>
    runEvidentialSceneTransduction({ evidence_bundle: bundle }),
  );
  const validatedScenes = pfSup03Results.flatMap((result) => {
    const scene = result.escena_evidencial;
    return scene?.state === "validated" ? [scene] : [];
  });
  const pfSup03Allowed = validatedScenes.length >= minimumValidatedScenes;
  const pfSup03Stage = stageResult({
    stage: "PF_SUP_03",
    ok: pfSup03Allowed,
    handoffAllowed: pfSup03Allowed,
    producedRefs: validatedScenes.map((scene) => scene.escena_evidencial_id),
    blockedReason: pfSup03Allowed
      ? undefined
      : "pf_sup_03_no_validated_scene_handoff",
    governanceIssueRefs: pfSup03Results.flatMap(
      (result) => result.governance_issue_refs,
    ),
  });
  stages.push(pfSup03Stage);
  handoffChain.push(
    handoff(
      "PF_SUP_03",
      "PF_SUP_04",
      pfSup03Stage.produced_refs.join(","),
      pfSup03Stage.handoff_allowed,
      pfSup03Stage.blocked_reason,
    ),
  );

  const pfSup04Result = runCausalMovieAggregation({
    case_id: input.case_id,
    escenas_evidenciales: validatedScenes,
    options: { minimum_validated_scenes: minimumValidatedScenes },
  });
  const pfSup04Allowed =
    pfSup04Result.ok &&
    pfSup04Result.pelicula_causal_agregada?.state === "aggregated";
  const pfSup04Stage = stageResult({
    stage: "PF_SUP_04",
    ok: pfSup04Allowed,
    handoffAllowed: pfSup04Allowed,
    producedRefs: pfSup04Result.pelicula_causal_agregada
      ? [pfSup04Result.pelicula_causal_agregada.pelicula_id]
      : [],
    blockedReason: pfSup04Allowed
      ? undefined
      : pfSup04Result.blocked_reason ?? "pf_sup_04_non_aggregated_movie",
    governanceIssueRefs: pfSup04Result.governance_issue_refs,
  });
  stages.push(pfSup04Stage);
  handoffChain.push(
    handoff(
      "PF_SUP_04",
      "PF_SUP_05",
      pfSup04Stage.produced_refs[0],
      pfSup04Stage.handoff_allowed,
      pfSup04Stage.blocked_reason,
    ),
  );

  const movieForPfSup05 =
    pfSup04Result.pelicula_causal_agregada &&
    input.options?.force_non_aggregated_movie_for_local_test
      ? {
          ...pfSup04Result.pelicula_causal_agregada,
          state: "blocked_by_insufficient_scenes",
        }
      : pfSup04Result.pelicula_causal_agregada;
  const pfSup05Result = movieForPfSup05
    ? runExpertSynthesisContract({
        case_id: input.case_id,
        pelicula_causal_agregada: movieForPfSup05 as PeliculaCausalAgregada,
      })
    : undefined;
  const pfSup05Allowed =
    Boolean(pfSup05Result?.ok) &&
    pfSup05Result?.synthesis_case.state === "ready_for_expert_draft" &&
    pfSup05Result.delivery_boundary.state === "delivery_blocked" &&
    pfSup05Result.delivery_boundary.delivery_authorized === false;
  const pfSup05Stage = stageResult({
    stage: "PF_SUP_05",
    ok: pfSup05Allowed,
    handoffAllowed: pfSup05Allowed,
    producedRefs: pfSup05Result ? [pfSup05Result.synthesis_case.synthesis_case_id] : [],
    blockedReason: pfSup05Allowed
      ? undefined
      : pfSup05Result?.blocked_reason ?? "pf_sup_05_missing_aggregated_movie",
    governanceIssueRefs: pfSup05Result?.governance_issue_refs ?? [],
  });
  stages.push(pfSup05Stage);
  handoffChain.push(
    handoff(
      "PF_SUP_05",
      "MATERIALITY_EVALUATOR",
      pfSup05Stage.produced_refs[0],
      pfSup05Stage.handoff_allowed,
      pfSup05Stage.blocked_reason,
    ),
  );

  const materialityResult = evaluateMaterialityMarkers({
    traceability_records: input.materiality_traceability_records,
    marker_contracts: input.materiality_marker_contracts,
  });
  const materialityStage = stageResult({
    stage: "MATERIALITY_EVALUATOR",
    ok: materialityResult.ok,
    handoffAllowed: materialityResult.ok,
    producedRefs: [`MATERIALITY_EVALUATOR:${input.case_id}`],
    blockedReason: materialityResult.ok
      ? undefined
      : "materiality_evaluator_rejected_l6_base",
    governanceIssueRefs: materialityResult.families_evaluated.flatMap(
      (evaluation) => evaluation.findings,
    ),
  });
  stages.push(materialityStage);

  const noGoTriggered = hasNoGoTriggered(stages, pfSup05Result);
  const ok =
    !noGoTriggered &&
    stages.every((stage) => stage.ok && stage.handoff_allowed);

  return {
    ok,
    case_id: input.case_id,
    stages,
    handoff_chain: handoffChain,
    final_state: noGoTriggered
      ? "blocked_by_no_go"
      : ok
        ? "l8_local_executable_materiality"
        : "blocked_by_stage_failure",
    materiality: MATERIALITY,
    no_go: NO_GO,
    next_authorization_required: true,
  };
}

function stageResult(params: {
  stage: L8LocalStageResult["stage"];
  ok: boolean;
  handoffAllowed: boolean;
  producedRefs: string[];
  blockedReason?: string;
  governanceIssueRefs: string[];
}): L8LocalStageResult {
  return {
    stage: params.stage,
    ok: params.ok,
    handoff_allowed: params.handoffAllowed,
    produced_refs: unique(params.producedRefs),
    blocked_reason: params.blockedReason,
    governance_issue_refs: unique(params.governanceIssueRefs),
  };
}

function handoff(
  fromStage: string,
  toStage: string,
  objectRef: string | undefined,
  allowed: boolean,
  blockedReason?: string,
): L8LocalPfChainHandoffResult["handoff_chain"][number] {
  return {
    from_stage: fromStage,
    to_stage: toStage,
    object_ref: objectRef ?? "NO_OBJECT_REF",
    allowed,
    blocked_reason: allowed ? undefined : blockedReason ?? "handoff_blocked",
  };
}

function hasNoGoTriggered(
  stages: L8LocalStageResult[],
  pfSup05Result:
    | ReturnType<typeof runExpertSynthesisContract>
    | undefined,
): boolean {
  return (
    stages.some((stage) => stage.blocked_reason === "b7_boundary_no_go") ||
    Boolean(pfSup05Result?.delivery_boundary.delivery_authorized)
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
