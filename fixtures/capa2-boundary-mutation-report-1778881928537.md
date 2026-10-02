# Capa 2 MVP - Minimal Mutation Boundary Test

Source report: `fixtures\capa2-calibration-report-1778881870746.json`
Generated at: 2026-05-15T21:52:08.537Z

## Baseline Caso 3

Root: N03 Anarquia Operacional

| Nodo | Score |
|---|---:|
| N03 Anarquia Operacional | 44.1 |
| N06 Tortura Causal | 33 |
| N10 Promesa Imposible | 28.2 |
| N04 Violacion Causal | 1.57 |

## Mutations

### reinforce_n03_stable_architecture

Expected behavior: N03 should increase when system-parallel/stable informal architecture is reinforced.
Root: N03 Anarquia Operacional
Methodological sense: Debe fortalecer anarquia operacional si el workaround es arquitectura normal, no reaccion puntual.

| Nodo | Score |
|---|---:|
| N03 Anarquia Operacional | 54.6 |
| N06 Tortura Causal | 33 |
| N10 Promesa Imposible | 28.2 |
| N04 Violacion Causal | 1.57 |

Structural signals:
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / formal_system_insufficient_absorption / stable_informal_architecture / weight 1.5
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / formal_system_insufficient_absorption / stable_informal_architecture / weight 1.5
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2

### reinforce_n06_temporal_break

Expected behavior: N06 should increase when a punctual temporal/OLC rupture is added.
Root: N06 Tortura Causal
Methodological sense: Debe fortalecer tortura causal si aparece ruptura temporal especifica y no mera informalidad cronica.

| Nodo | Score |
|---|---:|
| N06 Tortura Causal | 48 |
| N03 Anarquia Operacional | 32.1 |
| N10 Promesa Imposible | 28.2 |
| N04 Violacion Causal | 1.57 |

Structural signals:
- N06 / temporal_dependency_break / temporal_olc_break / weight 3
- N06 / workaround_as_symptom / symptom_compensation / weight 2
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / workaround_as_symptom / symptom_compensation / weight 4
- N06 / temporal_dependency_break / temporal_olc_break / weight 3
- N06 / workaround_as_symptom / symptom_compensation / weight 2
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N03 / workaround_as_symptom / symptom_compensation / weight 4

### remove_stable_architecture

Expected behavior: N06 should rise if stable informal architecture evidence is removed.
Root: N06 Tortura Causal
Methodological sense: Debe bajar N03 si se quita la sustitucion estable del sistema formal.

| Nodo | Score |
|---|---:|
| N06 Tortura Causal | 33 |
| N03 Anarquia Operacional | 32.1 |
| N10 Promesa Imposible | 28.2 |
| N04 Violacion Causal | 1.57 |

Structural signals:
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N04 / explicit_n04_breach / strong_breach / weight 2.5

### remove_temporal_break

Expected behavior: N03 should rise if punctual temporal/OLC rupture is removed.
Root: N03 Anarquia Operacional
Methodological sense: Debe bajar N06 si desaparece la ruptura temporal puntual y queda arquitectura informal.

| Nodo | Score |
|---|---:|
| N03 Anarquia Operacional | 44.1 |
| N06 Tortura Causal | 30 |
| N10 Promesa Imposible | 28.2 |
| N04 Violacion Causal | 1.57 |

Structural signals:
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
- N04 / explicit_n04_breach / strong_breach / weight 2.5
- N03 / workaround_as_coordination_architecture / stable_informal_architecture / weight 2
- N03 / system_parallel_as_primary_truth / stable_informal_architecture / weight 2
