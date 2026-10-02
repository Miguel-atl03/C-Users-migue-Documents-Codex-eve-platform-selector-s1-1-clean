# Rollback — Unidad 2A en staging

## Objetivo

Revertir únicamente las estructuras introducidas por Unidad 2A sin eliminar datos
previos de `empresas`, `usuarios` ni `sesiones_llenado`.

## Script canónico

`scripts/eve/official-control-panel/rollback-unit-2a.sql`

## Alcance del rollback

| Acción | Impacto en datos previos |
|---|---|
| Elimina políticas RLS Unidad 2A en `empresas` / `sesiones_llenado` | Restaura políticas previas si existían; no borra filas |
| Elimina columnas `client_*` / `display_name` en `sesiones_llenado` | **Pierde vínculos explícitos** añadidos por Unidad 2A; no borra sesiones |
| Elimina tablas `consultant_company_assignments`, `client_relationships`, `official_control_panel_context_audit` | Pierde asignaciones/relaciones/auditoría Unidad 2A |
| Elimina funciones admin / verify | BFF oficial deja de resolver contexto |

## Procedimiento recomendado (staging compartido)

1. **Respaldo** — snapshot Supabase o `pg_dump` de tablas afectadas.
2. **Ventana** — anunciar mantenimiento; bloquear despliegue frontend Unidad 2B.
3. **Ejecutar rollback** en entorno controlado o copia primero.
4. **Verificar** — confirmar ausencia de tablas Unidad 2A y columnas `client_*`.
5. **Reaplicar** — si es prueba, volver a correr migraciones `20260715072000` + `20260715073000`.

## Tiempo estimado de recuperación

| Escenario | ETA |
|---|---|
| Rollback SQL solo | 2–5 min |
| Restaurar snapshot completo | 15–30 min |
| Reaplicar migración + verificador | 10–20 min |

## Restricciones

- **No ejecutar rollback destructivo** en staging compartido sin respaldo.
- No tocar las 23 tablas sin RLS ajenas a Unidad 2 en esta operación.
- No modificar producción.

## Reversión de código (Unidad 2B)

Desplegar commit anterior al merge de Unidad 2B o deshabilitar ruta
`/admin/official-consultant-control-panel` vía feature flag
`officialConsultantControlPanelShellEnabled`.
