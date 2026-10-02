#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "reports", "local", "mmabp-structured-rule-inputs");
const readinessRunner = path.join(root, "reports", "local", "mmabp-rule-readiness", "runner-result.json");
const appendOnlyError = "mmabp_structured_inputs_append_only";
const structuredTables = [
  "mmabp_rule_algorithm_registry",
  "mmabp_structured_normalization_run",
  "mmabp_structured_pm_input",
  "mmabp_structured_pf_input",
  "mmabp_structured_moc_input",
  "mmabp_structured_olc_input",
  "mmabp_structured_cross_reference",
  "mmabp_structured_input_gap",
];

main();

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(readinessRunner)) {
    throw new Error("run_verify_mmabp_rule_input_readiness_first");
  }
  const runner = JSON.parse(fs.readFileSync(readinessRunner, "utf8"));
  const runId = runner.normalizationRunId;
  const replay = normalizeAgain(runner.snapshotId);
  const metrics = sqlJson(`select public.eve_mmabp_structured_input_metrics('${runId}'::uuid)`);
  const appendOnly = probeAppendOnly();
  const negativeSnapshots = provisionPhysicalNegativeControls();
  const readback = {
    run: sqlJson(`select to_jsonb(t) from public.mmabp_structured_normalization_run t where id = '${runId}'::uuid`),
    counts: {
      pm: countTable("mmabp_structured_pm_input", runId),
      pf: countTable("mmabp_structured_pf_input", runId),
      moc: countTable("mmabp_structured_moc_input", runId),
      olc: countTable("mmabp_structured_olc_input", runId),
      gaps: countTable("mmabp_structured_input_gap", runId),
    },
  };
  const criticalMetrics = [
    "structuredElementsMissingSourceIds",
    "normalizedFieldsInvented",
    "crossSnapshotRelations",
    "relationsCreatedByNameSimilarity",
    "duplicateNormalizedElements",
    "gapsWithoutRuleId",
    "algorithmRegistryFalseClaims",
    "directServiceRoleDmlGrants",
  ];
  const computedMetrics = {
    ...metrics,
    physicalNegativeControlsExpected: negativeSnapshots.metrics.physicalNegativeControlsExpected,
    physicalNegativeControlsExecuted: negativeSnapshots.metrics.physicalNegativeControlsExecuted,
    negativeSnapshotsMissing: negativeSnapshots.metrics.negativeSnapshotsMissing,
    negativeSnapshotsReusingPositiveSnapshot: negativeSnapshots.metrics.negativeSnapshotsReusingPositiveSnapshot,
    negativeSnapshotsWithSameHash: negativeSnapshots.metrics.negativeSnapshotsWithSameHash,
    negativeControlsWithMultipleSemanticChanges: negativeSnapshots.metrics.negativeControlsWithMultipleSemanticChanges,
    affectedRulesNotChanged: negativeSnapshots.metrics.affectedRulesNotChanged,
    unaffectedRulesChanged: negativeSnapshots.metrics.unaffectedRulesChanged,
    negativeControlsWithoutDbReadback: negativeSnapshots.metrics.negativeControlsWithoutDbReadback,
    negativeSnapshotsReusingPositivePackages: negativeSnapshots.metrics.negativeSnapshotsReusingPositivePackages,
    negativeControlsNotClonedFromPersistedPositive: negativeSnapshots.metrics.negativeControlsNotClonedFromPersistedPositive,
    negativeControlsWithoutNormalizationRun: negativeSnapshots.metrics.negativeControlsWithoutNormalizationRun,
    negativeControlsWithoutStructuralDiff: negativeSnapshots.metrics.negativeControlsWithoutStructuralDiff,
    schemaRequiredFieldRejectionsExpected: negativeSnapshots.metrics.schemaRequiredFieldRejectionsExpected,
    schemaRequiredFieldRejectionsExecuted: negativeSnapshots.metrics.schemaRequiredFieldRejectionsExecuted,
    notApplicableControls: negativeSnapshots.metrics.notApplicableControls,
    unresolvedDependencies: negativeSnapshots.metrics.unresolvedDependencies,
    staleSummaryReuseDetected: negativeSnapshots.metrics.staleSummaryReuseDetected,
    metricsWithoutPhysicalDerivation: negativeSnapshots.metrics.metricsWithoutPhysicalDerivation,
    schemaRequiredFieldRejectionsMissing: negativeSnapshots.metrics.schemaRequiredFieldRejectionsMissing,
    notApplicableControlsCountedAsPass: negativeSnapshots.metrics.notApplicableControlsCountedAsPass,
    positivePersistedValidationFailures: negativeSnapshots.metrics.positivePersistedValidationFailures,
    physicalNegativesWithSchemaValidationFailed: negativeSnapshots.metrics.physicalNegativesWithSchemaValidationFailed,
    physicalNegativesWithSchemaValidationMissing: negativeSnapshots.metrics.physicalNegativesWithSchemaValidationMissing,
    controlsMisclassifiedAsSchemaValid: negativeSnapshots.metrics.controlsMisclassifiedAsSchemaValid,
    schemaFailuresIncorrectlyCountedAsPhysicalPass: negativeSnapshots.metrics.schemaFailuresIncorrectlyCountedAsPhysicalPass,
    postIngestionDiffMissing: negativeSnapshots.metrics.postIngestionDiffMissing,
    productionLogicDuplicatedInTestScripts: negativeSnapshots.metrics.productionLogicDuplicatedInTestScripts,
    verificationCommandsWithoutLogs: negativeSnapshots.metrics.verificationCommandsWithoutLogs,
    rulesMarkedDataReadyWithMissingFields: countRulesMarkedDataReadyWithMissingFields(),
    lotAssignmentsNotDerived: countLotAssignmentsNotDerived(),
    historyMutationFailures: appendOnly.historyMutationFailures,
    rulesUsingStaleSnapshot: countRulesUsingStaleSnapshot(),
    rulesWithFalsePositiveNegativeProbe: negativeSnapshots.falsePositiveNegativeProbeCount ?? 0,
  };
  const extraCriticalMetrics = [
    "negativeSnapshotsMissing",
    "negativeSnapshotsReusingPositiveSnapshot",
    "negativeSnapshotsWithSameHash",
    "negativeControlsWithMultipleSemanticChanges",
    "affectedRulesNotChanged",
    "unaffectedRulesChanged",
    "negativeControlsWithoutDbReadback",
    "negativeSnapshotsReusingPositivePackages",
    "negativeControlsNotClonedFromPersistedPositive",
    "negativeControlsWithoutNormalizationRun",
    "negativeControlsWithoutStructuralDiff",
    "unresolvedDependencies",
    "staleSummaryReuseDetected",
    "metricsWithoutPhysicalDerivation",
    "schemaRequiredFieldRejectionsMissing",
    "notApplicableControlsCountedAsPass",
    "positivePersistedValidationFailures",
    "physicalNegativesWithSchemaValidationFailed",
    "physicalNegativesWithSchemaValidationMissing",
    "controlsMisclassifiedAsSchemaValid",
    "schemaFailuresIncorrectlyCountedAsPhysicalPass",
    "postIngestionDiffMissing",
    "productionLogicDuplicatedInTestScripts",
    "verificationCommandsWithoutLogs",
    "rulesMarkedDataReadyWithMissingFields",
    "lotAssignmentsNotDerived",
    "historyMutationFailures",
    "rulesUsingStaleSnapshot",
    "rulesWithFalsePositiveNegativeProbe",
  ];
  const ok =
    replay.normalizationRunId === runId &&
    replay.idempotentReplay === true &&
    JSON.stringify(replay.counts ?? {}) === JSON.stringify(readback.run.counts ?? {}) &&
    Object.keys(replay.counts ?? {}).length > 0 &&
    criticalMetrics.every((metric) => computedMetrics[metric] === 0) &&
    extraCriticalMetrics.every((metric) => computedMetrics[metric] === 0) &&
    appendOnly.ok === true &&
    negativeSnapshots.ok === true &&
    computedMetrics.physicalNegativeControlsExpected === computedMetrics.physicalNegativeControlsExecuted &&
    computedMetrics.schemaRequiredFieldRejectionsExpected === computedMetrics.schemaRequiredFieldRejectionsExecuted &&
    computedMetrics.physicalNegativeControlsExpected > 0 &&
    readback.counts.pm + readback.counts.pf + readback.counts.moc + readback.counts.olc > 0;

  const result = {
    ok,
    runnerStatus: ok ? "passed" : "failed",
    generatedAt: new Date().toISOString(),
    normalizationRunId: runId,
    snapshotId: runner.snapshotId,
    idempotencyReplay: replay,
    metrics: computedMetrics,
    appendOnly,
    readback,
    negativeSnapshots,
    invariants: {
      producer: "NO_INICIADO",
      cp012: "BLOQUEADO",
      r4: "BLOQUEADO",
      r5: "PROVISIONAL",
    },
  };
  fs.writeFileSync(path.join(outDir, "runner-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "normalization-readback.json"), `${JSON.stringify(readback, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "normalization-metrics.json"), `${JSON.stringify(computedMetrics, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "append-only-probes.json"), `${JSON.stringify(appendOnly, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "negative-snapshots.json"), `${JSON.stringify(result.negativeSnapshots, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!ok) process.exitCode = 1;
}

function normalizeAgain(snapshotId) {
  return sqlJson(`
    select public.eve_mmabp_normalize_structured_rule_inputs(
      '${snapshotId}'::uuid, '1.0.0', 'mmabp-structured-normalize-replay',
      'mmabp_structured_inputs_verifier',
      'scripts/eve/official-control-panel/verify-mmabp-structured-rule-inputs.mjs',
      '6f7f0000-0000-4000-9000-000000000011'::uuid
    )
  `);
}

function probeAppendOnly() {
  const byTable = {};
  let historyMutationFailures = 0;
  for (const table of structuredTables) {
    const idColumn = table === "mmabp_structured_input_gap" ? "gap_id" : "id";
    const rows = Number(runSql(`select count(*) from public.${table};`).trim());
    const needsTechnicalRow = table === "mmabp_structured_cross_reference" && rows === 0;
    const updateSql = needsTechnicalRow
      ? `begin; ${technicalCrossRefInsertSql()} update public.${table} set created_at = created_at where id = (select id from public.${table} order by created_at desc limit 1); rollback;`
      : `begin; update public.${table} set created_at = created_at where ${idColumn} = (select ${idColumn} from public.${table} limit 1); rollback;`;
    const deleteSql = needsTechnicalRow
      ? `begin; ${technicalCrossRefInsertSql()} delete from public.${table} where id = (select id from public.${table} order by created_at desc limit 1); rollback;`
      : `begin; delete from public.${table} where ${idColumn} = (select ${idColumn} from public.${table} limit 1); rollback;`;
    byTable[table] = {
      update: rows === 0 && !needsTechnicalRow ? { ok: false, skipped: true, reason: "no_positive_control_row" } : probeStatement(updateSql),
      delete: rows === 0 && !needsTechnicalRow ? { ok: false, skipped: true, reason: "no_positive_control_row" } : probeStatement(deleteSql),
      truncate: probeStatement(`begin; truncate table public.${table} cascade; rollback;`),
    };
    for (const probe of Object.values(byTable[table])) {
      if (!probe.ok) historyMutationFailures += 1;
    }
  }
  return { ok: Object.values(byTable).every((ops) => Object.values(ops).every((probe) => probe.ok)), historyMutationFailures, byTable };
}

function technicalCrossRefInsertSql() {
  return `
    insert into public.mmabp_structured_cross_reference (
      normalization_run_id, snapshot_id, company_id, case_id, reference_type,
      source_model_type, source_element_id, source_field, target_model_type, target_element_id,
      extraction_rule, explicit_source
    )
    select run.id, run.snapshot_id, run.company_id, run.case_id, 'TECHNICAL APPEND ONLY PROBE',
      'PM', pm.source_element_id, 'source_element_id_ref', 'PF', pf.source_element_id,
      'technical_append_only_probe', true
    from public.mmabp_structured_normalization_run run
    join public.mmabp_structured_pm_input pm on pm.normalization_run_id = run.id
    join public.mmabp_structured_pf_input pf on pf.normalization_run_id = run.id
    order by run.created_at desc
    limit 1;
  `;
}

function provisionPhysicalNegativeControls() {
  const summaryPath = path.join(root, "reports", "local", "mmabp-rule-readiness", "negative-controls", "summary.json");
  execFileSync(process.execPath, [path.join(root, "scripts", "eve", "official-control-panel", "provision-mmabp-readiness-negative-snapshots.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (!fs.existsSync(summaryPath)) throw new Error("negative_controls_summary_missing");
  return JSON.parse(fs.readFileSync(summaryPath, "utf8"));
}

function countRulesMarkedDataReadyWithMissingFields() {
  const files = fs.existsSync(path.join(root, "reports", "local", "mmabp-rule-readiness", "rules"))
    ? fs.readdirSync(path.join(root, "reports", "local", "mmabp-rule-readiness", "rules")).filter((file) => file.endsWith(".json"))
    : [];
  return files.filter((file) => {
    const rule = JSON.parse(fs.readFileSync(path.join(root, "reports", "local", "mmabp-rule-readiness", "rules", file), "utf8"));
    return rule.dataReady && ((rule.missingInputs?.length ?? 0) > 0 || (rule.missingRelations?.length ?? 0) > 0);
  }).length;
}

function countLotAssignmentsNotDerived() {
  const requirements = JSON.parse(fs.readFileSync(path.join(root, "scripts", "eve", "official-control-panel", "mmabp-rule-readiness-requirements.v1.json"), "utf8"));
  return /fallbackLot|"\s*lot\s*"|lote/i.test(JSON.stringify(requirements)) ? 1 : 0;
}

function countRulesUsingStaleSnapshot() {
  const runner = JSON.parse(fs.readFileSync(readinessRunner, "utf8"));
  const status = sqlJson(`select public.eve_mmabp_snapshot_status_v2('${runner.snapshotId}'::uuid)`);
  return status.stale === true ? 1 : 0;
}

function probeStatement(sql) {
  try {
    runSql(sql);
    return { ok: false, error: null };
  } catch (error) {
    const message = String(error.stderr || error.message || error);
    return { ok: message.includes(appendOnlyError), error: message };
  }
}

function countTable(table, runId) {
  return Number(runSql(`select count(*) from public.${table} where normalization_run_id = '${runId}'::uuid;`).trim());
}

function sqlJson(sql) {
  return JSON.parse(runSql(`select coalesce((${sql})::text, 'null');`).trim() || "null");
}

function runSql(sql) {
  return execFileSync("docker", ["exec", "-i", "supabase_db_eve-platform", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", sql], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}
