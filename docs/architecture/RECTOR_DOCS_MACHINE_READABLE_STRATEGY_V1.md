# Rector Docs Machine-Readable Strategy V1

## Regla Arquitectonica

Una politica o catalogo gobierna operacion solo cuando tiene representacion .ts/.json testeada. Un .docx/.xlsx sin counterpart machine-readable no gobierna runtime.

## Por Que DOCX/XLSX No Son Autoridad Ejecutable

Los archivos `.docx` y `.xlsx` son utiles para diseno humano, revision editorial, auditoria historica y transferencia entre equipos. No son una fuente segura para runtime porque pueden cambiar de estructura, mezclar texto rector con notas editoriales y requerir interpretacion humana antes de ejecutar.

El cerebro operativo de EVE necesita entradas versionadas, tipadas, validadas y testeadas. Por eso runtime debe consumir `.ts` y `.json`, no documentos Office.

## Clasificacion De Fuentes

- `.docx` / `.xlsx`: fuente editorial, historica o de auditoria. No autoridad directa de runtime.
- `.md`: documento rector humano canonico dentro de la repo.
- `.json`: catalogo, manifest, politica o tabla machine-readable.
- `.ts`: tipos, validadores, adapters, reglas ejecutables y politicas operativas.
- `tests`: pruebas que fijan invariantes y evitan regresiones de autoridad.

## Que Vive En Markdown

Markdown explica intencion, alcance, reglas de uso, riesgos, versiones y criterio de migracion. Es la lectura canonica para humanos, pero no reemplaza contratos ejecutables.

## Que Vive En JSON

JSON representa catalogos, manifests y tablas que pueden ser inspeccionadas o validadas por maquina. Un JSON rector debe tener version de schema, rutas de autoridad, estado de completitud y pruebas asociadas.

## Que Vive En TypeScript

TypeScript contiene reglas ejecutables, tipos, validadores, adapters y politicas que el runtime puede importar. Cuando una regla gobierna operacion, su forma ejecutable debe estar en `.ts` o estar validada desde `.ts`.

## Que Viven En Tests

Los tests son el cerrojo S3*: confirman que la autoridad ejecutable no regresa a XLSX/DOCX, que los catalogos conservan estructura y que los adapters no cambian comportamiento sin una migracion explicita.

## Versionado Del Cerebro Operativo

Cada cerebro operativo debe declarar:

- version de politica o schema;
- fuente editorial, si existe;
- counterpart machine-readable;
- archivo ejecutable;
- pruebas obligatorias;
- estado de runtime authority.

Cuando se migra una version, la version nueva debe entrar como `.ts/.json` testeado antes de reemplazar a la anterior.

## Proteccion Contra Excel Viejo Como Runtime Source

El registry rector marca XLSX v1.2 de seleccion primaria como antecedente editorial/deprecated. La autoridad vigente es `src/domain/primary-activity-selection-policy.v1.3.ts` con sus tests. Ningun path `.xlsx` debe aparecer como `executableTs`.

## Machine-Readable Rector

Un rector machine-readable es una representacion operativa que puede ser leida, validada y probada por la plataforma. No es solo documentacion: tiene contrato, version, estructura verificable y pruebas que protegen su uso.
