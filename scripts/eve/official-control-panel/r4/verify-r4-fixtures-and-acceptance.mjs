#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const REPORT = resolve(ROOT, "reports/local/rector-r4-acceptance");
const MANIFEST_PATH = resolve(REPORT, "manifest.json");
const FX_E2E_PATH = resolve(REPORT, "results/e2e-r4.json");
const CRITERIA_DIR = resolve(REPORT, "criteria");
const SOURCE_EXTRACT = resolve(
  ROOT,
  "reports/local/rector-r4-r5-final/source/RECTOR_22_1_CRITERIA_EXTRACT.json",
);
const PLAYWRIGHT_JSON = resolve(ROOT, "reports/p9a-playwright-report.json");
const DIAG = resolve(REPORT, "diagnostics");
const SHOTS = resolve(REPORT, "screenshots");
const MATRIX = resolve(
  ROOT,
  "docs/eve/panel-control/RECTOR_R4_ACCEPTANCE_CRITERIA_MATRIX.md",
);
const ROUTE = resolve(
  ROOT,
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts",
);

const FX_IDS = Array.from(
  { length: 12 },
  (_, index) => "FX-" + String(index + 1).padStart(2, "0"),
);
const CRITERIA_IDS = [
  ...Array.from(
    { length: 13 },
    (_, index) => "CP-" + String(index + 1).padStart(3, "0"),
  ),
  ...Array.from(
    { length: 4 },
    (_, index) => "UX-" + String(index + 1).padStart(3, "0"),
  ),
  "SEC-001",
  "A11Y-001",
];
const REQUIRED_SHOTS = [
  "01-fx01-empresa-saludable.png",
  "02-fx02-usuario-multirrol.png",
  "03-fx03-seleccion-hasta-ocho.png",
  "04-fx04-seleccion-mayor-ocho.png",
  "05-fx05-workmap-coverage-gap.png",
  "06-fx06-ruta-b2-faltante.png",
  "07-fx07-feedback-b3.png",
  "08-fx08-trabajo-manual.png",
  "09-fx09-rework-p-sup-06.png",
  "10-fx10-exportacion-bloqueada.png",
  "11-fx11-experiencia-soporte.png",
  "12-fx12-final-alternativo.png",
];

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function writeJson(name, value) {
  mkdirSync(DIAG, { recursive: true });
  writeFileSync(resolve(DIAG, name), JSON.stringify(value, null, 2) + "\n");
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value.normalize("NFC"), "utf8").digest("hex");
}

function sourceCriteria() {
  const extract = readJson(SOURCE_EXTRACT);
  const rows = extract?.criteria;
  if (!Array.isArray(rows) || rows.length !== 19) {
    throw new Error("r4_docx_source_extract_missing_or_invalid");
  }
  const criteria = new Map();
  for (const row of rows) {
    criteria.set(row.criterionId, {
      literalText: row.literalText,
      literalTextSha256: row.literalTextSha256 ?? sha256Text(row.literalText),
      semanticObligations: [],
    });
  }
  return criteria;
}

function psqlJson(sql) {
  const run = spawnSync(
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
      sql,
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (run.status !== 0) {
    throw new Error("r4_db_probe_failed:" + (run.stderr || run.stdout));
  }
  return JSON.parse(run.stdout.trim());
}

function flattenSpecs(suite, out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const result = test.results?.[test.results.length - 1] ?? {};
      const passed = spec.ok === true && (test.status === "expected" || result.status === "passed");
      out.push({
        title: spec.title,
        ok: passed,
        status: passed ? "passed" : (result.status ?? test.status ?? "skipped"),
      });
    }
  }
  for (const child of suite.suites ?? []) flattenSpecs(child, out);
  return out;
}

function runnerTitles() {
  const report = readJson(PLAYWRIGHT_JSON);
  const map = new Map();
  if (!report) return map;
  for (const suite of report.suites ?? []) {
    for (const item of flattenSpecs(suite)) map.set(item.title, item);
  }
  return map;
}

function matrixClaimsPass(matrix, id) {
  const row = matrix
    .split(/\r?\n/)
    .find((line) => line.startsWith("| " + id + " |"));
  return Boolean(row && /PASS/i.test(row) && !/BLOQUEAD|FAIL/i.test(row));
}

function validEvidenceRefs(refs) {
  return (
    Array.isArray(refs) &&
    refs.length > 0 &&
    refs.every(
      (ref) =>
        typeof ref.path === "string" &&
        typeof ref.sha256 === "string" &&
        /^[a-f0-9]{64}$/.test(ref.sha256),
    )
  );
}

async function main() {
  const manifest = readJson(MANIFEST_PATH);
  const fxE2e = readJson(FX_E2E_PATH);
  const matrix = existsSync(MATRIX) ? readFileSync(MATRIX, "utf8") : "";
  const route = existsSync(ROUTE) ? readFileSync(ROUTE, "utf8") : "";
  const tests = runnerTitles();
  const baseline = sourceCriteria();
  const metrics = {
    criteriaTotal: CRITERIA_IDS.length,
    criteriaPositiveExecuted: 0,
    criteriaNegativeExecuted: 0,
    criteriaPositiveFailed: 0,
    criteriaNegativeFailed: 0,
    criteriaSkipped: 0,
    criteriaWithSyntheticTestIds: 0,
    criteriaSharingPositiveNegativeResult: 0,
    criteriaWithoutEvidence: 0,
    criteriaContradictingMatrix: 0,
    criteriaFalsePasses: 0,
    fixturesSeedOnly: 0,
    fixturesFlowNotExecuted: 0,
    screenshotsWithLoading: 0,
    screenshotsWithFatal: 0,
    screenshotsMissing: 0,
    productRoutesAcceptingFixturePaths: 0,
    clientSuppliedWorkMapAccepted: 0,
    selectionIdempotencyConcurrencyFailures: 0,
    selectionLedgerDirectDmlGrants: 0,
    selectionLedgerHistoryMutations: 0,
    crossCompanyLeaks: 0,
    crossCaseLeaks: 0,
    amberProductMutations: 0,
    criteriaLiteralMismatches: 0,
    criteriaMissingSemanticObligations: 0,
    criteriaPositiveAssertionGaps: 0,
    criteriaNegativeAssertionGaps: 0,
    criteriaTestsOnlyMatchingByName: 0,
    criteriaUsingArtificialDomAsOnlyEvidence: 0,
    criteriaMissingBackendProof: 0,
    criteriaMissingUiProof: 0,
    criteriaMissingSecurityBundleScan: 0,
    criteriaMissingExactArtifactAcceptanceProof: 0,
    criteriaMissingConformanceBeforeConsistencyProof: 0,
    criteriaSemanticGaps: 0,
  };
  const notes = [];

  for (const id of FX_IDS) {
    const fixture = manifest?.fixtures?.[id];
    const flow = fxE2e?.transitions?.[id];
    if (!fixture?.ok || flow?.executed !== true) {
      metrics.fixturesFlowNotExecuted += 1;
      notes.push("fixture_flow_not_executed:" + id);
    }
    if (flow?.seedPreconditionOnly === true) {
      metrics.fixturesSeedOnly += 1;
      notes.push("fixture_seed_only:" + id);
    }
  }

  const screenshotEvidence = new Map(
    (fxE2e?.screenshotEvidence ?? []).map((item) => [item.name, item]),
  );
  const present = new Set(
    existsSync(SHOTS)
      ? readdirSync(SHOTS).filter((name) => name.endsWith(".png"))
      : [],
  );
  const screenshotHashes = {};
  for (const name of REQUIRED_SHOTS) {
    const path = resolve(SHOTS, name);
    const evidence = screenshotEvidence.get(name);
    if (!present.has(name)) {
      metrics.screenshotsMissing += 1;
      notes.push("screenshot_missing:" + name);
      continue;
    }
    const hash = sha256(path);
    screenshotHashes[name] = hash;
    if (evidence?.sha256 && evidence.sha256 !== hash) {
      metrics.screenshotsWithFatal += 1;
      notes.push("screenshot_hash_mismatch:" + name);
    }
    if (evidence?.loadingAbsent !== true) {
      metrics.screenshotsWithLoading += 1;
      notes.push("screenshot_loading_not_proven:" + name);
    }
    if (evidence?.fatalAbsent !== true) {
      metrics.screenshotsWithFatal += 1;
      notes.push("screenshot_fatal_not_proven:" + name);
    }
  }

  for (const id of CRITERIA_IDS) {
    const criterion = readJson(resolve(CRITERIA_DIR, `${id}.json`));
    const expectedPositive = `${id}-POS`;
    const expectedNegative = `${id}-NEG`;
    const runnerPositive = tests.get(expectedPositive);
    const runnerNegative = tests.get(expectedNegative);
    const baselineCriterion = baseline.get(id);
    if (
      !criterion ||
      criterion.positiveTestId !== expectedPositive ||
      criterion.negativeTestId !== expectedNegative ||
      !runnerPositive ||
      !runnerNegative
    ) {
      metrics.criteriaWithSyntheticTestIds += 1;
      notes.push("criterion_runner_id_missing:" + id);
    }
    if (criterion?.positiveTestId === criterion?.negativeTestId) {
      metrics.criteriaSharingPositiveNegativeResult += 1;
      notes.push("criterion_same_pos_neg_id:" + id);
    }
    const posPassed =
      runnerPositive?.status === "passed" &&
      runnerPositive?.ok === true &&
      criterion?.positiveStatus === "passed";
    const negPassed =
      runnerNegative?.status === "passed" &&
      runnerNegative?.ok === true &&
      criterion?.negativeStatus === "passed";
    if (runnerPositive) metrics.criteriaPositiveExecuted += 1;
    if (runnerNegative) metrics.criteriaNegativeExecuted += 1;
    if (runnerPositive?.status === "skipped" || runnerNegative?.status === "skipped") {
      metrics.criteriaSkipped += 1;
      notes.push("criterion_skipped:" + id);
    }
    if (!posPassed) metrics.criteriaPositiveFailed += 1;
    if (!negPassed) metrics.criteriaNegativeFailed += 1;
    if (
      !validEvidenceRefs(criterion?.positiveEvidence) ||
      !validEvidenceRefs(criterion?.negativeEvidence)
    ) {
      metrics.criteriaWithoutEvidence += 1;
      notes.push("criterion_evidence_missing:" + id);
    }
    if (matrixClaimsPass(matrix, id) && (!posPassed || !negPassed)) {
      metrics.criteriaContradictingMatrix += 1;
      notes.push("criterion_matrix_contradiction:" + id);
    }
    if (
      criterion &&
      (criterion.positiveTestId?.startsWith("r4-") ||
        criterion.negativeTestId?.startsWith("r4-") ||
        "positivePassed" in criterion ||
        "negativePassed" in criterion)
    ) {
      metrics.criteriaFalsePasses += 1;
      notes.push("criterion_legacy_synthetic_shape:" + id);
    }
    if (
      !baselineCriterion ||
      criterion?.literalText !== baselineCriterion.literalText ||
      criterion?.literalTextSha256 !== baselineCriterion.literalTextSha256
    ) {
      metrics.criteriaLiteralMismatches += 1;
      notes.push("criterion_literal_mismatch:" + id);
    }
    if (
      !Array.isArray(criterion?.semanticObligations) ||
      criterion.semanticObligations.length === 0
    ) {
      metrics.criteriaMissingSemanticObligations += 1;
      notes.push("criterion_semantic_obligations_missing:" + id);
    }
    if (!Array.isArray(criterion?.positiveAssertions) || criterion.positiveAssertions.length === 0) {
      metrics.criteriaPositiveAssertionGaps += 1;
      notes.push("criterion_positive_assertion_gap:" + id);
    }
    if (!Array.isArray(criterion?.negativeAssertions) || criterion.negativeAssertions.length === 0) {
      metrics.criteriaNegativeAssertionGaps += 1;
      notes.push("criterion_negative_assertion_gap:" + id);
    }
    if (
      runnerPositive &&
      runnerNegative &&
      (!Array.isArray(criterion?.positiveAssertions) ||
        !Array.isArray(criterion?.negativeAssertions) ||
        !validEvidenceRefs(criterion?.positiveEvidence) ||
        !validEvidenceRefs(criterion?.negativeEvidence))
    ) {
      metrics.criteriaTestsOnlyMatchingByName += 1;
      notes.push("criterion_only_name_match:" + id);
    }
    if (criterion?.usesArtificialDomAsOnlyEvidence === true) {
      metrics.criteriaUsingArtificialDomAsOnlyEvidence += 1;
      notes.push("criterion_artificial_dom_only:" + id);
    }
    if (!Array.isArray(criterion?.backendProbeIds) || criterion.backendProbeIds.length === 0) {
      metrics.criteriaMissingBackendProof += 1;
      notes.push("criterion_backend_proof_missing:" + id);
    }
    if (!Array.isArray(criterion?.uiEvidence) || criterion.uiEvidence.length === 0) {
      metrics.criteriaMissingUiProof += 1;
      notes.push("criterion_ui_proof_missing:" + id);
    }
    if (id === "SEC-001" && !criterion?.securityBundleScan) {
      metrics.criteriaMissingSecurityBundleScan += 1;
      notes.push("criterion_security_bundle_scan_missing:" + id);
    }
    if (id === "CP-006" && !criterion?.exactArtifactAcceptanceProof) {
      metrics.criteriaMissingExactArtifactAcceptanceProof += 1;
      notes.push("criterion_exact_artifact_acceptance_missing:" + id);
    }
    if (id === "CP-012" && !criterion?.conformanceBeforeConsistencyProof) {
      metrics.criteriaMissingConformanceBeforeConsistencyProof += 1;
      notes.push("criterion_conformance_before_consistency_missing:" + id);
    }
  }

  metrics.criteriaSemanticGaps =
    metrics.criteriaLiteralMismatches +
    metrics.criteriaMissingSemanticObligations +
    metrics.criteriaPositiveAssertionGaps +
    metrics.criteriaNegativeAssertionGaps +
    metrics.criteriaTestsOnlyMatchingByName +
    metrics.criteriaUsingArtificialDomAsOnlyEvidence +
    metrics.criteriaMissingBackendProof +
    metrics.criteriaMissingUiProof +
    metrics.criteriaMissingSecurityBundleScan +
    metrics.criteriaMissingExactArtifactAcceptanceProof +
    metrics.criteriaMissingConformanceBeforeConsistencyProof;

  if (/workMapPath|loadWorkMapFromAllowedFixturePath|tests\/fixtures\//.test(route)) {
    metrics.productRoutesAcceptingFixturePaths += 1;
    notes.push("activity_selection_route_accepts_fixture_path");
  }
  if (/workMap\??\s*:\s*unknown|body\.workMap\b|p_workmap_json/.test(route)) {
    metrics.clientSuppliedWorkMapAccepted += 1;
    notes.push("activity_selection_route_accepts_client_workmap");
  }

  const fx03 = fxE2e?.transitions?.["FX-03"];
  if (
    !fx03?.actionId ||
    fx03.concurrentReplayStatus !== 200 ||
    fx03.idempotencyConflict !== 409
  ) {
    metrics.selectionIdempotencyConcurrencyFailures += 1;
    notes.push("selection_concurrency_evidence_missing");
  }

  const db = psqlJson(
    [
      "select jsonb_build_object(",
      "'selection_direct_dml', (select count(*) from information_schema.role_table_grants",
      " where table_schema='public' and table_name='activity_selection_action_idempotency'",
      " and grantee in ('anon','authenticated','service_role')",
      " and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')),",
      "'selection_ledger_guards', (select count(*) from pg_trigger",
      " where tgrelid='public.activity_selection_action_idempotency'::regclass",
      " and not tgisinternal and tgname in",
      " ('aaa_prevent_activity_selection_idempotency_mutation',",
      "  'aaa_prevent_activity_selection_idempotency_truncate')),",
      "'amber_mutations', (",
      " (select count(*) from public.activity_selection_results",
      "  where case_id='19fc9eff-4219-43f0-854c-e2b3350f23f2'::uuid) +",
      " (select count(*) from public.experience_screen_event",
      "  where case_id='19fc9eff-4219-43f0-854c-e2b3350f23f2'::uuid) +",
      " (select count(*) from public.experience_support_action",
      "  where case_id='19fc9eff-4219-43f0-854c-e2b3350f23f2'::uuid)),",
      "'cross_case_events', (select count(*) from public.experience_screen_event e",
      " where not exists (select 1 from public.sesiones_llenado s where s.id=e.case_id)),",
      "'cross_case_actions', (select count(*) from public.experience_support_action a",
      " where not exists (select 1 from public.sesiones_llenado s where s.id=a.case_id)))",
    ].join(" "),
  );
  metrics.selectionLedgerDirectDmlGrants = Number(db.selection_direct_dml ?? 0);
  metrics.selectionLedgerHistoryMutations =
    Number(db.selection_ledger_guards ?? 0) === 2 ? 0 : 1;
  metrics.amberProductMutations = Number(db.amber_mutations ?? 0);
  metrics.crossCaseLeaks = Number(db.cross_case_events ?? 0) + Number(db.cross_case_actions ?? 0);
  metrics.crossCompanyLeaks = fxE2e?.security?.crossCompanyDenied === true ? 0 : 1;

  const ok =
    metrics.criteriaTotal === 19 &&
    metrics.criteriaPositiveExecuted === 19 &&
    metrics.criteriaNegativeExecuted === 19 &&
    metrics.criteriaPositiveFailed === 0 &&
    metrics.criteriaNegativeFailed === 0 &&
    metrics.criteriaSkipped === 0 &&
    Object.entries(metrics)
      .filter(([key]) => !["criteriaTotal", "criteriaPositiveExecuted", "criteriaNegativeExecuted"].includes(key))
      .every(([, value]) => value === 0);

  const summary = {
    ok,
    metrics,
    notes,
    screenshotHashes,
    fixtureRecords: FX_IDS.length,
    criteriaRecords: CRITERIA_IDS.length,
    generatedAt: new Date().toISOString(),
  };
  writeJson("verify-summary.json", summary);
  process.stdout.write(JSON.stringify(summary) + "\n");
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  const failure = {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
  writeJson("verify-summary.json", failure);
  process.stderr.write(JSON.stringify(failure) + "\n");
  process.exitCode = 1;
});
