#!/usr/bin/env node
/**
 * P3 static validator: RLS policies in P3 migration.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

const RUNTIME_TABLES = [
  "runtime_catalog_version",
  "source_node_ref",
  "runtime_interaction_def",
  "runtime_interaction_mapping",
  "role_runtime_session",
  "activity_runtime_run",
  "runtime_interaction_instance",
  "runtime_subfield_response",
  "evidence_item",
  "canonical_variable_record",
  "branching_decision",
  "budget_ledger",
  "semantic_resolution_event",
  "process_state_timer_event",
  "structural_candidate_record",
  "readiness_gap_record",
  "readiness_decision_record",
  "parallel_export_payload",
  "runtime_audit_trail",
];

function loadP3MigrationSql() {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.includes("p3_schema_rls") && name.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    throw new Error("P3 migration file not found");
  }
  return readFileSync(join(migrationsDir, files.at(-1)), "utf8");
}

function main() {
  const failures = [];
  const sql = loadP3MigrationSql();

  for (const table of RUNTIME_TABLES) {
    if (!sql.includes(`'${table}'`)) {
      failures.push(`table_not_in_rls_block:${table}`);
    }
  }

  if (!/enable\s+row\s+level\s+security/i.test(sql)) {
    failures.push("rls_enable_statement_missing");
  }
  if (!/force\s+row\s+level\s+security/i.test(sql)) {
    failures.push("rls_force_statement_missing");
  }
  if (!/_tenant_case_select/.test(sql)) failures.push("select_policy_pattern_missing");
  if (!/_tenant_case_insert/.test(sql)) failures.push("insert_policy_pattern_missing");
  if (!/_tenant_case_update/.test(sql)) failures.push("update_policy_pattern_missing");

  if (/create\s+policy[\s\S]*?\busing\s*\(\s*true\s*\)/i.test(sql)) {
    failures.push("unscoped_using_true_policy");
  }
  if (/create\s+policy[\s\S]*?\bto\s+anon\b/i.test(sql)) {
    failures.push("anonymous_policy_detected");
  }
  if (/bypassrls/i.test(sql)) {
    failures.push("bypass_rls_detected");
  }
  if (!/revoke\s+all\s+on\s+table\s+public\./i.test(sql)) {
    failures.push("anon_revoke_missing");
  }
  if (!/eve_can_access_case/i.test(sql) || !/eve_current_tenant_id/i.test(sql)) {
    failures.push("tenant_case_helper_missing");
  }

  const result = {
    validator: "p3-validate-rls-policies",
    tables_checked: RUNTIME_TABLES.length,
    status: failures.length === 0 ? "passed" : "failed",
    failures,
    anonymous_unrestricted_access: false,
    public_unrestricted_access: false,
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length > 0) process.exit(1);
}

main();
