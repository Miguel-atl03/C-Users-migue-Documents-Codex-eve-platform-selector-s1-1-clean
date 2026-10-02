# OBSERVE_LOCAL_UI_ACTIVITY_1_NEXT_REQUIRED_SECTION_CAUSAL_CONTRACT_V1

DICTAMEN: LOCAL_UI_ACTIVITY_1_NEXT_REQUIRED_SECTION_CONTRACT_READY

## Alcance

- Ruta usada: `/dev/e2e-block0`
- Pantalla oficial: `Significado de tu trabajo`
- Base commit: `a65a0e39d2770588c42e799c17e6a13b78144c94`
- Transicion base: `LOCAL_UI_ACTIVITY_1_CLOSURE_CONFIRMATION_EXECUTED_PASSED`
- Parte observada: `part_1_next_required_section_contract`

## Condicion inicial observada

- Pantalla oficial observada: `Significado de tu trabajo`
- Actividad observada: `Actividad 1 de 8`
- Progreso actual: `2/4 secciones listas para revisar`
- B0-Q02 poblado: si
- Inicio confirmado visualmente: si
- Cierre y entrega confirmado visualmente: si
- Boton `Continuar a la siguiente actividad`: deshabilitado
- Errores visibles: ninguno
- Loading visible: no

## Secciones visibles

1. `Confirmar actividad`
   - `Que haces`: poblado con `Analizo`
   - `Sobre que trabajas`: poblado con `desviaciones de headcount contra presupuesto por unidad de negocio`
   - `Como o bajo que regla`: vacio
   - `Que queda listo`: poblado con `alertas tempranas`
2. `Descripcion operativa de tu actividad`
   - B0-Q02 poblado y listo.
3. `Frecuencia y contexto en el que la actividad se presenta`
   - `Con que frecuencia ocurre`: vacio
   - `En que situacion suele darse`: vacio
   - `Sobre quien recae directamente`: vacio
4. `Inicio y cierre`
   - `INICIO DE LA ACTIVIDAD / LISTO / Quiero corregirlo`
   - `CIERRE Y ENTREGA / LISTO / Quiero corregirlo`

## Siguiente seccion requerida

La siguiente seccion requerida en orden visible y canonico es `Confirmar actividad` (`B0-Q01`).

La causa puntual de que la seccion siga pendiente es que el subcampo `B0-Q01.procedure_or_standard` esta vacio. La etiqueta visible del campo es `Como o bajo que regla`.

Aunque `B0-Q03` tambien esta pendiente, la primera seccion incompleta en el recorrido actual es `B0-Q01`.

## Transicion primaria seleccionada

- Accion seleccionada para una ejecucion posterior: completar el campo `Como o bajo que regla`.
- Campo tecnico: `B0-Q01.procedure_or_standard`
- Texto autorizado sugerido para la ejecucion posterior: `contra el presupuesto aprobado por unidad de negocio`
- Origen del texto: derivado de la descripcion operativa ya autorizada en B0-Q02.
- Accion no ejecutada en este tramo: si.

## Contrato causal

Condicion inicial:
- UI en `Significado de tu trabajo`
- `Actividad 1 de 8`
- progreso `2/4 secciones listas para revisar`
- B0-Q01 incompleto solo por `procedure_or_standard`

Accion permitida para el siguiente tramo:
- escribir `contra el presupuesto aprobado por unidad de negocio` en `B0-Q01.procedure_or_standard`

Evento esperado:
- actualizacion local del estado de respuestas de B0-Q01
- recalculo del progreso de secciones listas

Condicion resultante esperada:
- `Confirmar actividad` queda completo
- progreso esperado: `3/4 secciones listas para revisar`
- `Continuar a la siguiente actividad` debe permanecer deshabilitado porque B0-Q03 sigue pendiente
- no debe aparecer bloqueo por Supabase, DB, migracion ni secretos

## Traza tecnica

- `src/features/significado/runtime-block0-canonical.ts` define `B0-Q01` con los subcampos `action_verb`, `input_or_object`, `procedure_or_standard`, `output_or_result` y `user_correction_note`.
- `src/features/significado/runtime-block0-canonical.ts` define `B0-Q03` con `frequency_base`, `typical_context` y `primary_actor_scope`.
- `src/components/significado/SignificadoDeTuTrabajo.tsx` calcula si una pregunta esta preparada validando los subcampos con valor; `user_correction_note` no bloquea la preparacion.
- `src/features/significado/significado-copy.ts` formatea el progreso como `<preparadas>/<total> secciones listas para revisar`.

## Dictamen

El contrato queda listo para ejecutar el siguiente tramo. No se ejecuto la accion de llenado en este dictamen.

