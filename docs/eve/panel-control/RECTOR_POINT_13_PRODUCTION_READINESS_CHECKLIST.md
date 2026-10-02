# Checklist de preparación productiva — Ola 1 §13

| Ítem | Estado | Evidencia |
|------|--------|-----------|
| Migración base | OK | `20260718010000_*` (no editada) |
| Migración integridad state machine | OK | `20260718020000_*` (no editada) |
| Migración transición↔evento estricta + write gate | OK | `20260718030000_eve_point13_transition_event_strict.sql` |
| Catálogo `manual_work_transition_rules` | OK | unicidad from+to+event |
| RPC exige triple exacto | OK | `manual_work_transition_not_allowed` |
| `service_role` sin DML directo | OK | revoke ALL + SELECT only |
| Escritura solo RPC gobernada | OK | SECURITY DEFINER + GUC + write gate |
| Rollback no escritural | OK | disable gate + revoke EXECUTE + preserve data |
| Reaplicación gobernada | OK | `reapply-point13-manual-work-writes.sql` |
| Verifier métricas reales | OK | invalidTransitions / mutation probe / permissivePolicies |
| Security probes | OK | `test-point13-transition-security.mjs` |
| Seed operacional (RPC transitions) | OK | starters vía postgres+GUC |
| Playwright §13 | OK | ruta oficial (sin regenerar capturas si UI idéntica) |
| Deploy | NO | go-no-go pendiente; no iniciar §14 |

## Decisión

Ver `RECTOR_POINT_13_DICTAMEN.md` → **OLA 1 — §13 APTA PARA PROMOCIÓN A PRODUCCIÓN**.
