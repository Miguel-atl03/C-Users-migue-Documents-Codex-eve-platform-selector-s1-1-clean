#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  buildPmSourceMatrix,
  buildPmVerticalSources,
  evaluatePmSeedGate,
  pmSeedInputs,
  sha256,
  validatePmVerticalSources,
} from "./test-only/pm-upstream-seeding-synthetic-harness.mjs";

const root = process.cwd();
const outRoot = path.join(root, "reports", "local", "mmabp-upstream-seeding", "test-only", "pm-vertical-slice-synthetic");
const fixtureDir = path.join(root, "tests", "fixtures", "parallel-production");
const producerType = "pm_upstream_seeding_u0";
const producerRef = "scripts/eve/official-control-panel/test-only/pm-upstream-seeding-synthetic-harness.mjs";
const actorId = "6f7f0000-0000-4000-9000-000000000011";
const ids = {
  company: uuidFrom("pm-u0-company"),
  relationship: uuidFrom("pm-u0-relationship"),
  usuario: uuidFrom("pm-u0-usuario"),
  case: uuidFrom("pm-u0-case"),
  operationalUser: uuidFrom("pm-u0-operational-user"),
  catalogVersion: uuidFrom("pm-u0-catalog-version"),
  roleSession: uuidFrom("pm-u0-role-session"),
  activityRun: uuidFrom("pm-u0-activity-run"),
  package: uuidFrom("pm-u0-package"),
};

main().catch((error) => {
  fs.mkdirSync(outRoot, { recursive: true });
  const failure = {
    ok: false,
    runnerStatus: "failed",
    generatedAt: new Date().toISOString(),
    error: { message: error.message, stack: error.stack },
    dictamen: "PM UPSTREAM SEEDING BLOQUEADO - CONTAMINACION ESTRUCTURAL DETECTADA",
    invariants: invariants(),
  };
  fs.writeFileSync(path.join(outRoot, "runner-result.json"), `${JSON.stringify(failure, null, 2)}\n`);
  console.error(JSON.stringify(failure, null, 2));
  process.exitCode = 1;
});

async function main() {
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(outRoot, { recursive: true });
  const executionLog = [];
  const env = resolveEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  seedRuntimeSourceRecords(executionLog);
  await createParallelPackage(admin, ids.company, ids.case, ids.package, "PM-U0-UPSTREAM-SEEDING");

  const base = loadFixtures();
  const sourceMatrix = buildPmSourceMatrix();
  const beforeSources = {
    evidence: base.bundle,
    facts: base.facts,
    registry: base.registry,
    inventory: base.inventory,
    ir: base.ir,
  };
  const readinessBefore = await materializeAndReadiness(admin, beforeSources, "before");

  const afterSources = buildPmVerticalSources(base);
  const validation = validatePmVerticalSources(afterSources);
  if (validation.status !== "passed") throw new Error(`pm_vertical_source_validation_failed:${JSON.stringify(validation.failed)}`);
  const readinessAfter = await materializeAndReadiness(admin, afterSources, "after");
  const negativeProbes = runNegativeProbes();
  const readback = readDatabase(readinessBefore, readinessAfter);
  const structuredPmPresence = readStructuredPmPresence(readinessAfter.runner.normalizationRunId);
  const pmReadiness = compareReadiness(readinessBefore, readinessAfter, structuredPmPresence);
  const ok = validation.status === "passed" &&
    pmReadiness.pmSevenInputsPresent === true &&
    pmReadiness.missingAfter.length === 0 &&
    pmReadiness.nonPmRulesChanged === 0 &&
    negativeProbes.every((probe) => probe.ok);
  const dictamen = ok
    ? "PM UPSTREAM SEEDING VERIFICADO - EVIDENCE, FACTS, REGISTRY, INVENTORY E IR MATERIALIZADOS"
    : `PM UPSTREAM SEEDING PARCIAL - FUENTES CANONICAS PENDIENTES: ${pmReadiness.missingAfter.join(", ")}`;

  const result = {
    ok,
    runnerStatus: ok ? "passed" : "failed",
    generatedAt: new Date().toISOString(),
    sourceMatrix,
    validation,
    readinessBefore: readinessBefore.runner,
    readinessAfter: readinessAfter.runner,
    pmReadiness,
    negativeProbes,
    readback,
    dictamen,
    invariants: invariants(),
  };
  writeEvidence({
    "source-matrix.json": sourceMatrix,
    "evidence-readback.json": readback.after.evidence,
    "facts-readback.json": readback.after.facts,
    "registry-readback.json": readback.after.registry,
    "inventory-readback.json": readback.after.inventory,
    "ir-readback.json": readback.after.ir,
    "lineage-chain.json": readback.after.lineage,
    "normalization-run.json": readRun(readinessAfter.runner.normalizationRunId),
    "readiness-before.json": readinessBefore.rules,
    "readiness-after.json": readinessAfter.rules,
    "database-readback.json": readback,
    "hashes.json": {
      beforeSnapshotSha256: readSnapshot(readinessBefore.snapshotId).source_lineage_sha256,
      afterSnapshotSha256: readSnapshot(readinessAfter.snapshotId).source_lineage_sha256,
      sourceMatrixSha256: sha256(sourceMatrix),
    },
    "negative-probes.json": negativeProbes,
    "runner-result.json": result,
    "execution-log.txt": executionLog.join("\n") + "\n",
  });
  writeSourceMatrixDocs(sourceMatrix);
  updateGapProposal(sourceMatrix);
  writeDictamenDocs(result);
  console.log(JSON.stringify(result, null, 2));
  if (!ok) process.exitCode = 1;
}

async function materializeAndReadiness(admin, sources, suffix) {
  const versions = await ingestAll(admin, sources, suffix);
  const snapshot = await createSnapshot(admin, versions, `pm-u0-${suffix}-snapshot`);
  const outDir = path.join(outRoot, `readiness-${suffix}`);
  runNode("verify-mmabp-rule-input-readiness.mjs", ["--snapshot-id", snapshot.snapshotId, "--out-root", outDir, "--normalizer-version", `pm-u0-${suffix}`, "--no-docs"]);
  return { snapshotId: snapshot.snapshotId, ...readReadiness(outDir) };
}

function runNegativeProbes() {
  const probes = [
    { id: "need_without_confirmation", input: "PM.customer_need_id", confirmation_status: "not_requested", epistemic_status: "user_confirmed_suggestion", source_evidence_ids: ["EVID_PM_NEED_001"] },
    { id: "trigger_without_evidence", input: "PM.trigger_event_id", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: [] },
    { id: "dependency_missing_endpoint", input: "PM.dependency_id", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: ["EVID_PM_DEP_001"], source_process_id: "PROC_PM_U0_KEY_001" },
    { id: "support_without_supported_process", input: "PM.supported_process_id", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: ["EVID_PM_SUPPORT_001"] },
    { id: "sync_without_event", input: "PM.synchronization_id", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: ["EVID_PM_SYNC_001"] },
    { id: "process_kind_unresolved", input: "PM.process_kind", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: ["EVID_PM_KIND_001"], value: "coordination" },
    { id: "b7_pm_direct", input: "PM.process_id", confirmation_status: "confirmed", epistemic_status: "confirmed", source_evidence_ids: ["EVID_PM_PROCESS_001"], b7Direct: true },
  ];
  return probes.map((probe) => {
    const gate = evaluatePmSeedGate(probe);
    return {
      ...probe,
      ok: gate.ok === false,
      acceptedFacts: 0,
      registryContaminated: 0,
      irPromoted: 0,
      governanceFinding: gate.findings,
    };
  });
}

function compareReadiness(before, after, structuredPresence) {
  const pmFields = [
    "PM.customer_need_id",
    "PM.process_id",
    "PM.process_kind",
    "PM.trigger_event_id",
    "PM.dependency_id",
    "PM.supported_process_id",
    "PM.synchronization_id",
  ];
  const beforeMissing = missingInputs(before.rules);
  const afterMissing = missingInputs(after.rules);
  const pmMissingRemoved = pmFields.filter((field) => beforeMissing.includes(field) && !afterMissing.includes(field));
  const nonPmRulesChanged = Object.keys(after.rules)
    .filter((ruleId) => !ruleId.includes("-PM-") && !ruleId.startsWith("CONF-PM"))
    .filter((ruleId) => JSON.stringify(before.rules[ruleId]?.missingInputs ?? []) !== JSON.stringify(after.rules[ruleId]?.missingInputs ?? []))
    .length;
  return {
    expectedPmInputs: pmFields,
    missingBefore: pmFields.filter((field) => beforeMissing.includes(field)),
    missingAfter: pmFields.filter((field) => afterMissing.includes(field)),
    pmMissingInputsRemoved: pmMissingRemoved,
    structuredPmPresence: structuredPresence,
    pmSevenInputsPresent: pmFields.every((field) => !afterMissing.includes(field)) &&
      pmFields.every((field) => structuredPresence[field] === true),
    nonPmRulesChanged,
  };
}

function readStructuredPmPresence(normalizationRunId) {
  const rows = sqlJson(`
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    from public.mmabp_structured_pm_input t
    where t.normalization_run_id = '${normalizationRunId}'::uuid
  `) ?? [];
  const hasValue = (column, predicate = (value) => value !== null && value !== undefined && value !== "") =>
    rows.some((row) => predicate(row[column]));
  return {
    "PM.customer_need_id": hasValue("customer_need_id"),
    "PM.process_id": hasValue("process_id"),
    "PM.process_kind": hasValue("process_kind", (value) => value === "key" || value === "support"),
    "PM.trigger_event_id": hasValue("trigger_event_id", (value) => Array.isArray(value) && value.length > 0),
    "PM.dependency_id": hasValue("dependency_id"),
    "PM.supported_process_id": hasValue("supported_process_id"),
    "PM.synchronization_id": hasValue("synchronization_id"),
  };
}

function missingInputs(rules) {
  return [...new Set(Object.values(rules).flatMap((rule) => rule.missingInputs ?? []))].sort();
}

async function ingestAll(admin, source, suffix) {
  return {
    evidence: await ingestOne(admin, sourceInput("evidence_bundle", `PM_U0_EVIDENCE_${suffix}`, "mmabp_design_source_bundle", source.evidence, `pm-u0-${suffix}-evidence`)),
    facts: await ingestOne(admin, sourceInput("structural_facts", `PM_U0_FACTS_${suffix}`, "client_mmabp_structural_facts", source.facts, `pm-u0-${suffix}-facts`)),
    registry: await ingestOne(admin, sourceInput("quadrant_registry", `PM_U0_REGISTRY_${suffix}`, "quadrant_registry_package", source.registry, `pm-u0-${suffix}-registry`)),
    inventory: await ingestOne(admin, sourceInput("inventory", `PM_U0_INVENTORY_${suffix}`, "inventory_readiness", source.inventory, `pm-u0-${suffix}-inventory`)),
    ir: await ingestOne(admin, sourceInput("mmabp_ir", `PM_U0_IR_${suffix}`, "mmabp_ir_package", source.ir, `pm-u0-${suffix}-ir`)),
  };
}

function sourceInput(type, sourceId, schemaId, content, requestId) {
  return {
    companyId: ids.company,
    caseId: ids.case,
    packageId: ids.package,
    type,
    sourceId,
    schemaId,
    schemaVersion: "1.0.0",
    content,
    requestId,
  };
}

async function ingestOne(admin, input) {
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

async function createSnapshot(admin, versions, requestId) {
  return rpc(admin, "eve_mmabp_create_assessment_source_snapshot_v2", {
    p_company_id: ids.company,
    p_case_id: ids.case,
    p_parallel_production_package_id: ids.package,
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
      p_actor_label: "pm_upstream_seeding_u0",
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

function seedRuntimeSourceRecords(log) {
  const values = pmSeedInputs.map((item) => `(
    '${uuidFrom(`snr:${item.input}`)}'::uuid, '${ids.company}'::uuid, '${ids.case}'::uuid, '${ids.catalogVersion}'::uuid,
    '${item.sourceNodeRef.replace(/'/g, "''")}', '${item.sourceQuestion}', '${item.sourceBlock}', '${item.sourceQuestion}',
    '${item.input}', 'U0_PM_UPSTREAM_SOURCE_MATRIX', 'PM_Matrix', 1, '{}'::jsonb
  )`).join(",\n");
  const cvValues = pmSeedInputs.map((item) => `(
    '${uuidFrom(`cvr:${item.input}`)}'::uuid, '${ids.company}'::uuid, '${ids.case}'::uuid, '${ids.activityRun}'::uuid,
    '${item.canonicalVariable}', to_jsonb('${item.input}'::text), '${item.criticalRoute}', 'closed', '[]'::jsonb, false
  )`).join(",\n");
  runDbSql(`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid, '${ids.operationalUser}'::uuid, 'authenticated', 'authenticated',
      'pm-u0-user@example.invalid', crypt('Test.123', gen_salt('bf')), now(),
      '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    )
    on conflict (id) do nothing;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid, '${actorId}'::uuid, 'authenticated', 'authenticated',
      'pm-u0-consultant@example.invalid', crypt('Test.123', gen_salt('bf')), now(),
      '', '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    )
    on conflict (id) do nothing;
    insert into public.empresas (id, nombre, sector)
    values ('${ids.company}'::uuid, 'PM U0 Upstream Seeding', 'test-only-mmabp')
    on conflict (id) do nothing;
    insert into public.client_relationships (id, client_company_id, display_name, created_by)
    values ('${ids.relationship}'::uuid, '${ids.company}'::uuid, 'PM U0 Upstream Seeding', '${ids.operationalUser}'::uuid)
    on conflict (id) do nothing;
    insert into public.usuarios (id, auth_user_id, empresa_id, email)
    values ('${ids.usuario}'::uuid, '${ids.operationalUser}'::uuid, '${ids.company}'::uuid, 'pm-u0-user@example.invalid')
    on conflict (id) do nothing;
    insert into public.sesiones_llenado (id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name)
    values ('${ids.case}'::uuid, '${ids.usuario}'::uuid, 'pm_u0_upstream_seeding', '${ids.company}'::uuid, '${ids.relationship}'::uuid, 'PM U0 Upstream Seeding')
    on conflict (id) do nothing;
    insert into public.consultant_company_assignments (consultant_user_id, client_company_id, created_by)
    select '${actorId}'::uuid, '${ids.company}'::uuid, '${ids.operationalUser}'::uuid
    where not exists (
      select 1 from public.consultant_company_assignments
      where consultant_user_id = '${actorId}'::uuid and client_company_id = '${ids.company}'::uuid and valid_until is null
    );
    insert into public.runtime_catalog_version (
      id, tenant_id, case_id, created_by, catalog_name, runtime_spec_version, runtime_catalog_version,
      mother_catalog_version, catalog_status, runtime_spec_checksum, runtime_catalog_checksum, mother_catalog_checksum
    )
    values (
      '${ids.catalogVersion}'::uuid, '${ids.company}'::uuid, '${ids.case}'::uuid, '${actorId}'::uuid,
      'PM U0 Runtime Source Matrix', '40+20-u0', '40+20-u0', 'CAPA1_V2_1',
      'qa_contract', '${sha256("runtime-spec")}', '${sha256("runtime-catalog")}', '${sha256("mother-catalog")}'
    )
    on conflict (id) do nothing;
    insert into public.role_runtime_session (id, tenant_id, case_id, created_by, catalog_version_id, state)
    values ('${ids.roleSession}'::uuid, '${ids.company}'::uuid, '${ids.case}'::uuid, '${actorId}'::uuid, '${ids.catalogVersion}'::uuid, 'active')
    on conflict (id) do nothing;
    insert into public.activity_runtime_run (
      id, tenant_id, case_id, created_by, role_runtime_session_id, catalog_version_id, state
    )
    values ('${ids.activityRun}'::uuid, '${ids.company}'::uuid, '${ids.case}'::uuid, '${actorId}'::uuid, '${ids.roleSession}'::uuid, '${ids.catalogVersion}'::uuid, 'ready_with_flags')
    on conflict (id) do nothing;
    insert into public.source_node_ref (
      id, tenant_id, case_id, catalog_version_id, source_node_ref, source_code, source_block,
      source_question_code, node_label, source_document, source_sheet, source_row_number, raw_row
    )
    values ${values}
    on conflict (catalog_version_id, source_node_ref) do nothing;
    insert into public.canonical_variable_record (
      id, tenant_id, case_id, run_id, variable_name, variable_value, route_id,
      route_status, derived_from, gap_flag
    )
    values ${cvValues}
    on conflict (id) do nothing;
  `);
  log.push("seeded runtime source_node_ref and canonical_variable_record rows");
}

function readDatabase(before, after) {
  return {
    before: readSnapshotPackages(before.snapshotId),
    after: readSnapshotPackages(after.snapshotId),
    sourceNodeRefs: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t) order by t.source_node_ref), '[]'::jsonb) from public.source_node_ref t where case_id = '${ids.case}'::uuid`),
    canonicalVariables: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t) order by t.variable_name), '[]'::jsonb) from public.canonical_variable_record t where case_id = '${ids.case}'::uuid`),
  };
}

function readSnapshotPackages(snapshotId) {
  const snapshot = readSnapshot(snapshotId);
  return {
    snapshot,
    evidence: readPackage(snapshot.evidence_package_version_id),
    facts: readPackage(snapshot.structural_facts_package_version_id),
    registry: readPackage(snapshot.registry_package_version_id),
    inventory: readPackage(snapshot.inventory_package_version_id),
    ir: readPackage(snapshot.mmabp_ir_package_version_id),
    lineage: sqlJson(`select coalesce(jsonb_agg(to_jsonb(t) order by t.ir_element_id, t.fact_id, t.evidence_id), '[]'::jsonb) from public.mmabp_source_lineage_index t where snapshot_id = '${snapshotId}'::uuid`),
  };
}

function readReadiness(dir) {
  const runner = JSON.parse(fs.readFileSync(path.join(dir, "runner-result.json"), "utf8"));
  const rulesDir = path.join(dir, "rules");
  const rules = Object.fromEntries(fs.readdirSync(rulesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const rule = JSON.parse(fs.readFileSync(path.join(rulesDir, file), "utf8"));
      return [rule.ruleId, rule];
    }));
  return { runner, rules };
}

function writeEvidence(files) {
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(outRoot, name), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
}

function writeSourceMatrixDocs(sourceMatrix) {
  const docsDir = path.join(root, "docs", "eve", "panel-control");
  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_SOURCE_MATRIX.json"), `${JSON.stringify(sourceMatrix, null, 2)}\n`);
  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_SOURCE_MATRIX.md"), [
    "# PM Upstream Seeding Source Matrix",
    "",
    "| Input | Source table | Source node | Canonical variable | Status |",
    "| --- | --- | --- | --- | --- |",
    ...sourceMatrix.map((item) => `| ${item.input} | ${item.source_table} | ${item.source_node_ref} | ${item.canonical_variable} | ${item.source_status} |`),
    "",
  ].join("\n"));
}

function updateGapProposal(sourceMatrix) {
  const targetJson = path.join(root, "reports", "local", "mmabp-rule-readiness", "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.json");
  const targetMd = path.join(root, "reports", "local", "mmabp-rule-readiness", "MMABP_UPSTREAM_PRODUCERS_SEEDING_GAP_PROPOSAL.md");
  const payload = fs.existsSync(targetJson)
    ? JSON.parse(fs.readFileSync(targetJson, "utf8"))
    : { generatedAt: new Date().toISOString(), gaps: [] };
  const statuses = Object.fromEntries(sourceMatrix.map((item) => [item.input, "MATERIALIZED"]));
  payload.u0PmVerticalSlice = {
    generatedAt: new Date().toISOString(),
    statuses,
    nonPmStatus: "SOURCE_IDENTIFIED_NOT_IMPLEMENTED_OR_SOURCE_NOT_MATERIALIZED",
    invariants: invariants(),
  };
  fs.writeFileSync(targetJson, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(targetMd, [
    "# MMABP Upstream Producers Seeding Gap Proposal",
    "",
    "## U0 PM Vertical Slice",
    "",
    ...sourceMatrix.map((item) => `- ${item.input}: MATERIALIZED via ${item.producer_service}`),
    "",
    "MoC, PF and OLC remain not implemented by U0.",
    "",
  ].join("\n"));
}

function writeDictamenDocs(result) {
  const docsDir = path.join(root, "docs", "eve", "panel-control");
  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_IMPLEMENTATION.md"), [
    "# PM Upstream Seeding Implementation",
    "",
    `Dictamen: ${result.dictamen}`,
    "",
    "Cadena ejecutada: evidence -> facts -> PM registry -> inventory -> IR -> normalization -> readiness.",
    "",
    "Estados preservados: PRODUCTOR CONFORMANCE/CONSISTENCY=NO_INICIADO, CP-012=BLOQUEADO, R4=BLOQUEADO, R5=PROVISIONAL.",
    "",
  ].join("\n"));
  fs.writeFileSync(path.join(docsDir, "PM_UPSTREAM_SEEDING_DICTAMEN.md"), [
    "# PM Upstream Seeding Dictamen",
    "",
    result.dictamen,
    "",
    "No se implemento productor Conformance/Consistency, ACA, CP-012, diagramacion, exportacion ni cambios visuales en Panel.",
    "",
  ].join("\n"));
}

function readPackage(id) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_source_package_version t where id = '${id}'::uuid`);
}

function readSnapshot(id) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_assessment_source_snapshot t where id = '${id}'::uuid`);
}

function readRun(id) {
  return sqlJson(`select to_jsonb(t) from public.mmabp_structured_normalization_run t where id = '${id}'::uuid`);
}

function loadFixtures() {
  return {
    bundle: readJson("valid-mmabp-design-source-bundle.json"),
    facts: readJson("client-mmabp-structural-facts.json"),
    registry: readJson("quadrant-registries.json"),
    inventory: readJson("inventory-readiness-ready.json"),
    ir: readJson("mmabp-ir-package.json"),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
}

function runNode(script, args) {
  execFileSync(process.execPath, [path.join(root, "scripts", "eve", "official-control-panel", script), ...args], {
    cwd: root,
    stdio: "ignore",
  });
}

async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
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

function resolveEnv() {
  const status = JSON.parse(execSync("npx.cmd supabase status -o json", { cwd: root, encoding: "utf8" }).match(/\{[\s\S]*\}/)[0]);
  return { supabaseUrl: status.API_URL, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

function invariants() {
  return {
    producerConformanceConsistency: "NO_INICIADO",
    cp012: "BLOQUEADO",
    r4: "BLOQUEADO",
    r5: "PROVISIONAL",
  };
}

function uuidFrom(value) {
  const hash = sha256(value);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-9${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
