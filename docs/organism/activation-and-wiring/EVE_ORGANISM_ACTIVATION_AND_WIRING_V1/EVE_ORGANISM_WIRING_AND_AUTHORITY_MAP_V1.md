# EVE-ORGANISM-WIRING-AND-AUTHORITY-MAP-V1

**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Estado:** `RECTOR_MAP_READY_FOR_COMPOSITION_ROOT_SHADOW_DESIGN_WITH_BLOCKING_GAPS`  
**Cableado productivo:** **NO**

## 1. Propósito

Definir el mapa factual observado y el mapa objetivo de ensamblaje de EVE, separando experiencia, aplicación, operación, sistema nervioso, cognición, gobierno, persistencia y Producción Paralela. El mapa impide conexiones directas que concedan autoridad no autorizada.

## 2. Snapshot observado

- Nodos observados: 38
- Edges observados: 28
- Authority rows observadas: 16
- Rutas UI: 15
- Rutas API: 33
- Entidades: 16
- Gaps: 14

## 3. Fuentes

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


## 4. Principios de cableado

| Regla | Severidad | Contenido |
| --- | --- | --- |
| WIR-P-001 | hard | La UI cliente se conecta exclusivamente al CLIENT_BFF; nunca importa chips ni repositorios internos. |
| WIR-P-002 | hard | El COMPOSITION_ROOT ensambla y ordena capacidades; no interpreta evidencia ni ejecuta side effects. |
| WIR-P-003 | hard | Cada edge productivo debe declarar tenant, sesión, actividad, correlationId, idempotencyKey y versión de política. |
| WIR-P-004 | hard | EVE08 recibe eventos de todos los componentes por canal de auditoría independiente y no ejecuta la acción auditada. |
| WIR-P-005 | hard | EVE07 produce payloads candidate-only; registry y export final requieren RELEASE_ADAPTER. |
| WIR-P-006 | hard | Las rutas /dev permanecen fuera de producción y no otorgan autoridad. |
| WIR-P-007 | hard | WorkMap continúa hacia Significado sin reescribir Guardar, coverage o baseline H12. |
| WIR-P-008 | hard | El service-role no puede ser llamado desde UI, BFF o chips; solo desde adapter allowlisted y auditado. |
| WIR-P-009 | hard | El outbox publica solo después de commit local y conserva idempotencia, correlación, tenant y replay status. |
| WIR-P-010 | hard | Los chips se comunican por contratos tipados y eventos; no por acceso mutuo a estado interno. |
| WIR-P-011 | hard | La lectura diagnóstica EVE02 solo ocurre después de conformance y consistency gate. |
| WIR-P-012 | hard | Toda escritura irreversible se concentra en adapters de release separados del razonamiento y auditoría. |
| WIR-P-013 | hard | Admin observability y trace son superficies read-only; no comparten credenciales de escritura productiva. |
| WIR-P-014 | hard | Un edge sin evidencia de auth/tenant/RLS queda REVIEW_REQUIRED y no se promueve. |
| WIR-P-015 | hard | La ruta productiva no puede depender de dev harness, closeout o auditoría manual como runtime authority. |

## 5. Arquitectura objetivo por componentes

| Componente | Capa | Tipo | Anchor repo | Estado | Autoridad |
| --- | --- | --- | --- | --- | --- |
| CLIENT_UI | experience | ui | src/app/page.tsx | observed_productive_shell | intent_only |
| ADMIN_OBSERVABILITY_UI | experience | ui | src/app/admin/runtime-vsm/page.tsx | observed_read_surface | read_only |
| ADMIN_TRACE_UI | experience | ui | src/app/admin/significado-trace/ | observed_admin_trace | read_only |
| DEV_SHADOW_UI | experience | ui | src/app/dev/ | observed_dev_only | non_productive |
| CLIENT_BFF | application | bff | TO_BE_IMPLEMENTED | required | command_translation |
| COMPOSITION_ROOT | application | orchestrator | TO_BE_IMPLEMENTED | required | assembly_only |
| SESSION_BOUNDARY | application | security_adapter | src/lib/session-boundary.ts | observed | scope_validation |
| SUPABASE_CLIENT | persistence | client_adapter | src/lib/supabase.ts | observed | client_session |
| SUPABASE_SERVER | persistence | server_adapter | src/lib/supabase-server.ts | observed | bounded_repo_access |
| SERVICE_ROLE_ADAPTER | persistence | privileged_adapter | src/services/mba/server-supabase-client.mjs; src/services/parallel-production/runtime/repository.mjs | observed_high_risk | allowlisted_privileged_write |
| RUNTIME_ORCHESTRATOR | operation | service | TO_BE_BOUND_TO_EXISTING_SERVICES | required | run_coordination |
| WORKMAP_SERVICE | operation | service | src/services/work-map-* | observed | workmap_domain |
| SIGNIFICADO_SERVICE | operation | service | src/services/significado-* | observed | significado_domain |
| SCENE_RUNTIME | operation | service_group | src/app/api/scenes/** | observed | scene_domain |
| OBJECT_BINDING_ADAPTER | operation | adapter | TO_BE_IMPLEMENTED_OR_BOUND | required | candidate_binding |
| OUTBOX_ADAPTER | nervous_system | adapter | TO_BE_IMPLEMENTED | missing | event_publish |
| AUDIT_EVENT_SINK | governance | service | TO_BE_IMPLEMENTED_OR_BOUND_TO_EVE08 | required | append_only_audit |
| HUMAN_REVIEW_QUEUE | governance | service | TO_BE_IMPLEMENTED | missing | review_workflow |
| RELEASE_ADAPTER | governance | adapter | TO_BE_IMPLEMENTED | missing | approved_side_effect_dispatch |
| REGISTRY_WRITE_ADAPTER | governance | adapter | TO_BE_IMPLEMENTED | blocked | versioned_registry_write |
| EXPORT_RELEASE_ADAPTER | governance | adapter | src/app/api/export/activity-collection-xlsx/route.ts | observed_route_but_authority_unverified | approved_export_only |
| PARALLEL_PRODUCTION_RUNTIME | parallel | service_group | src/app/api/parallel-production/**; src/services/parallel-production/** | observed_candidate_or_shadow | rehearsal_candidate |
| MBA_SHADOW_OBSERVER | governance | observer | src/services/mba/shadow-observer.js | observed_shadow_persistence | observe_only |
| EVE00_METHOD_KERNEL | cognition | chip | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/ | candidate | method_validation |
| EVE01_AGENT_CONSTITUTION | cognition | chip | docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/ | candidate | agent_boundary |
| EVE02_DIAGNOSTIC_ONTOLOGY | cognition | chip | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/ | candidate | candidate_pathology_only |
| EVE03_CANONICAL_CATALOG | cognition | chip | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/ | candidate | read_only_registry |
| EVE04_RUNTIME_CATALOG | cognition | chip | docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/ | dirty_or_work_in_progress | interaction_definition |
| EVE05_GATE_ENGINE | cognition | chip | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/ | candidate | gate_decision |
| EVE06_EXECUTION_ENGINE | cognition | chip | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/ | candidate | evidence_and_candidate_materialization |
| EVE07_PARALLEL_INTERFACE | cognition | chip | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/ | candidate | payload_candidate_only |
| EVE08_AUDIT_GOVERNANCE | governance | chip | docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/ | candidate | audit_block_review |

## 6. Composition Root

**Responsabilidades:** assemble_ports, propagate_scope, sequence_capabilities, record_correlation, enforce_capability_state

**Prohibido:** interpret_evidence, invent_route, write_database, write_registry, export_final, diagnose_final, approve_override

**Input:** `TypedOrganismCommand`  
**Output:** `OrganismDecisionEnvelope`


## 7. Secuencia cognitiva

1. EVE01_AGENT_CONSTITUTION validates requested action
2. EVE03_CANONICAL_CATALOG supplies versioned source/variable registry
3. EVE04_RUNTIME_CATALOG resolves interaction, branching and gaps
4. EVE06_EXECUTION_ENGINE materializes run, evidence, variables and candidates
5. EVE05_GATE_ENGINE evaluates critical, semantic, timer, conformance and consistency gates
6. EVE00_METHOD_KERNEL acts as MMABP tribunal inside gate evaluation
7. EVE02_DIAGNOSTIC_ONTOLOGY may classify only a candidate after MMABP pass
8. EVE07_PARALLEL_INTERFACE prepares candidate-only payloads
9. EVE08_AUDIT_GOVERNANCE receives independent audit events and may hold/degrade/quarantine

## 8. Edges objetivo

| ID | Desde | Hacia | Relación | Estado mínimo | Transferencia de autoridad |
| --- | --- | --- | --- | --- | --- |
| TGT-001 | CLIENT_UI | CLIENT_BFF | submit_intent | SUPERVISED | none |
| TGT-002 | CLIENT_BFF | SESSION_BOUNDARY | assert_tenant_session_activity_scope | SHADOW | none |
| TGT-003 | CLIENT_BFF | COMPOSITION_ROOT | send_typed_command | SHADOW | bounded_command |
| TGT-004 | COMPOSITION_ROOT | EVE01_AGENT_CONSTITUTION | validate_agent_action | SHADOW | decision_only |
| TGT-005 | COMPOSITION_ROOT | EVE03_CANONICAL_CATALOG | read_source_and_variable_registry | SHADOW | read_only |
| TGT-006 | COMPOSITION_ROOT | EVE04_RUNTIME_CATALOG | resolve_interaction_and_branching | SHADOW | definition_only |
| TGT-007 | COMPOSITION_ROOT | RUNTIME_ORCHESTRATOR | dispatch_scoped_runtime_command | SUPERVISED | bounded_execution |
| TGT-008 | RUNTIME_ORCHESTRATOR | EVE06_EXECUTION_ENGINE | materialize_run_evidence_variables_candidates | SHADOW | candidate_materialization |
| TGT-009 | EVE06_EXECUTION_ENGINE | EVE05_GATE_ENGINE | request_gate_evaluation | SHADOW | decision_only |
| TGT-010 | EVE05_GATE_ENGINE | EVE00_METHOD_KERNEL | validate_mmabp_conformance_consistency | SHADOW | method_decision |
| TGT-011 | EVE05_GATE_ENGINE | EVE03_CANONICAL_CATALOG | resolve_critical_route_and_semantic_binding | SHADOW | read_only |
| TGT-012 | EVE05_GATE_ENGINE | COMPOSITION_ROOT | return_gate_decision | SHADOW | advisory_or_hold |
| TGT-013 | COMPOSITION_ROOT | EVE02_DIAGNOSTIC_ONTOLOGY | classify_pathology_candidate_after_mmabp_pass | SUPERVISED | candidate_only |
| TGT-014 | EVE06_EXECUTION_ENGINE | EVE07_PARALLEL_INTERFACE | provide_governed_candidates | SHADOW | candidate_only |
| TGT-015 | EVE07_PARALLEL_INTERFACE | HUMAN_REVIEW_QUEUE | submit_candidate_payload | SUPERVISED | review_request |
| TGT-016 | HUMAN_REVIEW_QUEUE | RELEASE_ADAPTER | approved_release_instruction | CONTROLLED_ACTIVE | human_authorization |
| TGT-017 | RELEASE_ADAPTER | REGISTRY_WRITE_ADAPTER | execute_approved_registry_write | CONTROLLED_ACTIVE | single_use_scoped |
| TGT-018 | RELEASE_ADAPTER | EXPORT_RELEASE_ADAPTER | execute_approved_export | CONTROLLED_ACTIVE | single_use_scoped |
| TGT-019 | RELEASE_ADAPTER | PARALLEL_PRODUCTION_RUNTIME | execute_approved_parallel_handoff | CONTROLLED_ACTIVE | single_use_scoped |
| TGT-020 | RUNTIME_ORCHESTRATOR | OUTBOX_ADAPTER | enqueue_post_commit_event | SUPERVISED | event_publish |
| TGT-021 | OUTBOX_ADAPTER | EVE08_AUDIT_GOVERNANCE | emit_audit_and_governance_event | SHADOW | observe_only |
| TGT-022 | EVE00_METHOD_KERNEL | AUDIT_EVENT_SINK | append_method_decision | SHADOW | append_only |
| TGT-023 | EVE01_AGENT_CONSTITUTION | AUDIT_EVENT_SINK | append_constitution_decision | SHADOW | append_only |
| TGT-024 | EVE02_DIAGNOSTIC_ONTOLOGY | AUDIT_EVENT_SINK | append_candidate_classification | SHADOW | append_only |
| TGT-025 | EVE05_GATE_ENGINE | AUDIT_EVENT_SINK | append_gate_decision | SHADOW | append_only |
| TGT-026 | EVE06_EXECUTION_ENGINE | AUDIT_EVENT_SINK | append_materialization_event | SHADOW | append_only |
| TGT-027 | EVE07_PARALLEL_INTERFACE | AUDIT_EVENT_SINK | append_payload_candidate_event | SHADOW | append_only |
| TGT-028 | EVE08_AUDIT_GOVERNANCE | AUDIT_EVENT_SINK | append_governance_decision | SHADOW | append_only |
| TGT-029 | EVE08_AUDIT_GOVERNANCE | COMPOSITION_ROOT | hold_degrade_quarantine_signal | SUPERVISED | control_signal_only |
| TGT-030 | MBA_SHADOW_OBSERVER | AUDIT_EVENT_SINK | append_shadow_observation | SHADOW | append_only |
| TGT-031 | WORKMAP_SERVICE | SIGNIFICADO_SERVICE | continue_after_saved_workmap | SUPERVISED | flow_transition |
| TGT-032 | SIGNIFICADO_SERVICE | RUNTIME_ORCHESTRATOR | open_runtime_for_confirmed_activity | SUPERVISED | bounded_command |
| TGT-033 | SCENE_RUNTIME | RUNTIME_ORCHESTRATOR | scene_command_adapter | SUPERVISED | bounded_command |
| TGT-034 | INDEPENDENT_AUDITOR | EVE08_AUDIT_GOVERNANCE | submit_independent_finding | SHADOW | audit_input |

## 9. Matriz de autoridad objetivo

| Componente | Leer | Decidir | Escribir | Bloquear | Override | Export | Diagnóstico | Registry | Estado mínimo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CLIENT_UI | True | False | False | False | False | False | False | False | SUPERVISED |
| CLIENT_BFF | True | False | False | False | False | False | False | False | SHADOW |
| SESSION_BOUNDARY | True | True | False | True | False | False | False | False | SHADOW |
| COMPOSITION_ROOT | True | False | False | False | False | False | False | False | SHADOW |
| RUNTIME_ORCHESTRATOR | True | True | True | False | False | False | False | False | SUPERVISED |
| WORKMAP_SERVICE | True | True | True | True | False | False | False | False | SUPERVISED |
| SIGNIFICADO_SERVICE | True | True | True | True | False | False | False | False | SUPERVISED |
| SCENE_RUNTIME | True | True | True | True | False | False | False | False | SUPERVISED |
| EVE00_METHOD_KERNEL | True | True | False | True | False | False | False | False | SHADOW |
| EVE01_AGENT_CONSTITUTION | True | True | False | True | False | False | False | False | SHADOW |
| EVE02_DIAGNOSTIC_ONTOLOGY | True | True | False | False | False | False | candidate_only | False | SUPERVISED |
| EVE03_CANONICAL_CATALOG | True | False | False | False | False | False | False | False | SHADOW |
| EVE04_RUNTIME_CATALOG | True | True | False | False | False | False | False | False | SHADOW |
| EVE05_GATE_ENGINE | True | True | False | True | False | False | False | False | SHADOW |
| EVE06_EXECUTION_ENGINE | True | True | candidate_only | False | False | False | False | False | SHADOW |
| EVE07_PARALLEL_INTERFACE | True | True | candidate_only | True | False | False | False | False | SHADOW |
| EVE08_AUDIT_GOVERNANCE | True | True | audit_only | True | False | False | False | False | SHADOW |
| AUDIT_EVENT_SINK | True | False | append_only | False | False | False | False | False | SHADOW |
| HUMAN_REVIEW_QUEUE | True | True | review_record | True | False | False | False | False | SUPERVISED |
| RELEASE_MANAGER | True | True | authorization_record | True | True | False | False | False | CONTROLLED_ACTIVE |
| RELEASE_ADAPTER | True | False | allowlisted_side_effect | False | False | True | False | True | CONTROLLED_ACTIVE |
| REGISTRY_WRITE_ADAPTER | True | False | registry_only | False | False | False | False | True | CONTROLLED_ACTIVE |
| EXPORT_RELEASE_ADAPTER | True | False | export_only | False | False | True | False | False | CONTROLLED_ACTIVE |
| PARALLEL_PRODUCTION_RUNTIME | True | True | candidate_or_approved_handoff | True | False | False | False | False | SHADOW |
| SERVICE_ROLE_ADAPTER | True | False | allowlisted_db_write | False | False | False | False | False | CONTROLLED_ACTIVE |
| INDEPENDENT_AUDITOR | True | True | audit_finding | True | False | False | False | False | SHADOW |

## 10. Rutas y estado mínimo

| ID | Ruta | Categoría | Estado mínimo | Write authority | Nota |
| --- | --- | --- | --- | --- | --- |
| UI-01 | / | CLIENT_UI | SUPERVISED | False | Via BFF; no direct chip/internal data access. |
| UI-02 | /admin/runtime-vsm | ADMIN_READ | SHADOW | False | Read-only and operator-authorized. |
| UI-03 | /admin/significado-trace | ADMIN_READ | SHADOW | False | Read-only and operator-authorized. |
| UI-04 | /admin/significado-trace/[sessionId] | ADMIN_READ | SHADOW | False | Read-only and operator-authorized. |
| UI-05 | /dev/method-kernel-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-06 | /dev/agent-constitution-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-07 | /dev/diagnostic-ontology-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-08 | /dev/canonical-catalog-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-09 | /dev/runtime-catalog-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-10 | /dev/eve-05-gate-engine-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-11 | /dev/eve-06-execution-engine-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-12 | /dev/eve-07-parallel-production-interface-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-13 | /dev/eve-08-audit-and-governance-shadow | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-14 | /dev/e2e-block0 | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| UI-15 | /dev/significado | DEV_ONLY | OFF | False | Must be disabled or access-restricted in production. |
| API-01 | /api/audit/question-db-counts | ADMIN_READ | SHADOW | route_review_required | Read-only admin/health |
| API-02 | /api/causal/client-aggregation | SHADOW_DIAGNOSTIC | SHADOW | route_review_required | Candidate-only, no final diagnosis |
| API-03 | /api/causal/diagnostic | SHADOW_DIAGNOSTIC | SHADOW | route_review_required | Candidate-only, no final diagnosis |
| API-04 | /api/coach/operational-description/intro-example | REVIEW_REQUIRED | OFF | route_review_required | No activation without route review |
| API-05 | /api/coach/operational-description | REVIEW_REQUIRED | OFF | route_review_required | No activation without route review |
| API-06 | /api/diagnostics/session | SHADOW_DIAGNOSTIC | SHADOW | route_review_required | Candidate-only, no final diagnosis |
| API-07 | /api/export/activity-collection-xlsx | CONTROLLED_EXPORT | OFF | route_review_required | Human approval and scoped export required |
| API-08 | /api/health | ADMIN_READ | SHADOW | route_review_required | Read-only admin/health |
| API-09 | /api/intake/triple | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-10 | /api/mba-control-plane/observe | GOVERNANCE_SHADOW | SHADOW | route_review_required | Observe/report only |
| API-11 | /api/mba-control-plane/report | GOVERNANCE_SHADOW | SHADOW | route_review_required | Observe/report only |
| API-12 | /api/parallel-production/assessment/run | SHADOW_CANDIDATE | SHADOW | route_review_required | No final export/registry |
| API-13 | /api/parallel-production/candidate-export/generate | SHADOW_CANDIDATE | SHADOW | route_review_required | No final export/registry |
| API-14 | /api/parallel-production/design-source-bundle | SHADOW_CANDIDATE | SHADOW | route_review_required | No final export/registry |
| API-15 | /api/parallel-production/inventory/resolve | SHADOW_CANDIDATE | SHADOW | route_review_required | No final export/registry |
| API-16 | /api/parallel-production/mmabp-ir/project | SHADOW_CANDIDATE | SHADOW | route_review_required | No final export/registry |
| API-17 | /api/questionnaire/catalog | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-18 | /api/questionnaire/submit | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-19 | /api/rank-activities | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-20 | /api/runtime/observability | ADMIN_READ | SHADOW | route_review_required | Read-only admin/health |
| API-21 | /api/runtime/vsm | ADMIN_READ | SHADOW | route_review_required | Read-only admin/health |
| API-22 | /api/scenes/answers | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-23 | /api/scenes/bootstrap | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-24 | /api/scenes/canonicalize | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-25 | /api/scenes/consistency | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-26 | /api/scenes/derive | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-27 | /api/scenes/preclassify | SHADOW_DIAGNOSTIC | SHADOW | route_review_required | Candidate-only, no final diagnosis |
| API-28 | /api/scenes/runtime-contract-verify | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-29 | /api/session/bootstrap | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-30 | /api/session/intermediate-output | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-31 | /api/session/restore | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-32 | /api/significado/block0 | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |
| API-33 | /api/structural/confirm | PRODUCTIVE_DOMAIN | SUPERVISED | route_review_required | Tenant/session boundary and idempotency required |

## 11. Sistema nervioso: eventos

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

## 12. Propiedad de datos

| Entidad | Dominio | Writer autorizado | Tipo | Estado mínimo | Tenant requerido | Chip write prohibido |
| --- | --- | --- | --- | --- | --- | --- |
| usuarios | AUTH_TENANT_DOMAIN | SUPABASE_SERVER | identity_profile | SUPERVISED | True | True |
| empresas | AUTH_TENANT_DOMAIN | SUPABASE_SERVER | tenant_record | SUPERVISED | True | True |
| sesiones | SESSION_DOMAIN | SESSION_BOUNDARY | session_lifecycle | SUPERVISED | True | True |
| actividades | WORKMAP_DOMAIN | WORKMAP_SERVICE | activity_record | SUPERVISED | True | True |
| respuestas | RUNTIME_DOMAIN | RUNTIME_ORCHESTRATOR | response_record | SUPERVISED | True | True |
| ranking_actividades | WORKMAP_DOMAIN | WORKMAP_SERVICE | activity_ranking | SUPERVISED | True | True |
| metricas_por_capa | OBSERVABILITY_DOMAIN | AUDIT_EVENT_SINK | metrics_read_model | SHADOW | False | True |
| scene_registry | SCENE_DOMAIN | SCENE_RUNTIME | scene_registry_candidate | SUPERVISED | True | True |
| scene_answers | SCENE_DOMAIN | SCENE_RUNTIME | scene_answer | SUPERVISED | True | True |
| scene_preclassification | DIAGNOSTIC_CANDIDATE_DOMAIN | EVE02_DIAGNOSTIC_ONTOLOGY | candidate_only | SHADOW | True | True |
| scene_canonical_records | RUNTIME_DOMAIN | EVE06_EXECUTION_ENGINE | canonical_record | SUPERVISED | True | True |
| session_intermediate_output | SESSION_DOMAIN | RUNTIME_ORCHESTRATOR | intermediate_candidate | SUPERVISED | True | True |
| significado_block0 | SIGNIFICADO_DOMAIN | SIGNIFICADO_SERVICE | block0_answers | SUPERVISED | True | True |
| operational_description_coach_events | ASSISTANCE_DOMAIN | COACH_ADAPTER | non_authoritative_event | SHADOW | True | True |
| mba_shadow_observations_or_ledger | GOVERNANCE_DOMAIN | MBA_SHADOW_OBSERVER | shadow_observation | SHADOW | True | True |
| parallel_production_runtime_artifacts | PARALLEL_CANDIDATE_DOMAIN | PARALLEL_PRODUCTION_RUNTIME | candidate_only | SHADOW | True | True |

## 13. Edges prohibidos

| Desde | Hacia | Razón |
| --- | --- | --- |
| CLIENT_UI | EVE00..EVE08 | UI cannot import chips directly. |
| CLIENT_UI | SERVICE_ROLE_ADAPTER | Client cannot obtain privileged persistence authority. |
| EVE07_PARALLEL_INTERFACE | REGISTRY_WRITE_ADAPTER | Candidate interface cannot write active registry. |
| EVE07_PARALLEL_INTERFACE | EXPORT_RELEASE_ADAPTER | Candidate interface cannot issue final export. |
| EVE08_AUDIT_GOVERNANCE | productive domain repositories | Auditor cannot execute audited operation. |
| DEV_SHADOW_UI | productive routes | Dev harness cannot become production entrypoint. |
| EVE02_DIAGNOSTIC_ONTOLOGY | raw_text | Diagnosis cannot originate from raw text. |
| B7/C20 | IR/registry/export | B7/C20 direct projection forbidden. |
| receiver_satisfaction | receiver_feedback | Feedback requires canonical route. |
| COMPOSITION_ROOT | database | Composition root is not a repository. |
| ADMIN_OBSERVABILITY_UI | productive write service | Observability is read-only. |
| any component | final external side effect | Must pass ReleaseAdapter with human approval. |

## 14. VSM del cableado

| Función | Componentes |
| --- | --- |
| S1 | CLIENT_UI, WORKMAP_SERVICE, SIGNIFICADO_SERVICE, SCENE_RUNTIME, tenant activities |
| S2 | RUNTIME_ORCHESTRATOR, OUTBOX_ADAPTER, timers, branching, idempotency, reentry |
| S3 | SYSTEM_OPERATOR, RELEASE_MANAGER, controlled gate enforcement, resource/permission control |
| S3_star | INDEPENDENT_AUDITOR, EVE08_AUDIT_GOVERNANCE, AUDIT_EVENT_SINK, reconciliation probes |
| S4 | MBA_SHADOW_OBSERVER, divergence analytics, catalog/policy evolution |
| S5 | POLICY_OWNER, activation contract, identity/no-go boundaries |
| algedonic_channel | AlgedonicSignalRaised, quarantine, kill switch, rollback initiation |

## 15. Secuencia de migración

| Paso | Nombre | Resultado |
| --- | --- | --- |
| 1 | Freeze exact chip/source snapshot | All artifact hashes and lifecycle states registered. |
| 2 | Create passive composition root and typed ports | No side effects; contracts compile. |
| 3 | Wire independent audit channel | All chip decisions observable in shadow. |
| 4 | Run E2E shadow traffic copy | Official-vs-EVE divergences recorded and explainable. |
| 5 | Enable supervised capture/candidates | Real work, human release, no registry/export. |
| 6 | Enable one controlled write capability | Allowlisted effect with rollback drill. |
| 7 | Pilot Fase 9 through BFF | Client sees stable business views only. |
| 8 | Expand by deployment rings | Evidence-driven promotion and recertification. |

## 16. Gaps y bloqueo

| Gap | Severidad | Descripción | Evidencia pendiente |
| --- | --- | --- | --- |
| GAP-001 | critical | No single repo artifact defines the controlled organism activation contract across chips, runtime, UI, persistence, registry and rollback. | EVE-ORGANISM-CONTROLLED-ACTIVATION-CONTRACT-V1 |
| GAP-002 | critical | Observed authority surfaces are distributed across UI, API, Supabase clients, MBA service role services, registries and chip docs. | EVE-ORGANISM-WIRING-AND-AUTHORITY-MAP-V1 |
| GAP-003 | critical | Supabase persistence is present, but RLS, table policies, indexes and tenant isolation were not verified from database state. | DB schema, RLS policy and service-role write audit. |
| GAP-004 | critical | MBA and parallel production persistence can use service role keys. | Explicit service role allowlist, denylist, audit log and rollback design. |
| GAP-005 | critical | Shadow services and dev harnesses are present, but the allowed promotion path from shadow candidate to productive authority is not observed. | Promotion gate contract and human approval checkpoints. |
| GAP-006 | high | Registry and runtimeAuthority concepts exist, but a unified registry write policy for organism activation is not observed. | Registry authority table and write path audit. |
| GAP-007 | high | No canonical event bus/outbox contract was observed for organism-level activation. | Event/outbox schema and idempotency policy. |
| GAP-008 | high | No explicit kill switch, rollback ledger or activation disable path was observed. | Rollback and disable controls. |
| GAP-009 | high | Productive UI has active flows and dev routes coexist, but the approved UI entrypoints for chip activation are not defined. | Route allowlist by activation stage. |
| GAP-010 | high | Session owner boundaries exist, but end-to-end tenant isolation for every write route is not proven in this inventory. | Route-by-route tenant and session ownership matrix. |
| GAP-011 | high | There are many regression tests, but no single activation precheck test suite was observed for the whole organism. | Activation precheck suite covering authority, persistence, registry, UI and rollback. |
| GAP-012 | high | Worktree has EVE04 deleted/modified/untracked state; activation work must not use dirty candidate state without isolation. | Clean or explicitly isolated EVE04 bundle state. |
| GAP-013 | medium | Manual visual approvals exist for dev harnesses, but these are not productive authority. | Explicit distinction between visual QA and production activation. |
| GAP-014 | medium | OpenAI coach services and env vars exist; organism activation must define whether LLM calls are allowed, shadowed or disabled. | LLM boundary contract and audit logging. |

## 17. QA de cableado

| Test | Aserción | Bloqueante |
| --- | --- | --- |
| WIR-QA-001 | No forbidden edge exists in compiled graph. | True |
| WIR-QA-002 | Every target edge declares minimum stage and authority transfer. | True |
| WIR-QA-003 | Every write-capable component maps to exactly one bounded repository/adapter. | True |
| WIR-QA-004 | Every API route has route category, minimum stage and tenant review status. | True |
| WIR-QA-005 | Every data entity has authoritative writer, tenant rule and audit rule. | True |
| WIR-QA-006 | All chip decisions emit append-only audit events. | True |
| WIR-QA-007 | EVE08 can hold/degrade but cannot execute release side effects. | True |
| WIR-QA-008 | Service-role paths are unreachable from client and chip layers. | True |
| WIR-QA-009 | WorkMap → Significado → Runtime flow preserves frozen baseline. | True |
| WIR-QA-010 | Composition root has zero direct database imports and zero domain interpretation. | True |
| WIR-QA-011 | Outbox events include tenant, correlation, idempotency and replay status. | True |
| WIR-QA-012 | All dev routes are excluded from production route manifest. | True |
| WIR-QA-013 | All release edges require HumanReleaseDecision and rollbackPlanId. | True |
| WIR-QA-014 | Observed graph and target graph remain separately labeled. | True |

## 18. Dictamen

`READY_AS_RECTOR_WIRING_MAP; PRODUCTIVE_WIRING_BLOCKED_UNTIL_GAPS_AND_QA_CLOSE`

Siguiente paso: implementar el `EVE-ORGANISM-COMPOSITION-ROOT-SHADOW-V1` con ports/adapters y tests; no cablear writes productivos.
