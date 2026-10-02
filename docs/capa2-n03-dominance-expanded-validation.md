# Capa 2 MVP - Micro-ronda de dominancia ampliada N03

Fecha: 2026-05-15

## Diagnostico inicial

La validacion ampliada anterior fallo por dominancia ampliada de `N03`:

- precision observada: `0.571`
- nodo dominante: `N03`
- share de nodo dominante: `0.75`
- divergencias con confianza `high`: `3`

Las divergencias principales ocurria cuando el motor trataba volumen de workaround, sacrificio humano, absorcion residual, rutas alternativas e informalidad como si fueran arquitectura informal raiz. El caso mas claro era el controlado N10: al quitar `workaround_compensation`, la raiz pasaba a `N10`, senalando que N03 estaba ganando por compensacion sintomatica.

## Cambio implementado

Se agrego una distincion estructural:

- `informal_operation`: informalidad, compensacion o workaround operativo que no prueba por si sola arquitectura raiz.
- `informal_architecture`: representada por las senales ya existentes `workaround_as_coordination_architecture`, `system_parallel_as_primary_truth` y `formal_system_insufficient_absorption`.

La regla de N03 quedo asi:

- workaround, sacrificio, absorcion residual, desviacion, canales informales y flags de compensacion pesan fuerte solo si existe arquitectura informal estable.
- si no existe arquitectura informal estable, esas mismas senales pesan debil y agregan un debilitador `structural_signal.informal_operation`.
- se eliminaron disparadores demasiado amplios de arquitectura N03 en `evaluateN5`, especialmente `erp`, `moc` y `ontolog`, porque convertian contexto del expediente en arquitectura raiz.

## Resultados despues del ajuste

Reportes:

- `fixtures/capa2-calibration-report-1778881870746.md`
- `fixtures/capa2-calibration-report-1778881881755.md`
- `fixtures/capa2-expanded-validation-report-1778881937945.md`

Metricas actualizadas:

- precision observada: `0.857`
- nodo dominante: `N06`
- share de nodo dominante: `0.375`
- divergencias con confianza `high`: `1`

## Lectura

La dominancia ampliada de N03 quedo corregida:

- N03 mantiene el acierto quirurgico cuando hay arquitectura informal estable real.
- N03 deja de colonizar casos de N06, N10 y ambiguos cuando solo hay compensacion o informalidad operativa.
- La taxonomia intermedia funciona mejor: `informal_operation` queda como sintoma/compensacion, no como raiz.

El gate formal todavia no pasa porque queda una divergencia nueva: en el caso controlado 3, esperado `N04`, el motor produce `N06` con confianza `high`. Esa divergencia no corresponde a dominancia N03 y no se corrigio en esta ronda por restriccion metodologica.

## Estado

Capa 2 por sesion mejoro sustancialmente, pero todavia no debe pasar a Capa 2.5. La siguiente intervencion, si se decide hacerla, deberia estar estrictamente basada en la divergencia nueva `N04` esperado vs `N06` producido en el caso controlado 3.
