# EVE04 · Shadow Connection Service Only

## Dictamen

**SHADOW_CONNECTION_SERVICE_READY**

Servicio shadow local creado para cargar, validar y comparar el chip activo EVE04 v0.1 frente al candidato v0.1.1 sin promoción productiva.

**Nota de entorno:** `git status` / `git diff` fallaron con `dubious ownership` (`GIT_CONTEXT_BLOCKED`). La verificación de allowlist por git quedó documentada como gap de entorno; el test de servicio omite esa comprobación cuando git no está disponible.

## Fuentes verificadas

- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json`
- `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json`
- Precedente leído (no modificado): `src/services/eve-03-canonical-catalog-shadow-service.ts`
- Auditorías previas leídas (no modificadas): `EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_APPLY_CCOV.md`, `_eve_runtime_catalog_surgical_patch_01_patch_diff.json`, `EVE04_CANDIDATE_FILENAME_NORMALIZATION.md`, `EVE04_SHADOW_CANDIDATE_TEST_RECONCILE.md`, `EVE04_SHADOW_CONNECT_PREFLIGHT_RETRY.md`

## Servicio creado

- `src/services/eve-04-runtime-catalog-shadow-service.ts`

## Funciones exportadas

1. `loadEve04RuntimeCatalogActive()`
2. `loadEve04RuntimeCatalogCandidate()`
3. `validateEve04RuntimeCatalogCandidateShadow()`
4. `compareEve04RuntimeCatalogActiveVsCandidate()`

## Rutas active / candidate

| Rol | Ruta |
|---|---|
| Active catalog | `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json` |
| Active manifest | `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json` |
| Candidate catalog | `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json` |
| Candidate manifest | `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json` |

## Evidencia shadow

| Campo | Resultado |
|---|---|
| B6-Q38 | presente en candidate |
| B6_6_8 | agregado a B6-Q38 en candidate |
| trench_phrase | agregado a subcampos B6-Q38 en candidate |
| Active intacto | SHA256 sin cambio (`df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0`) |
| runtimeAuthority | false |
| productionPromotion | false |
| diagnosisEnabled | false |
| exportEnabled | false |
| transductionEnabled | false |
| registryEnabled | false |
| parallelProductionEnabled | false |
| CCOV-001 | RESOLVED_IN_CANDIDATE |
| CVAR-001 | OPEN_PENDING_SOURCE_GAP |
| certification | NOT_CERTIFIED |
| readiness | READY_WITH_FLAGS |

## Archivos creados / modificados

- `src/services/eve-04-runtime-catalog-shadow-service.ts` (nuevo)
- `tests/regression/eve-04-runtime-catalog-shadow-service.test.ts` (nuevo)
- `docs/audits/EVE04_SHADOW_CONNECTION_SERVICE_ONLY.md` (nuevo)
- `docs/audits/_eve04_shadow_connection_service_only.json` (nuevo)

## Comandos y exit codes

| Comando | Exit code | Resultado |
|---|---|---|
| `node --test tests/regression/eve-04-runtime-catalog-candidate-filenames.test.ts` | 0 | PASS (5/5) |
| `node --test tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts` | 0 | PASS (11/11) |
| `node --test tests/regression/eve-04-runtime-catalog-shadow-service.test.ts` | 0 | PASS (10/10, git allowlist skipped por GIT_CONTEXT_BLOCKED) |
| `git status --short` | 128 | GIT_CONTEXT_BLOCKED (`dubious ownership`) |

## Riesgos restantes

- Git no verificable en este entorno por `dubious ownership`; conviene revalidar allowlist tras `git config --global --add safe.directory`.
- CVAR-001 sigue abierto con 33 gaps de fuente; el candidato no debe promoverse.
- El servicio shadow no está cableado a UI, APIs, registry ni runtime productivo (por diseño).

## Siguiente paso recomendado

**SHADOW_QA_COMPARE**
