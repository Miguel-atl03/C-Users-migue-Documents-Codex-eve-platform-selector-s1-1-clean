import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const packageDir = "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1";
const docxPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.docx`;
const mdPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.md`;
const jsonPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.json`;
const manifestPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.manifest.json`;
const tsPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.ts`;
const xlsxPath = `${packageDir}/EVE_03_Canonical_Catalog_v0_1.xlsx`;
const shaPath = `${packageDir}/SHA256SUMS.txt`;
const internalDir = `${packageDir}/03_canonical_catalog`;
const authorityKey = ["runtime", "Authority"].join("");

const expectedInternalJsons = [
  "canonical_variables.json",
  "critical_routes.json",
  "epistemic_policy.json",
  "node_variable_map.json",
  "qa_audit.json",
  "source_code_registry.json",
  "source_documents.json",
  "source_node_registry.json",
  "source_target_map.json",
  "vsm_prep_guard.json"
];
const expectedModules = [
  "source_node_registry",
  "source_code_registry",
  "canonical_variables",
  "node_variable_map",
  "critical_routes",
  "epistemic_policy",
  "vsm_prep_guard"
];
const expectedSources = ["D8", "D7", "D5", "D6", "VSM1"];

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
  return xml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertXlsxOpens(path: string) {
  const workbookXml = readZipEntry(path, "xl/workbook.xml").toString("utf8");
  assert.match(workbookXml, /<sheet /, `${path} must contain workbook sheets`);
}

function combinedPackageText() {
  return [
    readFileSync(longPath(mdPath), "utf8"),
    readFileSync(longPath(tsPath), "utf8"),
    JSON.stringify(readJson(jsonPath)),
    JSON.stringify(readJson(manifestPath))
  ].join("\n");
}

test("package artifacts exist, parse and open", () => {
  for (const path of [docxPath, mdPath, jsonPath, manifestPath, tsPath, xlsxPath, shaPath]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.ok(extractDocxText(docxPath).length > 0);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
  assertXlsxOpens(xlsxPath);
  assert.ok(readFileSync(longPath(shaPath), "utf8").includes("EVE_03_Canonical_Catalog_v0_1.json"));

  assert.equal(existsSync(longPath(internalDir)), true);
  for (const fileName of expectedInternalJsons) {
    assert.doesNotThrow(() => readJson(`${internalDir}/${fileName}`), `${fileName} must parse`);
  }
});

test("identity fields match corrected package contract", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.chip_id, "EVE-03-CANONICAL-CATALOG");
  assert.equal(manifest.chip_id, "EVE-03-CANONICAL-CATALOG");
  assert.equal(pkg.package_id, "EVE_03_Canonical_Catalog_v0_1");
  assert.equal(manifest.package_id, "EVE_03_Canonical_Catalog_v0_1");
  assert.ok(pkg.package_aliases.includes("EVE_03_Canonical_Catalog_Chip_v0_1"));
  assert.ok(manifest.package_aliases.includes("EVE_03_Canonical_Catalog_Chip_v0_1"));
  assert.equal(pkg.version, "0.1.0");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(pkg.stage, "03_canonical_catalog");
  assert.equal(manifest.stage, "03_canonical_catalog");
  assert.equal(pkg.status, "READY_WITH_FLAGS");
  assert.equal(manifest.status, "READY_WITH_FLAGS");
  assert.equal(pkg.not_a_prompt, true);
  assert.equal(manifest.not_a_prompt, true);
});

test("modules, dependencies and declared sources remain stable", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.deepEqual(Object.keys(pkg.modules), expectedModules);
  assert.deepEqual(Object.keys(manifest.modules), expectedModules);

  for (const dependency of [
    ["EVE-00-METHOD-KERNEL", "0.2.0"],
    ["EVE-01-AGENT-CONSTITUTION", "0.1.0"],
    ["EVE-02-DIAGNOSTIC-ONTOLOGY", "0.1.0"]
  ]) {
    assert.ok(
      pkg.dependencies.some(
        (item: { chip_id: string; version: string }) =>
          item.chip_id === dependency[0] && item.version === dependency[1]
      )
    );
    assert.ok(
      manifest.dependencies.includes(`${dependency[0]}@${dependency[1]}`)
    );
  }

  assert.deepEqual(
    pkg.source_documents.map((source: { source_id: string }) => source.source_id),
    expectedSources
  );
  assert.deepEqual(
    manifest.source_documents.map((source: { source_id: string }) => source.source_id),
    expectedSources
  );
});

test("internal JSON record counts are locked", () => {
  assert.equal(readJson(`${internalDir}/source_node_registry.json`).length, 164);
  assert.equal(readJson(`${internalDir}/source_code_registry.json`).length, 164);
  assert.equal(readJson(`${internalDir}/canonical_variables.json`).length, 257);
  assert.equal(readJson(`${internalDir}/node_variable_map.json`).length, 213);
  assert.equal(readJson(`${internalDir}/critical_routes.json`).length, 4);
  assert.equal(readJson(`${internalDir}/source_documents.json`).length, 5);
  assert.equal(readJson(`${internalDir}/source_target_map.json`).length, 16);
  assert.equal(readJson(`${internalDir}/qa_audit.json`).length, 18);

  const vsmPrepGuard = readJson(`${internalDir}/vsm_prep_guard.json`);
  assert.ok(Array.isArray(vsmPrepGuard.dictionary));
  assert.equal(Object.hasOwn(vsmPrepGuard, "system_dictionary"), false);
});

test("corrected root/internal vsm_prep_guard stays normalized", () => {
  const pkg = readJson(jsonPath);
  const internalVsm = readJson(`${internalDir}/vsm_prep_guard.json`);

  assert.deepEqual(pkg.modules.vsm_prep_guard, internalVsm);
  assert.equal(Object.hasOwn(pkg.modules.vsm_prep_guard, "dictionary"), true);
  assert.equal(Object.hasOwn(pkg.modules.vsm_prep_guard, "system_dictionary"), false);
});

test("package remains candidate-only and not wired", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(longPath(tsPath), "utf8");
  const allText = combinedPackageText();

  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.equal(allText.includes(`${authorityKey}: true`), false);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /from\s+["']@\/app|from\s+["'].*src\/app/);
  assert.doesNotMatch(ts, /from\s+["'].*(components|ui|react|tsx)/i);
  assert.doesNotMatch(ts, /supabase/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
  assert.doesNotMatch(ts, /runtimeAuthority/i);
  assert.doesNotMatch(ts, /writeRegistry|registryWrite|registry\s*\.\s*(write|set|push|register)/i);
});

test("WorkMapIntake mentions remain declarative catalog content", () => {
  const ts = readFileSync(longPath(tsPath), "utf8");

  assert.match(ts, /WorkMapIntake/);
  assert.doesNotMatch(ts, /import\s+.*WorkMapIntake/);
  assert.doesNotMatch(ts, /from\s+["'].*WorkMap/i);
});
