# EVE Production Activation P3 — Supabase / RLS / Schema Real Closeout

## Dictamen

EVE_PRODUCTION_ACTIVATION_P3_SUPABASE_RLS_SCHEMA_REAL_COMPLETED

## Plan Phase

Production activation — P3 Supabase / RLS / schema real

## Supabase Environment Report (pre-migration)

| Item | Value |
|---|---|
| MCP linked project host | `bwflscplkjohdhkiqqoc.supabase.co` |
| Environment label in repo/MCP | **Not explicitly tagged** as local, preview, or staging |
| Classification for P3 | **Remote hosted project — treated as production-final; not modified** |
| Supabase CLI | **Not installed** (`supabase` command unavailable) |
| `supabase/config.toml` | **Missing** |
| Local Supabase stack | **Not available** |
| Preview/staging target | **Not configured** in repo |
| Migrations applied in P3 | **None** (file created only) |
| MCP read-only inspection | Used to inventory remote tables/RLS; no DDL via MCP |

The MCP-linked project already contains Runtime 40/20 tables (without `eve_` prefix), many with RLS enabled, but with column shapes that differ from the P3 contract (e.g. `tenant_id text`, `case_id text`, `parallel_export_payload` absent). P3 delivers an idempotent migration for **local/preview/staging** application only.

## Scope Delivered

- P3.1 Supabase project / CLI readiness inspection
- P3.2 Runtime 40/20 schema migration (`20260708123000_eve_runtime_40_20_p3_schema_rls.sql`)
- P3.3 RLS policies (tenant + case scoped, fail-closed)
- P3.4 Tenant / case / role / activity / run scope columns
- P3.5 Audit trail schema (`runtime_audit_trail`)
- P3.6 Service-role client exposure guard (static scan)
- P3.7 Static schema/RLS validation (local DB apply not available)
- P3.8–P3.10 Command results, boundary ledger, closeout

## Auth Integration Note

RLS helpers bridge to existing Capa 1 ownership:

- `eve_current_tenant_id()` → `usuarios.empresa_id` / JWT `tenant_id`
- `eve_can_access_case(case_id)` → `sesiones_llenado.id` owned by `auth.uid()`

`required_auth_integration_gap`: dedicated Runtime 40/20 case membership beyond `sesiones_llenado.id` remains for P4 wiring.

## BFF Boundary (unchanged)

- BFF routes from P2 remain `dependency_blocked` for persistence
- `bff_supabase_schema_ready = true`
- `bff_runtime_persistence_ready_for_p4 = true`
- `bff_writes_real_runtime_records = false`

## Command Results

| Command | Status |
|---|---|
| `npx tsc --noEmit` | passed |
| `npm run build` (from `C:/eve/platform`) | passed |
| client-bff test | passed |
| client-membrane test | passed |
| `p3-validate-runtime-schema.mjs` | passed |
| `p3-validate-rls-policies.mjs` | passed |
| `p3-scan-service-role-exposure.mjs` | passed |
| `supabase db lint` | not_run (CLI unavailable) |
| `supabase db reset` | not_run (no local stack) |

## Next Authorization

NEXT_AUTHORIZATION_REQUIRED: **true**

NEXT_TREE_POINT: **P4 — Runtime 40/20 real behind Significado, only after P3 accepted**
