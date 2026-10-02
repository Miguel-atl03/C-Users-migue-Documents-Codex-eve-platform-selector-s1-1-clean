export type CanonicalCatalogShadowMode = "canonical_catalog_shadow";

export type CanonicalCatalogQueryType =
  | "resolve_node"
  | "resolve_source_code"
  | "resolve_canonical_variable"
  | "validate_node_variable_map"
  | "validate_critical_route"
  | "validate_epistemic_policy"
  | "validate_source_document"
  | "validate_source_target_map"
  | "validate_vsm_guard"
  | "detect_catalog_gap";

export type CanonicalCatalogReadinessState =
  | "catalog_lookup_ready"
  | "catalog_lookup_not_found"
  | "catalog_reference_valid"
  | "catalog_reference_missing"
  | "catalog_gap_detected"
  | "epistemic_policy_allows"
  | "epistemic_policy_blocks"
  | "critical_route_found"
  | "critical_route_missing"
  | "manual_review_required"
  | "reentry_required";

export type CanonicalCatalogSourceId = "D8" | "D6" | "D5" | "D7" | "VSM1";

export type CanonicalCatalogSourceTrace = {
  chipId: typeof CANONICAL_CATALOG_SHADOW_CHIP_ID;
  sourceArtifacts: string[];
  sourceDocuments: CanonicalCatalogSourceId[];
  registryFile?: string;
  sourceKind: "primary" | "compatibility_boundary" | "governance_boundary" | "architecture_boundary" | "methodological_guard" | "mixed";
  originalSourcePolicy: {
    D8: "primary";
    D6: "compatibility_boundary";
    D5: "governance_boundary";
    D7: "architecture_boundary";
    VSM1: "methodological_guard_only";
  };
};

export type CanonicalCatalogEvaluationInput = {
  mode: CanonicalCatalogShadowMode;
  queryType: CanonicalCatalogQueryType;
  nodeId?: string;
  sourceCode?: string;
  variableId?: string;
  routeId?: string;
  policyId?: string;
  sourceDocumentId?: string;
  sourceTargetId?: string;
  guardId?: string;
  evidenceRefs?: string[];
  sourceTrace?: Partial<CanonicalCatalogSourceTrace>;
  requestedOutputType?: string;
  context?: {
    evidenceStatus?: "confirmed" | "unconfirmed_ai" | "unknown";
    hardEvidenceRequested?: boolean;
    [key: string]: unknown;
  };
};

export type CanonicalCatalogSafetyFlags = {
  canBlockUserFlow: false;
  canModifyPayload: false;
  canWriteRegistry: false;
  canModifyCatalog: false;
  canTriggerRuntime: false;
  canTriggerDiagnosis: false;
  canTriggerExport: false;
  runtimeAuthority: false;
};

export type CanonicalCatalogAuditEvent = {
  eventId: string;
  eventType:
    | "canonical_catalog_shadow_evaluated"
    | "canonical_catalog_lookup_ready"
    | "canonical_catalog_lookup_not_found"
    | "canonical_catalog_reference_valid"
    | "canonical_catalog_reference_missing"
    | "canonical_catalog_gap_detected"
    | "canonical_catalog_policy_allows"
    | "canonical_catalog_policy_blocks"
    | "canonical_catalog_manual_review_required";
  message: string;
  sourceTrace: CanonicalCatalogSourceTrace;
};

export type CanonicalCatalogFinding = {
  findingId: string;
  severity: "info" | "warning" | "blocker";
  readinessState: CanonicalCatalogReadinessState;
  message: string;
  sourceTrace: CanonicalCatalogSourceTrace;
};

export type CanonicalCatalogGapFlag =
  | "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED"
  | "NODE_ID_NOT_FOUND"
  | "SOURCE_CODE_NOT_FOUND"
  | "VARIABLE_ID_NOT_FOUND"
  | "NODE_VARIABLE_MAP_NOT_FOUND"
  | "CRITICAL_ROUTE_NOT_FOUND"
  | "SOURCE_DOCUMENT_NOT_FOUND"
  | "SOURCE_TARGET_MAP_NOT_FOUND"
  | "VSM_GUARD_NOT_FOUND"
  | "INFERENCE_FORBIDDEN_BY_EPISTEMIC_POLICY"
  | "INVALID_SHADOW_MODE";

export type CanonicalCatalogEntity =
  | Record<string, unknown>
  | {
      gapId: "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED";
      count: number;
      variables: string[];
    }
  | null;

export type CanonicalCatalogEvaluationResult = {
  version: typeof CANONICAL_CATALOG_SHADOW_VERSION;
  mode: CanonicalCatalogShadowMode;
  chipId: typeof CANONICAL_CATALOG_SHADOW_CHIP_ID;
  queryType: CanonicalCatalogQueryType;
  readinessState: CanonicalCatalogReadinessState;
  resolved: boolean;
  resolvedEntity: CanonicalCatalogEntity;
  missingReferences: string[];
  gapFlags: CanonicalCatalogGapFlag[];
  sourceTrace: CanonicalCatalogSourceTrace;
  evidenceRefs: string[];
  allowedActions: CanonicalCatalogAllowedAction[];
  blockedActions: CanonicalCatalogBlockedAction[];
  requiredInputs: string[];
  findings: CanonicalCatalogFinding[];
  auditEvents: CanonicalCatalogAuditEvent[];
  safetyFlags: CanonicalCatalogSafetyFlags;
};

export type CanonicalCatalogAllowedAction =
  | "read_catalog"
  | "return_shadow_trace"
  | "report_gap"
  | "request_missing_reference"
  | "request_manual_review";

export type CanonicalCatalogBlockedAction =
  | "block_user_flow"
  | "modify_payload"
  | "write_registry"
  | "modify_catalog"
  | "trigger_runtime"
  | "trigger_diagnosis"
  | "trigger_export";

export type CanonicalCatalogSnapshot = {
  sourceNodes: Record<string, Record<string, unknown>>;
  sourceCodes: Record<string, Record<string, unknown>>;
  canonicalVariables: Record<string, Record<string, unknown>>;
  nodeVariableMap: Record<string, Record<string, unknown>>[];
  criticalRoutes: Record<string, Record<string, unknown>>;
  epistemicPolicies: Record<string, Record<string, unknown>>;
  sourceDocuments: Record<string, Record<string, unknown>>;
  sourceTargetMap: Record<string, Record<string, unknown>>;
  vsmPrepGuard: Record<string, Record<string, unknown>>;
  referencedCanonicalVariablesNotDefined: string[];
  sourceArtifacts: string[];
};

export const CANONICAL_CATALOG_SHADOW_CHIP_ID = "EVE-03-CANONICAL-CATALOG";
export const CANONICAL_CATALOG_SHADOW_MODE = "canonical_catalog_shadow";
export const CANONICAL_CATALOG_SHADOW_VERSION = "0.1.0-shadow";

export const CANONICAL_CATALOG_SHADOW_SAFETY_FLAGS: CanonicalCatalogSafetyFlags = {
  canBlockUserFlow: false,
  canModifyPayload: false,
  canWriteRegistry: false,
  canModifyCatalog: false,
  canTriggerRuntime: false,
  canTriggerDiagnosis: false,
  canTriggerExport: false,
  runtimeAuthority: false,
};

const ALLOWED_ACTIONS: CanonicalCatalogAllowedAction[] = [
  "read_catalog",
  "return_shadow_trace",
  "report_gap",
  "request_missing_reference",
  "request_manual_review",
];

const BLOCKED_ACTIONS: CanonicalCatalogBlockedAction[] = [
  "block_user_flow",
  "modify_payload",
  "write_registry",
  "modify_catalog",
  "trigger_runtime",
  "trigger_diagnosis",
  "trigger_export",
];

const SOURCE_POLICY: CanonicalCatalogSourceTrace["originalSourcePolicy"] = {
  D8: "primary",
  D6: "compatibility_boundary",
  D5: "governance_boundary",
  D7: "architecture_boundary",
  VSM1: "methodological_guard_only",
};

export function evaluateCanonicalCatalogShadow(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
): CanonicalCatalogEvaluationResult {
  const sourceTrace = buildSourceTrace(input, catalog);

  if (input.mode !== CANONICAL_CATALOG_SHADOW_MODE) {
    return result(input, catalog, {
      readinessState: "manual_review_required",
      resolved: false,
      resolvedEntity: null,
      gapFlags: ["INVALID_SHADOW_MODE"],
      missingReferences: ["mode"],
      requiredInputs: ["mode: canonical_catalog_shadow"],
      message: "Shadow mode rejected input outside canonical_catalog_shadow.",
      sourceTrace,
      eventType: "canonical_catalog_manual_review_required",
      severity: "blocker",
    });
  }

  switch (input.queryType) {
    case "resolve_node":
      return lookup(input, catalog, {
        entity: findNode(catalog, input.nodeId),
        missingInput: "nodeId",
        notFoundFlag: "NODE_ID_NOT_FOUND",
        readyState: "catalog_lookup_ready",
        notFoundState: "catalog_lookup_not_found",
        registryFile: "source_node_registry.json",
        sourceTrace,
      });
    case "resolve_source_code":
      return lookup(input, catalog, {
        entity: findSourceCode(catalog, input.sourceCode),
        missingInput: "sourceCode",
        notFoundFlag: "SOURCE_CODE_NOT_FOUND",
        readyState: "catalog_lookup_ready",
        notFoundState: "catalog_lookup_not_found",
        registryFile: "source_code_registry.json",
        sourceTrace,
      });
    case "resolve_canonical_variable":
      return resolveCanonicalVariable(input, catalog, sourceTrace);
    case "validate_node_variable_map":
      return validateNodeVariableMap(input, catalog, sourceTrace);
    case "validate_critical_route":
      return lookup(input, catalog, {
        entity: input.routeId ? catalog.criticalRoutes[input.routeId] ?? null : null,
        missingInput: "routeId",
        notFoundFlag: "CRITICAL_ROUTE_NOT_FOUND",
        readyState: "critical_route_found",
        notFoundState: "critical_route_missing",
        registryFile: "critical_routes.json",
        sourceTrace,
      });
    case "validate_epistemic_policy":
      return validateEpistemicPolicy(input, catalog, sourceTrace);
    case "validate_source_document":
      return lookup(input, catalog, {
        entity: input.sourceDocumentId ? catalog.sourceDocuments[input.sourceDocumentId] ?? null : null,
        missingInput: "sourceDocumentId",
        notFoundFlag: "SOURCE_DOCUMENT_NOT_FOUND",
        readyState: "catalog_reference_valid",
        notFoundState: "catalog_reference_missing",
        registryFile: "source_documents.json",
        sourceTrace,
      });
    case "validate_source_target_map":
      return lookup(input, catalog, {
        entity: findSourceTarget(catalog, input.sourceTargetId),
        missingInput: "sourceTargetId",
        notFoundFlag: "SOURCE_TARGET_MAP_NOT_FOUND",
        readyState: "catalog_reference_valid",
        notFoundState: "catalog_reference_missing",
        registryFile: "source_target_map.json",
        sourceTrace,
      });
    case "validate_vsm_guard":
      return lookup(input, catalog, {
        entity: findVsmGuard(catalog, input.guardId ?? input.requestedOutputType),
        missingInput: "guardId",
        notFoundFlag: "VSM_GUARD_NOT_FOUND",
        readyState: "catalog_lookup_ready",
        notFoundState: "catalog_lookup_not_found",
        registryFile: "vsm_prep_guard.json",
        sourceTrace: { ...sourceTrace, sourceDocuments: ["D8", "VSM1"], sourceKind: "methodological_guard" },
      });
    case "detect_catalog_gap":
      return detectCatalogGap(input, catalog, sourceTrace);
    default:
      return result(input, catalog, {
        readinessState: "manual_review_required",
        resolved: false,
        resolvedEntity: null,
        gapFlags: [],
        missingReferences: ["queryType"],
        requiredInputs: ["supported_queryType"],
        message: "Unsupported canonical catalog shadow query type.",
        sourceTrace,
        eventType: "canonical_catalog_manual_review_required",
        severity: "blocker",
      });
  }
}

function buildSourceTrace(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
): CanonicalCatalogSourceTrace {
  return {
    chipId: CANONICAL_CATALOG_SHADOW_CHIP_ID,
    sourceArtifacts: catalog.sourceArtifacts,
    sourceDocuments: sourceDocumentsFor(input.queryType),
    registryFile: registryFileFor(input.queryType),
    sourceKind: sourceKindFor(input.queryType),
    originalSourcePolicy: SOURCE_POLICY,
  };
}

function sourceDocumentsFor(queryType: CanonicalCatalogQueryType): CanonicalCatalogSourceId[] {
  if (queryType === "validate_vsm_guard") {
    return ["D8", "VSM1"];
  }
  if (queryType === "validate_critical_route") {
    return ["D8", "D6", "D5"];
  }
  return ["D8"];
}

function registryFileFor(queryType: CanonicalCatalogQueryType): string {
  const registryByQuery: Record<CanonicalCatalogQueryType, string> = {
    resolve_node: "source_node_registry.json",
    resolve_source_code: "source_code_registry.json",
    resolve_canonical_variable: "canonical_variables.json",
    validate_node_variable_map: "node_variable_map.json",
    validate_critical_route: "critical_routes.json",
    validate_epistemic_policy: "epistemic_policy.json",
    validate_source_document: "source_documents.json",
    validate_source_target_map: "source_target_map.json",
    validate_vsm_guard: "vsm_prep_guard.json",
    detect_catalog_gap: "qa_audit.json",
  };

  return registryByQuery[queryType];
}

function sourceKindFor(queryType: CanonicalCatalogQueryType): CanonicalCatalogSourceTrace["sourceKind"] {
  if (queryType === "validate_vsm_guard") {
    return "methodological_guard";
  }
  if (queryType === "validate_critical_route") {
    return "mixed";
  }
  return "primary";
}

function lookup(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  options: {
    entity: Record<string, unknown> | null;
    missingInput: string;
    notFoundFlag: CanonicalCatalogGapFlag;
    readyState: CanonicalCatalogReadinessState;
    notFoundState: CanonicalCatalogReadinessState;
    registryFile: string;
    sourceTrace: CanonicalCatalogSourceTrace;
  },
): CanonicalCatalogEvaluationResult {
  const missingInputValue = input[options.missingInput as keyof CanonicalCatalogEvaluationInput] == null;
  if (missingInputValue) {
    return result(input, catalog, {
      readinessState: options.notFoundState,
      resolved: false,
      resolvedEntity: null,
      gapFlags: [options.notFoundFlag],
      missingReferences: [options.missingInput],
      requiredInputs: [options.missingInput],
      message: `${options.missingInput} is required for ${input.queryType}.`,
      sourceTrace: { ...options.sourceTrace, registryFile: options.registryFile },
      eventType: "canonical_catalog_lookup_not_found",
      severity: "warning",
    });
  }

  return result(input, catalog, {
    readinessState: options.entity ? options.readyState : options.notFoundState,
    resolved: options.entity != null,
    resolvedEntity: options.entity,
    gapFlags: options.entity ? [] : [options.notFoundFlag],
    missingReferences: options.entity ? [] : [String(input[options.missingInput as keyof CanonicalCatalogEvaluationInput])],
    requiredInputs: options.entity ? [] : [options.missingInput],
    message: options.entity ? "Canonical catalog lookup resolved." : "Canonical catalog lookup did not resolve.",
    sourceTrace: { ...options.sourceTrace, registryFile: options.registryFile },
    eventType: options.entity ? "canonical_catalog_lookup_ready" : "canonical_catalog_lookup_not_found",
    severity: options.entity ? "info" : "warning",
  });
}

function resolveCanonicalVariable(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  sourceTrace: CanonicalCatalogSourceTrace,
): CanonicalCatalogEvaluationResult {
  const variableId = input.variableId;
  const entity = variableId ? catalog.canonicalVariables[variableId] ?? null : null;
  const referencedNotDefined =
    variableId != null && catalog.referencedCanonicalVariablesNotDefined.includes(variableId);

  if (entity) {
    return result(input, catalog, {
      readinessState: "catalog_lookup_ready",
      resolved: true,
      resolvedEntity: entity,
      gapFlags: [],
      missingReferences: [],
      requiredInputs: [],
      message: "Canonical variable resolved.",
      sourceTrace,
      eventType: "canonical_catalog_lookup_ready",
      severity: "info",
    });
  }

  if (referencedNotDefined) {
    return result(input, catalog, {
      readinessState: "catalog_gap_detected",
      resolved: false,
      resolvedEntity: catalogGapEntity(catalog),
      gapFlags: ["CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED"],
      missingReferences: [variableId],
      requiredInputs: ["canonical_variable_definition"],
      message: "Canonical variable is referenced but not defined.",
      sourceTrace,
      eventType: "canonical_catalog_gap_detected",
      severity: "warning",
    });
  }

  return result(input, catalog, {
    readinessState: "catalog_lookup_not_found",
    resolved: false,
    resolvedEntity: null,
    gapFlags: ["VARIABLE_ID_NOT_FOUND"],
    missingReferences: variableId ? [variableId] : ["variableId"],
    requiredInputs: ["variableId"],
    message: "Canonical variable was not found.",
    sourceTrace,
    eventType: "canonical_catalog_lookup_not_found",
    severity: "warning",
  });
}

function validateNodeVariableMap(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  sourceTrace: CanonicalCatalogSourceTrace,
): CanonicalCatalogEvaluationResult {
  const nodeId = input.nodeId;
  const variableId = input.variableId;
  const nodeExists = nodeId != null && catalog.sourceNodes[nodeId] != null;
  const variableExists = variableId != null && catalog.canonicalVariables[variableId] != null;
  const relation = catalog.nodeVariableMap.find(
    (mapping) =>
      valueEquals(mapping.capture_node_id, nodeId) &&
      (variableId == null || valueEquals(mapping.canonical_variable_id, variableId)),
  );

  if (nodeExists && (variableId == null || variableExists) && relation) {
    return result(input, catalog, {
      readinessState: "catalog_reference_valid",
      resolved: true,
      resolvedEntity: relation,
      gapFlags: [],
      missingReferences: [],
      requiredInputs: [],
      message: "Node-variable mapping is valid.",
      sourceTrace,
      eventType: "canonical_catalog_reference_valid",
      severity: "info",
    });
  }

  const gapFlags: CanonicalCatalogGapFlag[] = [];
  const missingReferences: string[] = [];
  if (!nodeExists) {
    gapFlags.push("NODE_ID_NOT_FOUND");
    missingReferences.push(nodeId ?? "nodeId");
  }
  if (variableId != null && !variableExists) {
    gapFlags.push("VARIABLE_ID_NOT_FOUND");
    missingReferences.push(variableId);
  }
  if (nodeExists && (variableId == null || variableExists) && !relation) {
    gapFlags.push("NODE_VARIABLE_MAP_NOT_FOUND");
    missingReferences.push(`${nodeId ?? "nodeId"}:${variableId ?? "any_variable"}`);
  }

  return result(input, catalog, {
    readinessState: "catalog_reference_missing",
    resolved: false,
    resolvedEntity: null,
    gapFlags,
    missingReferences,
    requiredInputs: ["valid_node_variable_mapping"],
    message: "Node-variable mapping could not be validated.",
    sourceTrace,
    eventType: "canonical_catalog_reference_missing",
    severity: "warning",
  });
}

function validateEpistemicPolicy(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  sourceTrace: CanonicalCatalogSourceTrace,
): CanonicalCatalogEvaluationResult {
  const policyText = `${input.policyId ?? ""} ${input.context?.evidenceStatus ?? ""}`.toLowerCase();
  const blocksUnconfirmedAi =
    policyText.includes("unconfirmed_ai") ||
    policyText.includes("unconfirmed") ||
    (input.context?.hardEvidenceRequested === true && input.context?.evidenceStatus !== "confirmed");
  const allowsConfirmed =
    input.policyId === "confirmed_evidence_allowed" ||
    input.context?.evidenceStatus === "confirmed" ||
    (input.evidenceRefs?.length ?? 0) > 0;

  if (blocksUnconfirmedAi && !allowsConfirmed) {
    return result(input, catalog, {
      readinessState: "epistemic_policy_blocks",
      resolved: false,
      resolvedEntity: catalog.epistemicPolicies["EP-GLOBAL-001"] ?? null,
      gapFlags: ["INFERENCE_FORBIDDEN_BY_EPISTEMIC_POLICY"],
      missingReferences: ["confirmed_evidence"],
      requiredInputs: ["confirmed_user_evidence"],
      message: "Unconfirmed AI cannot be promoted to hard evidence.",
      sourceTrace,
      eventType: "canonical_catalog_policy_blocks",
      severity: "blocker",
    });
  }

  if (allowsConfirmed) {
    return result(input, catalog, {
      readinessState: "epistemic_policy_allows",
      resolved: true,
      resolvedEntity: findPolicy(catalog, input.policyId) ?? catalog.epistemicPolicies["EP-GLOBAL-001"] ?? null,
      gapFlags: [],
      missingReferences: [],
      requiredInputs: [],
      message: "Confirmed evidence is allowed by the epistemic policy guard.",
      sourceTrace,
      eventType: "canonical_catalog_policy_allows",
      severity: "info",
    });
  }

  return result(input, catalog, {
    readinessState: "manual_review_required",
    resolved: false,
    resolvedEntity: findPolicy(catalog, input.policyId),
    gapFlags: [],
    missingReferences: [],
    requiredInputs: ["epistemic_policy_context"],
    message: "Epistemic policy context is insufficient for shadow evaluation.",
    sourceTrace,
    eventType: "canonical_catalog_manual_review_required",
    severity: "warning",
  });
}

function detectCatalogGap(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  sourceTrace: CanonicalCatalogSourceTrace,
): CanonicalCatalogEvaluationResult {
  return result(input, catalog, {
    readinessState: "catalog_gap_detected",
    resolved: false,
    resolvedEntity: catalogGapEntity(catalog),
    gapFlags: ["CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED"],
    missingReferences: catalog.referencedCanonicalVariablesNotDefined,
    requiredInputs: ["canonical_variable_definitions_for_referenced_variables"],
    message: "The catalog still has referenced canonical variables not defined.",
    sourceTrace,
    eventType: "canonical_catalog_gap_detected",
    severity: "warning",
  });
}

function result(
  input: CanonicalCatalogEvaluationInput,
  catalog: CanonicalCatalogSnapshot,
  options: {
    readinessState: CanonicalCatalogReadinessState;
    resolved: boolean;
    resolvedEntity: CanonicalCatalogEntity;
    gapFlags: CanonicalCatalogGapFlag[];
    missingReferences: string[];
    requiredInputs: string[];
    message: string;
    sourceTrace: CanonicalCatalogSourceTrace;
    eventType: CanonicalCatalogAuditEvent["eventType"];
    severity: CanonicalCatalogFinding["severity"];
  },
): CanonicalCatalogEvaluationResult {
  const finding: CanonicalCatalogFinding = {
    findingId: `EVE03-FINDING-${input.queryType}`,
    severity: options.severity,
    readinessState: options.readinessState,
    message: options.message,
    sourceTrace: options.sourceTrace,
  };
  const event: CanonicalCatalogAuditEvent = {
    eventId: `EVE03-EVENT-${input.queryType}`,
    eventType: options.eventType,
    message: options.message,
    sourceTrace: options.sourceTrace,
  };

  return {
    version: CANONICAL_CATALOG_SHADOW_VERSION,
    mode: CANONICAL_CATALOG_SHADOW_MODE,
    chipId: CANONICAL_CATALOG_SHADOW_CHIP_ID,
    queryType: input.queryType,
    readinessState: options.readinessState,
    resolved: options.resolved,
    resolvedEntity: options.resolvedEntity,
    missingReferences: [...options.missingReferences],
    gapFlags: [...options.gapFlags],
    sourceTrace: options.sourceTrace,
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    allowedActions: [...ALLOWED_ACTIONS],
    blockedActions: [...BLOCKED_ACTIONS],
    requiredInputs: [...options.requiredInputs],
    findings: [finding],
    auditEvents: [event],
    safetyFlags: { ...CANONICAL_CATALOG_SHADOW_SAFETY_FLAGS },
  };
}

function findNode(catalog: CanonicalCatalogSnapshot, nodeId?: string) {
  return nodeId ? catalog.sourceNodes[nodeId] ?? null : null;
}

function findSourceCode(catalog: CanonicalCatalogSnapshot, sourceCode?: string) {
  if (!sourceCode) {
    return null;
  }

  return catalog.sourceCodes[sourceCode] ?? null;
}

function findSourceTarget(catalog: CanonicalCatalogSnapshot, sourceTargetId?: string) {
  if (!sourceTargetId) {
    return null;
  }

  return catalog.sourceTargetMap[sourceTargetId] ?? null;
}

function findVsmGuard(catalog: CanonicalCatalogSnapshot, guardId?: string) {
  if (!guardId) {
    return Object.values(catalog.vsmPrepGuard)[0] ?? null;
  }

  return catalog.vsmPrepGuard[guardId] ?? null;
}

function findPolicy(catalog: CanonicalCatalogSnapshot, policyId?: string) {
  if (!policyId) {
    return null;
  }

  return catalog.epistemicPolicies[policyId] ?? null;
}

function catalogGapEntity(catalog: CanonicalCatalogSnapshot) {
  return {
    gapId: "CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED" as const,
    count: catalog.referencedCanonicalVariablesNotDefined.length,
    variables: [...catalog.referencedCanonicalVariablesNotDefined],
  };
}

function valueEquals(value: unknown, expected: string | undefined): boolean {
  return expected != null && String(value) === expected;
}
