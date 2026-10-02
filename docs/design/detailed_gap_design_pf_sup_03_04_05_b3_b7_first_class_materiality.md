# DETAILED GAP DESIGN — PF-SUP-03/04/05 AND B3/B7 FIRST-CLASS MATERIALITY

## 1. Dictamen ejecutivo

DICTAMEN: DETAILED_GAP_DESIGN_PF_SUP_03_04_05_AND_B3_B7_FIRST_CLASS_MATERIALITY_COMPLETED.

El tramo queda cerrado como diseño documental mínimo de brechas. La repo muestra vocabulario, guardrails y marcadores parciales para PF-SUP-03, PF-SUP-04, PF-SUP-05, B3 y B7, pero no muestra materialidad verificable de primera clase para los objetos y servicios rectores requeridos.

La decisión técnica del diseño es mover cada familia hacia L4 contract_defined, sin implementar servicios, sin crear schemas ejecutables, sin modificar tests, sin abrir Runtime 40/20 completo y sin producir diagnóstico/export/registry.

## 2. Frontera del tramo

Permitido en este tramo:

- Revisar evidencia local visible en repo.
- Diseñar brechas mínimas de cierre.
- Proponer servicios, contratos, marcadores y tests como diseño.
- Declarar dependencias MoC, OLC y PF.
- Mantener Runtime 40/20 completo fuera de ejecución.

Prohibido en este tramo:

- Implementar código.
- Crear endpoints.
- Crear migraciones o SQL.
- Leer `.env` o secretos.
- Conectar DB, Supabase o infraestructura real.
- Ejecutar runtime completo.
- Crear registry/export/diagnosis.
- Declarar cierre real de materialidad probada.

## 3. Árbol maestro usado como base

Ramas usadas:

- Rector maestro / MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado.
- Capa 1.0 / OperationalExceptionEvidence.
- Capa 1.0 / EvidenceBundle.
- Producción Paralela / ArchitectureConsistencyAssessment.
- Runtime 40/20.
- Fases 1-8 Runtime / F5 Object Inventory / Runtime Object Binding Service F5C.
- Sistema Regulatorio Implementado / Soft Governance & Security Control.
- Baseline de materialidad actual repo vs rector.

## 4. Baseline repo vs rector

La repo contiene señales suficientes para confirmar visibilidad parcial:

- `src/services/mba/domain-state-registry.mjs` contiene vocabulario de estados para objetos PF.
- `src/services/mba/nonconformance-rules.mjs` contiene reglas de no conformidad y guardrails.
- `tests/regression/mba-control-plane/mba-control-plane.test.mjs` cubre parte de control plane.
- `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json` y `fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json` contienen señales B3.
- `src/services/eve-organism-gate2-signal-guardrails.ts` contiene restricciones B3/B7.
- `docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts` contiene límites de ontología diagnóstica.

La brecha común es que la presencia de vocabulario o guardrail no equivale a objeto dueño, contrato, state machine, servicio materializador, prueba específica y marker verificable.

## 5. Brecha PF ejecutable — P-SUP-03

Materialidad actual: L2 vocabulary_only.

Materialidad requerida: L4 contract_defined.

Objeto rector afectado: EscenaEvidencial.

Objetos asociados:

- EvidenceBundle.
- ActoObservable.
- ElementoMMABP.
- HipotesisVSMPrimaria.
- InconsistenciaMMABP.
- NodoEVELocal.
- ActorFuncionalEVE.
- TraduccionAHEMaterial.

Diseño mínimo requerido:

- Servicio documental: `services/eve/transduction/evidential-scene-runner`.
- Contratos: `pf_sup_03_escena_evidencial_contract` y `pf_sup_03_acto_observable_contract`.
- Test documental: `tests/pf-sup-03/evidential-scene-runner.test`.
- Marker: `PF_SUP_03_MATERIALITY_MARKER`.

State machine mínimo:

- Constructing.
- WithMMABPElements.
- WithVSMHypothesis.
- WithMMABPInconsistency.
- WithEVEManifestation.
- AHESituated.
- Validated.
- BlockedByInsufficientCausality.

Ruta de rework:

- Insufficient causality -> GovernanceIssue -> EvidenceBundle rework.

Guardia de frontera:

- B7 puede permanecer como señal no diagnóstica.
- PF-SUP-03 no puede emitir diagnóstico final, export o registry.

## 6. Brecha PF ejecutable — P-SUP-04

Materialidad actual: L3 guardrail_only.

Materialidad requerida: L4 contract_defined.

Objeto rector afectado: PeliculaCausalAgregada.

Objetos asociados:

- SceneSet.
- AggregationIndex.
- PatronCausalMultirol.
- SenalMonetizable.
- PerdidaMonetizable.
- BloqueoAHEAgregado.

Diseño mínimo requerido:

- Servicio documental: `services/eve/aggregation/causal-movie-aggregation-runner`.
- Contratos: `pf_sup_04_scene_set_contract`, `pf_sup_04_aggregation_index_contract`, `pf_sup_04_pelicula_causal_agregada_contract`.
- Test documental: `tests/pf-sup-04/causal-movie-aggregation-runner.test`.
- Marker: `PF_SUP_04_MATERIALITY_MARKER`.

State machine mínimo:

- ScenesReceived.
- AggregationEligible.
- IndexBuilt.
- PatternIdentified.
- LossEstimated.
- Composed.
- Aggregated.
- BlockedByInsufficientScenes.

Ruta de rework:

- Insufficient scenes -> GovernanceIssue -> PF-SUP-03.

Guardia de frontera:

- No diagnóstico final.
- No narrativa cliente.
- Señal monetizable permanece como candidato, no salida final.

## 7. Brecha PF ejecutable — P-SUP-05

Materialidad actual: L3 guardrail_only.

Materialidad requerida: L4 contract_defined.

Objeto rector afectado: SynthesisCase.

Objetos asociados:

- NarrativaFinalCliente.
- TeoremaInevitabilidad.
- RecomendacionConsultiva.
- DiagnosticoExpertoFinal.

Diseño mínimo requerido:

- Servicio documental: `services/eve/synthesis/expert-synthesis-contract-service`.
- Contratos: `pf_sup_05_synthesis_case_contract` y `delivery_boundary_contract`.
- Test documental: `tests/pf-sup-05/expert-synthesis-contract.test`.
- Marker: `PF_SUP_05_MATERIALITY_MARKER`.

State machine mínimo:

- Creating.
- TraceabilityChecked.
- ReadyForExpertDraft.
- BlockedByWeakTraceability.
- AuthorizationBlocked.

Ruta de rework:

- Weak traceability -> GovernanceIssue -> PF-SUP-04 recomposition.

Guardia de frontera:

- Delivered queda bloqueado.
- No se genera narrativa final de cliente.
- No se genera recomendación consultiva final.
- No se emite ExportCodePackage.

## 8. Brecha B3 first-class materiality

Materialidad actual: L3 guardrail_only.

Materialidad requerida: L4 contract_defined.

Objeto rector afectado: ReceiverFeedbackObject.

Objetos asociados:

- OutputHandoffRecord.
- OperationalExceptionEvidence.
- CanonicalRouteException.
- GapObject.
- FlowNormalizationRecord.
- B3B7AlignmentDelta.

Diseño mínimo requerido:

- Servicio documental: `services/eve/capa1/b3-receiver-feedback-materializer`.
- Servicio de control: `services/eve/capa1/b3-b7-alignment-delta-service`.
- Contratos: `b3_receiver_feedback_object_contract`, `b3_operational_exception_evidence_contract`, `b3_b7_alignment_delta_contract`.
- Test documental: `tests/b3/receiver-feedback-materializer.test`.
- Marker: `B3_FIRST_CLASS_MATERIALITY_MARKER`.

State machine mínimo:

- Captured.
- RouteValidated.
- OperationallyRelevant.
- RejectedAsSatisfactionOnly.
- GapFlagged.
- ReworkTriggered.

Ruta de rework:

- route_missing -> CanonicalRouteException.
- delivery failure unknown -> GapObject.

Guardia de frontera:

- `receiver_satisfaction` no puede tratarse como `receiver_feedback`.
- B3 no puede emitir diagnóstico.

## 9. Brecha B7 first-class materiality

Materialidad actual: L3 guardrail_only.

Materialidad requerida: L4 contract_defined.

Objeto rector afectado: PreclassificationRecord.

Objetos asociados:

- TransductionBlocker.
- GovernanceIssue.
- ExportBlocker.
- B3B7AlignmentDelta.
- no_render_zone.

Diseño mínimo requerido:

- Servicio documental: `services/eve/capa1/b7-preclassification-boundary-service`.
- Servicio de control: `services/eve/capa1/b3-b7-alignment-delta-service`.
- Contratos: `b7_preclassification_record_contract`, `b3_b7_alignment_delta_contract`, `no_render_zone_contract`.
- Test documental: `tests/b7/preclassification-boundary-service.test`.
- Marker: `B7_FIRST_CLASS_MATERIALITY_MARKER`.

State machine mínimo:

- Captured.
- BoundaryChecked.
- SignalOnlyAccepted.
- Rejected.
- ContaminationBlocked.

Ruta de rework:

- Contamination attempt -> GovernanceIssue/TransductionBlocker.

Guardia de frontera:

- B7 no crea structural fact.
- B7 no escribe registry.
- B7 no crea IR node/edge.
- B7 no exporta.
- B7 no diagnostica.
- B7 no crea OperationalExceptionEvidence.

## 10. Servicios mínimos requeridos

Servicios documentales requeridos, sin implementación en este tramo:

- `services/eve/transduction/evidential-scene-runner`.
- `services/eve/aggregation/causal-movie-aggregation-runner`.
- `services/eve/synthesis/expert-synthesis-contract-service`.
- `services/eve/capa1/b3-receiver-feedback-materializer`.
- `services/eve/capa1/b7-preclassification-boundary-service`.
- `services/eve/capa1/b3-b7-alignment-delta-service`.
- `services/eve/materiality/materiality-marker-evaluator`.

Cada servicio debe nacer con inputs explícitos, outputs permitidos, outputs bloqueados, referencias de fuente, referencias de derivación, vínculo a GovernanceIssue y prueba mínima asociada.

## 11. Schemas / contracts mínimos requeridos

Contratos mínimos:

- `pf_sup_03_escena_evidencial_contract`.
- `pf_sup_03_acto_observable_contract`.
- `pf_sup_04_scene_set_contract`.
- `pf_sup_04_aggregation_index_contract`.
- `pf_sup_04_pelicula_causal_agregada_contract`.
- `pf_sup_05_synthesis_case_contract`.
- `b3_receiver_feedback_object_contract`.
- `b3_operational_exception_evidence_contract`.
- `b7_preclassification_record_contract`.
- `b3_b7_alignment_delta_contract`.
- `no_render_zone_contract`.
- `delivery_boundary_contract`.

Campos transversales obligatorios:

- source_ref.
- derivation_ref.
- readiness_decision_ref.
- governance_issue_refs.
- audit_log.
- state.
- allowed_consumers.
- forbidden_consumers.

## 12. Tests mínimos requeridos

Tests documentales requeridos:

- `tests/pf-sup-03/evidential-scene-runner.test`.
- `tests/pf-sup-04/causal-movie-aggregation-runner.test`.
- `tests/pf-sup-05/expert-synthesis-contract.test`.
- `tests/b3/receiver-feedback-materializer.test`.
- `tests/b7/preclassification-boundary-service.test`.

Cobertura mínima:

- Rechazo de inputs no listos.
- Creación solo con trazabilidad.
- State machine válido.
- Rework por GovernanceIssue.
- Consumidores permitidos y bloqueados.
- Prohibición de diagnóstico/export/registry.
- Preservación de B7 como señal no diagnóstica.
- Separación estricta entre receiver_satisfaction y receiver_feedback.

## 13. Materiality markers

Markers requeridos:

- `PF_SUP_03_MATERIALITY_MARKER`.
- `PF_SUP_04_MATERIALITY_MARKER`.
- `PF_SUP_05_MATERIALITY_MARKER`.
- `B3_FIRST_CLASS_MATERIALITY_MARKER`.
- `B7_FIRST_CLASS_MATERIALITY_MARKER`.

Cada marker debe evaluar:

- Servicio dueño presente.
- Contrato presente.
- State machine explícito.
- Tests mínimos presentes.
- source_ref requerido.
- derivation_ref requerido.
- governance_issue_refs requerido.
- readiness_decision_ref requerido.
- consumidores permitidos.
- salidas prohibidas.
- nivel de materialidad resultante.

## 14. No-Go y fronteras

No-Go no activado.

Fronteras preservadas:

- No se leyó `.env`.
- No se expusieron secretos.
- No se conectó DB.
- No se conectó Supabase.
- No se ejecutó runtime completo.
- No se crearon migraciones.
- No se modificó SQL.
- No se creó registry/export/diagnosis.
- No se implementó código.
- No se crearon tests ejecutables.

## 15. Dependencias MoC / OLC / PF

Las cinco familias dependen de MoC, OLC y PF:

- MoC aporta evidencia de cambio material de objeto/estado.
- OLC aporta frontera de ciclo operativo, recepción, excepción, handoff y rework.
- PF aporta transducción, agregación y síntesis contractualmente gobernadas.

Sin estas tres dependencias, el cierre puede quedar como vocabulario o guardrail, pero no como materialidad verificable.

## 16. Decisión sobre Runtime 40/20 completo

Runtime 40/20 completo no queda autorizado.

La única decisión permitida es diseñar cómo debería consumir evidencia cuando exista materialidad L4 o superior. No se declara ejecución, no se abren rutas completas y no se promueve salida final.

## 17. Definition of Done documental

Este diseño queda documentalmente completo cuando existen:

- Gap matrix por familia.
- Servicio mínimo requerido por familia.
- Contrato mínimo requerido por objeto rector.
- Test mínimo requerido por familia.
- Marker de materialidad por familia.
- Guardia de no diagnóstico/export/registry.
- Dependencias MoC/OLC/PF explícitas.
- JSON trazable.
- Findings priorizados.

No equivale a implementación completa ni a materialidad probada.

## 18. Hallazgos y gaps priorizados

Resumen:

- Critical findings: 0.
- High findings: 7.
- Medium findings: 5.
- Low findings: 2.
- Info findings: 2.

Gaps principales:

- PF-SUP-03 requiere runner y contratos de escena evidencial/acto observable.
- PF-SUP-04 requiere agregación causal como objeto y no solo guardrail.
- PF-SUP-05 requiere frontera SynthesisCase con Delivered bloqueado.
- B3 requiere ReceiverFeedbackObject separado de satisfacción.
- B7 requiere PreclassificationRecord y no_render_zone como frontera material.

## 19. JSON traceability summary

Archivo trazable asociado:

- `docs/design/detailed_gap_design_pf_sup_03_04_05_b3_b7_first_class_materiality.json`.

Incluye:

- audit_id.
- frontera de implementación.
- familias de gap.
- gap_matrix.
- materiality_markers.
- service_designs.
- schema_contract_designs.
- test_designs.
- findings_summary.
- final_dictum.
- next_authorization_required.

## 19.1 Complecion solicitada del Gap Design

Esta actualizacion completa el diseno sin implementar nada. Los grupos A-E quedan tratados como conjuntos MECE:

- Grupo A: PF-SUP-03, transduccion y escena evidencial.
- Grupo B: PF-SUP-04, agregacion causal.
- Grupo C: PF-SUP-05, sintesis experta y frontera de entrega.
- Grupo D: B3, feedback de receptor y excepcion operacional.
- Grupo E: B7, preclasificacion signal-only y no_render_zone.

Runtime 40/20 y Sistema Regulatorio quedan corregidos como dependencia/frontera. No son duenos de objetos PF-SUP-04, PF-SUP-05 ni B7.

### 19.1.1 Matriz obligatoria completa por brecha

| Gap | Familia | Objeto afectado | Ubicacion corregida en Arbol maestro | Materialidad actual | Target | Servicio faltante | Contrato/schema faltante | Test faltante | Marker faltante | Guardia faltante | Dependencia/frontera corregida |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-PF03-001 | PF_SUP_03 | EscenaEvidencial | Capa 1.0 / EvidenceBundle + Baseline de materialidad actual repo vs rector | L2 vocabulary_only | L4 contract_defined | services/eve/transduction/evidential-scene-runner | pf_sup_03_escena_evidencial_contract | tests/pf-sup-03/evidential-scene-runner.test | PF_SUP_03_MATERIALITY_MARKER | B7 non-diagnostic inside transduction | MoC/OLC/PF dependency as declared |
| GAP-PF04-001 | PF_SUP_04 | PeliculaCausalAgregada | PF-SUP-04 / causal aggregation object ownership | L3 guardrail_only | L4 contract_defined | services/eve/aggregation/causal-movie-aggregation-runner | pf_sup_04_scene_set_contract, pf_sup_04_aggregation_index_contract, pf_sup_04_pelicula_causal_agregada_contract | tests/pf-sup-04/causal-movie-aggregation-runner.test | PF_SUP_04_MATERIALITY_MARKER | no final diagnosis; monetizable signal remains candidate | downstream dependency only; not object owner |
| GAP-PF05-001 | PF_SUP_05 | SynthesisCase | PF-SUP-05 / synthesis contract and delivery boundary ownership | L3 guardrail_only | L4 contract_defined | services/eve/synthesis/expert-synthesis-contract-service | pf_sup_05_synthesis_case_contract, delivery_boundary_contract | tests/pf-sup-05/expert-synthesis-contract.test | PF_SUP_05_MATERIALITY_MARKER | Delivered blocked; no client narrative/recommendation generation | authorization/security boundary only; not object owner |
| GAP-B3-001 | B3 | ReceiverFeedbackObject | Capa 1.0 / OperationalExceptionEvidence | L3 guardrail_only | L4 contract_defined | services/eve/capa1/b3-receiver-feedback-materializer | b3_receiver_feedback_object_contract, b3_operational_exception_evidence_contract | tests/b3/receiver-feedback-materializer.test | B3_FIRST_CLASS_MATERIALITY_MARKER | receiver_satisfaction rejected as feedback | MoC/OLC/PF dependency as declared |
| GAP-B7-001 | B7 | PreclassificationRecord | Capa 1.0 / B7 preclassification boundary object ownership | L3 guardrail_only | L4 contract_defined | services/eve/capa1/b7-preclassification-boundary-service | b7_preclassification_record_contract, no_render_zone_contract | tests/b7/preclassification-boundary-service.test | B7_FIRST_CLASS_MATERIALITY_MARKER | no structural fact, registry, IR, export, OEE or diagnosis | contamination/export/diagnosis boundary only; not object owner |

### 19.1.2 Evaluacion MECE objeto por objeto A-E

| Grupo | Objeto | Clasificacion repo | Ubicacion corregida en Arbol maestro | Materialidad actual | Target | Gap | Evidencia granular path/tipo | Razon MECE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A_PF_SUP_03 | EvidenceBundle | partially_confirmed | Capa 1.0 / EvidenceBundle / input object for PF-SUP-03 transduction | L2 vocabulary_or_state_trace | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); tests/regression/mba-control-plane/mba-control-plane.test.mjs (regression_guard); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Visible as state/input vocabulary; no dedicated contract pack establishing transduction ownership. |
| A_PF_SUP_03 | ActoObservable | not_found | Capa 1.0 / PF-SUP-03 / ActoObservable extracted from EvidenceBundle item | L0 not_found | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Required as atomic observable act; not found as first-class object or contract. |
| A_PF_SUP_03 | ElementoMMABP | partially_confirmed | Capa 1.0 / PF-SUP-03 / MMABP element derived from ActoObservable | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/moc_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Appears as conceptual/state vocabulary but lacks owned schema/state machine. |
| A_PF_SUP_03 | HipotesisVSMPrimaria | partially_confirmed | Capa 1.0 / PF-SUP-03 / primary VSM hypothesis derived from evidence | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Hypothesis concept is visible but not governed as an owned object. |
| A_PF_SUP_03 | InconsistenciaMMABP | partially_confirmed | Capa 1.0 / PF-SUP-03 / inconsistency detected from MMABP element mapping | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/moc_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Inconsistency is present as vocabulary/control concern but not a first-class material object. |
| A_PF_SUP_03 | NodoEVELocal | partially_confirmed | Capa 1.0 / PF-SUP-03 / local node manifestation of evidence | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Local node appears conceptually; no owner contract or consumer boundary found. |
| A_PF_SUP_03 | ActorFuncionalEVE | partially_confirmed | Capa 1.0 / PF-SUP-03 / functional actor from observable act | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/olc_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Actor is inferable from flow evidence but not materialized as owned object. |
| A_PF_SUP_03 | TraduccionAHEMaterial | partially_confirmed | Capa 1.0 / PF-SUP-03 / material AHE translation from scene evidence | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | AHE translation is conceptually visible but lacks contract/state coverage. |
| A_PF_SUP_03 | EscenaEvidencial | partially_confirmed | Capa 1.0 / EvidenceBundle -> PF-SUP-03 / EscenaEvidencial | L2 vocabulary_only | L4 contract_defined | GAP-PF03-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/services/mba/nonconformance-rules.mjs (guardrail_rule); tests/regression/mba-control-plane/mba-control-plane.test.mjs (regression_guard); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Core object is named/guarded but lacks runner, schema and dedicated test. |
| B_PF_SUP_04 | SceneSet | not_found | PF-SUP-04 / validated EscenaEvidencial collection for aggregation | L0 not_found | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace); docs/audit/olc_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | No first-class collection contract found; Runtime 40/20 is only downstream dependency. |
| B_PF_SUP_04 | AggregationIndex | not_found | PF-SUP-04 / index over scenes, actors, nodes, artifacts and signals | L0 not_found | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace); src/services/client-causal-aggregation-engine.ts (adjacent_service) | Adjacent aggregation logic exists but no PF-SUP-04 owned index object. |
| B_PF_SUP_04 | PatronCausalMultirol | not_found | PF-SUP-04 / cross-scene multi-role causal pattern | L0 not_found | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace); src/services/client-causal-aggregation-engine.ts (adjacent_service) | Pattern object not found as contract or state machine. |
| B_PF_SUP_04 | PeliculaCausalAgregada | partially_confirmed | PF-SUP-04 / PeliculaCausalAgregada from SceneSet + AggregationIndex + Pattern | L3 guardrail_only | L4 contract_defined | GAP-PF04-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/services/mba/nonconformance-rules.mjs (guardrail_rule); tests/regression/mba-control-plane/mba-control-plane.test.mjs (regression_guard) | Object is named and guarded; not supported by owning runner and contracts. |
| B_PF_SUP_04 | SenalMonetizable | not_found | PF-SUP-04 / monetizable signal candidate from aggregated movie | L0 not_found | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | No first-class signal object found; must remain candidate, not diagnosis. |
| B_PF_SUP_04 | PerdidaMonetizable | requires_manual_review | PF-SUP-04 / optional loss estimate derived from causal movie | L1 requires_manual_review | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Loss object needs rector confirmation before owned contract design; do not infer from Runtime. |
| B_PF_SUP_04 | BloqueoAHEAgregado | not_found | PF-SUP-04 / aggregated AHE blockage derived from multiple scenes | L0 not_found | L4 contract_defined | GAP-PF04-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | No dedicated object or state machine found. |
| C_PF_SUP_05 | SynthesisCase | not_found | PF-SUP-05 / expert synthesis contract case | L0 not_found | L4 contract_defined | GAP-PF05-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/types/eve-organism-gate2-authority-guardrails.ts (authority_guardrail); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | SynthesisCase not found; Sistema Regulatorio is boundary, not owner. |
| C_PF_SUP_05 | NarrativaFinalCliente | partially_confirmed | PF-SUP-05 / blocked client-facing narrative output | L3 guardrail_only | L4 contract_defined | GAP-PF05-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/types/eve-organism-gate2-authority-guardrails.ts (authority_guardrail) | Visible as guarded delivery vocabulary; must remain blocked until authorization. |
| C_PF_SUP_05 | TeoremaInevitabilidad | partially_confirmed | PF-SUP-05 / blocked theorem output from synthesis case | L3 guardrail_only | L4 contract_defined | GAP-PF05-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/types/eve-organism-gate2-authority-guardrails.ts (authority_guardrail) | Concept appears as synthesis vocabulary; no owned contract. |
| C_PF_SUP_05 | RecomendacionConsultiva | partially_confirmed | PF-SUP-05 / blocked consultative recommendation output | L3 guardrail_only | L4 contract_defined | GAP-PF05-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/types/eve-organism-gate2-authority-guardrails.ts (authority_guardrail) | Guarded output vocabulary exists; not delivery-authorized materiality. |
| C_PF_SUP_05 | DiagnosticoExpertoFinal | partially_confirmed | PF-SUP-05 / final diagnosis delivery boundary, blocked in this scope | L3 guardrail_only | L4 contract_defined_boundary_only | GAP-PF05-001 | src/services/mba/domain-state-registry.mjs (state_vocabulary); src/services/mba/nonconformance-rules.mjs (guardrail_rule); src/types/eve-organism-gate2-authority-guardrails.ts (authority_guardrail) | Delivery is guarded; no Delivered state authorized. |
| D_B3 | OutputHandoffRecord | requires_manual_review | Capa 1.0 / B3 / handoff record feeding receiver feedback | L1 requires_manual_review | L4 contract_defined | GAP-B3-001 | fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json (canonical_question_catalog); fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json (canonical_dictionary); docs/audit/olc_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Handoff context is implied by B3 routes but object ownership requires manual rector alignment. |
| D_B3 | ReceiverFeedbackObject | not_found | Capa 1.0 / B3 / ReceiverFeedbackObject from 3.13a route | L0 not_found | L4 contract_defined | GAP-B3-001 | fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json (canonical_question_catalog); fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json (canonical_dictionary); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule) | Rule exists that satisfaction is not feedback, but first-class feedback object is absent. |
| D_B3 | OperationalExceptionEvidence | partially_confirmed | Capa 1.0 / B3 / OEE derived from route-validated ReceiverFeedbackObject | L3 guardrail_only | L4 contract_defined | GAP-B3-001 | docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule) | OEE appears as rector target/guarded concept but not sufficiently materialized from B3 object. |
| D_B3 | CanonicalRouteException | partially_confirmed | Capa 1.0 / B3 / CanonicalRouteException when route_missing | L2 vocabulary_or_flag | L4 contract_defined | GAP-B3-001 | fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json (canonical_dictionary); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule) | Route-missing behavior exists as vocabulary/guardrail; no owned exception object. |
| D_B3 | GapObject | partially_confirmed | Capa 1.0 / B3 / GapObject for unknown delivery failure or unresolved feedback | L2 vocabulary_or_flag | L4 contract_defined | GAP-B3-001 | fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json (canonical_dictionary); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule) | Gap flags exist; no full object closure found. |
| D_B3 | FlowNormalizationRecord | not_found | Capa 1.0 / B3 / FlowNormalizationRecord for normalized receiver feedback route | L0 not_found | L4 contract_defined | GAP-B3-001 | fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json (canonical_dictionary); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | No normalized record contract found. |
| D_B3 | B3B7AlignmentDelta | not_found | Capa 1.0 / B3-B7 / alignment delta control object | L0 not_found | L4 contract_defined | GAP-B3-001 | src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Alignment needs control object; no first-class delta found. |
| E_B7 | PreclassificationRecord | not_found | Capa 1.0 / B7 / PreclassificationRecord signal-only | L0 not_found | L4 contract_defined | GAP-B7-001 | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts (ontology_boundary); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule); src/app/api/scenes/runtime-contract-verify/route.ts (runtime_boundary_check) | Preclassification is guarded but not materialized; Sistema Regulatorio is a boundary only. |
| E_B7 | TransductionBlocker | partially_confirmed | Capa 1.0 / B7 / TransductionBlocker when signal crosses boundary | L3 guardrail_only | L4 contract_defined | GAP-B7-001 | src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule); src/app/api/scenes/runtime-contract-verify/route.ts (runtime_boundary_check) | Blocker appears as guardrail behavior; no owned object contract. |
| E_B7 | GovernanceIssue | partially_confirmed | Capa 1.0 / B7 / GovernanceIssue for contamination attempt | L3 guardrail_only | L4 contract_defined | GAP-B7-001 | src/services/mba/nonconformance-rules.mjs (guardrail_rule); src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule) | Governance issue is visible as control concept but not B7-owned materiality. |
| E_B7 | ExportBlocker | partially_confirmed | Capa 1.0 / B7 / ExportBlocker via no_render_zone | L3 guardrail_only | L4 contract_defined | GAP-B7-001 | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts (ontology_boundary); src/app/api/scenes/runtime-contract-verify/route.ts (runtime_boundary_check) | Export blocking exists as boundary behavior; needs no_render_zone contract. |
| E_B7 | B3B7AlignmentDelta | not_found | Capa 1.0 / B3-B7 / alignment delta control object | L0 not_found | L4 contract_defined | GAP-B7-001 | src/services/eve-organism-gate2-signal-guardrails.ts (guardrail_rule); docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json (prior_audit_trace) | Same delta object needed from B7 side; not found. |
| E_B7 | no_render_zone | not_found | Capa 1.0 / B7 / no_render_zone contract | L0 not_found | L4 contract_defined | GAP-B7-001 | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts (ontology_boundary); src/app/api/scenes/runtime-contract-verify/route.ts (runtime_boundary_check) | No contract found; must prevent render/export of B7 signals. |

### 19.1.3 Correccion de ramas Runtime/Sistema Regulatorio

| Correccion | Uso anterior a corregir | Uso corregido |
| --- | --- | --- |
| TREE-CORR-001 | Runtime 40/20 used in PF-SUP-04 as apparent owner | PF-SUP-04 owns SceneSet/AggregationIndex/PeliculaCausalAgregada; Runtime 40/20 is downstream consumer/dependency only. |
| TREE-CORR-002 | Sistema Regulatorio used in PF-SUP-05 as apparent owner | PF-SUP-05 owns SynthesisCase and delivery boundary; Sistema Regulatorio is authorization/security boundary only. |
| TREE-CORR-003 | Sistema Regulatorio used in B7 as apparent owner | Capa 1.0 / B7 owns PreclassificationRecord/no_render_zone; Sistema Regulatorio is contamination/export/diagnosis boundary only. |

### 19.1.4 Evidencia granular por path y tipo

| Path | Tipo de evidencia | Lectura usada |
| --- | --- | --- |
| src/services/mba/domain-state-registry.mjs | state_vocabulary | PF object names/states appear as registry vocabulary; not an owning materializer. |
| src/services/mba/nonconformance-rules.mjs | guardrail_rule | Nonconformance rules guard PF states; not first-class object contracts. |
| tests/regression/mba-control-plane/mba-control-plane.test.mjs | regression_guard | Control-plane regression evidence; not dedicated PF-SUP runner coverage. |
| docs/audit/detailed_pf_gap_analysis_pf_sup_03_04_05_b3_b7.json | prior_audit_trace | Prior gap analysis confirms missing first-class PF/B3/B7 materiality. |
| docs/audit/moc_gap_analysis_pf_sup_03_04_05_b3_b7.json | prior_audit_trace | MoC dependency/gap trace. |
| docs/audit/olc_gap_analysis_pf_sup_03_04_05_b3_b7.json | prior_audit_trace | OLC dependency/gap trace. |
| fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json | canonical_question_catalog | B3/B7 canonical question route evidence. |
| fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json | canonical_dictionary | Canonical term and route vocabulary. |
| src/services/eve-organism-gate2-signal-guardrails.ts | guardrail_rule | Gate 2 signal guardrails separate signal/feedback/diagnosis boundaries. |
| docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.ts | ontology_boundary | Diagnostic ontology boundary evidence; not object ownership. |
| src/app/api/scenes/runtime-contract-verify/route.ts | runtime_boundary_check | Runtime contract verification endpoint evidence; dependency/frontier only. |
| src/types/eve-organism-gate2-authority-guardrails.ts | authority_guardrail | Authority guardrail for delivery/authorization; boundary only. |
| src/services/client-causal-aggregation-engine.ts | adjacent_service | Adjacent aggregation logic; not PF-SUP-04 owning materializer. |
| src/services/causal-transduction-engine.ts | adjacent_service | Adjacent transduction logic; not PF-SUP-03 owning materializer. |

### 19.1.5 Validacion JSON traceability

El JSON traceability queda validado e incluido en docs/design/detailed_gap_design_pf_sup_03_04_05_b3_b7_first_class_materiality.json con estos bloques adicionales:

- object_groups_mece.
- mece_object_evaluation.
- corrected_tree_ownership_rules.
- granular_evidence_catalog.
- json_traceability_validation.
- completion_update.

Validaciones declaradas:

- includes_gap_matrix: true.
- includes_mece_object_evaluation: true.
- includes_repo_classification_by_object: true.
- includes_corrected_tree_location_by_object: true.
- includes_granular_evidence_by_path_and_type: true.
- includes_runtime_and_regulatory_owner_corrections: true.
- implementation_allowed: false.
- runtime_40_20_full_allowed: false.

## 20. Cierre

El cierre documental confirma que PF-SUP-03, PF-SUP-04, PF-SUP-05, B3 y B7 no deben promoverse por inferencia desde vocabulario, guardrails o tests adyacentes. La ruta mínima correcta es crear, en un tramo posterior autorizado, contratos y servicios dueños con markers de materialidad, tests específicos y fronteras explícitas contra diagnóstico, export, registry y runtime completo.

