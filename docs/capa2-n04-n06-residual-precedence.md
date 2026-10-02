# Capa 2 MVP - Micro-ronda residual N04 vs N06

Fecha: 2026-05-15

## Diagnostico tecnico

La validacion ampliada mas reciente dejo una divergencia residual:

- caso controlado 3
- esperado: `N04`
- producido antes del ajuste: `N06`
- confianza antes del ajuste: `high`

La auditoria mostro que `N06` no ganaba por `structural_signal.temporal_dependency_break`, sino por acumulacion generica de dependencias, bloqueos, fallas y excepciones en varias escenas. En cambio `N04` si tenia un bundle dominante fuerte:

- `structural_signal.explicit_n04_breach`
- escena dominante: `Presion para Liberar Producto Defectuoso`
- net del bundle dominante N04: `16.7`

La parte metodologicamente incorrecta era que la capa temporal generica se imponia sobre un breach explicito de objeto/validacion, aun cuando la ruptura temporal no estaba derivada como senal estructural fuerte.

## Regla puntual implementada

Se agrego una precedencia local en el ranking de activaciones:

```text
si hay explicit_n04_breach
y N06 no tiene temporal_dependency_break
entonces la activacion de N06 se penaliza como lectura temporal generica/instrumental
```

La regla no baja N06 cuando existe ruptura temporal fuerte explicita. Solo actua cuando N06 compite desde dependencia/bloqueo generico contra un breach N04 ya derivado.

## Resultados

Reportes:

- `fixtures/capa2-calibration-report-1778883056108.md`
- `fixtures/capa2-calibration-report-1778883056578.md`
- `fixtures/capa2-expanded-validation-report-1778883067810.md`

Guardarrailes quirurgicos:

- `N06` esperado -> `N06` producido, `high`
- `N04` esperado -> `N04` producido, `high`
- `N03` esperado -> `N03` producido, `high`

Validacion ampliada:

- precision observada: `1`
- nodo dominante: `N06`
- share del nodo dominante: `0.25`
- divergencias con confianza `high`: `0`
- gate formal: `PASO`

## Estado

Capa 2 por sesion queda suficientemente estable para pasar a preparacion de Capa 2.5 con monitoreo. La salida sigue siendo hipotesis causal auditable, no juicio experto final.
