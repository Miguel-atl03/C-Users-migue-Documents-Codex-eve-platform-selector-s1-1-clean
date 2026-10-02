#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import {
  P9AR2_ARTIFACT_PATHS,
  readChainContext,
  updateChainContext,
  validateChainContextPresence,
} from "./local-activation-chain-context-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json",
);
const p5SmokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
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

function loadClientResultService() {
  const servicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-service.ts",
  );
  const typesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts",
  );
  const gatesTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/gates-readiness/runtime-40-20-gates-readiness-types.ts",
  );
  const bffServicePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts",
  );
  const bffTypesPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-types.ts",
  );

  const typesModule = transpileModule(typesPath, {
    "../gates-readiness/runtime-40-20-gates-readiness-types": transpileModule(gatesTypesPath, {}),
  });
  const serviceModule = transpileModule(servicePath, {
    "./runtime-40-20-client-result-types": typesModule,
    "../gates-readiness/runtime-40-20-gates-readiness-types": transpileModule(gatesTypesPath, {}),
    "@supabase/supabase-js": { createClient },
  });
  const bffTypesModule = transpileModule(bffTypesPath, {});
  const bffServiceModule = transpileModule(bffServicePath, {
    "./runtime-40-20-client-bff-types": bffTypesModule,
    "../client-result/runtime-40-20-client-result-service": serviceModule,
    "../gates-readiness/runtime-40-20-gates-readiness-types": transpileModule(gatesTypesPath, {}),
  });
  return { clientResult: serviceModule, bff: bffServiceModule };
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

async function isSupabaseLocalReachable(supabase) {
  try {
    const { error } = await supabase.from("readiness_decision_record").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function resolveScopeFromChainContext(chainContext) {
  if (!chainContext) return null;
  const presence = validateChainContextPresence(chainContext);
  if (!presence.valid) return { error: presence.missing[0] ?? "missing_context" };
  return {
    scope: {
      tenant_id: chainContext.tenant_id,
      case_id: chainContext.case_id,
      role_id: chainContext.role_id,
      activity_id: chainContext.activity_id,
      run_id: chainContext.run_id,
      correlation_id: chainContext.source_trace?.[0]?.correlation_id ?? `p6-${Date.now()}`,
    },
    chainContext,
    readiness_state: chainContext.readiness_state,
    source: "chain_context",
  };
}

async function resolveScopeFromP5OrFixture(supabase) {
  const chainResolved = await resolveScopeFromChainContext(readChainContext());
  if (chainResolved && !chainResolved.error) return chainResolved;

  if (existsSync(p5SmokePath)) {
    const p5 = JSON.parse(readFileSync(p5SmokePath, "utf8"));
    if (p5.scope?.tenant_id && p5.scope?.case_id && p5.scope?.run_id) {
      const decision = await supabase
        .from("readiness_decision_record")
        .select("readiness_state")
        .eq("id", p5.readiness_decision_record_id)
        .maybeSingle();
      if (!decision.error && decision.data) {
        return {
          scope: {
            tenant_id: p5.scope.tenant_id,
            case_id: p5.scope.case_id,
            run_id: p5.scope.run_id,
            correlation_id: p5.scope.correlation_id ?? `p6-${Date.now()}`,
          },
          readiness_state: decision.data.readiness_state,
          source: "p5_smoke_record",
        };
      }
    }
  }

  const tenant_id = crypto.randomUUID();
  const case_id = crypto.randomUUID();
  const role_id = crypto.randomUUID();
  const activity_id = crypto.randomUUID();
  const run_id = crypto.randomUUID();
  const correlation_id = `p6-fixture-${Date.now()}`;
  const readiness_state = "ready_with_flags";

  const { error: insertError } = await supabase.from("readiness_decision_record").insert({
    tenant_id,
    case_id,
    role_id,
    activity_id,
    run_id,
    role_runtime_session_id: crypto.randomUUID(),
    readiness_state,
    dominant_gate: "B3_C09",
    reason: "p6_fixture_readiness",
    reentry_target: null,
    manual_review_required: false,
    correlation_id,
    idempotency_key: `p6-fixture-idem-${Date.now()}`,
    source_trace: [{ stage: "p6_client_safe_result_local_smoke" }],
    metadata: { local_only: true, fixture: true },
  });
  if (insertError) {
    return {
      scope: { tenant_id, case_id, run_id, correlation_id },
      readiness_state,
      source: "p6_mapper_only_fixture",
      fixture_insert_failed: true,
    };
  }

  return {
    scope: { tenant_id, case_id, run_id, correlation_id },
    readiness_state,
    source: "p6_fixture",
  };
}

async function main() {
  const { clientResult, bff } = loadClientResultService();
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const resolved = await resolveScopeFromP5OrFixture(supabase);
  const chainContext = resolved?.chainContext ?? readChainContext();

  const localEnv = {
    ...readEnvLocal(),
    ...process.env,
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      readEnvLocal().NEXT_PUBLIC_SUPABASE_URL ??
      "http://127.0.0.1:54321",
  };

  const blockedEnv = {
    ...localEnv,
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "false",
  };

  let chainReadFailure = null;
  let local_server_side_service_access_used = false;

  const dtoFromMapper = clientResult.buildClientSafeResultDTO({
    scope: resolved?.scope ?? { tenant_id: "", case_id: "", run_id: "", correlation_id: "" },
    readiness_state: resolved?.readiness_state ?? chainContext?.readiness_state ?? "ready_with_flags",
  });

  let dtoFromLocal = null;
  if (supabase_local_available && resolved?.scope && chainContext) {
    const chainRead = await clientResult.readLocalReadinessByDecisionId(
      chainContext,
      resolved.scope,
      localEnv,
    );
    dtoFromLocal = chainRead.dto;
    chainReadFailure = chainRead.failure;
    local_server_side_service_access_used = chainRead.local_server_side_service_access_used;
    if (!resolved.readiness_state && chainRead.readiness_state) {
      resolved.readiness_state = chainRead.readiness_state;
    }
  } else if (supabase_local_available && resolved?.scope) {
    dtoFromLocal = await clientResult.buildClientSafeResultFromLocalReadiness(
      resolved.scope,
      localEnv,
    );
    local_server_side_service_access_used = clientResult.isLocalServerSideServiceAccessUsed(localEnv);
  }

  const bffReviewDto = bff.buildBFFSafeReviewResultDTO(
    {
      scope: {
        ...(resolved?.scope ?? { tenant_id: "", case_id: "", run_id: "", correlation_id: "" }),
        tenant_id: resolved?.scope?.tenant_id ?? "",
        case_id: resolved?.scope?.case_id ?? "",
      },
    },
    resolved?.readiness_state ?? chainContext?.readiness_state ?? "ready_with_flags",
  );

  const mapper_valid =
    dtoFromMapper.client_safe === true &&
    clientResult.validateClientSafeResultNoInternalLeakage(dtoFromMapper);
  const local_read_valid = dtoFromLocal
    ? clientResult.validateClientSafeResultNoInternalLeakage(dtoFromLocal)
    : false;

  const client_safe_result_dto_valid =
    mapper_valid &&
    bff.validateBFFSafeReviewResultNoLeakage(bffReviewDto) &&
    (supabase_local_available ? local_read_valid : mapper_valid);

  const bff_review_safe_under_flags = !bff.isBFFReviewDependencyBlockedForP5(localEnv);
  const bff_dependency_blocked_without_flags = bff.isBFFReviewDependencyBlockedForP5(blockedEnv);

  const client_visible_result_safe =
    client_safe_result_dto_valid && Boolean(dtoFromLocal ?? dtoFromMapper);

  if (client_visible_result_safe && chainContext && (dtoFromLocal ?? dtoFromMapper)) {
    updateChainContext({
      client_visible_state: (dtoFromLocal ?? dtoFromMapper).visible_state,
      readiness_state: resolved?.readiness_state ?? chainContext.readiness_state,
      local_server_side_service_access_used,
      source_trace: [{ stage: "p6_client_safe_result_local_smoke", at: new Date().toISOString() }],
    });
  }

  const p9ar2Result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_P6_LIVE_READ",
    generated_at: new Date().toISOString(),
    chain_context_ref: chainContext?.context_ref ?? null,
    scope: resolved?.scope ?? null,
    readiness_source: resolved?.source ?? resolved?.error ?? "unavailable",
    chain_read_failure: chainReadFailure,
    local_read_valid,
    client_safe_result_dto_valid,
    client_visible_result_safe,
    local_server_side_service_access_used,
    readiness_decision_record_id: chainContext?.readiness_decision_record_id ?? null,
    activation_allowed: false,
    qa_green_real_created: false,
  };

  writeFileSync(P9AR2_ARTIFACT_PATHS.p6Results, `${JSON.stringify(p9ar2Result, null, 2)}\n`);

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P6_CLIENT_SAFE_RESULT_LOCAL_V1",
    generated_at: new Date().toISOString(),
    scope: resolved?.scope ?? null,
    chain_context_ref: chainContext?.context_ref ?? null,
    readiness_source: resolved?.source ?? resolved?.error ?? "unavailable",
    chain_read_failure: chainReadFailure,
    local_server_side_service_access_used,
    readiness_state_internal_only: resolved?.readiness_state ?? chainContext?.readiness_state ?? null,
    client_safe_result_dto: dtoFromLocal ?? dtoFromMapper,
    client_safe_result_dto_valid,
    bff_review_safe_under_flags,
    bff_dependency_blocked_without_flags,
    client_visible_result_safe:
      client_safe_result_dto_valid &&
      (supabase_local_available ? local_read_valid : mapper_valid),
    client_final_diagnosis_visible: false,
    no_internal_leakage: clientResult.validateClientSafeResultNoInternalLeakage(
      dtoFromLocal ?? dtoFromMapper,
    ),
    supabase_local_available,
    mapper_valid,
    local_read_valid,
    diagnosis_created: false,
    export_real_created: false,
    produccion_paralela_started: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (
    !client_safe_result_dto_valid ||
    !bff_review_safe_under_flags ||
    !bff_dependency_blocked_without_flags ||
    (supabase_local_available && !local_read_valid)
  ) {
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
