import { OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH } from "@/features/significado/operational-description-canon";
import { buildCyberneticTrincheraFallbackMessage, inferCyberneticComponentsFromScan } from "./cybernetic-coach-fallback.ts";
import { evaluateOperationalDescriptionCoach } from "./evaluate-operational-description-coach.ts";
import {
  generateLlmOperationalDescriptionCoach,
  isOperationalDescriptionLlmConfigured,
  type GenerateLlmCoachDeps,
} from "./generate-llm-coach.ts";
import { checkOperationalDescriptionLlmRateLimit } from "./llm-coach-rate-limit.ts";
import type {
  OperationalDescriptionCoachResult,
  OperationalDescriptionContext,
} from "./types.ts";

export type ResolveOperationalDescriptionCoachInput = {
  sessionId: string;
  draftText: string;
  context?: OperationalDescriptionContext;
  llmEnabled?: boolean;
};

function buildCyberneticDeterministicFallback(
  draftText: string,
  context: OperationalDescriptionContext,
): OperationalDescriptionCoachResult {
  const base = evaluateOperationalDescriptionCoach(draftText, context);
  const inferred = inferCyberneticComponentsFromScan(base.scan, draftText);
  const fallback = buildCyberneticTrincheraFallbackMessage(base.scan, draftText);

  return {
    scan: base.scan,
    message: fallback.message,
    exampleFragment: null,
    coachSource: fallback.message ? "deterministic" : undefined,
    cyberneticEvaluation: inferred,
  };
}

export async function resolveOperationalDescriptionCoach(
  input: ResolveOperationalDescriptionCoachInput,
  deps: GenerateLlmCoachDeps = {},
): Promise<OperationalDescriptionCoachResult> {
  const context = input.context ?? {};
  const trimmed = input.draftText.trim();

  if (!trimmed) {
    return evaluateOperationalDescriptionCoach(trimmed, context);
  }

  const shouldTryLlm =
    input.llmEnabled !== false &&
    isOperationalDescriptionLlmConfigured(deps.apiKey) &&
    trimmed.length >= OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH;

  if (shouldTryLlm) {
    const rateLimit = checkOperationalDescriptionLlmRateLimit(input.sessionId);
    if (rateLimit.allowed) {
      const llmResult = await generateLlmOperationalDescriptionCoach(
        {
          draftText: trimmed,
          context,
        },
        deps,
      );

      const base = evaluateOperationalDescriptionCoach(trimmed, context);

      if (llmResult?.message?.trim()) {
        const deterministicFallback = buildCyberneticTrincheraFallbackMessage(
          base.scan,
          trimmed,
        );

        if (
          deterministicFallback.nextMissingComponent &&
          !llmResult.cyberneticEvaluation.nextMissingComponent
        ) {
          return buildCyberneticDeterministicFallback(trimmed, context);
        }

        return {
          scan: base.scan,
          message: llmResult.message,
          exampleFragment: null,
          coachSource: "llm",
          cyberneticEvaluation: llmResult.cyberneticEvaluation,
        };
      }

      if (
        llmResult &&
        !llmResult.message &&
        !llmResult.cyberneticEvaluation.nextMissingComponent
      ) {
        const deterministicFallback = buildCyberneticTrincheraFallbackMessage(
          base.scan,
          trimmed,
        );

        if (deterministicFallback.nextMissingComponent) {
          return buildCyberneticDeterministicFallback(trimmed, context);
        }

        return {
          scan: base.scan,
          message: null,
          exampleFragment: null,
          coachSource: "llm",
          cyberneticEvaluation: llmResult.cyberneticEvaluation,
        };
      }
    }
  }

  return buildCyberneticDeterministicFallback(trimmed, context);
}
