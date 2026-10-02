const YES_EXCEPTION_VALUES = new Set(["rare_yes", "regular_yes", "frequent_yes"]);
const NO_EXCEPTION_VALUES = new Set(["no"]);

const OPERATIONAL_FEEDBACK_PATTERN =
  /(avisa|avisar|rechaz|devol|corrig|correccion|cambio|recontact|actualiz|bloque|escal|senal|error|incomplet|duplicad|tarde|retras|no coincide|mismatch)/i;
const NO_FEEDBACK_PATTERN =
  /\b(nadie avisa|no se detecta|no hay senal visible|no hay señal visible|receptor no responde|nadie responde)\b/i;
const SATISFACTION_ONLY_PATTERN =
  /\b(satisfech|insatisfech|conforme|inconforme|content|molest|aceptacion|aceptación)\b/i;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

export function deriveTransformationExceptionExists(transformationExceptionType) {
  if (YES_EXCEPTION_VALUES.has(transformationExceptionType)) {
    return {
      canonical_variable: "transformation_exception_exists",
      value: true,
      source_variable: "transformation_exception_type",
      source_question_codes: ["2.9"],
      flags: [],
    };
  }

  if (NO_EXCEPTION_VALUES.has(transformationExceptionType)) {
    return {
      canonical_variable: "transformation_exception_exists",
      value: false,
      source_variable: "transformation_exception_type",
      source_question_codes: ["2.9"],
      flags: [],
    };
  }

  return {
    canonical_variable: "transformation_exception_exists",
    value: "unresolved",
    source_variable: "transformation_exception_type",
    source_question_codes: ["2.9"],
    flags: ["transformation_exception_route_unresolved"],
  };
}

export function isTransformationExceptionDescriptionVisible(transformationExceptionType) {
  return deriveTransformationExceptionExists(transformationExceptionType).value === true;
}

export function deriveDeliveryExceptionExists(deliveryExceptionSignal) {
  if (YES_EXCEPTION_VALUES.has(deliveryExceptionSignal)) return true;
  if (NO_EXCEPTION_VALUES.has(deliveryExceptionSignal)) return false;
  return "unresolved";
}

export function deriveReceiverFeedbackExists({
  deliveryExceptionSignal,
  receiverFeedback,
  receiverSatisfaction,
} = {}) {
  const deliveryExceptionExists = deriveDeliveryExceptionExists(deliveryExceptionSignal);
  const flags = [];

  if (!isBlank(receiverFeedback)) {
    const feedbackText = String(receiverFeedback);
    if (NO_FEEDBACK_PATTERN.test(feedbackText)) {
      return {
        canonical_variable: "receiver_feedback_exists",
        value: false,
        source_variable: "receiver_feedback",
        source_question_codes: ["3.13a"],
        flags,
      };
    }
    if (OPERATIONAL_FEEDBACK_PATTERN.test(feedbackText)) {
      return {
        canonical_variable: "receiver_feedback_exists",
        value: true,
        source_variable: "receiver_feedback",
        source_question_codes: ["3.13a"],
        flags,
      };
    }
  }

  if (deliveryExceptionExists === true) {
    if (!isBlank(receiverSatisfaction) && OPERATIONAL_FEEDBACK_PATTERN.test(String(receiverSatisfaction))) {
      flags.push("receiver_feedback_route_missing");
    } else {
      flags.push("receiver_feedback_gap_flag");
    }

    return {
      canonical_variable: "receiver_feedback_exists",
      value: "unresolved",
      source_variable: "receiver_feedback",
      source_question_codes: ["3.13a", "3.D"],
      flags,
    };
  }

  return {
    canonical_variable: "receiver_feedback_exists",
    value: false,
    source_variable: "receiver_feedback",
    source_question_codes: ["3.13a"],
    flags,
  };
}

export function shouldShowReceiverFeedbackClarification({
  deliveryExceptionSignal,
  receiverFeedback,
  receiverSatisfaction,
} = {}) {
  const derivation = deriveReceiverFeedbackExists({
    deliveryExceptionSignal,
    receiverFeedback,
    receiverSatisfaction,
  });
  return derivation.flags.includes("receiver_feedback_gap_flag");
}

export function buildInstrumentationEvidenceSections({
  transformationExceptionType,
  transformationExceptionDescription,
  deliveryExceptionSignal,
  receiverSatisfaction,
  receiverFeedback,
} = {}) {
  const transformation = deriveTransformationExceptionExists(transformationExceptionType);
  const feedback = deriveReceiverFeedbackExists({
    deliveryExceptionSignal,
    receiverFeedback,
    receiverSatisfaction,
  });

  const transformation_evidence = {
    transformation_exception_type: transformationExceptionType,
    transformation_exception_exists: transformation.value,
  };
  if (!isBlank(transformationExceptionDescription)) {
    transformation_evidence.transformation_exception_description = transformationExceptionDescription;
  }
  for (const flag of transformation.flags) transformation_evidence[flag] = true;
  if (transformation.value === true && isBlank(transformationExceptionDescription)) {
    transformation_evidence.transformation_exception_needs_clarification = true;
  }

  const handoff_evidence = {
    receiver_satisfaction: receiverSatisfaction,
    receiver_feedback_exists: feedback.value,
  };
  if (!isBlank(receiverFeedback)) handoff_evidence.receiver_feedback = receiverFeedback;
  for (const flag of feedback.flags) handoff_evidence[flag] = true;

  const flow_evidence = {};
  if (feedback.value === true) {
    flow_evidence.receiver_feedback = receiverFeedback;
  }

  return {
    scene_block_derivations: [transformation, feedback],
    scene_consistency_flags: [...transformation.flags, ...feedback.flags],
    scene_canonical_record: {
      transformation_exception_type: transformationExceptionType,
      transformation_exception_exists: transformation.value,
      transformation_exception_description: transformationExceptionDescription,
      receiver_satisfaction: receiverSatisfaction,
      receiver_feedback_exists: feedback.value,
      receiver_feedback: receiverFeedback,
    },
    evidence_bundle_for_transduction: {
      transformation_evidence,
      handoff_evidence,
      flow_evidence,
    },
  };
}
