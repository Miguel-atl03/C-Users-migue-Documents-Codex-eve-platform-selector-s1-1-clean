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

test("page del Panel resuelve acceso server-side antes del shell", () => {
  const page = read(
    "src/app/admin/official-consultant-control-panel/page.tsx",
  );
  assert.match(page, /resolveOfficialConsultantAccess/);
  assert.match(page, /redirect\(/);
  assert.match(page, /access-denied/);
  assert.match(page, /buildOfficialPanelLoginRedirect/);
  assert.match(page, /OfficialControlPanelShell/);
  // Shell only after authorized branch — redirect precedes render.
  const resolveIdx = page.indexOf("resolveOfficialConsultantAccess");
  const shellIdx = page.indexOf("<OfficialControlPanelShell");
  assert.ok(resolveIdx >= 0 && shellIdx > resolveIdx);
});

test("resolveOfficialConsultantAccess es server-only y sin service_role", () => {
  const source = read(
    "src/services/eve/official-control-panel/resolve-official-consultant-access.ts",
  );
  assert.match(source, /import "server-only"/);
  assert.match(source, /createServerClient/);
  assert.match(source, /consultant_company_assignments/);
  assert.match(source, /status: "anonymous"/);
  assert.match(source, /status: "forbidden"/);
  assert.match(source, /status: "authorized"/);
  assert.doesNotMatch(source, /SERVICE_ROLE_KEY|createServiceRole|serviceRoleKey/);
  assert.match(source, /Never service_role/);
});

test("cliente browser usa @supabase/ssr cookies oficiales", () => {
  const browser = read("src/lib/supabase.ts");
  assert.match(browser, /createBrowserClient/);
  assert.match(browser, /@supabase\/ssr/);
  assert.doesNotMatch(browser, /createClient\(/);
});

test("middleware refresca sesión cookie oficial", () => {
  assert.equal(existsSync(resolve(projectRoot, "src/middleware.ts")), true);
  const middleware = read("src/middleware.ts");
  assert.match(middleware, /NextResponse\.redirect/);
  assert.match(middleware, /consultant_company_assignments/);
  assert.match(middleware, /official-consultant-control-panel/);
});

test("e2e acceso oficial sin page.route/fulfill de seguridad", () => {
  const spec = read(
    "tests/e2e/official-consultant-access-login-panel.spec.ts",
  );
  assert.doesNotMatch(spec, /page\.route\s*\(/);
  assert.doesNotMatch(spec, /\.fulfill\s*\(/);
  assert.match(spec, /ACCESS_IDENTITY_EMAILS/);
  assert.match(spec, /maxRedirects:\s*0/);
});

test("provision access-identities existe y no hardcodea secretos", () => {
  const script = read(
    "scripts/eve/official-control-panel/provision-official-consultant.mjs",
  );
  assert.match(script, /--access-identities/);
  assert.match(script, /runtime_session_created: false/);
  assert.doesNotMatch(script, /eyJ[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(script, /password\s*=\s*["'][^"']+["']/i);
});
