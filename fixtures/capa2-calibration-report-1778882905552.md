# Capa 2 MVP Calibration Report

Source: fixtures\manufactura-assisted-multisession-result-1778826187547.json
Generated at: 2026-05-15T22:08:25.551Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 Planificador de Producción | N06 Tortura Causal (El Doble Vinculo) | high | false | true |
| 2 Jefe de Calidad | N04 Violacion Causal (El Politico) | high | false | true |
| 3 Supervisor de Línea de Producción | N03 Anarquia Operacional (El Heroe) | high | false | true |

## Expected Vs Actual

| role | expected | actual | status |
| --- | --- | --- | --- |
| 1 Planificador de Producción | N06 Tortura Causal | N06 Tortura Causal (El Doble Vinculo) | matched_expected_root |
| 2 Jefe de Calidad | N04 Violacion Causal | N04 Violacion Causal (El Politico) | matched_expected_root |
| 3 Supervisor de Línea de Producción | N03 Anarquia Operacional | N03 Anarquia Operacional (El Heroe) | matched_expected_root |

## Ablation Root Changes

- Role 1: no root changes under tested ablations
- Role 2: informal_hidden: removal=N10 Promesa Imposible, half=N04 Violacion Causal
- Role 3: workaround_compensation: removal=N06 Tortura Causal, half=N06 Tortura Causal; alternative_deviation: removal=N06 Tortura Causal, half=N03 Anarquia Operacional

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true