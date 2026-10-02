# Implementación — Puente factual Perfil funcional ↔ Sesión Runtime (§10)

Fecha: 2026-07-16  
Autoridad: `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`  
Decisión: **C2** crear `case_profile_runtime_session_links` + **C3** no usar `role_runtime_session.role_id` como puente.

## Inspección (compuerta)

| Pregunta | Resultado |
|----------|-----------|
| ¿Existe FK/tabla puente previa? | **No** |
| Semántica de `role_id` | UUID opaco de scope Runtime; **sin FK** a perfil ni catálogo |
| ¿Heurística aceptable? | **No** (nombre, fecha, empresa, único registro) |

## Modelo

Tabla: `case_profile_runtime_session_links`

- FKs: `case_participant_profile_id` → profiles; `role_runtime_session_id` → RRS  
- Estados: `confirmed` | `pending_review` | `revoked`  
- Cardinalidad: perfil 0..\* sesiones; sesión ≤1 perfil activo  
- Trigger: mismo `case_id`; perfil enabled en INSERT; revoked ⇒ enabled=false  
- Índices únicos activos: sesión→1 perfil; par perfil–sesión sin duplicado  
- RLS: SELECT consultor vía case access; escritura solo service_role/admin  
- Auditoría: acciones `profile_runtime_session_link_*` en `official_control_panel_context_audit`

Migración: `supabase/migrations/20260716170000_eve_official_control_panel_point10_profile_runtime_links.sql`

## BFF / UI

- Roles consultan puente → `linked` | `multiple_runtime_sessions` | `pending_review` | `no_runtime_session_link`
- `GET .../roles/:profileId/sessions` — selector Sesión funcional  
- Actividades requieren sesión vinculada; campos §§11–12 siguen **No disponible**  
- Conteos fallidos → `null` (no cero inventado)

## Amber

Sin evidencia canónica perfil↔sesión: **no se insertan vínculos**. UI mantiene vacío factual.

## Admin / verify

- `scripts/eve/official-control-panel/manage-profile-runtime-session-links.mjs` (`--confirm=POINT10_PROFILE_RRS_ADMIN`)  
- `scripts/eve/official-control-panel/verify-point10-profile-runtime-links.mjs`

## Fuera de alcance

§11, §12, staging/prod, ejes X/Y/matriz.
