# AUDIT - EVE 02 Diagnostic Ontology Shadow Mode Design V1

## 1. Resumen ejecutivo

Dictamen: `DIAGNOSTIC_ONTOLOGY_SHADOW_MODE_DESIGN_READY`.

Se diseñó `diagnostic_ontology_shadow` como modo futuro, disabled-by-default, dev/test-only y sin efectos laterales. No se implementó código, no se modificó `src`, no se tocaron tests, no se modificó el paquete base `EVE_02_Diagnostic_Ontology_v0_1.*` y no se cableó runtime.

## 2. Estado previo

Cierres leídos:

- `DIAGNOSTIC_ONTOLOGY_INPUT_CONTRACT_CORRECTED_READY`
- `DIAGNOSTIC_ONTOLOGY_STATIC_TESTS_READY_WITH_GAPS`
- `DIAGNOSTIC_ONTOLOGY_CONTENT_QA_READY_WITH_GAPS`
- `DIAGNOSTIC_ONTOLOGY_PACKAGE_INTAKE_READY_WITH_GAPS_NOT_WIRED`
- `DIAGNOSTIC_ONTOLOGY_RECTOR_SOURCES_READY`

Dependencias consideradas:

- EVE-00 shadow mode ready; dev harness trace ready with gaps.
- EVE-01 shadow mode ready; UI trace approved.

No quedan gaps bloqueantes para diseño.

## 3. Corroboración de archivos reales

Archivo de evidencia:

- `docs/audits/_eve_02_diagnostic_ontology_shadow_design_file_reality_check_v1.json`

Corroborado:

- paquete EVE-02 DOCX/MD/JSON/manifest/TS existe y es legible;
- D1 existe;
- D2 existe y extrae texto usando ruta estable de nombre corto;
- D4 existe y extrae texto;
- D5 existe y extrae texto;
- paquete contiene `input_contract` explícito;
- 13 compartments, 13 canonical pathologies, 45 rules, 7 modules;
- `final_diagnosis_enabled = false`;
- D2 primary, D1 methodological guard, D4/D5 runtime boundaries.

## 4. Diseño del modo diagnostic_ontology_shadow

Modo:

- `diagnostic_ontology_shadow`

Propiedades:

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

## 5. Contrato conceptual input/output

Archivo:

- `docs/audits/_eve_02_diagnostic_ontology_shadow_mode_contract_v1.json`

Input conceptual:

- `mode`
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

Output conceptual:

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

Safety flags siempre false.

## 6. Fixtures futuros

Archivo:

- `docs/audits/_eve_02_diagnostic_ontology_shadow_mode_fixtures_v1.json`

Fixtures diseñados:

- `valid_pm_moc_to_esquizofrenia_ontologica`
- `blocked_conformance_unchecked`
- `blocked_consistency_unchecked`
- `blocked_missing_evidence_refs`
- `blocked_semantic_ambiguity_sem_gate_open`
- `manual_review_multiple_compartments_low_confidence`
- `blocked_final_diagnosis_request`
- `systemic_total_requires_four_views`

## 7. Relación con EVE-00

- EVE-02 no evalúa conformance.
- EVE-02 no evalúa consistency desde cero.
- EVE-02 requiere resultado o señal equivalente de EVE-00.
- Si EVE-00 no validó, EVE-02 bloquea por conformance/consistency unchecked.
- EVE-02 no corrige modelos ni alinea cosméticamente.

## 8. Relación con EVE-01

- EVE-01 gobierna frontera constitucional.
- EVE-02 no produce final diagnosis.
- EVE-02 no produce IR, registry, export, monetization, transduction o production_real.
- Si `requestedOutputType` viola EVE-01, EVE-02 bloquea o envía a manual review.

## 9. Relación con D4/D5 Runtime

- D4/D5 son fronteras, no fuentes de patologías.
- B7/C20 solo puede producir low-confidence preclassification.
- SEM gate debe cerrar si hay ambigüedad semántica.
- PST gate debe cerrar para patologías PF/OLC temporales o causales dependientes de timers/waits.
- Downstream consume governed candidates, no raw text.

## 10. Future UI trace requirements

Archivo:

- `docs/audits/_eve_02_diagnostic_ontology_future_ui_trace_requirements_v1.json`

La UI dev futura puede mostrar `pathologyCandidate`. La UI productiva no debe exponer pathology labels salvo superficie diagnóstica futura explícitamente autorizada.

## 11. Riesgos

Archivo:

- `docs/audits/_eve_02_diagnostic_ontology_shadow_mode_risks_v1.json`

Riesgos principales:

- diagnóstico final accidental;
- patología desde texto libre;
- D2 usado para crear reglas MMABP;
- D4/D5 usados para relajar D1;
- colapso de patologías PF/OLC;
- systemic total sin cuatro vistas;
- UI productiva exponiendo labels;
- registry/export/production_real;
- runtimeAuthority prematuro;
- duplicar EVE-00;
- saltar EVE-01;
- B7/C20 convertido en diagnóstico.

## 12. Qué no se hizo

- no implementación;
- no cableado;
- no runtimeAuthority;
- no src;
- no UI;
- no Runtime productivo;
- no WorkMap;
- no Significado;
- no registry;
- no diagnosis final;
- no IR;
- no export;
- no Producción Paralela;
- no tests modificados;
- no paquete base `EVE_02_Diagnostic_Ontology_v0_1.*` modificado.

## 13. Recomendación

A. Implementar `diagnostic_ontology_shadow` como dominio/servicio puro.
