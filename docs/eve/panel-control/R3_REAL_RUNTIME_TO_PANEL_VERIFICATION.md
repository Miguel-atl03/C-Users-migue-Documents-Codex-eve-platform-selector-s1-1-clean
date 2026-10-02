# R3 Real Runtime to Panel Verification

## Vigent Final Closure - 2026-07-22

Status vigente: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.

Evidence file: `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Supersedes the earlier blocked notes in this file. The final run started from `npx supabase db reset`, applied only repository migrations, enabled the real local Runtime through canonical flags, and completed the two-case physical Runtime -> Panel circuit.

Canonical enablement:
- `runtime_real_enabled` is calculated in `src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts`.
- Required flags for the local physical proof: `EVE_RUNTIME_40_20_LOCAL_ENABLED=true`, `EVE_GATES_READINESS_LOCAL_ENABLED=true`, `EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED=true`.
- Required adapter: `src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter.ts`.
- Original 503 cause: port 3000 was not running with the canonical local Runtime flags; after enabling them, the real defect was a non-UUID `catalog_version_id`, now replaced by the canonical UUID catalog id.

Runtime/product boundary:
- Runtime BFF session/interaction/answer routes now require bearer auth, use the authenticated Supabase client, validate `eve_can_access_case`, and write Runtime records as the authenticated operative user.
- `experience-event` writes use `eve_record_experience_event_as_user`; actor is derived from `auth.uid()`.
- `created_by = null` remains accepted only for factual local-adapter provenance (`local_only=true`, `source_trace.stage=p4_runtime_real_local`, expected Runtime object), not as a global bypass.
- `eve_admin_prepare_runtime_panel_case` is retained only for identities, company/case context, assignments and grants. It creates no Runtime session, run, screen event, support request or methodological state. It is now repeat-safe for existing operative `auth_user_id`.

Final physical counters:
- `runtime_real_enabled=true`
- `dependency_blocked=false`
- `runtimeEventsCreatedByServiceRole=0`
- `crossCaseRuntimeEvents=0`
- `crossCaseSupportActions=0`
- `amberProductEvents=0`
- `amberProductActions=0`
- `idempotencyConcurrencyFailures=0`
- `softRefreshReadbackFailures=0`

Final gates rerun after the clean reset and fixes: physical A/B verifier PASS, Playwright §§15-17 PASS, Playwright R3 PASS, R1 PASS, R2 PASS, R3 permanent regression PASS, TypeScript PASS, lint touched PASS, DB lint exit 0 with only the preexisting unused `p_actor_label` warning, build PASS, `npm audit --omit=dev` PASS, manifest scan PASS, secret scan PASS, legacy freeze PASS.

Date: 2026-07-21

## Update - Final Authenticated Event Closure

- Added incremental migration `20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`.
- Added authenticated Runtime BFF endpoint: `src/app/api/eve/runtime-40-20/client-bff/experience-event/route.ts`.
- Product/runtime screen events now have an authenticated RPC path: `eve_record_experience_event_as_user`.
- The RPC derives the actor from `auth.uid()` and does not accept `user_id` from the body as authority.
- Optional runtime session and activity identifiers are checked against the same case and authenticated actor.
- Panel `panel_*` instrumentation is allowed only for an authenticated consultant with case access.
- `experience-events` no longer uses a service-role client for product/panel event writes.
- Clean install via `npx supabase db reset`: PASS after the new migration.
- Build: PASS.
- File-scoped lint for touched files: PASS.
- `npm audit --omit=dev`: PASS, 0 vulnerabilities.

## Current Verification Status

Code-level wiring has been hardened for the Runtime -> Panel path. A clean local Supabase reset was completed after the incremental migration was added.

## Implemented Preconditions

- Product action cannot rely on service_role DML for support actions.
- Consultant action goes through authenticated BFF and transactional RPC.
- `policyAuthorized` from the browser is removed from the action contract.
- Explicit grants are required for support mutations.
- Ambiguous auto grants do not count as effective mutation grants.
- Amber remains untouched by the new migration and code changes.

## Completed Physical Checks

- `npx supabase db reset` completed successfully after applying `20260721173000_eve_r3_permanent_wiring_closure.sql`.
- `npx supabase db reset` completed successfully again after applying `20260721180000_eve_r3_authenticated_runtime_events_upgrade_closure.sql`.
- `npx supabase db lint` completed with exit code 0.
- Remaining DB lint note: preexisting warning for unused `p_actor_label` in `eve_record_experience_screen_event`.
- Static R3 regression for authenticated event RPC and no event service_role writes: PASS.

## Required Physical Proof Still Pending

- official provisioning only
- real runtime user login
- real product screen event
- real support request
- independent consultant login
- panel read
- governed consultant action
- soft refresh proof
- same flow in two cases
- Amber zero product events/actions

## Physical A/B Attempt - 2026-07-21

Scope executed: pending integral Runtime -> Panel test only. R4 was not started, the rail was not touched, and Amber was not populated.

- Clean base: `npx supabase db reset` completed after official migrations.
- Official provisioning gap found and fixed by adding administrative RPC `eve_admin_prepare_runtime_panel_case` for local case preparation.
- Test harness added: `scripts/eve/official-control-panel/verify-r3-runtime-panel-physical-ab.mjs`.
- Two isolated contexts reached pre-product provisioning, but the first runtime session call stopped at the Runtime BFF.
- Blocking response: `runtime_session_failed_A:503`, with `dependency_blocked=true` and `runtime_real_enabled=false`.
- Because Runtime session did not open, no `screen_entered`, `support_requested`, consultant action, idempotency replay, or A/B isolation product check could be completed physically.
- Product event/action result for this blocked run: no accepted runtime product event, no support action, Amber product events/actions remain zero.

Physical dictamen: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION BLOQUEADO**.

## Dictamen

R3 — HARDENING DE CARGA, ERROR Y DEGRADACIÓN BLOQUEADO
## Final Physical Closure - 2026-07-21

Evidence file: `reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json`.

Blocking cause audited:
- `runtime_real_enabled` is calculated in `src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts`.
- Canonical flags: `EVE_RUNTIME_40_20_LOCAL_ENABLED=true`, `EVE_GATES_READINESS_LOCAL_ENABLED=true`, `EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED=true`.
- Required adapter: `src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-local-adapter.ts`.
- Exact original 503 cause: the port 3000 process was not running with the canonical local Runtime flags. After enabling it, a real defect surfaced: routes passed non-UUID `catalog_version_id = "runtime-local-catalog"` into UUID columns.
- Canonical enablement procedure: start the test process with the three flags above, local Supabase URL, and authenticated Runtime BFF calls.

Corrections applied:
- Runtime session, interaction and answer BFF routes now require an authenticated user.
- Runtime product rows are written with an authenticated Supabase client under RLS, not through product `service_role`.
- Local Runtime catalog id is UUID `00000000-0000-4000-8000-000000000040`.
- `created_by = null` is no longer accepted globally by event validation. It is accepted only for factual local adapter rows with `metadata.local_only=true` and `source_trace.stage=p4_runtime_real_local`.
- `eve_admin_prepare_runtime_panel_case` remains limited to test-only identity/context preparation.

Physical A/B result:
- Case A and Case B completed Runtime session, `screen_entered`, `support_requested`, panel visibility, `send_support_message.allowed=true`, action, audit and soft-refresh readback.
- Cross isolation denied User A -> Case B, Consultant A -> Case B, Consultant B -> Case A, with zero cross-case events/actions.
- Concurrency used `Promise.all`; same key/payload returned the same actionId and one action; same key/different payload returned 409 `IDEMPOTENCY_CONFLICT`.

Critical counters: `runtimeEventsCreatedByServiceRole=0`, `grantAuditWithoutRequestId=0`, `legitimateGrantsDeleted=0`, `ambiguousGrantsSilentlyDisabled=0`, `crossCaseRuntimeEvents=0`, `crossCaseSupportActions=0`, `Amber product events/actions=0`.

Final dictamen: **R3 - HARDENING DE CARGA, ERROR Y DEGRADACION APTO PARA PROMOCION A PRODUCCION**.
