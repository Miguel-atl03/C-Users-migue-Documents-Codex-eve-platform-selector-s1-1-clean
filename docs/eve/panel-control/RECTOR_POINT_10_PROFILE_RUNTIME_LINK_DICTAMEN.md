# Dictamen — Puente Perfil funcional ↔ Sesión Runtime (§10)

Fecha: 2026-07-16  
Autoridad: diseño rector v1.0  
Plan: `RECTOR_POINTS_10_12_IMPLEMENTATION_PLAN.md`  
Implementación: `RECTOR_POINT_10_PROFILE_RUNTIME_LINK_IMPLEMENTATION.md`

## Veredicto

**§10 cerrado estructuralmente y parcial operacionalmente para Amber.**

La cadena **Perfil funcional → Sesión funcional → Actividad** está disponible en contrato, BFF y UI, **sin vínculos inventados**.

| Capacidad | Estado |
|-----------|--------|
| Puente `case_profile_runtime_session_links` | **CERRADO** (persistencia + integridad + RLS + auditoría) |
| Lectura roles/actividades vía vínculo | **CERRADO** estructural |
| Amber con vínculo canónico | **PARCIAL / vacío factual** — sin evidencia para inventar link |
| §§11–12 | **NO INICIADO** (campos siguen No disponible) |
| §§7–9 | Intactos |

## Compuerta

- C1 reutilizar: **rechazado** (no existía puente)  
- C2 crear tabla: **aplicado**  
- C3 `role_id` ambiguo: **respetado** (no usado como FK)

## Criterios de aceptación

- Relación factual perfil↔sesión: sí  
- Sin heurística: sí  
- Mismo caso: trigger sí  
- Sesión no a dos perfiles activos: índice único sí  
- Varias sesiones sin autoselección arbitraria: sí  
- Actividades solo de sesión vinculada: sí  
- Error de conteo ≠ cero: sí (`null`)  
- Amber sin inventos: sí  
- §§11–12 sin activar: sí  
- Ejes intactos: sí  

## No iniciar §11

Este dictamen **no autoriza** Ola B (§11) ni Ola C (§12).
