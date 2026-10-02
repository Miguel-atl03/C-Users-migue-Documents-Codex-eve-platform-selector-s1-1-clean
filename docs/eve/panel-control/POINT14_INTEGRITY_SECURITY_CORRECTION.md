# Point 14 — Integrity / security / factual closure correction

Corrige Ola 2 §14 **sin editar** migraciones aplicadas (`20260718030000`, `20260718040000`).

## Migraciones correctivas nuevas

| Versión | Archivo | Contenido |
|---------|---------|-----------|
| `20260718050000` | `eve_point14_reevaluation_append_only_fix.sql` | Separación `reevaluation_started` ≠ `reevaluation_completed`; append-only estricto; RPC findings con resultado factual |
| `20260718060000` | `eve_point14_factual_qa_export_closure.sql` | QA/export exigen cierre factual de findings |

## 1. Reevaluación iniciada vs completada

| Evento / estado | Puede registrar | No puede |
|-----------------|-----------------|----------|
| `reevaluation_started` | inicio, actor, fecha, paquete/versión, finding | marcar `reevaluation_completed=true`; cerrar finding; habilitar `resolved`; declarar QA satisfecha |
| `reevaluation_completed` | resultado (`satisfactory`\|`unsatisfactory`), refs de resultado/evaluación, actor, timestamp, evidencia | omitirse para llegar a `resolved` |

Transición autorizada a `resolved` **solo** desde `reevaluation_completed` con resultado `satisfactory` y refs vigentes en el mismo finding/paquete/caso.

**Prohibido:** `reevaluation_started` → `resolved`.

## 2. Historial estrictamente append-only

Triggers independientes del gate RPC / GUC:

- `prevent_parallel_production_event_mutation` (`aaa_prevent_pp_package_event_mutation`)
- `prevent_qa_finding_event_mutation` (`aaa_prevent_pp_finding_event_mutation`)
- `eve_pp_forbid_truncate` (TRUNCATE)

Rechazan **siempre** UPDATE / DELETE / TRUNCATE, incluso con `eve.pp_rpc=1` o `service_role`.

Las RPC **solo INSERTAN** eventos nuevos. Corrección histórica = evento compensatorio (`finding_reopened`, etc.), nunca mutación del original.

## 3. Verificador — métricas reales

`verify-point14-parallel-production-integrity.mjs` calcula:

- `invalidPackageTransitions` / `invalidFindingTransitions` (tripletes vs catálogo)
- `packageHistoryDiscontinuities` / `findingHistoryDiscontinuities` (`after[n] = before[n+1]`)
- `packageCurrentStateMismatches` / `findingCurrentStateMismatches`
- `resolvedWithoutCompletedReevaluation` (`reevaluation_started` **no** cuenta)
- `eventHistoryMutations` (sonda activa UPDATE/DELETE/TRUNCATE **con** GUC RPC)
- `crossPackageFindingEvents` / `crossCaseEvents` / `crossCompanyEvents`
- `permissivePolicies` / `serviceRoleDirectDmlGrants`
- Amber vacío

## 4. QA y exportación

`eve_pp_finding_factually_resolved` + trigger `trg_pp_package_factual_closure`:

- `satisfied` / `export_eligible` rechazados si existe finding sin cierre factual
- B3 / B7 siguen bloqueando exportación

## 5. Rollback no destructivo

Tras `rollback-point14-parallel-production-preserve-data.sql`:

| Operación | Resultado |
|-----------|-----------|
| RPC de escritura | rechazada (`writes_disabled` / sin EXECUTE) |
| DML directo | rechazado |
| UPDATE/DELETE/TRUNCATE eventos | rechazado (append-only activo) |
| SELECT autorizado | disponible |
| Historial | intacto |

Reaplicación (`reapply-point14-parallel-production-writes.sql`) restaura **solo** EXECUTE sobre RPCs gobernadas.

## 6. Pruebas activas

- `probe-point14-reevaluation-rules.mjs` — started≠completed, rechazo started→resolved, completed sin resultado, unsatisfactory, happy path, reopen, QA con finding abierto
- Seed OpVal purga solo empresa de prueba (no Amber) vía `session_replication_role` para reseed determinista

## Dictamen

Ver `RECTOR_POINT_14_DICTAMEN.md`.
