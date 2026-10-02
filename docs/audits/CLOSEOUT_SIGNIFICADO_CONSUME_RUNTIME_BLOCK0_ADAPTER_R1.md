# CLOSEOUT · Significado consume Runtime Block0 Adapter R1

## 1. Dictamen

**SIGNIFICADO_BLOCK0_ADAPTER_CONNECTED_WITH_GAPS**

Significado ya consume B0-Q01...B0-Q04 desde `getRuntimeBlock0InteractionViewModels()` mediante la capa de compatibilidad `src/features/significado/runtime-block0-canonical.ts`.

Gap vivo: `BASELINE_CONTAMINATION_PREEXISTING`. El workspace ya contiene diffs trackeados fuera de este alcance, incluyendo `src/app/admin/runtime-vsm/page.tsx` y `src/app/page.tsx`. No se corrigieron ni limpiaron por instrucción explícita.

## 2. Archivos tocados

- `src/features/significado/runtime-block0-canonical.ts`
- `src/components/significado/SignificadoDeTuTrabajo.tsx`
- `tests/regression/significado-de-trabajo-slice.test.ts`
- `docs/significado/SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md`
- `docs/audits/CLOSEOUT_SIGNIFICADO_CONSUME_RUNTIME_BLOCK0_ADAPTER_R1.md`

No se modificó `tests/regression/significado-mba-alignment.test.ts`.

## 3. Qué cambió

- `RUNTIME_BLOCK0_CANONICAL_QUESTIONS` dejó de ser una lista local de preguntas.
- Se agregó `getSignificadoBlock0QuestionsForScreen()`, que llama `getRuntimeBlock0InteractionViewModels()` y mapea el contrato Runtime al modelo que ya consume la pantalla.
- El mapper conserva `sourceRuntimeInteractionId`, `sourceSheetRefs`, `technicalLabel`, `helpTextKind`, `canonicalHelpStatus`, `canonicalVariables` y `subfields`.
- La UI conserva el mismo componente y layout; solo se neutralizó `data-help-kind` para no filtrar `canonical` / `fallback_no_canonico` al DOM.
- El freeze operativo recibió una nota R1 mínima indicando que la fuente formal de B0 ahora es el adapter R0.

## 4. Qué NO cambió

- No cambió UI visual.
- No cambió WorkMap.
- No cambió `page.tsx`.
- No API.
- No Supabase.
- No Runtime engine completo.
- No package files.
- No SQL.
- No middleware.
- No contrato del adapter R0.

## 5. Fuente de B0

| Interacción | Fuente adapter | UI mapping | Help kind | Se muestra en UI |
|---|---|---|---|---|
| B0-Q01 | `getRuntimeBlock0InteractionViewModels()` | `compound`, subcampos separados; oculta corrección libre como antes | `canonical` | Sí |
| B0-Q02 | `getRuntimeBlock0InteractionViewModels()` | `textarea` + coach existente | `fallback_no_canonico` | Sí |
| B0-Q03 | `getRuntimeBlock0InteractionViewModels()` | `compound`, frecuencia/contexto/actor separados | `fallback_no_canonico` | Sí |
| B0-Q04 | `getRuntimeBlock0InteractionViewModels()` | mantiene panel inicio/cierre congelado aunque adapter lo entregue como single answer | `fallback_no_canonico` | Sí |

## 6. Tests con exit codes

| Comando | Exit code | Resultado |
|---|---:|---|
| `node --test tests/regression/runtime-block0-catalog-adapter.test.ts` | 0 | PASS, 9/9 |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | PASS, 17/17 |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 1 | FAIL, 3/4; `BASELINE_CONTAMINATION_PREEXISTING` por `src/app/admin/runtime-vsm/page.tsx` |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | PASS, 7/7 |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 0 | PASS, 10/10 |

## 7. Verificación manual /dev/significado

Verificación por HTTP local contra `http://localhost:3000/dev/significado`:

- `STATUS=200`
- `HAS_TITLE=True`
- `HAS_B0Q01=True`
- Sin coincidencias para `CANONICAL_HELP_MISSING`, `fallback_no_canonico`, `sourceSheetRefs`, `payload`, `gates`, `score`, `MMABP`, `VSM`, `AHE`, `R2.1 isolated slice`, `solo para desarrollo` ni `Supabase`.

No hubo herramienta de control visual del navegador disponible en este turno; la verificación fue por respuesta HTTP renderizada.

## 8. Git status / diff

`git status --short` muestra contaminación baseline preexistente y muchos archivos untracked de tareas previas. Archivos R1 relevantes en estado acotado:

```text
?? docs/significado/SIGNIFICADO_UI_OPERATIONAL_FREEZE_V1.md
?? src/components/significado/SignificadoDeTuTrabajo.tsx
?? src/features/significado/runtime-block0-canonical.ts
?? tests/regression/significado-de-trabajo-slice.test.ts
?? tests/regression/significado-mba-alignment.test.ts
```

`git diff --name-only`:

```text
external-consumers/eve-platform/src/app/admin/runtime-vsm/page.tsx
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/domain/export.ts
external-consumers/eve-platform/src/lib/types.ts
external-consumers/eve-platform/src/services/export/activity-collection-xlsx.ts
external-consumers/eve-platform/src/services/export/activity-export-template-map.ts
external-consumers/eve-platform/src/services/export/session-export-consolidator.ts
external-consumers/eve-platform/src/services/export/xlsx-template.ts
```

El diff trackeado corresponde a baseline preexistente, no a R1. Los archivos tocados por R1 están en paths permitidos.

## 9. Gaps vivos

- No Runtime completo.
- No `activity_runtime_run` persistido.
- No `ResponseIngestService`.
- No `BranchingEngine`.
- No `BudgetLedger`.
- No `ReadinessEngine`.
- Prefill productivo WorkMap -> Block0 sigue pendiente.
- Contaminación baseline preexistente del workspace.

## 10. Recomendación

**A. Pasar a Runtime Block0 Response Model R1**, dejando explícitamente aislada o aceptada la contaminación baseline antes de exigir tests de diff global en verde.
