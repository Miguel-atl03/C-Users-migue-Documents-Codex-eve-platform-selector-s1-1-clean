# EVE 06 Execution Engine v0.1

**Estado:** READY_FOR_INDEPENDENT_QA_RERUN  
**Certificación:** WORKBENCH_REPAIRED_NOT_REAUDITED  
**Instalación:** NOT_INSTALLED

## Propósito

Compilar el metabolismo de ejecución que crea runs e instancias, ingiere respuestas idempotentes, conserva evidencia, materializa variables y produce candidatos estructurales gobernados antes de readiness o Producción Paralela.

## Módulos

- `activity_runtime_run`
- `interaction_instance`
- `response_ingest`
- `evidence_item`
- `canonical_variable_record`
- `structural_candidate_record`

## Cadena de autoridad

- D8 conserva la genealogía y los códigos originales.
- D7 decide la reducción 164→40+20.
- D5 gobierna fronteras, políticas epistemológicas y QA.
- D6 ejecuta interacciones, subcampos, variables, branching, rutas y readiness.
- D4 implementa entidades, estados, payloads, persistencia, idempotencia y recomputación.
- EVE04 entrega el catálogo runtime corregido y congelado.
- EVE05 evalúa gates antes de structural_candidate_record.
- D3 integra downstream sin activar diagnóstico ni Producción Paralela prematuramente.
- D1 actúa únicamente como guardia metodológica contextual para PM/MoC/PF/OLC y conformance→consistency; no prueba reglas de ejecución.

## Fuentes rectoras utilizadas

| ID | Documento | Rol | Uso directo | Secciones/hojas |
| --- | --- | --- | --- | --- |
| D4 | EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | contrato técnico primario de implementación | Sí | 0; 1; 2; 3; 4; 5; 6; 7; 8.1; 8.2; 8.3; 9; 10; 11; 12; 13; 14; 15; 16; 17; 18; 20; 21; 22; 23; 24; 25; 26; 27; 28 |
| D6 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | fuente implementable congelada | Sí | Version_Control; Runtime_Interactions_Base_40; Runtime_Interactions_Causal_20; Required_Field_Model; UX_Subfield_Structure; Epistemic_Policy; MMABP_Output_Map; Canonical_Variables; Branching_Budget_Rules; Critical_Routes; Readiness_Gaps_Reentry; Parallel_Production_Contract; QA_Checklist; Implementation_Dictionaries |
| D5 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | gobierno operativo | Sí | 1; 2; 3; 4; 5; 6.1; 6.2; 6.3; 7; 8; 9; 10; 11; 12 |
| D8 | EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | genealogía canónica | Sí | Catalogo_Madre_Nodos; Source_Question_Registry; Canonical_Variables; Critical_Routes; Readiness_Reentry_Gaps; Epistemic_Governance; MMABP_Mapping; Variables_Canonicas_Source; Implementation_Dictionaries; Audit_Issues |
| EVE04 | EVE_04_Runtime_Catalog_v0_2.json | dependencia ejecutable de catálogo runtime | Sí | modules; integration_rules; failure_guards; source_to_target_mapping; support; flags |
| EVE05 | EVE_05_Gate_Engine_v0_1.json | dependencia ejecutable de gates | Sí | execution_pipeline; modules; enums; failure_guards; installation_contract |
| EVE03 | EVE_03_Canonical_Catalog_v0_1.json | dependencia de source_node_registry | No | modules.source_node_registry; modules.source_code_registry; modules.canonical_variables; modules.critical_routes; modules.epistemic_policy |
| D7 | Arquitectura_Runtime_40_20_EVE_MMABP.docx | frontera arquitectónica | No | 0; 1; 2; 4; 5; 8; 10 |
| D3 | EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | frontera de integración downstream | No | 0; 1; 2; 8; 10 |
| D1 | Fundamentals of Business Architecture Modeling.pdf | guardia metodológica MMABP | No | 2.2.6; 2.3.6; 3.1.5; 3.2.4; 4.1; 4.2; 4.3; 4.4; 4.5; páginas físicas 2.2.6=67, 2.3.6=117, 3.1.5=159, 3.2.4=178, 4.1=194, 4.2=195 |

## Complementariedad documental

| Documento | Completa a | Relación | No sustituye |
| --- | --- | --- | --- |
| D8 | captura Capa 1 | Da source_node_registry, códigos, variables, MMABP_Mapping, checkpoints y genealogía de structural candidates. | No decide experiencia 40+20 ni persistencia. |
| D7 | D8 | Decide cómo reducir el corpus a 40+20 sin perder genealogía. | No opera como dataset. |
| D5 | D7 | Gobierna políticas, fronteras B7/C09, preguntas compuestas y QA. | No sustituye el workbook. |
| D6 | D5 | Materializa las definiciones implementables que consume el Execution Engine. | No inventa nodos ni reglas. |
| D4 | D6 | Convierte el workbook en entidades, estados, servicios, payloads y DDL. | No rediseña catálogo ni método. |
| EVE04 | D6 transducido | Expone el catálogo runtime v0.2 validado para consumo máquina. | No sustituye D6 ni D8. |
| EVE05 | D4/D6 | Bloquea candidatos que incumplen rutas, SEM, PST, conformance o consistency. | No persiste respuestas ni evidencia. |
| D3 | D4 | Define el contrato de integración con el organismo EVE. | No activa diagnóstico ni export final. |
| D1 | todos | Delimita metodológicamente PM/MoC/PF/OLC y la secuencia conformance→consistency como guardia contextual. | No implementa runtime, no activa gates y no funciona como prueba directa de ejecución. |

## Reglas de integración

- **INT6-001** — El Execution Engine solo consume EVE04/D6 congelados y versionados; no lee narrativa DOCX para decidir interacciones.  
  **Fuentes/prueba:** D5:2; D6!Version_Control; EVE04:source_documents.
- **INT6-002** — Cada activity_runtime_run representa una actividad primaria; las secundarias viajan como contexto o backlog por defecto.  
  **Fuentes/prueba:** D4:22; D4!Table19.
- **INT6-003** — Toda interacción compuesta se persiste en subcampos separados; el single_textbox opaco está prohibido.  
  **Fuentes/prueba:** D4:12; D6!UX_Subfield_Structure.
- **INT6-004** — response_ingest preserva literal, provenance, epistemic_status, idempotencia y revisión antes de materializar variables.  
  **Fuentes/prueba:** D4:8.2; D4:24; D6!Epistemic_Policy.
- **INT6-005** — evidence_item es append-only; una corrección supersede, no borra, la evidencia previa.  
  **Fuentes/prueba:** D4:24; D4:27.
- **INT6-006** — canonical_variable_record solo se materializa desde mapeos EVE04/D6 y evidencia gobernada.  
  **Fuentes/prueba:** D6!Canonical_Variables; EVE04:modules.canonical_variables.
- **INT6-007** — EVE05 debe evaluar rutas críticas, SEM, PST y gates MMABP antes de habilitar structural_candidate_record.  
  **Fuentes/prueba:** EVE05:execution_pipeline; EVE05:modules; D4:9; D4:10.
- **INT6-008** — Conformance precede consistency; candidate no equivale a modelo válido ni hecho estructural.  
  **Fuentes/prueba:** EVE05:mmabp_conformance_gate; EVE05:mmabp_consistency_gate; D1:4.1; D1:4.2.
- **INT6-009** — B7-Q39/B7-Q40/C20 solo producen readiness/preclassification signals; nunca candidatos MoC/IR/registry/export directos.  
  **Fuentes/prueba:** D5:6.3; D6!Critical_Routes; EVE05.
- **INT6-010** — C09 conserva satisfaction separado de receiver_feedback y activa route_missing cuando existe señal textual sin cierre canónico.  
  **Fuentes/prueba:** D5:6.1; D5:6.2; D6:C09.
- **INT6-011** — Una revisión invalida variables, gaps, candidatos y payloads dependientes, y exige recomputación auditada.  
  **Fuentes/prueba:** D4:24; D4!Table21.
- **INT6-012** — El módulo no ejecuta diagnóstico, export final, IR, registry ni Producción Paralela; solo prepara handoffs gobernados.  
  **Fuentes/prueba:** D4:13; D3:8; D3:12.
- **INT6-013** — Todos los registros quedan scopeados por case_id directa o indirectamente y, cuando aplica, por role_id, activity_id y run_id.  
  **Fuentes/prueba:** D4:27; D4!Table24.
- **INT6-014** — La UI consume InteractionViewModel y lenguaje de trabajo; no expone Object Inventory, Membrane, SG Shadow, MMABP, VSM o AHE.  
  **Fuentes/prueba:** D4:11; D3:10; D3:12.

## Fallas bloqueadas

| ID | Falla | Consecuencia | Acción |
| --- | --- | --- | --- |
| FG6-001 | Crear un run desde una actividad secundaria por defecto | Multiplica carga y rompe el límite de 8 actividades primarias. | `reject_run_creation` |
| FG6-002 | Instanciar interacción desde narrativa DOCX | Runtime ambiguo y no testeable. | `reject_interaction_definition` |
| FG6-003 | Guardar pregunta compuesta como un solo texto | Pérdida de subrespuestas, provenance, variables y QA. | `reject_response_payload` |
| FG6-004 | Aceptar respuesta sin idempotency_key | Duplicación de respuestas y evidencia por reintentos. | `reject_ingest` |
| FG6-005 | Sobrescribir una respuesta corregida | Se destruye trazabilidad y recomputación. | `reject_destructive_update` |
| FG6-006 | Convertir inferencia IA no confirmada en captured_user_evidence | Evidencia falsa y conformance contaminada. | `reject_epistemic_promotion` |
| FG6-007 | Materializar variable no declarada en EVE04/D6 | Se inventa estructura fuera del catálogo. | `reject_variable_materialization` |
| FG6-008 | Cerrar ruta crítica desde texto libre lateral | Se fabrican hechos estructurales. | `blocked_by_missing_canonical_route` |
| FG6-009 | Convertir receiver_satisfaction en receiver_feedback | Rework falso, PF falso y OLC contaminado. | `reject_feedback_materialization` |
| FG6-010 | No activar receiver_feedback_route_missing cuando corresponde | La ruta CR-B3-R9 aparenta cierre inexistente. | `force_route_missing_gap` |
| FG6-011 | Crear structural candidate sin source_variable o evidence_item | Candidato no auditable. | `reject_candidate` |
| FG6-012 | Crear candidato antes de EVE05 | Se saltan rutas, SEM, PST, conformance o consistency. | `reject_candidate` |
| FG6-013 | B7/C20 crea MoC/IR/registry/export directo | Diagnóstico prematuro y contaminación downstream. | `manual_review_required` |
| FG6-014 | No invalidar derivados tras corrección | Readiness y candidatos quedan desincronizados de la evidencia. | `force_recompute` |
| FG6-015 | Borrar evidence_item superseded | Pérdida de historia epistemológica. | `reject_delete` |
| FG6-016 | Exponer Object Inventory, Membrane o SG Shadow en UI | La plataforma muestra maquinaria interna al cliente. | `reject_projection` |
| FG6-017 | Saltar de evidencia o variable a diagnóstico | Violación de frontera Capa 1. | `reject_transition` |
| FG6-018 | Mutar catálogo activo durante un run | El mismo run cambia de semántica a mitad de ejecución. | `reject_catalog_mutation` |

## Cadena ejecutable

| Orden | Paso | Descripción |
| --- | --- | --- |
| 1 | `validate_dependencies` | Verificar EVE03, EVE04 v0.2, EVE05 v0.1, D6/D8 y checksums; impedir ejecución si falta fuente o QA. |
| 2 | `create_activity_runtime_run` | Crear run por actividad primaria bajo role_runtime_session y fijar versión de catálogo. |
| 3 | `instantiate_next_interaction` | Instanciar definición EVE04 permitida por trigger, estado y presupuesto; producir view-model request. |
| 4 | `ingest_response` | Validar idempotencia, scope, revisión, subcampos, epistemic_status y confirmación; persistir literal y subrespuestas. |
| 5 | `create_evidence_items` | Crear evidence items append-only con provenance, confidence y cadena de revisión. |
| 6 | `materialize_canonical_variables` | Materializar solo variables declaradas en EVE04/D6, actualizar rutas y gaps. |
| 7 | `execute_gate_engine` | Enviar variables/evidencia a EVE05: Critical Route, SEM, PST, conformance y consistency. |
| 8 | `create_structural_candidates` | Crear candidatos PM/MoC/PF/OLC únicamente cuando los gates lo permiten. |
| 9 | `request_branching_and_readiness` | Emitir señales a BranchingEngine y ReadinessEngine externos; no decidir diagnóstico ni export final. |
| 10 | `handle_revision_recompute` | En correcciones, supersede evidencia, marque derivados stale y recompute rutas, gates, branching y readiness. |
| 11 | `emit_governed_handoff` | Preparar registros para SCR/EvidenceBundle/MDSB preview sin activar Producción Paralela. |

## Fronteras externas

| Componente | Contrato |
| --- | --- |
| branching_engine | external; consumes variable/gap signals and opens interactions under EVE04 rules. |
| readiness_engine | external; consumes EVE05 summary and run state. |
| parallel_production_exporter | external and disabled in this chip. |
| diagnostic_bridge | disabled. |
| product_ui | not wired; consumes view models only after separate integration. |

## 1. Activity Runtime Run

Gobernar la ejecución 40+20 por actividad primaria, su scope, presupuesto, estados, readiness provisional y frontera de export.

### Esquema

| Campo | Tipo | Requerido | Default | Descripción | Fuentes |
| --- | --- | --- | --- | --- | --- |
| run_id | string | Sí |  | Identificador único del run. | D4:3; D4:14 |
| case_id | string | Sí |  | Scope del caso/tenant. | D4:14; D4:27 |
| role_id | string | Sí |  | Rol funcional propietario del recorrido. | D4:14; D4:22 |
| activity_id | string | Sí |  | Actividad primaria recorrida. | D4:3; D4:22 |
| role_runtime_session_id | string | Sí |  | Contenedor de hasta 8 actividades primarias por rol; puede mapearse por relación equivalente. | D4:21; D4:22 |
| catalog_version_id | string | Sí |  | Versión congelada del catálogo usada por el run. | D4:3; D4:14; D4:26 |
| state | run_state | Sí |  | Estado de máquina del run. | D4:4.1; D4:25 |
| base_visible_count | integer | Sí | 0 | Interacciones base visibles consumidas. | D4:5; D4:14 |
| causal_visible_count | integer | Sí | 0 | Interacciones causales visibles consumidas. | D4:5; D4:14 |
| readiness_state | readiness_state\|null | No |  | Decisión externa/provisional de readiness. | D4:3; D4:4.1; D4:25 |
| created_at | ISO-8601 timestamp | Sí |  | Creación del run. | D4:14 |
| updated_at | ISO-8601 timestamp | Sí |  | Última transición o recomputación. | D4:14 |

### Máquina de estados

| Estado | Transiciones permitidas |
| --- | --- |
| initialized | semantic_preload_loaded, archived |
| semantic_preload_loaded | b0_confirmation_pending |
| b0_confirmation_pending | active_base_capture, blocked_by_missing_activity |
| active_base_capture | base_complete, reentry_required, manual_review_required, archived |
| base_complete | causal_evaluation_pending |
| causal_evaluation_pending | active_causal_capture, readiness_evaluation |
| active_causal_capture | causal_evaluation_pending, readiness_evaluation, reentry_required, manual_review_required |
| readiness_evaluation | ready, ready_with_flags, blocked, reentry_required, manual_review_required |
| ready | exported_to_parallel_production, archived |
| ready_with_flags | exported_to_parallel_production, manual_review_required, archived |
| blocked | reentry_required, manual_review_required, archived |
| blocked_by_missing_activity | b0_confirmation_pending, manual_review_required, archived |
| reentry_required | active_base_capture, active_causal_capture, manual_review_required, archived |
| manual_review_required | active_base_capture, active_causal_capture, archived |
| exported_to_parallel_production | archived |
| archived | terminal |

### Mapeo a lifecycle backend

| Execution state | Lifecycle alias |
| --- | --- |
| initialized | draft |
| semantic_preload_loaded | active |
| b0_confirmation_pending | waiting_user |
| active_base_capture | in_progress |
| base_complete | in_progress |
| causal_evaluation_pending | in_progress |
| active_causal_capture | in_progress |
| readiness_evaluation | in_progress |
| ready | ready |
| ready_with_flags | ready_with_flags |
| blocked | blocked |
| blocked_by_missing_activity | blocked |
| reentry_required | waiting_reentry |
| manual_review_required | manual_review_required |
| exported_to_parallel_production | completed |
| archived | archived |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ARR-001 | creation | Crear un run por cada actividad primaria seleccionada. | activity is primary and role session allows selection | create run initialized with frozen catalog version | Sí | blocker | D4:3; D4:22; D4!Table19 |
| ARR-002 | creation | No abrir run completo para actividad secundaria por defecto. | activity is secondary | preserve as context, dependency, handoff or backlog | Sí | major | D4:22; D4!Table19 |
| ARR-003 | catalog | El run debe fijar catalog_version_id validado antes de iniciar. | catalog version missing, mutable or QA failed | reject run creation | Sí | blocker | D4:6; D4:26; D6!Version_Control; EVE04 |
| ARR-004 | scope | Todo run debe quedar scopeado por case_id, role_id y activity_id. | any scope field missing | reject run creation | Sí | blocker | D4:14; D4:27 |
| ARR-005 | role_session | El contenedor de rol limita a 8 actividades primarias salvo override metodológico auditado. | selected primary count would exceed 8 | block selection or require authorized override | Sí | critical | D4:21; D4:22; D4!Table18; D4!Table19 |
| ARR-006 | initialization | El run inicia en initialized/draft y debe cargar semantic preload antes de B0. | new run accepted | persist initialized run and preload status | No | major | D4:4.1; D4:7 |
| ARR-007 | state_machine | No se puede saltar B0 confirmation cuando la actividad no está confirmada. | preload incomplete, partial or unconfirmed | transition to b0_confirmation_pending or blocked_by_missing_activity | Sí | blocker | D4:4.1; D4:10; EVE05:CR-B0 |
| ARR-008 | state_machine | active_base_capture solo ocurre después de B0 confirmado o reconstruido por usuario. | B0 route not closed | deny transition to active_base_capture | Sí | blocker | D4:4.1; D4!Table9; EVE05 |
| ARR-009 | budget | El conteo base visible no puede superar 40. | base_visible_count >= 40 and another base requested | reject opening and create gap if required | Sí | critical | D4:5; D4!Table6; D6!Runtime_Interactions_Base_40 |
| ARR-010 | budget | El conteo causal visible no puede superar 20. | causal_visible_count >= 20 and another causal requested | reject opening; carry_forward gap unless critical route blocking | Sí | critical | D4:5; D4!Table6; D4:9; D6!Branching_Budget_Rules |
| ARR-011 | budget | Solo interacciones mostradas consumen presupuesto visible. | internal derivation or hidden clarification | do not increment visible counts | No | major | D4:5; D4!Table6 |
| ARR-012 | budget | Una pregunta compuesta cuenta como una interacción visible aunque sus subcampos se persistan separados. | compound interaction shown | increment visible count by one | No | major | D4:5; D4!Table6; D4:12 |
| ARR-013 | state_machine | base_complete debe preceder causal_evaluation_pending. | base required interactions not complete | deny causal evaluation | Sí | major | D4:4.1 |
| ARR-014 | state_machine | La evaluación causal alterna entre active_causal_capture y causal_evaluation_pending hasta readiness_evaluation. | causal response changes signals | re-evaluate openings under budget | No | major | D4:4.1; D4:9 |
| ARR-015 | readiness | El Execution Engine solo persiste readiness provisional/externa; no inventa decisión final. | gate summary absent | do not transition to ready states | Sí | blocker | D4:4.1; D4:9; EVE05 |
| ARR-016 | readiness | ready y ready_with_flags requieren rutas críticas y gates evaluados. | blocking gate or unresolved critical route | transition to blocked, reentry or manual review | Sí | blocker | D4:4.1; D4:10; EVE05 |
| ARR-017 | manual_review | manual_review_required solo puede resolverse por actor autorizado con audit trail. | manual review resolution attempted | require actor_id, reason and audit event | Sí | critical | D4:27; D4!Table24 |
| ARR-018 | reentry | Toda reentry debe conservar razón, target y costo de presupuesto. | reentry requested | create reentry decision and budget event; do not erase prior state | No | major | D4:4.1; D4:5; D4:9; D4:27 |
| ARR-019 | export_boundary | exported_to_parallel_production solo puede ser aplicado por interfaz externa autorizada. | export transition requested inside this chip | reject transition | Sí | blocker | D4:4.1; D4:13; D4:27; D3 |
| ARR-020 | terminal | archived es terminal para ejecución activa. | run state archived | reject active transitions | Sí | major | D4:4.1 |
| ARR-021 | audit | Todo cambio de ruta crítica o readiness debe actualizar updated_at y audit trail. | critical route/readiness change | append audit event and update timestamp | No | major | D4:9; D4:21; D4:27 |
| ARR-022 | boundary | El run no contiene diagnóstico, IR, registry ni export final. | any such output requested | reject and emit boundary violation | Sí | blocker | D4:1; D4:13; D3; EVE05 |

### Salidas permitidas

- `activity_runtime_run`
- `run_state_event`
- `budget_ledger_event`
- `readiness_evaluation_request`
- `audit_event`

### Salidas prohibidas

- `diagnosis`
- `IR`
- `registry_write`
- `final_export`
- `parallel_production_activation`

## 2. Interaction Instance

Materializar cada interacción base, causal, interna o de reentry sin alterar la definición del catálogo.

### Esquema

| Campo | Tipo | Requerido | Default | Descripción | Fuentes |
| --- | --- | --- | --- | --- | --- |
| interaction_instance_id | string | Sí |  | Identificador de instancia. | D4:3; D4:14 |
| run_id | string | Sí |  | Run al que pertenece. | D4:3; D4:14 |
| runtime_interaction_id | string | Sí |  | Definición EVE04/D6 instanciada. | D4:3; D4:14; D6!Runtime_Interactions_* |
| state | interaction_state | Sí |  | Estado de la instancia. | D4:4.2; D4:25 |
| shown_at | ISO-8601 timestamp\|null | No |  | Momento en que fue visible. | D4:14 |
| answered_at | ISO-8601 timestamp\|null | No |  | Momento en que cerró respuesta. | D4:14 |
| skipped_reason | string\|null | No |  | Razón de omisión por regla. | D4:3; D4:4.2 |
| opening_decision_ref | string\|null | No |  | Referencia a branching_decision cuando fue abierta causalmente; semántica equivalente aceptada. | D4:21; D4:9 |
| reentry_of_instance_id | string\|null | No |  | Referencia a instancia previa cuando existe reentry; no borra historia. | D4:4.2; D4:24 |

### Máquina de estados

| Estado | Transiciones permitidas |
| --- | --- |
| pending | opened, shown, skipped_by_rule, closed_by_branching, blocked, archived |
| opened | shown, skipped_by_rule, closed_by_branching, blocked, archived |
| shown | answered, inferred_unconfirmed, confirmed, corrected, blocked, reopened, archived |
| answered | confirmed, corrected, reopened, closed_by_recompute, archived |
| inferred_unconfirmed | confirmed, corrected, blocked, reopened, archived |
| confirmed | reopened, closed_by_recompute, archived |
| corrected | reopened, closed_by_recompute, archived |
| skipped_by_rule | reopened, archived |
| closed_by_other | reopened, archived |
| closed_by_branching | reopened, archived |
| closed_by_recompute | reopened, archived |
| blocked | reopened, archived |
| reopened | shown, answered, confirmed, corrected, blocked, archived |
| archived | terminal |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IIN-001 | definition | Instanciar únicamente una runtime_interaction_def de EVE04/D6. | interaction id not found in frozen catalog | reject instance creation | Sí | blocker | D4:3; D4:6; EVE04 |
| IIN-002 | genealogy | La instancia conserva run_id y runtime_interaction_id sin duplicar ni reescribir la definición. | create instance | persist immutable references | Sí | major | D4:3; D4:14 |
| IIN-003 | state_machine | Las transiciones deben respetar el enum y la máquina de estado de interacción. | invalid state transition | reject transition | Sí | critical | D4:4.2; D4:25 |
| IIN-004 | opening | pending solo puede pasar a shown/opened si trigger_condition o regla base aplica. | trigger false | mark skipped_by_rule/closed_by_branching | Sí | major | D4:4.2; D4:9; D6!Runtime_Interactions_* |
| IIN-005 | budget | shown incrementa presupuesto según group/bucket; pending o internal no. | state becomes shown | append budget ledger event | No | major | D4:5; D4!Table6 |
| IIN-006 | subfields | Una interacción compuesta debe exponer el schema de subcampos de D6. | ui component is compound | attach separable subfield schema | Sí | blocker | D4:11; D4:12; D6!UX_Subfield_Structure |
| IIN-007 | subfields | La instancia no puede degradar una pregunta compuesta a single_answer opaco. | compound schema has multiple subfields | reject renderer/instance configuration | Sí | blocker | D5:7; D6!UX_Subfield_Structure |
| IIN-008 | budget | Las causales solo cuentan como causales cuando son mostradas. | causal is internal/closed before shown | do not increment causal count | No | major | D4:5 |
| IIN-009 | closure | closed_by_other/closed_by_branching no equivale a answered. | gap resolved elsewhere | close with reason, without response fabrication | No | major | D4:4.2; D4:9 |
| IIN-010 | reentry | reopened/reentry debe preservar la instancia anterior y su respuesta. | reentry occurs | create new or linked reopened instance; never overwrite history | Sí | critical | D4:4.2; D4:24 |
| IIN-011 | B7_boundary | B7-Q39/B7-Q40 se instancian como microconfirmaciones no diagnósticas. | B7 instance created | force preclassification-only policy | Sí | blocker | D5:6.3; D6:B7; EVE04; EVE05 |
| IIN-012 | C20_boundary | C20 solo puede abrir por baja confianza o señales cruzadas no resueltas. | B7 already resolved with sufficient confidence | reject C20 opening | Sí | critical | D5:6.3; D6!Branching_Budget_Rules; EVE04 |
| IIN-013 | C09 | C09 debe conservar sus cuatro subcampos y variables de ruta. | C09 instance created | require feedback signal/content/effect/route gap structure | Sí | blocker | D5:6.2; D6!UX_Subfield_Structure; EVE04 |
| IIN-014 | B0 | B0-Q01 debe conservar action, input/object, procedure/standard, output/result y correction note. | B0-Q01 instance created | require exact subfield schema | Sí | blocker | D4:12; D6!UX_Subfield_Structure |
| IIN-015 | PST | C11 debe conservar awaited_event, release_condition, timer/timeout, resolver_owner y exit_path. | C11 instance created | require exact subfield schema | Sí | blocker | D4:12; D6!UX_Subfield_Structure; EVE05 |
| IIN-016 | required_fields | source_nodes, source_codes, trigger, variables, checkpoints, gaps y reentry no pueden estar vacíos en definición. | instance definition incomplete | reject instance creation | Sí | blocker | D5:12; D6!Required_Field_Model |
| IIN-017 | ui_boundary | La instancia/renderer no expone MMABP, VSM, AHE, Inventory, Membrane o SG Shadow al usuario. | view model contains internal terms | reject projection | Sí | critical | D4:11; D3 |
| IIN-018 | timestamps | shown_at y answered_at se registran en las transiciones correspondientes. | state changes to shown/answered | persist timestamp | No | major | D4:14 |
| IIN-019 | immutability | La instancia no muta runtime_interaction_def ni el catálogo congelado. | instance-specific change requested | store instance metadata only | Sí | critical | D4:6; D4:26 |
| IIN-020 | blocking | Falta de evidencia o contradicción debe cerrar en blocked/reentry/manual review, no como respuesta ficticia. | required subfield unresolved | set blocked state and gap | Sí | blocker | D4:4.2; D4:10; D6!Readiness_Gaps_Reentry |

### Salidas permitidas

- `runtime_interaction_instance`
- `interaction_view_model_request`
- `budget_ledger_event`
- `branching_decision_ref`
- `audit_event`

### Salidas prohibidas

- `invented_interaction`
- `catalog_mutation`
- `diagnosis`
- `direct_candidate`

## 3. Response Ingest

Aceptar respuestas de forma idempotente, validar subcampos y epistemología, persistir literal/revisiones y disparar evidencia y recomputación.

### Orden de procesamiento

1. validate scope, run and instance state
2. deduplicate by idempotency_key
3. validate response revision/supersedes
4. validate answers against subfield schema
5. persist literal response and runtime_subfield_response
6. apply epistemic and confirmation policy
7. emit evidence item seeds
8. invoke canonical variable materialization
9. emit invalidation/recompute plan when revised
10. return receipt and next_action request

### Payload

| Campo | Tipo | Requerido | Fuentes |
| --- | --- | --- | --- |
| run_id | string | Sí | D4:8.2 |
| runtime_interaction_id | string | Sí | D4:8.2 |
| interaction_instance_id | string | Sí | D4:8.2 |
| response_type | response_type | Sí | D4:8.2 |
| answers | array<subfield_answer> | Sí | D4:8.2; D4:12 |
| idempotency_key | string | Sí | D4:24; D4!Table20 |
| response_revision_number | integer | Sí | D4:24; D4!Table20 |
| supersedes_response_id | string\|null | No | D4:24; D4!Table20 |
| client_timestamp | ISO-8601 timestamp | Sí | D4:8.2 |
| confirmation_status | confirmation_status\|null | No | D4:7; D4:8.2; D6!Epistemic_Policy |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RSP-001 | idempotency | Toda respuesta requiere idempotency_key. | key missing | reject ingest | Sí | blocker | D4:24; D4!Table20 |
| RSP-002 | revision | Toda respuesta declara response_revision_number. | revision missing or invalid | reject ingest | Sí | critical | D4:24; D4!Table20 |
| RSP-003 | revision | Una revisión posterior debe declarar supersedes_response_id. | revision number > 1 and supersedes missing | reject ingest | Sí | critical | D4:24; D4!Table20 |
| RSP-004 | scope | La respuesta debe pertenecer al mismo run/case/role/activity de la instancia. | scope mismatch | reject ingest and audit | Sí | blocker | D4:27 |
| RSP-005 | state | Solo instancias shown/opened/reopened aceptan respuesta; answered requiere revisión explícita. | instance state invalid | reject ingest | Sí | critical | D4:4.2; D4:24 |
| RSP-006 | schema | Cada subfield_name debe existir en UX_Subfield_Structure/interaction definition. | unknown subfield | reject unknown field | Sí | critical | D4:8.2; D4:12; D6!UX_Subfield_Structure |
| RSP-007 | subfields | Persistir una runtime_subfield_response por cada subcampo. | payload accepted | emit separated subfield records | Sí | blocker | D4:1; D4:9; D4:12 |
| RSP-008 | subfields | Prohibir single_textbox opaco para preguntas compuestas. | compound interaction receives one opaque answer | reject payload | Sí | blocker | D4:1; D5:7; D6!UX_Subfield_Structure |
| RSP-009 | epistemic | Cada subrespuesta exige epistemic_status permitido. | status missing/unknown | reject payload | Sí | critical | D4:1; D4:8.2; D4:25 |
| RSP-010 | epistemic | AI inferred unconfirmed no puede entrar como captured_user_evidence. | AI suggestion not confirmed | store as ai_inferred_unconfirmed only | Sí | blocker | D4:1; D6!Epistemic_Policy |
| RSP-011 | confirmation | Confirmación o corrección del usuario debe registrarse explícitamente. | preload/suggestion used | require confirmation_status and provenance | Sí | critical | D4:7; D4:11; D6!Epistemic_Policy |
| RSP-012 | literal | Preservar el valor literal antes de normalizar o derivar. | accepted response | persist literal response/subfield value | Sí | major | D4:9; D4:21 |
| RSP-013 | route | Texto libre lateral no cierra rutas críticas. | textual signal outside canonical interaction | create signal/gap, not closed route | Sí | blocker | D5:6; D6!Critical_Routes; EVE05 |
| RSP-014 | C09 | receiver_satisfaction nunca materializa receiver_feedback. | B3 satisfaction answer contains subjective acceptance only | keep feedback unset | Sí | blocker | D5:6.1; D5:6.2; D6:C09 |
| RSP-015 | C09 | Si existe señal operativa textual sin cierre C09, activar route_missing. | feedback-like signal detected and C09 unresolved | emit receiver_feedback_route_missing gap | Sí | blocker | D5:6.2; D6:C09; EVE05 |
| RSP-016 | B7 | Respuestas B7/C20 solo alimentan readiness/preclassification signals. | interaction in B7/C20 | block structural projection | Sí | blocker | D5:6.3; D6:B7; EVE05 |
| RSP-017 | audit | Corrección, derivación, ruta crítica, reentry o manual review generan audit trail. | sensitive ingest event | append audit event | Sí | major | D4:9; D4:27; D6!Epistemic_Policy |
| RSP-018 | evidence | Un payload aceptado genera evidence_item por respuesta/subcampo relevante. | payload accepted | emit evidence seeds with provenance | No | major | D4:9; D4:21 |
| RSP-019 | variables | Materializar variables solo después de persistir literal y evidence items. | payload accepted | invoke canonical variable service after evidence | Sí | critical | D4:9 |
| RSP-020 | revision | Una revisión invalida derivados dependientes. | supersedes_response_id present | mark dependent variables/gaps/candidates/payloads stale | Sí | blocker | D4:24 |
| RSP-021 | recompute | La revisión declara recompute_required y recompute_scope. | derived dependencies affected | emit recompute plan | Sí | critical | D4:24; D4!Table20 |
| RSP-022 | boundary | response_ingest no diagnostica ni exporta. | diagnostic/export output requested | reject transition | Sí | blocker | D4:1; D4:13; D3 |
| RSP-023 | timestamps | Conservar client_timestamp y asignar server timestamp. | payload accepted | persist both timestamps | No | major | D4:8.2; D4:21 |
| RSP-024 | validation | Campos requeridos por Required_Field_Model no pueden quedar vacíos. | required answer/subfield missing | reject or block with explicit gap | Sí | blocker | D6!Required_Field_Model; D4:12 |
| RSP-025 | deduplication | Reintento con misma idempotency_key devuelve resultado previo sin duplicar registros. | duplicate key | return prior receipt and no writes | Sí | critical | D4:24 |

### Salidas permitidas

- `response_ingest_receipt`
- `runtime_subfield_response[]`
- `evidence_seed[]`
- `canonical_variable_materialization_request`
- `recompute_plan`
- `audit_event`

### Salidas prohibidas

- `diagnosis`
- `structural_candidate_without_gates`
- `export_payload`
- `registry_write`

## 4. Evidence Item

Conservar evidencia literal, confirmada, corregida, derivada o calculada con provenance y cadena de revisión.

### Esquema

| Campo | Tipo | Requerido | Default | Descripción | Fuentes |
| --- | --- | --- | --- | --- | --- |
| evidence_item_id | string | Sí |  |  | D4:21 |
| run_id | string | Sí |  |  | D4:21 |
| interaction_instance_id | string\|null | No |  |  | D4:21 |
| subfield_response_id | string\|null | No |  |  | D4:21 |
| literal_value | string\|JSON\|null | No |  |  | D4:21; D4:23.2 |
| epistemic_status | epistemic_status | Sí |  |  | D4:1; D4:21; D4:25 |
| provenance_type | provenance_type | Sí |  |  | D4:21; D6!Epistemic_Policy |
| confidence | number\|null | No |  |  | D4:21; D4:23.2 |
| response_revision_number | integer | Sí | 1 |  | D4:21; D4:24 |
| supersedes_evidence_item_id | string\|null | No |  |  | D4:21; D4:24 |
| created_at | ISO-8601 timestamp | Sí |  |  | D4:21 |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVI-001 | creation | Crear evidence_item solo desde respuesta aceptada, confirmación/corrección o derivación gobernada. | unaccepted input | reject evidence creation | Sí | blocker | D4:2; D4:9; D4:21 |
| EVI-002 | epistemic | Todo evidence_item exige epistemic_status y provenance_type. | metadata missing | reject record | Sí | blocker | D4:21; D4:25 |
| EVI-003 | immutability | literal_value es inmutable para una revisión dada. | edit existing literal requested | create superseding evidence item | Sí | critical | D4:21; D4:24 |
| EVI-004 | revision | response_revision_number y supersedes_evidence_item_id conservan la cadena de revisiones. | revision > 1 | link previous evidence | Sí | critical | D4:21; D4:24 |
| EVI-005 | confidence | confidence no transforma por sí sola una inferencia en evidencia capturada. | confidence high but unconfirmed | retain ai_inferred_unconfirmed | Sí | major | D4:1; D6!Epistemic_Policy |
| EVI-006 | genealogy | El registro conserva run, instance y subfield refs cuando existan. | evidence created | persist source references | Sí | major | D4:21; D8; EVE03 |
| EVI-007 | epistemic | Una sugerencia IA no confirmada nunca usa captured_user_evidence. | source is AI and user did not confirm | use ai_inferred_unconfirmed | Sí | blocker | D4:1; D6!Epistemic_Policy |
| EVI-008 | correction | La corrección del usuario se guarda separada de la sugerencia original. | user corrects preload | create user_corrected_evidence superseding prior item | Sí | critical | D4:1; D4:24 |
| EVI-009 | derivation | canonical_derivation debe señalar evidence items de origen. | derived evidence created | require derived_from refs | Sí | critical | D4:9; D4:23.2 |
| EVI-010 | internal | internal_calculated no se presenta como respuesta del usuario. | internal calculation | mark internal_calculated and hide from captured evidence | Sí | major | D4:1; D4:25 |
| EVI-011 | B7 | Evidencia B7/C20 es señal preclasificatoria, no diagnóstico. | source interaction B7/C20 | tag non_diagnostic_preclassification | Sí | blocker | D5:6.3; D6:B7 |
| EVI-012 | C09 | Evidencia de satisfaction y feedback se conserva en items separados. | B3/C09 evidence created | do not merge values | Sí | blocker | D5:6.1; D5:6.2 |
| EVI-013 | route | Un evidence_item no cierra una ruta sin canonical_variable_record. | critical route signal present | forward to variable materialization/gap | Sí | blocker | D4:9; D6!Critical_Routes |
| EVI-014 | append_only | No borrar evidencia superseded. | delete requested | reject delete and audit | Sí | blocker | D4:24; D4:27 |
| EVI-015 | scope | La evidencia hereda case/role/activity scope del run. | query/write attempted | enforce run scope | Sí | blocker | D4:27 |
| EVI-016 | audit | Evidencia vinculada a B0/B2/B3/B7 exige audit trail en correcciones. | critical route evidence revised | append audit event | Sí | critical | D4:27 |
| EVI-017 | invalidation | Superseding evidence invalida derivados dependientes. | new evidence supersedes old | emit invalidation set | Sí | critical | D4:24 |
| EVI-018 | downstream | Texto crudo no se envía directo a IR/registry/export final. | downstream consumer requests raw evidence | reject direct projection | Sí | blocker | D4:13; D6!Parallel_Production_Contract; D3 |
| EVI-019 | timestamps | created_at debe ser server-side y auditable. | evidence accepted | assign server timestamp | No | major | D4:21 |
| EVI-020 | boundary | La evidencia conserva señales VSM/AHE como evidencia, sin diagnóstico cerrado. | human/governance signal captured | tag as evidence/prep only | Sí | major | D3; D4:1 |

### Salidas permitidas

- `evidence_item`
- `evidence_supersession_link`
- `dependent_invalidation_signal`
- `canonical_variable_materialization_input`
- `audit_event`

### Salidas prohibidas

- `critical_route_closed_directly`
- `diagnosis`
- `IR`
- `registry_write`
- `final_export`

## 5. Canonical Variable Record

Materializar variables declaradas por EVE04/D6 desde evidencia gobernada, mantener route_status/gaps y alimentar gates.

### Esquema

| Campo | Tipo | Requerido | Default | Descripción | Fuentes |
| --- | --- | --- | --- | --- | --- |
| canonical_variable_id | string | Sí |  |  | D4:3; D4:14 |
| run_id | string | Sí |  |  | D4:3; D4:14 |
| variable_name | string | Sí |  |  | D4:3; D6!Canonical_Variables |
| variable_value | JSON | Sí |  |  | D4:14 |
| route_id | string\|null | No |  |  | D4:3; D6!Critical_Routes |
| route_status | route_status | Sí |  |  | D4:3; D4:25 |
| derived_from | array<string>\|string\|null | No |  |  | D4:3; D4:9 |
| gap_flag | boolean | Sí | False |  | D4:14 |
| validity_state | active\|stale\|superseded | Sí | active | Semántica requerida por recomputación; puede mapearse a metadata equivalente. | D4:24 |
| created_at | ISO-8601 timestamp | Sí |  |  | D4:14 |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CVR-001 | catalog | variable_name debe existir en EVE04/D6. | variable absent from mapping | reject materialization | Sí | blocker | D6!Canonical_Variables; EVE04 |
| CVR-002 | classification | Respetar required, optional y derived variables de la interacción. | materializing variable | validate classification | Sí | critical | D6!Canonical_Variables; D6!Required_Field_Model |
| CVR-003 | genealogy | Toda variable debe derivar de evidence_item/subfield_response o derivación trazable. | no source refs | reject materialization | Sí | blocker | D4:9; D4:14; D8 |
| CVR-004 | derivation | Variables derivadas solo se calculan cuando confirmation/provenance policy lo permite. | derived variable requested | validate policy and sources | Sí | blocker | D6!Epistemic_Policy; D6!Canonical_Variables |
| CVR-005 | epistemic | No convertir AI unconfirmed en variable de evidencia capturada. | source evidence ai_inferred_unconfirmed | keep unresolved/derived candidate only | Sí | blocker | D4:1; D6!Epistemic_Policy |
| CVR-006 | route | route_status debe usar enum mínimo. | status outside enum | reject record | Sí | critical | D4:25 |
| CVR-007 | route | Variables de ruta crítica deben declarar route_id. | mapped variable belongs to B0/B2/B3/B7 | require route_id | Sí | blocker | D6!Critical_Routes; EVE05 |
| CVR-008 | gap | gap_flag debe ser true cuando falta evidencia, contradicción o ruta canónica. | unresolved blocking condition | set gap_flag and route status | Sí | critical | D4:10; D6!Readiness_Gaps_Reentry |
| CVR-009 | B0 | Variables B0 de preload requieren confirmación/corrección antes de cerrar hard evidence. | B0 preload not confirmed | route remains open/reentry | Sí | blocker | D4:10; EVE05:CR-B0 |
| CVR-010 | B2 | transformation_exception_exists cierra solo por ruta 2.9/2.10. | lateral failure text without route | blocked_by_missing_canonical_route | Sí | blocker | D5:6; D6!Critical_Routes; EVE05:CR-B2 |
| CVR-011 | B3 | receiver_satisfaction y receiver_feedback son variables independientes. | materializing B3 values | keep distinct records | Sí | blocker | D5:6.1; D5:6.2 |
| CVR-012 | C09 | receiver_feedback_route_missing se activa ante señal textual sin cierre canónico. | feedback signal and C09 unresolved | materialize route_missing=true with gap | Sí | blocker | D5:6.2; D6:C09; EVE05:CR-B3 |
| CVR-013 | B7 | Variables B7/C20 no habilitan candidatos MoC/IR/registry/export directos. | source interaction B7/C20 | limit to readiness/preclassification | Sí | blocker | D5:6.3; D6:B7; EVE05 |
| CVR-014 | revision | Una revisión de evidencia marca variables dependientes stale. | source evidence superseded | set validity_state stale and recompute | Sí | critical | D4:24 |
| CVR-015 | history | No sobrescribir variable previa; supersede y conservar cadena. | new revision changes value | create new record/version and mark prior superseded | Sí | critical | D4:24; D4:27 |
| CVR-016 | scope | No mezclar variables entre runs/casos. | cross-run source refs | reject materialization | Sí | blocker | D4:27 |
| CVR-017 | determinism | La misma evidencia, mapping y versión de catálogo deben producir el mismo resultado. | same inputs repeated | return equivalent materialization | No | major | D4:6; D4:9 |
| CVR-018 | gates | Las variables alimentan EVE05 antes de structural candidates. | variable set ready for modeling | invoke gate engine | Sí | critical | D4:9; EVE05 |
| CVR-019 | candidate_boundary | Variable sin evidencia suficiente no crea structural candidate. | gap_flag true or unresolved route | block candidate signal | Sí | blocker | D4:10; EVE05 |
| CVR-020 | storage | stored_or_consumed_by se respeta según D6 mapping. | variable materialized | route record to declared internal consumers only | No | major | D6!Canonical_Variables |
| CVR-021 | critical_route | Una ruta solo cierra si todas las variables requeridas cumplen provenance y no hay contradicción. | critical route evaluation | set closed only on complete requirements | Sí | blocker | D6!Critical_Routes; EVE05 |
| CVR-022 | boundary | La variable no se traduce a diagnóstico dentro de Fase 6. | diagnostic request | reject transition | Sí | blocker | D4:1; D3; EVE05 |
| CVR-023 | audit | Cierre por derivación, corrección o ruta crítica se audita. | sensitive materialization | append audit event | Sí | critical | D4:9; D4:27 |
| CVR-024 | export_boundary | Variables se preparan para EvidenceBundle/Readiness, no export final. | export requested inside module | emit governed handoff only | Sí | blocker | D4:13; D4:23.2; D3 |

### Salidas permitidas

- `canonical_variable_record`
- `critical_route_update_request`
- `gate_engine_input`
- `readiness_gap_signal`
- `dependent_invalidation_signal`
- `audit_event`

### Salidas prohibidas

- `unmapped_variable`
- `diagnosis`
- `direct_IR`
- `direct_registry`
- `final_export`

## 6. Structural Candidate Record

Crear candidatos PM/MoC/PF/OLC trazables después de variables y gates, sin convertirlos aún en modelos, inventario, IR o diagnóstico.

**Política de fuentes:** D8 es fuente directa obligatoria para genealogía, tipo, cuadrantes y checkpoints. D1 es únicamente guardia metodológica contextual y nunca autoridad de ejecución.

### Esquema

| Campo | Tipo | Requerido | Default | Descripción | Fuentes directas |
| --- | --- | --- | --- | --- | --- |
| structural_candidate_id | string | Sí |  |  | D4:21; D4:23.3 |
| run_id | string | Sí |  |  | D4:21 |
| quadrant_hint | quadrant | Sí |  |  | D4:21; D4:25; D8!MMABP_Mapping!columns:D:E!rows:2-165 |
| candidate_type | string | Sí |  |  | D4:21; D6!MMABP_Output_Map; D8!MMABP_Mapping!columns:J:K!rows:2-165 |
| candidate_label | string | Sí |  |  | D4:21; D4:23.3 |
| source_variable | string | Sí |  |  | D4:21; D4:23.3; D8!Canonical_Variables!column:D!rows:2-165; D8!Variables_Canonicas_Source!column:B!rows:2-247 |
| source_evidence_item_id | string | Sí |  |  | D4:21; D4:23.3; D8!Catalogo_Madre_Nodos!columns:B:C!rows:2-165; D8!Source_Question_Registry!rows:2-165 |
| conformance_checkpoint | string | Sí |  |  | D4:21; D6!MMABP_Output_Map; EVE05; D8!MMABP_Mapping!column:L!rows:2-165 |
| consistency_checkpoint | string | Sí |  |  | D4:21; D6!MMABP_Output_Map; EVE05; D8!MMABP_Mapping!column:M!rows:2-165 |
| candidate_state | candidate_state | Sí | candidate |  | D4:21; D4:23.3; D4:24 |
| gate_summary_ref | string | Sí |  | Referencia al resultado EVE05 que habilita o bloquea el candidato. | EVE05:execution_pipeline; D4:9 |
| created_at | ISO-8601 timestamp | Sí |  |  | D4:21 |

### Reglas atómicas

| ID | Categoría | Regla | Condición | Acción | Bloquea | Severidad | Fuentes directas | Guardia contextual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-001 | creation | Crear candidato solo desde variables canónicas y evidence_item gobernados. | source variable/evidence missing | reject candidate | Sí | blocker | D4:21; D4:23.3; D8!Canonical_Variables!column:D!rows:2-165; D8!MMABP_Mapping!columns:J:N!rows:2-165 |  |
| SCR-002 | semantics | candidate no equivale a hecho ni modelo MMABP válido. | candidate created | label and persist as candidate only | Sí | critical | D4:13; D4:23.3; D8!MMABP_Mapping!columns:J:N!rows:2-165 | D1:4.1 |
| SCR-003 | quadrant | quadrant_hint debe ser PM, MoC, PF, OLC o CrossQuadrant permitido. | invalid quadrant | reject candidate | Sí | critical | D4:25; D6!MMABP_Output_Map; D8!MMABP_Mapping!columns:D:E!rows:2-165 |  |
| SCR-004 | type | candidate_type debe corresponder al mapping EVE04/D6. | type not mapped | reject candidate | Sí | blocker | D6!MMABP_Output_Map; EVE04; D8!MMABP_Mapping!columns:J:K!rows:2-165 |  |
| SCR-005 | genealogy | source_variable y source_evidence_item_id son obligatorios. | missing source reference | reject candidate | Sí | blocker | D4:21; D4:23.3; D8!Catalogo_Madre_Nodos!columns:B:C!rows:2-165; D8!Canonical_Variables!column:D!rows:2-165 |  |
| SCR-006 | conformance | Todo candidato exige conformance_checkpoint. | checkpoint missing | reject candidate | Sí | blocker | D4:21; D6!MMABP_Output_Map; EVE05; D8!MMABP_Mapping!column:L!rows:2-165 |  |
| SCR-007 | consistency | Todo candidato conserva consistency_checkpoint, pero no se evalúa antes de conformance. | conformance not passed | mark consistency not evaluated | Sí | critical | D4:21; D6!MMABP_Output_Map; EVE05; D8!MMABP_Mapping!columns:L:M!rows:2-165 | D1:4.1; D1:4.2 |
| SCR-008 | gates | gate_summary_ref de EVE05 es obligatorio. | gate result absent | reject candidate | Sí | blocker | EVE05; D4:9 |  |
| SCR-009 | SEM | Ambigüedad semántica bloquea candidatos MoC/OLC. | SEM unresolved/ambiguous | block candidate and reentry/manual review | Sí | blocker | EVE05:semantic_resolution_gate; D4:10 |  |
| SCR-010 | PST | Espera sin evento/timer/salida bloquea candidatos PF/OLC relacionados. | PST failed | block candidate and reentry | Sí | blocker | EVE05:process_state_timer_gate; D4:10 |  |
| SCR-011 | critical_route | Ruta crítica fallida bloquea candidatos afectados. | critical route gate fails | set candidate blocked or do not create | Sí | blocker | EVE05:critical_route_gate; D4:10 |  |
| SCR-012 | B7 | B7-Q39/B7-Q40/C20 nunca crean structural candidate directo. | source interaction B7/C20 | reject candidate | Sí | blocker | D5:6.3; D6:B7; EVE05 |  |
| SCR-013 | downstream | El candidato no escribe IR, registry ni export final. | downstream write requested | reject transition | Sí | blocker | D4:13; D3 |  |
| SCR-014 | diagram_boundary | El candidato no genera diagrama PM/MoC/PF/OLC. | diagram generation requested | reject and wait for downstream gates | Sí | blocker | D4:13; D6!Parallel_Production_Contract |  |
| SCR-015 | state | candidate_state debe ser candidate, blocked, stale o superseded en esta fase. | state outside allowed phase-6 set | reject state | Sí | critical | D4:21; D4:24 |  |
| SCR-016 | revision | Revisión de evidencia/variable marca candidatos dependientes stale. | source superseded | set stale and schedule recompute | Sí | critical | D4:24 |  |
| SCR-017 | history | Candidato recalculado supersede al previo; no lo borra. | candidate recomputed | create new record and link through audit/equivalent | Sí | critical | D4:24; D4:27 |  |
| SCR-018 | PM | PM candidate puede contener cliente, necesidad, proceso, trigger, target state y soporte solo si mapping/gates lo sostienen. | quadrant PM | apply PM mapping and gate restrictions | Sí | major | D6!Parallel_Production_Contract; EVE05; D8!MMABP_Mapping!rows:19-42 | D1:2.2.6 |
| SCR-019 | MoC | MoC candidate requiere clase/relación/rol/fase/end semánticamente resueltos. | quadrant MoC | require SEM pass | Sí | blocker | D6!Parallel_Production_Contract; EVE05; D8!MMABP_Mapping!rows:43-68 | D1:3.1.5 |
| SCR-020 | PF | PF candidate requiere tarea/evento/handoff/Process State/timer y produced state válidos. | quadrant PF | require PST/conformance pass | Sí | blocker | D6!Parallel_Production_Contract; EVE05; D8!MMABP_Mapping!column:H!rows:2-165 | D1:2.3.6 |
| SCR-021 | OLC | OLC candidate requiere objeto/estado/transición/evento causal no ambiguos. | quadrant OLC | require SEM/PST/conformance pass | Sí | blocker | D6!Parallel_Production_Contract; EVE05; D8!MMABP_Mapping!column:I!rows:2-165 | D1:3.2.4 |
| SCR-022 | cross_quadrant | CrossQuadrant candidate solo se emite después de conformance individual. | one or more model conformance incomplete | do not evaluate composite consistency | Sí | blocker | EVE05; D8!MMABP_Mapping!columns:D:E,L:M!rows:2-165 | D1:4.1; D1:4.2 |
| SCR-023 | audit | Creación, bloqueo, stale o supersede se audita. | candidate lifecycle change | append audit event | No | major | D4:21; D4:27 |  |
| SCR-024 | VSM_AHE_boundary | Señales VSM/AHE se conservan como prep/evidence, nunca como diagnóstico cerrado. | candidate suggests VSM/AHE interpretation | tag prep-only or reject closed diagnosis | Sí | blocker | D3; D4:1 |  |

### Salidas permitidas

- `structural_candidate_record`
- `candidate_blocker`
- `readiness_candidate_signal`
- `audit_event`

### Salidas prohibidas

- `diagram`
- `diagnosis`
- `IR`
- `registry_write`
- `final_export`
- `B7_direct_projection`

## Diccionarios ejecutables


### `run_execution_state`

`initialized`, `semantic_preload_loaded`, `b0_confirmation_pending`, `active_base_capture`, `base_complete`, `causal_evaluation_pending`, `active_causal_capture`, `readiness_evaluation`, `ready`, `ready_with_flags`, `blocked`, `blocked_by_missing_activity`, `reentry_required`, `manual_review_required`, `exported_to_parallel_production`, `archived`

### `run_lifecycle_state`

`draft`, `active`, `in_progress`, `waiting_user`, `waiting_reentry`, `ready`, `ready_with_flags`, `blocked`, `manual_review_required`, `completed`, `archived`

### `interaction_state`

`pending`, `opened`, `shown`, `answered`, `inferred_unconfirmed`, `confirmed`, `corrected`, `skipped_by_rule`, `closed_by_other`, `closed_by_branching`, `closed_by_recompute`, `blocked`, `reopened`, `archived`

### `epistemic_status`

`captured_user_evidence`, `ai_inferred_unconfirmed`, `user_confirmed_suggestion`, `user_corrected_evidence`, `canonical_derivation`, `internal_calculated`

### `provenance_type`

`user_answer`, `source_user`, `confirmed_preload`, `user_correction`, `canonical_derivation`, `derived_internal`, `internal_calculation`, `reentry`

### `route_status`

`not_applicable`, `open`, `closed`, `closed_with_flags`, `blocked_by_missing_canonical_route`, `route_missing`, `superseded`

### `readiness_state`

`ready`, `ready_with_flags`, `blocked_by_missing_evidence`, `blocked_by_contradiction`, `blocked_by_missing_canonical_route`, `manual_review_required`, `reentry_required`

### `response_type`

`user_answer`, `confirmation`, `correction`, `derived_internal`

### `confirmation_status`

`not_required`, `pending`, `confirmed`, `corrected`

### `quadrant`

`PM`, `MoC`, `PF`, `OLC`, `CrossQuadrant`, `GovernanceReadiness`, `VSM_AHE_Prep`, `None`

### `candidate_state`

`candidate`, `blocked`, `stale`, `superseded`

### `recompute_scope`

`interaction_only`, `block`, `run`, `role_session`, `export_payload`

### `interaction_group`

`base`, `causal`, `internal`, `clarification`, `microconfirmation`

### `budget_bucket`

`base_40`, `causal_20`, `internal_no_count`, `reentry_counted`, `microconfirmation_counted`

### `manual_review_reason`

`semantic_ambiguity`, `route_missing`, `contradiction`, `B7_boundary_risk`, `evidence_insufficient`, `override_request`

## Mapeo fuente → destino

| ID | Fuente | Destino | Tipo de transducción | Locators exactos |
| --- | --- | --- | --- | --- |
| STM6-001 | D4:3 model data logical | all six entity/service schemas | structured_exact |  |
| STM6-002 | D4:4 state machines | activity_runtime_run.state_machine; interaction_instance.state_machine | structured_exact_with_alias_map |  |
| STM6-003 | D4:5 budget 40+20 | activity_runtime_run and interaction_instance budget rules | structured_exact |  |
| STM6-004 | D4:8.2 ResponseIngestPayload | response_ingest.input_contract | structured_exact_plus_v1.0.1_revision_fields |  |
| STM6-005 | D4:9 process_response | execution_pipeline steps 4-9 | structured_exact |  |
| STM6-006 | D4:12 critical subfields + D6 UX_Subfield_Structure | interaction_instance/response_ingest subfield rules | structured_exact |  |
| STM6-007 | D4:14/21 DDL | entity_schema for run, instance, evidence, variable, candidate | structured_exact_with_equivalent_metadata_allowed |  |
| STM6-008 | D4:24 idempotency and recomputation | response_ingest, evidence_item, canonical_variable_record, structural_candidate_record revision rules | structured_exact |  |
| STM6-009 | D4:25 enums | enums | structured_exact_with_granular_state_union |  |
| STM6-010 | D4:27 security/scope/audit | scope and audit invariants across modules | structured_exact |  |
| STM6-011 | D6 Runtime_Interactions_Base_40/Causal_20 | interaction_instance definition dependency | reference_only_runtime_loaded |  |
| STM6-012 | D6 Epistemic_Policy | response_ingest and evidence_item epistemic rules | structured_exact |  |
| STM6-013 | D6 Canonical_Variables | canonical_variable_record allowlist/mapping | runtime_reference |  |
| STM6-014 | D6 MMABP_Output_Map | structural_candidate_record type/checkpoints | runtime_reference |  |
| STM6-015 | D6 Critical_Routes + EVE05 | variable route updates and candidate blockers | runtime_reference |  |
| STM6-016 | D8 Catalogo_Madre_Nodos/Source_Question_Registry/Canonical_Variables/MMABP_Mapping | evidence_item, canonical_variable_record and structural_candidate_record genealogy/type/checkpoints | reference_only_canonical_with_structural_candidate_genealogy | D8!Catalogo_Madre_Nodos!rows:2-165; D8!Source_Question_Registry!rows:2-165; D8!Canonical_Variables!rows:2-165; D8!MMABP_Mapping!rows:2-165 |
| STM6-017 | EVE04 v0.2 | frozen catalog dependency | machine_dependency |  |
| STM6-018 | EVE05 v0.1 | gate_summary_ref and candidate enabling | machine_dependency |  |
| STM6-019 | D5 B7/C09 boundaries | response/variable/candidate blockers | structured_exact |  |
| STM6-020 | D3 integration boundary | forbidden outputs and shadow-first installation | boundary_only |  |

## Controles QA

| ID | Control | Método | Aprobación | Fuentes / clase de prueba |
| --- | --- | --- | --- | --- |
| EXE-QA-001 | required_dependencies | Verify dependency IDs, versions and checksums. | EVE03, EVE04 v0.2, EVE05 v0.1, D6 and D8 present. | PACKAGE:dependencies; PACKAGE:source_documents · `editorial_context_only` |
| EXE-QA-002 | module_inventory | Count requested modules. | Exactly 6 modules. | PACKAGE:modules_requested; PACKAGE:counts.modules · `editorial_context_only` |
| EXE-QA-003 | run_state_machine | Validate all transitions against declared map. | 0 illegal transitions. | D4:4.1; D4:25 · `structured_source_proof` |
| EXE-QA-004 | interaction_state_machine | Validate interaction transitions. | 0 illegal transitions. | D4:4.2; D4:25 · `structured_source_proof` |
| EXE-QA-005 | budget_40_20 | Simulate base/causal counters. | Base <= 40; causal <= 20. | D4:5; D4!Table6; D6!Branching_Budget_Rules · `structured_source_proof` |
| EXE-QA-006 | compound_subfields | Cross-check D6 UX_Subfield_Structure. | Every compound interaction persists separable subfields. | D4:12; D6!UX_Subfield_Structure · `structured_source_proof` |
| EXE-QA-007 | idempotency | Replay same idempotency_key. | No duplicate writes. | D4:24; D4!Table20 · `structured_source_proof` |
| EXE-QA-008 | revision_chain | Submit correction revision. | Prior response/evidence preserved and superseded. | D4:24; D4!Table21 · `structured_source_proof` |
| EXE-QA-009 | epistemic_policy | Submit AI unconfirmed suggestion. | Never stored as captured_user_evidence. | D6!Epistemic_Policy · `structured_source_proof` |
| EXE-QA-010 | variable_allowlist | Materialize unknown variable. | Rejected. | D6!Canonical_Variables; EVE04:modules.canonical_variables · `structured_source_proof` |
| EXE-QA-011 | C09_separation | Submit satisfaction without operational feedback. | receiver_feedback remains unset. | D5:6.1; D5:6.2; D6:C09 · `structured_source_proof` |
| EXE-QA-012 | C09_route_missing | Submit feedback-like text without canonical C09 closure. | receiver_feedback_route_missing gap emitted. | D5:6.2; D6:C09 · `structured_source_proof` |
| EXE-QA-013 | B7_boundary | Attempt candidate from B7/C20. | Rejected; preclassification only. | D5:6.3; D6!Critical_Routes; EVE05 · `structured_source_proof` |
| EXE-QA-014 | candidate_gate_dependency | Attempt candidate without EVE05 gate summary. | Rejected. | EVE05:execution_pipeline; D4:9 · `structured_source_proof` |
| EXE-QA-015 | conformance_before_consistency | Evaluate consistency while conformance incomplete. | Consistency not evaluated. | EVE05:mmabp_conformance_gate; EVE05:mmabp_consistency_gate; D1:4.1; D1:4.2 · `structured_source_proof` |
| EXE-QA-016 | scope_isolation | Cross-case response/evidence access. | Rejected. | D4:27; D4!Table24 · `structured_source_proof` |
| EXE-QA-017 | revision_recompute | Revise source response. | Dependent variables/candidates marked stale and recompute requested. | D4:24; D4!Table21 · `structured_source_proof` |
| EXE-QA-018 | no_diagnosis_or_export | Search module outputs. | No diagnosis, IR, registry write or final export. | D4:13; D3:12 · `structured_source_proof` |
| EXE-QA-019 | source_traceability | Inspect each rule/field source_refs. | No rule without source reference. | PACKAGE:source_proof_registry · `editorial_context_only` |
| EXE-QA-020 | typescript_compile | Run tsc --noEmit on generated module. | Exit code 0. | PACKAGE:typescript_compile · `editorial_context_only` |
| EXE-QA-021 | manifest_checksums | Hash package artifacts. | All listed artifacts have sha256. | PACKAGE:manifest.artifacts · `editorial_context_only` |
| EXE-QA-022 | source_immutability | Compare source checksums before/after generation. | No source mutated. | PACKAGE:source_documents.sha256 · `editorial_context_only` |

## Conteos

| Elemento | Conteo |
| --- | --- |
| modules | 6 |
| activity_runtime_run_rules | 22 |
| interaction_instance_rules | 20 |
| response_ingest_rules | 25 |
| evidence_item_rules | 20 |
| canonical_variable_record_rules | 24 |
| structural_candidate_record_rules | 24 |
| atomic_rules | 135 |
| failure_guards | 18 |
| integration_rules | 14 |
| source_documents | 10 |
| source_to_target_mappings | 20 |
| qa_controls | 22 |
| run_execution_states | 16 |
| interaction_states | 14 |
| source_proof_units | 274 |
| source_proof_pending | 0 |
| source_role_repairs | 8 |
| qa_rerun_required | 1 |

## Reparación de mesa de trabajo y política de prueba

**Estado de reparación:** `READY_FOR_INDEPENDENT_QA_RERUN`  
**QA independiente requerida:** Sí. Esta mesa no certifica el chip.

Cambios de contenido documental realizados:

- D8 se agrega como fuente directa obligatoria de genealogía, tipo, cuadrantes y checkpoints de `structural_candidate_record`.
- D1 se reclasifica como guardia metodológica contextual; no es fuente directa de reglas de ejecución.
- `STM6-016` cubre ahora `evidence_item`, `canonical_variable_record` y `structural_candidate_record`.
- Las 14 reglas de integración y los 22 controles QA incorporan referencias de fuente o clasificación editorial explícita.
- El checksum de EVE03 se sincroniza con el artefacto corregido y aprobado vigente.
- Se incorpora un registro máquina de prueba fuente para las unidades del paquete, sujeto a reauditoría independiente.

Regla de confianza: un locator o excerpt de esta reparación puede ser rechazado por la QA independiente. `source_proof_pending = 0` significa “candidato de prueba preparado”, no “certificación obtenida”.

## Contrato de instalación

| Campo | Valor |
| --- | --- |
| Ruta recomendada | docs/chips/execution-engine/EVE_06_Execution_Engine_v0_1/ |
| Modo | shadow_first |
| Runtime authority | false |
| Product wiring | false |
| DB migrations | false |
| Registry write | false |
| Diagnosis/export/Producción Paralela | false |

## Dictamen

EXECUTION_ENGINE_WORKBENCH_CONTENT_SOURCE_ROLE_REPAIRED_READY_FOR_INDEPENDENT_QA_RERUN; NOT_INSTALLED; no runtimeAuthority, registry, product wiring, diagnosis, export or Producción Paralela active.
