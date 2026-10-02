import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

import { deriveOfficialPanelScreenState } from "../../../src/services/eve/official-control-panel/official-control-panel-contract-normalize.ts";
import { resolveAggregationStatusLabels } from "../../../src/features/official-consultant-control-panel/presentation/aggregation-status-labels.ts";
import {
  buildPanelAggregationSources,
  mapScreenStateToAggregationDataStatus,
  resolvePanelAggregationCompleteness,
  PANEL_AGGREGATION_SOURCE_KEYS,
} from "../../../src/features/official-consultant-control-panel/presentation/aggregation-sources.ts";

const require = createRequire(import.meta.url);

async function loadMutationSafety() {
  const url = pathToFileURL(
    resolve(
      "src/features/official-consultant-control-panel/state/official-panel-mutation-safety.ts",
    ),
  ).href;
  return import(url);
}

test("R3: sin snapshot + loading → loading", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: false,
      requestInFlight: true,
      primaryDataStatus: "unavailable",
    }),
    "loading",
  );
});

test("R3: snapshot + petición → refreshing", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: true,
      primaryDataStatus: "available",
    }),
    "refreshing",
  );
});

test("R3: primary available → ready", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: false,
      primaryDataStatus: "available",
    }),
    "ready",
  );
});

test("R3: secondary failure → partial", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: false,
      primaryDataStatus: "available",
      secondaryFailure: true,
    }),
    "partial",
  );
});

test("R3: refresh fallido con snapshot → stale (no ready)", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: false,
      primaryDataStatus: "available",
      refreshFailedWithSnapshot: true,
    }),
    "stale",
  );
});

test("R3: freshness stale → stale (prioridad sobre refreshing)", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: true,
      primaryDataStatus: "available",
      versionStale: true,
    }),
    "stale",
  );
});

test("R3: 403 → forbidden", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: false,
      requestInFlight: false,
      httpStatus: 403,
      primaryDataStatus: "error",
    }),
    "forbidden",
  );
});

test("R3: 404 autorizado → not_found", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: false,
      requestInFlight: false,
      httpStatus: 404,
      primaryDataStatus: "unavailable",
    }),
    "not_found",
  );
});

test("R3: primary error → fatal", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: false,
      requestInFlight: false,
      primaryDataStatus: "error",
    }),
    "fatal",
  );
});

test("R3: empty wire availability stays ready via available primary", () => {
  assert.equal(
    deriveOfficialPanelScreenState({
      hasValidSnapshot: true,
      requestInFlight: false,
      primaryDataStatus: "available",
    }),
    "ready",
  );
});

test("R3: mutationSafety productivo — stale → blocked", async () => {
  const { resolveMutationSafety, STALE_MUTATION_BLOCK_MESSAGE } =
    await loadMutationSafety();
  const safety = resolveMutationSafety("stale");
  assert.equal(safety.mutationsBlocked, true);
  assert.equal(safety.blockReason, STALE_MUTATION_BLOCK_MESSAGE);
});

test("R3: mutationSafety productivo — ready → allowed", async () => {
  const { resolveMutationSafety } = await loadMutationSafety();
  assert.equal(resolveMutationSafety("ready").mutationsBlocked, false);
});

test("R3: refreshing no bloquea mutaciones por vigencia", async () => {
  const { resolveMutationSafety } = await loadMutationSafety();
  assert.equal(resolveMutationSafety("refreshing").mutationsBlocked, false);
});

test("R3: partialBlocksMutations → bloquea solo cuando se pide", async () => {
  const { resolveMutationSafety } = await loadMutationSafety();
  assert.equal(resolveMutationSafety("partial").mutationsBlocked, false);
  assert.equal(
    resolveMutationSafety("partial", { partialBlocksMutations: true })
      .mutationsBlocked,
    true,
  );
});

test("R3 KPI: superficies completas muestran labels factuales", () => {
  const labels = resolveAggregationStatusLabels({
    companyStateComplete: true,
    nextStepComplete: true,
    statusLabel: "En curso",
    nextStepLabel: "Siguiente evento",
  });
  assert.equal(labels.statusLabel, "En curso");
  assert.equal(labels.nextStepLabel, "Siguiente evento");
  assert.equal(labels.statusEmpty, false);
  assert.equal(labels.nextStepEmpty, false);
});

test("R3 KPI: atención incompleta no oculta Estado/Próximo completos", () => {
  const labels = resolveAggregationStatusLabels({
    companyStateComplete: true,
    nextStepComplete: true,
    statusLabel: "En curso",
    nextStepLabel: "Hito siguiente",
  });
  assert.equal(labels.statusLabel, "En curso");
  assert.equal(labels.nextStepLabel, "Hito siguiente");

  const sources = buildPanelAggregationSources({
    experience: "ready",
    coreMilestones: "ready",
    manualWork: "partial",
    parallelProduction: "ready",
  });
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.equal(completeness.companyStateComplete, true);
  assert.equal(completeness.nextStepComplete, true);
  assert.equal(completeness.attentionComplete, false);
});

test("R3 KPI: Estado incomplete y Próximo completo se separan", () => {
  const labels = resolveAggregationStatusLabels({
    companyStateComplete: false,
    nextStepComplete: true,
    statusLabel: "En curso",
    nextStepLabel: "Evento factual",
  });
  assert.equal(labels.statusLabel, "No disponible");
  assert.equal(labels.nextStepLabel, "Evento factual");
  assert.equal(labels.statusEmpty, true);
  assert.equal(labels.nextStepEmpty, false);
});

test("R3 KPI: Próximo incomplete y Estado completo se separan", () => {
  const labels = resolveAggregationStatusLabels({
    companyStateComplete: true,
    nextStepComplete: false,
    statusLabel: "Bloqueado",
    nextStepLabel: "Evento factual",
  });
  assert.equal(labels.statusLabel, "Bloqueado");
  assert.equal(labels.nextStepLabel, "No disponible");
});

test("R3 aggregation: enumera fuentes contribuyentes reales", () => {
  const sources = buildPanelAggregationSources({
    experience: "ready",
    coreMilestones: "ready",
    manualWork: "ready",
    parallelProduction: "ready",
  });
  assert.deepEqual(
    sources.map((s) => s.key),
    [...PANEL_AGGREGATION_SOURCE_KEYS],
  );
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.deepEqual(completeness, {
    companyStateComplete: true,
    nextStepComplete: true,
    attentionComplete: true,
  });
});

test("R3 aggregation: partial nunca cuenta como available", () => {
  assert.equal(mapScreenStateToAggregationDataStatus("partial"), "partial");
  assert.equal(mapScreenStateToAggregationDataStatus("ready"), "available");
  assert.equal(mapScreenStateToAggregationDataStatus("refreshing"), "available");
  assert.equal(mapScreenStateToAggregationDataStatus("stale"), "stale");
  assert.equal(mapScreenStateToAggregationDataStatus("loading"), "unavailable");
  assert.equal(mapScreenStateToAggregationDataStatus("fatal"), "error");

  const sources = buildPanelAggregationSources({
    experience: "partial",
    coreMilestones: "ready",
    manualWork: "ready",
    parallelProduction: "ready",
  });
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.equal(completeness.companyStateComplete, false);
  assert.equal(completeness.nextStepComplete, true);
  assert.equal(completeness.attentionComplete, false);
});

test("R3 aggregation: fuente Estado partial → Estado incomplete; Próximo conserva", () => {
  const sources = buildPanelAggregationSources({
    experience: "partial",
    coreMilestones: "ready",
    manualWork: "ready",
    parallelProduction: "ready",
  });
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.equal(completeness.companyStateComplete, false);
  assert.equal(completeness.nextStepComplete, true);
});

test("R3 aggregation: fuente Próximo error → Próximo incomplete; Estado conserva", () => {
  const sources = buildPanelAggregationSources({
    experience: "ready",
    coreMilestones: "fatal",
    manualWork: "ready",
    parallelProduction: "ready",
  });
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.equal(completeness.companyStateComplete, true);
  assert.equal(completeness.nextStepComplete, false);
  assert.equal(completeness.attentionComplete, true);
});

test("R3 aggregation: fuente requerida no cargada (loading) → complete=false", () => {
  const sources = buildPanelAggregationSources({
    experience: "loading",
    coreMilestones: "ready",
    manualWork: "loading",
    parallelProduction: "loading",
  });
  const completeness = resolvePanelAggregationCompleteness(sources);
  assert.equal(completeness.companyStateComplete, false);
  assert.equal(completeness.nextStepComplete, true);
  assert.equal(completeness.attentionComplete, false);
});

test("R3 aggregation: matriz de dependencias no usa selectedView", () => {
  const src = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/presentation/aggregation-sources.ts",
    ),
    "utf8",
  );
  assert.doesNotMatch(src, /manualWorkActive|parallelProductionActive|selectedView|currentTab/);
  assert.match(src, /resolvePanelAggregationCompleteness/);
  assert.doesNotMatch(src, /resolvePanelAggregationComplete(?!ness)/);
});

test("R3 aggregation: cambiar estados de datos cambia completitud; no hay flags de vista", () => {
  const a = resolvePanelAggregationCompleteness(
    buildPanelAggregationSources({
      experience: "ready",
      coreMilestones: "ready",
      manualWork: "ready",
      parallelProduction: "ready",
    }),
  );
  const b = resolvePanelAggregationCompleteness(
    buildPanelAggregationSources({
      experience: "ready",
      coreMilestones: "ready",
      manualWork: "ready",
      parallelProduction: "ready",
    }),
  );
  assert.deepEqual(a, b);

  const afterData = resolvePanelAggregationCompleteness(
    buildPanelAggregationSources({
      experience: "ready",
      coreMilestones: "ready",
      manualWork: "stale",
      parallelProduction: "ready",
    }),
  );
  assert.equal(afterData.attentionComplete, false);
  assert.equal(afterData.companyStateComplete, true);
  assert.equal(afterData.nextStepComplete, true);
});

for (const broken of [
  "experience",
  "core_milestones",
  "manual_work",
  "parallel_production",
]) {
  test(`R3 aggregation: fuente ${broken} incompleta afecta su superficie`, () => {
    const input = {
      experience: "ready",
      coreMilestones: "ready",
      manualWork: "ready",
      parallelProduction: "ready",
    };
    if (broken === "experience") input.experience = "fatal";
    if (broken === "core_milestones") input.coreMilestones = "loading";
    if (broken === "manual_work") input.manualWork = "stale";
    if (broken === "parallel_production") input.parallelProduction = "partial";
    const completeness = resolvePanelAggregationCompleteness(
      buildPanelAggregationSources(input),
    );
    if (broken === "experience") {
      assert.equal(completeness.companyStateComplete, false);
      assert.equal(completeness.attentionComplete, false);
      assert.equal(completeness.nextStepComplete, true);
    }
    if (broken === "core_milestones") {
      assert.equal(completeness.nextStepComplete, false);
      assert.equal(completeness.companyStateComplete, true);
    }
    if (broken === "manual_work" || broken === "parallel_production") {
      assert.equal(completeness.attentionComplete, false);
      assert.equal(completeness.companyStateComplete, true);
      assert.equal(completeness.nextStepComplete, true);
    }
  });
}

test("R3 shell/KPI/drawer consumen PanelAggregationCompleteness", () => {
  const kpiSrc = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/presentation/client-company-kpi-items.ts",
    ),
    "utf8",
  );
  assert.match(kpiSrc, /PanelAggregationCompleteness/);
  assert.match(kpiSrc, /completeness\.attentionComplete/);
  assert.match(kpiSrc, /companyStateComplete/);
  assert.match(kpiSrc, /nextStepComplete/);

  const shellSrc = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
    ),
    "utf8",
  );
  assert.match(shellSrc, /resolvePanelAggregationCompleteness/);
  assert.match(shellSrc, /presentCompanyStateProjectionWithCompleteness/);
  assert.match(shellSrc, /aggregationCompleteness=\{aggregationCompleteness\}/);
  assert.match(shellSrc, /attentionComplete=\{aggregationCompleteness\.attentionComplete\}/);
  assert.doesNotMatch(shellSrc, /resolvePanelAggregationComplete(?!ness)/);
  assert.doesNotMatch(shellSrc, /manualWorkActive/);

  const drawerSrc = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx",
    ),
    "utf8",
  );
  assert.match(drawerSrc, /attentionComplete/);
  assert.match(drawerSrc, /resolveAttentionSectionDisplay/);
  assert.match(drawerSrc, /shouldShowAttentionPartialNotice/);
  // Drawer must not recalculate completeness from sourceStates/view/tabs.
  assert.doesNotMatch(drawerSrc, /sourceEvaluated\s*\(/);
  assert.doesNotMatch(drawerSrc, /anySourceUnevaluable/);
  assert.doesNotMatch(drawerSrc, /selectedView|currentTab|manualWorkActive/);

  const projectionSrc = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/presentation/company-state-projection.ts",
    ),
    "utf8",
  );
  assert.match(projectionSrc, /PanelAggregationCompleteness/);
});

test("R3 proyección: attention incomplete conserva Estado/Próximo factuales", () => {
  const completeness = {
    companyStateComplete: true,
    nextStepComplete: true,
    attentionComplete: false,
  };
  const labels = resolveAggregationStatusLabels({
    companyStateComplete: completeness.companyStateComplete,
    nextStepComplete: completeness.nextStepComplete,
    statusLabel: "En curso",
    nextStepLabel: "Hito siguiente",
  });
  assert.equal(labels.statusLabel, "En curso");
  assert.equal(labels.nextStepLabel, "Hito siguiente");
  assert.equal(completeness.attentionComplete, false);
});

test("R3 drawer display: attentionComplete=false → dash / partial; no Sin alertas", async () => {
  const display = await import(
    pathToFileURL(
      resolve(
        "src/features/official-consultant-control-panel/presentation/attention-section-display.ts",
      ),
    ).href
  );
  assert.equal(
    display.resolveAttentionSectionDisplay({
      attentionComplete: false,
      sourceScreenState: "ready",
      itemCount: 0,
    }),
    "dash",
  );
  assert.equal(
    display.resolveAttentionSectionDisplay({
      attentionComplete: false,
      sourceScreenState: "fatal",
      itemCount: 0,
    }),
    "unavailable",
  );
  assert.equal(
    display.resolveAttentionSectionDisplay({
      attentionComplete: false,
      sourceScreenState: "ready",
      itemCount: 2,
    }),
    "items",
  );
  assert.equal(display.shouldShowAttentionPartialNotice(false), true);
  assert.equal(display.shouldShowAttentionPartialNotice(true), false);
});

test("R3 drawer display: attentionComplete=true + vacío → none (Sin alertas/Ninguno)", async () => {
  const display = await import(
    pathToFileURL(
      resolve(
        "src/features/official-consultant-control-panel/presentation/attention-section-display.ts",
      ),
    ).href
  );
  assert.equal(
    display.resolveAttentionSectionDisplay({
      attentionComplete: true,
      sourceScreenState: "ready",
      itemCount: 0,
    }),
    "none",
  );
});

test("R3 drawer: fallo exclusivo Atención no cambia company/next", () => {
  const completeness = resolvePanelAggregationCompleteness(
    buildPanelAggregationSources({
      experience: "ready",
      coreMilestones: "ready",
      manualWork: "fatal",
      parallelProduction: "ready",
    }),
  );
  assert.equal(completeness.companyStateComplete, true);
  assert.equal(completeness.nextStepComplete, true);
  assert.equal(completeness.attentionComplete, false);
});

test("R3 hooks de atención no gatean carga por subvista", () => {
  const manual = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/hooks/use-case-manual-work.ts",
    ),
    "utf8",
  );
  const parallel = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/hooks/use-case-parallel-production.ts",
    ),
    "utf8",
  );
  assert.doesNotMatch(manual, /view === "tracking"/);
  assert.doesNotMatch(parallel, /view === "monitoring"/);
});

// silence unused
void require;
