# R3 — Experience capability provisioning & transactional idempotency

## Permanent rules

1. **Assignment ≠ capability.** An enabled `consultant_company_assignments` row grants scope discovery only.
2. **Mutation capabilities** (`send_support_message`, `request_reentry`, `mark_manual_review`) require an **explicit** row in `eve_consultant_panel_capability_grant` with validity window and provenance.
3. **No automatic backfill** after `20260721160000_eve_r3_experience_capability_idempotency_hardening.sql` (prior auto-grants for those three caps are deleted by that migration).
4. **Admin RPCs only:** `eve_grant_consultant_panel_capability` / `eve_revoke_consultant_panel_capability` (service_role / `eve_require_official_context_admin`). Self-grant forbidden. Direct table DML revoked from `service_role`.
5. **Audit:** append-only `eve_consultant_panel_capability_grant_audit`.

## GET / POST meaning

```
allowed = grant explícito vigente
        ∧ assignment vigente
        ∧ scope correcto
```

Computed via `eve_consultant_has_panel_capability_for` (GET experience-state + POST pre-check).  
POST revalidates inside `eve_apply_experience_action_as_consultant`.

## Transactional idempotency

`eve_apply_experience_action_as_consultant` (authenticated JWT):

1. `auth.uid()` session
2. case access + explicit capability
3. `pg_advisory_xact_lock(actor + idempotency_key)`
4. canonical `sha256` hash inside PostgreSQL
5. ledger lookup → replay or `IDEMPOTENCY_CONFLICT`
6. `FOR UPDATE` on case
7. `eve_apply_experience_support_action`
8. insert `experience_action_idempotency` in the **same** transaction

BFF no longer reads/writes the ledger. Unique-index races are not the governance path.

## Ledger immutability

`experience_action_idempotency`, `experience_support_action`, `experience_screen_event`:

- `REVOKE INSERT/UPDATE/DELETE/TRUNCATE` from `anon`, `authenticated`, `service_role`
- BEFORE UPDATE/DELETE (ROW) + BEFORE TRUNCATE (STATEMENT) triggers — no exceptions

## Test-only flow

```
provision-point15-17-experience-capabilities.mjs  → ends
verify-point15-17-action-chain.mjs                 → read-only grants
probe-point15-17-concurrency.mjs                   → Promise.all
verify-runtime-to-panel-wiring.mjs                 → Runtime→Panel
```

## Dependencies

- `next@16.2.11` + override `sharp@0.35.3`
- `npm audit --omit=dev` → **0** high/critical
