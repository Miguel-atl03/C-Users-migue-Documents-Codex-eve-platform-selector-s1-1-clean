# EVE Production Activation P3-R — Supabase Environment Binding and Migration Application Closeout

## Dictamen

EVE_PRODUCTION_ACTIVATION_P3R_SUPABASE_ENVIRONMENT_BINDING_MIGRATION_APPLICATION_COMPLETED

## Plan Phase

Production activation — P3-R Supabase environment binding and migration application

## Remediation Summary

P3 created the Runtime 40/20 schema/RLS migration and passed static validators, but could not apply DDL because the only MCP-linked Supabase project (`bwflscplkjohdhkiqqoc.supabase.co`) is unlabeled and was treated as production-final.

P3-R established a **safe non-production target** (Supabase local via CLI + Docker), applied migrations there, validated live schema and RLS, and documented read-only remote drift without touching production.

## Environment Report

| Item | Value |
|---|---|
| Supabase CLI | Available via `npx supabase` (2.109.1) |
| Docker | Available (29.5.3); Desktop required start |
| `supabase/config.toml` | Created by `npx supabase init` |
| `supabase/migrations` | Present (5 files after P3-R bridge) |
| MCP remote host | `bwflscplkjohdhkiqqoc.supabase.co` |
| MCP classification | **unknown / production-final** |
| Safe target used | **Supabase local** (`project_id=eve-platform`, `127.0.0.1:54321`) |
| Preview/staging explicit | **No** |
| Production remote touched | **No** |

## Migration Application

| Item | Status |
|---|---|
| P3 migration file | `supabase/migrations/20260708123000_eve_runtime_40_20_p3_schema_rls.sql` |
| P3-R local prerequisite | `supabase/migrations/20260708122000_eve_p3r_capa1_auth_bridge_minimal.sql` |
| Apply method | `npx supabase start` + `npx supabase db reset` |
| Local migration status | **Applied successfully** |
| `supabase db lint` | **Passed** |

### P3-R Capa 1 bridge (local only)

P3 auth helpers reference `public.usuarios` and `public.sesiones_llenado`. These Capa 1 tables exist on the remote hosted project but were absent from repo migrations. A minimal local-only bridge migration was added **before** P3 so helper functions compile and RLS can be validated locally. Production remote was not modified.

## Real Validation Results

### Schema (live local Postgres)

- 19/19 P3 runtime tables present
- `tenant_id`, `case_id`, `source_trace`, `metadata` present on all 19 tables
- `tenant_id` / `case_id` typed as `uuid`
- Auth helpers present: `eve_current_tenant_id`, `eve_can_access_case`, `eve_current_case_ids`, `eve_current_auth_user_id`

### RLS (live local Postgres)

- RLS enabled + forced on all 19 runtime tables
- 3 tenant/case policies per table (select/insert/update) = 57 policies
- No `anon` grants on runtime tables
- No `anon` policies on runtime tables

### Service-role guard

- Static scan passed; no client exposure; no committed service_role keys

## Remote Read-Only Comparison

Inspection: MCP `list_tables` (read-only). No `apply_migration`, no `execute_sql`, no DDL.

| Finding | Detail |
|---|---|
| Remote tables matching P3 names | 18/19 present |
| Missing on remote | `parallel_export_payload` |
| Dominant drift | Most runtime tables lack `tenant_id`/`case_id`; where present, types are `text` not `uuid` |
| Remote modified | **No** |

## Command Results

| Command | Status |
|---|---|
| `npx tsc --noEmit` | passed |
| `npm run build` (`C:/eve/platform`) | passed |
| client-bff test | passed (39) |
| client-membrane test | passed (885) |
| `npx supabase start` | passed |
| `npx supabase db reset` | passed |
| `npx supabase db lint` | passed |
| schema validator (static) | passed |
| RLS validator (static) | passed |
| service-role scan | passed |

**Note:** `npm run build` from the long workspace path fails on Windows MAX_PATH (Turbopack). Build passes from canonical short path `C:/eve/platform` per prior activation convention.

## Boundary Ledger

- Production Supabase touched: **false**
- SQL executed against production: **false**
- Runtime real started: **false**
- BFF writes real records: **false**
- Gates real executed: **false**
- QA green real created: **false**
- Activation allowed: **false**
- Real client access enabled: **false**

## Readiness

| Gate | Status |
|---|---|
| P3-R environment binding passed | **true** |
| Ready for P4 Runtime 40/20 real behind Significado | **true** |
| Ready for production activation | **false** |

## Next Authorization

NEXT_AUTHORIZATION_REQUIRED: **true**

NEXT_TREE_POINT: **P4 — Runtime 40/20 real behind Significado, only after P3-R accepted**
