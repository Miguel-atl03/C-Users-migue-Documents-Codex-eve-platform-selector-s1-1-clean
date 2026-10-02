#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import {
  BLOCKED_EXIT_CODE,
  RING4_ARTIFACT_PATHS,
  RING4_BLOCKED_FLAGS,
  RING4_METADATA,
  repoRoot,
} from "./ring4-artifact-paths.mjs";
import { assessScaleTarget, writeBlockedArtifact } from "./ring4-scale-target-lib.mjs";
import {
  createSupabaseLocalClient,
  isSupabaseLocalReachable,
  readEnvLocal,
} from "./p9a-production-activation-lib.mjs";

function transpileModule(filePath, requireMap) {
  const source = readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      exports: module.exports,
      module,
      require: (id) => {
        if (id in requireMap) return requireMap[id];
        throw new Error(`Unexpected require: ${id} from ${filePath}`);
      },
      process,
    },
    { filename: filePath },
  );
  return module.exports;
}

function loadAbortModules() {
  const gatesTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const parallelTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-types.ts",
  );
  const parallelServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-service.ts",
  );
  const consultantTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-types.ts",
  );
  const consultantServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-service.ts",
  );

  const gatesTypes = transpileModule(gatesTypesPath, {});
  const parallelTypes = transpileModule(parallelTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "../consultant-result/runtime-40-20-consultant-result-types": {},
  });
  const parallelService = transpileModule(parallelServicePath, {
    "./runtime-40-20-parallel-production-types": parallelTypes,
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });
  const consultantTypes = transpileModule(consultantTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "../client-result/runtime-40-20-client-result-types": {},
  });
  const consultantService = transpileModule(consultantServicePath, {
    "./runtime-40-20-consultant-result-types": consultantTypes,
    "./runtime-40-20-consultant-result-local-adapter": {},
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });

  return { parallelService, consultantService };
}

async function main() {
  const assessment = assessScaleTarget();
  if (!assessment.ready_for_execution) {
    writeBlockedArtifact(RING4_ARTIFACT_PATHS.abort, "EVE_PRODUCTION_ACTIVATION_RING4_ABORT_DRILL", {
      abort_drill_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const { parallelService, consultantService } = loadAbortModules();
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);

  const blockedEnv = { ...readEnvLocal(), ...process.env, ...RING4_BLOCKED_FLAGS };
  const dependency_blocked = parallelService.isParallelProductionDependencyBlocked(blockedEnv);
  const blockedResult = parallelService.buildParallelProductionDependencyBlockedResponse({
    tenant_id: crypto.randomUUID(),
    case_id: crypto.randomUUID(),
    role_id: crypto.randomUUID(),
    activity_id: crypto.randomUUID(),
    run_id: crypto.randomUUID(),
    correlation_id: `ring3-abort-${Date.now()}`,
    idempotency_key: `ring3-abort-idem-${Date.now()}`,
  });
  const boundaryFlags = parallelService.buildP8ParallelProductionBoundaryFlags();
  const consultantBlocked = consultantService.isConsultantReviewPacketDependencyBlocked(blockedEnv);

  const noGoTechnical =
    blockedResult.dependency_blocked === true &&
    blockedResult.status === "dependency_blocked" &&
    boundaryFlags.activation_allowed === false &&
    boundaryFlags.qa_green_real_created === false &&
    boundaryFlags.diagnosis_final_created === false &&
    boundaryFlags.export_real_created === false;

  let audit_trail_id = null;
  if (supabase_local_available) {
    const drill_id = `ring3-abort-${Date.now()}`;
    const { data, error } = await supabase
      .from("runtime_audit_trail")
      .insert({
        tenant_id: crypto.randomUUID(),
        case_id: crypto.randomUUID(),
        role_id: crypto.randomUUID(),
        activity_id: crypto.randomUUID(),
        run_id: crypto.randomUUID(),
        object_type: "ring4_abort_path_drill",
        object_id: drill_id,
        actor_id: "ring3-abort-drill",
        actor_type: "system_local_drill",
        action: "ring4_abort_path_drill_completed",
        reason: "dependency_blocked_abort",
        prior_value: null,
        new_value: {
          dependency_blocked,
          consultant_blocked: consultantBlocked,
          no_go_technical: noGoTechnical,
          ring4_scope: "expanded_production_scale_governance",
        },
        correlation_id: `${drill_id}-corr`,
        idempotency_key: `${drill_id}-idem`,
        source_trace: [{ stage: "ring4_abort_path_drill" }],
        metadata: { local_only: true, ...RING4_METADATA },
      })
      .select("id")
      .single();
    if (!error) audit_trail_id = data.id;
    if (audit_trail_id) await supabase.from("runtime_audit_trail").delete().eq("id", audit_trail_id);
  }

  const abort_drill_passed =
    dependency_blocked &&
    noGoTechnical &&
    consultantBlocked &&
    boundaryFlags.activation_allowed === false &&
    boundaryFlags.diagnosis_final_created === false &&
    boundaryFlags.export_real_created === false;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING4_ABORT_DRILL",
    generated_at: new Date().toISOString(),
    ring4_scope: "expanded_production_scale_governance",
    target_classification: assessment.target_classification,
    supabase_local_available,
    dependency_blocked,
    consultant_packet_dependency_blocked: consultantBlocked,
    no_go_technical_local: noGoTechnical,
    blocked_result: {
      status: blockedResult.status,
      dependency_blocked: blockedResult.dependency_blocked,
      blocked_reason: blockedResult.blocked_reason,
      boundary_flags: boundaryFlags,
    },
    abort_drill_passed,
    qa_green_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
    unknown_remote_touched: false,
  };

  writeFileSync(RING4_ARTIFACT_PATHS.abort, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!abort_drill_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
