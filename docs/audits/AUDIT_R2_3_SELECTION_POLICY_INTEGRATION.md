# AUDIT R2.3 · PrimaryActivitySelectionPolicy Integration

## 1. Dictamen ejecutivo

Estado: SELECTION_POLICY_REQUIRES_IMPLEMENTATION

El flujo R2.2 + MBA alignment esta listo para recibir una politica interna de seleccion primaria, pero esa politica aun no existe materialmente en el codigo. La integracion actual mantiene `Significado de tu trabajo` como umbral operacional/ancla entre WorkMap H12 y `questionnaire_main`, sin delegar seleccion diagnostica al usuario.

La decision de seleccion primaria todavia vive en el ranking legacy posterior al submit de Significado:

```text
WorkMap H12
  -> continueFromWorkMapToSignificado
  -> intake_significado
  -> SignificadoDeTuTrabajo
  -> submitSignificadoIntake
  -> runPostWorkMapQuestionnairePipeline
  -> flattenWorkMapToActivities(workMap completo)
  -> /api/intake/triple phase:"continue"
  -> rankActivities(databaseSessionId)
  -> bootstrapScenes(databaseSessionId)
  -> questionnaire_main
```

No hay `NO_GO`: la UI no volvio a delegar seleccion al usuario. No hay `BLOCKED`: WorkMap y Significado ya exponen datos suficientes para disenar la politica. El trabajo pendiente es implementacion R2.3.

## 2. Evidencia de comandos

| Comando | Exit code | Resultado | Observacion |
| --- | ---: | --- | --- |
| `pwd` | 0 | OK | Workspace: `C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform`. |
| `git status --short` | 0 | OK | Working tree con cambios previos/untracked del clean sandbox; no se detecta repo original. |
| `git branch --show-current` | 0 | OK | `master`. |
| `git diff --name-only` | 0 | OK | Solo diffs tracked previos: `src/app/page.tsx`, `src/lib/types.ts`. |
| `rg selectionGovernance... src tests docs` | 0 | Coincidencias | Confirma flags R2.2 y ausencia de policy completa en `src`. |
| `rg WorkMapData... src tests` | 0 | Coincidencias | Confirma disponibilidad de WorkMapData, declaredContext, savedWithWarnings y flattening. |
| `rg rankActivities... src tests docs` | 0 | Coincidencias | Confirma ranking legacy en `src/services/activity-ranker.ts` y `/api/rank-activities`. |
| `rg terminos prohibidos visibles... src/components/significado src/features/significado src/app/dev/significado/page.tsx` | 0 | Coincidencias tecnicas/dev | No aparece selector visible en componente principal; aparecen `payload`, `bundle`, `act-*` en dev/test-adjacent code, no como flujo usuario final. |
| `Get-ChildItem *PrimaryActivitySelectionPolicy*.xlsx` | 1 | MISSING_XLSX_IN_WORKSPACE | No se encontro workbook fisico; busqueda tropezó con carpetas temporales vacias heredadas, pero no encontro archivo rector. |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | PASS | 13/13. |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | PASS | 190/190. |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | PASS | 12/12. |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | PASS | 12/12. |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | PASS | 6/6. |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | PASS | 7/7. |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | PASS | 4/4. |
| `npx.cmd tsc --noEmit` | 1 | ENV_BLOCKED | `EACCES` contra npm registry/cache antes de compilar. |

Nota Next: `node_modules/next/dist/docs/` no existe en este workspace (`NEXT_DOCS_NOT_FOUND`), por lo que no se pudo leer guia local de Next.

## 3. Lectura rectora MBA + SelectionPolicy v1.2

MBA v1.1 exige:

- Significado es umbral operacional/ancla, no pantalla emocional, motivacional ni selector subjetivo.
- El usuario no decide actividades diagnosticas.
- WorkMap completo permanece como contexto total.
- No diagnostico, no export, no transduccion, no Produccion Paralela desde Significado.

SelectionPolicy v1.2 exige:

- EVE selecciona por evidencia estructural.
- El usuario confirma/corrige hechos, no decide metodologia.
- Salida principal: hasta 8 actividades primarias para Runtime 40+20.
- Runtime 40+20 se ejecuta por actividad primaria seleccionada.
- Catalogo Runtime no selecciona; ejecuta sobre actividades ya seleccionadas.
- WorkMap es inventario/contexto total, no criterio unico de utilidad estructural.
- Significado puede anclar/preparar, pero no sustituye scoring EVE.

Regla operativa v1.2:

- `0` elegibles: `reentry`, no avanzar a Runtime.
- `1-8` elegibles: `non_competitive_inclusion`, seleccionar todas las elegibles con control de calidad/cobertura/duplicados.
- `>8` elegibles: `competitive_selection`, aplicar scoring, gates y balance para seleccionar maximo 8.

Queda prohibido:

- Exponer selector diagnostico al usuario.
- Usar prioridad/claridad/energia/carga de Significado para seleccionar actividades.
- Tratar `inferred_from_workmap` como `captured_user_evidence` sin confirmacion.
- Eliminar actividades no primarias; deben quedar como contexto/backlog.

## 4. Estado actual del codigo

| Elemento | Existe | Evidencia | Comentario |
| --- | --- | --- | --- |
| `PrimaryActivitySelectionPolicy` | No | No hay archivo/servicio en `src`; solo aparece como string `not_implemented_in_r2_2` y en tests/docs. | Requiere implementacion R2.3. |
| `ActivityEvaluationSelector` | No | Sin coincidencias materiales en `src`. | No existe selector dedicado. |
| Politica real max 8 | No | `activity-ranker.ts` ordena por score y recomienda `primary_candidate` por umbral; no limita a 8. | Riesgo principal de R2.3. |
| `selectionGovernance` | Si | `significado-activity-anchor-adapter.ts` devuelve `"eve_policy_required"` en bundle/payload. | Senal contractual, no policy. |
| `primaryActivitySelectionPolicy` | Si, placeholder | `significado-activity-anchor-adapter.ts` fija `"not_implemented_in_r2_2"`. | Confirma deuda explicita. |
| `userPriorityDoesNotSelectRuntimeActivities` | Si | Bundle/payload lo fijan en `true`; tests lo verifican. | Correcto para MBA. |
| `traceableActivities` | Si | `buildSignificadoSubmitPayload` retorna actividades trazables desde WorkMap. | Buen input para policy. |
| `workMapSnapshot` | Si | Submit payload conserva `workMapSnapshot`. | Preserva contexto total. |
| `rankActivities` | Si, legacy | `src/app/page.tsx` llama `rankActivities(databaseSessionId)` despues de persistir WorkMap completo. | No consume Significado ni policy result. |
| `flattenWorkMapToActivities` | Si | `runPostWorkMapQuestionnairePipeline` ejecuta `flattenWorkMapToActivities(draft)`. | Usa WorkMap completo y genera ids `wm-*`. |

## 5. Datos disponibles para seleccion

| Dato | Origen | Disponible | Uso permitido | Riesgo |
| --- | --- | --- | --- | --- |
| Areas declaradas | `WorkMapData.selectedAreas/customAreas` | Si | Contexto funcional, cobertura/balance. | Declarado no confirmado. |
| Responsabilidades | `WorkMapData.responsibilities[].text/id` | Si | Agrupar, deduplicar, balance por bloque. | Puede mezclar actividad real y rol. |
| Actividades redactadas | `responsibilities[].activities[].text/id` | Si | Base de elegibilidad. | Texto puede ser incompleto. |
| `declaredContext` | `work-map.ts`, `work-map-flatten.ts`, Significado traceability | Si | Contexto y trazabilidad. | Estados declarados/unconfirmed. |
| `savedWithWarnings` | WorkMap H12 | Si | Gate de calidad. | No debe bloquear siempre; puede requerir reentry o warning. |
| `fieldValidationState` | WorkMap H12 | Si | Calidad sintactica/cobertura. | No equivale a valor estructural. |
| Start position context | `WorkMapData.startPositionContext` | Opcional | PreRuntime Context Bundle. | Puede no existir. |
| Flattened activities | `flattenWorkMapToActivities` | Si | Persistencia legacy actual. | Genera ids `wm-*`; pierde ids `act-*` estables si se usa como fuente primaria. |
| Traceable activities | `extractTraceableWorkMapActivities` | Si | Preferible para policy; conserva `act-*` y provenance. | Debe mapearse luego a persistencia legacy si pipeline no cambia. |

## 6. Datos de Significado

| Dato | Disponible | Puede seleccionar actividades | Uso permitido |
| --- | --- | --- | --- |
| `workMapSnapshot` | Si | No por si solo; es inventario/contexto | Input completo de policy/context bundle. |
| `traceableActivities` | Si | Si, como universo candidato; no como decision de usuario | Mantener ids/provenance y contexto total. |
| `selectionGovernance` | Si | No | Guard contractual. |
| `primaryActivitySelectionPolicy` | Si, placeholder | No | Senal de deuda R2.2. |
| `userPriorityDoesNotSelectRuntimeActivities` | Si | No | Guard anti-regresion. |
| `primaryActivitySelectionResolvedByUser` | Si, `false` | No | Guard anti-regresion. |
| `primaryActivity` | Si, compatibilidad | No | Ancla legacy; no debe usarse como seleccion final. |
| `selectedPrimaryActivityId` | Si, deprecated/empty | No | Compatibilidad, no decision. |
| prioridad/claridad/energia/carga legacy | Normalizacion legacy/draft | No | Solo compatibilidad; no criterio decisorio. |

## 7. Diseno de integracion propuesto

Arquitectura recomendada:

```text
WorkMap H12
  -> PrimaryActivitySelectionPolicy
  -> PrimaryActivitySelectionResult
  -> SignificadoDeTuTrabajo como pantalla de preparacion/anclaje
  -> submitSignificadoIntake
  -> runPostWorkMapQuestionnairePipeline con selection result o payload extendido
  -> questionnaire_main / Runtime 40+20
```

Ubicacion futura:

- `src/domain/primary-activity-selection-policy.ts`: tipos, modos, contratos, version y reglas puras.
- `src/services/primary-activity-selector.ts`: evaluacion de elegibilidad, scoring/gates/balance y armado de result.
- `tests/regression/primary-activity-selection-policy.test.ts`: casos 0 / 1-8 / >8 y guards MBA.

Momento de ejecucion recomendado:

- Despues de WorkMap H12 guardado/listo y antes de renderizar Significado.
- `continueFromWorkMapToSignificado(draft)` deberia calcular `PrimaryActivitySelectionResult` en memoria a partir de WorkMap/PreRuntime Context Bundle.
- Significado recibe el result como contexto interno, no como selector visible.
- `submitSignificadoIntake` pasa el result al pipeline post-WorkMap.

Input recomendado:

- `workMapSnapshot`
- `traceableActivities`
- `startPositionContext`
- calidad WorkMap: `savedWithWarnings`, `fieldValidationState`, coverage/readiness
- datos inferidos desde WorkMap marcados como `inferred_from_workmap`, no como evidencia capturada.

Output recomendado:

```ts
type PrimaryActivitySelectionMode =
  | "reentry"
  | "non_competitive_inclusion"
  | "competitive_selection";

type PrimaryActivitySelectionResult = {
  version: "PRIMARY_ACTIVITY_SELECTION_V1_2";
  mode: PrimaryActivitySelectionMode;
  selectedPrimaryActivities: SelectedPrimaryActivity[];
  nonPrimaryContextActivities: ContextActivity[];
  excludedActivities: ExcludedActivity[];
  gates: SelectionGateResult[];
  scoring?: SelectionScoreBreakdown[];
  selectionGovernance: "eve_policy";
  userSelectedActivities: false;
  maxPrimaryActivities: 8;
};
```

Entrada a Runtime/questionnaire:

- `selectedPrimaryActivities` debe determinar `questionnaireActivities`.
- `nonPrimaryContextActivities` debe persistirse o transportarse como contexto/backlog.
- El WorkMap completo debe seguir enviado/persistido para contexto total.
- El catalogo Runtime debe recibir actividades ya seleccionadas; no debe decidir seleccion.

## 8. Reglas 0 / 1-8 / >8

| Caso | Comportamiento | UI visible | Payload | Tests |
| --- | --- | --- | --- | --- |
| 0 elegibles | `reentry`; no avanzar a Runtime. | Mensaje humano de falta de informacion en mapa; volver a WorkMap. | `mode:"reentry"`, `selectedPrimaryActivities: []`, gates con causas. | `0 elegibles -> reentry`; no `rankActivities`; no `questionnaire_main`. |
| 1-8 elegibles | Incluir todas las elegibles tras QC/dedup. | Significado dice que EVE preparara preguntas; no lista ni selector. | `mode:"non_competitive_inclusion"`, todas en `selectedPrimaryActivities`, resto en contexto. | Todas elegibles incluidas; `userSelectedActivities:false`; locks false. |
| >8 elegibles | Scoring + gates + balance; max 8. | Igual, sin exponer metodologia al usuario. | `mode:"competitive_selection"`, max 8, scoring y no primarias preservadas. | Max 8; balance por cobertura; no primarias preservadas. |

## 9. Scoring, gates y balance

Estado: REQUIRES_XLSX_IMPLEMENTATION_DETAILS.

El workbook `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx` no esta fisicamente disponible en el workspace (`MISSING_XLSX_IN_WORKSPACE`). Para R2.3 se puede disenar la carcasa tecnica con las reglas normativas incorporadas, pero el detalle de scoring/gates/balance debe completarse al colocar el XLSX rector.

Diseno de alto nivel:

- Elegibilidad: actividad con texto estructuralmente suficiente, trazabilidad, objeto/resultado minimo y contexto de responsabilidad.
- Gates: calidad WorkMap, duplicados, vacios, actividades puramente administrativas sin material estructural, evidencia solo inferida.
- Scoring: variedad estructural MMABP, conectividad, dependencia/handoff, transformacion del objeto, regulacion/coordination signal, tension/exception signal.
- Balance: no saturar un solo bloque de responsabilidad/area; preservar variedad de cadena; maximo 8.
- No primarias: conservar como `nonPrimaryContextActivities`.

## 10. Cambios requeridos para R2.3 implementation

| Archivo futuro | Cambio | Riesgo | Test requerido |
| --- | --- | --- | --- |
| `src/domain/primary-activity-selection-policy.ts` | Definir tipos/version/modos/result. | Contrato incompleto si no refleja XLSX. | Type/shape tests. |
| `src/services/primary-activity-selector.ts` | Implementar elegibilidad, gates, scoring y balance. | Sesgo o seleccion por volumen. | 0 / 1-8 / >8, dedup, max 8. |
| `src/app/page.tsx` | Integrar ejecucion antes de Significado y pasar result al pipeline. | Tocar wiring sensible. | Wiring static test. |
| `src/domain/significado-de-trabajo.ts` | Extender payload con `primaryActivitySelectionResult`. | Romper compatibilidad. | Payload contract test. |
| `src/services/significado-activity-anchor-adapter.ts` | Recibir/transportar selection result sin decidir. | Reintroducir selector en Significado. | No user selection test. |
| `src/app/api/intake/triple/route.ts` o bridge futuro | Persistir/recibir seleccion y contexto si se decide hacerlo backend. | R2.4 backend pendiente. | API contract test, si se toca en R2.4. |
| `tests/regression/primary-activity-selection-policy.test.ts` | Nueva suite R2.3. | Cobertura insuficiente. | Casos normativos completos. |

## 11. Tests requeridos

- `0` elegibles -> `reentry`, no avanza a Runtime/questionnaire.
- `1-8` elegibles -> `non_competitive_inclusion`, incluye todas.
- `>8` elegibles -> `competitive_selection`, maximo 8.
- `userSelectedActivities === false`.
- `selectionGovernance === "eve_policy"`.
- `nonPrimaryContextActivities` preserva el resto del WorkMap.
- `excludedActivities` explica descartes/gates.
- No API/Supabase/Runtime nuevo si R2.3 sigue frontend/in-memory.
- Significado no muestra selector ni controles de candidatos.
- Payload locks: `diagnosticsEnabled`, `exportEnabled`, `transductionEnabled` siguen `false`.
- `rankActivities` no decide max 8 si ya hay selection result, o queda explicitamente reemplazado/compatibilizado.
- `inferred_from_workmap` no cuenta como `captured_user_evidence` sin confirmacion.

## 12. Riesgos

- Policy pendiente: hoy solo existe placeholder `not_implemented_in_r2_2`.
- No backend/persistencia R2.4: selection result podria perderse en refresh/restore.
- Ranking actual no consume Significado ni selection result; lee actividades persistidas y calcula `primary_candidate/support_pool`.
- `flattenWorkMapToActivities` usa ids `wm-*`; la policy deberia preferir `traceableActivities` con ids `act-*` y mapear a persistencia.
- Dev page de Significado muestra `payload`/`primaryActivity` tecnico; no es flujo usuario final, pero conviene limpiarlo o mantenerlo solo dev.
- `tsc` bloqueado por entorno (`ENV_BLOCKED`).
- Workbook XLSX no esta en workspace (`MISSING_XLSX_IN_WORKSPACE`).
- No branch/commit.

## 13. Recomendacion siguiente

Recomendacion: B, luego A.

Primero colocar/copiar el XLSX rector dentro del workspace para cerrar scoring/gates/balance con detalle normativo. Despues implementar R2.3 `PrimaryActivitySelectionPolicy` con suite propia y sin convertir Significado en selector visible.

## 14. Guards confirmados

- [x] No se modifico producto.
- [x] No se toco page.tsx.
- [x] No se toco types.ts.
- [x] No se toco Significado.
- [x] No se toco WorkMap.
- [x] No se tocaron APIs.
- [x] No se toco Supabase.
- [x] No se toco Runtime.
- [x] No se toco package.json.
- [x] No se hizo reset.
- [x] No se hizo checkout.
- [x] No se hizo stash.
- [x] No se hizo commit.
- [x] Solo se creo el reporte.

## 15. Respuestas obligatorias de auditoria

1. No existe `PrimaryActivitySelectionPolicy` completa en codigo; solo placeholder `not_implemented_in_r2_2`.
2. No existe `ActivityEvaluationSelector`.
3. No existe politica real de maximo 8 primarias.
4. Si: el codigo actual marca `primaryActivitySelectionPolicy` como `not_implemented_in_r2_2`.
5. WorkMap disponible: areas, responsabilidades, actividades, ids, `declaredContext`, `savedWithWarnings`, `fieldValidationState`, `startPositionContext` opcional.
6. Significado disponible: `workMapSnapshot`, `traceableActivities`, guards de gobernanza, locks. No usar prioridad/claridad/energia/carga ni `primaryActivity` compat como criterio.
7. Si: `runPostWorkMapQuestionnairePipeline` usa `flattenWorkMapToActivities(draft)` sobre WorkMap completo.
8. `rankActivities` consume datos persistidos post-continue desde `/api/intake/triple`; no consume Significado.
9. La politica deberia vivir en `src/domain/primary-activity-selection-policy.ts`, `src/services/primary-activity-selector.ts`, `tests/regression/primary-activity-selection-policy.test.ts`.
10. Debe ejecutarse despues de WorkMap H12 y antes de Significado; Significado recibe resultado como contexto interno.
11. `0` elegibles significa reentry: volver a completar/corregir WorkMap, no Runtime.
12. `1-8` elegibles significa incluir todas las elegibles, con QC/dedup.
13. `>8` elegibles significa seleccion competitiva, scoring/gates/balance, maximo 8.
14. El resto se conserva en `nonPrimaryContextActivities` y el `workMapSnapshot` completo.
15. Payload al Runtime/questionnaire: `PrimaryActivitySelectionResult`, actividades primarias seleccionadas, contexto no primario, gates/scoring, locks false.
16. Usuario ve texto humano de preparacion: EVE prepara preguntas; algunas actividades iran a mayor profundidad; el resto queda como contexto.
17. Usuario no ve selector, scoring, candidatos, VSM/MMABP/AHE, gaps, runtime, payload ni bundle.
18. R2.2 requiere nuevo domain/service/test, extender payload, integrar antes de Significado y reemplazar/compatibilizar ranking legacy.
19. Tests nuevos: 0/1-8/>8, max 8, no user selection, no primarias preservadas, locks false, no selector UI.
20. Riesgos pre-R2.4: perdida por refresh/restore, falta de persistencia, ranking legacy divergente, mapping `act-*` vs `wm-*`.
