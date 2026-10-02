# Capa 2 MVP Calibration Report

Source: fixtures\manufactura-assisted-multisession-result-1778826187547.json
Generated at: 2026-05-15T06:23:16.772Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 Planificador de Producción | N10 Promesa Imposible (La Falsa Discrecion) | medium | false | true |
| 2 Jefe de Calidad | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 3 Supervisor de Línea de Producción | N03 Anarquia Operacional (El Heroe) | medium | false | true |

## Expected Vs Actual

| role | expected | actual | status |
| --- | --- | --- | --- |
| 1 Planificador de Producción | N06 Tortura Causal | N10 Promesa Imposible (La Falsa Discrecion) | diverged_from_expected_root |
| 2 Jefe de Calidad | N04 Violacion Causal | N03 Anarquia Operacional (El Heroe) | diverged_from_expected_root |
| 3 Supervisor de Línea de Producción | N03 Anarquia Operacional | N03 Anarquia Operacional (El Heroe) | matched_expected_root |

## Ablation Root Changes

- Role 1: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; alternative_deviation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; capacity_bargain: removal=N06 Tortura Causal, half=N06 Tortura Causal
- Role 2: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible; alternative_deviation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible
- Role 3: workaround_compensation: removal=N06 Tortura Causal, half=N06 Tortura Causal; alternative_deviation: removal=N06 Tortura Causal, half=N06 Tortura Causal

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true