import assert from "node:assert/strict";

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

import { dirname, join, resolve } from "node:path";

import { fileURLToPath, pathToFileURL } from "node:url";

import { register } from "node:module";

import { tmpdir } from "node:os";

import { test } from "node:test";



const testDir = dirname(fileURLToPath(import.meta.url));

const projectRoot = resolve(testDir, "../../..");



function readText(relativePath) {

  return readFileSync(resolve(projectRoot, relativePath), "utf8");

}



function assertExists(relativePath) {

  assert.equal(existsSync(resolve(projectRoot, relativePath)), true, `Missing ${relativePath}`);

}



function listFilesRecursive(dir) {

  const entries = readdirSync(dir, { withFileTypes: true });

  const files = [];

  for (const entry of entries) {

    const full = join(dir, entry.name);

    if (entry.isDirectory()) files.push(...listFilesRecursive(full));

    else files.push(full);

  }

  return files;

}



const LEGACY_IMPORT_PATTERNS = [

  /from\s+["']@\/app\/admin\/consultant-control-panel/,

  /from\s+["']@\/components\/consultant\/control-panel/,

  /ConsultantControlPanelPMShell/,

  /PMCaseHeader/,

  /from\s+["'][^"']*legacy-consultant-control-panel/,

];



const NETWORK_PATTERNS = [

  /fetch\s*\(/,

  /supabase/i,

  /createClient/,

  /from\s+["']@\/lib\/supabase/,

  /localStorage/,

  /\.from\s*\(/,

];



const BUSINESS_FIXTURE_PATTERNS = [

  /Ámbar|Ambar|Laura Méndez|Jorge Salas|FX-0/,

  /buildConsultantControlPanelState/,

  /resolveControlPanelFixtureQuery/,

  /ReadyForTransduction/,

  /EscenaEvidencial/,

  /ROLE_ASSIGNMENT_GAP/,

  /política vigente/,

  /CasoDiagnosticoEVE/,

];



const SIMULATED_METRIC_PATTERNS = [

  /\b0\s*\/\s*\d+/,

  /0 confirmados/,

  /En curso/,

  /Cervecería/,

];



const TECHNICAL_PLACEHOLDER_PATTERNS = [

  /pendiente de implementación/i,

  /Contenedor eje X/i,

  /\bRail Y\b/i,

  /Workspace central/i,

  /Drawer contextual/i,

  /Sin selección contextual/i,

];



const hookPath = join(tmpdir(), "eve-official-ccp-unit1-path-hook.mjs");

writeFileSync(

  hookPath,

  `import { pathToFileURL, fileURLToPath } from "node:url";

import { dirname, resolve as resolvePath } from "node:path";

import { existsSync } from "node:fs";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {

  if (specifier.startsWith("@/")) {

    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));

    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {

      mappedPath += ".ts";

    }

    return { shortCircuit: true, url: pathToFileURL(mappedPath).href };

  }

  if (

    (specifier.startsWith("./") || specifier.startsWith("../")) &&

    !/\\.(tsx?|jsx?|mjs|cjs|json)$/.test(specifier) &&

    context.parentURL

  ) {

    const parentDir = dirname(fileURLToPath(context.parentURL));

    const withTs = resolvePath(parentDir, specifier + ".ts");

    const withTsx = resolvePath(parentDir, specifier + ".tsx");

    if (existsSync(withTs)) {

      return { shortCircuit: true, url: pathToFileURL(withTs).href };

    }

    if (existsSync(withTsx)) {

      return { shortCircuit: true, url: pathToFileURL(withTsx).href };

    }

  }

  return nextResolve(specifier, context);

}

`,

);

register(pathToFileURL(hookPath).href);



const {

  OFFICIAL_CONTROL_PANEL_STATUS,

  officialConsultantControlPanelShellEnabled,

  parseOfficialControlPanelNavigation,

  buildOfficialControlPanelSearchParams,

  DEFAULT_OFFICIAL_PANEL_NAVIGATION,

  OFFICIAL_CONTROL_PANEL_PATH,

  CLIENT_COMPANY_KPI_LABELS,

  CLIENT_COMPANY_VIEW_COPY,
  CLIENT_COMPANY_VIEWS,
  DEFAULT_DATA_AVAILABILITY,
  CORE_STATUS_BAND_EMPTY,
  PROCESS_AXIS_EMPTY_LABEL,
  CONTEXT_DRAWER_EMPTY,
} = await import("@/features/official-consultant-control-panel/index.ts");



const REQUIRED_OFFICIAL_FILES = [

  "README.md",

  "index.ts",

  "config/official-control-panel-status.ts",

  "state/official-control-panel-navigation.ts",

  "types/official-control-panel.types.ts",

  "styles/official-control-panel.module.css",

  "components/OfficialControlPanelShell.tsx",

  "components/OfficialControlPanelModeSwitch.tsx",

  "components/ClientCompanyHeader.tsx",

  "components/ClientCompanyKpiStrip.tsx",

  "components/CoreStatusBand.tsx",

  "components/ProcessAxisPlaceholder.tsx",

  "components/CoreMilestoneRailPlaceholder.tsx",

  "components/ClientCompanyWorkspace.tsx",

  "components/WorkspaceSubnav.tsx",

  "components/AttentionGovernancePanel.tsx",

  "components/OfficialControlPanelStatusBar.tsx",

  "components/OfficialControlPanelLoadingState.tsx",

  "components/OfficialControlPanelErrorState.tsx",

];



test("official route page exists and does not redirect to legacy", () => {

  assertExists("src/app/admin/official-consultant-control-panel/page.tsx");

  assertExists("src/app/admin/official-consultant-control-panel/loading.tsx");

  assertExists("src/app/admin/official-consultant-control-panel/error.tsx");



  const page = readText("src/app/admin/official-consultant-control-panel/page.tsx");

  assert.match(page, /resolveOfficialConsultantAccess/);

  assert.match(page, /OfficialControlPanelShell/);

  assert.match(page, /officialConsultantControlPanelShellEnabled/);

  assert.match(page, /await resolveOfficialConsultantAccess/);

  assert.match(page, /const \{ mode, view, shellState \}/);

  assert.doesNotMatch(page, /params\.(surface|consultant_role|role|actorRole)/);

  assert.doesNotMatch(page, /resolveOfficialPanelRoleLabel|OfficialPanelActorRole|roleLabel=/);

  assert.doesNotMatch(page, /redirect\s*\(\s*["']\/admin\/consultant-control-panel/);

  assert.doesNotMatch(page, /ConsultantControlPanelPMShell/);

  assert.doesNotMatch(page, /from ["']@\/components\/consultant\/control-panel/);

});

test("official feature has no role mapper imports or authorization query params", () => {
  const officialDir = resolve(projectRoot, "src/features/official-consultant-control-panel");
  const officialFiles = listFilesRecursive(officialDir);

  for (const file of officialFiles) {
    if (!/\.(tsx?|mjs|md)$/.test(file)) continue;
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(
      text,
      /official-panel-actor-role|resolveOfficialPanelRoleLabel|OfficialPanelActorRole/,
      `Role mapper reference found in ${file}`,
    );
  }

  const page = readText("src/app/admin/official-consultant-control-panel/page.tsx");
  assert.doesNotMatch(
    page,
    /params\.(surface|consultant_role|role|actorRole)|params\[(["'])(surface|consultant_role|role|actorRole)\2\]/,
  );
});



test("official metadata remains design_pending with implementationStarted false", () => {

  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.status, "design_pending");

  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.implementationStarted, false);

  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.official, true);

  assert.equal(

    OFFICIAL_CONTROL_PANEL_STATUS.label,

    "Panel de Control EVE — Oficial",

  );

  assert.equal(officialConsultantControlPanelShellEnabled, true);

  assert.equal(OFFICIAL_CONTROL_PANEL_PATH, "/admin/official-consultant-control-panel");

});



test("official feature module contains Unit 1 shell files", () => {

  const officialDir = resolve(projectRoot, "src/features/official-consultant-control-panel");

  const files = listFilesRecursive(officialDir).map((f) =>

    f.slice(officialDir.length + 1).replace(/\\/g, "/"),

  );



  for (const required of REQUIRED_OFFICIAL_FILES) {

    assert.ok(files.includes(required), `Missing official file: ${required}`);

  }



  assert.equal(

    files.includes("components/ContextDrawerPlaceholder.tsx"),

    false,

    "ContextDrawerPlaceholder must be removed",

  );

});



test("navigation defaults and invalid URL normalization", () => {

  assert.deepEqual(DEFAULT_OFFICIAL_PANEL_NAVIGATION, {

    mode: "client-company",

    view: "monitoring",

    shellState: "ready-empty",

  });



  const defaults = parseOfficialControlPanelNavigation({});

  assert.equal(defaults.mode, "client-company");

  assert.equal(defaults.view, "monitoring");

  assert.equal(defaults.shellState, "ready-empty");



  const tracking = parseOfficialControlPanelNavigation({ view: "tracking" });

  assert.equal(tracking.view, "tracking");

  assert.equal(tracking.mode, "client-company");



  const governance = parseOfficialControlPanelNavigation({ view: "governance" });

  assert.equal(governance.view, "governance");



  const invalid = parseOfficialControlPanelNavigation({

    mode: "nope",

    view: "magic",

  });

  assert.equal(invalid.mode, "client-company");

  assert.equal(invalid.view, "monitoring");



  const experienceAttempt = parseOfficialControlPanelNavigation({

    mode: "user-experience-governance",

    view: "monitoring",

  });

  assert.equal(experienceAttempt.mode, "user-experience-governance");
  assert.equal(experienceAttempt.view, "journeys");



  const qs = buildOfficialControlPanelSearchParams({

    mode: "client-company",

    view: "tracking",

  }).toString();

  assert.equal(qs, "mode=client-company&view=tracking");

});



test("shellState override is ignored when production-like option is false", () => {

  const blocked = parseOfficialControlPanelNavigation(

    { shellState: "error" },

    { allowShellStateOverride: false },

  );

  assert.equal(blocked.shellState, "ready-empty");



  const allowed = parseOfficialControlPanelNavigation(

    { shellState: "loading" },

    { allowShellStateOverride: true },

  );

  assert.equal(allowed.shellState, "loading");

});



test("empty header and KPI labels have no invented business values", () => {
  const header = readText(
    "src/features/official-consultant-control-panel/components/ClientCompanyHeader.tsx",
  );
  assert.match(header, /Rol: Consultor/);
  assert.doesNotMatch(header, /Participación/);
  assert.doesNotMatch(header, /Estado actual/);
  assert.doesNotMatch(header, /Experto|Operador interno|Supervisor|Auditor/);

  assert.equal(CLIENT_COMPANY_KPI_LABELS.length, 5);
  assert.deepEqual([...CLIENT_COMPANY_KPI_LABELS], [
    "Estado actual",
    "Próximo paso",
    "Atención requerida",
    "Hitos core alcanzados",
    "Alertas de experiencia",
  ]);



  assert.equal(CLIENT_COMPANY_VIEW_COPY.monitoring.title, "Monitoreo de Empresa Cliente");

  assert.equal(CLIENT_COMPANY_VIEW_COPY.monitoring.emptyTitle, "Seleccione una empresa cliente.");

  assert.match(
    CLIENT_COMPANY_VIEW_COPY.monitoring.emptyMessage,
    /empresa cliente, una relación activa y un caso en curso/,
  );

  assert.equal(DEFAULT_DATA_AVAILABILITY, "no-context");

  assert.equal(CORE_STATUS_BAND_EMPTY.caseState, "No disponible");
  assert.equal(CORE_STATUS_BAND_EMPTY.processLabel, "Resumen auxiliar del caso");
});



test("official module has zero legacy imports and zero network/fixture usage", () => {

  const officialDir = resolve(projectRoot, "src/features/official-consultant-control-panel");

  const routeDir = resolve(projectRoot, "src/app/admin/official-consultant-control-panel");

  const files = [

    ...listFilesRecursive(officialDir),

    ...listFilesRecursive(routeDir),

  ];



  for (const file of files) {

    if (!/\.(tsx?|mjs|css)$/.test(file)) continue;

    const text = readFileSync(file, "utf8");

    const rel = file

      .slice(projectRoot.length + 1)

      .replace(/\\/g, "/");



    for (const pattern of LEGACY_IMPORT_PATTERNS) {

      assert.doesNotMatch(

        text,

        pattern,

        `Legacy pattern ${pattern} found in ${rel}`,

      );

    }



    if (
      !rel.endsWith("page.tsx") &&
      !rel.endsWith("data/client-context-api.ts") &&
      !rel.endsWith("data/local-session-bootstrap.ts") &&
      !rel.endsWith("data/session-bootstrap.ts") &&
      !rel.endsWith("hooks/use-client-context.ts") &&
      !rel.endsWith("components/OfficialPanelLocalAccessHelper.tsx")
    ) {

      for (const pattern of NETWORK_PATTERNS) {

        if (pattern.source === "\\.from\\s*\\(") continue;

        assert.doesNotMatch(

          text,

          pattern,

          `Network pattern ${pattern} found in ${rel}`,

        );

      }

    }



    for (const pattern of BUSINESS_FIXTURE_PATTERNS) {
      // Canonical object-label map translates technical MBA labels to Spanish.
      if (rel.endsWith("presentation/operational-object-label-presentation.ts")) {
        continue;
      }

      assert.doesNotMatch(

        text,

        pattern,

        `Business fixture pattern ${pattern} found in ${rel}`,

      );

    }



    for (const pattern of SIMULATED_METRIC_PATTERNS) {
      // Factual company-state gate may compare the canonical "En curso" label.
      if (
        pattern.source === "En curso" &&
        /presentation\/company-state/.test(rel)
      ) {
        continue;
      }

      assert.doesNotMatch(

        text,

        pattern,

        `Simulated metric pattern ${pattern} found in ${rel}`,

      );

    }

  }

});



test("canonical architecture and EVE visual structure are present in shell", () => {

  const shell = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",

  );

  assert.match(shell, /ClientCompanyHeader/);

  assert.match(shell, /ClientCompanyKpiStrip/);

  assert.match(shell, /OfficialControlPanelModeSwitch/);

  assert.match(shell, /SupportProcessAxis/);
  assert.match(shell, /SupportProcessWorkspaceSummary/);
  assert.doesNotMatch(shell, /MainProcessBand/);
  assert.doesNotMatch(shell, /MainProcessAxis/);

  assert.match(shell, /CoreMilestoneRail/);

  assert.match(shell, /CoreMilestoneDetail/);

  assert.match(shell, /useCaseCoreMilestones/);

  assert.match(shell, /AttentionGovernancePanel/);

  assert.doesNotMatch(shell, /OfficialControlPanelStatusBar/);

  assert.doesNotMatch(shell, /ContextDrawerPlaceholder/);

  assert.doesNotMatch(shell, /sidebarSlot/);



  assert.doesNotMatch(shell, /OfficialControlPanelSidebar|roleLabel/);

  // §12 Runtime control provider is in-scope; forbid Unit-1 legacy copy only.
  assert.doesNotMatch(shell, /roles funcionales|actividades primarias/i);



  const modeSwitch = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelModeSwitch.tsx",

  );

  assert.match(modeSwitch, /Empresa Cliente/);

  assert.match(modeSwitch, /Gobernanza de Experiencia/);

  assert.doesNotMatch(modeSwitch, /Próximamente/);

  assert.doesNotMatch(modeSwitch, /Diseño/);



  const coreBand = readText(

    "src/features/official-consultant-control-panel/components/MainProcessBand.tsx",

  );

  assert.match(coreBand, /Resumen auxiliar del caso/);

  assert.match(coreBand, /UNAVAILABLE_LABEL/);

  assert.doesNotMatch(coreBand, /ReadyForTransduction/);

  assert.doesNotMatch(coreBand, /EscenaEvidencial/);

  assert.doesNotMatch(coreBand, /política vigente/);

  assert.doesNotMatch(coreBand, /P-CORE-01/);

  assert.doesNotMatch(coreBand, /case_main_processes|current_milestone_id/);



  const axis = readText(

    "src/features/official-consultant-control-panel/components/MainProcessAxis.tsx",

  );

  assert.match(axis, /aria-label="Resumen auxiliar del caso"/);

  assert.match(axis, /Resumen auxiliar del caso: No disponible/);

  assert.doesNotMatch(axis, /P-SUP/);

  assert.doesNotMatch(axis, /P-CORE-01/);

  assert.doesNotMatch(axis, /button/);

  assert.doesNotMatch(axis, /useState/);

  assert.doesNotMatch(axis, /onClick/);



  const axisTypes = readText(

    "src/features/official-consultant-control-panel/types/official-control-panel.types.ts",

  );

  assert.match(axisTypes, /Resumen auxiliar del caso/);

  assert.match(axisTypes, /Sin empresa seleccionada/);

  assert.match(axisTypes, /No disponible/);

  assert.doesNotMatch(axisTypes, /P-CORE-01/);

  assert.doesNotMatch(axisTypes, /P-SUP-01/);

  assert.doesNotMatch(axisTypes, /PROCESS_AXIS_ITEMS/);



  const rail = readText(

    "src/features/official-consultant-control-panel/components/CoreMilestoneRail.tsx",

  );

  assert.match(rail, /Hitos core del caso/);

  assert.match(rail, /aria-pressed/);

  assert.doesNotMatch(rail, /CORE_MILESTONE_ITEMS/);

  assert.doesNotMatch(rail, /case_milestones|current_milestone_id/);

  assert.match(axisTypes, /Sin empresa seleccionada/);

  assert.doesNotMatch(axisTypes, /Caso abierto/);

  assert.doesNotMatch(axisTypes, /ClosedWithoutSufficiency/);



  const attention = readText(

    "src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx",

  );

  assert.match(attention, /Atención y Gobernanza/);

  assert.match(attention, /presentClientContextShellCopy/);

  assert.match(attention, /Abrir panel contextual/);

  assert.match(attention, /aria-expanded/);

  assert.match(attention, /Escape/);

  assert.match(attention, /collapsed/);

  assert.doesNotMatch(attention, /ROLE_ASSIGNMENT_GAP/);

  assert.doesNotMatch(attention, /Abrir detalle/);

  assert.doesNotMatch(attention, /findings/i);



  const workspace = readText(

    "src/features/official-consultant-control-panel/components/ClientCompanyWorkspace.tsx",

  );

  assert.doesNotMatch(workspace, /Ver detalle/);

  assert.doesNotMatch(workspace, /skeleton/);

  assert.match(workspace, /presentClientContextShellCopy/);

  assert.match(workspace, /workspaceTitle/);

  assert.match(workspace, /workspaceMessage/);

  assert.match(axisTypes, /Monitoreo de Empresa Cliente/);



  const statusBar = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelStatusBar.tsx",

  );

  assert.ok(statusBar.length > 0, "status bar module retained for dev-only use");
  assert.doesNotMatch(
    readText(
      "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
    ),
    /OfficialControlPanelStatusBar/,
  );



  const errorState = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelErrorState.tsx",

  );

  assert.match(errorState, /No fue posible preparar el panel\./);

  assert.match(errorState, /Reintentar/);



  const loading = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelLoadingState.tsx",

  );

  assert.match(loading, /aria-busy/);



  const css = readText(

    "src/features/official-consultant-control-panel/styles/official-control-panel.module.css",

  );

  assert.match(css, /#f5f5f5/);

  assert.match(css, /:focus-visible/);

  assert.match(css, /\.appShell/);

  assert.match(css, /\.matrix/);

  const appShellRule = css.match(/\.appShell\s*\{([^}]*)\}/s)?.[1] ?? "";

  const mainColumnRule = css.match(/\.mainColumn\s*\{([^}]*)\}/s)?.[1] ?? "";

  for (const [selector, rule] of [
    [".appShell", appShellRule],
    [".mainColumn", mainColumnRule],
  ]) {
    assert.doesNotMatch(rule, /\bopacity\s*:/, `${selector} must not dim the panel`);
    assert.doesNotMatch(rule, /\bfilter\s*:/, `${selector} must not filter the panel`);
    assert.doesNotMatch(
      rule,
      /\bpointer-events\s*:\s*none/,
      `${selector} must remain interactive`,
    );
  }

  assert.doesNotMatch(
    css,
    /\.chipButton:disabled,[\s\S]*?\.processChip:disabled\s*\{[^}]*opacity:/,
  );

  assert.match(
    css,
    /\.chipButton:disabled,[\s\S]*?\.processChip:disabled\s*\{[^}]*color:\s*#9ca0aa;/,
  );

  assert.match(css, /\.coreBandChipLabel\s*\{[^}]*color:\s*#ffffff;/s);

});



test("no technical placeholder copy in user-facing components", () => {

  const componentPaths = [

    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",

    "src/features/official-consultant-control-panel/components/ClientCompanyHeader.tsx",

    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",

    "src/features/official-consultant-control-panel/components/ProcessAxisPlaceholder.tsx",

    "src/features/official-consultant-control-panel/components/CoreMilestoneRailPlaceholder.tsx",

    "src/features/official-consultant-control-panel/components/ClientCompanyWorkspace.tsx",

    "src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx",

  ];



  const header = readText(
    "src/features/official-consultant-control-panel/components/ClientCompanyHeader.tsx",
  );
  assert.match(header, /ClientContextSelector/);
  assert.match(header, /Rol: Consultor/);
  assert.doesNotMatch(header, /presentClientContext/);
  assert.doesNotMatch(header, /roleLabel|Experto|Operador interno|Supervisor|Auditor/);

  const kpiStrip = readText(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  assert.match(kpiStrip, /buildClientCompanyKpiItems|ClientContextPresentation/);
  assert.match(kpiStrip, /Estado actual/);
  const kpiItems = readText(
    "src/features/official-consultant-control-panel/presentation/client-company-kpi-items.ts",
  );
  assert.match(kpiItems, /Hitos core alcanzados/);
  assert.match(kpiItems, /Estado actual/);
  assert.match(kpiItems, /resolveAggregationStatusLabels/);


  for (const path of componentPaths) {

    const text = readText(path);

    for (const pattern of TECHNICAL_PLACEHOLDER_PATTERNS) {

      assert.doesNotMatch(

        text,

        pattern,

        `Technical placeholder ${pattern} found in ${path}`,

      );

    }

  }

});



test("accessibility attributes are declared on interactive controls", () => {

  const subnav = readText(

    "src/features/official-consultant-control-panel/components/WorkspaceSubnav.tsx",

  );

  assert.match(subnav, /role="tablist"/);

  assert.match(subnav, /role="tab"/);

  assert.match(subnav, /aria-selected/);



  const shell = readText(

    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",

  );

  assert.match(shell, /useSearchParams/);

  assert.match(shell, /router\.push/);

  assert.match(shell, /router\.replace/);

  assert.doesNotMatch(shell, /roleLabel/);

  assert.doesNotMatch(shell, /localStorage/);

});



test("page does not consume remote data APIs", () => {

  const page = readText("src/app/admin/official-consultant-control-panel/page.tsx");

  assert.doesNotMatch(page, /buildConsultantControlPanelState/);

  assert.doesNotMatch(page, /fetch\s*\(/);

  assert.doesNotMatch(page, /supabase/i);

  assert.doesNotMatch(page, /createClient/);

});



test("authorized subviews only and no design navigation", () => {

  const subnav = readText(

    "src/features/official-consultant-control-panel/components/WorkspaceSubnav.tsx",

  );

  assert.match(subnav, /CLIENT_COMPANY_VIEW_COPY/);

  assert.match(subnav, /"monitoring"/);

  assert.match(subnav, /"tracking"/);

  assert.match(subnav, /"governance"/);

  assert.doesNotMatch(subnav, /Diseño/);



  assert.deepEqual([...CLIENT_COMPANY_VIEWS], [

    "monitoring",

    "tracking",

    "governance",

  ]);



  const nav = readText(

    "src/features/official-consultant-control-panel/state/official-control-panel-navigation.ts",

  );

  assert.doesNotMatch(nav, /design/i);

});



test("dead components removed and playwright interaction spec exists", () => {

  assert.equal(

    existsSync(

      resolve(

        projectRoot,

        "src/features/official-consultant-control-panel/components/OfficialControlPanelTopBar.tsx",

      ),

    ),

    false,

  );

  assert.equal(

    existsSync(

      resolve(

        projectRoot,

        "src/features/official-consultant-control-panel/components/OfficialControlPanelEmptyState.tsx",

      ),

    ),

    false,

  );

  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/components/OfficialControlPanelSidebar.tsx",
      ),
    ),
    false,
  );

  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/utils/official-panel-actor-role.ts",
      ),
    ),
    false,
  );

  assertExists("tests/e2e/official-consultant-control-panel-unit1.spec.ts");

  const readme = readText("src/features/official-consultant-control-panel/README.md");

  assert.match(readme, /siete campos/);
  assert.match(readme, /siete KPIs/);
  assert.match(readme, /Eje X vacío/);
  assert.match(readme, /Rail Y vacío/);
  assert.match(readme, /Drawer contextual/);
  assert.match(readme, /Tres subvistas/);
  assert.match(readme, /loading.*error.*ready-empty/s);
  assert.match(readme, /panel legacy/);
  assert.doesNotMatch(
    readme,
    /Brand strip|role mapping|actor role resolution|Experto|Operador interno|Supervisor|Auditor/i,
  );

});

