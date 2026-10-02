#!/usr/bin/env node
/**
 * FX-05 — WorkMap coverage gap (test-only).
 * Usuario detenido antes de Significado + resultado de selección vigente con
 * workmap_coverage_gap=true vía publish RPC oficial.
 */
import { randomUUID } from "node:crypto";
import {
  EMAIL_ADMIN,
  EMAIL_CONSULTANT_A,
  EMAIL_CONSULTANT_B,
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

const FX = 5;
const IDS = {
  company: r4Id(FX, 0, 1),
  relationship: r4Id(FX, 0, 2),
  caseId: r4Id(FX, 0, 3),
  usuario: r4Id(FX, 0, 4),
  participantUser: r4Id(FX, 0, 5),
  assignA: r4Id(FX, 0, 11),
  participant: r4Id(FX, 0, 12),
  profile: r4Id(FX, 0, 13),
  session: r4Id(FX, 0, 14),
  link: r4Id(FX, 0, 15),
  catalogUuid: r4Id(FX, 0, 16),
  selection: r4Id(FX, 0, 17),
  activity: r4Id(FX, 3, 1),
};

export async function provisionFx05(ctx) {
  const env = ctx?.env ?? resolveEnv();
  const admin = ctx?.admin ?? createAdminClient(env);
  assertLocal(env.supabaseUrl);
  assertNotAmber(IDS.company, IDS.caseId);

  const userA = await ensureUser(admin, EMAIL_CONSULTANT_A, env.password);
  const userB = await ensureUser(admin, EMAIL_CONSULTANT_B, env.password);
  const userAdmin = await ensureUser(admin, EMAIL_ADMIN, env.password);
  runSql(buildStructureSql(userA));
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "view_experience_state",
    "r4_fx05_view",
  );
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "send_support_message",
    "r4_fx05_send",
  );
  // Consultant B exists but is NOT assigned to Case A company (negative isolation).

  runSql(`
begin;
set local session_replication_role = replica;
delete from public.experience_screen_event where company_id = '${IDS.company}';
delete from public.experience_support_action where company_id = '${IDS.company}';
set local session_replication_role = DEFAULT;
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

  const sessionRef = `sess://r4-fx05/${IDS.participantUser}`;
  // Stop before Significado: complete early screens, abandon on workmap,
  // never complete significado.
  const steps = [
    ["login_demo", "screen_entered"],
    ["login_demo", "screen_completed"],
    ["estado_a", "screen_entered"],
    ["estado_a", "screen_completed"],
    ["workmap", "screen_entered"],
    ["workmap", "screen_abandoned"],
  ];
  for (const [screen, event] of steps) {
    await mustRpc(admin, "eve_record_experience_screen_event", {
      p_company_id: IDS.company,
      p_case_id: IDS.caseId,
      p_user_id: IDS.participantUser,
      p_screen_key: screen,
      p_event_type: event,
      p_request_id: randomUUID(),
      p_session_reference: sessionRef,
      p_actor_label: "r4_fx05_seed",
    });
  }

  return {
    ok: true,
    fixture: "FX-05",
    title: "WorkMap coverage gap",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    roleRuntimeSessionId: IDS.session,
    selectionResultId: IDS.selection,
    participantUserId: IDS.participantUser,
    workmapCoverageGap: true,
    stoppedBeforeScreen: "significado",
    lastScreen: "workmap",
    lastEvent: "screen_abandoned",
    consultants: {
      a: { email: EMAIL_CONSULTANT_A, userId: userA },
      b: {
        email: EMAIL_CONSULTANT_B,
        userId: userB,
        assignedToCompany: false,
      },
    },
    attentionUrl: `/api/eve/official-consultant-control-panel/cases/${IDS.caseId}/monitoring/activity-selection/attention`,
    experienceJourneysUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
      mode: "user-experience-governance",
      view: "journeys",
    }),
    relatedCriteria: ["CP-011", "UX-004"],
    notes: [
      "Experience events via eve_record_experience_screen_event only.",
      "significado never completed — factual pre-Significado stop.",
      "workmap_coverage_gap=true published via eve_validate/eve_publish_activity_selection_result.",
      "Consultant B not assigned — Case A gap must be invisible to B.",
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
  'r4-fx05-workmap-gap-snapshot', 'r4-fx05-workmap-gap-hash',
  1, 'computed', 'non_competitive_inclusion',
  1, 1, 0,
  true, now(), '${userA}',
  null, null
);

insert into public.activity_selection_result_items (
  result_id, activity_id, display_label, classification, selected_slot, selection_reason_code, source_reference
) values (
  '${IDS.selection}', '${IDS.activity}', 'Actividad FX-05 cobertura incompleta',
  'primary', 1, 'r4_fx05_coverage_gap', 'workmap'
);
commit;
`;
}

function buildStructureSql(userA) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-05 WorkMap Gap')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values
  ('${IDS.usuario}', '${IDS.company}', 'r4-fx05-owner@example.invalid', null),
  ('${IDS.participantUser}', '${IDS.company}', 'r4-fx05-operativo@example.invalid', null)
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
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-05', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-05 WorkMap Gap'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.participantUser}', 'Participante FX-05',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true, user_id = excluded.user_id;

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values (
  '${IDS.profile}', '${IDS.participant}', 'Perfil FX-05', 'resolved',
  now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values (
  '${IDS.session}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
  'active', '[]'::jsonb, '{"label":"Sesión FX-05","workmapCoverageGap":true}'::jsonb, 1, 0
)
on conflict (id) do update set state = 'active', metadata = excluded.metadata;

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values (
  '${IDS.link}', '${IDS.profile}', '${IDS.session}',
  'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx05'
)
on conflict (id) do update set link_status = 'confirmed', enabled = true;

commit;
`;
}
