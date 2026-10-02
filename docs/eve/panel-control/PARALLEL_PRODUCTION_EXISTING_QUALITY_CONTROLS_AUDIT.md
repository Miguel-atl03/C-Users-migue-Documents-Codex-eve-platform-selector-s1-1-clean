# Auditoria de controles existentes de calidad de Produccion Paralela

## Dictamen de alcance

Auditoria documental y factual. No se implementa nada. No se crean estados, reglas, contratos ni indicadores nuevos.

Dictamen permitido:

**CONTROLES EXISTENTES DE CALIDAD DE PRODUCCION PARALELA AUDITADOS SIN INTRODUCIR REGLAS NUEVAS**

## Fuentes vinculantes

- `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md`
  - `contract_id`: `platform-diagram-code-generation-contract.capa-1.parallel-production.v1`
- `docs/capa1-parallel-production-design-handoff-contract.md`
  - `contract_id`: `platform-design-handoff-contract.capa-1.parallel-production.v1`
- `docs/parallel-production-readiness-nomenclature-map.md`

## Separacion de cadenas

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

Materializacion:

- Schemas: `mmabp-design-source-bundle`, `structural-fact`, `quadrant-registry`, `mmabp-ir`, `conformance-report`, `consistency-report`, `design-gap`.
- Validador: `scripts/validate-parallel-production.mjs`.
- Runtime shadow parcial: `src/services/parallel-production/runtime/*`.
- Persistencia shadow: `parallel_production_runtime_artifacts`.
- Panel oficial: `parallel_production_package`, `parallel_production_qa_finding`.

### Cadena de calidad diagramatica

```text
parallel_production_design_handoff_package
o mmabp_ir_package validado
-> diagram_code_generation_package
-> candidate_export_package
```

Materializacion:

- Contrato diagramatico.
- Schemas de `diagram-code-generation-package` y `candidate-export-package`.
- Validador integral y validador de archivos candidatos.
- Pruebas de diagram generation, warnings y gates.

## Inventario de vocabularios reales

| Vocabulario | Valores reales | Schema/constante | Productor | Persistencia | Consumidor | Prueba/validacion | Regla de entrada/salida/bloqueos |
|---|---|---|---|---|---|---|---|
| `handoff_readiness.status` | `ready_for_design_area`, `ready_for_design_area_with_gaps`, `partial_handoff`, `blocked_by_missing_artifact`, `blocked_by_ir_gap`, `manual_review_required` | `design-handoff-package.schema.json`; `VALID_HANDOFF_READINESS` | Fixtures/generadores locales de handoff | Fixtures; no tabla dedicada localizada | `validateDesignHandoffPackage`; contrato diagramatico posterior | `validate-parallel-production.mjs` | Ready bloqueado por design gaps blocking abiertos; with gaps exige `handoff_gaps`. |
| `generation_readiness` | `ready_for_candidate_generation`, `ready_with_warnings`, `blocked_by_ir_gaps`, `blocked_by_conformance`, `blocked_by_consistency`, `manual_review_required` | `diagram-code-generation-package.schema.json`; `VALID_GENERATION_READINESS` | Fixtures/generadores locales | Fixtures; no tabla dedicada localizada | `validateDiagramCodeGenerationPackage` | `diagram-generation-contract.test.mjs`, `warning-modes.test.mjs` | Ready exige reports passed/passed_with_warnings; bloquea gaps blocking, conformance/consistency partial/blocked. |
| `generation_mode` | `candidate`, `draft_with_warnings`, `blocked` | `diagram-code-generation-package`, `candidate-export-package`, `VALID_GENERATION_MODES` | Fixtures/generadores locales; runtime candidate export usa `candidate` | Fixtures; runtime package_json en artifact shadow | Validador de diagram package y candidate package | `warning-modes.test.mjs`, `warning-modes-gates.test.mjs` | `draft_with_warnings` requiere razon, gaps, prohibiciones y no puede ser final export. |
| `export_readiness` | `ready_for_review`, `ready_with_warnings`, `draft_only`, `blocked` | `candidate-export-package.schema.json` | Candidate export fixtures/generator local | Fixtures; runtime shadow usa estados no identicos (`candidate_ready`, `ready_with_warnings`, `blocked`) | Validador candidate export/files | `validate-generated-candidate-files.mjs`; warning tests | No equivale a export final ni `export_eligibility` del Panel. |
| `semantic_preservation_status` | `passed`, `passed_with_warnings`, `draft_only`, `blocked` | Diagram/candidate schemas; `VALID_SEMANTIC_PRESERVATION` | Fixtures/generadores locales | Fixtures/reportes; no campo panel | Validadores | `warning-modes.test.mjs` | Candidate permite passed/passed_with_warnings; draft exige draft_only/blocked. |
| `conformance_report.conformance_status` | `passed`, `passed_with_warnings`, `partial`, `blocked` | `conformance-report.schema.json`; `VALID_REPORT_STATUSES` | Fixtures/reportes locales | Fixtures; panel tiene otro enum `not_evaluated/passed/failed/blocked` | `validateConformanceReport`; `validateDiagramCodeGenerationPackage` | `conformance-consistency-report.test.mjs` | Ready diagramatico requiere passed/passed_with_warnings. |
| `consistency_report.consistency_status` | `passed`, `passed_with_warnings`, `partial`, `blocked` | `consistency-report.schema.json`; `VALID_REPORT_STATUSES` | Fixtures/reportes locales | Fixtures; panel tiene factual/temporal/structural/composite status | `validateConsistencyReport`; `validateDiagramCodeGenerationPackage` | `conformance-consistency-report.test.mjs` | Ready diagramatico requiere passed/passed_with_warnings. |
| `design_gap.blocking_status` | `non_blocking`, `warning`, `blocking` | `design-gap.schema.json`; `VALID_GAP_BLOCKING` | Fixtures/gap records locales | Fixtures; no tabla gap dedicada de PP localizada | Validadores | `design-gap.test.mjs`, warning tests | `blocking` con `open`/`in_review` bloquea readiness. |
| `design_gap.resolution_status` | `open`, `in_review`, `resolved`, `accepted_risk` | `design-gap.schema.json`; `VALID_GAP_RESOLUTION` | Fixtures/gap records locales | Fixtures | Validadores | warning tests | `accepted_risk` permite warning high/critical solo con justificacion. |
| `warning.severity` | `low`, `medium`, `high`, `critical` | `diagram-code-generation-package.schema.json`; `VALID_GAP_SEVERITIES` | Fixtures/generadores locales | Fixtures/reportes | Validadores | `warning-modes.test.mjs` | high/critical bloquea ready salvo accepted risk. |
| `ArchitectureConsistencyAssessment` | `Satisfied`, `WithFindings`, `Blocked` | Runtime assessment; Panel `PP_ACA_STATUSES` | `assessment-run.mjs`; package records panel | Runtime artifact shadow; `parallel_production_package.aca_status` | Candidate export runtime; Panel | `runtime-shadow-chain.test.mjs`; point 14 tests | `WithFindings` no es `Satisfied`; export eligibility panel exige `Satisfied`. |

## PM/MoC/PF/OLC

No existe estado factual explicito de completitud por cuadrante:

- `PM completo`: ausente.
- `MoC completo`: ausente.
- `PF completo`: ausente.
- `OLC completo`: ausente.

Hay schemas, fixtures, tests por cuadrante y coverage por presencia/candidate_count, pero no estado de completitud materializado.

Conclusion vinculante:

**No existe soporte factual para mostrar completitud por cuadrante.**

## Puente runtime vs Panel

No se encontro relacion canonica ejecutada entre:

- `parallel_production_runtime_artifacts`
- `parallel_production_package`
- `parallel_production_qa_finding`

Llaves presentes:

- Runtime: `artifact_id`, `artifact_type`, `source_artifact_id`, `case_id`, `session_id`, `run_id`, `correlation_id`.
- Panel: `package_id`, `case_id`, `package_ref`, refs textuales por capa, findings por `package_id`.

Bloqueo:

No existe FK, migration bridge, repository join ni servicio de reconciliacion canonica. No se debe reconciliar por heuristica.
