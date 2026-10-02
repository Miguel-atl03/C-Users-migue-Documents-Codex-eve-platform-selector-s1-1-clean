import {
  GATE_ENGINE_ALLOWED_ACTIONS,
  GATE_ENGINE_BLOCKED_ACTIONS,
  GATE_ENGINE_DOCUMENTARY_SATISFACTION,
  GATE_ENGINE_ENTITIES,
  GATE_ENGINE_NO_OVERREACH_GUARDS,
  GATE_ENGINE_PROTECTED_METADATA,
  GATE_ENGINE_SAFETY_FLAGS,
  GATE_ENGINE_SHADOW_CHIP_ID,
  GATE_ENGINE_SHADOW_MODE,
  GATE_ENGINE_SHADOW_VERSION,
} from "./fixtures.ts";
import type {
  GateEngineEvaluationInput,
  GateEngineEvaluationResult,
  GateEngineReadinessState,
  GateEngineResolvedEntity,
} from "./types.ts";

export function evaluateGateEngineShadow(input: GateEngineEvaluationInput): GateEngineEvaluationResult {
  if (input.mode !== GATE_ENGINE_SHADOW_MODE) {
    return resultFor(input, "gate_engine_gap_detected", false, null, ["invalid_mode"], ["mode"]);
  }

  if (documentarySatisfactionBroken()) {
    return resultFor(
      input,
      "documentary_satisfaction_broken",
      false,
      null,
      ["documentary_satisfaction_broken"],
      [],
    );
  }

  if (input.queryType === "resolve_gate") {
    const gate = findGate(input.gateId);
    return gate
      ? resultFor(input, "gate_engine_lookup_ready", true, gate, [], [])
      : resultFor(input, "gate_engine_lookup_not_found", false, null, ["gate_not_found"], missing(input.gateId, "gateId"));
  }

  if (input.queryType === "resolve_rule") {
    const rule = findRule(input.ruleId);
    return rule
      ? resultFor(input, "gate_engine_lookup_ready", true, rule, [], [])
      : resultFor(input, "gate_engine_lookup_not_found", false, null, ["rule_not_found"], missing(input.ruleId, "ruleId"));
  }

  if (input.queryType === "validate_documentary_satisfaction") {
    return resultFor(input, "documentary_satisfaction_confirmed", true, documentaryEntity(), [], []);
  }

  if (input.queryType === "validate_no_overreach") {
    const ok = allNoOverreachGuardsPass();
    return ok
      ? resultFor(input, "no_overreach_confirmed", true, noOverreachEntity(), [], [])
      : resultFor(input, "no_overreach_broken", false, noOverreachEntity(), ["no_overreach_broken"], []);
  }

  if (input.queryType === "validate_no_runtime_authority") {
    return resultFor(input, "documentary_satisfaction_confirmed", true, noCableadoEntity(), [], []);
  }

  if (input.queryType === "detect_gate_engine_gap") {
    const entity = findRequestedEntity(input);
    const gaps = detectGaps(input, entity);
    return gaps.length > 0
      ? resultFor(input, "gate_engine_gap_detected", false, entity, gaps, missingRequested(input, entity))
      : resultFor(input, "gate_engine_reference_valid", true, entity, [], []);
  }

  return validateReference(input);
}

function validateReference(input: GateEngineEvaluationInput): GateEngineEvaluationResult {
  const entity = findRequestedEntity(input);
  if (!entity) {
    return resultFor(input, "gate_engine_reference_missing", false, null, ["reference_not_found"], missingRequested(input, null));
  }

  if (input.context?.sourceProofMissing === true) {
    return resultFor(input, sourceMissingState(input), false, entity, ["source_proof_missing"], ["sourceTrace", "evidenceRefs"]);
  }

  if (!hasAnySourceTrace(input, entity)) {
    return resultFor(input, sourceMissingState(input), false, entity, ["source_proof_missing"], ["sourceTrace", "evidenceRefs"]);
  }

  if (input.queryType === "validate_atomic_rule") {
    return resultFor(input, "documentary_satisfaction_confirmed", true, entity, [], []);
  }

  return resultFor(input, "gate_engine_reference_valid", true, entity, [], []);
}

function resultFor(
  input: GateEngineEvaluationInput,
  readinessState: GateEngineReadinessState,
  resolved: boolean,
  entity: GateEngineResolvedEntity | null,
  gapFlags: string[],
  missingReferences: string[],
): GateEngineEvaluationResult {
  const sourceTrace = input.sourceTrace && input.sourceTrace.length > 0 ? input.sourceTrace : entity?.sourceTrace ?? [];
  const evidenceRefs = input.evidenceRefs && input.evidenceRefs.length > 0 ? input.evidenceRefs : entity?.evidenceRefs ?? [];

  return {
    version: GATE_ENGINE_SHADOW_VERSION,
    mode: GATE_ENGINE_SHADOW_MODE,
    chipId: GATE_ENGINE_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState,
    resolved,
    resolvedEntity: entity,
    missingReferences,
    gapFlags,
    sourceTrace,
    evidenceRefs,
    allowedActions: [...GATE_ENGINE_ALLOWED_ACTIONS],
    blockedActions: [...GATE_ENGINE_BLOCKED_ACTIONS],
    requiredInputs: requiredInputsFor(input, entity, missingReferences),
    findings: findingsFor(readinessState, resolved, gapFlags),
    auditEvents: auditEventsFor(input, readinessState, resolved),
    safetyFlags: { ...GATE_ENGINE_SAFETY_FLAGS },
    documentarySatisfaction: { ...GATE_ENGINE_DOCUMENTARY_SATISFACTION },
  };
}

function findGate(gateId: string | undefined): GateEngineResolvedEntity | null {
  if (!gateId) return null;
  return GATE_ENGINE_ENTITIES.find((entity) => entity.gateId === gateId || entity.id === gateId) ?? null;
}

function findRule(ruleId: string | undefined): GateEngineResolvedEntity | null {
  if (!ruleId) return null;
  return GATE_ENGINE_ENTITIES.find((entity) => entity.ruleId === ruleId || entity.id === ruleId) ?? null;
}

function findRequestedEntity(input: GateEngineEvaluationInput): GateEngineResolvedEntity | null {
  const queryEntityKind = entityKindForQuery(input.queryType);
  if (queryEntityKind) {
    const id = input.ruleId ?? input.gateId;
    const byKind = GATE_ENGINE_ENTITIES.find(
      (entity) => entity.entityKind === queryEntityKind && (entity.id === id || entity.ruleId === id || entity.gateId === id),
    );
    if (byKind) return byKind;
  }

  if (input.ruleId) return findRule(input.ruleId);
  if (input.gateId) return findGate(input.gateId);
  if (input.queryType === "validate_no_runtime_authority") return noCableadoEntity();
  if (input.queryType === "validate_no_overreach") return noOverreachEntity();
  return null;
}

function entityKindForQuery(queryType: GateEngineEvaluationInput["queryType"]): string | null {
  if (queryType === "validate_critical_route_gate") return "critical_route_gate";
  if (queryType === "validate_semantic_resolution_gate") return "semantic_resolution_gate";
  if (queryType === "validate_process_state_timer_gate") return "process_state_timer_gate";
  if (queryType === "validate_mmabp_conformance_gate") return "mmabp_conformance_rule";
  if (queryType === "validate_mmabp_consistency_gate") return "mmabp_consistency_rule";
  if (queryType === "validate_failure_guard") return "failure_guard";
  if (queryType === "validate_atomic_rule") return "atomic_rule";
  return null;
}

function hasAnySourceTrace(input: GateEngineEvaluationInput, entity: GateEngineResolvedEntity): boolean {
  const inputHasTrace = Boolean(input.sourceTrace && input.sourceTrace.length > 0);
  const inputHasEvidence = Boolean(input.evidenceRefs && input.evidenceRefs.length > 0);
  const entityHasTrace = Boolean(entity.sourceTrace && entity.sourceTrace.length > 0);
  const entityHasEvidence = Boolean(entity.evidenceRefs && entity.evidenceRefs.length > 0);
  return inputHasTrace || inputHasEvidence || entityHasTrace || entityHasEvidence;
}

function detectGaps(input: GateEngineEvaluationInput, entity: GateEngineResolvedEntity | null): string[] {
  const gaps: string[] = [];
  if ((input.gateId || input.module) && !entity) gaps.push("gate_not_found");
  if (input.ruleId && !entity) gaps.push("rule_not_found");
  if (input.context?.sourceProofMissing === true) gaps.push("source_proof_missing");
  if (entity && !hasAnySourceTrace(input, entity)) gaps.push("source_proof_missing");
  if (!input.gateId && !input.ruleId && !input.sourceTrace?.length && !input.evidenceRefs?.length) {
    gaps.push("insufficient_shadow_input");
  }
  return gaps;
}

function sourceMissingState(input: GateEngineEvaluationInput): GateEngineReadinessState {
  if (input.condition) return "gate_condition_missing_source";
  if (input.action) return "gate_action_missing_source";
  if (input.severity) return "gate_severity_missing_source";
  return "gate_engine_reference_missing";
}

function documentarySatisfactionBroken(): boolean {
  return (
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.status !== "satisfactory" ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsAccepted !== GATE_ENGINE_DOCUMENTARY_SATISFACTION.companionProofsExpected ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesAccepted !== GATE_ENGINE_DOCUMENTARY_SATISFACTION.atomicRulesExpected ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.mismatches !== 0 ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInChip !== 0 ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.missingInSource !== 0 ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.pendingSourceProof !== 0 ||
    GATE_ENGINE_DOCUMENTARY_SATISFACTION.overreachDetected
  );
}

function allNoOverreachGuardsPass(): boolean {
  return (
    GATE_ENGINE_NO_OVERREACH_GUARDS.d1NotSubstitutedByVsmOrAhe &&
    GATE_ENGINE_NO_OVERREACH_GUARDS.vsm1NoClosedDiagnosis &&
    GATE_ENGINE_NO_OVERREACH_GUARDS.ahe1NoClosedDiagnosis &&
    GATE_ENGINE_NO_OVERREACH_GUARDS.d3NotPrimaryMethodologicalSource &&
    GATE_ENGINE_NO_OVERREACH_GUARDS.d4NotPrimaryMethodologicalSource
  );
}

function noOverreachEntity(): GateEngineResolvedEntity {
  return {
    entityKind: "no_overreach_guard",
    id: "D1-VSM1-AHE1-D3-D4",
    sourceDocuments: ["D1", "VSM1", "AHE1", "D3", "D4"],
    sourceTrace: ["D1:no-diagnosis", "VSM1:guard-only", "AHE1:guard-only", "D3:boundary-only", "D4:technical-contract"],
    evidenceRefs: ["no_overreach_d1_vsm1_ahe1", "no_primary_methodology_d3_d4"],
    notes: [
      "D1 does not substitute VSM/AHE.",
      "VSM1 does not produce closed VSM diagnosis.",
      "AHE1 does not produce closed AHE diagnosis.",
      "D3/D4 are not primary methodology sources.",
    ],
  };
}

function noCableadoEntity(): GateEngineResolvedEntity {
  return {
    entityKind: "no_cableado_guard",
    id: "gate-engine-no-runtime-authority",
    sourceTrace: ["installation_contract", "static_tests_closeout"],
    evidenceRefs: [
      "runtimeAuthority=false",
      "productWiring=false",
      "registryWrite=false",
      "eveBrainConnection=false",
    ],
    notes: [
      `runtimeAuthority=${GATE_ENGINE_PROTECTED_METADATA.noCableado.runtimeAuthority}`,
      `productWiring=${GATE_ENGINE_PROTECTED_METADATA.noCableado.productWiring}`,
      `registryWrite=${GATE_ENGINE_PROTECTED_METADATA.noCableado.registryWrite}`,
      `eveBrainConnection=${GATE_ENGINE_PROTECTED_METADATA.noCableado.eveBrainConnection}`,
    ],
  };
}

function documentaryEntity(): GateEngineResolvedEntity {
  return {
    entityKind: "documentary_satisfaction",
    id: "GATE_ENGINE_RECORD_RULE_QA_SATISFACTORY",
    sourceTrace: ["independent_record_rule_source_qa_v1_4", "static_package_tests_v1"],
    evidenceRefs: ["companionProofs=157/157", "atomicRules=130/130", "previousRejectedRecords=31/31"],
  };
}

function missing(value: string | undefined, fallback: string): string[] {
  return [value && value.length > 0 ? value : fallback];
}

function missingRequested(input: GateEngineEvaluationInput, entity: GateEngineResolvedEntity | null): string[] {
  if (entity) return [];
  if (input.ruleId) return [input.ruleId];
  if (input.gateId) return [input.gateId];
  if (input.module) return [input.module];
  return ["gateId_or_ruleId_or_evidence"];
}

function requiredInputsFor(
  input: GateEngineEvaluationInput,
  entity: GateEngineResolvedEntity | null,
  missingReferences: string[],
): string[] {
  if (missingReferences.length > 0) return missingReferences;
  if (!entity && input.queryType !== "validate_documentary_satisfaction") return ["gateId_or_ruleId"];
  return [];
}

function findingsFor(
  readinessState: GateEngineReadinessState,
  resolved: boolean,
  gapFlags: string[],
): string[] {
  if (gapFlags.length > 0) return [`shadow_gap:${gapFlags.join(",")}`];
  return [resolved ? `shadow_resolved:${readinessState}` : `shadow_unresolved:${readinessState}`];
}

function auditEventsFor(
  input: GateEngineEvaluationInput,
  readinessState: GateEngineReadinessState,
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
