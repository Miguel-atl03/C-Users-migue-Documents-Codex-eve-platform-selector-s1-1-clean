# OBSERVE_LOCAL_UI_ACTIVITY_1_CAUSAL_TRANSITION_CONTRACT_V1

## Dictamen

LOCAL_UI_ACTIVITY_1_CAUSAL_TRANSITION_CONTRACT_READY

## Base

- Base commit: a65a0e39d2770588c42e799c17e6a13b78144c94
- Ruta usada: /dev/e2e-block0
- Parte: part_1_transition_contract
- UI local iniciada: true
- Estado base alcanzado: true

## Estado A observado

- Titulo visible: Significado de tu trabajo
- Subtitulo visible: Vamos a entender una actividad concreta de tu mapa antes de continuar con las preguntas.
- Actividad visible: Actividad 1 de 8
- Indicador de progreso: 0/4 secciones listas para revisar
- Usuario visible: Usuario Demo
- Contexto visible: Demo controlada; Login demo -> Comienza tu levantamiento -> WorkMap -> Significado
- Texto principal de actividad: Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas.
- Errores visibles: ninguno
- Loading visible: false

## Instrucciones visibles

- Esto es lo que entendimos de esta actividad. ¿Esta correcto? Si no, corrigelo para que diga que haces, sobre que trabajas y que queda listo.
- Revisa cada parte por separado y corrige directamente el campo que no encaje.
- Aqui cuentas como ocurre en la practica, no que haces, sino el recorrido paso a paso.
- Cuentanos como se desarrolla la actividad en la practica real.
- Completa cada subcampo por separado: con que frecuencia ocurre, en que situacion suele darse y quien la ejecuta directamente.
- Primero escribe arriba la descripcion operativa. Despues podras revisar aqui el inicio y el cierre.
- Completa y confirma las secciones pendientes antes de continuar.

## Acciones disponibles

| action_id | label | type | enabled | required_input | probable_effect | risk |
| --- | --- | --- | --- | --- | --- | --- |
| reset_demo | Reset demo | button | true | false | Reinicia la demo local | low |
| view_demo_trace | Ver traza demo | button | true | false | Abre/oculta traza demo local | low |
| edit_action_verb | Que haces: Analizo | input | true | true | Actualiza subcampo B0-Q01 action_verb | low |
| edit_input_or_object | Sobre que trabajas | input | true | true | Actualiza subcampo B0-Q01 input_or_object | low |
| edit_procedure_or_standard | Como o bajo que regla | input | true | true | Actualiza subcampo B0-Q01 procedure_or_standard | low |
| edit_output_or_result | Que queda listo | input | true | true | Actualiza subcampo B0-Q01 output_or_result | low |
| edit_operational_description | Escribe aqui | input | true | true | Actualiza B0-Q02 descripcion operativa; puede activar coach local/demo | low |
| edit_frequency | Con que frecuencia ocurre | input | true | true | Actualiza subcampo B0-Q03 frequency | low |
| edit_context | En que situacion suele darse | input | true | true | Actualiza subcampo B0-Q03 context | low |
| edit_direct_owner | Sobre quien recae directamente | input | true | true | Actualiza subcampo B0-Q03 owner | low |
| back_to_work_map | Volver al mapa | button | true | false | Cambia fase local de significado a work_map | low |
| continue_next_activity | Continuar a la siguiente actividad | button | false | true | No ejecutable hasta completar secciones | low |

## Accion principal recomendada para Parte 2

- action_id: edit_operational_description
- label: Escribe aqui
- type: input
- selection_reason: es visible, esta habilitada, pertenece a Actividad 1, no requiere DB/Supabase/secreto y desbloquea el siguiente tramo del flujo al alimentar B0-Q02.

## Contrato causal

- Estado A: Pantalla Significado de tu trabajo, Actividad 1 de 8, 0/4 secciones listas, B0-Q02 vacio y boton Continuar a la siguiente actividad deshabilitado.
- Accion: escribir una descripcion operativa completa en el textarea "Escribe aqui".
- Evento esperado: input/local state update.
- Mecanismo esperado: `renderAnswerField` textarea `onChange` llama `RuntimeBlock0Question.onAnswerChange`; `SignificadoDeTuTrabajo` actualiza `visualDraft` con `setVisualDraft`. Si el texto supera el umbral de coach, `useOperationalDescriptionCoach` puede llamar `/api/coach/operational-description` en modo demo.
- Estado B esperado: B0-Q02 queda poblado; el progreso debe subir al menos a 1/4 secciones listas o mostrar guia/coach local controlado; el bloque Inicio y cierre puede dejar de estar bloqueado por falta de descripcion.
- Criterio de exito Parte 2: al ingresar una descripcion operativa, la UI mantiene frontera local/demo, no muestra error, no bloquea por Supabase y refleja cambio visible en el campo/progreso o guia de actividad.

## Traza tecnica segura

- component_or_file: src/components/significado/SignificadoDeTuTrabajo.tsx; src/app/dev/e2e-block0/page.tsx; src/hooks/use-operational-description-coach.ts; src/hooks/use-operational-description-intro-guide.ts
- handler_or_event: textarea onChange -> onAnswerChange -> setVisualDraft; optional debounce coach fetch after threshold.
- endpoint_if_observed: /api/coach/operational-description/intro-example for left example; /api/coach/operational-description expected by hook after B0-Q02 input threshold.
- synthetic_frontier_connected: true
- bridge_reader_or_adapter_involved: false
- transition_type: ui_to_local_api

## Riesgos de bloqueo

- El boton "Continuar a la siguiente actividad" esta deshabilitado en Estado A.
- La accion primaria requiere texto de usuario suficiente para que la UI marque progreso.
- Si el texto es demasiado corto, puede no activar coach personalizado ni progreso suficiente.
- No se observaron errores de consola relevantes.

## Safety

- env_file_read: false
- secret_values_exposed: false
- db_connected: false
- supabase_connected: false
- migration_executed: false
- sql_modified: false
- observer_created: false
- real_table_read: false
- gate2_real_shadow_closed: false
- gate3_ready: false
- fase9_started: false
- registry_written: false
- export_generated: false
- diagnosis_enabled: false
