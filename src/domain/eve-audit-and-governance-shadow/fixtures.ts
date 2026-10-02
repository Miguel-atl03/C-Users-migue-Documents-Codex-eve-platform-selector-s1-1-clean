import type {
  AuditAndGovernanceBrainConnectionPreconditions,
  AuditAndGovernanceDocumentarySatisfaction,
  AuditAndGovernanceFixture,
  AuditAndGovernanceQueryType,
  AuditAndGovernanceResolvedEntity,
  AuditAndGovernanceSafetyFlags,
  AuditAndGovernanceShadowMode,
} from "./types.ts";

export const AUDIT_GOVERNANCE_SHADOW_VERSION = "0.1.1-shadow";
export const AUDIT_GOVERNANCE_SHADOW_CHIP_ID = "EVE-08-AUDIT-AND-GOVERNANCE";
export const AUDIT_GOVERNANCE_SHADOW_MODE: AuditAndGovernanceShadowMode = "audit_and_governance_shadow";

export const AUDIT_GOVERNANCE_SAFETY_FLAGS: AuditAndGovernanceSafetyFlags = {
  canBlockProductiveUserFlow: false,
  canModifyGovernanceState: false,
  canWriteRegistry: false,
  canTriggerExport: false,
  canTriggerParallelProduction: false,
  canTriggerRuntime: false,
  canTriggerDiagnosis: false,
  canExecuteSql: false,
  canWriteSupabase: false,
  canConnectEveBrain: false,
  runtimeAuthority: false,
};

export const AUDIT_GOVERNANCE_ALLOWED_ACTIONS = [
  "read_shadow_fixture",
  "inspect_audit_trace",
  "inspect_source_alias",
  "inspect_governance_rule",
  "inspect_system_state_evidence",
  "compare_expected_actual",
  "report_gap",
  "request_manual_review",
  "request_reentry",
];

export const AUDIT_GOVERNANCE_BLOCKED_ACTIONS = [
  "block_productive_user_flow",
  "modify_governance_state",
  "write_registry",
  "trigger_export",
  "trigger_parallel_production",
  "trigger_runtime",
  "trigger_diagnosis",
  "execute_sql",
  "write_supabase",
  "connect_eve_brain",
  "mutate_workmap",
  "mutate_significado",
  "create_api",
];

export const AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION: AuditAndGovernanceDocumentarySatisfaction = {
  status: "satisfactory",
  targetUnitsChecked: 250,
  targetUnitsExpected: 250,
  modulesChecked: 6,
  modulesExpected: 6,
  atomicRulesChecked: 200,
  atomicRulesExpected: 200,
  sourceToTargetRowsChecked: 288,
  sourceToTargetRowsExpected: 288,
  sourceProofRowsChecked: 244,
  sourceProofRowsExpected: 244,
  systemStateEvidenceRowsChecked: 24,
  systemStateEvidenceRowsExpected: 24,
  packageDeclaredMappingsChecked: 20,
  packageDeclaredMappingsExpected: 20,
  materialComparisonRowsChecked: 250,
  materialComparisonRowsExpected: 250,
  accepted: 250,
  rejected: 0,
  pendingSourceProof: 0,
  pendingLocatorPrecision: 0,
  internalClaimUnverified: 0,
  certificationClaimUnverified: 0,
  d8ContextualGap: 0,
  aliasesResolved: 50,
  aliasesExpected: 50,
  noCableadoViolation: 0,
  materialDifference: false,
};

export const AUDIT_GOVERNANCE_PROTECTED_METADATA = {
  noCableado: {
    runtimeAuthority: false,
    registryWrite: false,
    productWiring: false,
    eveBrainConnection: false,
    finalExportEnabled: false,
    parallelProductionEnabled: false,
    diagnosisEnabled: false,
    sqlEnabled: false,
    supabaseWrite: false,
  },
};

export const AUDIT_GOVERNANCE_DEFAULT_BRAIN_PRECONDITIONS: AuditAndGovernanceBrainConnectionPreconditions = {
  brainConnectionPreconditionsMet: false,
  missingPreconditions: [
    "explicit_brain_wiring_authorization",
    "registry_write_contract",
    "rollback_plan",
    "no_cableado_release_gate",
    "human_approval",
  ],
  blockedBy: [
    "explicit_brain_wiring_authorization",
    "registry_write_contract",
    "rollback_plan",
    "no_cableado_release_gate",
    "human_approval",
  ],
  explicitBrainWiringAuthorization: false,
  registryWriteContractReady: false,
  rollbackPlanReady: false,
  noCableadoReleaseGateReady: false,
  humanApprovalReady: false,
};

export const AUDIT_GOVERNANCE_ENTITIES: AuditAndGovernanceResolvedEntity[] = [
  {
    entityKind: "audit_trail_state",
    id: "AUDIT-TRAIL-SAMPLE",
    moduleId: "audit_trail",
    sourceTrace: ["AUDIT_AND_GOVERNANCE_RECORD_RULE_QA_SATISFACTORY"],
    evidenceRefs: ["targetUnitsChecked:250"],
  },
  {
    entityKind: "governance_rule",
    id: "GOV-RULE-SAMPLE",
    ruleId: "GOV-RULE-SAMPLE",
    moduleId: "governance_rules",
    sourceTrace: ["sourceToTargetRowsChecked:288"],
    evidenceRefs: ["accepted:250"],
  },
  {
    entityKind: "system_state_evidence",
    id: "SYS-NO-CABLEADO-AGGREGATE",
    systemStateEvidenceId: "SYS-NO-CABLEADO-AGGREGATE",
    moduleId: "system_state_evidence",
    sourceTrace: ["systemStateEvidenceRowsChecked:24"],
    evidenceRefs: ["noCableadoViolation:0"],
  },
  {
    entityKind: "source_alias",
    id: "A07PJ",
    aliasId: "A07PJ",
    sourceId: "EVE07_CONTEXTUAL",
    sourceTrace: ["aliasesResolved:50"],
    evidenceRefs: ["accepted_contextual_or_excluded_alias"],
  },
  {
    entityKind: "source_role",
    id: "D8",
    sourceId: "D8",
    sourceTrace: ["d8ContextualGap:0"],
    evidenceRefs: ["contextual_genealogy_only"],
  },
  {
    entityKind: "source_proof_satisfaction",
    id: "SOURCE-PROOF-SATISFACTORY",
    sourceTrace: ["sourceProofRowsChecked:244"],
    evidenceRefs: ["pendingSourceProof:0"],
  },
  {
    entityKind: "internal_claim_boundary",
    id: "INTERNAL-CLAIM-BOUNDARY",
    claimId: "certification_claim_boundary",
    sourceTrace: ["internalClaimUnverified:0"],
    evidenceRefs: ["certificationClaimUnverified:0"],
  },
  {
    entityKind: "no_cableado_control",
    id: "NO-CABLEADO-CONTROL",
    controlId: "no_cableado",
    sourceTrace: ["noCableadoViolation:0"],
    evidenceRefs: ["runtimeAuthority:false"],
  },
];

export const AUDIT_GOVERNANCE_SHADOW_FIXTURES: AuditAndGovernanceFixture[] = [
  fixture("resolve_audit_trail_state", { targetUnitId: "AUDIT-TRAIL-SAMPLE" }, "audit_lookup_ready", true, "audit_trail_state", []),
  fixture("resolve_governance_rule_state", { ruleId: "GOV-RULE-SAMPLE" }, "governance_rule_valid", true, "governance_rule", []),
  fixture(
    "resolve_system_state_evidence",
    { systemStateEvidenceId: "SYS-NO-CABLEADO-AGGREGATE" },
    "system_state_evidence_valid",
    true,
    "system_state_evidence",
    [],
  ),
  fixture("resolve_source_alias", { aliasId: "A07PJ" }, "source_alias_resolved", true, "source_alias", []),
  fixture("resolve_source_role", { sourceId: "D8" }, "source_role_valid", true, "source_role", []),
  fixture("validate_record_rule_source_qa", {}, "record_rule_source_qa_satisfactory", true, "qa_summary", []),
  fixture("validate_source_proof_satisfaction", {}, "source_proof_satisfactory", true, "source_proof_satisfaction", []),
  fixture("validate_system_state_evidence", {}, "system_state_evidence_valid", true, "system_state_evidence_set", []),
  fixture("validate_internal_claim_boundary", {}, "internal_claim_boundary_confirmed", true, "internal_claim_boundary", []),
  fixture("validate_no_circular_certification", {}, "circular_certification_prevented", true, "certification_boundary", []),
  fixture("validate_d8_contextual_resolution", { sourceId: "D8" }, "d8_contextual_resolved", true, "d8_contextual_genealogy", []),
  fixture("validate_no_cableado", {}, "no_cableado_confirmed", true, "no_cableado_control", []),
  fixture(
    "validate_brain_connection_preconditions_blocked",
    { queryType: "validate_brain_connection_preconditions" },
    "brain_connection_preconditions_blocked",
    false,
    "brain_connection_preconditions",
    ["brain_connection_preconditions_blocked"],
  ),
  fixture("detect_governance_gap", {}, "governance_rule_missing_source", false, "governance_gap", ["governance_rule_missing_source"]),
  fixture("detect_alias_gap", {}, "source_alias_missing", false, "alias_gap", ["source_alias_missing"]),
  fixture(
    "detect_unresolved_system_state",
    {},
    "system_state_evidence_missing",
    false,
    "system_state_gap",
    ["system_state_evidence_missing"],
  ),
  fixture(
    "detect_brain_connection_blocker",
    {},
    "brain_connection_preconditions_blocked",
    false,
    "brain_connection_blocker",
    ["brain_connection_preconditions_blocked"],
  ),
  fixture(
    "summarize_governance_readiness",
    {},
    "governance_readiness_with_controls",
    true,
    "governance_readiness_summary",
    ["brain_connection_preconditions_blocked"],
  ),
];

function fixture(
  fixtureId: AuditAndGovernanceQueryType | "validate_brain_connection_preconditions_blocked",
  inputOverrides: Partial<AuditAndGovernanceFixture["input"]>,
  expectedReadinessState: AuditAndGovernanceFixture["expectedReadinessState"],
  expectedResolved: boolean,
  expectedEntityKind: string,
  expectedGapFlags: string[],
): AuditAndGovernanceFixture {
  const queryType: AuditAndGovernanceQueryType =
    inputOverrides.queryType ??
    (fixtureId === "validate_brain_connection_preconditions_blocked"
      ? "validate_brain_connection_preconditions"
      : fixtureId);

  return {
    fixtureId,
    input: {
      mode: AUDIT_GOVERNANCE_SHADOW_MODE,
      queryType,
      ...inputOverrides,
    },
    expectedReadinessState,
    expectedResolved,
    expectedEntityKind,
    expectedGapFlags,
    expectedBlockedActions: AUDIT_GOVERNANCE_BLOCKED_ACTIONS,
  };
}
