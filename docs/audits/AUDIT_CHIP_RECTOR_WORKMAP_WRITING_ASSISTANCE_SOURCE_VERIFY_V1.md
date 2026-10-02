# AUDIT - Chip Rector WorkMap Writing Assistance Source Verify V1

## 1. Resumen ejecutivo

Dictamen de auditoria: **CHIP_RECTOR_ASSUMPTION_BASED** con riesgo de **fuente rectora faltante**.

El workspace correcto fue verificado en `external-consumers\eve-platform` del clean clone. No se encontro un documento original `.docx`/`.xlsx` especifico de WorkMap que gobierne el chip `workmap_responsibility_activity_writing_assistance`.

Si existe ayuda real en producto actual: la asistencia vive en codigo y tests, especialmente en los servicios de validacion/redaccion de WorkMap. Sin embargo, esa ayuda no queda certificada como chip rector documental porque no hay fuente original fisica ni MD canonico presente para compararla.

## 2. Definicion del chip rector

`chipRectorId`: `workmap_responsibility_activity_writing_assistance`

Dominio: `workmap`

Proposito: gobernar la ayuda que EVE ofrece al usuario para redactar:

- Responsabilidades: verbo de accion verificable + objeto de discrecionalidad + contexto de regulacion/restriccion.
- Actividades: verbo operativo + objeto/insumo + procedimiento/regla + producto/salida.

Este chip no selecciona actividades primarias, no decide las 8 actividades, no cierra evidencia Runtime, no reemplaza Significado y no convierte WorkMap en evidencia Runtime confirmada.

## 3. Fuente original encontrada o no encontrada

No se encontro fuente original WorkMap `.docx`/`.xlsx`.

Archivos Office fisicos encontrados en `docs/**`:

| Archivo | Relacion con este chip |
| --- | --- |
| `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | Runtime 40/20, no WorkMap writing assistance. |
| `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` | Runtime tecnico, no WorkMap writing assistance. |
| `docs/significado/canon/Descripción_Operativa_cerebro AI.docx` | Significado/ASRO, no WorkMap writing assistance. |

Documentos esperados o citados que no existen fisicamente:

| Fuente esperada | Evidencia | Estado |
| --- | --- | --- |
| `docs/work-map-intake-ui-standard.md` | Comentario en `src/components/WorkMapIntake.tsx:1` | Missing |
| `docs/work-map-intake-operational-logic.md` | Comentario en `src/components/WorkMapIntake.tsx:389` | Missing |
| `docs/work-map-assistance-semantic-canon.md` | Listado como paquete esperado en `WORKMAP_H12_BASELINE_DISCOVERY.md` | Missing |

Clasificacion de fuente: **CODE_ONLY / ASSUMPTION_BASED**, no certificable como fuente rectora.

## 4. Inventario de archivos relevantes

Inventario machine-readable creado en:

`docs/audits/_chip_rector_workmap_writing_assistance_inventory_v1.json`

Resumen:

| sourcePath | sourceType | Resp. guidance | Activity guidance | Assistance logic | Validation only | Visible copy | Executable rules | Relevance | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/components/WorkMapIntake.tsx` | tsx | true | true | true | false | true | true | high | Copy visible, ejemplos, verb chips, FieldAssistCard y readiness. |
| `src/domain/work-map.ts` | ts | false | false | true | false | false | true | high | Estados de suficiencia/asistencia/intentos/declarative context. |
| `src/services/work-map-activity-validation.ts` | ts | false | true | true | false | false | true | high | Parser/coach de verbo, objeto, como/procedimiento y resultado. |
| `src/services/work-map-responsibility-validation.ts` | ts | true | false | true | false | false | true | high | Parser/coach de decision, objeto, proposito y limite/criterio. |
| `src/services/work-map-save-validation.ts` | ts | true | true | true | false | false | true | high | Orquestacion semantica legacy y attempts. |
| `src/services/work-map-operational-readiness.ts` | ts | false | false | false | true | false | true | medium | Guardar H12 coverage-only. |
| `tests/regression/work-map-save-validation.test.ts` | test | true | true | true | false | false | false | high | Congela asistencia personalizada y limites. |
| `tests/regression/work-map-operational-readiness.test.ts` | test | false | false | false | true | false | false | medium | Congela readiness coverage-only. |
| `tests/regression/workmap-to-block0-prefill.test.ts` | test | false | false | false | true | false | false | medium | Prefill B0, chip distinto. |
| `docs/audits/WORKMAP_H12_BASELINE_DISCOVERY.md` | audit | false | false | false | true | false | false | high | WorkMap H12 existe solo en dirty tree y lista fuentes esperadas. |
| `docs/audits/WORKMAP_H12_PACKAGE_PREP.md` | audit | false | false | false | true | false | false | high | Confirma H12 package con desviaciones. |

## 5. Que gobierna responsabilidades

Codigo principal:

- `src/services/work-map-responsibility-validation.ts`
- `src/domain/work-map.ts`
- `src/components/WorkMapIntake.tsx`
- `tests/regression/work-map-save-validation.test.ts`

Mapa provisional:

| Elemento | Evidencia actual |
| --- | --- |
| Verbo esperado | Decision/autoridad: `defino`, `apruebo`, `autorizo`, `valido`, `priorizo`, `regulo`. |
| Objeto | Se detecta sobre que responde el usuario. |
| Proposito | Se busca para que sirve la responsabilidad. |
| Limite/criterio | Se sugiere cuando falta criterio, margen, regla o condicion. |
| Ayuda visible | Copy en WorkMap explica responsabilidad como decision, no tarea suelta. |
| Suficiencia | Puede ser suficiente, perfectible, insuficiente o aceptada con warning segun estado. |
| No inferir | No debe convertirse responsabilidad generica en actividad primaria ni evidencia Runtime confirmada. |

## 6. Que gobierna actividades

Codigo principal:

- `src/services/work-map-activity-validation.ts`
- `src/services/work-map-save-validation.ts`
- `src/components/WorkMapIntake.tsx`
- `tests/regression/work-map-save-validation.test.ts`

Mapa provisional:

| Elemento | Evidencia actual |
| --- | --- |
| Verbo operativo | Detectado por `detectActivityParts()` y listas de verbos operativos. |
| Objeto/insumo | Detectado como aquello sobre lo que se trabaja. |
| Procedimiento/regla | Detectado como `how`; ayuda pide como se hace. |
| Producto/salida | Detectado como `result`; ayuda pide que queda listo al terminar. |
| Ayuda personalizada | Ejemplos de tests: pide "agrega como..." y "que queda listo..." con objeto contextual. |
| Limites | Evita checklist, `Por ejemplo:`, frases inventadas y preguntas ambiguas cuando no corresponden. |
| No inferir | WorkMap no confirma B0 ni evidencia Runtime; el prefill queda como inferencia/contexto. |

## 7. Que es asistencia y que es solo validacion

Hay asistencia real en servicios semanticos:

- `getActivityAssistMessage()`
- `getResponsibilityAssistMessage()`
- `detectActivityParts()`
- `detectResponsibilityParts()`
- `evaluateFieldValidationEntry()`

Tambien hay validacion/estado:

- `SufficiencyStatus`
- `AssistanceState`
- `FieldValidationEntry`
- `allowed_with_warning`
- `needs_help`

Pero el Guardar de WorkMap H12 esta gobernado por readiness coverage-only:

- `src/components/WorkMapIntake.tsx:1049` llama `evaluateWorkMapOperationalReadiness()`.
- `WORKMAP_H12_PACKAGE_PREP.md` confirma que Guardar no llama `processWorkMapValidationOnSave()`.

Conclusion: **existe asistencia real**, pero en H12 la accion Guardar no debe bloquear por semantica si la cobertura operativa ya esta completa.

## 8. Diferencia con ASRO, B0, Prefill y SelectionPolicy

| Chip | Ubicacion | Diferencia |
| --- | --- | --- |
| ASRO / descripcion operativa | Significado B0-Q02 | Redacta descripcion operativa profunda; no gobierna WorkMap. |
| WorkMap -> B0 Prefill | `src/services/workmap-to-block0-prefill.ts` | Consume literal WorkMap para B0-Q01; no ayuda a redactar WorkMap. |
| Primary Activity Selection v1.3 | `src/domain/primary-activity-selection-policy.v1.3.ts` y `src/services/primary-activity-selector.ts` | Selecciona actividades primarias; no ofrece coaching de redaccion. |
| Runtime B0 | `src/features/significado/runtime-block0-canonical.ts` y Runtime Block0 | Gobierna preguntas B0-Q01..B0-Q04; no es la ayuda de WorkMap. |

## 9. Source verification

- chipRectorId: `workmap_responsibility_activity_writing_assistance`
- sourceKind: `mixed`
- originalSourcePath: `N/A`
- originalSourceExists: `false`
- originalSourceReadInThisTask: `false`
- sourceSectionsOrSheetsUsed: `N/A`
- derivedArtifacts: `WorkMapIntake.tsx`, `work-map-activity-validation.ts`, `work-map-responsibility-validation.ts`, `work-map-save-validation.ts`, tests WorkMap, closeouts H12.
- comparisonReport: no hay documento original WorkMap para comparar. El comportamiento se reconstruye desde codigo/tests/closeouts.
- coverageStatus: `code_and_tests_cover_behavior_but_original_authority_missing`
- assumptionBased: `true`
- canMiguelCompareAgainstOriginal: `false`
- dictamen: `CHIP_RECTOR_ASSUMPTION_BASED`

## 10. Riesgos

- Asistencia implicita no documentada como chip rector.
- Codigo y tests gobiernan comportamiento sin fuente original verificable.
- Fuente original ausente o no incorporada al workspace.
- Riesgo de confundir validacion de coverage con asistencia semantica.
- Formula usada en producto y tests, pero no registrada como chip rector canonico.
- Si la redaccion WorkMap queda mal, puede contaminar seleccion primaria, prefill B0 y contexto de Runtime.
- WorkMap H12 sigue con historial sucio/untracked segun auditorias previas.

## 11. Recomendaciones

Recomendacion elegida: **C. Crear chip rector TS/JSON desde codigo actual, marcado assumption-based**.

Secuencia sugerida:

1. Pedir o subir fuente original si existe.
2. Si no existe, crear MD canonico provisional de WorkMap writing assistance.
3. Crear JSON de reglas de asistencia desde el comportamiento actual.
4. Registrar el chip como provisional en `rector-docs-registry`.
5. Solo despues transducir/certificar.

## Tests ejecutados

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | pass 13/13 |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | pass 190/190 |
| `node --test tests/regression/workmap-to-block0-prefill.test.ts` | 0 | pass 15/15 |
