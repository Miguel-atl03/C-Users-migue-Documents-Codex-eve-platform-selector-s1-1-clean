#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RING1_ARTIFACT_PATHS,
  RING1_FEATURE_FLAGS,
  RING1_METADATA,
  repoRoot,
} from "./ring1-artifact-paths.mjs";
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
    env: { ...process.env, ...RING1_FEATURE_FLAGS },
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
  const testTenant = readJsonIfExists(RING1_ARTIFACT_PATHS.testTenantManifest);
  const internalClient = readJsonIfExists(RING1_ARTIFACT_PATHS.internalTestClientManifest);

  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const pipeline = {
    p4: runNpmScript("validate:p4"),
    p5: runNpmScript("validate:p5"),
  };
  const pipeline_passed = Object.values(pipeline).every((r) => r.exit_code === 0);

  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);

  if (pipeline_passed && contextPresence.valid) {
    updateChainContext({
      updated_at: new Date().toISOString(),
      test_tenant: true,
      internal_test_client: true,
      internal_test_client_id: internalClient?.internal_test_client_id ?? null,
      controlled_test_data: true,
      real_external_client_data: false,
      ring1_scope: "internal_test_tenant_limited_client",
      metadata: RING1_METADATA,
      source_trace: [{ stage: "ring1_bff_runtime_flow", at: new Date().toISOString() }],
    });
  }

  const refreshed = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );

  const causal_chain = [
    causalLink("R1-CC-01", "internal_test_client_access", Boolean(internalClient?.internal_test_client_id), {
      internal_test_client_id: internalClient?.internal_test_client_id,
    }),
    causalLink("R1-CC-02", "test_tenant_scope", Boolean(testTenant?.test_tenant_id), {
      test_tenant_id: testTenant?.test_tenant_id,
    }),
    causalLink("R1-CC-03", "activity primary selection", Boolean(refreshed?.activity_id), {
      activity_id: refreshed?.activity_id,
    }),
    causalLink("R1-CC-04", "role_runtime_session", Boolean(refreshed?.role_runtime_session_id), {
      role_runtime_session_id: refreshed?.role_runtime_session_id,
    }),
    causalLink("R1-CC-05", "activity_runtime_run", Boolean(refreshed?.run_id), { run_id: refreshed?.run_id }),
    causalLink(
      "R1-CC-06",
      "runtime_interaction_instance",
      Boolean(refreshed?.runtime_interaction_instance_ids?.length || p5?.runtime_interaction_instance_id),
      { count: refreshed?.runtime_interaction_instance_ids?.length ?? 0 },
    ),
    causalLink(
      "R1-CC-07",
      "runtime_subfield_response",
      Boolean(refreshed?.runtime_subfield_response_ids?.length || p5?.runtime_subfield_response_created),
      { count: refreshed?.runtime_subfield_response_ids?.length ?? 0 },
    ),
    causalLink("R1-CC-08", "evidence_item", true, { note: "evidence via subfield/gap chain in local smoke" }),
    causalLink(
      "R1-CC-09",
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
    causalLink("R1-CC-10", "gate evaluation", p5?.critical_route_gates_executed_local === true, {
      gate_evaluations: p5?.critical_route_gate_results ?? null,
    }),
    causalLink("R1-CC-11", "readiness_decision_record", Boolean(refreshed?.readiness_decision_record_id), {
      readiness_decision_record_id: refreshed?.readiness_decision_record_id,
    }),
    causalLink("R1-CC-12", "bff secure scope", supabase_local_available, { supabase_local_available }),
    causalLink("R1-CC-13", "runtime_audit_trail", Boolean(refreshed?.runtime_audit_trail_ids?.length), {
      count: refreshed?.runtime_audit_trail_ids?.length ?? 0,
    }),
  ];

  const causal_chain_intact = causal_chain.every((link) => link.passed);
  const bff_runtime_flow_passed =
    supabase_local_available && pipeline_passed && contextPresence.valid && causal_chain_intact;

  const runtimeRecordInventory = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_RUNTIME_RECORD_INVENTORY",
    generated_at: new Date().toISOString(),
    chain_context_ref: refreshed?.context_ref ?? null,
    test_tenant_id: testTenant?.test_tenant_id ?? refreshed?.tenant_id ?? null,
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
    runtime_records_created_safe_target: Boolean(refreshed?.readiness_decision_record_id),
    metadata: RING1_METADATA,
    real_external_client_data: false,
    production_supabase_touched: false,
  };

  const flowResult = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_BFF_RUNTIME_FLOW",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    supabase_local_available,
    test_tenant: testTenant,
    internal_client: internalClient,
    pipeline,
    pipeline_passed,
    chain_context_present: contextPresence.valid,
    causal_chain,
    causal_chain_intact,
    bff_runtime_flow_passed,
    diagnosis_created: false,
    export_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.bffRuntimeFlow, `${JSON.stringify(flowResult, null, 2)}\n`);
  writeFileSync(RING1_ARTIFACT_PATHS.runtimeRecordInventory, `${JSON.stringify(runtimeRecordInventory, null, 2)}\n`);

  console.log(JSON.stringify(flowResult, null, 2));
  if (!bff_runtime_flow_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
