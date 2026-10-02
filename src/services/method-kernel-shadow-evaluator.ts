import type {
  MethodKernelAuditEvent,
  MethodKernelCandidateModel,
  MethodKernelEvaluationInput,
  MethodKernelEvaluationResult,
  MethodKernelEvidenceItem,
  MethodKernelFinding,
  MethodKernelReadinessState,
  MethodKernelSourceRef,
  MethodKernelStructuralCandidate,
} from "../domain/method-kernel-evaluation.ts";

const ALL_MODELS: MethodKernelCandidateModel[] = ["PM", "MoC", "PF", "OLC"];

function uniqueSourceRefs(sourceRefs: MethodKernelSourceRef[]): MethodKernelSourceRef[] {
  const seen = new Set<string>();
  return sourceRefs.filter((sourceRef) => {
    const key = `${sourceRef.sourceId}:${sourceRef.locator}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function finding(input: {
  index: number;
  ruleId: string;
  severity: MethodKernelFinding["severity"];
  state: MethodKernelReadinessState;
  message: string;
  candidateIds?: string[];
  evidenceItemIds?: string[];
  sourceRefs?: MethodKernelSourceRef[];
}): MethodKernelFinding {
  return {
    findingId: `MKF-${String(input.index).padStart(3, "0")}`,
    ruleId: input.ruleId,
    severity: input.severity,
    state: input.state,
    message: input.message,
    candidateIds: input.candidateIds ?? [],
    evidenceItemIds: input.evidenceItemIds ?? [],
    sourceRefs: uniqueSourceRefs(input.sourceRefs ?? []),
  };
}

function auditEvent(input: {
  index: number;
  eventType: MethodKernelAuditEvent["eventType"];
  message: string;
  sourceRefs?: MethodKernelSourceRef[];
}): MethodKernelAuditEvent {
  return {
    eventId: `MKA-${String(input.index).padStart(3, "0")}`,
    eventType: input.eventType,
    message: input.message,
    sourceRefs: uniqueSourceRefs(input.sourceRefs ?? []),
  };
}

function result(
  readinessState: MethodKernelReadinessState,
  findings: MethodKernelFinding[],
  auditEvents: MethodKernelAuditEvent[],
): MethodKernelEvaluationResult {
  return {
    version: "EVE_00_METHOD_KERNEL_SHADOW_V1",
    mode: "shadow",
    readinessState,
    findings,
    auditEvents,
    canBlockUserFlow: false,
    canModifyPayload: false,
    canWriteRegistry: false,
    canTriggerDiagnosis: false,
    runtimeAuthority: false,
  };
}

function evidenceIndex(
  evidenceItems: MethodKernelEvidenceItem[],
): Map<string, MethodKernelEvidenceItem> {
  return new Map(evidenceItems.map((item) => [item.evidenceItemId, item]));
}

function sourceRefsForCandidateEvidence(
  candidate: MethodKernelStructuralCandidate,
  evidenceById: Map<string, MethodKernelEvidenceItem>,
): MethodKernelSourceRef[] {
  return uniqueSourceRefs([
    ...candidate.sourceRefs,
    ...candidate.evidenceItemIds.flatMap(
      (evidenceItemId) => evidenceById.get(evidenceItemId)?.sourceRefs ?? [],
    ),
  ]);
}

export function evaluateMethodKernelShadow(
  input: MethodKernelEvaluationInput,
): MethodKernelEvaluationResult {
  if (input.mode !== "shadow") {
    const findings = [
      finding({
        index: 1,
        ruleId: "SHADOW-INPUT-MODE",
        severity: "blocker",
        state: "manual_review_required",
        message: "Method Kernel V1 only accepts explicit shadow mode input.",
      }),
    ];
    return result("manual_review_required", findings, [
      auditEvent({
        index: 1,
        eventType: "method_kernel_input_rejected",
        message: "Input rejected because mode is not shadow.",
      }),
    ]);
  }

  if (input.candidates.length === 0) {
    const findings = [
      finding({
        index: 1,
        ruleId: "FND-002",
        severity: "blocker",
        state: "blocked_by_missing_evidence",
        message: "No PM/MoC/PF/OLC candidate exists for minimal architecture evaluation.",
      }),
    ];
    return result("blocked_by_missing_evidence", findings, [
      auditEvent({
        index: 1,
        eventType: "method_kernel_missing_evidence_detected",
        message: "No structural candidates were provided.",
      }),
    ]);
  }

  const findings: MethodKernelFinding[] = [];
  const auditEvents: MethodKernelAuditEvent[] = [];
  const evidenceById = evidenceIndex(input.evidenceItems);
  let findingIndex = 1;
  let auditIndex = 1;

  for (const candidate of input.candidates) {
    if (candidate.sourceRefs.length === 0) {
      findings.push(
        finding({
          index: findingIndex,
          ruleId: "FND-007",
          severity: "blocker",
          state: "blocked_by_missing_evidence",
          message: "Structural candidate is missing source references.",
          candidateIds: [candidate.candidateId],
          evidenceItemIds: candidate.evidenceItemIds,
        }),
      );
      findingIndex += 1;
    }

    const missingEvidenceIds = candidate.evidenceItemIds.filter(
      (evidenceItemId) => !evidenceById.has(evidenceItemId),
    );
    if (missingEvidenceIds.length > 0) {
      findings.push(
        finding({
          index: findingIndex,
          ruleId: "FND-007",
          severity: "blocker",
          state: "blocked_by_missing_evidence",
          message: "Structural candidate references evidence items that do not exist.",
          candidateIds: [candidate.candidateId],
          evidenceItemIds: missingEvidenceIds,
          sourceRefs: candidate.sourceRefs,
        }),
      );
      findingIndex += 1;
    }
  }

  for (const evidenceItem of input.evidenceItems) {
    if (evidenceItem.sourceRefs.length === 0) {
      findings.push(
        finding({
          index: findingIndex,
          ruleId: "FND-007",
          severity: "warning",
          state: "manual_review_required",
          message: "Evidence item is missing source references and requires manual review.",
          evidenceItemIds: [evidenceItem.evidenceItemId],
        }),
      );
      findingIndex += 1;
    }
  }

  const hasBlockedByMissingEvidence = findings.some(
    (item) => item.state === "blocked_by_missing_evidence",
  );
  if (hasBlockedByMissingEvidence) {
    auditEvents.push(
      auditEvent({
        index: auditIndex,
        eventType: "method_kernel_missing_evidence_detected",
        message: "Missing evidence or source references were detected.",
        sourceRefs: input.candidates.flatMap((candidate) =>
          sourceRefsForCandidateEvidence(candidate, evidenceById),
        ),
      }),
    );
    auditIndex += 1;
    return result("blocked_by_missing_evidence", findings, auditEvents);
  }

  const hasManualReview = findings.some(
    (item) => item.state === "manual_review_required",
  );
  if (hasManualReview) {
    auditEvents.push(
      auditEvent({
        index: auditIndex,
        eventType: "method_kernel_shadow_evaluated",
        message: "Shadow evaluation completed with manual review required.",
        sourceRefs: input.evidenceItems.flatMap((item) => item.sourceRefs),
      }),
    );
    return result("manual_review_required", findings, auditEvents);
  }

  const validCandidates = input.candidates.filter(
    (candidate) =>
      candidate.sourceRefs.length > 0 &&
      candidate.evidenceItemIds.length > 0 &&
      candidate.evidenceItemIds.every((evidenceItemId) => {
        const evidenceItem = evidenceById.get(evidenceItemId);
        return Boolean(evidenceItem && evidenceItem.sourceRefs.length > 0);
      }),
  );

  if (validCandidates.length === 0) {
    const noValidFindings = [
      finding({
        index: findingIndex,
        ruleId: "FND-002",
        severity: "blocker",
        state: "blocked_by_missing_evidence",
        message: "No structurally valid candidate has evidence and source references.",
      }),
    ];
    return result("blocked_by_missing_evidence", noValidFindings, [
      auditEvent({
        index: auditIndex,
        eventType: "method_kernel_missing_evidence_detected",
        message: "No valid structural candidates were available.",
      }),
    ]);
  }

  const presentModels = new Set(validCandidates.map((candidate) => candidate.model));
  const missingModels = ALL_MODELS.filter((model) => !presentModels.has(model));

  if (missingModels.length > 0) {
    findings.push(
      finding({
        index: findingIndex,
        ruleId: "FND-002",
        severity: "warning",
        state: "ready_with_flags",
        message: `Partial architecture candidate set is missing: ${missingModels.join(", ")}.`,
        candidateIds: validCandidates.map((candidate) => candidate.candidateId),
        evidenceItemIds: validCandidates.flatMap((candidate) => candidate.evidenceItemIds),
        sourceRefs: validCandidates.flatMap((candidate) =>
          sourceRefsForCandidateEvidence(candidate, evidenceById),
        ),
      }),
    );
    auditEvents.push(
      auditEvent({
        index: auditIndex,
        eventType: "method_kernel_shadow_evaluated",
        message: "Shadow evaluation completed with methodological flags.",
        sourceRefs: validCandidates.flatMap((candidate) =>
          sourceRefsForCandidateEvidence(candidate, evidenceById),
        ),
      }),
    );
    return result("ready_with_flags", findings, auditEvents);
  }

  auditEvents.push(
    auditEvent({
      index: auditIndex,
      eventType: "method_kernel_shadow_evaluated",
      message: "Shadow evaluation completed with all PM/MoC/PF/OLC candidates present.",
      sourceRefs: validCandidates.flatMap((candidate) =>
        sourceRefsForCandidateEvidence(candidate, evidenceById),
      ),
    }),
  );
  return result("ready", findings, auditEvents);
}

