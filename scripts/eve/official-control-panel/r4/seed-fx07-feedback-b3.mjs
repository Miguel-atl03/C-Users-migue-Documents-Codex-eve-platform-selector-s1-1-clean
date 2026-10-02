#!/usr/bin/env node
/**
 * FX-07 — Feedback B3 (test-only).
 * C09 abierta + receiver_feedback variables required/unresolved (separated from satisfaction).
 */
import {
  EMAIL_ADMIN,
  EMAIL_CONSULTANT_A,
  assertLocal,
  assertNotAmber,
  createAdminClient,
  ensureUser,
  mustGrant,
  mustRpc,
  r4Id,
  resolveEnv,
  runSql,
  trackingUrl,
} from "./r4-seed-lib.mjs";

const FX = 7;
const EMAIL_OPERATIVE = "r4-fx07-operative@example.invalid";
/** Must match effective causal catalog seeded by point-12 migrations. */
const CATALOG = "point12-catalog-v1";
const CAUSALS = Array.from({ length: 20 }, (_, i) =>
  `C${String(i + 1).padStart(2, "0")}`,
);

const IDS = {
  company: r4Id(FX, 0, 1),
  relationship: r4Id(FX, 0, 2),
  caseId: r4Id(FX, 0, 3),
  usuario: r4Id(FX, 0, 4),
  assignA: r4Id(FX, 0, 11),
  participant: r4Id(FX, 0, 5),
  profile: r4Id(FX, 0, 6),
  session: r4Id(FX, 0, 7),
  link: r4Id(FX, 0, 8),
  catalogUuid: r4Id(FX, 0, 9),
  activity: r4Id(FX, 3, 1),
  run: r4Id(FX, 4, 1),
};

const RECEIVER_FEEDBACK_VARS = [
  "receiver_feedback_exists",
  "receiver_feedback",
  "receiver_feedback_gap_flag",
];

export async function provisionFx07(ctx) {
  const env = ctx?.env ?? resolveEnv();
  const admin = ctx?.admin ?? createAdminClient(env);
  assertLocal(env.supabaseUrl);
  assertNotAmber(IDS.company, IDS.caseId);

  const userA = await ensureUser(admin, EMAIL_CONSULTANT_A, env.password);
  const userAdmin = await ensureUser(admin, EMAIL_ADMIN, env.password);
  const operativeUser = await ensureUser(admin, EMAIL_OPERATIVE, env.password);
  runSql(buildStructureSql(userA, operativeUser));
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "view_experience_state",
    "r4_fx07_view",
  );

  runSql(`
begin;
delete from public.runtime_run_control_snapshots where activity_runtime_run_id = '${IDS.run}';
delete from public.runtime_causal_variable_resolutions
 where causal_evaluation_id in (
   select id from public.runtime_causal_evaluations
   where activity_runtime_run_id = '${IDS.run}'
 );
delete from public.runtime_causal_evaluations where activity_runtime_run_id = '${IDS.run}';
commit;
`);

  let c09EvalId = null;
  for (const code of CAUSALS) {
    if (code === "C09") {
      c09EvalId = await publishOpenC09(admin, IDS.run);
    } else {
      await publishClosed(admin, IDS.run, code);
    }
  }

  if (!c09EvalId) throw new Error("c09_eval_missing");

  for (const variableCode of RECEIVER_FEEDBACK_VARS) {
    const { error } = await admin
      .from("runtime_causal_variable_resolutions")
      .insert({
        causal_evaluation_id: c09EvalId,
        variable_code: variableCode,
        resolution_state: "unresolved",
        evidence_reference: `r4://fx07/${variableCode}`,
      });
    if (error) {
      throw new Error(`receiver_feedback_var_${variableCode}:${error.message}`);
    }
  }

  const snapshot = await mustRpc(
    admin,
    "compute_and_publish_runtime_control_snapshot",
    {
      p_activity_runtime_run_id: IDS.run,
      p_publisher: "r4_fx07_seed",
    },
  );

  return {
    ok: true,
    fixture: "FX-07",
    title: "Feedback B3",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    roleRuntimeSessionId: IDS.session,
    activityId: IDS.activity,
    runId: IDS.run,
    openCausalCode: "C09",
    c09EvaluationId: c09EvalId,
    receiverFeedbackVariables: RECEIVER_FEEDBACK_VARS,
    satisfactionSeparated: true,
    expectedCatalogFailureRule:
      "receiver_feedback_route_missing / blocked_by_missing_canonical_route",
    snapshotReadiness: snapshot?.readiness_state ?? null,
    consultants: { a: { email: EMAIL_CONSULTANT_A, userId: userA } },
    operative: { email: EMAIL_OPERATIVE, authUserId: operativeUser },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
      view: "monitoring",
    }),
    relatedCriteria: ["CP-010"],
    notes: [
      "C09 open with receiver_feedback_* variables unresolved.",
      "No satisfaction_general used to infer receiver_feedback.",
    ],
  };
}

async function publishClosed(admin, runId, causalCode) {
  const evalId = await insertValidated(admin, runId, causalCode, {
    closure_state: "not_triggered_with_evidence",
    activation_state: "not-triggered-with-evidence",
    canonical_route_closed: true,
    evidence_complete: true,
  });
  await insertEvidence(admin, evalId, "non_activation", `non-activation:${causalCode}`);
  await mustRpc(admin, "publish_runtime_causal_evaluation", {
    p_evaluation_id: evalId,
    p_publisher: "r4_fx07_seed",
  });
}

async function publishOpenC09(admin, runId) {
  const evalId = await insertValidated(admin, runId, "C09", {
    closure_state: "triggered_unanswered",
    activation_state: "triggered",
    canonical_route_closed: false,
    evidence_complete: false,
  });
  await insertEvidence(
    admin,
    evalId,
    "activation",
    "activation:C09:receiver_feedback_signal_open",
  );
  const published = await mustRpc(admin, "publish_runtime_causal_evaluation", {
    p_evaluation_id: evalId,
    p_publisher: "r4_fx07_seed",
  });
  return published?.id ?? evalId;
}

async function insertValidated(admin, runId, causalCode, fields) {
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
      blocking_state: fields.canonical_route_closed ? "none" : "blocked",
      canonical_route_closed: fields.canonical_route_closed,
      evidence_complete: fields.evidence_complete,
      blocks_full_readiness_factually: !fields.canonical_route_closed,
      computed_at: new Date().toISOString(),
      computed_by: "r4_fx07_seed",
      validated_at: new Date().toISOString(),
      validated_by: "r4_fx07_seed",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`insert_eval_${causalCode}:${error?.message ?? "missing"}`);
  }
  return data.id;
}

async function insertEvidence(admin, evalId, kind, reference) {
  const { error } = await admin
    .from("runtime_causal_evaluation_evidence_links")
    .insert({
      causal_evaluation_id: evalId,
      evidence_kind: kind,
      evidence_reference: reference,
      created_by: "r4_fx07_seed",
      enabled: true,
    });
  if (error) throw new Error(`evidence_${kind}:${error.message}`);
}

function buildStructureSql(userA, operativeUser) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-07 Feedback B3')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', '${EMAIL_OPERATIVE}', '${operativeUser}'
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = excluded.auth_user_id;

insert into public.consultant_company_assignments (
  id, consultant_user_id, client_company_id, status, valid_from, valid_until, created_by
) values (
  '${IDS.assignA}', '${userA}', '${IDS.company}', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled', valid_until = null;

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-07', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-07 Feedback B3'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.usuario}', 'Participante FX-07',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values (
  '${IDS.profile}', '${IDS.participant}', 'Perfil FX-07', 'resolved',
  now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values (
  '${IDS.session}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
  'active', '[]'::jsonb, '{"label":"Sesión FX-07"}'::jsonb, 1, 0
)
on conflict (id) do update set state = 'active';

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values (
  '${IDS.link}', '${IDS.profile}', '${IDS.session}',
  'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx07'
)
on conflict (id) do update set link_status = 'confirmed', enabled = true;

insert into public.activity_runtime_run (
  id, tenant_id, case_id, activity_id, role_runtime_session_id,
  catalog_version_id, state, base_visible_count, causal_visible_count,
  source_trace, metadata
) values (
  '${IDS.run}', '${IDS.company}', '${IDS.caseId}', '${IDS.activity}', '${IDS.session}',
  '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb,
  '{"scenario":"c09_receiver_feedback","r4":"FX-07"}'::jsonb
)
on conflict (id) do update set metadata = excluded.metadata;

commit;
`;
}
