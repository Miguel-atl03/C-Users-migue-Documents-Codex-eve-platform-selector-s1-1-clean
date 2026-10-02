import type {
  CausalPersistenceResult,
  PreliminaryDiagnosticOutput,
} from "@/domain/causal";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";
import { supabaseServer } from "@/lib/supabase-server";

type PersistCausalOutputInput = {
  output: PreliminaryDiagnosticOutput;
};

type SessionCausalOutputRow = {
  id: string;
};

const reasonCodes = (reasons: Array<{ code: string }>) =>
  reasons.map((reason) => reason.code);

export async function persistCausalDiagnosticOutput({
  output,
}: PersistCausalOutputInput): Promise<CausalPersistenceResult> {
  const { data: sessionOutput, error: sessionError } = await supabaseServer
    .from("session_causal_outputs")
    .insert({
      sesion_id: output.session_id,
      instrument_version:
        output.source.instrument_version ?? CAPA1_V2_1_INSTRUMENT_VERSION,
      causal_engine_version: output.schema_version,
      source_session_intermediate_output_id:
        output.source.session_intermediate_output_id,
      output_json: output,
      root_node_probable_within_mvp_scope:
        output.root_node_probable_within_mvp_scope?.node_code_canonical ?? null,
      confidence_level: output.confidence_level,
      needs_reentry: output.needs_reentry,
      needs_expert_review: output.needs_expert_review,
      generated_at: output.generated_at,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError) {
    throw new Error(`Unable to persist session causal output: ${sessionError.message}`);
  }

  const sessionCausalOutputId = (sessionOutput as SessionCausalOutputRow).id;
  const sceneActivationRows = output.scene_node_activations.flatMap((scene) =>
    scene.node_activations.map((activation) => ({
      session_causal_output_id: sessionCausalOutputId,
      sesion_id: output.session_id,
      scene_id: scene.sceneId,
      canonical_record_id: scene.canonicalRecordId,
      node_code_canonical: activation.node_code_canonical,
      node_name_canonical: activation.node_name_canonical,
      node_name_commercial: activation.node_name_commercial,
      activation_json: activation,
      confidence_level: activation.confidenceLevel,
      confidence_components: activation.confidenceComponents,
      reentry_reason_codes: reasonCodes(scene.scene_reentry_reason),
      expert_review_reason_codes: reasonCodes(scene.scene_expert_review_reason),
    })),
  );

  if (sceneActivationRows.length > 0) {
    const { error: sceneError } = await supabaseServer
      .from("scene_causal_activations")
      .insert(sceneActivationRows);

    if (sceneError) {
      throw new Error(`Unable to persist scene causal activations: ${sceneError.message}`);
    }
  }

  const ruleExecutionRows = output.evidence_bundle_used.map((bundle) => ({
    session_causal_output_id: sessionCausalOutputId,
    sesion_id: output.session_id,
    scene_id: bundle.sceneId,
    rule_id: bundle.ruleId,
    node_code_canonical: bundle.node_code_canonical,
    evidence_bundle_id: bundle.id,
    evidence_bundle_json: bundle,
    activated: true,
    confidence_level: bundle.confidenceLevel,
    confidence_components: bundle.confidenceComponents,
  }));

  if (ruleExecutionRows.length > 0) {
    const { error: ruleError } = await supabaseServer
      .from("causal_rule_executions")
      .insert(ruleExecutionRows);

    if (ruleError) {
      throw new Error(`Unable to persist causal rule executions: ${ruleError.message}`);
    }
  }

  return {
    persisted: true,
    session_causal_output_id: sessionCausalOutputId,
    scene_causal_activation_count: sceneActivationRows.length,
    causal_rule_execution_count: ruleExecutionRows.length,
  };
}
