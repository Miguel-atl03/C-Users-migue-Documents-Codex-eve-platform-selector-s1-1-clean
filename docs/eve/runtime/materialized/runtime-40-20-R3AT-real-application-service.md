# R3A-T Real Application Service

Instruction: 045-R3A-T
Date: 2026-08-10

Created the server-only real application service that reads the authenticated commercial run, loads the FULL Runtime catalog from public.runtime_*, renders through 044, and submits answers through ResponseIngest 044. It validates owner, case, role, activity, run, commercial execution mode, active FULL catalog and existing shown interaction instance.

## Evidence

- Focal test: passed.
- Typecheck: passed.
- Build: passed.
- Focused lint on R3A-T implementation files: passed.
- Global lint: blocked by inherited pre-existing lint debt outside R3A-T.
- Real authenticated Gaby staging roundtrip: not executed in this task because no live authenticated Gaby session token was available to Codex.

## Security

staging consulted: no
staging writes: none
production consulted: no
remote database writes: none
catalog activated: no
B0 modified: no
B1 modified: no
Gaby modified: no
commit created: no

## Classification

blocked_gaby_real_roundtrip