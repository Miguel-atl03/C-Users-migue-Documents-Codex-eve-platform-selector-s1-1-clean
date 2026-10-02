# POINT12 — Checklist de preparación para producción (cierre)

**Fecha:** 2026-07-18  
**Deploy remoto:** no ejecutado  
**Punto 13:** no iniciado  
**Build limpio:** `C:\eve-p12-clean` (sin `.env.local`)

## Compuertas obligatorias

| Compuerta | Resultado | Evidencia |
|-----------|-----------|-----------|
| Build limpio | PASS | `reports/production-readiness/point12/clean-build-result.json` |
| npm audit --omit=dev = 0 | PASS | `dependency-audit.json` |
| Altas/críticas totales = 0 | PASS | `npm audit` → 0 vulnerabilidades |
| Rutas locales en manifiesto = 0 | PASS | `production-manifest-scan.json` |
| Secretos en src panel / clean `.next` = 0 | PASS | `secret-scan-result.json` |
| RLS A/B | PASS | seed `abIsolation.pass=true` |
| Mutaciones authenticated | PASS | rechazadas en seed |
| Ledger/snapshots | PASS | verifiers `ok: true` |
| Playwright oficial | PASS | 3/3 operacional |
| Rollback/reaplicación | PASS | ensayo previo (5→0→5 políticas) |
| Amber No evaluable | PASS | Playwright Amber |
| §13 no iniciado | PASS | — |

## Correcciones de este cierre

1. **Dependencias:** next 16.2.5→16.2.10; overrides `ws@8.21.1`, `postcss@8.5.10`; `npm audit fix` limpia árbol completo.
2. **Rutas locales:** eliminados `local-session` y `local-ui-fixtures` de `src/app`; helper UI “Acceder como Consultor” eliminado; bootstrap sin fetch a API local; sesión local vía `tests/e2e/helpers` + `scripts/.../create-local-consultant-session.mjs`.
3. **Build limpio:** mirror en `C:\eve-p12-clean`, `npm ci` + `typecheck` + `next build --webpack` con placeholders públicos únicamente.

## Comandos de build limpio

```
robocopy <repo> C:\eve-p12-clean /E /XD node_modules .next reports ... /XF .env*
cd C:\eve-p12-clean
set NEXT_PUBLIC_SUPABASE_URL=https://example.invalid.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=<placeholder>
npm ci
npm run typecheck
npm run build
```

## Notas operativas Windows

- `next build` / `next dev` usan **webpack** (`package.json`) por MAX_PATH con Turbopack.
- Playwright E2E local: `npm run dev` (webpack) + `.env.local` solo en máquina de prueba, nunca en el directorio limpio de build.

## Dictamen

Ver `POINT12_PRODUCTION_GO_NO_GO_DICTAMEN.md`.
