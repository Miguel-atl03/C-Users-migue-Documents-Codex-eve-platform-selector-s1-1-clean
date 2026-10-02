#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
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

function loadConsultantModules() {
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

  return { consultantService, consultantAdapter };
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
  const { consultantService, consultantAdapter } = loadConsultantModules();
  const supabase = createSupabaseLocalClient();
  const supabase_local_available = await isSupabaseLocalReachable(supabase);
  const chainContext = readChainContext();
  const contextPresence = validateChainContextPresence(chainContext);

  const scope = contextPresence.valid
    ? buildConsultantScopeFromContext(chainContext, {
        consultant_user_id: `consultant-${Date.now()}`,
        idempotency_key: `p7-idem-${Date.now()}`,
      })
    : null;

  const localEnv = {
    ...readEnvLocal(),
    ...process.env,
    EVE_RUNTIME_40_20_LOCAL_ENABLED: "true",
    EVE_GATES_READINESS_LOCAL_ENABLED: "true",
    EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED: "true",
    EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      readEnvLocal().NEXT_PUBLIC_SUPABASE_URL ??
      "http://127.0.0.1:54321",
  };

  const blockedEnv = { ...localEnv, EVE_CONSULTANT_REVIEW_PACKET_LOCAL_ENABLED: "false" };

  let packet = null;
  let missing_components = contextPresence.valid ? [] : contextPresence.missing;
  let local_server_side_service_access_used = false;

  if (supabase_local_available && scope && contextPresence.valid) {
    const chainRead = await consultantAdapter.readConsultantLocalSnapshotFromChainContext(
      chainContext,
      scope,
      localEnv,
    );
    missing_components = chainRead.missing_components;
    local_server_side_service_access_used = chainRead.local_server_side_service_access_used;
    if (chainRead.snapshot) {
      packet = consultantService.buildConsultantReviewPacketDTO(
        { scope },
        chainRead.snapshot,
      );
    }
  }

  const dependency_blocked_default = consultantService.isConsultantReviewPacketDependencyBlocked(
    blockedEnv,
  );
  const dependency_unblocked = !consultantService.isConsultantReviewPacketDependencyBlocked(
    localEnv,
  );

  const consultant_review_packet_created = Boolean(packet?.packet_safe);
  const session_summary_present = Boolean(packet?.session_summary?.tenant_id);
  const activity_summary_present = Boolean(packet?.activity_summary?.run_id);
  const evidence_present = Array.isArray(packet?.evidence_items);
  const canonical_variables_present = Array.isArray(packet?.canonical_variables);
  const readiness_decision_present = Boolean(
    packet?.readiness_decision?.readiness_decision_record_id,
  );
  const audit_trail_present = Array.isArray(packet?.audit_trail) && packet.audit_trail.length > 0;
  const readiness_gaps_or_canonical_ok =
    (packet?.readiness_gaps?.length ?? 0) > 0 || (packet?.canonical_variables?.length ?? 0) > 0;

  const no_forbidden =
    packet == null || consultantService.validateConsultantReviewPacketNoForbiddenFields(packet);

  if (consultant_review_packet_created && packet?.packet_ref) {
    updateChainContext({
      consultant_packet_ref: packet.packet_ref,
      consultant_idempotency_key: scope.idempotency_key,
      local_server_side_service_access_used,
      source_trace: [{ stage: "p7_consultant_review_packet_local_smoke", at: new Date().toISOString() }],
    });
  }

  const p9ar2Result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9AR2_P7_PACKET",
    generated_at: new Date().toISOString(),
    chain_context_ref: chainContext?.context_ref ?? null,
    scope,
    missing_components,
    consultant_review_packet_created,
    session_summary_present,
    activity_summary_present,
    readiness_decision_present,
    audit_trail_present,
    readiness_gaps_or_canonical_ok,
    client_safe_result_included: Boolean(packet?.client_safe_result),
    local_server_side_service_access_used,
    consultant_packet_ref: packet?.packet_ref ?? null,
    activation_allowed: false,
    qa_green_real_created: false,
  };

  writeFileSync(P9AR2_ARTIFACT_PATHS.p7Results, `${JSON.stringify(p9ar2Result, null, 2)}\n`);

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P7_CONSULTANT_REVIEW_PACKET_LOCAL_V1",
    generated_at: new Date().toISOString(),
    scope,
    scope_source: contextPresence.valid ? "chain_context" : "unavailable",
    chain_context_ref: chainContext?.context_ref ?? null,
    missing_components,
    consultant_review_packet: packet,
    consultant_review_packet_created,
    session_summary_present,
    activity_summary_present,
    answers_subfields_present: Array.isArray(packet?.answers_and_subfields),
    evidence_present,
    canonical_variables_present,
    readiness_gaps_present_or_not_required: Array.isArray(packet?.readiness_gaps),
    gate_summaries_present: Array.isArray(packet?.gate_summaries),
    readiness_decision_present,
    audit_trail_present,
    client_safe_result_included: Boolean(packet?.client_safe_result),
    dependency_blocked_default,
    dependency_unblocked_with_flags: dependency_unblocked,
    no_forbidden_fields: no_forbidden,
    supabase_local_available,
    local_server_side_service_access_used,
    diagnosis_final_auto_created: false,
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
    !consultant_review_packet_created ||
    !session_summary_present ||
    !activity_summary_present ||
    !readiness_decision_present ||
    !audit_trail_present ||
    !readiness_gaps_or_canonical_ok ||
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
