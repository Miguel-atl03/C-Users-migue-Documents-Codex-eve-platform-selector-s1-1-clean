import {
  EVE_ORGANISM_NO_CABLEADO_ATTESTATION,
  runEveOrganismCompositionRootShadow,
} from "./eve-organism-composition-root-shadow.ts";
import type {
  EveOrganismCapability,
  EveOrganismCapabilityState,
  EveOrganismClientIntent,
  EveOrganismForbiddenSideEffectRequest,
  EveOrganismShadowBlockerId,
  EveOrganismShadowCommand,
  EveOrganismShadowResult,
} from "../types/eve-organism-composition-root.ts";
import type {
  EveOrganismShadowE2EComparison,
  EveOrganismShadowE2EDivergenceSeverity,
  EveOrganismShadowE2EDivergenceType,
  EveOrganismShadowE2ENoCableadoAttestation,
  EveOrganismShadowE2EObservedSignal,
  EveOrganismShadowE2EReplayOptions,
  EveOrganismShadowE2EResult,
  EveOrganismShadowE2ESideEffectDerivation,
} from "../types/eve-organism-shadow-e2e.ts";

export const EVE_ORGANISM_SHADOW_E2E_HARNESS_VERSION = "1.0.0";
export const EVE_ORGANISM_SHADOW_E2E_ENTRYPOINT_MODE = "fixture_replay_adapter";

type Gate3OperationalInput = {
  activityDescription: string;
  startCondition: string;
  endCondition: string;
  ruleOrStandard: string;
  frequency: string;
  typicalContext: string;
  primaryActorScope: string;
};

type Gate3ActivationEnvelope = {
  activationType: "restricted_internal_supervised";
  operationalInput: Gate3OperationalInput;
  candidateOutput: {
    status: "draft";
    kind: "candidate_generation";
    promotionAllowed: false;
    evidenceTrace: string[];
    sourceTrace: string[];
    noGoStatus: "passed" | "blocked";
    humanReviewRequired: true;
    humanReviewType: "S3*";
    carryForwardRisks: ["G2-RISK-001"];
    sideEffects: EveOrganismShadowE2ENoCableadoAttestation;
  };
};

export const EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO: EveOrganismShadowE2ENoCableadoAttestation = {
  registry_write_allowed: false,
  final_export_allowed: false,
  diagnosis_allowed: false,
  db_write_allowed: false,
  ui_touch_allowed: false,
  production_authority_allowed: false,
  runtime_mutation_allowed: false,
  supabase_required: false,
  officialFlowUntouched: true,
};

export function mapObservedSignalToShadowCommand(
  signal: EveOrganismShadowE2EObservedSignal,
): EveOrganismShadowCommand {
  const sideEffectDerivation = deriveForbiddenSideEffects(signal);

  return {
    commandId: `e2e-shadow-command:${signal.observedSignalId}`,
    tenantId: signal.tenantId ?? "",
    organizationId: signal.organizationId ?? "",
    sessionId: signal.sessionId ?? "",
    activityId: signal.activityId ?? "",
    actorId: signal.actorId ?? "",
    requestedCapability: resolveRequestedCapability(signal),
    requestedState: resolveRequestedState(signal),
    currentState: "VALIDATED",
    clientIntent: normalizeClientIntent(signal),
    evidenceInputs: signal.evidenceInputs,
    candidateInputs: signal.candidateInputs,
    overrideRequested: signal.overrideRequested ?? false,
    overrideAudited: signal.overrideAudited ?? false,
    idempotencyKey: signal.idempotencyKey ?? "",
    correlationId: signal.correlationId ?? "",
    dryRun: true,
    forbiddenSideEffects: sideEffectDerivation.forbiddenSideEffects,
  };
}

export function runShadowE2EReplay(
  signal: EveOrganismShadowE2EObservedSignal,
  options: EveOrganismShadowE2EReplayOptions = {},
): EveOrganismShadowE2EResult {
  const sideEffectDerivation = deriveForbiddenSideEffects(signal);
  const shadowCommand = mapObservedSignalToShadowCommand(signal);
  const shadowResult = runEveOrganismCompositionRootShadow(shadowCommand, {
    clock: options.clock ?? { nowIso: () => signal.observedAt },
  });
  const comparison = buildShadowComparison(signal, shadowResult);
  const noCableadoAttestation = validateNoCableadoForE2E(signal, shadowResult);
  const gate3ActivationEnvelope = buildGate3ActivationEnvelope(signal, comparison, noCableadoAttestation);

  return {
    accepted: shadowResult.accepted,
    observedSignalId: signal.observedSignalId,
    shadowCommand,
    shadowResult,
    comparison,
    ...(gate3ActivationEnvelope ? { gate3ActivationEnvelope } : {}),
    noCableadoAttestation,
    officialFlowUntouched: true,
    warnings: sideEffectDerivation.warnings.concat(shadowResult.warnings.map((warning) => warning.id)),
    blockers: shadowResult.blockers,
  } as EveOrganismShadowE2EResult & { gate3ActivationEnvelope?: Gate3ActivationEnvelope };
}

export function runShadowE2EReplayBatch(
  signals: EveOrganismShadowE2EObservedSignal[],
  options: EveOrganismShadowE2EReplayOptions = {},
): EveOrganismShadowE2EResult[] {
  return signals.map((signal) => runShadowE2EReplay(signal, options));
}

export function buildShadowComparison(
  signal: EveOrganismShadowE2EObservedSignal,
  shadowResult: EveOrganismShadowResult,
): EveOrganismShadowE2EComparison {
  const divergenceType = resolveDivergenceType(signal, shadowResult);
  const divergenceSeverity = resolveDivergenceSeverity(divergenceType, shadowResult);
  const hasOfficialFlowRef = Boolean(signal.officialFlowRef);
  const sameOutcome = !hasOfficialFlowRef
    ? "unknown"
    : shadowResult.blockers.length === 0 && divergenceType === "none";

  return {
    comparisonId: `e2e-comparison:${signal.observedSignalId}`,
    officialFlowRef: signal.officialFlowRef,
    shadowTraceRef: shadowResult.trace[0]?.correlationId ?? signal.correlationId ?? "",
    sameOutcome,
    divergenceType,
    divergenceSeverity,
    blockers: shadowResult.blockers,
    explanation: explainDivergence(divergenceType, shadowResult),
    reproducible: signal.observationMode === "fixture" || signal.observationMode === "replay",
    requiresHumanReview:
      divergenceSeverity === "high" ||
      divergenceSeverity === "critical" ||
      divergenceType === "no_go_triggered",
  };
}

export function validateNoCableadoForE2E(
  signal: EveOrganismShadowE2EObservedSignal,
  result: EveOrganismShadowResult,
): EveOrganismShadowE2ENoCableadoAttestation {
  if (
    result.noCableadoAttestation !== EVE_ORGANISM_NO_CABLEADO_ATTESTATION ||
    !signal.sideEffectPolicy.noDbWrite ||
    !signal.sideEffectPolicy.noRegistryWrite ||
    !signal.sideEffectPolicy.noExport ||
    !signal.sideEffectPolicy.noUiTouch ||
    !signal.sideEffectPolicy.noDiagnosis ||
    !signal.sideEffectPolicy.noRuntimeMutation ||
    !signal.sideEffectPolicy.noSupabaseRequired
  ) {
    return EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO;
  }

  return EVE_ORGANISM_SHADOW_E2E_NO_CABLEADO;
}

function buildGate3ActivationEnvelope(
  signal: EveOrganismShadowE2EObservedSignal,
  comparison: EveOrganismShadowE2EComparison,
  noCableadoAttestation: EveOrganismShadowE2ENoCableadoAttestation,
): Gate3ActivationEnvelope | undefined {
  if (signal.signalKind !== "candidate_generation") {
    return undefined;
  }

  const operationalInput = readGate3OperationalInput(signal.rawObservedPayload);
  if (!operationalInput) {
    return undefined;
  }

  const evidenceTrace = signal.evidenceInputs.map((evidence) => evidence.evidenceId);
  const sourceTrace = [...new Set(signal.candidateInputs.flatMap((candidate) => candidate.sourceTrace ?? []))];

  return {
    activationType: "restricted_internal_supervised",
    operationalInput,
    candidateOutput: {
      status: "draft",
      kind: "candidate_generation",
      promotionAllowed: false,
      evidenceTrace,
      sourceTrace,
      noGoStatus: comparison.blockers.length === 0 ? "passed" : "blocked",
      humanReviewRequired: true,
      humanReviewType: "S3*",
      carryForwardRisks: ["G2-RISK-001"],
      sideEffects: noCableadoAttestation,
    },
  };
}

function readGate3OperationalInput(payload: unknown): Gate3OperationalInput | undefined {
  if (!isRecord(payload) || payload.gate3RestrictedActivation !== true || !isRecord(payload.operationalInput)) {
    return undefined;
  }

  const input = payload.operationalInput;
  const operationalInput = {
    activityDescription: readString(input.activityDescription),
    startCondition: readString(input.startCondition),
    endCondition: readString(input.endCondition),
    ruleOrStandard: readString(input.ruleOrStandard),
    frequency: readString(input.frequency),
    typicalContext: readString(input.typicalContext),
    primaryActorScope: readString(input.primaryActorScope),
  };

  return Object.values(operationalInput).every((value) => value.length > 0) ? operationalInput : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function resolveRequestedCapability(signal: EveOrganismShadowE2EObservedSignal): EveOrganismCapability | string {
  const explicit = signal.requestedCapability;
  if (explicit === "gateEnforcement") {
    return "gateAdvisory";
  }

  if (explicit) {
    return explicit;
  }

  const byKind: Record<EveOrganismShadowE2EObservedSignal["signalKind"], EveOrganismCapability> = {
    workmap_activity: "runtimeCapture",
    significado_intent: "runtimeCapture",
    runtime_like_response: "gateAdvisory",
    evidence_capture: "runtimeCapture",
    candidate_generation: "candidateGeneration",
    official_flow_result: "governanceObserve",
    gate_bypass_signal: "gateAdvisory",
    evidence_corruption_signal: "governanceObserve",
    registry_export_attempt: "registryWrite",
    tenant_leak_signal: "governanceObserve",
  };

  return byKind[signal.signalKind];
}

function resolveRequestedState(signal: EveOrganismShadowE2EObservedSignal): EveOrganismCapabilityState {
  if (signal.requestedState) {
    return signal.requestedState as EveOrganismCapabilityState;
  }

  return signal.signalKind === "gate_bypass_signal" ? "ACTIVE" : "SHADOW";
}

function normalizeClientIntent(signal: EveOrganismShadowE2EObservedSignal): EveOrganismClientIntent {
  if (typeof signal.clientIntent !== "string") {
    return signal.clientIntent;
  }

  return {
    intentId: `intent:${signal.observedSignalId}`,
    label: signal.clientIntent,
    requestedAction: signal.signalKind,
  };
}

function deriveForbiddenSideEffects(
  signal: EveOrganismShadowE2EObservedSignal,
): EveOrganismShadowE2ESideEffectDerivation {
  const forbiddenSideEffects: EveOrganismForbiddenSideEffectRequest = {};
  const warnings: string[] = [];

  if (!signal.sideEffectPolicy.noDbWrite) {
    forbiddenSideEffects.databaseWrite = true;
    warnings.push("side_effect_policy_db_write_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noRegistryWrite) {
    forbiddenSideEffects.registryWrite = true;
    warnings.push("side_effect_policy_registry_write_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noExport) {
    forbiddenSideEffects.finalExport = true;
    warnings.push("side_effect_policy_export_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noUiTouch) {
    forbiddenSideEffects.uiExposure = true;
    warnings.push("side_effect_policy_ui_touch_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noDiagnosis) {
    forbiddenSideEffects.diagnosis = true;
    warnings.push("side_effect_policy_diagnosis_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noRuntimeMutation) {
    forbiddenSideEffects.productiveRuntimeAuthority = true;
    warnings.push("side_effect_policy_runtime_mutation_not_forbidden");
  }

  if (!signal.sideEffectPolicy.noSupabaseRequired) {
    warnings.push("side_effect_policy_supabase_requirement_not_forbidden");
  }

  if (signal.signalKind === "registry_export_attempt") {
    forbiddenSideEffects.registryWrite = true;
    forbiddenSideEffects.finalExport = true;
  }

  return { forbiddenSideEffects, warnings };
}

function resolveDivergenceType(
  signal: EveOrganismShadowE2EObservedSignal,
  shadowResult: EveOrganismShadowResult,
): EveOrganismShadowE2EDivergenceType {
  const blockerIds = new Set(shadowResult.blockers.map((blocker) => blocker.id));

  if (signal.signalKind === "tenant_leak_signal") {
    return "tenant_boundary_risk";
  }

  if (blockerIds.has("OCR-BLK-001")) {
    return "missing_context";
  }

  if (blockerIds.has("OCR-BLK-013")) {
    return "provenance_gap";
  }

  if (hasAnyBlocker(blockerIds, ["OCR-BLK-003", "OCR-BLK-004", "OCR-BLK-005", "OCR-BLK-006", "OCR-BLK-007", "OCR-BLK-008", "OCR-BLK-015"])) {
    return "no_go_triggered";
  }

  if (blockerIds.has("OCR-BLK-011")) {
    return "semantic_gate_difference";
  }

  if (blockerIds.has("OCR-BLK-014")) {
    return "candidate_difference";
  }

  if (shadowResult.blockers.length > 0) {
    return "unknown";
  }

  return signal.officialFlowRef ? "none" : "unknown";
}

function resolveDivergenceSeverity(
  divergenceType: EveOrganismShadowE2EDivergenceType,
  shadowResult: EveOrganismShadowResult,
): EveOrganismShadowE2EDivergenceSeverity {
  if (divergenceType === "none") {
    return "none";
  }

  if (divergenceType === "tenant_boundary_risk") {
    return "critical";
  }

  if (divergenceType === "no_go_triggered") {
    return "high";
  }

  if (shadowResult.status === "SHADOW_QUARANTINED") {
    return "high";
  }

  if (divergenceType === "unknown") {
    return "info";
  }

  return "medium";
}

function explainDivergence(
  divergenceType: EveOrganismShadowE2EDivergenceType,
  shadowResult: EveOrganismShadowResult,
): string {
  if (divergenceType === "none") {
    return "Official flow reference and shadow result are compatible; no production state was modified.";
  }

  if (divergenceType === "unknown" && shadowResult.blockers.length === 0) {
    return "No official flow reference was provided, so the comparison outcome remains unknown.";
  }

  return `Shadow comparison classified ${divergenceType} with blockers: ${shadowResult.blockers
    .map((blocker) => blocker.id)
    .join(", ")}`;
}

function hasAnyBlocker(
  blockerIds: Set<EveOrganismShadowBlockerId>,
  expected: EveOrganismShadowBlockerId[],
) {
  return expected.some((id) => blockerIds.has(id));
}
