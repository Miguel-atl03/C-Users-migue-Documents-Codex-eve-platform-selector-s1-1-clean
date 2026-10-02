# Capa 2 MVP Calibration Report

Source: fixtures\manufactura-assisted-multisession-result-1778824464994.json
Generated at: 2026-05-15T22:08:36.694Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 Caso 1 | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 2 Caso 2 | N06 Tortura Causal (El Doble Vinculo) | medium | false | true |
| 3 Caso 3 | N04 Violacion Causal (El Politico) | low | false | true |
| 4 Caso 4 | N10 Promesa Imposible (La Falsa Discrecion) | high | false | true |
| 5 Caso 5 | N10 Promesa Imposible (La Falsa Discrecion) | medium | false | true |

## Expected Vs Actual

| role | expected | actual | status |
| --- | --- | --- | --- |
| 1 Caso 1 | N03 Anarquia Operacional | N03 Anarquia Operacional (El Heroe) | matched_expected_root |
| 2 Caso 2 | N06 Tortura Causal | N06 Tortura Causal (El Doble Vinculo) | matched_expected_root |
| 3 Caso 3 | N04 Violacion Causal | N04 Violacion Causal (El Politico) | diverged_from_expected_root |
| 4 Caso 4 | N10 Promesa Imposible | N10 Promesa Imposible (La Falsa Discrecion) | matched_expected_root |
| 5 Caso 5 | AMBIGUO | N10 Promesa Imposible (La Falsa Discrecion) | ambiguous_or_not_applicable |

## Ablation Root Changes

- Role 1: workaround_compensation: removal=N06 Tortura Causal, half=N03 Anarquia Operacional
- Role 2: no root changes under tested ablations
- Role 3: no root changes under tested ablations
- Role 4: capacity_bargain: removal=N06 Tortura Causal, half=N10 Promesa Imposible
- Role 5: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; alternative_deviation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; capacity_bargain: removal=N06 Tortura Causal, half=N06 Tortura Causal

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true