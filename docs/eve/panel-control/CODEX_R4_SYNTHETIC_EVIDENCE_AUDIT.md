# CODEX R4 Synthetic Evidence Audit

Fecha: 2026-07-22

## Contexto confirmado

- Diseno rector leido: `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`.
- Plan R0-R5 leido: `RECTOR_POINTS_18_25_GAP_MATRIX.md`, `RECTOR_POINTS_18_25_IMPLEMENTATION_PLAN.md`, `RECTOR_POINTS_18_25_STATUS_DICTAMEN.md`.
- Baseline literal R4 leido: `RECTOR_R4_ACCEPTANCE_BASELINE.md`.
- Estado R1-R3 leido: `RECTOR_R1_*`, `RECTOR_R2_*`, `RECTOR_R3_*`, `R3_*`.
- Documento Runtime v2 excluido.

## Hallazgos del falso positivo

Archivo auditado:
`tests/e2e/official-consultant-control-panel-rector-r4-acceptance.spec.ts`

- Existe un unico test Playwright global: `productive BFF/RPC transitions + 12 capturas`.
- No existen titulos literales `CP-001-POS`, `CP-001-NEG`, ..., `A11Y-001-POS`, `A11Y-001-NEG`.
- `buildCriteriaEvidence()` fabrica `testId`, `positiveTestId` y `negativeTestId` mediante interpolacion de strings.
- `positivePassed` y `negativePassed` usan el mismo booleano `passed`.
- Una captura y un fixture ejecutado sustituyen la prueba funcional individual del criterio.
- El `evidenceHash` se calcula sobre el objeto fabricado, no sobre un resultado real del runner.

Archivo auditado:
`scripts/eve/official-control-panel/r4/verify-r4-fixtures-and-acceptance.mjs`

- El verificador lee `reports/local/rector-r4-acceptance/results/e2e-r4.json`, no el JSON reporter real de Playwright.
- Para criterios, solo valida presencia de campos, booleanos `true` y hash con forma SHA-256.
- No cruza `positiveTestId` ni `negativeTestId` contra titulos existentes en el runner.
- No distingue prueba skipped de prueba passed.
- No detecta que positivo y negativo comparten el mismo resultado fabricado.
- La matriz R4 declara PASS y contradice la evidencia real disponible.

## Auditoria por criterio

| Criterio | Test afirmado | Test realmente existente | Positivo real | Negativo real | Evidencia real | Falso positivo | Correccion necesaria |
|---|---|---|---|---|---|---|---|
| CP-001 | `r4-cp-001-positive` / `r4-cp-001-negative` | unico test global R4 | No individual | No individual | captura FX-01 + transicion FX | Si | Crear `CP-001-POS` y `CP-001-NEG` reales |
| CP-002 | `r4-cp-002-positive` / `r4-cp-002-negative` | unico test global R4 | No individual | No individual | captura FX-01 + transicion FX | Si | Crear `CP-002-POS` y `CP-002-NEG` reales |
| CP-003 | `r4-cp-003-positive` / `r4-cp-003-negative` | unico test global R4 | No individual | No individual | captura FX-01 + transicion FX | Si | Crear `CP-003-POS` y `CP-003-NEG` reales |
| CP-004 | `r4-cp-004-positive` / `r4-cp-004-negative` | unico test global R4 | No individual | No individual | captura FX-01 + transicion FX | Si | Crear `CP-004-POS` y `CP-004-NEG` reales |
| CP-005 | `r4-cp-005-positive` / `r4-cp-005-negative` | unico test global R4 | No individual | No individual | captura FX-08 + transicion FX | Si | Crear `CP-005-POS` y `CP-005-NEG` reales |
| CP-006 | `r4-cp-006-positive` / `r4-cp-006-negative` | unico test global R4 | No individual | No individual | captura FX-08 + transicion FX | Si | Crear `CP-006-POS` y `CP-006-NEG` reales |
| CP-007 | `r4-cp-007-positive` / `r4-cp-007-negative` | unico test global R4 | No individual | No individual | captura FX-02 + transicion FX | Si | Crear `CP-007-POS` y `CP-007-NEG` reales |
| CP-008 | `r4-cp-008-positive` / `r4-cp-008-negative` | unico test global R4 | No individual | No individual | captura FX-02 + transicion FX | Si | Crear `CP-008-POS` y `CP-008-NEG` reales |
| CP-009 | `r4-cp-009-positive` / `r4-cp-009-negative` | unico test global R4 | No individual | No individual | captura FX-04 + transicion FX | Si | Crear `CP-009-POS` y `CP-009-NEG` reales |
| CP-010 | `r4-cp-010-positive` / `r4-cp-010-negative` | unico test global R4 | No individual | No individual | captura FX-07 + transicion FX | Si | Crear `CP-010-POS` y `CP-010-NEG` reales |
| CP-011 | `r4-cp-011-positive` / `r4-cp-011-negative` | unico test global R4 | No individual | No individual | captura FX-05 + transicion FX | Si | Crear `CP-011-POS` y `CP-011-NEG` reales |
| CP-012 | `r4-cp-012-positive` / `r4-cp-012-negative` | unico test global R4 | No individual | No individual | captura FX-09 + transicion FX | Si | Crear `CP-012-POS` y `CP-012-NEG` reales |
| CP-013 | `r4-cp-013-positive` / `r4-cp-013-negative` | unico test global R4 | No individual | No individual | captura FX-10 + transicion FX | Si | Crear `CP-013-POS` y `CP-013-NEG` reales |
| UX-001 | `r4-ux-001-positive` / `r4-ux-001-negative` | unico test global R4 | No individual | No individual | captura FX-11 + transicion FX | Si | Crear `UX-001-POS` y `UX-001-NEG` reales |
| UX-002 | `r4-ux-002-positive` / `r4-ux-002-negative` | unico test global R4 | No individual | No individual | captura FX-11 + transicion FX | Si | Crear `UX-002-POS` y `UX-002-NEG` reales |
| UX-003 | `r4-ux-003-positive` / `r4-ux-003-negative` | unico test global R4 | No individual | No individual | captura FX-11 + transicion FX | Si | Crear `UX-003-POS` y `UX-003-NEG` reales |
| UX-004 | `r4-ux-004-positive` / `r4-ux-004-negative` | unico test global R4 | No individual | No individual | captura FX-11 + transicion FX | Si | Crear `UX-004-POS` y `UX-004-NEG` reales |
| SEC-001 | `r4-sec-001-positive` / `r4-sec-001-negative` | unico test global R4 | No individual | No individual | `security.crossCaseDenied`/`crossCompanyDenied` agregado | Si | Crear `SEC-001-POS` y `SEC-001-NEG` con identidades reales |
| A11Y-001 | `r4-a11y-001-positive` / `r4-a11y-001-negative` | unico test global R4 | No individual | No individual | tres booleanos agregados + captura FX-01 | Si | Crear `A11Y-001-POS` y `A11Y-001-NEG` con pruebas DOM reales |

## Decision

R4 queda bloqueado hasta reemplazar `buildCriteriaEvidence()` por recoleccion
desde resultados reales del runner y hasta materializar 38 resultados
individuales identificables.
