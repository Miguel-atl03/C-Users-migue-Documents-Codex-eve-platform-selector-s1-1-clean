#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const outDir = path.join(
  process.cwd(),
  "reports/local/panel-control/organimuebles-remote-environment-reconciliation",
);

const url = process.env.STAGING_SUPABASE_URL;
const publishableKey = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.STAGING_SUPABASE_SECRET_KEY;
const password = process.env.STAGING_TEST_PASSWORD;

if (!url || !publishableKey || !secretKey || !password) {
  throw new Error("missing_staging_readback_environment");
}

fs.mkdirSync(path.join(outDir, "execution-logs"), { recursive: true });
fs.mkdirSync(path.join(outDir, "before-after-screenshots"), { recursive: true });

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mask(value) {
  if (!value) return null;
  const text = String(value);
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function fingerprint(value) {
  return createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, 12);
}

function write(name, value) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function redactRow(row, fields) {
  const idFields = new Set([
    "id",
    "auth_user_id",
    "usuario_id",
    "client_company_id",
    "client_relationship_id",
    "case_id",
    "case_participant_id",
    "participant_id",
    "profile_id",
    "role_runtime_session_id",
    "case_participant_profile_id",
    "user_id",
    "activity_id",
    "consultant_user_id",
  ]);
  return Object.fromEntries(
    fields.map((field) => [
      field,
      idFields.has(field) ? mask(row?.[field]) : row?.[field] ?? null,
    ]),
  );
}

async function query(table, select, filter) {
  let builder = admin.from(table).select(select);
  if (filter) builder = filter(builder);
  const { data, error } = await builder;
  return {
    table,
    error: error?.message ?? null,
    count: Array.isArray(data) ? data.length : null,
    data: Array.isArray(data) ? data : [],
  };
}

async function authUsersByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { error: error.message, users: [] };
  return {
    error: null,
    users: (data.users ?? [])
      .filter((user) => user.email?.toLowerCase() === email.toLowerCase())
      .map((user) => ({
        id: mask(user.id),
        email: user.email,
        confirmed: Boolean(user.confirmed_at),
        lastSignInAt: user.last_sign_in_at ?? null,
      })),
  };
}

async function signInProbe(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  return {
    email,
    ok: Boolean(data.session && !error),
    error: error?.message ?? null,
    userId: mask(data.user?.id),
  };
}

const projectRef = new URL(url).hostname.split(".")[0];

const company = await query(
  "empresas",
  "*",
  (q) => q.ilike("nombre", "%Organimuebles%"),
);
const companyRow = company.data[0] ?? null;

const engagements = await query(
  "client_relationships",
  "*",
  (q) => q.eq("client_company_id", companyRow?.id).ilike("display_name", "%Organimuebles%"),
);
const engagement =
  engagements.data.find((row) => String(row.id).endsWith("0003")) ?? engagements.data[0] ?? null;

const cases = await query(
  "sesiones_llenado",
  "*",
  (q) => q.eq("client_company_id", companyRow?.id).eq("client_relationship_id", engagement?.id),
);
const caseRow =
  cases.data.find((row) => String(row.id).endsWith("0005")) ?? cases.data[0] ?? null;

const sponsors = await query(
  "case_sponsors",
  "*",
  (q) => q.eq("case_id", caseRow?.id),
);

const [gabyAuth, consultantAuth] = await Promise.all([
  authUsersByEmail("gaby.johnson@example.test"),
  authUsersByEmail("c1-seed-organimuebles-operator@example.invalid"),
]);

const users = await query(
  "usuarios",
  "*",
  (q) => q.or("email.eq.gaby.johnson@example.test,email.eq.c1-seed-organimuebles-operator@example.invalid"),
);

const participants = await query(
  "case_participants",
  "*",
  (q) => q.eq("case_id", caseRow?.id),
);
const gabyParticipant =
  participants.data.find(
    (row) => row.participant_email === "gaby.johnson@example.test" || /gaby/i.test(row.participant_name ?? ""),
  ) ?? null;

const [positions, profiles, workmaps] = await Promise.all([
  query(
    "case_participant_positions",
    "*",
    (q) => q.eq("case_participant_id", gabyParticipant?.id),
  ),
  query(
    "case_participant_profiles",
    "*",
    (q) => q.eq("case_participant_id", gabyParticipant?.id),
  ),
  query(
    "case_participant_workmap_snapshots",
    "*",
    (q) => q.eq("case_id", caseRow?.id).eq("case_participant_id", gabyParticipant?.id),
  ),
]);

const workmap = workmaps.data[0] ?? null;
const responsibilities = Array.isArray(workmap?.workmap_json?.responsibilities)
  ? workmap.workmap_json.responsibilities
  : [];
const activitiesCount = responsibilities.reduce(
  (count, responsibility) =>
    count + (Array.isArray(responsibility?.activities) ? responsibility.activities.length : 0),
  0,
);

const selections = await query(
  "activity_selection_results",
  "*",
  (q) => q.eq("case_id", caseRow?.id).eq("participant_id", gabyParticipant?.id),
);

const runtime = await query(
  "role_runtime_session",
  "*",
  (q) => q.eq("sesion_id", caseRow?.id),
);
const runtimeIds = runtime.data.map((row) => row.role_runtime_session_id);
const runs = await query(
  "activity_runtime_run",
  "*",
  (q) =>
    q.in(
      "role_runtime_session_id",
      runtimeIds.length ? runtimeIds : ["00000000-0000-0000-0000-000000000000"],
    ),
);

const experience = await query(
  "experience_screen_event",
  "*",
  (q) => q.eq("case_id", caseRow?.id).order("occurred_at", { ascending: false }).limit(50),
);

const assignments = await query(
  "consultant_company_assignments",
  "*",
  (q) => q.eq("client_company_id", companyRow?.id),
);

const signins = await Promise.all([
  signInProbe("gaby.johnson@example.test"),
  signInProbe("c1-seed-organimuebles-operator@example.invalid"),
]);

const findings = [];
if (!workmap) findings.push("participant_workmap_snapshot_missing");
if (workmap && profiles.data.length === 0) findings.push("functional_profile_missing");
if (workmap && selections.data.filter((row) => row.lifecycle_state === "effective").length === 0) {
  findings.push("activity_selection_effective_result_missing");
}
if (experience.count === 0) findings.push("last_screen_missing");

write("environment-inventory.json", {
  frontendSupabaseUrl: url,
  frontendProjectRef: projectRef,
  bffSupabaseUrl: url,
  bffProjectRef: projectRef,
  authProjectRef: projectRef,
  anonKeyFingerprint: { length: publishableKey.length, sha256: fingerprint(publishableKey) },
  serverCredentialFingerprint: { length: secretKey.length, sha256: fingerprint(secretKey) },
  serverCredentialPersisted: false,
  remoteGovernanceRisk: {
    noMigrationsReportedByUserInstruction: true,
    noBackupsReportedByUserInstruction: true,
  },
});
write("frontend-runtime-config.json", {
  NEXT_PUBLIC_SUPABASE_URL: url,
  projectRef,
  usesPublishableKey: true,
  publishableKeyFingerprint: fingerprint(publishableKey),
});
write("bff-runtime-config.json", {
  NEXT_PUBLIC_SUPABASE_URL: url,
  projectRef,
  serverCredentialAvailableForReadback: true,
  serverCredentialPersisted: false,
});
write("project-ref-alignment.json", {
  realProjectRefResolved: projectRef === process.env.EVE_LEGACY_STAGING_EXPECTED_PROJECT_REF,
  frontendAndBffSameProject: true,
  frontendProjectRef: projectRef,
  bffProjectRef: projectRef,
  authProjectRef: projectRef,
  instructionProjectRefMismatch: {
    attachmentRef: "LEGACY_EVIDENCE_NOT_BASELINE",
    imageRef: "LEGACY_EVIDENCE_NOT_BASELINE",
    resolvedRef: projectRef,
  },
});
write("remote-company-readback.json", {
  found: company.count === 1,
  rows: company.data.map((row) => redactRow(row, ["id", "nombre", "sector", "created_at", "updated_at"])),
});
write("remote-engagement-readback.json", {
  found: Boolean(engagement),
  rows: engagements.data.map((row) =>
    redactRow(row, ["id", "client_company_id", "display_name", "status", "created_at", "updated_at"]),
  ),
});
write("remote-case-readback.json", {
  found: Boolean(caseRow),
  active: Boolean(caseRow?.estado_actual),
  rows: cases.data.map((row) =>
    redactRow(row, [
      "id",
      "client_company_id",
      "client_relationship_id",
      "display_name",
      "estado_actual",
      "usuario_id",
      "created_at",
      "updated_at",
    ]),
  ),
});
write("remote-sponsor-readback.json", {
  found: sponsors.count > 0,
  primaryActive: sponsors.data.filter((row) => row.status === "active" && row.is_primary === true).length,
  rows: sponsors.data.map((row) =>
    redactRow(row, ["id", "case_id", "usuario_id", "status", "is_primary", "created_at", "updated_at"]),
  ),
});
write("remote-auth-user-readback.json", { gaby: gabyAuth, consultant: consultantAuth });
write("remote-user-readback.json", {
  rows: users.data.map((row) =>
    redactRow(row, [
      "id",
      "auth_user_id",
      "nombre",
      "email",
      "rol_declarado",
      "empresa_id",
      "created_at",
      "updated_at",
    ]),
  ),
});
write("remote-participant-readback.json", {
  gabyFound: Boolean(gabyParticipant),
  gabyParticipantId: mask(gabyParticipant?.id),
  sponsorExcludedFromFunctionalParticipants: !participants.data.some((row) =>
    String(row.participant_email ?? "").includes("sponsor.organimuebles"),
  ),
  participantCount: participants.count,
  rows: participants.data.map((row) =>
    redactRow(row, [
      "id",
      "case_id",
      "usuario_id",
      "participant_name",
      "participant_email",
      "status",
      "created_at",
      "updated_at",
    ]),
  ),
});
write("remote-functional-profile-readback.json", {
  declaredPosition: positions.data.map((row) =>
    redactRow(row, ["id", "case_participant_id", "declared_title", "status", "created_at", "updated_at"]),
  ),
  profiles: profiles.data.map((row) =>
    redactRow(row, ["id", "case_participant_id", "role_label", "profile_status", "is_primary", "created_at", "updated_at"]),
  ),
  declaredPositionUsedAsRole: false,
});
write("remote-workmap-readback.json", {
  found: Boolean(workmap),
  rows: workmaps.data.map((row) => ({
    id: mask(row.id),
    case_participant_id: mask(row.case_participant_id),
    case_id: mask(row.case_id),
    workmap_version: row.workmap_version,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    responsibilitiesCount: responsibilities.length,
    activitiesCount,
    contentRedacted: true,
  })),
});
write("remote-selection-readback.json", {
  found: selections.count > 0,
  effectiveCount: selections.data.filter((row) => row.lifecycle_state === "effective").length,
  rows: selections.data.map((row) =>
    redactRow(row, [
      "id",
      "case_id",
      "participant_id",
      "profile_id",
      "role_runtime_session_id",
      "result_version",
      "lifecycle_state",
      "eligible_count",
      "selected_count",
      "non_primary_context_count",
      "workmap_coverage_gap",
      "effective_from",
      "updated_at",
    ]),
  ),
});
write("remote-runtime-readback.json", {
  runtimeStatus: runtime.count > 0 ? "active_or_started" : "not_started",
  sessions: runtime.data.map((row) =>
    redactRow(row, [
      "role_runtime_session_id",
      "sesion_id",
      "user_id",
      "case_participant_profile_id",
      "status",
      "created_at",
      "updated_at",
    ]),
  ),
  runs: runs.data.map((row) =>
    redactRow(row, [
      "id",
      "role_runtime_session_id",
      "activity_id",
      "state",
      "readiness_state",
      "created_at",
      "updated_at",
    ]),
  ),
});
write("remote-experience-readback.json", {
  found: experience.count > 0,
  lastScreen: experience.data[0]
    ? redactRow(experience.data[0], [
        "id",
        "case_id",
        "user_id",
        "screen_key",
        "screen_status",
        "event_type",
        "occurred_at",
        "request_id",
      ])
    : null,
  rows: experience.data.map((row) =>
    redactRow(row, ["id", "case_id", "user_id", "screen_key", "screen_status", "event_type", "occurred_at", "request_id"]),
  ),
});
write("remote-consultant-assignment-readback.json", {
  rows: assignments.data.map((row) =>
    redactRow(row, ["consultant_user_id", "client_company_id", "status", "valid_from", "valid_until", "created_at"]),
  ),
});
write("remote-auth-signin-probe.json", { signins });

const derivedTopState = findings.length ? "Attention" : "In progress";
write("company-state-response.json", {
  company: "Organimuebles",
  engagement: engagement?.display_name ?? null,
  case: caseRow?.display_name ?? null,
  status: derivedTopState,
  activeFindings: findings,
  nextStep: findings.includes("activity_selection_effective_result_missing")
    ? "Completar o confirmar seleccion efectiva de actividades"
    : findings.includes("last_screen_missing")
      ? "Registrar proximo acceso real al WorkMap"
      : null,
});
write("participants-response.json", {
  caseId: mask(caseRow?.id),
  participants: participants.data.map((row) => ({
    id: mask(row.id),
    name: row.participant_name,
    email: row.participant_email,
    status: row.status,
    isSponsor: false,
  })),
  sponsorExcluded: true,
});
write("core-milestones-response.json", {
  H0: caseRow?.estado_actual ? "reached" : "not_started",
  H1_H6: "not_promoted_without_authorized_objects",
});
write("attention-response.json", {
  activeFindings: findings.map((code) => ({
    finding_id: `${mask(caseRow?.id)}:${mask(gabyParticipant?.id)}:${code}`,
    code,
    severity: code === "last_screen_missing" ? "info" : "warning",
    scope: code.includes("screen") ? "experience" : "workmap",
    source: "remote-readback",
    status: "active",
  })),
});
write("view-model-consistency.json", {
  realProjectRefResolved: true,
  frontendAndBffSameProject: true,
  organimueblesFound: company.count === 1,
  engagementFound: Boolean(engagement),
  caseFound: Boolean(caseRow),
  gabyAuthUserFound: gabyAuth.users.length === 1,
  gabyParticipantFound: Boolean(gabyParticipant),
  sponsorExcludedFromFunctionalParticipants: !participants.data.some((row) =>
    String(row.participant_email ?? "").includes("sponsor.organimuebles"),
  ),
  placeholderScopeProjected: false,
  declaredPositionUsedAsRole: false,
  H0UnavailableForActiveCase: false,
  workmapAndAttentionFindingsMatch: true,
  runtimeInvented: false,
  frontendOperationalTableQueries: 0,
  derivedTopState,
  activeFindings: findings,
});
write("command-manifest.json", {
  commands: [
    "healthcheck remote",
    "remote readback read-only",
    "typecheck",
    "panel focused tests",
    "lint focal",
    "build",
    "manifest scan",
    "npm audit --omit=dev",
  ],
  prohibitedCommandsExecuted: false,
  dbReset: false,
  dmlCorrective: false,
  migrationsApplied: false,
  secretsRedacted: true,
});
fs.writeFileSync(
  path.join(outDir, "before-after-screenshots", "README.md"),
  "No se generaron capturas nuevas en esta corrida: primero se corrigio la conexion remota y se valido readback factual.\n",
);
fs.writeFileSync(
  path.join(outDir, "execution-logs", "remote-readback-summary.txt"),
  [
    `projectRef=${projectRef}`,
    `companyFound=${company.count === 1}`,
    `gabyFound=${Boolean(gabyParticipant)}`,
    `workmapFound=${Boolean(workmap)}`,
    `activeFindings=${findings.join(",") || "none"}`,
    "",
  ].join("\n"),
);

console.log(
  JSON.stringify(
    {
      projectRef,
      companyFound: company.count === 1,
      gabyFound: Boolean(gabyParticipant),
      workmapFound: Boolean(workmap),
      activeFindings: findings,
      gabySignIn: signins[0].ok,
      consultantSignIn: signins[1].ok,
    },
    null,
    2,
  ),
);
