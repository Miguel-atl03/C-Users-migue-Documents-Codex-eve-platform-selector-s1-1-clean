import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-r4-fx05-fx06-path-hook.mjs");
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
  buildActivitySelectionAttentionView,
  projectWorkmapCoverageGapAttentionItem,
  projectWorkmapCoverageGapAlertsFromAttention,
  WORKMAP_COVERAGE_GAP_FACTUAL_REASON,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-activity-selection-attention.ts",
    ),
  ).href
);

const {
  projectMissingCanonicalRouteBlocks,
  collectCanonicalBlockCodes,
  BLOCKED_BY_MISSING_CANONICAL_ROUTE,
  TRANSFORMATION_EXCEPTION_EXISTS,
  TRANSFORMATION_EXCEPTION_ROUTE_UNRESOLVED,
  attachMissingCanonicalRouteProjection,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-missing-canonical-route.ts",
    ),
  ).href
);

const { buildUnavailableRuntimeControlState } = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-runtime-control-service.ts",
    ),
  ).href
);

test("FX-05: workmapCoverageGap=true projects unresolved attention item", () => {
  const item = projectWorkmapCoverageGapAttentionItem({
    id: "sel-1",
    caseId: "case-1",
    participantId: "part-1",
    profileId: "prof-1",
    roleRuntimeSessionId: "sess-1",
    policyCode: "PRIMARY_ACTIVITY_SELECTION",
    policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
    sourceSnapshotReference: "snap",
    sourceSnapshotHash: "hash",
    resultVersion: 1,
    lifecycleState: "effective",
    selectionMode: "non_competitive_inclusion",
    eligibleCount: 1,
    selectedCount: 1,
    nonPrimaryContextCount: 0,
    workmapCoverageGap: true,
    promotionConditionCode: null,
    computedAt: "2026-07-22T00:00:00.000Z",
    effectiveFrom: "2026-07-22T00:00:00.000Z",
  });
  assert.ok(item);
  assert.equal(item.alertType, "workmap_coverage_gap");
  assert.equal(item.unresolved, true);
  assert.equal(item.factualReason, WORKMAP_COVERAGE_GAP_FACTUAL_REASON);
  assert.equal(item.readinessEffect, "conditioned");
  assert.equal(item.reentryCapability, "request_reentry");
  assert.equal(item.roleRuntimeSessionId, "sess-1");
  assert.equal(item.participantId, "part-1");
});

test("FX-05: workmapCoverageGap=false or null → factual absence (no item)", () => {
  assert.equal(
    projectWorkmapCoverageGapAttentionItem({
      id: "sel-2",
      caseId: "case-1",
      participantId: "part-1",
      profileId: "prof-1",
      roleRuntimeSessionId: "sess-1",
      policyCode: "PRIMARY_ACTIVITY_SELECTION",
      policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
      sourceSnapshotReference: "snap",
      sourceSnapshotHash: "hash",
      resultVersion: 1,
      lifecycleState: "effective",
      selectionMode: "non_competitive_inclusion",
      eligibleCount: 1,
      selectedCount: 1,
      nonPrimaryContextCount: 0,
      workmapCoverageGap: false,
      promotionConditionCode: null,
      computedAt: "2026-07-22T00:00:00.000Z",
      effectiveFrom: "2026-07-22T00:00:00.000Z",
    }),
    null,
  );
  assert.equal(
    projectWorkmapCoverageGapAttentionItem({
      id: "sel-3",
      caseId: "case-1",
      participantId: "part-1",
      profileId: "prof-1",
      roleRuntimeSessionId: "sess-1",
      policyCode: "PRIMARY_ACTIVITY_SELECTION",
      policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
      sourceSnapshotReference: "snap",
      sourceSnapshotHash: "hash",
      resultVersion: 1,
      lifecycleState: "effective",
      selectionMode: "non_competitive_inclusion",
      eligibleCount: 1,
      selectedCount: 1,
      nonPrimaryContextCount: 0,
      workmapCoverageGap: null,
      promotionConditionCode: null,
      computedAt: "2026-07-22T00:00:00.000Z",
      effectiveFrom: "2026-07-22T00:00:00.000Z",
    }),
    null,
  );
});

test("FX-05: attention view empty when no gap rows", async () => {
  const view = await buildActivitySelectionAttentionView(
    {
      async listEffectiveByCase() {
        return [
          {
            id: "sel-ok",
            caseId: "case-1",
            participantId: "part-1",
            profileId: "prof-1",
            roleRuntimeSessionId: "sess-1",
            policyCode: "PRIMARY_ACTIVITY_SELECTION",
            policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
            sourceSnapshotReference: "snap",
            sourceSnapshotHash: "hash",
            resultVersion: 1,
            lifecycleState: "effective",
            selectionMode: "non_competitive_inclusion",
            eligibleCount: 1,
            selectedCount: 1,
            nonPrimaryContextCount: 0,
            workmapCoverageGap: false,
            promotionConditionCode: null,
            computedAt: "2026-07-22T00:00:00.000Z",
            effectiveFrom: "2026-07-22T00:00:00.000Z",
          },
        ];
      },
      async findEffectiveBySession() {
        return null;
      },
      async countEffectiveBySession() {
        return 0;
      },
      async listItemsByResultId() {
        return [];
      },
    },
    { caseId: "case-1" },
  );
  assert.equal(view.dataStatus, "empty");
  assert.equal(view.items.length, 0);
  assert.equal(projectWorkmapCoverageGapAlertsFromAttention(view).length, 0);
});

test("FX-05: attention view surfaces gap + company alert", async () => {
  const view = await buildActivitySelectionAttentionView(
    {
      async listEffectiveByCase() {
        return [
          {
            id: "sel-gap",
            caseId: "case-a",
            participantId: "part-a",
            profileId: "prof-a",
            roleRuntimeSessionId: "sess-a",
            policyCode: "PRIMARY_ACTIVITY_SELECTION",
            policyVersion: "PRIMARY_ACTIVITY_SELECTION_V1_3",
            sourceSnapshotReference: "snap",
            sourceSnapshotHash: "hash",
            resultVersion: 1,
            lifecycleState: "effective",
            selectionMode: "non_competitive_inclusion",
            eligibleCount: 1,
            selectedCount: 1,
            nonPrimaryContextCount: 0,
            workmapCoverageGap: true,
            promotionConditionCode: null,
            computedAt: "2026-07-22T00:00:00.000Z",
            effectiveFrom: "2026-07-22T00:00:00.000Z",
          },
        ];
      },
      async findEffectiveBySession() {
        return null;
      },
      async countEffectiveBySession() {
        return 0;
      },
      async listItemsByResultId() {
        return [];
      },
    },
    { caseId: "case-a" },
  );
  assert.equal(view.dataStatus, "available");
  assert.equal(view.items.length, 1);
  const alerts = projectWorkmapCoverageGapAlertsFromAttention(view);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].alertType, "workmap_coverage_gap");
  assert.match(alerts[0].alertId, /workmap-coverage-gap:sel-gap/);
});

test("FX-06: gap_type literal projects blocked_by_missing_canonical_route", () => {
  const blocks = projectMissingCanonicalRouteBlocks({
    runId: "run-1",
    activityId: "act-1",
    readinessState: "blocked",
    blockingCausalIds: ["C05"],
    gaps: [
      {
        gapId: "gap-1",
        gapCode: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
        sourceInteractionId: "C05",
        status: "open",
        operationalStatus: "active",
        severity: "blocking",
        openedAt: "2026-07-22T00:00:00.000Z",
        resolvedAt: null,
        resolutionReference: null,
      },
    ],
    reentries: [
      {
        id: "gap-1",
        sourceInteractionId: "C05",
        targetBlock: "B2",
        reason: "gap_reentry_target",
        status: "open",
        openedAt: "2026-07-22T00:00:00.000Z",
        resolvedAt: null,
      },
    ],
    manualReviews: [],
  });
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].blockCode, BLOCKED_BY_MISSING_CANONICAL_ROUTE);
  assert.equal(blocks[0].readinessBlocked, true);
  assert.equal(blocks[0].reentryTarget, "B2");
  assert.equal(blocks[0].activityId, "act-1");
  assert.ok(blocks[0].relatedFlags.includes(TRANSFORMATION_EXCEPTION_EXISTS));
  assert.ok(
    blocks[0].relatedFlags.includes(TRANSFORMATION_EXCEPTION_ROUTE_UNRESOLVED),
  );
  const codes = collectCanonicalBlockCodes(blocks);
  assert.ok(codes.includes(BLOCKED_BY_MISSING_CANONICAL_ROUTE));
  assert.ok(codes.includes(TRANSFORMATION_EXCEPTION_EXISTS));
});

test("FX-06: C05 blocking causal without gap still projects literal from catalog", () => {
  const blocks = projectMissingCanonicalRouteBlocks({
    runId: "run-2",
    activityId: "act-2",
    readinessState: "blocked",
    blockingCausalIds: ["C05"],
    gaps: [],
    reentries: [],
    manualReviews: [],
  });
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].blockCode, BLOCKED_BY_MISSING_CANONICAL_ROUTE);
  assert.equal(blocks[0].causalCode, "C05");
  assert.equal(blocks[0].reentryTarget, "B2");
  assert.match(
    blocks[0].failureBlockRule ?? "",
    /blocked_by_missing_canonical_route/,
  );
});

test("FX-06: attach projection leaves readiness as blocked (no invented state)", () => {
  const base = buildUnavailableRuntimeControlState();
  const withSignals = {
    ...base,
    readiness: {
      state: "blocked",
      restrictedScopes: [],
      sourceVersion: 1,
      message: null,
    },
    blockingCausalIds: ["C05"],
    dataStatus: "available",
  };
  const view = attachMissingCanonicalRouteProjection(withSignals, {
    runId: "run-x",
    activityId: "act-x",
  });
  assert.equal(view.readiness.state, "blocked");
  assert.ok(view.canonicalBlockCodes.includes(BLOCKED_BY_MISSING_CANONICAL_ROUTE));
  assert.equal(view.missingCanonicalRouteBlocks.length, 1);
  assert.equal(
    view.missingCanonicalRouteBlocks[0].blockCode,
    BLOCKED_BY_MISSING_CANONICAL_ROUTE,
  );
});

test("FX-06: no free-text keyword invention when C01 blocks only", () => {
  const blocks = projectMissingCanonicalRouteBlocks({
    runId: "run-3",
    activityId: "act-3",
    readinessState: "ready-with-restrictions",
    blockingCausalIds: ["C01"],
    gaps: [],
    reentries: [],
    manualReviews: [],
  });
  assert.equal(blocks.length, 0);
});
