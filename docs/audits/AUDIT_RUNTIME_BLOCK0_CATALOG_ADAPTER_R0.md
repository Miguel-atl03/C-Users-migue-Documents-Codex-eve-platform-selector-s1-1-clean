# AUDIT · Runtime Block0 Catalog Adapter R0

## 1. Dictamen

**RUNTIME_BLOCK0_CATALOG_ADAPTER_AUDITED_WITH_GAPS**

Se inspeccionó el catálogo Runtime XLSX y la especificación técnica DOCX para materializar un snapshot R0 de las cuatro interacciones de Bloque 0. El adapter queda aislado de UI, APIs, Supabase, WorkMap y runtime engine.

Gap principal: el working tree global ya contiene cambios previos en archivos fuera de este alcance; por eso la verificación de contaminación no puede declararse limpia a nivel repo.

## 2. Hojas leídas

| Hoja | Filas leídas | Filas B0 extraídas | Uso |
|---|---:|---:|---|
| `Runtime_Interactions_Base_40` | 40 | 4 | Pregunta visible, orden, función técnica, componente UI, fuente, variables y readiness. |
| `UX_Subfield_Structure` | 17 | 2 | Subcampos, display rule, storage rule y riesgo de textbox único para B0-Q01/B0-Q03. |
| `Canonical_Variables` | 60 | 4 | Variables canónicas, requeridas, opcionales, derivadas y route/gate. |
| `Branching_Budget_Rules` | 22 | 0 | Revisada; sin filas B0 directas. |
| `Critical_Routes` | 4 | 1 | Ruta `CR-B0-WorkMapIntake-semantic-entry` asociada a B0-Q01. |
| `Readiness_Gaps_Reentry` | 7 | 0 | Revisada; sin filas B0 directas. |
| `QA_Checklist` | 12 | 0 | Revisada; sin filas B0 directas. |

Extracción cruda: `docs/audits/_runtime_block0_raw_extraction.json`.

## 3. Mapeo de columnas

| Campo adapter | Fuente XLSX |
|---|---|
| `runtimeInteractionId` | `Runtime_Interactions_Base_40.runtime_interaction_id` |
| `sourceRuntimeInteractionId` | `Runtime_Interactions_Base_40.runtime_interaction_id` |
| `interactionGroup` | `Runtime_Interactions_Base_40.interaction_group`, normalizado `base_40` -> `base` |
| `block` | `Runtime_Interactions_Base_40.block` |
| `runtimeOrder` | `Runtime_Interactions_Base_40.runtime_order` |
| `questionText` | `Runtime_Interactions_Base_40.visible_text_v1_1` |
| `technicalLabel` | `Runtime_Interactions_Base_40.function` |
| `uiComponent` | `Runtime_Interactions_Base_40.ui_component` |
| `responseKind` | Derivado de `ui_component` y `subfield_structure` |
| `subfields` | `UX_Subfield_Structure.subfield_structure` o `Runtime_Interactions_Base_40.subfield_structure` |
| `sourceCodes` | `Runtime_Interactions_Base_40.source_codes` |
| `sourceNodes` | `Runtime_Interactions_Base_40.source_nodes` |
| `canonicalVariables` | `Canonical_Variables.canonical_variables` |
| `requiredVariables` | `Canonical_Variables.required_variables` |
| `optionalVariables` | `Canonical_Variables.optional_variables` |
| `derivedVariables` | `Canonical_Variables.derived_variables` |
| `routeOrGate` | `Canonical_Variables.route_or_gate` |
| `displayRule` | `UX_Subfield_Structure.display_rule` |
| `storageRule` | `UX_Subfield_Structure.storage_rule` |
| `riskIfSingleTextbox` | `UX_Subfield_Structure.risk_if_single_textbox` |
| `readinessEffect` | `Runtime_Interactions_Base_40.readiness_effect` |
| `sourceSheetRefs` | Hoja, fila y columnas extraídas por cada fuente |

## 4. Tabla por interacción

| ID | Pregunta | ui_component | subfields | variables | help kind | fuente ayuda | source sheets |
|---|---|---|---|---|---|---|---|
| B0-Q01 | Esto es lo que entendimos de esta actividad. ¿Está correcto? Si no, corrígelo para que diga qué haces, sobre qué trabajas y qué queda listo. | `confirmation_card_with_correction` | `action_verb`; `input_or_object`; `procedure_or_standard`; `output_or_result`; `user_correction_note` | `semantic_preload_used`; `activity_semantic_*`; `semantic_review_attempt_count` | `canonical` | `UX_Subfield_Structure.display_rule`, cláusula orientadora de subcampos separados | `Runtime_Interactions_Base_40`, `UX_Subfield_Structure`, `Canonical_Variables`, `Critical_Routes` |
| B0-Q02 | En tus palabras, ¿qué ocurre cuando haces esta actividad? | `guided_textarea_or_choice_plus_text` | `single_answer` en XLSX; adapter lo expone como textarea sin subcampos | `activity_summary_literal / scene_summary_literal`; `activity_name_disambiguation`; `activity_scale_adjustment` | `fallback_no_canonico` | Sin ayuda canónica; fallback documentado | `Runtime_Interactions_Base_40`, `Canonical_Variables` |
| B0-Q03 | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? | `compound_card_with_separable_subfields` | `frequency_base`; `typical_context`; `primary_actor_scope` | `activity_frequency_base / scene_frequency_base`; `activity_typical_context / scene_typical_context`; `activity_primary_actor_scope / scene_primary_actor_scope` | `fallback_no_canonico` | `display_rule` es regla de implementación, no ayuda al usuario; fallback documentado | `Runtime_Interactions_Base_40`, `UX_Subfield_Structure`, `Canonical_Variables` |
| B0-Q04 | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? | `guided_textarea_or_choice_plus_text` | `single_answer` en XLSX; adapter lo expone como textarea sin subcampos | `activity_start_condition_hint / scene_boundary_start_hint`; `activity_end_result_hint / scene_boundary_end_hint`; `activity_boundary_clarification` | `fallback_no_canonico` | Sin ayuda canónica; fallback documentado | `Runtime_Interactions_Base_40`, `Canonical_Variables` |

## 5. Por qué `function` no es ayuda de usuario

`function` describe el propósito técnico de la interacción dentro del catálogo, por ejemplo "Descripción operativa mínima" o "Inicio y cierre de la actividad". No explica al usuario qué responder ni cómo completar la captura.

Regla aplicada:

- `function` se conserva como `technicalLabel`.
- No se asigna a `helpText`.
- Cuando no existe ayuda canónica real, se declara `canonicalHelpStatus = "CANONICAL_HELP_MISSING"`.
- El texto mostrado en `helpText` para B0-Q02, B0-Q03 y B0-Q04 queda marcado como `fallback_no_canonico`.

## 6. Qué queda fuera de R0

- No se conecta Significado al adapter.
- No se modifica `RUNTIME_BLOCK0_CANONICAL_QUESTIONS`.
- No se implementa persistencia.
- No se implementa branching.
- No se implementa presupuesto 40/20.
- No se implementa readiness engine.
- No se implementa ResponseIngestService.
- No se crean APIs.
- No se toca Supabase.
- No se carga XLSX en runtime browser.

## 7. Riesgos

- El repo mantiene cambios previos en archivos prohibidos para esta tarea; hay que limpiar o aislar antes de declarar contaminación global en verde.
- B0-Q04 está representado por el catálogo como `guided_textarea_or_choice_plus_text`, mientras la UI congelada lo presenta como panel por secciones; el adapter no resuelve esa divergencia todavía.
- La extracción a snapshot es manual-controlada R0; futuras versiones deberían automatizar generación/auditoría si el XLSX cambia.
- `Branching_Budget_Rules`, `Readiness_Gaps_Reentry` y `QA_Checklist` no tienen filas B0 directas, pero influirán en órganos Runtime posteriores.
