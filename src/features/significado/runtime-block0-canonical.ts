import type {
  CanonicalHelpStatus,
  RuntimeHelpTextKind,
  RuntimeInteractionViewModel,
  RuntimeResponseKind,
  RuntimeSourceSheetRef,
} from "@/domain/runtime-interaction-view-model";
import { getRuntimeBlock0InteractionViewModels } from "@/services/runtime-block0-catalog-adapter";

export type RuntimeBlock0ResponseKind = RuntimeResponseKind;

export type RuntimeBlock0EpistemicState =
  | "inferred_from_workmap"
  | "context_from_workmap"
  | "requires_confirmation";

export type RuntimeBlock0HelpTextKind = RuntimeHelpTextKind;

export type RuntimeBlock0CanonicalHelpStatus = CanonicalHelpStatus;

export type RuntimeBlock0Subfield = {
  id: string;
  label: string;
  responseKind: Exclude<RuntimeBlock0ResponseKind, "compound">;
  options?: string[];
  epistemicState?: RuntimeBlock0EpistemicState;
  sourceCode?: string;
  canonicalVariable?: string;
};

export type RuntimeBlock0CanonicalQuestion = {
  id: string;
  order: number;
  questionText: string;
  helpText: string;
  helpTextKind: RuntimeBlock0HelpTextKind;
  helpTextSource: string;
  canonicalHelpStatus: RuntimeBlock0CanonicalHelpStatus;
  technicalLabel?: string;
  supplementalHelpText?: string;
  supplementalHelpTextKind?: RuntimeBlock0HelpTextKind;
  responseKind: RuntimeBlock0ResponseKind;
  required: boolean;
  options?: string[];
  subfields?: RuntimeBlock0Subfield[];
  sourceRuntimeInteractionId: string;
  sourceSheet: string;
  sourceSheetRefs: RuntimeSourceSheetRef[];
  canonicalVariables: string;
  canonicalVariableList: string[];
  epistemicState?: RuntimeBlock0EpistemicState;
  showPrefillBadge?: boolean;
  showRequiresConfirmationBadge?: boolean;
};

function resolveQuestionEpistemicState(
  interactionId: string,
): RuntimeBlock0EpistemicState | undefined {
  if (interactionId === "B0-Q01" || interactionId === "B0-Q02") {
    return "inferred_from_workmap";
  }
  if (interactionId === "B0-Q04") {
    return "requires_confirmation";
  }
  return undefined;
}

function resolveSubfieldEpistemicState({
  interactionId,
  subfieldId,
}: {
  interactionId: string;
  subfieldId: string;
}): RuntimeBlock0EpistemicState | undefined {
  if (interactionId === "B0-Q01") {
    if (subfieldId === "user_correction_note") {
      return undefined;
    }
    if (subfieldId === "procedure_or_standard") {
      return "context_from_workmap";
    }
    return "inferred_from_workmap";
  }
  if (interactionId === "B0-Q03") {
    return subfieldId === "frequency_base"
      ? "inferred_from_workmap"
      : "context_from_workmap";
  }
  return undefined;
}

function shouldShowPrefillBadge(interactionId: string): boolean {
  return interactionId === "B0-Q01" ||
    interactionId === "B0-Q02" ||
    interactionId === "B0-Q04";
}

function shouldShowRequiresConfirmationBadge(interactionId: string): boolean {
  return interactionId === "B0-Q01" ||
    interactionId === "B0-Q02" ||
    interactionId === "B0-Q03" ||
    interactionId === "B0-Q04";
}

function getPrimarySourceSheet(sourceSheetRefs: RuntimeSourceSheetRef[]): string {
  return sourceSheetRefs[0]?.sourceSheet ?? "Runtime_Interactions_Base_40";
}

function resolveSignificadoHelpText(
  interaction: RuntimeInteractionViewModel,
): string {
  if (interaction.runtimeInteractionId === "B0-Q01") {
    return "Revisa cada parte por separado y corrige directamente el campo que no encaje.";
  }

  return interaction.helpText;
}

function mapInteractionToSignificadoQuestion(
  interaction: RuntimeInteractionViewModel,
): RuntimeBlock0CanonicalQuestion {
  const subfields = interaction.subfields.map((subfield) => ({
    ...subfield,
    options: undefined,
    epistemicState: resolveSubfieldEpistemicState({
      interactionId: interaction.runtimeInteractionId,
      subfieldId: subfield.id,
    }),
  }));

  return {
    id: interaction.runtimeInteractionId,
    order: interaction.runtimeOrder,
    questionText: interaction.questionText,
    helpText: resolveSignificadoHelpText(interaction),
    helpTextKind: interaction.helpTextKind,
    helpTextSource:
      interaction.helpTextSource ??
      `${interaction.sourceSheetRefs[0]?.sourceSheet ?? "Runtime adapter"}.${
        interaction.helpTextKind
      }`,
    canonicalHelpStatus: interaction.canonicalHelpStatus,
    technicalLabel: interaction.technicalLabel,
    supplementalHelpText:
      interaction.runtimeInteractionId === "B0-Q04"
        ? "Confirma o ajusta dónde empieza y dónde termina realmente esta actividad."
        : undefined,
    supplementalHelpTextKind:
      interaction.runtimeInteractionId === "B0-Q04"
        ? "fallback_no_canonico"
        : undefined,
    responseKind: interaction.responseKind,
    required: true,
    options: interaction.options?.map((option) => option.label),
    subfields: subfields.length ? subfields : undefined,
    sourceRuntimeInteractionId: interaction.sourceRuntimeInteractionId,
    sourceSheet: getPrimarySourceSheet(interaction.sourceSheetRefs),
    sourceSheetRefs: interaction.sourceSheetRefs,
    canonicalVariables: interaction.canonicalVariables.join("; "),
    canonicalVariableList: interaction.canonicalVariables,
    epistemicState: resolveQuestionEpistemicState(interaction.runtimeInteractionId),
    showPrefillBadge: shouldShowPrefillBadge(interaction.runtimeInteractionId),
    showRequiresConfirmationBadge: shouldShowRequiresConfirmationBadge(
      interaction.runtimeInteractionId,
    ),
  };
}

export function getSignificadoBlock0QuestionsForScreen(): RuntimeBlock0CanonicalQuestion[] {
  return getRuntimeBlock0InteractionViewModels().map(
    mapInteractionToSignificadoQuestion,
  );
}

export const RUNTIME_BLOCK0_CANONICAL_QUESTIONS: RuntimeBlock0CanonicalQuestion[] =
  getSignificadoBlock0QuestionsForScreen();

export function buildBlock0AnswerKey(
  questionId: string,
  subfieldId?: string,
): string {
  return subfieldId ? `${questionId}.${subfieldId}` : questionId;
}

export function createEmptyBlock0Answers(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const question of RUNTIME_BLOCK0_CANONICAL_QUESTIONS) {
    if (question.responseKind === "compound" && question.subfields) {
      for (const subfield of question.subfields) {
        answers[buildBlock0AnswerKey(question.id, subfield.id)] = "";
      }
      continue;
    }

    answers[buildBlock0AnswerKey(question.id)] = "";
  }
  return answers;
}

export type SignificadoBoundarySectionId =
  | "input_transduction"
  | "output_transduction";

export type SignificadoBoundarySectionReview = {
  id: SignificadoBoundarySectionId;
  sectionLabel: string;
  inferredSnippet: string | null;
  isSufficient: boolean;
  confirmPrompt: string;
  manualPrompt: string;
};

export type SignificadoBoundaryReview = {
  waitingForOperationalDescription: boolean;
  sections: SignificadoBoundarySectionReview[];
};

function cleanBoundarySnippet(value: string | null | undefined) {
  return value?.replace(/[,.;]+$/, "").trim() ?? null;
}

function extractSignificadoOutputClosureSnippet(draftText: string) {
  const trimmed = draftText.trim();
  if (!trimmed) {
    return null;
  }

  const patterns = [
    /\b(?:una vez finalizado,? entrego|entrego|envio|envío|dejo disponible)[^.!?]*/i,
    /\b(?:preparo|genero|elaboro|transformo)[^.]*?\bdejo listo para[^.!?]*/i,
    /[^.]*\bdejo listo para[^.!?]*/i,
    /\bqueda listo para[^.!?]*/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    const snippet = cleanBoundarySnippet(match?.[0]);
    if (snippet) {
      return snippet;
    }
  }

  return null;
}

function isSignificadoOutputClosureSufficient(
  draftText: string,
  snippet: string | null,
) {
  if (!snippet) {
    return false;
  }

  const normalized = draftText.toLowerCase();
  const mentionsClosure =
    /\b(entrego|envio|envío|dejo listo|dejo disponible|queda listo)\b/.test(
      normalized,
    );
  const mentionsRecipientOrUse =
    /\b(para quien|quien usa|siguiente control|siguiente paso|proximo control|controller|direccion|gerencia|comite|equipo|area)\b/.test(
      normalized,
    );

  return mentionsClosure && mentionsRecipientOrUse;
}

export function enhanceSignificadoActivityBoundaryReview(
  review: SignificadoBoundaryReview,
  operationalDescription: string,
): SignificadoBoundaryReview {
  if (review.waitingForOperationalDescription) {
    return review;
  }

  const exitIndex = review.sections.findIndex(
    (section) => section.id === "output_transduction",
  );
  if (exitIndex === -1) {
    return review;
  }

  const exitSection = review.sections[exitIndex]!;
  if (exitSection.inferredSnippet && exitSection.isSufficient) {
    return review;
  }

  const inferredSnippet =
    extractSignificadoOutputClosureSnippet(operationalDescription) ??
    exitSection.inferredSnippet;
  const isSufficient =
    exitSection.isSufficient ||
    isSignificadoOutputClosureSufficient(
      operationalDescription,
      inferredSnippet,
    );

  if (!inferredSnippet && !isSufficient) {
    return review;
  }

  const sections = [...review.sections];
  sections[exitIndex] = {
    ...exitSection,
    inferredSnippet,
    isSufficient,
    confirmPrompt: inferredSnippet
      ? "Con lo que escribiste arriba, así termina y entregas el resultado. ¿Va bien?"
      : exitSection.confirmPrompt,
  };

  return {
    ...review,
    sections,
  };
}
