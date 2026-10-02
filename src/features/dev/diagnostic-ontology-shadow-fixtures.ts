import type {
  DiagnosticOntologyCompartmentId,
  DiagnosticOntologyEvaluationInput,
  DiagnosticOntologyModel,
  DiagnosticOntologyReadinessState,
  DiagnosticOntologySourceTrace,
} from "@/domain/diagnostic-ontology-evaluation";

const d1Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D1",
  ruleId: "SRC-D1",
  locator: "fixture:diagnostic-ontology-shadow:D1",
  authorityDomain: "MMABP methodological guard",
};

const d2Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D2",
  ruleId: "SRC-D2",
  locator: "fixture:diagnostic-ontology-shadow:D2",
  authorityDomain: "Diagnostic ontology canonical pathology table",
};

const d4Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D4",
  ruleId: "SRC-D4",
  locator: "fixture:diagnostic-ontology-shadow:D4",
  authorityDomain: "Runtime technical boundary",
};

const d5Trace: DiagnosticOntologySourceTrace = {
  sourceId: "D5",
  ruleId: "SRC-D5",
  locator: "fixture:diagnostic-ontology-shadow:D5",
  authorityDomain: "Runtime catalog boundary",
};

const eve00Trace: DiagnosticOntologySourceTrace = {
  sourceId: "EVE-00",
  ruleId: "SRC-EVE-00",
  locator: "fixture:diagnostic-ontology-shadow:EVE-00",
  authorityDomain: "Method Kernel conformance and consistency guard",
};

const eve01Trace: DiagnosticOntologySourceTrace = {
  sourceId: "EVE-01",
  ruleId: "SRC-EVE-01",
  locator: "fixture:diagnostic-ontology-shadow:EVE-01",
  authorityDomain: "Agent Constitution safety guard",
};

function evidenceRef(
  evidenceRefId: string,
  sourceTrace: DiagnosticOntologySourceTrace[] = [d2Trace, eve00Trace],
) {
  return {
    evidenceRefId,
    kind: "structural_candidate" as const,
    sourceTrace,
  };
}

function baseInput(input: {
  compartment: DiagnosticOntologyCompartmentId;
  models: DiagnosticOntologyModel[];
  evidenceRefs?: ReturnType<typeof evidenceRef>[];
  sourceTrace?: DiagnosticOntologySourceTrace[];
}): DiagnosticOntologyEvaluationInput {
  return {
    mode: "diagnostic_ontology_shadow",
    inconsistency_compartment: input.compartment,
    involved_models: input.models,
    conformance_status: "validated_by_EVE_00",
    consistency_status: "validated_by_EVE_00",
    evidence_refs: input.evidenceRefs ?? [evidenceRef(`ev-${input.compartment}`)],
    source_trace: input.sourceTrace ?? [d1Trace, d2Trace, d4Trace, d5Trace, eve00Trace, eve01Trace],
    methodKernelResult: {
      readinessState: "ready",
      ruleIds: ["FND-001", "FND-002"],
    },
    agentConstitutionDecision: {
      readinessState: "capture_allowed",
      safetyBoundary: "no_final_diagnosis",
    },
    semanticGateStatus: "closed",
    processStateTimerGateStatus: "closed",
    requestedOutputType: "diagnostic_preclassification_candidate",
    confidenceContext: {
      confidence: "high",
      evidenceStrength: "strong",
    },
  };
}

export type DiagnosticOntologyShadowFixture = {
  fixtureId: string;
  label: string;
  description: string;
  expectedReadinessState: DiagnosticOntologyReadinessState;
  expectedPathologyCandidate?: string;
  expectedCompartmentId?: DiagnosticOntologyCompartmentId;
  expectedBlockedActions?: string[];
  input: DiagnosticOntologyEvaluationInput;
  notes: string;
};

export const validPmMocToEsquizofreniaOntologicaFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "valid_pm_moc_to_esquizofrenia_ontologica",
  label: "PM/MoC -> Esquizofrenia Ontologica",
  description: "Compartimento PM/MoC valido con conformance, consistency, evidencia y D2 trazado.",
  expectedReadinessState: "diagnostic_preclassification_candidate",
  expectedPathologyCandidate: "Esquizofrenia Ontológica",
  expectedCompartmentId: "EVE02-CMP-001",
  expectedBlockedActions: ["final_diagnosis"],
  notes: "Caso feliz: solo preclasificacion candidata, no diagnostico final.",
  input: baseInput({
    compartment: "EVE02-CMP-001",
    models: ["PM", "MoC"],
  }),
};

export const blockedConformanceUncheckedFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "blocked_conformance_unchecked",
  label: "Conformance unchecked",
  description: "EVE-02 no avanza si EVE-00 no valido conformance.",
  expectedReadinessState: "blocked_by_conformance_unchecked",
  expectedPathologyCandidate: "Brecha Intencional",
  expectedCompartmentId: "EVE02-CMP-002",
  notes: "Protege que la ontologia diagnostica no opere sobre base no conformada.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-002",
      models: ["PM", "PF"],
    }),
    conformance_status: "unchecked",
  },
};

export const blockedConsistencyUncheckedFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "blocked_consistency_unchecked",
  label: "Consistency unchecked",
  description: "EVE-02 no avanza si EVE-00 no valido consistency.",
  expectedReadinessState: "blocked_by_consistency_unchecked",
  expectedPathologyCandidate: "Anarquía Operacional",
  expectedCompartmentId: "EVE02-CMP-003",
  notes: "Protege que no se haga mapeo patologico sin consistencia previa.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-003",
      models: ["MoC", "PF"],
    }),
    consistency_status: "unchecked",
  },
};

export const blockedMissingEvidenceRefsFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "blocked_missing_evidence_refs",
  label: "Evidence refs ausentes",
  description: "Sin evidencia estructurada no hay preclasificacion diagnostica.",
  expectedReadinessState: "blocked_by_missing_evidence",
  expectedPathologyCandidate: "Amnesia Estructural",
  expectedCompartmentId: "EVE02-CMP-005",
  notes: "Demuestra requiredInputs: evidence_refs.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-005",
      models: ["OLC", "MoC"],
    }),
    evidence_refs: [],
  },
};

export const blockedSemanticAmbiguitySemGateOpenFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "blocked_semantic_ambiguity_sem_gate_open",
  label: "Semantic gate open",
  description: "La ambiguedad semantica abierta bloquea el pathology mapping.",
  expectedReadinessState: "blocked_by_semantic_ambiguity",
  expectedPathologyCandidate: "Incapacidad de Gestión de Conjuntos",
  expectedCompartmentId: "EVE02-CMP-008",
  expectedBlockedActions: ["pathology_mapping_until_sem_gate_closed"],
  notes: "Mantiene la frontera de mapeo hasta cerrar semantica.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-008",
      models: ["OLC", "MoC"],
    }),
    semanticGateStatus: "open",
  },
};

export const manualReviewMultipleCompartmentsLowConfidenceFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "manual_review_multiple_compartments_low_confidence",
  label: "Multiples compartimentos, baja confianza",
  description: "Cuando hay varios compartimentos posibles y confianza baja, no se fuerza primary candidate.",
  expectedReadinessState: "manual_review_required",
  expectedPathologyCandidate: "Arquitectura Fantasma",
  expectedCompartmentId: "EVE02-CMP-009",
  expectedBlockedActions: ["force_primary_candidate"],
  notes: "Demuestra la regla EVE02-R025.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-009",
      models: ["PM", "MoC", "PF"],
    }),
    confidenceContext: {
      confidence: "low",
      multipleCompartments: true,
      evidenceStrength: "weak",
    },
  },
};

export const blockedFinalDiagnosisRequestFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "blocked_final_diagnosis_request",
  label: "Final diagnosis request bloqueado",
  description: "La UI dev puede mostrar la traza, pero el servicio bloquea final_diagnosis.",
  expectedReadinessState: "manual_review_required",
  expectedPathologyCandidate: "Promesa Imposible",
  expectedCompartmentId: "EVE02-CMP-010",
  expectedBlockedActions: ["final_diagnosis"],
  notes: "No hay finalDiagnosis ni salida productiva.",
  input: {
    ...baseInput({
      compartment: "EVE02-CMP-010",
      models: ["PM", "PF", "OLC"],
    }),
    requestedOutputType: "final_diagnosis",
  },
};

export const systemicTotalMissingFourViewsFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "systemic_total_missing_four_views",
  label: "Total sistemico sin cuatro vistas",
  description: "EVE02-CMP-013 exige evidencia PM, MoC, PF y OLC.",
  expectedReadinessState: "blocked_by_missing_evidence",
  expectedPathologyCandidate: "Incoherencia Sistémica Total",
  expectedCompartmentId: "EVE02-CMP-013",
  notes: "Bloquea cuando la cobertura de cuatro vistas no esta completa.",
  input: baseInput({
    compartment: "EVE02-CMP-013",
    models: ["PM", "MoC", "PF", "OLC"],
    evidenceRefs: [evidenceRef("ev-systemic-PM"), evidenceRef("ev-systemic-PF")],
  }),
};

export const systemicTotalValidFourViewsFixture: DiagnosticOntologyShadowFixture = {
  fixtureId: "systemic_total_valid_four_views",
  label: "Total sistemico con cuatro vistas",
  description: "EVE02-CMP-013 avanza cuando PM, MoC, PF y OLC estan cubiertos.",
  expectedReadinessState: "diagnostic_preclassification_candidate",
  expectedPathologyCandidate: "Incoherencia Sistémica Total",
  expectedCompartmentId: "EVE02-CMP-013",
  expectedBlockedActions: ["final_diagnosis"],
  notes: "Caso feliz de total sistemico en shadow mode.",
  input: baseInput({
    compartment: "EVE02-CMP-013",
    models: ["PM", "MoC", "PF", "OLC"],
    evidenceRefs: [
      evidenceRef("ev-systemic-PM"),
      evidenceRef("ev-systemic-MoC"),
      evidenceRef("ev-systemic-PF"),
      evidenceRef("ev-systemic-OLC"),
    ],
  }),
};

export const DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES = [
  validPmMocToEsquizofreniaOntologicaFixture,
  blockedConformanceUncheckedFixture,
  blockedConsistencyUncheckedFixture,
  blockedMissingEvidenceRefsFixture,
  blockedSemanticAmbiguitySemGateOpenFixture,
  manualReviewMultipleCompartmentsLowConfidenceFixture,
  blockedFinalDiagnosisRequestFixture,
  systemicTotalMissingFourViewsFixture,
  systemicTotalValidFourViewsFixture,
] as const;

export type DiagnosticOntologyShadowFixtureId =
  (typeof DIAGNOSTIC_ONTOLOGY_SHADOW_FIXTURES)[number]["fixtureId"];
