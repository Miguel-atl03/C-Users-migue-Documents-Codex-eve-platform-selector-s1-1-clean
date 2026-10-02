import { resolveOperationalPathProgress } from "./operational-description-path-progress.ts";
import type { OperationalDescriptionContext } from "./types.ts";

export const B0_Q04_INPUT_KEY = "B0-Q04.input_transduction";
export const B0_Q04_OUTPUT_KEY = "B0-Q04.output_transduction";
export const B0_Q04_INPUT_STATUS_KEY = "B0-Q04.input_transduction_status";
export const B0_Q04_OUTPUT_STATUS_KEY = "B0-Q04.output_transduction_status";
export const B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY = "B0-Q04.boundary_source_draft";

export type BoundarySectionConfirmationStatus =
  | "pending"
  | "confirmed"
  | "manual";

export type ActivityBoundarySectionId =
  | "input_transduction"
  | "output_transduction";

export type ActivityBoundarySectionReview = {
  id: ActivityBoundarySectionId;
  sectionLabel: string;
  inferredSnippet: string | null;
  isSufficient: boolean;
  confirmPrompt: string;
  manualPrompt: string;
};

export type ActivityBoundaryReview = {
  waitingForOperationalDescription: boolean;
  sections: ActivityBoundarySectionReview[];
};

const TRANSFORMATION_BREAK_PATTERN =
  /,(?=\s*(?:y\s+)?(?:cotejo|cotejar|comparo|comparar|analizo|analizar|filtro|filtrar|transformo|transformar|genero|generar|preparo|preparar|valido|reviso|identifico|proceso|calculo))/i;

const INPUT_TRIGGER_PATTERN =
  /\b(al recibir|cuando(?:\s+ya)?|empiezo cuando|una vez que|al tener)\b/i;

const OUTPUT_HANDOFF_PATTERN =
  /\b(?:una vez finalizado,? entrego|entrego|envio|envío|dejo disponible)[^.!?]*/i;

function cleanSnippet(value: string | null | undefined) {
  return value?.replace(/[,.;]+$/, "").trim() ?? null;
}

function extractInputTransductionSnippet(draftText: string) {
  const trimmed = draftText.trim();
  if (!trimmed) {
    return null;
  }

  const [firstClause] = trimmed.split(TRANSFORMATION_BREAK_PATTERN);
  const candidate = firstClause?.trim();
  if (candidate && INPUT_TRIGGER_PATTERN.test(candidate)) {
    return cleanSnippet(candidate);
  }

  const triggerClause = trimmed.match(
    /\b(al recibir[^,]+|cuando(?:\s+ya)?[^,]+|empiezo cuando[^,]+|una vez que[^,]+)/i,
  );
  return cleanSnippet(triggerClause?.[0]);
}

function extractOutputTransductionSnippet(draftText: string) {
  const trimmed = draftText.trim();
  if (!trimmed) {
    return null;
  }

  const handoffMatch = trimmed.match(OUTPUT_HANDOFF_PATTERN);
  return cleanSnippet(handoffMatch?.[0]);
}

function buildSectionReview(
  id: ActivityBoundarySectionId,
  inferredSnippet: string | null,
  isSufficient: boolean,
): ActivityBoundarySectionReview {
  if (id === "input_transduction") {
    return {
      id,
      sectionLabel: "Inicio de la actividad",
      inferredSnippet,
      isSufficient,
      confirmPrompt: inferredSnippet
        ? "Con lo que escribiste arriba, así empieza tu actividad. ¿Va bien?"
        : "Escribe qué recibes, ves o necesitas para empezar esta actividad.",
      manualPrompt:
        "Escribe qué recibes, ves o necesitas para empezar esta actividad.",
    };
  }

  return {
    id,
    sectionLabel: "Cierre y entrega",
    inferredSnippet,
    isSufficient,
    confirmPrompt: inferredSnippet
      ? "Con lo que escribiste arriba, así termina y entregas el resultado. ¿Va bien?"
      : "Escribe qué queda listo al terminar y quién recibe ese resultado.",
    manualPrompt:
      "Escribe qué queda listo al terminar y quién recibe ese resultado.",
  };
}

export function buildFormattedBoundaryAnswer(input: {
  entryValue: string;
  exitValue: string;
}) {
  return `Inicio: ${input.entryValue.trim()}. Cierre: ${input.exitValue.trim()}.`;
}

export function inferActivityBoundaryReview(
  draftText: string,
  context: OperationalDescriptionContext = {},
): ActivityBoundaryReview {
  const trimmed = draftText.trim();

  if (!trimmed) {
    return {
      waitingForOperationalDescription: true,
      sections: [
        buildSectionReview("input_transduction", null, false),
        buildSectionReview("output_transduction", null, false),
      ],
    };
  }

  const pathProgress = resolveOperationalPathProgress(trimmed, context);
  const entrySufficient = pathProgress.componentsCovered.includes(
    "input_transduction",
  );
  const exitSufficient = pathProgress.componentsCovered.includes(
    "output_transduction",
  );

  return {
    waitingForOperationalDescription: false,
    sections: [
      buildSectionReview(
        "input_transduction",
        extractInputTransductionSnippet(trimmed),
        entrySufficient,
      ),
      buildSectionReview(
        "output_transduction",
        extractOutputTransductionSnippet(trimmed),
        exitSufficient,
      ),
    ],
  };
}

export function getBoundarySectionDraftValue(
  answers: Record<string, string | undefined>,
  sectionId: ActivityBoundarySectionId,
) {
  return sectionId === "input_transduction"
    ? answers[B0_Q04_INPUT_KEY] ?? ""
    : answers[B0_Q04_OUTPUT_KEY] ?? "";
}

export function getBoundarySectionValue(
  answers: Record<string, string | undefined>,
  sectionId: ActivityBoundarySectionId,
) {
  return getBoundarySectionDraftValue(answers, sectionId).trim();
}

export function getBoundarySectionStatus(
  answers: Record<string, string | undefined>,
  sectionId: ActivityBoundarySectionId,
): BoundarySectionConfirmationStatus {
  const raw =
    sectionId === "input_transduction"
      ? answers[B0_Q04_INPUT_STATUS_KEY]
      : answers[B0_Q04_OUTPUT_STATUS_KEY];

  if (
    raw === "confirmed" ||
    raw === "manual" ||
    raw === "pending"
  ) {
    return raw;
  }

  return "pending";
}

export function composeBoundaryAnswerFromSections(
  answers: Record<string, string | undefined>,
) {
  const entryValue = getBoundarySectionValue(answers, "input_transduction");
  const exitValue = getBoundarySectionValue(answers, "output_transduction");

  if (!entryValue || !exitValue) {
    return "";
  }

  return buildFormattedBoundaryAnswer({ entryValue, exitValue });
}

export function isBoundarySectionResolved(
  answers: Record<string, string | undefined>,
  sectionId: ActivityBoundarySectionId,
) {
  const value = getBoundarySectionValue(answers, sectionId);
  if (!value) {
    return false;
  }

  const status = getBoundarySectionStatus(answers, sectionId);
  return status === "confirmed" || status === "manual";
}

export function isActivityBoundaryQuestionComplete(
  answers: Record<string, string | undefined>,
) {
  return (
    isBoundarySectionResolved(answers, "input_transduction") &&
    isBoundarySectionResolved(answers, "output_transduction") &&
    Boolean(answers["B0-Q04"]?.trim())
  );
}

export function shouldResetBoundarySections(
  answers: Record<string, string | undefined>,
  operationalDescriptionText: string,
) {
  const sourceDraft = answers[B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY]?.trim() ?? "";
  if (!sourceDraft) {
    return false;
  }

  return sourceDraft !== operationalDescriptionText.trim();
}

export function buildBoundarySectionResetPatch() {
  return {
    "B0-Q04": "",
    [B0_Q04_INPUT_KEY]: "",
    [B0_Q04_OUTPUT_KEY]: "",
    [B0_Q04_INPUT_STATUS_KEY]: "pending",
    [B0_Q04_OUTPUT_STATUS_KEY]: "pending",
    [B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY]: "",
  } as const;
}

export function buildBoundarySectionConfirmPatch(input: {
  section: ActivityBoundarySectionReview;
  operationalDescriptionText: string;
  currentAnswers: Record<string, string | undefined>;
}) {
  const value = input.section.inferredSnippet?.trim() ?? "";
  const composed = composeBoundaryAnswerFromSections({
    ...input.currentAnswers,
    ...(input.section.id === "input_transduction"
      ? { [B0_Q04_INPUT_KEY]: value }
      : { [B0_Q04_OUTPUT_KEY]: value }),
  });

  if (input.section.id === "input_transduction") {
    return {
      [B0_Q04_INPUT_KEY]: value,
      [B0_Q04_INPUT_STATUS_KEY]: "confirmed" as const,
      [B0_Q04_OUTPUT_KEY]: input.currentAnswers[B0_Q04_OUTPUT_KEY] ?? "",
      [B0_Q04_OUTPUT_STATUS_KEY]:
        input.currentAnswers[B0_Q04_OUTPUT_STATUS_KEY] ?? "pending",
      [B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY]: input.operationalDescriptionText.trim(),
      "B0-Q04": composed,
    };
  }

  return {
    [B0_Q04_OUTPUT_KEY]: value,
    [B0_Q04_OUTPUT_STATUS_KEY]: "confirmed" as const,
    [B0_Q04_INPUT_KEY]: input.currentAnswers[B0_Q04_INPUT_KEY] ?? "",
    [B0_Q04_INPUT_STATUS_KEY]:
      input.currentAnswers[B0_Q04_INPUT_STATUS_KEY] ?? "pending",
    [B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY]: input.operationalDescriptionText.trim(),
    "B0-Q04": composed,
  };
}

export function buildBoundarySectionCorrectionPatch(input: {
  section: ActivityBoundarySectionReview;
  currentAnswers: Record<string, string | undefined>;
}) {
  const existing = getBoundarySectionValue(input.currentAnswers, input.section.id);
  const value = existing || input.section.inferredSnippet || "";

  if (input.section.id === "input_transduction") {
    const nextAnswers = {
      ...input.currentAnswers,
      [B0_Q04_INPUT_KEY]: value,
      [B0_Q04_INPUT_STATUS_KEY]: "pending" as const,
    };

    return {
      ...nextAnswers,
      "B0-Q04": composeBoundaryAnswerFromSections(nextAnswers),
    };
  }

  const nextAnswers = {
    ...input.currentAnswers,
    [B0_Q04_OUTPUT_KEY]: value,
    [B0_Q04_OUTPUT_STATUS_KEY]: "pending" as const,
  };

  return {
    ...nextAnswers,
    "B0-Q04": composeBoundaryAnswerFromSections(nextAnswers),
  };
}

export function buildBoundarySectionDraftValuePatch(input: {
  sectionId: ActivityBoundarySectionId;
  value: string;
  currentAnswers: Record<string, string | undefined>;
}) {
  const nextAnswers = {
    ...input.currentAnswers,
    ...(input.sectionId === "input_transduction"
      ? { [B0_Q04_INPUT_KEY]: input.value }
      : { [B0_Q04_OUTPUT_KEY]: input.value }),
  };

  return {
    ...nextAnswers,
    "B0-Q04": composeBoundaryAnswerFromSections(nextAnswers),
  };
}

export function buildBoundarySectionAcceptPatch(input: {
  sectionId: ActivityBoundarySectionId;
  value: string;
  inferredSnippet?: string | null;
  operationalDescriptionText: string;
  currentAnswers: Record<string, string | undefined>;
}) {
  const trimmed = input.value.trim();
  if (!trimmed) {
    return input.currentAnswers;
  }

  const normalizedInferred = input.inferredSnippet?.trim() ?? "";
  const status: BoundarySectionConfirmationStatus =
    normalizedInferred && trimmed === normalizedInferred
      ? "confirmed"
      : "manual";

  const nextAnswers = {
    ...input.currentAnswers,
    ...(input.sectionId === "input_transduction"
      ? {
          [B0_Q04_INPUT_KEY]: trimmed,
          [B0_Q04_INPUT_STATUS_KEY]: status,
        }
      : {
          [B0_Q04_OUTPUT_KEY]: trimmed,
          [B0_Q04_OUTPUT_STATUS_KEY]: status,
        }),
    [B0_Q04_BOUNDARY_SOURCE_DRAFT_KEY]: input.operationalDescriptionText.trim(),
  };

  return {
    ...nextAnswers,
    "B0-Q04": composeBoundaryAnswerFromSections(nextAnswers),
  };
}

export function buildBoundarySectionManualPatch(input: {
  sectionId: ActivityBoundarySectionId;
  value: string;
  currentAnswers: Record<string, string | undefined>;
}) {
  const trimmed = input.value.trim();
  const nextAnswers = {
    ...input.currentAnswers,
    ...(input.sectionId === "input_transduction"
      ? {
          [B0_Q04_INPUT_KEY]: input.value,
          [B0_Q04_INPUT_STATUS_KEY]: trimmed
            ? ("manual" as const)
            : ("pending" as const),
        }
      : {
          [B0_Q04_OUTPUT_KEY]: input.value,
          [B0_Q04_OUTPUT_STATUS_KEY]: trimmed
            ? ("manual" as const)
            : ("pending" as const),
        }),
  };

  return {
    ...nextAnswers,
    "B0-Q04": composeBoundaryAnswerFromSections(nextAnswers),
  };
}

/** @deprecated Use inferActivityBoundaryReview */
export function inferActivityBoundaryFromOperationalDescription(
  draftText: string,
  context: OperationalDescriptionContext = {},
) {
  const review = inferActivityBoundaryReview(draftText, context);
  const entry = review.sections.find((section) => section.id === "input_transduction");
  const exit = review.sections.find((section) => section.id === "output_transduction");

  return {
    startSnippet: entry?.inferredSnippet ?? null,
    endSnippet: exit?.inferredSnippet ?? null,
    formattedAnswer:
      entry?.inferredSnippet && exit?.inferredSnippet
        ? buildFormattedBoundaryAnswer({
            entryValue: entry.inferredSnippet,
            exitValue: exit.inferredSnippet,
          })
        : null,
    confidence:
      entry?.isSufficient && exit?.isSufficient
        ? ("high" as const)
        : entry?.isSufficient || exit?.isSufficient
          ? ("medium" as const)
          : ("low" as const),
    readyForConfirmation: Boolean(
      entry?.isSufficient &&
        exit?.isSufficient &&
        entry.inferredSnippet &&
        exit.inferredSnippet,
    ),
  };
}
