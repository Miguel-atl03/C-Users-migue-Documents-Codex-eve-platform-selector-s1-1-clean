# OLC Gap Analysis Findings

## HIGH
### OLC-HIGH-001
- Severity: HIGH
- Object or group affected: PF-SUP-03 internal objects
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: ElementoMMABP, HipotesisVSMPrimaria, InconsistenciaMMABP, NodoEVELocal, ActorFuncionalEVE and TraduccionAHEMaterial require object-owned lifecycles, not only states inside EscenaEvidencial.
- Impact: PF-SUP-03 can be over-claimed as OLC complete from state vocabulary.
- Recommended action: Design combined MoC+OLC patch for internal PF-SUP-03 objects.
- Dependency: MoC and OLC

### OLC-HIGH-002
- Severity: HIGH
- Object or group affected: ActoObservable
- Evidence/path: absence reasoned by search
- Rector rule affected: ActoObservable requires Captured, EvidenceLinked, Accepted and Rejected states.
- Impact: Atomic observable evidence cannot be audited as an object lifecycle.
- Recommended action: Create MoC concept first, then OLC.
- Dependency: MoC

### OLC-HIGH-003
- Severity: HIGH
- Object or group affected: EscenaEvidencial
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: EscenaEvidencial needs rework to EvidenceBundle and step-level timers.
- Impact: Existing lifecycle is aligned but incomplete for rework and temporal safety.
- Recommended action: Add explicit rework route and rector timers before PF execution.
- Dependency: OLC/PF

### OLC-HIGH-004
- Severity: HIGH
- Object or group affected: PF-SUP-04 aggregation subobjects
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: SceneSet, AggregationIndex, PatronCausalMultirol, SenalMonetizable and BloqueoAHEAgregado require distinct OLCs.
- Impact: PeliculaCausalAgregada is relatively strong, but subobjects are missing or state-only.
- Recommended action: Design combined MoC+OLC patch for aggregation subobjects.
- Dependency: MoC and OLC

### OLC-HIGH-005
- Severity: HIGH
- Object or group affected: PeliculaCausalAgregada
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: PF-SUP-04 needs rework to PF-SUP-03 and exact timers for scenes, pattern and validation.
- Impact: Broad lifecycle exists, but rework and timer granularity remain gaps.
- Recommended action: Add enrichment/rework route and step timers.
- Dependency: OLC/PF

### OLC-HIGH-006
- Severity: HIGH
- Object or group affected: SynthesisCase
- Evidence/path: absence reasoned by search
- Rector rule affected: PF-SUP-05 requires SynthesisCase before expert narrative, theorem, recommendation and final diagnosis.
- Impact: PF-SUP-05 OLC cannot be complete and synthesis artifacts risk fusing into DiagnosticoExpertoFinal.
- Recommended action: Create SynthesisCase MoC+OLC before PF-SUP-05 execution.
- Dependency: MoC and OLC

### OLC-HIGH-007
- Severity: HIGH
- Object or group affected: DiagnosticoExpertoFinal
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: Delivered must be gated, reviewed and authorized; weak traceability must route back to PF-SUP-04.
- Impact: Delivered is represented and guarded, but current gate scope does not authorize final diagnosis.
- Recommended action: Keep Delivered blocked until explicit authorization and add recomposition route.
- Dependency: OLC/PF

### OLC-HIGH-008
- Severity: HIGH
- Object or group affected: B3 ReceiverFeedbackObject / OperationalExceptionEvidence
- Evidence/path: `src/services/eve-organism-gate2-signal-guardrails.ts`, `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`
- Rector rule affected: B3 requires route_ref/source_ref and must reject satisfaction-only feedback.
- Impact: Guardrails exist, but first-class B3 OLC is absent.
- Recommended action: Add B3 OLC with Captured, RouteValidated, OperationallyRelevant, RejectedAsSatisfactionOnly, GapFlagged and ReworkTriggered.
- Dependency: MoC and OLC

### OLC-HIGH-009
- Severity: HIGH
- Object or group affected: B7 PreclassificationRecord
- Evidence/path: `src/app/api/scenes/runtime-contract-verify/route.ts`, `docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts`
- Rector rule affected: B7 must remain signal-only and block structural fact, registry, IR, export, OEE and diagnosis.
- Impact: Boundary logic exists but exact OLC is missing.
- Recommended action: Add PreclassificationRecord OLC with BoundaryChecked, SignalOnlyAccepted and ContaminationBlocked.
- Dependency: MoC and OLC

### OLC-HIGH-010
- Severity: HIGH
- Object or group affected: OLC rule structure
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Internal states should have meaningful transitions, terminal paths, timers or justified single-exit design.
- Impact: Many subobjects have no object-owned exits, self-loops or timers.
- Recommended action: Design OLC patch from object ownership, not PF step names.
- Dependency: OLC

## MEDIUM
### OLC-MED-001
- Severity: MEDIUM
- Object or group affected: EvidenceBundle
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: EvidenceBundle expected ReworkRequired and BlockedByInsufficientTraceability names.
- Impact: Equivalent lifecycle exists, but naming/semantics need alignment.
- Recommended action: Map `Blocked` and `ReadinessRejected -> Assembling` to rector rework/block semantics.
- Dependency: OLC

### OLC-MED-002
- Severity: MEDIUM
- Object or group affected: SceneSet
- Evidence/path: `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: SceneSet must own Collecting, AggregationEligible, BlockedByInsufficientScenes and Superseded states.
- Impact: Current 2..* guard is useful but not a full SceneSet OLC.
- Recommended action: Add first-class SceneSet lifecycle.
- Dependency: MoC/OLC

### OLC-MED-003
- Severity: MEDIUM
- Object or group affected: NarrativaFinalCliente / TeoremaInevitabilidad / RecomendacionConsultiva
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Synthesis artifacts need object-owned draft/review/reject lifecycles.
- Impact: They are represented as DiagnosticoExpertoFinal states only.
- Recommended action: Add artifact OLCs after SynthesisCase.
- Dependency: MoC/OLC

### OLC-MED-004
- Severity: MEDIUM
- Object or group affected: B3B7AlignmentDelta
- Evidence/path: `src/services/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: Alignment delta is a technical control artifact, not client fact.
- Impact: Boundary status exists, but no Created/Checked/WithFindings/Satisfied/Blocked lifecycle.
- Recommended action: Add control-only OLC if B3/B7 executable checks are implemented.
- Dependency: OLC

### OLC-MED-005
- Severity: MEDIUM
- Object or group affected: QA downstream child objects
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/governance-finding-normalizer.mjs`
- Rector rule affected: QA downstream must not prove PF-SUP-03/04/05 OLC.
- Impact: ArchitectureConsistencyAssessment is strong; child concepts remain embedded/partial.
- Recommended action: Keep QA downstream as dependency and avoid using it as PF OLC proof.
- Dependency: none

## LOW
### OLC-LOW-001
- Severity: LOW
- Object or group affected: Self-loops
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Self-loops should cover attribute/link changes without fundamental state change.
- Impact: Self-loops are generally absent.
- Recommended action: Add only where mutable attributes or links are introduced.
- Dependency: OLC

### OLC-LOW-002
- Severity: LOW
- Object or group affected: Timer granularity
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Process states should avoid deadlock through timers.
- Impact: Broad timers exist for main governed objects, but exact rector timers are missing.
- Recommended action: Expand timers in patch design, not in this audit.
- Dependency: OLC

## INFO
### OLC-INFO-001
- Severity: INFO
- Object or group affected: Core governed objects
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: EvidenceBundle, EscenaEvidencial, PeliculaCausalAgregada, DiagnosticoExpertoFinal and ArchitectureConsistencyAssessment have recognizable OLC anchors.
- Impact: These can anchor the next patch design.
- Recommended action: Reuse vocabulary carefully without over-claiming executable completion.
- Dependency: OLC

### OLC-INFO-002
- Severity: INFO
- Object or group affected: Safety boundary
- Evidence/path: `src/services/mba/nonconformance-rules.mjs`, `src/services/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: No diagnosis/export/registry promotion from insufficient state or B7 signal.
- Impact: Guardrails reduce No-Go risk.
- Recommended action: Preserve as constraints in combined MoC+OLC patch.
- Dependency: none
