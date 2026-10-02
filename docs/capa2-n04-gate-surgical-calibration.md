# Capa 2 MVP - Micro-ronda N04 gate semantico

Fecha: 2026-05-15

## Objetivo

Corregir la sobreactivacion de `N04 Violacion Causal` cuando la escena muestra opacidad, informalidad o subproceso oculto, pero no evidencia dura de ruptura causal.

La frontera metodologica aplicada fue:

- `N04` fuerte: requiere `causal_breach_explicit`.
- Opacidad informal: puede apoyar debilmente, pero no debe construir por si sola una raiz `N04`.
- Si hay informalidad sin breach fuerte, se agrega debilitador `informality_without_strong_causal_breach`.

## Cambio implementado

Archivo tocado:

- `src/services/causal-transduction-engine.ts`

La regla `evaluateN4` ahora separa cuatro grupos semanticos:

1. `objectNonConformity`
   - `producto defectuoso`
   - `20% defectuoso`
   - `lote rechazado`
   - `objeto no conforme`
   - `viola la fisica del objeto`

2. `forcedRelease`
   - `despach`
   - `liberar producto`
   - `liberacion de producto`
   - `presion directa`
   - `presiona a calidad`
   - `aceptacion forzada`

3. `materialCoverup`
   - `encubrimiento material`
   - `ocultar defecto`
   - `oculta defecto`
   - `falsificacion`
   - `reporte simplificado`

4. `incompatibleValidation`
   - `validacion incompatible`
   - `estado real y estado declarado`
   - `aceptacion de algo que no deberia pasar`
   - `aceptar algo que no deberia pasar`
   - `transicion prohibida`

Con eso se calcula:

- `explicitCausalBreach`
- `strongCausalBreach`

## Gate nuevo

`N04` conserva soporte fuerte solo si hay:

- objeto no conforme + liberacion/presion indebida; o
- encubrimiento material; o
- validacion incompatible; o
- transicion prohibida.

Si no hay `strongCausalBreach`, las senales genericas se degradan:

- `informacion_faltante`
- `regla_informal`
- `regla_informal_conocida`
- `hidden_subprocess`
- `informacion_faltante_accion`
- `real_vs_official_sequence`
- `delivery_failure_exists`
- consistency flags
- light inference

Ademas, si aparece informalidad/opacidad sin breach fuerte, se agrega el debilitador:

`informality_without_strong_causal_breach`

## Resultado tecnico de validacion

Validacion ejecutada:

- `npm run lint -- --format stylish`

Resultado:

- exitoso.

## Estado de reprocesamiento de casos

No se pudo ejecutar una corrida completa contra Supabase desde este entorno porque la conexion saliente al dominio del proyecto fue bloqueada por sandbox:

- dominio: `https://bwflscplkjohdhkiqqoc.supabase.co`
- error: `EACCES` en conexion HTTPS.

Por esa razon, esta micro-ronda deja:

- cambio de motor implementado;
- validacion estatica limpia;
- criterio metodologico documentado;
- pendiente la corrida real de los 3 casos quirurgicos contra Supabase o contra una exportacion local de `scene_canonical_records` + `session_intermediate_output`.

## Ultimo baseline antes del ajuste

Reporte base:

- `fixtures/capa2-calibration-report-1778826642787.json`

Resultados previos:

| Caso | Esperado | Producido antes del gate | Estado |
|---|---|---|---|
| Caso 1 - Planificador de Produccion | `N06` | `N06` | correcto |
| Caso 2 - Jefe de Calidad | `N04` | `N04` | correcto |
| Caso 3 - Supervisor de Linea de Produccion | `N03` | `N04` | divergente |

Ranking previo del Caso 3:

| Nodo | Score |
|---|---:|
| `N04` | 42.6 |
| `N06` | 39 |
| `N03` | 38.1 |
| `N10` | 28.2 |

## Interpretacion esperada del ajuste

El ajuste no baja `N04` por molestia metodologica. Lo que hace es impedir que `N04` gane solo por:

- informacion incompleta;
- regla informal;
- subproceso oculto;
- falla sin feedback;
- secuencia real distinta de la oficial.

Esas senales ahora siguen vivas, pero como contexto de opacidad. Para convertirlas en `N04` raiz deben estar acompanadas por evidencia dura de violacion causal.

## Pendiente inmediato

Cuando haya acceso a Supabase o una exportacion local de:

- `session_intermediate_output`
- `scene_canonical_records`

se debe rerunear:

- Caso 1 esperado `N06`
- Caso 2 esperado `N04`
- Caso 3 esperado `N03`

Y revisar ablaciones:

- `informal_hidden`
- `workaround_compensation`
- `alternative_deviation`
- `consistency_flags`

## Micro-ronda adicional - gate compuesto estricto

Despues de la primera corrida real posterior al gate, `N04` siguio dominando:

| Caso | Esperado | Producido |
|---|---|---|
| Caso 1 | `N06` | `N04` |
| Caso 2 | `N04` | `N04` |
| Caso 3 | `N03` | `N04` |

La causa observada fue que `real_vs_official_sequence` seguia recibiendo peso fuerte por tokens demasiado amplios, en especial `despach`, `presion` y la lectura generica de fisica/objeto.

Se ajusto `evaluateN4` para que el soporte fuerte sea estrictamente compuesto:

```text
strongCausalBreach =
  objectNonConformity AND improperReleaseOrAcceptance
  OR materialCoverup
  OR incompatibleValidation
```

Cambios puntuales:

- `real_vs_official_sequence` ya no recibe peso 5 por si solo.
- Se removio `despach` como disparador generico de liberacion indebida.
- Se removio `presion` / `presion directa` como disparador generico.
- Se removio `viola la fisica del objeto` como disparador de objeto no conforme, porque en Caso 1 describia dependencia temporal rota, no producto defectuoso.
- Se agrego `improperReleaseOrAcceptance` como grupo separado.
- El boost fuerte `causal_breach_explicit` solo se agrega si hay combinacion dura.

Validacion estatica:

- `npm run lint -- --format stylish`: exitoso.

## Micro-ronda N03 / N06 - arquitectura informal vs ruptura temporal

Despues de introducir senales estructurales, el Caso 3 dejo de caer en `N04`, pero paso a caer en `N06`.

Diagnostico:

- `N06` ganaba por `structural_signal.temporal_dependency_break: 3` en las tres escenas.
- El Caso 3 tenia menciones reconstruidas de `lead time` y `dependencia no satisfecha`, pero tambien evidencia dominante de arquitectura informal estable: `Excel es la verdad`, ERP insuficiente, sistema paralelo y normalidad informal.

Cambio aplicado:

- `temporal_dependency_break` ya no se activa por `lead time` ni `dependencia no satisfecha` como tokens sueltos.
- La senal temporal ahora requiere evidencia mas dura como:
  - `fecha imposible`
  - `orden imposible`
  - `manufactura comienza sin materiales`
  - `sin materiales`
  - `replanificacion en reversa`
  - `trabajo hacia atras`
  - `solo tengo 2 dias`
  - `6 dias minimo`
  - `dependencia temporal`
- Se agrego proteccion metodologica:

```text
temporal_dependency_break =
  temporalDependencyBreakCandidate
  AND (NOT stableInformalArchitecture OR workaroundAsSymptom)
```

Donde `stableInformalArchitecture` se deriva de:

- `workaround_as_coordination_architecture`
- `system_parallel_as_primary_truth`
- `formal_system_insufficient_absorption`

Nuevas senales estructurales:

- `system_parallel_as_primary_truth`
- `formal_system_insufficient_absorption`

Uso:

- `N06` queda protegido para ruptura temporal/OLC puntual.
- `N03` recibe soporte adicional cuando hay sistema paralelo, multiples verdades o sistema formal insuficiente.

Validacion estatica:

- `npm run lint -- --format stylish`: exitoso.

## Micro-ronda estructural - de tokens a senales intermedias

Se introdujo una primera capa interna de transduccion semantico-estructural dentro de Capa 2 MVP.

Archivo tocado:

- `src/services/causal-transduction-engine.ts`

Nueva estructura:

```ts
type StructuralSignals = {
  object_nonconformity: boolean;
  improper_release_or_acceptance: boolean;
  material_coverup: boolean;
  validation_state_conflict: boolean;
  explicit_n04_breach: boolean;
  temporal_dependency_break: boolean;
  workaround_as_coordination_architecture: boolean;
  workaround_as_symptom: boolean;
};
```

Nueva funcion:

```ts
deriveStructuralSignals(scene)
```

La regla deja de operar conceptualmente como:

```text
palabra suelta -> nodo
```

y empieza a operar como:

```text
evidencia textual/canonica -> senal estructural intermedia -> bundle causal -> nodo
```

Aplicacion inicial:

- `N04` usa `explicit_n04_breach`.
- `N06` usa `temporal_dependency_break`.
- `N03` usa `workaround_as_coordination_architecture` y `workaround_as_symptom`.

El soporte derivado se guarda en los bundles como evidencia computada con variables tipo:

- `structural_signal.explicit_n04_breach`
- `structural_signal.temporal_dependency_break`
- `structural_signal.workaround_as_coordination_architecture`
- `structural_signal.workaround_as_symptom`

Validacion estatica:

- `npm run lint -- --format stylish`: exitoso.
