import type { MethodKernelEvaluationInput } from "@/domain/method-kernel-evaluation";

const d1SourceRef = {
  sourceId: "D1:FBA",
  locator: "fixture:method-kernel-shadow",
};

export const completeMethodKernelFixture = {
  mode: "shadow",
  evidenceItems: [
    {
      evidenceItemId: "ev-pm-complete",
      value: "Process has triggering event, target state and support relation.",
      epistemicStatus: "captured_user_evidence",
      sourceRefs: [d1SourceRef],
    },
    {
      evidenceItemId: "ev-moc-complete",
      value: "Business object, class role and attributes are traceable.",
      epistemicStatus: "user_confirmed_suggestion",
      sourceRefs: [d1SourceRef],
    },
    {
      evidenceItemId: "ev-pf-complete",
      value: "Task flow has event, activity and resulting object state.",
      epistemicStatus: "user_corrected_evidence",
      sourceRefs: [d1SourceRef],
    },
    {
      evidenceItemId: "ev-olc-complete",
      value: "Object lifecycle has state transition, reason and operation.",
      epistemicStatus: "canonical_derivation",
      sourceRefs: [d1SourceRef],
    },
  ],
  candidates: [
    {
      candidateId: "pm-complete",
      model: "PM",
      label: "PM complete candidate",
      evidenceItemIds: ["ev-pm-complete"],
      sourceRefs: [d1SourceRef],
    },
    {
      candidateId: "moc-complete",
      model: "MoC",
      label: "MoC complete candidate",
      evidenceItemIds: ["ev-moc-complete"],
      sourceRefs: [d1SourceRef],
    },
    {
      candidateId: "pf-complete",
      model: "PF",
      label: "PF complete candidate",
      evidenceItemIds: ["ev-pf-complete"],
      sourceRefs: [d1SourceRef],
    },
    {
      candidateId: "olc-complete",
      model: "OLC",
      label: "OLC complete candidate",
      evidenceItemIds: ["ev-olc-complete"],
      sourceRefs: [d1SourceRef],
    },
  ],
} satisfies MethodKernelEvaluationInput;

export const partialMethodKernelFixture = {
  mode: "shadow",
  evidenceItems: [
    {
      evidenceItemId: "ev-pm-partial",
      value: "Partial PM evidence with trigger and target state.",
      epistemicStatus: "captured_user_evidence",
      sourceRefs: [d1SourceRef],
    },
    {
      evidenceItemId: "ev-pf-partial",
      value: "Partial PF evidence with task and resulting state.",
      epistemicStatus: "canonical_derivation",
      sourceRefs: [d1SourceRef],
    },
  ],
  candidates: [
    {
      candidateId: "pm-partial",
      model: "PM",
      label: "PM partial candidate",
      evidenceItemIds: ["ev-pm-partial"],
      sourceRefs: [d1SourceRef],
    },
    {
      candidateId: "pf-partial",
      model: "PF",
      label: "PF partial candidate",
      evidenceItemIds: ["ev-pf-partial"],
      sourceRefs: [d1SourceRef],
    },
  ],
} satisfies MethodKernelEvaluationInput;

export const missingEvidenceMethodKernelFixture = {
  mode: "shadow",
  evidenceItems: [
    {
      evidenceItemId: "ev-missing-case",
      value: "Candidate exists but the referenced evidence id is absent.",
      epistemicStatus: "captured_user_evidence",
      sourceRefs: [d1SourceRef],
    },
  ],
  candidates: [
    {
      candidateId: "pm-missing-source",
      model: "PM",
      label: "PM missing source refs candidate",
      evidenceItemIds: ["ev-does-not-exist"],
      sourceRefs: [],
    },
  ],
} satisfies MethodKernelEvaluationInput;

export const METHOD_KERNEL_SHADOW_FIXTURES = [
  {
    id: "complete",
    label: "Caso completo válido",
    expectedReadinessState: "ready",
    input: completeMethodKernelFixture,
  },
  {
    id: "partial",
    label: "Caso parcial",
    expectedReadinessState: "ready_with_flags",
    input: partialMethodKernelFixture,
  },
  {
    id: "missing_evidence",
    label: "Caso evidencia insuficiente",
    expectedReadinessState: "blocked_by_missing_evidence",
    input: missingEvidenceMethodKernelFixture,
  },
] as const;

export type MethodKernelShadowFixtureId =
  (typeof METHOD_KERNEL_SHADOW_FIXTURES)[number]["id"];

