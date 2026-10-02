# Matriz de materializacion: reglas de calidad diagramatica existentes

## Criterio de clasificacion

- **DEFINIDA Y EJECUTADA**: existe regla y validador/servicio operativo la ejecuta.
- **DEFINIDA PERO NO EJECUTADA**: existe en contrato, pero no se encontro ejecucion.
- **EJECUTADA PARCIALMENTE**: existe ejecucion, pero no cubre toda la regla o no llega a persistencia/panel.
- **SOLO VALIDADA POR SCHEMA**: solo enum/required/schema.
- **SOLO PROBADA**: protegida por test sin evidencia de ejecucion productiva.
- **AUSENTE**: no encontrada.

## Matriz

| Regla del contrato | Estado | Evidencia | Nota |
|---|---|---|---|
| IR validado antes de generacion | DEFINIDA Y EJECUTADA en validador local | `validateDiagramCodeGenerationPackage` exige conformance/consistency passed para ready; contrato diagramatico | No se encontro ejecucion panel/productiva enlazada. |
| Conformance y consistencia evaluadas | DEFINIDA Y EJECUTADA en validacion local; EJECUTADA PARCIALMENTE en runtime/panel | `validateConformanceReport`, `validateConsistencyReport`; panel package statuses; runtime assessment warnings | Runtime assessment no usa report objects completos; panel usa campos separados. |
| Ausencia de gaps blocking | DEFINIDA Y EJECUTADA en validador local | `isOpenBlockingGap`, design gap tests, warning tests | No hay tabla PP dedicada de design gaps. |
| Trazabilidad a `ir_element_id` | DEFINIDA Y EJECUTADA en validador local | `source_ir_element_ids` required; test sin IR element falla | Tambien se valida en archivos candidatos. |
| No invencion de elementos | DEFINIDA Y EJECUTADA en validador local | Cruce IR -> registry/facts; test `cannot invent registry or fact references outside IR` | Control no esta expuesto en Panel. |
| Preservacion semantica | DEFINIDA Y EJECUTADA en validador local | `semantic_preservation_status`; reglas candidate/draft | No persistido en Panel. |
| Reglas de warnings | DEFINIDA Y EJECUTADA en validador local | `WARNING_REQUIRED_FIELDS`; severity high/critical gate | No separadas en Panel como calidad diagramatica. |
| Restricciones de `draft_with_warnings` | DEFINIDA Y EJECUTADA en validador local | razon, missing IR gaps, prohibited downstream uses, explicit warning | No hay consumer panel. |
| Candidate export marcado como candidato | DEFINIDA Y EJECUTADA parcialmente | Contract/schema; runtime candidate export `candidate_only`; `allow_export_promotion=false` | Runtime candidate schema no coincide completamente con fixture schema. |
| Formatos BPMN/PlantUML/XMI | DEFINIDA Y EJECUTADA en validador local | Schema enum + reglas PM/PF BPMN, MoC/OLC PlantUML/XMI | No expuesto en Panel. |
| Hashes de archivos | DEFINIDA Y EJECUTADA en validador de archivos | `validate-generated-candidate-files.mjs`; `content_hash` | Reporte registra hash mismatch en fixtures; no panel. |
| Prohibicion de alimentar Capa 2.0 como verdad nueva | DEFINIDA Y EJECUTADA en schemas/validadores locales | `prohibited_uses`, `blocked_downstream_uses`, contract | No hay control panel-productivo enlazado. |
| `candidate_export_package` no es export final | DEFINIDA Y EJECUTADA parcialmente | contract, tests, runtime `export_code_package_generated=false` | Panel tiene `export_eligibility`, no `candidate_export_package.export_readiness`. |
| BPMN XML bien formado minimo | EJECUTADA PARCIALMENTE | Validador busca `bpmn:definitions` y cierre basico | No es parser BPMN completo. |
| PlantUML sintaxis minima | EJECUTADA PARCIALMENTE | Validador busca `@startuml`, `@enduml`, tokens trace | No ejecuta compilacion PlantUML real. |
| XMI opcional con trazabilidad | EJECUTADA PARCIALMENTE | Validador exige trace marker | No valida XMI formal completo. |

## Resultado

Las reglas de calidad diagramatica existen y estan materializadas principalmente como contrato, schema, fixtures, validadores locales y pruebas. No existe evidencia suficiente para decir que todas operan como control productivo del Panel oficial, porque falta puente canonico entre artifacts runtime/diagramaticos y `parallel_production_package`.
