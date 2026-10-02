# Dictamen — Tramo R2B

Fecha: 2026-07-15  
Alcance: navegación visual Personas participantes → Perfiles funcionales  
**KPI Usuarios / Roles: —.** Responsabilidades/actividades: no iniciadas.  
Staging/producción: sin cambios.

## Veredicto

**R2B aceptado en local.** UI consume BFF R2A. Amber muestra vacío factual. Proceso/hitos/H0–H6 intactos.

## Diseño / MR-008

Corpus v1.0 **§10**: panel muestra persona participante expandible por perfiles funcionales.  
Etiqueta UI: **Perfil funcional** (no cargo/seguridad).

## BFF reutilizados

- `GET .../cases/:caseId/participants`
- `GET .../cases/:caseId/participants/:participantId/profiles`

## Componentes

`CaseParticipantsPanel`, `CaseParticipantItem`, `FunctionalProfileList`, `FunctionalProfileItem`, `ParticipantProfileDetail`, hook `use-case-participants`, navegación URL, presentation.

## Amber

0 participantes → «Este caso no tiene personas participantes registradas.»

## Brecha siguiente

Perfil funcional → Responsabilidades → Actividades (**no iniciar sin aprobación**).
