export type AuditAndGovernanceShadowMode = "audit_and_governance_shadow";

export type AuditAndGovernanceQueryType =
  | "resolve_audit_trail_state"
  | "resolve_governance_rule_state"
  | "resolve_system_state_evidence"
  | "resolve_source_alias"
  | "resolve_source_role"
  | "validate_record_rule_source_qa"
  | "validate_source_proof_satisfaction"
  | "validate_system_state_evidence"
  | "validate_internal_claim_boundary"
  | "validate_no_circular_certification"
  | "validate_d8_contextual_resolution"
  | "validate_no_cableado"
  | "validate_brain_connection_preconditions"
  | "detect_governance_gap"
  | "detect_alias_gap"
  | "detect_unresolved_system_state"
  | "detect_brain_connection_blocker"
  | "summarize_governance_readiness";

export type AuditAndGovernanceReadinessState =
  | "audit_lookup_ready"
  | "audit_lookup_not_found"
  | "governance_rule_valid"
  | "governance_rule_missing_source"
  | "system_state_evidence_valid"
  | "system_state_evidence_missing"
  | "source_alias_resolved"
  | "source_alias_missing"
  | "source_role_valid"
  | "source_role_mismatch"
  | "record_rule_source_qa_satisfactory"
  | "record_rule_source_qa_broken"
  | "source_proof_satisfactory"
  | "source_proof_missing"
  | "internal_claim_boundary_confirmed"
  | "internal_claim_boundary_broken"
  | "circular_certification_prevented"
  | "circular_certification_detected"
  | "d8_contextual_resolved"
  | "d8_contextual_unresolved"
  | "no_cableado_confirmed"
  | "no_cableado_violation"
  | "brain_connection_preconditions_met"
  | "brain_connection_preconditions_blocked"
  | "governance_readiness_ready"
  | "governance_readiness_with_controls"
  | "manual_review_required"
  | "reentry_required";

export type AuditAndGovernanceEvaluationInput = {
  mode: AuditAndGovernanceShadowMode;
  queryType: AuditAndGovernanceQueryType;
  targetUnitId?: string;
  moduleId?: string;
  ruleId?: string;
  sourceId?: string;
  aliasId?: string;
  systemStateEvidenceId?: string;
  claimId?: string;
  controlId?: string;
  requestedOutputType?: string;
  context?: Record<string, unknown>;
};

export type AuditAndGovernanceSafetyFlags = {
  canBlockProductiveUserFlow: boolean;
  canModifyGovernanceState: boolean;
  canWriteRegistry: boolean;
  canTriggerExport: boolean;
  canTriggerParallelProduction: boolean;
  canTriggerRuntime: boolean;
  canTriggerDiagnosis: boolean;
  canExecuteSql: boolean;
  canWriteSupabase: boolean;
  canConnectEveBrain: boolean;
  runtimeAuthority: boolean;
};

export type AuditAndGovernanceDocumentarySatisfaction = {
  status: "satisfactory" | "unsatisfactory";
  targetUnitsChecked: number;
  targetUnitsExpected: number;
  modulesChecked: number;
  modulesExpected: number;
  atomicRulesChecked: number;
  atomicRulesExpected: number;
  sourceToTargetRowsChecked: number;
  sourceToTargetRowsExpected: number;
  sourceProofRowsChecked: number;
  sourceProofRowsExpected: number;
  systemStateEvidenceRowsChecked: number;
  systemStateEvidenceRowsExpected: number;
  packageDeclaredMappingsChecked: number;
  packageDeclaredMappingsExpected: number;
  materialComparisonRowsChecked: number;
  materialComparisonRowsExpected: number;
  accepted: number;
  rejected: number;
  pendingSourceProof: number;
  pendingLocatorPrecision: number;
  internalClaimUnverified: number;
  certificationClaimUnverified: number;
  d8ContextualGap: number;
  aliasesResolved: number;
  aliasesExpected: number;
  noCableadoViolation: number;
  materialDifference: boolean;
};

export type AuditAndGovernanceBrainConnectionPreconditions = {
  brainConnectionPreconditionsMet: boolean;
  missingPreconditions: string[];
  blockedBy: string[];
  explicitBrainWiringAuthorization: boolean;
  registryWriteContractReady: boolean;
  rollbackPlanReady: boolean;
  noCableadoReleaseGateReady: boolean;
  humanApprovalReady: boolean;
};

export type AuditAndGovernanceResolvedEntity = {
  entityKind: string;
  id: string;
  moduleId?: string;
  ruleId?: string;
  sourceId?: string;
  aliasId?: string;
  systemStateEvidenceId?: string;
  claimId?: string;
  controlId?: string;
  sourceTrace?: string[];
  evidenceRefs?: string[];
  notes?: string[];
};

export type AuditAndGovernanceEvaluationResult = {
  version: string;
  mode: AuditAndGovernanceShadowMode;
  chipId: string;
  queryType: AuditAndGovernanceQueryType;
  readinessState: AuditAndGovernanceReadinessState;
  resolved: boolean;
  resolvedEntity: AuditAndGovernanceResolvedEntity | null;
  missingReferences: string[];
  gapFlags: string[];
  sourceTrace: string[];
  evidenceRefs: string[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: string[];
  auditEvents: string[];
  safetyFlags: AuditAndGovernanceSafetyFlags;
  documentarySatisfaction: AuditAndGovernanceDocumentarySatisfaction;
  governanceEvaluation: {
    evaluatedAsShadowOnly: boolean;
    noCableadoConfirmed: boolean;
    internalClaimBoundaryConfirmed: boolean;
    circularCertificationPrevented: boolean;
    d8ContextualOnly: boolean;
  };
  brainConnectionPreconditions: AuditAndGovernanceBrainConnectionPreconditions;
};

export type AuditAndGovernanceFixture = {
  fixtureId: string;
  input: AuditAndGovernanceEvaluationInput;
  expectedReadinessState: AuditAndGovernanceReadinessState;
  expectedResolved: boolean;
  expectedEntityKind: string;
  expectedGapFlags: string[];
  expectedBlockedActions: string[];
};
