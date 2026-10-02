# Investigacion factual: calidad diagramatica en Produccion Paralela

## Dictamen de alcance

Esta investigacion se centra en la **calidad de diagramas** dentro de Produccion Paralela. No redefine criterios metodologicos nuevos: audita las reglas ya estipuladas e inyectadas en el repositorio, su materializacion en contratos, schemas, validadores, fixtures, pruebas y visibilidad actual en el Panel EVE.

No se modifica codigo, migraciones, pruebas, UI, datos, Supabase, SQL ni endpoints.

## Pregunta de investigacion

La pregunta no es si el terreno empresarial MMABP esta completo. Esa investigacion ya quedo cubierta en el dictamen anterior.

La pregunta aqui es:

**Cuando ya existe un terreno MMABP candidate/validado, que reglas controlan si un diagrama candidato es de calidad suficiente para revision, QA diagramatico o preparacion de exportacion, sin inventar semantica ni sustituir evidencia?**

## Hallazgo ejecutivo

Las reglas de calidad diagramatica si estan estipuladas en el repositorio. Estan principalmente en:

- `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md`
- `schemas/parallel-production/diagram-code-generation-package.schema.json`
- `schemas/parallel-production/candidate-export-package.schema.json`
- `scripts/validate-parallel-production.mjs`
- `scripts/parallel-production/generators/validate-generated-candidate-files.mjs`
- `tests/regression/parallel-production/diagram-generation-contract.test.mjs`
- `tests/regression/parallel-production/warning-modes.test.mjs`
- `tests/regression/parallel-production/warning-modes-gates.test.mjs`
- `tests/reports/parallel-production-validation-report.json`

La brecha principal no es ausencia de reglas. La brecha es que el Panel actual muestra una capa general de **Exportacion**, pero no expone todavia una lectura especifica de **calidad diagramatica** que distinga:

- calidad semantica del diagrama;
- trazabilidad del diagrama;
- sintaxis/forma tecnica del archivo generado;
- warnings metodologicos;
- gaps bloqueantes;
- estado candidate vs draft;
- candidate export vs export final.

## Reglas inyectadas de calidad diagramatica

### 1. No generar diagramas desde IR no validado

Regla:

- El contrato bloquea generacion desde IR no validado.
- El validador exige `conformance_report` y `consistency_report`.
- Si IR declara conformance/consistency como `passed`, debe existir reporte pasado o pasado con warnings.

Evidencia:

- `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md`
- `scripts/validate-parallel-production.mjs`
- `tests/regression/parallel-production/conformance-consistency-report.test.mjs`

Implicacion:

Un diagrama no es bueno solo porque renderiza. Debe salir de un IR validado y trazable.

### 2. Formato permitido por cuadrante

Regla:

- `PM_IR` -> `BPMN_XML`
- `PF_IR` -> `BPMN_XML`
- `MoC_IR` -> `PLANTUML_CLASS` o `XMI_OPTIONAL`
- `OLC_IR` -> `PLANTUML_STATE`

Evidencia:

- `docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md`
- `schemas/parallel-production/diagram-code-generation-package.schema.json`
- `schemas/parallel-production/candidate-export-package.schema.json`
- `scripts/validate-parallel-production.mjs`

Implicacion:

La calidad diagramatica incluye correspondencia entre tipo de modelo y formato. Un MoC no debe salir como BPMN y un PM/PF no debe salir como PlantUML class.

### 3. Trazabilidad obligatoria

Regla:

Cada export diagramatico debe conservar referencias a:

- `source_ir_element_ids`
- `source_registry_element_ids`
- `source_fact_ids`
- `source_candidate_ids`
- `source_evidence_ids`
- `source_scene_ids`
- `source_blocks`
- `source_questions`

En `candidate_export_package`, cada archivo candidato exige ademas:

- `file_path`
- `content_hash`
- `traceability_status`
- `semantic_preservation_status`

Evidencia:

- `schemas/parallel-production/diagram-code-generation-package.schema.json`
- `schemas/parallel-production/candidate-export-package.schema.json`
- `scripts/validate-parallel-production.mjs`
- `scripts/parallel-production/generators/validate-generated-candidate-files.mjs`
- `tests/regression/parallel-production/diagram-generation-contract.test.mjs`

Implicacion:

El diagrama debe poder explicar de donde salio cada elemento. Un diagrama visualmente correcto pero sin fuente no pasa calidad EVE.

### 4. No invencion de elementos

Regla:

El generador no puede inventar:

- procesos;
- eventos;
- target states;
- tareas;
- gateways;
- timers;
- loops;
- workarounds;
- clases;
- atributos;
- operaciones;
- relaciones;
- estados;
- transiciones;
- self-loops;
- razones.

Evidencia:

- Contrato de generacion diagramatica.
- `validateDiagramCodeGenerationPackage` valida que referencias IR, registry y facts existan y correspondan al cuadrante.
- Prueba `diagram export cannot invent registry or fact references outside IR`.

Implicacion:

La calidad de diagrama se gobierna por fidelidad semantica, no por estetica ni completitud aparente.

### 5. Preservacion semantica

Estados reales:

- `passed`
- `passed_with_warnings`
- `draft_only`
- `blocked`

Reglas:

- `generation_mode = candidate` solo puede usar `passed` o `passed_with_warnings`.
- `generation_mode = draft_with_warnings` exige `draft_only` o `blocked`.
- `ready_for_candidate_generation` no puede coexistir con `semantic_preservation_status = draft_only`.
- `draft_with_warnings` no puede marcar preservacion semantica como `passed`.

Evidencia:

- `diagram-code-generation-package.schema.json`
- `candidate-export-package.schema.json`
- `validate-parallel-production.mjs`
- `warning-modes.test.mjs`

Implicacion:

La plataforma ya distingue diagrama candidato, diagrama con warning, borrador exploratorio y bloqueo. No debe presentarse todo como "diagrama listo".

### 6. Warnings no son aprobacion plena

Regla:

`ready_with_warnings` puede permitir candidate review solo si cada warning declara:

- `warning_id`
- `warning_type`
- `severity`
- `owner`
- `affected_artifact_type`
- `affected_element_ids`
- `reason`
- `downstream_effect`
- `allowed_uses`
- `prohibited_uses`
- `related_gap_ids`
- `resolution_recommendation`
- `traceability_status`
- `semantic_preservation_status`

Ademas:

- warnings `high` o `critical` bloquean `ready_for_candidate_generation` salvo `accepted_risk` con justificacion explicita.
- un warning sin `downstream_effect` falla.
- un warning no puede operar como bypass de trazabilidad.

Evidencia:

- Contrato de generacion diagramatica.
- `WARNING_REQUIRED_FIELDS` en `validate-parallel-production.mjs`.
- `warning-modes.test.mjs`.

Implicacion:

Un diagrama con warning puede ser revisable, pero no equivale a calidad plena ni export final.

### 7. Gaps bloqueantes bloquean generacion

Regla:

- `generation_readiness = ready_for_candidate_generation` falla si hay design gaps bloqueantes abiertos.
- `ready_with_warnings` tambien falla si un warning referencia gap bloqueante abierto.
- Un `candidate_export_package` no puede estar listo con open blocking design gaps.

Evidencia:

- `diagram-generation-contract.test.mjs`
- `warning-modes.test.mjs`
- `validate-generated-candidate-files.mjs`

Implicacion:

La calidad diagramatica no permite "dibujar alrededor" de un hueco bloqueante. Debe preservarse la brecha.

### 8. Draft con warnings es exploratorio

Regla:

`draft_with_warnings`:

- es exclusivamente exploratorio;
- requiere trazabilidad minima a registry o IR;
- requiere design gap si falta IR;
- exige prohibiciones explicitas contra Capa 2, Capa 2.5, Capa 3, diagnostico, monetizacion, narrativa final y export final;
- no puede producir final export.

Evidencia:

- Contrato de generacion diagramatica.
- `warning-modes.test.mjs`.

Implicacion:

Un borrador diagramatico puede ayudar a revisar estructura, pero no debe circular como plano validado.

### 9. Validacion tecnica de archivos generados

Regla:

El validador de archivos candidatos revisa:

- existencia del archivo;
- `content_hash` SHA-256;
- marcador `candidate_only`;
- trazabilidad minima dentro del contenido;
- BPMN con `bpmn:definitions`;
- cierre XML basico;
- PlantUML con `@startuml` y `@enduml`;
- tokens de trazabilidad en PlantUML;
- XMI opcional con trazabilidad.

Evidencia:

- `scripts/parallel-production/generators/validate-generated-candidate-files.mjs`
- `tests/reports/parallel-production-validation-report.json`

Observacion factual:

El reporte de validacion registra errores de `content_hash does not match file` en fixtures de `candidate_export_package`. Eso indica que la regla existe y detecta divergencia material entre paquete y archivo generado.

Implicacion:

La calidad diagramatica incluye integridad del archivo, no solo validez semantica del paquete.

### 10. Candidate export no es export final

Regla:

- `candidate_export_package` y `generated_candidate_files` son candidatos.
- No reemplazan evidencia.
- No son diagnostico.
- No son monetizacion.
- No son narrativa final.
- No pueden alimentar Capa 2, Capa 2.5 ni Capa 3 como verdad nueva.
- `final_export` esta prohibido para candidate/draft.

Evidencia:

- Contrato de generacion diagramatica.
- `candidate-export-package.schema.json`.
- `warning-modes-gates.test.mjs`.
- `candidate-export-generate.mjs` mantiene `allow_export_promotion: false`.

Implicacion:

Calidad de diagrama en este tramo significa "candidato trazado y revisable", no "producto final exportado".

## Estados reales que deben separarse

### `generation_readiness`

Estados:

- `ready_for_candidate_generation`
- `ready_with_warnings`
- `blocked_by_ir_gaps`
- `blocked_by_conformance`
- `blocked_by_consistency`
- `manual_review_required`

Significado:

Indica si el tramo puede preparar generacion candidata.

### `generation_mode`

Estados:

- `candidate`
- `draft_with_warnings`
- `blocked`

Significado:

Indica como se produce la salida, no certifica el resultado.

### `export_readiness`

Estados:

- `ready_for_review`
- `ready_with_warnings`
- `draft_only`
- `blocked`

Significado:

Pertenece al `candidate_export_package`. No equivale a export final.

### `semantic_preservation_status`

Estados:

- `passed`
- `passed_with_warnings`
- `draft_only`
- `blocked`

Significado:

Indica si el archivo/paquete preserva la semantica del MMABP fuente.

### `traceability_status`

Estados:

- `complete`
- `complete_with_warnings`
- `draft_traceable`
- `blocked`

Significado:

Indica si el diagrama conserva trazabilidad suficiente hacia IR, registry, facts y evidencia.

## Panel actual frente a calidad diagramatica

Archivos revisados:

- `src/features/official-consultant-control-panel/components/ParallelProductionPanel.tsx`
- `src/services/eve/official-control-panel/official-control-panel-parallel-production-service.ts`
- `src/services/eve/official-control-panel/official-control-panel-parallel-production.types.ts`

El Panel actual muestra:

- elegibilidad de exportacion;
- generador disponible/no disponible;
- exportacion bloqueada;
- QA general;
- findings;
- B3/B7;
- capas de Produccion Paralela.

El Panel actual no muestra de forma especifica:

- `generation_readiness`;
- `generation_mode`;
- `export_readiness` del candidate package;
- `semantic_preservation_status`;
- `traceability_status`;
- validez de hash de archivos candidatos;
- formato por cuadrante;
- warnings diagramaticos con `downstream_effect`;
- diferencia visible entre `ready_with_warnings`, `draft_with_warnings` y `ready_for_candidate_generation`;
- razon exacta de bloqueo diagramatico: IR gaps, conformance, consistency, syntax/hash/traceability.

## Matriz de calidad diagramatica para Panel EVE

| Regla ya inyectada | Evidencia de enforcement | Panel actual | Brecha de visibilidad |
|---|---|---|---|
| Generar solo desde IR validado | Validador exige conformance/consistency reports | QA general | No se muestra "IR validado para diagrama". |
| PM/PF usan BPMN | Schema + validador | No visible | Falta estado de formato por cuadrante. |
| MoC usa PlantUML Class/XMI | Schema + validador | No visible | Falta estado MoC diagramatico. |
| OLC usa PlantUML State | Schema + validador | No visible | Falta estado OLC diagramatico. |
| No inventar elementos | Validador cruza IR/registry/facts | No visible | Falta indicador "sin elementos inventados". |
| Trazabilidad completa | Schema + validador | No visible | Falta `traceability_status`. |
| Preservacion semantica | Schema + validador | No visible | Falta `semantic_preservation_status`. |
| Warnings completos | `WARNING_REQUIRED_FIELDS` | Findings generales | No separa warnings diagramaticos de QA general. |
| Gaps bloqueantes bloquean | Tests + validador | Export bloqueada general | No dice si bloqueo es por IR gap, conformance o consistency. |
| Archivos candidate tienen hash | `validate-generated-candidate-files.mjs` | No visible | Falta integridad de archivo generado. |
| BPMN/PlantUML sintaxis minima | Validador de archivos | No visible | Falta estado de sintaxis tecnica. |
| Candidate no es final export | Contrato + schema + tests | Export/generator general | Falta texto directo en panel. |

## Correccion posterior de alcance

La auditoria corregida posterior no autoriza crear un indicador nuevo ni extender el BFF con objetos derivados. Este documento debe leerse solo como inventario de reglas existentes de calidad diagramatica.

Los campos que podrian exponerse en Panel son exclusivamente campos existentes, y solo si aparece una fuente canonica enlazada:

- `handoff_readiness`
- `generation_readiness`
- `generation_mode`
- `export_readiness`
- `semantic_preservation_status`
- `traceability_status`
- `warning.severity`
- `design_gap.blocking_status`
- `design_gap.resolution_status`

Mientras no exista puente canonico entre `parallel_production_runtime_artifacts` o artifacts diagramaticos y `parallel_production_package`, cualquier exposicion diagramatica en el Panel queda bloqueada. No se debe reconciliar por nombre, fecha o heuristica.

## Conclusion

La calidad de diagrama ya esta normada en el repositorio. La tarea pendiente no es inventar criterios, sino **hacer visible en el Panel EVE la lectura factual de esas reglas**: si el diagrama candidato preserva semantica, conserva trazabilidad, respeta formato por cuadrante, pasa validacion tecnica y permanece dentro de la frontera candidate/no final export.
