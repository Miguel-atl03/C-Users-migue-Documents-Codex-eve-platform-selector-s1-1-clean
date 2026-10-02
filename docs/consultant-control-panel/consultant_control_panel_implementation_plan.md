# Consultant Expert Control Panel — Implementation Plan

## Decision
Implement **Panel de Control del Consultor Experto EVE** as an internal consultant surface outside the closed activation process (P0–P9 / Ring 0–4). No Ring 5. No production mutation. No client exposure.

## Route convention
- Official route: `/admin/consultant-control-panel`
- Alias: `/consultant/control-panel` → redirects to official route
- Justification: existing consultant/admin UI lives under `/admin/*` (`runtime-vsm`, `significado-trace`)

## Levels
### Nivel A — read mode (implemented)
- Private route + access gate
- Four operational areas
- Global filters
- BFF read adapters with safe empty fallback
- Official EVE admin visual language reused

### Nivel B — audited manual controls
- Controls visible
- Disabled with reason `Requiere endpoint auditado` until audited endpoints exist
- Justification modal required before any future enablement

## BFF endpoints
- `GET /api/eve/consultant/control-panel/state`
- `GET /api/eve/consultant/control-panel/client-company-progress`
- `GET /api/eve/consultant/control-panel/user-functional-help`
- `GET /api/eve/consultant/control-panel/operational-trace`
- `GET /api/eve/consultant/control-panel/downloads`
- `POST /api/eve/consultant/control-panel/manual-action`
- `POST /api/eve/consultant/control-panel/download-request`

## Access
- Client surface (`x-eve-surface: client`) always blocked
- Token via `EVE_CONSULTANT_CONTROL_PANEL_ACCESS_TOKEN` + `x-eve-consultant-access`
- Local mode via `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED=true` + role header
- Non-production fallback for internal tooling when flags unset

## Boundary
- No `service_role` in frontend
- No SQL / migrations
- No productive export execution
- No automatic final diagnosis
- No activation reopen / Ring 5
