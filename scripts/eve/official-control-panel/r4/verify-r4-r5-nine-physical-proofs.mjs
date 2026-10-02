#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const EVIDENCE = resolve(ROOT, "reports/local/rector-r4-r5-physical");
const SUMMARY = resolve(EVIDENCE, "verify-r4-r5-nine-physical-proofs-summary.json");

const TESTS = [
  "CP-002-X-WITHOUT-Y",
  "CP-002-Y-WITHOUT-X",
  "CP-006-PHYSICAL",
  "CP-012-PHYSICAL",
  "SEC-001-PHYSICAL",
  "A11Y-001-PHYSICAL",
  "R5-Q1-PHYSICAL",
  "R5-Q2-PHYSICAL",
  "R5-Q3-PHYSICAL",
  "R5-Q4-PHYSICAL",
];

const CRITICAL_METRICS = [
  "CP002PhysicalProofMissing",
  "CP002BidirectionalIsolationFailures",
  "CP006ExactArtifactMismatch",
  "CP006AuditProofMissing",
  "CP006NegativeMutationDetected",
  "CP012OrderingProofMissing",
  "CP012RunnerNotPassed",
  "CP012StalePackageNotRejected",
  "CP012RealProducerMissing",
  "CP012MutationProbeAccepted",
  "CP012FakeProducerUsed",
  "CP012ConsistencyBeforeConformanceAccepted",
  "CP012ProducerProofMissing",
  "CP012ClientResultAccepted",
  "CP012ConsistencyDimensionsCollapsed",
  "CP012AcaPromotedWithoutAllExistingGates",
  "CP012ExportEnabledWithoutExistingGates",
  "CP012IdempotencyConcurrencyFailures",
  "CP012DirectServiceRoleDmlGrants",
  "CP012HistoryMutationFailures",
  "CP012AuditReadbackMissing",
  "CP012UiFlowNotExecuted",
  "CP012DevOverlayPresent",
  "SEC001SourceScanMissing",
  "SEC001ClientBundleScanMissing",
  "SEC001RealHarMissing",
  "SEC001DirectDbRequests",
  "A11YStatesNotExecuted",
  "A11YStatesWithoutText",
  "A11YStatesWithoutIcon",
  "A11YStatesOnlyUsingColor",
  "R5QuestionsNotExecuted",
  "R5QuestionsWithoutOwnScreenshot",
  "R5QuestionsWithoutDbReadback",
  "R5QuestionsWithoutHttpTranscript",
  "syntheticEvidenceUsed",
];

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function hasFile(path) {
  return existsSync(path) && statSync(path).isFile();
}

function validateCommon(id, metrics, notes) {
  const dir = resolve(EVIDENCE, id);
  const required = [
    "runner-result.json",
    "http-transcript.json",
    "database-before.json",
    "database-after.json",
    "dom-snapshot.html",
    "screenshot.png",
    "hashes.json",
    "migration-head.json",
  ];
  for (const name of required) {
    if (!hasFile(resolve(dir, name))) {
      notes.push(`missing:${id}:${name}`);
      return false;
    }
  }
  const hashes = readJson(resolve(dir, "hashes.json")) ?? {};
  for (const [name, expected] of Object.entries(hashes.files ?? hashes)) {
    const path = resolve(dir, name);
    if (!hasFile(path) || sha256(path) !== expected) {
      notes.push(`hash_mismatch:${id}:${name}`);
      return false;
    }
  }
  const runner = readJson(resolve(dir, "runner-result.json"));
  if (runner?.syntheticEvidenceUsed === true) {
    metrics.syntheticEvidenceUsed += 1;
  }
  return true;
}

function main() {
  const metrics = Object.fromEntries(CRITICAL_METRICS.map((key) => [key, 0]));
  const notes = [];

  for (const id of TESTS) {
    if (!validateCommon(id, metrics, notes)) {
      if (id.startsWith("CP-002")) metrics.CP002PhysicalProofMissing += 1;
      if (id.startsWith("R5-Q")) metrics.R5QuestionsNotExecuted += 1;
    }
  }

  for (const id of ["CP-002-X-WITHOUT-Y", "CP-002-Y-WITHOUT-X"]) {
    const runner = readJson(resolve(EVIDENCE, id, "runner-result.json"));
    if (!runner?.assertions?.oneAxisFailedOneAxisSurvived) {
      metrics.CP002BidirectionalIsolationFailures += 1;
      notes.push(`cp002_axis_isolation_failed:${id}`);
    }
  }

  const cp006 = readJson(resolve(EVIDENCE, "CP-006-PHYSICAL", "runner-result.json"));
  if (!cp006?.assertions?.sameArtifactVersionAndSha) metrics.CP006ExactArtifactMismatch += 1;
  if (!cp006?.assertions?.auditRefAndAppendOnlyEvent) metrics.CP006AuditProofMissing += 1;
  if (cp006?.assertions?.negativeMutationsDetected !== 0) metrics.CP006NegativeMutationDetected += 1;

  const cp012 = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "runner-result.json"));
  const cp012Ledger = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "event-ledger.json"));
  const cp012ConformanceReports = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "conformance-report.json"));
  const cp012ConsistencyReports = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "consistency-report.json"));
  const cp012Audit = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "product-action-audit.json"));
  const cp012Idempotency = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "idempotency-ledger.json"));
  const cp012Aca = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "aca-before-after.json"));
  const cp012Export = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "export-gate-before-after.json"));
  const cp012Dom = hasFile(resolve(EVIDENCE, "CP-012-PHYSICAL", "dom-snapshot.html"))
    ? readFileSync(resolve(EVIDENCE, "CP-012-PHYSICAL", "dom-snapshot.html"), "utf8")
    : "";
  if (cp012?.assertions?.realProducerAvailable === false) {
    const mutationProbes = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "mutation-probes.json"));
    const capabilityReadback = readJson(resolve(EVIDENCE, "CP-012-PHYSICAL", "capability-readback.json"));
    if (cp012?.ok !== true || cp012?.runnerStatus !== "passed") {
      metrics.CP012RunnerNotPassed += 1;
      notes.push("cp012_runner_did_not_pass_blocker_probe");
    }
    if (cp012?.assertions?.stalePackageRejected !== true) {
      metrics.CP012StalePackageNotRejected += 1;
      notes.push("cp012_stale_package_not_rejected");
    }
    if (cp012?.assertions?.fakeProducerNotUsed !== true) {
      metrics.CP012FakeProducerUsed += 1;
      notes.push("cp012_fake_producer_used");
    }
    if (Array.isArray(cp012ConformanceReports) && cp012ConformanceReports.length > 0) {
      metrics.CP012FakeProducerUsed += 1;
      notes.push("cp012_conformance_report_created_without_real_producer");
    }
    if (Array.isArray(cp012ConsistencyReports) && cp012ConsistencyReports.length > 0) {
      metrics.CP012FakeProducerUsed += 1;
      notes.push("cp012_consistency_report_created_without_real_producer");
    }
    if (!Array.isArray(mutationProbes) || mutationProbes.some((probe) => probe?.result?.accepted !== false)) {
      metrics.CP012MutationProbeAccepted += 1;
      notes.push("cp012_mutation_probe_missing_or_accepted");
    }
    if (capabilityReadback?.assessmentActions) {
      const actions = Object.values(capabilityReadback.assessmentActions);
      if (actions.some(Boolean)) {
        metrics.CP012OrderingProofMissing += 1;
        notes.push("cp012_capability_readback_exposed_assessment_action_without_producer");
      }
    } else {
      metrics.CP012OrderingProofMissing += 1;
      notes.push("cp012_capability_readback_missing");
    }
    metrics.CP012RealProducerMissing += 1;
    notes.push(
      "CP-012 BLOQUEADO: el repositorio controla el orden, pero no materializa todavía una evaluación factual MMABP suficiente.",
    );
  } else {
  for (const file of [
    "playwright-report.json",
    "product-action-audit.json",
    "idempotency-ledger.json",
    "aca-before-after.json",
    "export-gate-before-after.json",
  ]) {
    if (!hasFile(resolve(EVIDENCE, "CP-012-PHYSICAL", file))) {
      metrics.CP012OrderingProofMissing += 1;
      notes.push(`missing:CP-012-PHYSICAL:${file}`);
    }
  }
  const cp012Conformance = Array.isArray(cp012ConformanceReports)
    ? cp012ConformanceReports.find((report) => report?.status === "passed")
    : null;
  const cp012Consistency = Array.isArray(cp012ConsistencyReports)
    ? cp012ConsistencyReports.find((report) => report?.status === "passed")
    : null;
  const cp012Events = Array.isArray(cp012Ledger?.assessmentEvents)
    ? cp012Ledger.assessmentEvents
    : [];
  const cp012ConformanceCompleted = cp012Events.find(
    (event) =>
      event?.package_id === cp012Conformance?.package_id &&
      event?.package_version === cp012Conformance?.package_version &&
      event?.assessment_type === "conformance" &&
      event?.event_type === "assessment_completed",
  );
  const cp012ConsistencyStarted = cp012Events.find(
    (event) =>
      event?.package_id === cp012Conformance?.package_id &&
      event?.package_version === cp012Conformance?.package_version &&
      event?.assessment_type === "consistency" &&
      event?.event_type === "assessment_started",
  );
  const cp012SamePackageVersion =
    Boolean(cp012Conformance && cp012Consistency) &&
    cp012Conformance.package_id === cp012Consistency.package_id &&
    cp012Conformance.package_version === cp012Consistency.package_version;
  const cp012Ordered =
    Boolean(cp012ConformanceCompleted && cp012ConsistencyStarted) &&
    new Date(cp012ConformanceCompleted.occurred_at).getTime() <
      new Date(cp012ConsistencyStarted.occurred_at).getTime();
  if (
    !cp012SamePackageVersion ||
    !cp012Ordered ||
    !cp012?.assertions?.conformanceCompletedBeforeConsistencyStarted ||
    !cp012?.assertions?.negativeZeroConsistencyEventBeforeConformance ||
    !cp012?.assertions?.negativeZeroReportAcaExportBeforeConformance
  ) {
    metrics.CP012OrderingProofMissing += 1;
  }
  if (
    cp012?.assertions?.consistencyBeforeConformanceAccepted === true ||
    cp012?.assertions?.consistencyBeforeConformanceAccepted > 0
  ) {
    metrics.CP012ConsistencyBeforeConformanceAccepted += 1;
  }
  const conformanceProducer = String(cp012Conformance?.result?.producer ?? "");
  const consistencyProducer = String(cp012Consistency?.result?.producer ?? "");
  if (
    !conformanceProducer ||
    !consistencyProducer ||
    conformanceProducer.startsWith("eve_cp012_build_") ||
    consistencyProducer.startsWith("eve_cp012_build_")
  ) {
    metrics.CP012ProducerProofMissing += 1;
  }
  if (cp012?.assertions?.clientResultWasIgnored !== true) {
    metrics.CP012ClientResultAccepted += 1;
  }
  const dimensions = cp012Consistency?.result?.dimensions ?? {};
  const hasSeparateDimensions = ["factual", "temporal", "structural", "composite"].every(
    (key) => typeof dimensions[key] === "string",
  );
  if (!hasSeparateDimensions || cp012?.assertions?.consistencyDimensionsCollapsed > 0) {
    metrics.CP012ConsistencyDimensionsCollapsed += 1;
  }
  if (cp012?.assertions?.acaPromotedWithoutAllExistingGates > 0) {
    metrics.CP012AcaPromotedWithoutAllExistingGates += 1;
  }
  if (cp012?.assertions?.exportEnabledWithoutExistingGates > 0) {
    metrics.CP012ExportEnabledWithoutExistingGates += 1;
  }
  if (cp012?.assertions?.idempotencyConcurrencyFailures > 0 || !Array.isArray(cp012Idempotency) || cp012Idempotency.length < 4) {
    metrics.CP012IdempotencyConcurrencyFailures += 1;
  }
  if (cp012?.assertions?.directServiceRoleDmlGrants > 0) {
    metrics.CP012DirectServiceRoleDmlGrants += 1;
  }
  if (cp012?.assertions?.historyMutationFailures > 0) {
    metrics.CP012HistoryMutationFailures += 1;
  }
  if (!Array.isArray(cp012Audit) || cp012Audit.length === 0 || cp012?.assertions?.auditReadbackMissing > 0) {
    metrics.CP012AuditReadbackMissing += 1;
  }
  if (cp012?.assertions?.uiFlowNotExecuted > 0) {
    metrics.CP012UiFlowNotExecuted += 1;
  }
  if (/Compiling|Rendering|DevTools|next-dev/i.test(cp012Dom) || cp012?.assertions?.devOverlayPresent > 0) {
    metrics.CP012DevOverlayPresent += 1;
  }
  if (
    Array.isArray(cp012Aca?.after) &&
    cp012Aca.after.some((row) => row?.aca_status === "Satisfied")
  ) {
    metrics.CP012AcaPromotedWithoutAllExistingGates += 1;
  }
  if (
    Array.isArray(cp012Export?.after) &&
    cp012Export.after.some((row) => row?.export_eligibility === "eligible")
  ) {
    metrics.CP012ExportEnabledWithoutExistingGates += 1;
  }
  }

  const sec = readJson(resolve(EVIDENCE, "SEC-001-PHYSICAL", "runner-result.json"));
  if (!sec?.assertions?.sourceAstScanExecuted) metrics.SEC001SourceScanMissing += 1;
  if (!sec?.assertions?.clientBundleScanExecuted) metrics.SEC001ClientBundleScanMissing += 1;
  if (!hasFile(resolve(EVIDENCE, "SEC-001-PHYSICAL", "network.har"))) metrics.SEC001RealHarMissing += 1;
  if ((sec?.assertions?.directDbRequests ?? 1) !== 0) metrics.SEC001DirectDbRequests += 1;

  const a11y = readJson(resolve(EVIDENCE, "A11Y-001-PHYSICAL", "runner-result.json"));
  if ((a11y?.assertions?.statesExecuted ?? 0) < 1) metrics.A11YStatesNotExecuted += 1;
  if ((a11y?.assertions?.statesWithoutText ?? 1) !== 0) metrics.A11YStatesWithoutText += 1;
  if ((a11y?.assertions?.statesWithoutIcon ?? 1) !== 0) metrics.A11YStatesWithoutIcon += 1;
  if ((a11y?.assertions?.statesOnlyUsingColor ?? 1) !== 0) metrics.A11YStatesOnlyUsingColor += 1;

  for (const q of ["R5-Q1-PHYSICAL", "R5-Q2-PHYSICAL", "R5-Q3-PHYSICAL", "R5-Q4-PHYSICAL"]) {
    if (!hasFile(resolve(EVIDENCE, q, "screenshot.png"))) metrics.R5QuestionsWithoutOwnScreenshot += 1;
    if (!hasFile(resolve(EVIDENCE, q, "database-after.json"))) metrics.R5QuestionsWithoutDbReadback += 1;
    if (!hasFile(resolve(EVIDENCE, q, "http-transcript.json"))) metrics.R5QuestionsWithoutHttpTranscript += 1;
  }

  const ok = CRITICAL_METRICS.every((key) => metrics[key] === 0);
  const summary = { ok, metrics, notes, evidenceRoot: EVIDENCE, verifiedAt: new Date().toISOString() };
  mkdirSync(dirname(SUMMARY), { recursive: true });
  writeFileSync(SUMMARY, JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(resolve(EVIDENCE, "CP-012-PHYSICAL", "verifier-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  process.stdout.write(JSON.stringify(summary) + "\n");
  if (!ok) process.exitCode = 1;
}

main();
