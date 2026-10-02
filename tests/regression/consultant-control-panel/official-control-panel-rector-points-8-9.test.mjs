import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-point8-9-fix-hook.mjs");
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

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

const {
  CORE_MILESTONE_CODES,
  resolveCoreMilestoneUiState,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog.ts",
    ),
  ).href
);

const {
  getXyRelationCode,
  XY_SUPPORT_MATRIX_ROWS,
  XY_CLIENT_BORDER_ROW,
  XY_MATRIX_MILESTONE_COLUMNS,
  XY_RELATION_LEGEND,
  presentXyIntersectionMessage,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/catalogs/xy-interaction-matrix.catalog.ts",
    ),
  ).href
);

const {
  buildCoreMilestoneAxisResponse,
  buildCoreMilestoneAxisCatalogFallback,
  normalizeCoreMilestoneProgressForPresentation,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-core-milestone-axis-service.ts",
    ),
  ).href
);

const { formatCoreMilestoneKpiValue } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/core-milestone-axis-presentation.ts",
    ),
  ).href
);

function allLinks(overrides = {}) {
  return CORE_MILESTONE_CODES.map((code) => ({
    code,
    reached: false,
    linkPresent: true,
    linkApplicable: true,
    ...overrides[code],
  }));
}

test("factual states: unavailable / missing link / not applicable -> null", () => {
  assert.equal(
    resolveCoreMilestoneUiState({
      progressStatus: "unavailable",
      linkPresent: true,
      linkApplicable: true,
      reached: false,
    }),
    null,
  );
  assert.equal(
    resolveCoreMilestoneUiState({
      progressStatus: "available",
      linkPresent: false,
      linkApplicable: false,
      reached: false,
    }),
    null,
  );
  assert.equal(
    resolveCoreMilestoneUiState({
      progressStatus: "available",
      linkPresent: true,
      linkApplicable: false,
      reached: false,
    }),
    null,
  );
});

test("factual states: never invent current_wait / manual_pending / blocked", () => {
  const amber = buildCoreMilestoneAxisCatalogFallback();
  for (const item of amber.items) {
    assert.equal(item.uiState, null);
    assert.equal(item.uiStateLabel, "No disponible");
    assert.equal(item.reached, null);
  }

  const partial = buildCoreMilestoneAxisResponse({
    status: "partial",
    achieved: 1,
    total: 7,
    milestones: allLinks({
      H0: { reached: true },
      H1: { reached: false },
    }),
    finalAlternative: null,
  });
  assert.equal(partial.items[0].uiState, "reached");
  assert.equal(partial.items[1].uiState, null);
  assert.equal(partial.items[1].uiStateLabel, "No disponible");
  assert.doesNotMatch(
    JSON.stringify(partial.items.map((i) => i.uiState)),
    /current_wait|manual_pending|blocked/,
  );

  const available = buildCoreMilestoneAxisResponse({
    status: "available",
    achieved: 1,
    total: 7,
    milestones: allLinks({ H0: { reached: true } }),
    finalAlternative: null,
  });
  assert.equal(available.items[0].uiState, "reached");
  assert.equal(available.items[1].uiState, "not_reached");
  assert.doesNotMatch(
    JSON.stringify(available.items.map((i) => i.uiState)),
    /current_wait|manual_pending|blocked/,
  );
});

test("KPI only x/7 when available and total 7", () => {
  assert.equal(
    formatCoreMilestoneKpiValue({
      achieved: 2,
      total: 7,
      status: "available",
    }).value,
    "2/7",
  );
  assert.equal(
    formatCoreMilestoneKpiValue({
      achieved: 2,
      total: 7,
      status: "partial",
    }).empty,
    true,
  );
  assert.equal(
    formatCoreMilestoneKpiValue({
      achieved: 2,
      total: 6,
      status: "available",
    }).empty,
    true,
  );
  assert.equal(
    formatCoreMilestoneKpiValue({
      achieved: 0,
      total: 0,
      status: "unavailable",
    }).empty,
    true,
  );

  const normalized = normalizeCoreMilestoneProgressForPresentation({
    status: "available",
    achieved: 7,
    total: 6,
    milestones: allLinks(),
    finalAlternative: null,
  });
  assert.equal(normalized.status, "partial");
});

test("matrix has 8 P-SUP rows, 7 columns, P-CLIENT-01 border, legend", () => {
  assert.equal(XY_SUPPORT_MATRIX_ROWS.length, 8);
  assert.equal(XY_MATRIX_MILESTONE_COLUMNS.length, 7);
  assert.equal(XY_CLIENT_BORDER_ROW.code, "P-CLIENT-01");
  assert.equal(XY_CLIENT_BORDER_ROW.kind, "client_border");
  assert.equal(XY_RELATION_LEGEND.length, 5);
  assert.equal(getXyRelationCode("P-SUP-01", "H1"), "D");
  assert.equal(getXyRelationCode("P-SUP-03", "H3"), "M");
  assert.equal(getXyRelationCode("P-SUP-06", "H2"), "P");
  assert.equal(getXyRelationCode("P-SUP-07/08", "H1"), "P*");
  assert.equal(getXyRelationCode("P-SUP-01", "H0"), "-");
  assert.equal(getXyRelationCode("P-CLIENT-01", "H0"), "D");
  assert.equal(getXyRelationCode("P-CLIENT-01", "H6"), "D");
  assert.match(presentXyIntersectionMessage("D"), /arquitect/);
});

test("validated selection: URL alone does not become selectedCode without items", async () => {
  const {
    presentCoreMilestoneAxisViewModel,
    resolveEffectiveMilestoneCode,
    classifyCoreMilestoneAxisStatus,
  } = await import(
    pathToFileURL(
      resolve(
        projectRoot,
        "src/features/official-consultant-control-panel/presentation/core-milestone-axis-presentation.ts",
      ),
    ).href
  );

  const fallback = buildCoreMilestoneAxisCatalogFallback();
  const loadingVm = presentCoreMilestoneAxisViewModel({
    status: "loading",
    items: [],
    selectedCode: "H2",
    progress: fallback.progress,
    finalAlternative: null,
    operationalDataBlocked: true,
    refreshing: false,
  });
  assert.equal(loadingVm.selectedCode, null);
  assert.equal(loadingVm.selectedItem, null);
  assert.equal(resolveEffectiveMilestoneCode(loadingVm), null);

  const readyVm = presentCoreMilestoneAxisViewModel({
    status: "partial",
    items: fallback.items,
    selectedCode: "H2",
    progress: fallback.progress,
    finalAlternative: null,
    operationalDataBlocked: true,
    refreshing: false,
  });
  assert.equal(readyVm.selectedCode, "H2");
  assert.equal(readyVm.selectedItem?.code, "H2");
  assert.equal(resolveEffectiveMilestoneCode(readyVm), "H2");

  assert.equal(
    classifyCoreMilestoneAxisStatus({
      hasAuthorizedContext: true,
      loading: true,
      error: false,
      itemsLoaded: false,
      operationalDataBlocked: true,
    }),
    "loading",
  );
  assert.equal(
    classifyCoreMilestoneAxisStatus({
      hasAuthorizedContext: true,
      loading: false,
      error: false,
      itemsLoaded: true,
      operationalDataBlocked: true,
    }),
    "ready",
  );
});

test("UI wiring: detail first, matrix present, rail copy, a11y pattern", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  const detailIdx = shell.indexOf("<CoreMilestoneDetail");
  const interIdx = shell.indexOf("<XyIntersectionPanel");
  const matrixIdx = shell.indexOf("<XyInteractionMatrix");
  const peopleIdx = shell.indexOf("<CaseParticipantsPanel");
  assert.ok(detailIdx > 0 && interIdx > detailIdx);
  assert.ok(matrixIdx > interIdx && peopleIdx > matrixIdx);
  assert.match(shell, /resolveEffectiveMilestoneCode/);
  assert.match(shell, /effectiveMilestoneCode/);
  assert.doesNotMatch(
    shell.slice(interIdx, matrixIdx + 80),
    /coreMilestoneAxis\.selectedCode/,
  );

  const rail = read(
    "src/features/official-consultant-control-panel/components/CoreMilestoneRail.tsx",
  );
  assert.match(rail, /Hitos core del caso/);
  assert.match(rail, /aria-pressed/);
  assert.match(rail, /Actualizando hitos/);
  assert.doesNotMatch(rail, /role="option"/);
  assert.doesNotMatch(rail, /aria-current/);

  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-core-milestones.ts",
  );
  assert.match(hook, /preserveItems/);
  assert.match(hook, /initialLoading/);
  assert.match(hook, /refreshing/);

  const presentation = read(
    "src/features/official-consultant-control-panel/presentation/core-milestone-axis-presentation.ts",
  );
  assert.match(presentation, /validatedSelectedMilestone/);
  assert.match(presentation, /resolveEffectiveMilestoneCode/);

  const matrix = read(
    "src/features/official-consultant-control-panel/components/XyInteractionMatrix.tsx",
  );
  assert.match(matrix, /data-selected-column/);
  assert.match(matrix, /data-selected-cell/);
  assert.match(matrix, /xyMatrixColSelected/);

  const e2e = read(
    "tests/e2e/official-consultant-control-panel-rector-points-8-9.spec.ts",
  );
  assert.match(e2e, /Detalle del hito \$\{code\}/);
  assert.match(e2e, /expectMilestoneDetailSynced/);
  assert.doesNotMatch(
    e2e,
    /getByText\("Detalle del hito"\)\.or\(page\.getByText\("H2 ?"\)\)/,
  );
});
