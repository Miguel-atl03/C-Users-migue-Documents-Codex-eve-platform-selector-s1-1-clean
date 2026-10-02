# Sanitized UI Log

## Server

```text
Next.js 16.2.5 (webpack)
Local: http://localhost:3000
Ready in 397ms
Compiling /dev/e2e-block0 ...
GET /dev/e2e-block0 200 in 6.7s
POST /api/coach/operational-description/intro-example 500
Error: Supabase environment variables are missing.
```

## Initial blocked attempt

```text
Next.js 16.2.5 (Turbopack)
FATAL: unexpected Turbopack error.
Reason: path length for file under .next/dev/server/chunks/ssr exceeded max length of filesystem.
```

## Browser console

```text
[HMR] connected
[Fast Refresh] rebuilding
[Fast Refresh] done in 1711ms
```

No secrets, tokens, connection strings, production data, DB payloads, or Supabase responses were exposed in the observed logs.

The Supabase-related error was a failed environment guard before any real Supabase connection. No production access was observed.
