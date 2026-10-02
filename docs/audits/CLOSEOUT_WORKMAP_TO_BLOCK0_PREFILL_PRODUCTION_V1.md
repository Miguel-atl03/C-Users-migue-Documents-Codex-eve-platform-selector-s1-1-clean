# CLOSEOUT — WORKMAP-TO-BLOCK0-PREFILL-PRODUCTION-V1

## 1. Dictamen

**WORKMAP_BLOCK0_PREFILL_PRODUCTION_READY_WITH_GAPS**

Producción queda con prefill real WorkMap → B0-Q01 integrado en `SignificadoDeTuTrabajo` sin tocar `page.tsx`. El contrato epistemológico se respeta: sugerencia editable, sin cierre automático, sin `captured_user_evidence` ni `user_confirmed_suggestion` antes de confirmación del usuario.

Gaps abiertos:
- `/dev/significado` sigue pasando `DEV_VISUAL_DRAFT` manual (archivo fuera de alcance permitido); el builder productivo no se ejerce ahí salvo que se elimine el override.
- Verificación host no completada en esta sesión (dev server con errores de entorno).
- Tests de wiring git (`significado-flow-wiring`, `significado-mba-alignment`) fallan por baseline preexistente (`BASELINE_CONTAMINATION_PREEXISTING`).

## 2. Archivos creados/modificados

**Creados**
- `src/services/workmap-to-block0-prefill.ts`
- `tests/regression/workmap-to-block0-prefill.test.ts`
- `docs/audits/CLOSEOUT_WORKMAP_TO_BLOCK0_PREFILL_PRODUCTION_V1.md`

**Modificados**
- `src/components/significado/SignificadoDeTuTrabajo.tsx`
- `src/features/significado/significado-draft-state.ts`
- `src/features/significado/runtime-block0-canonical.ts`
- `src/domain/significado-de-trabajo.ts`
- `tests/regression/significado-de-trabajo-slice.test.ts`
- `tests/regression/significado-mba-alignment.test.ts`

**No tocados (según restricción)**
- `src/app/page.tsx`
- APIs, Supabase, Runtime engine, `work-map-*` (solo import de `detectActivityParts`), `package.json`, SQL, middleware.

## 3. Qué se implementó

### Builder
`buildInitialBlock0VisualDraftFromWorkMap()` en `src/services/workmap-to-block0-prefill.ts`:
- Entrada: `workMap`, `primaryActivity`, `currentActivityTitle`, `declaredContext` opcional.
- Usa `detectActivityParts()` (estructura declarada del literal WorkMap, no NLP libre).
- Mapea hacia B0-Q01:
  - `action_verb` → `inferred_from_workmap`
  - `input_or_object` → `inferred_from_workmap`
  - `procedure_or_standard` → `context_from_workmap`
  - `output_or_result` → `inferred_from_workmap`
- Exporta `epistemicByAnswerKey` para auditoría/tests.
- No escribe B0-Q02, B0-Q03 ni B0-Q04.

### Integración Significado
En `SignificadoDeTuTrabajo`:
- `workMapBlock0Prefill` se calcula desde WorkMap + selección primaria EVE.
- `resolvedInitialVisualDraft` fusiona prefill WorkMap con `initialVisualDraft` (override dev).
- `visualDraft` arranca con prefill; preserva ediciones del usuario al rehidratar.
- `buildRuntimeBlock0ResponseBundle` recibe `initialAnswers: resolvedInitialVisualDraft` para trazabilidad epistemológica en submit.

### `page.tsx`
**No modificado.** El componente ya recibe `workMap` y `primaryActivitySelectionResult`; el prefill se resuelve internamente.

### Epistémica en catálogo visual
`procedure_or_standard` en B0-Q01 ahora declara `context_from_workmap` en `runtime-block0-canonical.ts`.

## 4. Qué NO se implementó

- Runtime nuevo, APIs, Supabase, persistencia remota de prefill.
- Bloque 0.5.
- Frecuencia, variación o actor inmediato inferidos desde rol/área.
- Copia de actividad WorkMap a B0-Q02.
- Cierre automático de B0-Q04.
- Actualización de `/dev/significado` (fuera de lista permitida).
- Rediseño de pantalla.

## 5. Estados epistemológicos

| Estado | Uso en prefill |
|---|---|
| `inferred_from_workmap` | verbo, objeto, salida (B0-Q01) |
| `context_from_workmap` | procedimiento/regla (B0-Q01) |
| `declared_unconfirmed` | reservado para área/rol declarados; no se vuelca a B0-Q03 sin campo explícito |

**Conversión posterior (en submit, vía `runtime-block0-response-model`):**
- Valor prefill sin cambio + confirmación → `user_confirmed_suggestion` / `workmap_prefill`.
- Valor modificado por usuario → `user_corrected_evidence`.
- Campo vacío luego llenado por usuario → `captured_user_evidence`.

El prefill nunca emite estados confirmados.

## 6. Gate

- Prefill de B0-Q01 puede marcar esa sección como revisable si los subcampos tienen valor.
- **Continue sigue bloqueado hasta 4/4** (`isBlock0ReviewComplete`).
- B0-Q02 vacío → B0-Q04 espera descripción operativa (`isActivityBoundaryQuestionComplete === false`).
- Prefill WorkMap **no** habilita Continue por sí solo.

## 7. Tests con exit codes

| Suite | Resultado |
|---|---|
| `workmap-to-block0-prefill.test.ts` | **pass 13/13**, exit 0 |
| `significado-de-trabajo-slice.test.ts` | **pass 20/20**, exit 0 |
| `runtime-block0-catalog-adapter.test.ts` | **pass 9/9**, exit 0 |
| `runtime-block0-response-model.test.ts` | **pass 12/12**, exit 0 |
| `primary-activity-selection-policy.test.ts` | **pass 10/10**, exit 0 |
| `significado-mba-alignment.test.ts` | **fail 1/4** — `git diff` no disponible (`BASELINE_CONTAMINATION_PREEXISTING`) |
| `significado-flow-wiring.test.ts` | **fail 2/7** — `intake_significado` en types + git diff (`BASELINE_CONTAMINATION_PREEXISTING`) |

## 8. Verificación host

**No verificada en browser en esta sesión.**

Motivo: dev server local reporta errores de entorno (Supabase/coach API). Para validar manualmente:
1. Flujo producción: WorkMap guardado → Significado.
2. Confirmar B0-Q01 prellenado (verbo/objeto/regla/salida según parser).
3. B0-Q02 vacío; B0-Q04 pendiente.
4. Continue bloqueado hasta 4/4.
5. Sin etiquetas internas visibles.

Nota `/dev/significado`: sigue usando `DEV_VISUAL_DRAFT` que **sobrescribe** el prefill del builder. Para probar el builder en dev habría que quitar ese override (cambio fuera de alcance).

## 9. Git status / diff

```
BASELINE_CONTAMINATION_PREEXISTING
```

`git status` / `git diff` no ejecutables en este entorno (repositorio no inicializado / dubious ownership en sandbox).

## 10. Recomendación

**B. Ajustar prefill WorkMap → B0**

Razones:
- Producción ya tiene prefill mínimo viable y gate epistemológico correcto.
- Cerrar gap de `/dev/significado` para validación visual del builder sin fixture manual.
- Resolver baseline git/types para que wiring tests vuelvan a ser confiables.

No avanzar a Bloque 0.5 hasta validación host explícita del flujo producción.

FIN — WORKMAP-TO-BLOCK0-PREFILL-PRODUCTION-V1
