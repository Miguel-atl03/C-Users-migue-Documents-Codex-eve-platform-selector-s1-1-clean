# Document Transduction Completeness Protocol V1

## Objetivo

Definir el procedimiento para aceptar o rechazar una transduccion documental `.docx/.xlsx -> .md/.json/.ts` sin perdida de contenido rector.

## Procedimiento

1. Inventario del documento fuente

Registrar archivo, tipo, version visible, checksum/fingerprint si se implementa, sheets/secciones, tablas, anexos y metadata relevante.

2. Segmentacion atomica

Dividir el documento en unidades auditables: headings, parrafos, listas, tablas, sheets, filas, columnas, celdas, formulas, comentarios y validaciones.

3. Clasificacion de cada unidad

Asignar exactamente un estado de cobertura a cada unidad:

- `transduced_exact`
- `transduced_structured`
- `transduced_with_normalized_names`
- `editorial_context_only`
- `superseded_with_reference`
- `intentionally_excluded_with_approval`
- `pending_transduction`

4. Extraccion literal

Guardar o referenciar el contenido literal suficiente para auditoria. Si el contenido no se copia completo por volumen, registrar locator y fingerprint.

5. Estructuracion

Transformar tablas y reglas a estructuras con IDs, orden, campos, relaciones, tipos y source refs.

6. Normalizacion controlada

Solo normalizar nombres si existe diccionario o mapping explicito. No renombrar conceptos silenciosamente.

7. Mapping fuente -> destino

Cada unidad fuente debe tener mapping hacia un destino `.md`, `.json`, `.ts`, o hacia una exclusion/supersesion aprobada.

8. Validacion de cobertura

Calcular cobertura. No aceptar unidades sin clasificar, sin mapping, pendientes o excluidas sin aprobacion.

9. Validacion semantica

Comparar reglas, excepciones, estados, relaciones y comentarios normativos contra el destino. La estructura puede cambiar, pero el significado rector no puede perderse.

10. Validacion de round-trip audit

Un auditor debe poder elegir cualquier unidad destino y regresar a archivo, seccion/sheet, fila/parrafo, columna/celda y transformacion.

11. Tests

Agregar tests de cobertura para validators, manifests, schemas, registry, adapters o politicas ejecutables.

12. Dictamen de aceptacion

Emitir uno de los estados permitidos:

- `TRANSDUCTION_COMPLETE`
- `TRANSDUCTION_COMPLETE_WITH_APPROVED_EXCLUSIONS`
- `TRANSDUCTION_PARTIAL`
- `TRANSDUCTION_BLOCKED`
- `NO_GO`

## Criterios De Aceptacion COMPLETE

Una transduccion solo puede aceptarse como `TRANSDUCTION_COMPLETE` si:

- 100% de sheets/secciones fueron inventariadas;
- 100% de filas/parrafos normativos fueron clasificados;
- 0 unidades sin mapping;
- 0 columnas perdidas sin justificacion;
- 0 reglas sin representacion o exclusion aprobada;
- no hay contenido excluido sin razon y aprobacion;
- hay tests de cobertura;
- hay manifest de fuente;
- hay checksum o fingerprint documental si se implementa;
- hay closeout.

## Criterios COMPLETE_WITH_APPROVED_EXCLUSIONS

Se permite cuando la cobertura es 100%, pero existen unidades con `intentionally_excluded_with_approval` y cada una tiene `approvalReference`.

## Criterios PARTIAL

Se usa cuando hay unidades pendientes, cobertura menor a 100%, o migracion incompleta sin violar reglas bloqueantes.

## Criterios BLOCKED

Se usa cuando falta fuente, no puede leerse el documento, no se puede segmentar, o la transduccion depende de aprobaciones externas.

## Criterios NO_GO

Se usa cuando:

- hay unidades sin clasificacion;
- hay unidades sin mapping;
- hay exclusiones sin aprobacion;
- se declara runtime authority sin `.ts/.json`;
- se declara complete con cobertura menor a 100;
- se pierden columnas, reglas o IDs sin justificacion.
