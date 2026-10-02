import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import test from "node:test";

const packageDir = "docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate";
const docxPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.docx`;
const mdPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.md`;
const jsonPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.json`;
const manifestPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.manifest.json`;
const tsPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.ts`;
const sourceProofPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.source_proof_matrix.json`;
const systemStatePath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.system_state_evidence_matrix.json`;
const certificationReportPath = `${packageDir}/EVE_08_Audit_And_Governance_v0_1_1_candidate.certification_report.json`;
const certificationAuditPath = `${packageDir}/AUDIT_EVE_08_Audit_And_Governance_v0_1_1_candidate_CERTIFICATION.md`;
const qaSummaryPath = "docs/audits/_eve_08_audit_and_governance_record_rule_source_qa_summary_v1_1.json";
const authorityKey = ["runtime", "Authority"].join("");

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
  for (const path of [
    docxPath,
    mdPath,
    jsonPath,
    manifestPath,
    tsPath,
    sourceProofPath,
    systemStatePath,
    certificationReportPath,
    certificationAuditPath
  ]) {
    assert.equal(existsSync(longPath(path)), true, `${path} must exist`);
    assert.ok(statSync(longPath(path)).size > 0, `${path} must not be empty`);
  }

  assert.match(extractDocxText(docxPath), /EVE[- ]08|Audit And Governance|Audit and Governance/i);
  assert.ok(readFileSync(longPath(mdPath), "utf8").length > 0);
  assert.ok(readFileSync(longPath(tsPath), "utf8").length > 0);
  assert.ok(readFileSync(longPath(certificationAuditPath), "utf8").length > 0);
  assert.doesNotThrow(() => readJson(jsonPath));
  assert.doesNotThrow(() => readJson(manifestPath));
  assert.doesNotThrow(() => readJson(sourceProofPath));
  assert.doesNotThrow(() => readJson(systemStatePath));
  assert.doesNotThrow(() => readJson(certificationReportPath));
});

test("identity and installation contract fields remain candidate-only", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const contract = pkg.activation_contract;

  assert.equal(pkg.chip_id, "EVE-08-AUDIT-AND-GOVERNANCE");
  assert.equal(manifest.chip_id, "EVE-08-AUDIT-AND-GOVERNANCE");
  assert.equal(pkg.package_id, "EVE_08_Audit_And_Governance_Chip_v0_1_1_candidate");
  assert.equal(manifest.package_id, "EVE_08_Audit_And_Governance_Chip_v0_1_1_candidate");
  assert.equal(pkg.version, "0.1.1-candidate");
  assert.equal(manifest.version, "0.1.1-candidate");
  assert.equal(pkg.installation_status, "NOT_INSTALLED");
  assert.equal(manifest.installation_status, "NOT_INSTALLED");
  assert.equal(pkg.activation_status, "SHADOW_ONLY");
  assert.equal(manifest.activation_status, "SHADOW_ONLY");
  assert.equal(pkg.status, "READY_FOR_INDEPENDENT_QA_RERUN");
  assert.equal(pkg.certification_status, "WORKBENCH_REPAIRED_NOT_REAUDITED");
  assert.equal(contract.runtimeAuthority, false);
  assert.equal(contract.registryWrite, false);
  assert.equal(contract.productWiring, false);
  assert.equal(contract.eveBrainConnection, false);
  assert.equal(contract.final_export_enabled, false);
  assert.equal(contract.parallel_production_enabled, false);
  assert.equal(contract.diagnosis_enabled, false);
  assert.equal(contract.sqlEnabled, false);
  assert.equal(contract.supabaseWrite, false);
}
);

test("protected package and QA counts remain locked", () => {
  const pkg = readJson(jsonPath);
  const sourceProof = readJson(sourceProofPath);
  const systemState = readJson(systemStatePath);
  const qa = readJson(qaSummaryPath);

  assert.equal(Object.keys(pkg.modules).length, 6);
  assert.equal(pkg.counts.modules, 6);
  assert.equal(pkg.counts.atomic_rules, 200);
  assert.equal(pkg.counts.source_proof_rows, 244);
  assert.equal(sourceProof.rows.length, 244);
  assert.equal(pkg.counts.system_state_evidence_rows, 24);
  assert.equal(systemState.rows.length, 24);
  assert.equal(pkg.source_to_target_mapping.length, 20);
  assert.equal(pkg.counts.source_to_target_mappings, 20);
  assert.equal(qa.targetUnitsChecked, 250);
  assert.equal(qa.sourceToTargetRowsChecked, 288);
  assert.equal(qa.sourceProofRowsChecked, 244);
  assert.equal(qa.systemStateEvidenceRowsChecked, 24);
  assert.equal(qa.packageDeclaredMappingsChecked, 20);
  assert.equal(qa.materialComparisonRowsChecked, 250);
  assert.equal(qa.aliasesResolved, 50);
  assert.equal(qa.accepted, 250);
  assert.equal(qa.pendingSourceProof, 0);
  assert.equal(qa.pendingLocatorPrecision, 0);
  assert.equal(qa.internalClaimUnverified, 0);
  assert.equal(qa.certificationClaimUnverified, 0);
  assert.equal(qa.d8ContextualGap, 0);
  assert.equal(qa.noCableadoViolation, 0);
  assert.equal(qa.materialDifference, false);
});

test("workbench-repaired status is non-final and not circular certification proof", () => {
  const pkg = readJson(jsonPath);
  const certificationReport = readJson(certificationReportPath);
  const qa = readJson(qaSummaryPath);

  assert.equal(pkg.status, "READY_FOR_INDEPENDENT_QA_RERUN");
  assert.equal(pkg.certification_status, "WORKBENCH_REPAIRED_NOT_REAUDITED");
  assert.notEqual(pkg.certification_status, "CERTIFIED");
  assert.equal(qa.certificationClaimUnverified, 0);
  assert.equal(certificationReport.accepted_as_final_proof ?? false, false);
});

test("package remains not wired to product/runtime/export surfaces", () => {
  const pkg = readJson(jsonPath);
  const manifest = readJson(manifestPath);
  const ts = readFileSync(longPath(tsPath), "utf8");
  const serialized = `${JSON.stringify(pkg)}\n${JSON.stringify(manifest)}\n${ts}`;

  assert.equal(Object.hasOwn(pkg, authorityKey), false);
  assert.equal(Object.hasOwn(manifest, authorityKey), false);
  assert.doesNotMatch(serialized, new RegExp(`${authorityKey}"?\\s*[:=]\\s*true`, "i"));
  assert.doesNotMatch(serialized, /registryWrite"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /productWiring"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /eveBrainConnection"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /final_export_enabled"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /parallel_production_enabled"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /diagnosis_enabled"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /sqlEnabled"?\s*[:=]\s*true/i);
  assert.doesNotMatch(serialized, /supabaseWrite"?\s*[:=]\s*true/i);
  assert.doesNotMatch(ts, /^import\s/m);
  assert.doesNotMatch(ts, /createClient|@supabase|\bsupabase\s*\.|insert\s*\(|update\s*\(|delete\s*\(/i);
  [
    "src/app/api/audit-and-governance/route.ts",
    "src/app/api/eve-08-audit-and-governance/route.ts",
    "src/app/dev/audit-and-governance/page.tsx",
    "src/app/dev/eve-08-audit-and-governance/page.tsx",
  ].forEach((wiredSurfacePath) => {
    assert.equal(existsSync(longPath(wiredSurfacePath)), false);
  });
  assert.doesNotMatch(ts, /\b(connectEveBrain|writeRegistry|triggerRuntime|triggerDiagnosis|triggerExport|triggerParallelProduction|executeSql|writeSupabase|mutateWorkMap|mutateSignificado)\s*\(/i);
});
