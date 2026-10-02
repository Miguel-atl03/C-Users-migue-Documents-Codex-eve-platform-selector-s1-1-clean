import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-unit2a-path-hook.mjs");
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
  assertConsultantClientContextAccess,
  isContextRecordEffective,
  presentCaseStatus,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-context-service.ts",
    ),
  ).href
);

const COMPANY_A = "10000000-0000-4000-8000-000000000001";
const COMPANY_B = "10000000-0000-4000-8000-000000000002";
const CONSULTANT_A = "20000000-0000-4000-8000-000000000001";
const CONSULTANT_B = "20000000-0000-4000-8000-000000000002";
const RELATIONSHIP_A = "30000000-0000-4000-8000-000000000001";
const RELATIONSHIP_B = "30000000-0000-4000-8000-000000000002";
const CASE_A = "40000000-0000-4000-8000-000000000001";
const CASE_CROSS_COMPANY = "40000000-0000-4000-8000-000000000002";

function currentRecord(overrides = {}) {
  return {
    status: "enabled",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: null,
    ...overrides,
  };
}

function createRepository() {
  return {
    async findAssignment(consultantUserId, companyId) {
      if (consultantUserId !== CONSULTANT_A || companyId !== COMPANY_A) {
        return null;
      }
      return {
        consultantUserId,
        companyId,
        ...currentRecord(),
      };
    },
    async findRelationship(relationshipId) {
      if (relationshipId === RELATIONSHIP_A) {
        return {
          id: relationshipId,
          companyId: COMPANY_A,
          ...currentRecord(),
        };
      }
      if (relationshipId === RELATIONSHIP_B) {
        return {
          id: relationshipId,
          companyId: COMPANY_B,
          ...currentRecord(),
        };
      }
      return null;
    },
    async findCase(caseId) {
      if (caseId === CASE_A) {
        return {
          id: caseId,
          companyId: COMPANY_A,
          relationshipId: RELATIONSHIP_A,
        };
      }
      if (caseId === CASE_CROSS_COMPANY) {
        return {
          id: caseId,
          companyId: COMPANY_B,
          relationshipId: RELATIONSHIP_A,
        };
      }
      return null;
    },
    async listCompanies() {
      return [{ id: COMPANY_A, label: "Empresa autorizada" }];
    },
    async listRelationships() {
      return [{ id: RELATIONSHIP_A, label: "Relación verificada" }];
    },
    async listCases() {
      return [
        {
          id: CASE_A,
          label: "Caso verificado",
          statusLabel: "Recopilación inicial",
        },
      ];
    },
  };
}

test("vigencia mínima respeta estado y ventana temporal", () => {
  const at = new Date("2026-07-15T12:00:00.000Z");
  assert.equal(isContextRecordEffective(currentRecord(), at), true);
  assert.equal(
    isContextRecordEffective(currentRecord({ status: "disabled" }), at),
    false,
  );
  assert.equal(
    isContextRecordEffective(
      currentRecord({ validFrom: "2026-07-16T00:00:00.000Z" }),
      at,
    ),
    false,
  );
  assert.equal(
    isContextRecordEffective(
      currentRecord({ validUntil: "2026-07-14T23:59:59.000Z" }),
      at,
    ),
    false,
  );
});

test("autorización acumulativa acepta solo empresa, relación y caso vinculados", async () => {
  const result = await assertConsultantClientContextAccess(createRepository(), {
    consultantUserId: CONSULTANT_A,
    companyId: COMPANY_A,
    relationshipId: RELATIONSHIP_A,
    caseId: CASE_A,
    at: new Date("2026-07-15T12:00:00.000Z"),
  });
  assert.deepEqual(result, { ok: true });
});

test("consultor ajeno no amplía scope manipulando IDs", async () => {
  const repository = createRepository();
  const deniedCompany = await assertConsultantClientContextAccess(repository, {
    consultantUserId: CONSULTANT_B,
    companyId: COMPANY_A,
  });
  const deniedRelationship = await assertConsultantClientContextAccess(repository, {
    consultantUserId: CONSULTANT_A,
    companyId: COMPANY_A,
    relationshipId: RELATIONSHIP_B,
  });
  const deniedCase = await assertConsultantClientContextAccess(repository, {
    consultantUserId: CONSULTANT_A,
    companyId: COMPANY_A,
    relationshipId: RELATIONSHIP_A,
    caseId: "40000000-0000-4000-8000-000000000099",
  });
  const deniedCrossCompanyCase =
    await assertConsultantClientContextAccess(repository, {
      consultantUserId: CONSULTANT_A,
      companyId: COMPANY_A,
      relationshipId: RELATIONSHIP_A,
      caseId: CASE_CROSS_COMPANY,
    });

  for (const result of [
    deniedCompany,
    deniedRelationship,
    deniedCase,
    deniedCrossCompanyCase,
  ]) {
    assert.equal(result.ok, false);
    assert.equal(result.code, "context_access_denied");
    assert.equal(result.message, "No fue posible abrir el contexto solicitado.");
    assert.equal(JSON.stringify(result).includes("Empresa autorizada"), false);
  }
});

test("estados reales se traducen sin exponer estado técnico desconocido", () => {
  assert.equal(presentCaseStatus("capa_1_triple"), "Recopilación inicial");
  assert.equal(presentCaseStatus("completado"), "Completado");
  assert.equal(presentCaseStatus("ReadyForTransduction"), null);
  assert.equal(presentCaseStatus(null), null);
});

test("migración crea integridad, índices, RLS y administración fail-closed", () => {
  const migration = read(
    "supabase/migrations/20260715073000_eve_official_control_panel_unit2a_context.sql",
  );

  for (const expected of [
    "create table public.consultant_company_assignments",
    "create table public.client_relationships",
    "add column client_company_id uuid",
    "add column client_relationship_id uuid",
    "sesiones_llenado_relationship_company_fkey",
    "references public.client_relationships (id, client_company_id)",
    "sesiones_llenado_explicit_context_check",
    "case_relationship_company_mismatch",
    "consultant_company_assignments_no_overlapping_enabled",
    "client_relationships_company_validity_idx",
    "sesiones_llenado_client_relationship_idx",
    "enable row level security",
    "force row level security",
    "empresas_consultant_assigned_select",
    "sesiones_llenado_consultant_assigned_select",
    "eve_consultant_has_company_access",
    "eve_consultant_can_access_relationship",
    "eve_consultant_can_access_case",
    "eve_verify_official_context_integrity",
    "eve_require_official_context_admin",
    "to service_role",
  ]) {
    assert.ok(migration.includes(expected), `Missing migration contract: ${expected}`);
  }

  assert.doesNotMatch(
    migration,
    /grant\s+(insert|update|delete)[^;]*to\s+authenticated/i,
  );
  assert.doesNotMatch(migration, /create\s+policy[\s\S]*?using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(migration, /Cervecería|Ámbar|fixture/i);
});

test("BFF mínimo existe, es no-store y no importa legacy", () => {
  const routes = [
    "src/app/api/eve/official-consultant-control-panel/client-companies/route.ts",
    "src/app/api/eve/official-consultant-control-panel/client-companies/[companyId]/relationships/route.ts",
    "src/app/api/eve/official-consultant-control-panel/relationships/[relationshipId]/cases/route.ts",
  ];

  for (const path of routes) {
    assert.equal(existsSync(resolve(projectRoot, path)), true, `Missing ${path}`);
    const source = read(path);
    assert.match(source, /private, no-store/);
    assert.doesNotMatch(source, /components\/consultant\/control-panel/);
    assert.doesNotMatch(source, /consultant-control-panel-service/);
    assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
  }
});

test("contratos BFF contienen solo opciones operativas mínimas", () => {
  const contracts = read(
    "src/services/eve/official-control-panel/official-control-panel-context.types.ts",
  );
  assert.match(contracts, /ClientCompanyOption[\s\S]*id: string;[\s\S]*label: string;/);
  assert.match(
    contracts,
    /ClientRelationshipOption[\s\S]*id: string;[\s\S]*label: string;/,
  );
  assert.match(
    contracts,
    /ClientCaseOption[\s\S]*id: string;[\s\S]*label: string;[\s\S]*statusLabel: string \| null;/,
  );
  assert.doesNotMatch(contracts, /ReadyForTransduction|ObjectState|CasoDiagnosticoEVE/);
});

test("herramienta administrativa exige confirmación y ofrece reporte huérfano", () => {
  const script = read(
    "scripts/eve/official-control-panel/manage-client-context.mjs",
  );
  assert.match(script, /UNIT2A_ADMIN/);
  assert.match(script, /report-orphans/);
  assert.match(script, /eve_admin_assign_consultant_company/);
  assert.match(script, /eve_admin_create_client_relationship/);
  assert.match(script, /eve_admin_link_case_relationship/);
  assert.match(script, /eve_admin_disable_consultant_company/);
  assert.match(script, /dry-run/);
  assert.match(script, /p_client_company_id/);
  assert.doesNotMatch(script, /usuarios!inner\(empresa_id\)/);
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs",
      ),
    ),
    true,
  );
  assert.doesNotMatch(script, /Cervecería|Ámbar|fixture/i);
});

test("Unidad 2B reutiliza el BFF sin consultar Supabase desde componentes", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  const header = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyHeader.tsx",
  );
  const api = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  assert.match(header, /ClientContextSelector/);
  assert.match(api, /client-companies/);
  assert.doesNotMatch(`${shell}\n${header}`, /\.from\(|service_role/);
});

function read(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}
