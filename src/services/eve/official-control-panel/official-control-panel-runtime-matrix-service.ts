import { RUNTIME_BASE_MATRIX_CATALOG } from "./catalogs/runtime-base-matrix.catalog";
import { RUNTIME_CAUSAL_MATRIX_CATALOG } from "./catalogs/runtime-causal-matrix.catalog";
import {
  BASE40_ALLOWED_STATES,
  BASE40_FULL_RESOLUTION_STATES,
  isBase40AllowedState,
  type Base40ResolutionState,
} from "@/services/eve/runtime-40-20/operational-rules/base40-operational-rule";
import {
  CAUSAL20_CLOSED_STATES,
  isCausal20AllowedState,
  type Causal20ClosureState,
} from "@/services/eve/runtime-40-20/operational-rules/causal20-operational-rule";
import type {
  BaseMatrixRowVM,
  BranchingDecisionRow,
  CausalMatrixRowVM,
  FactualActivationState,
  FactualBlockingState,
  InteractionInstanceRow,
  InteractionMappingRow,
  OfficialControlPanelRuntimeMatrixRepository,
  QuestionSelectionReasonSource,
  RuntimeActivityContextVM,
  RuntimeBaseMatrixView,
  RuntimeCausalMatrixView,
  RuntimeMatrixDataStatus,
  SourceNodeRefRow,
  SubfieldResponseRow,
} from "./official-control-panel-runtime-matrix.types";
import {
  RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_BODY,
  RUNTIME_MATRIX_EMPTY_MESSAGE,
  RUNTIME_MATRIX_NO_RUN_BANNER_BODY,
  RUNTIME_MATRIX_PARTIAL_CAUSAL_MESSAGE,
  RUNTIME_MATRIX_PARTIAL_MESSAGE,
  RUNTIME_MATRIX_PRE_RUN_CHAIN_HINT,
  RUNTIME_MATRIX_SOURCES_UNAVAILABLE_MESSAGE,
} from "./official-control-panel-runtime-matrix.types";
import {
  presentCausalBlockingRuleLabel,
  presentCausalClosureResultLabel,
} from "./causal-matrix-presentation";
import {
  presentBaseCatalogPhrase,
  presentBaseResolutionStateLabel,
} from "./base-matrix-presentation";
import {
  computeBlocksFullReadinessFactually,
  resolveCausalFactualState,
  validateCausalClosureVariables,
  type CausalClosureValidation,
} from "./resolve-causal-factual-overlay";

export {
  presentCausalBlockingRuleLabel,
  presentCausalClosureResultLabel,
  presentCausalTechnicalCode,
  presentSelectionReasonStatusLabel,
} from "./causal-matrix-presentation";
export {
  resolveCausalFactualState,
  resolveBranchingDecision,
  filterBranchingCandidates,
  validateCausalClosureVariables,
  computeBlocksFullReadinessFactually,
} from "./resolve-causal-factual-overlay";
export type { CausalClosureValidation, CausalFactualOverlay } from "./resolve-causal-factual-overlay";

function matchInteractionId(
  candidate: string | null | undefined,
  baseOrCausalId: string,
): boolean {
  if (!candidate) return false;
  const c = candidate.trim().toUpperCase();
  const id = baseOrCausalId.trim().toUpperCase();
  return c === id || c.startsWith(`${id}-`) || c.startsWith(`${id}_`);
}

function findBranching(
  decisions: BranchingDecisionRow[],
  rowId: string,
): BranchingDecisionRow | null {
  return (
    decisions.find(
      (d) =>
        matchInteractionId(d.openedInteractionId, rowId) ||
        matchInteractionId(d.closedInteractionId, rowId),
    ) ?? null
  );
}

function findInstance(
  instances: InteractionInstanceRow[],
  rowId: string,
): InteractionInstanceRow | null {
  return (
    instances.find((item) =>
      matchInteractionId(item.runtimeInteractionId, rowId),
    ) ?? null
  );
}

function reasonForRow(branching: BranchingDecisionRow | null): {
  label: string | null;
  source: QuestionSelectionReasonSource;
  branchingDecisionId: string | null;
} {
  if (branching?.reason?.trim()) {
    return {
      label: branching.reason.trim(),
      source: "branching-decision",
      branchingDecisionId: branching.id,
    };
  }
  return {
    label: null,
    source: "unavailable",
    branchingDecisionId: branching?.id ?? null,
  };
}

/** Nodo ejecutado = source_question_code; nunca el ID Base (B0-Q01). */
export function resolveSelectedQuestionNode(input: {
  baseId: string;
  mappings: InteractionMappingRow[];
  sourceNodes: SourceNodeRefRow[];
}): string | null {
  const forInteraction = input.mappings.filter((m) =>
    matchInteractionId(m.runtimeInteractionId, input.baseId),
  );
  if (forInteraction.length === 0) return null;

  const ordered = [...forInteraction].sort((a, b) => {
    const rank = (role: string) =>
      role === "primary" ? 0 : role === "critical_route" ? 1 : 2;
    return rank(a.mappingRole) - rank(b.mappingRole);
  });

  const sourceByRef = new Map(
    input.sourceNodes.map((n) => [n.sourceNodeRef, n] as const),
  );

  for (const mapping of ordered) {
    const node = sourceByRef.get(mapping.sourceNodeRef);
    const code = node?.sourceQuestionCode?.trim() ?? "";
    if (!code) continue;
    if (/^B\d/i.test(code) || matchInteractionId(code, input.baseId)) {
      continue;
    }
    return code;
  }
  return null;
}

const EPISTEMIC_TO_BASE_STATE: Record<string, Base40ResolutionState> = {
  captured_user_evidence: "captured_user_evidence",
  user_corrected_evidence: "captured_user_evidence",
  user_confirmed_suggestion: "user_confirmed_prefill",
  canonical_derivation: "canonical_derivation_closed",
  internal_calculated: "internal_calculated_closed",
  ai_inferred_unconfirmed: "inferred_unconfirmed",
};

/**
 * Deriva estado Base autorizado solo con evidencia suficiente.
 * instance.state aislado (answered/confirmed/skipped) NO cierra.
 */
export function deriveFactualResolutionState(input: {
  instance: InteractionInstanceRow | null;
  subfields: SubfieldResponseRow[];
  explicitState?: string | null;
}): Base40ResolutionState | null {
  if (input.explicitState && isBase40AllowedState(input.explicitState)) {
    return input.explicitState;
  }

  if (!input.instance) return null;

  const linked = input.subfields.filter(
    (s) => s.interactionInstanceId === input.instance!.id,
  );
  if (linked.length === 0) {
    return null;
  }

  const candidates = linked
    .map((s) => EPISTEMIC_TO_BASE_STATE[s.epistemicStatus] ?? null)
    .filter((s): s is Base40ResolutionState => Boolean(s));

  if (candidates.length === 0) return null;

  const unique = [...new Set(candidates)];
  if (unique.length > 1) {
    const blocked = unique.find(
      (s) =>
        s === "blocked_by_missing_evidence" ||
        s === "blocked_by_missing_canonical_route" ||
        s === "inferred_unconfirmed" ||
        s === "ready_with_flag" ||
        s === "reentry_required" ||
        s === "manual_review_required",
    );
    if (blocked) return blocked;
    return null;
  }

  return unique[0] ?? null;
}

export function deriveFactualBlockingState(input: {
  factualResolutionState: string | null;
  evidencePresent: boolean;
  sourcesAvailable: boolean;
  interactionConsultable: boolean;
}): FactualBlockingState {
  if (!input.sourcesAvailable) return "unavailable";
  if (!input.interactionConsultable) return "not_evaluated";
  if (!input.factualResolutionState) return "not_evaluated";

  const state = input.factualResolutionState;
  if (
    state === "blocked_by_missing_evidence" ||
    state === "blocked_by_missing_canonical_route" ||
    state === "skipped_silently"
  ) {
    return "blocked";
  }
  if (
    state === "ready_with_flag" ||
    state === "reentry_required" ||
    state === "manual_review_required" ||
    state === "inferred_unconfirmed"
  ) {
    return "flag";
  }
  if (
    BASE40_FULL_RESOLUTION_STATES.has(state as Base40ResolutionState) &&
    input.evidencePresent
  ) {
    return "none";
  }
  return "not_evaluated";
}

function rowDataStatus(input: {
  sourcesAvailable: boolean;
  factualResolutionState: string | null;
  evidencePresent: boolean;
}): RuntimeMatrixDataStatus {
  if (!input.sourcesAvailable) return "unavailable";
  if (!input.factualResolutionState || !input.evidencePresent) {
    return "not_evaluated";
  }
  if (!isBase40AllowedState(input.factualResolutionState)) {
    return "not_evaluated";
  }
  return "available";
}

export function presentFactualResolutionLabel(
  state: string | null,
  dataStatus: RuntimeMatrixDataStatus,
): string {
  return presentBaseResolutionStateLabel(state, dataStatus);
}

export function presentFactualBlockingLabel(
  state: FactualBlockingState,
): string {
  switch (state) {
    case "blocked":
      return "Bloqueada";
    case "flag":
      return "Con flag";
    case "none":
      return "Sin bloqueo factual";
    case "unavailable":
      return "No disponible";
    default:
      return "No evaluada";
  }
}

/**
 * Catálogo Base 40 sin run: visible en panel oficial; factuales = No disponible.
 * dataStatus matriz = unavailable (no confundir con not_evaluated de run sin overlay).
 */
export function buildCatalogOnlyUnavailableBaseMatrixView(input?: {
  caseId?: string | null;
  activityId?: string | null;
  preRunChain?: boolean;
}): RuntimeBaseMatrixView {
  const { rows } = buildBaseMatrixRows({
    decisions: [],
    instances: [],
    mappings: [],
    sourceNodes: [],
    subfields: [],
    sourcesAvailable: false,
  });
  const hint = input?.preRunChain
    ? `${RUNTIME_MATRIX_NO_RUN_BANNER_BODY} ${RUNTIME_MATRIX_PRE_RUN_CHAIN_HINT}`
    : RUNTIME_MATRIX_NO_RUN_BANNER_BODY;
  return {
    context: {
      caseId: input?.caseId ?? "",
      participantLabel: null,
      functionalProfileLabel: null,
      activityId: input?.activityId ?? "",
      activityLabel: null,
      runId: "",
      catalogVersionLabel: null,
    },
    rows,
    dataStatus: "unavailable",
    message: hint,
  };
}

export type BuildBaseMatrixRowsInput = {
  decisions: BranchingDecisionRow[];
  instances: InteractionInstanceRow[];
  mappings?: InteractionMappingRow[];
  sourceNodes?: SourceNodeRefRow[];
  subfields?: SubfieldResponseRow[];
  sourcesAvailable?: boolean;
  explicitResolutionByBaseId?: Record<string, string>;
};

export function buildBaseMatrixRows(input: BuildBaseMatrixRowsInput): {
  rows: BaseMatrixRowVM[];
  evaluatedCount: number;
} {
  const mappings = input.mappings ?? [];
  const sourceNodes = input.sourceNodes ?? [];
  const subfields = input.subfields ?? [];
  const sourcesAvailable = input.sourcesAvailable !== false;
  let evaluatedCount = 0;

  const rows = RUNTIME_BASE_MATRIX_CATALOG.map((entry) => {
    const branching = findBranching(input.decisions, entry.id);
    const instance = findInstance(input.instances, entry.id);
    const reason = reasonForRow(branching);

    const selectedQuestionNode = sourcesAvailable
      ? resolveSelectedQuestionNode({
          baseId: entry.id,
          mappings,
          sourceNodes,
        })
      : null;

    const explicit = input.explicitResolutionByBaseId?.[entry.id] ?? null;
    const factualResolutionState = sourcesAvailable
      ? deriveFactualResolutionState({
          instance,
          subfields,
          explicitState: explicit,
        })
      : null;

    const evidencePresent = sourcesAvailable
      ? Boolean(
          explicit ||
            (instance &&
              subfields.some((s) => s.interactionInstanceId === instance.id)),
        )
      : null;

    const factualBlockingState = deriveFactualBlockingState({
      factualResolutionState,
      evidencePresent: Boolean(evidencePresent),
      sourcesAvailable,
      interactionConsultable: sourcesAvailable,
    });

    const dataStatus = rowDataStatus({
      sourcesAvailable,
      factualResolutionState,
      evidencePresent: Boolean(evidencePresent),
    });

    if (dataStatus === "available") evaluatedCount += 1;

    return {
      id: entry.id,
      displayId: entry.displayId,
      sourceNodes: [...entry.sourceNodes],
      selectedQuestionNode,
      selectionReasonLabel: reason.label,
      selectionReasonSource: reason.source,
      branchingDecisionId: reason.branchingDecisionId,
      mandatoryClosureRule: presentBaseCatalogPhrase(
        entry.mandatoryClosureRule ?? "",
      ),
      factualResolutionState,
      blockingRule: presentBaseCatalogPhrase(entry.failureBlockRule ?? ""),
      factualBlockingState,
      reviewActionLabel: null,
      functionLabel: entry.functionLabel,
      evidencePresent,
      dataStatus,
      resolutionViolation: factualResolutionState === "skipped_silently",
    } satisfies BaseMatrixRowVM;
  });

  return { rows, evaluatedCount };
}

export function resolveBaseMatrixDataStatus(
  rows: BaseMatrixRowVM[],
  sourcesAvailable: boolean,
): RuntimeMatrixDataStatus {
  if (!sourcesAvailable) return "unavailable";
  const evaluated = rows.filter((r) => r.dataStatus === "available");
  if (evaluated.length === 0) return "not_evaluated";

  const allAuthorized =
    rows.length === 40 &&
    rows.every(
      (r) =>
        r.dataStatus === "available" &&
        r.factualResolutionState != null &&
        isBase40AllowedState(r.factualResolutionState) &&
        !r.resolutionViolation &&
        r.evidencePresent === true,
    );

  if (allAuthorized) return "available";
  return "partial";
}

/**
 * Cierre causal: solo estado explícito autorizado.
 * epistemic_status de subcampo NO demuestra cierre de la causal.
 * Preferir resolveCausalFactualState / buildCausalMatrixRows.
 */
export function deriveFactualCausalClosureState(input: {
  instance: InteractionInstanceRow | null;
  subfields: SubfieldResponseRow[];
  explicitState?: string | null;
}): Causal20ClosureState | null {
  if (input.explicitState && isCausal20AllowedState(input.explicitState)) {
    return input.explicitState;
  }
  // Ausencia de instancia o subcampos con epistemic_status ≠ cierre causal.
  void input.instance;
  void input.subfields;
  return null;
}

export function deriveFactualActivationState(input: {
  factualClosureState: string | null;
  sourcesAvailable: boolean;
}): FactualActivationState {
  if (!input.sourcesAvailable) return "unavailable";
  if (!input.factualClosureState) return "not_evaluated";
  if (input.factualClosureState === "not_triggered_with_evidence") {
    return "not-triggered-with-evidence";
  }
  if (input.factualClosureState === "activation_unknown") return "unknown";
  if (isCausal20AllowedState(input.factualClosureState)) return "triggered";
  return "not_evaluated";
}

export function deriveCausalBlockingState(input: {
  factualClosureState: string | null;
  evidencePresent: boolean;
  sourcesAvailable: boolean;
}): FactualBlockingState {
  if (!input.sourcesAvailable) return "unavailable";
  if (!input.factualClosureState) return "not_evaluated";
  const state = input.factualClosureState;
  if (
    state === "route_missing" ||
    state === "contradiction_flag" ||
    state === "triggered_unanswered" ||
    state === "triggered_required"
  ) {
    return "blocked";
  }
  if (state === "manual_review_required" || state === "reentry_required") {
    return "flag";
  }
  if (CAUSAL20_CLOSED_STATES.has(state as Causal20ClosureState) && input.evidencePresent) {
    return "none";
  }
  if (state === "activation_unknown") return "flag";
  return "not_evaluated";
}

export function presentFactualActivationLabel(
  state: FactualActivationState,
): string {
  switch (state) {
    case "triggered":
      return "Activada";
    case "not-triggered-with-evidence":
      return "No activada con evidencia";
    case "unknown":
      return "Desconocida";
    case "unavailable":
      return "No disponible";
    default:
      return "No evaluada";
  }
}

export function presentCausalClosureLabel(
  state: string | null,
  dataStatus: RuntimeMatrixDataStatus,
): string {
  return presentCausalClosureResultLabel({
    factualClosureState: state,
    dataStatus,
  });
}

export function presentReadinessImpactLabel(input: {
  rule: boolean;
  factually: boolean | null;
  noRun: boolean;
}): string {
  if (input.noRun || input.factually == null) return "No evaluable";
  if (!input.rule) return "No bloquea";
  return input.factually ? "Bloquea" : "No bloquea";
}

export type BuildCausalMatrixRowsInput = {
  decisions: BranchingDecisionRow[];
  instances: InteractionInstanceRow[];
  subfields?: SubfieldResponseRow[];
  sourcesAvailable?: boolean;
  /** Estado causal explícito vigente por ID (misma causal / mismo run). */
  explicitClosureByCausalId?: Record<string, string>;
  /** Validación completa de variables obligatorias cuando el repo la puede comprobar. */
  closureValidationByCausalId?: Record<string, CausalClosureValidation>;
  runId?: string | null;
  activityId?: string | null;
  roleRuntimeSessionId?: string | null;
  explicitAbsenceOfBlockingByCausalId?: Record<string, boolean>;
};

export function buildCausalMatrixRows(input: BuildCausalMatrixRowsInput): {
  rows: CausalMatrixRowVM[];
  evaluatedCount: number;
} {
  const subfields = input.subfields ?? [];
  const sourcesAvailable = input.sourcesAvailable !== false;
  let evaluatedCount = 0;

  const rows = RUNTIME_CAUSAL_MATRIX_CATALOG.map((entry) => {
    const explicit = input.explicitClosureByCausalId?.[entry.id] ?? null;
    const closureValidation =
      input.closureValidationByCausalId?.[entry.id] ?? null;

    const overlay = resolveCausalFactualState({
      causalDefinition: entry,
      explicitClosureState: explicit,
      closureValidation,
      branchingDecisions: input.decisions,
      instances: input.instances,
      subfields,
      runId: input.runId,
      activityId: input.activityId,
      roleRuntimeSessionId: input.roleRuntimeSessionId,
      sourcesAvailable,
      explicitAbsenceOfBlocking:
        input.explicitAbsenceOfBlockingByCausalId?.[entry.id] === true,
    });

    const factualActivationState: FactualActivationState =
      overlay.activationState == null
        ? sourcesAvailable
          ? "not_evaluated"
          : "unavailable"
        : overlay.activationState;

    const factualBlockingState: FactualBlockingState =
      overlay.blockingState ??
      (sourcesAvailable ? "not_evaluated" : "unavailable");

    const selectionReasonSource: QuestionSelectionReasonSource =
      overlay.selectionReasonStatus === "available" && overlay.selectionReason
        ? "branching-decision"
        : "unavailable";

    const evidencePresent = sourcesAvailable
      ? overlay.evidenceCount != null && overlay.evidenceCount > 0
        ? true
        : overlay.closureState != null
          ? true
          : overlay.dataStatus === "not_evaluated"
            ? false
            : overlay.dataStatus === "partial" ||
                overlay.dataStatus === "conflict"
              ? true
              : false
      : null;

    if (overlay.dataStatus === "available") evaluatedCount += 1;

    const blocksFullReadinessFactually = computeBlocksFullReadinessFactually({
      blocksFullReadinessRule: entry.blocksFullReadiness,
      sourcesAvailable,
      overlay,
    });

    const closureSource =
      explicit && isCausal20AllowedState(explicit)
        ? ("explicit-state" as const)
        : closureValidation?.isComplete
          ? ("required-variable-validation" as const)
          : ("none" as const);

    return {
      id: entry.id,
      priority: entry.priority,
      priorityClassKey: entry.priorityClassKey,
      documentaryActivationRule: entry.activationRule,
      factualActivationState,
      selectionReasonLabel: overlay.selectionReason,
      selectionReasonSource,
      selectionReasonStatus: overlay.selectionReasonStatus,
      branchingDecisionId: overlay.branchingDecisionId,
      triggerSignalLabel: overlay.triggerSignalLabel,
      mandatoryClosureRule: presentBaseCatalogPhrase(entry.mandatoryClosureRule),
      factualClosureState: overlay.closureState,
      closureSource,
      closureValidation: {
        requiredCount: overlay.closureValidation.requiredCount,
        resolvedCount: overlay.closureValidation.resolvedCount,
        contradictionCount:
          closureValidation?.contradictoryVariableCodes.length ?? null,
        complete: overlay.closureValidation.complete,
      },
      blockingRule: presentCausalBlockingRuleLabel(entry.failureBlockRule),
      blockingTechnicalCode: entry.failureBlockRule,
      factualBlockingState,
      blocksFullReadinessRule: entry.blocksFullReadiness,
      blocksFullReadinessFactually,
      evidencePresent,
      dataStatus: overlay.dataStatus,
    } satisfies CausalMatrixRowVM;
  });

  return { rows, evaluatedCount };
}

export function resolveCausalMatrixDataStatus(
  rows: CausalMatrixRowVM[],
  sourcesAvailable: boolean,
): RuntimeMatrixDataStatus {
  if (!sourcesAvailable) return "unavailable";
  if (rows.some((r) => r.dataStatus === "error")) return "error";
  if (rows.some((r) => r.dataStatus === "conflict")) return "conflict";
  const evaluated = rows.filter((r) => r.dataStatus === "available");
  if (evaluated.length === 0) {
    if (rows.some((r) => r.dataStatus === "partial")) return "partial";
    return "not_evaluated";
  }
  const allAuthorized =
    rows.length === 20 &&
    rows.every(
      (r) =>
        r.dataStatus === "available" &&
        r.factualClosureState != null &&
        isCausal20AllowedState(r.factualClosureState) &&
        r.evidencePresent === true,
    );
  if (allAuthorized) return "available";
  return "partial";
}

export function buildCatalogOnlyUnavailableCausalMatrixView(input?: {
  caseId?: string | null;
  activityId?: string | null;
  preRunChain?: boolean;
}): RuntimeCausalMatrixView {
  const { rows } = buildCausalMatrixRows({
    decisions: [],
    instances: [],
    subfields: [],
    sourcesAvailable: false,
  });
  const hint = input?.preRunChain
    ? `${RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_BODY} ${RUNTIME_MATRIX_PRE_RUN_CHAIN_HINT}`
    : RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_BODY;
  return {
    context: {
      caseId: input?.caseId ?? "",
      participantLabel: null,
      functionalProfileLabel: null,
      activityId: input?.activityId ?? "",
      activityLabel: null,
      runId: "",
      catalogVersionLabel: null,
    },
    rows,
    dataStatus: "unavailable",
    message: hint,
  };
}

export async function buildRuntimeBaseMatrixView(
  repository: OfficialControlPanelRuntimeMatrixRepository,
  input: {
    caseId: string;
    runId: string;
    activityId: string;
    participantLabel?: string | null;
    functionalProfileLabel?: string | null;
    activityLabel?: string | null;
  },
): Promise<RuntimeBaseMatrixView> {
  const run = await repository.findRunById(input.runId);
  if (
    !run ||
    run.caseId !== input.caseId ||
    run.activityId !== input.activityId
  ) {
    throw new Error("runtime_matrix_run_scope_mismatch");
  }

  const context: RuntimeActivityContextVM = {
    caseId: input.caseId,
    participantLabel: input.participantLabel ?? null,
    functionalProfileLabel: input.functionalProfileLabel ?? null,
    activityId: input.activityId,
    activityLabel: input.activityLabel ?? null,
    runId: input.runId,
    catalogVersionLabel: run.catalogVersionId,
  };

  let sourcesAvailable = true;
  let decisions: BranchingDecisionRow[] = [];
  let instances: InteractionInstanceRow[] = [];
  let mappings: InteractionMappingRow[] = [];
  let sourceNodes: SourceNodeRefRow[] = [];
  let subfields: SubfieldResponseRow[] = [];

  try {
    [decisions, instances, subfields] = await Promise.all([
      repository.listBranchingDecisionsByRun(input.runId),
      repository.listInteractionInstancesByRun(input.runId),
      repository.listSubfieldResponsesByRun(input.runId),
    ]);
    if (run.catalogVersionId) {
      [mappings, sourceNodes] = await Promise.all([
        repository.listInteractionMappingsByCatalogVersion(
          run.catalogVersionId,
        ),
        repository.listSourceNodeRefsByCatalogVersion(run.catalogVersionId),
      ]);
    }
  } catch {
    sourcesAvailable = false;
  }

  const { rows } = buildBaseMatrixRows({
    decisions,
    instances,
    mappings,
    sourceNodes,
    subfields,
    sourcesAvailable,
  });

  const dataStatus = resolveBaseMatrixDataStatus(rows, sourcesAvailable);

  if (dataStatus === "unavailable") {
    return {
      context,
      rows,
      dataStatus,
      message: RUNTIME_MATRIX_SOURCES_UNAVAILABLE_MESSAGE,
    };
  }
  if (dataStatus === "not_evaluated") {
    return {
      context,
      rows,
      dataStatus,
      message: RUNTIME_MATRIX_EMPTY_MESSAGE,
    };
  }
  if (dataStatus === "partial") {
    return {
      context,
      rows,
      dataStatus,
      message: RUNTIME_MATRIX_PARTIAL_MESSAGE,
    };
  }
  return { context, rows, dataStatus, message: null };
}

export async function buildRuntimeCausalMatrixView(
  repository: OfficialControlPanelRuntimeMatrixRepository,
  input: {
    caseId: string;
    runId: string;
    activityId: string;
    participantLabel?: string | null;
    functionalProfileLabel?: string | null;
    activityLabel?: string | null;
  },
): Promise<RuntimeCausalMatrixView> {
  const run = await repository.findRunById(input.runId);
  if (
    !run ||
    run.caseId !== input.caseId ||
    run.activityId !== input.activityId
  ) {
    throw new Error("runtime_matrix_run_scope_mismatch");
  }

  const context: RuntimeActivityContextVM = {
    caseId: input.caseId,
    participantLabel: input.participantLabel ?? null,
    functionalProfileLabel: input.functionalProfileLabel ?? null,
    activityId: input.activityId,
    activityLabel: input.activityLabel ?? null,
    runId: input.runId,
    catalogVersionLabel: run.catalogVersionId,
  };

  let sourcesAvailable = true;
  let decisions: BranchingDecisionRow[] = [];
  let instances: InteractionInstanceRow[] = [];
  let subfields: SubfieldResponseRow[] = [];
  let explicitClosureByCausalId: Record<string, string> = {};
  let closureValidationByCausalId: Record<string, CausalClosureValidation> = {};
  let ledgerAvailable = false;

  try {
    [decisions, instances, subfields] = await Promise.all([
      repository.listBranchingDecisionsByRun(input.runId),
      repository.listInteractionInstancesByRun(input.runId),
      repository.listSubfieldResponsesByRun(input.runId),
    ]);
  } catch {
    sourcesAvailable = false;
  }

  if (sourcesAvailable && repository.listEffectiveCausalEvaluationsByRun) {
    try {
      const effective =
        await repository.listEffectiveCausalEvaluationsByRun(input.runId);
      ledgerAvailable = true;
      for (const evaluation of effective) {
        if (
          evaluation.closureState &&
          isCausal20AllowedState(evaluation.closureState)
        ) {
          explicitClosureByCausalId[evaluation.causalCode] =
            evaluation.closureState;
        }
        const resolved = evaluation.resolutions
          .filter((r) => r.resolutionState === "resolved")
          .map((r) => r.variableCode);
        const contradictory = evaluation.resolutions
          .filter((r) => r.resolutionState === "contradictory")
          .map((r) => r.variableCode);
        const allCodes = evaluation.resolutions.map((r) => r.variableCode);
        if (allCodes.length > 0) {
          closureValidationByCausalId[evaluation.causalCode] =
            validateCausalClosureVariables({
              requiredVariableCodes: allCodes,
              resolvedVariableCodes: resolved,
              contradictoryVariableCodes: contradictory,
              canonicalRouteClosed: evaluation.canonicalRouteClosed,
            });
        }
      }
    } catch {
      ledgerAvailable = false;
    }
  }

  const { rows } = buildCausalMatrixRows({
    decisions,
    instances,
    subfields,
    sourcesAvailable,
    runId: input.runId,
    activityId: input.activityId,
    roleRuntimeSessionId: run.roleRuntimeSessionId,
    explicitClosureByCausalId,
    closureValidationByCausalId,
  });

  const dataStatus = resolveCausalMatrixDataStatus(rows, sourcesAvailable);
  const ledgerNote =
    sourcesAvailable && !ledgerAvailable
      ? "Sin evaluaciones causales effective publicadas para este run."
      : null;

  if (dataStatus === "unavailable") {
    return {
      context,
      rows,
      dataStatus,
      message: [RUNTIME_MATRIX_SOURCES_UNAVAILABLE_MESSAGE, ledgerNote]
        .filter(Boolean)
        .join(" "),
    };
  }
  if (dataStatus === "not_evaluated") {
    return {
      context,
      rows,
      dataStatus,
      message: [RUNTIME_MATRIX_EMPTY_MESSAGE, ledgerNote]
        .filter(Boolean)
        .join(" "),
    };
  }
  if (dataStatus === "partial") {
    return {
      context,
      rows,
      dataStatus,
      message: [RUNTIME_MATRIX_PARTIAL_CAUSAL_MESSAGE, ledgerNote]
        .filter(Boolean)
        .join(" "),
    };
  }
  if (dataStatus === "conflict") {
    return {
      context,
      rows,
      dataStatus,
      message:
        "Existen decisiones o evaluaciones contradictorias en el run.",
    };
  }
  return {
    context,
    rows,
    dataStatus,
    message: null,
  };
}

export function getBaseMatrixRowDetail(
  view: RuntimeBaseMatrixView,
  baseId: string,
): BaseMatrixRowVM | null {
  return view.rows.find((row) => row.id === baseId) ?? null;
}

export function getCausalMatrixRowDetail(
  view: RuntimeCausalMatrixView,
  causalId: string,
): CausalMatrixRowVM | null {
  return view.rows.find((row) => row.id === causalId) ?? null;
}

export const BASE40_ALLOWED_STATES_FOR_PANEL = BASE40_ALLOWED_STATES;
