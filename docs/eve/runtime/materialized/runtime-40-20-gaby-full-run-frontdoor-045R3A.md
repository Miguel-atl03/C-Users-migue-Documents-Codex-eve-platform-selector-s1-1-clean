# runtime-40-20-gaby-full-run-frontdoor-045R3A

- instruction: 045-R3A
- date: 2026-08-10
- classification: blocked_gaby_full_run_creation
- staging consulted: yes, read-only
- production consulted: no
- remote writes: none

## Evidence
- Gaby finalize path exists and creates runtime sessions/runs
- The path does not prove FULL catalog selection because the session RPC does not set catalog_version_id
- No successful real Gaby FULL run roundtrip was executed in staging

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
