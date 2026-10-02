# EVE-02 Diagnostic Ontology - Shadow Mode Design V1

## 1. Propósito

Diseñar `diagnostic_ontology_shadow` como modo futuro, disabled-by-default, para traducir una inconsistencia MMABP ya validada en un `diagnostic_preclassification_candidate`.

Este diseño no implementa código, no cablea runtime, no registra `runtimeAuthority` y no modifica flujos productivos.

## 2. Autoridades

- D2: fuente primaria de compartimentos y patologías.
- D1 / EVE-00: guardia metodológica; conformance y consistency deben venir validadas.
- D4 / D5: frontera runtime; Capa 1 no diagnostica, no exporta, no escribe registry y no activa Producción Paralela.
- EVE-01: guardia constitucional; no final diagnosis, no IR, no registry, no export, no transduction, no production_real.

## 3. Modo

`diagnostic_ontology_shadow` debe ser:

- disabled-by-default;
- invocable solo por test futuro o dev harness futuro;
- sin efectos laterales;
- sin bloqueo de usuario;
- sin mutación de payload;
- sin registry write;
- sin diagnóstico final;
- sin IR;
- sin export;
- sin production_real;
- con trace completo.

## 4. Input conceptual

`DiagnosticOntologyEvaluationInput`:

- `mode: "diagnostic_ontology_shadow"`
- `inconsistency_compartment`
- `involved_models`
- `conformance_status`
- `consistency_status`
- `evidence_refs`
- `source_trace`
- `methodKernelResult?`
- `agentConstitutionDecision?`
- `semanticGateStatus?`
- `processStateTimerGateStatus?`
- `requestedOutputType?`
- `confidenceContext?`

Reglas de aceptación:

- `inconsistency_compartment` debe ser `EVE02-CMP-001` a `EVE02-CMP-013`.
- `involved_models` debe coincidir con el compartimento.
- `conformance_status` debe venir validado por EVE-00 o señal equivalente.
- `consistency_status` debe venir validado por EVE-00 o señal equivalente.
- `source_trace` debe incluir D2 y evidencia estructural.
- si existe decisión EVE-01, no debe bloquear por frontera constitucional.

## 5. Inputs prohibidos

- texto libre sin `evidence_refs`;
- texto libre sin `source_trace`;
- patología pedida directamente por usuario;
- `inconsistency_compartment` inexistente;
- `involved_models` que no coinciden con el compartimento;
- `conformance_status` faltante;
- `consistency_status` faltante;
- mapping diagnóstico sin D2;
- final diagnosis request;
- B7/C20 como diagnóstico final;
- pathology label expuesto a UI productiva;
- `raw_text_export`;
- `registry_write`;
- `export_payload`;
- `production_real`.

## 6. Output conceptual

`DiagnosticOntologyEvaluationResult`:

- `version`
- `mode`
- `chipId`
- `readinessState`
- `candidateId`
- `compartmentId`
- `pathologyCandidate`
- `canonicalPathology`
- `aliases`
- `diagnosticQuestion`
- `methodTrace`
- `pathologyTrace`
- `evidenceRefs`
- `sourceTrace`
- `allowedActions`
- `blockedActions`
- `requiredInputs`
- `findings`
- `auditEvents`
- `safetyFlags`

Safety flags siempre false:

- `canBlockUserFlow: false`
- `canModifyPayload: false`
- `canWriteRegistry: false`
- `canTriggerFinalDiagnosis: false`
- `canTriggerIR: false`
- `canTriggerExport: false`
- `canTriggerProduction: false`
- `runtimeAuthority: false`

## 7. Readiness states

Estados permitidos:

- `diagnostic_preclassification_candidate`
- `blocked_by_conformance_unchecked`
- `blocked_by_consistency_unchecked`
- `blocked_by_missing_evidence`
- `blocked_by_semantic_ambiguity`
- `manual_review_required`
- `reentry_required`

En shadow mode estos estados son señales internas, no gates productivos.

## 8. Relación con EVE-00

- EVE-02 no evalúa conformance.
- EVE-02 no evalúa consistency desde cero.
- EVE-02 requiere resultado o señal equivalente de EVE-00.
- si EVE-00 no validó, EVE-02 bloquea por conformance/consistency unchecked.
- EVE-02 no corrige modelos ni alinea cosméticamente.

## 9. Relación con EVE-01

- EVE-01 gobierna frontera constitucional.
- EVE-02 no produce final diagnosis.
- EVE-02 no produce IR, registry, export, monetization, transduction o production_real.
- si `requestedOutputType` viola EVE-01, EVE-02 bloquea o envía a manual review.

## 10. Relación con D4/D5 Runtime

- D4/D5 son fronteras, no fuentes de patologías.
- B7/C20 solo puede producir low-confidence preclassification.
- SEM gate debe cerrar si hay ambigüedad semántica.
- PST gate debe cerrar para patologías PF/OLC temporales o causales dependientes de timers/waits.
- downstream consume governed candidates, no raw text.

## 11. Fixtures futuros

Fixtures mínimos futuros:

- `valid_pm_moc_to_esquizofrenia_ontologica`
- `blocked_conformance_unchecked`
- `blocked_consistency_unchecked`
- `blocked_missing_evidence_refs`
- `blocked_semantic_ambiguity_sem_gate_open`
- `manual_review_multiple_compartments_low_confidence`
- `blocked_final_diagnosis_request`
- `systemic_total_requires_four_views`

Cada fixture debe comparar expected/actual para readiness, compartment, pathology, allowed/blocked actions, ruleIds y safety flags.

## 12. Future UI trace

Un dev harness futuro puede mostrar pathologyCandidate. La UI productiva no debe exponer pathology labels salvo futura superficie diagnóstica explícitamente autorizada.

El dev harness futuro debe mostrar:

- selectedFixture;
- input contract;
- EVE-00/EVE-01 signals;
- gate statuses;
- readinessState;
- pathologyCandidate;
- diagnosticQuestion;
- allowed/blocked actions;
- requiredInputs;
- findings;
- auditEvents;
- safetyFlags;
- MATCH expected/actual.

## 13. Riesgos principales

- diagnóstico final accidental;
- patología desde texto libre;
- D2 usado para crear reglas MMABP;
- D4/D5 usados para relajar D1;
- colapsar Tortura Causal y Violación Causal;
- clasificar Falsa Elección para cualquier PF/OLC issue;
- declarar Incoherencia Sistémica Total sin cuatro vistas;
- exponer pathology labels en UI productiva;
- registry/export/production_real desde shadow;
- runtimeAuthority prematuro;
- duplicar EVE-00;
- saltar EVE-01;
- B7/C20 convertido en diagnóstico.

## 14. Recomendación

Implementar `diagnostic_ontology_shadow` como dominio/servicio puro en una tarea posterior, todavía sin cableado productivo.
