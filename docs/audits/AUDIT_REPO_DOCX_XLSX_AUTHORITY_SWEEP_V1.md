# AUDIT - Repo DOCX/XLSX Authority Sweep V1

## 1. Resumen ejecutivo

Se hizo barrido total de archivos `.docx` y `.xlsx` dentro del workspace actual, excluyendo carpetas generadas: `node_modules`, `.next`, `dist`, `build` y `coverage`.

Resultado: se encontraron 3 archivos Office fisicos en la repo. No se encontro ningun `.docx` o `.xlsx` leido directamente por runtime productivo como fuente vigente del cerebro EVE. Los documentos Runtime estan registrados como fuentes editoriales con counterparts parciales machine-readable. El DOCX de Significado tiene counterpart TS/MD, pero todavia no esta registrado en `src/config/rector-docs-registry.ts`.

Dictamen de auditoria: no hay bloqueador Level 4. Hay riesgos Level 2 por Runtime 40/20 completo aun parcial, y un gap de registry para Significado.

## 2. Total de archivos encontrados

| relativePath | extension | domain | version inferred | status | riskLevel |
|---|---:|---|---|---|---:|
| `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | `.xlsx` | runtime | v1_1_1 | editorial_source | 2 |
| `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` | `.docx` | runtime | v1_0_1 | editorial_source | 2 |
| `docs/significado/canon/Descripción_Operativa_cerebro AI.docx` | `.docx` | significado | ASRO v2 | editorial_source | 1 |

Totales:

- `.docx`: 2
- `.xlsx`: 1
- total Office fisicos: 3

## 3. Referencias cruzadas

| token/file | referenced by | type | risk |
|---|---|---|---|
| `Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | `src/config/rector-docs-registry.ts` | code_reference | Level 1 para B0; Level 2 para full Runtime parcial |
| `Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | `docs/audits/_extract_block0_zip.mjs` | audit_reference | Level 1; helper de auditoria |
| `EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` | `src/config/rector-docs-registry.ts` | code_reference | Level 2; full runtime no completo |
| `Descripción_Operativa_cerebro AI.docx` | `src/features/significado/operational-description-canon.ts` | code_reference | Level 1; source pointer con canon TS embebido |
| `Descripción_Operativa_cerebro AI.docx` | `scripts/extract-docx-text.mjs` | code_reference | Level 1; extractor documental |
| `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx` | `src/config/rector-docs-registry.ts` | code_reference | Level 0/1; antecedente deprecated, no fisico en inventario |
| `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx` | `src/domain/primary-activity-selection-policy.v1.3.ts` | code_reference | Level 1; metadata, TS es autoridad ejecutable |
| `Herramienta de Actividades EVE FULL - V04.xlsx` | `src/services/export/xlsx-template.ts` | code_reference | Level 3 para export template externo; no es runtime rector |

## 4. Documentos con counterpart machine-readable

| officeSource | md | json | ts | tests | runtimeAuthority |
|---|---|---|---|---|---|
| `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | `docs/runtime/block0-machine-readable-contract.md`; `docs/runtime/runtime-40-20-machine-readable-map.md` | `src/features/runtime/block0/block0.catalog.json`; `src/features/runtime/catalog/runtime-40-20.manifest.json` | `src/features/runtime/block0-catalog-snapshot.ts`; `src/services/runtime-block0-catalog-adapter.ts` | `tests/regression/runtime-block0-catalog-adapter.test.ts`; `tests/regression/runtime-block0-machine-readable-contract.test.ts` | true for B0; false for full Runtime |
| `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` | `docs/runtime/runtime-40-20-machine-readable-map.md` | `src/features/runtime/catalog/runtime-40-20.manifest.json` | partial B0 TS only | `tests/regression/runtime-block0-machine-readable-contract.test.ts` | false for full Runtime |
| `docs/significado/canon/Descripción_Operativa_cerebro AI.docx` | `docs/significado/canon/operational-description-brain.md` | none | `src/features/significado/operational-description-canon.ts`; related operational-description coach modules | operational-description regression tests exist | true for TS canon behavior, not registered |

## 5. Documentos sin counterpart

| officeSource | domain | why it matters | recommended action |
|---|---|---|---|
| None among physical Office files | - | Every physical Office doc has at least MD/TS or JSON/manifest coverage | Keep auditing as new Office files are added |

Gaps no fisicos pero referenciados:

| officeSource | domain | why it matters | recommended action |
|---|---|---|---|
| `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx` | primary_activity_selection | Referenciado en registry como deprecated/editorial, pero no existe fisicamente en este inventario | Keep as deprecated editorial antecedent only |
| `Herramienta de Actividades EVE FULL - V04.xlsx` | export | Referencia operativa externa para plantilla export; no es cerebro runtime | Document as export template dependency, outside runtime authority |

## 6. Riesgos detectados

### Seleccion primaria

El cerebro actual queda confirmado como TS v1.3. El XLSX v1.2 no aparece como archivo fisico y el registry lo marca como antecedente deprecated. Riesgo bajo.

### Runtime 40/20

Los dos documentos Office Runtime existen fisicamente. B0 tiene JSON/TS/tests. El Runtime completo sigue parcial; riesgo Level 2 si alguien interpreta los Office como catalogo completo vigente.

### Block0

B0 tiene snapshot TS, JSON y validador. El adapter actual no lee XLSX. Riesgo bajo.

### WorkMap

No se encontro Office fisico de WorkMap en repo. Hay referencias documentales a plantillas de export, no autoridad runtime.

### Significado

`Descripción_Operativa_cerebro AI.docx` esta fisico, con MD y TS canon. Falta registrarlo en `rector-docs-registry.ts`. Riesgo Level 1.

### Auditorias

Hay referencias historicas donde auditorias anteriores llaman "fuente implementable" a XLSX/DOCX. Quedan mitigadas por la estrategia machine-readable y registry nuevos, pero conviene agregar notas deprecated cuando se editen esas auditorias.

### Desconocidos

Hay referencias a documentos Office externos en fixtures, scripts y docs. No son archivos Office fisicos dentro de la repo, pero deben permanecer fuera de autoridad runtime.

## 7. Hallazgos sobre seleccion primaria v1.3

Confirmado: la fuente ejecutable vigente es `src/domain/primary-activity-selection-policy.v1.3.ts`, consumida por `src/services/primary-activity-selector.ts`.

Tests vigentes pasan:

- `tests/regression/primary-activity-selection-policy.test.ts` -> PASS 12/12

No se encontro import/read/parse del XLSX v1.2 en runtime.

## 8. Hallazgos sobre Runtime 40/20

Machine-readable actual:

- B0 snapshot TS: `src/features/runtime/block0-catalog-snapshot.ts`
- B0 adapter: `src/services/runtime-block0-catalog-adapter.ts`
- B0 JSON: `src/features/runtime/block0/block0.catalog.json`
- B0 validator: `src/features/runtime/block0/block0.catalog.validator.ts`
- Manifest parcial: `src/features/runtime/catalog/runtime-40-20.manifest.json`

Sigue editorial/parcial:

- full Runtime 40/20
- B0.5
- B1-B7
- causales 20
- budget/readiness/branching

## 9. Hallazgos sobre B0

B0 tiene counterpart JSON/TS y pruebas. El adapter puede seguir usando snapshot TS; no hay lectura runtime directa de XLSX.

Tests vigentes pasan:

- `tests/regression/runtime-block0-machine-readable-contract.test.ts` -> PASS 8/8

## 10. Recomendaciones

| office doc | recommendation |
|---|---|
| `Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx` | keep editorial; remove runtime authority claim for full Runtime; continue JSON/TS migration block by block |
| `EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx` | keep editorial; create MD canonical sections as blocks migrate |
| `Descripción_Operativa_cerebro AI.docx` | keep editorial; add registry entry for Significado operational description canon |
| `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx` | keep deprecated; do not restore as runtime source |
| `Herramienta de Actividades EVE FULL - V04.xlsx` | investigate/export-govern separately; not part of runtime authority sweep |
