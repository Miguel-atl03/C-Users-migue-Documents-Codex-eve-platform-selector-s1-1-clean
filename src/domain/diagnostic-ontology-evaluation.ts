export type DiagnosticOntologyMode = "diagnostic_ontology_shadow";

export type DiagnosticOntologyReadinessState =
  | "diagnostic_preclassification_candidate"
  | "blocked_by_conformance_unchecked"
  | "blocked_by_consistency_unchecked"
  | "blocked_by_missing_evidence"
  | "blocked_by_semantic_ambiguity"
  | "manual_review_required"
  | "reentry_required";

export type DiagnosticOntologyModel = "PM" | "MoC" | "PF" | "OLC";

export type DiagnosticOntologySourceId =
  | "D1"
  | "D2"
  | "D4"
  | "D5"
  | "EVE-00"
  | "EVE-01";

export type DiagnosticOntologyCompartmentId =
  | "EVE02-CMP-001"
  | "EVE02-CMP-002"
  | "EVE02-CMP-003"
  | "EVE02-CMP-004"
  | "EVE02-CMP-005"
  | "EVE02-CMP-006"
  | "EVE02-CMP-007"
  | "EVE02-CMP-008"
  | "EVE02-CMP-009"
  | "EVE02-CMP-010"
  | "EVE02-CMP-011"
  | "EVE02-CMP-012"
  | "EVE02-CMP-013";

export type DiagnosticOntologySourceTrace = {
  sourceId: DiagnosticOntologySourceId;
  ruleId?: string;
  locator: string;
  authorityDomain: string;
};

export type DiagnosticOntologyEvidenceRef = {
  evidenceRefId: string;
  kind:
    | "model_element"
    | "gate_output"
    | "structural_candidate"
    | "method_kernel_result"
    | "runtime_evidence";
  sourceTrace: DiagnosticOntologySourceTrace[];
};

export type DiagnosticOntologyConformanceStatus =
  | "validated_by_EVE_00"
  | "unchecked"
  | "failed"
  | "unknown";

export type DiagnosticOntologyConsistencyStatus =
  | "validated_by_EVE_00"
  | "unchecked"
  | "failed"
  | "unknown";

export type DiagnosticOntologyGateStatus =
  | "closed"
  | "open"
  | "not_applicable"
  | "unknown";

export type DiagnosticOntologyConfidenceContext = {
  confidence: "high" | "medium" | "low" | "unknown";
  multipleCompartments?: boolean;
  evidenceStrength?: "strong" | "moderate" | "weak" | "unknown";
};

export type DiagnosticOntologyEvaluationInput = {
  mode: "diagnostic_ontology_shadow";
  inconsistency_compartment: DiagnosticOntologyCompartmentId | string;
  involved_models: DiagnosticOntologyModel[];
  conformance_status: DiagnosticOntologyConformanceStatus;
  consistency_status: DiagnosticOntologyConsistencyStatus;
  evidence_refs: DiagnosticOntologyEvidenceRef[];
  source_trace: DiagnosticOntologySourceTrace[];
  methodKernelResult?: unknown;
  agentConstitutionDecision?: unknown;
  semanticGateStatus?: DiagnosticOntologyGateStatus;
  processStateTimerGateStatus?: DiagnosticOntologyGateStatus;
  requestedOutputType?: string;
  confidenceContext?: DiagnosticOntologyConfidenceContext;
};

export type DiagnosticOntologyFinding = {
  findingId: string;
  ruleId: string;
  severity: "info" | "warning" | "blocker";
  state: DiagnosticOntologyReadinessState;
  message: string;
  sourceTrace: DiagnosticOntologySourceTrace[];
};

export type DiagnosticOntologyAuditEvent = {
  eventId: string;
  eventType:
    | "diagnostic_ontology_shadow_evaluated"
    | "diagnostic_ontology_input_rejected"
    | "diagnostic_ontology_compartment_mapped"
    | "diagnostic_ontology_conformance_unchecked"
    | "diagnostic_ontology_consistency_unchecked"
    | "diagnostic_ontology_missing_evidence"
    | "diagnostic_ontology_semantic_ambiguity"
    | "diagnostic_ontology_final_diagnosis_blocked"
    | "diagnostic_ontology_manual_review_required";
  message: string;
  sourceTrace: DiagnosticOntologySourceTrace[];
};

export type DiagnosticOntologySafetyFlags = {
  canBlockUserFlow: false;
  canModifyPayload: false;
  canWriteRegistry: false;
  canTriggerFinalDiagnosis: false;
  canTriggerIR: false;
  canTriggerExport: false;
  canTriggerProduction: false;
  runtimeAuthority: false;
};

export type DiagnosticOntologyEvaluationResult = {
  version: "EVE_02_DIAGNOSTIC_ONTOLOGY_SHADOW_V1";
  mode: "diagnostic_ontology_shadow";
  chipId: "EVE-02-DIAGNOSTIC-ONTOLOGY";
  readinessState: DiagnosticOntologyReadinessState;
  candidateId: string | null;
  compartmentId: DiagnosticOntologyCompartmentId | null;
  pathologyCandidate: string | null;
  canonicalPathology: string | null;
  aliases: string[];
  diagnosticQuestion: string | null;
  methodTrace: {
    involved_models: DiagnosticOntologyModel[];
    conformance_status: DiagnosticOntologyConformanceStatus;
    consistency_status: DiagnosticOntologyConsistencyStatus;
    inconsistency_compartment: string;
  };
  pathologyTrace: {
    source: "D2" | null;
    compartmentId: DiagnosticOntologyCompartmentId | null;
    pathology: string | null;
    diagnosticQuestion: string | null;
  };
  evidenceRefs: DiagnosticOntologyEvidenceRef[];
  sourceTrace: DiagnosticOntologySourceTrace[];
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  findings: DiagnosticOntologyFinding[];
  auditEvents: DiagnosticOntologyAuditEvent[];
  safetyFlags: DiagnosticOntologySafetyFlags;
};
