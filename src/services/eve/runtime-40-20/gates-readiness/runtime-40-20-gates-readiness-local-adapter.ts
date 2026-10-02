import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Runtime40_20GatesReadinessService } from "./runtime-40-20-gates-readiness-service";
import type {
  EVEProductionGateReadinessScope,
  EVEProductionReadinessEvaluationRequest,
  EVEProductionReadinessState,
  EVEProductionSemanticGateRequest,
  EVEProductionProcessStateTimerGateRequest,
} from "./runtime-40-20-gates-readiness-types";

const RUNTIME_LOCAL_FLAG = "EVE_RUNTIME_40_20_LOCAL_ENABLED";
const GATES_LOCAL_FLAG = "EVE_GATES_READINESS_LOCAL_ENABLED";
const SERVICE_ROLE_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export interface Runtime40_20GatesReadinessLocalAdapterConfig {
  enabled: boolean;
  local_target_available: boolean;
  blocked_reason: string | null;
  supabase_url: string | null;
  service_role_key_name: string | null;
  production_supabase_touched: false;
  remote_modified: false;
  activation_allowed: false;
}

function resolveServiceRole(env: NodeJS.ProcessEnv) {
  for (const keyName of SERVICE_ROLE_KEYS) {
    if (env[keyName]) return { keyName, key: env[keyName] as string };
  }
  return { keyName: null, key: null };
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/i.test(url);
}

export function resolveRuntime40_20GatesReadinessLocalAdapterConfig(
  env: NodeJS.ProcessEnv = process.env,
): Runtime40_20GatesReadinessLocalAdapterConfig {
  const runtimeEnabled = env[RUNTIME_LOCAL_FLAG] === "true";
  const gatesEnabled = env[GATES_LOCAL_FLAG] === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const serviceRole = resolveServiceRole(env);

  if (!runtimeEnabled) {
    return {
      enabled: false,
      local_target_available: false,
      blocked_reason: "runtime_local_flag_disabled",
      supabase_url: supabaseUrl,
      service_role_key_name: serviceRole.keyName,
      production_supabase_touched: false,
      remote_modified: false,
      activation_allowed: false,
    };
  }
  if (!gatesEnabled) {
    return {
      enabled: false,
      local_target_available: false,
      blocked_reason: "gates_readiness_local_flag_disabled",
      supabase_url: supabaseUrl,
      service_role_key_name: serviceRole.keyName,
      production_supabase_touched: false,
      remote_modified: false,
      activation_allowed: false,
    };
  }
  if (!supabaseUrl || !isLocalSupabaseUrl(supabaseUrl)) {
    return {
      enabled: true,
      local_target_available: false,
      blocked_reason: "supabase_url_not_local",
      supabase_url: supabaseUrl,
      service_role_key_name: serviceRole.keyName,
      production_supabase_touched: false,
      remote_modified: false,
      activation_allowed: false,
    };
  }
  if (!serviceRole.key || !serviceRole.keyName) {
    return {
      enabled: true,
      local_target_available: false,
      blocked_reason: "service_role_key_missing",
      supabase_url: supabaseUrl,
      service_role_key_name: null,
      production_supabase_touched: false,
      remote_modified: false,
      activation_allowed: false,
    };
  }
  return {
    enabled: true,
    local_target_available: true,
    blocked_reason: null,
    supabase_url: supabaseUrl,
    service_role_key_name: serviceRole.keyName,
    production_supabase_touched: false,
    remote_modified: false,
    activation_allowed: false,
  };
}

function createLocalSupabaseClient(env: NodeJS.ProcessEnv = process.env): SupabaseClient {
  const config = resolveRuntime40_20GatesReadinessLocalAdapterConfig(env);
  const key = resolveServiceRole(env).key;
  if (!config.local_target_available || !config.supabase_url || !key) {
    throw new Error("Gates-readiness local adapter is not available.");
  }
  return createClient(config.supabase_url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function validateScopeOrThrow(scope: Partial<EVEProductionGateReadinessScope>) {
  const result = Runtime40_20GatesReadinessService.validateGateReadinessScope(scope);
  if (!result.valid) {
    throw new Error(`invalid_gates_readiness_scope:${result.blocking_reasons.join(",")}`);
  }
  return result.scope;
}

export async function createSemanticEventLocal(
  request: Omit<EVEProductionSemanticGateRequest, "scope"> & {
    scope: Partial<EVEProductionGateReadinessScope>;
  },
  supabase?: SupabaseClient,
) {
  const scope = validateScopeOrThrow(request.scope);
  const client = supabase ?? createLocalSupabaseClient();
  return Runtime40_20GatesReadinessService.createSemanticResolutionEvent(client, {
    ...request,
    scope,
  });
}

export async function createProcessTimerEventLocal(
  request: Omit<EVEProductionProcessStateTimerGateRequest, "scope"> & {
    scope: Partial<EVEProductionGateReadinessScope>;
  },
  supabase?: SupabaseClient,
) {
  const scope = validateScopeOrThrow(request.scope);
  const client = supabase ?? createLocalSupabaseClient();
  return Runtime40_20GatesReadinessService.createProcessStateTimerEvent(client, {
    ...request,
    scope,
  });
}

export async function createReadinessDecisionLocal(
  request: Omit<EVEProductionReadinessEvaluationRequest, "scope"> & {
    scope: Partial<EVEProductionGateReadinessScope>;
    reason: string;
    forced_state?: EVEProductionReadinessState;
  },
  supabase?: SupabaseClient,
) {
  const scope = validateScopeOrThrow(request.scope);
  const client = supabase ?? createLocalSupabaseClient();
  const normalizedRequest: EVEProductionReadinessEvaluationRequest = { ...request, scope };
  const evaluation =
    Runtime40_20GatesReadinessService.resolveReadinessEvaluation(normalizedRequest);
  const state = request.forced_state ?? evaluation.readiness_state;
  const reason =
    evaluation.blocking_reason && !request.forced_state
      ? evaluation.blocking_reason
      : request.reason;

  if (evaluation.readiness_gap && !request.forced_state) {
    await Runtime40_20GatesReadinessService.createReadinessGapRecord(
      client,
      evaluation.readiness_gap,
    );
  }

  return Runtime40_20GatesReadinessService.createReadinessDecisionRecord(
    client,
    Runtime40_20GatesReadinessService.buildReadinessDecisionRecordInsert({
      request: normalizedRequest,
      readiness_state: state,
      reason,
    }),
  );
}

export const Runtime40_20GatesReadinessLocalAdapter = {
  resolveRuntime40_20GatesReadinessLocalAdapterConfig,
  createSemanticEventLocal,
  createProcessTimerEventLocal,
  createReadinessDecisionLocal,
};
