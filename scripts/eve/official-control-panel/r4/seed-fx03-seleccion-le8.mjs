#!/usr/bin/env node
/**
 * FX-03 — Selección <=8 (test-only).
 * Prepares eligible activities + session structure.
 * Does NOT insert activity_selection_results (selection via BFF in e2e).
 */
import { resolve } from "node:path";
import {
  EMAIL_ADMIN,
  EMAIL_CONSULTANT_A,
  assertLocal,
  assertNotAmber,
  createAdminClient,
  ensureUser,
  mustGrant,
  projectRoot,
  r4Id,
  resolveEnv,
  runSql,
  runTypeScriptScript,
  trackingUrl,
} from "./r4-seed-lib.mjs";

const FX = 3;
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
};

const WORKMAP_PATH = resolve(
  projectRoot,
  "tests/fixtures/official-control-panel/r4/workmap-fx03-le8.json",
);

export async function provisionFx03(ctx) {
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
    "r4_fx03_view",
  );
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "manage_activity_selection",
    "r4_fx03_publish_canonical_selection",
  );

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

  const prepared = prepareCanonicalSnapshot(userAdmin);

  return {
    ok: true,
    fixture: "FX-03",
    title: "Selección <=8",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    roleRuntimeSessionId: IDS.session,
    expectedSelectionMode: "non_competitive_inclusion",
    eligibleActivityTarget: 4,
    snapshotVersion: 1,
    selectedActivityIds: prepared.selectedActivityIds,
    canonicalEligibleCount: prepared.eligibleCount,
    canonicalSelectedCount: prepared.selectedCount,
    canonicalNonPrimaryContextCount: prepared.nonPrimaryContextCount,
    selectionPendingViaBff: true,
    consultants: { a: { email: EMAIL_CONSULTANT_A, userId: userA } },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
      view: "monitoring",
    }),
    relatedCriteria: ["CP-009"],
    notes: [
      "No SQL insert of selection result.",
      "Workmap fixture prepared for e2e UI→BFF→RPC selection.",
      "POST .../activity-selection (authenticated) stages+validates+publishes.",
    ],
    productGaps: [],
    bffMutationPath:
      "/api/eve/official-consultant-control-panel/cases/{caseId}/participants/{participantId}/profiles/{profileId}/sessions/{sessionId}/activity-selection",
    bffMutationMethod: "POST",
  };
}

function prepareCanonicalSnapshot(actorUserId) {
  const input = {
    actorUserId,
    caseId: IDS.caseId,
    participantId: IDS.participant,
    profileId: IDS.profile,
    roleRuntimeSessionId: IDS.session,
    snapshotVersion: 1,
    fixturePath: WORKMAP_PATH,
    sourceReference: "r4-test-precondition:FX-03:snapshot:1",
  };
  const result = runTypeScriptScript(
    "scripts/eve/official-control-panel/r4/prepare-activity-selection-snapshot.ts",
    [Buffer.from(JSON.stringify(input)).toString("base64url")],
  );
  return JSON.parse(result.stdout);
}

function buildStructureSql(userA) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-03 Selección <=8')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'r4-fx03-participant@example.invalid', null
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
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-03', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-03 Selección <=8'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values (
  '${IDS.participant}', '${IDS.caseId}', '${IDS.usuario}', 'Participante FX-03',
  'active', now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.case_participant_profiles (
  id, case_participant_id, display_label, resolution_status,
  valid_from, enabled, created_by
) values (
  '${IDS.profile}', '${IDS.participant}', 'Perfil FX-03', 'resolved',
  now() - interval '1 day', true, '${userA}'
)
on conflict (id) do update set enabled = true;

insert into public.role_runtime_session (
  id, tenant_id, case_id, catalog_version_id, state, source_trace, metadata,
  selected_primary_activity_count, secondary_activity_count
) values (
  '${IDS.session}', '${IDS.company}', '${IDS.caseId}', '${IDS.catalogUuid}',
  'active', '[]'::jsonb, '{"label":"Sesión FX-03","eligible_target":4}'::jsonb,
  0, 0
)
on conflict (id) do update set state = 'active', metadata = excluded.metadata;

insert into public.case_profile_runtime_session_links (
  id, case_participant_profile_id, role_runtime_session_id,
  link_status, enabled, valid_from, valid_until, created_by, source_reference
) values (
  '${IDS.link}', '${IDS.profile}', '${IDS.session}',
  'confirmed', true, now() - interval '1 day', null, '${userA}', 'r4-fx03'
)
on conflict (id) do update set link_status = 'confirmed', enabled = true;

commit;
`;
}
