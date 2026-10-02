# Capa 2 MVP - Validacion ampliada por sesion

Generated at: 2026-05-15T22:08:58.436Z

## Gate formal de salida

Resultado: PASO

Capa 2 por sesion puede pasar a preparacion de Capa 2.5 con monitoreo.

| Check | Resultado | Valor |
|---|---|---|
| known_case_accuracy_at_least_75_percent | pass | 0.857 |
| mutation_boundary_checks_pass | pass | [{"id":"baseline_case3_is_n03","passed":true,"detail":"N03"},{"id":"reinforce_n03_stays_n03","passed":true,"detail":"N03"},{"id":"reinforce_n06_switches_n06","passed":true,"detail":"N06"},{"id":"remove_temporal_break_stays_n03","passed":true,"detail":"N03"}] |
| no_single_root_above_60_percent_in_expanded_validation | pass | {"dominantRoot":"N06","share":0.375} |
| no_high_confidence_known_divergences | pass | [] |
| expert_review_visible_for_nonfinal_outputs | pass | 0 |

## Sesiones evaluadas

| fuente | rol | esperado | producido | confianza | estado |
|---|---:|---|---|---|---|
| fixtures\capa2-calibration-report-1778882905552.json | 1 | N06 | N06 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778882905552.json | 2 | N04 | N04 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778882905552.json | 3 | N03 | N03 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778882916695.json | 1 | N03 | N03 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778882916695.json | 2 | N06 | N06 | medium | matched_expected_root |
| fixtures\capa2-calibration-report-1778882916695.json | 3 | N04 | N06 | low | diverged_from_expected_root |
| fixtures\capa2-calibration-report-1778882916695.json | 4 | N10 | N10 | high | matched_expected_root |
| fixtures\capa2-calibration-report-1778882916695.json | 5 | AMBIGUO | N10 | medium | ambiguous_or_not_applicable |

## Diagnostico agregado

- Sesiones totales: 8
- Sesiones con hipotesis esperada: 7
- Aciertos conocidos: 6
- Precision observada: 0.857
- Nodo dominante: N06 (0.375)
- Divergencias con confianza alta: 0

## Observaciones por sesion

### fixtures\capa2-calibration-report-1778882905552.json / rol 1

Root: N06 | Confidence: high | Status: matched_expected_root

Ranking:
- N06: 42
- N10: 31.2

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 3
- informal_operation / symptom_compensation / count 3
- temporal_dependency_break / temporal_olc_break / count 3
- workaround_as_symptom / symptom_compensation / count 3

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

### fixtures\capa2-calibration-report-1778882905552.json / rol 2

Root: N04 | Confidence: high | Status: matched_expected_root

Ranking:
- N04: 45.6
- N10: 31.2
- N06: 30

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 3
- informal_operation / symptom_compensation / count 3
- workaround_as_symptom / symptom_compensation / count 3

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

### fixtures\capa2-calibration-report-1778882905552.json / rol 3

Root: N03 | Confidence: high | Status: matched_expected_root

Ranking:
- N03: 44.1
- N06: 33
- N10: 28.2
- N04: 1.57

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 3
- system_parallel_as_primary_truth / stable_informal_architecture / count 3
- workaround_as_coordination_architecture / stable_informal_architecture / count 3

Bundle dominante: N03 / Recepción de Orden de Trabajo Incompleta / net 14.7
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround dentro de una arquitectura informal estable.
- sacrificio_humano: 2 - La escena declara sacrificio humano dentro de una arquitectura informal que sostiene el flujo.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- structural_signal.system_parallel_as_primary_truth: 2 - La escena deriva sistema paralelo o multiple verdad operativa como fuente primaria de coordinacion.
- workaround_types: 1 - Tipo de workaround declarado dentro de una arquitectura informal estable.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N06
- alternative_deviation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778882916695.json / rol 1

Root: N03 | Confidence: high | Status: matched_expected_root

Ranking:
- N03: 100.2
- N06: 60
- N10: 56.4
- N04: 5.85

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 6
- system_parallel_as_primary_truth / stable_informal_architecture / count 6
- workaround_as_coordination_architecture / stable_informal_architecture / count 6

Bundle dominante: N03 / Recepción y Validación de Órdenes de Trabajo / net 16.7
Evidencia que sostiene:
- workaround_used: 2.5 - La escena declara workaround dentro de una arquitectura informal estable.
- sacrificio_humano: 2 - La escena declara sacrificio humano dentro de una arquitectura informal que sostiene el flujo.
- absorcion_variedad_residual: 2 - Aparece absorcion de variedad residual como parte de una arquitectura informal estable.
- structural_signal.workaround_as_coordination_architecture: 2 - El expediente presenta el workaround como arquitectura normal de operacion y no como reaccion temporal.
- structural_signal.system_parallel_as_primary_truth: 2 - La escena deriva sistema paralelo o multiple verdad operativa como fuente primaria de coordinacion.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N03

### fixtures\capa2-calibration-report-1778882916695.json / rol 2

Root: N06 | Confidence: medium | Status: matched_expected_root

Ranking:
- N06: 65
- N10: 62.4
- N03: 10.2
- N04: 2.7

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 6
- informal_operation / symptom_compensation / count 6
- temporal_dependency_break / temporal_olc_break / count 1

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

### fixtures\capa2-calibration-report-1778882916695.json / rol 3

Root: N06 | Confidence: low | Status: diverged_from_expected_root

Ranking:
- N06: 54
- N04: 21.58
- N10: 20.4
- N03: 15

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 6
- informal_operation / symptom_compensation / count 6

Bundle dominante: N04 / Presión para Liberar Producto Defectuoso / net 16.7
Evidencia que sostiene:
- structural_signal.explicit_n04_breach: 5 - causal_breach_explicit: existe bundle estructural compuesto para N04.
- informacion_faltante: 2 - La escena declara informacion faltante dentro de una violacion causal explicita.
- delivery_failure_exists: 2 - Hay falla sin feedback claro en una escena con breach causal explicito.
- regla_informal: 1.5 - Aparece regla informal asociada a una violacion causal explicita.
- regla_informal_conocida: 1.5 - La escena declara regla informal conocida dentro de una violacion causal explicita.
Evidencia que debilita:
- validation_rule: 0.5 - Existe alguna regla o feedback que reduce la opacidad.

### fixtures\capa2-calibration-report-1778882916695.json / rol 4

Root: N10 | Confidence: high | Status: matched_expected_root

Ranking:
- N10: 62.4
- N06: 36
- N03: 8.4

Senales estructurales clave:
- informal_operation / symptom_compensation / count 6

Bundle dominante: N10 / Definición de Metas Anuales Ambiciosas / net 10.4
Evidencia que sostiene:
- brecha_capacidad_5_3: 3 - Brecha positiva entre capacidad nominal y real.
- capacidad_real_5_2: 2 - La capacidad real queda por debajo de la nominal.
- resource_bargain_5_14: 2 - Senal de promesa, capacidad o discrecion tensionada.
- constreñimientos_5_10: 1 - Senal de promesa, capacidad o discrecion tensionada.
- variedad_residual_5_12: 1 - Senal de promesa, capacidad o discrecion tensionada.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- capacity_bargain: removal=N06, half=N10

### fixtures\capa2-calibration-report-1778882916695.json / rol 5

Root: N10 | Confidence: medium | Status: ambiguous_or_not_applicable

Ranking:
- N10: 62.4
- N06: 60
- N03: 15
- N04: 5.85

Senales estructurales clave:
- explicit_n04_breach / strong_breach / count 6
- informal_operation / symptom_compensation / count 6

Bundle dominante: N10 / Recepción de Órdenes de Compra Urgentes / net 10.4
Evidencia que sostiene:
- brecha_capacidad_5_3: 3 - Brecha positiva entre capacidad nominal y real.
- capacidad_real_5_2: 2 - La capacidad real queda por debajo de la nominal.
- resource_bargain_5_14: 2 - Senal de promesa, capacidad o discrecion tensionada.
- constreñimientos_5_10: 1 - Senal de promesa, capacidad o discrecion tensionada.
- variedad_residual_5_12: 1 - Senal de promesa, capacidad o discrecion tensionada.
Evidencia que debilita:

Ablaciones con cambio de raiz:
- workaround_compensation: removal=N06, half=N10
- alternative_deviation: removal=N06, half=N10
- capacity_bargain: removal=N06, half=N06
