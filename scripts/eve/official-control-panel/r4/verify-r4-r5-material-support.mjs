#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const FINAL = resolve(ROOT, "reports/local/rector-r4-r5-final");
const SOURCE_MANIFEST = resolve(FINAL, "source/RECTOR_SOURCE_MANIFEST.json");
const SOURCE_EXTRACT = resolve(FINAL, "source/RECTOR_22_1_CRITERIA_EXTRACT.json");
const MATERIAL = resolve(FINAL, "MATERIAL_SUPPORT_MANIFEST.json");
const SUMMARY = resolve(FINAL, "verify-r4-r5-material-support-summary.json");
const AUTHORIZED_SHA256 =
  "8d18675cfbd0f370ddba5391313d2558703266ed9d67123319dc31ffb477dff2";

const CRITICAL_METRICS = [
  "rectorSourceMissing",
  "rectorSourceHashMismatch",
  "criteriaExtractMismatch",
  "claimsWithoutMaterialSupport",
  "evidenceFilesMissing",
  "evidenceHashesMismatch",
  "runnerTestsMissing",
  "databaseEvidenceMissing",
  "httpEvidenceMissing",
  "uiEvidenceMissing",
  "migrationHeadUnavailable",
  "CP002BidirectionalProofMissing",
  "CP006ExactAcceptanceProofMissing",
  "CP012OrderingProofMissing",
  "SEC001ClientBundleProofMissing",
  "SEC001NetworkProofMissing",
  "A11YVisibleStatesMissing",
  "R5RulesWithoutIndividualTrace",
  "R5QuestionsWithoutExecutedRoute",
  "R5QuestionsWithoutOwnScreenshot",
  "R5QuestionsWithoutOwnHash",
];

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function rel(path) {
  return path.replace(ROOT + "\\", "").replaceAll("\\", "/");
}

function isBadMigration(value) {
  return !value || ["unavailable", "unknown", "latest", "current"].includes(String(value).toLowerCase());
}

function fileExists(path, metrics, notes, label) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    metrics.evidenceFilesMissing += 1;
    notes.push(`missing:${label}:${rel(path)}`);
    return false;
  }
  return true;
}

function verifySide(id, side, metrics, notes) {
  const dir = resolve(FINAL, `criteria/${id}/${side}`);
  const required = [
    "runner-result.json",
    "assertions.json",
    "http-transcript.json",
    "database-before.json",
    "database-after.json",
    "dom-snapshot.html",
    "screenshot.png",
    "hashes.json",
  ];
  for (const name of required) fileExists(resolve(dir, name), metrics, notes, `${id}:${side}:${name}`);
  const runner = readJson(resolve(dir, "runner-result.json"));
  if (!runner?.ok || runner?.runnerStatus !== "passed") {
    metrics.runnerTestsMissing += 1;
    notes.push(`runner_not_passed:${id}:${side}`);
  }
  const assertions = readJson(resolve(dir, "assertions.json"));
  if (!Array.isArray(assertions?.assertions) || assertions.assertions.length === 0) {
    metrics.claimsWithoutMaterialSupport += 1;
    notes.push(`assertions_missing:${id}:${side}`);
  }
  const http = readJson(resolve(dir, "http-transcript.json"));
  if (!http?.applicable || !Array.isArray(http.backendProbeIds) || http.backendProbeIds.length === 0) {
    metrics.httpEvidenceMissing += 1;
    notes.push(`http_material_missing:${id}:${side}`);
  }
  const dbAfter = readJson(resolve(dir, "database-after.json"));
  if (!dbAfter) {
    metrics.databaseEvidenceMissing += 1;
    notes.push(`database_after_missing:${id}:${side}`);
  }
  if (!existsSync(resolve(dir, "dom-snapshot.html"))) {
    metrics.uiEvidenceMissing += 1;
    notes.push(`dom_snapshot_missing:${id}:${side}`);
  }
  const hashes = readJson(resolve(dir, "hashes.json")) ?? {};
  for (const [name, expectedHash] of Object.entries(hashes)) {
    const path = resolve(dir, name);
    if (!existsSync(path) || sha256File(path) !== expectedHash) {
      metrics.evidenceHashesMismatch += 1;
      notes.push(`hash_mismatch:${id}:${side}:${name}`);
    }
  }
}

function main() {
  const metrics = Object.fromEntries(CRITICAL_METRICS.map((key) => [key, 0]));
  const notes = [];
  const source = readJson(SOURCE_MANIFEST);
  const extract = readJson(SOURCE_EXTRACT);
  const material = readJson(MATERIAL);

  if (!source) metrics.rectorSourceMissing += 1;
  if (source?.sha256 !== AUTHORIZED_SHA256 || extract?.source?.sha256 !== AUTHORIZED_SHA256) {
    metrics.rectorSourceHashMismatch += 1;
    notes.push("source_sha256_mismatch");
  }
  if (!Array.isArray(extract?.criteria) || extract.criteria.length !== 19) {
    metrics.criteriaExtractMismatch += 1;
    notes.push("criteria_extract_not_19");
  }
  if (!Array.isArray(material?.entries) || material.entries.length !== 19) {
    metrics.R5RulesWithoutIndividualTrace += 1;
    notes.push("material_entries_not_19");
  }
  if (isBadMigration(material?.migration?.appliedHead)) {
    metrics.migrationHeadUnavailable += 1;
    notes.push("material_migration_head_unavailable");
  }

  for (const row of extract?.criteria ?? []) {
    const id = row.criterionId;
    const base = resolve(FINAL, `criteria/${id}`);
    for (const name of ["criterion-source.json", "claim-map.json", "criterion-verdict.json"]) {
      fileExists(resolve(base, name), metrics, notes, `${id}:${name}`);
    }
    const verdict = readJson(resolve(base, "criterion-verdict.json"));
    if (verdict?.result !== "PASS") {
      metrics.claimsWithoutMaterialSupport += 1;
      notes.push(`criterion_not_pass:${id}`);
    }
    if (isBadMigration(verdict?.migrationHead)) {
      metrics.migrationHeadUnavailable += 1;
      notes.push(`criterion_migration_head_unavailable:${id}`);
    }
    verifySide(id, "positive", metrics, notes);
    verifySide(id, "negative", metrics, notes);
  }

  const cp002Pos = readJson(resolve(FINAL, "criteria/CP-002/positive/assertions.json"));
  const cp002Neg = readJson(resolve(FINAL, "criteria/CP-002/negative/assertions.json"));
  if (
    !JSON.stringify(cp002Pos ?? {}).includes("support axis") ||
    !JSON.stringify(cp002Neg ?? {}).includes("core rail")
  ) {
    metrics.CP002BidirectionalProofMissing += 1;
    notes.push("cp002_bidirectional_assertions_missing");
  }
  const cp006 = readJson(resolve(FINAL, "criteria/CP-006/positive/database-after.json"));
  if (!cp006?.factualReadback?.exactArtifactAcceptanceProof) {
    metrics.CP006ExactAcceptanceProofMissing += 1;
    notes.push("cp006_exact_acceptance_missing");
  }
  const cp012 = readJson(resolve(FINAL, "criteria/CP-012/positive/database-after.json"));
  if (!cp012?.factualReadback?.conformanceBeforeConsistencyProof) {
    metrics.CP012OrderingProofMissing += 1;
    notes.push("cp012_ordering_proof_missing");
  }
  if (!existsSync(resolve(FINAL, "security/client-bundle-scan.json"))) {
    metrics.SEC001ClientBundleProofMissing += 1;
    notes.push("sec001_client_bundle_scan_missing");
  }
  if (!existsSync(resolve(FINAL, "security/network.har")) || !existsSync(resolve(FINAL, "security/network-assertions.json"))) {
    metrics.SEC001NetworkProofMissing += 1;
    notes.push("sec001_network_proof_missing");
  }
  const inventory = readJson(resolve(FINAL, "a11y/VISIBLE_STATE_INVENTORY.json"));
  if (!Array.isArray(inventory?.states) || inventory.states.length < 20) {
    metrics.A11YVisibleStatesMissing += 1;
    notes.push("a11y_visible_state_inventory_incomplete");
  }

  for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
    const dir = resolve(ROOT, `reports/local/rector-r5-final/${q}`);
    if (!existsSync(resolve(dir, "route-and-query.json"))) {
      metrics.R5QuestionsWithoutExecutedRoute += 1;
      notes.push(`r5_route_missing:${q}`);
    }
    if (!existsSync(resolve(dir, "screenshot.png"))) {
      metrics.R5QuestionsWithoutOwnScreenshot += 1;
      notes.push(`r5_screenshot_missing:${q}`);
    }
    const hashes = readJson(resolve(dir, "hashes.json"));
    if (!hashes || Object.keys(hashes).length === 0) {
      metrics.R5QuestionsWithoutOwnHash += 1;
      notes.push(`r5_hashes_missing:${q}`);
    }
  }

  const ok = CRITICAL_METRICS.every((key) => metrics[key] === 0);
  const summary = {
    ok,
    metrics,
    notes,
    verifiedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(SUMMARY), { recursive: true });
  writeFileSync(SUMMARY, JSON.stringify(summary, null, 2) + "\n");
  process.stdout.write(JSON.stringify(summary) + "\n");
  if (!ok) process.exitCode = 1;
}

main();
