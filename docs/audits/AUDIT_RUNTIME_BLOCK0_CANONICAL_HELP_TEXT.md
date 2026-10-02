# AUDIT · Runtime Block 0 Canonical Help Text (V0.7)

## 1. Dictamen

**BLOCK0_HELP_TEXT_AUDIT_COMPLETE**

El catálogo Runtime XLSX **no define columna literal `help_text`**. Para B0-Q01 existe ayuda de usuario extraíble desde `UX_Subfield_Structure.display_rule`. Para B0-Q02, B0-Q03 y B0-Q04 la columna `function` es **etiqueta técnica interna**, no ayuda de usuario. Se declara `CANONICAL_HELP_MISSING` y se documentan fallbacks `fallback_no_canonico` separados.

## 2. Fuente obligatoria

| Artefacto | Path |
|---|---|
| XLSX Runtime | `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` |
| Extracción cruda | `docs/audits/_block0_extraction_raw.json` |
| Script de extracción | `docs/audits/_extract_block0_zip.mjs` |

### Hojas leídas

| Hoja | Filas B0 | Uso |
|---|---:|---|
| `Runtime_Interactions_Base_40` | 4 | `visible_text`, `function`, `ui_component`, `subfield_structure`, `trigger_condition` |
| `UX_Subfield_Structure` | 2 (B0-Q01, B0-Q03) | `display_rule`, `storage_rule`, `risk_if_single_textbox` |
| `Canonical_Variables` | 4 | Variables requeridas/opcionales |
| `Branching_Budget_Rules` | 0 directas B0 | Revisada; sin ayuda de usuario B0 |
| `Critical_Routes` | CR-B0 referenciado | Revisada; sin ayuda de usuario B0 |

## 3. Regla aplicada

| Criterio | Decisión |
|---|---|
| Columna `help_text` en XLSX | **No existe** en ninguna hoja leída |
| `function` | Etiqueta técnica interna → `technicalLabel`; **no** se muestra como ayuda canónica |
| `display_rule` con cláusula orientadora al usuario | Ayuda canónica si el texto guía qué capturar (B0-Q01) |
| `display_rule` de implementación UI | No es ayuda de usuario (B0-Q03: «Mostrar como tarjeta…») |
| Sin ayuda real | `CANONICAL_HELP_MISSING` + `fallback_no_canonico` documentado |

## 4. Tabla de ayudas Bloque 0

| ID | Pregunta visible | Help text encontrado | Hoja | Columna | Estado |
|---|---|---|---|---|---|
| B0-Q01 | Esto es lo que entendimos de esta actividad. ¿Está correcto?… | Revisa cada parte por separado: qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo. Si algo no encaja, usa «Corrección libre». | `UX_Subfield_Structure` | `display_rule` (cláusula tras «subcampos separados para») | **Canónico** |
| B0-Q02 | En tus palabras, ¿qué ocurre cuando haces esta actividad? | — | `Runtime_Interactions_Base_40` | `function` = «Descripción operativa mínima» (solo etiqueta técnica) | **CANONICAL_HELP_MISSING** |
| B0-Q03 | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? | — | `UX_Subfield_Structure` | `display_rule` = regla de implementación UI, no ayuda al usuario | **CANONICAL_HELP_MISSING** |
| B0-Q04 | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? | — | `Runtime_Interactions_Base_40` | `function` = «Inicio y cierre de la actividad» (solo etiqueta técnica) | **CANONICAL_HELP_MISSING** |

## 5. Extracción detallada por interacción

### B0-Q01

| Campo XLSX | Valor |
|---|---|
| `runtime_interaction_id` | B0-Q01 |
| `visible_text` | Esto es lo que entendimos de esta actividad. ¿Está correcto? Si no, corrígelo para que diga qué haces, sobre qué trabajas y qué queda listo. |
| `ui_component` | confirmation_card_with_correction |
| `subfield_structure` | action_verb; input_or_object; procedure_or_standard; output_or_result; user_correction_note |
| `function` (technicalLabel) | Confirmación o corrección de actividad |
| `display_rule` | Mostrar como tarjeta de confirmación editable con subcampos separados para qué haces, sobre qué trabajas, cómo o bajo qué regla, qué queda listo y corrección libre. |
| `storage_rule` | Persistir cada subcampo como variable separable con su provenance y timestamp; no guardar la corrección solo como texto plano. |
| `risk_if_single_textbox` | Se puede perder la estructura semántica de la actividad y contaminar el anclaje de Bloque 0; la IA podría inferir componentes no confirmados. |

### B0-Q02

| Campo XLSX | Valor |
|---|---|
| `runtime_interaction_id` | B0-Q02 |
| `visible_text` | En tus palabras, ¿qué ocurre cuando haces esta actividad? |
| `ui_component` | guided_textarea_or_choice_plus_text |
| `subfield_structure` | single_answer |
| `function` (technicalLabel) | Descripción operativa mínima |
| `display_rule` | — (sin fila en UX_Subfield_Structure) |
| `storage_rule` | — |
| `risk_if_single_textbox` | — |

### B0-Q03

| Campo XLSX | Valor |
|---|---|
| `runtime_interaction_id` | B0-Q03 |
| `visible_text` | ¿Con qué frecuencia aparece, en qué situación suele ocurrir y sobre quién recae directamente? |
| `ui_component` | compound_card_with_separable_subfields |
| `subfield_structure` | frequency_base; typical_context; primary_actor_scope |
| `function` (technicalLabel) | Frecuencia, contexto y actor inmediato |
| `display_rule` | Mostrar como una tarjeta única con subcampos editables/chips; no como caja de texto indiferenciada. |
| `storage_rule` | Persistir cada subcampo como variable separable con su provenance y confidence. |
| `risk_if_single_textbox` | La carga visible parece menor, pero se oculta ambigüedad y se pierde trazabilidad. |

### B0-Q04

| Campo XLSX | Valor |
|---|---|
| `runtime_interaction_id` | B0-Q04 |
| `visible_text` | ¿Qué recibes, ves o necesitas para empezar, y qué queda listo para darla por terminada? |
| `ui_component` | guided_textarea_or_choice_plus_text |
| `subfield_structure` | single_answer |
| `function` (technicalLabel) | Inicio y cierre de la actividad |
| `display_rule` | — (sin fila en UX_Subfield_Structure) |
| `storage_rule` | — |
| `risk_if_single_textbox` | — |

## 6. Fallbacks `fallback_no_canonico` (UI V0.7)

| ID | Texto mostrado al usuario | Motivo |
|---|---|---|
| B0-Q02 | Cuéntanos con tus palabras qué haces en esta actividad: qué parte del trabajo tocas y qué resultado concreto dejas al terminar. | Sin ayuda canónica en XLSX; orienta captura operativa mínima |
| B0-Q03 | Completa cada subcampo por separado: con qué frecuencia ocurre, en qué situación suele darse y quién la ejecuta directamente. | `display_rule` es regla de implementación, no ayuda al usuario |
| B0-Q04 (principal) | Describe qué necesitas para empezar (insumos, avisos o condiciones) y qué resultado concreto indica que la actividad quedó terminada. | Sin ayuda canónica en XLSX |
| B0-Q04 (suplementaria) | Confirma o ajusta dónde empieza y dónde termina realmente esta actividad. | Fallback UX V0.6 conservado; requisito de confirmación de límites |

## 7. Corrección respecto a V0.6

| ID | V0.6 (incorrecto) | V0.7 (corregido) |
|---|---|---|
| B0-Q02 | Mostraba `function` como ayuda: «Descripción operativa mínima» | `technicalLabel` interno; ayuda = `fallback_no_canonico` |
| B0-Q03 | Mostraba `function` como ayuda: «Frecuencia, contexto y actor inmediato» | `technicalLabel` interno; ayuda = `fallback_no_canonico` |
| B0-Q04 | Mostraba `function` como ayuda: «Inicio y cierre de la actividad» | `technicalLabel` interno; ayuda = `fallback_no_canonico` |
| B0-Q01 | Lista de subcampos sin contexto | Ayuda canónica ampliada desde `display_rule`, mantiene cláusula canónica |

## 8. Implementación derivada

`src/features/significado/runtime-block0-canonical.ts` — campos añadidos:

- `helpTextKind`: `canonical` | `fallback_no_canonico`
- `canonicalHelpStatus`: `present` | `CANONICAL_HELP_MISSING`
- `technicalLabel`: valor de `function` cuando no es ayuda de usuario
