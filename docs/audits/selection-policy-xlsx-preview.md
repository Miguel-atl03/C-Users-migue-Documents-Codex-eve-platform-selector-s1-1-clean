# Selection Policy XLSX Preview

Workbook: `docs\policies\PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx`

Sheets: 43

## Version_Control
Rows: 0 | Columns: 0 | Non-empty rows: 37
Columns/header candidate: Campo, Contenido
Flags: scoring, gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | Campo | Contenido |
| 2 | Nombre del artefacto | PrimaryActivitySelectionPolicy — Selector técnico de actividades primarias EVE/MMABP |
| 3 | Versión | v1.2 operacional — conserva v1.0/v1.1 y agrega política <=8 actividades, Context Bundle Estado A/WorkMap/Significado y confirmación de Significado como pantalla de ejecución Runtime 40/20 |
| 4 | Fecha | 2026-06-14 |
| 5 | Tipo de artefacto | Workbook implementable para selección de máximo 8 actividades primarias desde WorkMap |

## Authority_Rules
Rows: 0 | Columns: 0 | Non-empty rows: 9
Columns/header candidate: Artefacto, Autoridad, No debe hacer, Uso en la pantalla
Flags: scoring, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Artefacto | Autoridad | No debe hacer | Uso en la pantalla |
| 2 | Catálogo Madre v1.0 | Fuente canónica de nodos, códigos originales, rutas críticas y corpus documental. | No define por sí solo la carga visible 40+20 ni la selección de actividades. | No se muestra al usuario; alimenta trazabilidad interna. |
| 3 | Catálogo Runtime v1.1 DOCX | Norma de reglas operativas del Runtime 40+20. | No es base de datos ni artefacto ejecutable directo. | Sirve como manual de comportamiento de UI/motor. |
| 4 | Catálogo Runtime v1.1 XLSX | Fuente implementable para interfaz, motor y QA del Runtime por actividad. | No selecciona actividades primarias desde WorkMap. | Se ejecuta solo sobre actividades primarias ya seleccionadas. |
| 5 | PrimaryActivitySelectionPolicy XLSX | Fuente implementable para elegir hasta 8 actividades primarias. | No diagnostica, no reemplaza Runtime, no reescribe WorkMap. | Gobierna pantalla previa al Runtime. |

## Methodology_Overview
Rows: 0 | Columns: 0 | Non-empty rows: 8
Columns/header candidate: Fase, Nombre, Objetivo, Regla clínica, Salida
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Fase | Nombre | Objetivo | Regla clínica | Salida |
| 2 | 0 | Ingesta WorkMap | Recibir actividades con área, responsabilidad, activityId, responsibilityId, texto literal y advertencias. | No inferir estructura dura desde texto débil sin confirmación. | ActivityCandidateList |
| 3 | 1 | Normalización semántica mínima | Resolver duplicados, alias, granularidad y si el texto describe una actividad de trabajo. | No convertir área, rol, valor, opinión o resultado deseado en actividad primaria. | NormalizedActivityCandidates |
| 4 | 2 | Gates de elegibilidad | Bloquear o enviar a revisión actividades sin trazabilidad, no accionables, duplicadas o con ambigüedad excesiva. | La selección empieza descartando falsos candidatos, no rankeando todo. | Eligible/Review/Blocked |
| 5 | 3 | Scoring estructural | Medir potencial para revelar PM, MoC, PF, OLC, fricción, variedad, capacidad, handoff y compensación. | Se prioriza capacidad de producir evidencia diagramable, no importancia subjetiva del usuario. | SelectorScore |

## Input_Schema
Rows: 0 | Columns: 0 | Non-empty rows: 16
Columns/header candidate: Campo, Origen, Tipo, Obligatorio, Uso, Regla
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Campo | Origen | Tipo | Obligatorio | Uso | Regla |
| 2 | workmap_id | WorkMap | string | Sí | Trazabilidad del mapa completo. | No seleccionar sin mapa de origen. |
| 3 | area_id | WorkMap | string | Sí | Cobertura por área. | Permite balance, no diagnóstico. |
| 4 | area_label | WorkMap | string | Sí | Texto visible y contexto. | No confundir área con actividad. |
| 5 | responsibility_id | WorkMap | string | Sí | Relación responsabilidad → actividad. | Gate duro si falta. |

## Eligibility_Gates
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: Gate, Nombre, Condición de aprobación, Falla si..., Acción, Impacto
Flags: gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Gate | Nombre | Condición de aprobación | Falla si... | Acción | Impacto |
| 2 | G1 | Trazabilidad WorkMap | activity_id y responsibility_id existen. | No hay ID o no hay relación actividad-responsabilidad. | Bloquear hasta corregir WorkMap. | Evita actividad huérfana. |
| 3 | G2 | Actividad de trabajo | El texto describe trabajo accionable, no área, rol, valor o emoción. | Es 'ventas', 'liderazgo', 'estrés', 'clientes' o etiqueta abstracta. | Revisión semántica B0. | Protege conformance. |
| 4 | G3 | Granularidad correcta | No es macroproceso total ni microclick técnico. | Es demasiado amplia, microtarea o ambigua. | Normalizar, dividir o fusionar. | Evita Runtime inviable. |
| 5 | G4 | No duplicado/alias | No repite otra actividad con distinto nombre. | Alias probable o duplicado exacto. | Resolver alias o merge. | Evita sobreselección artificial. |

## Scoring_Weights
Rows: 0 | Columns: 0 | Non-empty rows: 47
Columns/header candidate: Bloque de pesos, Criterio, Peso, Descripción
Flags: scoring, gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | Bloque de pesos | Criterio | Peso | Descripción |
| 2 | Composite | MMABP_Potential | 0.45 | Capacidad de producir evidencia para PM/MoC/PF/OLC. |
| 3 | Composite | Friction_Variety | 0.25 | Señales de bloqueo, espera, retrabajo, capacidad, variedad residual. |
| 4 | Composite | Coverage | 0.15 | Cobertura de responsabilidades, área, valor y procesos soporte/externalidad. |
| 5 | Composite | Evidence_Feasibility | 0.1 | Calidad semántica y factibilidad de aplicar Runtime sin contaminar evidencia. |

## Selector_Template
Rows: 0 | Columns: 0 | Non-empty rows: 1
Columns/header candidate: activity_id, responsibility_id, area, functional_role, activity_label, activity_description, workmap_trace_ok, is_work_activity, granularity_status, duplicate_or_alias, semantic_clarity_0_5, process_context_0_5, customer_receiver_hint_0_5, trigger_hint_0_5, transformation_object_0_5, state_change_0_5, handoff_dependency_0_5, wait_timer_blocking_0_5, variability_frequency_0_5, capacity_pressure_0_5
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias | semantic_clarity_0_5 | process_context_0_5 | customer_receiver_hint_0_5 | trigger_hint_0_5 | transformation_object_0_5 | state_change_0_5 | handoff_dependency_0_5 | wait_timer_blocking_0_5 | variability_frequency_0_5 | capacity_pressure_0_5 | workaround_rework_0_5 | info_gap_rule_informal_0_5 | human_compensation_0_5 | support_external_process_0_5 | strategic_value_or_loss_0_5 | coverage_uniqueness_0_5 | runtime_feasibility_0_5 | evidence_quality_0_5 | Hard_Gate | MMABP_Potential | Friction_Variety | Coverage_Score | Evidence_Feasibility | Critical_Boost | Burden_Risk | Total_Selector_Score | Selector_Rank | Initial_Selection_Status | Coverage_Class | Override_Policy | Final_Selection_Status | Dominant_Reason |  |

## Coverage_Balance
Rows: 0 | Columns: 0 | Non-empty rows: 10
Columns/header candidate: Regla, Descripción, Aplicación, Motivo
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Regla | Descripción | Aplicación | Motivo |
| 2 | B1 | Máximo 8 actividades primarias | Si final_selection_count > 8, bloquear avance a Runtime. | Protege carga operativa. |
| 3 | B2 | No concentración excesiva | No más de 3 actividades de la misma responsabilidad, salvo si el WorkMap solo contiene esa responsabilidad. | Evita ceguera local. |
| 4 | B3 | Cobertura MMABP mínima | Si existen candidatas, seleccionar al menos una con alta transformación/estado, una con handoff/dependencia y una con fricción/capacidad/workaround. | Protege PM/MoC/PF/OLC. |
| 5 | B4 | Actividades soporte visibles | Si un soporte aparece como cuello de botella, dependencia o workaround recurrente, puede promoverse a primaria. | Evita soporte oculto en PM. |

## Selection_Flow
Rows: 0 | Columns: 0 | Non-empty rows: 16
Columns/header candidate: Paso, Pseudocódigo / regla de motor
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Paso | Pseudocódigo / regla de motor |
| 2 | 1 | candidate_list = ingest(WorkMap.areas.responsibilities.activities) |
| 3 | 2 | candidate_list = attach_traceability(workmap_id, area_id, responsibility_id, activity_id, role_functional) |
| 4 | 3 | candidate_list = normalize_aliases_and_granularity(candidate_list) |
| 5 | 4 | for each activity: apply Eligibility_Gates G1..G10 |

## UX_Contract
Rows: 0 | Columns: 0 | Non-empty rows: 9
Columns/header candidate: Pantalla / componente, Debe mostrar, No debe mostrar, Regla de interacción
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Pantalla / componente | Debe mostrar | No debe mostrar | Regla de interacción |
| 2 | WorkMap completo | Todas las actividades como contexto. | No marcar las no primarias como inútiles. | Las no seleccionadas siguen vivas para contexto/reentry. |
| 3 | Selección propuesta | Hasta 8 actividades primarias con chips de razón: transformación, handoff, bloqueo, capacidad, workaround, cobertura. | No decir 'EVE diagnosticó'. | Se presenta como priorización metodológica para evaluación. |
| 4 | Corrección del usuario | Opciones: no pertenece a mi rol, está duplicada, ya no ocurre, está mal redactada, dividir/fusionar. | No ofrecer 'elige tus 8 favoritas'. | Corrección factual dispara recálculo. |
| 5 | Actividad ambigua | Solicitar microconfirmación B0: '¿A qué trabajo concreto te refieres?'. | No inventar objeto/proceso. | Si no se resuelve, queda en revisión. |

## Runtime_Handoff
Rows: 0 | Columns: 0 | Non-empty rows: 17
Columns/header candidate: Campo payload, Tipo, Obligatorio, Descripción, Consumidor
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Campo payload | Tipo | Obligatorio | Descripción | Consumidor |
| 2 | runtime_activity_id | string | Sí | ID derivado para abrir Runtime 40+20. | Runtime |
| 3 | activity_id | string | Sí | ID original WorkMap. | Runtime / Auditoría |
| 4 | responsibility_id | string | Sí | Trazabilidad a responsabilidad. | Runtime / MBA |
| 5 | area_id | string | Sí | Trazabilidad a área. | Runtime / Contexto |

## NonPrimary_Context
Rows: 0 | Columns: 0 | Non-empty rows: 7
Columns/header candidate: Estado no primario, Cuándo aplica, Qué se conserva, Puede promoverse si..., Riesgo evitado
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Estado no primario | Cuándo aplica | Qué se conserva | Puede promoverse si... | Riesgo evitado |
| 2 | Contexto / backlog | Actividad elegible pero fuera del top 8 o no necesaria por balance. | activityId, responsibilityId, texto, score, razón. | Otro run, nuevo rol, reentry, cambio de prioridad estructural. | Borrado de realidad. |
| 3 | Soporte candidato | Actividad soporte habilita/repara/sincroniza otra actividad. | Relación con primaria, dependencia, evento. | Aparece como cuello de botella, workaround o proceso soporte oculto. | Ocultar soporte en proceso principal. |
| 4 | Alias / merge | Actividad duplica otra con distinto lenguaje. | Mapa de equivalencia semántica. | Se demuestra que no es alias sino objeto/handoff distinto. | Duplicidad artificial. |
| 5 | Revisión semántica | Texto pobre, ambiguo o no accionable. | Texto literal y reason code. | Usuario aclara actividad concreta. | Inferencia falsa. |

## MMABP_Rationale
Rows: 0 | Columns: 0 | Non-empty rows: 13
Columns/header candidate: Elemento selector, Relación MMABP, Por qué importa para seleccionar actividades
Flags: balance, modes

| Row | Values |
| ---: | --- |
| 1 | Elemento selector | Relación MMABP | Por qué importa para seleccionar actividades |
| 2 | process_context_0_5 | PM | Permite ubicar la actividad en proceso contenedor, intención, cliente/necesidad y soporte. |
| 3 | customer_receiver_hint_0_5 | PM/PF | Evita actividad flotante; prepara handoff, satisfacción y feedback. |
| 4 | trigger_hint_0_5 | PM/PF | Sin disparador, Runtime arranca desde reacción subjetiva y no desde evento. |
| 5 | transformation_object_0_5 | MoC/PF/OLC | Identifica objeto de negocio y evita PF sin objeto. |

## QA_Checklist
Rows: 0 | Columns: 0 | Non-empty rows: 28
Columns/header candidate: QA_ID, Prueba, Criterio de aprobación, Estado
Flags: scoring, gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | QA_ID | Prueba | Criterio de aprobación | Estado |
| 2 | QA-01 | Máximo 8 primarias | Dashboard final_primary_count <= 8. |
| 3 | QA-02 | Trazabilidad completa | Toda primaria tiene activity_id, responsibility_id y role_functional. |
| 4 | QA-03 | No selección de bloqueadas | Ninguna actividad con Hard_Gate=BLOQUEADA tiene Final_Selection_Status primaria. |
| 5 | QA-04 | Revisión no entra a Runtime | Actividades en REVISIÓN no entran sin override justificado. |

## Implementation_Dicts
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Diccionario, Valores
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Diccionario | Valores |
| 2 | Sí/No | Sí / No |
| 3 | granularity_status | Correcta / Demasiado amplia / Microtarea / Ambigua |
| 4 | duplicate_or_alias | No / Posible / Sí |
| 5 | score_0_5 | 0 / 1 / 2 / 3 / 4 / 5 |

## Dashboard
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Métrica, Valor, Regla/alerta
Flags: scoring, gates, balance

| Row | Values |
| ---: | --- |
| 1 | Métrica | Valor | Regla/alerta |
| 2 | Actividades cargadas | 0 |
| 3 | Elegibles | 0 |
| 4 | En revisión | 0 |
| 5 | Bloqueadas | 0 |

## Example_Run
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: activity_id, responsibility_id, area, functional_role, activity_label, activity_description, workmap_trace_ok, is_work_activity, granularity_status, duplicate_or_alias, semantic_clarity_0_5, process_context_0_5, customer_receiver_hint_0_5, trigger_hint_0_5, transformation_object_0_5, state_change_0_5, handoff_dependency_0_5, wait_timer_blocking_0_5, variability_frequency_0_5, capacity_pressure_0_5
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias | semantic_clarity_0_5 | process_context_0_5 | customer_receiver_hint_0_5 | trigger_hint_0_5 | transformation_object_0_5 | state_change_0_5 | handoff_dependency_0_5 | wait_timer_blocking_0_5 | variability_frequency_0_5 | capacity_pressure_0_5 | workaround_rework_0_5 | info_gap_rule_informal_0_5 | human_compensation_0_5 | support_external_process_0_5 | strategic_value_or_loss_0_5 | coverage_uniqueness_0_5 | runtime_feasibility_0_5 | evidence_quality_0_5 | Hard_Gate | MMABP_Potential | Friction_Variety | Coverage_Score | Evidence_Feasibility | Critical_Boost | Burden_Risk | Total_Selector_Score | Selector_Rank | Initial_Selection_Status | Coverage_Class | Override_Policy | Final_Selection_Status | Dominant_Reason |  |
| 2 | A001 | R001 | Operaciones | Rol A | Procesar pedido delivery | Tomar, validar y pasar pedido delivery a cocina/reparto | Sí | Sí | Correcta | No | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 3 | 4 | 4 | 4 | 3 | 3 | 4 | 5 | 5 | 4 | 5 | ELEGIBLE | 95.2 | 75 | 97 | 91 | 7 | 2 | 91.9 | 2 | Primaria propuesta | Transformación/OLC |  | Primaria propuesta | Cobertura | 40+20 probable | Enviar a Runtime |
| 3 | A002 | R001 | Operaciones | Rol A | Actualizar inventario | Registrar entrada/salida de productos al cierre | Sí | Sí | Correcta | No | 4 | 4 | 3 | 3 | 5 | 5 | 3 | 2 | 4 | 3 | 2 | 2 | 1 | 3 | 4 | 4 | 5 | 4 | ELEGIBLE | 75.4 | 48.4 | 77 | 89 | 2 | 2 | 68.2 | 6 | Primaria propuesta | Transformación/OLC |  | Primaria propuesta | Evidencia/feasibilidad | 40 base + causales selectivas | Enviar a Runtime |
| 4 | A003 | R002 | Servicio | Rol A | Atender reclamo de cliente | Recibir reclamo, revisar causa y coordinar corrección | Sí | Sí | Correcta | No | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | ELEGIBLE | 88.2 | 89 | 97 | 91 | 10 | 2 | 95.3 | 1 | Primaria propuesta | Handoff/Flujo |  | Primaria propuesta | Cobertura | 40+20 probable | Enviar a Runtime |
| 5 | A004 | R003 | Administración | Rol A | Revisar factura rechazada | Resolver devolución o rechazo de factura por cliente/proveedor | Sí | Sí | Correcta | No | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 3 | 3 | 5 | 4 | 3 | 3 | 4 | 4 | 4 | 5 | ELEGIBLE | 88.8 | 78.8 | 77 | 91 | 9 | 2 | 89 | 3 | Primaria propuesta | Transformación/OLC |  | Primaria propuesta | Evidencia/feasibilidad | 40+20 probable | Enviar a Runtime |

## v1_1_Change_Log
Rows: 0 | Columns: 0 | Non-empty rows: 14
Columns/header candidate: Elemento, Contenido
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Elemento | Contenido |
| 2 | Propósito | Registrar los ajustes de v1.1 sin eliminar el contenido v1.0. |
| 3 | Problema corregido | El v1.0 podía leerse como demasiado estricto al evaluar actividades aún no procesadas por Runtime. |
| 4 | Corrección madre | La selección de actividades primarias se define como priorización bajo incertidumbre, no como diagramability readiness confirmado. |
| 5 | Cambio terminológico | Evidence Potential se alinea a Signal Potential. Diagramability Readiness se alinea a Runtime Probe Priority. |

## Signal_Method_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Sección, Regla / contenido, Implicación operativa, Riesgo que evita
Flags: gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Sección | Regla / contenido | Implicación operativa | Riesgo que evita |
| 2 | Principio rector | WorkMap entrega redacción del usuario, no evidencia MMABP cerrada. | El selector opera con señales débiles y confianza limitada. | Rigidez prematura. |
| 3 | Definición | Potencial de Señal Arquitectónica = probabilidad prudente de que Runtime pueda extraer evidencia útil para PM/MoC/PF/OLC. | Se prioriza lo prometedor para indagación profunda, no lo ya diagramable. | Confundir selección con diagnóstico. |
| 4 | PM Signal | La actividad sugiere entrega, receptor, cliente, hito, resultado, soporte o necesidad. | Abre posibilidad de construir Process Map después del Runtime. | PM burocrático sin cliente/trigger/target state. |
| 5 | MoC Signal | La actividad contiene sustantivos de negocio reconocibles: pedido, caso, solicitud, factura, cliente, documento, aprobación. | Abre posibilidad de clases, atributos, relaciones, roles, phases o ends. | Ceguera ontológica. |

## PreRuntime_Rules_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: Regla_ID, Regla, Aplicación, Estado esperado
Flags: gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | Regla_ID | Regla | Aplicación | Estado esperado |
| 2 | PR-01 | La selección es priorización bajo incertidumbre. | No exigir cliente/objeto/estado/trigger explícitos antes de Runtime. | Selector prudente. |
| 3 | PR-02 | Una señal débil puede justificar selección si la actividad tiene densidad operativa. | Tratar verbos y sustantivos como hipótesis de indagación, no como hechos. | Hipótesis trazable. |
| 4 | PR-03 | Unknown no es cero. | Blanco/unknown queda neutral o activa revisión; no bloquea por sí solo. | Menos falsos negativos. |
| 5 | PR-04 | Solo bloquear cuando no se pueda ejecutar Runtime de forma razonable. | Vacío, no actividad, duplicado evidente, microtarea, responsabilidad genérica o proceso demasiado amplio. | Gates duros mínimos. |

## Scoring_Model_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 15
Columns/header candidate: Bloque, Criterio, Peso / escala, Definición v1.1, Nota operacional
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Bloque | Criterio | Peso / escala | Definición v1.1 | Nota operacional |
| 2 | Composite | Architectural_Signal_Potential | 0.3 | Promedio ponderado de señales PM/MoC/PF/OLC bajo incertidumbre. | No requiere evidencia cerrada. |
| 3 | Composite | Operational_Centrality | 0.2 | La actividad parece central para la responsabilidad/rol o afecta continuidad de trabajo. | No confundir con preferencia del usuario. |
| 4 | Composite | Handoff_or_Dependency_Signal | 0.15 | Señales de receptor, entrega, espera, coordinación o dependencia. | Alta prioridad para PF/PM. |
| 5 | Composite | Transformation_or_Object_Signal | 0.15 | Señales de objeto de negocio, validación, creación, modificación, aprobación o cierre. | Alta prioridad para MoC/OLC. |

## Selector_Template_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 1
Columns/header candidate: activity_id, responsibility_id, area, functional_role, activity_label, activity_description, workmap_trace_ok, is_work_activity, granularity_status, duplicate_or_alias_status, user_text_density_0_3, semantic_clarity_0_3, pm_signal_0_3, moc_signal_0_3, pf_signal_0_3, olc_signal_0_3, operational_centrality_0_3, handoff_dependency_signal_0_3, transformation_object_signal_0_3, friction_exception_signal_0_3
Flags: scoring, gates, balance, payload

| Row | Values |
| ---: | --- |
| 1 | activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias_status | user_text_density_0_3 | semantic_clarity_0_3 | pm_signal_0_3 | moc_signal_0_3 | pf_signal_0_3 | olc_signal_0_3 | operational_centrality_0_3 | handoff_dependency_signal_0_3 | transformation_object_signal_0_3 | friction_exception_signal_0_3 | coverage_diversity_0_3 | vagueness_risk_0_3 | granularity_risk_0_3 | duplicate_alias_risk_0_3 | unknown_signal_count | Hard_Gate | Architectural_Signal_Potential | Operational_Centrality_Score | Handoff_Dependency_Score | Transformation_Object_Score | Friction_Exception_Score | Coverage_Diversity_Score | Penalty_Total | PrimaryActivitySelectionScore | Selector_Rank | Slot_Candidate | Initial_Selection_Status | Manual_Review_Need | Final_Selection_Status | Runtime_Openi |

## Slot_Balance_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: Slot, Criterio, Cómo se asigna, Regla de prudencia
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Slot | Criterio | Cómo se asigna | Regla de prudencia |
| 2 | 1 | Mayor score total elegible | Actividad elegible con mayor PrimaryActivitySelectionScore. | No diagnostica; solo prioriza Runtime. |
| 3 | 2 | Mayor score total elegible | Siguiente actividad elegible no duplicada. | Mantener diversidad de responsabilidad/área si hay empate. |
| 4 | 3 | Mayor score total elegible | Siguiente actividad elegible no duplicada. | Evitar ocho actividades del mismo microflujo. |
| 5 | 4 | Mayor score total elegible | Siguiente actividad elegible no duplicada. | Preferir diversidad de objeto/entrega. |

## Runtime_Handoff_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 16
Columns/header candidate: Campo payload, Obligatorio, Descripción, Fuente en selector, Nota
Flags: scoring, gates, payload

| Row | Values |
| ---: | --- |
| 1 | Campo payload | Obligatorio | Descripción | Fuente en selector | Nota |
| 2 | activity_id | Sí | ID de actividad WorkMap seleccionada. | Selector_Template_v1_1 | Trazabilidad. |
| 3 | responsibility_id | Sí | Responsabilidad asociada. | Selector_Template_v1_1 | Trazabilidad. |
| 4 | area | Sí | Área declarada. | Selector_Template_v1_1 | Contexto. |
| 5 | functional_role | Sí | Rol funcional evaluado. | Selector_Template_v1_1 | Unidad por rol. |

## QA_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 13
Columns/header candidate: QA_ID, Prueba, Criterio de aprobación, Riesgo controlado
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | QA_ID | Prueba | Criterio de aprobación | Riesgo controlado |
| 2 | QA-v1.1-01 | Máximo 8 primarias | Final_Selection_Status primaria <= 8. | Sobrecarga UX. |
| 3 | QA-v1.1-02 | No gates MMABP duros prematuros | No bloquear por falta explícita de cliente, objeto, estado, receptor, timer o transición en WorkMap. | Rigidez prematura. |
| 4 | QA-v1.1-03 | Unknown no equivale a cero | Las señales en blanco se tratan neutral o revisión, no como 0 automático. | Falsos negativos. |
| 5 | QA-v1.1-04 | Gates duros mínimos | Bloquear solo vacío/no actividad/duplicado evidente/microtarea/demasiado amplia/responsabilidad genérica. | Selección punitiva. |

## Dashboard_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 14
Columns/header candidate: Métrica, Valor, Regla / alerta
Flags: scoring, gates, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Métrica | Valor | Regla / alerta |
| 2 | Actividades cargadas | 0 | Informativo |
| 3 | Elegibles | 0 | Informativo |
| 4 | En revisión | 0 | Puede alimentar slot exploratorio o reentry |
| 5 | Bloqueadas | 0 | Corregir WorkMap/B0 |

## Example_Run_v1_1
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: activity_id, responsibility_id, area, functional_role, activity_label, activity_description, workmap_trace_ok, is_work_activity, granularity_status, duplicate_or_alias_status, user_text_density_0_3, semantic_clarity_0_3, pm_signal_0_3, moc_signal_0_3, pf_signal_0_3, olc_signal_0_3, operational_centrality_0_3, handoff_dependency_signal_0_3, transformation_object_signal_0_3, friction_exception_signal_0_3
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias_status | user_text_density_0_3 | semantic_clarity_0_3 | pm_signal_0_3 | moc_signal_0_3 | pf_signal_0_3 | olc_signal_0_3 | operational_centrality_0_3 | handoff_dependency_signal_0_3 | transformation_object_signal_0_3 | friction_exception_signal_0_3 | coverage_diversity_0_3 | vagueness_risk_0_3 | granularity_risk_0_3 | duplicate_alias_risk_0_3 | unknown_signal_count | Hard_Gate | Architectural_Signal_Potential | Operational_Centrality_Score | Handoff_Dependency_Score | Transformation_Object_Score | Friction_Exception_Score | Coverage_Diversity_Score | Penalty_Total | PrimaryActivitySelectionScore | Selector_Rank | Slot_Candidate | Initial_Selection_Status | Manual_Review_Need | Final_Selection_Status | Runtime_Openi |
| 2 | A001 | R001 | Operaciones | Rol A | Revisar pedidos antes de enviarlos | Revisar pedidos antes de enviarlos a cocina/reparto | Sí | Sí | Correcta | No | 3 | 3 | 2 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 1 | 0 | 0 | 0 | ELEGIBLE | 83.3 | 100 | 66.7 | 100 | 66.7 | 100 | 8 | 78.7 | 4 | Slot 1-5: alto potencial | Primaria propuesta | No | Primaria propuesta | 40+20 probable | Alta | Prometedora | Prometedora | Prometedora | Prometedora | Señales suficientes para Runtime; no modelar aún pedido como clase confirmada. |
| 3 | A002 | R001 | Operaciones | Rol A | Actualizar inventario | Registrar entrada/salida de productos al cierre | Sí | Sí | Correcta | No | 2 | 3 | 1 | 3 | 2 | 2 | 2 | 1 | 3 | 1 | 2 | 1 | 0 | 0 | 0 | ELEGIBLE | 66.7 | 66.7 | 33.3 | 100 | 33.3 | 66.7 | 8 | 55.3 | 6 | Slot 7: transformación/objeto | Primaria propuesta | No | Primaria propuesta | 40 base + causales selectivas | Media | Débil / validar en B0.5-B1 | Prometedora | Prometedora | Prometedora | Transformación clara, aunque menor fricción. |
| 4 | A003 | R002 | Servicio | Rol A | Atender reclamo de cliente | Recibir reclamo, revisar causa y coordinar corrección | Sí | Sí | Correcta | No | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 2 | 3 | 3 | 0 | 0 | 0 | 0 | ELEGIBLE | 91.7 | 100 | 100 | 66.7 | 100 | 100 | 0 | 92.5 | 1 | Slot 1-5: alto potencial | Primaria propuesta | No | Primaria propuesta | 40+20 probable | Alta | Prometedora | Prometedora | Prometedora | Prometedora | Alto valor para handoff, PF y feedback posterior. |
| 5 | A004 | R003 | Administración | Rol A | Revisar factura rechazada | Resolver devolución o rechazo de factura por cliente/proveedor | Sí | Sí | Correcta | No | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 0 | 0 | 0 | 0 | ELEGIBLE | 91.7 | 66.7 | 100 | 100 | 100 | 66.7 | 0 | 87.5 | 2 | Slot 1-5: alto potencial | Primaria propuesta | No | Primaria propuesta | 40+20 probable | Alta | Prometedora | Prometedora | Prometedora | Prometedora | Prometedora para OLC por rechazo/devolución. |

## v1_2_Change_Log
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Campo, Contenido
Flags: gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | Campo | Contenido |
| 2 | Versión agregada | v1.2 operacional — Selección bajo incertidumbre + política para menos de 8 actividades + contexto Estado A/WorkMap/Significado + ejecución Runtime en Significado |
| 3 | Regla de intervención | No se elimina contenido v1.0/v1.1; no se resume contenido original; se agregan hojas *_v1_2, filas y columnas; solo se alinea redacción donde el ajuste narrativo lo exige. |
| 4 | Cambio conceptual 1 | Si hay <=8 actividades elegibles, no se aplica ranking competitivo: se evalúan todas las elegibles, después de limpieza semántica, control de duplicados, macro/micro actividad y cobertura del rol. |
| 5 | Cambio conceptual 2 | Más información no siempre es mejor. Mejor es información trazable, confirmada, contextualizada y útil para conformance/consistency futura. |

## Under8_Policy_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Regla / Caso, Condición, Acción EVE, Qué NO debe ocurrir, Salida técnica
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Regla / Caso | Condición | Acción EVE | Qué NO debe ocurrir | Salida técnica |
| 2 | Regla madre | eligible_activity_count <= 8 | Seleccionar todas las actividades elegibles después de gates mínimos y limpieza semántica. | No llenar cupos artificialmente; no forzar ranking competitivo. | selection_mode = non_competitive_inclusion |
| 3 | Cero actividades elegibles | eligible_activity_count = 0 | Bloquear ejecución de Runtime y reentrar a WorkMap. | No inventar actividades; no usar responsabilidades como actividades. | reentry_required = WorkMap |
| 4 | 1 a 3 actividades elegibles | 1 <= eligible_activity_count <= 3 | Ejecutar todas, pero activar control de cobertura del rol. | No asumir que el rol queda suficientemente cubierto. | role_coverage_flag = review |
| 5 | 4 a 7 actividades elegibles | 4 <= eligible_activity_count <= 7 | Ejecutar todas si pasan gates mínimos. | No excluir por bajo score relativo si son elegibles. | selected_for_runtime = all_eligible |

## Screen_Sequence_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 7
Columns/header candidate: Pantalla / Motor, Momento, Función, Qué produce, Qué NO produce
Flags: balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Pantalla / Motor | Momento | Función | Qué produce | Qué NO produce |
| 2 | Estado A | Inicio de plataforma | Captura rol funcional, nivel de decisión, alcance de autoridad, tipo de decisiones y frontera del rol. | RoleContext, decision_level, authority_scope, functional_role_context | No selecciona actividades; no diagnostica; no modela PM/MoC/PF/OLC. |
| 3 | WorkMap | Después de Estado A | Captura áreas, responsabilidades y actividades; conserva texto literal y trazabilidad área → responsabilidad → actividad. | WorkMapInventory, responsibilityId, activityId, activity_text, savedWithWarnings | No ejecuta Runtime; no confirma evidencia estructural profunda. |
| 4 | Selector interno EVE | Entre WorkMap y Significado | Evalúa actividades bajo incertidumbre. Si hay <=8 elegibles selecciona todas; si hay >8 prioriza máximo 8. | PrimaryActivitySelectionBundle, NonPrimaryContext, selection_mode | No es una pantalla delegada al usuario; no diagnostica. |
| 5 | Significado de tu Trabajo | Después del selector | Ejecuta Runtime 40/20 sobre cada actividad primaria seleccionada. El usuario ve una actividad primaria y contesta interacciones base/causales. | RuntimeEvidence por actividad, captured/confirmed evidence, gaps, readiness | No debe ser selector diagnóstico; no produce VSM/AHE cerrado; no monetiza. |

## Context_Bundle_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Fuente, Dato / Campo, Estado epistemológico inicial, Uso en selector, Uso en Runtime Significado, Uso posterior PM/MoC/PF/OLC, Regla de contaminación
Flags: gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Fuente | Dato / Campo | Estado epistemológico inicial | Uso en selector | Uso en Runtime Significado | Uso posterior PM/MoC/PF/OLC | Regla de contaminación |
| 2 | Estado A | functional_role | captured_user_evidence | Delimita perspectiva del usuario y rol que produce WorkMap. | Contextualiza wording: 'en tu rol de...' | Actor funcional, frontera, posible role en MoC. | Puede ser evidencia capturada si fue respondida/confirmada por usuario. |
| 3 | Estado A | decision_level | captured_user_evidence | Ayuda a detectar tensión entre actividad y autoridad. | Calibra preguntas de discrecionalidad, escalamiento y autorización. | PF: autoridad de tarea/handoff; OLC: quién puede causar transición. | No convierte autoridad inferida en hecho de proceso sin Runtime. |
| 4 | Estado A | authority_scope | captured_user_evidence/confirmed | Detecta actividad fuera de frontera del rol. | Prellena o microconfirma escalamiento, aprobación, control. | PM/PF: frontera actor/proceso; MoC: role contextual. | Si contradice WorkMap, marcar contradiction_flag, no corregir en silencio. |
| 5 | WorkMap | area | captured_user_evidence | Agrupa actividades y balancea cobertura. | Contextualiza actividad dentro de área. | PM: proceso/área de contexto; PF: no usar como swimlane. | Área no debe convertirse en swimlane PF. |

## Context_Epistemic_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 9
Columns/header candidate: Estado epistemológico, Definición, Puede prellenar UI, Puede contar como evidencia estructural, Requiere confirmación, Ejemplo
Flags: gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Estado epistemológico | Definición | Puede prellenar UI | Puede contar como evidencia estructural | Requiere confirmación | Ejemplo |
| 2 | captured_user_evidence | Lo dijo o confirmó explícitamente el usuario. | Sí | Sí, con trazabilidad. | No, ya fue capturado; puede requerir reconfirmación si contradice otro dato. | Actividad escrita por usuario en WorkMap. |
| 3 | inferred_from_workmap | Deducción débil desde texto, área, responsabilidad o relación WorkMap. | Sí, como sugerencia. | No, salvo confirmación posterior. | Sí si afectará variable canónica. | Inferir que 'pedido' podría ser objeto de negocio. |
| 4 | confirmed_in_runtime | Dato previamente inferido o contextual que fue confirmado durante Runtime. | Sí | Sí. | Ya confirmado. | El usuario confirma que 'pedido' es el objeto trabajado. |
| 5 | derived_internal | Dato calculado por regla interna desde variables confirmadas. | No siempre | Sí solo si la regla está documentada. | No si deriva de hechos confirmados; sí si tiene baja confianza. | selection_mode derivado de conteo de elegibles. |

## Activity_Quality_Gates_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: Gate, Nombre, Condición, Acción, Es bloqueo duro, Justificación
Flags: gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Gate | Nombre | Condición | Acción | Es bloqueo duro | Justificación |
| 2 | AQG-01 | Non empty activity | activity_label/activity_description no vacío | Permitir evaluación si hay texto mínimo. | Sí | Sin texto no hay unidad de trabajo. |
| 3 | AQG-02 | Belongs to role/workmap trace | activity_id y responsibility_id vinculados a WorkMap/Estado A | Permitir si hay trazabilidad o activar microconfirmación. | Sí/Review | Sin trazabilidad, la actividad flota. |
| 4 | AQG-03 | Work activity not abstract value | Debe describir acción de trabajo, no valor genérico ('ser responsable') | Pedir concreción o excluir. | Sí | Runtime necesita actividad observable. |
| 5 | AQG-04 | Duplicate/alias resolution | Actividad similar a otra candidata | Consolidar, fusionar o elegir formulación más rica. | Sí si duplicado confirmado | Evita fatiga y respuestas redundantes. |

## Selection_Mode_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 5
Columns/header candidate: Selection Mode, Condición, Cómo opera, Pantalla usuario, Payload hacia Runtime, Observación
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Selection Mode | Condición | Cómo opera | Pantalla usuario | Payload hacia Runtime | Observación |
| 2 | reentry_required | eligible_activity_count = 0 | No hay actividades elegibles; pedir corrección de WorkMap. | Mensaje de retorno breve: 'necesitamos actividades concretas para continuar'. | No runtime_payload. | No inventar actividades. |
| 3 | non_competitive_inclusion | 1 <= eligible_activity_count <= 8 | No ranking competitivo. Todas las elegibles pasan a Runtime, con orden sugerido y flags de calidad/cobertura. | Se muestra lista de actividades que se profundizarán. | primary_activities = all eligible. | El máximo 8 es límite, no objetivo a llenar. |
| 4 | competitive_selection | eligible_activity_count > 8 | Aplicar scoring bajo incertidumbre, balance, duplicados, slot exploratorio y máximo 8. | No pedir elección diagnóstica al usuario; puede mostrar 'profundizaremos estas actividades'. | primary_activities = top selected max 8; non_primary_context = remainder. | Conserva WorkMap completo como contexto. |
| 5 | manual_review_required | Contradicciones fuertes, duplicados no resolubles o granularidad confusa | Pedir microconfirmación o revisión interna antes de Runtime. | Pregunta breve orientada a aclarar, no diagnosticar. | runtime_payload se bloquea o sale con flags. | No avanzar con falsa claridad. |

## Significado_Runtime_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 9
Columns/header candidate: Elemento de pantalla, Función visible, Función técnica, Regla de diseño, Qué no debe hacer
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Elemento de pantalla | Función visible | Función técnica | Regla de diseño | Qué no debe hacer |
| 2 | Encabezado de actividad | Muestra 'Actividad X de N' y nombre de la actividad primaria. | Fija activity_id/runtime_context_id. | Debe usar lenguaje del usuario y responsabilidad/área como contexto. | No mostrar PM/MoC/PF/OLC ni scoring interno. |
| 3 | Orientación inicial | Explica que se profundizará en cómo ocurre la actividad. | Reduce fricción y prepara respuestas. | Debe decir que puede haber preguntas adicionales si algo necesita aclaración. | No decir 'te estamos diagnosticando'. |
| 4 | Interacciones base | Muestra las 40 interacciones base como tarjetas/progreso. | Captura evidencia canónica por actividad. | Preguntas compuestas deben tener subcampos persistibles. | No mostrar 40 como cuestionario punitivo. |
| 5 | Causales adaptativas | Aparecen solo si el motor detecta señal/gap/ruta crítica. | Cierra variables canónicas o inconsistencias potenciales. | Debe explicar 'necesito aclarar este punto'. | No abrir por rutina ni curiosidad. |

## Runtime_ContextRules_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 9
Columns/header candidate: Regla, Aplicación, Ejemplo correcto, Ejemplo incorrecto, Estado epistemológico
Flags: balance, payload

| Row | Values |
| ---: | --- |
| 1 | Regla | Aplicación | Ejemplo correcto | Ejemplo incorrecto | Estado epistemológico |
| 2 | Prellenar sin contaminar | Usar contexto para reducir carga, no para cerrar variables. | Parece que esta actividad vive en la responsabilidad X. ¿Es correcto? | Guardar responsabilidad inferida como conformance confirmada. | inferred_from_workmap → confirmed_in_runtime si acepta |
| 3 | Contextualizar preguntas | Incluir rol/responsabilidad/actividad en texto visible. | En tu rol de supervisor, cuando validas pedidos... | ¿Qué gatilla esto? sin contexto. | context_only + captured_user_evidence |
| 4 | No usar áreas como swimlanes | Área puede orientar, no estructura PF. | Contexto de área: Operaciones. | PF con carriles por área. | context_only |
| 5 | No delegar selección diagnóstica | EVE selecciona; usuario confirma hechos. | Vamos a profundizar estas actividades detectadas. | Elige las 8 más importantes para diagnosticar. | derived_internal |

## NonCompetitive_Log_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 14
Columns/header candidate: Campo, Descripción, Valor esperado / ejemplo, Obligatorio
Flags: gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Campo | Descripción | Valor esperado / ejemplo | Obligatorio |
| 2 | selection_run_id | ID del run de selección | SEL-2026-06-14-001 | Sí |
| 3 | selection_mode | Modo aplicado | non_competitive_inclusion | Sí |
| 4 | eligible_activity_count | Conteo de actividades elegibles tras gates | 5 | Sí |
| 5 | raw_activity_count | Conteo original de WorkMap | 6 | Sí |

## QA_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 13
Columns/header candidate: ID, Prueba de aceptación v1.2, Criterio esperado, Falla si
Flags: gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | ID | Prueba de aceptación v1.2 | Criterio esperado | Falla si |
| 2 | QA12-01 | Menos de 8 elegibles | Si hay 1–8 elegibles, selection_mode = non_competitive_inclusion y selected = todas las elegibles. | Se aplica ranking competitivo y se excluye una actividad elegible sin razón de gate. |
| 3 | QA12-02 | Cero elegibles | selection_mode = reentry_required; no hay payload Runtime. | Se inventa actividad o se envía responsabilidad como actividad. |
| 4 | QA12-03 | Más de 8 elegibles | selection_mode = competitive_selection; selected_count <= 8. | Se seleccionan más de 8 o se delega al usuario la elección diagnóstica. |
| 5 | QA12-04 | No llenar cupos | Si hay 5 elegibles, se envían 5, no 8. | Se crean actividades artificiales o se promueven contextos. |

## Selector_Template_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 1
Columns/header candidate: selection_run_id, raw_activity_count, eligible_activity_count, selection_mode_input_optional, activity_id, responsibility_id, area, functional_role, decision_level, authority_scope, activity_label, activity_description, workmap_trace_ok, belongs_to_role, is_work_activity, granularity_status, duplicate_or_alias_status, context_status, user_text_density_0_3, semantic_clarity_0_3
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | selection_run_id | raw_activity_count | eligible_activity_count | selection_mode_input_optional | activity_id | responsibility_id | area | functional_role | decision_level | authority_scope | activity_label | activity_description | workmap_trace_ok | belongs_to_role | is_work_activity | granularity_status | duplicate_or_alias_status | context_status | user_text_density_0_3 | semantic_clarity_0_3 | pm_signal_0_3 | moc_signal_0_3 | pf_signal_0_3 | olc_signal_0_3 | operational_centrality_0_3 | handoff_dependency_signal_0_3 | transformation_object_signal_0_3 | friction_exception_signal_0_3 | coverage_diversity_0_3 | uncertainty_level_0_3 | ambiguity_probe_value_0_3 | vagueness_risk_0_3 | granularity_risk_0_3 | duplicate_alias_risk_0_3 | role_coverage_flag | workmap_coverage_gap | Hard_Gate | Eligibility_Status | Selection_Mode | Architectural_Signal_Potential | Context_Quality_Score | Penalt |

## Implementation_Dicts_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 12
Columns/header candidate: Dictionary, Allowed Values, Applies to, Meaning
Flags: gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Dictionary | Allowed Values | Applies to | Meaning |
| 2 | yes_no_review | yes;no;review | workmap_trace_ok, belongs_to_role, is_work_activity | Minimum gate values. |
| 3 | granularity_status | fit;too_macro;too_micro;context_only;review | granularity_status | Whether the activity is delimitable for Runtime. |
| 4 | duplicate_or_alias_status | unique;alias_review;duplicate_confirmed;consolidated | duplicate_or_alias_status | Alias/duplicate handling before Runtime. |
| 5 | context_status | primary_candidate;context_only | context_status | Whether activity can be primary or only context. |

## Example_Run_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 17
Columns/header candidate: selection_run_id, raw_activity_count, eligible_activity_count, selection_mode_input_optional, activity_id, responsibility_id, area, functional_role, decision_level, authority_scope, activity_label, activity_description, workmap_trace_ok, belongs_to_role, is_work_activity, granularity_status, duplicate_or_alias_status, context_status, user_text_density_0_3, semantic_clarity_0_3
Flags: scoring, gates, balance, modes, metadata, payload

| Row | Values |
| ---: | --- |
| 1 | selection_run_id | raw_activity_count | eligible_activity_count | selection_mode_input_optional | activity_id | responsibility_id | area | functional_role | decision_level | authority_scope | activity_label | activity_description | workmap_trace_ok | belongs_to_role | is_work_activity | granularity_status | duplicate_or_alias_status | context_status | user_text_density_0_3 | semantic_clarity_0_3 | pm_signal_0_3 | moc_signal_0_3 | pf_signal_0_3 | olc_signal_0_3 | operational_centrality_0_3 | handoff_dependency_signal_0_3 | transformation_object_signal_0_3 | friction_exception_signal_0_3 | coverage_diversity_0_3 | uncertainty_level_0_3 | ambiguity_probe_value_0_3 | vagueness_risk_0_3 | granularity_risk_0_3 | duplicate_alias_risk_0_3 | role_coverage_flag | workmap_coverage_gap | Hard_Gate | Eligibility_Status | Selection_Mode | Architectural_Signal_Potential | Context_Quality_Score | Penalt |
| 2 | RUN-U8-001 | 6 | 5 |  | A001 | R-ORD | Operaciones | Coordinador de pedidos | operativo/coordinación | coordina y escala | Validar pedidos antes de despacho | Revisar que el pedido esté correcto antes de enviarlo. | yes | yes | yes | fit | unique | primary_candidate | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 1 | 0 | 0 | 0 | ok | False | pass | eligible | non_competitive_inclusion | 2 | 2 | 0 | 1.9500000000000002 |  | selected |  | selected_for_runtime | 1 | base_40_standard | media | context_ready | ready | PM: posible proceso contenedor, actor/cliente, trigger o resultado a confirmar en Runtime. | MoC: posibles objetos de negocio y relaciones a confirmar; no modelar sin Runtime. | PF: posibles pasos, handoffs, esperas o rutas a reconstruir. | OLC: posibles estados/transiciones a confirmar si el objeto cambia. | Ejemplo v1.2: muestra selección no competitiva cuando <=8 y competiti |
| 3 | RUN-U8-001 | 6 | 5 |  | A002 | R-ORD | Operaciones | Coordinador de pedidos | operativo/coordinación | coordina y escala | Confirmar inventario disponible | Confirmar disponibilidad antes de comprometer entrega. | yes | yes | yes | fit | unique | primary_candidate | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 1 | 1 | 0 | 0 | 0 | ok | False | pass | eligible | non_competitive_inclusion | 1.75 | 2 | 0 | 1.825 |  | selected |  | selected_for_runtime | 2 | base_40_standard | media | context_ready | ready | PM: posible proceso contenedor, actor/cliente, trigger o resultado a confirmar en Runtime. | MoC: posibles objetos de negocio y relaciones a confirmar; no modelar sin Runtime. | PF: posibles pasos, handoffs, esperas o rutas a reconstruir. | OLC: posibles estados/transiciones a confirmar si el objeto cambia. | Ejemplo v1.2: muestra selección no competitiva cuando <=8 y competitiva cuando >8 |
| 4 | RUN-U8-001 | 6 | 5 |  | A003 | R-DEL | Logística | Coordinador de pedidos | operativo/coordinación | coordina y escala | Coordinar entrega con repartidor | Coordinar salida y entrega con el repartidor asignado. | yes | yes | yes | fit | unique | primary_candidate | 2 | 2 | 2 | 1 | 3 | 1 | 3 | 3 | 1 | 2 | 3 | 1 | 1 | 0 | 0 | 0 | ok | False | pass | eligible | non_competitive_inclusion | 1.75 | 2 | 0 | 2.2749999999999995 |  | selected |  | selected_for_runtime | 3 | base_40_standard | alta | context_ready | ready | PM: posible proceso contenedor, actor/cliente, trigger o resultado a confirmar en Runtime. | MoC: posibles objetos de negocio y relaciones a confirmar; no modelar sin Runtime. | PF: posibles pasos, handoffs, esperas o rutas a reconstruir. | OLC: posibles estados/transiciones a confirmar si el objeto cambia. | Ejemplo v1.2: muestra selección no competitiva cuando <=8 y competitiv |
| 5 | RUN-U8-001 | 6 | 5 |  | A004 | R-CS | Atención | Coordinador de pedidos | operativo/coordinación | coordina y escala | Resolver reclamos de clientes | Atender reclamos cuando el cliente reporta problemas. | yes | yes | yes | fit | unique | primary_candidate | 2 | 2 | 3 | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 2 | 2 | 0 | 0 | 0 | ok | False | pass | eligible | non_competitive_inclusion | 2.25 | 2 | 0 | 2.3750000000000004 |  | selected |  | selected_for_runtime | 4 | base_40_plus_uncertainty_probes | exploratoria | context_ready | ready_with_flags | PM: posible proceso contenedor, actor/cliente, trigger o resultado a confirmar en Runtime. | MoC: posibles objetos de negocio y relaciones a confirmar; no modelar sin Runtime. | PF: posibles pasos, handoffs, esperas o rutas a reconstruir. | OLC: posibles estados/transiciones a confirmar si el objeto cambia. | Ejemplo v1.2: muestra selección no competi |

## Dashboard_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 11
Columns/header candidate: Métrica v1.2, Fórmula / Valor, Interpretación
Flags: gates, balance, modes, metadata

| Row | Values |
| ---: | --- |
| 1 | Métrica v1.2 | Fórmula / Valor | Interpretación |
| 2 | Total actividades ejemplo | 16 | Actividades candidatas cargadas en Example_Run_v1_2. |
| 3 | Seleccionadas para Runtime | 11 | Actividades que pasarían a Significado/Runtime. |
| 4 | Reentry required | 0 | Candidatas sin actividades elegibles. |
| 5 | Modo no competitivo | 6 | Filas pertenecientes a runs con <=8 actividades elegibles. |

## Significado_Handoff_v1_2
Rows: 0 | Columns: 0 | Non-empty rows: 21
Columns/header candidate: Payload Field, Source, Required, Purpose in Significado Runtime, Epistemic Status, Notes
Flags: scoring, gates, balance, modes, payload

| Row | Values |
| ---: | --- |
| 1 | Payload Field | Source | Required | Purpose in Significado Runtime | Epistemic Status | Notes |
| 2 | selection_run_id | Selector interno EVE | Sí | Agrupa selección y evidencia por run. | derived_internal | No visible necesariamente. |
| 3 | selection_mode | Selector interno EVE | Sí | Explica si actividades fueron incluidas todas o priorizadas. | derived_internal | No se muestra como scoring técnico al usuario. |
| 4 | primary_activity_list | Selector interno EVE | Sí | Lista de actividades que Significado recorrerá una por una. | derived_internal + captured labels | Máximo 8; si <=8 elegibles, todas. |
| 5 | activity_id | WorkMap | Sí | Identificador de actividad primaria en Runtime. | captured_user_evidence | Nunca mezclar evidence bundles entre activity_id. |

## Keyword Hits
### scoring
- `Version_Control` row 12: Autoridad selector | Este workbook define scoring, gates, balance y payload de selección primaria
- `Authority_Rules` row 7: Significado | Señal auxiliar de transición, anclaje o confirmación contextual. | No debe convertir al usuario en selector diagnóstico. | Puede aportar señales blandas; no sustituye scoring EVE.
- `Methodology_Overview` row 5: 3 | Scoring estructural | Medir potencial para revelar PM, MoC, PF, OLC, fricción, variedad, capacidad, handoff y compensación. | Se prioriza capacidad de producir evidencia diagramable, no importancia subjetiva del usuario. | SelectorScore
- `Input_Schema` row 9: activity_description | WorkMap | string | Deseable | Texto semántico para scoring. | Si es débil, B0 puede reconstruir, pero no inventar.
- `Scoring_Weights` row 1: Bloque de pesos | Criterio | Peso | Descripción
- `Selector_Template` row 1: activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias | semantic_clarity_0_5 | process_context_0_5 | customer_receiver_hint_0_5 | trigger_hint_0_5 | transformation_object_0_5 | state_change_0_5 | handoff_dependency_0_5 | wait_timer_blocking_0_5 | variability_frequency_0_5 | capacity_pressure_0_5 | workaround_rework_0_5 | info_gap_rule_informal_0_5 | human_compensation_0_5 | 
- `Coverage_Balance` row 6: B5 | No seleccionar solo por dolor subjetivo | La prioridad emocional de Significado no supera gates ni score estructural. | Evita sesgo de disponibilidad.
- `Selection_Flow` row 6: 5 | if gate == BLOQUEADA: store as non_primary_context with reason; do not score as selectable
- `Selection_Flow` row 9: 8 | selector_score = 0.45*MMABP + 0.25*Friction + 0.15*Coverage + 0.10*Evidence + boost - 0.15*burden
- `Selection_Flow` row 10: 9 | sort eligible candidates by selector_score descending
- `UX_Contract` row 6: Actividad primaria seleccionada | Estado: lista para Runtime 40+20. | No mostrar scoring completo técnico si genera ruido. | Mostrar razón resumida y transparente.
- `Runtime_Handoff` row 9: selection_score | number | Sí | Score final del selector. | Auditoría

### gates
- `Version_Control` row 12: Autoridad selector | Este workbook define scoring, gates, balance y payload de selección primaria
- `Version_Control` row 17: EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | Fuente canónica de nodos, rutas críticas, variables y mapeo MMABP
- `Version_Control` row 19: Catalogo_Runtime_40_20_v1_1_VALIDADO.xlsx | Define 40 base, 20 causales, gates, payload y QA del Runtime
- `Version_Control` row 35: Regla de selección v1.2 | 0 elegibles = reentry; 1–8 elegibles = non_competitive_inclusion; >8 elegibles = competitive_selection.
- `Methodology_Overview` row 4: 2 | Gates de elegibilidad | Bloquear o enviar a revisión actividades sin trazabilidad, no accionables, duplicadas o con ambigüedad excesiva. | La selección empieza descartando falsos candidatos, no rankeando todo. | Eligible/Review/Blocked
- `Input_Schema` row 1: Campo | Origen | Tipo | Obligatorio | Uso | Regla
- `Input_Schema` row 5: responsibility_id | WorkMap | string | Sí | Relación responsabilidad → actividad. | Gate duro si falta.
- `Input_Schema` row 7: activity_id | WorkMap | string | Sí | Identificador de actividad candidata. | Gate duro si falta.
- `Input_Schema` row 10: savedWithWarnings | WorkMap | boolean | Sí | Señal de calidad del WorkMap. | Penaliza evidencia, puede abrir revisión.
- `Eligibility_Gates` row 1: Gate | Nombre | Condición de aprobación | Falla si... | Acción | Impacto
- `Eligibility_Gates` row 2: G1 | Trazabilidad WorkMap | activity_id y responsibility_id existen. | No hay ID o no hay relación actividad-responsabilidad. | Bloquear hasta corregir WorkMap. | Evita actividad huérfana.
- `Scoring_Weights` row 1: Bloque de pesos | Criterio | Peso | Descripción

### balance
- `Version_Control` row 3: Versión | v1.2 operacional — conserva v1.0/v1.1 y agrega política <=8 actividades, Context Bundle Estado A/WorkMap/Significado y confirmación de Significado como pantalla de ejecución Runtime 40/20
- `Version_Control` row 5: Tipo de artefacto | Workbook implementable para selección de máximo 8 actividades primarias desde WorkMap
- `Version_Control` row 7: Salida principal | Lista priorizada de hasta 8 actividades primarias para ejecutar Runtime 40+20
- `Version_Control` row 8: No debe hacer | No diagnostica, no monetiza, no reemplaza Runtime 40+20, no produce diagramas ni Capa 2
- `Version_Control` row 10: Autoridad canónica | Catálogo Madre Capa 1 v1.0 conserva nodos/códigos/corpus documental
- `Version_Control` row 12: Autoridad selector | Este workbook define scoring, gates, balance y payload de selección primaria
- `Version_Control` row 13: Límite UX posterior | Máximo 8 actividades primarias; cada primaria puede abrir 40 base + hasta 20 causales
- `Version_Control` row 17: EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | Fuente canónica de nodos, rutas críticas, variables y mapeo MMABP
- `Version_Control` row 18: EVE_Catalogo_Madre_Capa1_v1_0_Readme.docx | Confirma 164 nodos, hojas, rutas críticas y regla de uso
- `Version_Control` row 22: Diseño estructural Plataforma EVE — Capa 1.0 para Producción Paralela | Define consumidor estructural de evidencias y registros MMABP
- `Version_Control` row 23: Diseño estructural Capa 2.0/2.5 EVE con AHE | Define que Capa 2 consume expediente conformado; no debe recibir diagnóstico crudo
- `Version_Control` row 27: Salida v1.1 | Top 8 candidatas para Runtime profundo + backlog/contexto no primario + razones auditables.

### modes
- `Version_Control` row 21: Fundamentals of Business Architecture Modeling | Fuente primaria MMABP: PM, MoC, PF, OLC, conformance y consistencia
- `Version_Control` row 35: Regla de selección v1.2 | 0 elegibles = reentry; 1–8 elegibles = non_competitive_inclusion; >8 elegibles = competitive_selection.
- `Scoring_Weights` row 53: v1.2 agregado | Selection_Mode | derivado | 0 elegibles = reentry_required; 1–8 = non_competitive_inclusion; >8 = competitive_selection.
- `Selector_Template` row 1: activity_id | responsibility_id | area | functional_role | activity_label | activity_description | workmap_trace_ok | is_work_activity | granularity_status | duplicate_or_alias | semantic_clarity_0_5 | process_context_0_5 | customer_receiver_hint_0_5 | trigger_hint_0_5 | transformation_object_0_5 | state_change_0_5 | handoff_dependency_0_5 | wait_timer_blocking_0_5 | variability_frequency_0_5 | capacity_pressure_0_5 | workaround_rework_0_5 | info_gap_rule_informal_0_5 | human_compensation_0_5 | 
- `UX_Contract` row 2: WorkMap completo | Todas las actividades como contexto. | No marcar las no primarias como inútiles. | Las no seleccionadas siguen vivas para contexto/reentry.
- `UX_Contract` row 7: Actividad no primaria | Estado: contexto/backlog/soporte/alias/bloqueada/revisión. | No eliminarla. | Puede promoverse en otro run o por reentry.
- `Runtime_Handoff` row 17: reentry_policy | enum | Sí | Ninguna, B0, semantic_resolution, manual_review. | Runtime/Gobierno
- `NonPrimary_Context` row 2: Contexto / backlog | Actividad elegible pero fuera del top 8 o no necesaria por balance. | activityId, responsibilityId, texto, score, razón. | Otro run, nuevo rol, reentry, cambio de prioridad estructural. | Borrado de realidad.
- `MMABP_Rationale` row 12: evidence_quality_0_5 | Conformance | Prioriza actividades donde se puede modelar sin inventar.
- `QA_Checklist` row 19: QA-17 v1.1 | Reentry B0/B0.5 | Actividad ambigua prometedora puede ir a reconstrucción, no descarte automático.
- `QA_Checklist` row 24: QA-v1.2-01 | <=8 elegibles | Todas las elegibles seleccionadas; selection_mode = non_competitive_inclusion. | No excluir actividad elegible por ranking relativo.
- `QA_Checklist` row 25: QA-v1.2-02 | 0 elegibles | No Runtime; reentry a WorkMap. | No inventar actividades ni promover responsabilidades genéricas.

### metadata
- `Version_Control` row 3: Versión | v1.2 operacional — conserva v1.0/v1.1 y agrega política <=8 actividades, Context Bundle Estado A/WorkMap/Significado y confirmación de Significado como pantalla de ejecución Runtime 40/20
- `Version_Control` row 4: Fecha | 2026-06-14
- `Version_Control` row 31: Cambio v1.2 — menos de 8 actividades | Si actividades elegibles <=8, no se aplica ranking competitivo: se seleccionan todas las elegibles, con control de calidad, cobertura y duplicados.
- `Version_Control` row 32: Cambio v1.2 — más información | Más información no es siempre mejor: solo es útil si aumenta trazabilidad, confirmación, contextualización y valor para conformance/consistency futura.
- `Version_Control` row 33: Cambio v1.2 — pantalla Significado | Significado de tu Trabajo ya ejecuta Runtime 40/20 por actividad primaria seleccionada; no es selector visible ni diagnóstico.
- `Version_Control` row 34: Cambio v1.2 — contexto previo | Estado A, WorkMap y Significado forman un PreRuntime Context Bundle que contextualiza y prellena sin contaminar evidencia.
- `Version_Control` row 35: Regla de selección v1.2 | 0 elegibles = reentry; 1–8 elegibles = non_competitive_inclusion; >8 elegibles = competitive_selection.
- `Version_Control` row 36: Regla epistemológica v1.2 | inferred_from_workmap puede prellenar o sugerir, pero no cuenta como captured_user_evidence sin confirmación.
- `Version_Control` row 37: Regla de intervención v1.2 | No se elimina ni resume contenido previo; se agregan hojas *_v1_2, columnas, filas y plantillas operativas.
- `Version_Control` row 38: Estado v1.2 | Listo para revisión/implementación como política de selección + contexto previo + handoff hacia pantalla Significado Runtime.
- `Scoring_Weights` row 53: v1.2 agregado | Selection_Mode | derivado | 0 elegibles = reentry_required; 1–8 = non_competitive_inclusion; >8 = competitive_selection.
- `Scoring_Weights` row 54: v1.2 agregado | Under8 policy | seleccionar todas elegibles | El máximo 8 es límite de carga, no objetivo a llenar.

### payload
- `Version_Control` row 3: Versión | v1.2 operacional — conserva v1.0/v1.1 y agrega política <=8 actividades, Context Bundle Estado A/WorkMap/Significado y confirmación de Significado como pantalla de ejecución Runtime 40/20
- `Version_Control` row 5: Tipo de artefacto | Workbook implementable para selección de máximo 8 actividades primarias desde WorkMap
- `Version_Control` row 6: Unidad evaluada | Actividad de trabajo del WorkMap, asociada a rol funcional y responsabilidad
- `Version_Control` row 12: Autoridad selector | Este workbook define scoring, gates, balance y payload de selección primaria
- `Version_Control` row 15: Regla epistemológica v1.1 | Unknown no equivale a cero. La ausencia de un elemento explícito en WorkMap no prueba inexistencia; solo activa prudencia, microconfirmación o revisión.
- `Version_Control` row 19: Catalogo_Runtime_40_20_v1_1_VALIDADO.xlsx | Define 40 base, 20 causales, gates, payload y QA del Runtime
- `Version_Control` row 34: Cambio v1.2 — contexto previo | Estado A, WorkMap y Significado forman un PreRuntime Context Bundle que contextualiza y prellena sin contaminar evidencia.
- `Version_Control` row 36: Regla epistemológica v1.2 | inferred_from_workmap puede prellenar o sugerir, pero no cuenta como captured_user_evidence sin confirmación.
- `Authority_Rules` row 4: Catálogo Runtime v1.1 XLSX | Fuente implementable para interfaz, motor y QA del Runtime por actividad. | No selecciona actividades primarias desde WorkMap. | Se ejecuta solo sobre actividades primarias ya seleccionadas.
- `Authority_Rules` row 5: PrimaryActivitySelectionPolicy XLSX | Fuente implementable para elegir hasta 8 actividades primarias. | No diagnostica, no reemplaza Runtime, no reescribe WorkMap. | Gobierna pantalla previa al Runtime.
- `Authority_Rules` row 6: WorkMap | Fuente primaria de inventario de áreas, responsabilidades y actividades. | No decide por sí solo qué es estructuralmente más útil. | Pantalla de origen y contexto total.
- `Methodology_Overview` row 2: 0 | Ingesta WorkMap | Recibir actividades con área, responsabilidad, activityId, responsibilityId, texto literal y advertencias. | No inferir estructura dura desde texto débil sin confirmación. | ActivityCandidateList
