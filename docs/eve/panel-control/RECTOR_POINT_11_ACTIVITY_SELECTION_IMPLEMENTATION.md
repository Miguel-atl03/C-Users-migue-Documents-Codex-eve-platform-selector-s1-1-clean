# RECTOR_POINT_11 — Activity selection factual persistence

Fecha: 2026-07-16  
Autoridad: `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`  
Título: **11. Selección de actividades primarias y contexto no primario**  
Propuesta arquitectónica aprobada: WorkMap versionado → política v1.3 → resultado persistido → validación → publicación effective → lectura read-only.

## Productor único

`selectPrimaryActivitiesFromWorkMap` (`src/services/primary-activity-selector.ts`) vía admin:

`scripts/eve/official-control-panel/manage-activity-selection-results.mjs calculate-and-stage`

El panel **nunca** recalcula ni invoca la política.

## Persistencia

Migración: `supabase/migrations/20260716190000_eve_official_control_panel_point11_activity_selection_results.sql`

- `activity_selection_results` — cabecera con ciclo de vida `computed → validated → effective → superseded` / `revoked`
- `activity_selection_result_items` — líneas con `classification` explícita (`primary` | `non_primary` | `pending` | `unavailable`)
- Un solo `effective` por `role_runtime_session_id`
- Versionado por sesión (`result_version`)
- Inmutabilidad de líneas tras publish
- RPC: `eve_validate_activity_selection_result`, `eve_publish_activity_selection_result`, `eve_revoke_activity_selection_result`

## BFF

`GET .../cases/:caseId/participants/:participantId/profiles/:profileId/sessions/:sessionId/activity-selection`

Lee únicamente `lifecycle_state = effective`. No Runtime.

## UI

Bloque **Cobertura de actividades** bajo Sesión funcional en Monitoreo. Solo lectura.  
Navegación: `activity_id` al seleccionar primaria; no inicia §12.

## Amber

Sin resultados inventados. Vacío factual si no hay effective.

## §12

**No iniciado.**
