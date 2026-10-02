# Capa 1 Parallel Production Design Handoff Contract

## Identidad Del Contrato

- `contract_id`: `platform-design-handoff-contract.capa-1.parallel-production.v1`
- `contract_version`: `1.0.0`
- `source_core_contract`: `platform-consumption-contract.capa-1.v2.1`
- `source_core_manifest`: `capa-1-v2-1-runtime-manifest@1.0.0`
- `runtime_relation`: salida lateral opcional
- `canonical_boundary`: no modifica Capa 1.0 core ni el handoff operativo hacia Capa 2.0
- `does_not_modify_capa2_readiness`: true
- `not_diagnostic`: true

## Estado

`mmabp_design_source_bundle@1.0.0` es una salida lateral opcional derivada de Capa 1.0 core. No reemplaza `evidence_bundle_for_transduction`, no modifica `session_ready_for_transduction` y no cambia el contrato operativo hacia Capa 2.0.

Este contrato implementa el tramo de preparacion y handoff de diseno de la Produccion Paralela. No implementa todavia la generacion final de BPMN XML, PlantUML ni XMI. La generacion diagramable queda cubierta por un contrato posterior de Diagram Code Generation, que debera consumir MMABP-IR o el handoff package sin inventar semantica, diagnosticar ni alterar Capa 1.0 core.

## Cadena Core Intacta

```text
Capa 1.0 core -> scene_canonical_record -> evidence_bundle_for_transduction -> Capa 2.0
```

## Cadena Paralela

```text
Capa 1.0 core -> mmabp_design_source_bundle -> Produccion Paralela MMABP
```

La cadena de implementacion validada es:

```text
mmabp_design_source_bundle
-> client_mmabp_structural_facts
-> quadrant_registry_package
-> mmabp_ir_package
-> parallel_production_design_handoff_package
```

## Artefactos Normativos

| Artefacto | Ruta | Funcion |
| --- | --- | --- |
| Bundle fuente | `schemas/parallel-production/mmabp-design-source-bundle.schema.json` | Define entrada lateral desde Capa 1.0 core. |
| Hecho estructural | `schemas/parallel-production/structural-fact.schema.json` | Define unidad atomica del inventario MMABP. |
| Registros por cuadrante | `schemas/parallel-production/quadrant-registry.schema.json` | Define registros PM/PF/MoC/OLC antes de IR. |
| MMABP-IR | `schemas/parallel-production/mmabp-ir.schema.json` | Define representacion intermedia computable. |
| Paquete handoff | `schemas/parallel-production/design-handoff-package.schema.json` | Define cierre entregable al area de produccion paralela. |
| Readiness de inventario | `schemas/parallel-production/inventory-readiness.schema.json` | Declara si los hechos estructurales pueden proyectarse a registros. |
| Design gap | `schemas/parallel-production/design-gap.schema.json` | Entidad comun de gap trazable y bloqueante/no bloqueante. |
| Conformance report | `schemas/parallel-production/conformance-report.schema.json` | Auditoria de reglas internas por artefacto antes de IR listo. |
| Consistency report | `schemas/parallel-production/consistency-report.schema.json` | Auditoria cruzada PM/PF/MoC/OLC antes de diagramacion. |
| Diagram code generation | `schemas/parallel-production/diagram-code-generation-package.schema.json` | Prepara el tramo posterior sin producir diagramas finales como contrato actual. |
| Candidate export package | `schemas/parallel-production/candidate-export-package.schema.json` | Define el paquete candidato de archivos diagramables generados, manifest, hashes, warnings, gaps y trazabilidad. |
| Contrato posterior | `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md` | Define reglas para BPMN XML, PlantUML y XMI candidatos. |
| Validador | `scripts/validate-parallel-production.mjs` | Ejecuta validacion integral de contrato y fixtures. |
| Regresion | `tests/regression/parallel-production/*.test.mjs` | Protege invariantes del contrato. |

## Orden De Validacion

El validador debe ejecutar la cadena en este orden:

1. Validar que el contrato core siga requiriendo `evidence_bundle_for_transduction`.
2. Validar que el contrato core no requiera `mmabp_design_source_bundle`.
3. Validar existencia de schemas normativos de Produccion Paralela.
4. Validar existencia de schemas de auditoria y diagram code generation.
5. Validar existencia de fixtures por tramo.
6. Validar `mmabp_design_source_bundle`.
7. Validar `client_mmabp_structural_facts` contra el bundle.
8. Validar `inventory_readiness`.
9. Validar `quadrant_registry_package` contra el inventario.
10. Validar `conformance_report`.
11. Validar `consistency_report`.
12. Validar `mmabp_ir_package` contra registros y reports.
13. Validar `parallel_production_design_handoff_package` contra la cadena completa.
14. Validar `diagram_code_generation_package` si existe fixture del tramo nuevo.
15. Generar y validar `candidate_export_package` y sus `generated_candidate_files` cuando exista el tramo de Fase 2.
16. Emitir `tests/reports/parallel-production-validation-report.json`.

## Contrato Del Bundle

El bundle debe contener:

- identificacion del bundle, cliente, sesion, canon y manifest de origen
- indice de escenas fuente
- evidencia literal con escena, bloque, pregunta y proveniencia
- derivaciones canonicas relevantes
- candidatos estructurales por cuadrante PM, PF, MoC y OLC
- flags, gaps y confianza por candidato
- `design_source_readiness`
- fronteras explicitas de no diagnostico y no alteracion de Capa 2.0

## Contrato Del Hecho Estructural

`structural_fact@1.0.0` es la unidad atomica del inventario `client_mmabp_structural_facts`. Cada hecho debe poder regresar al bundle fuente, a la escena, al candidato, a la evidencia literal, al bloque y a la pregunta que lo sostienen.

Cada hecho estructural debe contener:

- `fact_id`, `client_id`, `session_id` y `scene_id`
- rol o usuario fuente
- `block_origin` y `question_origin`
- `literal_evidence`
- `normalized_fact_type`
- `canonical_label`
- `quadrant_targets`
- `source_candidate_ids`
- `source_evidence_ids`
- `confidence`
- `conformance_status`
- `consistency_status`
- `projection_status`
- `flags`, `gaps` y fronteras de no diagnostico

El inventario debe consolidarse por `client_id`, no por usuario, y debe bloquear facts que apunten a clientes, escenas, candidatos o evidencias no declaradas en el `mmabp_design_source_bundle`.

`inventory_readiness` formaliza el paso entre `client_mmabp_structural_facts` y `quadrant_registry_package`. Un registro por cuadrante solo puede considerarse valido cuando el inventario esta en `ready_for_registry_projection` o `ready_with_inventory_gaps`. Estados blocked o `manual_review_required` bloquean la proyeccion a registry.

## Contrato De Design Gap

`design_gap@1.0.0` es una entidad de primera clase para declarar faltantes, conflictos semanticos, gaps de trazabilidad, conformance, consistency, projection o generation.

Cada gap debe declarar `gap_id`, `gap_type`, `severity`, `blocking_status`, `source_artifact_type`, `source_artifact_id`, `source_element_id`, `affected_quadrants`, `required_evidence`, `reentry_question`, `resolution_owner` y `resolution_status`.

Los gaps blocking abiertos impiden declarar handoff o diagram generation como listos. Los gaps de tipo `missing_evidence` deben declarar `required_evidence`.

## Contrato De Registros Por Cuadrante

`quadrant_registry_package@1.0.0` organiza el inventario en cuatro registros funcionales:

- `PM`: procesos, eventos, target states, soportes, sincronizaciones y alcance.
- `PF`: flujos, tareas, process states, timers, workarounds, gateways y loops.
- `MoC`: clases, atributos, operaciones, relaciones, roles, phases, ends y conflictos conceptuales.
- `OLC`: estados, transiciones, razones, operaciones, self-loops, time events y finales.

Los registros no son diagramas y no son todavia `MMABP-IR`. Su funcion es preparar una estructura trazada por cuadrante. Cada elemento de registro debe declarar `source_fact_ids`, y cada `fact_id` debe existir en `client_mmabp_structural_facts`.

El contrato bloquea:

- elementos que usan facts inexistentes
- elementos colocados en un cuadrante no soportado por el fact
- facts que no quedan representados ni declarados como gap en sus cuadrantes objetivo
- filtraciones diagnosticas, readiness de Capa 2.0, monetizacion o narrativa final

## Contrato MMABP-IR

`mmabp_ir_package@1.0.0` proyecta los registros por cuadrante hacia una representacion intermedia computable:

- `PM_IR`
- `PF_IR`
- `MoC_IR`
- `OLC_IR`

MMABP-IR no es diagrama, no es export package, no es BPMN, no es PlantUML y no es XMI. Es el contrato semantico previo a exportacion.

Cada elemento IR debe declarar:

- `ir_element_id`
- `ir_element_type`
- `label`
- `source_registry_element_ids`
- `source_fact_ids`
- `conformance_status`
- `consistency_status`

El contrato bloquea:

- elementos IR que apunten a registry elements inexistentes
- elementos IR colocados fuera del cuadrante del registry element fuente
- facts que no esten soportados por el registry element fuente
- registry elements que no quedan proyectados ni declarados como gap en el IR
- cualquier intento de tratar el IR como diagrama, exportacion o diagnostico

MMABP-IR listo requiere auditoria previa. No se acepta IR con conformance o consistency aprobada si no existe `conformance_report` o `consistency_report` en `passed` o `passed_with_warnings`.

## Contrato De Auditoria

`conformance_report` se ejecuta antes de `consistency_report` y valida reglas internas de cada artefacto o elemento. `consistency_report` se ejecuta antes de diagram generation y valida relaciones cruzadas PM/PF, PF/OLC, MoC/PF, MoC/OLC y PM/PF/OLC cuando existan datos.

Estos reports no diagnostican, no monetizan y no agregan semantica nueva; solo declaran hallazgos, warnings y gaps trazados.

## Contrato De Design Handoff Package

`parallel_production_design_handoff_package@1.0.0` es el paquete de cierre para el area de produccion paralela que generara diagramas como codigo.

El paquete no contiene diagramas finales, BPMN XML final, PlantUML final, XMI final ni exportaciones finales. Contiene referencias y readiness:

- `mmabp_design_source_bundle_id`
- `client_mmabp_structural_facts_id`
- `quadrant_registry_package_id`
- `mmabp_ir_package_id`
- `handoff_readiness`
- `handoff_gaps`
- `receiving_area_contract`

El area receptora puede generar codigo diagramable candidato, pero debe preservar referencias de origen, no inventar semantica y no diagnosticar.

El tramo posterior queda normado por `platform-diagram-code-generation-contract.capa-1.parallel-production.v1`.

## Fase 2: Diagram Code Generation Candidate

La Fase 2 agrega generacion real de artefactos diagramables candidatos desde `MMABP-IR` validado. La cadena lateral queda:

```text
diagram_code_generation_package
-> candidate_export_package
-> generated_candidate_files
```

`generated_candidate_files` no son evidencia nueva, no reemplazan evidencia, no alimentan readiness de Capa 2.0, Capa 2.5 ni Capa 3 y no pueden presentarse como export final certificado. Son representaciones tecnicas candidatas de semantica ya existente en IR.

Las proyecciones permitidas son:

- `PM_IR` -> BPMN XML conceptual para Process Map.
- `PF_IR` -> BPMN XML conceptual/operativo para Process Flow.
- `MoC_IR` -> PlantUML Class Diagram.
- `OLC_IR` -> PlantUML State Machine.
- XMI opcional solo cuando pueda preservarse semantica sin degradacion.

Cada archivo generado debe declarar `candidate_only`, `generated_by = EVE Parallel Production` y trazabilidad hacia IR, registry, structural fact, candidate, evidence, scene, block y question cuando aplique. `candidate_export_package` conserva `file_path`, `content_hash`, warnings, gaps, usos permitidos y usos prohibidos.

`ready_with_warnings` y `draft_with_warnings` son estados restringidos. No equivalen a export final ni a readiness core: los warnings deben conservar owner, severidad, elementos afectados, razon metodologica y efecto downstream. Los gaps blocking abiertos impiden readiness candidata.

Las reglas operativas detalladas de generacion, validacion de archivos, `candidate_export_package`, warnings y bloqueos de `generation_readiness` pertenecen al contrato posterior `platform-diagram-code-generation-contract.capa-1.parallel-production.v1`. Este handoff contract solo declara la transicion hacia ese tramo y conserva las fronteras de Capa 1.0 core.

Las reglas especificas del `parallel_production_design_handoff_package` permanecen en la seccion anterior de este contrato. No deben leerse como reglas de generacion BPMN, PlantUML, XMI o candidate export.

## Readiness Separados

- `preclassification_readiness` y `session_ready_for_transduction` pertenecen a Capa 1.0 core y Capa 2.0.
- `design_source_readiness` solo decide si puede iniciar Produccion Paralela.
- `diagramming_readiness` es un termino documental historico para etapas posteriores de MMABP-IR y exportacion; el vocabulario canonico vigente usa `generation_readiness`, `generation_mode`, `export_readiness` y `semantic_preservation_status` segun el artefacto.

La matriz completa de equivalencias, aliases legacy y reglas de interpretacion vive en `docs/parallel-production-readiness-nomenclature-map.md`.

## Prohibiciones

La Produccion Paralela no puede:

- modificar bloques 0, 0.5, 1, 2, 3, 4, 5, 6 o 7
- reemplazar `evidence_bundle_for_transduction`
- modificar readiness hacia Capa 2.0
- emitir nodos EVE, root cause, monetizacion, pelicula causal o narrativa final
- generar elementos MMABP sin trazabilidad a evidencia

## Validacion Local

```powershell
npm run generate:parallel-production-diagrams
npm run validate:parallel-production-generated
npm run validate:parallel-production
npm run test:parallel-production
```

## Criterio De Aceptacion Del Tramo

La implementacion se considera aceptada cuando:

- el reporte `parallel-production-validation-report.json` queda en `passed`
- existe al menos un fixture valido por cada artefacto normativo
- las pruebas de regresion protegen referencias rotas, drift de cliente, gaps inexistentes y filtraciones diagnosticas
- `npm run validate` sigue pasando para Capa 1.0 core
- ningun schema de Produccion Paralela se vuelve requerido por `platform-consumption-contract.capa-1.v2.1`
