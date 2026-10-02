import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

test("Unit 4 KPI: strip usa progreso solo vía formatCoreMilestoneKpiValue", () => {
  const strip = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  const items = read(
    "src/features/official-consultant-control-panel/presentation/client-company-kpi-items.ts",
  );
  assert.match(items, /formatCoreMilestoneKpiValue/);
  assert.match(strip, /coreMilestoneProgress/);
  assert.doesNotMatch(`${strip}\n${items}`, /\d+\s*de\s*\d+/);
  assert.doesNotMatch(`${strip}\n${items}`, /%/);
  assert.doesNotMatch(`${strip}\n${items}`, /0 de 0/);
});

test("Unit 4A aggregate BFF sigue en process-structure types", () => {
  const types = read(
    "src/services/eve/official-control-panel/official-control-panel-process-structure.types.ts",
  );
  assert.match(types, /coreMilestoneProgress/);
});

test("Unit 4 dictamen e inspector existen (histórico)", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/UNIT_4_BLOCKED_CORE_MILESTONES_KPI_DICTAMEN.md",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/inspect-unit4-core-milestone-kpi.mjs",
      ),
    ),
  );
  const dictamen = read(
    "docs/eve/panel-control/UNIT_4_BLOCKED_CORE_MILESTONES_KPI_DICTAMEN.md",
  );
  assert.match(
    dictamen,
    /Unidad 4 bloqueada: no existe una regla factual suficiente/,
  );
  assert.match(dictamen, /Object\[State\]/);
  assert.match(dictamen, /H0/);
});

test("KPI label Hitos core alcanzados permanece declarado", () => {
  const types = read(
    "src/features/official-consultant-control-panel/types/official-control-panel.types.ts",
  );
  assert.match(types, /Hitos core alcanzados/);
});
