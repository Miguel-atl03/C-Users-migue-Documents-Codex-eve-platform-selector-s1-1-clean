import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const packageDir = "docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate";
const docxPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.docx`;
const mdPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.md`;
const jsonPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json`;
const manifestPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.manifest.json`;
const tsPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.ts`;
const sourceProofPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.source_proof_matrix.json`;
const certificationReportPath = `${packageDir}/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.certification_report.json`;
const certificationAuditPath = `${packageDir}/AUDIT_EVE_07_Parallel_Production_Interface_v0_1_2_candidate_CERTIFICATION.md`;
const qaMatrixPath = "docs/audits/_eve_07_parallel_production_interface_record_rule_source_qa_matrix_v1_1.json";
const authorityKey = ["runtime", "Authority"].join("");

const expectedModules = [
  "scr_payload",
  "evidence_bundle_payload",
  "mdsb_payload",
  "mmabp_ir_candidate",
  "registry_candidate",
  "export_blockers"
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

function sourceIds(refs: string[]) {
  return new Set(refs.map((ref) => ref.split(/[!:]/)[0]));
}

test("package artifacts exist, parse and open", () => {
  for (const path of [
    docxPath,
    mdPath,
    jsonPath,
    manifestPath,
    tsPath,
    sourceProofPath,
    certificationReportPath,
    certificationAuditPath
  ]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.match(extractDocxText(docxPath), /EVE[- ]07|Parallel Production Interface/i);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
  assert.ok(readFileSync(longPath(certificationAuditPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.doesNotThrow(() => readJson(sourceProofPath));
  assert.doesNotThrow(() => readJson(certificationReportPath));
});

test("identity and installation contract fields remain candidate-only", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const contract = pkg.installation_contract;

  assert.equal(pkg.chip_id, "EVE-07-PARALLEL-PRODUCTION-INTERFACE");
  assert.equal(manifest.chip_id, "EVE-07-PARALLEL-PRODUCTION-INTERFACE");
  assert.equal(pkg.package_id, "EVE_07_Parallel_Production_Interface_Chip_v0_1_2_candidate");
  assert.equal(manifest.package_id, "EVE_07_Parallel_Production_Interface_Chip_v0_1_2_candidate");
  assert.equal(pkg.version, "0.1.2-candidate");
  assert.equal(manifest.version, "0.1.2-candidate");
  assert.equal(pkg.stage, "07_parallel_production_interface");
  assert.equal(manifest.stage, "07_parallel_production_interface");
  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
  assert.equal(pkg.activation_status, "SHADOW_ONLY");
  assert.equal(manifest.activation_status, "SHADOW_ONLY");
  assert.equal(contract.active_runtime_authority, false);
  assert.equal(contract.product_wiring, false);
  assert.equal(contract.registry_write, false);
  assert.equal(contract.final_export_enabled, false);
  assert.equal(contract.final_transduction_enabled, false);
  assert.equal(contract.parallel_production_enabled, false);
});

test("modules and protected counts are locked", () => {
  const pkg = readJson(jsonPath);
  const sourceProof = readJson(sourceProofPath);
  const certificationReport = readJson(certificationReportPath);
  const qa = readJson(qaMatrixPath);

  assert.deepEqual(Object.keys(pkg.modules), expectedModules);
  assert.equal(pkg.counts.modules, 6);
  assert.equal(sourceProof.rows.length, 154);
  assert.equal(pkg.counts.source_proof_rows, 154);
  assert.equal(pkg.source_to_target_mapping.length, 26);
  assert.equal(pkg.counts.source_to_target_mappings, 26);
  assert.equal(pkg.counts.export_blocker_definitions, 34);
  assert.ok(sourceProof.rows.find((row: { rule_id: string }) => row.rule_id === "EXB-031"));
  assert.equal(pkg.export_blocker_test_vectors.length, 6);
  assert.equal(certificationReport.claim_verification_registry.length, 16);
  assert.equal(qa.rows.length, 258);
  assert.equal(qa.summary.accepted, 258);
});

test("QA V1 repair remains locked for REGC-006, REGC-011 and EXBE-013", () => {
  const sourceProof = readJson(sourceProofPath);
  const qa = readJson(qaMatrixPath);
  const rows = new Map(sourceProof.rows.map((row: { rule_id: string }) => [row.rule_id, row]));
  const regc006: any = rows.get("REGC-006");
  const regc011: any = rows.get("REGC-011");
  const exbe013: any = rows.get("EXBE-013");

  assert.equal(regc006.primary_proof.source_id, "D5");
  assert.equal(regc006.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(regc006.contextual_guards?.[0]?.source_role, "methodological_guard_only");
  assert.equal(sourceIds(regc006.source_refs).has("D1"), true);

  assert.equal(regc011.primary_proof.source_id, "D5");
  assert.equal(regc011.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(regc011.contextual_guards?.[0]?.source_role, "methodological_guard_only");

  assert.equal(exbe013.primary_proof.source_id, "EVE05");
  assert.equal(exbe013.contextual_guards?.[0]?.source_id, "D1");
  assert.equal(exbe013.contextual_guards?.[0]?.source_role, "methodological_guard_only");

  assert.equal(qa.summary.pending_source_proof, 0);
  assert.equal(qa.summary.pending_locator_precision, 0);
  assert.equal(qa.summary.certification_claim_unverified, 0);
  assert.equal(qa.summary.materialDifference, false);
});

test("package remains not wired to product/runtime/export surfaces", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(longPath(tsPath), "utf8");
  const serialized = `${JSON.stringify(pkg)}\n${JSON.stringify(manifest)}\n${ts}`;
  const contract = pkg.installation_contract;

  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(pkg.activation_status, "SHADOW_ONLY");
  assert.equal(contract.active_runtime_authority, false);
  assert.equal(contract.product_wiring, false);
  assert.equal(contract.registry_write, false);
  assert.equal(contract.final_export_enabled, false);
  assert.equal(contract.final_transduction_enabled, false);
  assert.equal(contract.parallel_production_enabled, false);
  assert.equal(contract.database_migrations_applied, false);
  assert.equal(contract.diagnosis_enabled, false);
  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.doesNotMatch(serialized, new RegExp(`${authorityKey}"?\\s*[:=]\\s*true`, "i"));
  assert.doesNotMatch(serialized, /registryWrite"?\s*[:=]\s*true|registry\s*\.\s*(write|set|push|register)/i);
  assert.doesNotMatch(serialized, /productWiring"?\s*[:=]\s*true/i);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /from\s+["'].*(runtime|workmap|significado|supabase|api)/i);
  assert.doesNotMatch(ts, /@supabase/i);
  assert.doesNotMatch(ts, /eve\s*brain|cerebro\s+eve|brain\s+connection/i);
  assert.doesNotMatch(ts, /page\.tsx/i);
});

test("no dev route or productive API exists for parallel production interface", () => {
  assert.equal(existsSync(longPath("src/app/dev/parallel-production-interface/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/dev/eve-07-parallel-production-interface/page.tsx")), false);
  assert.equal(existsSync(longPath("src/app/api/parallel-production-interface/route.ts")), false);
  assert.equal(existsSync(longPath("src/app/api/eve-07-parallel-production-interface/route.ts")), false);
});
