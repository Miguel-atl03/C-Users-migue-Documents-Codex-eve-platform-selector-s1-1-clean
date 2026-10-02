# Capa 2 MVP - Prueba Con 5 Casos Controlados

Fecha: 2026-05-15

## Insumo

Documento fuente: `5_Casos_de_Prueba_-_Plataforma_EVE™.docx`

Fixture generado: `fixtures/controlled-5-cases-session-input.json`

Resultado de sesiones: `fixtures/manufactura-assisted-multisession-result-1778824464994.json`

Reporte de calibracion: `fixtures/capa2-calibration-report-1778824474627.md`

Reporte JSON: `fixtures/capa2-calibration-report-1778824474627.json`

## Estrategia De Corrida

- Se crearon 5 sesiones operativas independientes, una por caso.
- Se creo 1 sesion administrativa global.
- Todas las actividades redactadas del documento se trataron como actividades principales.
- Se reconstruyeron respuestas de Capa 1 desde el documento fuente.
- La hipotesis esperada se uso solo como contraste de calibracion, no como entrada causal para forzar el motor.
- Se uso la nomenclatura canonica MMABP: `N03`, `N04`, `N06`, `N10`.

## Resultado Resumido

| Caso | Hipotesis esperada | Raiz producida | Confianza | Reentrada | Revision experta | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Supervisor de Linea | `N03` Anarquia Operacional | `N03` Anarquia Operacional | medium | false | true | coincide |
| 2 Planificador de Produccion | `N06` Tortura Causal | `N03` Anarquia Operacional | medium | false | true | diverge |
| 3 Jefe de Calidad | `N04` Violacion Causal | `N03` Anarquia Operacional | medium | false | true | diverge |
| 4 Owner / Director General | `N10` Promesa Imposible | `N10` Promesa Imposible | medium | false | true | coincide |
| 5 Jefe de Compras | Ambiguo | `N03` Anarquia Operacional | medium | false | true | ambiguo |

## Ranking Por Caso

| Caso | Ranking recalculado |
| --- | --- |
| 1 | `N03: 76.2`, `N04: 67.2`, `N06: 60.0`, `N10: 56.4` |
| 2 | `N03: 64.2`, `N10: 62.4`, `N06: 60.0`, `N04: 58.2` |
| 3 | `N03: 76.2`, `N04: 67.2`, `N06: 54.0`, `N10: 20.4` |
| 4 | `N10: 62.4`, `N03: 59.4`, `N06: 36.0`, `N04: 33.0` |
| 5 | `N03: 76.2`, `N04: 67.2`, `N10: 62.4`, `N06: 60.0` |

## Hallazgo Principal

La dominancia de `N03` persiste en los casos 2, 3 y 5. No parece ser una falla total de discriminacion, porque los escenarios sinteticos del script siguen pasando:

- `clear_n03_workaround_only`: pasa.
- `clear_n10_capacity_gap`: pasa.
- `clear_n06_temporal_dependency`: pasa.
- `clear_n04_hidden_information`: pasa.

La divergencia aparece cuando una escena tiene simultaneamente:

- workaround;
- sacrificio humano;
- absorcion de variedad residual;
- rutas alternativas;
- desviacion frecuente;
- desgaste.

En esos casos, el motor tiende a tratar `N03` como raiz, aunque en el caso redactado esas huellas podrian ser consecuencia de `N06` o `N04`.

## Lectura Por Caso

### Caso 1 - `N03`

La salida coincide con la hipotesis esperada. La evidencia de sistemas paralelos, Excel, coordinacion informal, ERP no confiable y multiples verdades operativas sostiene correctamente `N03`.

### Caso 2 - Esperado `N06`, producido `N03`

El ranking queda muy cerrado:

- `N03`: 64.2
- `N10`: 62.4
- `N06`: 60.0
- `N04`: 58.2

Esto no debe leerse como un error simple. El caso contiene tortura causal fuerte, pero tambien declara muchos mecanismos de compensacion. La ablacion confirma que si se remueve workaround/compensacion, la raiz cambia a `N06`. Por tanto, `N06` esta presente, pero queda colonizado por la familia de evidencia `N03`.

### Caso 3 - Esperado `N04`, producido `N03`

La evidencia de `N04` es fuerte: informacion faltante, subprocesos ocultos, regla informal, falla sin feedback y secuencia real distinta a la oficial. Sin embargo, `N03` gana porque workaround, sacrificio y absorcion residual suman mas que la evidencia de violacion causal.

La ablacion confirma que al remover o reducir workaround/compensacion, la raiz cambia a `N04`.

### Caso 4 - `N10`

La salida coincide con la hipotesis esperada. `N10` domina por brecha de capacidad, baja discrecionalidad, resource bargain y metas incompatibles. Es una buena senal: el motor si puede distinguir promesa imposible cuando la evidencia trilateral PM-PF-OLC es suficientemente fuerte.

### Caso 5 - Ambiguo

El motor produjo `N03` con confianza medium y revision experta. Esto es aceptable parcialmente, porque la salida no se presenta con confianza alta y activa revision experta. Sin embargo, la raiz `N03` sigue siendo demasiado dominante para un caso que deberia quedar mas claramente marcado como ambiguo.

## Implicacion Metodologica

La siguiente calibracion no deberia bajar `N03` de manera arbitraria. El ajuste correcto es distinguir:

- `N03` como causa raiz: la operacion depende estructuralmente de sistemas paralelos o coordinacion informal porque el sistema formal no existe o no absorbe variedad.
- workaround como consecuencia: el workaround aparece para sobrevivir a una tortura causal, violacion causal o promesa imposible previa.

Eso exige que la regla `N03` no solo mida presencia de workaround, sino su posicion causal dentro de la escena.

## Recomendacion

Capa 2 MVP no esta lista todavia para pasar a Capa 2.5. Ya discrimina en escenarios puros y acierta `N03`/`N10`, pero necesita una ronda adicional para separar:

- workaround-raiz;
- workaround-consecuencia;
- presion/violacion causal;
- dependencia temporal;
- promesa imposible.

El proximo ajuste deberia introducir un reason code o componente de confianza tipo `workaround_as_symptom_not_root`, sin eliminar la evidencia `N03`.
