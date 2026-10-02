# Sanitized log

## UI startup

Command:

```text
node .\node_modules\next\dist\bin\next dev --webpack
```

Observed local server:

```text
http://localhost:3000
```

No `.env`, secrets, DB, Supabase, migration, SQL, observer, real table, registry, export, diagnosis, Gate 2, Gate 3, or Fase 9 action was used.

## Route and base-state trace

Route:

```text
/dev/e2e-block0
```

Navigation trace used only to reach the accepted base state:

```text
route_loaded
reset_demo_clicked
demo_controlada_clicked
empezar_levantamiento_clicked
cargar_ejemplo_financiero_clicked
guardar_mapa_clicked
continuar_to_significado_clicked
```

Base state observed:

```text
Significado de tu trabajo
Actividad 1 de 8
0/4 secciones listas para revisar
Usuario Demo
Continuar a la siguiente actividad [disabled]
```

## Visible controls summary

```text
button: Reset demo [enabled]
button: Ver traza demo [enabled]
input: Que haces / Analizo [enabled]
input: Sobre que trabajas / desviaciones de headcount contra presupuesto por unidad de negocio [enabled]
input: Como o bajo que regla [enabled]
input: Que queda listo / alertas tempranas [enabled]
textarea: Escribe aqui [enabled]
input: Con que frecuencia ocurre [enabled]
input: En que situacion suele darse [enabled]
input: Sobre quien recae directamente [enabled]
button: Volver al mapa [enabled]
button: Continuar a la siguiente actividad [disabled]
```

## Console/log scan

```text
relevantLogs: []
visible_errors: []
loading_state: false
```

## Technical source trace

```text
src/app/dev/e2e-block0/page.tsx mounts SignificadoDeTuTrabajo with sessionId dev-e2e-block0 and sessionMode demo.
src/components/significado/SignificadoDeTuTrabajo.tsx maps B0 questions and updates visualDraft via setVisualDraft.
src/hooks/use-operational-description-intro-guide.ts fetches /api/coach/operational-description/intro-example for the left example.
src/hooks/use-operational-description-coach.ts can fetch /api/coach/operational-description after the operational description text reaches the coach threshold.
```

## Contract decision

```text
Primary action selected: edit_operational_description
Primary action label: Escribe aqui
Expected event: input/local state update
Expected state B: B0-Q02 populated; progress or guide changes without Supabase blocking
Contract ready: true
```
