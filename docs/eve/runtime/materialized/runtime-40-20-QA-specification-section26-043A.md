# Runtime 40/20 — QA Specification §26 (043-A)

## Fuente primaria

- Archivo: `EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx`
- SHA-256: `b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8`
- Match: exacto
- Título §26 verbatim: 26. QA de importación, versionado y activación de catálogo
- Intro §26 verbatim: Además de QA T-001 a T-012, el loader del catálogo debe ejecutar pruebas de importación y versionado. Si falla una prueba bloqueante, el catálogo no puede activarse.

## Validación

- Filas: 20
- IDs únicos: 20
- Ausentes: ninguno
- Inventados: 0
- Completo: true

## Filas verbatim T-001…T-020

### T-001

- nombre_literal: T-001 conteo base
- condicion_predicado_literal: COUNT(Runtime_Interactions_Base_40)
- input: COUNT(Runtime_Interactions_Base_40)
- umbral: 40
- resultado_esperado: 40
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 1
- celda/coordenada: {"test_id":"D4!table:13!row:1!col:0","metodo_o_predicado":"D4!table:13!row:1!col:1","criterio_aprobacion":"D4!table:13!row:1!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-002

- nombre_literal: T-002 conteo causal
- condicion_predicado_literal: COUNT(Runtime_Interactions_Causal_20)
- input: COUNT(Runtime_Interactions_Causal_20)
- umbral: 20
- resultado_esperado: 20
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 2
- celda/coordenada: {"test_id":"D4!table:13!row:2!col:0","metodo_o_predicado":"D4!table:13!row:2!col:1","criterio_aprobacion":"D4!table:13!row:2!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-003

- nombre_literal: T-003 source refs
- condicion_predicado_literal: Validar source_nodes/source_codes por interaction_def
- input: Validar source_nodes/source_codes por interaction_def
- umbral: 0 vacíos
- resultado_esperado: 0 vacíos
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 3
- celda/coordenada: {"test_id":"D4!table:13!row:3!col:0","metodo_o_predicado":"D4!table:13!row:3!col:1","criterio_aprobacion":"D4!table:13!row:3!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-004

- nombre_literal: T-004 required fields
- condicion_predicado_literal: Cruzar Required_Field_Model contra 60 interacciones
- input: Cruzar Required_Field_Model contra 60 interacciones
- umbral: 0 vacíos obligatorios
- resultado_esperado: 0 vacíos obligatorios
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 4
- celda/coordenada: {"test_id":"D4!table:13!row:4!col:0","metodo_o_predicado":"D4!table:13!row:4!col:1","criterio_aprobacion":"D4!table:13!row:4!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-005

- nombre_literal: T-005 B7 no IR
- condicion_predicado_literal: Buscar MMABP_IR_candidate_after_conformance_and_consistency en B7
- input: Buscar MMABP_IR_candidate_after_conformance_and_consistency en B7
- umbral: 0 ocurrencias
- resultado_esperado: 0 ocurrencias
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 5
- celda/coordenada: {"test_id":"D4!table:13!row:5!col:0","metodo_o_predicado":"D4!table:13!row:5!col:1","criterio_aprobacion":"D4!table:13!row:5!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-006

- nombre_literal: T-006 B0-Q01 subfields
- condicion_predicado_literal: Buscar B0-Q01 en UX_Subfield_Structure
- input: Buscar B0-Q01 en UX_Subfield_Structure
- umbral: subfields completos
- resultado_esperado: subfields completos
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 6
- celda/coordenada: {"test_id":"D4!table:13!row:6!col:0","metodo_o_predicado":"D4!table:13!row:6!col:1","criterio_aprobacion":"D4!table:13!row:6!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-007

- nombre_literal: T-007 C09 route_missing
- condicion_predicado_literal: optional_variables contiene required_if_route_gap
- input: optional_variables contiene required_if_route_gap
- umbral: true
- resultado_esperado: true
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 7
- celda/coordenada: {"test_id":"D4!table:13!row:7!col:0","metodo_o_predicado":"D4!table:13!row:7!col:1","criterio_aprobacion":"D4!table:13!row:7!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-008

- nombre_literal: T-008 B3-Q22 limpio
- condicion_predicado_literal: Buscar 'pide ajustes/solicita correcciones/rechaza' en B3-Q22
- input: Buscar 'pide ajustes/solicita correcciones/rechaza' en B3-Q22
- umbral: No aparece
- resultado_esperado: No aparece
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 8
- celda/coordenada: {"test_id":"D4!table:13!row:8!col:0","metodo_o_predicado":"D4!table:13!row:8!col:1","criterio_aprobacion":"D4!table:13!row:8!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-009

- nombre_literal: T-009 C09 variables
- condicion_predicado_literal: Validar receiver_feedback_exists, receiver_feedback, gap_flag, route_missing
- input: Validar receiver_feedback_exists, receiver_feedback, gap_flag, route_missing
- umbral: Presentes sin duplicado
- resultado_esperado: Presentes sin duplicado
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 9
- celda/coordenada: {"test_id":"D4!table:13!row:9!col:0","metodo_o_predicado":"D4!table:13!row:9!col:1","criterio_aprobacion":"D4!table:13!row:9!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-010

- nombre_literal: T-010 process state/timer
- condicion_predicado_literal: PST-001..PST-006 presentes y conectados con B4-Q24/C11
- input: PST-001..PST-006 presentes y conectados con B4-Q24/C11
- umbral: true
- resultado_esperado: true
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 10
- celda/coordenada: {"test_id":"D4!table:13!row:10!col:0","metodo_o_predicado":"D4!table:13!row:10!col:1","criterio_aprobacion":"D4!table:13!row:10!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-011

- nombre_literal: T-011 semantic gates
- condicion_predicado_literal: SEM-001..SEM-007 presentes
- input: SEM-001..SEM-007 presentes
- umbral: true
- resultado_esperado: true
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 11
- celda/coordenada: {"test_id":"D4!table:13!row:11!col:0","metodo_o_predicado":"D4!table:13!row:11!col:1","criterio_aprobacion":"D4!table:13!row:11!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-012

- nombre_literal: T-012 VSM/AHE frontera
- condicion_predicado_literal: B7/C20 no registry/IR/export directo
- input: B7/C20 no registry/IR/export directo
- umbral: true
- resultado_esperado: true
- caracter_bloqueante: gate_importacion_T001_T012_segun_spec
- tabla: 13
- fila: 12
- celda/coordenada: {"test_id":"D4!table:13!row:12!col:0","metodo_o_predicado":"D4!table:13!row:12!col:1","criterio_aprobacion":"D4!table:13!row:12!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-013

- nombre_literal: T-013 metadata_version_alignment
- condicion_predicado_literal: Version_Control, DOCX y XLSX deben declarar v1.1.1/v1.0.1 sin contradicción.
- input: Version_Control, DOCX y XLSX deben declarar v1.1.1/v1.0.1 sin contradicción.
- umbral: Sin etiquetas obsoletas en campos de autoridad.
- resultado_esperado: Sin etiquetas obsoletas en campos de autoridad.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 1
- celda/coordenada: {"test_id":"D4!table:23!row:1!col:0","metodo_o_predicado":"D4!table:23!row:1!col:1","criterio_aprobacion":"D4!table:23!row:1!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-014

- nombre_literal: T-014 required_sheets_present
- condicion_predicado_literal: Validar presencia de hojas Runtime_Interactions_Base_40, Runtime_Interactions_Causal_20, UX_Subfield_Structure, Critical_Routes, QA_Checklist.
- input: Validar presencia de hojas Runtime_Interactions_Base_40, Runtime_Interactions_Causal_20, UX_Subfield_Structure, Critical_Routes, QA_Checklist.
- umbral: Todas presentes.
- resultado_esperado: Todas presentes.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 2
- celda/coordenada: {"test_id":"D4!table:23!row:2!col:0","metodo_o_predicado":"D4!table:23!row:2!col:1","criterio_aprobacion":"D4!table:23!row:2!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-015

- nombre_literal: T-015 required_columns_present
- condicion_predicado_literal: Validar columnas obligatorias definidas en Required_Field_Model.
- input: Validar columnas obligatorias definidas en Required_Field_Model.
- umbral: 0 columnas faltantes.
- resultado_esperado: 0 columnas faltantes.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 3
- celda/coordenada: {"test_id":"D4!table:23!row:3!col:0","metodo_o_predicado":"D4!table:23!row:3!col:1","criterio_aprobacion":"D4!table:23!row:3!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-016

- nombre_literal: T-016 checksum_registered
- condicion_predicado_literal: Registrar checksum de XLSX y DOCX al activar catálogo.
- input: Registrar checksum de XLSX y DOCX al activar catálogo.
- umbral: Checksum no nulo.
- resultado_esperado: Checksum no nulo.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 4
- celda/coordenada: {"test_id":"D4!table:23!row:4!col:0","metodo_o_predicado":"D4!table:23!row:4!col:1","criterio_aprobacion":"D4!table:23!row:4!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-017

- nombre_literal: T-017 no_deprecated_version_labels
- condicion_predicado_literal: Buscar labels v1.1 residuales en campos operativos.
- input: Buscar labels v1.1 residuales en campos operativos.
- umbral: 0 residuales en Version_Control/autoridad.
- resultado_esperado: 0 residuales en Version_Control/autoridad.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 5
- celda/coordenada: {"test_id":"D4!table:23!row:5!col:0","metodo_o_predicado":"D4!table:23!row:5!col:1","criterio_aprobacion":"D4!table:23!row:5!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-018

- nombre_literal: T-018 catalog_activation_blocked_on_qa_failure
- condicion_predicado_literal: El loader debe impedir status active si falla cualquier QA bloqueante.
- input: El loader debe impedir status active si falla cualquier QA bloqueante.
- umbral: Catálogo no activo si falla QA.
- resultado_esperado: Catálogo no activo si falla QA.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 6
- celda/coordenada: {"test_id":"D4!table:23!row:6!col:0","metodo_o_predicado":"D4!table:23!row:6!col:1","criterio_aprobacion":"D4!table:23!row:6!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-019

- nombre_literal: T-019 source_node_integrity
- condicion_predicado_literal: Todo source_code debe existir en Catálogo Madre o estar declarado como runtime control node.
- input: Todo source_code debe existir en Catálogo Madre o estar declarado como runtime control node.
- umbral: 0 huérfanos no justificados.
- resultado_esperado: 0 huérfanos no justificados.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 7
- celda/coordenada: {"test_id":"D4!table:23!row:7!col:0","metodo_o_predicado":"D4!table:23!row:7!col:1","criterio_aprobacion":"D4!table:23!row:7!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8

### T-020

- nombre_literal: T-020 B7_no_direct_projection
- condicion_predicado_literal: B7-Q39/B7-Q40/C20 no tienen MoC/IR/registry directo.
- input: B7-Q39/B7-Q40/C20 no tienen MoC/IR/registry directo.
- umbral: 0 proyecciones directas.
- resultado_esperado: 0 proyecciones directas.
- caracter_bloqueante: bloqueante_para_activacion_segun_parrafo_section_26
- tabla: 23
- fila: 8
- celda/coordenada: {"test_id":"D4!table:23!row:8!col:0","metodo_o_predicado":"D4!table:23!row:8!col:1","criterio_aprobacion":"D4!table:23!row:8!col:2"}
- source_file: EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- source_sha256: b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8
