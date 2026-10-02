import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-unit3a-path-hook.mjs");
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
  assertConsultantCaseProcessAccess,
  buildCaseProcessStructureResponse,
  presentProcessStatus,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-process-structure-service.ts",
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
const CASE_B = "40000000-0000-4000-8000-000000000002";
const PROCESS_A = "50000000-0000-4000-8000-000000000001";
const PROCESS_B = "50000000-0000-4000-8000-000000000002";
const MILESTONE_A = "60000000-0000-4000-8000-000000000001";
const MILESTONE_B = "60000000-0000-4000-8000-000000000002";

function currentRecord(overrides = {}) {
  return {
    status: "enabled",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: null,
    ...overrides,
  };
}

function createContextRepository() {
  return {
    async findAssignment(consultantUserId, companyId) {
      if (consultantUserId === CONSULTANT_A && companyId === COMPANY_A) {
        return { consultantUserId, companyId, ...currentRecord() };
      }
      return null;
    },
    async findRelationship(relationshipId) {
      if (relationshipId === RELATIONSHIP_A) {
        return { id: relationshipId, companyId: COMPANY_A, ...currentRecord() };
      }
      if (relationshipId === RELATIONSHIP_B) {
        return { id: relationshipId, companyId: COMPANY_B, ...currentRecord() };
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
      if (caseId === CASE_B) {
        return {
          id: caseId,
          companyId: COMPANY_B,
          relationshipId: RELATIONSHIP_B,
        };
      }
      return null;
    },
    async listCompanies() {
      return [];
    },
    async listRelationships() {
      return [];
    },
    async listCases() {
      return [];
    },
  };
}

function createProcessRepository(overrides = {}) {
  const state = {
    processes: [
      {
        id: PROCESS_A,
        caseId: CASE_A,
        label: "Proceso test-only A",
        status: "available",
        currentMilestoneId: MILESTONE_A,
        enabled: true,
      },
      {
        id: PROCESS_B,
        caseId: CASE_B,
        label: "Proceso test-only B",
        status: "available",
        currentMilestoneId: null,
        enabled: true,
      },
    ],
    milestones: [
      {
        id: MILESTONE_A,
        mainProcessId: PROCESS_A,
        label: "Hito test-only 1",
        sequence: 1,
        status: "current",
        expectedEventLabel: "Evento SCR",
        timerDueAt: "2026-08-01T12:00:00.000Z",
        supportProcessLabel: null,
        enabled: true,
      },
      {
        id: MILESTONE_B,
        mainProcessId: PROCESS_B,
        label: "Hito test-only cruzado",
        sequence: 1,
        status: "not_started",
        expectedEventLabel: null,
        timerDueAt: null,
        supportProcessLabel: null,
        enabled: true,
      },
    ],
    ...overrides,
  };

  return {
    async findEnabledMainProcessByCase(caseId) {
      return (
        state.processes.find(
          (item) => item.caseId === caseId && item.enabled,
        ) ?? null
      );
    },
    async findMainProcessById(mainProcessId) {
      return state.processes.find((item) => item.id === mainProcessId) ?? null;
    },
    async listEnabledMilestonesByProcess(mainProcessId) {
      return state.milestones
        .filter(
          (item) => item.mainProcessId === mainProcessId && item.enabled,
        )
        .sort((a, b) => a.sequence - b.sequence);
    },
    async findMilestoneById(milestoneId) {
      return state.milestones.find((item) => item.id === milestoneId) ?? null;
    },
    async calculateCoreMilestoneProgress() {
      return { achieved: 0, total: 0, status: "unavailable" };
    },
  };
}

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

test("migración Unit 3A crea tablas, constraints y RLS", () => {
  const migration = read(
    "supabase/migrations/20260715180000_eve_official_control_panel_unit3a_process_structure.sql",
  );
  assert.match(migration, /create table public\.case_main_processes/);
  assert.match(migration, /create table public\.case_milestones/);
  assert.match(migration, /case_main_processes_one_enabled_per_case_idx/);
  assert.match(migration, /case_milestones_process_sequence_unique/);
  assert.match(migration, /case_milestones_waiting_cause_check/);
  assert.match(migration, /eve_enforce_current_milestone_same_process/);
  assert.match(migration, /case_main_processes_consultant_assigned_select/);
  assert.match(migration, /case_milestones_consultant_assigned_select/);
  assert.match(migration, /eve_verify_unit3a_process_structure_integrity/);
  assert.doesNotMatch(migration, /19fc9eff-4219-43f0-854c-e2b3350f23f2/);
  assert.doesNotMatch(migration, /Cervecería Amber|INC16/);
  assert.doesNotMatch(migration, /insert into public\.case_main_processes \([\s\S]*5c08029f/);
});

test("BFF process-structure existe y es de solo lectura", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/process-structure/route.ts",
  );
  assert.match(route, /export async function GET/);
  assert.match(route, /assertConsultantCaseProcessAccess/);
  assert.match(route, /buildCaseProcessStructureResponse/);
  assert.match(route, /No fue posible abrir la estructura del caso/);
  assert.doesNotMatch(route, /export async function POST/);
});

test("KPI core degradable: fallo de progreso no colapsa estructura", async () => {
  const failing = createProcessRepository({
    processes: [],
    milestones: [],
  });
  failing.calculateCoreMilestoneProgress = async () => {
    throw new Error("official_control_panel_process_structure_data_source_error");
  };
  const empty = await buildCaseProcessStructureResponse(failing, CASE_A);
  assert.equal(empty.mainProcess, null);
  assert.deepEqual(empty.milestones, []);
  assert.deepEqual(empty.coreMilestoneProgress, {
    achieved: 0,
    total: 0,
    status: "unavailable",
  });

  const fullFailing = createProcessRepository();
  fullFailing.calculateCoreMilestoneProgress = async () => {
    throw new Error("PGRST202 Could not find the function in the schema cache");
  };
  const full = await buildCaseProcessStructureResponse(fullFailing, CASE_A);
  assert.equal(full.mainProcess?.label, "Proceso test-only A");
  assert.equal(full.milestones.length, 1);
  assert.equal(full.coreMilestoneProgress.status, "unavailable");
  assert.equal(full.coreMilestoneProgress.total, 0);

  const service = read(
    "src/services/eve/official-control-panel/official-control-panel-process-structure-service.ts",
  );
  assert.match(service, /logSanitizedCoreProgressFailure/);
  assert.match(service, /unavailableCoreMilestoneProgress/);
});

test("script administrativo y verificador existen", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/manage-case-process-structure.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-unit-3a-integrity.mjs",
      ),
    ),
  );
  const manage = read(
    "scripts/eve/official-control-panel/manage-case-process-structure.mjs",
  );
  assert.match(manage, /dry-run/);
  assert.match(manage, /UNIT3A_ADMIN/);
  assert.match(manage, /create-main-process/);
  assert.match(manage, /set-current-milestone/);
  assert.match(manage, /waiting_requires_event_or_timer/);
});

  test("UI del panel Unit 3A no poblaba banda/rail; Unit 3B lo hace aparte", () => {
  const placeholderRail = read(
    "src/features/official-consultant-control-panel/components/CoreMilestoneRailPlaceholder.tsx",
  );
  const placeholderAxis = read(
    "src/features/official-consultant-control-panel/components/ProcessAxisPlaceholder.tsx",
  );
  assert.doesNotMatch(placeholderRail, /process-structure/);
  assert.doesNotMatch(placeholderAxis, /process-structure/);
  assert.doesNotMatch(placeholderRail, /case_milestones/);
});

test("assertConsultantCaseProcessAccess deniega consultor fuera de scope", async () => {
  const context = createContextRepository();
  const process = createProcessRepository();

  const ok = await assertConsultantCaseProcessAccess(context, process, {
    consultantUserId: CONSULTANT_A,
    companyId: COMPANY_A,
    relationshipId: RELATIONSHIP_A,
    caseId: CASE_A,
    mainProcessId: PROCESS_A,
    milestoneId: MILESTONE_A,
  });
  assert.equal(ok.ok, true);

  const deniedConsultant = await assertConsultantCaseProcessAccess(
    context,
    process,
    {
      consultantUserId: CONSULTANT_B,
      companyId: COMPANY_A,
      relationshipId: RELATIONSHIP_A,
      caseId: CASE_A,
    },
  );
  assert.equal(deniedConsultant.ok, false);
  if (!deniedConsultant.ok) {
    assert.equal(deniedConsultant.status, 403);
    assert.match(deniedConsultant.message, /estructura del caso/);
  }

  const deniedCrossMilestone = await assertConsultantCaseProcessAccess(
    context,
    process,
    {
      consultantUserId: CONSULTANT_A,
      companyId: COMPANY_A,
      relationshipId: RELATIONSHIP_A,
      caseId: CASE_A,
      mainProcessId: PROCESS_A,
      milestoneId: MILESTONE_B,
    },
  );
  assert.equal(deniedCrossMilestone.ok, false);
});

test("BFF distingue ausencia, parcialidad y estructura completa (test-only data)", async () => {
  const emptyRepo = createProcessRepository({ processes: [], milestones: [] });
  const empty = await buildCaseProcessStructureResponse(emptyRepo, CASE_A);
  assert.deepEqual(empty, {
    mainProcess: null,
    milestones: [],
    coreMilestoneProgress: {
      achieved: 0,
      total: 0,
      status: "unavailable",
    },
  });

  const processOnly = createProcessRepository({
    processes: [
      {
        id: PROCESS_A,
        caseId: CASE_A,
        label: "Proceso sin hitos",
        status: "not_started",
        currentMilestoneId: null,
        enabled: true,
      },
    ],
    milestones: [],
  });
  const partial = await buildCaseProcessStructureResponse(processOnly, CASE_A);
  assert.equal(partial.mainProcess?.label, "Proceso sin hitos");
  assert.equal(partial.mainProcess?.currentMilestoneId, null);
  assert.equal(partial.milestones.length, 0);

  const full = await buildCaseProcessStructureResponse(
    createProcessRepository(),
    CASE_A,
  );
  assert.equal(full.mainProcess?.currentMilestoneId, MILESTONE_A);
  assert.equal(full.mainProcess?.nextEventLabel, "Evento SCR");
  assert.equal(full.mainProcess?.status, "available");
  assert.equal(full.milestones.length, 1);
  assert.equal(full.milestones[0].sequence, 1);
  assert.equal(full.milestones[0].status, "current");
  assert.equal(presentProcessStatus("waiting"), "En espera");
  assert.equal(presentProcessStatus("unknown"), "No disponible");
});

test("documentación Unit 3A y rollback existen", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/UNIT_3A_PROCESS_MILESTONE_PERSISTENCE.md",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(projectRoot, "docs/eve/panel-control/UNIT_3A_ROLLBACK.md"),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/rollback-unit-3a.sql",
      ),
    ),
  );
});
