# LOCATE EXACT MOTHER CATALOG FOR CVAR REPAIR

## 1. Dictamen

EXACT_MOTHER_CATALOG_LOCATED

## 2. Ruta exacta recomendada

- full path: `C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform\docs\chips\canonical-catalog\EVE_03_Canonical_Catalog_v0_1\sources\EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`
- relative path: `external-consumers/eve-platform/docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`
- platform relative path: `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`
- file size: `225608`
- last modified: `2026-06-03T06:29:47.441Z`
- sha256: `09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2`
- tracked_or_untracked: `untracked`

## 3. Razon

Esta es la copia exacta que debe enviarse para reparar CVAR-001 desde fuente. Es la unica copia XLSX exacta encontrada en el repo con el nombre `EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`, esta bajo `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/`, y EVE03 la declara como D8 / `primary_canonical_source`.

Tambien esta usada por EVE04 active, EVE04 candidate y las auditorias CVAR/CCOV como Catálogo Madre. No es copia temporal, backup, incoming ni export aislado.

## 4. Copias encontradas

| full_path | relative_path | file_size | tracked_or_untracked | used_by_chip | appears_in_manifest | appears_as_source_path | likely_authoritative |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform\docs\chips\canonical-catalog\EVE_03_Canonical_Catalog_v0_1\sources\EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx` | `external-consumers/eve-platform/docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx` | 225608 | untracked | true | true | true | true |

## 5. Referencias

- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.md:18` declara D8 como fuente primaria canonica.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.manifest.json:38` declara `source_id = D8`.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.manifest.json:39` declara el titulo del XLSX.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.manifest.json:42` conserva `physical_path`.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/03_canonical_catalog/source_documents.json:3` registra D8.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/03_canonical_catalog/source_documents.json:14` registra `Catalogo_Madre_Nodos`.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/03_canonical_catalog/source_target_map.json:96` indica que todos los nodos y codigos runtime existen en D8.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/03_canonical_catalog/source_target_map.json:120` indica que D8 manda en genealogia.
- `tests/regression/eve-03-canonical-catalog-source-contract.test.ts:9` espera el XLSX en la carpeta `sources`.
- `tests/regression/eve-04-runtime-catalog-ccov-cvar-preflight.test.ts:7` usa la misma ruta D8.
- `docs/audits/EVE04_CVAR_001_SOURCE_DECISION_PREFLIGHT.md:15` registra `exists=True`, `readable=True`, size y sha256.
- `docs/audits/_eve04_cvar_001_upstream_recovery_matrix.json` usa esta ruta como `best_source_path` para CVAR.
- `docs/audits/_eve_runtime_catalog_surgical_patch_01_source_matrix.json:5` usa esta ruta como mother source.
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json:33` declara el documento del Catalogo Madre.
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json:33` declara el documento del Catalogo Madre.

## 6. Archivos relacionados no candidatos

Se encontraron extractos, fixtures y reglas historicas de Capa1, pero no son la copia XLSX exacta solicitada para reparacion CVAR-001:

- `evidence/source-extraction/tramo2/Bloque_1_Documento_Madre_Capa1_v2_1_EVE.extracted.txt`
- `evidence/source-extraction/tramo5/Bloque_6_Documento_Madre_Capa1_v2_1_EVE_rev4_reconstruido.extracted.txt`
- `external-consumers/eve-platform/fixtures/Diseno_Formal_Capa1_v2_1_Unificado_question_rows.json`
- `external-consumers/eve-platform/src/rules/question-catalog-v2-1.json`

## 7. Que no se hizo

- no se modifico producto;
- no se modificaron chips;
- no se modifico runtime productivo;
- no se hizo commit;
- no se hizo reset;
- no se hizo stash;
- no se hizo checkout;
- no se hizo git clean.

## 8. Siguiente paso

SEND_THIS_FILE_TO_CHATGPT_FOR_CVAR_REPAIR
