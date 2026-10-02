# Legacy Question Catalog v2.1 Audit

Fecha: 2026-07-23

## Compuerta exacta

- Script: `scripts/check-no-legacy-runtime-catalog.mjs`.
- Regla: falla si existe `src/rules/question-catalog-v2-1.json`.
- Patron detectado: archivo fisico legacy presente bajo `src/rules`.
- Resultado esperado: `src/rules/question-catalog-v2-1.json` ausente, archivo historico `archive/legacy-runtime/question-catalog-v2-1.NO_RUNTIME_SOURCE.json` presente y referencias activas en `src`, `scripts` y `tests` iguales a 0.

## Uso real reconstruido

Busqueda revisada: `question-catalog-v2-1.json`, `question-catalog-v2-1`, `question catalog v2.1` y `src/rules/`.

Resultado:

- Imports productivos al JSON legacy: 0.
- `require` productivo al JSON legacy: 0.
- Lecturas por filesystem al JSON legacy como fuente de runtime/producto: 0.
- BFF, Runtime, workers y build: sin consumidor productivo del archivo en `src/rules`.
- Consumidores de codigo encontrados: guardas y pruebas anti-legacy que comprueban que el archivo no exista.
- Referencias documentales/historicas: presentes en auditorias, reportes y documentos de retiro; no son consumidores operativos.

## Grafo de consumidores

| Archivo | Consumidor | Proposito | Contrato sustituido | Catalogo canonico equivalente |
|---|---|---|---|---|
| `src/rules/question-catalog-v2-1.json` | Ninguno productivo | Ninguno vigente | Catalogo local Capa 1 v2.1 bajo `src/rules` | `src/runtime/capa-1-v2-1-runtime-manifest.json` via `src/runtime/capa1-runtime-manifest.ts` |
| `src/runtime-vsm/runtime-vsm.ts` | Guardia VSM | Detectar reaparicion de canon local | No consume contenido | Manifest runtime compilado |
| `scripts/check-no-legacy-runtime-catalog.mjs` | Legacy freeze | Fallar si reaparece en `src/rules` | No consume contenido | Archivo historico archivado + manifest runtime |
| `scripts/runtime-vsm-rules.test.mjs` | Test VSM | Exigir ausencia del JSON en runtime source | No consume contenido | Manifest runtime compilado |
| `src/app/api/questionnaire/catalog/route.ts` | API catalogo | Sirve `CAPA1_V2_1` desde `runtimeQuestionCatalog` | Sustituye lectura directa de JSON local | `src/runtime/capa1-runtime-manifest.ts` |

## Clasificacion

**A. Codigo muerto.**

El archivo no tiene consumidores productivos, contractuales ni operativos. Su presencia contradice la compuerta que ya existia y que espera el retiro desde `src/rules`.

## Comparacion con fuente canonica

La fuente runtime activa para Capa 1 v2.1 es el manifest compilado `src/runtime/capa-1-v2-1-runtime-manifest.json`, con `metadata.content_hash = 6763716befdfec93010cf41b609de7a17118bf70be303d484a3a29142021a499`. El endpoint oficial no carga el JSON legacy: importa `runtimeQuestionCatalog`.

| Elemento legacy | Equivalente canonico | Igual | Diferente | Consumidor afectado |
|---|---|---:|---:|---|
| Version `CAPA1_V2_1_MASTER_TRAMO_6` | `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json` y manifest runtime compilado | Si | Hash de archivo y forma de empaquetado | Ninguno productivo |
| 171 preguntas declaradas | 171 preguntas en master canonico y 171 codigos unicos comparados | Si | El manifest contiene estructura runtime enriquecida | Ninguno productivo |
| 7 bloques unicos | 7 bloques unicos en master canonico | Si | El manifest compila gates, diccionario y acoplamientos | Ninguno productivo |
| Archivo bajo `src/rules` | `src/runtime/capa-1-v2-1-runtime-manifest.json` | No aplica | El primero es fuente local legacy; el segundo es contrato runtime activo | API de catalogo ya usa manifest |

## Decision

Se retiro `src/rules/question-catalog-v2-1.json` porque era codigo muerto y la ruta canonica vigente ya esta materializada por el manifest runtime compilado. No se agrego allowlist, no se renombro el archivo, no se movio para ocultarlo y no se creo adaptador permanente.

## Evidencia

- `reports/local/legacy-question-catalog-v2-1/reference-scan.json`
- `reports/local/legacy-question-catalog-v2-1/consumer-graph.json`
- `reports/local/legacy-question-catalog-v2-1/catalog-equivalence-matrix.json`
- `reports/local/legacy-question-catalog-v2-1/before-after-tests.json`
- `reports/local/legacy-question-catalog-v2-1/legacy-freeze-result.txt`
- `reports/local/legacy-question-catalog-v2-1/build-result.txt`

## Dictamen

LEGACY FREEZE CERRADO - SUSTRATO FACTUAL MMABP APTO PARA PROMOCION

PRODUCTOR DE CONFORMANCE/CONSISTENCY AUN NO INICIADO
