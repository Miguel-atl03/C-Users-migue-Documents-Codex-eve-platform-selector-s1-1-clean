export type MethodKernelEvaluationMode = "shadow";

export type MethodKernelReadinessState =
  | "ready"
  | "ready_with_flags"
  | "blocked_by_missing_evidence"
  | "blocked_by_contradiction"
  | "manual_review_required"
  | "reentry_required";

export type MethodKernelCandidateModel = "PM" | "MoC" | "PF" | "OLC";

export type MethodKernelEvidenceStatus =
  | "captured_user_evidence"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "canonical_derivation"
  | "internal_calculated"
  | "inferred_from_workmap"
  | "context_from_workmap";

export type MethodKernelSourceRef = {
  sourceId: string;
  locator: string;
};

export type MethodKernelEvidenceItem = {
  evidenceItemId: string;
  value: string;
  epistemicStatus: MethodKernelEvidenceStatus;
  sourceRefs: MethodKernelSourceRef[];
};

export type MethodKernelStructuralCandidate = {
  candidateId: string;
  model: MethodKernelCandidateModel;
  label: string;
  evidenceItemIds: string[];
  sourceRefs: MethodKernelSourceRef[];
};

export type MethodKernelEvaluationInput = {
  mode: "shadow";
  candidates: MethodKernelStructuralCandidate[];
  evidenceItems: MethodKernelEvidenceItem[];
};

export type MethodKernelFinding = {
  findingId: string;
  ruleId: string;
  severity: "info" | "warning" | "blocker";
  state: MethodKernelReadinessState;
  message: string;
  candidateIds: string[];
  evidenceItemIds: string[];
  sourceRefs: MethodKernelSourceRef[];
};

export type MethodKernelAuditEvent = {
  eventId: string;
  eventType:
    | "method_kernel_shadow_evaluated"
    | "method_kernel_missing_evidence_detected"
    | "method_kernel_contradiction_detected"
    | "method_kernel_input_rejected";
  message: string;
  sourceRefs: MethodKernelSourceRef[];
};

export type MethodKernelEvaluationResult = {
  version: "EVE_00_METHOD_KERNEL_SHADOW_V1";
  mode: "shadow";
  readinessState: MethodKernelReadinessState;
  findings: MethodKernelFinding[];
  auditEvents: MethodKernelAuditEvent[];
  canBlockUserFlow: false;
  canModifyPayload: false;
  canWriteRegistry: false;
  canTriggerDiagnosis: false;
  runtimeAuthority: false;
};

