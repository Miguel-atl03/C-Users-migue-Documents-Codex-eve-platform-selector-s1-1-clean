"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildOperationalDescriptionIntroGuide,
  shouldShowOperationalDescriptionIntroGuide,
} from "@/services/operational-description-coach/build-operational-description-intro-guide";
import type {
  OperationalDescriptionContext,
  OperationalDescriptionIntroGuide,
} from "@/services/operational-description-coach/types";

type UseOperationalDescriptionIntroGuideOptions = {
  draftText: string;
  context?: OperationalDescriptionContext;
  enabled?: boolean;
  sessionId?: string | null;
  sessionMode?: "commercial" | "demo";
  requestHeaders?: Record<string, string>;
};

export function useOperationalDescriptionIntroGuide({
  draftText,
  context = {},
  enabled = true,
  sessionId = null,
  sessionMode = "demo",
  requestHeaders = {},
}: UseOperationalDescriptionIntroGuideOptions) {
  const deterministicGuide = useMemo(
    () => buildOperationalDescriptionIntroGuide(context),
    [context],
  );

  const [guide, setGuide] = useState<OperationalDescriptionIntroGuide>(
    deterministicGuide,
  );
  const requestSequenceRef = useRef(0);

  const needsGuidance = shouldShowOperationalDescriptionIntroGuide({
    dismissed: false,
    draftText,
    context,
  });

  const showLeftExample = enabled && needsGuidance;
  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  useEffect(() => {
    setGuide((current) =>
      current.exampleSource === "llm" &&
      current.exampleNarrative !== deterministicGuide.exampleNarrative
        ? current
        : deterministicGuide,
    );
  }, [deterministicGuide]);

  useEffect(() => {
    if (!enabled || !showLeftExample || !sessionId?.trim()) {
      return;
    }

    const requestId = ++requestSequenceRef.current;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          "/api/coach/operational-description/intro-example",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...requestHeaders,
            },
            signal: controller.signal,
            body: JSON.stringify({
              sessionId,
              context,
              mode: sessionMode,
              deterministicFallback: deterministicGuide.exampleNarrative,
            }),
          },
        );

        if (!response.ok || requestId !== requestSequenceRef.current) {
          return;
        }

        const payload = (await response.json()) as {
          exampleNarrative?: string;
          exampleSource?: "deterministic" | "llm";
        };

        if (
          requestId !== requestSequenceRef.current ||
          !payload.exampleNarrative?.trim()
        ) {
          return;
        }

        setGuide({
          ...deterministicGuide,
          exampleNarrative: payload.exampleNarrative,
          exampleSource: payload.exampleSource ?? "deterministic",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    context,
    contextKey,
    deterministicGuide,
    enabled,
    requestHeaders,
    sessionId,
    sessionMode,
    showLeftExample,
  ]);

  return {
    guide,
    showLeftExample,
  };
}
