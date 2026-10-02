# §13 — Seguimiento de procesos manuales (Ola 1)

**Alcance:** P-SUP-03, P-SUP-04, P-SUP-05 + vocabulario mínimo §17.1 + alerta *Manual handoff overdue*.  
**Subvista:** Seguimiento (`view=tracking`).  
**No incluye:** §§14–16 ni resto de §17.  
**Corrección de integridad:** `POINT13_MANUAL_WORK_INTEGRITY_CORRECTION.md`.

## Separación conceptual

| Concepto | Rol |
|----------|-----|
| Registro técnico de work item | Seguimiento del avance de entregas manuales |
| Aceptación del resultado | Confirmación separada; no se presenta como Object[State] MBA en UI |

## Persistencia

- `manual_process_work_item`
- `manual_process_work_item_event` (historial factual, append-only)
- Catálogo de transiciones: `manual_work_allowed_transition`
- Catálogo de eventos: `manual_work_event_type`
- Transiciones productoras: `eve_apply_manual_work_transition` (event_type obligatorio; service_role / productor)
- Consultor: SELECT vía `eve_consultant_can_access_case`

### Camino de estados (mínimo)

`not_ready → ready_to_start → downloaded → in_manual_work → submitted → accepted`

Alternativas: no terminal → `blocked`; `submitted` ↔ `review_required`; `blocked` → operativo solo con `work_unblocked` + razón.  
`accepted` es terminal.

## BFF

- `GET /api/eve/official-consultant-control-panel/cases/:caseId/manual-work`
- Sin endpoint ornamental de mutación (`manual-actions` eliminado)

## UI

Bloque **Procesos manuales** en Seguimiento (solo lectura factual).  
Estados y eventos traducidos por `manual-work-presentation.ts`.  
Sin botones deshabilitados ni acciones futuras sin capacidad.

Texto operativo: *Este seguimiento registra el avance técnico de las entregas manuales. La aceptación del resultado se confirma por separado.*

## Alerta

Código técnico interno: `manual_handoff_overdue`  
Título operativo: **Entrega manual vencida**  
Evaluador productivo: `official-control-panel-manual-handoff-overdue.ts`

## Semillas y verificación

- Seed: `seed-point13-manual-work-test.mjs` (caso no-Amber; Amber vacío)
- Verifier: `verify-point13-manual-work-integrity.mjs`
- E2E: `official-consultant-control-panel-rector-point-13.spec.ts`
- Capturas: `reports/local/rector-point-13/screenshots/01`–`12`

## Rollback

Predeterminado (preserva datos): ver `POINT13_PRODUCTION_ROLLBACK_RUNBOOK.md`  
y `rollback-point13-manual-work-preserve-data.sql`.
