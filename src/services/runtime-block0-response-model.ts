import type {
  RuntimeBlock0CanonicalQuestion,
  RuntimeBlock0EpistemicState,
  RuntimeBlock0Subfield,
} from "@/features/significado/runtime-block0-canonical";
import {
  buildBlock0AnswerKey,
  RUNTIME_BLOCK0_CANONICAL_QUESTIONS,
} from "@/features/significado/runtime-block0-canonical";
import type {
  RuntimeBlock0InteractionResponse,
  RuntimeBlock0ResponseBundle,
  RuntimeBlock0ResponseProvenanceType,
  RuntimeBlock0SubfieldResponse,
  RuntimeEpistemicStatus,
} from "@/domain/runtime-block0-response";

export type RuntimeBlock0ResponseBundleInput = {
  activityId: string;
  activityLabel: string;
  answers: Record<string, string>;
  initialAnswers?: Partial<Record<string, string>>;
  confirmPrefillsOnSubmit?: boolean;
  createdAt?: string;
};

type RuntimeBlock0ResponseField = {
  runtimeInteractionId: string;
  subfieldName: string;
  answerKey: string;
  canonicalVariable?: string;
  epistemicState?: RuntimeBlock0EpistemicState;
};

const REQUIRED_MINIMUM_FIELDS_BY_INTERACTION: Record<string, string[]> = {
  "B0-Q01": [
    "B0-Q01.action_verb",
    "B0-Q01.input_or_object",
    "B0-Q01.procedure_or_standard",
    "B0-Q01.output_or_result",
  ],
  "B0-Q02": ["B0-Q02"],
  "B0-Q03": [
    "B0-Q03.frequency_base",
    "B0-Q03.typical_context",
    "B0-Q03.primary_actor_scope",
  ],
  "B0-Q04": ["B0-Q04.input_transduction", "B0-Q04.output_transduction"],
};

const B0_Q04_BOUNDARY_FIELDS: RuntimeBlock0ResponseField[] = [
  {
    runtimeInteractionId: "B0-Q04",
    subfieldName: "input_transduction",
    answerKey: "B0-Q04.input_transduction",
    canonicalVariable: "activity_start_condition_hint / scene_boundary_start_hint",
    epistemicState: "requires_confirmation",
  },
  {
    runtimeInteractionId: "B0-Q04",
    subfieldName: "output_transduction",
    answerKey: "B0-Q04.output_transduction",
    canonicalVariable: "activity_end_result_hint / scene_boundary_end_hint",
    epistemicState: "requires_confirmation",
  },
];

function normalizeValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function mapBaseEpistemicState(
  epistemicState: RuntimeBlock0EpistemicState | undefined,
): RuntimeEpistemicStatus {
  if (epistemicState === "inferred_from_workmap") {
    return "inferred_from_workmap";
  }
  if (epistemicState === "context_from_workmap") {
    return "context_from_workmap";
  }
  if (epistemicState === "requires_confirmation") {
    return "canonical_derivation";
  }
  return "internal_calculated";
}

function resolveEpistemicStatus({
  currentValue,
  initialValue,
  epistemicState,
  confirmPrefillsOnSubmit,
}: {
  currentValue: string;
  initialValue: string;
  epistemicState: RuntimeBlock0EpistemicState | undefined;
  confirmPrefillsOnSubmit: boolean;
}): RuntimeEpistemicStatus {
  const hasCurrentValue = currentValue.length > 0;
  const hasInitialValue = initialValue.length > 0;

  if (hasInitialValue && currentValue !== initialValue) {
    return "user_corrected_evidence";
  }

  if (hasInitialValue && confirmPrefillsOnSubmit) {
    return "user_confirmed_suggestion";
  }

  if (!hasInitialValue && hasCurrentValue) {
    return "captured_user_evidence";
  }

  return mapBaseEpistemicState(epistemicState);
}

function resolveProvenanceType(
  epistemicStatus: RuntimeEpistemicStatus,
): RuntimeBlock0ResponseProvenanceType {
  if (epistemicStatus === "user_confirmed_suggestion") {
    return "user_confirmed";
  }
  if (epistemicStatus === "user_corrected_evidence") {
    return "user_corrected";
  }
  if (epistemicStatus === "captured_user_evidence") {
    return "user_answer";
  }
  if (
    epistemicStatus === "inferred_from_workmap" ||
    epistemicStatus === "context_from_workmap"
  ) {
    return "workmap_prefill";
  }
  return "system_internal";
}

function getFieldsForQuestion(
  question: RuntimeBlock0CanonicalQuestion,
): RuntimeBlock0ResponseField[] {
  if (question.id === "B0-Q04") {
    return B0_Q04_BOUNDARY_FIELDS;
  }

  if (question.responseKind === "compound" && question.subfields) {
    return question.subfields.map((subfield: RuntimeBlock0Subfield) => ({
      runtimeInteractionId: question.id,
      subfieldName: subfield.id,
      answerKey: buildBlock0AnswerKey(question.id, subfield.id),
      canonicalVariable: subfield.canonicalVariable,
      epistemicState: subfield.epistemicState,
    }));
  }

  return [
    {
      runtimeInteractionId: question.id,
      subfieldName: "single_answer",
      answerKey: buildBlock0AnswerKey(question.id),
      canonicalVariable: question.canonicalVariableList[0],
      epistemicState: question.epistemicState,
    },
  ];
}

function buildSubfieldResponse({
  field,
  input,
}: {
  field: RuntimeBlock0ResponseField;
  input: RuntimeBlock0ResponseBundleInput;
}): RuntimeBlock0SubfieldResponse {
  const value = normalizeValue(input.answers[field.answerKey]);
  const initialValue = normalizeValue(input.initialAnswers?.[field.answerKey]);
  const epistemicStatus = resolveEpistemicStatus({
    currentValue: value,
    initialValue,
    epistemicState: field.epistemicState,
    confirmPrefillsOnSubmit: input.confirmPrefillsOnSubmit ?? true,
  });
  const response: RuntimeBlock0SubfieldResponse = {
    runtimeInteractionId: field.runtimeInteractionId,
    subfieldName: field.subfieldName,
    value,
    epistemicStatus,
    provenanceType: resolveProvenanceType(epistemicStatus),
    sourceRuntimeInteractionId: field.runtimeInteractionId,
  };

  if (field.canonicalVariable) {
    response.sourceCanonicalVariable = field.canonicalVariable;
  }
  if (initialValue) {
    response.sourceWorkMapPath = `initialVisualDraft.${field.answerKey}`;
  }

  return response;
}

function hasRequiredMinimumAnswers(answers: Record<string, string>): boolean {
  return Object.values(REQUIRED_MINIMUM_FIELDS_BY_INTERACTION).every((keys) =>
    keys.every((key) => normalizeValue(answers[key]).length > 0),
  );
}

export function buildRuntimeBlock0ResponseBundle(
  input: RuntimeBlock0ResponseBundleInput,
): RuntimeBlock0ResponseBundle {
  const responses: RuntimeBlock0InteractionResponse[] =
    RUNTIME_BLOCK0_CANONICAL_QUESTIONS.map((question) => {
      const subfieldResponses = getFieldsForQuestion(question).map((field) =>
        buildSubfieldResponse({ field, input }),
      );

      return {
        runtimeInteractionId: question.id,
        sourceRuntimeInteractionId: question.sourceRuntimeInteractionId,
        responseKind:
          subfieldResponses.length > 1 ? "compound_subfields" : "single_answer",
        canonicalVariables: question.canonicalVariableList,
        subfieldResponses,
      };
    });

  return {
    version: "RUNTIME_BLOCK0_RESPONSE_R1",
    activityId: input.activityId,
    activityLabel: input.activityLabel,
    source: "significado_ui",
    responses,
    evidenceReadyForRuntime: hasRequiredMinimumAnswers(input.answers),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
