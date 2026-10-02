# POINT15_17_REAL_SCREEN_INSTRUMENTATION_REPORT

Fecha: 2026-07-18

## Flujo

```
UI (OfficialControlPanelShell)
  → postCaseExperienceEvent
  → POST /api/.../cases/:caseId/experience-events
  → authenticateOfficialControlPanelConsultant
  → assertConsultantCaseSupportProcessAccess
  → eve_record_experience_screen_event (service_role RPC)
  → experience_screen_event (append-only)
```

## Superficies instrumentadas

| Modo | Vista | screen_key |
|------|-------|------------|
| Empresa Cliente | Monitoreo | `panel_client_monitoring` |
| Empresa Cliente | Seguimiento | `panel_client_tracking` |
| Empresa Cliente | Gobernanza | `panel_client_governance` |
| Gobernanza de Experiencia | Trayectorias | `panel_experience_journeys` |
| Gobernanza de Experiencia | Soporte | `panel_experience_support` |
| Gobernanza de Experiencia | Salud de pantallas | `panel_experience_screen_health` |

Migración: `20260718210000_eve_point15_17_panel_screen_catalog.sql`

## Eventos emitidos

- `screen_entered` al activar superficie
- `screen_abandoned` al cambiar de superficie

No se emiten: scroll, hover, render, evidencia de negocio.

## Deduplicación

Clave factual: `userId|caseId|screenKey|eventType|navVersion`  
+ `source_version` server (`ola3-panel-v1:t{navVersion}`) + `session_reference`

- Cliente: `Set` de módulo + refs (Strict Mode safe)
- Servidor: lookup 2 min → `{ deduped: true }` sin segundo insert

## Seed / fixtures

La instrumentación no depende de seeds de demostración ni de `local-ui-fixtures`.  
El seed OpVal RPC sigue siendo herramienta de prueba externa, no ruta de producto.

## Validación post-purga (2026-07-18)

- Playwright oficial PASS con service-role efímero (CLI) y auth SDK.
- Amber: UI vacía; eventos `panel_*` de consultor no cuentan como trayectoria de usuario ni como KPI incompleto.
- Verificador integrity: cuenta Amber productivos (`screen_key not like 'panel_%'`) = 0.
- Capturas 17–19 regeneradas con waits asertivos (sin loading, datos visibles).
