import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

function read(relative) {
  return readFileSync(resolve(projectRoot, relative), "utf8");
}

test("local-session App Router route file does not exist", () => {
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/local-session/route.ts",
      ),
    ),
    false,
  );
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/local-session",
      ),
    ),
    false,
  );
});

test("official panel local-development gate module removed", () => {
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/services/eve/official-control-panel/official-panel-local-development.ts",
      ),
    ),
    false,
  );
});

test("consultant access has no local_enabled bypass", () => {
  const access = read(
    "src/services/eve/consultant-control-panel/consultant-control-panel-access.ts",
  );
  assert.doesNotMatch(access, /local_enabled/);
  assert.doesNotMatch(access, /isOfficialPanelLocalDevelopment/);
  assert.doesNotMatch(access, /EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED/);
});

test("session bootstrap uses localStorage + getSession only (no /local-session)", () => {
  const bootstrap = read(
    "src/features/official-consultant-control-panel/data/session-bootstrap.ts",
  );
  assert.match(bootstrap, /readAccessTokenFromLocalStorage/);
  assert.match(bootstrap, /readAccessToken/);
  assert.doesNotMatch(
    bootstrap,
    /official-consultant-control-panel\/local-session/,
  );
  assert.doesNotMatch(bootstrap, /fetch\(/);
});

test("official page rejects client surface and has no local bypass", () => {
  const page = read("src/app/admin/official-consultant-control-panel/page.tsx");
  assert.doesNotMatch(page, /isOfficialPanelLocalDevelopment/);
  assert.doesNotMatch(page, /localDevelopment/);
  assert.doesNotMatch(page, /OfficialPanelLocalAccessHelper/);
  assert.doesNotMatch(page, /EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED/);
  assert.match(page, /cliente/);
});

test("service-role client is server-only and fail-closed", () => {
  const client = read(
    "src/services/eve/official-control-panel/official-control-panel-service-role-client.ts",
  );
  assert.match(client, /server-only/);
  assert.match(client, /supabase_service_role_missing/);
  assert.doesNotMatch(client, /eyJhbGciOiJIUzI1NiIs/);
});
