"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getCaseWorkMapProgress } from "../data/client-context-api";
import type { ClientContextViewModel } from "../types/client-context.types";
import type { WorkMapProgressView } from "@/services/eve/official-control-panel/official-control-panel-workmap-progress.types";

type UseCaseWorkMapProgressInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
  participantId?: string | null;
  userId?: string | null;
  profileId?: string | null;
};

export function useCaseWorkMapProgress({
  context,
  accessToken,
  participantId = null,
  userId = null,
  profileId = null,
}: UseCaseWorkMapProgressInput) {
  const caseId =
    context.status === "active" ? context.selection.caseId : null;
  const [data, setData] = useState<WorkMapProgressView | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const dataRef = useRef<WorkMapProgressView | null>(null);

  useEffect(() => {
    if (!caseId || !accessToken) {
      return;
    }

    const controller = new AbortController();
    const isInitial = dataRef.current?.caseId !== caseId;

    void (async () => {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      setError(false);
      try {
        const next = await getCaseWorkMapProgress(
          accessToken,
          caseId,
          participantId,
          userId,
          profileId,
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
  }, [accessToken, caseId, participantId, profileId, retryVersion, userId]);

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
    data: data?.caseId === caseId ? data : null,
    loading,
    refreshing,
    error,
    retry,
  };
}
