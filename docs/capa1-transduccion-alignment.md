# Alineacion Capa 1 v2.1 con Tabla de Transduccion Causal

Documento fuente analizado:

- `C:\Users\migue\Desktop\Plataforma Digital\Tabla_Transduccion_Causal_Operacional_Actualizada_Capa1_v2_1_COMPLETA.docx`

Archivo de extraccion usado para inspeccion:

- `C:\Users\migue\Documents\Codex\2026-05-12\quiero-que-realices-una-tarea-de\tabla-transduccion-causal-operacional-extraida.txt`

Estado de este entregable: analisis tecnico de compatibilidad. No implementa cambios de motor.

## 1. Veredicto ejecutivo

La implementacion progresiva de Capa 1 v2.1 que ya se empezo en EVE es compatible con la Tabla de Transduccion Causal, pero todavia no esta completa como contrato operativo.

Lo que ya esta bien encaminado:

- La arquitectura por `scene_id` coincide con el documento.
- Las tablas propuestas para Capa 1 v2.1 coinciden casi exactamente con las entidades minimas exigidas por la transduccion.
- El repositorio ya tiene una ruta para separar evidencia capturada, procedencia, escenas, aclaraciones, inferencias ligeras y registros canonicos.
- El cuestionario v2.1 ya existe en paralelo al catalogo legacy, por lo que no obliga a romper `FULL_V03`.

El punto critico:

- La Tabla de Transduccion no quiere consumir respuestas crudas ni nombres internos dispersos. Quiere consumir variables canonicas consolidadas por bloque, consistencia, inferencias ligeras y un dossier canonico por escena.

Por lo tanto, antes de avanzar al motor causal, falta cerrar una pieza de Capa 1:

> convertir las respuestas de `scene_question_answers` en `scene_block_derivations`, `scene_consistency_flags`, `scene_light_inferences`, `scene_canonical_records` y `session_intermediate_output`.

Esa pieza es el puente real entre el punto 1 y el punto 2.

## 2. Contrato minimo que exige la transduccion

El documento define que la transduccion causal no debe leer directamente respuestas dispersas. Debe leer un expediente estructural consolidado por sesion y escena.

Contrato minimo por escena:

| Dato requerido | Entidad esperada | Estado actual en EVE |
|---|---|---|
| `sessionId` | `scene_registry`, tablas por escena | Cubierto |
| `scene_id` | `scene_registry` | Cubierto |
| rango/prioridad de escena | `scene_registry.scene_rank` | Cubierto parcialmente |
| profundidad fractal | `scene_registry.depth_level` | Cubierto |
| respuestas capturadas | `scene_question_answers` | Tabla y API preparadas |
| procedencia epistemologica | `scene_answer_provenance` | Tabla y API preparadas |
| variables canonicas por bloque | `scene_block_derivations` | Tabla creada, falta motor |
| senales de consistencia | `scene_consistency_flags` | Tabla creada, falta motor |
| microaclaraciones | `scene_clarifications` | Tabla creada, falta flujo completo |
| inferencias ligeras | `scene_light_inferences` | Tabla creada, falta motor |
| dossier canonico | `scene_canonical_records` | Tabla creada, falta consolidacion |
| salida intermedia de sesion | `session_intermediate_output` | Tabla creada, falta consolidacion |

Conclusion: el modelo fisico esta muy cerca del contrato documental, pero falta materializar el contenido derivado.

## 3. Implicacion principal para Capa 1

La Tabla de Transduccion fija una regla arquitectonica clara:

1. Primero se captura evidencia fiel.
2. Luego se deriva un expediente estructural por escena.
3. Despues se evalua consistencia.
4. Despues se produce una preclasificacion ligera.
5. Solo entonces se habilita la transduccion causal.

Esto confirma que Capa 1 v2.1 no debe intentar diagnosticar causalmente. Debe entregar un dossier estructural limpio, auditable y trazable.

## 4. Entidades de Capa 1 frente a transduccion

### `scene_registry`

Proposito esperado por la transduccion:

- definir la unidad fractal de lectura;
- conectar cada escena con `sessionId`;
- mantener prioridad y profundidad;
- diferenciar escenas core, abreviadas y soporte/reentrada.

Compatibilidad:

- Alta.

Brecha:

- La asignacion actual de profundidad viene desde ranking legacy (`primary_candidate`, `support_pool`).
- Falta consolidar una regla v2.1 definitiva para `scene_rank`, `depth_level` y prioridad cuando la sesion nazca directamente desde Capa 1 v2.1.

### `scene_question_answers`

Proposito esperado:

- guardar evidencia primaria literal;
- no reemplazar la evidencia por inferencias;
- conservar respuestas por bloque, pregunta y subpregunta.

Compatibilidad:

- Alta.

Brecha:

- Falta asegurar que el catalogo v2.1 use nombres canonicos compatibles con la transduccion o que exista una capa de alias/derivacion estable.
- Falta normalizar respuestas abiertas hacia opciones cuando aplique, sin borrar el texto original.

### `scene_answer_provenance`

Proposito esperado:

- separar dato capturado, calculado, inferido, aclarado o revisado manualmente.

Compatibilidad:

- Alta.

Brecha:

- La API de respuestas ya inserta procedencia, pero todavia no hay politicas finas para procedencia derivada, calculada, inferida y aclarada.
- Si una respuesta se reenvia varias veces, la tabla puede acumular trazas repetidas. Eso puede ser aceptable como bitacora, pero debe definirse.

### `scene_block_derivations`

Proposito esperado:

- ser la fuente preferida para los triggers de transduccion;
- guardar variables canonicas por bloque;
- resolver calculos, alias, transformaciones y dependencias recursivas.

Compatibilidad:

- Media.

Brecha:

- La tabla existe, pero falta el motor de derivaciones.
- Esta es la brecha mas importante antes de conectar con el punto 2.

### `scene_consistency_flags`

Proposito esperado:

- guardar contradicciones, silencios, gaps, inconsistencias y senales de reentrada;
- activar aclaraciones o soporte cuando una regla causal no tiene base suficiente.

Compatibilidad:

- Media.

Brecha:

- La tabla existe, pero falta el motor de consistencia v2.1 conectado a escenas.
- El motor legacy de cierre/consistencia no debe ser eliminado aun, pero debe empezar a convivir con este modelo.

### `scene_clarifications`

Proposito esperado:

- guardar microaclaraciones sin reemplazar evidencia original;
- elevar o reducir confianza;
- resolver contradicciones criticas.

Compatibilidad:

- Media.

Brecha:

- La tabla existe, pero falta el flujo operativo especifico para Capa 1 v2.1.

### `scene_light_inferences`

Proposito esperado:

- guardar inferencias ligeras de bloque 7;
- incluir tipo de escena, posicion en cadena, rol VSM, senal AHE, mision sugerida y confianza.

Compatibilidad:

- Media.

Brecha:

- La tabla existe, pero falta motor de preclasificacion.
- El documento insiste en que estas inferencias no sustituyen la evidencia de bloques 0.5 a 6.

### `scene_canonical_records`

Proposito esperado:

- ser el contrato principal entre Capa 1 y Transduccion;
- consolidar evidencia, derivaciones, consistencia, aclaraciones, inferencias y readiness.

Compatibilidad:

- Media alta.

Brecha:

- La tabla existe, pero falta servicio de consolidacion.
- Falta definir el shape exacto de `canonical_payload` para que la transduccion lo pueda leer de forma estable.

### `session_intermediate_output`

Proposito esperado:

- resumir estado de la sesion completa;
- indicar si la sesion esta lista para transduccion;
- agrupar escenas, gaps, riesgos y necesidades de reentrada.

Compatibilidad:

- Media.

Brecha:

- La tabla existe, pero falta el agregador por `sessionId`.

## 5. Mapa de variables canonicas exigidas

La Tabla de Transduccion define variables canonicas que deben estar disponibles en `scene_block_derivations` o en el payload consolidado de `scene_canonical_records`.

### Bloque 0.5

| Variable requerida por transduccion | Estado frente al catalogo v2.1 actual | Accion necesaria |
|---|---|---|
| `beneficiario_final_0_5_1` | Existe concepto equivalente como cliente/beneficiario funcional | Crear alias canonico o renombrar variable |
| `afectado_final_0_5_1a` | Existe concepto equivalente como actor afectado por falla | Crear alias canonico |
| `relacion_beneficiario_afectado_0_5_1_rel` | Existe concepto equivalente | Crear alias canonico |
| `beneficio_vs_dano_distribucion_0_5_1b` | Existe concepto equivalente | Crear alias canonico |
| `claridad_beneficiario_0_5_1c` | Requiere derivacion de claridad | Agregar derivacion |
| `claridad_afectado_0_5_1d` | Requiere derivacion de claridad | Agregar derivacion |
| `scene_macro_process` | Cubierto conceptualmente | Verificar nombre exacto |
| `scene_enabled_milestone` | Cubierto conceptualmente | Verificar nombre exacto |
| `scene_priority_source_normal` | Parcial | Separar prioridad normal |
| `scene_priority_source_disruptive` | Parcial | Separar fuente disruptiva |

### Bloque 1

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `trigger_source` | Cubierta | Validar nombre exacto |
| `trigger_type` | Cubierta | Validar nombre exacto |
| `trigger_frequency` | Cubierta | Validar nombre exacto |
| `trigger_pattern` | Cubierta | Validar nombre exacto |
| `trigger_clarity` | Cubierta | Validar nombre exacto |
| `trigger_channel` | Cubierta | Validar nombre exacto |
| `trigger_preconditions` | Cubierta | Validar nombre exacto |
| `trigger_exception_exists` | Cubierta | Validar nombre exacto |
| `trigger_exception_description` | Cubierta | Validar nombre exacto |

### Bloque 2

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `objeto_tipo` | Concepto cubierto | Alias/derivacion |
| `sujeto_tipo` | Concepto cubierto | Alias/derivacion |
| `accion_tipo` | Concepto cubierto | Alias/derivacion |
| `dimension_dominante_AB/AC/BC/ABC` | Parcial | Derivar desde seleccion/ranking |
| `ranking_dimensiones` | Cubierto conceptualmente | Normalizar salida |
| `atributos_objeto_cambian` | Concepto cubierto | Alias desde atributos de objeto |
| `atributos_sujeto_cambian` | Concepto cubierto | Alias desde atributos de sujeto |
| `atributos_accion_cambian` | Concepto cubierto | Alias desde atributos de accion |
| `transformation_magnitude` | Cubierta | Validar nombre exacto |
| `transformation_causality` | Parcial | Unificar causa/directness |
| `transformation_state_initial` | Cubierta | Validar nombre exacto |
| `transformation_state_final` | Cubierta | Validar nombre exacto |
| `transformation_iterations` | Cubierta | Validar nombre exacto |
| `transformation_iteration_count` | Cubierta | Validar nombre exacto |
| `transformation_exception_exists` | Parcial | Derivar desde falla/excepcion |
| `transformation_exception_type` | Parcial | Derivar desde falla/excepcion |
| `transformation_hidden_changes` | Cubierta conceptualmente | Alias |

### Bloque 3

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `output_object` | Cubierta conceptualmente | Validar nombre exacto |
| `receiver_immediate` | Concepto cubierto como receptor primario | Alias |
| `receiver_nature` | Concepto cubierto como tipo de receptor | Alias |
| `receiver_delay_consequence` | Parcial | Derivar desde impacto/dependencia |
| `next_step_of_receiver` | Parcial | Agregar/derivar si ya existe pregunta |
| `secondary_receivers` | Parcial | Validar existencia |
| `validation_rule` | Concepto cubierto como criterio de calidad | Alias |
| `delivery_channel` | Concepto cubierto como mecanismo de entrega | Alias |
| `delivery_frequency` | Cubierta | Validar nombre exacto |
| `delivery_failure_exists` | Concepto cubierto como excepcion | Alias |
| `delivery_failure_type` | Concepto cubierto como tipo de excepcion | Alias |
| `receiver_feedback` | Parcial | Validar existencia |

### Bloque 4

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `dependency_previous` | Cubierta | Validar nombre exacto |
| `dependency_next` | Cubierta | Validar nombre exacto |
| `wait_time_typical` | Concepto cubierto como tiempo de espera | Alias |
| `time_event_exists` | Cubierta conceptualmente | Validar nombre exacto |
| `deadlock_risk` | Cubierta | Validar nombre exacto |
| `deadlock_resolution` | Cubierta | Validar nombre exacto |
| `iteration_pattern` | Cubierta | Validar nombre exacto |
| `alternative_paths` | Concepto cubierto como rutas alternativas | Alias |
| `parallelism_pattern` | Concepto cubierto como paralelismo | Alias |
| `hidden_subprocess` | Cubierta | Validar nombre exacto |
| `real_vs_official_sequence` | Cubierta | Validar nombre exacto |
| `blocking_impact` | Concepto cubierto como impacto de bloqueo | Alias |
| `bottleneck_type` | Concepto cubierto como cuello de botella | Alias |
| `flow_deviation_frequency` | Concepto cubierto como frecuencia desviacion | Alias |

### Bloque 5

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `dimension_dominante` | Parcial | Derivar desde bloque 2 |
| `naturaleza_actividad_5_0` | Cubierta conceptualmente | Validar nombre exacto |
| `capacidad_nominal_5_1` | Cubierta conceptualmente | Normalizar por metrica dominante |
| `capacidad_real_5_2` | Cubierta conceptualmente | Normalizar por metrica dominante |
| `brecha_capacidad_5_3` | Calculada | Implementar formula |
| `recursos_personas_5_4` | Cubierta conceptualmente | Alias |
| `recursos_sistemas_5_5` | Cubierta conceptualmente | Alias |
| `recursos_tiempo_5_6` | Cubierta conceptualmente | Alias |
| `recursos_personas_requeridas_5_7` | Cubierta conceptualmente | Alias |
| `recursos_tiempo_requerido_5_8` | Cubierta conceptualmente | Alias |
| `discrecionalidad_5_9` | Cubierta conceptualmente | Alias |
| `constreñimientos_5_10` | Requiere nombre ASCII alterno en codigo | Usar `constrenimientos_5_10` o alias exacto en payload |
| `compensacion_5_11` | Cubierta conceptualmente | Alias |
| `variedad_residual_5_12` | Cubierta conceptualmente | Alias |
| `variedad_residual_destino_5_13` | Cubierta conceptualmente | Alias |
| `resource_bargain_5_14` | Cubierta conceptualmente | Alias |

### Bloque 6

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `workaround_used` | Cubierta | Validar nombre exacto |
| `workaround_types` | Cubierta | Validar nombre exacto |
| `retrabajo_presente` | Concepto cubierto como `rework_present` | Alias |
| `retrabajo_descripcion` | Concepto cubierto | Alias |
| `informacion_faltante` | Concepto cubierto como `missing_information` | Alias |
| `informacion_faltante_accion` | Concepto cubierto | Alias |
| `regla_informal` | Concepto cubierto | Alias |
| `regla_informal_conocida` | Concepto cubierto | Alias |
| `sacrificio_humano` | Concepto cubierto como `human_sacrifice` | Alias |
| `desgaste_acumulado` | Concepto cubierto como `wear_accumulated` | Alias |
| `costo_percibido` | Concepto cubierto como `effort_cost` | Alias |
| `frase_trinchera` | Cubierta conceptualmente | Alias |
| `patron_repetitivo` | Cubierta conceptualmente | Alias |
| `absorcion_variedad_residual` | Concepto cubierto como residual absorption | Alias |
| `sintesis_principal` | Cubierta conceptualmente | Alias |

### Bloque 7

| Variable requerida | Estado | Accion necesaria |
|---|---|---|
| `preclassification_scene_type` | Cubierta conceptualmente | Persistir en `scene_light_inferences` |
| `preclassification_chain_position` | Cubierta conceptualmente | Persistir en `scene_light_inferences` |
| `preclassification_vsm_role` | Cubierta conceptualmente | Persistir en `scene_light_inferences` |
| `preclassification_ahe_signal` | Cubierta conceptualmente | Persistir en `scene_light_inferences` |
| `preclassification_mission_suggested` | Cubierta conceptualmente | Persistir en `scene_light_inferences` |
| `confidence_level` | Cubierta conceptualmente | Normalizar escala |
| `confidence_score` | Cubierta conceptualmente | Normalizar numerico |
| `confidence_reasoning` | Cubierta conceptualmente | Guardar trazabilidad |
| `user_confirmation` | Cubierta conceptualmente | Separar de inferencia |
| `user_correction` | Cubierta conceptualmente | Separar como aclaracion |
| `user_clarification` | Cubierta conceptualmente | Separar como aclaracion |

## 6. Logica recursiva que debe respetar Capa 1

El documento introduce dependencias que deben implementarse antes de evaluar reglas causales:

1. Bloque 2.1 identifica objeto, sujeto, accion o combinacion.
2. Bloque 2.1_rel resuelve dimension limitante cuando hay dos o tres dimensiones.
3. Bloque 2.2 despliega atributos segun dimension/ranking seleccionado.
4. Bloque 5.0 usa la dimension dominante para definir la metrica de capacidad.
5. Bloque 5.1 y 5.2 capturan capacidad nominal y real usando esa metrica.
6. Bloque 5.3 calcula brecha de capacidad.
7. Bloque 5.4 a 5.14 conservan el contexto de dimension dominante.

Formula requerida para `brecha_capacidad_5_3`:

```text
(capacidad_nominal - capacidad_real) / capacidad_nominal * 100
```

Advertencia:

- En metricas temporales, la capacidad debe convertirse primero a escala numerica comparable.
- El resultado debe interpretarse como brecha temporal o sobrecarga, no como numero aislado.

## 7. Reglas causales y dependencias de datos

La transduccion define seis nodos causales iniciales:

| Nodo | Nombre | Datos de Capa 1 mas relevantes |
|---|---|---|
| N1 | Brecha Intencional / El Espejismo | proposito, beneficiario, mision, consecuencia economica, falta de transformacion real |
| N2 | Tortura Causal / El Doble Vinculo | falla alta, obligacion de actuar, falta de recursos, espera/aprobacion, OLC-PF |
| N3 | Promesa Imposible / La Falsa Discrecion | responsabilidad sin recursos, discrecionalidad falsa, capacidad insuficiente |
| N4 | Violacion Causal / El Politico | deformacion de informacion, castigo, ocultamiento, canales alterados |
| N5 | Anarquia Operacional / El Heroe | falta de S2, coordinacion informal, esfuerzo personal, horas extra |
| N6 | Incoherencia Total / La Suma Cero | falla cronica, dolor normalizado, ausencia de reaccion sistemica, multiples nodos activos |

Implicacion:

- Ningun nodo deberia activarse desde una sola respuesta aislada.
- Cada nodo debe leer un paquete minimo de evidencia desde `scene_canonical_records`.
- Si falta evidencia o hay contradiccion, la accion correcta es gap, reentrada, aclaracion o revision manual.

## 8. Compatibilidad con el trabajo ya hecho

### Compatible

- Mantener `question-catalog-v03.json` y agregar `question-catalog-v2-1.json` en paralelo.
- Versionar `/api/questionnaire/catalog`.
- Introducir `scene_registry`.
- Introducir `scene_question_answers`.
- Introducir `scene_answer_provenance`.
- Introducir tablas v2.1 sin romper tablas legacy.
- Mantener lectura legacy para sesiones `FULL_V03`.

### Parcialmente compatible

- El catalogo v2.1 actual captura muchas piezas necesarias, pero no todas tienen el nombre canonico esperado por la transduccion.
- Las respuestas se pueden guardar por escena, pero aun no se derivan variables canonicas por bloque.
- La evidencia y la inferencia ya pueden separarse en modelo, pero falta aplicar esa separacion en todos los flujos.

### No cerrado todavia

- Motor de derivacion por bloque.
- Motor de consistencia v2.1 por escena.
- Motor de microaclaracion v2.1 conectado a `scene_clarifications`.
- Motor de preclasificacion ligera.
- Constructor de `scene_canonical_records`.
- Constructor de `session_intermediate_output`.
- Interfaz futura del motor de transduccion.

## 9. Cambios que se deben hacer antes de conectar el punto 2

Estos cambios pertenecen aun al punto 1, porque preparan el insumo limpio para la transduccion:

1. Crear un mapa canonico de variables de Capa 1 v2.1.
   - Debe resolver nombres actuales del catalogo hacia los nombres exigidos por la Tabla de Transduccion.
   - Debe evitar que reglas causales dependan de preguntas individuales.

2. Implementar motor de derivaciones por bloque.
   - Entrada: `scene_question_answers`.
   - Salida: `scene_block_derivations`.
   - Debe incluir calculos como `brecha_capacidad_5_3`.

3. Implementar motor de consistencia por escena.
   - Entrada: respuestas, derivaciones y procedencia.
   - Salida: `scene_consistency_flags`.
   - Debe distinguir gap, silencio, contradiccion, contradiccion critica y reentrada.

4. Implementar persistencia de inferencias ligeras.
   - Entrada: bloque 7 y contexto canonico.
   - Salida: `scene_light_inferences`.
   - Debe mantenerlas separadas de evidencia capturada.

5. Implementar constructor de dossier canonico.
   - Entrada: escena, respuestas, procedencia, derivaciones, flags, aclaraciones e inferencias.
   - Salida: `scene_canonical_records`.
   - Debe incluir `readiness_for_transduction`.

6. Implementar agregador de sesion.
   - Entrada: todos los `scene_canonical_records` de un `sessionId`.
   - Salida: `session_intermediate_output`.
   - Debe indicar si la sesion esta lista, si necesita reentrada o si requiere revision manual.

## 10. Punto de no retorno arquitectonico

La decision importante que confirma este documento es:

> La fuente confiable para transduccion no debe ser el cuestionario ni las tablas legacy, sino `scene_canonical_records`.

Eso significa que el siguiente tramo no debe ser todavia implementar reglas N1-N6. Primero debe terminarse la materializacion canonica de Capa 1 v2.1.

## 11. Ruta recomendada inmediata

Siguiente tramo recomendado:

1. Crear `src/domain/canonical-variables.ts`.
2. Crear `src/services/scene-derivation-engine.ts`.
3. Leer respuestas por `sceneId`.
4. Generar variables canonicas por bloque.
5. Guardar en `scene_block_derivations`.
6. Incluir calculo `brecha_capacidad_5_3`.
7. Dejar listo el contrato para el constructor de `scene_canonical_records`.

No recomiendo implementar aun los nodos N1-N6. Hacerlo antes de tener derivaciones canonicas obligaria al motor causal a leer respuestas sueltas y debilitaria justo la mejora que busca Capa 1 v2.1.

