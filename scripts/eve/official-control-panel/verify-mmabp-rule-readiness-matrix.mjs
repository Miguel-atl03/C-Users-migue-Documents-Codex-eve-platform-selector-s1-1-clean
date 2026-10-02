#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rulesDir = path.join(root, "reports", "local", "mmabp-rule-readiness", "rules");
const runnerPath = path.join(root, "reports", "local", "mmabp-rule-readiness", "runner-result.json");
const structuredPath = path.join(root, "reports", "local", "mmabp-structured-rule-inputs", "runner-result.json");
const outFile = path.join(root, "reports", "local", "mmabp-rule-readiness", "verifier-summary.json");
const requirementsPath = path.join(root, "scripts", "eve", "official-control-panel", "mmabp-rule-readiness-requirements.v1.json");

execFileSync(process.execPath, [path.join(root, "scripts", "eve", "official-control-panel", "verify-mmabp-rule-input-readiness.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const files = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter((file) => file.endsWith(".json")).sort() : [];
const rules = files.map((file) => JSON.parse(fs.readFileSync(path.join(rulesDir, file), "utf8")));
const runner = fs.existsSync(runnerPath) ? JSON.parse(fs.readFileSync(runnerPath, "utf8")) : null;
const structured = fs.existsSync(structuredPath) ? JSON.parse(fs.readFileSync(structuredPath, "utf8")) : null;
const runId = runner?.normalizationRunId ?? rules[0]?.normalizationRunId ?? null;
const dbMetrics = runId ? sqlJson(`select public.eve_mmabp_structured_input_metrics('${runId}'::uuid)`) : null;
const dbRun = runId ? sqlJson(`select to_jsonb(t) from public.mmabp_structured_normalization_run t where id = '${runId}'::uuid`) : null;
const snapshotStatus = runner?.snapshotId ? sqlJson(`select public.eve_mmabp_snapshot_status_v2('${runner.snapshotId}'::uuid)`) : { stale: true };
const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));

const combinedMetrics = {
  ...dbMetrics,
  ...(structured?.metrics ?? {}),
};

const requiredZeroMetrics = [
  "structuredElementsMissingSourceIds",
  "normalizedFieldsInvented",
  "crossSnapshotRelations",
  "relationsCreatedByNameSimilarity",
  "duplicateNormalizedElements",
  "gapsWithoutRuleId",
  "algorithmRegistryFalseClaims",
  "directServiceRoleDmlGrants",
  "physicalNegativeControlsExpected",
  "physicalNegativeControlsExecuted",
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
  "schemaRequiredFieldRejectionsExpected",
  "schemaRequiredFieldRejectionsExecuted",
  "notApplicableControls",
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

const metrics = {
  rulesTotal: rules.length,
  normalizationRunMissing: dbRun ? 0 : 1,
  runCountsEmpty: dbRun && Object.keys(dbRun.counts ?? {}).length > 0 ? 0 : 1,
  requirementsContainPreassignedLot: /fallbackLot|"\s*lot\s*"|lote/i.test(JSON.stringify(requirements)) ? 1 : 0,
  rulesWithoutSourceReference: rules.filter((rule) => !rule.sourceDocument || !rule.sourceSection).length,
  rulesWithoutDatabaseProbe: rules.filter((rule) => !rule.databaseProbeIds?.some((probe) => probe.startsWith("normalization_run:"))).length,
  rulesWithMissingEvidenceHashes: rules.filter((rule) => !rule.evidenceSha256?.ruleEvidence || !rule.evidenceSha256?.result).length,
  rulesMarkedDataReadyWithMissingInputs: rules.filter((rule) => rule.dataReady && ((rule.missingInputs?.length ?? 0) > 0 || (rule.missingRelations?.length ?? 0) > 0)).length,
  rulesMarkedAlgorithmReadyWithoutImplementation: rules.filter((rule) => rule.algorithmReady && !rule.algorithmExisting).length,
  rulesMarkedImplementableWithoutTraceability: rules.filter((rule) => rule.implementableWithoutInvention && !rule.dataReady).length,
  rulesAssignedToMultipleLots: rules.filter((rule) => Array.isArray(rule.derivedLot)).length,
  rulesUsingStaleSnapshot: snapshotStatus.stale === true ? 1 : 0,
  rulesDependingOnUnstructuredFreeText: rules.filter((rule) => rule.dataReady && JSON.stringify(rule.fieldCoverage ?? []).match(/free_text|literal_value|open_text/i)).length,
  rulesWithFalsePositiveNegativeProbe: combinedMetrics?.rulesWithFalsePositiveNegativeProbe ?? null,
  ...Object.fromEntries(requiredZeroMetrics.map((metric) => [metric, combinedMetrics?.[metric] ?? null])),
};

const nullMetrics = Object.entries(metrics).filter(([, value]) => value === null).map(([key]) => key);
const ok =
  metrics.rulesTotal === 27 &&
  metrics.normalizationRunMissing === 0 &&
  metrics.physicalNegativeControlsExpected > 0 &&
  metrics.physicalNegativeControlsExpected === metrics.physicalNegativeControlsExecuted &&
  metrics.schemaRequiredFieldRejectionsExpected > 0 &&
  metrics.schemaRequiredFieldRejectionsExpected === metrics.schemaRequiredFieldRejectionsExecuted &&
  nullMetrics.length === 0 &&
  Object.entries(metrics)
    .filter(([key]) => ![
      "rulesTotal",
      "physicalNegativeControlsExpected",
      "physicalNegativeControlsExecuted",
      "schemaRequiredFieldRejectionsExpected",
      "schemaRequiredFieldRejectionsExecuted",
      "notApplicableControls",
    ].includes(key))
    .every(([, value]) => value === 0);

const result = {
  ok,
  runnerStatus: ok ? "passed" : "failed",
  generatedAt: new Date().toISOString(),
  meaning: "ok=true means readiness JSON was regenerated, DB was reconsulted, no preassigned lot exists, and unproved metrics are not accepted.",
  metrics,
  nullMetrics,
  derivedLots: rules.reduce((acc, rule) => {
    acc[rule.derivedLot] = (acc[rule.derivedLot] ?? 0) + 1;
    return acc;
  }, {}),
  dictamen: ok
    ? "READINESS FISICO MMABP VERIFICADO - CONTROLES NEGATIVOS SCHEMA-VALIDOS, TRAZABLES Y REPRODUCIBLES"
    : "READINESS MMABP BLOQUEADO - INTEGRIDAD CAUSAL, VALIDACION O TRAZABILIDAD INCOMPLETA",
  invariants: {
    producer: "NO_INICIADO",
    cp012: "BLOQUEADO",
    r4: "BLOQUEADO",
    r5: "PROVISIONAL",
  },
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!ok) process.exitCode = 1;

function sqlJson(sql) {
  const output = execFileSync("docker", ["exec", "-i", "supabase_db_eve-platform", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", `select coalesce((${sql})::text, 'null')`], { cwd: root, encoding: "utf8" });
  return JSON.parse(output.trim() || "null");
}
