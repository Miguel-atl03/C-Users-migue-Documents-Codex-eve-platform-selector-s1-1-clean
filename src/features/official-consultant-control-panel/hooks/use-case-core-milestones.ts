"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildCoreMilestoneAxisCatalogFallback,
} from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis-service";
import type { CoreMilestoneAxisItem } from "@/services/eve/official-control-panel/official-control-panel-core-milestone-axis.types";
import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";
import { getCaseCoreMilestones } from "../data/client-context-api";
import {
  ContextAuthError,
  ContextRequestError,
} from "../data/client-context-api";
import {
  classifyCoreMilestoneAxisStatus,
  presentCoreMilestoneAxisViewModel,
} from "../presentation/core-milestone-axis-presentation";
import {
  buildMilestoneNavigation,
  clearMilestoneSelection,
  milestoneNeedsClear,
  parseMilestoneSelection,
} from "../state/milestone-navigation";
import type { ClientContextViewModel } from "../types/client-context.types";
import { CORE_MILESTONE_AXIS_ERROR_MESSAGE } from "../types/core-milestone-axis.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import { deriveOfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  buildRefreshFailure,
  isAuthOrAbsenceStatus,
  type ResourceRefreshFailure,
} from "../state/resource-snapshot-state";

type UseCaseCoreMilestonesInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  authReadiness?: ClientContextViewModel["authReadiness"];
};

function resolveAuthorizedCaseContext(
  context: ClientContextViewModel,
  authReadiness: ClientContextViewModel["authReadiness"],
): { caseId: string; companyId: string; relationshipId: string } | null {
  if (authReadiness !== "authenticated") return null;
  if (context.status !== "active") return null;
  const { companyId, relationshipId, caseId } = context.selection;
  if (!companyId || !relationshipId || !caseId) return null;
  return { caseId, companyId, relationshipId };
}

/**
 * Eje Y H0–H6. Requires authorized context. Invalid milestone query cleared.
 * Catalog fallback on BFF failure — never invents reached.
 * Selection effective only after validated against axis.items.
 */
export function useCaseCoreMilestones({
  context,
  accessToken,
  authReadiness,
}: UseCaseCoreMilestonesInput) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const readiness = authReadiness ?? context.authReadiness;
  const authorized = resolveAuthorizedCaseContext(context, readiness);
  const hasAuthorizedContext = Boolean(authorized);
  const authorizedCaseId = authorized?.caseId ?? null;

  const urlMilestoneCode = useMemo(
    () => parseMilestoneSelection(searchParams),
    [searchParams],
  );

  const catalogFallback = useMemo(
    () => buildCoreMilestoneAxisCatalogFallback(),
    [],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<CoreMilestoneAxisItem[]>([]);
  const [progress, setProgress] = useState(catalogFallback.progress);
  const [finalAlternative, setFinalAlternative] = useState(
    catalogFallback.finalAlternative,
  );
  const [finalAlternativeReason, setFinalAlternativeReason] = useState(
    catalogFallback.finalAlternativeReason,
  );
  const [operationalDataBlocked, setOperationalDataBlocked] = useState(true);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [httpStatus, setHttpStatus] = useState<number | undefined>();
  const [requestIdOut, setRequestIdOut] = useState<string | null>(null);
  const [refreshFailure, setRefreshFailure] =
    useState<ResourceRefreshFailure | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const requestIdRef = useRef(0);
  const itemsLoadedRef = useRef(false);
  const loadedCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasAuthorizedContext) return;
    if (!milestoneNeedsClear(searchParams)) return;
    const next = clearMilestoneSelection(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [hasAuthorizedContext, pathname, router, searchParams]);

  useEffect(() => {
    if (!hasAuthorizedContext || !accessToken || !authorizedCaseId) {
      requestIdRef.current += 1;
      itemsLoadedRef.current = false;
      loadedCaseIdRef.current = null;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();

    const sameCase = loadedCaseIdRef.current === authorizedCaseId;
    const preserveItems = sameCase && itemsLoadedRef.current;

    /* BFF fetch kickoff: sync loading flags before awaiting external response. */
    /* eslint-disable react-hooks/set-state-in-effect -- intentional fetch lifecycle */
    setLoading(true);
    setError(false);
    setHttpStatus(undefined);
    if (!preserveItems) {
      setItems([]);
      setItemsLoaded(false);
      setOperationalDataBlocked(true);
      setRefreshFailure(null);
    } else {
      setRefreshFailure(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    void (async () => {
      try {
        const response = await getCaseCoreMilestones(
          accessToken,
          authorizedCaseId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestId) return;
        setItems(response.items);
        setProgress(response.progress);
        setFinalAlternative(response.finalAlternative);
        setFinalAlternativeReason(response.finalAlternativeReason);
        setOperationalDataBlocked(response.operationalDataBlocked);
        setItemsLoaded(true);
        itemsLoadedRef.current = true;
        loadedCaseIdRef.current = authorizedCaseId;
        setLoading(false);
        setError(false);
        setHttpStatus(undefined);
        setRequestIdOut(null);
        setRefreshFailure(null);
      } catch (errorValue) {
        if (
          errorValue instanceof DOMException &&
          errorValue.name === "AbortError"
        ) {
          return;
        }
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestId) return;

        const status =
          errorValue instanceof ContextAuthError ||
          errorValue instanceof ContextRequestError
            ? errorValue.status
            : undefined;
        const rid =
          errorValue instanceof ContextAuthError ||
          errorValue instanceof ContextRequestError
            ? errorValue.requestId
            : null;

        if (preserveItems) {
          if (isAuthOrAbsenceStatus(status)) {
            itemsLoadedRef.current = false;
            setItems([]);
            setItemsLoaded(false);
            setLoading(false);
            setError(true);
            setHttpStatus(status);
            setRequestIdOut(rid);
            setRefreshFailure(null);
            return;
          }
          setLoading(false);
          setError(false);
          setRefreshFailure(
            buildRefreshFailure({
              httpStatus: status,
              requestId: rid,
              retryable: true,
            }),
          );
          setRequestIdOut(rid);
          return;
        }

        // Hard fail: do not convert to empty axis — mark error + catalog fallback
        // only for layout; screenState becomes fatal/forbidden/not_found.
        setItems(catalogFallback.items);
        setProgress(catalogFallback.progress);
        setFinalAlternative(null);
        setOperationalDataBlocked(true);
        setItemsLoaded(false);
        itemsLoadedRef.current = false;
        setLoading(false);
        setError(true);
        setHttpStatus(status);
        setRequestIdOut(rid);
        setRefreshFailure(null);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    authorizedCaseId,
    catalogFallback,
    hasAuthorizedContext,
    retryVersion,
  ]);

  const initialLoading = loading && !itemsLoaded;
  const refreshing = loading && itemsLoaded;

  const status = classifyCoreMilestoneAxisStatus({
    hasAuthorizedContext,
    loading: initialLoading,
    error: error && !itemsLoaded,
    itemsLoaded,
    operationalDataBlocked,
  });

  const screenState: OfficialPanelScreenState = deriveOfficialPanelScreenState({
    hasValidSnapshot: itemsLoaded,
    requestInFlight: loading,
    refreshFailedWithSnapshot: refreshFailure != null,
    httpStatus: error ? httpStatus : undefined,
    // Axis catalog loaded → ready. Progress gaps stay in operationalDataBlocked /
    // item dataStatus, not axis-level partial.
    primaryDataStatus: error && !itemsLoaded
      ? "error"
      : !itemsLoaded
        ? "unavailable"
        : "available",
  });

  const viewModel = presentCoreMilestoneAxisViewModel({
    status,
    items: status === "idle" ? [] : items,
    selectedCode: urlMilestoneCode,
    progress,
    finalAlternative,
    finalAlternativeReason,
    operationalDataBlocked,
    refreshing,
    errorMessage: error ? CORE_MILESTONE_AXIS_ERROR_MESSAGE : null,
  });

  const selectMilestone = useCallback(
    (code: CoreMilestoneCode) => {
      if (!hasAuthorizedContext) return;
      const current = new URLSearchParams(queryString);
      const next = buildMilestoneNavigation(current, code);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [hasAuthorizedContext, pathname, queryString, router],
  );

  const retry = useCallback(() => {
    setRetryVersion((value) => value + 1);
  }, []);

  return {
    coreMilestoneAxis: viewModel,
    screenState,
    requestId: requestIdOut,
    refreshing,
    refreshFailure,
    selectMilestone,
    retry,
  };
}
