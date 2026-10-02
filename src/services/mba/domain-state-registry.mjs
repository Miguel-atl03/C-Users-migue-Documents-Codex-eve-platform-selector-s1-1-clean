export const MBA_OBJECT_TYPES = Object.freeze([
  "ClientEngagement",
  "CasoDiagnosticoEVE",
  "SceneCanonicalRecord",
  "EvidenceBundle",
  "EscenaEvidencial",
  "PeliculaCausalAgregada",
  "DiagnosticoExpertoFinal",
  "PaqueteProduccionParalelaMMABP",
  "ArchitectureConsistencyAssessment",
  "ExportCodePackage",
]);

export const MBA_CANONICAL_EVENTS = Object.freeze([
  "SolicitudDiagnosticaAceptada",
  "SolicitudConsolidacionEscena",
  "SceneCanonicalRecordConsolidatedReceived",
  "SolicitudBundleTransduccion",
  "EvidenceBundleReadyReceived",
  "SolicitudTransduccionCausal",
  "EscenaEvidencialValidatedReceived",
  "SolicitudAgregacionEmpresarial",
  "PeliculaCausalAggregatedReceived",
  "SolicitudSintesisExperta",
  "DiagnosticoFinalDeliveredReceived",
  "ConfirmacionCierreCaso",
  "GapInconsistenciaDetectada",
  "SolicitudCorreccionInventario",
  "AssessmentConsistencySatisfied",
  "SyntaxValidationFailed",
  "NecesidadRegistrada",
  "AlcanceDefinido",
  "DiagnosticoAceptado",
  "EntregaConfirmada",
  "EvidenciaInicialSuficiente",
  "AclaracionRecibida",
  "GapBloqueanteDetectado",
  "ConformanceAprobada",
  "ClienteCancelaCaptura",
  "SCRDisponible",
  "TrazabilidadVerificada",
  "ReadinessSatisfied",
  "ReadinessRejected",
  "GapNoRecuperable",
  "BundleConsumido",
  "InconsistenciaValidada",
  "ActorFuncionalSituado",
  "AHEMaterialSituado",
  "EscenaCausalValidada",
  "EscenasAgregablesDisponibles",
  "PatronMultirolIdentificado",
  "PerdidaEstimable",
  "TrazabilidadAgregadaValidada",
  "PeliculaRecibida",
  "TrazabilidadExpertaValidada",
  "RevisionExpertaAprobada",
  "RevisionExpertaRechazada",
  "SourceBundleDisponible",
  "CandidatosExtraidos",
  "SemanticaResuelta",
  "FindingQARecibido",
  "InventarioIRRecibido",
  "ConformanceCompletada",
  "ConsistencyCompletada",
  "FindingsClasificados",
  "BPMNGenerated",
  "PlantUMLGenerated",
  "ExportCodePackageGenerated",
]);

export const EVENT_ALIASES = Object.freeze({
  session_ready_for_transduction: "EvidenceBundleReadyReceived",
  ready_for_transduction: "EvidenceBundleReadyReceived",
  scene_canonical_record_consolidated: "SceneCanonicalRecordConsolidatedReceived",
  mmabp_design_source_bundle_ready: "SourceBundleDisponible",
  consistency_satisfied: "AssessmentConsistencySatisfied",
  syntax_validation_failed: "SyntaxValidationFailed",
});

export const STATE_ALIASES = Object.freeze({
  SceneCanonicalRecord: {
    scene_canonical_consolidation: "UnderConsolidation",
    scene_ready_for_transduction: "Consolidated",
    consolidated: "Consolidated",
  },
  EvidenceBundle: {
    ready: "ReadyForTransduction",
    ready_with_flags: "ReadyForTransduction",
    ready_for_transduction: "ReadyForTransduction",
    session_ready_for_transduction: "ReadyForTransduction",
  },
  ArchitectureConsistencyAssessment: {
    passed: "Satisfied",
    passed_with_warnings: "WithFindings",
    partial: "WithFindings",
    blocked: "Blocked",
  },
  ExportCodePackage: {
    ready_for_review: "Generated",
    ready_with_warnings: "Generated",
    blocked: "Blocked",
  },
});

export const MBA_STATE_REGISTRY = Object.freeze({
  ClientEngagement: {
    states: [
      "NeedRegistered",
      "ScopeDefined",
      "DiagnosticAccepted",
      "SessionsEnabled",
      "DeliveryPending",
      "ClosedWithDeliveredCase",
      "Cancelled",
      "NoDecision",
    ],
    finalStates: ["ClosedWithDeliveredCase", "Cancelled", "NoDecision"],
  },
  CasoDiagnosticoEVE: {
    states: [
      "Requested",
      "InDiagnosticProduction",
      "WithSceneCanonicalRecord",
      "ReadyForTransduction",
      "WithValidatedEvidentialScenes",
      "WithAggregatedCausalMovie",
      "WithDeliveredExpertDiagnosis",
      "Delivered",
      "ClosedWithoutSufficiency",
      "Cancelled",
    ],
    finalStates: ["Delivered", "ClosedWithoutSufficiency", "Cancelled"],
  },
  SceneCanonicalRecord: {
    states: [
      "UnderConsolidation",
      "WithOriginalEvidence",
      "WithCanonicalDerivations",
      "WithVisibleGapsAndFlags",
      "ConformanceChecked",
      "Consolidated",
      "BlockedByInsufficientEvidence",
      "Cancelled",
    ],
    finalStates: ["Consolidated", "BlockedByInsufficientEvidence", "Cancelled"],
  },
  EvidenceBundle: {
    states: [
      "Assembling",
      "WithSceneCanonicalRecord",
      "TraceabilityChecked",
      "ReadinessAssessmentPending",
      "ReadyForTransduction",
      "Blocked",
      "Cancelled",
    ],
    finalStates: ["ReadyForTransduction", "Blocked", "Cancelled"],
  },
  EscenaEvidencial: {
    states: [
      "Constructing",
      "WithMMABPElements",
      "WithVSMHypothesis",
      "WithMMABPInconsistency",
      "WithEVEManifestation",
      "AHESituated",
      "Validated",
      "BlockedByInsufficientCausality",
    ],
    finalStates: ["Validated", "BlockedByInsufficientCausality"],
  },
  PeliculaCausalAgregada: {
    states: [
      "ScenesReceived",
      "AggregationEligible",
      "IndexBuilt",
      "PatternIdentified",
      "LossEstimated",
      "Composed",
      "Aggregated",
      "BlockedByInsufficientScenes",
    ],
    finalStates: ["Aggregated", "BlockedByInsufficientScenes"],
  },
  DiagnosticoExpertoFinal: {
    states: [
      "MovieReceived",
      "TraceabilityChecked",
      "NarrativeDrafted",
      "TheoremFormulated",
      "RecommendationDrafted",
      "ExpertReviewed",
      "Delivered",
      "BlockedByWeakTraceability",
    ],
    finalStates: ["Delivered", "BlockedByWeakTraceability"],
  },
  PaqueteProduccionParalelaMMABP: {
    states: [
      "SourceReceived",
      "SourceValidated",
      "CandidatesExtracted",
      "FactsConsolidated",
      "SemanticResolved",
      "RegistriesBuilt",
      "IRProjected",
      "InventoryResolved",
      "ReworkInProgress",
      "ExportBlocked",
    ],
    finalStates: ["InventoryResolved", "ExportBlocked"],
  },
  ArchitectureConsistencyAssessment: {
    states: [
      "ConformanceEvaluating",
      "ConsistencyEvaluating",
      "CompositeEvaluating",
      "WithFindings",
      "Satisfied",
      "Blocked",
    ],
    finalStates: ["Satisfied", "Blocked"],
  },
  ExportCodePackage: {
    states: [
      "Requested",
      "GeneratingBPMN",
      "GeneratingPlantUML",
      "SyntaxValidating",
      "Generated",
      "BPMNReadyForCamunda",
      "PlantUMLReadyForEA",
      "Blocked",
    ],
    finalStates: ["Generated", "BPMNReadyForCamunda", "PlantUMLReadyForEA", "Blocked"],
  },
});

export const MBA_TRANSITIONS = Object.freeze([
  ["ClientEngagement", "NeedRegistered", "AlcanceDefinido", "definirAlcance", "ScopeDefined", "PF-CLIENT-01"],
  ["ClientEngagement", "ScopeDefined", "DiagnosticoAceptado", "aceptarDiagnostico", "DiagnosticAccepted", "PF-CLIENT-01"],
  ["ClientEngagement", "DiagnosticAccepted", "DiagnosticoAceptado", "habilitarSesion", "SessionsEnabled", "PF-CLIENT-01"],
  ["ClientEngagement", "SessionsEnabled", "DiagnosticoFinalDeliveredReceived", "recibirDiagnostico", "DeliveryPending", "PF-CLIENT-01"],
  ["ClientEngagement", "DeliveryPending", "EntregaConfirmada", "cerrar", "ClosedWithDeliveredCase", "PF-CLIENT-01"],
  ["ClientEngagement", "ScopeDefined", "EntregaConfirmada", "cerrarSinDecision", "NoDecision", "PF-CLIENT-01"],

  ["CasoDiagnosticoEVE", "Requested", "SolicitudDiagnosticaAceptada", "abrirCaso", "InDiagnosticProduction", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "InDiagnosticProduction", "SceneCanonicalRecordConsolidatedReceived", "registrarMilestone", "WithSceneCanonicalRecord", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "WithSceneCanonicalRecord", "EvidenceBundleReadyReceived", "registrarBundle", "ReadyForTransduction", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "ReadyForTransduction", "EscenaEvidencialValidatedReceived", "registrarEscenas", "WithValidatedEvidentialScenes", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "WithValidatedEvidentialScenes", "PeliculaCausalAggregatedReceived", "registrarPelicula", "WithAggregatedCausalMovie", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "WithAggregatedCausalMovie", "DiagnosticoFinalDeliveredReceived", "registrarDiagnosticoFinal", "WithDeliveredExpertDiagnosis", "P-CORE-01"],
  ["CasoDiagnosticoEVE", "WithDeliveredExpertDiagnosis", "ConfirmacionCierreCaso", "cerrarCasoEntregado", "Delivered", "P-CORE-01"],

  ["SceneCanonicalRecord", "UnderConsolidation", "EvidenciaInicialSuficiente", "agregarEvidencia", "WithOriginalEvidence", "P-SUP-01"],
  ["SceneCanonicalRecord", "WithOriginalEvidence", "EvidenciaInicialSuficiente", "derivarCanonico", "WithCanonicalDerivations", "P-SUP-01"],
  ["SceneCanonicalRecord", "WithCanonicalDerivations", "AclaracionRecibida", "registrarGapFlag", "WithVisibleGapsAndFlags", "P-SUP-01"],
  ["SceneCanonicalRecord", "WithVisibleGapsAndFlags", "ConformanceAprobada", "evaluarConformance", "ConformanceChecked", "P-SUP-01"],
  ["SceneCanonicalRecord", "ConformanceChecked", "SceneCanonicalRecordConsolidatedReceived", "consolidar", "Consolidated", "P-SUP-01"],
  ["SceneCanonicalRecord", "WithVisibleGapsAndFlags", "AclaracionRecibida", "reabrirPorAclaracion", "UnderConsolidation", "P-SUP-01"],

  ["EvidenceBundle", "Assembling", "SCRDisponible", "agregarSCR", "WithSceneCanonicalRecord", "P-SUP-02"],
  ["EvidenceBundle", "WithSceneCanonicalRecord", "TrazabilidadVerificada", "verificarTrazabilidad", "TraceabilityChecked", "P-SUP-02"],
  ["EvidenceBundle", "TraceabilityChecked", "TrazabilidadVerificada", "evaluarReadiness", "ReadinessAssessmentPending", "P-SUP-02"],
  ["EvidenceBundle", "ReadinessAssessmentPending", "ReadinessSatisfied", "marcarReady", "ReadyForTransduction", "P-SUP-02"],
  ["EvidenceBundle", "ReadinessAssessmentPending", "EvidenceBundleReadyReceived", "marcarReady", "ReadyForTransduction", "P-SUP-02"],
  ["EvidenceBundle", "TraceabilityChecked", "ReadinessRejected", "solicitarRework", "Assembling", "P-SUP-02"],

  ["EscenaEvidencial", "Constructing", "BundleConsumido", "extraerElementos", "WithMMABPElements", "P-SUP-03"],
  ["EscenaEvidencial", "WithMMABPElements", "InconsistenciaValidada", "formularHipotesisVSM", "WithVSMHypothesis", "P-SUP-03"],
  ["EscenaEvidencial", "WithVSMHypothesis", "InconsistenciaValidada", "detectarInconsistencia", "WithMMABPInconsistency", "P-SUP-03"],
  ["EscenaEvidencial", "WithMMABPInconsistency", "ActorFuncionalSituado", "manifestarNodo", "WithEVEManifestation", "P-SUP-03"],
  ["EscenaEvidencial", "WithEVEManifestation", "AHEMaterialSituado", "situarAHE", "AHESituated", "P-SUP-03"],
  ["EscenaEvidencial", "AHESituated", "EscenaCausalValidada", "validar", "Validated", "P-SUP-03"],

  ["PeliculaCausalAgregada", "ScenesReceived", "EscenasAgregablesDisponibles", "construirSceneSet", "AggregationEligible", "P-SUP-04"],
  ["PeliculaCausalAgregada", "AggregationEligible", "EscenasAgregablesDisponibles", "construirIndice", "IndexBuilt", "P-SUP-04"],
  ["PeliculaCausalAgregada", "IndexBuilt", "PatronMultirolIdentificado", "detectarPatron", "PatternIdentified", "P-SUP-04"],
  ["PeliculaCausalAgregada", "PatternIdentified", "PerdidaEstimable", "estimarPerdida", "LossEstimated", "P-SUP-04"],
  ["PeliculaCausalAgregada", "LossEstimated", "PeliculaCausalAggregatedReceived", "componer", "Composed", "P-SUP-04"],
  ["PeliculaCausalAgregada", "Composed", "TrazabilidadAgregadaValidada", "validarTrazabilidad", "Aggregated", "P-SUP-04"],

  ["DiagnosticoExpertoFinal", "MovieReceived", "PeliculaRecibida", "verificarTrazabilidad", "TraceabilityChecked", "P-SUP-05"],
  ["DiagnosticoExpertoFinal", "TraceabilityChecked", "TrazabilidadExpertaValidada", "redactarNarrativa", "NarrativeDrafted", "P-SUP-05"],
  ["DiagnosticoExpertoFinal", "NarrativeDrafted", "TrazabilidadExpertaValidada", "formularTeorema", "TheoremFormulated", "P-SUP-05"],
  ["DiagnosticoExpertoFinal", "TheoremFormulated", "TrazabilidadExpertaValidada", "redactarRecomendacion", "RecommendationDrafted", "P-SUP-05"],
  ["DiagnosticoExpertoFinal", "RecommendationDrafted", "RevisionExpertaAprobada", "revisar", "ExpertReviewed", "P-SUP-05"],
  ["DiagnosticoExpertoFinal", "ExpertReviewed", "DiagnosticoFinalDeliveredReceived", "entregar", "Delivered", "P-SUP-05"],

  ["PaqueteProduccionParalelaMMABP", "SourceReceived", "SourceBundleDisponible", "validarFuente", "SourceValidated", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "SourceValidated", "CandidatosExtraidos", "extraerCandidatos", "CandidatesExtracted", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "CandidatesExtracted", "CandidatosExtraidos", "consolidarHechos", "FactsConsolidated", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "FactsConsolidated", "SemanticaResuelta", "resolverSemantica", "SemanticResolved", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "SemanticResolved", "SemanticaResuelta", "construirRegistros", "RegistriesBuilt", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "RegistriesBuilt", "SemanticaResuelta", "proyectarIR", "IRProjected", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "IRProjected", "SemanticaResuelta", "resolverInventario", "InventoryResolved", "P-SUP-06"],
  ["PaqueteProduccionParalelaMMABP", "ReworkInProgress", "SolicitudCorreccionInventario", "actualizarRegistros", "RegistriesBuilt", "P-SUP-06"],

  ["ArchitectureConsistencyAssessment", "ConformanceEvaluating", "ConformanceCompletada", "evaluarConformance", "ConsistencyEvaluating", "P-SUP-07/08"],
  ["ArchitectureConsistencyAssessment", "ConsistencyEvaluating", "ConsistencyCompletada", "evaluarConsistency", "CompositeEvaluating", "P-SUP-07/08"],
  ["ArchitectureConsistencyAssessment", "CompositeEvaluating", "AssessmentConsistencySatisfied", "satisfacer", "Satisfied", "P-SUP-07/08"],
  ["ArchitectureConsistencyAssessment", "CompositeEvaluating", "FindingsClasificados", "clasificarFindings", "WithFindings", "P-SUP-07/08"],
  ["ArchitectureConsistencyAssessment", "WithFindings", "SolicitudCorreccionInventario", "reenviarAProduccionParalela", "ConformanceEvaluating", "P-SUP-07/08"],

  ["ExportCodePackage", "Requested", "BPMNGenerated", "generarBPMN", "GeneratingBPMN", "P-SUP-09"],
  ["ExportCodePackage", "GeneratingBPMN", "PlantUMLGenerated", "generarPlantUML", "GeneratingPlantUML", "P-SUP-09"],
  ["ExportCodePackage", "GeneratingPlantUML", "BPMNGenerated", "validarSintaxis", "SyntaxValidating", "P-SUP-09"],
  ["ExportCodePackage", "SyntaxValidating", "ExportCodePackageGenerated", "empaquetar", "Generated", "P-SUP-09"],
  ["ExportCodePackage", "SyntaxValidating", "SyntaxValidationFailed", "bloquear", "Blocked", "P-SUP-09"],
]);

export const TIMER_POLICIES = Object.freeze({
  "P-SUP-01:UnderConsolidation": {
    timer_name: "max_tiempo_evidencia_inicial",
    exit_applied: "SceneCanonicalRecord [BlockedByInsufficientEvidence]",
  },
  "P-SUP-01:WithVisibleGapsAndFlags": {
    timer_name: "max_tiempo_aclaracion_evidencial",
    exit_applied: "SceneCanonicalRecord [BlockedByInsufficientEvidence]",
  },
  "P-SUP-02:Assembling": {
    timer_name: "max_tiempo_bundle_transduccion",
    exit_applied: "EvidenceBundle [Blocked]",
  },
  "P-SUP-02:ReadinessAssessmentPending": {
    timer_name: "max_tiempo_readiness_transduccion",
    exit_applied: "EvidenceBundle [Blocked]",
  },
  "P-SUP-03:Constructing": {
    timer_name: "max_tiempo_escena_evidencial_validated",
    exit_applied: "EscenaEvidencial [BlockedByInsufficientCausality]",
  },
  "P-SUP-04:ScenesReceived": {
    timer_name: "max_tiempo_pelicula_causal_aggregated",
    exit_applied: "PeliculaCausalAgregada [BlockedByInsufficientScenes]",
  },
  "P-SUP-05:MovieReceived": {
    timer_name: "max_tiempo_diagnostico_final_delivered",
    exit_applied: "DiagnosticoExpertoFinal [BlockedByWeakTraceability]",
  },
  "P-SUP-06:SourceReceived": {
    timer_name: "max_tiempo_inventario_mmabp_resolved",
    exit_applied: "PaqueteProduccionParalelaMMABP [ExportBlocked]",
  },
  "P-SUP-07/08:ConformanceEvaluating": {
    timer_name: "max_tiempo_architecture_consistency_assessment",
    exit_applied: "ArchitectureConsistencyAssessment [Blocked]",
  },
  "P-SUP-09:SyntaxValidating": {
    timer_name: "max_tiempo_export_code_package_generated",
    exit_applied: "ExportCodePackage [Blocked]",
  },
  "P-CORE-01:InDiagnosticProduction": {
    timer_name: "max_tiempo_scene_canonical_record",
    exit_applied: "CasoDiagnosticoEVE [ClosedWithoutSufficiency]",
  },
});

export function canonicalizeEventType(eventType) {
  return EVENT_ALIASES[eventType] ?? eventType;
}

export function canonicalizeState(objectType, state) {
  if (!state) return state;
  return STATE_ALIASES[objectType]?.[state] ?? state;
}

export function isCanonicalEvent(eventType) {
  return MBA_CANONICAL_EVENTS.includes(eventType);
}

export function getObjectRegistry(objectType) {
  return MBA_STATE_REGISTRY[objectType] ?? null;
}

export function isAllowedObjectState(objectType, state) {
  const registry = getObjectRegistry(objectType);
  return Boolean(registry?.states.includes(state));
}

export function getTimerPolicy(processId, processState) {
  return TIMER_POLICIES[`${processId}:${processState}`] ?? null;
}

export function transitionObjects() {
  return MBA_TRANSITIONS.map(
    ([object_type, previous_state, event_type, operation, target_state, responsible_process]) => ({
      object_type,
      previous_state,
      event_type,
      operation,
      target_state,
      responsible_process,
    }),
  );
}
