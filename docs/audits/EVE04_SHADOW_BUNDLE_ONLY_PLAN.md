# EVE04 SHADOW BUNDLE ONLY PLAN

## 1. Dictamen

EVE04_SHADOW_BUNDLE_ONLY_READY

## 2. Fuente

- source triage: `docs/audits/_eve04_untracked_non_eve04_triage.json`
- source bucket: `EVE04_ALLOWLIST`
- source bucket count: 51

## 3. Regla de bundle estricto

El bundle solo incluye rutas que coinciden con:

- `src/services/eve-04-runtime-catalog-shadow-service.ts`
- `tests/regression/eve-04-runtime-catalog-*.test.ts`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/**`
- `docs/audits/EVE04_*`
- `docs/audits/_eve04_*`
- `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_*`
- `docs/audits/_eve_runtime_catalog_surgical_patch_01_*`

## 4. Exclusiones aplicadas

Se excluyen del bundle estricto 6 archivos del active `EVE_04_Runtime_Catalog_v0_1`, aunque venian en el bucket EVE04_ALLOWLIST anterior, porque la regla actual no permite incluir el active v0.1:

- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.docx`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.md`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.ts`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.xlsx`

## 5. Bundle filelist

El bundle estricto contiene 45 archivos EVE04 permitidos:

| path | inclusion reason |
| --- | --- |
| `docs/audits/EVE04_CANDIDATE_FILENAME_NORMALIZATION.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_PAGE_TSX_GIT_BLOCKER_TRIAGE.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_PROMOTION_PRECHECK_AFTER_WORKTREE_ISOLATION.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_CANDIDATE_TEST_RECONCILE.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_CONNECTION_SERVICE_ONLY.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_CONNECT_PREFLIGHT.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_CONNECT_PREFLIGHT_RETRY.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_QA_COMPARE.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_QA_COMPARE_TEST_RECONCILE.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE04_SHADOW_QA_GIT_BLOCKER_TRIAGE.md` | `docs/audits/EVE04_*` |
| `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_APPLY_CCOV.md` | `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_*` |
| `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_PREFLIGHT.md` | `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_*` |
| `docs/audits/_eve04_candidate_filename_normalization.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_page_tsx_git_blocker_triage.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_promotion_precheck_after_worktree_isolation.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_candidate_test_reconcile.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_connect_preflight.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_connect_preflight_retry.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_connection_service_only.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_qa_compare.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_qa_compare_test_reconcile.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve04_shadow_qa_git_blocker_triage.json` | `docs/audits/_eve04_*` |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_candidate_manifest.json` | `docs/audits/_eve_runtime_catalog_surgical_patch_01_*` |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_ccov_mapping_options.json` | `docs/audits/_eve_runtime_catalog_surgical_patch_01_*` |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_cvar_matrix.json` | `docs/audits/_eve_runtime_catalog_surgical_patch_01_*` |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_patch_diff.json` | `docs/audits/_eve_runtime_catalog_surgical_patch_01_*` |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_source_matrix.json` | `docs/audits/_eve_runtime_catalog_surgical_patch_01_*` |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.docx` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.json` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.manifest.json` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.md` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.ts` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1.xlsx` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.md` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.ts` | candidate folder |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.xlsx` | candidate folder |
| `src/services/eve-04-runtime-catalog-shadow-service.ts` | shadow service |
| `tests/regression/eve-04-runtime-catalog-candidate-filenames.test.ts` | EVE04 regression test |
| `tests/regression/eve-04-runtime-catalog-ccov-001-patch.test.ts` | EVE04 regression test |
| `tests/regression/eve-04-runtime-catalog-ccov-cvar-preflight.test.ts` | EVE04 regression test |
| `tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts` | EVE04 regression test |
| `tests/regression/eve-04-runtime-catalog-shadow-qa-compare.test.ts` | EVE04 regression test |
| `tests/regression/eve-04-runtime-catalog-shadow-service.test.ts` | EVE04 regression test |

## 6. Validacion

- non EVE04 found: false
- UNKNOWN included: false
- Significado/WorkMap included: false
- docs/architecture included: false
- producto no permitido included: false
- active v0.1 included: false
- candidate only: true
- tests only EVE04 runtime catalog: true
- service only EVE04 shadow service: true
- audits only EVE04/runtime catalog surgical patch: true

## 7. Control files generados

Estos dos archivos son control docs permitidos por el patron `docs/audits/EVE04_*` y `docs/audits/_eve04_*`, pero se registran aparte del bundle operacional de 45 archivos:

- `docs/audits/EVE04_SHADOW_BUNDLE_ONLY_PLAN.md`
- `docs/audits/_eve04_shadow_bundle_only_filelist.json`
