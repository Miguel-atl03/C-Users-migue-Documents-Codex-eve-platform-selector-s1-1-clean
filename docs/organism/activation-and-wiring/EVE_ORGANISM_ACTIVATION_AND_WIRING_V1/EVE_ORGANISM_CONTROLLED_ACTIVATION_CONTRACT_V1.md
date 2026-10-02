# EVE-ORGANISM-CONTROLLED-ACTIVATION-CONTRACT-V1

**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Estado:** `RECTOR_CONTRACT_READY_FOR_REPO_TRANSDUCTION_WITH_BLOCKING_GAPS`  
**Autorización productiva:** **NO**

## 1. Propósito y frontera

Este contrato gobierna la activación gradual del organismo EVE: experiencia cliente, runtime, sistema nervioso, chips cognitivos, Producción Paralela y gobierno. No implementa el `composition root`; fija las condiciones ejecutables que deberán convertirse en guards, feature flags, state machines, audit events y tests.

Regla de conteo: **EVE-00 es el kernel constitucional; EVE-01 a EVE-08 son ocho chips funcionales.**

La activación no se expresa mediante un interruptor global. La autoridad se concede por capacidad, alcance, ambiente, tenant, acción, artefacto y versión.

## 2. Dictamen de entrada

El inventario observado contiene 15 rutas UI, 33 APIs/servicios, 9 paquetes cognitivos, 16 señales nerviosas, 12 mecanismos de gobierno y 14 gaps. El inventario permite diseñar el contrato, pero no autoriza activación productiva.

## 3. Fuentes y trazabilidad

| ID | Fuente | Ruta | SHA256 | Autoridad |
| --- | --- | --- | --- | --- |
| SRC-INV-01 | EVE Organism Repo Technical Inventory V1 (JSON) | docs/audits/_eve_organism_repo_technical_inventory_v1.json | d2e9c3b9a21d1216a7ca0dda47ccfa8135b5042522524c44610bd411211683e7 | Observed repo inventory |
| SRC-GRAPH-01 | EVE Organism Repo Connection Graph V1 | docs/audits/_eve_organism_repo_connection_graph_v1.json | 7ce33cef41c3120c98598023f9da274adb0f2ff10281b1e2f79090a542c66fb2 | Observed wiring evidence |
| SRC-AUTH-01 | EVE Organism Authority Matrix Observed V1 | docs/audits/_eve_organism_authority_matrix_observed_v1.json | 06c0aaae9359be238662aaebe713f5dd95380d89fb301367beb5e88bb215fdef | Observed authority evidence |
| SRC-GAP-01 | EVE Organism Activation Gap Index V1 | docs/audits/_eve_organism_activation_gap_index_v1.json | 0b19cefd8e4e70dc380118d2ce51f9c9a8157df1978240ecf3d957d3868e57c2 | Activation blocker evidence |
| SRC-ORG-01 | EVE Runtime Fases 1 a 8 como organismo vivo | EVE_Runtime_Fases_1_a_8_Organismo_Vivo_Contexto_Operativo_v1.docx | 6afb25ca5a4e1ccda96c8bcd9cca7c2137f2e2ce90159d0a912fac2a9ff87edc | Operational organism context |
| SRC-UI-01 | Handoff Login a WorkMap | HANDOFF_Bundle_Pantallas_EVE_Login_a_WorkMap.docx | c314e18a3eef1515ef79d441ac7f250b2df879c1aef256e7b820ced1d5331994 | Approved UI continuity handoff |
| SRC-UI-02 | Handoff WorkMap a Significado | HANDOFF_WorkMap_a_Significado_de_tu_trabajo.docx | 2da47f7f8d1d2008bfa93c015c03466eb5cdd366e9e5ef543557f7adbd9a525b | Approved WorkMap-to-Significado handoff |
| SRC-EVE08-01 | EVE 08 Audit and Governance v0.1.1 candidate | docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/EVE_08_Audit_And_Governance_v0_1_1_candidate.json | b397ac950ef0f847a5897794b285745500c484ab768e998215854dce104034d9 | Governance candidate evidence |
| SRC-MMABP-01 | Fundamentals of Business Architecture Modeling | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf | 3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147 | Supreme MMABP method authority |
| SRC-VSM-01 | Organizational Systems: Managing Complexity with the Viable System Model | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/Organizational Systems Managing Complexity with the Viable System model.pdf | 00bd8009333bedf9bc5dbbd2d2ff3f295bb874066b319796744b1ef019fca418 | VSM viability and governance authority |
| SRC-AHE-01 | Marco AHE | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/sources/Marco de Interpretación y Observación Explicativo Arquitectura Humana Empresarial_(AHE).docx | 17f5845744bff404e9218e641b3006c2c6f32f5870c3fe81d1bd47077104b55e | Human recursive causality lens |


## 4. Principios no negociables

| Regla | Severidad | Contenido |
| --- | --- | --- |
| ACT-P-001 | hard | La autoridad se concede por capacidad y alcance; no existe un interruptor global de cerebro. |
| ACT-P-002 | hard | La presencia de un chip o dev harness no constituye autoridad productiva. |
| ACT-P-003 | hard | La UI cliente solo consume vistas estables mediante BFF/application service; no importa chips ni vísceras internas. |
| ACT-P-004 | hard | WorkMap y su cableado aprobado son baseline congelado; cualquier cambio es agregación explícita. |
| ACT-P-005 | hard | Significado se inserta como continuación del flujo WorkMap, no como sustitución de Guardar o readiness. |
| ACT-P-006 | hard | Conformance contra realidad precede a consistencia entre modelos. |
| ACT-P-007 | hard | Una inconsistencia no se corrige alineando cosméticamente modelos; primero se determina el hecho real. |
| ACT-P-008 | hard | Control productivo prioriza autorregulación local y añade control extrínseco solo donde la variedad residual lo exige. |
| ACT-P-009 | hard | La comunicación operacional se valida como coordinación circular de acciones, no solo transmisión de mensajes. |
| ACT-P-010 | hard | Autonomía local y cohesión global deben coexistir; ninguna capacidad central absorbe decisiones que corresponden a S1. |
| ACT-P-011 | hard | EVE08 audita y gobierna, pero no ejecuta la misma acción irreversible que audita. |
| ACT-P-012 | hard | Toda acción irreversible exige aprobación humana, evidencia, idempotencia, audit trail y rollback probado. |
| ACT-P-013 | high | La gobernanza no puede convertir revisión humana en cuello de botella coercitivo sin medir carga y reversión. |
| ACT-P-014 | hard | Producción Paralela permanece candidate/rehearsal hasta release explícito; nunca escribe registry por sí sola. |
| ACT-P-015 | hard | El canal algedónico puede degradar o cuarentenar una capacidad sin esperar la cadena normal. |
| ACT-P-016 | hard | Las rutas dev/shadow no son superficies productivas y deben estar deshabilitadas en producción. |
| ACT-P-017 | hard | Service-role solo opera desde adapters allowlisted, con alcance tenant, ledger y revocación. |
| ACT-P-018 | hard | El estado brainConnectionEnabled es derivado de capacidades; no es una bandera operable. |
| ACT-P-019 | hard | Toda promoción se realiza por anillos y puede retroceder una capacidad sin apagar todo el organismo. |
| ACT-P-020 | hard | No se habilitan registryWrite, finalExport y parallelExecution en el mismo release. |

## 5. Roles de autoridad

| Rol | VSM | Responsabilidad | Aprueba irreversible |
| --- | --- | --- | --- |
| CLIENT_USER | S1 | Usuario autenticado que aporta información y consume resultados comprensibles. | False |
| TENANT_OPERATOR | S1 | Responsable operativo del tenant/actividad; resuelve gaps locales y confirma evidencia. | False |
| HUMAN_REVIEWER | S3* | Revisa candidates, evidencia y divergencias; no ejecuta la acción que audita. | bounded |
| SYSTEM_OPERATOR | S3 | Opera runtime, capacidad y releases dentro del allowlist técnico. | False |
| RELEASE_MANAGER | S3/S5 | Autoriza promoción de capacidad y release controlado con evidencia completa. | True |
| INDEPENDENT_AUDITOR | S3* | Verifica logs, checksums, bypass, tenant isolation y rollback de forma independiente. | False |
| ADAPTATION_OWNER | S4 | Analiza divergencias, feedback y evolución futura sin adquirir autoridad operativa directa. | False |
| POLICY_OWNER | S5 | Define identidad, límites, riesgos inaceptables y revoca autoridad. | True |

## 6. Máquina de estados de capacidad

| Estado | Efectos productivos | Definición |
| --- | --- | --- |
| OFF | False | Capacidad deshabilitada; no lee tráfico productivo salvo health checks. |
| VALIDATED | False | Artefacto y dependencias validados; aún sin tráfico ni side effects. |
| SHADOW | False | Procesa copia de tráfico real; produce evidencia comparativa no vinculante. |
| SUPERVISED | bounded | Opera sobre trabajo real con revisión humana previa a toda acción irreversible. |
| CONTROLLED_ACTIVE | allowlisted | Ejecuta únicamente side effects autorizados por alcance, tenant, acción y versión. |
| ACTIVE | full_within_contract | Autoridad productiva concedida dentro del contrato y monitoreo continuo. |
| DEGRADED | reduced | Conjunto mínimo de capacidades; evita propagación de daño. |
| QUARANTINED | False | Aislada por daño, inconsistencia o evidencia insuficiente. |
| ROLLBACK_IN_PROGRESS | compensating_only | Solo permite acciones compensatorias auditadas. |
| REVOKED | False | Autoridad retirada; requiere nueva validación para reingresar. |

## 7. Catálogo de capacidades

| ID | Capacidad | Owner | Estado inicial | Propósito | Efectos irreversibles | Blockers |
| --- | --- | --- | --- | --- | --- | --- |
| CAP-CLIENT-ACCESS | clientAccess | CLIENT_BFF | VALIDATED | Exponer experiencia autenticada y estable sin vísceras internas. | Ninguno | tenant_context_missing, auth_not_verified, dev_route_in_production |
| CAP-TENANT-CONTEXT | tenantContext | SESSION_BOUNDARY | VALIDATED | Resolver y propagar empresa, sesión, usuario y actividad en cada comando. | Ninguno | tenant_scope_not_proven, session_owner_mismatch |
| CAP-RUNTIME-CAPTURE | runtimeCapture | RUNTIME_ORCHESTRATOR | OFF | Capturar respuestas, estados, timers y evidencia por actividad. | productive_state_write | tenant_context_missing, provenance_missing, idempotency_key_missing |
| CAP-GATE-ADVISORY | gateAdvisory | EVE05_GATE_ENGINE | VALIDATED | Evaluar gates sin bloquear el flujo oficial. | Ninguno | candidate_missing, source_binding_missing |
| CAP-GATE-ENFORCEMENT | gateEnforcement | EVE05_GATE_ENGINE | OFF | Bloquear transiciones productivas cuando falla una condición crítica. | workflow_block | rollback_not_tested, manual_review_path_missing, false_block_rate_unmeasured |
| CAP-OBJECT-BINDING | objectBinding | OBJECT_BINDING_ADAPTER | OFF | Vincular evidencia y candidates con objetos y estados gobernados. | materialized_binding | semantic_resolution_failed, tenant_scope_not_proven |
| CAP-MEMBRANE-OUTBOX | membraneOutbox | OUTBOX_ADAPTER | OFF | Publicar eventos idempotentes después de persistencia local y auditada. | event_publish | outbox_contract_missing, idempotency_key_missing, correlation_id_missing |
| CAP-GOVERNANCE-OBSERVE | governanceObserve | EVE08_GOVERNANCE | VALIDATED | Observar decisiones, divergencias, overrides y side effects sin ejecutar operación. | Ninguno | audit_sink_unavailable |
| CAP-GOVERNANCE-ENFORCE | governanceEnforce | EVE08_GOVERNANCE | OFF | Aplicar policy holds o degradación sin ejecutar la operación auditada. | authority_change | independent_audit_not_proven, kill_switch_missing, rollback_not_tested |
| CAP-CANDIDATE-GENERATION | candidateGeneration | EVE07_PARALLEL_INTERFACE | VALIDATED | Preparar SCR, EvidenceBundle, MDSB, IR y registry candidates sin writes finales. | Ninguno | readiness_not_passed, raw_text_to_candidate, b7_direct_projection |
| CAP-HUMAN-RELEASE | humanRelease | RELEASE_MANAGER | OFF | Aprobar o rechazar acciones irreversibles con evidencia, alcance y expiración. | release_decision | review_record_missing, evidence_bundle_missing, conflict_of_interest |
| CAP-REGISTRY-WRITE | registryWrite | REGISTRY_WRITE_ADAPTER | OFF | Promover un registry candidate aprobado a registro activo versionado. | registry_write | registry_policy_ambiguous, approval_missing, version_conflict, rollback_not_tested |
| CAP-FINAL-EXPORT | finalExport | EXPORT_RELEASE_ADAPTER | OFF | Emitir export final aprobado y trazable. | external_export | approval_missing, export_scope_unverified, provenance_missing, tenant_scope_not_proven |
| CAP-PARALLEL-EXECUTION | parallelExecution | PARALLEL_PRODUCTION_RUNTIME | OFF | Ejecutar Producción Paralela real solo después de rehearsal y release gate. | parallel_productive_handoff | shadow_harness_unbound, release_approval_missing, rollback_not_tested |
| CAP-EXTERNAL-LLM | externalLLMAssistance | COACH_ADAPTER | OFF | Usar LLM externo solo como asistencia sin autoridad estructural. | Ninguno | llm_boundary_unconfirmed, pii_policy_missing, prompt_audit_missing |

## 8. Transiciones permitidas

| ID | Desde | Hacia | Evidencia requerida | Aprobador | Rollback |
| --- | --- | --- | --- | --- | --- |
| TR-001 | OFF | VALIDATED | artifact_integrity_pass, dependency_check_pass, owner_assigned | SYSTEM_OPERATOR | OFF |
| TR-002 | VALIDATED | SHADOW | shadow_harness_pass, no_side_effects_proven, tenant_scope_instrumented, audit_sink_ready | RELEASE_MANAGER | VALIDATED |
| TR-003 | SHADOW | SUPERVISED | shadow_comparison_pass, divergence_explained, manual_review_ready, rollback_drill_pass | POLICY_OWNER | SHADOW |
| TR-004 | SUPERVISED | CONTROLLED_ACTIVE | write_allowlist_approved, tenant_isolation_proven, idempotency_proven, human_release_enabled | POLICY_OWNER | SUPERVISED |
| TR-005 | CONTROLLED_ACTIVE | ACTIVE | cohort_evidence_pass, post_operation_reconciliation_pass, algedonic_channel_tested, periodic_recertification_scheduled | POLICY_OWNER | CONTROLLED_ACTIVE |
| TR-006 | SHADOW | DEGRADED | performance_or_evidence_risk | SYSTEM_OPERATOR | VALIDATED |
| TR-007 | SUPERVISED | DEGRADED | noncritical_incident | SYSTEM_OPERATOR | SHADOW |
| TR-008 | CONTROLLED_ACTIVE | DEGRADED | noncritical_incident | SYSTEM_OPERATOR | SUPERVISED |
| TR-009 | ACTIVE | DEGRADED | noncritical_incident | SYSTEM_OPERATOR | CONTROLLED_ACTIVE |
| TR-010 | ANY | QUARANTINED | critical_no_go_trigger | INDEPENDENT_AUDITOR_OR_POLICY_OWNER | VALIDATED |
| TR-011 | QUARANTINED | ROLLBACK_IN_PROGRESS | rollback_plan_selected, evidence_preserved, operator_assigned | POLICY_OWNER | QUARANTINED |
| TR-012 | ROLLBACK_IN_PROGRESS | VALIDATED | compensation_complete, reconciliation_pass, independent_audit_pass | POLICY_OWNER | QUARANTINED |
| TR-013 | ANY | REVOKED | policy_revocation_or_unrecoverable_risk | POLICY_OWNER | OFF |
| TR-014 | REVOKED | OFF | revocation_closed, artifacts_archived | POLICY_OWNER | REVOKED |

## 9. Gates de activación

| Gate | Objetivo | Estado destino | Evidencia requerida | Gaps bloqueantes | Resultado si pasa |
| --- | --- | --- | --- | --- | --- |
| G0-DOCUMENT-CLOSURE | Clausura documental y de dependencia | VALIDATED | Exact versions and hashes for EVE-00..EVE-08<br>Manifests and source-proof status<br>No stale audit used as current authority<br>Clean or explicitly isolated EVE04 state<br>Open blockers registered in EVE08 | GAP-012 | Capabilities may enter VALIDATED only. |
| G1-PASSIVE-COMPOSITION | Composition root pasivo | SHADOW | Typed ports and adapters<br>No UI direct chip imports<br>No product writes<br>Correlation and idempotency context propagated<br>EVE08 audit event capture available | GAP-001, GAP-002, GAP-007 | Read-only and shadow evaluation traffic allowed. |
| G2-END-TO-END-SHADOW | Shadow E2E con tráfico real no vinculante | SHADOW | Tenant-scoped traffic copy<br>Official-vs-EVE decision comparison<br>Gate trace, latency, retries and replay metrics<br>Zero productive side effects<br>Divergence explainability and reversibility | GAP-003, GAP-005, GAP-010, GAP-011 | Eligible for supervised pilot review. |
| G3-SUPERVISED-OPERATION | Operación supervisada | SUPERVISED | Human review queue operational<br>Gates classify advisory vs enforcement<br>Object binding and evidence provenance complete<br>Candidate generation only<br>Registry/export/final diagnosis remain blocked | GAP-005, GAP-008, GAP-010 | Real capture and candidate generation with human authority. |
| G4-CONTROLLED-WRITES | Escrituras controladas por capacidad | CONTROLLED_ACTIVE | Route-by-route tenant/RLS audit<br>Service-role allowlist and denylist<br>Write ledger and immutable audit<br>Rollback drill for each side effect<br>One irreversible capability per release | GAP-003, GAP-004, GAP-006, GAP-008, GAP-010 | Only approved allowlisted writes enabled. |
| G5-CLIENT-PILOT | Fase 9 piloto cliente | CONTROLLED_ACTIVE | Approved client routes and BFF<br>WorkMap baseline preserved<br>Significado inserted as continuation, not replacement<br>Customer language hides internal organism<br>Results are reviewed and comprehensible | GAP-009, GAP-010, GAP-013 | Pilot tenant access enabled by cohort. |
| G6-RING-DEPLOYMENT | Fase 10 QA y despliegue por anillos | ACTIVE | Internal ring pass<br>Pilot tenant pass<br>Small cohort pass<br>Security, privacy, accessibility, load and recovery pass<br>Post-activation monitor and recertification active | GAP-003, GAP-008, GAP-011, GAP-014 | Availability expands one ring at a time. |

## 10. Contrato de seguridad, tenant y service-role

- Todo comando debe resolverse a un único tenant, sesión y actividad antes de llegar al composition root.
- Ningún side effect puede ejecutarse con scope unknown o inferido.
- Service-role no hereda el scope del cliente: debe recibir scope verificado y allowlist de tablas/acciones.
- RLS y tenant isolation deben probarse por ruta antes de CONTROLLED_ACTIVE.
- Admin y dev routes no comparten autoridad de escritura productiva.

**Blockers abiertos:** GAP-003, GAP-004, GAP-010

## 11. Contratos de evento

| Evento | Productor | Consumidor | Campos obligatorios | Side effect |
| --- | --- | --- | --- | --- |
| ClientIntentReceived | CLIENT_BFF | COMPOSITION_ROOT | tenantId, userId, sessionId, activityId, correlationId, idempotencyKey, intentType, payloadRef | none |
| RuntimeCommandAccepted | COMPOSITION_ROOT | RUNTIME_ORCHESTRATOR | commandId, scope, capabilityState, policyVersion | none |
| EvidenceRecorded | EVE06_EXECUTION | ["EVE05_GATE", "EVE08_AUDIT"] | evidenceId, sourceNodeId, provenance, tenantId, sessionId, activityId | local_persistence_only |
| CanonicalVariableMaterialized | EVE06_EXECUTION | ["EVE05_GATE", "EVE07_PARALLEL"] | recordId, variableName, valueRef, provenance, confidence, status | local_persistence_only |
| GateDecisionIssued | EVE05_GATE | ["COMPOSITION_ROOT", "EVE08_AUDIT"] | gateId, decision, reasonCodes, candidateRef, policyVersion | hold_or_advisory |
| StructuralCandidatePrepared | EVE06_EXECUTION | ["EVE07_PARALLEL", "EVE08_AUDIT"] | candidateId, modelType, evidenceRefs, conformanceStatus, consistencyStatus | candidate_only |
| ParallelPayloadPrepared | EVE07_PARALLEL | ["HUMAN_REVIEW_QUEUE", "EVE08_AUDIT"] | payloadId, payloadType, candidateRefs, blockers, readiness | candidate_only |
| ManualReviewRequested | ["EVE05_GATE", "EVE07_PARALLEL", "EVE08_GOVERNANCE"] | HUMAN_REVIEW_QUEUE | reviewId, reviewType, scope, evidenceRefs, requestedBy, dueAt | queue_write |
| HumanReleaseDecision | HUMAN_REVIEWER | ["RELEASE_MANAGER", "EVE08_AUDIT"] | reviewId, decision, actorId, reason, artifactHash, expiresAt | authorization_record |
| ReleaseAuthorized | RELEASE_MANAGER | RELEASE_ADAPTER | releaseId, capabilityId, scope, artifactHash, approvalRefs, rollbackPlanId | allowlisted_release |
| AlgedonicSignalRaised | ANY_COMPONENT | ["INDEPENDENT_AUDITOR", "POLICY_OWNER"] | signalId, severity, scope, harmType, evidenceRefs, occurredAt | immediate_hold |
| CapabilityStateChanged | EVE08_GOVERNANCE | ["COMPOSITION_ROOT", "OBSERVABILITY"] | capabilityId, from, to, reason, approvalRefs, timestamp | authority_change |
| RollbackStarted | POLICY_OWNER | ["SYSTEM_OPERATOR", "EVE08_AUDIT"] | rollbackId, scope, targetState, planHash, evidenceSnapshot | compensation_only |
| RollbackCompleted | SYSTEM_OPERATOR | ["INDEPENDENT_AUDITOR", "POLICY_OWNER"] | rollbackId, reconciliationResult, residualRisks, completedAt | none |

## 12. Revisión humana y override

### 12.1 Tipos de revisión

| Tipo | Aplica a | SLA (h) | Independencia |
| --- | --- | --- | --- |
| STRUCTURAL_CANDIDATE_REVIEW | mmabp_ir_candidate, registry_candidate | 24 | True |
| OVERRIDE_REVIEW | any_blocking_override | 4 | True |
| EXPORT_RELEASE_REVIEW | final_export | 24 | True |
| TENANT_SCOPE_EXCEPTION_REVIEW | scope_exception | 2 | True |
| ALGEDONIC_INCIDENT_REVIEW | critical_no_go | 1 | True |
| LLM_ASSISTANCE_REVIEW | llm_generated_structure_candidate | 24 | False |

### 12.2 Reglas de override

- No existe override implícito.
- Override solicitado y no auditado bloquea release.
- Override aprobado expira y no cambia la regla base.
- El ejecutor no puede aprobar su propio override.
- Toda frecuencia de override se monitorea como señal de diseño defectuoso o carga coercitiva.

## 13. Canal algedónico, kill switch y rollback

**Ámbitos de kill switch:** global, tenant, capability, route, artifact_type, chip_version

**Acciones inmediatas:**
- stop_new_commands
- preserve_evidence
- freeze_side_effects
- emit_algedonic_signal
- start_reconciliation
- select_rollback_plan

**Evidencia de rollback:**
- pre_state_hash
- post_state_hash
- ledger_entries
- compensation_results
- residual_risks
- independent_audit

## 14. No-Go absolutos

| ID | Trigger | Acción | Severidad |
| --- | --- | --- | --- |
| NG-001 | tenant_data_leak_or_cross_tenant_read | QUARANTINE_ALL_WRITE_CAPABILITIES | critical |
| NG-002 | evidence_without_provenance | BLOCK_CANDIDATE_AND_REQUEST_REENTRY | hard |
| NG-003 | gate_bypass_detected | QUARANTINE_SCOPE_AND_ALERT_S3_STAR | critical |
| NG-004 | structural_candidate_without_object_binding | BLOCK_HANDOFF | hard |
| NG-005 | override_requested_and_not_audited | BLOCK_RELEASE | hard |
| NG-006 | state_ledger_divergence | FREEZE_WRITES_AND_RECONCILE | critical |
| NG-007 | export_without_human_approval | BLOCK_EXPORT_AND_ALERT | critical |
| NG-008 | registry_write_without_version_and_approval | BLOCK_REGISTRY_WRITE | critical |
| NG-009 | stale_source_proof_used_as_authority | REVOKE_ARTIFACT_AUTHORITY | hard |
| NG-010 | rollback_not_proven_for_requested_side_effect | DENY_CAPABILITY_PROMOTION | hard |
| NG-011 | ui_imports_chip_or_internal_registry_directly | BLOCK_BUILD_OR_RELEASE | hard |
| NG-012 | executor_and_auditor_same_unsegregated_identity | BLOCK_IRREVERSIBLE_ACTION | critical |
| NG-013 | b7_or_c20_direct_ir_registry_export | BLOCK_PROJECTION | hard |
| NG-014 | receiver_satisfaction_used_as_receiver_feedback | OPEN_RECEIVER_FEEDBACK_ROUTE_MISSING | hard |
| NG-015 | raw_text_to_diagnosis_or_ir | BLOCK_AND_REQUIRE_CANONICAL_ROUTE | critical |
| NG-016 | service_role_used_outside_allowlist | REVOKE_SERVICE_ROLE_PATH | critical |
| NG-017 | manual_review_backlog_exceeds_threshold | DEGRADE_AUTOMATION_AND_ESCALATE_CAPACITY | high |
| NG-018 | human_burden_or_workaround_pattern_increases_after_gate_enablement | REVIEW_GATE_DESIGN_AND_DEGRADE_ENFORCEMENT | high |

## 15. Arquitectura mínima de la activación

### Process Map
Necesidad cliente → captura/análisis → revisión → publicación controlada → resultado utilizable.

### Model of Concepts
Tenant, Session, Activity, Evidence, CanonicalVariable, Candidate, Review, Approval, Artifact, Release, Revocation

### Process Flow / Process States
awaiting_evidence, awaiting_review, awaiting_approval, awaiting_release, reentry_required

**Regla temporal:** Todo Process State debe tener timeout, escalation y salida definida.

### Object Life Cycle de ArtifactCandidate
created → validated → blocked → review_required → approved → released → revoked → superseded

Primero se evalúa conformance contra la realidad operacional; después consistencia entre intención, flujo, objetos y estados.


## 16. Diseño VSM y salvaguardas AHE

| Función | Implementación contractual |
| --- | --- |
| S1 | Tenants, actividades, sesiones y equipos cliente; autonomía local dentro de políticas. |
| S2 | Timers, branching, idempotencia, reentry, colisiones y coordinación de ritmos. |
| S3 | Capacidad, permisos, gate enforcement y ejecución controlada. |
| S3_star | Auditoría independiente, probes, reconciliación y detección de bypass. |
| S4 | Divergencias, feedback, evolución de catálogo y aprendizaje. |
| S5 | Identidad, límites, riesgo aceptable, promoción y revocación. |
| algedonic_channel | Señal crítica directa a auditor/policy owner para degradar, cuarentenar o hacer rollback. |

**Métricas humanas obligatorias:** review_wait_time, override_frequency, gate_generated_rework, local_workarounds, manual_burden, appeal_rate, reversal_rate, unresolved_human_cost

Si la gobernanza incrementa compensación humana, silencio o workaround, degradar enforcement y revisar diseño; no culpabilizar al actor.

## 17. Gaps que bloquean activación

| Gap | Tipo | Severidad | Descripción | Evidencia requerida |
| --- | --- | --- | --- | --- |
| GAP-001 | activation_contract_missing | critical | No single repo artifact defines the controlled organism activation contract across chips, runtime, UI, persistence, registry and rollback. | EVE-ORGANISM-CONTROLLED-ACTIVATION-CONTRACT-V1 |
| GAP-002 | authority_map_missing | critical | Observed authority surfaces are distributed across UI, API, Supabase clients, MBA service role services, registries and chip docs. | EVE-ORGANISM-WIRING-AND-AUTHORITY-MAP-V1 |
| GAP-003 | rls_and_db_policy_unverified | critical | Supabase persistence is present, but RLS, table policies, indexes and tenant isolation were not verified from database state. | DB schema, RLS policy and service-role write audit. |
| GAP-004 | service_role_boundary_high_risk | critical | MBA and parallel production persistence can use service role keys. | Explicit service role allowlist, denylist, audit log and rollback design. |
| GAP-005 | shadow_to_productive_promotion_path_missing | critical | Shadow services and dev harnesses are present, but the allowed promotion path from shadow candidate to productive authority is not observed. | Promotion gate contract and human approval checkpoints. |
| GAP-006 | registry_write_policy_ambiguous | high | Registry and runtimeAuthority concepts exist, but a unified registry write policy for organism activation is not observed. | Registry authority table and write path audit. |
| GAP-007 | event_bus_or_outbox_missing | high | No canonical event bus/outbox contract was observed for organism-level activation. | Event/outbox schema and idempotency policy. |
| GAP-008 | kill_switch_and_rollback_missing | high | No explicit kill switch, rollback ledger or activation disable path was observed. | Rollback and disable controls. |
| GAP-009 | productive_ui_entrypoint_approval_missing | high | Productive UI has active flows and dev routes coexist, but the approved UI entrypoints for chip activation are not defined. | Route allowlist by activation stage. |
| GAP-010 | tenant_scope_not_fully_proven | high | Session owner boundaries exist, but end-to-end tenant isolation for every write route is not proven in this inventory. | Route-by-route tenant and session ownership matrix. |
| GAP-011 | qa_coverage_for_activation_missing | high | There are many regression tests, but no single activation precheck test suite was observed for the whole organism. | Activation precheck suite covering authority, persistence, registry, UI and rollback. |
| GAP-012 | runtime_catalog_state_dirty | high | Worktree has EVE04 deleted/modified/untracked state; activation work must not use dirty candidate state without isolation. | Clean or explicitly isolated EVE04 bundle state. |
| GAP-013 | manual_visual_approvals_not_runtime_authority | medium | Manual visual approvals exist for dev harnesses, but these are not productive authority. | Explicit distinction between visual QA and production activation. |
| GAP-014 | external_ai_or_llm_boundary_unconfirmed | medium | OpenAI coach services and env vars exist; organism activation must define whether LLM calls are allowed, shadowed or disabled. | LLM boundary contract and audit logging. |

## 18. QA de activación

| Test | Aserción | Bloqueante |
| --- | --- | --- |
| ACT-QA-001 | No UI route imports chip TS or internal registry directly. | True |
| ACT-QA-002 | All productive write routes prove auth, tenant, session and activity scope. | True |
| ACT-QA-003 | All service-role calls are allowlisted, audited and tenant scoped. | True |
| ACT-QA-004 | Every side effect has idempotency key and reconciliation evidence. | True |
| ACT-QA-005 | Registry write, final export and parallel execution are not enabled in the same release. | True |
| ACT-QA-006 | EVE07 remains candidate-only before human release. | True |
| ACT-QA-007 | EVE08 audit identity is separated from executor identity. | True |
| ACT-QA-008 | All dev routes are disabled or access-restricted in production. | True |
| ACT-QA-009 | Rollback drill passes for each promoted capability. | True |
| ACT-QA-010 | Algedonic signal can quarantine a tenant/capability without global outage. | True |
| ACT-QA-011 | WorkMap H12 baseline is unchanged by Significado/runtime activation. | True |
| ACT-QA-012 | No raw text reaches diagnosis, IR, registry or final export. | True |
| ACT-QA-013 | Conformance is evaluated before cross-model consistency. | True |
| ACT-QA-014 | Manual review backlog and gate-generated human burden remain below approved thresholds. | True |
| ACT-QA-015 | All capability transitions have named approver and evidence bundle. | True |
| ACT-QA-016 | Post-activation monitor and recertification schedule exist before ACTIVE. | True |

## 19. Regla derivada de conexión cerebral

`brainConnectionEnabled` es un valor de lectura: true only when all required capabilities are at or above the requested ring state and no hard blocker is open; this field is read-only.

`productiveActivationAllowed` permanece `false` mientras exista cualquier gap crítico abierto.

## 20. Dictamen

`READY_AS_RECTOR_CONTRACT; PRODUCTIVE_ACTIVATION_BLOCKED_UNTIL_GAPS_AND_GATES_CLOSE`

Siguiente paso: transducir este contrato a guards, feature flags, tests y diseño del Composition Root en modo shadow. No activar side effects productivos.
