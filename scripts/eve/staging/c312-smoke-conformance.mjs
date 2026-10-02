#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_REF = process.env.EVE_LEGACY_STAGING_EXPECTED_PROJECT_REF;
const FIXTURE_ID = "c312-smoke-conformance-v1";
const COMMANDS = new Set(["--dry-run", "--apply", "--verify", "--cleanup"]);
const command = process.argv.slice(2).find((arg) => COMMANDS.has(arg));

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, command, error: safeError(error) }, null, 2));
  process.exitCode = 1;
});

async function main() {
  if (!EXPECTED_REF || EXPECTED_REF === "keqrkyumfyhfivllvdbl") throw new Error("legacy_staging_target_must_be_explicit_and_not_pr3");
  if (!command || process.argv.slice(2).filter((arg) => COMMANDS.has(arg)).length !== 1) {
    throw new Error("usage: node scripts/eve/staging/c312-smoke-conformance.mjs --dry-run|--apply|--verify|--cleanup");
  }

  const env = readEnv();
  assertStagingRef(env.url);
  const admin = createClient(env.url, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anon = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (command === "--dry-run") {
    const residue = await collectFixtureResidue(admin);
    print({ ok: true, command, fixtureId: FIXTURE_ID, stagingRef: mask(EXPECTED_REF), residue, planned: plannedOperations() });
    return;
  }

  if (command === "--cleanup") {
    const before = await collectFixtureResidue(admin);
    const cleanup = await cleanupFixture(admin);
    const after = await collectFixtureResidue(admin);
    print({ ok: true, command, fixtureId: FIXTURE_ID, before, cleanup, after });
    return;
  }

  if (command === "--apply") {
    await cleanupFixture(admin);
    const applied = await applyFixture({ admin, anon, env });
    const verified = await verifyFixture({ admin, anon, env, expected: applied });
    print({ ok: true, command, fixtureId: FIXTURE_ID, applied: maskFixture(applied), verified });
    return;
  }

  if (command === "--verify") {
    const verified = await verifyFixture({ admin, anon, env });
    print({ ok: true, command, fixtureId: FIXTURE_ID, verified });
  }
}

function readEnv() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.STAGING_SUPABASE_SECRET_KEY ?? "").trim();
  if (!serviceKey) throw new Error("missing_env:SUPABASE_SERVICE_ROLE_KEY");
  const appBaseUrl = (process.env.EVE_BASE_URL ?? "http://127.0.0.1:3112").trim();
  const consultantPassword = (process.env.EVE_TEST_CONSULTANT_PASSWORD ?? randomPassword()).trim();
  const participantPassword = (process.env.EVE_TEST_PARTICIPANT_PASSWORD ?? randomPassword()).trim();
  return { url, anonKey, serviceKey, appBaseUrl, consultantPassword, participantPassword };
}

function requiredEnv(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`missing_env:${name}`);
  return value;
}

function assertStagingRef(url) {
  const host = new URL(url).hostname;
  const ref = host.split(".")[0];
  if (ref !== EXPECTED_REF) throw new Error(`wrong_project_ref:${mask(ref)}`);
}

function randomPassword() {
  return `Eve-C312-${randomBytes(12).toString("base64url")}a1!`;
}

function fixtureEmail(kind) {
  return `${kind}.${FIXTURE_ID}@example.test`;
}

function fixtureMetadata(extra = {}) {
  return { fixture_id: FIXTURE_ID, phase: "C3.12.9", ...extra };
}

async function applyFixture({ admin, anon, env }) {
  const consultantEmail = fixtureEmail("consultant");
  const participantEmail = fixtureEmail("participant");
  const consultant = await ensureAuthUser(admin, consultantEmail, env.consultantPassword, "Consultor C312 Smoke");
  const participantAuth = await ensureAuthUser(admin, participantEmail, env.participantPassword, "Participante C312 Smoke");

  const company = await ensureCompany(admin);

  const consultantEveUser = await ensureUsuario(admin, {
    empresa_id: company.id,
    nombre: "Consultor C312 Smoke",
    email: consultantEmail,
    auth_user_id: consultant.userId,
    rol_declarado: "consultor",
  });

  const consultantSession = await signIn(anon, consultantEmail, env.consultantPassword);
  const consultantClient = authedClient(env, consultantSession.access_token);

  const relationship = await ensureRelationship(admin, consultant.userId, company.id);

  await rpcSingle(admin, "eve_admin_assign_consultant_company", {
    p_actor_user_id: consultant.userId,
    p_consultant_user_id: consultant.userId,
    p_client_company_id: company.id,
    p_valid_from: new Date(Date.now() - 60_000).toISOString(),
    p_valid_until: null,
  });

  const toolVersionId = await resolveToolVersionId(admin);
  const caseRow = await ensureCase(admin, {
    consultantUsuarioId: consultantEveUser.id,
    toolVersionId,
    companyId: company.id,
    relationshipId: relationship,
  });

  const tokenHash = sha256(`${FIXTURE_ID}:${participantEmail}:token`);
  const invitation = await rpcFirst(consultantClient, "create_participant_invitation", {
    p_empresa_id: company.id,
    p_client_relationship_id: relationship,
    p_case_id: caseRow.id,
    p_invited_email: participantEmail,
    p_token_hash: tokenHash,
    p_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    p_invited_name: "Participante C312 Smoke",
    p_invitation_kind: "participant",
    p_metadata: fixtureMetadata({
      entity: "participant_invitation",
      declared_position: "Ejecutiva Comercial Smoke",
      declared_position_source: "sponsor",
    }),
  });
  await rpcFirst(consultantClient, "mark_participant_invitation_sent", {
    p_invitation_id: invitation.invitation_id,
    p_metadata: fixtureMetadata({ transition: "sent" }),
  });

  const participantSession = await signIn(anon, participantEmail, env.participantPassword);
  const participantClient = authedClient(env, participantSession.access_token);
  const accepted = await rpcFirst(participantClient, "accept_participant_invitation", {
    p_token_hash: tokenHash,
    p_role_label: null,
    p_role_code: null,
    p_metadata: fixtureMetadata({ transition: "accepted" }),
  });
  if (accepted.status !== "accepted" || !accepted.case_participant_id) {
    throw new Error(`accept_participant_invitation_not_accepted:${JSON.stringify(maskFixture(accepted)).slice(0, 300)}`);
  }

  const preWorkMapProfiles = await selectEq(admin, "case_participant_profiles", "case_participant_id", accepted.case_participant_id);
  const preWorkMapRuntimeSessions = await selectEq(admin, "role_runtime_session", "case_id", caseRow.id);
  const position = await firstActivePosition(admin, accepted.case_participant_id);
  if (position?.declared_title !== "Ejecutiva Comercial Smoke") {
    throw new Error("declared_position_not_materialized");
  }
  if (preWorkMapProfiles.length !== 0) throw new Error("profile_created_before_workmap");
  if (preWorkMapRuntimeSessions.length !== 0) throw new Error("runtime_created_before_workmap");

  const workMap = buildWorkMap();
  const snapshot = await rpcFirst(participantClient, "upsert_participant_workmap_snapshot", {
    p_case_id: caseRow.id,
    p_workmap: workMap,
    p_workmap_version: "c312-smoke-v1",
  });
  const materializedProfiles = await rpcRows(participantClient, "materialize_case_participant_profiles_from_workmap", {
    p_case_id: caseRow.id,
  });
  const materializedProfile = materializedProfiles.find((row) => row.materialization_status === "created" || row.materialization_status === "reused") ?? materializedProfiles[0];
  if (!materializedProfile?.profile_id) throw new Error("profile_not_materialized_from_workmap");

  const finalize = await postJson(`${env.appBaseUrl}/api/participant/workmap/finalize`, participantSession.access_token, {});
  if (finalize.status !== "ready") throw new Error(`finalize_not_ready:${JSON.stringify(finalize).slice(0, 300)}`);

  const selectionResultId = finalize.profiles?.find?.((profile) => profile.status === "ready")?.selection?.id;
  const selection = selectionResultId ? await maybeSingle(admin, "activity_selection_results", "id", selectionResultId) : null;
  const primaryItem = selectionResultId ? await firstSelectionItem(admin, selectionResultId) : null;
  let manualReview = null;
  if (primaryItem?.id) {
    manualReview = await postJson(`${env.appBaseUrl}/api/official-control-panel/activity-selection/manual-review`, consultantSession.access_token, {
      itemId: primaryItem.id,
      caseId: caseRow.id,
      state: "reviewed_confirmed",
      justification: "c312-smoke-conformance governed manual review",
      after: { fixture_id: FIXTURE_ID, reviewed_by_harness: true },
    });
  }

  return {
    consultantEmail,
    participantEmail,
    consultantAuthUserId: consultant.userId,
    participantAuthUserId: participantAuth.userId,
    companyId: company.id,
    relationshipId: relationship,
    caseId: caseRow.id,
    invitationId: invitation.invitation_id,
    participantId: accepted.case_participant_id,
    profileId: materializedProfile.profile_id,
    snapshotId: snapshot.workmap_snapshot_id,
    selectionResultId,
    roleRuntimeSessionId: finalize.next?.roleRuntimeSessionId,
    firstRunId: finalize.next?.activityRuntimeRunId,
    manualReview,
    selection,
    preWorkMap: {
      profiles: preWorkMapProfiles.length,
      runtimeSessions: preWorkMapRuntimeSessions.length,
      positionId: position.id,
      participantAuthUserId: participantAuth.userId,
    },
  };
}

async function verifyFixture({ admin, anon, env }) {
  const ctx = await findFixtureContext(admin);
  if (!ctx.caseId) throw new Error("fixture_not_applied");
  const selection = await latestSelection(admin, ctx.caseId);
  const items = selection?.id ? await selectEq(admin, "activity_selection_result_items", "result_id", selection.id) : [];
  const sessionId = selection?.role_runtime_session_id;
  const sessions = sessionId ? await selectEq(admin, "role_runtime_session", "role_runtime_session_id", sessionId) : [];
  const runs = sessionId ? await selectEq(admin, "activity_runtime_run", "role_runtime_session_id", sessionId) : [];
  const primaryItems = items.filter((item) => item.classification === "primary");
  const contextualItems = items.filter((item) => item.classification === "non_primary");
  const tracesComplete = items.filter((item) => item.decision_trace_jsonb && Object.keys(item.decision_trace_jsonb).length > 0).length;
  const hashFields = [
    selection?.source_snapshot_hash,
    selection?.policy_manifest_hash,
    selection?.selection_result_hash,
    selection?.policy_manifest_jsonb?.machineReadableArtifactChecksum,
    selection?.policy_manifest_jsonb?.executablePolicyProjectionHash,
  ];
  const replay = selection?.id
    ? await replaySelection({ env, selectionResultId: selection.id })
    : null;
  const replayedSelection = selection?.id
    ? await maybeSingle(admin, "activity_selection_results", "id", selection.id)
    : null;
  const panel = await fetchPanelMatrix({ anon, env, ctx });
  const significadoReady = Boolean(primaryItems[0]?.activity_id && runs.find((run) => run.activity_id === primaryItems[0].activity_id));
  const persistedReplayStatus = replayedSelection?.replay_status ?? selection?.replay_status ?? null;
  const replayHashPersisted = replayedSelection?.replay_hash ?? null;
  const replayHash = replay?.replayHash ?? null;
  const replayHashMatches = Boolean(replayHash && replayHashPersisted === replayHash);
  const replayResultHashMatches = Boolean(
    replay?.recomputedResultHash &&
    replayedSelection?.selection_result_hash &&
    replay.recomputedResultHash === replayedSelection.selection_result_hash,
  );
  return {
    caseId: mask(ctx.caseId),
    participantId: mask(ctx.participantId),
    profileId: mask(ctx.profileId),
    selectionResultId: mask(selection?.id),
    evaluated: selection?.eligible_count ?? 0,
    traceRows: items.length,
    tracesComplete,
    primary: primaryItems.length,
    contextual: contextualItems.length,
    runtimeSessions: sessions.length,
    runtimeRuns: runs.length,
    primaryRuns: runs.filter((run) => run.is_primary_activity === true).length,
    secondaryRuns: runs.filter((run) => run.is_primary_activity === false).length,
    hashesNonNull: hashFields.every(Boolean),
    persistedReplayStatus,
    replayStatus: replay?.replayStatus ?? null,
    replayedAt: replay?.replayedAt ?? null,
    replayHash: mask(replayHash),
    replayHashMatches,
    replayResultHashMatches,
    replayDiffCount: replay?.diffCount ?? null,
    panel,
    significadoFirstPrimaryReady: significadoReady,
    pass:
      selection?.eligible_count === 15 &&
      primaryItems.length === 8 &&
      contextualItems.length === 7 &&
      tracesComplete === 15 &&
      sessions.length === 1 &&
      runs.filter((run) => run.is_primary_activity === true).length === 8 &&
      runs.filter((run) => run.is_primary_activity === false).length === 0 &&
      hashFields.every(Boolean) &&
      persistedReplayStatus === "match" &&
      replay?.replayStatus === "match" &&
      replayHashMatches &&
      replayResultHashMatches &&
      significadoReady,
  };
}

async function fetchPanelMatrix({ anon, env, ctx }) {
  const email = fixtureEmail("consultant");
  const password = env.consultantPassword;
  try {
    const session = await signIn(anon, email, password);
    const matrix = await getJson(`${env.appBaseUrl}/api/eve/official-consultant-control-panel/cases/${ctx.caseId}/user-indicator-matrix`, session.access_token);
    const progress = await getJson(`${env.appBaseUrl}/api/eve/official-consultant-control-panel/cases/${ctx.caseId}/workmap-progress`, session.access_token);
    const body = matrix.matrix ?? matrix;
    const user = (body.users ?? []).find((row) => row.participantId === ctx.participantId) ?? {};
    const prog = progress.progress ?? progress;
    return {
      matrixLoaded: true,
      eligible: user.eligibleActivityCount ?? null,
      primary: user.selectedPrimaryCount ?? null,
      contextual: user.nonPrimaryContextCount ?? null,
      detailActivities: Array.isArray(prog.activities) ? prog.activities.length : null,
    };
  } catch (error) {
    return { matrixLoaded: false, error: safeError(error) };
  }
}

async function replaySelection({ env, selectionResultId }) {
  const replay = await postServiceJson(`${env.appBaseUrl}/api/official-control-panel/activity-selection/replay`, env.serviceKey, {
    selectionResultId,
  });
  if (replay.status !== "ok") {
    throw new Error(`replay_not_ok:${JSON.stringify(replay).slice(0, 300)}`);
  }
  if (replay.replayStatus === "match" && replay.diffCount !== 0) {
    throw new Error("replay_match_with_diffs");
  }
  return replay;
}

async function cleanupFixture(admin) {
  const ctx = await findFixtureContext(admin);
  const deletion = {};
  if (ctx.selectionIds.length) {
    deletion.selectionItems = await deleteIn(admin, "activity_selection_result_items", "result_id", ctx.selectionIds);
  }
  if (ctx.runIds.length) deletion.runs = await deleteIn(admin, "activity_runtime_run", "activity_runtime_run_id", ctx.runIds);
  if (ctx.selectionIds.length) deletion.selectionResults = await deleteIn(admin, "activity_selection_results", "id", ctx.selectionIds);
  if (ctx.profileIds.length) deletion.profileLinks = await deleteIn(admin, "case_profile_runtime_session_links", "case_participant_profile_id", ctx.profileIds).catch((error) => ({ skipped: safeError(error) }));
  if (ctx.runtimeSessionIds.length) deletion.runtimeSessions = await deleteIn(admin, "role_runtime_session", "role_runtime_session_id", ctx.runtimeSessionIds);
  if (ctx.materializationAuditIds.length) deletion.materializationAudit = await deleteIn(admin, "case_participant_profile_materialization_audit", "id", ctx.materializationAuditIds);
  if (ctx.snapshotIds.length) deletion.snapshots = await deleteIn(admin, "case_participant_workmap_snapshots", "id", ctx.snapshotIds);
  if (ctx.profileIds.length) deletion.profiles = await deleteIn(admin, "case_participant_profiles", "id", ctx.profileIds);
  if (ctx.participantIds.length) deletion.positions = await deleteIn(admin, "case_participant_positions", "case_participant_id", ctx.participantIds);
  if (ctx.caseIds.length) deletion.sponsors = await deleteIn(admin, "case_sponsors", "case_id", ctx.caseIds).catch((error) => ({ skipped: safeError(error) }));
  if (ctx.participantIds.length) deletion.participants = await deleteIn(admin, "case_participants", "id", ctx.participantIds);
  if (ctx.invitationIds.length) deletion.invitations = await resetFixtureInvitations(admin, ctx.invitationIds);
  if (ctx.companyIds.length) deletion.assignments = await deleteIn(admin, "consultant_company_assignments", "client_company_id", ctx.companyIds);
  if (ctx.caseIds.length) deletion.cases = await deleteIn(admin, "sesiones_llenado", "id", ctx.caseIds).catch((error) => ({ preserved: ctx.caseIds.length, reason: safeError(error) }));
  if (ctx.relationshipIds.length) deletion.relationships = await deleteIn(admin, "client_relationships", "id", ctx.relationshipIds).catch((error) => ({ preserved: ctx.relationshipIds.length, reason: safeError(error) }));
  if (ctx.userIds.length) deletion.usuarios = await deleteUsersIndividually(admin, ctx.userIds);
  if (ctx.companyIds.length) deletion.companies = await deleteIn(admin, "empresas", "id", ctx.companyIds).catch((error) => ({ preserved: ctx.companyIds.length, reason: safeError(error) }));
  let deletedAuthUsers = 0;
  let preservedAuthUsers = 0;
  for (const userId of ctx.authUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) preservedAuthUsers += 1;
    else deletedAuthUsers += 1;
  }
  deletion.authUsers = { deleted: deletedAuthUsers, preserved: preservedAuthUsers };
  return deletion;
}

async function findFixtureContext(admin) {
  const { data: companies, error: companyError } = await admin
    .from("empresas")
    .select("*")
    .eq("nombre", "C312 Smoke Conformance Company");
  if (companyError) throw new Error(`empresas_fixture_lookup_failed:${companyError.message}`);
  const companyIds = companies.map((row) => row.id);
  const relationships = companyIds.length ? await selectIn(admin, "client_relationships", "client_company_id", companyIds) : [];
  const relationshipIds = relationships.map((row) => row.id);
  const cases = companyIds.length ? await selectIn(admin, "sesiones_llenado", "client_company_id", companyIds) : [];
  const caseIds = cases.map((row) => row.id);
  const invitations = caseIds.length ? await selectIn(admin, "participant_invitations", "case_id", caseIds) : [];
  const invitationIds = invitations.map((row) => row.id);
  const participants = caseIds.length ? await selectIn(admin, "case_participants", "case_id", caseIds) : [];
  const participantIds = participants.map((row) => row.id);
  const profiles = participantIds.length ? await selectIn(admin, "case_participant_profiles", "case_participant_id", participantIds) : [];
  const profileIds = profiles.map((row) => row.id);
  const snapshots = participantIds.length ? await selectIn(admin, "case_participant_workmap_snapshots", "case_participant_id", participantIds) : [];
  const snapshotIds = snapshots.map((row) => row.id);
  const materializationAudit = participantIds.length ? await selectIn(admin, "case_participant_profile_materialization_audit", "case_participant_id", participantIds) : [];
  const materializationAuditIds = materializationAudit.map((row) => row.id);
  const selections = caseIds.length ? await selectIn(admin, "activity_selection_results", "case_id", caseIds) : [];
  const selectionIds = selections.map((row) => row.id);
  const runtimeSessionsByCase = caseIds.length ? await selectIn(admin, "role_runtime_session", "case_id", caseIds) : [];
  const runtimeSessionIds = [
    ...new Set([
      ...selections.map((row) => row.role_runtime_session_id).filter(Boolean),
      ...runtimeSessionsByCase.map((row) => row.role_runtime_session_id).filter(Boolean),
    ]),
  ];
  const runs = runtimeSessionIds.length ? await selectIn(admin, "activity_runtime_run", "role_runtime_session_id", runtimeSessionIds) : [];
  const runIds = runs.map((row) => row.activity_runtime_run_id);
  const fixtureUsers = await findAuthUsers(admin, [fixtureEmail("consultant"), fixtureEmail("participant")]);
  const usuarios = await selectIn(admin, "usuarios", "email", [fixtureEmail("consultant"), fixtureEmail("participant")]);
  return {
    companyIds, relationshipIds, caseIds, invitationIds, participantIds, profileIds, snapshotIds, materializationAuditIds,
    selectionIds, runtimeSessionIds, runIds,
    authUserIds: fixtureUsers.map((user) => user.id),
    userIds: usuarios.map((row) => row.id),
    caseId: caseIds[0] ?? null,
    participantId: participantIds[0] ?? null,
    profileId: profileIds[0] ?? null,
  };
}

async function collectFixtureResidue(admin) {
  const ctx = await findFixtureContext(admin);
  return {
    companies: ctx.companyIds.length,
    relationships: ctx.relationshipIds.length,
    cases: ctx.caseIds.length,
    invitations: ctx.invitationIds.length,
    participants: ctx.participantIds.length,
    profiles: ctx.profileIds.length,
    snapshots: ctx.snapshotIds.length,
    materializationAudit: ctx.materializationAuditIds.length,
    selectionResults: ctx.selectionIds.length,
    runtimeSessions: ctx.runtimeSessionIds.length,
    runtimeRuns: ctx.runIds.length,
    authUsers: ctx.authUserIds.length,
    usuarios: ctx.userIds.length,
  };
}

function plannedOperations() {
  return [
    "assert explicitly configured legacy staging project ref; never PR3",
    "create synthetic Auth users via Auth Admin",
    "create/reuse synthetic company/case fixture rows identified by deterministic fixture names",
    "create relationship and consultant assignment through admin RPCs",
    "create/send/accept invitation through onboarding RPCs",
    "persist synthetic WorkMap snapshot through upsert_participant_workmap_snapshot",
    "materialize profile through materialize_case_participant_profiles_from_workmap after WorkMap",
    "call /api/participant/workmap/finalize as participant",
    "verify Runtime session was created by create_role_runtime_session_for_profile path",
    "call manual review BFF as consultant",
    "verify panel/read models and cleanup fixture entities",
  ];
}

function buildWorkMap() {
  const activities = [
    "Calificar oportunidad comercial con datos de cliente y alcance del pedido",
    "Preparar cotizacion mixta con muebles estandar y elementos especiales",
    "Validar disponibilidad de inventario y tiempos de produccion",
    "Coordinar anticipo y condiciones comerciales con administracion",
    "Confirmar medidas finales y restricciones de instalacion del espacio",
    "Actualizar CRM con etapa, probabilidad y siguiente accion comprometida",
    "Comunicar cambios de alcance al equipo de diseno y produccion",
    "Gestionar aprobacion del cliente sobre propuesta final",
    "Dar seguimiento a proveedor externo para componente especial",
    "Revisar margen estimado antes de cerrar negociacion",
    "Programar entrega tentativa con operaciones y cliente",
    "Resolver objeciones comerciales sobre precio, plazo y alcance",
    "Documentar acuerdos finales para handoff a operaciones",
    "Monitorear riesgo de retraso por materiales pendientes",
    "Preparar reporte semanal de oportunidades y pedidos mixtos",
  ];
  return {
    selectedAreas: ["Venta"],
    customAreas: [],
    responsibilities: [
      {
        id: "resp-c312-venta",
        text: "Gestionar oportunidades comerciales y pedidos mixtos hasta su traspaso operativo",
        primaryArea: "Venta",
        areaAssignmentMode: "user_selected_from_declared_areas",
        activities: activities.map((text, index) => ({ id: `act-c312-${String(index + 1).padStart(2, "0")}`, text })),
      },
    ],
    guideSeen: { area: true, responsibility: true, activity: true, save: true },
    saveAttempts: 1,
    fieldValidationState: {},
    isSaved: true,
    isReviewMode: false,
    savedWithWarnings: false,
    startPositionContext: { fullName: "Participante C312 Smoke", roleTitle: "Ejecutiva Comercial Smoke" },
  };
}

async function ensureAuthUser(client, email, password, name) {
  const existing = (await findAuthUsers(client, [email]))[0];
  if (existing?.id) {
    const { error } = await client.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { name, fixture_id: FIXTURE_ID } });
    if (error) throw new Error(`auth_update_failed:${error.message}`);
    return { userId: existing.id, created: false };
  }
  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, fixture_id: FIXTURE_ID } });
  if (error || !data?.user?.id) throw new Error(`auth_create_failed:${error?.message ?? "missing_user"}`);
  return { userId: data.user.id, created: true };
}

async function findAuthUsers(client, emails) {
  const normalized = new Set(emails.map((email) => email.toLowerCase()));
  const found = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`auth_list_failed:${error.message}`);
    for (const user of data?.users ?? []) if (normalized.has((user.email ?? "").toLowerCase())) found.push(user);
    if (!data?.users?.length || data.users.length < 200) break;
  }
  return found;
}

async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.session?.access_token) throw new Error(`signin_failed:${email}`);
  return data.session;
}

function authedClient(env, token) {
  return createClient(env.url, env.anonKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
}

async function rpcSingle(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name}_failed:${error.message}`);
  return Array.isArray(data) ? data[0] : data;
}

async function rpcRows(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name}_failed:${error.message}`);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

async function rpcFirst(client, name, args) {
  const value = await rpcSingle(client, name, args);
  if (!value) throw new Error(`${name}_returned_empty`);
  return value;
}

async function insertSingle(client, table, row, select = "*") {
  const { data, error } = await client.from(table).insert(row).select(select).single();
  if (error) throw new Error(`${table}_insert_failed:${error.message}`);
  return data;
}

async function resolveToolVersionId(client) {
  const { data, error } = await client
    .from("versiones_herramienta")
    .select("id")
    .limit(1);
  if (error) throw new Error(`tool_version_lookup_failed:${error.message}`);
  if (!data?.[0]?.id) throw new Error("tool_version_missing");
  return data[0].id;
}

async function ensureCompany(client) {
  const existing = await maybeSingleBy(client, "empresas", "nombre", "C312 Smoke Conformance Company");
  if (existing) return existing;
  return insertSingle(client, "empresas", { nombre: "C312 Smoke Conformance Company" }, "id,nombre");
}

async function ensureRelationship(client, actorUserId, companyId) {
  const { data, error } = await client
    .from("client_relationships")
    .select("id")
    .eq("client_company_id", companyId)
    .eq("display_name", "C312 Smoke Engagement")
    .limit(1);
  if (error) throw new Error(`relationship_lookup_failed:${error.message}`);
  if (data?.[0]?.id) return data[0].id;
  return rpcSingle(client, "eve_admin_create_client_relationship", {
    p_actor_user_id: actorUserId,
    p_client_company_id: companyId,
    p_display_name: "C312 Smoke Engagement",
    p_valid_from: new Date(Date.now() - 60_000).toISOString(),
    p_valid_until: null,
  });
}

async function ensureCase(client, { consultantUsuarioId, toolVersionId, companyId, relationshipId }) {
  const { data, error } = await client
    .from("sesiones_llenado")
    .select("id,display_name,client_company_id,client_relationship_id")
    .eq("client_company_id", companyId)
    .eq("client_relationship_id", relationshipId)
    .eq("display_name", "C312 Smoke Case")
    .limit(1);
  if (error) throw new Error(`case_lookup_failed:${error.message}`);
  if (data?.[0]?.id) return data[0];
  return insertSingle(client, "sesiones_llenado", {
    usuario_id: consultantUsuarioId,
    version_herramienta_id: toolVersionId,
    display_name: "C312 Smoke Case",
    estado_actual: "capa_1_triple",
    porcentaje_avance: 0,
    client_company_id: companyId,
    client_relationship_id: relationshipId,
  }, "id,display_name,client_company_id,client_relationship_id");
}

async function ensureUsuario(client, row) {
  const existing = await maybeSingleBy(client, "usuarios", "email", row.email);
  if (existing) return existing;
  return insertSingle(client, "usuarios", row, "id,email,auth_user_id");
}

async function maybeSingle(client, table, field, value) { return maybeSingleBy(client, table, field, value); }
async function maybeSingleBy(client, table, field, value) {
  const { data, error } = await client.from(table).select("*").eq(field, value).maybeSingle();
  if (error) throw new Error(`${table}_select_failed:${error.message}`);
  return data;
}

async function selectEq(client, table, field, value) {
  const { data, error } = await client.from(table).select("*").eq(field, value);
  if (error) throw new Error(`${table}_select_failed:${error.message}`);
  return data ?? [];
}

async function selectIn(client, table, field, values) {
  if (!values.length) return [];
  const { data, error } = await client.from(table).select("*").in(field, values);
  if (error) throw new Error(`${table}_select_in_failed:${error.message}`);
  return data ?? [];
}

async function selectContains(client, table, field, value) {
  const { data, error } = await client.from(table).select("*").contains(field, value);
  if (error) throw new Error(`${table}_contains_failed:${error.message}`);
  return data ?? [];
}

async function latestSelection(client, caseId) {
  const { data, error } = await client.from("activity_selection_results").select("*").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`selection_lookup_failed:${error.message}`);
  return data;
}

async function firstSelectionItem(client, resultId) {
  const { data, error } = await client.from("activity_selection_result_items").select("*").eq("result_id", resultId).eq("classification", "primary").order("selected_slot", { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error(`selection_item_lookup_failed:${error.message}`);
  return data;
}

async function firstActivePosition(client, participantId) {
  const { data, error } = await client
    .from("case_participant_positions")
    .select("*")
    .eq("case_participant_id", participantId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`position_lookup_failed:${error.message}`);
  return data;
}

async function deleteIn(client, table, field, values) {
  if (!values.length) return { deleted: 0 };
  const { error, count } = await client.from(table).delete({ count: "exact" }).in(field, values);
  if (error) throw new Error(`${table}_delete_failed:${error.message}`);
  return { deleted: count ?? values.length };
}

async function resetFixtureInvitations(client, invitationIds) {
  const { error, count } = await client
    .from("participant_invitations")
    .update({
      status: "sent",
      accepted_at: null,
      accepted_user_id: null,
      revoked_at: null,
      failed_at: null,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      metadata: fixtureMetadata({
        entity: "participant_invitation",
        declared_position: "Ejecutiva Comercial Smoke",
        declared_position_source: "sponsor",
        test_fixture: true,
        excluded_from_metrics: true,
        cleanup_strategy: "deterministic_reusable_fixture",
      }),
    }, { count: "exact" })
    .in("id", invitationIds);
  if (error) return { preserved: invitationIds.length, reason: safeError(error) };
  return { reset: count ?? invitationIds.length, strategy: "deterministic_reusable_fixture" };
}

async function deleteUsersIndividually(client, userIds) {
  let deleted = 0;
  const preserved = [];
  for (const userId of userIds) {
    const { error } = await client.from("usuarios").delete().eq("id", userId);
    if (error) preserved.push({ userId: mask(userId), reason: safeError(error) });
    else deleted += 1;
  }
  return { deleted, preserved };
}

async function postJson(url, token, body) {
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`post_failed:${new URL(url).pathname}:${res.status}:${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

async function postServiceJson(url, serviceKey, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`service_post_failed:${new URL(url).pathname}:${res.status}:${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

async function getJson(url, token) {
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`get_failed:${new URL(url).pathname}:${res.status}:${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function mask(value) { const s = String(value ?? ""); return s.length <= 8 ? "****" : `${s.slice(0, 4)}...${s.slice(-4)}`; }
function safeError(error) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "unknown_error";
  return message
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "sb_secret_***")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "sb_publishable_***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
}
function maskFixture(value) {
  return JSON.parse(JSON.stringify(value, (key, val) => /password|token|key|hash/i.test(key) ? "***" : (typeof val === "string" && /^[0-9a-f-]{30,}$/i.test(val) ? mask(val) : val)));
}
function print(value) { console.log(JSON.stringify(value, null, 2)); }
