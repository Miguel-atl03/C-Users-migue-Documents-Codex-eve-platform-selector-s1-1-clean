# Cierre final vigente R3 - 2026-07-22

Dictamen vigente: R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION.

Evidencia final: reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json.

Actualizacion final:
- Runtime real habilitado por flags canonicos locales: EVE_RUNTIME_40_20_LOCAL_ENABLED, EVE_GATES_READINESS_LOCAL_ENABLED, EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED.
- runtime_real_enabled=true y dependency_blocked=false en el cierre fisico.
- eve_admin_prepare_runtime_panel_case queda limitado a preparacion administrativa test-only y ahora es repetible para auth_user_id operativo existente.
- created_by=null queda restringido a procedencia factual del adapter local, no como bypass global.
- Caso A y Caso B completaron Runtime oficial, evento real, solicitud, panel oficial, accion transaccional, auditoria y readback.
- Cruces A/B denegados sin fuga; actionId de A no visible en B.
- Promise.all probo idempotencia fisica: misma key/payload => mismo actionId y una sola accion; misma key/payload distinto => IDEMPOTENCY_CONFLICT.
- Amber product events/actions = 0.
- Playwright 15-17 PASS, Playwright R3 PASS, R1 PASS, R2 PASS, R3 permanente PASS, TypeScript PASS, lint tocados PASS, DB lint exit 0 con advertencia preexistente de p_actor_label, build PASS, audit PASS, manifest PASS, secret scan PASS, legacy freeze PASS.
- R4 no fue iniciado.

---
# Final Production Readiness Update - 2026-07-21

**Dictamen vigente:** R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION.

Final physical evidence: `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Status changes:
- Runtime -> Panel fisico en dos casos non-Amber: PASS.
- `runtime_real_enabled=true` in the test process through canonical local flags.
- `dependency_blocked=false` for the physical session path.
- Runtime sessions/runs are created by authenticated Runtime BFF under RLS with `created_by=auth.uid()`.
- Product Runtime events are created by `eve_record_experience_event_as_user`, not by `service_role`.
- `runtimeEventsCreatedByServiceRole=0`, `crossCaseRuntimeEvents=0`, `crossCaseSupportActions=0`, `Amber product events/actions=0`.

# R3 — Production readiness (permanent hardening)
## Actualizacion vigente R3 permanente - 2026-07-21

- Migracion incremental: `20260721173000_eve_r3_permanent_wiring_closure.sql`.
- Migracion incremental final: `20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`.
- Auditoria tecnica: `R3_PERMANENT_WIRING_TECHNICAL_AUDIT.md`.
- `policyAuthorized` eliminado del contrato HTTP/cliente.
- Helper cross-consultant cerrado; authenticated usa helper ligado a `auth.uid()`.
- Grants ambiguos autogenerados no cuentan como capabilities efectivas de mutacion.
- Eventos runtime/panel migrados a RPC autenticada `eve_record_experience_event_as_user`; actor = `auth.uid()`.
- `reopen_block` y `session_reset` quedan deny-by-default sin politica factual server-side.
- Instalacion limpia `npx supabase db reset`: PASS.
- Validacion fisica pendiente: Runtime real + Panel real en dos casos independientes.

**Dictamen vigente:** R3 � HARDENING DE CARGA, ERROR Y DEGRADACI�N BLOQUEADO

## Checklist

- [x] Assignment ≠ mutation capability
- [x] Admin grant/revoke RPCs + audit append-only
- [x] GET/POST `allowed` = grant ∧ assignment ∧ vigencia
- [x] Single TX `eve_apply_experience_action_as_consultant` (lock + hash + ledger)
- [x] No service_role direct DML on grants/ledgers
- [x] Append-only UPDATE/DELETE/TRUNCATE triggers
- [x] Verifier without grant mutations + DML denial probes
- [x] Concurrency Promise.all probe
- [ ] Runtime -> Panel fisico en dos casos (non-Amber)
- [x] `npm audit --omit=dev` high/critical = 0 (`sharp@0.35.3` override)
- [x] Drawer vacío factual / attentionComplete (previo)

**Dictamen:** BLOQUEADO - `RECTOR_R3_DICTAMEN.md`

No se inicia R4.

## Physical Runtime -> Panel A/B - 2026-07-21

Readiness remains blocked after the physical A/B attempt.

- Clean DB reset: PASS.
- Administrative provisioning RPC for local runtime-panel case setup: added and applied by migration.
- Runtime BFF session in Case A: BLOCKED, HTTP 503.
- Blocking body: `dependency_blocked=true`, `runtime_real_enabled=false`.
- Runtime product events: not created.
- Consultant panel action/readback: not reached.
- Cross-case isolation and physical idempotency: not reached.
- Amber product events/actions: zero because the product path never accepted an event.

Production promotion is not authorized from this run.
