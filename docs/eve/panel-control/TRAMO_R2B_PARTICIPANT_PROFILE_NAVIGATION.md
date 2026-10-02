# Tramo R2B — Navegación Persona → Perfil funcional

Fecha: 2026-07-15  
Fuente rectora: corpus v1.0 **§10** (profundidad parcial hasta perfil funcional). MR-008: persona expandible por perfiles.  
BFF: reutiliza R2A (`/participants`, `/profiles`).  
KPI Usuarios / Roles funcionales: **—** (no activados).

## Zona UI

Área central de Monitoreo (`CompanyUserRoleMatrix` conceptual → `CaseParticipantsPanel`), **debajo** del detalle de hito.  
No usa el rail de hitos. No sustituye proceso/banda.

## Estados

`idle | loading-participants | empty | loading-profiles | partial | active | error`

Amber vacío factual → empty, no error.

## URL

`participant=<id>` · `profile=<id>`  
Cambio de empresa/relación/caso limpia profundidad. Persona limpia perfil.

## Siguiente (no autorizado)

Perfil → Responsabilidades → Actividades.
