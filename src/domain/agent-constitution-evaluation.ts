export type AgentConstitutionMode = "constitutional_shadow";

export type AgentConstitutionReadinessState =
  | "capture_allowed"
  | "clarification_required"
  | "blocked_by_scope"
  | "blocked_by_missing_evidence"
  | "blocked_by_missing_canonical_route"
  | "blocked_by_contradiction"
  | "manual_review_required"
  | "ready_for_structural_candidate"
  | "ready_for_diagnostic_preclassification"
  | "ready_for_parallel_preview"
  | "export_blocked"
  | "audit_required";

export type AgentConstitutionSourceId = "D1" | "D2" | "D3" | "D4" | "D5";

export type AgentConstitutionProvenanceType =
  | "captured_user_evidence"
  | "ai_inferred_unconfirmed"
  | "user_confirmed_suggestion"
  | "user_corrected_evidence"
  | "canonical_derivation"
  | "internal_calculated";

export type AgentConstitutionSourceTrace = {
  sourceId: AgentConstitutionSourceId;
  ruleId?: string;
  locator: string;
  authorityDomain: string;
};

export type AgentConstitutionEvidenceItem = {
  evidenceItemId: string;
  value: unknown;
  provenanceType: AgentConstitutionProvenanceType;
  sourceRefs: AgentConstitutionSourceTrace[];
  revision: number;
  epistemicStatus: string;
};

export type AgentConstitutionEvaluationInput = {
  mode: "constitutional_shadow";
  requestedAction: string;
  inputClassification: string;
  evidenceItems: AgentConstitutionEvidenceItem[];
  sourceTrace: AgentConstitutionSourceTrace[];
  methodKernelResult?: unknown;
  runtimeContext?: unknown;
  actorContext?: unknown;
  targetBoundary?: string;
  requestedOutputType?: string;
};

export type AgentConstitutionFinding = {
  findingId: string;
  ruleId: string;
  severity: "info" | "warning" | "blocker";
  state: AgentConstitutionReadinessState;
  message: string;
  sourceTrace: AgentConstitutionSourceTrace[];
};

export type AgentConstitutionAuditEvent = {
  eventId: string;
  eventType:
    | "agent_constitution_shadow_evaluated"
    | "agent_constitution_input_rejected"
    | "agent_constitution_scope_blocked"
    | "agent_constitution_missing_evidence"
    | "agent_constitution_diagnostic_preclassification_prepared"
    | "agent_constitution_export_blocked"
    | "agent_constitution_audit_required";
  message: string;
  sourceTrace: AgentConstitutionSourceTrace[];
};

export type AgentConstitutionSafetyFlags = {
  canBlockUserFlow: false;
  canModifyPayload: false;
  canWriteRegistry: false;
  canTriggerFinalDiagnosis: false;
  canTriggerProduction: false;
  runtimeAuthority: false;
};

export type AgentConstitutionEvaluationResult = {
  version: "EVE_01_AGENT_CONSTITUTION_SHADOW_V1";
  mode: "constitutional_shadow";
  chipId: "EVE-01-AGENT-CONSTITUTION";
  readinessState: AgentConstitutionReadinessState;
  decisionId: string;
  ruleIds: string[];
  sourceTrace: AgentConstitutionSourceTrace[];
  inputClassification: string;
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  auditRequired: boolean;
  nextChipOrService: string | null;
  findings: AgentConstitutionFinding[];
  auditEvents: AgentConstitutionAuditEvent[];
  safetyFlags: AgentConstitutionSafetyFlags;
};
