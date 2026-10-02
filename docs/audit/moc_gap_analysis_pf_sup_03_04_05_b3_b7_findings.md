# MoC Gap Analysis Findings

## HIGH
### MOC-HIGH-001
- Severity: HIGH
- Class or group affected: PF-SUP-03 conceptual internals
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: PF-SUP-03 requires EvidenceBundle to be transduced into ElementoMMABP, HipotesisVSMPrimaria, InconsistenciaMMABP, NodoEVELocal, ActorFuncionalEVE, ActoObservable, EscenaEvidencial and TraduccionAHEMaterial.
- Impact: The repo has state vocabulary but not enough first-class conceptual objects for executable transduction.
- Recommended action: Design MoC contracts for missing PF-SUP-03 concepts before OLC/PF execution.
- Dependency: PF and OLC

### MOC-HIGH-002
- Severity: HIGH
- Class or group affected: ActoObservable
- Evidence/path: absence reasoned by search
- Rector rule affected: EscenaEvidencial must be built from observable acts, not only summaries or states.
- Impact: PF-SUP-03 could build scenes without atomic observable evidence.
- Recommended action: Add ActoObservable to MoC patch design with evidence refs and actor relation.
- Dependency: PF

### MOC-HIGH-003
- Severity: HIGH
- Class or group affected: PF-SUP-04 aggregation concepts
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: PF-SUP-04 requires SceneSet, AggregationIndex, PatronCausalMultirol, PeliculaCausalAgregada, SenalMonetizable, PerdidaMonetizable and BloqueoAHEAgregado.
- Impact: Aggregation has guardrails but not a complete conceptual model.
- Recommended action: Design first-class aggregation concepts and relations before implementing PF-SUP-04 service logic.
- Dependency: PF and OLC

### MOC-HIGH-004
- Severity: HIGH
- Class or group affected: SynthesisCase
- Evidence/path: absence reasoned by search
- Rector rule affected: PF-SUP-05 must create SynthesisCase before composing final narrative, theorem, recommendation and diagnosis.
- Impact: SynthesisCase can be fused with DiagnosticoExpertoFinal.
- Recommended action: Add SynthesisCase contract with movie_id and synthesis artifact refs.
- Dependency: PF and OLC

### MOC-HIGH-005
- Severity: HIGH
- Class or group affected: ReceiverFeedbackObject / OperationalExceptionEvidence
- Evidence/path: `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`, `src/services/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: B3 receiver_feedback can become operational event only through canonical route/source trace and not from satisfaction.
- Impact: Guardrails exist, but first-class B3 operational objects are missing.
- Recommended action: Design B3 MoC contracts with route_ref, source_ref, feedback_type and exception categories.
- Dependency: PF and OLC

### MOC-HIGH-006
- Severity: HIGH
- Class or group affected: PreclassificationRecord
- Evidence/path: `docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts`, `src/app/api/scenes/runtime-contract-verify/route.ts`
- Rector rule affected: B7 is preclassification only; it must not become structural fact, registry, IR, OEE, export or diagnosis.
- Impact: Candidate logic exists, but exact PreclassificationRecord with interpretation_limit/non_diagnostic_signal_only is missing.
- Recommended action: Add PreclassificationRecord to MoC patch design and contamination tests.
- Dependency: PF

### MOC-HIGH-007
- Severity: HIGH
- Class or group affected: SenalMonetizable / BloqueoAHEAgregado
- Evidence/path: absence reasoned by search
- Rector rule affected: PF-SUP-04 needs monetizable signals and aggregated AHE blocks as concepts, not only loss states.
- Impact: Monetary/AHE dimensions can be skipped or over-promoted.
- Recommended action: Add both concepts with non-final and non-diagnostic boundaries.
- Dependency: PF

### MOC-HIGH-008
- Severity: HIGH
- Class or group affected: MoC vs OLC separation
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Do not declare MoC class implemented only because it appears as an OLC state.
- Impact: State registry can be over-claimed as conceptual implementation.
- Recommended action: Treat OLC state names as evidence of vocabulary only unless a conceptual object/service/schema exists.
- Dependency: PF and OLC

## MEDIUM
### MOC-MED-001
- Severity: MEDIUM
- Class or group affected: ElementoMMABP / HipotesisVSMPrimaria / InconsistenciaMMABP
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: PF-SUP-03 internal elements require source refs and relations.
- Impact: Type-contract states are useful but insufficient for MoC materiality.
- Recommended action: Add relation fields and evidence refs in MoC patch.
- Dependency: PF

### MOC-MED-002
- Severity: MEDIUM
- Class or group affected: ArchitectureFindingSet
- Evidence/path: `src/services/mba/governance-finding-normalizer.mjs`
- Rector rule affected: QA findings should be routed and classified separately from diagnosis.
- Impact: Finding logic exists, but first-class finding set is partial.
- Recommended action: Add ArchitectureFindingSet contract if downstream QA is included in next OLC tranche.
- Dependency: OLC

### MOC-MED-003
- Severity: MEDIUM
- Class or group affected: CompositeConsistencyAssessment
- Evidence/path: `docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.ts`, `docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.ts`
- Rector rule affected: Composite consistency must remain distinct from conformance and simple consistency.
- Impact: It is mostly documented/chip materiality, not a first-class service object.
- Recommended action: Defer to QA/OLC tranche and keep it downstream.
- Dependency: OLC

### MOC-MED-004
- Severity: MEDIUM
- Class or group affected: OutputHandoffRecord
- Evidence/path: `schemas/common/enums-v2-1.json`, `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`
- Rector rule affected: B3 feedback should be grounded in a handoff and receiver actor.
- Impact: Handoff terms exist, but no first-class record links receiver feedback to PF events.
- Recommended action: Add OutputHandoffRecord relation to ReceiverFeedbackObject.
- Dependency: PF

### MOC-MED-005
- Severity: MEDIUM
- Class or group affected: NarrativaFinalCliente / TeoremaInevitabilidad / RecomendacionConsultiva
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: PF-SUP-05 synthesis artifacts must be traceable objects.
- Impact: They exist as states, not as objects.
- Recommended action: Add artifact contracts after SynthesisCase is designed.
- Dependency: PF

### MOC-MED-006
- Severity: MEDIUM
- Class or group affected: B3B7AlignmentDelta
- Evidence/path: `src/services/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: B3/B7 alignment delta is a technical control artifact, not a client business fact.
- Impact: Boundary fields exist but no delta artifact is materialized.
- Recommended action: Add delta artifact in a control-only scope if B3/B7 checks become executable.
- Dependency: PF

## LOW
### MOC-LOW-001
- Severity: LOW
- Class or group affected: ArchitectureConsistencyAssessment
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `tests/regression/mba-control-plane/mba-control-plane.test.mjs`
- Rector rule affected: QA downstream must not be used as proof of PF-SUP-03/04/05 implementation.
- Impact: It is relatively mature but outside MoC closure for PF-SUP-03/04/05.
- Recommended action: Keep as downstream dependency.
- Dependency: none

### MOC-LOW-002
- Severity: LOW
- Class or group affected: ConformanceAssessment
- Evidence/path: `schemas/parallel-production/conformance-report.schema.json`, `tests/regression/parallel-production/conformance-consistency-report.test.mjs`
- Rector rule affected: Conformance precedes consistency.
- Impact: Sufficient as downstream input, but not needed to patch PF-SUP-03/04/05 MoC immediately.
- Recommended action: Reuse in OLC gap analysis.
- Dependency: none

## INFO
### MOC-INFO-001
- Severity: INFO
- Class or group affected: EvidenceBundle / EscenaEvidencial / PeliculaCausalAgregada / DiagnosticoExpertoFinal
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Object naming alignment.
- Impact: Main governed object vocabulary is aligned enough to support next OLC audit.
- Recommended action: Use as vocabulary, not as implementation proof.
- Dependency: OLC

### MOC-INFO-002
- Severity: INFO
- Class or group affected: B3/B7 guardrails
- Evidence/path: `src/services/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: B3 route and B7 boundary checks.
- Impact: Useful guardrail field vocabulary is present.
- Recommended action: Convert to first-class MoC/control artifacts only in a patch tranche.
- Dependency: PF
