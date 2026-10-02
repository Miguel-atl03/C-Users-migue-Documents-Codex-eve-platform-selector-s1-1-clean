# Mapa real de datos de una sesion EVE por `sessionId`

Fecha de inspeccion: 2026-05-12  
Repositorio inspeccionado: `eve-platform`  
Objetivo: documentar el modelo real existente, sin redisenar ni proponer cambios.

## A. Vista general

La fuente persistida principal de una sesion EVE es Supabase. El identificador logico `sessionId` que usa el frontend corresponde al campo `sesiones_llenado.id`; en base de datos las tablas hijas usan `sesion_id`.

Hay dos capas de modelo coexistiendo:

1. Modelo base/historico en `sql/schema.sql`: `sesiones_llenado`, `actividades`, `respuestas_relatos`, `respuestas_estructuradas`, `respuestas_patron`, `mapa_coordinacion_s2`, `micro_momentos_s4`, `eventos_algedonicos`, `tensiones_activas`, metricas y catalogos.
2. Modelo arquitectura V01 en `sql/architecture_v01.sql`: `activity_structural_scores`, `activity_canonical_profiles`, `triangulation_results`, `closure_results`, `support_activity_requests`.

La fuente de verdad efectivamente usada por la app actual para reconstruir una sesion es mas pequena que el esquema disponible:

- `sesiones_llenado`: metadata y avance de sesion.
- `actividades`: actividades capturadas por usuario.
- `activity_structural_scores`: ranking, seleccion principal o pool soporte.
- `respuestas_estructuradas`: respuestas del cuestionario FULL V03, micro-aclaracion y filas de inferencia de mision.
- `metricas_por_capa`: entrada a capas.
- `respuestas_relatos`: existe en esquema y ruta de intake, pero el componente actual envia relatos vacios.

La consistencia, el diagnostico, el soporte seleccionado y el cierre global se calculan en runtime. No se persisten actualmente en `closure_results`, `support_activity_requests`, `triangulation_results` ni `activity_canonical_profiles` desde las rutas inspeccionadas.

## Flujo general real

1. `POST /api/session/bootstrap` crea o reutiliza usuario demo y crea una fila en `sesiones_llenado`.
2. `TripleIntake` captura actividades y `POST /api/intake/triple` reemplaza las actividades previas de la sesion, guarda nuevas filas en `actividades`, intenta guardar relatos si llegaron, y mueve la sesion a `capa_2_estructural`.
3. `POST /api/rank-activities` lee `actividades`, normaliza texto con `activity-normalizer.ts`, calcula ranking con `activity-ranker.ts` y persiste `activity_structural_scores`.
4. `QuestionnaireRunner` responde el catalogo `src/rules/question-catalog-v03.json`; `POST /api/questionnaire/submit` guarda filas `FULL_V03:*` en `respuestas_estructuradas` y agrega filas `MISSION:*` inferidas por `mission-inference.ts`.
5. `POST /api/diagnostics/session` lee `actividades` y solo respuestas `FULL_V03:*`, reconstruye diagnostico con `diagnostic-engine.ts`, consistencia con `consistency-checker.ts`, seleccion soporte con `support-activity-selector.ts` y salida final con `session-closure-engine.ts`. No guarda ese resultado.
6. Si hay contradiccion critica, `page.tsx` pide micro-aclaracion y la guarda como `FULL_V03:CONSISTENCY_CLARIFICATION` en `respuestas_estructuradas`. Luego recalcula cierre.
7. La exportacion `GET /api/export/activity-collection-xlsx` usa `session-export-consolidator.ts` para volver a consolidar desde tablas persistidas y motores runtime.

## B. Mapa de entidades

### `sesiones_llenado`

Fuente: `sql/schema.sql`, usada por `src/app/api/session/bootstrap/route.ts`, `restore`, `intake/triple`, `questionnaire/submit`, `diagnostics/session` y `session-export-consolidator.ts`.

Proposito: raiz persistida de la sesion. `id` es el `sessionId` usado en payloads.

Campos importantes:

- `id`: `uuid`, clave de sesion.
- `usuario_id`: relacion a `usuarios`.
- `version_herramienta_id`: relacion a `versiones_herramienta`.
- `estado_actual`: enum `estado_sesion`.
- `ultima_actividad_id`: FK opcional a `actividades`.
- `porcentaje_avance`: avance UI/persistido.
- `created_at`, `updated_at`: timestamps.

Naturaleza: metadato de sesion y estado.

Ambiguedad: `src/lib/types.ts` define `EveFlowState` con estados operativos como `intake_main_activities`, `questionnaire_main`, `closure_check`, etc. Esos estados son estado UI en memoria de `page.tsx`; no son valores de `estado_sesion` persistidos.

### `actividades`

Fuente: `sql/schema.sql`, escrita por `POST /api/intake/triple`, leida por ranking, restore, diagnostics y export.

Proposito: actividades reales capturadas. Cada fila depende de `sesion_id`.

Campos importantes:

- `id`: `uuid`, ID secundario central para cuestionario, ranking y cierre por actividad.
- `sesion_id`: FK a `sesiones_llenado.id`.
- `ancla_narrativa`: texto de la actividad.
- `verbo_identificado`, `objeto_negocio`: columnas existentes, no pobladas por las rutas actuales.
- `es_critica`, `interconexion_score`: vienen del payload de `TripleIntake`.
- `impacto_score`: calculado en `intake/triple` como `4` si `critical`, si no `2`.
- `variabilidad_score`: calculado en `intake/triple` como `4` si `origin === "ia_inferida"`, si no `2`.
- `origen`: `usuario_redactada` o `ia_inferida`.
- `aceptada`, `created_at`.

Naturaleza: mezcla de captura de usuario (`ancla_narrativa`, `origen`, `aceptada`, `es_critica`, `interconexion_score`) y metadatos/calculos simples (`impacto_score`, `variabilidad_score`).

### `respuestas_relatos`

Fuente: `sql/schema.sql`, catalogo seed en `sql/seed.sql` y `sql/update_relatos_v02.sql`, escrita por `POST /api/intake/triple` si `payload.relatos` trae respuestas.

Proposito: respuestas a dos relatos iniciales: `ultimo_incendio` y `lo_que_no_deberia_pasar`.

Campos importantes:

- `sesion_id`: FK a sesion.
- `tipo_relato`: `ultimo_incendio` o `lo_que_no_deberia_pasar`.
- `numero_pregunta`: 1 a 7.
- `respuesta_texto`.
- `respuesta_seleccionada`.
- `actividad_id_seleccionada`: FK opcional a `actividades`, usada en pregunta 1.
- `version_herramienta_id`.
- `unique (sesion_id, tipo_relato, numero_pregunta)`.

Naturaleza: captura de usuario. En el componente actual `TripleIntake` se envia `relatos: { ultimo_incendio: [], lo_que_no_deberia_pasar: [] }`, asi que puede no poblarse aunque el esquema exista.

### `activity_structural_scores`

Fuente: `sql/architecture_v01.sql`, escrita por `POST /api/rank-activities`.

Proposito: resultado persistido del ranking estructural de actividades.

Campos importantes:

- `sesion_id`: FK a sesion.
- `actividad_id`: FK a actividad, `unique`.
- `total_score`, `max_score`, `coverage_ratio`.
- `dimension_scores_json`: puntajes por `object`, `dependency`, `coordination`, `causality`, `vsm_regulation`, `ahe_tension`, `recursion`.
- `detected_signals_json`: senales detectadas por dimension.
- `selection_recommendation`: `primary_candidate` o `support_pool`.
- `rationale_json`.

Naturaleza: inferido por sistema. Determina actividades principales y pool soporte. El umbral viene de `src/rules/selection-rules.json`.

### `respuestas_estructuradas`

Fuente: `sql/schema.sql`, escrita por `POST /api/structural/confirm` y `POST /api/questionnaire/submit`.

Proposito: tabla EAV de respuestas por actividad. Es la estructura mas importante para cuestionario, micro-aclaracion e inferencias de mision.

Campos importantes:

- `sesion_id`: FK a sesion.
- `actividad_id`: FK a actividad; puede ser null en esquema, pero las rutas actuales lo usan para cuestionario por actividad.
- `pregunta_id`: namespace real del dato. Ejemplos:
  - `FULL_V03:1.1`, `FULL_V03:2.6`, etc.
  - `FULL_V03:CONSISTENCY_CLARIFICATION`.
  - `MISSION:mission_final`.
  - `MISSION:mission_confidence`.
  - `MISSION:mission_evidence`.
  - `contexto_confirmado`, `nivel_autonomia`, `nivel_dependencia`, `impacto_calidad` desde ruta legacy `structural/confirm`.
- `valor_seleccionado`: valor select o dato corto.
- `texto_libre`: texto libre o JSON serializado en `MISSION:mission_evidence`.
- `unique (sesion_id, actividad_id, pregunta_id)`.

Naturaleza:

- `FULL_V03:*`: capturado por usuario, excepto `FULL_V03:1.1` que el runner autocompleta con el texto de la actividad.
- `FULL_V03:CONSISTENCY_CLARIFICATION`: aclaracion de usuario.
- `MISSION:*`: inferido por sistema.
- `contexto_confirmado` y similares: captura legacy/estructural si se usa la ruta.

### `metricas_por_capa`

Fuente: `sql/schema.sql`, escrita por bootstrap, intake, questionnaire y structural confirm.

Proposito: trazabilidad de entrada/salida por capa.

Campos: `sesion_id`, `capa`, `timestamp_entrada`, `timestamp_salida`, `tiempo_total_segundos`, `completada`.

Naturaleza: metadato/trazabilidad.

Ambiguedad: en `questionnaire/submit` se intenta upsert con `capa: "cuestionario_full_v03"`, pero el enum `capa_metricas` en `schema.sql` no declara ese valor. En sesiones reales inspeccionadas solo aparecieron `capa_1_triple` y `capa_2_estructural` para el caso usado.

### `activity_canonical_profiles`

Fuente: `sql/architecture_v01.sql`, tipo relacionado en `src/domain/activity.ts`.

Proposito previsto: perfil canonico JSON por actividad (`profile_json`) con version de extraccion.

Relacion: `sesion_id`, `actividad_id`.

Naturaleza prevista: inferido por sistema.

Estado real: no encontre rutas o servicios que escriban o lean esta tabla.

### `triangulation_results`

Fuente: `sql/architecture_v01.sql`.

Proposito previsto: resultados de reglas de triangulacion por actividad o sesion, con `rule_code`, `confidence`, `result_json`, `source_questions_json`.

Relacion: `sesion_id`, `actividad_id` opcional.

Naturaleza prevista: inferido por sistema.

Estado real: no encontre rutas o servicios que escriban o lean esta tabla. Las reglas existen en `src/rules/triangulation-rules.json`, pero no aparecen conectadas al flujo actual.

### `closure_results`

Fuente: `sql/architecture_v01.sql`, tipos en `src/domain/closure.ts`.

Proposito previsto: persistir cierres por actividad o rol.

Campos: `sesion_id`, `actividad_id`, `closure_scope`, `closure_status`, `closure_confidence`, `result_json`, `engine_version`.

Naturaleza prevista: metadato de cierre/inferido.

Estado real: no se escribe desde `diagnostics/session`. El cierre actual se calcula en runtime en `diagnostic-engine.ts` y `session-closure-engine.ts`.

### `support_activity_requests`

Fuente: `sql/architecture_v01.sql`.

Proposito previsto: persistir necesidad de actividad soporte.

Campos: `sesion_id`, `required`, `activity_type_needed`, `reason`, `status`, `source_closure_result_id`.

Naturaleza prevista: metadato de cierre/soporte.

Estado real: no se escribe desde `support-activity-selector.ts`; las selecciones de soporte viven en estado React (`supportTrace`) y en respuestas ya guardadas si se contesta una actividad soporte.

### Tablas historicas o laterales no integradas al flujo actual inspeccionado

- `respuestas_patron`: respuestas globales por pregunta con excepciones JSON; no usada por rutas actuales.
- `mapa_coordinacion_s2`: seleccion de actividades y patron de coordinacion; no usada por rutas actuales.
- `micro_momentos_s4`: pausas S4; no usada por rutas actuales. No es la micro-aclaracion actual.
- `eventos_algedonicos`: captura de eventos algedonicos; no usada por rutas actuales.
- `tensiones_activas` y `tensiones_resueltas_historial`: tensiones persistibles; no usadas por consistencia actual.
- `system_logs`, `error_alerts`, `evaluaciones_en_progreso`, `metricas_por_pregunta`, `metricas_abandono`, `sesiones_rescate`: soporte operacional.

## C. Cuestionario y captura

La fuente canonica del cuestionario actual es `src/rules/question-catalog-v03.json`, servida por `GET /api/questionnaire/catalog` y tambien importada directamente por `QuestionnaireRunner.tsx`.

Estructura:

- `version`: `FULL_V03`.
- `blocks`: 5 bloques.
- Cada pregunta tiene `code`, `text`, `fieldType`, `required`, `architecturalPurpose`, `options`.
- Tipos reales de campo: `guided_short_text`, `number`, `select`, `multi_select` en tipos, aunque el UI actual maneja texto/numero como textarea y select como dropdown.

Bloques:

- `block_1` Contexto Organizacional.
- `block_2` Ontologia y Causalidad.
- `block_3` Intencionalidad y Flujo.
- `block_4` Cibernetica y Friccion Humana.
- `block_5` Trascendencia y Resolucion de Problemas.

Preguntas principales y soporte:

- No hay catalogo separado para cuestionario soporte.
- El mismo `QuestionnaireRunner` se usa para actividades principales y soporte.
- La diferencia es el conjunto de `selectedActivities`: principales vienen de `activity_structural_scores.selection_recommendation = primary_candidate`; soporte viene del `support_activity_selected` calculado en runtime.
- `draftScope` separa borradores locales (`main` vs `support-{iteracion}-{actividadId}`), pero eso vive en `localStorage`, no en Supabase.

Persistencia de respuestas:

- `POST /api/questionnaire/submit` guarda cada respuesta como `pregunta_id = FULL_V03:${questionCode}`.
- La respuesta select va a `valor_seleccionado`.
- Texto/numero va a `texto_libre`.
- `MISSION_USER_OVERRIDE` no se guarda como tal; se consume para construir filas `MISSION:*`.

Mezcla evidencia/interpretacion:

- `respuestas_estructuradas` mezcla captura directa (`FULL_V03:*`), aclaracion (`FULL_V03:CONSISTENCY_CLARIFICATION`) e inferencia (`MISSION:*`).
- `MISSION:mission_evidence.texto_libre` guarda JSON serializado con scores, flags y evidencia. Esto es inferencia persistida en una tabla de respuestas.

## D. Cierre y consistencia

### Consistencia

Fuente principal: `src/services/consistency-checker.ts`.

Entrada:

- `activityText`.
- `answersByCode`: mapa de respuestas `FULL_V03:*` por codigo sin prefijo.
- `missionFinal`.

Alertas calculadas:

- `creation_mission_but_intermediate_destination`.
- `final_delivery_but_archived_result`.
- `operational_mission_but_coordination_or_review_role`.
- `execution_verb_but_support_structure`.
- `intermediate_flow_but_final_function`.
- `multiple_strong_crossed_signals`.

Estados reales devueltos:

- `consistency_check_status`: `passed`, `warning`, `failed`.
- `consistency_alert_level`: `low`, `medium`, `high`, `critical`.
- `closure_quality_status`: `solid`, `sufficient_with_alerts`, `partial_requires_clarification`, `blocked_by_critical_contradiction`.
- `activity_closure_state`: `closed_solid`, `closed_with_consistency_alerts`, `partial_requires_clarification`, `blocked_by_critical_contradiction`.
- `clarification_required`, `clarification_prompt`, `clarification_reason`, `clarification_response`, `consistency_recheck_status`.

Persistencia:

- Alertas, gaps y contradicciones no se guardan en tabla propia.
- La unica pieza persistida del ciclo de aclaracion es `FULL_V03:CONSISTENCY_CLARIFICATION` en `respuestas_estructuradas`.

### Cierre por actividad

Fuente: `computeClosure` dentro de `src/services/diagnostic-engine.ts`.

Usa:

- Cobertura por dimensiones definidas en el propio archivo:
  - `pm`: `1.1`, `3.1`.
  - `moc`: `2.1`, `2.2`.
  - `pf`: `3.1`, `3.3`, `3.4`.
  - `olc`: `2.3`, `2.5`, `2.6`.
  - `vsm`: `1.3`, `1.5`, `1.6`.
  - `ahe`: `5.8`, `5.9`, `5.10`.
- Findings del diagnostico.
- Resultado de consistencia.

Estados de cierre de dominio:

- `closure.status`: `closed`, `partial`, `gap_requires_support`.
- `closure.closure_quality_status`: los cuatro estados de calidad.
- `closure.activity_closure_state`: los cuatro estados requeridos por actividad.

Persistencia: calculado en runtime, no insertado en `closure_results`.

### Soporte

Fuente: `src/services/support-activity-selector.ts`.

Entrada:

- Diagnosticos principales.
- Candidatos soporte desde `activity_structural_scores` con `selection_recommendation = support_pool`.
- IDs soporte ya respondidos.

Salida:

- `SupportActivitySelection` con `primary_activity_id`, `open_gaps`, `support_activity_selected`, scores marginales/redundancia, `support_activity_iteration_number`, candidatos evaluados.

Persistencia:

- No se persiste `SupportActivitySelection`.
- Si el usuario responde la actividad soporte, sus respuestas quedan indistinguibles en `respuestas_estructuradas` por `actividad_id`; el rol soporte se reconstruye comparando score + actividad respondida.

### Cierre global

Fuente: `src/services/session-closure-engine.ts`.

Salida:

- `SessionFinalOutput`.
- `session_status`: `session_in_progress`, `session_closure_check`, `session_completed_solid`, `session_completed_with_alerts`, `session_completed_partial`, `session_blocked`.
- `session_closure_quality`: `solid`, `with_alerts`, `partial`, `blocked`.
- `main_activities_used`, `support_activities_used`, `total_support_iterations`.
- `consistency_alerts_global`, `unresolved_gaps_global`.
- `key_dependencies`, `key_tensions`, `key_sacrifices`.
- `vsm_signals_summary`, `mmabp_closure_summary`, `ahe_summary`.
- `closure_trace`.

Persistencia: salida final estructurada no se guarda. Se reconstruye en diagnostics/export.

## Tabla resumida de campos logicos

| campo logico | origen real | archivo/tabla fuente | tipo de dato | etapa del flujo | naturaleza (capturado/inferido/metadato) |
|---|---|---|---|---|---|
| `sessionId` | `sesiones_llenado.id` | `sql/schema.sql`, `session/bootstrap/route.ts` | `uuid` | creacion de sesion | metadato |
| estado persistido de sesion | `sesiones_llenado.estado_actual` | `sql/schema.sql` | enum `estado_sesion` | todo el flujo | metadato |
| avance | `sesiones_llenado.porcentaje_avance` | `sql/schema.sql` | integer 0-100 | todo el flujo | metadato |
| estados operativos UI | `flowState` | `src/app/page.tsx`, `src/lib/types.ts` | union TS | frontend runtime | metadato no persistido |
| actividad capturada | `actividades.ancla_narrativa` | `sql/schema.sql`, `intake/triple/route.ts` | text | captura inicial | capturado |
| origen de actividad | `actividades.origen` | `sql/schema.sql` | enum | captura inicial | capturado/metadato |
| aceptacion de actividad | `actividades.aceptada` | `sql/schema.sql` | boolean | captura inicial | capturado/metadato |
| criticidad inicial | `actividades.es_critica` | `TripleIntake.tsx`, `intake/triple/route.ts` | boolean | captura inicial | capturado |
| score interconexion inicial | `actividades.interconexion_score` | `TripleIntake.tsx`, `intake/triple/route.ts` | integer | captura inicial | capturado/metadato |
| impacto score | `actividades.impacto_score` | `intake/triple/route.ts` | integer | captura inicial | inferido simple |
| variabilidad score | `actividades.variabilidad_score` | `intake/triple/route.ts` | integer | captura inicial | inferido simple |
| actividad principal | `activity_structural_scores.selection_recommendation = primary_candidate` | `rank-activities/route.ts` | text enum/check | seleccion interna | inferido |
| actividad soporte potencial | `activity_structural_scores.selection_recommendation = support_pool` | `rank-activities/route.ts` | text enum/check | seleccion interna | inferido |
| score ranking | `activity_structural_scores.total_score` | `activity-ranker.ts` | integer | seleccion interna | inferido |
| cobertura ranking | `activity_structural_scores.coverage_ratio` | `activity-ranker.ts` | numeric | seleccion interna | inferido |
| senales ranking | `activity_structural_scores.detected_signals_json` | `activity-normalizer.ts`, `activity-ranker.ts` | jsonb | seleccion interna | inferido |
| respuestas relato incendio | `respuestas_relatos` | `sql/seed.sql`, `intake/triple/route.ts` | rows/text | captura inicial | capturado |
| respuestas relato no deberia | `respuestas_relatos` | `sql/seed.sql`, `intake/triple/route.ts` | rows/text | captura inicial | capturado |
| pregunta FULL V03 | `question-catalog-v03.json` | `src/rules/question-catalog-v03.json` | JSON | cuestionario | metadato/catalogo |
| respuesta select FULL V03 | `respuestas_estructuradas.valor_seleccionado` con `FULL_V03:*` | `questionnaire/submit/route.ts` | text | cuestionario principal/soporte | capturado |
| respuesta texto FULL V03 | `respuestas_estructuradas.texto_libre` con `FULL_V03:*` | `questionnaire/submit/route.ts` | text | cuestionario principal/soporte | capturado |
| actividad redactada como pregunta `1.1` | `FULL_V03:1.1` | `QuestionnaireRunner.tsx` | text | cuestionario | capturado originalmente / replicado por UI |
| override mision usuario | `MISSION_USER_OVERRIDE` payload, no fila propia | `QuestionnaireRunner.tsx`, `questionnaire/submit/route.ts` | payload transient | revision mision | capturado no persistido directo |
| mision final | `MISSION:mission_final` | `mission-inference.ts`, `questionnaire/submit/route.ts` | text | post cuestionario | inferido |
| confianza mision | `MISSION:mission_confidence` | `mission-inference.ts`, `questionnaire/submit/route.ts` | text | post cuestionario | inferido |
| evidencia mision | `MISSION:mission_evidence.texto_libre` | `mission-inference.ts`, `questionnaire/submit/route.ts` | JSON string | post cuestionario | inferido |
| alertas consistencia | `ConsistencyCheckResult.consistency_alerts` | `consistency-checker.ts` | array runtime | cierre | inferido no persistido |
| nivel alerta consistencia | `ConsistencyCheckResult.consistency_alert_level` | `consistency-checker.ts` | union TS | cierre | inferido no persistido |
| micro-aclaracion | `FULL_V03:CONSISTENCY_CLARIFICATION` | `page.tsx`, `questionnaire/submit/route.ts` | text | micro-aclaracion | aclaracion |
| cierre actividad | `ActivityDiagnostic.closure` | `diagnostic-engine.ts` | object runtime | cierre | inferido no persistido |
| estado cierre actividad | `activity_closure_state` | `diagnostic-engine.ts`, `diagnostics.ts` | union TS | cierre | inferido no persistido |
| cierre sesion | `SessionFinalOutput.session_status` | `session-closure-engine.ts` | union TS | salida final | inferido no persistido |
| calidad cierre sesion | `SessionFinalOutput.session_closure_quality` | `session-closure-engine.ts` | union TS | salida final | inferido no persistido |
| seleccion soporte interna | `SupportActivitySelection` | `support-activity-selector.ts` | object runtime | soporte | inferido no persistido |
| iteracion soporte | `support_activity_iteration_number` | `support-activity-selector.ts` | number runtime | soporte | metadato no persistido |
| trazabilidad capa | `metricas_por_capa` | `schema.sql`, rutas API | row | todo el flujo | metadato |
| salida final exportable | `SessionExportPayload.finalOutput` | `session-export-consolidator.ts` | object runtime | export/salida | inferido no persistido |

## Mapa de flujo por etapa

### Captura inicial

Se crea `sesiones_llenado`. `TripleIntake` toma actividades redactadas y las manda a `POST /api/intake/triple`. Esa ruta borra `respuestas_relatos` y `actividades` previas de la sesion, inserta nuevas actividades, guarda relatos si existen y actualiza `sesiones_llenado.estado_actual = capa_2_estructural`.

Riesgo: al re-guardar intake se borran actividades previas; por cascade tambien puede borrar respuestas estructuradas si las actividades tenian respuestas.

### Seleccion de principales

`POST /api/rank-activities` lee `actividades`, aplica normalizacion/ranking y upsert en `activity_structural_scores`. La frontera principal/soporte vive en `selection_recommendation`.

### Cuestionario principal

`QuestionnaireRunner` recibe solo actividades principales. El mismo catalogo FULL V03 se responde por cada actividad. La ruta `questionnaire/submit` guarda `FULL_V03:*` y luego agrega `MISSION:*` por actividad.

### Soporte

Despues del cierre inicial, `support-activity-selector.ts` selecciona una actividad del pool soporte. Esa seleccion vive en memoria de `page.tsx`. Si se contesta, se guardan respuestas `FULL_V03:*` para ese `actividad_id`; no hay campo persistido que diga "esta fue soporte respondido", se reconstruye por comparacion con el score.

### Micro-aclaracion

Si `consistency-checker.ts` devuelve `clarification_required`, `page.tsx` muestra un prompt y guarda una respuesta con `questionCode: CONSISTENCY_CLARIFICATION`. En DB queda como `FULL_V03:CONSISTENCY_CLARIFICATION`.

### Cierre

`diagnostic-engine.ts` calcula diagnostico y cierre por actividad. `session-closure-engine.ts` calcula salida global. La ruta devuelve JSON al frontend; no inserta en tablas de cierre.

### Salida final

`session-export-consolidator.ts` reconstruye un `SessionExportPayload` desde `sesiones_llenado`, `actividades`, `respuestas_estructuradas` y `activity_structural_scores`, y recalcula diagnostico/finalOutput. La salida no queda persistida salvo el archivo generado al descargar.

## Riesgos o ambiguedades

- Hay varias fuentes posibles de verdad. La principal real para reconstruccion es `sesiones_llenado` + `actividades` + `activity_structural_scores` + `respuestas_estructuradas`. Las tablas `closure_results`, `support_activity_requests`, `triangulation_results` y `activity_canonical_profiles` parecen modelo previsto, no fuente activa.
- El estado operativo pedido por negocio existe en `EveFlowState` y `page.tsx`, pero no esta persistido como tal.
- `respuestas_estructuradas` mezcla captura, aclaracion e inferencia. La naturaleza depende del prefijo de `pregunta_id`.
- Las micro-aclaraciones no usan `micro_momentos_s4`; usan `respuestas_estructuradas`.
- La seleccion soporte y su iteracion no se persisten. `supportTrace` se pierde al recargar salvo que las respuestas soporte permitan inferir que una actividad soporte fue contestada.
- La salida final estructurada se calcula, pero no se guarda. Para auditoria historica, hoy habria que recalcularla con el codigo vigente.
- Hay tablas y rutas legacy (`structural/confirm`, `respuestas_patron`, `mapa_coordinacion_s2`) que pueden coexistir con FULL V03, pero no son parte del flujo principal actual de `page.tsx`.
- `metricas_por_capa` puede fallar o quedar incompleta por valores de capa no declarados en el enum SQL, como `cuestionario_full_v03`.
- `verbo_identificado` y `objeto_negocio` existen en `actividades`, pero la normalizacion actual no los escribe ahi; quedan solo como calculo en memoria o en scores/senales.
- Si se vuelve a ejecutar intake, se eliminan actividades de la sesion y se recrean con nuevos IDs, debilitando trazabilidad historica por `actividad_id`.

## JSON de ejemplo

El archivo `docs/session-data-example.json` usa un caso real de Supabase: `100fe0ae-75a9-4e43-8dd3-d2b5a9a93380`. Incluye metadata, actividades, scores estructurales, respuestas FULL V03, micro-aclaracion, inferencias `MISSION:*`, candidatos soporte y trazabilidad de tablas consultadas.

Las secciones `consistency`, `closure` y `support.persisted_support_activity_requests` estan marcadas explicitamente como no persistidas cuando corresponde; no se inventaron filas para tablas vacias.
