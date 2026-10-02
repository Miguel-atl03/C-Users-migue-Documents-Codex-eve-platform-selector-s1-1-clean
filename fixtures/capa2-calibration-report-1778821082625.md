# Capa 2 MVP Calibration Report

Source: C:\Users\migue\Documents\Codex\2026-05-06\files-mentioned-by-the-user-especificaci\eve-platform\fixtures\manufactura-assisted-multisession-result-1778807372647.json
Generated at: 2026-05-15T04:58:02.624Z

## Session Roots

| role | root | confidence | needs reentry | needs expert review |
| --- | --- | --- | --- | --- |
| 1 SUPERVISOR DE LÍNEA | N5 Anarquia Operacional (El Heroe) | medium | false | true |
| 2 PLANIFICADOR DE PRODUCCIÓN | N5 Anarquia Operacional (El Heroe) | high | false | true |
| 3 JEFE DE PRODUCCIÓN | N5 Anarquia Operacional (El Heroe) | medium | false | true |
| 4 JEFE DE CALIDAD | N5 Anarquia Operacional (El Heroe) | medium | false | true |
| 5 INGENIERO DE PROCESOS | N5 Anarquia Operacional (El Heroe) | medium | false | true |
| 6 OWNER / DIRECTOR GENERAL | N5 Anarquia Operacional (El Heroe) | medium | false | true |
| 7 ROL 7: CANAL ALGEDÓNICO - REPRESENTANTE DE OPERARIOS | N5 Anarquia Operacional (El Heroe) | medium | false | true |

## Ablation Root Changes

- Role 1: workaround_compensation: removal=N2 Tortura Causal, half=N3 Promesa Imposible; alternative_deviation: removal=N2 Tortura Causal, half=N3 Promesa Imposible
- Role 2: workaround_compensation: removal=N2 Tortura Causal, half=N3 Promesa Imposible; alternative_deviation: removal=N2 Tortura Causal, half=N3 Promesa Imposible
- Role 3: workaround_compensation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible; alternative_deviation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible
- Role 4: workaround_compensation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible; alternative_deviation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible
- Role 5: workaround_compensation: removal=N2 Tortura Causal, half=N3 Promesa Imposible; alternative_deviation: removal=N2 Tortura Causal, half=N3 Promesa Imposible
- Role 6: workaround_compensation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible; alternative_deviation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible
- Role 7: workaround_compensation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible; alternative_deviation: removal=N3 Promesa Imposible, half=N3 Promesa Imposible

## Discrimination Scenarios

- clear_n5_workaround_only: expected N5, actual N5, passed=true
- clear_n3_capacity_gap: expected N3, actual N3, passed=true
- clear_n2_temporal_dependency: expected N2, actual N2, passed=true
- clear_n4_hidden_information: expected N4, actual N4, passed=true