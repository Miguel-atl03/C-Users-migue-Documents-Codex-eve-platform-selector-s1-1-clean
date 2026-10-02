# Capa 2 MVP Calibration Report

Source: fixtures\manufactura-assisted-multisession-result-1778824464994.json
Generated at: 2026-05-15T21:30:45.981Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 Caso 1 | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 2 Caso 2 | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 3 Caso 3 | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 4 Caso 4 | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 5 Caso 5 | N03 Anarquia Operacional (El Heroe) | high | false | true |

## Expected Vs Actual

| role | expected | actual | status |
| --- | --- | --- | --- |
| 1 Caso 1 | N03 Anarquia Operacional | N03 Anarquia Operacional (El Heroe) | matched_expected_root |
| 2 Caso 2 | N06 Tortura Causal | N03 Anarquia Operacional (El Heroe) | diverged_from_expected_root |
| 3 Caso 3 | N04 Violacion Causal | N03 Anarquia Operacional (El Heroe) | diverged_from_expected_root |
| 4 Caso 4 | N10 Promesa Imposible | N03 Anarquia Operacional (El Heroe) | diverged_from_expected_root |
| 5 Caso 5 | AMBIGUO | N03 Anarquia Operacional (El Heroe) | ambiguous_or_not_applicable |

## Ablation Root Changes

- Role 1: workaround_compensation: removal=N06 Tortura Causal, half=N03 Anarquia Operacional
- Role 2: workaround_compensation: removal=N06 Tortura Causal, half=N06 Tortura Causal; alternative_deviation: removal=N06 Tortura Causal, half=N03 Anarquia Operacional
- Role 3: workaround_compensation: removal=N06 Tortura Causal, half=N03 Anarquia Operacional
- Role 4: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible
- Role 5: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true