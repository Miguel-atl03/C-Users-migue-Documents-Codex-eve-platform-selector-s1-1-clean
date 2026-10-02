import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const packageDir = "docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2";
const docxPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.docx`;
const mdPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.md`;
const jsonPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.json`;
const manifestPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.manifest.json`;
const tsPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.ts`;
const xlsxPath = `${packageDir}/EVE_04_Runtime_Catalog_v0_2.xlsx`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedModules = [
  "runtime_interactions_base_40",
  "runtime_interactions_causal_20",
  "ux_subfield_structure",
  "branching_budget_rules",
  "readiness_gaps_reentry"
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

function xlsxWorkbookXml(path: string) {
  return readZipEntry(path, "xl/workbook.xml").toString("utf8");
}

function xlsxSheetNames(path: string) {
  return Array.from(xlsxWorkbookXml(path).matchAll(/<[^>]*sheet[^>]+name="([^"]+)"/g)).map(
    (match) => match[1]
  );
}

function findResolvedDefinitions(value: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(value)) {
    if (
      value.length === 33 &&
      value.every((item) => typeof item === "object" && item !== null) &&
      value.every((item) => Object.hasOwn(item as Record<string, unknown>, "variable"))
    ) {
      return value as Array<Record<string, unknown>>;
    }
    for (const item of value) {
      const result = findResolvedDefinitions(item);
      if (result) return result;
    }
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      const result = findResolvedDefinitions(item);
      if (result) return result;
    }
  }

  return null;
}

test("package artifacts exist, parse and open", () => {
  for (const path of [docxPath, mdPath, jsonPath, manifestPath, tsPath, xlsxPath]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.match(extractDocxText(docxPath), /EVE[- ]04|Runtime Catalog/i);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
  assert.match(xlsxWorkbookXml(xlsxPath), /<[^>]*sheet\b/);
});

test("identity fields match runtime catalog package contract", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.chip_id, "EVE-04-RUNTIME-CATALOG");
  assert.equal(manifest.chip_id, "EVE-04-RUNTIME-CATALOG");
  assert.equal(pkg.package_id, "EVE_04_Runtime_Catalog_Chip_v0_2");
  assert.equal(manifest.package_id, "EVE_04_Runtime_Catalog_Chip_v0_2");
  assert.equal(pkg.version, "0.2.0");
  assert.equal(manifest.version, "0.2.0");
  assert.equal(pkg.stage, "04_runtime_catalog");
  assert.equal(manifest.stage, "04_runtime_catalog");
  assert.equal(pkg.status, "READY");
  assert.equal(manifest.status, "READY");
  assert.equal(pkg.certification_status, "VALIDATED");
  assert.equal(manifest.certification_status, "VALIDATED");
  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
});

test("modules and record counts are locked", () => {
  const pkg = readJson(jsonPath);

  assert.deepEqual(Object.keys(pkg.modules), expectedModules);
  assert.equal(pkg.modules.runtime_interactions_base_40.length, 40);
  assert.equal(pkg.modules.runtime_interactions_causal_20.length, 20);
  assert.equal(pkg.modules.ux_subfield_structure.length, 17);
  assert.equal(pkg.modules.branching_budget_rules.rules.length, 10);
  assert.equal(pkg.modules.branching_budget_rules.scoring_weights.length, 11);
  assert.equal(pkg.modules.readiness_gaps_reentry.length, 7);
});

test("package XLSX contains protected runtime sheets", () => {
  const sheets = xlsxSheetNames(xlsxPath);

  for (const sheet of [
    "Runtime_Base_40",
    "Runtime_Causal_20",
    "UX_Subfields",
    "Branching_Rules",
    "Branching_Scores",
    "Readiness_Reentry",
    "Variable_Definitions",
    "Source_Coverage"
  ]) {
    assert.ok(sheets.includes(sheet), `${sheet} must exist`);
  }
});

test("declared corrections remain present and resolved", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const b6q38 = pkg.modules.runtime_interactions_base_40.find(
    (item: { runtime_interaction_id: string }) => item.runtime_interaction_id === "B6-Q38"
  );
  const b6q38Ux = pkg.modules.ux_subfield_structure.find(
    (item: { runtime_interaction_id: string }) => item.runtime_interaction_id === "B6-Q38"
  );
  const definitions = findResolvedDefinitions(pkg);

  assert.equal(manifest.corrections["CCOV-001"].status, "RESOLVED");
  assert.match(b6q38.source_nodes, /B6_6_8/);
  assert.match(b6q38.source_codes, /6\.8/);
  assert.match(b6q38.subfield_structure, /trench_phrase/);
  assert.match(b6q38Ux.subfield_structure, /trench_phrase/);

  assert.equal(manifest.corrections["CVAR-001"].status, "RESOLVED");
  assert.ok(definitions, "resolved definitions must be discoverable");
  assert.equal(definitions?.length, 33);
  assert.equal(
    definitions?.some((item) => String(item.transduction_status ?? "").includes("pending")),
    false
  );
});

test("package remains candidate-only and not wired", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(longPath(tsPath), "utf8");

  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.doesNotMatch(ts, new RegExp(`${authorityKey}\\s*[:=]\\s*true`));
  assert.doesNotMatch(ts, /writeRegistry|registryWrite|registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /from\s+["'].*(runtime|workmap|significado|supabase|api)/i);
  assert.doesNotMatch(ts, /@supabase/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
});
