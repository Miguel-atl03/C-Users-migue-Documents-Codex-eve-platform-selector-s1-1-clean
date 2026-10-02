#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p4_runtime_real_local_smoke_results.json",
);
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p4_runtime_real_record_inventory.json",
);

function readEnvLocal() {
  try {
    const raw = readFileSync(join(repoRoot, ".env.local"), "utf8");
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
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
  if (!url || !key) throw new Error("Missing local Supabase credentials.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function existsById(supabase, table, id) {
  if (!id) return false;
  const { data, error } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  return !error && Boolean(data?.id);
}

async function main() {
  const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
  const supabase = createSupabaseLocalClient();

  const checks = {
    role_runtime_session: await existsById(supabase, "role_runtime_session", smoke.role_runtime_session_id),
    activity_runtime_run: await existsById(supabase, "activity_runtime_run", smoke.activity_runtime_run_id),
    runtime_interaction_instance: await existsById(
      supabase,
      "runtime_interaction_instance",
      smoke.runtime_interaction_instance_id,
    ),
    runtime_subfield_response:
      Array.isArray(smoke.runtime_subfield_response_ids) && smoke.runtime_subfield_response_ids.length > 0
        ? await existsById(
            supabase,
            "runtime_subfield_response",
            smoke.runtime_subfield_response_ids[0],
          )
        : false,
    evidence_item: await existsById(supabase, "evidence_item", smoke.evidence_item_id),
    canonical_variable_record: await existsById(
      supabase,
      "canonical_variable_record",
      smoke.canonical_variable_record_id,
    ),
    readiness_gap_record: smoke.readiness_gap_record_id
      ? await existsById(supabase, "readiness_gap_record", smoke.readiness_gap_record_id)
      : false,
    runtime_audit_trail: await existsById(supabase, "runtime_audit_trail", smoke.runtime_audit_trail_id),
    readiness_decision_record: await existsById(
      supabase,
      "readiness_decision_record",
      smoke.readiness_decision_record_id ?? null,
    ),
  };

  const result = {
    dictamen:
      "EVE_PRODUCTION_ACTIVATION_P4_RUNTIME_40_20_REAL_BEHIND_SIGNIFICADO_LOCAL_RECORD_VALIDATION",
    generated_at: new Date().toISOString(),
    status:
      checks.role_runtime_session &&
      checks.activity_runtime_run &&
      checks.runtime_interaction_instance &&
      checks.runtime_subfield_response &&
      checks.evidence_item &&
      (checks.canonical_variable_record || checks.readiness_gap_record) &&
      checks.runtime_audit_trail &&
      !checks.readiness_decision_record
        ? "passed"
        : "failed",
    checks,
  };

  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "passed") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
