# Rector Point 14 — Parallel Production & QA — Implementation

## Alcance

Observación técnica de Producción Paralela + QA (P-SUP-06 → 07/08 → 09) en el panel oficial. Sin reinterpretar corpus. Sin cambios visuales de superficie en esta corrección final.

## Migraciones

| Orden | Archivo |
|-------|---------|
| Base | `20260718030000_eve_point14_parallel_production_qa_observation.sql` |
| Integridad tripletes / DML | `20260718040000_eve_point14_integrity_transition_fix.sql` |
| Reevaluación + append-only | `20260718050000_eve_point14_reevaluation_append_only_fix.sql` |
| Cierre factual QA/export | `20260718060000_eve_point14_factual_qa_export_closure.sql` |

## Separación factual de reevaluación

```
… → reevaluation_started → reevaluation_completed → resolved
```

- `reevaluation_started` ≠ terminación
- `reevaluation_completed` exige `reevaluation_result` + refs
- `resolved` solo tras completed + `satisfactory`
- Reapertura: `finding_reopened` conserva resolución/reevaluación previa

## Append-only

Eventos de paquete y finding: solo INSERT vía RPC. UPDATE/DELETE/TRUNCATE siempre rechazados.

## Superficies

- BFF `GET .../parallel-production`
- `ParallelProductionPanel` (monitoreo + gobernanza)
- Alertas en Atención (sin botones ornamentales de export)

## Scripts

| Script | Rol |
|--------|-----|
| `seed-point14-parallel-production-test.mjs` | Seed RPC-only OpVal |
| `verify-point14-parallel-production-integrity.mjs` | Continuidad + mutación activa |
| `probe-point14-reevaluation-rules.mjs` | Reglas de reevaluación / QA |
| `rollback-point14-parallel-production-preserve-data.sql` | Rollback no destructivo |
| `reapply-point14-parallel-production-writes.sql` | Reaplicación EXECUTE |

## Validación local

```bash
node --env-file=.env.local scripts/eve/official-control-panel/seed-point14-parallel-production-test.mjs
node --env-file=.env.local scripts/eve/official-control-panel/probe-point14-reevaluation-rules.mjs
node --env-file=.env.local scripts/eve/official-control-panel/verify-point14-parallel-production-integrity.mjs
npx playwright test tests/e2e/official-consultant-control-panel-rector-point-14.spec.ts
```

## Docs hermanas

- `POINT14_INTEGRITY_SECURITY_CORRECTION.md`
- `POINT14_PRODUCTION_ROLLBACK_RUNBOOK.md`
- `RECTOR_POINT_14_PRODUCTION_READINESS_CHECKLIST.md`
- `RECTOR_POINT_14_DICTAMEN.md`
