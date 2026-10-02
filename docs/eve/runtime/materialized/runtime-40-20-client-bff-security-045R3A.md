# runtime-40-20-client-bff-security-045R3A

- instruction: 045-R3A
- date: 2026-08-10
- classification: blocked_client_bff_security
- staging consulted: yes, read-only
- production consulted: no
- remote writes: none

## Evidence
- client-bff routes import createAuthenticatedServerSupabaseClient directly instead of using the governed BFF boundary from 039/039-A

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
