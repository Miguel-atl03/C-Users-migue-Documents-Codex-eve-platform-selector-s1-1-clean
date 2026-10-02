# Registro de riesgo RLS — staging (Unidad 2)

Fecha de inventario: 2026-07-15  
Proyecto Supabase: `https://bwflscplkjohdhkiqqoc.supabase.co`  
Fuente: `pg_tables` + Supabase Database Linter (`get_advisors security`)

## Resumen

| Métrica | Valor |
|---|---|
| Tablas `public` sin RLS | **23** |
| Tablas Unidad 2A (post-migración) | 3 nuevas + políticas en `empresas` / `sesiones_llenado` |
| Bloqueo para validación técnica staging | **No** (tablas ajenas a Unidad 2) |
| Bloqueo para producción | **Sí** (subconjunto con datos sensibles y exposición `anon`/`authenticated`) |

## Regla aplicada

Las tablas ajenas a Unidad 2 **no bloquean** la validación técnica de staging de Unidad 2.

Sí bloquean promoción a **producción** cuando:

- son accesibles desde `authenticated` o `anon`;
- contienen datos sensibles;
- permiten ampliar scope o inferir empresas/relaciones/casos ajenos.

No se habilitó RLS masivo en esta compuerta.

## Inventario — 23 tablas sin RLS

| Tabla | Datos sensibles | Acceso cliente | Acceso BFF | RLS | Exposición potencial | Relación Unidad 2 | Acción requerida | Bloquea staging |
|---|---|---|---|---|---|---|---|---|
| `activity_canonical_profiles` | Medio (perfiles actividad) | PostgREST directo | No oficial | No | Lectura/escritura anónima posible | Ninguna | Inventariar; RLS en backlog producción | No |
| `activity_structural_scores` | Medio | PostgREST directo | No oficial | No | Scores estructurales expuestos | Ninguna | Inventariar; RLS backlog | No |
| `catalogo_preguntas` | Bajo (catálogo) | PostgREST directo | Indirecto | No | Catálogo completo legible | Ninguna | RLS backlog producción | No |
| `causal_rule_executions` | Alto (ejecuciones diagnóstico) | PostgREST directo | Motores internos | No | Trazas causales | Ninguna | **Bloquea producción** | No |
| `closure_results` | Alto (cierre sesión) | PostgREST directo | Motores internos | No | Resultados de cierre | Ninguna | **Bloquea producción** | No |
| `error_alerts` | Alto (alertas sistema) | PostgREST directo | No | No | Alertas operativas | Ninguna | **Bloquea producción** | No |
| `evaluaciones_en_progreso` | Alto (evaluaciones) | PostgREST directo | No | No | Estado evaluación usuarios | Ninguna | **Bloquea producción** | No |
| `eventos_algedonicos` | Alto (eventos VSM) | PostgREST directo | No | No | Eventos sistémicos | Ninguna | RLS backlog producción | No |
| `mapa_coordinacion_s2` | Medio | PostgREST directo | No | No | Coordinación S2 | Ninguna | RLS backlog | No |
| `matriz_tensiones` | Medio | PostgREST directo | No | No | Tensiones organizacionales | Ninguna | RLS backlog | No |
| `metricas_abandono` | Medio (métricas uso) | PostgREST directo | No | No | Métricas de abandono | Ninguna | RLS backlog | No |
| `metricas_por_pregunta` | Medio | PostgREST directo | No | No | Métricas por pregunta | Ninguna | RLS backlog | No |
| `micro_momentos_s4` | Medio | PostgREST directo | No | No | Momentos S4 | Ninguna | RLS backlog | No |
| `respuestas_patron` | Alto (respuestas) | PostgREST directo | No | No | Patrones de respuesta | Ninguna | **Bloquea producción** | No |
| `scene_causal_activations` | Alto (escenas) | PostgREST directo | Motores | No | Activaciones causales | Ninguna | **Bloquea producción** | No |
| `sesiones_rescate` | Alto (rescate sesión) | PostgREST directo | No | No | Datos de rescate | Ninguna | **Bloquea producción** | No |
| `session_causal_outputs` | Alto (salidas sesión) | PostgREST directo | Motores | No | Outputs causales | Ninguna | **Bloquea producción** | No |
| `support_activity_requests` | Medio (soporte) | PostgREST directo | Orquestación | No | Solicitudes soporte | Indirecta (futuro) | RLS antes producción | No |
| `system_logs` | Alto (logs) | PostgREST directo | No | No | Logs internos | Ninguna | **Bloquea producción** | No |
| `tensiones_activas` | Medio | PostgREST directo | No | No | Tensiones activas | Ninguna | RLS backlog | No |
| `tensiones_resueltas_historial` | Medio | PostgREST directo | No | No | Historial tensiones | Ninguna | RLS backlog | No |
| `triangulation_results` | Alto (triangulación) | PostgREST directo | Motores | No | Resultados diagnóstico | Ninguna | **Bloquea producción** | No |
| `versiones_herramienta` | Bajo (versionado) | PostgREST directo | No | No | Versiones instrumento | Ninguna | RLS backlog | No |

## Tablas Unidad 2A (post-migración esperada)

| Tabla | RLS esperado | Políticas |
|---|---|---|
| `consultant_company_assignments` | Sí (forzado) | `consultant_company_assignments_own_current_select` |
| `client_relationships` | Sí (forzado) | `client_relationships_assigned_current_select` |
| `official_control_panel_context_audit` | Sí (forzado) | Solo `service_role` |
| `empresas` | Sí | `empresas_consultant_assigned_select` |
| `sesiones_llenado` | Sí | `sesiones_llenado_consultant_assigned_select` |

## Riesgos adicionales del linter (no Unidad 2)

- Funciones `SECURITY DEFINER` ejecutables por `anon` (`bootstrap_demo_session`, `resolve_demo_session_owner`).
- Funciones `SECURITY DEFINER` ejecutables por `authenticated` (`bootstrap_commercial_session`).
- Tablas con RLS habilitado pero **sin políticas** (p. ej. `catalogo_preguntas_relatos`, tablas `mba_*`).

## Decisión de compuerta

| Ámbito | Decisión |
|---|---|
| Validación técnica staging Unidad 2 | **Permitida** con inventario documentado |
| Promoción a producción | **Bloqueada** hasta plan RLS para tablas sensibles sin políticas |
