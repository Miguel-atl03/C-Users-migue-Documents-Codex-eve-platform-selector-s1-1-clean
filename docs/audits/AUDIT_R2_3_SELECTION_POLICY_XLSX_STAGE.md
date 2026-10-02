# AUDIT_R2_3_SELECTION_POLICY_XLSX_STAGE

## 1. Dictamen

`XLSX_READY_FOR_IMPLEMENTATION`

El workbook rector existe en `docs/policies/PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx`, fue inspeccionado localmente y contiene una politica implementable para seleccionar actividades primarias desde WorkMap antes del Runtime de Significado. El archivo incluye versionado, reglas de autoridad, esquema de entrada, gates, scoring, balance, modos de seleccion, payloads, diccionarios, handoff a Runtime, QA y ejemplos.

Hay brechas menores de interpretacion para convertir algunas reglas semanticas en thresholds exactos de codigo, pero no bloquean una implementacion R2.3 conservadora.

## 2. Command Evidence

Workspace verificado:

```text
pwd
C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform
```

Estado git observado antes de modificar artefactos de auditoria:

```text
git status --short
 M src/app/page.tsx
 M src/lib/types.ts
?? docs/audits/
?? docs/policies/
?? public/eve-logo.png
?? src/app/dev/
?? src/components/EveLogo.tsx
?? src/components/GuideCardBody.tsx
?? src/components/WorkMapIntake.tsx
?? src/components/client/
?? src/components/eve-logo.module.css
?? src/components/guide-card-body.module.css
?? src/components/significado/
?? src/domain/significado-de-trabajo.ts
?? src/domain/start-position-context.ts
?? src/domain/work-map.ts
?? src/features/
?? src/services/significado-activity-anchor-adapter.ts
?? src/services/significado-draft.ts
?? src/services/work-map-activity-validation.ts
?? src/services/work-map-flatten.ts
?? src/services/work-map-operational-readiness.ts
?? src/services/work-map-responsibility-validation.ts
?? src/services/work-map-save-validation.ts
?? tests/regression/significado-activity-anchor-adapter.test.ts
?? tests/regression/significado-de-trabajo-slice.test.ts
?? tests/regression/significado-flow-wiring.test.ts
?? tests/regression/significado-mba-alignment.test.ts
?? tests/regression/work-map-operational-readiness.test.ts
?? tests/regression/work-map-save-validation.test.ts
?? tests/regression/workmap-h12-page-wiring.test.ts
```

Rama:

```text
git branch --show-current
master
```

XLSX rector:

```text
dir docs\policies\PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx
PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx
Length: 623771
```

Artefactos de inspeccion generados:

```text
docs/audits/selection-policy-xlsx-sheets.json
docs/audits/selection-policy-xlsx-preview.md
```

## 3. Inventory

Total de hojas encontradas: 43.

| # | Sheet | Filas no vacias aprox. | Rol |
|---:|---|---:|---|
| 1 | Version_Control | 37 | Metadatos, version, autoridad y cambios v1.2 |
| 2 | Authority_Rules | 9 | Autoridad entre catalogos, Runtime, WorkMap y selector |
| 3 | Methodology_Overview | 8 | Flujo metodologico de seleccion |
| 4 | Input_Schema | 16 | Campos de entrada desde WorkMap/contexto |
| 5 | Eligibility_Gates | 11 | Gates de elegibilidad v1.0/v1.1 |
| 6 | Scoring_Weights | 47+ | Pesos y reglas de scoring, incluye agregados v1.2 |
| 7 | Selector_Template | 1 | Plantilla tecnica base del selector |
| 8 | Coverage_Balance | 10 | Reglas de balance y maximo 8 |
| 9 | Selection_Flow | 16 | Pseudocodigo operativo del selector |
| 10 | UX_Contract | 9 | Contrato UX de seleccion previa a Runtime |
| 11 | Runtime_Handoff | 17 | Payload hacia Runtime 40/20 |
| 12 | NonPrimary_Context | 7 | Conservacion de actividades no primarias |
| 13 | MMABP_Rationale | 13 | Razonamiento MMABP |
| 14 | QA_Checklist | 28+ | Criterios de aceptacion y QA |
| 15 | Implementation_Dicts | 12 | Diccionarios de valores |
| 16 | Dashboard | 12 | Resumen de control |
| 17 | Example_Run | 11 | Corrida ejemplo v1.0 |
| 18 | v1_1_Change_Log | - | Cambios v1.1 |
| 19 | Signal_Method_v1_1 | - | Metodo de senales v1.1 |
| 20 | PreRuntime_Rules_v1_1 | - | Reglas pre-runtime v1.1 |
| 21 | Scoring_Model_v1_1 | - | Scoring v1.1 |
| 22 | Selector_Template_v1_1 | - | Plantilla v1.1 |
| 23 | Slot_Balance_v1_1 | - | Balance de slots v1.1 |
| 24 | Runtime_Handoff_v1_1 | - | Handoff v1.1 |
| 25 | QA_v1_1 | - | QA v1.1 |
| 26 | Dashboard_v1_1 | - | Dashboard v1.1 |
| 27 | Example_Run_v1_1 | - | Ejemplo v1.1 |
| 28 | v1_2_Change_Log | - | Cambios v1.2 |
| 29 | Under8_Policy_v1_2 | - | Politica 0, 1-8, >8 elegibles |
| 30 | Screen_Sequence_v1_2 | - | Secuencia Estado A -> WorkMap -> Selector -> Significado |
| 31 | Context_Bundle_v1_2 | - | Bundle epistemico Estado A/WorkMap/Significado |
| 32 | Context_Epistemic_v1_2 | - | Estados epistemicos |
| 33 | Activity_Quality_Gates_v1_2 | - | Gates de calidad de actividad |
| 34 | Selection_Mode_v1_2 | - | Modos reentry/non competitive/competitive/manual review |
| 35 | Significado_Runtime_v1_2 | - | Contrato de pantalla Runtime en Significado |
| 36 | Runtime_ContextRules_v1_2 | - | Reglas de contexto sin contaminar evidencia |
| 37 | NonCompetitive_Log_v1_2 | - | Log obligatorio del modo no competitivo |
| 38 | QA_v1_2 | - | Pruebas de aceptacion v1.2 |
| 39 | Selector_Template_v1_2 | - | Plantilla implementable v1.2 |
| 40 | Implementation_Dicts_v1_2 | - | Diccionarios v1.2 |
| 41 | Example_Run_v1_2 | - | Corrida ejemplo v1.2 |
| 42 | Dashboard_v1_2 | - | Dashboard v1.2 |
| 43 | Significado_Handoff_v1_2 | - | Payload hacia Significado Runtime |

Nota: el detalle completo de columnas y primeras 5 filas por hoja quedo en `docs/audits/selection-policy-xlsx-preview.md`; el JSON estructurado quedo en `docs/audits/selection-policy-xlsx-sheets.json`.

## 4. Columns

Columnas clave identificadas para implementacion:

- Entrada WorkMap: `workmap_id`, `area_id`, `area_label`, `responsibility_id`, `responsibility_label`, `activity_id`, `activity_label`, `activity_description`, `savedWithWarnings`, `literal_user_text`, `semantic_quality_hint`, `role_functional`.
- Gates/calidad: `workmap_trace_ok`, `belongs_to_role`, `is_work_activity`, `granularity_status`, `duplicate_or_alias_status`, `context_status`, `Hard_Gate`, `Eligibility_Status`.
- Senales/scoring v1.2: `user_text_density_0_3`, `semantic_clarity_0_3`, `pm_signal_0_3`, `moc_signal_0_3`, `pf_signal_0_3`, `olc_signal_0_3`, `operational_centrality_0_3`, `handoff_dependency_signal_0_3`, `transformation_object_signal_0_3`, `friction_exception_signal_0_3`, `coverage_diversity_0_3`, `uncertainty_level_0_3`, `ambiguity_probe_value_0_3`, `vagueness_risk_0_3`, `granularity_risk_0_3`, `duplicate_alias_risk_0_3`.
- Scores/salida: `Architectural_Signal_Potential`, `Context_Quality_Score`, `Penalty_Total`, `PrimaryActivitySelectionScore`, `Rank_If_Competitive`, `Select_If_Under8`, `Select_If_Over8`, `Final_Selection_Status`, `Runtime_Order`, `Runtime_Opening_Profile`, `Runtime_Probe_Priority`, `Runtime_Handoff_Ready`.
- Modos/log: `selection_run_id`, `selection_mode`, `eligible_activity_count`, `raw_activity_count`, `excluded_activity_count`, `selected_activity_ids`, `role_coverage_flag`, `workmap_coverage_gap`, `runtime_order`, `rationale_summary`, `non_primary_context_ids`, `selector_version`.
- Handoff: `primary_activity_list`, `non_primary_context`, `activity_id`, `activity_label`, `area`, `responsibility`, `functional_role`, `decision_level`, `authority_scope`.

## 5. Preview

Muestras principales inspeccionadas:

- `Version_Control`: define el artefacto como `PrimaryActivitySelectionPolicy`, version `v1.2 operacional`, con politica `0 elegibles = reentry; 1-8 = non_competitive_inclusion; >8 = competitive_selection`.
- `Authority_Rules`: confirma que el XLSX selecciona hasta 8 actividades primarias, no diagnostica, no reemplaza Runtime y no reescribe WorkMap.
- `Input_Schema`: requiere trazabilidad WorkMap por area, responsabilidad y actividad; prohibe seleccionar sin mapa de origen.
- `Eligibility_Gates`: incluye gates de trazabilidad, actividad de trabajo, granularidad, duplicado/alias, suficiencia semantica y factibilidad Runtime.
- `Scoring_Weights`: define formula compuesta con MMABP, friccion, cobertura, evidencia, boost y burden penalty.
- `Under8_Policy_v1_2`: si hay 1-8 elegibles, se seleccionan todas; si hay 0, reentry; si hay >8, seleccion competitiva.
- `Selection_Mode_v1_2`: separa `reentry_required`, `non_competitive_inclusion`, `competitive_selection`, `manual_review_required`.
- `Significado_Runtime_v1_2`: Significado ejecuta Runtime 40/20 por actividad seleccionada; no actua como selector visible ni diagnostico.

## 6. Implementable Rules

1. Ingerir actividades desde WorkMap con trazabilidad completa de area, responsabilidad, actividad y rol funcional.
2. Normalizar alias, duplicados y granularidad antes de puntuar.
3. Aplicar gates de elegibilidad/calidad antes de cualquier ranking.
4. No convertir areas, roles, valores, emociones o responsabilidades genericas en actividades primarias.
5. Si `eligible_activity_count = 0`, bloquear Runtime y pedir reentrada/correccion en WorkMap.
6. Si `1 <= eligible_activity_count <= 8`, seleccionar todas las actividades elegibles con `selection_mode = non_competitive_inclusion`.
7. Si `eligible_activity_count > 8`, aplicar scoring, balance y maximo 8 con `selection_mode = competitive_selection`.
8. No pedir al usuario que elija diagnosticamente sus 8 favoritas.
9. No llenar cupos artificiales cuando hay menos de 8 actividades elegibles.
10. Preservar actividades no primarias como `context_only/backlog`, no eliminarlas del expediente.
11. Separar contexto inferido de evidencia capturada: `inferred_from_workmap` puede prellenar/sugerir, pero no cuenta como `captured_user_evidence` sin confirmacion.
12. Significado recibe actividades primarias gobernadas y ejecuta Runtime 40/20 por actividad.

## 7. Scoring, Gates and Balance

Formula base encontrada:

```text
selector_score = 0.45*MMABP + 0.25*Friction + 0.15*Coverage + 0.10*Evidence + boost - 0.15*burden
```

Bloques principales:

- `MMABP_Potential`: 0.45.
- `Friction_Variety`: 0.25.
- `Coverage`: 0.15.
- `Evidence_Feasibility`: 0.10.
- `Burden_Penalty`: 0.15.

Gates clave:

- Trazabilidad WorkMap.
- Actividad accionable de trabajo.
- Granularidad correcta.
- No duplicado/alias no resuelto.
- Suficiencia semantica.
- Factibilidad de Runtime.

Balance:

- Maximo 8 actividades primarias.
- Evitar concentracion excesiva en una sola responsabilidad.
- Asegurar, cuando existan candidatas, cobertura de transformacion/estado, handoff/dependencia y friccion/capacidad/workaround.
- Promover soporte solo cuando revele cuello de botella, dependencia o workaround recurrente.
- En empate, preferir variedad estructural.

## 8. Mapping to R2.3 Code

Implementacion sugerida:

- Dominio de selector: crear un motor puro que reciba WorkMap/Estado A y devuelva `PrimaryActivitySelectionBundle`.
- Tipos: agregar enums de `selection_mode`, `granularity_status`, `epistemic_status`, `role_coverage_flag`, `readiness`.
- Validacion: mapear `Activity_Quality_Gates_v1_2` a funciones puras de elegibilidad.
- Scoring: mapear `Selector_Template_v1_2` y `Scoring_Weights` a calculo determinista.
- Persistencia/log: guardar campos de `NonCompetitive_Log_v1_2` y `Significado_Handoff_v1_2`.
- UI: WorkMap no debe delegar seleccion diagnostica al usuario; Significado debe abrir actividades ya seleccionadas.
- QA: traducir `QA_v1_2` a pruebas de regresion para 0, 1-8, >8, duplicados, macro/micro, contexto epistemico y handoff.

## 9. Interpretation Gaps

Brechas no bloqueantes:

- Algunos criterios semanticos requieren thresholds de codigo: que texto cuenta como demasiado macro, demasiado micro o `context_only`.
- La deteccion de duplicado/alias necesita una politica concreta de similitud o comparacion textual.
- La diferencia entre `review`, `manual_review_required` y microconfirmacion debe aterrizarse en estados actuales de la app.
- El mapeo de `Estado A` depende de que los campos `functional_role`, `decision_level` y `authority_scope` existan o se deriven de manera trazable en el producto actual.
- La seleccion competitiva >8 esta especificada por pesos y balance, pero la implementacion debe fijar normalizacion numerica exacta para senales 0-3 y scores compuestos.

## 10. Recommendation A/B/C

Recomendacion: **A - implementar desde el XLSX rector**.

El workbook esta listo como fuente operativa para R2.3. Conviene implementar primero el circuito minimo:

1. gates de calidad;
2. conteo de elegibles;
3. `reentry_required` / `non_competitive_inclusion` / `competitive_selection`;
4. payload a Significado;
5. log de no competitivo;
6. QA de aceptacion v1.2.

Las brechas de interpretacion pueden resolverse durante implementacion con defaults conservadores y pruebas.

## 11. Guards

- No modificar `src/**`, `tests/**`, APIs, SQL, Supabase, Runtime ni middleware durante esta etapa.
- No tocar el XLSX rector salvo solicitud explicita.
- No delegar al usuario la seleccion diagnostica de actividades.
- No excluir actividades elegibles por ranking cuando hay 1-8 elegibles.
- No inventar actividades si hay 0 elegibles.
- No tratar contexto inferido como evidencia estructural capturada.
- No ejecutar Significado sin `Runtime_Handoff_Ready`.
- No borrar actividades no primarias; conservarlas como contexto/backlog.

