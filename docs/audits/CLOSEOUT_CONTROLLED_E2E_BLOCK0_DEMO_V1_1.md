# CLOSEOUT — CONTROLLED-E2E-BLOCK0-DEMO-V1_1

## 1. Dictamen

**CONTROLLED_E2E_BLOCK0_DEMO_APPROVED_WITH_MINOR_GAPS**

La demo `/dev/e2e-block0` cumple el recorrido Login demo → Estado A → WorkMap → Significado, con prefill B0-Q01, gate Continue bloqueado y traza dev de selección 17→8. Queda verificación host manual pendiente por entorno local.

## 2. Ajustes realizados

### Progreso Block 0
- Copy visible: `formatBlock0QuestionProgress` ahora muestra `{n}/{total} secciones listas para revisar` (ya no “revisadas”).
- `SIGNIFICADO_BLOCK0_PROGRESS_LABEL` → “Progreso del recorrido”.
- Métrica interna renombrada a `prepared`; fila B0-Q01 prellenada sin edición del usuario queda en estado pendiente (`isQuestionConfirmedByUser`).

### Prefill B0-Q01 — “Qué queda listo”
- `normalizeWorkMapOutputPresentation()` elimina conectores iniciales (`para entregar…`, `para generar…`, `para validar…`) solo en presentación visual.
- El literal WorkMap original sigue trazable vía `detectActivityParts` y snapshot WorkMap.

### Demo E2E
- Fixture financiero ampliado: **3 responsabilidades · 17 actividades**.
- Contrato verificado: **8 actividades primarias** vía `PrimaryActivitySelectionPolicy`.
- Encabezado demo: `Login demo → Comienza tu levantamiento → WorkMap → Significado`.
- Fase inicial confirmada: `login` → `estado_a` → `work_map` → `significado`.

### Traza dev
- Panel “Ver traza demo” muestra: detectadas (17), primarias (8), actividad actual (1 de 8), título, fuente `PRIMARY_ACTIVITY_SELECTION_V1_2`, progreso Block 0, Continue habilitado.
- Sin scores ni ranking en superficie principal.

## 3. Flujo visible probado

| Etapa | Estado |
|---|---|
| Login demo | Implementado (`ClientAuthScreen`, botón demo) |
| Estado A | Implementado (`EmptyAssessmentState`) |
| WorkMap | Implementado (`WorkMapIntake`, ejemplo 17 actividades) |
| SelectionPolicy | Implementado (`selectPrimaryActivitiesFromWorkMap`) |
| Significado | Implementado (`SignificadoDeTuTrabajo`, Actividad 1 de 8) |
| Bloque 0 | Prefill B0-Q01; B0-Q02/Q03 vacíos; B0-Q04 espera B0-Q02; Continue deshabilitado |

Verificación automatizada vía tests de contrato. Verificación browser manual no completada en esta sesión.

## 4. Progreso B0

- **Preparada** = sección con información disponible (incluye prefill WorkMap).
- **Confirmada por usuario** = fila marcada completa solo si el usuario editó B0-Q01 respecto al prefill inicial, o completó B0-Q02/Q03/Q04 con sus reglas propias.
- El badge muestra preparación (`listas para revisar`), no confirmación humana.
- Continue sigue exigiendo 4/4 secciones preparadas; prefill solo no habilita Continue.

## 5. Prefill B0-Q01

Ejemplo:
- Entrada parser: `para entregar un documento de criterios vigentes al equipo de presupuestos`
- Salida visual: `documento de criterios vigentes para el equipo de presupuestos`

Regla aplicada en `output_or_result` únicamente; no altera verbo, objeto ni procedimiento.

## 6. Traza dev

Confirmado en tests:
- `detectedActivityCount = 17`
- `selectedPrimaryCount = 8`
- `currentPrimaryIndex = 1` (primera primaria)
- `selectionPolicyVersion = PRIMARY_ACTIVITY_SELECTION_V1_2`

## 7. Tests con exit codes

| Suite | Resultado |
|---|---|
| `e2e-block0-demo-contract.test.ts` | pass 10/10, exit 0 |
| `workmap-to-block0-prefill.test.ts` | pass 15/15, exit 0 |
| `significado-de-trabajo-slice.test.ts` | pass 20/20, exit 0 |
| `runtime-block0-catalog-adapter.test.ts` | pass 9/9, exit 0 |
| `runtime-block0-response-model.test.ts` | pass 12/12, exit 0 |
| `primary-activity-selection-policy.test.ts` | pass 10/10, exit 0 |

`significado-flow-wiring`: no ejecutado; baseline git preexistente reportaría `BASELINE_CONTAMINATION_PREEXISTING`.

## 8. Git status / diff

```
BASELINE_CONTAMINATION_PREEXISTING
```

Git no disponible de forma confiable en el entorno de ejecución (ownership / no repo).

## 9. Recomendación

**A. Aprobar Bloque 0 y pasar a Bloque 0.5**

Condición: una pasada manual en `/dev/e2e-block0` confirmando el recorrido visual y el copy “listas para revisar” con B0-Q01 prellenado.

FIN — CONTROLLED-E2E-BLOCK0-DEMO-V1_1
