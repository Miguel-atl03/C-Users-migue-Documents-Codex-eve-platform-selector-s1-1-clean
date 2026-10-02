# runtime-40-20-gaby-run-catalog-authority-045R3A

- instruction: 045-R3A
- date: 2026-08-10
- classification: blocked_runtime_run_catalog_selection_authority
- staging consulted: yes, read-only
- production consulted: no
- remote writes: none

## Evidence
- src/app/api/participant/workmap/finalize/route.ts reads role_runtime_session.catalog_version_id and copies it into activity_runtime_run.catalog_version_id
- supabase/migrations/20260727103000_lock_runtime_session_creation_authority.sql creates role_runtime_session without assigning catalog_version_id
- staging information_schema shows role_runtime_session.catalog_version_id nullable with no default
- staging information_schema shows activity_runtime_run.catalog_version_id nullable with no default

## Security
- staging_consulted: yes, read-only
- staging_writes: none
- production_consulted: no
- remote_writes: none
- catalog_activated: no
- B0_modified: no
- B1_modified: no
- Gaby_modified: no
- commit_created: no
