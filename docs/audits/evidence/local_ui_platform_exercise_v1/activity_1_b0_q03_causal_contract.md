# OBSERVE_LOCAL_UI_ACTIVITY_1_B0_Q03_CAUSAL_CONTRACT_V1

DICTAMEN: LOCAL_UI_ACTIVITY_1_B0_Q03_CAUSAL_CONTRACT_READY

## Alcance

- Ruta usada: `/dev/e2e-block0`
- Pantalla oficial: `Significado de tu trabajo`
- Base commit: `a65a0e39d2770588c42e799c17e6a13b78144c94`
- Transicion base: `LOCAL_UI_ACTIVITY_1_NEXT_REQUIRED_SECTION_EXECUTED_PASSED`
- Parte observada: `part_1_b0_q03_contract`

## Condicion inicial observada

- Pantalla oficial observada: `Significado de tu trabajo`
- Actividad observada: `Actividad 1 de 8`
- Progreso visible: `3/4 secciones listas para revisar`
- B0-Q02 listo: si
- B0-Q04 Inicio/Cierre listo: si
- B0-Q01 Confirmar actividad listo: si
- B0-Q03 pendiente: si
- Boton `Continuar a la siguiente actividad`: deshabilitado
- Errores visibles: ninguno
- Loading visible: no

## Campos B0-Q03 visibles

1. `B0-Q03.frequency_base`
   - Label visible: `Con que frecuencia ocurre`
   - Tipo: `input`
   - Habilitado: si
   - Valor actual: vacio
   - Placeholder: ninguno
   - Required input: si
   - Efecto probable: aporta frecuencia y permite completar una de las tres partes de B0-Q03.
   - Regla visible: B0-Q03 sigue pendiente mientras el campo esta vacio.
   - Riesgo: bajo.

2. `B0-Q03.typical_context`
   - Label visible: `En que situacion suele darse`
   - Tipo: `input`
   - Habilitado: si
   - Valor actual: vacio
   - Placeholder: ninguno
   - Required input: si
   - Efecto probable: aporta contexto situacional y permite completar una de las tres partes de B0-Q03.
   - Regla visible: B0-Q03 sigue pendiente mientras el campo esta vacio.
   - Riesgo: bajo.

3. `B0-Q03.primary_actor_scope`
   - Label visible: `Sobre quien recae directamente`
   - Tipo: `input`
   - Habilitado: si
   - Valor actual: vacio
   - Placeholder: ninguno
   - Required input: si
   - Efecto probable: aporta responsable directo y permite completar una de las tres partes de B0-Q03.
   - Regla visible: B0-Q03 sigue pendiente mientras el campo esta vacio.
   - Riesgo: bajo.

## Transicion primaria seleccionada

Se selecciona transicion compuesta minima: llenar los tres campos B0-Q03 juntos.

Motivo: la logica de preparacion de preguntas compuestas exige que todos los subcampos requeridos tengan valor. B0-Q03 no debe considerarse listo con solo uno o dos campos completos.

Campos a llenar en el siguiente tramo:

- `B0-Q03.frequency_base`
- `B0-Q03.typical_context`
- `B0-Q03.primary_actor_scope`

Textos autorizados para ejecucion posterior:

- `B0-Q03.frequency_base`: `Mensualmente, durante el cierre financiero y cuando se actualiza el forecast de headcount.`
- `B0-Q03.typical_context`: `Cuando Finanzas o People detectan variaciones relevantes entre el headcount real, el presupuesto aprobado y el forecast vigente.`
- `B0-Q03.primary_actor_scope`: `Analista financiero responsable de seguimiento de headcount por unidad de negocio.`

## Contrato causal

Condicion inicial:
- UI en `Significado de tu trabajo`
- `Actividad 1 de 8`
- progreso `3/4 secciones listas para revisar`
- B0-Q03 visible y pendiente con tres campos vacios
- `Continuar a la siguiente actividad` deshabilitado

Accion para el siguiente tramo:
- completar los tres campos B0-Q03 con los textos autorizados.

Evento esperado:
- eventos de input
- actualizacion local del estado visual
- recalculo de validacion de completitud de B0-Q03

Mecanismo esperado:
- componente interno `SignificadoDeTuTrabajo`
- actualizacion de `visualDraft`
- validacion `isQuestionPrepared`
- progreso formateado por `formatBlock0QuestionProgress`
- sin endpoint observado para esta transicion

Condicion resultante esperada:
- B0-Q03 queda listo o equivalente
- progreso pasa de `3/4` a `4/4`
- `Continuar a la siguiente actividad` podria habilitarse si el resto de gates oficiales permanece completo
- sin errores
- sin DB, Supabase, migracion, SQL ni observer

## Traza tecnica

- `src/features/runtime/block0-catalog-snapshot.ts`: define B0-Q03 como `compound` con `frequency_base`, `typical_context` y `primary_actor_scope`.
- `src/components/significado/SignificadoDeTuTrabajo.tsx`: `isQuestionPrepared` requiere todos los subcampos de una pregunta compuesta, salvo `user_correction_note`.
- `src/components/significado/SignificadoDeTuTrabajo.tsx`: `canContinue` depende de `isBlock0ReviewComplete`, ademas de gates locales del WorkMap/submission.
- `src/features/significado/significado-copy.ts`: `formatBlock0QuestionProgress` muestra `<preparadas>/<total> secciones listas para revisar`.
- Referencias oficiales: `docs/audits/CLOSEOUT_SIGNIFICADO_UI_VISUAL_FINAL_FROZEN_V1_0.md`, `docs/audits/AUDIT_SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md`, `tests/regression/e2e-block0-demo-contract.test.ts`.

## Dictamen

El contrato causal de B0-Q03 queda listo para ejecucion posterior. No se llenaron campos B0-Q03 y no se presiono `Continuar`.

