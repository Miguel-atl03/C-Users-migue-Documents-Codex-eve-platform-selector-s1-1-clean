import type {
  AgentConstitutionAuditEvent,
  AgentConstitutionEvaluationInput,
  AgentConstitutionEvaluationResult,
  AgentConstitutionFinding,
  AgentConstitutionReadinessState,
  AgentConstitutionSafetyFlags,
  AgentConstitutionSourceTrace,
} from "../domain/agent-constitution-evaluation.ts";

const SAFETY_FLAGS: AgentConstitutionSafetyFlags = {
  canBlockUserFlow: false,
  canModifyPayload: false,
  canWriteRegistry: false,
  canTriggerFinalDiagnosis: false,
  canTriggerProduction: false,
  runtimeAuthority: false,
};

function uniqueSourceTrace(
  sourceTrace: AgentConstitutionSourceTrace[],
): AgentConstitutionSourceTrace[] {
  const seen = new Set<string>();
  return sourceTrace.filter((trace) => {
    const key = `${trace.sourceId}:${trace.ruleId ?? ""}:${trace.locator}:${trace.authorityDomain}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function containsNeedle(value: string | undefined, needles: string[]): boolean {
  const normalized = (value ?? "").toLowerCase();
  return needles.some((needle) => normalized.includes(needle));
}

function hasTrace(sourceTrace: AgentConstitutionSourceTrace[], sourceId: string): boolean {
  return sourceTrace.some((trace) => trace.sourceId === sourceId);
}

function hasEvidenceSourceRefs(input: AgentConstitutionEvaluationInput): boolean {
  return input.evidenceItems.some((item) => item.sourceRefs.length > 0);
}

function finding(input: {
  index: number;
  ruleId: string;
  severity: AgentConstitutionFinding["severity"];
  state: AgentConstitutionReadinessState;
  message: string;
  sourceTrace?: AgentConstitutionSourceTrace[];
}): AgentConstitutionFinding {
  return {
    findingId: `ACF-${String(input.index).padStart(3, "0")}`,
    ruleId: input.ruleId,
    severity: input.severity,
    state: input.state,
    message: input.message,
    sourceTrace: uniqueSourceTrace(input.sourceTrace ?? []),
  };
}

function auditEvent(input: {
  index: number;
  eventType: AgentConstitutionAuditEvent["eventType"];
  message: string;
  sourceTrace?: AgentConstitutionSourceTrace[];
}): AgentConstitutionAuditEvent {
  return {
    eventId: `ACA-${String(input.index).padStart(3, "0")}`,
    eventType: input.eventType,
    message: input.message,
    sourceTrace: uniqueSourceTrace(input.sourceTrace ?? []),
  };
}

function result(input: {
  readinessState: AgentConstitutionReadinessState;
  inputClassification: string;
  sourceTrace: AgentConstitutionSourceTrace[];
  ruleIds: string[];
  allowedActions?: string[];
  blockedActions?: string[];
  requiredInputs?: string[];
  auditRequired?: boolean;
  nextChipOrService?: string | null;
  findings: AgentConstitutionFinding[];
  auditEvents: AgentConstitutionAuditEvent[];
}): AgentConstitutionEvaluationResult {
  return {
    version: "EVE_01_AGENT_CONSTITUTION_SHADOW_V1",
    mode: "constitutional_shadow",
    chipId: "EVE-01-AGENT-CONSTITUTION",
    readinessState: input.readinessState,
    decisionId: `ACD-${input.ruleIds.join("-") || "UNTRACED"}`,
    ruleIds: input.ruleIds,
    sourceTrace: uniqueSourceTrace(input.sourceTrace),
    inputClassification: input.inputClassification,
    allowedActions: input.allowedActions ?? [],
    blockedActions: input.blockedActions ?? [],
    requiredInputs: input.requiredInputs ?? [],
    auditRequired: input.auditRequired ?? false,
    nextChipOrService: input.nextChipOrService ?? null,
    findings: input.findings,
    auditEvents: input.auditEvents,
    safetyFlags: SAFETY_FLAGS,
  };
}

function isFinalDiagnosisRequest(input: AgentConstitutionEvaluationInput): boolean {
  return containsNeedle(input.requestedAction, ["final diagnosis", "final_diagnosis", "diagnostico final", "diagnóstico final"]) ||
    containsNeedle(input.requestedOutputType, ["final diagnosis", "final_diagnosis", "diagnostico final", "diagnóstico final"]);
}

function isDiagnosticPreclassificationRequest(
  input: AgentConstitutionEvaluationInput,
): boolean {
  return containsNeedle(input.requestedAction, [
    "diagnostic_preclassification",
    "preclassification",
    "preclasificacion",
    "preclasificación",
  ]) ||
    containsNeedle(input.requestedOutputType, [
      "diagnostic_preclassification",
      "preclassification",
      "preclasificacion",
      "preclasificación",
    ]);
}

function isParallelPreviewRequest(input: AgentConstitutionEvaluationInput): boolean {
  return containsNeedle(input.requestedAction, [
    "parallel_preview",
    "parallel export",
    "export",
    "production",
    "produccion",
    "producción",
  ]) ||
    containsNeedle(input.requestedOutputType, [
      "parallel_preview",
      "parallel export",
      "export",
      "production",
      "produccion",
      "producción",
    ]);
}

function isEvidenceDecisionRequest(input: AgentConstitutionEvaluationInput): boolean {
  return containsNeedle(input.requestedAction, [
    "capture_evidence",
    "create_structural_candidate",
    "evidence",
    "candidate",
  ]);
}

function isSensitiveAction(input: AgentConstitutionEvaluationInput): boolean {
  return !containsNeedle(input.requestedAction, ["capture_evidence"]);
}

export function evaluateAgentConstitutionShadow(
  input: AgentConstitutionEvaluationInput,
): AgentConstitutionEvaluationResult {
  if (input.mode !== "constitutional_shadow") {
    const findings = [
      finding({
        index: 1,
        ruleId: "SHADOW-INPUT-MODE",
        severity: "blocker",
        state: "manual_review_required",
        message: "Agent Constitution V1 only accepts constitutional_shadow mode.",
      }),
    ];
    return result({
      readinessState: "manual_review_required",
      inputClassification: input.inputClassification ?? "unclassified",
      sourceTrace: input.sourceTrace ?? [],
      ruleIds: ["SHADOW-INPUT-MODE"],
      blockedActions: [input.requestedAction ?? "unknown_action"],
      requiredInputs: ["mode:constitutional_shadow"],
      auditRequired: true,
      findings,
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_input_rejected",
          message: "Input rejected because mode is not constitutional_shadow.",
          sourceTrace: input.sourceTrace ?? [],
        }),
      ],
    });
  }

  if (input.sourceTrace.length === 0) {
    const findings = [
      finding({
        index: 1,
        ruleId: "SRC-008",
        severity: "blocker",
        state: "audit_required",
        message: "Constitutional decisions require source_trace.",
      }),
    ];
    return result({
      readinessState: "audit_required",
      inputClassification: input.inputClassification,
      sourceTrace: [],
      ruleIds: ["SRC-008"],
      requiredInputs: ["source_trace"],
      auditRequired: true,
      findings,
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_audit_required",
          message: "Audit required because source_trace is missing.",
        }),
      ],
    });
  }

  if (isFinalDiagnosisRequest(input)) {
    const ruleIds = ["SCP-001", "DGN-001"];
    const canPreparePreclassification = Boolean(input.methodKernelResult) &&
      hasTrace(input.sourceTrace, "D2");
    const findings = [
      finding({
        index: 1,
        ruleId: "SCP-001",
        severity: "blocker",
        state: "blocked_by_scope",
        message: "Capa 1 cannot emit final diagnostic decisions.",
        sourceTrace: input.sourceTrace,
      }),
    ];
    return result({
      readinessState: "blocked_by_scope",
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds,
      allowedActions: canPreparePreclassification
        ? ["diagnosticPreclassificationCandidate"]
        : ["request_method_kernel_result", "request_D2_mapping"],
      blockedActions: ["final_diagnosis"],
      requiredInputs: canPreparePreclassification ? [] : ["methodKernelResult", "D2_mapping"],
      auditRequired: true,
      nextChipOrService: canPreparePreclassification ? "diagnostic_preclassification_review" : null,
      findings,
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_scope_blocked",
          message: "Final diagnostic request was blocked by constitutional scope.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  if (isDiagnosticPreclassificationRequest(input)) {
    const hasMethodKernelResult = Boolean(input.methodKernelResult);
    const hasD2Trace = hasTrace(input.sourceTrace, "D2");
    if (hasMethodKernelResult && hasD2Trace) {
      return result({
        readinessState: "ready_for_diagnostic_preclassification",
        inputClassification: input.inputClassification,
        sourceTrace: input.sourceTrace,
        ruleIds: ["SRC-002", "DGN-002"],
        allowedActions: ["diagnosticPreclassificationCandidate"],
        blockedActions: ["final_diagnosis"],
        auditRequired: true,
        nextChipOrService: "diagnostic_preclassification_review",
        findings: [
          finding({
            index: 1,
            ruleId: "SRC-002",
            severity: "info",
            state: "ready_for_diagnostic_preclassification",
            message: "Diagnostic vocabulary can be prepared as preclassification with D2 trace and Method Kernel evidence.",
            sourceTrace: input.sourceTrace,
          }),
        ],
        auditEvents: [
          auditEvent({
            index: 1,
            eventType: "agent_constitution_diagnostic_preclassification_prepared",
            message: "Diagnostic preclassification candidate prepared in shadow mode.",
            sourceTrace: input.sourceTrace,
          }),
        ],
      });
    }

    const requiredInputs = [
      ...(!hasMethodKernelResult ? ["methodKernelResult"] : []),
      ...(!hasD2Trace ? ["D2_mapping"] : []),
    ];
    const state: AgentConstitutionReadinessState = hasD2Trace
      ? "blocked_by_missing_evidence"
      : "manual_review_required";
    return result({
      readinessState: state,
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds: ["SRC-002"],
      blockedActions: ["diagnosticPreclassificationCandidate"],
      requiredInputs,
      auditRequired: true,
      findings: [
        finding({
          index: 1,
          ruleId: "SRC-002",
          severity: "blocker",
          state,
          message: "Diagnostic preclassification requires Method Kernel evidence and D2 mapping.",
          sourceTrace: input.sourceTrace,
        }),
      ],
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_missing_evidence",
          message: "Diagnostic preclassification is missing required structural evidence.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  if (isParallelPreviewRequest(input)) {
    return result({
      readinessState: "export_blocked",
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds: ["SCP-004", "PPI-001", "PPI-002"],
      allowedActions: ["emit_required_inputs", "audit_payload_block"],
      blockedActions: ["production_payload_final", "registry_export"],
      requiredInputs: ["readiness", "authority_chain"],
      auditRequired: true,
      findings: [
        finding({
          index: 1,
          ruleId: "PPI-001",
          severity: "blocker",
          state: "export_blocked",
          message: "Parallel preview or export request lacks readiness and authority chain.",
          sourceTrace: input.sourceTrace,
        }),
      ],
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_export_blocked",
          message: "Export-like request blocked in constitutional shadow mode.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  if (
    isSensitiveAction(input) &&
    (input.inputClassification.trim() === "" || !input.targetBoundary)
  ) {
    return result({
      readinessState: "clarification_required",
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds: ["SCP-002"],
      requiredInputs: ["scope", "targetBoundary"],
      auditRequired: true,
      findings: [
        finding({
          index: 1,
          ruleId: "SCP-002",
          severity: "warning",
          state: "clarification_required",
          message: "Sensitive constitutional action requires explicit scope and target boundary.",
          sourceTrace: input.sourceTrace,
        }),
      ],
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_shadow_evaluated",
          message: "Shadow evaluation requires clarification for action scope.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  if (isEvidenceDecisionRequest(input) && input.evidenceItems.length === 0) {
    return result({
      readinessState: "blocked_by_missing_evidence",
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds: ["EPI-010"],
      requiredInputs: ["evidenceItems"],
      auditRequired: true,
      findings: [
        finding({
          index: 1,
          ruleId: "EPI-010",
          severity: "blocker",
          state: "blocked_by_missing_evidence",
          message: "Evidence decision request has no evidence items.",
          sourceTrace: input.sourceTrace,
        }),
      ],
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_missing_evidence",
          message: "Evidence items are required for this constitutional action.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  if (
    input.requestedAction === "capture_evidence" &&
    input.evidenceItems.length > 0 &&
    hasEvidenceSourceRefs(input)
  ) {
    return result({
      readinessState: "capture_allowed",
      inputClassification: input.inputClassification,
      sourceTrace: input.sourceTrace,
      ruleIds: ["SCP-002", "EPI-001"],
      allowedActions: ["capture_evidence"],
      auditRequired: false,
      findings: [
        finding({
          index: 1,
          ruleId: "SCP-002",
          severity: "info",
          state: "capture_allowed",
          message: "Traceable evidence capture is allowed in constitutional shadow mode.",
          sourceTrace: input.sourceTrace,
        }),
      ],
      auditEvents: [
        auditEvent({
          index: 1,
          eventType: "agent_constitution_shadow_evaluated",
          message: "Traceable evidence capture evaluated in shadow mode.",
          sourceTrace: input.sourceTrace,
        }),
      ],
    });
  }

  return result({
    readinessState: "manual_review_required",
    inputClassification: input.inputClassification,
    sourceTrace: input.sourceTrace,
    ruleIds: ["AUD-006"],
    requiredInputs: ["authorized_review"],
    auditRequired: true,
    findings: [
      finding({
        index: 1,
        ruleId: "AUD-006",
        severity: "warning",
        state: "manual_review_required",
        message: "Action is not covered by a minimal shadow rule and requires authorized review.",
        sourceTrace: input.sourceTrace,
      }),
    ],
    auditEvents: [
      auditEvent({
        index: 1,
        eventType: "agent_constitution_audit_required",
        message: "Uncovered constitutional action requires audit review.",
        sourceTrace: input.sourceTrace,
      }),
    ],
  });
}
