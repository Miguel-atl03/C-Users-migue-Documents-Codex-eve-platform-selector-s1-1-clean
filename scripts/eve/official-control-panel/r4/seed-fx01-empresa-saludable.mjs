#!/usr/bin/env node
/**
 * FX-01 — Empresa saludable (test-only).
 * 1 company / relationship / case, 10 usuarios, H0–H2 achieved, sin blockers.
 * No productive "healthy/green" labels — only factual milestone achievements.
 */
import { randomUUID } from "node:crypto";
import {
  AMBER_CASE,
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

const FX = 1;
const IDS = {
  company: r4Id(FX, 0, 1),
  relationship: r4Id(FX, 0, 2),
  caseId: r4Id(FX, 0, 3),
  assignA: r4Id(FX, 0, 11),
  mainProcess: r4Id(FX, 0, 20),
  usuarios: Array.from({ length: 10 }, (_, i) => r4Id(FX, 1, i + 1)),
  participants: Array.from({ length: 10 }, (_, i) => r4Id(FX, 2, i + 1)),
};

const H0_H2 = [
  { code: "H0", objectName: "CasoDiagnosticoEVE", objectState: "InDiagnosticProduction" },
  { code: "H1", objectName: "CasoDiagnosticoEVE", objectState: "WithSceneCanonicalRecord" },
  { code: "H2", objectName: "CasoDiagnosticoEVE", objectState: "ReadyForTransduction" },
];

export async function provisionFx01(ctx) {
  const env = ctx?.env ?? resolveEnv();
  const admin = ctx?.admin ?? createAdminClient(env);
  assertLocal(env.supabaseUrl);
  assertNotAmber(IDS.company, IDS.caseId);
  if (IDS.caseId === AMBER_CASE) throw new Error("amber_seed_forbidden");

  const userA = await ensureUser(admin, EMAIL_CONSULTANT_A, env.password);
  const userAdmin = await ensureUser(admin, EMAIL_ADMIN, env.password);

  runSql(buildStructureSql(userA));
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "view_experience_state",
    "r4_fx01_view",
  );

  await ensureCanonicalDefinitions(admin, userAdmin);
  await ensureMainProcessAndCore(admin, userAdmin);
  const achievements = await achieveH0H2(admin, userAdmin);

  return {
    ok: true,
    fixture: "FX-01",
    title: "Empresa saludable",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    mainProcessId: IDS.mainProcess,
    usuarioIds: IDS.usuarios,
    participantIds: IDS.participants,
    participantCount: 10,
    milestonesAchieved: ["H0", "H1", "H2"],
    achievements,
    consultants: {
      a: { email: EMAIL_CONSULTANT_A, userId: userA },
    },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
    }),
    relatedCriteria: ["CP-001", "CP-002", "CP-003", "CP-004", "A11Y-001"],
    notes: [
      "No productive healthy/green/normal labels invented.",
      "H0–H2 via eve_admin_record_core_milestone_achievement.",
    ],
  };
}

function buildStructureSql(userA) {
  const usuarioRows = IDS.usuarios
    .map(
      (id, i) =>
        `('${id}', '${IDS.company}', 'r4-fx01-user-${String(i + 1).padStart(2, "0")}@example.invalid', null)`,
    )
    .join(",\n  ");
  const participantRows = IDS.participants
    .map(
      (id, i) =>
        `('${id}', '${IDS.caseId}', '${IDS.usuarios[i]}', 'Participante FX-01 ${String(i + 1).padStart(2, "0")}', 'active', now() - interval '1 day', true, '${userA}')`,
    )
    .join(",\n  ");

  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-01 Saludable')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values
  ${usuarioRows}
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
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = 'enabled',
  valid_until = null;

insert into public.client_relationships (
  id, client_company_id, display_name, status, valid_from, valid_until, created_by
) values (
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-01', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled', display_name = excluded.display_name;

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuarios[0]}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-01 Saludable'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

insert into public.case_participants (
  id, case_id, user_id, display_label, participation_status,
  valid_from, enabled, created_by
) values
  ${participantRows}
on conflict (id) do update set
  display_label = excluded.display_label,
  enabled = true,
  participation_status = 'active';

commit;
`;
}

async function ensureCanonicalDefinitions(admin, actorId) {
  const { data: defs, error } = await admin
    .from("core_milestone_definitions")
    .select("id, code")
    .eq("enabled", true)
    .in("code", ["H0", "H1", "H2", "H3", "H4", "H5", "H6"]);
  if (error) throw new Error(`defs_lookup:${error.message}`);
  if ((defs ?? []).length === 7) return defs;

  const catalog = [
    { code: "H0", label: "Caso abierto", sequence: 0, objectName: "CasoDiagnosticoEVE", objectState: "InDiagnosticProduction" },
    { code: "H1", label: "Escena operativa consolidada", sequence: 1, objectName: "CasoDiagnosticoEVE", objectState: "WithSceneCanonicalRecord" },
    { code: "H2", label: "Listo para transducción", sequence: 2, objectName: "CasoDiagnosticoEVE", objectState: "ReadyForTransduction" },
    { code: "H3", label: "Escenas evidenciales validadas", sequence: 3, objectName: "CasoDiagnosticoEVE", objectState: "WithValidatedEvidentialScenes" },
    { code: "H4", label: "Película causal agregada", sequence: 4, objectName: "CasoDiagnosticoEVE", objectState: "WithAggregatedCausalMovie" },
    { code: "H5", label: "Diagnóstico experto recibido", sequence: 5, objectName: "CasoDiagnosticoEVE", objectState: "WithDeliveredExpertDiagnosis" },
    { code: "H6", label: "Caso entregado y cerrado", sequence: 6, objectName: "CasoDiagnosticoEVE", objectState: "Delivered" },
  ];
  for (const item of catalog) {
    await mustRpc(admin, "eve_admin_register_core_milestone_definition", {
      p_actor_user_id: actorId,
      p_code: item.code,
      p_label: item.label,
      p_sequence: item.sequence,
      p_expected_object_name: item.objectName,
      p_expected_object_state: item.objectState,
    });
  }
  const again = await admin
    .from("core_milestone_definitions")
    .select("id, code")
    .eq("enabled", true)
    .in("code", ["H0", "H1", "H2", "H3", "H4", "H5", "H6"]);
  if (again.error || (again.data ?? []).length !== 7) {
    throw new Error("canonical_definitions_incomplete_after_seed");
  }
  return again.data;
}

async function ensureMainProcessAndCore(admin, actorId) {
  const { data: existing } = await admin
    .from("case_main_processes")
    .select("id, core_process_code, enabled")
    .eq("case_id", IDS.caseId)
    .eq("enabled", true)
    .maybeSingle();

  let processId = existing?.id ?? null;
  if (!processId) {
    // Prefer deterministic id via SQL insert using admin RPC when possible.
    processId = await mustRpc(admin, "eve_admin_create_case_main_process", {
      p_actor_user_id: actorId,
      p_case_id: IDS.caseId,
      p_label: "Proceso principal R4 FX-01",
      p_status: "available",
    });
  }

  await mustRpc(admin, "eve_admin_set_main_process_core_code", {
    p_actor_user_id: actorId,
    p_main_process_id: processId,
    p_core_process_code: "PF-CORE-01",
  });

  const { data: defs, error } = await admin
    .from("core_milestone_definitions")
    .select("id, code")
    .eq("enabled", true)
    .in("code", ["H0", "H1", "H2", "H3", "H4", "H5", "H6"]);
  if (error) throw new Error(error.message);

  for (const def of defs ?? []) {
    const { data: existingLink } = await admin
      .from("case_core_milestones")
      .select("id")
      .eq("case_id", IDS.caseId)
      .eq("core_milestone_definition_id", def.id)
      .eq("enabled", true)
      .maybeSingle();
    if (existingLink?.id) continue;
    try {
      await mustRpc(admin, "eve_admin_link_case_core_milestone", {
        p_actor_user_id: actorId,
        p_case_id: IDS.caseId,
        p_main_process_id: processId,
        p_core_milestone_definition_id: def.id,
        p_applicability_status: "applicable",
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("duplicate key")) throw error;
    }
  }

  IDS.mainProcess = processId;
  return processId;
}

async function achieveH0H2(admin, actorId) {
  const { data: links, error } = await admin
    .from("case_core_milestones")
    .select(
      "id, core_milestone_definition_id, core_milestone_definitions!inner(code)",
    )
    .eq("case_id", IDS.caseId)
    .eq("enabled", true);
  if (error) throw new Error(`case_core_lookup:${error.message}`);

  const byCode = new Map();
  for (const row of links ?? []) {
    const code = row.core_milestone_definitions?.code;
    if (code) byCode.set(code, row.id);
  }

  const out = [];
  for (const item of H0_H2) {
    const caseCoreId = byCode.get(item.code);
    if (!caseCoreId) throw new Error(`missing_case_core_link:${item.code}`);

    // Revoke prior non-revoked achievements for idempotent reseed.
    const { data: prior } = await admin
      .from("core_milestone_achievements")
      .select("id")
      .eq("case_core_milestone_id", caseCoreId)
      .is("revoked_at", null);
    for (const p of prior ?? []) {
      await mustRpc(admin, "eve_admin_revoke_core_milestone_achievement", {
        p_actor_user_id: actorId,
        p_achievement_id: p.id,
        p_revocation_reason: "r4_fx01_reseed",
      });
    }

    const achievementId = await mustRpc(
      admin,
      "eve_admin_record_core_milestone_achievement",
      {
        p_actor_user_id: actorId,
        p_case_core_milestone_id: caseCoreId,
        p_object_name: item.objectName,
        p_object_state: item.objectState,
        p_achieved_at: new Date().toISOString(),
        p_object_reference_id: null,
        p_evidence_reference: `r4://fx01/${item.code}/${randomUUID()}`,
        p_source_event: "r4_fx01_seed",
      },
    );
    out.push({ code: item.code, caseCoreMilestoneId: caseCoreId, achievementId });
  }
  return out;
}
