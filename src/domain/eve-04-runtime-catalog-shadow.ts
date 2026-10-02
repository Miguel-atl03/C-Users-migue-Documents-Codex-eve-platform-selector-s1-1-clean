export type RuntimeCatalogShadowMode = "runtime_catalog_shadow";

export type RuntimeCatalogQueryType =
  | "resolve_runtime_interaction"
  | "resolve_base_interaction"
  | "resolve_causal_interaction"
  | "validate_ux_subfield_structure"
  | "validate_branching_rule"
  | "validate_branching_score"
  | "validate_readiness_reentry"
  | "validate_source_coverage"
  | "validate_ccov_001"
  | "validate_cvar_001"
  | "detect_runtime_catalog_gap"
  | "validate_no_runtime_authority";

export type RuntimeCatalogReadinessState =
  | "runtime_catalog_lookup_ready"
  | "runtime_catalog_lookup_not_found"
  | "runtime_catalog_reference_valid"
  | "runtime_catalog_reference_missing"
  | "runtime_catalog_gap_detected"
  | "branching_rule_allows"
  | "branching_rule_blocks"
  | "causal_budget_available"
  | "causal_budget_exhausted"
  | "readiness_state_valid"
  | "readiness_state_invalid"
  | "documentary_satisfaction_confirmed"
  | "documentary_satisfaction_broken"
  | "manual_review_required"
  | "reentry_required";

export type RuntimeCatalogAllowedAction =
  | "read_catalog"
  | "return_shadow_trace"
  | "report_gap"
  | "request_missing_reference"
  | "request_manual_review";

export type RuntimeCatalogBlockedAction =
  | "block_user_flow"
  | "modify_payload"
  | "write_registry"
  | "modify_catalog"
  | "trigger_runtime"
  | "trigger_diagnosis"
  | "trigger_export"
  | "connect_eve_brain"
  | "mutate_workmap"
  | "mutate_significado";

export type RuntimeCatalogGapFlag =
  | "DOCUMENTARY_SATISFACTION_BROKEN"
  | "RUNTIME_INTERACTION_NOT_FOUND"
  | "BASE_INTERACTION_NOT_FOUND"
  | "CAUSAL_INTERACTION_NOT_FOUND"
  | "UX_SUBFIELD_STRUCTURE_MISSING"
  | "BRANCHING_RULE_MISSING"
  | "BRANCHING_SCORE_MISSING"
  | "BRANCHING_BLOCKED_BY_CURIOSITY"
  | "CAUSAL_BUDGET_EXHAUSTED"
  | "READINESS_STATE_NOT_FOUND"
  | "SOURCE_COVERAGE_BROKEN"
  | "CCOV_001_BROKEN"
  | "CVAR_001_BROKEN"
  | "RUNTIME_AUTHORITY_DETECTED"
  | "INVALID_SHADOW_MODE";

export type RuntimeCatalogDocumentarySatisfaction = {
  status: "satisfactory" | "unsatisfactory";
  mismatches: number;
  missingInChip: number;
  missingInSource: number;
  pendingSourceProof: number;
  protectedByStaticTests: boolean;
};

export type RuntimeCatalogSafetyFlags = {
  canBlockUserFlow: false;
  canModifyPayload: false;
  canWriteRegistry: false;
  canModifyCatalog: false;
  canTriggerRuntime: false;
  canTriggerDiagnosis: false;
  canTriggerExport: false;
  canConnectEveBrain: false;
  runtimeAuthority: false;
};

export type RuntimeCatalogSourceTrace = {
  chipId: typeof RUNTIME_CATALOG_SHADOW_CHIP_ID;
  sourceArtifacts: string[];
  sourceDocuments: string[];
  packageFile: string;
  documentarySatisfactionMatrix: string;
  sourceKind: "mixed";
  originalSourcePolicy: {
    D6: "implementable_exact_source";
    D5: "governance_boundary";
    D7: "reduction_boundary";
    D8_Phase3: "genealogy";
    D4: "technical_boundary";
    D3: "downstream_boundary";
    D1: "MMABP_guard_only";
    VSM1: "methodological_guard_only";
    UP_B0_to_UP_B7: "upstream_definition_evidence";
  };
};

export type RuntimeCatalogAuditEvent = {
  eventId: string;
  eventType:
    | "runtime_catalog_shadow_evaluated"
    | "runtime_catalog_lookup_ready"
    | "runtime_catalog_lookup_not_found"
    | "runtime_catalog_reference_valid"
    | "runtime_catalog_reference_missing"
    | "runtime_catalog_gap_detected"
    | "runtime_catalog_branching_allows"
    | "runtime_catalog_branching_blocks"
    | "runtime_catalog_documentary_satisfaction_confirmed"
    | "runtime_catalog_documentary_satisfaction_broken"
    | "runtime_catalog_manual_review_required";
  message: string;
  sourceTrace: RuntimeCatalogSourceTrace;
};

export type RuntimeCatalogFinding = {
  findingId: string;
  severity: "info" | "warning" | "blocker";
  readinessState: RuntimeCatalogReadinessState;
  message: string;
  sourceTrace: RuntimeCatalogSourceTrace;
};

export type RuntimeCatalogEvaluationInput = {
  mode: RuntimeCatalogShadowMode;
  queryType: RuntimeCatalogQueryType;
  runtimeInteractionId?: string;
  sourceNodeId?: string;
  sourceCode?: string;
  variableId?: string;
  branchRuleId?: string;
  readinessState?: string;
  evidenceRefs?: string[];
  sourceTrace?: Partial<RuntimeCatalogSourceTrace>;
  requestedOutputType?: string;
  context?: {
    hasStructuralEvidence?: boolean;
    hasCriticalRoute?: boolean;
    hasContradiction?: boolean;
    hasGap?: boolean;
    curiosityOnly?: boolean;
    causalQuestionsUsed?: number;
    maxCausalQuestions?: number;
    scoreId?: string;
    [key: string]: unknown;
  };
};

export type RuntimeCatalogEntity = Record<string, unknown> | RuntimeCatalogEntity[] | null;

export type RuntimeCatalogEvaluationResult = {
  version: typeof RUNTIME_CATALOG_SHADOW_VERSION;
  mode: RuntimeCatalogShadowMode;
  chipId: typeof RUNTIME_CATALOG_SHADOW_CHIP_ID;
  queryType: RuntimeCatalogQueryType;
  readinessState: RuntimeCatalogReadinessState;
  resolved: boolean;
  resolvedEntity: RuntimeCatalogEntity;
  missingReferences: string[];
  gapFlags: RuntimeCatalogGapFlag[];
  sourceTrace: RuntimeCatalogSourceTrace;
  evidenceRefs: string[];
  allowedActions: RuntimeCatalogAllowedAction[];
  blockedActions: RuntimeCatalogBlockedAction[];
  requiredInputs: string[];
  findings: RuntimeCatalogFinding[];
  auditEvents: RuntimeCatalogAuditEvent[];
  safetyFlags: RuntimeCatalogSafetyFlags;
  documentarySatisfaction: RuntimeCatalogDocumentarySatisfaction;
};

export type RuntimeCatalogSourceCoverage = {
  sourceNodesRuntimeUnique: number;
  sourceCodesRuntimeUnique: number;
  sourceNodesCovered: number;
  sourceCodesCovered: number;
  pendingSourceNode: number;
  pendingSourceCode: number;
  inventedSourceReference: number;
  satisfactionStatus: "satisfactory" | "unsatisfactory";
};

export type RuntimeCatalogGuardrails = {
  runtimeAuthority: false;
  registryWrite: false;
  productWiring: false;
  eveBrainConnection: false;
};

export type RuntimeCatalogSourcePolicy = RuntimeCatalogSourceTrace["originalSourcePolicy"];

export type RuntimeCatalogShadowSnapshot = {
  chipId: typeof RUNTIME_CATALOG_SHADOW_CHIP_ID;
  version: string;
  status: string;
  installationStatus: string;
  packageFile: string;
  sourceArtifacts: string[];
  sourceDocuments: string[];
  documentarySatisfaction: RuntimeCatalogDocumentarySatisfaction;
  runtimeInteractionsBase40: Record<string, unknown>[];
  runtimeInteractionsCausal20: Record<string, unknown>[];
  uxSubfieldStructure: Record<string, unknown>[];
  branchingRules: Record<string, unknown>[];
  branchingScores: Record<string, unknown>[];
  readinessGapsReentry: Record<string, unknown>[];
  sourceCoverage: RuntimeCatalogSourceCoverage;
  ccov001Trace: Record<string, unknown>;
  cvar001Definitions: Record<string, unknown>[];
  guardrails: RuntimeCatalogGuardrails;
  sourcePolicy: RuntimeCatalogSourcePolicy;
};

export const RUNTIME_CATALOG_SHADOW_CHIP_ID = "EVE-04-RUNTIME-CATALOG";
export const RUNTIME_CATALOG_SHADOW_MODE = "runtime_catalog_shadow";
export const RUNTIME_CATALOG_SHADOW_VERSION = "0.2.0-shadow";

export const RUNTIME_CATALOG_SHADOW_SAFETY_FLAGS: RuntimeCatalogSafetyFlags = {
  canBlockUserFlow: false,
  canModifyPayload: false,
  canWriteRegistry: false,
  canModifyCatalog: false,
  canTriggerRuntime: false,
  canTriggerDiagnosis: false,
  canTriggerExport: false,
  canConnectEveBrain: false,
  runtimeAuthority: false,
};

const ALLOWED_ACTIONS: RuntimeCatalogAllowedAction[] = [
  "read_catalog",
  "return_shadow_trace",
  "report_gap",
  "request_missing_reference",
  "request_manual_review",
];

const BLOCKED_ACTIONS: RuntimeCatalogBlockedAction[] = [
  "block_user_flow",
  "modify_payload",
  "write_registry",
  "modify_catalog",
  "trigger_runtime",
  "trigger_diagnosis",
  "trigger_export",
  "connect_eve_brain",
  "mutate_workmap",
  "mutate_significado",
];

export const RUNTIME_CATALOG_SOURCE_POLICY: RuntimeCatalogSourcePolicy = {
  D6: "implementable_exact_source",
  D5: "governance_boundary",
  D7: "reduction_boundary",
  D8_Phase3: "genealogy",
  D4: "technical_boundary",
  D3: "downstream_boundary",
  D1: "MMABP_guard_only",
  VSM1: "methodological_guard_only",
  UP_B0_to_UP_B7: "upstream_definition_evidence",
};

export function evaluateRuntimeCatalogShadow(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
): RuntimeCatalogEvaluationResult {
  const sourceTrace = buildSourceTrace(input, catalog);

  if (input.mode !== RUNTIME_CATALOG_SHADOW_MODE) {
    return result(input, catalog, sourceTrace, {
      readinessState: "manual_review_required",
      resolved: false,
      gapFlags: ["INVALID_SHADOW_MODE"],
      missingReferences: ["mode"],
      requiredInputs: ["mode: runtime_catalog_shadow"],
      findingMessage: "Input mode is not the runtime catalog shadow mode.",
      findingSeverity: "blocker",
    });
  }

  if (!isDocumentarySatisfactionIntact(catalog.documentarySatisfaction)) {
    return result(input, catalog, sourceTrace, {
      readinessState: "documentary_satisfaction_broken",
      resolved: false,
      gapFlags: ["DOCUMENTARY_SATISFACTION_BROKEN"],
      missingReferences: ["documentarySatisfaction"],
      requiredInputs: ["satisfactory documentary matrix"],
      findingMessage: "Documentary satisfaction is not satisfactory; shadow result cannot be promoted.",
      findingSeverity: "blocker",
    });
  }

  switch (input.queryType) {
    case "resolve_runtime_interaction":
      return resolveRuntimeInteraction(input, catalog, sourceTrace);
    case "resolve_base_interaction":
      return resolveBaseInteraction(input, catalog, sourceTrace);
    case "resolve_causal_interaction":
      return resolveCausalInteraction(input, catalog, sourceTrace);
    case "validate_ux_subfield_structure":
      return validateUxSubfieldStructure(input, catalog, sourceTrace);
    case "validate_branching_rule":
      return validateBranchingRule(input, catalog, sourceTrace);
    case "validate_branching_score":
      return validateBranchingScore(input, catalog, sourceTrace);
    case "validate_readiness_reentry":
      return validateReadinessReentry(input, catalog, sourceTrace);
    case "validate_source_coverage":
      return validateSourceCoverage(input, catalog, sourceTrace);
    case "validate_ccov_001":
      return validateCcov001(input, catalog, sourceTrace);
    case "validate_cvar_001":
      return validateCvar001(input, catalog, sourceTrace);
    case "detect_runtime_catalog_gap":
      return detectRuntimeCatalogGap(input, catalog, sourceTrace);
    case "validate_no_runtime_authority":
      return validateNoRuntimeAuthority(input, catalog, sourceTrace);
  }
}

function resolveRuntimeInteraction(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const entity =
    findByRuntimeInteractionId(catalog.runtimeInteractionsBase40, input.runtimeInteractionId) ??
    findByRuntimeInteractionId(catalog.runtimeInteractionsCausal20, input.runtimeInteractionId);
  return entity
    ? result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_ready",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "Runtime interaction resolved in shadow catalog.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_not_found",
        resolved: false,
        gapFlags: ["RUNTIME_INTERACTION_NOT_FOUND"],
        missingReferences: [input.runtimeInteractionId ?? "runtimeInteractionId"],
        requiredInputs: ["existing runtimeInteractionId"],
        findingMessage: "Runtime interaction was not found in base or causal catalog.",
        findingSeverity: "warning",
      });
}

function resolveBaseInteraction(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const entity = findByRuntimeInteractionId(
    catalog.runtimeInteractionsBase40,
    input.runtimeInteractionId,
  );
  return entity
    ? result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_ready",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "Base runtime interaction resolved.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_not_found",
        resolved: false,
        gapFlags: ["BASE_INTERACTION_NOT_FOUND"],
        missingReferences: [input.runtimeInteractionId ?? "runtimeInteractionId"],
        requiredInputs: ["existing base runtimeInteractionId"],
        findingMessage: "Base runtime interaction was not found.",
        findingSeverity: "warning",
      });
}

function resolveCausalInteraction(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const entity = findByRuntimeInteractionId(
    catalog.runtimeInteractionsCausal20,
    input.runtimeInteractionId,
  );
  return entity
    ? result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_ready",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "Causal runtime interaction resolved.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_lookup_not_found",
        resolved: false,
        gapFlags: ["CAUSAL_INTERACTION_NOT_FOUND"],
        missingReferences: [input.runtimeInteractionId ?? "runtimeInteractionId"],
        requiredInputs: ["existing causal runtimeInteractionId"],
        findingMessage: "Causal runtime interaction was not found.",
        findingSeverity: "warning",
      });
}

function validateUxSubfieldStructure(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const entity = findByRuntimeInteractionId(
    catalog.uxSubfieldStructure,
    input.runtimeInteractionId,
  );
  const hasSubfields = Boolean(
    entity && String(entity.subfield_structure ?? "").trim().length > 0,
  );
  return entity && hasSubfields
    ? result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_reference_valid",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "UX subfield structure has separated structure and provenance.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_reference_missing",
        resolved: false,
        gapFlags: ["UX_SUBFIELD_STRUCTURE_MISSING"],
        missingReferences: [input.runtimeInteractionId ?? "runtimeInteractionId"],
        requiredInputs: ["runtime interaction with UX subfield structure"],
        findingMessage: "UX subfield structure is missing or lacks separated subfields.",
        findingSeverity: "warning",
      });
}

function validateBranchingRule(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const context = input.context ?? {};
  const structuralSignal =
    context.hasStructuralEvidence === true ||
    context.hasCriticalRoute === true ||
    context.hasContradiction === true ||
    context.hasGap === true;
  const curiosityOnly = context.curiosityOnly === true;
  const entity =
    findByAnyString(catalog.branchingRules, input.branchRuleId) ??
    catalog.branchingRules[0] ??
    null;

  if (curiosityOnly && !structuralSignal) {
    return result(input, catalog, sourceTrace, {
      readinessState: "branching_rule_blocks",
      resolved: true,
      resolvedEntity: entity,
      gapFlags: ["BRANCHING_BLOCKED_BY_CURIOSITY"],
      findingMessage: "Branching blocked because the context is curiosity-only without structural evidence.",
      findingSeverity: "warning",
    });
  }

  if (entity && structuralSignal) {
    return result(input, catalog, sourceTrace, {
      readinessState: "branching_rule_allows",
      resolved: true,
      resolvedEntity: entity,
      findingMessage: "Branching allowed because structural evidence is present.",
    });
  }

  return result(input, catalog, sourceTrace, {
    readinessState: "runtime_catalog_reference_missing",
    resolved: false,
    gapFlags: ["BRANCHING_RULE_MISSING"],
    missingReferences: [input.branchRuleId ?? "branchRuleId"],
    requiredInputs: ["branching rule and structural evidence"],
    findingMessage: "Branching rule could not be validated.",
    findingSeverity: "warning",
  });
}

function validateBranchingScore(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const used = numberValue(input.context?.causalQuestionsUsed);
  const max = numberValue(input.context?.maxCausalQuestions) ?? 20;
  if (used != null) {
    return result(input, catalog, sourceTrace, {
      readinessState: used >= max ? "causal_budget_exhausted" : "causal_budget_available",
      resolved: true,
      resolvedEntity: { causalQuestionsUsed: used, maxCausalQuestions: max },
      gapFlags: used >= max ? ["CAUSAL_BUDGET_EXHAUSTED"] : [],
      findingMessage:
        used >= max
          ? "Causal budget is exhausted."
          : "Causal budget remains available.",
      findingSeverity: used >= max ? "warning" : "info",
    });
  }

  const entity =
    findByAnyString(catalog.branchingScores, input.branchRuleId) ??
    findByAnyString(catalog.branchingScores, input.context?.scoreId);
  return entity
    ? result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_reference_valid",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "Branching score reference is valid.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "runtime_catalog_reference_missing",
        resolved: false,
        gapFlags: ["BRANCHING_SCORE_MISSING"],
        missingReferences: [input.branchRuleId ?? String(input.context?.scoreId ?? "branchRuleId")],
        requiredInputs: ["existing branching score"],
        findingMessage: "Branching score was not found.",
        findingSeverity: "warning",
      });
}

function validateReadinessReentry(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const entity = catalog.readinessGapsReentry.find(
    (item) => String(item.readiness_state ?? "") === String(input.readinessState ?? ""),
  );
  return entity
    ? result(input, catalog, sourceTrace, {
        readinessState: "readiness_state_valid",
        resolved: true,
        resolvedEntity: entity,
        findingMessage: "Readiness/reentry state exists in runtime catalog.",
      })
    : result(input, catalog, sourceTrace, {
        readinessState: "readiness_state_invalid",
        resolved: false,
        gapFlags: ["READINESS_STATE_NOT_FOUND"],
        missingReferences: [input.readinessState ?? "readinessState"],
        requiredInputs: ["existing readinessState"],
        findingMessage: "Readiness/reentry state was not found.",
        findingSeverity: "warning",
      });
}

function validateSourceCoverage(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const coverage = catalog.sourceCoverage;
  const intact =
    coverage.satisfactionStatus === "satisfactory" &&
    coverage.sourceNodesRuntimeUnique === 164 &&
    coverage.sourceCodesRuntimeUnique === 164 &&
    coverage.sourceNodesCovered === 164 &&
    coverage.sourceCodesCovered === 164 &&
    coverage.pendingSourceNode === 0 &&
    coverage.pendingSourceCode === 0 &&
    coverage.inventedSourceReference === 0;

  return result(input, catalog, sourceTrace, {
    readinessState: intact
      ? "documentary_satisfaction_confirmed"
      : "documentary_satisfaction_broken",
    resolved: intact,
    resolvedEntity: coverage,
    gapFlags: intact ? [] : ["SOURCE_COVERAGE_BROKEN"],
    findingMessage: intact
      ? "Source node/code coverage is complete at 164/164."
      : "Source node/code coverage is broken.",
    findingSeverity: intact ? "info" : "blocker",
  });
}

function validateCcov001(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const trace = catalog.ccov001Trace;
  const targetFields = isRecord(trace.target_fields) ? trace.target_fields : {};
  const evidence = isRecord(trace.evidence) ? trace.evidence : {};
  const intact =
    trace.status === "satisfactory" &&
    trace.source_node_exact === "B6_6_8" &&
    trace.source_code_exact === "6.8" &&
    trace.runtime_interaction_exact === "B6-Q38" &&
    String(targetFields.subfield_structure ?? "").includes("trench_phrase") &&
    evidence.package_json_B6_Q38_contains_trench_phrase === true;

  return result(input, catalog, sourceTrace, {
    readinessState: intact
      ? "documentary_satisfaction_confirmed"
      : "documentary_satisfaction_broken",
    resolved: intact,
    resolvedEntity: trace,
    gapFlags: intact ? [] : ["CCOV_001_BROKEN"],
    findingMessage: intact
      ? "CCOV-001 is satisfied for B6-Q38 / B6_6_8 / 6.8 / trench_phrase."
      : "CCOV-001 trace is incomplete.",
    findingSeverity: intact ? "info" : "blocker",
  });
}

function validateCvar001(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const intact = catalog.cvar001Definitions.length === 33;

  return result(input, catalog, sourceTrace, {
    readinessState: intact
      ? "documentary_satisfaction_confirmed"
      : "documentary_satisfaction_broken",
    resolved: intact,
    resolvedEntity: { definitionCount: catalog.cvar001Definitions.length },
    gapFlags: intact ? [] : ["CVAR_001_BROKEN"],
    findingMessage: intact
      ? "CVAR-001 has 33/33 resolved definitions."
      : "CVAR-001 definition count is not 33.",
    findingSeverity: intact ? "info" : "blocker",
  });
}

function detectRuntimeCatalogGap(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const gapFlags: RuntimeCatalogGapFlag[] = [];
  if (!isDocumentarySatisfactionIntact(catalog.documentarySatisfaction)) {
    gapFlags.push("DOCUMENTARY_SATISFACTION_BROKEN");
  }
  if (catalog.sourceCoverage.satisfactionStatus !== "satisfactory") {
    gapFlags.push("SOURCE_COVERAGE_BROKEN");
  }
  if (input.runtimeInteractionId) {
    const exists =
      findByRuntimeInteractionId(catalog.runtimeInteractionsBase40, input.runtimeInteractionId) ??
      findByRuntimeInteractionId(catalog.runtimeInteractionsCausal20, input.runtimeInteractionId);
    if (!exists) {
      gapFlags.push("RUNTIME_INTERACTION_NOT_FOUND");
    }
  }

  return result(input, catalog, sourceTrace, {
    readinessState: gapFlags.length > 0
      ? "runtime_catalog_gap_detected"
      : "documentary_satisfaction_confirmed",
    resolved: gapFlags.length === 0,
    resolvedEntity: { gapCount: gapFlags.length },
    gapFlags,
    findingMessage:
      gapFlags.length > 0
        ? "Runtime catalog shadow detected one or more gaps."
        : "Runtime catalog shadow did not detect a current gap.",
    findingSeverity: gapFlags.length > 0 ? "warning" : "info",
  });
}

function validateNoRuntimeAuthority(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
) {
  const intact =
    catalog.guardrails.runtimeAuthority === false &&
    catalog.guardrails.registryWrite === false &&
    catalog.guardrails.productWiring === false &&
    catalog.guardrails.eveBrainConnection === false;

  return result(input, catalog, sourceTrace, {
    readinessState: intact
      ? "documentary_satisfaction_confirmed"
      : "documentary_satisfaction_broken",
    resolved: intact,
    resolvedEntity: catalog.guardrails,
    gapFlags: intact ? [] : ["RUNTIME_AUTHORITY_DETECTED"],
    findingMessage: intact
      ? "Runtime authority, registry, product wiring and EVE brain connection remain disabled."
      : "A forbidden authority or wiring flag was detected.",
    findingSeverity: intact ? "info" : "blocker",
  });
}

function result(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
  sourceTrace: RuntimeCatalogSourceTrace,
  options: {
    readinessState: RuntimeCatalogReadinessState;
    resolved: boolean;
    resolvedEntity?: RuntimeCatalogEntity;
    missingReferences?: string[];
    gapFlags?: RuntimeCatalogGapFlag[];
    requiredInputs?: string[];
    findingMessage: string;
    findingSeverity?: "info" | "warning" | "blocker";
  },
): RuntimeCatalogEvaluationResult {
  const finding: RuntimeCatalogFinding = {
    findingId: `${input.queryType}:${options.readinessState}`,
    severity: options.findingSeverity ?? "info",
    readinessState: options.readinessState,
    message: options.findingMessage,
    sourceTrace,
  };

  return {
    version: RUNTIME_CATALOG_SHADOW_VERSION,
    mode: RUNTIME_CATALOG_SHADOW_MODE,
    chipId: RUNTIME_CATALOG_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState: options.readinessState,
    resolved: options.resolved,
    resolvedEntity: options.resolvedEntity ?? null,
    missingReferences: options.missingReferences ?? [],
    gapFlags: options.gapFlags ?? [],
    sourceTrace,
    evidenceRefs: input.evidenceRefs ?? [],
    allowedActions: [...ALLOWED_ACTIONS],
    blockedActions: [...BLOCKED_ACTIONS],
    requiredInputs: options.requiredInputs ?? [],
    findings: [finding],
    auditEvents: [
      {
        eventId: `${input.queryType}:evaluated`,
        eventType: eventTypeFor(options.readinessState),
        message: options.findingMessage,
        sourceTrace,
      },
    ],
    safetyFlags: { ...RUNTIME_CATALOG_SHADOW_SAFETY_FLAGS },
    documentarySatisfaction: { ...catalog.documentarySatisfaction },
  };
}

function buildSourceTrace(
  input: RuntimeCatalogEvaluationInput,
  catalog: RuntimeCatalogShadowSnapshot,
): RuntimeCatalogSourceTrace {
  return {
    chipId: RUNTIME_CATALOG_SHADOW_CHIP_ID,
    sourceArtifacts: [
      ...new Set([
        ...catalog.sourceArtifacts,
        ...(input.sourceTrace?.sourceArtifacts ?? []),
      ]),
    ],
    sourceDocuments: [
      ...new Set([
        ...catalog.sourceDocuments,
        ...(input.sourceTrace?.sourceDocuments ?? []),
      ]),
    ],
    packageFile: input.sourceTrace?.packageFile ?? catalog.packageFile,
    documentarySatisfactionMatrix:
      input.sourceTrace?.documentarySatisfactionMatrix ??
      "docs/audits/_eve_04_runtime_catalog_documentary_satisfaction_matrix_v1.json",
    sourceKind: "mixed",
    originalSourcePolicy: RUNTIME_CATALOG_SOURCE_POLICY,
  };
}

function isDocumentarySatisfactionIntact(
  documentarySatisfaction: RuntimeCatalogDocumentarySatisfaction,
) {
  return (
    documentarySatisfaction.status === "satisfactory" &&
    documentarySatisfaction.mismatches === 0 &&
    documentarySatisfaction.missingInChip === 0 &&
    documentarySatisfaction.missingInSource === 0 &&
    documentarySatisfaction.pendingSourceProof === 0 &&
    documentarySatisfaction.protectedByStaticTests === true
  );
}

function findByRuntimeInteractionId(records: Record<string, unknown>[], id: unknown) {
  return records.find((record) => String(record.runtime_interaction_id ?? "") === String(id ?? ""));
}

function findByAnyString(records: Record<string, unknown>[], value: unknown) {
  const expected = String(value ?? "");
  if (!expected) {
    return undefined;
  }

  return records.find((record) =>
    Object.values(record).some((item) => String(item) === expected),
  );
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function eventTypeFor(
  readinessState: RuntimeCatalogReadinessState,
): RuntimeCatalogAuditEvent["eventType"] {
  switch (readinessState) {
    case "runtime_catalog_lookup_ready":
      return "runtime_catalog_lookup_ready";
    case "runtime_catalog_lookup_not_found":
      return "runtime_catalog_lookup_not_found";
    case "runtime_catalog_reference_valid":
    case "readiness_state_valid":
    case "causal_budget_available":
      return "runtime_catalog_reference_valid";
    case "runtime_catalog_reference_missing":
    case "readiness_state_invalid":
    case "causal_budget_exhausted":
      return "runtime_catalog_reference_missing";
    case "runtime_catalog_gap_detected":
      return "runtime_catalog_gap_detected";
    case "branching_rule_allows":
      return "runtime_catalog_branching_allows";
    case "branching_rule_blocks":
      return "runtime_catalog_branching_blocks";
    case "documentary_satisfaction_confirmed":
      return "runtime_catalog_documentary_satisfaction_confirmed";
    case "documentary_satisfaction_broken":
      return "runtime_catalog_documentary_satisfaction_broken";
    case "manual_review_required":
    case "reentry_required":
      return "runtime_catalog_manual_review_required";
  }
}
