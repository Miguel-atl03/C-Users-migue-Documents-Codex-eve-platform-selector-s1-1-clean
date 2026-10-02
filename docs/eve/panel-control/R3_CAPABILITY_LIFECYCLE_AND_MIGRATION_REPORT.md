# Final Physical Closure Addendum - 2026-07-22

Status vigente: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

Supersedes the earlier blocked note below. Physical A/B verification is PASS with evidence in `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Lifecycle conclusions:
- `eve_admin_prepare_runtime_panel_case` is retained only for test-only identity/context preparation; it does not create Runtime sessions, runs, screen events, support requests or methodological state.
- The admin preparer now reuses an existing operative `auth_user_id` instead of creating duplicate `usuarios` rows, so repeated physical runs remain valid.
- Explicit `send_support_message` grants were used in Case A and Case B with audit/request provenance.
- FX-08 Playwright setup now grants manual-work capabilities through `eve_grant_consultant_panel_capability`, not direct grant-table DML, so R3 explicit provenance is preserved.
- `grantAuditWithoutRequestId=0`, `legitimateGrantsDeleted=0`, `ambiguousGrantsSilentlyDisabled=0`.
- Cross-case attempts returned 403 and produced zero leaked events/actions.

Final dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

# Final Physical Closure Addendum - 2026-07-21

Physical A/B verification is now PASS with evidence in `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Lifecycle conclusions:
- `eve_admin_prepare_runtime_panel_case` is retained only for test-only identity/context preparation; it does not create Runtime sessions, runs, screen events, support requests or methodological state.
- Explicit `send_support_message` grants were used in Case A and Case B with audit/request provenance.
- `grantAuditWithoutRequestId=0`, `legitimateGrantsDeleted=0`, `ambiguousGrantsSilentlyDisabled=0`.
- Cross-case attempts returned 403 and produced zero leaked events/actions.

Final dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

# R3 Capability Lifecycle and Migration Report

Date: 2026-07-21

Status: implemented as incremental hardening in `supabase/migrations/20260721173000_eve_r3_permanent_wiring_closure.sql`.

## Update - Upgrade Closure

Additional closure was implemented in `supabase/migrations/20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`.

- Grant audit now carries `grant_id`, `relationship_id`, `case_id`, `granted_by`, `revoked_by`, and non-null `request_id`.
- Grant audit insert rejects missing `request_id`.
- Grant audit remains append-only through the existing UPDATE/DELETE/TRUNCATE triggers.
- Explicit grants deleted by the earlier broad hardening can be restored only when factual grant audit provenance exists.
- Ambiguous grants are not deleted or silently disabled by the new migration. They are surfaced through `eve_r3_ambiguous_capability_grants_for_review` for administrative review.
- The new migration still does not delete grants by capability name.

## Result

- No applied migration was edited.
- No grants are deleted by capability name in the new migration.
- Ambiguous auto-backfilled mutation grants are not silently removed; they are made ineffective unless explicit provenance exists.
- Effective mutation capability now requires explicit grant provenance, active assignment, active validity window, enabled status, and no revocation.
- `eve_consultant_has_panel_capability_for` is internal-only after the new migration.
- Authenticated callers use `eve_consultant_has_panel_capability(company, capability)`, bound to `auth.uid()`.
- `reopen_block` and `session_reset` are known capabilities but denied by server-side policy because no factual policy table exists yet.

## Evidence

- Migration: `20260721173000_eve_r3_permanent_wiring_closure.sql`
- Regression: `official-control-panel-r3-permanent-wiring.test.mjs`
- Audit: `R3_PERMANENT_WIRING_TECHNICAL_AUDIT.md`

## Physical A/B Closure Note - 2026-07-21

The lifecycle/migration controls remain necessary but are not sufficient for promotion. The physical Runtime -> Panel A/B verifier stopped before product event creation because Runtime BFF session returned HTTP 503 with `dependency_blocked=true` and `runtime_real_enabled=false`.

Capability grants for the test contexts were prepared through administrative RPCs, but no consultant capability was exercised physically because no support request reached the panel.

Dictamen impact: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION BLOQUEADO**.
