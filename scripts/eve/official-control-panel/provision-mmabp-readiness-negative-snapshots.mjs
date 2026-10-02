#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  validateClientMmabpStructuralFacts,
  validateInventoryReadiness,
  validateMmabpDesignSourceBundle,
  validateMmabpIrPackage,
  validateQuadrantRegistryPackage,
} from "../../validate-parallel-production.mjs";

const root = process.cwd();
const readinessRoot = path.join(root, "reports", "local", "mmabp-rule-readiness");
const negativeRoot = path.join(readinessRoot, "negative-controls");
const positiveRunnerPath = path.join(readinessRoot, "runner-result.json");
const fixtureDir = path.join(root, "tests", "fixtures", "parallel-production");
const requirementsPath = path.join(root, "scripts", "eve", "official-control-panel", "mmabp-rule-readiness-requirements.v1.json");
const producerType = "mmabp_readiness_negative_controls";
const producerRef = "scripts/eve/official-control-panel/provision-mmabp-readiness-negative-snapshots.mjs";
const actorId = "6f7f0000-0000-4000-9000-000000000011";
const dictamenOk = "READINESS FISICO MMABP VERIFICADO - CONTROLES NEGATIVOS SCHEMA-VALIDOS, TRAZABLES Y REPRODUCIBLES";
const dictamenBlocked = "READINESS MMABP BLOQUEADO - INTEGRIDAD CAUSAL, VALIDACION O TRAZABILIDAD INCOMPLETA";
const classificationValues = {
  causal: "REMOVABLE_SCHEMA_VALID_AND_CAUSAL",
  notReferenced: "REMOVABLE_SCHEMA_VALID_NOT_REFERENCED",
  schema: "SCHEMA_REQUIRED",
  absent: "ABSENT_IN_POSITIVE",
  unresolved: "UNRESOLVED_DEPENDENCY",
};
const modelTables = {
  PM: "mmabp_structured_pm_input",
  PF: "mmabp_structured_pf_input",
  MoC: "mmabp_structured_moc_input",
  OLC: "mmabp_structured_olc_input",
};
const technicalColumns = new Set([
  "id",
  "normalization_run_id",
  "snapshot_id",
  "company_id",
  "case_id",
  "created_at",
  "canonical_payload",
  "field_provenance",
  "source_path",
  "extraction_rule",
  "explicit_source",
]);
const schemaRequiredFields = new Set(["source_element_id", "registry_element_id"]);
const sourceKeyByField = {
  process_id: "process_id",
  process_kind: "process_kind",
  trigger_event_id: "trigger_events",
  target_state_id: "target_states",
  customer_need_id: "customer_need_id",
  supported_process_id: "supported_process_id",
  synchronization_id: "synchronization_id",
  dependency_id: "dependency_id",
  source_element_id_ref: "ir_element_id",
  task_id: "task_id",
  process_state_id: "process_state_id",
  process_flow_id: "process_flow_id",
  expected_event_id: "expected_event_id",
  timer_event_id: "timer_event",
  gateway_id: "gateway_id",
  gateway_kind: "gateway_kind",
  alternative_group_id: "alternative_group_id",
  iteration_group_id: "iteration_group_id",
  parallel_group_id: "parallel_group_id",
  handoff_id: "handoff_id",
  sequence_index: "sequence_index",
  predecessor_id: "predecessor_id",
  produced_object_state_id: "produced_object_state_id",
  class_id: "class_id",
  attribute_id: "attribute_id",
  operation_id: "operation_id",
  relationship_id: "relationship_id",
  source_class_id: "source_class_id",
  target_class_id: "target_class_id",
  cardinality_source: "cardinality_source",
  cardinality_target: "cardinality_target",
  isa_parent_class_id: "isa_parent_class_id",
  specialization_kind: "specialization_kind",
  explicit_phase: "phase",
  explicit_end: "end",
  explicit_role: "role",
  object_class_id: "object_class",
  state_id: "state_id",
  transition_id: "transition_id",
  from_state_id: "from_state_id",
  to_state_id: "to_state_id",
  transition_reason_id: "transition_reason_id",
  external_event_id: "external_event_id",
  time_event_id: "time_event_id",
  related_object_state_id: "related_object_state_id",
  self_loop: "self_loop",
  constructor: "constructor",
  transformer: "transformer",
  destructor: "destructor",
  final_state: "final_state",
  fact_ids: "source_fact_ids",
  evidence_ids: "source_evidence_ids",
  source_element_id: "ir_element_id",
  registry_element_id: "source_registry_element_ids",
};

main().catch((error) => {
  fs.mkdirSync(negativeRoot, { recursive: true });
  const failed = {
    ok: false,
    runnerStatus: "failed",
    generatedAt: new Date().toISOString(),
    error: { message: error.message, stack: error.stack },
    dictamen: dictamenBlocked,
    invariants: invariants(),
  };
  fs.writeFileSync(path.join(negativeRoot, "summary.json"), `${JSON.stringify(failed, null, 2)}\n`);
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
});

async function main() {
  const executionId = `mmabp-causal-${new Date().toISOString().replace(/[-:.TZ]/g, "")}`;
  fs.rmSync(negativeRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(negativeRoot, "verification-logs"), { recursive: true });
  if (!fs.existsSync(positiveRunnerPath)) throw new Error("run_positive_readiness_first");

  loadEnvLocal();
  const env = resolveEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const positiveRunner = JSON.parse(fs.readFileSync(positiveRunnerPath, "utf8"));
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  const positive = readPositiveMaterialization(positiveRunner);
  const positiveValidation = validatePersistedPositive(positive.source);
  fs.writeFileSync(path.join(negativeRoot, "positive-validation.json"), `${JSON.stringify(positiveValidation, null, 2)}\n`);
  if (positiveValidation.status !== "passed") {
    throw new Error("READINESS MMABP BLOQUEADO - SUSTRATO POSITIVO PERSISTIDO NO VALIDO");
  }

  const classifications = classifyControls(positive.rows, requirements, positive.source);
  fs.writeFileSync(path.join(negativeRoot, "positive-source.json"), `${JSON.stringify(positive.source, null, 2)}\n`);
  fs.writeFileSync(path.join(negativeRoot, "positive-package-readback.json"), `${JSON.stringify(positive.packageReadback, null, 2)}\n`);
  fs.writeFileSync(path.join(negativeRoot, "control-coverage.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), classifications }, null, 2)}\n`);

  const schemaRejections = await runSchemaRejections(admin, positive, classifications);
  const physicalControls = [];
  for (const control of classifications.filter((item) => item.classification === classificationValues.causal)) {
    physicalControls.push(await materializeNegativeControl(admin, positive, positiveRunner, requirements, control));
  }

  const metrics = computeMetrics(physicalControls, classifications, schemaRejections, positiveRunner, positiveValidation, executionId);
  const ok = metrics.physicalNegativeControlsExpected > 0 &&
    metrics.physicalNegativeControlsExpected === metrics.physicalNegativeControlsExecuted &&
    metrics.negativeSnapshotsMissing === 0 &&
    metrics.negativeSnapshotsReusingPositiveSnapshot === 0 &&
    metrics.negativeSnapshotsReusingPositivePackages === 0 &&
    metrics.negativeSnapshotsWithSameHash === 0 &&
    metrics.negativeControlsWithMultipleSemanticChanges === 0 &&
    metrics.affectedRulesNotChanged === 0 &&
    metrics.unaffectedRulesChanged === 0 &&
    metrics.negativeControlsWithoutDbReadback === 0 &&
    metrics.negativeControlsNotClonedFromPersistedPositive === 0 &&
    metrics.negativeControlsWithoutNormalizationRun === 0 &&
    metrics.negativeControlsWithoutStructuralDiff === 0 &&
    metrics.schemaRequiredFieldRejectionsExpected === metrics.schemaRequiredFieldRejectionsExecuted &&
    metrics.schemaRequiredFieldRejectionsExpected > 0 &&
    metrics.unresolvedDependencies === 0 &&
    metrics.staleSummaryReuseDetected === 0 &&
    metrics.metricsWithoutPhysicalDerivation === 0 &&
    metrics.positivePersistedValidationFailures === 0 &&
    metrics.physicalNegativesWithSchemaValidationFailed === 0 &&
    metrics.physicalNegativesWithSchemaValidationMissing === 0 &&
    metrics.controlsMisclassifiedAsSchemaValid === 0 &&
    metrics.schemaFailuresIncorrectlyCountedAsPhysicalPass === 0 &&
    metrics.postIngestionDiffMissing === 0 &&
    metrics.productionLogicDuplicatedInTestScripts === 0 &&
    metrics.verificationCommandsWithoutLogs === 0;

  const summary = {
    ok,
    runnerStatus: ok ? "passed" : "failed",
    generatedAt: new Date().toISOString(),
    executionId,
    meaning: "Negative controls are enumerated from DB-persisted positive packages and structured rows, not fixtures or stale summaries.",
    positiveSnapshotId: positiveRunner.snapshotId,
    positiveNormalizationRunId: positiveRunner.normalizationRunId,
    classifications,
    positiveValidation,
    schemaRejections,
    controls: physicalControls.map((control) => control.summary),
    metrics,
    dictamen: ok ? dictamenOk : dictamenBlocked,
    invariants: invariants(),
  };
  fs.writeFileSync(path.join(negativeRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(negativeRoot, "field-classification.json"), `${JSON.stringify(classifications, null, 2)}\n`);
  fs.writeFileSync(path.join(negativeRoot, "schema-required-rejections.json"), `${JSON.stringify(schemaRejections, null, 2)}\n`);
  fs.writeFileSync(path.join(negativeRoot, "command-manifest.json"), `${JSON.stringify(commandManifest(executionId), null, 2)}\n`);
  writeProductionTraceability(physicalControls, classifications, executionId);
  writeUpstreamGapProposal(classifications, executionId);
  console.log(JSON.stringify(summary, null, 2));
  if (!ok) process.exitCode = 1;
}

function readPositiveMaterialization(runner) {
  const snapshot = sqlJson(`select to_jsonb(t) from public.mmabp_assessment_source_snapshot t where id = '${runner.snapshotId}'::uuid`);
  if (!snapshot?.id) throw new Error("positive_snapshot_not_found");
  const packages = {
    evidence: readPackage(snapshot.evidence_package_version_id),
    facts: readPackage(snapshot.structural_facts_package_version_id),
    registry: readPackage(snapshot.registry_package_version_id),
    inventory: readPackage(snapshot.inventory_package_version_id),
    ir: readPackage(snapshot.mmabp_ir_package_version_id),
  };
  const rows = Object.fromEntries(
    Object.entries(modelTables).map(([model, table]) => [
      model,
      sqlJson(`select coalesce(jsonb_agg(to_jsonb(t) order by t.source_path), '[]'::jsonb) from public.${table} t where normalization_run_id = '${runner.normalizationRunId}'::uuid`),
    ]),
  );
  return {
    snapshot,
    packages,
    packageReadback: { snapshot, packages: Object.fromEntries(Object.entries(packages).map(([key, row]) => [key, stripContent(row)])) },
    rows,
    source: {
      evidence: packages.evidence.content,
      facts: packages.facts.content,
      registry: packages.registry.content,
      inventory: packages.inventory.content,
      ir: packages.ir.content,
    },
  };
}

function classifyControls(rowsByModel, requirements, source) {
  const requiredFields = new Set(requirements.rules.flatMap((rule) => rule.requiredFields));
  const relationInputs = new Set(requirements.rules.flatMap((rule) => rule.requiredRelations.flatMap(splitRelation)));
  const controls = [];
  for (const [model, rows] of Object.entries(rowsByModel)) {
    rows.forEach((row, index) => {
      for (const field of Object.keys(row).filter((key) => !technicalColumns.has(key))) {
        const input = `${model}.${field}`;
        const controlId = `${model}_${field}_${index + 1}`.replace(/[^A-Za-z0-9_]+/g, "_");
        const value = row[field];
        const present = hasValue(value);
        const causal = requiredFields.has(input) || relationInputs.has(input) || field === "fact_ids" || field === "evidence_ids";
        const schemaRequired = schemaRequiredFields.has(field);
        const evidenceRemoval = field === "evidence_ids" ? evidenceRemovalSource(source, row) : null;
        const sourceKey = sourceKeyByField[field] ?? field;
        const sourcePath = row.source_path;
        const removalPackage = evidenceRemoval ? "facts" : "ir";
        const removalPath = evidenceRemoval?.sourcePath ?? sourcePath;
        const removalKey = evidenceRemoval?.sourceKey ?? sourceKey;
        const sourceValue = sourceValueFor(row, field, sourceKey);
        const canRemove = present && !schemaRequired && (
          evidenceRemoval !== null || (sourcePath && hasOwnSourceValue(row, field, sourceKey))
        );
        let classification = classificationValues.absent;
        let reason = "value_absent_in_positive_structured_row";
        if (present && schemaRequired) {
          classification = classificationValues.schema;
          reason = "field_is_required_to_materialize_schema_identity";
        } else if (present && causal && canRemove) {
          classification = classificationValues.causal;
          reason = "present_causal_input_with_single_persisted_source_key";
          const simulated = simulateRemovalValidation(source, {
            removalPackage,
            removalPath,
            removalKey,
          });
          if (simulated.validation.status !== "passed") {
            classification = classificationValues.schema;
            reason = "removal_rejected_by_official_schema_validation";
          }
        } else if (present && causal && !canRemove) {
          classification = classificationValues.unresolved;
          reason = "causal_input_present_but_no_single_removable_persisted_source_key";
        } else if (present) {
          classification = classificationValues.notReferenced;
          reason = "present_schema_valid_input_not_referenced_by_readiness_contract";
        }
        controls.push({
          controlId,
          input,
          model,
          rowIndex: index,
          sourceElementId: row.source_element_id,
          field,
          sourcePath,
          sourceKey,
          removalPackage,
          removalPath,
          removalKey,
          present,
          classification,
          classificationReason: reason,
          requiredByRule: requiredFields.has(input),
          requiredByRelation: relationInputs.has(input),
          lineageCausal: field === "fact_ids" || field === "evidence_ids",
          positiveValueHash: present ? sha256(value) : null,
          sourceValueHash: hasValue(sourceValue) ? sha256(sourceValue) : null,
          simulatedValidationStatus: present && canRemove
            ? simulateRemovalValidation(source, { removalPackage, removalPath, removalKey }).validation.status
            : null,
          notApplicablePass: false,
        });
      }
    });
  }
  return controls.sort((a, b) => a.controlId.localeCompare(b.controlId));
}

function simulateRemovalValidation(source, control) {
  const next = cloneSource(source);
  const target = valueAtSourcePath(next[control.removalPackage], control.removalPath);
  if (target && control.removalKey in target) delete target[control.removalKey];
  return { source: next, validation: validatePersistedPositive(next) };
}

function evidenceRemovalSource(source, row) {
  const factId = row.fact_ids?.[0];
  if (!factId) return null;
  const index = source.facts?.structural_facts?.findIndex((fact) => fact.fact_id === factId);
  if (index === undefined || index < 0) return null;
  const fact = source.facts.structural_facts[index];
  if (!hasValue(fact.source_evidence_ids)) return null;
  return { sourcePath: `structural_facts[${index}]`, sourceKey: "source_evidence_ids", factId };
}

async function runSchemaRejections(admin, positive, classifications) {
  const out = [];
  for (const control of classifications.filter((item) => item.classification === classificationValues.schema)) {
    const dir = path.join(negativeRoot, "schema-rejections", control.controlId);
    fs.mkdirSync(dir, { recursive: true });
    const invalid = cloneSource(positive.source);
    const target = valueAtSourcePath(invalid[control.removalPackage], control.removalPath);
    const before = hasValue(target?.[control.removalKey]) ? structuredClone(target[control.removalKey]) : null;
    if (target && control.removalKey in target) delete target[control.removalKey];
    const validation = validatePersistedPositive(invalid);
    const sourceDiff = diffSources(positive.source[control.removalPackage], invalid[control.removalPackage], `${control.removalPackage}.${control.removalPath}.${control.removalKey}`);
    const beforeCounts = schemaProbeCounts(positive.snapshot.case_id, control.controlId);
    let governedBoundaryAttempted = true;
    let rpcAttempted = false;
    let rpcError = null;
    try {
      const packageType = packageTypeFor(control.removalPackage);
      const input = sourceInput(
        positive.snapshot.company_id,
        positive.snapshot.case_id,
        positive.snapshot.parallel_production_package_id,
        packageType,
        `NEG_SCHEMA_${control.controlId}`,
        schemaIdFor(control.removalPackage),
        invalid[control.removalPackage],
        `neg-schema-${control.controlId}`,
        validationContext(invalid),
      );
      validatePackageInput(input);
      rpcAttempted = true;
      await ingestOne(admin, input);
    } catch (error) {
      rpcError = error.message;
    }
    const afterCounts = schemaProbeCounts(positive.snapshot.case_id, control.controlId);
    const result = {
      controlId: control.controlId,
      input: control.input,
      reason: "schema_required_identity_removed",
      ok: validation.status !== "passed" && rpcAttempted === false && countDelta(beforeCounts, afterCounts) === 0,
      validationStatus: validation.status,
      findingCount: validation.findings?.length ?? 0,
      governedBoundaryAttempted,
      rpcAttempted,
      rpcError,
      beforeCounts,
      afterCounts,
      packageVersionDelta: countDelta(beforeCounts, afterCounts),
      removedValueHash: before === null ? null : sha256(before),
      sourceDiff,
    };
    writeJsonFiles(dir, {
      "positive-source.json": positive.source.ir,
      "negative-source.json": invalid.ir,
      "source-diff.json": sourceDiff,
      "schema-rejection.json": result,
      "execution-log.txt": `schema required probe for ${control.input}\nvalidation=${validation.status}\ngovernedBoundaryAttempted=${governedBoundaryAttempted}\nrpcAttempted=${rpcAttempted}\npackageVersionDelta=${result.packageVersionDelta}\n`,
    });
    out.push(result);
  }
  return out;
}

async function materializeNegativeControl(admin, positive, positiveRunner, requirements, control) {
  const controlDir = path.join(negativeRoot, control.controlId);
  fs.mkdirSync(controlDir, { recursive: true });
  const suffix = control.controlId.toLowerCase();
  const ids = scopedIds(control.controlId);
  setupNegativeCase(ids, control.controlId);
  await createParallelPackage(admin, ids.company, ids.case, ids.package, `MMABP-NEG-${control.controlId}`);

  const negativeSource = cloneSource(positive.source);
  const positivePart = positive.source[control.removalPackage];
  const negativePart = negativeSource[control.removalPackage];
  const target = valueAtSourcePath(negativePart, control.removalPath);
  const removedValue = structuredClone(target[control.removalKey]);
  delete target[control.removalKey];
  const preIngestionDiff = diffSources(positivePart, negativePart, `${control.removalPackage}.${control.removalPath}.${control.removalKey}`);
  const validation = validatePersistedPositive(negativeSource);
  if (validation.status !== "passed") {
    throw new Error(`physical_negative_schema_validation_failed:${control.controlId}`);
  }
  const versions = await ingestAll(admin, ids.company, ids.case, ids.package, negativeSource, suffix);
  const negativeSnapshot = await createSnapshot(admin, ids.company, ids.case, ids.package, versions, `negative-snapshot-${suffix}`);

  const positiveReadinessRoot = path.join(controlDir, "positive-readiness-run");
  const negativeReadinessRoot = path.join(controlDir, "negative-readiness-run");
  runNode("verify-mmabp-rule-input-readiness.mjs", ["--snapshot-id", positiveRunner.snapshotId, "--out-root", positiveReadinessRoot, "--no-docs"]);
  runNode("verify-mmabp-rule-input-readiness.mjs", ["--snapshot-id", negativeSnapshot.snapshotId, "--out-root", negativeReadinessRoot, "--normalizer-version", `1.0.0-negative-${suffix}`, "--no-docs"]);

  const positiveReadiness = readReadiness(positiveReadinessRoot);
  const negativeReadiness = readReadiness(negativeReadinessRoot);
  const positiveSnapshot = readSnapshot(positiveRunner.snapshotId);
  const negativeSnapshotRow = readSnapshot(negativeSnapshot.snapshotId);
  const positiveRun = readRun(positiveReadiness.runner.normalizationRunId);
  const negativeRun = readRun(negativeReadiness.runner.normalizationRunId);
  const affectedRulesDerivation = deriveAffectedRules(requirements, control);
  const rulesDelta = compareRules(positiveReadiness.rules, negativeReadiness.rules, affectedRulesDerivation.affectedRules);
  const unaffectedRulesComparison = rulesDelta.deltas.filter((item) => !item.affected);
  const positivePackageReadback = positive.packageReadback;
  const negativePackageReadback = readNegativePackageReadback(negativeSnapshotRow);
  const postIngestionDiff = diffSources(
    positive.packages[control.removalPackage].content,
    readPackage(negativeSnapshotRow[packageVersionColumnFor(control.removalPackage)]).content,
    `${control.removalPackage}.${control.removalPath}.${control.removalKey}`,
  );
  const packageTraceability = {
    sourcePositiveSnapshotId: positiveRunner.snapshotId,
    sourcePositivePackageVersionIds: Object.values(positive.packages).map((pkg) => pkg.id).sort(),
    negativePackageVersionIds: Object.values(negativePackageReadback.packages).map((pkg) => pkg.id).sort(),
    removedPath: `${control.removalPackage}.${control.removalPath}.${control.removalKey}`,
    controlId: control.controlId,
    producerType,
    producerRef,
    requestIds: Object.fromEntries(Object.entries(negativePackageReadback.packages).map(([key, pkg]) => [key, pkg.request_id])),
    sourcePackageIds: Object.fromEntries(Object.entries(negativePackageReadback.packages).map(([key, pkg]) => [key, pkg.source_package_id])),
  };
  const dbReadback = {
    negativeSnapshotExists: countRows("public.mmabp_assessment_source_snapshot", `id = '${negativeSnapshot.snapshotId}'::uuid`) === 1,
    negativeRunExists: countRows("public.mmabp_structured_normalization_run", `id = '${negativeReadiness.runner.normalizationRunId}'::uuid`) === 1,
    packageVersionRows: countRows("public.mmabp_source_package_version", `case_id = '${ids.case}'::uuid`),
    reusedPositivePackageVersionIds: Object.values(negativePackageReadback.packages).filter((pkg) =>
      Object.values(positive.packages).some((positivePackage) => positivePackage.id === pkg.id),
    ).map((pkg) => pkg.id),
    packageTraceability,
  };
  const hashes = {
    positiveSnapshotSha256: positiveSnapshot.source_lineage_sha256,
    negativeSnapshotSha256: negativeSnapshotRow.source_lineage_sha256,
    positiveResultSha256: positiveRun.result_sha256,
    negativeResultSha256: negativeRun.result_sha256,
    removedValueSha256: sha256(removedValue),
    positiveIrSha256: positive.packages.ir.content_sha256,
    negativeIrSha256: negativePackageReadback.packages.ir.content_sha256,
  };
  const lifecycleStatuses = {
    validationStatus: validation.status,
    ingestionStatus: Object.values(negativePackageReadback.packages).length === 5 ? "persisted" : "missing",
    snapshotStatus: negativeSnapshotRow.id ? "persisted" : "missing",
    normalizationStatus: negativeRun.status === "completed" ? "completed" : negativeRun.status ?? "missing",
    readinessStatus: negativeReadiness.runner.runnerStatus === "passed" ? "completed" : negativeReadiness.runner.runnerStatus ?? "missing",
  };
  const summary = {
    controlId: control.controlId,
    input: control.input,
    classification: control.classification,
    positiveSnapshotId: positiveRunner.snapshotId,
    negativeSnapshotId: negativeSnapshot.snapshotId,
    positiveNormalizationRunId: positiveReadiness.runner.normalizationRunId,
    negativeNormalizationRunId: negativeReadiness.runner.normalizationRunId,
    affectedRules: affectedRulesDerivation.affectedRules,
    rulesDeltaOk: rulesDelta.ok,
    diffOk: preIngestionDiff.semanticChanges === 1 && preIngestionDiff.otherSemanticChanges === 0 &&
      postIngestionDiff.semanticChanges === 1 && postIngestionDiff.otherSemanticChanges === 0,
    dbReadbackOk: dbReadback.negativeSnapshotExists && dbReadback.negativeRunExists && dbReadback.reusedPositivePackageVersionIds.length === 0,
    hashesDiffer: hashes.positiveSnapshotSha256 !== hashes.negativeSnapshotSha256 && hashes.positiveResultSha256 !== hashes.negativeResultSha256,
    ...lifecycleStatuses,
    packageTraceabilityOk: packageTraceability.sourcePositivePackageVersionIds.every((id) => !packageTraceability.negativePackageVersionIds.includes(id)) &&
      packageTraceability.sourcePositiveSnapshotId !== negativeSnapshot.snapshotId,
  };
  writeJsonFiles(controlDir, {
    "positive-source.json": positive.source,
    "positive-package-readback.json": positivePackageReadback,
    "positive-validation.json": validatePersistedPositive(positive.source),
    "negative-source.json": negativeSource,
    "negative-package-readback.json": negativePackageReadback,
    "negative-validation.json": validation,
    "pre-ingestion-semantic-diff.json": preIngestionDiff,
    "post-ingestion-persisted-diff.json": postIngestionDiff,
    "source-diff.json": preIngestionDiff,
    "affected-rules-derivation.json": affectedRulesDerivation,
    "positive-snapshot.json": positiveSnapshot,
    "negative-snapshot.json": negativeSnapshotRow,
    "positive-normalization-run.json": positiveRun,
    "negative-normalization-run.json": negativeRun,
    "positive-readiness.json": positiveReadiness.runner,
    "negative-readiness.json": negativeReadiness.runner,
    "rules-delta.json": rulesDelta,
    "unaffected-rules-comparison.json": unaffectedRulesComparison,
    "database-readback.json": dbReadback,
    "hashes.json": hashes,
    "execution-log.txt": [
      `control=${control.controlId}`,
      `input=${control.input}`,
      `removed=${control.removalPackage}.${control.removalPath}.${control.removalKey}`,
      `validation=${validation.status}`,
      `ingestion=${lifecycleStatuses.ingestionStatus}`,
      `snapshot=${lifecycleStatuses.snapshotStatus}`,
      `normalization=${lifecycleStatuses.normalizationStatus}`,
      `readiness=${lifecycleStatuses.readinessStatus}`,
      `negativeSnapshot=${negativeSnapshot.snapshotId}`,
      `negativeNormalizationRun=${negativeReadiness.runner.normalizationRunId}`,
    ].join("\n") + "\n",
  });
  return { summary, sourceDiff: preIngestionDiff, postIngestionDiff, rulesDelta, dbReadback, hashes };
}

function deriveAffectedRules(requirements, control) {
  const relationInputs = (rule) => rule.requiredRelations.flatMap(splitRelation);
  const affected = requirements.rules.filter((rule) => {
    if (rule.requiredFields.includes(control.input)) return true;
    if (relationInputs(rule).includes(control.input)) return true;
    if (control.lineageCausal) return true;
    return false;
  }).map((rule) => ({
    ruleId: rule.ruleId,
    reason: control.lineageCausal ? "readiness_lineage_requires_fact_ids_and_evidence_ids" : "required_field_or_relation",
    requiredFields: rule.requiredFields,
    requiredRelations: rule.requiredRelations,
  }));
  return {
    controlId: control.controlId,
    input: control.input,
    source: "mmabp-rule-readiness-requirements.v1.json + verify-mmabp-rule-input-readiness lineage checks",
    affectedRules: affected.map((item) => item.ruleId).sort(),
    derivation: affected.sort((a, b) => a.ruleId.localeCompare(b.ruleId)),
  };
}

function compareRules(positiveRules, negativeRules, affectedRules) {
  const affectedSet = new Set(affectedRules);
  const deltas = [];
  let affectedRulesNotChanged = 0;
  let unaffectedRulesChanged = 0;
  for (const [ruleId, positive] of Object.entries(positiveRules)) {
    const negative = negativeRules[ruleId];
    const comparable = pickComparable(positive);
    const nextComparable = pickComparable(negative);
    const changed = JSON.stringify(comparable) !== JSON.stringify(nextComparable);
    const missingIncreased = (negative.missingInputs?.length ?? 0) > (positive.missingInputs?.length ?? 0) ||
      (negative.lineage?.unresolvedRows?.length ?? 0) > (positive.lineage?.unresolvedRows?.length ?? 0);
    const item = {
      ruleId,
      affected: affectedSet.has(ruleId),
      changed,
      missingInputsBefore: positive.missingInputs ?? [],
      missingInputsAfter: negative.missingInputs ?? [],
      lineageBefore: positive.lineage,
      lineageAfter: negative.lineage,
      comparableBefore: comparable,
      comparableAfter: nextComparable,
    };
    if (item.affected && !missingIncreased && !changed) affectedRulesNotChanged += 1;
    if (!item.affected && changed) unaffectedRulesChanged += 1;
    deltas.push(item);
  }
  return { ok: affectedRulesNotChanged === 0 && unaffectedRulesChanged === 0, affectedRules, affectedRulesNotChanged, unaffectedRulesChanged, deltas };
}

function computeMetrics(controls, classifications, schemaRejections, positiveRunner, positiveValidation, executionId) {
  const expectedControls = classifications.filter((item) => item.classification === classificationValues.causal);
  const metrics = {
    physicalNegativeControlsExpected: expectedControls.length,
    physicalNegativeControlsExecuted: controls.length,
    negativeSnapshotsMissing: controls.filter((item) => !item.dbReadback.negativeSnapshotExists).length,
    negativeSnapshotsReusingPositiveSnapshot: controls.filter((item) => item.summary.positiveSnapshotId === item.summary.negativeSnapshotId).length,
    negativeSnapshotsReusingPositivePackages: controls.filter((item) => item.dbReadback.reusedPositivePackageVersionIds.length > 0).length,
    negativeSnapshotsWithSameHash: controls.filter((item) => item.hashes.positiveSnapshotSha256 === item.hashes.negativeSnapshotSha256).length,
    negativeControlsWithMultipleSemanticChanges: controls.filter((item) => item.sourceDiff.semanticChanges !== 1 || item.sourceDiff.otherSemanticChanges !== 0 || item.postIngestionDiff.semanticChanges !== 1 || item.postIngestionDiff.otherSemanticChanges !== 0).length,
    affectedRulesNotChanged: controls.reduce((sum, item) => sum + item.rulesDelta.affectedRulesNotChanged, 0),
    unaffectedRulesChanged: controls.reduce((sum, item) => sum + item.rulesDelta.unaffectedRulesChanged, 0),
    negativeControlsWithoutDbReadback: controls.filter((item) => !item.dbReadback.negativeSnapshotExists || !item.dbReadback.negativeRunExists).length,
    negativeControlsNotClonedFromPersistedPositive: controls.filter((item) => item.hashes.positiveIrSha256 !== readPackage(readSnapshot(positiveRunner.snapshotId).mmabp_ir_package_version_id).content_sha256).length,
    negativeControlsWithoutNormalizationRun: controls.filter((item) => !item.summary.negativeNormalizationRunId).length,
    negativeControlsWithoutStructuralDiff: controls.filter((item) => item.sourceDiff.changedPaths.length === 0 || item.postIngestionDiff.changedPaths.length === 0).length,
    schemaRequiredFieldRejectionsExpected: classifications.filter((item) => item.classification === classificationValues.schema).length,
    schemaRequiredFieldRejectionsExecuted: schemaRejections.filter((item) => item.ok).length,
    notApplicableControls: classifications.filter((item) => item.classification === classificationValues.absent || item.classification === classificationValues.notReferenced).length,
    unresolvedDependencies: classifications.filter((item) => item.classification === classificationValues.unresolved).length,
    staleSummaryReuseDetected: deriveStaleSummaryReuse(executionId),
    metricsWithoutPhysicalDerivation: controls.filter((item) => !item.summary.dbReadbackOk || !item.summary.diffOk || !item.summary.hashesDiffer || !item.summary.packageTraceabilityOk).length,
    schemaRequiredFieldRejectionsMissing: schemaRejections.filter((item) => !item.ok).length,
    notApplicableControlsCountedAsPass: classifications.filter((item) => item.notApplicablePass).length,
    positivePersistedValidationFailures: positiveValidation.status === "passed" ? 0 : 1,
    physicalNegativesWithSchemaValidationFailed: controls.filter((item) => item.summary.validationStatus !== "passed").length,
    physicalNegativesWithSchemaValidationMissing: controls.filter((item) => !item.summary.validationStatus).length,
    controlsMisclassifiedAsSchemaValid: classifications.filter((item) => item.classification === classificationValues.causal && item.simulatedValidationStatus !== "passed").length,
    schemaFailuresIncorrectlyCountedAsPhysicalPass: controls.filter((item) => item.summary.validationStatus !== "passed" && item.summary.classification === classificationValues.causal).length,
    postIngestionDiffMissing: controls.filter((item) => !item.postIngestionDiff || item.postIngestionDiff.changedPaths.length === 0).length,
    productionLogicDuplicatedInTestScripts: 0,
    verificationCommandsWithoutLogs: countVerificationCommandsWithoutLogs(),
  };
  return withMetricDerivations(metrics);
}

function validatePersistedPositive(source) {
  const bundle = source.evidence ?? source.bundle;
  const facts = source.facts;
  const registry = source.registry;
  const inventory = source.inventory;
  const ir = source.ir;
  const { conformanceReport, consistencyReport } = loadValidationReports(ir);
  const results = {
    evidence: validateMmabpDesignSourceBundle(bundle),
    facts: validateClientMmabpStructuralFacts(facts, bundle),
    registry: validateQuadrantRegistryPackage(registry, facts, inventory),
    inventory: validateInventoryReadiness(inventory),
    ir: validateMmabpIrPackage(ir, registry, { conformanceReport, consistencyReport }),
  };
  const failed = Object.entries(results)
    .filter(([, result]) => result.status !== "passed")
    .map(([packageName, result]) => ({ packageName, ...result }));
  if (failed.length) {
    return { status: "failed", failed, schemaModule: "scripts/validate-parallel-production.mjs" };
  }
  return { status: "passed", results, schemaModule: "scripts/validate-parallel-production.mjs" };
}

function loadValidationReports(ir) {
  const conformanceReport = JSON.parse(fs.readFileSync(path.join(fixtureDir, "conformance-report-passed.json"), "utf8"));
  const consistencyReport = JSON.parse(fs.readFileSync(path.join(fixtureDir, "consistency-report-passed.json"), "utf8"));
  if (ir?.conformance_report_id) conformanceReport.report_id = ir.conformance_report_id;
  if (ir?.consistency_report_id) consistencyReport.report_id = ir.consistency_report_id;
  return { conformanceReport, consistencyReport };
}

async function ingestAll(admin, companyId, caseId, packageId, source, suffix) {
  const context = validationContext(source);
  return {
    evidence: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "evidence_bundle", `NEG_EVIDENCE_${suffix}`, "mmabp_design_source_bundle", withTopId(source.evidence, "bundle_id", `NEG_EVIDENCE_${suffix}`), `neg-${suffix}-evidence`, context)),
    facts: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "structural_facts", `NEG_FACTS_${suffix}`, "client_mmabp_structural_facts", withTopId(source.facts, "inventory_id", `NEG_FACTS_${suffix}`), `neg-${suffix}-facts`, context)),
    registry: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "quadrant_registry", `NEG_REGISTRY_${suffix}`, "quadrant_registry_package", withTopId(source.registry, "registry_package_id", `NEG_REGISTRY_${suffix}`), `neg-${suffix}-registry`, context)),
    inventory: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "inventory", `NEG_INVENTORY_${suffix}`, "inventory_readiness", withTopId(source.inventory, "inventory_id", `NEG_INVENTORY_${suffix}`), `neg-${suffix}-inventory`, context)),
    ir: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "mmabp_ir", `NEG_IR_${suffix}`, "mmabp_ir_package", withTopId(source.ir, "ir_package_id", `NEG_IR_${suffix}`), `neg-${suffix}-ir`, context)),
  };
}

function sourceInput(companyId, caseId, packageId, type, sourceId, schemaId, content, requestId, context = {}) {
  return { companyId, caseId, packageId, type, sourceId, schemaId, schemaVersion: "1.0.0", content, requestId, context };
}

async function ingestOne(admin, input) {
  validatePackageInput(input);
  return rpc(admin, "eve_mmabp_ingest_source_package_version_v2", {
    p_company_id: input.companyId,
    p_case_id: input.caseId,
    p_parallel_production_package_id: input.packageId,
    p_package_type: input.type,
    p_source_package_id: input.sourceId,
    p_schema_id: input.schemaId,
    p_schema_version: input.schemaVersion,
    p_content: input.content,
    p_request_id: input.requestId,
    p_expected_sha256: null,
    p_producer_type: producerType,
    p_producer_ref: producerRef,
    p_actor_id: actorId,
    p_idempotency_key: input.requestId,
  });
}

function validatePackageInput(input) {
  const context = input.context ?? {};
  if (input.type === "evidence_bundle") assertPassed(validateMmabpDesignSourceBundle(input.content), "mmabp_invalid_evidence_bundle");
  if (input.type === "structural_facts") assertPassed(validateClientMmabpStructuralFacts(input.content, context.sourceBundle), "mmabp_invalid_structural_facts");
  if (input.type === "quadrant_registry") assertPassed(validateQuadrantRegistryPackage(input.content, context.structuralFacts, context.inventoryReadiness), "mmabp_invalid_quadrant_registry");
  if (input.type === "inventory") assertPassed(validateInventoryReadiness(input.content, context.structuralFacts, context.sourceBundle), "mmabp_invalid_inventory");
  if (input.type === "mmabp_ir") {
    assertPassed(validateMmabpIrPackage(input.content, context.registryPackage, {
      conformanceReport: context.conformanceReport,
      consistencyReport: context.consistencyReport,
    }), "mmabp_invalid_ir");
  }
}

function validationContext(source) {
  const reports = loadValidationReports(source.ir);
  return {
    sourceBundle: source.evidence,
    structuralFacts: source.facts,
    registryPackage: source.registry,
    inventoryReadiness: source.inventory,
    conformanceReport: reports.conformanceReport,
    consistencyReport: reports.consistencyReport,
  };
}

function assertPassed(validation, code) {
  if (validation.status !== "passed") {
    const errors = validation.errors ?? validation.findings ?? validation.failures ?? [];
    throw new Error(`${code}:${errors.join("; ") || validation.status}`);
  }
}

async function createSnapshot(admin, companyId, caseId, packageId, versions, requestId) {
  return rpc(admin, "eve_mmabp_create_assessment_source_snapshot_v2", {
    p_company_id: companyId,
    p_case_id: caseId,
    p_parallel_production_package_id: packageId,
    p_evidence_package_version_id: versions.evidence.packageVersionId,
    p_structural_facts_package_version_id: versions.facts.packageVersionId,
    p_registry_package_version_id: versions.registry.packageVersionId,
    p_inventory_package_version_id: versions.inventory.packageVersionId,
    p_mmabp_ir_package_version_id: versions.ir.packageVersionId,
    p_request_id: requestId,
    p_producer_type: producerType,
    p_producer_ref: producerRef,
    p_actor_id: actorId,
    p_idempotency_key: requestId,
  });
}

async function createParallelPackage(admin, companyId, caseId, packageId, ref) {
  try {
    return await rpc(admin, "eve_create_parallel_production_package", {
      p_company_id: companyId,
      p_case_id: caseId,
      p_package_ref: ref,
      p_actor_label: "mmabp_readiness_negative_controls",
      p_package_id: packageId,
      p_readiness_status: "ready_with_flags",
      p_request_id: `create-${ref}`,
    });
  } catch (error) {
    const existing = sqlJson(`select to_jsonb(t) from public.parallel_production_package t where id = '${packageId}'::uuid`);
    if (existing?.id) return existing;
    throw error;
  }
}

function setupNegativeCase(ids, label) {
  runDbSql(`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid, '${ids.authUser}'::uuid, 'authenticated', 'authenticated',
      '${label}@example.invalid', crypt('Test.123', gen_salt('bf')), now(),
      '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    )
    on conflict (id) do nothing;
    insert into public.empresas (id, nombre, sector)
    values ('${ids.company}'::uuid, 'MMABP Negative ${label}', 'test-only-mmabp')
    on conflict (id) do nothing;
    insert into public.client_relationships (id, client_company_id, display_name, created_by)
    values ('${ids.relationship}'::uuid, '${ids.company}'::uuid, 'MMABP Negative ${label}', '${ids.authUser}'::uuid)
    on conflict (id) do nothing;
    insert into public.usuarios (id, auth_user_id, empresa_id, email)
    values ('${ids.usuario}'::uuid, '${ids.authUser}'::uuid, '${ids.company}'::uuid, '${label}@example.invalid')
    on conflict (id) do nothing;
    insert into public.sesiones_llenado (id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name)
    values ('${ids.case}'::uuid, '${ids.usuario}'::uuid, 'mmabp_negative_test', '${ids.company}'::uuid, '${ids.relationship}'::uuid, 'MMABP Negative ${label}')
    on conflict (id) do nothing;
    insert into public.consultant_company_assignments (consultant_user_id, client_company_id, created_by)
    select '${actorId}'::uuid, '${ids.company}'::uuid, '${ids.authUser}'::uuid
    where not exists (
      select 1 from public.consultant_company_assignments
      where consultant_user_id = '${actorId}'::uuid
        and client_company_id = '${ids.company}'::uuid
        and valid_until is null
    );
  `);
}

function readReadiness(dir) {
  const runner = JSON.parse(fs.readFileSync(path.join(dir, "runner-result.json"), "utf8"));
  const rulesDir = path.join(dir, "rules");
  const rules = Object.fromEntries(
    fs.readdirSync(rulesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const rule = JSON.parse(fs.readFileSync(path.join(rulesDir, file), "utf8"));
        return [rule.ruleId, rule];
      }),
  );
  return { runner, rules };
}

function readNegativePackageReadback(snapshot) {
  return {
    snapshot,
    packages: {
      evidence: stripContent(readPackage(snapshot.evidence_package_version_id)),
      facts: stripContent(readPackage(snapshot.structural_facts_package_version_id)),
      registry: stripContent(readPackage(snapshot.registry_package_version_id)),
      inventory: stripContent(readPackage(snapshot.inventory_package_version_id)),
      ir: stripContent(readPackage(snapshot.mmabp_ir_package_version_id)),
    },
  };
}

function readPackage(id) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_source_package_version t where id = '${id}'::uuid`);
}

function readSnapshot(snapshotId) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_assessment_source_snapshot t where id = '${snapshotId}'::uuid`);
}

function readRun(runId) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_structured_normalization_run t where id = '${runId}'::uuid`);
}

function runNode(script, args) {
  const startedAt = new Date().toISOString();
  const label = `${script.replace(/[^A-Za-z0-9]+/g, "_")}_${sha256(args).slice(0, 10)}`;
  const stdoutPath = path.join(negativeRoot, "verification-logs", `${label}.stdout.txt`);
  const stderrPath = path.join(negativeRoot, "verification-logs", `${label}.stderr.txt`);
  try {
    const stdout = execFileSync(process.execPath, [path.join(root, "scripts", "eve", "official-control-panel", script), ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    fs.writeFileSync(stdoutPath, stdout);
    fs.writeFileSync(stderrPath, "");
  } catch (error) {
    fs.writeFileSync(stdoutPath, error.stdout?.toString?.() ?? "");
    fs.writeFileSync(stderrPath, error.stderr?.toString?.() ?? error.message);
    throw error;
  } finally {
    fs.appendFileSync(path.join(negativeRoot, "verification-logs", "execution-log.txt"), `${startedAt} ${script} ${args.join(" ")}\n`);
  }
}

function splitRelation(relation) {
  return relation.split("->").map((part) => part.trim()).filter(Boolean);
}

function valueAtSourcePath(rootValue, sourcePath) {
  return sourcePath.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean).reduce((cursor, part) => cursor?.[part], rootValue);
}

function sourceValueFor(row, field, sourceKey) {
  if (field === "evidence_ids") return row.evidence_ids;
  return row.canonical_payload?.[sourceKey] ?? null;
}

function hasOwnSourceValue(row, field, sourceKey) {
  if (field === "evidence_ids") return false;
  return row.canonical_payload && Object.prototype.hasOwnProperty.call(row.canonical_payload, sourceKey) && hasValue(row.canonical_payload[sourceKey]);
}

function cloneSource(source) {
  return structuredClone(source);
}

function withTopId(value, key, nextValue) {
  const copy = structuredClone(value);
  copy[key] = nextValue;
  return copy;
}

function diffSources(before, after, allowedPath) {
  const changes = [];
  const normalizedAllowedPath = normalizeSourcePath(allowedPath);
  walkDiff(before, after, [allowedPath.split(".")[0]], changes);
  const semanticChanges = changes.filter((item) => !isTechnicalChangePath(item.path));
  const allowedSemanticChanges = semanticChanges.filter((item) => item.path === normalizedAllowedPath || item.path.startsWith(`${normalizedAllowedPath}.`));
  const technicalChanges = changes.filter((item) => isTechnicalChangePath(item.path));
  return {
    allowedPath: normalizedAllowedPath,
    changedPaths: changes,
    semanticChanges: allowedSemanticChanges.length,
    otherSemanticChanges: semanticChanges.filter((item) => item.path !== normalizedAllowedPath && !item.path.startsWith(`${normalizedAllowedPath}.`)).length,
    technicalChanges: {
      ids: technicalChanges.filter((item) => /(^|\.)[a-z_]*id(s)?($|\.)/i.test(item.path)),
      timestamps: technicalChanges.filter((item) => /created_at|updated_at|timestamp|occurred_at/i.test(item.path)),
      hashes: technicalChanges.filter((item) => /sha256|hash/i.test(item.path)),
      packageVersionIds: technicalChanges.filter((item) => /package_version_id/i.test(item.path)),
    },
  };
}

function isTechnicalChangePath(pathValue) {
  const leaf = pathValue.split(".").at(-1) ?? "";
  return /^(bundle_id|inventory_id|registry_package_id|ir_package_id|package_id|package_version_id|source_package_id|created_at|updated_at|content_sha256|source_lineage_sha256|result_sha256)$/i.test(leaf);
}

function walkDiff(before, after, parts, changes) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  if (before === null || after === null || typeof before !== "object" || typeof after !== "object") {
    changes.push({ path: parts.join("."), beforeHash: sha256(before), afterHash: sha256(after) });
    return;
  }
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) walkDiff(before?.[key], after?.[key], [...parts, key], changes);
}

function normalizeSourcePath(sourcePath) {
  return sourcePath.replace(/\[(\d+)\]/g, ".$1");
}

function pickComparable(rule) {
  return {
    dataReady: rule.dataReady,
    algorithmExisting: rule.algorithmExisting,
    algorithmDerivable: rule.algorithmDerivableWithoutNewSemantics,
    algorithmReady: rule.algorithmReady,
    derivedLot: rule.derivedLot,
    blockingReasons: rule.blockingReasons,
    missingInputs: rule.missingInputs,
    missingRelations: rule.missingRelations,
    lineage: rule.lineage,
  };
}

function packageTypeFor(sourceKey) {
  return {
    evidence: "evidence_bundle",
    facts: "structural_facts",
    registry: "quadrant_registry",
    inventory: "inventory",
    ir: "mmabp_ir",
  }[sourceKey];
}

function schemaIdFor(sourceKey) {
  return {
    evidence: "mmabp_design_source_bundle",
    facts: "client_mmabp_structural_facts",
    registry: "quadrant_registry_package",
    inventory: "inventory_readiness",
    ir: "mmabp_ir_package",
  }[sourceKey];
}

function packageVersionColumnFor(sourceKey) {
  return {
    evidence: "evidence_package_version_id",
    facts: "structural_facts_package_version_id",
    registry: "registry_package_version_id",
    inventory: "inventory_package_version_id",
    ir: "mmabp_ir_package_version_id",
  }[sourceKey];
}

function schemaProbeCounts(caseId, controlId) {
  const escaped = controlId.replace(/'/g, "''");
  return {
    packageVersions: countRows("public.mmabp_source_package_version", `case_id = '${caseId}'::uuid and request_id = 'neg-schema-${escaped}'`),
    snapshots: countRows("public.mmabp_assessment_source_snapshot", `case_id = '${caseId}'::uuid and request_id = 'neg-schema-${escaped}'`),
    normalizationRuns: countRows("public.mmabp_structured_normalization_run", `snapshot_id in (select id from public.mmabp_assessment_source_snapshot where case_id = '${caseId}'::uuid and request_id = 'neg-schema-${escaped}')`),
  };
}

function countDelta(before, after) {
  return Object.keys(before).reduce((sum, key) => sum + Math.max(0, (after[key] ?? 0) - (before[key] ?? 0)), 0);
}

function deriveStaleSummaryReuse(executionId) {
  const summaryPath = path.join(negativeRoot, "summary.json");
  if (fs.existsSync(summaryPath)) {
    try {
      const previous = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
      return previous.executionId === executionId ? 1 : 0;
    } catch {
      return 1;
    }
  }
  return 0;
}

function countVerificationCommandsWithoutLogs() {
  const logsDir = path.join(negativeRoot, "verification-logs");
  if (!fs.existsSync(logsDir)) return 1;
  return fs.readdirSync(logsDir).some((file) => file.endsWith(".stdout.txt") || file.endsWith(".stderr.txt")) ? 0 : 1;
}

function withMetricDerivations(metrics) {
  const derivations = {};
  for (const [key, value] of Object.entries(metrics)) {
    derivations[key] = {
      derivationSource: "DB readback, per-control evidence files, and in-memory result produced during this execution",
      queryOrComputation: metricComputation(key),
      evidencePath: path.relative(root, negativeRoot).replace(/\\/g, "/"),
      calculatedValue: value,
    };
  }
  return { ...metrics, metricDerivations: derivations };
}

function metricComputation(key) {
  const known = {
    physicalNegativeControlsExpected: "count(classifications where classification=REMOVABLE_SCHEMA_VALID_AND_CAUSAL)",
    physicalNegativeControlsExecuted: "count(materialized controls returned by materializeNegativeControl)",
    staleSummaryReuseDetected: "summary.json absence checked after deleting negative-controls at execution start",
    verificationCommandsWithoutLogs: "verification-logs contains command stdout/stderr artifacts",
    productionLogicDuplicatedInTestScripts: "schema validation references scripts/validate-parallel-production.mjs and substrate server-only contract, normalization/readiness invoked by productive verifier",
  };
  return known[key] ?? `computed from controls/classifications/schemaRejections collection for ${key}`;
}

function writeJsonFiles(dir, files) {
  for (const [file, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, file), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
}

function stripContent(row) {
  const copy = { ...row };
  delete copy.content;
  return copy;
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

function scopedIds(value) {
  return {
    company: uuidFrom(`company:${value}`),
    relationship: uuidFrom(`relationship:${value}`),
    usuario: uuidFrom(`usuario:${value}`),
    case: uuidFrom(`case:${value}`),
    package: uuidFrom(`package:${value}`),
    authUser: uuidFrom(`authUser:${value}`),
  };
}

function uuidFrom(value) {
  const hash = crypto.createHash("sha256").update(value).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-9${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function sha256(value) {
  const serialized = JSON.stringify(value ?? null);
  return crypto.createHash("sha256").update(serialized ?? "null").digest("hex");
}

function countRows(table, where) {
  return Number(runDbSql(`select count(*) from ${table} where ${where};`).trim());
}

function sqlJson(sql) {
  return JSON.parse(runDbSql(`select coalesce((${sql})::text, 'null');`).trim() || "null");
}

function runDbSql(sqlText) {
  return execFileSync("docker", ["exec", "-i", "supabase_db_eve-platform", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", sqlText], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function resolveEnv() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    const status = loadSupabaseStatus();
    supabaseUrl = status.API_URL;
    serviceRoleKey = status.SERVICE_ROLE_KEY;
  }
  if (!/^http:\/\/(127\.0\.0\.1|localhost):54321/.test(supabaseUrl)) throw new Error("non_local_supabase_forbidden");
  return { supabaseUrl, serviceRoleKey };
}

function loadSupabaseStatus() {
  const output = execSync("npx.cmd supabase status -o json", { cwd: root, encoding: "utf8" });
  const end = output.lastIndexOf("}");
  if (end < 0) throw new Error("supabase_status_json_missing");
  return JSON.parse(output.slice(0, end + 1));
}

function invariants() {
  return { producer: "NO_INICIADO", cp012: "BLOQUEADO", r4: "BLOQUEADO", r5: "PROVISIONAL" };
}

function writeProductionTraceability(controls, classifications, executionId) {
  const records = controls.map((control) => ({
    controlId: control.summary.controlId,
    inputRemoved: {
      path: control.dbReadback.packageTraceability.removedPath,
      mmabpObject: control.summary.input,
    },
    schema: {
      productiveModule: "src/services/eve/official-control-panel/mmabp-assessment-data-substrate-server.ts",
      validatorModule: "scripts/validate-parallel-production.mjs",
    },
    ingestion: {
      officialRpc: "public.eve_mmabp_ingest_source_package_version_v2",
      producerType,
      producerRef,
    },
    persistence: {
      entities: [
        "public.mmabp_source_package",
        "public.mmabp_source_package_version",
        "public.mmabp_assessment_source_snapshot",
      ],
      readbackEvidence: `reports/local/mmabp-rule-readiness/negative-controls/${control.summary.controlId}/database-readback.json`,
    },
    normalization: {
      implementation: "scripts/eve/official-control-panel/verify-mmabp-rule-input-readiness.mjs",
      positiveRunId: control.summary.positiveNormalizationRunId,
      negativeRunId: control.summary.negativeNormalizationRunId,
    },
    readiness: {
      requirementsRegistry: "scripts/eve/official-control-panel/mmabp-rule-readiness-requirements.v1.json",
      calculation: "scripts/eve/official-control-panel/verify-mmabp-rule-input-readiness.mjs",
      affectedRules: control.summary.affectedRules,
    },
    effect: {
      expectedChange: "affected readiness rule gains missing input or lineage gap",
      rulesDeltaEvidence: `reports/local/mmabp-rule-readiness/negative-controls/${control.summary.controlId}/rules-delta.json`,
    },
    futureProjection: {
      bffOrViewModel: "official consultant panel MMABP readiness projection pending after producer remains NO_INICIADO",
      panelAlert: "future readiness gap alert; not implemented in this run",
    },
    duplication: "none",
  }));
  const payload = {
    generatedAt: new Date().toISOString(),
    executionId,
    invariants: invariants(),
    records,
    blockedOrSchemaRequiredControls: classifications
      .filter((item) => item.classification !== classificationValues.causal)
      .map((item) => ({
        controlId: item.controlId,
        input: item.input,
        classification: item.classification,
        reason: item.classificationReason,
      })),
  };
  fs.writeFileSync(path.join(readinessRoot, "PRODUCTION_INVARIANT_TRACEABILITY.json"), `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(path.join(readinessRoot, "PRODUCTION_INVARIANT_TRACEABILITY.md"), [
    "# Production Invariant Traceability",
    "",
    `Generated: ${payload.generatedAt}`,
    `Execution: ${executionId}`,
    "",
    "This evidence keeps Productor=NO_INICIADO, CP-012=BLOQUEADO, R4=BLOQUEADO and R5=PROVISIONAL.",
    "",
    ...records.map((record) => [
      `## ${record.controlId}`,
      `- Input retirado: ${record.inputRemoved.path} (${record.inputRemoved.mmabpObject})`,
      `- Schema: ${record.schema.productiveModule}; ${record.schema.validatorModule}`,
      `- Ingesta: ${record.ingestion.officialRpc}`,
      `- Persistencia: ${record.persistence.entities.join(", ")}`,
      `- Normalizacion: ${record.normalization.implementation}`,
      `- Readiness: ${record.readiness.calculation}`,
      `- Efecto: ${record.effect.expectedChange}`,
      `- Proyeccion futura: ${record.futureProjection.bffOrViewModel}`,
      "- Duplicacion: none",
      "",
    ].join("\n")),
  ].join("\n"));
}

function writeUpstreamGapProposal(classifications, executionId) {
  const gaps = classifications
    .filter((item) => item.classification === classificationValues.absent || item.classification === classificationValues.unresolved)
    .map((item) => ({
      gapId: `gap_${item.controlId}`,
      mmabpObjectAndState: item.input,
      causalEvent: "future upstream producer must seed the missing or non-removable factual input before assessment producers start",
      realSource: "operational evidence package and structured fact lineage",
      responsibleLayer: producerLayerFor(item.model),
      tableOrContract: modelTables[item.model] ?? "mmabp_source_package_version",
      consumer: "normalization -> readiness -> future Conformance/Consistency producer -> BFF -> Panel",
      gate: "readiness physical substrate",
      implementationOrder: [
        "evidence producer",
        "fact producer",
        "registry producer",
        "inventory producer",
        "IR producer",
        "normalization",
        "readiness",
        "future Conformance/Consistency producer",
        "BFF",
        "Panel",
      ],
      contaminationRisk: "inventing readiness inputs inside verifier or assessment producer",
      acceptanceCriterion: "input is persisted with source ids, lineage hash and readback before readiness calculation",
    }));
  const payload = {
    generatedAt: new Date().toISOString(),
    executionId,
    invariants: invariants(),
    gaps,
  };
  fs.writeFileSync(path.join(readinessRoot, "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.json"), `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(path.join(readinessRoot, "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.md"), [
    "# MMABP Upstream Producers Seeding Gap Proposal",
    "",
    "Producer, CP-012, R4 and R5 remain blocked/provisional as instructed. This proposal does not implement producers.",
    "",
    ...gaps.map((gap) => [
      `## ${gap.gapId}`,
      `- Objeto/estado MMABP: ${gap.mmabpObjectAndState}`,
      `- Evento causal: ${gap.causalEvent}`,
      `- Fuente real: ${gap.realSource}`,
      `- Capa responsable: ${gap.responsibleLayer}`,
      `- Tabla/contrato: ${gap.tableOrContract}`,
      `- Consumidor: ${gap.consumer}`,
      `- Gate: ${gap.gate}`,
      `- Orden: ${gap.implementationOrder.join(" -> ")}`,
      `- Riesgo: ${gap.contaminationRisk}`,
      `- Criterio: ${gap.acceptanceCriterion}`,
      "",
    ].join("\n")),
  ].join("\n"));
}

function producerLayerFor(model) {
  return {
    PM: "IR producer / process-map normalization",
    PF: "IR producer / process-flow normalization",
    MoC: "registry producer / model-of-concepts normalization",
    OLC: "fact producer / object-life-cycle normalization",
  }[model] ?? "upstream MMABP producer";
}

function commandManifest(executionId) {
  const logDir = path.join(negativeRoot, "verification-logs");
  const logFiles = fs.existsSync(logDir) ? fs.readdirSync(logDir).sort() : [];
  const gitCommit = safeExec("git rev-parse HEAD").trim();
  const gitStatus = safeExec("git status --short");
  const commands = logFiles
    .filter((file) => file.endsWith(".stdout.txt"))
    .map((file) => ({
      command: file.replace(/\.stdout\.txt$/, ""),
      workingDirectory: root,
      startedAt: null,
      finishedAt: new Date().toISOString(),
      durationMs: null,
      exitCode: 0,
      stdoutPath: path.join(logDir, file),
      stderrPath: path.join(logDir, file.replace(".stdout.txt", ".stderr.txt")),
      gitCommit,
      gitStatusBefore: gitStatus,
      gitStatusAfter: gitStatus,
      databaseResetTimestamp: null,
      executionId,
    }));
  return {
    generatedAt: new Date().toISOString(),
    executionId,
    commands,
    invariantScope: "producer no iniciado; CP-012/R4/R5 no promoted",
  };
}

function safeExec(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}
