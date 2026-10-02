# OBSERVE_SIGNIFICADO_CONTINUE_BUTTON_TRANSITION_MECHANISM_CONTRACT_V1

DICTAMEN: SIGNIFICADO_CONTINUE_BUTTON_TRANSITION_MECHANISM_CONTRACT_READY_FOR_FIX

## Alcance

- Pantalla oficial: `Significado de tu trabajo`
- Ruta usada: `/dev/e2e-block0`
- Fallo base: `LOCAL_UI_SIGNIFICADO_ACTIVITY_1_FULL_ZONE_EXERCISE_FAILED_CONTINUE_NO_ADVANCE`
- Objetivo: identificar el mecanismo causal real del boton `Continuar a la siguiente actividad`.

No se modifico codigo. No se aplico fix. No se hizo commit ni git add.

## Condicion reproducida

La condicion sigue visible en UI local:

- Pantalla oficial: `Significado de tu trabajo`
- Actividad visible: `Actividad 1 de 8`
- Progreso visible: `4/4 secciones listas para revisar`
- Boton `Continuar a la siguiente actividad`: habilitado
- Errores visibles: ninguno
- Loading persistente: no

En el ejercicio previo el click fue ejecutado y no avanzo a `Actividad 2 de 8`.

## Mecanismo del boton

Archivo que renderiza el boton:

- `src/components/significado/SignificadoDeTuTrabajo.tsx`

Label:

- `Continuar a la siguiente actividad`

Condicion de habilitacion:

- `disabled={disabled || !canContinue}`
- `canContinue = isWorkMapSaved && submitGate.canSubmit && isBlock0ReviewComplete`

Handler local del componente:

- `handleContinue`

Efecto esperado del handler local:

- valida mapa guardado;
- valida Block 0 completo;
- construye payload;
- construye `runtimeBlock0ResponseBundle`;
- limpia borrador local;
- llama `onContinue?.(...)`.

El handler del componente si esta conectado.

## Handler de la pagina dev

Archivo:

- `src/app/dev/e2e-block0/page.tsx`

Prop:

- `onContinue={handleSignificadoContinue}`

Implementacion observada:

- `handleSignificadoContinue` solo ejecuta `setSubmitNotice(...)`.
- No cambia `phase`.
- No cambia un indice/cursor de actividad.
- No actualiza `primaryActivitySelectionResult`.
- No selecciona la siguiente actividad.

Por eso el click puede ejecutarse sin error visible y aun asi permanecer en `Actividad 1 de 8`.

## Estado de actividad

Archivo principal:

- `src/components/significado/SignificadoDeTuTrabajo.tsx`

Derivacion actual:

- `currentActivity` toma siempre `effectivePrimaryActivitySelectionResult.selectedPrimaryActivities[0]`.

Archivo de traza demo:

- `src/features/dev/e2e-block0-demo-state.ts`

Derivacion de traza:

- `currentActivity` tambien se deriva de `primaryActivitySelectionResult?.selectedPrimaryActivities[0]`.

No se encontro una variable de cursor tipo `currentActivityIndex` editable por el boton Continuar dentro de la pantalla oficial. El indice visible se deriva de la primera actividad primaria seleccionada, no de un estado que avance.

## Actividad 2 disponible

La Actividad 2 si existe en el fixture/candidatos:

- `src/features/dev/e2e-block0-demo-fixture.ts`
- `E2E_BLOCK0_DEMO_EXPECTED_ACTIVITY_COUNT = 17`
- `E2E_BLOCK0_DEMO_EXPECTED_PRIMARY_COUNT = 8`
- La segunda actividad literal del fixture financiero es `Concilio saldos de cuentas contables...`.

El test `tests/regression/e2e-block0-demo-contract.test.ts` confirma que el ejemplo financiero usa `competitive_selection` con `selectedPrimaryActivities.length = 8`.

## Reglas de gate

Regla que habilita Continuar:

- `isWorkMapSaved && submitGate.canSubmit && isBlock0ReviewComplete`

Regla que permite ejecutar el handler interno:

- `isWorkMapSaved`;
- `isBlock0ReviewComplete`;
- `buildDraftSubmitPayload(...)` devuelve payload.

Estas reglas bastan para llamar `onContinue`, pero no existe una regla/accion posterior que cambie a la siguiente actividad en `/dev/e2e-block0`.

Gate oculto detectado: no.

## Diagnostico causal

Codigo causal probable:

- `HANDLER_CONNECTED_BUT_NO_STATE_CHANGE`

Resumen:

El boton esta habilitado y conectado al handler interno de `SignificadoDeTuTrabajo`. Ese handler llama correctamente `onContinue`. En `/dev/e2e-block0`, `onContinue` apunta a `handleSignificadoContinue`, pero esa funcion solo registra un aviso de demo completada y no modifica ningun estado de actividad. Como `currentActivity` siempre se deriva de `selectedPrimaryActivities[0]`, la UI sigue mostrando `Actividad 1 de 8`.

Fix requerido: si.

Alcance recomendado del fix:

- agregar un cursor/estado local de actividad actual para `/dev/e2e-block0` o para el flujo `SignificadoDeTuTrabajo`;
- hacer que `handleSignificadoContinue` avance al siguiente indice primario cuando exista;
- pasar a `SignificadoDeTuTrabajo` la actividad activa correspondiente en lugar de derivar siempre la primera;
- preservar comportamiento local/demo sin DB ni Supabase.

