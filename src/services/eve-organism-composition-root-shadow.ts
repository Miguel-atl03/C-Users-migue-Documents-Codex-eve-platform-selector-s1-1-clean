import type {
  EveOrganismCapability,
  EveOrganismCapabilityPolicy,
  EveOrganismCapabilityState,
  EveOrganismCapabilityStateDecision,
  EveOrganismCompositionRootShadowOptions,
  EveOrganismNoCableadoAttestation,
  EveOrganismProducedCandidate,
  EveOrganismShadowBlocker,
  EveOrganismShadowBlockerId,
  EveOrganismShadowCommand,
  EveOrganismShadowResult,
  EveOrganismShadowStatus,
  EveOrganismShadowTraceEvent,
  EveOrganismShadowWarning,
} from "../types/eve-organism-composition-root.ts";

export const EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_VERSION = "1.0.0";
export const EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_MODE = "offline_no_productive_authority";
export const EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_AUDIT_ID =
  "AUDIT_EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_V1";

export const EVE_ORGANISM_NO_CABLEADO_ATTESTATION: EveOrganismNoCableadoAttestation = {
  runtimeConnected: false,
  shadowActivated: false,
  registryWritten: false,
  exportProduced: false,
  diagnosisEnabled: false,
  dbWritten: false,
  uiTouched: false,
  productionAuthorityGranted: false,
};

export const EVE_ORGANISM_CAPABILITY_POLICIES: Record<
  EveOrganismCapability,
  EveOrganismCapabilityPolicy
> = {
  runtimeCapture: {
    capability: "runtimeCapture",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Runtime capture may be simulated only as a shadow candidate.",
  },
  gateAdvisory: {
    capability: "gateAdvisory",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Gate output is advisory and cannot enforce production behavior.",
  },
  gateEnforcement: {
    capability: "gateEnforcement",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Gate enforcement is downgraded to advisory in this shadow root.",
  },
  objectBinding: {
    capability: "objectBinding",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Object binding may be represented as candidate metadata only.",
  },
  outboxPublish: {
    capability: "outboxPublish",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Outbox publish is represented as a local shadow candidate only.",
  },
  governanceObserve: {
    capability: "governanceObserve",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Governance observation can produce trace without side effects.",
  },
  candidateGeneration: {
    capability: "candidateGeneration",
    mode: "shadow_advisory",
    productiveAuthority: false,
    reason: "Candidate generation is allowed as non-final shadow artifact.",
  },
  humanRelease: {
    capability: "humanRelease",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Human release is outside this shadow implementation.",
  },
  registryWrite: {
    capability: "registryWrite",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Registry writes are forbidden.",
  },
  finalExport: {
    capability: "finalExport",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Final exports are forbidden.",
  },
  parallelExecution: {
    capability: "parallelExecution",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Parallel production execution is forbidden.",
  },
  diagnosis: {
    capability: "diagnosis",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Diagnosis enablement is forbidden.",
  },
  productiveRuntimeAuthority: {
    capability: "productiveRuntimeAuthority",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Productive runtime authority is forbidden.",
  },
  uiExposure: {
    capability: "uiExposure",
    mode: "blocked",
    productiveAuthority: false,
    reason: "UI exposure is forbidden for the first shadow root.",
  },
  databaseWrite: {
    capability: "databaseWrite",
    mode: "blocked",
    productiveAuthority: false,
    reason: "Database writes are forbidden.",
  },
};

const DEFAULT_TIMESTAMP = "2026-06-24T00:00:00.000Z";
const CRITICAL_BLOCKERS = new Set<EveOrganismShadowBlockerId>([
  "OCR-BLK-001",
  "OCR-BLK-002",
  "OCR-BLK-003",
  "OCR-BLK-004",
  "OCR-BLK-005",
  "OCR-BLK-006",
  "OCR-BLK-007",
  "OCR-BLK-008",
  "OCR-BLK-009",
  "OCR-BLK-010",
  "OCR-BLK-011",
  "OCR-BLK-012",
  "OCR-BLK-015",
]);

const CANDIDATE_FLOW: EveOrganismProducedCandidate["kind"][] = [
  "RuntimeCommand",
  "ActivityRuntimeRun",
  "EvidenceItem",
  "CanonicalVariableRecord",
  "GateDecision",
  "StructuralCandidateRecord",
  "ReadinessDecision",
  "ParallelCandidate",
];

export function runEveOrganismCompositionRootShadow(
  command: EveOrganismShadowCommand,
  options: EveOrganismCompositionRootShadowOptions = {},
): EveOrganismShadowResult {
  const timestamp = options.clock?.nowIso() ?? DEFAULT_TIMESTAMP;
  const blockers = collectBlockers(command);
  const warnings = collectWarnings(command);
  const capabilityStateDecision = decideCapabilityState(command, blockers);
  const status = decideStatus(blockers);
  const accepted = blockers.length === 0;
  const producedCandidates = accepted ? produceCandidates(command) : [];
  const trace = produceTrace(command, timestamp, blockers, capabilityStateDecision, producedCandidates);
  const auditRecord = {
    auditId: EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_AUDIT_ID,
    commandId: command.commandId,
    tenantId: command.tenantId,
    organizationId: command.organizationId,
    sessionId: command.sessionId,
    activityId: command.activityId,
    actorId: command.actorId,
    accepted,
    status,
    blockerIds: blockers.map((blocker) => blocker.id),
    producedCandidateIds: producedCandidates.map((candidate) => candidate.candidateId),
    correlationId: command.correlationId,
    idempotencyKey: command.idempotencyKey,
    timestamp,
    noCableadoAttestation: EVE_ORGANISM_NO_CABLEADO_ATTESTATION,
  };

  return {
    accepted,
    status,
    blockers,
    warnings,
    trace,
    producedCandidates,
    auditRecord,
    noCableadoAttestation: EVE_ORGANISM_NO_CABLEADO_ATTESTATION,
    capabilityStateDecision,
    nextRecommendedGate: decideNextGate(status, capabilityStateDecision),
  };
}

function collectBlockers(command: EveOrganismShadowCommand): EveOrganismShadowBlocker[] {
  const blockers: EveOrganismShadowBlocker[] = [];
  const sideEffects = command.forbiddenSideEffects ?? {};

  if (!command.tenantId || !command.sessionId || !command.activityId) {
    blockers.push(blocker("OCR-BLK-001", "missing tenant/session/activity context", "command.context"));
  }

  if (command.dryRun !== true) {
    blockers.push(blocker("OCR-BLK-002", "dryRun must be true", "command.dryRun"));
  }

  if (command.requestedCapability === "registryWrite" || sideEffects.registryWrite) {
    blockers.push(blocker("OCR-BLK-003", "registryWrite requested", "command.requestedCapability"));
  }

  if (command.requestedCapability === "finalExport" || sideEffects.finalExport) {
    blockers.push(blocker("OCR-BLK-004", "finalExport requested", "command.requestedCapability"));
  }

  if (command.requestedCapability === "diagnosis" || sideEffects.diagnosis) {
    blockers.push(blocker("OCR-BLK-005", "diagnosis requested", "command.requestedCapability"));
  }

  if (
    command.requestedCapability === "productiveRuntimeAuthority" ||
    sideEffects.productiveRuntimeAuthority
  ) {
    blockers.push(
      blocker("OCR-BLK-006", "productiveRuntimeAuthority requested", "command.requestedCapability"),
    );
  }

  if (command.requestedCapability === "databaseWrite" || sideEffects.databaseWrite) {
    blockers.push(blocker("OCR-BLK-007", "databaseWrite requested", "command.requestedCapability"));
  }

  if (command.requestedCapability === "uiExposure" || sideEffects.uiExposure) {
    blockers.push(blocker("OCR-BLK-008", "uiExposure requested", "command.requestedCapability"));
  }

  if (command.overrideRequested && !command.overrideAudited) {
    blockers.push(blocker("OCR-BLK-009", "override requested but not audited", "command.override"));
  }

  if (command.requestedState === "ACTIVE") {
    blockers.push(
      blocker("OCR-BLK-010", "requested state ACTIVE not allowed in shadow implementation", "command.requestedState"),
    );
  }

  if (!isKnownCapability(command.requestedCapability)) {
    blockers.push(blocker("OCR-BLK-011", "unknown capability", "command.requestedCapability"));
  }

  if (!command.idempotencyKey || !command.correlationId) {
    blockers.push(
      blocker("OCR-BLK-012", "missing idempotencyKey or correlationId", "command.idempotency"),
    );
  }

  for (const evidence of command.evidenceInputs) {
    if (!evidence.provenance?.sourceId) {
      blockers.push(
        blocker("OCR-BLK-013", "evidence without provenance", `evidence:${evidence.evidenceId}`),
      );
    }
  }

  for (const candidate of command.candidateInputs) {
    if (!candidate.sourceTrace?.length) {
      blockers.push(
        blocker("OCR-BLK-014", "candidate without source trace", `candidate:${candidate.candidateId}`),
      );
    }
  }

  if (sideEffects.parallelExecution || sideEffects.humanRelease || sideEffects.unauditedOverride) {
    blockers.push(blocker("OCR-BLK-015", "forbidden side effect requested", "command.forbiddenSideEffects"));
  }

  if (isKnownCapability(command.requestedCapability)) {
    const policy = EVE_ORGANISM_CAPABILITY_POLICIES[command.requestedCapability];
    if (policy.mode === "blocked" && !hasCapabilitySpecificBlocker(blockers, command.requestedCapability)) {
      blockers.push(blocker("OCR-BLK-015", "forbidden side effect requested", "command.requestedCapability"));
    }
  }

  return blockers;
}

function collectWarnings(command: EveOrganismShadowCommand): EveOrganismShadowWarning[] {
  const warnings: EveOrganismShadowWarning[] = [];

  if (command.requestedCapability === "gateEnforcement") {
    warnings.push({
      id: "OCR-WRN-001",
      message: "gateEnforcement was downgraded to advisory shadow mode.",
      evidenceRef: "command.requestedCapability",
    });
  }

  if (command.requestedState === "SUPERVISED") {
    warnings.push({
      id: "OCR-WRN-002",
      message: "SUPERVISED is emitted only as recommendation, not activation.",
      evidenceRef: "command.requestedState",
    });
  }

  return warnings;
}

function decideCapabilityState(
  command: EveOrganismShadowCommand,
  blockers: EveOrganismShadowBlocker[],
): EveOrganismCapabilityStateDecision {
  const currentState = command.currentState ?? "VALIDATED";
  const policy = isKnownCapability(command.requestedCapability)
    ? EVE_ORGANISM_CAPABILITY_POLICIES[command.requestedCapability]
    : null;
  const hasCritical = blockers.some((item) => item.severity === "critical");

  if (!policy) {
    return {
      requestedCapability: command.requestedCapability,
      requestedState: command.requestedState,
      currentState,
      effectiveState: hasCritical ? "QUARANTINED" : "DEGRADED",
      capabilityMode: "unknown",
      recommendation: "NO_GO",
      productiveActivationGranted: false,
      reason: "Unknown capability cannot be assembled by the shadow root.",
    };
  }

  if (hasCritical) {
    return {
      requestedCapability: command.requestedCapability,
      requestedState: command.requestedState,
      currentState,
      effectiveState: "QUARANTINED",
      capabilityMode: policy.mode,
      recommendation: "NO_GO",
      productiveActivationGranted: false,
      reason: "Critical no-go blocker keeps the organism in quarantine.",
    };
  }

  if (blockers.length > 0) {
    return {
      requestedCapability: command.requestedCapability,
      requestedState: command.requestedState,
      currentState,
      effectiveState: "DEGRADED",
      capabilityMode: policy.mode,
      recommendation: "NO_GO",
      productiveActivationGranted: false,
      reason: "Non-critical blocker degrades the shadow run.",
    };
  }

  if (command.requestedState === "SUPERVISED") {
    return {
      requestedCapability: command.requestedCapability,
      requestedState: command.requestedState,
      currentState,
      effectiveState: "SHADOW",
      capabilityMode: policy.mode,
      recommendation: "SUPERVISED",
      productiveActivationGranted: false,
      reason: "SUPERVISED is recommended but not activated by this shadow implementation.",
    };
  }

  const effectiveState = nextAllowedState(currentState, command.requestedState);

  return {
    requestedCapability: command.requestedCapability,
    requestedState: command.requestedState,
    currentState,
    effectiveState,
    capabilityMode: policy.mode,
    recommendation: effectiveState === "SHADOW" ? "SUPERVISED" : effectiveState,
    productiveActivationGranted: false,
    reason: policy.reason,
  };
}

function produceCandidates(command: EveOrganismShadowCommand): EveOrganismProducedCandidate[] {
  return CANDIDATE_FLOW.map((kind, index) => ({
    candidateId: `${command.commandId}:${kind}:${index + 1}`,
    kind,
    sourceRefs: [
      command.clientIntent.intentId,
      ...command.evidenceInputs.map((evidence) => evidence.evidenceId),
      ...command.candidateInputs.map((candidate) => candidate.candidateId),
    ],
    shadowOnly: true,
  }));
}

function produceTrace(
  command: EveOrganismShadowCommand,
  timestamp: string,
  blockers: EveOrganismShadowBlocker[],
  capabilityStateDecision: EveOrganismCapabilityStateDecision,
  producedCandidates: EveOrganismProducedCandidate[],
): EveOrganismShadowTraceEvent[] {
  const blockerIds = blockers.map((item) => item.id);
  const phases = [
    ["ClientIntent", "composition-root-shadow", "intent accepted as dry-run input"],
    ["RuntimeCommand", "runtime-command-shadow", "runtime command candidate assembled"],
    ["ActivityRuntimeRun", "activity-runtime-shadow", "activity run candidate assembled"],
    ["EvidenceItem", "evidence-shadow", "evidence projected with provenance guard"],
    ["CanonicalVariableRecord", "canonical-variable-shadow", "canonical variable candidate projected"],
    ["GateDecision", "gate-shadow", "gate decision kept advisory"],
    ["StructuralCandidateRecord", "structural-candidate-shadow", "structural candidate kept local"],
    ["ReadinessDecision", "readiness-shadow", "readiness calculated without activation"],
    ["ParallelCandidate", "parallel-candidate-shadow", "parallel candidate not executed"],
    ["AuditShadowRecord", "audit-shadow", "local audit record assembled in memory"],
  ] as const;

  return phases.map(([phase, component, reason], index) => ({
    traceId: `${command.correlationId}:${index + 1}`,
    sequence: index + 1,
    phase,
    component,
    decision: blockers.length === 0 ? "accepted_shadow_candidate" : capabilityStateDecision.effectiveState,
    reason,
    inputRef: index === 0 ? command.clientIntent.intentId : command.commandId,
    outputRef: producedCandidates[index - 1]?.candidateId ?? EVE_ORGANISM_COMPOSITION_ROOT_SHADOW_AUDIT_ID,
    blockerIds,
    timestamp,
    correlationId: command.correlationId,
  }));
}

function decideStatus(blockers: EveOrganismShadowBlocker[]): EveOrganismShadowStatus {
  if (blockers.length === 0) {
    return "SHADOW_ACCEPTED";
  }

  if (blockers.some((item) => item.severity === "critical")) {
    return "SHADOW_QUARANTINED";
  }

  return "SHADOW_DEGRADED";
}

function decideNextGate(
  status: EveOrganismShadowStatus,
  decision: EveOrganismCapabilityStateDecision,
): EveOrganismShadowResult["nextRecommendedGate"] {
  if (status === "SHADOW_QUARANTINED") {
    return "quarantine_review";
  }

  if (status === "SHADOW_DEGRADED" || status === "SHADOW_BLOCKED") {
    return "fix_blockers";
  }

  return decision.recommendation === "SUPERVISED"
    ? "confirm_supervision_preconditions"
    : "retain_shadow";
}

function nextAllowedState(
  currentState: EveOrganismCapabilityState,
  requestedState: EveOrganismCapabilityState,
): EveOrganismCapabilityState {
  if (currentState === "OFF" && requestedState === "VALIDATED") {
    return "VALIDATED";
  }

  if (currentState === "VALIDATED" && requestedState === "SHADOW") {
    return "SHADOW";
  }

  if (requestedState === "SHADOW" || requestedState === "VALIDATED" || requestedState === "OFF") {
    return requestedState;
  }

  return "SHADOW";
}

function blocker(
  id: EveOrganismShadowBlockerId,
  message: string,
  evidenceRef: string,
): EveOrganismShadowBlocker {
  return {
    id,
    severity: CRITICAL_BLOCKERS.has(id) ? "critical" : "warning",
    message,
    evidenceRef,
  };
}

function isKnownCapability(value: string): value is EveOrganismCapability {
  return value in EVE_ORGANISM_CAPABILITY_POLICIES;
}

function hasCapabilitySpecificBlocker(
  blockers: EveOrganismShadowBlocker[],
  capability: EveOrganismCapability,
) {
  const capabilityBlockers: Partial<Record<EveOrganismCapability, EveOrganismShadowBlockerId>> = {
    registryWrite: "OCR-BLK-003",
    finalExport: "OCR-BLK-004",
    diagnosis: "OCR-BLK-005",
    productiveRuntimeAuthority: "OCR-BLK-006",
    databaseWrite: "OCR-BLK-007",
    uiExposure: "OCR-BLK-008",
  };
  const expected = capabilityBlockers[capability];

  return expected ? blockers.some((blockerItem) => blockerItem.id === expected) : false;
}
