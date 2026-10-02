import type { OperationalCyberneticComponentId } from "@/features/significado/operational-description-cybernetic-components";
import {
  isOperationalCyberneticComponentId,
} from "@/features/significado/operational-description-cybernetic-components";
import { BANNED_AMBIGUOUS_PHRASES } from "@/services/local-work-map-activity-validation";
import { normalizeComparableText } from "./narrative-coach-policy.ts";
import type { OperationalDescriptionContext } from "./types.ts";

export type LlmCoachRawResponse = {
  components_covered?: string[];
  next_missing_component?: string | null;
  lead_message?: string;
  suggested_fragment?: string | null;
  confidence?: "high" | "medium" | "low";
};

export type LlmCoachValidatedResponse = {
  message: string | null;
  exampleFragment: string | null;
  cyberneticEvaluation: {
    componentsCovered: OperationalCyberneticComponentId[];
    nextMissingComponent: OperationalCyberneticComponentId | null;
  };
};

const PROHIBITED_UI_TERMS = [
  "vsm",
  "mmabp",
  "ahe",
  "transduccion",
  "homeostasis",
  "sistema 1",
  "sistema 3",
];

function containsProhibitedTerm(text: string) {
  const normalized = normalizeComparableText(text);
  return PROHIBITED_UI_TERMS.some((term) => normalized.includes(term));
}

function containsBannedPhrase(text: string) {
  const normalized = normalizeComparableText(text);
  return BANNED_AMBIGUOUS_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsCopyPasteExamplePattern(text: string) {
  return /[«»"]|por ejemplo\s*:/i.test(text);
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

function normalizeComponentsCovered(
  values: string[] | undefined,
): OperationalCyberneticComponentId[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(isOperationalCyberneticComponentId);
}

function normalizeNextMissingComponent(
  value: string | null | undefined,
): OperationalCyberneticComponentId | null {
  if (!value || !isOperationalCyberneticComponentId(value)) {
    return null;
  }
  return value;
}

export function parseLlmCoachRawResponse(content: string): LlmCoachRawResponse | null {
  try {
    const parsed = JSON.parse(content) as LlmCoachRawResponse;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function validateAndFormatLlmCoachResponse(
  raw: LlmCoachRawResponse,
  context: OperationalDescriptionContext,
): LlmCoachValidatedResponse {
  const lead = raw.lead_message?.trim() ?? "";
  const componentsCovered = normalizeComponentsCovered(raw.components_covered);
  const nextMissingComponent = normalizeNextMissingComponent(
    raw.next_missing_component,
  );

  if (!lead) {
    return {
      message: null,
      exampleFragment: null,
      cyberneticEvaluation: {
        componentsCovered,
        nextMissingComponent,
      },
    };
  }

  if (lead.length > 260) {
    return {
      message: null,
      exampleFragment: null,
      cyberneticEvaluation: {
        componentsCovered,
        nextMissingComponent,
      },
    };
  }

  if (
    containsProhibitedTerm(lead) ||
    containsBannedPhrase(lead) ||
    containsCopyPasteExamplePattern(lead) ||
    echoesActivityTitle(lead, context.activityTitle)
  ) {
    return {
      message: null,
      exampleFragment: null,
      cyberneticEvaluation: {
        componentsCovered,
        nextMissingComponent,
      },
    };
  }

  return {
    message: lead,
    exampleFragment: null,
    cyberneticEvaluation: {
      componentsCovered,
      nextMissingComponent,
    },
  };
}
