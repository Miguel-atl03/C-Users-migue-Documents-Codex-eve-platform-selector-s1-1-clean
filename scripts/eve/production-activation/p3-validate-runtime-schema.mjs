#!/usr/bin/env node
/**
 * P3 static validator: Runtime 40/20 schema contract in supabase/migrations.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

const EXPECTED_TABLES = [
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

const REQUIRED_COLUMNS = [
  "tenant_id",
  "case_id",
  "source_trace",
  "metadata",
];

const REQUIRED_INDEX_TABLES = [
  "runtime_catalog_version",
  "role_runtime_session",
  "activity_runtime_run",
  "runtime_audit_trail",
  "parallel_export_payload",
  "readiness_decision_record",
  "structural_candidate_record",
];

function loadP3MigrationSql() {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.includes("p3_schema_rls") && name.endsWith(".sql"))
    .sort();
  if (files.length === 0) {
    throw new Error("P3 migration file not found in supabase/migrations");
  }
  return {
    fileName: files.at(-1),
    sql: readFileSync(join(migrationsDir, files.at(-1)), "utf8"),
  };
}

function tableBlockIncludesColumn(sql, tableName, columnName) {
  const pattern = new RegExp(
    `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${tableName}\\s*\\(([\\s\\S]*?)\\);`,
    "i",
  );
  const match = sql.match(pattern);
  if (!match) return false;
  return new RegExp(`\\b${columnName}\\b`, "i").test(match[1]);
}

function main() {
  const failures = [];
  const { fileName, sql } = loadP3MigrationSql();

  for (const table of EXPECTED_TABLES) {
    const createPattern = new RegExp(
      `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\b`,
      "i",
    );
    if (!createPattern.test(sql)) {
      failures.push(`missing_table:${table}`);
      continue;
    }
    for (const column of REQUIRED_COLUMNS) {
      if (!tableBlockIncludesColumn(sql, table, column)) {
        failures.push(`missing_column:${table}.${column}`);
      }
    }
  }

  for (const table of REQUIRED_INDEX_TABLES) {
    const indexPattern = new RegExp(
      `create\\s+index\\s+if\\s+not\\s+exists\\s+[\\w_]+\\s+on\\s+public\\.${table}\\b`,
      "i",
    );
    if (!indexPattern.test(sql)) {
      failures.push(`missing_index:${table}`);
    }
  }

  if (!/eve_set_updated_at/i.test(sql)) {
    failures.push("missing_updated_at_function");
  }
  if (!/trg_[\\w]+_set_updated_at/i.test(sql) && !(/set_updated_at/i.test(sql) && /create\s+trigger/i.test(sql))) {
    failures.push("missing_updated_at_triggers");
  }

  const result = {
    validator: "p3-validate-runtime-schema",
    migration_file: fileName,
    expected_tables: EXPECTED_TABLES.length,
    tables_found: EXPECTED_TABLES.filter((t) =>
      new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${t}\\b`, "i").test(sql),
    ),
    status: failures.length === 0 ? "passed" : "failed",
    failures,
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length > 0) process.exit(1);
}

main();
