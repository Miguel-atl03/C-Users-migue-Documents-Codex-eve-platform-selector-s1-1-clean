import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-r2a-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

const {
  aggregateProfileResolution,
  toUiResolutionStatus,
  assertConsultantCaseParticipantAccess,
  buildCaseParticipantsResponse,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-participants-service.ts",
    ),
  ).href
);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

test("migración R2A crea participantes, perfiles, RLS y anti-reasignación silenciosa", () => {
  const migration = read(
    "supabase/migrations/20260715200000_eve_official_control_panel_tramo_r2a_case_participants.sql",
  );
  assert.match(migration, /create table public\.case_participants/);
  assert.match(migration, /create table public\.case_participant_profiles/);
  assert.match(migration, /silent_profile_reassignment_forbidden/);
  assert.match(migration, /eve_admin_reassign_case_participant_profile/);
  assert.doesNotMatch(migration, /19fc9eff-4219-43f0-854c-e2b3350f23f2/);
  // Admin RPCs insert at runtime; migration must not seed Amber participants.
  assert.doesNotMatch(
    migration,
    /insert into public\.case_participants[\s\S]{0,400}'19fc9eff/,
  );

  const affiliationFix = read(
    "supabase/migrations/20260715201000_eve_official_control_panel_r2a_drop_participant_company_affiliation.sql",
  );
  assert.match(
    affiliationFix,
    /drop function if exists public\.eve_enforce_case_participant_company_scope/,
  );
  assert.match(
    affiliationFix,
    /MUST NOT be required to equal sesiones_llenado\.client_company_id/,
  );
});

test("inspector R2 no fuerza factual=false artificialmente", () => {
  const inspector = read(
    "scripts/eve/official-control-panel/inspect-tramo-r2-case-participants.mjs",
  );
  assert.doesNotMatch(inspector, /factualCaseToUser\s*=\s*[^\n]*&&\s*false/);
  assert.doesNotMatch(
    inspector,
    /factualUserToProfile\s*=\s*[^\n]*&&\s*false/,
  );
  assert.doesNotMatch(
    inspector,
    /factualCaseToParticipant\s*=\s*[^\n]*&&\s*false/,
  );
  assert.match(inspector, /factualCaseToParticipant/);
  assert.match(inspector, /factualParticipantToProfile/);
  assert.match(inspector, /sessionOwnerIsNotParticipantContract/);
  assert.match(inspector, /TRAMO_R2A_PERSISTENCE_PRESENT/);
});

test("aggregateProfileResolution distingue vacío, resolved, partial, unresolved", () => {
  assert.equal(aggregateProfileResolution([]), "unavailable");
  assert.equal(
    aggregateProfileResolution([
      { resolutionStatus: "resolved" },
      { resolutionStatus: "resolved" },
    ]),
    "resolved",
  );
  assert.equal(
    aggregateProfileResolution([
      { resolutionStatus: "resolved" },
      { resolutionStatus: "mixed_unresolved" },
    ]),
    "partial",
  );
  assert.equal(
    aggregateProfileResolution([
      { resolutionStatus: "reentry_required" },
      { resolutionStatus: "unavailable" },
    ]),
    "unresolved",
  );
  assert.equal(toUiResolutionStatus("mixed_unresolved"), "mixed-unresolved");
});

test("BFF routes existen sin exponer email", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/route.ts",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/route.ts",
      ),
    ),
  );
  const participantsRoute = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/route.ts",
  );
  assert.doesNotMatch(participantsRoute, /email/);
  assert.match(participantsRoute, /participación solicitada/);
});

test("acceso deniega participante/perfil ajeno sin fuga", async () => {
  const contextRepo = {
    async findAssignment() {
      return {
        id: "a1",
        consultantUserId: "cons",
        companyId: "co1",
        status: "enabled",
        validFrom: "2020-01-01T00:00:00.000Z",
        validUntil: null,
      };
    },
    async findRelationship() {
      return {
        id: "r1",
        companyId: "co1",
        status: "enabled",
        validFrom: "2020-01-01T00:00:00.000Z",
        validUntil: null,
      };
    },
    async findCase() {
      return {
        id: "c1",
        companyId: "co1",
        relationshipId: "r1",
      };
    },
  };
  const participantsRepo = {
    async findParticipantById(id) {
      if (id === "p-ok") {
        return {
          id: "p-ok",
          caseId: "c1",
          userId: "u1",
          displayLabel: "Persona test",
          participationStatus: "active",
          validFrom: "2026-01-01",
          validUntil: null,
          enabled: true,
        };
      }
      return {
        id: "p-other",
        caseId: "other-case",
        userId: "u2",
        displayLabel: "Ajeno",
        participationStatus: "active",
        validFrom: "2026-01-01",
        validUntil: null,
        enabled: true,
      };
    },
    async findProfileById() {
      return null;
    },
    async listEnabledParticipantsByCase() {
      return [];
    },
    async listEnabledProfilesByParticipant() {
      return [];
    },
  };

  const denied = await assertConsultantCaseParticipantAccess(
    contextRepo,
    participantsRepo,
    {
      consultantUserId: "cons",
      companyId: "co1",
      relationshipId: "r1",
      caseId: "c1",
      participantId: "p-other",
    },
  );
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.message, "No fue posible abrir la participación solicitada.");
  }

  const empty = await buildCaseParticipantsResponse(participantsRepo, "c1");
  assert.deepEqual(empty, []);
});

test("dictamen de afiliación empresarial existe y niega igualdad obligatoria", () => {
  const dictamen = read(
    "docs/eve/panel-control/R2A_PARTICIPANT_COMPANY_AFFILIATION_DICTAMEN.md",
  );
  assert.match(dictamen, /Regla no confirmada/);
  assert.match(dictamen, /UNIT_2A_DATA_AUTHORIZATION/);
  assert.match(dictamen, /R2B: aceptado/);
  assert.doesNotMatch(dictamen, /R2B: no iniciado/);
  assert.match(
    dictamen,
    /Basta participación explícita y autorizada/,
  );
});

test("KPI no activados; scripts y docs R2A existen; shell R2B puede montar panel", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /CaseParticipantsPanel/);
  const strip = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  assert.match(strip, /—/);
  assert.doesNotMatch(strip, /profileCount/);

  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/manage-case-participants.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-tramo-r2a-integrity.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/TRAMO_R2A_CASE_PARTICIPANT_PERSISTENCE.md",
      ),
    ),
  );
  assert.ok(
    readdirSync(resolve(projectRoot, "supabase/migrations")).some((n) =>
      /tramo_r2a_case_participants/.test(n),
    ),
  );
});
