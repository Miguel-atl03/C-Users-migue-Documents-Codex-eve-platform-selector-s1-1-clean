# Dictamen — Unidad 3A

Fecha: 2026-07-15  
Alcance: persistencia mínima Case → Proceso principal → Hitos → Hito actual  
**UI Unit 3: no activada.** Staging/producción: sin cambios.

## Veredicto

**Unidad 3A aceptada en local.** Existe base factual mínima, integridad, RLS, BFF vacío/parcial/completo, script administrativo con dry-run, verificador. Amber permanece sin proceso ni hitos (ausencia factual válida).

## Estructuras reutilizadas

- Caso: `public.sesiones_llenado` (+ bridge Unit 2A)
- Acceso: `eve_consultant_can_access_*`
- Auditoría: `official_control_panel_context_audit` (acciones extendidas)
- Admin gate: `eve_require_official_context_admin`
- Trigger `updated_at`: `eve_official_context_set_updated_at`

## Estructuras creadas

| Objeto | Rol |
|--------|-----|
| `case_main_processes` | Proceso principal del caso |
| `case_milestones` | Hitos del proceso |
| índices unique one-enabled-per-case, sequence única | Integridad |
| triggers current-milestone same process / case context | Integridad |
| RLS select-only authenticated | Autorización |
| RPCs `eve_admin_*` proceso/hito | Escritura controlada |
| `eve_verify_unit3a_process_structure_integrity` | Verificador |

## Migraciones

1. `20260715180000_eve_official_control_panel_unit3a_process_structure.sql`
2. `20260715180100_eve_official_control_panel_unit3a_integrity_fix.sql` (ambigüedad `status`)

## Estados

`not_started` | `available` | `current` | `waiting` | `completed` | `blocked` | `unknown`  
Presentación BFF: No iniciado / Disponible / Actual / En espera / Completado / Bloqueado / No disponible.

## Regla de hito actual

`case_main_processes.current_milestone_id` (nullable) + trigger same-process. Sin inferencias.

## Esperando

`waiting` ⇒ `expected_event_label IS NOT NULL OR timer_due_at IS NOT NULL`  
Límite: no se exige ambos.

## BFF

`GET /api/eve/official-consultant-control-panel/cases/:caseId/process-structure`  
Mensaje denegado: «No fue posible abrir la estructura del caso.»

## Scripts

- `manage-case-process-structure.mjs` (`--dry-run`, `--confirm=UNIT3A_ADMIN`)
- `verify-unit-3a-integrity.mjs`
- `rollback-unit-3a.sql` + `UNIT_3A_ROLLBACK.md`
- Inspect Unit 3 actualizado → `UNIT_3A_PERSISTENCE_PRESENT`

## Estado factual Amber

| Campo | Valor |
|-------|-------|
| Caso | `19fc9eff-…` |
| Procesos enabled | **0** |
| Hitos enabled | **0** |
| BFF esperado | `{ mainProcess: null, milestones: [] }` |

No se inventó estructura desde BPMN/Runtime/INC16.

## Resultado local

- `migration up` aplicado
- `verify-unit-3a-integrity` → **pass**
- `verify-unit-2a-integrity` → **pass**
- Tests Unit 3A + Unit 2A → **pass**
- Inspect → `UNIT_3A_PERSISTENCE_PRESENT`, Amber vacío
- dry-run create-main-process sobre Amber → válido sin escribir

## Cero cambios visuales

No se modificó shell, banda, rail ni placeholders de UI.

## Cero cambios remotos

Solo Supabase local. Sin staging/producción. Unidad 4 no iniciada.

## Archivos principales

- migraciones Unit 3A (2)
- `src/services/eve/official-control-panel/official-control-panel-process-structure*.ts`
- `src/app/api/.../cases/[caseId]/process-structure/route.ts`
- scripts manage/verify/rollback/inspect
- docs `UNIT_3A_PROCESS_MILESTONE_PERSISTENCE.md`, `UNIT_3A_ROLLBACK.md`
- test `official-control-panel-unit3a.test.mjs`

## Riesgos pendientes

- Activación UI Unit 3 pendiente de aprobación
- Datos Amber de proceso requieren evidencia/aprobación administrativa
- Catálogo de estados es mínimo (no OLC/PF)
- Schema cache PostgREST: tras migrar, `NOTIFY pgrst, 'reload schema'` si el RPC no aparece
