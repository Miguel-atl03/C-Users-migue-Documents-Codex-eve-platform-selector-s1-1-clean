import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");
const hookPath = resolve(tmpdir(), "eve-official-ccp-unit2b-path-hook.mjs");

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

const navigation = await importFeature("state/client-context-navigation.ts");
const { presentClientContext } = await importFeature(
  "presentation/client-context-presentation.ts",
);
const { presentClientContextShellCopy } = await importFeature(
  "presentation/client-context-shell-copy.ts",
);

const COMPANY_A = "10000000-0000-4000-8000-000000000001";
const COMPANY_B = "10000000-0000-4000-8000-000000000002";
const RELATIONSHIP_A = "30000000-0000-4000-8000-000000000001";
const CASE_A = "40000000-0000-4000-8000-000000000001";

test("navegación conserva mode/view y limpia dependencias al cambiar empresa", () => {
  const current = new URLSearchParams({
    mode: "client-company",
    view: "tracking",
    company: COMPANY_A,
    relationship: RELATIONSHIP_A,
    case: CASE_A,
    process: "future-process",
    activity: "future-activity",
  });
  const next = navigation.changeClientContextCompany(current, COMPANY_B);

  assert.equal(next.get("mode"), "client-company");
  assert.equal(next.get("view"), "tracking");
  assert.equal(next.get("company"), COMPANY_B);
  assert.equal(next.has("relationship"), false);
  assert.equal(next.has("case"), false);
  assert.equal(next.has("process"), false);
  assert.equal(next.has("activity"), false);
});

test("cambiar relación limpia caso y cambiar caso limpia selecciones futuras", () => {
  const current = new URLSearchParams({
    company: COMPANY_A,
    relationship: "old",
    case: "old-case",
    milestone: "future",
    trace: "future",
  });
  const relationshipChanged = navigation.changeClientContextRelationship(
    current,
    { companyId: COMPANY_A, relationshipId: RELATIONSHIP_A },
  );
  assert.equal(relationshipChanged.get("relationship"), RELATIONSHIP_A);
  assert.equal(relationshipChanged.has("case"), false);
  assert.equal(relationshipChanged.has("milestone"), false);

  const caseChanged = navigation.changeClientContextCase(relationshipChanged, {
    companyId: COMPANY_A,
    relationshipId: RELATIONSHIP_A,
    caseId: CASE_A,
  });
  assert.equal(caseChanged.get("case"), CASE_A);
  assert.equal(caseChanged.has("trace"), false);
});

test("presentación usa datos reales y vacíos conservadores", () => {
  assert.deepEqual(
    presentClientContext({
      companyLabel: "Cervecería Amber",
      relationshipLabel: "Relación Amber",
      caseLabel: "Caso Amber",
      currentStatusLabel: "Recopilación inicial",
    }),
    {
      companyLabel: "Cervecería Amber",
      relationshipLabel: "Relación Amber",
      caseLabel: "Caso Amber",
      currentStatusLabel: "Recopilación inicial",
      nextStepLabel: "No disponible",
      participationLabel: "Sin datos",
      attentionLabel: "No disponible",
    },
  );
});

test("prioridad de estados sincroniza cabecera banda y workspace", () => {
  const errorCopy = presentClientContextShellCopy({
    status: "error",
    view: "monitoring",
  });
  assert.equal(errorCopy.bandCaseLabel, "Contexto no disponible");
  assert.equal(
    errorCopy.workspaceTitle,
    "No fue posible abrir el contexto solicitado.",
  );
  assert.doesNotMatch(errorCopy.bandCaseLabel, /Sin contexto activo/);
  assert.equal(errorCopy.bandProcessLabel, "Resumen auxiliar del caso");
  assert.equal(errorCopy.railTitle, "Hitos core del caso");

  const emptyCopy = presentClientContextShellCopy({
    status: "no-company",
    view: "monitoring",
  });
  assert.equal(emptyCopy.workspaceTitle, "Seleccione una empresa cliente.");
  assert.match(
    emptyCopy.workspaceMessage,
    /empresa cliente, una relación activa y un caso en curso/,
  );

  const activeCopy = presentClientContextShellCopy({
    status: "active",
    view: "monitoring",
    caseStatusLabel: "Recopilación inicial",
    caseLabel: "Caso INC16 Cervecería Amber Ancestral",
  });
  assert.equal(activeCopy.workspaceTitle, "Contexto activo.");
  assert.equal(activeCopy.bandCaseState, "Recopilación inicial");
  assert.equal(
    activeCopy.bandCaseLabel,
    "Caso INC16 Cervecería Amber Ancestral",
  );

  const sessionErrorCopy = presentClientContextShellCopy({
    status: "error",
    view: "monitoring",
    errorKind: "session",
  });
  assert.equal(
    sessionErrorCopy.workspaceTitle,
    "No fue posible validar la sesión del Consultor.",
  );
  assert.doesNotMatch(
    sessionErrorCopy.workspaceTitle,
    /No fue posible abrir el contexto solicitado/,
  );

  const networkErrorCopy = presentClientContextShellCopy({
    status: "error",
    view: "monitoring",
    errorKind: "network",
  });
  assert.equal(
    networkErrorCopy.workspaceTitle,
    "No fue posible cargar el contexto.",
  );
});

test("componentes operativos existen y no importan legacy", () => {
  const files = [
    "components/ClientContextSelector.tsx",
    "components/ClientCompanySelector.tsx",
    "components/ActiveRelationshipSelector.tsx",
    "components/CurrentCaseSelector.tsx",
    "components/ClientContextState.tsx",
    "hooks/use-client-context.ts",
    "data/client-context-api.ts",
    "presentation/client-context-shell-copy.ts",
  ];
  for (const relative of files) {
    const path = featurePath(relative);
    assert.equal(existsSync(path), true, `Missing ${relative}`);
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /components\/consultant\/control-panel/,
    );
  }
});

test("UI usa combobox único y oculta vocabulario técnico", () => {
  const companySelector = readFileSync(
    featurePath("components/ClientCompanySelector.tsx"),
    "utf8",
  );
  assert.match(companySelector, /role="combobox"/);
  assert.match(companySelector, /Buscar o seleccionar empresa/);
  assert.doesNotMatch(companySelector, /client-company-search/);
  assert.doesNotMatch(companySelector, /<select/);

  const ui = [
    "components/ClientCompanyHeader.tsx",
    "components/ClientCompanyKpiStrip.tsx",
    "components/ClientContextSelector.tsx",
    "components/ClientCompanySelector.tsx",
    "components/ActiveRelationshipSelector.tsx",
    "components/CurrentCaseSelector.tsx",
    "presentation/client-context-presentation.ts",
    "presentation/client-company-kpi-items.ts",
    "components/CoreMilestoneRail.tsx",
  ]
    .map((relative) => readFileSync(featurePath(relative), "utf8"))
    .join("\n");

  for (const expected of [
    "Empresa cliente",
    "Relación activa",
    "Caso en curso",
    "Estado actual",
    "Próximo paso",
    "Atención requerida",
    "Hitos core del caso",
  ]) {
    assert.match(ui, new RegExp(expected));
  }
  assert.doesNotMatch(ui, /Participación/);
  for (const forbidden of [
    "ClientEngagement",
    "CasoDiagnosticoEVE",
    "Object[State]",
    "ReadyForTransduction",
    "relationship_id",
    "case_id",
    "company_id",
    "P-CORE-01",
    "PF-CORE-01",
  ]) {
    assert.equal(ui.includes(forbidden), false);
  }
});

test("hook consume exclusivamente BFF Unidad 2A con bearer y no-store", () => {
  const api = readFileSync(featurePath("data/client-context-api.ts"), "utf8");
  assert.match(api, /official-consultant-control-panel/);
  assert.match(api, /Authorization: `Bearer \$\{token\}`/);
  assert.match(api, /cache: "no-store"/);
  assert.doesNotMatch(api, /\.from\(|service_role|SUPABASE_SERVICE_ROLE_KEY/);

  const hook = readFileSync(featurePath("hooks/use-client-context.ts"), "utf8");
  assert.match(hook, /ensureLocalConsultantAccessToken/);
  assert.match(hook, /getAuthorizedClientCompanies/);
  assert.match(hook, /onAuthStateChange/);
  assert.doesNotMatch(hook, /createClient/);

  const bootstrap = readFileSync(
    featurePath("data/session-bootstrap.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    bootstrap,
    /official-consultant-control-panel\/local-session/,
  );
  assert.doesNotMatch(bootstrap, /fetch\(/);
  assert.match(bootstrap, /readAccessTokenFromLocalStorage/);
  assert.match(bootstrap, /readAccessToken/);
});

test("shell conserva KPIs y Eje X; sin banda auxiliar global", () => {
  const shell = readFileSync(
    featurePath("components/OfficialControlPanelShell.tsx"),
    "utf8",
  );
  assert.match(shell, /ClientCompanyKpiStrip/);
  assert.match(shell, /SupportProcessAxis/);
  assert.match(shell, /SupportProcessWorkspaceSummary/);
  assert.doesNotMatch(shell, /MainProcessBand/);
  assert.doesNotMatch(shell, /MainProcessAxis/);
  assert.match(shell, /CoreMilestoneRail/);
  assert.match(shell, /CoreMilestoneDetail/);
  assert.match(shell, /useCaseCoreMilestones/);
  // §12 RuntimeControlStateProvider is in-scope; forbid Unit-2B legacy copy only.
  assert.doesNotMatch(shell, /roles funcionales|actividades primarias/);
});

test("error oculta selectores solo en fallo de autenticación", () => {
  const selector = readFileSync(
    featurePath("components/ClientContextSelector.tsx"),
    "utf8",
  );
  assert.match(selector, /hideSelectorsForAuthFailure/);
  assert.match(selector, /errorKind === "session"/);
  assert.match(selector, /ClientContextState/);
  assert.match(selector, /onRetry/);
});

function featurePath(relative) {
  return resolve(
    projectRoot,
    "src/features/official-consultant-control-panel",
    relative,
  );
}

async function importFeature(relative) {
  return import(pathToFileURL(featurePath(relative)).href);
}
