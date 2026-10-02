import type {
  AgentConstitutionEvaluationInput,
  AgentConstitutionReadinessState,
  AgentConstitutionSourceTrace,
} from "@/domain/agent-constitution-evaluation";

const d1Trace: AgentConstitutionSourceTrace = {
  sourceId: "D1",
  ruleId: "SRC-001",
  locator: "fixture:agent-constitution-shadow:D1",
  authorityDomain: "Metodo MMABP",
};

const d2Trace: AgentConstitutionSourceTrace = {
  sourceId: "D2",
  ruleId: "SRC-002",
  locator: "fixture:agent-constitution-shadow:D2",
  authorityDomain: "Ontologia diagnostica",
};

const d3Trace: AgentConstitutionSourceTrace = {
  sourceId: "D3",
  ruleId: "SRC-003",
  locator: "fixture:agent-constitution-shadow:D3",
  authorityDomain: "Arbol de decisiones",
};

const d4Trace: AgentConstitutionSourceTrace = {
  sourceId: "D4",
  ruleId: "SRC-004",
  locator: "fixture:agent-constitution-shadow:D4",
  authorityDomain: "Compatibilidad limite D4",
};

const d5Trace: AgentConstitutionSourceTrace = {
  sourceId: "D5",
  ruleId: "SRC-005",
  locator: "fixture:agent-constitution-shadow:D5",
  authorityDomain: "Compatibilidad limite D5",
};

export type AgentConstitutionShadowFixture = {
  fixtureId: string;
  label: string;
  description: string;
  expectedReadinessState: AgentConstitutionReadinessState;
  input: AgentConstitutionEvaluationInput;
  notes: string;
};

export const captureAllowedTracedEvidenceFixture: AgentConstitutionShadowFixture = {
  fixtureId: "capture_allowed_traced_evidence",
  label: "Captura permitida con evidencia trazada",
  description:
    "Evidencia capturada con sourceRefs D1 y sourceTrace completo para capture_evidence.",
  expectedReadinessState: "capture_allowed",
  notes: "No usa texto libre sin sourceTrace. Evidencia confirmada, no prefill sin confirmar.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "capture_evidence",
    inputClassification: "evidence_capture",
    targetBoundary: "Capa 1 evidence capture",
    requestedOutputType: "constitutionalDecisionCandidate",
    sourceTrace: [d1Trace, d4Trace],
    evidenceItems: [
      {
        evidenceItemId: "ev-capture-allowed",
        value: "Actividad descrita con verbo, objeto y receptor trazable a D1.",
        provenanceType: "captured_user_evidence",
        sourceRefs: [d1Trace],
        revision: 1,
        epistemicStatus: "captured_user_evidence",
      },
    ],
  },
};

export const missingSourceTraceFixture: AgentConstitutionShadowFixture = {
  fixtureId: "missing_source_trace",
  label: "Source trace ausente",
  description:
    "Accion estructural sin sourceTrace de nivel evaluacion; debe exigir auditoria.",
  expectedReadinessState: "audit_required",
  notes: "Demuestra bloqueo SRC-008 cuando sourceTrace esta vacio.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "create_structural_candidate",
    inputClassification: "structural_candidate",
    targetBoundary: "Capa 1 structural candidate",
    requestedOutputType: "constitutionalDecisionCandidate",
    sourceTrace: [],
    evidenceItems: [
      {
        evidenceItemId: "ev-missing-trace",
        value: "Candidato PM sin trazabilidad de fuente en nivel constitucional.",
        provenanceType: "ai_inferred_unconfirmed",
        sourceRefs: [],
        revision: 1,
        epistemicStatus: "ai_inferred_unconfirmed",
      },
    ],
  },
};

export const scopeBlockedFinalDiagnosisFixture: AgentConstitutionShadowFixture = {
  fixtureId: "scope_blocked_final_diagnosis",
  label: "Diagnostico final bloqueado por alcance",
  description:
    "Solicitud de diagnostico final desde Capa 1 con Method Kernel y D2 presentes.",
  expectedReadinessState: "blocked_by_scope",
  notes: "Permite preclasificacion candidata pero bloquea final_diagnosis.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "emit_final_diagnosis_from_Capa1",
    inputClassification: "final_diagnosis_request",
    targetBoundary: "Capa 1 forbidden final diagnosis",
    requestedOutputType: "final_diagnosis",
    sourceTrace: [d1Trace, d2Trace, d5Trace],
    methodKernelResult: {
      readinessState: "ready",
      mode: "shadow",
    },
    evidenceItems: [
      {
        evidenceItemId: "ev-scope-block",
        value: "Evidencia estructural lista pero accion fuera de alcance constitucional.",
        provenanceType: "user_confirmed_suggestion",
        sourceRefs: [d1Trace, d2Trace],
        revision: 2,
        epistemicStatus: "user_confirmed_suggestion",
      },
    ],
  },
};

export const diagnosticPreclassificationCandidateFixture: AgentConstitutionShadowFixture = {
  fixtureId: "diagnostic_preclassification_candidate",
  label: "Candidato de preclasificacion diagnostica",
  description:
    "Preclasificacion con Method Kernel result y mapeo D2 trazado.",
  expectedReadinessState: "ready_for_diagnostic_preclassification",
  notes: "No emite diagnostico final; prepara candidato con auditoria.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "diagnostic_preclassification",
    inputClassification: "diagnostic_preclassification",
    targetBoundary: "Capa 1 diagnostic vocabulary",
    requestedOutputType: "diagnostic_preclassification",
    sourceTrace: [d1Trace, d2Trace, d3Trace],
    methodKernelResult: {
      readinessState: "ready_with_flags",
      mode: "shadow",
      findings: [{ ruleId: "FND-002" }],
    },
    evidenceItems: [
      {
        evidenceItemId: "ev-preclass",
        value: "Vocabulario diagnostico preparado desde ontologia D2 sin cierre final.",
        provenanceType: "canonical_derivation",
        sourceRefs: [d2Trace],
        revision: 1,
        epistemicStatus: "canonical_derivation",
      },
    ],
  },
};

export const parallelPreviewBlockedMissingReadinessFixture: AgentConstitutionShadowFixture = {
  fixtureId: "parallel_preview_blocked_missing_readiness",
  label: "Preview paralelo bloqueado sin readiness",
  description:
    "Solicitud de export o preview paralelo sin cadena de readiness ni autoridad.",
  expectedReadinessState: "export_blocked",
  notes: "Bloquea export final de produccion y registry_export.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "prepare_parallel_export_preview",
    inputClassification: "parallel_export_preview",
    targetBoundary: "Capa 1 export boundary",
    requestedOutputType: "parallel_preview",
    sourceTrace: [d1Trace, d4Trace, d5Trace],
    evidenceItems: [
      {
        evidenceItemId: "ev-export-block",
        value: "Preview solicitado antes de readiness constitucional completo.",
        provenanceType: "internal_calculated",
        sourceRefs: [d1Trace],
        revision: 1,
        epistemicStatus: "internal_calculated",
      },
    ],
  },
};

export const auditRequiredIncompleteSourceTraceFixture: AgentConstitutionShadowFixture = {
  fixtureId: "audit_required_incomplete_source_trace",
  label: "Auditoria requerida por trazabilidad incompleta",
  description:
    "Resolucion de conflicto de autoridad sin sourceTrace evaluable.",
  expectedReadinessState: "audit_required",
  notes: "Demuestra audit_required cuando falta source_trace completo en nivel decision.",
  input: {
    mode: "constitutional_shadow",
    requestedAction: "resolve_authority_conflict",
    inputClassification: "authority_conflict",
    targetBoundary: "Capa 1 authority review",
    requestedOutputType: "constitutionalDecisionCandidate",
    sourceTrace: [],
    evidenceItems: [
      {
        evidenceItemId: "ev-audit-incomplete",
        value: "Conflicto entre fuentes sin cadena sourceTrace cerrada.",
        provenanceType: "user_corrected_evidence",
        sourceRefs: [d3Trace],
        revision: 1,
        epistemicStatus: "user_corrected_evidence",
      },
    ],
  },
};

export const AGENT_CONSTITUTION_SHADOW_FIXTURES = [
  captureAllowedTracedEvidenceFixture,
  missingSourceTraceFixture,
  scopeBlockedFinalDiagnosisFixture,
  diagnosticPreclassificationCandidateFixture,
  parallelPreviewBlockedMissingReadinessFixture,
  auditRequiredIncompleteSourceTraceFixture,
] as const;

export type AgentConstitutionShadowFixtureId =
  (typeof AGENT_CONSTITUTION_SHADOW_FIXTURES)[number]["fixtureId"];
