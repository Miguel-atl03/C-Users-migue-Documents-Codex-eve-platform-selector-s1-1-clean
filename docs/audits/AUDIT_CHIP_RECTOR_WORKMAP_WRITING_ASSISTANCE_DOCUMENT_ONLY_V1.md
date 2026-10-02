# AUDIT - Chip Rector WorkMap Writing Assistance Document Only V1

## 1. Resumen ejecutivo

Dictamen documental: **CHIP_RECTOR_DOCUMENTED_NOT_WIRED**.

Se verificó y leyó la fuente original proporcionada por Miguel. El archivo fue encontrado originalmente con espacios en el nombre y se preservó una copia en la ruta oficial solicitada:

`docs/workmap/source/GUIA_DE_REDACCION_DE_RESPONSABILIDADES_Y_ACTIVIDADES_DE_UN_ROL_FUNCIONAL.docx`

Se creó el documento rector humano:

`docs/workmap/workmap-writing-assistance-chip.md`

No se cableó el chip. No se creó JSON ejecutable. No se creó TS validator. No se modificó código funcional.

## 2. Source verification

| Campo | Valor |
| --- | --- |
| originalSourcePath | `docs/workmap/source/GUIA_DE_REDACCION_DE_RESPONSABILIDADES_Y_ACTIVIDADES_DE_UN_ROL_FUNCIONAL.docx` |
| originalSourceExists | true |
| originalSourceReadInThisTask | true |
| sectionsUsed | Responsabilidades, Fórmula Espejo, verbos de poder, ejemplos, explicación sistémica, lateral de responsabilidades, actividades, Fórmula de Transformación, verbos operativos, ejemplos, explicación sistémica, lateral de actividades, ubicación de área |
| canMiguelCompareAgainstOriginal | true |

Nota de preservación: el DOCX apareció en `docs/workmap/source/GUIA DE REDACCION DE RESPONSABILIDADES Y ACTIVIDADES DE UN ROL FUNCIONAL.docx`; se copió a la ruta oficial con guiones bajos para usarla como `originalSourcePath`.

## 3. Documento oficial creado

Creado:

`docs/workmap/workmap-writing-assistance-chip.md`

Estado declarado dentro del documento:

- `CHIP_RECTOR_DOCUMENTED_NOT_WIRED`
- Fuente original proporcionada por Miguel.
- No cableado al runtime.
- No autoridad ejecutable todavía.
- Pendiente de comparación suficiente antes de cablear.

## 4. Qué se transdujo al MD

| Unidad fuente | Estado |
| --- | --- |
| Fórmula Espejo | transduced_structured |
| Verbos de poder | transduced_structured |
| Ejemplos de responsabilidad | transduced_structured |
| Explicación sistémica responsabilidad | transduced_structured |
| Lateral responsabilidad | transduced_structured |
| Fórmula de Transformación | transduced_structured |
| Verbos operativos | transduced_structured |
| Ejemplos de actividad | transduced_structured |
| Explicación sistémica actividad | transduced_structured |
| Lateral actividad | transduced_structured |
| Ubicación de área | transduced_structured |

Coverage machine-readable:

`docs/audits/_workmap_writing_assistance_source_coverage_v1.json`

## 5. Comparación contra código actual

| documentRule | codeStatus | codePath | testCoverage | riskIfWiredNow |
| --- | --- | --- | --- | --- |
| Fórmula Espejo | partially_implemented | `WorkMapIntake.tsx`, `work-map-responsibility-validation.ts` | `work-map-save-validation.test.ts` | Puede volver rígida una operación hoy más tolerante. |
| Verbos de poder y débiles | partially_implemented | `WorkMapIntake.tsx`, `work-map-responsibility-validation.ts` | `work-map-save-validation.test.ts` | `gestionar` es débil para responsabilidad pero existe como verbo de actividad. |
| Tarea vs responsabilidad | implemented_in_code | `WorkMapIntake.tsx`, `work-map-responsibility-validation.ts` | `work-map-save-validation.test.ts` | Riesgo bajo si queda como guía; medio como hard gate. |
| Fórmula de Transformación | implemented_in_code | `WorkMapIntake.tsx`, `work-map-activity-validation.ts` | `work-map-save-validation.test.ts`, `workmap-to-block0-prefill.test.ts` | El código tiene heurísticas extra no documentadas. |
| Verbos operativos | implemented_differently | `work-map-activity-validation.ts`, `WorkMapIntake.tsx` | `work-map-save-validation.test.ts` | La lista de código es más amplia que la documental. |
| Ejemplos actividad/responsabilidad | partially_implemented | `WorkMapIntake.tsx`, validators | `work-map-save-validation.test.ts` | El código evita ejemplos inventados en asistencia dinámica. |
| Ubicación de área | implemented_in_code | `WorkMapIntake.tsx` | sin test directo identificado | Riesgo medio si se agregan gates sin pruebas. |
| No evidencia Runtime | implemented_in_code | `workmap-to-block0-prefill.ts` | `workmap-to-block0-prefill.test.ts` | Alto si se mezcla asistencia con evidencia confirmada. |
| Guardar H12 coverage-only | code_has_extra_behavior_not_in_doc | `work-map-operational-readiness.ts` | `work-map-operational-readiness.test.ts` | Alto si el documento se cablea como bloqueo semántico. |
| Guardrails emergentes | code_has_extra_behavior_not_in_doc | `work-map-activity-validation.ts` | `work-map-save-validation.test.ts` | Alto: el DOCX no contiene esas defensas finas. |

Comparación completa:

`docs/audits/_workmap_writing_assistance_doc_to_code_comparison_v1.json`

## 6. Qué coincide

- Responsabilidad como decisión, criterio, validación, autorización, prioridad o límite.
- Actividad como acción concreta y transformadora.
- Fórmula de actividad: acción, objeto, cómo/procedimiento y resultado.
- Ejemplos visuales de descuentos comerciales y facturas de proveedores.
- Ubicación de área por participación real, no solo departamento formal.
- Límite epistemológico de no convertir WorkMap en evidencia Runtime confirmada.

## 7. Qué difiere

- El DOCX usa una fórmula más normativa; el código usa heurísticas tolerantes.
- El DOCX condena `gestionar` como verbo débil; el código lo admite como verbo de actividad.
- El DOCX trae ejemplos; el código evita generar ejemplos inventados en asistencia dinámica.
- El lateral documental de actividad dice "cómo lo hago o qué dejo listo"; la operación actual también distingue casos donde faltan ambos o solo uno.
- El DOCX no modela attempts, inline assist, coverage vs syntax ni `allowed_with_warning`.

## 8. Qué existe en código pero no en documento

- `FieldValidationEntry`.
- `MAX_FIELD_ASSIST_ATTEMPTS`.
- `inline_assisted`.
- `needs_help`.
- `allowed_with_warning`.
- `lastMessageType: inline | syntax | coverage | none`.
- Banned ambiguous phrases.
- Regresión contra `Por ejemplo:` en asistencia dinámica.
- Readiness H12 coverage-only.
- Prefill WorkMap -> B0 con estados epistemológicos no confirmados.

## 9. Qué existe en documento pero no en código

- La expresión completa "Fórmula Espejo" como entidad nombrada.
- La tabla conceptual Viplan de verbos y significado sistémico.
- La explicación completa de "danza de culpables", microgerencia y absorción de variedad.
- La explicación completa de proceso fracturado y variedad espuria.
- Algunos verbos específicos del documento como `Traducir`, `Digitar`, `Soldar`, `Listar`.

## 10. Riesgos de cablear ahora

Cablear ahora podría romper comportamiento emergente creado por iteración/prueba-error.

Riesgos concretos:

- Convertir un documento rector humano en hard gate sin respetar tolerancias actuales.
- Romper tests que prohíben ejemplos inventados o frases ambiguas.
- Bloquear Guardar H12 por semántica cuando hoy debe ser coverage-only.
- Reducir la lista de verbos operativos actual.
- Confundir texto de WorkMap con evidencia Runtime confirmada.
- Alterar el flujo WorkMap -> Significado sin fase de equivalencia.

## 11. Recomendación

Recomendación elegida: **A. Mantener documento como chip rector no cableado.**

Siguiente paso recomendado antes de cualquier cableado:

**B. Hacer ronda de comparación visual/funcional con WorkMap antes de cablear.**

Solo después conviene evaluar:

- C. Crear JSON provisional no ejecutable.
- D. Cablear en fase posterior, si se demuestra equivalencia.

## Tests ejecutados

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | pass 190/190 |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | pass 13/13 |

Ambos tests emitieron warnings `MODULE_TYPELESS_PACKAGE_JSON`, sin fallar.
