import type {
  Gate2AlgedonicInput,
  Gate2AlgedonicResult,
  Gate2AuthorityGuardrailResultCode,
  Gate2AuthorityGuardrailsInput,
  Gate2AuthorityGuardrailsResult,
  Gate2AuthorityLedger,
  Gate2AuthorityLedgerAppendResult,
  Gate2AuthorityLedgerEntry,
  Gate2AuthorityNoGoId,
  Gate2AuthorityPromotionStatus,
  Gate2CapabilityAuthority,
  Gate2CapabilityId,
  Gate2CapabilityState,
  Gate2CapabilityTransitionInput,
  Gate2CapabilityTransitionResult,
  Gate2SideEffectClass,
  Gate2SideEffectDecision,
  Gate2SideEffectGuardInput,
  Gate2SideEffectGuardResult,
  Gate2TenantAuthContext,
  Gate2TenantAuthIsolationResult,
} from "../types/eve-organism-gate2-authority-guardrails.ts";

type Gate2CapabilityCatalog = {
  capabilities: Gate2CapabilityAuthority[];
  blockedNonCapabilities: string[];
};

const FUTURE_AUTHORITY_STATES: Gate2CapabilityState[] = [
  "SUPERVISED",
  "CONTROLLED_ACTIVE",
  "ACTIVE",
];

const LOCAL_SIDE_EFFECTS: Gate2SideEffectClass[] = [
  "NONE",
  "LOCAL_MEMORY_ONLY",
  "LOCAL_AUDIT_RECORD",
  "LOCAL_SHADOW_OUTBOX_RECORD",
];

const DENIED_SIDE_EFFECTS: Gate2SideEffectClass[] = [
  "READ_ONLY_PRODUCT_INSPECTION",
  "PRODUCT_STATE_WRITE",
  "DATABASE_WRITE",
  "REGISTRY_WRITE",
  "EXPORT_GENERATION",
  "DIAGNOSIS_EMISSION",
  "UI_EXPOSURE",
  "NETWORK_CALL",
  "PARALLEL_EXECUTION",
  "HUMAN_RELEASE",
];

const CAPABILITY_CATALOG: Gate2CapabilityAuthority[] = [
  capability("clientAccess", "VALIDATED", true),
  capability("tenantContext", "VALIDATED", true),
  capability("runtimeCapture", "OFF", false),
  capability("gateAdvisory", "VALIDATED", true),
  capability("gateEnforcement", "OFF", false),
  capability("objectBinding", "OFF", false),
  capability("membraneOutbox", "OFF", false),
  capability("governanceObserve", "VALIDATED", true),
  capability("governanceEnforce", "OFF", false),
  capability("candidateGeneration", "VALIDATED", true),
  capability("humanRelease", "OFF", false),
  capability("registryWrite", "OFF", false),
  capability("finalExport", "OFF", false),
  capability("parallelExecution", "OFF", false),
  capability("externalLLMAssistance", "OFF", false),
];

function capability(
  capabilityId: Gate2CapabilityId,
  currentState: Gate2CapabilityState,
  implementedOfflineControlled: boolean,
): Gate2CapabilityAuthority {
  return {
    capabilityId,
    currentState,
    currentGate2Authorized: false,
    implementedOfflineControlled,
    productConnected: false,
    observerAuthorized: false,
    blocksProductAuthority: true,
    requiresRealEvidenceForPromotion: true,
  };
}

export function getGate2CapabilityCatalog(): Gate2CapabilityCatalog {
  return {
    capabilities: CAPABILITY_CATALOG.map((entry) => ({ ...entry })),
    blockedNonCapabilities: [
      "diagnosis",
      "productiveRuntimeAuthority",
      "databaseWrite",
      "uiExposure",
    ],
  };
}

export function evaluateGate2CapabilityTransition(
  input: Gate2CapabilityTransitionInput,
): Gate2CapabilityTransitionResult {
  const requiresLedger = isCriticalTransition(input);
  const requiresManualReview = requiresLedger || input.toState === "ROLLBACK_IN_PROGRESS";

  if (FUTURE_AUTHORITY_STATES.includes(input.toState)) {
    return transitionResult(
      input,
      false,
      "BLOCKED_CAPABILITY_TRANSITION",
      requiresLedger,
      requiresManualReview,
      "Gate 2 is replay-only and cannot authorize supervised, controlled-active, or active operation.",
    );
  }

  if (input.fromState === "SHADOW" && input.toState === "SUPERVISED") {
    return transitionResult(
      input,
      false,
      "BLOCKED_CAPABILITY_TRANSITION",
      true,
      true,
      "SHADOW to SUPERVISED is a future transition that requires real evidence and human authority.",
    );
  }

  if (requiresLedger && !input.hasLedgerEntry) {
    return transitionResult(
      input,
      false,
      "BLOCKED_LEDGER_REQUIRED",
      true,
      requiresManualReview,
      "Critical capability transitions require an authority ledger entry.",
    );
  }

  if (requiresManualReview && !input.hasManualReview) {
    return transitionResult(
      input,
      false,
      "BLOCKED_MANUAL_REVIEW_REQUIRED",
      requiresLedger,
      true,
      "Critical capability transitions require manual review before any local state movement.",
    );
  }

  if (input.capabilityId === "candidateGeneration" && input.b3RouteRefPresent === false) {
    return transitionResult(
      input,
      false,
      "BLOCKED_B3_B7_AUTHORITY",
      requiresLedger,
      requiresManualReview,
      "B3 candidate-related authority requires route_ref evidence.",
    );
  }

  if (input.toState === "SHADOW" && input.offlineOnly !== false) {
    return transitionResult(
      input,
      true,
      "PASS_OFFLINE_ONLY",
      requiresLedger,
      requiresManualReview,
      "Offline shadow movement is allowed only as local replay/control evidence.",
    );
  }

  if (["DEGRADED", "QUARANTINED", "ROLLBACK_IN_PROGRESS", "REVOKED"].includes(input.toState)) {
    return transitionResult(
      input,
      true,
      "PASS_OFFLINE_ONLY",
      requiresLedger,
      requiresManualReview,
      "Protective state movement is allowed locally and does not grant authority.",
    );
  }

  return transitionResult(
    input,
    false,
    "REQUIRES_FUTURE_IMPLEMENTATION",
    requiresLedger,
    requiresManualReview,
    "This transition is defined for future evidence-backed implementation, not Gate 2 authority.",
  );
}

export function evaluateGate2SideEffectGuard(
  input: Gate2SideEffectGuardInput,
): Gate2SideEffectGuardResult {
  if (input.qaReworkToCore) {
    return sideEffectResult(input, false, "DENY", "BLOCKED_SIDE_EFFECT", false, false, "QA rework cannot be pushed into the core by offline authority guardrails.");
  }

  if (input.sideEffectClass === "EXPORT_GENERATION" && !input.hasAcaSatisfied) {
    return sideEffectResult(input, false, "QUARANTINE_CAPABILITY", "BLOCKED_SIDE_EFFECT", false, true, "Export generation without ACA [Satisfied] is quarantined.");
  }

  if (input.sideEffectClass === "DIAGNOSIS_EMISSION" && (!input.hasAggregatedCausalMovie || input.layer1DiagnosisAttempt)) {
    return sideEffectResult(input, false, "QUARANTINE_CAPABILITY", "BLOCKED_SIDE_EFFECT", false, true, "Diagnosis emission requires aggregated causal movie evidence and is not enabled in Gate 2.");
  }

  if (input.objectInsideOlc === false) {
    return sideEffectResult(input, false, "QUARANTINE_CAPABILITY", "BLOCKED_SIDE_EFFECT", false, true, "Object[State] outside OLC is quarantined.");
  }

  if (LOCAL_SIDE_EFFECTS.includes(input.sideEffectClass)) {
    return sideEffectResult(input, true, "ALLOW_OFFLINE_LOCAL", "PASS_OFFLINE_ONLY", true, false, "Local offline side effect is allowed.");
  }

  if (DENIED_SIDE_EFFECTS.includes(input.sideEffectClass)) {
    return sideEffectResult(input, false, "DENY", "BLOCKED_SIDE_EFFECT", false, false, "Product-facing or authority-bearing side effects are denied in Gate 2.");
  }

  return sideEffectResult(input, false, "DENY", "BLOCKED_SIDE_EFFECT", false, false, "Unknown side effect class is denied.");
}

export function evaluateGate2TenantAuthIsolation(
  input: Gate2TenantAuthContext,
): Gate2TenantAuthIsolationResult {
  if (!input.tenantId || !input.organizationId) {
    return tenantAuthResult(false, "BLOCKED_TENANT_CONTEXT", "NOT_APPLICABLE", false, "tenantId and organizationId are required for offline authority evaluation.");
  }

  if (
    input.expectedTenantId &&
    input.observedTenantId &&
    input.expectedTenantId !== input.observedTenantId
  ) {
    return tenantAuthResult(false, "BLOCKED_TENANT_CONTEXT", "BLOCKED_CROSS_TENANT", false, "Cross-tenant context is blocked.");
  }

  if (input.actorAuthority === "service_role" || input.actorAuthority === "anonymous") {
    return tenantAuthResult(false, "BLOCKED_AUTH_BOUNDARY", "NOT_APPLICABLE", false, "service_role and anonymous authority are blocked.");
  }

  if (
    !input.tenantIsolationEvidencePresent ||
    !input.authBoundaryEvidencePresent ||
    !input.rlsBoundaryEvidencePresent
  ) {
    return tenantAuthResult(true, "REQUIRES_REAL_PRODUCT_EVIDENCE", "NOT_APPLICABLE", true, "Tenant, auth, and RLS boundaries remain unproven by offline fixtures.");
  }

  return tenantAuthResult(true, "REQUIRES_REAL_PRODUCT_EVIDENCE", "NOT_APPLICABLE", true, "Offline guardrails still cannot prove tenant, auth, or RLS boundaries.");
}

export function evaluateGate2AlgedonicChannel(
  input: Gate2AlgedonicInput,
): Gate2AlgedonicResult {
  if (input.trigger === "NONE") {
    return {
      triggered: false,
      resultCode: "PASS_OFFLINE_ONLY",
      sourceRule: null,
      severity: "LOW",
      action: "NONE",
      producesCandidate: false,
      diagnosticUseAllowed: false,
      sourceRuleVerifiedAgainstNoGoMatrix: true,
      reason: "No algedonic trigger present.",
    };
  }

  const mapped = ALGEdONIC_TRIGGER_MAP[input.trigger](input);
  return {
    triggered: true,
    resultCode: "BLOCKED_ALGEDONIC_TRIGGER",
    sourceRule: mapped.sourceRule,
    severity: mapped.severity,
    action: mapped.action,
    producesCandidate: mapped.producesCandidate,
    diagnosticUseAllowed: false,
    sourceRuleVerifiedAgainstNoGoMatrix: true,
    reason: mapped.reason,
  };
}

export function appendGate2AuthorityLedgerEntry(
  ledger: Gate2AuthorityLedger,
  entry: Gate2AuthorityLedgerEntry,
): Gate2AuthorityLedgerAppendResult {
  const entries = ledger.entries.map((item) => ({ ...item }));
  const previousEntry = entries[entries.length - 1];

  if (previousEntry && entry.previousEntryChecksum !== previousEntry.entryChecksum) {
    return {
      accepted: false,
      resultCode: "BLOCKED_LEDGER_REQUIRED",
      ledger: { entries, appendOnly: true, checksumChain: true, grantsAuthority: false },
      grantsAuthority: false,
      reason: "Non-initial ledger entries require previousEntryChecksum.",
    };
  }

  if (entry.recordType === "OVERRIDE_DECISION" && entry.actorId === entry.auditorId) {
    return {
      accepted: false,
      resultCode: "BLOCKED_MANUAL_REVIEW_REQUIRED",
      ledger: { entries, appendOnly: true, checksumChain: true, grantsAuthority: false },
      grantsAuthority: false,
      reason: "Executor and auditor must remain separated.",
    };
  }

  const appendedEntry: Gate2AuthorityLedgerEntry = {
    ...entry,
    grantsAuthority: false,
    entryChecksum: deterministicChecksum({ ...entry, grantsAuthority: false }),
  };
  const nextLedger: Gate2AuthorityLedger = {
    entries: [...entries, appendedEntry],
    appendOnly: true,
    checksumChain: true,
    grantsAuthority: false,
  };

  return {
    accepted: true,
    resultCode: "PASS_OFFLINE_ONLY",
    ledger: nextLedger,
    appendedEntry,
    grantsAuthority: false,
    reason: "Ledger entry appended locally in memory without granting authority.",
  };
}

export function evaluateGate2AuthorityGuardrails(
  input: Gate2AuthorityGuardrailsInput,
): Gate2AuthorityGuardrailsResult {
  const findings: string[] = [];

  if (input.tenantAuth) {
    const tenantResult = evaluateGate2TenantAuthIsolation(input.tenantAuth);
    findings.push(tenantResult.reason);
    if (!tenantResult.allowed) {
      return authorityResult(tenantResult.resultCode, false, findings);
    }
  }

  if (input.algedonic) {
    const algedonicResult = evaluateGate2AlgedonicChannel(input.algedonic);
    findings.push(algedonicResult.reason);
    if (algedonicResult.triggered) {
      return authorityResult("BLOCKED_ALGEDONIC_TRIGGER", false, findings);
    }
  }

  if (input.sideEffect) {
    const sideEffectResultValue = evaluateGate2SideEffectGuard(input.sideEffect);
    findings.push(sideEffectResultValue.reason);
    if (!sideEffectResultValue.allowed) {
      return authorityResult("BLOCKED_SIDE_EFFECT", false, findings);
    }
  }

  if (input.capabilityTransition) {
    const transition = evaluateGate2CapabilityTransition(input.capabilityTransition);
    findings.push(transition.reason);
    if (!transition.allowed) {
      return authorityResult(transition.resultCode, false, findings);
    }
  }

  if (input.ledger && input.ledgerEntry) {
    const appendResult = appendGate2AuthorityLedgerEntry(input.ledger, input.ledgerEntry);
    findings.push(appendResult.reason);
    if (!appendResult.accepted) {
      return authorityResult(appendResult.resultCode, false, findings);
    }
  }

  if (!input.realProductEvidenceProvided) {
    findings.push("Real product evidence is still required before Gate 3.");
    return authorityResult("NOT_READY_FOR_GATE3", false, findings);
  }

  findings.push("Offline-only evaluation passed without granting authority.");
  return authorityResult("PASS_OFFLINE_ONLY", true, findings);
}

export function getGate2AuthorityPromotionStatus(): Gate2AuthorityPromotionStatus {
  return {
    gate3Ready: false,
    supervisedOperationAuthorized: false,
    controlledActiveAuthorized: false,
    activeAuthorized: false,
    observerAuthorized: false,
    realObservationAuthorized: false,
    readOnlyObserverDesignAuthorized: false,
    registryExportAllowed: false,
    diagnosisEnabled: false,
    blockersClosedByAuthorityGuardrails: 0,
    exitConditionsClosedByAuthorityGuardrails: 0,
    reason: "authority_guardrails_offline_only_real_evidence_required",
    lanes: {
      capabilityStates: "implemented_offline_controlled",
      sideEffectGuard: "implemented_offline_controlled",
      tenantAuthIsolationGuard: "implemented_offline_controlled",
      algedonicChannel: "implemented_offline_controlled",
      auditLedger: "implemented_offline_controlled",
    },
  };
}

function transitionResult(
  input: Gate2CapabilityTransitionInput,
  allowed: boolean,
  resultCode: Gate2CapabilityTransitionResult["resultCode"],
  requiresLedger: boolean,
  requiresManualReview: boolean,
  reason: string,
): Gate2CapabilityTransitionResult {
  return {
    allowed,
    resultCode,
    capabilityId: input.capabilityId,
    fromState: input.fromState,
    toState: input.toState,
    requiresLedger,
    requiresManualReview,
    gate3Ready: false,
    observerAuthorized: false,
    reason,
  };
}

function sideEffectResult(
  input: Gate2SideEffectGuardInput,
  allowed: boolean,
  decision: Gate2SideEffectDecision,
  resultCode: Gate2AuthorityGuardrailResultCode,
  localOnly: boolean,
  quarantine: boolean,
  reason: string,
): Gate2SideEffectGuardResult {
  return {
    allowed,
    decision,
    resultCode,
    sideEffectClass: input.sideEffectClass,
    localOnly,
    quarantine,
    productConnected: false,
    reason,
  };
}

function tenantAuthResult(
  allowed: boolean,
  resultCode: Gate2TenantAuthIsolationResult["resultCode"],
  crossTenantResult: Gate2TenantAuthIsolationResult["crossTenantResult"],
  requiresRealProductEvidence: boolean,
  reason: string,
): Gate2TenantAuthIsolationResult {
  return {
    allowed,
    resultCode,
    tenantIsolationProven: false,
    authBoundaryProven: false,
    rlsBoundaryProven: false,
    crossTenantResult,
    requiresRealProductEvidence,
    reason,
  };
}

function authorityResult(
  resultCode: Gate2AuthorityGuardrailResultCode,
  passed: boolean,
  findings: string[],
): Gate2AuthorityGuardrailsResult {
  return {
    resultCode,
    passed,
    offlineOnly: true,
    gate3Ready: false,
    observerAuthorized: false,
    productionReady: false,
    diagnosisReady: false,
    findings,
  };
}

function isCriticalTransition(input: Gate2CapabilityTransitionInput): boolean {
  return (
    input.toState === "SUPERVISED" ||
    input.toState === "CONTROLLED_ACTIVE" ||
    input.toState === "ACTIVE" ||
    input.toState === "ROLLBACK_IN_PROGRESS" ||
    input.fromState === "SHADOW"
  );
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function deterministicChecksum(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `g2auth-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

const ALGEdONIC_TRIGGER_MAP: Record<
  Exclude<Gate2AlgedonicInput["trigger"], "NONE">,
  (input: Gate2AlgedonicInput) => {
    sourceRule: Gate2AuthorityNoGoId;
    severity: Gate2AlgedonicResult["severity"];
    action: Gate2AlgedonicResult["action"];
    producesCandidate: boolean;
    reason: string;
  }
> = {
  TENANT_LEAK: () => ({
    sourceRule: "AG-NG-014",
    severity: "CRITICAL",
    action: "QUARANTINE",
    producesCandidate: false,
    reason: "Cross-tenant context maps to AG-NG-014 and quarantines the lane.",
  }),
  B3_ROUTE_MISSING: () => ({
    sourceRule: "AG-NG-011",
    severity: "HIGH",
    action: "REENTRY",
    producesCandidate: false,
    reason: "B3 candidate authority requires route_ref and cannot produce a candidate without it.",
  }),
  B7_BOUNDARY_VIOLATION: (input) => ({
    sourceRule: input.b7RulePreference ?? "AG-NG-012",
    severity: "CRITICAL",
    action: "QUARANTINE",
    producesCandidate: false,
    reason: "B7 boundary violation blocks structural facts and candidate generation.",
  }),
  UNAUTHENTICATED_OR_SERVICE_ROLE_ACCESS: () => ({
    sourceRule: "AG-NG-016",
    severity: "CRITICAL",
    action: "BLOCK",
    producesCandidate: false,
    reason: "Unauthenticated or service-role authority maps to AG-NG-016.",
  }),
  UNAUDITED_OVERRIDE: () => ({
    sourceRule: "AG-NG-022",
    severity: "CRITICAL",
    action: "BLOCK",
    producesCandidate: false,
    reason: "Unaudited override maps to AG-NG-022.",
  }),
  STATE_LEDGER_DIVERGENCE: () => ({
    sourceRule: "AG-NG-027",
    severity: "CRITICAL",
    action: "ROLLBACK",
    producesCandidate: false,
    reason: "State ledger divergence maps to AG-NG-027.",
  }),
  ROLLBACK_FAILURE: () => ({
    sourceRule: "AG-NG-025",
    severity: "CRITICAL",
    action: "ROLLBACK",
    producesCandidate: false,
    reason: "Rollback failure maps to AG-NG-025.",
  }),
  AUDITOR_EXECUTOR_COLLAPSE: () => ({
    sourceRule: "AG-NG-024",
    severity: "CRITICAL",
    action: "BLOCK",
    producesCandidate: false,
    reason: "Auditor/executor collapse maps to AG-NG-024.",
  }),
  FIXTURE_CLAIMED_AS_REAL: () => ({
    sourceRule: "AG-NG-029",
    severity: "CRITICAL",
    action: "QUARANTINE",
    producesCandidate: false,
    reason: "Fixture claimed as real evidence maps to AG-NG-029.",
  }),
};
