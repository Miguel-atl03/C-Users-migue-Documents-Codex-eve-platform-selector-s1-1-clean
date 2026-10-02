# R1 — Implementación de contratos BFF, VM y estados (corrección final)

**Fecha:** 2026-07-20  
**Dictamen:** **APTO PARA PROMOCIÓN A PRODUCCIÓN** (`RECTOR_R1_DICTAMEN.md`)  
**Inventario:** `RECTOR_R1_BFF_CONTRACT_INVENTORY.md`

## Consumo canónico real

### CompanyControlPanelVM

```
fuentes factuales
  → composeCompanyControlPanelVM (única por contexto activo)
  → presentCompanyStateFromVm
  → KPI Estado actual + KPI Próximo paso + ExperienceGovernanceMode + AttentionGovernancePanel
```

La VM conserva estado factual recibido (`companyStateAggregation`, `experienceWireDataStatus`, `experienceLoadReady`) sin reglas nuevas de negocio.

| Condición | Superficie |
|-----------|------------|
| Sin estado factual / carga no lista | `No disponible` |
| Sin `nextExpectedEvent` factual | Próximo paso `No disponible` |
| Label «En curso» sin próximo evento | degradado a `No disponible` |

Camino paralelo `presentCompanyStateSurface` + `experienceData` **eliminado** del shell.

### ParticipantMonitoringVM

```
composeParticipantMonitoringList
  → ParticipantMonitoringVM[]
  → presentParticipantMonitoringTableRows
  → filas visibles (usuario, engagement, sesiones de rol, actividades, etapa, atención)
```

`roleSessionsDataStatus`:

| Caso | Detección | UI |
|------|-----------|-----|
| Evaluado sin sesiones | `sessionsByUserId.has(userId)` + `[]` | `0` factual |
| No evaluado | `!sessionsByUserId.has(userId)` | `No disponible` (no 0) |

Atributos `data-participant-monitoring-vm-*` cosméticos eliminados.

## Freshness / scope / próximo evento

Sin cambios de regla respecto a la corrección previa: freshness factual, scope acumulativo, `pickNextExpectedEvent` sin inventar labels.

## Pruebas de comportamiento

`official-control-panel-r1-bff-contracts.test.mjs` — render/proyección real, no `assert.match(source, /compose...)`.

## R2 no iniciado

`manage_manual_work` / `accept_manual_output` denied (`r1_disabled_pending_r2`).

## SupportActionDrawer (corrección final R1)

Causa del FAIL §§15–17: (1) POST fallaba sin service_role en el proceso Next; (2) el cierre del drawer esperaba el soft-refresh.

Secuencia canónica tras corrección:

```
POST 2xx → submitAction resuelve → drawer cierra → void soft refresh (1×)
```

Archivos: `use-case-experience-state.ts`, `SupportActionDrawer.tsx`, `ExperienceGovernanceMode.tsx`.  
Prueba: `official-control-panel-support-action-drawer.test.mjs`.  
Playwright §§15–17: **PASS**.
