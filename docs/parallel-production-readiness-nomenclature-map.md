# Parallel Production Readiness Nomenclature Map

Este documento fija el vocabulario canonico de readiness, generacion y exportacion para Produccion Paralela Capa 1.0. No cambia schemas, fixtures, validador ni comportamiento funcional. Su funcion es evitar drift semantico entre documentos, contratos, reportes y pruebas.

## Matriz De Nomenclatura

| Termino | Artefacto donde vive | Significado exacto | Que no significa | Relacion con otros estados | Estado de nomenclatura |
| --- | --- | --- | --- | --- | --- |
| `design_source_readiness` | `mmabp_design_source_bundle` | Indica si el bundle lateral derivado de Capa 1.0 puede iniciar Produccion Paralela. | No autoriza registry, IR, diagramas, exportacion ni Capa 2.0. | Precede a `client_mmabp_structural_facts` e `inventory_readiness`. | Canonico Fase 1. |
| `inventory_readiness` | `inventory-readiness.schema.json`, fixture `inventory-readiness-ready.json` | Indica si los hechos estructurales pueden proyectarse a registros por cuadrante. | No valida IR ni diagram generation. | Solo `ready_for_registry_projection` y `ready_with_inventory_gaps` permiten registry valido. | Canonico Fase 1. |
| `ready_for_registry_projection` | `inventory_readiness.inventory_readiness` | Inventario apto para construir `quadrant_registry_package`. | No significa handoff ni generacion lista. | Estado habilitador de registry. | Canonico Fase 1. |
| `ready_with_inventory_gaps` | `inventory_readiness.inventory_readiness` | Inventario proyectable a registry con gaps declarados. | No equivale a inventario completo ni a IR listo. | Permite registry, pero los gaps deben conservarse. | Canonico Fase 1. |
| `handoff_readiness` | `design-handoff-package.schema.json`, `design-handoff-package.json` | Readiness del paquete entregable al area de Produccion Paralela. | No autoriza generar diagramas ni export final. | Consume bundle, facts, registry e IR; entrega al contrato posterior. | Canonico Fase 1. |
| `ready_for_design_area` | `handoff_readiness.status` | Handoff listo para area de diseno paralela. | No significa `ready_for_candidate_generation`. | Puede preceder a `diagram_code_generation_package`. | Canonico Fase 1. |
| `ready_for_design_area_with_gaps` | `handoff_readiness.status` | Handoff listo para area de diseno con gaps declarados. | No elimina gaps ni habilita export final. | Los `handoff_gaps` siguen siendo auditables. | Canonico Fase 1. |
| `diagramming_readiness` | Documentacion historica del handoff | Nombre conceptual general para readiness de diagramacion. | No es campo normativo de schema vigente. | Se descompone en `generation_readiness`, `generation_mode`, `export_readiness` y `semantic_preservation_status`. | Legacy term, solo referencia documental. |
| `generation_readiness` | `diagram-code-generation-package.schema.json`, fixtures, validation report | Readiness metodologico para preparar generacion candidata. | No describe modo de salida ni estado final del export. | Se combina con `generation_mode` y reports de conformance/consistency. | Canonico Fase 2. |
| `ready_for_candidate_generation` | `generation_readiness` | IR y reports habilitan generacion candidata sin warnings bloqueantes. | No significa export final certificada ni evidencia. | Bloqueado por gaps blocking, conformance/consistency partial o `semantic_preservation_status = draft_only`. | Canonico Fase 2. |
| `ready_with_warnings` | `generation_readiness`, `export_readiness`, candidate package/report | Puede avanzar como candidato con warnings completos, trazados y no bloqueantes. | Nunca equivale a ready pleno ni a export final. | Requiere warnings auditables; puede convivir con `passed_with_warnings`. | Canonico restringido Fase 2. |
| `generation_mode` | `diagram-code-generation-package.schema.json`, `candidate-export-package.schema.json` | Modo de generacion: candidate, draft controlado o blocked. | No reemplaza `generation_readiness` ni `export_readiness`. | Si es `draft_with_warnings`, obliga `semantic_preservation_status = draft_only` o `blocked`. | Canonico Fase 2. |
| `candidate` | `generation_mode` | Generacion candidata desde IR validado y trazable. | No significa export final ni evidencia. | Puede tener `semantic_preservation_status = passed` o `passed_with_warnings`. | Canonico Fase 2. |
| `draft_with_warnings` | `generation_mode` | Generacion exploratoria controlada, usualmente por gaps o registry sin IR completo. | No equivale a candidate export validado ni puede alimentar capas downstream. | Requiere gaps, warnings, `blocked_downstream_uses` y prohibiciones explicitas. | Canonico restringido Fase 2. |
| `export_readiness` | `candidate-export-package.schema.json`, `candidate-export-package.json` | Readiness del paquete candidato generado para revision. | No es readiness de Capa 2.0 ni certificado final. | Deriva de `generation_readiness` y `generation_mode`. | Canonico Fase 2. |
| `ready_for_review` | `export_readiness` | Candidate export listo para revision tecnica. | No significa export final certificado. | Requiere archivos existentes, hashes validos y trazabilidad completa. | Canonico Fase 2. |
| `draft_only` | `export_readiness` y `semantic_preservation_status` | Solo uso exploratorio; no debe usarse como representacion validada. | No permite candidate final ni downstream. | Bloquea uso como export validado, evidencia o input de Capa 2.0/2.5/3. | Canonico restringido Fase 2. |
| `blocked` | `generation_mode`, `export_readiness`, `semantic_preservation_status` | Artefacto o salida bloqueada por gaps, conformance, consistency o trazabilidad. | No equivale a warning manejable. | Debe impedir candidate/export readiness segun el campo donde aparezca. | Canonico Fase 2. |
| `semantic_preservation_status` | `diagram-code-generation-package`, `candidate-export-package`, validation report | Indica si la salida preserva semantica MMABP. | No mide calidad visual ni readiness core. | Valores canonicos: `passed`, `passed_with_warnings`, `draft_only`, `blocked`. | Canonico Fase 2. |
| `passed` | `semantic_preservation_status` | Preserva semantica para el alcance candidato del elemento. | No certifica export final ni evidencia. | Permitido en `generation_mode = candidate`. | Canonico Fase 2. |
| `passed_with_warnings` | `semantic_preservation_status` | Preserva semantica con warnings auditables no bloqueantes. | No oculta warnings ni equivale a aprobacion plena. | Requiere warnings asociados cuando aplica. | Canonico restringido Fase 2. |
| `export_ready` | Diseno estructural original / referencia historica | Intencion historica de export listo. | No es campo canonico actual de schema. | Alias documental aproximado de `ready_for_candidate_generation` + `export_readiness = ready_for_review`, sin reemplazarlos. | Deprecated alias, no usar en nuevos fixtures. |
| `export_ready_with_warnings` | Diseno estructural original / referencia historica | Intencion historica de export listo con advertencias. | No significa `ready_with_warnings` sin trazabilidad. | Alias documental de `ready_with_warnings` cuando hay warnings completos y gaps no bloqueantes. | Deprecated alias, no usar en nuevos fixtures. |
| `export_blocked_*` | Diseno estructural original / referencia historica | Familia historica de bloqueos de exportacion. | No es enum canonico vigente. | Mapear al estado canonico especifico: `blocked_by_ir_gaps`, `blocked_by_conformance`, `blocked_by_consistency`, `manual_review_required` o `blocked`. | Deprecated alias, documentar solo en migraciones. |
| `generated_candidate_files` | Fase 2 / archivos BPMN, PlantUML, XMI opcional | Archivos tecnicos candidatos derivados de IR validado. | No son evidencia nueva, diagnostico ni export final. | Deben estar referenciados por `candidate_export_package` con hashes y trazabilidad. | Canonico Fase 2. |
| `candidate_export_package` | `candidate-export-package.schema.json` | Manifest candidato con archivos generados, hashes, warnings, gaps y trazabilidad. | No equivale a export final certificada. | Consume `diagram_code_generation_package` y `mmabp_ir_package`. | Canonico Fase 2. |

## Vocabulario Canonico De Readiness

Fase 1 usa como vocabulario canonico:

- `design_source_readiness`
- `inventory_readiness`
- `ready_for_registry_projection`
- `ready_with_inventory_gaps`
- `handoff_readiness`
- `ready_for_design_area`
- `ready_for_design_area_with_gaps`

Fase 2 usa como vocabulario canonico:

- `generation_readiness`
- `ready_for_candidate_generation`
- `ready_with_warnings`
- `generation_mode`
- `candidate`
- `draft_with_warnings`
- `export_readiness`
- `ready_for_review`
- `draft_only`
- `blocked`
- `semantic_preservation_status`
- `passed`
- `passed_with_warnings`

## Vocabulario Canonico De Generacion Y Exportacion

- `diagram_code_generation_package` prepara la generacion diagramable candidata.
- `candidate_export_package` manifiesta archivos candidatos generados, hashes, warnings, gaps y trazabilidad.
- `generated_candidate_files` son archivos tecnicos candidatos, no evidencia ni salida final certificada.
- `semantic_preservation_status` gobierna preservacion semantica, no readiness operativa hacia Capa 2.0.

## Vocabulario Legacy O Deprecated

Los siguientes terminos se conservan solo para leer documentos historicos o migraciones:

- `diagramming_readiness`: legacy term conceptual. Usar campos canonicos de Fase 2.
- `export_ready`: deprecated alias. Usar `generation_readiness = ready_for_candidate_generation` y `export_readiness = ready_for_review` cuando aplique.
- `export_ready_with_warnings`: deprecated alias. Usar `ready_with_warnings` con warnings auditables.
- `export_blocked_*`: deprecated alias. Usar estados especificos de generation/export o `blocked`.

No se deben introducir estos terminos legacy en nuevos schemas, fixtures o reportes.

## Terminos Prohibidos O No Canonicos

No usar readiness o exportacion de Produccion Paralela para declarar:

- readiness de Capa 2.0;
- evidencia nueva;
- diagnostico;
- root cause;
- monetizacion;
- pelicula causal;
- narrativa final;
- recomendacion final;
- export final certificada.

## Reglas De Interpretacion De Readiness Y Exportacion

- `ready_with_warnings` no equivale a `ready_for_candidate_generation`.
- `draft_with_warnings` no equivale a candidate export validado.
- `candidate_export_package` no equivale a export final certificada.
- `generated_candidate_files` no equivalen a evidencia nueva.
- `semantic_preservation_status = draft_only` bloquea usos downstream como si fuera exportacion validada.
- `diagramming_readiness`, `generation_readiness` y `export_readiness` no son intercambiables salvo declaracion explicita del contrato.
- `generation_mode` describe modo de produccion, no aprobacion del resultado.
- `ready_with_warnings` es un estado de readiness, no un valor de `generation_mode`; `generation_mode` solo usa `candidate`, `draft_with_warnings` o `blocked`.
- `export_readiness` aplica al paquete candidato generado, no al handoff hacia Capa 2.0.

## No Confundir

- No confundir `handoff_readiness` con `generation_readiness`.
- No confundir `generation_mode` con `export_readiness`.
- No confundir `candidate_export_package` con export final.
- No confundir `generated_candidate_files` con evidencia o diagnostico.
- No confundir warnings con aprobacion semantica plena.
- No confundir `semantic_preservation_status` con readiness de Capa 2.0.
- No confundir aliases legacy (`export_ready`, `export_ready_with_warnings`, `export_blocked_*`) con enums normativos actuales.

## Estrategia De Compatibilidad

La nomenclatura canonica conserva los schemas existentes. No se renombran campos ya estabilizados. Los terminos historicos quedan como aliases documentales, no como nuevos enums. Esta estrategia evita romper fixtures, tests, validation report y consumidores actuales.
