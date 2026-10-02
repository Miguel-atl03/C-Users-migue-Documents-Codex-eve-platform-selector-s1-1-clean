# AUDIT · Runtime Block 0 Canonical Extraction

## 1. Dictamen

**BLOCK0_EXTRACTION_READY**

Se extrajeron con éxito **B0-Q01, B0-Q02, B0-Q03 y B0-Q04** desde el catálogo Runtime XLSX. La extracción no está bloqueada.

## 2. Fuente

| Artefacto | Path |
|---|---|
| XLSX Runtime (fuente implementable) | `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` |
| DOCX Runtime (contrato técnico) | `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` |

## 3. Hojas leídas

| Hoja | Filas no vacías | Uso en extracción |
|---|---:|---|
| `Runtime_Interactions_Base_40` | 40 | Fuente principal de B0-Q01 a B0-Q04 |
| `UX_Subfield_Structure` | 2 filas B0 | Ayuda/subcampos para B0-Q01 y B0-Q03 |
| `Canonical_Variables` | 4 filas B0 | Variables requeridas/opcionales/derivadas |
| `Branching_Budget_Rules` | revisada | Sin filas B0 directas; C01 referenciada por presupuesto |
| `Critical_Routes` | revisada | CR-B0 confirmado en inventario previo |
| `Readiness_Gaps_Reentry` | revisada | Estados de reentry asociados a evidencia faltante |
| `Runtime_Interactions_Causal_20` | 1 fila asociada | C01 variación de frecuencia/caso especial |

## 4. Tabla de extracción Bloque 0

| ID | Orden | Pregunta visible | Ayuda / fuente de ayuda | UI component | Subcampos | Required/optional | Source sheet |
|---|---:|---|---|---|---|---|---|
| B0-Q01 | 1 | Esto es lo que entendimos de esta actividad. ¿Está correcto? Si no, corrígelo para que diga qué haces, sobre qué trabajas y qué queda listo. | `qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo y corrección libre.` — `UX_Subfield_Structure.display_rule` (cláusula tras «subcampos separados para») | `confirmation_card_with_correction` | `action_verb; input_or_object; procedure_or_standard; output_or_result; user_correction_note` | required: `semantic_preload_used; activity_semantic_*; semantic_review_attempt_count` / optional: variables secundarias derivables | `Runtime_Interactions_Base_40` + `UX_Subfield_Structure` + `Canonical_Variables` |
| B0-Q02 | 2 | En tus palabras, ¿qué ocurre cuando haces esta actividad? | `Descripción operativa mínima` — `Runtime_Interactions_Base_40.function` | `guided_textarea_or_choice_plus_text` | `single_answer` | required: `activity_summary_literal / scene_summary_literal; activity_name_disambiguation; activity_scale_adjustment` | `Runtime_Interactions_Base_40` + `Canonical_Variables` |
| B0-Q03 | 3 | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? | `Frecuencia, contexto y actor inmediato` — `Runtime_Interactions_Base_40.function` | `compound_card_with_separable_subfields` | `frequency_base; typical_context; primary_actor_scope` | required: `activity_frequency_base / scene_frequency_base; activity_typical_context / scene_typical_context; activity_primary_actor_scope / scene_primary_actor_scope` | `Runtime_Interactions_Base_40` + `UX_Subfield_Structure` + `Canonical_Variables` |
| B0-Q04 | 4 | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? | `Inicio y cierre de la actividad` — `Runtime_Interactions_Base_40.function` | `guided_textarea_or_choice_plus_text` | `single_answer` | required: `activity_start_condition_hint / scene_boundary_start_hint; activity_end_result_hint / scene_boundary_end_hint; activity_boundary_clarification` | `Runtime_Interactions_Base_40` + `Canonical_Variables` |

### Causal asociada (no renderizada en formulario base)

| ID | Orden | Pregunta visible | Trigger | Source sheet |
|---|---:|---|---|---|
| C01 | causal | Si cambia la frecuencia o la forma de hacerla, ¿qué lo provoca y cuál es el caso especial más común? | Abrir si B0-Q03 muestra frecuencia variable o B0-Q02/B0-Q04 muestra actividad no estable. | `Runtime_Interactions_Causal_20` |

## 5. Reglas de ayuda aplicadas

No existe columna literal `help_text` en el XLSX Runtime.

| ID | Columna canónica usada | Texto usado en UI |
|---|---|---|
| B0-Q01 | `UX_Subfield_Structure.display_rule` | Cláusula tras «subcampos separados para» |
| B0-Q02 | `Runtime_Interactions_Base_40.function` | Descripción operativa mínima |
| B0-Q03 | `Runtime_Interactions_Base_40.function` | Frecuencia, contexto y actor inmediato |
| B0-Q04 | `Runtime_Interactions_Base_40.function` | Inicio y cierre de la actividad |

### Etiquetas de subcampos

| ID | Subcampo XLSX | Etiqueta visible | Fuente |
|---|---|---|---|
| B0-Q01 | `action_verb` | Qué haces | `UX_Subfield_Structure.display_rule` |
| B0-Q01 | `input_or_object` | Sobre qué trabajas | `UX_Subfield_Structure.display_rule` |
| B0-Q01 | `procedure_or_standard` | Cómo o bajo qué regla | `UX_Subfield_Structure.display_rule` |
| B0-Q01 | `output_or_result` | Qué queda listo | `UX_Subfield_Structure.display_rule` |
| B0-Q01 | `user_correction_note` | Corrección libre | `UX_Subfield_Structure.display_rule` |
| B0-Q03 | `frequency_base` | Con qué frecuencia aparece | descomposición de `visible_text_v1_1` |
| B0-Q03 | `typical_context` | En qué situación suele ocurrir | descomposición de `visible_text_v1_1` |
| B0-Q03 | `primary_actor_scope` | Sobre quién recae directamente | descomposición de `visible_text_v1_1` |

## 6. Fallbacks documentados

| Caso | Decisión |
|---|---|
| Opciones de frecuencia tipo chips/radio | **No presentes** en XLSX para `frequency_base`. Se usa subcampo de texto abierto. No se reutilizan opciones inventadas de V0.4. |
| Secciones A/B/C del formulario | **Eliminadas**. No existen en catálogo Runtime; solo se mantiene badge «Preguntas iniciales». |
| C01 causal | Extraída y documentada; **no renderizada** en formulario base porque es condicional por trigger. |

## 7. Evidencia de extracción

Script local: `docs/audits/_extract_block0_zip.mjs`  
Salida cruda: `docs/audits/_block0_extraction_raw.json`

Comando:

```bash
node docs/audits/_extract_block0_zip.mjs
```

Resultado:

```text
Extracted 12 Block 0 rows from docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx
```

## 8. Implementación derivada

Fuente local para UI:

`src/features/significado/runtime-block0-canonical.ts`

Export principal:

`RUNTIME_BLOCK0_CANONICAL_QUESTIONS`
