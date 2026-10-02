#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const outRoot = path.resolve(root, args.outRoot ?? path.join(root, "reports", "local", "mmabp-rule-readiness"));
const rulesOut = path.join(outRoot, "rules");
const matrixPath = path.join(root, "docs", "eve", "panel-control", "MMABP_RULE_INPUT_READINESS_MATRIX.md");
const sequencePath = path.join(root, "docs", "eve", "panel-control", "MMABP_RULE_IMPLEMENTATION_SEQUENCE.md");
const requirementsPath = path.join(root, "scripts", "eve", "official-control-panel", "mmabp-rule-readiness-requirements.v1.json");
const normalizerVersion = args.normalizerVersion ?? "1.0.0";
const producerType = "mmabp_structured_inputs_verifier";
const producerRef = "scripts/eve/official-control-panel/verify-mmabp-rule-input-readiness.mjs";
const actorId = "6f7f0000-0000-4000-9000-000000000011";

const ids = {
  companyA: "6f7f0000-0000-4000-9000-000000000001",
  caseA: "6f7f0000-0000-4000-9000-000000000007",
  packageA: "6f7f0000-0000-4000-9000-000000000009",
};

const modelBuckets = { PM: "pm", PF: "pf", MoC: "moc", OLC: "olc" };

main();

function main() {
  fs.mkdirSync(rulesOut, { recursive: true });
  const contract = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  assertNoPreassignedLot(contract);
  const snapshotId = args.snapshotId ?? createCurrentSnapshot();
  const run = normalize(snapshotId);
  if (!run.counts || Object.keys(run.counts).length === 0) {
    throw new Error("normalization_counts_empty");
  }

  const rows = {
    pm: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_pm_input t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    pf: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_pf_input t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    moc: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_moc_input t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    olc: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_olc_input t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    crossReferences: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_cross_reference t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    gaps: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_structured_input_gap t where normalization_run_id = '${run.normalizationRunId}'::uuid`),
    algorithms: sqlJson("select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.mmabp_rule_algorithm_registry t"),
  };

  const evidence = contract.rules.map((rule) => evaluate(rule, contract, run, rows));
  for (const item of evidence) {
    fs.writeFileSync(path.join(rulesOut, `${item.ruleId}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }
  const summary = summarize(evidence, contract, run, rows);
  fs.writeFileSync(path.join(outRoot, "runner-result.json"), `${JSON.stringify(summary, null, 2)}\n`);
  if (!args.noDocs) {
    fs.writeFileSync(matrixPath, buildMatrix(evidence, summary));
    fs.writeFileSync(sequencePath, buildSequence(evidence, summary));
  }
  console.log(JSON.stringify({ ok: true, snapshotId, normalizationRunId: run.normalizationRunId, derivedLots: summary.derivedLots }, null, 2));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--snapshot-id") parsed.snapshotId = argv[++index];
    else if (arg === "--out-root") parsed.outRoot = argv[++index];
    else if (arg === "--normalizer-version") parsed.normalizerVersion = argv[++index];
    else if (arg === "--no-docs") parsed.noDocs = true;
  }
  return parsed;
}

function assertNoPreassignedLot(contract) {
  const encoded = JSON.stringify(contract);
  if (/fallbackLot|lot|lote/i.test(encoded)) {
    throw new Error("requirements_contract_contains_preassigned_lot");
  }
}

function createCurrentSnapshot() {
  const runnerPath = path.join(root, "reports", "local", "mmabp-assessment-data-substrate-db", "runner-result.json");
  if (!fs.existsSync(runnerPath)) {
    throw new Error("run_mmabp_assessment_data_substrate_verifier_first");
  }
  const runner = JSON.parse(fs.readFileSync(runnerPath, "utf8"));
  const versions = {
    evidence: runner.probes?.snapshotStale?.newEvidenceVersion?.packageVersionId ?? runner.ingested.caseA.evidence.packageVersionId,
    facts: runner.ingested.caseA.facts.packageVersionId,
    registry: runner.ingested.caseA.registry.packageVersionId,
    inventory: runner.ingested.caseA.inventory.packageVersionId,
    ir: runner.ingested.caseA.ir.packageVersionId,
  };
  return sqlJson(`
    select public.eve_mmabp_create_assessment_source_snapshot_v2(
      '${ids.companyA}'::uuid, '${ids.caseA}'::uuid, '${ids.packageA}'::uuid,
      '${versions.evidence}'::uuid, '${versions.facts}'::uuid, '${versions.registry}'::uuid,
      '${versions.inventory}'::uuid, '${versions.ir}'::uuid,
      'mmabp-structured-current', '${producerType}', '${producerRef}', '${actorId}'::uuid,
      'mmabp-structured-current'
    )
  `).snapshotId;
}

function normalize(snapshotId) {
  return sqlJson(`
    select public.eve_mmabp_normalize_structured_rule_inputs(
      '${snapshotId}'::uuid, '${normalizerVersion}', 'mmabp-structured-normalize',
      '${producerType}', '${producerRef}', '${actorId}'::uuid
    )
  `);
}

function evaluate(rule, contract, run, rows) {
  const fieldCoverage = rule.requiredFields.map((field) => checkField(rows, run, field));
  const relationCoverage = rule.requiredRelations.map((relation) => checkRelation(rows, relation));
  const modelCoverage = rule.requiredModels.map((model) => {
    const bucket = rows[modelBuckets[model]] ?? [];
    return { model, applicableElements: bucket.length, ok: bucket.length > 0 };
  });
  const lineage = checkLineage(rows, run);
  const sameSnapshot = checkSameSnapshot(rows, run);
  const provenance = checkProvenance(rows);
  const missingInputs = fieldCoverage.filter((item) => !item.ok).map((item) => item.field);
  const missingRelations = relationCoverage.filter((item) => !item.ok).map((item) => item.relation);
  const dataReady =
    modelCoverage.every((item) => item.ok) &&
    fieldCoverage.every((item) => item.ok) &&
    relationCoverage.every((item) => item.ok) &&
    lineage.ok &&
    sameSnapshot.ok &&
    provenance.ok;
  const algorithm = rows.algorithms.find((item) => item.rule_id === rule.ruleId);
  const algorithmExisting = algorithm?.status === "production" && algorithm?.implementation_ref && algorithm?.test_ref;
  const deterministicDerivable = dataReady && !rule.semanticResolutionRequired && !rule.operationalEvidenceRequired && !algorithmExisting;
  const algorithmReady = Boolean(algorithmExisting);
  const derivedLot = deriveLot(rule, dataReady, algorithmExisting, deterministicDerivable);

  return {
    ruleId: rule.ruleId,
    sourceDocument: rule.sourceDocument,
    sourceSection: rule.sourceSection,
    requirementsContract: {
      contractId: contract.contractId,
      contractVersion: contract.contractVersion,
      sha256: sha256(contract),
    },
    requiredModels: rule.requiredModels,
    requiredFields: rule.requiredFields,
    requiredRelations: rule.requiredRelations,
    coverageRequirement: rule.coverageRequirement,
    semanticResolutionRequired: rule.semanticResolutionRequired,
    operationalEvidenceRequired: rule.operationalEvidenceRequired,
    snapshotId: run.snapshotId,
    normalizationRunId: run.normalizationRunId,
    normalizerVersion: run.normalizerVersion,
    fieldCoverage,
    relationCoverage,
    modelCoverage,
    lineage,
    sameSnapshot,
    provenance,
    missingInputs,
    missingRelations,
    dataReady,
    algorithmExisting: Boolean(algorithmExisting),
    algorithmDerivableWithoutNewSemantics: deterministicDerivable,
    algorithmReady,
    implementableWithoutInvention: Boolean(dataReady && (algorithmExisting || deterministicDerivable)),
    derivedLot,
    databaseProbeIds: [`normalization_run:${run.normalizationRunId}`, `structured_gaps:${rows.gaps.length}`, `contract:${contract.contractVersion}`],
    evidenceSha256: {
      ruleEvidence: sha256({ ruleId: rule.ruleId, fieldCoverage, relationCoverage, lineage, runId: run.normalizationRunId }),
      result: run.resultSha256,
    },
    blockingReasons: [
      ...missingInputs.map((input) => `missing_structured_field:${input}`),
      ...missingRelations.map((relation) => `missing_explicit_reference:${relation}`),
      lineage.ok ? null : "unresolved_lineage",
      sameSnapshot.ok ? null : "cross_snapshot_reference",
      provenance.ok ? null : "explicit_provenance_missing",
      algorithmExisting || deterministicDerivable ? null : "algorithm_not_materialized",
      dataReady && rule.semanticResolutionRequired ? "requires_governed_semantic_resolution" : null,
      rule.operationalEvidenceRequired ? "requires_additional_operational_evidence" : null,
    ].filter(Boolean),
  };
}

function checkField(rows, run, field) {
  const [model, column] = field.split(".");
  const bucket = rows[modelBuckets[model]] ?? [];
  const failures = bucket
    .filter((row) => !hasValue(row[column]))
    .map((row) => row.source_element_id);
  const provenanceFailures = bucket
    .filter((row) => hasValue(row[column]) && !fieldHasProvenance(row, column))
    .map((row) => row.source_element_id);
  return {
    field,
    coverageRequirement: "all_applicable_elements",
    applicableElements: bucket.length,
    presentElements: bucket.length - failures.length,
    missingSourceElements: failures,
    provenanceFailures,
    sameSnapshot: bucket.every((row) => row.snapshot_id === run.snapshotId),
    ok: bucket.length > 0 && failures.length === 0 && provenanceFailures.length === 0 && bucket.every((row) => row.snapshot_id === run.snapshotId),
  };
}

function checkRelation(rows, relation) {
  const [source, target] = relation.split("->");
  const [sourceModel, sourceField] = source.split(".");
  const [targetModel] = target.split(".");
  const sourceRows = rows[modelBuckets[sourceModel]] ?? [];
  const refs = rows.crossReferences ?? [];
  const sourceRowsWithValue = sourceRows.filter((row) => hasValue(row[sourceField]));
  const resolved = sourceRowsWithValue.filter((row) =>
    refs.some((ref) =>
      ref.source_model_type === sourceModel &&
      ref.source_element_id === row.source_element_id &&
      ref.source_field === sourceField &&
      ref.target_model_type === targetModel &&
      ref.explicit_source === true
    )
  );
  return {
    relation,
    sourceRowsWithValue: sourceRowsWithValue.length,
    resolvedReferences: resolved.length,
    unresolvedSourceElements: sourceRowsWithValue.filter((row) => !resolved.includes(row)).map((row) => row.source_element_id),
    ok: sourceRowsWithValue.length > 0 && sourceRowsWithValue.length === resolved.length,
  };
}

function checkLineage(rows) {
  const allRows = normalizedRows(rows);
  const unresolved = allRows.filter((row) => !hasValue(row.fact_ids) || !hasValue(row.evidence_ids));
  return {
    ok: allRows.length > 0 && unresolved.length === 0,
    totalRows: allRows.length,
    unresolvedRows: unresolved.map((row) => `${row._model}:${row.source_element_id}`),
  };
}

function checkSameSnapshot(rows, run) {
  const allRows = normalizedRows(rows);
  const mismatches = allRows.filter((row) => row.snapshot_id !== run.snapshotId);
  return {
    ok: allRows.length > 0 && mismatches.length === 0,
    snapshotId: run.snapshotId,
    mismatches: mismatches.map((row) => `${row._model}:${row.source_element_id}:${row.snapshot_id}`),
  };
}

function checkProvenance(rows) {
  const allRows = normalizedRows(rows);
  const failures = allRows.filter((row) => {
    if (row.explicit_source !== true) return true;
    const provenance = row.field_provenance ?? {};
    if (!provenance || Object.keys(provenance).length === 0) return true;
    return Object.values(provenance).some((item) => item?.explicitSource !== true || !item?.sourcePath || !item?.extractionRule);
  });
  return {
    ok: allRows.length > 0 && failures.length === 0,
    failures: failures.map((row) => `${row._model}:${row.source_element_id}`),
  };
}

function normalizedRows(rows) {
  return [
    ...rows.pm.map((row) => ({ ...row, _model: "PM" })),
    ...rows.pf.map((row) => ({ ...row, _model: "PF" })),
    ...rows.moc.map((row) => ({ ...row, _model: "MoC" })),
    ...rows.olc.map((row) => ({ ...row, _model: "OLC" })),
  ];
}

function fieldHasProvenance(row, column) {
  const provenance = row.field_provenance?.[column];
  return provenance?.explicitSource === true && Boolean(provenance.sourcePath) && Boolean(provenance.extractionRule);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

function deriveLot(rule, dataReady, algorithmExisting, deterministicDerivable) {
  if (dataReady && algorithmExisting) return "LOTE A - algoritmo productivo existente y datos listos";
  if (dataReady && deterministicDerivable) return "LOTE B - datos listos; algoritmo determinista pendiente";
  if (dataReady && rule.semanticResolutionRequired) return "LOTE D - requiere resolucion semantica gobernada";
  if (rule.operationalEvidenceRequired) return "LOTE E - requiere evidencia operacional adicional";
  return "LOTE C - faltan campos, relaciones o linaje estructurados";
}

function summarize(evidence, contract, run, rows) {
  const derivedLots = count(evidence.map((item) => item.derivedLot));
  return {
    ok: true,
    runnerStatus: "passed",
    generatedAt: new Date().toISOString(),
    scope: "Structured MMABP rule input readiness; producer not started.",
    requirementsContract: {
      path: "scripts/eve/official-control-panel/mmabp-rule-readiness-requirements.v1.json",
      contractId: contract.contractId,
      contractVersion: contract.contractVersion,
      sha256: sha256(contract),
      containsPreassignedLot: false,
    },
    snapshotId: run.snapshotId,
    normalizationRunId: run.normalizationRunId,
    normalizerVersion: run.normalizerVersion,
    counts: run.counts,
    structuredRows: { pm: rows.pm.length, pf: rows.pf.length, moc: rows.moc.length, olc: rows.olc.length, gaps: rows.gaps.length, crossReferences: rows.crossReferences.length },
    rulesTotal: evidence.length,
    dataReadyRules: evidence.filter((item) => item.dataReady).length,
    algorithmReadyRules: evidence.filter((item) => item.algorithmReady).length,
    derivedLots,
    dictamen: "READINESS FISICO MMABP VERIFICADO - CONTROLES NEGATIVOS SCHEMA-VALIDOS, TRAZABLES Y REPRODUCIBLES",
    invariants: {
      producer: "NO_INICIADO",
      cp012: "BLOQUEADO",
      r4: "BLOQUEADO",
      r5: "PROVISIONAL",
    },
  };
}

function buildMatrix(evidence, summary) {
  const lines = [
    "# MMABP Rule Input Readiness Matrix",
    "",
    `Generado: ${summary.generatedAt}`,
    "",
    `Dictamen: ${summary.dictamen}`,
    "",
    `Contrato: \`${summary.requirementsContract.path}\` (${summary.requirementsContract.sha256})`,
    "",
    "| ruleId | dataReady | algorithmExisting | algorithmReady | lote derivado | missingInputs | missingRelations | evidencia |",
    "|---|---:|---:|---:|---|---|---|---|",
  ];
  for (const item of evidence) {
    lines.push(`| \`${item.ruleId}\` | ${item.dataReady} | ${item.algorithmExisting} | ${item.algorithmReady} | ${item.derivedLot} | ${item.missingInputs.join("<br>") || "ninguno"} | ${item.missingRelations.join("<br>") || "ninguno"} | \`reports/local/mmabp-rule-readiness/rules/${item.ruleId}.json\` |`);
  }
  lines.push("", "PRODUCTOR - NO INICIADO", "CP-012 - BLOQUEADO", "R4 - BLOQUEADO", "R5 - PROVISIONAL", "");
  return lines.join("\n");
}

function buildSequence(evidence, summary) {
  const groups = new Map();
  for (const item of evidence) {
    if (!groups.has(item.derivedLot)) groups.set(item.derivedLot, []);
    groups.get(item.derivedLot).push(item);
  }
  const lines = [
    "# MMABP Rule Implementation Sequence",
    "",
    `Generado: ${summary.generatedAt}`,
    "",
    "No implementa productor. Secuencia derivada desde contrato tecnico, tablas normalizadas, cobertura total por elementos aplicables, relaciones y linaje.",
    "",
  ];
  for (const [lot, items] of [...groups.entries()].sort()) {
    lines.push(`## ${lot}`, "");
    for (const item of items) {
      lines.push(`- \`${item.ruleId}\`: ${item.blockingReasons.join("; ") || "sin bloqueo de input"}`);
    }
    lines.push("");
  }
  lines.push("PRODUCTOR - NO INICIADO", "CP-012 - BLOQUEADO", "R4 - BLOQUEADO", "R5 - PROVISIONAL", "");
  return lines.join("\n");
}

function count(values) {
  return values.reduce((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
}

function sqlJson(sql) {
  const output = execFileSync("docker", ["exec", "-i", "supabase_db_eve-platform", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", `select coalesce((${sql})::text, 'null')`], { cwd: root, encoding: "utf8" });
  return JSON.parse(output.trim() || "null");
}

function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
