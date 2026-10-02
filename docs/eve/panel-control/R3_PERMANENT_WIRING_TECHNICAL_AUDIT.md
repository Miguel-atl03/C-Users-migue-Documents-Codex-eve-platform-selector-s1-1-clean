# R3 Permanent Wiring Technical Audit

Date: 2026-07-21

## Update - 2026-07-21 Final Authenticated Event Closure

Implemented after this audit:

- `20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`
- `eve_record_experience_event_as_user`
- `src/app/api/eve/runtime-40-20/client-bff/experience-event/route.ts`
- `experience-events` route now calls the authenticated user RPC instead of a service-role client

The new RPC derives the event actor from `auth.uid()`, validates case ownership for runtime users, validates consultant case access only for `panel_*` instrumentation, checks optional runtime session/activity scope, enforces screen/event/status compatibility, and stores a server-side idempotency hash in append-only event metadata.

## Scope

Audited circuit: `consultant_company_assignments`, `eve_consultant_panel_capability_grant`, grant/revoke RPCs, capability helpers, transactional action RPC, `experience_action_idempotency`, `experience_support_action`, `experience_screen_event`, `experience-actions` BFF, `experience-state` BFF, and screen instrumentation.

Canonical sources used: `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`, `RECTOR_R1_*`, `RECTOR_R2_*`, `RECTOR_R3_*`, and `RECTOR_POINTS_18_25_*`. Excluded: `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`.

## Findings

1. `consultant_company_assignments` is the company/case access scope. It must not imply mutation capabilities.

2. `20260720110000_eve_r2_manual_capability_grants.sql` creates `eve_consultant_panel_capability_grant` and auto-backfills manual-work capabilities for active assignments.

3. `20260720130300_eve_experience_action_idempotency.sql` extends the capability list and auto-backfills `send_support_message`, `request_reentry`, `mark_manual_review`, and `view_experience_state`.

4. `20260721160000_eve_r3_experience_capability_idempotency_hardening.sql` contains a broad delete by capability name. That can delete legitimate explicit grants and does not preserve per-row revocation history.

5. Grants are created by `eve_grant_consultant_panel_capability` and revoked by `eve_revoke_consultant_panel_capability`. The RPCs validate admin context, consultant, active assignment, known capability, reason, and validity. The audit table did not have a dedicated `request_id` column.

6. `eve_consultant_has_panel_capability_for` accepts a consultant UUID and was executable by `authenticated`, allowing consultant A to probe consultant B if A knows B's UUID.

7. `experience-actions` validates case access and capability server-side, but still accepted `policyAuthorized` from the browser and passed it to SQL.

8. The transactional RPC computes a server hash, but the previous hash omitted `companyId`, `relationshipId`, normalized `effectPayload`, `sourceVersion`, and server-side policy reference. It also included a client-controlled policy boolean.

9. The idempotency lock is acquired before reading the ledger, which is the right pattern, but the canonical hash needed to cover every semantic field.

10. `experience_action_idempotency`, `experience_support_action`, and `experience_screen_event` have append-only revokes and triggers. Writes occur via governed RPC with `eve.experience_rpc`.

11. `experience-events` for the panel still uses service_role for panel screen instrumentation and dedupe. The permanent Runtime -> Panel proof must not fabricate product Runtime events with service_role.

12. No factual server-side policy table was found for `reopen_block` or `session_reset`. Per R3, those actions must remain blocked even if a browser sends an authorization flag.

## Correction Decisions

1. Do not edit applied migrations. Add an incremental migration after `20260721160000`.

2. Do not delete grants by capability name. Ambiguous auto-backfilled mutation grants become ineffective unless they have explicit provenance: `granted_by`, `grant_reason`, validity, enabled status, and no revocation.

3. Close `eve_consultant_has_panel_capability_for` as an internal helper. Expose only `eve_consultant_has_panel_capability(company, capability)` to authenticated clients; it binds authority to `auth.uid()`.

4. Update BFF reads to call the bound helper and stop passing consultant UUIDs into capability checks.

5. Remove `policyAuthorized` from the HTTP/client contract. If sent by an old client, it is ignored. `reopen_block` and `session_reset` remain blocked until a factual server-side policy is materialized.

6. Recompute idempotency hash inside SQL with actor, company, relationship, case, user, runtime session, activity, screen, action, normalized reason, before-state, source version, normalized effect payload, and policy reference.

7. Add regression coverage for no broad grant deletion, no client policy authorization, no cross-consultant helper exposure, and effect payload participation in the canonical hash.
