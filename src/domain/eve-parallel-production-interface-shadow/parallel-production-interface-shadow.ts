import {
  PPI_ALLOWED_ACTIONS,
  PPI_BLOCKED_ACTIONS,
  PPI_DOCUMENTARY_SATISFACTION,
  PPI_ENTITIES,
  PPI_SAFETY_FLAGS,
  PPI_SHADOW_CHIP_ID,
  PPI_SHADOW_MODE,
  PPI_SHADOW_VERSION,
} from "./fixtures.ts";
import type {
  ParallelProductionInterfaceBlockerEvaluation,
  ParallelProductionInterfaceEvaluationInput,
  ParallelProductionInterfaceEvaluationResult,
  ParallelProductionInterfaceReadinessState,
  ParallelProductionInterfaceResolvedEntity,
} from "./types.ts";

export function evaluateParallelProductionInterfaceShadow(
  input: ParallelProductionInterfaceEvaluationInput,
): ParallelProductionInterfaceEvaluationResult {
  if (input.mode !== PPI_SHADOW_MODE) {
    return resultFor(input, "ppi_gap_detected", false, null, ["INVALID_SHADOW_MODE"], ["mode"]);
  }

  if (input.queryType === "validate_documentary_satisfaction") {
    return documentarySatisfactionIsComplete()
      ? resultFor(input, "documentary_satisfaction_confirmed", true, documentaryEntity(), [], [])
      : resultFor(input, "documentary_satisfaction_broken", false, documentaryEntity(), ["DOCUMENTARY_SATISFACTION_BROKEN"], []);
  }

  if (isResolveQuery(input.queryType)) {
    const entity = findPayloadEntity(input);
    return entity
      ? resultFor(input, "ppi_lookup_ready", true, entity, [], [])
      : resultFor(input, "ppi_lookup_not_found", false, null, ["PPI_LOOKUP_NOT_FOUND"], missingPayload(input));
  }

  if (input.queryType === "validate_payload_schema") {
    const entity = findPayloadSchema(input);
    if (!entity) return resultFor(input, "payload_schema_missing_source", false, null, ["PAYLOAD_SCHEMA_MISSING"], missingPayload(input));
    return hasTrace(input, entity)
      ? resultFor(input, "payload_schema_valid", true, entity, [], [])
      : resultFor(input, "payload_schema_missing_source", false, entity, ["PAYLOAD_SCHEMA_MISSING_SOURCE"], ["sourceTrace", "evidenceRefs"]);
  }

  if (input.queryType === "validate_source_proof") {
    const entity = findRule(input.ruleId);
    return entity && hasTrace(input, entity)
      ? resultFor(input, "source_proof_valid", true, entity, [], [])
      : resultFor(input, "source_proof_missing", false, entity, ["SOURCE_PROOF_MISSING"], ["sourceTrace", "evidenceRefs"]);
  }

  if (input.queryType === "validate_export_blocker") {
    const entity = findBlocker(input.blockerCode);
    return entity
      ? resultFor(input, "export_blocker_valid", true, entity, [], [])
      : resultFor(input, "export_blocker_missing", false, null, ["EXPORT_BLOCKER_MISSING"], [input.blockerCode ?? "blockerCode"]);
  }

  if (input.queryType === "validate_exb_031") {
    return validateExb031(input);
  }

  if (input.queryType === "validate_registry_candidate_boundary") {
    return resultFor(input, "registry_candidate_boundary_confirmed", true, entityByKind("registry_boundary_validation"), [], []);
  }

  if (input.queryType === "validate_ir_candidate_boundary") {
    return resultFor(input, "ir_candidate_boundary_confirmed", true, entityByKind("ir_boundary_validation"), [], []);
  }

  if (input.queryType === "validate_no_export") {
    return resultFor(input, "no_export_confirmed", true, safetyEntity("no_export_confirmed"), [], []);
  }

  if (input.queryType === "validate_no_registry_write") {
    return resultFor(input, "no_registry_write_confirmed", true, safetyEntity("no_registry_write_confirmed"), [], []);
  }

  if (input.queryType === "validate_no_parallel_production") {
    return resultFor(input, "no_parallel_production_confirmed", true, safetyEntity("no_parallel_production_confirmed"), [], []);
  }

  if (input.queryType === "validate_no_runtime_authority") {
    return resultFor(input, "no_runtime_authority_confirmed", true, safetyEntity("no_runtime_authority_confirmed"), [], []);
  }

  if (input.queryType === "detect_parallel_production_interface_gap") {
    const entity = findRequestedEntity(input);
    const gaps = detectGaps(input, entity);
    return gaps.length > 0
      ? resultFor(input, "ppi_gap_detected", false, entity, gaps, requiredInputsForGaps(input, entity))
      : resultFor(input, "ppi_reference_valid", true, entity, [], []);
  }

  return resultFor(input, "manual_review_required", false, null, ["UNHANDLED_QUERY_TYPE"], ["queryType"]);
}

function resultFor(
  input: ParallelProductionInterfaceEvaluationInput,
  readinessState: ParallelProductionInterfaceReadinessState,
  resolved: boolean,
  entity: ParallelProductionInterfaceResolvedEntity | null,
  gapFlags: string[],
  missingReferences: string[],
  blockerEvaluation: ParallelProductionInterfaceBlockerEvaluation = defaultBlockerEvaluation(input),
): ParallelProductionInterfaceEvaluationResult {
  const sourceTrace = input.sourceTrace && input.sourceTrace.length > 0 ? input.sourceTrace : entity?.sourceTrace ?? [];
  const evidenceRefs = input.evidenceRefs && input.evidenceRefs.length > 0 ? input.evidenceRefs : entity?.evidenceRefs ?? [];

  return {
    version: PPI_SHADOW_VERSION,
    mode: PPI_SHADOW_MODE,
    chipId: PPI_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState,
    resolved,
    resolvedEntity: entity,
    missingReferences,
    gapFlags,
    sourceTrace,
    evidenceRefs,
    allowedActions: [...PPI_ALLOWED_ACTIONS],
    blockedActions: [...PPI_BLOCKED_ACTIONS],
    requiredInputs: missingReferences,
    findings: findingsFor(readinessState, resolved, gapFlags),
    auditEvents: auditEventsFor(input, readinessState, resolved),
    safetyFlags: { ...PPI_SAFETY_FLAGS },
    documentarySatisfaction: { ...PPI_DOCUMENTARY_SATISFACTION },
    blockerEvaluation,
  };
}

function isResolveQuery(queryType: ParallelProductionInterfaceEvaluationInput["queryType"]): boolean {
  return queryType.startsWith("resolve_");
}

function findPayloadEntity(input: ParallelProductionInterfaceEvaluationInput): ParallelProductionInterfaceResolvedEntity | null {
  const expectedKind = payloadKindForResolveQuery(input.queryType);
  return (
    PPI_ENTITIES.find((entity) => {
      if (expectedKind && entity.entityKind !== expectedKind) return false;
      if (input.payloadId) return entity.payloadId === input.payloadId || entity.id === input.payloadId;
      if (input.payloadType) return entity.payloadType === input.payloadType;
      if (input.module) return entity.module === input.module;
      return Boolean(expectedKind);
    }) ?? null
  );
}

function payloadKindForResolveQuery(queryType: ParallelProductionInterfaceEvaluationInput["queryType"]): string | null {
  if (queryType === "resolve_scr_payload") return "scr_payload_shadow_candidate";
  if (queryType === "resolve_evidence_bundle_payload") return "evidence_bundle_shadow_candidate";
  if (queryType === "resolve_mdsb_payload") return "mdsb_shadow_candidate";
  if (queryType === "resolve_mmabp_ir_candidate") return "mmabp_ir_candidate_shadow";
  if (queryType === "resolve_registry_candidate") return "registry_candidate_shadow";
  if (queryType === "resolve_export_blockers") return "export_blocker_set_shadow";
  return null;
}

function findPayloadSchema(input: ParallelProductionInterfaceEvaluationInput): ParallelProductionInterfaceResolvedEntity | null {
  return PPI_ENTITIES.find((entity) => entity.entityKind === "payload_schema_validation" && entity.payloadType === input.payloadType) ?? null;
}

function findRule(ruleId: string | undefined): ParallelProductionInterfaceResolvedEntity | null {
  if (!ruleId) return null;
  return PPI_ENTITIES.find((entity) => entity.ruleId === ruleId || entity.id === ruleId) ?? null;
}

function findBlocker(blockerCode: string | undefined): ParallelProductionInterfaceResolvedEntity | null {
  if (!blockerCode) return null;
  return PPI_ENTITIES.find((entity) => entity.blockerCode === blockerCode || entity.id === blockerCode) ?? null;
}

function findRequestedEntity(input: ParallelProductionInterfaceEvaluationInput): ParallelProductionInterfaceResolvedEntity | null {
  if (input.blockerCode) return findBlocker(input.blockerCode);
  if (input.ruleId) return findRule(input.ruleId);
  return findPayloadEntity(input) ?? findPayloadSchema(input);
}

function validateExb031(input: ParallelProductionInterfaceEvaluationInput): ParallelProductionInterfaceEvaluationResult {
  const entity = findBlocker("EXB-031");
  const overrideRequested = input.context?.overrideRequested === true;
  const overrideAudited = input.context?.overrideAudited === true;
  const blocked = overrideRequested && !overrideAudited;
  const blockerEvaluation: ParallelProductionInterfaceBlockerEvaluation = {
    blockerCode: "EXB-031",
    conditionMatched: overrideRequested,
    blocked,
    reason: blocked ? "override_requested_without_audit" : "override_not_requested_or_audited",
    evaluatedAsShadowOnly: true,
  };

  return blocked
    ? resultFor(input, "exb_031_violation_detected", false, entity, ["EXB_031_OVERRIDE_NOT_AUDITED"], [], blockerEvaluation)
    : resultFor(input, "exb_031_valid", true, entity, [], [], blockerEvaluation);
}

function hasTrace(input: ParallelProductionInterfaceEvaluationInput, entity: ParallelProductionInterfaceResolvedEntity | null): boolean {
  return Boolean(
    (input.sourceTrace && input.sourceTrace.length > 0) ||
      (input.evidenceRefs && input.evidenceRefs.length > 0) ||
      (entity?.sourceTrace && entity.sourceTrace.length > 0) ||
      (entity?.evidenceRefs && entity.evidenceRefs.length > 0),
  );
}

function detectGaps(
  input: ParallelProductionInterfaceEvaluationInput,
  entity: ParallelProductionInterfaceResolvedEntity | null,
): string[] {
  const gaps: string[] = [];
  if (!entity && (input.payloadId || input.payloadType || input.ruleId || input.blockerCode)) gaps.push("PPI_REFERENCE_MISSING");
  if (input.context?.sourceProofMissing === true) gaps.push("SOURCE_PROOF_MISSING");
  if (input.context?.evidenceMissing === true) gaps.push("EVIDENCE_TRACE_MISSING");
  if (entity && !hasTrace(input, entity)) gaps.push("SOURCE_TRACE_MISSING");
  if (!entity && !input.payloadId && !input.payloadType && !input.ruleId && !input.blockerCode && !input.sourceTrace?.length && !input.evidenceRefs?.length) {
    gaps.push("INSUFFICIENT_SHADOW_INPUT");
  }
  return gaps;
}

function requiredInputsForGaps(
  input: ParallelProductionInterfaceEvaluationInput,
  entity: ParallelProductionInterfaceResolvedEntity | null,
): string[] {
  if (!entity) return [input.payloadId ?? input.payloadType ?? input.ruleId ?? input.blockerCode ?? "payload_or_source_reference"];
  if (input.context?.sourceProofMissing === true) return ["sourceTrace"];
  if (input.context?.evidenceMissing === true) return ["evidenceRefs"];
  return [];
}

function missingPayload(input: ParallelProductionInterfaceEvaluationInput): string[] {
  return [input.payloadId ?? input.payloadType ?? input.module ?? "payloadId_or_payloadType"];
}

function entityByKind(entityKind: string): ParallelProductionInterfaceResolvedEntity {
  return PPI_ENTITIES.find((entity) => entity.entityKind === entityKind) ?? safetyEntity(entityKind);
}

function safetyEntity(id: string): ParallelProductionInterfaceResolvedEntity {
  return {
    entityKind: "safety_boundary_validation",
    id,
    sourceDocuments: ["D3", "D4", "D5"],
    sourceTrace: ["D3:downstream-boundary", "D4:technical-boundary", "D5:runtime-governance"],
    evidenceRefs: ["runtimeAuthority=false", "registryWrite=false", "final_export_enabled=false", "parallel_production_enabled=false"],
  };
}

function documentaryEntity(): ParallelProductionInterfaceResolvedEntity {
  return entityByKind("documentary_satisfaction_summary");
}

function documentarySatisfactionIsComplete(): boolean {
  return (
    PPI_DOCUMENTARY_SATISFACTION.status === "satisfactory" &&
    PPI_DOCUMENTARY_SATISFACTION.sourceProofMatrixRowsChecked === PPI_DOCUMENTARY_SATISFACTION.sourceProofMatrixRowsExpected &&
    PPI_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsChecked === PPI_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsExpected &&
    PPI_DOCUMENTARY_SATISFACTION.exbBlockersChecked === PPI_DOCUMENTARY_SATISFACTION.exbBlockersExpected &&
    PPI_DOCUMENTARY_SATISFACTION.exb031Checked &&
    PPI_DOCUMENTARY_SATISFACTION.exportBlockerVectorsChecked === PPI_DOCUMENTARY_SATISFACTION.exportBlockerVectorsExpected &&
    PPI_DOCUMENTARY_SATISFACTION.certificationClaimsChecked === PPI_DOCUMENTARY_SATISFACTION.certificationClaimsExpected &&
    PPI_DOCUMENTARY_SATISFACTION.qaRows === 258 &&
    PPI_DOCUMENTARY_SATISFACTION.accepted === 258 &&
    PPI_DOCUMENTARY_SATISFACTION.rejected === 0 &&
    PPI_DOCUMENTARY_SATISFACTION.pendingSourceProof === 0 &&
    PPI_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision === 0 &&
    PPI_DOCUMENTARY_SATISFACTION.certificationClaimUnverified === 0 &&
    !PPI_DOCUMENTARY_SATISFACTION.materialDifference
  );
}

function defaultBlockerEvaluation(input: ParallelProductionInterfaceEvaluationInput): ParallelProductionInterfaceBlockerEvaluation {
  return {
    blockerCode: input.blockerCode,
    conditionMatched: false,
    blocked: false,
    evaluatedAsShadowOnly: true,
  };
}

function findingsFor(
  readinessState: ParallelProductionInterfaceReadinessState,
  resolved: boolean,
  gapFlags: string[],
): string[] {
  if (gapFlags.length > 0) return [`shadow_gap:${gapFlags.join(",")}`];
  return [resolved ? `shadow_resolved:${readinessState}` : `shadow_unresolved:${readinessState}`];
}

function auditEventsFor(
  input: ParallelProductionInterfaceEvaluationInput,
  readinessState: ParallelProductionInterfaceReadinessState,
  resolved: boolean,
): string[] {
  return [
    `mode:${input.mode}`,
    `queryType:${input.queryType}`,
    `readinessState:${readinessState}`,
    `resolved:${resolved}`,
    "sideEffects:false",
  ];
}
