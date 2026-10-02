import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-unit4a-path-hook.mjs");
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
  isCoreMilestoneReached,
  presentCoreMilestoneProgressFromRpc,
  unavailableCoreMilestoneProgress,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-core-milestones.ts",
    ),
  ).href
);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

test("catálogo canónico H0–H6 tiene Object[State] del corpus", () => {
  const catalog = JSON.parse(
    read(
      "scripts/eve/official-control-panel/core-milestone-h0-h6-catalog.json",
    ),
  );
  assert.equal(catalog.length, 7);
  assert.deepEqual(
    catalog.map((item) => item.code),
    ["H0", "H1", "H2", "H3", "H4", "H5", "H6"],
  );
  assert.equal(catalog[0].expectedObjectName, "CasoDiagnosticoEVE");
  assert.equal(catalog[0].expectedObjectState, "InDiagnosticProduction");
  assert.equal(catalog[6].expectedObjectState, "Delivered");
});

test("migración Unit 4A crea definiciones, vínculos, evidencia y RLS", () => {
  const migration = read(
    "supabase/migrations/20260715190000_eve_official_control_panel_unit4a_core_milestones.sql",
  );
  assert.match(migration, /create table public\.core_milestone_definitions/);
  assert.match(migration, /create table public\.case_core_milestones/);
  assert.match(migration, /create table public\.core_milestone_achievements/);
  assert.match(migration, /core_process_code/);
  assert.match(migration, /PF-CORE-01/);
  assert.match(migration, /eve_calculate_core_milestone_progress/);
  assert.match(migration, /eve_verify_unit4a_core_milestone_integrity/);
  assert.doesNotMatch(migration, /19fc9eff-4219-43f0-854c-e2b3350f23f2/);
  // Admin RPC may insert evidence at runtime; migration must not seed Amber/case rows.
  assert.doesNotMatch(
    migration,
    /insert into public\.core_milestone_achievements[\s\S]{0,400}'CasoDiagnosticoEVE'/,
  );
});

test("isCoreMilestoneReached exige Object[State] vigente, no completed", () => {
  const definition = {
    enabled: true,
    expectedObjectName: "CasoDiagnosticoEVE",
    expectedObjectState: "ReadyForTransduction",
  };
  const link = { enabled: true, applicabilityStatus: "applicable" };
  assert.equal(
    isCoreMilestoneReached(definition, link, {
      objectName: "CasoDiagnosticoEVE",
      objectState: "ReadyForTransduction",
      revokedAt: null,
    }),
    true,
  );
  assert.equal(
    isCoreMilestoneReached(definition, link, {
      objectName: "CasoDiagnosticoEVE",
      objectState: "WrongState",
      revokedAt: null,
    }),
    false,
  );
  assert.equal(
    isCoreMilestoneReached(definition, link, {
      objectName: "CasoDiagnosticoEVE",
      objectState: "ReadyForTransduction",
      revokedAt: "2026-07-15T00:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    isCoreMilestoneReached(
      definition,
      { enabled: true, applicabilityStatus: "excluded_parallel" },
      {
        objectName: "CasoDiagnosticoEVE",
        objectState: "ReadyForTransduction",
        revokedAt: null,
      },
    ),
    false,
  );
});

test("RPC progress unavailable se presenta sin inventar 7", () => {
  const unavailable = unavailableCoreMilestoneProgress();
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.total, 0);
  const fromRpc = presentCoreMilestoneProgressFromRpc({
    achieved: 3,
    total: 7,
    status: "available",
    missingDefinitions: [],
    missingCaseLinks: [],
    contradictoryEvidence: false,
  });
  assert.equal(fromRpc.achieved, 3);
  assert.equal(fromRpc.total, 7);
});

test("fallo de RPC core no derriba estructura (Amber / proceso válido)", async () => {
  const {
    buildCaseProcessStructureResponse,
    sanitizeCoreProgressErrorCode,
  } = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/services/eve/official-control-panel/official-control-panel-process-structure-service.ts",
      ),
    ).href
  );

  const amberCase = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
  const emptyWithFailingRpc = {
    async findEnabledMainProcessByCase() {
      return null;
    },
    async findMainProcessById() {
      return null;
    },
    async listEnabledMilestonesByProcess() {
      return [];
    },
    async findMilestoneById() {
      return null;
    },
    async calculateCoreMilestoneProgress() {
      throw new Error("official_control_panel_process_structure_data_source_error");
    },
  };

  const amber = await buildCaseProcessStructureResponse(
    emptyWithFailingRpc,
    amberCase,
  );
  assert.deepEqual(amber, {
    mainProcess: null,
    milestones: [],
    coreMilestoneProgress: {
      achieved: 0,
      total: 0,
      status: "unavailable",
    },
  });

  const processId = "50000000-0000-4000-8000-000000000099";
  const milestoneId = "60000000-0000-4000-8000-000000000099";
  const structureWithFailingRpc = {
    async findEnabledMainProcessByCase(caseId) {
      return {
        id: processId,
        caseId,
        label: "Proceso test-only",
        status: "available",
        currentMilestoneId: milestoneId,
        enabled: true,
      };
    },
    async findMainProcessById() {
      return null;
    },
    async listEnabledMilestonesByProcess() {
      return [
        {
          id: milestoneId,
          mainProcessId: processId,
          label: "Hito test-only",
          sequence: 1,
          status: "current",
          expectedEventLabel: null,
          timerDueAt: null,
          supportProcessLabel: null,
          enabled: true,
        },
      ];
    },
    async findMilestoneById() {
      return null;
    },
    async calculateCoreMilestoneProgress() {
      throw new Error("PGRST202: Could not find the function");
    },
  };

  const withStructure = await buildCaseProcessStructureResponse(
    structureWithFailingRpc,
    "40000000-0000-4000-8000-000000000099",
  );
  assert.equal(withStructure.mainProcess?.label, "Proceso test-only");
  assert.equal(withStructure.milestones.length, 1);
  assert.deepEqual(withStructure.coreMilestoneProgress, {
    achieved: 0,
    total: 0,
    status: "unavailable",
  });

  assert.equal(
    sanitizeCoreProgressErrorCode(
      new Error("official_control_panel_process_structure_data_source_error"),
    ),
    "official_control_panel_process_structure_data_source_error",
  );
  assert.equal(
    sanitizeCoreProgressErrorCode(
      new Error('relation "x" does not exist SELECT * FROM secret'),
    ),
    "core_milestone_progress_unavailable",
  );
});

test("progreso partial y available se propagan sin alterar estructura", async () => {
  const { buildCaseProcessStructureResponse } = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/services/eve/official-control-panel/official-control-panel-process-structure-service.ts",
      ),
    ).href
  );

  const base = {
    async findEnabledMainProcessByCase() {
      return null;
    },
    async findMainProcessById() {
      return null;
    },
    async listEnabledMilestonesByProcess() {
      return [];
    },
    async findMilestoneById() {
      return null;
    },
  };

  const partial = await buildCaseProcessStructureResponse(
    {
      ...base,
      async calculateCoreMilestoneProgress() {
        return { achieved: 2, total: 7, status: "partial" };
      },
    },
    "40000000-0000-4000-8000-000000000001",
  );
  assert.deepEqual(partial.coreMilestoneProgress, {
    achieved: 2,
    total: 7,
    status: "partial",
  });
  assert.equal(partial.mainProcess, null);

  const available = await buildCaseProcessStructureResponse(
    {
      ...base,
      async calculateCoreMilestoneProgress() {
        return { achieved: 7, total: 7, status: "available" };
      },
    },
    "40000000-0000-4000-8000-000000000001",
  );
  assert.deepEqual(available.coreMilestoneProgress, {
    achieved: 7,
    total: 7,
    status: "available",
  });
});

test("KPI UI enlaza progreso §8; BFF process-structure sigue exponiendo agregado", () => {
  const strip = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  const items = read(
    "src/features/official-consultant-control-panel/presentation/client-company-kpi-items.ts",
  );
  assert.match(items, /formatCoreMilestoneKpiValue/);
  assert.match(strip, /coreMilestoneProgress/);
  const types = read(
    "src/services/eve/official-control-panel/official-control-panel-process-structure.types.ts",
  );
  assert.match(types, /coreMilestoneProgress/);
});

test("scripts administrativos y docs Unit 4A existen", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/manage-core-milestones.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/verify-unit-4a-integrity.mjs",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(projectRoot, "docs/eve/panel-control/UNIT_4A_CORE_MILESTONE_PERSISTENCE.md"),
    ),
  );
  assert.ok(
    existsSync(resolve(projectRoot, "docs/eve/panel-control/UNIT_4A_ROLLBACK.md")),
  );
  const manage = read(
    "scripts/eve/official-control-panel/manage-core-milestones.mjs",
  );
  assert.match(manage, /UNIT4A_ADMIN/);
  assert.match(manage, /dry-run/);
  assert.match(manage, /seed-canonical-definitions/);
});
