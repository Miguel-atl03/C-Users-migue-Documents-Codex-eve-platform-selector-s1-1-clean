# Unidad 3A — Persistencia Proceso principal e Hitos del caso

Fecha: 2026-07-15  
Alcance: base factual mínima Case → Proceso principal → Hitos → Hito actual.  
**No activa UI de Unidad 3.**

## Modelo final

### `public.case_main_processes`

| Columna | Rol |
|---------|-----|
| `id` | PK |
| `case_id` | FK → `sesiones_llenado` |
| `label` | Etiqueta operativa |
| `status` | Catálogo mínimo (abajo) |
| `current_milestone_id` | FK nullable → `case_milestones`; **regla de hito actual** |
| `enabled` | Soft-disable |
| `created_at` / `created_by` / `updated_at` / `updated_by` | Auditoría de fila |

Unicidad: **como máximo un proceso `enabled=true` por caso**.

### `public.case_milestones`

| Columna | Rol |
|---------|-----|
| `id` | PK |
| `main_process_id` | FK → `case_main_processes` |
| `label` | Etiqueta operativa |
| `sequence` | Orden explícito (≥ 0), único por proceso |
| `status` | Catálogo mínimo |
| `expected_event_label` | Evento esperado (dato) |
| `timer_due_at` | Timer (dato) |
| `support_process_label` | Proceso de soporte opcional |
| `enabled` | Soft-disable |
| timestamps + `created_by` / `updated_by` | Auditoría |

### Estados mínimos

`not_started` | `available` | `current` | `waiting` | `completed` | `blocked` | `unknown`

Traducción BFF (presentación):

| código | label |
|--------|-------|
| not_started | No iniciado |
| available | Disponible |
| current | Actual |
| waiting | En espera |
| completed | Completado |
| blocked | Bloqueado |
| unknown | No disponible |

Estos estados son de **presentación operativa mínima**. No sustituyen OLC ni PF. No mezclan estados de objeto.

### Regla de hito actual

- Fuente única: `case_main_processes.current_milestone_id`
- Trigger: el hito debe pertenecer al **mismo** proceso
- Si no hay hito confirmado → `NULL`
- Prohibido inferir por primer incompleto / último creado / última actualización / UI

### Espera (`waiting`)

Constraint:

```
status <> 'waiting'
OR expected_event_label IS NOT NULL
OR timer_due_at IS NOT NULL
```

Límite documentado: el corpus sugiere evento+timer emparejados; la base exige **al menos uno**.

## Decisiones

| Tema | Decisión |
|------|-----------|
| Entidad caso | Reutilizar `sesiones_llenado` (Unit 2A) |
| Near-misses | No reutilizar Runtime, BPMN, `eve_pm_registry` |
| Amber | Sin proceso ni hitos hasta evidencia/aprobación |
| Escrituras | Solo `service_role` / RPCs admin / script |
| UI | Sin cambios |
| Semillas | No insertar proceso en migraciones ni seed Amber |

## RLS

- `FORCE ROW LEVEL SECURITY` en ambas tablas
- `SELECT` authenticated solo vía `eve_consultant_can_access_case`
- Sin políticas `INSERT/UPDATE/DELETE` para authenticated
- Lectura PostgREST fuera de BFF sigue limitada por RLS; mutaciones bloqueadas

## Autorización BFF

`assertConsultantCaseProcessAccess`:

Consultor asignado ∧ relación∈empresa ∧ caso∈relación ∧ (proceso∈caso) ∧ (hito∈proceso)

Mensaje opaco: **«No fue posible abrir la estructura del caso.»**

## BFF

`GET /api/eve/official-consultant-control-panel/cases/:caseId/process-structure`

Contrato: `CaseProcessStructureResponse`

| Situación | Respuesta |
|-----------|-----------|
| Sin proceso | `{ mainProcess: null, milestones: [] }` |
| Proceso sin hitos | `mainProcess` + `milestones: []` |
| Parcial | Proceso + hitos; `currentMilestoneId` puede ser `null` |

## Script administrativo

`scripts/eve/official-control-panel/manage-case-process-structure.mjs`

Comandos: `inspect`, `create-main-process`, `add-milestone`, `set-current-milestone`, `update-milestone`, `disable-milestone`  
`--dry-run` siempre; escritura con `--confirm=UNIT3A_ADMIN` + `--actor=<uuid>`.

## Verificador

`scripts/eve/official-control-panel/verify-unit-3a-integrity.mjs` → RPC `eve_verify_unit3a_process_structure_integrity`.

## Estado factual de Amber

IDs canónicos Unit 2B preservados.  
`mainProcess = null`, `milestones = []` es **válido** (ausencia factual).

## Limitaciones / riesgos

- No hay UI de Unit 3; banda/rail siguen placeholders.
- Sin datos Amber de proceso hasta evidencia administrativa.
- Estados mínimos no modelan máquina OLC/PF completa.
- Constraint de espera no exige ambos evento+timer.
- Unit 4 no iniciada.

## Rollback

Ver `UNIT_3A_ROLLBACK.md` y `scripts/eve/official-control-panel/rollback-unit-3a.sql`.
