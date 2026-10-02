# Capa 2 MVP Calibration Report

Source: fixtures\manufactura-assisted-multisession-result-1778826187547.json
Generated at: 2026-05-15T17:35:29.683Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 Planificador de Producción | N04 Violacion Causal (El Politico) | medium | false | true |
| 2 Jefe de Calidad | N04 Violacion Causal (El Politico) | high | false | true |
| 3 Supervisor de Línea de Producción | N04 Violacion Causal (El Politico) | medium | false | true |

## Expected Vs Actual

| role | expected | actual | status |
| --- | --- | --- | --- |
| 1 Planificador de Producción | N06 Tortura Causal | N04 Violacion Causal (El Politico) | diverged_from_expected_root |
| 2 Jefe de Calidad | N04 Violacion Causal | N04 Violacion Causal (El Politico) | matched_expected_root |
| 3 Supervisor de Línea de Producción | N03 Anarquia Operacional | N04 Violacion Causal (El Politico) | diverged_from_expected_root |

## Ablation Root Changes

- Role 1: alternative_deviation: removal=N06 Tortura Causal, half=N06 Tortura Causal; informal_hidden: removal=N03 Anarquia Operacional, half=N06 Tortura Causal; consistency_flags: removal=N06 Tortura Causal, half=N06 Tortura Causal
- Role 2: informal_hidden: removal=N03 Anarquia Operacional, half=N03 Anarquia Operacional
- Role 3: informal_hidden: removal=N03 Anarquia Operacional, half=N03 Anarquia Operacional

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true