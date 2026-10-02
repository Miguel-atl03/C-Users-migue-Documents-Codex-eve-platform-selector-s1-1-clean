import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageDir = "docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2";
const jsonPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.json`;
const manifestPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.manifest.json`;
const tsPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.ts`;
const mdPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.md`;
const docxPath = `${packageDir}/EVE_00_Method_Kernel_v0_2.docx`;
const d1Path = `${packageDir}/sources/Fundamentals of Business Architecture Modeling.pdf`;
const d4DocxPath = "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx";
const d5DocxPath = "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx";
const forbiddenAuthorityKey = ["runtime", "Authority"].join("");
const staleD5Status = ["un", "resolved"].join("");
const missingD5Gap = ["BOUNDARY", "SOURCE", "MISSING", "D5", "DOCX"].join("_");

const expectedModules = {
  fundamentals_mmabp_rules: 8,
  pm_rules: 10,
  moc_rules: 10,
  pf_rules: 16,
  olc_rules: 17,
  consistency_rules: 15
};

const expectedOperativeStates = [
  "ready",
  "ready_with_flags",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "manual_review_required",
  "reentry_required"
];

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function operativeStatesFromTs(ts: string): string[] {
  const match = ts.match(/export type EveGateState =([\s\S]*?);/);
  assert.ok(match, "EveGateState type must exist");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

test("package JSON and manifest parse", () => {
  assert.equal(readJson(jsonPath).chip_id, "EVE-00-METHOD-KERNEL");
  assert.equal(readJson(manifestPath).package_id, "EVE_00_Method_Kernel_Chip_v0_2");
});

test("package artifact files and verified sources exist", () => {
  for (const path of [
    docxPath,
    mdPath,
    jsonPath,
    manifestPath,
    tsPath,
    d1Path,
    d4DocxPath,
    d5DocxPath
  ]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
});

test("rule count and module counts match manifest and JSON", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);

  assert.equal(pkg.rule_index_count, 76);
  assert.equal(pkg.rule_index.length, 76);
  assert.equal(manifest.rule_count, 76);
  assert.deepEqual(manifest.modules, expectedModules);

  const jsonModuleCounts = Object.fromEntries(
    Object.entries(pkg.modules).map(([moduleId, moduleValue]: [string, any]) => [
      moduleId,
      moduleValue.rules.length
    ])
  );
  assert.deepEqual(jsonModuleCounts, expectedModules);
});

test("blocked_by_missing_canonical_route is not an operative method-kernel state", () => {
  const pkg = readJson(jsonPath);
  const ts = readFileSync(tsPath, "utf8");

  assert.deepEqual(pkg.readiness_states, expectedOperativeStates);
  assert.deepEqual(pkg.runtime_boundary.allowed_states, expectedOperativeStates);
  assert.deepEqual(operativeStatesFromTs(ts), expectedOperativeStates);
  assert.ok(!pkg.readiness_states.includes("blocked_by_missing_canonical_route"));
  assert.ok(!pkg.runtime_boundary.allowed_states.includes("blocked_by_missing_canonical_route"));
  assert.ok(!operativeStatesFromTs(ts).includes("blocked_by_missing_canonical_route"));
  assert.match(ts, /Runtime boundary concern/);
});

test("D1, D4 and D5 are present and D5 is verified", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const md = readFileSync(mdPath, "utf8");
  const ts = readFileSync(tsPath, "utf8");
  const allText = `${JSON.stringify(pkg)}\n${JSON.stringify(manifest)}\n${md}\n${ts}`;

  assert.equal(existsSync(d1Path), true);
  assert.equal(existsSync(d4DocxPath), true);
  assert.equal(existsSync(d5DocxPath), true);
  assert.equal(pkg.authority.boundary_status.D5.status, "D5_BOUNDARY_VERIFIED");
  assert.equal(pkg.authority.boundary_status.D5.declared_docx_found_in_repo, true);
  assert.equal(pkg.source_registry.D5.status, "D5_BOUNDARY_VERIFIED");
  assert.equal(pkg.source_registry.D5.declared_docx_found_in_repo, true);
  assert.equal(manifest.boundary_status.D5.status, "D5_BOUNDARY_VERIFIED");
  assert.equal(manifest.boundary_status.D5.declared_docx_found_in_repo, true);
  assert.equal(allText.includes(staleD5Status), false);
  assert.equal(allText.includes(missingD5Gap), false);
  assert.match(allText, /D5.*frontera Runtime|Runtime boundary source/i);
  assert.match(allText, /no redefine MMABP/);
  assert.match(allText, /no reemplaza D1/);
  assert.match(allText, /not Runtime 40\/20 gate implementations|no implementa gates Runtime/i);
});

test("FND-007 and FND-008 preserve D4/D5 as boundary compatibility only", () => {
  const pkg = readJson(jsonPath);
  const rules = Object.fromEntries(
    pkg.modules.fundamentals_mmabp_rules.rules.map((rule: any) => [rule.id, rule])
  );
  const allText = JSON.stringify(pkg);

  assert.match(allText, /D4\/D5.*compatibility boundary references only/i);
  assert.match(allText, /not Runtime 40\/20 gate implementations/i);
  assert.match(allText, /D5.*does not redefine MMABP/i);
  assert.match(allText, /does not replace D1/i);
  assert.ok(rules["FND-007"].source_refs.some((ref: string) => ref.startsWith("D4:")));
  assert.ok(rules["FND-008"].source_refs.some((ref: string) => ref.startsWith("D4:")));
  assert.ok(rules["FND-008"].source_refs.some((ref: string) => ref.startsWith("D5:")));
});

test("package remains candidate not wired and declares required boundaries", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(tsPath, "utf8");
  const md = readFileSync(mdPath, "utf8");
  const allText = `${JSON.stringify(pkg)}\n${JSON.stringify(manifest)}\n${ts}\n${md}`;

  assert.equal(Object.hasOwn(pkg, forbiddenAuthorityKey), false);
  assert.equal(Object.hasOwn(manifest, forbiddenAuthorityKey), false);
  assert.equal(allText.includes(forbiddenAuthorityKey), false);
  assert.doesNotMatch(ts, /from\s+["']@\/|from\s+["']\.\.\/\.\.\/\.\.\/src/);

  for (const boundary of [
    "no diagnostica patologias EVE",
    "no produce IR",
    "no exporta registry",
    "no ejecuta Produccion Paralela",
    "no reemplaza Runtime catalog",
    "no reemplaza WorkMap",
    "no decide seleccion primaria",
    "no reemplaza B0",
    "no bloquea UI directa",
    "no actua como Runtime readiness/reentry gate"
  ]) {
    assert.match(allText, new RegExp(boundary));
  }
});
