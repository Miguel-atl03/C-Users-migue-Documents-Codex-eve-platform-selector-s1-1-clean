/**
 * §12-B — Contratos de lectura Matrices Base 40 / Causal 20 (complemento v1.1).
 * Read-only. Razón de selección = branching_decision.reason, no §11.
 */

export type QuestionSelectionReasonSource =
  | "branching-decision"
  | "unavailable";

export type RuntimeMatrixDataStatus =
  | "available"
  | "partial"
  | "not_evaluated"
  | "unavailable"
  | "conflict"
  | "error";

export type SelectionReasonStatus =
  | "available"
  | "unavailable"
  | "conflict";

export type FactualBlockingState =
  | "none"
  | "flag"
  | "blocked"
  | "not_evaluated"
  | "unavailable";

export type FactualActivationState =
  | "triggered"
  | "not-triggered-with-evidence"
  | "unknown"
  | "not_evaluated"
  | "unavailable";

export type RuntimeActivityContextVM = {
  caseId: string;
  participantLabel: string | null;
  functionalProfileLabel: string | null;
  activityId: string;
  activityLabel: string | null;
  runId: string;
  catalogVersionLabel: string | null;
};

export type BaseMatrixRowVM = {
  id: string;
  displayId: string;
  sourceNodes: string[];
  selectedQuestionNode: string | null;
  selectionReasonLabel: string | null;
  selectionReasonSource: QuestionSelectionReasonSource;
  branchingDecisionId: string | null;
  mandatoryClosureRule: string;
  factualResolutionState: string | null;
  blockingRule: string;
  factualBlockingState: FactualBlockingState;
  reviewActionLabel: string | null;
  functionLabel: string;
  evidencePresent: boolean | null;
  dataStatus: RuntimeMatrixDataStatus;
  resolutionViolation: boolean;
};

export type CausalClosureSource =
  | "explicit-state"
  | "required-variable-validation"
  | "none";

export type CausalClosureValidationSummary = {
  requiredCount: number | null;
  resolvedCount: number | null;
  contradictionCount: number | null;
  complete: boolean | null;
};

export type CausalMatrixRowVM = {
  id: string;
  priority: "P0" | "P1" | "P2" | "P3";
  priorityClassKey: string;
  documentaryActivationRule: string;
  factualActivationState: FactualActivationState;
  selectionReasonLabel: string | null;
  selectionReasonSource: QuestionSelectionReasonSource;
  selectionReasonStatus: SelectionReasonStatus;
  branchingDecisionId: string | null;
  triggerSignalLabel: string | null;
  mandatoryClosureRule: string;
  factualClosureState: string | null;
  closureSource: CausalClosureSource;
  closureValidation: CausalClosureValidationSummary;
  blockingRule: string;
  /** Código(s) técnico(s) de bloqueo para tooltip/detalle secundario. */
  blockingTechnicalCode: string | null;
  factualBlockingState: FactualBlockingState;
  blocksFullReadinessRule: boolean;
  blocksFullReadinessFactually: boolean | null;
  evidencePresent: boolean | null;
  dataStatus: RuntimeMatrixDataStatus;
};

export type RuntimeBaseMatrixView = {
  context: RuntimeActivityContextVM;
  rows: BaseMatrixRowVM[];
  dataStatus: RuntimeMatrixDataStatus;
  message: string | null;
};

export type RuntimeCausalMatrixView = {
  context: RuntimeActivityContextVM;
  rows: CausalMatrixRowVM[];
  dataStatus: RuntimeMatrixDataStatus;
  message: string | null;
};

export type BranchingDecisionRow = {
  id: string;
  runId: string;
  caseId: string;
  activityId: string | null;
  openedInteractionId: string | null;
  closedInteractionId: string | null;
  triggerSignal: string | null;
  reason: string;
  decisionType: string;
  /** Vigencia factual opcional — sin regla, múltiples candidatas → conflict. */
  roleRuntimeSessionId?: string | null;
  effective?: boolean | null;
  status?: string | null;
  revokedAt?: string | null;
  supersededAt?: string | null;
};

export type InteractionInstanceRow = {
  id: string;
  runId: string;
  runtimeInteractionId: string;
  activityId: string | null;
  state: string;
  skippedReason: string | null;
};

export type InteractionMappingRow = {
  runtimeInteractionId: string;
  sourceNodeRef: string;
  mappingRole: string;
  catalogVersionId: string;
};

export type SourceNodeRefRow = {
  sourceNodeRef: string;
  sourceQuestionCode: string | null;
  catalogVersionId: string;
};

export type SubfieldResponseRow = {
  id: string;
  runId: string;
  interactionInstanceId: string;
  epistemicStatus: string;
};

export type ActivityRuntimeRunScope = {
  id: string;
  caseId: string;
  activityId: string | null;
  roleRuntimeSessionId: string;
  state: string;
  catalogVersionId: string | null;
};

export type OfficialControlPanelRuntimeMatrixRepository = {
  findRunById(runId: string): Promise<ActivityRuntimeRunScope | null>;
  listBranchingDecisionsByRun(runId: string): Promise<BranchingDecisionRow[]>;
  listInteractionInstancesByRun(
    runId: string,
  ): Promise<InteractionInstanceRow[]>;
  listInteractionMappingsByCatalogVersion(
    catalogVersionId: string,
  ): Promise<InteractionMappingRow[]>;
  listSourceNodeRefsByCatalogVersion(
    catalogVersionId: string,
  ): Promise<SourceNodeRefRow[]>;
  listSubfieldResponsesByRun(runId: string): Promise<SubfieldResponseRow[]>;
  listEffectiveCausalEvaluationsByRun?(
    runId: string,
  ): Promise<
    Array<{
      id: string;
      runId: string;
      causalCode: string;
      closureState: string | null;
      activationState: string | null;
      blockingState: string | null;
      branchingDecisionId: string | null;
      canonicalRouteClosed: boolean | null;
      evidenceComplete: boolean | null;
      blocksFullReadinessFactually: boolean | null;
      catalogVersionId: string | null;
      resolutions: Array<{
        variableCode: string;
        resolutionState: string;
        requiredVariableRuleId: string | null;
      }>;
    }>
  >;
  listRequiredVariableRules?(input: {
    catalogVersionId: string;
    causalCodes?: string[];
  }): Promise<
    Array<{
      id: string;
      causalCode: string;
      variableCode: string;
      requirementGroup: string;
      requirementOperator: "all_of" | "one_of";
      allowNotApplicableWithEvidence: boolean;
      sequence: number;
    }>
  >;
};

export const RUNTIME_MATRIX_EMPTY_MESSAGE =
  "Las filas del catálogo se muestran sin evaluación factual para este run.";
export const RUNTIME_MATRIX_PARTIAL_MESSAGE =
  "Hay evaluación factual parcial sobre el catálogo Base 40.";
export const RUNTIME_MATRIX_PARTIAL_CAUSAL_MESSAGE =
  "Hay evaluación factual parcial sobre el catálogo Causal 20.";
export const RUNTIME_MATRIX_ERROR_MESSAGE =
  "No fue posible cargar la matriz Runtime.";
export const RUNTIME_MATRIX_ACCESS_DENIED_MESSAGE =
  "No fue posible cargar la matriz Runtime.";
export const RUNTIME_MATRIX_SOURCES_UNAVAILABLE_MESSAGE =
  "No fue posible consultar las fuentes factuales de la matriz Base.";
export const RUNTIME_MATRIX_NO_RUN_BANNER_TITLE =
  "Matriz Base 40 sin evaluación";
export const RUNTIME_MATRIX_NO_RUN_BANNER_BODY =
  "No existe una ejecución Runtime para evaluar las interacciones Base de esta actividad.";
export const RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_TITLE =
  "Matriz Causal 20 sin evaluación";
export const RUNTIME_MATRIX_CAUSAL_NO_RUN_BANNER_BODY =
  "No existe una ejecución Runtime para evaluar las interacciones causales de esta actividad.";
export const RUNTIME_MATRIX_PRE_RUN_CHAIN_HINT =
  "La matriz estará disponible para evaluación cuando exista una persona, un perfil funcional, una sesión funcional, una selección efectiva, una actividad primaria y una ejecución Runtime vinculados.";

/**
 * Bloqueo documental (inspección 2026-07-17): no hay estado causal explícito
 * persistido ni cadena verificable de variables obligatorias sin inventar semántica.
 * Ver RECTOR_POINT_12_CAUSAL_MATRIX_IMPLEMENTATION.md § Fuentes factuales.
 */
export const RUNTIME_MATRIX_CAUSAL_FACTUAL_CLOSURE_BLOCKED_MESSAGE =
  "Cierre causal factual bloqueado por ausencia de estado causal explícito y catálogo verificable de variables obligatorias.";
