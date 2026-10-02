#!/usr/bin/env node
/**
 * FX-06 — Ruta B2 faltante (test-only).
 * C05 open + readiness_gap/decision with blocked_by_missing_canonical_route literal.
 * Uses publish_runtime_causal_evaluation + compute_and_publish_runtime_control_snapshot.
 */
import { randomUUID } from "node:crypto";
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

const FX = 6;
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
  gap: r4Id(FX, 5, 1),
  decision: r4Id(FX, 5, 2),
  selection: r4Id(FX, 5, 3),
};

export async function provisionFx06(ctx) {
  const env = ctx?.env ?? resolveEnv();
  const admin = ctx?.admin ?? createAdminClient(env);
  assertLocal(env.supabaseUrl);
  assertNotAmber(IDS.company, IDS.caseId);

  const userA = await ensureUser(admin, EMAIL_CONSULTANT_A, env.password);
  const userAdmin = await ensureUser(admin, EMAIL_ADMIN, env.password);
  runSql(buildStructureSql(userA));
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "view_experience_state",
    "r4_fx06_view",
  );

  runSql(`
begin;
delete from public.readiness_decision_record where run_id = '${IDS.run}';
delete from public.readiness_gap_record where run_id = '${IDS.run}';
delete from public.runtime_run_control_snapshots where activity_runtime_run_id = '${IDS.run}';
delete from public.runtime_causal_evaluations where activity_runtime_run_id = '${IDS.run}';
commit;
`);

  runSql(`
begin;
set local session_replication_role = replica;
delete from public.activity_selection_result_items
where result_id in (
  select id from public.activity_selection_results
  where role_runtime_session_id = '${IDS.session}'
);
delete from public.activity_selection_results
where role_runtime_session_id = '${IDS.session}';
set local session_replication_role = DEFAULT;
commit;
`);

  runSql(buildSelectionComputedSql(userA));
  await mustRpc(admin, "eve_validate_activity_selection_result", {
    p_result_id: IDS.selection,
    p_actor: userA,
  });
  await mustRpc(admin, "eve_publish_activity_selection_result", {
    p_result_id: IDS.selection,
    p_actor: userA,
  });

  for (const code of CAUSALS) {
    if (code === "C05") {
      await publishOpenRouteMissing(admin, IDS.run, code);
    } else {
      await publishClosed(admin, IDS.run, code);
    }
  }

  runSql(buildGapAndDecisionSql());

  const snapshot = await mustRpc(
    admin,
    "compute_and_publish_runtime_control_snapshot",
    {
      p_activity_runtime_run_id: IDS.run,
      p_publisher: "r4_fx06_seed",
    },
  );

  return {
    ok: true,
    fixture: "FX-06",
    title: "Ruta B2 faltante",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    roleRuntimeSessionId: IDS.session,
    activityId: IDS.activity,
    runId: IDS.run,
    gapId: IDS.gap,
    decisionId: IDS.decision,
    openCausalCode: "C05",
    openClosureState: "triggered_unanswered",
    expectedCanonicalState: "blocked_by_missing_canonical_route",
    expectedCatalogFailureRule:
      "transformation_exception_route_unresolved / blocked_by_missing_canonical_route",
    expectedRelatedFlags: [
      "transformation_exception_exists",
      "transformation_exception_route_unresolved",
      "blocked_by_missing_canonical_route",
    ],
    expectedReentryTarget: "B2",
    snapshotReadiness: snapshot?.readiness_state ?? null,
    controlStateUrl:
      `/api/eve/official-consultant-control-panel/cases/${IDS.caseId}` +
      `/participants/${IDS.participant}/profiles/${IDS.profile}` +
      `/sessions/${IDS.session}/activities/${IDS.activity}/runs/${IDS.run}` +
      `/runtime/control-state`,
    consultants: { a: { email: EMAIL_CONSULTANT_A, userId: userA } },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
      view: "monitoring",
    }),
    relatedCriteria: ["CP-010"],
    notes: [
      "C05 published with closure_state=triggered_unanswered and canonical_route_closed=false.",
      "readiness_gap_record.gap_type and readiness_decision_record.readiness_state carry literal blocked_by_missing_canonical_route.",
      "Effective activity selection published so control-state BFF can authorize the primary activity.",
      "Snapshot readiness remains blocked|ready|…; Panel control-state projects the literal via gaps + catalog.",
    ],
    productGaps: [],
  };
}

function buildSelectionComputedSql(userA) {
  return `
begin;
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
  'r4-fx06-b2-snapshot', 'r4-fx06-b2-hash',
  1, 'computed', 'non_competitive_inclusion',
  1, 1, 0,
  false, now(), '${userA}',
  null, null
);

insert into public.activity_selection_result_items (
  result_id, activity_id, display_label, classification, selected_slot, selection_reason_code, source_reference
) values (
  '${IDS.selection}', '${IDS.activity}', 'Actividad FX-06 ruta B2 faltante',
  'primary', 1, 'r4_fx06_primary', 'workmap'
);
commit;
`;
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
    p_publisher: "r4_fx06_seed",
  });
}

async function publishOpenRouteMissing(admin, runId, causalCode) {
  const evalId = await insertValidated(admin, runId, causalCode, {
    closure_state: "triggered_unanswered",
    activation_state: "triggered",
    canonical_route_closed: false,
    evidence_complete: false,
  });
  await insertEvidence(
    admin,
    evalId,
    "activation",
    "activation:C05:transformation_exception_exists",
  );
  await mustRpc(admin, "publish_runtime_causal_evaluation", {
    p_evaluation_id: evalId,
    p_publisher: "r4_fx06_seed",
  });
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
      computed_by: "r4_fx06_seed",
      validated_at: new Date().toISOString(),
      validated_by: "r4_fx06_seed",
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
      created_by: "r4_fx06_seed",
      enabled: true,
    });
  if (error) throw new Error(`evidence_${kind}:${error.message}`);
}

function buildGapAndDecisionSql() {
  const corr = randomUUID();
  return `
begin;
insert into public.readiness_gap_record (
  id, tenant_id, case_id, role_id, activity_id, run_id,
  gap_type, affected_route, affected_quadrant, severity,
  reentry_target, manual_review_flag, status,
  correlation_id, idempotency_key, source_trace, metadata
) values (
  '${IDS.gap}', '${IDS.company}', '${IDS.caseId}', '${IDS.session}', '${IDS.activity}', '${IDS.run}',
  'blocked_by_missing_canonical_route', 'C05', 'None', 'blocking',
  'B2', false, 'open',
  '${corr}', 'r4-fx06-gap-b2',
  '[{"stage":"r4_fx06_seed"}]'::jsonb,
  '{"scenario":"missing_b2_route","flags":["transformation_exception_exists","transformation_exception_route_unresolved"]}'::jsonb
)
on conflict (id) do update set
  gap_type = excluded.gap_type,
  status = 'open',
  reentry_target = excluded.reentry_target,
  affected_route = excluded.affected_route;

insert into public.readiness_decision_record (
  id, tenant_id, case_id, role_id, activity_id, run_id, role_runtime_session_id,
  readiness_state, dominant_gate, reason, reentry_target, manual_review_required,
  correlation_id, idempotency_key, source_trace, metadata
) values (
  '${IDS.decision}', '${IDS.company}', '${IDS.caseId}', '${IDS.session}', '${IDS.activity}', '${IDS.run}', '${IDS.session}',
  'blocked_by_missing_canonical_route', 'C05',
  'transformation_exception_route_unresolved / blocked_by_missing_canonical_route',
  'B2', false,
  '${corr}', 'r4-fx06-decision-b2',
  '[{"stage":"r4_fx06_seed"}]'::jsonb,
  '{"scenario":"missing_b2_route"}'::jsonb
)
on conflict (id) do update set
  readiness_state = excluded.readiness_state,
  reentry_target = excluded.reentry_target,
  reason = excluded.reason;
commit;
`;
}

function buildStructureSql(userA) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-06 Ruta B2')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'r4-fx06-participant@example.invalid', null
)
on conflict (id) do update set empresa_id = excluded.empresa_id, email = excluded.email;

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
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-06', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-06 Ruta B2 faltante'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.usuario}', 'Participante FX-06',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values (
  '${IDS.profile}', '${IDS.participant}', 'Perfil FX-06', 'resolved',
  now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values (
  '${IDS.session}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
  'active', '[]'::jsonb, '{"label":"Sesión FX-06"}'::jsonb, 1, 0
)
on conflict (id) do update set state = 'active';

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values (
  '${IDS.link}', '${IDS.profile}', '${IDS.session}',
  'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx06'
)
on conflict (id) do update set link_status = 'confirmed', enabled = true;

insert into public.activity_runtime_run (
  id, tenant_id, case_id, activity_id, role_runtime_session_id,
  catalog_version_id, state, base_visible_count, causal_visible_count,
  source_trace, metadata
) values (
  '${IDS.run}', '${IDS.company}', '${IDS.caseId}', '${IDS.activity}', '${IDS.session}',
  '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb,
  '{"scenario":"missing_b2_route","r4":"FX-06"}'::jsonb
)
on conflict (id) do update set metadata = excluded.metadata;

commit;
`;
}
