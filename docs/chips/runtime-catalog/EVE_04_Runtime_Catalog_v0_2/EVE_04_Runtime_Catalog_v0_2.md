# EVE 04 Runtime Catalog v0.2

**Chip:** `EVE-04-RUNTIME-CATALOG`  
**Estado:** `READY`  
**Validación:** `VALIDATED`  

## Dictamen

El catálogo 40+20 fue regenerado desde D6, preservando la genealogía D8, el gobierno D5 y la reducción D7. La regeneración corrige dos omisiones del artefacto derivado sin modificar las fuentes rectoras: `B6_6_8 / 6.8 / trench_phrase` queda mapeado a `B6-Q38`, y las 33 definiciones antes omitidas quedan re-transducidas desde las fichas canónicas de Bloques 0–6 con nodo, código, documento e interacción runtime trazables.

El presupuesto permanece en **40 interacciones base + 20 causales**. No se activa diagnóstico, export final, IR, registry ni transducción VSM/AHE.

## Módulos

| Módulo | Unidades | Fuente directa |
|---|---:|---|
| `runtime_interactions_base_40` | 40 | D6 `Runtime_Interactions_Base_40` |
| `runtime_interactions_causal_20` | 20 | D6 `Runtime_Interactions_Causal_20` |
| `ux_subfield_structure` | 17 | D6 `UX_Subfield_Structure` |
| `branching_budget_rules` | 10 reglas + 11 pesos | D6 `Branching_Budget_Rules` |
| `readiness_gaps_reentry` | 7 | D6 `Readiness_Gaps_Reentry` |

## Correcciones incorporadas

| ID | Corrección | Resultado |
|---|---|---|
| `CCOV-001` | `B6_6_8 / 6.8 / trench_phrase` incorporado a `B6-Q38` como subcampo separado. | Cobertura **164/164**. |
| `CVAR-001` | 33 definiciones re-transducidas desde fichas canónicas de Bloques 0–6. | **0** referencias pendientes. |

## Distribución por bloque

| Bloque | Base | Causal |
|---|---:|---:|
| 0 | 4 | 1 |
| 0.5 | 3 | 1 |
| 1 | 4 | 1 |
| 2 | 6 | 4 |
| 3 | 5 | 3 |
| 4 | 6 | 4 |
| 5 | 5 | 1 |
| 6 | 5 | 4 |
| 7 | 2 | 1 |

## Regla de integración

1. La cadena de autoridad es D8 -> D7 -> D5 -> D6 -> D4 -> D3; D1 y VSM1 actúan como guardias metodológicas, no como sustitutos del catálogo.
2. La reducción ocurre en runtime, nunca eliminando nodos del Catálogo Madre.
3. El DOCX D5 gobierna y el XLSX D6 ejecuta; ninguna interacción nace de narrativa no materializada como fila.
4. Cada interacción compuesta cuenta como una interacción visible, pero persiste subrespuestas separadas con provenance.
5. Las causales se abren por evidencia estructural, ruta crítica, contradicción o gap; nunca por curiosidad analítica.
6. Conformance se verifica antes de consistencia; una contradicción obliga a volver a la realidad, no a alinear modelos cosméticamente.
7. PM, MoC, PF y OLC permanecen separados; VSM conserva metadatos paralelos de candidate signal.
8. B7 y C20 transportan preclasificación/confidence; no diagnostican ni producen IR, registry o export directo.
9. Los gaps, contradicciones y rutas no cerradas se conservan explícitos hasta reentry o manual review.
10. Producción Paralela consume evidence_items, variables y candidatos gobernados; nunca texto crudo convertido en diagrama.
11. Cuando una definición está presente en la ficha canónica upstream pero fue omitida del artefacto derivado, la corrección se realiza re-transduciendo con nodo, código y documento exactos; no se modifica la fuente ni se inventa contenido.

## Definiciones re-transducidas

| Variable | Bloque | Código(s) | Interacción(es) | Definición |
|---|---:|---|---|---|
| `activity_boundary_clarification` | 0 | 0.B | B0-Q04 | Aclaración confirmada que separa la condición de inicio de la condición de cierre cuando ambas fronteras de la actividad quedaron mezcladas o difusas. |
| `activity_frequency_pattern_hint` | 0 | 0.3a | C01 | Condición o circunstancia declarada que hace más probable una variación en la frecuencia de la actividad y permite caracterizar su patrón no estable. |
| `activity_name_disambiguation` | 0 | 0.A | B0-Q02 | Rasgo operativo declarado que distingue la actividad de otras parecidas cuando su nombre inicial es demasiado amplio o genérico. |
| `activity_scale_adjustment` | 0 | 0.C | B0-Q02 | Delimitación corregida de la porción concreta de trabajo que debe observarse de inicio a fin cuando la actividad original tiene una escala demasiado grande o demasiado pequeña. |
| `activity_semantic_completion` | 0 | 0.D | B0-Q01 | Contenido aportado o corregido por el usuario para completar los componentes faltantes de la estructura semántica de la actividad: objeto o insumo, criterio o procedimiento y/o resultado listo. |
| `activity_semantic_structure_corrected` | 0 | 0.1a | B0-Q01 | Versión corregida y confirmada por el usuario de la estructura semántica que expresa qué hace, sobre qué trabaja y qué resultado queda listo. |
| `capacity_clarification` | 5 | 5.A, 5.B, 5.C | C15 | Aclaración contextual de Bloque 5 que resuelve, según el código de origen, la comparabilidad de la métrica, la tensión entre sacrificio y sostenibilidad o el destino de la variedad residual. |
| `clarifications_bundle_0_5_A` | 0.5 | 0.5.A | C02 | Bundle estructurado que conserva la aclaración del cliente funcional y de la distribución entre beneficio y daño, separándolos del receptor inmediato. |
| `clarifications_bundle_0_5_B` | 0.5 | 0.5.B | B05-Q06 | Bundle estructurado que conserva la aclaración del proceso contenedor o macroproceso cuando la respuesta inicial quedó demasiado amplia o demasiado pegada a la tarea. |
| `clarifications_bundle_0_5_C` | 0.5 | 0.5.C | C02 | Bundle estructurado que conserva la aclaración del hito real habilitado cuando la respuesta inicial describe solamente la tarea local. |
| `compensation_clarification_authority` | 6 | 6.B | C17 | Aclaración que distingue si una práctica informal es una regla oficial no documentada o una práctica tolerada sin aprobación formal. |
| `compensation_clarification_normalized_cost` | 6 | 6.C | C18 | Aclaración que distingue si el sacrificio o costo humano se considera legítimo o si se ha normalizado por habituación. |
| `compensation_clarification_silence` | 6 | 6.A | C19 | Aclaración que explicita el mecanismo de compensación omitido cuando existe una brecha o falla pero no se declaró cómo se evita la caída de la actividad. |
| `delivery_exception_clarification` | 3 | 3.C | C08 | Aclaración que concreta qué se rompe en una entrega fallida y qué hace el receptor o quién compensa cuando ocurre. |
| `dimension_dominante_AB` | 2 | 2.1_AB_Relacion | C04 | Selección confirmada de la dimensión que limita principalmente entre objeto y sujeto, o declaración de que ambas limitan por igual. |
| `dimension_dominante_ABC` | 2 | 2.1_ABC_Relacion | C04 | Selección confirmada de la dimensión que limita principalmente entre objeto, sujeto y acción, o declaración de que las tres limitan por igual. |
| `dimension_dominante_AC` | 2 | 2.1_AC_Relacion | C04 | Selección confirmada de la dimensión que limita principalmente entre objeto y acción, o declaración de que ambas limitan por igual. |
| `dimension_dominante_BC` | 2 | 2.1_BC_Relacion | C04 | Selección confirmada de la dimensión que limita principalmente entre sujeto y acción, o declaración de que ambas limitan por igual. |
| `dimension_dominante_clarificada` | 2 | 2.A | C04 | Aclaración confirmada que resuelve cuál dimensión o combinación limita principalmente la transformación cuando las respuestas previas son ambiguas o contradictorias. |
| `flow_dependency_clarification` | 4 | 4.A | B4-Q23 | Ejemplo concreto que precisa una dependencia previa o posterior demasiado general, identificando qué debe estar listo o quién queda detenido. |
| `flow_nonlinearity_clarification` | 4 | 4.C | C14 | Caso típico que articula cómo se conectan bloqueos, rutas alternativas o paralelismos cuando el flujo no lineal quedó ambiguo. |
| `flow_workaround_clarification` | 4 | 4.B | C14 | Caso típico que concreta pasos extra, reordenamientos o desvíos reales respecto del flujo oficial. |
| `informal_rule_description` | 6 | 6.4 | B6-Q36 | Descripción literal de la práctica o regla no oficial que el actor aplica porque permite que la actividad funcione. |
| `informal_rule_status` | 6 | 6.4 | B6-Q36 | Condición de reconocimiento o autorización organizacional de la regla informal capturada junto con su descripción. |
| `primary_receiver_clarification` | 3 | 3.A | B3-Q18 | Aclaración que identifica al primer receptor real de la entrega y lo distingue de actores que solamente tienen acceso después. |
| `quality_criteria_clarification` | 3 | 3.B | B3-Q20 | Criterio observable que precisa qué tendría que faltar o salir mal para que el receptor considere que la entrega no está correctamente realizada. |
| `transformation_exception_description_clarified` | 2 | 2.B | C05 | Aclaración que identifica la primera manifestación concreta de una transformación que falla o no cambia como debería. |
| `transformation_hidden_changes_description_clarified` | 2 | 2.C | C06 | Aclaración que identifica el cambio no oficial concreto y el actor u origen desde el que ocurre fuera del procedimiento normal. |
| `trigger_ambiguity_resolution_note` | 1 | 1.A | C03 | Nota capturada que registra la señal que el actor usa para decidir iniciar o esperar cuando el disparador es ambiguo. |
| `trigger_dominant_channel` | 1 | 1.C | C03 | Canal que efectivamente prevalece cuando múltiples canales de inicio se contradicen. |
| `trigger_dominant_source` | 1 | 1.C | C03 | Fuente que efectivamente prevalece cuando múltiples fuentes del disparador se contradicen. |
| `trigger_exception_first_symptom` | 1 | 1.B | C03 | Primer síntoma observable de que la actividad debía comenzar pero no comenzó. |
| `trigger_source_hierarchy_note` | 1 | 1.C | C03 | Nota que explicita la jerarquía real entre fuentes y canales del disparador y el criterio con que se resuelven contradicciones. |

## Fallas bloqueadas

- **FG-04-001 — Implementar preguntas desde narrativa DOCX**: `BLOCK_IMPORT` (critical).
- **FG-04-002 — Perder nodos/códigos madre durante reducción**: `FLAG_AND_NOT_CERTIFY` (critical).
- **FG-04-003 — Guardar pregunta compuesta como single_textbox opaco**: `BLOCK_UI_ACTIVATION` (high).
- **FG-04-004 — Inferir captured_user_evidence desde IA/preload sin confirmación**: `BLOCK_VARIABLE_CLOSE` (critical).
- **FG-04-005 — Abrir causales por curiosidad analítica**: `DO_NOT_OPEN` (medium).
- **FG-04-006 — Exceder 20 causales por actividad**: `CARRY_FORWARD_AS_GAP` (high).
- **FG-04-007 — Confundir satisfacción con feedback operativo**: `BLOCK_CANONICAL_ROUTE` (critical).
- **FG-04-008 — Crear Process State sin evento/timer/salida**: `REENTRY_B4` (critical).
- **FG-04-009 — Proyectar concepto ambiguo a MoC/OLC**: `SEMANTIC_GATE_OR_MANUAL_REVIEW` (critical).
- **FG-04-010 — Diagnosticar VSM/AHE en B7/C20**: `BLOCK_OUTPUT` (critical).
- **FG-04-011 — Fusionar funciones VSM con cuadrantes MMABP**: `STORE_DUAL_METADATA_ONLY` (high).
- **FG-04-012 — Ocultar gap o contradicción para avanzar**: `BLOCK_OR_READY_WITH_FLAGS` (critical).
- **FG-04-013 — Permitir que código downstream reescriba el catálogo**: `REJECT_MUTATION` (high).
- **FG-04-014 — Exportar/diagramar desde texto crudo**: `BLOCK_PARALLEL_EXPORT` (critical).
- **FG-04-015 — Confundir omisión de transducción con ausencia conceptual en fuente**: `RETRANSDUCE_FROM_EXACT_SOURCE_AND_REVALIDATE` (critical).

## Cobertura y QA

- Interacciones: **40 base + 20 causales**.
- Nodos madre mapeados: **164/164**.
- Definiciones de variables resueltas: **33/33**.
- Miembros de rutas críticas cubiertos: **18/18**.
- Componentes compuestos con estructura UX: **17/17**.
- QA: **20 PASS, 0 FLAG, 0 FAIL**.
- Fuentes rectoras modificadas: **0**.

## Frontera VSM/AHE

Las señales VSM/AHE permanecen como preparación no diagnóstica. No se fija sistema en foco, recursión, autonomía, función VSM o lectura AHE cerrada desde una interacción aislada. PM/MoC/PF/OLC y las señales VSM/AHE conservan metadatos separados.

## Instalación

Este paquete está validado como artefacto derivado. Su instalación debe realizarse de forma controlada, conservando la misma autoridad documental y sin promoción automática a runtime productivo.

## Archivos del paquete

- DOCX: documento rector humano.
- XLSX: catálogo operativo y matrices de integración.
- JSON: chip completo.
- TS: módulo importable y validadores mínimos.
- MD: referencia ligera.
- Manifest JSON: checksums, conteos y QA.