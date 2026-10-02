# Platform Diagram Code Generation Contract - Capa 1 Parallel Production

## Identidad Del Contrato

- `contract_id`: `platform-diagram-code-generation-contract.capa-1.parallel-production.v1`
- `contract_version`: `1.0.0`
- `source_contract`: `platform-design-handoff-contract.capa-1.parallel-production.v1`
- `runtime_relation`: tramo posterior opcional de Produccion Paralela
- `not_diagnostic`: true
- `does_not_modify_capa2_readiness`: true
- `does_not_modify_core_contract`: true

## Alcance

Este contrato gobierna la preparacion de codigo diagramable candidato a partir de artefactos MMABP ya validados. No modifica Capa 1.0 core, no altera `evidence_bundle_for_transduction`, no cambia `session_ready_for_transduction` y no sustituye el handoff operativo hacia Capa 2.0.

La cadena esperada es:

```text
parallel_production_design_handoff_package
-> diagram_code_generation_package
-> candidate_export_package
```

El contrato tambien permite consumir directamente `mmabp_ir_package` cuando el IR esta validado por `conformance_report` y `consistency_report`. Ese consumo directo nunca puede saltar trazabilidad hacia IR, registry, structural fact, candidate, evidence, scene, block y question cuando aplique.

La nomenclatura canonica de readiness, generacion y exportacion se define en `docs/parallel-production-readiness-nomenclature-map.md`. Este contrato usa esos terminos sin introducir aliases nuevos.

## Proyecciones Permitidas

| Fuente | Salida candidata | Limite |
| --- | --- | --- |
| `PM_IR` | BPMN XML conceptual para Process Map | No inventa procesos, eventos ni target states. |
| `PF_IR` | BPMN XML conceptual/operativo para Process Flow | No inventa tareas, gateways, timers, loops ni workarounds. |
| `MoC_IR` | PlantUML Class Diagram | No inventa clases, atributos, operaciones ni relaciones. |
| `OLC_IR` | PlantUML State Machine | No inventa estados, transiciones, self-loops ni razones. |
| `MoC_IR` / `OLC_IR` | XMI opcional | Solo interoperabilidad UML, sin semantica nueva. |

## Bloqueos Normativos

El generador debe bloquear:

- generacion desde IR no validado
- generacion desde registry sin IR, salvo modo explicito `draft_with_warnings`
- elementos exportados sin trazabilidad a `ir_element_id`
- elementos exportados que inventen clases, estados, transiciones, tareas, eventos o gateways no presentes en IR
- salida diagnostica, monetizable o narrativa
- modificacion del handoff Capa 1.0 -> Capa 2.0
- `generation_readiness = ready_for_candidate_generation` con gaps blocking abiertos
- `generation_readiness = ready_for_candidate_generation` cuando conformance o consistency estan en `partial` o `blocked`

## Estados Con Warnings

`ready_with_warnings` nunca equivale a `ready_for_candidate_generation`. Puede permitir `candidate_export_package` solo cuando `conformance_report` y `consistency_report` estan en `passed` o `passed_with_warnings`, no existen `design_gap` blocking abiertos, y todos los warnings declaran `warning_id`, `warning_type`, `severity`, `affected_artifact_type`, `affected_element_ids`, `reason`, `downstream_effect`, `allowed_uses`, `prohibited_uses`, `related_gap_ids`, `resolution_recommendation`, `traceability_status` y `semantic_preservation_status`.

`draft_with_warnings` es exclusivamente exploratorio. Solo puede usarse con trazabilidad minima a registry o IR, gaps declarados como `design_gap`, sin gaps blocking abiertos, salida marcada como candidate/draft y prohibiciones explicitas contra Capa 2.0, Capa 2.5, Capa 3, diagnostico, monetizacion, narrativa final o export final.

Cuando `generation_source = registry_without_ir`, el paquete debe declarar `reason_for_draft_mode`, `missing_ir_gap_ids`, `blocked_downstream_uses` y `explicit_warning = "Draft artifact cannot be treated as validated MMABP-IR export."`

Reglas de combinacion:

- `generation_mode = draft_with_warnings` implica `semantic_preservation_status = draft_only` o `blocked`.
- `generation_mode = candidate` puede usar `semantic_preservation_status = passed` o `passed_with_warnings`.
- `generation_readiness = ready_for_candidate_generation` no puede coexistir con `semantic_preservation_status = draft_only`.
- Warnings `high` o `critical` impiden `ready_for_candidate_generation` salvo `accepted_risk` con justificacion explicita.
- Ningun warning puede funcionar como bypass de trazabilidad hacia IR, registry, fact, evidence, scene, block y question.

## Reglas De Interpretacion De Readiness Y Exportacion

- `generation_readiness` declara si el tramo puede preparar generacion candidata; no es `export_readiness`.
- `generation_mode` declara como se produce la salida; no certifica el resultado.
- `ready_with_warnings` es un estado de readiness, no un valor de `generation_mode`; `generation_mode` solo admite `candidate`, `draft_with_warnings` o `blocked`.
- `export_readiness` pertenece al `candidate_export_package`; no altera readiness hacia Capa 2.0.
- `semantic_preservation_status` declara preservacion semantica; no declara evidencia, diagnostico ni export final.
- `ready_with_warnings` conserva warnings y no equivale a ready pleno.
- `draft_with_warnings` conserva caracter exploratorio y no puede presentarse como candidate export validado.
- `candidate_export_package` y `generated_candidate_files` son candidatos; no reemplazan evidencia.

## No Confundir

- No confundir `handoff_readiness` con `generation_readiness`.
- No confundir `generation_mode` con `export_readiness`.
- No confundir `candidate_export_package` con export final.
- No confundir `generated_candidate_files` con evidencia o diagnostico.
- No confundir warnings con aprobacion semantica plena.
- No usar aliases legacy como `export_ready`, `export_ready_with_warnings` o `export_blocked_*` en nuevos schemas, fixtures o reportes.

## Orden De Ejecucion

1. Validar `parallel_production_design_handoff_package` o `mmabp_ir_package`.
2. Validar `conformance_report`.
3. Validar `consistency_report`.
4. Validar `design_gap` y confirmar que no existan gaps blocking abiertos.
5. Construir `diagram_code_generation_package`.
6. Preparar `candidate_export_package` solamente como candidato trazado.

## Candidate Export Package

`candidate_export_package` es el artefacto ejecutable de Fase 2. Contiene referencias a archivos generados, hashes de contenido, warnings, gaps, trazabilidad y fronteras. Sus archivos asociados (`generated_candidate_files`) no son evidencia, no son diagnostico, no son monetizacion, no son narrativa final y no pueden alimentar Capa 2.0, Capa 2.5 ni Capa 3 como verdad nueva.

Los generadores permitidos son:

- `PM_IR` -> BPMN XML conceptual.
- `PF_IR` -> BPMN XML conceptual/operativo.
- `MoC_IR` -> PlantUML Class Diagram.
- `OLC_IR` -> PlantUML State Machine.
- XMI opcional, solo si puede expresarse sin perdida semantica grave.

Todo archivo candidato debe incluir `candidate_only`, trazabilidad interna a `source_ir_element_ids`, `source_registry_element_ids`, `source_fact_ids` y, cuando aplique, candidates, evidence, scenes, blocks y questions. Si un formato no puede preservar la semantica MMABP, el generador debe emitir warning/gap metodologico en lugar de fabricar un archivo.

## Fronteras

El paquete de generacion diagramable es un tramo de Produccion Paralela. No diagnostica, no monetiza, no redacta pelicula causal, no produce recomendacion final y no altera Capa 1.0 core ni Capa 2.0.
