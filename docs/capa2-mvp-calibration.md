# Calibracion Capa 2 MVP Por Sesion

Fecha: 2026-05-15

## Nota De Canon De Nodos

La numeracion canonica fue alineada con el motor MMABP de 13 nodos. Las menciones historicas a `N2`, `N3`, `N4` y `N5` en esta ronda deben leerse como codigos legacy del MVP inicial:

| Codigo legacy MVP | Codigo canonico actual | Nombre |
| --- | --- | --- |
| `N5` | `N03` | Anarquia Operacional |
| `N4` | `N04` | Violacion Causal |
| `N2` | `N06` | Tortura Causal |
| `N3` | `N10` | Promesa Imposible |

El documento canonico de referencia es `docs/capa2-node-canon.md`.

## Objetivo

Esta ronda no busca forzar un resultado causal deseado. Busca mejorar la capacidad del MVP para discriminar entre hipotesis causales rivales, detectar dominancia artificial, declarar incertidumbre y mostrar que cambios de evidencia alteran la raiz probable.

## Sesiones Evaluadas

Caso: manufactura de muebles.

Estrategia corregida:

- 1 sesion global administrativa para experto EVE consultor.
- 7 sesiones operativas separadas, una por rol.
- 36 actividades totales tratadas como actividades principales dentro de su rol.
- Capa 1 y Capa 2 corridas por sesion/rol.

## Diagnostico De Dominancia

Resultado inicial observado:

- Todas las sesiones activaron N2, N3, N4 y N5.
- Todas dejaron N5 Anarquia Operacional como raiz probable dentro del alcance MVP.
- La raiz N5 estaba sostenida sobre todo por evidencia de workaround, compensacion, rutas alternativas y desviacion.

Diagnostico tecnico:

- N5 no domina de manera completamente robusta.
- En pruebas de ablacion, cuando se remueve o reduce workaround/compensacion, la raiz cambia a N3 o N2.
- Cuando se remueven o reducen rutas alternativas/desviaciones, la raiz tambien cambia a N3 o N2.
- Eso indica que N5 depende fuertemente de esas familias de evidencia.
- No se debe bajar N5 artificialmente, pero si era necesario impedir que valores no tensionados empujaran nodos.

## Ajustes Metodologicos Realizados

### 1. Selects No Tensionados Ya No Empujan Nodos

Antes, algunas variables podian sumar soporte solo por tener valor.

Correccion:

- `hidden_subprocess = no` ya no empuja N4.
- `regla_informal_conocida = no` ya no empuja N4.
- `discrecionalidad = medium/high` ya no empuja N3.
- `wait_time = none/less_than_1h` ya no empuja N2.
- `workaround_types` solo pesa si primero `workaround_used` es afirmativo.
- `sacrificio_humano` solo pesa si es afirmativo.
- `desgaste_acumulado` solo pesa en `medium/high`.
- `alternative_paths` solo pesa en `yes_informal/both`.
- `flow_deviation_frequency` solo pesa en `often/almost_always`.

Justificacion:

Un valor presente no es necesariamente evidencia causal. La evidencia debe expresar tension estructural positiva.

### 2. Confianza De Sesion Ajustada Por Margen

Antes, una raiz podia quedar en `high` aunque el segundo nodo estuviera muy cerca.

Correccion:

- Si la raiz probable esta cerca del segundo nodo, la confianza agregada de sesion baja.
- No se cambia la raiz por ese motivo.
- Se declara mayor necesidad de revision experta cuando hay ambiguedad entre nodos.

Justificacion:

La confianza de sesion no solo depende de la fuerza absoluta de la raiz, sino de su separacion frente a hipotesis rivales.

## Pruebas De Ablacion Implementadas

Archivo ejecutable:

- `scripts/calibrate-capa2-mvp.mjs`

Grupos de ablacion:

- `workaround_compensation`
- `alternative_deviation`
- `informal_hidden`
- `capacity_bargain`
- `consistency_flags`
- `block7_light_inference`

La herramienta calcula:

- raiz actual;
- ranking de nodos;
- raiz tras remover cada grupo;
- raiz tras reducir cada grupo al 50%;
- bundles con mayor arrastre;
- evidencia que sostiene y debilita;
- escenarios sinteticos de discriminacion.

## Resultado De Calibracion Actual

Reporte generado:

- `fixtures/capa2-calibration-report-1778821082625.json`
- `fixtures/capa2-calibration-report-1778821082625.md`

Resumen:

| Rol | Raiz MVP | Confianza |
| --- | --- | --- |
| 1 Supervisor de Linea | N5 | medium |
| 2 Planificador de Produccion | N5 | high |
| 3 Jefe de Produccion | N5 | medium |
| 4 Jefe de Calidad | N5 | medium |
| 5 Ingeniero de Procesos | N5 | medium |
| 6 Owner / Director General | N5 | medium |
| 7 Canal Algedonico | N5 | medium |

La dominancia de N5 persiste, pero ya no se interpreta como certeza fuerte en 6 de 7 sesiones.

## Pruebas Iniciales De Discriminacion

Se prepararon escenarios sinteticos minimos:

- N5 claro por workaround/compensacion.
- N3 claro por brecha de capacidad/resource bargain.
- N2 claro por dependencia temporal/bloqueo.
- N4 claro por informacion oculta/falla sin feedback.

Resultado:

- Los 4 escenarios discriminan correctamente.
- Esto indica que el mecanismo de ranking puede distinguir nodos cuando los bundles son limpios.
- El problema del caso manufactura no es colapso total del motor, sino acumulacion real o reconstruida de familias N5/N3/N2 en casi todas las escenas.

## Interpretacion De Las Tres Hipotesis

1. El caso realmente esta cargado hacia N5:

Probable parcialmente. El documento describe muchos arreglos informales, registros paralelos, compensaciones y coordinacion por fuera del procedimiento.

2. El fixture reconstruido esta sesgado hacia workaround/compensacion:

Tambien probable. La reconstruccion asistida tiende a completar preguntas con patrones generales del caso. Eso puede amplificar N5 si se interpreta cada friccion como workaround.

3. Las reglas eran demasiado permisivas:

Confirmado parcialmente. Se corrigio el problema de sumar soporte por valores no tensionados.

## Estado Metodologico

Capa 2 por sesion esta mejor estabilizada que antes, pero todavia no la considero lista para Capa 2.5 de agregacion por cliente.

Recomendacion:

- Hacer una ronda mas con 2 o 3 casos controlados menos cargados a workaround.
- Incluir casos donde N3, N2 o N4 deban dominar sin N5.
- Revisar falsos positivos con captura menos reconstruida y mas directa.
- Despues de esa ronda, si la discriminacion se sostiene, avanzar a Capa 2.5.
