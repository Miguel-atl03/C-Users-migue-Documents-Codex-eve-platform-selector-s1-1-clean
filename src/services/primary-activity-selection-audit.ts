import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  ContextActivity,
  PrimaryActivitySelectionResult,
  SelectedPrimaryActivity,
  SelectionGateResult,
  SelectionScoreBreakdown,
} from "../domain/primary-activity-selection-policy.ts";
import { PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3 } from "../domain/primary-activity-selection-policy.v1.3.ts";
import type { WorkMapData } from "../domain/local-work-map.ts";
import { selectPrimaryActivitiesFromWorkMap } from "./primary-activity-selector.ts";

export const PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION =
  "PRIMARY_ACTIVITY_SELECTOR_TS_C3_12" as const;

export const PRIMARY_ACTIVITY_POLICY_ARTIFACT_PATH =
  "src/rules/primary-activity-selection-policy.v1.3.json" as const;

export const PRIMARY_ACTIVITY_POLICY_BASELINE_SHEETS = [
  "Activity_Quality_Gates_v1_2",
  "Under8_Policy_v1_2",
  "Selection_Mode_v1_2",
  "Context_Bundle_v1_2",
  "Context_Epistemic_v1_2",
  "Runtime_ContextRules_v1_2",
  "NonCompetitive_Log_v1_2",
  "QA_v1_2",
  "Implementation_Dicts_v1_2",
  "Significado_Handoff_v1_2",
  "Selection_Prec_v1_3",
  "Scoring_Model_v1_3",
  "Special_Slots_v1_3",
  "Reason_Codes_v1_3",
  "Trace_QA_v1_3",
  "Selector_Template_v1_3",
  "DirectorCostos_Cal_v1_3",
  "Platform_Impl_v1_3",
] as const;

export type PrimaryActivitySelectionPolicyManifest = {
  sourceNormativeDocument: string;
  runtimeReadsXlsx: false;
  machineReadableArtifact: string;
  machineReadableArtifactPath: typeof PRIMARY_ACTIVITY_POLICY_ARTIFACT_PATH;
  policyVersion: string;
  baselineSheets: readonly string[];
  baselineSheetVersions: Readonly<Record<string, string>>;
  canonicalRuleContent: typeof PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3;
  canonicalRuleContentHash: string;
  executablePolicyProjectionHash: string;
  machineReadableArtifactChecksum: string;
  selectorCodeVersion: typeof PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION;
  maxPrimaryActivities: number;
};

export type PrimaryActivitySelectionTraceItem = {
  activityId: string;
  responsibilityId: string;
  responsibilityTitle: string;
  activityIndex: number;
  activityTitle: string;
  activityDescription: string | null;
  activityDescriptionSource: ActivityDescriptionSource;
  classification: "primary" | "non_primary" | "pending";
  eligibilityStatus: "eligible" | "excluded" | "manual_review_required";
  exclusionReason: string | null;
  sourceReference: string;
  selectedSlot: number | null;
  preferredSlotCandidate: string | null;
  selectionStatus: string;
  selectionReasonCode: string | null;
  selectionReasonText: string | null;
  nonPrimaryContextStatus: string | null;
  promotionCondition: string | null;
  runtimeHandoffPriority: number | null;
  manualReviewRequired: boolean;
  score: SelectionScoreBreakdown | null;
  traceFlags: string[];
  ruleRefs: string[];
  notes: string[];
  decisionTrace: Record<string, unknown>;
};

export type PrimaryActivitySelectionAuditEnvelope = {
  policyManifest: PrimaryActivitySelectionPolicyManifest;
  policyManifestHash: string;
  selectorCodeVersion: typeof PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION;
  selectorGitCommit: string | null;
  workMapSnapshot: WorkMapData;
  workMapSnapshotHash: string;
  inputSnapshot: Record<string, unknown>;
  executionTimestamp: string;
  traceCompletenessStatus: "complete";
  resultHash: string;
  traceItems: PrimaryActivitySelectionTraceItem[];
};

export type ActivityDescriptionSource =
  | "workmap_explicit"
  | "absent"
  | "legacy_unknown";

export type ReplayPrimaryActivitySelectionInput = {
  workMapSnapshot: WorkMapData;
  expectedPolicyManifestHash: string;
  expectedSelectorCodeVersion: string;
  expectedResultHash: string;
  expectedTraceItems: PrimaryActivitySelectionTraceItem[];
};

export type ReplayPrimaryActivitySelectionResult = {
  status: "match" | "mismatch" | "unverifiable";
  policyManifestHash: string;
  selectorCodeVersion: string;
  recomputedResultHash: string | null;
  mismatches: string[];
};

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableJson(value));
}

export function hashStableJson(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}


export function loadMachineReadablePolicyArtifact(content?: string): typeof PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3 {
  const raw = content ?? readFileSync(
    resolve(process.cwd(), PRIMARY_ACTIVITY_POLICY_ARTIFACT_PATH),
    "utf8",
  );
  const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  return parsed as typeof PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3;
}

export function buildPrimaryActivitySelectionPolicyManifest(input: {
  machineReadableArtifactContent?: string;
  executablePolicyProjection?: typeof PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3;
} = {}): PrimaryActivitySelectionPolicyManifest {
  const canonicalRuleContent = loadMachineReadablePolicyArtifact(
    input.machineReadableArtifactContent,
  );
  const executablePolicyProjection =
    input.executablePolicyProjection ?? PRIMARY_ACTIVITY_SELECTION_POLICY_V1_3;
  const canonicalRuleContentHash = hashStableJson(canonicalRuleContent);
  const executablePolicyProjectionHash = hashStableJson(executablePolicyProjection);

  if (canonicalRuleContentHash !== executablePolicyProjectionHash) {
    throw new Error("primary_activity_policy_artifact_mismatch");
  }

  return {
    sourceNormativeDocument: canonicalRuleContent.authority.sourceNormativeDocument,
    runtimeReadsXlsx: false,
    machineReadableArtifact: canonicalRuleContent.authority.machineReadableSource,
    machineReadableArtifactPath: PRIMARY_ACTIVITY_POLICY_ARTIFACT_PATH,
    policyVersion: canonicalRuleContent.policyVersion,
    baselineSheets: PRIMARY_ACTIVITY_POLICY_BASELINE_SHEETS,
    baselineSheetVersions: Object.fromEntries(
      PRIMARY_ACTIVITY_POLICY_BASELINE_SHEETS.map((sheet) => [
        sheet,
        sheet.match(/v\d+_\d+/)?.[0] ?? "unversioned",
      ]),
    ),
    canonicalRuleContent,
    canonicalRuleContentHash,
    executablePolicyProjectionHash,
    machineReadableArtifactChecksum: canonicalRuleContentHash,
    selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
    maxPrimaryActivities: canonicalRuleContent.constants.maxPrimaryActivities,
  };
}

export function buildPrimaryActivitySelectionAuditEnvelope(input: {
  selectionResult: PrimaryActivitySelectionResult;
  sourceReference: string;
  selectorGitCommit?: string | null;
  executionTimestamp?: string;
}): PrimaryActivitySelectionAuditEnvelope {
  const policyManifest = buildPrimaryActivitySelectionPolicyManifest();
  const policyManifestHash = hashStableJson(policyManifest);
  const workMapSnapshotHash = hashStableJson(input.selectionResult.workMapSnapshot);
  const traceItems = buildTraceItems(input.selectionResult, input.sourceReference);
  const executionTimestamp = input.executionTimestamp ?? new Date().toISOString();
  const inputSnapshot = {
    sourceReference: input.sourceReference,
    workMapSnapshot: input.selectionResult.workMapSnapshot,
    runLog: input.selectionResult.runLog,
    gates: input.selectionResult.gates,
  };
  const resultHashPayload = {
    policyManifestHash,
    selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
    workMapSnapshotHash,
    mode: input.selectionResult.mode,
    eligibleCount: input.selectionResult.runLog.eligibleActivityCount,
    selectedActivityIds: input.selectionResult.selectedPrimaryActivities.map(
      (activity) => activity.activityId,
    ),
    nonPrimaryActivityIds: input.selectionResult.nonPrimaryContextActivities.map(
      (activity) => activity.activityId,
    ),
    traceItems: traceItems.map((item) => ({
      activityId: item.activityId,
      activityTitle: item.activityTitle,
      activityDescription: item.activityDescription,
      activityDescriptionSource: item.activityDescriptionSource,
      classification: item.classification,
      selectedSlot: item.selectedSlot,
      selectionReasonCode: item.selectionReasonCode,
      finalSelectionScore: item.score?.finalSelectionScore ?? null,
      eligibilityStatus: item.eligibilityStatus,
      nonPrimaryContextStatus: item.nonPrimaryContextStatus,
    })),
  };

  return {
    policyManifest,
    policyManifestHash,
    selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
    selectorGitCommit: input.selectorGitCommit ?? null,
    workMapSnapshot: input.selectionResult.workMapSnapshot,
    workMapSnapshotHash,
    inputSnapshot,
    executionTimestamp,
    traceCompletenessStatus: "complete",
    resultHash: hashStableJson(resultHashPayload),
    traceItems,
  };
}

export function replayPrimaryActivitySelection(
  input: ReplayPrimaryActivitySelectionInput,
): ReplayPrimaryActivitySelectionResult {
  const policyManifestHash = hashStableJson(buildPrimaryActivitySelectionPolicyManifest());
  if (!input.expectedTraceItems.length) {
    return {
      status: "unverifiable",
      policyManifestHash,
      selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
      recomputedResultHash: null,
      mismatches: ["legacy_selection_trace_incomplete"],
    };
  }

  if (input.expectedSelectorCodeVersion !== PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION) {
    return {
      status: "unverifiable",
      policyManifestHash,
      selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
      recomputedResultHash: null,
      mismatches: ["selector_code_version_unavailable"],
    };
  }

  const mismatches: string[] = [];
  if (input.expectedPolicyManifestHash !== policyManifestHash) {
    mismatches.push("policy_manifest_hash_mismatch");
  }

  const selectionResult = selectPrimaryActivitiesFromWorkMap(input.workMapSnapshot);
  const envelope = buildPrimaryActivitySelectionAuditEnvelope({
    selectionResult,
    sourceReference: "replay",
    executionTimestamp: "replay",
  });

  if (input.expectedResultHash !== envelope.resultHash) {
    mismatches.push("selection_result_hash_mismatch");
  }

  const expectedTrace = input.expectedTraceItems.map(traceComparable);
  const actualTrace = envelope.traceItems.map(traceComparable);
  if (stableStringify(expectedTrace) !== stableStringify(actualTrace)) {
    mismatches.push("selector_template_trace_mismatch");
  }

  return {
    status: mismatches.length ? "mismatch" : "match",
    policyManifestHash,
    selectorCodeVersion: PRIMARY_ACTIVITY_SELECTOR_CODE_VERSION,
    recomputedResultHash: envelope.resultHash,
    mismatches,
  };
}

function buildTraceItems(
  result: PrimaryActivitySelectionResult,
  sourceReference: string,
): PrimaryActivitySelectionTraceItem[] {
  const gatesByCandidate = groupGates(result.gates);
  const primaryItems = result.selectedPrimaryActivities.map((activity) =>
    tracePrimary(activity, sourceReference, gatesByCandidate.get(activity.activityId) ?? []),
  );
  const contextItems = result.nonPrimaryContextActivities.map((activity) =>
    traceContext(activity, sourceReference, gatesByCandidate.get(activity.activityId) ?? []),
  );
  const primaryIds = new Set(primaryItems.map((item) => item.activityId));
  const contextIds = new Set(contextItems.map((item) => item.activityId));
  const pendingItems = result.excludedActivities
    .filter(
      (activity) => !primaryIds.has(activity.activityId) && !contextIds.has(activity.activityId),
    )
    .map((activity) => ({
      ...activityDescriptionEvidence(activity),
      activityId: activity.activityId,
      responsibilityId: activity.responsibilityId,
      responsibilityTitle: activity.responsibilityLiteral,
      activityIndex: activity.sourceOrder,
      classification: "pending" as const,
      eligibilityStatus: "excluded" as const,
      exclusionReason: activity.exclusionReason,
      sourceReference: `${sourceReference}:${activity.sourcePath}`,
      selectedSlot: null,
      preferredSlotCandidate: null,
      selectionStatus: "excluded_by_quality_gate",
      selectionReasonCode: activity.exclusionReason,
      selectionReasonText: `Excluida por ${activity.exclusionReason}.`,
      nonPrimaryContextStatus: null,
      promotionCondition: null,
      runtimeHandoffPriority: null,
      manualReviewRequired: activity.exclusionReason === "granularity_review",
      score: null,
      traceFlags: traceFlagsFor(gatesByCandidate.get(activity.activityId) ?? []),
      ruleRefs: ["Activity_Quality_Gates_v1_2", "Trace_QA_v1_3"],
      notes: ["No se crea Runtime para actividades excluidas o pendientes."],
      decisionTrace: {
        gates: gatesByCandidate.get(activity.activityId) ?? [],
        exclusionReason: activity.exclusionReason,
      },
    }));

  return [...primaryItems, ...contextItems, ...pendingItems].sort(
    (left, right) => left.activityIndex - right.activityIndex,
  );
}

function tracePrimary(
  activity: SelectedPrimaryActivity,
  sourceReference: string,
  gates: SelectionGateResult[],
): PrimaryActivitySelectionTraceItem {
  const descriptionEvidence = activityDescriptionEvidence(activity);
  return {
    ...descriptionEvidence,
    activityId: activity.activityId,
    responsibilityId: activity.responsibilityId,
    responsibilityTitle: activity.responsibilityLiteral,
    activityIndex: activity.sourceOrder,
    classification: "primary",
    eligibilityStatus: "eligible",
    exclusionReason: null,
    sourceReference: `${sourceReference}:${activity.sourcePath}`,
    selectedSlot: activity.selectedSlot,
    preferredSlotCandidate: activity.score.preferredSlotCandidate ?? String(activity.selectedSlot),
    selectionStatus: "runtime_prepared",
    selectionReasonCode: activity.selectionReasonCode,
    selectionReasonText: activity.selectionReasonText,
    nonPrimaryContextStatus: null,
    promotionCondition: null,
    runtimeHandoffPriority: activity.runtimeOrder,
    manualReviewRequired: gates.some((gate) => gate.status === "warning"),
    score: activity.score,
    traceFlags: traceFlagsFor(gates),
    ruleRefs: [
      "Selector_Template_v1_3",
      "Scoring_Model_v1_3",
      "Special_Slots_v1_3",
      "Reason_Codes_v1_3",
      "Significado_Handoff_v1_2",
    ],
    notes: ["Actividad primaria seleccionada por EVE, no por el participante."],
    decisionTrace: {
      gates,
      signals: activity.score.detectedSignals,
      penalties: activity.penalties,
      slot: activity.selectedSlot,
      reasonCode: activity.selectionReasonCode,
    },
  };
}

function traceContext(
  activity: ContextActivity,
  sourceReference: string,
  gates: SelectionGateResult[],
): PrimaryActivitySelectionTraceItem {
  const descriptionEvidence = activityDescriptionEvidence(activity);
  return {
    ...descriptionEvidence,
    activityId: activity.activityId,
    responsibilityId: activity.responsibilityId,
    responsibilityTitle: activity.responsibilityTitle,
    activityIndex: activity.sourceOrder,
    classification: "non_primary",
    eligibilityStatus: "eligible",
    exclusionReason: null,
    sourceReference: `${sourceReference}:${activity.sourcePath}`,
    selectedSlot: null,
    preferredSlotCandidate: activity.score?.preferredSlotCandidate ?? null,
    selectionStatus: "selected_non_primary",
    selectionReasonCode: null,
    selectionReasonText: activity.contextReason,
    nonPrimaryContextStatus: activity.nonPrimaryContextStatus,
    promotionCondition: activity.promotionCondition,
    runtimeHandoffPriority: null,
    manualReviewRequired: gates.some((gate) => gate.status === "warning"),
    score: activity.score ?? null,
    traceFlags: traceFlagsFor(gates),
    ruleRefs: [
      "Context_Bundle_v1_2",
      "Context_Epistemic_v1_2",
      "NonCompetitive_Log_v1_2",
      "Trace_QA_v1_3",
    ],
    notes: ["Conservada como contexto; no se crea run Runtime."],
    decisionTrace: {
      gates,
      contextStatus: activity.contextStatus,
      promotionCondition: activity.promotionCondition,
      score: activity.score ?? null,
    },
  };
}

function groupGates(gates: SelectionGateResult[]): Map<string, SelectionGateResult[]> {
  return gates.reduce((map, gate) => {
    const existing = map.get(gate.candidateId) ?? [];
    existing.push(gate);
    map.set(gate.candidateId, existing);
    return map;
  }, new Map<string, SelectionGateResult[]>());
}

function traceFlagsFor(gates: SelectionGateResult[]): string[] {
  return gates
    .filter((gate) => gate.status !== "pass")
    .map((gate) => `${gate.gate}:${gate.status}`);
}

function activityDescriptionEvidence(activity: {
  activityLiteral: string;
  activityDescription?: unknown;
  description?: unknown;
}): {
  activityTitle: string;
  activityDescription: string | null;
  activityDescriptionSource: ActivityDescriptionSource;
} {
  const activityTitle = activity.activityLiteral.trim();
  const explicit = normalizeOptionalText(
    activity.activityDescription ?? activity.description,
  );

  if (explicit == null) {
    return {
      activityTitle,
      activityDescription: null,
      activityDescriptionSource: "absent",
    };
  }

  if (normalizeComparableText(explicit) === normalizeComparableText(activityTitle)) {
    throw new Error("duplicated_activity_description_input");
  }

  return {
    activityTitle,
    activityDescription: explicit,
    activityDescriptionSource: "workmap_explicit",
  };
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeComparableText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX");
}

function traceComparable(item: PrimaryActivitySelectionTraceItem) {
  return {
    activityId: item.activityId,
    activityTitle: item.activityTitle,
    activityDescription: item.activityDescription,
    activityDescriptionSource: item.activityDescriptionSource,
    classification: item.classification,
    eligibilityStatus: item.eligibilityStatus,
    selectedSlot: item.selectedSlot,
    selectionStatus: item.selectionStatus,
    selectionReasonCode: item.selectionReasonCode,
    nonPrimaryContextStatus: item.nonPrimaryContextStatus,
    finalSelectionScore: item.score?.finalSelectionScore ?? null,
    traceFlags: item.traceFlags,
  };
}

function sortForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortForStableJson(item)]),
    );
  }
  return value;
}




