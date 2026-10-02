import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const bootstrapRoute = readFileSync(
  new URL("../../../src/app/api/session/bootstrap/route.ts", import.meta.url),
  "utf8",
);
const restoreRoute = readFileSync(
  new URL("../../../src/app/api/session/restore/route.ts", import.meta.url),
  "utf8",
);
const intakeRoute = readFileSync(
  new URL("../../../src/app/api/intake/triple/route.ts", import.meta.url),
  "utf8",
);
const sceneBootstrapRoute = readFileSync(
  new URL("../../../src/app/api/scenes/bootstrap/route.ts", import.meta.url),
  "utf8",
);
const sceneAnswersRoute = readFileSync(
  new URL("../../../src/app/api/scenes/answers/route.ts", import.meta.url),
  "utf8",
);
const sceneDeriveRoute = readFileSync(
  new URL("../../../src/app/api/scenes/derive/route.ts", import.meta.url),
  "utf8",
);
const scenePreclassifyRoute = readFileSync(
  new URL("../../../src/app/api/scenes/preclassify/route.ts", import.meta.url),
  "utf8",
);
const sceneConsistencyRoute = readFileSync(
  new URL("../../../src/app/api/scenes/consistency/route.ts", import.meta.url),
  "utf8",
);
const sceneCanonicalizeRoute = readFileSync(
  new URL("../../../src/app/api/scenes/canonicalize/route.ts", import.meta.url),
  "utf8",
);
const sessionIntermediateOutputRoute = readFileSync(
  new URL("../../../src/app/api/session/intermediate-output/route.ts", import.meta.url),
  "utf8",
);
const homePage = readFileSync(
  new URL("../../../src/app/page.tsx", import.meta.url),
  "utf8",
);
const sessionBoundary = readFileSync(
  new URL("../../../src/lib/session-boundary.ts", import.meta.url),
  "utf8",
);
const supabaseServerBoundary = readFileSync(
  new URL("../../../src/lib/supabase-server.ts", import.meta.url),
  "utf8",
);
const browserSupabaseClient = readFileSync(
  new URL("../../../src/lib/supabase.ts", import.meta.url),
  "utf8",
);
const authOwnershipMigration = readFileSync(
  new URL(
    "../../../sql/migrations/2026-05-28-auth-user-ownership.sql",
    import.meta.url,
  ),
  "utf8",
);

test("1.11B bootstrap defaults to commercial mode and requires Supabase Auth", () => {
  assert.match(bootstrapRoute, /normalizeSessionMode\(payload\.mode\)/);
  assert.match(bootstrapRoute, /authenticateCommercialRequest\(request\)/);
  assert.match(bootstrapRoute, /Commercial mode requires a company name/);
  assert.doesNotMatch(
    bootstrapRoute,
    /payload\.company\?\.nombre\?\.trim\(\) \|\| demoCompany\.nombre/,
  );
});

test("1.11B demo fallback remains explicit and separated from commercial mode", () => {
  assert.match(bootstrapRoute, /mode === "demo"/);
  assert.match(homePage, /createDatabaseSession\("demo"\)/);
  assert.match(homePage, /Demo controlada/);
  assert.match(homePage, /createDatabaseSession\("commercial"\)/);
});

test("1.11B localStorage is not commercial restore authority", () => {
  assert.match(homePage, /Para recuperar tu avance, primero inicia sesion/);
  assert.match(restoreRoute, /resolveSessionOwner\(/);
  assert.match(sessionBoundary, /resolveCommercialSessionOwner/);
  assert.doesNotMatch(restoreRoute, /usuarios\.email/);
});

test("1.11B auth boundary does not introduce service_role or readiness/export mutation", () => {
  for (const source of [bootstrapRoute, restoreRoute, homePage, sessionBoundary]) {
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role/i);
    assert.doesNotMatch(source, /ExportCodePackage|candidate_export_package/);
    assert.doesNotMatch(source, /readiness_for_transduction|session_ready_for_transduction/i);
    assert.doesNotMatch(source, /soft_governance_mode|enforcement_mode/);
  }
});

test("1.11D migration adds nullable auth_user_id with non-null unique index only", () => {
  assert.match(authOwnershipMigration, /add column if not exists auth_user_id uuid null/);
  assert.match(authOwnershipMigration, /unique index if not exists usuarios_auth_user_id_unique_not_null/);
  assert.match(authOwnershipMigration, /where auth_user_id is not null/);
  assert.doesNotMatch(authOwnershipMigration, /update\s+usuarios/i);
  assert.doesNotMatch(authOwnershipMigration, /enable row level security/i);
});

test("1.11D commercial bootstrap persists auth_user_id and demo remains non-commercial", () => {
  assert.match(bootstrapRoute, /eq\("auth_user_id", authenticatedUser\.authUserId\)/);
  assert.match(bootstrapRoute, /auth_user_id: authenticatedUser\.authUserId/);
  assert.match(bootstrapRoute, /eq\("email", demoUser\.email\)/);
  assert.match(bootstrapRoute, /mode === "demo"\s*\?\s*demoUser\.email/);
  assert.doesNotMatch(bootstrapRoute, /payload\.user\?\.email\?\.trim\(\) \|\| demoUser\.email/);
});

test("1.11D session owner checks use internal user id from auth_user_id", () => {
  assert.match(sessionBoundary, /resolveCommercialEveUser/);
  assert.match(sessionBoundary, /eq\("auth_user_id", auth\.user\.authUserId\)/);
  assert.match(sessionBoundary, /resolveCommercialSessionOwner/);
  assert.match(sessionBoundary, /eq\("usuario_id", eveUser\.user\.eveUserId\)/);
  assert.match(sessionBoundary, /Commercial user is authenticated but not linked to an EVE user/);
});

test("1.11E intake and session output require owner checks before mutation", () => {
  for (const source of [intakeRoute, sessionIntermediateOutputRoute]) {
    assert.match(source, /normalizeSessionMode\(payload\.mode\)/);
    assert.match(source, /resolveSessionOwner\(/);
    assert.match(source, /if \(!sessionResult\.session\)/);
  }
});

test("1.11E scene endpoints require session and scene ownership", () => {
  assert.match(sceneBootstrapRoute, /resolveSessionOwner\(/);

  for (const source of [
    sceneAnswersRoute,
    sceneDeriveRoute,
    scenePreclassifyRoute,
    sceneConsistencyRoute,
    sceneCanonicalizeRoute,
  ]) {
    assert.match(source, /normalizeSessionMode\(payload\.mode\)/);
    assert.match(source, /resolveSceneOwner\(request/);
    assert.match(source, /if \(!sceneResult\.session \|\| !sceneResult\.scene\)/);
  }
});

test("1.11E demo sessions are scoped to the explicit demo user", () => {
  assert.match(sessionBoundary, /DEMO_USER_EMAIL = "demo@eve\.local"/);
  assert.match(sessionBoundary, /resolveDemoSessionOwner/);
  assert.match(sessionBoundary, /eq\("usuarios\.email", DEMO_USER_EMAIL\)/);
  assert.match(sessionBoundary, /resolveSessionOwner/);
});

test("1.11E UI sends mode and Authorization on owned Capa 1 operations", () => {
  assert.match(homePage, /const protectedHeaders = \(\) =>/);
  assert.match(homePage, /Authorization: `Bearer \$\{authSession\.access_token\}`/);
  assert.match(homePage, /body: JSON\.stringify\(\{ sessionId, mode: activeSessionMode \}\)/);
  assert.match(homePage, /body: JSON\.stringify\(\{ \.\.\.body, mode: activeSessionMode \}\)/);
  assert.match(homePage, /mode: activeSessionMode,\s+sessionId: databaseSessionId/);
});

test("1.11K.1 page avoids localStorage reads in initial render state", () => {
  assert.match(homePage, /const \[activeSessionMode, setActiveSessionMode\] =\s+useState<SessionMode>\("commercial"\)/);
  assert.match(homePage, /const \[savedSessionId, setSavedSessionId\] = useState<string \| null>\(null\)/);
  assert.doesNotMatch(homePage, /useState<SessionMode>\(\(\) =>\s*readSavedSessionMode\(\)\)/);
  assert.doesNotMatch(homePage, /useState<string \| null>\(\(\) =>\s*readSavedSessionId\(\)\)/);
  assert.match(homePage, /useEffect\(\(\) => \{/);
  assert.match(homePage, /const syncFromStorage = \(\) => \{/);
  assert.match(homePage, /const restoredSessionId = window\.localStorage\.getItem\(sessionStorageKey\)/);
  assert.match(homePage, /const timer = window\.setTimeout\(syncFromStorage, 0\)/);
});

test("1.11I server Supabase boundary can bind authenticated requests", () => {
  assert.match(supabaseServerBoundary, /AsyncLocalStorage/);
  assert.match(supabaseServerBoundary, /createAuthenticatedServerSupabaseClient/);
  assert.match(supabaseServerBoundary, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(supabaseServerBoundary, /runWithServerSupabaseClient/);
  assert.match(supabaseServerBoundary, /requestClientStorage\.getStore\(\) \?\? supabaseAnonServer/);
  assert.match(sessionBoundary, /createOperationalServerSupabaseClient/);
  assert.match(sessionBoundary, /runWithOperationalServerSupabaseClient/);
  assert.match(sessionBoundary, /mode === "demo"\) return supabaseAnonServer/);
  assert.match(sessionBoundary, /return createAuthenticatedServerSupabaseClient\(token\)/);
});

test("1.11I covered commercial operations run inside the server-safe Supabase boundary", () => {
  for (const source of [
    bootstrapRoute,
    restoreRoute,
    intakeRoute,
    sceneBootstrapRoute,
    sceneAnswersRoute,
    sceneDeriveRoute,
    scenePreclassifyRoute,
    sceneConsistencyRoute,
    sceneCanonicalizeRoute,
    sessionIntermediateOutputRoute,
  ]) {
    assert.match(source, /runWithOperationalServerSupabaseClient\(\s*request,\s*mode/);
  }
});

test("1.11I service_role remains out of the browser and operational front-door boundary", () => {
  for (const source of [
    homePage,
    browserSupabaseClient,
    supabaseServerBoundary,
    sessionBoundary,
    bootstrapRoute,
    restoreRoute,
    intakeRoute,
    sceneBootstrapRoute,
    sceneAnswersRoute,
    sceneDeriveRoute,
    scenePreclassifyRoute,
    sceneConsistencyRoute,
    sceneCanonicalizeRoute,
    sessionIntermediateOutputRoute,
  ]) {
    assert.doesNotMatch(source, /SERVICE_ROLE|service_role/i);
  }
});

test("1.11K.2 access/session/workspace shell gates capture UI behind an active session", () => {
  assert.match(homePage, /type AccessState =/);
  assert.match(homePage, /type ViewState = "access_screen" \| "create_session" \| "capture_workspace"/);
  assert.match(homePage, /const viewState: ViewState =/);
  assert.match(homePage, /viewState === "capture_workspace" && \(/);
  assert.match(homePage, /viewState === "access_screen" && \(/);
  assert.match(homePage, /viewState === "create_session" && \(/);
  assert.doesNotMatch(homePage, /viewState !== "capture_workspace" && \(/);
});

test("1.11K.2 localStorage remains a hint and cannot unlock commercial restore before auth", () => {
  assert.match(homePage, /const canRestoreCommercialSession =/);
  assert.match(homePage, /hasCommercialAuth &&/);
  assert.match(homePage, /activeSessionMode === "commercial"/);
  assert.match(homePage, /viewState === "create_session"/);
  assert.match(homePage, /canRestoreCommercialSession && \(/);
  assert.match(homePage, /Continuar donde quedaste/);
  assert.match(homePage, /viewState === "access_screen" && \(/);
  assert.match(homePage, /Demo controlada/);
});

test("1.11K.3 public access screen removes internal labels and keeps user-facing copy", () => {
  assert.match(homePage, /Bienvenidos a EVE(?:&trade;|™)/);
  assert.match(homePage, /Crear cuenta/);
  assert.match(homePage, /Plataforma EVE(?:&trade;|™)/);
  assert.match(homePage, /Enterprise Viability Engine/);
  assert.match(homePage, /Strategic &amp; Operational\s+Architecture/);
  assert.match(homePage, /La demo no guarda datos comerciales reales\./);
  assert.doesNotMatch(homePage, /Session gate/);
  assert.doesNotMatch(homePage, /Proceso interno/);
  assert.doesNotMatch(homePage, /Conexion operativa con Supabase/);
  assert.doesNotMatch(homePage, /Crear sesion comercial/);
});

test("1.11K.3 session entry and workspace actions are gated by view state", () => {
  assert.match(homePage, /viewState === "access_screen" && \(/);
  assert.match(homePage, /viewState === "create_session" && \(/);
  assert.match(homePage, /viewState === "capture_workspace" && \(/);
  assert.match(homePage, /Empezar nuevo levantamiento/);
  assert.match(homePage, /Empezar otro levantamiento/);
  assert.match(homePage, /Cerrar sesion/);
});

test("1.11K.3B unauthenticated view hides session actions and workspace controls", () => {
  assert.match(homePage, /viewState === "access_screen" && \(/);
  assert.doesNotMatch(homePage, /viewState === "access_screen" && authSession/);
  assert.match(homePage, /viewState === "create_session" && \(/);
  assert.match(homePage, /canRestoreCommercialSession && \(/);
  assert.match(homePage, /viewState === "capture_workspace" && \(/);
  assert.match(homePage, /authSession && \(/);
  assert.match(homePage, /viewState === "capture_workspace" && \(\s*<nav/);
});

test("1.11K.3C public split layout keeps strict login-only entry and hides session actions", () => {
  const accessScreenBlock =
    homePage.match(/viewState === "access_screen" && \(([\s\S]*?)\n\s*\)\}/)?.[1] ?? "";

  assert.match(
    homePage,
    /isPublicAccess\s*\?\s*"max-w-\[1280px\]\s+items-center\s+justify-center/,
  );
  assert.match(homePage, /overflow-hidden rounded-md border border-white\/20 bg-white lg:grid lg:min-h-\[650px\] lg:grid-cols-2/);
  assert.match(homePage, /EVE&trade;/);
  assert.match(homePage, /Enterprise Viability Engine&trade;/);
  assert.match(homePage, /Iniciar sesi(?:o|ó)n|Iniciar sesion/);
  assert.doesNotMatch(accessScreenBlock, /Continuar donde quedaste/);
  assert.doesNotMatch(accessScreenBlock, /Empezar nuevo levantamiento/);
  assert.doesNotMatch(accessScreenBlock, /Cerrar sesion/);
});
