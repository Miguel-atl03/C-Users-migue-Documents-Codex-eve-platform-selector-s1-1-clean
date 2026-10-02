# EVE 08 — Audit and Governance v0.1.1 Candidate

**Chip ID:** `EVE-08-AUDIT-AND-GOVERNANCE`  
**Versión:** `0.1.1-candidate`  
**Estado del artefacto:** `READY_FOR_INDEPENDENT_QA_RERUN`  
**Certificación:** `WORKBENCH_REPAIRED_NOT_REAUDITED`  
**Instalación:** `NOT_INSTALLED`  
**Activación:** `SHADOW_ONLY`  

> **WORKBENCH NOTICE.** Este artefacto fue reparado y todavía no está reaudited. Ninguna fila de proof se acepta como prueba final hasta una QA independiente. No existe autoridad productiva, registry write, export final, Producción Paralela real ni conexión al cerebro EVE.

## 1. Dictamen y propósito

`AUDIT_AND_GOVERNANCE_WORKBENCH_CONTENT_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN; NOT_INSTALLED; SHADOW_ONLY; NO PRODUCTIVE AUTHORITY`

Cerrar la gobernanza sistémica del cerebro EVE, Capa 1.0 y la interfaz de Producción Paralela mediante auditoría, versiones, checksums, overrides, revisión humana y QA de activación, sin asumir autoridad productiva.

## 2. Mesa de trabajo V1

| Campo | Valor |
| --- | --- |
| workbench_id | EVE08-WORKBENCH-CONTENT-SOURCE-STATE-REPAIR-V1 |
| trigger_dictamen | AUDIT_AND_GOVERNANCE_RECORD_RULE_QA_UNSATISFACTORY_RETURN_TO_WORKBENCH |
| performed_at | 2026-06-23T21:54:57Z |
| rules_changed | False |
| module_schemas_changed | False |
| semantic_meaning_changed | False |
| authorized_next_state | INDEPENDENT_RECORD_RULE_SOURCE_QA_RERUN |

### 2.1 Diagnóstico normalizado

| Métrica | Valor |
| --- | --- |
| duplicated_pending_rules_across_matrices | 71 |
| unique_source_proof_rows_requiring_rebind_or_alias_resolution | 87 |
| stale_a07_primary_proofs | 60 |
| manifest_aliases_unresolved | 27 |
| mapping_locators_prepared | 20 |
| system_state_rows_refreshed | 24 |
| module_evidence_bundles_prepared | 6 |

### 2.2 Estado preparado

| Métrica | Valor |
| --- | --- |
| source_proof_rows_ready | 244 |
| source_proof_unresolved | 0 |
| stale_a07_primary_proofs_remaining | 0 |
| manifest_aliases_resolved | 27 |
| source_to_target_locators_ready | 20 |
| system_state_rows_ready | 24 |
| d8_contextual_source_registered | True |
| accepted_as_final_proof | 0 |
| independent_qa_required | True |

## 3. Frontera de no-cableado

| Control | Valor |
| --- | --- |
| recommended_repo_path | docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/ |
| activation_mode | shadow_first |
| active_runtime_authority | False |
| product_wiring | False |
| database_migrations_applied | False |
| registry_write | False |
| diagnosis_enabled | False |
| final_export_enabled | False |
| final_transduction_enabled | False |
| parallel_production_enabled | False |
| automatic_promotion | False |
| human_approval_required | True |
| rollback_drill_required | True |
| runtimeAuthority | False |
| registryWrite | False |
| productWiring | False |
| eveBrainConnection | False |
| finalExportEnabled | False |
| parallelProductionEnabled | False |
| diagnosisEnabled | False |
| sqlEnabled | False |
| supabaseWrite | False |
| workbench_independent_qa_required | True |

## 4. Cadena de autoridad
- EVE00 method validity
- EVE01 constitutional boundaries and authority
- EVE02 downstream diagnostic vocabulary
- EVE03 canonical genealogy
- EVE04 executable 40+20 runtime catalog
- EVE05 MMABP gates
- EVE06 governed execution records
- EVE07 candidate parallel-production interface
- EVE08 audit and activation governance

## 5. Fuentes activas

| ID | Documento | Tipo | Rol | Freshness | Ruta | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
| EVE00 | EVE_00_Method_Kernel_v0_2.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.json | ecc63a64327a231d… |
| EVE00M | EVE_00_Method_Kernel_v0_2.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.manifest.json | 26ae34b319904e3d… |
| EVE01 | EVE_01_Agent_Constitution_v0_1.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/EVE_01_Agent_Constitution_v0_1.json | 9c5f553cb980a1cc… |
| EVE01M | EVE_01_Agent_Constitution_v0_1.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/EVE_01_Agent_Constitution_v0_1.manifest.json | f4ce860c2dd2e3c0… |
| EVE02 | EVE_02_Diagnostic_Ontology_v0_1.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.json | 16a430802765c37e… |
| EVE02M | EVE_02_Diagnostic_Ontology_v0_1.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.manifest.json | ca08f23f3cbee767… |
| EVE03 | EVE_03_Canonical_Catalog_v0_1.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.json | d34e9fc6fbc22664… |
| EVE03M | EVE_03_Canonical_Catalog_v0_1.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.manifest.json | ebbddb93a2d26868… |
| EVE04 | EVE_04_Runtime_Catalog_v0_2.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.json | 4c9b290b79760118… |
| EVE04M | EVE_04_Runtime_Catalog_v0_2.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.manifest.json | d0f624466a3b7aea… |
| EVE05 | EVE_05_Gate_Engine_v0_1.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.json | 7da3ab5891463bec… |
| EVE05M | EVE_05_Gate_Engine_v0_1.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.manifest.json | 296aa247e35b9705… |
| EVE06 | EVE_06_Execution_Engine_v0_1.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.json | da24945129cfd23b… |
| EVE06M | EVE_06_Execution_Engine_v0_1.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.manifest.json | 1361c676f0807c0f… |
| EVE07 | EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json | chip_json | compiled_predecessor_chip | CURRENT_EXACT_SNAPSHOT | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json | 0165cf66dbbf7fe2… |
| EVE07M | EVE_07_Parallel_Production_Interface_v0_1_2_candidate.manifest.json | chip_manifest | predecessor_manifest | CURRENT_EXACT_SNAPSHOT | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.manifest.json | f695e4ed0ea2c927… |
| D1 | Fundamentals of Business Architecture Modeling.pdf | pdf | supreme_mmabp_method | CURRENT_RECTOR_SOURCE | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf | 3dd3485afa518244… |
| D3 | EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | docx | system_integration_map | CURRENT_RECTOR_SOURCE | docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | 8b96eaa29282c042… |
| D4 | EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | docx | technical_implementation_authority | CURRENT_RECTOR_SOURCE | docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | b95256c7e32e14da… |
| D5 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | docx | runtime_governance | CURRENT_RECTOR_SOURCE | docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | fcda44fc8990ef0d… |
| D6 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | xlsx | runtime_executable_source | CURRENT_RECTOR_SOURCE | docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | 5be7bd2ed510c5f5… |
| ABRAIN | AUDIT_EVE_BRAIN_CHIPS_CONTENT_VS_RECTORS_V0.md | md | secondary_full_brain_audit | CURRENT_FILE | docs/audits/AUDIT_EVE_BRAIN_CHIPS_CONTENT_VS_RECTORS_V0.md | 3ee284e3528a1d75… |
| ABRAINJ | _eve_brain_chips_content_vs_rectors_v0.json | json | secondary_full_brain_machine_audit | CURRENT_FILE | docs/audits/_eve_brain_chips_content_vs_rectors_v0.json | ffde0fd1defe2640… |
| BRAINZIP | Cerebro EVE.zip | zip_snapshot | exact_predecessor_snapshot_archive | CURRENT_EXACT_SNAPSHOT | archive/Cerebro EVE.zip | 51cb92f476b8c7c2… |
| EVE07WB | CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_WORKBENCH_CONTENT_REPAIR_V1.md | closeout_md | current_workbench_change_classification | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_WORKBENCH_CONTENT_REPAIR_V1.md | 79028ece5ba014ea… |
| EVE07QA | CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_SOURCE_QA_V1_1.md | closeout_md | independent_record_rule_source_qa | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_SOURCE_QA_V1_1.md | a8cb0ec88b50561c… |
| EVE07ST | CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_STATIC_PACKAGE_TESTS_V1.md | closeout_md | static_package_test_evidence | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_STATIC_PACKAGE_TESTS_V1.md | 497fdb30482f9b32… |
| EVE07CLJ | _eve_07_parallel_production_interface_candidate_closeout_summary_v1.json | audit_json | candidate_closeout_machine_summary | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_summary_v1.json | 9d62d85df6443fa8… |
| EVE07FR | _eve_07_parallel_production_interface_candidate_closeout_file_reality_v1.json | audit_json | candidate_closeout_file_reality | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_file_reality_v1.json | 8e9e12d875f47372… |
| D8 | EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | xlsx | canonical_genealogy_context | CURRENT_RECTOR_SOURCE | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | 09531a66fde4c8f1… |
| EVE00ST | CLOSEOUT_EVE_00_METHOD_KERNEL_EXPANDED_PACKAGE_TESTS_V1.md | closeout_md | static_package_test_evidence | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_00_METHOD_KERNEL_EXPANDED_PACKAGE_TESTS_V1.md | 433efc8292d83226… |
| EVE00UI | CLOSEOUT_EVE_00_METHOD_KERNEL_SHADOW_DEV_HARNESS_TRACE_V1.md | closeout_md | shadow_ui_trace_evidence | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_00_METHOD_KERNEL_SHADOW_DEV_HARNESS_TRACE_V1.md | ac1d8037acff8538… |
| EVE01UI | CLOSEOUT_EVE_01_AGENT_CONSTITUTION_UI_TRACE_APPROVAL_V1.md | closeout_md | shadow_ui_trace_approval | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_01_AGENT_CONSTITUTION_UI_TRACE_APPROVAL_V1.md | 836c9b783dd1a589… |
| EVE02SP | CLOSEOUT_EVE_02_DIAGNOSTIC_ONTOLOGY_45_RULE_SOURCE_PROOF_MATRIX_V1.md | closeout_md | source_proof_matrix_closeout | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_02_DIAGNOSTIC_ONTOLOGY_45_RULE_SOURCE_PROOF_MATRIX_V1.md | 13ba41da0212dc0e… |
| EVE02UI | CLOSEOUT_EVE_02_DIAGNOSTIC_ONTOLOGY_UI_TRACE_APPROVAL_V1.md | closeout_md | shadow_ui_trace_approval | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_02_DIAGNOSTIC_ONTOLOGY_UI_TRACE_APPROVAL_V1.md | b570869e97bb42cc… |
| EVE03COR | CLOSEOUT_EVE_03_CANONICAL_CATALOG_PACKAGE_CORRECTION_V1.md | closeout_md | package_correction_closeout | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_03_CANONICAL_CATALOG_PACKAGE_CORRECTION_V1.md | 3bcdb722440cf728… |
| EVE03ST | CLOSEOUT_EVE_03_CANONICAL_CATALOG_STATIC_PACKAGE_TESTS_V1.md | closeout_md | static_package_test_evidence | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_03_CANONICAL_CATALOG_STATIC_PACKAGE_TESTS_V1.md | cbb65384dfee2c5f… |
| EVE03UI | CLOSEOUT_EVE_03_CANONICAL_CATALOG_SHADOW_UI_TRACE_APPROVAL_V1.md | closeout_md | shadow_ui_trace_approval | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_03_CANONICAL_CATALOG_SHADOW_UI_TRACE_APPROVAL_V1.md | 10ee4f2b50c211c6… |
| EVE04QA | CLOSEOUT_EVE_04_RUNTIME_CATALOG_RECORD_FIELD_SOURCE_QA_V1.md | closeout_md | record_field_source_qa | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_04_RUNTIME_CATALOG_RECORD_FIELD_SOURCE_QA_V1.md | f2f9e268bd040ed9… |
| EVE04UI | CLOSEOUT_EVE_04_RUNTIME_CATALOG_SHADOW_UI_TRACE_APPROVAL_V1.md | closeout_md | shadow_ui_trace_approval | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_04_RUNTIME_CATALOG_SHADOW_UI_TRACE_APPROVAL_V1.md | 3e65de4ba2ec0d9a… |
| EVE05QA | CLOSEOUT_EVE_05_GATE_ENGINE_INDEPENDENT_RECORD_RULE_SOURCE_QA_V1_4.md | closeout_md | independent_record_rule_source_qa | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_05_GATE_ENGINE_INDEPENDENT_RECORD_RULE_SOURCE_QA_V1_4.md | 172a54570f955b45… |
| EVE05CL | CLOSEOUT_EVE_05_GATE_ENGINE_CANDIDATE_CLOSEOUT_V1.md | closeout_md | candidate_closeout | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_05_GATE_ENGINE_CANDIDATE_CLOSEOUT_V1.md | 9a4e3bef4bd1badf… |
| EVE06QA | CLOSEOUT_EVE_06_EXECUTION_ENGINE_RECORD_RULE_SOURCE_QA_V1_1.md | closeout_md | independent_record_rule_source_qa | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_RECORD_RULE_SOURCE_QA_V1_1.md | f42a24e7088a6970… |
| EVE06UI | CLOSEOUT_EVE_06_EXECUTION_ENGINE_MANUAL_VISUAL_AUDIT_V1.md | closeout_md | manual_visual_audit | CURRENT_GOVERNANCE_EVIDENCE | docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_MANUAL_VISUAL_AUDIT_V1.md | d24f5a85f5115beb… |

## 6. Evidencia histórica excluida

| ID | Documento | Rol | Freshness | Ruta | Proof primario |
| --- | --- | --- | --- | --- | --- |
| A07T | AUDIT_EVE_07_SOURCE_MISMATCH_TRIAGE_V1.md | source_mismatch_governance_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |
| A07P | AUDIT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_SOURCE_PREFLIGHT_V1_RETRY.md | source_preflight_governance_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |
| A07TJ | _eve_07_source_mismatch_triage_v1.json | source_mismatch_machine_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |
| A07PJ | _eve_07_parallel_production_interface_source_preflight_v1_retry.json | source_preflight_machine_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |
| A07H | AUDIT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_SHADOW_HARNESS_V1.md | shadow_harness_human_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |
| A07HJ | _eve_07_parallel_production_interface_shadow_harness_v1.json | shadow_harness_machine_evidence | HISTORICAL_SUPERSEDED_EXCLUDED_FROM_ACTIVE_PROOF |  |  |

## 7. Dependencias

| Chip | Versión | Estado package | Certificación package | Instalación | Evidencia actual | Candidate not wired | Autoridad productiva |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVE-00-METHOD-KERNEL | 0.2.0 | corrected_platform_source_scope |  |  | METHOD_KERNEL_SHADOW_UI_TRACE_APPROVED | True | False |
| EVE-01-AGENT-CONSTITUTION | 0.1.0 | draft_ready_for_review |  |  | AGENT_CONSTITUTION_SHADOW_UI_TRACE_APPROVED | True | False |
| EVE-02-DIAGNOSTIC-ONTOLOGY | 0.1.0 | draft_ready_for_review |  |  | DIAGNOSTIC_ONTOLOGY_SHADOW_UI_TRACE_APPROVED | True | False |
| EVE-03-CANONICAL-CATALOG | 0.1.0 | READY_WITH_FLAGS |  |  | CANONICAL_CATALOG_SHADOW_UI_TRACE_APPROVED | True | False |
| EVE-04-RUNTIME-CATALOG | 0.2.0 | READY | VALIDATED | NOT_INSTALLED | RUNTIME_CATALOG_RECORD_FIELD_QA_SATISFACTORY | True | False |
| EVE-05-GATE-ENGINE | 0.1.0 | READY_FOR_SHADOW_INTEGRATION | ARTIFACT_VALIDATED_NOT_ACTIVATED | NOT_INSTALLED | GATE_ENGINE_CANDIDATE_SHADOW_DEV_HARNESS_APPROVED_NOT_WIRED | True | False |
| EVE-06-EXECUTION-ENGINE | 0.1.0 | READY_FOR_INDEPENDENT_QA_RERUN | WORKBENCH_REPAIRED_NOT_REAUDITED | NOT_INSTALLED | EXECUTION_ENGINE_RECORD_RULE_QA_SATISFACTORY | True | False |
| EVE-07-PARALLEL-PRODUCTION-INTERFACE | 0.1.2-candidate | READY_FOR_INDEPENDENT_QA_RERUN | WORKBENCH_REPAIRED_NOT_REAUDITED | NOT_INSTALLED | PARALLEL_PRODUCTION_INTERFACE_CANDIDATE_SHADOW_DEV_HARNESS_APPROVED_NOT_WIRED | True | False |

## 8. Módulos ejecutables

### 8.1 `audit_trail`

Registrar de forma inmutable, secuenciada y reproducible toda decisión, cambio, bloqueo, revisión, override, recomputación y transición de activación a lo largo de EVE00–EVE08.

| Campo | Valor |
| --- | --- |
| module_id | M8-AUDIT-TRAIL |
| entity_name | governance_audit_event |
| state_machine | ["created","verified","archived","superseded"] |
| outputs | ["governance_audit_event","audit_stream_verification","audit_replay_result"] |
| forbidden_outputs | ["final_diagnosis","productive_registry_write","final_export"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| audit_event_id | string | True |
| stream_id | string | True |
| sequence_number | integer | True |
| event_type | enum | True |
| object_type | string | True |
| object_id | string | True |
| actor_id | string\|null | True |
| actor_type | enum | True |
| case_id | string\|null | True |
| role_id | string\|null | False |
| activity_id | string\|null | False |
| run_id | string\|null | False |
| correlation_id | string | True |
| causation_event_id | string\|null | False |
| rule_refs | string[] | True |
| source_refs | string[] | True |
| prior_value | json\|null | False |
| new_value | json\|null | False |
| reason | string\|null | False |
| catalog_version_id | string\|null | False |
| chip_snapshot_id | string | True |
| previous_event_hash | sha256\|null | False |
| event_hash | sha256 | True |
| created_at | timestamp_utc | True |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | audit_trail |
| module_id | M8-AUDIT-TRAIL |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[0] |
| primary_excerpt | {"allowed_actions":["runtime_audit_trail"],"applies_to":["governance_event"],"assertion":"Toda decision de gate, bloqueo, reentry, manual review, override o export preview crea audit event.","blocked_actions":["unaudited_decision"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-001","label":"Audit trail por decision relevante","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"blocker","source_refs":["D4:SPEC:audit"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | a4dc95e8d409acc5799fae89c62bcdf5bf0eb6efc9e55a80309314b7f7b1f3fe |
| supporting_source_id | D4 |
| supporting_locator | table:4:row:19 |
| supporting_excerpt | runtime_audit_trail \| Bitácora de eventos y cambios. \| audit_id, run_id, actor_type, event_type, prior_value, new_value, reason, timestamp |
| supporting_excerpt_sha256 | e9a7ceecc345a81f3a43d7ed945d0fcdcc5c4e3329a6c4831c6c394fa7e052d8 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUD8-001 | creation | Toda decisión de gate, bloqueo, reentry, manual review, override, recomputación o export-preview crea un audit event. | governed decision occurs | append immutable audit event | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-002 | identity | Cada audit event posee audit_event_id globalmente único. | event id missing or reused | reject event persistence | blocker | D4:table:4:row:19 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-003 | ordering | Cada audit event registra sequence_number monotónico dentro de su stream. | sequence missing or non-monotonic | reject or quarantine stream | blocker | D4:table:4:row:19 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-004 | time | El timestamp de auditoría se registra en UTC y no lo aporta el cliente como autoridad. | timestamp missing, local-only or client-authoritative | assign trusted server timestamp | blocker | D4:table:4:row:19 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-005 | actor | El evento registra actor_id y actor_type; los actores automáticos declaran system_component_id. | actor metadata incomplete | block closure of event | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-006 | scope | Todo evento queda scopeado por case_id y, cuando aplica, role_id, activity_id y run_id. | scope is incomplete or crosses tenant/case | reject audit event and operation | blocker | EVE01:$.modules.audit_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-007 | object | El evento identifica object_type y object_id del registro afectado. | audited object cannot be reconstructed | block governed mutation | blocker | D4:table:4:row:19 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-008 | action | action usa un enum gobernado y no texto libre como única clasificación. | unknown action code | route to manual review | blocker | D4:table:3:row:13 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-009 | reason | Cambios de estado, overrides, reentry y emisión requieren reason no vacío. | required reason missing | block operation | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-010 | delta | Toda mutación registra prior_value y new_value o una razón explícita de no aplicabilidad. | mutation lacks before/after evidence | block operation | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-011 | source_trace | El evento conserva rule_id, gate_id, blocker_id y source_refs que causaron la decisión. | decision lacks normative trace | block closure and request source trace | blocker | EVE01:$.modules.source_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-012 | correlation | Eventos de una misma operación comparten correlation_id. | multi-event operation lacks correlation | mark audit incomplete | high | D4:table:3:row:13 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-013 | causation | Eventos derivados registran causation_event_id. | derived event has no causal predecessor | mark lineage gap | high | EVE06:$.integration_rules[10] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-014 | catalog_version | El evento registra catalog_version_id y versiones de chips aplicadas. | version context absent | block activation or replay | blocker | EVE01:$.modules.audit_authority_rules.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-015 | evidence_hash | El evento referencia hashes de evidence_item, variables o payloads relevantes. | evidence changed without detectable hash linkage | block verification | blocker | EVE07:$.integration_rules[15] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-016 | outcome | decision_outcome distingue pass, flag, block, reentry, manual_review y superseded. | outcome outside governed enum | reject event | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-017 | severity | severity se deriva de la regla aplicada y no puede reducirse silenciosamente. | severity is downgraded without audited override | block operation | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-018 | manual_review_link | Todo evento de revisión manual referencia manual_review_id. | manual review event lacks review record | block review closure | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-019 | override_link | Todo evento de override referencia override_id. | override event lacks override record | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-020 | retry | Retries registran attempt_number, prior_error y idempotency_key. | retry cannot be distinguished from duplicate | reject retry | blocker | EVE01:$.modules.audit_authority_rules.rules[6] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-021 | supersession | Correcciones superseden evidencia o payload previo; nunca lo borran. | prior governed record would be deleted | reject delete and create superseding record | blocker | EVE01:$.modules.audit_authority_rules.rules[8] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-022 | recompute | Una revisión genera eventos de invalidación, recomputación y resultado. | dependent state changes without recompute audit | block readiness | blocker | EVE06:$.integration_rules[10] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-023 | payload | Creación, envío, bloqueo y supersession de payloads quedan auditados. | payload lifecycle transition lacks audit | block transition | blocker | EVE07:$.integration_rules[13] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-024 | critical_routes | Todo cambio de B0/B2/B3/B7 se audita obligatoriamente. | critical route changes without audit event | block route state change | blocker | EVE01:$.modules.audit_authority_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-025 | b7_boundary | Cualquier intento B7/C20→IR/registry/export queda registrado como boundary violation. | direct projection is attempted | block and append violation event | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-026 | retention | Los eventos se archivan por política; no se purgan para ocultar contradicciones. | destructive purge requested | block purge and escalate | blocker | EVE01:$.modules.audit_authority_rules.rules[8] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-027 | immutability | Un evento persistido es inmutable; correcciones crean evento compensatorio. | in-place audit edit attempted | reject and create correction event | blocker | EVE06:$.integration_rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-028 | hash_chain | Cada stream de auditoría conserva previous_event_hash y event_hash. | hash chain broken | quarantine stream and block activation | blocker | EVE07:$.modules.scr_payload.rules[14] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-029 | replay | La bitácora debe reconstruir la decisión con la misma versión de reglas y fuentes. | replay cannot resolve versions or sources | block certification | blocker | EVE01:$.modules.audit_authority_rules.rules[5] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| AUD8-030 | export | La exportación del audit trail es candidate-only y nunca expone datos fuera del scope autorizado. | audit export crosses scope or becomes final product output | block export | blocker | EVE01:$.modules.audit_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

### 8.2 `version_control`

Gobernar identidad, semver, compatibilidad, dependencia, shadow, activación, supersession, rollback y snapshots de los chips EVE.

| Campo | Valor |
| --- | --- |
| module_id | M8-VERSION-CONTROL |
| entity_name | chip_version_record |
| state_machine | ["draft","candidate","shadow_ready","shadow_passed","activation_ready","active","superseded","archived","blocked"] |
| outputs | ["chip_version_record","dependency_compatibility_result","brain_snapshot_record","rollback_plan"] |
| forbidden_outputs | ["silent_hash_rewrite","in_place_version_overwrite","multiple_active_authorities"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| chip_id | string | True |
| package_id | string | True |
| version | semver | True |
| stage | string | True |
| status | string | True |
| certification_status | string\|null | False |
| installation_status | string\|null | False |
| activation_status | string\|null | False |
| dependency_lock | dependency_ref[] | True |
| source_lock | source_ref[] | True |
| change_class | enum | True |
| change_reason | string | True |
| supersedes | version_ref\|null | False |
| rollback_target | version_ref\|null | False |
| effective_from | timestamp_utc\|null | False |
| effective_to | timestamp_utc\|null | False |
| brain_snapshot_id | string | True |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | version_control |
| module_id | M8-VERSION-CONTROL |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[4] |
| primary_excerpt | {"allowed_actions":["register_checksum"],"applies_to":["governance_event"],"assertion":"Activacion de catalogo, chip o regla exige version, checksum y estado frozen/active cuando aplique.","blocked_actions":["activate_unversioned_catalog"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-005","label":"Version y checksum","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"high","source_refs":["D4:SPEC:QA_import","D5:CAT:version_control"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | cf5504b0c039729b4d11d10adc37a97b4c0776ce3e9d174bfff219f33e1a9507 |
| supporting_source_id | D4 |
| supporting_locator | table:4:row:2 |
| supporting_excerpt | runtime_catalog_version \| Versiona el runtime implementable y su fuente documental. \| catalog_version_id, version_label, status, source_xlsx_checksum, effective_from, frozen_at |
| supporting_excerpt_sha256 | 411e29aef89d9e860926fdb11756f6f4632a847f9d69f35e2ba7900aa0e24390 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VER8-001 | identity | Cada chip conserva chip_id inmutable y package_id/version separados. | chip identity changes across versions | block package intake | blocker | EVE01M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-002 | semantic_version | version usa major.minor.patch y sufijo candidate cuando no es activo. | version label is malformed or ambiguous | reject package | blocker | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-003 | stage | stage identifica exactamente una fase 00–08. | stage missing or duplicated | reject package | blocker | EVE04M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-004 | status | status y certification_status son campos distintos y no se colapsan. | artifact status is used as certification proof | block promotion | blocker | EVE06M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-005 | installation | installation_status no se infiere desde certificación. | certified artifact is treated as installed | block activation | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-006 | dependency_lock | Toda versión congela versiones y hashes de dependencias requeridas. | dependency version/hash missing | block package activation | blocker | EVE07M:$.dependencies | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-007 | source_lock | Toda compilación registra versiones y SHA de fuentes rectoras usadas. | source version or checksum absent | block source certification | blocker | EVE01:$.modules.audit_authority_rules.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-008 | generated_at | generated_at usa UTC y forma parte del provenance, no del hash semántico si la política lo excluye. | build time missing or non-UTC | flag build metadata | medium | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-009 | change_reason | Toda versión posterior registra change_reason y alcance. | version increments without change reason | block package publication | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-010 | change_class | Cada cambio se clasifica como metadata, compatible, contract-breaking o source-fidelity repair. | change class absent | require manual review | blocker | EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-011 | candidate_active | Una versión candidate no puede declararse active. | candidate suffix with active authority | block activation | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-012 | shadow_first | Los chips 05–08 ingresan shadow-first antes de autoridad activa. | direct productive activation requested | block and require shadow harness | blocker | EVE05M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-013 | no_overwrite | Una versión nueva no sobrescribe el directorio ni artefactos de la anterior. | in-place package overwrite attempted | reject publication | blocker | EVE07:$.modules.scr_payload.rules[13] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-014 | frozen_xlsx | Las fuentes XLSX operativas se congelan por versión y checksum. | runtime reads mutable workbook | block catalog load | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-015 | effective_period | La versión activa declara effective_from y, al supersederse, effective_to. | active version lacks effective period | block active status | blocker | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-016 | supersedes | Una nueva versión declara supersedes_package_id/version. | replacement relation missing | flag lineage gap | blocker | EVE07:$.modules.scr_payload.rules[13] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-017 | rollback_target | Toda activación declara rollback_target previamente validado. | activation has no rollback target | block activation | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-018 | migration_state | database_migration_state se registra separado de package installation. | migration assumed from package presence | block runtime authority | blocker | EVE06M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| VER8-019 | compatibility | Compatibilidad se prueba contra superficies consumidas, no por igualdad de nombre. | dependency hash changes without compatibility analysis | run mismatch triage | blocker | EVE07ST:## 3-7 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-020 | source_mismatch | Un SHA mismatch bloquea preflight hasta triage de equivalencia o regeneración. | declared SHA differs from actual | block shadow harness | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-021 | equivalence | La equivalencia funcional requiere locators, schemas, rule IDs y fronteras sin cambios incompatibles. | mismatch triage lacks contract evidence | block hash-only update | blocker | EVE07ST:## 3-7 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-022 | breaking_change | Un cambio incompatible obliga a regenerar downstream; no se resuelve actualizando hashes. | schema or semantic contract changed | block downstream package | blocker | EVE01:$.modules.audit_authority_rules.rules[9]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-023 | artifact_parity | DOCX, MD, JSON y TS deben declarar la misma identidad y versión. | artifact identity/version diverges | block certification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-024 | manifest_parity | Manifest y artefactos deben coincidir en nombres, tamaños y hashes. | artifact inventory mismatch | block package intake | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| VER8-025 | obsolete_labels | No se permiten etiquetas de versión obsoletas en campos de autoridad. | old version label remains in operational metadata | block activation | blocker | D4:paragraph:301 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-026 | activation_state_machine | Estados permitidos: draft, candidate, shadow_ready, shadow_passed, activation_ready, active, superseded, archived, blocked. | invalid or skipped transition requested | block transition | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-027 | single_active | Solo una versión por chip puede tener active_runtime_authority=true en un scope. | multiple active versions detected | block all conflicting authorities | blocker | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-028 | archive | Las versiones superseded se archivan con checksums; no se eliminan. | superseded package deletion requested | block deletion | blocker | EVE01:$.modules.audit_authority_rules.rules[8] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-029 | brain_snapshot | Cada promoción crea brain_snapshot_id con las versiones exactas 00–08. | activation lacks full dependency snapshot | block activation | blocker | EVE01:$.modules.audit_authority_rules.rules[5] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| VER8-030 | snapshot_root | El snapshot del cerebro se identifica por root hash de paths, versiones y checksums ordenados. | brain snapshot root cannot be reproduced | block certification | blocker | EVE07:$.modules.scr_payload.rules[14] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

### 8.3 `checksum_registry`

Mantener inventario criptográfico reproducible de fuentes, chips, manifests, matrices, auditorías, paquetes y snapshots.

| Campo | Valor |
| --- | --- |
| module_id | M8-CHECKSUM-REGISTRY |
| entity_name | checksum_registry_entry |
| state_machine |  |
| outputs | ["checksum_registry_entry","artifact_inventory","brain_root_hash","checksum_incident"] |
| forbidden_outputs | ["automatic_hash_mutation","productive_registry_write"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| checksum_entry_id | string | True |
| canonical_path | string | True |
| artifact_kind | enum | True |
| version_ref | string\|null | False |
| algorithm | literal:sha256 | True |
| file_sha256 | sha256 | True |
| canonical_content_sha256 | sha256\|null | False |
| size_bytes | integer | True |
| source_or_derived | enum | True |
| observed_at | timestamp_utc | True |
| observed_by | string | True |
| supersedes_checksum_entry_id | string\|null | False |
| verification_status | enum | True |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | checksum_registry |
| module_id | M8-CHECKSUM-REGISTRY |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[4] |
| primary_excerpt | {"allowed_actions":["register_checksum"],"applies_to":["governance_event"],"assertion":"Activacion de catalogo, chip o regla exige version, checksum y estado frozen/active cuando aplique.","blocked_actions":["activate_unversioned_catalog"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-005","label":"Version y checksum","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"high","source_refs":["D4:SPEC:QA_import","D5:CAT:version_control"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | cf5504b0c039729b4d11d10adc37a97b4c0776ce3e9d174bfff219f33e1a9507 |
| supporting_source_id | D4 |
| supporting_locator | table:24:row:5 |
| supporting_excerpt | T-016 checksum_registered \| Registrar checksum de XLSX y DOCX al activar catálogo. \| Checksum no nulo. |
| supporting_excerpt_sha256 | 92047695ba9902f35010f29c751d26956022315f5b0f45675fe0b496822a16b2 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CHK8-001 | algorithm | El algoritmo de checksum normativo es SHA-256. | unsupported or unspecified algorithm | reject registry entry | blocker | D4:table:24:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-002 | path | Cada checksum entry registra canonical_path relativo al repositorio o paquete. | path missing, absolute-only or ambiguous | reject registry entry | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-003 | size | Cada entry registra size_bytes junto con el hash. | size missing | flag incomplete inventory | high | EVE07FR:$.packageFiles | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-004 | artifact_type | Cada entry clasifica source, chip artifact, manifest, proof matrix, audit o package. | artifact type unknown | route to manual review | blocker | EVE01:$.modules.source_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-005 | source_derived | Fuente rectora y artefacto derivado nunca comparten identidad de autoridad. | derived artifact declared as source | block source certification | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-006 | manifest_self_hash | El manifest usa una política explícita de canonical self-hash. | self-hash policy missing or circular | block manifest certification | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| CHK8-007 | package_zip | El ZIP del paquete se verifica contra el inventario de artefactos antes de publicación. | zip entry missing, extra or mismatched | block package publication | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-008 | source_checksum | Cada fuente rectora compilada conserva SHA real y declarado. | source checksum missing | block source proof | blocker | EVE01:$.modules.audit_authority_rules.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-009 | dependency_checksum | Cada dependencia requerida conserva su SHA exacto en el snapshot. | dependency checksum absent | block activation | blocker | EVE07M:$.dependencies | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| CHK8-010 | proof_excerpt | Cada source-proof registra hash del extracto exacto usado. | proof excerpt hash missing | mark source proof unresolved | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-011 | mismatch_block | Un mismatch de checksum es blocker, no warning cosmético. | actual hash differs from declared | stop preflight | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-012 | equivalence_triage | Un mismatch solo puede resolverse mediante triage de equivalencia o regeneración. | hash updated without triage | block package | blocker | EVE01:$.modules.source_authority_rules.rules[5]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-013 | no_auto_rewrite | El registro no reescribe automáticamente hashes declarados para hacer pasar QA. | automatic hash mutation requested | reject and audit | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-014 | append_only | El checksum registry es append-only; correcciones superseden entradas. | registry entry deletion or overwrite attempted | reject mutation | blocker | EVE06:$.integration_rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-015 | long_path | La copia temporal para sortear path largo se usa solo para lectura y conserva hash del original. | temp copy used as authoritative artifact | block verification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-016 | docx_binary | DOCX se hashea como archivo OOXML binario; extracción de texto no sustituye el hash. | text extract hash used as file hash | reject checksum | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-017 | xlsx_binary | XLSX se hashea como archivo binario congelado. | sheet-level value hash replaces file checksum | reject activation | blocker | D4:paragraph:253 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-018 | json_canonical | JSON puede tener file_sha256 y canonical_content_sha256, con política documentada. | canonicalization unspecified | block self-integrity claim | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| CHK8-019 | ts_raw | TypeScript registra SHA del archivo exacto entregado. | compiled JS hash substituted for source artifact | flag inventory mismatch | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-020 | markdown_raw | Markdown registra SHA del archivo UTF-8 exacto. | normalized copy used without declaration | flag inventory mismatch | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-021 | proof_matrix | La source_proof_matrix tiene checksum propio y queda listada en manifest. | proof matrix absent from inventory | block source certification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-022 | cert_report | El certification_report tiene checksum propio y no se autocertifica sin QA externo. | report missing from inventory or treated as evidence by itself | block claim | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| CHK8-023 | audit_report | Cada audit report registra checksum y relación con paquete/snapshot. | audit evidence cannot be tied to artifact | block promotion | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-024 | brain_root | El brain root hash se calcula sobre lista ordenada path+sha+version. | root hash order or inputs unspecified | block snapshot verification | blocker | EVE07:$.modules.scr_payload.rules[14] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-025 | chain_of_custody | Cada entrada registra observed_at, observed_by y source_location. | custody metadata missing | flag verification incomplete | high | D4:paragraph:303 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-026 | duplicate_path | Dos hashes distintos para el mismo canonical_path y version requieren incidente. | duplicate conflicting entry found | block activation and open manual review | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-027 | missing_artifact | Un artefacto requerido ausente bloquea package intake. | required artifact missing | block staging | blocker | EVE07CLJ:$.dictamen | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-028 | checksum_before_activation | Todos los checksums requeridos se verifican antes de shadow y antes de active. | activation requested with unverified registry | block activation | blocker | D4:table:24:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| CHK8-029 | audit_staleness | Un audit cuyos hashes no coinciden con el paquete actual se marca stale y no prueba el estado actual. | audit references superseded artifact hash | block reliance on stale audit | blocker | EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| CHK8-030 | registry_export | El checksum registry puede exportarse como candidate evidence, nunca escribir registry productivo por sí mismo. | checksum registry used to authorize productive write | block export | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |

### 8.4 `override_log`

Registrar y controlar excepciones explícitas sin permitir bypass silencioso de método, rutas, QA, seguridad, diagnóstico o export.

| Campo | Valor |
| --- | --- |
| module_id | M8-OVERRIDE-LOG |
| entity_name | governance_override_record |
| state_machine | ["requested","under_review","approved","rejected","expired","executed","rolled_back","superseded"] |
| outputs | ["governance_override_record","override_evaluation","override_incident"] |
| forbidden_outputs | ["implicit_override","wildcard_override","final_export_enablement","registry_write_enablement"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| override_id | string | True |
| override_requested | boolean | True |
| requester_id | string | True |
| requester_role | string | True |
| scope | json | True |
| target_rule_id | string | True |
| reason | string | True |
| evidence_refs | string[] | True |
| prior_value | json\|null | False |
| proposed_new_value | json\|null | False |
| status | enum | True |
| approver_id | string\|null | False |
| approved_at | timestamp_utc\|null | False |
| override_audited | boolean | True |
| max_uses | integer | True |
| expires_at | timestamp_utc\|null | False |
| rollback_action | string\|null | False |
| audit_event_id | string\|null | False |
| manual_review_id | string\|null | False |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | override_log |
| module_id | M8-OVERRIDE-LOG |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[1] |
| primary_excerpt | {"allowed_actions":["record_override"],"applies_to":["governance_event"],"assertion":"Todo override registra actor_id, razon, alcance, prior_value, new_value y timestamp.","blocked_actions":["silent_override"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-002","label":"Override con campos obligatorios","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"blocker","source_refs":["D4:SPEC:security_audit"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | 9b6c0f369f3c405d17959108af05bfaad7cb1ea5fc999f9219f7ae962a6beed5 |
| supporting_source_id | D4 |
| supporting_locator | table:25:row:5 |
| supporting_excerpt | Override \| Todo override debe registrar actor_id, razón, alcance, prior_value, new_value y timestamp. |
| supporting_excerpt_sha256 | ed34811ea05f0139bbb22b5a2e190cac690250335a200fdcfec74d29ad93a3a6 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OVR8-001 | request | No existe override implícito; todo override comienza con overrideRequested=true. | behavior diverges without explicit request | block operation | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-002 | identity | Cada override posee override_id único. | override id missing or reused | reject override record | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-003 | actor | Registrar actor_id y actor_role autorizados. | actor missing or unauthorized | block override | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-004 | scope | Registrar alcance exacto: case, role, activity, run, route, rule, payload o package. | scope absent or wildcard | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-005 | reason | La razón es obligatoria, específica y verificable. | reason empty or generic | block override | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-006 | delta | Registrar prior_value y proposed_new_value. | before/after absent | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-007 | target_rule | Identificar rule_id, gate_id o blocker_id afectado. | normative target unknown | block override | blocker | EVE01:$.modules.source_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-008 | evidence | Adjuntar evidence_refs y source_refs que justifican la excepción. | override lacks evidence | route to manual review | blocker | EVE02:$.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-009 | time | Registrar requested_at y, cuando aplica, expires_at. | temporal bounds missing for temporary override | block temporary override | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-010 | approval | Registrar approver_id, approved_at y decision. | approval metadata incomplete | keep pending | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-011 | separation_of_duties | Overrides de severidad blocker requieren revisor distinto al solicitante. | requester equals sole approver | escalate manual review | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-012 | methodological | Overrides metodológicos MMABP requieren evidencia de realidad y revisión humana. | method rule bypass requested automatically | block and route to method review | blocker | EVE00:$.modules.fundamentals_mmabp_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-013 | critical_route | No se permite inferir o cerrar B0/B2/B3/B7 mediante override sin evidencia/confirmación. | critical route closure requested by override only | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-014 | b7_boundary | B7/C20 no puede obtener IR, registry, export o diagnóstico directo por override. | override requests direct B7 projection | hard block | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-015 | final_export | Un override no habilita final_export_enabled. | override requests final export | hard block | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| OVR8-016 | registry_write | Un override no habilita registry_write productivo. | override requests registry write | hard block | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| OVR8-017 | diagnosis | Un override no salta conformance/consistency para emitir diagnóstico final. | override requests diagnosis without structural evidence | hard block | blocker | EVE02:$.rules[1] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-018 | checksum | Un override no puede ignorar checksum mismatch; exige triage o regeneración. | checksum bypass requested | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[1]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| OVR8-019 | source_proof | Un override no convierte source proof unresolved en certified. | proof status bypass requested | block override | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| OVR8-020 | dependency | Un override no oculta dependencia faltante o incompatible. | dependency gate bypass requested | block activation | blocker | EVE01:$.modules.source_authority_rules.rules[5]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| OVR8-021 | wildcard | Se prohíben overrides globales o sin límite de scope. | wildcard scope detected | reject override | blocker | D4:table:25:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-022 | one_time | La excepción declara max_uses; por defecto es one-time. | unbounded use requested | block or require policy approval | blocker | D4:table:25:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-023 | supersession | Una corrección de override crea nueva revisión y supersede la anterior. | override record edited in place | reject edit | blocker | EVE01:$.modules.audit_authority_rules.rules[8] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-024 | rollback | Todo override aprobado declara rollback_action. | approved override lacks rollback | block execution | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-025 | audit_link | Todo override crea audit event y conserva audit_event_id. | override lacks audit link | block override | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-026 | manual_review_link | Todo override blocker se vincula a manual_review_id. | blocker override lacks review | keep pending | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-027 | status_machine | Estados: requested, under_review, approved, rejected, expired, executed, rolled_back, superseded. | invalid transition requested | block transition | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-028 | exb031 | Bloquear solo si overrideRequested=true y overrideAudited!=true. | overrideRequested && !overrideAudited | activate EXB-031 | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-029 | false_positive_guard | No bloquear cuando overrideRequested=false aunque overrideAudited=false. | no override requested | do not activate EXB-031 | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| OVR8-030 | post_approval | Un override auditado sigue sujeto a QA, readiness y activation gates restantes. | approved override is treated as full activation authority | block promotion | blocker | EVE01:$.modules.audit_authority_rules.rules[9] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

### 8.5 `manual_review`

Gobernar revisiones humanas de ambigüedad, contradicción, rutas, overrides, integridad, QA y activación sin reescribir evidencia.

| Campo | Valor |
| --- | --- |
| module_id | M8-MANUAL-REVIEW |
| entity_name | manual_review_record |
| state_machine | ["open","assigned","in_review","needs_reentry","approved","rejected","closed","superseded"] |
| outputs | ["manual_review_record","review_decision","reentry_instruction","escalation_event"] |
| forbidden_outputs | ["automatic_human_approval","final_diagnosis","productive_registry_write"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| manual_review_id | string | True |
| reason_code | enum | True |
| scope | json | True |
| opened_by_rule_id | string | True |
| reviewer_id | string\|null | False |
| reviewer_role | string\|null | False |
| evidence_refs | string[] | True |
| source_refs | string[] | True |
| status | enum | True |
| priority | enum | True |
| created_at | timestamp_utc | True |
| due_at | timestamp_utc\|null | False |
| decision | enum\|null | False |
| decision_reason | string\|null | False |
| reentry_target | string\|null | False |
| closed_at | timestamp_utc\|null | False |
| audit_event_ids | string[] | True |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | manual_review |
| module_id | M8-MANUAL-REVIEW |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[2] |
| primary_excerpt | {"allowed_actions":["authorized_manual_review"],"applies_to":["governance_event"],"assertion":"manual_review_required solo se resuelve por actor autorizado y queda auditado.","blocked_actions":["self_resolve_manual_review"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-003","label":"Manual review solo actor autorizado","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"blocker","source_refs":["D4:SPEC:security_audit"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | 4af8cdeacb9d1b3385d697cbe74e350a550e59fa92899cef33b00aae1490b3ec |
| supporting_source_id | D4 |
| supporting_locator | table:25:row:4 |
| supporting_excerpt | Manual review \| manual_review_required solo puede resolverse por actor autorizado y debe crear runtime_audit_trail. |
| supporting_excerpt_sha256 | 535644a1987a1f9bf2541540ba6747da32797130ba19458d9a3d6df87a4cae38 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MRV8-001 | creation | Crear manual_review cuando una regla o gate emite manual_review_required. | manual_review_required without review record | create review item and block closure | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-002 | identity | Cada revisión posee manual_review_id único. | review id missing or duplicated | reject review record | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-003 | reason_enum | manual_review_reason usa enum gobernado. | reason outside enum | reject or map through approved dictionary | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-004 | assignment | Asignar reviewer_id y reviewer_role autorizados. | reviewer missing or unauthorized | keep review unassigned and blocked | blocker | EVE06:$.modules.activity_runtime_run.rules[16] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-005 | separation | Overrides blocker requieren separación entre solicitante y revisor. | same actor controls request and approval | escalate review | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-006 | scope | La revisión conserva case_id, role_id, activity_id, run_id y objeto afectado. | review scope incomplete | block decision | blocker | EVE01:$.modules.audit_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-007 | evidence_packet | La cola incluye evidence_refs, variables, candidates, gates, gaps y source_refs relevantes. | review packet incomplete | request evidence reentry | blocker | EVE02:$.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-008 | rule_trace | La revisión identifica las reglas/gates/blockers que la abrieron. | normative cause missing | block review decision | blocker | EVE01:$.modules.source_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-009 | due_at | Registrar created_at, due_at y prioridad. | review SLA absent | flag governance debt | high | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-010 | state_machine | Estados: open, assigned, in_review, needs_reentry, approved, rejected, closed, superseded. | invalid review transition | block transition | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-011 | decision_enum | Decisiones permitidas: confirm, correct, reenter, reject, approve_override, require_regeneration. | free-form decision cannot map to action | block closure | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-012 | decision_reason | Toda decisión incluye rationale y evidencia usada. | decision reason missing | block closure | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-013 | reentry_target | needs_reentry declara bloque/interacción/ruta exacta. | reentry target ambiguous | keep blocked | blocker | D4:paragraph:262 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-014 | no_overwrite | La corrección del revisor supersede; no reescribe evidencia original. | review would overwrite evidence | reject mutation | blocker | EVE01:$.modules.audit_authority_rules.rules[8] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-015 | semantic_ambiguity | Ambigüedad de clase/estado/atributo/proceso puede abrir revisión manual. | semantic gate unresolved | open semantic review | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-016 | route_missing | route_missing o ruta crítica incompleta abre revisión/reentry según severidad. | canonical route cannot close | open route review | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-017 | contradiction | Contradicción entre evidencia/modelos abre revisión después de conformance. | consistency contradiction established | open contradiction review | blocker | EVE05:$.modules.mmabp_consistency_gate.engine_rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-018 | b7_risk | Riesgo de frontera B7 abre revisión; no produce salida directa. | B7 boundary risk detected | open review and block projection | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-019 | evidence_insufficient | Evidencia insuficiente abre gap/reentry, no una respuesta ficticia. | required evidence absent | open review or reentry | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-020 | override_request | Override request abre revisión obligatoria cuando afecta blocker. | blocker override requested | open override review | blocker | D4:table:23:row:11 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-021 | checksum_mismatch | Checksum mismatch abre incidente de fuente y bloquea activación. | actual hash differs | open source integrity review | blocker | EVE01:$.modules.audit_authority_rules.rules[9]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| MRV8-022 | dependency_mismatch | Cambio de dependencia requiere revisión de equivalencia. | dependency hash/version changed | open compatibility review | blocker | EVE01:$.modules.source_authority_rules.rules[5]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| MRV8-023 | source_proof_gap | Source proof faltante o unresolved abre revisión de fidelidad. | proof missing or uncertified | open source review | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| MRV8-024 | qa_failure | QA blocker fallido abre revisión y no puede cerrarse como waiver silencioso. | blocking QA fails | open QA review | blocker | EVE01:$.modules.audit_authority_rules.rules[9] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-025 | escalation | Revisiones vencidas o conflictivas escalan a autoridad superior. | due_at exceeded or conflict detected | escalate and audit | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-026 | conflict_of_interest | El revisor declara conflictos de interés. | conflict present | reassign review | blocker | D4:paragraph:303 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-027 | audit_event | Asignación, decisión, reentry y cierre generan audit events. | review lifecycle changes | append audit events | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-028 | closure_gate | La revisión solo cierra cuando blockers asociados están resueltos o formalmente rechazados. | open blocker remains | prevent closure | blocker | EVE06:$.modules.activity_runtime_run.rules[16] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-029 | no_auto_approval | Ningún modelo automático aprueba revisión manual por sí solo. | automated approval attempted | block and require human authority | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| MRV8-030 | output_boundary | La revisión produce decisión gobernada, no diagnóstico final ni registry/export directo. | review result is routed to final output | block output | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

### 8.6 `qa_activation_tests`

Ejecutar gates de paquete, fuente, artefacto, compatibilidad, shadow, seguridad, rollback y activación sobre el cerebro EVE completo.

| Campo | Valor |
| --- | --- |
| module_id | M8-QA-ACTIVATION-TESTS |
| entity_name | qa_activation_result |
| state_machine |  |
| outputs | ["qa_activation_result","activation_decision","activation_blocker_set","rollback_readiness_result"] |
| forbidden_outputs | ["automatic_active_promotion","unverified_product_wiring"] |

#### Esquema
| Campo | Tipo | Requerido |
| --- | --- | --- |
| qa_run_id | string | True |
| brain_snapshot_id | string | True |
| test_id | string | True |
| test_category | string | True |
| status | enum:pass\|flag\|fail\|blocked\|not_run | True |
| severity | enum | True |
| evidence_refs | string[] | True |
| actual | json\|null | False |
| expected | json\|null | False |
| blocker_code | string\|null | False |
| manual_review_id | string\|null | False |
| executed_at | timestamp_utc | True |

#### Evidencia de módulo
| Campo | Valor |
| --- | --- |
| module | qa_activation_tests |
| module_id | M8-QA-ACTIVATION-TESTS |
| primary_source_id | EVE01 |
| primary_locator | $.modules.audit_authority_rules.rules[9] |
| primary_excerpt | {"allowed_actions":["block_activation_on_QA_failure"],"applies_to":["governance_event"],"assertion":"Loader o chip activation se bloquea si falla QA requerido, metadata o columnas/campos obligatorios.","blocked_actions":["activate_with_failed_QA"],"corrective_action":"Crear audit trail, bloquear activacion o exigir actor autorizado.","depends_on":[],"emits":[],"fail_state":"audit_required","id":"AUD-010","label":"QA bloquea activacion","module":"audit_authority_rules","pass_condition":"El evento queda auditado, versionado y con autoridad validada.","required_evidence":["actor_id","timestamp","case_scope","rule_id"],"severity":"blocker","source_refs":["D4:SPEC:QA_import","D5:CAT:workbook_required_fields"],"trigger":"Audit, security, versioning or authority event occurs"} |
| primary_excerpt_sha256 | d79507539be2f299d66b82f967dbde33219962f43c52c8a5fcd4246ebfc92b1b |
| supporting_source_id | D4 |
| supporting_locator | paragraph:302 |
| supporting_excerpt | Además de QA T-001 a T-012, el loader del catálogo debe ejecutar pruebas de importación y versionado. Si falla una prueba bloqueante, el catálogo no puede activarse. |
| supporting_excerpt_sha256 | 4a23f3ff430877d7aa9bcd59a11d0e3e571b66c821fba4b7fe164e53d53fdbc1 |
| evidence_status | WORKBENCH_PREPARED_PENDING_INDEPENDENT_QA |

#### Reglas
| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA8-001 | package_exists | Cada paquete 00–08 existe en la ruta declarada. | required package missing | block activation | blocker | EVE07CLJ:$.dictamen | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-002 | required_artifacts | Cada paquete contiene JSON, manifest, MD y artefactos requeridos por su contrato. | required artifact missing | block staging | blocker | EVE07CLJ:$.dictamen | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-003 | json_parse | Todos los JSON principales y auxiliares parsean sin error. | JSON parse fails | block package | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-004 | manifest_parse | Todos los manifest parsean y declaran identidad. | manifest parse or identity fails | block package | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-005 | typescript_compile | TypeScript compila en modo estricto o queda marcado no ejecutable. | TS compile fails | block executable certification | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-006 | module_presence | Cada chip contiene exactamente los módulos requeridos para su fase. | required module missing | block integration | blocker | EVE01:$.modules.audit_authority_rules.rules[5] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-007 | dependency_presence | Todas las dependencias requeridas existen. | required dependency absent | block activation | blocker | EVE07FR:$.prerequisites | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-008 | dependency_versions | Las versiones de dependencia coinciden con el lock del paquete. | dependency version mismatch | run compatibility triage | blocker | EVE07FR:$.prerequisites + $.packageFiles + $.noProductMutation | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-009 | source_exists | Toda fuente rectora declarada existe y es legible. | source missing or unreadable | block source preflight | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-010 | source_sha | Los SHA declarados de fuentes coinciden con los reales. | source SHA mismatch | block and triage | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-011 | source_proof_rows | Toda regla/blocker requerido posee fila source-proof. | proof row missing | block source certification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-012 | source_proof_status | No hay source-proof unresolved ni uncertified en artefacto certificado. | unresolved proof exists | block certification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-013 | rule_artifact_coverage | Cada rule_id aparece en JSON, MD, TS y DOCX cuando aplica. | rule absent from an artifact | block artifact equivalence | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-014 | duplicate_ids | No hay IDs duplicados sin justificación. | duplicate ungoverned id found | block package | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-015 | count_parity | Conteos de manifest, JSON y matrices coinciden. | declared and actual counts diverge | block certification | blocker | EVE04M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-016 | manifest_inventory | Tamaños y hashes del manifest coinciden con artefactos. | artifact inventory mismatch | block package | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-017 | manifest_self_integrity | La política de self-hash del manifest se verifica. | canonical self hash fails | block package | blocker | EVE07M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-018 | brain_snapshot | El snapshot 00–08 tiene root hash reproducible. | snapshot root mismatch | block activation | blocker | EVE07:$.modules.scr_payload.rules[14] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-019 | method_boundary | Conformance se evalúa antes que consistency y diagnóstico. | pipeline order violated | block diagnosis/activation | blocker | EVE00:$.modules.fundamentals_mmabp_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-020 | diagnostic_boundary | EVE02 no produce diagnóstico final, IR, registry o export. | final diagnostic output detected | block activation | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-021 | catalog_coverage | EVE03/EVE04 preservan 164 nodos y cobertura 164/164. | node coverage incomplete | block runtime activation | blocker | EVE04M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-022 | runtime_budget | EVE04 conserva 40 base + 20 causales. | interaction counts deviate | block runtime activation | blocker | EVE04M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-023 | critical_routes | B0/B2/B3/B7 existen y no se cierran por inferencia no confirmada. | critical route integrity fails | block readiness | blocker | EVE01:$.modules.audit_authority_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-024 | semantic_gate | SEM gates requeridos existen y se aplican antes de MoC/OLC projection. | semantic gate missing/bypassed | block candidate | blocker | EVE05M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-025 | pst_gate | PST gates existen y bloquean esperas sin liberación/timer/salida. | PST coverage fails | block PF candidate | blocker | EVE05M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-026 | execution_records | EVE06 conserva runs, instances, responses, evidence, variables y candidates separados. | execution module/schema missing | block integration | blocker | EVE06M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-027 | subfield_persistence | Interacciones compuestas persisten subrespuestas separadas. | opaque single textbox persistence detected | block evidence materialization | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-028 | evidence_lineage | Evidence y variables preservan provenance, revisiones y supersession. | lineage incomplete | block structural candidate | blocker | EVE06:$.integration_rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-029 | payload_governance | EVE07 construye payloads solo desde registros gobernados. | raw response enters payload | block payload | blocker | EVE07:$.integration_rules[15] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-030 | b7_no_projection | B7-Q39/B7-Q40/C20 no generan MoC/IR/registry/export directo. | direct B7 projection found | hard block | blocker | D4:table:24:row:9 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-031 | c09_feedback | receiver_feedback no se deriva de satisfacción; route_missing se activa cuando corresponde. | feedback inferred from satisfaction or route absent | block PF/OLC and payload | blocker | D4:table:24:row:8 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-032 | exb031_vectors | EXB-031 pasa los tres vectores de override. | predicate or false-positive guard fails | block EVE07 integration | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-033 | no_productive_wiring | Los flags productivos permanecen false antes de aprobación. | registry/export/diagnosis/authority enabled prematurely | hard block | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-034 | audit_trail | Audit trail registra decisiones, overrides, reviews y activación. | required audit event missing | block activation | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-035 | override_controls | Todo override solicitado está auditado y aprobado según scope. | unaudited override exists | block activation | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-036 | manual_review_queue | No hay manual reviews blocker abiertos al activar. | blocking review open | block activation | blocker | EVE06:$.modules.activity_runtime_run.rules[16] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-037 | checksum_registry | Todos los artefactos y fuentes requeridos tienen checksum verificado. | unverified checksum exists | block activation | blocker | D4:table:24:row:5 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-038 | source_mismatch_triage | Cambios de hash tienen triage de equivalencia o regeneración. | mismatch lacks governance evidence | block activation | blocker | EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-039 | shadow_harness | Cada chip con activation_mode shadow_first tiene harness shadow aprobado. | shadow-first chip lacks passing harness evidence | block active promotion | blocker | D4:paragraph:266 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-040 | shadow_no_side_effects | El harness no escribe DB, registry, export final ni runtime productivo. | shadow side effect detected | hard block | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-041 | rollback_drill | Existe rollback target y prueba de reversión sin pérdida de audit trail. | rollback drill missing or failed | block active promotion | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-042 | activation_approval | La activación requiere aprobación humana autorizada y auditada. | approval absent | block activation | blocker | D4:table:25:row:4 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-043 | single_authority | No existen dos versiones activas del mismo chip/scope. | multiple authorities detected | block system | blocker | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-044 | scope_security | case/tenant/role/activity/run scopes están presentes y autorizados. | scope leakage detected | hard block | blocker | D4:table:25:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-045 | stale_audits | Audits con hashes de artefactos anteriores se marcan stale y no cuentan como prueba actual. | audit evidence hash differs from current artifact | block reliance | blocker | EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| QA8-046 | status_consistency | Status, certification, installation y activation no se contradicen. | state fields inconsistent | block promotion | blocker | EVE06M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-047 | dependency_qa | Downstream no se activa si upstream requiere QA rerun o está draft. | upstream state not acceptable | block downstream activation | blocker | EVE06M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| QA8-048 | brain_activation_decision | ActivationDecision enumera todos los blockers y no puede ser ready con blocker abierto. | decision omits blocker or marks ready incorrectly | block decision | blocker | EVE01:$.modules.audit_authority_rules.rules[9] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-049 | post_activation_monitor | Después de activar se verifican audit chain, error rate, rollback readiness y checksum drift. | post-activation monitor absent | flag active system and require review | high | D4:paragraph:303 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| QA8-050 | periodic_recertification | Cambios de fuente, dependencia, regla o entorno disparan recertificación. | material change without recertification | suspend authority | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |

## 9. Reglas de integración

| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT8-001 | architecture | EVE00 gobierna método; EVE08 no redefine MMABP. | always | enforce architecture boundary | blocker | EVE00:$.modules.fundamentals_mmabp_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-002 | architecture | EVE01 gobierna fronteras, autoridad y auditoría transversal. | always | enforce architecture boundary | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-003 | architecture | EVE02 permanece downstream y no emite diagnóstico final en Capa 1. | always | enforce architecture boundary | blocker | EVE02:$.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-004 | architecture | EVE03 conserva genealogía, códigos, variables y rutas críticas. | always | enforce architecture boundary | blocker | EVE03M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| INT8-005 | architecture | EVE04 gobierna la experiencia 40+20 y su versión congelada. | always | enforce architecture boundary | blocker | EVE04M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| INT8-006 | architecture | EVE05 decide gates; EVE08 audita su ejecución pero no la sustituye. | always | enforce architecture boundary | blocker | EVE05M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| INT8-007 | architecture | EVE06 produce registros gobernados; EVE08 registra lifecycle y QA. | always | enforce architecture boundary | blocker | EVE06M:$.counts | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| INT8-008 | architecture | EVE07 solo produce payloads/candidates; EVE08 no habilita salida final por sí solo. | always | enforce architecture boundary | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| INT8-009 | architecture | Toda decisión 00–08 conserva source_trace y dependency snapshot. | always | enforce architecture boundary | blocker | EVE01:$.modules.audit_authority_rules.rules[5] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-010 | architecture | Conformance precede consistency; consistency precede diagnóstico/export. | always | enforce architecture boundary | blocker | EVE00:$.modules.fundamentals_mmabp_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-011 | architecture | Catálogo Madre no se usa como entrevista visible; la reducción vive en EVE04. | always | enforce architecture boundary | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-012 | architecture | Interacciones compuestas persisten subcampos separados. | always | enforce architecture boundary | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-013 | architecture | B7/C20 no proyecta directamente a MoC/IR/registry/export. | always | enforce architecture boundary | blocker | D4:table:24:row:9 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-014 | architecture | receiver_feedback requiere ruta canónica distinta de satisfacción. | always | enforce architecture boundary | blocker | D4:table:24:row:8 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-015 | architecture | La revisión invalida derivados y genera recomputación auditada. | always | enforce architecture boundary | blocker | EVE06:$.integration_rules[10] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-016 | architecture | Toda activación exige checksums, QA, manual approval y rollback. | always | enforce architecture boundary | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| INT8-017 | architecture | Los mismatch de fuentes se resuelven por triage/regeneración, no por maquillaje de hashes. | always | enforce architecture boundary | blocker | EVE01:$.modules.source_authority_rules.rules[5]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| INT8-018 | architecture | Shadow debe ser side-effect free y no conferir autoridad activa. | always | enforce architecture boundary | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| INT8-019 | architecture | El estado del cerebro se calcula desde evidencia actual, no desde declaraciones internas del paquete. | always | enforce architecture boundary | blocker | EVE07CLJ:$ | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| INT8-020 | architecture | EVE08 cierra gobierno y auditoría; no sustituye Runtime, Gate Engine ni Producción Paralela. | always | enforce architecture boundary | blocker | D4:table:3:row:13 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

## 10. Failure guards

| ID | Categoría | Regla | Condición | Acción | Sev. | Fuentes | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FG8-001 | failure_guard | Decisión gobernada sin audit event. | missing_audit_event | block transition and create audit incident | blocker | EVE01:$.modules.audit_authority_rules.rules[0] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-002 | failure_guard | Paquete o run sin version lock. | missing_version_lock | block activation | blocker | EVE01:$.modules.audit_authority_rules.rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-003 | failure_guard | Checksum declarado no coincide. | checksum_mismatch | block and open source integrity review | blocker | EVE01:$.modules.audit_authority_rules.rules[4]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-004 | failure_guard | Audit refiere hashes distintos al paquete actual. | stale_audit | mark stale and require rerun | blocker | EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-005 | failure_guard | Override solicitado no auditado. | unaudited_override | activate EXB-031 and block | blocker | EVE07:$.modules.export_blockers.blocker_catalog[30] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-006 | failure_guard | Manual review resuelta por actor no autorizado. | unauthorized_review | reject resolution | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-007 | failure_guard | ActivationDecision ready con blocker abierto. | open_blocker | reject decision | blocker | EVE01:$.modules.audit_authority_rules.rules[9] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-008 | failure_guard | Regla sin source proof certificado. | source_proof_gap | block source certification | blocker | EVE07QA:## 3. Cobertura QA; ## 4. Resultado QA; ## 7. Certification report y source_proof_matrix | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-009 | failure_guard | Dependencia requerida ausente. | dependency_missing | block package activation | blocker | EVE07FR:$.prerequisites | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-010 | failure_guard | Dependencia cambió contrato consumido. | dependency_incompatible | require regeneration | blocker | EVE01:$.modules.source_authority_rules.rules[5]; EVE07WB:## 3-8 | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-011 | failure_guard | Más de una versión activa del mismo chip/scope. | multiple_active_versions | suspend conflicting authorities | blocker | D4:table:4:row:2 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-012 | failure_guard | Registry/export/diagnosis/authority activado antes de aprobación. | productive_wiring_early | hard block | blocker | EVE07CLJ:$.noCableado | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-013 | failure_guard | B7/C20 intenta MoC/IR/registry/export directo. | b7_direct_projection | hard block | blocker | D4:table:24:row:9 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-014 | failure_guard | receiver_feedback derivado de satisfacción. | feedback_from_satisfaction | block variable/payload | blocker | D4:table:24:row:8 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-015 | failure_guard | Pregunta compuesta persistida como texto único. | opaque_composite_response | reject evidence materialization | blocker | EVE04:$.integration_rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-016 | failure_guard | IA cierra ruta crítica sin evidencia confirmada. | critical_route_inferred | block route closure | blocker | EVE01:$.modules.audit_authority_rules.rules[3] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-017 | failure_guard | Evidencia previa borrada en vez de superseded. | evidence_deleted | reject mutation | blocker | EVE06:$.integration_rules[4] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-018 | failure_guard | Revisión cambia derivados sin audit/recompute. | recompute_not_audited | block readiness | blocker | EVE06:$.integration_rules[10] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-019 | failure_guard | Sistema automático aprueba manual review. | manual_review_autoapproved | reject approval | blocker | EVE01:$.modules.audit_authority_rules.rules[2] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-020 | failure_guard | Activación sin rollback target/drill. | rollback_missing | block activation | blocker | D4:paragraph:302 | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-021 | failure_guard | Acceso o evento cruza case/tenant/role. | scope_leak | hard block and incident | blocker | EVE01:$.modules.audit_authority_rules.rules[7] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |
| FG8-022 | failure_guard | Manifest no coincide con archivos. | manifest_artifact_mismatch | block package | blocker | EVE07ST:## 3. Cobertura EVE-07; ## 4. Tests ejecutados | WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA |
| FG8-023 | failure_guard | Status/certification/installation/activation se contradicen. | status_contradiction | open governance review | blocker | EVE06M:$.identity_or_root | WORKBENCH_ALIAS_RESOLVED_PENDING_INDEPENDENT_QA |
| FG8-024 | failure_guard | Root hash del cerebro no se reproduce. | brain_snapshot_unreproducible | block certification and activation | blocker | EVE07:$.modules.scr_payload.rules[14] | WORKBENCH_PROOF_PRESERVED_PENDING_INDEPENDENT_QA |

## 11. Source-to-target mappings

| ID | Fuente | Rol | Módulos destino | Ruta | Locator | Precisión | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STM8-001 | EVE00 | supporting | ["version_control","qa_activation_tests"] | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.json | $.modules + $.status | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-002 | EVE01 | primary | ["audit_trail","override_log","manual_review","qa_activation_tests"] | docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/EVE_01_Agent_Constitution_v0_1.json | $.modules.audit_authority_rules + $.modules.source_authority_rules | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-003 | EVE02 | supporting | ["manual_review","qa_activation_tests"] | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.json | $.modules + $.status | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-004 | EVE03 | supporting | ["version_control","checksum_registry","qa_activation_tests"] | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.json | $.modules.source_node_registry + $.modules.canonical_variables + $.counts | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-005 | EVE04 | supporting | ["version_control","checksum_registry","qa_activation_tests"] | docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.json | $.modules + $.counts + $.installation_status | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-006 | EVE05 | primary | ["audit_trail","manual_review","qa_activation_tests"] | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.json | $.modules + $.installation_contract | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-007 | EVE06 | primary | ["audit_trail","version_control","override_log","manual_review","qa_activation_tests"] | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.json | $.modules + $.installation_contract | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-008 | EVE07 | primary | ["audit_trail","version_control","checksum_registry","override_log","qa_activation_tests"] | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json | $.modules + $.installation_contract + $.workbench_repair | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-009 | D1 | supporting | ["qa_activation_tests"] | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf | sections 1.3.4; 4.1-4.5 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-010 | D3 | supporting | ["version_control","qa_activation_tests"] | docs/runtime/EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | sections 0; 1; 8; 10 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-011 | D4 | primary | ["audit_trail","version_control","checksum_registry","override_log","manual_review","qa_activation_tests"] | docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | sections 21; 23; 24; 27; 28 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-012 | D5 | supporting | ["version_control","qa_activation_tests"] | docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | sections 1; 6.3; 9; 11; 12 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-013 | D6 | supporting | ["version_control","checksum_registry","qa_activation_tests"] | docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | QA_Checklist; Implementation_Dictionaries; Parallel_Production_Contract | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-014 | EVE07WB | supporting | ["version_control","checksum_registry","manual_review","qa_activation_tests"] | docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_WORKBENCH_CONTENT_REPAIR_V1.md | ## 3-8 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-015 | EVE07ST | supporting | ["checksum_registry","qa_activation_tests"] | docs/audits/CLOSEOUT_EVE_07_PARALLEL_PRODUCTION_INTERFACE_STATIC_PACKAGE_TESTS_V1.md | ## 3-7 | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-016 | EVE07CLJ | secondary_execution_evidence | ["qa_activation_tests","audit_trail"] | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_summary_v1.json | $ | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-017 | EVE07FR | secondary_machine_execution_evidence | ["qa_activation_tests","checksum_registry"] | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_file_reality_v1.json | $.prerequisites + $.packageFiles + $.noProductMutation | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-018 | ABRAINJ | secondary_gap_evidence | ["manual_review","qa_activation_tests"] | docs/audits/_eve_brain_chips_content_vs_rectors_v0.json | $.dictamen + $.chips + $.blocking_gaps | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-019 | ABRAIN | historical_human_audit | ["audit_trail"] | docs/audits/AUDIT_EVE_BRAIN_CHIPS_CONTENT_VS_RECTORS_V0.md | document body; secondary audit only | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |
| STM8-020 | BRAINZIP | primary_snapshot_inventory | ["version_control","checksum_registry","qa_activation_tests"] | archive/Cerebro EVE.zip | canonical snapshot inventory | structured | WORKBENCH_LOCATOR_READY_PENDING_INDEPENDENT_QA |

## 12. Source-proof matrix

| Métrica | Valor |
| --- | --- |
| row_count | 244 |
| unique_rule_ids | 244 |
| workbench_proof_ready | 244 |
| workbench_proof_preserved | 157 |
| workbench_repaired | 60 |
| manifest_aliases_resolved | 27 |
| unresolved | 0 |
| accepted_as_final_proof | 0 |
| independent_qa_required | True |
| generic_locators_rejected | True |
| historical_a07_primary_proofs_remaining | 0 |

El detalle de 244/244 unidades vive en `EVE_08_Audit_And_Governance_v0_1_1_candidate.source_proof_matrix.json`.

## 13. System-state evidence

| ID | Sujeto | Ámbito | Resultado | Bloquea | Fuente | Locator | Acción |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SYS-EVE00-IDENTITY | EVE00 | chip_identity | pass | False | docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/EVE_00_Method_Kernel_v0_2.json | $.identity_or_root | none |
| SYS-EVE00-GOVERNANCE | EVE00 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_00_METHOD_KERNEL_EXPANDED_PACKAGE_TESTS_V1.md | ## 1. Dictamen | none |
| SYS-EVE01-IDENTITY | EVE01 | chip_identity | pass | False | docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/EVE_01_Agent_Constitution_v0_1.json | $.identity_or_root | none |
| SYS-EVE01-GOVERNANCE | EVE01 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_01_AGENT_CONSTITUTION_UI_TRACE_APPROVAL_V1.md | ## 1. Dictamen | none |
| SYS-EVE02-IDENTITY | EVE02 | chip_identity | pass | False | docs/chips/diagnostic-ontology/EVE_02_Diagnostic_Ontology_v0_1/EVE_02_Diagnostic_Ontology_v0_1.json | $.identity_or_root | none |
| SYS-EVE02-GOVERNANCE | EVE02 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_02_DIAGNOSTIC_ONTOLOGY_UI_TRACE_APPROVAL_V1.md | ## 1. Dictamen | none |
| SYS-EVE03-IDENTITY | EVE03 | chip_identity | pass | False | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.json | $.identity_or_root | none |
| SYS-EVE03-GOVERNANCE | EVE03 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_03_CANONICAL_CATALOG_SHADOW_UI_TRACE_APPROVAL_V1.md | ## 1. Dictamen | none |
| SYS-EVE04-IDENTITY | EVE04 | chip_identity | pass | False | docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.json | $.identity_or_root | none |
| SYS-EVE04-GOVERNANCE | EVE04 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_04_RUNTIME_CATALOG_RECORD_FIELD_SOURCE_QA_V1.md | ## 1. Dictamen | none |
| SYS-EVE05-IDENTITY | EVE05 | chip_identity | pass | False | docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/EVE_05_Gate_Engine_v0_1.json | $.identity_or_root | none |
| SYS-EVE05-GOVERNANCE | EVE05 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_05_GATE_ENGINE_CANDIDATE_CLOSEOUT_V1.md | ## 1. Dictamen | none |
| SYS-EVE06-IDENTITY | EVE06 | chip_identity | pass | False | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/EVE_06_Execution_Engine_v0_1.json | $.identity_or_root | none |
| SYS-EVE06-GOVERNANCE | EVE06 | governance_closure | pass | False | docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_RECORD_RULE_SOURCE_QA_V1_1.md | ## 1. Dictamen | none |
| SYS-EVE07-IDENTITY | EVE07 | chip_identity | pass | False | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/EVE_07_Parallel_Production_Interface_v0_1_2_candidate.json | $.identity_or_root | none |
| SYS-EVE07-GOVERNANCE | EVE07 | governance_closure | pass | False | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_summary_v1.json | $ | none |
| SYS-EVE03-EVE04-RECONCILIATION | EVE03↔EVE04 | cross_chip_consistency | pass | False | docs/audits/CLOSEOUT_EVE_04_RUNTIME_CATALOG_RECORD_FIELD_SOURCE_QA_V1.md | ## 1 Dictamen + CVAR-001 + coverageStatus | none |
| SYS-D8-CANONICAL-CONTEXT | D8 | canonical_context | pass | False | docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | Catalogo_Madre_Nodos; Source_Question_Registry; Canonical_Variables; Critical_Routes; Readiness_Reentry_Gaps | none |
| SYS-EVE06-SHADOW-HARNESS | EVE06 | shadow_evidence | pass | False | docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_MANUAL_VISUAL_AUDIT_V1.md | ## 1-10 | none |
| SYS-EVE07-CANDIDATE-CLOSEOUT | EVE07 | candidate_closeout | pass | False | docs/audits/_eve_07_parallel_production_interface_candidate_closeout_summary_v1.json | $.dictamen + $.noCableado + $.coverage | none |
| SYS-EVE08-PREVIOUS-LINEAGE | EVE08 | version_lineage | pass | False | EVE_08_Audit_And_Governance_v0_1_candidate/* | previous_package_file_hashes | preserve predecessor; do not overwrite |
| SYS-EVE08-WORKBENCH-STATE | EVE08 | workbench_state | flag | False | docs/audits/CLOSEOUT_EVE_08_AUDIT_AND_GOVERNANCE_WORKBENCH_CONTENT_REPAIR_V1.md | ## 1-12 | independent record/rule/source QA rerun |
| SYS-BRAIN-ACTIVATION-CONTROLS | FULL_BRAIN | brain_activation | block | True | docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/EVE_08_Audit_And_Governance_v0_1_1_candidate.json | $.activation_contract | complete rollback drill, human approval and single-active-authority switch plan |
| SYS-NO-CABLEADO-AGGREGATE | EVE00–EVE08 | no_cableado | pass | False | docs/chips/audit-and-governance/EVE_08_Audit_And_Governance_v0_1_1_candidate/EVE_08_Audit_And_Governance_v0_1_1_candidate.json | $.activation_contract + current candidate closeouts | none |

## 14. Evaluación inicial del cerebro

| Campo | Valor |
| --- | --- |
| activation_decision | BLOCKED |
| productive_authority | False |
| workbench_ready_for_independent_qa | True |
| interpretation | EVE08 may proceed only to independent QA. EVE00-EVE07 are candidate/shadow artifacts, not productively wired. Brain activation remains blocked by controlled-wiring, rollback, approval and security obligations. |

### 14.1 Bloqueadores actuales

| ID | Ámbito | Sev. | Razón | Acción |
| --- | --- | --- | --- | --- |
| BRAIN-BLK-CURRENT-001 | EVE00–EVE07 candidate chain | hard | Current closeouts show candidate/shadow maturity, but no governed productive installation or single active authority is authorized. | complete an explicit controlled-wiring plan per chip and brain-wide authority switch review |
| BRAIN-BLK-CURRENT-002 | EVE08 | hard | EVE08 workbench proof, alias, locator and system-state repairs are pending independent record/rule/source QA. | run EVE-08 independent QA rerun against the repaired package and exact source evidence |
| BRAIN-BLK-CURRENT-003 | brain activation | hard | Rollback drill evidence is absent. | complete and audit a rollback drill before authority promotion |
| BRAIN-BLK-CURRENT-004 | brain activation | hard | Human activation approval and single-active-authority switch evidence are absent. | record human approval and controlled single-authority cutover plan |
| BRAIN-BLK-CURRENT-005 | runtime security | hard | Runtime scope/tenant security and post-activation monitoring have not been executed for the integrated brain. | execute scoped security, monitoring and recertification controls in a future controlled-wiring phase |

## 15. Cierre de gobernanza

**Estado:** `WORKBENCH_REPAIRED_PENDING_INDEPENDENT_QA_AND_CONTROLLED_WIRING`

### Obligaciones abiertas

| ID | Ámbito | Acción | Bloquea |
| --- | --- | --- | --- |
| CLOSE-001 | EVE08 | independent record/rule/source QA rerun | True |
| CLOSE-002 | EVE00–EVE07 | explicit controlled-wiring decisions; candidate closeouts do not grant productive authority | True |
| CLOSE-003 | brain activation | rollback drill and human approval | True |
| CLOSE-004 | brain activation | single-active-authority switch, scope security and monitoring plan | True |

### Resuelto en esta mesa
- 27 manifest aliases resolved
- 60 stale A07 primary proof bindings replaced with current evidence
- D8 contextual genealogy source registered
- 24 system-state evidence rows refreshed from current closeouts
- 20 source-to-target mappings enriched with locators
- 6 module evidence bundles prepared
- historical evidence separated from active proof

## 16. Dictamen final

`AUDIT_AND_GOVERNANCE_WORKBENCH_CONTENT_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN; NOT_INSTALLED; SHADOW_ONLY; NO PRODUCTIVE AUTHORITY`

**Siguiente estado permitido:** `INDEPENDENT_RECORD_RULE_SOURCE_QA_RERUN`.

**Estados no autorizados:** instalación activa, runtimeAuthority, registry productivo, export final, Producción Paralela real, SQL/Supabase productivo y conexión al cerebro EVE.
