import {
  EXECUTION_ENGINE_ALLOWED_ACTIONS,
  EXECUTION_ENGINE_BLOCKED_ACTIONS,
  EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION,
  EXECUTION_ENGINE_ENTITIES,
  EXECUTION_ENGINE_PROTECTED_METADATA,
  EXECUTION_ENGINE_SAFETY_FLAGS,
  EXECUTION_ENGINE_SHADOW_CHIP_ID,
  EXECUTION_ENGINE_SHADOW_MODE,
  EXECUTION_ENGINE_SHADOW_VERSION,
} from "./fixtures.ts";
import type {
  ExecutionEngineEvaluationInput,
  ExecutionEngineEvaluationResult,
  ExecutionEngineReadinessState,
  ExecutionEngineResolvedEntity,
} from "./types.ts";

export function evaluateExecutionEngineShadow(
  input: ExecutionEngineEvaluationInput,
): ExecutionEngineEvaluationResult {
  if (input.mode !== EXECUTION_ENGINE_SHADOW_MODE) {
    return resultFor(input, "execution_engine_gap_detected", false, null, ["invalid_mode"], ["mode"]);
  }

  if (documentarySatisfactionBroken()) {
    return resultFor(
      input,
      "documentary_satisfaction_broken",
      false,
      documentaryEntity(),
      ["documentary_satisfaction_broken"],
      [],
    );
  }

  if (input.queryType.startsWith("resolve_")) {
    return resolveRecord(input);
  }

  if (input.queryType === "validate_documentary_satisfaction") {
    return resultFor(input, "documentary_satisfaction_confirmed", true, documentaryEntity(), [], []);
  }

  if (input.queryType === "validate_no_runtime_authority") {
    return resultFor(input, "no_runtime_authority_confirmed", true, noCableadoEntity(), [], []);
  }

  if (input.queryType === "validate_no_registry_write") {
    return resultFor(input, "no_registry_write_confirmed", true, noCableadoEntity(), [], []);
  }

  if (input.queryType === "validate_no_diagnosis") {
    return resultFor(input, "no_diagnosis_confirmed", true, noCableadoEntity(), [], []);
  }

  if (input.queryType === "validate_no_export") {
    return resultFor(input, "no_export_confirmed", true, noCableadoEntity(), [], []);
  }

  if (input.queryType === "detect_execution_engine_gap") {
    const entity = findRequestedEntity(input);
    const gaps = detectGaps(input, entity);
    return gaps.length > 0
      ? resultFor(input, "execution_engine_gap_detected", false, entity, gaps, missingRequested(input, entity))
      : resultFor(input, "execution_engine_reference_valid", true, entity, [], []);
  }

  return validateReference(input);
}

function resolveRecord(input: ExecutionEngineEvaluationInput): ExecutionEngineEvaluationResult {
  const entity = findRequestedEntity(input);
  if (!entity) {
    return resultFor(
      input,
      "execution_engine_lookup_not_found",
      false,
      missingEntity(input),
      ["record_not_found"],
      missingRequested(input, null),
    );
  }

  return resultFor(input, "execution_engine_lookup_ready", true, entity, [], []);
}

function validateReference(input: ExecutionEngineEvaluationInput): ExecutionEngineEvaluationResult {
  if (input.queryType === "validate_source_role") {
    if (!sourceRoleValid(input)) {
      return resultFor(input, "source_role_mismatch", false, sourceRoleEntity(), ["source_role_mismatch"], []);
    }
    return resultFor(input, "source_role_valid", true, sourceRoleEntity(), [], []);
  }

  const entity = findRequestedEntity(input);
  const sourceTraceMissing = input.context?.sourceTraceMissing === true;
  const evidenceMissing = input.context?.evidenceMissing === true;

  if (!entity && needsEntity(input)) {
    return resultFor(input, missingStateFor(input), false, null, ["reference_not_found"], missingRequested(input, null));
  }

  if (sourceTraceMissing || evidenceMissing || !hasTrace(input, entity)) {
    return resultFor(
      input,
      missingStateFor(input),
      false,
      missingTraceEntity(input),
      missingGapFor(input),
      ["sourceTrace", "evidenceRefs"],
    );
  }

  return resultFor(input, validStateFor(input), true, entity, [], []);
}

function resultFor(
  input: ExecutionEngineEvaluationInput,
  readinessState: ExecutionEngineReadinessState,
  resolved: boolean,
  entity: ExecutionEngineResolvedEntity | null,
  gapFlags: string[],
  missingReferences: string[],
): ExecutionEngineEvaluationResult {
  const sourceTrace = input.sourceTrace && input.sourceTrace.length > 0 ? input.sourceTrace : entity?.sourceTrace ?? [];
  const evidenceRefs = input.evidenceRefs && input.evidenceRefs.length > 0 ? input.evidenceRefs : entity?.evidenceRefs ?? [];

  return {
    version: EXECUTION_ENGINE_SHADOW_VERSION,
    mode: EXECUTION_ENGINE_SHADOW_MODE,
    chipId: EXECUTION_ENGINE_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState,
    resolved,
    resolvedEntity: entity,
    missingReferences,
    gapFlags,
    sourceTrace,
    evidenceRefs,
    allowedActions: [...EXECUTION_ENGINE_ALLOWED_ACTIONS],
    blockedActions: [...EXECUTION_ENGINE_BLOCKED_ACTIONS],
    requiredInputs: requiredInputsFor(entity, missingReferences),
    findings: findingsFor(readinessState, resolved, gapFlags),
    auditEvents: auditEventsFor(input, readinessState, resolved),
    safetyFlags: { ...EXECUTION_ENGINE_SAFETY_FLAGS },
    documentarySatisfaction: { ...EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION },
  };
}

function findRequestedEntity(input: ExecutionEngineEvaluationInput): ExecutionEngineResolvedEntity | null {
  const kind = entityKindFor(input);
  const id = input.recordId ?? input.ruleId ?? input.fieldName;

  if (kind && id) {
    const exact = EXECUTION_ENGINE_ENTITIES.find(
      (entity) =>
        entity.entityKind === kind &&
        (entity.id === id || entity.recordId === id || entity.ruleId === id || entity.fieldName === id),
    );
    return exact ?? null;
  }

  if (kind) {
    const byKind = EXECUTION_ENGINE_ENTITIES.find((entity) => entity.entityKind === kind);
    if (byKind) return byKind;
  }

  if (id) {
    return (
      EXECUTION_ENGINE_ENTITIES.find(
        (entity) => entity.id === id || entity.recordId === id || entity.ruleId === id || entity.fieldName === id,
      ) ?? null
    );
  }

  return null;
}

function entityKindFor(input: ExecutionEngineEvaluationInput): string | null {
  if (input.queryType === "resolve_activity_runtime_run") return "activity_runtime_run";
  if (input.queryType === "resolve_interaction_instance") return "runtime_interaction_instance";
  if (input.queryType === "resolve_response_ingest") return "response_ingest_service";
  if (input.queryType === "resolve_evidence_item") return "evidence_item";
  if (input.queryType === "resolve_canonical_variable_record") return "canonical_variable_record";
  if (input.queryType === "resolve_structural_candidate_record") return "structural_candidate_record";
  if (input.queryType === "validate_record_schema") return "schema";
  if (input.queryType === "validate_required_fields") return "required_fields";
  if (input.queryType === "validate_lifecycle") return "lifecycle";
  if (input.queryType === "validate_evidence_trace") return "evidence_trace";
  if (input.queryType === "validate_canonical_variable_dependency") return "canonical_variable_dependency";
  if (input.queryType === "validate_structural_candidate_dependency") return "structural_candidate_dependency";
  if (input.queryType === "validate_gate_dependency") return "gate_dependency";
  return null;
}

function sourceRoleValid(input: ExecutionEngineEvaluationInput): boolean {
  const text = [input.sourceDocumentId, ...(input.sourceTrace ?? []), ...(input.evidenceRefs ?? [])].join(" ");
  const d1DirectProof = /\bD1\b/i.test(text) && !/contextual|methodological/i.test(text);
  return (
    !d1DirectProof &&
    EXECUTION_ENGINE_PROTECTED_METADATA.sourceRole.d1DirectProofScr === false &&
    EXECUTION_ENGINE_PROTECTED_METADATA.sourceRole.d8PresentForScr === true
  );
}

function hasTrace(input: ExecutionEngineEvaluationInput, entity: ExecutionEngineResolvedEntity | null): boolean {
  return Boolean(
    input.sourceTrace?.length ||
      input.evidenceRefs?.length ||
      entity?.sourceTrace?.length ||
      entity?.evidenceRefs?.length,
  );
}

function needsEntity(input: ExecutionEngineEvaluationInput): boolean {
  return ![
    "validate_no_runtime_authority",
    "validate_no_registry_write",
    "validate_no_diagnosis",
    "validate_no_export",
    "validate_documentary_satisfaction",
  ].includes(input.queryType);
}

function detectGaps(
  input: ExecutionEngineEvaluationInput,
  entity: ExecutionEngineResolvedEntity | null,
): string[] {
  const gaps: string[] = [];
  if ((input.recordId || input.recordType) && !entity) gaps.push("record_not_found");
  if (input.context?.sourceTraceMissing === true || !hasTrace(input, entity)) gaps.push("source_trace_missing");
  if (input.context?.evidenceMissing === true) gaps.push("evidence_trace_missing");
  return gaps;
}

function validStateFor(input: ExecutionEngineEvaluationInput): ExecutionEngineReadinessState {
  if (input.queryType === "validate_record_schema") return "record_schema_valid";
  if (input.queryType === "validate_required_fields") return "required_fields_valid";
  if (input.queryType === "validate_lifecycle") return "lifecycle_valid";
  if (input.queryType === "validate_evidence_trace") return "evidence_trace_valid";
  if (input.queryType === "validate_canonical_variable_dependency") return "canonical_variable_dependency_valid";
  if (input.queryType === "validate_structural_candidate_dependency") return "structural_candidate_dependency_valid";
  if (input.queryType === "validate_gate_dependency") return "gate_dependency_valid";
  return "execution_engine_reference_valid";
}

function missingStateFor(input: ExecutionEngineEvaluationInput): ExecutionEngineReadinessState {
  if (input.queryType === "validate_record_schema") return "record_schema_missing_source";
  if (input.queryType === "validate_required_fields") return "required_fields_missing_source";
  if (input.queryType === "validate_lifecycle") return "lifecycle_missing_source";
  if (input.queryType === "validate_evidence_trace") return "evidence_trace_missing";
  if (input.queryType === "validate_canonical_variable_dependency") return "canonical_variable_dependency_missing";
  if (input.queryType === "validate_structural_candidate_dependency") return "structural_candidate_dependency_missing";
  if (input.queryType === "validate_gate_dependency") return "gate_dependency_missing";
  return "execution_engine_reference_missing";
}

function missingGapFor(input: ExecutionEngineEvaluationInput): string[] {
  if (input.queryType === "validate_evidence_trace") return ["source_trace_missing"];
  return ["source_proof_missing"];
}

function documentarySatisfactionBroken(): boolean {
  return (
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.status !== "satisfactory" ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.modulesChecked !== EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.modulesExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.failureGuardsChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.failureGuardsExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.integrationRulesChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.integrationRulesExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceToTargetMappingsExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.qaControlsChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.qaControlsExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.schemaFieldsChecked !==
      EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.schemaFieldsExpected ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.rejected !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.pendingLocatorPrecision !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceRoleMismatch !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.sourceMissing !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.wiringRiskDetected !== 0 ||
    EXECUTION_ENGINE_DOCUMENTARY_SATISFACTION.materialDifference
  );
}

function noCableadoEntity(): ExecutionEngineResolvedEntity {
  return {
    entityKind: "no_cableado_guard",
    id: "execution-engine-no-runtime-authority",
    sourceTrace: ["installation_contract", "static_tests_closeout", "shadow_mode_design"],
    evidenceRefs: ["runtimeAuthority=false", "productWiring=false", "registryWrite=false", "eveBrainConnection=false"],
    notes: [
      "no Runtime productivo",
      "no WorkMap",
      "no Significado",
      "no registry",
      "no diagnosis/export productivos",
    ],
  };
}

function sourceRoleEntity(): ExecutionEngineResolvedEntity {
  return {
    entityKind: "source_role_boundary",
    id: "execution-engine-source-role-boundary",
    sourceDocuments: ["D8", "EVE03", "EVE05", "D5", "D7", "D1"],
    sourceTrace: ["D8 present for SCR", "D1 contextual only for SCR", "EVE05 candidate not wired"],
    evidenceRefs: ["SCR-002", "STM6-016", "D1_contextual_guard_only"],
  };
}

function documentaryEntity(): ExecutionEngineResolvedEntity {
  return {
    entityKind: "documentary_satisfaction",
    id: "EXECUTION_ENGINE_RECORD_RULE_QA_SATISFACTORY",
    sourceTrace: ["record_rule_source_qa_v1_1", "static_package_tests_v1"],
    evidenceRefs: ["accepted=310", "pending_source_proof=0", "materialDifference=false"],
  };
}

function missingEntity(input: ExecutionEngineEvaluationInput): ExecutionEngineResolvedEntity {
  return {
    entityKind: "missing_record",
    id: input.recordId ?? input.recordType ?? "missing_record",
    recordType: input.recordType,
    recordId: input.recordId,
  };
}

function missingTraceEntity(input: ExecutionEngineEvaluationInput): ExecutionEngineResolvedEntity {
  return {
    entityKind: input.queryType === "validate_evidence_trace" ? "missing_source_trace" : "missing_source",
    id: input.recordId ?? input.recordType ?? "missing_source_trace",
    recordType: input.recordType,
    recordId: input.recordId,
  };
}

function missingRequested(
  input: ExecutionEngineEvaluationInput,
  entity: ExecutionEngineResolvedEntity | null,
): string[] {
  if (entity) return [];
  if (input.recordId) return [input.recordId];
  if (input.recordType) return [input.recordType];
  if (input.ruleId) return [input.ruleId];
  if (input.fieldName) return [input.fieldName];
  return ["record_or_source_trace"];
}

function requiredInputsFor(entity: ExecutionEngineResolvedEntity | null, missingReferences: string[]): string[] {
  if (missingReferences.length > 0) return missingReferences;
  if (!entity) return ["recordType_or_recordId_or_evidenceRefs"];
  return [];
}

function findingsFor(
  readinessState: ExecutionEngineReadinessState,
  resolved: boolean,
  gapFlags: string[],
): string[] {
  if (gapFlags.length > 0) return [`shadow_gap:${gapFlags.join(",")}`];
  return [resolved ? `shadow_resolved:${readinessState}` : `shadow_unresolved:${readinessState}`];
}

function auditEventsFor(
  input: ExecutionEngineEvaluationInput,
  readinessState: ExecutionEngineReadinessState,
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
