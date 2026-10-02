#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import { createHmac } from "node:crypto";
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
const fixtureDir = path.join(root, "tests", "fixtures", "parallel-production");
const outDir = path.join(root, "reports", "local", "mmabp-assessment-data-substrate-db");
const password = process.env.EVE_TEST_PASSWORD ?? "Test.123";
const producerType = "mmabp_substrate_server";
const producerRef = "scripts/eve/official-control-panel/verify-mmabp-assessment-data-substrate.mjs";
const appendOnlyError = "mmabp_assessment_data_substrate_append_only";

const ids = {
  companyA: "6f7f0000-0000-4000-9000-000000000001",
  companyB: "6f7f0000-0000-4000-9000-000000000002",
  relationshipA: "6f7f0000-0000-4000-9000-000000000003",
  relationshipB: "6f7f0000-0000-4000-9000-000000000004",
  usuarioA: "6f7f0000-0000-4000-9000-000000000005",
  usuarioB: "6f7f0000-0000-4000-9000-000000000006",
  caseA: "6f7f0000-0000-4000-9000-000000000007",
  caseB: "6f7f0000-0000-4000-9000-000000000008",
  packageA: "6f7f0000-0000-4000-9000-000000000009",
  packageB: "6f7f0000-0000-4000-9000-000000000010",
  authConsultantA: "6f7f0000-0000-4000-9000-000000000011",
  authConsultantB: "6f7f0000-0000-4000-9000-000000000012",
  authConsultantC: "6f7f0000-0000-4000-9000-000000000013",
  authUserA: "6f7f0000-0000-4000-9000-000000000014",
  authUserB: "6f7f0000-0000-4000-9000-000000000015",
};

const appendOnlyTables = [
  "mmabp_source_package",
  "mmabp_source_package_version",
  "mmabp_assessment_source_snapshot",
  "mmabp_model_element_index",
  "mmabp_source_lineage_index",
  "mmabp_rule_input_readiness",
  "mmabp_assessment_data_substrate_audit",
  "mmabp_substrate_idempotency_ledger",
];

const report = {
  ok: false,
  runnerStatus: "failed",
  generatedAt: new Date().toISOString(),
  scope: "DB productive validation of MMABP assessment data substrate; assessment producer not started.",
  setup: {},
  ingested: {},
  snapshot: {},
  readback: {},
  probes: {},
  metrics: {},
  gates: {},
};

main().catch((error) => {
  report.error = serializeError(error);
  finish(false);
});

async function main() {
  loadEnvLocal();
  const env = resolveEnv();
  assertLocal(env.supabaseUrl);
  fs.mkdirSync(outDir, { recursive: true });

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await assertDbAvailable(env);
  const fixtures = loadAndValidateFixtures();
  report.probes.validatorInternalInvalid = probeOfficialValidatorInternalInvalid(fixtures);

  await setupPhysicalCases(admin);
  const packageA = await createParallelPackage(admin, ids.companyA, ids.caseA, ids.packageA, "MMABP-PKG-A");
  const packageB = await createParallelPackage(admin, ids.companyB, ids.caseB, ids.packageB, "MMABP-PKG-B");
  report.setup.packageA = packageA.id;
  report.setup.packageB = packageB.id;

  const versionsA = await ingestAll(admin, ids.companyA, ids.caseA, ids.packageA, fixtures, "A");
  const evidenceB = await ingestOne(admin, {
    companyId: ids.companyB,
    caseId: ids.caseB,
    packageId: ids.packageB,
    type: "evidence_bundle",
    sourceId: "MMABPDSB_B",
    schemaId: "mmabp_design_source_bundle",
    schemaVersion: "1.0.0",
    content: withId(fixtures.bundle, "bundle_id", "MMABPDSB_B"),
    requestId: "mmabp-db-b-evidence",
  });
  report.ingested.caseA = versionsA;
  report.ingested.caseB = { evidence: evidenceB };

  const snapshotA = await createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, versionsA, "mmabp-db-snapshot-a");
  report.snapshot.initial = snapshotA;
  report.readback.initial = await readbackDb(admin, snapshotA.snapshotId);
  report.metrics.beforeStale = await collectMetrics(admin, snapshotA.snapshotId);

  report.probes.schemaInvalid = await expectRpcFailure(() =>
    ingestOne(admin, {
      companyId: ids.companyA,
      caseId: ids.caseA,
      packageId: ids.packageA,
      type: "evidence_bundle",
      sourceId: "BAD_SCHEMA",
      schemaId: "mmabp_design_source_bundle",
      schemaVersion: "1.0.0",
      content: {},
      requestId: "probe-schema-invalid",
    }),
  );

  report.probes.hashIncorrect = await expectRpcFailure(() =>
    ingestOne(admin, {
      companyId: ids.companyA,
      caseId: ids.caseA,
      packageId: ids.packageA,
      type: "evidence_bundle",
      sourceId: "HASH_BAD",
      schemaId: "mmabp_design_source_bundle",
      schemaVersion: "1.0.0",
      content: fixtures.bundle,
      requestId: "probe-hash-incorrect",
      expectedSha256: "0".repeat(64),
    }),
  );

  report.probes.typeIncorrect = await expectRpcFailure(() =>
    ingestOne(admin, {
      companyId: ids.companyA,
      caseId: ids.caseA,
      packageId: ids.packageA,
      type: "inventory",
      sourceId: "TYPE_BAD",
      schemaId: "inventory_readiness",
      schemaVersion: "1.0.0",
      content: fixtures.bundle,
      requestId: "probe-type-incorrect",
    }),
  );

  report.probes.otherCaseComponent = await expectRpcFailure(() =>
    createSnapshot(
      admin,
      ids.companyA,
      ids.caseA,
      ids.packageA,
      { ...versionsA, evidence: evidenceB },
      "probe-other-case-component",
    ),
  );

  const foreignCompanyEvidence = await ingestOne(admin, {
    companyId: ids.companyB,
    caseId: ids.caseB,
    packageId: ids.packageB,
    type: "evidence_bundle",
    sourceId: "MMABPDSB_B_FOREIGN_COMPANY",
    schemaId: "mmabp_design_source_bundle",
    schemaVersion: "1.0.0",
    content: withId(fixtures.bundle, "bundle_id", "MMABPDSB_B_FOREIGN_COMPANY"),
    requestId: "mmabp-db-b-foreign-evidence",
  });
  report.probes.otherCompanyComponent = await expectRpcFailure(() =>
    createSnapshot(
      admin,
      ids.companyA,
      ids.caseA,
      ids.packageA,
      { ...versionsA, evidence: foreignCompanyEvidence },
      "probe-other-company-component",
    ),
  );

  report.probes.snapshotIncomplete = await expectRpcFailure(() =>
    createSnapshot(
      admin,
      ids.companyA,
      ids.caseA,
      ids.packageA,
      { ...versionsA, facts: versionsA.evidence },
      "probe-snapshot-incomplete",
    ),
  );

  const badIrVersion = await ingestOne(admin, {
    companyId: ids.companyA,
    caseId: ids.caseA,
    packageId: ids.packageA,
    type: "mmabp_ir",
    sourceId: "IR_BAD_REGISTRY",
    schemaId: "mmabp_ir_package",
    schemaVersion: "1.0.0",
    content: mutateClone(fixtures.ir, (ir) => {
      ir.models.PM_IR.elements[0].source_registry_element_ids = ["PM_DOES_NOT_EXIST"];
    }),
    requestId: "probe-ir-without-registry-ingest",
  });
  report.probes.irWithoutRegistry = await expectRpcFailure(() =>
    createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, { ...versionsA, ir: badIrVersion }, "probe-ir-without-registry"),
  );

  const badRegistryVersion = await ingestOne(admin, {
    companyId: ids.companyA,
    caseId: ids.caseA,
    packageId: ids.packageA,
    type: "quadrant_registry",
    sourceId: "REGISTRY_BAD_FACT",
    schemaId: "quadrant_registry_package",
    schemaVersion: "1.0.0",
    content: mutateClone(fixtures.registry, (registry) => {
      registry.registries.PM.elements[0].source_fact_ids = ["FACT_DOES_NOT_EXIST"];
    }),
    requestId: "probe-registry-without-facts-ingest",
  });
  report.probes.registryWithoutFacts = await expectRpcFailure(() =>
    createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, { ...versionsA, registry: badRegistryVersion }, "probe-registry-without-facts"),
  );

  const badFactsVersion = await ingestOne(admin, {
    companyId: ids.companyA,
    caseId: ids.caseA,
    packageId: ids.packageA,
    type: "structural_facts",
    sourceId: "FACTS_BAD_EVIDENCE",
    schemaId: "client_mmabp_structural_facts",
    schemaVersion: "1.0.0",
    content: mutateClone(fixtures.facts, (facts) => {
      facts.structural_facts[0].source_evidence_ids = ["EVID_DOES_NOT_EXIST"];
    }),
    requestId: "probe-facts-without-evidence-ingest",
  });
  report.probes.factsWithoutEvidence = await expectRpcFailure(() =>
    createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, { ...versionsA, facts: badFactsVersion }, "probe-facts-without-evidence"),
  );

  report.probes.ingestIdempotencyReplay = await probeIngestIdempotencyReplay(admin, fixtures);
  report.probes.ingestIdempotencyConflict = await probeIngestIdempotencyConflict(admin, fixtures);
  report.probes.snapshotIdempotencyReplay = await probeSnapshotIdempotencyReplay(admin, versionsA);
  report.probes.snapshotIdempotencyConflict = await probeSnapshotIdempotencyConflict(admin, versionsA);

  const staleBefore = await snapshotStatus(admin, snapshotA.snapshotId);
  const changedEvidenceVersion = await ingestOne(admin, {
    companyId: ids.companyA,
    caseId: ids.caseA,
    packageId: ids.packageA,
    type: "evidence_bundle",
    sourceId: "MMABPDSB_001",
    schemaId: "mmabp_design_source_bundle",
    schemaVersion: "1.0.0",
    content: mutateClone(fixtures.bundle, (bundle) => {
      bundle.literal_evidence.push({
        evidence_id: "EVID_STALE_PROBE",
        scene_id: "SC_001",
        block_origin: "block_probe",
        question_origin: "probe",
        literal_value: "Nueva evidencia para demostrar obsolescencia de snapshot.",
        provenance_type: "captured_user_evidence",
      });
    }),
    requestId: "probe-stale-new-evidence",
  });
  const staleAfter = await snapshotStatus(admin, snapshotA.snapshotId);
  report.probes.snapshotStale = {
    ok: staleBefore.stale === false && staleAfter.stale === true,
    before: staleBefore,
    after: staleAfter,
    newEvidenceVersion: changedEvidenceVersion,
  };
  report.metrics.afterStale = await collectMetrics(admin, snapshotA.snapshotId);

  report.probes.consultantBReadingA = await probeConsultantIsolation(env, ids.caseA);
  report.probes.rawEvidenceRequiresCapability = await probeEvidenceCapability(env, versionsA.evidence.packageVersionId);
  report.probes.appendOnlyMutations = probeAppendOnlyTables();
  report.probes.metricViolations = probeMetricViolations(snapshotA.snapshotId);

  const requiredProbeOk = Object.values(flatProbeBooleans(report.probes)).every(Boolean);
  const beforeMetricsOk = Object.values(report.metrics.beforeStale).every((value) => value === 0);
  const staleMetricOk = report.metrics.afterStale.staleSnapshotsMarkedCurrent > 0;
  finish(requiredProbeOk && beforeMetricsOk && staleMetricOk);
}

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function resolveEnv() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    const status = loadSupabaseStatus();
    supabaseUrl = status.API_URL;
    anonKey = status.ANON_KEY;
    serviceRoleKey = status.SERVICE_ROLE_KEY;
  }
  if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("missing_supabase_env");
  const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? process.env.JWT_SECRET ?? loadSupabaseStatus().JWT_SECRET;
  return { supabaseUrl, anonKey, serviceRoleKey, jwtSecret };
}

function loadSupabaseStatus() {
  const output = execSync("npx.cmd supabase status -o json", { cwd: root, encoding: "utf8" });
  const end = output.lastIndexOf("}");
  if (end < 0) throw new Error("supabase_status_json_missing");
  return JSON.parse(output.slice(0, end + 1));
}

function assertLocal(url) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost):54321/.test(url)) throw new Error("non_local_supabase_forbidden");
}

async function assertDbAvailable(env) {
  const health = await fetch(`${env.supabaseUrl}/rest/v1/`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
  });
  if (!health.ok && health.status !== 404) throw new Error(`db_unavailable:${health.status}`);
  report.gates.dbAvailable = true;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
}

function loadAndValidateFixtures() {
  const bundle = readJson("valid-mmabp-design-source-bundle.json");
  const facts = readJson("client-mmabp-structural-facts.json");
  const registry = readJson("quadrant-registries.json");
  const inventory = readJson("inventory-readiness-ready.json");
  const ir = readJson("mmabp-ir-package.json");
  const conformanceReport = readJson("conformance-report-passed.json");
  const consistencyReport = readJson("consistency-report-passed.json");
  const schemaResults = [
    validateMmabpDesignSourceBundle(bundle),
    validateClientMmabpStructuralFacts(facts, bundle),
    validateQuadrantRegistryPackage(registry, facts, inventory),
    validateInventoryReadiness(inventory),
    validateMmabpIrPackage(ir, registry, { conformanceReport, consistencyReport }),
  ];
  const failed = schemaResults.filter((result) => result.status !== "passed");
  if (failed.length) throw new Error(`schema_validation_failed:${failed.length}`);
  report.gates.serverSchemaValidation = true;
  return { bundle, facts, registry, inventory, ir };
}

function probeOfficialValidatorInternalInvalid(fixtures) {
  const invalid = mutateClone(fixtures.bundle, (bundle) => {
    bundle.literal_evidence[0].evidence_id = "";
  });
  const result = validateMmabpDesignSourceBundle(invalid);
  return {
    ok: result.status !== "passed",
    status: result.status,
    findingCount: result.findings?.length ?? 0,
    probe: "valid top-level literal_evidence key with invalid internal evidence_id",
  };
}

async function setupPhysicalCases(admin) {
  const consultantA = ensureUser(ids.authConsultantA, "mmabp-consultant-a@example.invalid");
  const consultantB = ensureUser(ids.authConsultantB, "mmabp-consultant-b@example.invalid");
  const consultantC = ensureUser(ids.authConsultantC, "mmabp-consultant-c@example.invalid");
  const userA = ensureUser(ids.authUserA, "mmabp-user-a@example.invalid");
  const userB = ensureUser(ids.authUserB, "mmabp-user-b@example.invalid");

  seedCaseSql({ companyId: ids.companyA, relationshipId: ids.relationshipA, usuarioId: ids.usuarioA, caseId: ids.caseA, operationalUserId: userA.id, consultantUserId: consultantA.id, createdBy: userA.id, companyName: "MMABP Company A", relationshipName: "MMABP Relationship A" });
  seedCaseSql({ companyId: ids.companyB, relationshipId: ids.relationshipB, usuarioId: ids.usuarioB, caseId: ids.caseB, operationalUserId: userB.id, consultantUserId: consultantB.id, createdBy: userB.id, companyName: "MMABP Company B", relationshipName: "MMABP Relationship B" });
  seedAssignmentSql({ consultantUserId: consultantC.id, companyId: ids.companyA, createdBy: userA.id });

  await rpc(admin, "eve_grant_consultant_panel_capability", {
    p_actor_user_id: userA.id,
    p_consultant_user_id: consultantA.id,
    p_client_company_id: ids.companyA,
    p_capability: "view_authorized_evidence",
    p_reason: "MMABP DB substrate physical verifier",
  });

  report.setup.consultantA = consultantA.id;
  report.setup.consultantB = consultantB.id;
  report.setup.consultantCNoEvidenceGrant = consultantC.id;
  report.setup.userA = userA.id;
  report.setup.userB = userB.id;
  report.gates.testOnlyRpcPreparation = "not_used";
}

function ensureUser(userId, email) {
  runDbSql(`
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      ${sql(userId)}::uuid,
      'authenticated',
      'authenticated',
      ${sql(email)},
      crypt(${sql(password)}, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    )
    on conflict (id) do update
      set email = excluded.email,
          encrypted_password = excluded.encrypted_password,
          email_confirmed_at = excluded.email_confirmed_at,
          updated_at = now();

    insert into auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      ${sql(userId)},
      ${sql(userId)}::uuid,
      jsonb_build_object('sub', ${sql(userId)}, 'email', ${sql(email)}),
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do update
      set user_id = excluded.user_id,
          identity_data = excluded.identity_data,
          updated_at = now();
  `);
  return { id: userId, email };
}

function seedCaseSql(input) {
  runDbSql(`
    insert into public.empresas (id, nombre, sector)
    values (${sql(input.companyId)}::uuid, ${sql(input.companyName)}, 'test-only-mmabp')
    on conflict (id) do nothing;

    insert into public.client_relationships (id, client_company_id, display_name, created_by)
    values (${sql(input.relationshipId)}::uuid, ${sql(input.companyId)}::uuid, ${sql(input.relationshipName)}, ${sql(input.createdBy)}::uuid)
    on conflict (id) do nothing;

    insert into public.usuarios (id, auth_user_id, empresa_id, email)
    values (${sql(input.usuarioId)}::uuid, ${sql(input.operationalUserId)}::uuid, ${sql(input.companyId)}::uuid, ${sql(`operational-${input.usuarioId}@example.invalid`)})
    on conflict (id) do nothing;

    insert into public.sesiones_llenado (id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name)
    values (${sql(input.caseId)}::uuid, ${sql(input.usuarioId)}::uuid, 'mmabp_substrate_test', ${sql(input.companyId)}::uuid, ${sql(input.relationshipId)}::uuid, ${sql(`${input.companyName} MMABP case`)})
    on conflict (id) do nothing;
  `);
  seedAssignmentSql({ consultantUserId: input.consultantUserId, companyId: input.companyId, createdBy: input.createdBy });
}

function seedAssignmentSql(input) {
  runDbSql(`
    insert into public.consultant_company_assignments (consultant_user_id, client_company_id, created_by)
    values (${sql(input.consultantUserId)}::uuid, ${sql(input.companyId)}::uuid, ${sql(input.createdBy)}::uuid);
  `);
}

async function createParallelPackage(admin, companyId, caseId, packageId, ref) {
  return rpc(admin, "eve_create_parallel_production_package", {
    p_company_id: companyId,
    p_case_id: caseId,
    p_package_ref: ref,
    p_actor_label: "mmabp_db_substrate_verifier",
    p_package_id: packageId,
    p_readiness_status: "ready_with_flags",
    p_request_id: `create-${ref}`,
  });
}

async function ingestAll(admin, companyId, caseId, packageId, fixtures, suffix) {
  return {
    evidence: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "evidence_bundle", "MMABPDSB_001", "mmabp_design_source_bundle", fixtures.bundle, `mmabp-db-${suffix}-evidence`)),
    facts: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "structural_facts", "CLIENTE_001_MMABP_FACTS_V1", "client_mmabp_structural_facts", fixtures.facts, `mmabp-db-${suffix}-facts`)),
    registry: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "quadrant_registry", "CLIENTE_001_QUADRANT_REGISTRIES_V1", "quadrant_registry_package", fixtures.registry, `mmabp-db-${suffix}-registry`)),
    inventory: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "inventory", "CLIENTE_001_INVENTORY_READINESS_V1", "inventory_readiness", fixtures.inventory, `mmabp-db-${suffix}-inventory`)),
    ir: await ingestOne(admin, sourceInput(companyId, caseId, packageId, "mmabp_ir", "CLIENTE_001_MMABP_IR_V1", "mmabp_ir_package", fixtures.ir, `mmabp-db-${suffix}-ir`)),
  };
}

function sourceInput(companyId, caseId, packageId, type, sourceId, schemaId, content, requestId) {
  return { companyId, caseId, packageId, type, sourceId, schemaId, schemaVersion: "1.0.0", content, requestId };
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
    p_expected_sha256: input.expectedSha256 ?? null,
    p_producer_type: producerType,
    p_producer_ref: producerRef,
    p_actor_id: report.setup.consultantA ?? report.setup.userA,
    p_idempotency_key: input.idempotencyKey ?? input.requestId,
  });
}

async function createSnapshot(admin, companyId, caseId, packageId, versions, requestId, idempotencyKey = requestId) {
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
    p_actor_id: report.setup.consultantA,
    p_idempotency_key: idempotencyKey,
  });
}

async function probeIngestIdempotencyReplay(admin, fixtures) {
  const input = sourceInput(ids.companyA, ids.caseA, ids.packageA, "evidence_bundle", "IDEMPOTENT_EVIDENCE", "mmabp_design_source_bundle", withId(fixtures.bundle, "bundle_id", "IDEMPOTENT_EVIDENCE"), "probe-ingest-idempotency-a");
  input.idempotencyKey = "same-ingest-key";
  const [first, second] = await Promise.all([ingestOne(admin, input), ingestOne(admin, input)]);
  return {
    ok: first.packageVersionId === second.packageVersionId && first.version === second.version,
    first,
    second,
  };
}

async function probeIngestIdempotencyConflict(admin, fixtures) {
  const base = sourceInput(ids.companyA, ids.caseA, ids.packageA, "evidence_bundle", "IDEMPOTENT_CONFLICT", "mmabp_design_source_bundle", withId(fixtures.bundle, "bundle_id", "IDEMPOTENT_CONFLICT"), "probe-ingest-conflict-a");
  base.idempotencyKey = "same-ingest-conflict-key";
  await ingestOne(admin, base);
  const conflict = { ...base, content: mutateClone(base.content, (bundle) => { bundle.literal_evidence[0].literal_value = "payload conflict"; }) };
  return expectRpcFailure(() => ingestOne(admin, conflict), "IDEMPOTENCY_CONFLICT");
}

async function probeSnapshotIdempotencyReplay(admin, versionsA) {
  const [first, second] = await Promise.all([
    createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, versionsA, "probe-snapshot-idempotency-a", "same-snapshot-key"),
    createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, versionsA, "probe-snapshot-idempotency-a", "same-snapshot-key"),
  ]);
  return { ok: first.snapshotId === second.snapshotId, first, second };
}

async function probeSnapshotIdempotencyConflict(admin, versionsA) {
  await createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, versionsA, "probe-snapshot-conflict-a", "same-snapshot-conflict-key");
  const conflict = { ...versionsA, facts: versionsA.evidence };
  return expectRpcFailure(() => createSnapshot(admin, ids.companyA, ids.caseA, ids.packageA, conflict, "probe-snapshot-conflict-a", "same-snapshot-conflict-key"), "IDEMPOTENCY_CONFLICT");
}

async function readbackDb(admin, snapshotId) {
  const { data, error } = await admin.rpc("eve_mmabp_substrate_readback", { p_snapshot_id: snapshotId });
  if (error) throw new Error(`readback_rpc:${error.message ?? error.code ?? "unknown"}`);
  return data;
}

async function snapshotStatus(admin, snapshotId) {
  const { data, error } = await admin.rpc("eve_mmabp_snapshot_status_v2", { p_snapshot_id: snapshotId });
  if (error) throw new Error(`snapshot_status:${error.message}`);
  return data;
}

async function probeConsultantIsolation(env, caseA) {
  const clientB = createAuthenticatedClient(env, ids.authConsultantB, "mmabp-consultant-b@example.invalid");
  const { data, error } = await clientB.from("mmabp_assessment_source_snapshot").select("id").eq("case_id", caseA);
  return { ok: !error && data.length === 0, rows: data?.length ?? null, error: error?.message ?? null };
}

async function probeEvidenceCapability(env, versionId) {
  const clientC = createAuthenticatedClient(env, ids.authConsultantC, "mmabp-consultant-c@example.invalid");
  const { error } = await clientC.rpc("eve_mmabp_get_source_package_content", { p_package_version_id: versionId });
  return {
    ok: error?.message === "view_authorized_evidence_required",
    error: error?.message ?? null,
    sameCaseAssignment: true,
    expectedCapability: "view_authorized_evidence",
  };
}

function createAuthenticatedClient(env, userId, email) {
  const token = signLocalJwt(env.jwtSecret, {
    aud: "authenticated",
    role: "authenticated",
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  return createClient(env.supabaseUrl, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function signLocalJwt(secret, payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function probeAppendOnlyTables() {
  const byTable = {};
  for (const table of appendOnlyTables) {
    byTable[table] = {
      update: probeAppendOnlyStatement(`begin; update public.${table} set created_at = created_at where id = (select id from public.${table} limit 1); rollback;`),
      delete: probeAppendOnlyStatement(`begin; delete from public.${table} where id = (select id from public.${table} limit 1); rollback;`),
      truncate: probeAppendOnlyStatement(`begin; truncate table public.${table} cascade; rollback;`),
    };
  }
  return {
    ok: Object.values(byTable).every((ops) => Object.values(ops).every((probe) => probe.ok)),
    byTable,
  };
}

function probeAppendOnlyStatement(sqlText) {
  try {
    runDbSql(sqlText);
    return { ok: false, error: null };
  } catch (error) {
    const message = String(error.stderr || error.message || error);
    return { ok: message.includes(appendOnlyError), error: message };
  }
}

function probeMetricViolations(snapshotId) {
  const probes = {
    missingPackages: metricProbe(snapshotId, `insert into public.mmabp_source_package (company_id, case_id, package_type, source_package_id, created_by) values (${sql(ids.companyA)}::uuid, ${sql(ids.caseA)}::uuid, 'evidence_bundle', 'METRIC_MISSING_PACKAGE', ${sql(report.setup.consultantA)}::uuid);`, "missingPackages"),
    hashMismatches: metricProbe(snapshotId, `update public.mmabp_source_package_version set content_sha256 = repeat('0', 64) where id = ${sql(report.ingested.caseA.evidence.packageVersionId)}::uuid;`, "hashMismatches"),
    crossCasePackageLinks: metricProbe(snapshotId, `update public.mmabp_source_package_version set case_id = ${sql(ids.caseB)}::uuid where id = ${sql(report.ingested.caseA.evidence.packageVersionId)}::uuid;`, "crossCasePackageLinks"),
    crossCompanyPackageLinks: metricProbe(snapshotId, `update public.mmabp_source_package_version set company_id = ${sql(ids.companyB)}::uuid where id = ${sql(report.ingested.caseA.evidence.packageVersionId)}::uuid;`, "crossCompanyPackageLinks"),
    snapshotsWithMissingComponents: metricProbe(snapshotId, `insert into public.mmabp_assessment_source_snapshot (company_id, case_id, parallel_production_package_id, parallel_production_package_version, evidence_package_version_id, evidence_sha256, structural_facts_package_version_id, structural_facts_sha256, registry_package_version_id, registry_sha256, inventory_package_version_id, inventory_sha256, mmabp_ir_package_version_id, mmabp_ir_sha256, source_lineage_sha256, created_by, producer_type, producer_ref, request_id, actor_id) values (${sql(ids.companyA)}::uuid, ${sql(ids.caseA)}::uuid, ${sql(ids.packageA)}::uuid, 1, gen_random_uuid(), repeat('0',64), gen_random_uuid(), repeat('0',64), gen_random_uuid(), repeat('0',64), gen_random_uuid(), repeat('0',64), gen_random_uuid(), repeat('0',64), repeat('0',64), ${sql(report.setup.consultantA)}::uuid, ${sql(producerType)}, ${sql(producerRef)}, 'metric-missing-components', ${sql(report.setup.consultantA)}::uuid);`, "snapshotsWithMissingComponents"),
    staleSnapshotsMarkedCurrent: { ok: report.metrics.afterStale.staleSnapshotsMarkedCurrent > 0, value: report.metrics.afterStale.staleSnapshotsMarkedCurrent },
    irElementsWithoutRegistry: metricProbe(snapshotId, `update public.mmabp_model_element_index set registry_element_id = null where snapshot_id = ${sql(snapshotId)}::uuid and id = (select id from public.mmabp_model_element_index where snapshot_id = ${sql(snapshotId)}::uuid limit 1);`, "irElementsWithoutRegistry"),
    registryElementsWithoutFacts: metricProbe(snapshotId, `update public.mmabp_source_package_version set content = jsonb_set(content, '{registries,PM,elements,0,source_fact_ids}', '["FACT_DOES_NOT_EXIST"]'::jsonb) where id = ${sql(report.ingested.caseA.registry.packageVersionId)}::uuid;`, "registryElementsWithoutFacts"),
    factsWithoutEvidence: metricProbe(snapshotId, `update public.mmabp_source_package_version set content = jsonb_set(content, '{structural_facts,0,source_evidence_ids}', '["EVID_DOES_NOT_EXIST"]'::jsonb) where id = ${sql(report.ingested.caseA.facts.packageVersionId)}::uuid;`, "factsWithoutEvidence"),
    modelElementsWithoutSourceIds: metricProbe(snapshotId, `update public.mmabp_model_element_index set fact_ids = '{}' where snapshot_id = ${sql(snapshotId)}::uuid and id = (select id from public.mmabp_model_element_index where snapshot_id = ${sql(snapshotId)}::uuid limit 1);`, "modelElementsWithoutSourceIds"),
    directServiceRoleDmlGrants: metricProbe(snapshotId, `grant insert on public.mmabp_source_package to service_role;`, "directServiceRoleDmlGrants"),
  };
  return {
    ok: Object.values(probes).every((probe) => probe.ok),
    probes,
  };
}

function metricProbe(snapshotId, mutationSql, metricName) {
  const output = runDbSql(`
    begin;
    set local session_replication_role = replica;
    ${mutationSql}
    set local session_replication_role = origin;
    select public.eve_mmabp_substrate_metrics_v2(${sql(snapshotId)}::uuid)->>${sql(metricName)};
    rollback;
  `);
  const numericLine = output.trim().split(/\r?\n/).find((line) => /^\d+$/.test(line.trim()));
  const value = Number(numericLine ?? 0);
  return { ok: value > 0, value };
}

async function collectMetrics(admin, snapshotId) {
  const { data, error } = await admin.rpc("eve_mmabp_substrate_metrics_v2", { p_snapshot_id: snapshotId });
  if (error) throw new Error(`collect_metrics:${error.message}`);
  return data;
}

async function expectRpcFailure(fn, expectedMessage = null) {
  try {
    await fn();
    return { ok: false, error: null };
  } catch (error) {
    const message = error.message ?? String(error);
    return { ok: expectedMessage ? message.includes(expectedMessage) : true, error: message };
  }
}

async function rpc(client, fn, args) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

function runDbSql(sqlText) {
  return execFileSync(
    "docker",
    ["exec", "-i", "supabase_db_eve-platform", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", sqlText],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

function sql(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function withId(value, key, nextValue) {
  return mutateClone(value, (copy) => {
    copy[key] = nextValue;
  });
}

function mutateClone(value, mutate) {
  const copy = structuredClone(value);
  mutate(copy);
  return copy;
}

function flatProbeBooleans(probes) {
  const result = {};
  for (const [key, value] of Object.entries(probes)) {
    if (value && typeof value === "object" && "ok" in value) {
      result[key] = value.ok === true;
    }
  }
  return result;
}

function serializeError(error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

function finish(ok) {
  report.ok = ok;
  report.runnerStatus = ok ? "passed" : "failed";
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "runner-result.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, "verifier-summary.json"), JSON.stringify({
    ok: report.ok,
    runnerStatus: report.runnerStatus,
    generatedAt: report.generatedAt,
    metrics: report.metrics,
    probes: flatProbeBooleans(report.probes ?? {}),
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "mutation-probes.json"), JSON.stringify(report.probes?.appendOnlyMutations ?? {}, null, 2));
  fs.writeFileSync(path.join(outDir, "metric-violation-probes.json"), JSON.stringify(report.probes?.metricViolations ?? {}, null, 2));
  fs.writeFileSync(path.join(outDir, "idempotency-probes.json"), JSON.stringify({
    ingestReplay: report.probes?.ingestIdempotencyReplay,
    ingestConflict: report.probes?.ingestIdempotencyConflict,
    snapshotReplay: report.probes?.snapshotIdempotencyReplay,
    snapshotConflict: report.probes?.snapshotIdempotencyConflict,
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "validator-probes.json"), JSON.stringify({
    validatorInternalInvalid: report.probes?.validatorInternalInvalid,
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "assessment-state-before-after.json"), JSON.stringify({
    initialSnapshot: report.snapshot?.initial ?? null,
    initialReadback: report.readback?.initial ?? null,
    staleBefore: report.probes?.snapshotStale?.before ?? null,
    staleAfter: report.probes?.snapshotStale?.after ?? null,
    metrics: report.metrics ?? {},
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "source-version-before-after.json"), JSON.stringify(report.probes?.snapshotStale ?? {}, null, 2));
  fs.writeFileSync(path.join(outDir, "capability-readback.json"), JSON.stringify({
    consultantBReadingA: report.probes?.consultantBReadingA,
    rawEvidenceRequiresCapability: report.probes?.rawEvidenceRequiresCapability,
  }, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exitCode = 1;
}
