#!/usr/bin/env node
/**
 * Point 12 operational validation — idempotent local seed (NOT Amber).
 * Creates Consultants A/B, case chain, 4 runs, publishes C01–C20 via RPC,
 * P3 controls, and compute_and_publish_runtime_control_snapshot.
 *
 * Usage (local only):
 *   node tests/e2e/setup/prepare-point12-runtime-operational-validation.mjs
 *
 * Writes: reports/local/rector-point-12-operational-validation/manifest.json
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");
const MANIFEST_DIR = resolve(
  projectRoot,
  "reports/local/rector-point-12-operational-validation",
);
const MANIFEST_PATH = resolve(MANIFEST_DIR, "manifest.json");

const IDS = {
  company: "a1200012-0000-4000-8000-000000000001",
  relationship: "a1200012-0000-4000-8000-000000000002",
  caseId: "a1200012-0000-4000-8000-000000000003",
  usuario: "a1200012-0000-4000-8000-000000000004",
  participant: "a1200012-0000-4000-8000-000000000005",
  profile: "a1200012-0000-4000-8000-000000000006",
  session: "a1200012-0000-4000-8000-000000000007",
  link: "a1200012-0000-4000-8000-000000000008",
  selection: "a1200012-0000-4000-8000-000000000009",
  catalogUuid: "a1200012-0000-4000-8000-00000000000a",
  assignA: "a1200012-0000-4000-8000-00000000000b",
  assignB: "a1200012-0000-4000-8000-00000000000c",
  activityReady: "a1200012-0000-4000-8000-000000000011",
  activityRestrict: "a1200012-0000-4000-8000-000000000012",
  activityBlocked: "a1200012-0000-4000-8000-000000000013",
  activityNotEval: "a1200012-0000-4000-8000-000000000014",
  runReady: "a1200012-0000-4000-8000-000000000021",
  runRestrict: "a1200012-0000-4000-8000-000000000022",
  runBlocked: "a1200012-0000-4000-8000-000000000023",
  runNotEval: "a1200012-0000-4000-8000-000000000024",
};

const CAUSALS = Array.from({ length: 20 }, (_, i) =>
  `C${String(i + 1).padStart(2, "0")}`,
);
const EMAIL_A = "point12-opval-a@example.invalid";
const EMAIL_B = "point12-opval-b@example.invalid";
const CATALOG = "point12-catalog-v1";

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
  const userA = await ensureUser(EMAIL_A, env.password);
  const userB = await ensureUser(EMAIL_B, env.password);

  runSql(buildStructureSql(userA, userB));

  const rules = await loadRules();
  await seedScenarioReady(rules);
  await seedScenarioRestrictions(rules);
  await seedScenarioBlocked(rules);
  await seedScenarioNotEvaluable(rules);

  const snapshots = {};
  for (const [key, runId] of [
    ["ready", IDS.runReady],
    ["ready_with_restrictions", IDS.runRestrict],
    ["blocked", IDS.runBlocked],
    ["not_evaluable", IDS.runNotEval],
  ]) {
    const { data, error } = await admin.rpc(
      "compute_and_publish_runtime_control_snapshot",
      {
        p_activity_runtime_run_id: runId,
        p_publisher: "point12-opval",
      },
    );
    if (error) throw new Error(`snapshot_${key}_failed:${error.message}`);
    snapshots[key] = data;
  }

  const ab = await validateAbIsolation(userA, userB);

  const manifest = {
    ok: true,
    createdAt: new Date().toISOString(),
    catalogVersion: CATALOG,
    consultantA: { email: EMAIL_A, userId: userA },
    consultantB: { email: EMAIL_B, userId: userB },
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    sessionId: IDS.session,
    runs: {
      ready: {
        runId: IDS.runReady,
        activityId: IDS.activityReady,
        readiness: snapshots.ready?.readiness_state ?? null,
      },
      ready_with_restrictions: {
        runId: IDS.runRestrict,
        activityId: IDS.activityRestrict,
        readiness: snapshots.ready_with_restrictions?.readiness_state ?? null,
      },
      blocked: {
        runId: IDS.runBlocked,
        activityId: IDS.activityBlocked,
        readiness: snapshots.blocked?.readiness_state ?? null,
      },
      not_evaluable: {
        runId: IDS.runNotEval,
        activityId: IDS.activityNotEval,
        readiness: snapshots.not_evaluable?.readiness_state ?? null,
      },
    },
    abIsolation: ab,
    panelPath:
      `/admin/official-consultant-control-panel?mode=client-company&view=monitoring` +
      `&company=${IDS.company}&relationship=${IDS.relationship}&case=${IDS.caseId}`,
  };

  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

async function seedScenarioReady(rules) {
  await clearRunCausal(IDS.runReady);
  await clearRunP3(IDS.runReady);
  for (const code of CAUSALS) {
    await publishClosedNotTriggered(IDS.runReady, code, rules);
  }
}

async function seedScenarioRestrictions(rules) {
  await clearRunCausal(IDS.runRestrict);
  for (const code of CAUSALS) {
    if (code === "C02") {
      await publishOpenTriggered(IDS.runRestrict, code);
    } else {
      await publishClosedNotTriggered(IDS.runRestrict, code, rules);
    }
  }
  runSql(`
    delete from public.readiness_gap_record where run_id = '${IDS.runRestrict}';
    delete from public.process_state_timer_event where run_id = '${IDS.runRestrict}';
    delete from public.readiness_decision_record where run_id = '${IDS.runRestrict}';
    insert into public.readiness_gap_record (
      id, tenant_id, case_id, run_id, gap_type, severity, status,
      affected_route, reentry_target, manual_review_flag, source_trace, metadata
    ) values (
      'a1200012-0000-4000-8000-000000000031',
      '${IDS.company}', '${IDS.caseId}', '${IDS.runRestrict}',
      'residual_variety_gap', 'P1', 'open', 'C02', null, false,
      '[]'::jsonb, '{"source_interaction_id":"C02","downstream_informed":true}'::jsonb
    );
    insert into public.process_state_timer_event (
      id, tenant_id, case_id, run_id, gate_id, awaited_event, release_condition,
      timeout_state, deadlock_risk, source_trace, metadata
    ) values
    (
      'a1200012-0000-4000-8000-000000000032',
      '${IDS.company}', '${IDS.caseId}', '${IDS.runRestrict}',
      'gate-active', 'awaited_release', 'event_received', 'waiting', false,
      '[]'::jsonb, '{"due_at":"2099-01-01T00:00:00.000Z","source_interaction_id":"C11"}'::jsonb
    ),
    (
      'a1200012-0000-4000-8000-000000000033',
      '${IDS.company}', '${IDS.caseId}', '${IDS.runRestrict}',
      'gate-overdue', 'awaited_release', 'event_received', 'waiting', false,
      '[]'::jsonb, '{"due_at":"2020-01-01T00:00:00.000Z","source_interaction_id":"C11"}'::jsonb
    );
    insert into public.readiness_decision_record (
      id, tenant_id, case_id, run_id, role_runtime_session_id,
      readiness_state, reason, reentry_target, manual_review_required,
      source_trace, metadata
    ) values (
      'a1200012-0000-4000-8000-000000000034',
      '${IDS.company}', '${IDS.caseId}', '${IDS.runRestrict}', '${IDS.session}',
      'ready_with_flags', 'point12-opval-reentry', 'B2', true,
      '[]'::jsonb,
      '{"source_interaction_id":"C16","review_reason":"needs_manual_review"}'::jsonb
    );
  `);
}

async function seedScenarioBlocked(rules) {
  await clearRunCausal(IDS.runBlocked);
  await clearRunP3(IDS.runBlocked);
  for (const code of CAUSALS) {
    if (code === "C05") {
      await publishOpenTriggered(IDS.runBlocked, code);
    } else {
      await publishClosedNotTriggered(IDS.runBlocked, code, rules);
    }
  }
}

async function seedScenarioNotEvaluable(rules) {
  await clearRunCausal(IDS.runNotEval);
  await clearRunP3(IDS.runNotEval);
  for (const code of CAUSALS.slice(0, 5)) {
    await publishClosedNotTriggered(IDS.runNotEval, code, rules);
  }
}

async function clearRunCausal(runId) {
  runSql(`
    delete from public.runtime_run_control_snapshots where activity_runtime_run_id = '${runId}';
    delete from public.runtime_causal_evaluations where activity_runtime_run_id = '${runId}';
  `);
}

async function clearRunP3(runId) {
  runSql(`
    delete from public.readiness_gap_record where run_id = '${runId}';
    delete from public.process_state_timer_event where run_id = '${runId}';
    delete from public.readiness_decision_record where run_id = '${runId}';
  `);
}

async function publishClosedNotTriggered(runId, causalCode, rules) {
  const evalId = await insertValidatedEvaluation(runId, causalCode, {
    closure_state: "not_triggered_with_evidence",
    activation_state: "not-triggered-with-evidence",
    canonical_route_closed: true,
    evidence_complete: true,
  });
  await insertEvidence(evalId, "non_activation", `non-activation:${causalCode}`);
  // C13 explicit_state_only: no variable resolutions required for this state.
  if (causalCode !== "C13") {
    // not required for not_triggered, skip resolutions
  }
  void rules;
  const { error } = await admin.rpc("publish_runtime_causal_evaluation", {
    p_evaluation_id: evalId,
    p_publisher: "point12-opval",
  });
  if (error) {
    throw new Error(`publish_${causalCode}_failed:${error.message}`);
  }
}

async function publishOpenTriggered(runId, causalCode) {
  const evalId = await insertValidatedEvaluation(runId, causalCode, {
    closure_state: "triggered_unanswered",
    activation_state: "triggered",
    canonical_route_closed: false,
    evidence_complete: false,
  });
  await insertEvidence(evalId, "activation", `activation:${causalCode}`);
  const { error } = await admin.rpc("publish_runtime_causal_evaluation", {
    p_evaluation_id: evalId,
    p_publisher: "point12-opval",
  });
  if (error) {
    throw new Error(`publish_open_${causalCode}_failed:${error.message}`);
  }
}

async function insertValidatedEvaluation(runId, causalCode, fields) {
  const { data, error } = await admin
    .from("runtime_causal_evaluations")
    .insert({
      activity_runtime_run_id: runId,
      catalog_version_id: CATALOG,
      causal_definition_id: causalCode,
      causal_code: causalCode,
      evaluation_version: 1,
      lifecycle_state: "validated",
      closure_state: fields.closure_state,
      activation_state: fields.activation_state,
      blocking_state: "none",
      canonical_route_closed: fields.canonical_route_closed,
      evidence_complete: fields.evidence_complete,
      blocks_full_readiness_factually: false,
      computed_at: new Date().toISOString(),
      computed_by: "point12-opval",
      validated_at: new Date().toISOString(),
      validated_by: "point12-opval",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`insert_eval_${causalCode}:${error?.message ?? "missing"}`);
  }
  return data.id;
}

async function insertEvidence(evalId, kind, reference) {
  const { error } = await admin
    .from("runtime_causal_evaluation_evidence_links")
    .insert({
      causal_evaluation_id: evalId,
      evidence_kind: kind,
      evidence_reference: reference,
      created_by: "point12-opval",
      enabled: true,
    });
  if (error) throw new Error(`evidence_${kind}:${error.message}`);
}

async function loadRules() {
  const { data, error } = await admin
    .from("runtime_causal_required_variable_rules")
    .select("*")
    .eq("catalog_version_id", CATALOG)
    .eq("enabled", true);
  if (error) throw error;
  return data ?? [];
}

async function validateAbIsolation(userA, userB) {
  const anon = env.anonKey;
  const tokenA = await passwordGrant(EMAIL_A, env.password, anon);
  const tokenB = await passwordGrant(EMAIL_B, env.password, anon);

  const clientA = createClient(env.supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${tokenA}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const clientB = createClient(env.supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${tokenB}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: evalsA, error: errA } = await clientA
    .from("runtime_causal_evaluations")
    .select("id")
    .eq("activity_runtime_run_id", IDS.runReady)
    .eq("lifecycle_state", "effective");
  if (errA) throw new Error(`ab_a_eval:${errA.message}`);

  const { data: evalsB, error: errB } = await clientB
    .from("runtime_causal_evaluations")
    .select("id")
    .eq("activity_runtime_run_id", IDS.runReady)
    .eq("lifecycle_state", "effective");
  if (errB) throw new Error(`ab_b_eval:${errB.message}`);

  const { data: snapA } = await clientA
    .from("runtime_run_control_snapshots")
    .select("id")
    .eq("activity_runtime_run_id", IDS.runReady)
    .eq("lifecycle_state", "effective");
  const { data: snapB } = await clientB
    .from("runtime_run_control_snapshots")
    .select("id")
    .eq("activity_runtime_run_id", IDS.runReady)
    .eq("lifecycle_state", "effective");

  const { data: gapsA } = await clientA
    .from("readiness_gap_record")
    .select("id")
    .eq("run_id", IDS.runRestrict);
  const { data: gapsB } = await clientB
    .from("readiness_gap_record")
    .select("id")
    .eq("run_id", IDS.runRestrict);
  const { data: runsA } = await clientA
    .from("activity_runtime_run")
    .select("id")
    .eq("id", IDS.runReady);
  const { data: runsB } = await clientB
    .from("activity_runtime_run")
    .select("id")
    .eq("id", IDS.runReady);

  const { error: mutErr } = await clientA.from("runtime_causal_evaluations").insert({
    activity_runtime_run_id: IDS.runReady,
    catalog_version_id: CATALOG,
    causal_code: "C01",
    evaluation_version: 99,
    lifecycle_state: "computed",
  });

  const { error: mutSnap } = await clientA.rpc(
    "compute_and_publish_runtime_control_snapshot",
    {
      p_activity_runtime_run_id: IDS.runReady,
      p_publisher: "unauthorized-consultant",
    },
  );

  return {
    consultantA: {
      userId: userA,
      effectiveEvals: evalsA?.length ?? 0,
      snapshots: snapA?.length ?? 0,
      gaps: gapsA?.length ?? 0,
      runs: runsA?.length ?? 0,
    },
    consultantB: {
      userId: userB,
      effectiveEvals: evalsB?.length ?? 0,
      snapshots: snapB?.length ?? 0,
      gaps: gapsB?.length ?? 0,
      runs: runsB?.length ?? 0,
    },
    authenticatedMutationBlocked: Boolean(mutErr),
    snapshotRpcBlockedForAuthenticated: Boolean(mutSnap),
    pass:
      (evalsA?.length ?? 0) === 20 &&
      (evalsB?.length ?? 0) === 0 &&
      (snapA?.length ?? 0) === 1 &&
      (snapB?.length ?? 0) === 0 &&
      (gapsA?.length ?? 0) >= 1 &&
      (gapsB?.length ?? 0) === 0 &&
      (runsA?.length ?? 0) === 1 &&
      (runsB?.length ?? 0) === 0 &&
      Boolean(mutErr) &&
      Boolean(mutSnap),
  };
}

async function passwordGrant(email, password, anonKey) {
  const res = await fetch(
    `${env.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) throw new Error(`password_grant_failed:${email}`);
  const body = await res.json();
  if (!body.access_token) throw new Error(`password_grant_no_token:${email}`);
  return body.access_token;
}

async function ensureUser(email, password) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw new Error(`list_users:${listError.message}`);
  const existing = listed.users.find((u) => u.email === email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`update_user:${error.message}`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`create_user:${error?.message}`);
  return data.user.id;
}

function buildStructureSql(userA, userB) {
  return `
begin;

insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa Point12 OpVal')
on conflict (id) do update set nombre = excluded.nombre;

-- Participant is a case user identity, NOT the consultant.
-- Consultant access must come from assignment → case → profile/session → run (RLS 190300).
update public.usuarios
set auth_user_id = null
where id = '${IDS.usuario}'
   or auth_user_id = '${userA}';

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'point12-opval-participant@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values
  ('${IDS.assignA}', '${userA}', '${IDS.company}', 'enabled', now() - interval '1 day', null, '${userA}')
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_from = excluded.valid_from,
  valid_until = null;

-- Consultant B: no assignment to this company (isolation). Ensure any prior assignment disabled.
update public.consultant_company_assignments
set status = 'disabled', valid_until = now()
where consultant_user_id = '${userB}'
  and client_company_id = '${IDS.company}';

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación Point12 OpVal', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso Point12 OpVal'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name,
  estado_actual = excluded.estado_actual;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.usuario}', 'Participante OpVal',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set
  display_label = excluded.display_label,
  enabled = true,
  participation_status = 'active';

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values (
  '${IDS.profile}', '${IDS.participant}', 'Perfil funcional OpVal', 'resolved',
  now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set
  display_label = excluded.display_label,
  enabled = true,
  resolution_status = 'resolved';

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values (
  '${IDS.session}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
  'active', '[]'::jsonb, '{"label":"Sesión OpVal"}'::jsonb,
  4, 0
)
on conflict (id) do update set
  state = 'active',
  case_id = excluded.case_id,
  tenant_id = excluded.tenant_id,
  selected_primary_activity_count = 4,
  secondary_activity_count = 0;

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values (
  '${IDS.link}', '${IDS.profile}', '${IDS.session}',
  'confirmed', true, now() - interval '1 day', null, '${userA}', 'point12-opval'
)
on conflict (id) do update set
  link_status = 'confirmed',
  enabled = true,
  valid_until = null;

-- One effective selection per session
update public.activity_selection_results
set lifecycle_state = 'superseded',
    superseded_at = coalesce(superseded_at, now())
where role_runtime_session_id = '${IDS.session}'
  and lifecycle_state = 'effective'
  and id <> '${IDS.selection}';

-- If our selection is already effective with items, leave immutable rows alone.
-- Otherwise (re)build as computed → items → effective.
do $$
declare
  v_state text;
  v_items int;
begin
  select lifecycle_state into v_state
  from public.activity_selection_results
  where id = '${IDS.selection}';

  select count(*) into v_items
  from public.activity_selection_result_items
  where result_id = '${IDS.selection}';

  if v_state = 'effective' and v_items = 4 then
    return;
  end if;

  if v_state = 'effective' then
    update public.activity_selection_results
    set lifecycle_state = 'superseded',
        superseded_at = coalesce(superseded_at, now())
    where id = '${IDS.selection}';
  end if;

  insert into public.activity_selection_results (
    id, case_id, participant_id, profile_id, role_runtime_session_id,
    policy_code, policy_version, source_snapshot_reference, source_snapshot_hash,
    result_version, lifecycle_state, selection_mode,
    eligible_count, selected_count, non_primary_context_count,
    workmap_coverage_gap, computed_at, computed_by,
    validated_at, validated_by
  ) values (
    '${IDS.selection}', '${IDS.caseId}', '${IDS.participant}', '${IDS.profile}', '${IDS.session}',
    'PRIMARY_ACTIVITY_SELECTION', 'PRIMARY_ACTIVITY_SELECTION_V1_3',
    'point12-opval-snapshot', 'point12-opval-hash',
    1, 'computed', 'non_competitive_inclusion',
    4, 4, 0, false, now(), '${userA}',
    now(), '${userA}'
  )
  on conflict (id) do update set
    lifecycle_state = 'computed',
    selection_mode = 'non_competitive_inclusion',
    eligible_count = 4,
    selected_count = 4,
    validated_at = now(),
    validated_by = '${userA}',
    effective_from = null,
    published_by = null,
    superseded_at = null,
    superseded_by = null;

  delete from public.activity_selection_result_items where result_id = '${IDS.selection}';
  insert into public.activity_selection_result_items (
    result_id, activity_id, display_label, classification, selected_slot, selection_reason_code
  ) values
    ('${IDS.selection}', '${IDS.activityReady}', 'Actividad Ready', 'primary', 1, 'opval'),
    ('${IDS.selection}', '${IDS.activityRestrict}', 'Actividad Restricciones', 'primary', 2, 'opval'),
    ('${IDS.selection}', '${IDS.activityBlocked}', 'Actividad Bloqueada', 'primary', 3, 'opval'),
    ('${IDS.selection}', '${IDS.activityNotEval}', 'Actividad No Evaluable', 'primary', 4, 'opval');

  update public.activity_selection_results
  set lifecycle_state = 'effective',
      effective_from = now(),
      published_by = '${userA}',
      validated_at = now(),
      validated_by = '${userA}'
  where id = '${IDS.selection}';
end $$;

insert into public.activity_runtime_run (
  id, tenant_id, case_id, activity_id, role_runtime_session_id,
  catalog_version_id, state, base_visible_count, causal_visible_count,
  source_trace, metadata
) values
  ('${IDS.runReady}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityReady}', '${IDS.session}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb, '{"scenario":"ready"}'::jsonb),
  ('${IDS.runRestrict}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityRestrict}', '${IDS.session}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb, '{"scenario":"ready_with_restrictions"}'::jsonb),
  ('${IDS.runBlocked}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityBlocked}', '${IDS.session}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb, '{"scenario":"blocked"}'::jsonb),
  ('${IDS.runNotEval}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityNotEval}', '${IDS.session}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb, '{"scenario":"not_evaluable"}'::jsonb)
on conflict (id) do update set
  activity_id = excluded.activity_id,
  state = excluded.state,
  metadata = excluded.metadata;

commit;
`;
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
  let supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const password =
    process.env.EVE_POINT12_OPVAL_PASSWORD ||
    process.env.EVE_UNIT2B_TEST_PASSWORD ||
    "";

  if (!serviceRoleKey || !anonKey) {
    const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      cwd: projectRoot,
      encoding: "utf8",
      shell: true,
    });
    const out = `${status.stdout || ""}\n${status.stderr || ""}`;
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^(SERVICE_ROLE_KEY|ANON_KEY|API_URL)=(.*)$/);
      if (!m) continue;
      const val = m[2].replace(/^"|"$/g, "");
      if (m[1] === "SERVICE_ROLE_KEY" && !serviceRoleKey) serviceRoleKey = val;
      if (m[1] === "ANON_KEY" && !anonKey) anonKey = val;
      if (m[1] === "API_URL") supabaseUrl = val;
    }
  }

  if (!password) throw new Error("missing_EVE_UNIT2B_TEST_PASSWORD");
  if (!serviceRoleKey) throw new Error("missing_SUPABASE_SERVICE_ROLE_KEY");
  if (!anonKey) throw new Error("missing_ANON_KEY");
  return { supabaseUrl, anonKey, serviceRoleKey, password };
}

function loadEnvLocal() {
  const envPath = resolve(projectRoot, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function assertLocal(url) {
  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") {
    throw new Error(`remote_supabase_forbidden:${host}`);
  }
}
