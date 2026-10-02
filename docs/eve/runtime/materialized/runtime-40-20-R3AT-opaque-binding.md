# R3A-T Opaque Binding

Instruction: 045-R3A-T
Date: 2026-08-10

The client sends only opaque slot_ref/value pairs derived from server-provided subfields. Semantic resolution stays server-side through source-capture binding and ResponseIngest 044; the client does not send source nodes, canonical variables, branching directives or semantic mappings.

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