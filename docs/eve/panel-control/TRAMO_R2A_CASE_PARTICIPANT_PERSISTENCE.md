# Tramo R2A — Persistencia participantes y perfiles funcionales

Fecha: 2026-07-15  
Alcance: base factual Caso → Persona participante → Perfil funcional.  
**UI R2B: activada (navegación solo lectura).** KPI Usuarios / Roles funcionales: —.

## Punto rector

Fuente rectora: corpus v1.0 **§10** (monitoreo recursivo Empresa → Usuario → Rol → Actividad). Criterios UX MR-008/MR-009 (expandible, reasignación auditada) sin sustituir el corpus.

## Separación

| Objeto | Tabla | Notas |
|--------|-------|-------|
| Usuario físico | `usuarios` (reutilizado) | `auth_user_id` → Auth; un login |
| Participación | `case_participants` | Caso ↔ usuario; `display_label` administrativa (no email) |
| Perfil funcional | `case_participant_profiles` | Contexto operativo; no login ni cargo |

**No** usar `sesiones_llenado.usuario_id` como participante.

## Estados

Participación (administrativos mínimos): `active` | `inactive` | `pending_review`.

Resolución (diseño §22): `resolved` | `mixed_unresolved` | `reentry_required` | `manual_review_required` | `unavailable`.

## Integridad

- Unicidad participación activa por `(case_id, user_id)`
- Unicidad perfil activo por `(case_participant_id, lower(label))`
- Vigencia consistente; anti-reasignación silenciosa de etiqueta (MR-009)
- **No** se exige `usuarios.empresa_id = client_company_id` del caso  
  (ver `R2A_PARTICIPANT_COMPANY_AFFILIATION_DICTAMEN.md` — regla no sustentada)
- Alcance: participación explícita + autorización Consultor→Empresa→Relación→Caso (Unit 2A)

## BFF

- `GET .../cases/:caseId/participants` → `{ participants: [] }` vacío factual OK  
- `GET .../cases/:caseId/participants/:participantId/profiles` → `{ profiles }`  
Sin correo ni Runtime.

## Admin / verificador

- `manage-case-participants.mjs` (`--confirm=R2A_ADMIN`)
- `verify-tramo-r2a-integrity.mjs`
- Inspector R2 actualizado: detecta tablas/FK/RLS/BFF reales

## Amber

Sin participantes/perfiles insertados → `participants = []`.

## Siguiente (no autorizado)

R2B — navegación visual Persona → Perfil.
