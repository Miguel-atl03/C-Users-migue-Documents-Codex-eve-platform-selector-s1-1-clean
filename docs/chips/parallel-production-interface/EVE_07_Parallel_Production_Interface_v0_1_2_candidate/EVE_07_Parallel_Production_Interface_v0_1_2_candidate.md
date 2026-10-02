# EVE 07 Parallel Production Interface v0.1.2 candidate

**Estado:** `READY_FOR_INDEPENDENT_QA_RERUN`  
**Certificación:** `WORKBENCH_REPAIRED_NOT_REAUDITED`  
**Instalación:** `NOT_INSTALLED`  
**Activación:** `SHADOW_ONLY`

## Dictamen de mesa de trabajo

WORKBENCH_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN; exact source proof roles, source-to-target locator precision and certification claims repaired; candidate-only, not installed, without runtime authority, registry write, final export, final transduction or real Parallel Production.

Esta mesa de trabajo no certifica el paquete. Prepara evidencia exacta y sincroniza artefactos para una reauditoría independiente; no equivale a instalación, promoción productiva ni activación de Producción Paralela.

## Propósito

Compilar la interfaz que empaqueta SCR, EvidenceBundle y MDSB patches, proyecta MMABP-IR y registry candidates, y aplica export blockers antes de cualquier consumo shadow/rehearsal, sin activar diagnóstico, registry productivo, export final, transducción final ni Producción Paralela real.

## Módulos
- `scr_payload`
- `evidence_bundle_payload`
- `mdsb_payload`
- `mmabp_ir_candidate`
- `registry_candidate`
- `export_blockers`

## Cadena de autoridad
- D8 conserva genealogía, códigos y variables de origen.
- D7 decide la reducción 164→40+20 sin destruir trazabilidad.
- D5 gobierna fronteras B7/C09, QA y no-proyección directa.
- D6 ejecuta contratos de payload, mappings, rutas, gates y readiness como filas congeladas.
- D4 implementa parallel_export_payload, estados, seguridad, recomputación y esquemas cerrados.
- EVE04 entrega el catálogo runtime corregido y versionado.
- EVE05 decide gates antes de payload/IR/registry.
- EVE06 entrega evidencia, variables y structural candidates gobernados.
- D3 limita la interfaz a shadow/rehearsal/candidate-only y prohíbe producción/export/transducción final.
- D1 sigue siendo tribunal metodológico para PM/MoC/PF/OLC, conformance y consistency.

## Fuentes rectoras utilizadas
| ID | Documento | Rol | Uso | Secciones/hojas | SHA256 |
| --- | --- | --- | --- | --- | --- |
| D3 | EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | frontera primaria de integración con Producción Paralela | Sí | 0; 1; 2; 3; 4; 5; 6; 7; 8; 9; 10; 11; 12; 13 | 8b96eaa29282c042a714bbce80f0251e676425be91b766785e77c97f0c8bc31a |
| D4 | EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | contrato técnico primario de payloads e interfaz | Sí | 1; 2; 3; 4; 7; 8.3; 9; 10; 12; 13; 14; 15; 16; 17; 18; 20; 21; 23; 24; 25; 26; 27; 28 | b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8 |
| D5 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | gobierno operativo de fronteras, QA y no-proyección | Sí | 1; 2; 3; 4; 5; 6.1; 6.2; 6.3; 7; 8; 9; 10; 11; 12 | fcda44fc8990ef0d19379c3425afb4a69186f6961a6f99d541d170826da1e318 |
| D6 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | fuente implementable congelada | Sí | Parallel_Production_Contract; MMABP_Output_Map; Canonical_Variables; Critical_Routes; Semantic_Resolution_Gates; Process_State_Timer_Gates; Readiness_Gaps_Reentry; QA_Checklist; Implementation_Dictionaries | 5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0 |
| D8 | EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | genealogía canónica y fuente de nodos/variables | Sí | Catalogo_Madre_Nodos; Source_Question_Registry; Canonical_Variables; Critical_Routes; Readiness_Reentry_Gaps; Epistemic_Governance | 09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2 |
| EVE06 | EVE_06_Execution_Engine_v0_1.json | dependencia ejecutable de evidencia, variables y candidatos | Sí | modules.activity_runtime_run; modules.evidence_item; modules.canonical_variable_record; modules.structural_candidate_record; execution_pipeline; failure_guards; installation_contract | da24945129cfd23b6fd39739bc6b7c358a21b76ad5ee40e799a93bb8d276e1e5 |
| EVE05 | EVE_05_Gate_Engine_v0_1.json | dependencia ejecutable de gates MMABP | Sí | modules; execution_pipeline; failure_guards; enums; installation_contract | 7da3ab5891463bec6c1ffd90c410a3f6ee12e08d86827227d2a0ba7d62ecd9e4 |
| EVE04 | EVE_04_Runtime_Catalog_v0_2.json | dependencia ejecutable de catálogo runtime | Sí | modules; integration_rules; failure_guards; source_to_target_mapping; support; flags | 4c9b290b7976011850cdb6995c6f4bbc4d14ed3129e888eb235b9998a374b233 |
| EVE03 | EVE_03_Canonical_Catalog_v0_1.json | dependencia de source_node_registry | Soporte | modules.source_node_registry; modules.source_code_registry; modules.canonical_variables; modules.critical_routes; modules.epistemic_policy | d34e9fc6fbc226641996da98fb42cc69efdd98158460bf2b7db123917d0226f7 |
| D7 | Arquitectura_Runtime_40_20_EVE_MMABP.docx | frontera arquitectónica | Soporte | 0; 1; 2; 4; 5; 8; 10 | bee5478d5ef059641707a1e513f1977fbb3f25785754f1fa4eef93ddf9d774a2 |
| D1 | Fundamentals of Business Architecture Modeling.pdf | guardia metodológica MMABP | Soporte | 2.2.6; 2.3.6; 2.3.3; 3.1.5; 3.2.4; 4.1; 4.2; 4.3; 4.4; 4.5 | 3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147 |

## Fuentes explícitamente no activadas
- Instrucciones actualizadas para GPT personalizado.docx
- Instrucciones_Maestras_y_Exhaustivas_para_IA_Arquitectura_Mínima_de_Negocio_(MMABP)_y_Diagnóstico_EVE™.docx
- Tabla de Diagnóstico de Inconsistencias Estructurales EVE.docx (no activada: diagnóstico downstream)
- Marco de Interpretación y Observación Explicativo Arquitectura Humana Empresarial_(AHE).docx (no activado como diagnóstico)
- Organizational Systems Managing Complexity with the Viable System model.pdf (solo contexto ya capturado upstream; no asigna VSM aquí)

## Complementariedad documental
| Documento | Completa a | Relación | No sustituye |
| --- | --- | --- | --- |
|  | captura Capa 1 |  |  |
|  | D8 |  |  |
|  | D7 |  |  |
|  | D5 |  |  |
|  | D6 |  |  |
|  | D6 |  |  |
|  | D4/D6 |  |  |
|  | EVE04/EVE05 |  |  |
|  | D4 |  |  |
|  | todos |  |  |

## Reglas de integración
- **INT7-001:** D8→D7→D5→D6→D4→D3 es la cadena documental; EVE04/05/06 son compilaciones ejecutables intermedias.
- **INT7-002:** PDF/DOCX se compilan a reglas; no se ejecutan como narrativa ni se leen en runtime para decidir.
- **INT7-003:** D6 se consume como fuente congelada/versionada; no se interpreta narrativamente.
- **INT7-004:** La interfaz solo consume outputs gobernados de EVE06 y gate snapshots de EVE05.
- **INT7-005:** SCR/EvidenceBundle/MDSB son patches candidate-only; no mutan core ni equivalen a artefactos finales.
- **INT7-006:** MMABP-IR candidate y registry candidates se crean después de variables, routes, conformance, consistency y readiness.
- **INT7-007:** B7-Q39/B7-Q40/C20 jamás generan MoC/IR/registry/export/diagnóstico directo.
- **INT7-008:** C09 es la única ruta para receiver_feedback operativo; satisfaction no la sustituye.
- **INT7-009:** Subrespuestas compuestas permanecen separadas hasta EvidenceBundle y downstream.
- **INT7-010:** Todo elemento downstream conserva source_node/source_code/evidence/variable/candidate refs.
- **INT7-011:** Conformance se evalúa antes que consistency y ambos anteceden IR/registry candidates.
- **INT7-012:** No se exponen Object Inventory, Membrane, SG Shadow, bindings o No-Go técnicos al usuario final.
- **INT7-013:** La interfaz no ejecuta diagnóstico, export final, transducción final, registry activo ni Producción Paralela real.
- **INT7-014:** Toda corrección de respuesta invalida payloads/candidates dependientes y conserva audit trail.
- **INT7-015:** ready_with_flags puede avanzar solo con flags no bloqueantes explícitos; nunca se ocultan.
- **INT7-016:** Un payload sin checksum, autoridad, scope o versión no puede pasar a sent.

## Cadena ejecutable
| Orden | Paso | Función | Fuentes |
| --- | --- | --- | --- |
| 1 | validate_dependencies | Verificar EVE03/04/05/06, D3/D4/D5/D6/D8 y checksums. |  |
| 2 | load_execution_snapshot | Cargar run, evidence items, canonical variables, structural candidates, gaps y readiness. |  |
| 3 | evaluate_pre_export_blockers | Evaluar scope/version/provenance/routes/SEM/PST/conformance/consistency/readiness/authority. |  |
| 4 | build_scr_patch | Construir SCR patch si B0 y scope permiten; conservar gaps. |  |
| 5 | build_evidence_bundle_patch | Serializar evidencia/variables/rutas/readiness con provenance. |  |
| 6 | build_mdsb_patch | Serializar structural candidates/checkpoints/issue refs y export restriction. |  |
| 7 | evaluate_post_payload_blockers | Validar placeholders, checksums, stale refs, B7/C09 y estados. |  |
| 8 | build_mmabp_ir_candidate | Proyectar IR candidate partitioned por cuadrante, candidate-only. |  |
| 9 | build_registry_candidates | Crear PM/MoC/PF/OLC/Consistency/Readiness candidates sin active write. |  |
| 10 | persist_parallel_export_payload | Persistir draft/ready/blocked/superseded con versión y checksum. |  |
| 11 | emit_shadow_or_rehearsal | Emitir solo a consumidor autorizado shadow/rehearsal; no producción real. |  |
| 12 | audit_every_transition | Registrar actor, reason, prior/new state, source refs y timestamp. |  |

## Fronteras externas
| Frontera | Valor |
| --- | --- |
| object_inventory | {'allowed': 'candidate facts/identity preparation', 'forbidden': 'core replacement or final fact promotion'} |
| integration_membrane | {'allowed': 'versioned patches and blockers', 'forbidden': 'bypass No-Go or mutate core'} |
| sg_shadow | {'allowed': 'findings/routing/recommendations report-only', 'forbidden': 'enforcement or workflow mutation'} |
| parallel_production | {'allowed': 'rehearsal/candidate artifacts', 'forbidden': 'production real, final MDSB, final transduction'} |
| product_ui | {'allowed': 'safe status/continuity', 'forbidden': 'internal IDs, bindings, blockers, registry/IR internals'} |
| diagnostic_layer | {'allowed': 'none in Phase 7', 'forbidden': 'EVE/VSM/AHE final diagnosis'} |

## Fallas que deben bloquearse
| ID | Falla | Consecuencia | Bloque | Acción | Fuentes |
| --- | --- | --- | --- | --- | --- |
| FG7-001 | Usar Catálogo Madre como entrevista visible | Sobrecarga y ruptura 40+20. |  |  | D7; D5 |
| FG7-002 | Implementar desde narrativa DOCX | Payload ambiguo/no testeable. |  |  | D4:1; D5:2 |
| FG7-003 | B7 produce IR/registry/export directo | Diagnóstico/proyección prematura. |  |  | D5:6.3; D6!Critical_Routes |
| FG7-004 | Satisfaction convertida en receiver_feedback | Rework/PF/OLC falsos. |  |  | D5:6.2; D6!Critical_Routes |
| FG7-005 | Pregunta compuesta guardada como texto único | Pérdida de trazabilidad y QA. |  |  | D4:1; D5:4 |
| FG7-006 | IA infiere ruta crítica | Fabricación de hechos estructurales. |  |  | D6!Critical_Routes; EVE05 |
| FG7-007 | Exponer vísceras internas en UI | Contaminación de experiencia y seguridad. |  |  | D3!Table10 |
| FG7-008 | Saltar evidencia a diagnóstico | Violación Capa 1. |  |  | D3!Table5; D3!Table9 |
| FG7-009 | Texto libre crea structural candidate | IR/registry sin ruta canónica. |  |  | D6!Parallel_Production_Contract |
| FG7-010 | SEM/PST unresolved ignorado | MoC/OLC/PF inválidos. |  |  | D6!Semantic_Resolution_Gates; D6!Process_State_Timer_Gates |
| FG7-011 | Conformance/consistency omitidas | Candidatos incoherentes. |  |  | D1:4; EVE05 |
| FG7-012 | Candidate export tratado como export final | Promoción prematura. |  |  | D3!Table4; D3!Table5 |
| FG7-013 | MMABP-IR tratado como diagrama final | Diagramación sin gates completos. |  |  | D3!Table4 |
| FG7-014 | Registry candidate escribe registry activo | Contaminación de registros. |  |  | D3!Table9 |
| FG7-015 | Gap ocultado en payload | Readiness falsa. |  |  | D6!Readiness_Gaps_Reentry |
| FG7-016 | Evidencia superseded usada como activa | Payload stale. |  |  | D4:24 |
| FG7-017 | Payload sin scope/autorización | Fuga cross-tenant. |  |  | D4:27 |
| FG7-018 | Placeholders en payload cerrado | Contrato incompleto. |  |  | D4:23; D4:28 |
| FG7-019 | MDSB patch tratado como MDSB final | Transducción final no autorizada. |  |  | D3!Table9 |
| FG7-020 | Promoción productiva desde shadow | Producción real no gobernada. |  |  | D3:R4; D3:R8 |

## Módulo `scr_payload`

Construir un SceneCanonicalRecordPatch versionado que preserve ancla, salidas por bloque, gaps y genealogía sin mutar el core ni convertir preload/inferencia en evidencia dura.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["activity_runtime_run", "catalog_version_id", "activity_anchor", "canonical_variable_records", "readiness_decision"] |
| preconditions | ["B0 confirmed or reconstructed", "scope authorized", "critical routes evaluated"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| parallel_export_payload_id | string | True | Identificador del payload. |
| payload_type | enum | True | Tipo cerrado scr_patch. |
| payload_version | integer | True | Versión monotónica del patch. |
| run_id | string | True | Run de origen. |
| case_id | string | True | Scope de caso/tenant. |
| role_id | string | True | Rol funcional del run. |
| activity_id | string | True | Actividad primaria. |
| catalog_version_id | string | True | Versión congelada del runtime. |
| activity_anchor | object | True | Ancla confirmada con subcampos semánticos. |
| block_outputs | object | True | Variables por bloque construidas desde canonical_variable_record. |
| gaps | array | True | Gaps explícitos del run. |
| source_refs | array | True | Genealogía nodo/código/evidencia. |
| checksum_source | string | True | Checksum de contenido y fuentes. |
| payload_state | enum | True | Estado gobernado. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCRP-001 | eligibility | Emitir SceneCanonicalRecordPatch solo desde un activity_runtime_run existente y scopeado. | run missing or scope incomplete | block payload creation | blocker | D4:21; D4:23.1; EVE06:ARR-004 | SPM-SCRP-001 |
| SCRP-002 | activity | El payload corresponde a una actividad primaria; actividades secundarias viajan solo como contexto. | activity is secondary | reject full SCR patch and preserve contextual reference | critical | D4:22; EVE06:ARR-001; EVE06:ARR-002 | SPM-SCRP-002 |
| SCRP-003 | catalog | Declarar catalog_version_id congelado y coincidente con el run. | catalog version missing or mismatched | block payload and open version_mismatch blocker | blocker | D4:23.1; D4:25; EVE06:ARR-003 | SPM-SCRP-003 |
| SCRP-004 | B0 | No consolidar activity_anchor si B0 permanece weak_context o sin confirmación/reconstrucción. | B0 confirmation absent or weak_context blocking | block SCR patch and request B0 reentry | blocker | D6!Critical_Routes:CR-B0; D4:23.1; D5:6.1 | SPM-SCRP-004 |
| SCRP-005 | anchor | Persistir por separado action_verb, input_object, procedure_standard, output_product y confirmation_status. | activity anchor arrives as opaque text | reject opaque anchor and request separable subfields | critical | D4:23.1; D5:7; D6!Parallel_Production_Contract | SPM-SCRP-005 |
| SCRP-006 | source | Construir block_outputs únicamente desde canonical_variable_record activos y trazables. | raw answer or unmapped text used | block field projection | blocker | D4:8.3; D4:23.1; EVE06:CVR-003; EVE06:CVR-015 | SPM-SCRP-006 |
| SCRP-007 | genealogy | Cada salida de bloque conserva source_node_id, source_code y evidence refs cuando existan. | genealogy missing | block readiness for send | critical | D8!Catalogo_Madre_Nodos; EVE03:source_node_registry; EVE06:CVR-003 | SPM-SCRP-007 |
| SCRP-008 | gaps | Incluir gaps y flags del run; no ocultarlos ni convertirlos en valores por defecto. | gap exists but omitted | block payload send and flag hidden_gap | blocker | D4:23.1; D6!Readiness_Gaps_Reentry | SPM-SCRP-008 |
| SCRP-009 | B2 | No proyectar excepción de transformación si CR-B2-V3 no está cerrada. | transformation exception text without route closure | block B2 output and add missing_canonical_route | blocker | D6!Critical_Routes:CR-B2; EVE05:critical_route_gate | SPM-SCRP-009 |
| SCRP-010 | C09 | receiver_feedback solo entra si CR-B3-R9/C09 cerró; satisfaction no lo sustituye. | feedback inferred from satisfaction or route missing | block feedback field and add receiver_feedback_route_missing | blocker | D5:6.2; D6!Critical_Routes:CR-B3; EVE05:critical_route_gate | SPM-SCRP-010 |
| SCRP-011 | B7 | B7 solo aporta readiness/preclassification no diagnóstica; no agrega clase, IR, registry o export. | direct structural projection from B7 | block payload and require manual review | blocker | D5:6.3; D6!Critical_Routes:CR-B7; EVE05:failure_guards | SPM-SCRP-011 |
| SCRP-012 | epistemic | No promover ai_inferred_unconfirmed a evidence hard dentro del SCR. | unconfirmed inference found | exclude value and keep confirmation gap | critical | D4:1; D5:2; EVE06:EVI-005 | SPM-SCRP-012 |
| SCRP-013 | readiness | Estado ready permite preparación; ready_with_flags obliga a transportar flags; estados bloqueados impiden emisión. | readiness state evaluated | set payload state according to readiness matrix | blocker | D6!Readiness_Gaps_Reentry; D4:4.1; D4:23.1 | SPM-SCRP-013 |
| SCRP-014 | versioning | Toda recomputación crea nueva versión y marca la anterior superseded. | dependent response corrected | supersede previous payload and recalculate checksum | critical | D4:24; D4:26; EVE06:recompute | SPM-SCRP-014 |
| SCRP-015 | idempotency | El mismo input lógico y versión producen el mismo checksum_source. | duplicate export preview | return existing equivalent payload | major | D4:23.1; D4:24 | SPM-SCRP-015 |
| SCRP-016 | scope | case_id, role_id, activity_id y run_id deben coincidir con el contexto autorizado. | scope mismatch | block and audit cross_scope_attempt | blocker | D4:27; D4!Table25 | SPM-SCRP-016 |
| SCRP-017 | boundary | SCR patch no muta el core ni equivale a registro consolidado final. | payload consumer attempts core mutation | block mutation and retain patch semantics | critical | D3!Table6; D3:R4; D3!Table10 | SPM-SCRP-017 |
| SCRP-018 | ui | No exponer object_id, bindings, materialization events, snapshots o No-Go internos en UI cliente. | internal fields selected for product UI | strip product projection and flag internal_ui_leak | major | D3!Table11; D3:R7 | SPM-SCRP-018 |
| SCRP-019 | audit | Registrar actor/sistema, versión, reason, prior payload y timestamp para override o emisión. | audit metadata missing | block state transition to sent | critical | D4:27; D4!Table25 | SPM-SCRP-019 |
| SCRP-020 | state | Estados permitidos: draft, ready, sent, superseded, blocked; no usar 'final' o 'certified'. | invalid payload state | reject transition | major | D4:21; D4:25 | SPM-SCRP-020 |

### Salidas permitidas
- SceneCanonicalRecordPatch
- parallel_export_payload
- scr_export_blocker[]

### Salidas prohibidas
- core_mutation
- diagnosis
- final_SCR
- active_registry_write
- product_internal_ui

## Módulo `evidence_bundle_payload`

Construir un EvidenceBundlePatch con evidencia, variables, rutas, readiness y gaps gobernados, sin diagnóstico ni transducción.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["active_evidence_items", "canonical_variable_records", "critical_route_results", "readiness_decision", "gap_records"] |
| preconditions | ["provenance complete", "scope authorized", "revisions resolved"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| parallel_export_payload_id | string | True | Identificador del payload. |
| payload_type | enum | True | Tipo cerrado evidence_bundle_patch. |
| payload_version | integer | True | Versión monotónica. |
| run_id | string | True | Run de origen. |
| case_id | string | True | Scope autorizado. |
| catalog_version_id | string | True | Versión de catálogo. |
| evidence_items | array | True | Evidencias activas con literal/provenance/confidence. |
| canonical_variables | array | True | Variables con route/status/source refs. |
| route_statuses | array | True | Estados de rutas críticas. |
| readiness | object | True | Readiness, dominant gate y manual review. |
| gap_records | array | True | Gaps explícitos. |
| audit_refs | array | True | Referencias de revisión y supersession. |
| checksum | string | True | Checksum del bundle. |
| payload_state | enum | True | Estado gobernado. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVBP-001 | eligibility | Construir EvidenceBundlePatch solo desde evidence_item y canonical_variable_record gobernados. | input contains raw response without governed records | block bundle creation | blocker | D4:8.3; D4:23.2; EVE06:EVI-001; EVE06:CVR-003 | SPM-EVBP-001 |
| EVBP-002 | evidence | Incluir únicamente evidence_item activos; conservar referencias a superseded sin tratarlos como vigentes. | superseded evidence treated as active | block bundle and recompute | critical | D4:24; EVE06:EVI-014 | SPM-EVBP-002 |
| EVBP-003 | provenance | Cada evidence_item exige epistemic_status, provenance_type, source_interaction_id y confidence. | metadata missing | block evidence item from payload | blocker | D4:23.2; D5:2; EVE06:EVI-002 | SPM-EVBP-003 |
| EVBP-004 | literal | Conservar el valor literal o confirmado sin reescribirlo como interpretación. | literal evidence transformed into narrative fact | retain literal and move interpretation to candidate layer | critical | D4:23.2; D3:R1; D3:R3 | SPM-EVBP-004 |
| EVBP-005 | subfields | Las preguntas compuestas viajan como subrespuestas separadas, nunca como single_textbox opaco. | compound answer flattened | block bundle serialization | blocker | D4:1; D5:7; EVE06:RSP-007; EVE06:RSP-008 | SPM-EVBP-005 |
| EVBP-006 | variables | Cada canonical variable incluye value, route_id, route_status, source evidence y gap flag cuando aplique. | variable metadata incomplete | block variable projection | critical | D4:23.2; EVE06:CVR-003; EVE06:CVR-006; EVE06:CVR-007; EVE06:CVR-008 | SPM-EVBP-006 |
| EVBP-007 | routes | Incluir el estado de B0, B2, B3 y B7 aunque la ruta esté bloqueada. | critical route omitted | block payload send | blocker | D6!Critical_Routes; EVE05:critical_route_gate | SPM-EVBP-007 |
| EVBP-008 | C09 | Si hay evidencia textual de feedback sin cierre C09, materializar receiver_feedback_route_missing=true. | feedback text and canonical route not closed | add mandatory route_missing gap and block structural use | blocker | D5:6.2; D6!Critical_Routes:CR-B3; D4:23.2 | SPM-EVBP-008 |
| EVBP-009 | B7 | B7-Q39/B7-Q40/C20 solo se incluyen como preclassification/readiness signal no diagnóstico. | B7 evidence labeled as diagnosis or structural fact | block bundle and manual review | blocker | D5:6.3; D6!Critical_Routes:CR-B7 | SPM-EVBP-009 |
| EVBP-010 | readiness | Transportar readiness_state, dominant_gate y manual_review_required sin suavizarlos. | readiness metadata hidden or rewritten | block payload send | critical | D4:23.2; D6!Readiness_Gaps_Reentry | SPM-EVBP-010 |
| EVBP-011 | gaps | Todo gap se representa como registro explícito con type, affected_route, quadrant, severity y reentry target. | gap only in free text | reject gap representation | critical | D4:21; D4:23.2 | SPM-EVBP-011 |
| EVBP-012 | conformance | EvidenceBundle no declara conformance ni consistency satisfechas; solo transporta evidencia y decisiones de gate. | bundle attempts final methodological verdict | block verdict and move to gate outputs | critical | D1:4.1-4.5; EVE05:mmabp_conformance_gate; EVE05:mmabp_consistency_gate | SPM-EVBP-012 |
| EVBP-013 | diagnosis | El bundle no contiene diagnóstico EVE, VSM ni AHE cerrado. | diagnostic label detected | block payload and record boundary violation | blocker | D3!Table6; D3!Table10; D5:1 | SPM-EVBP-013 |
| EVBP-014 | dedupe | Deduplicar por evidence_item_id/variable_name+revision sin perder genealogía. | duplicate active record found | retain latest active and reference revision chain | major | D4:24; EVE06:evidence_item | SPM-EVBP-014 |
| EVBP-015 | confidence | No fabricar confidence; usar la calculada/capturada por el Execution Engine. | confidence missing | mark unresolved rather than default high | major | D4:23.2; EVE06:EVI-005 | SPM-EVBP-015 |
| EVBP-016 | authorization | Emitir bundle solo para case_id/tenant autorizado y target permitido. | unauthorized consumer | block and audit | blocker | D4:27; D4!Table25 | SPM-EVBP-016 |
| EVBP-017 | versioning | Toda corrección de respuesta invalida bundle dependiente y crea nueva versión. | response revision affects bundle | supersede old bundle and recompute | critical | D4:24; D4:26 | SPM-EVBP-017 |
| EVBP-018 | checksum | Calcular checksum sobre contenido canonizado, versión y refs de origen. | checksum absent | payload cannot become ready | critical | D4:21; D4:23 | SPM-EVBP-018 |
| EVBP-019 | state | Un bundle blocked o superseded no puede enviarse como ready. | payload_state not ready | deny send | blocker | D4:21; D4:4.1 | SPM-EVBP-019 |
| EVBP-020 | boundary | EvidenceBundle prepara Capa 2.0/2.5; no ejecuta transducción, IR ni registry write. | consumer asks direct transduction | block downstream action | blocker | D3!Table6; D3!Table10; D5:6.3 | SPM-EVBP-020 |
| EVBP-021 | audit | Registrar source payload refs, run, catalog, created_at y emitter. | audit envelope incomplete | block send | critical | D4:21; D4:27 | SPM-EVBP-021 |
| EVBP-022 | no_placeholder | Los payloads cerrados no admiten placeholders, ellipsis ni campos ficticios en producción/shadow validation. | placeholder detected | block readiness | blocker | D4:23; D4:28 | SPM-EVBP-022 |

### Salidas permitidas
- EvidenceBundlePatch
- parallel_export_payload
- evidence_export_blocker[]

### Salidas prohibidas
- diagnosis
- IR
- registry_write
- transduction
- hidden_gaps

## Módulo `mdsb_payload`

Construir un MMABPDesignSourceBundlePatch con candidatos, checkpoints y restricciones, manteniéndolo como fuente de diseño y no como modelo/diagrama final.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["EvidenceBundlePatch", "structural_candidate_records", "EVE05 gate results", "readiness decision"] |
| preconditions | ["canonical variables governed", "critical routes evaluated", "SEM/PST applicable gates resolved"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| parallel_export_payload_id | string | True | Identificador del payload. |
| payload_type | enum | True | Tipo cerrado mdsb_patch. |
| payload_version | integer | True | Versión monotónica. |
| run_id | string | True | Run de origen. |
| case_id | string | True | Scope autorizado. |
| source_payload_refs | array | True | Versiones de SCR/EvidenceBundle usadas. |
| structural_candidates | array | True | Candidatos PM/MoC/PF/OLC trazables. |
| conformance_checkpoints | array | True | Checkpoints por modelo. |
| consistency_checkpoints | array | True | Compartimentos aplicables. |
| readiness_gaps | array | True | Gaps/issue refs. |
| export_restriction | string | True | Restricción no diagramar/no final. |
| checksum | string | True | Checksum del payload. |
| payload_state | enum | True | Estado gobernado. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MDSB-001 | eligibility | Construir MMABPDesignSourceBundlePatch solo cuando existan EvidenceBundlePatch y structural_candidate_record gobernados. | evidence bundle or candidates missing | block MDSB creation | blocker | D4:23.3; EVE06:SCR-001; EVE06:SCR-005 | SPM-MDSB-001 |
| MDSB-002 | source | No consumir texto libre ni respuestas crudas; usar variables canónicas, evidence refs y candidates. | raw text selected as structural source | block source and open evidence_governance blocker | blocker | D6!Parallel_Production_Contract; D5:2; D4:23.3 | SPM-MDSB-002 |
| MDSB-003 | candidate | Cada structural candidate conserva id, quadrant_hint, type, label, source_variable y source_evidence_item_id. | candidate envelope incomplete | block candidate inclusion | critical | D4:21; D4:23.3; EVE06:SCR-005 | SPM-MDSB-003 |
| MDSB-004 | state | Solo candidates en estado candidate o accepted_for_rehearsal pueden entrar; blocked/stale/superseded quedan como issue refs. | candidate state invalid | exclude from active candidate list | critical | D4:21; D4:24; EVE06:SCR-015; EVE06:SCR-016; EVE06:SCR-017 | SPM-MDSB-004 |
| MDSB-005 | conformance | Cada candidato incluye checkpoint de conformance contra realidad; ausencia bloquea IR/registry candidate. | conformance checkpoint absent | block candidate progression | blocker | D1:4.1; D4:23.3; EVE05:mmabp_conformance_gate | SPM-MDSB-005 |
| MDSB-006 | consistency | Cada candidato incluye checkpoint de consistency aplicable y referencias a compartimentos evaluados. | consistency checkpoint absent | block IR/registry progression | blocker | D1:4.2-4.5; D4:23.3; EVE05:mmabp_consistency_gate | SPM-MDSB-006 |
| MDSB-007 | semantic | MoC/OLC candidates requieren Semantic Resolution Gate resuelto. | SEM gate unresolved or ambiguous | block relevant candidates | blocker | D6!Semantic_Resolution_Gates; EVE05:semantic_resolution_gate | SPM-MDSB-007 |
| MDSB-008 | process_state | PF/OLC candidates con espera requieren PST gates resueltos. | PST gate unresolved | block Process State/transition candidate | blocker | D6!Process_State_Timer_Gates; EVE05:process_state_timer_gate | SPM-MDSB-008 |
| MDSB-009 | critical_routes | B0, B2, B3 y B7 deben evaluarse; un route_missing se transporta como readiness gap. | critical route not evaluated | block MDSB ready state | blocker | D6!Critical_Routes; EVE05:critical_route_gate | SPM-MDSB-009 |
| MDSB-010 | C09 | No crear handoff_feedback_event, rework o PF/OLC candidate desde receiver_satisfaction. | feedback derived from satisfaction | block candidate and set C09 blocker | blocker | D5:6.2; D6!Critical_Routes:CR-B3 | SPM-MDSB-010 |
| MDSB-011 | B7 | B7-Q39/B7-Q40/C20 no crean MoC, IR, registry, export ni diagnóstico directo. | B7 source directly creates candidate | block and require manual review | blocker | D5:6.3; D6!Critical_Routes:CR-B7 | SPM-MDSB-011 |
| MDSB-012 | quadrants | Mantener separados PM, MoC, PF y OLC; no fusionar vistas en una entidad genérica. | quadrants merged | reject bundle structure | critical | D1:1.3.4; D1:4; D6!Parallel_Production_Contract | SPM-MDSB-012 |
| MDSB-013 | readiness | ready_with_flags puede preparar MDSB solo si flags son no bloqueantes y se transportan completos. | flags hidden or blocking flag present | set payload blocked | blocker | D6!Readiness_Gaps_Reentry; D4:23.3 | SPM-MDSB-013 |
| MDSB-014 | manual_review | manual_review_required impide estado ready/sent hasta decisión autorizada. | manual review unresolved | block emission | blocker | D4:27; D6!Readiness_Gaps_Reentry | SPM-MDSB-014 |
| MDSB-015 | issue_refs | Toda contradicción, semantic ambiguity, route missing o PST failure se conserva como issue ref. | issue omitted | block payload readiness | critical | D4:23.3; EVE05:semantic_resolution_gate; EVE05:process_state_timer_gate; EVE05:critical_route_gate; EVE05:mmabp_consistency_gate | SPM-MDSB-015 |
| MDSB-016 | diagram | MDSB no es diagrama ni autoriza diagramación; incluye export_restriction explícita. | diagram or render requested | block and require Inventory/Registry/IR gates | blocker | D4:23.3; D3!Table5; D6!Parallel_Production_Contract | SPM-MDSB-016 |
| MDSB-017 | finality | El payload es patch/candidate; no equivale a MDSB final ni transducción final. | payload labeled final | reject label and audit | blocker | D3!Table6; D3!Table10; D3:R4 | SPM-MDSB-017 |
| MDSB-018 | versioning | Correcciones de evidencia o gates marcan MDSB anterior superseded. | dependent record changes | supersede and rebuild | critical | D4:24; D4:26 | SPM-MDSB-018 |
| MDSB-019 | authorization | Solo actor/sistema autorizado puede pasar de draft a ready/sent. | unauthorized transition | block and audit | blocker | D4:27; D4!Table25 | SPM-MDSB-019 |
| MDSB-020 | checksum | Incluir checksum del payload y refs a SCR/EvidenceBundle versiones usadas. | checksum or refs missing | block readiness | critical | D4:21; D4:23 | SPM-MDSB-020 |
| MDSB-021 | no_placeholder | No admitir placeholders en structural_candidates, checkpoints o gaps. | placeholder detected | block payload | blocker | D4:23; D4:28 | SPM-MDSB-021 |
| MDSB-022 | audit | Persistir emitter, timestamp, target, reason y prior payload refs. | audit envelope incomplete | block sent state | critical | D4:21; D4:27 | SPM-MDSB-022 |

### Salidas permitidas
- MMABPDesignSourceBundlePatch
- parallel_export_payload
- mdsb_export_blocker[]

### Salidas prohibidas
- diagram
- final_MDSB
- diagnosis
- active_registry_write
- final_transduction

## Módulo `mmabp_ir_candidate`

Proyectar una representación intermedia MMABP computable y trazable para rehearsal, sin equivaler a diagrama, diagnóstico o IR final.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["ready MMABPDesignSourceBundlePatch", "structural candidates", "gate snapshots", "issue refs"] |
| preconditions | ["no hard export blocker", "conformance and consistency checkpoints present"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| mmabp_ir_candidate_id | string | True | Identificador del IR candidate. |
| run_id | string | True | Run de origen. |
| case_id | string | True | Scope autorizado. |
| mdsb_payload_ref | string | True | MDSB fuente. |
| candidate_version | integer | True | Versión monotónica. |
| quadrant_partitions | object | True | Particiones PM/MoC/PF/OLC. |
| nodes | array | True | Elementos IR con source refs. |
| relations | array | True | Relaciones IR con source refs. |
| gate_snapshot_refs | array | True | Gates usados. |
| conformance_status | string | True | Estado de conformance. |
| consistency_status | string | True | Estado de consistency. |
| unresolved_gaps | array | True | Gaps remanentes. |
| candidate_state | enum | True | Estado candidate-only. |
| checksum | string | True | Checksum del IR candidate. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IRCD-001 | eligibility | Crear MMABP-IR candidate solo desde MDSBPatch ready y no bloqueado. | MDSB absent, blocked or superseded | block IR candidate creation | blocker | D3!Table5; D4:23.3; MDSB-013 | SPM-IRCD-001 |
| IRCD-002 | candidate_only | MMABP-IR candidate es representación intermedia computable en ensayo; no es modelo final ni diagrama. | candidate labeled final or diagram-ready | reject state and audit | blocker | D3!Table5; D3:R4; D3:R5 | SPM-IRCD-002 |
| IRCD-003 | source | Cada nodo/arista del IR conserva structural_candidate_id, source_variable y evidence_item refs. | IR element missing source refs | block element | critical | D3:R3; D4:23.3 | SPM-IRCD-003 |
| IRCD-004 | quadrants | Mantener particiones explícitas PM, MoC, PF y OLC. | quadrant missing or merged | block IR candidate | blocker | D1:1.3.4; D1:4; D6!Parallel_Production_Contract | SPM-IRCD-004 |
| IRCD-005 | PM | PM IR candidate solo contiene cliente/necesidad/proceso/trigger/target state/soporte/sincronización; no tareas detalladas. | PF task inserted into PM | move to PF or block | critical | D1:2.2.6; D6!Parallel_Production_Contract | SPM-IRCD-005 |
| IRCD-006 | MoC | MoC IR candidate representa clases reales, relaciones, ISA/role/phase/end; no IDs técnicos ni esquema de base de datos. | technical schema or false ISA detected | block MoC element | critical | D1:3.1.5; EVE05:semantic_resolution_gate | SPM-IRCD-006 |
| IRCD-007 | PF | PF IR candidate no usa swimlanes ni flujos de datos; cada task referencia objeto/estado producido. | swimlane, data flow or missing produced state | block PF element | critical | D1:2.3.3; D1:2.3.6; D6!Parallel_Production_Contract | SPM-IRCD-007 |
| IRCD-008 | PST | Todo Process State candidate incluye awaited_event, release_condition, timer/timeout y exit_path. | Process State incomplete | block PF/OLC transition | blocker | D6!Process_State_Timer_Gates; EVE05:process_state_timer_gate | SPM-IRCD-008 |
| IRCD-009 | OLC | OLC IR candidate representa un solo objeto con estados/transiciones/eventos/transformers/end; no un proceso. | mixed objects or process semantics | block OLC element | critical | D1:3.2.4; EVE05:semantic_resolution_gate | SPM-IRCD-009 |
| IRCD-010 | conformance | No marcar IR candidate como conformance-ready si cualquier modelo candidate falla contra realidad. | conformance failure | set candidate_state blocked | blocker | D1:4.1; EVE05:mmabp_conformance_gate | SPM-IRCD-010 |
| IRCD-011 | consistency | No marcar IR candidate como consistency-ready con contradicción factual, temporal, estructural o compuesta. | consistency failure | set blocked and preserve compartment findings | blocker | D1:4.2-4.5; EVE05:mmabp_consistency_gate | SPM-IRCD-011 |
| IRCD-012 | correction | Ante inconsistencia no alinear modelos cosméticamente; regresar a evidencia/realidad y reentry. | candidate models disagree | create reentry request, not auto-align | critical | D1:4.1-4.5; D6!Readiness_Gaps_Reentry | SPM-IRCD-012 |
| IRCD-013 | B7 | No crear ningún elemento IR cuya única fuente sea B7/C20. | only source is B7 signal | block element | blocker | D5:6.3; D6!Critical_Routes:CR-B7 | SPM-IRCD-013 |
| IRCD-014 | C09 | No crear rework/handoff feedback IR sin C09 cerrada y evidencia operativa del receptor. | C09 missing or satisfaction only | block element | blocker | D5:6.2; D6!Critical_Routes:CR-B3 | SPM-IRCD-014 |
| IRCD-015 | diagnosis | IR candidate no contiene diagnóstico EVE, VSM o AHE cerrado. | diagnostic statement detected | block and remove from IR layer | blocker | D3!Table6; D3!Table10 | SPM-IRCD-015 |
| IRCD-016 | registry | IR candidate no escribe en registry activo; solo produce registry candidates separados. | active registry write requested | block write | blocker | D3!Table5; D3!Table6; D3:R4 | SPM-IRCD-016 |
| IRCD-017 | versioning | Toda recomputación crea nueva versión y marca la anterior superseded. | source payload/candidate changes | supersede and rebuild | critical | D4:24; D4:26 | SPM-IRCD-017 |
| IRCD-018 | checksum | Calcular checksum sobre IR canonizado, fuentes y gate versions. | checksum missing | candidate cannot advance | critical | D4:21; D4:23 | SPM-IRCD-018 |
| IRCD-019 | state | MMABP-IR candidate permanece candidate_only/rehearsal_only; nunca adopta estado active, final o certified. | IR candidate requested as active/final/certified or outside rehearsal | block transition and retain candidate-only state | major | D3:R4; D3!Table10 | SPM-IRCD-019 |
| IRCD-020 | audit | Registrar gate snapshots, issue refs, actor/system y reason en cada transición. | audit metadata missing | block transition | critical | D4:27; D3:R3 | SPM-IRCD-020 |

### Salidas permitidas
- mmabp_ir_candidate
- ir_candidate_blocker[]
- registry_candidate_request

### Salidas prohibidas
- diagram
- final_IR
- diagnosis
- active_registry_write
- ExportCodePackage

## Módulo `registry_candidate`

Crear registros candidatos separados para PM, MoC, PF, OLC, consistency y readiness sin escribir registries activos.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["MMABP-IR candidate", "source structural candidates", "gate results", "provenance"] |
| preconditions | ["IR ready_for_registry_candidate or rehearsal_only", "no hard blocker for target"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| registry_candidate_id | string | True | Identificador. |
| run_id | string | True | Run de origen. |
| case_id | string | True | Scope autorizado. |
| registry_target | enum | True | Target candidate. |
| record_type | string | True | Tipo de elemento. |
| record_key_candidate | string | True | Clave semántica candidata, no ID activo. |
| label | string | True | Etiqueta candidata. |
| properties | object | True | Propiedades según target. |
| source_ir_element_ids | array | True | Elementos IR fuente. |
| source_candidate_ids | array | True | Structural candidates fuente. |
| source_evidence_refs | array | True | Evidencia y variables. |
| conformance_status | string | True | Checkpoint. |
| consistency_status | string | True | Checkpoint. |
| candidate_state | enum | True | Estado candidate-only. |
| checksum | string | True | Checksum. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REGC-001 | eligibility | Crear registry candidate solo desde MMABP-IR candidate listo y structural candidates trazables. | IR not ready or sources missing | block registry candidate creation | blocker | D3!Table5; D6!Parallel_Production_Contract; IRCD-001 | SPM-REGC-001 |
| REGC-002 | candidate_only | Registry candidate no equivale a registro activo ni autoriza escritura en registry productivo. | consumer requests active write | block and audit | blocker | D3!Table6; D3!Table10; D3:R4 | SPM-REGC-002 |
| REGC-003 | target | registry_target permitido: PM, MoC, PF, OLC, Consistency o Readiness candidate. | unsupported target | reject record | major | D6!Parallel_Production_Contract; D4:13 | SPM-REGC-003 |
| REGC-004 | source | Conservar IR element ids, structural_candidate ids, source variables y evidence refs. | source chain incomplete | block record | critical | D3:R3; D4:23.3 | SPM-REGC-004 |
| REGC-005 | PM | PM candidate exige customer, need, process, trigger, target_state y support/synchronization cuando apliquen. | required PM fields missing | block PM registry candidate | critical | D1:2.2.6; D6!Parallel_Production_Contract | SPM-REGC-005 |
| REGC-006 | PM_PF_boundary | No fusionar PM y PF ni almacenar tareas detalladas dentro de PM registry candidate. | PM/PF contamination detected | block and split targets | blocker | D5:10/Table13/R5/C3; D1:2.2.6; D1:2.3.6 (D1 contextual only) | SPM-REGC-006 |
| REGC-007 | MoC | MoC candidate exige class/relation semantics resueltas y evita IDs técnicos como conceptos. | technical identifier or unresolved semantics | block MoC registry candidate | critical | D1:3.1.5; EVE05:semantic_resolution_gate | SPM-REGC-007 |
| REGC-008 | ISA | No usar 'tipo de' como Jerarquía ISA sin especialización real. | false ISA detected | block relation and request semantic review | critical | D1:3.1.5; D6!Semantic_Resolution_Gates:SEM-004 | SPM-REGC-008 |
| REGC-009 | role_phase_end | Mantener role, phase y end como distinciones dinámicas; no fijarlas como clases estáticas sin resolución. | unresolved role/phase/end | block candidate | critical | D6!Semantic_Resolution_Gates:SEM-006; EVE05:semantic_resolution_gate | SPM-REGC-009 |
| REGC-010 | PF | PF candidate exige task, event, object state, handoff/loop/gateway y Process State/timer cuando aplique. | PF required semantics missing | block PF registry candidate | critical | D1:2.3.6; D6!Parallel_Production_Contract | SPM-REGC-010 |
| REGC-011 | swimlane | No almacenar swimlanes ni contexto organizacional como estructura PF. | swimlane/role lane found | block PF candidate | major | D5:10/Table13/R7/C3; D1:2.3.3 (D1 contextual only) | SPM-REGC-011 |
| REGC-012 | OLC | OLC candidate exige objeto único, estado, transición, evento, transformer y end; no fusiona ciclos. | object lifecycle merged or incomplete | block OLC registry candidate | critical | D1:3.2.4; D6!Parallel_Production_Contract | SPM-REGC-012 |
| REGC-013 | aliases | Aliases no crean duplicados; conservar alias y resolver same/different concept. | alias unresolved | mark candidate blocked_for_semantic_resolution | major | D6!Semantic_Resolution_Gates:SEM-005 | SPM-REGC-013 |
| REGC-014 | conformance | Cada record candidate incluye conformance_status y checkpoint refs. | conformance missing/failed | block candidate | blocker | D1:4.1; EVE05:mmabp_conformance_gate | SPM-REGC-014 |
| REGC-015 | consistency | Cada record candidate incluye consistency_status y compartments evaluados. | consistency missing/failed | block candidate | blocker | D1:4.2-4.5; EVE05:mmabp_consistency_gate | SPM-REGC-015 |
| REGC-016 | B7 | No crear registry candidate desde B7-Q39/B7-Q40/C20. | direct B7 source | block and manual review | blocker | D5:6.3; D6!Critical_Routes:CR-B7 | SPM-REGC-016 |
| REGC-017 | C09 | Feedback/rework registry candidate exige receiver_feedback_exists y route closed; satisfaction no basta. | feedback route missing | block PF/OLC registry candidate | blocker | D5:6.2; D6!Critical_Routes:CR-B3 | SPM-REGC-017 |
| REGC-018 | state | Registry candidate permanece en estado candidato/rehearsal o bloqueado; nunca adopta estado active. | registry candidate requested as active | block active transition | major | D3:R4; D3!Table10 | SPM-REGC-018 |
| REGC-019 | versioning | Recomputación invalida candidatos dependientes y conserva historial. | source changes | mark stale/superseded and rebuild | critical | D4:24; D4:26 | SPM-REGC-019 |
| REGC-020 | dedupe | Detectar duplicados por semantic key sin fusionar automáticamente conceptos ambiguos. | duplicate semantic key | open semantic review | major | D6!Semantic_Resolution_Gates:SEM-005 | SPM-REGC-020 |
| REGC-021 | authorization | Solo servicio shadow/rehearsal autorizado puede persistir candidates; nunca usuario final. | unauthorized actor | block and audit | blocker | D4:27; D4!Table25; D3!Table10 | SPM-REGC-021 |
| REGC-022 | ui | No exponer IDs, bindings, inventory facts o registry internals en UI cliente. | internal candidate projected to product UI | block product projection | major | D3!Table11; D3:R7 | SPM-REGC-022 |

### Salidas permitidas
- registry_candidate
- registry_candidate_blocker[]

### Salidas prohibidas
- active_registry_record
- database_schema_projection
- diagnosis
- product_ui_internal

## Módulo `export_blockers`

Evaluar y persistir No-Go/export blockers que impiden saltos desde evidencia a payload, IR, registry, diagnóstico o producción real.

### Contrato de entrada
| Campo | Contrato |
| --- | --- |
| required | ["run context", "payload/candidate target", "gate results", "readiness", "authority context"] |
| preconditions | ["deterministic blocker catalog loaded"] |

### Esquema
| Campo | Tipo/valor | Requerido | Descripción |
| --- | --- | --- | --- |
| export_blocker_id | string | True | Identificador. |
| run_id | string | True | Run afectado. |
| case_id | string | True | Scope. |
| blocker_code | string | True | Código del catálogo. |
| category | string | True | Categoría. |
| severity | string | True | Severidad. |
| hard_block | boolean | True | Bloqueo duro. |
| affected_object_type | string | True | Payload/candidate afectado. |
| affected_object_id | string | False | ID afectado. |
| source_refs | array | True | Fuente del blocker. |
| resolution_action | string | True | Acción necesaria. |
| status | enum | True | Estado del blocker. |
| audit_refs | array | True | Trazabilidad de cambios. |

### Reglas atómicas
| ID | Categoría | Regla | Condición | Acción | Severidad | Fuentes | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EXBE-001 | evaluation | Evaluar blockers antes de construir, marcar ready o enviar cualquier payload/candidate. | payload lifecycle transition requested | run blocker evaluation in deterministic order | blocker | D4:9; D4:23; EVE05:execution_pipeline; EVE06:execution_pipeline | SPM-EXBE-001 |
| EXBE-002 | hard_block | Un hard blocker abierto impide ready/sent, IR candidate y registry candidate. | open hard blocker exists | set output blocked | blocker | D4:23; D6!Readiness_Gaps_Reentry | SPM-EXBE-002 |
| EXBE-003 | ordering | Orden de evaluación: scope/version → evidence/provenance → critical routes → SEM/PST → conformance → consistency → readiness → authority/finality. | evaluate export | apply ordered blocker phases | critical | D4:9; D4:23; EVE05:execution_pipeline | SPM-EXBE-003 |
| EXBE-004 | dedupe | Deduplicar blockers por code+run+affected_object sin perder eventos de reapertura. | duplicate blocker detected | merge active instance and append audit event | major | D4:21; D4:24 | SPM-EXBE-004 |
| EXBE-005 | lifecycle | Estados permitidos: open, resolved, superseded, waived_by_authority; hard methodological blockers no se pueden waive. | blocker transition requested | validate transition and authority | critical | D4:27; D3!Table9 | SPM-EXBE-005 |
| EXBE-006 | resolution | Resolver blocker solo con evidencia/gate/route nueva; nunca por default o silencio. | resolution requested without new basis | reject resolution | blocker | D3:R2; D6!Readiness_Gaps_Reentry | SPM-EXBE-006 |
| EXBE-007 | recompute | Correcciones reevalúan blockers dependientes y supersede payloads previos. | source revision received | recompute blockers and payloads | critical | D4:24; D4:26 | SPM-EXBE-007 |
| EXBE-008 | audit | Cada apertura/resolución registra actor, reason, source refs, prior/new status y timestamp. | audit data missing | reject transition | critical | D4:27 | SPM-EXBE-008 |
| EXBE-009 | algedonic | Intento de export final, diagnóstico o activación no autorizada genera escalamiento algedónico/no-go. | boundary violation detected | block and escalate | blocker | D3:R8; D3!Table12; D3!Table11 | SPM-EXBE-009 |
| EXBE-010 | preview | Export-preview puede mostrar blockers, pero nunca ocultarlos ni representar readiness falsa. | preview requested | return blockers and allowed candidate previews only | major | D4:7; D4:23 | SPM-EXBE-010 |
| EXBE-011 | authorization | Solo actor autorizado resuelve manual_review/override blockers; el sistema automático no los cierra. | manual blocker resolution | require authorized actor and audit | blocker | D4:27 | SPM-EXBE-011 |
| EXBE-012 | no_ui_leak | Los códigos internos se traducen para UI admin; no se exponen como vísceras al usuario final. | product UI projection requested | block or translate safely | major | D3!Table11; D3:R7 | SPM-EXBE-012 |
| EXBE-013 | consistency | No se resuelve inconsistencia alineando modelos entre sí; se regresa a evidencia factual. | consistency blocker open | issue reentry to reality/source | critical | EVE05:$.modules.mmabp_conformance_gate.principles[4]; EVE05:$.modules.mmabp_conformance_gate.engine_rules[4]; D1:4.1-4.5 (contextual) | SPM-EXBE-013 |
| EXBE-014 | finality | La ausencia de blockers permite rehearsal/candidate progression, no certificación ni producción real. | all blockers resolved | set ready_for_rehearsal only | blocker | D3:R4; D3!Table10 | SPM-EXBE-014 |

### Catálogo de blockers
| Código | Categoría | Disparo | Severidad | Hard | Resolución | Fuentes | Predicado | Prueba |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXB-001 | missing_run_scope | run/case/role/activity scope incompleto | hard | True | block all payloads | D4:27; EVE06:ARR-004 |  | SPM-EXB-001 |
| EXB-002 | catalog_version_mismatch | catalog_version_id no coincide con el run congelado | hard | True | block and audit | D4:23; EVE06:ARR-003 |  | SPM-EXB-002 |
| EXB-003 | B0_unconfirmed | actividad no confirmada o weak_context bloqueante | hard | True | reentry B0; no SCR | D6!Critical_Routes:CR-B0 |  | SPM-EXB-003 |
| EXB-004 | B2_route_missing | excepción de transformación sin ruta canónica 2.9/2.10 | hard | True | reentry C05/C06; no candidates | D6!Critical_Routes:CR-B2 |  | SPM-EXB-004 |
| EXB-005 | C09_route_missing | feedback textual sin C09 cerrada | hard | True | receiver_feedback_route_missing; no rework | D5:6.2; D6!Critical_Routes:CR-B3 |  | SPM-EXB-005 |
| EXB-006 | satisfaction_as_feedback | receiver_satisfaction usada como receiver_feedback | hard | True | block PF/OLC candidate | D5:6.2 |  | SPM-EXB-006 |
| EXB-007 | B7_direct_projection | B7/C20 intenta crear MoC/IR/registry/export/diagnóstico | hard | True | block and manual review | D5:6.3; D6!Critical_Routes:CR-B7 |  | SPM-EXB-007 |
| EXB-008 | semantic_unresolved | SEM-001..007 no resuelto | hard | True | block MoC/OLC projection | D6!Semantic_Resolution_Gates |  | SPM-EXB-008 |
| EXB-009 | process_state_without_timer | PST gate faltante | hard | True | block PF/OLC Process State | D6!Process_State_Timer_Gates |  | SPM-EXB-009 |
| EXB-010 | conformance_failed | modelo candidate no representa realidad | hard | True | reentry to evidence; no consistency cosmetic alignment | D1:4.1; EVE05:mmabp_conformance_gate |  | SPM-EXB-010 |
| EXB-011 | consistency_failed | inconsistencia factual/temporal/estructural/compuesta | hard | True | block IR/registry candidate | D1:4.2-4.5; EVE05:mmabp_consistency_gate |  | SPM-EXB-011 |
| EXB-012 | readiness_not_allowed | readiness state bloqueado/reentry/manual review | hard | True | block sent state | D6!Readiness_Gaps_Reentry |  | SPM-EXB-012 |
| EXB-013 | gap_hidden | gap o flag existente omitido del payload | hard | True | block and restore gaps | D4:23; D6!Readiness_Gaps_Reentry |  | SPM-EXB-013 |
| EXB-014 | missing_provenance | evidence o variable sin provenance/epistemic status | hard | True | exclude and block | D4:23.2; EVE06:EVI-002; EVE06:CVR-003 |  | SPM-EXB-014 |
| EXB-015 | unconfirmed_ai_as_evidence | inferencia IA no confirmada tratada como evidencia dura | hard | True | exclude and open confirmation gap | D4:1; D5:2 |  | SPM-EXB-015 |
| EXB-016 | raw_text_projection | texto libre salta a structural candidate/IR/registry | hard | True | block source | D4:1; D6!Parallel_Production_Contract |  | SPM-EXB-016 |
| EXB-017 | compound_answer_flattened | pregunta compuesta guardada como texto opaco | hard | True | block serialization | D4:1; D5:4 |  | SPM-EXB-017 |
| EXB-018 | stale_or_superseded_source | payload usa evidencia/candidate superseded | hard | True | recompute from active records | D4:24; EVE06:EVI-014; EVE06:SCR-016 |  | SPM-EXB-018 |
| EXB-019 | candidate_state_invalid | candidate blocked/stale/rejected usado como activo | hard | True | exclude and block progression | D4:21; EVE06:SCR-015 |  | SPM-EXB-019 |
| EXB-020 | placeholder_payload | payload contiene placeholders/ellipsis | hard | True | block readiness | D4:23; D4:28 |  | SPM-EXB-020 |
| EXB-021 | checksum_missing | payload/candidate sin checksum | hard | True | block ready/sent | D4:21; D4:23 |  | SPM-EXB-021 |
| EXB-022 | source_genealogy_missing | source_node/source_code/evidence refs incompletos | hard | True | block payload | D8; EVE03:source_node_registry; EVE03:source_code_registry |  | SPM-EXB-022 |
| EXB-023 | unauthorized_actor | actor/sistema sin autoridad de export | hard | True | block and audit | D4:27 |  | SPM-EXB-023 |
| EXB-024 | cross_tenant_scope | case/tenant mismatch | hard | True | block and security audit | D4:27 |  | SPM-EXB-024 |
| EXB-025 | active_registry_write | candidate intenta escribir registry activo | hard | True | block write | D3:R4; D3!Table6; D3!Table10 |  | SPM-EXB-025 |
| EXB-026 | production_promotion | shadow/rehearsal candidate intenta promoción productiva | hard | True | block and algedonic escalation | D3:R4; D3!Table10 |  | SPM-EXB-026 |
| EXB-027 | final_export_requested | candidate_export se trata como ExportCodePackage final | hard | True | block final export | D3!Table5; D3!Table6 |  | SPM-EXB-027 |
| EXB-028 | diagnosis_requested | payload intenta emitir diagnóstico EVE/VSM/AHE | hard | True | block and boundary violation | D3!Table6; D3!Table10; D3!Table11 |  | SPM-EXB-028 |
| EXB-029 | internal_ui_leak | Object Inventory/Membrane/SG Shadow internals expuestos al cliente | hard | True | block product projection | D3!Table11; D3:R7 |  | SPM-EXB-029 |
| EXB-030 | manual_review_open | manual_review_required sin resolución autorizada | hard | True | block send | D4:27; D6!Readiness_Gaps_Reentry |  | SPM-EXB-030 |
| EXB-031 | unaudited_override | overrideRequested=true y overrideAudited=false | hard | True | require audited override metadata: actor_id, reason, scope, prior_value, new_value, timestamp | D4:27; D4!Table25 | Boolean(context.overrideRequested) && !context.overrideAudited | SPM-EXB-031 |
| EXB-032 | budget_or_carry_forward_critical | gap crítico quedó como carry_forward por presupuesto | hard | True | block export until route resolved | D4:9; D6!Branching_Budget_Rules |  | SPM-EXB-032 |
| EXB-033 | IR_diagram_equivalence | MMABP-IR candidate tratado como diagrama final | hard | True | block render/export | D3!Table5 |  | SPM-EXB-033 |
| EXB-034 | MDSB_finality_violation | MDSB patch tratado como MDSB final/transducción final | hard | True | block promotion | D3!Table6; D3!Table10; D3:R4 |  | SPM-EXB-034 |

### Salidas permitidas
- export_blocker[]
- export_eligibility_decision
- algedonic_escalation

### Salidas prohibidas
- silent_waiver
- automatic_manual_review_resolution
- final_promotion

## Correcciones controladas desde v0.1
| Regla | Refs anteriores | Refs certificadas | Motivo |
| --- | --- | --- | --- |
| EVBP-001 | D4:8.3; D4:23.2; EVE06:evidence_item; EVE06:canonical_variable_record | D4:8.3; D4:23.2; EVE06:EVI-001; EVE06:CVR-003 | Usa reglas exactas de creación de evidencia y genealogía variable. |
| EVBP-005 | D4:1; D5:4; EVE06:RSP-009 | D4:1; D5:7; EVE06:RSP-007; EVE06:RSP-008 | Corrige referencia a persistencia separada y prohibición de textbox opaco. |
| EVBP-006 | D4:23.2; EVE06:canonical_variable_record | D4:23.2; EVE06:CVR-003; EVE06:CVR-006; EVE06:CVR-007; EVE06:CVR-008 | Ancla source refs, route status/id y gap flag en reglas exactas. |
| EVBP-012 | D1:4.1-4.5; EVE05 | D1:4.1-4.5; EVE05:mmabp_conformance_gate; EVE05:mmabp_consistency_gate | Reemplaza fuente genérica por gates exactos. |
| EVBP-013 | D3!Table5; D3!Table9; D5:1 | D3!Table6; D3!Table10; D5:1 | Usa fronteras explícitas de no diagnóstico. |
| EVBP-015 | D4:23.2; EVE06:EVI-008 | D4:23.2; EVE06:EVI-005 | Corrige EVI-008 por regla de confidence/inferencia. |
| EVBP-016 | D4:27; D4!Table24 | D4:27; D4!Table25 | Corrige Table24 por scope/tenancy/authority. |
| EVBP-020 | D3!Table5; D3!Table9; D5:6.3 | D3!Table6; D3!Table10; D5:6.3 | Usa límites explícitos de Capa 1/Producción Paralela. |
| EXB-001 | D4:27; EVE06 | D4:27; EVE06:ARR-004 | Usa regla exacta de scope. |
| EXB-002 | D4:23; EVE06 | D4:23; EVE06:ARR-003 | Usa regla exacta de versión de catálogo. |
| EXB-010 | D1:4.1; EVE05 | D1:4.1; EVE05:mmabp_conformance_gate | Reemplaza EVE05 genérico por conformance gate. |
| EXB-011 | D1:4.2-4.5; EVE05 | D1:4.2-4.5; EVE05:mmabp_consistency_gate | Reemplaza EVE05 genérico por consistency gate. |
| EXB-014 | D4:23.2; EVE06 | D4:23.2; EVE06:EVI-002; EVE06:CVR-003 | Ancla provenance/epistemic status en reglas exactas. |
| EXB-018 | D4:24; EVE06 | D4:24; EVE06:EVI-014; EVE06:SCR-016 | Usa reglas exactas de superseded/stale. |
| EXB-019 | D4:21; EVE06 | D4:21; EVE06:SCR-015 | Usa regla exacta de candidate state. |
| EXB-022 | D8; EVE03 | D8; EVE03:source_node_registry; EVE03:source_code_registry | Genealogía exacta, no JSON genérico. |
| EXB-025 | D3!Table4; D3!Table9 | D3:R4; D3!Table6; D3!Table10 | Corrige tabla y prueba no registry activo. |
| EXB-026 | D3:R4; D3!Table9 | D3:R4; D3!Table10 | Usa candidate-only y límite de promoción. |
| EXB-027 | D3!Table4; D3!Table5 | D3!Table5; D3!Table6 | Corrige tabla a candidate_export_package y límite export final. |
| EXB-028 | D3!Table5; D3!Table9 | D3!Table6; D3!Table10; D3!Table11 | Prueba explícita de no diagnóstico. |
| EXB-029 | D3!Table10 | D3!Table11; D3:R7 | Corrige tabla de UI. |
| EXB-031 | D4:27 | D4:27; D4!Table25 | Añade fila exacta de control de override. |
| EXB-033 | D3!Table4 | D3!Table5 | Corrige tabla a MMABP-IR no diagrama final. |
| EXB-034 | D3!Table5; D3!Table9 | D3!Table6; D3!Table10; D3:R4 | MDSB patch candidate no final. |
| EXBE-001 | D4:9; D4:23; EVE05; EVE06 | D4:9; D4:23; EVE05:execution_pipeline; EVE06:execution_pipeline | Sustituye fuentes genéricas por pipelines ejecutables. |
| EXBE-009 | D3:R8; D3!Table11 | D3:R8; D3!Table12; D3!Table11 | Añade canal algedónico explícito y límites UI/export. |
| EXBE-012 | D3!Table10; D3:R7 | D3!Table11; D3:R7 | Corrige tabla UI. |
| EXBE-014 | D3:R4; D3!Table9 | D3:R4; D3!Table10 | Candidate progression no equivale a producción/certificación. |
| IRCD-001 | D3!Table4; D4:23.3; MDSB-013 | D3!Table5; D4:23.3; MDSB-013 | Corrige tabla a componente MMABP-IR. |
| IRCD-002 | D3!Table4; D3:R4; D3:R5 | D3!Table5; D3:R4; D3:R5 | Corrige tabla a definición/límite MMABP-IR. |
| IRCD-007 | D1:2.3.6; D6!Parallel_Production_Contract | D1:2.3.3; D1:2.3.6; D6!Parallel_Production_Contract | Añade sección exacta que advierte contra swim lanes y conserva regla task/object state. |
| IRCD-015 | D3!Table5; D3!Table9 | D3!Table6; D3!Table10 | Usa fronteras explícitas de no diagnóstico. |
| IRCD-016 | D3!Table4; D3!Table9 | D3!Table5; D3!Table6; D3:R4 | IR candidate no equivale a registry activo. |
| IRCD-019 | D3:R4; D3!Table9 | D3:R4; D3!Table10 | Estados candidate/rehearsal sustentados en candidate-only y límites. |
| MDSB-001 | D4:23.3; EVE06:structural_candidate_record | D4:23.3; EVE06:SCR-001; EVE06:SCR-005 | Reemplaza módulo genérico por reglas exactas de candidate creation/genealogy. |
| MDSB-003 | D4:21; D4:23.3; EVE06:structural_candidate_record | D4:21; D4:23.3; EVE06:SCR-005 | Usa regla exacta de source_variable/evidence. |
| MDSB-004 | D4:21; D4:24; EVE06:structural_candidate_record | D4:21; D4:24; EVE06:SCR-015; EVE06:SCR-016; EVE06:SCR-017 | Ancla estados/revisión/supersede en reglas exactas. |
| MDSB-015 | D4:23.3; EVE05:failure_guards | D4:23.3; EVE05:semantic_resolution_gate; EVE05:process_state_timer_gate; EVE05:critical_route_gate; EVE05:mmabp_consistency_gate | Descompone issue refs por gate exacto. |
| MDSB-016 | D4:23.3; D3!Table4; D6!Parallel_Production_Contract | D4:23.3; D3!Table5; D6!Parallel_Production_Contract | Corrige tabla a componente MMABP-IR/MDSB candidate. |
| MDSB-017 | D3!Table5; D3!Table9 | D3!Table6; D3!Table10; D3:R4 | Usa límites de candidate-only/no MDSB final. |
| MDSB-019 | D4:27; D4!Table24 | D4:27; D4!Table25 | Corrige Table24 por authority. |
| REGC-001 | D3!Table4; D6!Parallel_Production_Contract; IRCD-001 | D3!Table5; D6!Parallel_Production_Contract; IRCD-001 | Corrige tabla a MMABP-IR y contrato de registry candidates. |
| REGC-002 | D3!Table4; D3!Table9 | D3!Table6; D3!Table10; D3:R4 | Usa límite explícito candidate-only/no active registry. |
| REGC-003 | D6!Parallel_Production_Contract; D4:12 | D6!Parallel_Production_Contract; D4:13 | Elimina sección 12 no relacionada; usa contrato de salida. |
| REGC-011 | D1:2.3.6 | D1:2.3.3 | Corrige referencia al apartado específico sobre swim lanes/contexto organizacional. |
| REGC-018 | D3!Table4; D3:R4 | D3:R4; D3!Table10 | Estados candidate/rehearsal, no active. |
| REGC-021 | D4:27; D3!Table10 | D4:27; D4!Table25; D3!Table10 | Autoridad y persistencia shadow/rehearsal. |
| REGC-022 | D3!Table10; D3:R7 | D3!Table11; D3:R7 | Corrige límite UI a tabla Debe/No debe. |
| SCRP-001 | D4:21; D4:23.1; EVE06:activity_runtime_run | D4:21; D4:23.1; EVE06:ARR-004 | Reemplaza referencia de módulo por regla exacta de scope. |
| SCRP-003 | D4:23.1; D4:25; EVE06:ARR-004 | D4:23.1; D4:25; EVE06:ARR-003 | Corrige ARR-004 (scope) por ARR-003 (catalog_version_id). |
| SCRP-005 | D4:23.1; D5:4; D6!Parallel_Production_Contract | D4:23.1; D5:7; D6!Parallel_Production_Contract | Corrige referencia a política de preguntas compuestas y persistencia separada. |
| SCRP-006 | D4:8.3; D4:23.1; EVE06:canonical_variable_record | D4:8.3; D4:23.1; EVE06:CVR-003; EVE06:CVR-015 | Ancla trazabilidad y versionado de canonical variables en reglas exactas. |
| SCRP-007 | D8!Catalogo_Madre_Nodos; EVE03; EVE06:CVR-003 | D8!Catalogo_Madre_Nodos; EVE03:source_node_registry; EVE06:CVR-003 | Resuelve genealogía contra módulo exacto EVE03. |
| SCRP-012 | D4:1; D5:2; EVE06:evidence_item | D4:1; D5:2; EVE06:EVI-005 | Usa regla exacta que impide convertir inferencia no confirmada en evidencia. |
| SCRP-016 | D4:27; D4!Table24 | D4:27; D4!Table25 | Corrige Table24 (QA de catálogo) por Table25 (scope/authority). |
| SCRP-017 | D3!Table4; D3!Table5; D3!Table9 | D3!Table6; D3:R4; D3!Table10 | Sustituye tabla de rutas por límites regulatorios/candidate-only. |
| SCRP-018 | D3!Table10; D3:R7 | D3!Table11; D3:R7 | Corrige límite UI a tabla Debe/No debe. |
| SCRP-019 | D4:27; D4!Table24 | D4:27; D4!Table25 | Corrige Table24 por control de override/authority. |
| SCRP-020 | D4:21; D4:23.1 | D4:21; D4:25 | Estados se prueban contra DDL/enums, no contra ejemplo SCR. |

## Cumplimiento del marco de trabajo
| Control | Criterio | Resultado | Verificación | Evidencia |
| --- | --- | --- | --- | --- |
| FW-001 | Separación de conocimiento | PASS | Fundamento MMABP, gobierno runtime e interfaz de Producción Paralela permanecen diferenciados. | authority_chain; external_boundaries |
| FW-002 | Jerarquía documental | PASS | D1 manda método; D8 genealogía; D7 reducción; D5 gobierno; D6 ejecución; D4 implementación; D3 integración. | authority_chain; document_complementarity |
| FW-003 | Transformación, no acumulación | PASS | PDF/DOCX se transducen a reglas; XLSX opera como fuente congelada. | integration_rules |
| FW-004 | Módulos Fase 7 completos | PASS | SCR, EvidenceBundle, MDSB, IR candidate, registry candidate y blockers presentes. | modules_requested |
| FW-005 | Cadena evidencia→variables→gates→candidates | PASS | La interfaz exige registros gobernados y checkpoints antes de payload/candidate. | execution_pipeline |
| FW-006 | No entrevista Catálogo Madre | PASS | La UI/runtime no usa D8 como entrevista visible. | failure_guards:FG-001 |
| FW-007 | No implementación desde narrativa | PASS | D6 XLSX conserva autoridad ejecutable. | integration_rules; failure_guards:FG-002 |
| FW-008 | B7/C20 blindado | PASS | No produce MoC/IR/registry/export/diagnóstico directo. | SCRP-011; MDSB-011; IRCD-013; REGC-016; EXB-007 |
| FW-009 | C09 blindado | PASS | Satisfaction no sustituye feedback y route_missing bloquea. | SCRP-010; EVBP-008; MDSB-010; EXB-005; EXB-006 |
| FW-010 | Subrespuestas separadas | PASS | Preguntas compuestas no se aplanan. | EVBP-005; EXB-017 |
| FW-011 | Rutas críticas no inferidas | PASS | B0/B2/B3/B7 se evalúan y gaps se transportan. | EVBP-007; MDSB-009; EXB-003; EXB-004; EXB-005; EXB-007 |
| FW-012 | UI sin vísceras | PASS | Object Inventory/Membrane/SG Shadow no se exponen al cliente. | SCRP-018; REGC-022; EXB-029 |
| FW-013 | Sin salto evidencia→diagnóstico | PASS | Payloads/candidates no contienen diagnóstico final. | EVBP-013; IRCD-015; EXB-028 |
| FW-014 | MMABP antes que diagnóstico | PASS | Conformance precede consistency; candidates no conformantes no avanzan. | MDSB-005; MDSB-006; IRCD-010; IRCD-011 |
| FW-015 | Candidate-only | PASS | IR/registry/export permanecen candidate/rehearsal. | MDSB-017; IRCD-019; REGC-018; EXBE-014 |
| FW-016 | Sin registry activo | PASS | Todo intento de escritura activa se bloquea. | IRCD-016; REGC-002; EXB-025 |
| FW-017 | Sin export final | PASS | candidate_export no equivale a ExportCodePackage final. | EXB-027; external_boundaries |
| FW-018 | Sin Producción Paralela real | PASS | La interfaz solo prepara shadow/rehearsal. | external_boundaries; installation_contract |
| FW-019 | Source proof exacta | PASS | 154/154 reglas y blockers poseen unidad fuente verificable. | source_proof_contract |
| FW-020 | Override sin falso positivo | PASS | EXB-031 solo bloquea cuando override fue solicitado y no auditado. | EXB-031; export_blocker_test_vectors |

## Matriz de fidelidad fuente → regla

Artefacto completo: `EVE_07_Parallel_Production_Interface_v0_1_2_candidate.source_proof_matrix.json` (`41b683b21e7421dbfb23e123435712d216eaca9d47e75cec1b21bd5bf3444676`).

| ID | Módulo | Regla | Fuente primaria | Localizador | Extracto exacto | Clase | Revisión |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCRP-001 | scr_payload | Emitir SceneCanonicalRecordPatch solo desde un activity_runtime_run existente y scopeado. | EVE06:ARR-004 | $.modules.activity_runtime_run.rules[3] | rule_id=ARR-004 \| module=activity_runtime_run \| category=scope \| statement=Todo run debe quedar scopeado por case_id, role_id y activity_id. \| condition=any scope field missing \| action=reject run creation \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| SCRP-002 | scr_payload | El payload corresponde a una actividad primaria; actividades secundarias viajan solo como contexto. | D4:22 | section 22, table 20, row 2 | Una actividad primaria crea un activity_runtime_run. \| El runtime 40+20 aplica por actividad primaria. | transduced_structured | PENDING_REAUDIT |
| SCRP-003 | scr_payload | Declarar catalog_version_id congelado y coincidente con el run. | EVE06:ARR-003 | $.modules.activity_runtime_run.rules[2] | rule_id=ARR-003 \| module=activity_runtime_run \| category=catalog \| statement=El run debe fijar catalog_version_id validado antes de iniciar. \| condition=catalog version missing, mutable or QA failed \| action=reject run creation \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| SCRP-004 | scr_payload | No consolidar activity_anchor si B0 permanece weak_context o sin confirmación/reconstrucción. | D6!Critical_Routes:CR-B0 | Critical_Routes!A2:G2 | conservar weak_context o activar reconstrucción guiada. | transduced_structured | PENDING_REAUDIT |
| SCRP-005 | scr_payload | Persistir por separado action_verb, input_object, procedure_standard, output_product y confirmation_status. | D5:7 | section 7, table 9, row 2 | B0-Q01 \| action_verb; input_or_object; procedure_or_standard; output_or_result; user_correction_note | transduced_structured | PENDING_REAUDIT |
| SCRP-006 | scr_payload | Construir block_outputs únicamente desde canonical_variable_record activos y trazables. | EVE06:CVR-003 | $.modules.canonical_variable_record.rules[2] | rule_id=CVR-003 \| module=canonical_variable_record \| category=genealogy \| statement=Toda variable debe derivar de evidence_item/subfield_response o derivación trazable. \| condition=no source refs \| action=reject materialization \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| SCRP-007 | scr_payload | Cada salida de bloque conserva source_node_id, source_code y evidence refs cuando existan. | EVE06:CVR-003 | $.modules.canonical_variable_record.rules[2] | rule_id=CVR-003 \| module=canonical_variable_record \| category=genealogy \| statement=Toda variable debe derivar de evidence_item/subfield_response o derivación trazable. \| condition=no source refs \| action=reject materialization \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| SCRP-008 | scr_payload | Incluir gaps y flags del run; no ocultarlos ni convertirlos en valores por defecto. | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A3:E3 | readiness_state=ready_with_flags \| meaning=Avanza con advertencias trazadas. \| entry_condition=Gap no bloqueante o ruta crítica con evidencia suficiente pero bandera de riesgo. \| allowed_next_step=Consumir con flags; revisar en QA. \| blocked_actions=No ocultar bandera. | transduced_structured | PENDING_REAUDIT |
| SCRP-009 | scr_payload | No proyectar excepción de transformación si CR-B2-V3 no está cerrada. | D6!Critical_Routes:CR-B2 | Critical_Routes!A3:G3 | critical_route_id=CR-B2-V3-transformation_exception \| ruta=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| nodos=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| regla=La excepción de transformación se captura/deriva solo por ruta canónica; | transduced_structured | PENDING_REAUDIT |
| SCRP-010 | scr_payload | receiver_feedback solo entra si CR-B3-R9/C09 cerró; satisfaction no lo sustituye. | D5:6.2 | section 6.2, paragraph 23 | C09 queda normalizada con cuatro variables: receiver_feedback_exists; receiver_feedback; receiver_feedback_gap_flag; receiver_feedback_route_missing. Esta corrección elimina duplicidad y preserva la ruta crítica CR-B3-R9. | transduced_structured | PENDING_REAUDIT |
| SCRP-011 | scr_payload | B7 solo aporta readiness/preclassification no diagnóstica; no agrega clase, IR, registry o export. | D5:6.3 | section 6.3, table 8, row 7 | B7-Q39/B7-Q40 frontera MMABP \| No generan salida MoC directa, registry directo, IR, export ni diagnóstico; solo readiness/preclassification signal no diagnóstico para EvidenceBundle y Capa 2.0/2.5. | transduced_structured | PENDING_REAUDIT |
| SCRP-012 | scr_payload | No promover ai_inferred_unconfirmed a evidence hard dentro del SCR. | EVE06:EVI-005 | $.modules.evidence_item.rules[4] | rule_id=EVI-005 \| module=evidence_item \| category=confidence \| statement=confidence no transforma por sí sola una inferencia en evidencia capturada. \| condition=confidence high but unconfirmed \| action=retain ai_inferred_unconfirmed \| blocking=True \| severity=major | transduced_exact | PENDING_REAUDIT |
| SCRP-013 | scr_payload | Estado ready permite preparación; ready_with_flags obliga a transportar flags; estados bloqueados impiden emisión. | D4:4.1 | section 4.1, table 5, row 9 | readiness_evaluation \| Gates, gaps y consistencia mínima evaluándose. \| ready, ready_with_flags, blocked, reentry_required, manual_review_required | transduced_structured | PENDING_REAUDIT |
| SCRP-014 | scr_payload | Toda recomputación crea nueva versión y marca la anterior superseded. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| SCRP-015 | scr_payload | El mismo input lógico y versión producen el mismo checksum_source. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| SCRP-016 | scr_payload | case_id, role_id, activity_id y run_id deben coincidir con el contexto autorizado. | D4!Table25 | table 25, row 2 | Scoping \| Todo registro persistente debe incluir case_id directa o indirectamente. Cuando aplique, también role_id, activity_id y run_id. | transduced_structured | PENDING_REAUDIT |
| SCRP-017 | scr_payload | SCR patch no muta el core ni equivale a registro consolidado final. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| SCRP-018 | scr_payload | No exponer object_id, bindings, materialization events, snapshots o No-Go internos en UI cliente. | D3!Table11 | table 11, row 2 | Mostrar estado seguro de actividad, preguntas pendientes, respuestas y continuidad. \| Mostrar object_id, object_key, bindings, materialization events o snapshots. | transduced_structured | PENDING_REAUDIT |
| SCRP-019 | scr_payload | Registrar actor/sistema, versión, reason, prior payload y timestamp para override o emisión. | D4!Table25 | table 25, row 6 | Export payload \| Emitir payload hacia Producción Paralela requiere readiness_state permitido y actor/sistema autorizado. | transduced_structured | PENDING_REAUDIT |
| SCRP-020 | scr_payload | Estados permitidos: draft, ready, sent, superseded, blocked; no usar 'final' o 'certified'. | D4:21 | section 21, paragraph 284 | CREATE TABLE parallel_export_payload ( parallel_export_payload_id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES activity_runtime_run(run_id), payload_type TEXT NOT NULL CHECK (payload_type IN ('scr_patch','evidence_bundle_patch','mdsb_patch','combined_preview')), payload_json JSONB NOT NULL, payload_state TEXT NOT NULL CHECK (payload_state | transduced_with_normalized_names | PENDING_REAUDIT |
| EVBP-001 | evidence_bundle_payload | Construir EvidenceBundlePatch solo desde evidence_item y canonical_variable_record gobernados. | EVE06:EVI-001 | $.modules.evidence_item.rules[0] | rule_id=EVI-001 \| module=evidence_item \| category=creation \| statement=Crear evidence_item solo desde respuesta aceptada, confirmación/corrección o derivación gobernada. \| condition=unaccepted input \| action=reject evidence creation \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EVBP-002 | evidence_bundle_payload | Incluir únicamente evidence_item activos; conservar referencias a superseded sin tratarlos como vigentes. | EVE06:EVI-014 | $.modules.evidence_item.rules[13] | rule_id=EVI-014 \| module=evidence_item \| category=append_only \| statement=No borrar evidencia superseded. \| condition=delete requested \| action=reject delete and audit \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EVBP-003 | evidence_bundle_payload | Cada evidence_item exige epistemic_status, provenance_type, source_interaction_id y confidence. | EVE06:EVI-002 | $.modules.evidence_item.rules[1] | rule_id=EVI-002 \| module=evidence_item \| category=epistemic \| statement=Todo evidence_item exige epistemic_status y provenance_type. \| condition=metadata missing \| action=reject record \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EVBP-004 | evidence_bundle_payload | Conservar el valor literal o confirmado sin reescribirlo como interpretación. | D4:23.2 | section 23.2, paragraph 292 | { "payload_type": "evidence_bundle_patch", "run_id": "RUN-123", "evidence_items": [ { "evidence_item_id": "EVI-001", "source_interaction_id": "B3-Q21", "literal_value": "A veces tesorería la devuelve por falta de soporte.", "epistemic_status": "captured_user_evidence", "provenance_type": "user_answer", "confidence": 0.92 } ], "canonical_variables": [ | transduced_structured | PENDING_REAUDIT |
| EVBP-005 | evidence_bundle_payload | Las preguntas compuestas viajan como subrespuestas separadas, nunca como single_textbox opaco. | EVE06:RSP-008 | $.modules.response_ingest.rules[7] | rule_id=RSP-008 \| module=response_ingest \| category=subfields \| statement=Prohibir single_textbox opaco para preguntas compuestas. \| condition=compound interaction receives one opaque answer \| action=reject payload \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EVBP-006 | evidence_bundle_payload | Cada canonical variable incluye value, route_id, route_status, source evidence y gap flag cuando aplique. | EVE06:CVR-003 | $.modules.canonical_variable_record.rules[2] | rule_id=CVR-003 \| module=canonical_variable_record \| category=genealogy \| statement=Toda variable debe derivar de evidence_item/subfield_response o derivación trazable. \| condition=no source refs \| action=reject materialization \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EVBP-007 | evidence_bundle_payload | Incluir el estado de B0, B2, B3 y B7 aunque la ruta esté bloqueada. | D6!Critical_Routes | Critical_Routes!A3:G3 | critical_route_id=CR-B2-V3-transformation_exception \| ruta=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| nodos=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| regla=La excepción de transformación se captura/deriva solo por ruta canónica; | transduced_structured | PENDING_REAUDIT |
| EVBP-008 | evidence_bundle_payload | Si hay evidencia textual de feedback sin cierre C09, materializar receiver_feedback_route_missing=true. | D4:23.2 | section 23.2, paragraph 292 | { "payload_type": "evidence_bundle_patch", "run_id": "RUN-123", "evidence_items": [ { "evidence_item_id": "EVI-001", "source_interaction_id": "B3-Q21", "literal_value": "A veces tesorería la devuelve por falta de soporte.", "epistemic_status": "captured_user_evidence", "provenance_type": "user_answer", "confidence": 0.92 } ], "canonical_variables": [ | transduced_structured | PENDING_REAUDIT |
| EVBP-009 | evidence_bundle_payload | B7-Q39/B7-Q40/C20 solo se incluyen como preclassification/readiness signal no diagnóstico. | D5:6.3 | section 6.3, table 8, row 8 | B7-Q39/B7-Q40 en workbook \| mmabp_ir_target debe declararse como No IR directo; solo readiness/preclassification signal para EvidenceBundle y Capa 2.0/2.5. moc_output debe declarar No MoC output directo; solo readiness/preclassification signal no diagnóstico. | transduced_structured | PENDING_REAUDIT |
| EVBP-010 | evidence_bundle_payload | Transportar readiness_state, dominant_gate y manual_review_required sin suavizarlos. | D4:23.2 | section 23.2, paragraph 292 | { "payload_type": "evidence_bundle_patch", "run_id": "RUN-123", "evidence_items": [ { "evidence_item_id": "EVI-001", "source_interaction_id": "B3-Q21", "literal_value": "A veces tesorería la devuelve por falta de soporte.", "epistemic_status": "captured_user_evidence", "provenance_type": "user_answer", "confidence": 0.92 } ], "canonical_variables": [ | transduced_structured | PENDING_REAUDIT |
| EVBP-011 | evidence_bundle_payload | Todo gap se representa como registro explícito con type, affected_route, quadrant, severity y reentry target. | D4:21 | section 21, table 18, row 6 | branching_decision \| Registro de por qué se abrió/cerró una interacción causal o reentry. \| N por run | transduced_structured | PENDING_REAUDIT |
| EVBP-012 | evidence_bundle_payload | EvidenceBundle no declara conformance ni consistency satisfechas; solo transporta evidencia y decisiones de gate. | EVE05:mmabp_conformance_gate | $.modules.mmabp_conformance_gate | role=Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia. | transduced_structured | PENDING_REAUDIT |
| EVBP-013 | evidence_bundle_payload | El bundle no contiene diagnóstico EVE, VSM ni AHE cerrado. | D3!Table10 | table 10, row 2 | Capa 1.0 \| No diagnostica; produce expediente y bundle. | transduced_structured | PENDING_REAUDIT |
| EVBP-014 | evidence_bundle_payload | Deduplicar por evidence_item_id/variable_name+revision sin perder genealogía. | EVE06:evidence_item | $.modules.evidence_item.rules[3] | rule_id=EVI-004 \| module=evidence_item \| category=revision \| statement=response_revision_number y supersedes_evidence_item_id conservan la cadena de revisiones. \| condition=revision > 1 \| action=link previous evidence \| blocking=True \| severity=critical | transduced_structured | PENDING_REAUDIT |
| EVBP-015 | evidence_bundle_payload | No fabricar confidence; usar la calculada/capturada por el Execution Engine. | EVE06:EVI-005 | $.modules.evidence_item.rules[4] | rule_id=EVI-005 \| module=evidence_item \| category=confidence \| statement=confidence no transforma por sí sola una inferencia en evidencia capturada. \| condition=confidence high but unconfirmed \| action=retain ai_inferred_unconfirmed \| blocking=True \| severity=major | transduced_exact | PENDING_REAUDIT |
| EVBP-016 | evidence_bundle_payload | Emitir bundle solo para case_id/tenant autorizado y target permitido. | D4!Table25 | table 25, row 3 | Tenancy \| Ningún query de usuario puede leer datos fuera de su case_id/tenant autorizado. | transduced_structured | PENDING_REAUDIT |
| EVBP-017 | evidence_bundle_payload | Toda corrección de respuesta invalida bundle dependiente y crea nueva versión. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| EVBP-018 | evidence_bundle_payload | Calcular checksum sobre contenido canonizado, versión y refs de origen. | D4:21 | section 21, table 18, row 12 | parallel_export_payload \| Payload versionado hacia SCR/EvidenceBundle/MDSB. \| N por run | transduced_structured | PENDING_REAUDIT |
| EVBP-019 | evidence_bundle_payload | Un bundle blocked o superseded no puede enviarse como ready. | D4:21 | section 21, paragraph 284 | CREATE TABLE parallel_export_payload ( parallel_export_payload_id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES activity_runtime_run(run_id), payload_type TEXT NOT NULL CHECK (payload_type IN ('scr_patch','evidence_bundle_patch','mdsb_patch','combined_preview')), payload_json JSONB NOT NULL, payload_state TEXT NOT NULL CHECK (payload_state | transduced_structured | PENDING_REAUDIT |
| EVBP-020 | evidence_bundle_payload | EvidenceBundle prepara Capa 2.0/2.5; no ejecuta transducción, IR ni registry write. | D3!Table10 | table 10, row 2 | Capa 1.0 \| No diagnostica; produce expediente y bundle. | transduced_structured | PENDING_REAUDIT |
| EVBP-021 | evidence_bundle_payload | Registrar source payload refs, run, catalog, created_at y emitter. | D4:21 | section 21, table 18, row 12 | parallel_export_payload \| Payload versionado hacia SCR/EvidenceBundle/MDSB. \| N por run | transduced_structured | PENDING_REAUDIT |
| EVBP-022 | evidence_bundle_payload | Los payloads cerrados no admiten placeholders, ellipsis ni campos ficticios en producción/shadow validation. | D4:28 | section 28, table 26, row 4 | Payload cerrado \| SCR/EvidenceBundle/MDSB patch no usan placeholders en producción. | transduced_structured | PENDING_REAUDIT |
| MDSB-001 | mdsb_payload | Construir MMABPDesignSourceBundlePatch solo cuando existan EvidenceBundlePatch y structural_candidate_record gobernados. | EVE06:SCR-001 | $.modules.structural_candidate_record.rules[0] | rule_id=SCR-001 \| module=structural_candidate_record \| category=creation \| statement=Crear candidato solo desde variables canónicas y evidence_item gobernados. \| condition=source variable/evidence missing \| action=reject candidate \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| MDSB-002 | mdsb_payload | No consumir texto libre ni respuestas crudas; usar variables canónicas, evidence refs y candidates. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A4:E4 | salida=MMABPDesignSourceBundle \| función=Fuente estructural para MBA. \| campos mínimos=PM/MoC/PF/OLC candidates, checkpoints, blocked flags. \| consumidor=Producción Paralela. \| restricción=No consume texto libre sin variable canónica. | transduced_structured | PENDING_REAUDIT |
| MDSB-003 | mdsb_payload | Cada structural candidate conserva id, quadrant_hint, type, label, source_variable y source_evidence_item_id. | EVE06:SCR-005 | $.modules.structural_candidate_record.rules[4] | rule_id=SCR-005 \| module=structural_candidate_record \| category=genealogy \| statement=source_variable y source_evidence_item_id son obligatorios. \| condition=missing source reference \| action=reject candidate \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| MDSB-004 | mdsb_payload | Solo candidates en estado candidate o accepted_for_rehearsal pueden entrar; blocked/stale/superseded quedan como issue refs. | EVE06:SCR-015 | $.modules.structural_candidate_record.rules[14] | rule_id=SCR-015 \| module=structural_candidate_record \| category=state \| statement=candidate_state debe ser candidate, blocked, stale o superseded en esta fase. \| condition=state outside allowed phase-6 set \| action=reject state \| blocking=True \| severity=critical | transduced_exact | PENDING_REAUDIT |
| MDSB-005 | mdsb_payload | Cada candidato incluye checkpoint de conformance contra realidad; ausencia bloquea IR/registry candidate. | EVE05:mmabp_conformance_gate | $.modules.mmabp_conformance_gate.role | Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia. | transduced_structured | PENDING_REAUDIT |
| MDSB-006 | mdsb_payload | Cada candidato incluye checkpoint de consistency aplicable y referencias a compartimentos evaluados. | EVE05:mmabp_consistency_gate | $.modules.mmabp_consistency_gate.role | Comprobar coherencia factual, temporal, estructural y compuesta entre vistas conformantes. | transduced_structured | PENDING_REAUDIT |
| MDSB-007 | mdsb_payload | MoC/OLC candidates requieren Semantic Resolution Gate resuelto. | D6!Semantic_Resolution_Gates | Semantic_Resolution_Gates!A2:G2 | gate_id=SEM-001 \| riesgo_controlado=Convertir estado en clase \| trigger_condition=B2 o MoC detecta etiqueta que parece estado \| internal_checks=¿Es entidad estable o condición temporal del objeto? | transduced_structured | PENDING_REAUDIT |
| MDSB-008 | mdsb_payload | PF/OLC candidates con espera requieren PST gates resueltos. | D6!Process_State_Timer_Gates | Process_State_Timer_Gates!A2:G2 | gate_id=PST-001 \| trigger_condition=B4-Q24 indica espera fuerte \| required_capture=awaited_event \| visible_or_internal=visible si no se infiere con confianza \| blocking_rule=Bloquear Process State si no existe evento esperado. \| output_variables=awaited_event \| mmabp_target=PF | transduced_structured | PENDING_REAUDIT |
| MDSB-009 | mdsb_payload | B0, B2, B3 y B7 deben evaluarse; un route_missing se transporta como readiness gap. | D6!Critical_Routes | Critical_Routes!A4:G4 | MDSB; | transduced_structured | PENDING_REAUDIT |
| MDSB-010 | mdsb_payload | No crear handoff_feedback_event, rework o PF/OLC candidate desde receiver_satisfaction. | D6!Critical_Routes:CR-B3 | Critical_Routes!A4:G4 | \| bloqueo_si_falla=receiver_feedback_route_missing / CanonicalRouteException / no crear rework desde satisfacción subjetiva. | transduced_structured | PENDING_REAUDIT |
| MDSB-011 | mdsb_payload | B7-Q39/B7-Q40/C20 no crean MoC, IR, registry, export ni diagnóstico directo. | D5:6.3 | section 6.3, table 8, row 7 | B7-Q39/B7-Q40 frontera MMABP \| No generan salida MoC directa, registry directo, IR, export ni diagnóstico; solo readiness/preclassification signal no diagnóstico para EvidenceBundle y Capa 2.0/2.5. | transduced_structured | PENDING_REAUDIT |
| MDSB-012 | mdsb_payload | Mantener separados PM, MoC, PF y OLC; no fusionar vistas en una entidad genérica. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A9:E9 | salida=Consistency Checks \| función=Cruces PM↔MoC, PM↔PF, MoC↔PF, PF↔OLC, OLC↔MoC. \| campos mínimos=factual, temporal, structural, composite consistency. \| consumidor=QA / Producción Paralela. \| restricción=Conformance primero; consistencia después. | transduced_structured | PENDING_REAUDIT |
| MDSB-013 | mdsb_payload | ready_with_flags puede preparar MDSB solo si flags son no bloqueantes y se transportan completos. | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A3:E3 | readiness_state=ready_with_flags \| meaning=Avanza con advertencias trazadas. \| entry_condition=Gap no bloqueante o ruta crítica con evidencia suficiente pero bandera de riesgo. \| allowed_next_step=Consumir con flags; revisar en QA. \| blocked_actions=No ocultar bandera. | transduced_structured | PENDING_REAUDIT |
| MDSB-014 | mdsb_payload | manual_review_required impide estado ready/sent hasta decisión autorizada. | D4:27 | section 27, table 25, row 4 | Manual review \| manual_review_required solo puede resolverse por actor autorizado y debe crear runtime_audit_trail. | transduced_structured | PENDING_REAUDIT |
| MDSB-015 | mdsb_payload | Toda contradicción, semantic ambiguity, route missing o PST failure se conserva como issue ref. | D4:23.3 | section 23.3, paragraph 294 | { "payload_type": "mdsb_patch", "run_id": "RUN-123", "structural_candidates": [ { "structural_candidate_id": "SC-001", "quadrant_hint": "PF", "candidate_type": "handoff_feedback_event", "candidate_label": "Tesorería devuelve factura por soporte faltante", "source_variable": "receiver_feedback", "source_evidence_item_id": "EVI-001", "conformance_checkpoint": "Representa una acción operativa real del | transduced_structured | PENDING_REAUDIT |
| MDSB-016 | mdsb_payload | MDSB no es diagrama ni autoriza diagramación; incluye export_restriction explícita. | D3!Table5 | table 5, row 3 | MMABP-IR \| Proyectar representación intermedia computable para PM, PF, MoC, OLC. \| No equivale a diagrama final ni export final. | transduced_structured | PENDING_REAUDIT |
| MDSB-017 | mdsb_payload | El payload es patch/candidate; no equivale a MDSB final ni transducción final. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| MDSB-018 | mdsb_payload | Correcciones de evidencia o gates marcan MDSB anterior superseded. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| MDSB-019 | mdsb_payload | Solo actor/sistema autorizado puede pasar de draft a ready/sent. | D4!Table25 | table 25, row 6 | Export payload \| Emitir payload hacia Producción Paralela requiere readiness_state permitido y actor/sistema autorizado. | transduced_structured | PENDING_REAUDIT |
| MDSB-020 | mdsb_payload | Incluir checksum del payload y refs a SCR/EvidenceBundle versiones usadas. | D4:21 | section 21, table 18, row 12 | parallel_export_payload \| Payload versionado hacia SCR/EvidenceBundle/MDSB. \| N por run | transduced_structured | PENDING_REAUDIT |
| MDSB-021 | mdsb_payload | No admitir placeholders en structural_candidates, checkpoints o gaps. | D4:28 | section 28, table 26, row 4 | Payload cerrado \| SCR/EvidenceBundle/MDSB patch no usan placeholders en producción. | transduced_structured | PENDING_REAUDIT |
| MDSB-022 | mdsb_payload | Persistir emitter, timestamp, target, reason y prior payload refs. | D4:27 | section 27, table 25, row 8 | Auditoría \| Cualquier cambio a ruta crítica B0/B2/B3/B7 exige audit log obligatorio. | transduced_structured | PENDING_REAUDIT |
| IRCD-001 | mmabp_ir_candidate | Crear MMABP-IR candidate solo desde MDSBPatch ready y no bloqueado. | D3!Table5 | table 5, row 3 | MMABP-IR \| Proyectar representación intermedia computable para PM, PF, MoC, OLC. \| No equivale a diagrama final ni export final. | transduced_structured | PENDING_REAUDIT |
| IRCD-002 | mmabp_ir_candidate | MMABP-IR candidate es representación intermedia computable en ensayo; no es modelo final ni diagrama. | D3!Table5 | table 5, row 3 | MMABP-IR \| Proyectar representación intermedia computable para PM, PF, MoC, OLC. \| No equivale a diagrama final ni export final. | transduced_structured | PENDING_REAUDIT |
| IRCD-003 | mmabp_ir_candidate | Cada nodo/arista del IR conserva structural_candidate_id, source_variable y evidence_item refs. | D4:23.3 | section 23.3, paragraph 294 | { "payload_type": "mdsb_patch", "run_id": "RUN-123", "structural_candidates": [ { "structural_candidate_id": "SC-001", "quadrant_hint": "PF", "candidate_type": "handoff_feedback_event", "candidate_label": "Tesorería devuelve factura por soporte faltante", "source_variable": "receiver_feedback", "source_evidence_item_id": "EVI-001", "conformance_checkpoint": "Representa una acción operativa real del | transduced_structured | PENDING_REAUDIT |
| IRCD-004 | mmabp_ir_candidate | Mantener particiones explícitas PM, MoC, PF y OLC. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A9:E9 | salida=Consistency Checks \| función=Cruces PM↔MoC, PM↔PF, MoC↔PF, PF↔OLC, OLC↔MoC. \| campos mínimos=factual, temporal, structural, composite consistency. \| consumidor=QA / Producción Paralela. \| restricción=Conformance primero; consistencia después. | transduced_structured | PENDING_REAUDIT |
| IRCD-005 | mmabp_ir_candidate | PM IR candidate solo contiene cliente/necesidad/proceso/trigger/target state/soporte/sincronización; no tareas detalladas. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A5:E5 | salida=PM Registry Candidates \| función=Proceso, cliente, necesidad, trigger, estado objetivo, soporte, sincronización. \| campos mínimos=customer, need, process, trigger, target_state, support_processes. \| consumidor=MMABP-IR. \| restricción=No fusionar PM con PF. | transduced_structured | PENDING_REAUDIT |
| IRCD-006 | mmabp_ir_candidate | MoC IR candidate representa clases reales, relaciones, ISA/role/phase/end; no IDs técnicos ni esquema de base de datos. | EVE05:semantic_resolution_gate | $.modules.semantic_resolution_gate | role=Resolver ambigüedad clase/estado/atributo/proceso/ISA/role/phase/end antes de MoC/OLC. | transduced_structured | PENDING_REAUDIT |
| IRCD-007 | mmabp_ir_candidate | PF IR candidate no usa swimlanes ni flujos de datos; cada task referencia objeto/estado producido. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A7:E7 | salida=PF Registry Candidates \| función=Tareas, eventos, handoffs, gateways, Process States, timers. \| campos mínimos=task, produced_state, event, wait, timer, loop, handoff. \| consumidor=MMABP-IR. \| restricción=No swimlanes; cada tarea produce objeto en estado específico. | transduced_structured | PENDING_REAUDIT |
| IRCD-008 | mmabp_ir_candidate | Todo Process State candidate incluye awaited_event, release_condition, timer/timeout y exit_path. | D6!Process_State_Timer_Gates | Process_State_Timer_Gates!A2:G2 | gate_id=PST-001 \| trigger_condition=B4-Q24 indica espera fuerte \| required_capture=awaited_event \| visible_or_internal=visible si no se infiere con confianza \| blocking_rule=Bloquear Process State si no existe evento esperado. \| output_variables=awaited_event \| mmabp_target=PF | transduced_structured | PENDING_REAUDIT |
| IRCD-009 | mmabp_ir_candidate | OLC IR candidate representa un solo objeto con estados/transiciones/eventos/transformers/end; no un proceso. | EVE05:semantic_resolution_gate | $.modules.semantic_resolution_gate.gate_definitions[6] | gate_id=SEM-007 \| risk_controlled=Objeto fusionado/marsupial \| trigger_condition=Una respuesta mezcla ciclos de vida de objetos distintos \| internal_checks=Separar portador, documento, orden, entrega, aprobación, incidente. | transduced_structured | PENDING_REAUDIT |
| IRCD-010 | mmabp_ir_candidate | No marcar IR candidate como conformance-ready si cualquier modelo candidate falla contra realidad. | EVE05:mmabp_conformance_gate | $.modules.mmabp_conformance_gate | role=Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia. | transduced_structured | PENDING_REAUDIT |
| IRCD-011 | mmabp_ir_candidate | No marcar IR candidate como consistency-ready con contradicción factual, temporal, estructural o compuesta. | EVE05:mmabp_consistency_gate | $.modules.mmabp_consistency_gate | role=Comprobar coherencia factual, temporal, estructural y compuesta entre vistas conformantes. | transduced_structured | PENDING_REAUDIT |
| IRCD-012 | mmabp_ir_candidate | Ante inconsistencia no alinear modelos cosméticamente; regresar a evidencia/realidad y reentry. | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A5:E5 | readiness_state=blocked_by_contradiction \| meaning=Evidencia contradice otro bloque/modelo. \| entry_condition=Conformance o consistencia fallida. \| allowed_next_step=Reentry o manual_review. \| blocked_actions=No alinear cosméticamente modelos. | transduced_structured | PENDING_REAUDIT |
| IRCD-013 | mmabp_ir_candidate | No crear ningún elemento IR cuya única fuente sea B7/C20. | D5:6.3 | section 6.3, table 8, row 7 | B7-Q39/B7-Q40 frontera MMABP \| No generan salida MoC directa, registry directo, IR, export ni diagnóstico; solo readiness/preclassification signal no diagnóstico para EvidenceBundle y Capa 2.0/2.5. | transduced_structured | PENDING_REAUDIT |
| IRCD-014 | mmabp_ir_candidate | No crear rework/handoff feedback IR sin C09 cerrada y evidencia operativa del receptor. | D5:6.2 | section 6.2, paragraph 23 | C09 queda normalizada con cuatro variables: receiver_feedback_exists; receiver_feedback; receiver_feedback_gap_flag; receiver_feedback_route_missing. Esta corrección elimina duplicidad y preserva la ruta crítica CR-B3-R9. | transduced_structured | PENDING_REAUDIT |
| IRCD-015 | mmabp_ir_candidate | IR candidate no contiene diagnóstico EVE, VSM o AHE cerrado. | D3!Table10 | table 10, row 3 | Producción Paralela 1.6 \| Candidate export no es ExportCodePackage. | transduced_structured | PENDING_REAUDIT |
| IRCD-016 | mmabp_ir_candidate | IR candidate no escribe en registry activo; solo produce registry candidates separados. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| IRCD-017 | mmabp_ir_candidate | Toda recomputación crea nueva versión y marca la anterior superseded. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| IRCD-018 | mmabp_ir_candidate | Calcular checksum sobre IR canonizado, fuentes y gate versions. | D4:21 | section 21, paragraph 284 | CREATE TABLE structural_candidate_record ( structural_candidate_id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES activity_runtime_run(run_id), quadrant_hint TEXT NOT NULL, candidate_type TEXT NOT NULL, candidate_label TEXT NOT NULL, source_variable TEXT, source_evidence_item_id TEXT, conformance_checkpoint TEXT, | transduced_structured | PENDING_REAUDIT |
| IRCD-019 | mmabp_ir_candidate | MMABP-IR candidate permanece candidate_only/rehearsal_only; nunca adopta estado active, final o certified. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_with_normalized_names | PENDING_REAUDIT |
| IRCD-020 | mmabp_ir_candidate | Registrar gate snapshots, issue refs, actor/system y reason en cada transición. | D4:27 | section 27, table 25, row 8 | Auditoría \| Cualquier cambio a ruta crítica B0/B2/B3/B7 exige audit log obligatorio. | transduced_structured | PENDING_REAUDIT |
| REGC-001 | registry_candidate | Crear registry candidate solo desde MMABP-IR candidate listo y structural candidates trazables. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A5:E5 | salida=PM Registry Candidates \| función=Proceso, cliente, necesidad, trigger, estado objetivo, soporte, sincronización. \| campos mínimos=customer, need, process, trigger, target_state, support_processes. \| consumidor=MMABP-IR. \| restricción=No fusionar PM con PF. | transduced_structured | PENDING_REAUDIT |
| REGC-002 | registry_candidate | Registry candidate no equivale a registro activo ni autoriza escritura en registry productivo. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| REGC-003 | registry_candidate | registry_target permitido: PM, MoC, PF, OLC, Consistency o Readiness candidate. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A9:E9 | salida=Consistency Checks \| función=Cruces PM↔MoC, PM↔PF, MoC↔PF, PF↔OLC, OLC↔MoC. \| campos mínimos=factual, temporal, structural, composite consistency. \| consumidor=QA / Producción Paralela. \| restricción=Conformance primero; consistencia después. | transduced_structured | PENDING_REAUDIT |
| REGC-004 | registry_candidate | Conservar IR element ids, structural_candidate ids, source variables y evidence refs. | D3:R3 | table 13, row 4 | R3 \| Todo candidato debe tener fuente: binding, materialization, outbox, snapshot o evidence bundle. | transduced_exact | PENDING_REAUDIT |
| REGC-005 | registry_candidate | PM candidate exige customer, need, process, trigger, target_state y support/synchronization cuando apliquen. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A5:E5 | salida=PM Registry Candidates \| función=Proceso, cliente, necesidad, trigger, estado objetivo, soporte, sincronización. \| campos mínimos=customer, need, process, trigger, target_state, support_processes. \| consumidor=MMABP-IR. \| restricción=No fusionar PM con PF. | transduced_structured | PENDING_REAUDIT |
| REGC-006 | registry_candidate | No fusionar PM y PF ni almacenar tareas detalladas dentro de PM registry candidate. | D1:2.2.6 | PDF page 67, section 2.2.6 | in the object life cycle models and process description specified in the process map We use the BPMN standard [11] to capture the details of the process that allows us to capture | transduced_structured | PENDING_REAUDIT |
| REGC-007 | registry_candidate | MoC candidate exige class/relation semantics resueltas y evita IDs técnicos como conceptos. | EVE05:semantic_resolution_gate | $.modules.semantic_resolution_gate.gate_definitions[0] | gate_id=SEM-001 \| risk_controlled=Convertir estado en clase \| trigger_condition=B2 o MoC detecta etiqueta que parece estado \| internal_checks=¿Es entidad estable o condición temporal del objeto? | transduced_structured | PENDING_REAUDIT |
| REGC-008 | registry_candidate | No usar 'tipo de' como Jerarquía ISA sin especialización real. | D6!Semantic_Resolution_Gates:SEM-004 | Semantic_Resolution_Gates!A5:G5 | gate_id=SEM-004 \| riesgo_controlado=ISA falso por 'tipo de' \| trigger_condition=Usuario dice tipo de sin especialización real \| internal_checks=¿La especialización tiene identidad conceptual estable y reglas propias? | transduced_structured | PENDING_REAUDIT |
| REGC-009 | registry_candidate | Mantener role, phase y end como distinciones dinámicas; no fijarlas como clases estáticas sin resolución. | D6!Semantic_Resolution_Gates:SEM-006 | Semantic_Resolution_Gates!A7:G7 | gate_id=SEM-006 \| riesgo_controlado=Confusión role/phase/end \| trigger_condition=Clase cambia por contexto, etapa o terminación \| internal_checks=¿Es papel contextual, fase temporal o estado final? | transduced_structured | PENDING_REAUDIT |
| REGC-010 | registry_candidate | PF candidate exige task, event, object state, handoff/loop/gateway y Process State/timer cuando aplique. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A7:E7 | salida=PF Registry Candidates \| función=Tareas, eventos, handoffs, gateways, Process States, timers. \| campos mínimos=task, produced_state, event, wait, timer, loop, handoff. \| consumidor=MMABP-IR. \| restricción=No swimlanes; cada tarea produce objeto en estado específico. | transduced_structured | PENDING_REAUDIT |
| REGC-011 | registry_candidate | No almacenar swimlanes ni contexto organizacional como estructura PF. | D1:2.3.3 | PDF page 83, section 2.3.3 | In the case of swim lanes, it is even worse. | transduced_structured | PENDING_REAUDIT |
| REGC-012 | registry_candidate | OLC candidate exige objeto único, estado, transición, evento, transformer y end; no fusiona ciclos. | D6!Parallel_Production_Contract | Parallel_Production_Contract!A8:E8 | salida=OLC Registry Candidates \| función=Objetos, estados, transiciones, constructor, transformer, destructor. \| campos mínimos=object, state, transition, event, transformer, end. \| consumidor=MMABP-IR. \| restricción=No modelar OLC como proceso ni fusionar objetos. | transduced_structured | PENDING_REAUDIT |
| REGC-013 | registry_candidate | Aliases no crean duplicados; conservar alias y resolver same/different concept. | D6!Semantic_Resolution_Gates:SEM-005 | Semantic_Resolution_Gates!A6:G6 | \| possible_outputs=same_concept, different_concept, synonym, ambiguous \| blocking_rule=Conservar alias sin duplicar clase hasta confirmar. | transduced_structured | PENDING_REAUDIT |
| REGC-014 | registry_candidate | Cada record candidate incluye conformance_status y checkpoint refs. | EVE05:mmabp_conformance_gate | $.modules.mmabp_conformance_gate.role | Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia. | transduced_structured | PENDING_REAUDIT |
| REGC-015 | registry_candidate | Cada record candidate incluye consistency_status y compartments evaluados. | EVE05:mmabp_consistency_gate | $.modules.mmabp_consistency_gate.role | Comprobar coherencia factual, temporal, estructural y compuesta entre vistas conformantes. | transduced_structured | PENDING_REAUDIT |
| REGC-016 | registry_candidate | No crear registry candidate desde B7-Q39/B7-Q40/C20. | D5:6.3 | section 6.3, table 8, row 7 | B7-Q39/B7-Q40 frontera MMABP \| No generan salida MoC directa, registry directo, IR, export ni diagnóstico; solo readiness/preclassification signal no diagnóstico para EvidenceBundle y Capa 2.0/2.5. | transduced_structured | PENDING_REAUDIT |
| REGC-017 | registry_candidate | Feedback/rework registry candidate exige receiver_feedback_exists y route closed; satisfaction no basta. | D6!Critical_Routes:CR-B3 | Critical_Routes!A4:G4 | El feedback operativo exige señal de aviso, rechazo, devolución, corrección, recontacto o bloqueo. | transduced_structured | PENDING_REAUDIT |
| REGC-018 | registry_candidate | Registry candidate permanece en estado candidato/rehearsal o bloqueado; nunca adopta estado active. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_with_normalized_names | PENDING_REAUDIT |
| REGC-019 | registry_candidate | Recomputación invalida candidatos dependientes y conserva historial. | D4:24 | section 24, table 22, row 6 | Corrección que afecta export payload emitido \| Marcar parallel_export_payload como superseded y generar nueva versión. | transduced_structured | PENDING_REAUDIT |
| REGC-020 | registry_candidate | Detectar duplicados por semantic key sin fusionar automáticamente conceptos ambiguos. | D6!Semantic_Resolution_Gates:SEM-005 | Semantic_Resolution_Gates!A6:G6 | gate_id=SEM-005 \| riesgo_controlado=Alias o duplicado conceptual \| trigger_condition=Dos nombres parecen referir a la misma clase \| internal_checks=Comparar significado, relaciones, estados y uso operativo. | transduced_structured | PENDING_REAUDIT |
| REGC-021 | registry_candidate | Solo servicio shadow/rehearsal autorizado puede persistir candidates; nunca usuario final. | D4!Table25 | table 25, row 4 | Manual review \| manual_review_required solo puede resolverse por actor autorizado y debe crear runtime_audit_trail. | transduced_structured | PENDING_REAUDIT |
| REGC-022 | registry_candidate | No exponer IDs, bindings, inventory facts o registry internals en UI cliente. | D3!Table11 | table 11, row 2 | Mostrar estado seguro de actividad, preguntas pendientes, respuestas y continuidad. \| Mostrar object_id, object_key, bindings, materialization events o snapshots. | transduced_structured | PENDING_REAUDIT |
| EXBE-001 | export_blockers | Evaluar blockers antes de construir, marcar ready o enviar cualquier payload/candidate. | D4:9 | section 9, ordered steps | Ejecutar Semantic Resolution Gate si hay MoC/OLC candidate ambiguo. | transduced_structured | PENDING_REAUDIT |
| EXBE-002 | export_blockers | Un hard blocker abierto impide ready/sent, IR candidate y registry candidate. | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A2:E2 | readiness_state=ready \| meaning=Evidencia suficiente y consistente. \| entry_condition=Variables requeridas cerradas; sin contradicción ni ruta crítica fallida. \| allowed_next_step=Producción Paralela puede consumir. \| blocked_actions=No aplica. | transduced_structured | PENDING_REAUDIT |
| EXBE-003 | export_blockers | Orden de evaluación: scope/version → evidence/provenance → critical routes → SEM/PST → conformance → consistency → readiness → authority/finality. | D4:9 | section 9, paragraph 116 | Orden de evaluación recomendado por respuesta: | transduced_structured | PENDING_REAUDIT |
| EXBE-004 | export_blockers | Deduplicar blockers por code+run+affected_object sin perder eventos de reapertura. | D4:24 | section 24, table 21, row 7 | recompute_scope \| interaction_only, block, run, role_session o export_payload. | transduced_structured | PENDING_REAUDIT |
| EXBE-005 | export_blockers | Estados permitidos: open, resolved, superseded, waived_by_authority; hard methodological blockers no se pueden waive. | D4:27 | section 27, table 25, row 7 | Corrección de respuesta \| Toda corrección conserva respuesta previa como superseded; no se borra evidencia. | transduced_with_normalized_names | PENDING_REAUDIT |
| EXBE-006 | export_blockers | Resolver blocker solo con evidencia/gate/route nueva; nunca por default o silencio. | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A3:E3 | readiness_state=ready_with_flags \| meaning=Avanza con advertencias trazadas. \| entry_condition=Gap no bloqueante o ruta crítica con evidencia suficiente pero bandera de riesgo. \| allowed_next_step=Consumir con flags; revisar en QA. \| blocked_actions=No ocultar bandera. | transduced_structured | PENDING_REAUDIT |
| EXBE-007 | export_blockers | Correcciones reevalúan blockers dependientes y supersede payloads previos. | D4:24 | section 24, table 21, row 5 | derived_records_invalidated \| Lista de variables, gaps, candidates o payloads que deben recalcularse. | transduced_structured | PENDING_REAUDIT |
| EXBE-008 | export_blockers | Cada apertura/resolución registra actor, reason, source refs, prior/new status y timestamp. | D4:27 | section 27, table 25, row 8 | Auditoría \| Cualquier cambio a ruta crítica B0/B2/B3/B7 exige audit log obligatorio. | transduced_structured | PENDING_REAUDIT |
| EXBE-009 | export_blockers | Intento de export final, diagnóstico o activación no autorizada genera escalamiento algedónico/no-go. | D3:R8 | table 13, row 9 | R8 \| El canal algedónico detiene si aparece presión por export, diagnóstico o activación no autorizada. | transduced_exact | PENDING_REAUDIT |
| EXBE-010 | export_blockers | Export-preview puede mostrar blockers, pero nunca ocultarlos ni representar readiness falsa. | D4:7 | section 7, table 9, row 8 | GET /runtime/runs/{run_id}/export-preview \| Previsualizar salida hacia Producción Paralela. \| {run_id} \| {scr_preview, evidence_bundle_preview, mdsb_preview} | transduced_structured | PENDING_REAUDIT |
| EXBE-011 | export_blockers | Solo actor autorizado resuelve manual_review/override blockers; el sistema automático no los cierra. | D4:27 | section 27, table 25, row 4 | Manual review \| manual_review_required solo puede resolverse por actor autorizado y debe crear runtime_audit_trail. | transduced_structured | PENDING_REAUDIT |
| EXBE-012 | export_blockers | Los códigos internos se traducen para UI admin; no se exponen como vísceras al usuario final. | D3!Table11 | table 11, row 5 | Mantener continuidad del trabajo. \| Generar export final, transducción o producción real. | transduced_structured | PENDING_REAUDIT |
| EXBE-013 | export_blockers | No se resuelve inconsistencia alineando modelos entre sí; se regresa a evidencia factual. | D1:4.1-4.5 | PDF page 214, section 4.1-4.5 | 4.3 Basic Factual Consistency Rules | transduced_structured | PENDING_REAUDIT |
| EXBE-014 | export_blockers | La ausencia de blockers permite rehearsal/candidate progression, no certificación ni producción real. | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| EXB-001 | export_blockers | run/case/role/activity scope incompleto | EVE06:ARR-004 | $.modules.activity_runtime_run.rules[3] | rule_id=ARR-004 \| module=activity_runtime_run \| category=scope \| statement=Todo run debe quedar scopeado por case_id, role_id y activity_id. \| condition=any scope field missing \| action=reject run creation \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EXB-002 | export_blockers | catalog_version_id no coincide con el run congelado | EVE06:ARR-003 | $.modules.activity_runtime_run.rules[2] | rule_id=ARR-003 \| module=activity_runtime_run \| category=catalog \| statement=El run debe fijar catalog_version_id validado antes de iniciar. \| condition=catalog version missing, mutable or QA failed \| action=reject run creation \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EXB-003 | export_blockers | actividad no confirmada o weak_context bloqueante | D6!Critical_Routes:CR-B0 | Critical_Routes!A2:G2 | Si la actividad llega parcial o fallida, Bloque 0 reconstruye sin inventar estructura. | transduced_structured | PENDING_REAUDIT |
| EXB-004 | export_blockers | excepción de transformación sin ruta canónica 2.9/2.10 | D6!Critical_Routes:CR-B2 | Critical_Routes!A3:G3 | critical_route_id=CR-B2-V3-transformation_exception \| ruta=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| nodos=2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description \| regla=La excepción de transformación se captura/deriva solo por ruta canónica; | transduced_structured | PENDING_REAUDIT |
| EXB-005 | export_blockers | feedback textual sin C09 cerrada | D6!Critical_Routes:CR-B3 | Critical_Routes!A4:G4 | \| bloqueo_si_falla=receiver_feedback_route_missing / CanonicalRouteException / no crear rework desde satisfacción subjetiva. | transduced_structured | PENDING_REAUDIT |
| EXB-006 | export_blockers | receiver_satisfaction usada como receiver_feedback | D5:6.2 | section 6.2, paragraph 23 | C09 queda normalizada con cuatro variables: receiver_feedback_exists; receiver_feedback; receiver_feedback_gap_flag; receiver_feedback_route_missing. Esta corrección elimina duplicidad y preserva la ruta crítica CR-B3-R9. | transduced_structured | PENDING_REAUDIT |
| EXB-007 | export_blockers | B7/C20 intenta crear MoC/IR/registry/export/diagnóstico | D5:6.3 | section 6.3, table 8, row 7 | B7-Q39/B7-Q40 frontera MMABP \| No generan salida MoC directa, registry directo, IR, export ni diagnóstico; solo readiness/preclassification signal no diagnóstico para EvidenceBundle y Capa 2.0/2.5. | transduced_structured | PENDING_REAUDIT |
| EXB-008 | export_blockers | SEM-001..007 no resuelto | D6!Semantic_Resolution_Gates | Semantic_Resolution_Gates!A2:G2 | gate_id=SEM-001 \| riesgo_controlado=Convertir estado en clase \| trigger_condition=B2 o MoC detecta etiqueta que parece estado \| internal_checks=¿Es entidad estable o condición temporal del objeto? | transduced_structured | PENDING_REAUDIT |
| EXB-009 | export_blockers | PST gate faltante | D6!Process_State_Timer_Gates | Process_State_Timer_Gates!A2:G2 | gate_id=PST-001 \| trigger_condition=B4-Q24 indica espera fuerte \| required_capture=awaited_event \| visible_or_internal=visible si no se infiere con confianza \| blocking_rule=Bloquear Process State si no existe evento esperado. \| output_variables=awaited_event \| mmabp_target=PF | transduced_structured | PENDING_REAUDIT |
| EXB-010 | export_blockers | modelo candidate no representa realidad | EVE05:mmabp_conformance_gate | $.modules.mmabp_conformance_gate.role | Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia. | transduced_structured | PENDING_REAUDIT |
| EXB-011 | export_blockers | inconsistencia factual/temporal/estructural/compuesta | EVE05:mmabp_consistency_gate | $.modules.mmabp_consistency_gate | role=Comprobar coherencia factual, temporal, estructural y compuesta entre vistas conformantes. | transduced_structured | PENDING_REAUDIT |
| EXB-012 | export_blockers | readiness state bloqueado/reentry/manual review | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A8:E8 | readiness_state=reentry_required \| meaning=Debe volver a bloque específico. \| entry_condition=Gap bloquea conformance/consistencia/readiness. \| allowed_next_step=Reabrir bloque/gate específico. \| blocked_actions=No avanzar a Producción Paralela. | transduced_structured | PENDING_REAUDIT |
| EXB-013 | export_blockers | gap o flag existente omitido del payload | D6!Readiness_Gaps_Reentry | Readiness_Gaps_Reentry!A8:E8 | readiness_state=reentry_required \| meaning=Debe volver a bloque específico. \| entry_condition=Gap bloquea conformance/consistencia/readiness. \| allowed_next_step=Reabrir bloque/gate específico. \| blocked_actions=No avanzar a Producción Paralela. | transduced_structured | PENDING_REAUDIT |
| EXB-014 | export_blockers | evidence o variable sin provenance/epistemic status | EVE06:EVI-002 | $.modules.evidence_item.rules[1] | rule_id=EVI-002 \| module=evidence_item \| category=epistemic \| statement=Todo evidence_item exige epistemic_status y provenance_type. \| condition=metadata missing \| action=reject record \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EXB-015 | export_blockers | inferencia IA no confirmada tratada como evidencia dura | D5:2 | section 2, table 3, row 5 | MBA / Producción Paralela \| Consumidor estructural de evidencia gobernada. \| No modifica el catálogo ni diagnostica desde texto crudo. | transduced_structured | PENDING_REAUDIT |
| EXB-016 | export_blockers | texto libre salta a structural candidate/IR/registry | D6!Parallel_Production_Contract | Parallel_Production_Contract!A4:E4 | salida=MMABPDesignSourceBundle \| función=Fuente estructural para MBA. \| campos mínimos=PM/MoC/PF/OLC candidates, checkpoints, blocked flags. \| consumidor=Producción Paralela. \| restricción=No consume texto libre sin variable canónica. | transduced_structured | PENDING_REAUDIT |
| EXB-017 | export_blockers | pregunta compuesta guardada como texto opaco | D4:1 | section 1, table 2, row 5 | Preguntas compuestas con subcampos \| Toda interacción compuesta guarda subresponses como variables separables; nunca como single_textbox opaco. | transduced_structured | PENDING_REAUDIT |
| EXB-018 | export_blockers | payload usa evidencia/candidate superseded | EVE06:EVI-014 | $.modules.evidence_item.rules[13] | rule_id=EVI-014 \| module=evidence_item \| category=append_only \| statement=No borrar evidencia superseded. \| condition=delete requested \| action=reject delete and audit \| blocking=True \| severity=blocker | transduced_exact | PENDING_REAUDIT |
| EXB-019 | export_blockers | candidate blocked/stale/rejected usado como activo | EVE06:SCR-015 | $.modules.structural_candidate_record.rules[14] | rule_id=SCR-015 \| module=structural_candidate_record \| category=state \| statement=candidate_state debe ser candidate, blocked, stale o superseded en esta fase. \| condition=state outside allowed phase-6 set \| action=reject state \| blocking=True \| severity=critical | transduced_exact | PENDING_REAUDIT |
| EXB-020 | export_blockers | payload contiene placeholders/ellipsis | D4:28 | section 28, table 26, row 4 | Payload cerrado \| SCR/EvidenceBundle/MDSB patch no usan placeholders en producción. | transduced_structured | PENDING_REAUDIT |
| EXB-021 | export_blockers | payload/candidate sin checksum | D4:21 | section 21, table 18, row 12 | parallel_export_payload \| Payload versionado hacia SCR/EvidenceBundle/MDSB. \| N por run | transduced_structured | PENDING_REAUDIT |
| EXB-022 | export_blockers | source_node/source_code/evidence refs incompletos | D8 | Catalogo_Madre_Nodos!A1:AJ1 | master_node_id \| capture_node_id \| source_question_code_intact \| source_document \| canonical_variable_output \| canonical_route_id | transduced_structured | PENDING_REAUDIT |
| EXB-023 | export_blockers | actor/sistema sin autoridad de export | D4:27 | section 27, table 25, row 6 | Export payload \| Emitir payload hacia Producción Paralela requiere readiness_state permitido y actor/sistema autorizado. | transduced_structured | PENDING_REAUDIT |
| EXB-024 | export_blockers | case/tenant mismatch | D4:27 | section 27, table 25, row 8 | Auditoría \| Cualquier cambio a ruta crítica B0/B2/B3/B7 exige audit log obligatorio. | transduced_structured | PENDING_REAUDIT |
| EXB-025 | export_blockers | candidate intenta escribir registry activo | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| EXB-026 | export_blockers | shadow/rehearsal candidate intenta promoción productiva | D3:R4 | table 13, row 5 | R4 \| Todo artifact de Producción Paralela es candidate_only hasta fase explícita contraria. | transduced_exact | PENDING_REAUDIT |
| EXB-027 | export_blockers | candidate_export se trata como ExportCodePackage final | D3!Table5 | table 5, row 3 | MMABP-IR \| Proyectar representación intermedia computable para PM, PF, MoC, OLC. \| No equivale a diagrama final ni export final. | transduced_structured | PENDING_REAUDIT |
| EXB-028 | export_blockers | payload intenta emitir diagnóstico EVE/VSM/AHE | D3!Table10 | table 10, row 2 | Capa 1.0 \| No diagnostica; produce expediente y bundle. | transduced_structured | PENDING_REAUDIT |
| EXB-029 | export_blockers | Object Inventory/Membrane/SG Shadow internals expuestos al cliente | D3!Table11 | table 11, row 4 | Traducir señales a lenguaje cliente sobrio. \| Mostrar SG signals, routing decisions, No-Go técnico o lenguaje S1/S2/S3. | transduced_structured | PENDING_REAUDIT |
| EXB-030 | export_blockers | manual_review_required sin resolución autorizada | D4:27 | section 27, table 25, row 4 | Manual review \| manual_review_required solo puede resolverse por actor autorizado y debe crear runtime_audit_trail. | transduced_structured | PENDING_REAUDIT |
| EXB-031 | export_blockers | overrideRequested=true y overrideAudited=false | D4!Table25 | table 25, row 5 | Override \| Todo override debe registrar actor_id, razón, alcance, prior_value, new_value y timestamp. | transduced_structured | PENDING_REAUDIT |
| EXB-032 | export_blockers | gap crítico quedó como carry_forward por presupuesto | D6!Branching_Budget_Rules | Branching_Budget_Rules!A10:F10 | Regla_ID=BR-009 \| Señal / condición=Presupuesto causal agotado \| Acción=Priorizar rutas críticas B0/B2/B3/B7, luego Process State/timer, luego semantic resolution. \| Presupuesto=Máximo 20 \| Prioridad=Gobierno de fatiga \| Reentry / cierre=carry_forward con gap explícito | transduced_structured | PENDING_REAUDIT |
| EXB-033 | export_blockers | MMABP-IR candidate tratado como diagrama final | D3!Table5 | table 5, row 3 | MMABP-IR \| Proyectar representación intermedia computable para PM, PF, MoC, OLC. \| No equivale a diagrama final ni export final. | transduced_structured | PENDING_REAUDIT |
| EXB-034 | export_blockers | MDSB patch tratado como MDSB final/transducción final | D3!Table10 | table 10, row 7 | Fase 8 PP rehearsal \| Persiste candidatos; no producción real ni MDSB final. | transduced_structured | PENDING_REAUDIT |

## Vectores de prueba de blockers
| Test | Descripción | Contexto | Esperado |
| --- | --- | --- | --- |
| EXB031-NO-OVERRIDE | Contexto normal sin override no debe disparar EXB-031. | {"overrideRequested": false, "overrideAudited": false} | False |
| EXB031-UNAUDITED-OVERRIDE | Override solicitado sin auditoría debe disparar EXB-031. | {"overrideRequested": true, "overrideAudited": false} | True |
| EXB031-AUDITED-OVERRIDE | Override solicitado y auditado no debe disparar EXB-031. | {"overrideRequested": true, "overrideAudited": true} | False |
| B7-DIRECT-PROJECTION-BLOCK | Intento de proyección directa B7 debe disparar EXB-007. | {"b7DirectProjectionAttempted": true} | EXB-007 |
| C09-ROUTE-MISSING-BLOCK | Feedback sin cierre C09 debe disparar EXB-005. | {"c09RouteClosed": false} | EXB-005 |
| SATISFACTION-NOT-FEEDBACK | Derivar feedback desde satisfaction debe disparar EXB-006. | {"feedbackDerivedFromSatisfaction": true} | EXB-006 |

## Controles QA
| ID | Control | Método | Aprobación |
| --- | --- | --- | --- |
| PPI-QA-001 | required_dependencies | Verify source/dependency IDs, versions and checksums. | D3/D4/D5/D6/D8 and EVE03/04/05/06 present. |
| PPI-QA-002 | module_count | Count requested modules. | Exactly 6. |
| PPI-QA-003 | atomic_rules | Count module rules + blocker definitions. | All rules have source_refs. |
| PPI-QA-004 | scr_closed_schema | Validate required SCR fields. | No missing required field. |
| PPI-QA-005 | evidence_closed_schema | Validate EvidenceBundle fields. | Evidence/provenance/routes/readiness/gaps present. |
| PPI-QA-006 | mdsb_closed_schema | Validate MDSB fields. | Candidates/checkpoints/gaps/export restriction present. |
| PPI-QA-007 | no_placeholders | Search payload examples/contracts for placeholder markers. | 0 placeholders in executable schema. |
| PPI-QA-008 | B0_guard | Attempt SCR with unconfirmed B0. | Blocked. |
| PPI-QA-009 | B2_guard | Attempt candidate from transformation text without route. | Blocked. |
| PPI-QA-010 | C09_guard | Attempt feedback from satisfaction. | Blocked + receiver_feedback_route_missing. |
| PPI-QA-011 | B7_guard | Attempt direct IR/registry/export from B7. | Blocked. |
| PPI-QA-012 | SEM_guard | Attempt MoC/OLC candidate with unresolved SEM. | Blocked. |
| PPI-QA-013 | PST_guard | Attempt Process State without timer/exit. | Blocked. |
| PPI-QA-014 | conformance_first | Attempt consistency/IR before conformance. | Blocked. |
| PPI-QA-015 | consistency_compartments | Validate factual/temporal/structural/composite status refs. | Applicable compartments represented. |
| PPI-QA-016 | compound_subfields | Ensure EvidenceBundle preserves separable subfields. | No opaque flattening. |
| PPI-QA-017 | provenance | Scan evidence/variables/candidates. | 100% provenance and source refs. |
| PPI-QA-018 | supersession | Revise a source response. | Old payload/candidates superseded; new version built. |
| PPI-QA-019 | checksum | Validate deterministic checksum. | All ready/sent outputs have checksum. |
| PPI-QA-020 | scope_tenancy | Cross-case access attempt. | Blocked and audited. |
| PPI-QA-021 | authority | Unauthorized send/override attempt. | Blocked and audited. |
| PPI-QA-022 | candidate_only | Search for active/final/production states. | 0 unauthorized states. |
| PPI-QA-023 | no_diagnosis | Search executable outputs for diagnostic emission. | 0 diagnostic outputs. |
| PPI-QA-024 | no_registry_write | Attempt active registry mutation. | Blocked. |
| PPI-QA-025 | no_final_export | Attempt ExportCodePackage/final MDSB. | Blocked + algedonic escalation. |
| PPI-QA-026 | no_internal_ui_leak | Project payload to product UI. | Internal IDs/objects blocked. |
| PPI-QA-027 | typescript_compile | tsc --noEmit strict. | Exit 0. |
| PPI-QA-028 | typescript_smoke | Run pure blocker evaluation fixtures. | Expected blockers/eligibility. |
| PPI-QA-029 | docx_render | Render all pages and inspect. | No clipping/overflow. |
| PPI-QA-030 | source_immutability | Hash sources before/after build. | No source mutation. |
| PPI-QA-031 | source_proof_matrix_completeness | Count proof rows and unresolved refs. | 154 rows; 151 previously accepted + 3 workbench-repaired; independent QA required. |
| PPI-QA-032 | source_ref_semantic_correction | Verify controlled corrections from v0.1 audit. | 59 corrections documented; no stale incorrect ref. |
| PPI-QA-033 | exb031_no_false_positive | Evaluate no-override, unaudited-override and audited-override vectors. | Only unaudited requested override is blocked. |
| PPI-QA-034 | dictamen_negation | Search final dictamen in JSON/TS/MD/DOCX/manifest. | Contains sin registry activo, sin export final, sin transducción final. |
| PPI-QA-035 | artifact_equivalence | Compare canonical rule IDs/counts and version across JSON/TS/MD/DOCX. | All generated artifacts represent same 154 rules and 34 blockers. |
| PPI-QA-036 | manifest_self_registration | Verify manifest entry and deterministic self-hash policy. | Manifest listed in artifacts with canonical self-hash policy. |
| PPI-QA-037 | framework_compliance | Evaluate 20 framework controls. | 20/20 PASS. |
| PPI-QA-038 | source_files_immutable | Recompute 11 source SHA256 values. | 11/11 match declared hashes. |

## Contrato de instalación
| Campo | Valor |
| --- | --- |
| recommended_repo_path | docs/chips/parallel-production-interface/EVE_07_Parallel_Production_Interface_v0_1_2_candidate/ |
| required_dependency_versions | {"EVE-03-CANONICAL-CATALOG": "0.1.0", "EVE-04-RUNTIME-CATALOG": "0.2.0", "EVE-05-GATE-ENGINE": "0.1.0", "EVE-06-EXECUTION-ENGINE": "0.1.0"} |
| activation_mode | shadow_first_after_repo_intake |
| active_runtime_authority | False |
| product_wiring | False |
| database_migrations_applied | False |
| registry_write | False |
| diagnosis_enabled | False |
| final_export_enabled | False |
| final_transduction_enabled | False |
| parallel_production_enabled | False |
| shadow_rehearsal_enabled | False |

## Alcance de mesa de trabajo

### Preparado
- 154 source proof units preservadas; 3 pruebas primarias reparadas.
- 26 source-to-target mappings con locator exacto preparado.
- Nota técnica de ruta larga D8 controlada.
- 16 claims de certificación degradados a evidencia no certificante.
- EXB-031 y todas las fronteras de no-cableado preservadas.

### No certificado / pendiente de reauditoría
- fidelidad fuente final
- equivalencia final de artefactos
- shadow integration
- product installation
- active registry writes
- production export
- final transduction
- real Parallel Production execution
- end-to-end platform wiring

## Dictamen final


WORKBENCH_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN; exact source proof roles, source-to-target locator precision and certification claims repaired; candidate-only, not installed, without runtime authority, registry write, final export, final transduction or real Parallel Production.

## Workbench content repair V1

**Repair ID:** `EVE07-WORKBENCH-CONTENT-REPAIR-V1`  
**Trigger:** `PARALLEL_PRODUCTION_INTERFACE_RECORD_RULE_QA_UNSATISFACTORY_RETURN_TO_WORKBENCH`  
**Result:** `WORKBENCH_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN`  
**Independent QA required:** `true`

### QA gaps addressed

- `pending_source_proof`: 3 -> 0 in the workbench registry.
- `pending_locator_precision`: 27 -> 0 in the workbench registry.
- `certification_claim_unverified`: 16 premature claims downgraded; no final certification claim remains.
- `materialDifference`: no semantic meaning changed; evidence and status metadata only.
- The anticipated shadow harness remains non-certifying.

### Exact proof role repairs

| Rule | Direct proof after repair | Contextual guard | Status |
| --- | --- | --- | --- |
| REGC-006 | D5:10/Table13/R5/C3 - heading "10. Contrato de salida hacia Producción Paralela"; table 13, row 5, column "Restricción" | D1:2.2.6/2.3.6 | READY_FOR_QA_RERUN |
| REGC-011 | D5:10/Table13/R7/C3 - heading "10. Contrato de salida hacia Producción Paralela"; table 13, row 7, column "Restricción" | D1:2.3.3 | READY_FOR_QA_RERUN |
| EXBE-013 | EVE05:$.modules.mmabp_conformance_gate.principles[4] - $.modules.mmabp_conformance_gate.principles[4] | D1:4.1-4.5 | READY_FOR_QA_RERUN |

### Exact source-to-target mapping locators

| Mapping | Source | Exact locator | Target | Status |
| --- | --- | --- | --- | --- |
| STM7-001 | D4 | heading "23.1 SceneCanonicalRecordPatch"; paragraph 289 | modules.scr_payload.payload_schema | PENDING_INDEPENDENT_QA |
| STM7-002 | D4 | heading "23.2 EvidenceBundlePatch"; paragraph 291 | modules.evidence_bundle_payload.payload_schema | PENDING_INDEPENDENT_QA |
| STM7-003 | D4 | heading "23.3 MMABPDesignSourceBundlePatch"; paragraph 293 | modules.mdsb_payload.payload_schema | PENDING_INDEPENDENT_QA |
| STM7-004 | D4 | table 4, row 18, columns "Entidad/Descripción/Campos clave" | payload types/states/version/checksum | PENDING_INDEPENDENT_QA |
| STM7-005 | D4 | table 9, rows 8-9, columns "Endpoint/Propósito/Input/Output" | execution_pipeline steps 4-11 | PENDING_INDEPENDENT_QA |
| STM7-006 | D4 | heading "24. Idempotencia, revisión de respuestas e invalidación/recomputación"; paragraph 297; table 22, row 6 | versioning and supersession rules | PENDING_INDEPENDENT_QA |
| STM7-007 | D4 | heading "27. Seguridad mínima, scope y auditoría de autoridad"; paragraph 303; table 25, rows 2-8 | scope, authorization and audit blockers | PENDING_INDEPENDENT_QA |
| STM7-008 | D4 | heading "28. Criterios de listo para implementación v1.0.1"; table 26, rows 2-9 | qa_controls and no-placeholder controls | PENDING_INDEPENDENT_QA |
| STM7-009 | D6 | sheet "Parallel_Production_Contract", range A1:E9 | payload/registry target contracts | PENDING_INDEPENDENT_QA |
| STM7-010 | D6 | sheet "MMABP_Output_Map", range A1:L61 | quadrant candidate fields | PENDING_INDEPENDENT_QA |
| STM7-011 | D6 | sheet "Critical_Routes", range A1:G5 | EXB-003..007 and payload route rules | PENDING_INDEPENDENT_QA |
| STM7-012 | D6 | sheet "Semantic_Resolution_Gates", range A1:G8 | EXB-008, MDSB/IR/registry semantic rules | PENDING_INDEPENDENT_QA |
| STM7-013 | D6 | sheet "Process_State_Timer_Gates", range A1:G7 | EXB-009 and PF/OLC candidate rules | PENDING_INDEPENDENT_QA |
| STM7-014 | D6 | sheet "Readiness_Gaps_Reentry", range A1:E8 | payload eligibility and export blockers | PENDING_INDEPENDENT_QA |
| STM7-015 | D5 | heading "6.2 C09 normalizada"; paragraph 22; table 7, rows 2-6 | feedback route blockers and candidate restrictions | PENDING_INDEPENDENT_QA |
| STM7-016 | D5 | heading "6.3 B7-Q39/B7-Q40 versus C20"; table 8, rows 2-8 | no direct IR/registry/export rules | PENDING_INDEPENDENT_QA |
| STM7-017 | D3 | table 5, rows 2-5, columns "Componente Producción Paralela 1.6/Función/Límite" | IR/registry candidate-only boundaries | PENDING_INDEPENDENT_QA |
| STM7-018 | D3 | table 6, rows 2-5 and table 10, rows 2-7 | external_boundaries and finality blockers | PENDING_INDEPENDENT_QA |
| STM7-019 | D3 | table 13, rows 2-9, rules R1-R8 | integration_rules, genealogy, rehearsal and algedonic escalation | PENDING_INDEPENDENT_QA |
| STM7-020 | EVE06 | $.modules.evidence_item | EvidenceBundle evidence input | PENDING_INDEPENDENT_QA |
| STM7-021 | EVE06 | $.modules.canonical_variable_record | SCR/EvidenceBundle variable input | PENDING_INDEPENDENT_QA |
| STM7-022 | EVE06 | $.modules.structural_candidate_record | MDSB/IR/registry candidate input | PENDING_INDEPENDENT_QA |
| STM7-023 | EVE05 | $.modules.{critical_route_gate,semantic_resolution_gate,process_state_timer_gate,mmabp_conformance_gate,mmabp_consistency_gate} | route/SEM/PST/conformance/consistency snapshots | PENDING_INDEPENDENT_QA |
| STM7-024 | EVE04 | $.modules and $.source_to_target_mapping | catalog/version/source validation | PENDING_INDEPENDENT_QA |
| STM7-025 | D8 | sheets "Catalogo_Madre_Nodos" A1:AJ165; "Source_Question_Registry" A1:K165; "Canonical_Variables" A1:K165; plus EVE03 JSON $.modules.source_node_registry | source refs in all payload/candidates | PENDING_INDEPENDENT_QA |
| STM7-026 | D1 | physical pages 67 (2.2.6), 83 (2.3.3), 117 (2.3.6), 219-225 (4.5 and chapter summary) | IR and registry candidate guards | PENDING_INDEPENDENT_QA |

### D8 long-path control

Canonical source: `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`  
SHA256: `09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2`  
Allowed technical read methods: Windows extended path, Node fs, or temporary subst for diagnostic reading. The source content is unchanged.

### Certification claim policy

The previous internal certification report is retained as historical package input but is **not final proof**. The only authorized next state is `INDEPENDENT_RECORD_RULE_SOURCE_QA_RERUN`.

### No-cableado preserved

- `installation_status`: `NOT_INSTALLED`
- `activation_status`: `SHADOW_ONLY`
- `active_runtime_authority`: `false`
- `product_wiring`: `false`
- `registry_write`: `false`
- `diagnosis_enabled`: `false`
- `final_export_enabled`: `false`
- `final_transduction_enabled`: `false`
- `parallel_production_enabled`: `false`

