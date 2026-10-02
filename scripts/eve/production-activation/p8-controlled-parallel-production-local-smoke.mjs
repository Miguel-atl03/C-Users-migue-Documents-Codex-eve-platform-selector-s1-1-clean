#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import {
  P9AR2_ARTIFACT_PATHS,
  buildConsultantScopeFromContext,
  readChainContext,
  updateChainContext,
  validateChainContextPresence,
} from "./local-activation-chain-context-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json",
);
const p5SmokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
);
const p7SmokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json",
);

function readEnvLocal() {
  try {
    const raw = readFileSync(join(repoRoot, ".env.local"), "utf8");
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

function createSupabaseLocalClient() {
  const merged = { ...readEnvLocal(), ...process.env };
  const url = merged.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    merged.EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY ??
    merged.SUPABASE_SERVICE_ROLE_KEY ??
    "";
  if (!/127\.0\.0\.1|localhost/i.test(url)) {
    throw new Error("Unsafe target: NEXT_PUBLIC_SUPABASE_URL is not local.");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

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

function loadParallelProductionModules() {
  const gatesTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const clientResultTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts",
  );
  const clientResultServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-service.ts",
  );
  const consultantTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-types.ts",
  );
  const consultantServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-service.ts",
  );
  const consultantAdapterPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/consultant-result/runtime-40-20-consultant-result-local-adapter.ts",
  );
  const parallelTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-types.ts",
  );
  const parallelServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-service.ts",
  );
  const parallelAdapterPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/parallel-production/runtime-40-20-parallel-production-local-adapter.ts",
  );

  const gatesTypes = transpileModule(gatesTypesPath, {});
  const clientResultTypes = transpileModule(clientResultTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });
  const clientResultService = transpileModule(clientResultServicePath, {
    "./runtime-40-20-client-result-types": clientResultTypes,
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "@supabase/supabase-js": { createClient },
  });
  const consultantTypes = transpileModule(consultantTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "../client-result/runtime-40-20-client-result-types": clientResultTypes,
  });
  const consultantService = transpileModule(consultantServicePath, {
    "./runtime-40-20-consultant-result-types": consultantTypes,
    "./runtime-40-20-consultant-result-local-adapter": {},
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });
  const consultantAdapter = transpileModule(consultantAdapterPath, {
    "./runtime-40-20-consultant-result-types": consultantTypes,
    "./runtime-40-20-consultant-result-service": consultantService,
    "../client-result/runtime-40-20-client-result-types": clientResultTypes,
    "../client-result/runtime-40-20-client-result-service": clientResultService,
    "@supabase/supabase-js": { createClient },
  });
  const parallelTypes = transpileModule(parallelTypesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
    "../consultant-result/runtime-40-20-consultant-result-types": consultantTypes,
  });
  const parallelService = transpileModule(parallelServicePath, {
    "./runtime-40-20-parallel-production-types": parallelTypes,
    "../gates-readiness/runtime-40-20-gates-readiness-types": gatesTypes,
  });
  const parallelAdapter = transpileModule(parallelAdapterPath, {
    "./runtime-40-20-parallel-production-types": parallelTypes,
    "./runtime-40-20-parallel-production-service": parallelService,
    "../consultant-result/runtime-40-20-consultant-result-local-adapter": consultantAdapter,
  });

  return { parallelService, parallelAdapter, consultantAdapter };
}

async function isSupabaseLocalReachable(supabase) {
  try {
    const { error } = await supabase.from("readiness_decision_record").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function main() {
  const { parallelService, parallelAdapter } = loadParallelProductionModules();
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);
  const scope = contextPresence.valid
    ? buildConsultantScopeFromContext(chainContext, {
        consultant_user_id: `consultant-p8-${Date.now()}`,
        idempotency_key:
          chainContext.consultant_idempotency_key ?? `p8-idem-${Date.now()}`,
      })
    : null;

  const localEnv = {
    ...readEnvLocal(),
    ...process.env,
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
    EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      readEnvLocal().NEXT_PUBLIC_SUPABASE_URL ??
      "http://127.0.0.1:54321",
  };

  const blockedEnv = { ...localEnv, EVE_PARALLEL_PRODUCTION_LOCAL_ENABLED: "false" };

  let rehearsal = null;
  if (supabase_local_available && scope && contextPresence.valid) {
    rehearsal = await parallelAdapter.buildParallelProductionRehearsalFromLocal(
      { scope },
      localEnv,
      chainContext,
    );
  }

  const dependency_blocked_default = parallelService.isParallelProductionDependencyBlocked(
    blockedEnv,
  );
  const dependency_unblocked = !parallelService.isParallelProductionDependencyBlocked(localEnv);

  const scr_patch_created = Boolean(rehearsal?.scr_patch?.created_local);
  const evidence_bundle_patch_created = Boolean(rehearsal?.evidence_bundle_patch?.created_local);
  const mdsb_patch_created = Boolean(rehearsal?.mdsb_patch?.created_local);
  const parallel_export_payload_local_created = Boolean(rehearsal?.parallel_export_payload);
  const readiness_state = rehearsal?.rehearsal_blocked_result?.readiness_state ??
    rehearsal?.parallel_export_payload?.readiness_state ??
    null;
  const requires_consultant_review = Boolean(rehearsal?.requires_consultant_review);

  const no_forbidden =
    rehearsal == null || parallelService.validateParallelProductionNoForbiddenFields(rehearsal);

  if (rehearsal?.rehearsal_ref) {
    updateChainContext({
      parallel_rehearsal_ref: rehearsal.rehearsal_ref,
      consultant_packet_ref: chainContext?.consultant_packet_ref ?? null,
      source_trace: [
        { stage: "p8_controlled_parallel_production_local_smoke", at: new Date().toISOString() },
      ],
    });
  }

  const p9ar2Result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_P8_REHEARSAL",
    generated_at: new Date().toISOString(),
    chain_context_ref: chainContext?.context_ref ?? null,
    scope,
    scr_patch_created,
    evidence_bundle_patch_created,
    mdsb_patch_created,
    parallel_export_payload_local_created,
    readiness_state,
    requires_consultant_review,
    production_export_allowed: false,
    parallel_rehearsal_ref: rehearsal?.rehearsal_ref ?? null,
    consultant_packet_ref: chainContext?.consultant_packet_ref ?? null,
    activation_allowed: false,
    qa_green_real_created: false,
  };

  writeFileSync(P9AR2_ARTIFACT_PATHS.p8Results, `${JSON.stringify(p9ar2Result, null, 2)}\n`);

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P8_CONTROLLED_PARALLEL_PRODUCTION_LOCAL_V1",
    generated_at: new Date().toISOString(),
    scope,
    scope_source: contextPresence.valid ? "chain_context" : "unavailable",
    chain_context_ref: chainContext?.context_ref ?? null,
    rehearsal,
    scr_patch_created,
    evidence_bundle_patch_created,
    mdsb_patch_created,
    parallel_export_payload_local_created,
    readiness_state,
    requires_consultant_review,
    production_export_allowed: false,
    external_export_executed: false,
    dependency_blocked_default,
    dependency_unblocked_with_flags: dependency_unblocked,
    no_forbidden_fields: no_forbidden,
    supabase_local_available,
    diagnosis_final_created: false,
    diagnostic_label_created: false,
    pathology_classification_created: false,
    registry_final_created: false,
    ir_final_created: false,
    diagram_export_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (
    !supabase_local_available ||
    !contextPresence.valid ||
    !scr_patch_created ||
    !evidence_bundle_patch_created ||
    !mdsb_patch_created ||
    !dependency_blocked_default ||
    !no_forbidden
  ) {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
