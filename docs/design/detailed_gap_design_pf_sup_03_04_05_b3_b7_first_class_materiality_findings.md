# Findings — DETAILED_GAP_DESIGN_PF_SUP_03_04_05_B3_B7_FIRST_CLASS_MATERIALITY_V1

## CRITICAL

None.

## HIGH

### DGD-HIGH-001

- Severity: HIGH
- Gap family: PF_SUP_03
- Affected object: EscenaEvidencial
- Tree branch: Capa 1.0 / EvidenceBundle
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`, `docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json`
- Current materiality: L2 vocabulary_only
- Required design materiality: L4 contract_defined
- Rule affected: PF-SUP-03 cannot be claimed from state vocabulary alone.
- Impact: Transduction may be over-claimed without an evidential scene runner.
- Recommended design closure: Define `services/eve/transduction/evidential-scene-runner`, `pf_sup_03_escena_evidencial_contract`, and `PF_SUP_03_MATERIALITY_MARKER`.
- Implementation allowed now: false
- Dependency: MoC, OLC, PF

### DGD-HIGH-002

- Severity: HIGH
- Gap family: PF_SUP_03
- Affected object: ActoObservable
- Tree branch: Capa 1.0 / Object Specification Pack
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`
- Current materiality: L2 vocabulary_only
- Required design materiality: L4 contract_defined
- Rule affected: Observable acts require source evidence before scene construction.
- Impact: EscenaEvidencial can be assembled without a traceable observable act.
- Recommended design closure: Define `pf_sup_03_acto_observable_contract` with source_ref, evidence_excerpt_ref and Accepted/Rejected states.
- Implementation allowed now: false
- Dependency: MoC, PF

### DGD-HIGH-003

- Severity: HIGH
- Gap family: PF_SUP_04
- Affected object: PeliculaCausalAgregada
- Tree branch: Baseline de materialidad actual repo vs rector
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: Aggregated causal movie requires owned SceneSet and AggregationIndex.
- Impact: Causal aggregation can be confused with summary-level logic.
- Recommended design closure: Define `services/eve/aggregation/causal-movie-aggregation-runner` and PF-SUP-04 contracts.
- Implementation allowed now: false
- Dependency: MoC, OLC, PF

### DGD-HIGH-004

- Severity: HIGH
- Gap family: PF_SUP_05
- Affected object: SynthesisCase
- Tree branch: corrected object owner; Sistema Regulatorio is boundary only
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/types/eve-organism-gate2-authority-guardrails.ts`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: PF-SUP-05 must remain contract-only and block Delivered.
- Impact: Final narrative, recommendation or delivered diagnosis could be over-claimed.
- Recommended design closure: Define `services/eve/synthesis/expert-synthesis-contract-service`, `pf_sup_05_synthesis_case_contract`, and `delivery_boundary_contract`.
- Implementation allowed now: false
- Dependency: PF, authorization boundary

### DGD-HIGH-005

- Severity: HIGH
- Gap family: B3
- Affected object: ReceiverFeedbackObject
- Tree branch: Capa 1.0 / OperationalExceptionEvidence
- Repo evidence/path: `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`, `src/services/eve-organism-gate2-signal-guardrails.ts`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: receiver_satisfaction != receiver_feedback.
- Impact: Satisfaction may be promoted incorrectly as operational feedback.
- Recommended design closure: Define `services/eve/capa1/b3-receiver-feedback-materializer` and `b3_receiver_feedback_object_contract`.
- Implementation allowed now: false
- Dependency: OLC, PF

### DGD-HIGH-006

- Severity: HIGH
- Gap family: B7
- Affected object: PreclassificationRecord
- Tree branch: corrected object owner; Sistema Regulatorio is boundary only
- Repo evidence/path: `docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts`, `src/services/eve-organism-gate2-signal-guardrails.ts`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: B7 must remain signal-only and non-diagnostic.
- Impact: B7 may contaminate registry, IR, export, OEE or diagnosis if no material boundary exists.
- Recommended design closure: Define `services/eve/capa1/b7-preclassification-boundary-service`, `b7_preclassification_record_contract`, and `no_render_zone_contract`.
- Implementation allowed now: false
- Dependency: PF, security control

### DGD-HIGH-007

- Severity: HIGH
- Gap family: cross-family
- Affected object: Materiality markers
- Tree branch: Baseline de materialidad actual repo vs rector
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Current materiality: L2/L3 mixed
- Required design materiality: L4 contract_defined
- Rule affected: Marker must prevent false-positive materiality claims.
- Impact: Vocabulary or guardrail evidence may be interpreted as service-level closure.
- Recommended design closure: Define `services/eve/materiality/materiality-marker-evaluator` and one marker per family.
- Implementation allowed now: false
- Dependency: MoC, OLC, PF

## MEDIUM

### DGD-MEDIUM-001

- Severity: MEDIUM
- Gap family: PF_SUP_03
- Affected object: GovernanceIssue route
- Tree branch: Capa 1.0 / EvidenceBundle
- Repo evidence/path: `docs/audit/moc_gap_analysis_pf_sup_03_04_05_b3_b7.json`
- Current materiality: L2 vocabulary_only
- Required design materiality: L4 contract_defined
- Rule affected: Insufficient causality requires explicit rework.
- Impact: PF-SUP-03 may fail without a deterministic fallback path.
- Recommended design closure: Add rework route insufficient causality -> GovernanceIssue -> EvidenceBundle rework.
- Implementation allowed now: false
- Dependency: PF

### DGD-MEDIUM-002

- Severity: MEDIUM
- Gap family: PF_SUP_04
- Affected object: SceneSet
- Tree branch: PF-SUP-04 / causal aggregation object ownership; Runtime 40/20 is dependency only
- Repo evidence/path: `docs/audit/olc_gap_analysis_pf_sup_03_04_05_b3_b7.json`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: Aggregation requires minimum validated scenes.
- Impact: Causal movie could be composed from insufficient evidence.
- Recommended design closure: Define SceneSet states Collecting, AggregationEligible, BlockedByInsufficientScenes, Superseded.
- Implementation allowed now: false
- Dependency: PF-SUP-03

### DGD-MEDIUM-003

- Severity: MEDIUM
- Gap family: PF_SUP_05
- Affected object: NarrativaFinalCliente / TeoremaInevitabilidad / RecomendacionConsultiva
- Tree branch: corrected object owner; Sistema Regulatorio is boundary only
- Repo evidence/path: `src/services/mba/domain-state-registry.mjs`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: Client-facing synthesis is outside this scope.
- Impact: Contract evidence could be mistaken for delivery authorization.
- Recommended design closure: Keep these objects as blocked outputs until external authorization exists.
- Implementation allowed now: false
- Dependency: Authorization boundary

### DGD-MEDIUM-004

- Severity: MEDIUM
- Gap family: B3
- Affected object: CanonicalRouteException / GapObject / FlowNormalizationRecord
- Tree branch: Capa 1.0 / OperationalExceptionEvidence
- Repo evidence/path: `fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json`
- Current materiality: L3 guardrail_only
- Required design materiality: L4 contract_defined
- Rule affected: Missing route and unknown feedback require explicit gap handling.
- Impact: Feedback may be accepted without canonical route validation.
- Recommended design closure: Define route_missing and unknown delivery failure states under B3 contract pack.
- Implementation allowed now: false
- Dependency: OLC

### DGD-MEDIUM-005

- Severity: MEDIUM
- Gap family: cross-family
- Affected object: Materiality marker evaluator
- Tree branch: Baseline de materialidad actual repo vs rector
- Repo evidence/path: `docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json`
- Current materiality: not implemented
- Required design materiality: L4 contract_defined
- Rule affected: Materiality level must be evaluated consistently.
- Impact: Future work may mix L2 vocabulary, L3 guardrail and L4 contract evidence.
- Recommended design closure: Define marker evaluator that reports level without mutating runtime readiness.
- Implementation allowed now: false
- Dependency: All families

## LOW

### DGD-LOW-001

- Severity: LOW
- Gap family: Runtime 40/20
- Affected object: Evidence consumption boundary
- Tree branch: PF-SUP-04 / causal aggregation object ownership; Runtime 40/20 is dependency only
- Repo evidence/path: `docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json`
- Current materiality: evidence dependency only
- Required design materiality: L4 contract_defined
- Rule affected: Runtime 40/20 full execution remains unauthorized.
- Impact: Low if boundary remains documentary; high only if runtime is opened early.
- Recommended design closure: Keep Runtime 40/20 as downstream dependency until L4 contracts exist.
- Implementation allowed now: false
- Dependency: PF markers

### DGD-LOW-002

- Severity: LOW
- Gap family: adjacent services
- Affected object: Existing causal services
- Tree branch: Baseline repo vs rector
- Repo evidence/path: `src/services/client-causal-aggregation-engine.ts`, `src/services/causal-transduction-engine.ts`
- Current materiality: adjacent logic
- Required design materiality: L4 contract_defined
- Rule affected: Adjacent services must not be counted as PF first-class closure.
- Impact: Could create audit ambiguity.
- Recommended design closure: Treat adjacent services as evidence only, not materiality closure.
- Implementation allowed now: false
- Dependency: PF-SUP-03/PF-SUP-04 contract definitions

## INFO

### DGD-INFO-001

- Severity: INFO
- Gap family: all
- Affected object: JSON traceability
- Tree branch: Baseline repo vs rector
- Repo evidence/path: `docs/design/detailed_gap_design_pf_sup_03_04_05_b3_b7_first_class_materiality.json`
- Current materiality: documentary design
- Required design materiality: L4 contract_defined
- Rule affected: Findings must remain traceable.
- Impact: Supports next authorization.
- Recommended design closure: Use JSON as controlled input for the authorized implementation tramo.
- Implementation allowed now: false
- Dependency: next authorization

### DGD-INFO-002

- Severity: INFO
- Gap family: all
- Affected object: No-Go boundary
- Tree branch: Soft Governance & Security Control
- Repo evidence/path: this design package
- Current materiality: boundary preserved
- Required design materiality: L4 contract_defined
- Rule affected: No implementation in design tramo.
- Impact: Confirms no unsafe promotion occurred.
- Recommended design closure: Request explicit authorization before any service, schema or test file is created.
- Implementation allowed now: false
- Dependency: next authorization


## COMPLETION ADDENDUM

Este addendum completa el dictamen sin cambiar los conteos de severidad. La ampliacion solicitada queda reflejada en el Markdown principal y en el JSON traceability.

### Matriz obligatoria completa

- Incluida en docs/design/detailed_gap_design_pf_sup_03_04_05_b3_b7_first_class_materiality.md, seccion 19.1.1.
- Reflejada en gap_matrix dentro del JSON traceability.

### Evaluacion MECE A-E objeto por objeto

- Incluida en docs/design/detailed_gap_design_pf_sup_03_04_05_b3_b7_first_class_materiality.md, seccion 19.1.2.
- Reflejada en object_groups_mece y mece_object_evaluation dentro del JSON traceability.

### Clasificacion repo por objeto

Valores usados:

- confirmed_by_repo.
- partially_confirmed.
- not_found.
- contradicted_by_repo.
- requires_manual_review.

En este tramo no se marco ningun objeto como contradicted_by_repo; las brechas detectadas son ausencia, confirmacion parcial o revision manual.

### Correccion de ramas del Arbol maestro

- PF-SUP-04: Runtime 40/20 queda como dependencia downstream, no como dueno de SceneSet, AggregationIndex ni PeliculaCausalAgregada.
- PF-SUP-05: Sistema Regulatorio queda como frontera de autorizacion/seguridad, no como dueno de SynthesisCase ni delivery boundary.
- B7: Sistema Regulatorio queda como frontera de contaminacion/export/diagnosis, no como dueno de PreclassificationRecord ni no_render_zone.

### Evidencia granular

- Incluida por path y tipo en granular_evidence_catalog.
- Replicada en la tabla 19.1.4 del Markdown principal.

### JSON traceability

Validado como completo para este tramo documental:

- includes_gap_matrix: true.
- includes_mece_object_evaluation: true.
- includes_repo_classification_by_object: true.
- includes_corrected_tree_location_by_object: true.
- includes_granular_evidence_by_path_and_type: true.
- includes_runtime_and_regulatory_owner_corrections: true.
- implementation_allowed: false.
- runtime_40_20_full_allowed: false.
