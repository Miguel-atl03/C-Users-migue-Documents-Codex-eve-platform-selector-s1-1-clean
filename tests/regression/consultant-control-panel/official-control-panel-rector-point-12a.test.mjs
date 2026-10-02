import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-rector12a-path-hook.mjs");
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

function read(rel) {
  return readFileSync(resolve(projectRoot, rel), "utf8");
}

const { resolveRuntimeAvailability, RUNTIME_STRUCTURAL_BLOCKS } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/runtime-availability.ts",
    ),
  ).href
);

function baseVm(overrides = {}) {
  return {
    status: "empty",
    participants: [],
    selectedProfile: null,
    selectedSessionId: null,
    selectedActivityId: null,
    activitySelection: null,
    activitySelectionLoading: false,
    activitySelectionError: false,
    activities: [],
    ...overrides,
  };
}

test("§12-A bloques estructurales B0–B7", () => {
  assert.equal(RUNTIME_STRUCTURAL_BLOCKS.length, 9);
  assert.deepEqual(
    RUNTIME_STRUCTURAL_BLOCKS.map((b) => b.code),
    ["B0", "B0.5", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
  );
  assert.ok(RUNTIME_STRUCTURAL_BLOCKS.find((b) => b.code === "B0")?.criticalRoute);
  assert.ok(RUNTIME_STRUCTURAL_BLOCKS.find((b) => b.code === "B7")?.criticalRoute);
});

test("§12-A availability: Amber vacío → no-participant", () => {
  assert.equal(
    resolveRuntimeAvailability(baseVm({ status: "empty" })),
    "no-participant",
  );
});

test("§12-A availability: sesión sin effective → no-effective-selection", () => {
  assert.equal(
    resolveRuntimeAvailability(
      baseVm({
        status: "active",
        participants: [{ id: "p1" }],
        selectedProfile: { id: "pr1" },
        selectedSessionId: "s1",
        activitySelection: { dataStatus: "unavailable", primaryActivities: [] },
      }),
    ),
    "no-effective-selection",
  );
});

test("§12-A availability: primaria sin run → no-run", () => {
  assert.equal(
    resolveRuntimeAvailability(
      baseVm({
        status: "active",
        participants: [{ id: "p1" }],
        selectedProfile: { id: "pr1" },
        selectedSessionId: "s1",
        selectedActivityId: "a1",
        activitySelection: {
          dataStatus: "available",
          primaryActivities: [{ activityId: "a1" }],
        },
        activities: [],
      }),
    ),
    "no-run",
  );
});

test("§12-A availability: run sin ledger → operational-data-unavailable", () => {
  assert.equal(
    resolveRuntimeAvailability(
      baseVm({
        status: "active",
        participants: [{ id: "p1" }],
        selectedProfile: { id: "pr1" },
        selectedSessionId: "s1",
        selectedActivityId: "a1",
        activitySelection: {
          dataStatus: "available",
          primaryActivities: [{ activityId: "a1" }],
        },
        activities: [{ activityId: "a1", runId: "run-1" }],
      }),
    ),
    "operational-data-unavailable",
  );
});

test("§12-A UI wiring: panel tras cobertura; sin BFF operacional", () => {
  const panel = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  assert.match(panel, /ActivitySelectionCoveragePanel/);
  assert.match(panel, /ActivityRuntimePanel/);
  const covIdx = panel.indexOf("ActivitySelectionCoveragePanel");
  const runIdx = panel.indexOf("ActivityRuntimePanel");
  assert.ok(covIdx > 0 && runIdx > covIdx);

  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx",
      ),
    ),
  );
  const runtimePanel = read(
    "src/features/official-consultant-control-panel/components/ActivityRuntimePanel.tsx",
  );
  assert.match(runtimePanel, /Ejecución Runtime/);
  assert.doesNotMatch(runtimePanel, /0\/40/);
  assert.doesNotMatch(runtimePanel, /0\/20/);
  assert.doesNotMatch(runtimePanel, /base_visible_count/);
});
