# Capa 2 MVP - Taxonomia de senales estructurales

Fecha: 2026-05-15

## Proposito

Esta micro-ronda consolida el cambio metodologico de:

```text
palabra suelta -> nodo
```

a:

```text
evidencia textual/canonica -> senal estructural intermedia -> bundle causal -> nodo
```

La meta es evitar que futuras calibraciones mezclen breach causal fuerte, ruptura temporal, arquitectura informal estable y compensacion/sintoma.

## Taxonomia adoptada

| Familia | Rol causal | Senales |
|---|---|---|
| `strong_breach` | ruptura causal fuerte del objeto, estado o validacion | `object_nonconformity`, `improper_release_or_acceptance`, `material_coverup`, `validation_state_conflict`, `explicit_n04_breach` |
| `temporal_olc_break` | ruptura temporal/OLC puntual | `temporal_dependency_break` |
| `stable_informal_architecture` | sustitucion estructural del sistema formal | `workaround_as_coordination_architecture`, `system_parallel_as_primary_truth`, `formal_system_insufficient_absorption` |
| `symptom_compensation` | consecuencia, amortiguador o compensacion | `workaround_as_symptom` |

## Metadatos por senal

Cada evidencia `structural_signal.*` ahora incluye:

- `signal_family`
- `causal_role`
- `root_candidate_strength`
- `can_act_as_symptom`
- `description`

Esto queda dentro de `CausalEvidenceItem.value`, de modo que los bundles mantienen trazabilidad entre evidencia, senal estructural y nodo.

## Impacto por nodo

### N04 Violacion Causal

Lee principalmente:

- `explicit_n04_breach`

Esta senal depende de:

- `object_nonconformity` + `improper_release_or_acceptance`
- o `material_coverup`
- o `validation_state_conflict`

Esto evita que N04 gane por opacidad generica.

### N06 Tortura Causal

Lee principalmente:

- `temporal_dependency_break`

Esta senal queda protegida contra arquitectura informal estable:

```text
temporal_dependency_break =
  temporalDependencyBreakCandidate
  AND (NOT stableInformalArchitecture OR workaroundAsSymptom)
```

Decision de frontera N03/N06 aplicada en esta micro-ronda:

- `lead time`, dependencia generica, secuencia desviada o coordinacion fuera del flujo oficial no bastan por si solas para activar fuerte `temporal_dependency_break`.
- N06 requiere evidencia mas dura de ruptura temporal/OLC puntual: fecha u orden imposible, trabajo en reversa, actividad exigida sin prerequisito disponible, inicio sin materiales, cuello/bloqueo real o dependencia temporal declarada.
- Si el expediente contiene `workaround_as_coordination_architecture`, `system_parallel_as_primary_truth` o `formal_system_insufficient_absorption`, la ruptura temporal se degrada salvo que el workaround aparezca explicitamente como sintoma/reaccion de una ruptura temporal puntual.

### N03 Anarquia Operacional

Lee principalmente:

- `workaround_as_coordination_architecture`
- `system_parallel_as_primary_truth`
- `formal_system_insufficient_absorption`

Esto fortalece N03 cuando el expediente muestra coordinacion informal como sistema normal, no reaccion puntual.

### N10 Promesa Imposible

No se modifico en esta ronda. Sigue leyendo brecha de capacidad, resource bargain, constreñimientos y variedad residual.

## Prueba de mutacion minima

Se agrego:

- `scripts/mutate-capa2-boundary.mjs`

Uso:

```powershell
node scripts\mutate-capa2-boundary.mjs fixtures\capa2-calibration-report-1778867980256.json
```

El script toma el Caso 3 y genera cuatro variaciones:

1. `reinforce_n03_stable_architecture`
2. `reinforce_n06_temporal_break`
3. `remove_stable_architecture`
4. `remove_temporal_break`

Salida generada en la primera corrida:

- `fixtures/capa2-boundary-mutation-report-1778870488408.json`
- `fixtures/capa2-boundary-mutation-report-1778870488408.md`

## Resultados preliminares de mutacion

Importante: el reporte fuente `1778867980256` no contenia bundles completos, solo `topEvidenceBundles`. Por eso esta primera prueba es preliminar. El script `scripts/calibrate-capa2-mvp.mjs` ya fue ajustado para guardar `evidenceBundles` completos en futuras corridas.

| Variante | Root producido | Lectura |
|---|---|---|
| `reinforce_n03_stable_architecture` | `N03` | Cuando se refuerza arquitectura informal estable, N03 gana. Tiene sentido metodologico. |
| `reinforce_n06_temporal_break` | `N06` | Cuando se refuerza ruptura temporal puntual, N06 gana. Tiene sentido metodologico. |
| `remove_stable_architecture` | `N10` | Al quitar arquitectura informal, N03 baja; aparece N10 por brecha/capacidad residual del fixture. Requiere revisar con bundles completos. |
| `remove_temporal_break` | `N10` | Al quitar ruptura temporal, N06 baja; N03 queda cerca pero no supera a N10 por carga de capacidad del fixture. Requiere revisar con bundles completos. |

## Estado

La frontera N03/N06 ya se comporta mejor bajo mutaciones dirigidas:

- N03 sube cuando se refuerza arquitectura informal estable.
- N06 sube cuando se refuerza ruptura temporal puntual.

Pero todavia falta una corrida completa nueva con `evidenceBundles` persistidos en el reporte de calibracion para juzgar estabilidad final sin truncamiento de bundles.
