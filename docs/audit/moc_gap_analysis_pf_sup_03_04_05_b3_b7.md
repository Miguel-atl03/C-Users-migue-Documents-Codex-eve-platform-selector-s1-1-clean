# MoC Gap Analysis PF-SUP-03/04/05 + B3/B7

## Executive summary
Dictamen: MOC_GAP_ANALYSIS_FOR_PF_SUP_03_04_05_B3_B7_COMPLETED.

Read-only S3* MoC audit. No source code, schemas, migrations, runtime, DB, registry, export or diagnosis were modified or activated. The 31 rector classes were audited MECE. The repo has useful object/state vocabulary, guardrails and some tested downstream controls, but PF-SUP-03/04/05 still lack enough first-class conceptual objects to sustain executable PF work without a MoC patch design first.

- PF-SUP-03: partial MoC; mostly type contracts plus tested governed objects. Missing ActoObservable and first-class internal concept services.
- PF-SUP-04: partial MoC; PeliculaCausalAgregada and SceneSet guard exist, but aggregation concepts are incomplete.
- PF-SUP-05: weak MoC; DiagnosticoExpertoFinal is guarded/tested, but SynthesisCase is absent and synthesis artifacts are states.
- B3: route/guardrail materiality exists; ReceiverFeedbackObject and OperationalExceptionEvidence are not first-class.
- B7: preclassification candidate logic exists; exact PreclassificationRecord with interpretation_limit/non_diagnostic_signal_only is missing.

## Scope
MoC-only gap analysis for PF-SUP-03, PF-SUP-04, PF-SUP-05, B3/R9, B7, B3/B7 control and QA downstream. OLC is deferred.

## Method
Rector-first extraction was applied from the local DOCX, then repo materiality was searched using exact names, snake/camel/Pascal variants, English variants and likely technical aliases. Evidence was limited to files, symbols, schemas, fixtures, tests and docs.

## Rector source note
- rector_source: C:\Users\migue\Downloads\Minimal Business Architecture EVE\MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado.docx
- rector_source_type: full_docx_shared_read
- rector baseline: Arquitectura Minima de Negocio MMABP Empresa EVE - v1.1 B3/B7 alineado
- B3/B7 baseline: B3 puede producir evento operacional si receiver_feedback tiene ruta canonica; B7 solo transporta senal preclasificatoria no diagnostica.

## Query expansion MECE
Each class was searched by rector name, camelCase, snake_case, PascalCase English translation, probable abbreviations, and candidate folders in `src/`, `schemas/`, `fixtures/`, `tests/`, `docs/chips/` and `docs/audit/`. Groups were kept separate: PF-SUP-03, PF-SUP-04, PF-SUP-05, B3, B7, B3/B7 control and QA downstream.

## MoC MECE matrix
| # | Class | Group | Materiality | Evidence | Minimum materiality needed | Dependency |
|---|---|---|---|---|---|---|
| 01 | EvidenceBundle | PF-SUP-03 | tested | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs<br>tests/regression/mba-control-plane/mba-control-plane.test.mjs | Input contract requiring EvidenceBundle[ReadyForTransduction] with traceability refs. | pf_and_olc |
| 02 | ElementoMMABP | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs | First-class ElementoMMABP contract or service object. | pf_and_olc |
| 03 | HipotesisVSMPrimaria | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs | Non-final hypothesis contract with evidence and boundary fields. | pf |
| 04 | InconsistenciaMMABP | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs | Inconsistency object with rule id, severity, evidence refs and non-diagnostic limit. | pf_and_olc |
| 05 | NodoEVELocal | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs | Local node candidate contract separated from diagnosis/root cause. | pf |
| 06 | ActorFuncionalEVE | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs | Functional actor object separated from auth/user identity. | pf_and_olc |
| 07 | ActoObservable | PF-SUP-03 | absent |  | Observable act contract as atomic evidence unit. | pf |
| 08 | EscenaEvidencial | PF-SUP-03 | tested | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs<br>tests/regression/mba-control-plane/mba-control-plane.test.mjs | EscenaEvidencial builder with component refs and validation outcome. | pf_and_olc |
| 09 | TraduccionAHEMaterial | PF-SUP-03 | type_contract | src/services/mba/domain-state-registry.mjs<br>docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts | AHE material translation object with non-diagnostic interpretation limit. | pf |
| 10 | SceneSet | PF-SUP-04 | service_logic_partial | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs | SceneSet contract with scene_refs, count and eligibility result. | pf_and_olc |
| 11 | AggregationIndex | PF-SUP-04 | type_contract | src/services/mba/domain-state-registry.mjs | AggregationIndex object with actor/node/artifact/signal dimensions. | pf |
| 12 | PatronCausalMultirol | PF-SUP-04 | type_contract | src/services/mba/domain-state-registry.mjs | Multi-role pattern contract with evidence refs and non-diagnostic status. | pf |
| 13 | PeliculaCausalAgregada | PF-SUP-04 | tested | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs<br>tests/regression/mba-control-plane/mba-control-plane.test.mjs | Composer with scene_refs, pattern_refs and loss_refs. | pf_and_olc |
| 14 | SenalMonetizable | PF-SUP-04 | absent |  | Monetizable signal contract with source refs and non-final status. | pf |
| 15 | PerdidaMonetizable | PF-SUP-04 | type_contract | src/services/mba/domain-state-registry.mjs | Loss estimate object with assumptions and evidence refs. | pf |
| 16 | BloqueoAHEAgregado | PF-SUP-04 | absent |  | Aggregated AHE block object with boundary and traceability. | pf |
| 17 | SynthesisCase | PF-SUP-05 | absent |  | SynthesisCase contract before final diagnosis output. | pf_and_olc |
| 18 | NarrativaFinalCliente | PF-SUP-05 | type_contract | src/services/mba/domain-state-registry.mjs | NarrativaFinalCliente object with claim-level traceability. | pf |
| 19 | TeoremaInevitabilidad | PF-SUP-05 | type_contract | src/services/mba/domain-state-registry.mjs | Inevitability theorem object with evidence refs and review status. | pf |
| 20 | RecomendacionConsultiva | PF-SUP-05 | type_contract | src/services/mba/domain-state-registry.mjs | Recommendation object with rationale, limits and review status. | pf |
| 21 | DiagnosticoExpertoFinal | PF-SUP-05 | tested | src/services/mba/domain-state-registry.mjs<br>src/services/mba/nonconformance-rules.mjs<br>src/types/eve-organism-gate2-authority-guardrails.ts<br>tests/regression/eve-organism-gate2-authority-guardrails.test.ts | Delivery gate plus explicit authorization and review trail. | pf_and_olc |
| 22 | OutputHandoffRecord | B3 | fixture_only | schemas/common/enums-v2-1.json<br>fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json | OutputHandoffRecord contract with receiver_actor_ref and route/source refs. | pf |
| 23 | ReceiverFeedbackObject | B3 | service_logic_partial | fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json<br>fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json<br>docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts<br>src/services/eve-organism-gate2-signal-guardrails.ts | ReceiverFeedbackObject service/schema with feedback_type, route_ref, source_question_code and state. | pf_and_olc |
| 24 | OperationalExceptionEvidence | B3 | type_contract | src/services/eve-organism-gate2-signal-guardrails.ts<br>docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts | OperationalExceptionEvidence contract with accepted exception categories and release/reentry. | pf_and_olc |
| 25 | PreclassificationRecord | B7 | service_logic_partial | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts<br>src/app/api/scenes/runtime-contract-verify/route.ts<br>src/services/eve-organism-gate2-signal-guardrails.ts<br>tests/regression/eve-02-diagnostic-ontology-shadow-mode.test.ts | PreclassificationRecord with interpretation_limit=non_diagnostic_signal_only and prohibition assertions. | pf |
| 26 | B3B7AlignmentDelta | B3B7_CONTROL | type_contract | src/services/eve-organism-gate2-signal-guardrails.ts<br>docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json | Control artifact with b3_status, b7_status, findings and readiness_effect. | pf |
| 27 | ArchitectureConsistencyAssessment | QA_DOWNSTREAM | tested | src/services/mba/domain-state-registry.mjs<br>src/services/mba/adapters/parallel-production-observer.mjs<br>src/services/parallel-production/runtime/assessment-run.mjs<br>tests/regression/mba-control-plane/mba-control-plane.test.mjs | Keep as tested downstream dependency; split child concepts only if needed. | none |
| 28 | ArchitectureFindingSet | QA_DOWNSTREAM | service_logic_partial | src/services/mba/governance-finding-normalizer.mjs<br>tests/regression/mba-control-plane/mba-control-plane.test.mjs | ArchitectureFindingSet schema/contract with finding refs and routing status. | olc |
| 29 | ConformanceAssessment | QA_DOWNSTREAM | tested | schemas/parallel-production/conformance-report.schema.json<br>tests/regression/parallel-production/conformance-consistency-report.test.mjs<br>src/services/parallel-production/runtime/assessment-run.mjs | Keep conformance as distinct assessment report before consistency. | none |
| 30 | ConsistencyCheck | QA_DOWNSTREAM | service_logic_partial | src/services/consistency-checker.ts<br>src/services/scene-consistency-engine.ts<br>src/services/mba/domain-state-registry.mjs | ConsistencyCheck contract scoped to MMABP architecture. | olc |
| 31 | CompositeConsistencyAssessment | QA_DOWNSTREAM | documented_only | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.ts<br>docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.ts<br>src/services/mba/domain-state-registry.mjs | CompositeConsistencyAssessment object or report linked to ACA and findings. | olc |

## PF-SUP-03 analysis
### EvidenceBundle
- Materiality: tested.
- Rector definition: Bundle de evidencia listo para transduccion causal antes de PF-SUP-03.
- Rector operations: assemble; verify_traceability; mark_ready_for_transduction; request_rework.
- Expected relations: SceneCanonicalRecord -> EvidenceBundle; EvidenceBundle -> EscenaEvidencial.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs, tests/regression/mba-control-plane/mba-control-plane.test.mjs.
- Fusion risk: NC-09 guards EvidenceBundle/MDSB fusion; PF-SUP-03 consumption still absent.
- Minimum materiality: Input contract requiring EvidenceBundle[ReadyForTransduction] with traceability refs.

### ElementoMMABP
- Materiality: type_contract.
- Rector definition: Elemento conceptual MMABP extraido de evidencia para sostener escena causal.
- Rector operations: extract; attach_evidence_refs; classify_structural_role.
- Expected relations: EvidenceBundle -> ElementoMMABP; ElementoMMABP -> EscenaEvidencial.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be collapsed into generic state without first-class concept.
- Minimum materiality: First-class ElementoMMABP contract or service object.

### HipotesisVSMPrimaria
- Materiality: type_contract.
- Rector definition: Hipotesis primaria VSM, no cerrada, formulada desde elementos e inconsistencias.
- Rector operations: formulate_candidate; retain_non_final_confidence.
- Expected relations: ElementoMMABP -> HipotesisVSMPrimaria; HipotesisVSMPrimaria -> EscenaEvidencial.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: May be treated as closed VSM diagnosis.
- Minimum materiality: Non-final hypothesis contract with evidence and boundary fields.

### InconsistenciaMMABP
- Materiality: type_contract.
- Rector definition: Inconsistencia MMABP detectada dentro de la escena evidencial.
- Rector operations: detect; validate; explain_rule_id.
- Expected relations: ElementoMMABP -> InconsistenciaMMABP; InconsistenciaMMABP -> TraduccionAHEMaterial.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs.
- Fusion risk: Can be confused with final diagnostic finding.
- Minimum materiality: Inconsistency object with rule id, severity, evidence refs and non-diagnostic limit.

### NodoEVELocal
- Materiality: type_contract.
- Rector definition: Nodo EVE local manifestado por rol funcional, no root cause final.
- Rector operations: manifest_local_node; bind_actor; preserve_locality.
- Expected relations: ActorFuncionalEVE -> NodoEVELocal; NodoEVELocal -> EscenaEvidencial.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs.
- Fusion risk: Can become closed diagnosis/root cause.
- Minimum materiality: Local node candidate contract separated from diagnosis/root cause.

### ActorFuncionalEVE
- Materiality: type_contract.
- Rector definition: Actor funcional situado que ejecuta o recibe efectos en la escena evidencial.
- Rector operations: situate_actor; bind_acts; trace_functional_role.
- Expected relations: ActorFuncionalEVE -> ActoObservable; ActorFuncionalEVE -> NodoEVELocal.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: May be fused with user identity.
- Minimum materiality: Functional actor object separated from auth/user identity.

### ActoObservable
- Materiality: absent.
- Rector definition: Acto observable que soporta causalidad local desde evidencia.
- Rector operations: capture_observable_act; attach_evidence; support_scene_construction.
- Expected relations: EvidenceBundle -> ActoObservable; ActoObservable -> EscenaEvidencial.
- Evidence: absence reasoned by search.
- Fusion risk: Scene may be built from summary instead of atomic evidence.
- Minimum materiality: Observable act contract as atomic evidence unit.

### EscenaEvidencial
- Materiality: tested.
- Rector definition: Escena causal local validada por rol funcional.
- Rector operations: construct; situate_AHE; validate; block_if_insufficient.
- Expected relations: EvidenceBundle -> EscenaEvidencial; EscenaEvidencial -> SceneSet.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs, tests/regression/mba-control-plane/mba-control-plane.test.mjs.
- Fusion risk: NC-08 guards related scene fusion; SCR/Escena separation still needs watch.
- Minimum materiality: EscenaEvidencial builder with component refs and validation outcome.

### TraduccionAHEMaterial
- Materiality: type_contract.
- Rector definition: Traduccion material AHE situada, no psicologica ni diagnostica.
- Rector operations: situate_material_AHE; enforce_non_diagnostic_boundary.
- Expected relations: InconsistenciaMMABP -> TraduccionAHEMaterial; TraduccionAHEMaterial -> EscenaEvidencial.
- Evidence: src/services/mba/domain-state-registry.mjs, docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts.
- Fusion risk: AHE signal can be psychologized or treated as final culture diagnosis.
- Minimum materiality: AHE material translation object with non-diagnostic interpretation limit.

## PF-SUP-04 analysis
### SceneSet
- Materiality: service_logic_partial.
- Rector definition: Conjunto 2..* de escenas evidenciales elegibles para agregacion.
- Rector operations: build_eligible_set; enforce_2_plus_scenes; preserve_scene_refs.
- Expected relations: EscenaEvidencial 2..* -> SceneSet; SceneSet -> AggregationIndex.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs.
- Fusion risk: Can be reduced to count guard without first-class set.
- Minimum materiality: SceneSet contract with scene_refs, count and eligibility result.

### AggregationIndex
- Materiality: type_contract.
- Rector definition: Indice de agregacion por actor, nodo, artefacto y senal.
- Rector operations: build_index; group_scenes; support_pattern_detection.
- Expected relations: SceneSet -> AggregationIndex; AggregationIndex -> PatronCausalMultirol.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: May be fused with generic causal aggregation engine.
- Minimum materiality: AggregationIndex object with actor/node/artifact/signal dimensions.

### PatronCausalMultirol
- Materiality: type_contract.
- Rector definition: Patron causal que cruza multiples roles desde escenas validadas.
- Rector operations: detect_pattern; preserve_multi_role_trace.
- Expected relations: AggregationIndex -> PatronCausalMultirol; PatronCausalMultirol -> PeliculaCausalAgregada.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be confused with final diagnosis/root cause.
- Minimum materiality: Multi-role pattern contract with evidence refs and non-diagnostic status.

### PeliculaCausalAgregada
- Materiality: tested.
- Rector definition: Pelicula causal agregada de empresa, compuesta desde escenas validadas.
- Rector operations: compose; validate_traceability; aggregate.
- Expected relations: SceneSet -> PeliculaCausalAgregada; PeliculaCausalAgregada -> SynthesisCase.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs, tests/regression/mba-control-plane/mba-control-plane.test.mjs.
- Fusion risk: Can be misread as DiagnosticoExpertoFinal; NC-01 separates delivery.
- Minimum materiality: Composer with scene_refs, pattern_refs and loss_refs.

### SenalMonetizable
- Materiality: absent.
- Rector definition: Senal trazada que puede alimentar estimacion monetizable, sin ser perdida final.
- Rector operations: identify_signal; trace_source; qualify_potential.
- Expected relations: PatronCausalMultirol -> SenalMonetizable; SenalMonetizable -> PerdidaMonetizable.
- Evidence: absence reasoned by search.
- Fusion risk: May be fused with monetization decision.
- Minimum materiality: Monetizable signal contract with source refs and non-final status.

### PerdidaMonetizable
- Materiality: type_contract.
- Rector definition: Estimacion de perdida monetizable derivada de patron/senal, no monetizacion final.
- Rector operations: estimate; trace_assumptions; link_pattern.
- Expected relations: SenalMonetizable -> PerdidaMonetizable; PerdidaMonetizable -> PeliculaCausalAgregada.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be promoted to monetization decision too early.
- Minimum materiality: Loss estimate object with assumptions and evidence refs.

### BloqueoAHEAgregado
- Materiality: absent.
- Rector definition: Bloqueo AHE agregado visible a nivel empresa, no rasgo psicologico final.
- Rector operations: aggregate_AHE_block; link_scenes; preserve_non_diagnostic_limit.
- Expected relations: EscenaEvidencial -> BloqueoAHEAgregado; BloqueoAHEAgregado -> PeliculaCausalAgregada.
- Evidence: absence reasoned by search.
- Fusion risk: Risk of culture/psychological diagnosis.
- Minimum materiality: Aggregated AHE block object with boundary and traceability.

## PF-SUP-05 analysis
### SynthesisCase
- Materiality: absent.
- Rector definition: Caso de sintesis que organiza pelicula, trazabilidad y piezas expertas.
- Rector operations: create_case; check_traceability; prepare_synthesis.
- Expected relations: PeliculaCausalAgregada -> SynthesisCase; SynthesisCase -> narrative/theorem/recommendation.
- Evidence: absence reasoned by search.
- Fusion risk: Can be fused with DiagnosticoExpertoFinal.
- Minimum materiality: SynthesisCase contract before final diagnosis output.

### NarrativaFinalCliente
- Materiality: type_contract.
- Rector definition: Narrativa final para cliente, derivada de pelicula y trazabilidad experta.
- Rector operations: draft_narrative; trace_claims; review.
- Expected relations: SynthesisCase -> NarrativaFinalCliente; NarrativaFinalCliente -> DiagnosticoExpertoFinal.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be mistaken for final diagnosis without review.
- Minimum materiality: NarrativaFinalCliente object with claim-level traceability.

### TeoremaInevitabilidad
- Materiality: type_contract.
- Rector definition: Teorema experto que explica inevitabilidad causal desde la pelicula.
- Rector operations: formulate_theorem; trace_evidence; review.
- Expected relations: SynthesisCase -> TeoremaInevitabilidad; TeoremaInevitabilidad -> DiagnosticoExpertoFinal.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be presented as diagnosis without expert review.
- Minimum materiality: Inevitability theorem object with evidence refs and review status.

### RecomendacionConsultiva
- Materiality: type_contract.
- Rector definition: Recomendacion consultiva derivada, no accion automatica productiva.
- Rector operations: draft_recommendation; trace_rationale; review.
- Expected relations: SynthesisCase -> RecomendacionConsultiva; RecomendacionConsultiva -> DiagnosticoExpertoFinal.
- Evidence: src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can become automated action or production decision.
- Minimum materiality: Recommendation object with rationale, limits and review status.

### DiagnosticoExpertoFinal
- Materiality: tested.
- Rector definition: Diagnostico experto final entregado, autorizado y revisado.
- Rector operations: verify_traceability; expert_review; approve; deliver.
- Expected relations: SynthesisCase -> DiagnosticoExpertoFinal; DiagnosticoExpertoFinal -> ClientEngagement.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/nonconformance-rules.mjs, src/types/eve-organism-gate2-authority-guardrails.ts, tests/regression/eve-organism-gate2-authority-guardrails.test.ts.
- Fusion risk: Must not be fused with preclassification or SynthesisCase.
- Minimum materiality: Delivery gate plus explicit authorization and review trail.

## B3 analysis
### OutputHandoffRecord
- Materiality: fixture_only.
- Rector definition: Registro de entrega de output a receptor que puede originar feedback operativo.
- Rector operations: record_handoff; bind_receiver; support_feedback_route.
- Expected relations: OutputHandoffRecord -> ReceiverFeedbackObject; OutputHandoffRecord -> EvidenceBundle.
- Evidence: schemas/common/enums-v2-1.json, fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json.
- Fusion risk: May be collapsed into receiver satisfaction or generic response.
- Minimum materiality: OutputHandoffRecord contract with receiver_actor_ref and route/source refs.

### ReceiverFeedbackObject
- Materiality: service_logic_partial.
- Rector definition: Objeto de feedback operativo del receptor, distinto de satisfaccion, con ruta canonica.
- Rector operations: capture_feedback; validate_route_ref; classify_operational_event.
- Expected relations: OutputHandoffRecord -> ReceiverFeedbackObject; ReceiverFeedbackObject -> OperationalExceptionEvidence.
- Evidence: fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json, fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json, docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts, src/services/eve-organism-gate2-signal-guardrails.ts.
- Fusion risk: Guard separates satisfaction, but no first-class object.
- Minimum materiality: ReceiverFeedbackObject service/schema with feedback_type, route_ref, source_question_code and state.

### OperationalExceptionEvidence
- Materiality: type_contract.
- Rector definition: Evidencia de excepcion operacional: rechazo, retorno, correccion, bloqueo, escalamiento o rework.
- Rector operations: derive_exception_evidence; validate_source_ref; trigger_rework_or_block.
- Expected relations: ReceiverFeedbackObject -> OperationalExceptionEvidence; OperationalExceptionEvidence -> PF rework event.
- Evidence: src/services/eve-organism-gate2-signal-guardrails.ts, docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts.
- Fusion risk: May be represented as generic feedback with no exception semantics.
- Minimum materiality: OperationalExceptionEvidence contract with accepted exception categories and release/reentry.

## B7 analysis
### PreclassificationRecord
- Materiality: service_logic_partial.
- Rector definition: Registro de preclasificacion no diagnostica; senal, no hecho estructural.
- Rector operations: record_signal; enforce_interpretation_limit; block_downstream_promotion.
- Expected relations: PreclassificationRecord -> EscenaEvidencial as signal only; PreclassificationRecord !-> diagnosis/IR/registry/export.
- Evidence: docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts, src/app/api/scenes/runtime-contract-verify/route.ts, src/services/eve-organism-gate2-signal-guardrails.ts, tests/regression/eve-02-diagnostic-ontology-shadow-mode.test.ts.
- Fusion risk: Candidate logic exists, but exact PreclassificationRecord with interpretation_limit/non_diagnostic_signal_only is absent.
- Minimum materiality: PreclassificationRecord with interpretation_limit=non_diagnostic_signal_only and prohibition assertions.

## B3B7_CONTROL analysis
### B3B7AlignmentDelta
- Materiality: type_contract.
- Rector definition: Delta tecnico de control para revisar alineacion B3/B7, no hecho cliente.
- Rector operations: check_B3_route; check_B7_boundary; emit_delta.
- Expected relations: B3/B7 signals -> B3B7AlignmentDelta; B3B7AlignmentDelta -> ACA/readiness control.
- Evidence: src/services/eve-organism-gate2-signal-guardrails.ts, docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json.
- Fusion risk: Could be treated as business fact instead of technical control.
- Minimum materiality: Control artifact with b3_status, b7_status, findings and readiness_effect.

## QA_DOWNSTREAM analysis
### ArchitectureConsistencyAssessment
- Materiality: tested.
- Rector definition: Evaluacion de conformance, consistency y composite assessment antes de export/diagnosis.
- Rector operations: evaluate_conformance; evaluate_consistency; evaluate_composite; classify_findings.
- Expected relations: ArchitectureFindingSet -> ArchitectureConsistencyAssessment; Assessment -> export/registry gate.
- Evidence: src/services/mba/domain-state-registry.mjs, src/services/mba/adapters/parallel-production-observer.mjs, src/services/parallel-production/runtime/assessment-run.mjs, tests/regression/mba-control-plane/mba-control-plane.test.mjs.
- Fusion risk: P-SUP-07/08 are combined; separate QA classes may be obscured.
- Minimum materiality: Keep as tested downstream dependency; split child concepts only if needed.

### ArchitectureFindingSet
- Materiality: service_logic_partial.
- Rector definition: Set de findings arquitectonicos producido por evaluaciones, no diagnostico final.
- Rector operations: collect_findings; classify_severity; route_rework.
- Expected relations: ArchitectureFindingSet -> ArchitectureConsistencyAssessment; FindingSet -> P-SUP-06 rework.
- Evidence: src/services/mba/governance-finding-normalizer.mjs, tests/regression/mba-control-plane/mba-control-plane.test.mjs.
- Fusion risk: May be fused with final diagnosis or client narrative.
- Minimum materiality: ArchitectureFindingSet schema/contract with finding refs and routing status.

### ConformanceAssessment
- Materiality: tested.
- Rector definition: Evaluacion de conformidad de modelos contra reglas MMABP antes de consistency.
- Rector operations: evaluate_conformance; emit_report; block_consistency_if_failed.
- Expected relations: ConformanceAssessment -> ArchitectureConsistencyAssessment; Conformance report precedes consistency.
- Evidence: schemas/parallel-production/conformance-report.schema.json, tests/regression/parallel-production/conformance-consistency-report.test.mjs, src/services/parallel-production/runtime/assessment-run.mjs.
- Fusion risk: Can be fused into composite assessment and lose ordering.
- Minimum materiality: Keep conformance as distinct assessment report before consistency.

### ConsistencyCheck
- Materiality: service_logic_partial.
- Rector definition: Chequeo de consistencia factual/temporal/estructural de modelos.
- Rector operations: run_consistency_check; return_findings; block_or_reentry.
- Expected relations: ConsistencyCheck -> ArchitectureConsistencyAssessment; ConsistencyCheck -> ArchitectureFindingSet.
- Evidence: src/services/consistency-checker.ts, src/services/scene-consistency-engine.ts, src/services/mba/domain-state-registry.mjs.
- Fusion risk: Can be confused with conformance or scene micro-consistency only.
- Minimum materiality: ConsistencyCheck contract scoped to MMABP architecture.

### CompositeConsistencyAssessment
- Materiality: documented_only.
- Rector definition: Evaluacion compuesta PM-MoC-PF-OLC, downstream only en este tramo.
- Rector operations: evaluate_composite_consistency; classify_contradictions; gate_satisfied_or_with_findings.
- Expected relations: CompositeConsistencyAssessment -> ArchitectureConsistencyAssessment; Composite -> readiness/export gate.
- Evidence: docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.ts, docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.ts, src/services/mba/domain-state-registry.mjs.
- Fusion risk: May remain chip/document vocabulary without repo service object.
- Minimum materiality: CompositeConsistencyAssessment object or report linked to ACA and findings.

## Ontological contamination
- MOC-CONT-001 (guarded_partial) EvidenceBundle vs MDSB: NC-09 detects fusion; PF-SUP-03 consumption still absent. Evidence: src/services/mba/nonconformance-rules.mjs.
- MOC-CONT-002 (guarded_partial) SceneCanonicalRecord vs EscenaEvidencial: Objects are separate in registry; constructor-level boundary not proven. Evidence: src/services/mba/domain-state-registry.mjs.
- MOC-CONT-003 (guarded_partial) receiver_satisfaction vs receiver_feedback: Boundary exists; ReceiverFeedbackObject missing. Evidence: src/services/eve-organism-gate2-signal-guardrails.ts.
- MOC-CONT-004 (risk_open) PreclassificationRecord vs diagnosis: Candidate guard exists; exact record and interpretation_limit absent. Evidence: docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts.
- MOC-CONT-005 (guarded_partial) PeliculaCausalAgregada vs DiagnosticoExpertoFinal: NC-01 guards final diagnosis without aggregated movie. Evidence: src/services/mba/nonconformance-rules.mjs.
- MOC-CONT-006 (risk_open) SynthesisCase vs DiagnosticoExpertoFinal: SynthesisCase is absent. Evidence: absence reasoned by search.
- MOC-CONT-007 (risk_open) ElementoMMABP vs StructuralFact final: Only state vocabulary exists. Evidence: src/services/mba/domain-state-registry.mjs.
- MOC-CONT-008 (risk_open) NodoEVELocal vs closed diagnosis/root cause: NC-10 guards Capa 1, but local node object is absent. Evidence: src/services/mba/nonconformance-rules.mjs.
- MOC-CONT-009 (risk_open) AHE signal vs psychological/culture diagnosis: Boundary exists as diagnostic/preclassification guard, not as TraduccionAHEMaterial object. Evidence: docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts.

## Minimum materiality recommended
1. Create a MoC patch design before OLC or PF execution for absent/high-risk classes: ActoObservable, SynthesisCase, SenalMonetizable, BloqueoAHEAgregado, ReceiverFeedbackObject, OperationalExceptionEvidence and PreclassificationRecord.
2. Promote type-contract state vocabulary into conceptual contracts only where PF-SUP-03/04/05 need relations and multiplicities.
3. Keep B3 and B7 separated: B3 can become operational event only with route/source trace; B7 remains signal-only and non-diagnostic.
4. Preserve QA downstream as dependency, not as proof that PF-SUP-03/04/05 MoC is implemented.

## Dictamen
MOC_GAP_ANALYSIS_FOR_PF_SUP_03_04_05_B3_B7_COMPLETED

## Next step
OLC_GAP_ANALYSIS_FOR_PF_SUP_03_04_05_B3_B7_V1
