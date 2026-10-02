import {
  buildLlmIntroExampleSystemPrompt,
  buildLlmIntroExampleUserPrompt,
} from "./llm-intro-example-prompt.ts";
import {
  parseLlmIntroExampleRawResponse,
  validateLlmIntroExampleResponse,
} from "./llm-intro-example-response.ts";
import { isOperationalDescriptionLlmConfigured } from "./generate-llm-coach.ts";
import { checkOperationalDescriptionLlmRateLimit } from "./llm-coach-rate-limit.ts";
import type { OperationalDescriptionContext } from "./types.ts";

export type GenerateLlmIntroExampleDeps = {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export async function generateLlmOperationalDescriptionIntroExample(
  context: OperationalDescriptionContext,
  deterministicFallback: string,
  deps: GenerateLlmIntroExampleDeps = {},
): Promise<string | null> {
  const apiKey = deps.apiKey ?? process.env.OPENAI_API_KEY;
  const model = deps.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (!apiKey?.trim()) {
    return null;
  }

  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildLlmIntroExampleSystemPrompt() },
        {
          role: "user",
          content: buildLlmIntroExampleUserPrompt(context, deterministicFallback),
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OpenAiChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    return null;
  }

  const raw = parseLlmIntroExampleRawResponse(content);
  if (!raw) {
    return null;
  }

  return validateLlmIntroExampleResponse(raw, context);
}

export type ResolveIntroExampleInput = {
  sessionId: string;
  context: OperationalDescriptionContext;
  deterministicFallback: string;
  llmEnabled?: boolean;
};

export async function resolveOperationalDescriptionIntroExample(
  input: ResolveIntroExampleInput,
  deps: GenerateLlmIntroExampleDeps = {},
) {
  const fallback = input.deterministicFallback.trim();

  const shouldTryLlm =
    input.llmEnabled !== false &&
    isOperationalDescriptionLlmConfigured(deps.apiKey) &&
    Boolean(fallback);

  if (!shouldTryLlm) {
    return {
      exampleNarrative: fallback,
      exampleSource: "deterministic" as const,
    };
  }

  const rateLimit = checkOperationalDescriptionLlmRateLimit(input.sessionId);
  if (!rateLimit.allowed) {
    return {
      exampleNarrative: fallback,
      exampleSource: "deterministic" as const,
    };
  }

  const llmNarrative = await generateLlmOperationalDescriptionIntroExample(
    input.context,
    fallback,
    deps,
  );

  if (llmNarrative?.trim()) {
    return {
      exampleNarrative: llmNarrative,
      exampleSource: "llm" as const,
    };
  }

  return {
    exampleNarrative: fallback,
    exampleSource: "deterministic" as const,
  };
}
