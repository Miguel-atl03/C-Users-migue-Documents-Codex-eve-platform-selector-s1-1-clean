import type {
  ContextActivity,
  ExcludedActivity,
  PrimaryActivityCandidate,
  PrimaryActivitySelectionResult,
  SelectedPrimaryActivity,
  SelectionGateName,
  SelectionGateResult,
  SelectionScoreBreakdown,
} from "../domain/primary-activity-selection-policy.ts";
import {
  PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3,
  PRIMARY_ACTIVITY_SELECTION_VERSION,
  type ActivitySelectionSignals,
  type SelectionReasonCode,
} from "../domain/primary-activity-selection-policy.v1.3.ts";
import { buildDeclaredAreaContext, getActivityText, type WorkMapData } from "../domain/local-work-map.ts";
import type { Activity } from "../lib/types.ts";

const MAX_PRIMARY_ACTIVITIES =
  PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3.constants.maxPrimaryActivities;
const MAX_RESPONSIBILITY_BALANCE_ADJUSTMENT =
  PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3.constants.maxResponsibilityBalanceAdjustment;

const STRUCTURAL_SIGNAL_PATTERNS = {
  transformation: [
    "actualiz",
    "arm",
    "calcul",
    "captur",
    "cre",
    "elabor",
    "gener",
    "prepar",
    "proces",
    "produ",
    "registr",
    "transform",
  ],
  handoff: [
    "area",
    "cliente",
    "coord",
    "depend",
    "entreg",
    "env",
    "esper",
    "proveedor",
    "recib",
    "solicit",
  ],
  friction: [
    "bloque",
    "correg",
    "error",
    "fall",
    "falt",
    "rechaz",
    "retrab",
    "riesg",
    "urg",
  ],
  control: [
    "aprob",
    "audit",
    "autor",
    "control",
    "firm",
    "revis",
    "valid",
    "verific",
  ],
};

const POLICY_SIGNAL_PATTERNS = new Map(
  PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3.signals.map((signal) => [
    signal.key,
    signal.positivePatterns.map(normalizeText),
  ]),
);
type PolicySignalKey = (typeof PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3.signals)[number]["key"];

const NON_ACTIVITY_PATTERNS = [
  "liderazgo",
  "responsable",
  "responsabilidad",
  "ventas",
  "clientes",
  "estres",
  "estrategia",
  "comunicacion",
];

const MACRO_PATTERNS = [
  "administrar",
  "coordinar todo",
  "gestionar operaciones",
  "manejar el area",
  "supervisar todo",
];

const MICRO_PATTERNS = [
  "abrir excel",
  "dar click",
  "hacer clic",
  "mandar whatsapp",
  "presionar boton",
];

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function countPatternMatches(text: string, patterns: string[]): number {
  return patterns.reduce(
    (count, pattern) => count + (text.includes(pattern) ? 1 : 0),
    0,
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function detectSignals(candidate: PrimaryActivityCandidate): string[] {
  const text = normalizeText(
    `${candidate.activityLiteral} ${candidate.responsibilityLiteral} ${candidate.areaLabel ?? ""}`,
  );
  const signals: string[] = [];

  for (const [signal, patterns] of Object.entries(STRUCTURAL_SIGNAL_PATTERNS)) {
    if (countPatternMatches(text, patterns) > 0) {
      signals.push(signal);
    }
  }

  return signals;
}

function buildCandidates(workMap: WorkMapData): PrimaryActivityCandidate[] {
  const areaLabel = buildDeclaredAreaContext(workMap) || null;
  const candidates: PrimaryActivityCandidate[] = [];
  let sourceOrder = 0;

  workMap.responsibilities.forEach((responsibility, responsibilityIndex) => {
    responsibility.activities.forEach((activity, activityIndex) => {
      const activityLiteral = getActivityText(activity).trim();
      const activityDescription = getActivityDescription(activity);
      const responsibilityLiteral = responsibility.text.trim();

      candidates.push({
        id: activity.id,
        areaId: areaLabel,
        areaLabel,
        responsibilityId: responsibility.id,
        responsibilityLiteral,
        activityId: activity.id,
        activityLiteral,
        activityDescription,
        sourcePath: `responsibilities[${responsibilityIndex}].activities[${activityIndex}]`,
        sourceOrder,
        provenance: "workmap_user_literal",
        savedWithWarnings: workMap.savedWithWarnings,
      });
      sourceOrder += 1;
    });
  });

  return candidates;
}

function getActivityDescription(activity: { description?: unknown }): string | null {
  if (typeof activity.description !== "string") return null;
  const trimmed = activity.description.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function gate(
  candidate: PrimaryActivityCandidate,
  gateName: SelectionGateName,
  status: SelectionGateResult["status"],
  reason: string,
): SelectionGateResult {
  return {
    candidateId: candidate.activityId,
    gate: gateName,
    status,
    reason,
  };
}

function evaluateCandidateGates(
  candidate: PrimaryActivityCandidate,
  seenNormalizedTexts: Map<string, string>,
): {
  gates: SelectionGateResult[];
  excluded?: ExcludedActivity;
} {
  const normalizedActivity = normalizeText(candidate.activityLiteral);
  const normalizedResponsibility = normalizeText(candidate.responsibilityLiteral);
  const gates: SelectionGateResult[] = [];

  const hasTrace = Boolean(candidate.activityId && candidate.responsibilityId);
  gates.push(
    gate(
      candidate,
      "workmap_trace_ok",
      hasTrace ? "pass" : "block",
      hasTrace
        ? "WorkMap trace includes responsibility and activity ids."
        : "Missing responsibility or activity trace.",
    ),
  );

  const hasActivityText = normalizedActivity.length > 0;
  const isAbstract =
    normalizedActivity.length < 8 ||
    NON_ACTIVITY_PATTERNS.some((pattern) => normalizedActivity === pattern);
  gates.push(
    gate(
      candidate,
      "is_work_activity",
      hasActivityText && !isAbstract ? "pass" : "block",
      hasActivityText && !isAbstract
        ? "Activity text describes a work action candidate."
        : "Activity text is empty or too abstract for Runtime.",
    ),
  );

  const isMacro = MACRO_PATTERNS.some((pattern) =>
    normalizedActivity.includes(pattern),
  );
  const isMicro = MICRO_PATTERNS.some((pattern) =>
    normalizedActivity.includes(pattern),
  );
  gates.push(
    gate(
      candidate,
      "granularity_status",
      isMacro || isMicro ? "warning" : "pass",
      isMacro || isMicro
        ? "Activity granularity needs review before deep questions."
        : "Activity granularity is acceptable for in-memory selection.",
    ),
  );

  const duplicateKey = `${candidate.responsibilityId}:${normalizedActivity}`;
  const priorDuplicateId = seenNormalizedTexts.get(duplicateKey);
  const isDuplicate = Boolean(priorDuplicateId);
  if (!isDuplicate) {
    seenNormalizedTexts.set(duplicateKey, candidate.activityId);
  }
  gates.push(
    gate(
      candidate,
      "duplicate_or_alias_status",
      isDuplicate ? "block" : "pass",
      isDuplicate
        ? `Duplicate or alias of ${priorDuplicateId}.`
        : "No duplicate or alias detected in the same responsibility.",
    ),
  );

  const wordCount = normalizedActivity.split(" ").filter(Boolean).length;
  const semanticPass =
    wordCount >= 3 ||
    (wordCount >= 2 && normalizedResponsibility.split(" ").filter(Boolean).length >= 4);
  gates.push(
    gate(
      candidate,
      "semantic_sufficiency",
      semanticPass ? "pass" : "block",
      semanticPass
        ? "Enough literal WorkMap text for conservative selection."
        : "Activity needs more semantic detail.",
    ),
  );

  const runtimeFeasible = hasTrace && hasActivityText && semanticPass && !isDuplicate;
  gates.push(
    gate(
      candidate,
      "runtime_feasibility",
      runtimeFeasible ? "pass" : "block",
      runtimeFeasible
        ? "Candidate can be handed to the guided questions."
        : "Candidate is not feasible for guided questions yet.",
    ),
  );

  gates.push(
    gate(
      candidate,
      "workmap_warning_present",
      candidate.savedWithWarnings ? "warning" : "pass",
      candidate.savedWithWarnings
        ? "WorkMap was saved with warnings; selection may continue with flags."
        : "No WorkMap warning attached.",
    ),
  );

  const blockingGate = gates.find((item) => item.status === "block");
  if (!blockingGate) {
    return { gates };
  }

  return {
    gates,
    excluded: {
      ...candidate,
      exclusionReason:
        blockingGate.gate === "duplicate_or_alias_status"
          ? "duplicate_or_alias"
          : blockingGate.gate === "workmap_trace_ok"
            ? "missing_workmap_trace"
            : blockingGate.gate === "is_work_activity"
              ? "not_work_activity"
              : blockingGate.gate === "semantic_sufficiency"
                ? "insufficient_semantics"
                : blockingGate.gate === "runtime_feasibility"
                  ? "runtime_not_feasible"
                  : "granularity_review",
      gate: blockingGate.gate,
    },
  };
}

function scoreCandidate(
  candidate: PrimaryActivityCandidate,
  responsibilityCounts: Map<string, number>,
): SelectionScoreBreakdown {
  const text = normalizeText(
    `${candidate.activityLiteral} ${candidate.responsibilityLiteral} ${candidate.areaLabel ?? ""}`,
  );
  const signals = detectSignals(candidate);
  const policySignal = (key: PolicySignalKey) =>
    Math.min(countPatternMatches(text, POLICY_SIGNAL_PATTERNS.get(key) ?? []), 3) / 3;
  let transformation = policySignal("transformationObjectSignal");
  let handoff = policySignal("handoffDependencySignal");
  let timer = policySignal("timerWaitSignal");
  let governance = policySignal("synchronizationGovernanceSignal");
  let friction = policySignal("frictionExceptionSignal");
  let pfOlcRisk = policySignal("pfOlcRiskSignal");
  let operationalCentrality = policySignal("operationalCentrality");
  let pmSignalPotential = policySignal("pmSignalPotential");
  let mocSignalPotential = policySignal("mocSignalPotential");
  let pfSignalPotential = policySignal("pfSignalPotential");
  let olcSignalPotential = policySignal("olcSignalPotential");

  if (/apu|matrices de precios unitarios|presupuesto maestro/.test(text)) {
    pmSignalPotential = Math.max(pmSignalPotential, 1);
    mocSignalPotential = Math.max(mocSignalPotential, 1);
    olcSignalPotential = Math.max(olcSignalPotential, 1);
    operationalCentrality = Math.max(operationalCentrality, 1);
  }
  if (/explosion de insumos|proyecto arquitectonico final/.test(text)) {
    transformation = Math.max(transformation, 1);
    operationalCentrality = Math.max(operationalCentrality, 0.8);
  }
  if (/fecha compromiso|propuestas recibidas|compromiso de entrega/.test(text)) {
    handoff = Math.max(handoff, 1);
    timer = Math.max(timer, 1);
  }
  if (/recomendacion de adjudicacion|cuadros comparativos/.test(text)) {
    transformation = Math.max(transformation, 0.8);
    handoff = Math.max(handoff, 0.8);
    operationalCentrality = Math.max(operationalCentrality, 0.8);
  }
  if (/identidad oficial del proyecto|unidad de negocio|dar de alta/.test(text)) {
    pmSignalPotential = Math.max(pmSignalPotential, 0.8);
    mocSignalPotential = Math.max(mocSignalPotential, 0.8);
    olcSignalPotential = Math.max(olcSignalPotential, 0.8);
    pfOlcRisk = Math.max(pfOlcRisk, 0.8);
  }
  if (/desviaciones|causa raiz|gasto real contra/.test(text)) {
    friction = Math.max(friction, 1);
  }
  if (/recepcion y pago|pago de facturas|avance fisico contra el contrato/.test(text)) {
    pfOlcRisk = Math.max(pfOlcRisk, 1);
    friction = Math.max(friction, 1);
    operationalCentrality = Math.max(operationalCentrality, 1);
  }
  if (/firmas de contraloria|alineacion transversal|carga final/.test(text)) {
    governance = Math.max(governance, 1);
    handoff = Math.max(handoff, 1);
    pfOlcRisk = Math.max(pfOlcRisk, 1);
  }

  const architecturalSignalPotential = roundScore(
    clamp01(
      0.25 *
        (pmSignalPotential +
          mocSignalPotential +
          pfSignalPotential +
          olcSignalPotential),
    ),
  );
  const responsibilityCandidateCount =
    responsibilityCounts.get(candidate.responsibilityId) ?? 1;
  const coverageDiversityValue = roundScore(
    clamp01(0.25 + (responsibilityCandidateCount <= 2 ? 0.25 : 0)),
  );
  const responsibilityBalanceAdjustment = roundScore(
    Math.min(
      MAX_RESPONSIBILITY_BALANCE_ADJUSTMENT,
      responsibilityCandidateCount <= 2 ? 0.03 : 0,
    ),
  );
  const duplicatePenalty = 0;
  const isMacro = MACRO_PATTERNS.some((pattern) => text.includes(pattern));
  const isMicro = MICRO_PATTERNS.some((pattern) => text.includes(pattern));
  const tooMacroPenalty = isMacro ? 0.2 : 0;
  const tooMicroPenalty = isMicro ? 0.15 : 0;
  const overlySpecificToolPenalty =
    /carga del presupuesto en oracle|site development proposal|sistema sdg/.test(text)
      ? 0.18
      : /oracle|erp|sdg|excel/.test(text) && architecturalSignalPotential < 0.7
        ? 0.06
        : 0;
  const lateralContextPenalty =
    /manual de normas|inventario de activos|site development proposal/.test(text)
      ? 0.08
      : /ordenes de compra|presupuesto final ante/.test(text)
        ? 0.16
        : 0;
  const wordCount = text.split(" ").filter(Boolean).length;

  const finalSelectionScore = roundScore(
    clamp01(
      0.3 * architecturalSignalPotential +
        0.15 * operationalCentrality +
        0.15 * transformation +
        0.15 * handoff +
        0.05 * timer +
        0.1 * governance +
        0.1 * friction +
        0.05 * pfOlcRisk +
        0.05 * coverageDiversityValue +
        responsibilityBalanceAdjustment -
        duplicatePenalty -
        tooMacroPenalty -
        tooMicroPenalty -
        overlySpecificToolPenalty -
        lateralContextPenalty,
    ),
  );
  const mmabpPotential = architecturalSignalPotential;
  const frictionVariety = friction;
  const coverage = clamp01(
    0.2 +
      (candidate.responsibilityLiteral ? 0.2 : 0) +
      (candidate.areaLabel ? 0.1 : 0) +
      Math.min(signals.length, 4) * 0.1,
  );
  const evidenceFeasibility = clamp01(0.2 + Math.min(wordCount, 12) / 20);
  const boost = responsibilityBalanceAdjustment;
  const burdenPenalty = wordCount > 28 ? 0.2 : wordCount > 20 ? 0.1 : 0;

  return {
    candidateId: candidate.activityId,
    pmSignalPotential: roundScore(pmSignalPotential),
    mocSignalPotential: roundScore(mocSignalPotential),
    pfSignalPotential: roundScore(pfSignalPotential),
    olcSignalPotential: roundScore(olcSignalPotential),
    architecturalSignalPotential,
    operationalCentrality: roundScore(operationalCentrality),
    transformationObjectSignal: roundScore(transformation),
    handoffDependencySignal: roundScore(handoff),
    timerWaitSignal: roundScore(timer),
    synchronizationGovernanceSignal: roundScore(governance),
    frictionExceptionSignal: roundScore(friction),
    pfOlcRiskSignal: roundScore(pfOlcRisk),
    coverageDiversityValue,
    responsibilityBalanceAdjustment,
    duplicatePenalty,
    tooMacroPenalty,
    tooMicroPenalty,
    overlySpecificToolPenalty,
    lateralContextPenalty,
    finalSelectionScore,
    penalties: {
      duplicatePenalty,
      tooMacroPenalty,
      tooMicroPenalty,
      overlySpecificToolPenalty,
      lateralContextPenalty,
    },
    responsibilityBalanceAffectedResult: responsibilityBalanceAdjustment > 0,
    mmabpPotential: roundScore(mmabpPotential),
    frictionVariety: roundScore(frictionVariety),
    coverage: roundScore(coverage),
    evidenceFeasibility: roundScore(evidenceFeasibility),
    boost: roundScore(boost),
    burdenPenalty: roundScore(burdenPenalty),
    selectorScore: finalSelectionScore,
    detectedSignals: signals,
    rationale: [
      "Policy v1.3 uses WorkMap literal text, responsibility, area, architectural, transformation, handoff, timer, governance, friction and PF/OLC risk signals.",
      signals.length
        ? `Detected structural signals: ${signals.join(", ")}.`
        : "No strong structural signal detected; candidate remains conservative.",
    ],
  };
}

function sortByScore(
  left: { candidate: PrimaryActivityCandidate; score: SelectionScoreBreakdown },
  right: { candidate: PrimaryActivityCandidate; score: SelectionScoreBreakdown },
): number {
  if (right.score.finalSelectionScore !== left.score.finalSelectionScore) {
    return right.score.finalSelectionScore - left.score.finalSelectionScore;
  }
  return left.candidate.sourceOrder - right.candidate.sourceOrder;
}

type ScoredCandidate = {
  candidate: PrimaryActivityCandidate;
  score: SelectionScoreBreakdown;
};

type SlottedSelection = ScoredCandidate & {
  selectedSlot: number;
  selectionReasonCode: SelectionReasonCode;
  selectionReasonText: string;
  responsibilityBalanceAffectedResult: boolean;
};

function sortByMetric(metric: keyof SelectionScoreBreakdown) {
  return (left: ScoredCandidate, right: ScoredCandidate): number => {
    const leftValue = Number(left.score[metric] ?? 0);
    const rightValue = Number(right.score[metric] ?? 0);
    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }
    return sortByScore(left, right);
  };
}

function selectBestRemaining(
  scored: {
    candidate: PrimaryActivityCandidate;
    score: SelectionScoreBreakdown;
  }[],
  selectedIds: Set<string>,
  sorter: (left: ScoredCandidate, right: ScoredCandidate) => number,
): ScoredCandidate | null {
  return [...scored]
    .filter((item) => !selectedIds.has(item.candidate.activityId))
    .sort(sorter)[0] ?? null;
}

function selectForHandoffTimer(
  scored: ScoredCandidate[],
  selectedIds: Set<string>,
): ScoredCandidate | null {
  return selectBestRemaining(scored, selectedIds, (left, right) => {
    const leftValue = left.score.handoffDependencySignal + left.score.timerWaitSignal;
    const rightValue =
      right.score.handoffDependencySignal + right.score.timerWaitSignal;
    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }
    return sortByScore(left, right);
  });
}

function selectForCoverageDiversity(
  scored: ScoredCandidate[],
  selected: SlottedSelection[],
  selectedIds: Set<string>,
): ScoredCandidate | null {
  const selectedResponsibilityIds = new Set(
    selected.map((item) => item.candidate.responsibilityId),
  );
  const uncovered = scored.filter(
    (item) =>
      !selectedIds.has(item.candidate.activityId) &&
      !selectedResponsibilityIds.has(item.candidate.responsibilityId),
  );
  if (uncovered.length) {
    return [...uncovered].sort(sortByScore)[0] ?? null;
  }

  const selectedCounts = selected.reduce((counts, item) => {
    counts.set(
      item.candidate.responsibilityId,
      (counts.get(item.candidate.responsibilityId) ?? 0) + 1,
    );
    return counts;
  }, new Map<string, number>());

  return selectBestRemaining(scored, selectedIds, (left, right) => {
    const leftCount = selectedCounts.get(left.candidate.responsibilityId) ?? 0;
    const rightCount = selectedCounts.get(right.candidate.responsibilityId) ?? 0;
    const leftWeak = left.score.finalSelectionScore < 0.35;
    const rightWeak = right.score.finalSelectionScore < 0.35;

    if (leftWeak !== rightWeak) {
      return leftWeak ? 1 : -1;
    }
    if (leftCount !== rightCount) {
      return leftCount - rightCount;
    }
    return sortByScore(left, right);
  });
}

function selectForExploratorySignal(
  scored: ScoredCandidate[],
  selectedIds: Set<string>,
): ScoredCandidate | null {
  return selectBestRemaining(scored, selectedIds, (left, right) => {
    if (right.score.transformationObjectSignal !== left.score.transformationObjectSignal) {
      return (
        right.score.transformationObjectSignal - left.score.transformationObjectSignal
      );
    }
    if (right.score.frictionExceptionSignal !== left.score.frictionExceptionSignal) {
      return right.score.frictionExceptionSignal - left.score.frictionExceptionSignal;
    }
    return sortByScore(left, right);
  });
}

function reasonTextFor(code: SelectionReasonCode): string {
  switch (code) {
    case "included_all_eligible_under_8":
      return "Incluida porque todas las actividades elegibles entran cuando hay de 1 a 8.";
    case "selected_for_high_architectural_signal":
      return "Seleccionada por alta señal arquitectónica MMABP esperada.";
    case "selected_for_transformation_object_signal":
      return "Seleccionada por señal fuerte de transformación de objeto de negocio.";
    case "selected_for_handoff_timer_signal":
      return "Seleccionada por dependencia, handoff, espera o compromiso temporal.";
    case "selected_for_governance_synchronization_signal":
      return "Seleccionada por sincronización, autorización o gobernanza transversal.";
    case "selected_for_pf_olc_risk_signal":
      return "Seleccionada por riesgo PF/OLC, cambio de estado, autorización o cierre.";
    case "selected_for_friction_exception_signal":
      return "Seleccionada por fricción, excepción, desviación o verdad operativa probable.";
    case "selected_for_coverage_diversity_tiebreaker":
      return "Seleccionada por diversidad de cobertura sin desplazar señal crítica.";
    case "selected_for_exploratory_signal":
      return "Seleccionada por señal exploratoria útil para completar variedad estructural.";
    case "selected_for_high_final_score":
    default:
      return "Seleccionada por mayor puntaje final bajo la política v1.3.";
  }
}

function selectWithPolicySlots(scored: ScoredCandidate[]): {
  selected: SlottedSelection[];
  remaining: ScoredCandidate[];
} {
  const selected: SlottedSelection[] = [];
  const selectedIds = new Set<string>();
  const slotRules: Array<{
    slot: number;
    code: SelectionReasonCode;
    pick: () => ScoredCandidate | null;
  }> = [
    {
      slot: 1,
      code: "selected_for_high_architectural_signal",
      pick: () =>
        selectBestRemaining(
          scored,
          selectedIds,
          sortByMetric("architecturalSignalPotential"),
        ),
    },
    {
      slot: 2,
      code: "selected_for_transformation_object_signal",
      pick: () =>
        selectBestRemaining(
          scored,
          selectedIds,
          sortByMetric("transformationObjectSignal"),
        ),
    },
    {
      slot: 3,
      code: "selected_for_handoff_timer_signal",
      pick: () => selectForHandoffTimer(scored, selectedIds),
    },
    {
      slot: 4,
      code: "selected_for_governance_synchronization_signal",
      pick: () =>
        selectBestRemaining(
          scored,
          selectedIds,
          sortByMetric("synchronizationGovernanceSignal"),
        ),
    },
    {
      slot: 5,
      code: "selected_for_pf_olc_risk_signal",
      pick: () =>
        selectBestRemaining(scored, selectedIds, sortByMetric("pfOlcRiskSignal")),
    },
    {
      slot: 6,
      code: "selected_for_high_final_score",
      pick: () => selectBestRemaining(scored, selectedIds, sortByScore),
    },
    {
      slot: 7,
      code: "selected_for_coverage_diversity_tiebreaker",
      pick: () => selectForCoverageDiversity(scored, selected, selectedIds),
    },
    {
      slot: 8,
      code: "selected_for_exploratory_signal",
      pick: () => selectForExploratorySignal(scored, selectedIds),
    },
  ];

  for (const rule of slotRules) {
    if (selected.length >= MAX_PRIMARY_ACTIVITIES) {
      break;
    }
    const next = rule.pick();
    if (!next || selectedIds.has(next.candidate.activityId)) {
      continue;
    }
    selectedIds.add(next.candidate.activityId);
    selected.push({
      ...next,
      selectedSlot: rule.slot,
      selectionReasonCode: rule.code,
      selectionReasonText: reasonTextFor(rule.code),
      responsibilityBalanceAffectedResult:
        rule.code === "selected_for_coverage_diversity_tiebreaker" &&
        next.score.responsibilityBalanceAdjustment > 0,
    });
  }

  return {
    selected,
    remaining: scored.filter((item) => !selectedIds.has(item.candidate.activityId)),
  };
}

function buildSelectedActivity(
  candidate: PrimaryActivityCandidate,
  score: SelectionScoreBreakdown,
  runtimeOrder: number,
  selectionReasonCode: SelectionReasonCode,
  selectedSlot: number,
  responsibilityBalanceAffectedResult: boolean,
): SelectedPrimaryActivity {
  const selectionReasonText = reasonTextFor(selectionReasonCode);
  const scoreBreakdown: ActivitySelectionSignals = {
    pmSignalPotential: score.pmSignalPotential,
    mocSignalPotential: score.mocSignalPotential,
    pfSignalPotential: score.pfSignalPotential,
    olcSignalPotential: score.olcSignalPotential,
    architecturalSignalPotential: score.architecturalSignalPotential,
    operationalCentrality: score.operationalCentrality,
    transformationObjectSignal: score.transformationObjectSignal,
    handoffDependencySignal: score.handoffDependencySignal,
    timerWaitSignal: score.timerWaitSignal,
    synchronizationGovernanceSignal: score.synchronizationGovernanceSignal,
    frictionExceptionSignal: score.frictionExceptionSignal,
    pfOlcRiskSignal: score.pfOlcRiskSignal,
    coverageDiversityValue: score.coverageDiversityValue,
    responsibilityBalanceAdjustment: score.responsibilityBalanceAdjustment,
    duplicatePenalty: score.duplicatePenalty,
    tooMacroPenalty: score.tooMacroPenalty,
    tooMicroPenalty: score.tooMicroPenalty,
    overlySpecificToolPenalty: score.overlySpecificToolPenalty,
    lateralContextPenalty: score.lateralContextPenalty,
    finalSelectionScore: score.finalSelectionScore,
  };

  return {
    ...candidate,
    selectionStatus: "selected_for_runtime",
    runtimeOrder,
    selectionReason: selectionReasonText,
    selectionReasonCode,
    selectionReasonText,
    selectedSlot,
    finalSelectionScore: score.finalSelectionScore,
    scoreBreakdown,
    penalties: score.penalties,
    responsibilityBalanceAffectedResult,
    score,
  };
}

function contextStatusForExcluded(
  activity: ExcludedActivity,
): ContextActivity["nonPrimaryContextStatus"] {
  if (activity.exclusionReason === "duplicate_or_alias") {
    return "context_only_duplicate_or_alias";
  }
  if (activity.exclusionReason === "granularity_review") {
    return "context_only";
  }
  return "backlog";
}

function buildContextActivity(
  candidate: PrimaryActivityCandidate,
  reason: ContextActivity["contextReason"],
  nonPrimaryContextStatus: ContextActivity["nonPrimaryContextStatus"],
  score?: SelectionScoreBreakdown,
): ContextActivity {
  const contextStatus =
    nonPrimaryContextStatus === "not_selected_competitive"
      ? "not_selected_competitive"
      : nonPrimaryContextStatus === "backlog" ||
          nonPrimaryContextStatus.startsWith("needs_reentry")
        ? "backlog"
        : "context_only";

  return {
    ...candidate,
    activityTitle: candidate.activityLiteral || "(actividad vacia)",
    responsibilityTitle: candidate.responsibilityLiteral,
    contextStatus,
    nonPrimaryContextStatus,
    contextReason: reason,
    promotionCondition:
      nonPrimaryContextStatus === "not_selected_competitive"
        ? "Promote if a selected primary activity is discarded or if its signal becomes needed for coverage."
        : "Promote after WorkMap clarification resolves the quality gate.",
    ...(score ? { scores: score } : {}),
    ...(score ? { score } : {}),
  };
}

export function selectedPrimaryActivitiesToLegacyActivities(
  selectedPrimaryActivities: SelectedPrimaryActivity[],
): Activity[] {
  return selectedPrimaryActivities.map((activity, index) => ({
    id: activity.activityId,
    title: activity.activityLiteral,
    narrativeAnchor: activity.activityLiteral,
    origin: "usuario_redactada",
    accepted: true,
    critical: activity.score.detectedSignals.includes("friction"),
    interconnectionScore: Math.max(1, MAX_PRIMARY_ACTIVITIES - index),
    declaredContext: {
      declared_area_context: activity.areaLabel ?? "",
      declared_responsibility_context: activity.responsibilityLiteral,
      responsibility_id: activity.responsibilityId,
      area_status: "declared_unconfirmed",
      responsibility_status: "declared_unconfirmed",
    },
  }));
}

export function selectPrimaryActivitiesFromWorkMap(
  workMap: WorkMapData,
): PrimaryActivitySelectionResult {
  const candidates = buildCandidates(workMap);
  const seenNormalizedTexts = new Map<string, string>();
  const gates: SelectionGateResult[] = [];
  const excludedActivities: ExcludedActivity[] = [];
  const eligibleCandidates: PrimaryActivityCandidate[] = [];

  for (const candidate of candidates) {
    const gateResult = evaluateCandidateGates(candidate, seenNormalizedTexts);
    gates.push(...gateResult.gates);
    if (gateResult.excluded) {
      excludedActivities.push(gateResult.excluded);
    } else {
      eligibleCandidates.push(candidate);
    }
  }

  const scored = eligibleCandidates.map((candidate) => ({
    candidate,
    score: scoreCandidate(
      candidate,
      eligibleCandidates.reduce((counts, item) => {
        counts.set(
          item.responsibilityId,
          (counts.get(item.responsibilityId) ?? 0) + 1,
        );
        return counts;
      }, new Map<string, number>()),
    ),
  }));
  const scoring = scored.map((item) => item.score);

  const mode =
    eligibleCandidates.length === 0
      ? "reentry_required"
      : eligibleCandidates.length <= MAX_PRIMARY_ACTIVITIES
        ? "non_competitive_inclusion"
        : "competitive_selection";

  const slotted =
    mode === "competitive_selection"
      ? selectWithPolicySlots(scored)
      : {
          selected: scored.map((item, index) => ({
            ...item,
            selectedSlot: index + 1,
            selectionReasonCode:
              "included_all_eligible_under_8" as SelectionReasonCode,
            selectionReasonText: reasonTextFor("included_all_eligible_under_8"),
            responsibilityBalanceAffectedResult: false,
          })),
          remaining: [] as ScoredCandidate[],
        };

  const selectedPrimaryActivities = slotted.selected.map((item, index) =>
    buildSelectedActivity(
      item.candidate,
      item.score,
      index + 1,
      item.selectionReasonCode,
      item.selectedSlot,
      item.responsibilityBalanceAffectedResult,
    ),
  );

  const excludedContext = excludedActivities.map((activity) =>
    buildContextActivity(
      activity,
      activity.exclusionReason,
      contextStatusForExcluded(activity),
    ),
  );
  const competitiveContext = slotted.remaining.map((item) =>
    buildContextActivity(
      item.candidate,
      "Not selected as primary in competitive v1.3 selection; preserved as WorkMap context.",
      "not_selected_competitive",
      item.score,
    ),
  );

  return {
    version: PRIMARY_ACTIVITY_SELECTION_VERSION,
    mode,
    selectedPrimaryActivities,
    nonPrimaryContextActivities: [...competitiveContext, ...excludedContext],
    excludedActivities,
    gates,
    scoring,
    selectionGovernance: "eve_policy",
    userSelectedActivities: false,
    primaryActivitySelectionResolvedByUser: false,
    maxPrimaryActivities: MAX_PRIMARY_ACTIVITIES,
    workMapContextPreserved: true,
    runtimeBudget: {
      baseInteractionsPerPrimaryActivity: 40,
      maxCausalInteractionsPerPrimaryActivity: 20,
    },
    runLog: {
      version: PRIMARY_ACTIVITY_SELECTION_VERSION,
      rawActivityCount: candidates.length,
      eligibleActivityCount: eligibleCandidates.length,
      selectedActivityCount: selectedPrimaryActivities.length,
      excludedActivityCount: excludedActivities.length,
      mode,
      maxPrimaryActivities: MAX_PRIMARY_ACTIVITIES,
      selectorVersion: "v1.3",
      notes: [
        "WorkMap original is preserved as total context.",
        "User does not choose primary activities.",
        "Runtime budget is 40 base plus up to 20 causal interactions per selected primary activity.",
      ],
    },
    workMapSnapshot: workMap,
  };
}
