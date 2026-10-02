# R1 — Matriz de capabilities (oficial)

**Fecha:** 2026-07-20  
**Catálogo tipado:** `OfficialControlPanelCapability` en `official-control-panel-contract.types.ts`  
**Resolución:** `official-control-panel-capability-catalog.ts`

## Reglas

| Regla | Efecto |
|-------|--------|
| Capability ausente | **deny** (`capability_absent`) |
| Capability desconocida | **deny** |
| URL / botón visible | **no** concede capability |
| Cálculo | **server-side** (matriz construida en servicio/adaptador) |
| R2 mutaciones manuales | **enabled** vía grant en `eve_consultant_panel_capability_grant` (+ assignment activo) |

## Catálogo exacto

| key | R1 allowed por defecto | reasonCode si deny | Notas |
|-----|------------------------|--------------------|-------|
| `view_company_state` | sí si composición/consulta empresa autorizada | `capability_absent` | Lectura agregada absorbida |
| `view_participant_detail` | sí en contexto monitoreo autorizado | | |
| `view_authorized_evidence` | sí cuando scope runtime autorizado | | |
| `view_experience_state` | sí vía experience-state | | Alias 1:1 experiencia |
| `send_support_message` | sí si experience service la emite | | Alias 1:1 |
| `request_reentry` | sí si experience service la emite | | Alias 1:1 |
| `mark_manual_review` | sí si experience service la emite | | Alias 1:1 |
| `manage_manual_work` | **sí** si grant `manage_manual_work` enabled | `capability_absent` | R2 — tabla `eve_consultant_panel_capability_grant` |
| `accept_manual_output` | **sí** si grant `accept_manual_output` enabled | `accept_requires_capability` / `capability_absent` | R2 — separado de manage |
| `generate_export` | deny hasta fuente factual | `capability_absent` | |
| `block_export` | deny hasta fuente factual | `capability_absent` | |

## Aliases experiencia → rector

| ExperienceCapability (wire) | OfficialControlPanelCapability |
|-----------------------------|--------------------------------|
| `view_experience_state` | `view_experience_state` |
| `send_support_message` | `send_support_message` |
| `request_reentry` | `request_reentry` |
| `mark_manual_review` | `mark_manual_review` |
| `reopen_block` | *(sin mapear → deny en catálogo oficial)* |
| `session_reset` | *(sin mapear)* |
| `open_detail` | *(sin mapear; UI local)* |
| `view_trajectory` | *(sin mapear; UI local)* |
| `governed_action` | *(sin mapear; UI local)* |

Los aliases no mapeados **no** se promueven al catálogo oficial; permanecen como tokens de dominio experiencia sin habilitar mutaciones R2.

## CapabilityVM

```ts
{ key, allowed, reasonCode, targetScope? }
```

`targetScope` solo cuando exista fuente factual (hoy opcional/`null` en builder).

## R2 habilita (post-migración 20100000 + 20110000)

- `POST .../manual-actions` (BFF autenticado)
- `availableActions` server-side + botones UI cuando `allowed=true`
- RPC wrapper `eve_apply_manual_work_product_action_as_consultant`
- Split accept: `can_accept_manual_output` en assignment

Compuertas E2E FX-08 y verifier R2 pueden permanecer pendientes mientras UI/gates no cierren.
