import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rlsMigration = readFileSync(
  new URL(
    "../../../sql/migrations/2026-05-28-rls-owner-policies-capa1-p0.sql",
    import.meta.url,
  ),
  "utf8",
);

const p0Tables = [
  "usuarios",
  "empresas",
  "sesiones_llenado",
  "actividades",
  "respuestas_relatos",
  "scene_registry",
  "scene_question_answers",
  "scene_canonical_records",
  "session_intermediate_output",
];

const p1Tables = [
  "metricas_por_capa",
  "respuestas_estructuradas",
  "scene_answer_provenance",
  "scene_block_derivations",
  "scene_consistency_flags",
  "scene_clarifications",
  "scene_light_inferences",
  "scene_answer_bundles",
];

test("1.11J RLS migration enables RLS for P0 and operational P1 Capa 1 tables", () => {
  for (const table of [...p0Tables, ...p1Tables]) {
    assert.match(
      rlsMigration,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      `${table} must enable RLS`,
    );
    assert.match(
      rlsMigration,
      new RegExp(`revoke all on table[\\s\\S]*public\\.${table}[\\s\\S]*from anon`, "i"),
      `${table} must revoke anon privileges`,
    );
  }
});

test("1.11J RLS migration does not grant anon operational access", () => {
  assert.doesNotMatch(rlsMigration, /grant\s+[^;]*\bto\s+anon\b/i);
  assert.doesNotMatch(rlsMigration, /disable row level security/i);
  assert.doesNotMatch(rlsMigration, /with check\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(rlsMigration, /using\s*\(\s*true\s*\)/i);
});

test("1.11J RLS policies are rooted in Supabase Auth ownership", () => {
  assert.match(rlsMigration, /auth\.uid\(\)/g);
  assert.match(rlsMigration, /auth_user_id = auth\.uid\(\)/g);
  assert.match(rlsMigration, /owner_session\.usuario_id/g);
  assert.match(rlsMigration, /owner_session\.id = .*\.sesion_id/g);
});

test("1.11J scene policies preserve scene-to-session ownership chain", () => {
  for (const table of [
    "scene_question_answers",
    "scene_canonical_records",
    "scene_answer_provenance",
    "scene_block_derivations",
    "scene_consistency_flags",
    "scene_clarifications",
    "scene_light_inferences",
    "scene_answer_bundles",
  ]) {
    assert.match(
      rlsMigration,
      new RegExp(`owner_scene\\.id = ${table}\\.scene_id`, "i"),
      `${table} must validate scene_id`,
    );
    assert.match(
      rlsMigration,
      new RegExp(`owner_scene\\.sesion_id = ${table}\\.sesion_id`, "i"),
      `${table} must validate scene session`,
    );
  }
});

test("1.11J RLS migration avoids out-of-scope activation and data mutation", () => {
  assert.doesNotMatch(rlsMigration, /update\s+public\./i);
  assert.doesNotMatch(rlsMigration, /insert\s+into\s+public\./i);
  assert.doesNotMatch(rlsMigration, /delete\s+from\s+public\./i);
  assert.doesNotMatch(rlsMigration, /parallel_production_runtime_artifacts/i);
  assert.doesNotMatch(rlsMigration, /\bmba_/i);
  assert.doesNotMatch(rlsMigration, /soft_governance_mode|enforcement_mode/i);
  assert.doesNotMatch(rlsMigration, /ExportCodePackage|candidate_export_package/i);
});
