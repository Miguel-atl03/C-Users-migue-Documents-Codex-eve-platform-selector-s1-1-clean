# RECTOR R4 - Acceptance Criteria Matrix

Fecha: 2026-07-22

Fuente de resultados:

- Runner real: `reports/p9a-playwright-report.json`
- Manifests por criterio: `reports/local/rector-r4-acceptance/criteria/<ID>.json`
- Verificador: `scripts/eve/official-control-panel/r4/verify-r4-fixtures-and-acceptance.mjs`
- Diagnostico: `reports/local/rector-r4-acceptance/diagnostics/verify-summary.json`

| Criterio | Fixture(s) | Positivo ejecutado | Negativo ejecutado | Manifest | Estado |
|---|---|---|---|---|---|
| CP-001 | FX-01 | `CP-001-POS` | `CP-001-NEG` | `criteria/CP-001.json` | PASS |
| CP-002 | FX-01 | `CP-002-POS` | `CP-002-NEG` | `criteria/CP-002.json` | PASS |
| CP-003 | FX-01 | `CP-003-POS` | `CP-003-NEG` | `criteria/CP-003.json` | PASS |
| CP-004 | FX-01 | `CP-004-POS` | `CP-004-NEG` | `criteria/CP-004.json` | PASS |
| CP-005 | FX-08 | `CP-005-POS` | `CP-005-NEG` | `criteria/CP-005.json` | PASS |
| CP-006 | FX-08 | `CP-006-POS` | `CP-006-NEG` | `criteria/CP-006.json` | PASS |
| CP-007 | FX-02 | `CP-007-POS` | `CP-007-NEG` | `criteria/CP-007.json` | PASS |
| CP-008 | FX-02 | `CP-008-POS` | `CP-008-NEG` | `criteria/CP-008.json` | PASS |
| CP-009 | FX-04 | `CP-009-POS` | `CP-009-NEG` | `criteria/CP-009.json` | PASS |
| CP-010 | FX-07 | `CP-010-POS` | `CP-010-NEG` | `criteria/CP-010.json` | PASS |
| CP-011 | FX-05 | `CP-011-POS` | `CP-011-NEG` | `criteria/CP-011.json` | PASS |
| CP-012 | FX-09 | `CP-012-PHYSICAL` | `CP-012-PHYSICAL` | `criteria/CP-012.json` | BLOQUEADO |
| CP-013 | FX-10 | `CP-013-POS` | `CP-013-NEG` | `criteria/CP-013.json` | PASS |
| UX-001 | FX-11 | `UX-001-POS` | `UX-001-NEG` | `criteria/UX-001.json` | PASS |
| UX-002 | FX-11 | `UX-002-POS` | `UX-002-NEG` | `criteria/UX-002.json` | PASS |
| UX-003 | FX-11 | `UX-003-POS` | `UX-003-NEG` | `criteria/UX-003.json` | PASS |
| UX-004 | FX-11 | `UX-004-POS` | `UX-004-NEG` | `criteria/UX-004.json` | PASS |
| SEC-001 | FX-01, FX-11 | `SEC-001-POS` | `SEC-001-NEG` | `criteria/SEC-001.json` | PASS |
| A11Y-001 | FX-01 | `A11Y-001-POS` | `A11Y-001-NEG` | `criteria/A11Y-001.json` | PASS |

Resultado del verificador R4: `ok=true`.

Metricas criticas: `criteriaPositiveExecuted=19`, `criteriaNegativeExecuted=19`, `criteriaPositiveFailed=0`, `criteriaNegativeFailed=0`, `criteriaSkipped=0`, `criteriaWithSyntheticTestIds=0`, `criteriaSharingPositiveNegativeResult=0`, `criteriaWithoutEvidence=0`, `criteriaContradictingMatrix=0`, `criteriaFalsePasses=0`, `fixturesFlowNotExecuted=0`, `screenshotsWithLoading=0`, `screenshotsWithFatal=0`, `screenshotsMissing=0`, `crossCompanyLeaks=0`, `crossCaseLeaks=0`, `amberProductMutations=0`.

No quedan resultados positivos/negativos fabricados ni compartidos.

## CP-012 Bloqueo Factual

Fecha: 2026-07-23

Evidencia primaria: `reports/local/rector-r4-r5-physical/CP-012-PHYSICAL/`.

CP-012 queda corregido para no fabricar evaluaciones MMABP. El navegador envia solo intencion (`packageId`, `assessmentAction`, `expectedPackageVersion`, `expectedAssessmentVersion`, `idempotencyKey`), pero la RPC oficial devuelve `parallel_assessment_producer_unavailable` porque no existe todavia el productor factual canonico.

La prueba fisica debe confirmar: `runner.ok=true`, `runnerStatus=passed`, `stalePackageRejected=true`, `realProducerAvailable=false`, `fakeProducerNotUsed=true`, `mutationProbesRejected=true`, `noReportsCreated=true`, `noAssessmentEventsCreated=true`, `acaPromotedWithoutAllExistingGates=0`, `exportEnabledWithoutExistingGates=0`, `directServiceRoleDmlGrants=0`, `historyMutationFailures=0`, `uiFlowNotExecuted=0`, `devOverlayPresent=0`.

Verificador material R4/R5: `scripts/eve/official-control-panel/r4/verify-r4-r5-nine-physical-proofs.mjs` debe bloquear promocion con `CP012RealProducerMissing=1`.
