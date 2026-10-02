#!/usr/bin/env node
/**
 * FX-12 — Final alternativo (test-only).
 * Prepares an open case. The authenticated product event is executed in E2E.
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

const FX = 12;
const IDS = {
  company: r4Id(FX, 0, 1),
  relationship: r4Id(FX, 0, 2),
  caseId: r4Id(FX, 0, 3),
  usuario: r4Id(FX, 0, 4),
  assignA: r4Id(FX, 0, 11),
};

const INTENDED_FINAL = "ClosedWithoutSufficiency";

export async function provisionFx12(ctx) {
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
    "r4_fx12_view",
  );
  await mustGrant(
    admin,
    userAdmin,
    userA,
    IDS.company,
    "close_core_without_sufficiency",
    "r4_fx12_authenticated_product_event",
  );

  await ensureCanonicalDefinitions(admin, userAdmin);
  const processId = await ensureMainProcessAndCore(admin, userAdmin);

  const axis = await mustRpc(admin, "eve_list_core_milestone_axis", {
    p_case_id: IDS.caseId,
  });
  if (axis?.finalAlternative != null) {
    throw new Error("fx12_seed_must_not_close_case");
  }

  return {
    ok: true,
    fixture: "FX-12",
    title: "Final alternativo",
    companyId: IDS.company,
    relationshipId: IDS.relationship,
    caseId: IDS.caseId,
    mainProcessId: processId,
    intendedFinalAlternative: INTENDED_FINAL,
    observedFinalAlternative: null,
    finalAlternativeReason: "r4_fx12_closed_without_sufficiency",
    productCanEmitFinalAlternative: false,
    consultants: { a: { email: EMAIL_CONSULTANT_A, userId: userA } },
    trackingUrl: trackingUrl({
      companyId: IDS.company,
      relationshipId: IDS.relationship,
      caseId: IDS.caseId,
    }),
    relatedCriteria: ["CP-001"],
    notes: [
      "Case + PF-CORE-01 linked; final alternative remains null after provisioning.",
      "E2E emits the authenticated canonical event and verifies the axis readback.",
    ],
    productGaps: [],
  };
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
}

async function ensureMainProcessAndCore(admin, actorId) {
  const { data: existing } = await admin
    .from("case_main_processes")
    .select("id")
    .eq("case_id", IDS.caseId)
    .eq("enabled", true)
    .maybeSingle();

  let processId = existing?.id ?? null;
  if (!processId) {
    processId = await mustRpc(admin, "eve_admin_create_case_main_process", {
      p_actor_user_id: actorId,
      p_case_id: IDS.caseId,
      p_label: "Proceso principal R4 FX-12",
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
  return processId;
}

function buildStructureSql(userA) {
  return `
begin;
insert into public.empresas (id, nombre)
values ('${IDS.company}', 'Empresa R4 FX-12 Final Alternativo')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email, auth_user_id)
values (
  '${IDS.usuario}', '${IDS.company}', 'r4-fx12-participant@example.invalid', null
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
  '${IDS.relationship}', '${IDS.company}', 'Relación R4 FX-12', 'enabled',
  now() - interval '1 day', null, '${userA}'
)
on conflict (id) do update set status = 'enabled';

insert into public.sesiones_llenado (
  id, usuario_id, estado_actual, client_company_id, client_relationship_id, display_name
) values (
  '${IDS.caseId}', '${IDS.usuario}', 'en_progreso', '${IDS.company}', '${IDS.relationship}',
  'Caso R4 FX-12 Final Alternativo'
)
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name,
  core_final_alternative = null;

commit;
`;
}
