import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Runtime40_20RuntimeRealService,
  validateProductionRuntimeScope,
} from "./runtime-40-20-runtime-real-service";
import type {
  EVEProductionRuntimeAnswerIngestRequest,
  EVEProductionRuntimeInteractionRequest,
  EVEProductionRuntimeRunRequest,
  EVEProductionRuntimeScope,
  EVEProductionRuntimeSessionRequest,
} from "./runtime-40-20-runtime-real-types";

const LOCAL_FLAG_NAME = "EVE_RUNTIME_40_20_LOCAL_ENABLED";
export const EVE_RUNTIME_40_20_LOCAL_CATALOG_VERSION_ID =
  "00000000-0000-4000-8000-000000000040";

const SERVICE_ROLE_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export interface Runtime40_20RuntimeRealLocalAdapterConfig {
  enabled: boolean;
  local_target_available: boolean;
  blocked_reason: string | null;
  supabase_url: string | null;
  service_role_key_name: string | null;
  runtime_real_started_in_local_only: boolean;
  production_supabase_touched: false;
  remote_modified: false;
  service_role_exposed: false;
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

export function resolveRuntime40_20RuntimeRealLocalAdapterConfig(
  env: NodeJS.ProcessEnv = process.env,
): Runtime40_20RuntimeRealLocalAdapterConfig {
  const enabled = env[LOCAL_FLAG_NAME] === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const serviceRole = resolveServiceRole(env);

  if (!enabled) {
    return {
      enabled: false,
      local_target_available: false,
      blocked_reason: "runtime_local_flag_disabled",
      supabase_url: supabaseUrl,
      service_role_key_name: serviceRole.keyName,
      runtime_real_started_in_local_only: false,
      production_supabase_touched: false,
      remote_modified: false,
      service_role_exposed: false,
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
      runtime_real_started_in_local_only: false,
      production_supabase_touched: false,
      remote_modified: false,
      service_role_exposed: false,
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
      runtime_real_started_in_local_only: false,
      production_supabase_touched: false,
      remote_modified: false,
      service_role_exposed: false,
      activation_allowed: false,
    };
  }

  return {
    enabled: true,
    local_target_available: true,
    blocked_reason: null,
    supabase_url: supabaseUrl,
    service_role_key_name: serviceRole.keyName,
    runtime_real_started_in_local_only: true,
    production_supabase_touched: false,
    remote_modified: false,
    service_role_exposed: false,
    activation_allowed: false,
  };
}

function createRuntimeLocalSupabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient {
  const config = resolveRuntime40_20RuntimeRealLocalAdapterConfig(env);
  const key = resolveServiceRole(env).key;
  if (!config.local_target_available || !config.supabase_url || !key) {
    throw new Error("Runtime local adapter is not available.");
  }
  return createClient(config.supabase_url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function validateScopeOrThrow(scope: Partial<EVEProductionRuntimeScope>) {
  const result = validateProductionRuntimeScope(scope);
  if (!result.valid) {
    throw new Error(`invalid_runtime_scope:${result.blocking_reasons.join(",")}`);
  }
  return result.scope;
}

export async function createRuntimeSessionAndRunLocal(
  input: {
    scope: Partial<EVEProductionRuntimeScope>;
    catalog_version_id: string;
    actor_user_id?: string | null;
    session_state?: EVEProductionRuntimeSessionRequest["state"];
    run_state?: EVEProductionRuntimeRunRequest["state"];
  },
  supabase?: SupabaseClient,
) {
  const scope = validateScopeOrThrow(input.scope);
  const client = supabase ?? createRuntimeLocalSupabaseClient();

  const roleRuntimeSessionId = await Runtime40_20RuntimeRealService.createRoleRuntimeSession(
    client,
    {
      scope,
      catalog_version_id: input.catalog_version_id,
      state: input.session_state,
      created_by: input.actor_user_id ?? null,
    },
  );

  const run = await Runtime40_20RuntimeRealService.createActivityRuntimeRun(client, {
    scope,
    role_runtime_session_id: roleRuntimeSessionId,
    catalog_version_id: input.catalog_version_id,
    state: input.run_state ?? "initialized",
    created_by: input.actor_user_id ?? null,
  });

  return { role_runtime_session_id: roleRuntimeSessionId, activity_runtime_run_id: run.id };
}

export async function createInteractionAndAnswerLocal(
  input: {
    interaction: Omit<EVEProductionRuntimeInteractionRequest, "scope"> & {
      scope: Partial<EVEProductionRuntimeScope>;
    };
    answer: Omit<EVEProductionRuntimeAnswerIngestRequest, "scope" | "interaction_instance_id">;
    actor_user_id?: string | null;
  },
  supabase?: SupabaseClient,
) {
  const scope = validateScopeOrThrow(input.interaction.scope);
  const client = supabase ?? createRuntimeLocalSupabaseClient();

  const interactionId = await Runtime40_20RuntimeRealService.createRuntimeInteractionInstance(
    client,
    { ...input.interaction, scope, created_by: input.actor_user_id ?? null },
  );

  const responseIds = await Runtime40_20RuntimeRealService.ingestRuntimeAnswerSubfields(client, {
    scope,
    interaction_instance_id: interactionId,
    subfields: input.answer.subfields,
    created_by: input.actor_user_id ?? null,
  });

  return {
    runtime_interaction_instance_id: interactionId,
    runtime_subfield_response_ids: responseIds,
  };
}

export const Runtime40_20RuntimeRealLocalAdapter = {
  resolveRuntime40_20RuntimeRealLocalAdapterConfig,
  createRuntimeSessionAndRunLocal,
  createInteractionAndAnswerLocal,
};
