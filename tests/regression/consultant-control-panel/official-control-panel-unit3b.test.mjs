import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-unit3b-path-hook.mjs");
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
  classifyProcessStructureStatus,
  collectInconsistencyFlags,
  presentProcessStructureViewModel,
  waitCompleteness,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/process-structure-presentation.ts",
    ),
  ).href
);

const {
  buildMilestoneNavigation,
  parseMilestoneSelection,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/milestone-navigation.ts",
    ),
  ).href
);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

const PROCESS_ID = "50000000-0000-4000-8000-000000000001";
const M1 = "60000000-0000-4000-8000-000000000001";
const M2 = "60000000-0000-4000-8000-000000000002";

test("clasifica empty / partial / active sin confundir vacío con error", () => {
  assert.equal(
    classifyProcessStructureStatus({
      caseActive: true,
      loading: false,
      error: false,
      response: { mainProcess: null, milestones: [] },
    }),
    "empty",
  );

  assert.equal(
    classifyProcessStructureStatus({
      caseActive: true,
      loading: false,
      error: false,
      response: {
        mainProcess: {
          id: PROCESS_ID,
          label: "Proceso prueba",
          status: "available",
          statusLabel: "Disponible",
          currentMilestoneId: null,
          nextEventLabel: null,
          timerLabel: null,
        },
        milestones: [],
      },
    }),
    "partial",
  );

  assert.equal(
    classifyProcessStructureStatus({
      caseActive: true,
      loading: false,
      error: false,
      response: {
        mainProcess: {
          id: PROCESS_ID,
          label: "Proceso prueba",
          status: "available",
          statusLabel: "Disponible",
          currentMilestoneId: M1,
          nextEventLabel: "SCR",
          timerLabel: "2026-08-01T12:00:00.000Z",
        },
        milestones: [
          {
            id: M1,
            label: "Hito 1",
            sequence: 1,
            status: "current",
            statusLabel: "Actual",
            expectedEventLabel: "SCR",
            timerLabel: "2026-08-01T12:00:00.000Z",
            supportProcessLabel: null,
          },
        ],
      },
    }),
    "active",
  );

  assert.equal(
    classifyProcessStructureStatus({
      caseActive: true,
      loading: false,
      error: true,
      response: null,
    }),
    "error",
  );
});

test("espera completa vs incompleta y contradicción de hito actual", () => {
  assert.equal(
    waitCompleteness({
      status: "waiting",
      expectedEventLabel: "Evento",
      timerLabel: "2026-08-01T00:00:00.000Z",
    }),
    "complete",
  );
  assert.equal(
    waitCompleteness({
      status: "waiting",
      expectedEventLabel: "Evento",
      timerLabel: null,
    }),
    "incomplete",
  );
  assert.equal(
    waitCompleteness({
      status: "waiting",
      expectedEventLabel: null,
      timerLabel: "2026-08-01T00:00:00.000Z",
    }),
    "incomplete",
  );

  const flags = collectInconsistencyFlags({
    mainProcess: {
      id: PROCESS_ID,
      label: "P",
      status: "available",
      statusLabel: "Disponible",
      currentMilestoneId: M1,
      nextEventLabel: null,
      timerLabel: null,
    },
    milestones: [
      {
        id: M1,
        label: "Hito",
        sequence: 1,
        status: "not_started",
        statusLabel: "No iniciado",
        expectedEventLabel: null,
        timerLabel: null,
        supportProcessLabel: null,
      },
    ],
  });
  assert.ok(flags.includes("current_milestone_status_mismatch"));
});

test("navegación milestone acepta solo H0–H6", () => {
  const params = new URLSearchParams(
    "mode=client-company&view=monitoring&case=19fc9eff-4219-43f0-854c-e2b3350f23f2&milestone=abc",
  );
  assert.equal(parseMilestoneSelection(params), null);
  const valid = new URLSearchParams(
    "mode=client-company&view=monitoring&case=19fc9eff-4219-43f0-854c-e2b3350f23f2&milestone=H2",
  );
  assert.equal(parseMilestoneSelection(valid), "H2");
  const cleared = buildMilestoneNavigation(valid, null);
  assert.equal(cleared.get("milestone"), null);
  assert.equal(cleared.get("case"), "19fc9eff-4219-43f0-854c-e2b3350f23f2");
});

test("view model ordena por sequence y no infiere hito actual", () => {
  const view = presentProcessStructureViewModel({
    status: "partial",
    caseId: "case-1",
    caseLabel: "Caso prueba",
    selectedMilestoneId: null,
    response: {
      mainProcess: {
        id: PROCESS_ID,
        label: "Proceso",
        status: "available",
        statusLabel: "Disponible",
        currentMilestoneId: null,
        nextEventLabel: null,
        timerLabel: null,
      },
      milestones: [
        {
          id: M2,
          label: "Segundo",
          sequence: 2,
          status: "not_started",
          statusLabel: "No iniciado",
          expectedEventLabel: null,
          timerLabel: null,
          supportProcessLabel: null,
        },
        {
          id: M1,
          label: "Primero",
          sequence: 1,
          status: "available",
          statusLabel: "Disponible",
          expectedEventLabel: null,
          timerLabel: null,
          supportProcessLabel: null,
        },
      ],
    },
  });

  assert.equal(view.milestones[0].id, M1);
  assert.equal(view.milestones[1].id, M2);
  assert.equal(view.currentMilestone, null);
  assert.equal(view.selectedMilestone, null);
});

test("shell integra banda/rail/detalle Unit 3B y no activa Unit 4", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /SupportProcessAxis/);
  assert.doesNotMatch(shell, /MainProcessBand/);
  assert.doesNotMatch(shell, /MainProcessAxis/);
  assert.match(shell, /CoreMilestoneRail/);
  assert.match(shell, /CoreMilestoneDetail/);
  assert.match(shell, /useCaseCoreMilestones/);
  assert.doesNotMatch(shell, /Runtime 40|Gobernanza de Experiencia activa/);
  assert.doesNotMatch(shell, /functionalRole|primaryActivity/);
});

test("cliente consume endpoint process-structure de Unit 3A", () => {
  const api = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  assert.match(api, /getCaseProcessStructure/);
  assert.match(api, /\/cases\/\$\{encodeURIComponent\(caseId\)\}\/process-structure/);
});

test("Playwright Unit 3B y carpeta de capturas existen", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "tests/e2e/official-consultant-control-panel-unit3b.spec.ts",
      ),
    ),
  );
});
