# R3A-T Client BFF Security

Instruction: 045-R3A-T
Date: 2026-08-10

The interaction and answer routes require bearer authentication, validate scope through the existing client-bff service, avoid client semantic payloads, and return client-safe failure messages without internal error detail.

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