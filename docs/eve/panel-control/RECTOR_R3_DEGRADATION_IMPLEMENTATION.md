# R3 — Implementación de degradación (corrección final — partial aislado)
## Actualizacion vigente R3 permanente - 2026-07-21

- Migracion incremental: `20260721173000_eve_r3_permanent_wiring_closure.sql`.
- Auditoria tecnica: `R3_PERMANENT_WIRING_TECHNICAL_AUDIT.md`.
- `policyAuthorized` eliminado del contrato HTTP/cliente.
- Helper cross-consultant cerrado; authenticated usa helper ligado a `auth.uid()`.
- Grants ambiguos autogenerados no cuentan como capabilities efectivas de mutacion.
- `reopen_block` y `session_reset` quedan deny-by-default sin politica factual server-side.
- Validacion fisica desde cero pendiente: `npx supabase db reset` + Runtime real + Panel real en dos casos.

**Dictamen vigente:** R3 � HARDENING DE CARGA, ERROR Y DEGRADACI�N BLOQUEADO

## Soft-refresh

Éxito: snapshot → refreshing → reemplazo → limpia `refreshFailure` → ready/partial/stale según payload.

Fallo primario con snapshot: conserva snapshot + `refreshFailure` + `requestId` → `screenState=stale`.

## Agregación por superficie

```ts
type PanelAggregationCompleteness = {
  companyStateComplete: boolean;
  nextStepComplete: boolean;
  attentionComplete: boolean;
};
```

Cadena única:

fuentes factuales → `resolvePanelAggregationCompleteness` → una `PanelAggregationCompleteness` → KPI + workspace + `AttentionGovernancePanel(attentionComplete)`.

### Dependencias

| Fuente | Estado actual | Próximo paso | Atención |
|--------|---------------|--------------|----------|
| `experience` | sí | no | sí |
| `core_milestones` | no | sí | no |
| `manual_work` | no | no | sí |
| `parallel_production` | no | no | sí |

Fallo exclusivo de Atención (manual/PP) **no** cambia `companyStateComplete` / `nextStepComplete`.

### Semántica `dataStatus`

Solo `available` completa. `partial` / `stale` / `unavailable` / `error` → incompleta.

### Independencia de subvista

Completitud no usa `selectedView` / tabs. Manual y PP cargan con caso autorizado.

## Escenario E2E partial (precondiciones exactas)

Antes de provocar el fallo de Experiencia, exigir **strict `ready`** (no `ready|partial`):

1. Contexto Empresa–Relación–Caso listo (sin “Cargando empresas/casos/contexto”).
2. Eje X `support-process-axis` → `data-screen-state=ready`.
3. Eje Y `core-milestone-rail` → `data-screen-state=ready`.
4. Participantes `recursive-monitoring-users` → `ready`.
5. Producción Paralela → `ready`.
6. Atención completa (`data-attention-complete=true`) — implica manual + parallel + experience evaluados.
7. KPI Alertas de experiencia ≠ `—`.

Después: **solo** `**/experience-state**` → HTTP **503** controlado (JSON mínimo de transporte; sin payload de dominio fabricado).

### Resultado obligatorio

- Estado actual según fuente completa (experience incompleta → No disponible).
- Próximo paso según fuente completa (milestones ready → valor factual).
- Atención degradada (`attentionComplete=false`); Alertas = `—`.
- Aviso partial localizado en drawer; retry localizado.
- Eje X / Eje Y sin error; sin loading; sin fatal global.
- Captura sin: “Procesos de soporte…degradad”, “Cargando casos/contexto”, “No fue posible cargar esta sección”.

## Drawer

- Recibe `attentionComplete: boolean` canónico.
- `sourceStates` solo para localizar fuente degradada + retry.
- No recalcula completitud desde sourceStates / vista / tabs / conteos.
- `attentionComplete=false` → aviso parcial; conteos dependientes `—`; no “Sin alertas”.
- `attentionComplete=true` + fuentes vacías evaluadas → “Sin alertas” / “Ninguno” permitido.

## Evidencia

- `reports/local/rector-r3-degradation/screenshots/03-partial.png` regenerada.
- Unit R3: 35 PASS (incluye display comportamental).
- Playwright R3: PASS.
- Playwright §§15–17: PASS tras corrección causa **A** (service role efímero en proceso Next; ver `RECTOR_R3_DICTAMEN.md` y `reports/local/rector-r3-degradation/diagnostics/`).

## Corrección final — rail / vacío / capability (2026-07-21)

- Rail colapsado: `.railYTitle` + toggle con `horizontal-tb` (parity Hitos Core); lock responsive `!important`; E2E Amber horizontal en 1440/1024/390.
- Drawer: sin placeholder obsoleto; vacío factual vía `attentionComplete`.
- Capability canónica: `GET experience-state.capabilities` → `send_support_message.allowed` vía `eve_consultant_has_panel_capability_for`; POST en `eve_apply_experience_action_as_consultant` (TX + lock + hash); service_role no sustituye allow ni hace DML de ledger.
- Aprovisionamiento: `eve_grant_consultant_panel_capability` (test-only seed); verificador sin mutaciones de grants.
- Migración permanente: `20260721160000_eve_r3_experience_capability_idempotency_hardening.sql`.
- Verificador: `actionId`/`requestId` + idempotencia; capturas `11`/`12`/`13` regeneradas.
