/**
 * §12 / §17 — factual missing canonical route (B2/B3) projection for Panel control.
 * Does not invent readiness_state values; snapshot stays blocked|ready|….
 * Literal blocked_by_missing_canonical_route comes from catalog + gap/decision rows.
 */

import { getRuntimeCausalCatalogEntry } from "./catalogs/runtime-causal-matrix.catalog";
import type {
  RuntimeControlStateView,
  RuntimeGapSummary,
  RuntimeReentrySummary,
  RuntimeManualReviewSummary,
  MissingCanonicalRouteBlockView,
  RuntimeReadinessState,
} from "./official-control-panel-runtime-control.types";

export type {
  MissingCanonicalRouteBlockView,
} from "./official-control-panel-runtime-control.types";

export const BLOCKED_BY_MISSING_CANONICAL_ROUTE =
  "blocked_by_missing_canonical_route" as const;

export const TRANSFORMATION_EXCEPTION_EXISTS =
  "transformation_exception_exists" as const;

export const TRANSFORMATION_EXCEPTION_ROUTE_UNRESOLVED =
  "transformation_exception_route_unresolved" as const;

export const RECEIVER_FEEDBACK_ROUTE_MISSING =
  "receiver_feedback_route_missing" as const;

/** Catalog-backed flag mapping for P0 critical routes (no free-text detection). */
const CAUSAL_ROUTE_FLAG_MAP: Record<
  string,
  {
    blockCode: typeof BLOCKED_BY_MISSING_CANONICAL_ROUTE;
    relatedFlags: string[];
    defaultReentryTarget: string;
  }
> = {
  C05: {
    blockCode: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
    relatedFlags: [
      TRANSFORMATION_EXCEPTION_EXISTS,
      TRANSFORMATION_EXCEPTION_ROUTE_UNRESOLVED,
    ],
    defaultReentryTarget: "B2",
  },
  C09: {
    blockCode: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
    relatedFlags: [RECEIVER_FEEDBACK_ROUTE_MISSING],
    defaultReentryTarget: "B3",
  },
};

export function catalogContainsMissingCanonicalRoute(
  failureBlockRule: string | null | undefined,
): boolean {
  if (!failureBlockRule) return false;
  return failureBlockRule
    .split(/\s*\/\s*|\s*,\s*/)
    .map((p) => p.trim())
    .includes(BLOCKED_BY_MISSING_CANONICAL_ROUTE);
}

export function projectMissingCanonicalRouteBlocks(input: {
  runId: string | null;
  activityId?: string | null;
  readinessState: RuntimeReadinessState;
  blockingCausalIds: string[];
  gaps: RuntimeGapSummary[];
  reentries: RuntimeReentrySummary[];
  manualReviews: RuntimeManualReviewSummary[];
}): MissingCanonicalRouteBlockView[] {
  const blocks: MissingCanonicalRouteBlockView[] = [];
  const seen = new Set<string>();

  for (const gap of input.gaps) {
    if (gap.gapCode !== BLOCKED_BY_MISSING_CANONICAL_ROUTE) continue;
    if (gap.operationalStatus !== "active") continue;
    const key = `gap:${gap.gapId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const reentry =
      input.reentries.find((r) => r.id === gap.gapId) ??
      input.reentries.find(
        (r) =>
          r.sourceInteractionId === gap.sourceInteractionId ||
          r.targetBlock != null,
      ) ??
      null;
    const review =
      input.manualReviews.find((r) => r.id === gap.gapId) ?? null;

    const causalFromRoute =
      typeof gap.sourceInteractionId === "string" &&
      /^C\d{2}$/i.test(gap.sourceInteractionId)
        ? gap.sourceInteractionId.toUpperCase()
        : null;
    const map = causalFromRoute
      ? CAUSAL_ROUTE_FLAG_MAP[causalFromRoute]
      : null;

    blocks.push({
      causalCode: causalFromRoute,
      activityId: input.activityId ?? null,
      runId: input.runId,
      blockCode: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
      relatedFlags: map?.relatedFlags ?? [],
      factualReason: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
      readinessState: input.readinessState,
      readinessBlocked: input.readinessState === "blocked",
      reentryTarget:
        reentry?.targetBlock ?? map?.defaultReentryTarget ?? null,
      reviewDestination: review?.reviewReason ?? reentry?.targetBlock ?? null,
      gapId: gap.gapId,
      failureBlockRule: causalFromRoute
        ? (getRuntimeCausalCatalogEntry(causalFromRoute)?.failureBlockRule ??
          null)
        : null,
    });
  }

  for (const causalCode of input.blockingCausalIds) {
    const map = CAUSAL_ROUTE_FLAG_MAP[causalCode];
    if (!map) continue;
    const entry = getRuntimeCausalCatalogEntry(causalCode);
    if (!catalogContainsMissingCanonicalRoute(entry?.failureBlockRule)) {
      continue;
    }
    const key = `causal:${causalCode}`;
    if (seen.has(key)) continue;
    // Prefer gap-sourced block when already present for same causal.
    if (
      blocks.some(
        (b) =>
          b.causalCode === causalCode ||
          b.gapId != null &&
            input.gaps.some(
              (g) =>
                g.gapId === b.gapId &&
                g.sourceInteractionId === causalCode,
            ),
      )
    ) {
      continue;
    }
    seen.add(key);

    const reentry =
      input.reentries.find(
        (r) =>
          r.sourceInteractionId === causalCode ||
          r.targetBlock === map.defaultReentryTarget,
      ) ?? null;
    const review =
      input.manualReviews.find(
        (r) => r.sourceInteractionId === causalCode,
      ) ?? null;

    blocks.push({
      causalCode,
      activityId: input.activityId ?? null,
      runId: input.runId,
      blockCode: BLOCKED_BY_MISSING_CANONICAL_ROUTE,
      relatedFlags: map.relatedFlags,
      factualReason: entry?.failureBlockRule ?? map.blockCode,
      readinessState: input.readinessState,
      readinessBlocked: input.readinessState === "blocked",
      reentryTarget: reentry?.targetBlock ?? map.defaultReentryTarget,
      reviewDestination: review?.reviewReason ?? reentry?.targetBlock ?? map.defaultReentryTarget,
      gapId: null,
      failureBlockRule: entry?.failureBlockRule ?? null,
    });
  }

  return blocks;
}

export function collectCanonicalBlockCodes(
  blocks: MissingCanonicalRouteBlockView[],
): string[] {
  const codes = new Set<string>();
  for (const block of blocks) {
    codes.add(block.blockCode);
    for (const flag of block.relatedFlags) codes.add(flag);
  }
  return [...codes];
}

export function attachMissingCanonicalRouteProjection(
  view: RuntimeControlStateView,
  input: {
    runId: string | null;
    activityId?: string | null;
  },
): RuntimeControlStateView {
  const missingCanonicalRouteBlocks = projectMissingCanonicalRouteBlocks({
    runId: input.runId,
    activityId: input.activityId ?? null,
    readinessState: view.readiness.state,
    blockingCausalIds: view.blockingCausalIds,
    gaps: view.gaps,
    reentries: view.reentries,
    manualReviews: view.manualReviews,
  });
  return {
    ...view,
    missingCanonicalRouteBlocks,
    canonicalBlockCodes: collectCanonicalBlockCodes(missingCanonicalRouteBlocks),
  };
}
