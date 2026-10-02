import type {
  DiagnosticOntologyAuditEvent,
  DiagnosticOntologyCompartmentId,
  DiagnosticOntologyEvaluationInput,
  DiagnosticOntologyEvaluationResult,
  DiagnosticOntologyFinding,
  DiagnosticOntologyModel,
  DiagnosticOntologyReadinessState,
  DiagnosticOntologySafetyFlags,
  DiagnosticOntologySourceTrace,
} from "../domain/diagnostic-ontology-evaluation.ts";

type CompartmentDefinition = {
  id: DiagnosticOntologyCompartmentId;
  models: DiagnosticOntologyModel[];
  pathology: string;
  aliases: string[];
  diagnosticQuestion: string;
  ruleId: string;
};

const SAFETY_FLAGS: DiagnosticOntologySafetyFlags = {
  canBlockUserFlow: false,
  canModifyPayload: false,
  canWriteRegistry: false,
  canTriggerFinalDiagnosis: false,
  canTriggerIR: false,
  canTriggerExport: false,
  canTriggerProduction: false,
  runtimeAuthority: false,
};

const COMPARTMENTS: Record<DiagnosticOntologyCompartmentId, CompartmentDefinition> = {
  "EVE02-CMP-001": {
    id: "EVE02-CMP-001",
    models: ["PM", "MoC"],
    pathology: "Esquizofrenia Ontológica",
    aliases: [],
    diagnosticQuestion:
      "¿Los procesos hablan de objetos que no hemos definido, o hemos definido objetos que ningún proceso utiliza?",
    ruleId: "EVE02-R006",
  },
  "EVE02-CMP-002": {
    id: "EVE02-CMP-002",
    models: ["PM", "PF"],
    pathology: "Brecha Intencional",
    aliases: [],
    diagnosticQuestion:
      "¿El proceso real (PF) sigue el camino declarado en el mapa (PM)? ¿Los disparadores y resultados coinciden?",
    ruleId: "EVE02-R007",
  },
  "EVE02-CMP-003": {
    id: "EVE02-CMP-003",
    models: ["MoC", "PF"],
    pathology: "Anarquía Operacional",
    aliases: [],
    diagnosticQuestion:
      "¿El proceso (PF) utiliza y manipula los objetos (MoC) de forma coherente con su definición?",
    ruleId: "EVE02-R008",
  },
  "EVE02-CMP-004": {
    id: "EVE02-CMP-004",
    models: ["PF", "OLC"],
    pathology: "Violación Causal",
    aliases: [],
    diagnosticQuestion:
      "¿El flujo del proceso (PF) respeta las leyes físicas del objeto (OLC)? ¿Intenta forzar estados inválidos?",
    ruleId: "EVE02-R009",
  },
  "EVE02-CMP-005": {
    id: "EVE02-CMP-005",
    models: ["OLC", "MoC"],
    pathology: "Amnesia Estructural",
    aliases: [],
    diagnosticQuestion:
      "¿El ciclo de vida (OLC) es consistente con la estructura del objeto (MoC)? ¿Todas las operaciones están en el OLC?",
    ruleId: "EVE02-R010",
  },
  "EVE02-CMP-006": {
    id: "EVE02-CMP-006",
    models: ["PF", "OLC"],
    pathology: "Tortura Causal",
    aliases: [],
    diagnosticQuestion:
      "¿La secuencia de estados que impone el proceso (PF) es una secuencia válida y lógica según el ciclo de vida del objeto (OLC)?",
    ruleId: "EVE02-R011",
  },
  "EVE02-CMP-007": {
    id: "EVE02-CMP-007",
    models: ["PF", "OLC"],
    pathology: "Falsa Elección",
    aliases: [],
    diagnosticQuestion:
      "¿Las alternativas y decisiones en el proceso (PF) se corresponden con las alternativas causales reales del objeto (OLC)?",
    ruleId: "EVE02-R012",
  },
  "EVE02-CMP-008": {
    id: "EVE02-CMP-008",
    models: ["OLC", "MoC"],
    pathology: "Incapacidad de Gestión de Conjuntos",
    aliases: [],
    diagnosticQuestion:
      "¿Una relación 1:N en el modelo de conceptos (MoC) se refleja como un ciclo iterativo en el ciclo de vida (OLC)?",
    ruleId: "EVE02-R013",
  },
  "EVE02-CMP-009": {
    id: "EVE02-CMP-009",
    models: ["PM", "MoC", "PF"],
    pathology: "Arquitectura Fantasma",
    aliases: [],
    diagnosticQuestion:
      "¿El proceso declarado en el mapa (PM), los objetos que dice manipular (MoC) y la forma en que realmente se ejecuta (PF) cuentan la misma historia?",
    ruleId: "EVE02-R014",
  },
  "EVE02-CMP-010": {
    id: "EVE02-CMP-010",
    models: ["PM", "PF", "OLC"],
    pathology: "Promesa Imposible",
    aliases: [],
    diagnosticQuestion:
      "¿La intención del proceso (PM), su ejecución paso a paso (PF) y las leyes causales de los objetos que manipula (OLC) son temporalmente coherentes?",
    ruleId: "EVE02-R015",
  },
  "EVE02-CMP-011": {
    id: "EVE02-CMP-011",
    models: ["PM", "MoC", "OLC"],
    pathology: "Identidad Disociada",
    aliases: [],
    diagnosticQuestion:
      "¿Los procesos declarados (PM) son coherentes con la ontología (MoC) y con las leyes causales (OLC) de los objetos que dicen gestionar?",
    ruleId: "EVE02-R016",
  },
  "EVE02-CMP-012": {
    id: "EVE02-CMP-012",
    models: ["MoC", "PF", "OLC"],
    pathology: "Competencia Causal",
    aliases: [],
    diagnosticQuestion:
      "¿La estructura del objeto (MoC), la forma en que el proceso lo manipula (PF) y las leyes de su propia vida (OLC) son mutuamente consistentes?",
    ruleId: "EVE02-R017",
  },
  "EVE02-CMP-013": {
    id: "EVE02-CMP-013",
    models: ["PM", "MoC", "PF", "OLC"],
    pathology: "Incoherencia Sistémica Total",
    aliases: ["Esquizofrenia Organizacional"],
    diagnosticQuestion:
      "¿La totalidad del sistema — su intención (PM), su ontología (MoC), su ejecución (PF) y su causalidad (OLC) — cuenta una historia coherente?",
    ruleId: "EVE02-R018",
  },
};

const TIMER_DEPENDENT_COMPARTMENTS = new Set<DiagnosticOntologyCompartmentId>([
  "EVE02-CMP-004",
  "EVE02-CMP-006",
  "EVE02-CMP-007",
  "EVE02-CMP-010",
  "EVE02-CMP-012",
]);

const PROHIBITED_OUTPUTS = [
  "final_diagnosis",
  "IR",
  "registry_write",
  "export_payload",
  "production_real",
  "monetization_decision",
  "transduction",
];

function isCompartmentId(value: string): value is DiagnosticOntologyCompartmentId {
  return Object.hasOwn(COMPARTMENTS, value);
}

function uniqueSourceTrace(
  sourceTrace: DiagnosticOntologySourceTrace[],
): DiagnosticOntologySourceTrace[] {
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

function hasSourceTrace(input: DiagnosticOntologyEvaluationInput, sourceId: string): boolean {
  return input.source_trace.some((trace) => trace.sourceId === sourceId) ||
    input.evidence_refs.some((evidence) =>
      evidence.sourceTrace.some((trace) => trace.sourceId === sourceId)
    );
}

function hasSameModels(left: DiagnosticOntologyModel[], right: DiagnosticOntologyModel[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((model) => rightSet.has(model));
}

function isProhibitedOutput(value: string | undefined): string | null {
  const normalized = (value ?? "").toLowerCase();
  return PROHIBITED_OUTPUTS.find((output) => normalized.includes(output.toLowerCase())) ?? null;
}

function hasFourViewEvidence(input: DiagnosticOntologyEvaluationInput): boolean {
  if (!hasSameModels(input.involved_models, ["PM", "MoC", "PF", "OLC"])) {
    return false;
  }
  const evidenceModelTags = new Set<DiagnosticOntologyModel>();
  for (const evidence of input.evidence_refs) {
    for (const model of ["PM", "MoC", "PF", "OLC"] as DiagnosticOntologyModel[]) {
      if (evidence.evidenceRefId.toLowerCase().includes(model.toLowerCase())) {
        evidenceModelTags.add(model);
      }
    }
  }
  return input.evidence_refs.length >= 4 || evidenceModelTags.size === 4;
}

function finding(input: {
  index: number;
  ruleId: string;
  severity: DiagnosticOntologyFinding["severity"];
  state: DiagnosticOntologyReadinessState;
  message: string;
  sourceTrace?: DiagnosticOntologySourceTrace[];
}): DiagnosticOntologyFinding {
  return {
    findingId: `DOF-${String(input.index).padStart(3, "0")}`,
    ruleId: input.ruleId,
    severity: input.severity,
    state: input.state,
    message: input.message,
    sourceTrace: uniqueSourceTrace(input.sourceTrace ?? []),
  };
}

function auditEvent(input: {
  index: number;
  eventType: DiagnosticOntologyAuditEvent["eventType"];
  message: string;
  sourceTrace?: DiagnosticOntologySourceTrace[];
}): DiagnosticOntologyAuditEvent {
  return {
    eventId: `DOA-${String(input.index).padStart(3, "0")}`,
    eventType: input.eventType,
    message: input.message,
    sourceTrace: uniqueSourceTrace(input.sourceTrace ?? []),
  };
}

function result(input: {
  readinessState: DiagnosticOntologyReadinessState;
  sourceTrace: DiagnosticOntologySourceTrace[];
  evidenceRefs: DiagnosticOntologyEvaluationInput["evidence_refs"];
  involvedModels: DiagnosticOntologyModel[];
  conformanceStatus: DiagnosticOntologyEvaluationInput["conformance_status"];
  consistencyStatus: DiagnosticOntologyEvaluationInput["consistency_status"];
  inconsistencyCompartment: string;
  compartment?: CompartmentDefinition;
  candidateId?: string | null;
  allowedActions?: string[];
  blockedActions?: string[];
  requiredInputs?: string[];
  findings: DiagnosticOntologyFinding[];
  auditEvents: DiagnosticOntologyAuditEvent[];
}): DiagnosticOntologyEvaluationResult {
  const compartment = input.compartment;
  return {
    version: "EVE_02_DIAGNOSTIC_ONTOLOGY_SHADOW_V1",
    mode: "diagnostic_ontology_shadow",
    chipId: "EVE-02-DIAGNOSTIC-ONTOLOGY",
    readinessState: input.readinessState,
    candidateId: input.candidateId ?? null,
    compartmentId: compartment?.id ?? null,
    pathologyCandidate: compartment?.pathology ?? null,
    canonicalPathology: compartment?.pathology ?? null,
    aliases: compartment?.aliases ?? [],
    diagnosticQuestion: compartment?.diagnosticQuestion ?? null,
    methodTrace: {
      involved_models: [...input.involvedModels],
      conformance_status: input.conformanceStatus,
      consistency_status: input.consistencyStatus,
      inconsistency_compartment: input.inconsistencyCompartment,
    },
    pathologyTrace: {
      source: compartment ? "D2" : null,
      compartmentId: compartment?.id ?? null,
      pathology: compartment?.pathology ?? null,
      diagnosticQuestion: compartment?.diagnosticQuestion ?? null,
    },
    evidenceRefs: input.evidenceRefs.map((evidence) => ({
      ...evidence,
      sourceTrace: uniqueSourceTrace(evidence.sourceTrace),
    })),
    sourceTrace: uniqueSourceTrace(input.sourceTrace),
    allowedActions: input.allowedActions ?? [],
    blockedActions: input.blockedActions ?? [],
    requiredInputs: input.requiredInputs ?? [],
    findings: input.findings,
    auditEvents: input.auditEvents,
    safetyFlags: SAFETY_FLAGS,
  };
}

function blockedResult(input: {
  state: DiagnosticOntologyReadinessState;
  sourceInput: DiagnosticOntologyEvaluationInput;
  compartment?: CompartmentDefinition;
  ruleId: string;
  severity?: DiagnosticOntologyFinding["severity"];
  message: string;
  eventType: DiagnosticOntologyAuditEvent["eventType"];
  blockedActions?: string[];
  requiredInputs?: string[];
  allowedActions?: string[];
}): DiagnosticOntologyEvaluationResult {
  return result({
    readinessState: input.state,
    sourceTrace: input.sourceInput.source_trace,
    evidenceRefs: input.sourceInput.evidence_refs,
    involvedModels: input.sourceInput.involved_models,
    conformanceStatus: input.sourceInput.conformance_status,
    consistencyStatus: input.sourceInput.consistency_status,
    inconsistencyCompartment: input.sourceInput.inconsistency_compartment,
    compartment: input.compartment,
    allowedActions: input.allowedActions ?? ["write_audit_trace"],
    blockedActions: input.blockedActions ?? ["emit_shadow_candidate", "final_diagnosis", "registry_write"],
    requiredInputs: input.requiredInputs,
    findings: [
      finding({
        index: 1,
        ruleId: input.ruleId,
        severity: input.severity ?? "blocker",
        state: input.state,
        message: input.message,
        sourceTrace: input.sourceInput.source_trace,
      }),
    ],
    auditEvents: [
      auditEvent({
        index: 1,
        eventType: input.eventType,
        message: input.message,
        sourceTrace: input.sourceInput.source_trace,
      }),
    ],
  });
}

export function evaluateDiagnosticOntologyShadow(
  input: DiagnosticOntologyEvaluationInput,
): DiagnosticOntologyEvaluationResult {
  if (input.mode !== "diagnostic_ontology_shadow") {
    return blockedResult({
      state: "manual_review_required",
      sourceInput: input,
      ruleId: "SHADOW-INPUT-MODE",
      message: "Diagnostic Ontology shadow evaluator only accepts diagnostic_ontology_shadow mode.",
      eventType: "diagnostic_ontology_input_rejected",
      blockedActions: ["invalid_mode"],
      requiredInputs: ["mode:diagnostic_ontology_shadow"],
    });
  }

  if (!isCompartmentId(input.inconsistency_compartment)) {
    return blockedResult({
      state: "manual_review_required",
      sourceInput: input,
      ruleId: "EVE02-R001",
      message: "Unknown inconsistency compartment cannot be mapped to D2.",
      eventType: "diagnostic_ontology_input_rejected",
      requiredInputs: ["valid_inconsistency_compartment"],
    });
  }

  const compartment = COMPARTMENTS[input.inconsistency_compartment];
  if (!hasSameModels(input.involved_models, compartment.models)) {
    return blockedResult({
      state: "blocked_by_missing_evidence",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R019",
      message: "Involved models must match the selected diagnostic compartment.",
      eventType: "diagnostic_ontology_missing_evidence",
      requiredInputs: ["involved_models_matching_compartment"],
    });
  }

  if (input.conformance_status !== "validated_by_EVE_00") {
    return blockedResult({
      state: "blocked_by_conformance_unchecked",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R022",
      message: "Conformance must be validated by EVE-00 before diagnostic preclassification.",
      eventType: "diagnostic_ontology_conformance_unchecked",
      requiredInputs: ["conformance_status_validated_by_EVE_00"],
    });
  }

  if (input.consistency_status !== "validated_by_EVE_00") {
    return blockedResult({
      state: "blocked_by_consistency_unchecked",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R023",
      message: "Consistency must be validated by EVE-00 before diagnostic preclassification.",
      eventType: "diagnostic_ontology_consistency_unchecked",
      requiredInputs: ["consistency_status_validated_by_EVE_00"],
    });
  }

  if (input.evidence_refs.length === 0) {
    return blockedResult({
      state: "blocked_by_missing_evidence",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R021",
      message: "Diagnostic ontology shadow mapping requires evidence_refs.",
      eventType: "diagnostic_ontology_missing_evidence",
      requiredInputs: ["evidence_refs"],
    });
  }

  if (input.source_trace.length === 0 || !hasSourceTrace(input, "D2")) {
    return blockedResult({
      state: "blocked_by_missing_evidence",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R033",
      message: "Diagnostic ontology shadow mapping requires source_trace with D2.",
      eventType: "diagnostic_ontology_missing_evidence",
      requiredInputs: ["source_trace_with_D2"],
    });
  }

  if (input.semanticGateStatus === "open") {
    return blockedResult({
      state: "blocked_by_semantic_ambiguity",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R037",
      message: "Semantic gate must close before pathology mapping.",
      eventType: "diagnostic_ontology_semantic_ambiguity",
      blockedActions: ["pathology_mapping_until_sem_gate_closed", "final_diagnosis", "registry_write"],
      requiredInputs: ["semanticGateStatus:closed"],
    });
  }

  if (
    TIMER_DEPENDENT_COMPARTMENTS.has(compartment.id) &&
    input.processStateTimerGateStatus === "open"
  ) {
    return blockedResult({
      state: "reentry_required",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R038",
      message: "Process state/timer gate must close before PF/OLC pathology mapping.",
      eventType: "diagnostic_ontology_semantic_ambiguity",
      blockedActions: ["pathology_mapping_until_pst_gate_closed", "final_diagnosis", "registry_write"],
      requiredInputs: ["processStateTimerGateStatus:closed"],
    });
  }

  const prohibitedOutput = isProhibitedOutput(input.requestedOutputType);
  if (prohibitedOutput) {
    return blockedResult({
      state: "manual_review_required",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R003",
      message: "Requested output violates diagnostic ontology shadow safety boundary.",
      eventType: "diagnostic_ontology_final_diagnosis_blocked",
      blockedActions: [prohibitedOutput, "final_diagnosis", "IR", "registry_write", "export_payload", "production_real"],
      requiredInputs: ["allowed_requestedOutputType"],
    });
  }

  if (
    input.confidenceContext?.multipleCompartments === true &&
    input.confidenceContext.confidence === "low"
  ) {
    return blockedResult({
      state: "manual_review_required",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R025",
      severity: "warning",
      message: "Multiple low-confidence compartments require manual review before choosing a primary candidate.",
      eventType: "diagnostic_ontology_manual_review_required",
      blockedActions: ["force_primary_candidate", "final_diagnosis", "registry_write"],
      requiredInputs: ["manual_review_for_primary_candidate"],
    });
  }

  if (compartment.id === "EVE02-CMP-013" && !hasFourViewEvidence(input)) {
    return blockedResult({
      state: "blocked_by_missing_evidence",
      sourceInput: input,
      compartment,
      ruleId: "EVE02-R026",
      message: "Incoherencia Sistémica Total requires evidence across PM, MoC, PF and OLC.",
      eventType: "diagnostic_ontology_missing_evidence",
      requiredInputs: ["PM_evidence", "MoC_evidence", "PF_evidence", "OLC_evidence"],
    });
  }

  const candidateId = `DOC-${compartment.id}`;
  return result({
    readinessState: "diagnostic_preclassification_candidate",
    candidateId,
    sourceTrace: input.source_trace,
    evidenceRefs: input.evidence_refs,
    involvedModels: input.involved_models,
    conformanceStatus: input.conformance_status,
    consistencyStatus: input.consistency_status,
    inconsistencyCompartment: input.inconsistency_compartment,
    compartment,
    allowedActions: ["diagnostic_preclassification_candidate", "write_audit_trace"],
    blockedActions: ["final_diagnosis", "IR", "registry_write", "export_payload", "production_real"],
    findings: [
      finding({
        index: 1,
        ruleId: compartment.ruleId,
        severity: "info",
        state: "diagnostic_preclassification_candidate",
        message: `Validated compartment maps to ${compartment.pathology} as a shadow preclassification candidate.`,
        sourceTrace: input.source_trace,
      }),
    ],
    auditEvents: [
      auditEvent({
        index: 1,
        eventType: "diagnostic_ontology_compartment_mapped",
        message: "Diagnostic ontology shadow mapped validated MMABP inconsistency to D2 pathology candidate.",
        sourceTrace: input.source_trace,
      }),
      auditEvent({
        index: 2,
        eventType: "diagnostic_ontology_shadow_evaluated",
        message: "Shadow evaluation completed without side effects.",
        sourceTrace: input.source_trace,
      }),
    ],
  });
}
