# EVE04 Candidate Filename Normalization

## Dictamen

CANDIDATE_FILENAMES_NORMALIZED

## Manifest

MANIFEST_ALIAS_CONTENT_RETAINED_WITH_PATCH_METADATA

El manifest estricto fue copiado desde el alias existente. Conserva metadata de candidato/patch y no se edito contenido interno porque no contiene un campo explicito de filename/artifact_name que bloquee la identificacion del candidato.

## Alias encontrados

- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.manifest.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.xlsx
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.ts
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.md

## Strict files creados

- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.xlsx
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.ts
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.md

## Alias preservados

true

## Validacion

- B6-Q38: true
- B6_6_8: true
- trench_phrase: true
- CCOV-001: RESOLVED_IN_CANDIDATE
- CVAR-001: OPEN_PENDING_SOURCE_GAP
- certification: NOT_CERTIFIED
- readiness: READY_WITH_FLAGS

## Archivos creados/modificados

- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.xlsx
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.ts
- docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.md
- tests/regression/eve-04-runtime-catalog-candidate-filenames.test.ts
- docs/audits/EVE04_CANDIDATE_FILENAME_NORMALIZATION.md
- docs/audits/_eve04_candidate_filename_normalization.json

## Comandos y exit codes

- pwd: exit 0; C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion-significado-clean-clone\external-consumers\eve-platform
- git status --short: exit 0; completed; workspace has pre-existing dirty/untracked files
- git diff --name-only: exit 0; completed; showed pre-existing src/product diffs
- git ls-files --others --exclude-standard: exit 0; completed; showed many untracked docs/chips/tests including this task artifacts
- node --test tests/regression/eve-04-runtime-catalog-candidate-filenames.test.ts: exit 0; PASS 5/5
- node --test tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts: exit 1; FAIL 1/11; obsolete pre-normalization expectation asserts strict candidate manifest/json must be absent

## No contaminacion

- producto tocado: false
- chip activo tocado: false
- docs/runtime tocado: false
- package tocado: false
- src/app tocado por esta tarea: false
- shadow conectado: false
- runtimeAuthority: false

## Nota sobre shadow preflight

El test existente `tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts` fallo porque todavia afirma que los nombres estrictos deben estar ausentes. Esa expectativa era valida antes de esta normalizacion y queda obsoleta despues de crear los strict files. No se modifico ese test porque no estaba en la allowlist.

## Siguiente paso recomendado

RETRY_SHADOW_PREFLIGHT
