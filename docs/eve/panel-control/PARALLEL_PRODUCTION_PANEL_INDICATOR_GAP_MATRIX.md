# Matriz corregida: brechas de exposicion de controles existentes

## Alcance

Esta matriz no crea indicadores nuevos. Solo registra controles existentes y brechas para exponerlos en el Panel oficial.

| Control existente | Evidencia real | Panel actual | Brecha factual |
|---|---|---|---|
| Conformance arquitectonica | `parallel_production_package.conformance_status`; `conformance-report.schema.json`; `validateConformanceReport` | Se muestra como QA general | No se vincula a runtime artifact por puente canonico. |
| Consistencia factual | `consistency_factual_status`; finding type `factual_consistency` | Se muestra en QA | No hay indicador nuevo autorizado; solo campo existente. |
| Consistencia temporal | `consistency_temporal_status`; finding type `temporal_consistency` | Se muestra en QA | Igual: exponer campo existente, no derivar estado nuevo. |
| Consistencia estructural | `consistency_structural_status`; finding type `structural_consistency` | Se muestra en QA | Igual. |
| Consistencia compuesta | `consistency_composite_status`; gate de elegibilidad | Se muestra en QA/export | No equivale por si sola a "plano completo". |
| ArchitectureConsistencyAssessment | `aca_status` enum `Satisfied`, `WithFindings`, `Blocked`; runtime assessment shadow | Se muestra ACA | No existe puente canonico entre ACA runtime y package oficial. |
| Findings y rework | `parallel_production_qa_finding`; `rework_process_code = P-SUP-06` | Se muestran findings | Correcto como campo existente. |
| B3 route exception | `b3_route_exception`, finding type | Se muestra | Correcto como campo existente. |
| B7 boundary violation | `b7_boundary_violation`, finding type | Se muestra | Correcto como campo existente. |
| Export eligibility panel | `export_eligibility`: `not_evaluated`, `eligible`, `blocked` | Se muestra | No debe confundirse con `candidate_export_package.export_readiness`. |
| Handoff readiness diagramatico | `handoff_readiness.status` en schema/fixtures | No expuesto en Panel | Falta fuente enlazada al Panel. |
| Generation readiness | `generation_readiness` en schema/validator/fixtures | No expuesto en Panel | Falta fuente enlazada al Panel. |
| Generation mode | `generation_mode` en schema/validator/fixtures | No expuesto en Panel | Falta fuente enlazada al Panel. |
| Semantic preservation | `semantic_preservation_status` en schema/validator/fixtures | No expuesto en Panel | Falta fuente enlazada al Panel. |
| Candidate export readiness | `export_readiness` en candidate schema/fixtures | No expuesto en Panel | Falta fuente enlazada al Panel; no equivale a export final. |
| Hashes de archivos candidatos | `content_hash`; `validate-generated-candidate-files.mjs` | No expuesto | Control existe como validacion local/fixture, no panel. |
| PM completo | No existe estado factual explicito | No mostrado | No hay soporte factual para mostrar completitud por cuadrante. |
| MoC completo | No existe estado factual explicito | No mostrado | No hay soporte factual para mostrar completitud por cuadrante. |
| PF completo | No existe estado factual explicito | No mostrado | No hay soporte factual para mostrar completitud por cuadrante. |
| OLC completo | No existe estado factual explicito | No mostrado | No hay soporte factual para mostrar completitud por cuadrante. |

## Elementos eliminados por no estar demostrados

- `MmabpTerrainPlanIndicator`
- `TerrainQuadrantStatus`
- `sourceStatus` union
- `quadrantCoverage`
- "Plano completo" como estado factual
- "Exportacion permitida" sin distinguir `export_eligibility` del panel y `candidate_export_package.export_readiness`
