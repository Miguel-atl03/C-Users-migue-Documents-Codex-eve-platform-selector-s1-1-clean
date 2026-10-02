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

test("bootstrap usa localStorage + getSession sin endpoint /local-session", () => {
  const bootstrap = read(
    "src/features/official-consultant-control-panel/data/session-bootstrap.ts",
  );
  assert.ok(bootstrap.indexOf("readAccessTokenFromLocalStorage") >= 0);
  assert.ok(bootstrap.indexOf("readAccessToken") >= 0);
  assert.doesNotMatch(
    bootstrap,
    /official-consultant-control-panel\/local-session/,
  );
  assert.doesNotMatch(bootstrap, /fetch\(/);
  assert.match(bootstrap, /AuthReadiness/);
  assert.doesNotMatch(bootstrap, /service_role|SERVICE_ROLE|demo.?JWT/i);
});

test("local-session route y OfficialPanelLocalAccessHelper no existen en el árbol productivo", () => {
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
        "src/features/official-consultant-control-panel/components/OfficialPanelLocalAccessHelper.tsx",
      ),
    ),
    false,
  );
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/app/admin/official-consultant-control-panel/local-ui-fixtures",
      ),
    ),
    false,
  );
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

test("hook usa AuthReadiness y session-bootstrap productivo", () => {
  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-client-context.ts",
  );
  assert.match(hook, /AuthReadiness/);
  assert.match(hook, /session-bootstrap/);
  assert.doesNotMatch(hook, /local-session-bootstrap/);
  assert.doesNotMatch(hook, /OfficialPanelLocalAccessHelper/);
});

test("página oficial fail-closed sin bypass local", () => {
  const page = read(
    "src/app/admin/official-consultant-control-panel/page.tsx",
  );
  assert.doesNotMatch(page, /localDevelopment/);
  assert.doesNotMatch(page, /OfficialPanelLocalAccessHelper/);
  assert.doesNotMatch(page, /EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED/);
  assert.doesNotMatch(page, /\/local-session/);
  assert.match(page, /cliente/);
});

test("service-role client fail-closed sin JWT demo", () => {
  const client = read(
    "src/services/eve/official-control-panel/official-control-panel-service-role-client.ts",
  );
  assert.match(client, /server-only/);
  assert.match(client, /supabase_service_role_missing/);
  assert.doesNotMatch(client, /LOCAL_SUPABASE_DEMO|eyJhbGciOiJIUzI1NiIs/);
  assert.doesNotMatch(client, /envKey\s*\?\?|fallbackJwt|demo-key/);
});

test("access helper sin modo local_enabled", () => {
  const access = read(
    "src/services/eve/consultant-control-panel/consultant-control-panel-access.ts",
  );
  assert.doesNotMatch(access, /local_enabled/);
  assert.doesNotMatch(access, /isOfficialPanelLocalDevelopment/);
  assert.doesNotMatch(access, /EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED/);
});
