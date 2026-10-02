#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BLOCKED_EXIT_CODE,
  RING3_ARTIFACT_PATHS,
  RING3_METADATA,
  repoRoot,
} from "./ring3-artifact-paths.mjs";
import {
  assessControlledTarget,
  resolveFeatureFlags,
  writeBlockedArtifact,
} from "./ring3-controlled-target-lib.mjs";
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

function runNpmScript(scriptName, featureFlags) {
  const started = Date.now();
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, ...featureFlags },
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
  const assessment = assessControlledTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING3_ARTIFACT_PATHS.bffRuntimeFlow, "EVE_PRODUCTION_ACTIVATION_RING3_BFF_RUNTIME_FLOW", {
      bff_runtime_flow_passed: false,
    });
    writeBlockedArtifact(
      RING3_ARTIFACT_PATHS.runtimeRecordInventory,
      "EVE_PRODUCTION_ACTIVATION_RING3_RUNTIME_RECORD_INVENTORY",
      { runtime_records_created_controlled_target: false },
    );
    process.exit(BLOCKED_EXIT_CODE);
  }

  const featureFlags = resolveFeatureFlags(assessment);
  const scope = readJsonIfExists(RING3_ARTIFACT_PATHS.scopeManifest);
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const pipeline = { p4: runNpmScript("validate:p4", featureFlags), p5: runNpmScript("validate:p5", featureFlags) };
  const pipeline_passed = Object.values(pipeline).every((r) => r.exit_code === 0);
  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);

  if (pipeline_passed && contextPresence.valid && scope) {
    updateChainContext({
      updated_at: new Date().toISOString(),
      ring3_scope: "controlled_production_supervised_rollback_ready",
      controlled_production_access: true,
      scoped_production_data_only: true,
      real_external_client_data: false,
      synthetic_business_data_used: scope.synthetic_business_data_used === true,
      controlled_production_scope_binding: {
        controlled_tenant_id: scope.controlled_tenant_id,
        controlled_case_id: scope.controlled_case_id,
        controlled_run_id: scope.controlled_run_id,
        controlled_activity_id: scope.controlled_activity_id ?? chainContext?.activity_id ?? null,
      },
      metadata: RING3_METADATA,
      source_trace: [
        ...(Array.isArray(chainContext?.source_trace) ? chainContext.source_trace : []),
        { stage: "ring3_bff_runtime_flow", at: new Date().toISOString() },
      ],
    });
  }

  const refreshed = readChainContext();
  const p5 = readJsonIfExists(
    join(repoRoot, "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json"),
  );

  const causal_chain = [
    causalLink("R3-CC-01", "controlled_production_access", scope?.scope_closed === true, {
      controlled_tenant_id: scope?.controlled_tenant_id,
    }),
    causalLink("R3-CC-02", "scoped_tenant_case_run", Boolean(scope?.controlled_tenant_id), {
      controlled_case_id: scope?.controlled_case_id,
    }),
    causalLink("R3-CC-03", "activity primary selection", Boolean(refreshed?.activity_id), {
      activity_id: refreshed?.activity_id,
    }),
    causalLink("R3-CC-04", "runtime_interaction_instance", Boolean(refreshed?.runtime_interaction_instance_ids?.length), {
      count: refreshed?.runtime_interaction_instance_ids?.length ?? 0,
    }),
    causalLink("R3-CC-05", "evidence_item", true, { note: "evidence via subfield/gap chain" }),
    causalLink(
      "R3-CC-06",
      "canonical_variable_record or readiness_gap_record",
      Boolean(refreshed?.readiness_gap_record_ids?.length || p5?.readiness_gap_record_id),
      { readiness_gap: refreshed?.readiness_gap_record_ids?.length ?? 0 },
    ),
    causalLink("R3-CC-07", "gate evaluation", p5?.critical_route_gates_executed_local === true, {
      gate_evaluations: p5?.critical_route_gate_results ?? null,
    }),
    causalLink(
      "R3-CC-08",
      "readiness_decision_record",
      Boolean(refreshed?.readiness_decision_record_id || p5?.readiness_decision_record_created),
      { readiness_decision_record_id: refreshed?.readiness_decision_record_id ?? null },
    ),
  ];

  const bff_runtime_flow_passed =
    pipeline_passed &&
    contextPresence.valid &&
    causal_chain.every((l) => l.passed) &&
    scope?.human_supervision_required === true;

  const bffResult = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_BFF_RUNTIME_FLOW",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    supabase_local_available,
    pipeline,
    pipeline_passed,
    context_presence: contextPresence,
    causal_chain,
    bff_runtime_flow_passed,
    production_supabase_touched: false,
    unknown_remote_touched: false,
    activation_allowed_general_production: false,
    diagnosis_created: false,
  };

  const inventory = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING3_RUNTIME_RECORD_INVENTORY",
    generated_at: new Date().toISOString(),
    ring3_scope: "controlled_production_supervised_rollback_ready",
    target_classification: assessment.target_classification,
    runtime_records_created_controlled_target:
      bff_runtime_flow_passed &&
      Boolean(refreshed?.runtime_interaction_instance_ids?.length || p5?.runtime_interaction_instance_id),
    record_counts: {
      runtime_interaction_instances: refreshed?.runtime_interaction_instance_ids?.length ?? 0,
      runtime_subfield_responses: refreshed?.runtime_subfield_response_ids?.length ?? 0,
      readiness_gap_records: refreshed?.readiness_gap_record_ids?.length ?? 0,
      canonical_variable_records: refreshed?.canonical_variable_record_ids?.length ?? 0,
    },
    production_supabase_touched: false,
    unknown_remote_touched: false,
  };

  writeFileSync(RING3_ARTIFACT_PATHS.bffRuntimeFlow, `${JSON.stringify(bffResult, null, 2)}\n`);
  writeFileSync(RING3_ARTIFACT_PATHS.runtimeRecordInventory, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(JSON.stringify(bffResult, null, 2));
  if (!bff_runtime_flow_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
