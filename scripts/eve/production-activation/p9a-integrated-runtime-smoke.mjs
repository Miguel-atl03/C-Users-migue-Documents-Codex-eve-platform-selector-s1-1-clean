#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import {
  P9AR2_ARTIFACT_PATHS,
  readChainContext,
  scopesMatchContext,
  validateChainContextPresence,
} from "./local-activation-chain-context-lib.mjs";
import {
  P9A_ARTIFACT_PATHS,
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";

function smokePassed(doc, requiredFields) {
  if (!doc) return false;
  return requiredFields.every((field) => doc[field] === true);
}

function chainIdsConsistent(chainContext, p5, p6, p7, p8) {
  if (!chainContext) return false;
  const scopes = [p5?.scope, p6?.scope, p7?.scope, p8?.scope].filter(Boolean);
  if (!scopes.length) return false;
  return scopes.every(
    (scope) =>
      scope.tenant_id === chainContext.tenant_id &&
      scope.case_id === chainContext.case_id &&
      scope.run_id === chainContext.run_id,
  );
}

async function main() {
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);

  const p4 = readJsonIfExists(P9A_ARTIFACT_PATHS.p4Smoke);
  const p5 = readJsonIfExists(P9A_ARTIFACT_PATHS.p5Smoke);
  const p6 = readJsonIfExists(P9A_ARTIFACT_PATHS.p6Smoke);
  const p7 = readJsonIfExists(P9A_ARTIFACT_PATHS.p7Smoke);
  const p8 = readJsonIfExists(P9A_ARTIFACT_PATHS.p8Smoke);
  const p9ar2P6 = readJsonIfExists(P9AR2_ARTIFACT_PATHS.p6Results);
  const p9ar2P7 = readJsonIfExists(P9AR2_ARTIFACT_PATHS.p7Results);
  const p9ar2P8 = readJsonIfExists(P9AR2_ARTIFACT_PATHS.p8Results);

  const runtime_local_smoke_passed =
    smokePassed(p4, [
      "runtime_interaction_instance_created",
      "runtime_subfield_response_created",
      "runtime_audit_trail_created",
    ]) ||
    (p4?.runtime_audit_trail_created === true && p4?.runtime_interaction_instance_created === true);

  const gates_readiness_local_smoke_passed = smokePassed(p5, [
    "readiness_decision_record_created",
    "runtime_audit_trail_created",
    "critical_route_gates_executed_local",
  ]);

  const client_result_safe_smoke_passed =
    (p9ar2P6?.local_read_valid === true &&
      p9ar2P6?.client_safe_result_dto_valid === true &&
      p9ar2P6?.client_visible_result_safe === true) ||
    (p6?.local_read_valid === true && p6?.client_safe_result_dto_valid === true);

  const consultant_packet_smoke_passed =
    p9ar2P7?.consultant_review_packet_created === true ||
    p7?.consultant_review_packet_created === true;

  const parallel_production_controlled_local_smoke_passed =
    (p9ar2P8?.scr_patch_created === true &&
      p9ar2P8?.evidence_bundle_patch_created === true &&
      p9ar2P8?.mdsb_patch_created === true) ||
    (p8?.scr_patch_created === true && p8?.no_forbidden_fields === true);

  const chain_context_present = contextPresence.valid;
  const chain_scope_consistent = chainIdsConsistent(chainContext, p5, p6, p7, p8);
  const chain_context_client_visible_state_set = Boolean(chainContext?.client_visible_state);
  const chain_context_consultant_packet_ref_set = Boolean(chainContext?.consultant_packet_ref);
  const chain_context_parallel_rehearsal_ref_set = Boolean(chainContext?.parallel_rehearsal_ref);

  const integrated_runtime_smoke_passed =
    supabase_local_available &&
    chain_context_present &&
    chain_scope_consistent &&
    runtime_local_smoke_passed &&
    gates_readiness_local_smoke_passed &&
    client_result_safe_smoke_passed &&
    consultant_packet_smoke_passed &&
    parallel_production_controlled_local_smoke_passed &&
    chain_context_client_visible_state_set &&
    chain_context_consultant_packet_ref_set &&
    chain_context_parallel_rehearsal_ref_set;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_INTEGRATED_RUNTIME_SMOKE",
    generated_at: new Date().toISOString(),
    supabase_local_available,
    chain_context_ref: chainContext?.context_ref ?? null,
    chain_context_present,
    chain_scope_consistent,
    chain_context_client_visible_state_set,
    chain_context_consultant_packet_ref_set,
    chain_context_parallel_rehearsal_ref_set,
    artifacts_present: {
      chain_context: Boolean(chainContext),
      p4: Boolean(p4),
      p5: Boolean(p5),
      p6: Boolean(p6),
      p7: Boolean(p7),
      p8: Boolean(p8),
      p9ar2_p6: Boolean(p9ar2P6),
      p9ar2_p7: Boolean(p9ar2P7),
      p9ar2_p8: Boolean(p9ar2P8),
    },
    runtime_local_smoke_passed,
    gates_readiness_local_smoke_passed,
    client_result_safe_smoke_passed,
    consultant_packet_smoke_passed,
    parallel_production_controlled_local_smoke_passed,
    integrated_runtime_smoke_passed,
    scope_chain: {
      chain_context: {
        tenant_id: chainContext?.tenant_id ?? null,
        case_id: chainContext?.case_id ?? null,
        run_id: chainContext?.run_id ?? null,
        readiness_decision_record_id: chainContext?.readiness_decision_record_id ?? null,
      },
      p5_scope: p5?.scope ?? null,
      p6_scope: p6?.scope ?? null,
      p7_scope: p7?.scope ?? null,
      p8_scope: p8?.scope ?? null,
    },
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(P9AR2_ARTIFACT_PATHS.integratedSmoke, `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(P9A_ARTIFACT_PATHS.integratedSmoke, `${JSON.stringify({ ...result, dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_INTEGRATED_RUNTIME_SMOKE" }, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  const chainValidation = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_CHAIN_CONTEXT_VALIDATION",
    generated_at: new Date().toISOString(),
    context_presence: contextPresence,
    chain_scope_consistent,
    scopes_match: {
      p5: scopesMatchContext(chainContext, p5?.scope),
      p6: scopesMatchContext(chainContext, p6?.scope),
      p7: scopesMatchContext(chainContext, p7?.scope),
      p8: scopesMatchContext(chainContext, p8?.scope),
    },
    readiness_decision_record_id: chainContext?.readiness_decision_record_id ?? null,
    runtime_audit_trail_ids: chainContext?.runtime_audit_trail_ids ?? [],
    readiness_gap_record_ids: chainContext?.readiness_gap_record_ids ?? [],
    semantic_resolution_event_ids: chainContext?.semantic_resolution_event_ids ?? [],
    process_state_timer_event_ids: chainContext?.process_state_timer_event_ids ?? [],
    client_visible_state: chainContext?.client_visible_state ?? null,
    consultant_packet_ref: chainContext?.consultant_packet_ref ?? null,
    parallel_rehearsal_ref: chainContext?.parallel_rehearsal_ref ?? null,
    validation_passed:
      contextPresence.valid && chain_scope_consistent && integrated_runtime_smoke_passed,
  };
  writeFileSync(
    P9AR2_ARTIFACT_PATHS.chainValidation,
    `${JSON.stringify(chainValidation, null, 2)}\n`,
  );

  if (!integrated_runtime_smoke_passed) {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
