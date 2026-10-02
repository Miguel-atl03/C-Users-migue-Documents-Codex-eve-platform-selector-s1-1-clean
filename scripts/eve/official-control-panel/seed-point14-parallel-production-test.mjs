#!/usr/bin/env node
/**
 * §14 operational seed — RPC only (no direct DML on factual tables).
 * Writes: reports/local/rector-point-14/manifest.json
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");
const MANIFEST_DIR = resolve(projectRoot, "reports/local/rector-point-14");
const MANIFEST_PATH = resolve(MANIFEST_DIR, "manifest.json");
const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

const IDS = {
  company: "a1400014-0000-4000-8000-000000000001",
  relationship: "a1400014-0000-4000-8000-000000000002",
  caseFindings: "a1400014-0000-4000-8000-000000000003",
  caseSatisfied: "a1400014-0000-4000-8000-000000000004",
  assignA: "a1400014-0000-4000-8000-00000000000b",
  usuario: "a1400014-0000-4000-8000-000000000005",
};

const EMAIL_A = "point14-opval-a@example.invalid";
const EMAIL_B = "point14-opval-b@example.invalid";

loadEnvLocal();
const env = resolveEnv();
const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});

async function main() {
  assertLocal(env.supabaseUrl);
  if (
    IDS.caseFindings === AMBER_CASE ||
    IDS.caseSatisfied === AMBER_CASE
  ) {
    throw new Error("amber_seed_forbidden");
  }

  const userA = await ensureUser(EMAIL_A, env.password);
  const userB = await ensureUser(EMAIL_B, env.password);
  runSql(buildStructureSql(userA, userB));

  const pkgFindings = randomUUID();
  const pkgSatisfied = randomUUID();
  const findingConformance = randomUUID();
  const findingB3 = randomUUID();
  const findingB7 = randomUUID();
  const findingRework = randomUUID();

  // Deactivate prior current via RPC create (create deactivates)
  await createPackage({
    id: pkgFindings,
    caseId: IDS.caseFindings,
    ref: "PP-PKG-FINDINGS",
    readiness: "ready_with_flags",
  });
  await createPackage({
    id: pkgSatisfied,
    caseId: IDS.caseSatisfied,
    ref: "PP-PKG-SATISFIED",
    readiness: "ready",
  });

  // Findings package path
  await transition(pkgFindings, "validated", "package_validated");
  await transition(pkgFindings, "processing", "processing_started", {
    p_source_bundle_ref: "mdsb://opval/findings/v1",
    p_candidates_ref: "candidates://opval/findings/v1",
    p_facts_ref: "facts://opval/findings/v1",
    p_registries_ref: "registries://opval/findings/v1",
    p_ir_ref: "ir://opval/findings/v1",
    p_inventory_ref: "inventory://opval/findings/v1",
  });
  await transition(pkgFindings, "with_findings", "findings_opened", {
    p_aca_status: "WithFindings",
    p_conformance_status: "failed",
    p_consistency_factual_status: "failed",
    p_consistency_temporal_status: "not_evaluated",
    p_consistency_structural_status: "failed",
    p_consistency_composite_status: "failed",
    p_b3_route_exception: true,
    p_b7_boundary_violation: true,
    p_export_eligibility: "blocked",
    p_export_generation_status: "blocked",
    p_rework_process_code: "P-SUP-06",
    p_readiness_status: "blocked_by_missing_canonical_route",
    p_reason: "QA WithFindings; B3/B7 abiertos",
  });
  await transition(pkgFindings, "in_rework", "rework_requested", {
    p_rework_process_code: "P-SUP-06",
    p_reason: "Rework a P-SUP-06",
  });

  await openFinding({
    id: findingConformance,
    packageId: pkgFindings,
    type: "conformance",
    model: "PM",
    severity: "critical",
    evidence: "evidence://conformance/1",
    origin: "assessment",
    blocking: true,
  });
  await openFinding({
    id: findingB3,
    packageId: pkgFindings,
    type: "b3_route_exception",
    model: "CrossQuadrant",
    severity: "critical",
    evidence: "evidence://b3/1",
    origin: "gate_b3",
    blocking: true,
  });
  await openFinding({
    id: findingB7,
    packageId: pkgFindings,
    type: "b7_boundary_violation",
    model: "Package",
    severity: "critical",
    evidence: "evidence://b7/1",
    origin: "gate_b7",
    blocking: true,
  });
  await openFinding({
    id: findingRework,
    packageId: pkgFindings,
    type: "structural_consistency",
    model: "MoC",
    severity: "warning",
    evidence: "evidence://struct/1",
    origin: "assessment",
    blocking: false,
  });

  // Full finding lifecycle for structural finding → resolved
  await findingTransition(findingRework, "rework_requested", "rework_requested", {
    p_reason: "Enviado a P-SUP-06",
  });
  await findingTransition(findingRework, "rework_started", "rework_started");
  await findingTransition(findingRework, "rework_submitted", "rework_submitted", {
    p_evidence_ref: "evidence://struct/1/rework",
  });
  await findingTransition(
    findingRework,
    "reevaluation_started",
    "reevaluation_started",
    { p_evidence_ref: "evidence://struct/1/rework" },
  );
  await findingTransition(
    findingRework,
    "reevaluation_completed",
    "reevaluation_completed",
    {
      p_evidence_ref: "evidence://struct/1/reeval",
      p_reevaluation_result: "satisfactory",
      p_reevaluation_result_ref: "qa-report://struct/1",
      p_reevaluation_evaluation_ref: "eval://struct/1/v2",
    },
  );
  await findingTransition(findingRework, "resolved", "finding_resolved", {
    p_resolution_ref: "resolution://struct/1",
  });

  // Satisfied / export eligible / generator unavailable
  await transition(pkgSatisfied, "validated", "package_validated");
  await transition(pkgSatisfied, "processing", "processing_started", {
    p_source_bundle_ref: "mdsb://opval/ok/v1",
    p_candidates_ref: "candidates://opval/ok/v1",
    p_facts_ref: "facts://opval/ok/v1",
    p_registries_ref: "registries://opval/ok/v1",
    p_ir_ref: "ir://opval/ok/v1",
    p_inventory_ref: "inventory://opval/ok/v1",
    p_conformance_status: "passed",
    p_consistency_factual_status: "passed",
    p_consistency_temporal_status: "passed",
    p_consistency_structural_status: "passed",
    p_consistency_composite_status: "passed",
  });
  await transition(pkgSatisfied, "satisfied", "qa_satisfied", {
    p_aca_status: "Satisfied",
    p_conformance_status: "passed",
    p_consistency_factual_status: "passed",
    p_consistency_temporal_status: "passed",
    p_consistency_structural_status: "passed",
    p_consistency_composite_status: "passed",
    p_b3_route_exception: false,
    p_b7_boundary_violation: false,
    p_export_eligibility: "not_evaluated",
    p_readiness_status: "ready",
  });
  await transition(pkgSatisfied, "export_eligible", "export_eligible", {
    p_export_eligibility: "eligible",
    p_generator_available: false,
    p_export_generation_status: "unavailable",
    p_aca_status: "Satisfied",
    p_conformance_status: "passed",
    p_consistency_composite_status: "passed",
    p_b3_route_exception: false,
    p_b7_boundary_violation: false,
  });

  const monitoringFindings =
    `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseFindings}`;
  const monitoringSatisfied =
    `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
    `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseSatisfied}`;

  mkdirSync(MANIFEST_DIR, { recursive: true });
  const manifest = {
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseFindingsId: IDS.caseFindings,
    caseSatisfiedId: IDS.caseSatisfied,
    packageFindingsId: pkgFindings,
    packageSatisfiedId: pkgSatisfied,
    findingIds: {
      conformance: findingConformance,
      b3: findingB3,
      b7: findingB7,
      rework: findingRework,
    },
    consultants: {
      a: { email: EMAIL_A },
      b: { email: EMAIL_B },
    },
    monitoringFindingsUrl: monitoringFindings,
    monitoringSatisfiedUrl: monitoringSatisfied,
    amberCaseId: AMBER_CASE,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ok: true, manifest: MANIFEST_PATH }));
}

async function createPackage({ id, caseId, ref, readiness }) {
  const { error } = await admin.rpc("eve_create_parallel_production_package", {
    p_company_id: IDS.company,
    p_case_id: caseId,
    p_package_ref: ref,
    p_actor_label: "point14_seed_producer",
    p_package_id: id,
    p_readiness_status: readiness,
  });
  if (error) throw new Error(`create_package:${error.message}`);
}

async function transition(packageId, afterStatus, eventType, extra = {}) {
  const { error } = await admin.rpc("eve_apply_parallel_production_transition", {
    p_package_id: packageId,
    p_after_status: afterStatus,
    p_actor_label: "point14_seed_producer",
    p_event_type: eventType,
    p_reason: extra.p_reason ?? null,
    p_evidence_ref: extra.p_evidence_ref ?? null,
    p_readiness_status: extra.p_readiness_status ?? null,
    p_aca_status: extra.p_aca_status ?? null,
    p_conformance_status: extra.p_conformance_status ?? null,
    p_consistency_factual_status: extra.p_consistency_factual_status ?? null,
    p_consistency_temporal_status: extra.p_consistency_temporal_status ?? null,
    p_consistency_structural_status: extra.p_consistency_structural_status ?? null,
    p_consistency_composite_status: extra.p_consistency_composite_status ?? null,
    p_b3_route_exception: extra.p_b3_route_exception ?? null,
    p_b7_boundary_violation: extra.p_b7_boundary_violation ?? null,
    p_export_eligibility: extra.p_export_eligibility ?? null,
    p_generator_available: extra.p_generator_available ?? null,
    p_export_generation_status: extra.p_export_generation_status ?? null,
    p_rework_process_code: extra.p_rework_process_code ?? null,
    p_source_bundle_ref: extra.p_source_bundle_ref ?? null,
    p_candidates_ref: extra.p_candidates_ref ?? null,
    p_facts_ref: extra.p_facts_ref ?? null,
    p_registries_ref: extra.p_registries_ref ?? null,
    p_ir_ref: extra.p_ir_ref ?? null,
    p_inventory_ref: extra.p_inventory_ref ?? null,
    p_request_id: extra.p_request_id ?? null,
  });
  if (error) {
    throw new Error(`transition_${eventType}_${afterStatus}:${error.message}`);
  }
}

async function openFinding(input) {
  const { error } = await admin.rpc("eve_open_parallel_production_finding", {
    p_package_id: input.packageId,
    p_finding_type: input.type,
    p_evidence_ref: input.evidence,
    p_origin: input.origin,
    p_actor_label: "point14_seed_producer",
    p_finding_id: input.id,
    p_affected_model: input.model,
    p_severity: input.severity,
    p_blocking: input.blocking,
  });
  if (error) throw new Error(`open_finding_${input.type}:${error.message}`);
}

async function findingTransition(findingId, afterStatus, eventType, extra = {}) {
  const { error } = await admin.rpc(
    "eve_apply_parallel_production_finding_transition",
    {
      p_finding_id: findingId,
      p_after_status: afterStatus,
      p_actor_label: "point14_seed_producer",
      p_event_type: eventType,
      p_reason: extra.p_reason ?? null,
      p_evidence_ref: extra.p_evidence_ref ?? null,
      p_resolution_ref: extra.p_resolution_ref ?? null,
      p_reevaluation_result: extra.p_reevaluation_result ?? null,
      p_reevaluation_result_ref: extra.p_reevaluation_result_ref ?? null,
      p_reevaluation_evaluation_ref: extra.p_reevaluation_evaluation_ref ?? null,
    },
  );
  if (error) {
    throw new Error(`finding_${eventType}_${afterStatus}:${error.message}`);
  }
}

function buildStructureSql(userA, userB) {
  return `
begin;
-- Disposable OpVal company only: reset factual rows so reseed is deterministic.
-- session_replication_role bypasses append-only triggers for this local test wipe.
-- Amber case ${AMBER_CASE} is never touched (different company/case).
set local session_replication_role = replica;
delete from public.parallel_production_qa_finding_event
 where company_id = '${IDS.company}';
delete from public.parallel_production_qa_finding
 where company_id = '${IDS.company}';
delete from public.parallel_production_package_event
 where company_id = '${IDS.company}';
delete from public.parallel_production_package
 where company_id = '${IDS.company}';
set local session_replication_role = DEFAULT;

insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa Point14 OpVal')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'point14-opval-participant@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${IDS.assignA}', '${userA}', '${IDS.company}', 'enabled', now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_from = excluded.valid_from,
  valid_until = null;

update public.consultant_company_assignments
set status = 'disabled', valid_until = now()
where consultant_user_id = '${userB}'
  and client_company_id = '${IDS.company}';

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación Point14 OpVal', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values
(
  '${IDS.caseFindings}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point14 OpVal Findings'
),
(
  '${IDS.caseSatisfied}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point14 OpVal Satisfied'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;
commit;
`;
}

async function ensureUser(email, password) {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password });
    return existing.id;
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  return created.data.user.id;
}

function runSql(sql) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_eve-platform",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { encoding: "utf8", input: sql },
  );
  if (result.status !== 0) {
    throw new Error(
      `sql_failed:${result.stderr || result.stdout || "unknown"}`,
    );
  }
}

function resolveEnv() {
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceRoleKey) {
    const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      cwd: projectRoot,
      encoding: "utf8",
      shell: true,
    });
    const m = /SERVICE_ROLE_KEY=(.+)/.exec(
      `${status.stdout || ""}\n${status.stderr || ""}`,
    );
    if (!m) throw new Error("missing_service_role_key");
    serviceRoleKey = m[1].trim().replace(/^"|"$/g, "");
  }
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
  if (!supabaseUrl || !password) throw new Error("env_incomplete");
  return { supabaseUrl, serviceRoleKey, password };
}

function assertLocal(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error("remote_supabase_url_rejected");
  }
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(projectRoot, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}
