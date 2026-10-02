# Point 13 — Integrity correction

Corrige Ola 1 §13 **sin editar** migraciones aplicadas previas.

## Bloqueos corregidos (pase final)

1. Triple exacto `from_status + to_status + event_type` vía `manual_work_transition_rules`.
2. RPC no sustituye `event_type`; rechaza con `manual_work_transition_not_allowed`.
3. Verificador calcula `invalidTransitions`, prueba mutaciones append-only y audita políticas permisivas.
4. `service_role` sin DML directo; escritura solo por RPC `SECURITY DEFINER` + GUC.
5. Rollback deshabilita write gate **y** revoca `EXECUTE` (bloquea también RPC).
6. Reaplicación restaura solo RPC gobernada; DML directo permanece revocado.

## Catálogo transición–evento

Tabla: `manual_work_transition_rules`  
Unicidad: `(from_status, to_status, event_type)`

Camino feliz: `not_ready→ready_to_start/work_ready` … `submitted→accepted/output_accepted`  
Review: `submitted↔review_required`  
Block/unblock: `*/blocked/work_blocked`, `blocked→*/work_unblocked`  
Handoff same-status: `submitted→submitted` + `handoff_pending|accepted|closed`

## Privilegios finales

| Rol | Work item / Event | RPC |
|-----|-------------------|-----|
| `authenticated` | SELECT (RLS) | sin EXECUTE |
| `service_role` | SELECT only | EXECUTE `eve_apply_manual_work_transition` |
| `postgres` (owner) | escribe vía RPC / seed GUC | owner |

Gate: `manual_work_write_control.enabled`  
Triggers rechazan DML sin `eve.manual_work_rpc=1` y `current_user=postgres`.

## RPC autorizada

- `eve_apply_manual_work_transition(...)` — única ruta de transición productiva.
- Alta inicial `not_ready`: solo owner/migración con GUC (sin inventar RPC de creación nueva).

## Artefactos

| Artefacto | Ruta |
|-----------|------|
| Migración strict | `supabase/migrations/20260718030000_eve_point13_transition_event_strict.sql` |
| Verifier | `scripts/eve/official-control-panel/verify-point13-manual-work-integrity.mjs` |
| Security probes | `scripts/eve/official-control-panel/test-point13-transition-security.mjs` |
| Rollback | `rollback-point13-manual-work-preserve-data.sql` |
| Reapply | `reapply-point13-manual-work-writes.sql` |
| Runbook | `POINT13_PRODUCTION_ROLLBACK_RUNBOOK.md` |

## Verificación

```bash
npx supabase migration up --local
node --env-file=.env.local scripts/eve/official-control-panel/seed-point13-manual-work-test.mjs
node --env-file=.env.local scripts/eve/official-control-panel/verify-point13-manual-work-integrity.mjs
node --env-file=.env.local scripts/eve/official-control-panel/test-point13-transition-security.mjs
node --experimental-strip-types --test tests/regression/consultant-control-panel/official-control-panel-rector-point-13.test.mjs
npx playwright test tests/e2e/official-consultant-control-panel-rector-point-13.spec.ts
```

## Dictamen

**OLA 1 — §13 APTA PARA PROMOCIÓN A PRODUCCIÓN**  
Sin deploy. Sin iniciar §14.
