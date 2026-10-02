# Dictamen — Ola 1 §13 Seguimiento de procesos manuales

**Fecha:** 2026-07-18 (corrección final integridad + rollback)  
**Alcance:** P-SUP-03/04/05 + alerta *Manual handoff overdue*.  
**Fuera de alcance:** §§14–16 y resto de §17.  
**Corrección:** `POINT13_MANUAL_WORK_INTEGRITY_CORRECTION.md`

## Decisión

# OLA 1 — §13 APTA PARA PROMOCIÓN A PRODUCCIÓN

*(Sin desplegar. No se inicia §14.)*

## Criterios de aptitud (cumplidos)

| Criterio | Evidencia |
|----------|-----------|
| Transición exige evento exacto | `manual_work_transition_rules` + RPC |
| Eventos y work items sincronizados | post-check RPC + verifier |
| `invalidTransitions` calculado | SQL real + IDs |
| Mutaciones historial probadas | UPDATE/DELETE/TRUNCATE rechazados |
| Políticas permisivas inspeccionadas | `pg_policies` / grants |
| `service_role` sin DML directo | revoke + gate |
| Escritura solo por RPC | grant EXECUTE únicamente |
| Rollback bloquea RPC y DML | write_control + revoke EXECUTE |
| Rollback conserva historial/lectura | preserve-data runbook |
| Reaplicación restaura RPC gobernada | `reapply-point13-manual-work-writes.sql` |
| RLS A/B + Playwright | seed + e2e |

## No iniciado

- §14 Producción Paralela y QA  
- §15–16 Experiencia / intervención  
- Resto §17.2 / alertas experiencia
