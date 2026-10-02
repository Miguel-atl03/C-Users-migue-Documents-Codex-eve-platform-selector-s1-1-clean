import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const packageDir = "docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1";
const docxPath = `${packageDir}/EVE_05_Gate_Engine_v0_1.docx`;
const mdPath = `${packageDir}/EVE_05_Gate_Engine_v0_1.md`;
const jsonPath = `${packageDir}/EVE_05_Gate_Engine_v0_1.json`;
const manifestPath = `${packageDir}/EVE_05_Gate_Engine_v0_1.manifest.json`;
const tsPath = `${packageDir}/EVE_05_Gate_Engine_v0_1.ts`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedModules = [
  "critical_route_gate",
  "semantic_resolution_gate",
  "process_state_timer_gate",
  "mmabp_conformance_gate",
  "mmabp_consistency_gate"
];

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

test("package artifacts exist, parse and open", () => {
  for (const path of [docxPath, mdPath, jsonPath, manifestPath, tsPath]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.match(extractDocxText(docxPath), /EVE[- ]05|Gate Engine/i);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
});

test("identity fields match gate engine package contract", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.chip_id, "EVE-05-GATE-ENGINE");
  assert.equal(manifest.chip_id, "EVE-05-GATE-ENGINE");
  assert.equal(pkg.package_id, "EVE_05_Gate_Engine_Chip_v0_1");
  assert.equal(manifest.package_id, "EVE_05_Gate_Engine_Chip_v0_1");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(pkg.stage, "05_gate_engine");
  assert.equal(manifest.stage, "05_gate_engine");
  assert.equal(pkg.status, "READY_FOR_SHADOW_INTEGRATION");
  assert.equal(manifest.status, "READY_FOR_SHADOW_INTEGRATION");
  assert.equal(pkg.certification_status, "ARTIFACT_VALIDATED_NOT_ACTIVATED");
  assert.equal(manifest.certification_status, "ARTIFACT_VALIDATED_NOT_ACTIVATED");
  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
});

test("modules and declared counts are locked", () => {
  const pkg = readJson(jsonPath);
  const modules = pkg.modules;
  const counts = pkg.counts;

  assert.deepEqual(Object.keys(modules), expectedModules);
  assert.equal(modules.critical_route_gate.routes.length, 4);
  assert.equal(modules.critical_route_gate.rules.length, 10);
  assert.equal(modules.semantic_resolution_gate.gate_definitions.length, 7);
  assert.equal(modules.semantic_resolution_gate.rules.length, 8);
  assert.equal(modules.process_state_timer_gate.gate_definitions.length, 6);
  assert.equal(modules.process_state_timer_gate.rules.length, 9);
  assert.equal(modules.mmabp_conformance_gate.engine_rules.length, 8);
  assert.equal(modules.mmabp_conformance_gate.model_rules.length, 53);
  assert.equal(modules.mmabp_consistency_gate.engine_rules.length, 10);
  assert.equal(modules.mmabp_consistency_gate.method_rules.length, 15);
  assert.equal(modules.mmabp_consistency_gate.compartments.length, 13);
  assert.equal(pkg.failure_guards.length, 14);

  assert.equal(counts.critical_routes, 4);
  assert.equal(counts.critical_route_engine_rules, 10);
  assert.equal(counts.semantic_gates, 7);
  assert.equal(counts.semantic_engine_rules, 8);
  assert.equal(counts.process_state_timer_gates, 6);
  assert.equal(counts.process_state_timer_engine_rules, 9);
  assert.equal(counts.conformance_engine_rules, 8);
  assert.equal(counts.conformance_model_rules, 53);
  assert.equal(counts.consistency_engine_rules, 10);
  assert.equal(counts.consistency_method_rules, 15);
  assert.equal(counts.consistency_compartments, 13);
  assert.equal(counts.failure_guards, 14);
  assert.equal(counts.atomic_rules_and_gate_definitions, 130);
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
  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.doesNotMatch(ts, new RegExp(`${authorityKey}\\s*[:=]\\s*true`));
  assert.doesNotMatch(ts, /writeRegistry|registryWrite|registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /from\s+["'].*(runtime|workmap|significado|supabase|api)/i);
  assert.doesNotMatch(ts, /@supabase/i);
  assert.doesNotMatch(ts, /eve\s*brain|cerebro\s+eve|brain\s+connection/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
});

test("no dev route or productive API exists for gate engine", () => {
  assert.equal(existsSync(longPath("src/app/dev/gate-engine/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/dev/eve-05-gate-engine/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/api/gate-engine/route.ts")), false);
  assert.equal(existsSync(longPath("src/app/api/eve-05-gate-engine/route.ts")), false);
});
