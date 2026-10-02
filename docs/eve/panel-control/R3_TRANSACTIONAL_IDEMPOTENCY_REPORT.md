# Final Physical Closure Addendum - 2026-07-22

Status vigente: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

Supersedes the earlier blocked note below. Physical idempotency is PASS in `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Evidence:
- Concurrency used `Promise.all`.
- Same idempotency key plus same payload returned the same `actionId`.
- Only one support action was created.
- Same key plus different `effectPayload` returned HTTP 409 / `IDEMPOTENCY_CONFLICT`.
- No additional action was created by the conflict attempt.
- The physical verifier was rerun after clean reset and after making the admin preparer repeat-safe for existing operative auth users.

Final dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

# Final Physical Closure Addendum - 2026-07-21

Physical idempotency is now PASS in `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Evidence:
- Concurrency used `Promise.all`.
- Same idempotency key plus same payload returned the same `actionId`.
- Only one support action was created.
- Same key plus different `effectPayload` returned HTTP 409 / `IDEMPOTENCY_CONFLICT`.
- No additional action was created by the conflict attempt.

Final dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

# R3 Transactional Idempotency Report

Date: 2026-07-21

## Implemented Controls

- The BFF no longer supplies or computes a request hash.
- The RPC acquires `pg_advisory_xact_lock(actorId + idempotencyKey)` before reading the ledger.
- The canonical hash is computed inside PostgreSQL.
- The canonical hash includes actor, company, relationship, case, user, runtime session, activity, screen, action, normalized reason, before-state, source version, normalized effect payload, and policy reference.
- Same key plus same semantic payload returns the same stored response.
- Same key plus different semantic payload raises `IDEMPOTENCY_CONFLICT`.

## Payload Normalization

`effectPayload` must be a JSON object. Unsupported keys are removed before hashing and persistence. Supported keys are sorted deterministically through `jsonb_object_agg(key, value order by key)`.

## Evidence

- Migration: `20260721173000_eve_r3_permanent_wiring_closure.sql`
- Migration: `20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`
- Regression: `official-control-panel-r3-permanent-wiring.test.mjs`

## Runtime Event Idempotency

- Runtime events use `eve_record_experience_event_as_user`.
- The RPC requires `request_id` and `idempotency_key`.
- The actor is `auth.uid()`.
- Same authenticated actor plus same event `request_id` and same server hash returns the existing event.
- Same authenticated actor plus same event `request_id` and different semantic payload raises `IDEMPOTENCY_CONFLICT`.
- The event hash includes actor, company, relationship, case, screen, event type, expected status, runtime session, activity, session reference, source version, and metadata.

## Physical A/B Closure Note - 2026-07-21

The physical Promise.all idempotency proof could not be reached. The A/B Runtime -> Panel verifier stopped at Runtime session creation in Case A: HTTP 503, `dependency_blocked=true`, `runtime_real_enabled=false`.

No physical support action or idempotency ledger was created in this blocked run. Existing regression-level idempotency controls remain in place, but production promotion remains blocked until the physical Runtime -> Panel path reaches support action creation and replay.

Dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION BLOQUEADO**.
