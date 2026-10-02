# R3 — Inventario de superficies de estado (corregido)

## Modelo compartido

`ResourceSnapshotState<T>` + `ResourceRefreshFailure` en
`src/features/official-consultant-control-panel/state/resource-snapshot-state.ts`.

Conserva explícitamente: snapshot válido, `refreshing`, `refreshFailure`, `requestId`, clasificación HTTP.

## Derivación canónica

`deriveOfficialPanelScreenState` acepta `refreshFailedWithSnapshot`.

Prioridad: forbidden → not_found → fatal → stale → loading → refreshing → partial → ready.

**Regla crítica:** soft-refresh fallido con snapshot → `stale` (nunca retorno silencioso a `ready`).

## Superficies

| Superficie | Fuente BFF primaria | Secundarias | Snapshot | Soft-fail | Mutaciones |
|------------|---------------------|-------------|----------|-----------|------------|
| Gobernanza experiencia | experience-state | — | sí | stale + requestId | bloqueadas si stale |
| Trabajo manual | manual-work | — | sí | stale; 409→stale | R2 bloqueadas si stale |
| Producción Paralela | parallel-production | — | sí | stale | n/a |
| Eje X | support-processes | — | conserva ítems | stale/forbidden | n/a |
| Eje Y | core-milestones | — | conserva selección | stale/fatal | n/a |
| Participantes | participants | profiles/activities | empty≠error | partial/fatal | n/a |
| KPI | company + milestones + experience | experience alerts | — vs 0 | partial → — | n/a |
| Atención | experience/manual/PP | cada fuente | conserva válidas | No disponible + retry | n/a |

## Brechas residuales no bloqueantes

- Runtime / Cervecería Amber: fuera de alcance de corrección R3 (sin poblar).
- Indicadores de calidad PP investigados por Codex: no iniciados (R4+).
