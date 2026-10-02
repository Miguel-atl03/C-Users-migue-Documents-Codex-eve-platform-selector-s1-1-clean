# Dictamen — Tramo R2A

Fecha: 2026-07-15  
**UI R2B: activada.** KPI Usuarios-Roles: —. Staging/prod: sin cambios.

## Veredicto

**R2A aceptado en local:** persistencia + RLS + BFF agregado + admin + verificador.  
Amber: `participants = []` (vacío factual).

## Punto rector / MR

- Ejecutado: persistencia mínima para profundidad Caso → Participante → Perfil (**corpus v1.0 §10**, parcial).
- MR-008: fuente factual + **UI expandible R2B**.
- MR-009: reasignación vía disable+create + auditoría; trigger anti-silencio.

## Estructuras

| Reutilizadas | Creadas |
|--------------|---------|
| `sesiones_llenado`, `usuarios`, `auth.users`, audit Unit 2–4A, `eve_consultant_can_access_case` | `case_participants`, `case_participant_profiles` |

Migración: `20260715200000_…tramo_r2a_case_participants.sql`

## BFF

`GET .../participants` y `.../profiles` — sin PII.

## Amber

0 participantes / 0 perfiles oficiales. No se usó consultor ni `sesiones_llenado.usuario_id` como participante.

## Confirmaciones

Cero staging/producción; KPI —; sin responsabilidades/actividades/Runtime.

Siguiente rector **no autorizado**: Perfil → Responsabilidades → Actividades.
