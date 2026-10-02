# CODEX R4 Criteria Semantic Alignment Audit

Fecha: 2026-07-23

## Fuentes leídas

- `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`
- `docs/eve/panel-control/RECTOR_R4_ACCEPTANCE_BASELINE.md`
- `docs/eve/panel-control/RECTOR_R4_TEST_IMPLEMENTATION.md`
- `docs/eve/panel-control/RECTOR_R4_PRODUCTION_READINESS.md`
- `docs/eve/panel-control/RECTOR_R4_DICTAMEN.md`
- `docs/eve/panel-control/RECTOR_R5_FULL_TRACEABILITY_MATRIX.md`
- `docs/eve/panel-control/RECTOR_R5_FINAL_CLOSURE_REPORT.md`
- `docs/eve/panel-control/RECTOR_R5_DICTAMEN.md`
- `docs/eve/panel-control/RECTOR_POINTS_18_25_GAP_MATRIX.md`
- `docs/eve/panel-control/RECTOR_POINTS_18_25_IMPLEMENTATION_PLAN.md`
- `docs/eve/panel-control/RECTOR_POINTS_18_25_STATUS_DICTAMEN.md`

Documento excluido: `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`.

## Hallazgo inicial

Los 19 criterios R4 estaban duplicados como literales manuales en `tests/e2e/r4-criteria-definitions.ts` y `scripts/eve/official-control-panel/r4/collect-r4-criteria-evidence.mjs`. Esa duplicación permitía pruebas nominales por ID aunque el texto rector, acentos, orden y obligaciones semánticas divergieran.

## Corrección semántica

- `RECTOR_R4_ACCEPTANCE_BASELINE.md` ahora contiene una tabla literal parseable para CP-001...CP-013, UX-001...UX-004, SEC-001 y A11Y-001.
- `generate-r4-criteria-from-baseline.mjs` genera el JSON técnico y el TS usado por Playwright.
- El recolector consume el JSON generado y emite manifiestos con `literalText`, `literalTextSha256`, `semanticObligations`, assertions positivas/negativas, evidencia UI/backend/DB, hashes y checkpoint.
- El verificador recalcula el baseline y corta si hay mismatches literales, obligaciones ausentes, pruebas solo nominales, evidencia artificial única o pruebas semánticas faltantes.

## Pruebas reforzadas

- CP-002 valida X sin Y y Y sin X en direcciones separadas.
- CP-006 exige prueba de estado factual y aceptación auditada para trabajo manual.
- CP-012 prueba conformance antes de consistency y bloqueo de resolución prematura.
- UX-001 entra a la vista oficial de journeys y valida checkpoints visibles reales.
- SEC-001 combina BFF autorizado/denegado con scan de frontend sin `service_role` ni DB directa ejecutable.
- A11Y-001 audita DOM productivo en tres anchos y mantiene negativo controlado.

## Defecto real corregido

A11Y-001 detectó estados productivos sin indicador accesible. Se agregaron indicadores `aria-hidden` en estados compartidos de carga, vacío, selección, KPI y trabajo manual. No se modificaron contratos, permisos ni datos.

## Resultado

- Playwright R4: 39/39 PASS.
- Recolector R4: 19/19 manifests PASS.
- Verificador R4: `ok=true`.
- `criteriaLiteralMismatches=0`.
- `criteriaMissingSemanticObligations=0`.
- `criteriaPositiveAssertionGaps=0`.
- `criteriaNegativeAssertionGaps=0`.
- `criteriaTestsOnlyMatchingByName=0`.
- `criteriaUsingArtificialDomAsOnlyEvidence=0`.
- `criteriaMissingBackendProof=0`.
- `criteriaMissingUiProof=0`.
- `criteriaMissingSecurityBundleScan=0`.
- `criteriaMissingExactArtifactAcceptanceProof=0`.
- `criteriaMissingConformanceBeforeConsistencyProof=0`.
- `criteriaSemanticGaps=0`.
