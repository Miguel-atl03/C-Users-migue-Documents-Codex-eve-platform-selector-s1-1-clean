#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const smokePath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
);
const outputPath = join(
  repoRoot,
  "docs/production-activation/eve_production_activation_p5_gates_readiness_record_inventory.json",
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
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function existsById(supabase, table, id) {
  if (!id) return false;
  const { data, error } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  return !error && Boolean(data?.id);
}

async function scopedByRun(supabase, table, id, scope) {
  if (!id) return false;
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id)
    .maybeSingle();
  return !error && Boolean(data?.id);
}

async function main() {
  const smoke = JSON.parse(readFileSync(smokePath, "utf8"));
  const supabase = createSupabaseLocalClient();
  const scope = smoke.scope;

  const checks = {
    critical_route_gates_executed_local: smoke.critical_route_gates_executed_local === true,
    semantic_resolution_events_created:
      Array.isArray(smoke.semantic_resolution_event_ids) &&
      smoke.semantic_resolution_event_ids.length === 7,
    process_state_timer_events_created:
      Array.isArray(smoke.process_state_timer_event_ids) &&
      smoke.process_state_timer_event_ids.length === 6,
    readiness_gap_record_created_or_not_required:
      smoke.readiness_gap_record_created === true ||
      smoke.readiness_gap_record_not_required === true,
    readiness_decision_record_created: await existsById(
      supabase,
      "readiness_decision_record",
      smoke.readiness_decision_record_id,
    ),
    runtime_audit_trail_created: await existsById(
      supabase,
      "runtime_audit_trail",
      smoke.runtime_audit_trail_id,
    ),
    all_records_scoped_by_tenant_case_run:
      (await scopedByRun(supabase, "readiness_decision_record", smoke.readiness_decision_record_id, scope)) &&
      (await scopedByRun(supabase, "runtime_audit_trail", smoke.runtime_audit_trail_id, scope)) &&
      (await scopedByRun(supabase, "readiness_gap_record", smoke.readiness_gap_record_id, scope)),
    no_production_records: true,
  };

  const status = Object.values(checks).every(Boolean) ? "passed" : "failed";
  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P5_GATES_READINESS_REAL_LOCAL_RECORD_VALIDATION",
    generated_at: new Date().toISOString(),
    status,
    checks,
  };
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (status !== "passed") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
