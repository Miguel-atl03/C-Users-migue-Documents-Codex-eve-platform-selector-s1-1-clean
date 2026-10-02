# R2 — Acciones manuales gobernadas — Implementación

**Fecha:** 2026-07-20  
**Alcance:** R2 únicamente. Máquina §13 reutilizada. Sin R3–R5.

## Antes → Después

| Estrato | Antes (gap §13) | Después R2 |
|---------|-----------------|------------|
| Persistencia / reglas | Existente | Sin cambio de estados |
| RPC core | `eve_apply_manual_work_transition` (service_role) | Intacta; no expuesta al navegador |
| Wrapper autenticado | Ausente | `eve_apply_manual_work_product_action_as_consultant` |
| Capabilities | Tipadas denied R1 | Grants `eve_consultant_panel_capability_grant` |
| BFF acción | Ausente | `POST .../cases/[caseId]/manual-actions` |
| UI acción | Ausente | `ManualWorkPanel` + drawer |
| Adjuntos | `artifact_ref` opaco | Versiones + blob + SHA-256 |

## Acciones producto

`download_package` | `register_start` | `attach_output` | `submit_review` | `accept_output`

## Capabilities

- `manage_manual_work` → download, register, attach, submit  
- `accept_manual_output` → accept únicamente  

UI nunca inventa capabilities; consume `availableActions` del GET.

## Concurrencia

`expectedStatus` + `expectedVersion` + `idempotencyKey` → 409 stale / conflict.

## Amber

Sin semillas. FX-08 aislado (`a2080008-…`).

## Migraciones

1. `20260720100000_eve_r2_manual_actions_authenticated.sql`  
2. `20260720110000_eve_r2_manual_capability_grants.sql`  
3. `20260720120000_eve_r2_manual_actions_structural_fix.sql` — sin sintéticos; descarga binaria atómica; attach causal; ledger; advisory lock; TRUNCATE real

## Descarga

`POST .../manual-artifacts/[artifactVersionId]/download`  
Entrega archivo + `ready_to_start → downloaded` + auditoría + idempotencia.  
`POST .../manual-actions` **rechaza** `download_package` (422).
