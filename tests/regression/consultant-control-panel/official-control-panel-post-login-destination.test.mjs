import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-post-login-destination-path-hook.mjs");
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
  ACCESS_DENIED_HREF,
  OFFICIAL_PANEL_DEFAULT_HREF,
  classifyConsultantAccessFromCompanies,
  resolvePostLoginDestination,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/post-login-destination.ts",
    ),
  ).href
);

const {
  isSafeOfficialPanelReturnPath,
  readSafeNextFromSearchParams,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/official-panel-login-redirect.ts",
    ),
  ).href
);

function read(relative) {
  return readFileSync(resolve(projectRoot, relative), "utf8");
}

test("classify: empresas autorizadas → consultant; vacío → operative", () => {
  assert.equal(
    classifyConsultantAccessFromCompanies([{ id: "c1", label: "Acme" }]),
    "consultant",
  );
  assert.equal(classifyConsultantAccessFromCompanies([]), "operative");
  assert.equal(classifyConsultantAccessFromCompanies(null), "unauthorized");
});

test("resolve: consultor va al Panel; returnTo solo tras capability", () => {
  const panel = "/admin/official-consultant-control-panel";
  assert.deepEqual(
    resolvePostLoginDestination({
      kind: "consultant",
      panelReturnPath: null,
    }),
    { kind: "consultant", href: OFFICIAL_PANEL_DEFAULT_HREF },
  );
  assert.deepEqual(
    resolvePostLoginDestination({
      kind: "consultant",
      panelReturnPath: panel,
    }),
    { kind: "consultant", href: panel },
  );
  assert.deepEqual(
    resolvePostLoginDestination({
      kind: "operative",
      panelReturnPath: panel,
    }),
    { kind: "unauthorized", href: ACCESS_DENIED_HREF },
  );
  assert.deepEqual(
    resolvePostLoginDestination({
      kind: "operative",
      panelReturnPath: null,
    }),
    { kind: "operative", href: "/" },
  );
});

test("open redirect: solo rutas internas del Panel", () => {
  assert.equal(isSafeOfficialPanelReturnPath("/admin/official-consultant-control-panel"), true);
  assert.equal(isSafeOfficialPanelReturnPath("//evil.example"), false);
  assert.equal(isSafeOfficialPanelReturnPath("https://evil.example"), false);
  assert.equal(isSafeOfficialPanelReturnPath("/onboarding"), false);
  assert.equal(
    readSafeNextFromSearchParams("https://evil.example"),
    null,
  );
});

test("home cablea resolución post-login y guarda Runtime de consultor", () => {
  const home = read("src/app/page.tsx");
  assert.match(home, /getAuthorizedClientCompanies/);
  assert.match(home, /resolvePostLoginDestination/);
  assert.match(home, /classifyConsultantAccessFromCompanies/);
  assert.match(home, /routing_access/);
  assert.match(home, /OFFICIAL_PANEL_DEFAULT_HREF/);
  assert.doesNotMatch(home, /router\.replace\(panelReturnPath\)/);
});

test("access-denied y provision script existen; local-session ausente", () => {
  assert.equal(
    existsSync(resolve(projectRoot, "src/app/access-denied/page.tsx")),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "scripts/eve/official-control-panel/provision-official-consultant.mjs",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/local-session/route.ts",
      ),
    ),
    false,
  );
  const provision = read(
    "scripts/eve/official-control-panel/provision-official-consultant.mjs",
  );
  assert.match(provision, /eve_admin_assign_consultant_company/);
  assert.match(provision, /runtime_session_created: false/);
  assert.doesNotMatch(provision, /eyJ[A-Za-z0-9_-]{10,}/);
  assert.doesNotMatch(provision, /service_role\.|sk_live|password\s*=\s*["']/i);
});

test("ClientAuthScreen sin botón Entrar como Consultor; hideDemo disponible", () => {
  const screen = read("src/components/client/ClientAuthScreen.tsx");
  assert.doesNotMatch(screen, /Entrar como Consultor/i);
  assert.match(screen, /hideDemo/);
  assert.match(screen, /Demo controlada/);
});
