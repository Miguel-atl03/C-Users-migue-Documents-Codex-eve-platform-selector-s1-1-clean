# Retiro controlado del catalogo local v2.1

Estado: retirado de ruta runtime activa.

El archivo `src/rules/question-catalog-v2-1.json` ya no existe. Su contenido historico se conserva en:

`archive/legacy-runtime/question-catalog-v2-1.NO_RUNTIME_SOURCE.json`

Ese archivo no es fallback, no es fuente de verdad y no debe importarse desde `src/`.

## Por que existia

Antes de la remediacion canon-runtime, la plataforma tenia un catalogo local para representar Capa 1 v2.1. Eso creaba riesgo de drift: la app podia volver a interpretar el canon desde tablas locales parciales.

## Que lo reemplazo

La fuente runtime activa es exclusivamente:

`src/runtime/capa-1-v2-1-runtime-manifest.json`

La ruta `GET /api/questionnaire/catalog?version=CAPA1_V2_1` sirve Capa 1 v2.1 desde el manifest compilado, no desde `src/rules`.

## Guardia automatica

Ejecutar:

```bash
npm run check:no-legacy-runtime-catalog
```

La guardia falla si:

- reaparece `src/rules/question-catalog-v2-1.json`;
- codigo activo vuelve a importar o leer `question-catalog-v2-1.json` desde rutas runtime;
- falta el archivo archivado de retiro controlado.

Tambien esta integrada en:

```bash
npm run test:runtime-vsm
```

## Regla operativa

El runtime activo consume el manifest compilado. El catalogo legacy no puede reactivarse por accidente sin romper validacion.