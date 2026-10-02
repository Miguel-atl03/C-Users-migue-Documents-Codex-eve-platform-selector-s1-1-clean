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

test("dictamen R2 histórico e inspector existen; inspector admite desbloqueo R2A", () => {
  const dictamen = read(
    "docs/eve/panel-control/TRAMO_R2_BLOCKED_CASE_PARTICIPANTS_PROFILES_DICTAMEN.md",
  );
  assert.match(
    dictamen,
    /Tramo R2 bloqueado: no existe una fuente factual suficiente/,
  );
  const inspector = read(
    "scripts/eve/official-control-panel/inspect-tramo-r2-case-participants.mjs",
  );
  assert.match(inspector, /TRAMO_R2A_PERSISTENCE_PRESENT/);
  assert.doesNotMatch(inspector, /&&\s*false/);
});

test("KPI Usuarios y Roles funcionales permanecen inactivos", () => {
  const strip = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  assert.match(strip, /—/);
  assert.doesNotMatch(strip, /profileCount/);
  assert.doesNotMatch(strip, /participants\.length/);
});

test("shell no inventa Ventas/Finanzas/Logística", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.doesNotMatch(shell, /Ventas|Finanzas|Logística/);
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/TRAMO_R2_BLOCKED_CASE_PARTICIPANTS_PROFILES_DICTAMEN.md",
      ),
    ),
  );
});
