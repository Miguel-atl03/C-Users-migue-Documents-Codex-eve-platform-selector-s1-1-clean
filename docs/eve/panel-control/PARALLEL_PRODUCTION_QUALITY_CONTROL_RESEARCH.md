# Investigacion corregida: controles existentes de calidad de Produccion Paralela

## Alcance corregido

Este documento reemplaza la version anterior para eliminar cualquier estado, indicador o contrato no demostrado en el repositorio. No introduce `MmabpTerrainPlanIndicator`, `TerrainQuadrantStatus`, `sourceStatus`, `quadrantCoverage` ni estados presentacionales persistibles.

La auditoria queda limitada a controles existentes para:

- calidad arquitectonica MMABP;
- preparacion diagramatica candidata;
- exposicion factual en el Panel oficial.

## Fuentes vinculantes localizadas

- `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md`
  - `contract_id`: `platform-diagram-code-generation-contract.capa-1.parallel-production.v1`
- `docs/capa1-parallel-production-design-handoff-contract.md`
  - `contract_id`: `platform-design-handoff-contract.capa-1.parallel-production.v1`
- `docs/parallel-production-readiness-nomenclature-map.md`

## Dos cadenas separadas

### Cadena de calidad arquitectonica

```text
evidencia
-> candidates
-> structural facts
-> registries PM/MoC/PF/OLC
-> MMABP-IR
-> conformance_report
-> consistency_report
-> ArchitectureConsistencyAssessment
```

Controles existentes:

- schemas de bundle, facts, registry, IR, conformance y consistency;
- `scripts/validate-parallel-production.mjs`;
- runtime shadow parcial en `src/services/parallel-production/runtime/*`;
- persistencia shadow en `parallel_production_runtime_artifacts`;
- observacion oficial de panel en `parallel_production_package` y `parallel_production_qa_finding`.

### Cadena de calidad diagramatica

```text
parallel_production_design_handoff_package
o mmabp_ir_package validado
-> diagram_code_generation_package
-> candidate_export_package
```

Controles existentes:

- contrato diagramatico;
- schemas `diagram-code-generation-package` y `candidate-export-package`;
- validadores de package y archivos candidatos;
- fixtures y regresiones de diagram generation/warning modes.

## PM/MoC/PF/OLC

No se encontro un estado factual persistido explicito de:

- `PM completo`
- `MoC completo`
- `PF completo`
- `OLC completo`

Existen registros, IR, coverage por conteo en runtime assessment y pruebas por cuadrante, pero eso no equivale a un estado factual de completitud por cuadrante.

Por tanto:

**No existe soporte factual para mostrar completitud por cuadrante como estado de panel.**

No debe inferirse completitud desde:

- cantidad de candidatos;
- existencia de registry;
- existencia de IR;
- archivo generado;
- cobertura mayor que cero.

## Puente con Panel oficial

Persistencia runtime:

- `parallel_production_runtime_artifacts`
- llaves: `artifact_type`, `artifact_id`, `source_artifact_id`, `case_id`, `session_id`, `run_id`, `correlation_id`

Persistencia panel oficial:

- `parallel_production_package`
- `parallel_production_package_event`
- `parallel_production_qa_finding`
- `parallel_production_qa_finding_event`
- llaves principales: `package_id`, `case_id`, `company_id`
- refs textuales: `source_bundle_ref`, `candidates_ref`, `facts_ref`, `registries_ref`, `ir_ref`, `inventory_ref`

No se encontro puente canonico ejecutado entre `parallel_production_runtime_artifacts` y `parallel_production_package`/`parallel_production_qa_finding`. No hay FK, join service, migration bridge o consumer que reconcilie por `artifact_id`, `correlation_id` o `run_id`.

Conclusion:

**Existe bloqueo factual para combinar automaticamente runtime artifacts y Panel oficial.**

No se debe reconciliar por nombre, fecha o heuristica.

## Exposicion permitida en Panel

El Panel puede exponer grupos de campos existentes, sin estado nuevo:

Calidad del plano MMABP:

- `conformance_status`
- `consistency_factual_status`
- `consistency_temporal_status`
- `consistency_structural_status`
- `consistency_composite_status`
- `aca_status`
- findings/gaps bloqueantes cuando esten en `parallel_production_qa_finding`

Preparacion diagramatica:

- solo si existe fuente factual enlazada:
  - `handoff_readiness`
  - `generation_readiness`
  - `generation_mode`
  - `semantic_preservation_status`
  - `export_readiness`

`Plano del terreno MMABP` puede usarse solo como titulo presentacional. No puede convertirse en estado persistido o derivado hasta existir una regla ya implementada que lo determine.
