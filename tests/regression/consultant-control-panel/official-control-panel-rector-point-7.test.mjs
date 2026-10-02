import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-point7-path-hook.mjs");
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
  SUPPORT_PROCESS_DEFINITIONS,
  SUPPORT_PROCESS_TODOS,
  SUPPORT_PROCESS_CODES,
  isSupportProcessAxisCode,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/catalogs/support-process-axis.catalog.ts",
    ),
  ).href
);

const {
  buildSupportProcessAxisResponse,
  assertConsultantCaseSupportProcessAccess,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-support-process-service.ts",
    ),
  ).href
);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

const EXPECTED_ORDER = [
  "P-SUP-01",
  "P-SUP-02",
  "P-SUP-03",
  "P-SUP-04",
  "P-SUP-05",
  "P-SUP-06",
  "P-SUP-07/08",
  "P-SUP-09",
];

const EXPECTED_MODES = {
  "P-SUP-01": "platform",
  "P-SUP-02": "platform",
  "P-SUP-03": "manual",
  "P-SUP-04": "manual",
  "P-SUP-05": "manual",
  "P-SUP-06": "platform",
  "P-SUP-07/08": "platform",
  "P-SUP-09": "platform",
};

const EXPECTED_LABELS = {
  "P-SUP-01": "Consolidar escena operativa regulada.",
  "P-SUP-02": "Preparar EvidenceBundle para transducción.",
  "P-SUP-03": "Transducir evidencia por rol funcional.",
  "P-SUP-04": "Agregar causalidad empresarial.",
  "P-SUP-05": "Componer síntesis experta.",
  "P-SUP-06": "Producir inventario MMABP y diagramación.",
  "P-SUP-07/08": "Resolver gaps y validar conformance/consistency.",
  "P-SUP-09": "Generar código exportable.",
};

test("catálogo §7: códigos, orden, agrupación 07/08; Todos retirado del eje", () => {
  assert.equal(SUPPORT_PROCESS_TODOS.code, "Todos");
  assert.equal(SUPPORT_PROCESS_TODOS.retiredFromAxis, true);
  assert.equal(
    SUPPORT_PROCESS_TODOS.label,
    "Vista agregada de todas las líneas.",
  );
  assert.deepEqual(
    SUPPORT_PROCESS_DEFINITIONS.map((item) => item.code),
    EXPECTED_ORDER,
  );
  assert.equal(SUPPORT_PROCESS_CODES.length, 8);
  assert.ok(!SUPPORT_PROCESS_CODES.includes("P-SUP-07"));
  assert.ok(!SUPPORT_PROCESS_CODES.includes("P-SUP-08"));
  assert.ok(SUPPORT_PROCESS_CODES.includes("P-SUP-07/08"));
  assert.equal(isSupportProcessAxisCode("Todos"), false);

  for (const definition of SUPPORT_PROCESS_DEFINITIONS) {
    assert.equal(definition.executionMode, EXPECTED_MODES[definition.code]);
    assert.equal(definition.label, EXPECTED_LABELS[definition.code]);
    assert.equal(definition.triggerLabel, null);
    assert.equal(definition.nextEventLabel, null);
    assert.equal(definition.dependencyLabel, null);
  }

  assert.equal(
    SUPPORT_PROCESS_DEFINITIONS.find((item) => item.code === "P-SUP-09")
      ?.sequence,
    8,
  );
  assert.equal(SUPPORT_PROCESS_TODOS.sequence, 0);
  assert.equal(SUPPORT_PROCESS_TODOS.modalityLabel, "Vista global");
  assert.ok(!/Plataforma \/ manual/.test(SUPPORT_PROCESS_TODOS.modalityLabel));

  assert.equal(
    SUPPORT_PROCESS_DEFINITIONS.find((item) => item.code === "P-SUP-01")
      ?.targetObjectLabel,
    "SceneCanonicalRecord",
  );
  assert.equal(
    SUPPORT_PROCESS_DEFINITIONS.find((item) => item.code === "P-SUP-01")
      ?.targetStateLabel,
    "Consolidated",
  );
});

test("BFF response degrada estado operacional sin inventar atención", () => {
  const response = buildSupportProcessAxisResponse();
  assert.equal(response.operationalDataBlocked, true);
  assert.deepEqual(
    response.items.map((item) => item.code),
    EXPECTED_ORDER,
  );

  for (const item of response.items) {
    assert.equal(item.operationalStatusLabel, null);
    assert.equal(item.attentionCount, null);
    assert.equal(item.dataStatus, "unavailable");
  }

  const manual = response.items.filter((item) => item.executionMode === "manual");
  assert.deepEqual(
    manual.map((item) => item.code),
    ["P-SUP-03", "P-SUP-04", "P-SUP-05"],
  );
});

test("assertConsultantCaseSupportProcessAccess deniega fuera de scope", async () => {
  const denied = await assertConsultantCaseSupportProcessAccess(
    {
      async findAuthorizedCompany() {
        return null;
      },
      async findActiveRelationship() {
        return null;
      },
      async findCase() {
        return null;
      },
      async listAuthorizedCompanies() {
        return [];
      },
      async listActiveRelationships() {
        return [];
      },
      async listCurrentCases() {
        return [];
      },
    },
    {
      consultantUserId: "c0000000-0000-4000-8000-000000000099",
      companyId: "5c08029f-15e9-4bbd-b13e-0ff4765e23b8",
      relationshipId: "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043",
      caseId: "19fc9eff-4219-43f0-854c-e2b3350f23f2",
    },
  );
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(
      denied.message,
      "No fue posible abrir los procesos de soporte del caso.",
    );
  }
});

test("navegación process ausente / inválido limpia; válido se conserva", async () => {
  const nav = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/state/support-process-navigation.ts",
      ),
    ).href
  );

  assert.equal(nav.parseSupportProcessSelection(new URLSearchParams("")), null);
  assert.equal(
    nav.parseSupportProcessSelection(new URLSearchParams("process=Todos")),
    null,
  );
  assert.equal(
    nav.parseSupportProcessSelection(
      new URLSearchParams("process=P-SUP-07%2F08"),
    ),
    "P-SUP-07/08",
  );
  assert.equal(
    nav.parseSupportProcessSelection(new URLSearchParams("process=H0")),
    null,
  );
  assert.equal(nav.supportProcessNeedsClear(new URLSearchParams("")), false);
  assert.equal(
    nav.supportProcessNeedsClear(new URLSearchParams("process=invalid")),
    true,
  );
  assert.equal(
    nav.supportProcessNeedsClear(new URLSearchParams("process=Todos")),
    true,
  );
  assert.equal(
    nav.supportProcessNeedsClear(new URLSearchParams("process=P-SUP-01")),
    false,
  );

  const withMilestone = new URLSearchParams(
    "process=P-SUP-02&milestone=abc&view=monitoring",
  );
  const next = nav.buildSupportProcessNavigation(withMilestone, "P-SUP-03");
  assert.equal(next.get("process"), "P-SUP-03");
  assert.equal(next.get("milestone"), "abc");
  assert.equal(isSupportProcessAxisCode("P-SUP-07/08"), true);

  const cleared = nav.clearSupportProcessNavigation(next);
  assert.equal(cleared.get("process"), null);
  assert.equal(cleared.get("milestone"), "abc");

  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-support-processes.ts",
  );
  assert.match(hook, /clearSupportProcessNavigation/);
  assert.match(hook, /currentSelected === processCode/);

  const summary = read(
    "src/features/official-consultant-control-panel/components/SupportProcessWorkspaceSummary.tsx",
  );
  assert.match(summary, /supportProcessSummaryCollapsed/);
  assert.doesNotMatch(summary, /SELECT_SUPPORT_PROCESS_MESSAGE/);
});

test("ruta BFF y UI no usan documento Runtime excluido ni inventan estados Amber", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/support-processes/route.ts",
  );
  assert.match(route, /buildSupportProcessAxisResponse/);
  assert.match(route, /assertConsultantCaseSupportProcessAccess/);
  assert.match(
    route,
    /No fue posible abrir los procesos de soporte del caso/,
  );
  assert.doesNotMatch(route, /Runtime_40_20_MBA_Ajustado/);
  assert.doesNotMatch(route, /attentionCount:\s*0/);

  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /SupportProcessAxis/);
  assert.match(shell, /SupportProcessWorkspaceSummary/);
  assert.doesNotMatch(shell, /Runtime_40_20_MBA_Ajustado/);

  const axis = read(
    "src/features/official-consultant-control-panel/components/SupportProcessAxis.tsx",
  );
  assert.match(axis, /Procesos de soporte/);
  assert.doesNotMatch(axis, />Eje X</);

  const catalog = read(
    "src/services/eve/official-control-panel/catalogs/support-process-axis.catalog.ts",
  );
  assert.doesNotMatch(catalog, /Runtime_40_20_MBA_Ajustado/);
  assert.doesNotMatch(catalog, /pm-process-catalog/);

  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/components/SupportProcessAxisTooltip.tsx",
      ),
    ),
  );
});

test("cliente Supabase global no usa lock no-op del panel", () => {
  const supabaseClient = read("src/lib/supabase.ts");
  assert.doesNotMatch(supabaseClient, /panelAuthLock/);
  assert.doesNotMatch(supabaseClient, /lock:\s*panelAuthLock/);
  assert.doesNotMatch(supabaseClient, /lock:\s*async/);
  assert.match(supabaseClient, /createBrowserClient/);
  assert.doesNotMatch(supabaseClient, /service_role_key|SERVICE_ROLE_KEY/i);
});

test("Eje X exige contexto autorizado; no basta case en URL", () => {
  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-support-processes.ts",
  );
  assert.match(hook, /AuthorizedCaseContext|resolveAuthorizedCaseContext/);
  assert.match(hook, /authReadiness !== "authenticated"/);
  assert.match(hook, /context\.status !== "active"/);
  assert.doesNotMatch(hook, /contextCaseId \?\? urlCaseId/);
  assert.match(hook, /AbortController/);
  assert.match(hook, /requestIdRef/);
  assert.match(hook, /router\.push/);
  assert.match(hook, /router\.replace/);
  assert.doesNotMatch(hook, /history\.pushState|history\.replaceState/);
});

test("UI Eje X: toolbar, sin Todos, scroll horizontal, sin banda auxiliar en shell", () => {
  const axis = read(
    "src/features/official-consultant-control-panel/components/SupportProcessAxis.tsx",
  );
  assert.match(axis, /role="toolbar"/);
  assert.match(axis, /Home/);
  assert.match(axis, /End/);
  assert.doesNotMatch(axis, /role="tablist"/);

  const item = read(
    "src/features/official-consultant-control-panel/components/SupportProcessAxisItem.tsx",
  );
  assert.match(item, /aria-pressed/);
  assert.doesNotMatch(item, /Vista global/);
  assert.doesNotMatch(item, /Todos/);
  assert.doesNotMatch(item, /Plataforma \/ manual/);

  const css = read(
    "src/features/official-consultant-control-panel/styles/official-control-panel.module.css",
  );
  assert.match(css, /supportProcessAxisTrack[\s\S]*overflow-y:\s*hidden/);
  assert.match(css, /supportProcessAxisTrackInner[\s\S]*width:\s*max-content/);

  const rail = read(
    "src/features/official-consultant-control-panel/components/CoreMilestoneRail.tsx",
  );
  assert.match(rail, /Hitos core del caso/);
  assert.match(rail, /aria-pressed/);
  assert.doesNotMatch(rail, /role="option"/);

  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.doesNotMatch(shell, /MainProcessBand/);
  assert.doesNotMatch(shell, /MainProcessAxis/);
  assert.match(shell, /ClientCompanyKpiStrip/);
  assert.match(shell, /presentClientContext/);
  assert.match(shell, /CoreMilestoneRail/);
});

test("classifySupportProcessAxisStatus usa contexto autorizado", async () => {
  const presentation = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/presentation/support-process-axis-presentation.ts",
      ),
    ).href
  );
  assert.equal(
    presentation.classifySupportProcessAxisStatus({
      hasAuthorizedContext: false,
      loading: false,
      error: false,
      itemsLoaded: false,
      operationalDataBlocked: true,
    }),
    "idle",
  );
  assert.equal(
    presentation.axisStatusMessage("idle"),
    "Seleccione un caso en curso para consultar los procesos de soporte.",
  );
  assert.match(
    presentation.formatSupportProcessAriaAnnouncement(
      {
        code: "P-SUP-03",
        label: "x",
        sequence: 3,
        executionMode: "manual",
        modalityLabel: "MANUAL",
        targetObjectLabel: null,
        targetStateLabel: null,
        triggerLabel: null,
        nextEventLabel: null,
        dependencyLabel: null,
        operationalStatusLabel: null,
        attentionCount: null,
        dataStatus: "unavailable",
      },
      true,
    ),
    /seleccionado/,
  );
});

test("cambio de empresa/relación/caso limpia process en navegación de contexto", () => {
  const nav = read(
    "src/features/official-consultant-control-panel/state/client-context-navigation.ts",
  );
  assert.match(nav, /"process"/);
  assert.match(nav, /clearFutureDependencies/);
});

test("docs §7/§8 independencia documentada", () => {
  const plan = read("docs/eve/panel-control/RECTOR_POINTS_1_9_IMPLEMENTATION_PLAN.md");
  assert.match(plan, /independientes/);
  assert.match(plan, /no requiere §7/);

  const status = read("docs/eve/panel-control/RECTOR_POINTS_1_9_STATUS_DICTAMEN.md");
  assert.match(status, /independientes/);
  assert.match(status, /§9 requiere ambos/);
});
