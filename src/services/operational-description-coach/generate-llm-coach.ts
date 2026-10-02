import { OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH } from "@/features/significado/operational-description-canon";
import {
  buildLlmCoachSystemPrompt,
  buildLlmCoachUserPrompt,
  type LlmCoachPromptInput,
} from "./llm-coach-prompt.ts";
import {
  parseLlmCoachRawResponse,
  validateAndFormatLlmCoachResponse,
  type LlmCoachValidatedResponse,
} from "./llm-coach-response.ts";

export type GenerateLlmCoachDeps = {
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

export function isOperationalDescriptionLlmConfigured(
  apiKey = process.env.OPENAI_API_KEY,
) {
  return Boolean(apiKey?.trim());
}

export async function generateLlmOperationalDescriptionCoach(
  input: LlmCoachPromptInput,
  deps: GenerateLlmCoachDeps = {},
): Promise<LlmCoachValidatedResponse | null> {
  const apiKey = deps.apiKey ?? process.env.OPENAI_API_KEY;
  const model = deps.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (!apiKey?.trim()) {
    return null;
  }

  const trimmedDraft = input.draftText?.trim() ?? "";
  if (trimmedDraft.length < OPERATIONAL_DESCRIPTION_MIN_DRAFT_LENGTH_FOR_COACH) {
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
      temperature: 0.25,
      max_tokens: 360,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildLlmCoachSystemPrompt() },
        { role: "user", content: buildLlmCoachUserPrompt(input) },
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

  const raw = parseLlmCoachRawResponse(content);
  if (!raw) {
    return null;
  }

  return validateAndFormatLlmCoachResponse(raw, input.context);
}
