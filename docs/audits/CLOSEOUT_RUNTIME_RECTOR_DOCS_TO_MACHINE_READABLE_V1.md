# CLOSEOUT — RUNTIME-RECTOR-DOCS-TO-MACHINE-READABLE-V1

## 1. Dictamen

RECTOR_DOCS_MACHINE_READABLE_FOUNDATION_READY_WITH_GAPS

La fundacion machine-readable quedo creada y testeada. El gap deliberado es que Runtime 40/20 completo aun no esta materializado como catalogo ejecutable completo; solo B0 tiene counterpart JSON/TS validado.

## 2. Archivos Creados/Modificados

Creados:

- `docs/architecture/RECTOR_DOCS_MACHINE_READABLE_STRATEGY_V1.md`
- `docs/runtime/primary-activity-selection-policy.v1.3.md`
- `docs/runtime/runtime-40-20-machine-readable-map.md`
- `docs/runtime/block0-machine-readable-contract.md`
- `src/config/rector-docs-registry.ts`
- `src/features/runtime/catalog/runtime-40-20.manifest.json`
- `src/features/runtime/block0/block0.catalog.json`
- `src/features/runtime/block0/block0.catalog.types.ts`
- `src/features/runtime/block0/block0.catalog.validator.ts`
- `tests/regression/rector-docs-registry.test.ts`
- `tests/regression/runtime-block0-machine-readable-contract.test.ts`
- `docs/audits/CLOSEOUT_RUNTIME_RECTOR_DOCS_TO_MACHINE_READABLE_V1.md`

No se modifico codigo productivo existente para conectar el adapter al JSON en esta V1.

## 3. Regla Arquitectonica Adoptada

`.docx/.xlsx` quedan como fuentes editoriales, historicas o de auditoria.

`.md` queda como documento rector humano canonico dentro de la repo.

`.json` queda como catalogo, manifest o tabla machine-readable.

`.ts` queda como reglas ejecutables, tipos, validadores, adapters y politicas.

Regla explicita: una politica o catalogo gobierna operacion solo cuando tiene representacion `.ts/.json` testeada. Un `.docx/.xlsx` sin counterpart machine-readable no gobierna runtime.

## 4. Registry

Se creo `src/config/rector-docs-registry.ts` con entradas para:

- `primary_activity_selection_v1_3`: `runtimeAuthority = true`, ejecutable en `src/domain/primary-activity-selection-policy.v1.3.ts`.
- `runtime_block0_catalog`: `runtimeAuthority = true`, snapshot TS actual y counterpart JSON B0.
- `runtime_block0_response_model_r1`: `runtimeAuthority = true`, response bundle R1.
- `workmap_to_block0_prefill`: `runtimeAuthority = true`, prefill contextual no-evidencial.
- `runtime_40_20_full_catalog`: `runtimeAuthority = false`, estado parcial.

## 5. Primary Activity Selection v1.3

Fuente ejecutable actual:

- `src/domain/primary-activity-selection-policy.v1.3.ts`

XLSX v1.2 queda documentado solo como antecedente editorial/deprecated. No aparece como `executableTs` y no es autoridad runtime.

Tests:

- `tests/regression/primary-activity-selection-policy.test.ts`

## 6. Runtime 40/20 Manifest

Se creo `src/features/runtime/catalog/runtime-40-20.manifest.json`.

El manifest declara:

- presupuesto base 40;
- maximo causal adaptativo 20;
- B0 como `machine_readable_partial`;
- referencia al JSON B0;
- adapter/snapshot TS vigente;
- lista `notYetMachineReadable` para B0.5, B1-B7, causales 20, branching, readiness y budget.

## 7. Block0 Catalog JSON

Se creo `src/features/runtime/block0/block0.catalog.json`.

Contiene B0-Q01, B0-Q02, B0-Q03 y B0-Q04 con:

- IDs y orden runtime;
- texto visible y ayuda;
- `sourceRuntimeInteractionId`;
- `technicalLabel`;
- `uiComponent`;
- `responseKind`;
- subcampos B0-Q01 y B0-Q03;
- metadata suficiente para separabilidad B0-Q04;
- variables canonicas;
- source refs;
- reglas de storage/riesgo cuando existen.

Se creo validador en `src/features/runtime/block0/block0.catalog.validator.ts`.

## 8. Que NO Se Hizo

- No se convirtio todo Runtime 40/20.
- No se conecto el adapter B0 al JSON; sigue leyendo el snapshot TS actual.
- No se avanzo a Bloque 0.5.
- No se toco UI.
- No se toco WorkMap visual.
- No se toco Significado UI.
- No se toco Supabase, API ni SQL.
- No se tocaron `package.json`, `package-lock.json` ni `middleware.ts`.
- No se toco `src/app/page.tsx` durante esta tarea; aparece en `git status` por cambios preexistentes del workspace.

## 9. Tests Con Exit Codes

- `node --test tests/regression/rector-docs-registry.test.ts` -> exit code 0, PASS 6/6
- `node --test tests/regression/runtime-block0-machine-readable-contract.test.ts` -> exit code 0, PASS 8/8
- `node --test tests/regression/primary-activity-selection-policy.test.ts` -> exit code 0, PASS 12/12
- `node --test tests/regression/runtime-block0-catalog-adapter.test.ts` -> exit code 0, PASS 9/9
- `node --test tests/regression/runtime-block0-response-model.test.ts` -> exit code 0, PASS 12/12
- `node --test tests/regression/workmap-to-block0-prefill.test.ts` -> exit code 0, PASS 15/15

## 10. Git Status / Diff

El workspace ya tenia cambios y archivos no trackeados antes de esta tarea. La entrega de esta tarea se limita a los archivos nuevos listados en la seccion 2.

Observacion de auditoria: `git diff --name-only` sobre archivos prohibidos muestra `src/app/page.tsx`, pero ese diff era preexistente y no fue modificado en esta tarea.

## 11. Recomendacion

B. Conectar Block0 adapter al JSON machine-readable.

Siguiente paso recomendado: migrar el adapter B0 desde el snapshot TS hacia el JSON validado, manteniendo el snapshot como referencia hasta que los tests de contrato prueben equivalencia completa.
