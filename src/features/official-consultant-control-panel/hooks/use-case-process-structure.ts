"use client";

/**
 * Unit 3B operational milestones remain available for internal/process-structure
 * consumers. Rector §8 Eje Y uses `milestone=H0..H6` via useCaseCoreMilestones.
 * This hook no longer owns the `milestone` query param.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { CaseProcessStructureResponse } from "@/services/eve/official-control-panel/official-control-panel-process-structure.types";
import { getCaseProcessStructure } from "../data/client-context-api";
import {
  PROCESS_STRUCTURE_ERROR_MESSAGE,
  classifyProcessStructureStatus,
  presentProcessStructureViewModel,
} from "../presentation/process-structure-presentation";
import type { ClientContextViewModel } from "../types/client-context.types";

type UseCaseProcessStructureInput = {
  context: ClientContextViewModel;
  accessToken: string | null;
};

export function useCaseProcessStructure({
  context,
  accessToken,
}: UseCaseProcessStructureInput) {
  const caseId =
    context.status === "active" ? context.selection.caseId : null;
  const caseLabel = context.selectedCase?.label ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<CaseProcessStructureResponse | null>(
    null,
  );
  const [retryVersion, setRetryVersion] = useState(0);
  const [localSelectedMilestoneId, setLocalSelectedMilestoneId] = useState<
    string | null
  >(null);
  const focusRestoreRef = useRef<string | null>(null);
  const loadedCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    setLocalSelectedMilestoneId(null);
  }, [caseId]);

  useEffect(() => {
    if (!caseId || !accessToken) {
      setLoading(false);
      setError(false);
      setErrorMessage(null);
      setResponse(null);
      loadedCaseIdRef.current = null;
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setErrorMessage(null);
    loadedCaseIdRef.current = null;

    void (async () => {
      try {
        const next = await getCaseProcessStructure(
          accessToken,
          caseId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResponse(next);
        loadedCaseIdRef.current = caseId;
        setLoading(false);
      } catch (errorValue) {
        if (
          errorValue instanceof DOMException &&
          errorValue.name === "AbortError"
        ) {
          return;
        }
        if (controller.signal.aborted) return;
        setResponse(null);
        loadedCaseIdRef.current = caseId;
        setLoading(false);
        setError(true);
        setErrorMessage(PROCESS_STRUCTURE_ERROR_MESSAGE);
      }
    })();

    return () => controller.abort();
  }, [accessToken, caseId, retryVersion]);

  const status = classifyProcessStructureStatus({
    caseActive: Boolean(caseId),
    loading,
    error,
    response,
  });

  const selectedMilestoneId = localSelectedMilestoneId;

  const viewModel = presentProcessStructureViewModel({
    status,
    caseId,
    caseLabel,
    response,
    selectedMilestoneId,
    errorMessage,
  });

  const selectMilestone = useCallback((milestoneId: string | null) => {
    focusRestoreRef.current = milestoneId;
    setLocalSelectedMilestoneId(milestoneId);
  }, []);

  const retry = useCallback(() => {
    setRetryVersion((version) => version + 1);
  }, []);

  return {
    processStructure: viewModel,
    selectMilestone,
    retry,
    focusRestoreRef,
  };
}
