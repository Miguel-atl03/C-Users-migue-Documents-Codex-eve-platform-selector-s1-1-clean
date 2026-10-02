"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { SupportProcessAxisItem } from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import {
  buildSupportProcessAxisItems,
  type SupportProcessCode,
} from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import {
  ContextAuthError,
  ContextRequestError,
  getCaseSupportProcesses,
} from "../data/client-context-api";
import {
  classifySupportProcessAxisStatus,
  presentSupportProcessAxisViewModel,
} from "../presentation/support-process-axis-presentation";
import {
  buildSupportProcessNavigation,
  clearSupportProcessNavigation,
  parseSupportProcessSelection,
  supportProcessNeedsClear,
} from "../state/support-process-navigation";
import type { ClientContextViewModel } from "../types/client-context.types";
import { SUPPORT_PROCESS_AXIS_ERROR_MESSAGE } from "../types/support-process-axis.types";
import { deriveOfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract-normalize";
import {
  buildRefreshFailure,
  isAuthOrAbsenceStatus,
  type ResourceRefreshFailure,
} from "../state/resource-snapshot-state";

export type AuthorizedCaseContext = {
  status: "active";
  companyId: string;
  relationshipId: string;
  caseId: string;
};

type UseCaseSupportProcessesInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  authReadiness?: ClientContextViewModel["authReadiness"];
};

function resolveAuthorizedCaseContext(
  context: ClientContextViewModel,
  authReadiness: ClientContextViewModel["authReadiness"],
): AuthorizedCaseContext | null {
  if (authReadiness !== "authenticated") return null;
  if (context.status !== "active") return null;
  const { companyId, relationshipId, caseId } = context.selection;
  if (!companyId || !relationshipId || !caseId) return null;
  return {
    status: "active",
    companyId,
    relationshipId,
    caseId,
  };
}

/**
 * Eje X loads only with authorized context (auth + active company/relationship/case).
 * Soft-refresh conserves visible processes; failures map to canonical screenState.
 */
export function useCaseSupportProcesses({
  context,
  accessToken,
  authReadiness,
}: UseCaseSupportProcessesInput) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const readiness = authReadiness ?? context.authReadiness;
  const authorized = resolveAuthorizedCaseContext(context, readiness);
  const authorizedCaseId = authorized?.caseId ?? null;
  const authorizedCompanyId = authorized?.companyId ?? null;
  const authorizedRelationshipId = authorized?.relationshipId ?? null;
  const hasAuthorizedContext = Boolean(authorized);

  const selectedCode = useMemo(
    () => parseSupportProcessSelection(searchParams),
    [searchParams],
  );

  const catalogFallback = useMemo(() => buildSupportProcessAxisItems(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [httpStatus, setHttpStatus] = useState<number | undefined>();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [items, setItems] = useState<SupportProcessAxisItem[]>([]);
  const [operationalDataBlocked, setOperationalDataBlocked] = useState(true);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [refreshFailure, setRefreshFailure] =
    useState<ResourceRefreshFailure | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const requestIdRef = useRef(0);
  const itemsLoadedRef = useRef(false);
  const loadedCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasAuthorizedContext) return;
    if (!supportProcessNeedsClear(searchParams)) return;
    const next = clearSupportProcessNavigation(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [hasAuthorizedContext, pathname, router, searchParams]);

  useEffect(() => {
    if (!hasAuthorizedContext || !accessToken || !authorizedCaseId) {
      requestIdRef.current += 1;
      itemsLoadedRef.current = false;
      loadedCaseIdRef.current = null;
      setLoading(false);
      setError(false);
      setHttpStatus(undefined);
      setRequestId(null);
      setItems([]);
      setItemsLoaded(false);
      setOperationalDataBlocked(true);
      setRefreshFailure(null);
      return;
    }

    const caseId = authorizedCaseId;
    const requestIdLocal = requestIdRef.current + 1;
    requestIdRef.current = requestIdLocal;
    const controller = new AbortController();
    const sameCase = loadedCaseIdRef.current === caseId;
    const soft = sameCase && itemsLoadedRef.current;

    setLoading(true);
    setError(false);
    setHttpStatus(undefined);
    if (!soft) {
      setItems([]);
      setItemsLoaded(false);
      setOperationalDataBlocked(true);
      setRefreshFailure(null);
    } else {
      setRefreshFailure(null);
    }

    void (async () => {
      try {
        const response = await getCaseSupportProcesses(
          accessToken,
          caseId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestIdLocal) return;
        setItems(response.items);
        setOperationalDataBlocked(response.operationalDataBlocked);
        setItemsLoaded(true);
        itemsLoadedRef.current = true;
        loadedCaseIdRef.current = caseId;
        setLoading(false);
        setError(false);
        setHttpStatus(undefined);
        setRequestId(null);
        setRefreshFailure(null);
      } catch (errorValue) {
        if (
          errorValue instanceof DOMException &&
          errorValue.name === "AbortError"
        ) {
          return;
        }
        if (controller.signal.aborted) return;
        if (requestIdRef.current !== requestIdLocal) return;

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

        if (soft && itemsLoadedRef.current) {
          if (isAuthOrAbsenceStatus(status)) {
            itemsLoadedRef.current = false;
            setItems([]);
            setItemsLoaded(false);
            setLoading(false);
            setError(true);
            setHttpStatus(status);
            setRequestId(rid);
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
          setRequestId(rid);
          return;
        }

        // Hard failure: keep catalog fallback visible as partial operational block,
        // but expose canonical fatal/forbidden/not_found via screenState.
        setItems(catalogFallback.items);
        setOperationalDataBlocked(true);
        setItemsLoaded(true);
        itemsLoadedRef.current = true;
        loadedCaseIdRef.current = caseId;
        setLoading(false);
        setError(true);
        setHttpStatus(status);
        setRequestId(rid);
        setRefreshFailure(null);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    authorizedCaseId,
    authorizedCompanyId,
    authorizedRelationshipId,
    catalogFallback,
    hasAuthorizedContext,
    retryVersion,
  ]);

  const refreshing = loading && itemsLoaded;
  const initialLoading = loading && !itemsLoaded;

  const status = classifySupportProcessAxisStatus({
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
    // Catalog/axis loaded successfully → ready. operationalDataBlocked is
    // field-level, not axis-level partial (keeps secondary failures isolated).
    primaryDataStatus: error && !itemsLoaded
      ? "error"
      : !itemsLoaded
        ? "unavailable"
        : "available",
    versionStale: false,
  });

  const viewModel = presentSupportProcessAxisViewModel({
    status,
    items: status === "idle" || (status === "loading" && !refreshing) ? [] : items,
    selectedCode,
    operationalDataBlocked,
    errorMessage: error ? SUPPORT_PROCESS_AXIS_ERROR_MESSAGE : null,
  });

  const selectProcess = useCallback(
    (processCode: SupportProcessCode) => {
      if (!hasAuthorizedContext) return;
      const current = new URLSearchParams(queryString);
      const currentSelected = parseSupportProcessSelection(current);
      const next =
        currentSelected === processCode
          ? clearSupportProcessNavigation(current)
          : buildSupportProcessNavigation(current, processCode);
      next.delete("manual_work_item");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [hasAuthorizedContext, pathname, queryString, router],
  );

  const retry = useCallback(() => {
    setRetryVersion((value) => value + 1);
  }, []);

  return {
    supportProcessAxis: viewModel,
    screenState,
    requestId,
    refreshing,
    refreshFailure,
    selectProcess,
    retry,
    authorizedCaseId,
  };
}
