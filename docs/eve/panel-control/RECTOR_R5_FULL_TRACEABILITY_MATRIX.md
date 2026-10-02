# RECTOR R5 - Full Traceability Matrix

Fecha: 2026-07-23

| Regla rectora | Implementación | Fuente factual | Prueba positiva | Prueba negativa | Evidencia | Dictamen |
|---|---|---|---|---|---|---|
| §18 arquitectura front-end oficial | `src/features/official-consultant-control-panel/` | view models BFF | Playwright R4 abre modo Empresa Cliente | legacy no se importa ni reutiliza | capturas FX-01/02 | Conforme |
| §19 BFF y datos | rutas oficiales `cases/[caseId]` | DB/RPC con scope | FX-03/05/06/09/12 | body fixture/WorkMap cliente rechazado | `e2e-r4.json` | Conforme |
| §20 seguridad y auditoría | assignments, capabilities, RLS, ledgers append-only | `auth.uid()` y grants explícitos | SEC-001 y Runtime A/B | cruces A/B, anónimo y sin assignment | evidencia física R3 + verifier R4 | Conforme |
| §20 accesibilidad | foco, drawer, estados ARIA y responsive | DOM productivo | A11Y-001 teclado/retorno de foco | overflow=0 y foco no perdido | criterio A11Y-001 + captura FX-01 | Conforme |
| §21 carga/error/degradación | `screenState`, freshness y soft-refresh | timestamps/requestId BFF | Playwright R3 | stale/fatal/forbidden bloquean mutación | reportes R3 | Conforme |
| §22 fixtures | 12 productores test-only + flujos productivos | manifests FX y estado DB | FX-01...FX-12 | `seedOnlyPass=false` | 12 capturas y hashes | Conforme |
| §22.1 criterios | 19 registros individuales generados desde baseline literal | backend/UI real | CP 13, UX 4, SEC, A11Y | prueba negativa por criterio | `criteria/*.json` + `verify-summary.json` | Conforme |
| §23 fases | R0 -> R1 -> R2 -> R3 -> R4 -> R5 | dictámenes fechados | compuertas R4 verdes | R5 no se abrió con métricas críticas | status §§18-25 | Conforme |
| §24 trazabilidad documental | esta matriz y reportes R1-R5 | archivos/versiones/hashes | cada regla llega a evidencia | verificador detecta contradicciones | `verify-summary.json` | Conforme |
| §25 criterio de cierre | Panel Empresa, usuario/rol, proceso y atención | proyecciones factuales | FX-01/02/05/06/09/11/12 | vacíos no inventan respuesta | sección siguiente | Preparado para revisión |

## Respuestas rectoras §25

1. **Cómo está la Empresa Cliente.** El KPI, workspace y drawer consumen la misma proyección §17. FX-01 demuestra estado evaluado, H0-H2, próximo evento factual y cero alertas; FX-12 demuestra el final alternativo sin sustituirlo por `Cancelled`.
2. **Qué usuario o rol está afectado.** FX-02 conserva dos `role_runtime_session` sin fusión; FX-05 muestra usuario, perfil/sesión y readiness del gap; FX-11 prueba actores A/B autenticados y aislados.
3. **Qué actividad o proceso lo explica.** FX-03/04 vinculan selección versionada; FX-06 muestra la ruta B2 canónica faltante; FX-08 y FX-09 muestran P-SUP-03 y P-SUP-06 con su historial real.
4. **Qué debe resolverse.** FX-05 expone `workmap_coverage_gap`; FX-06 `blocked_by_missing_canonical_route`; FX-09 el finding y la reevaluación; FX-10 el gate ACA; FX-11 la solicitud/acción de soporte. Todos tienen negativo y readback.

Las respuestas se limitan a evidencia disponible. Cuando la fuente no está evaluada, la UI presenta vacío o estado incompleto y no fabrica una conclusión.

## Evidencia R5 regenerada

- Trazabilidad fila por fila: `reports/local/rector-r5-final/R5_TRACEABILITY_ROWS.json`
- Índice material R4/R5: `reports/local/rector-r4-r5-final/MATERIAL_SUPPORT_INDEX.md`
- Manifiesto material R4/R5: `reports/local/rector-r4-r5-final/MATERIAL_SUPPORT_MANIFEST.json`
- Q1 Empresa Cliente: `reports/local/rector-r5-final/R5-Q1.json`
- Q2 Usuario o rol afectado: `reports/local/rector-r5-final/R5-Q2.json`
- Q3 Actividad o proceso explicativo: `reports/local/rector-r5-final/R5-Q3.json`
- Q4 Qué debe resolverse: `reports/local/rector-r5-final/R5-Q4.json`
## CP-012 Trazabilidad Productiva

CP-012 queda soportado por evidencia primaria en `reports/local/rector-r4-r5-physical/CP-012-PHYSICAL/`: `runner-result.json`, `http-transcript.json`, `database-before.json`, `database-after.json`, `event-ledger.json`, `product-action-audit.json`, `idempotency-ledger.json`, `conformance-report.json`, `consistency-report.json`, `aca-before-after.json`, `export-gate-before-after.json`, `dom-snapshot.html`, `screenshot.png`, `migration-head.json` y `hashes.json`.

La cadena trazada es: UI oficial -> BFF `parallel-production` -> RPC `eve_apply_parallel_assessment_action_as_consultant` -> productor de conformidad -> ledger/auditoria -> productor de consistencia -> readback. La prueba negativa cubre consistencia prematura, stale package, conflicto idempotente y no promocion ACA/export.
