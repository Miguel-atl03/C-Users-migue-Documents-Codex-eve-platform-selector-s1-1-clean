# EXPORT_ACTIVITY_COLLECTION_XLSX

## Alcance

Genera un archivo `.xlsx` reconstruido desde `sessionId` usando Supabase como fuente de verdad.

El objetivo no es crear un reporte nuevo, sino reconstruir el levantamiento con la misma semantica operativa del instrumento de actividades: actividades, cuestionario, mision inferida, consistencia, cierre y trazabilidad.

## Plantilla V04

La implementacion busca la plantilla real `Herramienta de Actividades EVE FULL - V04.xlsx`.

Cuando esta disponible, preserva el workbook original:

- `Sheet1`: matriz principal del instrumento, con preguntas en columnas y actividades en filas.
- `Sheet2`: catalogo/opciones de la plantilla original.
- `TRAZABILIDAD_EVE`: hoja complementaria conservadora para metadata, cierre y trazabilidad.

Si el archivo no esta disponible en el entorno, el exportador usa la estrategia alternativa de reconstruccion semantica fiel.

## Mapeo directo

- `sesiones_llenado` alimenta `RESUMEN_SESION`.
- `actividades` alimenta `ACTIVIDADES`.
- `respuestas_estructuradas` con prefijo `FULL_V03:` alimenta las celdas correspondientes en `Sheet1`.
- `activity_structural_scores` alimenta marcas de principal, soporte, ranking y cobertura.

## Mapeo inferido

- `mission_final`, confianza y evidencia salen del motor de inferencia de mision.
- alertas y micro-aclaraciones salen de la capa de consistencia.
- cierre global, gaps residuales, dependencias, tensiones y trazabilidad salen del motor de cierre de sesion.

## Datos que pueden quedar vacios

Quedan vacios los campos que no fueron capturados, no existen en la sesion o no tienen lugar canonico en el flujo actual. La politica es no fabricar valores faltantes.

## Hojas generadas

- Con plantilla real: `Sheet1`, `Sheet2`, `TRAZABILIDAD_EVE`.
- Sin plantilla real: `RESUMEN_SESION`, `ACTIVIDADES`, `CUESTIONARIO`, `MISION_INFERIDA`, `CONSISTENCIA`, `CIERRE`, `TRAZABILIDAD`, `PROVENIENCIA`.

## Punto de descarga

`GET /api/export/activity-collection-xlsx?sessionId=<sessionId>`

La pantalla final del levantamiento muestra el boton `Descargar Excel` cuando ya existe `finalOutput`.
