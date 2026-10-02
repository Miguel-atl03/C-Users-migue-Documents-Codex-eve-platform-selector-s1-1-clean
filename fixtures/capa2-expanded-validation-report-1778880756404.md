# Capa 2 MVP - Validacion ampliada por sesion

Generated at: 2026-05-15T21:32:36.403Z

## Gate formal de salida

Resultado: NO PASO

Capa 2 por sesion no debe pasar todavia a Capa 2.5; la validacion ampliada justifica una micro-ronda posterior basada en evidencia nueva.

| Check | Resultado | Valor |
|---|---|---|
| known_case_accuracy_at_least_75_percent | fail | 0.571 |
| mutation_boundary_checks_pass | pass | [{"id":"baseline_case3_is_n03","passed":true,"detail":"N03"},{"id":"reinforce_n03_stays_n03","passed":true,"detail":"N03"},{"id":"reinforce_n06_switches_n06","passed":true,"detail":"N06"},{"id":"remove_temporal_break_stays_n03","passed":true,"detail":"N03"}] |
| no_single_root_above_60_percent_in_expanded_validation | fail | {"dominantRoot":"N03","share":0.75} |
| no_high_confidence_known_divergences | fail | [{"roleNumber":2,"expected":"N06","actual":"N03","confidence":"high","sourceReport":"fixtures\\capa2-calibration-report-1778880645983.json"},{"roleNumber":3,"expected":"N04","actual":"N03","confidence":"high","sourceReport":"fixtures\\capa2-calibration-report-1778880645983.json"},{"roleNumber":4,"expected":"N10","actual":"N03","confidence":"high","sourceReport":"fixtures\\capa2-calibration-report-1778880645983.json"}] |
| expert_review_visible_for_nonfinal_outputs | pass | 0 |

## Sesiones evaluadas

| fuente | rol | esperado | producido | confianza | estado |
|---|---:|---|---|---|---|
| fixtures\capa2-calibration-report-1778873972283.json | 1 | N06 | N06 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778873972283.json | 2 | N04 | N04 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778873972283.json | 3 | N03 | N03 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778880645983.json | 1 | N03 | N03 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778880645983.json | 2 | N06 | N03 | high | diverged_from_expected_root |
| fixtures\capa2-calibration-report-1778880645983.json | 3 | N04 | N03 | high | diverged_from_expected_root |
| fixtures\capa2-calibration-report-1778880645983.json | 4 | N10 | N03 | high | diverged_from_expected_root |
| fixtures\capa2-calibration-report-1778880645983.json | 5 | AMBIGUO | N03 | high | ambiguous_or_not_applicable |

## Diagnostico agregado

- Sesiones totales: 8
- Sesiones con hipotesis esperada: 7
- Aciertos conocidos: 4
- Precision observada: 0.571
- Nodo dominante: N03 (0.75)
- Divergencias con confianza alta: 3

## Observaciones por sesion

### fixtures\capa2-calibration-report-1778873972283.json / rol 1

Root: N06 | Confidence: high | Status: matched_expected_root

Ranking:
- N06: 42
- N10: 31.2
- N03: 20.1

Senales estructurales clave:
- explicit_n04_breach / unknown / count 3
- temporal_dependency_break / unknown / count 3
- workaround_as_coordination_architecture / unknown / count 3
- workaround_as_symptom / unknown / count 3

Bundle dominante: N06 / Recepción de Orden con Fecha Imposible / net 14
Evidencia que sostiene:
- structural_signal.temporal_dependency_break: 3 - La escena deriva una ruptura temporal/OLC previa al workaround.
- blocking_impact: 2 - Condicion de espera, bloqueo o cuello de botella.
- deadlock_risk: 2 - Riesgo, falla o excepcion activa.
- dependency_previous: 1 - Dependencia explicita en la escena.
- dependency_next: 1 - Dependencia explicita en la escena.
Evidencia que debilita:
- deadlock_resolution: 0.7 - Hay senal parcial de salida, alternativa o visibilidad.
- alternative_paths: 0.7 - Hay senal parcial de salida, alternativa o visibilidad.

### fixtures\capa2-calibration-report-1778873972283.json / rol 2

Root: N04 | Confidence: high | Status: matched_expected_root

Ranking:
- N04: 45.6
- N10: 31.2
- N06: 30
- N03: 26.1

Senales estructurales clave:
- explicit_n04_breach / unknown / count 3
- workaround_as_coordination_architecture / unknown / count 3
- workaround_as_symptom / unknown / count 3

Bundle dominante: N04 / Inspección Final que Detecta Defectos / net 15.2
Evidencia que sostiene:
- structural_signal.explicit_n04_breach: 5 - causal_breach_explicit: existe bundle estructural compuesto para N04.
- informacion_faltante: 2 - La escena declara informacion faltante dentro de una violacion causal explicita.
- delivery_failure_exists: 2 - Hay falla sin feedback claro en una escena con breach causal explicito.
- regla_informal_conocida: 1.5 - La escena declara regla informal conocida dentro de una violacion causal explicita.
- hidden_subprocess: 1.5 - La escena declara subproceso oculto asociado a ruptura causal fuerte.
Evidencia que debilita:
- validation_rule: 0.5 - Existe alguna regla o feedback que reduce la opacidad.

Ablaciones con cambio de raiz:
- informal_hidden: removal=N10, half=N04

### fixtures\capa2-calibration-report-1778873972283.json / rol 3

Root: N03 | Confidence: high | Status: matched_expected_root

Ranking:
- N03: 44.1
- N06: 33
- N10: 28.2
- N04: 1.57

Senales estructurales clave:
- explicit_n04_breach / unknown / count 3
- system_parallel_as_primary_truth / unknown / count 3
- workaround_as_coordination_architecture / unknown / count 3

Bundle dominante: N03 / Recepción de Orden de Trabajo Incompleta / net 14.7
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround o arreglo alterno.
- sacrificio_humano: 2 - La escena declara sacrificio humano para sostener el flujo.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- structural_signal.system_parallel_as_primary_truth: 2 - La escena deriva sistema paralelo o multiple verdad operativa como fuente primaria de coordinacion.
- workaround_types: 1 - Tipo de workaround declarado despues de confirmar que existe arreglo alterno.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N06
- alternative_deviation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778880645983.json / rol 1

Root: N03 | Confidence: high | Status: matched_expected_root

Ranking:
- N03: 100.2
- N06: 60
- N10: 56.4
- N04: 5.85

Senales estructurales clave:
- explicit_n04_breach / unknown / count 6
- system_parallel_as_primary_truth / unknown / count 6
- workaround_as_coordination_architecture / unknown / count 6

Bundle dominante: N03 / Recepción y Validación de Órdenes de Trabajo / net 16.7
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround o arreglo alterno.
- sacrificio_humano: 2 - La escena declara sacrificio humano para sostener el flujo.
- absorcion_variedad_residual: 2 - Aparece absorcion de variedad residual fuera del procedimiento.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- structural_signal.system_parallel_as_primary_truth: 2 - La escena deriva sistema paralelo o multiple verdad operativa como fuente primaria de coordinacion.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778880645983.json / rol 2

Root: N03 | Confidence: high | Status: diverged_from_expected_root

Ranking:
- N03: 76.2
- N06: 65
- N10: 62.4
- N04: 2.7

Senales estructurales clave:
- explicit_n04_breach / unknown / count 6
- workaround_as_coordination_architecture / unknown / count 6
- temporal_dependency_break / unknown / count 1

Bundle dominante: N06 / Planificación en Reversa (Desde la Fecha de Entrega Hacia Atrás) / net 14
Evidencia que sostiene:
- structural_signal.temporal_dependency_break: 3 - La escena deriva una ruptura temporal/OLC previa al workaround.
- blocking_impact: 2 - Condicion de espera, bloqueo o cuello de botella.
- deadlock_risk: 2 - Riesgo, falla o excepcion activa.
- dependency_previous: 1 - Dependencia explicita en la escena.
- dependency_next: 1 - Dependencia explicita en la escena.
Evidencia que debilita:
- deadlock_resolution: 0.7 - Hay senal parcial de salida, alternativa o visibilidad.
- alternative_paths: 0.7 - Hay senal parcial de salida, alternativa o visibilidad.

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N06
- alternative_deviation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778880645983.json / rol 3

Root: N03 | Confidence: high | Status: diverged_from_expected_root

Ranking:
- N03: 88.2
- N06: 54
- N04: 21.58
- N10: 20.4

Senales estructurales clave:
- explicit_n04_breach / unknown / count 6
- workaround_as_coordination_architecture / unknown / count 6

Bundle dominante: N04 / Presión para Liberar Producto Defectuoso / net 16.7
Evidencia que sostiene:
- structural_signal.explicit_n04_breach: 5 - causal_breach_explicit: existe bundle estructural compuesto para N04.
- informacion_faltante: 2 - La escena declara informacion faltante dentro de una violacion causal explicita.
- delivery_failure_exists: 2 - Hay falla sin feedback claro en una escena con breach causal explicito.
- regla_informal: 1.5 - Aparece regla informal asociada a una violacion causal explicita.
- regla_informal_conocida: 1.5 - La escena declara regla informal conocida dentro de una violacion causal explicita.
Evidencia que debilita:
- validation_rule: 0.5 - Existe alguna regla o feedback que reduce la opacidad.

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778880645983.json / rol 4

Root: N03 | Confidence: high | Status: diverged_from_expected_root

Ranking:
- N03: 71.4
- N10: 62.4
- N06: 36

Senales estructurales clave:
- workaround_as_coordination_architecture / unknown / count 6

Bundle dominante: N03 / Definición de Metas Anuales Ambiciosas / net 11.9
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround o arreglo alterno.
- sacrificio_humano: 2 - La escena declara sacrificio humano para sostener el flujo.
- absorcion_variedad_residual: 2 - Aparece absorcion de variedad residual fuera del procedimiento.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- workaround_types: 1 - Tipo de workaround declarado despues de confirmar que existe arreglo alterno.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N10, half=N10

### fixtures\capa2-calibration-report-1778880645983.json / rol 5

Root: N03 | Confidence: high | Status: ambiguous_or_not_applicable

Ranking:
- N03: 88.2
- N10: 62.4
- N06: 60
- N04: 5.85

Senales estructurales clave:
- explicit_n04_breach / unknown / count 6
- workaround_as_coordination_architecture / unknown / count 6

Bundle dominante: N03 / Recepción de Órdenes de Compra Urgentes / net 14.7
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround o arreglo alterno.
- sacrificio_humano: 2 - La escena declara sacrificio humano para sostener el flujo.
- absorcion_variedad_residual: 2 - Aparece absorcion de variedad residual fuera del procedimiento.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- workaround_types: 1 - Tipo de workaround declarado despues de confirmar que existe arreglo alterno.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N10
