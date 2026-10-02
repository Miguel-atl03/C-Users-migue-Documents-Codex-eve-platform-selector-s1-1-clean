import {
  AUDIT_GOVERNANCE_ALLOWED_ACTIONS,
  AUDIT_GOVERNANCE_BLOCKED_ACTIONS,
  AUDIT_GOVERNANCE_DEFAULT_BRAIN_PRECONDITIONS,
  AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION,
  AUDIT_GOVERNANCE_ENTITIES,
  AUDIT_GOVERNANCE_SAFETY_FLAGS,
  AUDIT_GOVERNANCE_SHADOW_CHIP_ID,
  AUDIT_GOVERNANCE_SHADOW_MODE,
  AUDIT_GOVERNANCE_SHADOW_VERSION,
} from "./fixtures.ts";
import type {
  AuditAndGovernanceBrainConnectionPreconditions,
  AuditAndGovernanceEvaluationInput,
  AuditAndGovernanceEvaluationResult,
  AuditAndGovernanceReadinessState,
  AuditAndGovernanceResolvedEntity,
} from "./types.ts";

export function evaluateAuditAndGovernanceShadow(input: AuditAndGovernanceEvaluationInput): AuditAndGovernanceEvaluationResult {
  if (input.mode !== AUDIT_GOVERNANCE_SHADOW_MODE) {
    return resultFor(input, "manual_review_required", false, null, ["invalid_shadow_mode"], ["mode"]);
  }

  if (input.queryType === "resolve_audit_trail_state") {
    const entity = findBy("id", input.targetUnitId);
    return entity
      ? resultFor(input, "audit_lookup_ready", true, entity, [], [])
      : resultFor(input, "audit_lookup_not_found", false, null, ["audit_lookup_not_found"], [input.targetUnitId ?? "targetUnitId"]);
  }

  if (input.queryType === "resolve_governance_rule_state") {
    const entity = findBy("ruleId", input.ruleId);
    return entity && input.context?.missingSource !== true
      ? resultFor(input, "governance_rule_valid", true, entity, [], [])
      : resultFor(input, "governance_rule_missing_source", false, entity, ["governance_rule_missing_source"], ["sourceTrace"]);
  }

  if (input.queryType === "resolve_system_state_evidence") {
    const entity = findBy("systemStateEvidenceId", input.systemStateEvidenceId);
    return entity
      ? resultFor(input, "system_state_evidence_valid", true, entity, [], [])
      : resultFor(input, "system_state_evidence_missing", false, null, ["system_state_evidence_missing"], [
          input.systemStateEvidenceId ?? "systemStateEvidenceId",
        ]);
  }

  if (input.queryType === "resolve_source_alias") {
    const entity = findBy("aliasId", input.aliasId);
    return entity
      ? resultFor(input, "source_alias_resolved", true, entity, [], [])
      : resultFor(input, "source_alias_missing", false, null, ["source_alias_missing"], [input.aliasId ?? "aliasId"]);
  }

  if (input.queryType === "resolve_source_role") {
    const entity = findBy("sourceId", input.sourceId);
    return entity && input.context?.incompatibleRole !== true
      ? resultFor(input, "source_role_valid", true, entity, [], [])
      : resultFor(input, "source_role_mismatch", false, entity, ["source_role_mismatch"], ["sourceId"]);
  }

  if (input.queryType === "validate_record_rule_source_qa") {
    return resultFor(input, "record_rule_source_qa_satisfactory", true, entity("qa_summary"), [], []);
  }

  if (input.queryType === "validate_source_proof_satisfaction") {
    return input.context?.sourceProofMissing === true
      ? resultFor(input, "source_proof_missing", false, entity("source_proof_satisfaction"), ["source_proof_missing"], ["sourceTrace"])
      : resultFor(input, "source_proof_satisfactory", true, entity("source_proof_satisfaction"), [], []);
  }

  if (input.queryType === "validate_system_state_evidence") {
    return resultFor(input, "system_state_evidence_valid", true, entity("system_state_evidence_set"), [], []);
  }

  if (input.queryType === "validate_internal_claim_boundary") {
    return input.context?.claimUsedAsFinalProof === true
      ? resultFor(input, "internal_claim_boundary_broken", false, entity("internal_claim_boundary"), ["internal_claim_boundary_broken"], ["claimId"])
      : resultFor(input, "internal_claim_boundary_confirmed", true, entity("internal_claim_boundary"), [], []);
  }

  if (input.queryType === "validate_no_circular_certification") {
    return input.context?.acceptCertificationReportAsFinalProof === true
      ? resultFor(input, "circular_certification_detected", false, entity("certification_boundary"), ["circular_certification_detected"], ["independentProof"])
      : resultFor(input, "circular_certification_prevented", true, entity("certification_boundary"), [], []);
  }

  if (input.queryType === "validate_d8_contextual_resolution") {
    return input.context?.d8UsedAsDirectProof === true
      ? resultFor(input, "d8_contextual_unresolved", false, entity("d8_contextual_genealogy"), ["d8_contextual_unresolved"], ["directOperationalProof"])
      : resultFor(input, "d8_contextual_resolved", true, entity("d8_contextual_genealogy"), [], []);
  }

  if (input.queryType === "validate_no_cableado") {
    return resultFor(input, "no_cableado_confirmed", true, entity("no_cableado_control"), [], []);
  }

  if (input.queryType === "validate_brain_connection_preconditions") {
    const preconditions = buildBrainPreconditions(input.context);
    return preconditions.brainConnectionPreconditionsMet
      ? resultFor(input, "brain_connection_preconditions_met", true, entity("brain_connection_preconditions"), [], [], preconditions)
      : resultFor(
          input,
          "brain_connection_preconditions_blocked",
          false,
          entity("brain_connection_preconditions"),
          ["brain_connection_preconditions_blocked"],
          preconditions.missingPreconditions,
          preconditions,
        );
  }

  if (input.queryType === "detect_governance_gap") {
    return resultFor(input, "governance_rule_missing_source", false, entity("governance_gap"), ["governance_rule_missing_source"], ["sourceTrace"]);
  }

  if (input.queryType === "detect_alias_gap") {
    return resultFor(input, "source_alias_missing", false, entity("alias_gap"), ["source_alias_missing"], ["aliasId"]);
  }

  if (input.queryType === "detect_unresolved_system_state") {
    return resultFor(input, "system_state_evidence_missing", false, entity("system_state_gap"), ["system_state_evidence_missing"], [
      "systemStateEvidenceId",
    ]);
  }

  if (input.queryType === "detect_brain_connection_blocker") {
    return resultFor(
      input,
      "brain_connection_preconditions_blocked",
      false,
      entity("brain_connection_blocker"),
      ["brain_connection_preconditions_blocked"],
      AUDIT_GOVERNANCE_DEFAULT_BRAIN_PRECONDITIONS.missingPreconditions,
    );
  }

  if (input.queryType === "summarize_governance_readiness") {
    return resultFor(input, "governance_readiness_with_controls", true, entity("governance_readiness_summary"), [
      "brain_connection_preconditions_blocked",
    ], []);
  }

  return resultFor(input, "manual_review_required", false, null, ["unhandled_query_type"], ["queryType"]);
}

function resultFor(
  input: AuditAndGovernanceEvaluationInput,
  readinessState: AuditAndGovernanceReadinessState,
  resolved: boolean,
  resolvedEntity: AuditAndGovernanceResolvedEntity | null,
  gapFlags: string[],
  missingReferences: string[],
  brainConnectionPreconditions = AUDIT_GOVERNANCE_DEFAULT_BRAIN_PRECONDITIONS,
): AuditAndGovernanceEvaluationResult {
  const sourceTrace = resolvedEntity?.sourceTrace ?? [];
  const evidenceRefs = resolvedEntity?.evidenceRefs ?? [];

  return {
    version: AUDIT_GOVERNANCE_SHADOW_VERSION,
    mode: AUDIT_GOVERNANCE_SHADOW_MODE,
    chipId: AUDIT_GOVERNANCE_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState,
    resolved,
    resolvedEntity,
    missingReferences,
    gapFlags,
    sourceTrace,
    evidenceRefs,
    allowedActions: [...AUDIT_GOVERNANCE_ALLOWED_ACTIONS],
    blockedActions: [...AUDIT_GOVERNANCE_BLOCKED_ACTIONS],
    requiredInputs: missingReferences,
    findings: findingsFor(readinessState, resolved, gapFlags),
    auditEvents: auditEventsFor(input, readinessState, resolved),
    safetyFlags: { ...AUDIT_GOVERNANCE_SAFETY_FLAGS },
    documentarySatisfaction: { ...AUDIT_GOVERNANCE_DOCUMENTARY_SATISFACTION },
    governanceEvaluation: {
      evaluatedAsShadowOnly: true,
      noCableadoConfirmed: true,
      internalClaimBoundaryConfirmed: readinessState !== "internal_claim_boundary_broken",
      circularCertificationPrevented: readinessState !== "circular_certification_detected",
      d8ContextualOnly: readinessState !== "d8_contextual_unresolved",
    },
    brainConnectionPreconditions: {
      ...brainConnectionPreconditions,
      missingPreconditions: [...brainConnectionPreconditions.missingPreconditions],
      blockedBy: [...brainConnectionPreconditions.blockedBy],
    },
  };
}

function findBy(key: keyof AuditAndGovernanceResolvedEntity, value: string | undefined): AuditAndGovernanceResolvedEntity | null {
  if (!value) return null;
  return AUDIT_GOVERNANCE_ENTITIES.find((item) => item[key] === value) ?? null;
}

function entity(entityKind: string): AuditAndGovernanceResolvedEntity {
  return (
    AUDIT_GOVERNANCE_ENTITIES.find((item) => item.entityKind === entityKind) ?? {
      entityKind,
      id: entityKind,
      sourceTrace: ["AUDIT_AND_GOVERNANCE_RECORD_RULE_QA_SATISFACTORY"],
      evidenceRefs: ["shadow_only"],
    }
  );
}

function buildBrainPreconditions(context: Record<string, unknown> | undefined): AuditAndGovernanceBrainConnectionPreconditions {
  const flags = {
    explicitBrainWiringAuthorization: context?.explicitBrainWiringAuthorization === true,
    registryWriteContractReady: context?.registryWriteContractReady === true,
    rollbackPlanReady: context?.rollbackPlanReady === true,
    noCableadoReleaseGateReady: context?.noCableadoReleaseGateReady === true,
    humanApprovalReady: context?.humanApprovalReady === true,
  };
  const missingPreconditions = [
    !flags.explicitBrainWiringAuthorization ? "explicit_brain_wiring_authorization" : "",
    !flags.registryWriteContractReady ? "registry_write_contract" : "",
    !flags.rollbackPlanReady ? "rollback_plan" : "",
    !flags.noCableadoReleaseGateReady ? "no_cableado_release_gate" : "",
    !flags.humanApprovalReady ? "human_approval" : "",
  ].filter(Boolean);

  return {
    ...flags,
    brainConnectionPreconditionsMet: missingPreconditions.length === 0,
    missingPreconditions,
    blockedBy: missingPreconditions,
  };
}

function findingsFor(readinessState: AuditAndGovernanceReadinessState, resolved: boolean, gapFlags: string[]): string[] {
  if (resolved && gapFlags.length === 0) return [`${readinessState}:shadow_evaluation_ok`];
  return [`${readinessState}:shadow_evaluation_requires_attention`, ...gapFlags];
}

function auditEventsFor(
  input: AuditAndGovernanceEvaluationInput,
  readinessState: AuditAndGovernanceReadinessState,
  resolved: boolean,
): string[] {
  return [
    `shadow_query:${input.queryType}`,
    `shadow_readiness:${readinessState}`,
    `shadow_resolved:${resolved ? "true" : "false"}`,
    "side_effects:false",
  ];
}
