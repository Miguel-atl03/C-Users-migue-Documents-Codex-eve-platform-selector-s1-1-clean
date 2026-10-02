# Capa 2 MVP Calibration Report

Source: C:\Users\migue\Documents\Codex\2026-05-06\files-mentioned-by-the-user-especificaci\eve-platform\fixtures\manufactura-assisted-multisession-result-1778807372647.json
Generated at: 2026-05-15T05:33:14.866Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 SUPERVISOR DE LÍNEA | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 2 PLANIFICADOR DE PRODUCCIÓN | N03 Anarquia Operacional (El Heroe) | high | false | true |
| 3 JEFE DE PRODUCCIÓN | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 4 JEFE DE CALIDAD | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 5 INGENIERO DE PROCESOS | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 6 OWNER / DIRECTOR GENERAL | N03 Anarquia Operacional (El Heroe) | medium | false | true |
| 7 ROL 7: CANAL ALGEDÓNICO - REPRESENTANTE DE OPERARIOS | N03 Anarquia Operacional (El Heroe) | medium | false | true |

## Ablation Root Changes

- Role 1: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; alternative_deviation: removal=N06 Tortura Causal, half=N10 Promesa Imposible
- Role 2: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; alternative_deviation: removal=N06 Tortura Causal, half=N10 Promesa Imposible
- Role 3: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible; alternative_deviation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible
- Role 4: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible; alternative_deviation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible
- Role 5: workaround_compensation: removal=N06 Tortura Causal, half=N10 Promesa Imposible; alternative_deviation: removal=N06 Tortura Causal, half=N10 Promesa Imposible
- Role 6: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible; alternative_deviation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible
- Role 7: workaround_compensation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible; alternative_deviation: removal=N10 Promesa Imposible, half=N10 Promesa Imposible

## Discrimination Scenarios

- clear_n03_workaround_only: expected N03, actual N03, passed=true
- clear_n10_capacity_gap: expected N10, actual N10, passed=true
- clear_n06_temporal_dependency: expected N06, actual N06, passed=true
- clear_n04_hidden_information: expected N04, actual N04, passed=true