export type RuntimeEpistemicStatus =
  | "captured_user_evidence"
  | "inferred_from_workmap"
  | "context_from_workmap"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "canonical_derivation"
  | "internal_calculated";

export type RuntimeBlock0ResponseProvenanceType =
  | "workmap_prefill"
  | "user_confirmed"
  | "user_corrected"
  | "user_answer"
  | "system_internal";

export type RuntimeBlock0SubfieldResponse = {
  runtimeInteractionId: string;
  subfieldName: string;
  value: string;
  epistemicStatus: RuntimeEpistemicStatus;
  provenanceType: RuntimeBlock0ResponseProvenanceType;
  sourceRuntimeInteractionId: string;
  sourceCanonicalVariable?: string;
  sourceWorkMapPath?: string;
};

export type RuntimeBlock0InteractionResponse = {
  runtimeInteractionId: string;
  sourceRuntimeInteractionId: string;
  responseKind: "single_answer" | "compound_subfields";
  canonicalVariables: string[];
  subfieldResponses: RuntimeBlock0SubfieldResponse[];
};

export type RuntimeBlock0ResponseBundle = {
  version: "RUNTIME_BLOCK0_RESPONSE_R1";
  activityId: string;
  activityLabel: string;
  source: "significado_ui";
  responses: RuntimeBlock0InteractionResponse[];
  evidenceReadyForRuntime: boolean;
  createdAt: string;
};
