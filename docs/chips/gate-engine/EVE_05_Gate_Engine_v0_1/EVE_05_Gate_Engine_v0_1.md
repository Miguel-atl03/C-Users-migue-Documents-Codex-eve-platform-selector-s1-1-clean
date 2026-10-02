# EVE 05 Gate Engine v0.1

**Estado:** READY_FOR_SHADOW_INTEGRATION  
**Certificación:** ARTIFACT_VALIDATED_NOT_ACTIVATED  
**Instalación:** NOT_INSTALLED

## Propósito

Compilar un motor de gates que proteja rutas canónicas, resolución semántica, esperas/timers y validaciones MMABP de conformance y consistencia antes de readiness, diagnóstico o Producción Paralela.

## Módulos

- `critical_route_gate`
- `semantic_resolution_gate`
- `process_state_timer_gate`
- `mmabp_conformance_gate`
- `mmabp_consistency_gate`

## Cadena de autoridad

- D1 manda sobre método MMABP.
- D8 conserva genealogía canónica.
- D7 decide reducción 164→40+20.
- D5 gobierna gates, fronteras y QA.
- D6 ejecuta definiciones de rutas, SEM, PST y readiness.
- D4 implementa componentes, eventos, persistencia y recomputación.
- D3 integra downstream sin activar diagnóstico ni export prematuro.
- D2/EVE02 solo traducen inconsistencias en una etapa diagnóstica posterior.

## Fuentes rectoras utilizadas

| ID | Documento | Rol | Uso directo | Secciones/hojas |
|---|---|---|---:|---|
| D1 | Fundamentals of Business Architecture Modeling.pdf | fuente metodológica primaria | Sí | 2.2.6; 2.3.6; 3.1.5; 3.2.4; 4.1; 4.2; 4.3; 4.4; 4.5 |
| D5 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | fuente normativa operativa | Sí | 1; 2; 4; 5; 6.1; 6.2; 6.3; 8.1; 8.2; 9; 10; 11; 12 |
| D6 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | fuente ejecutable | Sí | Critical_Routes; Semantic_Resolution_Gates; Process_State_Timer_Gates; Readiness_Gaps_Reentry; Epistemic_Policy; Branching_Budget_Rules; QA_Checklist; Implementation_Dictionaries |
| D4 | EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx | contrato técnico de implementación | Sí | 1; 2; 3; 4; 7; 9; 10; 14; 15; 17; 20; 21; 24; 25; 26; 27; 28 |
| D8 | EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | fuente de genealogía canónica | Sí | Catalogo_Madre_Nodos; Canonical_Variables; Critical_Routes; Readiness_Reentry_Gaps |
| D7 | Arquitectura_Runtime_40_20_EVE_MMABP.docx | frontera arquitectónica | No | 0; 1; 4; 5; 8; 10 |
| D3 | EVE_Runtime_40_20_Capa_1_0_Produccion_Paralela_Conexion_Operativa_v2.docx | frontera de integración downstream | No | 0; 1; 8; 10 |
| D2 | Tabla de Diagnóstico de Inconsistencias Estructurales EVE.docx | referencia downstream de traducción diagnóstica | No | tabla única, 13 compartimentos |
| VSM1 | Organizational Systems Managing Complexity with the Viable System model.pdf | guardia contextual VSM | No | Partes I-II; identidad, desdoblamiento, discrecionalidad |
| AHE1 | Marco de Interpretación y Observación Explicativo Arquitectura Humana Empresarial_(AHE).docx | guardia contextual AHE | No | naturaleza del instrumento; tres niveles; frontera diagnóstica |

## Complementariedad documental

| Documento | Completa a | Relación | No sustituye |
|---|---|---|---|
| D1 | Todos | Define qué se permite llamar MMABP y qué significa conformance/consistency. | No define por sí solo runtime, UI ni persistencia. |
| D8 | Captura Capa 1 | Conserva genealogía y nodos de las rutas críticas. | No decide 40+20 ni ejecuta gates. |
| D7 | D8 | Decide reducción 164→40+20 y prioridad de rutas. | No opera como dataset. |
| D5 | D7 | Gobierna gates, fronteras, QA y correcciones B7/C09. | No sustituye D6. |
| D6 | D5 | Ejecuta rutas, SEM, PST, readiness y QA como filas. | No inventa nodos ni reglas. |
| D4 | D6 | Convierte gates en componentes, eventos, API, persistencia y recomputación. | No redefine el catálogo. |
| D3 | D4 | Conecta gate outputs al organismo y protege frontera downstream. | No altera método ni catálogo. |
| D2 | EVE02 | Traduce inconsistency candidates después de readiness. | No se activa dentro de Fase 5. |

## Reglas de integración

- **INT-001** — D1 manda sobre método MMABP; D5 gobierna; D6 ejecuta; D4 implementa; D3 integra.
- **INT-002** — DOCX/PDF metodológicos se compilan a reglas; no se ejecutan como narrativa.
- **INT-003** — XLSX se carga como fuente versionada y congelada; no se reinterpreta narrativamente.
- **INT-004** — D8 valida genealogía; no se usa como entrevista visible.
- **INT-005** — Conformance individual precede consistency.
- **INT-006** — SEM y PST preparan candidatos; no diagnostican.
- **INT-007** — Critical routes no cierran por IA ni texto libre sin ruta.
- **INT-008** — Gate Engine emite candidatos de readiness; ReadinessEngine decide estado final.
- **INT-009** — Inconsistency candidate no es patología; EVE02 se activa downstream y de forma explícita.
- **INT-010** — B7/C20 solo readiness/preclassification; cero proyección directa.
- **INT-011** — Una revisión invalida y recomputa dependientes con audit trail.
- **INT-012** — Ningún gate expone Object Inventory, Membrane o SG Shadow en UI cliente.

## Fallas bloqueadas

| ID | Falla | Consecuencia | Acción |
|---|---|---|---|
| FG-001 | Usar Catálogo Madre como entrevista visible completa | Sobrecarga cognitiva y ruptura de 40+20. | `reject_configuration` |
| FG-002 | Implementar desde narrativa DOCX en vez de XLSX | Runtime ambiguo y no testeable. | `reject_activation` |
| FG-003 | B7 genera MoC/IR/registry/export directo | Diagnóstico prematuro y contaminación downstream. | `manual_review_required` |
| FG-004 | Convertir satisfaction en receiver_feedback | Rework falso, PF falso y OLC contaminado. | `blocked_by_missing_canonical_route` |
| FG-005 | Guardar pregunta compuesta como un solo texto | Pérdida de trazabilidad, variables y QA. | `blocked_by_missing_evidence` |
| FG-006 | IA infiere ruta crítica | Fabricación de hechos estructurales. | `manual_review_required` |
| FG-007 | Exponer Object Inventory/Membrane/SG Shadow en UI | La UI muestra maquinaria interna al cliente. | `reject_projection` |
| FG-008 | Saltar de evidencia a diagnóstico | Violación de frontera Capa 1. | `reject_transition` |
| FG-009 | C20 rutinario o simultáneo con B7 resuelto | Carga innecesaria y preclasificación contaminada. | `reject_opening` |
| FG-010 | Feedback textual sin receiver_feedback_route_missing | Ruta crítica parece cerrada sin cierre canónico. | `blocked_by_missing_canonical_route` |
| FG-011 | Process State sin awaited event/timer/exit | Deadlock y PF incompleto. | `reentry_required` |
| FG-012 | Resolver ambigüedad semántica por default | Clases/estados/atributos falsos. | `manual_review_required` |
| FG-013 | Ejecutar consistencia antes de conformance | Modelos pueden alinearse entre sí y seguir siendo falsos. | `not_evaluated_due_to_conformance` |
| FG-014 | Alinear modelos cosméticamente | La contradicción real queda oculta. | `manual_review_required` |

## Pipeline de ejecución

| Orden | Paso | Descripción |
|---:|---|---|
| 1 | `validate_catalog_and_dependencies` | Verificar versión D6/EVE04, D8 y checksums; no activar si falta fuente. |
| 2 | `critical_route_gate` | Evaluar B0/B2/B3/B7 sobre variables y provenance. |
| 3 | `semantic_resolution_gate` | Ejecutar SEM gatillados antes de MoC/OLC. |
| 4 | `process_state_timer_gate` | Ejecutar PST gatillados antes de PF/OLC. |
| 5 | `mmabp_conformance_gate` | Evaluar cada vista contra realidad. |
| 6 | `mmabp_consistency_gate` | Evaluar solo vistas conformantes. |
| 7 | `emit_gate_summary` | Emitir blockers, gaps, reentry y readiness candidates. |
| 8 | `readiness_engine_external` | Delegar decisión final de readiness; diagnóstico y export permanecen bloqueados. |

## 1. Critical Route Gate

Validar las cuatro rutas canónicas blindadas antes de candidatos, readiness o consumo downstream.

### Contrato de entrada

- Requeridos: `run_id, route_id, route_active, observed_source_codes, canonical_variables, epistemic_statuses, evidence_refs`
- Opcionales: `textual_signals, conditional_context, retry_count, max_retries, projection_attempts`

### Rutas críticas

| Ruta | Bloque | Códigos fuente | Cierre | Estado de fallo |
|---|---:|---|---|---|
| `CR-B0-WorkMapIntake-semantic-entry` | 0 | 0.0; 0.1; 0.1a; 0.D; block0_entry_control | Actividad confirmada/corregida o reconstruida por el usuario; ningún gap semántico crítico oculto. | `reentry_required` |

**CR-B0-WorkMapIntake-semantic-entry — requisitos**

- Activación: Siempre al iniciar una actividad con o sin preload.
- Variables requeridas: `activity_name_user_confirmed, semantic_confirmation_status, block0_entry_mode`
- Si **preload parcial, fallido o no usable**, exigir alguna: activity_semantic_structure_corrected, activity_semantic_completion, reconstructed_activity_minimum; falla si: semantic_gap_unresolved.
- Reentry: `B0 / 0.1a / 0.D`
- Outputs bloqueados: `hard_evidence, SceneCanonicalRecord_ready, MDSB_candidate`

| `CR-B2-V3-transformation_exception` | 2 | 2.9; 2.10; 2.11; 2.12 | Booleano derivado desde 2.9 y descripción capturada cuando existe excepción; no desde texto libre lateral. | `blocked_by_missing_canonical_route` |

**CR-B2-V3-transformation_exception — requisitos**

- Activación: Siempre evaluar 2.9; abrir descripción si existe excepción.
- Variables requeridas: `transformation_exception_type, transformation_exception_exists`
- Si **transformation_exception_exists = true**, exigir todas: transformation_exception_description.
- Si **transformation_hidden_changes indica cambio oculto**, exigir todas: transformation_hidden_changes_description.
- Reentry: `B2 / 2.9-2.12`
- Outputs bloqueados: `PF_candidate, OLC_candidate, OperationalExceptionEvidence_closed`

| `CR-B3-R9-receiver_feedback` | 3 | 3.10; 3.13; 3.13a; 3.D | receiver_satisfaction permanece separada; receiver_feedback cierra solo por 3.13a/3.D. | `blocked_by_missing_canonical_route` |

**CR-B3-R9-receiver_feedback — requisitos**

- Activación: Evaluar si hay falla, ajuste, devolución, rechazo, corrección, recontacto o bloqueo del receptor.
- Variables requeridas: `delivery_exception_exists, receiver_satisfaction`
- Si **hay señal operativa de feedback o delivery_exception_exists = true**, exigir todas: receiver_feedback_exists; alguna: receiver_feedback, receiver_feedback_gap_flag.
- Si **existe evidencia textual de feedback pero no cierra 3.13a**, exigir todas: receiver_feedback_route_missing.
- Reentry: `B3 / 3.13a; B4/B6 si genera retorno, espera o retrabajo`
- Outputs bloqueados: `rework_candidate_from_satisfaction, PF_feedback_event, OLC_return_transition`

| `CR-B7-AHE-boundary_guard` | 7 | 7.0; 7.0a; 7.3; 7.3a; 7.4 | Solo señal preclasificatoria trazable; cero proyección directa MoC/IR/registry/export/diagnóstico. | `manual_review_required` |

**CR-B7-AHE-boundary_guard — requisitos**

- Activación: Siempre al consolidar preclasificación de B7.
- Variables requeridas: `confidence_level, preclassification_readiness`
- Si **confianza media/baja o señales cruzadas**, exigir alguna: user_confirmation, user_correction, user_clarification, manual_review_required.
- Reentry: `B7 / B7-Q39 / B7-Q40 / C20 o manual review`
- Outputs bloqueados: `direct_MoC_output, direct_IR, direct_registry, direct_export, closed_VSM_diagnosis, closed_AHE_diagnosis`

### Reglas atómicas del motor de rutas

| ID | Regla | Evidencia requerida | Fallo | Fuente |
|---|---|---|---|---|
| `CRT-ENG-001` | Toda ruta crítica debe resolver sus códigos a nodos D8 existentes antes de evaluarse. | route.source_codes, source_node_registry | `blocked_by_missing_evidence` | D8!Critical_Routes, D8!Catalogo_Madre_Nodos, D4:10 |
| `CRT-ENG-002` | Una señal textual no cierra una variable estructural crítica si no pasó por su ruta canónica. | route_status, provenance, canonical_variables | `blocked_by_missing_canonical_route` | D5:6.1, D5:6.2, D6!Epistemic_Policy, D4:10 |
| `CRT-ENG-003` | Una inferencia IA no puede cerrar una ruta crítica como captured_user_evidence sin confirmación o corrección. | epistemic_status, confirmation_status | `manual_review_required` | D6!Epistemic_Policy, D5:1, D4:1 |
| `CRT-ENG-004` | Una ruta crítica fallida bloquea sus candidatos estructurales y su export-preview downstream. | route_result, candidate_state, payload_state | `blocked_by_missing_canonical_route` | D5:10, D5:11, D4:10, D4:13 |
| `CRT-ENG-005` | Cierre, reapertura, override, reentry o fallo de ruta crítica genera registro de auditoría. | audit_event | `manual_review_required` | D5:5, D6!Epistemic_Policy, D4:24, D4:27 |
| `CRT-ENG-006` | La revisión de una respuesta invalida y recomputa variables, rutas, branching, readiness y payloads dependientes. | revision_event, dependency_recompute_log | `manual_review_required` | D4:24 |
| `CRT-ENG-007` | Agotar presupuesto causal no autoriza omitir B0/B2/B3/B7; se registra carry-forward o reentry. | budget_state, route_states | `reentry_required` | D5:9, D6!Branching_Budget_Rules:BR-009, D7 |
| `CRT-ENG-008` | B7-Q39/B7-Q40/C20 no producen MoC, IR, registry, export ni diagnóstico directo. | b7_outputs | `manual_review_required` | D5:6.3, D6!Critical_Routes:CR-B7-AHE-boundary_guard, D4:1, D4:10 |
| `CRT-ENG-009` | receiver_satisfaction no puede materializar receiver_feedback ni rework sin 3.13a/3.D. | receiver_satisfaction, receiver_feedback_route_status | `blocked_by_missing_canonical_route` | D5:6.1, D5:6.2, D6!Critical_Routes:CR-B3-R9-receiver_feedback, D4:10 |
| `CRT-ENG-010` | Una interacción compuesta guarda cada subrespuesta y variable por separado. | subfield_responses, canonical_variable_records | `blocked_by_missing_evidence` | D5:7, D6!UX_Subfield_Structure, D4:12 |

## 2. Semantic Resolution Gate

Resolver ambigüedad clase/estado/atributo/proceso/ISA/role/phase/end antes de MoC/OLC.

### Gates SEM

| ID | Riesgo | Trigger | Outputs permitidos | Bloqueo | Target |
|---|---|---|---|---|---|
| `SEM-001` | Convertir estado en clase | B2 o MoC detecta etiqueta que parece estado | `state, phase, class_candidate, ambiguous` | No proyectar a MoC como clase hasta resolver. | MoC/OLC |
| `SEM-002` | Convertir atributo en clase | Atributo descrito como entidad | `attribute, class_candidate, ambiguous` | Si es atributo, no crear clase separada. | MoC |
| `SEM-003` | Convertir proceso en objeto | Verbo/actividad aparece como objeto | `process_candidate, object_candidate, ambiguous` | No crear objeto si solo es acción/proceso. | MoC/PF |
| `SEM-004` | ISA falso por 'tipo de' | Usuario dice tipo de sin especialización real | `ISA, attribute_value, role, phase, ambiguous` | No usar Jerarquía ISA como sustituto de atributo tipo. | MoC |
| `SEM-005` | Alias o duplicado conceptual | Dos nombres parecen referir a la misma clase | `same_concept, different_concept, synonym, ambiguous` | Conservar alias sin duplicar clase hasta confirmar. | MoC |
| `SEM-006` | Confusión role/phase/end | Clase cambia por contexto, etapa o terminación | `role, phase, end, state, class` | No fijar como clase estática sin resolver dinámica. | MoC/OLC |
| `SEM-007` | Objeto fusionado/marsupial | Una respuesta mezcla ciclos de vida de objetos distintos | `split_objects_required, ambiguous` | No fusionar OLC de objetos distintos. | OLC/MoC |

### Reglas atómicas SEM

| ID | Regla | Fallo | Fuente |
|---|---|---|---|
| `SEM-ENG-001` | Todo candidato ambiguo para MoC/OLC pasa por SEM antes de registry, IR o export. | `manual_review_required` | D5:8.1, D4:10, D6!Branching_Budget_Rules:BR-001 |
| `SEM-ENG-002` | El outcome del gate pertenece al conjunto permitido por su definición. | `manual_review_required` | D6!Semantic_Resolution_Gates, D4:3 |
| `SEM-ENG-003` | Outcome ambiguous no crea clase, estado, atributo, ISA, role, phase o end definitivo. | `manual_review_required` | D5:8.1, D4:10 |
| `SEM-ENG-004` | La ausencia de resolución no se interpreta como class_candidate. | `manual_review_required` | D6!Semantic_Resolution_Gates, D1:3.1.5 |
| `SEM-ENG-005` | La resolución semántica conserva término original, contexto, evidencia y decisión. | `blocked_by_missing_evidence` | D4:3, D4:27 |
| `SEM-ENG-006` | La resolución interna no se reetiqueta como captured_user_evidence. | `manual_review_required` | D6!Epistemic_Policy, D5:1 |
| `SEM-ENG-007` | Tras max_retries sin resolución, el gate no simula certeza y deriva a manual review. | `manual_review_required` | D5:11, D4:10 |
| `SEM-ENG-008` | El gate clasifica naturaleza conceptual, no emite patología EVE, VSM ni AHE. | `manual_review_required` | D5:1, D4:1, D2:downstream only |

## 3. Process State / Timer Gate

Impedir PF con esperas, bloqueos o deadlocks sin evento, liberación, timer, estado de timeout y salida.

### Gates PST

| ID | Trigger | Captura requerida | Bloqueo | Target |
|---|---|---|---|---|
| `PST-001` | B4-Q24 indica espera fuerte | `awaited_event` | Bloquear Process State si no existe evento esperado. | PF |
| `PST-002` | Hay bloqueo/deadlock | `release_condition` | Bloquear salida si no hay condición de liberación. | PF/OLC |
| `PST-003` | La espera puede vencer o escalar | `timer_event_or_timeout_rule` | Ninguna espera fuerte llega a PF sin timer o criterio de vencimiento. | PF |
| `PST-004` | El tiempo vence o falla la condición | `timeout_state` | No crear transición OLC sin estado resultante. | OLC |
| `PST-005` | Alguien desbloquea | `resolver_owner` | Si no hay dueño/resolutor, marcar deadlock_risk. | PF/PM |
| `PST-006` | La espera libera o falla | `exit_path` | Sin salida válida, PF queda incompleto. | PF/OLC |

### Reglas atómicas PST

| ID | Regla | Fallo | Fuente |
|---|---|---|---|
| `PST-ENG-001` | Espera, bloqueo, fecha/hora obligante o deadlock activa PST antes de crear Process State. | `reentry_required` | D5:8.2, D6!Branching_Budget_Rules:BR-004, D4:10 |
| `PST-ENG-002` | Todo Process State identifica al menos un awaited_event externo o de soporte. | `blocked_by_missing_evidence` | D1:2.3.6, D6!Process_State_Timer_Gates:PST-001 |
| `PST-ENG-003` | Un bloqueo o espera debe tener release_condition verificable. | `reentry_required` | D6!Process_State_Timer_Gates:PST-002, D5:8.2 |
| `PST-ENG-004` | Ninguna espera fuerte llega a PF sin timer_event_or_timeout_rule. | `reentry_required` | D1:2.3.6, D6!Process_State_Timer_Gates:PST-003 |
| `PST-ENG-005` | Si vence el tiempo, OLC identifica timeout_state o failed_wait_state. | `blocked_by_missing_evidence` | D6!Process_State_Timer_Gates:PST-004, D1:3.2.4 |
| `PST-ENG-006` | Cuando una persona/unidad desbloquea, existe resolver_owner; si no, se marca deadlock_risk. | `reentry_required` | D6!Process_State_Timer_Gates:PST-005, D5:8.2 |
| `PST-ENG-007` | Toda espera tiene exit_path de liberación o fallo. | `reentry_required` | D6!Process_State_Timer_Gates:PST-006, D1:2.3.6 |
| `PST-ENG-008` | Evento, acción y estado de timeout deben coincidir entre PF y OLC. | `blocked_by_contradiction` | D1:4.3.5, D1:4.4 |
| `PST-ENG-009` | No se promueve Process State sin awaited_event, release/timer y exit_path completos. | `reentry_required` | D5:8.2, D4:10 |

## 4. MMABP Conformance Gate

Evaluar cada PM, MoC, PF y OLC contra realidad antes de cualquier consistencia.

### Reglas del motor

| ID | Regla | Modo | Fallo |
|---|---|---|---|
| `CONF-ENG-001` | El modelo conceptual debe representar la realidad del negocio antes de contaminarse con tecnologia, organigrama o detalles individuales de implementacion. | `human_validation_required` | `blocked_by_contradiction` |
| `CONF-ENG-002` | PM, MoC, PF y OLC se evalúan individualmente contra realidad; ninguna vista sirve como autoridad para aprobar otra. | `structured_semantic` | `blocked_by_missing_evidence` |
| `CONF-ENG-003` | No se ejecuta consistency gate para un modelo sin conformance_result suficiente. | `deterministic` | `not_evaluated_due_to_conformance` |
| `CONF-ENG-004` | Falta de evidencia produce gap, no aprobación tácita. | `deterministic` | `blocked_by_missing_evidence` |
| `CONF-ENG-005` | Ante inconsistencia, no se fuerza un modelo a parecer consistente; se identifica cual representacion contradice la realidad factual y se corrige. | `human_validation_required` | `manual_review_required` |
| `CONF-ENG-006` | Cada rule result declara modelo, regla, evidencia, status, missing fields y acción correctiva. | `deterministic` | `manual_review_required` |
| `CONF-ENG-007` | Un candidato no conformante no llega a registry, IR, export ni Producción Paralela. | `deterministic` | `blocked_by_contradiction` |
| `CONF-ENG-008` | Reglas que no pueden decidirse de forma determinista deben registrar assessment humano/asistido, no simular certeza. | `deterministic` | `manual_review_required` |

### Reglas de conformance por modelo

| ID | Modelo | Regla | Evidencia | Fuente |
|---|---|---|---|---|
| `PM-001` | PM | Cada proceso de negocio debe tener al menos un evento disparador y exactamente un estado objetivo. | process.triggering_events, process.target_state | D1:FBA:2.2.6 |
| `PM-002` | PM | El proceso se nombra por la actividad que conduce al estado objetivo. | process.name, process.target_state | D1:FBA:2.2.6 |
| `PM-003` | PM | Cada proceso pertenece como maximo a una funcion de negocio. | business_function_membership | D1:FBA:2.2.6 |
| `PM-004` | PM | Las funciones de negocio no deben solaparse ni duplicar contenido. | business_function_definitions | D1:FBA:2.2.6 |
| `PM-005` | PM | Cada proceso de negocio debe cubrir el ciclo completo desde la expresion de la necesidad del cliente hasta su satisfaccion. | customer_need, customer_satisfaction_state, e2e_scope | D1:FBA:2.2.6 |
| `PM-006` | PM | Los procesos tercerizados se incluyen en el Process Map, pero no se describen en detalle dentro del sistema modelado. | outsourced_processes | D1:FBA:2.2.6 |
| `PM-007` | PM | Los eventos se nombran como ocurrencia de un cambio significativo en el entorno del proceso: estado de objeto, estado de cosas o paso del tiempo. | event.name, event.kind | D1:FBA:2.2.6 |
| `PM-008` | PM | Los estados objetivo se nombran como estados de un objeto, no como tareas, areas o deseos abstractos. | target_state, object_state_ref | D1:FBA:2.2.6 |
| `PM-009` | PM | Si un proceso usa servicios de procesos de soporte, esos soportes deben identificarse; la identificacion continua hasta procesos soporte elementales. | support_process_links, support_function | D1:FBA:2.2.5, D1:FBA:2.2.6 |
| `PM-010` | PM | El Process Map captura sincronizaciones, dependencias e intencion global; no debe convertirse en diagrama de tareas ni flujo de datos. | diagram_elements, synchronization_patterns | D1:FBA:2.2 |
| `MOC-001` | MoC | Toda clase se nombra conforme a lo que representa: generalizacion de objetos especificos o superclase de clases con propiedades comunes. | class.name, class.definition | D1:FBA:3.1.5 |
| `MOC-002` | MoC | Aggregation o composition se usa exclusivamente cuando existe agregacion real: un objeto X esta compuesto por objetos Y. | relationship.kind, part_whole_evidence | D1:FBA:3.1.5 |
| `MOC-003` | MoC | La clasificacion de objetos en tipos se maneja por especializaciones o roles, no por un atributo 'tipo'. | classification_basis, attribute_list, specialization_list | D1:FBA:3.1.5 |
| `MOC-004` | MoC | La clase no contiene identificadores o llaves artificiales como atributos conceptuales. | attributes | D1:FBA:3.1.5 |
| `MOC-005` | MoC | Cada clase se caracteriza por atributos y operaciones relevantes a su contenido conceptual. | attributes, operations, class_definition | D1:FBA:3.1.5 |
| `MOC-006` | MoC | Si un objeto puede actuar en multiples roles simultaneos, se capturan roles en asociaciones; si los roles tienen atributos, se usa patron de especializaciones agregadas. | role_evidence, role_attributes, association_roles | D1:FBA:3.1.5 |
| `MOC-007` | MoC | Las operaciones de clase se especifican desde evidencia, especialmente OLC del objeto y atributos/asociaciones del propio MoC. | operation_source, olc_transition_ref, attribute_or_association_ref | D1:FBA:3.1.4 |
| `MOC-008` | MoC | Los estados del OLC se capturan en MoC como especializaciones con estereotipos phase para estados y end para pseudoestados finales. | olc_states, dynamic_generalization, stereotype | D1:FBA:3.1.4 |
| `MOC-009` | MoC | Una relacion 1:N requiere operaciones que permitan adicion y remocion iterativa de elementos del contenedor. | relationship_multiplicity, add_operation, remove_operation | D1:FBA:3.1.4 |
| `MOC-010` | MoC | El Model of Concepts representa clases reales y relaciones conceptuales; no debe reducirse a tabla, ID tecnico o esquema de persistencia. | conceptual_class_evidence, technical_schema_noise | D1:FBA:3.1 |
| `PF-001` | PF | El PF contiene solo actividades intencionales del negocio modelado; actos del cliente, procesos tercerizados o entorno se representan como eventos. | activity_origin, event_origin | D1:FBA:2.3.6 |
| `PF-002` | PF | Cada tarea se asigna a un solo estado de objeto que representa la meta de la tarea; si tiene metas alternativas, todas deben enumerarse. | task, resulting_object_state | D1:FBA:2.3.6 |
| `PF-003` | PF | La sincronizacion con eventos del entorno se captura como Process State donde el proceso espera eventos. | process_state, awaited_events | D1:FBA:2.3.6 |
| `PF-004` | PF | La conexion entre proceso soportado y soporte se captura en el detalle del proceso soportado como Process State que sincroniza mediante eventos. | support_process_ref, supported_process_state, sync_event | D1:FBA:2.3.6 |
| `PF-005` | PF | AND, OR y XOR se usan conforme a su significado logico, incluyendo combinaciones validas de split y merge. | gateway_type, gateway_condition | D1:FBA:2.3.6 |
| `PF-006` | PF | Cuando se esperan eventos ad hoc, se debe manejar la posibilidad de que no ocurran mediante evento de tiempo o deadline. | process_state, timeout_event, deadline | D1:FBA:2.3.6, D5:RUNTIME_CATALOG:Process_State_Timer_Gates |
| `PF-007` | PF | El nombre del evento describe de forma breve y objetiva un cambio ocurrido fuera del proceso modelado. | event.name, event.source | D1:FBA:2.3.6 |
| `PF-008` | PF | Las tareas se nombran como acciones que conducen al estado resultante del objeto asociado. | task.name, resulting_object_state | D1:FBA:2.3.6 |
| `PF-009` | PF | Para cada decision se listan las condiciones de todos los caminos posibles. | decision_node, path_conditions | D1:FBA:2.3.6 |
| `PF-010` | PF | Cada division y union de flujo se modela usando gates, no otro mecanismo. | split_merge_element, gateway_type | D1:FBA:2.3.6 |
| `PF-011` | PF | Cada proceso inicia con evento disparador o conjunto logico de eventos y todos los flujos terminan en process ends. | trigger_events, process_ends | D1:FBA:2.3.6 |
| `PF-012` | PF | Cada detalle de process step inicia con start point y todos sus flujos terminan con fin del process step. | process_step_detail, start_point, step_end | D1:FBA:2.3.6 |
| `PF-013` | PF | Las condiciones de la decision posterior al process step deben corresponder con el detalle del process step. | step_detail_outcomes, post_step_decision_conditions | D1:FBA:2.3.6 |
| `PF-014` | PF | El detalle del process step no captura sincronizacion con el entorno mediante Process State. | process_step_detail, awaiting_state | D1:FBA:2.3.6 |
| `PF-015` | PF | La normalizacion del PF puede revelar procesos de soporte ocultos; si ocurre, se corrigen tanto PM como PF. | normalization_result, hidden_support_process | D1:FBA:2.3.5, D1:FBA:2.3.6 |
| `PF-016` | PF | El Process Flow debe modelar la algoritmia del proceso y su contexto de tarea; roles, cargos o carriles organizacionales no deben sustituir eventos, tareas, Process States ni objetos de datos. | diagram_structure, task_context, organizational_context_separated | D1:FBA:2.3.3, D1:FBA:2.3.6 |
| `OLC-001` | OLC | El OLC cubre todas las variaciones de la vida completa de un objeto, desde creacion hasta terminacion. | object_class, initial_state, final_states, state_variants | D1:FBA:3.2.4 |
| `OLC-002` | OLC | El OLC captura todos los estados relevantes por los que un objeto de una clase puede pasar durante su vida. | object_states, state_evidence | D1:FBA:3.2.4 |
| `OLC-003` | OLC | Los estados se nombran como estados del objeto unico cuyo ciclo se modela; no se mezclan estados de otros objetos. | object_class, state_names | D1:FBA:3.2.4 |
| `OLC-004` | OLC | Todas las transiciones tienen razon de transicion y operacion, donde la operacion es propiedad del objeto. | transition.reason, transition.operation, class.operations | D1:FBA:3.2.4 |
| `OLC-005` | OLC | La razon de transicion es un evento o combinacion logica de eventos. | transition.reason, event_expression | D1:FBA:3.2.4 |
| `OLC-006` | OLC | El ciclo de vida de un objeto tiene un solo comienzo. | initial_pseudostate | D1:FBA:3.2.4 |
| `OLC-007` | OLC | El ciclo de vida de un objeto tiene al menos un pseudoestado final. | final_pseudostates | D1:FBA:3.2.4 |
| `OLC-008` | OLC | Desde cada estado no final debe haber al menos dos transiciones salientes. | state.outgoing_transitions | D1:FBA:3.2.4 |
| `OLC-009` | OLC | Para cada estado no final, al menos una transicion hacia otro estado debe estar garantizada a ocurrir. | state.outgoing_transitions, guaranteed_transition | D1:FBA:3.2.4 |
| `OLC-010` | OLC | El OLC debe capturar la vida completa de la entidad, no solo su reflejo en un sistema de informacion. | real_world_lifecycle_scope, it_scope_boundary | D1:FBA:3.2.3 |
| `OLC-011` | OLC | No se usan simbolos de branching/merging para partir transiciones; solo transiciones directas entre estados. | transition_structure | D1:FBA:3.2.3 |
| `OLC-012` | OLC | La razon de una transicion debe ser un cambio en otro objeto/estado de cosas o el paso del tiempo. | transition.reason, external_event_or_time | D1:FBA:3.2.3 |
| `OLC-013` | OLC | La operacion especificada en la transicion debe existir como propiedad de la clase modelada. | transition.operation, class.operation_list | D1:FBA:3.2.3, D1:FBA:3.2.4 |
| `OLC-014` | OLC | No se deben fusionar ciclos de vida de objetos de clases distintas en un solo OLC; el paralelismo puede revelar otro objeto. | object_class, state_ownership | D1:FBA:3.2.3 |
| `OLC-015` | OLC | Cada relacion 1:N del MoC debe tener representacion iterativa en el OLC del objeto correspondiente. | moc_relationship_multiplicity, olc_iteration_cycle | D1:FBA:3.2.3, D1:FBA:4.5.2 |
| `OLC-016` | OLC | Las transiciones indican cuando una operacion puede ejecutarse; si no aparece en transiciones desde un estado, no esta permitida en ese estado. | state, allowed_operations, transition.operation | D1:FBA:3.2.3 |
| `OLC-017` | OLC | Los cambios relevantes de atributos o relaciones del objeto deben estar cubiertos por transiciones del OLC, aunque no cambien el estado fundamental. | attribute_change_operation, association_change_operation, transition_or_self_loop | D1:FBA:3.2.3 |

## 5. MMABP Consistency Gate

Comprobar coherencia factual, temporal, estructural y compuesta entre vistas conformantes.

### Reglas del motor

| ID | Regla | Modo | Fallo |
|---|---|---|---|
| `CONS-ENG-001` | Consistency solo evalúa modelos individualmente conformantes. | `deterministic` | `not_evaluated_due_to_conformance` |
| `CONS-ENG-002` | Cada regla evalúa contradicción entre elementos y ausencia de elementos exigidos por otra vista. | `structured_semantic` | `blocked_by_contradiction` |
| `CONS-ENG-003` | Nombres naturales se comparan por significado intencionado, no por igualdad de cadenas. | `human_validation_required` | `manual_review_required` |
| `CONS-ENG-004` | La evaluación registra primero coherencia factual; después secuencia y estructura. | `deterministic` | `manual_review_required` |
| `CONS-ENG-005` | PF↔OLC temporal compara event/reason → action → state. | `structured_semantic` | `blocked_by_contradiction` |
| `CONS-ENG-006` | Alternativas PF/OLC y multiplicidad MoC/OLC se verifican como estructuras correspondientes. | `structured_semantic` | `blocked_by_contradiction` |
| `CONS-ENG-007` | Una consistencia de tres o cuatro vistas se calcula desde resultados pairwise y evidencia compuesta, no por promedio ciego. | `deterministic` | `blocked_by_missing_evidence` |
| `CONS-ENG-008` | Ante inconsistencia no se alinea un modelo al otro; se identifica qué representación contradice la realidad. | `human_validation_required` | `manual_review_required` |
| `CONS-ENG-009` | Fase 5 solo emite inconsistency records; la traducción EVE ocurre downstream tras readiness. | `deterministic` | `manual_review_required` |
| `CONS-ENG-010` | Una inconsistencia blocker impide registry, IR, export y Producción Paralela hasta reentry/corrección. | `deterministic` | `blocked_by_contradiction` |

### Reglas MMABP de consistencia

| ID | Modelos | Tipo | Regla | Fuente |
|---|---|---|---|---|
| `CONS-001` | PM↔MoC | `factual_consistency` | Los procesos y estados objetivo del PM deben referirse a objetos, estados y conceptos existentes o justificables en el MoC. | D1:FBA:4.3.1 |
| `CONS-002` | PM↔PF | `factual_consistency` | El PF de un proceso debe respetar los disparadores, fines/target states y relaciones de soporte declaradas en el PM. | D1:FBA:4.3.2, D1:FBA:4.8 |
| `CONS-003` | MoC↔PF | `factual_consistency` | El PF debe manipular objetos, estados y operaciones coherentes con las clases y propiedades definidas en el MoC. | D1:FBA:4.3.3 |
| `CONS-004` | PF↔PF | `factual_consistency` | Procesos que se sincronizan entre si deben usar eventos y estados compatibles entre el proceso soportado y el proceso soporte. | D1:FBA:4.3.4, D1:FBA:4.8 |
| `CONS-005` | PF↔OLC | `factual_consistency` | Los estados resultantes de tareas y las operaciones invocadas en PF deben existir y ser permitidas por el OLC correspondiente. | D1:FBA:4.3.5, D1:FBA:4.4 |
| `CONS-006` | OLC↔MoC | `factual_consistency` | El OLC debe usar atributos, relaciones, operaciones y estados que existan o esten reflejados en el MoC. | D1:FBA:4.3.6, D1:FBA:4.5.2 |
| `CONS-007` | OLC↔OLC | `factual_consistency` | Si una transicion OLC refiere el estado de otro objeto, ese estado debe existir en el OLC del objeto referenciado. | D1:FBA:4.3.7 |
| `CONS-008` | PF↔OLC | `temporal_consistency` | La secuencia de estados impuesta por el PF no puede contradecir la secuencia causal definida en el OLC. | D1:FBA:4.4 |
| `CONS-009` | PF↔OLC | `temporal_consistency` | La evaluacion temporal debe comparar la sucesion event/reason -> action -> state entre PF y OLC. | D1:FBA:4.4 |
| `CONS-010` | PF↔OLC | `structural_consistency` | Los estados de un objeto capturados como alternativas en PF deben ser alternativas en su OLC, y viceversa. | D1:FBA:4.5.1 |
| `CONS-011` | MoC↔OLC | `structural_consistency` | Cada asociacion 1:N del MoC debe reflejarse como ciclo iterativo en el OLC del objeto correspondiente. | D1:FBA:4.5.2 |
| `CONS-012` | MoC↔OLC | `structural_consistency` | Los cambios de atributos y relaciones definidos en MoC deben estar cubiertos por operaciones y transiciones del OLC. | D1:FBA:4.5.2 |
| `CONS-013` | PM↔MoC↔PF | `composite_consistency` | PM, MoC y PF deben contar la misma historia factual: proceso declarado, objetos definidos y ejecucion detallada no se contradicen. | D1:FBA:4.7 |
| `CONS-014` | PM↔PF↔OLC | `composite_consistency` | La intencion del proceso, su ejecucion y la causalidad de los objetos deben ser temporalmente posibles. | D1:FBA:4.4 |
| `CONS-015` | PM↔MoC↔PF↔OLC | `composite_consistency` | Las cuatro vistas deben formar un unico modelo de sistema de negocio sin contradicciones factuales, temporales ni estructurales. | D1:FBA:4.7 |

### Compartimentos de consistencia y puente diagnóstico desactivado

| ID | Modelos | Tipo | Output Fase 5 | Diagnóstico Fase 5 |
|---|---|---|---|---:|
| `EVE02-CMP-001` | PM ↔ MoC | `Factual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-002` | PM ↔ PF | `Factual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-003` | MoC ↔ PF | `Factual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-004` | PF ↔ OLC | `Factual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-005` | OLC ↔ MoC | `Factual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-006` | PF ↔ OLC | `Temporal` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-007` | PF ↔ OLC | `StructuralAlternatives` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-008` | OLC ↔ MoC | `StructuralIterations` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-009` | PM ↔ MoC ↔ PF | `CompositeFactual` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-010` | PM ↔ PF ↔ OLC | `TemporalIntentional` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-011` | PM ↔ MoC ↔ OLC | `StructuralOntological` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-012` | MoC ↔ PF ↔ OLC | `CausalOperational` | `inconsistency_candidate_only` | No |
| `EVE02-CMP-013` | PM ↔ MoC ↔ PF ↔ OLC | `SystemicTotal` | `inconsistency_candidate_only` | No |

## Readiness y frontera downstream

El Gate Engine **no decide el readiness final**. Emite candidatos de estado y delega la decisión al `ReadinessEngine` definido por la especificación técnica.

Estados permitidos:

- `ready`
- `ready_with_flags`
- `blocked_by_missing_evidence`
- `blocked_by_contradiction`
- `blocked_by_missing_canonical_route`
- `manual_review_required`
- `reentry_required`

El puente hacia EVE02 permanece desactivado. Solo se emiten `inconsistency_candidate`; no se emiten patologías ni diagnóstico final.

## Trazabilidad fuente → destino

| Fuente | Destino | Estado | Unidades |
|---|---|---|---:|
| D6!Critical_Routes | `modules.critical_route_gate.routes` | `transduced_exact_plus_execution_contract` | 4 |
| D8!Critical_Routes + Catalogo_Madre_Nodos | `modules.critical_route_gate.routes[].genealogy` | `transduced_exact` | 18 |
| D5:6.1-6.3,9,11 + D4:10,24 | `modules.critical_route_gate.rules` | `transduced_structured` | 10 |
| D6!Semantic_Resolution_Gates | `modules.semantic_resolution_gate.gate_definitions` | `transduced_exact` | 7 |
| D5:8.1 + D4:3,10 + D1:3.1.5,3.2.4 | `modules.semantic_resolution_gate.rules` | `transduced_structured` | 8 |
| D6!Process_State_Timer_Gates | `modules.process_state_timer_gate.gate_definitions` | `transduced_exact` | 6 |
| D5:8.2 + D4:3,10 + D1:2.3.6,3.2.4,4.3.5,4.4 | `modules.process_state_timer_gate.rules` | `transduced_structured` | 9 |
| D1 via EVE00 PM/MoC/PF/OLC rules | `modules.mmabp_conformance_gate.model_rules` | `compiled_with_original_source_refs` | 53 |
| D1:1.3,4.1,4.2 + D4:1,3,27 | `modules.mmabp_conformance_gate.engine_rules` | `transduced_structured` | 8 |
| D1 via EVE00 consistency rules | `modules.mmabp_consistency_gate.method_rules` | `compiled_with_original_source_refs` | 15 |
| D1:4.1-4.5 + D4:1 + D5:10-11 | `modules.mmabp_consistency_gate.engine_rules` | `transduced_structured` | 10 |
| D2 via EVE02 compartments | `modules.mmabp_consistency_gate.compartments` | `downstream_reference_only` | 13 |
| D6!Readiness_Gaps_Reentry | `enums.readiness_states + gate readiness candidates` | `transduced_exact` | 7 |
| D5+D7+D3 | `integration_rules + failure_guards + boundaries` | `transduced_structured` | 14 |

## Conteos

- `critical_routes`: **4**
- `critical_route_engine_rules`: **10**
- `semantic_gates`: **7**
- `semantic_engine_rules`: **8**
- `process_state_timer_gates`: **6**
- `process_state_timer_engine_rules`: **9**
- `conformance_model_rules`: **53**
- `conformance_engine_rules`: **8**
- `consistency_method_rules`: **15**
- `consistency_engine_rules`: **10**
- `consistency_compartments`: **13**
- `atomic_rules_and_gate_definitions`: **130**
- `readiness_states`: **7**
- `failure_guards`: **14**
- `source_documents`: **10**

## Contrato de instalación

- Ruta recomendada: `docs/chips/gate-engine/EVE_05_Gate_Engine_v0_1/`
- Modo de activación: `shadow_first`
- `active_runtime_authority`: false
- `product_wiring`: false
- `registry_write`: false
- `diagnosis_enabled`: false
- `export_enabled`: false
- `parallel_production_enabled`: false

## Dictamen

READY_FOR_SHADOW_INTEGRATION; no instalado, no productivo y sin diagnóstico/export/transducción activos.
