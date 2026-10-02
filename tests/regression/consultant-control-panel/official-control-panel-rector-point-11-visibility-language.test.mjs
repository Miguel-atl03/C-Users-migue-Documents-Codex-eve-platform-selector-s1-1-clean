import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(
  tmpdir(),
  "eve-official-ccp-visibility-lang-path-hook.mjs",
);
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

const { resolveActivityCoverageAvailability } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/activity-coverage-availability.ts",
    ),
  ).href
);

const {
  presentOperationalCompoundLabel,
  presentOperationalTargetObjectState,
  presentOperationalTimerPolicyLabel,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/operational-object-label-presentation.ts",
    ),
  ).href
);

function baseVm(overrides = {}) {
  return {
    status: "empty",
    participants: [],
    selectedProfile: null,
    selectedSessionId: null,
    activitySelection: null,
    activitySelectionLoading: false,
    activitySelectionError: false,
    ...overrides,
  };
}

test("§11 availability: empty → no-participant", () => {
  assert.equal(
    resolveActivityCoverageAvailability(baseVm({ status: "empty" })),
    "no-participant",
  );
});

test("§11 availability: profile sin sesión → no-session", () => {
  assert.equal(
    resolveActivityCoverageAvailability(
      baseVm({
        status: "active",
        participants: [{ id: "p1" }],
        selectedProfile: { id: "pr1" },
        selectedSessionId: null,
      }),
    ),
    "no-session",
  );
});

test("§11 availability: sesión sin resultado → no-effective-result", () => {
  assert.equal(
    resolveActivityCoverageAvailability(
      baseVm({
        status: "active",
        participants: [{ id: "p1" }],
        selectedProfile: { id: "pr1" },
        selectedSessionId: "s1",
        activitySelection: { dataStatus: "unavailable", message: "x" },
      }),
    ),
    "no-effective-result",
  );
});

test("lenguaje operativo traduce compuestos autorizados", () => {
  assert.equal(
    presentOperationalCompoundLabel(
      "CasoDiagnosticoEVE [InDiagnosticProduction]",
    ),
    "Caso en producción diagnóstica",
  );
  assert.equal(
    presentOperationalTargetObjectState(
      "SceneCanonicalRecord",
      "Consolidated",
    ),
    "Escena operativa consolidada",
  );
  assert.equal(
    presentOperationalTimerPolicyLabel("max_tiempo_scene_record_consolidated"),
    "Tiempo máximo para consolidar la escena",
  );
});

test("lenguaje operativo no expone técnico desconocido", () => {
  assert.equal(
    presentOperationalCompoundLabel("InventarioMMABP [Resolved]"),
    "No disponible",
  );
  assert.equal(
    presentOperationalTimerPolicyLabel("max_tiempo_desconocido"),
    "No disponible",
  );
});
