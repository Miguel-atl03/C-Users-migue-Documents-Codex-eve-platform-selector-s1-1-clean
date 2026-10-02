# Document Transduction QA Standard V1

## A. Que Es Transduccion Documental

Transduccion documental es el proceso de convertir un documento rector humano/editorial en representaciones `.md`, `.json` o `.ts` sin perdida de contenido, manteniendo trazabilidad entre la fuente original y el artefacto destino.

Una transduccion documental no es un resumen.

La ruta:

`.docx/.xlsx -> .md/.json/.ts`

debe conservar todo contenido rector, reglas, tablas, campos, excepciones, estados, IDs, relaciones, comentarios normativos relevantes y trazabilidad de origen.

## B. Transduccion, Sintesis Y Reinterpretacion

Transduccion:

- preserva contenido y estructura;
- registra source refs;
- mantiene mapping fuente -> destino;
- permite auditoria de cobertura.

Sintesis:

- reduce o resume contenido;
- puede ayudar a explicar;
- no sustituye al documento rector ni al counterpart machine-readable.

Reinterpretacion:

- crea una nueva version conceptual;
- puede cambiar estructura, nombres o alcance;
- requiere aprobacion explicita y version nueva.

## C. Regla De No Perdida

Toda unidad del documento fuente debe quedar clasificada como una de estas:

- `transduced_exact`
- `transduced_structured`
- `transduced_with_normalized_names`
- `editorial_context_only`
- `superseded_with_reference`
- `intentionally_excluded_with_approval`
- `pending_transduction`

No puede haber contenido sin clasificacion.

Esta prohibido:

- sintetizar sin marcarlo;
- omitir contenido por parecer redundante;
- renombrar conceptos sin diccionario;
- fusionar reglas sin trazabilidad;
- convertir tablas en texto perdiendo columnas;
- mover contenido a implicito sin referencia;
- declarar una version machine-readable como completa sin prueba de cobertura.

## D. Reglas Para DOCX

El inventario DOCX debe cubrir:

- titulos;
- subtitulos;
- parrafos;
- listas;
- tablas;
- notas;
- definiciones;
- reglas;
- ejemplos;
- advertencias;
- referencias internas;
- anexos;
- versiones;
- decisiones;
- glosario;
- cualquier bloque normativo.

Cada unidad DOCX debe tener locator: seccion, heading path, parrafo, tabla, fila o nota, segun aplique.

## E. Reglas Para XLSX

El inventario XLSX debe cubrir:

- workbook;
- cada sheet;
- cada fila usada;
- cada columna usada;
- encabezados;
- IDs;
- celdas vacias con significado;
- formulas si existen;
- comentarios si existen;
- validaciones/listas si existen;
- hidden sheets si existen;
- valores normalizados;
- tipos esperados;
- claves primarias;
- relaciones entre hojas.

Cada unidad XLSX debe tener locator: workbook, sheet, row, column, cell address, formula/comment/validation id, segun aplique.

## F. Reglas Para Salida MD

Markdown debe preservar:

- explicacion humana;
- secciones originales;
- notas de transduccion;
- mapping table fuente -> destino;
- contenido editorial que no entra en runtime;
- decisiones de exclusion o supersesion.

## G. Reglas Para Salida JSON

JSON debe preservar:

- datos estructurados;
- IDs;
- orden;
- campos completos;
- nulls explicitos cuando importan;
- `sourceRefs`;
- `schemaVersion`;
- `completenessStatus`;
- relaciones entre entidades;
- referencias a tests.

## H. Reglas Para Salida TS

TypeScript debe contener, cuando aplique:

- tipos;
- invariantes;
- validators;
- adapters;
- politicas ejecutables;
- guards;
- version;
- referencias a JSON/MD;
- funciones puras para dictamen QA.

## I. Trazabilidad Obligatoria

Todo elemento machine-readable debe poder responder:

- de que archivo fuente viene;
- de que sheet o seccion viene;
- de que fila o parrafo viene;
- que columna o campo lo origina;
- que transformacion sufrio;
- si fue normalizado;
- si fue excluido y por que;
- que test lo protege.

## Dictamen

Una transduccion solo puede llamarse completa cuando su coverage report demuestra 100% de unidades clasificadas, 0 unidades sin mapping, 0 reglas perdidas, exclusiones aprobadas si existen, y pruebas de cobertura.
