# Primary Activity Selection Policy v1.3

## Fuente Ejecutable Vigente

La fuente ejecutable actual es:

`src/domain/primary-activity-selection-policy.v1.3.ts`

El XLSX v1.2 no es autoridad ejecutable vigente. Puede quedar como antecedente historico/editorial, pero runtime no debe leerlo ni tomarlo como cerebro actual.

## Version

`PRIMARY_ACTIVITY_SELECTION_V1_3`

## Proposito

Seleccionar hasta 8 actividades primarias desde WorkMap para entrar a Significado y Runtime 40/20, preservando las actividades no primarias como contexto.

## Input

- WorkMap guardado.
- Areas y responsabilidades.
- Actividades redactadas.
- Trazabilidad `responsibilityId` / `activityId`.

## Output

- `version`
- `mode`
- `selectedPrimaryActivities`
- `nonPrimaryContextActivities`
- `excludedActivities`
- conteos y trazas de seleccion

## Criterios De Elegibilidad

La politica aplica gates sobre actividad no vacia, pertenencia al WorkMap, duplicados/aliases, macrofunciones, microtareas y formulaciones que no sostienen Runtime 40/20.

## Modos De Seleccion

- `reentry_required`: no hay actividades elegibles.
- `non_competitive_inclusion`: hay entre 1 y 8 actividades elegibles; se incluyen sin ranking competitivo.
- `competitive_selection`: hay mas de 8 elegibles; se seleccionan maximo 8.

## Criterios Competitivos

La seleccion competitiva usa senales PM, MoC, PF, OLC, transformacion de objeto, handoff/dependencia, timer/espera, sincronizacion/gobernanza, friccion/excepcion, riesgo PF/OLC, centralidad operativa y diversidad de cobertura como ajuste limitado.

## Maximo 8

La politica fija `maxPrimaryActivities = 8`. No rellena artificialmente si hay menos de 8 elegibles.

## Actividades No Primarias

Las actividades no seleccionadas no se descartan. Viajan como `nonPrimaryContextActivities` para contexto, gaps, cobertura y posible promocion posterior. No entran a Runtime 40/20 inmediato.

## Source Mode

El selector trabaja sobre WorkMap. Las trazas demo pueden distinguir fuente manual, ejemplo cargado o ejemplo modificado, pero la seleccion productiva no depende de preferencia del usuario.

## Invariantes

- Significado consume seleccion, no selecciona.
- WorkMap no es evidencia Runtime confirmada.
- No hay razon generica unica tipo R2.3 legacy.
- Balance por responsabilidad no desplaza senal critica.
- Actividades no primarias quedan preservadas.

## Tests

- `tests/regression/primary-activity-selection-policy.test.ts`

## Reemplazo De v1.2

v1.3 reemplaza la expectativa operativa legacy v1.2 para seleccion primaria. El XLSX v1.2 solo puede mencionarse como antecedente editorial/historico.
