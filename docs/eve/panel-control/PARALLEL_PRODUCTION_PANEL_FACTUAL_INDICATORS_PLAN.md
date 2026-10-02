# Plan factual para exponer controles existentes en Panel EVE

## Restriccion

No crear indicadores metodologicos nuevos. No crear estados. No resolver brechas inventando reglas.

## Lo que el Panel puede exponer hoy

Fuente: `parallel_production_package` y `parallel_production_qa_finding`.

### Grupo: Calidad del plano MMABP

Campos existentes:

- `conformance_status`
- `consistency_factual_status`
- `consistency_temporal_status`
- `consistency_structural_status`
- `consistency_composite_status`
- `aca_status`
- `b3_route_exception`
- `b7_boundary_violation`
- `export_eligibility`
- `export_generation_status`
- `generator_available`
- `rework_process_code`
- findings abiertos/resueltos

Uso permitido:

- Mostrar los campos con sus valores reales.
- Agruparlos bajo un titulo presentacional, por ejemplo "Calidad del plano MMABP".

Uso no permitido:

- Persistir o derivar "Plano del terreno MMABP" como estado.
- Mostrar PM/MoC/PF/OLC completo.
- Usar porcentajes o promedios.

## Lo que el Panel no puede exponer sin nuevo puente canonico

Campos diagramaticos:

- `handoff_readiness`
- `generation_readiness`
- `generation_mode`
- `semantic_preservation_status`
- `export_readiness`
- `traceability_status`
- `warning.severity`
- `design_gap.blocking_status`
- `design_gap.resolution_status`

Bloqueo:

Estos campos viven en schemas/fixtures/runtime artifacts/validadores, pero el BFF oficial actual no tiene relacion canonica ejecutada con `parallel_production_runtime_artifacts` o artifacts diagramaticos.

## Plan permitido

1. Mantener el BFF actual leyendo `parallel_production_package` y findings.
2. Exponer en UI los campos existentes, sin reinterpretarlos.
3. En la seccion de Panel, separar dos grupos:
   - Calidad del plano MMABP.
   - Preparacion diagramatica: "Sin fuente canonica enlazada" hasta que exista puente.
4. No agregar navigation/reconciliation hacia artifacts diagramaticos si no existe llave canonica.
5. No usar `candidate_export_package` como equivalente a `export_eligibility`.

## Criterios de produccion futura

Antes de exponer preparacion diagramatica, el repositorio debe demostrar:

- llave canonica entre package panel y artifact diagramatico;
- productor claro del artifact diagramatico;
- persistencia gobernada;
- consumidor BFF;
- pruebas de BFF y UI;
- preservacion de separacion entre `export_eligibility` del Panel y `export_readiness` del candidate package.

Toda brecha anterior queda como brecha del repositorio, no como regla resuelta.
