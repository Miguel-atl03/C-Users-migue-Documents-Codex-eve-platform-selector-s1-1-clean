# RECTOR R4 - Acceptance Baseline (§22 / §22.1)

Fecha de cierre factual: 2026-07-22

Fuente rectora única: `corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`, §§22-22.1. El documento Runtime v2 queda expresamente excluido.

## Baseline cerrada

| Fixture | Regla literal resumida | Flujo que demuestra el cierre | Estado |
|---|---|---|---|
| FX-01 | Empresa saludable | fuentes evaluadas, H0-H2, próximo evento y cero alertas coherentes en Panel | PASS DEMOSTRADO |
| FX-02 | Usuario multirrol | usuario físico, dos `role_runtime_session`, sesiones y actividades no fusionadas | PASS DEMOSTRADO |
| FX-03 | Selección <=8 | snapshot factual server-side -> POST autenticado -> RPC -> versión/readback | PASS DEMOSTRADO |
| FX-04 | Más de 8 elegibles | política competitiva; intento de publicar >8 seleccionadas se rechaza sin mutación | PASS DEMOSTRADO |
| FX-05 | WorkMap coverage gap | `workmap_coverage_gap` factual -> BFF Atención -> usuario/rol/readiness/UI | PASS DEMOSTRADO |
| FX-06 | Ruta B2 faltante | `transformation_exception_route_unresolved` -> `blocked_by_missing_canonical_route` | PASS DEMOSTRADO |
| FX-07 | Feedback B3 | usuario operativo autenticado registra `receiver_feedback`; C09 permanece separada de satisfacción | PASS DEMOSTRADO |
| FX-08 | P-SUP-03 manual | descarga -> inicio -> adjunto -> revisión -> aceptación por BFF/RPC | PASS DEMOSTRADO |
| FX-09 | Rework P-SUP-06 | finding -> rework -> reevaluación iniciada/completada -> resolución; resolución prematura 422 | PASS DEMOSTRADO |
| FX-10 | Export bloqueado | intento autenticado real -> 409 `parallel_export_blocked_aca_not_satisfied` -> cero mutación | PASS DEMOSTRADO |
| FX-11 | Experiencia con soporte | Runtime real A/B -> `support_requested` -> consultor -> mensaje -> auditoría/readback | PASS DEMOSTRADO |
| FX-12 | Final alternativo | evento autenticado -> `ClosedWithoutSufficiency` -> motivo -> KPI/Eje Y/drawer | PASS DEMOSTRADO |

## Criterios §22.1

<!-- R4_CRITERIA_LITERAL_BASELINE_START -->
| ID | Seccion rectora | Texto literal | Obligaciones semanticas | Fixtures |
|---|---|---|---|---|
| CP-001 | §22.1 | Abre en Empresa Cliente | El modo Empresa Cliente es la entrada oficial; el panel no declara otro modo como default; la evidencia usa UI productiva autenticada | FX-01 |
| CP-002 | §22.1 | X sin Y; Y sin X | El eje X funciona sin acoplarse al eje Y; el eje Y funciona sin acoplarse al eje X; la prueba valida ambas direcciones | FX-01 |
| CP-003 | §22.1 | Intersección no inventa dependencia | La intersección X/Y muestra solo relación factual; no infiere causalidad sin fuente; la prueba negativa busca dependencia fabricada | FX-01 |
| CP-004 | §22.1 | P-SUP-01 visible | P-SUP-01 aparece como proceso soporte factual; no se sustituye por un proceso inventado; existe prueba UI y backend | FX-01 |
| CP-005 | §22.1 | P-SUP-03/04/05 badge MANUAL | Los procesos P-SUP-03, P-SUP-04 y P-SUP-05 conservan badge MANUAL; no se declaran automáticos por omisión | FX-08 |
| CP-006 | §22.1 | Sin alcanzado sin aceptación auditada | Ningún output manual aparece como alcanzado sin aceptación auditada; la aceptación se prueba por artefacto exacto y estado factual | FX-08 |
| CP-007 | §22.1 | Jerarquía user→rol→actividad | La navegación respeta usuario, rol funcional y actividad; el acceso anónimo queda denegado | FX-02 |
| CP-008 | §22.1 | No fusionar usuarios y roles | Usuarios y roles funcionales mantienen sesiones y payloads separados; la prueba negativa demuestra que no se mezclan | FX-02 |
| CP-009 | §22.1 | No primarias visibles como contexto | Las actividades no primarias siguen visibles como contexto; publicar más de ocho primarias se rechaza sin mutación | FX-04 |
| CP-010 | §22.1 | B0.5 y B1..B7 individuales | B0.5 y cada bloque B1 a B7 aparecen individualmente; no se colapsan en una barra única | FX-07 |
| CP-011 | §22.1 | Readiness prevalece sobre % | El estado readiness gobierna la lectura aunque exista porcentaje; un 100% aislado no declara listo | FX-05 |
| CP-012 | §22.1 | Conformance antes consistency | P-SUP-07/08 ejecuta conformance antes de consistency; la consistencia prematura queda bloqueada | FX-09 |
| CP-013 | §22.1 | P-SUP-09 bloqueado si ACA no Satisfied | P-SUP-09 no exporta ni muta si ACA no está Satisfied; el bloqueo conserva evidencia y cero mutación | FX-10 |
| UX-001 | §22.1 | Trayectoria pantallas visibles/checkpoints | La trayectoria muestra pantallas visibles y checkpoints esperados; la evidencia cubre login, panel, Estado A, WorkMap, Significado y cierre | FX-11 |
| UX-002 | §22.1 | Soporte sin editar respuestas | El usuario recibe soporte sin que el consultor edite respuestas de producto; la acción queda separada de respuestas | FX-11 |
| UX-003 | §22.1 | Intervención exige capability + audit_ref | Toda intervención requiere capability explícita y audit_ref; sin grant válido no hay acción | FX-11 |
| UX-004 | §22.1 | Tiempo/abandono ≠ diagnóstico | Tiempo o abandono se muestran como señales operativas; no se convierten en diagnóstico automático | FX-11 |
| SEC-001 | §22.1 | Frontend sin service_role ni DB directa | El frontend no contiene service_role ni acceso directo a DB; las operaciones productivas pasan por BFF/RPC autorizados | FX-01, FX-11 |
| A11Y-001 | §22.1 | Estados con texto e icono | Los estados visibles tienen texto e icono/indicador accesible; la prueba usa DOM productivo y negativo controlado | FX-01 |
<!-- R4_CRITERIA_LITERAL_BASELINE_END -->

- CP-001...CP-013: 13/13 registros individuales PASS.
- UX-001...UX-004: 4/4 registros individuales PASS.
- SEC-001: PASS con identidades y cruces reales.
- A11Y-001: PASS con teclado, foco, Escape, retorno de foco y tres anchos.

Cada registro contiene `criterionId`, prueba positiva, prueba negativa, obligaciones semánticas, prueba backend/UI, SHA-256 literal y hash del runner en `reports/local/rector-r4-acceptance/criteria/`.

## Fronteras

- Los seeds son precondiciones test-only y no producen por sí mismos un PASS.
- El BFF no acepta rutas ni contenido de fixtures ni WorkMap aportado por el navegador.
- Amber termina con cero eventos y cero acciones de producto.
- R4 autoriza preparación de R5 documental; no constituye despliegue.
