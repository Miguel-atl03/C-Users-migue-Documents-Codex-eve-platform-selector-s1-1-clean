import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const packageDir = "docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1";
const docxPath = `${packageDir}/EVE_06_Execution_Engine_v0_1.docx`;
const mdPath = `${packageDir}/EVE_06_Execution_Engine_v0_1.md`;
const jsonPath = `${packageDir}/EVE_06_Execution_Engine_v0_1.json`;
const manifestPath = `${packageDir}/EVE_06_Execution_Engine_v0_1.manifest.json`;
const tsPath = `${packageDir}/EVE_06_Execution_Engine_v0_1.ts`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedModules = [
  "activity_runtime_run",
  "interaction_instance",
  "response_ingest",
  "evidence_item",
  "canonical_variable_record",
  "structural_candidate_record"
];

const repairedScrRules = ["SCR-002", "SCR-007", "SCR-018", "SCR-019", "SCR-020", "SCR-021", "SCR-022"];

function longPath(path: string) {
  const fullPath = resolve(path);
  return process.platform === "win32" && !fullPath.startsWith("\\\\?\\")
    ? `\\\\?\\${fullPath}`
    : fullPath;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(longPath(path), "utf8"));
}

function readZipEntry(path: string, entryName: string) {
  const buffer = readFileSync(longPath(path));
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === entryName) {
      const data = buffer.subarray(dataStart, dataEnd);
      return method === 0 ? data : inflateRawSync(data);
    }

    offset = dataEnd;
  }

  throw new Error(`${entryName} not found in ${path}`);
}

function extractDocxText(path: string) {
  const xml = readZipEntry(path, "word/document.xml").toString("utf8");
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sourceIds(refs: string[]) {
  return new Set(refs.map((ref) => ref.split(/[!:]/)[0]));
}

function schemaFieldCount(module: { entity_schema?: unknown[] | Record<string, unknown> }) {
  if (Array.isArray(module.entity_schema)) {
    return module.entity_schema.length;
  }

  return Object.keys(module.entity_schema ?? {}).length;
}

test("package artifacts exist, parse and open", () => {
  for (const path of [docxPath, mdPath, jsonPath, manifestPath, tsPath]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.match(extractDocxText(docxPath), /EVE[- ]06|Execution Engine/i);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
});

test("identity and installation contract fields match execution engine package", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const contract = pkg.installation_contract;

  assert.equal(pkg.chip_id, "EVE-06-EXECUTION-ENGINE");
  assert.equal(manifest.chip_id, "EVE-06-EXECUTION-ENGINE");
  assert.equal(pkg.package_id, "EVE_06_Execution_Engine_Chip_v0_1");
  assert.equal(manifest.package_id, "EVE_06_Execution_Engine_Chip_v0_1");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(pkg.stage, "06_execution_engine");
  assert.equal(manifest.stage, "06_execution_engine");
  assert.equal(pkg.status, "READY_FOR_INDEPENDENT_QA_RERUN");
  assert.equal(manifest.status, "READY_FOR_INDEPENDENT_QA_RERUN");
  assert.equal(pkg.certification_status, "WORKBENCH_REPAIRED_NOT_REAUDITED");
  assert.equal(manifest.certification_status, "WORKBENCH_REPAIRED_NOT_REAUDITED");
  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
  assert.equal(contract.activation_mode, "shadow_first");
  assert.equal(contract.active_runtime_authority, false);
  assert.equal(contract.product_wiring, false);
  assert.equal(contract.registry_write, false);
});

test("modules and declared counts are locked", () => {
  const pkg = readJson(jsonPath);
  const modules = pkg.modules;
  const counts = pkg.counts;

  assert.deepEqual(Object.keys(modules), expectedModules);
  assert.equal(Object.values(modules).reduce((total: number, module: any) => total + module.rules.length, 0), 135);
  assert.equal(Object.values(modules).reduce((total: number, module: any) => total + schemaFieldCount(module), 0), 54);
  assert.equal(pkg.failure_guards.length, 18);
  assert.equal(pkg.integration_rules.length, 14);
  assert.equal(pkg.source_documents.length, 10);
  assert.equal(pkg.source_to_target_mapping.length, 20);
  assert.equal(pkg.qa_controls.length, 22);

  assert.equal(counts.modules, 6);
  assert.equal(counts.atomic_rules, 135);
  assert.equal(counts.failure_guards, 18);
  assert.equal(counts.integration_rules, 14);
  assert.equal(counts.source_documents, 10);
  assert.equal(counts.source_to_target_mappings, 20);
  assert.equal(counts.qa_controls, 22);
});

test("SCR repair remains locked", () => {
  const pkg = readJson(jsonPath);
  const scr = pkg.modules.structural_candidate_record;
  const scrRefs = scr.rules.flatMap((rule: { source_refs: string[] }) => rule.source_refs);
  const scrSourceIds = sourceIds(scrRefs);
  const stm6016 = pkg.source_to_target_mapping.find(
    (mapping: { mapping_id: string }) => mapping.mapping_id === "STM6-016"
  );

  assert.equal(scrSourceIds.has("D8"), true, "structural_candidate_record must include D8");
  assert.equal(scrSourceIds.has("D1"), false, "D1 must not be a SCR direct proof source");

  for (const ruleId of repairedScrRules) {
    const rule = scr.rules.find((candidate: { rule_id: string }) => candidate.rule_id === ruleId);
    assert.ok(rule, `${ruleId} must exist`);
    assert.equal(sourceIds(rule.source_refs).has("D1"), false, `${ruleId} must not classify D1 as direct proof`);
    assert.equal(sourceIds(rule.source_refs).has("D8"), true, `${ruleId} must include D8 repair proof`);
  }

  assert.ok(stm6016, "STM6-016 must exist");
  assert.match(stm6016.target, /evidence_item/);
  assert.match(stm6016.target, /canonical_variable_record/);
  assert.match(stm6016.target, /structural_candidate_record/);
  assert.match(JSON.stringify(stm6016), /D8/);
});

test("package remains candidate-only and not wired", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(longPath(tsPath), "utf8");
  const contract = pkg.installation_contract;

  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
  assert.equal(contract.active_runtime_authority, false);
  assert.equal(contract.product_wiring, false);
  assert.equal(contract.registry_write, false);
  assert.equal(contract.diagnosis_enabled, false);
  assert.equal(contract.export_enabled, false);
  assert.equal(contract.parallel_production_enabled, false);
  assert.equal(contract.database_migrations_applied, false);
  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.doesNotMatch(ts, new RegExp(`${authorityKey}\\s*[:=]\\s*true`));
  assert.doesNotMatch(ts, /registryWrite\s*[:=]\s*true|registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(ts, /productWiring\s*[:=]\s*true/i);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /from\s+["'].*(runtime|workmap|significado|supabase|api)/i);
  assert.doesNotMatch(ts, /@supabase/i);
  assert.doesNotMatch(ts, /eve\s*brain|cerebro\s+eve|brain\s+connection/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
});

test("no dev route or productive API exists for execution engine", () => {
  assert.equal(existsSync(longPath("src/app/dev/execution-engine/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/dev/eve-06-execution-engine/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/api/execution-engine/route.ts")), false);
  assert.equal(existsSync(longPath("src/app/api/eve-06-execution-engine/route.ts")), false);
});
