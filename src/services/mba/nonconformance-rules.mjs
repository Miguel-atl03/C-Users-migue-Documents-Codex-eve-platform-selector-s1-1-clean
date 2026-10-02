import {
  canonicalizeState,
  getTimerPolicy,
  isAllowedObjectState,
} from "./domain-state-registry.mjs";

export const MBA_NONCONFORMANCE_RULES = Object.freeze({
  "NC-01": {
    id: "NC-01",
    description: "El sistema permite generar diagnostico final sin PeliculaCausalAgregada [Aggregated].",
    action: "Bloquear entrega y devolver a Capa 2.5.",
  },
  "NC-02": {
    id: "NC-02",
    description: "El sistema permite generar ExportCodePackage sin ArchitectureConsistencyAssessment [Satisfied].",
    action: "Bloquear exportacion.",
  },
  "NC-03": {
    id: "NC-03",
    description: "El sistema envia findings de QA al P-CORE-01 en vez de P-SUP-06.",
    action: "Corregir orquestacion de rework.",
  },
  "NC-04": {
    id: "NC-04",
    description: "El sistema usa session_ready_for_transduction como target state principal.",
    action: "Reemplazar por EvidenceBundle [ReadyForTransduction].",
  },
  "NC-05": {
    id: "NC-05",
    description: "Un process state no tiene timer ni salida por tiempo.",
    action: "Agregar timer provisional y salida causal.",
  },
  "NC-06": {
    id: "NC-06",
    description: "Un PF produce un Object[State] no incluido en OLC.",
    action: "Actualizar OLC o corregir PF.",
  },
  "NC-07": {
    id: "NC-07",
    description: "El MoC contiene clases tecnicas sin funcion conceptual.",
    action: "Moverlas a contrato de implementacion.",
  },
  "NC-08": {
    id: "NC-08",
    description: "Se fusiona EscenaOperativaRegulada con EscenaEvidencial.",
    action: "Separar objeto fuente y escena causal.",
  },
  "NC-09": {
    id: "NC-09",
    description: "Se fusiona EvidenceBundle con mmabp_design_source_bundle.",
    action: "Separar traspaso causal y diseno paralelo.",
  },
  "NC-10": {
    id: "NC-10",
    description: "Capa 1.0 produce nodos EVE, root cause o monetizacion.",
    action: "Bloquear: violacion de frontera funcional.",
  },
});

const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const hasKeyDeep = (value, keys) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasKeyDeep(item, keys));
  return Object.entries(value).some(([key, nested]) => keys.includes(key) || hasKeyDeep(nested, keys));
};

const hasObjectState = (context, objectType, state) => {
  const stateMap = context?.objectStates ?? {};
  const values = asArray(stateMap[objectType]).map((item) => {
    if (typeof item === "string") return item;
    return item?.state;
  });
  return values.includes(state);
};

const makeFinding = (ruleId, detail, severity = "critical") => ({
  rule_id: ruleId,
  severity,
  description: MBA_NONCONFORMANCE_RULES[ruleId].description,
  action: MBA_NONCONFORMANCE_RULES[ruleId].action,
  detail,
});

export function evaluateTransitionNonconformance(input, context = {}) {
  const findings = [];
  const payload = input.payload ?? {};
  const objectType = input.object_type ?? input.objectType;
  const targetState = input.target_state ?? input.targetState;
  const rawTargetState = input.raw_target_state ?? input.rawTargetState ?? targetState;
  const canonicalTargetState = canonicalizeState(objectType, targetState);

  if (objectType && canonicalTargetState && !isAllowedObjectState(objectType, canonicalTargetState)) {
    findings.push(makeFinding("NC-06", `${objectType} [${canonicalTargetState}] is not declared in MBA OLC.`));
  }

  if (String(rawTargetState) === "session_ready_for_transduction") {
    findings.push(makeFinding("NC-04", "session_ready_for_transduction was used as target state."));
  }

  if (objectType === "DiagnosticoExpertoFinal" && canonicalTargetState === "Delivered") {
    if (!hasObjectState(context, "PeliculaCausalAgregada", "Aggregated")) {
      findings.push(makeFinding("NC-01", "DiagnosticoExpertoFinal [Delivered] lacks PeliculaCausalAgregada [Aggregated]."));
    }
  }

  if (objectType === "ExportCodePackage" && canonicalTargetState === "Generated") {
    if (!hasObjectState(context, "ArchitectureConsistencyAssessment", "Satisfied")) {
      findings.push(makeFinding("NC-02", "ExportCodePackage [Generated] lacks ArchitectureConsistencyAssessment [Satisfied]."));
    }
    if (payload.syntax_validation_status && payload.syntax_validation_status !== "passed") {
      findings.push(makeFinding("NC-02", "ExportCodePackage [Generated] lacks passed syntax validation."));
    }
  }

  const isQaFinding =
    input.event_type === "GapInconsistenciaDetectada" ||
    input.eventType === "GapInconsistenciaDetectada" ||
    payload.finding_scope === "parallel_production_design" ||
    payload.finding_kind === "qa_design_finding";
  if (isQaFinding && (input.received_by === "P-CORE-01" || input.responsible_process === "P-CORE-01")) {
    findings.push(makeFinding("NC-03", "QA design finding was routed to P-CORE-01 instead of P-SUP-06."));
  }

  const processState = payload.process_state ?? payload.processState;
  const processId = input.responsible_process ?? input.responsibleProcess ?? input.received_by;
  if (processState) {
    const hasDeclaredTimer = Boolean(payload.timer_name || payload.timerName || getTimerPolicy(processId, processState));
    if (!hasDeclaredTimer) {
      findings.push(makeFinding("NC-05", `${processId}:${processState} has no timer policy or temporal exit.`));
    }
  }

  const technicalMocClasses = asArray(payload.technical_moc_classes ?? payload.technicalMocClasses);
  if (technicalMocClasses.some((item) => item?.conceptual_function === false || item?.conceptualFunction === false)) {
    findings.push(makeFinding("NC-07", "Technical MoC classes without conceptual function were detected."));
  }

  const fusedObjects = asArray(payload.fused_objects ?? payload.fusedObjects);
  if (
    fusedObjects.includes("EscenaOperativaRegulada") &&
    fusedObjects.includes("EscenaEvidencial")
  ) {
    findings.push(makeFinding("NC-08", "EscenaOperativaRegulada and EscenaEvidencial were fused."));
  }

  if (
    fusedObjects.includes("EvidenceBundle") &&
    fusedObjects.includes("mmabp_design_source_bundle")
  ) {
    findings.push(makeFinding("NC-09", "EvidenceBundle and mmabp_design_source_bundle were fused."));
  }

  const capa1Actors = ["Capa 1.0", "Capa1", "capa1", "P-SUP-01", "P-SUP-02"];
  const forbiddenCapa1Keys = [
    "diagnostic_finding",
    "root_cause",
    "monetization",
    "monetization_input",
    "pelicula_causal",
    "causal_movie",
    "final_diagnostic",
    "diagnostico_final",
    "DiagnosticoExpertoFinal",
    "node_eve",
    "eve_node",
    "closed_ahe_reading",
    "closed_vsm_classification",
    "capa_2_node_assignment",
  ];
  if (capa1Actors.includes(input.emitted_by) && hasKeyDeep(payload, forbiddenCapa1Keys)) {
    findings.push(makeFinding("NC-10", "Capa 1.0 payload contains diagnostic, root cause, EVE node or monetization output."));
  }

  return findings;
}

export function evaluateInitialGateNonconformance({ objectStates = {}, relationships = {} } = {}) {
  const findings = [];

  if (
    asArray(objectStates.ExportCodePackage).some((item) => (typeof item === "string" ? item : item?.state) === "Generated") &&
    !hasObjectState({ objectStates }, "ArchitectureConsistencyAssessment", "Satisfied")
  ) {
    findings.push(makeFinding("NC-02", "Generated export observed without satisfied architecture assessment."));
  }

  const validatedScenes = asArray(objectStates.EscenaEvidencial).filter((item) =>
    (typeof item === "string" ? item : item?.state) === "Validated",
  );
  if (
    asArray(objectStates.PeliculaCausalAgregada).some((item) => (typeof item === "string" ? item : item?.state) === "Aggregated") &&
    validatedScenes.length < 2
  ) {
    findings.push({
      rule_id: "MBA-GATE-PEL-2-SCENES",
      severity: "critical",
      description: "PeliculaCausalAgregada [Aggregated] requires 2..* EscenaEvidencial [Validated].",
      action: "Block aggregation or request more validated scenes.",
      detail: `validated_scene_count=${validatedScenes.length}`,
    });
  }

  if (
    asArray(objectStates.EvidenceBundle).some((item) => (typeof item === "string" ? item : item?.state) === "ReadyForTransduction") &&
    (!hasObjectState({ objectStates }, "SceneCanonicalRecord", "Consolidated") || relationships.traceability_complete === false)
  ) {
    findings.push({
      rule_id: "MBA-GATE-EB-SCR-TRACEABILITY",
      severity: "critical",
      description: "EvidenceBundle [ReadyForTransduction] requires SceneCanonicalRecord [Consolidated] and complete traceability.",
      action: "Keep EvidenceBundle blocked until traceability is complete.",
      detail: "Missing consolidated SCR or complete traceability.",
    });
  }

  if (
    asArray(objectStates.EscenaEvidencial).some((item) => (typeof item === "string" ? item : item?.state) === "Validated") &&
    !hasObjectState({ objectStates }, "EvidenceBundle", "ReadyForTransduction")
  ) {
    findings.push({
      rule_id: "MBA-GATE-EE-EB",
      severity: "critical",
      description: "EscenaEvidencial [Validated] requires EvidenceBundle [ReadyForTransduction].",
      action: "Block causal scene validation until bundle readiness is canonical.",
      detail: "Missing EvidenceBundle [ReadyForTransduction].",
    });
  }

  return findings;
}
