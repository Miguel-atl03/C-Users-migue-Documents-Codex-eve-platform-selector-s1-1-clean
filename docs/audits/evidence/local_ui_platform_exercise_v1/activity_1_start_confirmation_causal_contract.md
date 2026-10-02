# OBSERVE_LOCAL_UI_ACTIVITY_1_START_CONFIRMATION_CAUSAL_CONTRACT_V1

DICTAMEN: LOCAL_UI_ACTIVITY_1_START_CONFIRMATION_CONTRACT_READY

## Estado A observado

- Ruta usada: `/dev/e2e-block0`
- Titulo observado: `Significado de tu trabajo`
- Actividad observada: `Actividad 1 de 8`
- Progreso antes: `1/4 secciones listas para revisar`
- B0-Q02 poblado: si
- Inicio de la actividad poblado: si
- Cierre y entrega vacio: si
- Boton `Si, es correcto` de Inicio: habilitado
- Label exacto del boton objetivo: `Si, es correcto`
- Boton `Si, es correcto` de Cierre: deshabilitado
- Boton `Continuar a la siguiente actividad`: deshabilitado
- Errores visibles: ninguno
- Loading visible: no

## Boton objetivo

- action_id: `confirm_start_input_transduction`
- label visible: `Si, es correcto`
- type: `button`
- enabled: true
- probable_effect: confirmar `input_transduction` en estado local de UI y recalcular estado de seccion
- validation_or_blocking_rule_visible: el boton se habilita cuando `Inicio de la actividad` contiene texto
- risk_level: low
- reason: accion UI local sobre estado de confirmacion de la seccion; no se observo endpoint ni dependencia DB/Supabase

## Contrato causal

Estado A:
`Inicio de la actividad` esta poblado con el texto autorizado, el boton de confirmar Inicio esta habilitado, `Cierre y entrega` sigue vacio, el progreso esta en `1/4 secciones listas para revisar` y Continuar esta deshabilitado.

Accion:
click en el boton `Si, es correcto` de Inicio.

Evento esperado:
`click/local state update`, con actualizacion del estado de confirmacion de la seccion y recalculo de validacion.

Mecanismo esperado:
`ActivityBoundaryConfirmationPanel` invoca `onSectionConfirm(section.id)`, conectado en `SignificadoDeTuTrabajo.tsx` a `handleActivityBoundarySectionConfirm`. El handler actualiza `visualDraft` usando `buildBoundarySectionAcceptPatch`, marcando `B0-Q04.input_transduction_status` como `confirmed` o `manual` segun el valor frente al snippet inferido.

Estado B esperado:
Inicio queda confirmado. La UI cambia a estado visual equivalente de confirmacion: tarjeta de Inicio resuelta con estado `Listo`, texto confirmado visible y accion de correccion disponible; o el boton de Inicio deja de estar como confirmacion pendiente. Cierre sigue pendiente y vacio. El progreso puede permanecer `1/4` si la seccion requiere Inicio y Cierre. Continuar sigue deshabilitado. No aparece error ni bloqueo Supabase/DB.

Criterio de exito para Parte 2:
El click produce un cambio visible de confirmacion o estado local para Inicio, preserva la frontera local/demo, no genera errores, no conecta DB/Supabase y no habilita indebidamente Continuar mientras Cierre siga pendiente.

## Traza tecnica

- component_or_file: `src/components/significado/ActivityBoundaryConfirmationPanel.tsx`
- handler_or_event: `handleConfirm -> onConfirm -> onSectionConfirm(section.id) -> handleActivityBoundarySectionConfirm`
- validation_logic_file: `src/services/operational-description-coach/infer-activity-boundary.ts`
- endpoint_if_observed: null
- transition_is_ui_only: true
- synthetic_frontier_connected: true
- bridge_reader_or_adapter_involved: false

