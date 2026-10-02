import {
  exampleOverlapsActivitySource,
  hasEstablishedActivityContext,
  normalizeComparableText,
} from "./narrative-coach-policy.ts";
import type { OperationalDescriptionContext } from "./types.ts";

const PROHIBITED_UI_TERMS = [
  "vsm",
  "mmabp",
  "ahe",
  "transduccion",
  "homeostasis",
  "sistema 1",
  "sistema 3",
];

export type LlmIntroExampleRawResponse = {
  example_narrative?: string;
  confidence?: "high" | "medium" | "low";
};

function containsProhibitedTerm(text: string) {
  const normalized = normalizeComparableText(text);
  return PROHIBITED_UI_TERMS.some((term) => normalized.includes(term));
}

function echoesActivityTitle(text: string, activityTitle: string | undefined) {
  const title = activityTitle?.trim();
  if (!title || title.length < 24) {
    return false;
  }

  const normalizedText = normalizeComparableText(text);
  const normalizedTitle = normalizeComparableText(title);
  if (normalizedText.includes(normalizedTitle)) {
    return true;
  }

  const probe = normalizedTitle.slice(0, Math.min(48, normalizedTitle.length));
  return probe.length >= 24 && normalizedText.includes(probe);
}

export function parseLlmIntroExampleRawResponse(
  content: string,
): LlmIntroExampleRawResponse | null {
  try {
    const parsed = JSON.parse(content) as LlmIntroExampleRawResponse;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function validateLlmIntroExampleResponse(
  raw: LlmIntroExampleRawResponse,
  context: OperationalDescriptionContext,
): string | null {
  const narrative = raw.example_narrative?.trim() ?? "";
  if (!narrative || narrative.length < 48 || narrative.length > 420) {
    return null;
  }

  if (
    containsProhibitedTerm(narrative) ||
    echoesActivityTitle(narrative, context.activityTitle) ||
    exampleOverlapsActivitySource(narrative, {
      activityTitle: context.activityTitle,
    })
  ) {
    return null;
  }

  if (!hasEstablishedActivityContext(context)) {
    return narrative;
  }

  return narrative;
}
