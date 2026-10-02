# Sanitized log

## Regression

Command:

```text
node --test tests\regression\operational-description-intro-example.test.ts
```

Sanitized result:

```text
tests 6
pass 6
fail 0
cancelled 0
skipped 0
todo 0
```

Non-blocking warning observed:

```text
MODULE_TYPELESS_PACKAGE_JSON warning for TypeScript ESM parsing.
```

## Local app

Command:

```text
node .\node_modules\next\dist\bin\next dev --webpack
```

Sanitized readiness:

```text
Next.js 16.2.5 (webpack)
Local: http://localhost:3000
Ready
```

## Endpoint check

Request boundary:

```text
POST /api/coach/operational-description/intro-example
mode: demo
sessionId: dev-e2e-block0
```

Sanitized response:

```json
{
  "exampleSource": "deterministic",
  "source": "local_demo_synthetic",
  "mode": "local_ui_exercise",
  "usesSupabase": false,
  "usesProduction": false,
  "llmConfigured": false
}
```

Server evidence:

```text
POST /api/coach/operational-description/intro-example 200
```

## UI exercise

Route:

```text
/dev/e2e-block0
```

Sanitized user trace:

```text
loaded
reset_demo_clicked
demo_controlada_clicked
empezar_levantamiento_clicked
cargar_ejemplo_financiero_clicked
guardar_mapa_clicked
continuar_clicked
```

Expected state observed:

```text
Significado de tu trabajo
Actividad 1 de 8
```

Browser error scan:

```text
relevantLogs: []
introExampleBlocked: false
```

No secrets, env values, database records, Supabase data, migrations, SQL changes, observer creation, registry/export/diagnosis writes, Gate 2 closure, Gate 3 enablement, or Fase 9 start were used.
