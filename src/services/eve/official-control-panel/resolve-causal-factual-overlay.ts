/**
 * Resolución factual pura — Matriz Causal 20.
 * No infiere cierre desde epistemic_status aislado.
 * branching_decision: solo inequívoca y vigente; múltiples sin regla → conflict.
 */

import {
  CAUSAL20_CLOSED_STATES,
  CAUSAL20_OPEN_STATES,
  isCausal20AllowedState,
  type Causal20ClosureState,
} from "@/services/eve/runtime-40-20/operational-rules/causal20-operational-rule";
import type {
  BranchingDecisionRow,
  FactualActivationState,
  FactualBlockingState,
  InteractionInstanceRow,
  RuntimeMatrixDataStatus,
  SubfieldResponseRow,
} from "./official-control-panel-runtime-matrix.types";
import type { RuntimeCausalCatalogEntry } from "./catalogs/runtime-causal-matrix.catalog";

export type CausalClosureValidation = {
  requiredVariableCodes: string[];
  resolvedVariableCodes: string[];
  unresolvedVariableCodes: string[];
  contradictoryVariableCodes: string[];
  canonicalRouteClosed: boolean | null;
  isComplete: boolean;
};

export type CausalFactualOverlay = {
  activationState: FactualActivationState | null;
  closureState: Causal20ClosureState | null;
  blockingState: FactualBlockingState | null;
  branchingDecisionId: string | null;
  selectionReason: string | null;
  selectionReasonStatus: "available" | "unavailable" | "conflict";
  requiredVariablesComplete: boolean | null;
  closureEvidenceComplete: boolean | null;
  evidenceCount: number | null;
  closureValidation: {
    requiredCount: number | null;
    resolvedCount: number | null;
    complete: boolean | null;
  };
  dataStatus: RuntimeMatrixDataStatus;
  triggerSignalLabel: string | null;
};

function matchInteractionId(
  candidate: string | null | undefined,
  causalId: string,
): boolean {
  if (!candidate) return false;
  const c = candidate.trim().toUpperCase();
  const id = causalId.trim().toUpperCase();
  return c === id || c.startsWith(`${id}-`) || c.startsWith(`${id}_`);
}

function isDecisionRevoked(d: BranchingDecisionRow): boolean {
  if (d.revokedAt) return true;
  if (d.supersededAt) return true;
  if (d.effective === false) return true;
  const status = d.status?.trim().toLowerCase();
  if (status === "revoked" || status === "superseded" || status === "disabled") {
    return true;
  }
  return false;
}

/**
 * Filtra decisiones candidatas para una causal en el run actual.
 * No elige primera/última: solo filtra.
 */
export function filterBranchingCandidates(input: {
  decisions: BranchingDecisionRow[];
  causalId: string;
  runId?: string | null;
  activityId?: string | null;
  roleRuntimeSessionId?: string | null;
}): BranchingDecisionRow[] {
  return input.decisions.filter((d) => {
    if (input.runId && d.runId && d.runId !== input.runId) return false;
    if (
      input.activityId &&
      d.activityId &&
      d.activityId !== input.activityId
    ) {
      return false;
    }
    if (
      input.roleRuntimeSessionId &&
      d.roleRuntimeSessionId &&
      d.roleRuntimeSessionId !== input.roleRuntimeSessionId
    ) {
      return false;
    }
    if (isDecisionRevoked(d)) return false;
    return (
      matchInteractionId(d.openedInteractionId, input.causalId) ||
      matchInteractionId(d.closedInteractionId, input.causalId)
    );
  });
}

/**
 * Autoridad: solo decisiones marcadas effective / vigentes.
 * Si hay varias vigentes sin regla de desempate → conflict.
 * Si ninguna tiene marca effective pero hay exactamente una candidata → única.
 */
export function resolveBranchingDecision(input: {
  decisions: BranchingDecisionRow[];
  causalId: string;
  runId?: string | null;
  activityId?: string | null;
  roleRuntimeSessionId?: string | null;
}): {
  decision: BranchingDecisionRow | null;
  status: "available" | "unavailable" | "conflict";
} {
  const candidates = filterBranchingCandidates(input);
  if (candidates.length === 0) {
    return { decision: null, status: "unavailable" };
  }

  const effective = candidates.filter(
    (d) =>
      d.effective === true ||
      d.status?.trim().toLowerCase() === "effective" ||
      (d.effective == null &&
        d.status == null &&
        !d.revokedAt &&
        !d.supersededAt),
  );

  // Varias con marca explícita effective → conflicto (sin desempate)
  const explicitlyEffective = candidates.filter(
    (d) =>
      d.effective === true || d.status?.trim().toLowerCase() === "effective",
  );
  if (explicitlyEffective.length > 1) {
    return { decision: null, status: "conflict" };
  }
  if (explicitlyEffective.length === 1) {
    return { decision: explicitlyEffective[0], status: "available" };
  }

  // Sin marca effective: exactamente una candidata no revocada → única
  if (effective.length === 1) {
    return { decision: effective[0], status: "available" };
  }

  // Varias sin regla factual de vigencia → conflicto
  if (candidates.length > 1) {
    return { decision: null, status: "conflict" };
  }

  return { decision: candidates[0] ?? null, status: "available" };
}

export function validateCausalClosureVariables(input: {
  requiredVariableCodes: string[];
  resolvedVariableCodes: string[];
  contradictoryVariableCodes?: string[];
  canonicalRouteClosed?: boolean | null;
}): CausalClosureValidation {
  const required = [...new Set(input.requiredVariableCodes.map((c) => c.trim()).filter(Boolean))];
  const resolved = [...new Set(input.resolvedVariableCodes.map((c) => c.trim()).filter(Boolean))];
  const contradictory = [
    ...new Set((input.contradictoryVariableCodes ?? []).map((c) => c.trim()).filter(Boolean)),
  ];
  const unresolved = required.filter((c) => !resolved.includes(c));
  const routeClosed = input.canonicalRouteClosed ?? null;
  const isComplete =
    required.length > 0 &&
    unresolved.length === 0 &&
    contradictory.length === 0 &&
    routeClosed !== false;

  return {
    requiredVariableCodes: required,
    resolvedVariableCodes: resolved.filter((c) => required.includes(c)),
    unresolvedVariableCodes: unresolved,
    contradictoryVariableCodes: contradictory,
    canonicalRouteClosed: routeClosed,
    isComplete,
  };
}

function emptyClosureValidation(): CausalFactualOverlay["closureValidation"] {
  return { requiredCount: null, resolvedCount: null, complete: null };
}

function deriveBlockingFromClosure(
  closure: Causal20ClosureState | null,
  dataStatus: RuntimeMatrixDataStatus,
  sourcesAvailable: boolean,
  explicitAbsenceOfBlocking: boolean,
): FactualBlockingState {
  if (!sourcesAvailable) return "unavailable";
  if (dataStatus === "not_evaluated" || !closure) return "not_evaluated";
  if (
    closure === "route_missing" ||
    closure === "contradiction_flag" ||
    closure === "triggered_unanswered" ||
    closure === "triggered_required"
  ) {
    return "blocked";
  }
  if (closure === "manual_review_required" || closure === "reentry_required") {
    return "flag";
  }
  if (closure === "activation_unknown") return "flag";
  if (CAUSAL20_CLOSED_STATES.has(closure)) {
    // Solo "none" con evaluación factual de ausencia de bloqueo
    return explicitAbsenceOfBlocking ? "none" : "not_evaluated";
  }
  return "not_evaluated";
}

function deriveActivation(input: {
  sourcesAvailable: boolean;
  closure: Causal20ClosureState | null;
  hasUnequivocalActivationSignal: boolean;
  dataStatus: RuntimeMatrixDataStatus;
}): FactualActivationState | null {
  if (!input.sourcesAvailable) return null;
  if (input.closure === "not_triggered_with_evidence") {
    return "not-triggered-with-evidence";
  }
  if (input.closure === "activation_unknown") return "unknown";
  if (input.closure && isCausal20AllowedState(input.closure)) {
    // not_triggered_with_evidence already handled above.
    if (CAUSAL20_CLOSED_STATES.has(input.closure)) {
      return "triggered";
    }
    if (CAUSAL20_OPEN_STATES.has(input.closure)) return "triggered";
  }
  if (input.hasUnequivocalActivationSignal) return "triggered";
  if (input.dataStatus === "not_evaluated") return "not_evaluated";
  return "not_evaluated";
}

export type ResolveCausalFactualStateInput = {
  causalDefinition: RuntimeCausalCatalogEntry;
  /** Estado causal explícito vigente del run (misma causal). */
  explicitClosureState?: string | null;
  /** Validación completa de variables (solo si el repo puede comprobarlas). */
  closureValidation?: CausalClosureValidation | null;
  branchingDecisions: BranchingDecisionRow[];
  instances: InteractionInstanceRow[];
  subfields: SubfieldResponseRow[];
  runId?: string | null;
  activityId?: string | null;
  roleRuntimeSessionId?: string | null;
  sourcesAvailable?: boolean;
  /** Señal factual explícita de ausencia de bloqueo (no inferir por falta de blocker). */
  explicitAbsenceOfBlocking?: boolean;
};

/**
 * Algoritmo de resolución factual por causal.
 * Orden: scope → evaluación explícita → branching → activación → cierre → variables → dataStatus.
 */
export function resolveCausalFactualState(
  input: ResolveCausalFactualStateInput,
): CausalFactualOverlay {
  const sourcesAvailable = input.sourcesAvailable !== false;
  const causalId = input.causalDefinition.id;

  if (!sourcesAvailable) {
    return {
      activationState: null,
      closureState: null,
      blockingState: "unavailable",
      branchingDecisionId: null,
      selectionReason: null,
      selectionReasonStatus: "unavailable",
      requiredVariablesComplete: null,
      closureEvidenceComplete: null,
      evidenceCount: null,
      closureValidation: emptyClosureValidation(),
      dataStatus: "unavailable",
      triggerSignalLabel: null,
    };
  }

  const branching = resolveBranchingDecision({
    decisions: input.branchingDecisions,
    causalId,
    runId: input.runId,
    activityId: input.activityId,
    roleRuntimeSessionId: input.roleRuntimeSessionId,
  });

  const instance =
    input.instances.find((item) =>
      matchInteractionId(item.runtimeInteractionId, causalId),
    ) ?? null;

  const linkedSubfields = instance
    ? input.subfields.filter((s) => s.interactionInstanceId === instance.id)
    : [];

  // Evidence count: subcampos + decisión + estado explícito (conteo, no cierre)
  const evidenceCount =
    linkedSubfields.length +
    (branching.decision ? 1 : 0) +
    (input.explicitClosureState ? 1 : 0);

  let closureState: Causal20ClosureState | null = null;
  let closureValidationVm = emptyClosureValidation();
  let requiredVariablesComplete: boolean | null = null;
  let closureEvidenceComplete: boolean | null = null;
  let dataStatus: RuntimeMatrixDataStatus = "not_evaluated";

  // 1) Cierre explícito autorizado
  const explicit = input.explicitClosureState?.trim() ?? null;
  if (explicit && isCausal20AllowedState(explicit)) {
    closureState = explicit;
    closureEvidenceComplete = true;
    requiredVariablesComplete = null;
    dataStatus = "available";
  } else if (input.closureValidation) {
    // 2) Validación completa de variables obligatorias (nunca epistemic aislado)
    const v = input.closureValidation;
    closureValidationVm = {
      requiredCount: v.requiredVariableCodes.length,
      resolvedCount: v.resolvedVariableCodes.length,
      complete: v.isComplete,
    };
    requiredVariablesComplete = v.isComplete;

    if (v.contradictoryVariableCodes.length > 0) {
      closureState = "contradiction_flag";
      closureEvidenceComplete = false;
      dataStatus = "available";
    } else if (v.requiredVariableCodes.length === 0) {
      // Sin catálogo comprobable → no inventar cierre
      closureState = null;
      closureEvidenceComplete = false;
      dataStatus = evidenceCount > 0 ? "partial" : "not_evaluated";
      closureValidationVm = emptyClosureValidation();
      requiredVariablesComplete = null;
    } else if (!v.isComplete) {
      closureState = null;
      closureEvidenceComplete = false;
      dataStatus = "partial";
    } else if (v.canonicalRouteClosed === false) {
      closureState = "route_missing";
      closureEvidenceComplete = false;
      dataStatus = "available";
    } else {
      closureState = "answered_closed";
      closureEvidenceComplete = true;
      dataStatus = "available";
    }
  } else if (linkedSubfields.length > 0 || instance) {
    // Hay traza parcial (instancia/subcampo) pero sin cierre explícito ni validación completa
    // epistemic_status NO produce cierre
    closureState = null;
    closureEvidenceComplete = false;
    dataStatus = "partial";
  } else {
    closureState = null;
    closureEvidenceComplete = null;
    dataStatus = "not_evaluated";
  }

  // Branching conflict degrada razón y puede marcar conflict en dataStatus
  let selectionReason: string | null = null;
  let branchingDecisionId: string | null = null;
  const selectionReasonStatus = branching.status;

  if (branching.status === "conflict") {
    selectionReason = null;
    branchingDecisionId = null;
    if (dataStatus === "not_evaluated" || dataStatus === "partial") {
      dataStatus = "conflict";
    } else if (dataStatus === "available") {
      // Conservar evaluación de cierre; la razón queda en conflicto
      dataStatus = "conflict";
    }
  } else if (branching.status === "available" && branching.decision?.reason?.trim()) {
    selectionReason = branching.decision.reason.trim();
    branchingDecisionId = branching.decision.id;
  }

  const hasUnequivocalActivationSignal = Boolean(
    branching.decision ||
      (closureState &&
        closureState !== "not_triggered_with_evidence" &&
        isCausal20AllowedState(closureState)),
  );

  const activationState = deriveActivation({
    sourcesAvailable: true,
    closure: closureState,
    hasUnequivocalActivationSignal,
    dataStatus,
  });

  const blockingState = deriveBlockingFromClosure(
    closureState,
    dataStatus,
    true,
    input.explicitAbsenceOfBlocking === true ||
      (closureState != null &&
        CAUSAL20_CLOSED_STATES.has(closureState) &&
        closureEvidenceComplete === true),
  );

  return {
    activationState,
    closureState,
    blockingState,
    branchingDecisionId,
    selectionReason,
    selectionReasonStatus,
    requiredVariablesComplete,
    closureEvidenceComplete,
    evidenceCount: evidenceCount > 0 ? evidenceCount : evidenceCount === 0 && dataStatus === "not_evaluated" ? 0 : evidenceCount,
    closureValidation: closureValidationVm,
    dataStatus,
    triggerSignalLabel: branching.decision?.triggerSignal ?? null,
  };
}

export function computeBlocksFullReadinessFactually(input: {
  blocksFullReadinessRule: boolean;
  sourcesAvailable: boolean;
  overlay: CausalFactualOverlay;
}): boolean | null {
  if (!input.sourcesAvailable) return null;
  if (!input.blocksFullReadinessRule) {
    if (
      input.overlay.dataStatus === "not_evaluated" ||
      input.overlay.dataStatus === "partial" ||
      input.overlay.dataStatus === "conflict" ||
      input.overlay.closureState == null
    ) {
      return null;
    }
    return false;
  }

  // P0 / regla bloqueante: solo con estado factual suficiente
  if (
    input.overlay.dataStatus === "partial" ||
    input.overlay.dataStatus === "not_evaluated" ||
    input.overlay.dataStatus === "unavailable" ||
    input.overlay.dataStatus === "conflict" ||
    input.overlay.dataStatus === "error"
  ) {
    return null;
  }

  const closure = input.overlay.closureState;
  if (!closure) return null;

  const activated =
    input.overlay.activationState === "triggered" ||
    (closure !== "not_triggered_with_evidence" &&
      isCausal20AllowedState(closure));

  if (!activated) return false;

  const openOrBlocking = CAUSAL20_OPEN_STATES.has(closure);
  const closedSatisfied = CAUSAL20_CLOSED_STATES.has(closure);

  if (closedSatisfied) return false;
  if (openOrBlocking) return true;
  return null;
}
