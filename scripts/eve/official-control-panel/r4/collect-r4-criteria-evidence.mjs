#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const REPORT = resolve(ROOT, "reports/local/rector-r4-acceptance");
const RAW = resolve(REPORT, "criteria-raw");
const OUT = resolve(REPORT, "criteria");
const RUNNER = resolve(ROOT, "reports/p9a-playwright-report.json");
const GENERATED = resolve(REPORT, "generated/r4-criteria.generated.json");

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function flattenSpecs(suite, out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const result = test.results?.[test.results.length - 1] ?? {};
      out.push({
        title: spec.title,
        status: result.status ?? test.outcome ?? "skipped",
        durationMs: Number(result.duration ?? 0),
        ok: test.ok === true,
      });
    }
  }
  for (const child of suite.suites ?? []) flattenSpecs(child, out);
  return out;
}

function runnerIndex() {
  const report = readJson(RUNNER);
  if (!report) throw new Error("playwright_json_report_missing");
  const index = new Map();
  for (const suite of report.suites ?? []) {
    for (const test of flattenSpecs(suite)) index.set(test.title, test);
  }
  return index;
}

function gitCheckpoint() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unavailable";
  }
}

function migrationHead() {
  try {
    return execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_eve-platform",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-tAc",
        "select version from supabase_migrations.schema_migrations order by version desc limit 1;",
      ],
      { cwd: ROOT, encoding: "utf8" },
    ).trim();
  } catch {
    return "unavailable";
  }
}

function rawEvidence(id, polarity) {
  const path = resolve(RAW, `${id}-${polarity}.json`);
  const json = readJson(path);
  return {
    path,
    json,
    exists: Boolean(json),
    sha256: existsSync(path) ? sha256File(path) : null,
  };
}

function normalizeStatus(test) {
  if (!test) return "skipped";
  if (test.status === "passed" && test.ok) return "passed";
  if (test.status === "skipped") return "skipped";
  return test.status === "passed" ? "passed" : "failed";
}

function generatedCriteria() {
  const generated = readJson(GENERATED);
  const criteria = generated?.criteria;
  if (!Array.isArray(criteria) || criteria.length !== 19) {
    throw new Error("r4_generated_criteria_missing_or_invalid");
  }
  return criteria;
}

function evidenceList(raw, field) {
  const value = raw.json?.evidence?.[field];
  return Array.isArray(value) ? value : [];
}

function evidenceObject(raw, field) {
  const value = raw.json?.evidence?.[field];
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function mergeUnique(...arrays) {
  return [...new Set(arrays.flat().filter(Boolean))];
}

function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(resolve(REPORT, "diagnostics"), { recursive: true });
  const tests = runnerIndex();
  const commit = gitCheckpoint();
  const head = migrationHead();
  const executedAt = new Date().toISOString();
  const summaries = [];

  for (const criterion of generatedCriteria()) {
    const {
      criterionId,
      literalText,
      literalTextSha256,
      semanticObligations,
      relatedFixtureIds,
    } = criterion;
    const positiveTestId = `${criterionId}-POS`;
    const negativeTestId = `${criterionId}-NEG`;
    const positive = tests.get(positiveTestId);
    const negative = tests.get(negativeTestId);
    const posRaw = rawEvidence(criterionId, "POS");
    const negRaw = rawEvidence(criterionId, "NEG");
    const evidenceRefs = (raw) =>
      raw.exists
        ? [
            {
              kind: "technical-json",
              path: raw.path.replace(ROOT + "\\", "").replaceAll("\\", "/"),
              sha256: raw.sha256,
            },
          ]
        : [];
    const screenshotPaths = [];
    const screenshotSha256 = [];
    for (const raw of [posRaw, negRaw]) {
      const paths = raw.json?.evidence?.screenshotPaths;
      if (Array.isArray(paths)) {
        for (const path of paths) {
          if (existsSync(path)) {
            screenshotPaths.push(path);
            screenshotSha256.push(sha256File(path));
          }
        }
      }
    }
    const manifest = {
      criterionId,
      literalText,
      literalTextSha256: literalTextSha256 ?? sha256Text(literalText),
      semanticObligations,
      relatedFixtureIds,
      positiveTestId,
      positiveAssertions: evidenceList(posRaw, "assertions"),
      positiveStatus: normalizeStatus(positive),
      positiveDurationMs: positive?.durationMs ?? 0,
      positiveEvidence: evidenceRefs(posRaw),
      negativeTestId,
      negativeAssertions: evidenceList(negRaw, "assertions"),
      negativeStatus: normalizeStatus(negative),
      negativeDurationMs: negative?.durationMs ?? 0,
      negativeEvidence: evidenceRefs(negRaw),
      backendProbeIds: mergeUnique(
        evidenceList(posRaw, "backendProbeIds"),
        evidenceList(negRaw, "backendProbeIds"),
        [positiveTestId, negativeTestId],
      ),
      uiEvidence: mergeUnique(evidenceList(posRaw, "uiEvidence"), evidenceList(negRaw, "uiEvidence")),
      databaseEvidence: mergeUnique(
        evidenceList(posRaw, "databaseEvidence"),
        evidenceList(negRaw, "databaseEvidence"),
      ),
      screenshotHashes: screenshotSha256,
      screenshotPaths,
      screenshotSha256,
      runnerReportHash: sha256File(RUNNER),
      playwrightRunId: sha256File(RUNNER).slice(0, 16),
      securityBundleScan: evidenceObject(posRaw, "securityBundleScan") ?? evidenceObject(negRaw, "securityBundleScan"),
      exactArtifactAcceptanceProof:
        evidenceObject(posRaw, "exactArtifactAcceptanceProof") ??
        evidenceObject(negRaw, "exactArtifactAcceptanceProof"),
      conformanceBeforeConsistencyProof:
        evidenceObject(posRaw, "conformanceBeforeConsistencyProof") ??
        evidenceObject(negRaw, "conformanceBeforeConsistencyProof"),
      usesArtificialDomAsOnlyEvidence:
        posRaw.json?.evidence?.usesArtificialDomAsOnlyEvidence === true ||
        negRaw.json?.evidence?.usesArtificialDomAsOnlyEvidence === true,
      gitCheckpoint: commit,
      gitCommitOrCheckpoint: commit,
      migrationHead: head,
      executedAt,
    };
    writeFileSync(
      resolve(OUT, `${criterionId}.json`),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    summaries.push({
      criterionId,
      positiveStatus: manifest.positiveStatus,
      negativeStatus: manifest.negativeStatus,
      positiveEvidence: manifest.positiveEvidence.length,
      negativeEvidence: manifest.negativeEvidence.length,
    });
  }

  const summary = {
    ok: summaries.every(
      (row) =>
        row.positiveStatus === "passed" &&
        row.negativeStatus === "passed" &&
        row.positiveEvidence > 0 &&
        row.negativeEvidence > 0,
    ),
    criteriaTotal: summaries.length,
    summaries,
    generatedAt: executedAt,
  };
  writeFileSync(
    resolve(REPORT, "diagnostics/criteria-collection-summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  process.stdout.write(JSON.stringify(summary) + "\n");
  if (!summary.ok) process.exitCode = 1;
}

main();
