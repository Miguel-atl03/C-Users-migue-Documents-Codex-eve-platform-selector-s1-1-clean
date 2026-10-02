"use client";

import {
  OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH,
  OPERATIONAL_DESCRIPTION_UI,
} from "@/features/significado/operational-description-canon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateOperationalDescriptionCoach,
  type OperationalDescriptionContext,
} from "@/services/operational-description-coach/evaluate-operational-description-coach";
import { resolveOperationalPathProgress } from "@/services/operational-description-coach/operational-description-path-progress";

const COACH_DEBOUNCE_MS = 700;

type CoachApiResponse = {
  message: string | null;
  coachSource?: "deterministic" | "llm";
  cyberneticEvaluation?: {
    componentsCovered: string[];
    nextMissingComponent: string | null;
  } | null;
};

export type OperationalCoachStatusKind = "guide" | "complete" | null;

type UseOperationalDescriptionCoachOptions = {
  text: string;
  context?: OperationalDescriptionContext;
  enabled?: boolean;
  sessionId?: string | null;
  workMapActivityId?: string | null;
  sessionMode?: "commercial" | "demo";
  requestHeaders?: Record<string, string>;
};

function shouldRequestPersonalizedCoach(
  draftText: string,
  sessionId?: string | null,
) {
  return (
    Boolean(sessionId?.trim()) &&
    draftText.trim().length >= OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH
  );
}

export function useOperationalDescriptionCoach({
  text,
  context = {},
  enabled = true,
  sessionId = null,
  workMapActivityId = null,
  sessionMode = "demo",
  requestHeaders = {},
}: UseOperationalDescriptionCoachOptions) {
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [fieldTouched, setFieldTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequenceRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  const pathProgress = useMemo(
    () => resolveOperationalPathProgress(text, context),
    [context, contextKey, text],
  );

  const applyDeterministicCoach = useCallback(
    (draftText: string) => {
      if (!enabled) {
        setCoachMessage(null);
        return null;
      }

      const result = evaluateOperationalDescriptionCoach(draftText, context);
      setCoachMessage(result.message);
      return result;
    },
    [context, enabled],
  );

  const requestPersonalizedCoach = useCallback(
    async (draftText: string) => {
      if (!enabled || !shouldRequestPersonalizedCoach(draftText, sessionId)) {
        return false;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++requestSequenceRef.current;

      try {
        const response = await fetch("/api/coach/operational-description", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...requestHeaders,
          },
          signal: controller.signal,
          body: JSON.stringify({
            sessionId,
            draftText,
            context,
            mode: sessionMode,
            workMapActivityId,
          }),
        });

        if (!response.ok || requestId !== requestSequenceRef.current) {
          return false;
        }

        const payload = (await response.json()) as CoachApiResponse;

        if (requestId !== requestSequenceRef.current) {
          return false;
        }

        setCoachMessage(payload.message?.trim() ? payload.message : null);
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return false;
        }
        return false;
      }
    },
    [context, enabled, requestHeaders, sessionId, sessionMode, workMapActivityId],
  );

  const evaluateNow = useCallback(
    async (draftText: string) => {
      if (!enabled) {
        setCoachMessage(null);
        return;
      }

      if (shouldRequestPersonalizedCoach(draftText, sessionId)) {
        const personalized = await requestPersonalizedCoach(draftText);
        if (!personalized) {
          applyDeterministicCoach(draftText);
        }
        return;
      }

      applyDeterministicCoach(draftText);
    },
    [applyDeterministicCoach, enabled, requestPersonalizedCoach, sessionId],
  );

  useEffect(() => {
    if (!enabled) {
      setCoachMessage(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void evaluateNow(text);
    }, COACH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, evaluateNow, text, contextKey]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const markTouched = useCallback(() => {
    setFieldTouched(true);
    void evaluateNow(text);
  }, [evaluateNow, text]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setFieldTouched(true);
    void evaluateNow(text);
  }, [evaluateNow, text]);

  const trimmedLength = text.trim().length;
  const canShowStatus =
    enabled &&
    trimmedLength >= OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH &&
    (fieldTouched || isFocused || pathProgress.isComplete);

  const statusHintKind: OperationalCoachStatusKind = coachMessage
    ? "guide"
    : pathProgress.isComplete
      ? "complete"
      : null;

  const statusHint =
    canShowStatus && statusHintKind === "guide"
      ? coachMessage
      : canShowStatus && statusHintKind === "complete"
        ? OPERATIONAL_DESCRIPTION_UI.pathCompleteMessage
        : null;

  return {
    coachMessage: statusHintKind === "guide" ? statusHint : null,
    handleBlur,
    handleFocus,
    isPathComplete: pathProgress.isComplete,
    markTouched,
    pathStepStates: pathProgress.stepStates,
    statusHint,
    statusHintKind,
  };
}
