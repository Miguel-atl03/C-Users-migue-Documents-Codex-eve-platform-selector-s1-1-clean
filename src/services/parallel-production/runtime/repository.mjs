import { createClient } from "@supabase/supabase-js";
import { PARALLEL_RUNTIME_ADAPTER, nowIso } from "./shared.mjs";

const TABLE_NAME = "parallel_production_runtime_artifacts";

const resolveServiceRoleClient = (env = process.env) => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key =
    env.MBA_SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? null;
  if (!url || !key) {
    return {
      client: null,
      error_code: !url
        ? "PARALLEL_RUNTIME_SUPABASE_URL_MISSING"
        : "PARALLEL_RUNTIME_SERVICE_ROLE_MISSING",
      error_message: !url
        ? "NEXT_PUBLIC_SUPABASE_URL is required for runtime artifact persistence."
        : "MBA_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is required for runtime artifact persistence.",
    };
  }
  return {
    client: createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    error_code: null,
    error_message: null,
  };
};

const compactStoredArtifact = (artifact) => ({
  artifact_id: artifact.artifact_id,
  artifact_type: artifact.artifact_type,
  artifact_status: artifact.artifact_status,
  case_id: artifact.case_id,
  session_id: artifact.session_id,
  correlation_id: artifact.correlation_id,
  source_artifact_id: artifact.source_artifact_id ?? null,
  source_step: artifact.source_step,
  source_adapter: artifact.source_adapter ?? PARALLEL_RUNTIME_ADAPTER,
  run_id: artifact.run_id,
  warnings: artifact.warnings ?? [],
  gaps: artifact.gaps ?? [],
  payload: artifact.payload ?? {},
  created_at: artifact.created_at ?? nowIso(),
  updated_at: nowIso(),
});

export async function persistParallelRuntimeArtifact(artifact, { env = process.env } = {}) {
  const serviceRole = resolveServiceRoleClient(env);
  if (!serviceRole.client) {
    return {
      persisted: false,
      error_code: serviceRole.error_code,
      error_message: serviceRole.error_message,
      table_name: TABLE_NAME,
    };
  }

  const row = compactStoredArtifact(artifact);
  const { error } = await serviceRole.client.from(TABLE_NAME).upsert(row, {
    onConflict: "artifact_type,session_id,run_id",
  });
  if (error) {
    return {
      persisted: false,
      error_code: error.code ?? "PARALLEL_RUNTIME_PERSISTENCE_ERROR",
      error_message: error.message ?? "Failed to persist runtime artifact.",
      table_name: TABLE_NAME,
    };
  }

  return {
    persisted: true,
    error_code: null,
    error_message: null,
    table_name: TABLE_NAME,
  };
}

export async function readLatestParallelRuntimeArtifact(
  { sessionId, artifactType },
  { env = process.env } = {},
) {
  const serviceRole = resolveServiceRoleClient(env);
  if (!serviceRole.client) {
    return {
      artifact: null,
      error_code: serviceRole.error_code,
      error_message: serviceRole.error_message,
    };
  }
  const { data, error } = await serviceRole.client
    .from(TABLE_NAME)
    .select("*")
    .eq("session_id", sessionId)
    .eq("artifact_type", artifactType)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    return {
      artifact: null,
      error_code: error.code ?? "PARALLEL_RUNTIME_READ_ERROR",
      error_message: error.message ?? "Failed to read runtime artifact.",
    };
  }
  return {
    artifact: Array.isArray(data) ? data[0] ?? null : null,
    error_code: null,
    error_message: null,
  };
}
