#!/usr/bin/env node
/**
 * FX-02 — Usuario multirrol (test-only).
 * 1 physical user, 2 role_runtime_session, separate activities/runs.
 */
import {
  EMAIL_ADMIN,
  EMAIL_CONSULTANT_A,
  assertLocal,
  assertNotAmber,
  createAdminClient,
  ensureUser,
  mustGrant,
  r4Id,
  resolveEnv,
  runSql,
  trackingUrl,
} from "./r4-seed-lib.mjs";

const FX = 2;
const IDS = {
  company: r4Id(FX, 0, 1),
  relationship: r4Id(FX, 0, 2),
  caseId: r4Id(FX, 0, 3),
  usuario: r4Id(FX, 0, 4),
  assignA: r4Id(FX, 0, 11),
  participant: r4Id(FX, 0, 5),
  profileA: r4Id(FX, 0, 6),
  profileB: r4Id(FX, 0, 7),
  sessionA: r4Id(FX, 0, 8),
  sessionB: r4Id(FX, 0, 9),
  linkA: r4Id(FX, 0, 10),
  linkB: r4Id(FX, 0, 12),
  catalogUuid: r4Id(FX, 0, 13),
  activityA: r4Id(FX, 3, 1),
  activityB: r4Id(FX, 3, 2),
  runA: r4Id(FX, 4, 1),
  runB: r4Id(FX, 4, 2),
};

export async function provisionFx02(ctx) {
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
    "r4_fx02_view",
  );

  return {
    ok: true,
    fixture: "FX-02",
    title: "Usuario multirrol",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    physicalUsuarioId: IDS.usuario,
    participantId: IDS.participant,
    profiles: {
      a: { id: IDS.profileA, label: "Rol funcional A" },
      b: { id: IDS.profileB, label: "Rol funcional B" },
    },
    roleRuntimeSessions: {
      a: {
        id: IDS.sessionA,
        activityId: IDS.activityA,
        runId: IDS.runA,
      },
      b: {
        id: IDS.sessionB,
        activityId: IDS.activityB,
        runId: IDS.runB,
      },
    },
    consultants: { a: { email: EMAIL_CONSULTANT_A, userId: userA } },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
      view: "monitoring",
    }),
    relatedCriteria: ["CP-007", "CP-008"],
    notes: [
      "Same physical user_id; two role_runtime_session with distinct activities/runs.",
      "Assert no fusion of sessions/activities under same userId.",
    ],
  };
}

function buildStructureSql(userA) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-02 Multirrol')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'r4-fx02-multirole@example.invalid', null
)
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  email = excluded.email,
  auth_user_id = null;

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
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-02', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-02 Multirrol'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.usuario}', 'Participante multirrol',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true, participation_status = 'active';

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values
  ('${IDS.profileA}', '${IDS.participant}', 'Rol funcional A', 'resolved',
   now() - interval '1 day', true, '${userA}'),
  ('${IDS.profileB}', '${IDS.participant}', 'Rol funcional B', 'resolved',
   now() - interval '1 day', true, '${userA}')
on conflict (id) do update set enabled = true, display_label = excluded.display_label;

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values
  ('${IDS.sessionA}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
   'active', '[]'::jsonb, '{"label":"Sesión rol A","r4":"FX-02"}'::jsonb, 1, 0),
  ('${IDS.sessionB}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
   'active', '[]'::jsonb, '{"label":"Sesión rol B","r4":"FX-02"}'::jsonb, 1, 0)
on conflict (id) do update set state = 'active', metadata = excluded.metadata;

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values
  ('${IDS.linkA}', '${IDS.profileA}', '${IDS.sessionA}',
   'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx02'),
  ('${IDS.linkB}', '${IDS.profileB}', '${IDS.sessionB}',
   'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx02')
on conflict (id) do update set link_status = 'confirmed', enabled = true;

insert into public.activity_runtime_run (
  id, tenant_id, case_id, activity_id, role_runtime_session_id,
  catalog_version_id, state, base_visible_count, causal_visible_count,
  source_trace, metadata
) values
  ('${IDS.runA}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityA}', '${IDS.sessionA}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb,
   '{"label":"Run rol A","r4":"FX-02"}'::jsonb),
  ('${IDS.runB}', '${IDS.company}', '${IDS.caseId}', '${IDS.activityB}', '${IDS.sessionB}',
   '${IDS.catalogUuid}', 'active_causal_capture', 0, 0, '[]'::jsonb,
   '{"label":"Run rol B","r4":"FX-02"}'::jsonb)
on conflict (id) do update set
  activity_id = excluded.activity_id,
  role_runtime_session_id = excluded.role_runtime_session_id,
  metadata = excluded.metadata;

commit;
`;
}
