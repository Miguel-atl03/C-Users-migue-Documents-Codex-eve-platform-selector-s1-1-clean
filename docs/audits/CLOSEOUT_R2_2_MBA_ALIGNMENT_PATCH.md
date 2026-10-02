# CLOSEOUT R2.2 - MBA alignment patch

## Dictamen

Estado: MBA_ALIGNMENT_READY_WITH_DEVIATIONS

La pantalla `Significado de tu trabajo` quedo alineada como umbral operacional entre WorkMap H12 y `questionnaire_main`. Ya no opera como pantalla donde el usuario prioriza, selecciona o decide actividades diagnosticas. La seleccion primaria evaluable queda declarada como responsabilidad de EVE y pendiente de politica completa.

Desviaciones:

- `npx.cmd tsc --noEmit` no compilo por `ENV_BLOCKED`: npm intento acceder a registry/cache y fallo con `EACCES`.
- `npm run lint` no arranco porque `eslint` no esta disponible localmente.
- `node_modules/next/dist/docs/` no existe en este workspace, por lo que no fue posible leer la guia local de Next requerida por AGENTS.
- `src/app/page.tsx` y `src/lib/types.ts` siguen apareciendo como diffs previos de R2.2 wiring.

## Archivos tocados

- `src/components/significado/SignificadoDeTuTrabajo.tsx`
- `src/features/significado/significado-copy.ts`
- `src/features/significado/significado-draft-state.ts`
- `src/domain/significado-de-trabajo.ts`
- `src/services/significado-activity-anchor-adapter.ts`
- `tests/regression/significado-de-trabajo-slice.test.ts`
- `tests/regression/significado-activity-anchor-adapter.test.ts`
- `tests/regression/significado-mba-alignment.test.ts`
- `docs/audits/CLOSEOUT_R2_2_MBA_ALIGNMENT_PATCH.md`
- `docs/audits/CLOSEOUT_R2_2_SIGNIFICADO_FLOW.md`
- `docs/audits/CLEAN_INTEGRATION_SANDBOX_PREP.md`

## Cambios aplicados

- Se removio de la pantalla activa la captura de prioridad, claridad, energia y carga.
- Se dejo `Significado` como pantalla de preparacion operacional: EVE prepara preguntas desde el WorkMap y conserva el resto como contexto.
- Se mantiene resumen de WorkMap, aviso de mapa guardado con advertencias, continuar a preguntas y volver al mapa.
- Se agrego gobernanza explicita en bundle/payload:
  - `selectionGovernance: "eve_policy_required"`
  - `primaryActivitySelectionPolicy: "not_implemented_in_r2_2"`
  - `userPriorityDoesNotSelectRuntimeActivities: true`
  - `primaryActivitySelectionResolvedByUser: false`
- `selectedPrimaryActivityId` queda como campo deprecated de compatibilidad y no se deriva de preferencia del usuario.
- `captureMode`, prioridad, claridad y energia quedan como compatibilidad de draft/contrato legacy; la prioridad legacy no se transporta en el bundle activo y ninguna de esas variables gobierna seleccion Runtime.
- `buildSignificadoSubmitPayload` conserva `workMapSnapshot`, `traceableActivities` y boundary locks en `false`.

## Reglas MBA satisfechas

- Significado no permite que el usuario elija actividades diagnosticas.
- Significado funciona como ancla entre WorkMap H12 y `questionnaire_main`.
- La seleccion primaria evaluable no queda resuelta por usuario.
- PrimaryActivitySelectionPolicy queda explicitamente pendiente en R2.2.
- No se implemento selector completo ni seleccion de 8 actividades por usuario.
- No hay API phase `significado` o `sentido`.
- No se tocaron APIs, Supabase, Runtime, SQL, package files ni `SceneQuestionnaireRunner`.

## Tests

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | 6/6 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | 7/7 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | 4/4 pass |

## TypeScript y lint

| Comando | Exit code | Resultado |
| --- | ---: | --- |
| `npx.cmd tsc --noEmit` | 1 | ENV_BLOCKED por `EACCES` en npm registry/cache antes de compilar. |
| `npm run lint` | 1 | ENV_BLOCKED: `eslint` no se reconoce como comando local. |

## Contaminacion

`git diff --name-only`:

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

Esos dos diffs corresponden al wiring R2.2 previo permitido por el pedido. La verificacion explicita de diffs en WorkMapIntake, work-map services, APIs, Runtime, Scene runner y package files no produjo salida.

## Riesgos restantes

- Politica completa `PrimaryActivitySelectionPolicy` pendiente.
- `primaryActivity` permanece en el payload como ancla de compatibilidad, no como seleccion Runtime resuelta por usuario.
- `tsc` y `lint` no pudieron ejecutarse por entorno local incompleto/bloqueado.
- No branch, no commit.

## Recomendacion

Pasar a QA manual visual/funcional del flujo WorkMap -> Significado -> preguntas, manteniendo como desviaciones aceptadas `ENV_BLOCKED` para TypeScript/lint y politica EVE pendiente.
