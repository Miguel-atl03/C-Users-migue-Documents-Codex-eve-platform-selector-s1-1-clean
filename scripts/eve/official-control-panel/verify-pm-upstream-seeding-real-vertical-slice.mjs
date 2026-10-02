#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  PM_UPSTREAM_RUNTIME_PRODUCER_REF,
  buildPmRuntimeSourceMatrix,
  evaluatePmRuntimeAcceptance,
} from "../../../src/services/eve/mmabp-upstream-seeding/pm-upstream-runtime-source-producer.mjs";

const root = process.cwd();
const outRoot = path.join(root, "reports", "local", "mmabp-upstream-seeding", "pm-vertical-slice-real");
const negativeRoot = path.join(outRoot, "negative-controls");
const logsRoot = path.join(outRoot, "execution-logs");

Promise.resolve().then(main).catch((error) => {
  fs.mkdirSync(outRoot, { recursive: true });
  const failure = {
    ok: false,
    runnerStatus: "failed",
    generatedAt: new Date().toISOString(),
    error: { message: error.message, stack: error.stack },
    dictamen: "PM UPSTREAM SEEDING PARCIAL - FUENTES RUNTIME NO MATERIALIZADAS: verifier_failed",
    invariants: invariants(),
  };
  writeJson(path.join(outRoot, "runner-result.json"), failure);
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
});

function main() {
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(negativeRoot, { recursive: true });
  fs.mkdirSync(logsRoot, { recursive: true });

  const commandManifest = {
    generatedAt: new Date().toISOString(),
    scope: "U0-R read-only productive source verification",
    productDmlFromVerifier: false,
    businessDmlFromVerifier: false,
    producerRef: PM_UPSTREAM_RUNTIME_PRODUCER_REF,
    commands: [
      "physical DB readback from Runtime, evidence, semantic, candidate, substrate tables",
      "source matrix evaluation by productive read-only PM upstream source producer",
      "negative control DB readback for zero-promotion assertions",
    ],
  };

  const readback = readDatabase();
  const sourceMatrix = buildPmRuntimeSourceMatrix(readback);
  const acceptance = evaluatePmRuntimeAcceptance(readback, sourceMatrix);
  const missingSources = sourceMatrix
    .filter((item) => item.sourceStatus !== "MATERIALIZED")
    .map((item) => item.input);
  const negativeControls = buildNegativeControls(readback);
  const ok = missingSources.length === 0 &&
    Object.values(acceptance).every((value) => value === 0) &&
    negativeControls.every((control) => control.dbExecuted && control.zeroPromotion);
  const dictamen = ok
    ? "PM UPSTREAM SEEDING PRODUCTIVO VERIFICADO - FUENTES RUNTIME REALES, RESOLUCION SEMANTICA Y CADENA EVIDENCE->IR MATERIALIZADAS"
    : `PM UPSTREAM SEEDING PARCIAL - FUENTES RUNTIME NO MATERIALIZADAS: ${missingSources.join(", ")}`;

  const result = {
    ok,
    runnerStatus: ok ? "passed" : "partial",
    generatedAt: new Date().toISOString(),
    dictamen,
    missingSources,
    acceptance,
    sourceMatrix,
    negativeControls: negativeControls.map(({ id, dbExecuted, zeroPromotion, finding }) => ({
      id,
      dbExecuted,
      zeroPromotion,
      finding,
    })),
    invariants: invariants(),
  };

  writeJson(path.join(outRoot, "runtime-source-readback.json"), readback.runtimeSource);
  writeJson(path.join(outRoot, "source-mapping-readback.json"), readback.sourceMapping);
  writeJson(path.join(outRoot, "evidence-readback.json"), readback.evidence_item);
  writeJson(path.join(outRoot, "semantic-resolution-readback.json"), readback.semantic_resolution_event);
  writeJson(path.join(outRoot, "facts-readback.json"), {
    status: readback.structural_candidate_record.length > 0 ? "CANDIDATES_AVAILABLE" : "SOURCE_NOT_MATERIALIZED",
    structural_candidate_record: readback.structural_candidate_record,
    accepted_pm_facts: [],
  });
  writeJson(path.join(outRoot, "registry-readback.json"), {
    status: "SOURCE_NOT_MATERIALIZED",
    reason: "No productive PM registry materializer was found from Runtime evidence.",
    packageVersions: readback.registryPackages,
  });
  writeJson(path.join(outRoot, "inventory-readback.json"), {
    status: "SOURCE_NOT_MATERIALIZED",
    reason: "No productive PM inventory materializer was found from PM registry.",
    packageVersions: readback.inventoryPackages,
  });
  writeJson(path.join(outRoot, "ir-readback.json"), {
    status: "SOURCE_NOT_MATERIALIZED",
    reason: "No productive MMABP-IR projection from PM registry/inventory was found.",
    packageVersions: readback.irPackages,
  });
  writeJson(path.join(outRoot, "lineage-chain.json"), buildLineage(readback));
  writeJson(path.join(outRoot, "normalization-run.json"), readback.normalizationRuns);
  writeJson(path.join(outRoot, "readiness-before.json"), { status: "NOT_EXECUTED", reason: "No real PM snapshot source materialized." });
  writeJson(path.join(outRoot, "readiness-after.json"), { status: "NOT_EXECUTED", reason: "No real PM snapshot source materialized." });
  writeJson(path.join(outRoot, "database-readback.json"), readback);
  writeJson(path.join(outRoot, "command-manifest.json"), commandManifest);
  writeJson(path.join(outRoot, "source-matrix.json"), sourceMatrix);
  writeJson(path.join(outRoot, "acceptance-metrics.json"), acceptance);
  writeJson(path.join(outRoot, "runner-result.json"), result);
  writeExecutionLog(result, readback);
  writeNegativeControls(negativeControls);
  writeDocs(result, sourceMatrix);

  console.log(JSON.stringify(result, null, 2));
  if (!ok) process.exitCode = 2;
}

function readDatabase() {
  const runtimeSource = {
    runtime_catalog_version: selectJson("public.runtime_catalog_version", "created_at desc", 50),
    runtime_interaction_mapping: selectJson("public.runtime_interaction_mapping", "created_at desc", 200),
    runtime_subfield_response: selectJson("public.runtime_subfield_response", "created_at desc", 200),
    runtime_interaction_instance: selectJson("public.runtime_interaction_instance", "created_at desc", 200),
    activity_runtime_run: selectJson("public.activity_runtime_run", "created_at desc", 100),
    role_runtime_session: selectJson("public.role_runtime_session", "created_at desc", 100),
  };

  const sourceMapping = {
    source_node_ref: selectJson("public.source_node_ref", "created_at desc", 200),
    runtime_interaction_mapping: runtimeSource.runtime_interaction_mapping,
    workmapPolicyReferences: scanRepoPolicyReferences(),
  };

  const evidence = selectJson("public.evidence_item", "created_at desc", 200);
  const canonicalVariables = selectJson("public.canonical_variable_record", "created_at desc", 200);
  const semantic = selectJson("public.semantic_resolution_event", "created_at desc", 200);
  const candidates = selectJson("public.structural_candidate_record", "created_at desc", 200);
  const timerEvents = selectJson("public.process_state_timer_event", "created_at desc", 200);
  const normalizationRuns = selectJson("public.mmabp_structured_normalization_run", "created_at desc", 50);
  const packageVersions = selectJson("public.mmabp_source_package_version", "created_at desc", 200);

  return {
    runtimeSource,
    sourceMapping,
    evidence_item: evidence,
    canonical_variable_record: canonicalVariables,
    semantic_resolution_event: semantic,
    structural_candidate_record: candidates,
    process_state_timer_event: timerEvents,
    facts: [],
    registryPackages: packageVersions.filter((row) => row.package_type === "quadrant_registry"),
    inventoryPackages: packageVersions.filter((row) => row.package_type === "inventory"),
    irPackages: packageVersions.filter((row) => row.package_type === "mmabp_ir"),
    normalizationRuns,
  };
}

function buildNegativeControls(readback) {
  const controls = [
    ["need_without_confirmation", "PM.customer_need_id"],
    ["trigger_without_evidence", "PM.trigger_event_id"],
    ["dependency_invalid_endpoint", "PM.dependency_id"],
    ["support_without_supported_process_id", "PM.supported_process_id"],
    ["synchronization_without_event", "PM.synchronization_id"],
    ["process_kind_unresolved", "PM.process_kind"],
    ["b7_producing_pm", "PM.process_id"],
  ];
  return controls.map(([id, input]) => {
    const acceptedFacts = readback.facts.length;
    const registryPromoted = readback.registryPackages.length;
    const inventoryPromoted = readback.inventoryPackages.length;
    const irPromoted = readback.irPackages.length;
    return {
      id,
      input,
      dbExecuted: true,
      finding: "SOURCE_NOT_MATERIALIZED",
      inputReceived: false,
      gateExecuted: false,
      persistedFindingOrGap: false,
      acceptedFacts,
      registryPromoted,
      inventoryPromoted,
      irPromoted,
      zeroPromotion: acceptedFacts === 0 && registryPromoted === 0 && inventoryPromoted === 0 && irPromoted === 0,
    };
  });
}

function buildLineage(readback) {
  return {
    status: "SOURCE_NOT_MATERIALIZED",
    lineageBreaks: [
      "runtime_subfield_response -> evidence_item is not consistently materialized by the BFF answer route",
      "evidence_item -> structural_candidate_record PM fact is not productively materialized",
      "structural_candidate_record -> PM registry relation is not productively materialized",
      "PM registry -> inventory -> MMABP-IR is not productively materialized from Runtime",
    ],
    runtimeSubfieldResponses: readback.runtimeSource.runtime_subfield_response.length,
    evidenceItems: readback.evidence_item.length,
    semanticResolutions: readback.semantic_resolution_event.length,
    structuralCandidates: readback.structural_candidate_record.length,
  };
}

function writeNegativeControls(controls) {
  for (const control of controls) {
    writeJson(path.join(negativeRoot, `${control.id}.json`), control);
  }
}

function writeExecutionLog(result, readback) {
  const lines = [
    `generatedAt=${result.generatedAt}`,
    `dictamen=${result.dictamen}`,
    `runtime_subfield_response=${readback.runtimeSource.runtime_subfield_response.length}`,
    `evidence_item=${readback.evidence_item.length}`,
    `canonical_variable_record=${readback.canonical_variable_record.length}`,
    `semantic_resolution_event=${readback.semantic_resolution_event.length}`,
    `structural_candidate_record=${readback.structural_candidate_record.length}`,
    `registryPackages=${readback.registryPackages.length}`,
    `inventoryPackages=${readback.inventoryPackages.length}`,
    `irPackages=${readback.irPackages.length}`,
  ];
  fs.writeFileSync(path.join(logsRoot, "u0-r-execution-log.txt"), `${lines.join("\n")}\n`);
}

function writeDocs(result, sourceMatrix) {
  const docsDir = path.join(root, "docs", "eve", "panel-control");
  fs.mkdirSync(docsDir, { recursive: true });
  writeJson(path.join(docsDir, "PM_UPSTREAM_SEEDING_SOURCE_MATRIX.json"), sourceMatrix);
  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_SOURCE_MATRIX.md"), [
    "# PM Upstream Seeding Source Matrix",
    "",
    "U0-R reemplaza el harness sintetico por una lectura productiva de fuentes Runtime reales.",
    "",
    "| Input | Estado | Fuente requerida | Bloqueo |",
    "| --- | --- | --- | --- |",
    ...sourceMatrix.map((item) =>
      `| ${item.input} | ${item.sourceStatus} | ${item.requiredSource} | ${item.blockingReasons.join(", ")} |`,
    ),
    "",
  ].join("\n"));

  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_IMPLEMENTATION.md"), [
    "# PM Upstream Seeding Implementation",
    "",
    `Dictamen: ${result.dictamen}`,
    "",
    "El archivo sintetico anterior fue aislado bajo `scripts/eve/official-control-panel/test-only/`.",
    "El productor U0-R productivo no fabrica evidencia, facts, registry, inventory ni IR; consulta Runtime persistido y bloquea cuando no hay fuentes causales.",
    "",
    "Estados preservados: PRODUCTOR CONFORMANCE/CONSISTENCY=NO_INICIADO, CP-012=BLOQUEADO, R4=BLOQUEADO, R5=PROVISIONAL.",
    "",
  ].join("\n"));

  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_DICTAMEN.md"), [
    "# PM Upstream Seeding Dictamen",
    "",
    result.dictamen,
    "",
    "No se inicio U1, ACA, diagramacion, exportacion ni cambios del Panel.",
    "",
  ].join("\n"));

  const proposalDir = path.join(root, "reports", "local", "mmabp-rule-readiness");
  fs.mkdirSync(proposalDir, { recursive: true });
  writeJson(path.join(proposalDir, "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.json"), {
    status: "U0-R_PARTIAL",
    dictamen: result.dictamen,
    pm: sourceMatrix,
    preservedStates: invariants(),
  });
  fs.writeFileSync(path.join(proposalDir, "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.md"), [
    "# MMABP Upstream Producers Seeding Gap Proposal",
    "",
    `Dictamen: ${result.dictamen}`,
    "",
    ...sourceMatrix.map((item) => `- ${item.input}: ${item.sourceStatus} (${item.blockingReasons.join(", ")})`),
    "",
    "MoC, PF and OLC remain outside U0-R.",
    "",
  ].join("\n"));
}

function scanRepoPolicyReferences() {
  return {
    workMapFilesPresent: [
      fs.existsSync(path.join(root, "src", "domain", "local-work-map.ts")),
      fs.existsSync(path.join(root, "src", "services", "primary-activity-selector.ts")),
      fs.existsSync(path.join(root, "src", "rules", "primary-activity-selection-policy.v1.3.json")),
    ],
  };
}

function selectJson(tableName, orderBy, limit) {
  const sql = `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (select * from ${tableName} order by ${orderBy} limit ${limit}) t`;
  return sqlJson(sql);
}

function sqlJson(sql) {
  const text = runDbSql(`select coalesce((${sql})::text, '[]');`).trim();
  return JSON.parse(text || "[]");
}

function runDbSql(sqlText) {
  return execFileSync("docker", [
    "exec",
    "-i",
    "supabase_db_eve-platform",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-At",
    "-c",
    sqlText,
  ], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function invariants() {
  return {
    producerConformanceConsistency: "NO_INICIADO",
    cp012: "BLOQUEADO",
    r4: "BLOQUEADO",
    r5: "PROVISIONAL",
  };
}
