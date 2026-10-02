# P4 Vercel Configuration

Project: `eve-pr3-pilot` (`prj_DIW8ARfHp0jGLFWAqjM96gXwlSjF`).
Owner: `miguelatalav-9585`; organization: `team_vIXDaESfRrxfIN94peNcpgTd`.
Framework: Next.js 16.2.11; repository root is the application root.
Preview branch: `pr3-pilot`. Production must not be promoted before successful P4 smoke.

The project exists and the CLI session is authenticated. Git integration was not
established because Vercel requires a GitHub Login Connection. No deployment exists.

## Requested Environment Bindings

| Variable | Preview / Production value |
| --- | --- |
| EVE_PR3_PERSISTENCE_MODE | postgres |
| EVE_PR3_EXPECTED_PROJECT_REF | keqrkyumfyhfivllvdbl |
| EVE_PR3_PILOT_AUTH_MODE | supabase_user |
| EVE_PR3_RUNTIME_ADAPTER | blocked |
| EVE_PR3_PILOT_SCOPE_REF | CASE-P4-QA (infrastructure smoke only) |
| EVE_PR3_PILOT_ACTIVITY_REF | ACT-P4-QA (infrastructure smoke only) |
| NEXT_PUBLIC_EVE_PR3_SUPABASE_URL | https://keqrkyumfyhfivllvdbl.supabase.co |
| NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY | clean PR3 modern public key |
| NEXT_PUBLIC_EVE_PR3_PILOT_ENABLED | false; enable Preview only after secret/build gate |
| EVE_PR3_ACTION_TOKEN_SECRET | newly generated, server-only, sensitive storage |
| EVE_PR3_DATABASE_URL | clean PR3 PostgreSQL connection, server-only, sensitive storage |

Automatic approval review rejected submission of the publishable key and generated
action-token secret to Preview and Production without explicit payload/environment
approval. No variables from that rejected command were submitted. The reproducible
configuration script is `scripts/pr3/configure-vercel-env.mjs`; its generated secret
is passed through stdin and never logged or committed. The DB URL must be configured
directly in Vercel, not pasted into a chat or checked into Git.

The clean database DSN accepts a direct `db.<PR3-ref>.supabase.co` host or a Supabase
pooler host with a username ending in the exact PR3 project ref. The expected ref is
pinned independently. A substring in a password, path or query cannot pass the guard.

`A08`, `A09`, `P3`, `A10`, and real-user E2E remain outside this execution.
