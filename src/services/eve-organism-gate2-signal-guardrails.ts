import type {
  EveGate2AdmissibilityStatus,
  EveGate2EvidenceFieldRegistryEntry,
  EveGate2EvidenceStatus,
  EveGate2NoGoCode,
  EveGate2NoGoRule,
  EveGate2ObservationMode,
  EveGate2Priority,
  EveGate2PromotionChecklistItem,
  EveGate2PromotionEvaluation,
  EveGate2ProofType,
  EveGate2RuntimeContractConfig,
  EveGate2SignalCandidate,
  EveGate2TriggeredNoGo,
  EveGate2ValidationResult,
  Gate2GuardrailAuthority,
  Gate2PromotionChecklistResult,
  Gate2RuntimeSignalContract,
  Gate2SignalInput,
  Gate2ValidationResult,
} from "../types/eve-organism-gate2-signal-guardrails.ts";

export const EVE_GATE2_SIGNAL_GUARDRAILS_VERSION = "1.0.0";

const ACCEPTABLE_PROOF_TYPES: readonly EveGate2ProofType[] = [
  "product_artifact_with_locator",
  "audit_log_with_timestamp",
  "runtime_inventory_readonly",
  "versioned_configuration",
  "source_trace_record",
  "security_policy_or_rls_policy_with_locator",
  "manual_review_record_with_owner",
];

const REJECTED_PROOF_TYPES: readonly EveGate2ProofType[] = [
  "fixture",
  "synthetic_field",
  "test_only_payload",
  "replay_only_output",
  "verbal_confirmation_without_artifact",
];

export const EVE_GATE2_RUNTIME_SIGNAL_CONTRACT_CONFIG: EveGate2RuntimeContractConfig = {
  contractVersion: "GATE2_REAL_OBSERVABLE_SIGNAL_RUNTIME_CONTRACT_V1",
  allowedObservationModes: ["replay_only", "offline_fixture", "future_real_observable_candidate"],
  forbiddenObservationModes: [
    "production_observer_active",
    "mutating_observer",
    "diagnostic_observer",
    "autonomous_observer",
  ],
  requiredSignalSections: [
    "identity",
    "operational_context",
    "mba_anchor",
    "traceability",
    "no_mutation_boundary",
    "security_boundary",
    "b3_b7_boundary",
    "admissibility",
  ],
  requiredMBAAnchorFields: [
    "pmProcessId",
    "pfEvent",
    "objectState",
    "mocClass",
    "mocOperation",
    "olcTransitionEvent",
    "pfTimerIfWaiting",
  ],
  requiredEvidenceFields: [
    "provenance",
    "sourceTrace",
    "sourceRef",
    "evidenceRef",
    "routeRef_if_B3",
    "idempotencyKey",
    "correlationId",
    "officialFlowRef",
    "auditRef",
  ],
  requiredNoMutationFields: [
    "uiTouchAllowed",
    "workMapMutationAllowed",
    "significadoMutationAllowed",
    "dbWriteAllowed",
    "supabaseWriteAllowed",
    "runtimeMutationAllowed",
    "registryWriteAllowed",
    "exportAllowed",
    "diagnosisAllowed",
  ],
  requiredSecurityFields: [
    "authBoundaryRequired",
    "tenantIsolationRequired",
    "rlsReadBoundaryRequiredIfDB",
    "serviceRoleAllowed",
    "secretsAllowed",
    "tokenExposureAllowed",
  ],
  requiredB3B7Fields: [
    "receiverSatisfactionAllowedAsFeedback",
    "receiverFeedbackRequiresRouteRef",
    "b7DiagnosticUseAllowed",
    "b7StructuralFactAllowed",
    "b3b7AlignmentDeltaRequiredWhenApplicable",
  ],
  admissibilityStatuses: [
    "PASS_REPLAY_ONLY",
    "BLOCKED_MISSING_CONTEXT",
    "BLOCKED_MISSING_TRACEABILITY",
    "BLOCKED_MISSING_MBA_ANCHOR",
    "BLOCKED_MUTATION_RISK",
    "BLOCKED_SECURITY_BOUNDARY",
    "BLOCKED_B3_B7_VIOLATION",
    "BLOCKED_FIXTURE_AS_REAL",
    "REQUIRES_PRODUCT_OWNER_EVIDENCE",
    "REQUIRES_FUTURE_READ_ONLY_INVENTORY",
  ],
  forbiddenAdmissibilityStatuses: ["OBSERVER_READY", "PRODUCTION_READY", "DIAGNOSIS_READY"],
};

export const EVE_GATE2_NO_GO_RULES: readonly EveGate2NoGoRule[] = [
  rule("NG-025", "forbidden_observation_mode", "forbidden observation mode", "identity.observationMode", "critical", "BLOCKED_MUTATION_RISK", "ROB-001", "EC-14", "Use only replay_only, offline_fixture or future_real_observable_candidate."),
  rule("NG-001", "missing tenantId", "operational_context.tenantId", "P0", "BLOCKED_MISSING_CONTEXT", "ROB-002", "EC-01", "Provide real tenantId with owner, locator and timestamp/version."),
  rule("NG-002", "missing organizationId", "operational_context.organizationId", "P0", "BLOCKED_MISSING_CONTEXT", "ROB-002", "EC-02", "Provide real organizationId with owner, locator and timestamp/version."),
  rule("NG-003", "missing provenance", "traceability.provenance", "P2", "BLOCKED_MISSING_TRACEABILITY", "ROB-003", "EC-05", "Provide real provenance artifact."),
  rule("NG-004", "missing sourceTrace when required", "traceability.sourceTrace", "P2", "BLOCKED_MISSING_TRACEABILITY", "ROB-003", "EC-06", "Provide sourceTrace record with locator."),
  rule("NG-005", "missing Object[State]", "mba_anchor.objectState", "P4", "BLOCKED_MISSING_MBA_ANCHOR", "ROB-008", "EC-17", "Map signal to MBA-authorized Object[State]."),
  rule("NG-006", "Object[State] not in OLC", "mba_anchor.objectState", "P4", "BLOCKED_MISSING_MBA_ANCHOR", "ROB-008", "EC-17", "Reject invented state; use OLC-authorized state."),
  rule("NG-007", "PF event not mapped", "mba_anchor.pfEvent", "P4", "BLOCKED_MISSING_MBA_ANCHOR", "ROB-008", "EC-17", "Map PF event to MBA event contract."),
  rule("NG-008", "missing idempotencyKey", "traceability.idempotencyKey", "P3", "BLOCKED_MISSING_TRACEABILITY", "ROB-004", "EC-07", "Provide real idempotencyKey from product flow."),
  rule("NG-009", "missing correlationId", "traceability.correlationId", "P3", "BLOCKED_MISSING_TRACEABILITY", "ROB-004", "EC-07", "Provide real correlationId from product flow."),
  rule("NG-010", "missing officialFlowRef", "traceability.officialFlowRef", "P3", "BLOCKED_MISSING_TRACEABILITY", "ROB-005", "EC-08", "Provide officialFlowRef or approved equivalent."),
  rule("NG-011", "UI touch required", "no_mutation_boundary.uiTouchAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-006", "EC-09", "Prove uiTouchAllowed=false."),
  rule("NG-012", "WorkMap mutation risk", "no_mutation_boundary.workMapMutationAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-006", "EC-10", "Prove workMapMutationAllowed=false."),
  rule("NG-013", "Significado mutation risk", "no_mutation_boundary.significadoMutationAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-006", "EC-11", "Prove significadoMutationAllowed=false."),
  rule("NG-014", "DB write risk", "no_mutation_boundary.dbWriteAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-007", "EC-12", "Prove dbWriteAllowed=false."),
  rule("NG-015", "Supabase boundary not proven", "no_mutation_boundary.supabaseWriteAllowed + security_boundary.rlsReadBoundaryRequiredIfDB", "P0", "BLOCKED_SECURITY_BOUNDARY", "ROB-007", "EC-13", "Prove no Supabase write and RLS/read boundary if DB appears."),
  rule("NG-016", "runtime mutation risk", "no_mutation_boundary.runtimeMutationAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-010", "EC-14", "Prove runtimeMutationAllowed=false."),
  rule("NG-017", "registry/export/diagnosis risk", "no_mutation_boundary.registryWriteAllowed + no_mutation_boundary.exportAllowed + no_mutation_boundary.diagnosisAllowed", "P1", "BLOCKED_MUTATION_RISK", "ROB-010", "EC-15", "Prove no registry, export or diagnosis side effect."),
  rule("NG-018", "receiver_satisfaction used as feedback", "b3_b7_boundary.receiverSatisfactionAllowedAsFeedback", "P5", "BLOCKED_B3_B7_VIOLATION", "ROB-001", "EC-18", "Keep receiver_satisfaction separated from receiver_feedback."),
  rule("NG-019", "receiver_feedback without routeRef", "b3_b7_boundary.receiverFeedbackRequiresRouteRef", "P5", "BLOCKED_B3_B7_VIOLATION", "ROB-001", "EC-18", "Provide routeRef for B3 receiver_feedback."),
  rule("NG-020", "B7 used as diagnostic signal", "b3_b7_boundary.b7DiagnosticUseAllowed", "P5", "BLOCKED_B3_B7_VIOLATION", "ROB-001", "EC-18", "Keep B7 non-diagnostic."),
  rule("NG-021", "B7 used as structural fact", "b3_b7_boundary.b7StructuralFactAllowed", "P5", "BLOCKED_B3_B7_VIOLATION", "ROB-001", "EC-18", "Prevent B7 from becoming structural fact."),
  rule("NG-022", "fixture claimed as real evidence", "evidence.whyNotFixtureRequired", "P0", "BLOCKED_FIXTURE_AS_REAL", "ROB-008", "EC-17", "Replace fixture with real product artifact."),
  rule("NG-023", "synthetic field claimed as real evidence", "evidence.whyNotFixtureRequired", "P0", "BLOCKED_FIXTURE_AS_REAL", "ROB-008", "EC-17", "Replace synthetic field with real evidence."),
  rule("NG-024", "replay output claimed as real evidence", "evidence.whyNotFixtureRequired", "P0", "BLOCKED_FIXTURE_AS_REAL", "ROB-008", "EC-17", "Replace replay-only output with real evidence."),
];

export const EVE_GATE2_EVIDENCE_FIELD_REGISTRY: readonly EveGate2EvidenceFieldRegistryEntry[] = [
  registry("FLD-001", "operational_context.tenantId", "identity_context", "P0", "product_owner", "ROB-002", "EC-01"),
  registry("FLD-002", "operational_context.organizationId", "identity_context", "P0", "product_owner", "ROB-002", "EC-02"),
  registry("FLD-003", "operational_context.sessionId", "identity_context", "P0", "product_owner", "ROB-002", "EC-03"),
  registry("FLD-004", "operational_context.activityId", "identity_context", "P0", "product_owner", "ROB-002", "EC-03"),
  registry("FLD-005", "operational_context.actorId_or_userId", "identity_context", "P0", "product_owner", "ROB-002", "EC-04"),
  registry("FLD-006", "security_boundary.authBoundaryRequired", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-16"),
  registry("FLD-007", "security_boundary.tenantIsolationRequired", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-16"),
  registry("FLD-008", "security_boundary.rlsReadBoundaryRequiredIfDB", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-13"),
  registry("FLD-009", "security_boundary.serviceRoleAllowed", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-13"),
  registry("FLD-010", "security_boundary.secretsAllowed", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-13"),
  registry("FLD-011", "security_boundary.tokenExposureAllowed", "tenant_auth_isolation", "P0", "technical_inventory", "ROB-007", "EC-13"),
  registry("FLD-012", "no_mutation_boundary.uiTouchAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-006", "EC-09"),
  registry("FLD-013", "no_mutation_boundary.workMapMutationAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-006", "EC-10"),
  registry("FLD-014", "no_mutation_boundary.significadoMutationAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-006", "EC-11"),
  registry("FLD-015", "no_mutation_boundary.dbWriteAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-007", "EC-12"),
  registry("FLD-016", "no_mutation_boundary.supabaseWriteAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-007", "EC-13"),
  registry("FLD-017", "no_mutation_boundary.runtimeMutationAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-010", "EC-14"),
  registry("FLD-018", "no_mutation_boundary.registryWriteAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-010", "EC-15"),
  registry("FLD-019", "no_mutation_boundary.exportAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-010", "EC-15"),
  registry("FLD-020", "no_mutation_boundary.diagnosisAllowed", "no_mutation_boundary", "P1", "technical_inventory", "ROB-010", "EC-15"),
  registry("FLD-021", "traceability.provenance", "provenance_sourceTrace", "P2", "product_owner", "ROB-003", "EC-05"),
  registry("FLD-022", "traceability.sourceTrace", "provenance_sourceTrace", "P2", "product_owner", "ROB-003", "EC-06"),
  registry("FLD-023", "traceability.sourceRef", "provenance_sourceTrace", "P2", "product_owner", "ROB-003", "EC-05"),
  registry("FLD-024", "traceability.evidenceRef", "provenance_sourceTrace", "P2", "product_owner", "ROB-003", "EC-05"),
  registry("FLD-025", "traceability.auditRef", "provenance_sourceTrace", "P2", "audit_log", "ROB-003", "EC-05"),
  registry("FLD-026", "traceability.idempotencyKey", "idempotency_correlation", "P3", "technical_inventory", "ROB-004", "EC-07"),
  registry("FLD-027", "traceability.correlationId", "idempotency_correlation", "P3", "technical_inventory", "ROB-004", "EC-07"),
  registry("FLD-028", "traceability.officialFlowRef", "officialFlowRef", "P3", "product_owner", "ROB-005", "EC-08"),
  registry("FLD-029", "traceability.routeRef", "b3_receiver_feedback", "P3", "product_owner", "ROB-001", "EC-18"),
  registry("FLD-030", "mba_anchor.pmProcessId", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-031", "mba_anchor.pfEvent", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-032", "mba_anchor.objectState", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-033", "mba_anchor.mocClass", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-034", "mba_anchor.mocOperation", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-035", "mba_anchor.olcTransitionEvent", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-036", "mba_anchor.pfTimerIfWaiting", "mba_anchor", "P4", "manual_review", "ROB-008", "EC-17"),
  registry("FLD-037", "b3_b7_boundary.receiverSatisfactionAllowedAsFeedback", "b3_b7_boundary", "P5", "manual_review", "ROB-001", "EC-18"),
  registry("FLD-038", "b3_b7_boundary.receiverFeedbackRequiresRouteRef", "b3_b7_boundary", "P5", "manual_review", "ROB-001", "EC-18"),
  registry("FLD-039", "b3_b7_boundary.b7DiagnosticUseAllowed", "b3_b7_boundary", "P5", "manual_review", "ROB-001", "EC-18"),
  registry("FLD-040", "b3_b7_boundary.b7StructuralFactAllowed", "b3_b7_boundary", "P5", "manual_review", "ROB-001", "EC-18"),
  registry("FLD-041", "b3_b7_boundary.b3b7AlignmentDeltaRequiredWhenApplicable", "b3_b7_boundary", "P5", "manual_review", "ROB-001", "EC-18"),
];

export const EVE_GATE2_TO_GATE3_PROMOTION_CHECKLIST: readonly EveGate2PromotionChecklistItem[] = [
  checklist("G2G3-01", "all critical context fields present"),
  checklist("G2G3-02", "tenant/auth/isolation evidence present"),
  checklist("G2G3-03", "no mutation proof present"),
  checklist("G2G3-04", "provenance/sourceTrace real"),
  checklist("G2G3-05", "idempotency/correlation real"),
  checklist("G2G3-06", "officialFlowRef or approved equivalent real"),
  checklist("G2G3-07", "Object[State] MBA-authorized"),
  checklist("G2G3-08", "PF event mapped"),
  checklist("G2G3-09", "OLC transition valid"),
  checklist("G2G3-10", "B3/B7 clean"),
  checklist("G2G3-11", "no fixture/synthetic/replay claimed as real"),
  checklist("G2G3-12", "No-Go engine returns no blockers"),
  checklist("G2G3-13", "Product Owner evidence package complete"),
  checklist("G2G3-14", "future read-only inventory complete"),
  checklist("G2G3-15", "replay-only shadow comparison still clean"),
];

export function validateGate2Signal(signal: EveGate2SignalCandidate): EveGate2ValidationResult {
  const triggeredNoGos = runGate2NoGoEngine(signal);
  const statuses = uniqueStatuses(triggeredNoGos.map((noGo) => noGo.blockingResult));

  if (
    triggeredNoGos.length === 0 &&
    !signal.productOwnerEvidenceComplete
  ) {
    statuses.push("REQUIRES_PRODUCT_OWNER_EVIDENCE");
  }

  if (
    triggeredNoGos.length === 0 &&
    signal.observationMode === "future_real_observable_candidate" &&
    !signal.futureReadOnlyInventoryComplete
  ) {
    statuses.push("REQUIRES_FUTURE_READ_ONLY_INVENTORY");
  }

  if (statuses.length === 0) {
    statuses.push("PASS_REPLAY_ONLY");
  }

  return {
    signalId: signal.signalId,
    accepted: statuses.length === 1 && statuses[0] === "PASS_REPLAY_ONLY",
    status: statuses[0],
    statuses,
    triggeredNoGos,
    gate3Ready: false,
    gate3Result: "NOT_READY_FOR_GATE3",
    replayOnlyContinues: true,
    observerAuthorized: false,
    realObservationAuthorized: false,
    readOnlyObserverDesignAuthorized: false,
    registryExportAllowed: false,
    diagnosisEnabled: false,
  };
}

export function runGate2NoGoEngine(signal: EveGate2SignalCandidate): EveGate2TriggeredNoGo[] {
  const triggered: EveGate2TriggeredNoGo[] = [];

  if (!isAllowedObservationMode(signal.observationMode)) {
    triggered.push(trigger("NG-025", signal.signalId));
  }

  if (!present(signal.identity?.tenantId)) triggered.push(trigger("NG-001", signal.signalId));
  if (!present(signal.identity?.organizationId)) triggered.push(trigger("NG-002", signal.signalId));
  if (!present(signal.traceability?.provenance)) triggered.push(trigger("NG-003", signal.signalId));
  if (!present(signal.traceability?.sourceTrace)) triggered.push(trigger("NG-004", signal.signalId));
  if (!present(signal.mba_anchor?.objectState)) triggered.push(trigger("NG-005", signal.signalId));
  if (signal.mba_anchor?.objectStateInOLC === false) triggered.push(trigger("NG-006", signal.signalId));
  if (!present(signal.mba_anchor?.pfEvent)) triggered.push(trigger("NG-007", signal.signalId));
  if (!present(signal.traceability?.idempotencyKey)) triggered.push(trigger("NG-008", signal.signalId));
  if (!present(signal.traceability?.correlationId)) triggered.push(trigger("NG-009", signal.signalId));
  if (!present(signal.traceability?.officialFlowRef)) triggered.push(trigger("NG-010", signal.signalId));
  if (signal.no_mutation_boundary?.uiTouchAllowed !== false) triggered.push(trigger("NG-011", signal.signalId));
  if (signal.no_mutation_boundary?.workMapMutationAllowed !== false) triggered.push(trigger("NG-012", signal.signalId));
  if (signal.no_mutation_boundary?.significadoMutationAllowed !== false) triggered.push(trigger("NG-013", signal.signalId));
  if (signal.no_mutation_boundary?.dbWriteAllowed !== false) triggered.push(trigger("NG-014", signal.signalId));
  if (
    signal.no_mutation_boundary?.supabaseWriteAllowed !== false ||
    signal.security_boundary?.rlsReadBoundaryRequiredIfDB !== true ||
    signal.security_boundary?.serviceRoleAllowed !== false ||
    signal.security_boundary?.secretsAllowed !== false ||
    signal.security_boundary?.tokenExposureAllowed !== false ||
    signal.security_boundary?.authBoundaryRequired !== true ||
    signal.security_boundary?.tenantIsolationRequired !== true
  ) {
    triggered.push(trigger("NG-015", signal.signalId));
  }
  if (signal.no_mutation_boundary?.runtimeMutationAllowed !== false) triggered.push(trigger("NG-016", signal.signalId));
  if (
    signal.no_mutation_boundary?.registryWriteAllowed !== false ||
    signal.no_mutation_boundary?.exportAllowed !== false ||
    signal.no_mutation_boundary?.diagnosisAllowed !== false
  ) {
    triggered.push(trigger("NG-017", signal.signalId));
  }
  if (signal.b3_b7_boundary?.receiverSatisfactionAllowedAsFeedback !== false) triggered.push(trigger("NG-018", signal.signalId));
  if (signal.b3_b7_boundary?.receiverFeedbackPresent && !present(signal.traceability?.routeRef)) triggered.push(trigger("NG-019", signal.signalId));
  if (signal.b3_b7_boundary?.b7DiagnosticUseAllowed !== false) triggered.push(trigger("NG-020", signal.signalId));
  if (signal.b3_b7_boundary?.b7StructuralFactAllowed !== false) triggered.push(trigger("NG-021", signal.signalId));

  for (const evidence of signal.evidence ?? []) {
    if (evidence.claimedAsRealEvidence && evidence.proofType === "fixture") triggered.push(trigger("NG-022", signal.signalId));
    if (evidence.claimedAsRealEvidence && evidence.proofType === "synthetic_field") triggered.push(trigger("NG-023", signal.signalId));
    if (evidence.claimedAsRealEvidence && evidence.proofType === "replay_only_output") triggered.push(trigger("NG-024", signal.signalId));
  }

  return dedupeNoGos(triggered);
}

export function evaluateGate2ToGate3Promotion(): EveGate2PromotionEvaluation {
  return {
    gate3Ready: false,
    gate3Result: "NOT_READY_FOR_GATE3",
    items: EVE_GATE2_TO_GATE3_PROMOTION_CHECKLIST.map((item) => ({ ...item })),
    blockersClosed: 0,
    exitConditionsClosed: 0,
    reason: "Offline controlled guardrails validate replay-only inputs, but Gate 3 still requires real non-fixture evidence and a separately authorized read-only design.",
  };
}

export function getGate2EvidenceFieldRegistry(): readonly EveGate2EvidenceFieldRegistryEntry[] {
  return EVE_GATE2_EVIDENCE_FIELD_REGISTRY;
}

export function getGate2RuntimeContractConfig(): EveGate2RuntimeContractConfig {
  return EVE_GATE2_RUNTIME_SIGNAL_CONTRACT_CONFIG;
}

export function getGate2RuntimeSignalContract(): Gate2RuntimeSignalContract {
  return getGate2RuntimeContractConfig();
}

export function validateGate2SignalInput(signal: Gate2SignalInput): Gate2ValidationResult {
  return validateGate2Signal(signal);
}

export function runGate2SignalNoGoEngine(signal: Gate2SignalInput): EveGate2TriggeredNoGo[] {
  return runGate2NoGoEngine(signal);
}

export function evaluateGate2NoGo(signal: Gate2SignalInput): EveGate2TriggeredNoGo[] {
  return runGate2NoGoEngine(signal);
}

export function getGate2EvidenceFieldRequirements(): readonly EveGate2EvidenceFieldRegistryEntry[] {
  return getGate2EvidenceFieldRegistry();
}

export function getGate2PromotionChecklistResult(): Gate2PromotionChecklistResult {
  return evaluateGate2ToGate3Promotion();
}

export function evaluateGate2ToGate3Checklist(): Gate2PromotionChecklistResult {
  return evaluateGate2ToGate3Promotion();
}

export function getGate2GuardrailAuthority(): Gate2GuardrailAuthority {
  return {
    replayOnlyContinues: true,
    observerAuthorized: false,
    realObservationAuthorized: false,
    readOnlyObserverDesignAuthorized: false,
    registryExportAllowed: false,
    diagnosisEnabled: false,
    gate3Ready: false,
  };
}

function rule(
  noGoId: EveGate2NoGoCode,
  nameOrCondition: string,
  conditionOrCheckedContractField: string,
  checkedContractFieldOrSeverity: string,
  severityOrBlockingResult: EveGate2Priority | EveGate2AdmissibilityStatus,
  blockingResultOrAffectedBlocker: EveGate2AdmissibilityStatus | string,
  affectedBlockerOrExitCondition: string,
  affectedExitConditionOrCorrection: string,
  requiredCorrectionOverride?: string,
): EveGate2NoGoRule {
  const hasExplicitName = typeof requiredCorrectionOverride === "string";
  const name = hasExplicitName ? nameOrCondition : nameOrCondition.replace(/[^a-zA-Z0-9]+/g, "_");
  const condition = hasExplicitName ? conditionOrCheckedContractField : nameOrCondition;
  const checkedContractField = hasExplicitName ? checkedContractFieldOrSeverity : conditionOrCheckedContractField;
  const severity = hasExplicitName ? severityOrBlockingResult as EveGate2Priority : checkedContractFieldOrSeverity as EveGate2Priority;
  const blockingResult = hasExplicitName
    ? blockingResultOrAffectedBlocker as EveGate2AdmissibilityStatus
    : severityOrBlockingResult as EveGate2AdmissibilityStatus;
  const affectedBlocker = hasExplicitName ? affectedBlockerOrExitCondition : blockingResultOrAffectedBlocker as string;
  const affectedExitCondition = hasExplicitName ? affectedExitConditionOrCorrection : affectedBlockerOrExitCondition;
  const requiredCorrection = hasExplicitName ? requiredCorrectionOverride : affectedExitConditionOrCorrection;

  return {
    noGoId,
    name,
    condition,
    checkedContractField,
    severity,
    resultCode: blockingResult,
    blockingResult,
    affectedBlocker,
    affectedExitCondition,
    requiredCorrection,
    canBeOverridden: false,
  };
}

function registry(
  fieldId: string,
  contractField: string,
  evidenceCategory: string,
  priority: EveGate2Priority,
  requiredOwner: EveGate2EvidenceFieldRegistryEntry["requiredOwner"],
  relatedBlocker: string,
  relatedExitCondition: string,
): EveGate2EvidenceFieldRegistryEntry {
  return {
    fieldId,
    contractField,
    evidenceCategory,
    priority,
    requiredOwner,
    requiredLocator: true,
    requiredTimestampOrVersion: true,
    requiredSourceSystem: true,
    requiredProofType: true,
    whyNotFixtureRequired: true,
    acceptableProofTypes: ACCEPTABLE_PROOF_TYPES,
    rejectedProofTypes: REJECTED_PROOF_TYPES,
    relatedBlocker,
    relatedExitCondition,
    currentStatus: "required_not_collected",
  };
}

function checklist(checklistItemId: string, requirement: string): EveGate2PromotionChecklistItem {
  return {
    checklistItemId,
    requirement,
    currentStatus: "required_not_collected" satisfies EveGate2EvidenceStatus,
    canPassNow: false,
  };
}

function trigger(noGoId: EveGate2NoGoCode, signalId: string): EveGate2TriggeredNoGo {
  const found = EVE_GATE2_NO_GO_RULES.find((candidate) => candidate.noGoId === noGoId);
  if (!found) {
    throw new Error(`Unknown Gate 2 No-Go rule: ${noGoId}`);
  }
  return { ...found, signalId };
}

function present(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isAllowedObservationMode(mode: EveGate2ObservationMode): boolean {
  return EVE_GATE2_RUNTIME_SIGNAL_CONTRACT_CONFIG.allowedObservationModes.includes(mode);
}

function dedupeNoGos(items: EveGate2TriggeredNoGo[]): EveGate2TriggeredNoGo[] {
  const seen = new Set<string>();
  const deduped: EveGate2TriggeredNoGo[] = [];
  for (const item of items) {
    if (!seen.has(item.noGoId)) {
      seen.add(item.noGoId);
      deduped.push(item);
    }
  }
  return deduped;
}

function uniqueStatuses(items: EveGate2AdmissibilityStatus[]): EveGate2AdmissibilityStatus[] {
  return [...new Set(items)];
}
