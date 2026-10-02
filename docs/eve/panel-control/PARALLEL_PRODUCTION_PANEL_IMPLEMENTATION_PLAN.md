# Plan corregido: exponer controles factuales existentes en Panel EVE

## Restriccion

Este plan no crea nuevos estados, contratos, indicadores metodologicos ni reglas. Solo propone exponer campos existentes cuando exista fuente factual.

## Grupos permitidos

### Calidad del plano MMABP

Fuente actual: `parallel_production_package` y `parallel_production_qa_finding`.

Campos existentes:

- `conformance_status`
- `consistency_factual_status`
- `consistency_temporal_status`
- `consistency_structural_status`
- `consistency_composite_status`
- `aca_status`
- `b3_route_exception`
- `b7_boundary_violation`
- `rework_process_code`
- findings abiertos/resueltos

No agregar:

- estado "plano completo";
- porcentaje;
- completitud PM/MoC/PF/OLC;
- `MmabpTerrainPlanIndicator`.

### Preparacion diagramatica

Fuente permitida: solo artifacts enlazados explicitamente por puente canonico o datos ya devueltos por BFF.

Campos existentes a exponer si el puente existe:

- `handoff_readiness.status`
- `generation_readiness`
- `generation_mode`
- `export_readiness`
- `semantic_preservation_status`
- `traceability_status`
- `warning.severity`
- `design_gap.blocking_status`
- `design_gap.resolution_status`

Estado actual:

No se encontro puente canonico entre `parallel_production_runtime_artifacts` y `parallel_production_package`. Por tanto, la exposicion de preparacion diagramatica en el Panel queda bloqueada hasta que exista fuente canonica.

## Reglas de implementacion futura permitidas

1. Mostrar solo campos existentes.
2. Mantener separadas cadena arquitectonica y cadena diagramatica.
3. No reconciliar runtime artifacts con panel por nombre, fecha o heuristica.
4. No convertir `candidate_export_package` en export final.
5. No convertir `Plano del terreno MMABP` en estado persistido.
6. No inferir completitud PM/MoC/PF/OLC.

## Criterios de aceptacion futura

- El Panel muestra controles existentes sin vocabulario inventado.
- Cualquier campo diagramatico tiene fuente canonica enlazada.
- `export_eligibility` del Panel permanece separado de `candidate_export_package.export_readiness`.
- `ready_with_warnings` no se presenta como ready pleno.
- `draft_with_warnings` no se presenta como candidate validado.
- `generated_candidate_files` no se presentan como evidencia nueva.
