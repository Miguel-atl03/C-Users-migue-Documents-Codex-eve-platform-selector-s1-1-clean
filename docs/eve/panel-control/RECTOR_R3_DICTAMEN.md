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
# Final R3 Dictamen Update - 2026-07-21

**R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**

Final physical evidence: `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

The earlier `runtime_real_enabled=false` blocker was traced to local process configuration and a real UUID catalog defect. The canonical local Runtime flags were supplied only to the test process, the UUID defect was corrected, product Runtime writes now run through authenticated RLS, and `service_role` remains outside product flow.

R4 not started. Amber not populated.

# Dictamen R3 — Hardening de carga, error y degradación
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

## Veredicto

**R3 � HARDENING DE CARGA, ERROR Y DEGRADACI�N BLOQUEADO**

Fecha: 2026-07-21 (corrección permanente: capabilities / idempotencia / ledger / deps).  
R4 no iniciado. Amber no poblado.

## Correcciones permanentes de esta corrida

### Capabilities explícitas
- Migración `20260721160000_eve_r3_experience_capability_idempotency_hardening.sql`
- Elimina grants automáticos de `send_support_message` / `request_reentry` / `mark_manual_review`
- `eve_grant_consultant_panel_capability` / `eve_revoke_consultant_panel_capability`
- GET/POST vía `eve_consultant_has_panel_capability_for` (grant ∧ assignment ∧ vigencia)

### Idempotencia transaccional
- `eve_apply_experience_action_as_consultant` con `pg_advisory_xact_lock` + hash interno + ledger en la misma TX
- BFF ya no hace read→RPC→insert del ledger

### Ledger inmutable
- REVOKE DML directo a `service_role` sobre grants y ledgers de experiencia
- Triggers UPDATE/DELETE/TRUNCATE sin excepciones

### Dependencias
- `next@16.2.11` + override `sharp@0.35.3`
- `npm audit --omit=dev` → **0** vulnerabilidades

## Evidencia

| Probe | Resultado |
|-------|-----------|
| verify-point15-17-action-chain | PASS (`serviceRoleDirectDmlGrants=0`) |
| probe-point15-17-concurrency | PASS (mismo actionId; IDEMPOTENCY_CONFLICT) |
| verify-runtime-to-panel-wiring | PENDIENTE (prueba fisica A/B no ejecutada) |
| Unit R3 / legacy freeze / tsc | PASS |

Docs: `R3_EXPERIENCE_CAPABILITY_PROVISIONING_AND_IDEMPOTENCY.md`, `R3_RUNTIME_TO_PANEL_PERMANENT_WIRING_REPORT.md`.

## Fuera de alcance

- R4
- Poblar Amber
- Compensar producto con seeds dentro del verificador

## Cierre fisico A/B - 2026-07-21

Se ejecuto la prueba pendiente desde base limpia con `npx supabase db reset`. El aprovisionamiento de identidades/contexto se limito a RPC administrativa y no se insertaron eventos/actions de producto mediante SQL.

Resultado: **BLOQUEADO**. El circuito se detuvo antes del primer evento Runtime porque `GET /api/eve/runtime-40-20/client-bff/session` respondio 503 con `dependency_blocked=true` y `runtime_real_enabled=false`.

Efecto de cierre:
- Caso A y Caso B no alcanzaron escritura de evento real.
- No hubo accion transaccional de panel ni readback fisico.
- No se pudo ejecutar aislamiento cruzado ni idempotencia fisica porque no existia solicitud de soporte aceptada.
- Amber permanecio sin eventos/actions de producto.

**Dictamen vigente:** R3 - HARDENING DE CARGA, ERROR Y DEGRADACION BLOQUEADO.
