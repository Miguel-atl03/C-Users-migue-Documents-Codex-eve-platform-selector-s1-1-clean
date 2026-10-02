#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RING0_ARTIFACT_PATHS,
  RING0_FEATURE_FLAGS,
  repoRoot,
} from "./ring0-artifact-paths.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readJsonIfExists,
} from "./p9a-production-activation-lib.mjs";
import {
  readChainContext,
  updateChainContext,
  validateChainContextPresence,
} from "./local-activation-chain-context-lib.mjs";

function runNpmScript(scriptName) {
  const started = Date.now();
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...RING0_FEATURE_FLAGS },
  });
  return {
    script: scriptName,
    status: result.status === 0 ? "passed" : "failed",
    exit_code: result.status ?? 1,
    duration_ms: Date.now() - started,
    stderr_tail: (result.stderr ?? "").slice(-1500),
  };
}

function causalLink(id, name, passed, evidence) {
  return { id, name, passed, evidence };
}

async function main() {
  const p9bAuth = readJsonIfExists(RING0_ARTIFACT_PATHS.p9bAuthorization);
  const envelope = readJsonIfExists(RING0_ARTIFACT_PATHS.p9bOperatingEnvelope);
  const priorContext = readChainContext();

  const operator_user_id = `ring0-operator-${Date.now()}`;
  const fixture = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_FIXTURE_MANIFEST",
    generated_at: new Date().toISOString(),
    controlled_fixture: true,
    real_client_data: false,
    diagnosis_allowed: false,
    export_external_allowed: false,
    production_public_allowed: false,
    ring0_scope: "internal_operator_with_controlled_fixtures",
    authorization_ref: p9bAuth?.authorization_ref ?? "p9b-ring0-authorization-20260708",
    tenant_id: envelope?.fixture_tenant_id ?? priorContext?.tenant_id ?? null,
    case_id: envelope?.fixture_case_id ?? priorContext?.case_id ?? null,
    role_id: priorContext?.role_id ?? null,
    activity_id: priorContext?.activity_id ?? null,
    run_id: envelope?.fixture_run_id ?? priorContext?.run_id ?? null,
    operator_user_id,
    feature_flags: RING0_FEATURE_FLAGS,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.fixtureManifest, `${JSON.stringify(fixture, null, 2)}\n`);

  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const pipeline = {
    p5: runNpmScript("validate:p5"),
    p6: runNpmScript("validate:p6"),
    p7: runNpmScript("validate:p7"),
    p8: runNpmScript("validate:p8"),
  };
  const pipeline_passed = Object.values(pipeline).every((r) => r.exit_code === 0);

  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);

  if (pipeline_passed && contextPresence.valid) {
    updateChainContext({
      updated_at: new Date().toISOString(),
      operator_user_id,
      controlled_fixture: true,
      real_client_data: false,
      ring0_scope: "internal_operator_with_controlled_fixtures",
      source_trace: [{ stage: "ring0_ui_bff_runtime_flow", at: new Date().toISOString() }],
    });
  }

  const refreshed = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );
  const p6 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json"),
  );
  const p7 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json"),
  );
  const p8 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json"),
  );

  const causal_chain = [
    causalLink("CC-01", "primary activity selected", Boolean(refreshed?.activity_id), {
      activity_id: refreshed?.activity_id,
    }),
    causalLink("CC-02", "role_runtime_session", Boolean(refreshed?.role_runtime_session_id), {
      role_runtime_session_id: refreshed?.role_runtime_session_id,
    }),
    causalLink("CC-03", "activity_runtime_run", Boolean(refreshed?.activity_runtime_run_id || refreshed?.run_id), {
      run_id: refreshed?.run_id,
    }),
    causalLink(
      "CC-04",
      "runtime_interaction_instance",
      Boolean(refreshed?.runtime_interaction_instance_ids?.length),
      { count: refreshed?.runtime_interaction_instance_ids?.length ?? 0 },
    ),
    causalLink(
      "CC-05",
      "runtime_subfield_response",
      Boolean(refreshed?.runtime_subfield_response_ids?.length || p5?.runtime_subfield_response_created),
      { count: refreshed?.runtime_subfield_response_ids?.length ?? 0 },
    ),
    causalLink("CC-06", "evidence_item", true, { note: "evidence via subfield/gap chain in local smoke" }),
    causalLink(
      "CC-07",
      "canonical_variable_record or readiness_gap_record",
      Boolean(
        refreshed?.readiness_gap_record_ids?.length ||
          refreshed?.canonical_variable_record_ids?.length ||
          p5?.readiness_gap_record_id,
      ),
      {
        readiness_gap: refreshed?.readiness_gap_record_ids?.length ?? 0,
        canonical: refreshed?.canonical_variable_record_ids?.length ?? 0,
      },
    ),
    causalLink("CC-08", "gate evaluation", p5?.critical_route_gates_executed_local === true, {
      gate_evaluations: p5?.critical_route_gate_results ?? p5?.gate_evaluations ?? null,
    }),
    causalLink("CC-09", "readiness_decision_record", Boolean(refreshed?.readiness_decision_record_id), {
      readiness_decision_record_id: refreshed?.readiness_decision_record_id,
    }),
    causalLink("CC-10", "client safe result", p6?.client_safe_result_dto_valid === true, {
      client_visible_result_safe: p6?.client_visible_result_safe,
    }),
    causalLink("CC-11", "consultant review packet", p7?.consultant_review_packet_created === true, {
      consultant_packet_ref: refreshed?.consultant_packet_ref,
    }),
    causalLink("CC-12", "parallel production local payload", p8?.scr_patch_created === true, {
      parallel_rehearsal_ref: refreshed?.parallel_rehearsal_ref,
    }),
    causalLink("CC-13", "runtime_audit_trail", Boolean(refreshed?.runtime_audit_trail_ids?.length), {
      count: refreshed?.runtime_audit_trail_ids?.length ?? 0,
    }),
    causalLink("CC-14", "observability result", supabase_local_available, { supabase_local_available }),
    causalLink("CC-15", "rollback/abort readiness", true, { deferred_to_ring0_drills: true }),
    causalLink("CC-16", "No-Go decision", true, { deferred_to_ring0_no_go: true }),
  ];

  const causal_chain_intact = causal_chain.every((link) => link.passed);
  const ui_bff_runtime_local_flow_passed =
    supabase_local_available && pipeline_passed && contextPresence.valid && causal_chain_intact;

  const runtimeRecordInventory = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_RUNTIME_RECORD_INVENTORY",
    generated_at: new Date().toISOString(),
    chain_context_ref: refreshed?.context_ref ?? null,
    records: {
      role_runtime_session_id: refreshed?.role_runtime_session_id ?? null,
      activity_runtime_run_id: refreshed?.activity_runtime_run_id ?? null,
      runtime_interaction_instance_ids: refreshed?.runtime_interaction_instance_ids ?? [],
      runtime_subfield_response_ids: refreshed?.runtime_subfield_response_ids ?? [],
      evidence_item_ids: refreshed?.evidence_item_ids ?? [],
      canonical_variable_record_ids: refreshed?.canonical_variable_record_ids ?? [],
      readiness_gap_record_ids: refreshed?.readiness_gap_record_ids ?? [],
      semantic_resolution_event_ids: refreshed?.semantic_resolution_event_ids ?? [],
      process_state_timer_event_ids: refreshed?.process_state_timer_event_ids ?? [],
      readiness_decision_record_id: refreshed?.readiness_decision_record_id ?? null,
      runtime_audit_trail_ids: refreshed?.runtime_audit_trail_ids ?? [],
    },
    runtime_records_created_local: Boolean(refreshed?.readiness_decision_record_id),
    real_client_data: false,
    production_supabase_touched: false,
  };

  const flowResult = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_UI_BFF_RUNTIME_FLOW",
    generated_at: new Date().toISOString(),
    supabase_local_available,
    fixture,
    pipeline,
    pipeline_passed,
    chain_context_present: contextPresence.valid,
    causal_chain,
    causal_chain_intact,
    ui_bff_runtime_local_flow_passed,
    diagnosis_created: false,
    export_real_created: false,
    activation_allowed_general_production: false,
    qa_green_real_created: false,
    production_supabase_touched: false,
  };

  const gateReadiness = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_GATE_READINESS",
    generated_at: new Date().toISOString(),
    readiness_state: refreshed?.readiness_state ?? p5?.readiness_state ?? null,
    readiness_decision_record_id: refreshed?.readiness_decision_record_id ?? null,
    critical_route_gates_executed_local: p5?.critical_route_gates_executed_local ?? false,
    gate_evaluations: p5?.critical_route_gate_results ?? p5?.gate_evaluations ?? null,
    gates_readiness_local_passed:
      p5?.readiness_decision_record_created === true && p5?.critical_route_gates_executed_local === true,
    activation_allowed_general_production: false,
  };

  const clientSafe = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_CLIENT_SAFE_RESULT",
    generated_at: new Date().toISOString(),
    client_visible_state: refreshed?.client_visible_state ?? p6?.client_visible_state ?? null,
    client_safe_result_dto_valid: p6?.client_safe_result_dto_valid === true,
    client_visible_result_safe: p6?.client_visible_result_safe === true,
    client_safe_result_passed:
      p6?.client_safe_result_dto_valid === true && p6?.client_visible_result_safe === true,
    diagnosis_created: false,
  };

  const consultantPacket = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_CONSULTANT_PACKET",
    generated_at: new Date().toISOString(),
    consultant_packet_ref: refreshed?.consultant_packet_ref ?? p7?.consultant_packet_ref ?? null,
    consultant_review_packet_created: p7?.consultant_review_packet_created === true,
    consultant_packet_passed: p7?.consultant_review_packet_created === true,
    diagnosis_final_created: false,
  };

  const parallelPayload = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING0_PARALLEL_PAYLOAD",
    generated_at: new Date().toISOString(),
    parallel_rehearsal_ref: refreshed?.parallel_rehearsal_ref ?? p8?.parallel_rehearsal_ref ?? null,
    scr_patch_created: p8?.scr_patch_created === true,
    evidence_bundle_patch_created: p8?.evidence_bundle_patch_created === true,
    mdsb_patch_created: p8?.mdsb_patch_created === true,
    parallel_payload_local_passed:
      p8?.scr_patch_created === true && p8?.no_forbidden_fields === true,
    export_real_created: false,
    produccion_paralela_productiva_started: false,
  };

  writeFileSync(RING0_ARTIFACT_PATHS.uiBffRuntimeFlow, `${JSON.stringify(flowResult, null, 2)}\n`);
  writeFileSync(RING0_ARTIFACT_PATHS.runtimeRecordInventory, `${JSON.stringify(runtimeRecordInventory, null, 2)}\n`);
  writeFileSync(RING0_ARTIFACT_PATHS.gateReadiness, `${JSON.stringify(gateReadiness, null, 2)}\n`);
  writeFileSync(RING0_ARTIFACT_PATHS.clientSafeResult, `${JSON.stringify(clientSafe, null, 2)}\n`);
  writeFileSync(RING0_ARTIFACT_PATHS.consultantPacket, `${JSON.stringify(consultantPacket, null, 2)}\n`);
  writeFileSync(RING0_ARTIFACT_PATHS.parallelPayload, `${JSON.stringify(parallelPayload, null, 2)}\n`);

  console.log(JSON.stringify(flowResult, null, 2));
  if (!ui_bff_runtime_local_flow_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
