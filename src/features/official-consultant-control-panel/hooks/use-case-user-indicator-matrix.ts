"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getCaseUserIndicatorMatrix } from "../data/client-context-api";
import type { ClientContextViewModel } from "../types/client-context.types";
import type { CaseUserIndicatorMatrix } from "@/services/eve/official-control-panel/official-control-panel-user-indicator-matrix.types";

type UseCaseUserIndicatorMatrixInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
};

export function useCaseUserIndicatorMatrix({
  context,
  accessToken,
}: UseCaseUserIndicatorMatrixInput) {
  const caseId =
    context.status === "active" ? context.selection.caseId : null;
  const [data, setData] = useState<CaseUserIndicatorMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const dataRef = useRef<CaseUserIndicatorMatrix | null>(null);

  useEffect(() => {
    if (!caseId || !accessToken) {
      const id = window.setTimeout(() => {
        setData(null);
        setLoading(false);
        setRefreshing(false);
        setError(false);
        dataRef.current = null;
      }, 0);
      return () => window.clearTimeout(id);
    }

    const controller = new AbortController();
    const isInitial = dataRef.current == null;
    void (async () => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(false);
      try {
        const next = await getCaseUserIndicatorMatrix(
          accessToken,
          caseId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        dataRef.current = next;
        setData(next);
        setLoading(false);
        setRefreshing(false);
      } catch {
        if (controller.signal.aborted) return;
        setLoading(false);
        setRefreshing(false);
        setError(true);
      }
    })();

    return () => controller.abort();
  }, [accessToken, caseId, retryVersion]);

  useEffect(() => {
    if (!caseId || !accessToken) return;
    const id = window.setInterval(() => {
      setRetryVersion((version) => version + 1);
    }, 15000);
    return () => window.clearInterval(id);
  }, [accessToken, caseId]);

  const retry = useCallback(() => {
    setRetryVersion((version) => version + 1);
  }, []);

  return {
    data,
    loading,
    refreshing,
    error,
    retry,
  };
}
